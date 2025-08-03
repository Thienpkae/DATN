import React from 'react';
import { Result, Button } from 'antd';
import { ExceptionOutlined, ReloadOutlined } from '@ant-design/icons';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="center-content" style={{ padding: '2rem' }}>
          <Result
            status="error"
            icon={<ExceptionOutlined />}
            title="Something went wrong"
            subTitle="We're sorry, but something unexpected happened. Please try refreshing the page."
            extra={[
              <Button 
                type="primary" 
                key="reload" 
                icon={<ReloadOutlined />}
                onClick={this.handleReload}
              >
                Reload Page
              </Button>,
              <Button key="reset" onClick={this.handleReset}>
                Try Again
              </Button>
            ]}
          />
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div style={{ 
              marginTop: '2rem', 
              padding: '1rem', 
              background: '#f5f5f5', 
              borderRadius: '8px',
              maxWidth: '800px',
              overflow: 'auto'
            }}>
              <h4>Error Details (Development Mode):</h4>
              <pre style={{ fontSize: '12px', color: '#d32f2f' }}>
                {this.state.error.toString()}
                {this.state.errorInfo.componentStack}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;