/**
 * Card Component - Visual representation of a playing card
 * 
 * Uses only design system tokens for styling.
 * Supports drag and drop.
 */

import { Card as CardType, SUIT_SYMBOLS, SUIT_COLORS, Suit } from '../types';
import '../../../styles/design-system-base.css';

// Pet emojis for each suit
const PET_EMOJIS: Record<Suit, string> = {
    hearts: '🐶',     // Dog
    diamonds: '🐱',   // Cat
    clubs: '🐰',      // Rabbit
    spades: '🐦'      // Bird
};

interface CardProps {
    card: CardType;
    onClick?: () => void;
    isSelected?: boolean;
    isClickable?: boolean;
    isDraggable?: boolean;
    onDragStart?: (e: React.DragEvent | React.TouchEvent) => void;
    onDragEnd?: (e: React.DragEvent | React.TouchEvent) => void;
    onTouchStart?: (e: React.TouchEvent) => void;
    onTouchMove?: (e: React.TouchEvent) => void;
    onTouchEnd?: (e: React.TouchEvent) => void;
    style?: React.CSSProperties;
}

export default function Card({
    card,
    onClick,
    isSelected,
    isClickable,
    isDraggable,
    onDragStart,
    onDragEnd,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    style
}: CardProps) {
    const isRed = SUIT_COLORS[card.suit] === 'red';
    const canDrag = isDraggable && card.faceUp;

    // Touch event handlers for mobile support
    const handleTouchStart = (e: React.TouchEvent) => {
        if (!canDrag && !isClickable) return;

        // Prevent default to avoid scroll
        e.preventDefault();

        if (canDrag && onDragStart) {
            onDragStart(e);
        }
        onTouchStart?.(e);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!canDrag) return;
        e.preventDefault();
        onTouchMove?.(e);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!canDrag && !isClickable) return;
        e.preventDefault();

        if (canDrag && onDragEnd) {
            onDragEnd(e);
        }
        onTouchEnd?.(e);
    };

    return (
        <div
            onClick={isClickable ? onClick : undefined}
            draggable={canDrag}
            onDragStart={canDrag ? onDragStart : undefined}
            onDragEnd={canDrag ? onDragEnd : undefined}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={isClickable || canDrag ? 'interactive' : ''}
            style={{
                width: '70px',
                height: '98px',
                borderRadius: 'var(--radius-lg)',
                background: card.faceUp
                    ? 'linear-gradient(135deg, var(--color-bg-surface) 0%, var(--color-bg-secondary) 100%)'
                    : 'linear-gradient(135deg, var(--color-accent-primary) 0%, var(--color-accent-secondary, #00b050) 100%)',
                border: isSelected
                    ? '3px solid var(--color-accent-primary)'
                    : '1px solid var(--color-border)',
                boxShadow: isSelected ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: canDrag ? 'grab' : (isClickable ? 'pointer' : 'default'),
                userSelect: 'none',
                transition: 'all var(--duration-fast) var(--ease-out-apple)',
                position: 'relative',
                transform: 'scale(1)',
                willChange: 'transform, box-shadow',
                ...style
            }}
            onMouseEnter={(e) => {
                if (canDrag || isClickable) {
                    e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                }
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                e.currentTarget.style.boxShadow = isSelected ? 'var(--shadow-lg)' : 'var(--shadow-sm)';
            }}
        >
            {card.faceUp ? (
                <>
                    {/* Pet emoji in top-right corner */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 'var(--space-1)',
                            right: 'var(--space-1)',
                            fontSize: '14px',
                            opacity: 0.7
                        }}
                    >
                        {PET_EMOJIS[card.suit]}
                    </div>

                    {/* Rank */}
                    <div
                        style={{
                            fontSize: 'var(--font-size-title3)',
                            fontWeight: 'var(--font-weight-bold)',
                            color: isRed ? 'var(--color-error)' : 'var(--color-text-primary)',
                            lineHeight: 1
                        }}
                    >
                        {card.rank}
                    </div>

                    {/* Suit symbol */}
                    <div
                        style={{
                            fontSize: 'var(--font-size-headline)',
                            color: isRed ? 'var(--color-error)' : 'var(--color-text-primary)',
                            marginTop: 'var(--space-1)'
                        }}
                    >
                        {SUIT_SYMBOLS[card.suit]}
                    </div>

                    {/* Small rank in corner */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 'var(--space-1)',
                            left: 'var(--space-1)',
                            fontSize: 'var(--font-size-caption1)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: isRed ? 'var(--color-error)' : 'var(--color-text-primary)'
                        }}
                    >
                        {card.rank}
                    </div>
                </>
            ) : (
                // Card back (face down)
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 'var(--font-size-title2)',
                        color: 'white'
                    }}
                >
                    🐾
                </div>
            )}
        </div>
    );
}

