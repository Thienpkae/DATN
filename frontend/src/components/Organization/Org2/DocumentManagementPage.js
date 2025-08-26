import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Space, Tag, message, Row, Col, Tooltip, Upload, Progress, Divider, Tabs, Typography } from 'antd';
import { EditOutlined, SearchOutlined, ReloadOutlined, EyeOutlined, DeleteOutlined, DownloadOutlined, UploadOutlined, FileTextOutlined, CloudUploadOutlined } from '@ant-design/icons';
import documentService from '../../../services/documentService';
import ipfsService from '../../../services/ipfs';
import landService from '../../../services/landService';
import landTypeMatchService from '../../../services/landTypeMatchService';
import OnlineDocumentViewer from '../../Common/OnlineDocumentViewer';
import { useAuth } from '../../../hooks/useAuth';

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
  const [documentHistory, setDocumentHistory] = useState([]);
  const [blockchainData, setBlockchainData] = useState(null);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [onlineViewerOpen, setOnlineViewerOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');



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
      if (filters.verified !== undefined) searchParams.verified = filters.verified;
      
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
      
      // Use docID from form
      const docID = values.docID;
      
      // Upload file to IPFS
      const ipfsHash = await ipfsService.uploadFileToIPFS(selectedFile, (progress) => setUploadProgress(progress));
      
      // Create document (Org2 tạo tài liệu sẽ chờ xác thực)
      await documentService.createDocument({
        docID: docID,
        docType: values.docType,
        title: values.title,
        description: values.description,
        ipfsHash: ipfsHash,
        fileType: selectedFile.type || selectedFile.name.split('.').pop().toUpperCase(),
        fileSize: selectedFile.size,
        verified: false, // Org2 tạo tài liệu sẽ chờ xác thực
        verifiedBy: null
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
      setLoading(true);
      const result = await documentService.analyzeDocument(docID);
      // Extract the analysis data from the response
      if (result.success && result.data && result.data.analysis) {
        const analysisData = result.data.analysis;
        setAnalysis(analysisData);
        
        // Tự động so sánh với blockchain sau khi phân tích xong
        await performBlockchainComparison(analysisData);
        
        message.success('Phân tích và so sánh tài liệu hoàn tất');
      } else {
        throw new Error('Dữ liệu phân tích không hợp lệ');
      }
    } catch (e) {
      message.error(e.message || 'Phân tích thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Helper function để thực hiện so sánh blockchain (dùng chung cho onAnalyze và onCompareWithBlockchain)
  const performBlockchainComparison = async (analysisData) => {
    if (!analysisData || !analysisData.extractedInfo) {
      throw new Error('Dữ liệu phân tích không hợp lệ');
    }
    
    try {
      console.log('Starting blockchain comparison...');
      
      // 1. Lấy thông tin land theo LandID từ blockchain API
      const landID = analysisData.extractedInfo.landParcelID;
      console.log('Querying land with ID:', landID);
      
      if (!landID) {
        throw new Error('Không tìm thấy LandID trong tài liệu');
      }
      
      const landInfo = await landService.getLandParcel(landID);
      console.log('Land info from blockchain:', landInfo);
      
      if (!landInfo) {
        throw new Error(`Không tìm thấy thông tin thửa đất ${landID} trên blockchain`);
      }
      
      // 2. Tổng hợp thông tin blockchain (bỏ tên chủ sử dụng, thêm area và địa chỉ)
      const blockchainDataObj = {
        landID: landID,
        landType: landInfo?.landUsePurpose || landInfo?.purpose || 'Không tìm thấy',
        legalStatus: landInfo?.legalStatus || 'Không tìm thấy',
        area: landInfo?.area || landInfo?.landArea || 'Không tìm thấy',
        location: landInfo?.location || landInfo?.address || 'Không tìm thấy',
        cccd: landInfo?.ownerID || landInfo?.ownerId || 'Không tìm thấy'
      };
      
      console.log('Blockchain data object:', blockchainDataObj);
      setBlockchainData(blockchainDataObj);
      
      // 3. Tính toán độ match với land type matching service
      const result = calculateMatch(analysisData.extractedInfo, blockchainDataObj);
      console.log('Match result:', result);
      setComparisonResult(result);
      
    } catch (e) {
      console.error('Error in performBlockchainComparison:', e);
      throw e; // Re-throw để caller handle
    }
  };



  const calculateMatch = (extracted, blockchain) => {
    const fields = [
      { 
        name: 'LandID', 
        extracted: extracted.landParcelID, 
        blockchain: blockchain.landID, 
        weight: 4,
        type: 'exact'
      },
      { 
        name: 'Loại đất', 
        extracted: extracted.landType, 
        blockchain: blockchain.landType,
        weight: 3,
        type: 'landType'
      },
      { 
        name: 'Diện tích', 
        extracted: extracted.landArea, 
        blockchain: blockchain.area, 
        weight: 2,
        type: 'number'
      },
      { 
        name: 'Địa chỉ', 
        extracted: extracted.landLocation, 
        blockchain: blockchain.location, 
        weight: 2,
        type: 'location'
      },
      { 
        name: 'CCCD', 
        extracted: extracted.cccd, 
        blockchain: blockchain.cccd, 
        weight: 3,
        type: 'exact'
      }
    ];
    
    let totalScore = 0;
    let maxScore = 0;
    let matchedFields = 0;
    const details = [];
    
    fields.forEach(field => {
      maxScore += field.weight;
      
      if (!field.extracted || !field.blockchain) {
        details.push(`⚠️ ${field.name}: Thiếu thông tin`);
        return;
      }
      
      let isMatch = false;
      
      switch (field.type) {
        case 'exact':
          isMatch = field.extracted.toString().toLowerCase() === field.blockchain.toString().toLowerCase();
          break;
          
        case 'landType':
          // Sử dụng land type matching service
          isMatch = landTypeMatchService.isMatch(field.blockchain, field.extracted);
          break;
          
        case 'number':
          // So sánh số (có thể chênh lệch 5%)
          const extractedNum = parseFloat(field.extracted);
          const blockchainNum = parseFloat(field.blockchain);
          if (!isNaN(extractedNum) && !isNaN(blockchainNum)) {
            const diff = Math.abs(extractedNum - blockchainNum);
            const tolerance = Math.max(extractedNum, blockchainNum) * 0.05; // 5% tolerance
            isMatch = diff <= tolerance;
          }
          break;
          
        case 'location':
          // So sánh địa chỉ (flexible matching)
          const extractedLoc = field.extracted.toString().toLowerCase();
          const blockchainLoc = field.blockchain.toString().toLowerCase();
          isMatch = extractedLoc.includes(blockchainLoc) || 
                   blockchainLoc.includes(extractedLoc) ||
                   extractedLoc === blockchainLoc;
          break;
          
        default:
          isMatch = field.extracted.toString().toLowerCase() === field.blockchain.toString().toLowerCase();
      }
      
      if (isMatch) {
        totalScore += field.weight;
        matchedFields++;
        details.push(`✅ ${field.name}: Khớp (${field.extracted})`);
      } else {
        details.push(`❌ ${field.name}: Không khớp (Tài liệu: ${field.extracted}, Blockchain: ${field.blockchain})`);
      }
    });
    
    const matchPercentage = Math.round((totalScore / maxScore) * 100);
    
    // Đưa ra đề xuất
    let recommendation = 'review';
    if (matchPercentage >= 80) {
      recommendation = 'verify';
    } else if (matchPercentage <= 30) {
      recommendation = 'reject';
    }
    
    return {
      matchPercentage,
      matchedFields,
      totalFields: fields.length,
      recommendation,
      details
    };
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

  const openDetail = useCallback((record) => {
    setSelected(record);
    setDetailOpen(true);
    // Load document history when opening detail
    if (record.docID) {
      loadDocumentHistory(record.docID);
    }
  }, [loadDocumentHistory]);

  const handleVerifyDocument = (document) => {
    setSelected(document);
    setVerificationNotes('');
    setVerifyModalOpen(true);
  };

  const handleRejectDocument = (document) => {
    setSelected(document);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const onVerifyDocument = async () => {
    if (!verificationNotes.trim()) {
      message.error('Vui lòng nhập ghi chú xác thực');
      return;
    }

    try {
      setLoading(true);
      await documentService.verifyDocument(selected.docID, verificationNotes);
      message.success('Xác thực tài liệu thành công');
      setVerifyModalOpen(false);
      setVerificationNotes('');
      
      // Cập nhật selected object với thông tin mới
      const updatedDocument = {
        ...selected,
        verified: true,
        verifiedBy: user?.userId || 'N/A',
        verifiedAt: new Date().toISOString()
      };
      setSelected(updatedDocument);
      
      loadList(); // Refresh list
    } catch (error) {
      message.error(error.message || 'Lỗi khi xác thực tài liệu');
    } finally {
      setLoading(false);
    }
  };

  const onRejectDocument = async () => {
    if (!rejectionReason.trim()) {
      message.error('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      setLoading(true);
      await documentService.rejectDocument(selected.docID, rejectionReason);
      message.success('Từ chối tài liệu thành công');
      setRejectModalOpen(false);
      setRejectionReason('');
      
      // Cập nhật selected object với thông tin mới
      const updatedDocument = {
        ...selected,
        verified: false,
        verifiedBy: '',
        verifiedAt: '0001-01-01T00:00:00Z'
      };
      setSelected(updatedDocument);
      
      loadList(); // Refresh list
    } catch (error) {
      message.error(error.message || 'Lỗi khi từ chối tài liệu');
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(() => ([
    { title: 'Mã tài liệu', dataIndex: 'docID', key: 'docID', render: v => <code>{v}</code> },
    { title: 'Tiêu đề', dataIndex: 'title', key: 'title' },
    { title: 'Loại', dataIndex: 'type', key: 'type', render: v => <Tag color="blue">{v}</Tag> },
    { title: 'Trạng thái', dataIndex: 'verified', key: 'verified', render: v => v ? <Tag color="green">Đã xác thực</Tag> : <Tag color="orange">Chờ xác thực</Tag> },
    { title: 'Loại file', dataIndex: 'fileType', key: 'fileType', render: v => <Tag color="blue">{documentService.getDisplayFileType(v)}</Tag> },
    { title: 'Kích thước', dataIndex: 'fileSize', key: 'fileSize', render: v => v ? `${(v / 1024).toFixed(2)} KB` : 'N/A' },
    { title: 'Người upload', dataIndex: 'uploadedBy', key: 'uploadedBy' },
    {
      title: 'Thao tác', key: 'actions', fixed: 'right', render: (_, record) => (
        <Space>
          <Tooltip title="Tải về">
            <Button icon={<DownloadOutlined />} onClick={() => handleDownload(record)} />
          </Tooltip>
          <Tooltip title="Xem chi tiết">
            <Button icon={<FileTextOutlined />} onClick={() => openDetail(record)} />
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
  ]), [editForm, handleDelete, handleDownload, openDetail, user?.userId]);

  return (
    <Card
      title="Quản lý tài liệu (Org2)"
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
                Chưa có tài liệu nào cần xác thực
              </div>
              <div style={{ fontSize: '14px', color: '#8c8c8c' }}>
                Các tài liệu được upload sẽ hiển thị ở đây để bạn xác thực
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
                                disabled={!selected.ipfsHash}
                                size="large"
                              >
                                Xem trực tuyến
                              </Button>
                              <Button 
                                icon={<DownloadOutlined />}
                                onClick={() => handleDownload(selected)}
                                disabled={!selected.ipfsHash}
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
                          loading={loading}
                        >
                          Phân tích tài liệu với Gemini
                        </Button>
              </div>
                      
                      {analysis ? (
                        <div>
                          {/* Thông tin phân tích cơ bản */}
                          <Row gutter={16}>
                            <Col span={24}>
                              <Text strong>Độ tin cậy:</Text>
                              <br />
                              <Text type="secondary">{analysis.confidence || 'N/A'}%</Text>
                            </Col>
                          </Row>
                          

                          
                          {/* Bảng so sánh thông tin xác thực */}
                          {blockchainData && analysis.extractedInfo && (
              <div style={{ marginTop: 16 }}>
                              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                                <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
                                  🔍 So sánh thông tin xác thực
                                </Text>
                              </div>
                                  
                                  {/* Header */}
                                  <Row gutter={24} style={{ marginBottom: '20px' }}>
                                    <Col span={12}>
                                      <Text strong style={{ fontSize: '16px', color: '#1890ff', display: 'block', textAlign: 'center' }}>
                                        📄 Thông tin từ Gemini
                                      </Text>
                                    </Col>
                                    <Col span={12}>
                                      <Text strong style={{ fontSize: '16px', color: '#52c41a', display: 'block', textAlign: 'center' }}>
                                        ⛓️ Thông tin từ Blockchain
                                      </Text>
                                    </Col>
                                  </Row>
                                  
                                  {/* Mã thửa đất */}
                                  <Row gutter={24} style={{ marginBottom: '20px' }}>
                                    <Col span={12}>
                                      <Text strong>Mã thửa đất: </Text>
                                      <Text style={{ fontSize: '16px' }}>
                                        {analysis.extractedInfo.landParcelID || 'Không tìm thấy'}
                                      </Text>
                                    </Col>
                                    <Col span={12}>
                                      <Text strong>Mã thửa đất: </Text>
                                      <Text style={{ 
                                        fontSize: '16px',
                                        color: blockchainData.landID === analysis.extractedInfo.landParcelID ? '#52c41a' : '#ff4d4f'
                                      }}>
                                        {blockchainData.landID || 'Không tìm thấy'}
                                        {blockchainData.landID === analysis.extractedInfo.landParcelID ? ' ✅' : ' ❌'}
                                      </Text>
                                    </Col>
                                  </Row>
                                    
                                  {/* Diện tích */}
                                  <Row gutter={24} style={{ marginBottom: '20px' }}>
                                    <Col span={12}>
                                      <Text strong>Diện tích: </Text>
                                      <Text style={{ fontSize: '16px' }}>
                                        {analysis.extractedInfo.landArea || 'Không tìm thấy'} m²
                                      </Text>
                                    </Col>
                                    <Col span={12}>
                                      <Text strong>Diện tích: </Text>
                                      <Text style={{ 
                                        fontSize: '16px',
                                        color: (() => {
                                          const extractedNum = parseFloat(analysis.extractedInfo.landArea);
                                          const blockchainNum = parseFloat(blockchainData.area);
                                          if (!isNaN(extractedNum) && !isNaN(blockchainNum)) {
                                            const diff = Math.abs(extractedNum - blockchainNum);
                                            const tolerance = Math.max(extractedNum, blockchainNum) * 0.05;
                                            return diff <= tolerance ? '#52c41a' : '#ff4d4f';
                                          }
                                          return '#ff4d4f';
                                        })()
                                      }}>
                                        {blockchainData.area || 'Không tìm thấy'} m²
                                        {(() => {
                                          const extractedNum = parseFloat(analysis.extractedInfo.landArea);
                                          const blockchainNum = parseFloat(blockchainData.area);
                                          if (!isNaN(extractedNum) && !isNaN(blockchainNum)) {
                                            const diff = Math.abs(extractedNum - blockchainNum);
                                            const tolerance = Math.max(extractedNum, blockchainNum) * 0.05;
                                            return diff <= tolerance ? ' ✅' : ' ❌';
                                          }
                                          return ' ❌';
                                        })()}
                                      </Text>
                                    </Col>
                                  </Row>
                                    
                                  {/* Địa chỉ */}
                                  <Row gutter={24} style={{ marginBottom: '20px' }}>
                                    <Col span={12}>
                                      <Text strong>Địa chỉ: </Text>
                                      <Text style={{ fontSize: '14px' }}>
                                        {analysis.extractedInfo.landLocation || 'Không tìm thấy'}
                                      </Text>
                                    </Col>
                                    <Col span={12}>
                                      <Text strong>Địa chỉ: </Text>
                                      <Text style={{ 
                                        fontSize: '14px',
                                        color: (() => {
                                          const extractedLoc = (analysis.extractedInfo.landLocation || '').toString().toLowerCase();
                                          const blockchainLoc = (blockchainData.location || '').toString().toLowerCase();
                                          const isMatch = extractedLoc.includes(blockchainLoc) || 
                                                         blockchainLoc.includes(extractedLoc) ||
                                                         extractedLoc === blockchainLoc;
                                          return isMatch ? '#52c41a' : '#ff4d4f';
                                        })()
                                      }}>
                                        {blockchainData.location || 'Không tìm thấy'}
                                        {(() => {
                                          const extractedLoc = (analysis.extractedInfo.landLocation || '').toString().toLowerCase();
                                          const blockchainLoc = (blockchainData.location || '').toString().toLowerCase();
                                          const isMatch = extractedLoc.includes(blockchainLoc) || 
                                                         blockchainLoc.includes(extractedLoc) ||
                                                         extractedLoc === blockchainLoc;
                                          return isMatch ? ' ✅' : ' ❌';
                                        })()}
                                      </Text>
                                    </Col>
                                  </Row>
                                    
                                  {/* Loại đất */}
                                  <Row gutter={24} style={{ marginBottom: '20px' }}>
                                    <Col span={12}>
                                      <Text strong>Trạng thái pháp lý: </Text>
                                      <Text style={{ fontSize: '16px' }}>
                                        {(() => {
                                          const landType = analysis.extractedInfo.landType || '';
                                          // Extract code in parentheses, e.g., "Đất bằng trồng cây hàng năm khác (HNK)" -> "HNK"
                                          const match = landType.match(/\(([^)]+)\)/);
                                          return match ? `(${match[1]})` : landType;
                                        })()}
                                      </Text>
                                    </Col>
                                    <Col span={12}>
                                      <Text strong>Mục đích sử dụng đất: </Text>
                                      <Text style={{ 
                                        fontSize: '16px',
                                        color: (() => {
                                          const isMatch = landTypeMatchService.isMatch(blockchainData.landType, analysis.extractedInfo.landType);
                                          return isMatch ? '#52c41a' : '#000';
                                        })()
                                      }}>
                                        ({blockchainData.landType || 'Không tìm thấy'})
                                        {(() => {
                                          const isMatch = landTypeMatchService.isMatch(blockchainData.landType, analysis.extractedInfo.landType);
                                          return isMatch ? ' ✅' : '';
                                        })()}
                                      </Text>
                                      {(() => {
                                        const isMatch = landTypeMatchService.isMatch(blockchainData.landType, analysis.extractedInfo.landType);
                                        if (!isMatch) {
                                          const expectedLegalStatus = landTypeMatchService.getExpectedLegalStatus(blockchainData.landType);
                                          return (
                                            <div style={{ marginTop: '8px' }}>
                                              <Text style={{ color: '#ff4d4f', fontSize: '14px' }}>
                                                ❌ Đất mục đích sử dụng {blockchainData.landType || 'N/A'} phải có trạng thái pháp lý là {expectedLegalStatus}
                                              </Text>
                                            </div>
                                          );
                                        }
                                        return null;
                                      })()}
                                    </Col>
                                  </Row>
                                    
                                  {/* CCCD */}
                                  <Row gutter={24} style={{ marginBottom: '20px' }}>
                                    <Col span={12}>
                                      <Text strong>CCCD chủ sử dụng: </Text>
                                      <Text style={{ fontSize: '16px' }}>
                                        {analysis.extractedInfo.cccd || 'Không tìm thấy'}
                                      </Text>
                                    </Col>
                                    <Col span={12}>
                                      <Text strong>CCCD chủ sử dụng: </Text>
                                      <Text style={{ 
                                        fontSize: '16px',
                                        color: blockchainData.cccd === analysis.extractedInfo.cccd ? '#52c41a' : '#ff4d4f'
                                      }}>
                                        {blockchainData.cccd || 'Không tìm thấy'}
                                        {blockchainData.cccd === analysis.extractedInfo.cccd ? ' ✅' : ' ❌'}
                                      </Text>
                                    </Col>
                                  </Row>
                                  
                                  {/* Kết quả so sánh và đề xuất */}
                                  {comparisonResult && (
                                    <div style={{ marginTop: '20px', textAlign: 'center' }}>
                                      <Divider>Kết quả so sánh</Divider>
                                      <div style={{ marginBottom: '16px' }}>
                                        <Text strong style={{ fontSize: '16px' }}>
                                          Độ khớp: {comparisonResult.matchPercentage}%
                                        </Text>
                                        <br />
                                        <Text type="secondary">
                                          {comparisonResult.matchedFields}/{comparisonResult.totalFields} trường khớp
                                        </Text>
                                      </div>
                                      
                                      <div style={{ marginBottom: '16px' }}>
                                        {comparisonResult.recommendation === 'verify' ? (
                                          <Tag color="green" style={{ fontSize: '14px', padding: '8px 16px' }}>
                                            ✅ Đề xuất: XÁC THỰC tài liệu
                                          </Tag>
                                        ) : comparisonResult.recommendation === 'reject' ? (
                                          <Tag color="red" style={{ fontSize: '14px', padding: '8px 16px' }}>
                                            ❌ Đề xuất: TỪ CHỐI tài liệu
                                          </Tag>
                                        ) : (
                                          <Tag color="orange" style={{ fontSize: '14px', padding: '8px 16px' }}>
                                            ⚠️ Đề xuất: CẦN KIỂM TRA THÊM
                                          </Tag>
                                        )}
                                      </div>
                                      
                                      <div style={{ fontSize: '12px', color: '#666' }}>
                                        <Text>Chi tiết:</Text>
                                        <br />
                                        {comparisonResult.details.map((detail, index) => (
                                          <Text key={index} style={{ display: 'block', marginBottom: '4px' }}>
                                            {detail}
                                          </Text>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                              </div>
                          )}
                          

                          

                          
                          
                          

                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: 32 }}>
                          <Text type="secondary">Chưa có kết quả phân tích</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            Nhấn nút "Phân tích tài liệu" để bắt đầu phân tích và hỗ trợ quyết định xác thực
                          </Text>
                        </div>
                      )}
                      
                      <Divider />
                      
                      {/* Chức năng xác thực tài liệu */}
                      {selected.verified ? (
                        <div style={{ 
                          background: '#f6ffed', 
                          border: '1px solid #b7eb8f', 
                          borderRadius: '8px', 
                          padding: '16px',
                          textAlign: 'center'
                        }}>
                          <Text type="success" strong>
                            ✅ Tài liệu đã được xác thực
                          </Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            Xác thực bởi: {selected.verifiedBy || 'N/A'}
                          </Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            Ngày xác thực: {selected.verifiedAt && selected.verifiedAt !== '0001-01-01T00:00:00Z' ? 
                              new Date(selected.verifiedAt).toLocaleString('vi-VN') : 'N/A'
                            }
                          </Text>
                        </div>
                      ) : (
                        <div style={{ 
                          background: '#f0f8ff', 
                          border: '1px solid #d6e4ff', 
                          borderRadius: '8px', 
                          padding: '20px',
                          textAlign: 'center'
                        }}>
                          <Text strong style={{ fontSize: '16px', marginBottom: '16px', display: 'block' }}>
                            🎯 Chức năng xác thực tài liệu
                          </Text>
                          <Text type="secondary" style={{ marginBottom: '16px', display: 'block' }}>
                            Xác thực hoặc từ chối tài liệu này sau khi phân tích
                          </Text>
                          <Space size="large">
                            <Button 
                              type="primary" 
                              icon={<FileTextOutlined />}
                              onClick={() => handleVerifyDocument(selected)}
                              size="large"
                              style={{ minWidth: '120px' }}
                            >
                              Xác thực
                            </Button>
                            <Button 
                              danger
                              icon={<FileTextOutlined />}
                              onClick={() => handleRejectDocument(selected)}
                              size="large"
                              style={{ minWidth: '120px' }}
                            >
                              Từ chối
                            </Button>
                          </Space>
                        </div>
                      )}
                    </div>
                  )
                },
                {
                  key: "4",
                  label: "Lịch sử thay đổi",
                  children: (
                    <div style={{ padding: '16px 0' }}>
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
                                  <Tag color={item.document?.verified ? 'green' : 'orange'}>
                                    {item.document?.verified ? 'Đã xác thực' : 'Chờ xác thực'}
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
                        <Text type="success">✓ Tài liệu đang chờ xác thực</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Tài liệu cần được xác thực bởi Org2
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

      {/* Verify Document Modal */}
      <Modal
        title="Xác thực tài liệu"
        open={verifyModalOpen}
        onOk={onVerifyDocument}
        onCancel={() => setVerifyModalOpen(false)}
        confirmLoading={loading}
        okText="Xác thực"
        cancelText="Hủy"
        width={500}
      >
        <div style={{ padding: '16px 0' }}>
          <p><strong>Tài liệu:</strong> {selected?.title}</p>
          <p><strong>Mã:</strong> {selected?.docID}</p>
          <Divider />
          <Form layout="vertical">
            <Form.Item 
              label="Ghi chú xác thực" 
              required
              help="Nhập ghi chú về việc xác thực tài liệu này"
            >
              <TextArea
                rows={4}
                placeholder="Nhập ghi chú xác thực..."
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
              />
            </Form.Item>
          </Form>
        </div>
      </Modal>

      {/* Reject Document Modal */}
      <Modal
        title="Từ chối tài liệu"
        open={rejectModalOpen}
        onOk={onRejectDocument}
        onCancel={() => setRejectModalOpen(false)}
        confirmLoading={loading}
        okText="Từ chối"
        cancelText="Hủy"
        width={500}
        okButtonProps={{ danger: true }}
      >
        <div style={{ padding: '16px 0' }}>
          <p><strong>Tài liệu:</strong> {selected?.title}</p>
          <p><strong>Mã:</strong> {selected?.docID}</p>
          <Divider />
          <Form layout="vertical">
            <Form.Item 
              label="Lý do từ chối" 
              required
              help="Nhập lý do từ chối tài liệu này"
            >
              <TextArea
                rows={4}
                placeholder="Nhập lý do từ chối..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </Card>
  );
};

export default DocumentManagementPage;
