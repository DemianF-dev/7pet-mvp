/**
 * Types for Desenrosca a Coleira game
 */

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Point {
    x: number;
    y: number;
}

export interface Node {
    id: string;
    x: number;      // 0-1 normalized
    y: number;      // 0-1 normalized
    label?: string; // Pet emoji (optional)
}

export interface Edge {
    id: string;
    from: string;   // node id
    to: string;     // node id
}

export interface GameState {
    nodes: Node[];
    edges: Edge[];
    crossings: number;
    moves: number;
    time: number;
    difficulty: Difficulty;
    isPaused: boolean;
    isSolved: boolean;
}

export interface GameOptions {
    onWin?: () => void;
    onLose?: () => void;
    reducedMotion?: boolean;
    lowPowerMode?: boolean;
}
