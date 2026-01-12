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
            className="absolute inset-0 flex flex-col overflow-hidden select-none"
            style={{
                background: 'linear-gradient(180deg, #1e3a5f 0%, #102a43 100%)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
            }}
        >
            {/* Top Stats Bar - Ultra Compact */}
            <div className="h-12 flex-shrink-0 px-2 flex items-center justify-between bg-black/30 backdrop-blur-md border-b border-white/10">
                <button className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-90 rounded-lg text-white transition-all">
                    <BarChart3 size={16} />
                </button>

                <div className="flex gap-4 sm:gap-6">
                    <Stat label="MOVES" value={gameState.moves} />
                    <Stat label="TIME" value={formatTime(time)} />
                    <Stat label="SCORE" value={gameState.moves * 10} />
                </div>

                <div className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-90 rounded-lg text-white transition-all">
                    🐾
                </div>
            </div>

            {/* Game Area - ZERO margins, full screen utilization */}
            <div className="flex-1 overflow-x-hidden overflow-y-auto px-0.5 py-0.5 pb-16 touch-pan-y">
                {/* Top Row: Foundations (Left) + Deck/Waste (Right) */}
                <div className="flex justify-between items-start mb-2 gap-0.5">
                    {/* Foundations - Horizontal Grid */}
                    <div className="flex gap-0.5">
                        {(['hearts', 'diamonds', 'clubs', 'spades'] as Suit[]).map((suit, index) => (
                            <div key={suit} className="relative w-[13vw] max-w-[60px] aspect-[5/7]">
                                <div
                                    onClick={() => handleCardClick('foundation', index)}
                                    className="w-full h-full rounded-lg border-2 border-white/10 bg-black/20 flex items-center justify-center text-2xl text-white/20 cursor-pointer hover:bg-black/30 transition-colors"
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
                    <div className="flex gap-0.5">
                        {/* Waste */}
                        <div className="relative w-[13vw] max-w-[60px] aspect-[5/7]">
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
                            className="w-[13vw] max-w-[60px] aspect-[5/7] rounded-lg border-2 border-white/20 bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center cursor-pointer shadow-lg active:scale-95 transition-all"
                        >
                            {gameState.deck.length > 0 ? (
                                <span className="text-white/80 text-xl">🐾</span>
                            ) : (
                                <Undo2 className="text-white/60" size={22} />
                            )}
                        </div>
                    </div>
                </div>

                {/* Tableau - Maximized space, ZERO gaps */}
                <div className="grid grid-cols-7 gap-0.5">
                    {gameState.tableau.map((column, colIndex) => (
                        <div key={colIndex} className="flex flex-col">
                            {column.length === 0 && (
                                <div
                                    onClick={() => handleCardClick('tableau', colIndex)}
                                    className="w-full aspect-[5/7] rounded-lg border-2 border-dashed border-white/5 bg-black/10 flex items-center justify-center text-sm font-black text-white/5 cursor-pointer"
                                >
                                    K
                                </div>
                            )}

                            {column.map((card, cardIndex) => (
                                <div
                                    key={card.id}
                                    className="relative transition-all"
                                    style={{
                                        marginTop: cardIndex === 0 ? 0 : '-120%',
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

            {/* Bottom Action Bar - Discrete Play Button */}
            <div className="h-14 flex-shrink-0 bg-black/50 backdrop-blur-2xl border-t border-white/10 flex justify-around items-center px-1">
                <ActionBtn icon={<Settings size={18} />} label="Settings" onClick={() => toast('Configurações em breve')} />
                <ActionBtn icon={<Calendar size={18} />} label="Daily" onClick={() => toast('Desafios em breve')} />
                <ActionBtn icon={<Play size={18} />} label="New Game" onClick={handleNewGame} />
                <ActionBtn icon={<Lightbulb size={18} />} label="Hint" onClick={handleHint} />
                <ActionBtn icon={<Undo2 size={18} />} label="Undo" onClick={handleUndo} disabled={!gameState.moveHistory?.length} />
            </div>
        </div>
    );
}

function Stat({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="flex flex-col items-center">
            <span className="text-[8px] font-black tracking-[0.15em] text-white/50 mb-0.5">{label}</span>
            <span className="text-sm sm:text-base font-bold text-white leading-none tabular-nums drop-shadow-sm">{value}</span>
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
                flex flex-col items-center justify-center gap-0.5 min-w-[56px] transition-all active:scale-90
                ${disabled ? 'opacity-30 grayscale pointer-events-none' : 'opacity-100'}
            `}
        >
            <div className="text-white/80">
                {icon}
            </div>
            <span className="text-[9px] font-semibold text-white/50 tracking-tight">{label}</span>
        </button>
    );
}
