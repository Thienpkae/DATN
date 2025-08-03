import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Table,
  DatePicker,
  Select,
  Space,
  Typography,
  Statistic,
  Tag,

  Input,
  message
} from 'antd';
import {
  FileTextOutlined,
  DownloadOutlined,
  FilterOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  SearchOutlined
} from '@ant-design/icons';
import apiService from '../../services/api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const ReportsPage = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [dateRange, setDateRange] = useState([]);
  const [reportType, setReportType] = useState('all');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchReportData();
  }, [user?.userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchReportData = async () => {
    if (!user?.userId) return;
    
    setLoading(true);
    try {
      // Fetch data for reports
      const [landParcels, certificates, transactions] = await Promise.all([
        apiService.getLandParcelsByOwner(user.userId).catch(() => []),
        apiService.getCertificatesByOwner(user.userId).catch(() => []),
        apiService.getTransactionsByOwner(user.userId).catch(() => [])
      ]);

      // Combine data for reporting
      const combinedData = [
        ...landParcels.map(item => ({ ...item, type: 'Land Parcel', status: 'Active' })),
        ...certificates.map(item => ({ ...item, type: 'Certificate', status: item.status || 'Issued' })),
        ...transactions.map(item => ({ ...item, type: 'Transaction', status: item.status || 'Pending' }))
      ];

      setReportData(combinedData);
    } catch (error) {
      console.error('Fetch report data error:', error);
      message.error('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredData = () => {
    let filtered = reportData;

    if (reportType !== 'all') {
      filtered = filtered.filter(item => item.type.toLowerCase().includes(reportType.toLowerCase()));
    }

    if (searchText) {
      filtered = filtered.filter(item => 
        Object.values(item).some(value => 
          value && value.toString().toLowerCase().includes(searchText.toLowerCase())
        )
      );
    }

    return filtered;
  };

  const exportReport = () => {
    const data = getFilteredData();
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Type,ID,Status,Date\n"
      + data.map(item => `${item.type},${item.id || item.txID || item.certificateID},${item.status},${item.timestamp || item.issueDate || new Date().toISOString()}`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `land_registry_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    message.success('Report exported successfully');
  };

  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const colors = {
          'Land Parcel': 'blue',
          'Certificate': 'green',
          'Transaction': 'orange'
        };
        return <Tag color={colors[type]}>{type}</Tag>;
      }
    },
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      render: (_, record) => record.id || record.txID || record.certificateID || 'N/A'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          'Active': 'green',
          'Issued': 'blue',
          'Pending': 'orange',
          'Completed': 'green',
          'Rejected': 'red'
        };
        return <Tag color={colors[status] || 'default'}>{status}</Tag>;
      }
    },
    {
      title: 'Date',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (_, record) => {
        const date = record.timestamp || record.issueDate || new Date().toISOString();
        return new Date(date).toLocaleDateString();
      }
    }
  ];

  const stats = {
    total: reportData.length,
    landParcels: reportData.filter(item => item.type === 'Land Parcel').length,
    certificates: reportData.filter(item => item.type === 'Certificate').length,
    transactions: reportData.filter(item => item.type === 'Transaction').length
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <FileTextOutlined style={{ marginRight: '8px' }} />
          Reports & Analytics
        </Title>
        <Text type="secondary">
          Generate and export comprehensive reports of your land registry activities
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Records"
              value={stats.total}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Land Parcels"
              value={stats.landParcels}
              prefix={<PieChartOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Certificates"
              value={stats.certificates}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Transactions"
              value={stats.transactions}
              prefix={<LineChartOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Actions */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Search records..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by type"
              value={reportType}
              onChange={setReportType}
            >
              <Option value="all">All Types</Option>
              <Option value="land">Land Parcels</Option>
              <Option value="certificate">Certificates</Option>
              <Option value="transaction">Transactions</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={setDateRange}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={exportReport}
              >
                Export CSV
              </Button>
              <Button
                icon={<FilterOutlined />}
                onClick={fetchReportData}
                loading={loading}
              >
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Data Table */}
      <Card title="Report Data">
        <Table
          columns={columns}
          dataSource={getFilteredData()}
          loading={loading}
          rowKey={(record) => record.id || record.txID || record.certificateID || Math.random()}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
          }}
        />
      </Card>
    </div>
  );
};

export default ReportsPage;
