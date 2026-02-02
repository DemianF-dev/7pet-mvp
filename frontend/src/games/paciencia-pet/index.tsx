/**
 * Paciencia Pet - GameModule Implementation
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

    mount(container: HTMLElement, _options?: GameOptions): void {
        this.root = createRoot(container);
        this.root.render(<PacienciaGame />);
    }

    pause(): void {
        // Game state is managed internally by PacienciaGame component
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
        const saved = localStorage.getItem('paciencia_pet_v3');
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
        localStorage.setItem('paciencia_pet_v3', JSON.stringify(state));
    }
}

// Export a singleton instance
const pacienciaModule = new PacienciaModule();
export default pacienciaModule;
