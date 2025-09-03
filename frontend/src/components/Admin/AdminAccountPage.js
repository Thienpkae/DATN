import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
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
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  TeamOutlined,
  SearchOutlined,
  ReloadOutlined,
  LockOutlined,
  UnlockOutlined
} from '@ant-design/icons';
import userService from '../../services/userService';
import { normalizeVietnameseName } from '../../utils/text';
import authService from '../../services/auth';

const { Option } = Select;
const { Search } = Input;

const AdminAccountPage = () => {
  // const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [stats, setStats] = useState({});
  
  // Thêm state cho modal lý do khóa/mở khóa
  const [reasonModalVisible, setReasonModalVisible] = useState(false);
  const [reasonForm] = Form.useForm();
  const [pendingLockAction, setPendingLockAction] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const currentAdmin = authService.getCurrentUser();
      const adminOrg = currentAdmin?.org;
      const data = await userService.listUsers({ org: adminOrg });
      const mapped = (data.users || []).map(u => ({
        id: u._id || u.cccd,
        userId: u.cccd,
        name: normalizeVietnameseName(u.fullName),
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
        lockedUsers: mapped.filter(x => x.status === 'inactive').length,
      });
    } catch (error) {
      message.error(error.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // System stats would require additional backend endpoints
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        
        systemHealth: 'Good'
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // Frontend validator to mirror backend Vietnamese phone regex
  const isValidVietnamPhone = (value) => {
    const v = String(value || '');
    // Only allow format starting with 0 and valid carrier prefixes, total 10 digits
    return /^0(3[2-9]|5[689]|7[06-9]|8[1-9]|9\d)\d{7}$/.test(v);
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  // Navigation actions for admin registration removed per new policy

  const handleEditUser = (user) => {
    setEditingUser(user);
    form.setFieldsValue({
      ...user
    });
    setModalVisible(true);
  };

  const handleDeleteUser = async (userId) => {
    try {
      await userService.deleteAccount(userId);
      message.success('Xóa người dùng thành công');
      fetchUsers();
      fetchStats();
    } catch (error) {
      message.error(error?.response?.data?.error || error.message || 'Xóa người dùng thất bại');
    }
  };

  // Hiển thị modal nhập lý do
  const showReasonModal = (userId, isActive) => {
    setPendingLockAction({ userId, lock: isActive });
    reasonForm.resetFields();
    setReasonModalVisible(true);
  };

  // Xử lý xác nhận khóa/mở khóa với lý do
  const handleReasonModalOk = async () => {
    try {
      const values = await reasonForm.validateFields();
      const { userId, lock } = pendingLockAction;
      const reason = values.reason?.trim() || '';
      
      setLoading(true);
      await userService.lockUnlockAccount(userId, lock, reason);
      
      const actionText = lock ? 'vô hiệu hóa' : 'kích hoạt';
      message.success(`Đã ${actionText} tài khoản${reason ? ' với lý do: ' + reason : ''}`);
      
      setReasonModalVisible(false);
      setPendingLockAction(null);
      fetchUsers();
      fetchStats();
    } catch (error) {
      const actionText = pendingLockAction?.lock ? 'vô hiệu hóa' : 'kích hoạt';
      message.error(error?.response?.data?.error || error.message || `Không thể ${actionText} tài khoản`);
    } finally {
      setLoading(false);
    }
  };

  // Hủy modal lý do
  const handleReasonModalCancel = () => {
    setReasonModalVisible(false);
    setPendingLockAction(null);
    reasonForm.resetFields();
  };

  const handleToggleUserStatus = (userId, isActive) => {
    showReasonModal(userId, isActive);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const currentAdmin = authService.getCurrentUser();
      // Normalize inputs
      const normalizedCccd = String(values.userId || '').replace(/\D/g, '');
      const normalizedPhone = String(values.phone || '').replace(/\D/g, '');
      const trimmedName = String(values.name || '').trim();

      // Client-side duplicate checks to give fast feedback (create only)
      if (!editingUser) {
        const existingCccd = users.find(u => String(u.userId) === normalizedCccd);
        if (existingCccd) {
          message.error('CCCD đã tồn tại trong hệ thống');
          return;
        }
        const existingPhone = users.find(u => String(u.phone) === normalizedPhone);
        if (existingPhone) {
          message.error('Số điện thoại đã tồn tại trong hệ thống');
          return;
        }
      }

      const userData = {
        org: currentAdmin?.org,
        cccd: normalizedCccd,
        phone: normalizedPhone,
        fullName: trimmedName,
        password: values.password,
        role: values.role || 'user'
      };

      if (editingUser) {
        // Update allowed fields except CCCD
        const payload = { fullName: trimmedName, phone: normalizedPhone, role: values.role || 'user' };
        try {
          await userService.updateByCccd(editingUser.userId, payload);
          message.success('Cập nhật người dùng thành công');
        } catch (err) {
          message.error(err?.message || err?.response?.data?.error || 'Cập nhật người dùng thất bại');
          return;
        }
      } else {
        // User creation (backend now activates immediately and returns success)
        const result = await authService.register(userData);
        message.success(result?.message || 'Tạo tài khoản và kích hoạt thành công. Mật khẩu đã được gửi tới SĐT.');
      }

      setModalVisible(false);
      fetchUsers();
      fetchStats();
    } catch (error) {
      if (error && error.errorFields) {
        message.warning('Vui lòng kiểm tra và điền đầy đủ thông tin hợp lệ');
      } else {
        // Surface specific backend messages for duplicates and policy checks
        const apiMsg = error?.response?.data?.error || error.message;
        if (apiMsg) {
          if (/CCCD/i.test(apiMsg) && /tồn tại|exists/i.test(apiMsg)) {
            message.error('CCCD đã tồn tại');
          } else if (/điện thoại|phone/i.test(apiMsg) && /tồn tại|exists/i.test(apiMsg)) {
            message.error('Số điện thoại đã tồn tại');
          } else if (/Admin can only register users in their own organization/i.test(apiMsg)) {
            message.error('Admin chỉ được tạo tài khoản trong tổ chức của mình');
          } else {
            message.error(apiMsg);
          }
        } else {
          message.error(`Không thể ${editingUser ? 'cập nhật' : 'tạo'} người dùng`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Import/Export actions removed from toolbar

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'inactive': return 'red';
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
      case 'Org1': return 'Sở Tài nguyên & Môi trường';
      case 'Org2': return 'Đơn vị hành chính cấp xã';
      case 'Org3': return 'Công dân';
      default: return org;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchText.toLowerCase()) ||
                         user.userId?.toLowerCase().includes(searchText.toLowerCase());
    const currentAdmin = authService.getCurrentUser();
    const adminOrg = currentAdmin?.org;
    const matchesOrg = !adminOrg || user.org === adminOrg;
    const matchesStatus = !filterStatus || user.status === filterStatus;
    
    return matchesSearch && matchesOrg && matchesStatus;
  });

  const columns = [
    {
      title: 'CCCD',
      dataIndex: 'userId',
      key: 'userId',
      sorter: (a, b) => a.userId.localeCompare(b.userId),
    },
    {
      title: 'Họ và tên',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    // Email removed; backend has no email field
    {
      title: 'Tổ chức',
      dataIndex: 'org',
      key: 'org',
      render: (org) => (
        <Tag color={getOrgColor(org)}>
          {getOrgName(org)}
        </Tag>
      )
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role) => <Tag>{role === 'admin' ? 'Quản trị viên' : 'Người dùng'}</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status === 'active' ? 'Hoạt động' : 'Đã khóa'}
        </Tag>
      ),
      filters: [
        { text: 'Hoạt động', value: 'active' },
        { text: 'Đã khóa', value: 'inactive' },
      ],      
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEditUser(record)}
            />
          </Tooltip>
          {(() => {
            const isAdminAccount = String(record.role).toLowerCase() === 'admin';
            const current = authService.getCurrentUser();
            const isSelf = current && String(current.userId) === String(record.userId);
            const lockDisabled = isAdminAccount || isSelf; // do not allow deactivating admin or yourself
            const deleteDisabled = isAdminAccount || isSelf; // do not allow deleting admin or yourself
            return (
              <>
                <Tooltip title={lockDisabled ? 'Không thể vô hiệu hóa tài khoản admin hoặc tài khoản của chính bạn' : (record.status === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt')}>
                  <Button
                    type="link"
                    icon={record.status === 'active' ? <LockOutlined /> : <UnlockOutlined />}
                    disabled={lockDisabled}
                    onClick={() => !lockDisabled && handleToggleUserStatus(record.userId, record.status === 'active')}
                  />
                </Tooltip>
                {deleteDisabled ? (
                  <Tooltip title="Không thể xóa tài khoản admin hoặc tài khoản của chính bạn">
                    <Button type="link" danger icon={<DeleteOutlined />} disabled />
                  </Tooltip>
                ) : (
                  <Popconfirm
                    title="Bạn có chắc muốn xóa người dùng này?"
                    onConfirm={() => handleDeleteUser(record.userId)}
                    okText="Xóa"
                    cancelText="Hủy"
                  >
                    <Tooltip title="Xóa người dùng">
                      <Button type="link" danger icon={<DeleteOutlined />} />
                    </Tooltip>
                  </Popconfirm>
                )}
              </>
            );
          })()}
        </Space>
      ),
    },
  ];

  return (
    <div className="admin-account-page">
      {/* Thống kê nhanh */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng số người dùng"
              value={stats.totalUsers || 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đang hoạt động"
              value={stats.activeUsers || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đã khóa"
              value={stats.lockedUsers || 0}
              prefix={<LockOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>


      {/* Main Content */}
      <Card
        title="Quản lý tài khoản"
        extra={
          <Space>
            <Search
              placeholder="Tìm kiếm người dùng..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
              prefix={<SearchOutlined />}
            />
            <Select
              placeholder="Lọc theo trạng thái"
              style={{ width: 180 }}
              value={filterStatus}
              onChange={setFilterStatus}
              allowClear
              options={[
                { label: 'Hoạt động', value: 'active' },
                { label: 'Đã khóa', value: 'inactive' },                
              ]}
            >
              <Option value="active">Hoạt động</Option>
              <Option value="inactive">Đã khóa</Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={fetchUsers}>
              Tải lại
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateUser}
            >
              Tạo người dùng
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="userId"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} trong ${total} người dùng`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Create/Edit User Modal */}
      <Modal
        title={editingUser ? 'Chỉnh sửa người dùng' : 'Tạo người dùng mới'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            role: 'user'
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="userId"
                label="CCCD"
                rules={[
                  { required: true, message: 'Vui lòng nhập CCCD' },
                  { validator: (_, v) => (/^\d{12}$/.test(v || '') ? Promise.resolve() : Promise.reject(new Error('CCCD phải gồm 12 chữ số'))) }
                ]}
              >
                <Input
                  placeholder="Nhập CCCD"
                  maxLength={12}
                  disabled={!!editingUser}
                  onKeyPress={(e) => {
                    if (!/\d/.test(e.key)) e.preventDefault();
                  }}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 12);
                    form.setFieldsValue({ userId: digits });
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Họ và tên"
                rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
              >
                <Input placeholder="Nhập họ và tên" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại' },
                  {
                    validator: (_, v) =>
                      isValidVietnamPhone(v)
                        ? Promise.resolve()
                        : Promise.reject(new Error('Số điện thoại Việt Nam không hợp lệ (vd: 03x/05x/07x/08x/09x + 7 số)'))
                  }
                ]}
              >
                <Input
                  placeholder="Nhập số điện thoại"
                  maxLength={10}
                  onKeyPress={(e) => {
                    if (!/\d/.test(e.key)) e.preventDefault();
                  }}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    form.setFieldsValue({ phone: digits });
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="role"
                label="Vai trò"
                rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
              >
                <Select placeholder="Chọn vai trò">
                  <Option value="user">Người dùng</Option>
                  <Option value="admin">Quản trị viên</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Organization is auto-assigned to current admin's organization on submit */}

          {!editingUser && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="password"
                  label="Mật khẩu"
                  rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu' },
                    {
                      validator: (_, v) => {
                        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
                        return regex.test(v || '')
                          ? Promise.resolve()
                          : Promise.reject(new Error('Mật khẩu tối thiểu 8 ký tự và bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt'));
                      }
                    }
                  ]}
                >
                  <Input.Password placeholder="Nhập mật khẩu" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="confirmPassword"
                  label="Xác nhận mật khẩu"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Mật khẩu không khớp'));
                      },
                    }),
                  ]}
                >
                  <Input.Password placeholder="Nhập lại mật khẩu" />
                </Form.Item>
              </Col>
            </Row>
          )}
        </Form>
      </Modal>

      {/* Modal lý do khóa/mở khóa tài khoản */}
      <Modal
        title={
          pendingLockAction?.lock 
            ? `🔒 Khóa tài khoản` 
            : `🔓 Mở khóa tài khoản`
        }
        open={reasonModalVisible}
        onOk={handleReasonModalOk}
        onCancel={handleReasonModalCancel}
        confirmLoading={loading}
        width={500}
        okText={pendingLockAction?.lock ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
        cancelText="Hủy"
      >
        <Form
          form={reasonForm}
          layout="vertical"
        >
          <Form.Item
            label={
              <span>
                {pendingLockAction?.lock ? 'Lý do khóa tài khoản' : 'Lý do mở khóa tài khoản'}
                <span style={{ color: '#999', marginLeft: 8 }}>(Tùy chọn)</span>
              </span>
            }
            name="reason"
            rules={[
              {
                max: 500,
                message: 'Lý do không được vượt quá 500 ký tự'
              }
            ]}
          >
            <Input.TextArea
              placeholder={`Nhập lý do ${pendingLockAction?.lock ? 'khóa' : 'mở khóa'} tài khoản (tùy chọn)...`}
              rows={4}
              showCount
              maxLength={500}
            />
          </Form.Item>
        </Form>
        
        <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f6f8fa', borderRadius: 6 }}>
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
            ℹ️ {pendingLockAction?.lock 
              ? 'Người dùng sẽ nhận được SMS và thông báo về việc tài khoản bị khóa.'
              : 'Người dùng sẽ nhận được SMS và thông báo về việc tài khoản được mở khóa.'
            }
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default AdminAccountPage;
