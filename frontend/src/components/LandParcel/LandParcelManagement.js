import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Space, 
  Typography,
  Row,
  Col,
  DatePicker,
  InputNumber,
  Tag,
  Tooltip,
  Badge,
  Drawer,
  Descriptions,
  Timeline,
  App
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  EyeOutlined, 
  SearchOutlined,
  SyncOutlined,
  HistoryOutlined,
  FilterOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import landService from '../../services/landService';
import useBlockchainSync from '../../hooks/useBlockchainSync';
import usePagination from '../../hooks/usePagination';
import { filterLandParcels, sortLandParcels, getDefaultFilters, validateFilters } from '../../utils/filterUtils';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

// Constants từ chaincode
const LAND_USE_PURPOSES = [
  'Đất ở',
  'Đất nông nghiệp', 
  'Đất thương mại',
  'Đất công nghiệp',
  'Đất phi nông nghiệp'
];

const LEGAL_STATUSES = [
  'Có giấy chứng nhận',
  'Chưa có GCN',
  'Đang tranh chấp',
  'Đang thế chấp'
];

const LandParcelManagement = ({ user }) => {
  const { message } = App.useApp();
  const [landParcels, setLandParcels] = useState([]);
  const [filteredParcels, setFilteredParcels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingParcel, setEditingParcel] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewingParcel, setViewingParcel] = useState(false);
  const [historyDrawerVisible, setHistoryDrawerVisible] = useState(false);
  const [parcelHistory, setParcelHistory] = useState([]);
  const [searchForm] = Form.useForm();
  const [form] = Form.useForm();
  const [filters, setFilters] = useState(getDefaultFilters());
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Pagination hook
  const pagination = usePagination(filteredParcels.length, 10);

  // Blockchain sync hook
  const { isSyncing, lastSync, sync } = useBlockchainSync(fetchLandParcels, 60000); // Sync every minute

  useEffect(() => {
    fetchLandParcels();
  }, [user?.userId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Apply filters and sorting
    let filtered = filterLandParcels(landParcels, filters);
    filtered = sortLandParcels(filtered, sortBy, sortOrder);
    setFilteredParcels(filtered);
    
    // Reset pagination when filters change
    pagination.resetPagination();
  }, [landParcels, filters, sortBy, sortOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchLandParcels() {
    setLoading(true);
    try {
      let response;
      
      // Determine which API to call based on user organization
      if (user?.org === 'Org1' || user?.org === 'Org2') {
        // Admin users can see all land parcels
        response = await landService.getAllLandParcels();
      } else if (user?.userId) {
        // Regular users can only see their own land parcels
        response = await landService.getLandParcelsByOwner(user.userId);
      } else {
        response = [];
      }
      
      setLandParcels(response || []);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách thửa đất:', error);
      message.error(error.message || 'Lỗi khi lấy danh sách thửa đất');
    } finally {
      setLoading(false);
    }
  }

  const handleCreateParcel = async (values) => {
    try {
      // Validate data before submission
      const validation = landService.validateLandData(values);
      if (!validation.isValid) {
        message.error(validation.errors.join(', '));
        return;
      }

      await landService.createLandParcel(values);
      message.success('Thửa đất đã được tạo thành công');
      setModalVisible(false);
      form.resetFields();
      fetchLandParcels();
    } catch (error) {
      console.error('Lỗi khi tạo thửa đất:', error);
      message.error(error.message || 'Lỗi khi tạo thửa đất');
    }
  };

  const handleUpdateParcel = async (values) => {
    try {
      await landService.updateLandParcel(editingParcel.id, values);
      message.success('Thửa đất đã được cập nhật thành công');
      setModalVisible(false);
      setEditingParcel(null);
      form.resetFields();
      fetchLandParcels();
    } catch (error) {
      console.error('Lỗi khi cập nhật thửa đất:', error);
      message.error(error.message || 'Lỗi khi cập nhật thửa đất');
    }
  };

  const handleViewParcel = async (parcelId) => {
    try {
      const response = await landService.getLandParcel(parcelId);
      setViewingParcel(response);
      setViewModalVisible(true);
    } catch (error) {
      console.error('Lỗi khi xem thửa đất:', error);
      message.error(error.message || 'Lỗi khi lấy thông tin thửa đất');
    }
  };

  const handleViewHistory = async (parcelId) => {
    try {
      const response = await landService.getLandParcelHistory(parcelId);
      setParcelHistory(response || []);
      setHistoryDrawerVisible(true);
    } catch (error) {
      console.error('Lỗi khi xem lịch sử:', error);
      message.error(error.message || 'Lỗi khi lấy lịch sử thửa đất');
    }
  };

  const handleSearch = async (values) => {
    try {
      if (values.keyword) {
        // Use the search API endpoint
        const response = await landService.searchLandParcels({
          keyword: values.keyword,
          filters: JSON.stringify(filters)
        });
        setLandParcels(response || []);
      } else {
        // If no search value, fetch user's land parcels
        fetchLandParcels();
      }
    } catch (error) {
      console.error('Lỗi khi tìm kiếm:', error);
      message.error(error.message || 'Lỗi khi tìm kiếm');
    }
  };

  const handleAdvancedSearch = async (values) => {
    try {
      const searchParams = {
        keyword: values.keyword || '',
        location: values.location,
        landUsePurpose: values.landUsePurpose,
        legalStatus: values.legalStatus,
        minArea: values.minArea,
        maxArea: values.maxArea,
        ownerID: values.ownerID,
        hasCertificate: values.hasCertificate,
        dateFrom: values.dateRange?.[0]?.toISOString(),
        dateTo: values.dateRange?.[1]?.toISOString()
      };

      // Validate filters
      const validation = validateFilters(searchParams);
      if (!validation.isValid) {
        message.error(validation.errors.join(', '));
        return;
      }

      setFilters(searchParams);
      
      // Perform search
      const response = await landService.advancedSearch(searchParams);
      setLandParcels(response || []);
      
      message.success('Tìm kiếm nâng cao hoàn tất');
    } catch (error) {
      console.error('Lỗi khi tìm kiếm nâng cao:', error);
      message.error(error.message || 'Lỗi khi tìm kiếm nâng cao');
    }
  };

  const handleResetFilters = () => {
    setFilters(getDefaultFilters());
    searchForm.resetFields();
    fetchLandParcels();
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'Có giấy chứng nhận': 'green',
      'Chưa có GCN': 'orange',
      'Đang tranh chấp': 'red',
      'Đang thế chấp': 'purple'
    };
    return statusColors[status] || 'default';
  };

  const columns = [
    {
      title: 'Mã thửa đất',
      dataIndex: 'id',
      key: 'id',
      sorter: true,
      sortOrder: sortBy === 'id' ? sortOrder : null,
      onHeaderCell: () => ({
        onClick: () => handleSort('id')
      })
    },
    {
      title: 'CCCD chủ sở hữu',
      dataIndex: 'ownerID',
      key: 'ownerID',
      sorter: true,
      sortOrder: sortBy === 'ownerID' ? sortOrder : null,
      onHeaderCell: () => ({
        onClick: () => handleSort('ownerID')
      })
    },
    {
      title: 'Vị trí',
      dataIndex: 'location',
      key: 'location',
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <Text ellipsis>{text}</Text>
        </Tooltip>
      )
    },
    {
      title: 'Diện tích (m²)',
      dataIndex: 'area',
      key: 'area',
      sorter: true,
      sortOrder: sortBy === 'area' ? sortOrder : null,
      onHeaderCell: () => ({
        onClick: () => handleSort('area')
      }),
      render: (area) => `${area} m²`
    },
    {
      title: 'Mục đích sử dụng',
      dataIndex: 'landUsePurpose',
      key: 'landUsePurpose',
      filters: LAND_USE_PURPOSES.map(purpose => ({ text: purpose, value: purpose })),
      onFilter: (value, record) => record.landUsePurpose === value
    },
    {
      title: 'Trạng thái pháp lý',
      dataIndex: 'legalStatus',
      key: 'legalStatus',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status}
        </Tag>
      )
    },
    {
      title: 'Giấy chứng nhận',
      key: 'certificate',
      render: (_, record) => {
        if (record.certificateID) {
          return (
            <Tag color="green" icon={<CheckCircleOutlined />}>
              Đã cấp
            </Tag>
          );
        }
        return (
          <Tag color="default" icon={<CloseCircleOutlined />}>
            Chưa cấp
          </Tag>
        );
      }
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => handleViewParcel(record.id)}
            />
          </Tooltip>
          <Tooltip title="Xem lịch sử">
            <Button 
              icon={<HistoryOutlined />} 
              size="small"
              onClick={() => handleViewHistory(record.id)}
            />
          </Tooltip>
          {(user?.org === 'Org1') && (
            <Tooltip title="Chỉnh sửa">
              <Button 
                icon={<EditOutlined />} 
                size="small"
                onClick={() => {
                  setEditingParcel(record);
                  form.setFieldsValue(record);
                  setModalVisible(true);
                }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={2}>Quản lý thửa đất</Title>
        </Col>
        <Col>
          <Space>
            <Button 
              icon={<SyncOutlined />} 
              onClick={sync}
              loading={isSyncing}
            >
              Đồng bộ Blockchain
            </Button>
            {lastSync && (
              <Text type="secondary">
                Lần đồng bộ cuối: {lastSync.toLocaleTimeString('vi-VN')}
              </Text>
            )}
          </Space>
        </Col>
      </Row>
      
      {/* Search Section */}
      <Card title="Tìm kiếm thửa đất" style={{ marginBottom: 16 }}>
        <Form
          form={searchForm}
          layout="inline"
          onFinish={handleSearch}
        >
          <Form.Item name="keyword" label="Tìm kiếm">
            <Input 
              placeholder="Nhập từ khóa tìm kiếm" 
              style={{ width: 200 }}
              allowClear
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              Tìm kiếm
            </Button>
          </Form.Item>
          <Form.Item>
            <Button 
              icon={<FilterOutlined />}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              {showAdvancedFilters ? 'Ẩn' : 'Hiện'} Bộ lọc nâng cao
            </Button>
          </Form.Item>
          <Form.Item>
            <Button onClick={handleResetFilters}>
              Đặt lại
            </Button>
          </Form.Item>
        </Form>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <Form
            layout="vertical"
            onFinish={handleAdvancedSearch}
            style={{ marginTop: 16 }}
          >
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item name="location" label="Vị trí">
                  <Input placeholder="Nhập vị trí" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="landUsePurpose" label="Mục đích sử dụng">
                  <Select placeholder="Chọn mục đích" allowClear>
                    {LAND_USE_PURPOSES.map(purpose => (
                      <Option key={purpose} value={purpose}>
                        {purpose}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="legalStatus" label="Trạng thái pháp lý">
                  <Select placeholder="Chọn trạng thái" allowClear>
                    {LEGAL_STATUSES.map(status => (
                      <Option key={status} value={status}>
                        {status}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="ownerID" label="CCCD chủ sở hữu">
                  <Input placeholder="Nhập CCCD" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item name="minArea" label="Diện tích tối thiểu (m²)">
                  <InputNumber 
                    placeholder="Diện tích tối thiểu" 
                    min={0} 
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="maxArea" label="Diện tích tối đa (m²)">
                  <InputNumber 
                    placeholder="Diện tích tối đa" 
                    min={0} 
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="hasCertificate" label="Trạng thái GCN">
                  <Select placeholder="Chọn trạng thái" allowClear>
                    <Option value={true}>Có giấy chứng nhận</Option>
                    <Option value={false}>Chưa có GCN</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="dateRange" label="Khoảng thời gian">
                  <RangePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                Tìm kiếm nâng cao
              </Button>
            </Form.Item>
          </Form>
        )}
      </Card>

      {/* Main Content */}
      <Card 
        title={
          <Space>
            <span>Danh sách thửa đất</span>
            <Badge count={filteredParcels.length} showZero />
          </Space>
        }
        extra={
          <Space>
            {(user?.org === 'Org1') && (
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setModalVisible(true)}
              >
                Tạo thửa đất mới
              </Button>
            )}
            <Button 
              icon={<ReloadOutlined />}
              onClick={fetchLandParcels}
              loading={loading}
            >
              Làm mới
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredParcels}
          loading={loading}
          rowKey="id"
          pagination={pagination.tablePagination}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingParcel ? "Chỉnh sửa thửa đất" : "Tạo thửa đất mới"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingParcel(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={editingParcel ? handleUpdateParcel : handleCreateParcel}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="id"
                label="Mã thửa đất"
                rules={[{ required: true, message: 'Vui lòng nhập mã thửa đất!' }]}
              >
                <Input disabled={editingParcel} placeholder="Nhập mã thửa đất" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="ownerID"
                label="CCCD chủ sở hữu"
                rules={[
                  { required: true, message: 'Vui lòng nhập CCCD chủ sở hữu!' },
                  { pattern: /^\d{12}$/, message: 'CCCD phải có đúng 12 chữ số!' }
                ]}
              >
                <Input placeholder="Nhập CCCD chủ sở hữu" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="location"
            label="Vị trí"
            rules={[{ required: true, message: 'Vui lòng nhập vị trí!' }]}
          >
            <TextArea rows={3} placeholder="Nhập thông tin vị trí chi tiết" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="area"
                label="Diện tích (m²)"
                rules={[
                  { required: true, message: 'Vui lòng nhập diện tích!' },
                  { type: 'number', min: 0.01, message: 'Diện tích phải lớn hơn 0!' }
                ]}
              >
                <InputNumber 
                  placeholder="Nhập diện tích theo mét vuông" 
                  style={{ width: '100%' }}
                  min={0.01}
                  step={0.01}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="landUsePurpose"
                label="Mục đích sử dụng đất"
                rules={[{ required: true, message: 'Vui lòng chọn mục đích sử dụng!' }]}
              >
                <Select placeholder="Chọn mục đích sử dụng">
                  {LAND_USE_PURPOSES.map(purpose => (
                    <Option key={purpose} value={purpose}>
                      {purpose}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="legalStatus"
                label="Trạng thái pháp lý"
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái pháp lý!' }]}
              >
                <Select placeholder="Chọn trạng thái pháp lý">
                  {LEGAL_STATUSES.map(status => (
                    <Option key={status} value={status}>
                      {status}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="certificateID"
                label="Mã giấy chứng nhận (Tùy chọn)"
              >
                <Input placeholder="Nhập mã giấy chứng nhận nếu có" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="legalInfo"
            label="Thông tin pháp lý (Bắt buộc nếu có mã GCN)"
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const certificateID = getFieldValue('certificateID');
                  if (certificateID && !value) {
                    return Promise.reject(new Error('Thông tin pháp lý là bắt buộc khi có mã giấy chứng nhận!'));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <TextArea rows={3} placeholder="Nhập thông tin pháp lý, chi tiết quyền sở hữu, hạn chế, v.v." />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingParcel ? 'Cập nhật' : 'Tạo mới'}
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                setEditingParcel(null);
                form.resetFields();
              }}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Modal */}
      <Modal
        title="Chi tiết thửa đất"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="history" icon={<HistoryOutlined />} onClick={() => {
            setViewModalVisible(false);
            if (viewingParcel) {
              handleViewHistory(viewingParcel.id);
            }
          }}>
            Xem lịch sử
          </Button>,
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={800}
      >
        {viewingParcel && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Mã thửa đất" span={2}>
              {viewingParcel.id}
            </Descriptions.Item>
            <Descriptions.Item label="CCCD chủ sở hữu">
              {viewingParcel.ownerID}
            </Descriptions.Item>
            <Descriptions.Item label="Diện tích">
              {viewingParcel.area} m²
            </Descriptions.Item>
            <Descriptions.Item label="Vị trí" span={2}>
              {viewingParcel.location}
            </Descriptions.Item>
            <Descriptions.Item label="Mục đích sử dụng">
              {viewingParcel.landUsePurpose}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái pháp lý">
              <Tag color={getStatusColor(viewingParcel.legalStatus)}>
                {viewingParcel.legalStatus}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Mã giấy chứng nhận">
              {viewingParcel.certificateID || 'Chưa cấp'}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày cấp GCN">
              {viewingParcel.issueDate ? 
                new Date(viewingParcel.issueDate).toLocaleDateString('vi-VN') : 'N/A'
              }
            </Descriptions.Item>
            <Descriptions.Item label="Thông tin pháp lý" span={2}>
              {viewingParcel.legalInfo || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {viewingParcel.createdAt ? 
                new Date(viewingParcel.createdAt).toLocaleDateString('vi-VN') : 'N/A'
              }
            </Descriptions.Item>
            <Descriptions.Item label="Ngày cập nhật">
              {viewingParcel.updatedAt ? 
                new Date(viewingParcel.updatedAt).toLocaleDateString('vi-VN') : 'N/A'
              }
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* History Drawer */}
      <Drawer
        title="Lịch sử thửa đất"
        placement="right"
        width={600}
        open={historyDrawerVisible}
        onClose={() => setHistoryDrawerVisible(false)}
      >
        {parcelHistory.length > 0 ? (
          <Timeline>
            {parcelHistory.map((history, index) => (
              <Timeline.Item 
                key={index}
                color={history.action === 'CREATE' ? 'green' : 
                       history.action === 'UPDATE' ? 'blue' : 'default'}
              >
                <p><strong>{history.action}</strong></p>
                <p>{history.details}</p>
                <p><small>{new Date(history.timestamp).toLocaleString('vi-VN')}</small></p>
              </Timeline.Item>
            ))}
          </Timeline>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Text type="secondary">Không có lịch sử</Text>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default LandParcelManagement;
