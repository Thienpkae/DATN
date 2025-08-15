import React from 'react';
import { Spin, Progress, Typography, Space, Card } from 'antd';
import { 
  LoadingOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined
} from '@ant-design/icons';

const { Text } = Typography;

// Loading Spinner Component
export const LoadingSpinner = ({ 
  size = 'default', 
  text = 'Đang tải...', 
  spinning = true,
  tip,
  delay = 0,
  indicator,
  wrapperClassName,
  style,
  className,
  children
}) => {
  const getSize = () => {
    switch (size) {
      case 'small':
        return 'small';
      case 'large':
        return 'large';
      case 'default':
      default:
        return 'default';
    }
  };

  const getIndicator = () => {
    if (indicator) return indicator;
    
    switch (size) {
      case 'small':
        return <LoadingOutlined style={{ fontSize: 16 }} spin />;
      case 'large':
        return <LoadingOutlined style={{ fontSize: 32 }} spin />;
      default:
        return <LoadingOutlined style={{ fontSize: 24 }} spin />;
    }
  };

  return (
    <Spin
      spinning={spinning}
      size={getSize()}
      tip={tip || text}
      delay={delay}
      indicator={getIndicator()}
      wrapperClassName={wrapperClassName}
      style={style}
      className={className}
    >
      {children}
    </Spin>
  );
};

// Progress Bar Component
export const ProgressBar = ({ 
  percent, 
  status = 'active', 
  text,
  showInfo = true,
  strokeColor,
  trailColor,
  strokeWidth = 8,
  size = 'default',
  format,
  style,
  className,
  onSuccess,
  onError
}) => {
  const getStatus = () => {
    if (percent >= 100) return 'success';
    if (percent < 0) return 'exception';
    return status;
  };

  const getStrokeColor = () => {
    if (strokeColor) return strokeColor;
    
    switch (getStatus()) {
      case 'success':
        return '#52c41a';
      case 'exception':
        return '#ff4d4f';
      case 'active':
      default:
        return '#1890ff';
    }
  };

  const getTrailColor = () => {
    if (trailColor) return trailColor;
    return '#f0f0f0';
  };

  const getSize = () => {
    switch (size) {
      case 'small':
        return 6;
      case 'large':
        return 12;
      default:
        return 8;
    }
  };

  const getFormat = () => {
    if (format) return format;
    
    if (percent >= 100) {
      return () => <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    }
    
    if (percent < 0) {
      return () => <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
    }
    
    return (percent) => `${Math.round(percent)}%`;
  };

  // Handle status changes
  React.useEffect(() => {
    if (percent >= 100 && onSuccess) {
      onSuccess();
    }
    
    if (percent < 0 && onError) {
      onError();
    }
  }, [percent, onSuccess, onError]);

  return (
    <div style={style} className={className}>
      {text && (
        <div style={{ marginBottom: 8 }}>
          <Text>{text}</Text>
        </div>
      )}
      
      <Progress
        percent={Math.min(Math.max(percent, 0), 100)}
        status={getStatus()}
        showInfo={showInfo}
        strokeColor={getStrokeColor()}
        trailColor={getTrailColor()}
        strokeWidth={getSize()}
        format={getFormat()}
      />
    </div>
  );
};

// Loading States Component
export const LoadingStates = ({ 
  loading = false, 
  error = null, 
  success = false,
  loadingText = 'Đang xử lý...',
  errorText = 'Đã xảy ra lỗi',
  successText = 'Hoàn thành',
  children,
  onRetry,
  style,
  className
}) => {
  if (loading) {
    return (
      <div style={style} className={className}>
        <LoadingSpinner 
          size="large" 
          text={loadingText}
          spinning={true}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div style={style} className={className}>
        <Card size="small" style={{ textAlign: 'center' }}>
          <Space direction="vertical" size="middle">
            <CloseCircleOutlined style={{ fontSize: 48, color: '#ff4d4f' }} />
            <Text type="danger">{errorText}</Text>
            {onRetry && (
              <button onClick={onRetry} style={{ marginTop: 8 }}>
                Thử lại
              </button>
            )}
          </Space>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div style={style} className={className}>
        <Card size="small" style={{ textAlign: 'center' }}>
          <Space direction="vertical" size="middle">
            <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
            <Text type="success">{successText}</Text>
          </Space>
        </Card>
      </div>
    );
  }

  return children;
};

// Skeleton Loading Component
export const SkeletonLoading = ({ 
  rows = 3, 
  active = true, 
  avatar = false,
  title = true,
  paragraph = true,
  style,
  className
}) => {
  const skeletonConfig = {
    avatar: avatar,
    title: title,
    paragraph: paragraph ? { rows } : false,
    active: active,
  };

  return (
    <div style={style} className={className}>
      <Skeleton {...skeletonConfig} />
    </div>
  );
};

// Inline Loading Component
export const InlineLoading = ({ 
  text = 'Đang tải...', 
  size = 'small',
  style,
  className
}) => {
  return (
    <Space style={style} className={className}>
      <LoadingSpinner size={size} text="" />
      <Text type="secondary">{text}</Text>
    </Space>
  );
};

// Full Screen Loading Component
export const FullScreenLoading = ({ 
  text = 'Đang tải...', 
  size = 'large',
  background = 'rgba(255, 255, 255, 0.9)',
  style,
  className
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        ...style
      }}
      className={className}
    >
      <LoadingSpinner 
        size={size} 
        text={text}
        spinning={true}
      />
    </div>
  );
};

// Button Loading Component
export const ButtonLoading = ({ 
  loading = false, 
  children, 
  icon,
  ...props 
}) => {
  return (
    <button
      loading={loading}
      icon={loading ? <SyncOutlined spin /> : icon}
      disabled={loading}
      {...props}
    >
      {children}
    </button>
  );
};

// Export all components
export default {
  LoadingSpinner,
  ProgressBar,
  LoadingStates,
  SkeletonLoading,
  InlineLoading,
  FullScreenLoading,
  ButtonLoading,
};
