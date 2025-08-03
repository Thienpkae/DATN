import { useState, useEffect, useCallback } from 'react';
import { Form, Steps, Progress, Typography } from 'antd';
import { CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import EnhancedCard from './EnhancedCard';
import EnhancedButton from './EnhancedButton';
import { ActionButtonGroup } from './EnhancedButton';
import './EnhancedForm.css';

const { Title, Text } = Typography;
const { Step } = Steps;

/**
 * Enhanced Form Component with improved UX patterns
 * 
 * Features:
 * - Multi-step form support
 * - Real-time validation feedback
 * - Progress tracking
 * - Auto-save functionality
 * - Better error handling and display
 * - Accessibility improvements
 * - Responsive design
 */
const EnhancedForm = ({
  title,
  subtitle,
  description,
  children,
  steps = [],
  currentStep = 0,
  onStepChange,
  onSubmit,
  onCancel,
  onReset,
  onSave,
  loading = false,
  autoSave = false,
  autoSaveInterval = 30000, // 30 seconds
  showProgress = false,
  showSteps = false,
  validateOnChange = true,
  submitText = 'Submit',
  cancelText = 'Cancel',
  resetText = 'Reset',
  saveText = 'Save Draft',
  className = '',
  formProps = {},
  ...props
}) => {
  const [form] = Form.useForm();
  const [formProgress, setFormProgress] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [, setErrors] = useState({});
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // idle, saving, saved, error

  // Calculate form completion progress
  const calculateProgress = useCallback(() => {
    const values = form.getFieldsValue();
    const fields = form.getFieldsError();
    
    let totalFields = 0;
    let completedFields = 0;
    let validFields = 0;

    // Count total fields and completed fields
    Object.keys(values).forEach(key => {
      totalFields++;
      if (values[key] !== undefined && values[key] !== '' && values[key] !== null) {
        completedFields++;
      }
    });

    // Count valid fields (no errors)
    fields.forEach(field => {
      if (field.errors.length === 0 && values[field.name[0]] !== undefined) {
        validFields++;
      }
    });

    const progress = totalFields > 0 ? Math.round((validFields / totalFields) * 100) : 0;
    setFormProgress(progress);
    setIsValid(progress === 100 && completedFields === totalFields);
  }, [form]);

  // Handle form values change
  const handleValuesChange = useCallback((_changedValues, _allValues) => {
    setIsDirty(true);
    
    if (validateOnChange) {
      calculateProgress();
    }

    // Trigger auto-save if enabled
    if (autoSave && onSave) {
      setAutoSaveStatus('saving');
    }
  }, [validateOnChange, calculateProgress, autoSave, onSave]);

  // Handle form fields error change
  const handleFieldsChange = useCallback((_changedFields, allFields) => {
    const newErrors = {};
    allFields.forEach(field => {
      if (field.errors && field.errors.length > 0) {
        newErrors[field.name[0]] = field.errors;
      }
    });
    setErrors(newErrors);
    
    if (validateOnChange) {
      calculateProgress();
    }
  }, [validateOnChange, calculateProgress]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !onSave || !isDirty) return;

    const timer = setTimeout(async () => {
      try {
        setAutoSaveStatus('saving');
        const values = form.getFieldsValue();
        await onSave(values);
        setAutoSaveStatus('saved');
        setIsDirty(false);
        
        // Reset status after 2 seconds
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      } catch (error) {
        setAutoSaveStatus('error');
        console.error('Auto-save failed:', error);
      }
    }, autoSaveInterval);

    return () => clearTimeout(timer);
  }, [autoSave, onSave, isDirty, autoSaveInterval, form]);

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      if (onSubmit) {
        await onSubmit(values);
        setIsDirty(false);
      }
    } catch (error) {
      console.error('Form submission failed:', error);
      throw error;
    }
  };

  // Handle form reset
  const handleReset = () => {
    form.resetFields();
    setIsDirty(false);
    setFormProgress(0);
    setErrors({});
    if (onReset) onReset();
  };

  // Handle form cancel
  const handleCancel = () => {
    if (onCancel) onCancel();
  };

  // Handle manual save
  const handleSave = async () => {
    if (onSave) {
      try {
        setAutoSaveStatus('saving');
        const values = form.getFieldsValue();
        await onSave(values);
        setAutoSaveStatus('saved');
        setIsDirty(false);
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      } catch (error) {
        setAutoSaveStatus('error');
        console.error('Save failed:', error);
      }
    }
  };

  // Render auto-save status
  const renderAutoSaveStatus = () => {
    if (!autoSave) return null;

    const statusConfig = {
      idle: { text: '', icon: null },
      saving: { text: 'Saving...', icon: <LoadingOutlined /> },
      saved: { text: 'Saved', icon: <CheckCircleOutlined style={{ color: 'var(--success)' }} /> },
      error: { text: 'Save failed', icon: null }
    };

    const config = statusConfig[autoSaveStatus];
    if (!config.text) return null;

    return (
      <div className="enhanced-form__auto-save-status">
        {config.icon}
        <Text type={autoSaveStatus === 'error' ? 'danger' : 'secondary'} className="text-xs">
          {config.text}
        </Text>
      </div>
    );
  };

  // Render form progress
  const renderProgress = () => {
    if (!showProgress) return null;

    return (
      <div className="enhanced-form__progress">
        <div className="enhanced-form__progress-header">
          <Text type="secondary" className="text-sm">
            Form Completion: {formProgress}%
          </Text>
          {renderAutoSaveStatus()}
        </div>
        <Progress 
          percent={formProgress} 
          size="small" 
          showInfo={false}
          status={formProgress === 100 ? 'success' : 'active'}
          strokeColor={{
            '0%': 'var(--primary-color)',
            '100%': 'var(--success)',
          }}
        />
      </div>
    );
  };

  // Render form steps
  const renderSteps = () => {
    if (!showSteps || steps.length === 0) return null;

    return (
      <div className="enhanced-form__steps">
        <Steps current={currentStep} onChange={onStepChange}>
          {steps.map((step, index) => (
            <Step
              key={index}
              title={step.title}
              description={step.description}
              icon={step.icon}
            />
          ))}
        </Steps>
      </div>
    );
  };

  // Render form header
  const renderHeader = () => {
    if (!title && !subtitle && !description) return null;

    return (
      <div className="enhanced-form__header">
        {title && (
          <Title level={3} className="enhanced-form__title">
            {title}
          </Title>
        )}
        {subtitle && (
          <Text type="secondary" className="enhanced-form__subtitle">
            {subtitle}
          </Text>
        )}
        {description && (
          <Text className="enhanced-form__description">
            {description}
          </Text>
        )}
      </div>
    );
  };

  // Render form actions
  const renderActions = () => {
    return (
      <div className="enhanced-form__actions">
        <ActionButtonGroup
          onSave={onSave ? handleSave : undefined}
          onCancel={handleCancel}
          onReset={onReset ? handleReset : undefined}
          saveText={saveText}
          cancelText={cancelText}
          resetText={resetText}
          saveLoading={autoSaveStatus === 'saving'}
          disabled={loading}
          showReset={!!onReset}
        />
        {onSubmit && (
          <div className="enhanced-form__submit">
            <EnhancedButton
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={!isValid && validateOnChange}
              size="large"
            >
              {submitText}
            </EnhancedButton>
          </div>
        )}
      </div>
    );
  };

  return (
    <EnhancedCard
      className={`enhanced-form ${className}`}
      size="large"
      {...props}
    >
      {renderHeader()}
      {renderSteps()}
      {renderProgress()}
      
      <Form
        form={form}
        layout="vertical"
        size="large"
        onFinish={handleSubmit}
        onValuesChange={handleValuesChange}
        onFieldsChange={handleFieldsChange}
        className="enhanced-form__form"
        {...formProps}
      >
        <div className="enhanced-form__content">
          {children}
        </div>
        
        {renderActions()}
      </Form>
    </EnhancedCard>
  );
};

export default EnhancedForm;
