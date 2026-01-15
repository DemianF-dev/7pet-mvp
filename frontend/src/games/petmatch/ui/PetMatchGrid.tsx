import { useRef, useEffect, useState } from 'react';
import { Board, Position, Tile } from '../engine/types';
import PetTile from './PetTile';
import { BOARD_SIZE } from '../engine/levels';

interface PetMatchGridProps {
    board: Board;
    onMove: (from: Position, to: Position) => void;
    disabled: boolean;
}

export default function PetMatchGrid({ board, onMove, disabled }: PetMatchGridProps) {
    const [selectedPos, setSelectedPos] = useState<Position | null>(null);
    const [dragStart, setDragStart] = useState<Position | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [tileSize, setTileSize] = useState(40);

    // Responsive resize logic
    useEffect(() => {
        const resize = () => {
            if (containerRef.current) {
                const width = containerRef.current.offsetWidth;
                const gap = 8;
                const available = width - (gap * (BOARD_SIZE - 1));
                const calculatedSize = Math.floor(available / BOARD_SIZE);

                // Clamp tile size for optimal experience
                // Mobile: 44-52px, Desktop: 58-72px
                const minSize = window.innerWidth < 768 ? 44 : 58;
                const maxSize = window.innerWidth < 768 ? 52 : 72;
                const finalSize = Math.max(minSize, Math.min(maxSize, calculatedSize));

                setTileSize(finalSize);
            }
        };

        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);

    // Get tile position from screen coordinates
    const getTileAtPoint = (clientX: number, clientY: number): Position | null => {
        if (!containerRef.current) return null;

        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        const col = Math.floor(x / (tileSize + 8));
        const row = Math.floor(y / (tileSize + 8));

        if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
            return { row, col };
        }
        return null;
    };

    // Check if two positions are adjacent
    const areAdjacent = (p1: Position, p2: Position): boolean => {
        const rowDiff = Math.abs(p1.row - p2.row);
        const colDiff = Math.abs(p1.col - p2.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    };

    const handleTileClick = (pos: Position) => {
        if (disabled) return;

        if (!selectedPos) {
            setSelectedPos(pos);
            return;
        }

        // Check if same (deselect)
        if (selectedPos.row === pos.row && selectedPos.col === pos.col) {
            setSelectedPos(null);
            return;
        }

        // Must be adjacent
        const rowDiff = Math.abs(selectedPos.row - pos.row);
        const colDiff = Math.abs(selectedPos.col - pos.col);
        if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
            // Valid swap
            onMove(selectedPos, pos);
        }

        setSelectedPos(null);
    };

    // Mouse drag handlers
    const handleMouseDown = (pos: Position, e: React.MouseEvent) => {
        if (disabled) return;
        e.preventDefault();
        setDragStart(pos);
        setIsDragging(true);
        setSelectedPos(null);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !dragStart || disabled) return;

        const target = getTileAtPoint(e.clientX, e.clientY);
        if (target && areAdjacent(dragStart, target)) {
            onMove(dragStart, target);
            setDragStart(null);
            setIsDragging(false);
        }
    };

    // Touch drag handlers
    const handleTouchStart = (pos: Position, e: React.TouchEvent) => {
        if (disabled) return;
        e.preventDefault();
        setDragStart(pos);
        setIsDragging(true);
        setSelectedPos(null);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || !dragStart || disabled) return;

        const touch = e.touches[0];
        const target = getTileAtPoint(touch.clientX, touch.clientY);
        if (target && areAdjacent(dragStart, target)) {
            onMove(dragStart, target);
            setDragStart(null);
            setIsDragging(false);
        }
    };

    // Cleanup drag on mouse leave
    useEffect(() => {
        const handleGlobalMouseUp = () => {
            setIsDragging(false);
            setDragStart(null);
        };

        window.addEventListener('mouseup', handleGlobalMouseUp);
        window.addEventListener('touchend', handleGlobalMouseUp);

        return () => {
            window.removeEventListener('mouseup', handleGlobalMouseUp);
            window.removeEventListener('touchend', handleGlobalMouseUp);
        };
    }, []);

    // Flatten board into renderable tiles
    const tilesToRender: { tile: Tile, r: number, c: number }[] = [];
    board.forEach((row, r) => {
        row.forEach((tile, c) => {
            if (tile) tilesToRender.push({ tile, r, c });
        });
    });

    return (
        <div
            ref={containerRef}
            className="relative mx-auto touch-none select-none"
            style={{
                width: '100%',
                maxWidth: '500px',
                aspectRatio: '1/1'
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={() => { setIsDragging(false); setDragStart(null); }}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => { setIsDragging(false); setDragStart(null); }}
        >
            {/* Grid Background Slots (Visual guides) */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
                    gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
                    gap: '8px',
                    width: '100%',
                    height: '100%'
                }}
            >
                {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, i) => (
                    <div key={i} className="rounded-lg" style={{ backgroundColor: 'var(--color-fill-tertiary)', opacity: 0.3 }} />
                ))}
            </div>

            {/* Actual Tiles */}
            <div className="absolute top-0 left-0 w-full h-full">
                {tilesToRender.map(({ tile, r, c }) => (
                    <PetTile
                        key={tile.id}
                        tile={tile}
                        row={r}
                        col={c}
                        size={tileSize}
                        isSelected={selectedPos?.row === r && selectedPos?.col === c}
                        isMatched={tile.isMatched}
                        onClick={() => handleTileClick({ row: r, col: c })}
                        onMouseDown={(e) => handleMouseDown({ row: r, col: c }, e)}
                        onTouchStart={(e) => handleTouchStart({ row: r, col: c }, e)}
                    />
                ))}
            </div>
        </div>
    );
}
