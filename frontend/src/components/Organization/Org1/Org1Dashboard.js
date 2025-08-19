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
  BankOutlined,
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
 * Org1 Dashboard - Sở Tài nguyên & Môi trường
 * Dashboard đơn giản chỉ để routing
 */
const Org1Dashboard = ({ user, onLogout }) => {
  const userMenu = (
    <div style={{ padding: '8px 0', minWidth: '200px' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa' }}>
        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{normalizeVietnameseName(user.name)}</div>
        <div style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', marginTop: '4px' }}>
          <BankOutlined style={{ marginRight: '8px' }} />
          Sở Tài nguyên & Môi trường
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
        onClick={() => { window.location.href = '/profile'; }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
        onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}
      >
        Quản lý hồ sơ
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
        onClick={onLogout}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
        onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}
      >
        <LogoutOutlined style={{ marginRight: '8px' }} />
        Đăng xuất
      </div>
    </div>
  );

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
          <BankOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '12px' }} />
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            Sở Tài nguyên & Môi trường
          </Title>
        </div>
        <Space size="large">
          <NotificationCenter />
          <Dropdown overlay={userMenu} trigger={['click']} placement="bottomRight">
            <Avatar
              style={{ 
                backgroundColor: '#1890ff', 
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
            description="Bạn đang truy cập hệ thống với quyền Sở Tài nguyên & Môi trường."
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
                    <AppstoreOutlined /> Quản lý thửa đất
                  </span>
                ),
                children: (
                  <Card bordered={false} style={{ padding: 0 }}>
                    <LandManagementPage />
                  </Card>
                )
              },
              {
                key: 'document',
                label: (
                  <span>
                    <FileTextOutlined /> Quản lý tài liệu
                  </span>
                ),
                children: (
                  <Card bordered={false} style={{ padding: 0 }}>
                    <DocumentManagementPage />
                  </Card>
                )
              },
              {
                key: 'transaction',
                label: (
                  <span>
                    <FileTextOutlined /> Quản lý giao dịch
                  </span>
                ),
                children: (
                  <Card bordered={false} style={{ padding: 0 }}>
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

export default Org1Dashboard;