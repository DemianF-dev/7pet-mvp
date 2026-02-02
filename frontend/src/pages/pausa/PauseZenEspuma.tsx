import { useState, useEffect, useRef } from 'react';
import GameHost from '../../components/games/GameHost';
import BackButton from '../../components/BackButton';
import '../../styles/design-system-base.css';
import { gameService } from '../../services/gameService';
import { toast } from 'react-hot-toast';

// Lazy load the game module
const gameLoader = () => import('../../games/zen-espuma');

export default function PauseZenEspuma() {
    const [reducedMotion, setReducedMotion] = useState(false);
    const [resetKey, setResetKey] = useState(0);
    const sessionIdRef = useRef<string | null>(null);
    const startTimeRef = useRef<number>(Date.now());

    // Game ID for Zen Espuma (create this in DB or use slug later)
    // For MVP we can fetch by slug or just assume ID is known/fetched. 
    // Ideally we fetch the game list first. But for now let's assume we can start by slug or handle it.
    // Actually gameService expects gameId. We should probably fetch it or hardcode if we know it.
    // Let's hardcode "zen-espuma" as ID is dynamic. Wait, schema has slug.
    // For now, I'll fetch the game list to find the ID.

    useEffect(() => {
        let active = true;

        const initSession = async () => {
            try {
                const games = await gameService.listGames();
                const game = games.find(g => g.slug === 'zen-espuma');

                if (game && active) {
                    const session = await gameService.startGameSession(game.id);
                    sessionIdRef.current = session.id;
                    startTimeRef.current = Date.now();
                }
            } catch (err) {
                console.error("Failed to start game session", err);
            }
        };

        initSession();

        return () => {
            active = false;
            // End session on unmount
            if (sessionIdRef.current) {
                const duration = (Date.now() - startTimeRef.current) / 1000;
                // Score is 0 for Zen Espuma (it's a zen game)
                gameService.endGameSession(sessionIdRef.current, 0).then(result => {
                    if (result.xpEarned > 0) {
                        toast.success(`+${result.xpEarned} XP! ${result.leveledUp ? 'LEVEL UP!' : ''}`, {
                            icon: '✨',
                            style: { background: '#333', color: '#fff' }
                        });
                    }
                }).catch(e => console.error(e));
            }
        };
    }, []);

    const handleReset = () => {
        setResetKey(prev => prev + 1);
    };

    return (
        <div className="fixed inset-0 bg-bg-surface flex flex-col z-50">
            {/* Minimal Header */}
            <div className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-center pointer-events-none">
                <div className="pointer-events-auto">
                    <BackButton />
                </div>

                {/* Title overlay - faded */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center opacity-80 pointer-events-auto">
                    <h1 className="text-lg font-bold text-text-primary tracking-tight">
                        Zen Pad
                    </h1>
                    <p className="text-xs text-text-secondary font-medium uppercase tracking-widest opacity-70">
                        Espuma
                    </p>
                </div>

                <div className="flex gap-2 pointer-events-auto">
                    <button
                        onClick={() => setReducedMotion(!reducedMotion)}
                        className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors backdrop-blur-md
                            ${reducedMotion
                                ? 'bg-accent-primary text-white shadow-sm'
                                : 'bg-white/50 text-text-secondary hover:bg-white/80'}`}
                    >
                        {reducedMotion ? 'Modo Leve ON' : 'Modo Leve'}
                    </button>

                    <button
                        onClick={handleReset}
                        className="p-2 rounded-full bg-white/50 hover:bg-white/80 text-text-secondary backdrop-blur-md transition-colors"
                        title="Resetar"
                    >
                        ↺
                    </button>
                </div>
            </div>

            {/* Hint Overlay (Fades out typically, or stays subtle) */}
            <div className="absolute bottom-8 left-0 right-0 z-10 text-center pointer-events-none">
                <p className="text-sm font-medium text-text-secondary opacity-50 px-6">
                    Toque, arraste e respire.
                </p>
            </div>

            {/* Game Canvas Container */}
            <div className="flex-1 w-full h-full">
                <GameHost
                    key={`${resetKey}-${reducedMotion ? 'lite' : 'full'}`}
                    gameLoader={gameLoader}
                    className="w-full h-full"
                    options={{
                        reducedMotion
                    }}
                />
            </div>
        </div>
    );
}
