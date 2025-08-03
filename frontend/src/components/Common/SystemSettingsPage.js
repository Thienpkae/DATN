import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Switch,
  Button,
  message,
  Typography,
  Row,
  Col,
  Statistic,
  Alert,
  Divider,
  Select,
  InputNumber,
  Space,
  Progress
} from 'antd';
import {
  SaveOutlined,
  ReloadOutlined,
  DatabaseOutlined,
  SecurityScanOutlined,
  CloudServerOutlined,
  BugOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import apiService from '../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

/**
 * System Settings Page - Configure system-wide settings
 * Available for system administrators
 */
const SystemSettingsPage = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({});
  const [systemHealth, setSystemHealth] = useState({});
  const [form] = Form.useForm();

  useEffect(() => {
    fetchSettings();
    fetchSystemHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSystemSettings();
      const settingsData = response.settings || {};
      setSettings(settingsData);
      form.setFieldsValue(settingsData);
    } catch (error) {
      console.error('Error fetching settings:', error);
      message.error('Failed to fetch system settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const response = await apiService.getSystemHealth();
      setSystemHealth(response.health || {});
    } catch (error) {
      console.error('Error fetching system health:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      await apiService.updateSystemSettings(values);
      setSettings(values);
      message.success('System settings updated successfully');
    } catch (error) {
      console.error('Save settings error:', error);
      message.error('Failed to save system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSettings = () => {
    form.setFieldsValue(settings);
    message.info('Settings reset to last saved values');
  };

  const handleTestConnection = async () => {
    try {
      setLoading(true);
      await apiService.testSystemConnection();
      message.success('System connection test successful');
    } catch (error) {
      console.error('Connection test error:', error);
      message.error('System connection test failed');
    } finally {
      setLoading(false);
    }
  };

  const getHealthStatus = (status) => {
    switch (status) {
      case 'healthy': return { color: 'green', text: 'Healthy' };
      case 'warning': return { color: 'orange', text: 'Warning' };
      case 'error': return { color: 'red', text: 'Error' };
      default: return { color: 'default', text: 'Unknown' };
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Title level={2}>System Settings</Title>
          <Text type="secondary">
            Configure system-wide settings and monitor system health
          </Text>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchSystemHealth}
          >
            Refresh Status
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSaveSettings}
            loading={loading}
          >
            Save Settings
          </Button>
        </Space>
      </div>

      {/* System Health Overview */}
      <Card title="System Health" style={{ marginBottom: '24px' }}>
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="System Status"
                value={getHealthStatus(systemHealth.overall).text}
                valueStyle={{ color: getHealthStatus(systemHealth.overall).color }}
                prefix={<CloudServerOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Database Status"
                value={getHealthStatus(systemHealth.database).text}
                valueStyle={{ color: getHealthStatus(systemHealth.database).color }}
                prefix={<DatabaseOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Security Status"
                value={getHealthStatus(systemHealth.security).text}
                valueStyle={{ color: getHealthStatus(systemHealth.security).color }}
                prefix={<SecurityScanOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Uptime"
                value={systemHealth.uptime || '0 days'}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {systemHealth.issues && systemHealth.issues.length > 0 && (
          <Alert
            message="System Issues Detected"
            description={
              <ul>
                {systemHealth.issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            }
            type="warning"
            showIcon
            style={{ marginTop: '16px' }}
          />
        )}
      </Card>

      {/* System Configuration */}
      <Card title="System Configuration">
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Card title="General Settings" size="small">
                <Form.Item
                  name="systemName"
                  label="System Name"
                  rules={[{ required: true, message: 'Please enter system name' }]}
                >
                  <Input placeholder="Enter system name" />
                </Form.Item>
                
                <Form.Item
                  name="systemDescription"
                  label="System Description"
                >
                  <TextArea rows={3} placeholder="Enter system description" />
                </Form.Item>

                <Form.Item
                  name="maintenanceMode"
                  label="Maintenance Mode"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                </Form.Item>

                <Form.Item
                  name="debugMode"
                  label="Debug Mode"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                </Form.Item>
              </Card>
            </Col>

            <Col span={12}>
              <Card title="Security Settings" size="small">
                <Form.Item
                  name="sessionTimeout"
                  label="Session Timeout (minutes)"
                  rules={[{ required: true, message: 'Please enter session timeout' }]}
                >
                  <InputNumber min={5} max={1440} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                  name="maxLoginAttempts"
                  label="Max Login Attempts"
                  rules={[{ required: true, message: 'Please enter max login attempts' }]}
                >
                  <InputNumber min={1} max={10} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                  name="passwordPolicy"
                  label="Password Policy"
                >
                  <Select placeholder="Select password policy">
                    <Select.Option value="basic">Basic (6+ characters)</Select.Option>
                    <Select.Option value="medium">Medium (8+ chars, mixed case)</Select.Option>
                    <Select.Option value="strong">Strong (12+ chars, symbols)</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="twoFactorAuth"
                  label="Two-Factor Authentication"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="Required" unCheckedChildren="Optional" />
                </Form.Item>
              </Card>
            </Col>
          </Row>

          <Divider />

          <Row gutter={16}>
            <Col span={12}>
              <Card title="Database Settings" size="small">
                <Form.Item
                  name="backupFrequency"
                  label="Backup Frequency"
                >
                  <Select placeholder="Select backup frequency">
                    <Select.Option value="daily">Daily</Select.Option>
                    <Select.Option value="weekly">Weekly</Select.Option>
                    <Select.Option value="monthly">Monthly</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="backupRetention"
                  label="Backup Retention (days)"
                >
                  <InputNumber min={1} max={365} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                  name="autoCleanup"
                  label="Auto Cleanup Old Records"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                </Form.Item>
              </Card>
            </Col>

            <Col span={12}>
              <Card title="Notification Settings" size="small">
                <Form.Item
                  name="emailNotifications"
                  label="Email Notifications"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                </Form.Item>

                <Form.Item
                  name="smsNotifications"
                  label="SMS Notifications"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                </Form.Item>

                <Form.Item
                  name="systemAlerts"
                  label="System Alerts"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                </Form.Item>

                <Form.Item
                  name="alertThreshold"
                  label="Alert Threshold (%)"
                >
                  <InputNumber min={50} max={100} style={{ width: '100%' }} />
                </Form.Item>
              </Card>
            </Col>
          </Row>

          <Divider />

          {/* Performance Monitoring */}
          <Card title="Performance Monitoring" size="small">
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="CPU Usage"
                  value={systemHealth.cpu || 0}
                  suffix="%"
                  prefix={<BugOutlined />}
                />
                <Progress
                  percent={systemHealth.cpu || 0}
                  status={systemHealth.cpu > 80 ? 'exception' : 'active'}
                  size="small"
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Memory Usage"
                  value={systemHealth.memory || 0}
                  suffix="%"
                  prefix={<DatabaseOutlined />}
                />
                <Progress
                  percent={systemHealth.memory || 0}
                  status={systemHealth.memory > 80 ? 'exception' : 'active'}
                  size="small"
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Disk Usage"
                  value={systemHealth.disk || 0}
                  suffix="%"
                  prefix={<CloudServerOutlined />}
                />
                <Progress
                  percent={systemHealth.disk || 0}
                  status={systemHealth.disk > 80 ? 'exception' : 'active'}
                  size="small"
                />
              </Col>
            </Row>
          </Card>

          <Divider />

          {/* Action Buttons */}
          <div style={{ textAlign: 'center' }}>
            <Space size="large">
              <Button
                type="default"
                icon={<ReloadOutlined />}
                onClick={handleResetSettings}
              >
                Reset to Saved
              </Button>
              <Button
                type="default"
                icon={<BugOutlined />}
                onClick={handleTestConnection}
                loading={loading}
              >
                Test Connection
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSaveSettings}
                loading={loading}
                size="large"
              >
                Save All Settings
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default SystemSettingsPage;
