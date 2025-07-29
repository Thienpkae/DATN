import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, message, Typography } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { documentAPI } from '../../services/api';

const { Title } = Typography;

const MyDocuments = ({ user }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMyDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await documentAPI.getAll();
      if (Array.isArray(response.data)) {
        setDocuments(response.data.filter(doc => doc.uploadedBy === user.userId));
      } else {
        console.error("Unexpected response format for getAll documents in MyDocuments:", response.data);
        setDocuments([]);
      }
    } catch (error) {
      message.error('Failed to fetch your documents');
    } finally {
      setLoading(false);
    }
  }, [user.userId]);

  useEffect(() => {
    fetchMyDocuments();
  }, [fetchMyDocuments]);

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
      title: 'Status',
      dataIndex: 'verified',
      key: 'verified',
      render: (verified) => (
        <span className={`transaction-status ${verified ? 'status-approved' : 'status-pending'}`}>
          {verified ? 'Verified' : 'Pending'}
        </span>
      ),
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
        <Button icon={<EyeOutlined />}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>My Documents</Title>
      
      <Card title={`Your Documents (${documents.length})`}>
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

export default MyDocuments;
