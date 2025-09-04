import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Typography, 
  Space, 
  Divider, 
  Radio, 
  Alert,
  Row,
  Col,
  theme
} from 'antd';
import { 
  LockOutlined, 
  SafetyOutlined, 
  HomeOutlined, 
  PhoneOutlined, 
  IdcardOutlined,
  UserOutlined,
  KeyOutlined
} from '@ant-design/icons';
import authService from '../../services/auth';
import useMessage from '../../hooks/useMessage';

const { Title, Text } = Typography;
const { useToken } = theme;

const Login = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState('cccd'); // 'cccd' or 'phone'
  const [form] = Form.useForm();
  const message = useMessage();
  const { token: themeToken } = useToken();

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
        console.log('Đang thử đăng nhập với:', { ...loginData, password: '[ẨN]' });
      }
      
      const userData = await authService.login(loginData);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Đăng nhập thành công:', userData);
      }
      
      message.success('Đăng nhập thành công!');
      onLogin(userData);
    } catch (error) {
      console.error('Chi tiết lỗi đăng nhập:', error);
      console.error('Phản hồi lỗi:', error.response);
      
      let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại.';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        switch (status) {
          case 401:
            errorMessage = data?.error || 'Thông tin đăng nhập không đúng. Vui lòng kiểm tra CCCD/số điện thoại và mật khẩu.';
            break;
          case 403:
            if (data?.error?.includes('locked')) {
              errorMessage = 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.';
            } else if (data?.error?.includes('not verified')) {
              errorMessage = 'Vui lòng xác thực số điện thoại trước khi đăng nhập.';
            } else {
              errorMessage = data?.error || 'Truy cập bị từ chối. Vui lòng liên hệ quản trị viên.';
            }
            break;
          case 404:
            errorMessage = 'Tài khoản không tồn tại. Vui lòng kiểm tra thông tin hoặc đăng ký trước.';
            break;
          case 500:
            errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
            break;
          default:
            errorMessage = data?.error || data?.message || `Đăng nhập thất bại (Lỗi ${status})`;
        }
      } else if (error.request) {
        errorMessage = 'Lỗi mạng. Vui lòng kiểm tra kết nối và thử lại.';
      } else {
        errorMessage = error.message || 'Đã xảy ra lỗi không mong muốn.';
      }
      
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getIdentifierRules = () => {
    if (loginType === 'cccd') {
      return [
        { required: true, message: 'Vui lòng nhập CCCD!' },
        { pattern: /^\d{12}$/, message: 'CCCD phải có đúng 12 chữ số!' }
      ];
    } else {
      return [
        { required: true, message: 'Vui lòng nhập số điện thoại!' },
        { pattern: /^(0[3|5|7|8|9])+([0-9]{8})$/, message: 'Vui lòng nhập số điện thoại Việt Nam hợp lệ!' }
      ];
    }
  };

  const getIdentifierPlaceholder = () => {
    return loginType === 'cccd' ? 'Nhập CCCD 12 chữ số' : 'Nhập số điện thoại (ví dụ: 0901234567)';
  };

  const getIdentifierIcon = () => {
    return loginType === 'cccd' ? 
      <IdcardOutlined style={{ color: themeToken.colorTextSecondary }} /> : 
      <PhoneOutlined style={{ color: themeToken.colorTextSecondary }} />;
  };

  const getIdentifierLabel = () => {
    return loginType === 'cccd' ? 'CCCD' : 'Số điện thoại';
  };

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
                <HomeOutlined style={{ fontSize: '2rem', color: 'white' }} />
              </div>
              <Title level={2} style={{ margin: '0 0 0.5rem', color: themeToken.colorText }}>
                Hệ thống quản lý đất đai
              </Title>
              <Text type="secondary" style={{ fontSize: '16px' }}>
                Quản lý đất đai an toàn dựa trên blockchain
              </Text>
            </div>

            <Divider style={{ margin: '1.5rem 0' }} />

            {/* Security Notice */}
            <Alert
              message="Truy cập an toàn"
              description="Dữ liệu của bạn được bảo vệ bởi công nghệ blockchain."
              type="info"
              showIcon
              icon={<SafetyOutlined />}
              style={{ marginBottom: '1.5rem' }}
            />

            {/* Login Type Selection */}
            <div style={{ marginBottom: '1.5rem' }}>
              <Text strong style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>
                Phương thức đăng nhập
              </Text>
              <Radio.Group 
                value={loginType} 
                onChange={(e) => setLoginType(e.target.value)}
                style={{ width: '100%' }}
                buttonStyle="solid"
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
                    Số điện thoại
                  </Space>
                </Radio.Button>
              </Radio.Group>
            </div>
            
            <Form
              form={form}
              name="login"
              onFinish={onFinish}
              layout="vertical"
              size="large"
              autoComplete="off"
              requiredMark={false}
            >
              <Form.Item
                name="identifier"
                label={
                  <Space>
                    <UserOutlined />
                    <span style={{ fontWeight: 600 }}>{getIdentifierLabel()}</span>
                  </Space>
                }
                rules={getIdentifierRules()}
              >
                <Input
                  prefix={getIdentifierIcon()}
                  placeholder={getIdentifierPlaceholder()}
                  maxLength={loginType === 'cccd' ? 12 : 10}
                  style={{ height: '48px' }}
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={
                  <Space>
                    <KeyOutlined />
                    <span style={{ fontWeight: 600 }}>Mật khẩu</span>
                  </Space>
                }
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: themeToken.colorTextSecondary }} />}
                  placeholder="Nhập mật khẩu của bạn"
                  style={{ height: '48px' }}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: '1rem' }}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  icon={<SafetyOutlined />}
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
                  {loading ? 'Đang đăng nhập...' : 'Đăng nhập an toàn'}
                </Button>
              </Form.Item>

              {/* Forgot Password Link */}
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <Link 
                  to="/forgot-password" 
                  style={{ 
                    fontSize: '14px', 
                    fontWeight: '500',
                    textDecoration: 'none',
                    color: themeToken.colorPrimary
                  }}
                >
                  <KeyOutlined style={{ marginRight: '8px' }} />
                  Quên mật khẩu?
                </Link>
              </div>

              <Divider style={{ margin: '1.5rem 0' }}>
                <Text type="secondary" style={{ fontSize: '14px' }}>Mới với hệ thống?</Text>
              </Divider>

              <div style={{ textAlign: 'center' }}>
                <Space direction="vertical" size="small">
                  <Link 
                    to="/register" 
                    style={{ 
                      fontSize: '16px', 
                      fontWeight: '600',
                      textDecoration: 'none',
                      color: themeToken.colorPrimary
                    }}
                  >
                    Đăng ký để truy cập hệ thống quản lý đất đai
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

export default Login;