import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Progress,
  Typography,
  Space,
  Tooltip,
  Button,
  Select,
  DatePicker,
  Spin,
  Empty
} from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  DownloadOutlined,
  LineChartOutlined,
  MinusOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const StatsDashboard = ({
  title = 'Statistics Dashboard',
  subtitle,
  stats = [],
  loading = false,
  onRefresh,
  onExport,
  onDateRangeChange,
  onPeriodChange,
  showControls = true,
  showTrends = true,
  showProgress = true,
  className = '',
  style = {}
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [dateRange, setDateRange] = useState([
    moment().subtract(7, 'days'),
    moment()
  ]);

  // Handle period change
  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    
    let startDate, endDate;
    switch (period) {
      case '1d':
        startDate = moment().subtract(1, 'day');
        endDate = moment();
        break;
      case '7d':
        startDate = moment().subtract(7, 'days');
        endDate = moment();
        break;
      case '30d':
        startDate = moment().subtract(30, 'days');
        endDate = moment();
        break;
      case '90d':
        startDate = moment().subtract(90, 'days');
        endDate = moment();
        break;
      case '1y':
        startDate = moment().subtract(1, 'year');
        endDate = moment();
        break;
      default:
        return;
    }
    
    setDateRange([startDate, endDate]);
    
    if (onPeriodChange) {
      onPeriodChange(period, [startDate, endDate]);
    }
  };

  // Handle custom date range change
  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
    setSelectedPeriod('custom');
    
    if (onDateRangeChange) {
      onDateRangeChange(dates);
    }
  };

  // Get trend icon and color
  const getTrendIndicator = (trend) => {
    if (!trend || trend === 0) {
      return {
        icon: <MinusOutlined />,
        color: '#8c8c8c',
        text: 'No change'
      };
    }
    
    if (trend > 0) {
      return {
        icon: <ArrowUpOutlined />,
        color: '#52c41a',
        text: `+${trend}%`
      };
    }
    
    return {
      icon: <ArrowDownOutlined />,
      color: '#ff4d4f',
      text: `${trend}%`
    };
  };

  // Render individual stat card
  const renderStatCard = (stat, index) => {
    const {
      title,
      value,
      prefix,
      suffix,
      trend,
      target,
      description,
      icon,
      color = '#1890ff',
      loading: statLoading = false,
      formatter,
      precision = 0,
      ...cardProps
    } = stat;

    const trendIndicator = getTrendIndicator(trend);
    const progressPercent = target ? (value / target) * 100 : null;

    return (
      <Col xs={24} sm={12} lg={6} key={index}>
        <Card 
          className="stats-card professional-card slide-in-left"
          style={{ 
            animationDelay: `${index * 0.1}s`,
            height: '100%'
          }}
          bodyStyle={{ padding: '1.5rem' }}
          {...cardProps}
        >
          <Spin spinning={statLoading}>
            <div style={{ position: 'relative' }}>
              {/* Icon */}
              {icon && (
                <div 
                  className="stats-card-icon"
                  style={{ 
                    background: `linear-gradient(135deg, ${color}, ${color}dd)`,
                    marginBottom: '1rem'
                  }}
                >
                  {icon}
                </div>
              )}

              {/* Main Statistic */}
              <Statistic
                title={
                  <Space>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>{title}</span>
                    {description && (
                      <Tooltip title={description}>
                        <InfoCircleOutlined style={{ color: '#8c8c8c', fontSize: '12px' }} />
                      </Tooltip>
                    )}
                  </Space>
                }
                value={value}
                prefix={prefix}
                suffix={suffix}
                formatter={formatter}
                precision={precision}
                valueStyle={{ 
                  color: color,
                  fontSize: '2rem',
                  fontWeight: 700,
                  lineHeight: 1.2
                }}
              />

              {/* Trend Indicator */}
              {showTrends && trend !== undefined && (
                <div style={{ marginTop: '0.5rem' }}>
                  <Space size={4}>
                    <span style={{ color: trendIndicator.color }}>
                      {trendIndicator.icon}
                    </span>
                    <Text 
                      style={{ 
                        color: trendIndicator.color,
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    >
                      {trendIndicator.text}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      vs last period
                    </Text>
                  </Space>
                </div>
              )}

              {/* Progress Bar */}
              {showProgress && target && (
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginBottom: '4px' 
                  }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Progress
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {value} / {target}
                    </Text>
                  </div>
                  <Progress
                    percent={Math.min(progressPercent, 100)}
                    size="small"
                    strokeColor={color}
                    showInfo={false}
                    status={progressPercent >= 100 ? 'success' : 'active'}
                  />
                </div>
              )}
            </div>
          </Spin>
        </Card>
      </Col>
    );
  };

  return (
    <div className={`stats-dashboard ${className}`} style={style}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <div>
              <Title level={3} style={{ marginBottom: '0.5rem' }}>
                {title}
              </Title>
              {subtitle && (
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  {subtitle}
                </Text>
              )}
            </div>
          </Col>

          {/* Controls */}
          {showControls && (
            <Col>
              <Space wrap>
                {/* Period Selector */}
                <Select
                  value={selectedPeriod}
                  onChange={handlePeriodChange}
                  style={{ width: 120 }}
                >
                  <Option value="1d">Last 24h</Option>
                  <Option value="7d">Last 7 days</Option>
                  <Option value="30d">Last 30 days</Option>
                  <Option value="90d">Last 90 days</Option>
                  <Option value="1y">Last year</Option>
                  <Option value="custom">Custom</Option>
                </Select>

                {/* Date Range Picker */}
                {selectedPeriod === 'custom' && (
                  <RangePicker
                    value={dateRange}
                    onChange={handleDateRangeChange}
                    style={{ width: 240 }}
                  />
                )}

                {/* Action Buttons */}
                {onRefresh && (
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={onRefresh}
                    loading={loading}
                    tooltip="Refresh Data"
                  >
                    Refresh
                  </Button>
                )}

                {onExport && (
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={onExport}
                    tooltip="Export Data"
                  >
                    Export
                  </Button>
                )}
              </Space>
            </Col>
          )}
        </Row>
      </div>

      {/* Statistics Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <Spin size="large" />
          <div style={{ marginTop: '1rem' }}>
            <Text type="secondary">Loading statistics...</Text>
          </div>
        </div>
      ) : stats.length === 0 ? (
        <Empty
          description="No statistics available"
          style={{ padding: '3rem' }}
        />
      ) : (
        <Row gutter={[24, 24]}>
          {stats.map(renderStatCard)}
        </Row>
      )}

      {/* Summary Section */}
      {stats.length > 0 && !loading && (
        <Card 
          className="professional-card"
          style={{ marginTop: '2rem' }}
          title={
            <Space>
              <LineChartOutlined />
              <span>Summary</span>
            </Space>
          }
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Statistic
                title="Total Items"
                value={stats.reduce((sum, stat) => sum + (stat.value || 0), 0)}
                formatter={(value) => value.toLocaleString()}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="Average Growth"
                value={stats.reduce((sum, stat) => sum + (stat.trend || 0), 0) / stats.length}
                suffix="%"
                precision={1}
                valueStyle={{ 
                  color: stats.reduce((sum, stat) => sum + (stat.trend || 0), 0) >= 0 ? '#52c41a' : '#ff4d4f' 
                }}
                prefix={
                  stats.reduce((sum, stat) => sum + (stat.trend || 0), 0) >= 0 
                    ? <ArrowUpOutlined /> 
                    : <ArrowDownOutlined />
                }
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="Completion Rate"
                value={
                  stats.filter(stat => stat.target).length > 0
                    ? (stats
                        .filter(stat => stat.target)
                        .reduce((sum, stat) => sum + Math.min((stat.value / stat.target) * 100, 100), 0) /
                      stats.filter(stat => stat.target).length)
                    : 0
                }
                suffix="%"
                precision={1}
              />
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
};

// Helper function to create stat objects
export const createStat = ({
  title,
  value,
  trend,
  target,
  icon,
  color,
  description,
  prefix,
  suffix,
  formatter,
  precision
}) => ({
  title,
  value,
  trend,
  target,
  icon,
  color,
  description,
  prefix,
  suffix,
  formatter,
  precision
});

export default StatsDashboard;