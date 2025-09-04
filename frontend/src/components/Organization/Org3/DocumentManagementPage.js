import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Space, Tag, message, Row, Col, Tooltip, Badge, Typography, Upload, Progress, Divider, Tabs } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, DownloadOutlined, EditOutlined, DeleteOutlined, CloudUploadOutlined, UploadOutlined } from '@ant-design/icons';
import documentService from '../../../services/documentService';
import ipfsService from '../../../services/ipfs';
import OnlineDocumentViewer from '../../Common/OnlineDocumentViewer';
import { useAuth } from '../../../hooks/useAuth';

const { confirm } = Modal;

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const DocumentManagementPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const defaultFilters = {
    keyword: '',
    docType: undefined,
    status: undefined,
    fileType: undefined
  };
  
  const [filters, setFilters] = useState(defaultFilters);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editForm] = Form.useForm();
  const [form] = Form.useForm();
  const [onlineViewerOpen, setOnlineViewerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [documentHistory, setDocumentHistory] = useState([]);

  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      
      // Org3 chỉ được xem tài liệu của mình
      if (!user?.userId) {
        message.error('Không tìm thấy thông tin người dùng');
        setDocuments([]);
        return;
      }
      
      console.log('Loading documents for user:', user.userId);
      const res = await documentService.getDocumentsByUploader(user.userId);
      console.log('Response from getDocumentsByUploader:', res);
      
      // documentService đã unwrap response.data.data rồi, nên res = { uploaderID, documents, count }
      const data = Array.isArray(res?.documents) ? res.documents : [];
      console.log('Parsed documents data:', data);
      
      setDocuments(data);
    } catch (e) {
      console.error('Error loading documents:', e);
      // Don't show error alert, just set empty documents - UI will show empty state
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    if (user?.userId) {
    loadList();
    }
    
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
  }, [user?.userId, loadList]);

  const onSearch = async () => {
    try {
      setLoading(true);
      
      if (!user?.userId) {
        message.error('Không tìm thấy thông tin người dùng');
        return;
      }
      
      // Org3 tìm kiếm trong tài liệu của mình với filters
      const searchParams = {
        uploaderID: user.userId // Chỉ tìm trong tài liệu của user này
      };
      
      // Thêm các filter khác nếu có
      if (filters.keyword) searchParams.keyword = filters.keyword;
      if (filters.docType) searchParams.type = filters.docType;
      if (filters.status) searchParams.verified = filters.status === 'verified';
      if (filters.fileType) searchParams.fileType = filters.fileType;
      
      const res = await documentService.searchDocuments(searchParams);
      const data = Array.isArray(res?.documents) ? res.documents : (Array.isArray(res) ? res : []);
      setDocuments(data);
    } catch (e) {
      message.error(e.message || 'Tìm kiếm thất bại');
    } finally {
      setLoading(false);
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

  const onCreate = async () => {
    try {
      const values = await form.validateFields();
      if (!selectedFile) {
        message.error('Vui lòng chọn file');
        return;
      }
      
      setUploading(true);
      setUploadProgress(0);
      
      // Use docID from form
      const docID = values.docID;
      
      // Upload file to IPFS
      const ipfsHash = await ipfsService.uploadFileToIPFS(selectedFile, (progress) => setUploadProgress(progress));
      
      // Create document (Org3 tạo tài liệu sẽ chờ xác thực)
      await documentService.createDocument({
        docID: docID,
        docType: values.docType,
        title: values.title,
        description: values.description,
        ipfsHash: ipfsHash,
        fileType: selectedFile.type || selectedFile.name.split('.').pop().toUpperCase(),
        fileSize: selectedFile.size,
        status: 'PENDING' // Org3 tạo tài liệu sẽ chờ xác thực
      });
      
      message.success('Tạo tài liệu thành công');
      setCreateOpen(false);
      form.resetFields();
      setSelectedFile(null);
      setFileList([]);
      loadList();
      
      // Dispatch custom event to notify other pages to refresh
      window.dispatchEvent(new CustomEvent('documentCreated', {
        detail: { documentId: docID }
      }));
    } catch (e) {
      message.error(e.message || 'Tạo tài liệu thất bại');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

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

  const loadDocumentHistory = useCallback(async (docID) => {
    try {
      const history = await documentService.getDocumentHistory(docID);
      setDocumentHistory(Array.isArray(history) ? history : []);
    } catch (e) {
      console.error('Error loading document history:', e);
      setDocumentHistory([]);
    }
  }, []);

  const columns = useMemo(() => ([
    { title: 'Mã tài liệu', dataIndex: 'docID', key: 'docID' },
    { title: 'Tiêu đề', dataIndex: 'title', key: 'title' },
    { title: 'Loại', dataIndex: 'type', key: 'type', render: v => <Tag>{v}</Tag> },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status', 
      key: 'status', 
      render: v => {
        if (v === 'VERIFIED') return <Badge status="success" text="Đã thẩm định" />;
        if (v === 'REJECTED') return <Badge status="error" text="Không hợp lệ" />;
        return <Badge status="processing" text="Chờ xác thực" />;
      }
    },
    { title: 'Loại file', dataIndex: 'fileType', key: 'fileType', render: v => <Tag color="blue">{documentService.getDisplayFileType(v)}</Tag> },
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
              loadDocumentHistory(record.docID);
            }} />
          </Tooltip>

          <Tooltip title={record.uploadedBy !== user?.userId ? "Chỉ người upload mới được sửa" : "Sửa"}>
            <Button 
              icon={<EditOutlined />} 
              onClick={() => {
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
  ]), [handleDownload, handleDelete, user?.userId, editForm, loadDocumentHistory]);

  return (
    <Card
      title="Quản lý tài liệu (Org3)"
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
        locale={{
          emptyText: (
            <div style={{ padding: '40px 0' }}>
              <div style={{ fontSize: '16px', color: '#595959', marginBottom: '8px' }}>
                Bạn chưa sở hữu tài liệu nào
              </div>
              <div style={{ fontSize: '14px', color: '#8c8c8c' }}>
                Hãy upload tài liệu đầu tiên của bạn bằng cách nhấn nút "Upload tài liệu"
              </div>
            </div>
          )
        }}
      />



      {/* Detail Modal */}
      <Modal 
        title="Chi tiết tài liệu" 
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
                              {selected.verified ? (
                                <Tag color="green">Đã thẩm định</Tag>
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
                                onClick={() => setOnlineViewerOpen(true)}
                              >
                                Xem trực tuyến
                              </Button>
                  <Button 
                    icon={<DownloadOutlined />} 
                    onClick={() => handleDownload(selected)}
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
                  label: "Lịch sử thay đổi",
                  children: (
                    <div style={{ padding: '16px 0' }}>
                      <div style={{ marginBottom: 16 }}>
                        <Text strong style={{ fontSize: 16 }}>Lịch sử thay đổi tài liệu</Text>
                </div>
                      
                      {/* Lịch sử thay đổi từ chaincode GetHistoryForKey */}
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
                                  <Tag color={item.document?.verified ? 'green' : 'orange'}>
                                    {item.document?.verified ? 'Đã xác thực' : 'Chờ xác thực'}
                                  </Tag>
                                </Col>
                              </Row>
                              
                              {item.document?.description && (
                                <Row gutter={16} style={{ marginTop: 8 }}>
                                  <Col span={24}>
                                    <Text strong>Mô tả:</Text>
                                    <br />
                                    <Text type="secondary" style={{ lineHeight: 1.6 }}>
                                      {item.document.description}
                                    </Text>
                                  </Col>
                                </Row>
                              )}
                              
                              {item.document?.ipfsHash && (
                                <Row gutter={16} style={{ marginTop: 8 }}>
                                  <Col span={24}>
                                    <Text strong>IPFS Hash:</Text>
                                    <br />
                                    <div style={{ marginTop: 4, padding: 8, background: '#f5f5f5', borderRadius: 4, fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>
                                      <Text type="secondary">{item.document.ipfsHash}</Text>
              </div>
                                  </Col>
                                </Row>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: 32 }}>
                          <Text type="secondary" style={{ fontSize: 14 }}>
                            Không có lịch sử thay đổi nào được tìm thấy
                          </Text>
              </div>
            )}
                      
                      <Divider />
                      
                      <Row gutter={24}>
                        <Col span={12}>
                          <div style={{ marginBottom: 16 }}>
                            <Text strong>Ngày tạo</Text>
                            <br />
                            <Text type="secondary" style={{ marginTop: 6, display: 'block' }}>
                              {selected.createdAt ? new Date(selected.createdAt).toLocaleString('vi-VN') : 'N/A'}
                            </Text>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ marginBottom: 16 }}>
                            <Text strong>Ngày cập nhật cuối</Text>
                            <br />
                            <Text type="secondary" style={{ marginTop: 6, display: 'block' }}>
                              {selected.updatedAt ? new Date(selected.updatedAt).toLocaleString('vi-VN') : 'N/A'}
                            </Text>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  )
                }
              ]}
            />
          </div>
        )}
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

      {/* Create Document */}
      <Modal title="Tạo tài liệu mới" open={createOpen} onOk={onCreate} onCancel={() => setCreateOpen(false)} confirmLoading={uploading} width={720}>
        <Form layout="vertical" form={form}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="docID" label="Mã tài liệu" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Input placeholder="Nhập mã tài liệu" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Input placeholder="Nhập tiêu đề tài liệu" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
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
