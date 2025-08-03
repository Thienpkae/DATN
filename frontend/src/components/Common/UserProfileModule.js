import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Row,
  Col,
  Avatar,
  Upload,
  message,
  Tabs,
  Descriptions,
  Tag,
  Modal,
  Table
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  SaveOutlined,
  CameraOutlined,
  HistoryOutlined,
  SecurityScanOutlined
} from '@ant-design/icons';
import apiService from '../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

/**
 * User Profile Module - Comprehensive user profile management
 * Shows user information, allows editing, and displays activity history
 */
const UserProfileModule = ({ user, onUserUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState(user);
  const [activityHistory, setActivityHistory] = useState([]);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    fetchProfileData();
    fetchActivityHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfileData = async () => {
    try {
      const response = await apiService.getProfile();
      setProfileData(response.user || user);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchActivityHistory = async () => {
    try {
      // Mock activity history - replace with actual API call
      setActivityHistory([
        {
          id: 1,
          action: 'Login',
          timestamp: new Date().toISOString(),
          details: 'Successful login from web browser',
          ip: '192.168.1.100'
        },
        {
          id: 2,
          action: 'Profile Update',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          details: 'Updated contact information',
          ip: '192.168.1.100'
        }
      ]);
    } catch (error) {
      console.error('Error fetching activity history:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      await apiService.updateProfile(values);
      setProfileData({ ...profileData, ...values });
      message.success('Profile updated successfully');
      setEditing(false);
      
      if (onUserUpdate) {
        onUserUpdate({ ...profileData, ...values });
      }
    } catch (error) {
      console.error('Update profile error:', error);
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

      message.success('Password changed successfully');
      setChangePasswordVisible(false);
      passwordForm.resetFields();
    } catch (error) {
      console.error('Change password error:', error);
      message.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('avatar', file);

      await apiService.uploadAvatar(formData);
      message.success('Avatar updated successfully');
      fetchProfileData();
    } catch (error) {
      console.error('Upload avatar error:', error);
      message.error('Failed to upload avatar');
    } finally {
      setLoading(false);
    }
    return false; // Prevent default upload behavior
  };

  const getOrgDisplayName = (org) => {
    const orgNames = {
      'Org1': 'Land Registry Authority',
      'Org2': 'Government Office',
      'Org3': 'Citizen'
    };
    return orgNames[org] || org;
  };

  const renderProfileInfo = () => (
    <Card title="Profile Information">
      <Row gutter={24}>
        <Col span={6}>
          <div style={{ textAlign: 'center' }}>
            <Avatar
              size={120}
              src={profileData.avatar}
              icon={<UserOutlined />}
              style={{ marginBottom: '16px' }}
            />
            <br />
            <Upload
              showUploadList={false}
              beforeUpload={handleAvatarUpload}
              accept="image/*"
            >
              <Button icon={<CameraOutlined />} size="small">
                Change Avatar
              </Button>
            </Upload>
          </div>
        </Col>
        <Col span={18}>
          {editing ? (
            <Form form={form} layout="vertical" initialValues={profileData}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="fullName"
                    label="Full Name"
                    rules={[{ required: true, message: 'Please enter full name' }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: 'Please enter email' },
                      { type: 'email', message: 'Please enter valid email' }
                    ]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="phone"
                    label="Phone Number"
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="address"
                    label="Address"
                  >
                    <TextArea rows={2} />
                  </Form.Item>
                </Col>
              </Row>
              <div style={{ textAlign: 'right' }}>
                <Button onClick={() => setEditing(false)} style={{ marginRight: '8px' }}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSaveProfile}
                  loading={loading}
                >
                  Save Changes
                </Button>
              </div>
            </Form>
          ) : (
            <div>
              <Descriptions bordered column={2}>
                <Descriptions.Item label="Full Name" span={2}>
                  <Text strong>{profileData.fullName || 'Not provided'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="CCCD" span={1}>
                  <Text code>{profileData.cccd}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Organization" span={1}>
                  <Tag color="blue">{getOrgDisplayName(profileData.org)}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Email" span={1}>
                  <Text>{profileData.email || 'Not provided'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Phone" span={1}>
                  <Text>{profileData.phone || 'Not provided'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Address" span={2}>
                  <Text>{profileData.address || 'Not provided'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Registration Date" span={1}>
                  <Text>{profileData.registrationDate ? new Date(profileData.registrationDate).toLocaleDateString('vi-VN') : 'N/A'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Last Login" span={1}>
                  <Text>{profileData.lastLogin ? new Date(profileData.lastLogin).toLocaleString('vi-VN') : 'N/A'}</Text>
                </Descriptions.Item>
              </Descriptions>
              <div style={{ textAlign: 'right', marginTop: '16px' }}>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => setEditing(true)}
                >
                  Edit Profile
                </Button>
              </div>
            </div>
          )}
        </Col>
      </Row>
    </Card>
  );

  const renderSecuritySettings = () => (
    <Card title="Security Settings">
      <Row gutter={16}>
        <Col span={12}>
          <Card size="small" title="Password">
            <Text type="secondary">Last changed: Never</Text>
            <br />
            <Button
              type="primary"
              icon={<SecurityScanOutlined />}
              onClick={() => setChangePasswordVisible(true)}
              style={{ marginTop: '8px' }}
            >
              Change Password
            </Button>
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" title="Two-Factor Authentication">
            <Text type="secondary">Status: Disabled</Text>
            <br />
            <Button style={{ marginTop: '8px' }}>
              Enable 2FA
            </Button>
          </Card>
        </Col>
      </Row>
    </Card>
  );

  const renderActivityHistory = () => {
    const columns = [
      {
        title: 'Action',
        dataIndex: 'action',
        key: 'action'
      },
      {
        title: 'Details',
        dataIndex: 'details',
        key: 'details'
      },
      {
        title: 'IP Address',
        dataIndex: 'ip',
        key: 'ip'
      },
      {
        title: 'Timestamp',
        dataIndex: 'timestamp',
        key: 'timestamp',
        render: (timestamp) => new Date(timestamp).toLocaleString('vi-VN')
      }
    ];

    return (
      <Card title="Activity History">
        <Table
          columns={columns}
          dataSource={activityHistory}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>
    );
  };

  const tabItems = [
    {
      key: 'profile',
      label: (
        <span>
          <UserOutlined />
          Profile Information
        </span>
      ),
      children: renderProfileInfo()
    },
    {
      key: 'security',
      label: (
        <span>
          <SecurityScanOutlined />
          Security Settings
        </span>
      ),
      children: renderSecuritySettings()
    },
    {
      key: 'activity',
      label: (
        <span>
          <HistoryOutlined />
          Activity History
        </span>
      ),
      children: renderActivityHistory()
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <UserOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          User Profile
        </Title>
        <Text type="secondary">
          Manage your profile information, security settings, and view activity history
        </Text>
      </div>

      <Tabs items={tabItems} />

      {/* Change Password Modal */}
      <Modal
        title="Change Password"
        open={changePasswordVisible}
        onCancel={() => {
          setChangePasswordVisible(false);
          passwordForm.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => setChangePasswordVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleChangePassword}
            loading={loading}
          >
            Change Password
          </Button>
        ]}
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item
            name="currentPassword"
            label="Current Password"
            rules={[{ required: true, message: 'Please enter current password' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              { required: true, message: 'Please enter new password' },
              { min: 8, message: 'Password must be at least 8 characters' }
            ]}
          >
            <Input.Password />
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
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserProfileModule;
