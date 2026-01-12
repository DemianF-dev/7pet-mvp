/**
 * Node Component - Draggable circle with pet emoji
 */

import { Node as NodeType } from '../types';
import '../../../styles/design-system-base.css';

interface NodeProps {
    node: NodeType;
    onPointerDown: (e: React.PointerEvent) => void;
    isDragging: boolean;
}

export default function Node({ node, onPointerDown, isDragging }: NodeProps) {
    // Convert normalized coordinates to SVG viewBox (0-100)
    const cx = node.x * 100;
    const cy = node.y * 100;
    const radius = 3.5; // Large enough for touch (will be ~44px in typical viewport)

    return (
        <g
            onPointerDown={onPointerDown}
            style={{
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none',
                touchAction: 'none'
            }}
        >
            {/* Outer circle (shadow/glow) */}
            <circle
                cx={cx}
                cy={cy}
                r={radius + 0.5}
                fill="var(--color-accent-primary)"
                opacity={isDragging ? '0.3' : '0.2'}
                style={{
                    transition: isDragging ? 'none' : 'opacity var(--duration-fast) var(--ease-out-apple)'
                }}
            />

            {/* Main circle */}
            <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill="var(--color-bg-surface)"
                stroke="var(--color-accent-primary)"
                strokeWidth="0.4"
                style={{
                    transform: isDragging ? 'scale(1.1)' : 'scale(1)',
                    transformOrigin: `${cx}px ${cy}px`,
                    transition: isDragging ? 'none' : 'transform var(--duration-fast) var(--ease-out-apple)',
                    filter: isDragging ? 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))' : 'drop-shadow(0 1px 3px rgba(0,0,0,0.1))'
                }}
            />

            {/* Pet emoji label */}
            {node.label && (
                <text
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="3"
                    style={{
                        pointerEvents: 'none',
                        userSelect: 'none'
                    }}
                >
                    {node.label}
                </text>
            )}
        </g>
    );
}
