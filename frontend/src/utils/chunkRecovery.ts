/**
 * ChunkLoadError Recovery System
 * 
 * Prevents white screens caused by chunk loading failures after deployments.
 * Common scenarios:
 * - Service Worker serves old index.html that references non-existent chunks
 * - Network failures during dynamic import
 * - Stale browser cache mismatches
 * 
 * Recovery strategy:
 * 1. Detect chunk-related errors
 * 2. Attempt service worker update (if available)
 * 3. Force reload with cache bust
 * 4. Prevent infinite loops with sessionStorage flag
 */

const CHUNK_ERROR_PATTERNS = [
    'Failed to fetch dynamically imported module',
    'ChunkLoadError',
    'Loading chunk',
    'Importing a module script failed'
];

const RECOVERY_FLAG_KEY = 'chunk_recovery_attempted';
const RECOVERY_TIMEOUT_MS = 60000; // 1 minute

interface RecoveryAttempt {
    timestamp: number;
    count: number;
}

/**
 * Check if error message matches chunk loading failure patterns
 */
function isChunkError(error: Error | string): boolean {
    const message = typeof error === 'string' ? error : error.message;
    return CHUNK_ERROR_PATTERNS.some(pattern =>
        message.toLowerCase().includes(pattern.toLowerCase())
    );
}

/**
 * Check if we've recently attempted recovery to prevent infinite loops
 */
function canAttemptRecovery(): boolean {
    try {
        const stored = sessionStorage.getItem(RECOVERY_FLAG_KEY);
        if (!stored) return true;

        const attempt: RecoveryAttempt = JSON.parse(stored);
        const timeSinceAttempt = Date.now() - attempt.timestamp;

        // Allow retry after timeout, or if too many attempts (something is really broken)
        if (timeSinceAttempt > RECOVERY_TIMEOUT_MS) {
            sessionStorage.removeItem(RECOVERY_FLAG_KEY);
            return true;
        }

        // Prevent more than 3 attempts in a row
        if (attempt.count >= 3) {
            console.error('🚨 Chunk recovery failed after 3 attempts. Please clear cache manually.');
            return false;
        }

        return false;
    } catch (err) {
        // sessionStorage might not be available, allow recovery
        return true;
    }
}

/**
 * Record recovery attempt
 */
function recordRecoveryAttempt(): void {
    try {
        const stored = sessionStorage.getItem(RECOVERY_FLAG_KEY);
        const current: RecoveryAttempt = stored
            ? JSON.parse(stored)
            : { timestamp: Date.now(), count: 0 };

        const timeSinceAttempt = Date.now() - current.timestamp;

        // If it's been more than timeout, reset count
        if (timeSinceAttempt > RECOVERY_TIMEOUT_MS) {
            current.count = 1;
            current.timestamp = Date.now();
        } else {
            current.count += 1;
        }

        sessionStorage.setItem(RECOVERY_FLAG_KEY, JSON.stringify(current));
    } catch (err) {
        console.warn('Failed to record recovery attempt:', err);
    }
}

/**
 * Attempt to recover from chunk loading error
 */
async function attemptRecovery(): Promise<void> {
    if (!canAttemptRecovery()) {
        console.warn('⏭️ Skipping chunk recovery - too many recent attempts');
        return;
    }

    console.log('🔄 Attempting chunk error recovery...');
    recordRecoveryAttempt();

    // Try to update service worker first (if PWA is registered)
    try {
        const registration = await navigator.serviceWorker?.getRegistration();
        if (registration) {
            console.log('📦 Updating service worker...');
            await registration.update();

            // If there's a waiting worker, activate it
            if (registration.waiting) {
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }

            // Small delay to let SW update
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    } catch (swError) {
        console.warn('Service worker update failed:', swError);
    }

    // Force reload with cache bust
    console.log('🔄 Reloading application...');
    window.location.href = window.location.href + (window.location.href.includes('?') ? '&' : '?') + '_t=' + Date.now();
}

/**
 * Initialize chunk error recovery system
 * Call this once in main.tsx before rendering the app
 */
export function initChunkRecovery(): void {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
        if (event.error && isChunkError(event.error)) {
            console.error('🔴 Chunk load error detected:', event.error.message);
            event.preventDefault();
            attemptRecovery().catch(console.error);
        }
    });

    // Handle unhandled promise rejections (common with dynamic imports)
    window.addEventListener('unhandledrejection', (event) => {
        if (event.reason && isChunkError(event.reason)) {
            console.error('🔴 Chunk load rejection detected:', event.reason);
            event.preventDefault();
            attemptRecovery().catch(console.error);
        }
    });

    console.log('✅ Chunk recovery system initialized');
}

/**
 * Manually trigger chunk recovery (for testing or manual intervention)
 */
export function triggerChunkRecovery(): void {
    attemptRecovery().catch(console.error);
}
