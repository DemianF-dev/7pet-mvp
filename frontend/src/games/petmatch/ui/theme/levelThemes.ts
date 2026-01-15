/**
 * Level-based theme palettes for PetMatch
 * Each level gets unique colors for accent, tint, and glow
 * These are applied as CSS custom properties on the game card
 */

export interface LevelTheme {
    accent: string;  // Primary color for progress bars, rings
    tint: string;    // Secondary gradient color
    glow: string;    // Highlight/glow color
}

export const LEVEL_THEMES: Record<number, LevelTheme> = {
    // Level 1 - Warm & Welcoming (Coral/Peach)
    1: {
        accent: 'hsl(350, 75%, 60%)',
        tint: 'hsl(20, 80%, 65%)',
        glow: 'hsl(30, 85%, 70%)'
    },

    // Level 2 - Ocean Blue
    2: {
        accent: 'hsl(200, 70%, 55%)',
        tint: 'hsl(220, 75%, 60%)',
        glow: 'hsl(240, 70%, 65%)'
    },

    // Level 3 - Forest Green
    3: {
        accent: 'hsl(145, 65%, 50%)',
        tint: 'hsl(165, 70%, 55%)',
        glow: 'hsl(180, 65%, 60%)'
    },

    // Level 4 - Sunset Orange
    4: {
        accent: 'hsl(25, 85%, 58%)',
        tint: 'hsl(40, 80%, 62%)',
        glow: 'hsl(50, 75%, 68%)'
    },

    // Level 5 - Purple Dream
    5: {
        accent: 'hsl(280, 70%, 60%)',
        tint: 'hsl(260, 75%, 65%)',
        glow: 'hsl(240, 70%, 70%)'
    },

    // Level 6 - Rose Pink
    6: {
        accent: 'hsl(340, 75%, 62%)',
        tint: 'hsl(320, 70%, 65%)',
        glow: 'hsl(300, 65%, 70%)'
    },

    // Level 7 - Golden Yellow
    7: {
        accent: 'hsl(45, 90%, 58%)',
        tint: 'hsl(35, 85%, 62%)',
        glow: 'hsl(25, 80%, 68%)'
    },

    // Level 8 - Teal Aqua
    8: {
        accent: 'hsl(175, 65%, 52%)',
        tint: 'hsl(190, 70%, 58%)',
        glow: 'hsl(200, 65%, 62%)'
    },

    // Level 9 - Ruby Red
    9: {
        accent: 'hsl(355, 80%, 58%)',
        tint: 'hsl(340, 75%, 62%)',
        glow: 'hsl(320, 70%, 68%)'
    },

    // Level 10 - Royal Purple (Victory!)
    10: {
        accent: 'hsl(270, 75%, 60%)',
        tint: 'hsl(290, 70%, 65%)',
        glow: 'hsl(310, 65%, 70%)'
    }
};

/**
 * Get theme for a specific level with dark mode adjustments
 */
export const getLevelTheme = (level: number, isDark: boolean = false): LevelTheme => {
    const theme = LEVEL_THEMES[level] || LEVEL_THEMES[1];

    if (!isDark) {
        return theme;
    }

    // Dark mode: increase saturation slightly, reduce lightness
    const adjustHSL = (hsl: string): string => {
        const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (!match) return hsl;

        const [, h, s, l] = match;
        const newS = Math.min(100, parseInt(s) + 5); // +5% saturation
        const newL = Math.max(35, parseInt(l) - 10); // -10% lightness

        return `hsl(${h}, ${newS}%, ${newL}%)`;
    };

    return {
        accent: adjustHSL(theme.accent),
        tint: adjustHSL(theme.tint),
        glow: adjustHSL(theme.glow)
    };
};
