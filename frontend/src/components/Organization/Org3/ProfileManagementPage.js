import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Typography,
  Row,
  Col,
  Avatar,
  Upload,
  Modal,
  Steps,
  Alert
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  SaveOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  CameraOutlined,
  KeyOutlined
} from '@ant-design/icons';
import apiService from '../../../services/api';

const { Title, Text } = Typography;
const { Step } = Steps;

/**
 * Profile Management Page for Org3 (Citizens)
 * Manage personal profile and account settings
 */
const ProfileManagementPage = ({ user, onUserUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [otpForm] = Form.useForm();
  const [profileData, setProfileData] = useState({});
  const [otpStep, setOtpStep] = useState(0); // 0: request, 1: verify

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProfile();
      setProfileData(response.profile || {});
      profileForm.setFieldsValue(response.profile || {});
    } catch (error) {
      console.error('Error fetching profile:', error);
      message.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const values = await profileForm.validateFields();
      setLoading(true);
      
      const response = await apiService.updateProfile(values);
      setProfileData(response.profile || values);
      setEditing(false);
      
      if (onUserUpdate) {
        onUserUpdate(response.profile || values);
      }
      
      message.success('Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
      message.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      const values = await passwordForm.validateFields();
      setLoading(true);
      
      await apiService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });
      
      setPasswordModalVisible(false);
      passwordForm.resetFields();
      message.success('Password changed successfully');
    } catch (error) {
      console.error('Password change error:', error);
      message.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async () => {
    try {
      const values = await otpForm.validateFields(['email', 'phone']);
      setLoading(true);
      
      await apiService.requestOTP({
        email: values.email,
        phone: values.phone,
        purpose: 'profile_verification'
      });
      
      setOtpStep(1);
      message.success('OTP sent successfully');
    } catch (error) {
      console.error('OTP request error:', error);
      message.error('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    try {
      const values = await otpForm.validateFields(['otp']);
      setLoading(true);
      
      await apiService.verifyOTP({
        otp: values.otp,
        purpose: 'profile_verification'
      });
      
      setOtpModalVisible(false);
      setOtpStep(0);
      otpForm.resetFields();
      message.success('Profile verified successfully');
      fetchProfile(); // Refresh profile to show verified status
    } catch (error) {
      console.error('OTP verification error:', error);
      message.error('Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await apiService.uploadAvatar(formData);
      setProfileData({...profileData, avatar: response.avatarUrl});
      message.success('Avatar updated successfully');
    } catch (error) {
      console.error('Avatar upload error:', error);
      message.error('Failed to upload avatar');
    } finally {
      setLoading(false);
    }
    return false; // Prevent auto upload
  };

  // Upload button component removed as it's not used

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Profile Management</Title>
      <Text type="secondary">
        Manage your personal information and account settings
      </Text>

      <Row gutter={24} style={{ marginTop: '24px' }}>
        {/* Profile Information */}
        <Col span={16}>
          <Card
            title="Personal Information"
            extra={
              <Button
                type={editing ? 'default' : 'primary'}
                icon={editing ? <SaveOutlined /> : <EditOutlined />}
                onClick={editing ? handleUpdateProfile : () => setEditing(true)}
                loading={loading}
              >
                {editing ? 'Save Changes' : 'Edit Profile'}
              </Button>
            }
          >
            <Form
              form={profileForm}
              layout="vertical"
              disabled={!editing}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="name"
                    label="Full Name"
                    rules={[{ required: true, message: 'Please enter your full name' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="Enter full name" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="cccd"
                    label="CCCD Number"
                  >
                    <Input prefix={<UserOutlined />} disabled placeholder="CCCD cannot be changed" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="email"
                    label="Email Address"
                    rules={[
                      { required: true, message: 'Please enter your email' },
                      { type: 'email', message: 'Please enter a valid email' }
                    ]}
                  >
                    <Input prefix={<MailOutlined />} placeholder="Enter email address" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="phone"
                    label="Phone Number"
                    rules={[{ required: true, message: 'Please enter your phone number' }]}
                  >
                    <Input prefix={<PhoneOutlined />} placeholder="Enter phone number" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="address"
                label="Address"
                rules={[{ required: true, message: 'Please enter your address' }]}
              >
                <Input.TextArea
                  rows={3}
                  placeholder="Enter your full address"
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="city" label="City">
                    <Input placeholder="Enter city" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="district" label="District">
                    <Input placeholder="Enter district" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="ward" label="Ward">
                    <Input placeholder="Enter ward" />
                  </Form.Item>
                </Col>
              </Row>
            </Form>

            {editing && (
              <div style={{ textAlign: 'right', marginTop: '16px' }}>
                <Button
                  style={{ marginRight: '8px' }}
                  onClick={() => {
                    setEditing(false);
                    profileForm.setFieldsValue(profileData);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  onClick={handleUpdateProfile}
                  loading={loading}
                >
                  Save Changes
                </Button>
              </div>
            )}
          </Card>
        </Col>

        {/* Profile Picture & Actions */}
        <Col span={8}>
          <Card title="Profile Picture">
            <div style={{ textAlign: 'center' }}>
              <Avatar
                size={120}
                src={profileData.avatar}
                icon={<UserOutlined />}
                style={{ marginBottom: '16px' }}
              />
              <br />
              <Upload
                beforeUpload={handleAvatarUpload}
                showUploadList={false}
                accept="image/*"
              >
                <Button icon={<CameraOutlined />}>
                  Change Avatar
                </Button>
              </Upload>
            </div>
          </Card>

          <Card title="Account Security" style={{ marginTop: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <Button
                type="primary"
                icon={<LockOutlined />}
                onClick={() => setPasswordModalVisible(true)}
                style={{ marginBottom: '8px', width: '100%' }}
              >
                Change Password
              </Button>
              <Button
                icon={<KeyOutlined />}
                onClick={() => setOtpModalVisible(true)}
                style={{ width: '100%' }}
              >
                Verify Account
              </Button>
            </div>
          </Card>

          <Card title="Account Status" style={{ marginTop: '16px' }}>
            <div>
              <Text strong>Email: </Text>
              <Text type={profileData.emailVerified ? 'success' : 'warning'}>
                {profileData.emailVerified ? 'Verified' : 'Not Verified'}
              </Text>
              <br />
              <Text strong>Phone: </Text>
              <Text type={profileData.phoneVerified ? 'success' : 'warning'}>
                {profileData.phoneVerified ? 'Verified' : 'Not Verified'}
              </Text>
              <br />
              <Text strong>Account: </Text>
              <Text type={profileData.accountVerified ? 'success' : 'warning'}>
                {profileData.accountVerified ? 'Verified' : 'Pending Verification'}
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Change Password Modal */}
      <Modal
        title="Change Password"
        open={passwordModalVisible}
        onOk={handleChangePassword}
        onCancel={() => {
          setPasswordModalVisible(false);
          passwordForm.resetFields();
        }}
        confirmLoading={loading}
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item
            name="currentPassword"
            label="Current Password"
            rules={[{ required: true, message: 'Please enter current password' }]}
          >
            <Input.Password placeholder="Enter current password" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              { required: true, message: 'Please enter new password' },
              { min: 6, message: 'Password must be at least 6 characters' }
            ]}
          >
            <Input.Password placeholder="Enter new password" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Confirm New Password"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Please confirm new password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                }
              })
            ]}
          >
            <Input.Password placeholder="Confirm new password" />
          </Form.Item>
        </Form>
      </Modal>

      {/* OTP Verification Modal */}
      <Modal
        title="Account Verification"
        open={otpModalVisible}
        onOk={otpStep === 0 ? handleRequestOTP : handleVerifyOTP}
        onCancel={() => {
          setOtpModalVisible(false);
          setOtpStep(0);
          otpForm.resetFields();
        }}
        confirmLoading={loading}
        okText={otpStep === 0 ? 'Send OTP' : 'Verify'}
      >
        <Steps current={otpStep} style={{ marginBottom: '24px' }}>
          <Step title="Request OTP" />
          <Step title="Verify OTP" />
        </Steps>

        <Form form={otpForm} layout="vertical">
          {otpStep === 0 ? (
            <>
              <Alert
                message="Account Verification"
                description="We will send an OTP to your email and phone number for verification."
                type="info"
                style={{ marginBottom: '16px' }}
              />
              <Form.Item
                name="email"
                label="Email Address"
                rules={[{ required: true, type: 'email' }]}
              >
                <Input prefix={<MailOutlined />} placeholder="Enter email address" />
              </Form.Item>
              <Form.Item
                name="phone"
                label="Phone Number"
                rules={[{ required: true }]}
              >
                <Input prefix={<PhoneOutlined />} placeholder="Enter phone number" />
              </Form.Item>
            </>
          ) : (
            <>
              <Alert
                message="Enter OTP"
                description="Please enter the OTP sent to your email and phone number."
                type="info"
                style={{ marginBottom: '16px' }}
              />
              <Form.Item
                name="otp"
                label="OTP Code"
                rules={[{ required: true, message: 'Please enter OTP' }]}
              >
                <Input placeholder="Enter 6-digit OTP" maxLength={6} />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default ProfileManagementPage;
