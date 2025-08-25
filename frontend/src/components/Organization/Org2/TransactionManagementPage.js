import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Space, Tag, message, Drawer, Row, Col, Tooltip, Divider } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, CheckCircleOutlined, ForwardOutlined, HistoryOutlined } from '@ant-design/icons';
import transactionService from '../../../services/transactionService';

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
  const [forwardOpen, setForwardOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [forwardForm] = Form.useForm();

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
      setLoading(true);
      await transactionService.processTransaction(selected.txID);
      message.success('Xử lý giao dịch thành công');
      setProcessOpen(false);
      loadList();
    } catch (e) {
      message.error(e.message || 'Xử lý thất bại');
    } finally {
      setLoading(false);
    }
  };

  const onForward = async () => {
    try {
      await forwardForm.validateFields();
      setLoading(true);
      await transactionService.forwardTransaction(selected.txID);
      message.success('Chuyển tiếp giao dịch thành công');
      setForwardOpen(false);
      loadList();
    } catch (e) {
      message.error(e.message || 'Chuyển tiếp thất bại');
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

  const canProcess = (transaction) => {
    return transaction.status === 'PENDING';
  };

  const canForward = (transaction) => {
    return transaction.status === 'VERIFIED';
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
          {canForward(record) && (
            <Tooltip title="Chuyển tiếp">
              <Button 
                type="default" 
                icon={<ForwardOutlined />} 
                onClick={() => {
                  setSelected(record);
                  setForwardOpen(true);
                }}
              >
                Chuyển tiếp
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
            <Option value="FORWARDED">Đã chuyển tiếp</Option>
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

      {/* Process Transaction */}
      <Modal title="Xử lý giao dịch" open={processOpen} onOk={onProcess} onCancel={() => setProcessOpen(false)} confirmLoading={loading} width={640}>
        <div>
          <div style={{ marginBottom: 16 }}>
            <strong>Thông tin giao dịch:</strong>
            <div style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              <div><strong>Mã giao dịch:</strong> {selected?.txID}</div>
              <div><strong>Loại:</strong> {selected ? transactionService.getTransactionTypeText(selected.type) : ''}</div>
              <div><strong>Thửa đất:</strong> {selected?.landParcelId}</div>
              <div><strong>Người gửi:</strong> {selected?.fromOwnerId}</div>
              {selected?.toOwnerId && <div><strong>Người nhận:</strong> {selected.toOwnerId}</div>}
            </div>
          </div>
          <div style={{ color: '#666', fontSize: '14px' }}>
            Bạn có chắc chắn muốn xử lý giao dịch này? Hành động này sẽ chuyển trạng thái giao dịch từ "Chờ xử lý" sang "Đã thẩm định".
          </div>
        </div>
      </Modal>

      {/* Forward Transaction */}
      <Modal title="Chuyển tiếp giao dịch" open={forwardOpen} onOk={onForward} onCancel={() => setForwardOpen(false)} confirmLoading={loading} width={640}>
        <Form layout="vertical" form={forwardForm}>
          <div style={{ marginBottom: 16 }}>
            <strong>Thông tin giao dịch:</strong>
            <div style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              <div><strong>Mã giao dịch:</strong> {selected?.txID}</div>
              <div><strong>Loại:</strong> {selected ? transactionService.getTransactionTypeText(selected.type) : ''}</div>
              <div><strong>Thửa đất:</strong> {selected?.landParcelId}</div>
              <div><strong>Người gửi:</strong> {selected?.fromOwnerId}</div>
              {selected?.toOwnerId && <div><strong>Người nhận:</strong> {selected.toOwnerId}</div>}
            </div>
          </div>
          <div style={{ color: '#666', fontSize: '14px' }}>
            Bạn có chắc chắn muốn chuyển tiếp giao dịch này lên cấp trên (Sở TN&MT) để phê duyệt? Hành động này sẽ chuyển trạng thái giao dịch từ "Đã thẩm định" sang "Đã chuyển tiếp".
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
                      borderLeft: '4px solid #722ed1'
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
