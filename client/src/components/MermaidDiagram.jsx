'use client';

// Dependency check
import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

mermaid.initialize({
    startOnLoad: true,
    theme: 'dark',
    securityLevel: 'loose',
    fontFamily: 'Inter, sans-serif',
});

export default function MermaidDiagram({ chart }) {
    const mermaidRef = useRef(null);
    const [svg, setSvg] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        const renderDiagram = async () => {
            if (!chart) return;

            try {
                const { svg } = await mermaid.render(`mermaid-${Date.now()}`, chart);
                setSvg(svg);
                setError(null);
            } catch (err) {
                console.error('Mermaid render error:', err);
                setError('Failed to render diagram. Syntax might be invalid.');
            }
        };

        renderDiagram();
    }, [chart]);

    if (error) {
        return (
            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-center">
                {error}
            </div>
        );
    }

    return (
        <div className="w-full h-[500px] bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden relative group">
            <TransformWrapper
                initialScale={1}
                minScale={0.5}
                maxScale={4}
                centerOnInit
            >
                {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                        <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => zoomIn()}
                                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
                                title="Zoom In"
                            >
                                <ZoomIn className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => zoomOut()}
                                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
                                title="Zoom Out"
                            >
                                <ZoomOut className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => resetTransform()}
                                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
                                title="Reset"
                            >
                                <RotateCcw className="w-5 h-5" />
                            </button>
                        </div>

                        <TransformComponent wrapperClass="w-full h-full" contentClass="w-full h-full">
                            <div
                                ref={mermaidRef}
                                className="w-full h-full flex items-center justify-center p-8"
                                dangerouslySetInnerHTML={{ __html: svg }}
                            />
                        </TransformComponent>
                    </>
                )}
            </TransformWrapper>
        </div>
    );
}
