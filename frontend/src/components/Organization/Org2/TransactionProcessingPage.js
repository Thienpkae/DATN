import { useState, useEffect } from 'react';
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
  SendOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  ForwardOutlined,
  ToolOutlined
} from '@ant-design/icons';
import apiService from '../../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

/**
 * Transaction Processing Page for Org2
 * Process and forward transactions
 */
const TransactionProcessingPage = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionType, setActionType] = useState(''); // 'process', 'forward', 'view'
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    pending: 0,
    processed: 0,
    forwarded: 0,
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
      // Filter transactions that Org2 can process
      const processableTransactions = response.transactions?.filter(tx => 
        tx.status === 'Pending' || tx.status === 'Under Review'
      ) || [];
      setTransactions(processableTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      message.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiService.getTransactionProcessingStats();
      setStats(response.stats || {
        pending: 0,
        processed: 0,
        forwarded: 0,
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

  const handleProcessTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setModalVisible(true);
    setActionType('process');
    form.resetFields();
  };

  const handleForwardTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setModalVisible(true);
    setActionType('forward');
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

      if (actionType === 'process') {
        await apiService.processTransaction(selectedTransaction.txID, {
          processingNotes: values.notes || '',
          processedBy: user.cccd,
          nextStep: values.nextStep
        });
        message.success('Transaction processed successfully');
      } else if (actionType === 'forward') {
        await apiService.forwardTransaction(selectedTransaction.txID, {
          forwardTo: values.forwardTo,
          forwardReason: values.reason,
          forwardNotes: values.notes || '',
          forwardedBy: user.cccd
        });
        message.success('Transaction forwarded successfully');
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
      case 'under review': return 'blue';
      case 'processed': return 'green';
      case 'forwarded': return 'purple';
      case 'completed': return 'green';
      default: return 'default';
    }
  };

  const getTransactionTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'transfer': return <SwapOutlined />;
      case 'split': return <SwapOutlined />;
      case 'merge': return <SwapOutlined />;
      default: return <SwapOutlined />;
    }
  };

  const getProcessingSteps = (transaction) => {
    const steps = [
      {
        title: 'Submitted',
        status: 'finish',
        description: 'Transaction submitted by citizen'
      },
      {
        title: 'Under Review',
        status: transaction.status === 'Pending' ? 'process' : 'finish',
        description: 'Being reviewed by officers'
      },
      {
        title: 'Processed',
        status: transaction.status === 'Processed' || transaction.status === 'Forwarded' ? 'finish' : 'wait',
        description: 'Processed by Org2'
      },
      {
        title: 'Final Approval',
        status: transaction.status === 'Completed' ? 'finish' : 'wait',
        description: 'Final approval by Org1'
      }
    ];

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
      title: 'From Owner',
      dataIndex: 'fromOwnerID',
      key: 'fromOwnerID',
      width: 150
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
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority) => (
        <Tag color={priority === 'High' ? 'red' : priority === 'Medium' ? 'orange' : 'green'}>
          {priority || 'Normal'}
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
      width: 250,
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
                icon={<ToolOutlined />}
                onClick={() => handleProcessTransaction(record)}
                style={{ color: '#52c41a' }}
              >
                Process
              </Button>
              <Button
                type="link"
                icon={<ForwardOutlined />}
                onClick={() => handleForwardTransaction(record)}
                style={{ color: '#1890ff' }}
              >
                Forward
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
      <>
        <Steps
          current={
            selectedTransaction.status === 'Pending' ? 1 :
            selectedTransaction.status === 'Processed' ? 2 :
            selectedTransaction.status === 'Completed' ? 3 : 1
          }
          items={getProcessingSteps(selectedTransaction)}
          style={{ marginBottom: '24px' }}
        />

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
          <Descriptions.Item label="Priority">
            <Tag color={selectedTransaction.priority === 'High' ? 'red' : 'green'}>
              {selectedTransaction.priority || 'Normal'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Created Date">
            {new Date(selectedTransaction.createdAt).toLocaleString('vi-VN')}
          </Descriptions.Item>
          <Descriptions.Item label="Details" span={2}>
            {selectedTransaction.details || 'No additional details'}
          </Descriptions.Item>
          {selectedTransaction.processingNotes && (
            <Descriptions.Item label="Processing Notes" span={2}>
              {selectedTransaction.processingNotes}
            </Descriptions.Item>
          )}
        </Descriptions>
      </>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Transaction Processing</Title>
      <Text type="secondary">
        Process and forward land transaction requests
      </Text>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginTop: '24px', marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending Processing"
              value={stats.pending}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Processed"
              value={stats.processed}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Forwarded"
              value={stats.forwarded}
              valueStyle={{ color: '#1890ff' }}
              prefix={<SendOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Transactions"
              value={stats.total}
              prefix={<SwapOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Processing Guidelines */}
      <Alert
        message="Processing Guidelines"
        description="Review transaction details carefully. Process transactions that meet all requirements or forward them to the appropriate authority for further review."
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

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
          actionType === 'process' ? 'Process Transaction' :
          'Forward Transaction'
        }
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={800}
        okText={
          actionType === 'view' ? 'Close' :
          actionType === 'process' ? 'Process' :
          'Forward'
        }
        confirmLoading={loading}
      >
        {renderTransactionDetails()}
        
        {actionType !== 'view' && (
          <Form form={form} layout="vertical" style={{ marginTop: '24px' }}>
            {actionType === 'process' && (
              <Form.Item
                name="nextStep"
                label="Next Step"
                rules={[{ required: true, message: 'Please select next step' }]}
              >
                <Select placeholder="Select next step">
                  <Select.Option value="approve">Recommend for Approval</Select.Option>
                  <Select.Option value="review">Requires Further Review</Select.Option>
                  <Select.Option value="documentation">Additional Documentation Needed</Select.Option>
                </Select>
              </Form.Item>
            )}
            
            {actionType === 'forward' && (
              <>
                <Form.Item
                  name="forwardTo"
                  label="Forward To"
                  rules={[{ required: true, message: 'Please select destination' }]}
                >
                  <Select placeholder="Select destination">
                    <Select.Option value="Org1">Land Registry Authority (Org1)</Select.Option>
                    <Select.Option value="legal">Legal Department</Select.Option>
                    <Select.Option value="technical">Technical Review</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item
                  name="reason"
                  label="Forward Reason"
                  rules={[{ required: true, message: 'Please provide forward reason' }]}
                >
                  <Select placeholder="Select reason">
                    <Select.Option value="approval">Requires Final Approval</Select.Option>
                    <Select.Option value="legal_review">Legal Review Required</Select.Option>
                    <Select.Option value="technical_review">Technical Review Required</Select.Option>
                    <Select.Option value="documentation">Missing Documentation</Select.Option>
                  </Select>
                </Form.Item>
              </>
            )}
            
            <Form.Item
              name="notes"
              label={actionType === 'process' ? 'Processing Notes' : 'Forward Notes'}
            >
              <TextArea
                rows={4}
                placeholder={`Enter ${actionType === 'process' ? 'processing' : 'forward'} notes...`}
              />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default TransactionProcessingPage;
