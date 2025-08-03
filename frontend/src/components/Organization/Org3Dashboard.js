import React from 'react';
import DashboardRouter from '../Dashboard/DashboardRouter';

const Org3Dashboard = ({ user, onLogout }) => {
  return <DashboardRouter user={user} onLogout={onLogout} />;
};

export default Org3Dashboard;