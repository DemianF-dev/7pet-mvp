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

import { GameMetadata } from '../../types/game.types';
import { Card, Badge } from '../ui';
import { motion } from 'framer-motion';

interface GameCardProps {
    game: GameMetadata;
    onClick?: () => void;
}

export default function GameCard({ game, onClick }: GameCardProps) {
    const isDisabled = game.status !== 'active';

    return (
        <motion.div
            whileHover={!isDisabled ? { scale: 1.02, translateY: -5 } : {}}
            whileTap={!isDisabled ? { scale: 0.98 } : {}}
            className="h-full"
        >
            <Card
                onClick={!isDisabled ? onClick : undefined}
                className={`h-full flex flex-col p-[var(--space-6)] relative overflow-hidden transition-all duration-300 ${isDisabled ? 'opacity-60 grayscale cursor-not-allowed' : 'cursor-pointer hover:shadow-[var(--shadow-xl)] hover:border-[var(--color-accent-primary-alpha)]'}`}
                variant={isDisabled ? 'default' : 'glass'}
            >
                {/* Status badge */}
                {game.status === 'coming-soon' && (
                    <Badge
                        variant="surface"
                        className="absolute top-4 right-4 font-[var(--font-weight-black)] text-[9px] uppercase tracking-widest"
                    >
                        Em breve
                    </Badge>
                )}

                {/* Icon with premium styling */}
                {game.icon && (
                    <div className="text-6xl text-center my-[var(--space-4)] transition-transform duration-500 group-hover:scale-110">
                        {game.icon}
                    </div>
                )}

                {/* Title */}
                <h3 className="text-xl font-[var(--font-weight-black)] text-[var(--color-text-primary)] text-center mb-2 tracking-tight">
                    {game.name}
                </h3>

                {/* Description */}
                <p className="text-sm text-[var(--color-text-secondary)] text-center flex-1 leading-relaxed font-medium px-2">
                    {game.description}
                </p>

                {/* Metadata row */}
                <div className="flex flex-wrap gap-3 justify-center items-center mt-[var(--space-6)] mb-[var(--space-4)]">
                    {game.difficulty && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-[var(--color-fill-secondary)] rounded-full border border-[var(--color-border)]">
                            <span className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest">Dificuldade</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${game.difficulty === 'easy' ? 'text-green-500' : game.difficulty === 'medium' ? 'text-orange-500' : 'text-red-500'}`}>
                                {game.difficulty === 'easy' ? 'Fácil' : game.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                            </span>
                        </div>
                    )}
                    {game.estimatedTime && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-[var(--color-fill-secondary)] rounded-full border border-[var(--color-border)]">
                            <span className="text-[10px]">⏱️</span>
                            <span className="text-[10px] font-black text-[var(--color-text-secondary)] uppercase tracking-widest">
                                {game.estimatedTime}
                            </span>
                        </div>
                    )}
                </div>

                {/* Tags */}
                {game.tags && game.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center">
                        {game.tags.map((tag) => (
                            <Badge
                                key={tag}
                                variant="surface"
                                size="sm"
                                className="text-[9px] font-[var(--font-weight-black)] uppercase tracking-wider py-0.5 px-2"
                            >
                                {tag}
                            </Badge>
                        ))}
                    </div>
                )}

                {/* Liquid Glass Overlay Effect */}
                {!isDisabled && (
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                )}
            </Card>
        </motion.div>
    );
}

    );
}
