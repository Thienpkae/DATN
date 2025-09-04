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
  Steps
} from 'antd';
import { 
  SafetyOutlined, 
  LockOutlined, 
  KeyOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import authService from '../../services/auth';
import useMessage from '../../hooks/useMessage';

const { Title, Text } = Typography;
const { useToken } = theme;

const ResetPassword = () => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); // 0: Nhập mật khẩu, 1: Thành công
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
    // Nếu không có thông tin user hoặc OTP chưa được verify, redirect về forgot password
    if (!userInfo || !fromForgotPassword || !otpVerified || !verifiedOtp) {
      navigate('/forgot-password', { replace: true });
      return;
    }
  }, [userInfo, fromForgotPassword, otpVerified, verifiedOtp, navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Sử dụng OTP đã được verify từ bước trước
      if (!verifiedOtp) {
        message.error('Không tìm thấy mã OTP. Vui lòng thử lại từ đầu.');
        navigate('/forgot-password', { replace: true });
        return;
      }

      const resetData = {
        cccd: userInfo.cccd || '',  // CCCD nếu có
        otp: verifiedOtp,  // Sử dụng OTP đã verify
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
                Nhập mật khẩu mới để hoàn tất quá trình đặt lại mật khẩu
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

            {/* Success Alert */}
            <Alert
              message="OTP đã được xác thực"
              description="Mã OTP đã được xác thực thành công. Vui lòng nhập mật khẩu mới để hoàn tất quá trình đặt lại mật khẩu."
              type="success"
              showIcon
              style={{ marginBottom: '1.5rem' }}
            />
            
            <Form
              form={form}
              name="resetPassword"
              onFinish={onFinish}
              layout="vertical"
              size="large"
              autoComplete="off"
              requiredMark={false}
            >

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
