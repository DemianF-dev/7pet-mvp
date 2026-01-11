/**
 * PacienciaGame - Main game component
 * 
 * Implements the Klondike Solitaire game with drag-and-drop + click-to-move.
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
    checkWin
} from './game-logic';
import Card from './components/Card';
import Confetti from './components/Confetti';
import toast from 'react-hot-toast';
import '../../styles/design-system-base.css';

interface PacienciaGameProps {
    onWin?: () => void;
    reducedMotion?: boolean;
}

const STORAGE_KEY = '7pet_paciencia_saved_game';

// Drag data type
interface DragData {
    source: 'waste' | 'tableau';
    pileIndex?: number;
    cardIndex?: number;
    cards: CardType[];
}

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
    const [showConfetti, setShowConfetti] = useState(false);

    const dragDataRef = useRef<DragData | null>(null);

    // Save game state
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    }, [gameState]);

    // Check win
    useEffect(() => {
        if (checkWin(gameState)) {
            setShowConfetti(true);
            toast.success('🎉 Parabéns! Você venceu!', { duration: 5000 });
            onWin?.();
        }
    }, [gameState, onWin]);

    const handleNewGame = useCallback(() => {
        setGameState(initializeGame());
        toast.success('Novo jogo iniciado! 🐾');
    }, []);

    const handleClearProgress = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setGameState(initializeGame());
        toast('Progresso limpo!');
    }, []);

    const handleDrawCard = useCallback(() => {
        setGameState(prev => ({
            ...drawCard(prev),
            moves: prev.moves + 1,
            selected: null
        }));
    }, []);

    // Drag handlers (support both mouse and touch)
    const handleDragStart = useCallback((
        e: React.DragEvent | React.TouchEvent,
        source: 'waste' | 'tableau',
        pileIndex?: number,
        cardIndex?: number
    ) => {
        let cards: CardType[] = [];

        if (source === 'waste') {
            cards = [gameState.waste[gameState.waste.length - 1]];
        } else if (source === 'tableau' && pileIndex !== undefined && cardIndex !== undefined) {
            cards = getMovableCards(gameState.tableau[pileIndex], cardIndex);
        }

        if (cards.length === 0) {
            e.preventDefault();
            return;
        }

        dragDataRef.current = { source, pileIndex, cardIndex, cards };

        // Only set dataTransfer for drag events (not touch)
        if ('dataTransfer' in e) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', 'card');
        }
    }, [gameState]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDropOnFoundation = useCallback((e: React.DragEvent, foundationIndex: number) => {
        e.preventDefault();
        const dragData = dragDataRef.current;
        if (!dragData || dragData.cards.length !== 1) return;

        const card = dragData.cards[0];
        const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
        const targetSuit = suits[foundationIndex];

        setGameState(prev => {
            const foundation = prev.foundations[targetSuit];

            if (!canMoveToFoundation(card, foundation)) {
                toast('Movimento inválido', { icon: '💡' });
                return prev;
            }

            const newState = { ...prev };

            // Remove from source
            if (dragData.source === 'waste') {
                newState.waste = prev.waste.slice(0, -1);
            } else if (dragData.source === 'tableau' && dragData.pileIndex !== undefined) {
                newState.tableau = [...prev.tableau];
                newState.tableau[dragData.pileIndex] = prev.tableau[dragData.pileIndex].slice(0, dragData.cardIndex);
                newState.tableau = flipTableauCard(newState.tableau);
            }

            // Add to foundation
            newState.foundations = { ...prev.foundations };
            newState.foundations[targetSuit] = [...foundation, card];
            newState.moves += 1;
            newState.selected = null;

            return newState;
        });

        dragDataRef.current = null;
    }, []);

    const handleDropOnTableau = useCallback((e: React.DragEvent, targetPileIndex: number) => {
        e.preventDefault();
        const dragData = dragDataRef.current;
        if (!dragData) return;

        const card = dragData.cards[0];

        setGameState(prev => {
            const targetTableau = prev.tableau[targetPileIndex];

            if (!canMoveToTableau(card, targetTableau)) {
                if (targetTableau.length === 0 && card.rank !== 'K') {
                    toast('Só Reis em colunas vazias', { icon: '💡' });
                } else {
                    toast('Alterne cores, ordem decrescente', { icon: '💡' });
                }
                return prev;
            }

            const newState = { ...prev };

            // Remove from source
            if (dragData.source === 'waste') {
                newState.waste = prev.waste.slice(0, -1);
            } else if (dragData.source === 'tableau' && dragData.pileIndex !== undefined) {
                newState.tableau = [...prev.tableau];
                newState.tableau[dragData.pileIndex] = prev.tableau[dragData.pileIndex].slice(0, dragData.cardIndex);
                newState.tableau = flipTableauCard(newState.tableau);
            }

            // Add to tableau
            if (!newState.tableau) newState.tableau = [...prev.tableau];
            newState.tableau[targetPileIndex] = [...targetTableau, ...dragData.cards];
            newState.moves += 1;
            newState.selected = null;

            return newState;
        });

        dragDataRef.current = null;
    }, []);

    // Double-click to auto-move to foundation
    const handleDoubleClick = useCallback((
        source: 'waste' | 'tableau',
        pileIndex?: number,
        cardIndex?: number
    ) => {
        setGameState(prev => {
            let card: CardType | null = null;

            if (source === 'waste' && prev.waste.length > 0) {
                card = prev.waste[prev.waste.length - 1];
            } else if (source === 'tableau' && pileIndex !== undefined) {
                const pile = prev.tableau[pileIndex];
                const idx = cardIndex ?? pile.length - 1;
                if (idx === pile.length - 1 && pile[idx]?.faceUp) {
                    card = pile[idx];
                }
            }

            if (!card) return prev;

            const foundation = prev.foundations[card.suit];
            if (!canMoveToFoundation(card, foundation)) {
                toast('Carta não pode ir para fundação ainda', { icon: '💡' });
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
            newState.moves += 1;
            newState.selected = null;

            toast.success('Movido! 🎯', { duration: 1000 });
            return newState;
        });
    }, []);

    const getSuitSymbol = (suit: Suit) => ({ hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }[suit]);

    return (
        <div className="page-container">
            <Confetti show={showConfetti} onComplete={() => setShowConfetti(false)} />
            <div className="page-content">
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                    <div>
                        <h1 style={{ fontSize: 'var(--font-size-title2)', fontWeight: 'var(--font-weight-bold)', margin: 0 }}>Paciência Pet 🐾</h1>
                        <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>Movimentos: {gameState.moves}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                        <button onClick={handleNewGame} className="interactive" style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', cursor: 'pointer' }}>
                            Novo Jogo
                        </button>
                        <button onClick={handleClearProgress} className="interactive" style={{ padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                            Limpar
                        </button>
                    </div>
                </div>

                {/* Game board */}
                <div className="card card-padding-lg">
                    {/* Top row */}
                    <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
                        {/* Deck */}
                        <div
                            onClick={handleDrawCard}
                            className="interactive"
                            style={{
                                width: '70px',
                                height: '98px',
                                borderRadius: 'var(--radius-lg)',
                                border: '2px dashed var(--color-border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                background: 'linear-gradient(135deg, var(--color-fill-quaternary) 0%, var(--color-fill-tertiary) 100%)',
                                fontSize: 'var(--font-size-title2)',
                                transition: 'all var(--duration-fast) var(--ease-out-apple)',
                                transform: 'scale(1)',
                                boxShadow: 'var(--shadow-sm)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)';
                                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                            }}
                        >
                            {gameState.deck.length > 0 ? ('🎴') : ('🔄')}
                        </div>

                        {/* Waste */}
                        <div
                            style={{ position: 'relative', width: '70px', height: '98px' }}
                            onDoubleClick={() => handleDoubleClick('waste')}
                        >
                            {gameState.waste.length > 0 && (
                                <Card
                                    card={gameState.waste[gameState.waste.length - 1]}
                                    isClickable={true}
                                    isDraggable={true}
                                    onDragStart={(e) => handleDragStart(e, 'waste')}
                                />
                            )}
                        </div>

                        {/* Spacer */}
                        <div style={{ flex: 1, minWidth: 'var(--space-4)' }} />

                        {/* Foundations */}
                        {(['hearts', 'diamonds', 'clubs', 'spades'] as Suit[]).map((suit, index) => {
                            const petEmoji = { hearts: '🐶', diamonds: '🐱', clubs: '🐰', spades: '🐦' }[suit];
                            const suitColor = { hearts: '#ff4757', diamonds: '#ff6348', clubs: '#2f3542', spades: '#2f3542' }[suit];

                            return (
                                <div
                                    key={suit}
                                    style={{ position: 'relative' }}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDropOnFoundation(e, index)}
                                >
                                    <div style={{
                                        width: '70px',
                                        height: '98px',
                                        borderRadius: 'var(--radius-lg)',
                                        border: `2px dashed ${suitColor}30`,
                                        backgroundColor: 'var(--color-fill-quaternary)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 'var(--space-1)',
                                        fontSize: 'var(--font-size-title2)',
                                        opacity: 0.5,
                                        transition: 'all var(--duration-fast)'
                                    }}>
                                        <div style={{ fontSize: '18px' }}>{petEmoji}</div>
                                        <div>{getSuitSymbol(suit)}</div>
                                    </div>
                                    {gameState.foundations[suit].length > 0 && (
                                        <div style={{ position: 'absolute', top: 0, left: 0 }}>
                                            <Card card={gameState.foundations[suit][gameState.foundations[suit].length - 1]} isClickable={false} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Tableau */}
                    <div style={{ display: 'flex', gap: 'var(--space-3)', overflowX: 'auto', paddingBottom: 'var(--space-4)' }}>
                        {gameState.tableau.map((column, colIndex) => (
                            <div
                                key={colIndex}
                                style={{ minWidth: '70px', minHeight: '98px' }}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDropOnTableau(e, colIndex)}
                            >
                                {column.length === 0 && (
                                    <div style={{
                                        width: '70px',
                                        height: '98px',
                                        borderRadius: 'var(--radius-lg)',
                                        border: '2px dashed var(--color-border)',
                                        backgroundColor: 'var(--color-fill-quaternary)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 'var(--space-1)',
                                        fontSize: 'var(--font-size-title3)',
                                        color: 'var(--color-text-tertiary)',
                                        opacity: 0.5
                                    }}>
                                        <div style={{ fontSize: '16px' }}>👑</div>
                                        <div>K</div>
                                    </div>
                                )}

                                {column.map((card, cardIndex) => (
                                    <div
                                        key={card.id}
                                        style={{ marginTop: cardIndex === 0 ? 0 : '-78px', position: 'relative' }}
                                        onDoubleClick={() => card.faceUp && cardIndex === column.length - 1 && handleDoubleClick('tableau', colIndex, cardIndex)}
                                    >
                                        <Card
                                            card={card}
                                            isClickable={card.faceUp}
                                            isDraggable={card.faceUp}
                                            onDragStart={(e) => handleDragStart(e, 'tableau', colIndex, cardIndex)}
                                        />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Instructions */}
                <div style={{ marginTop: 'var(--space-6)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-fill-quaternary)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-footnote)' }}>
                    <p style={{ margin: 0, marginBottom: 'var(--space-2)' }}><strong>Como jogar:</strong></p>
                    <ul style={{ margin: 0, paddingLeft: 'var(--space-5)' }}>
                        <li><strong>Arraste</strong> cartas para mover</li>
                        <li><strong>Clique duplo</strong> para mover automaticamente para fundação</li>
                        <li>Fundações: Ás até Rei, mesmo naipe</li>
                        <li>Tableau: alternar cores, ordem decrescente</li>
                        <li>Só Reis em colunas vazias</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
