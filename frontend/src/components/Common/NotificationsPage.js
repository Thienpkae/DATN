import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  List,
  Typography,
  Space,
  Button,
  Tag,
  Empty,
  Spin,
  message,
  Pagination,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
  Tooltip,
  Popconfirm
} from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  DeleteOutlined,
  FilterOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  TransactionOutlined,
  HomeOutlined
} from '@ant-design/icons';
import notificationService from '../../services/notification';
import { useAuth } from '../../hooks/useAuth';

const { Title, Text } = Typography;
const { Option } = Select;

/**
 * Notifications Page - Full page view of all notifications
 */
const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    priority: '',
    dateFrom: null,
    dateTo: null
  });
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    high: 0,
    medium: 0,
    low: 0
  });

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await notificationService.getUserNotifications({
        limit: pagination.pageSize,
        status: filters.status,
        page: pagination.current
      });
      
      if (response.success) {
        setNotifications(response.data.notifications || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      message.error('Không thể lấy danh sách thông báo');
    } finally {
      setLoading(false);
    }
  }, [pagination, filters]);

  const fetchStats = useCallback(async () => {
    try {
      const unreadCount = await notificationService.getUnreadCount();
      const allNotifications = await notificationService.getUserNotifications({ limit: 1000 });
      
      if (allNotifications.success) {
        const allNotifs = allNotifications.data.notifications || [];
        setStats({
          total: allNotifs.length,
          unread: unreadCount.data?.unreadCount || 0,
          high: allNotifs.filter(n => n.priority === 'HIGH').length,
          medium: allNotifs.filter(n => n.priority === 'MEDIUM').length,
          low: allNotifs.filter(n => n.priority === 'LOW').length
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    if (user?.cccd) {
      fetchNotifications();
      fetchStats();
    }
  }, [user?.cccd, fetchNotifications, fetchStats]);

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
      
      fetchStats(); // Refresh stats
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
      
      fetchStats(); // Refresh stats
      message.success('Đã đánh dấu tất cả thông báo là đã đọc');
      
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      message.error('Không thể đánh dấu tất cả thông báo');
    }
  };

  const handleArchiveNotification = async (notificationId) => {
    try {
      await notificationService.archiveNotification(notificationId);
      
      // Remove from local state
      setNotifications(prev => 
        prev.filter(notif => notif._id !== notificationId)
      );
      
      fetchStats(); // Refresh stats
      message.success('Đã lưu trữ thông báo');
      
    } catch (error) {
      console.error('Error archiving notification:', error);
      message.error('Không thể lưu trữ thông báo');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 })); // Reset to first page
  };

  const handleResetFilters = () => {
    setFilters({
      status: '',
      type: '',
      priority: '',
      dateFrom: null,
      dateTo: null
    });
    setPagination(prev => ({ ...prev, current: 1 }));
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
        return <InfoCircleOutlined style={{ color: '#13c2c2' }} />;
      
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

  const getNotificationTypeText = (type) => {
    const typeTexts = {
      'TRANSACTION_CREATED': 'Giao dịch mới',
      'TRANSFER_REQUEST_CREATED': 'Yêu cầu chuyển nhượng',
      'TRANSFER_REQUEST_RECEIVED': 'Nhận yêu cầu chuyển nhượng',
      'TRANSFER_CONFIRMED': 'Xác nhận chuyển nhượng',
      'LAND_PARCEL_CREATED': 'Thửa đất mới',
      'LAND_CERTIFICATE_ISSUED': 'Cấp giấy chứng nhận',
      'DOCUMENT_CREATED': 'Tài liệu mới',
      'DOCUMENT_VERIFICATION': 'Xác thực tài liệu',
      'USER_PROFILE_UPDATED': 'Cập nhật hồ sơ',
      'PASSWORD_CHANGED': 'Thay đổi mật khẩu'
    };
    return typeTexts[type] || type;
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <BellOutlined /> Quản lý Thông báo
      </Title>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="Tổng số thông báo"
              value={stats.total}
              prefix={<BellOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Chưa đọc"
              value={stats.unread}
              valueStyle={{ color: '#faad14' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Độ ưu tiên cao"
              value={stats.high}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Độ ưu tiên trung bình"
              value={stats.medium}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Độ ưu tiên thấp"
              value={stats.low}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16} align="middle">
          <Col span={4}>
            <Text strong>Trạng thái:</Text>
            <Select
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              placeholder="Tất cả trạng thái"
              style={{ width: '100%', marginTop: '8px' }}
            >
              <Option value="">Tất cả</Option>
              <Option value="unread">Chưa đọc</Option>
              <Option value="read">Đã đọc</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Text strong>Loại thông báo:</Text>
            <Select
              value={filters.type}
              onChange={(value) => handleFilterChange('type', value)}
              placeholder="Tất cả loại"
              style={{ width: '100%', marginTop: '8px' }}
            >
              <Option value="">Tất cả</Option>
              <Option value="TRANSACTION_CREATED">Giao dịch</Option>
              <Option value="LAND_PARCEL_CREATED">Thửa đất</Option>
              <Option value="DOCUMENT_CREATED">Tài liệu</Option>
              <Option value="USER_PROFILE_UPDATED">Hồ sơ</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Text strong>Độ ưu tiên:</Text>
            <Select
              value={filters.priority}
              onChange={(value) => handleFilterChange('priority', value)}
              placeholder="Tất cả độ ưu tiên"
              style={{ width: '100%', marginTop: '8px' }}
            >
              <Option value="">Tất cả</Option>
              <Option value="HIGH">Cao</Option>
              <Option value="MEDIUM">Trung bình</Option>
              <Option value="LOW">Thấp</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Text strong>Từ ngày:</Text>
            <DatePicker
              value={filters.dateFrom}
              onChange={(date) => handleFilterChange('dateFrom', date)}
              style={{ width: '100%', marginTop: '8px' }}
              placeholder="Chọn ngày"
            />
          </Col>
          <Col span={4}>
            <Text strong>Đến ngày:</Text>
            <DatePicker
              value={filters.dateTo}
              onChange={(date) => handleFilterChange('dateTo', date)}
              style={{ width: '100%', marginTop: '8px' }}
              placeholder="Chọn ngày"
            />
          </Col>
          <Col span={4}>
            <Space style={{ marginTop: '32px' }}>
              <Button 
                icon={<FilterOutlined />} 
                type="primary"
                onClick={fetchNotifications}
              >
                Lọc
              </Button>
              <Button 
                icon={<ReloadOutlined />}
                onClick={handleResetFilters}
              >
                Đặt lại
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Actions */}
      <div style={{ marginBottom: '16px', textAlign: 'right' }}>
        <Space>
          {stats.unread > 0 && (
            <Button 
              icon={<CheckOutlined />}
              onClick={handleMarkAllAsRead}
            >
              Đánh dấu tất cả đã đọc
            </Button>
          )}
          <Button 
            icon={<ReloadOutlined />}
            onClick={fetchNotifications}
            loading={loading}
          >
            Làm mới
          </Button>
        </Space>
      </div>

      {/* Notifications List */}
      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : notifications.length === 0 ? (
          <Empty 
            description="Không có thông báo nào"
            style={{ padding: '40px' }}
          />
        ) : (
          <>
            <List
              dataSource={notifications}
              renderItem={(notification) => (
                <List.Item
                  style={{
                    padding: '16px',
                    backgroundColor: notification.read ? 'transparent' : '#f6ffed',
                    borderBottom: '1px solid #f0f0f0',
                    marginBottom: '8px',
                    borderRadius: '6px'
                  }}
                  actions={[
                    !notification.read && (
                      <Tooltip title="Đánh dấu đã đọc">
                        <Button
                          type="text"
                          size="small"
                          icon={<CheckOutlined />}
                          onClick={() => handleMarkAsRead(notification._id)}
                        >
                          Đã đọc
                        </Button>
                      </Tooltip>
                    ),
                    <Tooltip title="Lưu trữ">
                      <Popconfirm
                        title="Bạn có chắc muốn lưu trữ thông báo này?"
                        onConfirm={() => handleArchiveNotification(notification._id)}
                        okText="Có"
                        cancelText="Không"
                      >
                        <Button
                          type="text"
                          size="small"
                          icon={<DeleteOutlined />}
                          danger
                        >
                          Lưu trữ
                        </Button>
                      </Popconfirm>
                    </Tooltip>
                  ]}
                >
                  <List.Item.Meta
                    avatar={getNotificationIcon(notification.type)}
                    title={
                      <Space>
                        <Text strong style={{ fontSize: '16px' }}>
                          {notification.title}
                        </Text>
                        {getNotificationPriority(notification.priority)}
                        {!notification.read && (
                          <Tag color="processing">Chưa đọc</Tag>
                        )}
                      </Space>
                    }
                    description={
                      <div>
                        <Text type="secondary" style={{ fontSize: '14px' }}>
                          {notification.message}
                        </Text>
                        <div style={{ marginTop: '8px' }}>
                          <Space>
                            <Tag color="blue">
                              {getNotificationTypeText(notification.type)}
                            </Tag>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {getNotificationTime(notification.createdAt)}
                            </Text>
                          </Space>
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />

            {/* Pagination */}
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                showSizeChanger
                showQuickJumper
                showTotal={(total, range) =>
                  `${range[0]}-${range[1]} trong ${total} thông báo`
                }
                onChange={(page, pageSize) => {
                  setPagination(prev => ({
                    ...prev,
                    current: page,
                    pageSize: pageSize || prev.pageSize
                  }));
                }}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default NotificationsPage;
