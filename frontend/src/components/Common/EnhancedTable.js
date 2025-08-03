import React, { useState, useMemo } from 'react';
import { 
  Table, 
  Input, 
  Button, 
  Space, 
  Dropdown, 
  Menu, 
  Tag, 
  Tooltip, 
  Typography,
  Card,
  Row,
  Col,
  Statistic,
  Empty
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  ReloadOutlined,
  MoreOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ExportOutlined
} from '@ant-design/icons';

const { Text } = Typography;

const EnhancedTable = ({
  data = [],
  columns = [],
  loading = false,
  title,
  subtitle,
  searchable = true,
  filterable = true,
  exportable = true,
  refreshable = true,
  selectable = false,
  actions = [],
  onRefresh,
  onExport,
  onRowClick,
  pagination = true,
  size = 'middle',
  scroll,
  summary,
  className = '',
  ...props
}) => {
  const [searchText, setSearchText] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [filteredData, setFilteredData] = useState(data);

  // Enhanced search functionality
  const handleSearch = (value) => {
    setSearchText(value);
    if (!value) {
      setFilteredData(data);
      return;
    }

    const filtered = data.filter(item =>
      Object.values(item).some(val =>
        val && val.toString().toLowerCase().includes(value.toLowerCase())
      )
    );
    setFilteredData(filtered);
  };

  // Enhanced columns with search and filter
  const enhancedColumns = useMemo(() => {
    return columns.map(col => {
      if (col.searchable !== false && searchable) {
        return {
          ...col,
          filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
            <div style={{ padding: 8 }}>
              <Input
                placeholder={`Search ${col.title}`}
                value={selectedKeys[0]}
                onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                onPressEnter={() => confirm()}
                style={{ marginBottom: 8, display: 'block' }}
              />
              <Space>
                <Button
                  type="primary"
                  onClick={() => confirm()}
                  icon={<SearchOutlined />}
                  size="small"
                  style={{ width: 90 }}
                >
                  Search
                </Button>
                <Button
                  onClick={() => clearFilters()}
                  size="small"
                  style={{ width: 90 }}
                >
                  Reset
                </Button>
              </Space>
            </div>
          ),
          filterIcon: filtered => (
            <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
          ),
          onFilter: (value, record) =>
            record[col.dataIndex] && 
            record[col.dataIndex].toString().toLowerCase().includes(value.toLowerCase())
        };
      }
      return col;
    });
  }, [columns, searchable]);

  // Add actions column if actions are provided
  const finalColumns = useMemo(() => {
    if (actions.length > 0) {
      return [
        ...enhancedColumns,
        {
          title: 'Actions',
          key: 'actions',
          fixed: 'right',
          width: 120,
          render: (_, record) => (
            <Space size="small">
              {actions.map((action, index) => (
                <Tooltip key={index} title={action.tooltip || action.label}>
                  <Button
                    type={action.type || 'text'}
                    icon={action.icon}
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      action.onClick(record);
                    }}
                    danger={action.danger}
                    disabled={action.disabled && action.disabled(record)}
                  />
                </Tooltip>
              ))}
            </Space>
          )
        }
      ];
    }
    return enhancedColumns;
  }, [enhancedColumns, actions]);

  // Row selection configuration
  const rowSelection = selectable ? {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
    ],
  } : undefined;

  // Toolbar actions menu
  const toolbarMenu = (
    <Menu>
      {exportable && (
        <Menu.Item key="export" icon={<ExportOutlined />} onClick={onExport}>
          Export Data
        </Menu.Item>
      )}
      {refreshable && (
        <Menu.Item key="refresh" icon={<ReloadOutlined />} onClick={onRefresh}>
          Refresh Data
        </Menu.Item>
      )}
    </Menu>
  );

  // Table summary statistics
  const renderSummary = () => {
    if (!summary) return null;

    return (
      <Table.Summary fixed>
        <Table.Summary.Row>
          <Table.Summary.Cell index={0} colSpan={finalColumns.length}>
            <Row gutter={16}>
              {summary.map((stat, index) => (
                <Col key={index} span={6}>
                  <Statistic
                    title={stat.title}
                    value={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    valueStyle={{ fontSize: '14px' }}
                  />
                </Col>
              ))}
            </Row>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      </Table.Summary>
    );
  };

  return (
    <Card 
      className={`professional-table ${className}`}
      title={
        <div>
          {title && <Text strong style={{ fontSize: '18px' }}>{title}</Text>}
          {subtitle && <div><Text type="secondary">{subtitle}</Text></div>}
        </div>
      }
      extra={
        <Space>
          {searchable && (
            <Input
              placeholder="Search all columns..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: 250 }}
              allowClear
            />
          )}
          
          {(exportable || refreshable) && (
            <Dropdown overlay={toolbarMenu} trigger={['click']}>
              <Button icon={<MoreOutlined />} />
            </Dropdown>
          )}
        </Space>
      }
      bodyStyle={{ padding: 0 }}
    >
      {/* Selection Info */}
      {selectable && selectedRowKeys.length > 0 && (
        <div style={{ 
          padding: '12px 24px', 
          background: '#e6f7ff', 
          borderBottom: '1px solid #d9d9d9' 
        }}>
          <Space>
            <Text strong>{selectedRowKeys.length} items selected</Text>
            <Button 
              size="small" 
              onClick={() => setSelectedRowKeys([])}
            >
              Clear Selection
            </Button>
          </Space>
        </div>
      )}

      <Table
        columns={finalColumns}
        dataSource={searchText ? filteredData : data}
        loading={loading}
        rowSelection={rowSelection}
        onRow={onRowClick ? (record) => ({
          onClick: () => onRowClick(record),
          style: { cursor: 'pointer' }
        }) : undefined}
        pagination={pagination ? {
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} of ${total} items`,
          pageSizeOptions: ['10', '20', '50', '100'],
          defaultPageSize: 20
        } : false}
        size={size}
        scroll={scroll}
        summary={renderSummary}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No data available"
            />
          )
        }}
        {...props}
      />
    </Card>
  );
};

// Status tag renderer helper
export const StatusTag = ({ status, colorMap = {} }) => {
  const defaultColors = {
    active: 'green',
    inactive: 'red',
    pending: 'orange',
    approved: 'green',
    rejected: 'red',
    processing: 'blue',
    completed: 'purple',
    draft: 'default'
  };

  const color = colorMap[status] || defaultColors[status] || 'default';
  
  return (
    <Tag color={color} className="status-badge">
      {status?.toUpperCase()}
    </Tag>
  );
};

// Action buttons helper
export const TableActions = {
  view: (onClick, tooltip = 'View Details') => ({
    icon: <EyeOutlined />,
    onClick,
    tooltip,
    type: 'text'
  }),
  
  edit: (onClick, tooltip = 'Edit') => ({
    icon: <EditOutlined />,
    onClick,
    tooltip,
    type: 'text'
  }),
  
  delete: (onClick, tooltip = 'Delete', disabled) => ({
    icon: <DeleteOutlined />,
    onClick,
    tooltip,
    type: 'text',
    danger: true,
    disabled
  }),
  
  download: (onClick, tooltip = 'Download') => ({
    icon: <DownloadOutlined />,
    onClick,
    tooltip,
    type: 'text'
  })
};

export default EnhancedTable;