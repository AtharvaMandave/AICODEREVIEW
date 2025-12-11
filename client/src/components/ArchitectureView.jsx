'use client';

import React, { useState } from 'react';
import MermaidDiagram from './MermaidDiagram';
import InteractiveArchitectureMap from './InteractiveArchitectureMap';
import {
    Layout,
    AlertTriangle,
    Lightbulb,
    RefreshCw,
    CheckCircle2,
    GitBranch,
    Network,
    Map
} from 'lucide-react';

export default function ArchitectureView({ architecture, files = [] }) {
    const [viewMode, setViewMode] = useState('interactive'); // 'interactive' | 'diagram'

    if (!architecture) {
        return (
            <div className="text-center py-12 flex flex-col items-center">
                <Layout className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-slate-500">No architecture analysis available.</p>
            </div>
        );
    }

    const getQualityStyle = (quality) => {
        switch (quality) {
            case 'excellent': return { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
            case 'good': return { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' };
            case 'needs-improvement': return { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' };
            case 'poor': return { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };
            default: return { text: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' };
        }
    };

    const qualityStyle = getQualityStyle(architecture.quality);

    return (
        <div className="space-y-6">
            {/* Header Insights */}
            <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <h3 className="text-sm font-medium text-slate-500 mb-2">Architectural Pattern</h3>
                    <div className="text-xl font-semibold text-slate-900 capitalize flex items-center gap-2">
                        <GitBranch className="w-5 h-5 text-blue-500" />
                        {architecture.pattern || 'Unknown'}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        Detected based on file structure and dependencies
                    </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <h3 className="text-sm font-medium text-slate-500 mb-2">Structure Quality</h3>
                    <div className={`text-xl font-semibold capitalize px-3 py-1 rounded-md inline-block ${qualityStyle.text} ${qualityStyle.bg} ${qualityStyle.border} border`}>
                        {architecture.quality?.replace('-', ' ') || 'Unknown'}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        Overall code organization assessment
                    </p>
                </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Architecture Visualization</h3>
                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('interactive')}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-all ${viewMode === 'interactive'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <Network className="w-4 h-4" />
                        Interactive
                    </button>
                    <button
                        onClick={() => setViewMode('diagram')}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-all ${viewMode === 'diagram'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <Map className="w-4 h-4" />
                        Diagram
                    </button>
                </div>
            </div>

            {/* Architecture Visualization */}
            {viewMode === 'interactive' ? (
                <InteractiveArchitectureMap
                    architecture={architecture}
                    files={files}
                />
            ) : (
                architecture.dependencyGraph && (
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                        <MermaidDiagram chart={architecture.dependencyGraph} />
                    </div>
                )
            )}

            {/* Analysis Details */}
            <div className="grid md:grid-cols-2 gap-4">
                {/* Issues */}
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <h3 className="text-sm font-medium text-red-600 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Architectural Issues
                    </h3>
                    {architecture.issues && architecture.issues.length > 0 ? (
                        <ul className="space-y-2">
                            {architecture.issues.map((issue, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                                    {issue}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex items-center gap-2 text-sm text-emerald-600">
                            <CheckCircle2 className="w-4 h-4" />
                            No major issues detected
                        </div>
                    )}
                </div>

                {/* Suggestions */}
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <h3 className="text-sm font-medium text-blue-600 mb-4 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Improvement Suggestions
                    </h3>
                    {architecture.suggestions && architecture.suggestions.length > 0 ? (
                        <ul className="space-y-2">
                            {architecture.suggestions.map((suggestion, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                                    {suggestion}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-slate-500">No suggestions available.</p>
                    )}
                </div>
            </div>

            {/* Circular Dependencies */}
            {architecture.circularDependencies && architecture.circularDependencies.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                    <h3 className="text-sm font-medium text-red-700 mb-4 flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Circular Dependencies Detected
                    </h3>
                    <div className="space-y-3">
                        {architecture.circularDependencies.map((cycle, index) => (
                            <div key={index} className="bg-white p-3 rounded-lg border border-red-100">
                                <div className="text-sm text-slate-700 mb-2">{cycle.description}</div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {cycle.files.map((file, i) => (
                                        <React.Fragment key={i}>
                                            <span className="px-2 py-1 bg-slate-100 rounded text-xs font-mono text-slate-600">
                                                {file}
                                            </span>
                                            {i < cycle.files.length - 1 && (
                                                <span className="text-slate-400">→</span>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
