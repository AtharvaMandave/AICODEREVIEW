'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import FileExplorer from '../../../components/FileExplorer';
import ArchitectureView from '../../../components/ArchitectureView';
import IssueModal from '../../../components/IssueModal';
import ChatPanel, { ChatButton } from '../../../components/ChatPanel';
import { MessageCircle } from 'lucide-react';
import {
    Loader2,
    XCircle,
    ArrowLeft,
    Bot,
    Download,
    Target,
    Shield,
    Wrench,
    Layout,
    X,
    RefreshCw,
    AlertTriangle,
    Sparkles,
    FileCode,
    CheckCircle2,
    AlertCircle,
    Code2,
    ExternalLink,
    Webhook,
    Copy
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ProjectPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id;

    const [project, setProject] = useState(null);
    const [issues, setIssues] = useState([]);
    const [scores, setScores] = useState(null);
    const [architecture, setArchitecture] = useState(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [selectedSeverity, setSelectedSeverity] = useState('all');
    const [selectedFile, setSelectedFile] = useState(null);
    const [activeTab, setActiveTab] = useState('issues');
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [files, setFiles] = useState([]);
    const [aiDetectionResult, setAiDetectionResult] = useState(null);
    const [detectingAI, setDetectingAI] = useState(false);
    const [projectAIResult, setProjectAIResult] = useState(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [detectingProjectAI, setDetectingProjectAI] = useState(false);
    const [showWebhookModal, setShowWebhookModal] = useState(false);

    useEffect(() => {
        if (projectId) {
            fetchProject();
        }
    }, [projectId]);

    const fetchProject = async () => {
        try {
            const response = await axios.get(`${API_URL}/projects/${projectId}`);
            setProject(response.data.project);

            if (response.data.project.status === 'completed') {
                fetchIssues();
                fetchScores();
                fetchAnalysis();
                fetchFiles();
            } else if (response.data.project.status === 'uploaded' || response.data.project.status === 'analyzing') {
                if (response.data.project.status === 'uploaded') {
                    triggerAnalysis();
                } else {
                    pollForCompletion();
                }
                fetchFiles();
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching project:', error);
            setLoading(false);
        }
    };

    const fetchFiles = async () => {
        try {
            const response = await axios.get(`${API_URL}/projects/${projectId}/files`);
            setFiles(response.data.files || []);
        } catch (error) {
            console.error('Error fetching files:', error);
        }
    };

    const fetchAnalysis = async () => {
        try {
            const response = await axios.get(`${API_URL}/projects/${projectId}/architecture`);
            setArchitecture(response.data.architecture);
        } catch (error) {
            console.log('Architecture data not available yet');
        }
    };

    const pollForCompletion = () => {
        setAnalyzing(true);
        const interval = setInterval(async () => {
            try {
                const response = await axios.get(`${API_URL}/projects/${projectId}`);
                setProject(response.data.project);

                if (response.data.project.status === 'completed') {
                    clearInterval(interval);
                    setAnalyzing(false);
                    fetchIssues();
                    fetchScores();
                    fetchAnalysis();
                    fetchFiles();
                } else if (response.data.project.status === 'failed') {
                    clearInterval(interval);
                    setAnalyzing(false);
                }
            } catch (error) {
                console.error('Error polling project status:', error);
                clearInterval(interval);
                setAnalyzing(false);
            }
        }, 2000);
    };

    const triggerAnalysis = async () => {
        setAnalyzing(true);
        try {
            await axios.post(`${API_URL}/analyze/${projectId}`);
            const interval = setInterval(async () => {
                const response = await axios.get(`${API_URL}/projects/${projectId}`);
                setProject(response.data.project);

                if (response.data.project.status === 'completed') {
                    clearInterval(interval);
                    setAnalyzing(false);
                    fetchIssues();
                    fetchScores();
                    fetchAnalysis();
                    fetchFiles();
                } else if (response.data.project.status === 'failed') {
                    clearInterval(interval);
                    setAnalyzing(false);
                }
            }, 2000);
        } catch (error) {
            console.error('Error triggering analysis:', error);
            setAnalyzing(false);
        }
    };

    const fetchIssues = async () => {
        try {
            const response = await axios.get(`${API_URL}/projects/${projectId}/issues`);
            setIssues(response.data.issues || []);
        } catch (error) {
            console.error('Error fetching issues:', error);
        }
    };

    const fetchScores = async () => {
        try {
            const response = await axios.get(`${API_URL}/projects/${projectId}/scores`);
            setScores(response.data.scores);
        } catch (error) {
            console.error('Error fetching scores:', error);
        }
    };

    const getLanguageFromExtension = (ext) => {
        const map = {
            '.js': 'JavaScript', '.jsx': 'JavaScript', '.ts': 'TypeScript', '.tsx': 'TypeScript',
            '.py': 'Python', '.java': 'Java', '.go': 'Go', '.rs': 'Rust'
        };
        return map[ext] || 'Unknown';
    };

    const handleDetectAI = async () => {
        if (!selectedFile) return;
        const file = files.find(f => f.path === selectedFile);
        if (!file) return;

        setDetectingAI(true);
        setAiDetectionResult(null);

        try {
            const response = await axios.post(`${API_URL}/analyze/detect-ai`, {
                code: file.content,
                language: getLanguageFromExtension(file.extension)
            });
            setAiDetectionResult(response.data);
        } catch (error) {
            console.error('Error detecting AI:', error);
            alert('Failed to detect AI probability');
        } finally {
            setDetectingAI(false);
        }
    };

    const handleDetectProjectAI = async () => {
        setDetectingProjectAI(true);
        setProjectAIResult(null);

        try {
            const response = await axios.post(`${API_URL}/analyze/detect-project-ai/${projectId}`);
            setProjectAIResult(response.data);
        } catch (error) {
            console.error('Error detecting project AI:', error);
            alert('Failed to detect project AI probability');
        } finally {
            setDetectingProjectAI(false);
        }
    };

    const downloadPDF = async () => {
        try {
            const response = await axios.get(`${API_URL}/export/${projectId}/pdf`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `code-audit-report-${project.name}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading PDF:', error);
            alert('Failed to download PDF report');
        }
    };

    const filteredIssues = selectedSeverity === 'all' ? issues : issues.filter(issue => issue.severity === selectedSeverity);
    const fileIssues = selectedFile ? filteredIssues.filter(issue => issue.filePath === selectedFile) : filteredIssues;
    const issueStats = {
        high: issues.filter(i => i.severity === 'high').length,
        medium: issues.filter(i => i.severity === 'medium').length,
        low: issues.filter(i => i.severity === 'low').length,
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-slate-600">Loading project...</p>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">Project not found</h2>
                    <p className="text-slate-500 mb-6">The project you're looking for doesn't exist</p>
                    <button onClick={() => router.push('/')} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/')} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-sm">Back</span>
                        </button>
                        <div className="h-6 w-px bg-slate-200" />
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                                <Code2 className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h1 className="font-semibold text-slate-900">{project.name}</h1>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span>{project.fileCount} files</span>
                                    <span>•</span>
                                    <StatusBadge status={project.status} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {project.status === 'completed' && (
                            <>
                                <button onClick={triggerAnalysis} disabled={analyzing} className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors inline-flex items-center gap-2 disabled:opacity-50">
                                    {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                    Re-analyze
                                </button>
                                <button onClick={handleDetectProjectAI} disabled={detectingProjectAI} className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors inline-flex items-center gap-2 disabled:opacity-50">
                                    {detectingProjectAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                                    AI Check
                                </button>
                                {project.sourceType === 'github' && (
                                    <button onClick={() => setShowWebhookModal(true)} className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors inline-flex items-center gap-2">
                                        <Webhook className="w-4 h-4" />
                                        Webhook
                                    </button>
                                )}
                                <button onClick={downloadPDF} className="px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors inline-flex items-center gap-2">
                                    <Download className="w-4 h-4" />
                                    Export PDF
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Error Banner */}
            {project.status === 'failed' && project.error && (
                <div className="bg-red-50 border-b border-red-200">
                    <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3 text-red-700">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">Analysis Failed:</span>
                        <span className="text-red-600">{project.error}</span>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="flex gap-6 h-[calc(100vh-140px)]">
                    {/* Sidebar */}
                    <aside className="w-64 flex-shrink-0 bg-white border border-slate-200 rounded-xl p-4 flex flex-col overflow-hidden">
                        <div className="mb-4">
                            <h2 className="text-sm font-semibold text-slate-900">File Explorer</h2>
                            <p className="text-xs text-slate-500">Browse project files</p>
                        </div>
                        <FileExplorer files={files} onSelect={setSelectedFile} selectedFile={selectedFile} issues={issues} />
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 flex flex-col overflow-hidden">
                        {/* Scores */}
                        {scores && (
                            <div className="grid grid-cols-4 gap-4 mb-6 flex-shrink-0">
                                <ScoreCard title="Overall" score={scores.overallScore} icon={<Target className="w-5 h-5" />} />
                                <ScoreCard title="Security" score={scores.securityScore} icon={<Shield className="w-5 h-5" />} />
                                <ScoreCard title="Maintainability" score={scores.maintainabilityScore} icon={<Wrench className="w-5 h-5" />} />
                                <ScoreCard title="Architecture" score={scores.architectureScore} icon={<Layout className="w-5 h-5" />} />
                            </div>
                        )}

                        {/* Issue Stats */}
                        {issues.length > 0 && (
                            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex-shrink-0">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-red-500" />
                                            <span className="text-sm text-slate-500">High:</span>
                                            <span className="font-semibold text-red-600">{issueStats.high}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                                            <span className="text-sm text-slate-500">Medium:</span>
                                            <span className="font-semibold text-amber-600">{issueStats.medium}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            <span className="text-sm text-slate-500">Low:</span>
                                            <span className="font-semibold text-blue-600">{issueStats.low}</span>
                                        </div>
                                    </div>
                                    <div className="text-sm text-slate-500">
                                        Total: <span className="font-semibold text-slate-900">{issues.length}</span> issues
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Project AI Result */}
                        {projectAIResult && (
                            <div className="bg-white border border-blue-200 rounded-xl p-5 mb-6 flex-shrink-0">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                        <Bot className="w-5 h-5 text-blue-600" />
                                        AI Analysis Report
                                        <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded">{projectAIResult.files_analyzed} files</span>
                                    </h3>
                                    <button onClick={() => setProjectAIResult(null)} className="text-slate-400 hover:text-slate-600 p-1">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                                        <div className="text-3xl font-bold text-blue-600 mb-1">{Math.round(projectAIResult.ai_probability * 100)}%</div>
                                        <div className="text-xs text-slate-500">AI Probability</div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <div className="text-xs text-slate-500 mb-1">Likely Source</div>
                                        <div className="text-lg font-semibold text-slate-900 capitalize">{projectAIResult.likely_source}</div>
                                        <div className="flex items-center gap-1 text-xs text-emerald-600 mt-1">
                                            <CheckCircle2 className="w-3 h-3" />
                                            {Math.round(projectAIResult.analysis_confidence * 100)}% Confidence
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-lg">
                                        <div className="text-xs text-slate-500 mb-2">Key Indicators</div>
                                        <div className="flex flex-wrap gap-1">
                                            {projectAIResult.reasons.slice(0, 3).map((reason, idx) => (
                                                <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">{reason}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tabs */}
                        <div className="flex gap-1 mb-4 flex-shrink-0 bg-slate-100 p-1 rounded-lg">
                            <button onClick={() => setActiveTab('issues')} className={`flex-1 py-2.5 px-4 font-medium text-sm rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'issues' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                <AlertCircle className="w-4 h-4" />
                                Issues & Code
                            </button>
                            <button onClick={() => setActiveTab('architecture')} className={`flex-1 py-2.5 px-4 font-medium text-sm rounded-md transition-all flex items-center justify-center gap-2 ${activeTab === 'architecture' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                <Layout className="w-4 h-4" />
                                Architecture
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto pr-2">
                            {analyzing ? (
                                <div className="text-center py-16">
                                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Analyzing Your Code</h3>
                                    <p className="text-slate-500">Please wait while we scan your project...</p>
                                    <p className="text-sm text-slate-500 mt-2">{project.analysisProgress}% complete</p>
                                </div>
                            ) : activeTab === 'issues' ? (
                                <div className="space-y-4">
                                    {selectedFile && (
                                        <div className="bg-white border border-slate-200 rounded-xl p-4 border-l-4 border-l-blue-500">
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <h3 className="font-medium text-slate-900 flex items-center gap-2">
                                                        <FileCode className="w-4 h-4 text-blue-600" />
                                                        {selectedFile}
                                                    </h3>
                                                    <p className="text-xs text-slate-500">Selected file analysis</p>
                                                </div>
                                                <button onClick={handleDetectAI} disabled={detectingAI} className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors inline-flex items-center gap-2 disabled:opacity-50">
                                                    {detectingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                                    Detect AI
                                                </button>
                                            </div>

                                            {aiDetectionResult && (
                                                <div className="mt-3 p-4 bg-slate-50 rounded-lg">
                                                    <div className="grid grid-cols-3 gap-4 mb-3">
                                                        <div className="text-center">
                                                            <div className="text-2xl font-bold text-blue-600">{Math.round(aiDetectionResult.ai_probability * 100)}%</div>
                                                            <div className="text-xs text-slate-500">AI Probability</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-slate-500 mb-1">Source</div>
                                                            <div className="font-medium text-slate-900 capitalize">{aiDetectionResult.likely_source}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xs text-slate-500 mb-1">Confidence</div>
                                                            <div className="font-medium text-emerald-600">{Math.round(aiDetectionResult.analysis_confidence * 100)}%</div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-slate-500 mb-2">Reasons:</div>
                                                        <ul className="space-y-1">
                                                            {aiDetectionResult.reasons.map((reason, idx) => (
                                                                <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                                                    {reason}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Filters */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm text-slate-500">Filter:</span>
                                        {['all', 'high', 'medium', 'low'].map(severity => (
                                            <button key={severity} onClick={() => setSelectedSeverity(severity)} className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${selectedSeverity === severity ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
                                                {severity}
                                            </button>
                                        ))}
                                        {selectedFile && (
                                            <button onClick={() => setSelectedFile(null)} className="ml-auto px-3 py-1.5 rounded-md text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100">
                                                Clear File Filter
                                            </button>
                                        )}
                                    </div>

                                    {/* Issues List */}
                                    {fileIssues.length === 0 ? (
                                        <div className="text-center py-12">
                                            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                                            <h3 className="font-medium text-slate-900 mb-1">No issues found</h3>
                                            <p className="text-sm text-slate-500">Your code looks clean!</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {fileIssues.map((issue, index) => (
                                                <div key={index} onClick={() => setSelectedIssue(issue)} className="cursor-pointer">
                                                    <IssueCard issue={issue} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <ArchitectureView architecture={architecture} files={files} />
                            )}
                        </div>
                    </main>
                </div>
            </div>

            {selectedIssue && <IssueModal issue={selectedIssue} onClose={() => setSelectedIssue(null)} />}

            {/* Webhook Modal */}
            {showWebhookModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Webhook className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900">GitHub Webhook</h2>
                                    <p className="text-sm text-slate-500">Automate analysis on push</p>
                                </div>
                            </div>
                            <button onClick={() => setShowWebhookModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <p className="text-sm text-slate-600">
                                Add this webhook URL to your GitHub repository settings to automatically trigger analysis when you push code.
                            </p>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1.5">Payload URL</label>
                                <div className="flex gap-2">
                                    <code className="flex-1 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-800 break-all">
                                        {`${API_URL}/webhooks/github`}
                                    </code>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${API_URL}/webhooks/github`);
                                        }}
                                        className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg transition-colors"
                                        title="Copy to clipboard"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1.5">Content type</label>
                                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800">
                                    application/json
                                </div>
                            </div>

                            <div className="bg-blue-50 text-blue-700 text-sm p-4 rounded-lg flex gap-3">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p>
                                    Ensure your repository URL matches the one you used to import this project.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button onClick={() => setShowWebhookModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Panel */}
            {project.status === 'completed' && (
                <>
                    {!isChatOpen && (
                        <ChatButton onClick={() => setIsChatOpen(true)} />
                    )}
                    <ChatPanel
                        projectId={projectId}
                        isOpen={isChatOpen}
                        onClose={() => setIsChatOpen(false)}
                    />
                </>
            )}
        </div>
    );
}

function StatusBadge({ status }) {
    const styles = {
        completed: 'bg-emerald-50 text-emerald-700',
        analyzing: 'bg-amber-50 text-amber-700',
        failed: 'bg-red-50 text-red-700',
        uploaded: 'bg-slate-100 text-slate-700',
    };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.uploaded}`}>
            {status === 'analyzing' && <Loader2 className="w-3 h-3 animate-spin" />}
            {status}
        </span>
    );
}

function ScoreCard({ title, score, icon }) {
    const getScoreColor = (score) => {
        if (score >= 80) return 'text-emerald-600';
        if (score >= 60) return 'text-amber-600';
        return 'text-red-600';
    };

    const getScoreBg = (score) => {
        if (score >= 80) return 'bg-emerald-500';
        if (score >= 60) return 'bg-amber-500';
        return 'bg-red-500';
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">{icon}</div>
                <div className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</div>
            </div>
            <div className="text-sm text-slate-500 font-medium">{title}</div>
            <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-500 ${getScoreBg(score)}`} style={{ width: `${score}%` }} />
            </div>
        </div>
    );
}

function IssueCard({ issue }) {
    const severityStyles = {
        high: { border: 'border-l-red-500', badge: 'bg-red-50 text-red-700' },
        medium: { border: 'border-l-amber-500', badge: 'bg-amber-50 text-amber-700' },
        low: { border: 'border-l-blue-500', badge: 'bg-blue-50 text-blue-700' },
    };
    const style = severityStyles[issue.severity] || severityStyles.low;

    return (
        <div className={`bg-white border border-slate-200 rounded-xl p-4 border-l-4 ${style.border} hover:shadow-md transition-all group`}>
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${style.badge}`}>{issue.severity}</span>
                    <span className="text-xs text-slate-500 font-mono">{issue.filePath}</span>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <h3 className="font-medium text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{issue.title}</h3>
            <p className="text-sm text-slate-500 line-clamp-2">{issue.description}</p>
        </div>
    );
}
