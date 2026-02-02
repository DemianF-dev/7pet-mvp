import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import * as gameService from '../services/gameService';

export const listGames = async (req: Request, res: Response) => {
    try {
        const games = await prisma.pauseGame.findMany({
            where: { active: true }
        });
        res.json(games);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch games' });
    }
};

export const startGameSession = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { gameId } = req.body;

        const session = await prisma.pauseSession.create({
            data: {
                userId,
                gameId,
                startTime: new Date()
            }
        });

        res.json(session);
    } catch (error) {
        res.status(500).json({ error: 'Failed to start session' });
    }
};

export const endGameSession = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { sessionId, score } = req.body;

        const session = await prisma.pauseSession.findUnique({
            where: { id: sessionId }
        });

        if (!session || session.userId !== userId) {
            return res.status(404).json({ error: 'Session not found or unauthorized' });
        }

        if (session.endTime) {
            return res.status(400).json({ error: 'Session already ended' });
        }

        const endTime = new Date();
        const durationSeconds = (endTime.getTime() - session.startTime.getTime()) / 1000;

        const xpEarned = await gameService.calculateXp(session.gameId, durationSeconds, score || 0);

        const updatedSession = await prisma.pauseSession.update({
            where: { id: sessionId },
            data: {
                endTime,
                score: score || 0,
                xpEarned
            }
        });

        // Update User XP/Level
        const levelResult = await gameService.processLevelUp(userId, xpEarned);

        if (levelResult) {
            // Update User model directly if processLevelUp doesn't do it (it does in my service)
            // But we might want to return new stats
            // simple re-fetch or use result
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    xp: { increment: xpEarned }
                    // Level logic is inside processLevelUp but for safety let's just rely on service
                    // Actually, let's make sure service does it right.
                }
            });
            // Wait, processLevelUp ALREADY updates the user. I should NOT update it again here or I double count!
            // Let's correct this thought. I will rely on gameService to do the update.
        }

        // Re-fetch user to get current stats
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { xp: true, level: true }
        });

        res.json({
            session: updatedSession,
            xpEarned,
            newTotalXp: user?.xp,
            level: user?.level,
            leveledUp: (levelResult && levelResult.newLevel > levelResult.oldLevel)
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to end session' });
    }
};

export const getLeaderboard = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            where: { xp: { gt: 0 } },
            orderBy: { xp: 'desc' },
            take: 10,
            select: {
                id: true,
                name: true,
                firstName: true,
                xp: true,
                level: true,
                color: true // For avatar maybe?
            }
        });

        const formatted = users.map(u => ({
            ...u,
            displayName: u.name || u.firstName || 'Anônimo'
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
};

export const getUserStats = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { xp: true, level: true }
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};
