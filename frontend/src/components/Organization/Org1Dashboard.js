import React, { useState } from 'react';
import { Layout, Menu, Typography, Button, Space, Badge } from 'antd';
import {
  DashboardOutlined,
  HomeOutlined,
  FileTextOutlined,
  SwapOutlined,
  UserOutlined,
  LogoutOutlined,
  AuditOutlined,
  BankOutlined,
  TeamOutlined,
  CloudUploadOutlined
} from '@ant-design/icons';

// Components
import DashboardOverview from '../Common/DashboardOverview';
import LandParcelManagement from '../LandParcel/LandParcelManagement';
import CertificateManagement from '../Certificate/CertificateManagement';
import TransactionManagement from '../Transaction/TransactionManagement';
import DocumentManagement from '../Document/DocumentManagement';
import UserManagement from '../User/UserManagement';
import Reports from '../Reports/Reports';
import AdminAccountPage from '../Admin/AdminAccountPage';
import IPFSFileUpload from '../Common/IPFSFileUpload';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const Org1Dashboard = ({ user, onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState('dashboard');

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'land-parcels',
      icon: <HomeOutlined />,
      label: 'Land Parcels',
    },
    {
      key: 'certificates',
      icon: <AuditOutlined />,
      label: 'Certificates',
    },
    {
      key: 'transactions',
      icon: <SwapOutlined />,
      label: 'Transactions',
    },
    {
      key: 'documents',
      icon: <FileTextOutlined />,
      label: 'Documents',
    },
    {
      key: 'ipfs-storage',
      icon: <CloudUploadOutlined />,
      label: 'IPFS Storage',
    },
    {
      key: 'account-management',
      icon: <TeamOutlined />,
      label: 'Account Management',
    },
    {
      key: 'users',
      icon: <UserOutlined />,
      label: 'User Management',
    },
    {
      key: 'reports',
      icon: <BankOutlined />,
      label: 'Reports',
    },
  ];

  const renderContent = () => {
    switch (selectedKey) {
      case 'dashboard':
        return <DashboardOverview user={user} />;
      case 'land-parcels':
        return <LandParcelManagement user={user} />;
      case 'certificates':
        return <CertificateManagement user={user} />;
      case 'transactions':
        return <TransactionManagement user={user} />;
      case 'documents':
        return <DocumentManagement user={user} />;
      case 'ipfs-storage':
        return <IPFSFileUpload />;
      case 'account-management':
        return <AdminAccountPage user={user} />;
      case 'users':
        return <UserManagement user={user} />;
      case 'reports':
        return <Reports user={user} />;
      default:
        return <DashboardOverview user={user} />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={250}
      >
        <div style={{ 
          height: 64, 
          margin: 16, 
          background: 'rgba(255,255,255,0.2)', 
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold'
        }}>
          {collapsed ? 'LRS' : 'Land Registry'}
        </div>
        
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => setSelectedKey(key)}
        />
      </Sider>

      <Layout>
        <Header style={{ 
          background: '#1890ff', 
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Title level={4} style={{ color: 'white', margin: 0 }}>
            Land Authority Dashboard
          </Title>
          
          <Space>
            <span style={{ color: 'white' }}>
              Welcome, {user.userId}
            </span>
            <Badge className="org1-badge">ORG1</Badge>
            <Button 
              type="primary" 
              ghost 
              icon={<LogoutOutlined />}
              onClick={onLogout}
            >
              Logout
            </Button>
          </Space>
        </Header>

        <Content style={{ 
          margin: 24, 
          padding: 24, 
          background: '#f0f2f5',
          borderRadius: 8,
          minHeight: 280 
        }}>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
};

export default Org1Dashboard;
