import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Typography, 
  Space, 
  Alert,
  Row,
  Col,
  theme,
  Steps,
  Divider
} from 'antd';
import { 
  SafetyOutlined, 
  LockOutlined, 
  KeyOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import authService from '../../services/auth';
import useMessage from '../../hooks/useMessage';

const { Title, Text } = Typography;
const { useToken } = theme;

const ResetPassword = () => {
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [step, setStep] = useState(0); // 0: Nhập OTP và mật khẩu, 1: Thành công
  const [countdown, setCountdown] = useState(0);
  const [form] = Form.useForm();
  const message = useMessage();
  const navigate = useNavigate();
  const location = useLocation();
  const { token: themeToken } = useToken();

  // Lấy thông tin user từ navigation state
  const userInfo = location.state?.userInfo;
  const fromForgotPassword = location.state?.fromForgotPassword;
  const otpVerified = location.state?.otpVerified;
  const verifiedOtp = location.state?.verifiedOtp;

  useEffect(() => {
    // Nếu không có thông tin user, redirect về forgot password
    if (!userInfo || !fromForgotPassword) {
      navigate('/forgot-password', { replace: true });
      return;
    }

    // Nếu OTP đã được verify, tự động fill vào form
    if (otpVerified && verifiedOtp) {
      form.setFieldsValue({
        otp: verifiedOtp
      });
    }

    // Bắt đầu countdown cho resend OTP (60 giây)
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [userInfo, fromForgotPassword, otpVerified, verifiedOtp, navigate, form]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Đảm bảo có OTP - hoặc từ verify trước đó hoặc từ form
      const otp = otpVerified ? verifiedOtp : values.otp;
      if (!otp) {
        throw new Error('Thiếu mã OTP');
      }

      const resetData = {
        cccd: userInfo.cccd || '',  // CCCD nếu có
        otp: otp,
        newPassword: values.newPassword
      };

      // Nếu không có CCCD (login bằng phone) thì cần gửi kèm phone
      if (!userInfo.cccd && userInfo.phone) {
        resetData.phone = userInfo.phone;
      }

      await authService.resetPassword(resetData.cccd, resetData.otp, resetData.newPassword);
      
      setStep(1);
      message.success('Đặt lại mật khẩu thành công!');
    } catch (error) {
      console.error('Reset password error:', error);
      
      let errorMessage = 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.';
      
      if (error.response) {
        const { status, data } = error.response;
        switch (status) {
          case 400:
            if (data?.error?.includes('OTP')) {
              errorMessage = 'Mã OTP không đúng hoặc đã hết hạn. Vui lòng kiểm tra lại.';
            } else if (data?.error?.includes('password')) {
              errorMessage = 'Mật khẩu không hợp lệ. Vui lòng chọn mật khẩu mạnh hơn.';
            } else {
              errorMessage = data?.error || errorMessage;
            }
            break;
          case 404:
            errorMessage = 'Không tìm thấy tài khoản. Vui lòng thử lại từ đầu.';
            break;
          default:
            errorMessage = data?.error || errorMessage;
        }
      }
      
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setResendLoading(true);
    try {
      const requestData = {
        cccd: userInfo.cccd || '',
        phone: userInfo.phone
      };

      await authService.forgotPassword(requestData.cccd, requestData.phone);
      
      message.success('OTP mới đã được gửi đến số điện thoại của bạn');
      
      // Restart countdown
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error) {
      message.error('Gửi lại OTP thất bại. Vui lòng thử lại.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigate('/login', { replace: true });
  };

  // Màn hình thành công
  if (step === 1) {
    return (
      <div style={{ 
        background: `linear-gradient(135deg, ${themeToken.colorPrimary} 0%, ${themeToken.colorPrimaryBg} 100%)`,
        minHeight: '100vh',
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Row justify="center" align="middle" style={{ width: '100%' }}>
          <Col xs={24} sm={20} md={16} lg={12} xl={8}>
            <Card 
              style={{ 
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                border: 'none',
                borderRadius: '16px',
                overflow: 'hidden'
              }}
              styles={{ body: { padding: '32px' } }}
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
                  background: `linear-gradient(135deg, ${themeToken.colorSuccess}, ${themeToken.colorSuccessHover})`,
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  boxShadow: `0 8px 16px ${themeToken.colorSuccess}40`
                }}>
                  <CheckCircleOutlined style={{ fontSize: '2rem', color: 'white' }} />
                </div>
                <Title level={2} style={{ margin: '0 0 0.5rem', color: themeToken.colorText }}>
                  Đặt lại mật khẩu thành công!
                </Title>
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  Mật khẩu của bạn đã được cập nhật thành công
                </Text>
              </div>

              {/* Success Notice */}
              <Alert
                message="Hoàn tất"
                description="Bạn có thể sử dụng mật khẩu mới để đăng nhập vào hệ thống."
                type="success"
                showIcon
                style={{ marginBottom: '2rem' }}
              />

              {/* Action Button */}
              <div style={{ textAlign: 'center' }}>
                <Button 
                  type="primary" 
                  size="large"
                  icon={<ArrowLeftOutlined />}
                  onClick={handleGoToLogin}
                  style={{ 
                    width: '100%',
                    height: '48px',
                    fontSize: '16px',
                    fontWeight: '600',
                    borderRadius: '8px',
                    background: `linear-gradient(135deg, ${themeToken.colorPrimary}, ${themeToken.colorPrimaryHover})`,
                    border: 'none',
                    boxShadow: `0 4px 12px ${themeToken.colorPrimary}30`
                  }}
                >
                  Đăng nhập ngay
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  if (!userInfo) {
    return null; // Component sẽ redirect trong useEffect
  }

  return (
    <div style={{ 
      background: `linear-gradient(135deg, ${themeToken.colorPrimary} 0%, ${themeToken.colorPrimaryBg} 100%)`,
      minHeight: '100vh',
      padding: '2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Row justify="center" align="middle" style={{ width: '100%' }}>
        <Col xs={24} sm={20} md={16} lg={12} xl={8}>
          <Card 
            style={{ 
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              border: 'none',
              borderRadius: '16px',
              overflow: 'hidden'
            }}
            styles={{ body: { padding: '32px' } }}
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
                background: `linear-gradient(135deg, ${themeToken.colorPrimary}, ${themeToken.colorPrimaryHover})`,
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                boxShadow: `0 8px 16px ${themeToken.colorPrimary}40`
              }}>
                <KeyOutlined style={{ fontSize: '2rem', color: 'white' }} />
              </div>
              <Title level={2} style={{ margin: '0 0 0.5rem', color: themeToken.colorText }}>
                Đặt lại mật khẩu
              </Title>
              <Text type="secondary" style={{ fontSize: '16px' }}>
                Nhập mã OTP và mật khẩu mới để hoàn tất
              </Text>
            </div>

            {/* Progress Steps */}
            <Steps
              current={2}
              size="small"
              style={{ marginBottom: '2rem' }}
              items={[
                { title: 'Xác thực thông tin', status: 'finish' },
                { title: 'Nhận OTP', status: 'finish' },
                { title: 'Đặt lại mật khẩu', status: 'process' }
              ]}
            />

            {/* OTP Verified Alert */}
            {otpVerified && verifiedOtp && (
              <Alert
                message="OTP đã được xác thực"
                description="Mã OTP đã được xác thực thành công từ bước trước. Vui lòng nhập mật khẩu mới để hoàn tất."
                type="success"
                showIcon
                style={{ marginBottom: '1.5rem' }}
              />
            )}

            {/* Info Alert */}
            {!otpVerified && (
              <Alert
                message="Thông tin xác thực"
                description={
                  <div>
                    <p>Mã OTP đã được gửi đến: <strong>{userInfo.phone}</strong></p>
                    <p>Vui lòng kiểm tra tin nhắn và nhập mã OTP cùng với mật khẩu mới bên dưới.</p>
                  </div>
                }
                type="info"
                showIcon
                style={{ marginBottom: '1.5rem' }}
              />
            )}
            
            <Form
              form={form}
              name="resetPassword"
              onFinish={onFinish}
              layout="vertical"
              size="large"
              autoComplete="off"
              requiredMark={false}
            >
              {/* Chỉ hiển thị field OTP nếu chưa được xác thực */}
              {!otpVerified && (
                <Form.Item
                  name="otp"
                  label={
                    <Space>
                      <SafetyOutlined />
                      <span style={{ fontWeight: 600 }}>Mã OTP</span>
                    </Space>
                  }
                  rules={[
                    { required: true, message: 'Vui lòng nhập mã OTP!' },
                    { len: 6, message: 'Mã OTP phải có 6 chữ số!' },
                    { pattern: /^\d{6}$/, message: 'Mã OTP chỉ chứa số!' }
                  ]}
                >
                  <Input
                    prefix={<SafetyOutlined style={{ color: themeToken.colorTextSecondary }} />}
                    placeholder="Nhập mã OTP 6 chữ số"
                    maxLength={6}
                    style={{ 
                      height: '48px',
                      fontSize: '18px',
                      textAlign: 'center',
                      letterSpacing: '2px'
                    }}
                  />
                </Form.Item>
              )}

              <Divider />

              <Form.Item
                name="newPassword"
                label={
                  <Space>
                    <LockOutlined />
                    <span style={{ fontWeight: 600 }}>Mật khẩu mới</span>
                  </Space>
                }
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                  { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự!' },
                  {
                    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                    message: 'Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa, 1 số và 1 ký tự đặc biệt'
                  }
                ]}
                hasFeedback
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: themeToken.colorTextSecondary }} />}
                  placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
                  style={{ height: '48px' }}
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label={
                  <Space>
                    <SafetyOutlined />
                    <span style={{ fontWeight: 600 }}>Xác nhận mật khẩu mới</span>
                  </Space>
                }
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                    },
                  })
                ]}
                hasFeedback
              >
                <Input.Password
                  prefix={<SafetyOutlined style={{ color: themeToken.colorTextSecondary }} />}
                  placeholder="Nhập lại mật khẩu mới"
                  style={{ height: '48px' }}
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
                    fontWeight: '600',
                    borderRadius: '8px',
                    background: `linear-gradient(135deg, ${themeToken.colorPrimary}, ${themeToken.colorPrimaryHover})`,
                    border: 'none',
                    boxShadow: `0 4px 12px ${themeToken.colorPrimary}30`
                  }}
                >
                  {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                </Button>
              </Form.Item>

              {/* Resend OTP */}
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <Space direction="vertical" size="small">
                  <Text type="secondary" style={{ fontSize: '14px' }}>
                    Chưa nhận được OTP?
                  </Text>
                  <Button 
                    type="link" 
                    onClick={handleResendOTP}
                    loading={resendLoading}
                    disabled={countdown > 0}
                    icon={<ReloadOutlined />}
                    style={{ 
                      fontSize: '14px',
                      padding: 0,
                      height: 'auto'
                    }}
                  >
                    {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại OTP'}
                  </Button>
                </Space>
              </div>

              <div style={{ textAlign: 'center' }}>
                <Link 
                  to="/login" 
                  style={{ 
                    fontSize: '14px', 
                    textDecoration: 'none',
                    color: themeToken.colorTextSecondary
                  }}
                >
                  <ArrowLeftOutlined style={{ marginRight: '8px' }} />
                  Quay lại đăng nhập
                </Link>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ResetPassword;
