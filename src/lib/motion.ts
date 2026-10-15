import { Variants, Transition } from 'motion/react';

// Standard ease curves for organic, editorial Forest Intelligence feel
export const forestEase: Transition['ease'] = [0.22, 1, 0.36, 1];
export const snappyEase: Transition['ease'] = [0.16, 1, 0.3, 1];

// Page entrance: Fade from opacity 0 to 1, translate Y from 14px to 0, duration 0.5s
export const pageVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: forestEase,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.25,
      ease: forestEase,
    },
  },
};

// Section reveal: Viewport-aware trigger once, fade in and upward 16px
export const sectionVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: forestEase,
    },
  },
};

// Stagger container for list items / cards (0.07s between items)
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
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
      duration: 0.45,
      ease: forestEase,
    },
  },
};

// Button interaction presets (scale 1.02 hover, 0.98 tap, no layout shift)
export const buttonHoverTap = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: { duration: 0.15, ease: 'easeOut' as const },
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
    transition: { duration: 0.25, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.97,
    y: 14,
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
    scale: 0.97,
    y: 8,
    transition: {
      duration: 0.2,
      ease: forestEase,
    },
  },
};

// Mobile drawer sliding navigation
export const drawerVariants: Variants = {
  hidden: {
    x: '-100%',
    opacity: 0.5,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.35,
      ease: forestEase,
    },
  },
  exit: {
    x: '-100%',
    opacity: 0,
    transition: {
      duration: 0.25,
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
      duration: 0.45,
      ease: forestEase,
    },
  },
};

// Common viewport configuration: trigger once when 15% visible
export const defaultViewport = {
  once: true,
  amount: 0.15,
};

export { useReducedMotion } from 'motion/react';

