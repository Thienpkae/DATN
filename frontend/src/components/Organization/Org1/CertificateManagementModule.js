import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  message,
  Tabs,
  Popconfirm,
  Input
} from 'antd';
import {
  SafetyCertificateOutlined,
  EyeOutlined,
  DownloadOutlined,
  StopOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
  PlusOutlined
} from '@ant-design/icons';
import apiService from '../../../services/api';
import CertificateIssuancePage from './CertificateIssuancePage';

const { Title, Text } = Typography;

/**
 * Certificate Management Module for Org1 (Land Registry Authority)
 * Main module containing all certificate-related functions with tab navigation
 */
const CertificateManagementModule = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('view');

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllCertificates({ limit: 100 });
      setCertificates(response.certificates || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      message.error('Failed to fetch certificates');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeCertificate = async (certificateID, reason = 'Administrative revocation') => {
    try {
      setLoading(true);
      await apiService.revokeCertificate(certificateID, reason);
      message.success('Certificate revoked successfully');
      fetchCertificates();
    } catch (error) {
      console.error('Revoke certificate error:', error);
      message.error('Failed to revoke certificate');
    } finally {
      setLoading(false);
    }
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
      key: 'landParcelID'
    },
    {
      title: 'Owner ID',
      dataIndex: 'ownerID',
      key: 'ownerID'
    },
    {
      title: 'Issue Date',
      dataIndex: 'issuedDate',
      key: 'issuedDate',
      render: (date) => date ? new Date(date).toLocaleDateString('vi-VN') : 'N/A'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          'active': 'green',
          'revoked': 'red',
          'expired': 'orange'
        };
        return <Tag color={colors[status] || 'default'}>{status?.toUpperCase()}</Tag>;
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
            onClick={() => message.info('View certificate details')}
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

  const renderCertificatesList = () => (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4}>Certificates</Title>
        <Space>
          <Input.Search
            placeholder="Search certificates..."
            allowClear
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setActiveTab('issue')}
          >
            Issue Certificate
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={certificates.filter(cert => 
          cert.certificateID?.toLowerCase().includes(searchText.toLowerCase()) ||
          cert.landParcelID?.toLowerCase().includes(searchText.toLowerCase()) ||
          cert.ownerID?.toLowerCase().includes(searchText.toLowerCase())
        )}
        rowKey="certificateID"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} certificates`
        }}
      />
    </div>
  );

  const tabItems = [
    {
      key: 'view',
      label: (
        <span>
          <EyeOutlined />
          View Certificates
        </span>
      ),
      children: renderCertificatesList()
    },
    {
      key: 'issue',
      label: (
        <span>
          <PlusOutlined />
          Issue Certificate
        </span>
      ),
      children: <CertificateIssuancePage user={user} onSuccess={() => {
        fetchCertificates();
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
          <SafetyCertificateOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
          Certificate Management Module
        </Title>
        <Text type="secondary" style={{ color: '#666666' }}>
          Issue, manage, and revoke land certificates
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

export default CertificateManagementModule;
