import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  Row,
  Col,
  Collapse,
  Tag,
  Typography,
  Divider,
  Tooltip,
  Badge
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
  DownOutlined,
  UpOutlined,
  CalendarOutlined,
  TagOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;
const { Text } = Typography;

const SearchFilter = ({
  onSearch,
  onFilter,
  onClear,
  searchPlaceholder = 'Search...',
  filters = [],
  quickFilters = [],
  showAdvanced = true,
  showQuickFilters = true,
  defaultCollapsed = true,
  className = '',
  style = {}
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [activeFilters, setActiveFilters] = useState([]);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(!defaultCollapsed);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    
    // Debounced search
    const timeoutId = setTimeout(() => {
      if (onSearch) {
        onSearch(value);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  // Handle filter change
  const handleFilterChange = (filterKey, value) => {
    const newFilterValues = {
      ...filterValues,
      [filterKey]: value
    };
    
    setFilterValues(newFilterValues);
    
    // Update active filters
    const newActiveFilters = Object.entries(newFilterValues)
      .filter(([key, val]) => val !== undefined && val !== null && val !== '')
      .map(([key, val]) => {
        const filter = filters.find(f => f.key === key);
        return {
          key,
          label: filter?.label || key,
          value: val,
          displayValue: getDisplayValue(filter, val)
        };
      });
    
    setActiveFilters(newActiveFilters);
    
    if (onFilter) {
      onFilter(newFilterValues);
    }
  };

  // Get display value for filter
  const getDisplayValue = (filter, value) => {
    if (!filter) return value;
    
    switch (filter.type) {
      case 'select':
        const option = filter.options?.find(opt => opt.value === value);
        return option?.label || value;
      
      case 'dateRange':
        if (Array.isArray(value) && value.length === 2) {
          return `${moment(value[0]).format('MMM DD')} - ${moment(value[1]).format('MMM DD')}`;
        }
        return value;
      
      case 'date':
        return moment(value).format('MMM DD, YYYY');
      
      default:
        return value;
    }
  };

  // Handle quick filter click
  const handleQuickFilter = (quickFilter) => {
    const newFilterValues = {
      ...filterValues,
      ...quickFilter.filters
    };
    
    setFilterValues(newFilterValues);
    
    if (onFilter) {
      onFilter(newFilterValues);
    }
  };

  // Clear all filters
  const handleClearAll = () => {
    setSearchValue('');
    setFilterValues({});
    setActiveFilters([]);
    
    if (onClear) {
      onClear();
    }
    
    if (onSearch) {
      onSearch('');
    }
    
    if (onFilter) {
      onFilter({});
    }
  };

  // Remove specific filter
  const removeFilter = (filterKey) => {
    const newFilterValues = { ...filterValues };
    delete newFilterValues[filterKey];
    
    setFilterValues(newFilterValues);
    
    const newActiveFilters = activeFilters.filter(f => f.key !== filterKey);
    setActiveFilters(newActiveFilters);
    
    if (onFilter) {
      onFilter(newFilterValues);
    }
  };

  // Render filter input based on type
  const renderFilterInput = (filter) => {
    const { key, type, placeholder, options, ...props } = filter;
    
    switch (type) {
      case 'select':
        return (
          <Select
            placeholder={placeholder}
            value={filterValues[key]}
            onChange={(value) => handleFilterChange(key, value)}
            allowClear
            style={{ width: '100%' }}
            {...props}
          >
            {options?.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        );
      
      case 'dateRange':
        return (
          <RangePicker
            value={filterValues[key]}
            onChange={(dates) => handleFilterChange(key, dates)}
            style={{ width: '100%' }}
            {...props}
          />
        );
      
      case 'date':
        return (
          <DatePicker
            value={filterValues[key]}
            onChange={(date) => handleFilterChange(key, date)}
            style={{ width: '100%' }}
            {...props}
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            placeholder={placeholder}
            value={filterValues[key]}
            onChange={(e) => handleFilterChange(key, e.target.value)}
            {...props}
          />
        );
      
      default:
        return (
          <Input
            placeholder={placeholder}
            value={filterValues[key]}
            onChange={(e) => handleFilterChange(key, e.target.value)}
            {...props}
          />
        );
    }
  };

  // Count active filters
  const activeFilterCount = activeFilters.length;

  return (
    <Card 
      className={`search-filter-card ${className}`}
      style={style}
      bodyStyle={{ padding: '1.5rem' }}
    >
      {/* Main Search Bar */}
      <Row gutter={[16, 16]} align="middle">
        <Col flex="auto">
          <Input
            size="large"
            placeholder={searchPlaceholder}
            prefix={<SearchOutlined />}
            value={searchValue}
            onChange={handleSearchChange}
            allowClear
            style={{ borderRadius: '8px' }}
          />
        </Col>
        
        {showAdvanced && (
          <Col>
            <Button
              icon={<FilterOutlined />}
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              style={{ borderRadius: '8px' }}
            >
              <Badge count={activeFilterCount} size="small">
                <Space>
                  Filters
                  {isAdvancedOpen ? <UpOutlined /> : <DownOutlined />}
                </Space>
              </Badge>
            </Button>
          </Col>
        )}
        
        {(activeFilterCount > 0 || searchValue) && (
          <Col>
            <Button
              icon={<ClearOutlined />}
              onClick={handleClearAll}
              style={{ borderRadius: '8px' }}
            >
              Clear All
            </Button>
          </Col>
        )}
      </Row>

      {/* Quick Filters */}
      {showQuickFilters && quickFilters.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <Text type="secondary" style={{ fontSize: '12px', marginBottom: '8px', display: 'block' }}>
            Quick Filters:
          </Text>
          <Space wrap>
            {quickFilters.map((quickFilter, index) => (
              <Tag
                key={index}
                icon={quickFilter.icon}
                color={quickFilter.color}
                style={{ cursor: 'pointer', borderRadius: '12px' }}
                onClick={() => handleQuickFilter(quickFilter)}
              >
                {quickFilter.label}
              </Tag>
            ))}
          </Space>
        </div>
      )}

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <Text type="secondary" style={{ fontSize: '12px', marginBottom: '8px', display: 'block' }}>
            Active Filters:
          </Text>
          <Space wrap>
            {activeFilters.map((filter) => (
              <Tag
                key={filter.key}
                closable
                onClose={() => removeFilter(filter.key)}
                color="blue"
                style={{ borderRadius: '12px' }}
              >
                <Space size={4}>
                  <TagOutlined />
                  <span>{filter.label}: {filter.displayValue}</span>
                </Space>
              </Tag>
            ))}
          </Space>
        </div>
      )}

      {/* Advanced Filters */}
      {showAdvanced && (
        <Collapse 
          activeKey={isAdvancedOpen ? ['advanced'] : []} 
          onChange={() => setIsAdvancedOpen(!isAdvancedOpen)}
          ghost
          style={{ marginTop: '1rem' }}
        >
          <Panel 
            header={
              <Space>
                <FilterOutlined />
                <span>Advanced Filters</span>
                <Badge count={activeFilterCount} size="small" />
              </Space>
            } 
            key="advanced"
          >
            <Row gutter={[16, 16]}>
              {filters.map((filter) => (
                <Col 
                  key={filter.key} 
                  xs={24} 
                  sm={12} 
                  md={filter.span || 8}
                >
                  <div>
                    <Text strong style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>
                      {filter.label}
                      {filter.tooltip && (
                        <Tooltip title={filter.tooltip}>
                          <Button 
                            type="text" 
                            size="small" 
                            icon={<SearchOutlined />} 
                            style={{ marginLeft: '4px' }}
                          />
                        </Tooltip>
                      )}
                    </Text>
                    {renderFilterInput(filter)}
                  </div>
                </Col>
              ))}
            </Row>
          </Panel>
        </Collapse>
      )}
    </Card>
  );
};

// Pre-defined filter types
export const FilterTypes = {
  text: (key, label, placeholder) => ({
    key,
    label,
    type: 'text',
    placeholder
  }),

  select: (key, label, options, placeholder = 'Select...') => ({
    key,
    label,
    type: 'select',
    options,
    placeholder
  }),

  dateRange: (key, label) => ({
    key,
    label,
    type: 'dateRange'
  }),

  date: (key, label) => ({
    key,
    label,
    type: 'date'
  }),

  number: (key, label, placeholder) => ({
    key,
    label,
    type: 'number',
    placeholder
  })
};

// Pre-defined quick filters
export const QuickFilters = {
  today: {
    label: 'Today',
    icon: <CalendarOutlined />,
    color: 'blue',
    filters: {
      dateRange: [moment().startOf('day'), moment().endOf('day')]
    }
  },

  thisWeek: {
    label: 'This Week',
    icon: <CalendarOutlined />,
    color: 'green',
    filters: {
      dateRange: [moment().startOf('week'), moment().endOf('week')]
    }
  },

  thisMonth: {
    label: 'This Month',
    icon: <CalendarOutlined />,
    color: 'orange',
    filters: {
      dateRange: [moment().startOf('month'), moment().endOf('month')]
    }
  },

  active: {
    label: 'Active',
    icon: <TagOutlined />,
    color: 'green',
    filters: {
      status: 'active'
    }
  },

  pending: {
    label: 'Pending',
    icon: <TagOutlined />,
    color: 'orange',
    filters: {
      status: 'pending'
    }
  }
};

export default SearchFilter;