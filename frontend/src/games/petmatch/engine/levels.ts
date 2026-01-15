import { LevelConfig } from './types';

export const LEVEL_CONFIGS: LevelConfig[] = [
    { level: 1, goalScore: 800, moves: 18 },
    { level: 2, goalScore: 1200, moves: 18 },
    { level: 3, goalScore: 1600, moves: 19 },
    { level: 4, goalScore: 2200, moves: 20 },
    { level: 5, goalScore: 2800, moves: 20 },
    { level: 6, goalScore: 3500, moves: 21 },
    { level: 7, goalScore: 4300, moves: 22 },
    { level: 8, goalScore: 5200, moves: 22 },
    { level: 9, goalScore: 6200, moves: 23 },
    { level: 10, goalScore: 7500, moves: 24 },
];

export const TILE_TYPES: import('./types').TileType[] = ['paw', 'bone', 'ball', 'bow', 'fish', 'bubble'];

export const BOARD_SIZE = 8;
