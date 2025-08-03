import { useState } from 'react';
import {
  Card,
  Input,
  Button,
  Tag,
  Typography,
  Row,
  Col,
  Tabs,
  List,
  Avatar,
  Select,
  DatePicker,
  Collapse,
  message
} from 'antd';
import {
  SearchOutlined,
  FileTextOutlined,
  UserOutlined,
  HomeOutlined,
  SafetyOutlined,
  SwapOutlined,
  FilterOutlined,
  EyeOutlined
} from '@ant-design/icons';
import apiService from '../../../services/api';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

/**
 * Global Search Page for Org1
 * Search across all system entities
 */
const GlobalSearchPage = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({
    landParcels: [],
    certificates: [],
    transactions: [],
    documents: [],
    users: []
  });
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    dateRange: [],
    status: '',
    type: '',
    organization: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  const handleSearch = async (page = 1) => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const searchParams = {
        query: searchQuery,
        filters,
        page,
        pageSize: pagination.pageSize,
        category: activeTab === 'all' ? undefined : activeTab
      };

      const response = await apiService.globalSearch(searchParams);
      setSearchResults(response.results || {});
      setPagination({
        ...pagination,
        current: page,
        total: response.total || 0
      });
    } catch (error) {
      console.error('Search error:', error);
      message.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const renderLandParcelItem = (item) => (
    <List.Item
      actions={[
        <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetails('landParcel', item)}>
          View
        </Button>
      ]}
    >
      <List.Item.Meta
        avatar={<Avatar icon={<HomeOutlined />} style={{ backgroundColor: '#52c41a' }} />}
        title={<Text strong>Land Parcel: {item.id}</Text>}
        description={
          <div>
            <Text>Location: {item.location}</Text><br />
            <Text>Area: {item.area} m²</Text><br />
            <Text>Owner: {item.ownerName}</Text><br />
            <Tag color="blue">{item.status}</Tag>
          </div>
        }
      />
    </List.Item>
  );

  const renderCertificateItem = (item) => (
    <List.Item
      actions={[
        <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetails('certificate', item)}>
          View
        </Button>
      ]}
    >
      <List.Item.Meta
        avatar={<Avatar icon={<SafetyOutlined />} style={{ backgroundColor: '#1890ff' }} />}
        title={<Text strong>Certificate: {item.certificateID}</Text>}
        description={
          <div>
            <Text>Land Parcel: {item.landParcelID}</Text><br />
            <Text>Owner: {item.ownerName}</Text><br />
            <Text>Issue Date: {new Date(item.issueDate).toLocaleDateString('vi-VN')}</Text><br />
            <Tag color={item.status === 'Valid' ? 'green' : 'red'}>{item.status}</Tag>
          </div>
        }
      />
    </List.Item>
  );

  const renderTransactionItem = (item) => (
    <List.Item
      actions={[
        <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetails('transaction', item)}>
          View
        </Button>
      ]}
    >
      <List.Item.Meta
        avatar={<Avatar icon={<SwapOutlined />} style={{ backgroundColor: '#faad14' }} />}
        title={<Text strong>Transaction: {item.txID}</Text>}
        description={
          <div>
            <Text>Type: {item.type}</Text><br />
            <Text>Land Parcel: {item.landParcelID}</Text><br />
            <Text>Date: {new Date(item.createdAt).toLocaleDateString('vi-VN')}</Text><br />
            <Tag color={item.status === 'Approved' ? 'green' : item.status === 'Pending' ? 'orange' : 'red'}>
              {item.status}
            </Tag>
          </div>
        }
      />
    </List.Item>
  );

  const renderDocumentItem = (item) => (
    <List.Item
      actions={[
        <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetails('document', item)}>
          View
        </Button>
      ]}
    >
      <List.Item.Meta
        avatar={<Avatar icon={<FileTextOutlined />} style={{ backgroundColor: '#722ed1' }} />}
        title={<Text strong>Document: {item.docID}</Text>}
        description={
          <div>
            <Text>File: {item.fileName}</Text><br />
            <Text>Land Parcel: {item.landParcelID}</Text><br />
            <Text>Upload Date: {new Date(item.uploadDate).toLocaleDateString('vi-VN')}</Text><br />
            <Tag color={item.status === 'Verified' ? 'green' : 'orange'}>{item.status}</Tag>
          </div>
        }
      />
    </List.Item>
  );

  const renderUserItem = (item) => (
    <List.Item
      actions={[
        <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetails('user', item)}>
          View
        </Button>
      ]}
    >
      <List.Item.Meta
        avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#eb2f96' }} />}
        title={<Text strong>{item.name}</Text>}
        description={
          <div>
            <Text>CCCD: {item.cccd}</Text><br />
            <Text>Email: {item.email}</Text><br />
            <Text>Organization: {item.org}</Text><br />
            <Tag color={item.active ? 'green' : 'red'}>{item.active ? 'Active' : 'Inactive'}</Tag>
          </div>
        }
      />
    </List.Item>
  );

  const handleViewDetails = (type, item) => {
    // Navigate to detailed view based on type
    console.log('View details:', type, item);
  };

  const getTabCount = (category) => {
    return searchResults[category]?.length || 0;
  };

  const getTotalCount = () => {
    return Object.values(searchResults).reduce((total, items) => total + (items?.length || 0), 0);
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Global Search</Title>
      <Text type="secondary">
        Search across all system entities including land parcels, certificates, transactions, documents, and users
      </Text>

      {/* Search Input */}
      <Card style={{ marginTop: '24px', marginBottom: '24px' }}>
        <Row gutter={16}>
          <Col span={16}>
            <Input.Search
              placeholder="Search for land parcels, certificates, transactions, documents, or users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onSearch={() => handleSearch(1)}
              size="large"
              enterButton={
                <Button type="primary" icon={<SearchOutlined />} loading={loading}>
                  Search
                </Button>
              }
            />
          </Col>
          <Col span={8}>
            <Button
              icon={<FilterOutlined />}
              onClick={() => {/* Show filters modal */}}
            >
              Advanced Filters
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Advanced Filters */}
      <Collapse style={{ marginBottom: '24px' }}>
        <Panel header="Advanced Filters" key="filters">
          <Row gutter={16}>
            <Col span={6}>
              <Select
                placeholder="Status"
                value={filters.status}
                onChange={(value) => setFilters({...filters, status: value})}
                style={{ width: '100%' }}
                allowClear
              >
                <Select.Option value="active">Active</Select.Option>
                <Select.Option value="pending">Pending</Select.Option>
                <Select.Option value="approved">Approved</Select.Option>
                <Select.Option value="rejected">Rejected</Select.Option>
              </Select>
            </Col>
            <Col span={6}>
              <Select
                placeholder="Type"
                value={filters.type}
                onChange={(value) => setFilters({...filters, type: value})}
                style={{ width: '100%' }}
                allowClear
              >
                <Select.Option value="transfer">Transfer</Select.Option>
                <Select.Option value="split">Split</Select.Option>
                <Select.Option value="merge">Merge</Select.Option>
              </Select>
            </Col>
            <Col span={6}>
              <Select
                placeholder="Organization"
                value={filters.organization}
                onChange={(value) => setFilters({...filters, organization: value})}
                style={{ width: '100%' }}
                allowClear
              >
                <Select.Option value="Org1">Org1</Select.Option>
                <Select.Option value="Org2">Org2</Select.Option>
                <Select.Option value="Org3">Org3</Select.Option>
              </Select>
            </Col>
            <Col span={6}>
              <RangePicker
                value={filters.dateRange}
                onChange={(dates) => setFilters({...filters, dateRange: dates})}
                style={{ width: '100%' }}
              />
            </Col>
          </Row>
        </Panel>
      </Collapse>

      {/* Search Results */}
      {getTotalCount() > 0 && (
        <Card title={`Search Results (${getTotalCount()} found)`}>
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab={`All (${getTotalCount()})`} key="all">
              <div>
                {searchResults.landParcels?.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <Title level={4}>Land Parcels ({getTabCount('landParcels')})</Title>
                    <List
                      dataSource={searchResults.landParcels.slice(0, 3)}
                      renderItem={renderLandParcelItem}
                    />
                    {searchResults.landParcels.length > 3 && (
                      <Button type="link" onClick={() => setActiveTab('landParcels')}>
                        View all {searchResults.landParcels.length} land parcels
                      </Button>
                    )}
                  </div>
                )}

                {searchResults.certificates?.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <Title level={4}>Certificates ({getTabCount('certificates')})</Title>
                    <List
                      dataSource={searchResults.certificates.slice(0, 3)}
                      renderItem={renderCertificateItem}
                    />
                    {searchResults.certificates.length > 3 && (
                      <Button type="link" onClick={() => setActiveTab('certificates')}>
                        View all {searchResults.certificates.length} certificates
                      </Button>
                    )}
                  </div>
                )}

                {searchResults.transactions?.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <Title level={4}>Transactions ({getTabCount('transactions')})</Title>
                    <List
                      dataSource={searchResults.transactions.slice(0, 3)}
                      renderItem={renderTransactionItem}
                    />
                    {searchResults.transactions.length > 3 && (
                      <Button type="link" onClick={() => setActiveTab('transactions')}>
                        View all {searchResults.transactions.length} transactions
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </TabPane>

            <TabPane tab={`Land Parcels (${getTabCount('landParcels')})`} key="landParcels">
              <List
                dataSource={searchResults.landParcels}
                renderItem={renderLandParcelItem}
                pagination={{
                  current: pagination.current,
                  pageSize: pagination.pageSize,
                  total: searchResults.landParcels?.length || 0,
                  onChange: (page) => setPagination({...pagination, current: page})
                }}
              />
            </TabPane>

            <TabPane tab={`Certificates (${getTabCount('certificates')})`} key="certificates">
              <List
                dataSource={searchResults.certificates}
                renderItem={renderCertificateItem}
                pagination={{
                  current: pagination.current,
                  pageSize: pagination.pageSize,
                  total: searchResults.certificates?.length || 0,
                  onChange: (page) => setPagination({...pagination, current: page})
                }}
              />
            </TabPane>

            <TabPane tab={`Transactions (${getTabCount('transactions')})`} key="transactions">
              <List
                dataSource={searchResults.transactions}
                renderItem={renderTransactionItem}
                pagination={{
                  current: pagination.current,
                  pageSize: pagination.pageSize,
                  total: searchResults.transactions?.length || 0,
                  onChange: (page) => setPagination({...pagination, current: page})
                }}
              />
            </TabPane>

            <TabPane tab={`Documents (${getTabCount('documents')})`} key="documents">
              <List
                dataSource={searchResults.documents}
                renderItem={renderDocumentItem}
                pagination={{
                  current: pagination.current,
                  pageSize: pagination.pageSize,
                  total: searchResults.documents?.length || 0,
                  onChange: (page) => setPagination({...pagination, current: page})
                }}
              />
            </TabPane>

            <TabPane tab={`Users (${getTabCount('users')})`} key="users">
              <List
                dataSource={searchResults.users}
                renderItem={renderUserItem}
                pagination={{
                  current: pagination.current,
                  pageSize: pagination.pageSize,
                  total: searchResults.users?.length || 0,
                  onChange: (page) => setPagination({...pagination, current: page})
                }}
              />
            </TabPane>
          </Tabs>
        </Card>
      )}

      {/* No Results */}
      {searchQuery && getTotalCount() === 0 && !loading && (
        <Card>
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <SearchOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />
            <Title level={3} style={{ color: '#999' }}>No results found</Title>
            <Text type="secondary">
              Try adjusting your search terms or filters
            </Text>
          </div>
        </Card>
      )}
    </div>
  );
};

export default GlobalSearchPage;
