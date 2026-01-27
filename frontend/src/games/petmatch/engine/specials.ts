/**
 * Special Tile System
 * Creates and activates special tiles (bombs, rays, crosses)
 */

import { Board, Position, Tile, SpecialType, MatchResult } from './types';
import { BOARD_SIZE } from './levels';
import { createTile } from './board';

/**
 * Create a special tile from a match result
 */
export function createSpecialFromMatch(match: MatchResult, board: Board): Tile | null {
    if (!match.centerPos) return null;

    const centerTile = board[match.centerPos.row][match.centerPos.col];
    if (!centerTile) return null;

    let special: SpecialType;

    switch (match.type) {
        case 'five-line':
            special = match.direction === 'horizontal' ? 'ray-h' : 'ray-v';
            break;
        case 'four-line':
            special = 'bomb';
            break;
        case 't-shape':
        case 'l-shape':
            special = 'cross';
            break;
        default:
            return null;
    }

    // Create special tile with same type as original
    const specialTile = createTile(centerTile.type, match.centerPos.row, match.centerPos.col);
    specialTile.special = special;

    return specialTile;
}

/**
 * Get positions affected by activating a special tile
 */
export function getSpecialActivationPositions(tile: Tile, _board: Board): Position[] {
    if (!tile.special) return [];

    const { x: col, y: row } = tile;
    const positions: Position[] = [];

    switch (tile.special) {
        case 'bomb':
            // 3x3 area
            for (let r = Math.max(0, row - 1); r <= Math.min(BOARD_SIZE - 1, row + 1); r++) {
                for (let c = Math.max(0, col - 1); c <= Math.min(BOARD_SIZE - 1, col + 1); c++) {
                    positions.push({ row: r, col: c });
                }
            }
            break;

        case 'ray-h':
            // Entire row
            for (let c = 0; c < BOARD_SIZE; c++) {
                positions.push({ row, col: c });
            }
            break;

        case 'ray-v':
            // Entire column
            for (let r = 0; r < BOARD_SIZE; r++) {
                positions.push({ row: r, col });
            }
            break;

        case 'cross':
            // + pattern (row and column)
            for (let c = 0; c < BOARD_SIZE; c++) {
                positions.push({ row, col: c });
            }
            for (let r = 0; r < BOARD_SIZE; r++) {
                if (r !== row) { // Don't duplicate center
                    positions.push({ row: r, col });
                }
            }
            break;
    }

    return positions;
}

/**
 * Check if a position will activate a special tile (was just matched/swapped into)
 */
export function findActivatedSpecials(board: Board, clearedPositions: Position[]): Tile[] {
    const activated: Tile[] = [];

    for (const pos of clearedPositions) {
        const tile = board[pos.row][pos.col];
        if (tile?.special) {
            activated.push(tile);
        }
    }

    return activated;
}

/**
 * Calculate score for special tile activation
 */
export function calculateSpecialScore(special: SpecialType, tilesCleared: number): number {
    const basePerTile = {
        'bomb': 5,
        'ray-h': 8,
        'ray-v': 8,
        'cross': 10
    };

    return basePerTile[special] * tilesCleared;
}
