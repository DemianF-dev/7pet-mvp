export default function GameLoader() {
    return (
        <div className="w-full h-full flex items-center justify-center p-4 animate-pulse">
            <div className="w-full max-w-[980px]">
                <div className="rounded-3xl border p-5 md:p-6"
                    style={{
                        backgroundColor: 'var(--color-bg-surface)',
                        borderColor: 'var(--color-border)'
                    }}
                >
                    <div className="flex flex-col gap-4">
                        {/* HUD Skeleton */}
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                                <div className="h-8 w-20 rounded-xl"
                                    style={{ backgroundColor: 'var(--color-fill-tertiary)' }}
                                />
                                <div className="flex gap-2">
                                    <div className="h-7 w-16 rounded-full"
                                        style={{ backgroundColor: 'var(--color-fill-tertiary)' }}
                                    />
                                    <div className="h-7 w-24 rounded-full"
                                        style={{ backgroundColor: 'var(--color-fill-tertiary)' }}
                                    />
                                </div>
                            </div>
                            <div className="h-12 rounded-2xl"
                                style={{ backgroundColor: 'var(--color-fill-tertiary)' }}
                            />
                        </div>

                        {/* Grid Skeleton */}
                        <div className="flex items-center justify-center py-4">
                            <div className="w-full max-w-[500px] aspect-square grid grid-cols-8 gap-2">
                                {Array.from({ length: 64 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="rounded-2xl"
                                        style={{ backgroundColor: 'var(--color-fill-tertiary)' }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
