import React, { useState, useEffect, useCallback } from 'react';
import { Layout, message } from 'antd';
import EnhancedSidebar from './EnhancedSidebar';
import EnhancedNavigation from './EnhancedNavigation';
import EnhancedDashboard from './EnhancedDashboard';
import LandParcelManagement from '../LandParcel/LandParcelManagement';
import CertificateManagement from '../Certificate/CertificateManagement';
import TransactionManagement from '../Transaction/TransactionManagement';
import DocumentManagement from '../Document/DocumentManagement';
import UserManagement from '../User/UserManagement';
import Reports from '../Reports/Reports';
import AdminAccountPage from '../Admin/AdminAccountPage';
import IPFSFileUpload from './IPFSFileUpload';
import MyLandParcels from '../LandParcel/MyLandParcels';
import MyTransactions from '../Transaction/MyTransactions';
import MyCertificates from '../Certificate/MyCertificates';
import MyDocuments from '../Document/MyDocuments';

const { Content } = Layout;

const EnhancedLayout = ({ user, onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState('dashboard');
  const [notifications, setNotifications] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);

  // Mock notifications - in real app, this would come from WebSocket or API
  useEffect(() => {
    const mockNotifications = [
      {
        id: 1,
        type: 'warning',
        title: 'Pending Approvals',
        message: 'You have 3 transactions waiting for approval',
        time: '1 hour ago'
      },
      {
        id: 2,
        type: 'info',
        title: 'System Update',
        message: 'New features available in the dashboard',
        time: '3 hours ago'
      },
      {
        id: 3,
        type: 'success',
        title: 'Monthly Report',
        message: 'Your monthly activity report is ready',
        time: '1 day ago'
      }
    ];

    setNotifications(mockNotifications);
    setPendingCount(user.org === 'Org3' ? 2 : 5); // Mock pending count
  }, [user.org]);

  const handleMenuSelect = useCallback((key) => {
    setSelectedKey(key);
    updateBreadcrumb(key);
  }, []);

  const updateBreadcrumb = (key) => {
    // Breadcrumb logic can be implemented here if needed
    console.log('Selected menu:', key);
  };

  const handleSearch = (value) => {
    console.log('Search:', value);
    // Implement search functionality
    message.info(`Searching for: ${value}`);
  };

  const renderContent = useCallback(() => {
    try {
      switch (selectedKey) {
        case 'dashboard':
          return <EnhancedDashboard user={user} />;
        
        // Org1 specific routes
        case 'land-parcels':
          return user.org === 'Org3' ? 
            <MyLandParcels user={user} /> : 
            <LandParcelManagement user={user} />;
        
        case 'certificates':
          return user.org === 'Org3' ? 
            <MyCertificates user={user} /> : 
            <CertificateManagement user={user} />;
        
        case 'transactions':
          return user.org === 'Org3' ? 
            <MyTransactions user={user} /> : 
            <TransactionManagement user={user} />;
        
        case 'documents':
          return user.org === 'Org3' ? 
            <MyDocuments user={user} /> : 
            <DocumentManagement user={user} />;
        
        case 'users':
          return <UserManagement user={user} />;
        
        case 'reports':
          return <Reports user={user} />;
        
        case 'account-management':
          return <AdminAccountPage user={user} />;
        
        case 'ipfs-storage':
          return <IPFSFileUpload />;
        
        // Org2 specific routes
        case 'pending-requests':
          return <TransactionManagement user={user} filter="pending" />;
        
        case 'verification-queue':
          return <DocumentManagement user={user} filter="unverified" />;
        
        case 'processing-queue':
          return <TransactionManagement user={user} filter="processing" />;
        
        // Org3 specific routes
        case 'my-properties':
          return <MyLandParcels user={user} />;
        
        case 'transfer-request':
          return <TransactionManagement user={user} type="transfer" />;
        
        case 'split-request':
          return <TransactionManagement user={user} type="split" />;
        
        case 'merge-request':
          return <TransactionManagement user={user} type="merge" />;
        
        case 'purpose-change':
          return <TransactionManagement user={user} type="purpose-change" />;
        
        case 'support':
          return (
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <h2>Help & Support</h2>
              <p>Contact our support team for assistance with your land registry needs.</p>
            </div>
          );
        
        default:
          return <EnhancedDashboard user={user} />;
      }
    } catch (error) {
      console.error('Error rendering content:', error);
      return (
        <div style={{ 
          padding: '24px', 
          textAlign: 'center',
          color: '#ff4d4f'
        }}>
          <h3>Error Loading Content</h3>
          <p>Please try refreshing the page or contact support if the problem persists.</p>
        </div>
      );
    }
  }, [selectedKey, user]);

  const getPageTitle = useCallback(() => {
    const titleMap = {
      'dashboard': 'Dashboard',
      'land-parcels': user.org === 'Org3' ? 'My Land Parcels' : 'Land Parcels',
      'certificates': user.org === 'Org3' ? 'My Certificates' : 'Certificates',
      'transactions': user.org === 'Org3' ? 'My Transactions' : 'Transactions',
      'documents': user.org === 'Org3' ? 'My Documents' : 'Documents',
      'users': 'User Management',
      'reports': 'Reports & Analytics',
      'account-management': 'Account Management',
      'ipfs-storage': 'IPFS Storage',
      'pending-requests': 'Pending Requests',
      'verification-queue': 'Verification Queue',
      'processing-queue': 'Processing Queue',
      'my-properties': 'My Properties',
      'transfer-request': 'Transfer Request',
      'split-request': 'Split Request',
      'merge-request': 'Merge Request',
      'purpose-change': 'Purpose Change',
      'support': 'Help & Support'
    };

    return titleMap[selectedKey] || 'Dashboard';
  }, [selectedKey, user.org]);

  return (
    <div style={{ 
      '--primary-color': user.org === 'Org1' ? '#1890ff' : 
                         user.org === 'Org2' ? '#52c41a' : '#fa8c16',
      '--primary-dark': user.org === 'Org1' ? '#0050b3' : 
                        user.org === 'Org2' ? '#389e0d' : '#d46b08',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
        {/* Enhanced Sidebar */}
        <EnhancedSidebar
          collapsed={collapsed}
          onCollapse={setCollapsed}
          selectedKey={selectedKey}
          onMenuSelect={handleMenuSelect}
          user={user}
          pendingCount={pendingCount}
        />

        <Layout style={{ 
          marginLeft: collapsed ? 80 : 280, 
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '100vh'
        }}>
          {/* Enhanced Navigation */}
          <EnhancedNavigation
            user={user}
            onLogout={onLogout}
            collapsed={collapsed}
            onToggleCollapse={setCollapsed}
            currentPath={[{ title: getPageTitle() }]}
            onSearch={handleSearch}
            notifications={notifications}
          />

          {/* Main Content */}
          <Content style={{ 
            margin: '88px 24px 24px 24px', 
            overflow: 'auto',
            background: 'linear-gradient(135deg, #f0f2f5 0%, #f8f9fa 100%)'
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
              border: '1px solid #f0f0f0',
              minHeight: 'calc(100vh - 136px)',
              position: 'relative'
            }}>
              {renderContent()}
            </div>
          </Content>
        </Layout>
      </Layout>
    </div>
  );
};

export default EnhancedLayout;