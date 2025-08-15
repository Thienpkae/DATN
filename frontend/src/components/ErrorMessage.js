import React from 'react';
import { Alert, Button, Space, Typography, Collapse } from 'antd';
import { 
  ExclamationCircleOutlined, 
  InfoCircleOutlined, 
  WarningOutlined, 
  CloseOutlined,
  ReloadOutlined,
  BugOutlined
} from '@ant-design/icons';

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

const ErrorMessage = ({ 
  error, 
  type = 'error', 
  showIcon = true, 
  closable = true,
  showDetails = false,
  onClose,
  onRetry,
  title,
  description,
  actions,
  style,
  className,
  showErrorId = false,
  showStackTrace = false,
}) => {
  // Handle different error types
  const getErrorConfig = () => {
    if (typeof error === 'string') {
      return {
        message: error,
        type: type,
        showIcon: showIcon,
      };
    }

    if (error && typeof error === 'object') {
      // Handle API error response
      if (error.response) {
        const { status, data } = error.response;
        return {
          message: data?.message || `Lỗi ${status}`,
          type: status >= 500 ? 'error' : status >= 400 ? 'warning' : 'info',
          showIcon: showIcon,
          status: status,
          details: data?.error || data?.details,
        };
      }

      // Handle network error
      if (error.request) {
        return {
          message: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.',
          type: 'error',
          showIcon: showIcon,
          details: 'Network connection failed',
        };
      }

      // Handle other errors
      return {
        message: error.message || 'Đã xảy ra lỗi không xác định',
        type: error.type || type,
        showIcon: showIcon,
        details: error.details || error.stack,
        errorId: error.errorId,
      };
    }

    return {
      message: 'Đã xảy ra lỗi không xác định',
      type: type,
      showIcon: showIcon,
    };
  };

  const errorConfig = getErrorConfig();
  const { message, type, status, details, errorId } = errorConfig;

  // Get icon based on type
  const getIcon = () => {
    if (!showIcon) return null;

    switch (type) {
      case 'error':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'warning':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'info':
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
      case 'success':
        return null; // Success doesn't need icon in Alert
      default:
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
    }
  };

  // Get default actions
  const getDefaultActions = () => {
    const defaultActions = [];

    if (onRetry) {
      defaultActions.push(
        <Button 
          key="retry" 
          type="primary" 
          size="small" 
          icon={<ReloadOutlined />}
          onClick={onRetry}
        >
          Thử lại
        </Button>
      );
    }

    if (showDetails && details) {
      defaultActions.push(
        <Button 
          key="details" 
          size="small" 
          icon={<BugOutlined />}
          onClick={() => setShowDetails(!showDetails)}
        >
          Chi tiết
        </Button>
      );
    }

    return defaultActions;
  };

  // Get status text
  const getStatusText = () => {
    if (!status) return null;

    const statusMap = {
      400: 'Bad Request - Dữ liệu không hợp lệ',
      401: 'Unauthorized - Phiên đăng nhập đã hết hạn',
      403: 'Forbidden - Bạn không có quyền thực hiện hành động này',
      404: 'Not Found - Không tìm thấy dữ liệu yêu cầu',
      409: 'Conflict - Dữ liệu đã tồn tại',
      422: 'Unprocessable Entity - Dữ liệu không hợp lệ',
      429: 'Too Many Requests - Quá nhiều yêu cầu, vui lòng thử lại sau',
      500: 'Internal Server Error - Lỗi server, vui lòng thử lại sau',
      502: 'Bad Gateway - Lỗi kết nối server',
      503: 'Service Unavailable - Dịch vụ tạm thời không khả dụng',
      504: 'Gateway Timeout - Hết thời gian kết nối',
    };

    return statusMap[status] || `HTTP Error ${status}`;
  };

  // Render error details
  const renderErrorDetails = () => {
    if (!showDetails || !details) return null;

    return (
      <Collapse 
        size="small" 
        style={{ marginTop: 8 }}
        ghost
      >
        <Panel header="Chi tiết lỗi" key="1">
          <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
            {errorId && (
              <div style={{ marginBottom: 8 }}>
                <Text strong>Error ID:</Text> {errorId}
              </div>
            )}
            {status && (
              <div style={{ marginBottom: 8 }}>
                <Text strong>Status:</Text> {getStatusText()}
              </div>
            )}
            {details && (
              <div>
                <Text strong>Details:</Text>
                <pre style={{ 
                  backgroundColor: '#f5f5f5', 
                  padding: '8px', 
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxHeight: '200px'
                }}>
                  {typeof details === 'string' ? details : JSON.stringify(details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Panel>
      </Collapse>
    );
  };

  // Render actions
  const renderActions = () => {
    const allActions = [...(actions || []), ...getDefaultActions()];
    
    if (allActions.length === 0) return null;

    return (
      <Space style={{ marginTop: 8 }}>
        {allActions}
      </Space>
    );
  };

  return (
    <Alert
      message={
        <div>
          {title && (
            <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
              {title}
            </div>
          )}
          <div>{message}</div>
          {description && (
            <Paragraph style={{ margin: '8px 0 0 0', fontSize: '12px' }}>
              {description}
            </Paragraph>
          )}
        </div>
      }
      type={type}
      icon={getIcon()}
      closable={closable}
      onClose={onClose}
      style={style}
      className={className}
      showIcon={showIcon}
      action={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {renderActions()}
        </div>
      }
    >
      {renderErrorDetails()}
    </Alert>
  );
};

// Specialized error message components
export const ApiErrorMessage = ({ error, onRetry, ...props }) => {
  return (
    <ErrorMessage
      error={error}
      type="error"
      title="Lỗi API"
      description="Đã xảy ra lỗi khi giao dịch với server"
      onRetry={onRetry}
      showDetails={process.env.NODE_ENV === 'development'}
      {...props}
    />
  );
};

export const ValidationErrorMessage = ({ errors, ...props }) => {
  if (!errors || Object.keys(errors).length === 0) return null;

  const errorMessages = Object.values(errors);
  
  return (
    <ErrorMessage
      error={errorMessages.join(', ')}
      type="warning"
      title="Lỗi xác thực dữ liệu"
      description="Vui lòng kiểm tra và sửa các lỗi bên dưới"
      {...props}
    />
  );
};

export const NetworkErrorMessage = ({ error, onRetry, ...props }) => {
  return (
    <ErrorMessage
      error={error}
      type="error"
      title="Lỗi kết nối mạng"
      description="Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng."
      onRetry={onRetry}
      {...props}
    />
  );
};

export const PermissionErrorMessage = ({ permission, ...props }) => {
  return (
    <ErrorMessage
      error={`Bạn không có quyền thực hiện hành động này. Yêu cầu quyền: ${permission}`}
      type="warning"
      title="Không có quyền truy cập"
      description="Liên hệ quản trị viên để được cấp quyền cần thiết"
      {...props}
    />
  );
};

export const SessionErrorMessage = ({ onLogin, ...props }) => {
  return (
    <ErrorMessage
      error="Phiên đăng nhập đã hết hạn"
      type="warning"
      title="Phiên đăng nhập hết hạn"
      description="Vui lòng đăng nhập lại để tiếp tục"
      actions={[
        <Button 
          key="login" 
          type="primary" 
          size="small"
          onClick={onLogin}
        >
          Đăng nhập
        </Button>
      ]}
      {...props}
    />
  );
};

export default ErrorMessage;
