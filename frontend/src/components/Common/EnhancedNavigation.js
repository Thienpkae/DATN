import React, { useState, useRef, useEffect } from 'react';
import {
  Breadcrumb,
  Dropdown,
  Button,
  Space,
  Badge,
  Avatar,
  Tooltip,
  Input,
  AutoComplete
} from 'antd';
import {
  HomeOutlined,
  SettingOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  ProfileOutlined,
  QuestionCircleOutlined,
  GlobalOutlined
} from '@ant-design/icons';

const { Search } = Input;

const EnhancedNavigation = ({ 
  user, 
  onLogout, 
  collapsed, 
  onToggleCollapse,
  currentPath = [],
  onSearch,
  notifications = []
}) => {
  const [searchOptions, setSearchOptions] = useState([]);
  const [searchValue, setSearchValue] = useState('');

  // Dynamic search suggestions from backend
  const searchTimeoutRef = useRef();
  const getSearchSuggestions = async (value) => {
    if (!value) return [];
    try {
      const org = user.org;
      // Replace with your actual API endpoint
      const response = await fetch(`/api/search/suggestions?org=${org}&q=${encodeURIComponent(value)}`);
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      const data = await response.json();
      return (Array.isArray(data) ? data : []).map(item => ({ value: item, label: item }));
    } catch (err) {
      // Optionally handle error
      return [];
    }
  };

  const handleSearch = (value) => {
    setSearchValue(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleSearchChange = (value) => {
    setSearchValue(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      const suggestions = await getSearchSuggestions(value);
      setSearchOptions(suggestions);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  // User menu items
  // Replace with your navigation logic (e.g., react-router)
  const navigate = (path) => {
    window.location.href = path;
  };
  const userMenuItems = [
    {
      key: 'profile',
      label: 'My Profile',
      icon: <ProfileOutlined />, 
      onClick: () => navigate('/profile')
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: <SettingOutlined />, 
      onClick: () => navigate('/settings')
    },
    {
      key: 'help',
      label: 'Help & Support',
      icon: <QuestionCircleOutlined />, 
      onClick: () => navigate('/help')
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      label: 'Sign Out',
      icon: <LogoutOutlined />, 
      onClick: onLogout,
      danger: true
    }
  ];

  // Notification menu items
  const notificationMenuItems = notifications.length > 0 ? [
    ...notifications.slice(0, 5).map((notification, index) => ({
      key: `notification-${index}`,
      label: (
        <div style={{ maxWidth: '300px', padding: '8px 0' }}>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>
            {notification.title}
          </div>
          <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>
            {notification.message}
          </div>
          <div style={{ fontSize: '11px', color: '#bfbfbf' }}>
            {notification.time}
          </div>
        </div>
      ),
      onClick: () => console.log('Notification clicked', notification.id)
    })),
    {
      type: 'divider'
    },
    {
      key: 'view-all',
      label: 'View All Notifications',
      onClick: () => console.log('View all notifications')
    }
  ] : [
    {
      key: 'no-notifications',
      label: 'No new notifications',
      disabled: true
    }
  ];

  // Generate breadcrumb items
  const getBreadcrumbItems = () => {
    const items = [
      {
        title: (
          <Space>
            <HomeOutlined />
            <span>Dashboard</span>
          </Space>
        ),
        href: '/'
      }
    ];

    currentPath.forEach((path, index) => {
      items.push({
        title: path.title,
        href: index === currentPath.length - 1 ? undefined : path.href
      });
    });

    return items;
  };

  const getOrgColor = () => {
    switch (user.org?.toLowerCase()) {
      case 'org1': return '#1890ff';
      case 'org2': return '#52c41a';
      case 'org3': return '#fa8c16';
      default: return '#1890ff';
    }
  };

  const getOrgName = () => {
    switch (user.org?.toLowerCase()) {
      case 'org1': return 'Land Authority';
      case 'org2': return 'Government Officers';
      case 'org3': return 'Citizens Portal';
      default: return 'Land Registry';
    }
  };

  return (
    <div style={{
      background: `linear-gradient(135deg, ${getOrgColor()} 0%, ${getOrgColor()}dd 100%)`,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      borderBottom: 'none',
      padding: '0 24px',
      position: 'fixed',
      top: 0,
      right: 0,
      left: collapsed ? 80 : 280,
      zIndex: 999,
      transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      height: '72px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      {/* Left Section */}
      <Space style={{ alignItems: 'center' }}>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggleCollapse}
          style={{
            fontSize: '18px',
            width: '44px',
            height: '44px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
        
        <div style={{ height: '32px', width: '1px', background: 'rgba(255, 255, 255, 0.2)' }} />
        
        {/* Breadcrumb */}
        <Breadcrumb
          items={getBreadcrumbItems()}
          style={{ 
            color: 'white',
            fontSize: '14px'
          }}
          itemRender={(route, params, routes, paths) => {
            const isLast = routes.indexOf(route) === routes.length - 1;
            return isLast ? (
              <span style={{ color: 'white', fontWeight: 600 }}>
                {route.title}
              </span>
            ) : (
              <a 
                href={route.href} 
                style={{ 
                  color: 'rgba(255, 255, 255, 0.8)',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => e.target.style.color = 'white'}
                onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.8)'}
              >
                {route.title}
              </a>
            );
          }}
        />
      </Space>

      {/* Center Section - Search */}
      <div style={{ flex: 1, maxWidth: '400px', margin: '0 24px' }}>
        <AutoComplete
          options={searchOptions}
          onSearch={handleSearchChange}
          onSelect={handleSearch}
          value={searchValue}
          style={{ width: '100%' }}
        >
          <Search
            placeholder="Search land parcels, certificates, transactions..."
            allowClear
            onSearch={handleSearch}
            style={{
              borderRadius: '20px'
            }}
            size="large"
          />
        </AutoComplete>
      </div>

      {/* Right Section */}
      <Space style={{ alignItems: 'center' }}>
        {/* Language Selector */}
        <Tooltip title="Language" placement="bottom">
          <Button
            type="text"
            icon={<GlobalOutlined />}
            style={{
              color: 'white',
              fontSize: '18px',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          />
        </Tooltip>

        {/* Notifications */}
        <Tooltip title="Notifications" placement="bottom">
          <Dropdown
            menu={{ items: notificationMenuItems }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              type="text"
              style={{
                color: 'white',
                fontSize: '18px',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Badge count={notifications.length} size="small">
                <BellOutlined style={{ color: 'white' }} />
              </Badge>
            </Button>
          </Dropdown>
        </Tooltip>

        {/* User Profile */}
        <Dropdown
          menu={{ items: userMenuItems }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Space style={{ cursor: 'pointer', padding: '8px 12px', borderRadius: '8px' }}>
            <Avatar 
              size={40}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                fontWeight: 600
              }}
            >
              {user.userId ? user.userId.charAt(0).toUpperCase() : 
               user.cccd ? user.cccd.charAt(0).toUpperCase() : "U"}
            </Avatar>
            <div style={{ color: 'white', textAlign: 'left' }}>
              <div style={{ fontWeight: 600, fontSize: '14px', lineHeight: '18px' }}>
                {user.userId || user.cccd || 'User'}
              </div>
              <div style={{ opacity: 0.9, fontSize: '12px', lineHeight: '16px' }}>
                {getOrgName()} • {user.role || 'User'}
              </div>
            </div>
          </Space>
        </Dropdown>
      </Space>
    </div>
  );
};

export default EnhancedNavigation;