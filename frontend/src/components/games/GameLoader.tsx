/**
 * GameLoader - Premium loading skeleton for games
 * 
 * Displayed while a game module is being lazy loaded.
 * Uses design system tokens for consistency.
 */

import '../../styles/design-system-base.css';

export default function GameLoader() {
    return (
        <div className="page-container">
            <div className="page-content">
                {/* Header skeleton */}
                <div className="page-header">
                    <div
                        className="skeleton"
                        style={{
                            width: '200px',
                            height: '32px',
                            marginBottom: 'var(--space-2)'
                        }}
                    />
                    <div
                        className="skeleton"
                        style={{
                            width: '300px',
                            height: '20px'
                        }}
                    />
                </div>

                {/* Game area skeleton */}
                <div className="card card-padding-lg">
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--space-6)',
                        minHeight: '500px'
                    }}>
                        {/* Top row skeleton (deck, waste, foundations) */}
                        <div style={{
                            display: 'flex',
                            gap: 'var(--space-4)',
                            flexWrap: 'wrap'
                        }}>
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className="skeleton"
                                    style={{
                                        width: '80px',
                                        height: '112px',
                                        borderRadius: 'var(--radius-lg)'
                                    }}
                                />
                            ))}
                        </div>

                        {/* Bottom row skeleton (tableau) */}
                        <div style={{
                            display: 'flex',
                            gap: 'var(--space-3)',
                            flexWrap: 'wrap'
                        }}>
                            {[...Array(7)].map((_, i) => (
                                <div
                                    key={i}
                                    className="skeleton"
                                    style={{
                                        width: '80px',
                                        height: '200px',
                                        borderRadius: 'var(--radius-lg)'
                                    }}
                                />
                            ))}
                        </div>

                        {/* Button row skeleton */}
                        <div style={{
                            display: 'flex',
                            gap: 'var(--space-3)',
                            marginTop: 'auto'
                        }}>
                            {[...Array(2)].map((_, i) => (
                                <div
                                    key={i}
                                    className="skeleton"
                                    style={{
                                        width: '120px',
                                        height: '40px',
                                        borderRadius: 'var(--radius-md)'
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Loading text */}
                <div style={{
                    textAlign: 'center',
                    marginTop: 'var(--space-6)',
                    color: 'var(--color-text-tertiary)',
                    fontSize: 'var(--font-size-footnote)'
                }}>
                    Carregando jogo...
                </div>
            </div>
        </div>
    );
}
