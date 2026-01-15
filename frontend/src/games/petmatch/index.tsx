import { useState, useEffect, useRef, useCallback } from 'react';
import { GameModule, GameOptions } from '../../types/game.types';
import ReactDOM from 'react-dom/client';
import { generateBoard, areAdjacent, copyBoard, isValidPos } from './engine/board';
import { Board, GameState, Position, Tile } from './engine/types';
import { LEVEL_CONFIGS } from './engine/levels';
import { resolveBoardState } from './engine/resolve';
import { saveProgress, loadProgress, updateLevelProgress } from './storage/progress';
import PetMatchHUD from './ui/PetMatchHUD';
import PetMatchGrid from './ui/PetMatchGrid';
import GameCard from './ui/GameCard';
import { WinOverlay, LoseOverlay } from './ui/overlays/Overlays';
import { Toaster, toast } from 'react-hot-toast';
import '../../styles/design-system-base.css'; // Ensure base styles

// Main Game Component
const PetMatchGame = ({ options, destroy }: { options?: GameOptions, destroy?: () => void }) => {
    // Determine initial level from progress if not specified? 
    // Usually game starts at storage level or select screen.
    // For V1, let's load progress and start at 'highestUnlocked' or 1.
    const [progress, setProgress] = useState(loadProgress());
    const [currentLevelId, setCurrentLevelId] = useState<number>(progress.highestUnlockedLevel);

    // Game State
    const [board, setBoard] = useState<Board>(generateBoard());
    const [score, setScore] = useState(0);
    const [movesLeft, setMovesLeft] = useState(0);
    const [status, setStatus] = useState<GameState['status']>('idle');
    const [animating, setAnimating] = useState(false);

    const levelConfig = LEVEL_CONFIGS.find(l => l.level === currentLevelId) || LEVEL_CONFIGS[0];

    // Debug logging
    useEffect(() => {
        console.log('[PetMatch] Component mounted');
        return () => {
            console.log('[PetMatch] Component unmounting');
        };
    }, []);


    // Initialize Level
    const startLevel = useCallback((levelId: number) => {
        try {
            console.log('[PetMatch] Starting level:', levelId);
            const config = LEVEL_CONFIGS.find(l => l.level === levelId) || LEVEL_CONFIGS[0];
            setCurrentLevelId(levelId);
            setBoard(generateBoard());
            setScore(0);
            setMovesLeft(config.moves);
            setStatus('idle');
            setAnimating(false);
            console.log('[PetMatch] Level initialized:', config);
        } catch (error) {
            console.error('[PetMatch] Error starting level:', error);
        }
    }, []);


    useEffect(() => {
        try {
            console.log('[PetMatch] useEffect running, progress:', progress);
            startLevel(progress.highestUnlockedLevel);
        } catch (error) {
            console.error('[PetMatch] Error in useEffect:', error);
        }
    }, []); // Run once on mount

    const handleMove = async (p1: Position, p2: Position) => {
        if (status !== 'idle' || animating) return;

        // Optimistic swap
        const nextBoard = copyBoard(board);
        const t1 = nextBoard[p1.row][p1.col];
        const t2 = nextBoard[p2.row][p2.col];

        if (!t1 || !t2) return;

        // Visual Swap
        // We set state to trigger swap animation? 
        // Ideally we assume valid for animation, then revert if invalid logic.

        // 1. Perform Swap in Data
        nextBoard[p1.row][p1.col] = t2;
        nextBoard[p2.row][p2.col] = t1;
        // Update internals
        t1.x = p2.col; t1.y = p2.row;
        t2.x = p1.col; t2.y = p1.row;

        setBoard(nextBoard);
        setAnimating(true);

        // Allow 300ms for swap animation before checking logic
        await new Promise(r => setTimeout(r, 300));

        // 2. Check Match
        const result = resolveBoardState(nextBoard);

        if (result.totalScore > 0) {
            // VALID MOVE
            const newMoves = movesLeft - 1;
            setMovesLeft(newMoves);

            // Animate Resolution (Cascades)
            // For MVP, we jump to final state or iterate steps?
            // To be smooth, we should iterate steps with delay.

            let currentAnimatedBoard = copyBoard(board);
            let totalAdded = 0;
            for (const step of result.steps) {
                // 1. Stage: Highlight matches/pops
                if (step.clearedPositions) {
                    const popBoard = copyBoard(currentAnimatedBoard);
                    step.clearedPositions.forEach(pos => {
                        const t = popBoard[pos.row][pos.col];
                        if (t) t.isMatched = true;
                    });
                    setBoard(popBoard);
                    await new Promise(r => setTimeout(r, 400));
                }

                // 2. Stage: Apply result and drop
                setBoard(step.boardState);
                currentAnimatedBoard = step.boardState;

                totalAdded += step.scoreDelta || 0;
                setScore(prev => prev + (step.scoreDelta || 0));

                await new Promise(r => setTimeout(r, 600));
            }

            // Check Win/Loss based on final calculated score
            const finalScore = score + totalAdded;

            if (finalScore >= levelConfig.goalScore) {
                setStatus('won');
                updateLevelProgress(currentLevelId, finalScore);
                options?.onWin?.();
            } else if (newMoves <= 0) {
                setStatus('lost');
                options?.onLose?.();
            } else {
                setAnimating(false);
            }
        } else {
            // INVALID MOVE - Revert
            // Swap back
            const reverted = copyBoard(board); // board is still pre-swap in closure? No, state updated.
            // Actually 'board' var is stale closure. We need to use 'nextBoard' inverted.

            // Revert data
            const r1 = nextBoard[p1.row][p1.col];
            const r2 = nextBoard[p2.row][p2.col];
            if (r1 && r2) {
                nextBoard[p1.row][p1.col] = r2;
                nextBoard[p2.row][p2.col] = r1;
                r1.x = p2.col; r1.y = p2.row;
                r2.x = p1.col; r2.y = p1.row;
            }

            setBoard([...nextBoard]); // trigger re-render
            await new Promise(r => setTimeout(r, 300));
            setAnimating(false);
        }
    };

    return (
        <div className="w-full h-full flex items-center justify-center p-4 bg-transparent">
            <Toaster />
            <div className="w-full max-w-[980px]">
                <GameCard level={currentLevelId} className="p-5 md:p-6">
                    <div className="flex flex-col gap-4">
                        <PetMatchHUD
                            level={currentLevelId}
                            score={score}
                            moves={movesLeft}
                            levelConfig={levelConfig}
                            onBack={() => {
                                window.history.back();
                            }}
                        />

                        <div className="flex items-center justify-center py-4">
                            <PetMatchGrid
                                board={board}
                                onMove={handleMove}
                                disabled={status !== 'idle' || animating}
                            />
                        </div>
                    </div>
                </GameCard>
            </div>

            {status === 'won' && (
                <WinOverlay
                    score={score}
                    onNext={() => {
                        if (currentLevelId < 10) {
                            startLevel(currentLevelId + 1);
                        } else {
                            // Game finished logic?
                            toast.success("Você zerou o jogo! Incrível! 🏆");
                            startLevel(1); // loop for now
                        }
                    }}
                    onReplay={() => startLevel(currentLevelId)}
                />
            )}

            {status === 'lost' && (
                <LoseOverlay
                    score={score}
                    onReplay={() => startLevel(currentLevelId)}
                    onBack={() => window.history.back()}
                />
            )}
        </div>
    );
};

// Module Adapter
class PetMatchModule implements GameModule {
    private root: ReactDOM.Root | null = null;
    private options: GameOptions | null = null;

    mount(container: HTMLElement, options: GameOptions) {
        console.log('[PetMatch] Mounting game...', { container, options });
        this.options = options;
        this.root = ReactDOM.createRoot(container);
        this.root.render(<PetMatchGame options={options} destroy={() => this.destroy()} />);
        console.log('[PetMatch] Game mounted successfully');
    }

    destroy() {
        if (this.root) {
            this.root.unmount();
            this.root = null;
        }
    }

    pause() {
        // React component state persists, can implement overlay "PAUSED" if needed.
        // For now, implicit pause (animation/input block) via visibility API in GameHost is enough.
        console.log('PetMatch paused');
    }

    resume() {
        console.log('PetMatch resumed');
    }
}

export default new PetMatchModule();
