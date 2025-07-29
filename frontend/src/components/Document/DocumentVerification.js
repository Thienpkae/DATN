import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Typography, message, Button, Space } from 'antd';
import { CheckCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { documentAPI } from '../../services/api';

const { Title } = Typography;

const DocumentVerification = ({ user }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUnverifiedDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await documentAPI.getAll();
      if (Array.isArray(response.data)) {
        setDocuments(response.data.filter(doc => !doc.verified));
      } else {
        console.error("Unexpected response format for getAll documents in verification:", response.data);
        setDocuments([]);
      }
    } catch (error) {
      message.error('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnverifiedDocuments();
  }, [fetchUnverifiedDocuments]);

  const handleVerifyDocument = async (docId) => {
    try {
      await documentAPI.verify(docId);
      message.success('Document verified successfully');
      fetchUnverifiedDocuments();
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to verify document');
    }
  };

  const columns = [
    {
      title: 'Document ID',
      dataIndex: 'docID',
      key: 'docID',
    },
    {
      title: 'Land Parcel ID',
      dataIndex: 'landParcelID',
      key: 'landParcelID',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Uploaded By',
      dataIndex: 'uploadedBy',
      key: 'uploadedBy',
    },
    {
      title: 'Upload Date',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => timestamp ? new Date(timestamp).toLocaleDateString() : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />}>
            View
          </Button>
          <Button 
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => handleVerifyDocument(record.docID)}
          >
            Verify
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>Document Verification</Title>
      
      <Card title={`Pending Verification (${documents.length})`}>
        <Table
          columns={columns}
          dataSource={documents}
          loading={loading}
          rowKey="docID"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default DocumentVerification;
