import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Space, Typography, App, Tabs, Alert, Row, Col, Divider } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined, PhoneOutlined, EditOutlined, CloseOutlined, SaveOutlined, UndoOutlined } from '@ant-design/icons';
import userService from '../../services/userService';
import authService from '../../services/auth';
import { normalizeVietnameseName } from '../../utils/text';

const { Title, Text } = Typography;

const ProfilePage = () => {
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [otpForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [pendingPhone, setPendingPhone] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [originalProfileData, setOriginalProfileData] = useState({});
  const { message } = App.useApp();

  useEffect(() => {
    const load = async () => {
      try {
        // 1) Start from local auth user (same as Admin flow)
        const current = authService.getCurrentUser();
        if (current) {
          const profileData = {
            cccd: current.cccd || current.userId,
            fullName: normalizeVietnameseName(current.name),
            phone: current.phone ? String(current.phone) : ''
          };
          
          profileForm.setFieldsValue(profileData);
          setOriginalProfileData(profileData);

          // Backfill phone from JWT if still missing
          const currentPhone = current.phone ? String(current.phone) : '';
          if (!currentPhone) {
            try {
              const token = localStorage.getItem('jwt_token');
              if (token) {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload?.phone) {
                  const updatedData = { ...profileData, phone: String(payload.phone) };
                  profileForm.setFieldsValue(updatedData);
                  setOriginalProfileData(updatedData);
                  const cached = authService.getCurrentUser() || {};
                  localStorage.setItem('user', JSON.stringify({ ...cached, phone: String(payload.phone) }));
                }
              }
            } catch (_) { /* ignore */ }
          }
        }
        // 2) Call non-admin self endpoint to ensure latest phone
        try {
          const targetCccd = (current?.cccd || current?.userId);
          if (targetCccd) {
            const me = await userService.getSelfByCccd(targetCccd);
            if (me) {
              const updatedData = {
                cccd: me.cccd,
                fullName: normalizeVietnameseName(me.fullName || current?.name || ''),
                phone: me.phone ? String(me.phone) : profileForm.getFieldValue('phone') || ''
              };
              profileForm.setFieldsValue(updatedData);
              setOriginalProfileData(updatedData);
              if (me.phone) {
                localStorage.setItem('user', JSON.stringify({ ...current, phone: String(me.phone) }));
              }
            }
          }
        } catch (_) {}

      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profileForm]);



  const onSubmitPassword = async () => {
    try {
      const values = await passwordForm.validateFields();
      setPasswordLoading(true);
      
      const passwordData = {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword
      };
      
      await authService.changePassword(passwordData);
      message.success('Đổi mật khẩu thành công');
      
      // Clear password form
      passwordForm.resetFields();
      
      // Switch back to profile tab
      setActiveTab('1');
      
    } catch (error) {
      message.error(error?.response?.data?.error || error.message || 'Đổi mật khẩu thất bại');
    } finally {
      setPasswordLoading(false);
    }
  };

  const sendOtp = async () => {
    try {
      setSendingOtp(true);
      await userService.requestPhoneVerification();
      message.success('OTP đã được gửi đến số điện thoại mới');
    } catch (error) {
      message.error(error?.response?.data?.error || error.message || 'Gửi OTP thất bại');
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    try {
      const values = await otpForm.validateFields();
      setOtpLoading(true);
      
      const result = await userService.verifyPhoneChange(values.otp);
      message.success('Xác thực số điện thoại thành công!');
      
      // Update local user data
      const current = authService.getCurrentUser();
      if (current && result?.user) {
        const merged = { 
          ...current, 
          phone: result.user.phone,
          name: result.user.fullName
        };
        localStorage.setItem('user', JSON.stringify(merged));
      }
      
      // Clear OTP form and hide OTP form
      otpForm.resetFields();
      setPendingPhone('');
      setShowOtpForm(false);
      setTimeout(() => {
        goBack();
      }, 800);
      
    } catch (error) {
      message.error(error?.response?.data?.error || error.message || 'Xác thực OTP thất bại');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    profileForm.setFieldsValue(originalProfileData);
  };

  const handleSaveProfile = async () => {
    try {
      const values = await profileForm.validateFields();
      setLoading(true);
      const payload = { fullName: values.fullName, phone: values.phone };
      let updated;
      try {
        updated = await userService.updateProfile(payload);
      } catch (err) {
        // If profile API not available (404), try admin update-by-cccd for own account
        if (err?.response?.status === 404) {
          const current = authService.getCurrentUser();
          if (current?.role === 'admin' && (current?.cccd || current?.userId)) {
            const cccd = current.cccd || current.userId;
            updated = await userService.updateByCccd(cccd, {
              fullName: values.fullName,
              phone: values.phone
            });
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }
      
      // Debug log để check response
      console.log('Update profile response:', updated);
      
      // Check if phone verification is required
      if (updated?.phoneChanged || updated?.requiresVerification) {
        console.log('Phone changed detected, showing OTP form');
        setPendingPhone(values.phone);
        setShowOtpForm(true);
        message.warning('Số điện thoại đã được cập nhật. Vui lòng xác thực OTP để hoàn tất thay đổi.');
        // Automatically send OTP
        try {
          await userService.requestPhoneVerification();
          message.success('OTP đã được gửi đến số điện thoại mới');
        } catch (otpError) {
          console.error('Auto OTP send failed:', otpError);
          message.error('Không thể gửi OTP. Vui lòng thử lại.');
        }
        return;
      }
      
      message.success('Cập nhật hồ sơ thành công');
      // persist name to localStorage for header display
      const current = authService.getCurrentUser();
      if (current) {
        const merged = { ...current, name: updated?.user?.fullName || values.fullName, phone: values.phone };
        localStorage.setItem('user', JSON.stringify(merged));
      }
      
      // Update original data and exit edit mode
      setOriginalProfileData(values);
      setIsEditingProfile(false);
      
    } catch (error) {
      message.error(error?.response?.data?.error || error.message || 'Cập nhật hồ sơ thất bại');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    const u = authService.getCurrentUser();
    if (u && u.role === 'admin') {
      window.location.href = '/admin';
    } else {
      window.history.back();
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Card style={{ maxWidth: 720, margin: '0 auto' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={3} style={{ marginBottom: 0 }}>Quản lý tài khoản</Title>
            <Text type="secondary">Cập nhật thông tin cá nhân và bảo mật</Text>
          </div>

          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            items={[
              {
                key: '1',
                label: (
                  <span>
                    <UserOutlined />
                    Thông tin cá nhân
                  </span>
                ),
                children: (
                  <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    {!showOtpForm ? (
                      <>
                        {/* Header with Edit Button */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <Title level={4} style={{ margin: 0 }}>Thông tin cá nhân</Title>
                            <Text type="secondary">Xem và cập nhật thông tin cá nhân của bạn</Text>
                          </div>
                          {!isEditingProfile && (
                            <Button 
                              type="primary" 
                              icon={<EditOutlined />}
                              onClick={handleEditProfile}
                            >
                              Sửa
                            </Button>
                          )}
                        </div>

                        <Divider style={{ margin: '16px 0' }} />

                        <Form form={profileForm} layout="vertical" disabled={!isEditingProfile || loading}>
                          <Row gutter={16}>
                            <Col span={24}>
                              <Form.Item label="CCCD" name="cccd">
                                <Input 
                                  disabled 
                                  style={{ backgroundColor: '#f5f5f5' }}
                                  prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                          
                          <Row gutter={16}>
                            <Col span={24}>
                              <Form.Item 
                                label="Họ và tên" 
                                name="fullName" 
                                rules={[
                                  { required: true, message: 'Vui lòng nhập họ tên' },
                                  { min: 2, message: 'Họ tên phải có ít nhất 2 ký tự' }
                                ]}
                              >
                                <Input 
                                  placeholder="Nhập họ tên đầy đủ"
                                  prefix={<UserOutlined style={{ color: isEditingProfile ? '#1890ff' : '#bfbfbf' }} />}
                                  style={{ 
                                    backgroundColor: isEditingProfile ? '#fff' : '#f5f5f5',
                                    borderColor: isEditingProfile ? '#d9d9d9' : '#f0f0f0'
                                  }}
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                          
                          <Row gutter={16}>
                            <Col span={24}>
                              <Form.Item 
                                label="Số điện thoại" 
                                name="phone" 
                                rules={[
                                  { required: true, message: 'Vui lòng nhập số điện thoại' },
                                  { pattern: /^(0[3|5|7|8|9])+([0-9]{8})$/, message: 'Số điện thoại không hợp lệ' }
                                ]}
                              >
                                <Input 
                                  placeholder="Nhập số điện thoại (VD: 0901234567)" 
                                  maxLength={10}
                                  prefix={<PhoneOutlined style={{ color: isEditingProfile ? '#1890ff' : '#bfbfbf' }} />}
                                  style={{ 
                                    backgroundColor: isEditingProfile ? '#fff' : '#f5f5f5',
                                    borderColor: isEditingProfile ? '#d9d9d9' : '#f0f0f0'
                                  }}
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                        </Form>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Button 
                            icon={<CloseOutlined />}
                            onClick={goBack}
                            style={{ borderColor: '#d9d9d9' }}
                          >
                            Hủy
                          </Button>
                          
                          {isEditingProfile && (
                            <div style={{ display: 'flex', gap: 8 }}>
                              <Button 
                                icon={<UndoOutlined />}
                                onClick={handleCancelEdit}
                                disabled={loading}
                              >
                                Hủy chỉnh sửa
                              </Button>
                              <Button 
                                type="primary" 
                                icon={<SaveOutlined />}
                                onClick={handleSaveProfile} 
                                loading={loading}
                              >
                                Lưu thay đổi
                              </Button>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <Text strong>Xác thực số điện thoại mới</Text>
                          <br />
                          <Text type="secondary">
                            Vui lòng nhập mã OTP đã được gửi đến số điện thoại {pendingPhone}
                          </Text>
                        </div>

                        <Alert
                          message="Cần xác thực OTP"
                          description="Bạn đã thay đổi số điện thoại. Vui lòng xác thực OTP để hoàn tất quá trình cập nhật."
                          type="warning"
                          showIcon
                          style={{ marginBottom: '1rem' }}
                        />

                        <Form form={otpForm} layout="vertical" disabled={otpLoading}>
                          <Form.Item
                            label="Mã OTP"
                            name="otp"
                            rules={[
                              { required: true, message: 'Vui lòng nhập mã OTP' },
                              { pattern: /^\d{6}$/, message: 'OTP phải có đúng 6 chữ số' }
                            ]}
                          >
                            <Input 
                              prefix={<SafetyOutlined />}
                              placeholder="Nhập mã OTP 6 chữ số"
                              maxLength={6}
                              style={{ fontSize: '18px', textAlign: 'center', letterSpacing: '0.5em' }}
                            />
                          </Form.Item>
                        </Form>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Button 
                            icon={<PhoneOutlined />}
                            onClick={sendOtp} 
                            loading={sendingOtp}
                          >
                            Gửi lại OTP
                          </Button>
                          
                          <div style={{ display: 'flex', gap: 8 }}>
                            <Button 
                              icon={<UndoOutlined />}
                              onClick={() => {
                                setShowOtpForm(false);
                                setPendingPhone('');
                                otpForm.resetFields();
                              }}
                            >
                              Quay lại
                            </Button>
                            <Button 
                              type="primary" 
                              icon={<SafetyOutlined />}
                              onClick={verifyOtp} 
                              loading={otpLoading}
                            >
                              Xác thực OTP
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </Space>
                )
              },
              {
                key: '2',
                label: (
                  <span>
                    <LockOutlined />
                    Đổi mật khẩu
                  </span>
                ),
                children: (
                  <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <div>
                      <Title level={4} style={{ margin: 0 }}>Đổi mật khẩu</Title>
                      <Text type="secondary">Để bảo vệ tài khoản, vui lòng chọn mật khẩu mạnh và không chia sẻ với ai</Text>
                    </div>

                    <Divider style={{ margin: '16px 0' }} />

                    <Form form={passwordForm} layout="vertical" disabled={passwordLoading}>
                      <Form.Item
                        label="Mật khẩu hiện tại"
                        name="oldPassword"
                        rules={[
                          { required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }
                        ]}
                      >
                        <Input.Password 
                          prefix={<LockOutlined />}
                          placeholder="Nhập mật khẩu hiện tại"
                        />
                      </Form.Item>

                      <Form.Item
                        label="Mật khẩu mới"
                        name="newPassword"
                        rules={[
                          { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                          { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' },
                          {
                            pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                            message: 'Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa, 1 số và 1 ký tự đặc biệt'
                          }
                        ]}
                        hasFeedback
                      >
                        <Input.Password 
                          prefix={<SafetyOutlined />}
                          placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
                        />
                      </Form.Item>

                      <Form.Item
                        label="Xác nhận mật khẩu mới"
                        name="confirmPassword"
                        dependencies={['newPassword']}
                        rules={[
                          { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              if (!value || getFieldValue('newPassword') === value) {
                                return Promise.resolve();
                              }
                              return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                            },
                          })
                        ]}
                        hasFeedback
                      >
                        <Input.Password 
                          prefix={<SafetyOutlined />}
                          placeholder="Nhập lại mật khẩu mới"
                        />
                      </Form.Item>
                    </Form>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Button 
                        icon={<CloseOutlined />}
                        onClick={goBack}
                        style={{ borderColor: '#d9d9d9' }}
                      >
                        Hủy
                      </Button>
                      
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button 
                          icon={<UndoOutlined />}
                          onClick={() => passwordForm.resetFields()}
                          disabled={passwordLoading}
                        >
                          Đặt lại
                        </Button>
                        <Button 
                          type="primary" 
                          icon={<SaveOutlined />}
                          onClick={onSubmitPassword} 
                          loading={passwordLoading}
                        >
                          Đổi mật khẩu
                        </Button>
                      </div>
                    </div>
                  </Space>
                )
              }
            ]}
          />
        </Space>
      </Card>
    </div>
  );
};

export default ProfilePage;


