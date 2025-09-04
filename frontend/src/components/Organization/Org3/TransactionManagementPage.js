import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Space, Tag, message, Drawer, Row, Col, Tooltip, Alert, Typography, Divider, Steps, Collapse } from 'antd';
import '../../../styles/transaction-management.css';
import { 
  PlusOutlined, 
  SearchOutlined, 
  ReloadOutlined, 
  EyeOutlined, 
  HistoryOutlined, 
  FileTextOutlined, 
  CheckCircleOutlined,
  SwapOutlined,
  ScissorOutlined,
  MergeCellsOutlined,
  EditOutlined,
  FileProtectOutlined,
  ArrowRightOutlined,
  
} from '@ant-design/icons';
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
  
  // Bản kê khai nộp thuế -> Tax Document
  if (title.includes('bản kê khai') || 
      title.includes('kê khai') ||
      title.includes('nộp thuế') ||
      title.includes('thuế')) {
    return 'TAX_DOCUMENT';
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
  
  // States for merge land selection
  const [mergeParcelIds, setMergeParcelIds] = useState(['', '']); // Bắt đầu với 2 field

  // Document detail modal states
  const [documentDetailOpen, setDocumentDetailOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  
  // State for transaction type selection
  const [selectedTransactionType, setSelectedTransactionType] = useState(null);
  // Step state: 0 = chọn loại, 1 = nhập thông tin và upload tài liệu, 2 = hoàn tất
  const [currentStep, setCurrentStep] = useState(0);

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
      // Khi mở modal, nếu chưa chọn loại thì về bước 0
      setCurrentStep(selectedTransactionType ? 1 : 0);
    }
  }, [createOpen, selectedTransactionType]);

  // Debug form state
  useEffect(() => {
    if (createOpen && currentStep > 0) {
      const formValues = form.getFieldsValue();
      console.log('📝 Current form values:', formValues);
      console.log('🎯 Selected transaction type:', selectedTransactionType);
      console.log('📄 Selected documents:', selectedDocuments);
    }
  }, [createOpen, currentStep, form, selectedTransactionType, selectedDocuments]);


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

      // Validate form trước khi tạo - nhưng bỏ qua landParcelID cho MERGE
      console.log('🔍 Debug validation - selectedTransactionType:', selectedTransactionType);
      
      let values;
      try {
        if (selectedTransactionType === 'MERGE') {
          console.log('✅ MERGE: Chỉ validate reason field');
          // Với MERGE, chỉ validate reason, không cần landParcelID
          values = await form.validateFields(['reason']);
        } else {
          console.log('📝 OTHER: Validate tất cả fields');
          // Với các loại khác, validate đầy đủ
          values = await form.validateFields();
        }
        console.log('✅ Validation success, values:', values);
      } catch (errorInfo) {
        console.error('❌ Validation failed:', errorInfo);
        const errorFields = errorInfo.errorFields || [];
        const errorMessages = errorFields.map(field => field.errors.join(', ')).join('; ');
        message.error(`Vui lòng kiểm tra lại thông tin: ${errorMessages}`);
        return;
      }
      
      // Xử lý parcelIDs cho MERGE từ dynamic fields
      if (selectedTransactionType === 'MERGE') {
        const validParcelIds = mergeParcelIds.filter(id => id.trim() !== '');
        if (validParcelIds.length < 2) {
          message.error('Cần chọn ít nhất 2 thửa đất để gộp');
          return;
        }
        values.parcelIDs = validParcelIds;
      }
      
      // Thêm transaction type vào values
      values.type = selectedTransactionType;
      
      // Không cần validation JSON fields cho tạo yêu cầu - chỉ cần ở bước phê duyệt

      console.log('📝 Final values before document validation:', values);
      console.log('🎯 mergeParcelIds state:', mergeParcelIds);
      
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
                  'MAP': 'Bản đồ',
                  'TAX_DOCUMENT': 'Tài liệu thuế'
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

      console.log('📝 Values before service validation:', values);
      const validation = transactionService.validateTransactionData(values, selectedTransactionType);
      console.log('📝 Service validation result:', validation);
      if (!validation.isValid) {
        console.error('❌ Service validation errors:', validation.errors);
        message.warning(validation.errors.join('\n'));
        return;
      }
      setLoading(true);
      
      // Chuẩn bị data chung với documentIds và reason
      const baseData = {
        fromOwnerID: user.userId, // Tự động lấy từ user hiện tại
        documentIds: Object.values(selectedDocuments),  // Chuyển object thành array
        reason: values.reason || ''  // Thêm lý do tạo yêu cầu
      };
      
      // Chỉ thêm landParcelID cho các loại giao dịch cần (không bao gồm MERGE)
      if (selectedTransactionType !== 'MERGE') {
        baseData.landParcelID = values.landParcelID;
      }
      
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
            // Theo chaincode mới: chỉ cần landParcelID, documentIds, reason
            // newParcels sẽ được xử lý ở bước phê duyệt
          });
          break;
        case 'MERGE':
          await transactionService.createMergeRequest({
            ...baseData,
            // Theo chaincode mới: chỉ cần parcelIDs, documentIds, reason
            parcelIDs: values.parcelIDs // Đã được xử lý ở trên thành array
            // Chi tiết cách gộp sẽ được xử lý ở bước phê duyệt dựa trên tài liệu đính kèm
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
      setMergeParcelIds(['', '']); // Reset merge parcel fields
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
      console.log('🔔 Bắt đầu liên kết tài liệu bổ sung');
      console.log('📝 Selected transaction:', selected);
      console.log('📁 User documents:', userDocuments);
      
      // Kiểm tra tài liệu khả dụng
      const existingDocIds = selected?.documentIds || [];
      const availableDocs = userDocuments.filter(doc => !existingDocIds.includes(doc.docID));
      console.log('📊 Available documents for supplement:', availableDocs);
      console.log('🔗 Existing document IDs:', existingDocIds);
      
      if (availableDocs.length === 0) {
        message.warning('Không có tài liệu mới nào để bổ sung. Tất cả tài liệu của bạn đã được liên kết với giao dịch này.');
        return;
      }
      
      let values;
      try {
        values = await linkDocumentForm.validateFields();
        console.log('📝 Form values:', values);
      } catch (validationError) {
        console.error('❌ Validation error:', validationError);
        console.log('📄 Validation error details:');
        console.log('  - values:', validationError.values);
        console.log('  - errorFields:', validationError.errorFields);
        console.log('  - outOfDate:', validationError.outOfDate);
        
        if (validationError.errorFields && validationError.errorFields.length > 0) {
          const errorMessages = validationError.errorFields.map(field => {
            const fieldName = field.name.join('.');
            const errors = field.errors.join(', ');
            console.log(`  - Field "${fieldName}": ${errors}`);
            return `${fieldName}: ${errors}`;
          }).join('; ');
          message.error(`Vui lòng kiểm tra lại: ${errorMessages}`);
        } else {
          message.warning('Vui lòng chọn ít nhất một tài liệu để bổ sung');
        }
        return;
      }
      
      if (!values.selectedDocuments || values.selectedDocuments.length === 0) {
        message.warning('Vui lòng chọn ít nhất một tài liệu để bổ sung');
        return;
      }

      if (!selected || !selected.txId) {
        message.error('Không xác định được giao dịch');
        return;
      }

      console.log('🔗 Gọi request liên kết:', {
        docIDs: values.selectedDocuments,
        txID: selected.txId
      });

      setLoading(true);
      await documentService.linkDocumentToTransaction(values.selectedDocuments, selected.txId);
      
      message.success(`Đã liên kết ${values.selectedDocuments.length} tài liệu bổ sung với giao dịch thành công`);
      setLinkDocumentOpen(false);
      linkDocumentForm.resetFields();
      loadMyTransactions();
    } catch (e) {
      console.error('❌ Lỗi khi liên kết tài liệu:', e);
      // Xử lý các loại lỗi khác nhau
      if (e.response) {
        // Lỗi từ API backend
        message.error(e.response.data?.message || e.message || 'Lỗi từ server khi liên kết tài liệu');
      } else if (e.message) {
        // Lỗi có message
        message.error(e.message);
      } else {
        // Lỗi không xác định
        message.error('Liên kết tài liệu bổ sung thất bại');
      }
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
    if (doc.status === 'VERIFIED') return 'Đã thẩm định';
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
                onClick={async () => {
                  setSelected(record);
                  // Load danh sách tài liệu của user trước khi mở modal
                  await loadUserDocuments();
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
      <div style={{ maxHeight: 'none', overflow: 'visible' }}>
        <Alert
          message="📋 Yêu cầu tài liệu"
          description={`Loại giao dịch này yêu cầu ${requiredDocs.length} tài liệu. Vui lòng đính kèm đầy đủ các tài liệu sau:`}
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />
        
        <div style={{ marginBottom: 16, maxHeight: 'none', overflow: 'visible' }}>
          {requiredDocs.map((docType, index) => (
            <Card
              key={`doc-${index}-${docType}`}
              size="small"
              className="document-requirement-card"
              style={{ marginBottom: 16 }}
              styles={{ body: { padding: '16px' } }}
            >
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
                      'MAP': 'Bản đồ',
                      'TAX_DOCUMENT': 'Tài liệu thuế'
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
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderTransactionTypeSelection = () => {
    const transactionTypes = [
      {
        key: 'TRANSFER',
        title: 'Chuyển nhượng quyền sử dụng đất',
        description: 'Chuyển quyền sử dụng đất từ người này sang người khác',
        icon: <SwapOutlined style={{ fontSize: '24px', color: '#1890ff' }} />,
        color: '#1890ff',
        bgColor: '#e6f7ff'
      },
      {
        key: 'SPLIT',
        title: 'Tách thửa đất',
        description: 'Chia một thửa đất thành nhiều thửa đất nhỏ hơn',
        icon: <ScissorOutlined style={{ fontSize: '24px', color: '#52c41a' }} />,
        color: '#52c41a',
        bgColor: '#f6ffed'
      },
      {
        key: 'MERGE',
        title: 'Hợp thửa đất',
        description: 'Gộp nhiều thửa đất thành một thửa đất lớn hơn',
        icon: <MergeCellsOutlined style={{ fontSize: '24px', color: '#722ed1' }} />,
        color: '#722ed1',
        bgColor: '#f9f0ff'
      },
      {
        key: 'CHANGE_PURPOSE',
        title: 'Thay đổi mục đích sử dụng đất',
        description: 'Thay đổi mục đích sử dụng của thửa đất',
        icon: <EditOutlined style={{ fontSize: '24px', color: '#fa8c16' }} />,
        color: '#fa8c16',
        bgColor: '#fff7e6'
      },
      {
        key: 'REISSUE',
        title: 'Cấp lại giấy chứng nhận',
        description: 'Cấp lại giấy chứng nhận quyền sử dụng đất',
        icon: <FileProtectOutlined style={{ fontSize: '24px', color: '#eb2f96' }} />,
        color: '#eb2f96',
        bgColor: '#fff0f6'
      }
    ];

    return (
      <div style={{ padding: '20px 0' }}>
        {/* Header */}
        <div className="gradient-header" style={{ textAlign: 'center' }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '24px', 
            fontWeight: 600,
            marginBottom: '8px'
          }}>
            🏠 Tạo Giao Dịch Biến Động Đất Đai
          </h2>
          <p style={{ 
            margin: '0 auto', 
            fontSize: '14px', 
            opacity: 0.9,
            maxWidth: '500px'
          }}>
            Chọn loại giao dịch bạn muốn thực hiện. Hệ thống sẽ hướng dẫn bạn qua các bước tiếp theo.
          </p>
        </div>

        {/* Transaction Type Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          {transactionTypes.map((type) => (
            <Col xs={24} sm={12} lg={8} key={type.key}>
              <Card
                hoverable
                className="transaction-type-card"
                style={{
                  height: '100%',
                  cursor: 'pointer',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}
                styles={{
                  body: {
                    padding: '24px',
                    textAlign: 'center',
                    background: type.bgColor,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }
                }}
                onClick={() => setSelectedTransactionType(type.key)}
              >
                <div>
                  <div style={{ marginBottom: '16px' }}>
                    {type.icon}
                  </div>
                  <h3 style={{ 
                    margin: '0 0 8px 0', 
                    fontSize: '16px', 
                    fontWeight: 600,
                    color: type.color
                  }}>
                    {type.title}
                  </h3>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '13px', 
                    color: '#666',
                    lineHeight: '1.4'
                  }}>
                    {type.description}
                  </p>
                </div>
                <div style={{ 
                  marginTop: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: type.color,
                  fontSize: '12px',
                  fontWeight: 500
                }}>
                  <ArrowRightOutlined style={{ marginRight: '4px' }} />
                  Chọn loại này
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Footer */}
        <div style={{ 
          textAlign: 'center', 
          padding: '16px',
          background: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <Text type="secondary" style={{ fontSize: '13px' }}>
            💡 Mỗi loại giao dịch có yêu cầu tài liệu khác nhau. Hãy chuẩn bị sẵn các tài liệu cần thiết.
          </Text>
        </div>
      </div>
    );
  };

  const renderCreateForm = () => {
    // Bước 0: Chọn loại giao dịch
    if (currentStep === 0 || !selectedTransactionType) {
      return renderTransactionTypeSelection();
    }

    // Bước 1 và 2: Hiển thị theo từng phần
    return (
      <div>
        {/* Progress Steps */}
        <div style={{ marginBottom: '32px' }}>
          <Steps
            current={currentStep}
            items={[
              { title: 'Chọn loại giao dịch' },
              { title: 'Nhập thông tin và tài liệu' },
              { title: 'Hoàn tất' }
            ]}
          />
        </div>

        {/* Header với loại giao dịch đã chọn */}
        <Card
          style={{ marginBottom: '24px', background: 'white', border: '1px solid #f0f0f0' }}
          styles={{ body: { padding: '20px' } }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>🎯 Loại giao dịch đã chọn</h3>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>{getTransactionTypeText(selectedTransactionType)}</p>
            </div>
            <Button 
              onClick={() => {
                setSelectedTransactionType(null);
                setSelectedDocuments({});
                form.resetFields();
                setCurrentStep(0);
              }}
            >
              Chọn lại
            </Button>
          </div>
        </Card>

        {currentStep === 1 && (
          <Form layout="vertical" form={form}>
            <Collapse
              defaultActiveKey={['info', 'documents']}
              ghost
              style={{ background: 'transparent' }}
              items={[
                {
                  key: 'info',
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px' }}>📝</span>
                      <span style={{ fontSize: '16px', fontWeight: 600 }}>Thông tin giao dịch</span>
                    </div>
                  ),
                  children: (
                    <div style={{ padding: '0 24px 16px 24px' }}>
                      {/* CCCD chủ sở hữu sẽ tự động lấy từ user hiện tại */}
                      <Form.Item 
                        label={
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ color: '#52c41a' }}>👤</span>
                            <span>CCCD chủ sở hữu</span>
                          </div>
                        }
                      >
                        <Input 
                          value={authService.getCurrentUser()?.userId || 'N/A'} 
                          disabled 
                          style={{ 
                            backgroundColor: '#f5f5f5',
                            borderRadius: '8px',
                            border: '1px solid #d9d9d9'
                          }}
                        />
                      </Form.Item>

                      {/* Conditional fields dựa trên loại giao dịch đã chọn */}
                      {/* Field mã thửa đất chỉ hiện thị với các loại khác MERGE */}
                      {selectedTransactionType && selectedTransactionType !== 'MERGE' && (
                        <Form.Item 
                          name="landParcelID" 
                          label={
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ color: '#1890ff' }}>🏠</span>
                              <span>Mã thửa đất</span>
                            </div>
                          } 
                          rules={[{ required: true, message: 'Bắt buộc' }]}
                        >
                          <Select 
                            placeholder="Chọn thửa đất" 
                            showSearch={false}
                            loading={landLoading}
                            notFoundContent={landLoading ? 'Đang tải...' : 'Không có thửa đất nào'}
                            optionLabelProp="value"
                            style={{ borderRadius: '8px' }}
                          >
                            {userLands.map((land) => (
                              <Option key={`land-${land.id}`} value={land.id}>
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
                      )}
                      
                      {selectedTransactionType === 'TRANSFER' && (
                        <Form.Item 
                          name="toOwnerID" 
                          label={
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ color: '#1890ff' }}>🔄</span>
                              <span>CCCD người nhận chuyển nhượng</span>
                            </div>
                          } 
                          rules={[{ required: true, message: 'Bắt buộc' }]}
                        >
                          <Input 
                            placeholder="Nhập số CCCD người nhận" 
                            style={{ borderRadius: '8px' }}
                          />
                        </Form.Item>
                      )}

                      {selectedTransactionType === 'CHANGE_PURPOSE' && (
                        <Form.Item name="newPurpose" label="Mục đích sử dụng mới" rules={[{ required: true, message: 'Bắt buộc' }]}>
                          <Select placeholder="Chọn mục đích sử dụng">
                            {Object.entries(LAND_USE_PURPOSES).map(([code, name]) => (
                              <Option key={`purpose-${code}`} value={code}>{code} - {name}</Option>
                            ))}
                          </Select>
                        </Form.Item>
                      )}

                      {selectedTransactionType === 'MERGE' && (
                        <div style={{ marginBottom: '24px' }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '4px',
                            marginBottom: '12px' 
                          }}>
                            <span style={{ color: '#722ed1' }}>🏗️</span>
                            <span style={{ fontWeight: '500' }}>Các thửa đất cần gộp</span>
                            <span style={{ color: '#ff4d4f' }}>*</span>
                          </div>
                          <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>
                            Chi tiết cách gộp sẽ được thể hiện trong bản đồ và tài liệu đính kèm.
                          </div>
                          
                          {mergeParcelIds.map((parcelId, index) => (
                            <div key={index} style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '12px',
                              marginBottom: '12px' 
                            }}>
                              <div style={{ minWidth: '80px', fontSize: '14px', color: '#666' }}>
                                Thửa {index + 1}:
                              </div>
                              <Select
                                placeholder="Chọn thửa đất"
                                style={{ flex: 1, borderRadius: '8px' }}
                                value={parcelId || undefined}
                                onChange={(value) => {
                                  const newParcelIds = [...mergeParcelIds];
                                  newParcelIds[index] = value || '';
                                  setMergeParcelIds(newParcelIds);
                                }}
                                loading={landLoading}
                                showSearch
                                optionFilterProp="children"
                                filterOption={(input, option) => {
                                  const optionText = option.children.props?.children?.[0]?.props?.children || option.children;
                                  return optionText?.toLowerCase().indexOf(input.toLowerCase()) >= 0;
                                }}
                                optionLabelProp="value"
                              >
                                {userLands
                                  .filter(land => !mergeParcelIds.includes(land.id) || land.id === parcelId)
                                  .map((land) => (
                                  <Option key={`merge-land-${land.id}`} value={land.id}>
                                    <div style={{ padding: '2px 0' }}>
                                      <div style={{ fontWeight: 'bold', color: '#1890ff', fontSize: '14px' }}>
                                        {land.id}
                                      </div>
                                      <div style={{ fontSize: '11px', color: '#666', lineHeight: '1.3' }}>
                                        Diện tích: {land.area}m²
                                      </div>
                                      <div style={{ fontSize: '11px', color: '#666', lineHeight: '1.3' }}>
                                        Mục đích: {LAND_USE_PURPOSES[land.landUsePurpose] || land.landUsePurpose || 'Chưa có'}
                                      </div>
                                    </div>
                                  </Option>
                                ))} 
                              </Select>
                              
                              {/* Button remove chỉ hiện khi có hơn 2 field */}
                              {mergeParcelIds.length > 2 && (
                                <Button 
                                  type="text" 
                                  danger
                                  icon={<span>❌</span>}
                                  size="small"
                                  onClick={() => {
                                    const newParcelIds = mergeParcelIds.filter((_, i) => i !== index);
                                    setMergeParcelIds(newParcelIds);
                                  }}
                                  style={{ minWidth: '32px' }}
                                />
                              )}
                            </div>
                          ))}
                          
                          {/* Button thêm thửa đất */}
                          <Button 
                            type="dashed" 
                            icon={<span>➕</span>}
                            onClick={() => {
                              setMergeParcelIds([...mergeParcelIds, '']);
                            }}
                            style={{ 
                              width: '100%',
                              marginTop: '8px',
                              borderRadius: '8px',
                              color: '#722ed1',
                              borderColor: '#722ed1'
                            }}
                            disabled={userLands.length <= mergeParcelIds.filter(id => id !== '').length}
                          >
                            Thêm thửa đất cần gộp
                          </Button>
                          
                          {userLands.length === 0 && !landLoading && (
                            <div style={{ 
                              marginTop: '12px', 
                              padding: '8px 12px',
                              background: '#fff2f0',
                              borderRadius: '6px',
                              border: '1px solid #ffccc7',
                              color: '#ff4d4f', 
                              fontSize: '12px' 
                            }}>
                              ⚠️ Bạn chưa có thửa đất nào. Vui lòng liên hệ cơ quan quản lý đất đai.
                            </div>
                          )}
                          
                          {/* Hiển thị tóm tắt */}
                          {mergeParcelIds.filter(id => id !== '').length >= 2 && (
                            <div style={{
                              marginTop: '12px',
                              padding: '12px',
                              background: '#f6ffed',
                              borderRadius: '6px',
                              border: '1px solid #b7eb8f'
                            }}>
                              <div style={{ color: '#52c41a', fontWeight: '500', marginBottom: '4px' }}>
                                ✅ Sẵn sàng gộp {mergeParcelIds.filter(id => id !== '').length} thửa đất
                              </div>
                              <div style={{ fontSize: '12px', color: '#666' }}>
                                Các thửa đất: {mergeParcelIds.filter(id => id !== '').join(', ')}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Lý do tạo yêu cầu */}
                      <Form.Item 
                        name="reason" 
                        label={
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ color: '#1890ff' }}>💬</span>
                            <span>Lý do tạo yêu cầu</span>
                          </div>
                        } 
                        rules={[{ required: true, message: 'Vui lòng nhập lý do tạo yêu cầu' }]}
                      >
                        <Input.TextArea 
                          placeholder="Nhập lý do tạo yêu cầu..." 
                          rows={3}
                          maxLength={500}
                          showCount
                          style={{ borderRadius: '8px' }}
                        />
                      </Form.Item>
                    </div>
                  )
                },
                {
                  key: 'documents',
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px' }}>📎</span>
                      <span style={{ fontSize: '16px', fontWeight: 600 }}>Tài liệu đính kèm</span>
                    </div>
                  ),
                  children: (
                    <div style={{ padding: '0 24px 16px 24px' }}>
                      {renderDocumentSection(selectedTransactionType)}
                    </div>
                  )
                }
              ]}
            />
          </Form>
        )}
      </div>
    );
  };

  return (
    <Card
      title="Quản lý giao dịch (Org3)"
      extra={
        <Space>
          <Input
            className="search-input"
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
        className="transaction-modal"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🏠</span>
            <span>{selectedTransactionType ? `Tạo yêu cầu: ${getTransactionTypeText(selectedTransactionType)}` : "Chọn loại giao dịch"}</span>
          </div>
        }
        open={createOpen} 
        onOk={selectedTransactionType && currentStep === 1 ? onCreate : null}
        onCancel={() => {
            setCreateOpen(false);
            form.resetFields();
            setSelectedDocuments({});
            setSelectedTransactionType(null);
            setMergeParcelIds(['', '']); // Reset merge fields
          }} 
          confirmLoading={loading}
        width={1400}
        okText={selectedTransactionType && currentStep === 1 ? "Tạo yêu cầu" : undefined}
        cancelText="Hủy"
        style={{ top: 20 }}
        styles={{
          body: {
            maxHeight: '80vh',
            overflowY: 'auto',
            padding: '24px'
          }
        }}
        footer={(() => {
          if (!selectedTransactionType || currentStep === 0) {
            return [
              <Button key="cancel" onClick={() => {
                setCreateOpen(false);
                form.resetFields();
                setSelectedDocuments({});
                setSelectedTransactionType(null);
                setMergeParcelIds(['', '']); // Reset merge fields  
                setCurrentStep(0);
              }}>Hủy</Button>
            ];
          }
          // Footer chỉ có 2 bước: chọn loại và nhập thông tin
          return [
            <Button key="back" onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}>Quay lại</Button>,
            <Button key="create" type="primary" loading={loading} onClick={onCreate}>Tạo yêu cầu</Button>
          ];
        })()}
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
                    // Hiển thị tài liệu - Org3 có thể xem tài liệu theo ID
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

            {/* Accept/Reject Transfer buttons for recipients */}
            {(() => {
              const currentUser = authService.getCurrentUser();
              const isRecipient = selected.type === 'TRANSFER' && 
                                selected.toOwnerId === currentUser?.userId && 
                                selected.status === 'PENDING';
              
              if (isRecipient) {
                return (
                  <div style={{ marginTop: 24 }}>
                    <Divider>Xác nhận chuyển nhượng</Divider>
                    <div style={{
                      background: '#f0f9ff',
                      border: '1px solid #d6e4ff',
                      borderRadius: '8px',
                      padding: '20px',
                      textAlign: 'center'
                    }}>
                      <div style={{ marginBottom: 16 }}>
                        <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                          🔔 Bạn là người nhận chuyển nhượng
                        </Text>
                      </div>
                      <div style={{ marginBottom: 20, color: '#666', lineHeight: 1.6 }}>
                        Giao dịch chuyển nhượng này cần sự xác nhận của bạn để có thể tiếp tục được xử lý.
                        Vui lòng xem xét kỹ các tài liệu đính kèm và quyết định chấp nhận hoặc từ chối.
                      </div>
                      <Space size="large">
                        <Button
                          type="primary"
                          size="large"
                          icon={<CheckCircleOutlined />}
                          loading={loading}
                          onClick={async () => {
                            try {
                              setLoading(true);
                              
                              await transactionService.confirmTransfer({
                                txID: selected.txId,
                                landParcelID: selected.landParcelId,
                                toOwnerID: selected.toOwnerId,
                                isAccepted: true,
                                reason: ''
                              });
                              
                              message.success('Chấp nhận giao dịch chuyển nhượng thành công!');
                              setDetailOpen(false);
                              loadMyTransactions();
                            } catch (e) {
                              message.error(e.message || 'Chấp nhận thất bại');
                            } finally {
                              setLoading(false);
                            }
                          }}
                          style={{ minWidth: '140px' }}
                        >
                          Nhận chuyển nhượng
                        </Button>
                        <Button
                          danger
                          size="large"
                          loading={loading}
                          onClick={async () => {
                            try {
                              setLoading(true);
                              
                              await transactionService.confirmTransfer({
                                txID: selected.txId,
                                landParcelID: selected.landParcelId,
                                toOwnerID: selected.toOwnerId,
                                isAccepted: false,
                                reason: 'Từ chối chuyển nhượng'
                              });
                              
                              message.success('Từ chối giao dịch chuyển nhượng thành công!');
                              setDetailOpen(false);
                              loadMyTransactions();
                            } catch (e) {
                              message.error(e.message || 'Từ chối thất bại');
                            } finally {
                              setLoading(false);
                            }
                          }}
                          style={{ minWidth: '140px' }}
                        >
                          Từ chối
                        </Button>
                      </Space>
                      <div style={{ marginTop: 16, fontSize: '12px', color: '#999' }}>
                        💡 Sau khi xác nhận, giao dịch sẽ được chuyển đến cơ quan có thẩm quyền để thẩm định và phê duyệt.
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
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
                placeholder={
                  (() => {
                    const availableDocs = userDocuments.filter(doc => {
                      const existingDocIds = selected?.documentIds || [];
                      return !existingDocIds.includes(doc.docID);
                    });
                    return availableDocs.length > 0 
                      ? "Chọn tài liệu từ danh sách của bạn"
                      : "Không có tài liệu nào có thể bổ sung";
                  })()
                }
                style={{ width: '100%' }}
                disabled={(() => {
                  const availableDocs = userDocuments.filter(doc => {
                    const existingDocIds = selected?.documentIds || [];
                    return !existingDocIds.includes(doc.docID);
                  });
                  return availableDocs.length === 0;
                })()}
                filterOption={(input, option) =>
                  option.children.props.children[0].props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {userDocuments
                  .filter(doc => {
                    // Lọc ra những tài liệu chưa được link với giao dịch này
                    const existingDocIds = selected?.documentIds || [];
                    return !existingDocIds.includes(doc.docID);
                  })
                  .map(doc => (
                  <Option key={`supplement-doc-${doc.docID}`} value={doc.docID}>
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
            
            {(() => {
              const availableDocs = userDocuments.filter(doc => {
                const existingDocIds = selected?.documentIds || [];
                return !existingDocIds.includes(doc.docID);
              });
              const existingCount = (selected?.documentIds || []).length;
              const totalCount = userDocuments.length;
              
              if (availableDocs.length === 0 && totalCount > 0) {
                return (
                  <div style={{ 
                    marginTop: -12, 
                    marginBottom: 12,
                    padding: 12, 
                    backgroundColor: '#fff2f0', 
                    borderRadius: 4,
                    border: '1px solid #ffccc7'
                  }}>
                    <div style={{ color: '#ff4d4f', fontSize: '14px', marginBottom: 4 }}>
                      ⚠️ <strong>Không có tài liệu mới để bổ sung</strong>
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Tất cả {totalCount} tài liệu của bạn đã được liên kết với giao dịch này rồi.
                      Bạn cần tạo tài liệu mới trước khi có thể bổ sung.
                    </div>
                  </div>
                );
              } else if (availableDocs.length > 0 && existingCount > 0) {
                return (
                  <div style={{ 
                    marginTop: -12, 
                    marginBottom: 12,
                    padding: 8, 
                    backgroundColor: '#f0f9ff', 
                    borderRadius: 4,
                    fontSize: '12px',
                    color: '#1890ff'
                  }}>
                    📊 Có {availableDocs.length} tài liệu có thể bổ sung (Tổng cộng: {totalCount}, Đã liên kết: {existingCount})
                  </div>
                );
              }
              return null;
            })()}

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
