import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Space, Divider, Radio } from 'antd';
import { LockOutlined, SafetyOutlined, HomeOutlined, PhoneOutlined, IdcardOutlined } from '@ant-design/icons';
import { login } from '../../services/auth';
import useMessage from '../../hooks/useMessage';

const { Title, Text } = Typography;

const Login = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState('cccd'); // 'cccd' or 'phone'
  const message = useMessage();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const loginData = { password: values.password };
      if (loginType === 'cccd') {
        loginData.cccd = values.identifier;
      } else {
        loginData.phone = values.identifier;
      }
      if (process.env.NODE_ENV === 'development') {
        // Only log in development
        console.log('Attempting login with:', { ...loginData, password: '[HIDDEN]' });
      }
      const userData = await login(loginData);
      if (process.env.NODE_ENV === 'development') {
        console.log('Login successful:', userData);
      }
      message.success('Login successful!');
      onLogin(userData);
    } catch (error) {
      console.error('Login error details:', error);
      console.error('Error response:', error.response);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;
        
        switch (status) {
          case 401:
            errorMessage = data?.error || 'Invalid credentials. Please check your CCCD/phone and password.';
            break;
          case 403:
            if (data?.error?.includes('locked')) {
              errorMessage = 'Your account has been locked. Please contact administrator.';
            } else if (data?.error?.includes('not verified')) {
              errorMessage = 'Please verify your phone number before logging in.';
            } else {
              errorMessage = data?.error || 'Access denied. Please contact administrator.';
            }
            break;
          case 404:
            errorMessage = 'Account not found. Please check your credentials or register first.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = data?.error || data?.message || `Login failed (Error ${status})`;
        }
      } else if (error.request) {
        // Network error
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        // Other error
        errorMessage = error.message || 'An unexpected error occurred.';
      }
      
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getIdentifierRules = () => {
    if (loginType === 'cccd') {
      return [
        { required: true, message: 'Please input your CCCD!' },
        { pattern: /^\d{12}$/, message: 'CCCD must be exactly 12 digits!' }
      ];
    } else {
      return [
        { required: true, message: 'Please input your phone number!' },
        { pattern: /^(0[3|5|7|8|9])+([0-9]{8})$/, message: 'Please enter a valid Vietnamese phone number!' }
      ];
    }
  };

  const getIdentifierPlaceholder = () => {
    return loginType === 'cccd' ? 'Enter your 12-digit CCCD' : 'Enter your phone number (e.g., 0901234567)';
  };

  const getIdentifierIcon = () => {
    return loginType === 'cccd' ? <IdcardOutlined style={{ color: '#8c8c8c' }} /> : <PhoneOutlined style={{ color: '#8c8c8c' }} />;
  };

  return (
    <div className="center-content" style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '2rem'
    }}>
      <div className="fade-in" style={{ width: '100%', maxWidth: '420px' }}>
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
              background: 'linear-gradient(135deg, #1890ff, #0050b3)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 8px 16px rgba(24, 144, 255, 0.3)'
            }}>
              <HomeOutlined style={{ fontSize: '2rem', color: 'white' }} />
            </div>
            <Title level={2} style={{ margin: '0 0 0.5rem', color: '#1f1f1f' }}>
              Land Registry System
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              Secure Blockchain-Based Land Management
            </Text>
          </div>

          <Divider style={{ margin: '1.5rem 0' }} />

          {/* Login Type Selection */}
          <div style={{ marginBottom: '1.5rem' }}>
            <Text strong style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>
              Login Method
            </Text>
            <Radio.Group 
              value={loginType} 
              onChange={(e) => setLoginType(e.target.value)}
              style={{ width: '100%' }}
            >
              <Radio.Button value="cccd" style={{ width: '50%', textAlign: 'center' }}>
                <Space>
                  <IdcardOutlined />
                  CCCD
                </Space>
              </Radio.Button>
              <Radio.Button value="phone" style={{ width: '50%', textAlign: 'center' }}>
                <Space>
                  <PhoneOutlined />
                  Phone
                </Space>
              </Radio.Button>
            </Radio.Group>
          </div>
          
          <Form
            name="login"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            autoComplete="off"
            className="login-form"
          >
            <Form.Item
              name="identifier"
              label={<span style={{ fontWeight: 600 }}>{loginType === 'cccd' ? 'Citizen ID (CCCD)' : 'Phone Number'}</span>}
              rules={getIdentifierRules()}
            >
              <Input
                prefix={getIdentifierIcon()}
                placeholder={getIdentifierPlaceholder()}
                maxLength={loginType === 'cccd' ? 12 : 10}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span style={{ fontWeight: 600 }}>Password</span>}
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#8c8c8c' }} />}
                placeholder="Enter your password"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: '1rem' }}>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<SafetyOutlined />}
                className="btn-primary"
                style={{ 
                  width: '100%', 
                  height: '48px',
                  fontSize: '16px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #1890ff, #0050b3)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)'
                }}
              >
                {loading ? 'Signing In...' : 'Sign In Securely'}
              </Button>
            </Form.Item>

            <Divider style={{ margin: '1.5rem 0' }}>
              <Text type="secondary" style={{ fontSize: '14px' }}>New to the system?</Text>
            </Divider>

            <div style={{ textAlign: 'center' }}>
              <Space direction="vertical" size="small">
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  Don't have an account?
                </Text>
                <Link 
                  to="/register" 
                  style={{ 
                    fontSize: '16px', 
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  Register for Land Registry Access
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
                  Secure Access
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Your data is protected by blockchain technology and enterprise-grade security.
                </Text>
              </div>
            </Space>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;