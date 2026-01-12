/**
 * Card Component - Visual representation of a playing card
 * 
 * Standard playing card aesthetic with premium pet touches.
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
    const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
    const canDrag = isDraggable && card.faceUp;

    // Standard card proportions
    const cardStyle: React.CSSProperties = {
        width: '100%',
        aspectRatio: '5/7',
        borderRadius: '8px',
        position: 'relative',
        userSelect: 'none',
        transition: 'transform 0.1s ease-out, box-shadow 0.1s ease-out',
        cursor: isClickable || canDrag ? 'pointer' : 'default',
        boxShadow: isSelected
            ? '0 0 0 3px #fbbf24, 0 8px 16px rgba(0,0,0,0.4)'
            : '0 2px 4px rgba(0,0,0,0.2)',
        transform: isSelected ? 'scale(1.05) translateY(-4px)' : 'scale(1)',
        zIndex: isSelected ? 50 : 1,
        ...style
    };

    if (!card.faceUp) {
        return (
            <div
                onClick={isClickable ? onClick : undefined}
                className="game-card back"
                style={{
                    ...cardStyle,
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    border: '3px solid white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <div style={{ fontSize: '24px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>🐾</div>
                <div className="absolute inset-2 border border-white/20 rounded-md" />
            </div>
        );
    }

    return (
        <div
            onClick={isClickable ? onClick : undefined}
            className={`game-card face ${isSelected ? 'selected' : ''}`}
            style={{
                ...cardStyle,
                backgroundColor: 'white',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                border: '1px solid #e2e8f0',
            }}
        >
            {/* Top-Left Corner Rank & Suit - Delicate */}
            <div className="absolute top-0.5 left-1 flex flex-col items-center leading-none">
                <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: isRed ? '#f43f5e' : '#334155'
                }}>
                    {card.rank}
                </span>
                <span style={{
                    fontSize: '9px',
                    color: isRed ? '#f43f5e' : '#334155',
                    marginTop: '-1px'
                }}>
                    {SUIT_SYMBOLS[card.suit]}
                </span>
            </div>

            {/* Top-Right Pet Icon - Very subtle */}
            <div className="absolute top-1 right-1 opacity-5 filter grayscale scale-50">
                {PET_EMOJIS[card.suit]}
            </div>

            {/* Main Center Rank - Soft and Clean */}
            <div style={{
                fontSize: '22px',
                fontWeight: '600',
                color: isRed ? '#f43f5e' : '#334155',
                lineHeight: 1,
                marginTop: '1px',
                letterSpacing: '-0.5px'
            }}>
                {card.rank}
            </div>

            {/* Center Suit - Delicate */}
            <div style={{
                fontSize: '16px',
                color: isRed ? '#f43f5e' : '#334155',
                marginTop: '-1px',
                opacity: 0.7
            }}>
                {SUIT_SYMBOLS[card.suit]}
            </div>

            {/* Bottom-Right Corner (Inverted) - Very light */}
            <div className="absolute bottom-0.5 right-1 flex flex-col items-center leading-none rotate-180 opacity-15">
                <span style={{ fontSize: '9px', fontWeight: '700', color: isRed ? '#f43f5e' : '#334155' }}>{card.rank}</span>
                <span style={{ fontSize: '8px', color: isRed ? '#f43f5e' : '#334155' }}>{SUIT_SYMBOLS[card.suit]}</span>
            </div>
        </div>
    );
}
