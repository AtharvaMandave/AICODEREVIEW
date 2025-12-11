'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
    Loader2,
    ArrowLeft,
    FolderOpen,
    FileText,
    Calendar,
    Trash2,
    File,
    Plus,
    Code2,
    ExternalLink,
    User,
    LogOut
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ProjectsPage() {
    const router = useRouter();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const { user, isAuthenticated, logout, getAuthHeaders } = useAuth();

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await axios.get(`${API_URL}/projects`, {
                headers: getAuthHeaders()
            });
            setProjects(response.data.projects || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching projects:', error);
            setLoading(false);
        }
    };

    const deleteProject = async (projectId) => {
        if (!confirm('Are you sure you want to delete this project?')) return;

        try {
            await axios.delete(`${API_URL}/projects/${projectId}`, {
                headers: getAuthHeaders()
            });
            setProjects(projects.filter(p => p._id !== projectId));
        } catch (error) {
            console.error('Error deleting project:', error);
            alert('Failed to delete project');
        }
    };

    const filteredProjects = filter === 'all'
        ? projects
        : projects.filter(p => p.status === filter);

    const filterTabs = [
        { id: 'all', label: 'All', count: projects.length },
        { id: 'completed', label: 'Completed', count: projects.filter(p => p.status === 'completed').length },
        { id: 'analyzing', label: 'Analyzing', count: projects.filter(p => p.status === 'analyzing').length },
        { id: 'failed', label: 'Failed', count: projects.filter(p => p.status === 'failed').length },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-slate-600">Loading projects...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div
                        className="flex items-center gap-2.5 cursor-pointer"
                        onClick={() => router.push('/')}
                    >
                        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
                            <Code2 className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg font-semibold text-slate-900">
                            CodeAnalyzer
                        </span>
                    </div>

                    <button
                        onClick={() => router.push('/')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        New Project
                    </button>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push('/')}
                        className="text-slate-500 hover:text-slate-700 mb-4 flex items-center gap-2 text-sm transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </button>

                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                        Your Projects
                    </h1>
                    <p className="text-slate-600">
                        View and manage your analyzed projects
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {filterTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === tab.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                }`}
                        >
                            {tab.label} ({tab.count})
                        </button>
                    ))}
                </div>

                {/* Projects Grid */}
                {filteredProjects.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                        <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            No projects found
                        </h3>
                        <p className="text-slate-500 mb-6">
                            {filter === 'all'
                                ? 'Upload your first project to get started'
                                : `No ${filter} projects`
                            }
                        </p>
                        {filter === 'all' && (
                            <button
                                onClick={() => router.push('/')}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Upload Project
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredProjects.map((project) => (
                            <ProjectCard
                                key={project._id}
                                project={project}
                                onView={() => router.push(`/project/${project._id}`)}
                                onDelete={() => deleteProject(project._id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function ProjectCard({ project, onView, onDelete }) {
    const getStatusBadge = (status) => {
        const styles = {
            completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            analyzing: 'bg-amber-50 text-amber-700 border-amber-200',
            failed: 'bg-red-50 text-red-700 border-red-200',
        };
        return styles[status] || 'bg-slate-50 text-slate-700 border-slate-200';
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all group">
            <div onClick={onView} className="cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-1">
                            {project.name}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(project.status)}`}>
                            {project.status}
                        </span>
                    </div>
                </div>

                <div className="space-y-1.5 text-sm text-slate-500 mb-4">
                    <div className="flex items-center gap-2">
                        <File className="w-3.5 h-3.5" />
                        <span>{project.fileCount || 0} files</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5" />
                        <span>{(project.totalLines || 0).toLocaleString()} lines</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(project.createdAt)}</span>
                    </div>
                </div>

                {project.status === 'analyzing' && (
                    <div className="mb-4">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-slate-500">Progress</span>
                            <span className="text-blue-600">{project.analysisProgress || 0}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-600 transition-all duration-300"
                                style={{ width: `${project.analysisProgress || 0}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex gap-2 pt-4 border-t border-slate-200">
                <button
                    onClick={onView}
                    className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors inline-flex items-center justify-center gap-2"
                >
                    <ExternalLink className="w-4 h-4" />
                    View
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-lg transition-colors inline-flex items-center justify-center"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
