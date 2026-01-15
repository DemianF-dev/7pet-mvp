/**
 * Design Tokens for PetMatch
 * Maps logical game elements to CSS Variables
 */

export const PETMATCH_THEME = {
    grid: {
        background: 'var(--color-surface-2)',
        gap: 'var(--space-2)',
        padding: 'var(--space-2)',
        radius: 'var(--radius-xl)',
    },
    tiles: {
        paw: 'var(--color-orange-500)',     // Fallback if custom token missing
        bone: 'var(--color-slate-400)',
        ball: 'var(--color-red-500)',
        bow: 'var(--color-pink-500)',
        fish: 'var(--color-blue-500)',
        bubble: 'var(--color-cyan-400)',
    },
    ui: {
        primary: 'var(--color-brand-primary)',
        text: 'var(--color-text-primary)',
        textSecondary: 'var(--color-text-secondary)',
    }
};

// Types for tile colors
export type TileColorVar = string;

export const getTileColor = (type: string): TileColorVar => {
    switch (type) {
        case 'paw': return 'var(--color-orange-500, #f97316)';
        case 'bone': return 'var(--color-slate-400, #94a3b8)';
        case 'ball': return 'var(--color-red-500, #ef4444)';
        case 'bow': return 'var(--color-pink-500, #ec4899)';
        case 'fish': return 'var(--color-blue-500, #3b82f6)';
        case 'bubble': return 'var(--color-cyan-400, #22d3ee)';
        default: return 'var(--color-text-primary)';
    }
};
