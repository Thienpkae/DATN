import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, message, Typography, Modal } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { landParcelAPI } from '../../services/api';

const { Title } = Typography;

const MyLandParcels = ({ user }) => {
  const [landParcels, setLandParcels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewingParcel, setViewingParcel] = useState(null);

  const fetchMyLandParcels = useCallback(async () => {
    setLoading(true);
    try {
      const response = await landParcelAPI.getByOwner(user.userId);
      setLandParcels(response.data || []);
    } catch (error) {
      message.error('Failed to fetch my land parcels');
    } finally {
      setLoading(false);
    }
  }, [user.userId]);

  useEffect(() => {
    fetchMyLandParcels();
  }, [fetchMyLandParcels]);

  const columns = [
    {
      title: 'Parcel ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Area (m²)',
      dataIndex: 'area',
      key: 'area',
    },
    {
      title: 'Purpose',
      dataIndex: 'landUsePurpose',
      key: 'landUsePurpose',
    },
    {
      title: 'Legal Status',
      dataIndex: 'legalStatus',
      key: 'legalStatus',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          icon={<EyeOutlined />} 
          onClick={() => {
            setViewingParcel(record);
            setViewModalVisible(true);
          }}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>My Land Parcels</Title>
      
      <Card title={`Your Land Parcels (${landParcels.length})`}>
        <Table
          columns={columns}
          dataSource={landParcels}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="Land Parcel Details"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>
        ]}
        width={600}
      >
        {viewingParcel && (
          <div>
            <p><strong>Parcel ID:</strong> {viewingParcel.id}</p>
            <p><strong>Location:</strong> {viewingParcel.location}</p>
            <p><strong>Area:</strong> {viewingParcel.area} m²</p>
            <p><strong>Purpose:</strong> {viewingParcel.landUsePurpose}</p>
            <p><strong>Legal Status:</strong> {viewingParcel.legalStatus}</p>
            {viewingParcel.timestamp && (
              <p><strong>Created:</strong> {new Date(viewingParcel.timestamp).toLocaleString()}</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyLandParcels;
