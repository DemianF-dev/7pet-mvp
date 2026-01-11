/**
 * PacienciaPage - Wrapper for Paciência Pet game
 * 
 * Premium Apple-like layout with liquid glass aesthetics.
 * Uses GameHost to dynamically load and manage the game.
 * Includes navigation controls (back + sidebar toggle).
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StaffSidebar from '../../components/StaffSidebar';
import GameHost from '../../components/games/GameHost';
import { GameModule } from '../../types/game.types';
import '../../styles/design-system-base.css';

export default function PacienciaPage() {
    const navigate = useNavigate();
    const [showCelebration, setShowCelebration] = useState(false);

    // Dynamic import function for the game module
    const loadPacienciaGame = () =>
        import('../../games/paciencia-pet') as Promise<{ default: GameModule }>;

    return (
        <div className="flex min-h-screen bg-bg-primary">
            <StaffSidebar />

            <main className="flex-1 md:ml-64 transition-all duration-300">
                {/* Page Header with 7Pet Branding */}
                <div className="p-6 md:p-10">
                    <div className="flex items-center gap-4 mb-8">
                        <img
                            src="/logo.png"
                            className="w-12 h-12 rounded-xl object-contain"
                            alt="7Pet Logo"
                        />
                        <div>
                            <h1 className="text-3xl font-bold text-heading">Paciência Pet</h1>
                            <p className="text-body-secondary">Relaxe com nosso jogo de paciência temático 🐾</p>
                        </div>
                    </div>

                    {/* Game container with premium glass effect */}
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
                            gameLoader={loadPacienciaGame}
                            options={{}}
                        />
                    </div>

                    {/* Premium footer hint */}
                    <div
                        className="glass-surface mt-6"
                        style={{
                            textAlign: 'center',
                            padding: 'var(--space-4)',
                            borderRadius: 'var(--radius-xl)'
                        }}
                    >
                        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-footnote)' }}>
                            💡 <strong>Dica:</strong> O jogo pausa automaticamente quando você troca de aba. Use a sidebar para navegar pelo sistema!
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
