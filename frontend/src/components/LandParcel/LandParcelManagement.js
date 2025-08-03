import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  message, 
  Space, 
  Typography,
  Row,
  Col,
  Divider
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  EyeOutlined, 
  SearchOutlined 
} from '@ant-design/icons';
import apiService from '../../services/api';

const { Title } = Typography;
const { Option } = Select;

const LandParcelManagement = ({ user }) => {
  const [landParcels, setLandParcels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingParcel, setEditingParcel] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewingParcel, setViewingParcel] = useState(null);
  const [searchForm] = Form.useForm();
  const [form] = Form.useForm();

  useEffect(() => {
    fetchLandParcels();
  }, [user?.userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLandParcels = async () => {
    setLoading(true);
    try {
      // For now, we'll get land parcels by owner since there's no getAll endpoint
      if (user?.userId) {
        const response = await apiService.getLandParcelsByOwner(user.userId);
        setLandParcels(response || []);
      } else {
        setLandParcels([]);
      }
    } catch (error) {
      console.error('Fetch land parcels error:', error);
      message.error(error.message || 'Failed to fetch land parcels');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateParcel = async (values) => {
    try {
      await apiService.createLandParcel(values);
      message.success('Land parcel created successfully');
      setModalVisible(false);
      form.resetFields();
      fetchLandParcels();
    } catch (error) {
      console.error('Create land parcel error:', error);
      message.error(error.message || 'Failed to create land parcel');
    }
  };

  const handleUpdateParcel = async (values) => {
    try {
      await apiService.updateLandParcel(editingParcel.id, values);
      message.success('Land parcel updated successfully');
      setModalVisible(false);
      setEditingParcel(null);
      form.resetFields();
      fetchLandParcels();
    } catch (error) {
      console.error('Update land parcel error:', error);
      message.error(error.message || 'Failed to update land parcel');
    }
  };

  const handleViewParcel = async (parcelId) => {
    try {
      const response = await apiService.getLandParcel(parcelId);
      setViewingParcel(response);
      setViewModalVisible(true);
    } catch (error) {
      console.error('View land parcel error:', error);
      message.error(error.message || 'Failed to fetch land parcel details');
    }
  };

  const handleSearch = async (values) => {
    setLoading(true);
    try {
      if (values.searchValue) {
        // Use the search API endpoint
        const response = await apiService.searchLandParcels(values.searchValue);
        setLandParcels(response || []);
      } else {
        // If no search value, fetch user's land parcels
        fetchLandParcels();
      }
    } catch (error) {
      console.error('Search error:', error);
      message.error(error.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Parcel ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Owner ID',
      dataIndex: 'ownerID',
      key: 'ownerID',
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
        <Space>
          <Button 
            icon={<EyeOutlined />} 
            onClick={() => handleViewParcel(record.id)}
          >
            View
          </Button>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => {
              setEditingParcel(record);
              form.setFieldsValue(record);
              setModalVisible(true);
            }}
          >
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>Land Parcel Management</Title>
      
      {/* Search Section */}
      <Card title="Search Land Parcels" style={{ marginBottom: 16 }}>
        <Form
          form={searchForm}
          layout="inline"
          onFinish={handleSearch}
        >
          <Form.Item name="searchType" label="Search By">
            <Select style={{ width: 150 }} placeholder="Select type">
              <Option value="owner">Owner ID</Option>
              <Option value="location">Location</Option>
              <Option value="purpose">Purpose</Option>
              <Option value="legalStatus">Legal Status</Option>
            </Select>
          </Form.Item>
          <Form.Item name="searchValue" label="Value">
            <Input placeholder="Enter search value" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              Search
            </Button>
          </Form.Item>
          <Form.Item>
            <Button onClick={() => {
              searchForm.resetFields();
              fetchLandParcels();
            }}>
              Reset
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Main Content */}
      <Card 
        title="Land Parcels" 
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            Create Land Parcel
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={landParcels}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingParcel ? "Edit Land Parcel" : "Create Land Parcel"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingParcel(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={editingParcel ? handleUpdateParcel : handleCreateParcel}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="id"
                label="Parcel ID"
                rules={[{ required: true, message: 'Please input parcel ID!' }]}
              >
                <Input disabled={editingParcel} placeholder="Enter parcel ID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="ownerID"
                label="Owner ID"
                rules={[{ required: true, message: 'Please input owner ID!' }]}
              >
                <Input placeholder="Enter owner ID" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="location"
            label="Location"
            rules={[{ required: true, message: 'Please input location!' }]}
          >
            <Input.TextArea placeholder="Enter location details" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="area"
                label="Area (m²)"
                rules={[{ required: true, message: 'Please input area!' }]}
              >
                <Input type="number" placeholder="Enter area in square meters" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="landUsePurpose"
                label="Land Use Purpose"
                rules={[{ required: true, message: 'Please select purpose!' }]}
              >
                <Select placeholder="Select purpose">
                  <Option value="residential">Residential</Option>
                  <Option value="commercial">Commercial</Option>
                  <Option value="agricultural">Agricultural</Option>
                  <Option value="industrial">Industrial</Option>
                  <Option value="other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="legalStatus"
            label="Legal Status"
            rules={[{ required: true, message: 'Please select legal status!' }]}
          >
            <Select placeholder="Select legal status">
              <Option value="owned">Owned</Option>
              <Option value="leased">Leased</Option>
              <Option value="disputed">Disputed</Option>
              <Option value="government">Government</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingParcel ? 'Update' : 'Create'}
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                setEditingParcel(null);
                form.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Modal */}
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
            <Row gutter={16}>
              <Col span={12}>
                <p><strong>Parcel ID:</strong> {viewingParcel.id}</p>
                <p><strong>Owner ID:</strong> {viewingParcel.ownerID}</p>
                <p><strong>Area:</strong> {viewingParcel.area} m²</p>
              </Col>
              <Col span={12}>
                <p><strong>Purpose:</strong> {viewingParcel.landUsePurpose}</p>
                <p><strong>Legal Status:</strong> {viewingParcel.legalStatus}</p>
                <p><strong>Created By:</strong> {viewingParcel.createdBy}</p>
              </Col>
            </Row>
            <Divider />
            <p><strong>Location:</strong></p>
            <p>{viewingParcel.location}</p>
            {viewingParcel.timestamp && (
              <p><strong>Created:</strong> {new Date(viewingParcel.timestamp).toLocaleString()}</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LandParcelManagement;
