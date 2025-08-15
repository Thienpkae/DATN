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
  DatePicker
} from 'antd';
import {
  FileTextOutlined,
  EyeOutlined,
  DownloadOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  UploadOutlined
} from '@ant-design/icons';
import documentService from '../../../services/documentService';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;

/**
 * My Documents Page for Org3 (Citizens)
 * View and manage own documents
 */
const MyDocuments = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchForm] = Form.useForm();
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    rejected: 0
  });
  const [filters, setFilters] = useState({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyDocuments();
    fetchStats();
  }, [user?.cccd]);

  const fetchMyDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentService.getDocumentsByUploader(user?.cccd);
      setDocuments(response.documents || response || []);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách tài liệu:', error);
      message.error('Không thể lấy danh sách tài liệu');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const myDocs = await documentService.getDocumentsByUploader(user?.cccd);
      const docs = myDocs.documents || myDocs || [];
      
      setStats({
        total: docs.length,
        verified: docs.filter(doc => doc.verified).length,
        pending: docs.filter(doc => !doc.verified && !doc.rejected).length,
        rejected: docs.filter(doc => doc.rejected).length
      });
    } catch (error) {
      console.error('Lỗi khi lấy thống kê:', error);
    }
  };

  const handleViewDocument = (document) => {
    setSelectedDocument(document);
    setModalVisible(true);
  };

  const handleSearch = async (values) => {
    try {
      setLoading(true);
      if (values.keyword) {
        const response = await documentService.searchDocuments({
          keyword: values.keyword,
          filters: JSON.stringify({
            ...filters,
            uploaderID: user?.cccd
          })
        });
        setDocuments(response.documents || response || []);
      } else {
        fetchMyDocuments();
      }
    } catch (error) {
      console.error('Lỗi khi tìm kiếm:', error);
      message.error('Lỗi khi tìm kiếm tài liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleAdvancedSearch = async (values) => {
    try {
      setLoading(true);
      const response = await documentService.advancedSearch({
        ...values,
        uploaderID: user?.cccd
      });
      setDocuments(response.documents || response || []);
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
    fetchMyDocuments();
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'PENDING': 'orange',
      'VERIFIED': 'green',
      'REJECTED': 'red',
      'EXPIRED': 'default',
      'ARCHIVED': 'blue'
    };
    return statusColors[status] || 'default';
  };

  const getStatusText = (status) => {
    const statusTexts = {
      'PENDING': 'Chờ xử lý',
      'VERIFIED': 'Đã xác thực',
      'REJECTED': 'Bị từ chối',
      'EXPIRED': 'Hết hạn',
      'ARCHIVED': 'Đã lưu trữ'
    };
    return statusTexts[status] || status;
  };

  const getDocumentTypeText = (docType) => {
    const typeTexts = {
      'CERTIFICATE': 'Giấy chứng nhận',
      'CONTRACT': 'Hợp đồng',
      'MAP': 'Bản đồ',
      'IDENTITY': 'Giấy tờ tùy thân',
      'APPLICATION': 'Đơn từ',
      'OTHER': 'Khác'
    };
    return typeTexts[docType] || docType;
  };

  const columns = [
    {
      title: 'Mã tài liệu',
      dataIndex: 'docID',
      key: 'docID',
      width: 120,
      render: (text) => <Text code>{text}</Text>
    },
    {
      title: 'Loại tài liệu',
      dataIndex: 'docType',
      key: 'docType',
      width: 120,
      render: (docType) => <Tag color="blue">{getDocumentTypeText(docType)}</Tag>
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <Text ellipsis style={{ maxWidth: 200 }}>{text}</Text>
        </Tooltip>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'verified',
      key: 'verified',
      width: 120,
      render: (verified, record) => {
        if (record.rejected) {
          return <Tag color="red" icon={<CloseCircleOutlined />}>Bị từ chối</Tag>;
        }
        return verified ? 
          <Tag color="green" icon={<CheckCircleOutlined />}>Đã xác thực</Tag> : 
          <Tag color="orange" icon={<ExclamationCircleOutlined />}>Chờ xử lý</Tag>;
      }
    },
    {
      title: 'Loại file',
      dataIndex: 'fileType',
      key: 'fileType',
      width: 100,
      render: (fileType) => <Tag>{fileType}</Tag>
    },
    {
      title: 'Kích thước',
      dataIndex: 'fileSize',
      key: 'fileSize',
      width: 100,
      render: (fileSize) => fileSize ? `${(fileSize / 1024).toFixed(2)} KB` : 'N/A'
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
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => handleViewDocument(record)}
            />
          </Tooltip>
          {record.ipfsHash && (
            <Tooltip title="Tải xuống">
              <Button 
                icon={<DownloadOutlined />} 
                size="small"
                onClick={() => window.open(`/api/ipfs/${record.ipfsHash}`, '_blank')}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={2}>
            <FileTextOutlined /> Tài liệu của tôi
          </Title>
          <Text type="secondary">
            Quản lý và theo dõi trạng thái các tài liệu bạn đã tải lên
          </Text>
        </Col>
        <Col>
          <Space>
            <Button 
              type="primary" 
              icon={<UploadOutlined />}
              onClick={() => navigate('/documents/upload')}
            >
              Tải lên tài liệu mới
            </Button>
            <Button 
              icon={<ReloadOutlined />}
              onClick={fetchMyDocuments}
              loading={loading}
            >
              Làm mới
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Thống kê */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng số tài liệu"
              value={stats.total}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đã xác thực"
              value={stats.verified}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Chờ xử lý"
              value={stats.pending}
              valueStyle={{ color: '#faad14' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
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
          <Form.Item name="docType" label="Loại tài liệu">
            <Select placeholder="Chọn loại tài liệu">
              <Option value="">Tất cả</Option>
              <Option value="CERTIFICATE">Giấy chứng nhận</Option>
              <Option value="CONTRACT">Hợp đồng</Option>
              <Option value="MAP">Bản đồ</Option>
              <Option value="IDENTITY">Giấy tờ tùy thân</Option>
              <Option value="APPLICATION">Đơn từ</Option>
              <Option value="OTHER">Khác</Option>
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

      {/* Bảng danh sách tài liệu */}
      <Card>
        <Table
          columns={columns}
          dataSource={documents}
          loading={loading}
          rowKey="docID"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} trong ${total} tài liệu`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Chi tiết tài liệu Modal */}
      <Modal
        title="Chi tiết Tài liệu"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Đóng
          </Button>
        ]}
      >
        {selectedDocument && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Mã tài liệu" span={2}>
              <Text code>{selectedDocument.docID}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Loại tài liệu">
              <Tag color="blue">{getDocumentTypeText(selectedDocument.docType)}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Tiêu đề">
              <Text>{selectedDocument.title}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={getStatusColor(selectedDocument.verified)}>
                {getStatusText(selectedDocument.verified)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {selectedDocument.createdAt ? new Date(selectedDocument.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Kích thước">
              {selectedDocument.fileSize ? `${(selectedDocument.fileSize / 1024).toFixed(2)} KB` : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Mô tả" span={2}>
              {selectedDocument.description || 'Không có mô tả'}
            </Descriptions.Item>
            {selectedDocument.verifierComments && (
              <Descriptions.Item label="Bình luận xác thực" span={2}>
                {selectedDocument.verifierComments}
              </Descriptions.Item>
            )}
            {selectedDocument.rejectionComments && (
              <Descriptions.Item label="Bình luận từ chối" span={2}>
                {selectedDocument.rejectionComments}
              </Descriptions.Item>
            )}
            {selectedDocument.verifiedAt && (
              <Descriptions.Item label="Ngày xác thực">
                {new Date(selectedDocument.verifiedAt).toLocaleDateString('vi-VN')}
              </Descriptions.Item>
            )}
            {selectedDocument.rejectedAt && (
              <Descriptions.Item label="Ngày từ chối">
                {new Date(selectedDocument.rejectedAt).toLocaleDateString('vi-VN')}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default MyDocuments;
