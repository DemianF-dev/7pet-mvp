export type TileType = 'paw' | 'bone' | 'ball' | 'bow' | 'fish' | 'bubble';

export type SpecialType =
    | 'bomb'   // Explodes 3x3 area (from 4-match)
    | 'ray-h'  // Clears horizontal row (from 5-match horizontal)
    | 'ray-v'  // Clears vertical column (from 5-match vertical)
    | 'cross'; // Clears + pattern (from T/L shape)

export type MatchType =
    | 'normal'      // 3-match
    | 'four-line'   // 4 in a row → Bomb
    | 'five-line'   // 5 in a row → Ray
    | 't-shape'     // T shape → Cross
    | 'l-shape';    // L shape → Cross

export interface Tile {
    id: string;
    type: TileType;
    x: number;  // column
    y: number;  // row
    isNew?: boolean;      // For spawn animation
    isMatched?: boolean;  // For clearing animation
    special?: SpecialType; // Special type if this is a special tile
}

export type Board = (Tile | null)[][];

export interface Position {
    row: number;
    col: number;
}

export interface Move {
    from: Position;
    to: Position;
}

export interface MatchResult {
    tiles: Position[];
    type: MatchType;
    centerPos?: Position; // Where to spawn special tile
    direction?: 'horizontal' | 'vertical'; // For ray tiles
}

export interface LevelConfig {
    level: number;
    goalScore: number;
    moves: number;
}

export interface GameState {
    level: number;
    score: number;
    movesLeft: number;
    board: Board;
    status: 'idle' | 'animating' | 'won' | 'lost';
    bestScore: number;
}

export interface GameProgress {
    highestUnlockedLevel: number;
    bestScores: Record<number, number>; // level -> score
}

export interface ResolutionStep {
    boardState: Board;
    scoreDelta: number;
    matches?: MatchResult[];
    clearedPositions?: Position[];
    specialsActivated?: SpecialType[];
}

export interface ResolutionResult {
    steps: ResolutionStep[];
    totalScore: number;
}
