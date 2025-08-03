import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Space, Divider, Alert } from 'antd';
import { SafetyOutlined, PhoneOutlined, IdcardOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { verifyOTP, resendOTP } from '../../services/auth';
import useMessage from '../../hooks/useMessage';

const { Title, Text } = Typography;

const VerifyOTP = () => {
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const message = useMessage();
  
  const { cccd, phone, message: registrationMessage } = location.state || {};

  useEffect(() => {
    // Start countdown for resend button
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const onFinish = async (values) => {
    if (!cccd) {
      message.error('CCCD not found. Please register again.');
      navigate('/register');
      return;
    }

    setLoading(true);
    try {
      await verifyOTP({ cccd, otp: values.otp });
      message.success('Phone number verified successfully! You can now login.');
      navigate('/login');
    } catch (error) {
      message.error(error.response?.data?.error || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!cccd) {
      message.error('CCCD not found. Please register again.');
      navigate('/register');
      return;
    }

    setResendLoading(true);
    try {
      await resendOTP({ cccd });
      message.success('OTP resent successfully!');
      setCountdown(60); // 60 seconds countdown
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  if (!cccd || !phone) {
    return (
      <div className="center-content" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        padding: '2rem'
      }}>
        <Card style={{ 
          width: '100%', 
          maxWidth: '420px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          borderRadius: '16px'
        }}>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #ff4d4f, #cf1322)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 8px 16px rgba(255, 77, 79, 0.3)'
            }}>
              <ClockCircleOutlined style={{ fontSize: '2rem', color: 'white' }} />
            </div>
            <Title level={3} style={{ color: '#ff4d4f' }}>Invalid Access</Title>
            <Text type="secondary">Please register first to verify your account.</Text>
          </div>
          <Link to="/register">
            <Button type="primary" size="large" style={{ width: '100%' }}>
              Go to Register
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Mask phone number for display
  const maskedPhone = phone ? phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1***$3') : '';

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
              background: 'linear-gradient(135deg, #52c41a, #389e0d)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 8px 16px rgba(82, 196, 26, 0.3)'
            }}>
              <PhoneOutlined style={{ fontSize: '2rem', color: 'white' }} />
            </div>
            <Title level={2} style={{ margin: '0 0 0.5rem', color: '#1f1f1f' }}>
              Verify Phone Number
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              Enter the 6-digit OTP sent to your phone
            </Text>
          </div>

          {/* User Info Alert */}
          <Alert
            message="Verification Required"
            description={
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div>
                  <Text strong>CCCD: </Text>
                  <Text code>{cccd}</Text>
                </div>
                <div>
                  <Text strong>Phone: </Text>
                  <Text code>{maskedPhone}</Text>
                </div>
                {registrationMessage && (
                  <div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {registrationMessage}
                    </Text>
                  </div>
                )}
              </Space>
            }
            type="info"
            showIcon
            icon={<IdcardOutlined />}
            style={{ marginBottom: '1.5rem' }}
          />

          <Divider style={{ margin: '1.5rem 0' }} />
          
          <Form
            name="verifyOTP"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            autoComplete="off"
          >
            <Form.Item
              name="otp"
              label={<span style={{ fontWeight: 600 }}>OTP Code</span>}
              rules={[
                { required: true, message: 'Please input the OTP!' },
                { pattern: /^\d{6}$/, message: 'OTP must be exactly 6 digits!' }
              ]}
            >
              <Input 
                prefix={<SafetyOutlined style={{ color: '#8c8c8c' }} />} 
                placeholder="Enter 6-digit OTP"
                style={{ 
                  borderRadius: '8px',
                  padding: '12px 16px',
                  fontSize: '18px',
                  textAlign: 'center',
                  letterSpacing: '0.5em'
                }}
                maxLength={6}
                autoFocus
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: '1rem' }}>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<CheckCircleOutlined />}
                style={{ 
                  width: '100%', 
                  height: '48px',
                  fontSize: '16px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #52c41a, #389e0d)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(82, 196, 26, 0.3)'
                }}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Button>
            </Form.Item>

            <Divider style={{ margin: '1.5rem 0' }}>
              <Text type="secondary" style={{ fontSize: '14px' }}>Need help?</Text>
            </Divider>

            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                Didn't receive the OTP? 
              </Text>
              <br />
              <Button 
                type="link" 
                onClick={handleResendOTP}
                loading={resendLoading}
                disabled={countdown > 0}
                style={{ 
                  padding: '4px 0',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                {countdown > 0 ? `Resend OTP (${countdown}s)` : 'Resend OTP'}
              </Button>
            </div>

            <div style={{ textAlign: 'center' }}>
              <Space direction="vertical" size="small">
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  Already verified?
                </Text>
                <Link 
                  to="/login" 
                  style={{ 
                    fontSize: '16px', 
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  Go to Login
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
                  Secure Verification
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Your OTP is valid for 5 minutes. Please enter it within this time frame to complete your registration.
                </Text>
              </div>
            </Space>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VerifyOTP;