import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Typography, message, Button, Modal } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { certificateAPI } from '../../services/api';

const { Title } = Typography;

const MyCertificates = ({ user }) => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewingCertificate, setViewingCertificate] = useState(null);

  const fetchMyCertificates = useCallback(async () => {
    setLoading(true);
    try {
      const response = await certificateAPI.getByOwner(user.userId);
      setCertificates(response.data || []);
    } catch (error) {
      message.error('Failed to fetch my certificates');
    } finally {
      setLoading(false);
    }
  }, [user.userId]);

  useEffect(() => {
    fetchMyCertificates();
  }, [fetchMyCertificates]);

  const columns = [
    {
      title: 'Certificate ID',
      dataIndex: 'certificateID',
      key: 'certificateID',
    },
    {
      title: 'Land Parcel ID',
      dataIndex: 'landParcelID',
      key: 'landParcelID',
    },
    {
      title: 'Issue Date',
      dataIndex: 'issueDate',
      key: 'issueDate',
      render: (date) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span className={`transaction-status status-${status || 'active'}`}>
          {status || 'Active'}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          icon={<EyeOutlined />} 
          onClick={() => {
            setViewingCertificate(record);
            setViewModalVisible(true);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>My Certificates</Title>
      
      <Card title={`Your Land Certificates (${certificates.length})`}>
        <Table
          columns={columns}
          dataSource={certificates}
          loading={loading}
          rowKey="certificateID"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="Certificate Details"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>
        ]}
        width={600}
      >
        {viewingCertificate && (
          <div>
            <p><strong>Certificate ID:</strong> {viewingCertificate.certificateID}</p>
            <p><strong>Land Parcel ID:</strong> {viewingCertificate.landParcelID}</p>
            <p><strong>Issue Date:</strong> {viewingCertificate.issueDate ? new Date(viewingCertificate.issueDate).toLocaleString() : '-'}</p>
            <p><strong>Legal Information:</strong></p>
            <p>{viewingCertificate.legalInfo}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyCertificates;
