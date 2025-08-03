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
  Typography,
  Row,
  Col,
  Statistic,
  Steps,
  Descriptions,
  Alert
} from 'antd';
import {
  SwapOutlined,
  SplitCellsOutlined,
  MergeOutlined,
  PlusOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import apiService from '../../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

/**
 * Transaction Requests Page for Org3 (Citizens)
 * Allows citizens to create and track land transaction requests
 */
const TransactionRequestsPage = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [landParcels, setLandParcels] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [transactionType, setTransactionType] = useState('transfer');
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });

  useEffect(() => {
    fetchTransactions();
    fetchLandParcels();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTransactionsByOwner(user.cccd);
      setTransactions(response.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      message.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchLandParcels = async () => {
    try {
      const response = await apiService.getLandParcelsByOwner(user.cccd);
      setLandParcels(response.landParcels || []);
    } catch (error) {
      console.error('Error fetching land parcels:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiService.getTransactionStatsByOwner(user.cccd);
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
  };

  const handleCreateTransaction = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const transactionData = {
        ...values,
        fromOwnerID: user.cccd,
        type: transactionType,
        status: 'Pending'
      };

      switch (transactionType) {
        case 'transfer':
          await apiService.createTransferRequest(transactionData);
          break;
        case 'split':
          await apiService.createSplitRequest(transactionData);
          break;
        case 'merge':
          await apiService.createMergeRequest(transactionData);
          break;
        case 'change_purpose':
          await apiService.createChangePurposeRequest(transactionData);
          break;
        case 'reissue':
          await apiService.createReissueRequest(transactionData);
          break;
        default:
          throw new Error('Invalid transaction type');
      }

      message.success(`${transactionType} request created successfully`);
      setCreateModalVisible(false);
      form.resetFields();
      fetchTransactions();
      fetchStats();
    } catch (error) {
      console.error('Transaction creation error:', error);
      message.error(error.message || 'Failed to create transaction request');
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
      default: return <SwapOutlined />;
    }
  };

  const getTransactionSteps = (transaction) => {
    const steps = [
      {
        title: 'Request Submitted',
        status: 'finish',
        description: 'Transaction request created'
      },
      {
        title: 'Under Review',
        status: transaction.status === 'Pending' ? 'process' : 
               transaction.status === 'Approved' || transaction.status === 'Completed' ? 'finish' : 'error',
        description: 'Being reviewed by Land Registry Authority'
      },
      {
        title: 'Decision Made',
        status: transaction.status === 'Approved' ? 'finish' :
               transaction.status === 'Rejected' ? 'error' :
               transaction.status === 'Completed' ? 'finish' : 'wait',
        description: transaction.status === 'Approved' ? 'Request approved' :
                    transaction.status === 'Rejected' ? 'Request rejected' :
                    transaction.status === 'Completed' ? 'Request completed' : 'Awaiting decision'
      }
    ];

    if (transaction.status === 'Completed') {
      steps.push({
        title: 'Completed',
        status: 'finish',
        description: 'Transaction completed successfully'
      });
    }

    return steps;
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
      width: 120,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewTransaction(record)}
        >
          View
        </Button>
      )
    }
  ];

  const renderTransactionForm = () => {
    switch (transactionType) {
      case 'transfer':
        return (
          <>
            <Form.Item
              name="landParcelID"
              label="Land Parcel"
              rules={[{ required: true, message: 'Please select a land parcel' }]}
            >
              <Select placeholder="Select land parcel to transfer">
                {landParcels.map(parcel => (
                  <Select.Option key={parcel.id} value={parcel.id}>
                    {parcel.id} - {parcel.location} ({parcel.area} m²)
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="toOwnerID"
              label="Transfer To (CCCD)"
              rules={[
                { required: true, message: 'Please enter recipient CCCD' },
                { len: 12, message: 'CCCD must be 12 digits' }
              ]}
            >
              <Input placeholder="Enter recipient's CCCD number" />
            </Form.Item>
          </>
        );
      case 'split':
        return (
          <>
            <Form.Item
              name="landParcelID"
              label="Land Parcel to Split"
              rules={[{ required: true, message: 'Please select a land parcel' }]}
            >
              <Select placeholder="Select land parcel to split">
                {landParcels.map(parcel => (
                  <Select.Option key={parcel.id} value={parcel.id}>
                    {parcel.id} - {parcel.location} ({parcel.area} m²)
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="splitAreas"
              label="Split Areas (comma-separated in m²)"
              rules={[{ required: true, message: 'Please enter split areas' }]}
            >
              <Input placeholder="e.g., 50, 30, 20" />
            </Form.Item>
          </>
        );
      case 'merge':
        return (
          <>
            <Form.Item
              name="landParcelIDs"
              label="Land Parcels to Merge"
              rules={[{ required: true, message: 'Please select land parcels' }]}
            >
              <Select
                mode="multiple"
                placeholder="Select land parcels to merge"
              >
                {landParcels.map(parcel => (
                  <Select.Option key={parcel.id} value={parcel.id}>
                    {parcel.id} - {parcel.location} ({parcel.area} m²)
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Title level={2}>Transaction Requests</Title>
          <Text type="secondary">
            Create and track your land transaction requests
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalVisible(true)}
        >
          New Request
        </Button>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending Requests"
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
              title="Total Requests"
              value={stats.total}
              prefix={<SwapOutlined />}
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
              `${range[0]}-${range[1]} of ${total} requests`
          }}
        />
      </Card>

      {/* Transaction Details Modal */}
      <Modal
        title="Transaction Details"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Close
          </Button>
        ]}
      >
        {selectedTransaction && (
          <>
            <Steps
              current={selectedTransaction.status === 'Pending' ? 1 :
                      selectedTransaction.status === 'Approved' ? 2 :
                      selectedTransaction.status === 'Completed' ? 3 : 2}
              items={getTransactionSteps(selectedTransaction)}
              style={{ marginBottom: '24px' }}
            />
            
            {selectedTransaction.status === 'Rejected' && (
              <Alert
                message="Request Rejected"
                description={selectedTransaction.rejectionReason || 'Your request has been rejected.'}
                type="error"
                showIcon
                style={{ marginBottom: '16px' }}
              />
            )}

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
              {selectedTransaction.rejectionComments && (
                <Descriptions.Item label="Rejection Comments" span={2}>
                  {selectedTransaction.rejectionComments}
                </Descriptions.Item>
              )}
            </Descriptions>
          </>
        )}
      </Modal>

      {/* Create Transaction Modal */}
      <Modal
        title="Create New Transaction Request"
        open={createModalVisible}
        onOk={handleCreateTransaction}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        confirmLoading={loading}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="type"
            label="Transaction Type"
            rules={[{ required: true, message: 'Please select transaction type' }]}
          >
            <Select
              placeholder="Select transaction type"
              onChange={setTransactionType}
              value={transactionType}
            >
              <Select.Option value="transfer">
                <Space>
                  <SwapOutlined />
                  Land Transfer
                </Space>
              </Select.Option>
              <Select.Option value="split">
                <Space>
                  <SplitCellsOutlined />
                  Land Split
                </Space>
              </Select.Option>
              <Select.Option value="merge">
                <Space>
                  <MergeOutlined />
                  Land Merge
                </Space>
              </Select.Option>
              <Select.Option value="change_purpose">
                <Space>
                  <EditOutlined />
                  Change Land Purpose
                </Space>
              </Select.Option>
              <Select.Option value="reissue">
                <Space>
                  <ReloadOutlined />
                  Certificate Reissue
                </Space>
              </Select.Option>
            </Select>
          </Form.Item>
          
          {renderTransactionForm()}
          
          <Form.Item
            name="details"
            label="Additional Details"
          >
            <TextArea
              rows={3}
              placeholder="Enter any additional details or comments..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TransactionRequestsPage;
