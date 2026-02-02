/**
 * Confetti Component - Celebracao de vitoria
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiPiece {
    id: number;
    x: number;
    y: number;
    rotation: number;
    color: string;
    size: number;
    delay: number;
}

const colors = ['#e53935', '#5dade2', '#ff4081', '#ffc107', '#4caf50', '#9c27b0'];

interface ConfettiProps {
    isActive: boolean;
    onComplete?: () => void;
}

export default function Confetti({ isActive, onComplete }: ConfettiProps) {
    const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

    useEffect(() => {
        if (isActive) {
            const newPieces: ConfettiPiece[] = [];
            for (let i = 0; i < 100; i++) {
                newPieces.push({
                    id: i,
                    x: Math.random() * 100,
                    y: -10 - Math.random() * 20,
                    rotation: Math.random() * 360,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    size: 8 + Math.random() * 8,
                    delay: Math.random() * 0.8
                });
            }
            setPieces(newPieces);

            const timer = setTimeout(() => {
                setPieces([]);
                onComplete?.();
            }, 5000);

            return () => clearTimeout(timer);
        } else {
            setPieces([]);
        }
    }, [isActive, onComplete]);

    return (
        <AnimatePresence>
            {pieces.map(piece => (
                <motion.div
                    key={piece.id}
                    initial={{
                        x: `${piece.x}vw`,
                        y: `${piece.y}vh`,
                        rotate: piece.rotation,
                        opacity: 1,
                        scale: 0
                    }}
                    animate={{
                        y: '110vh',
                        rotate: piece.rotation + 720,
                        opacity: [1, 1, 0],
                        scale: [0, 1, 1]
                    }}
                    exit={{ opacity: 0 }}
                    transition={{
                        duration: 3.5 + Math.random() * 1.5,
                        delay: piece.delay,
                        ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                    style={{
                        position: 'fixed',
                        left: 0,
                        top: 0,
                        width: piece.size,
                        height: piece.size,
                        backgroundColor: piece.color,
                        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                        zIndex: 9999,
                        pointerEvents: 'none'
                    }}
                />
            ))}
        </AnimatePresence>
    );
}

// Win overlay
export function WinText({ isVisible }: { isVisible: boolean }) {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9998,
                        pointerEvents: 'none',
                        background: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(8px)'
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.8, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.8, y: 20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        style={{
                            background: 'white',
                            padding: '40px 60px',
                            borderRadius: 24,
                            boxShadow: '0 25px 80px rgba(0,0,0,0.3)',
                            textAlign: 'center'
                        }}
                    >
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            style={{ fontSize: 64, marginBottom: 16 }}
                        >
                            🏆
                        </motion.div>

                        <h2 style={{
                            fontSize: 32,
                            fontWeight: 800,
                            color: '#1a1a1a',
                            margin: 0,
                            fontFamily: 'Outfit, sans-serif'
                        }}>
                            Parabens!
                        </h2>

                        <p style={{
                            fontSize: 16,
                            color: '#666',
                            margin: '12px 0 0 0'
                        }}>
                            Voce venceu o jogo!
                        </p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
