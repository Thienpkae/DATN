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
import authService from '../../services/auth';
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
        const result = await authService.register(citizenData);
        message.success('Đăng ký thành công! Vui lòng xác thực số điện thoại.');
        navigate('/verify-otp', { 
          state: { 
            cccd: values.cccd, 
            phone: values.phone,
            message: result.message 
          } 
        });
      } else {
        // Admin registration for org1 and org2 users
        await authService.register(values);
        message.success('Tài khoản đã được tạo thành công! Cần sự chấp thuận của quản trị viên.');
        navigate('/login');
      }
    } catch (error) {
      // Extract backend message regardless of our api error wrapper
      const backendMsg = error?.originalError?.response?.data?.error
        || error?.response?.data?.error
        || error?.response?.data?.message
        || error?.message
        || 'Đăng ký thất bại';

      // Map common backend errors to field-level messages
      const msg = String(backendMsg || '').toLowerCase();
      if (msg.includes('cccd') && (msg.includes('exist') || msg.includes('tồn tại'))) {
        form.setFields([{ name: 'cccd', errors: ['CCCD đã tồn tại'] }]);
        message.error('CCCD đã tồn tại');
      } else if ((msg.includes('phone') || msg.includes('điện thoại')) && (msg.includes('exist') || msg.includes('tồn tại'))) {
        form.setFields([{ name: 'phone', errors: ['Số điện thoại đã tồn tại'] }]);
        message.error('Số điện thoại đã tồn tại');
      } else if (msg.includes('công dân chỉ có thể đăng ký') || msg.includes('org3')) {
        message.error('Người dân chỉ được phép đăng ký vào tổ chức Org3');
      } else if (msg.includes('cccd must be') || msg.includes('cccd phải')) {
        form.setFields([{ name: 'cccd', errors: ['CCCD phải có đúng 12 chữ số'] }]);
        message.error('CCCD phải có đúng 12 chữ số');
      } else if (msg.includes('invalid vietnamese phone')) {
        form.setFields([{ name: 'phone', errors: ['Số điện thoại Việt Nam không hợp lệ'] }]);
        message.error('Số điện thoại Việt Nam không hợp lệ');
      } else {
        message.error(backendMsg);
      }
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
          styles={{ body: { padding: '32px' } }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)'
            }}>
              <HomeOutlined style={{ fontSize: '2rem', color: 'white' }} />
            </div>
            <Title level={2} style={{ margin: '0 0 0.5rem' }}>
              {isAdminRegistration ? 'Tạo tài khoản quản trị' : 'Đăng ký tài khoản'}
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              {isAdminRegistration 
                ? 'Tạo tài khoản cho cán bộ quản lý đất đai' 
                : 'Tham gia hệ thống quản lý đất đai blockchain'
              }
            </Text>
          </div>

          <Divider />

          {/* Security Notice */}
          <Alert
            message="Bảo mật thông tin"
            description="Thông tin cá nhân của bạn được bảo vệ theo quy định của pháp luật và được mã hóa an toàn."
            type="info"
            showIcon
            icon={<SafetyOutlined />}
            style={{ marginBottom: '1.5rem' }}
          />

          <Form
            form={form}
            name="register"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            autoComplete="off"
            requiredMark={false}
          >
            {/* Basic Information */}
            <div style={{ marginBottom: '1.5rem' }}>
              <Title level={4} style={{ marginBottom: '1rem' }}>
                <UserOutlined style={{ marginRight: '8px' }} />
                Thông tin cơ bản
              </Title>
              
              <Form.Item
                name="fullName"
                label="Họ và tên đầy đủ"
                rules={[
                  { required: true, message: 'Vui lòng nhập họ và tên!' },
                  { min: 2, message: 'Họ và tên phải có ít nhất 2 ký tự!' }
                ]}
              >
                <Input 
                  prefix={<UserOutlined />}
                  placeholder="Nhập họ và tên đầy đủ"
                  maxLength={100}
                />
              </Form.Item>

              <Form.Item
                name="cccd"
                label="CCCD"
                rules={[
                  { required: true, message: 'Vui lòng nhập CCCD!' },
                  { pattern: /^\d{12}$/, message: 'CCCD phải có đúng 12 chữ số!' }
                ]}
              >
                <Input 
                  prefix={<IdcardOutlined />}
                  placeholder="Nhập CCCD 12 chữ số"
                  maxLength={12}
                />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại!' },
                  { pattern: /^(0[3|5|7|8|9])+([0-9]{8})$/, message: 'Vui lòng nhập số điện thoại Việt Nam hợp lệ!' }
                ]}
              >
                <Input 
                  prefix={<PhoneOutlined />}
                  placeholder="Nhập số điện thoại (ví dụ: 0901234567)"
                  maxLength={10}
                />
              </Form.Item>
            </div>

            {/* Organization Selection (Admin Only) */}
            {isAdminRegistration && (
              <div style={{ marginBottom: '1.5rem' }}>
                <Title level={4} style={{ marginBottom: '1rem' }}>
                  <BankOutlined style={{ marginRight: '8px' }} />
                  Thông tin tổ chức
                </Title>
                
                <Form.Item
                  name="org"
                  label="Tổ chức"
                  rules={[{ required: true, message: 'Vui lòng chọn tổ chức!' }]}
                >
                  <Select placeholder="Chọn tổ chức">
                    <Option value="Org1">
                      <Space>
                        <BankOutlined />
                        Org1 - Cơ quan quản lý đất đai
                      </Space>
                    </Option>
                    <Option value="Org2">
                      <Space>
                        <TeamOutlined />
                        Org2 - Đơn vị hành chính cấp xã
                      </Space>
                    </Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="role"
                  label="Vai trò"
                  rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
                >
                  <Select placeholder="Chọn vai trò">
                    <Option value="admin">Quản trị viên</Option>
                    <Option value="user">Người dùng</Option>
                  </Select>
                </Form.Item>
              </div>
            )}

            {/* Password Section */}
            <div style={{ marginBottom: '1.5rem' }}>
              <Title level={4} style={{ marginBottom: '1rem' }}>
                <LockOutlined style={{ marginRight: '8px' }} />
                Mật khẩu
              </Title>
              
              <Form.Item
                name="password"
                label="Mật khẩu"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu!' },
                  { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự!' },
                  { 
                    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                    message: 'Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt!'
                  }
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />}
                  placeholder="Nhập mật khẩu mạnh"
                  onChange={(e) => setPasswordStrength(checkPasswordStrength(e.target.value))}
                />
              </Form.Item>

              {/* Password Strength Indicator */}
              {passwordStrength > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <Text type="secondary" style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>
                    Độ mạnh mật khẩu:
                  </Text>
                  <Progress 
                    percent={passwordStrength} 
                    size="small"
                    status={passwordStrength < 40 ? 'exception' : passwordStrength < 80 ? 'normal' : 'success'}
                    strokeColor={{
                      '0%': '#ff4d4f',
                      '50%': '#faad14',
                      '100%': '#52c41a',
                    }}
                  />
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    {passwordStrength < 40 ? 'Yếu' : passwordStrength < 80 ? 'Trung bình' : 'Mạnh'}
                  </Text>
                </div>
              )}

              <Form.Item
                name="confirmPassword"
                label="Xác nhận mật khẩu"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                    },
                  }),
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />}
                  placeholder="Nhập lại mật khẩu"
                />
              </Form.Item>
            </div>

            {/* Submit Button */}
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
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}
              >
                {loading ? 'Đang đăng ký...' : 'Đăng ký tài khoản'}
              </Button>
            </Form.Item>

            <Divider style={{ margin: '1.5rem 0' }}>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                {isAdminRegistration ? 'Đã có tài khoản?' : 'Đã có tài khoản?'}
              </Text>
            </Divider>

            <div style={{ textAlign: 'center' }}>
              <Space direction="vertical" size="small">
                <Link 
                  to="/login" 
                  style={{ 
                    fontSize: '16px', 
                    fontWeight: '600',
                    textDecoration: 'none',
                    color: '#667eea'
                  }}
                >
                  Đăng nhập ngay
                </Link>
              </Space>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default Register;