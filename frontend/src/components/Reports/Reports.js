import React, { useState } from 'react';
import { 
  Card, 
  Typography, 
  Row, 
  Col, 
  Statistic, 
  Table,
  DatePicker,
  Button,
  Space
} from 'antd';
import { 
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined
} from '@ant-design/icons';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const Reports = ({ user }) => {
  const [dateRange, setDateRange] = useState([]);
  const [loading] = useState(false);

  const summaryData = [
    {
      title: 'Total Land Parcels',
      value: 156,
      color: '#1890ff'
    },
    {
      title: 'Certificates Issued',
      value: 142,
      color: '#52c41a'
    },
    {
      title: 'Transactions Processed',
      value: 89,
      color: '#fa8c16'
    },
    {
      title: 'Documents Verified',
      value: 234,
      color: '#722ed1'
    }
  ];

  const recentTransactions = [
    {
      key: '1',
      txId: 'TX001',
      type: 'Transfer',
      date: '2024-01-15',
      status: 'Completed'
    },
    {
      key: '2',
      txId: 'TX002',
      type: 'Split',
      date: '2024-01-14',
      status: 'Pending'
    }
  ];

  const transactionColumns = [
    {
      title: 'Transaction ID',
      dataIndex: 'txId',
      key: 'txId',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span className={`transaction-status status-${status.toLowerCase()}`}>
          {status}
        </span>
      ),
    },
  ];

  const handleExportReport = (format) => {
    // Implementation for exporting reports
    console.log(`Exporting ${format} report`);
  };

  return (
    <div>
      <Title level={2}>Reports & Analytics</Title>
      
      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {summaryData.map((item, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card>
              <Statistic
                title={item.title}
                value={item.value}
                valueStyle={{ color: item.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Export Controls */}
      <Card title="Generate Reports" style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Row gutter={16} align="middle">
            <Col span={8}>
              <RangePicker 
                value={dateRange}
                onChange={setDateRange}
                style={{ width: '100%' }}
              />
            </Col>
            <Col span={16}>
              <Space>
                <Button 
                  type="primary"
                  icon={<FileExcelOutlined />}
                  onClick={() => handleExportReport('excel')}
                >
                  Export Excel
                </Button>
                <Button 
                  icon={<FilePdfOutlined />}
                  onClick={() => handleExportReport('pdf')}
                >
                  Export PDF
                </Button>
                <Button 
                  icon={<DownloadOutlined />}
                  onClick={() => handleExportReport('csv')}
                >
                  Export CSV
                </Button>
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      {/* Recent Transactions */}
      <Card title="Recent Transactions">
        <Table
          columns={transactionColumns}
          dataSource={recentTransactions}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default Reports;
