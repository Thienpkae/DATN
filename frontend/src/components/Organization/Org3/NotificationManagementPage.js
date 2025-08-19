import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, Table, Button, Input, Select, Space, Tag, message, Drawer, Row, Col, Tooltip, Badge, Statistic, Tabs, Empty } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, DeleteOutlined, CheckOutlined, BellOutlined, BarChartOutlined, UserOutlined } from '@ant-design/icons';
import notificationService from '../../../services/notificationService';
import authService from '../../../services/auth';

const { Option } = Select;
const { TabPane } = Tabs;

const NotificationManagementPage = () => {
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({
    keyword: '',
    type: undefined,
    priority: undefined,
    isRead: undefined
  });
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState('my');
  const [currentUser, setCurrentUser] = useState(null);

  const loadMyNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const user = authService.getCurrentUser();
      if (!user?.userId) {
        message.error('Không xác định được người dùng');
        return;
      }
      setCurrentUser(user);
      const res = await notificationService.getMyNotifications();
      const data = Array.isArray(res) ? res : (res?.data ?? []);
      setNotifications(data);
    } catch (e) {
      message.error(e.message || 'Không tải được thông báo của tôi');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAllNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await notificationService.getAllNotifications();
      const data = Array.isArray(res) ? res : (res?.data ?? []);
      setNotifications(data);
    } catch (e) {
      message.error(e.message || 'Không tải được danh sách thông báo');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const res = await notificationService.getNotificationStats();
      setStats(res?.data || res || {});
    } catch (e) {
      console.error('Không tải được thống kê:', e);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'my') {
      loadMyNotifications();
    } else {
      loadAllNotifications();
    }
    loadStats();
  }, [activeTab, loadMyNotifications, loadAllNotifications, loadStats]);

  const onSearch = async () => {
    try {
      setLoading(true);
      const res = await notificationService.searchNotifications(filters);
      const data = Array.isArray(res) ? res : (res?.data ?? []);
      setNotifications(data);
    } catch (e) {
      message.error(e.message || 'Tìm kiếm thất bại');
    } finally {
      setLoading(false);
    }
  };

  const onMarkAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      message.success('Đánh dấu đã đọc thành công');
      if (activeTab === 'my') {
        loadMyNotifications();
      } else {
        loadAllNotifications();
      }
    } catch (e) {
      message.error(e.message || 'Thao tác thất bại');
    }
  }, [activeTab, loadMyNotifications, loadAllNotifications]);

  const onMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      message.success('Đánh dấu tất cả đã đọc thành công');
      if (activeTab === 'my') {
        loadMyNotifications();
      } else {
        loadAllNotifications();
      }
    } catch (e) {
      message.error(e.message || 'Thao tác thất bại');
    }
  };

  const onDelete = useCallback(async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      message.success('Xóa thông báo thành công');
      if (activeTab === 'my') {
        loadMyNotifications();
      } else {
        loadAllNotifications();
      }
    } catch (e) {
      message.error(e.message || 'Xóa thất bại');
    }
  }, [activeTab, loadMyNotifications, loadAllNotifications]);

  const onDeleteAll = async () => {
    try {
      await notificationService.deleteAllMyNotifications();
      message.success('Xóa tất cả thông báo thành công');
      if (activeTab === 'my') {
        loadMyNotifications();
      } else {
        loadAllNotifications();
      }
    } catch (e) {
      message.error(e.message || 'Xóa thất bại');
    }
  };

  const getStatusTag = (isRead) => {
    return isRead ? 
      <Tag color="green">Đã đọc</Tag> : 
      <Tag color="orange">Chưa đọc</Tag>;
  };

  const getTypeTag = (type) => {
    const color = notificationService.getTypeColor(type);
    const label = notificationService.getTypeLabel(type);
    return <Tag color={color}>{label}</Tag>;
  };

  const getPriorityTag = (priority) => {
    const color = notificationService.getPriorityColor(priority);
    const label = notificationService.getPriorityLabel(priority);
    return <Tag color={color}>{label}</Tag>;
  };

  const columns = useMemo(() => ([
    { title: 'Tiêu đề', dataIndex: 'title', key: 'title', width: 200 },
    { title: 'Loại', dataIndex: 'type', key: 'type', render: v => getTypeTag(v), width: 150 },
    { title: 'Độ ưu tiên', dataIndex: 'priority', key: 'priority', render: v => getPriorityTag(v), width: 120 },
    { title: 'Trạng thái', dataIndex: 'isRead', key: 'isRead', render: v => getStatusTag(v), width: 100 },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', render: v => v ? new Date(v).toLocaleDateString('vi-VN') : 'N/A', width: 120 },
    {
      title: 'Thao tác', key: 'actions', fixed: 'right', width: 150, render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button icon={<EyeOutlined />} onClick={() => {
              setSelected(record);
              setDetailOpen(true);
            }} />
          </Tooltip>
          {!record.isRead && (
            <Tooltip title="Đánh dấu đã đọc">
              <Button 
                type="primary" 
                icon={<CheckOutlined />} 
                onClick={() => onMarkAsRead(record._id || record.id)}
              />
            </Tooltip>
          )}
          <Tooltip title="Xóa">
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              onClick={() => onDelete(record._id || record.id)}
            />
          </Tooltip>
        </Space>
      )
    }
  ]), [onDelete, onMarkAsRead]);

  const renderStats = () => (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      <Col span={6}>
        <Card>
          <Statistic
            title="Tổng thông báo"
            value={stats.totalNotifications || 0}
            prefix={<BellOutlined />}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="Chưa đọc"
            value={stats.unreadCount || 0}
            prefix={<Badge count={stats.unreadCount || 0} />}
            valueStyle={{ color: '#cf1322' }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="Đã đọc"
            value={(stats.totalNotifications || 0) - (stats.unreadCount || 0)}
            prefix={<Badge count={(stats.totalNotifications || 0) - (stats.unreadCount || 0)} />}
            valueStyle={{ color: '#3f8600' }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="Hôm nay"
            value={stats.todayCount || 0}
            prefix={<BarChartOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
    </Row>
  );

  const renderUserInfo = () => (
    <Card style={{ marginBottom: 16, background: '#f0f8ff' }}>
      <Row gutter={16} align="middle">
        <Col>
          <UserOutlined style={{ fontSize: 24, color: '#1890ff' }} />
        </Col>
        <Col flex="auto">
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
            {currentUser?.username || 'Người dùng'}
          </div>
          <div style={{ color: '#666' }}>
            ID: {currentUser?.userId || 'N/A'} | Tổ chức: {currentUser?.org || 'N/A'}
          </div>
        </Col>
        <Col>
          <Badge count={notifications.filter(n => !n.isRead).length} showZero>
            <Button icon={<BellOutlined />} type="primary">
              Thông báo chưa đọc
            </Button>
          </Badge>
        </Col>
      </Row>
    </Card>
  );

  const getFilteredNotifications = () => {
    let filtered = notifications;
    
    if (activeTab === 'unread') {
      filtered = filtered.filter(n => !n.isRead);
    } else if (activeTab === 'system') {
      filtered = filtered.filter(n => n.type === 'SYSTEM_ANNOUNCEMENT');
    } else if (activeTab === 'transaction') {
      filtered = filtered.filter(n => n.type.includes('TRANSACTION'));
    } else if (activeTab === 'document') {
      filtered = filtered.filter(n => n.type.includes('DOCUMENT'));
    } else if (activeTab === 'land') {
      filtered = filtered.filter(n => n.type.includes('LAND'));
    }
    
    return filtered;
  };

  const renderEmptyState = () => (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <span>
          {activeTab === 'my' ? 'Bạn chưa có thông báo nào' : 'Không có thông báo nào'}
        </span>
      }
    />
  );

  return (
    <Card
      title="Thông báo của tôi (Org3)"
      extra={
        <Space>
          <Input
            placeholder="Từ khóa"
            allowClear
            style={{ width: 200 }}
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
          />
          <Select placeholder="Loại thông báo" allowClear style={{ width: 180 }} value={filters.type} onChange={(v) => setFilters({ ...filters, type: v })}>
            {notificationService.getNotificationTypes().map(type => (
              <Option key={type.value} value={type.value}>{type.label}</Option>
            ))}
          </Select>
          <Select placeholder="Độ ưu tiên" allowClear style={{ width: 150 }} value={filters.priority} onChange={(v) => setFilters({ ...filters, priority: v })}>
            {notificationService.getPriorityLevels().map(priority => (
              <Option key={priority.value} value={priority.value}>{priority.label}</Option>
            ))}
          </Select>
          <Select placeholder="Trạng thái" allowClear style={{ width: 120 }} value={filters.isRead} onChange={(v) => setFilters({ ...filters, isRead: v })}>
            <Option value={false}>Chưa đọc</Option>
            <Option value={true}>Đã đọc</Option>
          </Select>
          <Button icon={<SearchOutlined />} onClick={onSearch}>Tìm kiếm</Button>
          <Button icon={<ReloadOutlined />} onClick={() => activeTab === 'my' ? loadMyNotifications() : loadAllNotifications()}>Tải lại</Button>
        </Space>
      }
    >
      {currentUser && renderUserInfo()}
      {renderStats()}

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Thông báo của tôi" key="my" />
        <TabPane tab="Thông báo chưa đọc" key="unread" />
        <TabPane tab="Thông báo hệ thống" key="system" />
        <TabPane tab="Thông báo giao dịch" key="transaction" />
        <TabPane tab="Thông báo tài liệu" key="document" />
        <TabPane tab="Thông báo thửa đất" key="land" />
      </Tabs>

      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button onClick={onMarkAllAsRead} style={{ marginRight: 8 }}>Đánh dấu tất cả đã đọc</Button>
        <Button danger onClick={onDeleteAll}>Xóa tất cả thông báo</Button>
      </div>

      <Table
        rowKey={(r) => r._id || r.id}
        loading={loading}
        dataSource={getFilteredNotifications()}
        columns={columns}
        scroll={{ x: 1200 }}
        pagination={{ pageSize: 15, showSizeChanger: true }}
        locale={{
          emptyText: renderEmptyState()
        }}
      />

      {/* Detail View */}
      <Drawer title="Chi tiết thông báo" width={800} open={detailOpen} onClose={() => setDetailOpen(false)}>
        {selected && (
          <div>
            <Row gutter={16}>
              <Col span={12}><strong>Tiêu đề:</strong> {selected.title}</Col>
              <Col span={12}><strong>Loại:</strong> {getTypeTag(selected.type)}</Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 12 }}>
              <Col span={12}><strong>Độ ưu tiên:</strong> {getPriorityTag(selected.priority)}</Col>
              <Col span={12}><strong>Trạng thái:</strong> {getStatusTag(selected.isRead)}</Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 12 }}>
              <Col span={12}><strong>Người nhận:</strong> {selected.recipientId}</Col>
              <Col span={12}><strong>Ngày tạo:</strong> {selected.createdAt ? new Date(selected.createdAt).toLocaleString('vi-VN') : 'N/A'}</Col>
            </Row>
            
            <div style={{ marginTop: 16 }}>
              <strong>Nội dung:</strong>
              <div style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                {selected.message}
              </div>
            </div>
            
            {selected.relatedData && (
              <div style={{ marginTop: 16 }}>
                <strong>Dữ liệu liên quan:</strong>
                <div style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                  <pre style={{ margin: 0, fontSize: '12px' }}>
                    {JSON.stringify(selected.relatedData, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            
            {selected.actionUrl && (
              <div style={{ marginTop: 16 }}>
                <strong>URL hành động:</strong> {selected.actionUrl}
              </div>
            )}

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              {!selected.isRead && (
                <Button 
                  type="primary" 
                  icon={<CheckOutlined />} 
                  onClick={() => {
                    onMarkAsRead(selected._id || selected.id);
                    setDetailOpen(false);
                  }}
                  size="large"
                >
                  Đánh dấu đã đọc
                </Button>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </Card>
  );
};

export default NotificationManagementPage;
