/**
 * GameHost - Generic game hosting component
 * 
 * Responsibilities:
 * - Lazy load game modules dynamically
 * - Manage game lifecycle (mount, pause, resume, destroy)
 * - Auto-pause on visibility change (tab hidden) or window blur
 * - Auto-resume on visibility change (tab visible) or window focus
 * - Cleanup on unmount
 * - Detect reduced motion preference
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { GameModule, GameOptions } from '../../types/game.types';
import GameLoader from './GameLoader';
import GameError from './GameError';
import toast from 'react-hot-toast';

interface GameHostProps {
    /**
     * Function that dynamically imports the game module
     */
    gameLoader: () => Promise<{ default: GameModule }>;

    /**
     * Game options and callbacks
     */
    options?: GameOptions;

    /**
     * Additional CSS class for the container
     */
    className?: string;
}

export default function GameHost({ gameLoader, options, className }: GameHostProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const gameModuleRef = useRef<GameModule | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const loadedRef = useRef(false);

    // Memoize options to prevent infinite re-renders
    const stableOptions = useRef(options);

    useEffect(() => {
        // Prevent double loading
        if (loadedRef.current) return;

        let mounted = true;

        // Detect reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Detect low power mode (simple heuristic)
        const isLowPower = /mobile/i.test(navigator.userAgent) && window.innerWidth < 768;

        const gameOptions: GameOptions = {
            ...stableOptions.current,
            reducedMotion: prefersReducedMotion,
            lowPowerMode: isLowPower,
            onWin: () => {
                toast.success('🎉 Parabéns! Você venceu!');
                stableOptions.current?.onWin?.();
            },
            onLose: () => {
                toast('😔 Que pena! Tente novamente.', { icon: '🎮' });
                stableOptions.current?.onLose?.();
            }
        };

        // Load and mount the game
        async function loadGame() {
            try {
                console.log('[GameHost] Starting game load...');

                // Wait for container to be fully mounted
                await new Promise(resolve => setTimeout(resolve, 100));

                // Retry logic: wait up to 3 seconds for container
                let retries = 0;
                const maxRetries = 30; // 3 seconds total

                while (retries < maxRetries && (!containerRef.current || !mounted)) {
                    console.log(`[GameHost] Waiting for container... retry ${retries + 1}/${maxRetries}`);
                    await new Promise(resolve => setTimeout(resolve, 100));
                    retries++;
                }

                if (!mounted) {
                    console.error('[GameHost] Component unmounted during load');
                    return;
                }

                if (!containerRef.current) {
                    console.error('[GameHost] Container not available after retries');
                    setError('Erro ao inicializar container do jogo');
                    setIsLoading(false);
                    return;
                }

                console.log('[GameHost] Container ready, loading module...');
                const module = await gameLoader();

                if (!mounted || !containerRef.current) {
                    console.log('[GameHost] Component unmounted after module load');
                    return;
                }

                console.log('[GameHost] Module loaded, mounting game...');
                const gameInstance = module.default;
                gameModuleRef.current = gameInstance;
                loadedRef.current = true;

                // Mount the game
                gameInstance.mount(containerRef.current, gameOptions);
                console.log('[GameHost] Game mounted successfully');
                setIsLoading(false);
            } catch (err) {
                console.error('[GameHost] Failed to load game:', err);
                setError('Erro ao carregar o jogo. Tente novamente.');
                setIsLoading(false);
                toast.error('Erro ao carregar o jogo');
            }
        }

        loadGame();

        // Cleanup on unmount
        return () => {
            mounted = false;
            if (gameModuleRef.current) {
                gameModuleRef.current.destroy();
                gameModuleRef.current = null;
            }
        };
    }, [gameLoader]);

    // Auto-pause/resume on visibility change
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!gameModuleRef.current) return;

            if (document.visibilityState === 'hidden') {
                gameModuleRef.current.pause();
            } else if (document.visibilityState === 'visible') {
                gameModuleRef.current.resume();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Auto-pause/resume on window blur/focus
    useEffect(() => {
        const handleBlur = () => {
            if (gameModuleRef.current) {
                gameModuleRef.current.pause();
            }
        };

        const handleFocus = () => {
            if (gameModuleRef.current) {
                gameModuleRef.current.resume();
            }
        };

        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    const handleRetry = useCallback(() => {
        setError(null);
        setIsLoading(true);
        loadedRef.current = false;
        // Force re-mount by triggering dependency
        window.location.reload();
    }, []);

    if (error) {
        return (
            <GameError
                error={error}
                onRetry={handleRetry}
                onBack={() => window.history.back()}
            />
        );
    }

    // CRITICAL: Always render the container so the ref is available
    // Show loader as overlay while loading
    return (
        <div style={{ position: 'relative', width: '100%', minHeight: '100%' }}>
            {/* Loader overlay - shown while loading */}
            {isLoading && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 10
                }}>
                    <GameLoader />
                </div>
            )}

            {/* Game container - ALWAYS rendered so ref is available */}
            <div
                ref={containerRef}
                className={className}
                style={{
                    width: '100%',
                    minHeight: '600px',
                    opacity: isLoading ? 0 : 1,
                    transition: 'opacity 0.3s ease-out'
                }}
            />
        </div>
    );
}

