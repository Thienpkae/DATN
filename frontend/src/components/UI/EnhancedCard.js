import React, { forwardRef } from 'react';
import { Card, Typography, Space } from 'antd';
import './EnhancedCard.css';

const { Title, Text } = Typography;

/**
 * Enhanced Card Component with improved UX patterns
 * 
 * Features:
 * - Multiple card variants and styles
 * - Better visual hierarchy
 * - Smooth animations and hover effects
 * - Flexible content layout
 * - Enhanced accessibility
 * - Loading and skeleton states
 */
const EnhancedCard = forwardRef(({
  children,
  title,
  subtitle,
  extra,
  actions,
  variant = 'default',
  size = 'default',
  hoverable = false,
  clickable = false,
  loading = false,
  skeleton = false,
  bordered = true,
  elevated = false,
  gradient = false,
  status,
  statusColor,
  icon,
  cover,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  onClick,
  onHeaderClick,
  ...props
}, ref) => {

  // Generate class names based on props
  const getCardClasses = () => {
    const classes = ['enhanced-card'];
    
    // Variant classes
    classes.push(`enhanced-card--${variant}`);
    
    // Size classes
    classes.push(`enhanced-card--${size}`);
    
    // State classes
    if (loading) classes.push('enhanced-card--loading');
    if (skeleton) classes.push('enhanced-card--skeleton');
    if (hoverable) classes.push('enhanced-card--hoverable');
    if (clickable) classes.push('enhanced-card--clickable');
    if (elevated) classes.push('enhanced-card--elevated');
    if (gradient) classes.push('enhanced-card--gradient');
    if (status) classes.push(`enhanced-card--status-${status}`);
    
    // Custom classes
    if (className) classes.push(className);
    
    return classes.join(' ');
  };

  // Handle card click
  const handleClick = (e) => {
    if (loading || !clickable) return;
    if (onClick) onClick(e);
  };

  // Handle header click
  const handleHeaderClick = (e) => {
    if (loading) return;
    if (onHeaderClick) {
      e.stopPropagation();
      onHeaderClick(e);
    }
  };

  // Render card header
  const renderHeader = () => {
    if (!title && !subtitle && !extra && !icon) return null;

    return (
      <div 
        className={`enhanced-card__header ${headerClassName}`}
        onClick={onHeaderClick ? handleHeaderClick : undefined}
      >
        <div className="enhanced-card__header-content">
          {icon && (
            <div className="enhanced-card__header-icon">
              {icon}
            </div>
          )}
          <div className="enhanced-card__header-text">
            {title && (
              <Title 
                level={size === 'small' ? 5 : 4} 
                className="enhanced-card__title"
                style={{ margin: 0 }}
              >
                {title}
              </Title>
            )}
            {subtitle && (
              <Text 
                type="secondary" 
                className="enhanced-card__subtitle"
              >
                {subtitle}
              </Text>
            )}
          </div>
        </div>
        {extra && (
          <div className="enhanced-card__header-extra">
            {extra}
          </div>
        )}
      </div>
    );
  };

  // Render card body
  const renderBody = () => {
    if (skeleton) {
      return (
        <div className={`enhanced-card__body enhanced-card__skeleton ${bodyClassName}`}>
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-text" style={{ width: '60%' }} />
        </div>
      );
    }

    return (
      <div className={`enhanced-card__body ${bodyClassName}`}>
        {children}
      </div>
    );
  };

  // Render card footer
  const renderFooter = () => {
    if (!actions || actions.length === 0) return null;

    return (
      <div className={`enhanced-card__footer ${footerClassName}`}>
        <Space size="small" wrap>
          {actions.map((action, index) => (
            <React.Fragment key={index}>
              {action}
            </React.Fragment>
          ))}
        </Space>
      </div>
    );
  };

  // Render status indicator
  const renderStatusIndicator = () => {
    if (!status) return null;

    return (
      <div 
        className={`enhanced-card__status-indicator enhanced-card__status-indicator--${status}`}
        style={statusColor ? { backgroundColor: statusColor } : undefined}
      />
    );
  };

  return (
    <Card
      ref={ref}
      className={getCardClasses()}
      bordered={bordered}
      loading={loading && !skeleton}
      hoverable={hoverable && !loading}
      cover={cover}
      onClick={clickable ? handleClick : undefined}
      {...props}
    >
      {renderStatusIndicator()}
      {renderHeader()}
      {renderBody()}
      {renderFooter()}
    </Card>
  );
});

EnhancedCard.displayName = 'EnhancedCard';

export default EnhancedCard;

// Export card variants for convenience
export const InfoCard = (props) => (
  <EnhancedCard variant="info" {...props} />
);

export const SuccessCard = (props) => (
  <EnhancedCard variant="success" {...props} />
);

export const WarningCard = (props) => (
  <EnhancedCard variant="warning" {...props} />
);

export const ErrorCard = (props) => (
  <EnhancedCard variant="error" {...props} />
);

export const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  trendValue, 
  color,
  ...props 
}) => (
  <EnhancedCard
    variant="stat"
    hoverable
    elevated
    className="enhanced-card--stat"
    {...props}
  >
    <div className="stat-card-content">
      <div className="stat-card-header">
        {icon && (
          <div className="stat-card-icon" style={color ? { color } : undefined}>
            {icon}
          </div>
        )}
        <div className="stat-card-info">
          <div className="stat-card-value" style={color ? { color } : undefined}>
            {value}
          </div>
          <div className="stat-card-title">{title}</div>
        </div>
      </div>
      {(subtitle || trend) && (
        <div className="stat-card-footer">
          {subtitle && (
            <Text type="secondary" className="stat-card-subtitle">
              {subtitle}
            </Text>
          )}
          {trend && (
            <div className={`stat-card-trend stat-card-trend--${trend}`}>
              {trendValue}
            </div>
          )}
        </div>
      )}
    </div>
  </EnhancedCard>
);

export const ActionCard = ({ 
  title, 
  description, 
  actions, 
  icon, 
  ...props 
}) => (
  <EnhancedCard
    title={title}
    icon={icon}
    actions={actions}
    hoverable
    clickable
    {...props}
  >
    {description && (
      <Text type="secondary">{description}</Text>
    )}
  </EnhancedCard>
);

export const FeatureCard = ({ 
  title, 
  description, 
  icon, 
  badge,
  ...props 
}) => (
  <EnhancedCard
    variant="feature"
    hoverable
    elevated
    className="enhanced-card--feature"
    {...props}
  >
    <div className="feature-card-content">
      {badge && (
        <div className="feature-card-badge">{badge}</div>
      )}
      {icon && (
        <div className="feature-card-icon">{icon}</div>
      )}
      <Title level={4} className="feature-card-title">
        {title}
      </Title>
      {description && (
        <Text type="secondary" className="feature-card-description">
          {description}
        </Text>
      )}
    </div>
  </EnhancedCard>
);

export const LoadingCard = ({ lines = 3, ...props }) => (
  <EnhancedCard skeleton {...props}>
    {Array.from({ length: lines }, (_, index) => (
      <div key={index} className="skeleton skeleton-text" />
    ))}
  </EnhancedCard>
);

export const EmptyCard = ({ 
  title = "No Data", 
  description = "There's nothing to show here yet.", 
  icon,
  action,
  ...props 
}) => (
  <EnhancedCard
    variant="empty"
    className="enhanced-card--empty"
    {...props}
  >
    <div className="empty-card-content">
      {icon && (
        <div className="empty-card-icon">{icon}</div>
      )}
      <Title level={4} type="secondary" className="empty-card-title">
        {title}
      </Title>
      {description && (
        <Text type="secondary" className="empty-card-description">
          {description}
        </Text>
      )}
      {action && (
        <div className="empty-card-action">
          {action}
        </div>
      )}
    </div>
  </EnhancedCard>
);
