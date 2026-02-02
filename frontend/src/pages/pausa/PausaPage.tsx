import GameCard from '../../components/games/GameCard';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useEffect, useState } from 'react';
import { GameMetadata } from '../../types/game.types';
import { GlassSurface, IconButton } from '../../components/ui';
import { ChevronLeft, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { gameService, UserStats, LeaderboardEntry } from '../../services/gameService';

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
    const [stats, setStats] = useState<UserStats | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

    useEffect(() => {
        const isClient = user?.role === 'CLIENT' || user?.role === 'CLIENTE';
        // Only restrict non-clients (staff) if explicitly disabled
        if (user && !isClient && user.pauseMenuEnabled === false) {
            toast.error('O menu de Pausa não está habilitado para seu perfil.');
            navigate('/staff/dashboard');
        }

        // Fetch stats and leaderboard
        gameService.getUserStats().then(setStats).catch(console.error);
        gameService.getLeaderboard().then(setLeaderboard).catch(console.error);

    }, [user, navigate]);

    const hasAllowedGames = Array.isArray(user?.allowedGames) && user?.allowedGames.length > 0;
    const availableGames = hasAllowedGames
        ? GAMES.filter(game => user?.allowedGames?.includes(game.id))
        : GAMES;

    const handleGameSelect = (gameId: string) => {
        navigate(`/pausa/${gameId}`);
    };

    return (
        <main className="min-h-screen bg-bg-base/95 p-6 md:p-10 flex flex-col relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-accent-primary/5 to-transparent pointer-events-none" />

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 relative z-10">
                <div className="flex items-center gap-4">
                    <IconButton
                        icon={ChevronLeft}
                        onClick={() => navigate(-1)}
                        variant="ghost"
                        className="hover:bg-bg-surface/50"
                        aria-label="Voltar"
                    />
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-3xl font-bold text-text-primary tracking-tight"
                        >
                            Pausa Hub
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-text-secondary text-sm"
                        >
                            Relaxe e suba de nível 🚀
                        </motion.p>
                    </div>
                </div>

                {/* User Stats Card */}
                {stats && (
                    <GlassSurface className="flex items-center gap-6 px-6 py-3 rounded-full border border-border-subtle bg-bg-surface/40 backdrop-blur-md">
                        <div className="flex flex-col items-end">
                            <span className="text-xs uppercase font-bold text-text-tertiary tracking-wider">Nível</span>
                            <span className="text-2xl font-black text-accent-primary">{stats.level}</span>
                        </div>
                        <div className="w-px h-8 bg-border-subtle/50" />
                        <div className="flex flex-col items-start">
                            <span className="text-xs uppercase font-bold text-text-tertiary tracking-wider">XP Total</span>
                            <span className="text-lg font-bold text-text-primary flex items-center gap-1">
                                {stats.xp.toLocaleString()} <Star size={14} className="text-yellow-400 fill-yellow-400" />
                            </span>
                        </div>
                    </GlassSurface>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-8 relative z-10 max-w-7xl mx-auto w-full">

                {/* Main Content: Games */}
                <div className="flex-1">
                    <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                        🎮 Jogos Disponíveis
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
                </div>

                {/* Sidebar: Leaderboard */}
                <div className="w-full lg:w-80 shrink-0">
                    <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                        🏆 Top Jogadores
                    </h2>
                    <GlassSurface className="rounded-xl border border-border-subtle overflow-hidden bg-bg-surface/50">
                        {leaderboard.length === 0 ? (
                            <div className="p-8 text-center text-text-tertiary text-sm">
                                Ninguém jogou ainda.<br />Seja o primeiro!
                            </div>
                        ) : (
                            <ul className="divide-y divide-border-subtle/30">
                                {leaderboard.map((entry, i) => (
                                    <li key={entry.id} className="flex items-center justify-between p-4 hover:bg-bg-surface/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`
                                                w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold
                                                ${i === 0 ? 'bg-yellow-400/20 text-yellow-600' : ''}
                                                ${i === 1 ? 'bg-slate-300/20 text-slate-600' : ''}
                                                ${i === 2 ? 'bg-amber-600/20 text-amber-700' : ''}
                                                ${i > 2 ? 'text-text-tertiary' : ''}
                                            `}>
                                                {i + 1}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-text-primary truncate max-w-[120px]">
                                                    {entry.id === user?.id ? 'Você' : entry.displayName}
                                                </span>
                                                <span className="text-[10px] text-text-tertiary">Lvl {entry.level}</span>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-accent-primary tabular-nums">
                                            {entry.xp} XP
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </GlassSurface>
                </div>
            </div>

            {/* Footer message */}
            <div className="mt-12 text-center pb-8">
                <p className="text-sm text-text-tertiary">
                    Jogue com moderação. O trabalho te espera (ou não, se for cliente). 🐶
                </p>
            </div>
        </main>
    );
}
