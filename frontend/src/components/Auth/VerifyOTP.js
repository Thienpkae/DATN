import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { SafetyOutlined } from '@ant-design/icons';
import { verifyOTP, resendOTP } from '../../services/auth';

const { Title, Text } = Typography;

const VerifyOTP = () => {
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const userId = location.state?.userId;

  const onFinish = async (values) => {
    if (!userId) {
      message.error('User ID not found. Please register again.');
      navigate('/register');
      return;
    }

    setLoading(true);
    try {
      await verifyOTP({ userId, otp: values.otp });
      message.success('Phone number verified successfully! You can now login.');
      navigate('/login');
    } catch (error) {
      message.error(error.response?.data?.error || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!userId) {
      message.error('User ID not found. Please register again.');
      navigate('/register');
      return;
    }

    setResendLoading(true);
    try {
      await resendOTP(userId);
      message.success('OTP resent successfully!');
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  if (!userId) {
    return (
      <div className="center-content" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Card style={{ width: 400, textAlign: 'center' }}>
          <Title level={3}>Invalid Access</Title>
          <Text>Please register first to verify your account.</Text>
          <div style={{ marginTop: 20 }}>
            <Link to="/register">
              <Button type="primary">Go to Register</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="center-content" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2}>Verify Phone Number</Title>
          <Text type="secondary">Enter the OTP sent to your phone</Text>
          <br />
          <Text type="secondary">User: {userId}</Text>
        </div>
        
        <Form
          name="verifyOTP"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="otp"
            label="OTP Code"
            rules={[
              { required: true, message: 'Please input the OTP!' },
              { len: 6, message: 'OTP must be 6 digits!' }
            ]}
          >
            <Input 
              prefix={<SafetyOutlined />} 
              placeholder="Enter 6-digit OTP"
              maxLength={6}
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              style={{ width: '100%', height: 40 }}
            >
              Verify OTP
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">Didn't receive OTP? </Text>
            <Button 
              type="link" 
              onClick={handleResendOTP}
              loading={resendLoading}
              style={{ padding: 0 }}
            >
              Resend OTP
            </Button>
          </div>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link to="/login">Back to Login</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default VerifyOTP;
