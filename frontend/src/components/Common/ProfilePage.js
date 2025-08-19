import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Space, Typography, App } from 'antd';
import userService from '../../services/userService';
import authService from '../../services/auth';
import { normalizeVietnameseName } from '../../utils/text';

const { Title, Text } = Typography;

const ProfilePage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // 1) Start from local auth user (same as Admin flow)
        const current = authService.getCurrentUser();
        if (current) {
          form.setFieldsValue({
            cccd: current.cccd || current.userId,
            fullName: normalizeVietnameseName(current.name),
            phone: current.phone ? String(current.phone) : ''
          });

          // Backfill phone from JWT if still missing
          const currentPhone = current.phone ? String(current.phone) : '';
          if (!currentPhone) {
            try {
              const token = localStorage.getItem('jwt_token');
              if (token) {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload?.phone) {
                  form.setFieldsValue({ phone: String(payload.phone) });
                  const cached = authService.getCurrentUser() || {};
                  localStorage.setItem('user', JSON.stringify({ ...cached, phone: String(payload.phone) }));
                }
              }
            } catch (_) { /* ignore */ }
          }
        }
        // 2) Call non-admin self endpoint to ensure latest phone
        try {
          const targetCccd = (current?.cccd || current?.userId);
          if (targetCccd) {
            const me = await userService.getSelfByCccd(targetCccd);
            if (me) {
              form.setFieldsValue({
                cccd: me.cccd,
                fullName: normalizeVietnameseName(me.fullName || current?.name || ''),
                phone: me.phone ? String(me.phone) : form.getFieldValue('phone') || ''
              });
              if (me.phone) {
                localStorage.setItem('user', JSON.stringify({ ...current, phone: String(me.phone) }));
              }
            }
          }
        } catch (_) {}

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


