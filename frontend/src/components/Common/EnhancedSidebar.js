import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Menu, Badge, Tooltip } from 'antd';
import {
  HomeOutlined,
  SettingOutlined,
  BankOutlined,
  TeamOutlined,
  AuditOutlined,
  SwapOutlined,
  CloudServerOutlined,
  BarChartOutlined,
  SafetyOutlined,
  DatabaseOutlined,
  ApiOutlined,
  DashboardOutlined,
  TransactionOutlined,
  FolderOpenOutlined,
  UserSwitchOutlined,
  LineChartOutlined,
  SecurityScanOutlined
} from '@ant-design/icons';

const { Sider } = Layout;

const EnhancedSidebar = ({ 
  collapsed, 
  onCollapse, 
  selectedKey, 
  onMenuSelect, 
  user,
  pendingCount = 0 
}) => {
  const [menuItems, setMenuItems] = useState([]);

  const getMenuItems = useCallback(() => {
    const baseItems = [
      {
        key: 'dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
        title: 'Dashboard Overview'
      }
    ];

    // Organization-specific menu items
    switch (user.org) {
      case 'Org1':
        return [
          ...baseItems,
          {
            type: 'divider'
          },
          {
            key: 'land-management',
            icon: <HomeOutlined />,
            label: 'Land Management',
            title: 'Land Parcel Management',
            children: [
              {
                key: 'land-parcels',
                icon: <HomeOutlined />,
                label: 'Land Parcels',
                title: 'Manage Land Parcels'
              },
              {
                key: 'land-registry',
                icon: <DatabaseOutlined />,
                label: 'Registry',
                title: 'Land Registry Database'
              }
            ]
          },
          {
            key: 'certificates',
            icon: <AuditOutlined />,
            label: 'Certificates',
            title: 'Certificate Management'
          },
          {
            key: 'transactions',
            icon: <TransactionOutlined />,
            label: (
              <span>
                Transactions
                {pendingCount > 0 && (
                  <Badge 
                    count={pendingCount} 
                    size="small" 
                    style={{ marginLeft: '8px' }}
                  />
                )}
              </span>
            ),
            title: 'Transaction Management'
          },
          {
            key: 'documents',
            icon: <FolderOpenOutlined />,
            label: 'Documents',
            title: 'Document Management'
          },
          {
            type: 'divider'
          },
          {
            key: 'administration',
            icon: <SettingOutlined />,
            label: 'Administration',
            title: 'System Administration',
            children: [
              {
                key: 'account-management',
                icon: <UserSwitchOutlined />,
                label: 'Account Management',
                title: 'User Account Management'
              },
              {
                key: 'users',
                icon: <TeamOutlined />,
                label: 'User Management',
                title: 'System Users'
              },
              {
                key: 'audit-logs',
                icon: <SecurityScanOutlined />,
                label: 'Audit Logs',
                title: 'System Audit Logs'
              }
            ]
          },
          {
            key: 'reports',
            icon: <LineChartOutlined />,
            label: 'Reports & Analytics',
            title: 'Reports and Analytics'
          },
          {
            key: 'ipfs-storage',
            icon: <CloudServerOutlined />,
            label: 'IPFS Storage',
            title: 'Distributed Storage'
          }
        ];

      case 'Org2':
        return [
          ...baseItems,
          {
            type: 'divider'
          },
          {
            key: 'workflow',
            icon: <ApiOutlined />,
            label: 'Workflow Management',
            title: 'Transaction Workflow',
            children: [
              {
                key: 'pending-requests',
                icon: <SwapOutlined />,
                label: (
                  <span>
                    Pending Requests
                    {pendingCount > 0 && (
                      <Badge 
                        count={pendingCount} 
                        size="small" 
                        style={{ marginLeft: '8px' }}
                      />
                    )}
                  </span>
                ),
                title: 'Pending Transaction Requests'
              },
              {
                key: 'transactions',
                icon: <TransactionOutlined />,
                label: 'All Transactions',
                title: 'Transaction Management'
              },
              {
                key: 'processing-queue',
                icon: <BarChartOutlined />,
                label: 'Processing Queue',
                title: 'Transaction Processing Queue'
              }
            ]
          },
          {
            key: 'verification',
            icon: <SafetyOutlined />,
            label: 'Document Verification',
            title: 'Document Verification',
            children: [
              {
                key: 'documents',
                icon: <FolderOpenOutlined />,
                label: 'Documents',
                title: 'Document Management'
              },
              {
                key: 'verification-queue',
                icon: <AuditOutlined />,
                label: 'Verification Queue',
                title: 'Document Verification Queue'
              }
            ]
          },
          {
            key: 'certificates',
            icon: <AuditOutlined />,
            label: 'Certificates',
            title: 'Certificate Review'
          },
          {
            type: 'divider'
          },
          {
            key: 'reports',
            icon: <LineChartOutlined />,
            label: 'Reports',
            title: 'Processing Reports'
          }
        ];

      case 'Org3':
        return [
          ...baseItems,
          {
            type: 'divider'
          },
          {
            key: 'my-properties',
            icon: <HomeOutlined />,
            label: 'My Properties',
            title: 'My Land Properties',
            children: [
              {
                key: 'land-parcels',
                icon: <HomeOutlined />,
                label: 'Land Parcels',
                title: 'My Land Parcels'
              },
              {
                key: 'certificates',
                icon: <AuditOutlined />,
                label: 'Certificates',
                title: 'My Certificates'
              }
            ]
          },
          {
            key: 'transactions',
            icon: <TransactionOutlined />,
            label: (
              <span>
                My Transactions
                {pendingCount > 0 && (
                  <Badge 
                    count={pendingCount} 
                    size="small" 
                    style={{ marginLeft: '8px' }}
                  />
                )}
              </span>
            ),
            title: 'My Transaction History'
          },
          {
            key: 'requests',
            icon: <SwapOutlined />,
            label: 'Service Requests',
            title: 'Land Service Requests',
            children: [
              {
                key: 'transfer-request',
                icon: <UserSwitchOutlined />,
                label: 'Transfer Request',
                title: 'Land Transfer Request'
              },
              {
                key: 'split-request',
                icon: <ApiOutlined />,
                label: 'Split Request',
                title: 'Land Split Request'
              },
              {
                key: 'merge-request',
                icon: <DatabaseOutlined />,
                label: 'Merge Request',
                title: 'Land Merge Request'
              },
              {
                key: 'purpose-change',
                icon: <SettingOutlined />,
                label: 'Purpose Change',
                title: 'Change Land Use Purpose'
              }
            ]
          },
          {
            key: 'documents',
            icon: <FolderOpenOutlined />,
            label: 'My Documents',
            title: 'Document Management'
          },
          {
            type: 'divider'
          },
          {
            key: 'support',
            icon: <TeamOutlined />,
            label: 'Help & Support',
            title: 'Customer Support'
          }
        ];

      default:
        return baseItems;
    }
  }, [user, pendingCount]);

  useEffect(() => {
    setMenuItems(getMenuItems());
  }, [getMenuItems]);

  const getOrgColor = () => {
    switch (user.org?.toLowerCase()) {
      case 'org1': return '#1890ff';
      case 'org2': return '#52c41a';
      case 'org3': return '#fa8c16';
      default: return '#1890ff';
    }
  };

  const getOrgIcon = () => {
    switch (user.org?.toLowerCase()) {
      case 'org1': return <BankOutlined />;
      case 'org2': return <TeamOutlined />;
      case 'org3': return <HomeOutlined />;
      default: return <DashboardOutlined />;
    }
  };

  const getOrgTitle = () => {
    switch (user.org?.toLowerCase()) {
      case 'org1': return 'Land Authority';
      case 'org2': return 'Government Officers';
      case 'org3': return 'Citizens Portal';
      default: return 'Land Registry';
    }
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      width={280}
      collapsedWidth={80}
      theme="light"
      className="sidebar-transition"
      style={{
        background: '#ffffff',
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.08)',
        zIndex: 1000,
        position: 'fixed',
        height: '100vh',
        left: 0,
        top: 0,
        bottom: 0,
        borderRight: '1px solid #f0f0f0',
        overflow: 'auto'
      }}
    >
      {/* Logo Section */}
      <div 
        style={{
          height: '72px',
          margin: '16px 12px',
          background: `linear-gradient(135deg, ${getOrgColor()} 0%, ${getOrgColor()}dd 100%)`,
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: collapsed ? '16px' : '18px',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={() => onCollapse(!collapsed)}
      >
        <Tooltip title={collapsed ? getOrgTitle() : ''} placement="right">
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center' }}>
            {collapsed ? (
              <div style={{ fontSize: '24px' }}>
                {getOrgIcon()}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '20px' }}>
                  {getOrgIcon()}
                </div>
                <div>
                  <div style={{ fontSize: '16px', lineHeight: '20px' }}>
                    Land Registry
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.9, lineHeight: '14px' }}>
                    {getOrgTitle()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Tooltip>
        
        {/* Animated background */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)`,
          transform: 'translateX(-100%)',
          transition: 'transform 0.6s',
          pointerEvents: 'none'
        }} />
      </div>

      {/* User Info Section */}
      {!collapsed && (
        <div style={{ 
          padding: '0 24px 16px', 
          borderBottom: '1px solid #f0f0f0',
          marginBottom: '8px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            padding: '12px',
            background: '#fafafa',
            borderRadius: '8px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${getOrgColor()}, ${getOrgColor()}dd)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 600,
              fontSize: '14px'
            }}>
              {user.userId ? user.userId.charAt(0).toUpperCase() : 
               user.cccd ? user.cccd.charAt(0).toUpperCase() : "U"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                fontWeight: 600, 
                fontSize: '14px', 
                color: '#1f1f1f',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {user.userId || user.cccd || 'User'}
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: '#8c8c8c',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {user.role || 'User'} • {user.org}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Menu */}
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems.map((item, index) => ({
          ...item,
          className: 'sidebar-menu-item',
          style: { 
            animationDelay: `${index * 0.05}s`,
            margin: '2px 8px',
            borderRadius: '8px'
          },
        }))}
        onClick={({ key }) => onMenuSelect(key)}
        style={{
          border: 'none',
          background: 'transparent',
          fontSize: '14px'
        }}
        theme="light"
        inlineIndent={20}
      />

      {/* Footer */}
      {!collapsed && (
        <div style={{ 
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          right: '16px',
          padding: '12px',
          background: '#f6f8fa',
          borderRadius: '8px',
          border: '1px solid #e1e4e8'
        }}>
          <div style={{ 
            fontSize: '12px', 
            color: '#8c8c8c',
            textAlign: 'center',
            lineHeight: '16px'
          }}>
            <div style={{ fontWeight: 600, color: '#1f1f1f', marginBottom: '4px' }}>
              Blockchain Secured
            </div>
            <div>
              Land Registry System v2.0
            </div>
          </div>
        </div>
      )}
    </Sider>
  );
};

export default EnhancedSidebar;