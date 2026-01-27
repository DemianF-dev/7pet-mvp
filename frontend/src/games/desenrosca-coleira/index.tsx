/**
 * Desenrosca a Coleira - GameModule implementation
 * 
 * Integrates with GameHost infrastructure
 */

import { createRoot, Root } from 'react-dom/client';
import DesenroscaGame from './DesenroscaGame';
import { GameOptions } from './types';

interface GameModule {
    mount(container: HTMLElement, options?: GameOptions): void;
    pause(): void;
    resume(): void;
    destroy(): void;
}

class DesenroscaModule implements GameModule {
    private root: Root | null = null;

    mount(container: HTMLElement, options?: GameOptions): void {
        this.root = createRoot(container);

        this.root.render(
            <DesenroscaGame
                onWin={options?.onWin}
                reducedMotion={options?.reducedMotion}
            />
        );
    }

    pause(): void {
        // Pause via global state hook
        const gameState = (window as any).__desenroscaGameState;
        if (gameState?.pause) {
            gameState.pause();
        }
    }

    resume(): void {
        // Resume via global state hook
        const gameState = (window as any).__desenroscaGameState;
        if (gameState?.resume) {
            gameState.resume();
        }
    }

    destroy(): void {
        if (this.root) {
            this.root.unmount();
            this.root = null;
        }

        // Clean up global state
        delete (window as any).__desenroscaGameState;
    }
}

export default new DesenroscaModule();
