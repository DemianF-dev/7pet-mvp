import { LevelConfig } from '../engine/types';

interface HUDProps {
    level: number;
    score: number;
    moves: number;
    levelConfig: LevelConfig;
    onBack: () => void;
}

export default function PetMatchHUD({ level, score, moves, levelConfig, onBack }: HUDProps) {
    const progress = Math.min((score / levelConfig.goalScore) * 100, 100);

    return (
        <div className="w-full flex flex-col gap-3">
            {/* Row 1: Actions */}
            <div className="flex items-center justify-between">
                {/* Back button */}
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-black/5 active:scale-95 transition-all text-sm font-medium"
                    style={{ color: 'var(--color-text-secondary)' }}
                >
                    <span>←</span>
                    <span className="hidden sm:inline">Voltar</span>
                </button>

                {/* Level & Moves info */}
                <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide"
                        style={{
                            background: 'var(--color-fill-tertiary)',
                            color: 'var(--color-text-primary)'
                        }}
                    >
                        Fase {level}
                    </div>
                    <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${moves <= 5 ? 'animate-pulse' : ''}`}
                        style={{
                            background: moves <= 5 ? 'rgba(255, 69, 58, 0.12)' : 'var(--color-fill-tertiary)',
                            color: moves <= 5 ? 'var(--color-error)' : 'var(--color-text-primary)'
                        }}
                    >
                        ⚡ {moves} {moves === 1 ? 'jogada' : 'jogadas'}
                    </div>
                </div>
            </div>

            {/* Row 2: Score & Progress */}
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-baseline">
                    <span className="text-xs uppercase tracking-widest font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                        Pontos
                    </span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold" style={{ color: 'var(--pm-accent, var(--color-brand-primary))' }}>
                            {score}
                        </span>
                        <span className="text-sm font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                            / {levelConfig.goalScore}
                        </span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-3 rounded-full overflow-hidden relative border"
                    style={{
                        backgroundColor: 'var(--color-fill-tertiary)',
                        borderColor: 'var(--color-border)'
                    }}
                >
                    <div
                        className="h-full transition-all duration-300 ease-out flex items-center justify-end pr-1"
                        style={{
                            width: `${progress}%`,
                            background: `linear-gradient(90deg, var(--pm-accent, var(--color-brand-primary)) 0%, var(--pm-tint, var(--color-brand-primary)) 100%)`
                        }}
                    >
                        {progress > 8 && (
                            <div className="w-1 h-1 rounded-full animate-ping"
                                style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
