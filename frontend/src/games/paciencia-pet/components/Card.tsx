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
    style
}: CardProps) {
    const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
    const canDrag = isDraggable && card.faceUp;

    // Standard card proportions
    const cardStyle: React.CSSProperties = {
        width: '100%',
        aspectRatio: '5/7',
        borderRadius: '10px',
        position: 'relative',
        userSelect: 'none',
        transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)', // Bouncy transition
        cursor: isClickable || canDrag ? 'pointer' : 'default',
        boxShadow: isSelected
            ? '0 0 0 4px #fbbf24, 0 12px 24px -8px rgba(251, 191, 36, 0.5)'
            : '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
        transform: isSelected ? 'scale(1.05) translateY(-8px)' : 'scale(1)',
        zIndex: isSelected ? 50 : 1,
        ...style
    };

    if (!card.faceUp) {
        return (
            <div
                onClick={isClickable ? onClick : undefined}
                className="game-card back overflow-hidden"
                style={{
                    ...cardStyle,
                    background: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)',
                    border: '4px solid white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {/* Pattern Overlay */}
                <div className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: 'radial-gradient(white 2px, transparent 2px)',
                        backgroundSize: '8px 8px'
                    }}
                />

                <div className="relative bg-white/20 p-2 rounded-full backdrop-blur-sm">
                    <div style={{ fontSize: '20px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>🐾</div>
                </div>
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
            {/* Top-Left Corner Rank & Suit */}
            <div className="absolute top-1 left-1.5 flex flex-col items-center leading-none">
                <span style={{
                    fontSize: '12px',
                    fontWeight: '800',
                    color: isRed ? '#f43f5e' : '#334155',
                    fontFamily: 'Quicksand, sans-serif'
                }}>
                    {card.rank}
                </span>
                <span style={{
                    fontSize: '10px',
                    color: isRed ? '#f43f5e' : '#334155',
                    marginTop: '0px'
                }}>
                    {SUIT_SYMBOLS[card.suit]}
                </span>
            </div>

            {/* Top-Right Pet Icon - Very subtle */}
            <div className="absolute top-1.5 right-1.5 opacity-20 filter grayscale scale-75">
                {PET_EMOJIS[card.suit]}
            </div>

            {/* Main Center Rank - Soft and Clean */}
            <div style={{
                fontSize: card.rank.length > 1 ? '22px' : '26px', // Slightly smaller if 2 digits
                fontWeight: '600', // Reduced from 700
                color: isRed ? '#f43f5e' : '#334155',
                lineHeight: 1,
                marginTop: '1px',
                fontFamily: 'Quicksand, sans-serif'
            }}>
                {card.rank}
            </div>

            {/* Center Suit - Delicate */}
            <div style={{
                fontSize: '18px',
                color: isRed ? '#f43f5e' : '#334155',
                marginTop: '2px',
                opacity: 0.8
            }}>
                {SUIT_SYMBOLS[card.suit]}
            </div>

            {/* Bottom-Right Corner (Inverted) */}
            <div className="absolute bottom-1 right-1.5 flex flex-col items-center leading-none rotate-180 opacity-30">
                <span style={{ fontSize: '10px', fontWeight: '800', color: isRed ? '#f43f5e' : '#334155' }}>{card.rank}</span>
                <span style={{ fontSize: '9px', color: isRed ? '#f43f5e' : '#334155' }}>{SUIT_SYMBOLS[card.suit]}</span>
            </div>
        </div>
    );
}
