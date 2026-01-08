import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
    children: React.ReactNode;
    className?: string;
}

const pageVariants = {
    initial: {
        opacity: 0,
        y: 8, // Slight slide up
        scale: 0.99
    },
    in: {
        opacity: 1,
        y: 0,
        scale: 1
    },
    out: {
        opacity: 0,
        y: -4, // Exit slightly up
        scale: 1 // Don't scale down on exit to avoid layout jumps
    }
};

const pageTransition = {
    type: 'tween',
    ease: 'easeOut',
    duration: 0.25 // Fast, responsive 250ms
};

export const PageTransition = forwardRef<HTMLDivElement, PageTransitionProps>(({ children, className = '' }, ref) => {
    return (
        <motion.div
            ref={ref}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className={`w-full h-full ${className}`}
        >
            {children}
        </motion.div>
    );
});

PageTransition.displayName = 'PageTransition';

export default PageTransition;
