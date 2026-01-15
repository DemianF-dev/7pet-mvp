/**
 * Enhanced Match Detection
 * Detects 3+, 4, 5, T-shapes, and L-shapes
 */

import { Board, Position, MatchResult, MatchType, Tile } from './types';
import { BOARD_SIZE } from './levels';

/**
 * Find all enhanced matches on the board
 * Priority: 5-match > T/L shapes > 4-match > 3-match
 */
export function findEnhancedMatches(board: Board): MatchResult[] {
    const results: MatchResult[] = [];
    const processed = new Set<string>();

    // Helper to mark positions as processed
    const markProcessed = (positions: Position[]) => {
        positions.forEach(p => processed.add(`${p.row},${p.col}`));
    };

    const isProcessed = (p: Position) => processed.has(`${p.row},${p.col}`);

    // 1. Check for 5-in-a-row (highest priority)
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (isProcessed({ row, col })) continue;
            const tile = board[row][col];
            if (!tile) continue;

            // Horizontal 5-match
            const hMatch = findLineMatch(board, row, col, 0, 1, 5);
            if (hMatch.length >= 5) {
                const centerPos = { row, col: col + Math.floor(hMatch.length / 2) };
                results.push({
                    tiles: hMatch,
                    type: 'five-line',
                    centerPos,
                    direction: 'horizontal'
                });
                markProcessed(hMatch);
                continue;
            }

            // Vertical 5-match
            const vMatch = findLineMatch(board, row, col, 1, 0, 5);
            if (vMatch.length >= 5) {
                const centerPos = { row: row + Math.floor(vMatch.length / 2), col };
                results.push({
                    tiles: vMatch,
                    type: 'five-line',
                    centerPos,
                    direction: 'vertical'
                });
                markProcessed(vMatch);
            }
        }
    }

    // 2. Check for T and L shapes
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (isProcessed({ row, col })) continue;
            const tile = board[row][col];
            if (!tile) continue;

            const tShape = findTShape(board, row, col);
            if (tShape) {
                results.push(tShape);
                markProcessed(tShape.tiles);
                continue;
            }

            const lShape = findLShape(board, row, col);
            if (lShape) {
                results.push(lShape);
                markProcessed(lShape.tiles);
            }
        }
    }

    // 3. Check for 4-in-a-row
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (isProcessed({ row, col })) continue;
            const tile = board[row][col];
            if (!tile) continue;

            // Horizontal 4-match
            const hMatch = findLineMatch(board, row, col, 0, 1, 4);
            if (hMatch.length >= 4) {
                const centerPos = { row, col: col + Math.floor(hMatch.length / 2) };
                results.push({
                    tiles: hMatch,
                    type: 'four-line',
                    centerPos
                });
                markProcessed(hMatch);
                continue;
            }

            // Vertical 4-match
            const vMatch = findLineMatch(board, row, col, 1, 0, 4);
            if (vMatch.length >= 4) {
                const centerPos = { row: row + Math.floor(vMatch.length / 2), col };
                results.push({
                    tiles: vMatch,
                    type: 'four-line',
                    centerPos
                });
                markProcessed(vMatch);
            }
        }
    }

    // 4. Check for regular 3-matches
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (isProcessed({ row, col })) continue;
            const tile = board[row][col];
            if (!tile) continue;

            // Horizontal 3-match
            const hMatch = findLineMatch(board, row, col, 0, 1, 3);
            if (hMatch.length >= 3) {
                results.push({
                    tiles: hMatch,
                    type: 'normal'
                });
                markProcessed(hMatch);
                continue;
            }

            // Vertical 3-match
            const vMatch = findLineMatch(board, row, col, 1, 0, 3);
            if (vMatch.length >= 3) {
                results.push({
                    tiles: vMatch,
                    type: 'normal'
                });
                markProcessed(vMatch);
            }
        }
    }

    return results;
}

/**
 * Find a line match starting from (row, col) in direction (dRow, dCol)
 * Returns all matching positions (including start)
 */
function findLineMatch(
    board: Board,
    row: number,
    col: number,
    dRow: number,
    dCol: number,
    minLength: number
): Position[] {
    const tile = board[row][col];
    if (!tile) return [];

    const matches: Position[] = [{ row, col }];
    let r = row + dRow;
    let c = col + dCol;

    while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
        const next = board[r][c];
        if (!next || next.type !== tile.type) break;
        // Don't match with special tiles of different types
        if (tile.special && next.special && tile.special !== next.special) break;

        matches.push({ row: r, col: c });
        r += dRow;
        c += dCol;
    }

    return matches.length >= minLength ? matches : [];
}

/**
 * Find T-shape: Center with 3+ in each direction
 *   X
 * X X X
 *   X
 */
function findTShape(board: Board, row: number, col: number): MatchResult | null {
    const tile = board[row][col];
    if (!tile) return null;

    // Check all 4 T orientations
    const patterns = [
        // T pointing up: has left, right, and down
        { horizontal: [0, 1], vertical: [1, 0] },
        // T pointing down: has left, right, and up
        { horizontal: [0, 1], vertical: [-1, 0] },
        // T pointing left: has up, down, and right
        { horizontal: [1, 0], vertical: [0, 1] },
        // T pointing right: has up, down, and left
        { horizontal: [1, 0], vertical: [0, -1] }
    ];

    for (const pattern of patterns) {
        const [dRow1, dCol1] = pattern.horizontal;
        const [dRow2, dCol2] = pattern.vertical;

        const line1 = findLineMatch(board, row, col, dRow1, dCol1, 3);
        const line2 = findLineMatch(board, row, col, dRow2, dCol2, 3);

        if (line1.length >= 3 && line2.length >= 3) {
            // Combine and deduplicate
            const allTiles = [...line1, ...line2];
            const unique = Array.from(
                new Set(allTiles.map(p => `${p.row},${p.col}`))
            ).map(key => {
                const [r, c] = key.split(',').map(Number);
                return { row: r, col: c };
            });

            return {
                tiles: unique,
                type: 't-shape',
                centerPos: { row, col }
            };
        }
    }

    return null;
}

/**
 * Find L-shape: Corner with 3+ in two perpendicular directions
 * X
 * X
 * X X X
 */
function findLShape(board: Board, row: number, col: number): MatchResult | null {
    const tile = board[row][col];
    if (!tile) return null;

    // Check all 4 L orientations
    const patterns = [
        { dir1: [0, 1], dir2: [1, 0] },   // Right + Down
        { dir1: [0, 1], dir2: [-1, 0] },  // Right + Up
        { dir1: [0, -1], dir2: [1, 0] },  // Left + Down
        { dir1: [0, -1], dir2: [-1, 0] }  // Left + Up
    ];

    for (const pattern of patterns) {
        const [dRow1, dCol1] = pattern.dir1;
        const [dRow2, dCol2] = pattern.dir2;

        const line1 = findLineMatch(board, row, col, dRow1, dCol1, 3);
        const line2 = findLineMatch(board, row, col, dRow2, dCol2, 3);

        if (line1.length >= 3 && line2.length >= 3) {
            const allTiles = [...line1, ...line2];
            const unique = Array.from(
                new Set(allTiles.map(p => `${p.row},${p.col}`))
            ).map(key => {
                const [r, c] = key.split(',').map(Number);
                return { row: r, col: c };
            });

            return {
                tiles: unique,
                type: 'l-shape',
                centerPos: { row, col }
            };
        }
    }

    return null;
}

// Keep old function for backward compatibility (will be removed)
export function findMatchesInBoard(board: Board): MatchResult[] {
    return findEnhancedMatches(board);
}
