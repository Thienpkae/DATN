import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Space,
  Typography,
  Divider,
  Alert,
  Steps,
  Progress,
  Result,
  Spin
} from 'antd';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  SaveOutlined,
  CloseOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const EnhancedModal = ({
  visible,
  onCancel,
  onOk,
  title,
  subtitle,
  children,
  type = 'default', // default, confirm, info, success, error, warning, loading
  loading = false,
  okText = 'OK',
  cancelText = 'Cancel',
  showCancel = true,
  showOk = true,
  okButtonProps = {},
  cancelButtonProps = {},
  width = 520,
  centered = true,
  maskClosable = false,
  destroyOnClose = true,
  className = '',
  bodyStyle = {},
  steps = [],
  currentStep = 0,
  progress = null,
  icon,
  status,
  ...props
}) => {
  const [internalLoading, setInternalLoading] = useState(false);

  // Handle OK button click
  const handleOk = async () => {
    if (onOk) {
      setInternalLoading(true);
      try {
        await onOk();
      } catch (error) {
        console.error('Modal OK handler error:', error);
      } finally {
        setInternalLoading(false);
      }
    }
  };

  // Get modal configuration based on type
  const getModalConfig = () => {
    const configs = {
      confirm: {
        icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
        className: 'confirm-modal',
        okButtonProps: { danger: true, ...okButtonProps }
      },
      info: {
        icon: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
        className: 'info-modal',
        okButtonProps: { type: 'primary', ...okButtonProps }
      },
      success: {
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        className: 'success-modal',
        okButtonProps: { type: 'primary', ...okButtonProps }
      },
      error: {
        icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
        className: 'error-modal',
        okButtonProps: { danger: true, ...okButtonProps }
      },
      warning: {
        icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
        className: 'warning-modal',
        okButtonProps: { type: 'primary', ...okButtonProps }
      },
      loading: {
        icon: <LoadingOutlined style={{ color: '#1890ff' }} />,
        className: 'loading-modal',
        showCancel: false,
        showOk: false,
        maskClosable: false
      }
    };

    return configs[type] || {};
  };

  const config = getModalConfig();
  const modalIcon = icon || config.icon;
  const isLoading = loading || internalLoading;

  // Custom footer
  const renderFooter = () => {
    if (type === 'loading') return null;

    const buttons = [];

    if (showCancel) {
      buttons.push(
        <Button
          key="cancel"
          onClick={onCancel}
          disabled={isLoading}
          {...cancelButtonProps}
        >
          {cancelText}
        </Button>
      );
    }

    if (showOk) {
      buttons.push(
        <Button
          key="ok"
          type="primary"
          loading={isLoading}
          onClick={handleOk}
          icon={isLoading ? <LoadingOutlined /> : <SaveOutlined />}
          className="btn-primary"
          style={{
            background: 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))',
            border: 'none'
          }}
          {...config.okButtonProps}
        >
          {isLoading ? 'Processing...' : okText}
        </Button>
      );
    }

    return buttons;
  };

  // Modal content with enhanced styling
  const renderContent = () => {
    return (
      <div className="enhanced-modal-content">
        {/* Header with icon and title */}
        {(modalIcon || title || subtitle) && (
          <div style={{ 
            textAlign: 'center', 
            marginBottom: steps.length > 0 ? '1.5rem' : '2rem' 
          }}>
            {modalIcon && (
              <div style={{ 
                fontSize: '48px', 
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: 'center'
              }}>
                {modalIcon}
              </div>
            )}
            
            {title && (
              <Title level={4} style={{ marginBottom: '0.5rem', color: '#1f1f1f' }}>
                {title}
              </Title>
            )}
            
            {subtitle && (
              <Text type="secondary" style={{ fontSize: '14px' }}>
                {subtitle}
              </Text>
            )}
          </div>
        )}

        {/* Progress indicator */}
        {progress && (
          <div style={{ marginBottom: '1.5rem' }}>
            <Progress 
              percent={progress.percent} 
              status={progress.status}
              showInfo={progress.showInfo !== false}
              strokeColor={progress.color}
            />
            {progress.text && (
              <Text type="secondary" style={{ fontSize: '12px', display: 'block', textAlign: 'center', marginTop: '8px' }}>
                {progress.text}
              </Text>
            )}
          </div>
        )}

        {/* Steps */}
        {steps.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <Steps current={currentStep} size="small" direction="vertical">
              {steps.map((step, index) => (
                <Steps.Step
                  key={index}
                  title={step.title}
                  description={step.description}
                  icon={step.icon}
                  status={step.status}
                />
              ))}
            </Steps>
          </div>
        )}

        {/* Status result */}
        {status && (
          <div style={{ marginBottom: '1.5rem' }}>
            <Result
              status={status.type}
              title={status.title}
              subTitle={status.description}
              icon={status.icon}
            />
          </div>
        )}

        {/* Main content */}
        <div className="modal-body-content">
          {children}
        </div>
      </div>
    );
  };

  return (
    <Modal
      visible={visible}
      onCancel={onCancel}
      title={null}
      footer={renderFooter()}
      width={width}
      centered={centered}
      maskClosable={maskClosable && !isLoading}
      destroyOnClose={destroyOnClose}
      className={`professional-modal enhanced-modal ${config.className} ${className}`}
      bodyStyle={{
        padding: '2rem',
        borderRadius: '12px',
        ...bodyStyle
      }}
      closeIcon={
        <CloseOutlined 
          style={{ 
            fontSize: '16px', 
            color: '#8c8c8c',
            padding: '8px'
          }} 
        />
      }
      {...props}
    >
      {renderContent()}
    </Modal>
  );
};

// Pre-configured modal types
export const ConfirmModal = (props) => (
  <EnhancedModal type="confirm" {...props} />
);

export const InfoModal = (props) => (
  <EnhancedModal type="info" {...props} />
);

export const SuccessModal = (props) => (
  <EnhancedModal type="success" {...props} />
);

export const ErrorModal = (props) => (
  <EnhancedModal type="error" {...props} />
);

export const WarningModal = (props) => (
  <EnhancedModal type="warning" {...props} />
);

export const LoadingModal = (props) => (
  <EnhancedModal type="loading" {...props} />
);

// Modal utilities
export const ModalUtils = {
  confirm: (config) => {
    return Modal.confirm({
      title: config.title,
      content: config.content,
      icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      okText: config.okText || 'Confirm',
      cancelText: config.cancelText || 'Cancel',
      onOk: config.onOk,
      onCancel: config.onCancel,
      okButtonProps: { danger: true },
      className: 'professional-modal confirm-modal',
      ...config
    });
  },

  success: (config) => {
    return Modal.success({
      title: config.title,
      content: config.content,
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      okText: config.okText || 'OK',
      onOk: config.onOk,
      className: 'professional-modal success-modal',
      ...config
    });
  },

  error: (config) => {
    return Modal.error({
      title: config.title,
      content: config.content,
      icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      okText: config.okText || 'OK',
      onOk: config.onOk,
      className: 'professional-modal error-modal',
      ...config
    });
  },

  warning: (config) => {
    return Modal.warning({
      title: config.title,
      content: config.content,
      icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      okText: config.okText || 'OK',
      onOk: config.onOk,
      className: 'professional-modal warning-modal',
      ...config
    });
  },

  info: (config) => {
    return Modal.info({
      title: config.title,
      content: config.content,
      icon: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
      okText: config.okText || 'OK',
      onOk: config.onOk,
      className: 'professional-modal info-modal',
      ...config
    });
  }
};

export default EnhancedModal;