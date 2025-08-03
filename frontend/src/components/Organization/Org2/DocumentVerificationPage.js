import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Table,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Typography,
  Tag,
  message,
  Statistic,
  Steps,
  Descriptions,
  Alert
} from 'antd';
import {
  SafetyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  SearchOutlined,
  FilterOutlined,
  FileTextOutlined,
  AuditOutlined
} from '@ant-design/icons';
import apiService from '../../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { Step } = Steps;

const DocumentVerificationPage = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [form] = Form.useForm();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      // Fetch pending documents for verification
      const response = await apiService.getPendingDocuments();
      setDocuments(response || []);
    } catch (error) {
      console.error('Fetch documents error:', error);
      message.error('Failed to fetch documents');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDocument = async (documentId, status, comments) => {
    try {
      setLoading(true);
      await apiService.verifyDocument(documentId, {
        status,
        comments,
        verifiedBy: user.userId,
        verificationDate: new Date().toISOString()
      });
      
      message.success(`Document ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
      setModalVisible(false);
      fetchDocuments();
    } catch (error) {
      console.error('Verify document error:', error);
      message.error(error.message || 'Failed to verify document');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (document) => {
    setSelectedDocument(document);
    form.setFieldsValue({
      status: '',
      comments: ''
    });
    setModalVisible(true);
  };

  const getFilteredDocuments = () => {
    let filtered = documents;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(doc => doc.status === statusFilter);
    }

    if (searchText) {
      filtered = filtered.filter(doc =>
        doc.id?.toLowerCase().includes(searchText.toLowerCase()) ||
        doc.type?.toLowerCase().includes(searchText.toLowerCase()) ||
        doc.submittedBy?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    return filtered;
  };

  const columns = [
    {
      title: 'Document ID',
      dataIndex: 'id',
      key: 'id',
      render: (id) => <Text strong>{id}</Text>
    },
    {
      title: 'Document Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Space>
          <FileTextOutlined />
          <Text>{type}</Text>
        </Space>
      )
    },
    {
      title: 'Submitted By',
      dataIndex: 'submittedBy',
      key: 'submittedBy'
    },
    {
      title: 'Submission Date',
      dataIndex: 'submissionDate',
      key: 'submissionDate',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A'
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        const colors = {
          'high': 'red',
          'medium': 'orange',
          'low': 'green'
        };
        return <Tag color={colors[priority] || 'default'}>{priority}</Tag>;
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          'pending': 'orange',
          'approved': 'green',
          'rejected': 'red',
          'under_review': 'blue'
        };
        const icons = {
          'pending': <ClockCircleOutlined />,
          'approved': <CheckCircleOutlined />,
          'rejected': <CloseCircleOutlined />,
          'under_review': <AuditOutlined />
        };
        return (
          <Tag color={colors[status] || 'default'} icon={icons[status]}>
            {status?.replace('_', ' ')}
          </Tag>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDocument(record)}
          >
            Review
          </Button>
        </Space>
      )
    }
  ];

  const stats = {
    total: documents.length,
    pending: documents.filter(d => d.status === 'pending').length,
    approved: documents.filter(d => d.status === 'approved').length,
    rejected: documents.filter(d => d.status === 'rejected').length
  };

  const getVerificationSteps = (document) => {
    const steps = [
      {
        title: 'Submitted',
        status: 'finish',
        description: `Submitted on ${document?.submissionDate ? new Date(document.submissionDate).toLocaleDateString() : 'N/A'}`
      },
      {
        title: 'Under Review',
        status: document?.status === 'under_review' ? 'process' : 
               document?.status === 'pending' ? 'wait' : 'finish',
        description: 'Document being reviewed by officers'
      },
      {
        title: 'Verification',
        status: document?.status === 'approved' || document?.status === 'rejected' ? 'finish' : 'wait',
        description: document?.status === 'approved' ? 'Approved' : 
                    document?.status === 'rejected' ? 'Rejected' : 'Pending verification'
      }
    ];
    return steps;
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <SafetyOutlined style={{ marginRight: '8px' }} />
          Document Verification
        </Title>
        <Text type="secondary">
          Review and verify submitted documents for land registry processes
        </Text>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Documents"
              value={stats.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Review"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Approved"
              value={stats.approved}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Rejected"
              value={stats.rejected}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search documents..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by status"
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="all">All Status</Option>
              <Option value="pending">Pending</Option>
              <Option value="under_review">Under Review</Option>
              <Option value="approved">Approved</Option>
              <Option value="rejected">Rejected</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Button
              icon={<FilterOutlined />}
              onClick={fetchDocuments}
              loading={loading}
            >
              Refresh
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Documents Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={getFilteredDocuments()}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} documents`
          }}
        />
      </Card>

      {/* Document Review Modal */}
      <Modal
        title="Document Review"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={800}
        footer={null}
      >
        {selectedDocument && (
          <div>
            {/* Document Details */}
            <Card style={{ marginBottom: '16px' }}>
              <Descriptions title="Document Information" bordered column={2}>
                <Descriptions.Item label="Document ID">
                  {selectedDocument.id}
                </Descriptions.Item>
                <Descriptions.Item label="Type">
                  {selectedDocument.type}
                </Descriptions.Item>
                <Descriptions.Item label="Submitted By">
                  {selectedDocument.submittedBy}
                </Descriptions.Item>
                <Descriptions.Item label="Submission Date">
                  {selectedDocument.submissionDate ? new Date(selectedDocument.submissionDate).toLocaleDateString() : 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Priority">
                  <Tag color={selectedDocument.priority === 'high' ? 'red' : selectedDocument.priority === 'medium' ? 'orange' : 'green'}>
                    {selectedDocument.priority}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Current Status">
                  <Tag color={selectedDocument.status === 'approved' ? 'green' : selectedDocument.status === 'rejected' ? 'red' : 'orange'}>
                    {selectedDocument.status}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Verification Steps */}
            <Card style={{ marginBottom: '16px' }}>
              <Steps current={selectedDocument.status === 'approved' || selectedDocument.status === 'rejected' ? 2 : selectedDocument.status === 'under_review' ? 1 : 0}>
                {getVerificationSteps(selectedDocument).map((step, index) => (
                  <Step key={index} title={step.title} description={step.description} />
                ))}
              </Steps>
            </Card>

            {/* Verification Form */}
            {selectedDocument.status === 'pending' && (
              <Card title="Verification Decision">
                <Form form={form} layout="vertical">
                  <Form.Item
                    name="status"
                    label="Decision"
                    rules={[{ required: true, message: 'Please select a decision' }]}
                  >
                    <Select>
                      <Option value="approved">Approve</Option>
                      <Option value="rejected">Reject</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item
                    name="comments"
                    label="Comments"
                    rules={[{ required: true, message: 'Please provide comments' }]}
                  >
                    <Input.TextArea rows={4} placeholder="Provide verification comments..." />
                  </Form.Item>
                  <Form.Item>
                    <Space>
                      <Button
                        type="primary"
                        onClick={async () => {
                          const values = await form.validateFields();
                          await handleVerifyDocument(selectedDocument.id, values.status, values.comments);
                        }}
                        loading={loading}
                      >
                        Submit Decision
                      </Button>
                      <Button onClick={() => setModalVisible(false)}>
                        Cancel
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </Card>
            )}

            {selectedDocument.status !== 'pending' && (
              <Alert
                message={`Document ${selectedDocument.status}`}
                description={`This document has already been ${selectedDocument.status}.`}
                type={selectedDocument.status === 'approved' ? 'success' : 'error'}
                showIcon
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DocumentVerificationPage;
