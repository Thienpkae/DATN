import React from 'react';
import { Button, Result, Typography, Card, Space } from 'antd';
import { ReloadOutlined, HomeOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.setState({
      errorInfo,
      errorId,
    });

    // Log error to console for development
    console.error('Error Boundary caught an error:', error, errorInfo);
    console.error('Error ID:', errorId);

    // In production, you would send this to your error reporting service
    // this.logErrorToService(error, errorInfo, errorId);
  }

  // Log error to external service (e.g., Sentry, LogRocket)
  logErrorToService = (error, errorInfo, errorId) => {
    try {
      // Example: Send to your error reporting service
      // errorReportingService.captureException(error, {
      //   errorId,
      //   errorInfo,
      //   userAgent: navigator.userAgent,
      //   url: window.location.href,
      //   timestamp: new Date().toISOString(),
      // });
    } catch (loggingError) {
      console.error('Failed to log error to service:', loggingError);
    }
  };

  // Handle retry
  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  // Handle go home
  handleGoHome = () => {
    window.location.href = '/';
  };

  // Handle reload page
  handleReload = () => {
    window.location.reload();
  };

  // Get error details for debugging
  getErrorDetails = () => {
    const { error, errorInfo, errorId } = this.state;
    
    if (!error) return null;

    return (
      <Card 
        size="small" 
        title="Chi tiết lỗi (Chỉ hiển thị trong development)"
        style={{ marginTop: 16, fontFamily: 'monospace' }}
        className="error-details"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>Error ID:</Text> {errorId}
          </div>
          <div>
            <Text strong>Error:</Text> {error.toString()}
          </div>
          {errorInfo && errorInfo.componentStack && (
            <div>
              <Text strong>Component Stack:</Text>
              <pre style={{ 
                fontSize: '12px', 
                overflow: 'auto', 
                maxHeight: '200px',
                backgroundColor: '#f5f5f5',
                padding: '8px',
                borderRadius: '4px'
              }}>
                {errorInfo.componentStack}
              </pre>
            </div>
          )}
          {error.stack && (
            <div>
              <Text strong>Stack Trace:</Text>
              <pre style={{ 
                fontSize: '12px', 
                overflow: 'auto', 
                maxHeight: '200px',
                backgroundColor: '#f5f5f5',
                padding: '8px',
                borderRadius: '4px'
              }}>
                {error.stack}
              </pre>
            </div>
          )}
        </Space>
      </Card>
    );
  };

  render() {
    if (this.state.hasError) {
      const { errorId } = this.state;
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '20px',
          backgroundColor: '#fafafa'
        }}>
          <Result
            status="error"
            icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
            title="Đã xảy ra lỗi không mong muốn"
            subTitle={
              <div>
                <Paragraph>
                  Hệ thống đã gặp sự cố. Vui lòng thử lại hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp tục.
                </Paragraph>
                {errorId && (
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Mã lỗi: {errorId}
                  </Text>
                )}
              </div>
            }
            extra={[
              <Button 
                key="retry" 
                type="primary" 
                icon={<ReloadOutlined />}
                onClick={this.handleRetry}
              >
                Thử lại
              </Button>,
              <Button 
                key="reload" 
                icon={<ReloadOutlined />}
                onClick={this.handleReload}
              >
                Tải lại trang
              </Button>,
              <Button 
                key="home" 
                icon={<HomeOutlined />}
                onClick={this.handleGoHome}
              >
                Về trang chủ
              </Button>,
            ]}
          >
            {/* Show error details only in development */}
            {isDevelopment && this.getErrorDetails()}
          </Result>
        </div>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = (Component, fallback = null) => {
  return class extends React.Component {
    render() {
      return (
        <ErrorBoundary fallback={fallback}>
          <Component {...this.props} />
        </ErrorBoundary>
      );
    }
  };
};

// Hook for functional components to trigger error boundary
export const useErrorBoundary = () => {
  const throwError = (error) => {
    throw error;
  };

  return { throwError };
};

export default ErrorBoundary;
