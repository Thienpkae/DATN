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
  Alert,
  Divider
} from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import documentService from '../../../services/documentService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

/**
 * Document Verification Page for Org2 (Commune Administrative Unit)
 * Verifies documents submitted by citizens
 */
const DocumentVerificationPage = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [verificationModalVisible, setVerificationModalVisible] = useState(false);
  const [verifyingDocument, setVerifyingDocument] = useState(null);
  const [searchForm] = Form.useForm();
  const [verificationForm] = Form.useForm();
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    rejected: 0
  });
  const [filters, setFilters] = useState({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    fetchDocuments();
    fetchStats();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentService.getAllDocuments();
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
      const allDocs = await documentService.getAllDocuments();
      const docs = allDocs.documents || allDocs || [];
      
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

  const handleVerifyDocument = async (values) => {
    try {
      setLoading(true);
      const { action, comments } = values;
      
      if (action === 'VERIFIED') {
        await documentService.verifyDocument(verifyingDocument.docID, {
          status: 'VERIFIED',
          verifierComments: comments,
          verifiedBy: user.cccd,
          verifiedAt: new Date().toISOString()
        });
        message.success('Tài liệu đã được xác thực thành công');
      } else if (action === 'REJECTED') {
        await documentService.rejectDocument(verifyingDocument.docID, {
          status: 'REJECTED',
          rejectionComments: comments,
          rejectedBy: user.cccd,
          rejectedAt: new Date().toISOString()
        });
        message.success('Tài liệu đã bị từ chối');
      }
      
      fetchDocuments();
      fetchStats();
      setVerificationModalVisible(false);
      setVerifyingDocument(null);
      verificationForm.resetFields();
    } catch (error) {
      console.error('Lỗi khi xác thực tài liệu:', error);
      message.error(error.message || 'Lỗi khi xác thực tài liệu');
    } finally {
      setLoading(false);
    }
  };

  const openVerificationModal = (document) => {
    setVerifyingDocument(document);
    setVerificationModalVisible(true);
  };

  const handleSearch = async (values) => {
    try {
      setLoading(true);
      if (values.keyword) {
        const response = await documentService.searchDocuments({
          keyword: values.keyword,
          filters: JSON.stringify(filters)
        });
        setDocuments(response.documents || response || []);
      } else {
        fetchDocuments();
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
      const response = await documentService.advancedSearch(values);
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
    fetchDocuments();
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
      title: 'Người upload',
      dataIndex: 'uploadedBy',
      key: 'uploadedBy',
      width: 120,
      render: (text) => <Text code>{text}</Text>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'verified',
      key: 'verified',
      width: 120,
      render: (verified, record) => {
        if (record.rejected) {
          return <Tag color="red">Bị từ chối</Tag>;
        }
        return verified ? 
          <Tag color="green" icon={<CheckCircleOutlined />}>Đã xác thực</Tag> : 
          <Tag color="orange">Chờ xử lý</Tag>;
      }
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
              onClick={() => handleViewDocument(record)}
            />
          </Tooltip>
          {!record.verified && !record.rejected && (
            <Tooltip title="Xác thực">
              <Button 
                icon={<CheckCircleOutlined />} 
                size="small"
                type="primary"
                onClick={() => openVerificationModal(record)}
              >
                Xác thực
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
        <FileTextOutlined /> Xác thực Tài liệu
      </Title>
      
      <Alert
        message="Tổ chức: Org2 (Đơn vị hành chính cấp xã)"
        description="Bạn có quyền xác thực các tài liệu do công dân gửi lên. Hãy xem xét cẩn thận trước khi xác thực hoặc từ chối."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

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
          <Button icon={<ReloadOutlined />} onClick={handleResetFilters}>
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
          <Form.Item name="uploadedBy" label="Người upload">
            <Input placeholder="Nhập tên người upload" />
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
            <Descriptions.Item label="Người upload">
              <Text code>{selectedDocument.uploadedBy}</Text>
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
          </Descriptions>
        )}
      </Modal>

      {/* Xác thực tài liệu Modal */}
      <Modal
        title="Xác thực Tài liệu"
        open={verificationModalVisible}
        onCancel={() => {
          setVerificationModalVisible(false);
          setVerifyingDocument(null);
          verificationForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        {verifyingDocument && (
          <div>
            <Alert
              message="Thông tin tài liệu cần xác thực"
              description={
                <div>
                  <p><strong>Mã tài liệu:</strong> {verifyingDocument.docID}</p>
                  <p><strong>Tiêu đề:</strong> {verifyingDocument.title}</p>
                  <p><strong>Loại:</strong> {getDocumentTypeText(verifyingDocument.docType)}</p>
                  <p><strong>Người upload:</strong> {verifyingDocument.uploadedBy}</p>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form
              form={verificationForm}
              layout="vertical"
              onFinish={handleVerifyDocument}
            >
              <Form.Item
                name="action"
                label="Hành động"
                rules={[{ required: true, message: 'Vui lòng chọn hành động!' }]}
              >
                <Select placeholder="Chọn hành động">
                  <Option value="VERIFIED">
                    <Space>
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      Xác thực
                    </Space>
                  </Option>
                  <Option value="REJECTED">
                    <Space>
                      <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                      Từ chối
                    </Space>
                  </Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="comments"
                label="Bình luận"
                rules={[{ required: true, message: 'Vui lòng nhập bình luận!' }]}
              >
                <TextArea 
                  rows={4} 
                  placeholder="Nhập bình luận về việc xác thực hoặc từ chối tài liệu"
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    Xác nhận
                  </Button>
                  <Button onClick={() => {
                    setVerificationModalVisible(false);
                    setVerifyingDocument(null);
                    verificationForm.resetFields();
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

export default DocumentVerificationPage;
