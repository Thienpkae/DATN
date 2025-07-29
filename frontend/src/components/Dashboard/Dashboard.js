import React from 'react';
import { Layout, Typography } from 'antd';

const { Content } = Layout;
const { Title } = Typography;

const Dashboard = ({ user, onLogout }) => {
  return (
    <Layout>
      <Content style={{ padding: '50px' }}>
        <Title level={2}>Welcome to Land Registry System</Title>
        <p>User: {user.userId}</p>
        <p>Organization: {user.org}</p>
      </Content>
    </Layout>
  );
};

export default Dashboard;
