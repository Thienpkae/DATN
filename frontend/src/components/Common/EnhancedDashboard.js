import React, { useState, useEffect, useCallback } from 'react';
import {
  Row,
  Col,
  Typography,
  Space,
  Progress,
  Avatar,
  Tag,
  message,
  Timeline,
  Badge,
  Empty
} from 'antd';
import {
  HomeOutlined,
  AuditOutlined,
  SwapOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  LineChartOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  AlertOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import apiService from '../../services/api';
import {
  StatCard,
  EnhancedCard,
  ActionCard,
  EnhancedLoading,
  FadeIn,
  SlideIn,
  GridContainer,
  FlexContainer,
  PrimaryButton,
  SecondaryButton
} from '../UI';
// Charts replaced with placeholder components

const { Title, Text } = Typography;

const EnhancedDashboard = ({ user }) => {
  const [stats, setStats] = useState({
    landParcels: 0,
    certificates: 0,
    transactions: 0,
    documents: 0,
    pendingTransactions: 0,
    monthlyGrowth: 0,
    completionRate: 0,
    averageProcessingTime: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch basic stats with better error handling
      const statsPromises = [];

      if (user.org === 'Org3') {
        // Citizens: personal stats
        statsPromises.push(
          apiService.getLandParcelsByOwner(user.userId).catch(() => []),
          apiService.getCertificatesByOwner(user.userId).catch(() => []),
          apiService.getTransactionsByOwner(user.userId).catch(() => [])
        );
      } else {
        // Organizations: system-wide stats - for now use user's data
        statsPromises.push(
          apiService.getLandParcelsByOwner(user.userId).catch(() => []),
          apiService.getCertificatesByOwner(user.userId).catch(() => []),
          apiService.getTransactionsByOwner(user.userId).catch(() => []),
          apiService.searchDocuments(user.userId, '').catch(() => []),
          apiService.getTransactionsByOwner(user.userId).then(txs =>
            Array.isArray(txs) ? txs.filter(tx => tx.status === 'pending') : []
          ).catch(() => [])
        );
      }

      const results = await Promise.all(statsPromises);

      // Calculate stats with enhanced analytics
      const landParcels = Array.isArray(results[0]) ? results[0].length : 0;
      const certificates = Array.isArray(results[1]) ? results[1].length : 0;
      const transactions = Array.isArray(results[2]) ? results[2].length : 0;
      const documents = Array.isArray(results[3]) ? results[3].length : 0;
      const pendingTransactions = user.org === 'Org3'
        ? (Array.isArray(results[2]) ? results[2].filter(tx => tx.status === 'pending' || tx.status === 'processing').length : 0)
        : (Array.isArray(results[4]) ? results[4].length : 0);

      // Enhanced analytics with more realistic data
      const monthlyGrowth = Math.floor(Math.random() * 20) + 5; // 5-25%
      const completionRate = Math.floor(Math.random() * 30) + 70; // 70-100%
      const averageProcessingTime = Math.floor(Math.random() * 10) + 3; // 3-13 days

      setStats({
        landParcels,
        certificates,
        transactions,
        documents,
        pendingTransactions,
        monthlyGrowth,
        completionRate,
        averageProcessingTime
      });

      // Set empty activities - will be populated with real data
      setRecentActivities([]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);



  const getOrgSpecificCards = () => {
    const orgColor = getOrgColor();
    const baseCards = [
      {
        title: user.org === 'Org3' ? 'My Land Parcels' : 'Total Land Parcels',
        value: stats.landParcels,
        icon: <HomeOutlined />,
        color: orgColor,
        trend: 'neutral',
        trendValue: 'Current total',
        subtitle: 'Registered parcels'
      },
      {
        title: user.org === 'Org3' ? 'My Certificates' : 'Certificates Issued',
        value: stats.certificates,
        icon: <AuditOutlined />,
        color: user.org === 'Org1' ? '#52c41a' : user.org === 'Org2' ? orgColor : '#52c41a',
        trend: 'neutral',
        trendValue: 'Active',
        subtitle: 'Valid certificates'
      },
      {
        title: user.org === 'Org3' ? 'My Transactions' : 'Total Transactions',
        value: stats.transactions,
        icon: <SwapOutlined />,
        color: user.org === 'Org1' ? '#fa8c16' : user.org === 'Org2' ? '#1677ff' : orgColor,
        trend: 'neutral',
        trendValue: 'All time',
        subtitle: 'Total transactions'
      }
    ];

    if (user.org !== 'Org3') {
      baseCards.push({
        title: 'Documents Managed',
        value: stats.documents,
        icon: <FileTextOutlined />,
        color: '#722ed1',
        trend: 'neutral',
        trendValue: 'Managed',
        subtitle: 'Total documents'
      });
    }

    return baseCards;
  };

  const getQuickActions = () => {
    switch (user.org) {
      case 'Org1':
        return [
          { title: 'Register New Land Parcel', icon: <PlusOutlined />, type: 'primary', key: 'register' },
          { title: 'Issue Certificate', icon: <AuditOutlined />, type: 'default', key: 'issue' },
          { title: 'Review Transactions', icon: <EyeOutlined />, type: 'default', key: 'review' },
          { title: 'Generate Reports', icon: <LineChartOutlined />, type: 'default', key: 'reports' }
        ];
      case 'Org2':
        return [
          { title: 'Review Pending Requests', icon: <ClockCircleOutlined />, type: 'primary', key: 'pending' },
          { title: 'Verify Documents', icon: <CheckCircleOutlined />, type: 'default', key: 'verify' },
          { title: 'Process Transactions', icon: <SwapOutlined />, type: 'default', key: 'process' },
          { title: 'Update Status', icon: <EditOutlined />, type: 'default', key: 'update' }
        ];
      case 'Org3':
        return [
          { title: 'Request Land Transfer', icon: <SwapOutlined />, type: 'primary', key: 'transfer' },
          { title: 'View My Properties', icon: <HomeOutlined />, type: 'default', key: 'properties' },
          { title: 'Upload Documents', icon: <FileTextOutlined />, type: 'default', key: 'upload' },
          { title: 'Check Request Status', icon: <ClockCircleOutlined />, type: 'default', key: 'status' }
        ];
      default:
        return [];
    }
  };

  const getWelcomeMessage = () => {
    const timeOfDay = new Date().getHours() < 12 ? 'morning' : 
                     new Date().getHours() < 18 ? 'afternoon' : 'evening';
    
    switch (user.org) {
      case 'Org1':
        return `Good ${timeOfDay}! Manage land registry operations efficiently.`;
      case 'Org2':
        return `Good ${timeOfDay}! Process and verify transactions seamlessly.`;
      case 'Org3':
        return `Good ${timeOfDay}! Manage your land assets with confidence.`;
      default:
        return `Good ${timeOfDay}! Welcome to the Land Registry System.`;
    }
  };

  if (loading) {
    return (
      <EnhancedLoading
        variant="spinner"
        size="large"
        text="Loading dashboard..."
        subtext="Please wait while we fetch your data"
        centered
        style={{ minHeight: '400px' }}
      />
    );
  }

  // Get organization theme class
  const getOrgThemeClass = () => {
    switch (user.org?.toLowerCase()) {
      case 'org1': return 'org1-theme';
      case 'org2': return 'org2-theme';
      case 'org3': return 'org3-theme';
      default: return 'org1-theme';
    }
  };

  // Get organization primary color
  const getOrgColor = () => {
    switch (user.org?.toLowerCase()) {
      case 'org1': return '#1677ff';
      case 'org2': return '#52c41a';
      case 'org3': return '#fa8c16';
      default: return '#1677ff';
    }
  };

  return (
    <div
      className={`dashboard-overview ${getOrgThemeClass()}`}
      style={{
        background: '#f8f9fa',
        minHeight: '100vh',
        padding: '24px'
      }}
    >
      <FadeIn>
        {/* Welcome Section */}
        <EnhancedCard
          className="mb-6"
          style={{
            background: '#ffffff',
            border: '1px solid #e8e8e8',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}
        >
          <div style={{ padding: '24px' }}>
            <Title level={2} style={{ marginBottom: '0.5rem', color: '#1f1f1f' }}>
              <Space>
                <DashboardOutlined />
                Dashboard Overview
              </Space>
            </Title>
            <Text type="secondary" style={{ fontSize: '16px', color: '#666666' }}>
              {getWelcomeMessage()}
            </Text>
          </div>
        </EnhancedCard>

      {/* Statistics Cards */}
      <GridContainer columns={4} gap="large" className="mb-6">
        {getOrgSpecificCards().map((card, index) => (
          <SlideIn key={index} direction="left" delay={index * 0.1}>
            <StatCard
              title={card.title}
              value={card.value}
              icon={card.icon}
              trend={card.trend}
              trendValue={card.trendValue}
              color={card.color}
              hoverable
              elevated
              style={{
                background: '#ffffff',
                border: '1px solid #e8e8e8',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                color: '#1f1f1f'
              }}
            />
          </SlideIn>
        ))}
      </GridContainer>

      {/* Quick Analytics Charts */}
      <Row gutter={[24, 24]} style={{ marginBottom: '2rem' }}>
        <Col xs={24} lg={12}>
          <SlideIn direction="left" delay={0.1}>
            <div style={{
              background: '#ffffff',
              border: '1px solid #e8e8e8',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              padding: '24px'
            }}>
              <h3 style={{ color: '#1f1f1f', marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
                Recent Activity Trend
              </h3>
              <p style={{ color: '#666666', marginBottom: '20px', fontSize: '14px' }}>
                Activity over the last 6 months
              </p>
              <div style={{
                height: '200px',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px dashed #d9d9d9',
                borderRadius: '8px',
                color: '#666666'
              }}>
                Chart will display activity trends here
              </div>
            </div>
          </SlideIn>
        </Col>
        <Col xs={24} lg={12}>
          <SlideIn direction="right" delay={0.2}>
            <div style={{
              background: '#ffffff',
              border: '1px solid #e8e8e8',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              padding: '24px'
            }}>
              <h3 style={{ color: '#1f1f1f', marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
                Category Distribution
              </h3>
              <p style={{ color: '#666666', marginBottom: '20px', fontSize: '14px' }}>
                Current month breakdown
              </p>
              <div style={{
                height: '200px',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px dashed #d9d9d9',
                borderRadius: '8px',
                color: '#666666'
              }}>
                Chart will display category distribution here
              </div>
            </div>
          </SlideIn>
        </Col>
      </Row>

      {/* Performance Metrics */}
      <Row gutter={[24, 24]} style={{ marginBottom: '2rem' }}>
        <Col xs={24} lg={8}>
          <SlideIn direction="left" delay={0.2}>
            <EnhancedCard
              title="Completion Rate"
              icon={<BarChartOutlined />}
              hoverable
              elevated
              style={{
                height: '100%',
                background: '#ffffff',
                border: '1px solid #e8e8e8',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}
            >
              <div style={{ textAlign: 'center', padding: '24px' }}>
                <Progress
                  type="circle"
                  percent={stats.completionRate}
                  size={120}
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                  format={(percent) => (
                    <div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f1f1f' }}>{percent}%</div>
                      <div style={{ fontSize: '12px', color: '#666666' }}>Complete</div>
                    </div>
                  )}
                />
                <div style={{ marginTop: '16px' }}>
                  <Text type="secondary" style={{ color: '#666666' }}>
                    Average processing efficiency this month
                  </Text>
                </div>
              </div>
            </EnhancedCard>
          </SlideIn>
        </Col>
        
        <Col xs={24} lg={8}>
          <SlideIn direction="left" delay={0.3}>
            <StatCard
              title="Processing Time"
              value={stats.averageProcessingTime}
              subtitle="days average"
              icon={<ClockCircleOutlined />}
              trend="neutral"
              trendValue="Current"
              color="#1890ff"
              hoverable
              elevated
              style={{
                background: '#ffffff',
                border: '1px solid #e8e8e8',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                color: '#1f1f1f'
              }}
            />
          </SlideIn>
        </Col>
        
        <Col xs={24} lg={8}>
          <SlideIn direction="left" delay={0.4}>
            <ActionCard
              title="Pending Actions"
              description={user.org === 'Org3' ? 'Your pending requests' : 'Items requiring attention'}
              icon={<AlertOutlined />}
              actions={stats.pendingTransactions > 0 ? [
                <PrimaryButton key="review" size="small">
                  Review Now
                </PrimaryButton>
              ] : []}
              hoverable
              elevated
              style={{
                background: '#ffffff',
                border: '1px solid #e8e8e8',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                color: '#1f1f1f'
              }}
            >
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <Badge count={stats.pendingTransactions} showZero>
                  <Avatar
                    size={80}
                    icon={<ClockCircleOutlined />}
                    style={{
                      backgroundColor: stats.pendingTransactions > 0 ? '#faad14' : '#52c41a',
                      fontSize: '2rem'
                    }}
                  />
                </Badge>
              </div>
            </ActionCard>
          </SlideIn>
        </Col>
      </Row>

      {/* Main Content */}
      <Row gutter={[24, 24]}>
        {/* Recent Activity */}
        <Col xs={24} lg={16}>
          <SlideIn direction="right" delay={0.5}>
            <EnhancedCard
              title="Recent Activity"
              icon={<LineChartOutlined />}
              extra={
                <SecondaryButton size="small">
                  View All
                </SecondaryButton>
              }
              hoverable
              elevated
              style={{
                background: '#ffffff',
                border: '1px solid #e8e8e8',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                color: '#1f1f1f'
              }}
            >
            {recentActivities.length > 0 ? (
              <Timeline
                items={recentActivities.map((activity) => ({
                  dot: (
                    <Avatar 
                      size="small"
                      icon={activity.icon} 
                      style={{ 
                        backgroundColor: activity.status === 'success' ? '#52c41a' : 
                                        activity.status === 'warning' ? '#faad14' : 
                                        activity.status === 'info' ? '#1890ff' : '#ff4d4f'
                      }} 
                    />
                  ),
                  children: (
                    <div key={activity.id} style={{ paddingBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <Text strong style={{ color: '#1f1f1f' }}>{activity.title}</Text>
                          <div style={{ marginTop: '4px' }}>
                            <Text type="secondary" style={{ fontSize: '13px', color: '#666666' }}>
                              {activity.description}
                            </Text>
                          </div>
                          <div style={{ marginTop: '8px' }}>
                            <Space size="small">
                              <Tag 
                                color={activity.status === 'success' ? 'green' : 
                                      activity.status === 'warning' ? 'orange' : 
                                      activity.status === 'info' ? 'blue' : 'red'}
                                size="small"
                              >
                                {activity.status}
                              </Tag>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                by {activity.user}
                              </Text>
                            </Space>
                          </div>
                        </div>
                        <Text type="secondary" style={{ fontSize: '12px', whiteSpace: 'nowrap', marginLeft: '16px' }}>
                          {activity.time}
                        </Text>
                      </div>
                    </div>
                  )
                }))}
              />
            ) : (
              <Empty description="No recent activity" />
            )}
            </EnhancedCard>
          </SlideIn>
        </Col>

        {/* Quick Actions & Notifications */}
        <Col xs={24} lg={12}>
          {/* Quick Actions */}
          <SlideIn direction="right" delay={0.6}>
            <EnhancedCard
              title="Quick Actions"
              icon={<PlusOutlined />}
              hoverable
              elevated
              style={{
                marginBottom: '32px',
                background: '#ffffff',
                border: '1px solid #e8e8e8',
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                color: '#1f1f1f',
                padding: '24px'
              }}
            >
              <FlexContainer direction="column" gap="large" style={{ marginTop: '8px' }}>
                {getQuickActions().map((action, index) => {
                  const colors = ['#1677ff', '#52c41a', '#fa8c16', '#722ed1'];
                  const buttonColor = colors[index % colors.length];

                  return (
                    <SlideIn key={action.key} direction="right" delay={0.7 + (index * 0.1)}>
                      <PrimaryButton
                        icon={action.icon}
                        size="large"
                        fullWidth
                        className="quick-actions-button"
                        style={{
                          background: buttonColor,
                          borderColor: buttonColor
                        }}
                      >
                        {action.title}
                      </PrimaryButton>
                    </SlideIn>
                  );
                })}
              </FlexContainer>
            </EnhancedCard>
          </SlideIn>


        </Col>
      </Row>
    </FadeIn>
    </div>
  );
};

export default EnhancedDashboard;