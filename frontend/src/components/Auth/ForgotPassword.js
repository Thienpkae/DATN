import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Steps
} from 'antd';
import { 
  SafetyOutlined, 
  PhoneOutlined, 
  KeyOutlined,
  MailOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import authService from '../../services/auth';
import useMessage from '../../hooks/useMessage';

const { Title, Text } = Typography;
const { useToken } = theme;

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); // 0: Nhập SĐT, 1: Thông báo gửi OTP, 2: Nhập OTP
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [userInfo, setUserInfo] = useState({});
  const [form] = Form.useForm();
  const [otpForm] = Form.useForm();
  const message = useMessage();
  const navigate = useNavigate();
  const { token: themeToken } = useToken();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const result = await authService.forgotPassword('', values.phone);
      
      setUserInfo({
        phone: result.phone,
        cccd: result.cccd
      });
      
      setStep(1);
      message.success('OTP đã được gửi đến số điện thoại của bạn');
    } catch (error) {
      console.error('Forgot password error:', error);
      
      let errorMessage = 'Có lỗi xảy ra. Vui lòng thử lại.';
      
      if (error.response) {
        const { status, data } = error.response;
        switch (status) {
          case 404:
            errorMessage = 'Không tìm thấy tài khoản với số điện thoại này. Vui lòng kiểm tra lại.';
            break;
          case 400:
            errorMessage = data?.error || 'Số điện thoại không hợp lệ. Vui lòng kiểm tra lại.';
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

  const handleContinueToOTP = () => {
    setStep(2); // Chuyển đến step nhập OTP
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    try {
      // Gửi lại OTP với số điện thoại đã lưu
      await authService.forgotPassword('', userInfo.phone);
      message.success('OTP đã được gửi lại đến số điện thoại của bạn');
      // Clear OTP form để user nhập mã mới
      otpForm.resetFields();
    } catch (error) {
      console.error('Resend OTP error:', error);
      
      let errorMessage = 'Có lỗi khi gửi lại OTP. Vui lòng thử lại.';
      
      if (error.response) {
        const { data } = error.response;
        errorMessage = data?.error || errorMessage;
      }
      
      message.error(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyOTP = async (values) => {
    setOtpLoading(true);
    try {
      // Use special endpoint for forgot password OTP verification
      await authService.verifyOTPForForgotPassword(userInfo.cccd, values.otp);
      message.success('Xác thực OTP thành công!');
      
      // Điều hướng đến trang reset password với thông tin user và OTP đã verify
      navigate('/reset-password', { 
        state: { 
          userInfo,
          fromForgotPassword: true,
          otpVerified: true,
          verifiedOtp: values.otp // Truyền OTP đã verify để tự động fill
        } 
      });
    } catch (error) {
      console.error('OTP verification error:', error);
      
      let errorMessage = 'Mã OTP không đúng. Vui lòng thử lại.';
      
      if (error.response) {
        const { data } = error.response;
        errorMessage = data?.error || errorMessage;
      }
      
      message.error(errorMessage);
    } finally {
      setOtpLoading(false);
    }
  };



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
                  <MailOutlined style={{ fontSize: '2rem', color: 'white' }} />
                </div>
                <Title level={2} style={{ margin: '0 0 0.5rem', color: themeToken.colorText }}>
                  OTP đã được gửi
                </Title>
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  Chúng tôi đã gửi mã xác thực đến số điện thoại của bạn
                </Text>
              </div>

              {/* Success Notice */}
              <Alert
                message="Kiểm tra tin nhắn"
                description={
                  <div>
                    <p>Mã OTP đã được gửi đến số điện thoại: <strong>{userInfo.phone}</strong></p>
                    <p>Vui lòng kiểm tra tin nhắn và sử dụng mã OTP để đặt lại mật khẩu.</p>
                  </div>
                }
                type="success"
                showIcon
                style={{ marginBottom: '2rem' }}
              />

              {/* Action Buttons */}
              <div style={{ textAlign: 'center' }}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Button 
                    type="primary" 
                    size="large"
                    icon={<KeyOutlined />}
                    onClick={handleContinueToOTP}
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
                    Nhập mã OTP
                  </Button>
                  
                  <Link to="/login">
                    <Button 
                      icon={<ArrowLeftOutlined />}
                      style={{ 
                        width: '100%',
                        height: '48px',
                        fontSize: '16px'
                      }}
                    >
                      Quay lại đăng nhập
                    </Button>
                  </Link>
                </Space>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  if (step === 2) {
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
                  <SafetyOutlined style={{ fontSize: '2rem', color: 'white' }} />
                </div>
                <Title level={2} style={{ margin: '0 0 0.5rem', color: themeToken.colorText }}>
                  Nhập mã OTP
                </Title>
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  Vui lòng nhập mã OTP đã được gửi đến {userInfo.phone}
                </Text>
              </div>

              {/* Progress Steps */}
              <Steps
                current={1}
                size="small"
                style={{ marginBottom: '2rem' }}
                items={[
                  { title: 'Xác thực SĐT' },
                  { title: 'Nhập OTP' },
                  { title: 'Đặt lại mật khẩu' }
                ]}
              />

              <Form
                form={otpForm}
                name="verifyOTP"
                onFinish={handleVerifyOTP}
                layout="vertical"
                size="large"
                autoComplete="off"
                requiredMark={false}
              >
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
                    { pattern: /^\d{6}$/, message: 'OTP phải có đúng 6 chữ số!' }
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
                      letterSpacing: '0.5em'
                    }}
                  />
                </Form.Item>

                <Form.Item style={{ marginBottom: '1rem' }}>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={otpLoading}
                    icon={<KeyOutlined />}
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
                    {otpLoading ? 'Đang xác thực...' : 'Xác thực và tiếp tục'}
                  </Button>
                </Form.Item>

                <div style={{ textAlign: 'center' }}>
                  <Space direction="vertical" size="small">
                    <Text type="secondary" style={{ fontSize: '14px' }}>
                      Chưa nhận được mã?
                    </Text>
                    <Button 
                      type="link" 
                      loading={resendLoading}
                      onClick={handleResendOTP}
                      style={{ 
                        fontSize: '16px', 
                        fontWeight: '600',
                        color: themeToken.colorPrimary
                      }}
                    >
                      {resendLoading ? 'Đang gửi...' : 'Gửi lại OTP'}
                    </Button>
                    <br />
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
                  </Space>
                </div>
              </Form>
            </Card>
          </Col>
        </Row>
      </div>
    );
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
                background: `linear-gradient(135deg, ${themeToken.colorWarning}, ${themeToken.colorWarningHover})`,
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                boxShadow: `0 8px 16px ${themeToken.colorWarning}40`
              }}>
                <KeyOutlined style={{ fontSize: '2rem', color: 'white' }} />
              </div>
              <Title level={2} style={{ margin: '0 0 0.5rem', color: themeToken.colorText }}>
                Quên mật khẩu
              </Title>
              <Text type="secondary" style={{ fontSize: '16px' }}>
                Nhập thông tin tài khoản để lấy lại mật khẩu
              </Text>
            </div>

            {/* Progress Steps */}
            <Steps
              current={0}
              size="small"
              style={{ marginBottom: '2rem' }}
              items={[
                { title: 'Xác thực SĐT' },
                { title: 'Nhập OTP' },
                { title: 'Đặt lại mật khẩu' }
              ]}
            />

            {/* Security Notice */}
            <Alert
              message="Bảo mật thông tin"
              description="Vui lòng nhập số điện thoại đã đăng ký để nhận mã OTP."
              type="info"
              showIcon
              icon={<SafetyOutlined />}
              style={{ marginBottom: '1.5rem' }}
            />
            
            <Form
              form={form}
              name="forgotPassword"
              onFinish={onFinish}
              layout="vertical"
              size="large"
              autoComplete="off"
              requiredMark={false}
            >
              <Form.Item
                name="phone"
                label={
                  <Space>
                    <PhoneOutlined />
                    <span style={{ fontWeight: 600 }}>Số điện thoại</span>
                  </Space>
                }
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại!' },
                  { pattern: /^(0[3|5|7|8|9])+([0-9]{8})$/, message: 'Vui lòng nhập số điện thoại Việt Nam hợp lệ!' }
                ]}
              >
                <Input
                  prefix={<PhoneOutlined style={{ color: themeToken.colorTextSecondary }} />}
                  placeholder="Nhập số điện thoại (ví dụ: 0901234567)"
                  maxLength={10}
                  style={{ height: '48px' }}
                />
              </Form.Item>



              <Form.Item style={{ marginBottom: '1rem' }}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  icon={<MailOutlined />}
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
                  {loading ? 'Đang gửi OTP...' : 'Gửi OTP'}
                </Button>
              </Form.Item>

              <div style={{ textAlign: 'center' }}>
                <Space direction="vertical" size="small">
                  <Text type="secondary" style={{ fontSize: '14px' }}>
                    Đã nhớ mật khẩu?
                  </Text>
                  <Link 
                    to="/login" 
                    style={{ 
                      fontSize: '16px', 
                      fontWeight: '600',
                      textDecoration: 'none',
                      color: themeToken.colorPrimary
                    }}
                  >
                    <ArrowLeftOutlined style={{ marginRight: '8px' }} />
                    Quay lại đăng nhập
                  </Link>
                </Space>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ForgotPassword;
