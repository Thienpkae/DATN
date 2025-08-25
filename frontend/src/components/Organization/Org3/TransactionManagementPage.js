import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Space, Tag, message, Drawer, Row, Col, Tooltip, Divider, Tabs } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined, EyeOutlined, CheckCircleOutlined, HistoryOutlined } from '@ant-design/icons';
import transactionService from '../../../services/transactionService';
import authService from '../../../services/auth';

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

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
  const [activeTab, setActiveTab] = useState('my');
  const [form] = Form.useForm();
  const [confirmForm] = Form.useForm();

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

  const loadAllTransactions = async () => {
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
    if (activeTab === 'my') {
      loadMyTransactions();
    } else {
      loadAllTransactions();
    }
  }, [activeTab]);

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
      const values = await form.validateFields();
      const validation = transactionService.validateTransactionData(values, values.type);
      if (!validation.isValid) {
        message.warning(validation.errors.join('\n'));
        return;
      }
      setLoading(true);
      
      switch (values.type) {
        case 'TRANSFER':
          await transactionService.createTransferRequest({
            txID: values.txID,
            landParcelID: values.landParcelID,
            fromOwnerID: values.fromOwnerID,
            toOwnerID: values.toOwnerID
          });
          break;
        case 'SPLIT':
          await transactionService.createSplitRequest({
            txID: values.txID,
            landParcelID: values.landParcelID,
            fromOwnerID: values.fromOwnerID,
            newParcels: values.newParcels
          });
          break;
        case 'MERGE':
          await transactionService.createMergeRequest({
            txID: values.txID,
            parcelIDs: values.parcelIDs,
            fromOwnerID: values.fromOwnerID,
            newParcel: values.newParcel
          });
          break;
        case 'CHANGE_PURPOSE':
          await transactionService.createChangePurposeRequest({
            txID: values.txID,
            landParcelID: values.landParcelID,
            fromOwnerID: values.fromOwnerID,
            newPurpose: values.newPurpose
          });
          break;
        case 'REISSUE':
          await transactionService.createReissueRequest({
            txID: values.txID,
            landParcelID: values.landParcelID,
            fromOwnerID: values.fromOwnerID
          });
          break;
        default:
          throw new Error('Loại giao dịch không được hỗ trợ');
      }
      
      message.success('Tạo giao dịch thành công');
      setCreateOpen(false);
      form.resetFields();
      if (activeTab === 'my') {
        loadMyTransactions();
      } else {
        loadAllTransactions();
      }
    } catch (e) {
      message.error(e.message || 'Tạo giao dịch thất bại');
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
      if (activeTab === 'my') {
        loadMyTransactions();
      } else {
        loadAllTransactions();
      }
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

  const canConfirm = (transaction) => {
    return transaction.status === 'APPROVED' && transaction.type === 'TRANSFER';
  };

  const columns = useMemo(() => ([
    { title: 'Mã giao dịch', dataIndex: 'txID', key: 'txID' },
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

    const renderCreateForm = () => {
    return (
      <Form layout="vertical" form={form}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="txID" label="Mã giao dịch" rules={[{ required: true, message: 'Bắt buộc' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="type" label="Loại giao dịch" rules={[{ required: true, message: 'Bắt buộc' }]}>
              <Select placeholder="Chọn loại" onChange={(value) => form.setFieldsValue({ type: value })}>
                <Option value="TRANSFER">Chuyển nhượng</Option>
                <Option value="SPLIT">Tách thửa</Option>
                <Option value="MERGE">Gộp thửa</Option>
                <Option value="CHANGE_PURPOSE">Đổi mục đích sử dụng</Option>
                <Option value="REISSUE">Cấp lại giấy chứng nhận</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item name="landParcelID" label="Mã thửa đất" rules={[{ required: true, message: 'Bắt buộc' }]}>
          <Input />
        </Form.Item>
        
        <Form.Item name="fromOwnerID" label="CCCD người gửi" rules={[{ required: true, message: 'Bắt buộc' }]}>
          <Input />
        </Form.Item>

        <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}>
          {({ getFieldValue }) => {
            const type = getFieldValue('type');
            return type === 'TRANSFER' ? (
              <Form.Item name="toOwnerID" label="CCCD người nhận" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Input />
              </Form.Item>
            ) : null;
          }}
        </Form.Item>

        <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}>
          {({ getFieldValue }) => {
            const type = getFieldValue('type');
            return type === 'CHANGE_PURPOSE' ? (
              <Form.Item name="newPurpose" label="Mục đích sử dụng mới" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Select placeholder="Chọn mục đích">
                  <Option value="Đất ở">Đất ở</Option>
                  <Option value="Đất nông nghiệp">Đất nông nghiệp</Option>
                  <Option value="Đất thương mại">Đất thương mại</Option>
                  <Option value="Đất công nghiệp">Đất công nghiệp</Option>
                  <Option value="Đất phi nông nghiệp">Đất phi nông nghiệp</Option>
                </Select>
              </Form.Item>
            ) : null;
          }}
        </Form.Item>

        <Form.Item name="description" label="Mô tả">
          <TextArea rows={3} />
        </Form.Item>
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
          <Button icon={<ReloadOutlined />} onClick={() => activeTab === 'my' ? loadMyTransactions() : loadAllTransactions()}>Tải lại</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>Tạo giao dịch</Button>
        </Space>
      }
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Giao dịch của tôi" key="my" />
        <TabPane tab="Tất cả giao dịch" key="all" />
      </Tabs>

      <Table
        rowKey={(r) => r.txID}
        loading={loading}
        dataSource={transactions}
        columns={columns}
        scroll={{ x: 1400 }}
        pagination={{ pageSize: 10, showSizeChanger: true }}
      />

      {/* Create Transaction */}
      <Modal title="Tạo giao dịch" open={createOpen} onOk={onCreate} onCancel={() => setCreateOpen(false)} confirmLoading={loading} width={720}>
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
