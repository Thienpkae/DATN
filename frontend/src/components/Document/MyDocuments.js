import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, message, Typography } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import apiService from '../../services/api';

const { Title } = Typography;

const MyDocuments = ({ user }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMyDocuments = useCallback(async () => {
    if (!user?.userId) return;

    setLoading(true);
    try {
      // Search documents for the current user
      const response = await apiService.searchDocuments(user.userId, '');
      setDocuments(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Fetch my documents error:', error);
      message.error(error.message || 'Failed to fetch your documents');
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

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
