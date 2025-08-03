import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Typography,
  Tag,
  message
} from 'antd';
import { 
  CheckOutlined
} from '@ant-design/icons';
import apiService from '../../services/api';

const { Title } = Typography;

const TransactionProcessing = ({ user }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPendingTransactions = useCallback(async () => {
    setLoading(true);
    try {
      // For now, get all transactions and filter by status
      if (user?.userId) {
        const response = await apiService.getTransactionsByOwner(user.userId);
        const pendingTransactions = Array.isArray(response)
          ? response.filter(tx => tx.status === 'pending' || tx.status === 'processing')
          : [];
        setTransactions(pendingTransactions);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('Fetch pending transactions error:', error);
      message.error(error.message || 'Failed to fetch pending transactions');
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    fetchPendingTransactions();
  }, [fetchPendingTransactions]);

  const handleProcessTransaction = async (txId) => {
    try {
      await apiService.processTransaction(txId);
      message.success('Transaction processed and forwarded to authority');
      fetchPendingTransactions();
    } catch (error) {
      console.error('Process transaction error:', error);
      message.error(error.message || 'Failed to process transaction');
    }
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
      title: 'From Owner',
      dataIndex: 'fromOwnerID',
      key: 'fromOwnerID',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color="orange">
          {status?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Submitted',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => timestamp ? new Date(timestamp).toLocaleDateString() : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => handleProcessTransaction(record.txID)}
          >
            Process & Forward
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>Transaction Processing</Title>
      
      <Card title={`Pending Transactions (${transactions.length})`}>
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

export default TransactionProcessing;
