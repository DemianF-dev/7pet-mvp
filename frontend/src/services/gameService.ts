import api from '../services/api';

export interface Game {
    id: string;
    title: string;
    description: string;
    slug: string;
    active: boolean;
    baseXp: number;
}

export interface GameSession {
    id: string;
    userId: string;
    gameId: string;
    startTime: string; // ISO date
    endTime?: string;
    score?: number;
    xpEarned?: number;
}

export interface UserStats {
    xp: number;
    level: number;
}

export interface LeaderboardEntry {
    id: string;
    displayName: string;
    xp: number;
    level: number;
    color?: string;
}

export const gameService = {
    listGames: async (): Promise<Game[]> => {
        const response = await api.get('/games');
        return response.data;
    },

    startGameSession: async (gameId: string): Promise<GameSession> => {
        const response = await api.post('/games/session/start', { gameId });
        return response.data;
    },

    endGameSession: async (sessionId: string, score: number): Promise<{
        session: GameSession;
        xpEarned: number;
        newTotalXp: number;
        level: number;
        leveledUp: boolean;
    }> => {
        const response = await api.post('/games/session/end', { sessionId, score });
        return response.data;
    },

    getLeaderboard: async (): Promise<LeaderboardEntry[]> => {
        const response = await api.get('/games/leaderboard');
        return response.data;
    },

    getUserStats: async (): Promise<UserStats> => {
        const response = await api.get('/games/stats');
        return response.data;
    }
};
