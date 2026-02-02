/**
 * Card Component - The Clean One Style
 * Com suporte a drag & drop e double-click
 */

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Card as CardType, SUIT_SYMBOLS, GameTheme } from '../types';

interface CardProps {
    card: CardType;
    onClick?: () => void;
    onDoubleClick?: () => void;
    onDragStart?: (e: React.DragEvent) => void;
    onDragEnd?: (e: React.DragEvent) => void;
    isSelected?: boolean;
    isClickable?: boolean;
    isDraggable?: boolean;
    theme: GameTheme;
}

export default function Card({
    card,
    onClick,
    onDoubleClick,
    onDragStart,
    onDragEnd,
    isSelected,
    isClickable = true,
    isDraggable = true,
    theme
}: CardProps) {
    const suitColor = theme.suitColors[card.suit];
    const clickTimeoutRef = useRef<number | null>(null);
    const clickCountRef = useRef(0);

    // Lidar com single click vs double click
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (!isClickable) return;

        clickCountRef.current += 1;

        if (clickCountRef.current === 1) {
            // Primeiro clique - esperar para ver se é double click
            clickTimeoutRef.current = window.setTimeout(() => {
                if (clickCountRef.current === 1) {
                    // Single click
                    onClick?.();
                }
                clickCountRef.current = 0;
            }, 250);
        } else if (clickCountRef.current === 2) {
            // Double click
            if (clickTimeoutRef.current) {
                clearTimeout(clickTimeoutRef.current);
            }
            clickCountRef.current = 0;
            onDoubleClick?.();
        }
    };

    // Drag handlers
    const handleDragStart = (e: React.DragEvent) => {
        if (!isDraggable || !card.faceUp) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', card.id);
        onDragStart?.(e);
    };

    const handleDragEnd = (e: React.DragEvent) => {
        onDragEnd?.(e);
    };

    // Card back - minimalista
    if (!card.faceUp) {
        return (
            <div
                className="clean-card back"
                style={{
                    backgroundColor: theme.cardBack,
                    cursor: 'default'
                }}
            />
        );
    }

    // Card face - design minimalista clean
    return (
        <motion.div
            className={`clean-card face ${isSelected ? 'selected' : ''}`}
            style={{
                backgroundColor: theme.cardFace,
                border: isSelected ? `3px solid ${theme.accent}` : '1px solid rgba(0,0,0,0.1)',
                cursor: isClickable ? 'pointer' : 'default'
            }}
            onClick={handleClick}
            draggable={isDraggable && card.faceUp}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            whileHover={isClickable ? { y: -4, transition: { duration: 0.15 } } : {}}
            whileTap={isClickable ? { scale: 0.98 } : {}}
        >
            <div className="card-top-left" style={{ color: suitColor }}>
                <span className="rank">{card.rank}</span>
                <span className="suit">{SUIT_SYMBOLS[card.suit]}</span>
            </div>

            <div className="card-center" style={{ color: suitColor }}>
                <span className="suit-large">{SUIT_SYMBOLS[card.suit]}</span>
            </div>

            <div className="card-bottom-right" style={{ color: suitColor }}>
                <span className="rank">{card.rank}</span>
                <span className="suit">{SUIT_SYMBOLS[card.suit]}</span>
            </div>
        </motion.div>
    );
}

// Slot vazio para foundation ou tableau vazio
export function EmptySlot({
    suit,
    theme,
    onClick,
    onDragOver,
    onDrop,
    isHighlighted
}: {
    suit?: string;
    theme: GameTheme;
    onClick?: () => void;
    onDragOver?: (e: React.DragEvent) => void;
    onDrop?: (e: React.DragEvent) => void;
    isHighlighted?: boolean;
}) {
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        onDragOver?.(e);
    };

    return (
        <div
            className={`clean-card empty ${isHighlighted ? 'highlight' : ''}`}
            onClick={onClick}
            onDragOver={handleDragOver}
            onDrop={onDrop}
            style={{
                borderColor: isHighlighted ? theme.accent : 'rgba(255,255,255,0.15)',
                backgroundColor: isHighlighted ? `${theme.accent}20` : 'rgba(255,255,255,0.03)'
            }}
        >
            {suit && (
                <span className="suit-hint" style={{ color: 'rgba(255,255,255,0.15)' }}>
                    {SUIT_SYMBOLS[suit as keyof typeof SUIT_SYMBOLS]}
                </span>
            )}
        </div>
    );
}

// Stock pile (baralho)
export function StockPile({
    count,
    theme,
    onClick
}: {
    count: number;
    theme: GameTheme;
    onClick: () => void;
}) {
    if (count === 0) {
        // Mostrar botão de reset
        return (
            <div
                className="clean-card empty reset-stock"
                onClick={onClick}
                style={{
                    cursor: 'pointer',
                    borderColor: 'rgba(255,255,255,0.2)'
                }}
            >
                <div className="reset-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                    </svg>
                </div>
            </div>
        );
    }

    return (
        <div
            className="clean-card stock-block"
            onClick={onClick}
            style={{
                backgroundColor: theme.accent,
                cursor: 'pointer'
            }}
        >
            <span className="count">{count}</span>
        </div>
    );
}
