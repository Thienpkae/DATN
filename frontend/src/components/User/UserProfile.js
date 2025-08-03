import React, { useState } from 'react';
import {
  Card,
  Typography,
  Space,
  Descriptions,
  Button,
  Modal,
  Form,
  Input,
  message,
  Avatar,
  Tag,
  Divider
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  SafetyOutlined,
  PhoneOutlined,
  IdcardOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { changePassword } from '../../services/auth';

const { Title, Text } = Typography;

/**
 * User Profile Component
 */
const UserProfile = ({ user }) => {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const handleChangePassword = async (values) => {
    setLoading(true);
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });
      message.success('Password changed successfully');
      setPasswordModalVisible(false);
      passwordForm.resetFields();
    } catch (error) {
      message.error(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const getOrgName = (org) => {
    const orgNames = {
      'Org1': 'Land Registry Authority',
      'Org2': 'Government Office',
      'Org3': 'Citizens'
    };
    return orgNames[org] || org;
  };

  const getRoleColor = (role) => {
    const colors = {
      'admin': 'red',
      'super_admin': 'purple',
      'user': 'green'
    };
    return colors[role] || 'default';
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Avatar
              size={80}
              icon={<UserOutlined />}
              style={{ backgroundColor: '#1890ff', marginBottom: '16px' }}
            />
            <Title level={3}>{user?.fullName || user?.username || 'User Profile'}</Title>
            <Space>
              <Tag color="blue">{getOrgName(user?.org)}</Tag>
              <Tag color={getRoleColor(user?.role)}>{user?.role?.toUpperCase()}</Tag>
            </Space>
          </div>

          <Divider />

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <Title level={4}>Profile Information</Title>
              <Space>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => setEditModalVisible(true)}
                >
                  Edit Profile
                </Button>
                <Button
                  icon={<SafetyOutlined />}
                  onClick={() => setPasswordModalVisible(true)}
                >
                  Change Password
                </Button>
              </Space>
            </div>

            <Descriptions bordered column={1}>
              <Descriptions.Item label={<><UserOutlined /> Username</>}>
                {user?.username || user?.userId || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label={<><IdcardOutlined /> Full Name</>}>
                {user?.fullName || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label={<><IdcardOutlined /> CCCD</>}>
                {user?.cccd || user?.userId || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label={<><PhoneOutlined /> Phone</>}>
                {user?.phone || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label={<><TeamOutlined /> Organization</>}>
                {getOrgName(user?.org)}
              </Descriptions.Item>
              <Descriptions.Item label="Role">
                <Tag color={getRoleColor(user?.role)}>{user?.role?.toUpperCase()}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color="green">Active</Tag>
              </Descriptions.Item>
            </Descriptions>
          </div>
        </Space>
      </Card>

      {/* Edit Profile Modal */}
      <Modal
        title="Edit Profile"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setEditModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="save" type="primary" onClick={() => message.info('Profile update requires additional backend endpoints')}>
            Save Changes
          </Button>
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Full Name" name="fullName" initialValue={user?.fullName}>
            <Input />
          </Form.Item>
          <Form.Item label="Phone" name="phone" initialValue={user?.phone}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        title="Change Password"
        open={passwordModalVisible}
        onOk={() => passwordForm.submit()}
        onCancel={() => setPasswordModalVisible(false)}
        confirmLoading={loading}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Form.Item
            label="Current Password"
            name="currentPassword"
            rules={[{ required: true, message: 'Please enter your current password' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="New Password"
            name="newPassword"
            rules={[
              { required: true, message: 'Please enter a new password' },
              { min: 8, message: 'Password must be at least 8 characters' }
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="Confirm New Password"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Please confirm your new password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserProfile;
