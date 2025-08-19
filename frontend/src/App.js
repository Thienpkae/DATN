import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, ConfigProvider, App as AntApp, Spin, Result, theme } from 'antd';

// Critical components (loaded immediately)
import ErrorBoundary from './components/Common/ErrorBoundary';

// Direct imports for production
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import VerifyOTP from './components/Auth/VerifyOTP';
import AdminAccountPage from './components/Admin/AdminAccountPage';
import Org1AdminPage from './components/Organization/Org1/Org1AdminPage';
import Org2AdminPage from './components/Organization/Org2/Org2AdminPage';
import Org3AdminPage from './components/Organization/Org3/Org3AdminPage';
import SystemConfigPage from './components/Admin/SystemConfigPage';
import LogsPage from './components/Admin/LogsPage';

// Organization Dashboards
import Org1Dashboard from './components/Organization/Org1/Org1Dashboard';
import Org2Dashboard from './components/Organization/Org2/Org2Dashboard';
import Org3Dashboard from './components/Organization/Org3/Org3Dashboard';

// Services
import authService from './services/auth';

// Styles
import './styles/global.css';

const { Content } = Layout;
const { useToken } = theme;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState(null);
  const { token: themeToken } = useToken();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = authService.getAuthToken();
        if (token && token !== 'null' && token !== 'undefined') {
          try {
            // Try to parse the token
            const payload = JSON.parse(atob(token.split('.')[1]));
            
            // Check if token is expired
            const currentTime = Date.now() / 1000;
            if (payload.exp && payload.exp < currentTime) {
              console.log('Token expired');
              authService.logout();
              setUser(null);
            } else {
              // Ensure userId is properly set with fallback
              const userId = payload.cccd || payload.userId || payload.sub || payload.id || payload.user_id;
              const org = payload.org || payload.organization;
              const role = payload.role || 'user';
              const name = payload.name || payload.username || 'User';
              
              if (userId && org) {
                setUser({
                  userId: String(userId), // Ensure it's a string
                  org: String(org),
                  role: String(role),
                  name: String(name),
                  token: token
                });
              } else {
                console.error('Invalid token payload - missing required fields:', payload);
                authService.logout();
                setUser(null);
              }
            }
          } catch (error) {
            console.error('Invalid token format:', error);
            authService.logout();
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setError('Authentication check failed. Please refresh the page.');
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
    
    // After successful login, get user data from localStorage
    // (set by authService.login)
    const user = authService.getCurrentUser();
    
    if (user && user.userId && user.org) {
      const validatedUser = {
        userId: String(user.userId),
        org: String(user.org),
        role: String(user.role || 'user'),
        name: String(user.name || user.username || 'User'),
        token: userData.token
      };
      
      setUser(validatedUser);
      setError(null); // Clear any previous errors
    } else {
      console.error('Invalid user data received:', userData);
      setError('Invalid user data received. Please try logging in again.');
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setError(null);
  };

  // Show error state
  if (error) {
    return (
      <ConfigProvider>
        <AntApp>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            background: themeToken.colorBgContainer
          }}>
            <Result
              status="error"
              title="Authentication Error"
              subTitle={error}
              extra={[
                <button 
                  key="refresh" 
                  onClick={() => window.location.reload()}
                  style={{
                    background: themeToken.colorPrimary,
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Refresh Page
                </button>
              ]}
            />
          </div>
        </AntApp>
      </ConfigProvider>
    );
  }

  // Show loading spinner while checking authentication
  if (loading || !authChecked) {
    return (
      <ConfigProvider>
        <AntApp>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            background: `linear-gradient(135deg, ${themeToken.colorPrimary} 0%, ${themeToken.colorPrimaryBg} 100%)`
          }}>
            <Spin 
              size="large" 
              indicator={
                <div style={{
                  width: '64px',
                  height: '64px',
                  border: `4px solid ${themeToken.colorPrimary}20`,
                  borderTop: `4px solid ${themeToken.colorPrimary}`,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              }
            />
            <div style={{ 
              marginTop: '24px', 
              fontSize: '18px',
              color: 'white',
              fontWeight: 500
            }}>
              Initializing Land Registry System...
            </div>
            <div style={{ 
              marginTop: '8px', 
              fontSize: '14px',
              color: 'rgba(255,255,255,0.8)'
            }}>
              Please wait while we set up your secure environment
            </div>
          </div>
        </AntApp>
      </ConfigProvider>
    );
  }

  const isAdmin = () => {
    return user && (user.role === 'admin' || user.role === 'super_admin');
  };

  return (
    <ErrorBoundary>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#1890ff',
            borderRadius: 8,
            wireframe: false,
          },
        }}
      >
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
                    path="/admin" 
                    element={
                      user && isAdmin() ? (
                        user.org === 'Org1' ? <Org1AdminPage /> :
                        user.org === 'Org2' ? <Org2AdminPage /> :
                        <Org3AdminPage />
                      ) : (
                        <Navigate to={user ? "/" : "/login"} replace />
                      )
                    }
                  />
                  <Route 
                    path="/admin/system-configs" 
                    element={
                      user && isAdmin() ? (
                        <SystemConfigPage />
                      ) : (
                        <Navigate to={user ? "/" : "/login"} replace />
                      )
                    }
                  />
                  <Route 
                    path="/admin/logs" 
                    element={
                      user && isAdmin() && user.org !== 'Org3' ? (
                        <LogsPage />
                      ) : (
                        <Navigate to={user ? "/" : "/login"} replace />
                      )
                    }
                  />
                  <Route 
                    path="/" 
                    element={
                      user ? (
                        user.org === 'Org1' ? <Org1Dashboard user={user} onLogout={handleLogout} /> :
                        user.org === 'Org2' ? <Org2Dashboard user={user} onLogout={handleLogout} /> :
                        user.org === 'Org3' ? <Org3Dashboard user={user} onLogout={handleLogout} /> :
                        <Navigate to="/login" replace />
                      ) : <Navigate to="/login" replace />
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
    </ErrorBoundary>
  );
}

export default App;
