import { motion } from 'framer-motion';

/**
 * PageLoader - Skeleton loading state for lazy-loaded pages
 * Provides a smooth, animated loading experience while code-split chunks load
 */
export default function PageLoader() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-6"
            >
                {/* Animated Logo Placeholder */}
                <motion.div
                    className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-2xl shadow-lg shadow-primary/20"
                    animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />

                {/* Loading Text */}
                <div className="flex flex-col items-center gap-2">
                    <p className="text-gray-600 dark:text-gray-300 font-medium text-sm">
                        Carregando...
                    </p>
                    <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="w-2 h-2 bg-primary rounded-full"
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    delay: i * 0.2
                                }}
                            />
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
