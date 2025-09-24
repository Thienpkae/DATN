import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Space, Tag, message, Drawer, Row, Col, Tooltip } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined, FileTextOutlined, HistoryOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import transactionService from '../../../services/transactionService';
import documentService from '../../../services/documentService';
import landService from '../../../services/landService';
import { DocumentDetailModal } from '../../Common';
import { TRANSACTION_STATUS_NAMES, LAND_USE_PURPOSES } from '../../../services/index';

const { Option } = Select;
const { TextArea } = Input;

const TransactionManagementPage = () => {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [pageSize, setPageSize] = useState(10);
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
  
  // Certificate documents for REISSUE approval
  const [certificateDocuments, setCertificateDocuments] = useState([]);
  const [certificateLoading, setCertificateLoading] = useState(false);
  
  // Land parcels for MERGE approval
  const [mergeLandParcels, setMergeLandParcels] = useState([]);
  const [mergeParcelAreas, setMergeParcelAreas] = useState({});
  const [mergeLandLoading, setMergeLandLoading] = useState(false);
  
  // Split parcels state for SPLIT approval
  const [splitParcels, setSplitParcels] = useState([]);
  const [originalLandArea, setOriginalLandArea] = useState(0);

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

  const onReload = () => {
    setFilters(defaultFilters);
    loadList();
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
      console.log('🚀 Starting approval process...');
      
      // Trigger manual validation for split transaction
      if (selected.type === 'SPLIT') {
        console.log('🔍 Manual validation for SPLIT transaction');
        console.log('Split parcels before sync:', splitParcels);
        
        if (!splitParcels || splitParcels.length === 0) {
          message.error('Phải có ít nhất một thừa đất');
          return;
        }
        
        // Đồng bộ diện tích tự động tính cho thừa cuối vào state
        if (splitParcels.length > 1) {
          const updatedParcels = [...splitParcels];
          const lastIndex = updatedParcels.length - 1;
          const totalOthers = updatedParcels.slice(0, -1).reduce((sum, p) => sum + (parseFloat(p.area) || 0), 0);
          const remainingArea = Math.round((originalLandArea - totalOthers) * 100) / 100;
          
          // Cập nhật diện tích thừa cuối
          updatedParcels[lastIndex].area = remainingArea;
          setSplitParcels(updatedParcels);
          
          console.log('🔄 Synced remaining area for last parcel:', remainingArea);
          console.log('Split parcels after sync:', updatedParcels);
          
          // Sử dụng updated parcels cho validation
          // splitParcels đã được cập nhật qua setSplitParcels(updatedParcels)
        }
        
        // Validate each parcel
        for (let i = 0; i < splitParcels.length; i++) {
          const p = splitParcels[i];
          const displayIndex = p.isOriginal ? 'gốc' : `mới ${i}`;
          
          if (!p.id || p.id.trim() === '') {
            message.error(`Thửa đất ${displayIndex}: Thiếu mã thửa đất`);
            return;
          }
          
          const area = parseFloat(p.area) || 0;
          if (area <= 0) {
            message.error(`Thửa đất ${displayIndex}: Diện tích phải lớn hơn 0`);
            return;
          }
        }
        
        // Validate total area
        const totalArea = splitParcels.reduce((sum, p) => sum + (parseFloat(p.area) || 0), 0);
        if (originalLandArea > 0 && totalArea > originalLandArea + 0.1) {
          message.error(`Tổng diện tích (${totalArea.toFixed(2)} m²) vượt quá diện tích thửa đất gốc (${originalLandArea.toFixed(2)} m²)`);
          return;
        }
        
        console.log('✅ Manual validation passed');
      }
      
      const values = await approveForm.validateFields();
      setLoading(true);
      
      switch (selected.type) {
        case 'TRANSFER':
          await transactionService.approveTransferTransaction(selected.txId || selected.txID);
          break;
        case 'SPLIT':
          // Theo luồng mới: cần landID và newParcels
          // Chuyển đổi splitParcels thành format phù hợp - chỉ lấy các thửa không phải gốc
          const newParcelsForSubmit = splitParcels
            .filter(p => !p.isOriginal) // Loại bỏ thửa gốc
            .map(p => ({
              id: p.id,
              area: parseFloat(p.area) || 0 // Đảm bảo area là số
            }));
          
          // Thửa gốc (thửa đầu tiên) sẽ được cập nhật với diện tích mới
          const originalParcel = splitParcels.find(p => p.isOriginal);
          if (originalParcel) {
            // Thêm thửa gốc vào danh sách với diện tích đã cập nhật
            newParcelsForSubmit.unshift({
              id: originalParcel.id,
              area: parseFloat(originalParcel.area) || 0
            });
          }
          
          console.log('🔄 Submitting split transaction:', {
            txId: selected.txId || selected.txID,
            landID: values.landID || selected?.landParcelId,
            newParcels: newParcelsForSubmit
          });
          
          await transactionService.approveSplitTransaction(
            selected.txId || selected.txID,
            values.landID || selected?.landParcelId,
            newParcelsForSubmit
          );
          break;
        case 'MERGE':
          // Thêm ID của thửa đất chính và area tổng
          const newParcel = {
            id: values.selectedLandID, // ID của thửa đất chính
            area: Object.values(mergeParcelAreas).reduce((sum, area) => sum + (Number(area) || 0), 0)
          };
          
          await transactionService.approveMergeTransaction(
            selected.txId || selected.txID,
            selected.parcelIds, // Sử dụng trực tiếp từ giao dịch
            values.selectedLandID,
            newParcel // Gửi trực tiếp object với ID và area
          );
          break;
        case 'CHANGE_PURPOSE':
          await transactionService.approveChangePurposeTransaction(selected.txId || selected.txID);
          break;
        case 'REISSUE':
          await transactionService.approveReissueTransaction(selected.txId || selected.txID, values.newCertificateID);
          break;
        default:
          throw new Error('Loại giao dịch không được hỗ trợ');
      }
      
      message.success('Phê duyệt giao dịch thành công');
      setApproveOpen(false);
      approveForm.resetFields();
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
      await transactionService.rejectTransaction(selected.txId || selected.txID, values.reason);
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
  
  // Load certificate documents for REISSUE approval
  const loadCertificateDocuments = async () => {
    try {
      setCertificateLoading(true);
      // Load all documents with type CERTIFICATE
      const res = await documentService.getDocumentsByType('CERTIFICATE');
      const docs = Array.isArray(res) ? res : (res?.data || res?.documents || []);
      
      // Only get verified certificates
      const verifiedCerts = docs.filter(doc => doc.status === 'VERIFIED');
      setCertificateDocuments(verifiedCerts);
      
      console.log('📜 Loaded certificate documents:', verifiedCerts.length);
    } catch (e) {
      console.error('Lỗi khi tải danh sách GCN:', e);
      message.error('Không thể tải danh sách giấy chứng nhận');
      setCertificateDocuments([]);
    } finally {
      setCertificateLoading(false);
    }
  };
  
  // Load land parcels for MERGE approval
  const loadMergeLandParcels = async (parcelIds) => {
    try {
      setMergeLandLoading(true);
      const landPromises = parcelIds.map(async (parcelId) => {
        try {
          const landData = await landService.getLandParcel(parcelId);
          return landData;
        } catch (e) {
          console.warn(`Không thể load thửa đất ${parcelId}:`, e);
          return { id: parcelId, error: true, area: 0, location: 'Không xác định' };
        }
      });
      
      const lands = await Promise.all(landPromises);
      setMergeLandParcels(lands);
      
      // Initialize areas object
      const areas = {};
      lands.forEach(land => {
        areas[land.id] = land.area || 0;
      });
      setMergeParcelAreas(areas);
      
      console.log('🏠 Loaded merge land parcels:', lands.length);
    } catch (e) {
      console.error('Lỗi khi tải danh sách thửa đất gộp:', e);
      message.error('Không thể tải thông tin thửa đất');
      setMergeLandParcels([]);
      setMergeParcelAreas({});
    } finally {
      setMergeLandLoading(false);
    }
  };
  
  // Open approve modal with special handling for REISSUE and MERGE
  const openApproveModal = useCallback(async (record) => {
    setSelected(record);
    
    // Reset split parcels when opening modal
    if (record.type === 'SPLIT') {
      // Load original land info to get area
      if (record.landParcelId) {
        try {
          const landData = await landService.getLandParcel(record.landParcelId);
          setOriginalLandArea(landData.area || 0);
          console.log('📏 Loaded original land area:', landData.area);
          
          // Khởi tạo với thửa đất gốc là thửa đầu tiên (có thể được cập nhật)
          setSplitParcels([{
            id: record.landParcelId, // ID của thửa gốc
            area: 0, // Sẽ được nhập bởi người dùng
            isOriginal: true // Đánh dấu đây là thửa gốc
          }]);
        } catch (e) {
          console.error('Lỗi khi tải thông tin thửa đất gốc:', e);
          message.warning('Không thể tải thông tin thửa đất gốc');
          setOriginalLandArea(0);
          setSplitParcels([]);
        }
      } else {
        setSplitParcels([]);
      }
    }
    
    // If REISSUE type, load certificate documents
    if (record.type === 'REISSUE') {
      await loadCertificateDocuments();
    }
    
    // If MERGE type, load land parcels from parcelIds
    if (record.type === 'MERGE' && record.parcelIds && record.parcelIds.length > 0) {
      await loadMergeLandParcels(record.parcelIds);
    }
    
    setApproveOpen(true);
  }, []);

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
      'APPROVED': 'green',
      'REJECTED': 'red',
      'CONFIRMED': 'purple',
      'SUPPLEMENT_REQUESTED': 'gold'
    };
    return <Tag color={statusColors[status] || 'default'}>{transactionService.getTransactionStatusText(status)}</Tag>;
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'PENDING': 'orange',
      'CONFIRMED': 'purple',
      'VERIFIED': 'blue',
      'SUPPLEMENT_REQUESTED': 'gold',
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
    if (doc.status === 'VERIFIED') return 'Đã thẩm định';
    if (doc.status === 'REJECTED') return 'Không hợp lệ';
    return 'Chờ xác thực';
  };

  const columns = useMemo(() => ([
    { title: 'Mã giao dịch', dataIndex: 'txId', key: 'txId', render: v => <code>{v}</code> },
    { title: 'Loại giao dịch', dataIndex: 'type', key: 'type', render: v => <Tag color="blue">{getTransactionTypeLabel(v)}</Tag> },
    { title: 'Thửa đất chính', dataIndex: 'landParcelId', key: 'landParcelId' },
    { title: 'Người thực hiện', dataIndex: 'userId', key: 'userId' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: v => <Tag color={getStatusColor(v)}>{TRANSACTION_STATUS_NAMES[v] || v}</Tag> },
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
                onClick={() => openApproveModal(record)}
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
  ]), [openApproveModal]);

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
              <Option value="VERIFIED">Đã thẩm định</Option>
              <Option value="SUPPLEMENT_REQUESTED">Yêu cầu bổ sung</Option>
              <Option value="APPROVED">Đã phê duyệt</Option>
              <Option value="REJECTED">Bị từ chối</Option>
            </Select>
            <Button icon={<SearchOutlined />} onClick={onSearch}>Tìm kiếm</Button>
            <Button icon={<ReloadOutlined />} onClick={onReload}>Tải lại</Button>
          </Space>
        }
      >
        <Table
          rowKey={(r) => r.txID}
          loading={loading}
          dataSource={transactions}
          columns={columns}
          scroll={{ x: 1200 }}
        pagination={{ 
          pageSize: pageSize, 
          showSizeChanger: true,
          showQuickJumper: false,
          showTotal: false,
          onChange: (page, newPageSize) => {
            console.log('Transaction page changed:', page, newPageSize);
          },
          onShowSizeChange: (current, size) => {
            console.log('Transaction page size changed:', current, size);
            setPageSize(size);
          }
        }}
        />

        {/* Approve Transaction Modal */}
        <Modal 
          title={`Phê duyệt giao dịch ${getTransactionTypeLabel(selected?.type)}`} 
          open={approveOpen} 
          onOk={onApprove} 
          onCancel={() => {
            setApproveOpen(false);
            approveForm.resetFields();
            setSplitParcels([]);
          }}
          confirmLoading={loading} 
          width={1000}
          okText="Phê duyệt"
          cancelText="Hủy"
        >
          <Form layout="vertical" form={approveForm}>
            {/* Form cho tách thửa */}
            {selected?.type === 'SPLIT' && (
              <>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item 
                      name="landID" 
                      label="Mã thửa đất gốc" 
                      initialValue={selected?.landParcelId}
                    >
                      <Input disabled style={{ backgroundColor: '#f5f5f5' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item 
                      label="Diện tích thửa đất gốc" 
                    >
                      <Input 
                        value={originalLandArea ? `${originalLandArea} m²` : 'Đang tải...'} 
                        disabled 
                        style={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }} 
                      />
                    </Form.Item>
                  </Col>
                </Row>
                
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: '12px' 
                  }}>
                    <label style={{ fontWeight: '600' }}>
                      Thông tin các thửa đất mới sau tách:
                    </label>
                    <Button 
                      type="dashed" 
                      icon={<PlusOutlined />}
                      onClick={() => {
                        const currentParcels = splitParcels || [];
                        const newIndex = currentParcels.length + 1;
                        setSplitParcels([...currentParcels, {
                          id: `${selected?.landParcelId}-${newIndex}`,
                          area: 0
                        }]);
                      }}
                      style={{ marginLeft: '8px' }}
                    >
                      Thêm thửa đất mới
                    </Button>
                  </div>
                  
                  {(!splitParcels || splitParcels.length === 0) ? (
                    <div style={{ 
                      padding: '24px',
                      textAlign: 'center',
                      background: '#fafafa',
                      borderRadius: '6px',
                      border: '1px dashed #d9d9d9'
                    }}>
                      <div style={{ marginBottom: '8px', color: '#8c8c8c' }}>
                        Chưa có thửa đất mới
                      </div>
                      <Button 
                        type="primary" 
                        icon={<PlusOutlined />}
                        onClick={() => {
                        setSplitParcels([{
                          id: `${selected?.landParcelId}-1`,
                          area: 0
                        }]);
                        }}
                      >
                        Thêm thửa đất đầu tiên
                      </Button>
                    </div>
                  ) : (
                    <>
                      {splitParcels.map((parcel, index) => {
                        const isLast = index === splitParcels.length - 1;
                        // Tính toán và làm tròn diện tích còn lại đến 2 chữ số thập phân
                        const remainingArea = Math.round((originalLandArea - splitParcels.slice(0, -1).reduce((sum, p) => sum + (p.area || 0), 0)) * 100) / 100;
                        
                        return (
                          <div key={`parcel-${index}-${parcel.id}`} style={{
                            marginBottom: '16px', 
                            padding: '16px', 
                            border: parcel.isOriginal ? '2px solid #1890ff' : '1px solid #d9d9d9', 
                            borderRadius: '6px',
                            backgroundColor: parcel.isOriginal ? '#e6f7ff' : '#fafafa',
                            position: 'relative'
                          }}>
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '12px'
                            }}>
                              <h4 style={{ margin: 0, color: parcel.isOriginal ? '#096dd9' : '#1890ff' }}>
                                {parcel.isOriginal ? '🏠 Thửa đất gốc (sẽ được cập nhật)' : `Thửa đất mới ${index + 1}`}
                              </h4>
                              {!parcel.isOriginal && splitParcels.length > 2 && (
                                <Button 
                                  type="text" 
                                  danger
                                  icon={<DeleteOutlined />}
                                  size="small"
                                  onClick={() => {
                                    const newParcels = splitParcels.filter((_, i) => i !== index);
                                    // Tự động tính lại diện tích cho thửa cuối nếu cần  
                                    if (newParcels.length > 0) {
                                      const lastIndex = newParcels.length - 1;
                                      const totalOthers = newParcels.slice(0, -1).reduce((sum, p) => sum + (p.area || 0), 0);
                                      // Làm tròn đến 2 chữ số thập phân
                                      newParcels[lastIndex].area = Math.round(Math.max(0, originalLandArea - totalOthers) * 100) / 100;
                                    }
                                    setSplitParcels(newParcels);
                                  }}
                                >
                                  Xóa
                                </Button>
                              )}
                            </div>
                            
                            <Row gutter={16}>
                              <Col span={12}>
                                <div style={{ marginBottom: '8px' }}>
                                  <label style={{ fontWeight: '500' }}>Mã thửa đất:</label>
                                </div>
                                <Input
                                  value={parcel.id}
                                  onChange={(e) => {
                                    const newParcels = [...splitParcels];
                                    newParcels[index].id = e.target.value;
                                    setSplitParcels(newParcels);
                                  }}
                                  placeholder={parcel.isOriginal ? "Mã thửa gốc" : "VD: L001-1"}
                                  disabled={parcel.isOriginal}
                                  style={parcel.isOriginal ? { backgroundColor: '#f5f5f5' } : {}}
                                />
                              </Col>
                              <Col span={12}>
                                <div style={{ marginBottom: '8px' }}>
                                  <label style={{ fontWeight: '500' }}>
                                    Diện tích (m²): 
                                    {isLast && splitParcels.length > 1 && (
                                      <span style={{ color: '#52c41a', fontSize: '12px', marginLeft: '8px' }}>
                                        (Tự động tính: {remainingArea.toFixed(2)} m²)
                                      </span>
                                    )}
                                  </label>
                                </div>
                                <Input
                                  type="number"
                                  value={isLast && splitParcels.length > 1 ? remainingArea.toFixed(2) : parcel.area}
                                  onChange={(e) => {
                                    const newParcels = [...splitParcels];
                                    newParcels[index].area = Number(e.target.value) || 0;
                                    setSplitParcels(newParcels);
                                  }}
                                  min={0}
                                  step={0.01}
                                  placeholder="Nhập diện tích"
                                  disabled={isLast && splitParcels.length > 1}
                                  style={(isLast && splitParcels.length > 1) ? { backgroundColor: '#f0f9ff', fontWeight: 'bold' } : {}}
                                />
                              </Col>
                            </Row>
                          </div>
                        );
                      })}
                      
                      {/* Tổng diện tích */}
                      <div style={{ 
                        padding: '12px', 
                        backgroundColor: '#f0f9ff', 
                        border: '1px solid #d6e4ff',
                        borderRadius: '6px',
                        marginTop: '16px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Số thửa đất mới: <strong>{splitParcels.length}</strong></span>
                          <span>
                            Tổng diện tích: <strong 
                              style={{ 
                                color: splitParcels.reduce((sum, p) => sum + (p.area || 0), 0) > originalLandArea ? '#ff4d4f' : '#52c41a' 
                              }}
                            >
                              {(Math.round(splitParcels.reduce((sum, p) => sum + (p.area || 0), 0) * 100) / 100).toFixed(2)} m²
                            </strong>
                            {originalLandArea > 0 && (
                              <span style={{ marginLeft: '8px', fontSize: '12px', color: '#666' }}>
                                / {originalLandArea.toFixed(2)} m²
                              </span>
                            )}
                          </span>
                        </div>
                        {splitParcels.reduce((sum, p) => sum + (p.area || 0), 0) > originalLandArea && originalLandArea > 0 && (
                          <div style={{ marginTop: '8px', color: '#ff4d4f', fontSize: '12px' }}>
                            ⚠️ Cảnh báo: Tổng diện tích vượt quá diện tích thửa đất gốc!
                          </div>
                        )}
                      </div>
                      
                      <Form.Item 
                        name="newParcels" 
                        rules={[{ 
                          validator: async () => {
                            console.log('🔍 Validating splitParcels:', splitParcels);
                            
                            if (!splitParcels || splitParcels.length === 0) {
                              throw new Error('Phải có ít nhất một thửa đất');
                            }
                            
                            // Tính tổng diện tích với xử lý số thập phân
                            const totalArea = splitParcels.reduce((sum, p) => {
                              const area = parseFloat(p.area) || 0;
                              return sum + area;
                            }, 0);
                            
                            console.log('📊 Total area:', totalArea, 'Original area:', originalLandArea);
                            
                            // Validate tổng diện tích không vượt quá diện tích gốc (cho phép sai số 0.1)
                            if (originalLandArea > 0 && totalArea > originalLandArea + 0.1) {
                              throw new Error(`Tổng diện tích (${totalArea.toFixed(2)} m²) vượt quá diện tích thửa đất gốc (${originalLandArea.toFixed(2)} m²)`);
                            }
                            
                            // Validate từng thửa đất
                            for (let i = 0; i < splitParcels.length; i++) {
                              const p = splitParcels[i];
                              const displayIndex = p.isOriginal ? 'gốc' : `mới ${i}`;
                              
                              if (!p.id || p.id.trim() === '') {
                                throw new Error(`Thửa đất ${displayIndex}: Thiếu mã thửa đất`);
                              }
                              
                              const area = parseFloat(p.area) || 0;
                              if (area <= 0) {
                                throw new Error(`Thửa đất ${displayIndex}: Diện tích phải lớn hơn 0`);
                              }
                            }
                            
                            console.log('✅ Validation passed');
                            return Promise.resolve();
                          }
                        }]}
                        style={{ display: 'none' }}
                      >
                        <Input />
                      </Form.Item>
                    </>
                  )}
                </div>
              </>
            )}

            {/* Form cho gộp thửa */}
            {selected?.type === 'MERGE' && (
              <>
                {mergeLandLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    Đang tải thông tin thửa đất...
                  </div>
                ) : mergeLandParcels.length > 0 ? (
                  <>
                    {/* Chọn thửa đất chính */}
                    <Form.Item 
                      name="selectedLandID" 
                      label="Chọn thừa đất chính (sẽ được giữ lại sau gộp)" 
                      rules={[{ required: true, message: 'Phải chọn thừa đất chính' }]}
                    >
                      <Select placeholder="Chọn thừa đất chính">
                        {mergeLandParcels.map((land) => (
                          <Option key={land.id} value={land.id}>
                            <strong>{land.id}</strong>
                            {land.error && (
                              <span style={{ color: '#ff4d4f', marginLeft: 8 }}>(Lỗi load dữ liệu)</span>
                            )}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    
                    {/* Danh sách thửa đất và diện tích */}
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                        Thông tin các thửa đất cần gộp:
                      </label>
                      {mergeLandParcels.map((land, index) => (
                        <div key={land.id} style={{ 
                          marginBottom: '12px', 
                          padding: '12px', 
                          border: '1px solid #d9d9d9', 
                          borderRadius: '6px',
                          backgroundColor: '#fafafa'
                        }}>
                          <Row gutter={16} align="middle">
                            <Col span={8}>
                              <div style={{ fontWeight: '500' }}>{land.id}</div>
                              {!land.error && (
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                  {LAND_USE_PURPOSES[land.landUsePurpose] || land.landUsePurpose}
                                </div>
                              )}
                            </Col>
                            <Col span={16}>
                              <Row gutter={8} align="middle">
                                <Col span={12}>
                                  <div style={{ fontSize: '12px', marginBottom: '4px' }}>Diện tích (m²):</div>
                                  <Input
                                    type="number"
                                    value={mergeParcelAreas[land.id] || 0}
                                    onChange={(e) => {
                                      setMergeParcelAreas(prev => ({
                                        ...prev,
                                        [land.id]: Number(e.target.value) || 0
                                      }));
                                    }}
                                    min={0}
                                    placeholder="Diện tích"
                                  />
                                </Col>
                                <Col span={12}>
                                  <div style={{ fontSize: '12px', color: '#666' }}>
                                    Vị trí: {land.location || 'Không xác định'}
                                  </div>
                                  {land.error && (
                                    <div style={{ fontSize: '12px', color: '#ff4d4f' }}>
                                      ⚠️ Không thể tải thông tin chi tiết
                                    </div>
                                  )}
                                </Col>
                              </Row>
                            </Col>
                          </Row>
                        </div>
                      ))}
                      
                      {/* Tổng diện tích */}
                      <div style={{ 
                        padding: '8px 12px', 
                        backgroundColor: '#f0f9ff', 
                        border: '1px solid #d6e4ff',
                        borderRadius: '6px',
                        textAlign: 'right'
                      }}>
                        <strong>Tổng diện tích: {Object.values(mergeParcelAreas).reduce((sum, area) => sum + (Number(area) || 0), 0)} m²</strong>
                      </div>
                    </div>
                    
                    {/* Watch selected land for summary */}
                    <Form.Item dependencies={['selectedLandID']}>
                      {({ getFieldValue }) => {
                        const selectedLandID = getFieldValue('selectedLandID');
                        return selectedLandID ? (
                          <div style={{ 
                            marginTop: '16px',
                            padding: '12px', 
                            backgroundColor: '#f0f9ff', 
                            border: '1px solid #d6e4ff',
                            borderRadius: '6px'
                          }}>
                            <div style={{ fontWeight: '500', marginBottom: '8px' }}>📋 Tóm tắt giao dịch gộp thừa:</div>
                            <div style={{ fontSize: '14px' }}>
                              <div>🏠 Gộp {mergeLandParcels.length} thừa đất: {mergeLandParcels.map(land => land.id).join(', ')}</div>
                              <div>✅ Cập nhật thừa đất: {selectedLandID}</div>
                              <div>📏 Tổng diện tích: {Object.values(mergeParcelAreas).reduce((sum, area) => sum + (Number(area) || 0), 0)} m²</div>
                            </div>
                          </div>
                        ) : null;
                      }}
                    </Form.Item>
                  </>
                ) : (
                  <div style={{ 
                    padding: '20px', 
                    textAlign: 'center', 
                    border: '1px dashed #d9d9d9',
                    borderRadius: '6px',
                    color: '#999'
                  }}>
                    Không tìm thấy thông tin thửa đất cần gộp
                  </div>
                )}
              </>
            )}

            {/* Form cho cấp lại GCN */}
            {selected?.type === 'REISSUE' && (
              <Form.Item 
                name="newCertificateID" 
                label="Chọn giấy chứng nhận để cấp lại" 
                rules={[{ required: true, message: 'Vui lòng chọn giấy chứng nhận' }]}
              >
                <Select
                  placeholder="Chọn giấy chứng nhận"
                  loading={certificateLoading}
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    (option?.title ?? '').toLowerCase().includes(input.toLowerCase()) ||
                    (option?.ipfsHash ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  notFoundContent={certificateLoading ? 'Loading...' : 'Không tìm thấy giấy chứng nhận nào'}
                >
                  {certificateDocuments.map((doc) => (
                    <Option key={doc.docID} value={doc.ipfsHash} title={doc.title || doc.docID}>
                      {doc.title || doc.docID}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            )}
            
            {selected?.type === 'REISSUE' && certificateDocuments.length === 0 && !certificateLoading && (
              <div style={{ 
                padding: '16px', 
                background: '#fff7e6', 
                border: '1px solid #ffd591',
                borderRadius: '6px',
                marginBottom: '16px'
              }}>
                <div style={{ color: '#fa8c16', fontWeight: '500', marginBottom: '4px' }}>
                  Chú ý: Không tìm thấy giấy chứng nhận nào
                </div>
                <div style={{ color: '#8c8c8c', fontSize: '14px' }}>
                  Hiện tại không có giấy chứng nhận nào đã xác thực trong hệ thống. Vui lòng đảm bảo có GCN đã được upload và xác thực trước khi phê duyệt giao dịch cấp lại.
                </div>
              </div>
            )}
            
            <div style={{ marginTop: 16 }}>
              <strong>Thông tin giao dịch:</strong>
              <div style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                <div><strong>Mã:</strong> {selected?.txId || selected?.txID}</div>
                <div><strong>Loại:</strong> {getTransactionTypeLabel(selected?.type)}</div>
                {selected?.type === 'MERGE' ? (
                  <div><strong>Thửa đất gộp:</strong> {selected?.parcelIds?.join(', ') || 'N/A'}</div>
                ) : (
                  <div><strong>Thửa đất:</strong> {selected?.landParcelId}</div>
                )}
                <div><strong>Người yêu cầu:</strong> {selected?.fromOwnerId}</div>
              </div>
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
              <div>Mã: {selected?.txId || selected?.txID}</div>
              <div>Loại: {selected?.type}</div>
              <div>Thừa đất: {selected?.landParcelId}</div>
            </div>
          </Form>
        </Modal>

        {/* Transaction Detail Drawer */}
        <Drawer title="Chi tiết giao dịch" width={800} open={detailOpen} onClose={() => setDetailOpen(false)}>
          {selected && (
            <div>
              <Row gutter={16}>
                <Col span={12}><strong>Mã giao dịch:</strong> {selected.txId || selected.txID}</Col>
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
                  <Col span={12}><strong>Mã giao dịch:</strong> {selected.txId || selected.txID}</Col>
                  <Col span={12}><strong>Loại:</strong> <Tag color="blue">{getTransactionTypeLabel(selected.type)}</Tag></Col>
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
