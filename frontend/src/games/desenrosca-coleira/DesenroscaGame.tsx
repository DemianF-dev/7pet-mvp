/**
 * DesenroscaGame - Main game component
 * 
 * Puzzle game where user drags nodes to eliminate edge crossings
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, Difficulty } from './types';
import { initializeGame, countCrossings } from './game-logic';
import GameBoard from './components/GameBoard';
import toast from 'react-hot-toast';
import '../../styles/design-system-base.css';

interface DesenroscaGameProps {
    onWin?: () => void;
    reducedMotion?: boolean;
}

const STORAGE_KEY = '7pet_desenrosca_saved_game';

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
    easy: 'Fácil',
    medium: 'Médio',
    hard: 'Difícil'
};

export default function DesenroscaGame({ onWin }: DesenroscaGameProps) {
    const [gameState, setGameState] = useState<GameState>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const state = JSON.parse(saved);
                // Recalculate crossings on load
                state.crossings = countCrossings(state.nodes, state.edges);
                state.isPaused = false;
                return state;
            } catch {
                return initializeGame('medium');
            }
        }
        return initializeGame('medium');
    });

    const timerRef = useRef<number | null>(null);
    void timerRef; // Timer used for future features

    // Save state
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    }, [gameState]);

    // Check for win
    useEffect(() => {
        if (gameState.crossings === 0 && gameState.moves > 0 && !gameState.isSolved) {
            setGameState(prev => ({ ...prev, isSolved: true }));
            toast.success(`🎉 Parabéns! Resolvido em ${gameState.moves} movimentos!`, { duration: 5000 });
            onWin?.();
        }
    }, [gameState.crossings, gameState.moves, gameState.isSolved, onWin]);

    // Timer
    useEffect(() => {
        if (!gameState.isPaused && !gameState.isSolved) {
            timerRef.current = window.setInterval(() => {
                setGameState(prev => ({ ...prev, time: prev.time + 1 }));
            }, 1000);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [gameState.isPaused, gameState.isSolved]);

    const handleNewGame = useCallback((difficulty?: Difficulty) => {
        const newDifficulty = difficulty || gameState.difficulty;
        setGameState(initializeGame(newDifficulty));
        toast.success('Novo jogo iniciado! 🐾');
    }, [gameState.difficulty]);

    const handleClearProgress = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setGameState(initializeGame('medium'));
        toast('Progresso limpo!');
    }, []);

    const handleNextLevel = useCallback(() => {
        const nextDifficulty: Difficulty =
            gameState.difficulty === 'easy' ? 'medium' :
                gameState.difficulty === 'medium' ? 'hard' : 'easy';
        handleNewGame(nextDifficulty);
    }, [gameState.difficulty, handleNewGame]);

    const handleNodeMove = useCallback((nodeId: string, x: number, y: number) => {
        setGameState(prev => {
            const nodes = prev.nodes.map(node =>
                node.id === nodeId ? { ...node, x, y } : node
            );

            const crossings = countCrossings(nodes, prev.edges);
            const moves = prev.moves + 1;

            return {
                ...prev,
                nodes,
                crossings,
                moves,
                isSolved: false
            };
        });
    }, []);

    // Expose pause/resume methods for GameHost
    useEffect(() => {
        (window as any).__desenroscaGameState = {
            pause: () => setGameState(prev => ({ ...prev, isPaused: true })),
            resume: () => setGameState(prev => ({ ...prev, isPaused: false }))
        };

        return () => {
            delete (window as any).__desenroscaGameState;
        };
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="page-container">
            <div className="page-content">
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: 'var(--space-4)',
                    marginBottom: 'var(--space-6)'
                }}>
                    <div>
                        <h1 style={{
                            fontSize: 'var(--font-size-title2)',
                            fontWeight: 'var(--font-weight-bold)',
                            margin: 0,
                            marginBottom: 'var(--space-2)'
                        }}>
                            🐕 Desenrosca a Coleira
                        </h1>
                        <p style={{
                            color: 'var(--color-text-secondary)',
                            margin: 0,
                            fontSize: 'var(--font-size-body)'
                        }}>
                            Dificuldade: <strong>{DIFFICULTY_LABELS[gameState.difficulty]}</strong>
                        </p>
                    </div>

                    <div style={{
                        display: 'flex',
                        gap: 'var(--space-3)',
                        flexWrap: 'wrap'
                    }}>
                        <button
                            onClick={() => handleNewGame()}
                            className="interactive"
                            style={{
                                padding: 'var(--space-2) var(--space-4)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-surface)',
                                cursor: 'pointer',
                                fontSize: 'var(--font-size-body)',
                                fontWeight: 'var(--font-weight-medium)',
                                color: 'var(--color-text-primary)'
                            }}
                        >
                            Novo Jogo
                        </button>

                        {gameState.isSolved && (
                            <button
                                onClick={handleNextLevel}
                                className="interactive"
                                style={{
                                    padding: 'var(--space-2) var(--space-4)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-accent-primary)',
                                    background: 'var(--color-accent-primary)',
                                    cursor: 'pointer',
                                    fontSize: 'var(--font-size-body)',
                                    fontWeight: 'var(--font-weight-medium)',
                                    color: 'white'
                                }}
                            >
                                Próximo Nível
                            </button>
                        )}

                        <button
                            onClick={handleClearProgress}
                            className="interactive"
                            style={{
                                padding: 'var(--space-2) var(--space-4)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-surface)',
                                cursor: 'pointer',
                                fontSize: 'var(--font-size-body)',
                                fontWeight: 'var(--font-weight-medium)',
                                color: 'var(--color-text-secondary)'
                            }}
                        >
                            Limpar
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div style={{
                    display: 'flex',
                    gap: 'var(--space-6)',
                    marginBottom: 'var(--space-4)',
                    flexWrap: 'wrap'
                }}>
                    <div>
                        <span style={{
                            color: 'var(--color-text-secondary)',
                            fontSize: 'var(--font-size-footnote)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            Cruzamentos
                        </span>
                        <div style={{
                            fontSize: 'var(--font-size-title3)',
                            fontWeight: 'var(--font-weight-bold)',
                            color: gameState.crossings === 0 ? 'var(--color-success)' : 'var(--color-warning)'
                        }}>
                            {gameState.crossings}
                        </div>
                    </div>

                    <div>
                        <span style={{
                            color: 'var(--color-text-secondary)',
                            fontSize: 'var(--font-size-footnote)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            Movimentos
                        </span>
                        <div style={{
                            fontSize: 'var(--font-size-title3)',
                            fontWeight: 'var(--font-weight-bold)',
                            color: 'var(--color-text-primary)'
                        }}>
                            {gameState.moves}
                        </div>
                    </div>

                    <div>
                        <span style={{
                            color: 'var(--color-text-secondary)',
                            fontSize: 'var(--font-size-footnote)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            Tempo
                        </span>
                        <div style={{
                            fontSize: 'var(--font-size-title3)',
                            fontWeight: 'var(--font-weight-bold)',
                            color: 'var(--color-text-primary)'
                        }}>
                            {formatTime(gameState.time)}
                        </div>
                    </div>
                </div>

                {/* Game Board */}
                <div className="card card-padding-lg" style={{ marginBottom: 'var(--space-6)' }}>
                    <GameBoard
                        nodes={gameState.nodes}
                        edges={gameState.edges}
                        onNodeMove={handleNodeMove}
                    />
                </div>

                {/* Hints */}
                <div style={{
                    padding: 'var(--space-4)',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--color-fill-quaternary)',
                    color: 'var(--color-text-secondary)',
                    fontSize: 'var(--font-size-footnote)'
                }}>
                    <p style={{ margin: 0, marginBottom: 'var(--space-2)' }}>
                        <strong>Como jogar:</strong>
                    </p>
                    <ul style={{ margin: 0, paddingLeft: 'var(--space-5)' }}>
                        <li>Arraste os pets (nós) para reposicionar</li>
                        <li>Objetivo: eliminar todos os cruzamentos das coleiras</li>
                        <li>Quanto menos movimentos, melhor!</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
