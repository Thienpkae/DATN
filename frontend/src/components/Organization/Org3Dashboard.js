import React, { useState } from 'react';
import { Layout, Menu, Typography, Button, Space, Badge } from 'antd';
import {
  DashboardOutlined,
  HomeOutlined,
  SwapOutlined,
  FileTextOutlined,
  AuditOutlined,
  LogoutOutlined,
  SendOutlined
} from '@ant-design/icons';

// Components
import DashboardOverview from '../Common/DashboardOverview';
import MyLandParcels from '../LandParcel/MyLandParcels';
import TransactionRequests from '../Transaction/TransactionRequests';
import MyCertificates from '../Certificate/MyCertificates';
import MyDocuments from '../Document/MyDocuments';
import MyTransactions from '../Transaction/MyTransactions';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const Org3Dashboard = ({ user, onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState('dashboard');

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'my-land-parcels',
      icon: <HomeOutlined />,
      label: 'My Land Parcels',
    },
    {
      key: 'my-certificates',
      icon: <AuditOutlined />,
      label: 'My Certificates',
    },
    {
      key: 'transaction-requests',
      icon: <SendOutlined />,
      label: 'Submit Requests',
    },
    {
      key: 'my-transactions',
      icon: <SwapOutlined />,
      label: 'My Transactions',
    },
    {
      key: 'my-documents',
      icon: <FileTextOutlined />,
      label: 'My Documents',
    },
  ];

  const renderContent = () => {
    switch (selectedKey) {
      case 'dashboard':
        return <DashboardOverview user={user} />;
      case 'my-land-parcels':
        return <MyLandParcels user={user} />;
      case 'my-certificates':
        return <MyCertificates user={user} />;
      case 'transaction-requests':
        return <TransactionRequests user={user} />;
      case 'my-transactions':
        return <MyTransactions user={user} />;
      case 'my-documents':
        return <MyDocuments user={user} />;
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
          {collapsed ? 'CIT' : 'Citizens'}
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
          background: '#fa8c16', 
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Title level={4} style={{ color: 'white', margin: 0 }}>
            Citizens Portal
          </Title>
          
          <Space>
            <span style={{ color: 'white' }}>
              Welcome, {user.userId}
            </span>
            <Badge className="org3-badge">ORG3</Badge>
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

export default Org3Dashboard;
