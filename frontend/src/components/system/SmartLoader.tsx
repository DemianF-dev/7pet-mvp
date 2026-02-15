import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SmartLoader - Prevents skeleton flashing with intelligent loading states
 * 
 * Features:
 * - Graceful fade-in after minimum display time
 * - Prevention of flash when data loads quickly
 * - Smooth transitions between states
 * - Mobile-optimized animations
 * - Device-aware performance
 */

interface SmartLoaderProps {
  /** Loading state from React Query */
  isLoading: boolean;
  /** Whether data is currently fetching (background refresh) */
  isFetching?: boolean;
  /** Whether there's an error */
  isError?: boolean;
  /** Minimum display time in ms to prevent flash */
  minDisplayTime?: number;
  /** Content to render when not loading */
  children: React.ReactNode;
  /** Custom loading component */
  fallback?: React.ReactNode;
  /** Custom error component */
  errorFallback?: React.ReactNode;
  /** Disabled smart loader behavior */
  disabled?: boolean;
  /** For performance optimization on slow devices */
  reducedMotion?: boolean;
}

export function SmartLoader({
  isLoading,
  isFetching = false,
  isError = false,
  minDisplayTime = 300,
  children,
  fallback,
  errorFallback,
  disabled = false,
  reducedMotion = false,
}: SmartLoaderProps) {
  const [showContent, setShowContent] = useState(!isLoading);
  const [showLoader, setShowLoader] = useState(isLoading);
  const [hasError, setHasError] = useState(false);

  // Handle initial loading state with minimum display time
  useEffect(() => {
    if (disabled) {
      setShowContent(!isLoading);
      setShowLoader(isLoading);
      return;
    }

    if (isLoading) {
      // Start showing loader immediately
      setShowLoader(true);
      setShowContent(false);
      
      // Set minimum display time
      const minTimer = setTimeout(() => {
        if (!isLoading) {
          setShowLoader(false);
          setShowContent(true);
        }
      }, minDisplayTime);

      return () => clearTimeout(minTimer);
    } else {
      // Data loaded - show content with fade
      const timer = setTimeout(() => {
        setShowLoader(false);
        setShowContent(true);
      }, Math.max(0, minDisplayTime - 100)); // Slight overlap for smooth transition

      return () => clearTimeout(timer);
    }
  }, [isLoading, minDisplayTime, disabled]);

  // Handle error states
  useEffect(() => {
    setHasError(isError);
    if (isError) {
      setShowLoader(false);
    }
  }, [isError]);

  // Handle background fetching (show subtle indicator)
  const BackgroundIndicator = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed top-0 right-0 z-50 p-4"
    >
      <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-2 shadow-lg border border-gray-200">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        <span className="text-xs font-medium text-gray-600">Atualizando...</span>
      </div>
    </motion.div>
  );

  // Default skeleton loader
  const DefaultLoader = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full flex items-center justify-center p-8"
    >
      <div className="flex flex-col items-center gap-4">
        {/* Animated spinner */}
        <motion.div
          animate={{ 
            rotate: 360,
            scale: reducedMotion ? [1, 1] : [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 1.5, repeat: Infinity, ease: "linear" },
            scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
          }}
          className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full"
        />
        
        {/* Optional loading text */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-gray-500 font-medium"
        >
          Carregando...
        </motion.p>
      </div>
    </motion.div>
  );

  // Default error component
  const DefaultError = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full h-full flex items-center justify-center p-8"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Erro ao carregar dados
          </h3>
          <p className="text-sm text-gray-600">
            Tente novamente mais tarde.
          </p>
        </div>
      </div>
    </motion.div>
  );

  // Render logic
  if (hasError) {
    return errorFallback || <DefaultError />;
  }

  return (
    <div className="relative w-full h-full">
      {/* Background fetch indicator */}
      <AnimatePresence>
        {isFetching && !isLoading && !disabled && <BackgroundIndicator />}
      </AnimatePresence>

      {/* Main content area */}
      <AnimatePresence mode="wait">
        {showLoader && (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-10"
          >
            {fallback || <DefaultLoader />}
          </motion.div>
        )}

        {showContent && !hasError && (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="w-full h-full"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Hook for SmartLoader with device detection
 */
export function useSmartLoader(minDisplayTime?: number) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Detect reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Adjust min display time based on device
  const getOptimizedMinTime = (baseTime?: number) => {
    if (reducedMotion) return Math.max((baseTime || minDisplayTime || 300) * 0.5, 150);
    
    const deviceMemory = (navigator as any).deviceMemory || 4;
    const isLowEnd = deviceMemory <= 4;
    
    if (isLowEnd) return Math.max((baseTime || minDisplayTime || 300) * 0.7, 200);
    
    return baseTime || minDisplayTime || 300;
  };

  return {
    reducedMotion,
    getOptimizedMinTime,
  };
}
