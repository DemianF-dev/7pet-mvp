import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface DevCockpitState {
    unlocked: boolean;
    unlockedAt: number | null;
    ttlMs: number;
    lastVerifiedRole: string | null;

    unlock: (role: string) => void;
    lock: () => void;
    isUnlocked: () => boolean;
}

export const useDevCockpitStore = create<DevCockpitState>()(
    persist(
        (set, get) => ({
            unlocked: false,
            unlockedAt: null,
            ttlMs: 15 * 60 * 1000, // 15 minutes
            lastVerifiedRole: null,

            unlock: (role: string) => {
                set({
                    unlocked: true,
                    unlockedAt: Date.now(),
                    lastVerifiedRole: role,
                });
            },

            lock: () => {
                set({
                    unlocked: false,
                    unlockedAt: null,
                    lastVerifiedRole: null,
                });
            },

            isUnlocked: () => {
                const { unlocked, unlockedAt, ttlMs } = get();
                if (!unlocked || !unlockedAt) return false;

                const now = Date.now();
                const isExpired = now - unlockedAt > ttlMs;

                if (isExpired) {
                    // Auto-lock if expired
                    set({ unlocked: false, unlockedAt: null, lastVerifiedRole: null });
                    return false;
                }

                return true;
            },
        }),
        {
            name: '7pet-dev-cockpit-storage',
            storage: createJSONStorage(() => sessionStorage),
        }
    )
);
