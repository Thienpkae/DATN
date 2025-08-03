import React from 'react';
import DashboardRouter from '../Dashboard/DashboardRouter';

const Org2Dashboard = ({ user, onLogout }) => {
  return <DashboardRouter user={user} onLogout={onLogout} />;
};

export default Org2Dashboard;
