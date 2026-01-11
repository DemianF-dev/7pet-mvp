/**
 * PausaPage - Landing page for mini-games
 * 
 * Premium Apple-like layout with liquid glass aesthetics.
 * Displays a grid of available games for the user to select.
 * Includes navigation controls (back + sidebar toggle).
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import StaffSidebar from '../../components/StaffSidebar';
import { useAuthStore } from '../../store/authStore';
import { GameMetadata } from '../../types/game.types';
import GameCard from '../../components/games/GameCard';
import '../../styles/design-system-base.css';

// Game catalog - Only Paciência available for now
const GAMES: GameMetadata[] = [
    {
        id: 'paciencia-pet',
        name: 'Paciência Pet',
        description: 'Um clássico jogo de cartas relaxante com tema pet.',
        icon: '🐾',
        difficulty: 'easy',
        estimatedTime: '5-10 min',
        status: 'active',
        tags: ['Cartas', 'Relaxante']
    }
];

export default function PausaPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const isClient = user?.role === 'CLIENTE';

    const handleGameSelect = (gameId: string) => {
        navigate(`/pausa/${gameId}`);
    };

    return (
        <div className="flex min-h-screen bg-bg-primary">
            {/* Render appropriate sidebar based on user role */}
            {isClient ? <Sidebar /> : <StaffSidebar />}

            <main className="flex-1 md:ml-64 transition-all duration-300">
                {/* Main content */}
                <div className="p-6 md:p-10">
                    {/* Premium Header */}
                    <div
                        className="page-header"
                        style={{
                            textAlign: 'center',
                            marginBottom: 'var(--space-10)'
                        }}
                    >
                        <h1
                            className="page-title"
                            style={{
                                fontSize: 'var(--font-size-title1)',
                                fontWeight: 'var(--font-weight-bold)',
                                color: 'var(--color-text-primary)',
                                marginBottom: 'var(--space-3)',
                                letterSpacing: '-0.02em'
                            }}
                        >
                            🎮 Pausa
                        </h1>
                        <p
                            className="page-subtitle"
                            style={{
                                fontSize: 'var(--font-size-headline)',
                                color: 'var(--color-text-secondary)',
                                maxWidth: '600px',
                                margin: '0 auto'
                            }}
                        >
                            Um respiro rápido. Sem bagunçar sua agenda.
                        </p>
                    </div>

                    {/* Game grid with premium cards */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: 'var(--space-6)',
                            marginBottom: 'var(--space-12)'
                        }}
                        className="animate-slide-up"
                    >
                        {GAMES.map((game) => (
                            <GameCard
                                key={game.id}
                                game={game}
                                onClick={() => handleGameSelect(game.id)}
                            />
                        ))}
                    </div>

                    {/* Footer message with glass surface */}
                    <div
                        className="glass-surface"
                        style={{
                            textAlign: 'center',
                            padding: 'var(--space-6)',
                            borderRadius: 'var(--radius-xl)',
                            marginTop: 'auto'
                        }}
                    >
                        <p
                            style={{
                                margin: 0,
                                color: 'var(--color-text-secondary)',
                                fontSize: 'var(--font-size-body)',
                                fontWeight: 'var(--font-weight-medium)'
                            }}
                        >
                            <span style={{ fontSize: '1.5em', marginRight: 'var(--space-2)' }}>💡</span>
                            <strong>Dica:</strong> Seus jogos pausam automaticamente quando você troca de aba.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
