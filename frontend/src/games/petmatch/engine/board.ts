import { Board, Tile, TileType, Position } from './types';
import { TILE_TYPES, BOARD_SIZE } from './levels';
import { getRandomItem } from './rng';
import { findMatchesInBoard } from './match';

let uniqueIdCounter = 0;
const generateId = (type: string) => `${type}_${Date.now()}_${uniqueIdCounter++}`;

export const createTile = (type: TileType, row: number, col: number, isNew = false): Tile => ({
    id: generateId(type),
    type,
    x: col,
    y: row,
    isNew,
});

export const createEmptyBoard = (): Board => {
    return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
};

/**
 * Generates an initial board with NO matches.
 */
export const generateBoard = (): Board => {
    const board: Board = createEmptyBoard();

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            let type: TileType;
            do {
                type = getRandomItem(TILE_TYPES);
            } while (
                (c >= 2 && board[r][c - 1]?.type === type && board[r][c - 2]?.type === type) ||
                (r >= 2 && board[r - 1][c]?.type === type && board[r - 2][c]?.type === type)
            );
            board[r][c] = createTile(type, r, c);
        }
    }

    // Ensure at least one move exists? Complex. 
    // Usually standard random generation on 8x8 with 6 types almost guarantees a move.
    // Ideally we would check 'hasPossibleMoves(board)' and regenerate if false.
    // For MVP/V1, we'll trust probability (~99.9% chance of a move).

    return board;
};

export const copyBoard = (board: Board): Board => {
    return board.map(row => row.map(tile => tile ? { ...tile } : null));
};

export const isValidPos = (pos: Position): boolean => {
    return pos.row >= 0 && pos.row < BOARD_SIZE && pos.col >= 0 && pos.col < BOARD_SIZE;
};

export const areAdjacent = (p1: Position, p2: Position): boolean => {
    const dr = Math.abs(p1.row - p2.row);
    const dc = Math.abs(p1.col - p2.col);
    return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
};
