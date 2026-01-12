/**
 * GameBoard Component - SVG canvas with drag-and-drop
 */

import { useRef, useCallback, useState } from 'react';
import { Node as NodeType, Edge as EdgeType } from '../types';
import Node from './Node';
import Edge from './Edge';
import '../../../styles/design-system-base.css';

interface GameBoardProps {
    nodes: NodeType[];
    edges: EdgeType[];
    onNodeMove: (nodeId: string, x: number, y: number) => void;
    crossingEdges?: Set<string>;
}

export default function GameBoard({ nodes, edges, onNodeMove, crossingEdges }: GameBoardProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [dragging, setDragging] = useState<string | null>(null);

    const handlePointerDown = useCallback((nodeId: string, e: React.PointerEvent) => {
        e.preventDefault();
        setDragging(nodeId);
        (e.target as Element).setPointerCapture(e.pointerId);
    }, []);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!dragging || !svgRef.current) return;

        const svg = svgRef.current;
        const rect = svg.getBoundingClientRect();

        // Convert screen coordinates to normalized (0-1)
        const x = Math.max(0.05, Math.min(0.95, (e.clientX - rect.left) / rect.width));
        const y = Math.max(0.05, Math.min(0.95, (e.clientY - rect.top) / rect.height));

        onNodeMove(dragging, x, y);
    }, [dragging, onNodeMove]);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        if (dragging) {
            (e.target as Element).releasePointerCapture(e.pointerId);
            setDragging(null);
        }
    }, [dragging]);

    return (
        <svg
            ref={svgRef}
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
                width: '100%',
                height: '100%',
                minHeight: '300px',
                maxHeight: '600px',
                aspectRatio: '1 / 1',
                touchAction: 'none',
                userSelect: 'none',
                backgroundColor: 'var(--color-bg-primary)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)'
            }}
        >
            {/* Render edges first (behind nodes) */}
            {edges.map(edge => (
                <Edge
                    key={edge.id}
                    edge={edge}
                    nodes={nodes}
                    isCrossing={crossingEdges?.has(edge.id)}
                />
            ))}

            {/* Render nodes on top */}
            {nodes.map(node => (
                <Node
                    key={node.id}
                    node={node}
                    onPointerDown={(e) => handlePointerDown(node.id, e)}
                    isDragging={dragging === node.id}
                />
            ))}
        </svg>
    );
}
