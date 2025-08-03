import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Row,
  Col,
  Space,
  Typography,
  Divider,
  Alert,
  Steps,
  Progress,
  Tooltip,
  Select,
  DatePicker,
  Upload,
  InputNumber,
  Switch,
  Radio,
  Checkbox
} from 'antd';
import {
  SaveOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  UploadOutlined,
  PlusOutlined,
  MinusCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const EnhancedForm = ({
  title,
  subtitle,
  fields = [],
  initialValues = {},
  onSubmit,
  onReset,
  loading = false,
  layout = 'vertical',
  size = 'large',
  showSteps = false,
  steps = [],
  submitText = 'Submit',
  resetText = 'Reset',
  className = '',
  cardProps = {},
  formProps = {},
  ...props
}) => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [formProgress, setFormProgress] = useState(0);
  const [isDirty, setIsDirty] = useState(false);

  // Calculate form completion progress
  useEffect(() => {
    const values = form.getFieldsValue();
    const totalFields = fields.length;
    const filledFields = Object.values(values).filter(value => 
      value !== undefined && value !== null && value !== ''
    ).length;
    
    setFormProgress(totalFields > 0 ? (filledFields / totalFields) * 100 : 0);
  }, [form, fields]);

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      await onSubmit(values);
      setIsDirty(false);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  // Handle form reset
  const handleReset = () => {
    form.resetFields();
    setIsDirty(false);
    setCurrentStep(0);
    if (onReset) onReset();
  };

  // Handle form values change
  const handleValuesChange = () => {
    setIsDirty(true);
  };

  // Render field based on type
  const renderField = (field) => {
    const {
      name,
      label,
      type = 'input',
      required = false,
      rules = [],
      placeholder,
      options = [],
      disabled = false,
      tooltip,
      span = 24,
      dependencies,
      ...fieldProps
    } = field;

    const baseRules = required ? [{ required: true, message: `Please input ${label}!` }] : [];
    const finalRules = [...baseRules, ...rules];

    const labelWithTooltip = tooltip ? (
      <Space>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <Tooltip title={tooltip}>
          <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
        </Tooltip>
      </Space>
    ) : (
      <span style={{ fontWeight: 600 }}>{label}</span>
    );

    const commonProps = {
      placeholder,
      disabled,
      style: { borderRadius: '8px' },
      ...fieldProps
    };

    let fieldComponent;

    switch (type) {
      case 'textarea':
        fieldComponent = (
          <TextArea 
            {...commonProps}
            rows={4}
            showCount
            maxLength={500}
          />
        );
        break;

      case 'select':
        fieldComponent = (
          <Select {...commonProps} showSearch optionFilterProp="children">
            {options.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        );
        break;

      case 'number':
        fieldComponent = (
          <InputNumber 
            {...commonProps}
            style={{ width: '100%', borderRadius: '8px' }}
          />
        );
        break;

      case 'date':
        fieldComponent = (
          <DatePicker 
            {...commonProps}
            style={{ width: '100%', borderRadius: '8px' }}
          />
        );
        break;

      case 'upload':
        fieldComponent = (
          <Upload {...commonProps}>
            <Button icon={<UploadOutlined />}>Upload File</Button>
          </Upload>
        );
        break;

      case 'switch':
        fieldComponent = <Switch {...commonProps} />;
        break;

      case 'radio':
        fieldComponent = (
          <Radio.Group {...commonProps}>
            {options.map(option => (
              <Radio key={option.value} value={option.value}>
                {option.label}
              </Radio>
            ))}
          </Radio.Group>
        );
        break;

      case 'checkbox':
        fieldComponent = (
          <Checkbox.Group {...commonProps}>
            {options.map(option => (
              <Checkbox key={option.value} value={option.value}>
                {option.label}
              </Checkbox>
            ))}
          </Checkbox.Group>
        );
        break;

      case 'password':
        fieldComponent = (
          <Input.Password 
            {...commonProps}
            style={{ borderRadius: '8px' }}
          />
        );
        break;

      case 'dynamic':
        fieldComponent = (
          <Form.List name={name}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name: fieldName, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[fieldName, 'value']}
                      rules={finalRules}
                    >
                      <Input placeholder={placeholder} />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(fieldName)} />
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Add {label}
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        );
        break;

      default:
        fieldComponent = (
          <Input 
            {...commonProps}
            style={{ borderRadius: '8px' }}
          />
        );
    }

    return (
      <Col span={span} key={name}>
        <Form.Item
          name={name}
          label={labelWithTooltip}
          rules={finalRules}
          dependencies={dependencies}
        >
          {fieldComponent}
        </Form.Item>
      </Col>
    );
  };

  // Group fields by step if steps are provided
  const getFieldsForStep = (stepIndex) => {
    if (!showSteps || !steps.length) return fields;
    
    const step = steps[stepIndex];
    return fields.filter(field => step.fields.includes(field.name));
  };

  // Navigation for steps
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Card 
      className={`professional-form ${className}`}
      {...cardProps}
    >
      {/* Header */}
      {(title || subtitle) && (
        <div style={{ marginBottom: '2rem' }}>
          {title && (
            <Title level={3} style={{ marginBottom: '0.5rem' }}>
              {title}
            </Title>
          )}
          {subtitle && (
            <Text type="secondary" style={{ fontSize: '16px' }}>
              {subtitle}
            </Text>
          )}
        </div>
      )}

      {/* Progress Indicator */}
      {!showSteps && formProgress > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Form Completion: {Math.round(formProgress)}%
          </Text>
          <Progress 
            percent={formProgress} 
            size="small" 
            showInfo={false}
            status={formProgress === 100 ? 'success' : 'active'}
          />
        </div>
      )}

      {/* Steps */}
      {showSteps && steps.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <Steps current={currentStep} size="small">
            {steps.map((step, index) => (
              <Steps.Step
                key={index}
                title={step.title}
                description={step.description}
                icon={step.icon}
              />
            ))}
          </Steps>
        </div>
      )}

      {/* Dirty Form Warning */}
      {isDirty && (
        <Alert
          message="Unsaved Changes"
          description="You have unsaved changes. Don't forget to save your work."
          type="warning"
          showIcon
          style={{ marginBottom: '1.5rem' }}
          className="notification-warning"
        />
      )}

      <Form
        form={form}
        layout={layout}
        size={size}
        initialValues={initialValues}
        onFinish={handleSubmit}
        onValuesChange={handleValuesChange}
        {...formProps}
        {...props}
      >
        <Row gutter={[16, 0]}>
          {getFieldsForStep(currentStep).map(renderField)}
        </Row>

        <Divider style={{ margin: '2rem 0 1.5rem' }} />

        {/* Form Actions */}
        <Row justify="space-between" align="middle">
          <Col>
            {showSteps && (
              <Space>
                <Button 
                  onClick={prevStep} 
                  disabled={currentStep === 0}
                >
                  Previous
                </Button>
                {currentStep < steps.length - 1 ? (
                  <Button type="primary" onClick={nextStep}>
                    Next
                  </Button>
                ) : null}
              </Space>
            )}
          </Col>

          <Col>
            <Space>
              <Button 
                onClick={handleReset}
                icon={<ReloadOutlined />}
                disabled={loading}
              >
                {resetText}
              </Button>
              
              {(!showSteps || currentStep === steps.length - 1) && (
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<SaveOutlined />}
                  className="btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))',
                    border: 'none',
                    borderRadius: '8px',
                    height: '40px',
                    paddingLeft: '24px',
                    paddingRight: '24px'
                  }}
                >
                  {loading ? 'Submitting...' : submitText}
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

// Field type helpers
export const FormFieldTypes = {
  input: (name, label, options = {}) => ({
    name,
    label,
    type: 'input',
    ...options
  }),

  textarea: (name, label, options = {}) => ({
    name,
    label,
    type: 'textarea',
    ...options
  }),

  select: (name, label, selectOptions, options = {}) => ({
    name,
    label,
    type: 'select',
    options: selectOptions,
    ...options
  }),

  number: (name, label, options = {}) => ({
    name,
    label,
    type: 'number',
    ...options
  }),

  date: (name, label, options = {}) => ({
    name,
    label,
    type: 'date',
    ...options
  }),

  upload: (name, label, options = {}) => ({
    name,
    label,
    type: 'upload',
    ...options
  }),

  password: (name, label, options = {}) => ({
    name,
    label,
    type: 'password',
    ...options
  }),

  switch: (name, label, options = {}) => ({
    name,
    label,
    type: 'switch',
    ...options
  })
};

// Validation rules helpers
export const ValidationRules = {
  required: (message) => ({ required: true, message }),
  email: { type: 'email', message: 'Please enter a valid email address!' },
  phone: { pattern: /^[0-9]{10}$/, message: 'Please enter a valid phone number!' },
  cccd: { pattern: /^\d{12}$/, message: 'CCCD must be exactly 12 digits!' },
  minLength: (min) => ({ min, message: `Must be at least ${min} characters!` }),
  maxLength: (max) => ({ max, message: `Must be no more than ${max} characters!` }),
  pattern: (pattern, message) => ({ pattern, message }),
  number: { type: 'number', message: 'Please enter a valid number!' },
  url: { type: 'url', message: 'Please enter a valid URL!' }
};

export default EnhancedForm;