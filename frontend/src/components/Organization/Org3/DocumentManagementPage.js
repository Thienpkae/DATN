import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Space, Tag, message, Drawer, Row, Col, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined, EyeOutlined, LinkOutlined } from '@ant-design/icons';
import documentService from '../../../services/documentService';
import authService from '../../../services/auth';

const { Option } = Select;
const { TextArea } = Input;

const DocumentManagementPage = () => {
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [filters, setFilters] = useState({
    keyword: '',
    docType: undefined,
    fileType: undefined
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [linkForm] = Form.useForm();

  const loadMyDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const user = authService.getCurrentUser();
      if (!user?.userId) {
        message.error('Không xác định được người dùng');
        return;
      }
      const res = await documentService.getDocumentsByUploader(user.userId);
      const data = Array.isArray(res) ? res : (res?.data ?? []);
      setDocuments(data);
    } catch (e) {
      message.error(e.message || 'Không tải được tài liệu của tôi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMyDocuments();
  }, [loadMyDocuments]);

  const onSearch = async () => {
    try {
      setLoading(true);
      const res = await documentService.advancedSearch(filters);
      const data = Array.isArray(res) ? res : (res?.data ?? []);
      setDocuments(data);
    } catch (e) {
      message.error(e.message || 'Tìm kiếm thất bại');
    } finally {
      setLoading(false);
    }
  };

  const onCreate = async () => {
    try {
      const values = await form.validateFields();
      const validation = documentService.validateDocumentData({
        docID: values.docID,
        docType: values.docType,
        title: values.title,
        ipfsHash: values.ipfsHash,
        fileType: values.fileType
      });
      if (!validation.isValid) {
        message.warning(validation.errors.join('\n'));
        return;
      }
      setLoading(true);
      await documentService.createDocument({
        docID: values.docID,
        docType: values.docType,
        title: values.title,
        description: values.description,
        ipfsHash: values.ipfsHash,
        fileType: values.fileType,
        fileSize: values.fileSize || 0
      });
      message.success('Tạo tài liệu thành công');
      setCreateOpen(false);
      form.resetFields();
      loadMyDocuments();
    } catch (e) {
      message.error(e.message || 'Tạo tài liệu thất bại');
    } finally {
      setLoading(false);
    }
  };

  const onEdit = async () => {
    try {
      const values = await editForm.validateFields();
      setLoading(true);
      await documentService.updateDocument(values.docID, {
        title: values.title,
        description: values.description,
        docType: values.docType,
        fileType: values.fileType
      });
      message.success('Cập nhật tài liệu thành công');
      setEditOpen(false);
      loadMyDocuments();
    } catch (e) {
      message.error(e.message || 'Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = useCallback(async (docID) => {
    try {
      await documentService.deleteDocument(docID);
      message.success('Xóa tài liệu thành công');
      loadMyDocuments();
    } catch (e) {
      message.error(e.message || 'Xóa thất bại');
    }
  }, [loadMyDocuments]);

  const onLink = async () => {
    try {
      const values = await linkForm.validateFields();
      setLoading(true);
      if (values.linkType === 'land') {
        await documentService.linkDocumentToLand({
          docID: values.docID,
          landParcelId: values.targetID
        });
      } else {
        await documentService.linkDocumentToTransaction({
          docID: values.docID,
          transactionId: values.targetID
        });
      }
      message.success('Liên kết tài liệu thành công');
      setLinkOpen(false);
      loadMyDocuments();
    } catch (e) {
      message.error(e.message || 'Liên kết thất bại');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (verified) => {
    if (verified === true) {
      return <Tag color="green">Đã xác thực</Tag>;
    } else if (verified === false) {
      return <Tag color="red">Bị từ chối</Tag>;
    } else {
      return <Tag color="orange">Chờ xác thực</Tag>;
    }
  };

  const columns = useMemo(() => ([
    { title: 'Mã tài liệu', dataIndex: 'docID', key: 'docID' },
    { title: 'Tiêu đề', dataIndex: 'title', key: 'title' },
    { title: 'Loại', dataIndex: 'docType', key: 'docType', render: v => <Tag>{v}</Tag> },
    { title: 'Trạng thái', dataIndex: 'verified', key: 'verified', render: v => getStatusTag(v) },
    { title: 'Loại file', dataIndex: 'fileType', key: 'fileType' },
    { title: 'Kích thước', dataIndex: 'fileSize', key: 'fileSize', render: v => v ? `${(v / 1024).toFixed(2)} KB` : 'N/A' },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', render: v => v ? new Date(v).toLocaleDateString('vi-VN') : 'N/A' },
    {
      title: 'Thao tác', key: 'actions', fixed: 'right', render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button icon={<EyeOutlined />} onClick={() => {
              setSelected(record);
              setDetailOpen(true);
            }} />
          </Tooltip>
          <Tooltip title="Liên kết">
            <Button icon={<LinkOutlined />} onClick={() => {
              linkForm.setFieldsValue({ docID: record.docID });
              setLinkOpen(true);
            }} />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button icon={<EditOutlined />} onClick={() => {
              setSelected(record);
              editForm.setFieldsValue({
                docID: record.docID,
                title: record.title,
                description: record.description,
                docType: record.docType,
                fileType: record.fileType
              });
              setEditOpen(true);
            }} />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button danger icon={<DeleteOutlined />} onClick={() => onDelete(record.docID)} />
          </Tooltip>
        </Space>
      )
    }
  ]), [editForm, linkForm, onDelete]);

  return (
    <Card
      title="Tài liệu của tôi (Org3)"
      extra={
        <Space>
          <Input
            placeholder="Từ khóa"
            allowClear
            style={{ width: 200 }}
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
          />
          <Select placeholder="Loại tài liệu" allowClear style={{ width: 150 }} value={filters.docType} onChange={(v) => setFilters({ ...filters, docType: v })}>
            {documentService.getDocumentTypes().map(type => (
              <Option key={type} value={type}>{type}</Option>
            ))}
          </Select>
          <Select placeholder="Loại file" allowClear style={{ width: 150 }} value={filters.fileType} onChange={(v) => setFilters({ ...filters, fileType: v })}>
            {documentService.getFileTypes().map(type => (
              <Option key={type} value={type}>{type}</Option>
            ))}
          </Select>
          <Button icon={<SearchOutlined />} onClick={onSearch}>Tìm kiếm</Button>
          <Button icon={<ReloadOutlined />} onClick={loadMyDocuments}>Tải lại</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>Tạo tài liệu</Button>
        </Space>
      }
    >
      <Table
        rowKey={(r) => r.docID}
        loading={loading}
        dataSource={documents}
        columns={columns}
        scroll={{ x: 1200 }}
        pagination={{ pageSize: 10, showSizeChanger: true }}
      />

      {/* Create Document */}
      <Modal title="Tạo tài liệu" open={createOpen} onOk={onCreate} onCancel={() => setCreateOpen(false)} confirmLoading={loading} width={720}>
        <Form layout="vertical" form={form}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="docID" label="Mã tài liệu" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="docType" label="Loại tài liệu" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Select placeholder="Chọn loại">
                  {documentService.getDocumentTypes().map(type => (
                    <Option key={type} value={type}>{type}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <TextArea rows={3} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="ipfsHash" label="Hash IPFS" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="fileType" label="Loại file" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Select placeholder="Chọn loại">
                  {documentService.getFileTypes().map(type => (
                    <Option key={type} value={type}>{type}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="fileSize" label="Kích thước file (bytes)">
            <Input type="number" min={0} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Document */}
      <Modal title="Cập nhật tài liệu" open={editOpen} onOk={onEdit} onCancel={() => setEditOpen(false)} confirmLoading={loading} width={720}>
        <Form layout="vertical" form={editForm}>
          <Form.Item name="docID" label="Mã tài liệu">
            <Input disabled />
          </Form.Item>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <TextArea rows={3} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="docType" label="Loại tài liệu" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Select placeholder="Chọn loại">
                  {documentService.getDocumentTypes().map(type => (
                    <Option key={type} value={type}>{type}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="fileType" label="Loại file" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Select placeholder="Chọn loại">
                  {documentService.getFileTypes().map(type => (
                    <Option key={type} value={type}>{type}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Link Document */}
      <Modal title="Liên kết tài liệu" open={linkOpen} onOk={onLink} onCancel={() => setLinkOpen(false)} confirmLoading={loading} width={640}>
        <Form layout="vertical" form={linkForm}>
          <Form.Item name="docID" label="Mã tài liệu">
            <Input disabled />
          </Form.Item>
          <Form.Item name="linkType" label="Loại liên kết" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Select placeholder="Chọn loại">
              <Option value="land">Liên kết với thửa đất</Option>
              <Option value="transaction">Liên kết với giao dịch</Option>
            </Select>
          </Form.Item>
          <Form.Item name="targetID" label="Mã đích" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Input placeholder="Nhập mã thửa đất hoặc giao dịch" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail */}
      <Drawer title="Chi tiết tài liệu" width={720} open={detailOpen} onClose={() => setDetailOpen(false)}>
        {selected && (
          <div>
            <Row gutter={16}>
              <Col span={12}><strong>Mã:</strong> {selected.docID}</Col>
              <Col span={12}><strong>Loại:</strong> {selected.docType}</Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 12 }}>
              <Col span={12}><strong>Tiêu đề:</strong> {selected.title}</Col>
              <Col span={12}><strong>Trạng thái:</strong> {getStatusTag(selected.verified)}</Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 12 }}>
              <Col span={12}><strong>Loại file:</strong> {selected.fileType}</Col>
              <Col span={12}><strong>Kích thước:</strong> {selected.fileSize ? `${(selected.fileSize / 1024).toFixed(2)} KB` : 'N/A'}</Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 12 }}>
              <Col span={12}><strong>Người upload:</strong> {selected.uploadedBy}</Col>
              <Col span={12}><strong>Ngày tạo:</strong> {selected.createdAt ? new Date(selected.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</Col>
            </Row>
            <div style={{ marginTop: 12 }}>
              <strong>Mô tả:</strong> {selected.description || '-'}
            </div>
            <div style={{ marginTop: 12 }}>
              <strong>Hash IPFS:</strong> {selected.ipfsHash || '-'}
            </div>
            {selected.verifiedBy && (
              <div style={{ marginTop: 12 }}>
                <strong>Người xác minh:</strong> {selected.verifiedBy}
              </div>
            )}
            {selected.verifiedAt && (
              <div style={{ marginTop: 12 }}>
                <strong>Thời gian xác minh:</strong> {new Date(selected.verifiedAt).toLocaleDateString('vi-VN')}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </Card>
  );
};

export default DocumentManagementPage;
