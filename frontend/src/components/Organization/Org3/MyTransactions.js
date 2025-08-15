import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Typography,
  Row,
  Col,
  Statistic,
  Descriptions,
  Tooltip,
  Alert,
  Form,
  Input,
  Select,
  DatePicker,
  Steps,
  Divider
} from 'antd';
import {
  TransactionOutlined,
  EyeOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import transactionService from '../../../services/transactionService';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;
const { Step } = Steps;

/**
 * My Transactions Page for Org3 (Citizens)
 * View and manage own transactions
 */
const MyTransactions = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchForm] = Form.useForm();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    approved: 0,
    rejected: 0
  });
  const [filters, setFilters] = useState({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyTransactions();
    fetchStats();
  }, [user?.cccd]);

  const fetchMyTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionService.getTransactionsByOwner(user?.cccd);
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
      const myTxs = await transactionService.getTransactionsByOwner(user?.cccd);
      const txs = myTxs.transactions || myTxs || [];
      
      setStats({
        total: txs.length,
        pending: txs.filter(tx => tx.status === 'PENDING').length,
        confirmed: txs.filter(tx => tx.status === 'CONFIRMED').length,
        approved: txs.filter(tx => tx.status === 'APPROVED').length,
        rejected: txs.filter(tx => tx.status === 'REJECTED').length
      });
    } catch (error) {
      console.error('Lỗi khi lấy thống kê:', error);
    }
  };

  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setModalVisible(true);
  };

  const handleSearch = async (values) => {
    try {
      setLoading(true);
      if (values.keyword) {
        const response = await transactionService.searchTransactions({
          keyword: values.keyword,
          filters: JSON.stringify({
            ...filters,
            fromOwnerID: user?.cccd
          })
        });
        setTransactions(response.transactions || response || []);
      } else {
        fetchMyTransactions();
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
      const response = await transactionService.advancedSearch({
        ...values,
        fromOwnerID: user?.cccd
      });
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
    fetchMyTransactions();
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return <ClockCircleOutlined />;
      case 'APPROVED':
        return <CheckCircleOutlined />;
      case 'REJECTED':
        return <CloseCircleOutlined />;
      case 'CONFIRMED':
        return <CheckCircleOutlined />;
      default:
        return <ExclamationCircleOutlined />;
    }
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
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
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
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => handleViewTransaction(record)}
            />
          </Tooltip>
          <Tooltip title="Xem lịch sử">
            <Button 
              icon={<HistoryOutlined />} 
              size="small"
              onClick={() => handleViewHistory(record.txID)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleViewHistory = async (txID) => {
    try {
      const history = await transactionService.getTransactionHistory(txID);
      // Hiển thị lịch sử trong modal hoặc navigate đến trang lịch sử
      console.log('Transaction history:', history);
    } catch (error) {
      console.error('Lỗi khi lấy lịch sử giao dịch:', error);
    }
  };

  const getTransactionSteps = (transaction) => {
    const steps = [
      {
        title: 'Tạo giao dịch',
        description: 'Đã tạo',
        status: 'finish',
        icon: <CheckCircleOutlined />
      }
    ];

    if (transaction.status === 'CONFIRMED' || transaction.status === 'FORWARDED' || transaction.status === 'VERIFIED' || transaction.status === 'APPROVED') {
      steps.push({
        title: 'Xác nhận',
        description: 'Đã xác nhận',
        status: 'finish',
        icon: <CheckCircleOutlined />
      });
    }

    if (transaction.status === 'FORWARDED' || transaction.status === 'VERIFIED' || transaction.status === 'APPROVED') {
      steps.push({
        title: 'Chuyển tiếp',
        description: 'Đã chuyển tiếp',
        status: 'finish',
        icon: <CheckCircleOutlined />
      });
    }

    if (transaction.status === 'VERIFIED' || transaction.status === 'APPROVED') {
      steps.push({
        title: 'Xác thực',
        description: 'Đã xác thực',
        status: 'finish',
        icon: <CheckCircleOutlined />
      });
    }

    if (transaction.status === 'APPROVED') {
      steps.push({
        title: 'Phê duyệt',
        description: 'Đã phê duyệt',
        status: 'finish',
        icon: <CheckCircleOutlined />
      });
    } else if (transaction.status === 'REJECTED') {
      steps.push({
        title: 'Phê duyệt',
        description: 'Bị từ chối',
        status: 'error',
        icon: <CloseCircleOutlined />
      });
    } else {
      steps.push({
        title: 'Phê duyệt',
        description: 'Chờ phê duyệt',
        status: 'wait',
        icon: <ClockCircleOutlined />
      });
    }

    return steps;
  };

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={2}>
            <TransactionOutlined /> Giao dịch của tôi
          </Title>
          <Text type="secondary">
            Quản lý và theo dõi trạng thái các giao dịch bạn đã thực hiện
          </Text>
        </Col>
        <Col>
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => navigate('/transactions/create')}
            >
              Tạo giao dịch mới
            </Button>
            <Button 
              icon={<ReloadOutlined />}
              onClick={fetchMyTransactions}
              loading={loading}
            >
              Làm mới
            </Button>
          </Space>
        </Col>
      </Row>

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
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Đã xác nhận"
              value={stats.confirmed}
              valueStyle={{ color: '#1890ff' }}
              prefix={<CheckCircleOutlined />}
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
          <Button onClick={handleResetFilters}>
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
              <Option value="CONFIRMED">Đã xác nhận</Option>
              <Option value="FORWARDED">Đã chuyển tiếp</Option>
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
        width={900}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Đóng
          </Button>
        ]}
      >
        {selectedTransaction && (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="Mã giao dịch" span={2}>
                <Text code>{selectedTransaction.txID}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Loại giao dịch">
                <Tag color="blue">{getTransactionTypeText(selectedTransaction.type)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={getStatusColor(selectedTransaction.status)} icon={getStatusIcon(selectedTransaction.status)}>
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

            <Divider />

            <div>
              <Title level={4}>Tiến trình xử lý</Title>
              <Steps 
                current={getTransactionSteps(selectedTransaction).length - 1}
                direction="vertical"
                size="small"
              >
                {getTransactionSteps(selectedTransaction).map((step, index) => (
                  <Step
                    key={index}
                    title={step.title}
                    description={step.description}
                    status={step.status}
                    icon={step.icon}
                  />
                ))}
              </Steps>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyTransactions;
