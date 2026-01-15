interface OverlayProps {
    score: number;
    onNext: () => void;
    onReplay: () => void;
}

export const WinOverlay = ({ score, onNext, onReplay }: OverlayProps) => (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6 animate-fade-in">
        <div className="bg-white rounded-3xl p-8 shadow-2xl items-center text-center max-w-sm w-full animate-scale-up">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-black text-[var(--color-text-primary)] mb-2">
                Fase Completa!
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-6">
                Você mandou muito bem!
            </p>

            <div className="bg-[var(--color-surface-2)] rounded-2xl p-4 mb-6">
                <span className="block text-sm text-[var(--color-text-secondary)]">Pontuação Final</span>
                <span className="text-4xl font-black text-[var(--color-brand-primary)]">{score}</span>
            </div>

            <div className="flex flex-col gap-3">
                <button
                    onClick={onNext}
                    className="w-full py-4 rounded-xl bg-[var(--color-brand-primary)] text-white font-bold text-lg shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 active:scale-95 transition-all"
                >
                    Próxima Fase
                </button>
                <button
                    onClick={onReplay}
                    className="w-full py-3 rounded-xl bg-transparent hover:bg-black/5 text-[var(--color-text-secondary)] font-medium transition-all"
                >
                    Jogar Novamente
                </button>
            </div>
        </div>
    </div>
);

export const LoseOverlay = ({ score, onReplay, onBack }: { score: number, onReplay: () => void, onBack: () => void }) => (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6 animate-fade-in">
        <div className="bg-white rounded-3xl p-8 shadow-2xl items-center text-center max-w-sm w-full animate-scale-up">
            <div className="text-6xl mb-4">😿</div>
            <h2 className="text-3xl font-black text-[var(--color-text-primary)] mb-2">
                Sem Jogadas!
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-6">
                Não desanime, tente de novo!
            </p>

            <div className="bg-[var(--color-surface-2)] rounded-2xl p-4 mb-6">
                <span className="block text-sm text-[var(--color-text-secondary)]">Pontuação</span>
                <span className="text-4xl font-black text-[var(--color-text-primary)]">{score}</span>
            </div>

            <div className="flex flex-col gap-3">
                <button
                    onClick={onReplay}
                    className="w-full py-4 rounded-xl bg-[var(--color-brand-primary)] text-white font-bold text-lg shadow-lg shadow-indigo-500/30 active:scale-95 transition-all"
                >
                    Tentar Novamente
                </button>
                <button
                    onClick={onBack}
                    className="w-full py-3 rounded-xl bg-transparent hover:bg-black/5 text-[var(--color-text-secondary)] font-medium transition-all"
                >
                    Voltar ao Menu
                </button>
            </div>
        </div>
    </div>
);
