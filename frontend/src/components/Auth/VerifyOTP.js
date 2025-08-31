import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Space, Divider, Alert } from 'antd';
import { SafetyOutlined, PhoneOutlined, IdcardOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import authService from '../../services/auth';
import useMessage from '../../hooks/useMessage';

const { Title, Text } = Typography;

const VerifyOTP = () => {
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otpExpiry, setOtpExpiry] = useState(300); // 5 minutes TTL
  const location = useLocation();
  const navigate = useNavigate();
  const message = useMessage();
  const [form] = Form.useForm();
  
  const { cccd, phone, message: registrationMessage } = location.state || {};

  useEffect(() => {
    // Start countdown for resend button
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (otpExpiry > 0) {
      const t = setTimeout(() => setOtpExpiry((s) => s - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [otpExpiry]);

  const formatTime = (total) => {
    const m = Math.floor(total / 60).toString().padStart(2, '0');
    const s = Math.floor(total % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const onFinish = async (values) => {
    if (!cccd) {
      message.error('Không tìm thấy CCCD. Vui lòng đăng ký lại.');
      navigate('/register');
      return;
    }
    if (otpExpiry <= 0) {
      message.warning('Mã OTP đã hết hạn. Vui lòng bấm "Gửi lại OTP" để nhận mã mới.');
      return;
    }

    setLoading(true);
    try {
      await authService.verifyOTP(cccd, values.otp);
      message.success('Số điện thoại đã được xác thực thành công! Bây giờ bạn có thể đăng nhập.');
      navigate('/login');
    } catch (error) {
      message.error(error.response?.data?.error || 'Xác thực OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!cccd) {
      message.error('Không tìm thấy CCCD. Vui lòng đăng ký lại.');
      navigate('/register');
      return;
    }

    setResendLoading(true);
    try {
      await authService.resendOTP(cccd);
      message.success('OTP đã được gửi lại thành công!');
      setCountdown(60); // 60 seconds countdown for resend throttle
      setOtpExpiry(300); // reset OTP TTL to 5 minutes
    } catch (error) {
      message.error(error.response?.data?.error || 'Không thể gửi lại OTP');
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
            <Title level={3} style={{ color: '#ff4d4f' }}>Truy cập không hợp lệ</Title>
            <Text type="secondary">Vui lòng đăng ký trước để xác thực tài khoản.</Text>
          </div>
          <Link to="/register">
            <Button type="primary" size="large" style={{ width: '100%' }}>
              Đi đến đăng ký
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="center-content" style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      padding: '2rem'
    }}>
      <div className="fade-in" style={{ width: '100%', maxWidth: '500px' }}>
        <Card 
          className="professional-card"
          style={{ 
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            border: 'none',
            borderRadius: '16px',
            overflow: 'hidden'
          }}
          styles={{ body: { padding: '32px' } }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
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
              <CheckCircleOutlined style={{ fontSize: '2rem', color: 'white' }} />
            </div>
            <Title level={2} style={{ margin: '0 0 0.5rem' }}>
              Xác thực số điện thoại
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              Nhập mã OTP đã được gửi đến số điện thoại của bạn
            </Text>
          </div>

          <Divider />

          {/* User Info */}
          <div style={{ 
            background: '#f6f8fa', 
            padding: '16px', 
            borderRadius: '8px', 
            marginBottom: '1.5rem',
            border: '1px solid #e1e4e8'
          }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Space>
                  <IdcardOutlined style={{ color: '#1890ff' }} />
                  <Text strong>CCCD:</Text>
                  <Text>{cccd}</Text>
                </Space>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Space>
                  <PhoneOutlined style={{ color: '#52c41a' }} />
                  <Text strong>Số điện thoại:</Text>
                  <Text>{phone}</Text>
                </Space>
              </div>
            </Space>
          </div>

          {/* Success Message */}
          {registrationMessage && (
            <Alert
              message="Đăng ký thành công!"
              description={registrationMessage}
              type="success"
              showIcon
              style={{ marginBottom: '1.5rem' }}
            />
          )}

          {/* OTP Form */}
          <Form
            form={form}
            name="verifyOTP"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            autoComplete="off"
          >
            <Form.Item
              name="otp"
              label="Mã OTP"
              rules={[
                { required: true, message: 'Vui lòng nhập mã OTP!' },
                { pattern: /^\d{6}$/, message: 'Mã OTP phải có đúng 6 chữ số!' }
              ]}
            >
              <Input
                placeholder="Nhập mã OTP 6 chữ số"
                style={{ 
                  borderRadius: '8px',
                  padding: '12px 16px',
                  fontSize: '18px',
                  textAlign: 'center',
                  fontFamily: 'inherit'
                }}
                maxLength={6}
                autoFocus
              />
            </Form.Item>

            {/* OTP Expiry Countdown */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '-8px',
              marginBottom: '12px'
            }}>
              <ClockCircleOutlined style={{
                color: otpExpiry <= 30 ? '#ff4d4f' : '#8c8c8c',
                marginRight: 8
              }} />
              <Text type={otpExpiry <= 30 ? 'danger' : 'secondary'} style={{ fontSize: 14 }}>
                {otpExpiry > 0 ? `Mã OTP sẽ hết hạn trong: ${formatTime(otpExpiry)}` : 'Mã OTP đã hết hạn. Vui lòng gửi lại OTP.'}
              </Text>
            </div>

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
                  fontWeight: '600',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #52c41a, #389e0d)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(82, 196, 26, 0.3)'
                }}
                disabled={otpExpiry <= 0}
              >
                {loading ? 'Đang xác thực...' : 'Xác thực OTP'}
              </Button>
            </Form.Item>

            <Divider style={{ margin: '1.5rem 0' }}>
              <Text type="secondary" style={{ fontSize: '14px' }}>Cần hỗ trợ?</Text>
            </Divider>

            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                Không nhận được mã OTP? 
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
                  fontWeight: '600'
                }}
              >
                {countdown > 0 ? `Gửi lại OTP (${countdown}s)` : 'Gửi lại OTP'}
              </Button>
            </div>

            <div style={{ textAlign: 'center' }}>
              <Space direction="vertical" size="small">
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  Đã xác thực rồi?
                </Text>
                <Link 
                  to="/login" 
                  style={{ 
                    fontSize: '16px', 
                    fontWeight: '600',
                    textDecoration: 'none'
                  }}
                >
                  Đi đến đăng nhập
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
                  Xác thực an toàn
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Mã OTP của bạn có hiệu lực trong 5 phút. Vui lòng nhập mã trong khoảng thời gian này để hoàn tất đăng ký.
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