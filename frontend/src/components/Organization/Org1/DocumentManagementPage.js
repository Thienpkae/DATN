import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Space, Tag, message, Drawer, Row, Col, Tooltip, Upload, Alert, Progress, Divider } from 'antd';
import { EditOutlined, SearchOutlined, ReloadOutlined, EyeOutlined, DeleteOutlined, DownloadOutlined, UploadOutlined, FileTextOutlined, LinkOutlined, CloudUploadOutlined } from '@ant-design/icons';
import documentService from '../../../services/documentService';
import ipfsService from '../../../services/ipfs';
import { useAuth } from '../../../hooks/useAuth';

const { Option } = Select;
const { TextArea } = Input;

const DocumentManagementPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [documents, setDocuments] = useState([]);
  const [filters, setFilters] = useState({
    keyword: '',
    docType: undefined,
    status: undefined,
    fileType: undefined
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [linkForm] = Form.useForm();
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileList, setFileList] = useState([]);

  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await documentService.getAllDocumentsWithMetadata();
      const data = Array.isArray(res) ? res : (res?.data ?? []);
      setDocuments(data);
    } catch (e) {
      message.error(e.message || 'Không tải được danh sách tài liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

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

  const handleFileUpload = async (file) => {
    try {
      setUploading(true);
      setUploadProgress(0);
      
      // Validate file
      if (!file) {
        message.error('Vui lòng chọn file để upload');
        return;
      }

      // Check file size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        message.error('File quá lớn. Kích thước tối đa là 50MB');
        return;
      }

      // Get form values
      const values = await form.validateFields();
      
      // Create document metadata
      const documentMetadata = {
        docID: values.docID,
        docType: values.docType,
        title: values.title,
        description: values.description,
        organization: user?.org || 'Org1',
        uploadedBy: user?.cccd || 'Unknown'
      };

      // Upload to IPFS
      const uploadResult = await ipfsService.uploadDocumentToIPFS(
        file, 
        documentMetadata, 
        (progress) => setUploadProgress(progress)
      );

      // Create document in blockchain
      await documentService.createDocument({
        docID: values.docID,
        docType: values.docType,
        title: values.title,
        description: values.description,
        ipfsHash: uploadResult.fileHash,
        metadataHash: uploadResult.metadataHash,
        fileType: file.type || file.name.split('.').pop().toUpperCase(),
        fileSize: file.size
      });

      message.success('Tài liệu đã được upload thành công lên IPFS và blockchain');
      setCreateOpen(false);
      form.resetFields();
      setSelectedFile(null);
      setFileList([]);
      setUploadProgress(0);
      loadList();
    } catch (e) {
      message.error(e.message || 'Upload tài liệu thất bại');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const onCreate = async () => {
    if (!selectedFile) {
      message.error('Vui lòng chọn file để upload');
      return;
    }
    await handleFileUpload(selectedFile);
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
      loadList();
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
      loadList();
    } catch (e) {
      message.error(e.message || 'Xóa thất bại');
    }
  }, [loadList]);

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
      loadList();
    } catch (e) {
      message.error(e.message || 'Liên kết thất bại');
    } finally {
      setLoading(false);
    }
  };

  const onAnalyze = async (docID) => {
    try {
      const res = await documentService.analyzeDocument(docID);
      setAnalysis(res);
      setDetailOpen(true);
    } catch (e) {
      message.error(e.message || 'Phân tích thất bại');
    }
  };

  const handleDownload = useCallback(async (record) => {
    try {
      if (!record.ipfsHash) {
        message.error('Không có hash IPFS để tải file');
        return;
      }
      
      await ipfsService.downloadFileFromIPFS(record.ipfsHash, record.title || record.docID);
      message.success('Tải file thành công');
    } catch (e) {
      message.error(e.message || 'Tải file thất bại');
    }
  }, []);

  const handleFileChange = (info) => {
    if (info.file.status === 'removed') {
      setSelectedFile(null);
      setFileList([]);
      return;
    }
    
    const file = info.file.originFileObj;
    if (file) {
      setSelectedFile(file);
      setFileList([info.file]);
    }
  };

  const columns = useMemo(() => ([
    { title: 'Mã tài liệu', dataIndex: 'docID', key: 'docID' },
    { title: 'Tiêu đề', dataIndex: 'title', key: 'title' },
    { title: 'Loại', dataIndex: 'docType', key: 'docType', render: v => <Tag>{v}</Tag> },
    { title: 'Trạng thái', dataIndex: 'verified', key: 'verified', render: v => <Tag color={v ? 'green' : 'orange'}>{v ? 'Đã xác thực' : 'Chờ xác thực'}</Tag> },
    { title: 'Loại file', dataIndex: 'fileType', key: 'fileType' },
    { title: 'Kích thước', dataIndex: 'fileSize', key: 'fileSize', render: v => v ? `${(v / 1024).toFixed(2)} KB` : 'N/A' },
    { title: 'Người upload', dataIndex: 'uploadedBy', key: 'uploadedBy' },
    {
      title: 'Thao tác', key: 'actions', fixed: 'right', render: (_, record) => (
        <Space>
          <Tooltip title="Tải file">
            <Button 
              icon={<DownloadOutlined />} 
              onClick={() => handleDownload(record)}
              disabled={!record.ipfsHash}
            />
          </Tooltip>
          <Tooltip title="Xem chi tiết">
            <Button icon={<EyeOutlined />} onClick={() => {
              setSelected(record);
              setDetailOpen(true);
            }} />
          </Tooltip>
          <Tooltip title="Phân tích">
            <Button icon={<FileTextOutlined />} onClick={() => onAnalyze(record.docID)} />
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
  ]), [editForm, linkForm, onDelete, handleDownload]);

  return (
    <Card
      title="Quản lý tài liệu (Org1)"
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
          <Select placeholder="Trạng thái" allowClear style={{ width: 150 }} value={filters.status} onChange={(v) => setFilters({ ...filters, status: v })}>
            {documentService.getDocumentStatuses().map(status => (
              <Option key={status} value={status}>{status}</Option>
            ))}
          </Select>
          <Select placeholder="Loại file" allowClear style={{ width: 150 }} value={filters.fileType} onChange={(v) => setFilters({ ...filters, fileType: v })}>
            {documentService.getFileTypes().map(type => (
              <Option key={type} value={type}>{type}</Option>
            ))}
          </Select>
          <Button icon={<SearchOutlined />} onClick={onSearch}>Tìm kiếm</Button>
          <Button icon={<ReloadOutlined />} onClick={loadList}>Tải lại</Button>
          <Button type="primary" icon={<CloudUploadOutlined />} onClick={() => setCreateOpen(true)}>Upload tài liệu</Button>
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

      {/* Create Document with File Upload */}
      <Modal 
        title="Upload tài liệu lên IPFS" 
        open={createOpen} 
        onOk={onCreate} 
        onCancel={() => {
          setCreateOpen(false);
          setSelectedFile(null);
          setFileList([]);
          setUploadProgress(0);
        }} 
        confirmLoading={uploading} 
        width={720}
        okText="Upload tài liệu"
        cancelText="Hủy"
      >
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
          
          <Divider>Upload file lên IPFS</Divider>
          
          <Form.Item label="Chọn file" required>
            <Upload
              fileList={fileList}
              beforeUpload={() => false}
              onChange={handleFileChange}
              maxCount={1}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.xls,.xlsx"
            >
              <Button icon={<UploadOutlined />}>Chọn file</Button>
            </Upload>
            <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
              Hỗ trợ: PDF, DOC, DOCX, JPG, PNG, TXT, XLS, XLSX. Tối đa 50MB
            </div>
          </Form.Item>

          {selectedFile && (
            <Alert
              message={`File đã chọn: ${selectedFile.name}`}
              description={`Kích thước: ${(selectedFile.size / 1024).toFixed(2)} KB | Loại: ${selectedFile.type || 'Không xác định'}`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {uploading && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>Đang upload lên IPFS...</div>
              <Progress percent={uploadProgress} status="active" />
            </div>
          )}
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

      {/* Detail + Analysis */}
      <Drawer title="Chi tiết tài liệu" width={720} open={detailOpen} onClose={() => setDetailOpen(false)}>
        {selected && (
          <div>
            <Row gutter={16}>
              <Col span={12}><strong>Mã:</strong> {selected.docID}</Col>
              <Col span={12}><strong>Loại:</strong> {selected.docType}</Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 12 }}>
              <Col span={12}><strong>Tiêu đề:</strong> {selected.title}</Col>
              <Col span={12}><strong>Trạng thái:</strong> {selected.verified ? 'Đã xác thực' : 'Chờ xác thực'}</Col>
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
              <strong>Mô tả:</strong> {selected.displayDescription || selected.description || '-'}
            </div>
            <div style={{ marginTop: 12 }}>
              <strong>Hash IPFS:</strong> 
              {selected.ipfsHash ? (
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: '12px', background: '#f5f5f5', padding: 8, borderRadius: 4, marginTop: 4 }}>
                    {selected.ipfsHash}
                  </div>
                  <Button 
                    type="link" 
                    icon={<DownloadOutlined />} 
                    onClick={() => handleDownload(selected)}
                    style={{ padding: 0, marginTop: 4 }}
                  >
                    Tải file từ IPFS
                  </Button>
                </div>
              ) : '-'}
            </div>
            {selected.metadata && selected.metadata.hasMetadata && (
              <div style={{ marginTop: 12 }}>
                <strong>Metadata Hash:</strong> 
                <div style={{ fontFamily: 'monospace', fontSize: '12px', background: '#f5f5f5', padding: 8, borderRadius: 4, marginTop: 4 }}>
                  {selected.metadata.metadataHash}
                </div>
                <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                  Upload lúc: {selected.metadata.metadataUploadedAt ? new Date(selected.metadata.metadataUploadedAt).toLocaleString('vi-VN') : 'N/A'}
                </div>
              </div>
            )}
            {analysis && (
              <div style={{ marginTop: 16 }}>
                <strong>Kết quả phân tích:</strong>
                <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, marginTop: 8 }}>
                  {JSON.stringify(analysis, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </Card>
  );
};

export default DocumentManagementPage;
