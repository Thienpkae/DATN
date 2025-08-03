import React from 'react';
import { EnhancedLoading, OverlayLoading } from '../UI';

/**
 * LoadingSpinner - Backward compatible wrapper for EnhancedLoading
 * This maintains compatibility with existing code while using the new enhanced loading component
 */
const LoadingSpinner = ({
  size = 'default',
  text = 'Loading...',
  overlay = false,
  spinning = true,
  ...props
}) => {
  // Map old size prop to new size prop
  const mappedSize = size === 'default' ? 'medium' : size;

  if (overlay) {
    return (
      <OverlayLoading
        size={mappedSize}
        text={text}
        {...props}
      />
    );
  }

  return (
    <EnhancedLoading
      variant="spinner"
      size={mappedSize}
      text={text}
      centered
      {...props}
    />
  );
};

export default LoadingSpinner;