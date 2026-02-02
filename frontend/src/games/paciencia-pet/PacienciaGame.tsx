/**
 * Paciência Pet - The Clean One Style
 * Com drag & drop, double-click para auto-move, e clique para selecionar/mover
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
    Palette,
    RotateCcw,
    Undo2,
    Lightbulb,
    ChevronLeft,
    Trophy
} from 'lucide-react';
import toast from 'react-hot-toast';
import { GameState, Suit, Card as CardType, THEMES } from './types';
import {
    initializeGame,
    drawCard,
    executeMove,
    undoMove,
    tryAutoMoveToFoundation,
    checkWin,
    findAutoMove
} from './game-logic';
import Card, { EmptySlot, StockPile } from './components/Card';
import Confetti, { WinText } from './components/Confetti';
import { useNavigate } from 'react-router-dom';
import './styles.css';

const STORAGE_KEY = '7pet_paciencia_clean_state';
const THEME_KEY = '7pet_paciencia_theme';
const SUITS_LIST: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

interface DragInfo {
    source: 'waste' | 'tableau' | 'foundation';
    pileIndex?: number;
    cardIndex?: number;
    cards: CardType[];
}

export default function PacienciaGame() {
    const navigate = useNavigate();

    // Theme
    const [themeIndex, setThemeIndex] = useState(() => {
        const saved = localStorage.getItem(THEME_KEY);
        return saved ? parseInt(saved, 10) : 0;
    });
    const theme = THEMES[themeIndex];

    // Game state
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

    // UI state
    const [time, setTime] = useState(0);
    const [showConfetti, setShowConfetti] = useState(false);
    const [showWinText, setShowWinText] = useState(false);
    const [hasWon, setHasWon] = useState(false);
    const [dragInfo, setDragInfo] = useState<DragInfo | null>(null);
    const [dropTarget, setDropTarget] = useState<{ type: 'foundation' | 'tableau'; index: number } | null>(null);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Persist state
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    }, [gameState]);

    useEffect(() => {
        localStorage.setItem(THEME_KEY, themeIndex.toString());
    }, [themeIndex]);

    // Timer
    useEffect(() => {
        if (!gameState.isPaused && gameState.moves > 0 && !hasWon) {
            timerRef.current = setInterval(() => {
                setTime(t => t + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [gameState.isPaused, gameState.moves, hasWon]);

    // Check win
    useEffect(() => {
        if (checkWin(gameState) && !hasWon) {
            setHasWon(true);
            setShowConfetti(true);
            setShowWinText(true);
            toast.success('Parabens! Voce venceu!', { duration: 5000 });
        }
    }, [gameState, hasWon]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // ========== GAME ACTIONS ==========

    const handleNewGame = useCallback(() => {
        if (gameState.moves > 0 && !window.confirm('Iniciar novo jogo?')) return;
        setGameState(initializeGame());
        setTime(0);
        setHasWon(false);
        setShowConfetti(false);
        setShowWinText(false);
        toast.success('Novo jogo iniciado!');
    }, [gameState.moves]);

    const handleUndo = useCallback(() => {
        if (gameState.moveHistory.length === 0) return;
        setGameState(prev => undoMove(prev));
    }, [gameState.moveHistory.length]);

    const handleDraw = useCallback(() => {
        if (hasWon) return;
        setGameState(prev => {
            const { deck, waste } = drawCard(prev);
            return {
                ...prev,
                deck,
                waste,
                selected: null,
                moves: prev.moves + 1,
                moveHistory: [...prev.moveHistory, { ...prev, moveHistory: [] }]
            };
        });
    }, [hasWon]);

    const handleHint = useCallback(() => {
        const move = findAutoMove(gameState);
        if (move) {
            // Executar a jogada automaticamente
            setGameState(prev => {
                const fromInfo = {
                    source: move.from as 'waste' | 'tableau',
                    pileIndex: move.pileIndex,
                    cardIndex: move.cardIndex
                };

                if (move.to === 'foundation') {
                    const card = move.from === 'waste'
                        ? prev.waste[prev.waste.length - 1]
                        : prev.tableau[move.pileIndex!][move.cardIndex!];

                    const result = tryAutoMoveToFoundation(prev, card, fromInfo);
                    return result || prev;
                } else {
                    const result = executeMove(prev, fromInfo, {
                        source: 'tableau',
                        pileIndex: move.toPileIndex
                    });
                    return result || prev;
                }
            });
            toast.success('Jogada automatica!');
        } else {
            toast('Sem jogadas automaticas disponiveis');
        }
    }, [gameState]);

    // ========== CLICK HANDLERS ==========

    // Clique simples - selecionar ou mover
    const handleCardClick = useCallback((
        source: 'waste' | 'tableau' | 'foundation',
        pileIndex?: number,
        cardIndex?: number
    ) => {
        if (hasWon) return;

        setGameState(prev => {
            // Caso 1: Nenhuma selecao - selecionar a carta
            if (!prev.selected) {
                if (source === 'waste' && prev.waste.length > 0) {
                    return { ...prev, selected: { source, pileIndex, cardIndex: prev.waste.length - 1 } };
                }
                if (source === 'tableau' && pileIndex !== undefined && cardIndex !== undefined) {
                    const card = prev.tableau[pileIndex][cardIndex];
                    if (card && card.faceUp) {
                        return { ...prev, selected: { source, pileIndex, cardIndex } };
                    }
                }
                if (source === 'foundation' && pileIndex !== undefined) {
                    const suit = SUITS_LIST[pileIndex];
                    if (prev.foundations[suit].length > 0) {
                        return { ...prev, selected: { source, pileIndex } };
                    }
                }
                return prev;
            }

            // Caso 2: Ja tem selecao - tentar mover ou reselecionar
            const selected = prev.selected;

            // Deselecionar se clicar no mesmo lugar
            if (selected.source === source &&
                selected.pileIndex === pileIndex &&
                (selected.cardIndex === cardIndex || (source === 'waste') || (source === 'foundation'))) {
                return { ...prev, selected: null };
            }

            // Tentar executar movimento
            const fromInfo = {
                source: selected.source as 'waste' | 'foundation' | 'tableau',
                pileIndex: selected.pileIndex,
                cardIndex: selected.cardIndex
            };

            // Destino: Foundation
            if (source === 'foundation' && pileIndex !== undefined) {
                const result = executeMove(prev, fromInfo, { source: 'foundation', pileIndex });
                if (result) return result;
            }

            // Destino: Tableau
            if (source === 'tableau' && pileIndex !== undefined) {
                const result = executeMove(prev, fromInfo, { source: 'tableau', pileIndex });
                if (result) return result;

                // Se nao conseguiu mover, tentar selecionar a nova carta
                if (cardIndex !== undefined) {
                    const card = prev.tableau[pileIndex][cardIndex];
                    if (card && card.faceUp) {
                        return { ...prev, selected: { source, pileIndex, cardIndex } };
                    }
                }
            }

            // Se nao conseguiu mover nem selecionar, limpar selecao
            return { ...prev, selected: null };
        });
    }, [hasWon]);

    // Double-click - auto move para foundation
    const handleDoubleClick = useCallback((
        source: 'waste' | 'tableau',
        pileIndex?: number,
        cardIndex?: number
    ) => {
        if (hasWon) return;

        setGameState(prev => {
            let card: CardType | null = null;

            if (source === 'waste' && prev.waste.length > 0) {
                card = prev.waste[prev.waste.length - 1];
            } else if (source === 'tableau' && pileIndex !== undefined) {
                const col = prev.tableau[pileIndex];
                const idx = cardIndex !== undefined ? cardIndex : col.length - 1;
                // So pode auto-mover a carta do topo
                if (idx === col.length - 1 && col[idx]?.faceUp) {
                    card = col[idx];
                }
            }

            if (!card) return prev;

            const result = tryAutoMoveToFoundation(prev, card, {
                source,
                pileIndex,
                cardIndex: cardIndex !== undefined ? cardIndex : (source === 'tableau' && pileIndex !== undefined ? prev.tableau[pileIndex].length - 1 : undefined)
            });

            return result || prev;
        });
    }, [hasWon]);

    // ========== DRAG & DROP HANDLERS ==========

    const handleDragStart = useCallback((
        source: 'waste' | 'tableau' | 'foundation',
        pileIndex?: number,
        cardIndex?: number
    ) => {
        if (hasWon) return;

        let cards: CardType[] = [];

        if (source === 'waste' && gameState.waste.length > 0) {
            cards = [gameState.waste[gameState.waste.length - 1]];
        } else if (source === 'tableau' && pileIndex !== undefined && cardIndex !== undefined) {
            const col = gameState.tableau[pileIndex];
            if (col[cardIndex]?.faceUp) {
                cards = col.slice(cardIndex);
            }
        } else if (source === 'foundation' && pileIndex !== undefined) {
            const suit = SUITS_LIST[pileIndex];
            const fnd = gameState.foundations[suit];
            if (fnd.length > 0) {
                cards = [fnd[fnd.length - 1]];
            }
        }

        if (cards.length > 0) {
            setDragInfo({ source, pileIndex, cardIndex, cards });
        }
    }, [gameState, hasWon]);

    const handleDragEnd = useCallback(() => {
        setDragInfo(null);
        setDropTarget(null);
    }, []);

    const handleDragOver = useCallback((type: 'foundation' | 'tableau', index: number) => {
        setDropTarget({ type, index });
    }, []);

    const handleDrop = useCallback((type: 'foundation' | 'tableau', index: number) => {
        if (!dragInfo || hasWon) {
            setDragInfo(null);
            setDropTarget(null);
            return;
        }

        setGameState(prev => {
            const fromInfo = {
                source: dragInfo.source,
                pileIndex: dragInfo.pileIndex,
                cardIndex: dragInfo.cardIndex
            };

            const result = executeMove(prev, fromInfo, {
                source: type,
                pileIndex: index
            });

            return result || prev;
        });

        setDragInfo(null);
        setDropTarget(null);
    }, [dragInfo, hasWon]);

    // ========== RENDER ==========

    return (
        <div className="clean-solitaire-root" style={{ backgroundColor: theme.bg }}>
            <Confetti isActive={showConfetti} onComplete={() => setShowConfetti(false)} />
            <WinText isVisible={showWinText} />

            {/* Header */}
            <header className="clean-header">
                <button
                    className="icon-btn"
                    onClick={() => navigate('/pausa')}
                    aria-label="Voltar"
                >
                    <ChevronLeft size={24} color="white" />
                </button>

                <div className="header-center">
                    <div className="time-display">{formatTime(time)}</div>
                    <div className="score-display">
                        <Trophy size={14} />
                        <span>{gameState.score}</span>
                    </div>
                </div>

                <button
                    className="icon-btn"
                    onClick={() => setThemeIndex(i => (i + 1) % THEMES.length)}
                    aria-label="Trocar tema"
                >
                    <Palette size={24} color="white" />
                </button>
            </header>

            {/* Game Board */}
            <main className="clean-board">
                {/* Top Row: Foundations + Stock/Waste */}
                <div className="board-row top">
                    {/* Foundations */}
                    <div className="foundations">
                        {SUITS_LIST.map((suit, idx) => {
                            const fnd = gameState.foundations[suit];
                            const isDropTarget = dropTarget?.type === 'foundation' && dropTarget.index === idx;

                            return (
                                <div
                                    key={suit}
                                    className="slot-wrapper"
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        handleDragOver('foundation', idx);
                                    }}
                                    onDragLeave={() => setDropTarget(null)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        handleDrop('foundation', idx);
                                    }}
                                >
                                    {fnd.length === 0 ? (
                                        <EmptySlot
                                            suit={suit}
                                            theme={theme}
                                            onClick={() => handleCardClick('foundation', idx)}
                                            isHighlighted={isDropTarget}
                                        />
                                    ) : (
                                        <Card
                                            card={fnd[fnd.length - 1]}
                                            theme={theme}
                                            isSelected={
                                                gameState.selected?.source === 'foundation' &&
                                                gameState.selected?.pileIndex === idx
                                            }
                                            onClick={() => handleCardClick('foundation', idx)}
                                            onDragStart={() => handleDragStart('foundation', idx)}
                                            onDragEnd={handleDragEnd}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Stock and Waste */}
                    <div className="stock-waste">
                        <div className="slot-wrapper waste">
                            {gameState.waste.length > 0 ? (
                                <Card
                                    card={gameState.waste[gameState.waste.length - 1]}
                                    theme={theme}
                                    isSelected={gameState.selected?.source === 'waste'}
                                    onClick={() => handleCardClick('waste')}
                                    onDoubleClick={() => handleDoubleClick('waste')}
                                    onDragStart={() => handleDragStart('waste')}
                                    onDragEnd={handleDragEnd}
                                />
                            ) : (
                                <div className="clean-card dummy" />
                            )}
                        </div>

                        <div className="slot-wrapper stock">
                            <StockPile
                                count={gameState.deck.length}
                                theme={theme}
                                onClick={handleDraw}
                            />
                        </div>
                    </div>
                </div>

                {/* Tableau */}
                <div className="board-row tableau">
                    {gameState.tableau.map((column, colIdx) => {
                        const isDropTarget = dropTarget?.type === 'tableau' && dropTarget.index === colIdx;

                        return (
                            <div
                                key={colIdx}
                                className="tableau-col"
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    handleDragOver('tableau', colIdx);
                                }}
                                onDragLeave={() => setDropTarget(null)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    handleDrop('tableau', colIdx);
                                }}
                                onClick={() => {
                                    if (column.length === 0) {
                                        handleCardClick('tableau', colIdx);
                                    }
                                }}
                            >
                                {column.length === 0 && (
                                    <EmptySlot
                                        theme={theme}
                                        isHighlighted={isDropTarget}
                                    />
                                )}

                                {column.map((card, cardIdx) => {
                                    const isSelected =
                                        gameState.selected?.source === 'tableau' &&
                                        gameState.selected?.pileIndex === colIdx &&
                                        gameState.selected?.cardIndex === cardIdx;

                                    const offset = window.innerWidth < 640 ? 20 : 28;

                                    return (
                                        <div
                                            key={card.id}
                                            className="card-stack-wrapper"
                                            style={{
                                                top: `${cardIdx * offset}px`,
                                                zIndex: cardIdx + 1
                                            }}
                                        >
                                            <Card
                                                card={card}
                                                theme={theme}
                                                isSelected={isSelected}
                                                isClickable={card.faceUp}
                                                isDraggable={card.faceUp}
                                                onClick={() => handleCardClick('tableau', colIdx, cardIdx)}
                                                onDoubleClick={() => handleDoubleClick('tableau', colIdx, cardIdx)}
                                                onDragStart={() => handleDragStart('tableau', colIdx, cardIdx)}
                                                onDragEnd={handleDragEnd}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* Footer */}
            <footer className="clean-footer">
                <button
                    className="footer-circle-btn"
                    onClick={handleNewGame}
                    aria-label="Novo jogo"
                >
                    <RotateCcw size={20} />
                </button>

                <button
                    className="footer-circle-btn"
                    onClick={handleUndo}
                    disabled={gameState.moveHistory.length === 0}
                    aria-label="Desfazer"
                    style={{ opacity: gameState.moveHistory.length === 0 ? 0.4 : 1 }}
                >
                    <Undo2 size={20} />
                </button>

                <button
                    className="footer-circle-btn"
                    onClick={handleHint}
                    aria-label="Dica"
                >
                    <Lightbulb size={20} />
                </button>
            </footer>
        </div>
    );
}
