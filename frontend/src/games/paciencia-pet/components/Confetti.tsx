/**
 * Confetti Component - Lightweight celebration effect
 * 
 * Shows pet-themed confetti when player wins
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiProps {
    show: boolean;
    onComplete?: () => void;
}

const PET_EMOJIS = ['🐶', '🐱', '🐰', '🐦', '🐾', '❤️', '🎉', '⭐', '✨'];

// Generate random confetti pieces
const generateConfetti = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        emoji: PET_EMOJIS[Math.floor(Math.random() * PET_EMOJIS.length)],
        x: Math.random() * 100,
        delay: Math.random() * 0.3,
        duration: 2 + Math.random() * 2,
        rotation: Math.random() * 360
    }));
};

export default function Confetti({ show, onComplete }: ConfettiProps) {
    const confettiPieces = generateConfetti(20);

    useEffect(() => {
        if (show && onComplete) {
            const timer = setTimeout(onComplete, 4000);
            return () => clearTimeout(timer);
        }
    }, [show, onComplete]);

    return (
        <AnimatePresence>
            {show && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        pointerEvents: 'none',
                        zIndex: 9999,
                        overflow: 'hidden'
                    }}
                >
                    {confettiPieces.map((piece) => (
                        <motion.div
                            key={piece.id}
                            initial={{
                                x: `${piece.x}vw`,
                                y: '-10vh',
                                opacity: 1,
                                rotate: 0
                            }}
                            animate={{
                                y: '110vh',
                                rotate: piece.rotation,
                                opacity: [1, 1, 0.5, 0]
                            }}
                            transition={{
                                duration: piece.duration,
                                delay: piece.delay,
                                ease: 'linear'
                            }}
                            style={{
                                position: 'absolute',
                                fontSize: '2rem',
                                willChange: 'transform, opacity'
                            }}
                        >
                            {piece.emoji}
                        </motion.div>
                    ))}
                </div>
            )}
        </AnimatePresence>
    );
}
