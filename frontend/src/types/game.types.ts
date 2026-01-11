/**
 * Game Module Infrastructure Types
 * 
 * Standard interface for all mini-games in the Pausa module.
 * Every game must implement the GameModule interface to ensure
 * proper lifecycle management and integration with GameHost.
 */

export interface GameModule {
    /**
     * Initialize and render the game into the provided container.
     * @param container - DOM element where the game should be rendered
     * @param options - Optional game configuration and callbacks
     */
    mount(container: HTMLElement, options?: GameOptions): void;

    /**
     * Pause the game (called when tab is hidden or window loses focus).
     * Should pause timers, animations, and any active game loop.
     */
    pause(): void;

    /**
     * Resume the game (called when tab becomes visible or window gains focus).
     * Should resume timers, animations, and game loop.
     */
    resume(): void;

    /**
     * Clean up and unmount the game.
     * Should cancel all timers, remove event listeners, and clean up resources.
     */
    destroy(): void;

    /**
     * Get the current game state (optional, for persistence).
     * @returns The current state of the game
     */
    getState?(): GameState;

    /**
     * Restore a previously saved game state (optional, for persistence).
     * @param state - The state to restore
     */
    setState?(state: GameState): void;
}

export interface GameOptions {
    /**
     * Called when the player wins the game
     */
    onWin?: () => void;

    /**
     * Called when the player loses the game
     */
    onLose?: () => void;

    /**
     * Called whenever the game state changes
     */
    onStateChange?: (state: GameState) => void;

    /**
     * Whether the user prefers reduced motion (for accessibility)
     */
    reducedMotion?: boolean;

    /**
     * Whether the device is considered low-end/mobile
     */
    lowPowerMode?: boolean;

    /**
     * Custom theme/color scheme (optional)
     */
    theme?: 'light' | 'dark' | 'system';
}

export interface GameState {
    /**
     * Flexible game state - each game defines its own structure
     */
    [key: string]: any;
}

/**
 * Metadata about a game (for display in the game selection screen)
 */
export interface GameMetadata {
    id: string;
    name: string;
    description: string;
    icon?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    estimatedTime?: string; // e.g., "5-10 min"
    status: 'active' | 'coming-soon' | 'maintenance';
    tags?: string[];
}
