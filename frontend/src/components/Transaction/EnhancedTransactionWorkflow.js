import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Steps, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  message, 
  Space, 
  Typography,
  Row,
  Col,
  Tag,
  Timeline,
  Descriptions,
  Progress,
  Badge,
  Tooltip,
  Divider,
  Alert,
  Upload,
  List,
  Avatar
} from 'antd';
import { 
  SwapOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  UserOutlined,
  CalendarOutlined,
  UploadOutlined,
  EyeOutlined,
  EditOutlined,
  SendOutlined,
  StopOutlined,
  PlayCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { transactionAPI, documentAPI } from '../../services/api';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;

const EnhancedTransactionWorkflow = ({ user, filter, type }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [workflowModalVisible, setWorkflowModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionType, setActionType] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    fetchTransactions();
  }, [filter, type]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let response;
      if (user.org === 'Org3') {
        response = await transactionAPI.getByUser(user.userId);
      } else {
        response = await transactionAPI.getAll();
      }
      
      let filteredTransactions = response.data || [];
      
      // Apply filters
      if (filter === 'pending') {
        filteredTransactions = filteredTransactions.filter(tx => 
          tx.status === 'PENDING' || tx.status === 'SUPPLEMENT_REQUESTED'
        );
      } else if (filter === 'processing') {
        filteredTransactions = filteredTransactions.filter(tx => 
          tx.status === 'VERIFIED' || tx.status === 'FORWARDED'
        );
      }
      
      if (type) {
        filteredTransactions = filteredTransactions.filter(tx => 
          tx.type?.toLowerCase() === type.toLowerCase()
        );
      }
      
      setTransactions(filteredTransactions);
    } catch (error) {
      message.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'PENDING': 'orange',
      'CONFIRMED': 'blue',
      'VERIFIED': 'cyan',
      'FORWARDED': 'purple',
      'APPROVED': 'green',
      'REJECTED': 'red',
      'SUPPLEMENT_REQUESTED': 'gold'
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'PENDING': <ClockCircleOutlined />,
      'CONFIRMED': <InfoCircleOutlined />,
      'VERIFIED': <CheckCircleOutlined />,
      'FORWARDED': <SendOutlined />,
      'APPROVED': <CheckCircleOutlined />,
      'REJECTED': <StopOutlined />,
      'SUPPLEMENT_REQUESTED': <WarningOutlined />
    };
    return icons[status] || <InfoCircleOutlined />;
  };

  const getWorkflowSteps = (transaction) => {
    const steps = [
      {
        title: 'Request Created',
        status: 'finish',
        icon: <PlayCircleOutlined />
      },
      {
        title: 'Document Verification',
        status: ['PENDING'].includes(transaction.status) ? 'wait' : 'finish',
        icon: <FileTextOutlined />
      },
      {
        title: 'Processing',
        status: ['PENDING', 'SUPPLEMENT_REQUESTED'].includes(transaction.status) ? 'wait' : 
                ['VERIFIED', 'FORWARDED'].includes(transaction.status) ? 'process' : 'finish',
        icon: <SwapOutlined />
      },
      {
        title: 'Final Approval',
        status: ['APPROVED'].includes(transaction.status) ? 'finish' : 
                ['REJECTED'].includes(transaction.status) ? 'error' : 'wait',
        icon: transaction.status === 'REJECTED' ? <StopOutlined /> : <CheckCircleOutlined />
      }
    ];

    return steps;
  };

  const handleAction = async (action, transactionId) => {
    setActionType(action);
    setSelectedTransaction(transactions.find(tx => tx.txID === transactionId));
    setActionModalVisible(true);
  };

  const executeAction = async (values) => {
    try {
      const { txID } = selectedTransaction;
      
      switch (actionType) {
        case 'approve':
          await transactionAPI.approve(txID, values.comments || 'Approved');
          message.success('Transaction approved successfully');
          break;
        case 'reject':
          await transactionAPI.reject(txID, values.comments || 'Rejected');
          message.success('Transaction rejected');
          break;
        case 'forward':
          // This would be implemented based on your backend API
          message.success('Transaction forwarded');
          break;
        default:
          break;
      }
      
      setActionModalVisible(false);
      form.resetFields();
      fetchTransactions();
    } catch (error) {
      message.error(`Failed to ${actionType} transaction`);
    }
  };

  const getActionButtons = (record) => {
    const buttons = [];
    
    if (user.org === 'Org1') {
      if (record.status === 'FORWARDED') {
        buttons.push(
          <Button 
            key="approve" 
            type="primary" 
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleAction('approve', record.txID)}
          >
            Approve
          </Button>
        );
        buttons.push(
          <Button 
            key="reject" 
            danger 
            size="small"
            icon={<StopOutlined />}
            onClick={() => handleAction('reject', record.txID)}
          >
            Reject
          </Button>
        );
      }
    } else if (user.org === 'Org2') {
      if (record.status === 'VERIFIED') {
        buttons.push(
          <Button 
            key="forward" 
            type="primary" 
            size="small"
            icon={<SendOutlined />}
            onClick={() => handleAction('forward', record.txID)}
          >
            Forward
          </Button>
        );
      }
    }
    
    buttons.push(
      <Button 
        key="view" 
        size="small"
        icon={<EyeOutlined />}
        onClick={() => {
          setSelectedTransaction(record);
          setWorkflowModalVisible(true);
        }}
      >
        View
      </Button>
    );
    
    return buttons;
  };

  const columns = [
    {
      title: 'Transaction ID',
      dataIndex: 'txID',
      key: 'txID',
      render: (text) => (
        <Text code style={{ fontSize: '12px' }}>
          {text}
        </Text>
      )
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color="blue">{type}</Tag>
      )
    },
    {
      title: 'Land Parcel',
      dataIndex: 'landParcelID',
      key: 'landParcelID',
      render: (text) => (
        <Text code style={{ fontSize: '12px' }}>
          {text}
        </Text>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Badge 
          status={getStatusColor(status) === 'green' ? 'success' : 
                 getStatusColor(status) === 'red' ? 'error' : 'processing'} 
          text={
            <Space>
              {getStatusIcon(status)}
              <span>{status}</span>
            </Space>
          }
        />
      )
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_, record) => {
        const steps = getWorkflowSteps(record);
        const completedSteps = steps.filter(step => step.status === 'finish').length;
        const totalSteps = steps.length;
        const percentage = (completedSteps / totalSteps) * 100;
        
        return (
          <Progress 
            percent={percentage} 
            size="small" 
            status={record.status === 'REJECTED' ? 'exception' : 'active'}
            showInfo={false}
          />
        );
      }
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => date ? new Date(date).toLocaleDateString() : '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          {getActionButtons(record)}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <Space>
            <SwapOutlined />
            Transaction Workflow Management
          </Space>
        </Title>
        <Text type="secondary">
          {filter === 'pending' ? 'Manage pending transactions requiring attention' :
           filter === 'processing' ? 'Monitor transactions in processing' :
           type ? `${type.charAt(0).toUpperCase() + type.slice(1)} transactions` :
           'Comprehensive transaction management and workflow tracking'}
        </Text>
      </div>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16' }}>
                {transactions.filter(tx => tx.status === 'PENDING').length}
              </div>
              <div style={{ color: '#8c8c8c', fontSize: '12px' }}>Pending</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                {transactions.filter(tx => ['VERIFIED', 'FORWARDED'].includes(tx.status)).length}
              </div>
              <div style={{ color: '#8c8c8c', fontSize: '12px' }}>Processing</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                {transactions.filter(tx => tx.status === 'APPROVED').length}
              </div>
              <div style={{ color: '#8c8c8c', fontSize: '12px' }}>Approved</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f' }}>
                {transactions.filter(tx => tx.status === 'REJECTED').length}
              </div>
              <div style={{ color: '#8c8c8c', fontSize: '12px' }}>Rejected</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Table */}
      <Card title="Transactions" className="professional-card">
        <Table
          columns={columns}
          dataSource={transactions}
          loading={loading}
          rowKey="txID"
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} transactions`
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Workflow Detail Modal */}
      <Modal
        title={
          <Space>
            <SwapOutlined />
            <span>Transaction Workflow</span>
          </Space>
        }
        open={workflowModalVisible}
        onCancel={() => setWorkflowModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedTransaction && (
          <div>
            {/* Transaction Info */}
            <Descriptions bordered size="small" style={{ marginBottom: '24px' }}>
              <Descriptions.Item label="Transaction ID" span={2}>
                <Text code>{selectedTransaction.txID}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Badge 
                  status={getStatusColor(selectedTransaction.status) === 'green' ? 'success' : 
                         getStatusColor(selectedTransaction.status) === 'red' ? 'error' : 'processing'} 
                  text={selectedTransaction.status}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                <Tag color="blue">{selectedTransaction.type}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Land Parcel">
                <Text code>{selectedTransaction.landParcelID}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                {selectedTransaction.createdAt ? 
                  new Date(selectedTransaction.createdAt).toLocaleString() : '-'}
              </Descriptions.Item>
            </Descriptions>

            {/* Workflow Steps */}
            <Title level={4}>Workflow Progress</Title>
            <Steps 
              current={getWorkflowSteps(selectedTransaction).findIndex(step => step.status === 'process')}
              status={selectedTransaction.status === 'REJECTED' ? 'error' : 'process'}
              style={{ marginBottom: '24px' }}
            >
              {getWorkflowSteps(selectedTransaction).map((step, index) => (
                <Step 
                  key={index}
                  title={step.title} 
                  icon={step.icon}
                  status={step.status}
                />
              ))}
            </Steps>

            {/* Details */}
            <Title level={4}>Transaction Details</Title>
            <Paragraph>
              {selectedTransaction.details || 'No additional details available.'}
            </Paragraph>

            {/* Action Buttons */}
            <div style={{ textAlign: 'right', marginTop: '24px' }}>
              <Space>
                {getActionButtons(selectedTransaction)}
              </Space>
            </div>
          </div>
        )}
      </Modal>

      {/* Action Modal */}
      <Modal
        title={`${actionType.charAt(0).toUpperCase() + actionType.slice(1)} Transaction`}
        open={actionModalVisible}
        onCancel={() => {
          setActionModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={executeAction}
        >
          <Alert
            message={`You are about to ${actionType} this transaction`}
            description={`Transaction ID: ${selectedTransaction?.txID}`}
            type={actionType === 'reject' ? 'warning' : 'info'}
            style={{ marginBottom: '16px' }}
          />
          
          <Form.Item
            name="comments"
            label="Comments"
            rules={[
              { required: actionType === 'reject', message: 'Please provide a reason for rejection' }
            ]}
          >
            <TextArea 
              rows={4} 
              placeholder={`Enter ${actionType} comments...`}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EnhancedTransactionWorkflow;