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
import { adminAPI } from '../../services/api';

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
      // This would need a user management API
      setUsers([]);
    } catch (error) {
      message.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleLockUnlock = async (userId, lock) => {
    try {
      await adminAPI.lockUnlockAccount({ targetUserId: userId, lock });
      message.success(`User ${lock ? 'locked' : 'unlocked'} successfully`);
      fetchUsers();
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to update user status');
    }
  };

  const columns = [
    {
      title: 'User ID',
      dataIndex: 'userId',
      key: 'userId',
    },
    {
      title: 'Full Name',
      dataIndex: 'fullName',
      key: 'fullName',
    },
    {
      title: 'Organization',
      dataIndex: 'org',
      key: 'org',
      render: (org) => (
        <span className={`org${org.slice(-1)}-badge`}>
          {org}
        </span>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Status',
      dataIndex: 'isLocked',
      key: 'isLocked',
      render: (isLocked) => (
        <span className={`transaction-status ${isLocked ? 'status-rejected' : 'status-approved'}`}>
          {isLocked ? 'Locked' : 'Active'}
        </span>
      ),
    },
    {
      title: 'Phone Verified',
      dataIndex: 'isPhoneVerified',
      key: 'isPhoneVerified',
      render: (verified) => verified ? 'Yes' : 'No',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={record.isLocked ? <UnlockOutlined /> : <LockOutlined />}
            type={record.isLocked ? "primary" : "danger"}
            onClick={() => handleLockUnlock(record.userId, !record.isLocked)}
          >
            {record.isLocked ? 'Unlock' : 'Lock'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>User Management</Title>
      
      <Card title="System Users">
        <Table
          columns={columns}
          dataSource={users}
          loading={loading}
          rowKey="userId"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default UserManagement;
