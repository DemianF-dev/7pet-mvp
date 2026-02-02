import { PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma'; // Assumes shared prisma instance

// XP Constants
const XP_PER_LEVEL = 1000;
const SESSION_MIN_DURATION_SEC = 30; // Minimum duration to earn XP

interface GameResult {
    gameId: string;
    userId: string;
    durationSeconds: number;
    score: number;
}

export const calculateXp = async (gameId: string, durationSeconds: number, score: number): Promise<number> => {
    // Basic XP calculation:
    // 1 minute = 10 XP (base)
    // Bonus for score? For now, keep it simple: based on time + small score factor

    if (durationSeconds < SESSION_MIN_DURATION_SEC) return 0;

    const game = await prisma.pauseGame.findUnique({
        where: { id: gameId }
    });

    if (!game) return 0;

    const base = game.baseXp || 10;
    const durationMinutes = Math.floor(durationSeconds / 60);

    // Cap duration to avoid abuse (e.g., max 20 minutes per session count)
    const effectiveMinutes = Math.min(durationMinutes, 20);

    let xp = base + (effectiveMinutes * 5);

    // Add score bonus if applicable (e.g. 1 XP per 100 points, capped)
    if (score > 0) {
        xp += Math.floor(score / 100);
    }

    return Math.floor(xp);
};

export const processLevelUp = async (userId: string, addedXp: number) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { xp: true, level: true }
    });

    if (!user) return null;

    const newXp = (user.xp || 0) + addedXp;
    const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;

    // Only update if changes
    if (newXp !== user.xp || newLevel !== user.level) {
        await prisma.user.update({
            where: { id: userId },
            data: {
                xp: newXp,
                level: newLevel
            }
        });
    }

    return {
        oldLevel: user.level,
        newLevel,
        leveledUp: newLevel > user.level
    };
};
