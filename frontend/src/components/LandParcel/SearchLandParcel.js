import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  InputNumber,
  DatePicker,
  Space,
  Typography,
  Alert,
  Tag,
  Divider,
  Collapse,
  AutoComplete,
  Tooltip,
  message
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
  InfoCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import landService from '../../services/landService';
import useSearchSuggestions from '../../hooks/useSearchSuggestions';
import { getDefaultFilters, validateFilters } from '../../utils/filterUtils';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

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

const SearchLandParcel = ({ onSearch, onReset, initialFilters = null }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(initialFilters || getDefaultFilters());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  // Search suggestions hook
  const searchSuggestions = useSearchSuggestions(
    async (keyword) => {
      try {
        const results = await landService.searchLandParcels({ keyword });
        return results?.slice(0, 10) || []; // Limit to 10 suggestions
      } catch (error) {
        console.error('Lỗi khi lấy gợi ý:', error);
        return [];
      }
    },
    500 // 500ms delay
  );

  useEffect(() => {
    // Load search history from localStorage
    const history = JSON.parse(localStorage.getItem('landSearchHistory') || '[]');
    setSearchHistory(history);
  }, []);

  const handleSearch = async (values) => {
    try {
      setLoading(true);

      // Validate filters
      const validation = validateFilters(values);
      if (!validation.isValid) {
        message.error(validation.errors.join(', '));
        return;
      }

      // Prepare search parameters
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

      // Update filters state
      setFilters(searchParams);

      // Save to search history
      const newHistory = [
        { ...searchParams, timestamp: new Date().toISOString() },
        ...searchHistory.filter(h => h.keyword !== searchParams.keyword)
      ].slice(0, 10); // Keep only last 10 searches
      
      setSearchHistory(newHistory);
      localStorage.setItem('landSearchHistory', JSON.stringify(newHistory));

      // Call parent search function
      if (onSearch) {
        await onSearch(searchParams);
      }

    } catch (error) {
      console.error('Lỗi khi tìm kiếm:', error);
      message.error(error.message || 'Lỗi khi tìm kiếm');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setFilters(getDefaultFilters());
    if (onReset) {
      onReset();
    }
  };

  const handleQuickSearch = (keyword) => {
    form.setFieldsValue({ keyword });
    handleSearch({ keyword });
  };

  const handleHistoryClick = (historyItem) => {
    form.setFieldsValue({
      keyword: historyItem.keyword,
      location: historyItem.location,
      landUsePurpose: historyItem.landUsePurpose,
      legalStatus: historyItem.legalStatus,
      minArea: historyItem.minArea,
      maxArea: historyItem.maxArea,
      ownerID: historyItem.ownerID,
      hasCertificate: historyItem.hasCertificate,
      dateFrom: historyItem.dateFrom ? new Date(historyItem.dateFrom) : undefined,
      dateTo: historyItem.dateTo ? new Date(historyItem.dateTo) : undefined
    });
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

  return (
    <Card 
      title={
        <Space>
          <SearchOutlined />
          <span>Tìm kiếm thửa đất</span>
        </Space>
      }
      extra={
        <Space>
          <Button 
            icon={<FilterOutlined />}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Ẩn' : 'Hiện'} Bộ lọc nâng cao
          </Button>
          <Button 
            icon={<ClearOutlined />}
            onClick={handleReset}
          >
            Đặt lại
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSearch}
        initialValues={filters}
      >
        {/* Basic Search */}
        <Row gutter={16}>
          <Col span={16}>
            <Form.Item name="keyword" label="Từ khóa tìm kiếm">
              <AutoComplete
                placeholder="Tìm kiếm theo ID, chủ sở hữu, vị trí, mục đích..."
                options={searchSuggestions.suggestions.map(item => ({
                  label: `${item.id} - ${item.location}`,
                  value: item.id
                }))}
                onSearch={searchSuggestions.handleSearchChange}
                onSelect={searchSuggestions.handleSuggestionSelect}
                allowClear
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label=" ">
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<SearchOutlined />}
                loading={loading}
                style={{ width: '100%' }}
              >
                Tìm kiếm
              </Button>
            </Form.Item>
          </Col>
        </Row>

        {/* Quick Search History */}
        {searchHistory.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">Tìm kiếm gần đây: </Text>
            <Space wrap>
              {searchHistory.slice(0, 5).map((item, index) => (
                <Tag
                  key={index}
                  color="blue"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleQuickSearch(item.keyword)}
                >
                  {item.keyword}
                </Tag>
              ))}
            </Space>
          </div>
        )}

        {/* Advanced Filters */}
        {showAdvanced && (
          <>
            <Divider>Bộ lọc nâng cao</Divider>
            
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="location" label="Vị trí">
                  <Input placeholder="Nhập vị trí" allowClear />
                </Form.Item>
              </Col>
              <Col span={8}>
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
              <Col span={8}>
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
            </Row>

            <Row gutter={16}>
              <Col span={6}>
                <Form.Item name="ownerID" label="CCCD chủ sở hữu">
                  <Input placeholder="Nhập CCCD" allowClear />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="minArea" label="Diện tích tối thiểu (m²)">
                  <InputNumber 
                    placeholder="Diện tích tối thiểu" 
                    min={0} 
                    style={{ width: '100%' }}
                    allowClear
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="maxArea" label="Diện tích tối đa (m²)">
                  <InputNumber 
                    placeholder="Diện tích tối đa" 
                    min={0} 
                    style={{ width: '100%' }}
                    allowClear
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
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="dateRange" label="Khoảng thời gian">
                  <RangePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label=" ">
                  <Space>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      icon={<SearchOutlined />}
                      loading={loading}
                    >
                      Tìm kiếm nâng cao
                    </Button>
                    <Button 
                      icon={<ReloadOutlined />}
                      onClick={() => form.resetFields()}
                    >
                      Xóa form
                    </Button>
                  </Space>
                </Form.Item>
              </Col>
            </Row>

            {/* Search Tips */}
            <Alert
              message="Mẹo tìm kiếm"
              description={
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  <li>Sử dụng tìm kiếm từ khóa để tìm thửa đất theo ID, chủ sở hữu hoặc vị trí</li>
                  <li>Kết hợp nhiều bộ lọc để có kết quả chính xác hơn</li>
                  <li>Bộ lọc diện tích chấp nhận giá trị thập phân (ví dụ: 100.5)</li>
                  <li>Khoảng thời gian giúp tìm thửa đất được tạo trong khoảng thời gian cụ thể</li>
                  <li>Trạng thái GCN giúp xác định thửa đất có/không có giấy chứng nhận</li>
                </ul>
              }
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />
          </>
        )}

        {/* Current Filters Display */}
        {Object.values(filters).some(value => value !== '' && value !== undefined && value !== null) && (
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">Bộ lọc hiện tại: </Text>
            <Space wrap>
              {Object.entries(filters).map(([key, value]) => {
                if (value && value !== '' && value !== undefined && value !== null) {
                  let displayValue = value;
                  let color = 'blue';

                  if (key === 'hasCertificate') {
                    displayValue = value ? 'Có giấy chứng nhận' : 'Chưa có GCN';
                    color = value ? 'green' : 'orange';
                  } else if (key === 'landUsePurpose') {
                    color = 'purple';
                  } else if (key === 'legalStatus') {
                    color = getStatusColor(value);
                  } else if (key === 'minArea' || key === 'maxArea') {
                    color = 'orange';
                  }

                  return (
                    <Tag 
                      key={key} 
                      color={color}
                      closable
                      onClose={() => {
                        form.setFieldsValue({ [key]: undefined });
                        const newFilters = { ...filters, [key]: undefined };
                        setFilters(newFilters);
                      }}
                    >
                      {key}: {displayValue}
                    </Tag>
                  );
                }
                return null;
              })}
            </Space>
          </div>
        )}
      </Form>
    </Card>
  );
};

export default SearchLandParcel;
