import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Typography,
  Tag,
  message,
  Tabs,
  Popconfirm,
  Row,
  Col
} from 'antd';
import {
  HomeOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  HistoryOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import apiService from '../../../services/api';
import LandParcelCreatePage from './LandParcelCreatePage';
import LandParcelHistoryPage from './LandParcelHistoryPage';
import BulkOperationsPage from './BulkOperationsPage';

const { Title, Text } = Typography;

/**
 * Land Management Module for Org1 (Land Registry Authority)
 * Main module containing all land-related functions with tab navigation
 */
const LandManagementModule = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [landParcels, setLandParcels] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingParcel, setEditingParcel] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('view');
  const [form] = Form.useForm();

  useEffect(() => {
    fetchLandParcels();
  }, []);

  const fetchLandParcels = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllLandParcels({ limit: 100 });
      setLandParcels(response.landParcels || []);
    } catch (error) {
      console.error('Error fetching land parcels:', error);
      message.error('Failed to fetch land parcels');
    } finally {
      setLoading(false);
    }
  };

  const handleEditParcel = (parcel) => {
    setEditingParcel(parcel);
    form.setFieldsValue(parcel);
    setModalVisible(true);
  };

  const handleDeleteParcel = async (parcelId) => {
    // DISABLED: DeleteLandParcel function not implemented in chaincode
    console.log('Delete requested for parcel:', parcelId); // Acknowledge parameter
    message.warning('Land parcel deletion is currently not available. This feature is not implemented in the chaincode.');
    return;

    // try {
    //   setLoading(true);
    //   await apiService.deleteLandParcel(parcelId);
    //   message.success('Land parcel deleted successfully');
    //   fetchLandParcels();
    // } catch (error) {
    //   console.error('Delete parcel error:', error);
    //   message.error('Failed to delete land parcel');
    // } finally {
    //   setLoading(false);
    // }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (editingParcel) {
        await apiService.updateLandParcel(editingParcel.id, values);
        message.success('Land parcel updated successfully');
      } else {
        await apiService.createLandParcel(values);
        message.success('Land parcel created successfully');
      }

      setModalVisible(false);
      setEditingParcel(null);
      form.resetFields();
      fetchLandParcels();
    } catch (error) {
      console.error('Save parcel error:', error);
      message.error('Failed to save land parcel');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Parcel ID',
      dataIndex: 'id',
      key: 'id',
      render: (id) => <Text strong>{id}</Text>
    },
    {
      title: 'Owner ID',
      dataIndex: 'ownerID',
      key: 'ownerID'
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      ellipsis: true
    },
    {
      title: 'Area (m²)',
      dataIndex: 'area',
      key: 'area',
      render: (area) => area?.toLocaleString()
    },
    {
      title: 'Land Use',
      dataIndex: 'landUsePurpose',
      key: 'landUsePurpose',
      render: (purpose) => <Tag color="blue">{purpose}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'legalStatus',
      key: 'legalStatus',
      render: (status) => {
        const colors = {
          'Registered': 'green',
          'Pending Registration': 'orange',
          'Under Review': 'blue',
          'Disputed': 'red'
        };
        return <Tag color={colors[status] || 'default'}>{status}</Tag>;
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
            onClick={() => message.info('View details functionality')}
          >
            View
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditParcel(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this land parcel?"
            description="This action cannot be undone."
            onConfirm={() => handleDeleteParcel(record.id)}
            okText="Yes"
            cancelText="No"
            icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
          >
            <Button
              type="link"
              icon={<DeleteOutlined />}
              danger
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const renderLandParcelsList = () => (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4}>Land Parcels</Title>
        <Space>
          <Input.Search
            placeholder="Search land parcels..."
            allowClear
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setActiveTab('create')}
          >
            Create New Parcel
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={landParcels.filter(parcel => 
          parcel.id?.toLowerCase().includes(searchText.toLowerCase()) ||
          parcel.ownerID?.toLowerCase().includes(searchText.toLowerCase()) ||
          parcel.location?.toLowerCase().includes(searchText.toLowerCase())
        )}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} parcels`
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
          View Land Parcels
        </span>
      ),
      children: renderLandParcelsList()
    },
    {
      key: 'create',
      label: (
        <span>
          <PlusOutlined />
          Create Land Parcel
        </span>
      ),
      children: <LandParcelCreatePage user={user} onSuccess={() => {
        fetchLandParcels();
        setActiveTab('view');
      }} />
    },
    {
      key: 'history',
      label: (
        <span>
          <HistoryOutlined />
          Land Parcel History
        </span>
      ),
      children: <LandParcelHistoryPage user={user} />
    },
    {
      key: 'bulk',
      label: (
        <span>
          <DatabaseOutlined />
          Bulk Operations
        </span>
      ),
      children: <BulkOperationsPage user={user} />
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
          <HomeOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          Land Management Module
        </Title>
        <Text type="secondary" style={{ color: '#666666' }}>
          Comprehensive land management with all related functions
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

      {/* Edit Modal */}
      <Modal
        title="Edit Land Parcel"
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setModalVisible(false);
          setEditingParcel(null);
          form.resetFields();
        }}
        confirmLoading={loading}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="id"
                label="Land Parcel ID"
                rules={[{ required: true, message: 'Please enter land parcel ID' }]}
              >
                <Input placeholder="LP123456" disabled={!!editingParcel} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="ownerID"
                label="Owner ID"
                rules={[{ required: true, message: 'Please enter owner ID' }]}
              >
                <Input placeholder="Owner ID" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default LandManagementModule;
