import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Space, Tag, message, Drawer, Row, Col, Tooltip, Divider, Alert, Typography } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EyeOutlined, HistoryOutlined, FileTextOutlined, CheckCircleOutlined } from '@ant-design/icons';
import transactionService from '../../../services/transactionService';
import authService from '../../../services/auth';
import documentService from '../../../services/documentService';
import { REQUIRED_DOCUMENTS, LAND_USE_PURPOSES } from '../../../services/index';

const { Option } = Select;
const { Text } = Typography;

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
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [form] = Form.useForm();
  const [confirmForm] = Form.useForm();
  
  // States for document linking
  const [userDocuments, setUserDocuments] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  
  // States for land management
  const [userLands, setUserLands] = useState([]);
  const [landLoading, setLandLoading] = useState(false);
  
  // State for transaction type selection
  const [selectedTransactionType, setSelectedTransactionType] = useState(null);

  const loadUserDocuments = async () => {
    try {
      const user = authService.getCurrentUser();
      if (!user?.userId) return;
      
      const res = await documentService.getDocumentsByUploader(user.userId);
      const docs = res?.documents || [];
      
      // Chỉ lấy các tài liệu đã được xác thực
      const verifiedDocs = docs.filter(doc => doc.verified === true);
      setUserDocuments(verifiedDocs);
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

      const validation = transactionService.validateTransactionData(values, selectedTransactionType);
      if (!validation.isValid) {
        message.warning(validation.errors.join('\n'));
        return;
      }
      setLoading(true);
      
      // Chuẩn bị data chung với documentIds
      const baseData = {
        txID: values.txID,
        landParcelID: values.landParcelID,
        fromOwnerID: user.userId, // Tự động lấy từ user hiện tại
        documentIds: selectedDocuments  // Thêm danh sách tài liệu đã chọn
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
            txID: values.txID,
            landParcelID: values.landParcelID,
            ownerID: user.userId, // Tự động lấy từ user hiện tại
            newParcelsStr: values.newParcels,
            documentIds: selectedDocuments
          });
          break;
        case 'MERGE':
          await transactionService.createMergeRequest({
            txID: values.txID,
            ownerID: user.userId, // Tự động lấy từ user hiện tại
            parcelIDs: values.parcelIDs.split(',').map(id => id.trim()),
            newParcelStr: values.newParcel,
            documentIds: selectedDocuments
          });
          break;
        case 'CHANGE_PURPOSE':
          await transactionService.createChangePurposeRequest({
            txID: values.txID,
            landParcelID: values.landParcelID,
            ownerID: user.userId, // Tự động lấy từ user hiện tại
            newPurpose: values.newPurpose,
            documentIds: selectedDocuments
            });
          break;
        case 'REISSUE':
          await transactionService.createReissueRequest({
            txID: values.txID,
            landParcelID: values.landParcelID,
            ownerID: user.userId, // Tự động lấy từ user hiện tại
            documentIds: selectedDocuments
          });
          break;
        default:
          throw new Error('Loại giao dịch không được hỗ trợ');
      }
      
      message.success(`Tạo yêu cầu thành công${selectedDocuments.length > 0 ? ` với ${selectedDocuments.length} tài liệu đính kèm` : ''}`);
      setCreateOpen(false);
      form.resetFields();
      setSelectedDocuments([]);  // Reset danh sách tài liệu đã chọn
      setSelectedTransactionType(null);  // Reset loại giao dịch đã chọn
      loadMyTransactions();
    } catch (e) {
      message.error(e.message || 'Tạo yêu cầu thất bại');
    } finally {
      setLoading(false);
    }
  };

  const onConfirm = async () => {
    try {
      const values = await confirmForm.validateFields();
      setLoading(true);
      await transactionService.confirmTransfer({
        txID: values.txID,
        landParcelID: values.landParcelID,
        toOwnerID: values.toOwnerID
      });
      message.success('Xác nhận giao dịch thành công');
      setConfirmOpen(false);
      loadMyTransactions();
    } catch (e) {
      message.error(e.message || 'Xác nhận thất bại');
    } finally {
      setLoading(false);
    }
  };

  const onViewHistory = async (txID) => {
    try {
      const res = await transactionService.getTransactionHistory(txID);
      setHistory(Array.isArray(res) ? res : (res?.data ?? []));
      setDetailOpen(true);
    } catch (e) {
      message.error(e.message || 'Không tải được lịch sử');
    }
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
    return transaction.status === 'APPROVED' && transaction.type === 'TRANSFER';
  };

  const columns = useMemo(() => ([
    { title: 'Mã giao dịch', dataIndex: 'txID', key: 'txID' },
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
            <Button icon={<EyeOutlined />} onClick={() => {
              setSelected(record);
              setDetailOpen(true);
            }} />
          </Tooltip>
          <Tooltip title="Lịch sử">
            <Button icon={<HistoryOutlined />} onClick={() => onViewHistory(record.txID)} />
          </Tooltip>
          {canConfirm(record) && (
            <Tooltip title="Xác nhận">
              <Button 
                type="primary" 
                icon={<CheckCircleOutlined />} 
                onClick={() => {
                  setSelected(record);
                  confirmForm.setFieldsValue({ 
                    txID: record.txID,
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
        </Space>
      )
    }
  ]), [confirmForm]);

  const renderDocumentSection = (selectedType) => {
    if (!selectedType) return null;

    const requiredDocs = REQUIRED_DOCUMENTS[selectedType] || [];
    
    return (
      <div style={{ marginTop: 16 }}>
        <Divider orientation="left">
          <FileTextOutlined /> Tài liệu cần chuẩn bị & Đính kèm
        </Divider>
        
        <Alert
          message="Danh sách tài liệu cần chuẩn bị cho thủ tục"
          description="Dưới đây là danh sách các tài liệu cần thiết theo quy định. Bạn có thể đính kèm các tài liệu đã được xác thực vào yêu cầu."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <div style={{ background: '#f9f9f9', padding: '16px', borderRadius: '6px', marginBottom: 16 }}>
          {requiredDocs.map((docType, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 8,
              padding: '8px 0'
            }}>
              <Text style={{ flex: 1 }}>
                <span style={{ fontWeight: 500, color: '#1890ff' }}>
                  {index + 1}.
                </span>{' '}
                {docType}
              </Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Select
                  placeholder="Chọn tài liệu..."
                  style={{ width: 200 }}
                  allowClear
                  onChange={(docID) => {
                    if (docID && !selectedDocuments.includes(docID)) {
                      setSelectedDocuments([...selectedDocuments, docID]);
                      message.success('Đã đính kèm tài liệu');
                    }
                  }}
                >
                  {userDocuments
                    .filter(doc => !selectedDocuments.includes(doc.docID))
                    .map((doc) => (
                      <Option key={doc.docID} value={doc.docID}>
                        <Tag color="blue" size="small">{doc.type}</Tag>
                        {doc.title}
                      </Option>
                    ))
                  }
                </Select>
                {selectedDocuments.some(docID => 
                  userDocuments.find(doc => doc.docID === docID)?.type === docType
                ) && (
                  <Tag color="green" icon={<CheckCircleOutlined />}>
                    Đã đính kèm
                  </Tag>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Hiển thị tài liệu đã đính kèm */}
        {selectedDocuments.length > 0 && (
          <div style={{ marginTop: 16, padding: 16, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8 }}>
            <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>
              📋 Tài liệu đã đính kèm ({selectedDocuments.length}):
            </Text>
            <div style={{ marginTop: 12 }}>
              {requiredDocs.map((docType, index) => {
                const attachedDocs = selectedDocuments.filter(docId => {
                  const doc = userDocuments.find(d => d.docID === docId);
                  return doc && doc.type === docType;
                });
                
                if (attachedDocs.length === 0) return null;
                
                return (
                  <div key={index} style={{ marginBottom: 12 }}>
                    <Text strong style={{ color: '#52c41a' }}>
                      {index + 1}. {docType}:
                    </Text>
                    <div style={{ marginTop: 6, marginLeft: 16 }}>
                      {attachedDocs.map((docId) => {
                        const doc = userDocuments.find(d => d.docID === docId);
                        return doc ? (
                          <Tag key={docId} color="green" style={{ marginBottom: 4 }}>
                            {doc.title}
                          </Tag>
                        ) : null;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
              form.resetFields();
            }}
          >
            Chọn lại
          </Button>
        </div>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="txID" label="Mã giao dịch" rules={[{ required: true, message: 'Bắt buộc' }]}>
              <Input placeholder="Nhập mã giao dịch duy nhất" />
            </Form.Item>
          </Col>
          <Col span={12}>
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
          </Col>
        </Row>

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
              rows={4}
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
                rows={3}
              />
            </Form.Item>
          </>
        )}



        {/* Document section */}
        {renderDocumentSection(selectedTransactionType)}
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
          setSelectedDocuments([]);
          setSelectedTransactionType(null);
        }} 
        confirmLoading={loading} 
        width={900}
        okText={selectedTransactionType ? "Tạo yêu cầu" : undefined}
        cancelText="Hủy"
        footer={selectedTransactionType ? undefined : [
          <Button key="cancel" onClick={() => {
            setCreateOpen(false);
            form.resetFields();
            setSelectedDocuments([]);
            setSelectedTransactionType(null);
          }}>
            Hủy
          </Button>
        ]}
      >
        {renderCreateForm()}
      </Modal>

      {/* Confirm Transaction */}
      <Modal title="Xác nhận giao dịch" open={confirmOpen} onOk={onConfirm} onCancel={() => setConfirmOpen(false)} confirmLoading={loading} width={640}>
        <Form layout="vertical" form={confirmForm}>
          <Form.Item name="txID" label="Mã giao dịch">
            <Input disabled />
          </Form.Item>
          <Form.Item name="landParcelID" label="Mã thửa đất">
            <Input disabled />
          </Form.Item>
          <Form.Item name="toOwnerID" label="CCCD người nhận">
            <Input disabled />
          </Form.Item>
          <div style={{ marginTop: 16, color: '#666', fontSize: '14px' }}>
            Bạn có chắc chắn muốn xác nhận giao dịch chuyển nhượng này? Hành động này sẽ hoàn tất quá trình chuyển nhượng thửa đất.
          </div>
        </Form>
      </Modal>

      {/* Detail + History */}
      <Drawer title="Chi tiết giao dịch" width={800} open={detailOpen} onClose={() => setDetailOpen(false)}>
        {selected && (
          <div>
            <Row gutter={16}>
              <Col span={12}><strong>Mã giao dịch:</strong> {selected.txID}</Col>
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
            
            {selected.notes && (
              <div style={{ marginTop: 12 }}>
                <strong>Ghi chú:</strong> {selected.notes}
              </div>
            )}

            {history.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <Divider>Lịch sử giao dịch</Divider>
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {history.map((item, index) => (
                    <div key={index} style={{ 
                      padding: 12, 
                      marginBottom: 8, 
                      background: '#f5f5f5', 
                      borderRadius: 4,
                      borderLeft: '4px solid #52c41a'
                    }}>
                      <div><strong>Trạng thái:</strong> {getStatusTag(item.status)}</div>
                      <div><strong>Thời gian:</strong> {item.timestamp ? new Date(item.timestamp).toLocaleString('vi-VN') : 'N/A'}</div>
                      {item.notes && <div><strong>Ghi chú:</strong> {item.notes}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </Card>
  );
};

export default TransactionManagementPage;
