import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Card, Select, Typography, Alert, Space, Divider, Progress } from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  PhoneOutlined, 
  IdcardOutlined, 
  SafetyOutlined,
  CheckCircleOutlined,
  HomeOutlined,
  BankOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { register, registerCitizen } from '../../services/auth';
import useMessage from '../../hooks/useMessage';

const { Title, Text } = Typography;
const { Option } = Select;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const message = useMessage();
  
  // Check if this is admin registration (from admin panel)
  const isAdminRegistration = location.state?.isAdminRegistration || false;

  const [passwordStrength, setPasswordStrength] = useState(0);

  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 20;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password)) strength += 20;
    return Math.min(strength, 100);
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Removed all console.log for production readiness
      if (!isAdminRegistration) {
        // Citizens: always org3, role user, no userId
        const citizenData = {
          cccd: values.cccd,
          phone: values.phone,
          fullName: values.fullName,
          password: values.password,
          org: 'Org3',
          role: 'user',
        };
        const result = await registerCitizen(citizenData);
        message.success('Registration successful! Please verify your phone number.');
        navigate('/verify-otp', { 
          state: { 
            cccd: values.cccd, 
            phone: values.phone,
            message: result.message 
          } 
        });
      } else {
        // Admin registration for org1 and org2 users
        await register(values);
        message.success('Account created successfully! Admin approval required.');
        navigate('/login');
      }
    } catch (error) {
      console.error('Registration error details:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Registration failed';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center-content" style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '2rem'
    }}>
      <div className="fade-in" style={{ width: '100%', maxWidth: '600px' }}>
        <Card 
          className="professional-card"
          style={{ 
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            border: 'none',
            borderRadius: '16px',
            overflow: 'hidden'
          }}
        >
          {/* Header Section */}
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '2rem',
            padding: '1rem 0'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: isAdminRegistration 
                ? 'linear-gradient(135deg, #52c41a, #389e0d)' 
                : 'linear-gradient(135deg, #fa8c16, #d46b08)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
            }}>
              {isAdminRegistration ? <BankOutlined style={{ fontSize: '2rem', color: 'white' }} /> : <HomeOutlined style={{ fontSize: '2rem', color: 'white' }} />}
            </div>
            <Title level={2} style={{ margin: '0 0 0.5rem', color: '#1f1f1f' }}>
              {isAdminRegistration ? 'Admin Registration' : 'Citizen Registration'}
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              {isAdminRegistration 
                ? 'Create an administrative account for land registry management' 
                : 'Join the blockchain-based land registry system'}
            </Text>
          </div>

          {/* Alert Messages */}
          {isAdminRegistration ? (
            <Alert
              message="Administrative Account"
              description="This registration is for Land Authority and Government Officers. Your account requires admin approval and will be activated after verification."
              type="info"
              showIcon
              icon={<BankOutlined />}
              style={{ marginBottom: '1.5rem' }}
              className="notification-info"
            />
          ) : (
            <Alert
              message="Citizen Account"
              description="Register to manage your land parcels, request transfers, and access all citizen services on the blockchain."
              type="success"
              showIcon
              icon={<HomeOutlined />}
              style={{ marginBottom: '1.5rem' }}
              className="notification-success"
            />
          )}

          <Divider style={{ margin: '1.5rem 0' }} />
          
          <Form
            form={form}
            name="register"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            autoComplete="off"
          >
            {/* Admin Registration Fields */}
            {isAdminRegistration && (
              <div className="form-section">
                <div className="form-section-title">Organization Details</div>
                
                <Form.Item
                  name="userType"
                  label={<span style={{ fontWeight: 600 }}>Account Type</span>}
                  rules={[{ required: true, message: 'Please select account type!' }]}
                  initialValue="authority"
                >
                  <Select 
                    placeholder="Select your role"
                    style={{ borderRadius: '8px' }}
                  >
                    <Option value="authority">
                      <Space>
                        <BankOutlined style={{ color: '#1890ff' }} />
                        <span>Land Authority Officer</span>
                      </Space>
                    </Option>
                    <Option value="officer">
                      <Space>
                        <TeamOutlined style={{ color: '#52c41a' }} />
                        <span>Government Officer</span>
                      </Space>
                    </Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="org"
                  label={<span style={{ fontWeight: 600 }}>Organization</span>}
                  rules={[{ required: true, message: 'Please select organization!' }]}
                >
                  <Select 
                    placeholder="Select your organization"
                    style={{ borderRadius: '8px' }}
                  >
                    <Option value="Org1">
                      <Space>
                        <BankOutlined style={{ color: '#1890ff' }} />
                        <span>Land Authority</span>
                      </Space>
                    </Option>
                    <Option value="Org2">
                      <Space>
                        <TeamOutlined style={{ color: '#52c41a' }} />
                        <span>Government Officers</span>
                      </Space>
                    </Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="userId"
                  label={<span style={{ fontWeight: 600 }}>Employee ID</span>}
                  rules={[
                    { required: true, message: 'Please input your employee ID!' },
                    { pattern: /^[A-Z0-9]{6,12}$/, message: 'Employee ID must be 6-12 alphanumeric characters!' }
                  ]}
                >
                  <Input 
                    prefix={<UserOutlined style={{ color: '#8c8c8c' }} />} 
                    placeholder="Enter your employee ID"
                    style={{ borderRadius: '8px', padding: '12px 16px' }}
                  />
                </Form.Item>
              </div>
            )}

            {/* Personal Information */}
            <div className="form-section">
              <div className="form-section-title">Personal Information</div>
              
              <Form.Item
                name="fullName"
                label={<span style={{ fontWeight: 600 }}>Full Name</span>}
                rules={[
                  { required: true, message: 'Please input your full name!' },
                  { min: 2, message: 'Name must be at least 2 characters!' }
                ]}
              >
                <Input 
                  prefix={<UserOutlined style={{ color: '#8c8c8c' }} />} 
                  placeholder="Enter your full legal name"
                  style={{ borderRadius: '8px', padding: '12px 16px' }}
                />
              </Form.Item>

              <Form.Item
                name="cccd"
                label={<span style={{ fontWeight: 600 }}>Citizen ID (CCCD)</span>}
                rules={[
                  { required: true, message: 'Please input your CCCD!' },
                  { pattern: /^\d{12}$/, message: 'CCCD must be exactly 12 digits!' }
                ]}
              >
                <Input 
                  prefix={<IdcardOutlined style={{ color: '#8c8c8c' }} />} 
                  placeholder="Enter your 12-digit CCCD number"
                  style={{ borderRadius: '8px', padding: '12px 16px' }}
                  maxLength={12}
                />
              </Form.Item>

              <Form.Item
                name="phone"
                label={<span style={{ fontWeight: 600 }}>Phone Number</span>}
                rules={[
                  { required: true, message: 'Please input your phone number!' },
                  { pattern: /^(0[3|5|7|8|9])+([0-9]{8})$/, message: 'Please enter a valid Vietnamese phone number!' }
                ]}
              >
                <Input 
                  prefix={<PhoneOutlined style={{ color: '#8c8c8c' }} />} 
                  placeholder="Enter your phone number (e.g., 0901234567)"
                  style={{ borderRadius: '8px', padding: '12px 16px' }}
                  maxLength={10}
                />
              </Form.Item>
            </div>

            {/* Security Section */}
            <div className="form-section">
              <div className="form-section-title">Security Setup</div>
              
              <Form.Item
                name="password"
                label={<span style={{ fontWeight: 600 }}>Password</span>}
                rules={[
                  { required: true, message: 'Please input your password!' },
                  {
                    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?])[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]{8,}$/,
                    message: 'Password must be at least 8 characters long, include uppercase, lowercase, number, and special character!'
                  }
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined style={{ color: '#8c8c8c' }} />} 
                  placeholder="Create a strong password with special characters"
                  style={{ borderRadius: '8px', padding: '12px 16px' }}
                  onChange={(e) => setPasswordStrength(checkPasswordStrength(e.target.value))}
                />
              </Form.Item>

              {/* Password Strength Indicator */}
              <div style={{ marginBottom: '1rem' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>Password Strength:</Text>
                <Progress 
                  percent={passwordStrength} 
                  size="small" 
                  status={passwordStrength < 50 ? 'exception' : passwordStrength < 75 ? 'normal' : 'success'}
                  showInfo={false}
                  style={{ marginTop: '4px' }}
                />
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  {passwordStrength < 50 ? 'Weak' : passwordStrength < 75 ? 'Medium' : 'Strong'}
                </Text>
                <Text type="secondary" style={{ fontSize: '10px', display: 'block', marginTop: 2 }}>
                  Must include: lowercase, uppercase, number, special character (!@#$%^&*()_+-=[]{}|;':",./{`<>`}?)
                </Text>
              </div>

              <Form.Item
                name="confirmPassword"
                label={<span style={{ fontWeight: 600 }}>Confirm Password</span>}
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Please confirm your password!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Passwords do not match!'));
                    },
                  }),
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined style={{ color: '#8c8c8c' }} />} 
                  placeholder="Confirm your password"
                  style={{ borderRadius: '8px', padding: '12px 16px' }}
                />
              </Form.Item>
            </div>

            <Form.Item style={{ marginBottom: '1rem' }}>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<CheckCircleOutlined />}
                className="btn-primary"
                style={{ 
                  width: '100%', 
                  height: '48px',
                  fontSize: '16px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  background: isAdminRegistration 
                    ? 'linear-gradient(135deg, #52c41a, #389e0d)' 
                    : 'linear-gradient(135deg, #fa8c16, #d46b08)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                }}
              >
                {loading 
                  ? 'Creating Account...' 
                  : isAdminRegistration 
                    ? 'Create Admin Account' 
                    : 'Register as Citizen'
                }
              </Button>
            </Form.Item>

            <Divider style={{ margin: '1.5rem 0' }}>
              <Text type="secondary" style={{ fontSize: '14px' }}>Already registered?</Text>
            </Divider>

            <div style={{ textAlign: 'center' }}>
              <Space direction="vertical" size="small">
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  Already have an account?
                </Text>
                <Link 
                  to="/login" 
                  style={{ 
                    fontSize: '16px', 
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  Sign In to Your Account
                </Link>
              </Space>
            </div>
          </Form>

          {/* Security Notice */}
          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            background: '#f6f8fa',
            borderRadius: '8px',
            border: '1px solid #e1e4e8'
          }}>
            <Space align="start">
              <SafetyOutlined style={{ color: '#52c41a', marginTop: '2px' }} />
              <div>
                <Text strong style={{ fontSize: '14px', color: '#24292e' }}>
                  Secure Registration
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Your information is encrypted and stored securely on the blockchain. 
                  {isAdminRegistration 
                    ? ' Admin accounts require additional verification before activation.'
                    : ' Citizen accounts are activated immediately after phone verification.'
                  }
                </Text>
              </div>
            </Space>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Register;