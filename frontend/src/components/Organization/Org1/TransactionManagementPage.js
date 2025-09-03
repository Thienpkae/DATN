import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Space, Tag, message, Drawer, Row, Col, Tooltip } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined, FileTextOutlined, HistoryOutlined } from '@ant-design/icons';
import transactionService from '../../../services/transactionService';
import documentService from '../../../services/documentService';
import { DocumentDetailModal } from '../../Common';

const { Option } = Select;
const { TextArea } = Input;

const TransactionManagementPage = () => {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const defaultFilters = {
    keyword: '',
    type: undefined,
    status: undefined
  };
  
  const [filters, setFilters] = useState(defaultFilters);
  const [detailOpen, setDetailOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [approveForm] = Form.useForm();
  const [rejectForm] = Form.useForm();
  
  // Document states
  const [selectedDocument, setSelectedDocument] = useState(null);
  
  // Document detail modal states
  const [documentDetailOpen, setDocumentDetailOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  const loadList = async () => {
    try {
      setLoading(true);
      const res = await transactionService.getAllTransactions();
      const data = Array.isArray(res) ? res : (res?.data ?? []);
      setTransactions(data);
    } catch (e) {
      message.error(e.message || 'Không tải được danh sách giao dịch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  const onSearch = async () => {
    try {
      setLoading(true);
      const res = await transactionService.searchTransactions(filters);
      const data = Array.isArray(res) ? res : (res?.data ?? []);
      setTransactions(data);
    } catch (e) {
      message.error(e.message || 'Tìm kiếm thất bại');
    } finally {
      setLoading(false);
    }
  };

  const onApprove = async () => {
    try {
      const values = await approveForm.validateFields();
      setLoading(true);
      
      switch (selected.type) {
        case 'TRANSFER':
          await transactionService.approveTransferTransaction(selected.txID);
          break;
        case 'SPLIT':
          await transactionService.approveSplitTransaction(selected.txID);
          break;
        case 'MERGE':
          await transactionService.approveMergeTransaction(selected.txID);
          break;
        case 'CHANGE_PURPOSE':
          await transactionService.approveChangePurposeTransaction(selected.txID);
          break;
        case 'REISSUE':
          await transactionService.approveReissueTransaction(selected.txID, values.newCertificateID);
          break;
        default:
          throw new Error('Loại giao dịch không được hỗ trợ');
      }
      
      message.success('Phê duyệt giao dịch thành công');
      setApproveOpen(false);
      loadList();
    } catch (e) {
      message.error(e.message || 'Phê duyệt thất bại');
    } finally {
      setLoading(false);
    }
  };

  const onReject = async () => {
    try {
      const values = await rejectForm.validateFields();
      setLoading(true);
      await transactionService.rejectTransaction(selected.txID, values.reason);
      message.success('Từ chối giao dịch thành công');
      setRejectOpen(false);
      loadList();
    } catch (e) {
      message.error(e.message || 'Từ chối thất bại');
    } finally {
      setLoading(false);
    }
  };

  // View transaction history - UC-39
  const onViewHistory = async (txID) => {
    try {
      const res = await transactionService.getTransactionHistory(txID);
      setHistory(Array.isArray(res) ? res : (res?.data ?? []));
      setHistoryOpen(true);
    } catch (e) {
      message.error(e.message || 'Không tải được lịch sử');
    }
  };

  const openDetail = async (record) => {
    try {
      setSelected(record);
      setDetailOpen(true);
      
      // Load transaction history
      const res = await transactionService.getTransactionHistory(record.txId);
      setHistory(Array.isArray(res) ? res : (res?.data ?? []));
      


      // Load documents for detail modal - tương tự như Org2
      if (record.documentIds && record.documentIds.length > 0) {
        setDocuments([]);
        setDocumentsLoading(true);
        
        try {
          const docPromises = record.documentIds.map(async (docId) => {
            try {
              return await documentService.getDocument(docId);
            } catch (e) {
              console.warn(`Không thể load tài liệu ${docId}:`, e);
              return null;
            }
          });
          
          const docs = await Promise.all(docPromises);
          const validDocs = docs.filter(doc => doc !== null);
          setDocuments(validDocs);
          
          console.log('📄 Loaded documents:', validDocs.length, 'out of', record.documentIds.length);
        } catch (e) {
          console.warn('Không thể load danh sách tài liệu:', e);
          setDocuments([]);
        } finally {
          setDocumentsLoading(false);
        }
      } else {
        setDocuments([]);
        setDocumentsLoading(false);
      }
    } catch (e) {
      setHistory([]);
      setDocuments([]);
      setDocumentsLoading(false);
    }
  };

  const onViewDocumentDetail = async (document) => {
    setSelectedDocument(document);
    setDocumentDetailOpen(true);
    console.log('🔗 Mở modal xem chi tiết tài liệu:', document.docID);
  };

  const getTransactionTypeLabel = (type) => {
    const typeLabels = {
      'TRANSFER': 'Chuyển nhượng',
      'SPLIT': 'Tách thửa',
      'MERGE': 'Hợp thửa',
      'CHANGE_PURPOSE': 'Thay đổi mục đích',
      'REISSUE': 'Cấp lại GCN'
    };
    return typeLabels[type] || type;
  };

  const getStatusTag = (status) => {
    const statusColors = {
      'PENDING': 'orange',
      'VERIFIED': 'blue',
      'FORWARDED': 'cyan',
      'APPROVED': 'green',
      'REJECTED': 'red',
      'CONFIRMED': 'green',
      'SUPPLEMENT_REQUESTED': 'gold'
    };
    return <Tag color={statusColors[status] || 'default'}>{transactionService.getTransactionStatusText(status)}</Tag>;
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'PENDING': 'orange',
      'CONFIRMED': 'blue',
      'FORWARDED': 'cyan',
      'VERIFIED': 'green',
      'SUPPLEMENT_REQUESTED': 'purple',
      'APPROVED': 'green',
      'REJECTED': 'red'
    };
    return statusColors[status] || 'default';
  };

  const getDocumentStatusColor = (doc) => {
    if (doc.status === 'VERIFIED') return 'green';
    if (doc.status === 'REJECTED') return 'red';
    return 'orange';
  };

  const getDocumentStatusText = (doc) => {
    if (doc.status === 'VERIFIED') return 'Đã xác thực';
    if (doc.status === 'REJECTED') return 'Không hợp lệ';
    return 'Chờ xác thực';
  };

  const columns = useMemo(() => ([
    { title: 'Mã giao dịch', dataIndex: 'txId', key: 'txId', render: v => <code>{v}</code> },
    { title: 'Loại giao dịch', dataIndex: 'type', key: 'type', render: v => <Tag color="blue">{getTransactionTypeLabel(v)}</Tag> },
    { title: 'Thửa đất chính', dataIndex: 'landParcelId', key: 'landParcelId' },
    { title: 'Người thực hiện', dataIndex: 'userId', key: 'userId' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: v => <Tag color={getStatusColor(v)}>{v}</Tag> },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', render: v => v ? new Date(v).toLocaleDateString('vi-VN') : 'N/A' },
    {
      title: 'Thao tác', key: 'actions', fixed: 'right', render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button icon={<EyeOutlined />} onClick={() => openDetail(record)} />
          </Tooltip>
          <Tooltip title="Lịch sử">
            <Button icon={<HistoryOutlined />} onClick={() => onViewHistory(record.txId)} />
          </Tooltip>
          {record.status === 'VERIFIED' && (
            <Tooltip title="Phê duyệt">
              <Button 
                type="primary" 
                icon={<CheckCircleOutlined />} 
                onClick={() => {
                  setSelected(record);
                  setApproveOpen(true);
                }}
              />
            </Tooltip>
          )}
          {record.status === 'VERIFIED' && (
            <Tooltip title="Từ chối">
              <Button 
                danger 
                icon={<CloseCircleOutlined />} 
                onClick={() => {
                  setSelected(record);
                  setRejectOpen(true);
                }}
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ]), []);

  return (
    <div>
      <Card
        title="Quản lý giao dịch (Org1)"
        extra={
          <Space>
            <Input
              placeholder="Từ khóa"
              allowClear
              style={{ width: 200 }}
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            />
            <Select placeholder="Loại giao dịch" allowClear style={{ width: 150 }} value={filters.type} onChange={(v) => setFilters({ ...filters, type: v })}>
              <Option value="TRANSFER">Chuyển nhượng</Option>
              <Option value="SPLIT">Tách thửa</Option>
              <Option value="MERGE">Hợp thửa</Option>
              <Option value="CHANGE_PURPOSE">Thay đổi mục đích</Option>
              <Option value="REISSUE">Cấp lại GCN</Option>
            </Select>
            <Select placeholder="Trạng thái" allowClear style={{ width: 150 }} value={filters.status} onChange={(v) => setFilters({ ...filters, status: v })}>
              <Option value="PENDING">Chờ xử lý</Option>
              <Option value="CONFIRMED">Đã xác nhận</Option>
              <Option value="FORWARDED">Đã chuyển tiếp</Option>
              <Option value="VERIFIED">Đã xác thực</Option>
              <Option value="SUPPLEMENT_REQUESTED">Yêu cầu bổ sung</Option>
              <Option value="APPROVED">Đã phê duyệt</Option>
              <Option value="REJECTED">Bị từ chối</Option>
            </Select>
            <Button icon={<SearchOutlined />} onClick={onSearch}>Tìm kiếm</Button>
            <Button icon={<ReloadOutlined />} onClick={loadList}>Tải lại</Button>
          </Space>
        }
      >
        <Table
          rowKey={(r) => r.txID}
          loading={loading}
          dataSource={transactions}
          columns={columns}
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />

        {/* Approve Transaction Modal */}
        <Modal title="Phê duyệt giao dịch" open={approveOpen} onOk={onApprove} onCancel={() => setApproveOpen(false)} confirmLoading={loading} width={640}>
          <Form layout="vertical" form={approveForm}>
            {selected?.type === 'REISSUE' && (
              <Form.Item name="newCertificateID" label="Mã GCN mới" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Input placeholder="Nhập mã giấy chứng nhận mới" />
              </Form.Item>
            )}
            <div style={{ marginTop: 16 }}>
              <strong>Thông tin giao dịch:</strong>
              <div>Mã: {selected?.txID}</div>
              <div>Loại: {selected?.type}</div>
              <div>Thửa đất: {selected?.landParcelID}</div>
            </div>
          </Form>
        </Modal>

        {/* Reject Transaction Modal */}
        <Modal title="Từ chối giao dịch" open={rejectOpen} onOk={onReject} onCancel={() => setRejectOpen(false)} confirmLoading={loading} width={640}>
          <Form layout="vertical" form={rejectForm}>
            <Form.Item name="reason" label="Lý do từ chối" rules={[{ required: true, message: 'Bắt buộc' }]}>
              <TextArea rows={4} placeholder="Nhập lý do từ chối giao dịch" />
            </Form.Item>
            <div style={{ marginTop: 16 }}>
              <strong>Thông tin giao dịch:</strong>
              <div>Mã: {selected?.txID}</div>
              <div>Loại: {selected?.type}</div>
              <div>Thửa đất: {selected?.landParcelID}</div>
            </div>
          </Form>
        </Modal>

        {/* Transaction Detail Drawer */}
        <Drawer title="Chi tiết giao dịch" width={800} open={detailOpen} onClose={() => setDetailOpen(false)}>
          {selected && (
            <div>
              <Row gutter={16}>
                <Col span={12}><strong>Mã giao dịch:</strong> {selected.txID}</Col>
                <Col span={12}><strong>Loại:</strong> {getTransactionTypeLabel(selected.type)}</Col>
              </Row>
              <Row gutter={16} style={{ marginTop: 12 }}>
                <Col span={12}><strong>Thửa đất:</strong> {selected.landParcelId}</Col>
                <Col span={12}><strong>Trạng thái:</strong> {getStatusTag(selected.status)}</Col>
              </Row>
              <Row gutter={16} style={{ marginTop: 12 }}>
                <Col span={12}><strong>Người gửi:</strong> {selected.fromOwnerId}</Col>
                <Col span={12}><strong>Người nhận:</strong> {selected.toOwnerId || '-'}</Col>
              </Row>
              <Row gutter={16} style={{ marginTop: 12 }}>
                <Col span={12}><strong>Ngày tạo:</strong> {selected.createdAt ? new Date(selected.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</Col>
                <Col span={12}><strong>Ngày cập nhật:</strong> {selected.updatedAt ? new Date(selected.updatedAt).toLocaleDateString('vi-VN') : 'N/A'}</Col>
              </Row>
              
              {selected.description && (
                <div style={{ marginTop: 12 }}>
                  <strong>Mô tả:</strong> {selected.description}
                </div>
              )}
              
              {selected.details && (
                <div style={{ marginTop: 16 }}>
                  <strong>Chi tiết:</strong>
                  <div style={{ 
                    marginTop: 8, 
                    padding: 12, 
                    background: '#f5f5f5', 
                    borderRadius: 4,
                    borderLeft: '4px solid #722ed1'
                  }}>
                    {selected.details}
                  </div>
                </div>
              )}
              
              {selected.notes && (
                <div style={{ marginTop: 12 }}>
                  <strong>Ghi chú:</strong> {selected.notes}
                </div>
              )}

              {selected.documentIds && selected.documentIds.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <strong>Tài liệu đính kèm:</strong>
                  <div style={{ marginTop: 8 }}>
                    {documentsLoading ? (
                      // Loading skeleton
                      <div>
                        {[1, 2, 3].map((i) => (
                          <div key={i} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            marginBottom: '8px',
                            background: '#f8f9fa',
                            borderRadius: '6px',
                            border: '1px solid #e9ecef'
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ width: '60%', height: '16px', background: '#e9ecef', borderRadius: '4px', marginBottom: '4px' }} />
                              <div style={{ width: '40%', height: '12px', background: '#e9ecef', borderRadius: '4px' }} />
                            </div>
                            <Space>
                              <div style={{ width: '60px', height: '24px', background: '#e9ecef', borderRadius: '4px' }} />
                            </Space>
                          </div>
                        ))}
                      </div>
                    ) : documents && documents.length > 0 ? (
                      // Hiển thị tài liệu - giống hệt Org2
                      <div>
                        <div style={{ marginBottom: '8px', color: '#666', fontSize: '12px' }}>
                          {documents.length} tài liệu
                        </div>
                        {documents.map((doc, index) => (
                          <div key={index} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            marginBottom: '8px',
                            background: '#f8f9fa',
                            borderRadius: '6px',
                            border: '1px solid #e9ecef'
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: '500', color: '#1890ff' }}>
                                {doc.title || doc.docID}
                              </div>
                              <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                                {doc.type} • {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(2)} KB` : 'N/A'}
                              </div>
                            </div>
                            <Space>
                              <Tooltip title="Xem chi tiết tài liệu">
                                <Button 
                                  type="text" 
                                  icon={<FileTextOutlined />} 
                                  size="small"
                                  onClick={() => onViewDocumentDetail(doc)}
                                  style={{ color: '#1890ff' }}
                                />
                              </Tooltip>
                              <Tag 
                                color={getDocumentStatusColor(doc)} 
                                size="small"
                                style={{ 
                                  width: '120px',
                                  minWidth: '120px',
                                  textAlign: 'center',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  padding: '4px 12px'
                                }}
                              >
                                {getDocumentStatusText(doc)}
                              </Tag>
                            </Space>
                          </div>
                        ))}
                      </div>
                    ) : (
                      // Không có tài liệu - giống Org2
                      <div style={{ 
                        padding: '16px', 
                        textAlign: 'center', 
                        color: '#999',
                        background: '#f8f9fa',
                        borderRadius: '6px',
                        border: '1px dashed #e9ecef'
                      }}>
                        <FileTextOutlined style={{ fontSize: '24px', marginBottom: '8px', color: '#ccc' }} />
                        <div>Chưa có tài liệu đính kèm</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </Drawer>

        {/* Transaction History */}
        <Drawer 
          title="Lịch sử thay đổi giao dịch" 
          width={800} 
          open={historyOpen} 
          onClose={() => setHistoryOpen(false)}
        >
          {selected && (
            <div>
              <div style={{ marginBottom: 16, padding: 12, background: '#f0f9ff', borderRadius: 4 }}>
                <Row gutter={16}>
                  <Col span={12}><strong>Mã giao dịch:</strong> {selected.txID}</Col>
                  <Col span={12}><strong>Loại:</strong> <Tag color="blue">{getTransactionTypeLabel(selected.type)}</Tag></Col>
                </Row>
                <Row gutter={16} style={{ marginTop: 8 }}>
                  <Col span={12}><strong>Thửa đất:</strong> {selected.landParcelID}</Col>
                  <Col span={12}><strong>Trạng thái hiện tại:</strong> {getStatusTag(selected.status)}</Col>
                </Row>
              </div>

              {history.length > 0 ? (
                <div>
                  <h4>Timeline thay đổi ({history.length} bản ghi):</h4>
                  <div style={{ maxHeight: 600, overflowY: 'auto' }}>
                    {history.map((item, index) => {
                      // Xử lý timestamp đúng cách
                      const formatTimestamp = (timestamp) => {
                        if (!timestamp) return 'N/A';
                        
                        let date;
                        if (timestamp.seconds) {
                          // Timestamp từ blockchain (seconds + nanos)
                          date = new Date(timestamp.seconds * 1000 + (timestamp.nanos || 0) / 1000000);
                        } else {
                          // Timestamp thông thường
                          date = new Date(timestamp);
                        }
                        
                        return date.toLocaleString('vi-VN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        });
                      };

                      return (
                        <div key={index} style={{ 
                          padding: 16, 
                          marginBottom: 12, 
                          background: '#ffffff', 
                          border: '1px solid #e8e8e8',
                          borderRadius: 6,
                          borderLeft: '4px solid #52c41a',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                          <div style={{ marginBottom: 8 }}>
                            <strong>Bước {history.length - index}:</strong>
                            <span style={{ float: 'right', color: '#666', fontSize: '12px' }}>
                              {formatTimestamp(item.timestamp)}
                            </span>
                          </div>
                          
                          {item.transaction && (
                            <div>
                              <div style={{ marginBottom: 4 }}>
                                <strong>Trạng thái:</strong> {getStatusTag(item.transaction.status)}
                              </div>
                              
                              {item.transaction.details && (
                                <div style={{ marginBottom: 4 }}>
                                  <strong>Chi tiết:</strong> {item.transaction.details}
                                </div>
                              )}
                              
                              {item.transaction.documentIds && item.transaction.documentIds.length > 0 && (
                                <div style={{ marginBottom: 4 }}>
                                  <strong>Tài liệu đính kèm:</strong> 
                                  <div style={{ marginTop: 4 }}>
                                    {item.transaction.documentIds.map((docId, docIndex) => (
                                      <Tag key={docIndex} size="small" style={{ marginBottom: 2 }}>
                                        {docId}
                                      </Tag>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              <div style={{ marginTop: 8, fontSize: '12px', color: '#999' }}>
                                <strong>Blockchain TX:</strong> {item.txId?.substring(0, 16)}...
                                {item.isDelete && <Tag color="red" size="small" style={{ marginLeft: 8 }}>Đã xóa</Tag>}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                  <div style={{ fontSize: '16px', marginBottom: 8 }}>Chưa có lịch sử thay đổi</div>
                  <div style={{ fontSize: '14px' }}>Giao dịch này chưa có bất kỳ thay đổi nào được ghi lại.</div>
                </div>
              )}
            </div>
          )}
        </Drawer>

        {/* Document Detail Modal */}
        <DocumentDetailModal
          document={selectedDocument}
          visible={documentDetailOpen}
          onClose={() => setDocumentDetailOpen(false)}
          onVerify={null} // Org1 không có quyền xác thực
          onReject={null} // Org1 không có quyền từ chối
          userRole="Org1"
        />
      </Card>
    </div>
  );
};

export default TransactionManagementPage;
