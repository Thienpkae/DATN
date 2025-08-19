import React from 'react';
import { Layout, Typography, Tabs, Space, Button } from 'antd';
import { SafetyCertificateOutlined, TeamOutlined, ToolOutlined, FileSearchOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import AdminAccountPage from '../../Admin/AdminAccountPage';
import SystemConfigPage from '../../Admin/SystemConfigPage';
import LogsPage from '../../Admin/LogsPage';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const Org2AdminPage = () => {
  const navigate = useNavigate();

  const items = [
    {
      key: 'accounts',
      label: (
        <Space>
          <TeamOutlined />
          <span>Quản lý tài khoản</span>
        </Space>
      ),
      children: <AdminAccountPage />,
    },
    {
      key: 'system-configs',
      label: (
        <Space>
          <ToolOutlined />
          <span>Thiết lập hệ thống</span>
        </Space>
      ),
      children: <SystemConfigPage />,
    },
    {
      key: 'logs',
      label: (
        <Space>
          <FileSearchOutlined />
          <span>Logs hệ thống</span>
        </Space>
      ),
      children: <LogsPage />,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: '#fff',
          padding: '0 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <SafetyCertificateOutlined style={{ fontSize: 24, color: '#722ed1', marginRight: 12 }} />
          <Title level={3} style={{ margin: 0, color: '#722ed1' }}>
            Admin - Văn phòng Công chứng
          </Title>
        </div>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>Về Dashboard</Button>
        </Space>
      </Header>

      <Content style={{ margin: 24 }}>
        <div style={{ background: '#fff', padding: 16, borderRadius: 8 }}>
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary">Quản trị hệ thống cho tổ chức Org2</Text>
          </div>
          <Tabs items={items} destroyInactiveTabPane />
        </div>
      </Content>
    </Layout>
  );
};

export default Org2AdminPage;


