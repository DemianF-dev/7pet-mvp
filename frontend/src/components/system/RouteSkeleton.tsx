/**
 * RouteSkeleton - Premium loading skeleton for route transitions
 * 
 * Displays during lazy route loading to prevent white screens.
 * Apple-inspired clean design with subtle animations.
 * Respects theme (light/dark) and uses CSS tokens.
 */

import { motion } from 'framer-motion';

export default function RouteSkeleton() {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
            {/* Header Skeleton */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-16 bg-[var(--bg-surface)] border-b border-[var(--border-color)] px-4 flex items-center gap-4"
            >
                {/* Logo/Menu placeholder */}
                <div className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] animate-pulse" />

                {/* Title placeholder */}
                <div className="flex-1 flex items-center gap-3">
                    <div className="h-6 w-32 rounded bg-[var(--bg-secondary)] animate-pulse" />
                </div>

                {/* Action buttons placeholder */}
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-[var(--bg-secondary)] animate-pulse" />
                    <div className="w-9 h-9 rounded-full bg-[var(--bg-secondary)] animate-pulse" />
                </div>
            </motion.div>

            {/* Content Area Skeleton */}
            <div className="flex-1 p-4 md:p-6 space-y-4">
                {/* Top section - could be filters or stats */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center justify-between"
                >
                    <div className="h-8 w-48 rounded-lg bg-[var(--bg-surface)] animate-pulse" />
                    <div className="h-10 w-32 rounded-lg bg-[var(--bg-surface)] animate-pulse" />
                </motion.div>

                {/* Main content blocks */}
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.05 }}
                            className="bg-[var(--bg-surface)] rounded-xl p-4 border border-[var(--border-color)]"
                        >
                            {/* Card header */}
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 rounded-full bg-[var(--bg-secondary)] animate-pulse" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-3/4 rounded bg-[var(--bg-secondary)] animate-pulse" />
                                    <div className="h-3 w-1/2 rounded bg-[var(--bg-secondary)] animate-pulse" />
                                </div>
                            </div>

                            {/* Card content lines */}
                            <div className="space-y-2">
                                <div className="h-3 w-full rounded bg-[var(--bg-secondary)] animate-pulse" />
                                <div className="h-3 w-5/6 rounded bg-[var(--bg-secondary)] animate-pulse" />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom section placeholder */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex justify-center pt-4"
                >
                    <div className="h-10 w-40 rounded-lg bg-[var(--bg-surface)] animate-pulse" />
                </motion.div>
            </div>

            {/* Mobile bottom nav placeholder (hidden on desktop) */}
            <div className="lg:hidden h-16 bg-[var(--bg-surface)] border-t border-[var(--border-color)] flex items-center justify-around px-2">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div
                        key={i}
                        className="w-12 h-12 rounded-xl bg-[var(--bg-secondary)] animate-pulse"
                    />
                ))}
            </div>
        </div>
    );
}
