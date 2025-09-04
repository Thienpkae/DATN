import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Space, Tag, message, Drawer, Row, Col, Tooltip, Radio, Skeleton } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, CheckCircleOutlined, HistoryOutlined, ExclamationCircleOutlined, CloseCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import transactionService from '../../../services/transactionService';
import documentService from '../../../services/documentService';
import documentAnalysisService from '../../../services/documentAnalysisService';
import DocumentDetailModal from '../../Common/DocumentDetailModal';

const { Option } = Select;


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
  const [processOpen, setProcessOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [processForm] = Form.useForm();

  // States cho document detail modal
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentDetailOpen, setDocumentDetailOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  
  // States cho document analysis
  const [analysis, setAnalysis] = useState(null);
  const [blockchainData, setBlockchainData] = useState(null);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  
  // States cho transaction history
  const [transactionHistory, setTransactionHistory] = useState([]);

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

  const onProcess = async () => {
    try {
      const values = await processForm.validateFields();
      setLoading(true);
      await transactionService.processTransaction(selected.txId, values.decision, values.reason);
      
      const successMessages = {
        'APPROVE': 'Giao dịch đã được xác nhận đạt yêu cầu và tự động chuyển tiếp lên Sở TN&MT',
        'SUPPLEMENT': 'Đã yêu cầu bổ sung tài liệu cho giao dịch', 
        'REJECT': 'Giao dịch đã bị từ chối'
      };
      
      message.success(successMessages[values.decision]);
      setProcessOpen(false);
      processForm.resetFields();
      loadList();
    } catch (e) {
      message.error(e.message || 'Xử lý thất bại');
    } finally {
      setLoading(false);
    }
  };


  const onViewHistory = async (record) => {
    try {
      const history = await transactionService.getTransactionHistory(record.txId || record.txID);
      setTransactionHistory(Array.isArray(history) ? history : (history?.data ?? []));
      setHistoryOpen(true);
    } catch (e) {
      message.error(e.message || 'Không tải được lịch sử');
    }
  };

  const onViewDetail = async (transaction) => {
    setSelected(transaction);
    setDetailOpen(true);
    
    // Load documents if available - Tối ưu async
    if (transaction.documentIds && transaction.documentIds.length > 0) {
      // Hiển thị loading ngay lập tức
      setDocuments([]);
      setDocumentsLoading(true);
      
      try {
        // Load tất cả tài liệu song song thay vì tuần tự
        const docPromises = transaction.documentIds.map(async (docId) => {
          try {
            return await documentService.getDocument(docId);
          } catch (e) {
            console.warn(`Không thể load tài liệu ${docId}:`, e);
            return null;
          }
        });
        
        // Đợi tất cả tài liệu load xong
        const docs = await Promise.all(docPromises);
        const validDocs = docs.filter(doc => doc !== null);
        setDocuments(validDocs);
        
        console.log('📄 Loaded documents:', validDocs.length, 'out of', transaction.documentIds.length);
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
  };

  const onViewDocumentDetail = async (document) => {
    // Reset analysis states khi mở document mới
    setAnalysis(null);
    setBlockchainData(null);
    setComparisonResult(null);
    
    // Mở modal xem chi tiết tài liệu trong cùng trang
    setSelectedDocument(document);
    setDocumentDetailOpen(true);
    console.log('🔗 Mở modal xem chi tiết tài liệu:', document.docID);
  };
  
  const onAnalyzeDocument = async (docID) => {
    try {
      setAnalyzing(true);
      const result = await documentAnalysisService.performCompleteAnalysis(docID);
      setAnalysis(result.analysis);
      setBlockchainData(result.blockchainData);
      setComparisonResult(result.comparisonResult);
    } catch (e) {
      console.error('Analysis error:', e);
      // Error message is already shown by the shared service
    } finally {
      setAnalyzing(false);
    }
  };

  const getStatusTag = (status) => {
    const statusColors = {
      'PENDING': 'orange',
      'VERIFIED': 'blue',
      'APPROVED': 'green',
      'REJECTED': 'red',
      'CONFIRMED': 'green',
      'SUPPLEMENT_REQUESTED': 'gold'
    };
    return <Tag color={statusColors[status] || 'default'}>{transactionService.getTransactionStatusText(status)}</Tag>;
  };

  const getTypeTag = (type) => {
    return <Tag color="blue">{transactionService.getTransactionTypeText(type)}</Tag>;
  };

  const canProcess = (transaction) => {
    // TRANSFER transactions can be processed when CONFIRMED (after recipient acceptance)
    if (transaction.type === 'TRANSFER') {
      return transaction.status === 'CONFIRMED';
    }
    // Other transaction types can be processed when PENDING
    return transaction.status === 'PENDING';
  };


  const getDocumentStatusColor = (doc) => {
    if (doc.status === 'VERIFIED') return 'green';
    if (doc.status === 'REJECTED') return 'red';
    return 'orange';
  };

  const getDocumentStatusText = (doc) => {
    if (doc.status === 'VERIFIED') return 'Đã thẩm định';
    if (doc.status === 'REJECTED') return 'Không hợp lệ';
    return 'Chờ xác thực';
  };

  const columns = useMemo(() => ([
    { title: 'Mã giao dịch', dataIndex: 'txId', key: 'txId' },
    { title: 'Loại', dataIndex: 'type', key: 'type', render: v => getTypeTag(v) },
    { title: 'Thửa đất', dataIndex: 'landParcelId', key: 'landParcelId' },
    { title: 'Người gửi', dataIndex: 'fromOwnerId', key: 'fromOwnerId' },
    { title: 'Người nhận', dataIndex: 'toOwnerId', key: 'toOwnerId', render: v => v || '-' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: v => getStatusTag(v) },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', render: v => v ? new Date(v).toLocaleDateString('vi-VN') : 'N/A' },
    {
      title: 'Thao tác', key: 'actions', fixed: 'right', render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button icon={<EyeOutlined />} onClick={() => onViewDetail(record)} />
          </Tooltip>
          <Tooltip title="Lịch sử">
            <Button icon={<HistoryOutlined />} onClick={() => onViewHistory(record)} />
          </Tooltip>
          {canProcess(record) && (
            <Tooltip title="Xử lý">
              <Button 
                type="primary" 
                icon={<CheckCircleOutlined />} 
                onClick={() => {
                  setSelected(record);
                  setProcessOpen(true);
                }}
              >
                Xử lý
              </Button>
            </Tooltip>
          )}
        </Space>
      )
    }
  ]), []);

  return (
    <Card
      title="Xử lý giao dịch (Org2)"
      extra={
        <Space>
          <Input
            placeholder="Từ khóa"
            allowClear
            style={{ width: 200 }}
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
          />
          <Select placeholder="Loại giao dịch" allowClear style={{ width: 180 }} value={filters.type} onChange={(v) => setFilters({ ...filters, type: v })}>
            <Option value="TRANSFER">Chuyển nhượng</Option>
            <Option value="SPLIT">Tách thửa</Option>
            <Option value="MERGE">Gộp thửa</Option>
            <Option value="CHANGE_PURPOSE">Đổi mục đích</Option>
            <Option value="REISSUE">Cấp lại GCN</Option>
          </Select>
          <Select placeholder="Trạng thái" allowClear style={{ width: 150 }} value={filters.status} onChange={(v) => setFilters({ ...filters, status: v })}>
            <Option value="PENDING">Chờ xử lý</Option>
            <Option value="VERIFIED">Đã thẩm định</Option>
            <Option value="APPROVED">Đã phê duyệt</Option>
            <Option value="REJECTED">Bị từ chối</Option>
            <Option value="CONFIRMED">Đã xác nhận</Option>
            <Option value="SUPPLEMENT_REQUESTED">Yêu cầu bổ sung</Option>
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
        scroll={{ x: 1400 }}
        pagination={{ pageSize: 10, showSizeChanger: true }}
      />

      {/* Process Transaction with 3 decision states - UC-31 */}
      <Modal 
        title="Xử lý hồ sơ giao dịch" 
        open={processOpen} 
        onOk={onProcess} 
        onCancel={() => {
          setProcessOpen(false);
          processForm.resetFields();
        }} 
        confirmLoading={loading} 
        width={800}
        okText="Xử lý"
        cancelText="Hủy"
      >
        <div>
          <div style={{ marginBottom: 16 }}>
            <strong>Thông tin giao dịch:</strong>
            <div style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              <div><strong>Mã giao dịch:</strong> {selected?.txId}</div>
              <div><strong>Loại:</strong> {selected ? transactionService.getTransactionTypeText(selected.type) : ''}</div>
              <div><strong>Thửa đất:</strong> {selected?.landParcelId}</div>
              <div><strong>Người gửi:</strong> {selected?.fromOwnerId}</div>
              {selected?.toOwnerId && <div><strong>Người nhận:</strong> {selected.toOwnerId}</div>}
            </div>
          </div>
          
          <Form form={processForm} layout="vertical" initialValues={{ decision: 'APPROVE' }}>
            <Form.Item 
              name="decision" 
              label="Quyết định xử lý:" 
              rules={[{ required: true, message: 'Vui lòng chọn quyết định xử lý' }]}
            >
              <Radio.Group>
                <Space direction="vertical">
                  <Radio value="APPROVE">
                    <CheckCircleOutlined style={{ color: '#52c41a' }} /> 
                    <strong> Xác nhận đạt yêu cầu</strong>
                    <div style={{ fontSize: '12px', color: '#666', marginLeft: 20 }}>
                      Hồ sơ đầy đủ và hợp lệ, tự động chuyển tiếp lên Sở TN&MT
                    </div>
                  </Radio>
                  <Radio value="SUPPLEMENT">
                    <ExclamationCircleOutlined style={{ color: '#faad14' }} /> 
                    <strong> Yêu cầu bổ sung tài liệu</strong>
                    <div style={{ fontSize: '12px', color: '#666', marginLeft: 20 }}>
                      Cần bổ sung hoặc sửa đổi tài liệu, kích hoạt UC-18 cho công dân
                    </div>
                  </Radio>
                  <Radio value="REJECT">
                    <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> 
                    <strong> Từ chối hồ sơ</strong>
                    <div style={{ fontSize: '12px', color: '#666', marginLeft: 20 }}>
                      Hồ sơ không đủ điều kiện hoặc không hợp lệ
                    </div>
                  </Radio>
                </Space>
              </Radio.Group>
            </Form.Item>
            
            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => prevValues.decision !== currentValues.decision}
            >
              {({ getFieldValue }) => {
                const decision = getFieldValue('decision');
                return (
                  <Form.Item
                    name="reason"
                    label={decision === 'REJECT' ? 'Lý do từ chối (bắt buộc):' : 'Ghi chú/Lý do:'}
                    rules={[
                      {
                        required: decision === 'REJECT',
                        message: 'Phải có lý do khi từ chối hồ sơ'
                      }
                    ]}
                  >
                    <Input.TextArea 
                      rows={3} 
                      placeholder={
                        decision === 'REJECT' 
                          ? 'Nhập lý do từ chối hồ sơ...'
                          : decision === 'SUPPLEMENT'
                          ? 'Nhập yêu cầu bổ sung cụ thể...'
                          : 'Nhập ghi chú (tùy chọn)...'
                      }
                    />
                  </Form.Item>
                );
              }}
            </Form.Item>
          </Form>
        </div>
      </Modal>


      {/* Detail + History */}
      <Drawer title="Chi tiết giao dịch" width={800} open={detailOpen} onClose={() => setDetailOpen(false)}>
        {selected && (
          <div>
            <Row gutter={16}>
              <Col span={12}><strong>Mã giao dịch:</strong> {selected.txId || selected.txID}</Col>
              <Col span={12}><strong>Loại:</strong> {getTypeTag(selected.type)}</Col>
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
                            <Skeleton.Input 
                              active 
                              size="small" 
                              style={{ width: '60%', height: '16px' }} 
                            />
                            <div style={{ marginTop: '4px' }}>
                              <Skeleton.Input 
                                active 
                                size="small" 
                                style={{ width: '40%', height: '12px' }} 
                              />
                            </div>
                          </div>
                          <Space>
                            <Skeleton.Button active size="small" />
                            <Skeleton.Button active size="small" />
                          </Space>
                        </div>
                      ))}
                    </div>
                  ) : documents && documents.length > 0 ? (
                    // Hiển thị tài liệu
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
                    // Không có tài liệu
                    <div style={{ 
                      padding: '16px', 
                      textAlign: 'center', 
                      color: '#999',
                      background: '#f8f9fa',
                      borderRadius: '6px'
                    }}>
                      Không có tài liệu đính kèm
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
                <Col span={12}><strong>Mã giao dịch:</strong> {selected.txID || selected.txId}</Col>
                <Col span={12}><strong>Loại:</strong> {getTypeTag(selected.type)}</Col>
              </Row>
              <Row gutter={16} style={{ marginTop: 8 }}>
                <Col span={12}><strong>Thửa đất:</strong> {selected.landParcelId}</Col>
                <Col span={12}><strong>Trạng thái hiện tại:</strong> {getStatusTag(selected.status)}</Col>
              </Row>
            </div>

            {transactionHistory.length > 0 ? (
              <div>
                <h4>Timeline thay đổi ({transactionHistory.length} bản ghi):</h4>
                <div style={{ maxHeight: 600, overflowY: 'auto' }}>
                  {transactionHistory.map((item, index) => {
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
                        borderLeft: '4px solid #722ed1',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}>
                        <div style={{ marginBottom: 8 }}>
                          <strong>Bước {transactionHistory.length - index}:</strong>
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
        onClose={() => {
          setDocumentDetailOpen(false);
          // Reset analysis states khi đóng modal
          setAnalysis(null);
          setBlockchainData(null);
          setComparisonResult(null);
        }}
        onVerify={async (docID, notes) => {
          try {
            await documentService.verifyDocument(docID, notes);
            message.success('Xác thực tài liệu thành công');
            // Reload documents để cập nhật trạng thái
            if (selected) {
              onViewDetail(selected);
            }
          } catch (e) {
            message.error(e.message || 'Xác thực thất bại');
          }
        }}
        onReject={async (docID, reason) => {
          try {
            await documentService.rejectDocument(docID, reason);
            message.success('Từ chối tài liệu thành công');
            // Reload documents để cập nhật trạng thái
            if (selected) {
              onViewDetail(selected);
            }
          } catch (e) {
            message.error(e.message || 'Từ chối thất bại');
          }
        }}
        onPreview={() => {
          // Preview được xử lý tự động trong DocumentDetailModal
        }}
        userRole="Org2"
        onAnalyze={onAnalyzeDocument}
        analysis={analysis}
        blockchainData={blockchainData}
        comparisonResult={comparisonResult}
        analyzing={analyzing}
      />
    </Card>
  );
};

export default TransactionManagementPage;
