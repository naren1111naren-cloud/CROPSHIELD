import { Variants, Transition } from 'motion/react';

// Standard ease curves for organic, editorial Forest Intelligence feel
export const forestEase: Transition['ease'] = [0.22, 1, 0.36, 1];
export const snappyEase: Transition['ease'] = [0.16, 1, 0.3, 1];
export const springSmooth = { type: 'spring' as const, stiffness: 380, damping: 28 };
export const springBouncy = { type: 'spring' as const, stiffness: 450, damping: 22 };

// Page entrance: Fade from opacity 0 to 1, translate Y from 16px to 0
export const pageVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: forestEase,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.25,
      ease: forestEase,
    },
  },
};

// View transition between full app routes (home, signin, dashboard tabs)
export const viewTransitionVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 14,
    scale: 0.995,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.38,
      ease: forestEase,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.995,
    transition: {
      duration: 0.22,
      ease: forestEase,
    },
  },
};

// Tab content transition (for inner dashboard & portal tab switching)
export const tabContentVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: forestEase,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.18,
      ease: forestEase,
    },
  },
};

// Section reveal: Viewport-aware trigger once, fade in and upward 18px
export const sectionVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: forestEase,
    },
  },
};

// Stagger container for list items / cards
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

// Child item variant within a staggered container
export const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 14,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: forestEase,
    },
  },
};

// Scale in for badges, thumbnails, and quick cards
export const scaleInVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.92,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: forestEase,
    },
  },
};

// Button interaction presets
export const buttonHoverTap = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: { duration: 0.15, ease: 'easeOut' as const },
};

export const iconHoverBounce = {
  whileHover: { scale: 1.12, rotate: 3 },
  whileTap: { scale: 0.92 },
  transition: { duration: 0.2, ease: snappyEase },
};

// Card interaction presets (smooth hover lift + subtle shadow enhancement)
export const cardHoverTap = {
  whileHover: {
    y: -4,
    transition: { duration: 0.2, ease: snappyEase },
  },
  whileTap: { scale: 0.99 },
};

export const cardHoverScale = {
  whileHover: {
    scale: 1.015,
    y: -2,
    transition: { duration: 0.2, ease: snappyEase },
  },
  whileTap: { scale: 0.99 },
};

// Chip / filter button interaction
export const chipHoverTap = {
  whileHover: { scale: 1.04 },
  whileTap: { scale: 0.96 },
  transition: { duration: 0.12, ease: 'easeOut' as const },
};

// Image preview entrance & removal
export const imagePreviewVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
    y: 10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: forestEase,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -8,
    transition: {
      duration: 0.2,
      ease: forestEase,
    },
  },
};

// Modal dialog entrance & backdrop
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.22, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.18, ease: 'easeIn' },
  },
};

export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 16,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.32,
      ease: forestEase,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 10,
    transition: {
      duration: 0.18,
      ease: forestEase,
    },
  },
};

// Mobile drawer sliding navigation
export const drawerVariants: Variants = {
  hidden: {
    x: '-100%',
    opacity: 0.6,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.32,
      ease: forestEase,
    },
  },
  exit: {
    x: '-100%',
    opacity: 0,
    transition: {
      duration: 0.22,
      ease: forestEase,
    },
  },
};

// Top dropdown drawer
export const dropdownVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -10,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.24,
      ease: forestEase,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.97,
    transition: {
      duration: 0.16,
      ease: forestEase,
    },
  },
};

// Diagnostic result revelation variant
export const resultRevealVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.42,
      ease: forestEase,
    },
  },
};

// Hero staggered text reveals
export const heroHeadingContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

export const heroHeadingItem: Variants = {
  hidden: { opacity: 0, y: 22, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.6,
      ease: forestEase,
    },
  },
};

// High-tech Leaf Pathology Scanning Animations
export const scanLaserVariants: Variants = {
  initial: { top: '2%', opacity: 0 },
  animate: {
    top: ['2%', '96%', '2%'],
    opacity: [0.8, 1, 0.8],
    transition: {
      duration: 2.6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const scanGridPulseVariants: Variants = {
  initial: { opacity: 0.15 },
  animate: {
    opacity: [0.15, 0.45, 0.15],
    transition: {
      duration: 2.2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const scanReticleVariants: Variants = {
  initial: { scale: 0.95, opacity: 0.5 },
  animate: {
    scale: [0.95, 1.05, 0.95],
    opacity: [0.5, 0.95, 0.5],
    transition: {
      duration: 1.8,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const scanTargetBoxVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: forestEase,
    },
  },
  pulse: {
    borderColor: ['rgba(112, 183, 126, 0.6)', 'rgba(31, 107, 74, 1)', 'rgba(112, 183, 126, 0.6)'],
    boxShadow: [
      '0 0 0 1px rgba(112,183,126,0.3)',
      '0 0 0 3px rgba(31,107,74,0.4)',
      '0 0 0 1px rgba(112,183,126,0.3)',
    ],
    transition: {
      duration: 1.6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Farm Map Floating Panels and HUD Widgets (non-interfering with Leaflet)
export const mapPanelSlideLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.32, ease: forestEase },
  },
  exit: {
    opacity: 0,
    x: -16,
    transition: { duration: 0.2, ease: forestEase },
  },
};

export const mapPanelSlideRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.32, ease: forestEase },
  },
  exit: {
    opacity: 0,
    x: 16,
    transition: { duration: 0.2, ease: forestEase },
  },
};

export const mapPanelSlideBottom: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: forestEase },
  },
  exit: {
    opacity: 0,
    y: 16,
    scale: 0.98,
    transition: { duration: 0.2, ease: forestEase },
  },
};

export const mapBadgeVariants: Variants = {
  hidden: { opacity: 0, scale: 0.88, y: 6 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.28, ease: forestEase },
  },
};

// Pulse glow for live indicators (satellite feed, sensors, online status)
export const pulseGlowVariants: Variants = {
  initial: { scale: 1, opacity: 0.7 },
  animate: {
    scale: [1, 1.35, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 2.2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Animated Meter / Bar Reveal
export const meterBarVariants: Variants = {
  hidden: { width: '0%' },
  visible: (customWidth: string | number) => ({
    width: typeof customWidth === 'number' ? `${customWidth}%` : customWidth,
    transition: {
      duration: 0.85,
      ease: forestEase,
      delay: 0.1,
    },
  }),
};

// Common viewport configuration: trigger once when 15% visible
export const defaultViewport = {
  once: true,
  amount: 0.15,
};

export { useReducedMotion } from 'motion/react';

