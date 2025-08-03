import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  message,
  Tabs,
  Input,
  Select
} from 'antd';
import {
  SwapOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import apiService from '../../../services/api';
import TransactionApprovalPage from './TransactionApprovalPage';

const { Title, Text } = Typography;

/**
 * Transaction Management Module for Org1 (Land Registry Authority)
 * Main module containing all transaction-related functions with tab navigation
 */
const TransactionManagementModule = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState('view');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllTransactions({ limit: 100 });
      setTransactions(response.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      message.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'orange',
      'approved': 'green',
      'rejected': 'red',
      'completed': 'blue',
      'processing': 'cyan'
    };
    return colors[status] || 'default';
  };

  const getTypeColor = (type) => {
    const colors = {
      'transfer': 'blue',
      'split': 'green',
      'merge': 'orange',
      'change_purpose': 'purple',
      'reissue': 'cyan'
    };
    return colors[type] || 'default';
  };

  const columns = [
    {
      title: 'Transaction ID',
      dataIndex: 'txID',
      key: 'txID',
      render: (id) => <Text strong>{id}</Text>
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag color={getTypeColor(type)}>{type?.toUpperCase()}</Tag>
    },
    {
      title: 'Land Parcel ID',
      dataIndex: 'landParcelID',
      key: 'landParcelID'
    },
    {
      title: 'Owner ID',
      dataIndex: 'ownerID',
      key: 'ownerID'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{status?.toUpperCase()}</Tag>
    },
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => date ? new Date(date).toLocaleDateString('vi-VN') : 'N/A'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => message.info('View transaction details')}
          >
            View
          </Button>
          {record.status === 'pending' && (
            <Button
              type="primary"
              size="small"
              onClick={() => setActiveTab('approval')}
            >
              Review
            </Button>
          )}
        </Space>
      )
    }
  ];

  const renderTransactionsList = () => {
    const filteredTransactions = transactions.filter(tx => {
      const matchesSearch = tx.txID?.toLowerCase().includes(searchText.toLowerCase()) ||
                           tx.landParcelID?.toLowerCase().includes(searchText.toLowerCase()) ||
                           tx.ownerID?.toLowerCase().includes(searchText.toLowerCase());
      const matchesStatus = !statusFilter || tx.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return (
      <div>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4}>Transactions</Title>
          <Space>
            <Select
              placeholder="Filter by status"
              style={{ width: 150 }}
              allowClear
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Select.Option value="pending">Pending</Select.Option>
              <Select.Option value="approved">Approved</Select.Option>
              <Select.Option value="rejected">Rejected</Select.Option>
              <Select.Option value="completed">Completed</Select.Option>
            </Select>
            <Input.Search
              placeholder="Search transactions..."
              allowClear
              style={{ width: 300 }}
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => setActiveTab('approval')}
            >
              Review Pending
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filteredTransactions}
          rowKey="txID"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} transactions`
          }}
        />
      </div>
    );
  };

  const tabItems = [
    {
      key: 'view',
      label: (
        <span>
          <FileTextOutlined />
          View Transactions
        </span>
      ),
      children: renderTransactionsList()
    },
    {
      key: 'approval',
      label: (
        <span>
          <CheckCircleOutlined />
          Approve/Reject Transactions
        </span>
      ),
      children: <TransactionApprovalPage user={user} onUpdate={() => {
        fetchTransactions();
        setActiveTab('view');
      }} />
    }
  ];

  return (
    <div style={{
      padding: '24px',
      background: 'transparent',
      minHeight: '100vh'
    }}>
      <div style={{
        marginBottom: '24px',
        padding: '24px',
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e8e8e8',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <Title level={2} style={{ color: '#1f1f1f', margin: 0, marginBottom: '8px' }}>
          <SwapOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          Transaction Management Module
        </Title>
        <Text type="secondary" style={{ color: '#666666' }}>
          Review, approve, and manage land transaction requests
        </Text>
      </div>

      <Card style={{
        background: '#ffffff',
        border: '1px solid #e8e8e8',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>
    </div>
  );
};

export default TransactionManagementModule;
