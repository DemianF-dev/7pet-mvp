import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type QualityMode = 'high' | 'balanced' | 'low';

interface UIPerformanceState {
    // Performance quality settings
    quality: QualityMode;
    deviceInfo: {
        deviceMemory: number;
        cores: number;
        connection: string;
        isMobile: boolean;
        batteryLevel?: number;
    };
    
    // Auto-detection results
    autoDetectedQuality: QualityMode;
    
    // Actions
    setQuality: (quality: QualityMode) => void;
    detectOptimalQuality: () => QualityMode;
    updateDeviceInfo: () => void;
    resetToAuto: () => void;
}

/**
 * Detects optimal quality mode based on device capabilities
 */
function detectDeviceQuality(): QualityMode {
    const deviceMemory = (navigator as any).deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    const connection = (navigator as any).connection?.effectiveType || '4g';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Low-end device detection
    if (deviceMemory <= 2 || cores <= 2 || connection === 'slow-2g' || connection === '2g') {
        return 'low';
    }
    
    // Medium-end device detection  
    if (deviceMemory <= 4 || cores <= 4 || connection === '3g') {
        return 'balanced';
    }
    
    // High-end devices
    if (isMobile && (deviceMemory <= 6 || cores <= 6)) {
        return 'balanced'; // Conservative for mobile
    }
    
    return 'high';
}

/**
 * Gets device information for performance monitoring
 */
function getDeviceInfo() {
    return {
        deviceMemory: (navigator as any).deviceMemory || 4,
        cores: navigator.hardwareConcurrency || 4,
        connection: (navigator as any).connection?.effectiveType || 'unknown',
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        batteryLevel: undefined as number | undefined // Will be updated if Battery API is available
    };
}

/**
 * Updates battery level if Battery API is available
 */
async function updateBatteryLevel(): Promise<number | undefined> {
    try {
        const battery = await (navigator as any).getBattery?.();
        return battery?.level;
    } catch {
        return undefined;
    }
}

export const useUIPerfStore = create<UIPerformanceState>()(
    persist(
        (set, get) => ({
            // Initial state
            quality: 'balanced',
            deviceInfo: getDeviceInfo(),
            autoDetectedQuality: detectDeviceQuality(),
            
            /**
             * Set quality mode manually
             */
            setQuality: (quality: QualityMode) => {
                set({ quality });
            },
            
            /**
             * Detect optimal quality based on device
             */
            detectOptimalQuality: () => {
                const detected = detectDeviceQuality();
                set({ autoDetectedQuality: detected });
                return detected;
            },
            
            /**
             * Update device information
             */
            updateDeviceInfo: async () => {
                const deviceInfo = getDeviceInfo();
                const batteryLevel = await updateBatteryLevel();
                
                set({
                    deviceInfo: { ...deviceInfo, batteryLevel }
                });
            },
            
            /**
             * Reset to auto-detected quality
             */
            resetToAuto: () => {
                const { autoDetectedQuality } = get();
                set({ quality: autoDetectedQuality });
            }
        }),
        {
            name: 'ui-performance-store',
            partialize: (state) => ({
                quality: state.quality,
                deviceInfo: state.deviceInfo,
                autoDetectedQuality: state.autoDetectedQuality
            })
        }
    )
);

/**
 * Hook for performance-aware component rendering
 */
export const usePerformanceMode = () => {
    const { quality, deviceInfo, setQuality } = useUIPerfStore();
    
    const isHighQuality = quality === 'high';
    const isBalancedQuality = quality === 'balanced';  
    const isLowQuality = quality === 'low';
    const isMobile = deviceInfo.isMobile;
    const isLowEndDevice = deviceInfo.deviceMemory <= 4 || deviceInfo.cores <= 4;
    
    return {
        quality,
        isHighQuality,
        isBalancedQuality,
        isLowQuality,
        isMobile,
        isLowEndDevice,
        setQuality,
        
        // Helper functions for conditional rendering
        shouldAnimate: isHighQuality || (isBalancedQuality && !isLowEndDevice),
        shouldUseBlur: isHighQuality,
        shouldUseShadows: isHighQuality || isBalancedQuality,
        shouldUseComplexEffects: isHighQuality,
        maxListItems: isLowQuality ? 50 : isBalancedQuality ? 100 : 200,
        animationDuration: isLowQuality ? 0.1 : isBalancedQuality ? 0.2 : 0.3,
        debounceDelay: isLowQuality ? 500 : isBalancedQuality ? 300 : 150
    };
};

/**
 * Initialize performance monitoring on app start
 */
export const initializePerformance = async () => {
    const store = useUIPerfStore.getState();
    
    // Update device info
    await store.updateDeviceInfo();
    
    // Set initial quality if not already set
    if (store.quality === 'balanced' && store.autoDetectedQuality !== 'balanced') {
        store.setQuality(store.autoDetectedQuality);
    }
    
    // Monitor battery changes on mobile
    if (store.deviceInfo.isMobile && 'getBattery' in navigator) {
        try {
            const battery = await (navigator as any).getBattery();
            battery.addEventListener('levelchange', async () => {
                const level = await updateBatteryLevel();
                const currentState = useUIPerfStore.getState();
                
                // Auto-switch to low quality on low battery
                if (level !== undefined && level < 0.2 && currentState.quality !== 'low') {
                    currentState.setQuality('low');
                }
            });
        } catch {
            // Battery API not supported
        }
    }
    
    // Monitor network changes
    if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connection.addEventListener('change', () => {
            const store = useUIPerfStore.getState();
            const newQuality = detectDeviceQuality();
            
            // Auto-adjust quality on network change
            if (newQuality !== store.autoDetectedQuality) {
                store.detectOptimalQuality();
                // Only auto-switch if user hasn't manually set quality
                if (store.quality === store.autoDetectedQuality) {
                    store.setQuality(newQuality);
                }
            }
        });
    }
};