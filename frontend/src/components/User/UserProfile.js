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
  TeamOutlined,
  LockOutlined
} from '@ant-design/icons';
import authService from '../../services/auth';

const { Title } = Typography;

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
      await authService.changePassword(
        values.currentPassword,
        values.newPassword
      );
      message.success('Mật khẩu đã được thay đổi thành công');
      setPasswordModalVisible(false);
      passwordForm.resetFields();
    } catch (error) {
      message.error(error.message || 'Không thể thay đổi mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  const getOrgName = (org) => {
    const orgNames = {
      'Org1': 'Cơ quan quản lý đất đai',
      'Org2': 'Đơn vị hành chính cấp xã',
      'Org3': 'Công dân'
    };
    return orgNames[org] || org;
  };

  const getRoleColor = (role) => {
    const colors = {
      'admin': 'red',
      'user': 'green'
    };
    return colors[role] || 'default';
  };

  const getRoleName = (role) => {
    const roleNames = {
      'admin': 'Quản trị viên',
      'user': 'Người dùng'
    };
    return roleNames[role] || role;
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
            <Title level={3}>{user?.fullName || user?.username || 'Thông tin cá nhân'}</Title>
            <Space>
              <Tag color="blue">{getOrgName(user?.org)}</Tag>
              <Tag color={getRoleColor(user?.role)}>{getRoleName(user?.role)}</Tag>
            </Space>
          </div>

          <Divider />

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <Title level={4}>Thông tin cá nhân</Title>
              <Space>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => setEditModalVisible(true)}
                >
                  Chỉnh sửa thông tin
                </Button>
                <Button
                  icon={<SafetyOutlined />}
                  onClick={() => setPasswordModalVisible(true)}
                >
                  Đổi mật khẩu
                </Button>
              </Space>
            </div>

            <Descriptions bordered column={2}>
              <Descriptions.Item label="CCCD" span={2}>
                <Space>
                  <IdcardOutlined />
                  {user?.cccd || user?.userId || 'Chưa cập nhật'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Họ và tên">
                <Space>
                  <UserOutlined />
                  {user?.fullName || user?.name || 'Chưa cập nhật'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                <Space>
                  <PhoneOutlined />
                  {user?.phone || 'Chưa cập nhật'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Tổ chức">
                <Space>
                  <TeamOutlined />
                  {getOrgName(user?.org)}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Vai trò">
                <Tag color={getRoleColor(user?.role)}>
                  {getRoleName(user?.role)}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </div>

          {/* Account Status */}
          <div>
            <Title level={4}>Trạng thái tài khoản</Title>
            <Space wrap>
              <Tag color={user?.isPhoneVerified ? 'green' : 'orange'} icon={<PhoneOutlined />}>
                {user?.isPhoneVerified ? 'Đã xác thực số điện thoại' : 'Chưa xác thực số điện thoại'}
              </Tag>
              <Tag color={user?.isLocked ? 'red' : 'green'} icon={<SafetyOutlined />}>
                {user?.isLocked ? 'Tài khoản bị khóa' : 'Tài khoản hoạt động'}
              </Tag>
            </Space>
          </div>
        </Space>
      </Card>

      {/* Edit Profile Modal */}
      <Modal
        title="Chỉnh sửa thông tin cá nhân"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            fullName: user?.fullName || user?.name,
            phone: user?.phone
          }}
        >
          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[
              { required: true, message: 'Vui lòng nhập họ và tên!' },
              { min: 2, message: 'Họ và tên phải có ít nhất 2 ký tự!' }
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Nhập họ và tên đầy đủ" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại!' },
              { pattern: /^(0[3|5|7|8|9])+([0-9]{8})$/, message: 'Vui lòng nhập số điện thoại Việt Nam hợp lệ!' }
            ]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="Nhập số điện thoại" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" onClick={() => {
                // Handle profile update
                message.success('Thông tin đã được cập nhật');
                setEditModalVisible(false);
              }}>
                Cập nhật
              </Button>
              <Button onClick={() => setEditModalVisible(false)}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        title="Đổi mật khẩu"
        open={passwordModalVisible}
        onCancel={() => setPasswordModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Form.Item
            name="currentPassword"
            label="Mật khẩu hiện tại"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu hiện tại" />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
              { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự!' },
              { 
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                message: 'Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt!'
              }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu mới" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu mới"
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
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Nhập lại mật khẩu mới" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Đổi mật khẩu
              </Button>
              <Button onClick={() => setPasswordModalVisible(false)}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserProfile;
