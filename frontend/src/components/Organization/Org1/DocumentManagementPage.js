import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Space, Tag, message, Row, Col, Tooltip, Upload, Progress, Divider, Tabs, Typography } from 'antd';
import { EditOutlined, SearchOutlined, ReloadOutlined, EyeOutlined, DeleteOutlined, DownloadOutlined, UploadOutlined, FileTextOutlined, CloudUploadOutlined } from '@ant-design/icons';
import documentService from '../../../services/documentService';
import ipfsService from '../../../services/ipfs';
import { useAuth } from '../../../hooks/useAuth';
import OnlineDocumentViewer from '../../Common/OnlineDocumentViewer';

const { confirm } = Modal;

const { Option } = Select;
const { TextArea } = Input;

const { Text } = Typography;

const DocumentManagementPage = () => {
  const { user } = useAuth();
  const [selected, setSelected] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [documents, setDocuments] = useState([]);
  const defaultFilters = useMemo(() => ({
    keyword: '',
    docType: undefined,
    status: undefined
  }), []);

  const [filters, setFilters] = useState(defaultFilters);
  const [createOpen, setCreateOpen] = useState(false);
  const [editForm] = Form.useForm();
  const [form] = Form.useForm();
  const [analysis, setAnalysis] = useState(null);
  const [documentHistory, setDocumentHistory] = useState([]);
  const [onlineViewerOpen, setOnlineViewerOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadingDocId, setDownloadingDocId] = useState(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      
      // Prefetch: Tải dữ liệu cơ bản trước để hiển thị ngay
      const basicDocs = await documentService.getAllDocumentsWithMetadata();
      setDocuments(basicDocs);
      
      // Sau đó tải thêm metadata chi tiết nếu cần
      if (basicDocs && basicDocs.length > 0) {
        // Có thể thêm logic tải metadata chi tiết ở đây nếu cần
        console.log('Documents loaded with prefetch:', basicDocs.length);
      }
    } catch (e) {
      console.error('Error loading documents:', e);
      // Don't show error alert, just set empty documents - UI will show empty state
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const onReload = useCallback(() => {
    setFilters(defaultFilters);
    loadList();
  }, [loadList, defaultFilters]);

  useEffect(() => {
    loadList();
    
    // Listen for document creation, update and delete events to auto-refresh
    const handleDocumentCreated = () => {
      console.log('Document created event received, refreshing list...');
      loadList();
    };
    
    const handleDocumentUpdated = () => {
      console.log('Document updated event received, refreshing list...');
      loadList();
    };
    
    const handleDocumentDeleted = () => {
      console.log('Document deleted event received, refreshing list...');
      loadList();
    };
    
    window.addEventListener('documentCreated', handleDocumentCreated);
    window.addEventListener('documentUpdated', handleDocumentUpdated);
    window.addEventListener('documentDeleted', handleDocumentDeleted);
    
    return () => {
      window.removeEventListener('documentCreated', handleDocumentCreated);
      window.removeEventListener('documentUpdated', handleDocumentUpdated);
      window.removeEventListener('documentDeleted', handleDocumentDeleted);
    };
  }, [loadList]);

  const onSearch = async () => {
    try {
      setLoading(true);
      const searchParams = {};
      if (filters.keyword) searchParams.keyword = filters.keyword;
      if (filters.docType) searchParams.type = filters.docType; // Backend dùng 'type'
      if (filters.status !== undefined) searchParams.status = filters.status;
      
      const docs = await documentService.searchDocuments(searchParams);
      // Đảm bảo docs luôn là array
      const documentsArray = Array.isArray(docs) ? docs : (docs.documents || []);
      console.log('Search results:', documentsArray);
      
      // Kiểm tra nếu không có documents
      if (!documentsArray || documentsArray.length === 0) {
        message.info('Không tìm thấy tài liệu nào');
        setDocuments([]);
      } else {
        setDocuments(documentsArray);
      }
    } catch (e) {
      message.error(e.message || 'Lỗi khi tìm kiếm');
    } finally {
      setLoading(false);
    }
  };



  const onCreate = async () => {
    try {
      const values = await form.validateFields();
      if (!selectedFile) {
        message.error('Vui lòng chọn file');
        return;
      }
      
      setUploading(true);
      setUploadProgress(0);
      
      // Upload file to IPFS
      const ipfsHash = await ipfsService.uploadFileToIPFS(selectedFile, (progress) => setUploadProgress(progress));
      
      // Create document (automatically verified by Org1) - docID will be auto-generated
      const response = await documentService.createDocument({
        docType: values.docType,
        title: values.title,
        description: values.description,
        ipfsHash: ipfsHash,
        fileType: selectedFile.type || selectedFile.name.split('.').pop().toUpperCase(),
        fileSize: selectedFile.size,
        status: 'VERIFIED' // Org1 tạo tài liệu sẽ tự động được xác thực
      });
      
      message.success('Tạo tài liệu thành công');
      setCreateOpen(false);
      form.resetFields();
      setSelectedFile(null);
      setFileList([]);
      loadList();
      
      // Dispatch custom event to notify other pages to refresh
      window.dispatchEvent(new CustomEvent('documentCreated', {
        detail: { documentId: response.data.docID }
      }));
    } catch (e) {
      message.error(e.message || 'Tạo tài liệu thất bại');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const onEdit = async () => {
    try {
      const values = await editForm.validateFields();
      setLoading(true);
      
      // Chỉ cập nhật title và description theo logic chaincode
      await documentService.updateDocument(selected.docID, {
        title: values.title,
        description: values.description
      });
      
      message.success('Cập nhật tài liệu thành công');
      setEditOpen(false);
      loadList();
      
      // Dispatch custom event to notify other pages to refresh
      window.dispatchEvent(new CustomEvent('documentUpdated', {
        detail: { documentId: selected.docID }
      }));
    } catch (e) {
      message.error(e.message || 'Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };



  const onAnalyze = async (docID) => {
    try {
      setAnalysisLoading(true);
      const result = await documentService.analyzeDocument(docID);
      setAnalysis(result);
      message.success('Phân tích tài liệu thành công');
    } catch (e) {
      message.error(e.message || 'Phân tích thất bại');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const loadDocumentHistory = useCallback(async (docID) => {
    try {
      if (!docID) return;
      const history = await documentService.getDocumentHistory(docID);
      setDocumentHistory(history);
    } catch (e) {
      console.error('Error loading document history:', e);
      setDocumentHistory([]);
    }
  }, []);

  const handleViewOnline = useCallback(async () => {
    try {
      setViewerLoading(true);
      // Open viewer directly without showing notification toasts
      setOnlineViewerOpen(true);
    } catch (e) {
      message.error(e.message || 'Không thể mở xem trực tuyến');
    } finally {
      setViewerLoading(false);
    }
  }, []);

  const handleDownload = useCallback(async (record) => {
    try {
      if (!record.ipfsHash) {
        message.error('Không có file để tải');
        return;
      }
      
      setDownloading(true);
      setDownloadingDocId(record.docID);
      message.loading({ content: 'Đang tải file...', key: 'download', duration: 0 });
      
      await ipfsService.downloadFileFromIPFS(record.ipfsHash, record.title || 'document');
      message.success({ content: 'Tải file thành công', key: 'download' });
    } catch (e) {
      message.error({ content: e.message || 'Tải file thất bại', key: 'download' });
    } finally {
      setDownloading(false);
      setDownloadingDocId(null);
    }
  }, []);

  const handleFileChange = (info) => {
    const { fileList: newFileList } = info;
    
    if (newFileList.length === 0) {
      setSelectedFile(null);
      setFileList([]);
      return;
    }
    
    const file = info.file.originFileObj || info.file;
    if (file) {
      setSelectedFile(file);
      setFileList(newFileList);
    }
  };

  const handleDelete = useCallback((record) => {
    confirm({
      title: 'Xác nhận xóa tài liệu',
      content: (
        <div>
          <p>Bạn có chắc chắn muốn xóa tài liệu này không?</p>
          <p><strong>Mã tài liệu:</strong> {record.docID}</p>
          <p><strong>Tiêu đề:</strong> {record.title}</p>
          <p style={{ color: 'red', marginTop: 10 }}>
            ⚠️ Hành động này không thể hoàn tác!
          </p>
        </div>
      ),
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      async onOk() {
        try {
          // Chaincode sẽ xử lý việc check links và trả về lỗi nếu cần
          await documentService.deleteDocument(record.docID);
          message.success('Xóa tài liệu thành công');
          loadList();
          
          // Dispatch custom event to notify other pages to refresh
          window.dispatchEvent(new CustomEvent('documentDeleted', {
            detail: { documentId: record.docID }
          }));
        } catch (e) {
          message.error(e.message || 'Xóa thất bại');
        }
      },
      onCancel() {
        console.log('Hủy xóa tài liệu');
      },
    });
  }, [loadList]);

  const openDetail = useCallback((record) => {
    setSelected(record);
    setDetailOpen(true);
    // Reset analysis state when opening new document
    setAnalysis(null);
    // Load document history when opening detail
    if (record.docID) {
      loadDocumentHistory(record.docID);
    }
  }, [loadDocumentHistory]);

  const columns = useMemo(() => ([
    { title: 'Mã tài liệu', dataIndex: 'docID', key: 'docID', render: v => <code>{v}</code> },
    { title: 'Tiêu đề', dataIndex: 'title', key: 'title' },
    { title: 'Mô tả', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: 'Loại', dataIndex: 'type', key: 'type', render: v => <Tag color="blue">{v}</Tag> },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: v => {
        if (v === 'VERIFIED') return <Tag color="green">Đã thẩm định</Tag>;
        if (v === 'REJECTED') return <Tag color="red">Không hợp lệ</Tag>;
        return <Tag color="orange">Chờ xác thực</Tag>;
      }
    },
    { title: 'Kích thước', dataIndex: 'fileSize', key: 'fileSize', render: v => v ? `${(v / 1024).toFixed(2)} KB` : 'N/A' },
    { title: 'Người upload', dataIndex: 'uploadedBy', key: 'uploadedBy' },
    {
      title: 'Thao tác', key: 'actions', fixed: 'right', render: (_, record) => (
        <Space>
          <Tooltip title="Tải về">
            <Button 
              icon={<DownloadOutlined />} 
              onClick={() => handleDownload(record)}
              loading={downloading && downloadingDocId === record.docID}
              disabled={downloading && downloadingDocId === record.docID}
            />
          </Tooltip>
          <Tooltip title="Xem chi tiết">
            <Button icon={<EyeOutlined />} onClick={() => openDetail(record)} />
          </Tooltip>
          <Tooltip title={record.uploadedBy !== user?.userId ? "Chỉ người upload mới được sửa" : "Sửa"}>
            <Button 
              icon={<EditOutlined />} 
              onClick={() => {
                console.log('Edit button clicked:', { 
                  recordUploadedBy: record.uploadedBy, 
                  currentUserId: user?.userId,
                  canEdit: record.uploadedBy === user?.userId 
                });
                setSelected(record);
                editForm.setFieldsValue({
                  title: record.title,
                  description: record.description
                });
                setEditOpen(true);
              }}
              disabled={record.uploadedBy !== user?.userId}
            />
          </Tooltip>

          <Tooltip title={record.uploadedBy !== user?.userId ? "Chỉ người upload mới được xóa" : "Xóa"}>
            <Button 
              icon={<DeleteOutlined />} 
              danger 
              onClick={() => handleDelete(record)}
              disabled={record.uploadedBy !== user?.userId}
            />
          </Tooltip>
        </Space>
      )
    }
  ]), [editForm, handleDelete, handleDownload, openDetail, user?.userId, downloading, downloadingDocId]);

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
              <Option key={type} value={type}>
                {documentService.getDocumentTypeName(type)}
              </Option>
            ))}
          </Select>
          <Select placeholder="Trạng thái tài liệu" allowClear style={{ width: 150 }} value={filters.status} onChange={(v) => setFilters({ ...filters, status: v })}>
            <Option value="VERIFIED">Đã thẩm định</Option>
            <Option value="PENDING">Chờ xác thực</Option>
            <Option value="REJECTED">Bị từ chối</Option>
          </Select>
          <Button icon={<SearchOutlined />} onClick={onSearch}>Tìm kiếm</Button>
          <Button icon={<ReloadOutlined />} onClick={onReload}>Tải lại</Button>
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
        pagination={{ 
          pageSize: pageSize, 
          showSizeChanger: true,
          showQuickJumper: false,
          showTotal: false,
          onChange: (page, newPageSize) => {
            console.log('Page changed:', page, newPageSize);
          },
          onShowSizeChange: (current, size) => {
            console.log('Page size changed:', current, size);
            setPageSize(size);
          }
        }}
        locale={{
          emptyText: (
            <div style={{ padding: '40px 0' }}>
              <div style={{ fontSize: '16px', color: '#595959', marginBottom: '8px' }}>
                Chưa có tài liệu nào trong hệ thống
              </div>
              <div style={{ fontSize: '14px', color: '#8c8c8c' }}>
                Hãy tạo tài liệu đầu tiên bằng cách nhấn nút "Upload tài liệu"
              </div>
            </div>
          )
        }}
      />

      {/* Create Document */}
      <Modal title="Tạo tài liệu mới" open={createOpen} onOk={onCreate} onCancel={() => setCreateOpen(false)} confirmLoading={uploading} width={720}>
        <Form layout="vertical" form={form}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Input placeholder="Nhập tiêu đề tài liệu" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="docType" label="Loại tài liệu" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Select placeholder="Chọn loại">
                  {documentService.getDocumentTypes().map(type => (
                    <Option key={type} value={type}>
                      {documentService.getDocumentTypeName(type)}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Mô tả">
            <TextArea rows={4} placeholder="Nhập mô tả tài liệu" />
          </Form.Item>
          
          <Divider>Upload file lên IPFS</Divider>
          
          <Form.Item label="Chọn file" required>
            <Upload
              fileList={fileList}
              onChange={handleFileChange}
              beforeUpload={() => false}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Chọn file</Button>
            </Upload>
            <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
              Hỗ trợ: PDF, DOC, DOCX, JPG, PNG. Kích thước tối đa: 50MB
            </div>
          </Form.Item>
          
          {uploading && (
            <div>
              <Progress percent={uploadProgress} status="active" />
              <Text type="secondary">Đang upload lên IPFS...</Text>
            </div>
          )}
        </Form>
      </Modal>

      {/* Edit Document */}
      <Modal title="Sửa tài liệu" open={editOpen} onOk={onEdit} onCancel={() => setEditOpen(false)} confirmLoading={loading} width={640}>
        <Form layout="vertical" form={editForm}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Input placeholder="Nhập tiêu đề tài liệu" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Mô tả">
            <TextArea rows={4} placeholder="Nhập mô tả tài liệu" />
          </Form.Item>
          <div style={{ 
            background: '#fff7e6', 
            border: '1px solid #ffd591', 
            borderRadius: '6px', 
            padding: '12px',
            marginTop: '16px'
          }}>
            <Text type="warning" style={{ fontSize: '12px' }}>
              💡 Lưu ý: Chỉ có thể cập nhật tiêu đề và mô tả. Loại tài liệu không thể thay đổi sau khi tạo.
            </Text>
          </div>
        </Form>
      </Modal>

      {/* Detail + Analysis */}
      <Modal 
        title="Chi tiết tài liệu & Phân tích" 
        open={detailOpen} 
        onCancel={() => setDetailOpen(false)} 
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailOpen(false)}>
            Đóng
          </Button>
        ]}
      >
        {selected && (
          <div>
            <Tabs 
              defaultActiveKey="1"
              items={[
                {
                  key: "1",
                  label: "Thông tin cơ bản",
                  children: (
                    <div style={{ padding: '16px 0' }}>
                      <Row gutter={24}>
                        <Col span={24}>
                          <div style={{ marginBottom: 24, padding: '20px 0', borderBottom: '1px solid #f0f0f0' }}>
                            <Text strong style={{ fontSize: 18 }}>{selected.title}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 13 }}>Mã: <code>{selected.docID}</code></Text>
                          </div>
                        </Col>
                      </Row>
                      
                      <Row gutter={24}>
                        <Col span={12}>
                          <div style={{ marginBottom: 16 }}>
                            <Text strong>Loại tài liệu</Text>
                            <br />
                            <Tag color="blue" style={{ marginTop: 6 }}>{selected.type}</Tag>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ marginBottom: 16 }}>
                            <Text strong>Trạng thái</Text>
                            <br />
                            <div style={{ marginTop: 6 }}>
                              {selected.status === 'VERIFIED' ? (
                                <Tag color="green">Đã thẩm định</Tag>
                              ) : selected.status === 'REJECTED' ? (
                                <Tag color="red">Không hợp lệ</Tag>
                              ) : (
                                <Tag color="orange">Chờ xác thực</Tag>
                              )}
                            </div>
                          </div>
                        </Col>
                      </Row>
                      
                      <Row gutter={24}>
                        <Col span={12}>
                          <div style={{ marginBottom: 16 }}>
                            <Text strong>Loại file</Text>
                            <br />
                            <Tag color="blue" style={{ marginTop: 6 }}>{documentService.getDisplayFileType(selected.fileType)}</Tag>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ marginBottom: 16 }}>
                            <Text strong>Kích thước</Text>
                            <br />
                            <Text type="secondary" style={{ marginTop: 6, display: 'block' }}>
                              {selected.fileSize ? `${(selected.fileSize / 1024).toFixed(2)} KB` : 'N/A'}
                            </Text>
                          </div>
                        </Col>
                      </Row>
                      
                      <Row gutter={24}>
                        <Col span={12}>
                          <div style={{ marginBottom: 16 }}>
                            <Text strong>Người upload</Text>
                            <br />
                            <Text type="secondary" style={{ marginTop: 6, display: 'block' }}>{selected.uploadedBy}</Text>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ marginBottom: 16 }}>
                            <Text strong>Ngày tạo</Text>
                            <br />
                            <Text type="secondary" style={{ marginTop: 6, display: 'block' }}>
                              {selected.createdAt ? new Date(selected.createdAt).toLocaleString('vi-VN') : 'N/A'}
                            </Text>
                          </div>
                        </Col>
                      </Row>
                      
                      <Row gutter={24}>
                        <Col span={24}>
                          <div style={{ marginBottom: 16 }}>
                            <Text strong>Mô tả</Text>
                            <br />
                            <Text type="secondary" style={{ marginTop: 6, display: 'block', lineHeight: 1.6 }}>
                              {selected.description || 'Không có mô tả'}
                            </Text>
                          </div>
                        </Col>
                      </Row>
                      
                      <Divider />
                      
                      <Row gutter={24}>
                        <Col span={24}>
                          <div style={{ textAlign: 'center', marginTop: 16 }}>
                            <Space size="large">
                              <Button 
                                type="primary"
                                icon={<EyeOutlined />}
                                onClick={handleViewOnline}
                                disabled={!selected.ipfsHash}
                                loading={viewerLoading}
                                size="large"
                              >
                                Xem trực tuyến
                              </Button>
                              <Button 
                                icon={<DownloadOutlined />}
                                onClick={() => handleDownload(selected)}
                                disabled={!selected.ipfsHash}
                                loading={downloading && downloadingDocId === selected.docID}
                                size="large"
                              >
                                Tải về
                              </Button>
                            </Space>
                          </div>
                        </Col>
                      </Row>
                      

                    </div>
                  )
                },
                {
                  key: "2",
                  label: "Phân tích tài liệu",
                  children: (
                    <div>
                      <div style={{ marginBottom: 16 }}>
                        <Button 
                          type="primary" 
                          icon={<FileTextOutlined />}
                          onClick={() => onAnalyze(selected.docID)}
                          loading={analysisLoading}
                        >
                          Phân tích tài liệu
                        </Button>
                      </div>
                      
                      {analysisLoading ? (
                        <div style={{ textAlign: 'center', padding: 32 }}>
                          <div>Đang phân tích tài liệu...</div>
                        </div>
                      ) : analysis ? (
                        <div>
                          <Row gutter={16}>
                            <Col span={12}>
                              <Text strong>Kết quả phân tích:</Text>
                              <br />
                              <Text type="secondary">{analysis.result}</Text>
                            </Col>
                            <Col span={12}>
                              <Text strong>Độ tin cậy:</Text>
                              <br />
                              <Text type="secondary">{analysis.confidence}%</Text>
                            </Col>
                          </Row>
                          <Row gutter={16}>
                            <Col span={24}>
                              <Text strong>Chi tiết:</Text>
                              <br />
                              <Text type="secondary">{analysis.details}</Text>
                            </Col>
                          </Row>
                          <Row gutter={16}>
                            <Col span={12}>
                              <Text strong>Ngày phân tích:</Text>
                              <br />
                              <Text type="secondary">
                                {analysis.analyzedAt ? new Date(analysis.analyzedAt).toLocaleString('vi-VN') : 'N/A'}
                              </Text>
                            </Col>
                            <Col span={12}>
                              <Text strong>Người phân tích:</Text>
                              <br />
                              <Text type="secondary">{analysis.analyzedBy}</Text>
                            </Col>
                          </Row>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: 32 }}>
                          <Text type="secondary">Chưa có kết quả phân tích</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            Nhấn nút "Phân tích tài liệu" để bắt đầu phân tích
                          </Text>
                        </div>
                      )}
                      

                    </div>
                  )
                },
                {
                  key: "3",
                  label: "Lịch sử thay đổi",
                  children: (
                    <div style={{ padding: '16px 0' }}>
                      <div style={{ marginBottom: 16 }}>
                        <Text strong style={{ fontSize: 16 }}>Lịch sử thay đổi tài liệu</Text>
                      </div>
                      
                      {/* Lịch sử thay đổi từ chaincode GetHistoryForKey */}
                      <div style={{ marginBottom: 16 }}>
                        <Text strong style={{ fontSize: 16 }}>Lịch sử thay đổi tài liệu</Text>
                      </div>
                      
                      {documentHistory && documentHistory.length > 0 ? (
                        <div>
                          {documentHistory.map((item, index) => (
                            <div key={index} style={{ 
                              background: '#fff', 
                              border: '1px solid #e8e8e8', 
                              borderRadius: '8px', 
                              padding: '16px',
                              marginBottom: '12px'
                            }}>
                              <Row gutter={16}>
                                <Col span={24}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <Tag color={item.isDelete ? 'red' : 'blue'}>
                                      {item.isDelete ? 'Đã xóa' : 'Thay đổi'}
                                    </Tag>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                      {item.timestamp ? new Date(item.timestamp.seconds * 1000).toLocaleString('vi-VN') : 'N/A'}
                                    </Text>
                                  </div>
                                </Col>
                              </Row>
                              
                              <Row gutter={16}>
                                <Col span={12}>
                                  <Text strong>Transaction ID:</Text>
                                  <br />
                                  <Text type="secondary" style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                                    {item.txId}
                                  </Text>
                                </Col>
                                <Col span={12}>
                                  <Text strong>Tiêu đề:</Text>
                                  <br />
                                  <Text type="secondary">{item.document?.title || 'N/A'}</Text>
                                </Col>
                              </Row>
                              
                              <Row gutter={16} style={{ marginTop: 8 }}>
                                <Col span={12}>
                                  <Text strong>Loại tài liệu:</Text>
                                  <br />
                                  <Tag color="blue">{item.document?.type || 'N/A'}</Tag>
                                </Col>
                                <Col span={12}>
                                  <Text strong>Trạng thái xác thực:</Text>
                                  <br />
                                  <Tag color={item.document?.status === 'VERIFIED' ? 'green' : (item.document?.status === 'REJECTED' ? 'red' : 'orange')}>
                                    {item.document?.status === 'VERIFIED' ? 'Đã thẩm định' : (item.document?.status === 'REJECTED' ? 'Không hợp lệ' : 'Chờ xác thực')}
                                  </Tag>
                                </Col>
                              </Row>
                              
                              <Row gutter={16} style={{ marginTop: 8 }}>
                                <Col span={12}>
                                  <Text strong>Người xác thực:</Text>
                                  <br />
                                  <Text type="secondary">{item.document?.verifiedBy || 'Chưa có'}</Text>
                                </Col>
                                <Col span={12}>
                                  <Text strong>Ngày xác thực:</Text>
                                  <br />
                                  <Text type="secondary">
                                    {item.document?.verifiedAt && item.document.verifiedAt !== '0001-01-01T00:00:00Z' ? 
                                      new Date(item.document.verifiedAt).toLocaleString('vi-VN') : 'Chưa có'
                                    }
                                  </Text>
                                </Col>
                              </Row>
                              
                              <Row gutter={16} style={{ marginTop: 8 }}>
                                <Col span={12}>
                                  <Text strong>Người upload:</Text>
                                  <br />
                                  <Text type="secondary">{item.document?.uploadedBy || 'N/A'}</Text>
                                </Col>
                                <Col span={12}>
                                  <Text strong>Ngày tạo:</Text>
                                  <br />
                                  <Text type="secondary">
                                    {item.document?.createdAt ? new Date(item.document.createdAt).toLocaleString('vi-VN') : 'N/A'}
                                  </Text>
                                </Col>
                              </Row>
                              
                              <Row gutter={16} style={{ marginTop: 8 }}>
                                <Col span={12}>
                                  <Text strong>Ngày cập nhật:</Text>
                                  <br />
                                  <Text type="secondary">
                                    {item.document?.updatedAt ? new Date(item.document.updatedAt).toLocaleString('vi-VN') : 'N/A'}
                                  </Text>
                                </Col>
                                <Col span={12}>
                                  <Text strong>IPFS Hash:</Text>
                                  <br />
                                  <Text type="secondary" style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                                    {item.document?.ipfsHash || 'N/A'}
                                  </Text>
                                </Col>
                              </Row>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ 
                          background: '#f9f9f9', 
                          border: '1px solid #e8e8e8', 
                          borderRadius: '8px', 
                          padding: '32px',
                          textAlign: 'center'
                        }}>
                          <Text type="secondary">Chưa có lịch sử thay đổi</Text>
                        </div>
                      )}
                      
                      <div style={{ 
                        background: '#f0f8ff', 
                        border: '1px solid #d6e4ff', 
                        borderRadius: '8px', 
                        padding: '16px',
                        marginTop: '16px'
                      }}>
                        <Text type="success">✓ Tài liệu đã được xác thực tự động</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Xác thực bởi người tạo khi tạo tài liệu
                        </Text>
                      </div>
                    </div>
                  )
                }

              ]}
            />
          </div>
        )}
      </Modal>
      
      {/* Online Document Viewer */}
      <OnlineDocumentViewer
        visible={onlineViewerOpen}
        onCancel={() => setOnlineViewerOpen(false)}
        document={selected}
      />
    </Card>
  );
};

export default DocumentManagementPage;
