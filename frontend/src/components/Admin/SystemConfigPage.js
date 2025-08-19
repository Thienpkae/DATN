import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Tag, Space, message, Switch } from 'antd';
import { PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, UndoOutlined, ExperimentOutlined } from '@ant-design/icons';
import systemConfigService from '../../services/systemConfigService';

const { Option } = Select;

const SystemConfigPage = () => {
  const [loading, setLoading] = useState(false);
  const [configs, setConfigs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const [filterCategory, setFilterCategory] = useState();

  useEffect(() => {
    refresh();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await systemConfigService.getCategories();
      setCategories(res.data || []);
    } catch (e) {
      // ignore
    }
  };

  const refresh = async () => {
    try {
      setLoading(true);
      const res = await systemConfigService.listConfigs();
      setConfigs(res.data || []);
    } catch (e) {
      message.error(e.message || 'Không tải được cấu hình');
    } finally {
      setLoading(false);
    }
  };

  const onCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalVisible(true);
  };

  const onEdit = (record) => {
    setEditing(record);
    form.setFieldsValue({
      key: record.key,
      category: record.category,
      description: record.description,
      dataType: record.dataType,
      isPublic: record.isPublic,
      value: typeof record.value === 'object' ? JSON.stringify(record.value, null, 2) : String(record.value)
    });
    setModalVisible(true);
  };

  const onDelete = async (record) => {
    try {
      await systemConfigService.deleteConfig(record.key);
      message.success('Đã xóa');
      refresh();
    } catch (e) {
      message.error(e.message || 'Xóa thất bại');
    }
  };

  const onReset = async (record) => {
    try {
      await systemConfigService.resetConfig(record.key);
      message.success('Đã reset về mặc định');
      refresh();
    } catch (e) {
      message.error(e.message || 'Reset thất bại');
    }
  };

  const onInitialize = async () => {
    try {
      await systemConfigService.initializeDefaults();
      message.success('Khởi tạo cấu hình mặc định thành công');
      refresh();
    } catch (e) {
      message.error(e.message || 'Khởi tạo thất bại');
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      let castValue = values.value;
      if (values.dataType === 'number') {
        castValue = Number(castValue);
      } else if (values.dataType === 'boolean') {
        castValue = Boolean(castValue === true || castValue === 'true');
      } else if (values.dataType === 'object' || values.dataType === 'array') {
        castValue = JSON.parse(castValue);
      }
      await systemConfigService.updateConfig(values.key, {
        key: values.key,
        value: castValue,
        category: values.category,
        description: values.description,
        dataType: values.dataType,
        isPublic: values.isPublic || false
      });
      message.success(editing ? 'Cập nhật thành công' : 'Tạo mới thành công');
      setModalVisible(false);
      refresh();
    } catch (e) {
      message.error(e.message || 'Lưu thất bại');
    }
  };

  const filtered = useMemo(() => {
    return configs.filter(c => !filterCategory || c.category === filterCategory);
  }, [configs, filterCategory]);

  const columns = [
    { title: 'Key', dataIndex: 'key', key: 'key' },
    { title: 'Category', dataIndex: 'category', key: 'category', render: v => <Tag>{v}</Tag> },
    { title: 'Type', dataIndex: 'dataType', key: 'dataType' },
    { title: 'Public', dataIndex: 'isPublic', key: 'isPublic', render: v => <Tag color={v ? 'green' : 'default'}>{v ? 'Public' : 'Private'}</Tag> },
    { title: 'Description', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: 'Actions', key: 'actions', render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => onEdit(record)} />
          <Button danger icon={<DeleteOutlined />} onClick={() => onDelete(record)} />
          <Button icon={<UndoOutlined />} onClick={() => onReset(record)} />
        </Space>
      )
    }
  ];

  return (
    <Card
      title="System Configuration"
      extra={
        <Space>
          <Select
            placeholder="Lọc theo danh mục"
            style={{ width: 220 }}
            allowClear
            value={filterCategory}
            onChange={setFilterCategory}
          >
            {categories.map(c => (
              <Option value={c.key} key={c.key}>{c.name}</Option>
            ))}
          </Select>
          <Button icon={<ReloadOutlined />} onClick={refresh}>Refresh</Button>
          <Button icon={<ExperimentOutlined />} onClick={onInitialize}>Khởi tạo mặc định</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>Thêm cấu hình</Button>
        </Space>
      }
    >
      <Table
        rowKey={(r) => r._id || r.key}
        loading={loading}
        dataSource={filtered}
        columns={columns}
      />

      <Modal
        title={editing ? 'Cập nhật cấu hình' : 'Tạo cấu hình'}
        open={modalVisible}
        onOk={handleOk}
        onCancel={() => setModalVisible(false)}
        width={720}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="key" label="Key" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Input disabled={!!editing} />
          </Form.Item>
          <Form.Item name="category" label="Danh mục" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Select placeholder="Chọn danh mục">
              {categories.map(c => (
                <Option value={c.key} key={c.key}>{c.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="Mô tả" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="dataType" label="Kiểu dữ liệu" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Select>
              <Option value="string">string</Option>
              <Option value="number">number</Option>
              <Option value="boolean">boolean</Option>
              <Option value="object">object</Option>
              <Option value="array">array</Option>
            </Select>
          </Form.Item>
          <Form.Item name="isPublic" label="Công khai" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="value" label="Giá trị" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Input.TextArea rows={6} placeholder="Giá trị. Với object/array nhập JSON hợp lệ" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default SystemConfigPage;


