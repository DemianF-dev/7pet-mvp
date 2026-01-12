/**
 * PacienciaGame - Main game component
 * 
 * Fullscreen mobile-first Solitaire with compact layout
 * Redesigned for premium mobile experience.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, Card as CardType, Suit } from './types';
import {
    initializeGame,
    drawCard,
    canMoveToFoundation,
    canMoveToTableau,
    getMovableCards,
    flipTableauCard,
    checkWin,
    undoMove
} from './game-logic';
import Card from './components/Card';
import toast from 'react-hot-toast';
import { BarChart3, Calendar, Play, Lightbulb, Undo2, Settings, Trophy, Clock, Zap } from 'lucide-react';

interface PacienciaGameProps {
    onWin?: () => void;
}

const STORAGE_KEY = '7pet_paciencia_saved_game';
const DOUBLE_CLICK_DELAY = 300;

export default function PacienciaGame({ onWin }: PacienciaGameProps) {
    const [gameState, setGameState] = useState<GameState>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return initializeGame();
            }
        }
        return initializeGame();
    });

    const [time, setTime] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Save game state
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    }, [gameState]);

    // Timer logic
    useEffect(() => {
        if (!gameState.isPaused && gameState.moves > 0) {
            timerRef.current = setInterval(() => {
                setTime(t => t + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [gameState.isPaused, gameState.moves]);

    useEffect(() => {
        if (checkWin(gameState)) {
            toast.success('🎉 Parabéns! Você venceu!', { duration: 5000 });
            onWin?.();
        }
    }, [gameState, onWin]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const recordMove = useCallback((prev: GameState, newState: Partial<GameState>) => {
        const { moveHistory, ...stateToSave } = prev;
        return {
            ...prev,
            ...newState,
            moveHistory: [...(prev.moveHistory || []), stateToSave],
            moves: prev.moves + 1
        };
    }, []);

    const handleNewGame = useCallback(() => {
        if (gameState.moves > 0 && !window.confirm('Iniciar novo jogo e perder o progresso atual?')) return;
        setGameState(initializeGame());
        setTime(0);
        toast.success('Novo jogo! 🐾');
    }, [gameState.moves]);

    const handleUndo = useCallback(() => {
        setGameState(prev => undoMove(prev));
    }, []);

    const handleDrawCard = useCallback(() => {
        setGameState(prev => recordMove(prev, drawCard(prev)));
    }, [recordMove]);

    const lastClickRef = useRef<{ time: number; source: string; pileIndex?: number; cardIndex?: number } | null>(null);

    const handleCardClick = useCallback((
        source: 'waste' | 'foundation' | 'tableau',
        pileIndex?: number,
        cardIndex?: number
    ) => {
        const now = Date.now();
        const lastClick = lastClickRef.current;

        const isDoubleClick = lastClick &&
            (now - lastClick.time) < DOUBLE_CLICK_DELAY &&
            lastClick.source === source &&
            lastClick.pileIndex === pileIndex &&
            lastClick.cardIndex === cardIndex;

        lastClickRef.current = { time: now, source, pileIndex, cardIndex };

        // Double-click auto-move to foundation
        if (isDoubleClick && source !== 'foundation') {
            setGameState(prev => {
                let card: CardType | null = null;

                if (source === 'waste' && prev.waste.length > 0) {
                    card = prev.waste[prev.waste.length - 1];
                } else if (source === 'tableau' && pileIndex !== undefined) {
                    const pile = prev.tableau[pileIndex];
                    const lastIdx = pile.length - 1;
                    if (lastIdx >= 0 && pile[lastIdx]?.faceUp) {
                        card = pile[lastIdx];
                    }
                }

                if (!card) return prev;

                const foundation = prev.foundations[card.suit];
                if (!canMoveToFoundation(card, foundation)) {
                    toast('Não pode mover ainda', { icon: '💡' });
                    return prev;
                }

                const newState = { ...prev };

                if (source === 'waste') {
                    newState.waste = prev.waste.slice(0, -1);
                } else if (source === 'tableau' && pileIndex !== undefined) {
                    newState.tableau = [...prev.tableau];
                    newState.tableau[pileIndex] = prev.tableau[pileIndex].slice(0, -1);
                    newState.tableau = flipTableauCard(newState.tableau);
                }

                newState.foundations = { ...prev.foundations };
                newState.foundations[card.suit] = [...foundation, card];

                return recordMove(prev, newState);
            });
            return;
        }

        // Single click logic
        setGameState(prev => {
            if (!prev.selected) {
                if (source === 'waste' && prev.waste.length === 0) return prev;
                if (source === 'foundation') return prev;

                if (source === 'tableau' && pileIndex !== undefined) {
                    const tableau = prev.tableau[pileIndex];
                    if (tableau.length === 0) return prev;
                    if (cardIndex === undefined || !tableau[cardIndex]?.faceUp) return prev;
                }

                return { ...prev, selected: { source, pileIndex, cardIndex } };
            }

            const { selected } = prev;

            if (selected.source === source &&
                selected.pileIndex === pileIndex &&
                selected.cardIndex === cardIndex) {
                return { ...prev, selected: null };
            }

            let cardToMove: CardType | null = null;
            let cardsToMove: CardType[] = [];

            if (selected.source === 'waste') {
                cardToMove = prev.waste[prev.waste.length - 1];
                cardsToMove = [cardToMove];
            } else if (selected.source === 'tableau' && selected.pileIndex !== undefined && selected.cardIndex !== undefined) {
                cardsToMove = getMovableCards(prev.tableau[selected.pileIndex], selected.cardIndex);
                if (cardsToMove.length === 0) return { ...prev, selected: null };
                cardToMove = cardsToMove[0];
            }

            if (!cardToMove) return { ...prev, selected: null };

            // Move to foundation
            if (source === 'foundation' && pileIndex !== undefined && cardsToMove.length === 1) {
                const suit = (['hearts', 'diamonds', 'clubs', 'spades'] as Suit[])[pileIndex];
                const foundation = prev.foundations[suit];

                if (canMoveToFoundation(cardToMove, foundation)) {
                    const newState = { ...prev };

                    if (selected.source === 'waste') {
                        newState.waste = newState.waste.slice(0, -1);
                    } else if (selected.source === 'tableau' && selected.pileIndex !== undefined) {
                        newState.tableau = [...prev.tableau];
                        newState.tableau[selected.pileIndex] = prev.tableau[selected.pileIndex].slice(0, selected.cardIndex);
                        newState.tableau = flipTableauCard(newState.tableau);
                    }

                    newState.foundations = { ...prev.foundations };
                    newState.foundations[suit] = [...foundation, cardToMove];
                    newState.selected = null;

                    return recordMove(prev, newState);
                } else {
                    toast('Movimento inválido', { icon: '💡' });
                    return { ...prev, selected: null };
                }
            }

            // Move to tableau
            if (source === 'tableau' && pileIndex !== undefined) {
                const targetTableau = prev.tableau[pileIndex];

                if (canMoveToTableau(cardToMove, targetTableau)) {
                    const newState = { ...prev };

                    if (selected.source === 'waste') {
                        newState.waste = newState.waste.slice(0, -1);
                    } else if (selected.source === 'tableau' && selected.pileIndex !== undefined) {
                        newState.tableau = [...prev.tableau];
                        newState.tableau[selected.pileIndex] = prev.tableau[selected.pileIndex].slice(0, selected.cardIndex);
                        newState.tableau = flipTableauCard(newState.tableau);
                    }

                    newState.tableau = [...(newState.tableau || prev.tableau)];
                    newState.tableau[pileIndex] = [...targetTableau, ...cardsToMove];
                    newState.selected = null;

                    return recordMove(prev, newState);
                } else {
                    toast('Movimento inválido', { icon: '💡' });
                    return { ...prev, selected: null };
                }
            }

            return { ...prev, selected: null };
        });
    }, [recordMove]);

    const handleHint = useCallback(() => {
        // Simple hint: check if any tableau card can move to foundation
        for (let i = 0; i < gameState.tableau.length; i++) {
            const pile = gameState.tableau[i];
            if (pile.length === 0) continue;
            const topCard = pile[pile.length - 1];
            if (!topCard.faceUp) continue;

            for (const suit in gameState.foundations) {
                if (canMoveToFoundation(topCard, gameState.foundations[suit as Suit])) {
                    toast(`Dica: Mova o ${topCard.rank} de ${topCard.suit} para a fundação`, { icon: '💡' });
                    setGameState(prev => ({ ...prev, selected: { source: 'tableau', pileIndex: i, cardIndex: pile.length - 1 } }));
                    return;
                }
            }
        }

        // Secondary hint: check if waste card can move to foundation
        if (gameState.waste.length > 0) {
            const topCard = gameState.waste[gameState.waste.length - 1];
            for (const suit in gameState.foundations) {
                if (canMoveToFoundation(topCard, gameState.foundations[suit as Suit])) {
                    toast(`Dica: Mova o ${topCard.rank} de ${topCard.suit} do lixo para a fundação`, { icon: '💡' });
                    setGameState(prev => ({ ...prev, selected: { source: 'waste' } }));
                    return;
                }
            }
        }

        toast('Nenhum movimento óbvio encontrado...', { icon: '🔍' });
    }, [gameState]);

    const getSuitSymbol = (suit: Suit) => ({ hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }[suit]);

    return (
        <div
            className="absolute inset-0 flex flex-col overflow-hidden select-none bg-rose-50"
            style={{
                fontFamily: 'Quicksand, "Varela Round", sans-serif' // Fallback to soft fonts
            }}
        >
            {/* Cute Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(#fb7185 2px, transparent 2px)',
                    backgroundSize: '32px 32px'
                }}
            />

            {/* Top Stats Bar - Cute & Compact */}
            <div className="h-14 flex-shrink-0 px-4 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-rose-100 z-10 shadow-sm">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => window.history.back()}
                        className="w-9 h-9 flex items-center justify-center bg-rose-100 hover:bg-rose-200 active:scale-90 rounded-2xl text-rose-600 transition-all shadow-sm border border-rose-200"
                        title="Sair"
                    >
                        <Undo2 size={18} className="rotate-90" />
                    </button>
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-rose-50 rounded-2xl border border-rose-100">
                        <span className="text-xl">🐶</span>
                        <span className="text-sm font-bold text-rose-800">Paciência Pet</span>
                    </div>
                </div>

                <div className="flex gap-4 sm:gap-8">
                    <Stat label="MOVIMENTOS" value={gameState.moves} icon={<Zap size={10} className="text-amber-400" />} />
                    <Stat label="TEMPO" value={formatTime(time)} icon={<Clock size={10} className="text-blue-400" />} />
                    <Stat label="PONTOS" value={gameState.moves * 10} icon={<Trophy size={10} className="text-yellow-500" />} />
                </div>

                <div className="w-9 h-9 flex items-center justify-center bg-indigo-100 hover:bg-indigo-200 active:scale-90 rounded-2xl text-indigo-600 transition-all shadow-sm border border-indigo-200">
                    <Settings size={18} />
                </div>
            </div>

            {/* Game Area - Centered & Contained */}
            <div className="flex-1 overflow-x-hidden overflow-y-auto w-full max-w-[500px] mx-auto px-2 py-4 z-0 touch-pan-y">
                {/* Top Row: Foundations + Deck */}
                <div className="flex justify-between items-start mb-6 gap-2">
                    {/* Foundations - 2x2 Grid for cuteness/compactness or horizontal depending on preference. Keeping horizontal for standard gameplay but styling it cute. */}
                    <div className="flex gap-2">
                        {(['hearts', 'diamonds', 'clubs', 'spades'] as Suit[]).map((suit, index) => (
                            <div key={suit} className="relative w-[13vw] max-w-[64px] aspect-[5/7]">
                                <div
                                    onClick={() => handleCardClick('foundation', index)}
                                    className="w-full h-full rounded-2xl border-2 border-dashed border-rose-200 bg-white/50 flex items-center justify-center text-2xl text-rose-200 cursor-pointer hover:bg-white/80 transition-colors shadow-inner"
                                >
                                    {getSuitSymbol(suit)}
                                </div>
                                {gameState.foundations[suit].length > 0 && (
                                    <div className="absolute inset-0">
                                        <Card
                                            card={gameState.foundations[suit][gameState.foundations[suit].length - 1]}
                                            isClickable={false}
                                            style={{ width: '100%', height: '100%' }}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Deck + Waste */}
                    <div className="flex gap-2">
                        {/* Waste */}
                        <div className="relative w-[13vw] max-w-[64px] aspect-[5/7]">
                            {gameState.waste.length > 0 && (
                                <div onClick={() => handleCardClick('waste')}>
                                    <Card
                                        card={gameState.waste[gameState.waste.length - 1]}
                                        isSelected={gameState.selected?.source === 'waste'}
                                        isClickable={true}
                                        style={{ width: '100%', height: '100%' }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Deck */}
                        <div
                            onClick={handleDrawCard}
                            className="w-[13vw] max-w-[64px] aspect-[5/7] rounded-2xl border-4 border-white bg-gradient-to-br from-rose-400 to-orange-400 flex items-center justify-center cursor-pointer shadow-md hover:shadow-lg active:scale-95 transition-all relative overflow-hidden"
                        >
                            <div className="absolute inset-0 opacity-20"
                                style={{
                                    backgroundImage: 'radial-gradient(white 2px, transparent 2px)',
                                    backgroundSize: '12px 12px'
                                }}
                            />
                            {gameState.deck.length > 0 ? (
                                <span className="text-white text-3xl drop-shadow-md">🐾</span>
                            ) : (
                                <Undo2 className="text-white/80" size={24} />
                            )}
                            <div className="absolute bottom-1 right-2 text-[10px] font-bold text-white/90">
                                {gameState.deck.length}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tableau */}
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                    {gameState.tableau.map((column, colIndex) => (
                        <div key={colIndex} className="flex flex-col items-center">
                            {column.length === 0 && (
                                <div
                                    onClick={() => handleCardClick('tableau', colIndex)}
                                    className="w-full aspect-[5/7] rounded-2xl border-2 border-dashed border-rose-200 bg-white/30 flex items-center justify-center text-xs font-bold text-rose-200 cursor-pointer"
                                >

                                </div>
                            )}

                            {column.map((card, cardIndex) => (
                                <div
                                    key={card.id}
                                    className="relative transition-all w-full"
                                    style={{
                                        marginTop: cardIndex === 0 ? 0 : '-130%',
                                        zIndex: cardIndex
                                    }}
                                >
                                    <div onClick={() => handleCardClick('tableau', colIndex, cardIndex)}>
                                        <Card
                                            card={card}
                                            isSelected={
                                                gameState.selected?.source === 'tableau' &&
                                                gameState.selected.pileIndex === colIndex &&
                                                gameState.selected.cardIndex !== undefined &&
                                                cardIndex >= gameState.selected.cardIndex
                                            }
                                            isClickable={card.faceUp}
                                            style={{
                                                width: '100%',
                                                height: 'auto',
                                                aspectRatio: '5/7'
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Floating Action Bar */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl border border-rose-100 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-1.5 flex gap-1 z-20">
                <ActionBtn icon={<Play size={20} className="fill-emerald-500 text-emerald-600" />} label="Novo" onClick={handleNewGame} />
                <div className="w-px h-8 bg-gray-200 my-auto mx-1" />
                <ActionBtn icon={<Lightbulb size={20} className="fill-yellow-400 text-yellow-500" />} label="Dica" onClick={handleHint} />
                <ActionBtn icon={<Undo2 size={20} className="text-blue-500" />} label="Voltar" onClick={handleUndo} disabled={!gameState.moveHistory?.length} />
            </div>
        </div>
    );
}

function Stat({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold tracking-wider text-rose-400 mb-0.5 flex items-center gap-1">
                {icon} {label}
            </span>
            <span className="text-base font-black text-rose-900 leading-none tabular-nums">{value}</span>
        </div>
    );
}

function ActionBtn({
    icon,
    label,
    onClick,
    disabled
}: {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                w-12 h-12 flex flex-col items-center justify-center rounded-full hover:bg-rose-50 active:scale-95 transition-all
                ${disabled ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}
            `}
            title={label}
        >
            <div className="mb-0.5">
                {icon}
            </div>
        </button>
    );
}
