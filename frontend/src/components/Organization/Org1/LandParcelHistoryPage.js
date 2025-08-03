import { useState } from 'react';
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
  Timeline,
  Descriptions,
  Input,
  DatePicker,
  Select,
  message
} from 'antd';
import {
  HistoryOutlined,
  EyeOutlined,
  SearchOutlined,
  CalendarOutlined,
  UserOutlined,
  SwapOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import apiService from '../../../services/api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

/**
 * Land Parcel History Page for Org1
 * View complete history and timeline of land parcel changes
 */
const LandParcelHistoryPage = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [landParcelId, setLandParcelId] = useState('');
  const [dateRange, setDateRange] = useState([]);
  const [actionType, setActionType] = useState('');

  const fetchHistory = async () => {
    if (!landParcelId) return;
    
    try {
      setLoading(true);
      const params = {
        startDate: dateRange[0]?.format('YYYY-MM-DD'),
        endDate: dateRange[1]?.format('YYYY-MM-DD'),
        actionType
      };
      
      const response = await apiService.getLandParcelHistory(landParcelId, params);
      setHistoryData(response.history || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      message.error('Failed to fetch land parcel history');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (record) => {
    setSelectedHistory(record);
    setModalVisible(true);
  };

  const getActionColor = (action) => {
    switch (action?.toLowerCase()) {
      case 'created': return 'green';
      case 'updated': return 'blue';
      case 'transferred': return 'orange';
      case 'split': return 'purple';
      case 'merged': return 'cyan';
      case 'deleted': return 'red';
      default: return 'default';
    }
  };

  const getActionIcon = (action) => {
    switch (action?.toLowerCase()) {
      case 'created': return <FileTextOutlined />;
      case 'updated': return <FileTextOutlined />;
      case 'transferred': return <SwapOutlined />;
      case 'split': return <SwapOutlined />;
      case 'merged': return <SwapOutlined />;
      default: return <HistoryOutlined />;
    }
  };

  const columns = [
    {
      title: 'Date & Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp) => new Date(timestamp).toLocaleString('vi-VN'),
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 120,
      render: (action) => (
        <Tag color={getActionColor(action)} icon={getActionIcon(action)}>
          {action}
        </Tag>
      )
    },
    {
      title: 'Performed By',
      dataIndex: 'performedBy',
      key: 'performedBy',
      width: 150,
      render: (user) => (
        <Space>
          <UserOutlined />
          <Text>{user}</Text>
        </Space>
      )
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: 'Transaction ID',
      dataIndex: 'transactionId',
      key: 'transactionId',
      width: 150,
      render: (txId) => txId ? <Text code>{txId}</Text> : 'N/A'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
        >
          View
        </Button>
      )
    }
  ];

  const renderTimeline = () => {
    const timelineItems = historyData.map(item => ({
      color: getActionColor(item.action),
      dot: getActionIcon(item.action),
      children: (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text strong>{item.action}</Text>
            <Text type="secondary">{new Date(item.timestamp).toLocaleString('vi-VN')}</Text>
          </div>
          <Text>{item.description}</Text>
          <br />
          <Text type="secondary">By: {item.performedBy}</Text>
        </div>
      )
    }));

    return <Timeline items={timelineItems} />;
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Land Parcel History</Title>
      <Text type="secondary">
        View complete history and timeline of land parcel changes
      </Text>

      {/* Search Controls */}
      <Card style={{ marginTop: '24px', marginBottom: '24px' }}>
        <Row gutter={16}>
          <Col span={6}>
            <Input
              placeholder="Enter Land Parcel ID"
              value={landParcelId}
              onChange={(e) => setLandParcelId(e.target.value)}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col span={6}>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="Action Type"
              value={actionType}
              onChange={setActionType}
              style={{ width: '100%' }}
              allowClear
            >
              <Select.Option value="created">Created</Select.Option>
              <Select.Option value="updated">Updated</Select.Option>
              <Select.Option value="transferred">Transferred</Select.Option>
              <Select.Option value="split">Split</Select.Option>
              <Select.Option value="merged">Merged</Select.Option>
            </Select>
          </Col>
          <Col span={4}>
            <Button
              type="primary"
              onClick={fetchHistory}
              loading={loading}
              disabled={!landParcelId}
            >
              Search History
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Statistics */}
      {historyData.length > 0 && (
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Events"
                value={historyData.length}
                prefix={<HistoryOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Transfers"
                value={historyData.filter(h => h.action === 'transferred').length}
                prefix={<SwapOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Updates"
                value={historyData.filter(h => h.action === 'updated').length}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Last Activity"
                value={historyData.length > 0 ? new Date(historyData[0].timestamp).toLocaleDateString('vi-VN') : 'N/A'}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* History Table */}
      <Card title="History Records" style={{ marginBottom: '24px' }}>
        <Table
          columns={columns}
          dataSource={historyData}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} records`
          }}
        />
      </Card>

      {/* Timeline View */}
      {historyData.length > 0 && (
        <Card title="Timeline View">
          {renderTimeline()}
        </Card>
      )}

      {/* Details Modal */}
      <Modal
        title="History Record Details"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Close
          </Button>
        ]}
        width={600}
      >
        {selectedHistory && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Action" span={2}>
              <Tag color={getActionColor(selectedHistory.action)} icon={getActionIcon(selectedHistory.action)}>
                {selectedHistory.action}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Date & Time">
              {new Date(selectedHistory.timestamp).toLocaleString('vi-VN')}
            </Descriptions.Item>
            <Descriptions.Item label="Performed By">
              {selectedHistory.performedBy}
            </Descriptions.Item>
            <Descriptions.Item label="Transaction ID">
              {selectedHistory.transactionId ? <Text code>{selectedHistory.transactionId}</Text> : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Land Parcel ID">
              <Text code>{selectedHistory.landParcelId}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Description" span={2}>
              {selectedHistory.description}
            </Descriptions.Item>
            {selectedHistory.oldValues && (
              <Descriptions.Item label="Previous Values" span={2}>
                <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                  {JSON.stringify(selectedHistory.oldValues, null, 2)}
                </pre>
              </Descriptions.Item>
            )}
            {selectedHistory.newValues && (
              <Descriptions.Item label="New Values" span={2}>
                <pre style={{ fontSize: '12px', background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                  {JSON.stringify(selectedHistory.newValues, null, 2)}
                </pre>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default LandParcelHistoryPage;
