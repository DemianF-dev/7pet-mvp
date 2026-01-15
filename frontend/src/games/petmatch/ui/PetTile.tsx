import { motion } from 'framer-motion';
import { Tile } from '../engine/types';
import { getTileColor } from './theme/petmatchTokens';
import { TILE_ICON_MAP } from './icons/PetMatchIcons';

interface PetTileProps {
    tile: Tile | null;
    row: number;
    col: number;
    isSelected: boolean;
    isMatched?: boolean;
    onClick: () => void;
    onMouseDown?: (e: React.MouseEvent) => void;
    onTouchStart?: (e: React.TouchEvent) => void;
    size: number;
}

export default function PetTile({
    tile, row, col, isSelected, isMatched, onClick, onMouseDown, onTouchStart, size
}: PetTileProps) {
    if (!tile) {
        return null;
    }

    const Icon = TILE_ICON_MAP[tile.type];
    const color = getTileColor(tile.type);

    return (
        <motion.div
            layout
            initial={tile.isNew ? { opacity: 0, scale: 0, y: -50 } : false}
            animate={{
                opacity: isMatched ? 0 : 1,
                scale: isMatched ? 0.5 : (isSelected ? 1.05 : 1),
                y: 0,
                rotate: isMatched ? 90 : 0
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
                type: 'spring',
                stiffness: 350,
                damping: 25,
                mass: 1
            }}
            style={{
                position: 'absolute',
                top: `${row * (size + 8)}px`,
                left: `${col * (size + 8)}px`,
                width: size,
                height: size,
                zIndex: isSelected || tile.special ? 10 : 1,
                cursor: 'pointer',
            }}
            onClick={onClick}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            whileTap={{ scale: 0.98 }}
            whileHover={{ y: -1, transition: { duration: 0.15 } }}
        >
            <div
                className={`pet-tile w-full h-full rounded-2xl flex items-center justify-center relative shadow-sm transition-shadow duration-150 ${isSelected ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}
                style={{
                    backgroundColor: 'var(--color-bg-surface)',
                    color: color,
                    boxShadow: isSelected
                        ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                        : (tile.special ? `0 0 15px ${color}44` : '0 1px 2px 0 rgba(0, 0, 0, 0.05)'),
                    border: tile.special ? `2px solid ${color}` : '1px solid var(--color-border-subtle)'
                }}
            >
                {Icon && (
                    <div className="relative">
                        <Icon size={size * 0.7} style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }} />
                        {tile.special === 'bomb' && (
                            <div className="absolute -bottom-1 -right-1 text-[10px] md:text-xs drop-shadow-sm">💣</div>
                        )}
                        {tile.special === 'cross' && (
                            <div className="absolute -top-1 -right-1 text-[10px] md:text-xs drop-shadow-sm">✨</div>
                        )}
                        {(tile.special === 'ray-h' || tile.special === 'ray-v') && (
                            <div className="absolute -top-3 -right-3 text-[10px] md:text-xs drop-shadow-sm bg-white/80 rounded-full w-4 h-4 flex items-center justify-center">⚡</div>
                        )}
                    </div>
                )}

                {/* Special tile highlights */}
                {tile.special && (
                    <motion.div
                        className="absolute inset-0 rounded-2xl pointer-events-none"
                        animate={{ opacity: [0.1, 0.3, 0.1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{ backgroundColor: color }}
                    />
                )}

                {/* Ray lines visualization */}
                {tile.special === 'ray-h' && (
                    <div className="absolute left-[-4px] right-[-4px] h-1 bg-white/60 top-1/2 -translate-y-1/2 blur-[1px] rounded-full z-[-1]" />
                )}
                {tile.special === 'ray-v' && (
                    <div className="absolute top-[-4px] bottom-[-4px] w-1 bg-white/60 left-1/2 -translate-x-1/2 blur-[1px] rounded-full z-[-1]" />
                )}

                {/* Glossy overlay */}
                <div
                    className="absolute top-0 left-0 right-0 h-1/2 rounded-t-2xl pointer-events-none"
                    style={{
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)',
                        mixBlendMode: 'overlay'
                    }}
                />
            </div>

            {/* Match Explosion Particle (one-time visual) */}
            {isMatched && (
                <motion.div
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    className="absolute inset-0 rounded-full border-2"
                    style={{ borderColor: color }}
                    transition={{ duration: 0.4 }}
                />
            )}
        </motion.div>
    );
}
