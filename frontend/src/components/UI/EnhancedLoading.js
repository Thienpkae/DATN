import React from 'react';
import { Spin, Typography, Progress } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import './EnhancedLoading.css';

const { Text } = Typography;

/**
 * Enhanced Loading Component with better UX patterns
 * 
 * Features:
 * - Multiple loading variants and styles
 * - Progress indication
 * - Contextual loading messages
 * - Skeleton loading states
 * - Smooth animations
 * - Accessibility support
 */

// Custom loading icons
const SpinIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;
const LargeSpinIcon = <LoadingOutlined style={{ fontSize: 32 }} spin />;
const SmallSpinIcon = <LoadingOutlined style={{ fontSize: 16 }} spin />;

// Main Enhanced Loading Component
const EnhancedLoading = ({
  variant = 'spinner',
  size = 'default',
  text = 'Loading...',
  subtext,
  progress,
  overlay = false,
  centered = false,
  fullScreen = false,
  delay = 0,
  className = '',
  style = {},
  children,
  ...props
}) => {
  
  // Get loading classes
  const getLoadingClasses = () => {
    const classes = ['enhanced-loading'];
    
    classes.push(`enhanced-loading--${variant}`);
    classes.push(`enhanced-loading--${size}`);
    
    if (overlay) classes.push('enhanced-loading--overlay');
    if (centered) classes.push('enhanced-loading--centered');
    if (fullScreen) classes.push('enhanced-loading--fullscreen');
    if (className) classes.push(className);
    
    return classes.join(' ');
  };

  // Get spinner size
  const getSpinnerSize = () => {
    switch (size) {
      case 'small': return 'small';
      case 'large': return 'large';
      default: return 'default';
    }
  };

  // Get spinner indicator
  const getSpinnerIndicator = () => {
    switch (size) {
      case 'small': return SmallSpinIcon;
      case 'large': return LargeSpinIcon;
      default: return SpinIcon;
    }
  };

  // Render spinner variant
  const renderSpinner = () => (
    <div className="enhanced-loading__spinner">
      <Spin 
        size={getSpinnerSize()} 
        indicator={getSpinnerIndicator()}
        delay={delay}
      />
      {text && (
        <div className="enhanced-loading__text">
          <Text className="enhanced-loading__main-text">{text}</Text>
          {subtext && (
            <Text type="secondary" className="enhanced-loading__sub-text">
              {subtext}
            </Text>
          )}
        </div>
      )}
    </div>
  );

  // Render dots variant
  const renderDots = () => (
    <div className="enhanced-loading__dots">
      <div className="enhanced-loading__dot"></div>
      <div className="enhanced-loading__dot"></div>
      <div className="enhanced-loading__dot"></div>
      {text && (
        <div className="enhanced-loading__text">
          <Text className="enhanced-loading__main-text">{text}</Text>
          {subtext && (
            <Text type="secondary" className="enhanced-loading__sub-text">
              {subtext}
            </Text>
          )}
        </div>
      )}
    </div>
  );

  // Render pulse variant
  const renderPulse = () => (
    <div className="enhanced-loading__pulse">
      <div className="enhanced-loading__pulse-circle"></div>
      {text && (
        <div className="enhanced-loading__text">
          <Text className="enhanced-loading__main-text">{text}</Text>
          {subtext && (
            <Text type="secondary" className="enhanced-loading__sub-text">
              {subtext}
            </Text>
          )}
        </div>
      )}
    </div>
  );

  // Render progress variant
  const renderProgress = () => (
    <div className="enhanced-loading__progress">
      <Progress 
        percent={progress || 0} 
        status="active"
        strokeColor={{
          '0%': 'var(--primary-color)',
          '100%': 'var(--primary-hover)',
        }}
        trailColor="var(--gray-200)"
      />
      {text && (
        <div className="enhanced-loading__text">
          <Text className="enhanced-loading__main-text">{text}</Text>
          {subtext && (
            <Text type="secondary" className="enhanced-loading__sub-text">
              {subtext}
            </Text>
          )}
        </div>
      )}
    </div>
  );

  // Render skeleton variant
  const renderSkeleton = () => (
    <div className="enhanced-loading__skeleton">
      <div className="skeleton skeleton-avatar"></div>
      <div className="skeleton-content">
        <div className="skeleton skeleton-text"></div>
        <div className="skeleton skeleton-text"></div>
        <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
      </div>
    </div>
  );

  // Render content based on variant
  const renderContent = () => {
    switch (variant) {
      case 'dots': return renderDots();
      case 'pulse': return renderPulse();
      case 'progress': return renderProgress();
      case 'skeleton': return renderSkeleton();
      case 'spinner':
      default: return renderSpinner();
    }
  };

  // If children provided, wrap them with loading
  if (children) {
    return (
      <Spin 
        spinning={true} 
        indicator={getSpinnerIndicator()}
        size={getSpinnerSize()}
        delay={delay}
        tip={text}
        {...props}
      >
        {children}
      </Spin>
    );
  }

  return (
    <div 
      className={getLoadingClasses()} 
      style={style}
      role="status"
      aria-label={text || 'Loading'}
      {...props}
    >
      {renderContent()}
    </div>
  );
};

export default EnhancedLoading;

// Export loading variants for convenience
export const SpinnerLoading = (props) => (
  <EnhancedLoading variant="spinner" {...props} />
);

export const DotsLoading = (props) => (
  <EnhancedLoading variant="dots" {...props} />
);

export const PulseLoading = (props) => (
  <EnhancedLoading variant="pulse" {...props} />
);

export const ProgressLoading = (props) => (
  <EnhancedLoading variant="progress" {...props} />
);

export const SkeletonLoading = (props) => (
  <EnhancedLoading variant="skeleton" {...props} />
);

// Export loading sizes
export const SmallLoading = (props) => (
  <EnhancedLoading size="small" {...props} />
);

export const LargeLoading = (props) => (
  <EnhancedLoading size="large" {...props} />
);

// Export overlay loading
export const OverlayLoading = (props) => (
  <EnhancedLoading overlay centered {...props} />
);

export const FullScreenLoading = (props) => (
  <EnhancedLoading fullScreen centered {...props} />
);

// Export page loading component
export const PageLoading = ({ 
  title = "Loading...", 
  subtitle = "Please wait while we load your content",
  ...props 
}) => (
  <EnhancedLoading
    variant="spinner"
    size="large"
    text={title}
    subtext={subtitle}
    centered
    fullScreen
    {...props}
  />
);

// Export inline loading component
export const InlineLoading = ({ text = "Loading...", ...props }) => (
  <EnhancedLoading
    variant="dots"
    size="small"
    text={text}
    {...props}
  />
);

// Export button loading component
export const ButtonLoading = (props) => (
  <EnhancedLoading
    variant="spinner"
    size="small"
    {...props}
  />
);

// Export card loading component
export const CardLoading = ({ lines = 3, ...props }) => (
  <div className="enhanced-loading__card-skeleton">
    <div className="skeleton skeleton-title"></div>
    {Array.from({ length: lines }, (_, index) => (
      <div key={index} className="skeleton skeleton-text"></div>
    ))}
    <div className="skeleton skeleton-button"></div>
  </div>
);

// Export table loading component
export const TableLoading = ({ rows = 5, columns = 4, ...props }) => (
  <div className="enhanced-loading__table-skeleton">
    <div className="skeleton-table-header">
      {Array.from({ length: columns }, (_, index) => (
        <div key={index} className="skeleton skeleton-text"></div>
      ))}
    </div>
    {Array.from({ length: rows }, (_, rowIndex) => (
      <div key={rowIndex} className="skeleton-table-row">
        {Array.from({ length: columns }, (_, colIndex) => (
          <div key={colIndex} className="skeleton skeleton-text"></div>
        ))}
      </div>
    ))}
  </div>
);

// Export loading wrapper component
export const LoadingWrapper = ({ 
  loading = false, 
  children, 
  loadingComponent,
  ...props 
}) => {
  if (loading) {
    return loadingComponent || <EnhancedLoading {...props} />;
  }
  
  return children;
};
