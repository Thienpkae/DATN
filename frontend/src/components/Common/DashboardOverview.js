import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Typography, Spin, Button, Space, Progress, List, Avatar, Tag, message } from 'antd';
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
  CheckCircleOutlined
} from '@ant-design/icons';
import { landParcelAPI, certificateAPI, transactionAPI, documentAPI } from '../../services/api';

const { Title, Text } = Typography;

const DashboardOverview = ({ user }) => {
  const [stats, setStats] = useState({
    landParcels: 0,
    certificates: 0,
    transactions: 0,
    documents: 0,
    pendingTransactions: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      
      if (user.org === 'Org3') {
        // For citizens, show their personal stats
        const [landParcelsRes, certificatesRes, transactionsRes] = await Promise.all([
          landParcelAPI.getByOwner(user.userId).catch(() => ({ data: [] })),
          certificateAPI.getAll().then(res => ({ data: res.data.filter(cert => cert.ownerId === user.userId) })).catch(() => ({ data: [] })),
          transactionAPI.getByUser(user.userId).catch(() => ({ data: [] }))
        ]);

        const pendingTransactions = (transactionsRes.data || []).filter(
          tx => tx.status === 'pending' || tx.status === 'processing'
        );

        setStats({
          landParcels: landParcelsRes.data?.length || 0,
          certificates: certificatesRes.data?.length || 0,
          transactions: transactionsRes.data?.length || 0,
          documents: 0, // Will be calculated if needed
          pendingTransactions: pendingTransactions.length
        });
      } else {
        // For Org1 and Org2, fetch real stats from backend APIs
        try {
          const [landParcelsRes, certificatesRes, transactionsRes, documentsRes, pendingTxRes] = await Promise.all([
            landParcelAPI.getAll(),
            certificateAPI.getAll(),
            transactionAPI.getAll(),
            documentAPI.getAll(),
            transactionAPI.getPending()
          ]);
          setStats({
            landParcels: landParcelsRes.data?.length || 0,
            certificates: certificatesRes.data?.length || 0,
            transactions: transactionsRes.data?.length || 0,
            documents: documentsRes.data?.length || 0,
            pendingTransactions: pendingTxRes.data?.length || 0
          });
        } catch (error) {
          message.error('Failed to fetch dashboard stats');
          setStats({
            landParcels: 0,
            certificates: 0,
            transactions: 0,
            documents: 0,
            pendingTransactions: 0
          });
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      message.error('Error fetching dashboard stats');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const getOrgSpecificCards = () => {
    switch (user.org) {
      case 'Org1':
        return [
          {
            title: 'Total Land Parcels',
            value: stats.landParcels,
            icon: <HomeOutlined />,
            color: '#1890ff'
          },
          {
            title: 'Certificates Issued',
            value: stats.certificates,
            icon: <AuditOutlined />,
            color: '#52c41a'
          },
          {
            title: 'Total Transactions',
            value: stats.transactions,
            icon: <SwapOutlined />,
            color: '#fa8c16'
          },
          {
            title: 'Documents Managed',
            value: stats.documents,
            icon: <FileTextOutlined />,
            color: '#722ed1'
          }
        ];

      case 'Org2':
        return [
          {
            title: 'Pending Approvals',
            value: stats.pendingTransactions,
            icon: <ClockCircleOutlined />,
            color: '#faad14'
          },
          {
            title: 'Processed Today',
            value: stats.transactions,
            icon: <SwapOutlined />,
            color: '#52c41a'
          },
          {
            title: 'Documents Verified',
            value: stats.documents,
            icon: <FileTextOutlined />,
            color: '#1890ff'
          },
          {
            title: 'Certificates Reviewed',
            value: stats.certificates,
            icon: <AuditOutlined />,
            color: '#722ed1'
          }
        ];

      case 'Org3':
        return [
          {
            title: 'My Land Parcels',
            value: stats.landParcels,
            icon: <HomeOutlined />,
            color: '#fa8c16'
          },
          {
            title: 'My Certificates',
            value: stats.certificates,
            icon: <AuditOutlined />,
            color: '#52c41a'
          },
          {
            title: 'My Transactions',
            value: stats.transactions,
            icon: <SwapOutlined />,
            color: '#1890ff'
          },
          {
            title: 'Pending Requests',
            value: stats.pendingTransactions,
            icon: <ClockCircleOutlined />,
            color: '#faad14'
          }
        ];

      default:
        return [];
    }
  };

  const getWelcomeMessage = () => {
    switch (user.org) {
      case 'Org1':
        return 'Land Authority Dashboard - Manage land registry operations';
      case 'Org2':
        return 'Government Officers Portal - Process and verify transactions';
      case 'Org3':
        return 'Citizens Portal - Manage your land assets and requests';
      default:
        return 'Welcome to Land Registry System';
    }
  };

  const getQuickActions = () => {
    switch (user.org) {
      case 'Org1':
        return [
          { title: 'Register New Land Parcel', icon: <PlusOutlined />, type: 'primary' },
          { title: 'Issue Certificate', icon: <AuditOutlined />, type: 'default' },
          { title: 'View All Transactions', icon: <EyeOutlined />, type: 'default' },
          { title: 'Generate Reports', icon: <FileTextOutlined />, type: 'default' }
        ];
      case 'Org2':
        return [
          { title: 'Review Pending Requests', icon: <ClockCircleOutlined />, type: 'primary' },
          { title: 'Verify Documents', icon: <CheckCircleOutlined />, type: 'default' },
          { title: 'Process Transactions', icon: <SwapOutlined />, type: 'default' },
          { title: 'Update Status', icon: <EditOutlined />, type: 'default' }
        ];
      case 'Org3':
        return [
          { title: 'Request Land Transfer', icon: <SwapOutlined />, type: 'primary' },
          { title: 'View My Properties', icon: <HomeOutlined />, type: 'default' },
          { title: 'Upload Documents', icon: <FileTextOutlined />, type: 'default' },
          { title: 'Check Request Status', icon: <ClockCircleOutlined />, type: 'default' }
        ];
      default:
        return [];
    }
  };

  const getRecentActivities = () => {
    // Mock data for demonstration
    return [
      {
        title: 'Land Parcel LP001 registered',
        description: 'New land parcel added to the system',
        time: '2 hours ago',
        status: 'success',
        icon: <HomeOutlined />
      },
      {
        title: 'Certificate CRT001 issued',
        description: 'Ownership certificate generated',
        time: '4 hours ago',
        status: 'success',
        icon: <AuditOutlined />
      },
      {
        title: 'Transaction TX001 pending',
        description: 'Awaiting government approval',
        time: '6 hours ago',
        status: 'warning',
        icon: <ClockCircleOutlined />
      },
      {
        title: 'Document verification completed',
        description: 'All required documents verified',
        time: '1 day ago',
        status: 'success',
        icon: <CheckCircleOutlined />
      }
    ];
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <Title level={2} style={{ marginBottom: '0.5rem' }}>
          Dashboard Overview
        </Title>
        <Text type="secondary" style={{ fontSize: '16px' }}>
          {getWelcomeMessage()}
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: '2rem' }}>
        {getOrgSpecificCards().map((card, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card className="stats-card slide-in-left" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="stats-card-icon" style={{ background: `linear-gradient(135deg, ${card.color}, ${card.color}dd)` }}>
                {card.icon}
              </div>
              <div className="stats-card-value">{card.value}</div>
              <div className="stats-card-label">{card.title}</div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Main Content */}
      <Row gutter={[24, 24]}>
        {/* Recent Activity */}
        <Col xs={24} lg={14}>
          <Card 
            className="professional-card"
            title={
              <Space>
                <LineChartOutlined />
                <span>Recent Activity</span>
              </Space>
            }
            extra={
              <Button type="link" size="small">
                View All
              </Button>
            }
          >
            <List
              itemLayout="horizontal"
              dataSource={getRecentActivities()}
              renderItem={(item, index) => (
                <List.Item style={{ animationDelay: `${index * 0.1}s` }} className="slide-in-right">
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        icon={item.icon} 
                        style={{ 
                          backgroundColor: item.status === 'success' ? '#52c41a' : 
                                          item.status === 'warning' ? '#faad14' : '#1890ff'
                        }} 
                      />
                    }
                    title={
                      <Space>
                        <span>{item.title}</span>
                        <Tag color={item.status === 'success' ? 'green' : item.status === 'warning' ? 'orange' : 'blue'}>
                          {item.status}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <div>{item.description}</div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{item.time}</Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Quick Actions */}
        <Col xs={24} lg={10}>
          <Card 
            className="professional-card"
            title={
              <Space>
                <PlusOutlined />
                <span>Quick Actions</span>
              </Space>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {getQuickActions().map((action, index) => (
                <Button
                  key={index}
                  type={action.type}
                  icon={action.icon}
                  size="large"
                  style={{ 
                    width: '100%', 
                    textAlign: 'left',
                    height: '48px',
                    animationDelay: `${index * 0.1}s`
                  }}
                  className="slide-in-right"
                >
                  {action.title}
                </Button>
              ))}
            </Space>
          </Card>

          {/* System Status */}
          <Card 
            className="professional-card"
            title={
              <Space>
                <CheckCircleOutlined />
                <span>System Status</span>
              </Space>
            }
            style={{ marginTop: '1.5rem' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text>Blockchain Network</Text>
                  <Text strong style={{ color: '#52c41a' }}>Online</Text>
                </div>
                <Progress percent={100} status="success" showInfo={false} />
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text>IPFS Storage</Text>
                  <Text strong style={{ color: '#52c41a' }}>Connected</Text>
                </div>
                <Progress percent={95} status="active" showInfo={false} />
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <Text>Database Sync</Text>
                  <Text strong style={{ color: '#1890ff' }}>Syncing</Text>
                </div>
                <Progress percent={87} showInfo={false} />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardOverview;