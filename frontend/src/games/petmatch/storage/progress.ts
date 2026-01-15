import { GameProgress } from '../engine/types';

const STORAGE_KEY = 'pause_petmatch_progress_v1';

const DEFAULT_PROGRESS: GameProgress = {
    highestUnlockedLevel: 1,
    bestScores: {}
};

export const loadProgress = (): GameProgress => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_PROGRESS;
        return JSON.parse(raw) as GameProgress;
    } catch {
        return DEFAULT_PROGRESS;
    }
};

export const saveProgress = (progress: GameProgress) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
        console.error('Failed to save petmatch progress', e);
    }
};

export const updateLevelProgress = (level: number, score: number) => {
    const current = loadProgress();

    // Unlock next level if this was the highest
    if (level === current.highestUnlockedLevel && level < 10) {
        current.highestUnlockedLevel = level + 1;
    } else if (level === current.highestUnlockedLevel && level === 10) {
        // Completed game (level 10 done)
        // ensure it stays 10 or maybe mark "completed"? 
        // For logic "highestUnlockedLevel" implies index of available level.
    }

    // Save best score
    const oldBest = current.bestScores[level] || 0;
    if (score > oldBest) {
        current.bestScores[level] = score;
    }

    saveProgress(current);
    return current;
};
