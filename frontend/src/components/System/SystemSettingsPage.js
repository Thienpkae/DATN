import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Input,
  Switch,
  Select,
  Space,
  Typography,
  message,
  Tabs,
  Alert,
  Statistic,
  Progress,
  Tag
} from 'antd';
import {
  SettingOutlined,
  DatabaseOutlined,
  CloudOutlined,
  LockOutlined,
  SaveOutlined,
  ReloadOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const SystemSettingsPage = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [systemInfo, setSystemInfo] = useState({});
  const [settings, setSettings] = useState({
    notifications: true,
    autoBackup: true,
    maintenanceMode: false,
    maxFileSize: 10,
    sessionTimeout: 30,
    passwordPolicy: 'strong',
    twoFactorAuth: false,
    auditLogging: true
  });

  useEffect(() => {
    fetchSystemInfo();
    loadSettings();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSystemInfo = async () => {
    // Simulate system information
    setSystemInfo({
      version: '1.0.0',
      uptime: '15 days, 3 hours',
      totalUsers: 1,
      totalTransactions: 0,
      storageUsed: 45,
      memoryUsage: 68,
      cpuUsage: 23,
      networkStatus: 'Connected',
      blockchainStatus: 'Synced',
      databaseStatus: 'Healthy'
    });
  };

  const loadSettings = () => {
    // Load settings from localStorage or API
    const savedSettings = localStorage.getItem('systemSettings');
    if (savedSettings) {
      setSettings({ ...settings, ...JSON.parse(savedSettings) });
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // Save settings to localStorage (in production, this would be an API call)
      localStorage.setItem('systemSettings', JSON.stringify(settings));
      message.success('Settings saved successfully');
    } catch (error) {
      message.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const resetSettings = () => {
    setSettings({
      notifications: true,
      autoBackup: true,
      maintenanceMode: false,
      maxFileSize: 10,
      sessionTimeout: 30,
      passwordPolicy: 'strong',
      twoFactorAuth: false,
      auditLogging: true
    });
    message.info('Settings reset to defaults');
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const getStatusColor = (status) => {
    const colors = {
      'Connected': 'green',
      'Synced': 'green',
      'Healthy': 'green',
      'Disconnected': 'red',
      'Error': 'red',
      'Warning': 'orange'
    };
    return colors[status] || 'default';
  };

  const systemOverview = (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="System Version"
              value={systemInfo.version}
              prefix={<SettingOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Uptime"
              value={systemInfo.uptime}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={systemInfo.totalUsers}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Transactions"
              value={systemInfo.totalTransactions}
              prefix={<CloudOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} md={12}>
          <Card title="System Performance">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text>Storage Usage</Text>
                <Progress percent={systemInfo.storageUsed} status="active" />
              </div>
              <div>
                <Text>Memory Usage</Text>
                <Progress percent={systemInfo.memoryUsage} status="active" />
              </div>
              <div>
                <Text>CPU Usage</Text>
                <Progress percent={systemInfo.cpuUsage} status="active" />
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="System Status">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Network Status:</Text>
                <Tag color={getStatusColor(systemInfo.networkStatus)}>
                  {systemInfo.networkStatus}
                </Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Blockchain Status:</Text>
                <Tag color={getStatusColor(systemInfo.blockchainStatus)}>
                  {systemInfo.blockchainStatus}
                </Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>Database Status:</Text>
                <Tag color={getStatusColor(systemInfo.databaseStatus)}>
                  {systemInfo.databaseStatus}
                </Tag>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const generalSettings = (
    <div>
      <Card title="General Settings" style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <Text strong>Enable Notifications</Text>
                <br />
                <Text type="secondary">Receive system notifications</Text>
              </div>
              <Switch
                checked={settings.notifications}
                onChange={(checked) => handleSettingChange('notifications', checked)}
              />
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <Text strong>Auto Backup</Text>
                <br />
                <Text type="secondary">Automatic daily backups</Text>
              </div>
              <Switch
                checked={settings.autoBackup}
                onChange={(checked) => handleSettingChange('autoBackup', checked)}
              />
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <Text strong>Maintenance Mode</Text>
                <br />
                <Text type="secondary">Enable maintenance mode</Text>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onChange={(checked) => handleSettingChange('maintenanceMode', checked)}
              />
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <Text strong>Audit Logging</Text>
                <br />
                <Text type="secondary">Log all system activities</Text>
              </div>
              <Switch
                checked={settings.auditLogging}
                onChange={(checked) => handleSettingChange('auditLogging', checked)}
              />
            </div>
          </Col>
        </Row>
      </Card>

      <Card title="File & Session Settings">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Text strong>Max File Size (MB)</Text>
            <Input
              type="number"
              value={settings.maxFileSize}
              onChange={(e) => handleSettingChange('maxFileSize', parseInt(e.target.value))}
              style={{ marginTop: '8px' }}
            />
          </Col>
          <Col xs={24} sm={12}>
            <Text strong>Session Timeout (minutes)</Text>
            <Input
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
              style={{ marginTop: '8px' }}
            />
          </Col>
        </Row>
      </Card>
    </div>
  );

  const securitySettings = (
    <div>
      <Alert
        message="Security Settings"
        description="Configure security policies and authentication settings for the system."
        type="info"
        showIcon
        style={{ marginBottom: '16px' }}
      />

      <Card title="Authentication & Security">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Text strong>Password Policy</Text>
            <Select
              style={{ width: '100%', marginTop: '8px' }}
              value={settings.passwordPolicy}
              onChange={(value) => handleSettingChange('passwordPolicy', value)}
            >
              <Option value="weak">Weak (6+ characters)</Option>
              <Option value="medium">Medium (8+ characters, mixed case)</Option>
              <Option value="strong">Strong (8+ characters, mixed case, numbers, symbols)</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
              <div>
                <Text strong>Two-Factor Authentication</Text>
                <br />
                <Text type="secondary">Require 2FA for all users</Text>
              </div>
              <Switch
                checked={settings.twoFactorAuth}
                onChange={(checked) => handleSettingChange('twoFactorAuth', checked)}
              />
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );

  const items = [
    {
      key: '1',
      label: 'System Overview',
      children: systemOverview,
      icon: <DatabaseOutlined />
    },
    {
      key: '2',
      label: 'General Settings',
      children: generalSettings,
      icon: <SettingOutlined />
    },
    {
      key: '3',
      label: 'Security',
      children: securitySettings,
      icon: <LockOutlined />
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <SettingOutlined style={{ marginRight: '8px' }} />
          System Settings
        </Title>
        <Text type="secondary">
          Configure system settings, monitor performance, and manage security
        </Text>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <Space>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={saveSettings}
            loading={loading}
          >
            Save Settings
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={resetSettings}
          >
            Reset to Defaults
          </Button>
        </Space>
      </div>

      <Tabs items={items} />
    </div>
  );
};

export default SystemSettingsPage;
