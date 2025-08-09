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
  Descriptions,
  Popconfirm
} from 'antd';
import {
  SafetyCertificateOutlined,
  PlusOutlined,
  EyeOutlined,
  DownloadOutlined,
  SearchOutlined,
  FilterOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  StopOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import apiService from '../../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const CertificateManagementPage = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const response = await apiService.getAllCertificates();
      setCertificates(response || []);
    } catch (error) {
      console.error('Fetch certificates error:', error);
      message.error('Failed to fetch certificates');
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueCertificate = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const certificateData = {
        ...values,
        issuer: user.userId,
        issueDate: new Date().toISOString(),
        status: 'issued'
      };

      await apiService.issueCertificate(certificateData);
      message.success('Certificate issued successfully');
      setModalVisible(false);
      form.resetFields();
      fetchCertificates();
    } catch (error) {
      console.error('Issue certificate error:', error);
      message.error(error.message || 'Failed to issue certificate');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCertificate = (certificate) => {
    setSelectedCertificate(certificate);
    setViewModalVisible(true);
  };

  const handleRevokeCertificate = async (certificateID, reason = 'Administrative revocation') => {
    // DISABLED: RevokeCertificate function not implemented in chaincode
    message.warning('Certificate revocation is currently not available. This feature is not implemented in the chaincode.');
    return;

    // try {
    //   setLoading(true);
    //   await apiService.revokeCertificate(certificateID, reason);
    //   message.success('Certificate revoked successfully');
    //   fetchCertificates();
    // } catch (error) {
    //   console.error('Revoke certificate error:', error);
    //   message.error('Failed to revoke certificate');
    // } finally {
    //   setLoading(false);
    // }
  };

  const getFilteredCertificates = () => {
    let filtered = certificates;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(cert => cert.status === statusFilter);
    }

    if (searchText) {
      filtered = filtered.filter(cert =>
        cert.certificateID?.toLowerCase().includes(searchText.toLowerCase()) ||
        cert.landParcelID?.toLowerCase().includes(searchText.toLowerCase()) ||
        cert.owner?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    return filtered;
  };

  const columns = [
    {
      title: 'Certificate ID',
      dataIndex: 'certificateID',
      key: 'certificateID',
      render: (id) => <Text strong>{id}</Text>
    },
    {
      title: 'Land Parcel ID',
      dataIndex: 'landParcelID',
      key: 'landParcelID',
      render: (id) => (
        <Space>
          <FileTextOutlined />
          <Text>{id}</Text>
        </Space>
      )
    },
    {
      title: 'Owner',
      dataIndex: 'owner',
      key: 'owner'
    },
    {
      title: 'Certificate Type',
      dataIndex: 'certificateType',
      key: 'certificateType',
      render: (type) => {
        const colors = {
          'ownership': 'blue',
          'transfer': 'green',
          'mortgage': 'orange',
          'lease': 'purple'
        };
        return <Tag color={colors[type] || 'default'}>{type}</Tag>;
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          'issued': 'green',
          'pending': 'orange',
          'revoked': 'red',
          'expired': 'gray'
        };
        return <Tag color={colors[status] || 'default'}>{status}</Tag>;
      }
    },
    {
      title: 'Issue Date',
      dataIndex: 'issueDate',
      key: 'issueDate',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewCertificate(record)}
          >
            View
          </Button>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => message.info('Download certificate functionality')}
          >
            Download
          </Button>
          {record.status !== 'revoked' && (
            <Popconfirm
              title="Revoke Certificate"
              description="Are you sure you want to revoke this certificate? This action cannot be undone."
              onConfirm={() => handleRevokeCertificate(record.certificateID)}
              okText="Yes, Revoke"
              cancelText="Cancel"
              icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
            >
              <Button
                type="link"
                icon={<StopOutlined />}
                danger
              >
                Revoke
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  const stats = {
    total: certificates.length,
    issued: certificates.filter(c => c.status === 'issued').length,
    pending: certificates.filter(c => c.status === 'pending').length,
    revoked: certificates.filter(c => c.status === 'revoked').length
  };

  return (
    <div className="org-page-container">
      <div className="org-page-header">
        <Title level={2} className="org-page-title">
          <SafetyCertificateOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          Certificate Management
        </Title>
        <Text className="org-page-subtitle">
          Issue, manage, and track land ownership certificates
        </Text>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card className="org-stats-card">
            <Statistic
              title="Total Certificates"
              value={stats.total}
              prefix={<SafetyCertificateOutlined />}
              valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="org-stats-card">
            <Statistic
              title="Issued"
              value={stats.issued}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="org-stats-card">
            <Statistic
              title="Pending"
              value={stats.pending}
              valueStyle={{ color: '#faad14', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="org-stats-card">
            <Statistic
              title="Revoked"
              value={stats.revoked}
              valueStyle={{ color: '#ff4d4f', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Actions */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Search certificates..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by status"
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="all">All Status</Option>
              <Option value="issued">Issued</Option>
              <Option value="pending">Pending</Option>
              <Option value="revoked">Revoked</Option>
              <Option value="expired">Expired</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalVisible(true)}
            >
              Issue Certificate
            </Button>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Button
              icon={<FilterOutlined />}
              onClick={fetchCertificates}
              loading={loading}
            >
              Refresh
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Certificates Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={getFilteredCertificates()}
          loading={loading}
          rowKey="certificateID"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} certificates`
          }}
        />
      </Card>

      {/* Issue Certificate Modal */}
      <Modal
        title="Issue New Certificate"
        open={modalVisible}
        onOk={handleIssueCertificate}
        onCancel={() => setModalVisible(false)}
        confirmLoading={loading}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="landParcelID"
            label="Land Parcel ID"
            rules={[{ required: true, message: 'Please enter land parcel ID' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="owner"
            label="Owner"
            rules={[{ required: true, message: 'Please enter owner name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="certificateType"
            label="Certificate Type"
            rules={[{ required: true, message: 'Please select certificate type' }]}
          >
            <Select>
              <Option value="ownership">Ownership Certificate</Option>
              <Option value="transfer">Transfer Certificate</Option>
              <Option value="mortgage">Mortgage Certificate</Option>
              <Option value="lease">Lease Certificate</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* View Certificate Modal */}
      <Modal
        title="Certificate Details"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="download" icon={<DownloadOutlined />}>
            Download PDF
          </Button>,
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>
        ]}
        width={700}
      >
        {selectedCertificate && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Certificate ID" span={2}>
              {selectedCertificate.certificateID}
            </Descriptions.Item>
            <Descriptions.Item label="Land Parcel ID">
              {selectedCertificate.landParcelID}
            </Descriptions.Item>
            <Descriptions.Item label="Owner">
              {selectedCertificate.owner}
            </Descriptions.Item>
            <Descriptions.Item label="Certificate Type">
              <Tag color="blue">{selectedCertificate.certificateType}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={selectedCertificate.status === 'issued' ? 'green' : 'orange'}>
                {selectedCertificate.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Issue Date">
              {selectedCertificate.issueDate ? new Date(selectedCertificate.issueDate).toLocaleDateString() : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Issuer">
              {selectedCertificate.issuer || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Description" span={2}>
              {selectedCertificate.description || 'No description available'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default CertificateManagementPage;
