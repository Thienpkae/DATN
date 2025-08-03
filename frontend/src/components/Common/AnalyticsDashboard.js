import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Select,
  DatePicker,
  Typography,
  Spin,
  Progress,
  Table,
  Tag,
  message
} from 'antd';
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  RiseOutlined,
  UserOutlined,
  HomeOutlined,
  FileTextOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import apiService from '../../services/api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

/**
 * Analytics Dashboard - Comprehensive analytics matching backend /analytics endpoint
 */
const AnalyticsDashboard = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({});
  const [period, setPeriod] = useState('30d');
  const [dateRange, setDateRange] = useState([]);

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAnalyticsData(period);
      setAnalyticsData(response || {});
    } catch (error) {
      console.error('Error fetching analytics:', error);
      message.error('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const renderOverviewStats = () => {
    const stats = analyticsData.overview || {};
    
    return (
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Land Parcels"
              value={stats.totalLandParcels || 0}
              prefix={<HomeOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Certificates"
              value={stats.activeCertificates || 0}
              prefix={<SafetyOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Transactions"
              value={stats.totalTransactions || 0}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Registered Users"
              value={stats.totalUsers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  const renderTransactionStats = () => {
    const transactions = analyticsData.transactions || {};
    
    return (
      <Card title="Transaction Analytics" style={{ marginBottom: '24px' }}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="Pending Transactions"
              value={transactions.pending || 0}
              valueStyle={{ color: '#faad14' }}
            />
            <Progress
              percent={transactions.total > 0 ? Math.round((transactions.pending / transactions.total) * 100) : 0}
              strokeColor="#faad14"
              size="small"
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Approved Transactions"
              value={transactions.approved || 0}
              valueStyle={{ color: '#52c41a' }}
            />
            <Progress
              percent={transactions.total > 0 ? Math.round((transactions.approved / transactions.total) * 100) : 0}
              strokeColor="#52c41a"
              size="small"
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Rejected Transactions"
              value={transactions.rejected || 0}
              valueStyle={{ color: '#ff4d4f' }}
            />
            <Progress
              percent={transactions.total > 0 ? Math.round((transactions.rejected / transactions.total) * 100) : 0}
              strokeColor="#ff4d4f"
              size="small"
            />
          </Col>
        </Row>
      </Card>
    );
  };

  const renderRecentActivity = () => {
    const activities = analyticsData.recentActivity || [];
    
    const columns = [
      {
        title: 'Time',
        dataIndex: 'timestamp',
        key: 'timestamp',
        width: 150,
        render: (timestamp) => new Date(timestamp).toLocaleString('vi-VN')
      },
      {
        title: 'Type',
        dataIndex: 'type',
        key: 'type',
        width: 120,
        render: (type) => {
          const colors = {
            'land_parcel': 'blue',
            'certificate': 'green',
            'transaction': 'orange',
            'document': 'purple'
          };
          return <Tag color={colors[type] || 'default'}>{type}</Tag>;
        }
      },
      {
        title: 'Action',
        dataIndex: 'action',
        key: 'action',
        width: 120
      },
      {
        title: 'User',
        dataIndex: 'user',
        key: 'user',
        width: 150
      },
      {
        title: 'Details',
        dataIndex: 'details',
        key: 'details',
        ellipsis: true
      }
    ];

    return (
      <Card title="Recent Activity" style={{ marginBottom: '24px' }}>
        <Table
          columns={columns}
          dataSource={activities}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          size="small"
        />
      </Card>
    );
  };

  const renderSystemHealth = () => {
    const health = analyticsData.systemHealth || {};
    
    return (
      <Card title="System Health" style={{ marginBottom: '24px' }}>
        <Row gutter={16}>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <Progress
                type="circle"
                percent={health.cpuUsage || 0}
                format={percent => `${percent}%`}
                strokeColor={health.cpuUsage > 80 ? '#ff4d4f' : '#52c41a'}
              />
              <div style={{ marginTop: '8px' }}>
                <Text strong>CPU Usage</Text>
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <Progress
                type="circle"
                percent={health.memoryUsage || 0}
                format={percent => `${percent}%`}
                strokeColor={health.memoryUsage > 80 ? '#ff4d4f' : '#52c41a'}
              />
              <div style={{ marginTop: '8px' }}>
                <Text strong>Memory Usage</Text>
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <Progress
                type="circle"
                percent={health.diskUsage || 0}
                format={percent => `${percent}%`}
                strokeColor={health.diskUsage > 80 ? '#ff4d4f' : '#52c41a'}
              />
              <div style={{ marginTop: '8px' }}>
                <Text strong>Disk Usage</Text>
              </div>
            </div>
          </Col>
        </Row>
      </Card>
    );
  };

  const renderTrendCharts = () => {
    return (
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={12}>
          <Card title="Transaction Trends" extra={<LineChartOutlined />}>
            <div style={{ 
              height: '200px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: '#fafafa',
              border: '1px dashed #d9d9d9',
              borderRadius: '6px'
            }}>
              <Text type="secondary">Transaction trend chart will be displayed here</Text>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Land Parcel Distribution" extra={<PieChartOutlined />}>
            <div style={{ 
              height: '200px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: '#fafafa',
              border: '1px dashed #d9d9d9',
              borderRadius: '6px'
            }}>
              <Text type="secondary">Distribution chart will be displayed here</Text>
            </div>
          </Card>
        </Col>
      </Row>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Title level={2}>Analytics Dashboard</Title>
          <Text type="secondary">
            Comprehensive system analytics and insights
          </Text>
        </div>
        <div>
          <Select
            value={period}
            onChange={setPeriod}
            style={{ width: 120, marginRight: '16px' }}
          >
            <Select.Option value="7d">Last 7 days</Select.Option>
            <Select.Option value="30d">Last 30 days</Select.Option>
            <Select.Option value="90d">Last 90 days</Select.Option>
            <Select.Option value="1y">Last year</Select.Option>
          </Select>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            style={{ width: 300 }}
          />
        </div>
      </div>

      <Spin spinning={loading}>
        {/* Overview Statistics */}
        {renderOverviewStats()}

        {/* Transaction Analytics */}
        {renderTransactionStats()}

        {/* Trend Charts */}
        {renderTrendCharts()}

        {/* System Health */}
        {user.org === 'Org1' && renderSystemHealth()}

        {/* Recent Activity */}
        {renderRecentActivity()}

        {/* Performance Metrics */}
        <Card title="Performance Metrics">
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="Avg Response Time"
                value={analyticsData.performance?.avgResponseTime || 0}
                suffix="ms"
                prefix={<RiseOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Success Rate"
                value={analyticsData.performance?.successRate || 0}
                suffix="%"
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Active Sessions"
                value={analyticsData.performance?.activeSessions || 0}
                prefix={<UserOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Data Storage"
                value={analyticsData.performance?.dataStorage || 0}
                suffix="GB"
                prefix={<FileTextOutlined />}
              />
            </Col>
          </Row>
        </Card>
      </Spin>
    </div>
  );
};

export default AnalyticsDashboard;
