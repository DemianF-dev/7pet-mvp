/**
 * DesenroscaPage - Wrapper for Desenrosca a Coleira game
 * 
 * Premium Apple-like layout with liquid glass aesthetics.
 * Uses GameHost to dynamically load and manage the game.
 * Includes navigation controls (back + sidebar toggle).
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Menu, X, Home } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import GameHost from '../../components/games/GameHost';

import BackButton from '../../components/BackButton';
import { GameModule } from '../../types/game.types';
import '../../styles/design-system-base.css';

export default function DesenroscaPage() {
    const navigate = useNavigate();
    const [showNav, setShowNav] = useState(false);

    // Dynamic import function for the game module
    const loadDesenroscaGame = () =>
        import('../../games/desenrosca-coleira') as Promise<{ default: GameModule }>;

    return (
        <main className="relative flex flex-col">
            {/* Standard Back Button */}
            <div className="p-4 z-50">
                <BackButton className="w-fit" />
            </div>

            {/* Main content */}
            <div className="flex-1 p-6 md:p-10 pt-0">
                {/* Game container with liquid glass effect */}
                <div
                    className="glass-elevated animate-fade-in"
                    style={{
                        borderRadius: 'var(--radius-2xl)',
                        overflow: 'hidden',
                        minHeight: '600px',
                        position: 'relative'
                    }}
                >
                    <GameHost
                        gameLoader={loadDesenroscaGame}
                        options={{}}
                    />
                </div>

                {/* Premium footer hint */}
                <div
                    className="glass-surface"
                    style={{
                        textAlign: 'center',
                        marginTop: 'var(--space-6)',
                        padding: 'var(--space-4)',
                        borderRadius: 'var(--radius-xl)'
                    }}
                >
                    <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-footnote)' }}>
                        💡 <strong>Dica:</strong> O jogo pausa automaticamente quando você troca de aba.
                    </p>
                </div>
            </div>

            {/* Mobile spacer for bottom nav */}
            <div className="h-24 md:hidden" aria-hidden="true" />
        </main>
    );
}
