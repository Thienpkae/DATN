import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Popconfirm,
  message,
  Tag,
  Row,
  Col,
  Statistic,
  Upload,
  DatePicker,
  Tooltip,
  Dropdown,
  Menu
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  TeamOutlined,
  UploadOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  ExportOutlined,
  UserAddOutlined,
  LockOutlined,
  UnlockOutlined
} from '@ant-design/icons';
import moment from 'moment';
import userService from '../../services/userService';
import authService from '../../services/auth';

const { Option } = Select;
const { Search } = Input;

const AdminAccountPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [filterOrg, setFilterOrg] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchUsers();
    fetchOrganizations();
    fetchStats();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.listUsers();
      const mapped = (data.users || []).map(u => ({
        id: u._id || u.cccd,
        userId: u.cccd,
        name: u.fullName,
        email: u.email || '',
        phone: u.phone,
        org: u.org,
        role: u.role,
        status: u.isLocked ? 'inactive' : 'active',
        createdAt: u.createdAt
      }));
      setUsers(mapped);
      setStats({
        totalUsers: data.total || mapped.length,
        activeUsers: mapped.filter(x => x.status === 'active').length,
        pendingUsers: 0,
        totalOrganizations: 3
      });
    } catch (error) {
      message.error(error.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      // Organization management requires additional backend endpoints
      setOrganizations([
        { id: 'Org1', name: 'Land Registry Authority' },
        { id: 'Org2', name: 'Government Office' },
        { id: 'Org3', name: 'Citizens' }
      ]);
    } catch (error) {
      message.error('Failed to fetch organizations');
    }
  };

  const fetchStats = async () => {
    try {
      // System stats would require additional backend endpoints
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        totalOrganizations: 3,
        systemHealth: 'Good'
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleNavigateToRegister = () => {
    navigate('/register', { state: { isAdminRegistration: true } });
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    form.setFieldsValue({
      ...user,
      dateOfBirth: user.dateOfBirth ? moment(user.dateOfBirth) : null
    });
    setModalVisible(true);
  };

  const handleDeleteUser = async (userId) => {
    try {
      await userService.deleteAccount(userId);
      message.success('User deleted successfully');
      fetchUsers();
      fetchStats();
    } catch (error) {
      message.error('Failed to delete user');
    }
  };

  const handleToggleUserStatus = async (userId, isActive) => {
    try {
      if (isActive) {
        await userService.lockUnlockAccount(userId, true);
        message.success('User deactivated successfully');
      } else {
        await userService.lockUnlockAccount(userId, false);
        message.success('User activated successfully');
      }
      fetchUsers();
      fetchStats();
    } catch (error) {
      message.error(`Failed to ${isActive ? 'deactivate' : 'activate'} user`);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const userData = {
        ...values,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : null
      };

      if (editingUser) {
        // User update functionality requires additional backend endpoints
        message.info('User update functionality requires additional backend endpoints');
      } else {
        // User creation uses the register endpoint
        await authService.register(userData);
        message.success('User created successfully');
      }

      setModalVisible(false);
      fetchUsers();
      fetchStats();
    } catch (error) {
      message.error(`Failed to ${editingUser ? 'update' : 'create'} user`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportUsers = async () => {
    try {
      // Export functionality requires additional backend endpoints
      message.info('User export functionality requires additional backend endpoints');
    } catch (error) {
      message.error('Failed to export users');
    }
  };

  const handleImportUsers = async (file) => {
    try {
      // Import functionality requires additional backend endpoints
      message.info('User import functionality requires additional backend endpoints');
      fetchUsers();
      fetchStats();
    } catch (error) {
      message.error('Failed to import users');
    }
    return false; // Prevent default upload behavior
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'red';
      case 'pending': return 'orange';
      default: return 'default';
    }
  };

  const getOrgColor = (org) => {
    switch (org) {
      case 'Org1': return 'blue';
      case 'Org2': return 'purple';
      case 'Org3': return 'cyan';
      default: return 'default';
    }
  };

  const getOrgName = (org) => {
    switch (org) {
      case 'Org1': return 'Land Authority';
      case 'Org2': return 'Notary Office';
      case 'Org3': return 'Citizens';
      default: return org;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchText.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchText.toLowerCase()) ||
                         user.userId?.toLowerCase().includes(searchText.toLowerCase());
    const matchesOrg = !filterOrg || user.org === filterOrg;
    const matchesStatus = !filterStatus || user.status === filterStatus;
    
    return matchesSearch && matchesOrg && matchesStatus;
  });

  const columns = [
    {
      title: 'User ID',
      dataIndex: 'userId',
      key: 'userId',
      sorter: (a, b) => a.userId.localeCompare(b.userId),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Organization',
      dataIndex: 'org',
      key: 'org',
      render: (org) => (
        <Tag color={getOrgColor(org)}>
          {getOrgName(org)}
        </Tag>
      ),
      filters: [
        { text: 'Land Authority', value: 'Org1' },
        { text: 'Notary Office', value: 'Org2' },
        { text: 'Citizens', value: 'Org3' },
      ],
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => <Tag>{role}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status?.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Inactive', value: 'inactive' },
        { text: 'Pending', value: 'pending' },
      ],
    },
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit User">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEditUser(record)}
            />
          </Tooltip>
          <Tooltip title={record.status === 'active' ? 'Deactivate' : 'Activate'}>
            <Button
              type="link"
              icon={record.status === 'active' ? <LockOutlined /> : <UnlockOutlined />}
              onClick={() => handleToggleUserStatus(record.id, record.status === 'active')}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this user?"
            onConfirm={() => handleDeleteUser(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete User">
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const actionMenu = (
    <Menu>
      <Menu.Item key="export" icon={<ExportOutlined />} onClick={handleExportUsers}>
        Export Users
      </Menu.Item>
      <Menu.Item key="import" icon={<UploadOutlined />}>
        <Upload
          accept=".csv,.xlsx"
          showUploadList={false}
          beforeUpload={handleImportUsers}
        >
          Import Users
        </Upload>
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="admin-account-page">
      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={stats.totalUsers || 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Users"
              value={stats.activeUsers || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Organizations"
              value={organizations.length}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending Approvals"
              value={stats.pendingUsers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Card
        title="User Account Management"
        extra={
          <Space>
            <Search
              placeholder="Search users..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
              prefix={<SearchOutlined />}
            />
            <Select
              placeholder="Filter by Organization"
              style={{ width: 180 }}
              value={filterOrg}
              onChange={setFilterOrg}
              allowClear
            >
              <Option value="org1">Land Authority</Option>
              <Option value="org2">Government Officers</Option>
              <Option value="org3">Citizens</Option>
            </Select>
            <Select
              placeholder="Filter by Status"
              style={{ width: 150 }}
              value={filterStatus}
              onChange={setFilterStatus}
              allowClear
            >
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
              <Option value="pending">Pending</Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={fetchUsers}>
              Refresh
            </Button>
            <Dropdown overlay={actionMenu} trigger={['click']}>
              <Button icon={<FilterOutlined />}>
                Actions
              </Button>
            </Dropdown>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateUser}
            >
              Create User
            </Button>
            <Button
              type="default"
              icon={<UserAddOutlined />}
              onClick={handleNavigateToRegister}
            >
              Register Admin Account
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} users`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Create/Edit User Modal */}
      <Modal
        title={editingUser ? 'Edit User' : 'Create New User'}
        visible={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            status: 'active',
            organization: 'org3'
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="userId"
                label="User ID"
                rules={[{ required: true, message: 'Please enter user ID' }]}
              >
                <Input placeholder="Enter user ID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: 'Please enter full name' }]}
              >
                <Input placeholder="Enter full name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
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
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Phone Number"
                rules={[{ required: true, message: 'Please enter phone number' }]}
              >
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="organization"
                label="Organization"
                rules={[{ required: true, message: 'Please select organization' }]}
              >
                <Select placeholder="Select organization">
                  <Option value="org1">Land Authority</Option>
                  <Option value="org2">Government Officers</Option>
                  <Option value="org3">Citizens</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="role"
                label="Role"
                rules={[{ required: true, message: 'Please enter role' }]}
              >
                <Input placeholder="Enter role" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select placeholder="Select status">
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                  <Option value="pending">Pending</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="dateOfBirth"
                label="Date of Birth"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="Address"
          >
            <Input.TextArea rows={3} placeholder="Enter address" />
          </Form.Item>

          {!editingUser && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    { required: true, message: 'Please enter password' },
                    { min: 8, message: 'Password must be at least 8 characters' }
                  ]}
                >
                  <Input.Password placeholder="Enter password" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="confirmPassword"
                  label="Confirm Password"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: 'Please confirm password' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Passwords do not match'));
                      },
                    }),
                  ]}
                >
                  <Input.Password placeholder="Confirm password" />
                </Form.Item>
              </Col>
            </Row>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default AdminAccountPage;
