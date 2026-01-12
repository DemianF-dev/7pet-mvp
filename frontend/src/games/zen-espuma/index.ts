
import { GameModule, GameOptions } from '../../types/game.types';
import { ZenEspumaEngine } from './engine';

let engineInstance: ZenEspumaEngine | null = null;

const ZenEspumaModule: GameModule = {
    mount: (container: HTMLElement, options?: GameOptions) => {
        // cleanup if exists
        if (engineInstance) {
            engineInstance.destroy();
            engineInstance = null;
        }

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.style.display = 'block';
        canvas.style.touchAction = 'none'; // Prevent scrolling while touching canvas
        canvas.style.cursor = 'grab';
        canvas.style.width = '100%';
        canvas.style.height = '100%';

        // Make it look nice
        canvas.className = 'zen-espuma-canvas';

        container.innerHTML = ''; // Clear container
        container.appendChild(canvas);

        // Init Engine
        engineInstance = new ZenEspumaEngine(canvas, options || {});

        // Handle active cursor
        canvas.addEventListener('pointerdown', () => {
            canvas.style.cursor = 'grabbing';
        });
        canvas.addEventListener('pointerup', () => {
            canvas.style.cursor = 'grab';
        });
    },

    pause: () => {
        engineInstance?.pause();
    },

    resume: () => {
        engineInstance?.resume();
    },

    destroy: () => {
        engineInstance?.destroy();
        engineInstance = null;
    }
};

export default ZenEspumaModule;
