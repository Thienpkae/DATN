import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  message, 
  Space, 
  Typography 
} from 'antd';
import { LockOutlined, UnlockOutlined } from '@ant-design/icons';
import apiService from '../../services/api';

const { Title } = Typography;

const UserManagement = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // For now, we'll show empty list since there's no user listing API
      // In a real implementation, you'd need a backend endpoint to list users
      setUsers([]);
      message.info('Chức năng liệt kê người dùng cần thêm các endpoint backend');
    } catch (error) {
      console.error('Lỗi khi lấy danh sách người dùng:', error);
      message.error(error.message || 'Không thể lấy danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleLockUnlock = async (targetCccd, lock) => {
    try {
      await apiService.lockUnlockAccount(targetCccd, lock);
      message.success(`Người dùng đã được ${lock ? 'khóa' : 'mở khóa'} thành công`);
      fetchUsers();
    } catch (error) {
      console.error('Lỗi khóa/mở khóa người dùng:', error);
      message.error(error.message || 'Không thể cập nhật trạng thái người dùng');
    }
  };

  const columns = [
    {
      title: 'ID người dùng',
      dataIndex: 'userId',
      key: 'userId',
    },
    {
      title: 'Họ và tên',
      dataIndex: 'fullName',
      key: 'fullName',
    },
    {
      title: 'Tổ chức',
      dataIndex: 'org',
      key: 'org',
      render: (org) => (
        <span className={`org${org.slice(-1)}-badge`}>
          {org}
        </span>
      ),
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isLocked',
      key: 'isLocked',
      render: (isLocked) => (
        <span className={`transaction-status ${isLocked ? 'status-rejected' : 'status-approved'}`}>
          {isLocked ? 'Đã khóa' : 'Hoạt động'}
        </span>
      ),
    },
    {
      title: 'Xác thực điện thoại',
      dataIndex: 'isPhoneVerified',
      key: 'isPhoneVerified',
      render: (verified) => verified ? 'Có' : 'Chưa',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={record.isLocked ? <UnlockOutlined /> : <LockOutlined />}
            type={record.isLocked ? "primary" : "danger"}
            onClick={() => handleLockUnlock(record.userId, !record.isLocked)}
          >
            {record.isLocked ? 'Mở khóa' : 'Khóa'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={2}>Quản lý người dùng</Title>
        <p>Quản lý tài khoản người dùng trong hệ thống</p>
        
        <Table
          columns={columns}
          dataSource={users}
          loading={loading}
          rowKey="userId"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} người dùng`,
          }}
        />
      </Card>
    </div>
  );
};

export default UserManagement;
