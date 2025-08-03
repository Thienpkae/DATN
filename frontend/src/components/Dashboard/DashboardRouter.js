import React, { useState } from 'react';
import { Layout, Menu, Typography, Space, Avatar, Dropdown, Button, Badge } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  SwapOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import EnhancedDashboard from '../Common/EnhancedDashboard';
import DocumentManagementPage from '../Organization/Org1/DocumentManagementPage';
import DocumentVerificationPage from '../Organization/Org2/DocumentVerificationPage';
import CertificateVerificationPage from '../Organization/Org2/CertificateVerificationPage';
import TransactionProcessingPage from '../Organization/Org2/TransactionProcessingPage';
import MyLandAssetsPage from '../Organization/Org3/MyLandAssetsPage';
import TransactionRequestsPage from '../Organization/Org3/TransactionRequestsPage';
import MyCertificatesPage from '../Organization/Org3/MyCertificatesPage';

import ReportsPage from '../Common/ReportsPage';
import UserManagementPage from '../Common/UserManagementPage';
import SystemSettingsPage from '../Common/SystemSettingsPage';
import AnalyticsDashboard from '../Common/AnalyticsDashboard';
import SystemHealthPage from '../Common/SystemHealthPage';
import DataExportPage from '../Common/DataExportPage';
import SystemReportsPage from '../Common/SystemReportsPage';
import LandManagementModule from '../Organization/Org1/LandManagementModule';
import CertificateManagementModule from '../Organization/Org1/CertificateManagementModule';
import TransactionManagementModule from '../Organization/Org1/TransactionManagementModule';
import UserProfileModule from '../Common/UserProfileModule';
import { FadeIn, SlideIn } from '../UI';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

/**
 * Enhanced Dashboard Router with modern navigation and layout
 */
const DashboardRouter = ({ user, onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState('overview');

  // Sample notifications data
  const [notifications] = useState([
    {
      id: 1,
      type: 'success',
      title: 'Land Transfer Approved',
      message: 'Your land transfer request has been approved successfully.',
      time: '2 hours ago',
      read: false
    },
    {
      id: 2,
      type: 'info',
      title: 'Document Verification',
      message: 'New document uploaded for verification.',
      time: '5 hours ago',
      read: false
    },
    {
      id: 3,
      type: 'warning',
      title: 'Certificate Expiring',
      message: 'Your land certificate will expire in 30 days.',
      time: '1 day ago',
      read: true
    }
  ]);

  // Menu items based on user role and organization
  const getMenuItems = () => {
    const baseItems = [
      {
        key: 'overview',
        icon: <DashboardOutlined />,
        label: 'Overview',
      },
    ];

    // Organization-specific menu items
    switch (user.org) {
      case 'Org1': // Land Registry Authority
        baseItems.push(
          {
            key: 'land-management',
            icon: <UserOutlined />,
            label: 'Land Management',
          },
          {
            key: 'certificates',
            icon: <SafetyOutlined />,
            label: 'Certificate Management',
          },
          {
            key: 'transactions',
            icon: <SwapOutlined />,
            label: 'Transaction Management',
          },
          {
            key: 'documents',
            icon: <FileTextOutlined />,
            label: 'Document Management',
          },
          {
            key: 'analytics',
            icon: <FileTextOutlined />,
            label: 'Analytics & Reports',
            children: [
              {
                key: 'analytics-dashboard',
                label: 'Analytics Dashboard',
              },
              {
                key: 'system-reports',
                label: 'System Reports',
              },
              {
                key: 'data-export',
                label: 'Data Export',
              },
            ],
          },
          {
            key: 'management',
            icon: <SettingOutlined />,
            label: 'System Management',
            children: [
              {
                key: 'users',
                label: 'User Management',
              },
              {
                key: 'system',
                label: 'System Settings',
              },
              {
                key: 'system-health',
                label: 'System Health',
              },
            ],
          }
        );
        break;

      case 'Org2': // Government Office
        baseItems.push(
          {
            key: 'document-verification',
            icon: <FileTextOutlined />,
            label: 'Document Management',
          },
          {
            key: 'certificate-verification',
            icon: <SafetyOutlined />,
            label: 'Certificate Verification',
          },
          {
            key: 'transaction-processing',
            icon: <SwapOutlined />,
            label: 'Transaction Processing',
          },
        );
        break;

      case 'Org3': // Citizens
        baseItems.push(
          {
            key: 'my-assets',
            icon: <UserOutlined />,
            label: 'My Land Assets',
          },
          {
            key: 'my-certificates',
            icon: <SafetyOutlined />,
            label: 'My Certificates',
          },
          {
            key: 'transaction-requests',
            icon: <SwapOutlined />,
            label: 'Transaction Requests',
          },
          {
            key: 'profile',
            icon: <UserOutlined />,
            label: 'Profile Management',
          }
        );
        break;

      default:
        // Default menu for unknown organizations
        baseItems.push(
          {
            key: 'reports',
            icon: <FileTextOutlined />,
            label: 'Reports',
          }
        );
    }

    return baseItems;
  };

  // User dropdown menu
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: onLogout,
    },
  ];

  // Render content based on selected menu
  const renderContent = () => {
    switch (selectedKey) {
      case 'overview':
        return <EnhancedDashboard user={user} onLogout={onLogout} />;
      case 'land-management':
        return <LandManagementModule user={user} />;
      case 'certificates':
        return <CertificateManagementModule user={user} />;
      case 'transactions':
        return <TransactionManagementModule user={user} />;
      case 'documents':
        return <DocumentManagementPage user={user} />;
      case 'document-verification':
        return <DocumentVerificationPage user={user} />;
      case 'certificate-verification':
        return <CertificateVerificationPage user={user} />;
      case 'transaction-processing':
        return <TransactionProcessingPage user={user} />;
      case 'my-assets':
        return <MyLandAssetsPage user={user} />;
      case 'my-certificates':
        return <MyCertificatesPage user={user} />;
      case 'transaction-requests':
        return <TransactionRequestsPage user={user} />;
      case 'profile':
        return <UserProfileModule user={user} onUserUpdate={onLogout} />;
      case 'reports':
        return <ReportsPage user={user} />;
      case 'analytics-dashboard':
        return <AnalyticsDashboard user={user} />;
      case 'system-reports':
        return <SystemReportsPage user={user} />;
      case 'data-export':
        return <DataExportPage user={user} />;
      case 'system-health':
        return <SystemHealthPage user={user} />;
      case 'users':
        return <UserManagementPage user={user} />;
      case 'system':
        return <SystemSettingsPage user={user} />;
      default:
        return <EnhancedDashboard user={user} onLogout={onLogout} />;
    }
  };

  // Get organization theme color
  const getOrgColor = () => {
    switch (user.org?.toLowerCase()) {
      case 'org1': return '#1677ff';
      case 'org2': return '#52c41a';
      case 'org3': return '#fa8c16';
      default: return '#1677ff';
    }
  };

  // Get organization theme class
  const getOrgThemeClass = () => {
    switch (user.org?.toLowerCase()) {
      case 'org1': return 'org1-theme';
      case 'org2': return 'org2-theme';
      case 'org3': return 'org3-theme';
      default: return 'org1-theme';
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'warning':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      case 'info':
      default:
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
    }
  };

  // Create notifications dropdown menu
  const notificationsMenu = {
    items: [
      {
        key: 'header',
        label: (
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #f0f0f0',
            fontWeight: '600',
            fontSize: '14px',
            color: '#1f1f1f'
          }}>
            Notifications ({notifications.filter(n => !n.read).length} unread)
          </div>
        ),
        disabled: true
      },
      ...notifications.map(notification => ({
        key: notification.id,
        label: (
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #f8f9fa',
            backgroundColor: notification.read ? '#ffffff' : '#f6f8ff',
            maxWidth: '320px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              {getNotificationIcon(notification.type)}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: '600',
                  fontSize: '13px',
                  color: '#1f1f1f',
                  marginBottom: '4px'
                }}>
                  {notification.title}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#666666',
                  lineHeight: '1.4',
                  marginBottom: '6px'
                }}>
                  {notification.message}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#999999'
                }}>
                  {notification.time}
                </div>
              </div>
            </div>
          </div>
        )
      })),
      {
        key: 'footer',
        label: (
          <div style={{
            padding: '12px 16px',
            textAlign: 'center',
            borderTop: '1px solid #f0f0f0',
            color: '#1890ff',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer'
          }}>
            View All Notifications
          </div>
        )
      }
    ]
  };

  return (
    <div className={getOrgThemeClass()}>
      <Layout style={{ minHeight: '100vh', background: '#f8f9fa' }}>
        {/* Sidebar */}
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          style={{
            background: '#ffffff',
            boxShadow: '2px 0 12px rgba(0,0,0,0.08)',
            borderRight: '1px solid #e8e8e8',
            zIndex: 100,
          }}
          width={250}
        >
        {/* Logo/Brand */}
        <div style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '0' : '0 24px',
          borderBottom: '1px solid #f0f0f0',
          background: `linear-gradient(135deg, ${getOrgColor()}, ${getOrgColor()}dd)`,
        }}>
          {!collapsed ? (
            <SlideIn direction="left">
              <Space>
                <Avatar
                  size="small"
                  style={{
                    background: 'linear-gradient(135deg, #1890ff, #40a9ff)',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  LR
                </Avatar>
                <Text strong style={{ color: '#fff', fontSize: '16px' }}>
                  Land Registry
                </Text>
              </Space>
            </SlideIn>
          ) : (
            <Avatar
              size="small"
              style={{
                background: 'linear-gradient(135deg, #1890ff, #40a9ff)',
                color: '#ffffff',
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              LR
            </Avatar>
          )}
        </div>

        {/* Navigation Menu */}
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={getMenuItems()}
          onClick={({ key }) => setSelectedKey(key)}
          style={{
            border: 'none',
            height: 'calc(100vh - 64px)',
            paddingTop: '16px',
            background: 'transparent',
          }}
          theme="light"
        />
      </Sider>

      {/* Main Layout */}
      <Layout>
        {/* Header */}
        <Header style={{
          padding: '0 24px',
          background: '#ffffff',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          borderBottom: '1px solid #e8e8e8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 99,
        }}>
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px' }}
            />
            
            <div style={{ marginLeft: '16px' }}>
              <Title level={4} style={{ margin: 0, color: '#1f1f1f' }}>
                {selectedKey === 'overview' ? 'Dashboard Overview' :
                 selectedKey.charAt(0).toUpperCase() + selectedKey.slice(1)}
              </Title>
            </div>
          </Space>

          <Space size="large">
            {/* Notifications */}
            <Dropdown
              menu={notificationsMenu}
              trigger={['click']}
              placement="bottomRight"
              overlayStyle={{
                maxHeight: '400px',
                overflowY: 'auto',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                borderRadius: '8px'
              }}
            >
              <Button
                type="text"
                style={{
                  fontSize: '16px',
                  position: 'relative',
                  padding: '8px'
                }}
              >
                <BellOutlined />
                {notifications.filter(n => !n.read).length > 0 && (
                  <Badge
                    count={notifications.filter(n => !n.read).length}
                    size="small"
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      fontSize: '10px',
                      minWidth: '16px',
                      height: '16px',
                      lineHeight: '16px'
                    }}
                  />
                )}
              </Button>
            </Dropdown>

            {/* User Menu */}
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Space style={{ cursor: 'pointer', padding: '8px' }}>
                <Avatar
                  size="small"
                  style={{
                    background: `linear-gradient(135deg, ${getOrgColor()}, ${getOrgColor()}dd)`,
                    color: '#ffffff',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  {user.username?.charAt(0).toUpperCase()}
                </Avatar>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>
                    {user.username}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                    {user.org}
                  </div>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* Content */}
        <Content style={{
          margin: '24px',
          padding: '0',
          background: 'transparent',
          borderRadius: '12px',
          overflow: 'auto',
          minHeight: 'calc(100vh - 112px)',
        }}>
          <div style={{
            background: 'transparent',
            minHeight: '100%',
            borderRadius: '12px',
          }}>
            <FadeIn key={selectedKey}>
              {renderContent()}
            </FadeIn>
          </div>
        </Content>
      </Layout>
    </Layout>
    </div>
  );
};

export default DashboardRouter;
