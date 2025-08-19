import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Space, Tag, message, Drawer, Row, Col, Tooltip, Badge, Statistic, Tabs } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, DeleteOutlined, PlusOutlined, BellOutlined, BarChartOutlined } from '@ant-design/icons';
import notificationService from '../../../services/notificationService';

const { Option } = Select;
const { TextArea } = Input;
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
  const [createOpen, setCreateOpen] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [form] = Form.useForm();
  const [announcementForm] = Form.useForm();

  const loadNotifications = useCallback(async () => {
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
    loadNotifications();
    loadStats();
  }, [loadNotifications, loadStats]);

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

  const onCreateCustom = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await notificationService.createCustomNotification(values);
      message.success('Tạo thông báo tùy chỉnh thành công');
      setCreateOpen(false);
      form.resetFields();
      loadNotifications();
    } catch (e) {
      message.error(e.message || 'Tạo thông báo thất bại');
    } finally {
      setLoading(false);
    }
  };

  const onSendAnnouncement = async () => {
    try {
      const values = await announcementForm.validateFields();
      setLoading(true);
      await notificationService.sendSystemAnnouncement(values);
      message.success('Gửi thông báo hệ thống thành công');
      setAnnouncementOpen(false);
      announcementForm.resetFields();
      loadNotifications();
    } catch (e) {
      message.error(e.message || 'Gửi thông báo thất bại');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = useCallback(async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      message.success('Xóa thông báo thành công');
      loadNotifications();
    } catch (e) {
      message.error(e.message || 'Xóa thất bại');
    }
  }, [loadNotifications]);

  const onDeleteAll = async () => {
    try {
      await notificationService.deleteAllMyNotifications();
      message.success('Xóa tất cả thông báo thành công');
      loadNotifications();
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
    { title: 'Người nhận', dataIndex: 'recipientId', key: 'recipientId', width: 120 },
    { title: 'Trạng thái', dataIndex: 'isRead', key: 'isRead', render: v => getStatusTag(v), width: 100 },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', render: v => v ? new Date(v).toLocaleDateString('vi-VN') : 'N/A', width: 120 },
    {
      title: 'Thao tác', key: 'actions', fixed: 'right', width: 120, render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button icon={<EyeOutlined />} onClick={() => {
              setSelected(record);
              setDetailOpen(true);
            }} />
          </Tooltip>
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
  ]), [onDelete]);

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

  return (
    <Card
      title="Quản lý thông báo hệ thống (Org1)"
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
          <Button icon={<ReloadOutlined />} onClick={loadNotifications}>Tải lại</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>Tạo thông báo</Button>
          <Button icon={<BellOutlined />} onClick={() => setAnnouncementOpen(true)}>Thông báo hệ thống</Button>
        </Space>
      }
    >
      {renderStats()}

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Tất cả thông báo" key="all" />
        <TabPane tab="Thông báo chưa đọc" key="unread" />
        <TabPane tab="Thông báo hệ thống" key="system" />
      </Tabs>

      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Button danger onClick={onDeleteAll}>Xóa tất cả thông báo</Button>
      </div>

      <Table
        rowKey={(r) => r._id || r.id}
        loading={loading}
        dataSource={notifications}
        columns={columns}
        scroll={{ x: 1200 }}
        pagination={{ pageSize: 15, showSizeChanger: true }}
      />

      {/* Create Custom Notification */}
      <Modal title="Tạo thông báo tùy chỉnh" open={createOpen} onOk={onCreateCustom} onCancel={() => setCreateOpen(false)} confirmLoading={loading} width={640}>
        <Form layout="vertical" form={form}>
          <Form.Item name="recipientId" label="ID người nhận" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Input placeholder="Nhập ID người dùng" />
          </Form.Item>
          <Form.Item name="type" label="Loại thông báo" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Select placeholder="Chọn loại thông báo">
              {notificationService.getNotificationTypes().map(type => (
                <Option key={type.value} value={type.value}>{type.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="priority" label="Độ ưu tiên" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Select placeholder="Chọn độ ưu tiên">
              {notificationService.getPriorityLevels().map(priority => (
                <Option key={priority.value} value={priority.value}>{priority.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Input placeholder="Nhập tiêu đề thông báo" />
          </Form.Item>
          <Form.Item name="message" label="Nội dung" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <TextArea rows={4} placeholder="Nhập nội dung thông báo" />
          </Form.Item>
        </Form>
      </Modal>

      {/* System Announcement */}
      <Modal title="Gửi thông báo hệ thống" open={announcementOpen} onOk={onSendAnnouncement} onCancel={() => setAnnouncementOpen(false)} confirmLoading={loading} width={640}>
        <Form layout="vertical" form={announcementForm}>
          <Form.Item name="title" label="Tiêu đề thông báo" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Input placeholder="Nhập tiêu đề thông báo hệ thống" />
          </Form.Item>
          <Form.Item name="message" label="Nội dung thông báo" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <TextArea rows={4} placeholder="Nhập nội dung thông báo hệ thống" />
          </Form.Item>
          <Form.Item name="priority" label="Độ ưu tiên" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Select placeholder="Chọn độ ưu tiên">
              {notificationService.getPriorityLevels().map(priority => (
                <Option key={priority.value} value={priority.value}>{priority.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <div style={{ color: '#666', fontSize: '14px', marginTop: 16 }}>
            Thông báo này sẽ được gửi đến tất cả người dùng trong hệ thống.
          </div>
        </Form>
      </Modal>

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
          </div>
        )}
      </Drawer>
    </Card>
  );
};

export default NotificationManagementPage;
