import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Table,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Typography,
  Tag,
  Avatar,
  Popconfirm,
  message,
  Statistic
} from 'antd';
import {
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  TeamOutlined,
  SafetyOutlined,
  SearchOutlined
} from '@ant-design/icons';
import apiService from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const UserManagementPage = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    fetchUsers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // For demo purposes, show current user and some sample structure
      const currentUser = {
        id: user?.userId || '1',
        username: user?.username || user?.userId,
        fullName: user?.fullName || 'Current User',
        org: user?.org || 'Org3',
        role: user?.role || 'user',
        status: 'active',
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      
      setUsers([currentUser]);
      message.info('User management requires additional backend endpoints for full functionality');
    } catch (error) {
      console.error('Fetch users error:', error);
      message.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditUser = (record) => {
    setEditingUser(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDeleteUser = async (userId) => {
    try {
      await apiService.deleteAccount(userId);
      message.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Delete user error:', error);
      message.error(error.message || 'Failed to delete user');
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const shouldLock = currentStatus === 'active';
      await apiService.lockUnlockAccount(userId, shouldLock);
      message.success(`User ${shouldLock ? 'locked' : 'unlocked'} successfully`);
      fetchUsers();
    } catch (error) {
      console.error('Toggle user status error:', error);
      message.error(error.message || 'Failed to update user status');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (editingUser) {
        // Update user - requires additional backend endpoint
        message.info('User update functionality requires additional backend endpoints');
      } else {
        // Create new user
        await apiService.register(values);
        message.success('User created successfully');
      }

      setModalVisible(false);
      fetchUsers();
    } catch (error) {
      console.error('Save user error:', error);
      message.error(error.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredUsers = () => {
    if (!searchText) return users;
    
    return users.filter(user =>
      user.username?.toLowerCase().includes(searchText.toLowerCase()) ||
      user.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
      user.org?.toLowerCase().includes(searchText.toLowerCase())
    );
  };

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.fullName}</div>
            <div style={{ color: '#666', fontSize: '12px' }}>@{record.username}</div>
          </div>
        </Space>
      )
    },
    {
      title: 'Organization',
      dataIndex: 'org',
      key: 'org',
      render: (org) => {
        const orgNames = {
          'Org1': 'Land Registry Authority',
          'Org2': 'Government Office',
          'Org3': 'Citizens'
        };
        return <Tag color="blue">{orgNames[org] || org}</Tag>;
      }
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const colors = {
          'admin': 'red',
          'super_admin': 'purple',
          'user': 'green'
        };
        return <Tag color={colors[role] || 'default'}>{role}</Tag>;
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? 'Active' : 'Locked'}
        </Tag>
      )
    },
    {
      title: 'Last Login',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'Never'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditUser(record)}
          >
            Edit
          </Button>
          <Button
            type="link"
            icon={record.status === 'active' ? <LockOutlined /> : <UnlockOutlined />}
            onClick={() => handleToggleUserStatus(record.id, record.status)}
          >
            {record.status === 'active' ? 'Lock' : 'Unlock'}
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this user?"
            onConfirm={() => handleDeleteUser(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    locked: users.filter(u => u.status === 'locked').length,
    admins: users.filter(u => u.role === 'admin' || u.role === 'super_admin').length
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <TeamOutlined style={{ marginRight: '8px' }} />
          User Management
        </Title>
        <Text type="secondary">
          Manage user accounts, roles, and permissions
        </Text>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={stats.total}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Users"
              value={stats.active}
              prefix={<SafetyOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Locked Users"
              value={stats.locked}
              prefix={<LockOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Administrators"
              value={stats.admins}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Actions and Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search users..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateUser}
            >
              Add New User
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Users Table */}
      <Card title="Users">
        <Table
          columns={columns}
          dataSource={getFilteredUsers()}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`
          }}
        />
      </Card>

      {/* Create/Edit User Modal */}
      <Modal
        title={editingUser ? 'Edit User' : 'Create New User'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ role: 'user', org: 'Org3' }}
        >
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
                name="cccd"
                label="CCCD"
                rules={[
                  { required: true, message: 'Please enter CCCD' },
                  { pattern: /^\d{12}$/, message: 'CCCD must be 12 digits' }
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Phone Number"
                rules={[
                  { required: true, message: 'Please enter phone number' },
                  { pattern: /^(0[3|5|7|8|9])+([0-9]{8})$/, message: 'Invalid phone format' }
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="org"
                label="Organization"
                rules={[{ required: true, message: 'Please select organization' }]}
              >
                <Select>
                  <Option value="Org1">Land Registry Authority</Option>
                  <Option value="Org2">Government Office</Option>
                  <Option value="Org3">Citizens</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="Role"
                rules={[{ required: true, message: 'Please select role' }]}
              >
                <Select>
                  <Option value="user">User</Option>
                  <Option value="admin">Admin</Option>
                  <Option value="super_admin">Super Admin</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="password"
                label="Password"
                rules={[
                  { required: !editingUser, message: 'Please enter password' },
                  { min: 8, message: 'Password must be at least 8 characters' }
                ]}
              >
                <Input.Password />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagementPage;
