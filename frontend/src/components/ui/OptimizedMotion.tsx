import { motion, AnimatePresence, MotionProps } from 'framer-motion';
import { usePerformanceMode } from '../../store/uiPerfStore';

interface OptimizedMotionProps extends Omit<MotionProps, 'transition'> {
  children: React.ReactNode;
  quality?: 'high' | 'balanced' | 'low';
  fallback?: React.ReactNode;
  enableOnLowEnd?: boolean;
  reduceMotion?: boolean;
  transition?: any;
}

/**
 * Performance-optimized motion wrapper that adapts to device capabilities
 * Automatically reduces animations on low-end devices or when reduced motion is preferred
 */
export const OptimizedMotion = ({ 
  children, 
  quality: propQuality, 
  fallback,
  enableOnLowEnd = false,
  reduceMotion = false,
  transition: customTransition,
  ...motionProps 
}: OptimizedMotionProps) => {
  const { quality, shouldAnimate, isLowEndDevice, animationDuration } = usePerformanceMode();
  
  // Determine effective quality
  const effectiveQuality = propQuality || quality;
  
  // Disable animations completely in low quality or if disabled
  const shouldRenderMotion = shouldAnimate && 
    effectiveQuality !== 'low' && 
    !reduceMotion &&
    !(isLowEndDevice && !enableOnLowEnd) &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Fallback content when animations are disabled
  if (!shouldRenderMotion && fallback) {
    return <>{fallback}</>;
  }

  if (!shouldRenderMotion) {
    return <>{children}</>;
  }

  // Adaptive transition based on quality
  const adaptiveTransition = {
    type: "tween" as const,
    duration: animationDuration,
    ease: [0.25, 0.1, 0.25, 1] as const,
    ...customTransition
  };

  return (
    <motion.div
      transition={adaptiveTransition}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
};

/**
 * Optimized AnimatePresence that respects performance settings
 */
export const OptimizedAnimatePresence = ({ 
  children, 
  ...props 
}: Parameters<typeof AnimatePresence>[0]) => {
  const { shouldAnimate, isLowEndDevice } = usePerformanceMode();
  
  const shouldAnimatePresence = shouldAnimate && 
    !isLowEndDevice && 
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!shouldAnimatePresence) {
    return <>{children}</>;
  }

  return <AnimatePresence {...props}>{children}</AnimatePresence>;
};

/**
 * Predefined animation variants optimized for performance
 */
export const performanceVariants = {
  // Fade animations - lightweight
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  },
  
  // Slide animations - moderate performance
  slideUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  },
  
  slideDown: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 }
  },
  
  slideLeft: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 }
  },
  
  slideRight: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  },
  
  // Scale animations - heavier performance
  scale: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 }
  },
  
  // Stagger for lists - optimized
  staggerContainer: {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1
      }
    }
  },
  
  staggerItem: {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  }
};

/**
 * Performance-optimized list item animation
 */
export const AnimatedListItem = ({ 
  children, 
  delay = 0,
  ...props 
}: { 
  children: React.ReactNode; 
  delay?: number;
  [key: string]: any; 
}) => {
  const { shouldAnimate, animationDuration } = usePerformanceMode();
  
  if (!shouldAnimate) {
    return <div {...props}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={performanceVariants.staggerItem}
      transition={{
        duration: animationDuration,
        delay: delay * 0.1
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * Performance-aware hover animation
 */
export const AnimatedHover = ({ 
  children, 
  hoverScale = 1.02,
  ...props 
}: { 
  children: React.ReactNode; 
  hoverScale?: number;
  [key: string]: any; 
}) => {
  const { shouldAnimate, isLowEndDevice } = usePerformanceMode();
  
  const variants = {
    rest: { scale: 1 },
    hover: { scale: isLowEndDevice ? 1 : hoverScale }
  };

  if (!shouldAnimate) {
    return <div {...props}>{children}</div>;
  }

  return (
    <motion.div
      variants={variants}
      initial="rest"
      whileHover="hover"
      transition={{ duration: 0.15 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * Lightweight loading animation
 */
export const OptimizedSpinner = ({ 
  size = 24,
  className = "",
  ...props 
}: { 
  size?: number; 
  className?: string;
  [key: string]: any; 
}) => {
  const { shouldAnimate } = usePerformanceMode();
  
  if (!shouldAnimate) {
    return (
      <div 
        className={`border-2 border-gray-200 border-t-primary rounded-full ${className}`}
        style={{ width: size, height: size }}
        {...props}
      />
    );
  }

  return (
    <motion.div
      className={`border-2 border-gray-200 border-t-primary rounded-full ${className}`}
      style={{ width: size, height: size }}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      {...props}
    />
  );
};

/**
 * Performance-aware modal animation
 */
export const AnimatedModal = ({ 
  children, 
  isOpen,
  ...props 
}: { 
  children: React.ReactNode; 
  isOpen: boolean;
  [key: string]: any; 
}) => {
  const { shouldAnimate, isMobile } = usePerformanceMode();

  const variants = {
    hidden: { 
      opacity: 0,
      scale: 0.95,
      y: isMobile ? 20 : -20
    },
    visible: { 
      opacity: 1,
      scale: 1,
      y: 0
    }
  };

  if (!shouldAnimate || !isOpen) {
    return isOpen ? <>{children}</> : null;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={variants}
      transition={{
        type: "spring",
        damping: 25,
        stiffness: 300
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default OptimizedMotion;