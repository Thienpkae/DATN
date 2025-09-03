import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Space, Tag, message, Drawer, Row, Col, Tooltip, Alert, Typography, Divider } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EyeOutlined, HistoryOutlined, FileTextOutlined, CheckCircleOutlined } from '@ant-design/icons';
import transactionService from '../../../services/transactionService';
import authService from '../../../services/auth';
import documentService from '../../../services/documentService';
import { DocumentDetailModal } from '../../Common';
import { REQUIRED_DOCUMENTS, LAND_USE_PURPOSES } from '../../../services/index';

const { TextArea } = Input;

const { Option } = Select;
const { Text } = Typography;

// Hàm phân loại tài liệu dựa trên tên
const getDocumentTypeFromTitle = (documentTitle) => {
  if (!documentTitle) return null;
  
  const title = documentTitle.toLowerCase();
  
  // Giấy chứng nhận -> Certificate
  if (title.includes('giấy chứng nhận') || title.includes('chứng nhận')) {
    return 'CERTIFICATE';
  }
  
  // Hợp đồng -> Contract
  if (title.includes('hợp đồng')) {
    return 'CONTRACT';
  }
  
  // Đơn đăng ký -> Form
  if (title.includes('đơn đăng ký') || 
      title.includes('đơn đề nghị') || 
      title.includes('đơn xin')) {
    return 'FORM';
  }
  
  // Bản đồ -> Map
  if (title.includes('bản vẽ') ||
      title.includes('mảnh trích')) {
    return 'MAP';
  }
  
  // Các loại khác không cần check
  return null;
};

// Hàm kiểm tra tài liệu có phù hợp với yêu cầu không
const isDocumentValidForRequirement = (documentTitle, documentType, requiredDocumentName) => {
  const expectedType = getDocumentTypeFromTitle(requiredDocumentName);
  
  // Nếu không cần kiểm tra loại (expectedType = null), chấp nhận mọi tài liệu
  if (!expectedType) {
    return true;
  }
  
  // Nếu cần kiểm tra, phải đúng loại
  return documentType === expectedType;
};

const TransactionManagementPage = () => {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const defaultFilters = {
    keyword: '',
    type: undefined,
    status: undefined
  };
  
  const [filters, setFilters] = useState(defaultFilters);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [linkDocumentOpen, setLinkDocumentOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [form] = Form.useForm();
  const [confirmForm] = Form.useForm();
  const [linkDocumentForm] = Form.useForm();
  
  // States for document linking
  const [userDocuments, setUserDocuments] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState({}); // Object: { docType: docID }

  
  // States for land management
  const [userLands, setUserLands] = useState([]);
  const [landLoading, setLandLoading] = useState(false);

  // Document detail modal states
  const [documentDetailOpen, setDocumentDetailOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  
  // State for transaction type selection
  const [selectedTransactionType, setSelectedTransactionType] = useState(null);

  const loadUserDocuments = async () => {
    try {
      const user = authService.getCurrentUser();
      if (!user?.userId) return;
      
      const res = await documentService.getDocumentsByUploader(user.userId);
      const docs = res?.documents || [];
      
      setUserDocuments(docs);
    } catch (e) {
      console.error('Lỗi khi tải tài liệu:', e);
      message.error('Không thể tải danh sách tài liệu');
    }
  };

  const loadUserLands = async () => {
    try {
      setLandLoading(true);
      const user = authService.getCurrentUser();
      if (!user?.userId) return;
      
      // Gọi service để lấy danh sách thửa đất của user
      const res = await transactionService.getLandsByOwner(user.userId);
      const lands = Array.isArray(res) ? res : (res?.data ?? []);
      setUserLands(lands);
    } catch (e) {
      console.error('Lỗi khi tải danh sách thửa đất:', e);
      message.error('Không thể tải danh sách thửa đất');
    } finally {
      setLandLoading(false);
    }
  };
  


  const loadMyTransactions = async () => {
    try {
      setLoading(true);
      const user = authService.getCurrentUser();
      if (!user?.userId) {
        message.error('Không xác định được người dùng');
        return;
      }
      const res = await transactionService.getTransactionsByUser(user.userId);
      const data = Array.isArray(res) ? res : (res?.data ?? []);
      setTransactions(data);
    } catch (e) {
      message.error(e.message || 'Không tải được giao dịch của tôi');
    } finally {
      setLoading(false);
    }
  };



  // Org3 chỉ tải giao dịch của mình
  useEffect(() => {
    loadMyTransactions();
  }, []);

  useEffect(() => {
    if (createOpen) {
      loadUserDocuments();
      loadUserLands();
    }
  }, [createOpen]);

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

  const onCreate = async () => {
    try {
      const user = authService.getCurrentUser();
      if (!user?.userId) {
        message.error('Vui lòng đăng nhập để tạo giao dịch');
        return;
      }

      const values = await form.validateFields();
      
      // Thêm transaction type vào values
      values.type = selectedTransactionType;
      
      // Validation cho JSON fields
      if (selectedTransactionType === 'SPLIT' && values.newParcels) {
        try {
          JSON.parse(values.newParcels);
        } catch (e) {
          message.error('Thông tin thửa đất mới không đúng định dạng JSON');
          return;
        }
      }
      
      if (selectedTransactionType === 'MERGE' && values.newParcel) {
        try {
          JSON.parse(values.newParcel);
        } catch (e) {
          message.error('Thông tin thửa đất mới không đúng định dạng JSON');
          return;
        }
      }

      // Validation loại tài liệu đính kèm
      const requiredDocs = REQUIRED_DOCUMENTS[selectedTransactionType] || [];
      const documentValidationErrors = [];
      
      for (const requiredDocName of requiredDocs) {
        const selectedDocId = selectedDocuments[requiredDocName];
        if (selectedDocId) {
          // Tìm thông tin tài liệu được chọn
          const selectedDoc = userDocuments.find(doc => doc.docID === selectedDocId);
          if (selectedDoc) {
            // Kiểm tra loại tài liệu có phù hợp không
            if (!isDocumentValidForRequirement(selectedDoc.title, selectedDoc.type, requiredDocName)) {
              const expectedType = getDocumentTypeFromTitle(requiredDocName);
              if (expectedType) {
                const typeMapping = {
                  'CERTIFICATE': 'Giấy chứng nhận',
                  'CONTRACT': 'Hợp đồng', 
                  'FORM': 'Đơn đăng ký',
                  'MAP': 'Bản đồ'
                };
                documentValidationErrors.push(
                  `Tài liệu "${selectedDoc.title}" (loại ${selectedDoc.type}) không phù hợp với yêu cầu "${requiredDocName}". Cần loại: ${typeMapping[expectedType] || expectedType}`
                );
              }
            }
          }
        }
      }
      
      if (documentValidationErrors.length > 0) {
        message.error(
          <div>
            <div style={{ marginBottom: 8, fontWeight: 'bold' }}>Tài liệu đính kèm không phù hợp:</div>
            {documentValidationErrors.map((error, index) => (
              <div key={`error-${index}`} style={{ marginBottom: 4 }}>• {error}</div>
            ))}
          </div>
        );
        return;
      }

      const validation = transactionService.validateTransactionData(values, selectedTransactionType);
      if (!validation.isValid) {
        message.warning(validation.errors.join('\n'));
        return;
      }
      setLoading(true);
      
      // Chuẩn bị data chung với documentIds và reason
      const baseData = {
        landParcelID: values.landParcelID,
        fromOwnerID: user.userId, // Tự động lấy từ user hiện tại
        documentIds: Object.values(selectedDocuments),  // Chuyển object thành array
        reason: values.reason || ''  // Thêm lý do tạo yêu cầu
      };
      
      switch (selectedTransactionType) {
        case 'TRANSFER':
          await transactionService.createTransferRequest({
            ...baseData,
            toOwnerID: values.toOwnerID
          });
          break;
        case 'SPLIT':
          await transactionService.createSplitRequest({
            ...baseData,
            ownerID: user.userId, // Tự động lấy từ user hiện tại
            newParcelsStr: values.newParcels
          });
          break;
        case 'MERGE':
          await transactionService.createMergeRequest({
            ...baseData,
            ownerID: user.userId, // Tự động lấy từ user hiện tại
            parcelIDs: values.parcelIDs.split(',').map(id => id.trim()),
            newParcelStr: values.newParcel
          });
          break;
        case 'CHANGE_PURPOSE':
          await transactionService.createChangePurposeRequest({
            ...baseData,
            ownerID: user.userId, // Tự động lấy từ user hiện tại
            newPurpose: values.newPurpose
            });
          break;
        case 'REISSUE':
          await transactionService.createReissueRequest({
            ...baseData,
            ownerID: user.userId // Tự động lấy từ user hiện tại
          });
          break;
        default:
          throw new Error('Loại giao dịch không được hỗ trợ');
      }
      
      message.success(`Tạo yêu cầu thành công${Object.keys(selectedDocuments).length > 0 ? ` với ${Object.keys(selectedDocuments).length} tài liệu đính kèm` : ''}`);
      setCreateOpen(false);
      form.resetFields();
      setSelectedDocuments({});  // Reset danh sách tài liệu đã chọn
      setSelectedTransactionType(null);  // Reset loại giao dịch đã chọn
      loadMyTransactions();
    } catch (e) {
      message.error(e.message || 'Tạo yêu cầu thất bại');
    } finally {
      setLoading(false);
    }
  };

  const onConfirm = async (isAccepted) => {
    try {
      const values = await confirmForm.validateFields();
      setLoading(true);
      
      await transactionService.confirmTransfer({
        txID: values.txID,
        landParcelID: values.landParcelID,
        toOwnerID: values.toOwnerID,
        isAccepted: isAccepted,
        reason: values.reason || ''
      });
      
      const actionText = isAccepted ? 'chấp nhận' : 'từ chối';
      message.success(`${actionText} giao dịch chuyển nhượng thành công!`);
      setConfirmOpen(false);
      confirmForm.resetFields();
      loadMyTransactions();
    } catch (e) {
      message.error(e.message || 'Xử lý thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Link supplement documents to transaction - UC-18
  const onLinkSupplementDocuments = async () => {
    try {
      const values = await linkDocumentForm.validateFields();
      if (!values.selectedDocuments || values.selectedDocuments.length === 0) {
        message.warning('Vui lòng chọn ít nhất một tài liệu để bổ sung');
        return;
      }

      setLoading(true);
      await documentService.linkDocumentToTransaction(values.selectedDocuments, selected.txId);
      
      message.success(`Đã liên kết ${values.selectedDocuments.length} tài liệu bổ sung với giao dịch thành công`);
      setLinkDocumentOpen(false);
      linkDocumentForm.resetFields();
      loadMyTransactions();
    } catch (e) {
      message.error(e.message || 'Liên kết tài liệu bổ sung thất bại');
    } finally {
      setLoading(false);
    }
  };

  const onViewHistory = async (txID) => {
    try {
      const res = await transactionService.getTransactionHistory(txID);
      setHistory(Array.isArray(res) ? res : (res?.data ?? []));
      setHistoryOpen(true);
    } catch (e) {
      message.error(e.message || 'Không tải được lịch sử');
    }
  };

  const onViewDetail = async (record) => {
    setSelected(record);
    setDetailOpen(true);
    
    // Load documents if available
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
  };

  const onViewDocumentDetail = async (document) => {
    setSelectedDocument(document);
    setDocumentDetailOpen(true);
    console.log('🔗 Mở modal xem chi tiết tài liệu:', document.docID);
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

  const getTypeTag = (type) => {
    return <Tag color="blue">{transactionService.getTransactionTypeText(type)}</Tag>;
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

  const getTransactionTypeText = (type) => {
    const typeTexts = {
      'TRANSFER': 'Chuyển nhượng quyền sử dụng đất',
      'SPLIT': 'Tách thửa đất',
      'MERGE': 'Hợp thửa đất', 
      'CHANGE_PURPOSE': 'Thay đổi mục đích sử dụng đất',
      'REISSUE': 'Cấp lại giấy chứng nhận'
    };
    return typeTexts[type] || type;
  };

  const canConfirm = (transaction) => {
    const user = authService.getCurrentUser();
    // Chỉ hiển thị button xác nhận khi:
    // 1. Giao dịch đã được APPROVED
    // 2. Là giao dịch TRANSFER 
    // 3. User hiện tại là người nhận chuyển nhượng (toOwnerId)
    return transaction.status === 'APPROVED' && 
           transaction.type === 'TRANSFER' &&
           user?.userId === transaction.toOwnerId;
  };

  const canSupplement = (transaction) => {
    return transaction.status === 'SUPPLEMENT_REQUESTED';
  };

  const columns = useMemo(() => ([
    { title: 'Mã giao dịch', dataIndex: 'txId', key: 'txId' },
    { title: 'Loại', dataIndex: 'type', key: 'type', render: v => getTypeTag(v) },
    { title: 'Thửa đất', dataIndex: 'landParcelId', key: 'landParcelId' },
            { 
          title: 'Người gửi', 
          dataIndex: 'fromOwnerId', 
          key: 'fromOwnerId',
          render: (v) => {
            const currentUser = authService.getCurrentUser();
            return v === currentUser?.userId ? 
              <Tag color="blue">Bạn</Tag> : 
              <code>{v}</code>
          }
        },
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
            <Button icon={<HistoryOutlined />} onClick={() => onViewHistory(record.txId)} />
          </Tooltip>
          {canConfirm(record) && (
            <Tooltip title="Xác nhận">
              <Button 
                type="primary" 
                icon={<CheckCircleOutlined />} 
                onClick={() => {
                  setSelected(record);
                  confirmForm.setFieldsValue({ 
                    txID: record.txId,
                    landParcelID: record.landParcelId,
                    toOwnerID: record.toOwnerId
                  });
                  setConfirmOpen(true);
                }}
              >
                Xác nhận
              </Button>
            </Tooltip>
          )}
          {canSupplement(record) && (
            <Tooltip title="Bổ sung tài liệu theo yêu cầu">
              <Button 
                type="default" 
                icon={<FileTextOutlined />} 
                onClick={() => {
                  setSelected(record);
                  setLinkDocumentOpen(true);
                }}
                style={{ backgroundColor: '#faad14', borderColor: '#faad14', color: 'white' }}
              >
                Bổ sung
              </Button>
            </Tooltip>
          )}
        </Space>
      )
    }
  ]), [confirmForm]);

  const renderDocumentSection = (selectedType) => {
    if (!selectedType) return null;

    const requiredDocs = REQUIRED_DOCUMENTS[selectedType] || [];
    
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          {requiredDocs.map((docType, index) => (
            <div key={index} style={{ 
              marginBottom: 16,
              padding: '16px',
              background: '#fff',
              borderRadius: '8px',
              border: '1px solid #e8e8e8',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  color: '#1890ff', 
                  marginBottom: 6,
                  fontSize: '14px'
                }}>
                  {index + 1}. {docType}
                </div>
                {(() => {
                  const expectedType = getDocumentTypeFromTitle(docType);
                  if (expectedType) {
                    const typeMapping = {
                      'CERTIFICATE': 'Giấy chứng nhận',
                      'CONTRACT': 'Hợp đồng', 
                      'FORM': 'Đơn đăng ký',
                      'MAP': 'Bản đồ'
                    };
                    return (
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#666',
                        background: '#f6f6f6',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        marginBottom: 8
                      }}>
                        💡 Cần loại tài liệu: <strong>{typeMapping[expectedType] || expectedType}</strong>
                      </div>
                    );
                  }
                  return (
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#52c41a',
                      background: '#f6ffed',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      marginBottom: 8
                    }}>
                      ✅ Chấp nhận mọi loại tài liệu
                    </div>
                  );
                })()}
              </div>
              <div style={{ 
              display: 'flex', 
              alignItems: 'center',
                gap: 12
              }}>
                <Select
                  placeholder="Chọn tài liệu..."
                  style={{ width: '100%' }}
                  allowClear
                  value={selectedDocuments[docType] || undefined}
                  onChange={(docID) => {
                    if (docID) {
                      // Tự động gỡ file cũ cùng loại trước khi thêm file mới
                      setSelectedDocuments(prev => ({
                        ...prev,
                        [docType]: docID
                      }));
                      message.success('Đã đính kèm tài liệu');
                    } else {
                      // Khi clear dropdown, gỡ file cùng loại
                      setSelectedDocuments(prev => {
                        const newState = { ...prev };
                        delete newState[docType];
                        return newState;
                      });
                      message.info('Đã gỡ tài liệu');
                    }
                  }}
                >
                  {userDocuments.length === 0 ? (
                    <Option disabled value="no-docs">
                      Không có tài liệu nào
                    </Option>
                  ) : (
                    userDocuments
                      .filter(doc => !Object.values(selectedDocuments).includes(doc.docID)) // Chỉ hiển thị tài liệu chưa được chọn
                      .filter(doc => isDocumentValidForRequirement(doc.title, doc.type, docType)) // Kiểm tra loại tài liệu phù hợp
                    .map((doc) => (
                      <Option key={doc.docID} value={doc.docID}>
                        <Tag color="blue" size="small">{doc.type}</Tag>
                        {doc.title}
                        {!isDocumentValidForRequirement(doc.title, doc.type, docType) && (
                          <Tag color="orange" size="small" style={{ marginLeft: 4 }}>
                            Không phù hợp
                          </Tag>
                        )}
                      </Option>
                    ))
                  )}
                </Select>
                {selectedDocuments[docType] && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    background: '#52c41a',
                    borderRadius: '50%',
                    boxShadow: '0 2px 4px rgba(82, 196, 26, 0.3)',
                    flexShrink: 0
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      background: '#fff',
                      borderRadius: '50%'
                    }} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>


      </div>
    );
  };

  const renderTransactionTypeSelection = () => {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <h3 style={{ marginBottom: '24px' }}>Chọn loại giao dịch biến động đất đai</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
          <Button 
            size="large" 
            style={{ width: '300px', textAlign: 'left' }}
            onClick={() => setSelectedTransactionType('TRANSFER')}
          >
            Chuyển nhượng quyền sử dụng đất
          </Button>
          <Button 
            size="large" 
            style={{ width: '300px', textAlign: 'left' }}
            onClick={() => setSelectedTransactionType('SPLIT')}
          >
            Tách thửa đất
          </Button>
          <Button 
            size="large" 
            style={{ width: '300px', textAlign: 'left' }}
            onClick={() => setSelectedTransactionType('MERGE')}
          >
            Hợp thửa đất
          </Button>
          <Button 
            size="large" 
            style={{ width: '300px', textAlign: 'left' }}
            onClick={() => setSelectedTransactionType('CHANGE_PURPOSE')}
          >
            Thay đổi mục đích sử dụng đất
          </Button>
          <Button 
            size="large" 
            style={{ width: '300px', textAlign: 'left' }}
            onClick={() => setSelectedTransactionType('REISSUE')}
          >
            Cấp lại giấy chứng nhận
          </Button>
        </div>
      </div>
    );
  };

  const renderCreateForm = () => {
    if (!selectedTransactionType) {
      return renderTransactionTypeSelection();
    }

    return (
      <Form layout="vertical" form={form}>
        {/* Header với loại giao dịch đã chọn */}
        <div style={{ 
          marginBottom: '24px', 
          padding: '16px', 
          background: '#f0f9ff', 
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '16px', fontWeight: 500 }}>
            Loại giao dịch: <Tag color="blue">{getTransactionTypeText(selectedTransactionType)}</Tag>
          </span>
          <Button 
            size="small" 
            onClick={() => {
              setSelectedTransactionType(null);
              setSelectedDocuments({});
              form.resetFields();
            }}
          >
            Chọn lại
          </Button>
        </div>
        
        {/* Layout 2 cột: Thông tin giao dịch | Tài liệu đính kèm */}
        <Row gutter={24}>
          {/* Cột trái: Thông tin giao dịch */}
          <Col span={12}>
            <div style={{ 
              padding: '20px', 
              background: '#fafafa', 
              borderRadius: '8px',
              border: '1px solid #e8e8e8',
              height: '100%',
              minHeight: '500px'
            }}>
              <h4 style={{ marginBottom: '20px', color: '#1890ff', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
                📝 Thông tin giao dịch
              </h4>
              
            <Form.Item name="landParcelID" label="Mã thửa đất" rules={[{ required: true, message: 'Bắt buộc' }]}>
              <Select 
                placeholder="Chọn thửa đất" 
                showSearch={false}
                loading={landLoading}
                notFoundContent={landLoading ? 'Đang tải...' : 'Không có thửa đất nào'}
                optionLabelProp="value"
              >
                {userLands.map((land) => (
                  <Option key={land.id} value={land.id}>
                    <div style={{ padding: '4px 0' }}>
                      <div style={{ fontWeight: 'bold', color: '#1890ff' }}>
                        {land.id}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        Diện tích: {land.area}m² | Mục đích: {LAND_USE_PURPOSES[land.landUsePurpose] || land.landUsePurpose || 'Chưa có'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        Pháp lý: {land.legalStatus && land.legalStatus.trim() !== '' ? land.legalStatus : 'Chưa có'} | Địa chỉ: {land.location || 'Chưa có'}
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
              {userLands.length === 0 && !landLoading && (
                <div style={{ marginTop: 8, color: '#ff4d4f', fontSize: '12px' }}>
                  ⚠️ Bạn chưa có thửa đất nào. Vui lòng liên hệ cơ quan quản lý đất đai.
                </div>
              )}
            </Form.Item>

        {/* CCCD chủ sở hữu sẽ tự động lấy từ user hiện tại */}
        <Form.Item label="CCCD chủ sở hữu">
          <Input 
            value={authService.getCurrentUser()?.userId || 'N/A'} 
            disabled 
            style={{ backgroundColor: '#f5f5f5' }}
          />
        </Form.Item>

        {/* Conditional fields dựa trên loại giao dịch đã chọn */}
        {selectedTransactionType === 'TRANSFER' && (
          <Form.Item name="toOwnerID" label="CCCD người nhận chuyển nhượng" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Input placeholder="Nhập số CCCD người nhận" />
          </Form.Item>
        )}

        {selectedTransactionType === 'CHANGE_PURPOSE' && (
          <Form.Item name="newPurpose" label="Mục đích sử dụng mới" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Select placeholder="Chọn mục đích sử dụng">
              {Object.entries(LAND_USE_PURPOSES).map(([code, name]) => (
                <Option key={code} value={code}>{code} - {name}</Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {selectedTransactionType === 'SPLIT' && (
          <Form.Item name="newParcels" label="Thông tin thửa đất mới" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Input.TextArea 
              placeholder="Nhập thông tin thửa đất mới theo định dạng JSON (VD: [{'id':'L001-1','area':100},{'id':'L001-2','area':150}])" 
                    rows={3}
            />
          </Form.Item>
        )}

        {selectedTransactionType === 'MERGE' && (
          <>
            <Form.Item name="parcelIDs" label="Mã các thửa đất cần gộp" rules={[{ required: true, message: 'Bắt buộc' }]}>
              <Input placeholder="Nhập mã các thửa đất, phân cách bằng dấu phẩy (VD: L001,L002)" />
            </Form.Item>
            <Form.Item name="newParcel" label="Thông tin thửa đất mới" rules={[{ required: true, message: 'Bắt buộc' }]}>
              <Input.TextArea 
                placeholder="Nhập thông tin thửa đất mới theo định dạng JSON (VD: {'id':'L001-MERGED','area':250})" 
                      rows={2}
              />
            </Form.Item>
          </>
        )}

              {/* Lý do tạo yêu cầu */}
              <Form.Item 
                name="reason" 
                label="Lý do tạo yêu cầu" 
                rules={[{ required: true, message: 'Vui lòng nhập lý do tạo yêu cầu' }]}
              >
                <Input.TextArea 
                  placeholder="Nhập lý do tạo yêu cầu..." 
                  rows={3}
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </div>
          </Col>

          {/* Cột phải: Tài liệu đính kèm */}
          <Col span={12}>
            <div style={{ 
              padding: '20px', 
              background: '#fafafa', 
              borderRadius: '8px',
              border: '1px solid #e8e8e8',
              height: '100%',
              minHeight: '500px'
            }}>
              <h4 style={{ marginBottom: '20px', color: '#52c41a', borderBottom: '2px solid #52c41a', paddingBottom: '8px' }}>
                📎 Tài liệu đính kèm
              </h4>

        {/* Document section */}
        {renderDocumentSection(selectedTransactionType)}
            </div>
          </Col>
        </Row>
      </Form>
    );
  };

  return (
    <Card
      title="Quản lý giao dịch (Org3)"
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
            <Option value="FORWARDED">Đã chuyển tiếp</Option>
            <Option value="APPROVED">Đã phê duyệt</Option>
            <Option value="REJECTED">Bị từ chối</Option>
            <Option value="CONFIRMED">Đã xác nhận</Option>
            <Option value="SUPPLEMENT_REQUESTED">Yêu cầu bổ sung</Option>
          </Select>
          <Button icon={<SearchOutlined />} onClick={onSearch}>Tìm kiếm</Button>
          <Button icon={<ReloadOutlined />} onClick={() => loadMyTransactions()}>Tải lại</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>Tạo giao dịch</Button>
        </Space>
      }
    >
      {/* Org3 chỉ xem giao dịch của mình - bỏ tabs */}

      <Table
        rowKey={(r) => r.txID}
        loading={loading}
        dataSource={transactions}
        columns={columns}
        scroll={{ x: 1400 }}
        pagination={{ pageSize: 10, showSizeChanger: true }}
      />

      {/* Create Transaction */}
      <Modal 
        title={selectedTransactionType ? `Tạo yêu cầu: ${getTransactionTypeText(selectedTransactionType)}` : "Chọn loại giao dịch"} 
        open={createOpen} 
        onOk={selectedTransactionType ? onCreate : null}
        onCancel={() => {
          setCreateOpen(false);
          form.resetFields();
          setSelectedDocuments({});
          setSelectedTransactionType(null);
        }} 
        confirmLoading={loading} 
        width={1200}
        okText={selectedTransactionType ? "Tạo yêu cầu" : undefined}
        cancelText="Hủy"
        footer={selectedTransactionType ? undefined : [
          <Button key="cancel" onClick={() => {
            setCreateOpen(false);
            form.resetFields();
            setSelectedDocuments({});
            setSelectedTransactionType(null);
          }}>
            Hủy
          </Button>
        ]}
      >
        {renderCreateForm()}
      </Modal>

      {/* Confirm Transaction */}
      <Modal 
        title="Xác nhận giao dịch chuyển nhượng" 
        open={confirmOpen} 
        footer={[
          <Button key="cancel" onClick={() => {
            setConfirmOpen(false);
            confirmForm.resetFields();
          }}>
            Hủy
          </Button>,
          <Button 
            key="reject" 
            danger 
            loading={loading}
            onClick={() => onConfirm(false)}
          >
            Từ chối
          </Button>,
          <Button 
            key="accept" 
            type="primary" 
            loading={loading}
            onClick={() => onConfirm(true)}
          >
            Chấp nhận
          </Button>
        ]}
        onCancel={() => {
          setConfirmOpen(false);
          confirmForm.resetFields();
        }} 
        width={600}
      >
        <Form layout="vertical" form={confirmForm}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="txID" label="Mã giao dịch">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="landParcelID" label="Mã thửa đất">
                <Input disabled />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="toOwnerID" label="CCCD người nhận">
                <Input disabled />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item 
            label="Lý do (nếu từ chối)" 
            name="reason"
          >
            <TextArea 
              rows={3} 
              placeholder="Nhập lý do từ chối (tùy chọn)"
            />
          </Form.Item>
          
          <Alert
            message="Quyết định về giao dịch chuyển nhượng"
            description="Bạn có thể chấp nhận hoặc từ chối giao dịch chuyển nhượng này. Nếu chấp nhận, giao dịch sẽ được chuyển đến cơ quan có thẩm quyền để xác minh và phê duyệt. Nếu từ chối, giao dịch sẽ được đóng."
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        </Form>
      </Modal>

      {/* Transaction Detail */}
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
            
            {selected.details && (
              <div style={{ marginTop: 16 }}>
                <strong>Chi tiết:</strong>
                <div style={{ 
                  marginTop: 8, 
                  padding: 12, 
                  background: '#f5f5f5', 
                  borderRadius: 4,
                  borderLeft: '4px solid #1890ff'
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

            <Divider>Tài liệu đính kèm</Divider>
            
            {selected.documentIds && selected.documentIds.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <strong>Tài liệu đính kèm:</strong>
                <div style={{ marginTop: 8 }}>
                  {documentsLoading ? (
                    // Loading skeleton giống Org2
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
                    // Hiển thị tài liệu giống hệt Org2
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
                    // Không có tài liệu giống Org2
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

      {/* Link Supplement Documents Modal - UC-18 */}
      <Modal
        title="Bổ sung tài liệu cho giao dịch"
        open={linkDocumentOpen}
        onOk={onLinkSupplementDocuments}
        onCancel={() => {
          setLinkDocumentOpen(false);
          linkDocumentForm.resetFields();
        }}
        confirmLoading={loading}
        width={800}
        okText="Liên kết tài liệu"
        cancelText="Hủy"
      >
        <div>
          <Alert
            message="Giao dịch cần bổ sung tài liệu"
            description={
              <div>
                <div>Cán bộ UBND cấp xã đã yêu cầu bổ sung tài liệu cho giao dịch này.</div>
                <div style={{ marginTop: 8 }}>
                  <strong>Mã giao dịch:</strong> {selected?.txId} | 
                  <strong> Loại:</strong> {selected ? getTransactionTypeText(selected.type) : ''}
                </div>
                {selected?.details && (
                  <div style={{ marginTop: 8 }}>
                    <strong>Chi tiết yêu cầu:</strong> {selected.details}
                  </div>
                )}
              </div>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form form={linkDocumentForm} layout="vertical">
            <Form.Item
              name="selectedDocuments"
              label="Chọn tài liệu bổ sung:"
              rules={[{ required: true, message: 'Vui lòng chọn ít nhất một tài liệu' }]}
            >
              <Select
                mode="multiple"
                placeholder="Chọn tài liệu từ danh sách của bạn"
                style={{ width: '100%' }}
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {userDocuments.map(doc => (
                  <Option key={doc.docID} value={doc.docID}>
                    <div>
                      <strong>{doc.title}</strong>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {doc.type} | {doc.status === 'VERIFIED' ? '✅ Đã xác minh' : doc.status === 'REJECTED' ? '❌ Không hợp lệ' : '⏳ Chờ xác minh'}
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f0f0f0', borderRadius: 4 }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                💡 <strong>Lưu ý:</strong> Sau khi liên kết tài liệu bổ sung, giao dịch sẽ được đặt lại về trạng thái "Chờ xử lý" 
                để cán bộ UBND cấp xã xem xét lại hồ sơ đã bổ sung.
              </Text>
            </div>
          </Form>
        </div>
      </Modal>

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
                <Col span={12}><strong>Mã giao dịch:</strong> {selected.txId || selected.txID}</Col>
                <Col span={12}><strong>Loại:</strong> {getTypeTag(selected.type)}</Col>
              </Row>
              <Row gutter={16} style={{ marginTop: 8 }}>
                <Col span={12}><strong>Thửa đất:</strong> {selected.landParcelId}</Col>
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
                        borderLeft: '4px solid #1890ff',
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
        onVerify={null} // Org3 không có quyền xác thực
        onReject={null} // Org3 không có quyền từ chối
        userRole="Org3"
      />
    </Card>
  );
};

export default TransactionManagementPage;
