import { Board, Tile, ResolutionStep, ResolutionResult, Position } from './types';
import { BOARD_SIZE, TILE_TYPES } from './levels';
import { copyBoard, createTile } from './board';
import { findEnhancedMatches } from './match';
import { getRandomItem } from './rng';
import { calculateMatchScore, calculateSpecialScore } from './scoring';
import { createSpecialFromMatch, getSpecialActivationPositions } from './specials';

/**
 * Apply gravity and refill the board
 */
export const applyGravity = (board: Board): Board => {
    const nextBoard = copyBoard(board);

    // For each column
    for (let c = 0; c < BOARD_SIZE; c++) {
        let writeRow = BOARD_SIZE - 1;

        // Compact non-nulls downwards
        for (let r = BOARD_SIZE - 1; r >= 0; r--) {
            if (nextBoard[r][c] !== null) {
                const tile = nextBoard[r][c];
                if (tile) {
                    // Update logical coord
                    tile.y = writeRow;
                    nextBoard[writeRow][c] = tile;
                    if (writeRow !== r) {
                        nextBoard[r][c] = null; // Clear old pos if we moved
                    }
                    writeRow--;
                }
            }
        }

        // Fill remaining top with new tiles
        for (let r = writeRow; r >= 0; r--) {
            const type = getRandomItem(TILE_TYPES);
            nextBoard[r][c] = createTile(type, r, c, true);
        }
    }

    return nextBoard;
};

/**
 * Resolves the board state with advanced match mechanics and special tiles.
 */
export const resolveBoardState = (startBoard: Board): ResolutionResult => {
    let currentBoard = copyBoard(startBoard);
    const steps: ResolutionStep[] = [];
    let totalScore = 0;
    let cascadeLevel = 0;

    while (true) {
        // 1. Find all enhanced matches
        const matches = findEnhancedMatches(currentBoard);
        if (matches.length === 0) break;

        // 2. Clear matches and track which tiles were cleared for special activation
        const boardAfterMatches = copyBoard(currentBoard);
        const clearedPositions: Position[] = [];
        const scoreFromMatches = matches.reduce((sum, m) => sum + calculateMatchScore(m, cascadeLevel), 0);

        matches.forEach(m => {
            m.tiles.forEach(pos => {
                if (boardAfterMatches[pos.row][pos.col]) {
                    clearedPositions.push(pos);
                    boardAfterMatches[pos.row][pos.col] = null;
                }
            });
        });

        // 3. Create Special Tiles from matches
        matches.forEach(m => {
            if (m.type !== 'normal' && m.centerPos) {
                const specialTile = createSpecialFromMatch(m, currentBoard);
                if (specialTile && m.centerPos) {
                    boardAfterMatches[m.centerPos.row][m.centerPos.col] = specialTile;
                }
            }
        });

        // 4. Handle Special Activations (Recursive clearing)
        // If a special tile was at one of the cleared positions, it activates.
        // We need to check the ORIGINAL board for specials that were in the cleared list.
        const activatedSpecials: Tile[] = [];
        clearedPositions.forEach(pos => {
            const tile = currentBoard[pos.row][pos.col];
            if (tile?.special) {
                activatedSpecials.push(tile);
            }
        });

        let specialScore = 0;
        const processedSpecials = new Set<string>();

        // This set is to prevent infinite recursion or multiple processing in same step
        const activateQueue = [...activatedSpecials];
        while (activateQueue.length > 0) {
            const sTile = activateQueue.shift();
            if (!sTile || processedSpecials.has(sTile.id)) continue;
            processedSpecials.add(sTile.id);

            const affected = getSpecialActivationPositions(sTile, currentBoard);
            affected.forEach(pos => {
                const targetTile = boardAfterMatches[pos.row][pos.col];
                if (targetTile) {
                    // If target is another special, add to queue
                    if (targetTile.special && !processedSpecials.has(targetTile.id)) {
                        activateQueue.push(targetTile);
                    }
                    boardAfterMatches[pos.row][pos.col] = null;
                    specialScore += calculateSpecialScore(sTile.special!, 1);
                }
            });
        }

        // 5. Apply Gravity & Refill
        const boardRefilled = applyGravity(boardAfterMatches);

        const stepTotal = scoreFromMatches + specialScore;
        totalScore += stepTotal;

        steps.push({
            boardState: boardRefilled,
            scoreDelta: stepTotal,
            matches: matches,
            clearedPositions: clearedPositions
        });

        currentBoard = boardRefilled;
        cascadeLevel++;

        // Safety break
        if (cascadeLevel > 100) break;
    }

    return { steps, totalScore };
};
