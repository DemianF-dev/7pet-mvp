/**
 * PausaPage - Landing page for mini-games
 * 
 * Premium Apple-like layout with liquid glass aesthetics.
 * Displays a grid of available games for the user to select.
 */

import GameCard from '../../components/games/GameCard';

import BackButton from '../../components/BackButton';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useEffect } from 'react';
import { GameMetadata } from '../../types/game.types';
import '../../styles/design-system-base.css';

// Game catalog
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
    },
    {
        id: 'petmatch',
        name: 'Pet Match',
        description: 'Combine os itens fofos para vencer!',
        icon: '🦴',
        difficulty: 'medium',
        estimatedTime: '3-10 min',
        status: 'active',
        tags: ['Puzzle', 'Match-3']
    },
    {
        id: 'coleira',
        name: 'Desenrosca a Coleira',
        description: 'Desembaraçe as coleiras sem cruzamentos.',
        icon: '🐕',
        difficulty: 'medium',
        estimatedTime: '2-5 min',
        status: 'active',
        tags: ['Puzzle', 'Lógica']
    },
    {
        id: 'zen-espuma',
        name: 'Zen Pad',
        description: 'Espuma relaxante para acalmar a mente.',
        icon: '🫧',
        difficulty: 'easy',
        estimatedTime: '∞',
        status: 'active',
        tags: ['Relax', 'Sensorial']
    }
];

import toast from 'react-hot-toast';

export default function PausaPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    useEffect(() => {
        // If pause menu is explicitly disabled
        if (user && user.pauseMenuEnabled === false) {
            toast.error('O menu de Pausa não está habilitado para seu perfil.');
            navigate('/staff/dashboard');
        }
    }, [user, navigate]);

    // Fallback: If allowedGames is undefined/null, assume all games are allowed (or none?)
    // For MVP, if it's undefined, let's allow all to avoid valid users seeing nothing.
    // Or better, check if the property exists.
    // If we strictly follow the code:
    const hasAllowedGames = Array.isArray(user?.allowedGames) && user?.allowedGames.length > 0;

    // If property is missing, defaulting to ALL allowed for now to prevent "blank page" confusion during dev
    const availableGames = hasAllowedGames
        ? GAMES.filter(game => user?.allowedGames?.includes(game.id))
        : GAMES;

    const handleGameSelect = (gameId: string) => {
        navigate(`/pausa/${gameId}`);
    };

    return (
        <main className="p-6 md:p-10 transition-all duration-300">
            <BackButton className="mb-6 ml-[-1rem]" />

            {/* Premium Header */}
            <div
                className="page-header"
                style={{
                    textAlign: 'center',
                    marginBottom: 'var(--space-10)'
                }}
            >
                <h1
                    className="page-title text-4xl font-black text-[var(--color-text-primary)] mb-3 tracking-tighter"
                >
                    🎮 Pausa
                </h1>
                <p
                    className="page-subtitle text-lg text-[var(--color-text-secondary)] max-w-[600px] mx-auto font-medium"
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
                {availableGames.map((game) => (
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
            <div className="h-24 md:hidden" aria-hidden="true" />
        </main>
    );
}
