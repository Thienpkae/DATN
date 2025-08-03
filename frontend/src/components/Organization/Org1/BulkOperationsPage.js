import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Form,
  Input,
  Select,
  Upload,
  message,
  Typography,
  Row,
  Col,
  Statistic,
  Progress,
  Alert,
  Checkbox
} from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import apiService from '../../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

/**
 * Bulk Operations Page for Org1
 * Handle bulk operations on land parcels
 */
const BulkOperationsPage = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [operationType, setOperationType] = useState('');
  const [selectedParcels] = useState([]);
  const [bulkData, setBulkData] = useState([]);
  const [operationProgress, setOperationProgress] = useState(0);
  const [operationStatus, setOperationStatus] = useState('idle'); // idle, running, completed, error
  const [operationResults, setOperationResults] = useState([]);
  const [form] = Form.useForm();

  const operationTypes = [
    { value: 'update', label: 'Bulk Update', description: 'Update multiple land parcels' },
    { value: 'transfer', label: 'Bulk Transfer', description: 'Transfer multiple parcels to new owners' },
    { value: 'status_change', label: 'Status Change', description: 'Change status of multiple parcels' },
    { value: 'certificate_issue', label: 'Certificate Issuance', description: 'Issue certificates for multiple parcels' },
    { value: 'export', label: 'Data Export', description: 'Export land parcel data' },
    { value: 'import', label: 'Data Import', description: 'Import land parcel data from file' }
  ];

  const handleFileUpload = async (file) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiService.uploadBulkFile(formData);
      setBulkData(response.data || []);
      message.success(`File uploaded successfully. ${response.data?.length || 0} records found.`);
    } catch (error) {
      console.error('File upload error:', error);
      message.error('Failed to upload file');
    } finally {
      setLoading(false);
    }
    return false; // Prevent auto upload
  };

  const handleBulkOperation = async () => {
    try {
      setLoading(true);
      setOperationStatus('running');
      setOperationProgress(0);

      const operationData = {
        type: operationType,
        data: bulkData,
        selectedParcels,
        ...form.getFieldsValue()
      };

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setOperationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      const response = await apiService.performBulkOperation(operationData);
      
      clearInterval(progressInterval);
      setOperationProgress(100);
      setOperationStatus('completed');
      setOperationResults(response.results || []);
      
      message.success(`Bulk operation completed successfully. ${response.successCount || 0} records processed.`);
    } catch (error) {
      console.error('Bulk operation error:', error);
      setOperationStatus('error');
      message.error('Bulk operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      setLoading(true);
      const exportParams = {
        type: 'land_parcels',
        format: 'excel',
        filters: form.getFieldsValue()
      };

      const response = await apiService.exportData(exportParams);
      
      // Create blob and download
      const blob = new Blob([response], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `land_parcels_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success('Data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const renderOperationForm = () => {
    switch (operationType) {
      case 'update':
        return (
          <>
            <Form.Item name="updateFields" label="Fields to Update">
              <Checkbox.Group>
                <Checkbox value="area">Area</Checkbox>
                <Checkbox value="purpose">Purpose</Checkbox>
                <Checkbox value="status">Status</Checkbox>
                <Checkbox value="location">Location</Checkbox>
              </Checkbox.Group>
            </Form.Item>
            <Form.Item name="newValues" label="New Values">
              <TextArea rows={4} placeholder="Enter new values in JSON format" />
            </Form.Item>
          </>
        );
      case 'transfer':
        return (
          <>
            <Form.Item name="newOwner" label="New Owner CCCD" rules={[{ required: true }]}>
              <Input placeholder="Enter new owner CCCD" />
            </Form.Item>
            <Form.Item name="transferReason" label="Transfer Reason">
              <TextArea rows={3} placeholder="Enter transfer reason" />
            </Form.Item>
          </>
        );
      case 'status_change':
        return (
          <Form.Item name="newStatus" label="New Status" rules={[{ required: true }]}>
            <Select placeholder="Select new status">
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="inactive">Inactive</Select.Option>
              <Select.Option value="pending">Pending</Select.Option>
              <Select.Option value="disputed">Disputed</Select.Option>
            </Select>
          </Form.Item>
        );
      case 'import':
        return (
          <Form.Item name="file" label="Upload File" rules={[{ required: true }]}>
            <Upload
              beforeUpload={handleFileUpload}
              accept=".xlsx,.xls,.csv"
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Select File</Button>
            </Upload>
          </Form.Item>
        );
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'green';
      case 'running': return 'blue';
      case 'error': return 'red';
      default: return 'default';
    }
  };

  const resultColumns = [
    {
      title: 'Land Parcel ID',
      dataIndex: 'landParcelId',
      key: 'landParcelId',
      render: (text) => <Text code>{text}</Text>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'success' ? 'green' : 'red'}>
          {status}
        </Tag>
      )
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message'
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Bulk Operations</Title>
      <Text type="secondary">
        Perform bulk operations on multiple land parcels
      </Text>

      {/* Operation Selection */}
      <Card title="Select Operation" style={{ marginTop: '24px', marginBottom: '24px' }}>
        <Row gutter={16}>
          {operationTypes.map(op => (
            <Col span={8} key={op.value} style={{ marginBottom: '16px' }}>
              <Card
                size="small"
                hoverable
                onClick={() => setOperationType(op.value)}
                style={{
                  border: operationType === op.value ? '2px solid #1890ff' : '1px solid #d9d9d9',
                  cursor: 'pointer'
                }}
              >
                <Card.Meta
                  title={op.label}
                  description={op.description}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Operation Configuration */}
      {operationType && (
        <Card title="Operation Configuration" style={{ marginBottom: '24px' }}>
          <Form form={form} layout="vertical">
            {renderOperationForm()}
            
            <Row gutter={16} style={{ marginTop: '24px' }}>
              <Col span={12}>
                <Button
                  type="primary"
                  onClick={operationType === 'export' ? handleExportData : handleBulkOperation}
                  loading={loading}
                  disabled={operationType === 'import' && bulkData.length === 0}
                  icon={operationType === 'export' ? <DownloadOutlined /> : <PlayCircleOutlined />}
                  size="large"
                >
                  {operationType === 'export' ? 'Export Data' : 'Start Operation'}
                </Button>
              </Col>
              <Col span={12}>
                <Button
                  onClick={() => {
                    setOperationType('');
                    form.resetFields();
                    setBulkData([]);
                    setOperationResults([]);
                    setOperationProgress(0);
                    setOperationStatus('idle');
                  }}
                >
                  Reset
                </Button>
              </Col>
            </Row>
          </Form>
        </Card>
      )}

      {/* Progress Tracking */}
      {operationStatus !== 'idle' && (
        <Card title="Operation Progress" style={{ marginBottom: '24px' }}>
          <Row gutter={16}>
            <Col span={16}>
              <Progress
                percent={operationProgress}
                status={operationStatus === 'error' ? 'exception' : 'active'}
                strokeColor={operationStatus === 'completed' ? '#52c41a' : '#1890ff'}
              />
            </Col>
            <Col span={8}>
              <Tag color={getStatusColor(operationStatus)} icon={
                operationStatus === 'completed' ? <CheckCircleOutlined /> :
                operationStatus === 'error' ? <ExclamationCircleOutlined /> :
                <PlayCircleOutlined />
              }>
                {operationStatus.toUpperCase()}
              </Tag>
            </Col>
          </Row>
        </Card>
      )}

      {/* Data Preview */}
      {bulkData.length > 0 && (
        <Card title="Data Preview" style={{ marginBottom: '24px' }}>
          <Alert
            message={`${bulkData.length} records loaded`}
            type="info"
            style={{ marginBottom: '16px' }}
          />
          <Table
            dataSource={bulkData.slice(0, 10)}
            columns={Object.keys(bulkData[0] || {}).map(key => ({
              title: key,
              dataIndex: key,
              key: key
            }))}
            pagination={false}
            size="small"
          />
          {bulkData.length > 10 && (
            <Text type="secondary">Showing first 10 records of {bulkData.length} total</Text>
          )}
        </Card>
      )}

      {/* Operation Results */}
      {operationResults.length > 0 && (
        <Card title="Operation Results">
          <Row gutter={16} style={{ marginBottom: '16px' }}>
            <Col span={8}>
              <Statistic
                title="Total Processed"
                value={operationResults.length}
                prefix={<DatabaseOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Successful"
                value={operationResults.filter(r => r.status === 'success').length}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Failed"
                value={operationResults.filter(r => r.status === 'error').length}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<ExclamationCircleOutlined />}
              />
            </Col>
          </Row>
          
          <Table
            columns={resultColumns}
            dataSource={operationResults}
            rowKey="landParcelId"
            pagination={{
              pageSize: 10,
              showSizeChanger: true
            }}
          />
        </Card>
      )}
    </div>
  );
};

export default BulkOperationsPage;
