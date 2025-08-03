// Enhanced UI Components Library
// Export all enhanced UI components for easy importing
import React from 'react';

// Import components for internal use in HOCs and exports
import EnhancedButton from './EnhancedButton';
import EnhancedCard from './EnhancedCard';
import EnhancedForm from './EnhancedForm';
import EnhancedLoading from './EnhancedLoading';
import {
  PrimaryButton,
  SecondaryButton,
  DangerButton,
  GhostButton,
  LinkButton,
  TextButton
} from './EnhancedButton';
import {
  InfoCard,
  SuccessCard,
  WarningCard,
  ErrorCard,
  StatCard,
  ActionCard,
  FeatureCard
} from './EnhancedCard';
import {
  SpinnerLoading,
  DotsLoading,
  PulseLoading,
  ProgressLoading,
  SkeletonLoading,
  PageLoading
} from './EnhancedLoading';

// Enhanced Button Components
export { default as EnhancedButton } from './EnhancedButton';
export {
  PrimaryButton,
  SecondaryButton,
  DangerButton,
  GhostButton,
  LinkButton,
  TextButton,
  SmallButton,
  LargeButton,
  GradientButton,
  PulseButton,
  RoundedButton,
  FullWidthButton,
  ButtonGroup,
  ActionButtonGroup
} from './EnhancedButton';

// Enhanced Card Components
export { default as EnhancedCard } from './EnhancedCard';
export {
  InfoCard,
  SuccessCard,
  WarningCard,
  ErrorCard,
  StatCard,
  ActionCard,
  FeatureCard,
  LoadingCard,
  EmptyCard
} from './EnhancedCard';

// Enhanced Form Components
export { default as EnhancedForm } from './EnhancedForm';

// Enhanced Loading Components
export { default as EnhancedLoading } from './EnhancedLoading';
export {
  SpinnerLoading,
  DotsLoading,
  PulseLoading,
  ProgressLoading,
  SkeletonLoading,
  SmallLoading,
  LargeLoading,
  OverlayLoading,
  FullScreenLoading,
  PageLoading,
  InlineLoading,
  ButtonLoading,
  CardLoading,
  TableLoading,
  LoadingWrapper
} from './EnhancedLoading';

// Re-export theme utilities
export { getAntTheme, designTokens, getOrgTheme, generateCSSCustomProperties } from '../../styles/theme';

// Component composition utilities
export const withLoading = (Component) => {
  return ({ loading, loadingProps, ...props }) => {
    if (loading) {
      return <EnhancedLoading {...loadingProps} />;
    }
    return <Component {...props} />;
  };
};

export const withErrorBoundary = (Component) => {
  return class extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
      console.error('Component Error:', error, errorInfo);
    }

    render() {
      if (this.state.hasError) {
        return (
          <ErrorCard
            title="Something went wrong"
            subtitle="An error occurred while rendering this component"
            actions={[
              <SecondaryButton 
                key="retry" 
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                Try Again
              </SecondaryButton>
            ]}
          />
        );
      }

      return <Component {...this.props} />;
    }
  };
};

// Layout utilities
export const FlexContainer = ({ 
  direction = 'row', 
  justify = 'flex-start', 
  align = 'stretch', 
  wrap = 'nowrap',
  gap = 'medium',
  className = '',
  children,
  ...props 
}) => {
  const gapMap = {
    small: 'var(--space-2)',
    medium: 'var(--space-4)',
    large: 'var(--space-6)'
  };

  return (
    <div
      className={`flex-container ${className}`}
      style={{
        display: 'flex',
        flexDirection: direction,
        justifyContent: justify,
        alignItems: align,
        flexWrap: wrap,
        gap: gapMap[gap] || gap,
        ...props.style
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export const GridContainer = ({ 
  columns = 'auto', 
  rows = 'auto', 
  gap = 'medium',
  className = '',
  children,
  ...props 
}) => {
  const gapMap = {
    small: 'var(--space-2)',
    medium: 'var(--space-4)',
    large: 'var(--space-6)'
  };

  return (
    <div
      className={`grid-container ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: typeof columns === 'number' ? `repeat(${columns}, 1fr)` : columns,
        gridTemplateRows: typeof rows === 'number' ? `repeat(${rows}, 1fr)` : rows,
        gap: gapMap[gap] || gap,
        ...props.style
      }}
      {...props}
    >
      {children}
    </div>
  );
};

// Responsive utilities
export const ResponsiveContainer = ({ 
  breakpoint = 768,
  mobileComponent,
  desktopComponent,
  children 
}) => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, [breakpoint]);

  if (mobileComponent && desktopComponent) {
    return isMobile ? mobileComponent : desktopComponent;
  }

  return children;
};

// Animation utilities
export const FadeIn = ({ 
  delay = 0, 
  duration = 0.6, 
  children, 
  className = '',
  ...props 
}) => (
  <div
    className={`fade-in ${className}`}
    style={{
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
      ...props.style
    }}
    {...props}
  >
    {children}
  </div>
);

export const SlideIn = ({ 
  direction = 'left', 
  delay = 0, 
  duration = 0.5, 
  children, 
  className = '',
  ...props 
}) => (
  <div
    className={`slide-in-${direction} ${className}`}
    style={{
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
      ...props.style
    }}
    {...props}
  >
    {children}
  </div>
);

export const ScaleIn = ({ 
  delay = 0, 
  duration = 0.3, 
  children, 
  className = '',
  ...props 
}) => (
  <div
    className={`scale-in ${className}`}
    style={{
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
      ...props.style
    }}
    {...props}
  >
    {children}
  </div>
);

// Accessibility utilities
export const VisuallyHidden = ({ children, ...props }) => (
  <span
    style={{
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: 0,
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: 0
    }}
    {...props}
  >
    {children}
  </span>
);

export const FocusTrap = ({ children, active = true }) => {
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [active]);

  return (
    <div ref={containerRef}>
      {children}
    </div>
  );
};

// Export everything as default for convenience
const UIComponents = {
  // Components
  EnhancedButton,
  EnhancedCard,
  EnhancedForm,
  EnhancedLoading,
  
  // Button variants
  PrimaryButton,
  SecondaryButton,
  DangerButton,
  GhostButton,
  LinkButton,
  TextButton,
  
  // Card variants
  InfoCard,
  SuccessCard,
  WarningCard,
  ErrorCard,
  StatCard,
  ActionCard,
  FeatureCard,
  
  // Loading variants
  SpinnerLoading,
  DotsLoading,
  PulseLoading,
  ProgressLoading,
  SkeletonLoading,
  PageLoading,
  
  // Layout utilities
  FlexContainer,
  GridContainer,
  ResponsiveContainer,
  
  // Animation utilities
  FadeIn,
  SlideIn,
  ScaleIn,
  
  // Accessibility utilities
  VisuallyHidden,
  FocusTrap,
  
  // HOCs
  withLoading,
  withErrorBoundary
};

export default UIComponents;
