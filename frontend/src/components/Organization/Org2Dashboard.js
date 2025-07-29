import React, { useState } from 'react';
import { Layout, Menu, Typography, Button, Space, Badge } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  SwapOutlined,
  LogoutOutlined,
  BankOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

// Components
import DashboardOverview from '../Common/DashboardOverview';
import TransactionProcessing from '../Transaction/TransactionProcessing';
import DocumentVerification from '../Document/DocumentVerification';
import DocumentManagement from '../Document/DocumentManagement';
import Reports from '../Reports/Reports';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const Org2Dashboard = ({ user, onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState('dashboard');

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'transaction-processing',
      icon: <SwapOutlined />,
      label: 'Process Transactions',
    },
    {
      key: 'document-verification',
      icon: <CheckCircleOutlined />,
      label: 'Document Verification',
    },
    {
      key: 'documents',
      icon: <FileTextOutlined />,
      label: 'Documents',
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
      case 'transaction-processing':
        return <TransactionProcessing user={user} />;
      case 'document-verification':
        return <DocumentVerification user={user} />;
      case 'documents':
        return <DocumentManagement user={user} />;
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
          {collapsed ? 'GOV' : 'Government'}
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
          background: '#52c41a', 
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Title level={4} style={{ color: 'white', margin: 0 }}>
            Government Officers Dashboard
          </Title>
          
          <Space>
            <span style={{ color: 'white' }}>
              Welcome, {user.userId}
            </span>
            <Badge className="org2-badge">ORG2</Badge>
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

export default Org2Dashboard;
