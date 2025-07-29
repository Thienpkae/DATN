import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, message } from 'antd';

// Components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import VerifyOTP from './components/Auth/VerifyOTP';
import Dashboard from './components/Dashboard/Dashboard';
import Org1Dashboard from './components/Organization/Org1Dashboard';
import Org2Dashboard from './components/Organization/Org2Dashboard';
import Org3Dashboard from './components/Organization/Org3Dashboard';
import AdminAccountPage from './components/Admin/AdminAccountPage';

// Services
import { getAuthToken, removeAuthToken } from './services/auth';

const { Content } = Layout;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          userId: payload.userId,
          org: payload.org,
          role: payload.role,
          token: token
        });
      } catch (error) {
        console.error('Invalid token:', error);
        removeAuthToken();
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    message.success('Login successful!');
  };

  const handleLogout = () => {
    setUser(null);
    removeAuthToken();
    message.success('Logged out successfully!');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const getDashboardComponent = () => {
    if (!user) return null;
    
    switch (user.org) {
      case 'Org1':
      case 'org1':
        return <Org1Dashboard user={user} onLogout={handleLogout} />;
      case 'Org2':
      case 'org2':
        return <Org2Dashboard user={user} onLogout={handleLogout} />;
      case 'Org3':
      case 'org3':
        return <Org3Dashboard user={user} onLogout={handleLogout} />;
      default:
        return <Dashboard user={user} onLogout={handleLogout} />;
    }
  };

  const isAdmin = () => {
    return user && (user.role === 'admin' || user.role === 'super_admin');
  };

  return (
    <Router>
      <Layout className="full-height">
        <Content>
          <Routes>
            <Route 
              path="/login" 
              element={
                user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />
              } 
            />
            <Route 
              path="/register" 
              element={
                user ? <Navigate to="/" replace /> : <Register />
              } 
            />
            <Route 
              path="/verify-otp" 
              element={
                user ? <Navigate to="/" replace /> : <VerifyOTP />
              } 
            />
            <Route 
              path="/admin/accounts" 
              element={
                user && isAdmin() ? <AdminAccountPage user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />
              } 
            />
            <Route 
              path="/" 
              element={
                user ? getDashboardComponent() : <Navigate to="/login" replace />
              } 
            />
            <Route 
              path="*" 
              element={<Navigate to="/" replace />} 
            />
          </Routes>
        </Content>
      </Layout>
    </Router>
  );
}

export default App;
