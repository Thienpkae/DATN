import React from 'react';
import DashboardRouter from '../Dashboard/DashboardRouter';

const Org1Dashboard = ({ user, onLogout }) => {
  return <DashboardRouter user={user} onLogout={onLogout} />;
};

export default Org1Dashboard;