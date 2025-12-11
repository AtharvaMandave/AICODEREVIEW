'use client';

import React from 'react';
import { X, FileText, Sparkles, Wrench } from 'lucide-react';

export default function IssueModal({ issue, onClose }) {
    if (!issue) return null;

    const severityStyles = {
        high: 'bg-red-50 text-red-700 border-red-200',
        medium: 'bg-amber-50 text-amber-700 border-amber-200',
        low: 'bg-blue-50 text-blue-700 border-blue-200',
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${severityStyles[issue.severity] || severityStyles.low}`}>
                            {issue.severity}
                        </span>
                        <h2 className="text-lg font-semibold text-slate-900">{issue.title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 overflow-y-auto max-h-[calc(85vh-140px)]">
                    {/* Location */}
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-5 font-mono bg-slate-100 p-3 rounded-lg border border-slate-200">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span>{issue.filePath}</span>
                        {issue.lineNumber && (
                            <>
                                <span className="text-slate-300">|</span>
                                <span>Line {issue.lineNumber.start}</span>
                            </>
                        )}
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</h3>
                        <p className="text-slate-700 leading-relaxed">{issue.description}</p>
                    </div>

                    {/* Code Snippet */}
                    {issue.codeSnippet && (
                        <div className="mb-6">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Problematic Code</h3>
                            <div className="bg-slate-900 p-4 rounded-lg overflow-x-auto border border-slate-700 font-mono text-sm">
                                <pre className="text-slate-300">
                                    <code>{issue.codeSnippet}</code>
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* AI Suggestion */}
                    {issue.suggestion && (
                        <div className="mb-6">
                            <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" /> AI Suggestion
                            </h3>
                            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                                <p className="text-slate-700 leading-relaxed">{issue.suggestion}</p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-5 border-t border-slate-200">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                            Close
                        </button>
                        <button
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg opacity-50 cursor-not-allowed inline-flex items-center gap-2"
                            title="Auto-fix coming soon"
                            disabled
                        >
                            <Wrench className="w-4 h-4" />
                            Fix Issue
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
