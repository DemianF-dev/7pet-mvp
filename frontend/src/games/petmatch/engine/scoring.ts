/**
 * Enhanced Scoring System
 * Calculates scores for matches, cascades, and special activations
 */

import { MatchResult, SpecialType } from './types';

/**
 * Calculate score for a match
 */
export function calculateMatchScore(match: MatchResult, cascadeLevel: number = 0): number {
    let baseScore = 0;

    // Base points by match size
    const size = match.tiles.length;
    if (size === 3) {
        baseScore = 10;
    } else if (size === 4) {
        baseScore = 30;
    } else if (size === 5) {
        baseScore = 60;
    } else {
        baseScore = 10 * size; // 6+ matches
    }

    // Shape bonus
    if (match.type === 't-shape' || match.type === 'l-shape') {
        baseScore = Math.floor(baseScore * 1.5);
    }

    // Cascade multiplier (1x, 1.5x, 2x, 2.5x...)
    const cascadeMultiplier = 1 + (cascadeLevel * 0.5);
    baseScore = Math.floor(baseScore * cascadeMultiplier);

    return baseScore;
}

/**
 * Calculate score for special tile activation
 */
export function calculateSpecialScore(special: SpecialType, tilesCleared: number): number {
    const basePerTile: Record<SpecialType, number> = {
        'bomb': 5,
        'ray-h': 8,
        'ray-v': 8,
        'cross': 10
    };

    return basePerTile[special] * tilesCleared;
}
