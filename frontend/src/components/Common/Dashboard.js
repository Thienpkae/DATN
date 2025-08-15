import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Typography, 
  List, 
  Avatar, 
  Tag, 
  Space, 
  Button,
  Spin,
  message,
  Empty
} from 'antd';
import { 
  HomeOutlined,
  FileTextOutlined,
  SwapOutlined,
  UserOutlined,
  BankOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import landService from '../../services/landService';

const { Title, Text } = Typography;

const Dashboard = ({ user, onLogout }) => {
  const [stats, setStats] = useState({
    landParcels: 0,
    certificates: 0,
    transactions: 0,
    documents: 0,
    pendingTransactions: 0,
    completedTransactions: 0,
    rejectedTransactions: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        if (user.org === 'Org3') {
          // Citizens: personal stats
          const landParcels = await landService.getLandParcelsByOwner(user.userId).catch(() => []);

          setStats({
            landParcels: Array.isArray(landParcels) ? landParcels.length : 0,
            certificates: Array.isArray(landParcels) ? landParcels.filter(l => l.certificateID).length : 0,
            transactions: 0, // Will be implemented when transaction service is ready
            documents: 0,
            pendingTransactions: 0,
            completedTransactions: 0,
            rejectedTransactions: 0
          });

          // Set recent activity for citizens
          setRecentActivity(landParcels.slice(0, 5).map(land => ({
            key: land.id,
            title: `Thửa đất ${land.id}`,
            description: `Vị trí: ${land.location}`,
            time: land.createdAt ? new Date(land.createdAt).toLocaleDateString('vi-VN') : 'Gần đây',
            status: land.legalStatus
          })));
        } else {
          // Organizations: system-wide stats
          const landParcels = await landService.getAllLandParcels().catch(() => []);

          setStats({
            landParcels: Array.isArray(landParcels) ? landParcels.length : 0,
            certificates: Array.isArray(landParcels) ? landParcels.filter(l => l.certificateID).length : 0,
            transactions: 0, // Will be implemented when transaction service is ready
            documents: 0, // Will be implemented when document service is ready
            pendingTransactions: 0,
            completedTransactions: 0,
            rejectedTransactions: 0
          });

          // Set recent activity for organizations
          setRecentActivity(landParcels.slice(0, 5).map(land => ({
            key: land.id,
            title: `Thửa đất ${land.id}`,
            description: `Chủ sở hữu: ${land.ownerID}`,
            time: land.createdAt ? new Date(land.createdAt).toLocaleDateString('vi-VN') : 'Gần đây',
            status: land.legalStatus
          })));
        }
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu dashboard:', error);
        message.error('Không thể tải dữ liệu dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);



  const getStatusColor = (status) => {
    const statusColors = {
      'Có giấy chứng nhận': 'green',
      'Chưa có GCN': 'orange',
      'Đang tranh chấp': 'red',
      'Đang thế chấp': 'purple'
    };
    return statusColors[status] || 'default';
  };

  const getOrganizationIcon = () => {
    switch (user.org) {
      case 'Org1':
        return <BankOutlined style={{ fontSize: '24px', color: '#1890ff' }} />;
      case 'Org2':
        return <SafetyCertificateOutlined style={{ fontSize: '24px', color: '#52c41a' }} />;
      case 'Org3':
        return <UserOutlined style={{ fontSize: '24px', color: '#722ed1' }} />;
      default:
        return <UserOutlined style={{ fontSize: '24px' }} />;
    }
  };

  const getOrganizationName = () => {
    switch (user.org) {
      case 'Org1':
        return 'Cơ quan quản lý đất đai';
      case 'Org2':
        return 'Văn phòng công chứng';
      case 'Org3':
        return 'Chủ sở hữu đất';
      default:
        return 'Người dùng';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text>Đang tải dữ liệu...</Text>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Row align="middle" gutter={16}>
          <Col>
            {getOrganizationIcon()}
          </Col>
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              Chào mừng, {user.fullName || user.name}!
            </Title>
            <Text type="secondary">
              {getOrganizationName()} - {user.org}
            </Text>
          </Col>
        </Row>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng số thửa đất"
              value={stats.landParcels}
              prefix={<HomeOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Giấy chứng nhận"
              value={stats.certificates}
              prefix={<SafetyCertificateOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Giao dịch"
              value={stats.transactions}
              prefix={<SwapOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tài liệu"
              value={stats.documents}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Recent Activity */}
      <Card 
        title={
          <Space>
            <FileTextOutlined />
            <span>Hoạt động gần đây</span>
          </Space>
        }
      >
        {recentActivity.length > 0 ? (
          <List
            dataSource={recentActivity}
            renderItem={item => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      style={{ 
                        backgroundColor: getStatusColor(item.status) === 'green' ? '#52c41a' : 
                                       getStatusColor(item.status) === 'red' ? '#ff4d4f' : '#faad14'
                      }}
                      icon={<FileTextOutlined />}
                    />
                  }
                  title={item.title}
                  description={
                    <Space direction="vertical" size="small">
                      <Text type="secondary">{item.description}</Text>
                      <Space>
                        <Tag color={getStatusColor(item.status)}>
                          {item.status}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {item.time}
                        </Text>
                      </Space>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty 
            description="Không có hoạt động gần đây"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Card>

      {/* Quick Actions */}
      <Card 
        title="Thao tác nhanh" 
        style={{ marginTop: '24px' }}
      >
        <Row gutter={[16, 16]}>
          {user.org === 'Org1' && (
            <Col xs={24} sm={12} lg={8}>
              <Button 
                type="primary" 
                icon={<HomeOutlined />}
                size="large"
                block
                href="/land-parcels/create"
              >
                Tạo thửa đất mới
              </Button>
            </Col>
          )}
          <Col xs={24} sm={12} lg={8}>
            <Button 
              icon={<FileTextOutlined />}
              size="large"
              block
              href="/land-parcels"
            >
              Xem thửa đất
            </Button>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Button 
              icon={<SwapOutlined />}
              size="large"
              block
              href="/transactions"
            >
              Xem giao dịch
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Dashboard;
