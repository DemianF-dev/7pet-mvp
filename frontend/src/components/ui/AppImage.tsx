/**
 * AppImage - Optimized image component with lazy loading
 * 
 * Features:
 * - Lazy loading (unless priority flag)
 * - Async decoding
 * - Aspect ratio preservation (prevents layout shift)
 * - Placeholder while loading
 * - Error fallback
 * - Low fetch priority for non-critical images
 * 
 * Example:
 * ```tsx
 * <AppImage
 *   src="/pet-avatar.jpg"
 *   alt="Dog portrait"
 *   aspectRatio="1/1"
 *   className="rounded-full"
 * />
 * ```
 */

import { useState, ImgHTMLAttributes } from 'react';

interface AppImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'loading' | 'decoding'> {
    src: string;
    alt: string;
    aspectRatio?: string; // CSS aspect-ratio value, e.g., "16/9", "1/1", "4/3"
    priority?: boolean; // Set true for above-the-fold images
    fallbackSrc?: string; // Image to show on error
    onLoad?: () => void;
    onError?: () => void;
}

export default function AppImage({
    src,
    alt,
    aspectRatio,
    priority = false,
    fallbackSrc = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23e0e0e0" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-family="sans-serif" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E',
    className = '',
    style,
    onLoad,
    onError,
    ...props
}: AppImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [currentSrc, setCurrentSrc] = useState(src);

    const handleLoad = () => {
        setIsLoaded(true);
        onLoad?.();
    };

    const handleError = () => {
        if (!hasError) {
            setHasError(true);
            setCurrentSrc(fallbackSrc);
            onError?.();
        }
    };

    const containerStyle: React.CSSProperties = {
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-secondary, #f5f5f5)',
        ...(aspectRatio && { aspectRatio }),
        ...style,
    };

    const imageStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
    };

    return (
        <div className={className} style={containerStyle}>
            {/* Placeholder background (visible while loading) */}
            {!isLoaded && !hasError && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'var(--bg-secondary, #e0e0e0)',
                        backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.5s infinite',
                    }}
                />
            )}

            {/* Actual image */}
            <img
                {...props}
                src={currentSrc}
                alt={alt}
                loading={priority ? 'eager' : 'lazy'}
                decoding="async"
                fetchPriority={priority ? 'high' : 'low'}
                onLoad={handleLoad}
                onError={handleError}
                style={imageStyle}
            />

            {/* Shimmer animation */}
            <style>
                {`
                    @keyframes shimmer {
                        0% { background-position: -200% 0; }
                        100% { background-position: 200% 0; }
                    }
                `}
            </style>
        </div>
    );
}
