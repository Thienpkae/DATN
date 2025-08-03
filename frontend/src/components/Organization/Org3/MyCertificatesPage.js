import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Typography,
  Row,
  Col,
  Statistic,
  Descriptions,
  QRCode,
  Alert,
  Input,
  message
} from 'antd';
import {
  EyeOutlined,
  QrcodeOutlined,
  DownloadOutlined,
  SearchOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import apiService from '../../../services/api';

const { Title, Text } = Typography;
const { Search } = Input;

/**
 * My Certificates Page for Org3 (Citizens)
 * Allows citizens to view and manage their land certificates
 */
const MyCertificatesPage = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    valid: 0,
    expired: 0,
    expiringSoon: 0
  });

  useEffect(() => {
    fetchCertificates();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCertificatesByOwner(user.cccd);
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
      const response = await apiService.getCertificateStatsByOwner(user.cccd);
      setStats(response.stats || {
        total: 0,
        valid: 0,
        expired: 0,
        expiringSoon: 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleViewCertificate = (certificate) => {
    setSelectedCertificate(certificate);
    setModalVisible(true);
  };

  const handleShowQRCode = (certificate) => {
    setSelectedCertificate(certificate);
    setQrModalVisible(true);
  };

  const handleDownloadCertificate = async (certificate) => {
    try {
      const response = await apiService.downloadCertificate(certificate.certificateID);
      // Create blob and download
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Certificate_${certificate.certificateID}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success('Certificate downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      message.error('Failed to download certificate');
    }
  };

  const handleSearchCertificate = async (value) => {
    if (!value.trim()) {
      fetchCertificates();
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.searchCertificatesByOwner(user.cccd, value);
      setCertificates(response.certificates || []);
      message.success(`Found ${response.certificates?.length || 0} certificate(s)`);
    } catch (error) {
      console.error('Search error:', error);
      message.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const isExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date();
  };

  const isExpiringSoon = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const getStatusColor = (certificate) => {
    if (isExpired(certificate.expiryDate)) return 'red';
    if (isExpiringSoon(certificate.expiryDate)) return 'orange';
    if (certificate.status === 'Valid') return 'green';
    return 'default';
  };

  const getStatusText = (certificate) => {
    if (isExpired(certificate.expiryDate)) return 'Expired';
    if (isExpiringSoon(certificate.expiryDate)) return 'Expiring Soon';
    return certificate.status || 'Valid';
  };

  const getStatusIcon = (certificate) => {
    if (isExpired(certificate.expiryDate)) return <CloseCircleOutlined />;
    if (isExpiringSoon(certificate.expiryDate)) return <ExclamationCircleOutlined />;
    return <CheckCircleOutlined />;
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
      title: 'Certificate Type',
      dataIndex: 'certificateType',
      key: 'certificateType',
      width: 150
    },
    {
      title: 'Land Area',
      dataIndex: 'landArea',
      key: 'landArea',
      width: 120,
      render: (area) => `${area} m²`
    },
    {
      title: 'Status',
      key: 'status',
      width: 150,
      render: (_, record) => (
        <Tag color={getStatusColor(record)} icon={getStatusIcon(record)}>
          {getStatusText(record)}
        </Tag>
      )
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
      render: (date, record) => (
        <Text type={isExpired(date) || isExpiringSoon(date) ? 'danger' : 'default'}>
          {new Date(date).toLocaleDateString('vi-VN')}
        </Text>
      )
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
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadCertificate(record)}
          >
            Download
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>My Certificates</Title>
      <Text type="secondary">
        View and manage your land ownership certificates
      </Text>

      {/* Search Section */}
      <Card style={{ marginTop: '24px', marginBottom: '24px' }}>
        <Search
          placeholder="Search certificates by ID, land parcel ID, or location"
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          onSearch={handleSearchCertificate}
          style={{ maxWidth: 600 }}
        />
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
              title="Valid Certificates"
              value={stats.valid}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Expiring Soon"
              value={stats.expiringSoon}
              valueStyle={{ color: '#faad14' }}
              prefix={<ExclamationCircleOutlined />}
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

      {/* Expiring Soon Alert */}
      {stats.expiringSoon > 0 && (
        <Alert
          message="Certificates Expiring Soon"
          description={`You have ${stats.expiringSoon} certificate(s) expiring within 30 days. Please contact the Land Registry Authority for renewal.`}
          type="warning"
          showIcon
          closable
          style={{ marginBottom: '24px' }}
        />
      )}

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
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadCertificate(selectedCertificate)}
          >
            Download PDF
          </Button>
        ]}
      >
        {selectedCertificate && (
          <>
            {isExpired(selectedCertificate.expiryDate) && (
              <Alert
                message="Certificate Expired"
                description="This certificate has expired and is no longer valid. Please contact the Land Registry Authority for renewal."
                type="error"
                showIcon
                style={{ marginBottom: '16px' }}
              />
            )}
            
            {isExpiringSoon(selectedCertificate.expiryDate) && (
              <Alert
                message="Certificate Expiring Soon"
                description={`This certificate will expire on ${new Date(selectedCertificate.expiryDate).toLocaleDateString('vi-VN')}. Please contact the Land Registry Authority for renewal.`}
                type="warning"
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
                <Tag color={getStatusColor(selectedCertificate)} icon={getStatusIcon(selectedCertificate)}>
                  {getStatusText(selectedCertificate)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Land Area">
                {selectedCertificate.landArea} m²
              </Descriptions.Item>
              <Descriptions.Item label="Land Use Purpose">
                {selectedCertificate.landUsePurpose}
              </Descriptions.Item>
              <Descriptions.Item label="Legal Status">
                {selectedCertificate.legalStatus}
              </Descriptions.Item>
              <Descriptions.Item label="Location">
                {selectedCertificate.location}
              </Descriptions.Item>
              <Descriptions.Item label="Issue Date">
                {new Date(selectedCertificate.issueDate).toLocaleDateString('vi-VN')}
              </Descriptions.Item>
              <Descriptions.Item label="Expiry Date">
                <Text type={isExpired(selectedCertificate.expiryDate) || isExpiringSoon(selectedCertificate.expiryDate) ? 'danger' : 'default'}>
                  {new Date(selectedCertificate.expiryDate).toLocaleDateString('vi-VN')}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Issued By">
                {selectedCertificate.issuedBy || 'Land Registry Authority'}
              </Descriptions.Item>
              <Descriptions.Item label="Verified By">
                {selectedCertificate.verifiedBy || 'Government Office'}
              </Descriptions.Item>
              {selectedCertificate.notes && (
                <Descriptions.Item label="Notes" span={2}>
                  {selectedCertificate.notes}
                </Descriptions.Item>
              )}
            </Descriptions>
          </>
        )}
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
                status: getStatusText(selectedCertificate),
                verificationUrl: `${window.location.origin}/verify/${selectedCertificate.certificateID}`
              })}
              size={200}
            />
            <div style={{ marginTop: '16px' }}>
              <Text type="secondary">
                Scan this QR code to verify certificate authenticity
              </Text>
            </div>
            <div style={{ marginTop: '8px' }}>
              <Text code style={{ fontSize: '12px' }}>
                Certificate ID: {selectedCertificate.certificateID}
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyCertificatesPage;
