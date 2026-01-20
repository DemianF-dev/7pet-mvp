/**
 * VirtualList - Virtualized list component for optimal performance
 * 
 * Renders only visible items + overscan to maintain smooth 60fps scrolling
 * even with hundreds or thousands of items.
 * 
 * Features:
 * - Dynamic height estimation
 * - Infinite scroll support
 * - Smooth scrolling performance
 * - Minimal DOM nodes
 * 
 * Example:
 * ```tsx
 * <VirtualList
 *   items={customers}
 *   estimateSize={72}
 *   overscan={5}
 *   renderItem={(customer, index) => <CustomerCard key={customer.id} customer={customer} />}
 *   onEndReached={() => fetchNextPage()}
 *   threshold={5}
 * />
 * ```
 */

import { ReactNode, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualListProps<T> {
    items: T[];
    estimateSize: number; // Estimated height of each item in pixels
    overscan?: number; // Number of items to render outside viewport (default: 5)
    renderItem: (item: T, index: number) => ReactNode;
    onEndReached?: () => void; // Callback when scrolling near end (infinite scroll)
    threshold?: number; // Number of items from end to trigger onEndReached (default: 5)
    className?: string;
    emptyState?: ReactNode;
}

export default function VirtualList<T>({
    items,
    estimateSize,
    overscan = 5,
    renderItem,
    onEndReached,
    threshold = 5,
    className = '',
    emptyState
}: VirtualListProps<T>) {
    const parentRef = useRef<HTMLDivElement>(null);
    const lastIndexRef = useRef<number>(0);

    // Initialize virtualizer
    const virtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => estimateSize,
        overscan: overscan,
    });

    const virtualItems = virtualizer.getVirtualItems();

    // Handle infinite scroll
    useEffect(() => {
        if (!onEndReached || items.length === 0) return;

        const lastItem = virtualItems[virtualItems.length - 1];
        if (!lastItem) return;

        // Check if we're near the end
        const isNearEnd = lastItem.index >= items.length - threshold;
        const hasScrolledFurther = lastItem.index > lastIndexRef.current;

        if (isNearEnd && hasScrolledFurther) {
            lastIndexRef.current = lastItem.index;
            onEndReached();
        }
    }, [virtualItems, items.length, threshold, onEndReached]);

    // Empty state
    if (items.length === 0) {
        if (emptyState) {
            return <>{emptyState}</>;
        }
        return (
            <div className="flex items-center justify-center py-12 text-[var(--text-secondary)]">
                <p className="text-sm">Nenhum item encontrado</p>
            </div>
        );
    }

    return (
        <div
            ref={parentRef}
            className={`overflow-auto ${className}`}
            style={{ height: '100%', width: '100%' }}
        >
            <div
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {virtualItems.map((virtualItem) => {
                    const item = items[virtualItem.index];
                    return (
                        <div
                            key={virtualItem.key}
                            data-index={virtualItem.index}
                            ref={virtualizer.measureElement}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                transform: `translateY(${virtualItem.start}px)`,
                            }}
                        >
                            {renderItem(item, virtualItem.index)}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
