/**
 * Paciência Pet - GameModule Implementation
 * 
 * Entry point for the game. Implements the GameModule interface
 * to integrate with GameHost.
 */

import { createRoot, Root } from 'react-dom/client';
import { GameModule, GameOptions, GameState as GenericGameState } from '../../types/game.types';
import PacienciaGame from './PacienciaGame';
import { GameState } from './types';

class PacienciaModule implements GameModule {
    private root: Root | null = null;

    mount(container: HTMLElement, options?: GameOptions): void {
        this.root = createRoot(container);

        this.root.render(
            <PacienciaGame
                onWin={options?.onWin}
                reducedMotion={options?.reducedMotion}
            />
        );
    }

    pause(): void {
        // Game state is managed internally by PacienciaGame component
        // React will handle the pause state naturally
    }

    resume(): void {
        // Game will resume automatically when component re-renders
    }

    destroy(): void {
        if (this.root) {
            this.root.unmount();
            this.root = null;
        }
    }

    getState(): GenericGameState {
        // Get state from localStorage if needed
        const saved = localStorage.getItem('7pet_paciencia_saved_game');
        if (saved) {
            try {
                return JSON.parse(saved) as GameState;
            } catch {
                return {};
            }
        }
        return {};
    }

    setState(state: GenericGameState): void {
        // Save state to localStorage
        localStorage.setItem('7pet_paciencia_saved_game', JSON.stringify(state));
    }
}

// Export a singleton instance
const pacienciaModule = new PacienciaModule();
export default pacienciaModule;
