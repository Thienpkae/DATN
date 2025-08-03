import React, { useState, useEffect } from 'react';
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
  message,
  Descriptions,
  Typography,
  Row,
  Col,
  Statistic,
  Progress
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  FileTextOutlined,
  SwapOutlined,
  SplitCellsOutlined,
  MergeOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import apiService from '../../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

/**
 * Transaction Management Page for Org1 (Land Registry Authority)
 * Handles approval/rejection of transfer, split, and merge requests
 */
const TransactionManagementPage = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionType, setActionType] = useState(''); // 'approve' or 'reject'
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });

  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllTransactions();
      setTransactions(response.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      message.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiService.getTransactionStats();
      setStats(response.stats || {
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setModalVisible(true);
    setActionType('view');
  };

  const handleApproveTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setModalVisible(true);
    setActionType('approve');
    form.resetFields();
  };

  const handleRejectTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setModalVisible(true);
    setActionType('reject');
    form.resetFields();
  };

  const handleModalOk = async () => {
    if (actionType === 'view') {
      setModalVisible(false);
      return;
    }

    try {
      const values = await form.validateFields();
      setLoading(true);

      if (actionType === 'approve') {
        await apiService.approveTransaction(selectedTransaction.txID, {
          approverComments: values.comments || '',
          approvedBy: user.cccd
        });
        message.success('Transaction approved successfully');
      } else if (actionType === 'reject') {
        await apiService.rejectTransaction(selectedTransaction.txID, {
          rejectionReason: values.reason,
          rejectionComments: values.comments || '',
          rejectedBy: user.cccd
        });
        message.success('Transaction rejected successfully');
      }

      setModalVisible(false);
      fetchTransactions();
      fetchStats();
    } catch (error) {
      console.error('Transaction action error:', error);
      message.error(error.message || `Failed to ${actionType} transaction`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'orange';
      case 'approved': return 'green';
      case 'rejected': return 'red';
      case 'completed': return 'blue';
      default: return 'default';
    }
  };

  const getTransactionTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'transfer': return <SwapOutlined />;
      case 'split': return <SplitCellsOutlined />;
      case 'merge': return <MergeOutlined />;
      default: return <FileTextOutlined />;
    }
  };

  const columns = [
    {
      title: 'Transaction ID',
      dataIndex: 'txID',
      key: 'txID',
      width: 150,
      render: (text) => <Text code>{text}</Text>
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => (
        <Space>
          {getTransactionTypeIcon(type)}
          <Text>{type}</Text>
        </Space>
      )
    },
    {
      title: 'Land Parcel ID',
      dataIndex: 'landParcelID',
      key: 'landParcelID',
      width: 150,
      render: (text) => <Text code>{text}</Text>
    },
    {
      title: 'From Owner',
      dataIndex: 'fromOwnerID',
      key: 'fromOwnerID',
      width: 150,
      render: (text) => <Text>{text}</Text>
    },
    {
      title: 'To Owner',
      dataIndex: 'toOwnerID',
      key: 'toOwnerID',
      width: 150,
      render: (text) => <Text>{text || 'N/A'}</Text>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)} icon={<ClockCircleOutlined />}>
          {status}
        </Tag>
      )
    },
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date) => new Date(date).toLocaleDateString('vi-VN')
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
            onClick={() => handleViewTransaction(record)}
          >
            View
          </Button>
          {record.status === 'Pending' && (
            <>
              <Button
                type="link"
                icon={<CheckCircleOutlined />}
                onClick={() => handleApproveTransaction(record)}
                style={{ color: '#52c41a' }}
              >
                Approve
              </Button>
              <Button
                type="link"
                icon={<CloseCircleOutlined />}
                onClick={() => handleRejectTransaction(record)}
                danger
              >
                Reject
              </Button>
            </>
          )}
        </Space>
      )
    }
  ];

  const renderTransactionDetails = () => {
    if (!selectedTransaction) return null;

    return (
      <Descriptions bordered column={2} size="small">
        <Descriptions.Item label="Transaction ID" span={2}>
          <Text code>{selectedTransaction.txID}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Type">
          <Space>
            {getTransactionTypeIcon(selectedTransaction.type)}
            {selectedTransaction.type}
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag color={getStatusColor(selectedTransaction.status)}>
            {selectedTransaction.status}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Land Parcel ID">
          <Text code>{selectedTransaction.landParcelID}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="From Owner">
          {selectedTransaction.fromOwnerID}
        </Descriptions.Item>
        <Descriptions.Item label="To Owner">
          {selectedTransaction.toOwnerID || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Created Date">
          {new Date(selectedTransaction.createdAt).toLocaleString('vi-VN')}
        </Descriptions.Item>
        <Descriptions.Item label="Details" span={2}>
          {selectedTransaction.details || 'No additional details'}
        </Descriptions.Item>
        {selectedTransaction.approverComments && (
          <Descriptions.Item label="Approver Comments" span={2}>
            {selectedTransaction.approverComments}
          </Descriptions.Item>
        )}
        {selectedTransaction.rejectionReason && (
          <Descriptions.Item label="Rejection Reason" span={2}>
            {selectedTransaction.rejectionReason}
          </Descriptions.Item>
        )}
      </Descriptions>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Transaction Management</Title>
      <Text type="secondary">
        Manage and process land transaction requests from citizens
      </Text>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginTop: '24px', marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending Transactions"
              value={stats.pending}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Approved"
              value={stats.approved}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Rejected"
              value={stats.rejected}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Transactions"
              value={stats.total}
              prefix={<FileTextOutlined />}
            />
            <Progress
              percent={stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}
              size="small"
              status="active"
              style={{ marginTop: '8px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Transactions Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="txID"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} transactions`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Transaction Details/Action Modal */}
      <Modal
        title={
          actionType === 'view' ? 'Transaction Details' :
          actionType === 'approve' ? 'Approve Transaction' :
          'Reject Transaction'
        }
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={800}
        okText={
          actionType === 'view' ? 'Close' :
          actionType === 'approve' ? 'Approve' :
          'Reject'
        }
        okButtonProps={{
          danger: actionType === 'reject',
          type: actionType === 'approve' ? 'primary' : 'default'
        }}
        confirmLoading={loading}
      >
        {renderTransactionDetails()}
        
        {actionType !== 'view' && (
          <Form form={form} layout="vertical" style={{ marginTop: '24px' }}>
            {actionType === 'reject' && (
              <Form.Item
                name="reason"
                label="Rejection Reason"
                rules={[{ required: true, message: 'Please provide a rejection reason' }]}
              >
                <Select placeholder="Select rejection reason">
                  <Select.Option value="Insufficient Documentation">
                    Insufficient Documentation
                  </Select.Option>
                  <Select.Option value="Invalid Land Parcel">
                    Invalid Land Parcel
                  </Select.Option>
                  <Select.Option value="Ownership Dispute">
                    Ownership Dispute
                  </Select.Option>
                  <Select.Option value="Legal Issues">
                    Legal Issues
                  </Select.Option>
                  <Select.Option value="Other">Other</Select.Option>
                </Select>
              </Form.Item>
            )}
            <Form.Item
              name="comments"
              label={actionType === 'approve' ? 'Approval Comments' : 'Additional Comments'}
            >
              <TextArea
                rows={4}
                placeholder={`Enter ${actionType === 'approve' ? 'approval' : 'rejection'} comments...`}
              />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default TransactionManagementPage;
