/**
 * Edge Component - Renders a line between two nodes
 */

import { Edge as EdgeType, Node } from '../types';
import '../../../styles/design-system-base.css';

interface EdgeProps {
    edge: EdgeType;
    nodes: Node[];
    isCrossing?: boolean;
}

export default function Edge({ edge, nodes, isCrossing }: EdgeProps) {
    const fromNode = nodes.find(n => n.id === edge.from);
    const toNode = nodes.find(n => n.id === edge.to);

    if (!fromNode || !toNode) return null;

    // Convert normalized coordinates to SVG viewBox (0-100)
    const x1 = fromNode.x * 100;
    const y1 = fromNode.y * 100;
    const x2 = toNode.x * 100;
    const y2 = toNode.y * 100;

    return (
        <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={isCrossing ? 'var(--color-warning)' : 'var(--color-border)'}
            strokeWidth={isCrossing ? '0.4' : '0.3'}
            strokeLinecap="round"
            style={{
                filter: isCrossing ? 'drop-shadow(0 0 2px var(--color-warning))' : 'none',
                transition: 'stroke var(--duration-fast) var(--ease-out-apple), stroke-width var(--duration-fast) var(--ease-out-apple)'
            }}
        />
    );
}
