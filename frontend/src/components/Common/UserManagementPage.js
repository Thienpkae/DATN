import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Typography,
  Row,
  Col,
  Statistic,
  Avatar,
  Descriptions,
  Popconfirm
} from 'antd';
import {
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  LockOutlined,
  UnlockOutlined,
  TeamOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import apiService from '../../services/api';

const { Title, Text } = Typography;

/**
 * User Management Page - Manage system users
 * Available for Org1 and Org2 administrators
 */
const UserManagementPage = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('view'); // 'view', 'create', 'edit'
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    adminUsers: 0
  });

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUsers();
      setUsers(response.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiService.getUserStats();
      setStats(response.stats || {
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        adminUsers: 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setModalType('create');
    setModalVisible(true);
    form.resetFields();
  };

  const handleEditUser = (userRecord) => {
    setSelectedUser(userRecord);
    setModalType('edit');
    setModalVisible(true);
    form.setFieldsValue(userRecord);
  };

  const handleViewUser = (userRecord) => {
    setSelectedUser(userRecord);
    setModalType('view');
    setModalVisible(true);
  };

  const handleDeleteUser = async (userId) => {
    try {
      setLoading(true);
      await apiService.deleteUser(userId);
      message.success('User deleted successfully');
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error('Delete user error:', error);
      message.error('Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      setLoading(true);
      await apiService.updateUserStatus(userId, !currentStatus);
      message.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error('Toggle user status error:', error);
      message.error('Failed to update user status');
    } finally {
      setLoading(false);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (modalType === 'create') {
        await apiService.createUser(values);
        message.success('User created successfully');
      } else if (modalType === 'edit') {
        await apiService.updateUser(selectedUser.id, values);
        message.success('User updated successfully');
      }

      setModalVisible(false);
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error('User operation error:', error);
      message.error(`Failed to ${modalType} user`);
    } finally {
      setLoading(false);
    }
  };

  const getUserRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'red';
      case 'manager': return 'blue';
      case 'user': return 'green';
      default: return 'default';
    }
  };

  const getOrgColor = (org) => {
    switch (org) {
      case 'Org1': return 'blue';
      case 'Org2': return 'green';
      case 'Org3': return 'orange';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Avatar',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 80,
      render: (_, record) => (
        <Avatar
          size="large"
          style={{
            backgroundColor: record.active ? '#1890ff' : '#d9d9d9',
            color: '#ffffff'
          }}
        >
          {record.name?.charAt(0)?.toUpperCase() || 'U'}
        </Avatar>
      )
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 150
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200
    },
    {
      title: 'CCCD',
      dataIndex: 'cccd',
      key: 'cccd',
      width: 150,
      render: (text) => <Text code>{text}</Text>
    },
    {
      title: 'Organization',
      dataIndex: 'org',
      key: 'org',
      width: 120,
      render: (org) => <Tag color={getOrgColor(org)}>{org}</Tag>
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role) => <Tag color={getUserRoleColor(role)}>{role}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      width: 100,
      render: (active) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      )
    },
    {
      title: 'Last Login',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      width: 150,
      render: (date) => date ? new Date(date).toLocaleDateString('vi-VN') : 'Never'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewUser(record)}
          >
            View
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditUser(record)}
          >
            Edit
          </Button>
          <Button
            type="link"
            icon={record.active ? <LockOutlined /> : <UnlockOutlined />}
            onClick={() => handleToggleUserStatus(record.id, record.active)}
            style={{ color: record.active ? '#faad14' : '#52c41a' }}
          >
            {record.active ? 'Deactivate' : 'Activate'}
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this user?"
            onConfirm={() => handleDeleteUser(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="link"
              icon={<DeleteOutlined />}
              danger
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Title level={2}>User Management</Title>
          <Text type="secondary">
            Manage system users and their permissions
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateUser}
        >
          Add User
        </Button>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={stats.totalUsers}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Users"
              value={stats.activeUsers}
              valueStyle={{ color: '#52c41a' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Inactive Users"
              value={stats.inactiveUsers}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<LockOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Admin Users"
              value={stats.adminUsers}
              valueStyle={{ color: '#1890ff' }}
              prefix={<UserAddOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Users Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} users`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* User Modal */}
      <Modal
        title={
          modalType === 'view' ? 'User Details' :
          modalType === 'create' ? 'Create New User' :
          'Edit User'
        }
        open={modalVisible}
        onOk={modalType === 'view' ? () => setModalVisible(false) : handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={600}
        okText={modalType === 'view' ? 'Close' : modalType === 'create' ? 'Create' : 'Update'}
        confirmLoading={loading}
      >
        {modalType === 'view' && selectedUser ? (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Name" span={2}>
              {selectedUser.name}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {selectedUser.email}
            </Descriptions.Item>
            <Descriptions.Item label="CCCD">
              <Text code>{selectedUser.cccd}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Organization">
              <Tag color={getOrgColor(selectedUser.org)}>{selectedUser.org}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Role">
              <Tag color={getUserRoleColor(selectedUser.role)}>{selectedUser.role}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={selectedUser.active ? 'green' : 'red'}>
                {selectedUser.active ? 'Active' : 'Inactive'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Created Date">
              {new Date(selectedUser.createdAt).toLocaleString('vi-VN')}
            </Descriptions.Item>
            <Descriptions.Item label="Last Login">
              {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString('vi-VN') : 'Never'}
            </Descriptions.Item>
            <Descriptions.Item label="Last Updated">
              {new Date(selectedUser.updatedAt).toLocaleString('vi-VN')}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Form form={form} layout="vertical">
            <Form.Item
              name="name"
              label="Full Name"
              rules={[{ required: true, message: 'Please enter full name' }]}
            >
              <Input placeholder="Enter full name" />
            </Form.Item>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Please enter email' },
                { type: 'email', message: 'Please enter valid email' }
              ]}
            >
              <Input placeholder="Enter email address" />
            </Form.Item>
            <Form.Item
              name="cccd"
              label="CCCD"
              rules={[
                { required: true, message: 'Please enter CCCD' },
                { len: 12, message: 'CCCD must be 12 digits' }
              ]}
            >
              <Input placeholder="Enter 12-digit CCCD" maxLength={12} />
            </Form.Item>
            <Form.Item
              name="org"
              label="Organization"
              rules={[{ required: true, message: 'Please select organization' }]}
            >
              <Select placeholder="Select organization">
                <Select.Option value="Org1">Org1 - Land Registry Authority</Select.Option>
                <Select.Option value="Org2">Org2 - Government Office</Select.Option>
                <Select.Option value="Org3">Org3 - Citizens</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="role"
              label="Role"
              rules={[{ required: true, message: 'Please select role' }]}
            >
              <Select placeholder="Select role">
                <Select.Option value="Admin">Admin</Select.Option>
                <Select.Option value="Manager">Manager</Select.Option>
                <Select.Option value="User">User</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="active"
              label="Active Status"
              valuePropName="checked"
            >
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            </Form.Item>
            {modalType === 'create' && (
              <Form.Item
                name="password"
                label="Password"
                rules={[
                  { required: true, message: 'Please enter password' },
                  { min: 6, message: 'Password must be at least 6 characters' }
                ]}
              >
                <Input.Password placeholder="Enter password" />
              </Form.Item>
            )}
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default UserManagementPage;
