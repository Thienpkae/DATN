import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Space, Tag, message, Drawer, Row, Col, Tooltip, Badge } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, FileTextOutlined, CheckCircleOutlined, CloseCircleOutlined, LinkOutlined, DownloadOutlined, ClearOutlined } from '@ant-design/icons';
import documentService from '../../../services/documentService';
import ipfsService from '../../../services/ipfs';

const { Option } = Select;
const { TextArea } = Input;

const DocumentManagementPage = () => {
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
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [verifyForm] = Form.useForm();
  const [rejectForm] = Form.useForm();
  const [linkForm] = Form.useForm();

  const loadList = async () => {
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
  };

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
  }, []);

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

  const onVerify = async () => {
    try {
      const values = await verifyForm.validateFields();
      setLoading(true);
      await documentService.verifyDocument(selected.docID, {
        verified: true,
        verifiedBy: values.verifiedBy,
        verifiedAt: new Date().toISOString(),
        notes: values.notes
      });
      message.success('Xác minh tài liệu thành công');
      setVerifyOpen(false);
      loadList();
      
      // Dispatch custom event to notify other pages to refresh
      window.dispatchEvent(new CustomEvent('documentUpdated', {
        detail: { documentId: selected.docID }
      }));
    } catch (e) {
      message.error(e.message || 'Xác minh thất bại');
    } finally {
      setLoading(false);
    }
  };

  const onReject = async () => {
    try {
      const values = await rejectForm.validateFields();
      setLoading(true);
      await documentService.rejectDocument(selected.docID, {
        verified: false,
        verifiedBy: values.verifiedBy,
        verifiedAt: new Date().toISOString(),
        reason: values.reason
      });
      message.success('Từ chối tài liệu thành công');
      setRejectOpen(false);
      loadList();
      
      // Dispatch custom event to notify other pages to refresh
      window.dispatchEvent(new CustomEvent('documentUpdated', {
        detail: { documentId: selected.docID }
      }));
    } catch (e) {
      message.error(e.message || 'Từ chối thất bại');
    } finally {
      setLoading(false);
    }
  };

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
      
      // Dispatch custom event to notify other pages to refresh
      window.dispatchEvent(new CustomEvent('documentUpdated', {
        detail: { documentId: values.docID }
      }));
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

  const columns = useMemo(() => ([
    { title: 'Mã tài liệu', dataIndex: 'docID', key: 'docID' },
    { title: 'Tiêu đề', dataIndex: 'title', key: 'title' },
    { title: 'Loại', dataIndex: 'docType', key: 'docType', render: v => <Tag>{v}</Tag> },
    { 
      title: 'Trạng thái', 
      dataIndex: 'verified', 
      key: 'verified', 
      render: v => (
        <Badge 
          status={v ? 'success' : 'processing'} 
          text={v ? 'Đã xác thực' : 'Chờ xác thực'} 
        />
      )
    },
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
          {!record.verified && (
            <>
              <Tooltip title="Xác thực">
                <Button 
                  type="primary" 
                  icon={<CheckCircleOutlined />} 
                  onClick={() => {
                    setSelected(record);
                    verifyForm.setFieldsValue({ docID: record.docID });
                    setVerifyOpen(true);
                  }}
                />
              </Tooltip>
              <Tooltip title="Từ chối">
                <Button 
                  danger 
                  icon={<CloseCircleOutlined />} 
                  onClick={() => {
                    setSelected(record);
                    rejectForm.setFieldsValue({ docID: record.docID });
                    setRejectOpen(true);
                  }}
                />
              </Tooltip>
            </>
          )}
        </Space>
      )
    }
  ]), [verifyForm, rejectForm, linkForm, handleDownload]);

  return (
    <Card
      title="Quản lý tài liệu (Org2 - Xác thực)"
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
          <Button icon={<ClearOutlined />} onClick={() => {
            setFilters(defaultFilters);
            loadList();
          }}>Reset</Button>
          <Button icon={<ReloadOutlined />} onClick={loadList}>Tải lại</Button>          
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

      {/* Verify Document */}
      <Modal title="Xác thực tài liệu" open={verifyOpen} onOk={onVerify} onCancel={() => setVerifyOpen(false)} confirmLoading={loading} width={640}>
        <Form layout="vertical" form={verifyForm}>
          <Form.Item name="docID" label="Mã tài liệu">
            <Input disabled />
          </Form.Item>
          <Form.Item name="verifiedBy" label="Người xác thực" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Input placeholder="Nhập CCCD người xác thực" />
          </Form.Item>
          <Form.Item name="notes" label="Ghi chú">
            <TextArea rows={3} placeholder="Ghi chú về việc xác thực" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Reject Document */}
      <Modal title="Từ chối tài liệu" open={rejectOpen} onOk={onReject} onCancel={() => setRejectOpen(false)} confirmLoading={loading} width={640}>
        <Form layout="vertical" form={rejectForm}>
          <Form.Item name="docID" label="Mã tài liệu">
            <Input disabled />
          </Form.Item>
          <Form.Item name="verifiedBy" label="Người từ chối" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Input placeholder="Nhập CCCD người từ chối" />
          </Form.Item>
          <Form.Item name="reason" label="Lý do từ chối" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <TextArea rows={3} placeholder="Nhập lý do từ chối tài liệu" />
          </Form.Item>
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
