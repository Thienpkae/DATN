import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Alert,
  Button,
  Typography,
  Tag,
  Table,
  Spin,
  message
} from 'antd';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
  SecurityScanOutlined,
  BugOutlined
} from '@ant-design/icons';
import apiService from '../../services/api';

const { Title, Text } = Typography;

/**
 * System Health Page - Monitor system health matching backend /system/health endpoint
 */
const SystemHealthPage = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [healthData, setHealthData] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchSystemHealth();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSystemHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSystemHealth = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSystemHealth();
      setHealthData(response || {});
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching system health:', error);
      message.error('Failed to fetch system health data');
    } finally {
      setLoading(false);
    }
  };

  const getHealthStatus = (status) => {
    switch (status) {
      case 'healthy':
        return { color: 'green', icon: <CheckCircleOutlined />, text: 'Healthy' };
      case 'warning':
        return { color: 'orange', icon: <ExclamationCircleOutlined />, text: 'Warning' };
      case 'critical':
        return { color: 'red', icon: <CloseCircleOutlined />, text: 'Critical' };
      default:
        return { color: 'default', icon: <ExclamationCircleOutlined />, text: 'Unknown' };
    }
  };

  const renderOverallHealth = () => {
    const overall = healthData.overall || 'unknown';
    const status = getHealthStatus(overall);
    
    return (
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16}>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', color: status.color, marginBottom: '8px' }}>
                {status.icon}
              </div>
              <Title level={3} style={{ color: status.color, margin: 0 }}>
                {status.text}
              </Title>
              <Text type="secondary">Overall System Status</Text>
            </div>
          </Col>
          <Col span={18}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="Uptime"
                  value={healthData.uptime || '0 days'}
                  prefix={<CloudServerOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Active Connections"
                  value={healthData.activeConnections || 0}
                  prefix={<DatabaseOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Last Updated"
                  value={lastUpdated ? lastUpdated.toLocaleTimeString('vi-VN') : 'Never'}
                  prefix={<ReloadOutlined />}
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>
    );
  };

  const renderServiceStatus = () => {
    const services = healthData.services || {};
    
    const serviceData = [
      { name: 'Database', status: services.database || 'unknown', description: 'PostgreSQL Database' },
      { name: 'Blockchain', status: services.blockchain || 'unknown', description: 'Hyperledger Fabric Network' },
      { name: 'IPFS', status: services.ipfs || 'unknown', description: 'IPFS Storage Network' },
      { name: 'API Server', status: services.api || 'unknown', description: 'REST API Server' },
      { name: 'Authentication', status: services.auth || 'unknown', description: 'JWT Authentication Service' }
    ];

    const columns = [
      {
        title: 'Service',
        dataIndex: 'name',
        key: 'name',
        render: (name) => <Text strong>{name}</Text>
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status) => {
          const statusInfo = getHealthStatus(status);
          return (
            <Tag color={statusInfo.color} icon={statusInfo.icon}>
              {statusInfo.text}
            </Tag>
          );
        }
      },
      {
        title: 'Description',
        dataIndex: 'description',
        key: 'description'
      }
    ];

    return (
      <Card title="Service Status" style={{ marginBottom: '24px' }}>
        <Table
          columns={columns}
          dataSource={serviceData}
          rowKey="name"
          pagination={false}
          size="small"
        />
      </Card>
    );
  };

  const renderResourceUsage = () => {
    const resources = healthData.resources || {};
    
    return (
      <Card title="Resource Usage" style={{ marginBottom: '24px' }}>
        <Row gutter={16}>
          <Col span={8}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <Progress
                type="circle"
                percent={resources.cpu || 0}
                format={percent => `${percent}%`}
                strokeColor={resources.cpu > 80 ? '#ff4d4f' : resources.cpu > 60 ? '#faad14' : '#52c41a'}
              />
              <div style={{ marginTop: '8px' }}>
                <Text strong>CPU Usage</Text>
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <Progress
                type="circle"
                percent={resources.memory || 0}
                format={percent => `${percent}%`}
                strokeColor={resources.memory > 80 ? '#ff4d4f' : resources.memory > 60 ? '#faad14' : '#52c41a'}
              />
              <div style={{ marginTop: '8px' }}>
                <Text strong>Memory Usage</Text>
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <Progress
                type="circle"
                percent={resources.disk || 0}
                format={percent => `${percent}%`}
                strokeColor={resources.disk > 80 ? '#ff4d4f' : resources.disk > 60 ? '#faad14' : '#52c41a'}
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

  const renderAlerts = () => {
    const alerts = healthData.alerts || [];
    
    if (alerts.length === 0) {
      return (
        <Card title="System Alerts">
          <Alert
            message="No Active Alerts"
            description="All systems are operating normally."
            type="success"
            showIcon
          />
        </Card>
      );
    }

    return (
      <Card title="System Alerts" style={{ marginBottom: '24px' }}>
        {alerts.map((alert, index) => (
          <Alert
            key={index}
            message={alert.title}
            description={alert.description}
            type={alert.severity === 'critical' ? 'error' : alert.severity === 'warning' ? 'warning' : 'info'}
            showIcon
            style={{ marginBottom: '8px' }}
          />
        ))}
      </Card>
    );
  };

  const renderPerformanceMetrics = () => {
    const performance = healthData.performance || {};
    
    return (
      <Card title="Performance Metrics">
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="Response Time"
              value={performance.avgResponseTime || 0}
              suffix="ms"
              prefix={<BugOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Requests/min"
              value={performance.requestsPerMinute || 0}
              prefix={<CloudServerOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Error Rate"
              value={performance.errorRate || 0}
              suffix="%"
              valueStyle={{ color: performance.errorRate > 5 ? '#ff4d4f' : '#52c41a' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Security Score"
              value={performance.securityScore || 0}
              suffix="/100"
              valueStyle={{ color: performance.securityScore > 80 ? '#52c41a' : '#faad14' }}
              prefix={<SecurityScanOutlined />}
            />
          </Col>
        </Row>
      </Card>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Title level={2}>System Health Monitor</Title>
          <Text type="secondary">
            Real-time system health and performance monitoring
          </Text>
        </div>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={fetchSystemHealth}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      <Spin spinning={loading}>
        {/* Overall Health Status */}
        {renderOverallHealth()}

        {/* Service Status */}
        {renderServiceStatus()}

        {/* Resource Usage */}
        {renderResourceUsage()}

        {/* System Alerts */}
        {renderAlerts()}

        {/* Performance Metrics */}
        {renderPerformanceMetrics()}
      </Spin>
    </div>
  );
};

export default SystemHealthPage;
