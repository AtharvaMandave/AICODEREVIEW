'use client';

import React, { useState, useEffect } from 'react';
import {
    Folder,
    FolderOpen,
    FileCode,
    FileJson,
    FileText,
    File,
    ChevronRight,
    ChevronDown
} from 'lucide-react';

const FileIcon = ({ name, isDirectory, isOpen }) => {
    if (isDirectory) {
        return isOpen ?
            <FolderOpen className="mr-2 w-4 h-4 text-amber-500" /> :
            <Folder className="mr-2 w-4 h-4 text-amber-500" />;
    }

    const ext = name.split('.').pop().toLowerCase();
    switch (ext) {
        case 'js': return <FileCode className="mr-2 w-4 h-4 text-yellow-500" />;
        case 'jsx': return <FileCode className="mr-2 w-4 h-4 text-blue-500" />;
        case 'ts': return <FileCode className="mr-2 w-4 h-4 text-blue-600" />;
        case 'tsx': return <FileCode className="mr-2 w-4 h-4 text-blue-500" />;
        case 'css': return <FileCode className="mr-2 w-4 h-4 text-pink-500" />;
        case 'html': return <FileCode className="mr-2 w-4 h-4 text-orange-500" />;
        case 'json': return <FileJson className="mr-2 w-4 h-4 text-yellow-600" />;
        case 'md': return <FileText className="mr-2 w-4 h-4 text-slate-400" />;
        case 'py': return <FileCode className="mr-2 w-4 h-4 text-green-500" />;
        case 'java': return <FileCode className="mr-2 w-4 h-4 text-red-500" />;
        default: return <File className="mr-2 w-4 h-4 text-slate-400" />;
    }
};

const FileNode = ({ node, onSelect, selectedFile, issues }) => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (selectedFile && selectedFile.startsWith(node.path + '/') && node.type === 'directory') {
            setIsOpen(true);
        }
    }, [selectedFile, node.path, node.type]);

    const hasIssues = issues.some(i => i.filePath.includes(node.path));
    const issueCount = issues.filter(i => i.filePath === node.path).length;

    const handleToggle = (e) => {
        e.stopPropagation();
        if (node.type === 'directory') {
            setIsOpen(!isOpen);
        } else {
            onSelect(node.path);
        }
    };

    return (
        <div className="ml-3">
            <div
                className={`flex items-center py-1.5 px-2 rounded-md cursor-pointer transition-all text-sm ${selectedFile === node.path
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                onClick={handleToggle}
            >
                {node.type === 'directory' && (
                    <span className="mr-1 text-slate-400">
                        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </span>
                )}
                <FileIcon name={node.name} isDirectory={node.type === 'directory'} isOpen={isOpen} />
                <span className="truncate flex-1">{node.name}</span>

                {issueCount > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold bg-red-100 text-red-600 rounded-full">
                        {issueCount}
                    </span>
                )}

                {node.type === 'directory' && hasIssues && !isOpen && (
                    <span className="ml-2 w-2 h-2 bg-red-500 rounded-full" />
                )}
            </div>

            {node.type === 'directory' && isOpen && (
                <div className="border-l border-slate-200 ml-2">
                    {node.children.map((child) => (
                        <FileNode
                            key={child.path}
                            node={child}
                            onSelect={onSelect}
                            selectedFile={selectedFile}
                            issues={issues}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function FileExplorer({ files = [], onSelect, selectedFile, issues = [] }) {
    const [fileTree, setFileTree] = useState([]);

    useEffect(() => {
        if (files && files.length > 0) {
            const tree = buildTree(files);
            setFileTree(tree);
        } else {
            setFileTree([]);
        }
    }, [files]);

    const buildTree = (fileList) => {
        const tree = {};

        fileList.forEach(file => {
            if (!file || !file.path) return;

            let normalizedPath = file.path.replace(/\\/g, '/');

            if (normalizedPath.startsWith('/')) {
                normalizedPath = normalizedPath.substring(1);
            }

            const parts = normalizedPath.split('/');
            let currentLevel = tree;

            parts.forEach((part, index) => {
                if (!currentLevel[part]) {
                    currentLevel[part] = {
                        name: part,
                        path: parts.slice(0, index + 1).join('/'),
                        type: index === parts.length - 1 ? 'file' : 'directory',
                        children: {}
                    };
                }
                currentLevel = currentLevel[part].children;
            });
        });

        const convertToArray = (node) => {
            return Object.values(node).sort((a, b) => {
                if (a.type === b.type) return a.name.localeCompare(b.name);
                return a.type === 'directory' ? -1 : 1;
            }).map(item => ({
                ...item,
                children: convertToArray(item.children)
            }));
        };

        return convertToArray(tree);
    };

    return (
        <div className="h-full overflow-y-auto -ml-3">
            {fileTree.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                    <File className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No files found</p>
                </div>
            ) : (
                fileTree.map((node) => (
                    <FileNode
                        key={node.path}
                        node={node}
                        onSelect={onSelect}
                        selectedFile={selectedFile}
                        issues={issues}
                    />
                ))
            )}
        </div>
    );
}
