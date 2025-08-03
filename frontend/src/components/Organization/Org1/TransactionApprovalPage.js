import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Typography,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  message,
  Descriptions,
  Select
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  SwapOutlined
} from '@ant-design/icons';
import apiService from '../../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

/**
 * Transaction Approval Page for Org1 (Authority)
 * Main functions: Approve/Reject transactions - POST /transactions/:txID/approve|reject
 */
const TransactionApprovalPage = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [form] = Form.useForm();

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

  const handleApproveTransaction = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      await apiService.approveTransaction(selectedTransaction.txID, {
        approverComments: values.approverComments,
        approvalDate: new Date().toISOString(),
        approverID: user.cccd
      });

      message.success('Transaction approved successfully!');
      setApprovalModalVisible(false);
      form.resetFields();
      fetchTransactions();
    } catch (error) {
      console.error('Approve transaction error:', error);
      message.error(error.response?.data?.error || 'Failed to approve transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectTransaction = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      await apiService.rejectTransaction(selectedTransaction.txID, {
        rejectionReason: values.rejectionReason,
        rejectionComments: values.rejectionComments,
        rejectionDate: new Date().toISOString(),
        rejectorID: user.cccd
      });

      message.success('Transaction rejected successfully!');
      setRejectionModalVisible(false);
      form.resetFields();
      fetchTransactions();
    } catch (error) {
      console.error('Reject transaction error:', error);
      message.error(error.response?.data?.error || 'Failed to reject transaction');
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
            onClick={() => {
              setSelectedTransaction(record);
              setDetailModalVisible(true);
            }}
          >
            View
          </Button>
          {record.status === 'pending' && (
            <>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => {
                  setSelectedTransaction(record);
                  setApprovalModalVisible(true);
                }}
                size="small"
              >
                Approve
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => {
                  setSelectedTransaction(record);
                  setRejectionModalVisible(true);
                }}
                size="small"
              >
                Reject
              </Button>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <SwapOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
        Transaction Approval
      </Title>
      <Text type="secondary">
        Approve or reject land transaction requests. This is a main authority function for Org1.
      </Text>

      <Card style={{ marginTop: '24px' }}>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4}>Pending Transactions</Title>
          <Space>
            <Select
              placeholder="Filter by status"
              style={{ width: 150 }}
              allowClear
            >
              <Select.Option value="pending">Pending</Select.Option>
              <Select.Option value="approved">Approved</Select.Option>
              <Select.Option value="rejected">Rejected</Select.Option>
            </Select>
            <Select
              placeholder="Filter by type"
              style={{ width: 150 }}
              allowClear
            >
              <Select.Option value="transfer">Transfer</Select.Option>
              <Select.Option value="split">Split</Select.Option>
              <Select.Option value="merge">Merge</Select.Option>
              <Select.Option value="change_purpose">Change Purpose</Select.Option>
              <Select.Option value="reissue">Reissue</Select.Option>
            </Select>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="txID"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} transactions`
          }}
        />
      </Card>

      {/* Transaction Detail Modal */}
      <Modal
        title="Transaction Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedTransaction && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Transaction ID">{selectedTransaction.txID}</Descriptions.Item>
            <Descriptions.Item label="Type">{selectedTransaction.type}</Descriptions.Item>
            <Descriptions.Item label="Land Parcel ID">{selectedTransaction.landParcelID}</Descriptions.Item>
            <Descriptions.Item label="Owner ID">{selectedTransaction.ownerID}</Descriptions.Item>
            <Descriptions.Item label="Status">{selectedTransaction.status}</Descriptions.Item>
            <Descriptions.Item label="Created Date">
              {selectedTransaction.createdAt ? new Date(selectedTransaction.createdAt).toLocaleString('vi-VN') : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Details" span={2}>
              {selectedTransaction.details || 'No additional details'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Approval Modal */}
      <Modal
        title="Approve Transaction"
        open={approvalModalVisible}
        onCancel={() => {
          setApprovalModalVisible(false);
          form.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => setApprovalModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="approve"
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={handleApproveTransaction}
            loading={loading}
          >
            Approve Transaction
          </Button>
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="approverComments"
            label="Approval Comments"
            rules={[{ required: true, message: 'Please enter approval comments' }]}
          >
            <TextArea
              rows={4}
              placeholder="Enter comments for approval..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Rejection Modal */}
      <Modal
        title="Reject Transaction"
        open={rejectionModalVisible}
        onCancel={() => {
          setRejectionModalVisible(false);
          form.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => setRejectionModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="reject"
            danger
            icon={<CloseCircleOutlined />}
            onClick={handleRejectTransaction}
            loading={loading}
          >
            Reject Transaction
          </Button>
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="rejectionReason"
            label="Rejection Reason"
            rules={[{ required: true, message: 'Please select rejection reason' }]}
          >
            <Select placeholder="Select rejection reason">
              <Select.Option value="Insufficient Documentation">Insufficient Documentation</Select.Option>
              <Select.Option value="Invalid Land Parcel">Invalid Land Parcel</Select.Option>
              <Select.Option value="Legal Issues">Legal Issues</Select.Option>
              <Select.Option value="Ownership Dispute">Ownership Dispute</Select.Option>
              <Select.Option value="Technical Error">Technical Error</Select.Option>
              <Select.Option value="Other">Other</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="rejectionComments"
            label="Rejection Comments"
            rules={[{ required: true, message: 'Please enter rejection comments' }]}
          >
            <TextArea
              rows={4}
              placeholder="Enter detailed comments for rejection..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TransactionApprovalPage;
