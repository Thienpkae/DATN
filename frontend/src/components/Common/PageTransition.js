import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PageTransition = ({ children, className = '' }) => {
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20,
      scale: 0.98
    },
    in: {
      opacity: 1,
      y: 0,
      scale: 1
    },
    out: {
      opacity: 0,
      y: -20,
      scale: 1.02
    }
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.4
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className={`page-transition ${className}`}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        style={{
          width: '100%',
          height: '100%'
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Slide transition for sidebar navigation
export const SlideTransition = ({ children, direction = 'left' }) => {
  const slideVariants = {
    initial: {
      x: direction === 'left' ? -100 : 100,
      opacity: 0
    },
    in: {
      x: 0,
      opacity: 1
    },
    out: {
      x: direction === 'left' ? 100 : -100,
      opacity: 0
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={slideVariants}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
};

// Fade transition for modals and overlays
export const FadeTransition = ({ children, duration = 0.2 }) => {
  const fadeVariants = {
    initial: { opacity: 0 },
    in: { opacity: 1 },
    out: { opacity: 0 }
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={fadeVariants}
      transition={{ duration }}
    >
      {children}
    </motion.div>
  );
};

// Scale transition for cards and buttons
export const ScaleTransition = ({ children, scale = 0.9 }) => {
  const scaleVariants = {
    initial: { scale, opacity: 0 },
    in: { scale: 1, opacity: 1 },
    out: { scale: scale * 0.9, opacity: 0 }
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={scaleVariants}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

// Stagger animation for lists
export const StaggerContainer = ({ children, staggerDelay = 0.1 }) => {
  const containerVariants = {
    initial: {},
    in: {
      transition: {
        staggerChildren: staggerDelay
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="in"
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem = ({ children, index = 0 }) => {
  const itemVariants = {
    initial: {
      y: 20,
      opacity: 0
    },
    in: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: 'easeOut'
      }
    }
  };

  return (
    <motion.div variants={itemVariants}>
      {children}
    </motion.div>
  );
};

export default PageTransition;