'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    MarkerType,
    Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
    FileCode,
    Database,
    Server,
    Layout,
    Zap,
    Shield,
    Box,
    Layers,
    Globe,
    Cog,
    X
} from 'lucide-react';

// Custom node component for different file types
const FileNode = ({ data }) => {
    const getIcon = () => {
        const type = data.type || 'file';
        const iconClass = "w-4 h-4";
        switch (type) {
            case 'controller': return <Server className={iconClass} />;
            case 'service': return <Cog className={iconClass} />;
            case 'model': return <Database className={iconClass} />;
            case 'route': return <Globe className={iconClass} />;
            case 'component': return <Layout className={iconClass} />;
            case 'middleware': return <Shield className={iconClass} />;
            case 'util': return <Zap className={iconClass} />;
            case 'config': return <Cog className={iconClass} />;
            default: return <FileCode className={iconClass} />;
        }
    };

    const getColorClass = () => {
        const type = data.type || 'file';
        switch (type) {
            case 'controller': return 'bg-purple-500';
            case 'service': return 'bg-blue-500';
            case 'model': return 'bg-green-500';
            case 'route': return 'bg-orange-500';
            case 'component': return 'bg-pink-500';
            case 'middleware': return 'bg-amber-500';
            case 'util': return 'bg-cyan-500';
            case 'config': return 'bg-slate-500';
            default: return 'bg-slate-400';
        }
    };

    return (
        <div
            className={`px-4 py-3 shadow-lg rounded-xl border-2 transition-all hover:shadow-xl cursor-pointer
                ${data.selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200'}
                ${data.hasIssues ? 'bg-red-50' : 'bg-white'}`}
        >
            <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${getColorClass()} text-white`}>
                    {getIcon()}
                </div>
                <div className="flex flex-col">
                    <span className="font-medium text-sm text-slate-900">{data.label}</span>
                    {data.lines && (
                        <span className="text-xs text-slate-500">{data.lines} lines</span>
                    )}
                </div>
            </div>
            {data.hasIssues && (
                <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    {data.issueCount} issues
                </div>
            )}
        </div>
    );
};

// Group node for modules/folders
const GroupNode = ({ data }) => {
    return (
        <div className="px-4 py-3 bg-slate-100/80 backdrop-blur-sm rounded-2xl border-2 border-dashed border-slate-300 min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
                <Layers className="w-4 h-4 text-slate-500" />
                <span className="font-medium text-slate-700">{data.label}</span>
            </div>
            {data.description && (
                <p className="text-xs text-slate-500">{data.description}</p>
            )}
        </div>
    );
};

const nodeTypes = {
    fileNode: FileNode,
    groupNode: GroupNode,
};

// Parse mermaid-like dependency graph to React Flow format
const parseDependencyGraph = (files, dependencyGraph) => {
    const nodes = [];
    const edges = [];
    const nodeMap = new Map();

    // Create nodes from files
    if (files && files.length > 0) {
        const columns = {
            controller: [],
            route: [],
            service: [],
            model: [],
            component: [],
            middleware: [],
            util: [],
            config: [],
            other: []
        };

        // Categorize files
        files.forEach(file => {
            const path = file.path || file;
            const name = typeof path === 'string' ? path.split('/').pop().split('\\').pop() : 'unknown';
            let type = 'other';

            if (name.includes('controller')) type = 'controller';
            else if (name.includes('route')) type = 'route';
            else if (name.includes('service')) type = 'service';
            else if (name.includes('model') || name.includes('Model')) type = 'model';
            else if (name.includes('.jsx') || name.includes('.tsx') || name.includes('component')) type = 'component';
            else if (name.includes('middleware')) type = 'middleware';
            else if (name.includes('util') || name.includes('helper')) type = 'util';
            else if (name.includes('config') || name.includes('.env')) type = 'config';

            columns[type].push({ name, path, type, lines: file.lines });
        });

        // Position nodes in columns
        let xOffset = 0;
        const columnWidth = 220;
        const rowHeight = 100;

        Object.entries(columns).forEach(([type, filesInColumn]) => {
            if (filesInColumn.length === 0) return;

            filesInColumn.forEach((file, idx) => {
                // Use full path + index to ensure unique IDs
                const pathForId = file.path || file.name;
                const nodeId = `${pathForId}_${idx}`.replace(/[^a-zA-Z0-9]/g, '_');
                nodes.push({
                    id: nodeId,
                    type: 'fileNode',
                    position: { x: xOffset, y: idx * rowHeight + 50 },
                    data: {
                        label: file.name,
                        type: file.type,
                        lines: file.lines,
                        path: file.path
                    },
                });
                nodeMap.set(file.path || file.name, nodeId);
            });

            xOffset += columnWidth;
        });
    }

    // Parse dependency graph string (Mermaid format) to create edges
    if (dependencyGraph && typeof dependencyGraph === 'string') {
        const lines = dependencyGraph.split('\n');
        lines.forEach(line => {
            // Match patterns like: A --> B or A ---> B
            const arrowMatch = line.match(/(\w+)\s*--+>\s*(\w+)/);
            if (arrowMatch) {
                const [, source, target] = arrowMatch;

                // Find matching nodes
                let sourceId = null;
                let targetId = null;

                nodeMap.forEach((id, name) => {
                    if (name.toLowerCase().includes(source.toLowerCase())) sourceId = id;
                    if (name.toLowerCase().includes(target.toLowerCase())) targetId = id;
                });

                if (sourceId && targetId && sourceId !== targetId) {
                    edges.push({
                        id: `e-${sourceId}-${targetId}`,
                        source: sourceId,
                        target: targetId,
                        animated: true,
                        style: { stroke: '#94a3b8', strokeWidth: 2 },
                        markerEnd: {
                            type: MarkerType.ArrowClosed,
                            color: '#94a3b8',
                        },
                    });
                }
            }
        });
    }

    // If no edges from parsing, create logical connections
    if (edges.length === 0 && nodes.length > 1) {
        // Create some logical connections based on types
        const controllers = nodes.filter(n => n.data.type === 'controller');
        const services = nodes.filter(n => n.data.type === 'service');
        const models = nodes.filter(n => n.data.type === 'model');
        const routes = nodes.filter(n => n.data.type === 'route');

        // Routes -> Controllers
        routes.forEach(route => {
            controllers.forEach(ctrl => {
                edges.push({
                    id: `e-${route.id}-${ctrl.id}`,
                    source: route.id,
                    target: ctrl.id,
                    style: { stroke: '#f97316', strokeWidth: 2 },
                    markerEnd: { type: MarkerType.ArrowClosed, color: '#f97316' },
                });
            });
        });

        // Controllers -> Services
        controllers.forEach(ctrl => {
            services.forEach(svc => {
                edges.push({
                    id: `e-${ctrl.id}-${svc.id}`,
                    source: ctrl.id,
                    target: svc.id,
                    animated: true,
                    style: { stroke: '#8b5cf6', strokeWidth: 2 },
                    markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' },
                });
            });
        });

        // Services -> Models
        services.forEach(svc => {
            models.forEach(model => {
                edges.push({
                    id: `e-${svc.id}-${model.id}`,
                    source: svc.id,
                    target: model.id,
                    style: { stroke: '#22c55e', strokeWidth: 2 },
                    markerEnd: { type: MarkerType.ArrowClosed, color: '#22c55e' },
                });
            });
        });
    }

    return { nodes, edges };
};

export default function InteractiveArchitectureMap({ architecture, files = [] }) {
    const [selectedNode, setSelectedNode] = useState(null);

    const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
        return parseDependencyGraph(files, architecture?.dependencyGraph);
    }, [files, architecture?.dependencyGraph]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onNodeClick = useCallback((event, node) => {
        setSelectedNode(node.data);
    }, []);

    if (!architecture && files.length === 0) {
        return (
            <div className="text-center py-12 flex flex-col items-center bg-slate-50 rounded-xl">
                <Layout className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-slate-500">No architecture data available.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Legend */}
            <div className="flex flex-wrap gap-3 p-3 bg-white rounded-xl border border-slate-200">
                {[
                    { type: 'controller', color: 'bg-purple-500', label: 'Controllers' },
                    { type: 'service', color: 'bg-blue-500', label: 'Services' },
                    { type: 'model', color: 'bg-green-500', label: 'Models' },
                    { type: 'route', color: 'bg-orange-500', label: 'Routes' },
                    { type: 'component', color: 'bg-pink-500', label: 'Components' },
                    { type: 'middleware', color: 'bg-amber-500', label: 'Middleware' },
                ].map(item => (
                    <div key={item.type} className="flex items-center gap-1.5 text-xs">
                        <div className={`w-3 h-3 rounded ${item.color}`}></div>
                        <span className="text-slate-600">{item.label}</span>
                    </div>
                ))}
            </div>

            {/* Interactive Flow Diagram */}
            <div className="h-[500px] bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={onNodeClick}
                    nodeTypes={nodeTypes}
                    fitView
                    attributionPosition="bottom-left"
                    defaultEdgeOptions={{
                        animated: true,
                    }}
                >
                    <Controls className="bg-white border border-slate-200 rounded-lg" />
                    <MiniMap
                        nodeColor={(node) => {
                            const type = node.data?.type;
                            switch (type) {
                                case 'controller': return '#a855f7';
                                case 'service': return '#3b82f6';
                                case 'model': return '#22c55e';
                                case 'route': return '#f97316';
                                case 'component': return '#ec4899';
                                default: return '#94a3b8';
                            }
                        }}
                        maskColor="rgba(0,0,0,0.1)"
                        className="bg-white border border-slate-200 rounded-lg"
                    />
                    <Background variant="dots" gap={20} size={1} color="#e2e8f0" />

                    {/* Info Panel */}
                    {selectedNode && (
                        <Panel position="top-right" className="m-2">
                            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 min-w-[250px]">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold text-slate-900">File Details</h4>
                                    <button
                                        onClick={() => setSelectedNode(null)}
                                        className="p-1 hover:bg-slate-100 rounded-lg"
                                    >
                                        <X className="w-4 h-4 text-slate-400" />
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    <div>
                                        <span className="text-xs text-slate-500">Name</span>
                                        <p className="font-medium text-sm text-slate-900">{selectedNode.label}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-slate-500">Type</span>
                                        <p className="font-medium text-sm text-slate-900 capitalize">{selectedNode.type || 'File'}</p>
                                    </div>
                                    {selectedNode.lines && (
                                        <div>
                                            <span className="text-xs text-slate-500">Lines of Code</span>
                                            <p className="font-medium text-sm text-slate-900">{selectedNode.lines}</p>
                                        </div>
                                    )}
                                    {selectedNode.path && (
                                        <div>
                                            <span className="text-xs text-slate-500">Path</span>
                                            <p className="font-mono text-xs text-slate-600 break-all">{selectedNode.path}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Panel>
                    )}
                </ReactFlow>
            </div>

            {/* Pattern & Quality Info */}
            {architecture && (
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <span className="text-xs text-slate-500">Detected Pattern</span>
                        <p className="font-semibold text-slate-900 capitalize mt-1">
                            {architecture.pattern || 'Unknown'}
                        </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <span className="text-xs text-slate-500">Structure Quality</span>
                        <p className={`font-semibold capitalize mt-1 ${architecture.quality === 'excellent' ? 'text-emerald-600' :
                            architecture.quality === 'good' ? 'text-blue-600' :
                                architecture.quality === 'needs-improvement' ? 'text-amber-600' :
                                    'text-red-600'
                            }`}>
                            {architecture.quality?.replace('-', ' ') || 'Unknown'}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
