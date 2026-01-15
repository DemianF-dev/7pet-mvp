import { ReactNode, useMemo, useEffect, useState } from 'react';
import { getLevelTheme } from './theme/levelThemes';

interface GameCardProps {
    level: number;
    children: ReactNode;
    className?: string;
}

export default function GameCard({ level, children, className = '' }: GameCardProps) {
    const [isDark, setIsDark] = useState(false);

    // Detect theme mode
    useEffect(() => {
        const checkTheme = () => {
            const isDarkMode = document.documentElement.dataset.theme === 'dark' ||
                document.documentElement.classList.contains('dark');
            setIsDark(isDarkMode);
        };

        checkTheme();

        // Watch for theme changes
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme', 'class']
        });

        return () => observer.disconnect();
    }, []);

    const theme = useMemo(() => getLevelTheme(level, isDark), [level, isDark]);

    const gradientStyle = {
        background: `
            radial-gradient(circle at 20% 30%, ${theme.glow} 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, ${theme.tint} 0%, transparent 50%),
            linear-gradient(135deg, ${theme.accent} 0%, transparent 60%)
        `,
        opacity: isDark ? 0.18 : 0.12
    };

    const blobsStyle = {
        backgroundImage: `
            radial-gradient(ellipse 200px 180px at 10% 20%, ${theme.accent} 0%, transparent 70%),
            radial-gradient(ellipse 220px 200px at 90% 80%, ${theme.tint} 0%, transparent 70%),
            radial-gradient(ellipse 180px 160px at 50% 50%, ${theme.glow} 0%, transparent 70%),
            radial-gradient(ellipse 160px 140px at 30% 70%, ${theme.accent} 0%, transparent 70%)
        `,
        opacity: isDark ? 0.12 : 0.08,
        animation: 'floatBlobs 14s ease-in-out infinite'
    };

    return (
        <>
            <style>{`
                @keyframes floatBlobs {
                    0%, 100% {
                        background-position: 0% 0%, 100% 100%, 50% 50%, 30% 70%;
                    }
                    33% {
                        background-position: 10% 10%, 90% 90%, 60% 40%, 20% 80%;
                    }
                    66% {
                        background-position: 5% 15%, 95% 85%, 45% 55%, 35% 65%;
                    }
                }
                
                @media (prefers-reduced-motion: reduce) {
                    .petmatch-bg-blobs {
                        animation: none !important;
                    }
                }
            `}</style>

            <div
                className={`petmatch-card relative rounded-3xl overflow-hidden border border-[var(--color-border)] ${className}`}
            >
                {/* Animated background layers */}
                <div className="petmatch-bg-container absolute inset-0 pointer-events-none">
                    {/* Layer 1: Gradient base */}
                    <div className="petmatch-bg-gradient absolute inset-0" style={gradientStyle} />

                    {/* Layer 2: Blob shapes */}
                    <div className="petmatch-bg-blobs absolute inset-0" style={blobsStyle} />
                </div>

                {/* Content */}
                <div className="relative z-10">
                    {children}
                </div>
            </div>
        </>
    );
}
