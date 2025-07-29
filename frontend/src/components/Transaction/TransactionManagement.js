import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Modal, 
  Space, 
  Typography,
  Tag,
  message,
  Select
} from 'antd';
import { 
  EyeOutlined, 
  CheckOutlined, 
  CloseOutlined,
  SendOutlined
} from '@ant-design/icons';
import { transactionAPI } from '../../services/api';

const { Title } = Typography;
const { Option } = Select;

const TransactionManagement = ({ user }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewingTransaction, setViewingTransaction] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await transactionAPI.getAll();
      let filteredData = response.data || [];
      if (statusFilter) {
        filteredData = filteredData.filter(tx => tx.status === statusFilter);
      }
      setTransactions(filteredData);
    } catch (error) {
      message.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleProcessTransaction = async (txId) => {
    try {
      await transactionAPI.process(txId);
      message.success('Transaction processed successfully');
      fetchTransactions();
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to process transaction');
    }
  };

  const handleApproveTransaction = async (txId) => {
    try {
      await transactionAPI.approve(txId, { approveDetails: 'Approved by authority' });
      message.success('Transaction approved successfully');
      fetchTransactions();
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to approve transaction');
    }
  };

  const handleRejectTransaction = async (txId) => {
    try {
      await transactionAPI.reject(txId, { rejectDetails: 'Rejected by authority' });
      message.success('Transaction rejected');
      fetchTransactions();
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to reject transaction');
    }
  };

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
      title: 'From Owner',
      dataIndex: 'fromOwnerID',
      key: 'fromOwnerID',
    },
    {
      title: 'To Owner',
      dataIndex: 'toOwnerID',
      key: 'toOwnerID',
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
        <Space>
          <Button 
            icon={<EyeOutlined />} 
            onClick={() => {
              setViewingTransaction(record);
              setViewModalVisible(true);
            }}
          >
            View
          </Button>
          
          {user.org === 'Org2' && record.status === 'pending' && (
            <Button 
              type="primary"
              icon={<SendOutlined />}
              onClick={() => handleProcessTransaction(record.txID)}
            >
              Process
            </Button>
          )}
          
          {user.org === 'Org1' && record.status === 'processing' && (
            <>
              <Button 
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => handleApproveTransaction(record.txID)}
              >
                Approve
              </Button>
              <Button 
                danger
                icon={<CloseOutlined />}
                onClick={() => handleRejectTransaction(record.txID)}
              >
                Reject
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>Transaction Management</Title>
      
      <Card 
        title="Transactions" 
        extra={
          <Select 
            style={{ width: 150 }}
            placeholder="Filter by status"
            allowClear
            onChange={setStatusFilter}
          >
            <Option value="pending">Pending</Option>
            <Option value="processing">Processing</Option>
            <Option value="approved">Approved</Option>
            <Option value="rejected">Rejected</Option>
            <Option value="completed">Completed</Option>
          </Select>
        }
      >
        <Table
          columns={columns}
          dataSource={transactions}
          loading={loading}
          rowKey="txID"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="Transaction Details"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>
        ]}
        width={700}
      >
        {viewingTransaction && (
          <div>
            <p><strong>Transaction ID:</strong> {viewingTransaction.txID}</p>
            <p><strong>Type:</strong> {viewingTransaction.txType}</p>
            <p><strong>Land Parcel ID:</strong> {viewingTransaction.landParcelID}</p>
            <p><strong>From Owner:</strong> {viewingTransaction.fromOwnerID}</p>
            <p><strong>To Owner:</strong> {viewingTransaction.toOwnerID}</p>
            <p><strong>Status:</strong> 
              <Tag color={getStatusColor(viewingTransaction.status)} style={{ marginLeft: 8 }}>
                {viewingTransaction.status?.toUpperCase()}
              </Tag>
            </p>
            <p><strong>Details:</strong></p>
            <p>{viewingTransaction.details}</p>
            {viewingTransaction.timestamp && (
              <p><strong>Created:</strong> {new Date(viewingTransaction.timestamp).toLocaleString()}</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TransactionManagement;
