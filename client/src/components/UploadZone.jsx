'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
    FileText,
    Package,
    Github,
    Loader2,
    Upload,
    AlertCircle,
    Terminal
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function UploadZone({ onUploadSuccess, isUploading, setIsUploading }) {
    const [uploadMode, setUploadMode] = useState('file');
    const [githubUrl, setGithubUrl] = useState('');
    const [projectName, setProjectName] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');
    const { getAuthHeaders } = useAuth();

    const onDrop = useCallback(async (acceptedFiles) => {
        if (acceptedFiles.length === 0) return;

        const file = acceptedFiles[0];
        setIsUploading(true);
        setError('');
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('file', file);
            if (projectName) formData.append('name', projectName);

            const endpoint = uploadMode === 'zip' ? '/upload/zip' : '/upload/file';

            const response = await axios.post(`${API_URL}${endpoint}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    ...getAuthHeaders()
                },
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(progress);
                }
            });

            if (response.data.success) {
                onUploadSuccess(response.data.project.id);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Upload failed. Please try again.');
            setIsUploading(false);
        }
    }, [uploadMode, projectName, setIsUploading, onUploadSuccess, getAuthHeaders]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: uploadMode === 'zip'
            ? { 'application/zip': ['.zip'] }
            : {
                'text/javascript': ['.js', '.jsx'],
                'text/typescript': ['.ts', '.tsx'],
                'text/x-python': ['.py'],
                'text/x-java-source': ['.java']
            },
        maxFiles: 1,
        disabled: isUploading
    });

    const handleGithubUpload = async () => {
        if (!githubUrl) {
            setError('Please enter a GitHub URL');
            return;
        }

        setIsUploading(true);
        setError('');
        setUploadProgress(50);

        try {
            const response = await axios.post(`${API_URL}/upload/github`, {
                githubUrl,
                name: projectName
            }, {
                headers: getAuthHeaders()
            });

            setUploadProgress(100);

            if (response.data.success) {
                onUploadSuccess(response.data.project.id);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'GitHub clone failed. Please try again.');
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const tabs = [
        { id: 'file', label: 'File', icon: FileText },
        { id: 'zip', label: 'ZIP', icon: Package },
        { id: 'github', label: 'GitHub', icon: Github },
    ];

    return (
        <div className="w-full max-w-xl mx-auto">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
                {/* Tab Selector */}
                <div className="flex p-1 bg-slate-100 rounded-lg mb-6">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setUploadMode(tab.id)}
                            disabled={isUploading}
                            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${uploadMode === tab.id
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Project Name Input */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Project Name <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="My Awesome Project"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        disabled={isUploading}
                    />
                </div>

                {/* Upload Area */}
                <div className="min-h-[200px]">
                    {uploadMode === 'github' ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Repository URL
                                </label>
                                <div className="relative">
                                    <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="url"
                                        value={githubUrl}
                                        onChange={(e) => setGithubUrl(e.target.value)}
                                        placeholder="https://github.com/user/repo"
                                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        disabled={isUploading}
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleGithubUpload}
                                disabled={isUploading || !githubUrl}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Cloning...
                                    </>
                                ) : (
                                    <>
                                        <Terminal className="w-4 h-4" />
                                        Analyze Repository
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${isDragActive
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                                } ${isUploading ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                            <input {...getInputProps()} />

                            {isUploading ? (
                                <div className="space-y-4 w-full max-w-xs">
                                    <Loader2 className="w-10 h-10 text-blue-600 mx-auto animate-spin" />
                                    <div>
                                        <p className="font-medium text-slate-900">Analyzing...</p>
                                        <p className="text-sm text-slate-500">This may take a moment</p>
                                    </div>
                                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-600 transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto">
                                        <Upload className="w-6 h-6 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">
                                            {isDragActive ? 'Drop file here' : 'Drop file or click to upload'}
                                        </p>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {uploadMode === 'zip' ? 'ZIP archive up to 50MB' : 'JS, TS, Python, Java files'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-red-700">Upload Failed</p>
                            <p className="text-sm text-red-600 mt-0.5">{error}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
