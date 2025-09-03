import React from 'react';
import {
  Layout,
  Typography,
  Alert,
  Avatar,
  Dropdown,
  Space,
  Card,
  Tabs
} from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  AppstoreOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import LandManagementPage from './LandManagementPage';
import DocumentManagementPage from './DocumentManagementPage';
import TransactionManagementPage from './TransactionManagementPage';
import NotificationCenter from '../../Common/NotificationCenter';
import { normalizeVietnameseName } from '../../../utils/text';

const { Header, Content } = Layout;
const { Title } = Typography;

/**
 * Org3 Dashboard - Người dân
 * Dashboard đơn giản chỉ để routing
 */
const Org3Dashboard = ({ user, onLogout }) => {
  const userMenu = {
    items: [
      {
        key: 'user-info',
        label: (
          <div style={{ padding: '4px 0', borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa' }}>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{normalizeVietnameseName(user.name)}</div>
            <div style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', marginTop: '4px' }}>
              <UserOutlined style={{ marginRight: '8px' }} />
              Công dân
            </div>
          </div>
        ),
        disabled: true
      },
      {
        type: 'divider'
      },
      {
        key: 'profile',
        label: 'Quản lý hồ sơ',
        onClick: () => { window.location.href = '/profile'; }
      },
      {
        key: 'logout',
        label: (
          <span>
            <LogoutOutlined style={{ marginRight: '8px' }} />
            Đăng xuất
          </span>
        ),
        onClick: onLogout
      }
    ]
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{
        background: '#fff',
        padding: '0 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <UserOutlined style={{ fontSize: '24px', color: '#52c41a', marginRight: '12px' }} />
          <Title level={3} style={{ margin: 0, color: '#52c41a' }}>
            Cổng thông tin Công dân
          </Title>
        </div>
        <Space size="large">
          <NotificationCenter />
          <Dropdown menu={userMenu} trigger={['click']} placement="bottomRight">
            <Avatar
              style={{ 
                backgroundColor: '#52c41a', 
                cursor: 'pointer'
              }}
              icon={<UserOutlined />}
            />
          </Dropdown>
        </Space>
      </Header>

      <Content style={{ margin: '24px', background: '#f0f2f5' }}>
        <div style={{ padding: '24px', background: '#fff', borderRadius: '8px' }}>
          <Alert
            message={`Chào mừng ${normalizeVietnameseName(user.name)}!`}
            description="Bạn đang truy cập hệ thống với quyền Công dân."
            type="info"
            showIcon
            style={{ marginBottom: '24px' }}
          />

          <Tabs
            items={[
              {
                key: 'land',
                label: (
                  <span>
                    <AppstoreOutlined /> Thửa đất của tôi
                  </span>
                ),
                children: (
                  <Card variant="borderless" style={{ padding: 0 }}>
                    <LandManagementPage />
                  </Card>
                )
              },
              {
                key: 'document',
                label: (
                  <span>
                    <FileTextOutlined /> Tài liệu của tôi
                  </span>
                ),
                children: (
                  <Card variant="borderless" style={{ padding: 0 }}>
                    <DocumentManagementPage />
                  </Card>
                )
              },
              {
                key: 'transaction',
                label: (
                  <span>
                    <FileTextOutlined /> Giao dịch của tôi
                  </span>
                ),
                children: (
                  <Card variant="borderless" style={{ padding: 0 }}>
                    <TransactionManagementPage />
                  </Card>
                )
              }
            ]}
          />
        </div>
      </Content>
    </Layout>
  );
};

export default Org3Dashboard;