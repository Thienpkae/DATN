import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Space, Tag, message, Row, Col, Tooltip, Upload, Progress, Divider, Tabs, Typography } from 'antd';
import { EditOutlined, SearchOutlined, ReloadOutlined, EyeOutlined, DeleteOutlined, DownloadOutlined, UploadOutlined, FileTextOutlined, CloudUploadOutlined, CheckOutlined, ClearOutlined } from '@ant-design/icons';
import documentService from '../../../services/documentService';
import ipfsService from '../../../services/ipfs';
import { useAuth } from '../../../hooks/useAuth';

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Text } = Typography;

const DocumentManagementPage = () => {
  const { user } = useAuth();
  const [selected, setSelected] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [filters, setFilters] = useState({
    keyword: '',
    docType: undefined,
    verified: undefined
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [editForm] = Form.useForm();
  const [form] = Form.useForm();
  const [analysis, setAnalysis] = useState(null);

  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      const docs = await documentService.getAllDocumentsWithMetadata();
      setDocuments(docs);
    } catch (e) {
      message.error(e.message || 'Lỗi khi tải danh sách tài liệu');
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
      const searchParams = {};
      if (filters.keyword) searchParams.keyword = filters.keyword;
      if (filters.docType) searchParams.type = filters.docType; // Backend dùng 'type'
      if (filters.verified !== undefined) searchParams.verified = filters.verified;
      
      const docs = await documentService.searchDocuments(searchParams);
      setDocuments(docs);
    } catch (e) {
      message.error(e.message || 'Lỗi khi tìm kiếm');
    } finally {
      setLoading(false);
    }
  };

  const onReset = () => {
    setFilters({
      keyword: '',
      docType: '',
      verified: undefined
    });
    loadList();
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
      
      // Generate document ID
      const timestamp = Date.now();
      const docID = `DOC_${timestamp}`;
      
      // Upload to IPFS
      const uploadResult = await ipfsService.uploadDocumentToIPFS(
        selectedFile,
        {
          docID,
          title: values.title,
          description: values.description,
          docType: values.docType
        },
        (progress) => setUploadProgress(progress)
      );
      
      // Create document
      await documentService.createDocument({
        id: docID, // Backend expect 'id'
        type: values.docType, // Backend expect 'type'
        title: values.title,
        description: values.description,
        ipfsHash: uploadResult.fileHash,
        metadataHash: uploadResult.metadataHash,
        fileType: selectedFile.type || selectedFile.name.split('.').pop().toUpperCase(),
        fileSize: selectedFile.size
      });
      
      message.success('Tạo tài liệu thành công');
      setCreateOpen(false);
      form.resetFields();
      setSelectedFile(null);
      setFileList([]);
      loadList();
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
      await documentService.updateDocument(selected.id, {
        title: values.title,
        description: values.description,
        type: values.docType // Backend expect 'type'
      });
      message.success('Cập nhật tài liệu thành công');
      setLoading(false);
      setEditOpen(false);
      loadList();
    } catch (e) {
      message.error(e.message || 'Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };



  const onAnalyze = async (docID) => {
    try {
      setLoading(true);
      const result = await documentService.analyzeDocument(docID);
      setAnalysis(result);
      message.success('Phân tích tài liệu thành công');
    } catch (e) {
      message.error(e.message || 'Phân tích thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = useCallback(async (record) => {
    try {
      if (!record.ipfsHash) {
        message.error('Không có file để tải');
        return;
      }
      
      await ipfsService.downloadFileFromIPFS(record.ipfsHash, record.title || 'document');
      message.success('Tải file thành công');
    } catch (e) {
      message.error(e.message || 'Tải file thất bại');
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

  const handleDelete = useCallback(async (record) => {
    try {
      await documentService.deleteDocument(record.id);
      message.success('Xóa tài liệu thành công');
      loadList();
    } catch (e) {
      message.error(e.message || 'Xóa thất bại');
    }
  }, [loadList]);

  const handleVerify = useCallback(async (record) => {
    try {
      Modal.confirm({
        title: 'Xác thực tài liệu',
        content: `Bạn có chắc chắn muốn xác thực tài liệu "${record.title}"?`,
        okText: 'Xác thực',
        cancelText: 'Hủy',
        onOk: async () => {
          setLoading(true);
          try {
            await documentService.verifyDocument(record.id, user?.cccd || 'Unknown');
            message.success('Xác thực tài liệu thành công');
            loadList();
          } catch (e) {
            message.error(e.message || 'Xác thực thất bại');
          } finally {
            setLoading(false);
          }
        }
      });
    } catch (e) {
      message.error(e.message || 'Lỗi khi xác thực');
    }
  }, [loadList, user?.cccd]);

  const columns = useMemo(() => ([
    { title: 'Mã tài liệu', dataIndex: 'id', key: 'id', render: v => <code>{v}</code> },
    { title: 'Tiêu đề', dataIndex: 'title', key: 'title' },
    { title: 'Loại', dataIndex: 'type', key: 'type', render: v => <Tag color="blue">{v}</Tag> },
    { title: 'Trạng thái', dataIndex: 'verified', key: 'verified', render: v => v ? <Tag color="green">Đã xác thực</Tag> : <Tag color="orange">Chờ xác thực</Tag> },
    { title: 'Loại file', dataIndex: 'fileType', key: 'fileType', render: v => <Tag color="blue">{v}</Tag> },
    { title: 'Kích thước', dataIndex: 'fileSize', key: 'fileSize', render: v => v ? `${(v / 1024).toFixed(2)} KB` : 'N/A' },
    { title: 'Người upload', dataIndex: 'uploadedBy', key: 'uploadedBy' },
    {
      title: 'Thao tác', key: 'actions', fixed: 'right', render: (_, record) => (
        <Space>
          <Tooltip title="Tải về">
            <Button icon={<DownloadOutlined />} onClick={() => handleDownload(record)} />
          </Tooltip>
          <Tooltip title="Xem chi tiết">
            <Button icon={<EyeOutlined />} onClick={() => openDetail(record)} />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button icon={<EditOutlined />} onClick={() => {
              setSelected(record);
              editForm.setFieldsValue({
                title: record.title,
                description: record.description,
                docType: record.type
              });
              setEditOpen(true);
            }} />
          </Tooltip>

          <Tooltip title="Xóa">
            <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record)} />
          </Tooltip>
        </Space>
      )
    }
  ]), [editForm, handleDelete, handleDownload]);

  const openDetail = (record) => {
    setSelected(record);
    setDetailOpen(true);
  };

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
            <Option value="CERTIFICATE">Giấy chứng nhận</Option>
            <Option value="CONTRACT">Hợp đồng</Option>
            <Option value="REPORT">Báo cáo</Option>
            <Option value="OTHER">Khác</Option>
          </Select>
          <Select placeholder="Trạng thái xác thực" allowClear style={{ width: 150 }} value={filters.verified} onChange={(v) => setFilters({ ...filters, verified: v })}>
            <Option value={true}>Đã xác thực</Option>
            <Option value={false}>Chờ xác thực</Option>
          </Select>
          <Button icon={<SearchOutlined />} onClick={onSearch}>Tìm kiếm</Button>
          <Button icon={<ClearOutlined />} onClick={onReset}>Reset</Button>
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
                  <Option value="CERTIFICATE">Giấy chứng nhận</Option>
                  <Option value="CONTRACT">Hợp đồng</Option>
                  <Option value="REPORT">Báo cáo</Option>
                  <Option value="OTHER">Khác</Option>
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
            <Col span={12}>
              <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Input placeholder="Nhập tiêu đề tài liệu" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="docType" label="Loại tài liệu" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Select placeholder="Chọn loại">
                  <Option value="CERTIFICATE">Giấy chứng nhận</Option>
                  <Option value="CONTRACT">Hợp đồng</Option>
                  <Option value="REPORT">Báo cáo</Option>
                  <Option value="OTHER">Khác</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Mô tả">
            <TextArea rows={4} placeholder="Nhập mô tả tài liệu" />
          </Form.Item>
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
            <Tabs defaultActiveKey="1">
                             <TabPane tab="Thông tin cơ bản" key="1">
                 <div style={{ padding: '16px 0' }}>
                   <Row gutter={24}>
                     <Col span={24}>
                       <div style={{ marginBottom: 24, padding: '20px 0', borderBottom: '1px solid #f0f0f0' }}>
                         <Text strong style={{ fontSize: 18 }}>{selected.title}</Text>
                         <br />
                         <Text type="secondary" style={{ fontSize: 13 }}>Mã: <code>{selected.id}</code></Text>
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
                             <Tag color="green">Đã xác thực</Tag>
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
                         <Tag color="blue" style={{ marginTop: 6 }}>{selected.fileType}</Tag>
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
                           {selected.metadata ? selected.metadata.originalDescription : selected.description}
                         </Text>
                       </div>
                     </Col>
                   </Row>
                 </div>
               </TabPane>
              
                             <TabPane tab="Metadata IPFS" key="2">
                 <div style={{ padding: '16px 0' }}>
                   {selected.metadata ? (
                     <div>
                       <Row gutter={24}>
                         <Col span={24}>
                           <div style={{ marginBottom: 24, padding: '20px 0', borderBottom: '1px solid #f0f0f0' }}>
                             <Text strong style={{ fontSize: 16 }}>IPFS Metadata</Text>
                           </div>
                         </Col>
                       </Row>
                       
                       <Row gutter={24}>
                         <Col span={24}>
                           <div style={{ marginBottom: 16 }}>
                             <Text strong>Hash file gốc</Text>
                             <br />
                             <div style={{ marginTop: 6, padding: 8, background: '#f5f5f5', borderRadius: 4, fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>
                               <Text copyable type="secondary">{selected.ipfsHash}</Text>
                             </div>
                           </div>
                         </Col>
                       </Row>
                       
                       <Row gutter={24}>
                         <Col span={24}>
                           <div style={{ marginBottom: 16 }}>
                             <Text strong>Hash metadata</Text>
                             <br />
                             <div style={{ marginTop: 6, padding: 8, background: '#f5f5f5', borderRadius: 4, fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>
                               <Text copyable type="secondary">{selected.metadata.metadataHash}</Text>
                             </div>
                           </div>
                         </Col>
                       </Row>
                       
                       <Row gutter={24}>
                         <Col span={12}>
                           <div style={{ marginBottom: 16 }}>
                             <Text strong>Mô tả gốc</Text>
                             <br />
                             <Text type="secondary" style={{ marginTop: 6, display: 'block', lineHeight: 1.6 }}>
                               {selected.metadata.originalDescription}
                             </Text>
                           </div>
                         </Col>
                         <Col span={12}>
                           <div style={{ marginBottom: 16 }}>
                             <Text strong>Ngày upload metadata</Text>
                             <br />
                             <Text type="secondary" style={{ marginTop: 6, display: 'block' }}>
                               {selected.metadata.metadataUploadedAt ? 
                                 new Date(selected.metadata.metadataUploadedAt).toLocaleString('vi-VN') : 'N/A'
                               }
                             </Text>
                           </div>
                         </Col>
                       </Row>
                       
                       <Row gutter={24}>
                         <Col span={12}>
                           <div style={{ marginBottom: 16 }}>
                             <Text strong>Người upload metadata</Text>
                             <br />
                             <Text type="secondary" style={{ marginTop: 6, display: 'block' }}>
                               {selected.metadata.metadataUploadedBy}
                             </Text>
                           </div>
                         </Col>
                       </Row>
                       
                       <Divider />
                       
                       <div style={{ textAlign: 'center', marginTop: 16 }}>
                         <Button 
                           type="primary" 
                           icon={<DownloadOutlined />}
                           onClick={() => handleDownload(selected)}
                           style={{ marginRight: 12 }}
                         >
                           Tải file từ IPFS
                         </Button>
                         <Button 
                           icon={<EyeOutlined />}
                           onClick={() => window.open(`https://gateway.pinata.cloud/ipfs/${selected.ipfsHash}`, '_blank')}
                         >
                           Xem trực tuyến
                         </Button>
                       </div>
                     </div>
                   ) : (
                     <div style={{ textAlign: 'center', padding: 32 }}>
                       <Text type="secondary" style={{ fontSize: 14 }}>Không có metadata IPFS</Text>
                       <br />
                       <Text type="secondary">Hash file: {selected.ipfsHash || 'N/A'}</Text>
                     </div>
                   )}
                 </div>
               </TabPane>
              
              <TabPane tab="Phân tích tài liệu" key="3">
                                 <div style={{ marginBottom: 16 }}>
                   <Button 
                     type="primary" 
                     icon={<FileTextOutlined />}
                     onClick={() => onAnalyze(selected.id)}
                     loading={loading}
                   >
                     Phân tích tài liệu
                   </Button>
                 </div>
                
                {analysis ? (
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
                   <Text type="secondary">Chưa có kết quả phân tích. Nhấn nút "Phân tích tài liệu" để bắt đầu.</Text>
                 )}
               </TabPane>
               
               <TabPane tab="Xác thực tài liệu" key="4">
                 <Row gutter={16}>
                   <Col span={12}>
                     <Text strong>Trạng thái xác thực:</Text>
                     <br />
                     {selected.verified ? (
                       <Tag color="green">Đã xác thực</Tag>
                     ) : (
                       <Tag color="orange">Chờ xác thực</Tag>
                     )}
                   </Col>
                   <Col span={12}>
                     <Text strong>Người xác thực:</Text>
                     <br />
                     <Text type="secondary">{selected.verifiedBy || 'Chưa có'}</Text>
                   </Col>
                 </Row>
                 <Row gutter={16}>
                   <Col span={12}>
                     <Text strong>Ngày xác thực:</Text>
                     <br />
                     <Text type="secondary">
                       {selected.verifiedAt && selected.verifiedAt !== '0001-01-01T00:00:00Z' ? 
                         new Date(selected.verifiedAt).toLocaleString('vi-VN') : 'Chưa có'
                       }
                     </Text>
                   </Col>
                 </Row>
                 
                 <Divider />
                 
                 <div style={{ marginTop: 16 }}>
                   {!selected.verified ? (
                     <Button 
                       type="primary" 
                       icon={<CheckOutlined />}
                       onClick={() => {
                         setDetailOpen(false);
                         handleVerify(selected);
                       }}
                       loading={loading}
                     >
                       Xác thực tài liệu
                     </Button>
                   ) : (
                     <div>
                       <Text type="success">✓ Tài liệu đã được xác thực</Text>
                       <br />
                       <Text type="secondary" style={{ fontSize: '12px' }}>
                         Xác thực bởi {selected.verifiedBy} vào {selected.verifiedAt ? new Date(selected.verifiedAt).toLocaleString('vi-VN') : 'N/A'}
                       </Text>
                     </div>
                   )}
                 </div>
               </TabPane>
             </Tabs>
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default DocumentManagementPage;
