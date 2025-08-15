import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  message,
  Typography,
  Row,
  Col,
  Statistic,
  Descriptions,
  Select,
  DatePicker,
  Tooltip,
  Alert
} from 'antd';
import {
  TransactionOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  ForwardOutlined
} from '@ant-design/icons';
import transactionService from '../../../services/transactionService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

/**
 * Transaction Management Page for Org1 (Land Registry Authority)
 * Manages and approves all transactions in the system
 */
const TransactionManagementPage = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [approvingTransaction, setApprovingTransaction] = useState(null);
  const [searchForm] = Form.useForm();
  const [approvalForm] = Form.useForm();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    forwarded: 0
  });
  const [filters, setFilters] = useState({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionService.getAllTransactions();
      setTransactions(response.transactions || response || []);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách giao dịch:', error);
      message.error('Không thể lấy danh sách giao dịch');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const allTxs = await transactionService.getAllTransactions();
      const txs = allTxs.transactions || allTxs || [];
      
      setStats({
        total: txs.length,
        pending: txs.filter(tx => tx.status === 'PENDING').length,
        approved: txs.filter(tx => tx.status === 'APPROVED').length,
        rejected: txs.filter(tx => tx.status === 'REJECTED').length,
        forwarded: txs.filter(tx => tx.status === 'FORWARDED').length
      });
    } catch (error) {
      console.error('Lỗi khi lấy thống kê:', error);
    }
  };

  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setModalVisible(true);
  };

  const handleApproveTransaction = async (values) => {
    try {
      setLoading(true);
      const { comments } = values;
      const tx = approvingTransaction;
      
      switch (tx.type) {
        case 'TRANSFER':
          await transactionService.approveTransferTransaction(tx.txID, {
            action: 'APPROVE',
            comments,
            approvedBy: user.cccd,
            approvedAt: new Date().toISOString()
          });
          break;
        case 'SPLIT':
          await transactionService.approveSplitTransaction(tx.txID, {
            action: 'APPROVE',
            comments,
            approvedBy: user.cccd,
            approvedAt: new Date().toISOString()
          });
          break;
        case 'MERGE':
          await transactionService.approveMergeTransaction(tx.txID, {
            action: 'APPROVE',
            comments,
            approvedBy: user.cccd,
            approvedAt: new Date().toISOString()
          });
          break;
        case 'CHANGE_PURPOSE':
          await transactionService.approveChangePurposeTransaction(tx.txID, {
            action: 'APPROVE',
            comments,
            approvedBy: user.cccd,
            approvedAt: new Date().toISOString()
          });
          break;
        case 'REISSUE':
          await transactionService.approveReissueTransaction(tx.txID, {
            action: 'APPROVE',
            comments,
            approvedBy: user.cccd,
            approvedAt: new Date().toISOString()
          });
          break;
        default:
          throw new Error('Loại giao dịch không được hỗ trợ');
      }
      
      message.success('Giao dịch đã được phê duyệt thành công');
      fetchTransactions();
      fetchStats();
      setApprovalModalVisible(false);
      setApprovingTransaction(null);
      approvalForm.resetFields();
    } catch (error) {
      console.error('Lỗi khi phê duyệt giao dịch:', error);
      message.error(error.message || 'Lỗi khi phê duyệt giao dịch');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectTransaction = async (txID, rejectionData) => {
    try {
      setLoading(true);
      await transactionService.rejectTransaction(txID, {
        action: 'REJECT',
        ...rejectionData,
        rejectedBy: user.cccd,
        rejectedAt: new Date().toISOString()
      });
      
      message.success('Giao dịch đã bị từ chối');
      fetchTransactions();
      fetchStats();
    } catch (error) {
      console.error('Lỗi khi từ chối giao dịch:', error);
      message.error(error.message || 'Lỗi khi từ chối giao dịch');
    } finally {
      setLoading(false);
    }
  };

  const openApprovalModal = (transaction) => {
    setApprovingTransaction(transaction);
    setApprovalModalVisible(true);
  };

  const handleSearch = async (values) => {
    try {
      setLoading(true);
      if (values.keyword) {
        const response = await transactionService.searchTransactions({
          keyword: values.keyword,
          filters: JSON.stringify(filters)
        });
        setTransactions(response.transactions || response || []);
      } else {
        fetchTransactions();
      }
    } catch (error) {
      console.error('Lỗi khi tìm kiếm:', error);
      message.error('Lỗi khi tìm kiếm giao dịch');
    } finally {
      setLoading(false);
    }
  };

  const handleAdvancedSearch = async (values) => {
    try {
      setLoading(true);
      const response = await transactionService.advancedSearch(values);
      setTransactions(response.transactions || response || []);
    } catch (error) {
      console.error('Lỗi khi tìm kiếm nâng cao:', error);
      message.error('Lỗi khi tìm kiếm nâng cao');
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    searchForm.resetFields();
    setFilters({});
    fetchTransactions();
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'PENDING': 'orange',
      'CONFIRMED': 'blue',
      'FORWARDED': 'cyan',
      'VERIFIED': 'purple',
      'SUPPLEMENT_REQUESTED': 'gold',
      'APPROVED': 'green',
      'REJECTED': 'red'
    };
    return statusColors[status] || 'default';
  };

  const getStatusText = (status) => {
    const statusTexts = {
      'PENDING': 'Chờ xử lý',
      'CONFIRMED': 'Đã xác nhận',
      'FORWARDED': 'Đã chuyển tiếp',
      'VERIFIED': 'Đã xác thực',
      'SUPPLEMENT_REQUESTED': 'Yêu cầu bổ sung',
      'APPROVED': 'Đã phê duyệt',
      'REJECTED': 'Bị từ chối'
    };
    return statusTexts[status] || status;
  };

  const getTransactionTypeText = (type) => {
    const typeTexts = {
      'TRANSFER': 'Chuyển nhượng',
      'SPLIT': 'Tách thửa',
      'MERGE': 'Hợp thửa',
      'CHANGE_PURPOSE': 'Thay đổi mục đích sử dụng',
      'REISSUE': 'Cấp lại GCN'
    };
    return typeTexts[type] || type;
  };

  const getActionText = (action) => {
    const actionTexts = {
      'CREATE': 'Tạo mới',
      'UPDATE': 'Cập nhật',
      'QUERY': 'Truy vấn',
      'APPROVE': 'Phê duyệt',
      'REJECT': 'Từ chối'
    };
    return actionTexts[action] || action;
  };

  const columns = [
    {
      title: 'Mã giao dịch',
      dataIndex: 'txID',
      key: 'txID',
      width: 120,
      render: (text) => <Text code>{text}</Text>
    },
    {
      title: 'Loại giao dịch',
      dataIndex: 'type',
      key: 'type',
      width: 150,
      render: (type) => <Tag color="blue">{getTransactionTypeText(type)}</Tag>
    },
    {
      title: 'Thửa đất',
      dataIndex: 'landParcelID',
      key: 'landParcelID',
      width: 120,
      render: (text) => <Text code>{text}</Text>
    },
    {
      title: 'Người thực hiện',
      dataIndex: 'userID',
      key: 'userID',
      width: 120,
      render: (text) => <Text code>{text}</Text>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (action) => <Tag>{getActionText(action)}</Tag>
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => date ? new Date(date).toLocaleDateString('vi-VN') : 'N/A'
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => handleViewTransaction(record)}
            />
          </Tooltip>
          {record.status === 'VERIFIED' && (
            <Tooltip title="Phê duyệt">
              <Button 
                icon={<CheckCircleOutlined />} 
                size="small"
                type="primary"
                onClick={() => openApprovalModal(record)}
              >
                Phê duyệt
              </Button>
            </Tooltip>
          )}
          {record.status === 'VERIFIED' && (
            <Tooltip title="Từ chối">
              <Button 
                icon={<CloseCircleOutlined />} 
                size="small"
                danger
                onClick={() => handleRejectTransaction(record.txID, {
                  rejectionComments: 'Giao dịch không đáp ứng yêu cầu'
                })}
              >
                Từ chối
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>
        <TransactionOutlined /> Quản lý Giao dịch
      </Title>
      
      <Alert
        message="Tổ chức: Org1 (Cơ quan quản lý đất đai)"
        description="Bạn có quyền phê duyệt hoặc từ chối các giao dịch đã được xác thực. Hãy xem xét cẩn thận trước khi đưa ra quyết định."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* Thống kê */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="Tổng số giao dịch"
              value={stats.total}
              prefix={<TransactionOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Chờ xử lý"
              value={stats.pending}
              valueStyle={{ color: '#faad14' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Đã phê duyệt"
              value={stats.approved}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Bị từ chối"
              value={stats.rejected}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Đã chuyển tiếp"
              value={stats.forwarded}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ForwardOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Bộ lọc tìm kiếm */}
      <Form form={searchForm} layout="inline" style={{ marginBottom: '24px' }}>
        <Form.Item name="keyword" label="Từ khóa">
          <Input placeholder="Nhập từ khóa tìm kiếm" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" icon={<SearchOutlined />} onClick={() => handleSearch({ keyword: searchForm.getFieldValue('keyword') })}>
            Tìm kiếm
          </Button>
          <Button icon={<FilterOutlined />} onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
            {showAdvancedFilters ? 'Ẩn' : 'Hiện'} Bộ lọc nâng cao
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleResetFilters}>
            Đặt lại
          </Button>
        </Form.Item>
      </Form>

      {/* Bộ lọc nâng cao */}
      {showAdvancedFilters && (
        <Form form={searchForm} layout="inline" style={{ marginBottom: '24px' }}>
          <Form.Item name="type" label="Loại giao dịch">
            <Select placeholder="Chọn loại giao dịch">
              <Option value="">Tất cả</Option>
              <Option value="TRANSFER">Chuyển nhượng</Option>
              <Option value="SPLIT">Tách thửa</Option>
              <Option value="MERGE">Hợp thửa</Option>
              <Option value="CHANGE_PURPOSE">Thay đổi mục đích sử dụng</Option>
              <Option value="REISSUE">Cấp lại GCN</Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="Trạng thái">
            <Select placeholder="Chọn trạng thái">
              <Option value="">Tất cả</Option>
              <Option value="PENDING">Chờ xử lý</Option>
              <Option value="VERIFIED">Đã xác thực</Option>
              <Option value="APPROVED">Đã phê duyệt</Option>
              <Option value="REJECTED">Bị từ chối</Option>
            </Select>
          </Form.Item>
          <Form.Item name="startDate" label="Từ ngày">
            <DatePicker />
          </Form.Item>
          <Form.Item name="endDate" label="Đến ngày">
            <DatePicker />
          </Form.Item>
          <Form.Item>
            <Button type="primary" icon={<FilterOutlined />} onClick={() => handleAdvancedSearch(searchForm.getFieldsValue())}>
              Áp dụng bộ lọc
            </Button>
            <Button onClick={handleResetFilters}>Đặt lại</Button>
          </Form.Item>
        </Form>
      )}

      {/* Bảng danh sách giao dịch */}
      <Card>
        <Table
          columns={columns}
          dataSource={transactions}
          loading={loading}
          rowKey="txID"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} trong ${total} giao dịch`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Chi tiết giao dịch Modal */}
      <Modal
        title="Chi tiết Giao dịch"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Đóng
          </Button>
        ]}
      >
        {selectedTransaction && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Mã giao dịch" span={2}>
              <Text code>{selectedTransaction.txID}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Loại giao dịch">
              <Tag color="blue">{getTransactionTypeText(selectedTransaction.type)}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={getStatusColor(selectedTransaction.status)}>
                {getStatusText(selectedTransaction.status)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Thửa đất">
              <Text code>{selectedTransaction.landParcelID}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Người thực hiện">
              <Text code>{selectedTransaction.userID}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Hành động">
              <Tag>{getActionText(selectedTransaction.action)}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {selectedTransaction.createdAt ? new Date(selectedTransaction.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Chi tiết" span={2}>
              {selectedTransaction.details || 'Không có chi tiết'}
            </Descriptions.Item>
            {selectedTransaction.fromOwnerID && (
              <Descriptions.Item label="Người chuyển nhượng">
                <Text code>{selectedTransaction.fromOwnerID}</Text>
              </Descriptions.Item>
            )}
            {selectedTransaction.toOwnerID && (
              <Descriptions.Item label="Người nhận chuyển nhượng">
                <Text code>{selectedTransaction.toOwnerID}</Text>
              </Descriptions.Item>
            )}
            {selectedTransaction.parcelIDs && selectedTransaction.parcelIDs.length > 0 && (
              <Descriptions.Item label="Danh sách thửa đất" span={2}>
                {selectedTransaction.parcelIDs.map((id, index) => (
                  <Tag key={index} color="blue" style={{ marginBottom: 4 }}>
                    {id}
                  </Tag>
                ))}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* Phê duyệt giao dịch Modal */}
      <Modal
        title="Phê duyệt Giao dịch"
        open={approvalModalVisible}
        onCancel={() => {
          setApprovalModalVisible(false);
          setApprovingTransaction(null);
          approvalForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        {approvingTransaction && (
          <div>
            <Alert
              message="Thông tin giao dịch cần phê duyệt"
              description={
                <div>
                  <p><strong>Mã giao dịch:</strong> {approvingTransaction.txID}</p>
                  <p><strong>Loại:</strong> {getTransactionTypeText(approvingTransaction.type)}</p>
                  <p><strong>Thửa đất:</strong> {approvingTransaction.landParcelID}</p>
                  <p><strong>Người thực hiện:</strong> {approvingTransaction.userID}</p>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form
              form={approvalForm}
              layout="vertical"
              onFinish={handleApproveTransaction}
            >
              <Form.Item
                name="action"
                label="Hành động"
                rules={[{ required: true, message: 'Vui lòng chọn hành động!' }]}
              >
                <Select placeholder="Chọn hành động">
                  <Option value="APPROVE">
                    <Space>
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      Phê duyệt
                    </Space>
                  </Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="comments"
                label="Bình luận phê duyệt"
                rules={[{ required: true, message: 'Vui lòng nhập bình luận!' }]}
              >
                <TextArea 
                  rows={4} 
                  placeholder="Nhập bình luận về việc phê duyệt giao dịch"
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    Xác nhận phê duyệt
                  </Button>
                  <Button onClick={() => {
                    setApprovalModalVisible(false);
                    setApprovingTransaction(null);
                    approvalForm.resetFields();
                  }}>
                    Hủy
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TransactionManagementPage;
