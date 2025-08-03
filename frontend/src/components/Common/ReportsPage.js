import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  DatePicker,
  Select,
  Form,
  Typography,
  Tag,
  Progress,
  Divider,
  message
} from 'antd';
import {
  BarChartOutlined,
  FileTextOutlined,
  DownloadOutlined,
  CalendarOutlined,
  RiseOutlined,
  PieChartOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import apiService from '../../services/api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

/**
 * Reports Page - Comprehensive reporting for all organizations
 * Shows different reports based on user organization
 */
const ReportsPage = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState({});
  const [dateRange, setDateRange] = useState([]);
  const [reportType, setReportType] = useState('overview');
  const [form] = Form.useForm();

  useEffect(() => {
    fetchReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const params = {
        type: reportType,
        startDate: dateRange[0]?.format('YYYY-MM-DD'),
        endDate: dateRange[1]?.format('YYYY-MM-DD'),
        organization: user.org
      };

      const response = await apiService.getReports(params);
      setReportData(response.data || {});
    } catch (error) {
      console.error('Error fetching report data:', error);
      message.error('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      setLoading(true);
      const params = {
        type: reportType,
        startDate: dateRange[0]?.format('YYYY-MM-DD'),
        endDate: dateRange[1]?.format('YYYY-MM-DD'),
        organization: user.org,
        format: 'pdf'
      };

      const response = await apiService.exportReport(params);
      
      // Create blob and download
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success('Report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  const getReportTypes = () => {
    const baseTypes = [
      { value: 'overview', label: 'Overview Report' },
      { value: 'activity', label: 'Activity Report' }
    ];

    switch (user.org) {
      case 'Org1': // Land Registry Authority
        return [
          ...baseTypes,
          { value: 'land-parcels', label: 'Land Parcels Report' },
          { value: 'transactions', label: 'Transactions Report' },
          { value: 'certificates', label: 'Certificates Report' },
          { value: 'documents', label: 'Documents Report' }
        ];
      case 'Org2': // Government Office
        return [
          ...baseTypes,
          { value: 'verifications', label: 'Verifications Report' },
          { value: 'certificates', label: 'Certificate Status Report' },
          { value: 'compliance', label: 'Compliance Report' }
        ];
      case 'Org3': // Citizens
        return [
          ...baseTypes,
          { value: 'my-assets', label: 'My Assets Report' },
          { value: 'my-transactions', label: 'My Transactions Report' },
          { value: 'my-certificates', label: 'My Certificates Report' }
        ];
      default:
        return baseTypes;
    }
  };

  const renderOverviewStats = () => {
    const stats = reportData.overview || {};
    
    return (
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Records"
              value={stats.totalRecords || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Items"
              value={stats.activeItems || 0}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending Items"
              value={stats.pendingItems || 0}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Completion Rate"
              value={stats.completionRate || 0}
              suffix="%"
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <Progress
              percent={stats.completionRate || 0}
              size="small"
              status="active"
              style={{ marginTop: '8px' }}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  const renderDataTable = () => {
    const tableData = reportData.tableData || [];
    
    // Dynamic columns based on report type
    const getColumns = () => {
      switch (reportType) {
        case 'transactions':
          return [
            { title: 'Transaction ID', dataIndex: 'id', key: 'id' },
            { title: 'Type', dataIndex: 'type', key: 'type' },
            { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => <Tag color="blue">{status}</Tag> },
            { title: 'Date', dataIndex: 'date', key: 'date' },
            { title: 'Amount', dataIndex: 'amount', key: 'amount' }
          ];
        case 'certificates':
          return [
            { title: 'Certificate ID', dataIndex: 'id', key: 'id' },
            { title: 'Owner', dataIndex: 'owner', key: 'owner' },
            { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => <Tag color="green">{status}</Tag> },
            { title: 'Issue Date', dataIndex: 'issueDate', key: 'issueDate' },
            { title: 'Expiry Date', dataIndex: 'expiryDate', key: 'expiryDate' }
          ];
        case 'land-parcels':
          return [
            { title: 'Parcel ID', dataIndex: 'id', key: 'id' },
            { title: 'Location', dataIndex: 'location', key: 'location' },
            { title: 'Area (m²)', dataIndex: 'area', key: 'area' },
            { title: 'Owner', dataIndex: 'owner', key: 'owner' },
            { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => <Tag color="orange">{status}</Tag> }
          ];
        default:
          return [
            { title: 'ID', dataIndex: 'id', key: 'id' },
            { title: 'Description', dataIndex: 'description', key: 'description' },
            { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => <Tag>{status}</Tag> },
            { title: 'Date', dataIndex: 'date', key: 'date' }
          ];
      }
    };

    return (
      <Card title="Detailed Data" style={{ marginTop: '24px' }}>
        <Table
          columns={getColumns()}
          dataSource={tableData}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
          }}
        />
      </Card>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Title level={2}>Reports & Analytics</Title>
          <Text type="secondary">
            Generate comprehensive reports and analytics for your organization
          </Text>
        </div>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleExportReport}
          loading={loading}
        >
          Export Report
        </Button>
      </div>

      {/* Report Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Form form={form} layout="inline">
          <Form.Item label="Report Type">
            <Select
              value={reportType}
              onChange={setReportType}
              style={{ width: 200 }}
            >
              {getReportTypes().map(type => (
                <Select.Option key={type.value} value={type.value}>
                  {type.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Date Range">
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              style={{ width: 300 }}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={fetchReportData} loading={loading}>
              Generate Report
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Overview Statistics */}
      {renderOverviewStats()}

      <Divider />

      {/* Charts Section */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={12}>
          <Card title="Trend Analysis" extra={<LineChartOutlined />}>
            <div style={{ 
              height: '200px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: '#fafafa',
              border: '1px dashed #d9d9d9',
              borderRadius: '6px'
            }}>
              <Text type="secondary">Trend chart will be displayed here</Text>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Distribution Analysis" extra={<PieChartOutlined />}>
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

      {/* Data Table */}
      {renderDataTable()}

      {/* Summary Section */}
      <Card title="Report Summary" style={{ marginTop: '24px' }}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="Report Generated"
              value={new Date().toLocaleString('vi-VN')}
              prefix={<CalendarOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Data Points"
              value={reportData.tableData?.length || 0}
              prefix={<BarChartOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Report Type"
              value={getReportTypes().find(t => t.value === reportType)?.label || 'Overview'}
              prefix={<FileTextOutlined />}
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default ReportsPage;
