/**
 * PausaPage - Landing page for mini-games
 * 
 * Premium Apple-like layout with liquid glass aesthetics.
 * Displays a grid of available games for the user to select.
 */

import GameCard from '../../components/games/GameCard';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useEffect } from 'react';
import { GameMetadata } from '../../types/game.types';
import { GlassSurface, IconButton } from '../../components/ui';
import { ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

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

export default function PausaPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    useEffect(() => {
        const isClient = user?.role === 'CLIENT' || user?.role === 'CLIENTE';
        // Only restrict non-clients (staff) if explicitly disabled
        if (user && !isClient && user.pauseMenuEnabled === false) {
            toast.error('O menu de Pausa não está habilitado para seu perfil.');
            navigate('/staff/dashboard');
        }
    }, [user, navigate]);

    const hasAllowedGames = Array.isArray(user?.allowedGames) && user?.allowedGames.length > 0;
    const availableGames = hasAllowedGames
        ? GAMES.filter(game => user?.allowedGames?.includes(game.id))
        : GAMES;

    const handleGameSelect = (gameId: string) => {
        navigate(`/pausa/${gameId}`);
    };

    return (
        <main className="min-h-screen bg-[var(--color-bg-primary)] p-[var(--space-6)] md:p-[var(--space-10)] flex flex-col">
            <div className="flex items-center mb-[var(--space-8)]">
                <IconButton
                    icon={ChevronLeft}
                    onClick={() => navigate(-1)}
                    variant="secondary"
                    aria-label="Voltar"
                />
            </div>

            {/* Premium Header */}
            <header className="text-center mb-[var(--space-12)]">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-5xl font-[var(--font-weight-black)] text-[var(--color-text-primary)] mb-4 tracking-tight"
                >
                    🎮 Pausa
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg text-[var(--color-text-secondary)] max-w-xl mx-auto font-medium"
                >
                    Um respiro rápido. Sem bagunçar sua agenda.
                </motion.p>
            </header>

            {/* Game grid with premium cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[var(--space-6)] mb-[var(--space-12)]">
                {availableGames.map((game, index) => (
                    <motion.div
                        key={game.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                    >
                        <GameCard
                            game={game}
                            onClick={() => handleGameSelect(game.id)}
                        />
                    </motion.div>
                ))}
            </div>

            {/* Footer message with glass surface */}
            <GlassSurface className="p-6 text-center mt-auto rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)]">
                <p className="m-0 text-[var(--color-text-secondary)] font-medium flex items-center justify-center gap-3">
                    <span className="text-2xl">💡</span>
                    <span>
                        <strong className="text-[var(--color-text-primary)]">Dica:</strong> Seus jogos pausam automaticamente quando você troca de aba.
                    </span>
                </p>
            </GlassSurface>

            {/* Bottom safe area for mobile */}
            <div className="h-24 md:hidden" aria-hidden="true" />
        </main>
    );
}
