import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Table,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Typography,
  Tag,
  message,
  Statistic,
  Tabs,
  Descriptions
} from 'antd';
import {
  HomeOutlined,
  EyeOutlined,
  SwapOutlined,
  FileTextOutlined,
  SearchOutlined,
  FilterOutlined,
  EnvironmentOutlined,
  DollarOutlined
} from '@ant-design/icons';
import apiService from '../../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const MyLandAssetsPage = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [landParcels, setLandParcels] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [transferForm] = Form.useForm();

  useEffect(() => {
    fetchMyAssets();
  }, [user?.userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMyAssets = async () => {
    if (!user?.userId) return;
    
    setLoading(true);
    try {
      const [parcelsResponse, transactionsResponse, certificatesResponse] = await Promise.all([
        apiService.getLandParcelsByOwner(user.userId).catch(() => []),
        apiService.getTransactionsByOwner(user.userId).catch(() => []),
        apiService.getCertificatesByOwner(user.userId).catch(() => [])
      ]);

      setLandParcels(parcelsResponse || []);
      setTransactions(transactionsResponse || []);
      setCertificates(certificatesResponse || []);
    } catch (error) {
      console.error('Fetch assets error:', error);
      message.error('Failed to fetch your assets');
    } finally {
      setLoading(false);
    }
  };

  const handleViewParcel = (parcel) => {
    setSelectedParcel(parcel);
    setModalVisible(true);
  };

  const handleTransferRequest = (parcel) => {
    setSelectedParcel(parcel);
    transferForm.resetFields();
    setTransferModalVisible(true);
  };

  const handleSubmitTransfer = async () => {
    try {
      const values = await transferForm.validateFields();
      setLoading(true);

      const transferData = {
        landParcelID: selectedParcel.id,
        currentOwner: user.userId,
        newOwner: values.newOwner,
        transferType: values.transferType,
        price: values.price,
        reason: values.reason,
        documents: values.documents,
        requestDate: new Date().toISOString(),
        status: 'pending'
      };

      await apiService.requestTransfer(transferData);
      message.success('Transfer request submitted successfully');
      setTransferModalVisible(false);
      fetchMyAssets();
    } catch (error) {
      console.error('Transfer request error:', error);
      message.error(error.message || 'Failed to submit transfer request');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredParcels = () => {
    if (!searchText) return landParcels;
    
    return landParcels.filter(parcel =>
      parcel.id?.toLowerCase().includes(searchText.toLowerCase()) ||
      parcel.address?.toLowerCase().includes(searchText.toLowerCase())
    );
  };

  const parcelColumns = [
    {
      title: 'Parcel ID',
      dataIndex: 'id',
      key: 'id',
      render: (id) => <Text strong>{id}</Text>
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      render: (address) => (
        <Space>
          <EnvironmentOutlined />
          <Text>{address}</Text>
        </Space>
      )
    },
    {
      title: 'Area (m²)',
      dataIndex: 'area',
      key: 'area',
      render: (area) => area ? `${area.toLocaleString()} m²` : 'N/A'
    },
    {
      title: 'Purpose',
      dataIndex: 'purpose',
      key: 'purpose',
      render: (purpose) => {
        const colors = {
          'residential': 'blue',
          'commercial': 'green',
          'agricultural': 'orange',
          'industrial': 'purple'
        };
        return <Tag color={colors[purpose] || 'default'}>{purpose}</Tag>;
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          'active': 'green',
          'pending': 'orange',
          'disputed': 'red'
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
            onClick={() => handleViewParcel(record)}
          >
            View
          </Button>
          <Button
            type="link"
            icon={<SwapOutlined />}
            onClick={() => handleTransferRequest(record)}
          >
            Transfer
          </Button>
        </Space>
      )
    }
  ];

  const transactionColumns = [
    {
      title: 'Transaction ID',
      dataIndex: 'txID',
      key: 'txID',
      render: (id) => <Text strong>{id}</Text>
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag color="blue">{type}</Tag>
    },
    {
      title: 'Land Parcel',
      dataIndex: 'landParcelID',
      key: 'landParcelID'
    },
    {
      title: 'Date',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          'completed': 'green',
          'pending': 'orange',
          'rejected': 'red'
        };
        return <Tag color={colors[status] || 'default'}>{status}</Tag>;
      }
    }
  ];

  const stats = {
    totalParcels: landParcels.length,
    totalArea: landParcels.reduce((sum, parcel) => sum + (parcel.area || 0), 0),
    activeCertificates: certificates.filter(c => c.status === 'active').length,
    pendingTransactions: transactions.filter(t => t.status === 'pending').length
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <HomeOutlined style={{ marginRight: '8px' }} />
          My Land Assets
        </Title>
        <Text type="secondary">
          Manage your land parcels, certificates, and transactions
        </Text>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Parcels"
              value={stats.totalParcels}
              prefix={<HomeOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Area"
              value={stats.totalArea}
              suffix="m²"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Certificates"
              value={stats.activeCertificates}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Transactions"
              value={stats.pendingTransactions}
              prefix={<SwapOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Card>
        <Tabs defaultActiveKey="parcels">
          <TabPane tab="Land Parcels" key="parcels">
            <div style={{ marginBottom: '16px' }}>
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} sm={12} md={8}>
                  <Input
                    placeholder="Search parcels..."
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Button
                    icon={<FilterOutlined />}
                    onClick={fetchMyAssets}
                    loading={loading}
                  >
                    Refresh
                  </Button>
                </Col>
              </Row>
            </div>
            
            <Table
              columns={parcelColumns}
              dataSource={getFilteredParcels()}
              loading={loading}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} parcels`
              }}
            />
          </TabPane>

          <TabPane tab="Transactions" key="transactions">
            <Table
              columns={transactionColumns}
              dataSource={transactions}
              loading={loading}
              rowKey="txID"
              pagination={{
                pageSize: 10,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} transactions`
              }}
            />
          </TabPane>

          <TabPane tab="Certificates" key="certificates">
            <Row gutter={[16, 16]}>
              {certificates.map(cert => (
                <Col xs={24} sm={12} md={8} key={cert.certificateID}>
                  <Card
                    title={cert.certificateType}
                    extra={<Tag color={cert.status === 'active' ? 'green' : 'orange'}>{cert.status}</Tag>}
                    actions={[
                      <Button type="link" icon={<EyeOutlined />}>View</Button>,
                      <Button type="link" icon={<FileTextOutlined />}>Download</Button>
                    ]}
                  >
                    <p><strong>Certificate ID:</strong> {cert.certificateID}</p>
                    <p><strong>Land Parcel:</strong> {cert.landParcelID}</p>
                    <p><strong>Issue Date:</strong> {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : 'N/A'}</p>
                  </Card>
                </Col>
              ))}
              {certificates.length === 0 && (
                <Col span={24}>
                  <Card>
                    <Text type="secondary">No certificates found</Text>
                  </Card>
                </Col>
              )}
            </Row>
          </TabPane>
        </Tabs>
      </Card>

      {/* View Parcel Modal */}
      <Modal
        title="Land Parcel Details"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Close
          </Button>
        ]}
        width={700}
      >
        {selectedParcel && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Parcel ID" span={2}>
              {selectedParcel.id}
            </Descriptions.Item>
            <Descriptions.Item label="Address" span={2}>
              {selectedParcel.address}
            </Descriptions.Item>
            <Descriptions.Item label="Area">
              {selectedParcel.area ? `${selectedParcel.area.toLocaleString()} m²` : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Purpose">
              <Tag color="blue">{selectedParcel.purpose}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={selectedParcel.status === 'active' ? 'green' : 'orange'}>
                {selectedParcel.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Registration Date">
              {selectedParcel.registrationDate ? new Date(selectedParcel.registrationDate).toLocaleDateString() : 'N/A'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Transfer Request Modal */}
      <Modal
        title="Request Land Transfer"
        open={transferModalVisible}
        onOk={handleSubmitTransfer}
        onCancel={() => setTransferModalVisible(false)}
        confirmLoading={loading}
        width={600}
      >
        <Form form={transferForm} layout="vertical">
          <Form.Item
            name="newOwner"
            label="New Owner (CCCD)"
            rules={[
              { required: true, message: 'Please enter new owner CCCD' },
              { pattern: /^\d{12}$/, message: 'CCCD must be 12 digits' }
            ]}
          >
            <Input placeholder="Enter 12-digit CCCD" />
          </Form.Item>
          <Form.Item
            name="transferType"
            label="Transfer Type"
            rules={[{ required: true, message: 'Please select transfer type' }]}
          >
            <Select>
              <Option value="sale">Sale</Option>
              <Option value="gift">Gift</Option>
              <Option value="inheritance">Inheritance</Option>
              <Option value="exchange">Exchange</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="price"
            label="Transfer Price (VND)"
          >
            <Input type="number" prefix={<DollarOutlined />} />
          </Form.Item>
          <Form.Item
            name="reason"
            label="Reason for Transfer"
            rules={[{ required: true, message: 'Please provide reason' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MyLandAssetsPage;
