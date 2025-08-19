import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Badge,
  Dropdown,
  List,
  Typography,
  Button,
  Space,
  Tag,
  Empty,
  Spin,
  message,
  Tooltip
} from 'antd';
import { theme } from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  FileTextOutlined,
  TransactionOutlined,
  HomeOutlined
} from '@ant-design/icons';
import notificationService from '../../services/notification';
import { useAuth } from '../../hooks/useAuth';

const { Text, Title } = Typography;

/**
 * Notification Center Component
 * Displays real-time notifications and manages notification state
 */
const NotificationCenter = () => {
  const { user } = useAuth();
  const { token } = theme.useToken();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    if (user?.cccd) {
      const init = async () => {
        try {
          setLoading(true);
          
          // Get initial notifications
          await fetchNotifications();
          
          // Initialize WebSocket for real-time notifications
          functionsRef.current.initializeWebSocket();
          
        } catch (error) {
          console.error('Error initializing notifications:', error);
          message.error('Không thể khởi tạo thông báo');
        } finally {
          setLoading(false);
        }
      };

      init();
    }
    return () => {
      if (wsRef.current) {
        notificationService.closeWebSocket();
      }
    };
  }, [user?.cccd]);



  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getUserNotifications();
      if (response.success) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.pagination?.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleWebSocketMessage = useCallback((data) => {
    const type = (data?.type || '').toUpperCase();
    if (type === 'CONNECTION_ESTABLISHED') {
      setWsConnected(true);
      return;
    }
    if (type === 'NOTIFICATION' && data.data) {
      const notif = data.data;
      setNotifications(prev => [notif, ...prev]);
      setUnreadCount(prev => prev + 1);
      message.info(notif.message);
      return;
    }
    if (type === 'UNREADCOUNT' && typeof data.count === 'number') {
      setUnreadCount(data.count);
      return;
    }
  }, []);

  const handleWebSocketError = useCallback((error) => {
    console.error('WebSocket error:', error);
    setWsConnected(false);
  }, []);

  const handleWebSocketClose = useCallback((event) => {
    console.log('WebSocket closed:', event);
    setWsConnected(false);
    
    // Attempt to reconnect after a delay
    setTimeout(() => {
      if (user?.cccd) {
        functionsRef.current.initializeWebSocket();
      }
    }, 5000);
  }, [user?.cccd]);

  const initializeWebSocket = useCallback(() => {
    if (!user?.cccd) return;

    notificationService.initializeWebSocket(
      user.cccd,
      handleWebSocketMessage,
      handleWebSocketError,
      handleWebSocketClose
    );
    wsRef.current = true;
  }, [user?.cccd, handleWebSocketMessage, handleWebSocketError, handleWebSocketClose]);

  // Store functions in refs to avoid dependency issues
  const functionsRef = useRef({
    initializeWebSocket,
    handleWebSocketMessage,
    handleWebSocketError,
    handleWebSocketClose
  });

  // Update refs when functions change
  useEffect(() => {
    functionsRef.current = {
      initializeWebSocket,
      handleWebSocketMessage,
      handleWebSocketError,
      handleWebSocketClose
    };
  }, [initializeWebSocket, handleWebSocketMessage, handleWebSocketError, handleWebSocketClose]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      message.success('Đã đánh dấu thông báo là đã đọc');
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
      message.error('Không thể đánh dấu thông báo');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      
      setUnreadCount(0);
      message.success('Đã đánh dấu tất cả thông báo là đã đọc');
      
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      message.error('Không thể đánh dấu tất cả thông báo');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'TRANSACTION_CREATED':
      case 'TRANSFER_REQUEST_CREATED':
      case 'TRANSFER_REQUEST_RECEIVED':
      case 'TRANSFER_CONFIRMED':
        return <TransactionOutlined style={{ color: '#1890ff' }} />;
      
      case 'LAND_PARCEL_CREATED':
      case 'LAND_CERTIFICATE_ISSUED':
        return <HomeOutlined style={{ color: '#52c41a' }} />;
      
      case 'DOCUMENT_CREATED':
      case 'DOCUMENT_VERIFICATION':
        return <FileTextOutlined style={{ color: '#722ed1' }} />;
      
      case 'USER_PROFILE_UPDATED':
      case 'PASSWORD_CHANGED':
        return <FileTextOutlined style={{ color: '#13c2c2' }} />;
      
      default:
        return <BellOutlined style={{ color: '#faad14' }} />;
    }
  };

  const getNotificationPriority = (priority) => {
    const priorityConfig = {
      'HIGH': { color: '#ff4d4f', text: 'Cao' },
      'MEDIUM': { color: '#faad14', text: 'Trung bình' },
      'LOW': { color: '#52c41a', text: 'Thấp' }
    };
    
    const config = priorityConfig[priority] || priorityConfig['MEDIUM'];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getNotificationTime = (createdAt) => {
    if (!createdAt) return 'Vừa xong';
    
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return created.toLocaleDateString('vi-VN');
  };

  const notificationMenu = (
    <div
      style={{
        width: 400,
        maxHeight: 500,
        overflow: 'auto',
        background: token.colorBgElevated,
        color: token.colorText,
        borderRadius: token.borderRadiusLG,
        boxShadow: token.boxShadowSecondary
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorBgElevated
        }}
      >
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={5} style={{ margin: 0, color: token.colorTextHeading }}>
            <BellOutlined style={{ color: token.colorPrimary }} /> Thông báo
          </Title>
          <Space>
            {unreadCount > 0 && (
              <Button
                type="link"
                size="small"
                onClick={handleMarkAllAsRead}
                style={{ color: token.colorTextSecondary }}
              >
                Đánh dấu tất cả đã đọc
              </Button>
            )}
            <Button
              type="link"
              size="small"
              onClick={() => window.location.href = '/notifications'}
              style={{ color: token.colorPrimary }}
            >
              Xem tất cả
            </Button>
          </Space>
        </Space>
      </div>

      <div style={{ padding: '8px 0', background: token.colorBgElevated }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin />
          </div>
        ) : notifications.length === 0 ? (
          <Empty
            description="Không có thông báo nào"
            style={{ padding: '20px', background: 'transparent' }}
          />
        ) : (
          <List
            dataSource={notifications.slice(0, 10)}
            renderItem={(notification) => (
              <List.Item
                style={{
                  padding: '12px 16px',
                  backgroundColor: notification.read ? 'transparent' : token.colorPrimaryBg,
                  borderBottom: `1px solid ${token.colorBorderSecondary}`
                }}
                actions={[
                  !notification.read && (
                    <Tooltip title="Đánh dấu đã đọc">
                      <Button
                        type="text"
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={() => handleMarkAsRead(notification._id)}
                        style={{ color: token.colorTextSecondary }}
                      />
                    </Tooltip>
                  )
                ]}
              >
                <List.Item.Meta
                  avatar={getNotificationIcon(notification.type)}
                  title={
                    <Space>
                      <Text strong style={{ fontSize: '14px', color: token.colorText }}>
                        {notification.title}
                      </Text>
                      {getNotificationPriority(notification.priority)}
                      {!notification.read && (
                        <Badge status="processing" size="small" />
                      )}
                    </Space>
                  }
                  description={
                    <div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {notification.message}
                      </Text>
                      <div style={{ marginTop: '4px' }}>
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          {getNotificationTime(notification.createdAt)}
                        </Text>
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>

      {notifications.length > 10 && (
        <div
          style={{
            padding: '12px 16px',
            borderTop: `1px solid ${token.colorBorderSecondary}`,
            textAlign: 'center',
            background: token.colorBgElevated
          }}
        >
          <Button
            type="link"
            onClick={() => window.location.href = '/notifications'}
            style={{ color: token.colorPrimary }}
          >
            Xem thêm {notifications.length - 10} thông báo khác
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Dropdown 
      overlay={notificationMenu} 
      trigger={['click']} 
      placement="bottomRight"
      overlayStyle={{ zIndex: 1000 }}
    >
      <Badge count={unreadCount} size="small" offset={[-5, 5]}>
        <Button
          type="text"
          icon={<BellOutlined />}
          style={{
            fontSize: '18px',
            color: wsConnected ? token.colorPrimary : token.colorTextTertiary
          }}
          title={wsConnected ? 'Thông báo (Đã kết nối)' : 'Thông báo (Đang kết nối...)'}
        />
      </Badge>
    </Dropdown>
  );
};

export default NotificationCenter;
