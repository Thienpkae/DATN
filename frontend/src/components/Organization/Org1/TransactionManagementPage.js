import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Space, Tag, message, Drawer, Row, Col, Tooltip, Divider, List } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined, LinkOutlined, FileTextOutlined } from '@ant-design/icons';
import transactionService from '../../../services/transactionService';
import { DocumentLinker, DocumentViewer } from '../../Common';

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
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [approveForm] = Form.useForm();
  const [rejectForm] = Form.useForm();
  
  // Document linking states
  const [documentLinkerOpen, setDocumentLinkerOpen] = useState(false);
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [linkedDocuments, setLinkedDocuments] = useState([]);

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

  const openDetail = async (record) => {
    try {
      setSelected(record);
      setDetailOpen(true);
      
      // Load transaction history
      const res = await transactionService.getTransactionHistory(record.txID);
      setHistory(Array.isArray(res) ? res : (res?.data ?? []));
      
      // Load linked documents
      if (record.documentIDs && record.documentIDs.length > 0) {
        setLinkedDocuments(record.documentIDs);
      } else {
        setLinkedDocuments([]);
      }
    } catch (e) {
      setHistory([]);
      setLinkedDocuments([]);
    }
  };

  const openDocumentLinker = () => {
    setDocumentLinkerOpen(true);
  };

  const openDocumentViewer = (document) => {
    setSelectedDocument(document);
    setDocumentViewerOpen(true);
  };

  const handleDocumentLinkSuccess = () => {
    // Reload transaction details to get updated document list
    if (selected) {
      openDetail(selected);
    }
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

  const columns = useMemo(() => ([
    { title: 'Mã giao dịch', dataIndex: 'txID', key: 'txID', render: v => <code>{v}</code> },
    { title: 'Loại giao dịch', dataIndex: 'type', key: 'type', render: v => <Tag color="blue">{getTransactionTypeLabel(v)}</Tag> },
    { title: 'Thửa đất chính', dataIndex: 'landParcelID', key: 'landParcelID' },
    { title: 'Người thực hiện', dataIndex: 'userID', key: 'userID' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: v => <Tag color={getStatusColor(v)}>{v}</Tag> },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', render: v => v ? new Date(v).toLocaleDateString('vi-VN') : 'N/A' },
    {
      title: 'Thao tác', key: 'actions', fixed: 'right', render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button icon={<EyeOutlined />} onClick={() => openDetail(record)} />
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
        <Drawer title={`Chi tiết giao dịch: ${selected?.txID}`} width={800} open={detailOpen} onClose={() => setDetailOpen(false)}>
          {selected && (
            <div>
              <Row gutter={16}>
                <Col span={12}>
                  <strong>Mã giao dịch:</strong>
                  <br />
                  <code>{selected.txID}</code>
                </Col>
                <Col span={12}>
                  <strong>Loại giao dịch:</strong>
                  <br />
                  <Tag color="blue">{getTransactionTypeLabel(selected.type)}</Tag>
                </Col>
                <Col span={12}>
                  <strong>Thửa đất chính:</strong>
                  <br />
                  {selected.landParcelID}
                </Col>
                <Col span={12}>
                  <strong>Trạng thái:</strong>
                  <br />
                  <Tag color={getStatusColor(selected.status)}>{selected.status}</Tag>
                </Col>
                <Col span={12}>
                  <strong>Người thực hiện:</strong>
                  <br />
                  {selected.userID}
                </Col>
                <Col span={12}>
                  <strong>Ngày tạo:</strong>
                  <br />
                  {selected.createdAt ? new Date(selected.createdAt).toLocaleString('vi-VN') : 'N/A'}
                </Col>
                <Col span={24}>
                  <strong>Chi tiết:</strong>
                  <br />
                  {selected.details || 'Không có'}
                </Col>
              </Row>

              <Divider>Tài liệu liên quan</Divider>
              
              <div style={{ marginBottom: 16 }}>
                <Button
                  type="primary"
                  icon={<LinkOutlined />}
                  onClick={openDocumentLinker}
                >
                  Liên kết tài liệu
                </Button>
              </div>
              
              <List
                header={<div><strong>Danh sách tài liệu ({linkedDocuments.length})</strong></div>}
                bordered
                dataSource={linkedDocuments}
                renderItem={(docId, index) => (
                  <List.Item
                    actions={[
                      <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => {
                          // Tìm tài liệu và mở viewer
                          const doc = linkedDocuments.find(d => d.docID === docId);
                          if (doc) {
                            openDocumentViewer(doc);
                          } else {
                            message.info('Không thể tìm thấy thông tin tài liệu');
                          }
                        }}
                      >
                        Xem
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<FileTextOutlined />}
                      title={`Tài liệu ${index + 1}`}
                      description={`ID: ${docId}`}
                    />
                  </List.Item>
                )}
                locale={{ emptyText: 'Chưa có tài liệu nào được liên kết' }}
              />

              <Divider>Lịch sử giao dịch</Divider>
              
              <List
                header={<div><strong>Lịch sử thay đổi ({history.length})</strong></div>}
                bordered
                dataSource={history}
                renderItem={(item, index) => (
                  <List.Item>
                    <List.Item.Meta
                      title={`Thay đổi ${index + 1}`}
                      description={
                        <div>
                          <div><strong>Transaction ID:</strong> {item.txId || 'N/A'}</div>
                          <div><strong>Thời gian:</strong> {item.timestamp ? new Date(item.timestamp.seconds * 1000).toLocaleString('vi-VN') : 'N/A'}</div>
                          <div><strong>Trạng thái:</strong> {item.isDelete ? 'Vô hiệu' : 'Hiệu lực'}</div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
                locale={{ emptyText: 'Chưa có lịch sử thay đổi' }}
              />
            </div>
          )}
        </Drawer>

        {/* Document Linker Modal */}
        <DocumentLinker
          open={documentLinkerOpen}
          onCancel={() => setDocumentLinkerOpen(false)}
          onSuccess={handleDocumentLinkSuccess}
          targetType="transaction"
          targetID={selected?.txID}
          linkedDocuments={linkedDocuments}
        />

        {/* Document Viewer Modal */}
        <DocumentViewer
          open={documentViewerOpen}
          onCancel={() => setDocumentViewerOpen(false)}
          documentData={selectedDocument}
        />
      </Card>
    </div>
  );
};

export default TransactionManagementPage;
