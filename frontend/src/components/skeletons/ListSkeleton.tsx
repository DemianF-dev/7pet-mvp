import React from 'react';
import Skeleton from '../Skeleton';
import { cn } from '../../lib/utils';
import { Card } from '../ui/Card';

interface ListSkeletonProps {
    className?: string;
    rowCount?: number;
    hasHeader?: boolean;
    hasAvatar?: boolean;
    hasActions?: boolean;
}

/**
 * A generic skeleton loader for list/table views.
 * Can be used for Pet lists, Customer lists, Quotes, etc.
 */
export function ListSkeleton({
    className,
    rowCount = 5,
    hasHeader = true,
    hasAvatar = true,
    hasActions = true
}: ListSkeletonProps) {
    return (
        <Card className={cn("overflow-hidden border-none shadow-sm", className)}>
            {hasHeader && (
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                    <Skeleton className="h-6 w-1/3 rounded-lg" />
                    {hasActions && <Skeleton className="h-8 w-24 rounded-lg" />}
                </div>
            )}
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {Array.from({ length: rowCount }).map((_, i) => (
                    <div key={i} className="p-4 flex items-center gap-4 animate-pulse">
                        {hasAvatar && (
                            <Skeleton className="w-12 h-12 rounded-2xl flex-shrink-0" />
                        )}
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4 rounded" />
                            <Skeleton className="h-3 w-1/2 rounded" />
                        </div>
                        {hasActions && (
                            <div className="flex gap-2">
                                <Skeleton className="w-8 h-8 rounded-lg" />
                                <Skeleton className="w-8 h-8 rounded-lg" />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </Card>
    );
}

interface CardGridSkeletonProps {
    className?: string;
    count?: number;
}

/**
 * Skeleton for grid-based views (e.g. Products, Services cards)
 */
export function CardGridSkeleton({ className, count = 6 }: CardGridSkeletonProps) {
    return (
        <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
            {Array.from({ length: count }).map((_, i) => (
                <Card key={i} className="p-4 space-y-4">
                    <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-xl" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-2/3 rounded" />
                            <Skeleton className="h-3 w-1/3 rounded" />
                        </div>
                    </div>
                    <Skeleton className="h-20 w-full rounded-xl" />
                    <div className="flex justify-between items-center pt-2">
                        <Skeleton className="h-4 w-16 rounded" />
                        <Skeleton className="h-8 w-8 rounded-lg" />
                    </div>
                </Card>
            ))}
        </div>
    );
}
