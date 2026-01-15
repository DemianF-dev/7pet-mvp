interface GameErrorProps {
    error: string;
    onRetry: () => void;
    onBack: () => void;
}

export default function GameError({ error, onRetry, onBack }: GameErrorProps) {
    return (
        <div className="w-full h-full flex items-center justify-center p-6">
            <div className="rounded-3xl p-8 text-center max-w-md border shadow-lg"
                style={{
                    backgroundColor: 'var(--color-bg-surface)',
                    borderColor: 'var(--color-border)'
                }}
            >
                <div className="text-6xl mb-4">😿</div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    Ops!
                </h2>
                <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                    Não deu pra abrir o PetMatch agora.
                </p>

                {import.meta.env.DEV && (
                    <p className="text-xs mb-4 p-2 rounded font-mono text-left"
                        style={{
                            backgroundColor: 'var(--color-fill-tertiary)',
                            color: 'var(--color-text-tertiary)'
                        }}
                    >
                        {error}
                    </p>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={onRetry}
                        className="flex-1 py-3 px-4 rounded-xl font-bold text-white shadow-lg active:scale-95 transition-all"
                        style={{ backgroundColor: 'var(--color-brand-primary)' }}
                    >
                        Tentar de Novo
                    </button>
                    <button
                        onClick={onBack}
                        className="flex-1 py-3 px-4 rounded-xl font-medium transition-all border"
                        style={{
                            backgroundColor: 'transparent',
                            borderColor: 'var(--color-border)',
                            color: 'var(--color-text-secondary)'
                        }}
                    >
                        Voltar
                    </button>
                </div>
            </div>
        </div>
    );
}
