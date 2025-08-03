import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, ConfigProvider, App as AntApp } from 'antd';

// Critical components (loaded immediately)
import LoadingSpinner from './components/Common/LoadingSpinner';
import ErrorBoundary from './components/Common/ErrorBoundary';

// Direct imports for production
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import VerifyOTP from './components/Auth/VerifyOTP';
import AdminAccountPage from './components/Admin/AdminAccountPage';
import EnhancedDashboard from './components/Common/EnhancedDashboard';
import Org1Dashboard from './components/Organization/Org1Dashboard';
import Org2Dashboard from './components/Organization/Org2Dashboard';
import Org3Dashboard from './components/Organization/Org3Dashboard';

// Services
import { getAuthToken, removeAuthToken } from './services/auth';

// Removed performance utilities for production

// Styles
import './styles/global.css';
import './styles/organization-pages.css';
import { getAntTheme, generateCSSCustomProperties } from './styles/theme';

const { Content } = Layout;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Removed performance monitoring for production

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = getAuthToken();
        if (token && token !== 'null' && token !== 'undefined') {
          try {
            // Try to parse the token
            const payload = JSON.parse(atob(token.split('.')[1]));
            
            // Check if token is expired
            const currentTime = Date.now() / 1000;
            if (payload.exp && payload.exp < currentTime) {
              console.log('Token expired');
              removeAuthToken();
              setUser(null);
            } else {
              // Ensure userId is properly set with fallback
              const userId = payload.cccd || payload.userId || payload.sub || payload.id || payload.user_id;
              const org = payload.org || payload.organization;
              const role = payload.role || 'user';
              
              if (userId && org) {
                setUser({
                  userId: String(userId), // Ensure it's a string
                  org: String(org),
                  role: String(role),
                  token: token
                });
              } else {
                console.error('Invalid token payload - missing required fields:', payload);
                removeAuthToken();
                setUser(null);
              }
            }
          } catch (error) {
            console.error('Invalid token format:', error);
            removeAuthToken();
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
      } finally {
        setLoading(false);
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = (userData) => {
    console.log('Login successful:', userData);
    
    // Validate userData before setting
    if (userData && userData.userId && userData.org) {
      const validatedUser = {
        userId: String(userData.userId),
        org: String(userData.org),
        role: String(userData.role || 'user'),
        token: userData.token
      };
      setUser(validatedUser);
    } else {
      console.error('Invalid user data received:', userData);
    }
  };

  const handleLogout = () => {
    setUser(null);
    removeAuthToken();
  };

  // Show loading spinner while checking authentication
  if (loading || !authChecked) {
    return <LoadingSpinner overlay text="Initializing Land Registry System..." size="large" />;
  }

  const getDashboardComponent = () => {
    if (!user || !user.userId || !user.org) {
      console.error('Invalid user data for dashboard:', user);
      return null;
    }

    const org = user.org.toLowerCase();
    switch (org) {
      case 'org1':
        return <Org1Dashboard user={user} onLogout={handleLogout} />;
      case 'org2':
        return <Org2Dashboard user={user} onLogout={handleLogout} />;
      case 'org3':
        return <Org3Dashboard user={user} onLogout={handleLogout} />;
      default:
        return <EnhancedDashboard user={user} onLogout={handleLogout} />;
    }
  };

  const isAdmin = () => {
    return user && (user.role === 'admin' || user.role === 'super_admin');
  };

  // Enhanced Ant Design theme configuration
  const getOrganization = () => {
    if (!user?.org) return 'org1';
    return user.org.toLowerCase();
  };

  const themeConfig = getAntTheme(getOrganization());

  // Generate CSS custom properties for the current organization
  const customProperties = generateCSSCustomProperties(getOrganization());

  return (
    <ErrorBoundary>
      <div style={customProperties}>
        <ConfigProvider theme={themeConfig}>
          <AntApp>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
                      user && isAdmin() ? (
                        <AdminAccountPage user={user} onLogout={handleLogout} />
                      ) : (
                        <Navigate to={user ? "/" : "/login"} replace />
                      )
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
                    element={<Navigate to={user ? "/" : "/login"} replace />} 
                  />
                </Routes>
                </Content>
              </Layout>
            </Router>
          </AntApp>
        </ConfigProvider>
      </div>
    </ErrorBoundary>
  );
}

export default App;