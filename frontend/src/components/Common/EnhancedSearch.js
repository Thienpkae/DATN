import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Input, 
  Select, 
  DatePicker, 
  Button, 
  Space, 
  Row, 
  Col, 
  Tag, 
  Divider,
  Collapse,
  Checkbox,
  Slider,
  Typography,
  AutoComplete,
  Badge,
  Tooltip,
  message
} from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined, 
  ClearOutlined,
  SaveOutlined,
  HistoryOutlined,
  ExportOutlined,
  DownloadOutlined,
  SettingOutlined
} from '@ant-design/icons';
import debounce from 'lodash.debounce';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Panel } = Collapse;
const { Text } = Typography;

const EnhancedSearch = ({ 
  onSearch, 
  onFilter, 
  searchPlaceholder = "Search...",
  filters = {},
  savedSearches = [],
  onSaveSearch,
  onLoadSearch,
  onExport,
  user
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [searchOptions, setSearchOptions] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [advancedVisible, setAdvancedVisible] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((value, filters) => {
      if (onSearch) {
        onSearch(value, filters);
      }
    }, 300),
    [onSearch]
  );

  useEffect(() => {
    debouncedSearch(searchValue, activeFilters);
  }, [searchValue, activeFilters, debouncedSearch]);

  // Generate search suggestions based on user's organization
  const getSearchSuggestions = (value) => {
    if (!value) return [];
    
    const suggestions = {
      'Org1': [
        'Land Parcel LP001',
        'Certificate CRT001',
        'Transaction TX001',
        'Document DOC001',
        'Owner ID 123456789012',
        'Location: Hanoi',
        'Status: Approved',
        'Type: Residential'
      ],
      'Org2': [
        'Pending Transactions',
        'Document Verification',
        'Transaction Processing',
        'Status Updates',
        'Workflow Management',
        'Approval Queue',
        'Verification Status'
      ],
      'Org3': [
        'My Properties',
        'My Certificates',
        'Transfer Request',
        'Document Upload',
        'Transaction Status',
        'Land Ownership',
        'Certificate Status'
      ]
    };

    const orgSuggestions = suggestions[user?.org] || [];
    return orgSuggestions
      .filter(item => item.toLowerCase().includes(value.toLowerCase()))
      .map(item => ({ value: item, label: item }));
  };

  const handleSearchChange = (value) => {
    setSearchValue(value);
    setSearchOptions(getSearchSuggestions(value));
    
    // Add to search history
    if (value && !searchHistory.includes(value)) {
      setSearchHistory(prev => [value, ...prev.slice(0, 9)]); // Keep last 10 searches
    }
  };

  const handleFilterChange = (filterKey, value) => {
    const newFilters = { ...activeFilters };
    
    if (value === undefined || value === null || value === '' || 
        (Array.isArray(value) && value.length === 0)) {
      delete newFilters[filterKey];
    } else {
      newFilters[filterKey] = value;
    }
    
    setActiveFilters(newFilters);
    
    if (onFilter) {
      onFilter(newFilters);
    }
  };

  const clearAllFilters = () => {
    setSearchValue('');
    setActiveFilters({});
    if (onSearch) {
      onSearch('', {});
    }
  };

  const saveCurrentSearch = () => {
    if (!searchValue && Object.keys(activeFilters).length === 0) {
      message.warning('No search criteria to save');
      return;
    }
    
    const searchData = {
      query: searchValue,
      filters: activeFilters,
      timestamp: new Date().toISOString(),
      name: `Search ${new Date().toLocaleString()}`
    };
    
    if (onSaveSearch) {
      onSaveSearch(searchData);
      message.success('Search saved successfully');
    }
  };

  const loadSavedSearch = (search) => {
    setSearchValue(search.query || '');
    setActiveFilters(search.filters || {});
    if (onLoadSearch) {
      onLoadSearch(search);
    }
  };

  const getFilterCount = () => {
    return Object.keys(activeFilters).length + (searchValue ? 1 : 0);
  };

  const renderFilterTags = () => {
    const tags = [];
    
    if (searchValue) {
      tags.push(
        <Tag 
          key="search" 
          closable 
          onClose={() => setSearchValue('')}
          color="blue"
        >
          Search: {searchValue}
        </Tag>
      );
    }
    
    Object.entries(activeFilters).forEach(([key, value]) => {
      let displayValue = value;
      if (Array.isArray(value)) {
        displayValue = value.join(', ');
      } else if (typeof value === 'object' && value !== null) {
        displayValue = JSON.stringify(value);
      }
      
      tags.push(
        <Tag 
          key={key} 
          closable 
          onClose={() => handleFilterChange(key, undefined)}
          color="green"
        >
          {key}: {displayValue}
        </Tag>
      );
    });
    
    return tags;
  };

  const renderBasicFilters = () => {
    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Text strong>Status</Text>
          <Select
            mode="multiple"
            style={{ width: '100%', marginTop: '4px' }}
            placeholder="Select status"
            value={activeFilters.status}
            onChange={(value) => handleFilterChange('status', value)}
            allowClear
          >
            <Option value="pending">Pending</Option>
            <Option value="approved">Approved</Option>
            <Option value="rejected">Rejected</Option>
            <Option value="processing">Processing</Option>
            <Option value="completed">Completed</Option>
          </Select>
        </Col>
        
        <Col xs={24} sm={12} md={8}>
          <Text strong>Type</Text>
          <Select
            mode="multiple"
            style={{ width: '100%', marginTop: '4px' }}
            placeholder="Select type"
            value={activeFilters.type}
            onChange={(value) => handleFilterChange('type', value)}
            allowClear
          >
            <Option value="transfer">Transfer</Option>
            <Option value="split">Split</Option>
            <Option value="merge">Merge</Option>
            <Option value="change_purpose">Change Purpose</Option>
            <Option value="reissue">Reissue</Option>
          </Select>
        </Col>
        
        <Col xs={24} sm={12} md={8}>
          <Text strong>Date Range</Text>
          <RangePicker
            style={{ width: '100%', marginTop: '4px' }}
            value={activeFilters.dateRange}
            onChange={(dates) => handleFilterChange('dateRange', dates)}
          />
        </Col>
      </Row>
    );
  };

  const renderAdvancedFilters = () => {
    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Text strong>Land Use Purpose</Text>
          <Checkbox.Group
            style={{ width: '100%', marginTop: '4px' }}
            value={activeFilters.landUsePurpose}
            onChange={(value) => handleFilterChange('landUsePurpose', value)}
          >
            <Row>
              <Col span={24}><Checkbox value="residential">Residential</Checkbox></Col>
              <Col span={24}><Checkbox value="commercial">Commercial</Checkbox></Col>
              <Col span={24}><Checkbox value="agricultural">Agricultural</Checkbox></Col>
              <Col span={24}><Checkbox value="industrial">Industrial</Checkbox></Col>
            </Row>
          </Checkbox.Group>
        </Col>
        
        <Col xs={24} sm={12} md={8}>
          <Text strong>Area Range (m²)</Text>
          <Slider
            range
            style={{ marginTop: '8px' }}
            min={0}
            max={10000}
            value={activeFilters.areaRange || [0, 10000]}
            onChange={(value) => handleFilterChange('areaRange', value)}
            tooltip={{ formatter: (value) => `${value} m²` }}
          />
        </Col>
        
        <Col xs={24} sm={12} md={8}>
          <Text strong>Organization</Text>
          <Select
            mode="multiple"
            style={{ width: '100%', marginTop: '4px' }}
            placeholder="Select organization"
            value={activeFilters.organization}
            onChange={(value) => handleFilterChange('organization', value)}
            allowClear
          >
            <Option value="Org1">Land Authority</Option>
            <Option value="Org2">Government Officers</Option>
            <Option value="Org3">Citizens</Option>
          </Select>
        </Col>
      </Row>
    );
  };

  return (
    <Card className="professional-card" style={{ marginBottom: '16px' }}>
      {/* Main Search Bar */}
      <Row gutter={[16, 16]} align="middle">
        <Col flex="auto">
          <AutoComplete
            options={searchOptions}
            onSearch={handleSearchChange}
            onSelect={handleSearchChange}
            value={searchValue}
            style={{ width: '100%' }}
          >
            <Input.Search
              placeholder={searchPlaceholder}
              allowClear
              size="large"
              onSearch={handleSearchChange}
              style={{ borderRadius: '8px' }}
            />
          </AutoComplete>
        </Col>
        
        <Col>
          <Space>
            <Tooltip title="Advanced Filters">
              <Button
                icon={<FilterOutlined />}
                onClick={() => setAdvancedVisible(!advancedVisible)}
                type={getFilterCount() > 0 ? 'primary' : 'default'}
              >
                <Badge count={getFilterCount()} size="small">
                  Filters
                </Badge>
              </Button>
            </Tooltip>
            
            <Tooltip title="Clear All">
              <Button
                icon={<ClearOutlined />}
                onClick={clearAllFilters}
                disabled={getFilterCount() === 0}
              >
                Clear
              </Button>
            </Tooltip>
            
            <Tooltip title="Save Search">
              <Button
                icon={<SaveOutlined />}
                onClick={saveCurrentSearch}
                disabled={getFilterCount() === 0}
              >
                Save
              </Button>
            </Tooltip>
            
            {onExport && (
              <Tooltip title="Export Results">
                <Button
                  icon={<ExportOutlined />}
                  onClick={onExport}
                >
                  Export
                </Button>
              </Tooltip>
            )}
          </Space>
        </Col>
      </Row>

      {/* Active Filter Tags */}
      {getFilterCount() > 0 && (
        <div style={{ marginTop: '16px' }}>
          <Text type="secondary" style={{ marginRight: '8px' }}>Active filters:</Text>
          <Space wrap>
            {renderFilterTags()}
          </Space>
        </div>
      )}

      {/* Advanced Filters */}
      {advancedVisible && (
        <div style={{ marginTop: '16px' }}>
          <Divider orientation="left">
            <Space>
              <SettingOutlined />
              <span>Filter Options</span>
            </Space>
          </Divider>
          
          <Collapse ghost>
            <Panel header="Basic Filters" key="basic" forceRender>
              {renderBasicFilters()}
            </Panel>
            
            <Panel header="Advanced Filters" key="advanced" forceRender>
              {renderAdvancedFilters()}
            </Panel>
          </Collapse>
        </div>
      )}

      {/* Search History and Saved Searches */}
      {(searchHistory.length > 0 || savedSearches.length > 0) && (
        <div style={{ marginTop: '16px' }}>
          <Divider orientation="left">
            <Space>
              <HistoryOutlined />
              <span>Quick Access</span>
            </Space>
          </Divider>
          
          <Row gutter={[16, 16]}>
            {searchHistory.length > 0 && (
              <Col xs={24} md={12}>
                <Text strong>Recent Searches</Text>
                <div style={{ marginTop: '8px' }}>
                  <Space wrap>
                    {searchHistory.slice(0, 5).map((search, index) => (
                      <Tag
                        key={index}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSearchValue(search)}
                      >
                        {search}
                      </Tag>
                    ))}
                  </Space>
                </div>
              </Col>
            )}
            
            {savedSearches.length > 0 && (
              <Col xs={24} md={12}>
                <Text strong>Saved Searches</Text>
                <div style={{ marginTop: '8px' }}>
                  <Space wrap>
                    {savedSearches.slice(0, 5).map((search, index) => (
                      <Tag
                        key={index}
                        color="blue"
                        style={{ cursor: 'pointer' }}
                        onClick={() => loadSavedSearch(search)}
                      >
                        {search.name}
                      </Tag>
                    ))}
                  </Space>
                </div>
              </Col>
            )}
          </Row>
        </div>
      )}
    </Card>
  );
};

export default EnhancedSearch;