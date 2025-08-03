import { useState } from 'react';
import {
  Card,
  Form,
  DatePicker,
  Select,
  Button,
  Typography,
  Row,
  Col,
  Table,
  Statistic,
  Tag,
  Progress,
  Spin,
  message,
  Space
} from 'antd';
import {
  FileTextOutlined,
  BarChartOutlined,
  PieChartOutlined,
  DownloadOutlined,
  PrinterOutlined
} from '@ant-design/icons';
import apiService from '../../services/api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

/**
 * System Reports Page - Generate comprehensive system reports matching backend /reports/system
 */
const SystemReportsPage = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState({});
  const [form] = Form.useForm();

  const reportTypes = [
    { value: 'all', label: 'Complete System Report' },
    { value: 'transactions', label: 'Transaction Report' },
    { value: 'certificates', label: 'Certificate Report' },
    { value: 'documents', label: 'Document Report' },
    { value: 'users', label: 'User Activity Report' },
    { value: 'performance', label: 'Performance Report' }
  ];

  const generateReport = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const params = {
        startDate: values.dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: values.dateRange?.[1]?.format('YYYY-MM-DD'),
        type: values.reportType
      };

      const response = await apiService.getSystemReports(
        params.startDate,
        params.endDate,
        params.type
      );

      setReportData(response.report || {});
      message.success('Report generated successfully');
    } catch (error) {
      console.error('Generate report error:', error);
      message.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const renderSummaryStats = () => {
    const summary = reportData.summary || {};
    
    return (
      <Card title="Report Summary" style={{ marginBottom: '24px' }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="Total Transactions"
              value={summary.totalTransactions || 0}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Total Certificates"
              value={summary.totalCertificates || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Total Documents"
              value={summary.totalDocuments || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Active Users"
              value={summary.activeUsers || 0}
              prefix={<PieChartOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
        </Row>
      </Card>
    );
  };

  const renderTransactionAnalysis = () => {
    const summary = reportData.summary || {};
    const total = summary.totalTransactions || 1;
    
    return (
      <Card title="Transaction Analysis" style={{ marginBottom: '24px' }}>
        <Row gutter={16}>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <Text strong>Pending Transactions</Text>
              <div style={{ margin: '16px 0' }}>
                <Progress
                  type="circle"
                  percent={Math.round((summary.pendingTransactions / total) * 100)}
                  format={() => summary.pendingTransactions || 0}
                  strokeColor="#faad14"
                />
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <Text strong>Approved Transactions</Text>
              <div style={{ margin: '16px 0' }}>
                <Progress
                  type="circle"
                  percent={Math.round((summary.approvedTransactions / total) * 100)}
                  format={() => summary.approvedTransactions || 0}
                  strokeColor="#52c41a"
                />
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <Text strong>Rejected Transactions</Text>
              <div style={{ margin: '16px 0' }}>
                <Progress
                  type="circle"
                  percent={Math.round((summary.rejectedTransactions / total) * 100)}
                  format={() => summary.rejectedTransactions || 0}
                  strokeColor="#ff4d4f"
                />
              </div>
            </div>
          </Col>
        </Row>
      </Card>
    );
  };

  const renderTransactionTable = () => {
    const transactions = reportData.transactions || [];
    
    const columns = [
      {
        title: 'Transaction ID',
        dataIndex: 'txID',
        key: 'txID',
        width: 150,
        render: (id) => <Text strong>{id}</Text>
      },
      {
        title: 'Type',
        dataIndex: 'type',
        key: 'type',
        width: 120,
        render: (type) => {
          const colors = {
            'transfer': 'blue',
            'split': 'green',
            'merge': 'orange',
            'change_purpose': 'purple',
            'reissue': 'cyan'
          };
          return <Tag color={colors[type] || 'default'}>{type}</Tag>;
        }
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (status) => {
          const colors = {
            'pending': 'orange',
            'approved': 'green',
            'rejected': 'red',
            'completed': 'blue'
          };
          return <Tag color={colors[status] || 'default'}>{status}</Tag>;
        }
      },
      {
        title: 'Land Parcel ID',
        dataIndex: 'landParcelID',
        key: 'landParcelID',
        width: 150
      },
      {
        title: 'Owner',
        dataIndex: 'ownerID',
        key: 'ownerID',
        width: 150
      },
      {
        title: 'Created Date',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 150,
        render: (date) => date ? new Date(date).toLocaleDateString('vi-VN') : 'N/A'
      }
    ];

    return (
      <Card title="Transaction Details" style={{ marginBottom: '24px' }}>
        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="txID"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
          size="small"
        />
      </Card>
    );
  };

  const renderCertificateTable = () => {
    const certificates = reportData.certificates || [];
    
    const columns = [
      {
        title: 'Certificate ID',
        dataIndex: 'certificateID',
        key: 'certificateID',
        width: 150,
        render: (id) => <Text strong>{id}</Text>
      },
      {
        title: 'Land Parcel ID',
        dataIndex: 'landParcelID',
        key: 'landParcelID',
        width: 150
      },
      {
        title: 'Owner',
        dataIndex: 'ownerID',
        key: 'ownerID',
        width: 150
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (status) => {
          const colors = {
            'active': 'green',
            'revoked': 'red',
            'expired': 'orange'
          };
          return <Tag color={colors[status] || 'default'}>{status}</Tag>;
        }
      },
      {
        title: 'Issue Date',
        dataIndex: 'issuedDate',
        key: 'issuedDate',
        width: 150,
        render: (date) => date ? new Date(date).toLocaleDateString('vi-VN') : 'N/A'
      }
    ];

    return (
      <Card title="Certificate Details" style={{ marginBottom: '24px' }}>
        <Table
          columns={columns}
          dataSource={certificates}
          rowKey="certificateID"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
          size="small"
        />
      </Card>
    );
  };

  const renderDocumentTable = () => {
    const documents = reportData.documents || [];
    
    const columns = [
      {
        title: 'Document ID',
        dataIndex: 'docID',
        key: 'docID',
        width: 150,
        render: (id) => <Text strong>{id}</Text>
      },
      {
        title: 'Land Parcel ID',
        dataIndex: 'landParcelID',
        key: 'landParcelID',
        width: 150
      },
      {
        title: 'Type',
        dataIndex: 'type',
        key: 'type',
        width: 120
      },
      {
        title: 'Status',
        dataIndex: 'verified',
        key: 'verified',
        width: 100,
        render: (verified) => (
          <Tag color={verified ? 'green' : 'orange'}>
            {verified ? 'Verified' : 'Pending'}
          </Tag>
        )
      },
      {
        title: 'Upload Date',
        dataIndex: 'uploadedAt',
        key: 'uploadedAt',
        width: 150,
        render: (date) => date ? new Date(date).toLocaleDateString('vi-VN') : 'N/A'
      }
    ];

    return (
      <Card title="Document Details" style={{ marginBottom: '24px' }}>
        <Table
          columns={columns}
          dataSource={documents}
          rowKey="docID"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
          size="small"
        />
      </Card>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>System Reports</Title>
      <Text type="secondary">
        Generate comprehensive system reports for analysis and compliance
      </Text>

      {/* Report Configuration */}
      <Card title="Report Configuration" style={{ marginTop: '24px', marginBottom: '24px' }}>
        <Form form={form} layout="inline">
          <Form.Item
            name="reportType"
            label="Report Type"
            rules={[{ required: true, message: 'Please select report type' }]}
          >
            <Select placeholder="Select report type" style={{ width: 200 }}>
              {reportTypes.map(type => (
                <Select.Option key={type.value} value={type.value}>
                  {type.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="Date Range"
            rules={[{ required: true, message: 'Please select date range' }]}
          >
            <RangePicker style={{ width: 300 }} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                icon={<BarChartOutlined />}
                onClick={generateReport}
                loading={loading}
              >
                Generate Report
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => message.info('Export functionality')}
                disabled={!reportData.summary}
              >
                Export
              </Button>
              <Button
                icon={<PrinterOutlined />}
                onClick={() => window.print()}
                disabled={!reportData.summary}
              >
                Print
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* Report Content */}
      <Spin spinning={loading}>
        {reportData.summary && (
          <>
            {renderSummaryStats()}
            {renderTransactionAnalysis()}
            {reportData.transactions && renderTransactionTable()}
            {reportData.certificates && renderCertificateTable()}
            {reportData.documents && renderDocumentTable()}
          </>
        )}
      </Spin>
    </div>
  );
};

export default SystemReportsPage;
