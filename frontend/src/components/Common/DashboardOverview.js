import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Statistic, Typography, Spin, Alert } from 'antd';
import { 
  HomeOutlined,
  AuditOutlined,
  SwapOutlined,
  FileTextOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { landParcelAPI, certificateAPI, transactionAPI } from '../../services/api';

const { Title } = Typography;

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
        // For Org1 and Org2, show general system stats
        setStats({
          landParcels: 0, // These would need system-wide queries
          certificates: 0,
          transactions: 0,
          documents: 0,
          pendingTransactions: 0
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
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
            icon: <HomeOutlined style={{ color: '#1890ff' }} />,
            color: '#1890ff'
          },
          {
            title: 'Certificates Issued',
            value: stats.certificates,
            icon: <AuditOutlined style={{ color: '#52c41a' }} />,
            color: '#52c41a'
          },
          {
            title: 'Total Transactions',
            value: stats.transactions,
            icon: <SwapOutlined style={{ color: '#fa8c16' }} />,
            color: '#fa8c16'
          },
          {
            title: 'Documents Managed',
            value: stats.documents,
            icon: <FileTextOutlined style={{ color: '#722ed1' }} />,
            color: '#722ed1'
          }
        ];

      case 'Org2':
        return [
          {
            title: 'Pending Approvals',
            value: stats.pendingTransactions,
            icon: <ClockCircleOutlined style={{ color: '#faad14' }} />,
            color: '#faad14'
          },
          {
            title: 'Processed Today',
            value: stats.transactions,
            icon: <SwapOutlined style={{ color: '#52c41a' }} />,
            color: '#52c41a'
          },
          {
            title: 'Documents Verified',
            value: stats.documents,
            icon: <FileTextOutlined style={{ color: '#1890ff' }} />,
            color: '#1890ff'
          },
          {
            title: 'Certificates Reviewed',
            value: stats.certificates,
            icon: <AuditOutlined style={{ color: '#722ed1' }} />,
            color: '#722ed1'
          }
        ];

      case 'Org3':
        return [
          {
            title: 'My Land Parcels',
            value: stats.landParcels,
            icon: <HomeOutlined style={{ color: '#fa8c16' }} />,
            color: '#fa8c16'
          },
          {
            title: 'My Certificates',
            value: stats.certificates,
            icon: <AuditOutlined style={{ color: '#52c41a' }} />,
            color: '#52c41a'
          },
          {
            title: 'My Transactions',
            value: stats.transactions,
            icon: <SwapOutlined style={{ color: '#1890ff' }} />,
            color: '#1890ff'
          },
          {
            title: 'Pending Requests',
            value: stats.pendingTransactions,
            icon: <ClockCircleOutlined style={{ color: '#faad14' }} />,
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

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Title level={2}>Dashboard Overview</Title>
      <Alert
        message={getWelcomeMessage()}
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[16, 16]}>
        {getOrgSpecificCards().map((card, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card>
              <Statistic
                title={card.title}
                value={card.value}
                prefix={card.icon}
                valueStyle={{ color: card.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Recent Activity" style={{ height: 300 }}>
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <p>Recent activity will be displayed here</p>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Quick Actions" style={{ height: 300 }}>
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <p>Quick action buttons will be displayed here</p>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardOverview;
