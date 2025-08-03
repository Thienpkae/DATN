import { useState } from 'react';
import {
  Card,
  Form,
  Select,
  DatePicker,
  Button,
  Typography,
  Row,
  Col,
  Alert,
  Progress,
  Table,
  Tag,
  message,
  Space
} from 'antd';
import {
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  CloudDownloadOutlined
} from '@ant-design/icons';
import apiService from '../../services/api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

/**
 * Data Export Page - Export system data matching backend /export endpoints
 */
const DataExportPage = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportHistory, setExportHistory] = useState([]);
  const [form] = Form.useForm();

  const dataTypes = [
    { value: 'land-parcels', label: 'Land Parcels', icon: <FileTextOutlined /> },
    { value: 'certificates', label: 'Certificates', icon: <FilePdfOutlined /> },
    { value: 'transactions', label: 'Transactions', icon: <FileExcelOutlined /> },
    { value: 'documents', label: 'Documents', icon: <FileTextOutlined /> },
    { value: 'users', label: 'Users', icon: <FileTextOutlined /> },
    { value: 'system-logs', label: 'System Logs', icon: <FileTextOutlined /> }
  ];

  const formats = [
    { value: 'json', label: 'JSON', extension: '.json' },
    { value: 'csv', label: 'CSV', extension: '.csv' },
    { value: 'excel', label: 'Excel', extension: '.xlsx' },
    { value: 'pdf', label: 'PDF', extension: '.pdf' }
  ];

  const handleExport = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      setExportProgress(0);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const exportParams = {
        dataType: values.dataType,
        format: values.format,
        startDate: values.dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: values.dateRange?.[1]?.format('YYYY-MM-DD')
      };

      const response = await apiService.exportData(
        values.dataType,
        values.format,
        exportParams.startDate,
        exportParams.endDate
      );

      clearInterval(progressInterval);
      setExportProgress(100);

      // Create download
      const formatInfo = formats.find(f => f.value === values.format);
      const blob = new Blob([response], { 
        type: values.format === 'csv' ? 'text/csv' : 
              values.format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
              values.format === 'pdf' ? 'application/pdf' : 'application/json'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${values.dataType}_export_${new Date().toISOString().split('T')[0]}${formatInfo.extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Add to export history
      const newExport = {
        id: Date.now(),
        dataType: values.dataType,
        format: values.format,
        dateRange: values.dateRange ? 
          `${values.dateRange[0].format('DD/MM/YYYY')} - ${values.dateRange[1].format('DD/MM/YYYY')}` : 
          'All time',
        exportDate: new Date().toLocaleString('vi-VN'),
        status: 'completed',
        fileSize: `${(blob.size / 1024).toFixed(2)} KB`
      };
      
      setExportHistory(prev => [newExport, ...prev.slice(0, 9)]);
      message.success('Data exported successfully');
      
      setTimeout(() => setExportProgress(0), 2000);
    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to export data');
      setExportProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const getDataTypeIcon = (dataType) => {
    const type = dataTypes.find(t => t.value === dataType);
    return type ? type.icon : <FileTextOutlined />;
  };

  const getFormatColor = (format) => {
    switch (format) {
      case 'json': return 'blue';
      case 'csv': return 'green';
      case 'excel': return 'orange';
      case 'pdf': return 'red';
      default: return 'default';
    }
  };

  const exportHistoryColumns = [
    {
      title: 'Data Type',
      dataIndex: 'dataType',
      key: 'dataType',
      render: (dataType) => (
        <Space>
          {getDataTypeIcon(dataType)}
          <Text>{dataTypes.find(t => t.value === dataType)?.label || dataType}</Text>
        </Space>
      )
    },
    {
      title: 'Format',
      dataIndex: 'format',
      key: 'format',
      render: (format) => (
        <Tag color={getFormatColor(format)}>
          {format.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Date Range',
      dataIndex: 'dateRange',
      key: 'dateRange'
    },
    {
      title: 'Export Date',
      dataIndex: 'exportDate',
      key: 'exportDate'
    },
    {
      title: 'File Size',
      dataIndex: 'fileSize',
      key: 'fileSize'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'completed' ? 'green' : 'orange'}>
          {status}
        </Tag>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Data Export</Title>
      <Text type="secondary">
        Export system data in various formats for analysis and backup
      </Text>

      <Row gutter={24} style={{ marginTop: '24px' }}>
        {/* Export Configuration */}
        <Col span={12}>
          <Card title="Export Configuration">
            <Form form={form} layout="vertical">
              <Form.Item
                name="dataType"
                label="Data Type"
                rules={[{ required: true, message: 'Please select data type' }]}
              >
                <Select placeholder="Select data type to export">
                  {dataTypes.map(type => (
                    <Select.Option key={type.value} value={type.value}>
                      <Space>
                        {type.icon}
                        {type.label}
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="format"
                label="Export Format"
                rules={[{ required: true, message: 'Please select export format' }]}
              >
                <Select placeholder="Select export format">
                  {formats.map(format => (
                    <Select.Option key={format.value} value={format.value}>
                      <Space>
                        <Tag color={getFormatColor(format.value)}>
                          {format.label}
                        </Tag>
                        <Text type="secondary">{format.extension}</Text>
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="dateRange"
                label="Date Range (Optional)"
              >
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={handleExport}
                  loading={loading}
                  size="large"
                  block
                >
                  Export Data
                </Button>
              </Form.Item>
            </Form>

            {/* Export Progress */}
            {exportProgress > 0 && (
              <div style={{ marginTop: '16px' }}>
                <Text strong>Export Progress:</Text>
                <Progress
                  percent={exportProgress}
                  status={exportProgress === 100 ? 'success' : 'active'}
                  strokeColor="#52c41a"
                />
              </div>
            )}
          </Card>
        </Col>

        {/* Export Guidelines */}
        <Col span={12}>
          <Card title="Export Guidelines">
            <Alert
              message="Data Export Information"
              description={
                <div>
                  <p><strong>Available Formats:</strong></p>
                  <ul>
                    <li><strong>JSON:</strong> Structured data format, ideal for API integration</li>
                    <li><strong>CSV:</strong> Comma-separated values, compatible with Excel</li>
                    <li><strong>Excel:</strong> Microsoft Excel format with formatting</li>
                    <li><strong>PDF:</strong> Formatted report for printing and sharing</li>
                  </ul>
                  <p><strong>Data Types:</strong></p>
                  <ul>
                    <li><strong>Land Parcels:</strong> All land parcel information</li>
                    <li><strong>Certificates:</strong> Certificate data and status</li>
                    <li><strong>Transactions:</strong> Transaction history and details</li>
                    <li><strong>Documents:</strong> Document metadata and links</li>
                    <li><strong>Users:</strong> User information (admin only)</li>
                    <li><strong>System Logs:</strong> System activity logs (admin only)</li>
                  </ul>
                </div>
              }
              type="info"
              showIcon
            />

            <div style={{ marginTop: '16px' }}>
              <Title level={4}>Quick Export</Title>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  icon={<CloudDownloadOutlined />}
                  onClick={() => {
                    form.setFieldsValue({ dataType: 'land-parcels', format: 'csv' });
                    handleExport();
                  }}
                  block
                >
                  Export All Land Parcels (CSV)
                </Button>
                <Button
                  icon={<CloudDownloadOutlined />}
                  onClick={() => {
                    form.setFieldsValue({ dataType: 'certificates', format: 'pdf' });
                    handleExport();
                  }}
                  block
                >
                  Export Certificates Report (PDF)
                </Button>
                <Button
                  icon={<CloudDownloadOutlined />}
                  onClick={() => {
                    form.setFieldsValue({ dataType: 'transactions', format: 'excel' });
                    handleExport();
                  }}
                  block
                >
                  Export Transactions (Excel)
                </Button>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Export History */}
      {exportHistory.length > 0 && (
        <Card title="Export History" style={{ marginTop: '24px' }}>
          <Table
            columns={exportHistoryColumns}
            dataSource={exportHistory}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            size="small"
          />
        </Card>
      )}
    </div>
  );
};

export default DataExportPage;
