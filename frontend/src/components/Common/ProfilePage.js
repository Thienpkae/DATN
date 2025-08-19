import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Space, Typography, App } from 'antd';
import userService from '../../services/userService';
import authService from '../../services/auth';

const { Title, Text } = Typography;

const ProfilePage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // Fetch profile first (primary source)
        const resp = await userService.getProfile();
        const user = resp?.user || resp?.data || resp; // backend variants
        if (user) {
          form.setFieldsValue({
            cccd: user.cccd,
            fullName: user.fullName,
            phone: user.phone ? String(user.phone) : ''
          });
          // Only if phone is missing, fall back to admin list API (secondary source)
          if (!user.phone) {
            try {
              const current = authService.getCurrentUser();
              if (current?.role === 'admin' && current?.org) {
                const listRes = await userService.listUsers({ org: current.org });
                const list = listRes?.users || listRes?.data?.users || [];
                const me = list.find(u => String(u.cccd) === String(user.cccd));
                if (me?.phone) form.setFieldsValue({ phone: String(me.phone) });
              }
            } catch (_) { /* ignore secondary failure */ }
          }
        } else {
          const stored = authService.getCurrentUser();
          if (stored) {
            form.setFieldsValue({
              cccd: stored.cccd || stored.userId,
              fullName: stored.name,
              phone: stored.phone ? String(stored.phone) : ''
            });
          }
        }
      } catch (e) {
        const stored = authService.getCurrentUser();
        if (stored) {
          form.setFieldsValue({
            cccd: stored.cccd || stored.userId,
            fullName: stored.name,
            phone: stored.phone ? String(stored.phone) : ''
          });
          // Only fallback for 404 from profile
          if (e?.response?.status === 404 && stored.role === 'admin' && stored.org) {
            try {
              const listRes = await userService.listUsers({ org: stored.org });
              const list = listRes?.users || listRes?.data?.users || [];
              const me = list.find(u => String(u.cccd) === String(stored.cccd || stored.userId));
              if (me?.phone) form.setFieldsValue({ phone: String(me.phone) });
            } catch (_) { /* ignore */ }
          }
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [form]);

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const payload = { fullName: values.fullName, phone: values.phone };
      let updated;
      try {
        updated = await userService.updateProfile(payload);
      } catch (err) {
        // If profile API not available (404), try admin update-by-cccd for own account
        if (err?.response?.status === 404) {
          const current = authService.getCurrentUser();
          if (current?.role === 'admin' && (current?.cccd || current?.userId)) {
            const cccd = current.cccd || current.userId;
            updated = await userService.updateByCccd(cccd, {
              fullName: values.fullName,
              phone: values.phone
            });
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }
      message.success('Cập nhật hồ sơ thành công');
      // persist name to localStorage for header display
      const current = authService.getCurrentUser();
      if (current) {
        const merged = { ...current, name: updated?.user?.fullName || values.fullName, phone: values.phone };
        localStorage.setItem('user', JSON.stringify(merged));
      }
      // Navigate back after a short delay so the toast can be seen
      setTimeout(() => {
        goBack();
      }, 800);
    } catch (error) {
      message.error(error?.response?.data?.error || error.message || 'Cập nhật hồ sơ thất bại');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    // Prefer admin home if admin
    const u = authService.getCurrentUser();
    if (u && u.role === 'admin') {
      window.location.href = '/admin';
    } else {
      window.history.back();
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Card style={{ maxWidth: 720, margin: '0 auto' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={3} style={{ marginBottom: 0 }}>Hồ sơ cá nhân</Title>
            <Text type="secondary">Cập nhật thông tin của bạn</Text>
          </div>

          <Form form={form} layout="vertical" disabled={loading}>
            <Form.Item label="CCCD" name="cccd">
              <Input disabled />
            </Form.Item>
            <Form.Item label="Họ và tên" name="fullName" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }] }>
              <Input placeholder="Nhập họ tên" />
            </Form.Item>
            <Form.Item label="Số điện thoại" name="phone" rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }] }>
              <Input placeholder="Nhập số điện thoại" />
            </Form.Item>
          </Form>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={goBack}>Hủy</Button>
            <Button type="primary" onClick={onSubmit} loading={loading}>
              Lưu thay đổi
            </Button>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default ProfilePage;


