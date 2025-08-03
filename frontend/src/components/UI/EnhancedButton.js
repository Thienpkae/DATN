import React, { forwardRef } from 'react';
import { Button } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import './EnhancedButton.css';

/**
 * Enhanced Button Component with improved UX patterns
 * 
 * Features:
 * - Smooth animations and micro-interactions
 * - Better loading states
 * - Enhanced accessibility
 * - Consistent styling across the application
 * - Support for different variants and sizes
 */
const EnhancedButton = forwardRef(({
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  rounded = false,
  elevated = false,
  gradient = false,
  pulse = false,
  className = '',
  onClick,
  ...props
}, ref) => {
  
  // Generate class names based on props
  const getButtonClasses = () => {
    const classes = ['enhanced-button'];
    
    // Variant classes
    classes.push(`enhanced-button--${variant}`);
    
    // Size classes
    classes.push(`enhanced-button--${size}`);
    
    // State classes
    if (loading) classes.push('enhanced-button--loading');
    if (disabled) classes.push('enhanced-button--disabled');
    if (fullWidth) classes.push('enhanced-button--full-width');
    if (rounded) classes.push('enhanced-button--rounded');
    if (elevated) classes.push('enhanced-button--elevated');
    if (gradient) classes.push('enhanced-button--gradient');
    if (pulse) classes.push('enhanced-button--pulse');
    
    // Icon position
    if (icon && iconPosition === 'right') {
      classes.push('enhanced-button--icon-right');
    }
    
    // Custom classes
    if (className) classes.push(className);
    
    return classes.join(' ');
  };

  // Get Ant Design button type based on variant
  const getAntButtonType = () => {
    switch (variant) {
      case 'primary':
        return 'primary';
      case 'secondary':
        return 'default';
      case 'danger':
        return 'primary';
      case 'ghost':
        return 'ghost';
      case 'link':
        return 'link';
      case 'text':
        return 'text';
      default:
        return 'default';
    }
  };

  // Get Ant Design button size
  const getAntButtonSize = () => {
    switch (size) {
      case 'small':
        return 'small';
      case 'large':
        return 'large';
      case 'medium':
      default:
        return 'middle';
    }
  };

  // Handle click with loading state
  const handleClick = (e) => {
    if (loading || disabled) {
      e.preventDefault();
      return;
    }
    
    if (onClick) {
      onClick(e);
    }
  };

  // Render loading icon
  const renderLoadingIcon = () => {
    if (!loading) return null;
    return <LoadingOutlined className="enhanced-button__loading-icon" />;
  };

  // Render button icon
  const renderIcon = () => {
    if (loading) return renderLoadingIcon();
    if (!icon) return null;
    
    return React.cloneElement(icon, {
      className: `enhanced-button__icon ${icon.props?.className || ''}`
    });
  };

  // Render button content
  const renderContent = () => {
    const iconElement = renderIcon();
    
    if (iconPosition === 'right') {
      return (
        <>
          <span className="enhanced-button__text">{children}</span>
          {iconElement}
        </>
      );
    }
    
    return (
      <>
        {iconElement}
        <span className="enhanced-button__text">{children}</span>
      </>
    );
  };

  return (
    <Button
      ref={ref}
      type={getAntButtonType()}
      size={getAntButtonSize()}
      loading={false} // We handle loading state ourselves
      disabled={disabled}
      className={getButtonClasses()}
      onClick={handleClick}
      {...props}
    >
      {renderContent()}
    </Button>
  );
});

EnhancedButton.displayName = 'EnhancedButton';

export default EnhancedButton;

// Export button variants for convenience
export const PrimaryButton = (props) => (
  <EnhancedButton variant="primary" {...props} />
);

export const SecondaryButton = (props) => (
  <EnhancedButton variant="secondary" {...props} />
);

export const DangerButton = (props) => (
  <EnhancedButton variant="danger" {...props} />
);

export const GhostButton = (props) => (
  <EnhancedButton variant="ghost" {...props} />
);

export const LinkButton = (props) => (
  <EnhancedButton variant="link" {...props} />
);

export const TextButton = (props) => (
  <EnhancedButton variant="text" {...props} />
);

// Export button sizes for convenience
export const SmallButton = (props) => (
  <EnhancedButton size="small" {...props} />
);

export const LargeButton = (props) => (
  <EnhancedButton size="large" {...props} />
);

// Export special button variants
export const GradientButton = (props) => (
  <EnhancedButton gradient elevated {...props} />
);

export const PulseButton = (props) => (
  <EnhancedButton pulse {...props} />
);

export const RoundedButton = (props) => (
  <EnhancedButton rounded {...props} />
);

export const FullWidthButton = (props) => (
  <EnhancedButton fullWidth {...props} />
);

// Export button groups
export const ButtonGroup = ({ children, spacing = 'medium', direction = 'horizontal', className = '', ...props }) => {
  const groupClasses = [
    'enhanced-button-group',
    `enhanced-button-group--${direction}`,
    `enhanced-button-group--spacing-${spacing}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={groupClasses} {...props}>
      {children}
    </div>
  );
};

// Export action button group for common patterns
export const ActionButtonGroup = ({ 
  onSave, 
  onCancel, 
  onReset,
  saveText = 'Save',
  cancelText = 'Cancel',
  resetText = 'Reset',
  saveLoading = false,
  disabled = false,
  showReset = false,
  ...props 
}) => {
  return (
    <ButtonGroup spacing="medium" className="enhanced-button-group--actions" {...props}>
      {showReset && (
        <SecondaryButton onClick={onReset} disabled={disabled || saveLoading}>
          {resetText}
        </SecondaryButton>
      )}
      <SecondaryButton onClick={onCancel} disabled={saveLoading}>
        {cancelText}
      </SecondaryButton>
      <PrimaryButton 
        onClick={onSave} 
        loading={saveLoading} 
        disabled={disabled}
      >
        {saveText}
      </PrimaryButton>
    </ButtonGroup>
  );
};
