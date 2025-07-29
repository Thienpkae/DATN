import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Typography, message, Button, Tag } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { transactionAPI } from '../../services/api';

const { Title } = Typography;

const MyTransactions = ({ user }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMyTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await transactionAPI.getByUser(user.userId);
      setTransactions(response.data || []);
    } catch (error) {
      message.error('Failed to fetch my transactions');
    } finally {
      setLoading(false);
    }
  }, [user.userId]);

  useEffect(() => {
    fetchMyTransactions();
  }, [fetchMyTransactions]);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'orange',
      processing: 'blue',
      approved: 'green',
      rejected: 'red',
      completed: 'purple'
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: 'Transaction ID',
      dataIndex: 'txID',
      key: 'txID',
    },
    {
      title: 'Type',
      dataIndex: 'txType',
      key: 'txType',
    },
    {
      title: 'Land Parcel ID',
      dataIndex: 'landParcelID',
      key: 'landParcelID',
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
    },
    {
      title: 'Created',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => timestamp ? new Date(timestamp).toLocaleDateString() : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button icon={<EyeOutlined />}>
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>My Transactions</Title>
      
      <Card title={`Your Transactions (${transactions.length})`}>
        <Table
          columns={columns}
          dataSource={transactions}
          loading={loading}
          rowKey="txID"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default MyTransactions;
