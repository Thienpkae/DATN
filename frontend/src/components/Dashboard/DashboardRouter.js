import React, { useState } from 'react';
import { Layout, Menu, Typography, Space, Avatar, Dropdown, Button, Breadcrumb, theme } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SwapOutlined,
  SafetyOutlined,
  HomeOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import Dashboard from '../Common/Dashboard';
import NotificationCenter from '../Common/NotificationCenter';
import LandParcelManagement from '../LandParcel/LandParcelManagement';
import TransactionManagementPage from '../Organization/Org1/TransactionManagementPage';
import UserProfile from '../User/UserProfile';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

/**
 * Enhanced Dashboard Router with improved navigation and layout
 */
const DashboardRouter = ({ user, onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState('overview');
  const { token: themeToken } = theme.useToken();

  // Notifications will be handled by NotificationCenter component

  // Menu items based on user role and organization
  const getMenuItems = () => {
    const baseItems = [
      {
        key: 'overview',
        icon: <DashboardOutlined />,
        label: 'Tổng quan',
      },
    ];

    // Organization-specific menu items
    switch (user.org) {
      case 'Org1': // Land Registry Authority
        baseItems.push(
          {
            key: 'land-parcels',
            icon: <HomeOutlined />,
            label: 'Quản lý đất đai',
          },
          {
            key: 'transactions',
            icon: <SwapOutlined />,
            label: 'Quản lý giao dịch',
            children: [
              {
                key: 'pending-transactions',
                label: 'Giao dịch chờ xử lý',
              },
              {
                key: 'completed-transactions',
                label: 'Giao dịch hoàn thành',
              },
              {
                key: 'rejected-transactions',
                label: 'Giao dịch bị từ chối',
              }
            ]
          },
          {
            key: 'documents',
            icon: <FileTextOutlined />,
            label: 'Quản lý tài liệu',
            children: [
              {
                key: 'document-verification',
                label: 'Xác minh tài liệu',
              },
              {
                key: 'document-archives',
                label: 'Lưu trữ tài liệu',
              }
            ]
          }
        );
        break;
      case 'Org2': // Notary Office
        baseItems.push(
          {
            key: 'verification',
            icon: <CheckCircleOutlined />,
            label: 'Verification',
            children: [
              {
                key: 'document-verification',
                label: 'Document Verification',
              },
              {
                key: 'identity-verification',
                label: 'Identity Verification',
              }
            ]
          },
          {
            key: 'processing',
            icon: <InfoCircleOutlined />,
            label: 'Transaction Processing',
            children: [
              {
                key: 'pending-requests',
                label: 'Pending Requests',
              },
              {
                key: 'processing-queue',
                label: 'Processing Queue',
              }
            ]
          }
        );
        break;
      case 'Org3': // Land Owner
        baseItems.push(
          {
            key: 'my-assets',
            icon: <HomeOutlined />,
            label: 'My Land Assets',
            children: [
              {
                key: 'my-land-parcels',
                label: 'My Land Parcels',
              },
              {
                key: 'land-history',
                label: 'Land History',
              }
            ]
          },
          {
            key: 'my-certificates',
            icon: <SafetyOutlined />,
            label: 'My Certificates',
            children: [
              {
                key: 'active-certificates',
                label: 'Active Certificates',
              },
              {
                key: 'expired-certificates',
                label: 'Expired Certificates',
              }
            ]
          },
          {
            key: 'my-transactions',
            icon: <SwapOutlined />,
            label: 'My Transactions',
            children: [
              {
                key: 'transaction-history',
                label: 'Transaction History',
              },
              {
                key: 'pending-transactions',
                label: 'Pending Transactions',
              }
            ]
          }
        );
        break;
      default:
        break;
    }

    // Common menu items for all users
    baseItems.push(
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: 'Hồ sơ cá nhân',
      },
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: 'Cài đặt',
      }
    );

    return baseItems;
  };

  const handleMenuClick = ({ key }) => {
    setSelectedKey(key);
  };

  const handleLogout = () => {
    onLogout();
  };

  // NotificationCenter component handles notification icons

  const getOrganizationIcon = () => {
    switch (user.org) {
      case 'Org1':
        return <BankOutlined style={{ fontSize: '16px' }} />;
      case 'Org2':
        return <SafetyCertificateOutlined style={{ fontSize: '16px' }} />;
      case 'Org3':
        return <UserOutlined style={{ fontSize: '16px' }} />;
      default:
        return <UserOutlined style={{ fontSize: '16px' }} />;
    }
  };

  // NotificationCenter component handles all notification logic

  const userMenu = (
    <div style={{ padding: '8px 0', minWidth: '200px' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa' }}>
        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{user.name}</div>
        <div style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', marginTop: '4px' }}>
          {getOrganizationIcon()}
          <span style={{ marginLeft: '8px' }}>{user.org}</span>
        </div>
      </div>
      <div
        style={{
          padding: '12px 16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          transition: 'background-color 0.2s'
        }}
        onClick={handleLogout}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
        onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}
      >
        <LogoutOutlined style={{ marginRight: '8px' }} />
        Đăng xuất
      </div>
    </div>
  );

  const renderContent = () => {
    switch (selectedKey) {
      case 'overview':
        return <Dashboard user={user} />;
      
      // Land Management - Tất cả chức năng đất đai
      case 'land-parcels':
        return <LandParcelManagement user={user} />;
      
      // Transaction Management
      case 'pending-transactions':
        return <TransactionManagementPage user={user} />;
      case 'completed-transactions':
        return <TransactionManagementPage user={user} />;
      
      // Profile & Settings
      case 'profile':
        return <UserProfile user={user} />;
      case 'settings':
        return (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <Title level={3}>Settings</Title>
            <Text type="secondary">
              Settings page is under development.
            </Text>
          </div>
        );
      
      default:
        return (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <Title level={3}>Feature Coming Soon</Title>
            <Text type="secondary">
              This feature is under development and will be available soon.
            </Text>
          </div>
        );
    }
  };

  const getBreadcrumbItems = () => {
    const items = [
      { title: <HomeOutlined />, href: '/' },
      { title: 'Bảng điều khiển' }
    ];

    if (selectedKey !== 'overview') {
      const menuItem = getMenuItems().find(item => 
        item.key === selectedKey || 
        (item.children && item.children.find(child => child.key === selectedKey))
      );
      
      if (menuItem) {
        if (menuItem.children) {
          const childItem = menuItem.children.find(child => child.key === selectedKey);
          if (childItem) {
            items.push(
              { title: menuItem.label },
              { title: childItem.label }
            );
          }
        } else {
          items.push({ title: menuItem.label });
        }
      }
    }

    return items;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          background: themeToken.colorBgContainer,
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
          zIndex: 1000
        }}
        width={280}
      >
        <div style={{ 
          padding: '16px', 
          textAlign: 'center',
          borderBottom: `1px solid ${themeToken.colorBorderSecondary}`,
          marginBottom: '8px'
        }}>
          <Title level={4} style={{ margin: 0, color: themeToken.colorPrimary }}>
            {collapsed ? 'LR' : 'Hệ thống quản lý đất đai'}
          </Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={getMenuItems()}
          onClick={handleMenuClick}
          style={{ 
            borderRight: 0,
            fontSize: '14px'
          }}
          defaultOpenKeys={['overview']}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: themeToken.colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 999
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64, marginRight: '16px' }}
            />
            <Breadcrumb items={getBreadcrumbItems()} />
          </div>
          <Space size="large">
            <NotificationCenter />
            <Dropdown overlay={userMenu} trigger={['click']} placement="bottomRight">
              <Avatar
                style={{ 
                  backgroundColor: themeToken.colorPrimary, 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                icon={<UserOutlined />}
              />
            </Dropdown>
          </Space>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: '24px',
            background: themeToken.colorBgContainer,
            borderRadius: '8px',
            minHeight: '280px',
            overflow: 'auto'
          }}
        >
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardRouter;
