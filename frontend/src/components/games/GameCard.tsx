/**
 * GameCard - Interactive card for game selection
 * 
 * Premium liquid glass design following Apple's design language.
 * Used in PausaPage to display available games.
 * Follows design system guidelines and uses only CSS tokens.
 */

import { GameMetadata } from '../../types/game.types';
import '../../styles/design-system-base.css';

interface GameCardProps {
    game: GameMetadata;
    onClick?: () => void;
}

export default function GameCard({ game, onClick }: GameCardProps) {
    const isDisabled = game.status !== 'active';

    return (
        <div
            className={`glass-card ${!isDisabled ? 'card-hover interactive' : ''} animate-scale-in`}
            onClick={!isDisabled ? onClick : undefined}
            style={{
                position: 'relative',
                opacity: isDisabled ? 0.7 : 1,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                minHeight: '240px',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-4)',
                padding: 'var(--space-6)',
                background: isDisabled
                    ? 'var(--glass-bg)'
                    : 'linear-gradient(135deg, var(--glass-bg) 0%, rgba(255, 255, 255, 0.85) 100%)',
                backdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
                WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
                border: isDisabled
                    ? '1px solid var(--color-border)'
                    : '1px solid rgba(255, 255, 255, 0.5)',
                boxShadow: isDisabled ? 'var(--shadow-sm)' : 'var(--shadow-card)',
                borderRadius: 'var(--radius-xl)',
                transition: 'all var(--duration-normal) var(--ease-out-apple)',
                overflow: 'hidden'
            }}
        >
            {/* Subtle gradient overlay for depth */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.05) 100%)',
                    pointerEvents: 'none',
                    opacity: isDisabled ? 0 : 1
                }}
            />

            {/* Status badge */}
            {game.status === 'coming-soon' && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'var(--space-4)',
                        right: 'var(--space-4)',
                        padding: 'var(--space-1) var(--space-3)',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--font-size-caption1)',
                        fontWeight: 'var(--font-weight-bold)',
                        background: 'var(--glass-bg)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        boxShadow: 'var(--shadow-sm)'
                    }}
                >
                    Em breve
                </div>
            )}

            {/* Icon with premium styling */}
            {game.icon && (
                <div
                    style={{
                        fontSize: '3.5rem',
                        textAlign: 'center',
                        marginTop: 'var(--space-2)',
                        filter: isDisabled ? 'grayscale(1)' : 'none',
                        transition: 'all var(--duration-normal) var(--ease-out-apple)',
                        transform: 'translateZ(0)'
                    }}
                >
                    {game.icon}
                </div>
            )}

            {/* Title */}
            <h3
                style={{
                    fontSize: 'var(--font-size-title3)',
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--color-text-primary)',
                    margin: 0,
                    textAlign: 'center',
                    letterSpacing: '-0.01em',
                    position: 'relative',
                    zIndex: 1
                }}
            >
                {game.name}
            </h3>

            {/* Description */}
            <p
                style={{
                    fontSize: 'var(--font-size-body)',
                    color: 'var(--color-text-secondary)',
                    margin: 0,
                    textAlign: 'center',
                    flex: 1,
                    lineHeight: 1.5,
                    position: 'relative',
                    zIndex: 1
                }}
            >
                {game.description}
            </p>

            {/* Metadata row */}
            <div
                style={{
                    display: 'flex',
                    gap: 'var(--space-4)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: 'var(--font-size-footnote)',
                    color: 'var(--color-text-tertiary)',
                    marginTop: 'auto',
                    flexWrap: 'wrap',
                    position: 'relative',
                    zIndex: 1
                }}
            >
                {game.difficulty && (
                    <span
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-1)'
                        }}
                    >
                        <span style={{ opacity: 0.6 }}>Dificuldade:</span>
                        <strong style={{ color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-semibold)' }}>
                            {game.difficulty === 'easy' ? 'Fácil' : game.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                        </strong>
                    </span>
                )}
                {game.estimatedTime && (
                    <span
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-1)'
                        }}
                    >
                        <span style={{ opacity: 0.6 }}>⏱️</span>
                        <strong style={{ color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-semibold)' }}>
                            {game.estimatedTime}
                        </strong>
                    </span>
                )}
            </div>

            {/* Tags */}
            {game.tags && game.tags.length > 0 && (
                <div
                    style={{
                        display: 'flex',
                        gap: 'var(--space-2)',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        position: 'relative',
                        zIndex: 1
                    }}
                >
                    {game.tags.map((tag) => (
                        <span
                            key={tag}
                            style={{
                                padding: 'var(--space-1) var(--space-3)',
                                borderRadius: 'var(--radius-full)',
                                fontSize: 'var(--font-size-caption1)',
                                fontWeight: 'var(--font-weight-medium)',
                                background: 'var(--color-fill-quaternary)',
                                color: 'var(--color-text-tertiary)',
                                border: '1px solid var(--color-border)'
                            }}
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
