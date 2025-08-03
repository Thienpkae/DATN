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
  Descriptions,
  QRCode,
  Alert
} from 'antd';
import {
  SafetyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  QrcodeOutlined,
  FileTextOutlined,
  SearchOutlined
} from '@ant-design/icons';
import apiService from '../../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

/**
 * Certificate Verification Page for Org2 (Government Office)
 * Verifies and validates land certificates
 */
const CertificateVerificationPage = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [verificationModalVisible, setVerificationModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    expired: 0
  });

  useEffect(() => {
    fetchCertificates();
    fetchStats();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllCertificates();
      setCertificates(response.certificates || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      message.error('Failed to fetch certificates');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiService.getCertificateStats();
      setStats(response.stats || {
        total: 0,
        verified: 0,
        pending: 0,
        expired: 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleViewCertificate = (certificate) => {
    setSelectedCertificate(certificate);
    setModalVisible(true);
  };

  const handleVerifyCertificate = (certificate) => {
    setSelectedCertificate(certificate);
    setVerificationModalVisible(true);
    form.resetFields();
  };

  const handleShowQRCode = (certificate) => {
    setSelectedCertificate(certificate);
    setQrModalVisible(true);
  };

  const handleVerificationSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      await apiService.verifyCertificate(selectedCertificate.certificateID, {
        verificationStatus: values.status,
        verifierComments: values.comments || '',
        verifiedBy: user.cccd,
        verificationDate: new Date().toISOString()
      });

      message.success('Certificate verification completed successfully');
      setVerificationModalVisible(false);
      fetchCertificates();
      fetchStats();
    } catch (error) {
      console.error('Certificate verification error:', error);
      message.error(error.message || 'Failed to verify certificate');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchCertificate = async (values) => {
    try {
      setLoading(true);
      let response;
      
      if (values.certificateID) {
        response = await apiService.getCertificate(values.certificateID);
        setCertificates([response.certificate]);
      } else if (values.ownerID) {
        response = await apiService.getCertificatesByOwner(values.ownerID);
        setCertificates(response.certificates || []);
      } else {
        // Reset to show all certificates
        fetchCertificates();
        return;
      }
      
      message.success(`Found ${Array.isArray(response.certificates) ? response.certificates.length : 1} certificate(s)`);
    } catch (error) {
      console.error('Search error:', error);
      message.error('Certificate not found or search failed');
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'verified': return 'green';
      case 'valid': return 'green';
      case 'pending': return 'orange';
      case 'expired': return 'red';
      case 'revoked': return 'red';
      default: return 'default';
    }
  };

  const isExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date();
  };

  const columns = [
    {
      title: 'Certificate ID',
      dataIndex: 'certificateID',
      key: 'certificateID',
      width: 150,
      render: (text) => <Text code>{text}</Text>
    },
    {
      title: 'Land Parcel ID',
      dataIndex: 'landParcelID',
      key: 'landParcelID',
      width: 150,
      render: (text) => <Text code>{text}</Text>
    },
    {
      title: 'Owner ID',
      dataIndex: 'ownerID',
      key: 'ownerID',
      width: 150
    },
    {
      title: 'Certificate Type',
      dataIndex: 'certificateType',
      key: 'certificateType',
      width: 150
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status, record) => {
        const expired = isExpired(record.expiryDate);
        const displayStatus = expired ? 'Expired' : status;
        return (
          <Tag color={getStatusColor(displayStatus)}>
            {displayStatus}
          </Tag>
        );
      }
    },
    {
      title: 'Issue Date',
      dataIndex: 'issueDate',
      key: 'issueDate',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString('vi-VN')
    },
    {
      title: 'Expiry Date',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      width: 120,
      render: (date) => (
        <Text type={isExpired(date) ? 'danger' : 'default'}>
          {new Date(date).toLocaleDateString('vi-VN')}
        </Text>
      )
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
            onClick={() => handleViewCertificate(record)}
          >
            View
          </Button>
          <Button
            type="link"
            icon={<QrcodeOutlined />}
            onClick={() => handleShowQRCode(record)}
          >
            QR Code
          </Button>
          {record.status === 'Pending' && (
            <Button
              type="link"
              icon={<SafetyOutlined />}
              onClick={() => handleVerifyCertificate(record)}
              style={{ color: '#1890ff' }}
            >
              Verify
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Certificate Verification</Title>
      <Text type="secondary">
        Verify and validate land ownership certificates
      </Text>

      {/* Search Section */}
      <Card style={{ marginTop: '24px', marginBottom: '24px' }}>
        <Title level={4}>Search Certificates</Title>
        <Form
          form={searchForm}
          layout="inline"
          onFinish={handleSearchCertificate}
        >
          <Form.Item name="certificateID">
            <Input
              placeholder="Certificate ID"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item name="ownerID">
            <Input
              placeholder="Owner ID (CCCD)"
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Search
            </Button>
          </Form.Item>
          <Form.Item>
            <Button onClick={() => {
              searchForm.resetFields();
              fetchCertificates();
            }}>
              Reset
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Certificates"
              value={stats.total}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Verified"
              value={stats.verified}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending Verification"
              value={stats.pending}
              valueStyle={{ color: '#faad14' }}
              prefix={<SafetyOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Expired"
              value={stats.expired}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Certificates Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={certificates}
          rowKey="certificateID"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} certificates`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Certificate Details Modal */}
      <Modal
        title="Certificate Details"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Close
          </Button>
        ]}
      >
        {selectedCertificate && (
          <>
            {isExpired(selectedCertificate.expiryDate) && (
              <Alert
                message="Certificate Expired"
                description="This certificate has expired and is no longer valid."
                type="error"
                showIcon
                style={{ marginBottom: '16px' }}
              />
            )}
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Certificate ID" span={2}>
                <Text code>{selectedCertificate.certificateID}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Land Parcel ID">
                <Text code>{selectedCertificate.landParcelID}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Owner ID">
                {selectedCertificate.ownerID}
              </Descriptions.Item>
              <Descriptions.Item label="Certificate Type">
                {selectedCertificate.certificateType}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(selectedCertificate.status)}>
                  {isExpired(selectedCertificate.expiryDate) ? 'Expired' : selectedCertificate.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Issue Date">
                {new Date(selectedCertificate.issueDate).toLocaleDateString('vi-VN')}
              </Descriptions.Item>
              <Descriptions.Item label="Expiry Date">
                <Text type={isExpired(selectedCertificate.expiryDate) ? 'danger' : 'default'}>
                  {new Date(selectedCertificate.expiryDate).toLocaleDateString('vi-VN')}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Issued By">
                {selectedCertificate.issuedBy || 'Land Registry Authority'}
              </Descriptions.Item>
              <Descriptions.Item label="Verified By">
                {selectedCertificate.verifiedBy || 'Not verified'}
              </Descriptions.Item>
              <Descriptions.Item label="Land Area">
                {selectedCertificate.landArea} m²
              </Descriptions.Item>
              <Descriptions.Item label="Land Use Purpose">
                {selectedCertificate.landUsePurpose}
              </Descriptions.Item>
              <Descriptions.Item label="Legal Status" span={2}>
                {selectedCertificate.legalStatus}
              </Descriptions.Item>
              {selectedCertificate.verifierComments && (
                <Descriptions.Item label="Verifier Comments" span={2}>
                  {selectedCertificate.verifierComments}
                </Descriptions.Item>
              )}
            </Descriptions>
          </>
        )}
      </Modal>

      {/* Verification Modal */}
      <Modal
        title="Verify Certificate"
        open={verificationModalVisible}
        onOk={handleVerificationSubmit}
        onCancel={() => setVerificationModalVisible(false)}
        confirmLoading={loading}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="status"
            label="Verification Status"
            rules={[{ required: true, message: 'Please select verification status' }]}
          >
            <Select placeholder="Select verification status">
              <Select.Option value="Verified">Verified</Select.Option>
              <Select.Option value="Rejected">Rejected</Select.Option>
              <Select.Option value="Requires Review">Requires Review</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="comments"
            label="Verification Comments"
          >
            <TextArea
              rows={4}
              placeholder="Enter verification comments..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* QR Code Modal */}
      <Modal
        title="Certificate QR Code"
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setQrModalVisible(false)}>
            Close
          </Button>
        ]}
        width={400}
      >
        {selectedCertificate && (
          <div style={{ textAlign: 'center' }}>
            <QRCode
              value={JSON.stringify({
                certificateID: selectedCertificate.certificateID,
                ownerID: selectedCertificate.ownerID,
                landParcelID: selectedCertificate.landParcelID,
                status: selectedCertificate.status,
                verificationUrl: `${window.location.origin}/verify/${selectedCertificate.certificateID}`
              })}
              size={200}
            />
            <div style={{ marginTop: '16px' }}>
              <Text type="secondary">
                Scan this QR code to verify certificate authenticity
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CertificateVerificationPage;
