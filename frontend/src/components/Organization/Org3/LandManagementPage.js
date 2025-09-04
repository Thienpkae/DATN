import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Button, Input, Space, Tag, message, Drawer, Row, Col, Tabs, List, Typography, Tooltip } from 'antd';
import { SearchOutlined, ReloadOutlined, HistoryOutlined, EyeOutlined, FileTextOutlined } from '@ant-design/icons';
import landService from '../../../services/landService';
import authService from '../../../services/auth';
import documentService from '../../../services/documentService';
import { LAND_USE_PURPOSES, LEGAL_STATUSES } from '../../../services/index';

// Import modal components for document viewing
import DocumentDetailModal from '../../Common/DocumentDetailModal';
import OnlineDocumentViewer from '../../Common/OnlineDocumentViewer';
const { TabPane } = Tabs;
const { Text } = Typography;

const LandManagementPage = () => {
  const [loading, setLoading] = useState(false);
  const [lands, setLands] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTabKey, setActiveTabKey] = useState('1');
  
  // Document states
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentDetailOpen, setDocumentDetailOpen] = useState(false);
  const [onlineViewerOpen, setOnlineViewerOpen] = useState(false);

  const loadMyLands = async () => {
    try {
      setLoading(true);
      const user = authService.getCurrentUser();
      if (!user?.userId) {
        message.error('Không xác định được người dùng');
        return;
      }
      let res = await landService.getLandParcelsByOwner(user.userId);
      const data = Array.isArray(res) ? res : (res?.data ?? []);
      setLands(data);
    } catch (e) {
      message.error(e.message || 'Không tải được thửa đất của tôi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMyLands(); }, []);

  const onSearch = async () => {
    try {
      setLoading(true);
      const filters = {}; // or your actual filters object
      const res = await landService.advancedSearch({ keyword, filters: JSON.stringify(filters) });
      const data = Array.isArray(res) ? res : (res?.data ?? []);
      setLands(data);
    } catch (e) {
      message.error(e.message || 'Tìm kiếm thất bại');
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (record) => {
    try {
      setSelected(record);
      setDetailOpen(true);
      setActiveTabKey('1');
      const res = await landService.getLandParcelHistory(record.id || record.ID || record.landId);
      setHistory(Array.isArray(res) ? res : (res?.data ?? []));
      
      // Load documents if available
      if (record.documentIds && record.documentIds.length > 0) {
        setDocuments([]);
        setDocumentsLoading(true);
        
        try {
          const docPromises = record.documentIds.map(async (docId) => {
            try {
              return await documentService.getDocument(docId);
            } catch (e) {
              console.warn(`Không thể load tài liệu ${docId}:`, e);
              return null;
            }
          });
          
          const docs = await Promise.all(docPromises);
          const validDocs = docs.filter(doc => doc !== null);
          setDocuments(validDocs);
          
          console.log('📄 Loaded documents:', validDocs.length, 'out of', record.documentIds.length);
        } catch (e) {
          console.warn('Không thể load danh sách tài liệu:', e);
          setDocuments([]);
        } finally {
          setDocumentsLoading(false);
        }
      } else {
        setDocuments([]);
        setDocumentsLoading(false);
      }
    } catch (e) {
      setHistory([]);
      setDocuments([]);
      setDocumentsLoading(false);
    }
  };

  const openHistory = async (record) => {
    try {
      setSelected(record);
      setDetailOpen(true);
      setActiveTabKey('3');
      const res = await landService.getLandParcelHistory(record.id || record.ID || record.landId);
      setHistory(Array.isArray(res) ? res : (res?.data ?? []));
    } catch (e) {
      setHistory([]);
    }
  };

  // Helper functions for document handling
  const onViewDocumentDetail = async (document) => {
    setSelectedDocument(document);
    setDocumentDetailOpen(true);
    console.log('🔗 Mở modal xem chi tiết tài liệu:', document.docID);
  };

  const getDocumentStatusColor = (doc) => {
    if (doc.status === 'VERIFIED') return 'green';
    if (doc.status === 'REJECTED') return 'red';
    return 'orange';
  };

  const getDocumentStatusText = (doc) => {
    if (doc.status === 'VERIFIED') return 'Đã thẩm định';
    if (doc.status === 'REJECTED') return 'Không hợp lệ';
    return 'Chờ xác thực';
  };

  const columns = useMemo(() => ([
    {
      title: 'Mã thửa đất',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      fixed: 'left',
      render: (text) => (
        <Text strong style={{ color: '#1890ff' }}>{text}</Text>
      )
    },
    {
      title: 'Vị trí',
      dataIndex: 'location',
      key: 'location',
      width: 280,
      ellipsis: {
        showTitle: false,
      },
      render: (text) => (
        <Tooltip placement="topLeft" title={text}>
          <Text type="secondary" style={{ fontSize: '13px' }}>{text}</Text>
        </Tooltip>
      )
    },
    {
      title: 'Mục đích sử dụng đất',
      dataIndex: 'landUsePurpose',
      key: 'landUsePurpose',
      width: 130,
      align: 'center',
      render: v => (
        <Tag color="blue" style={{ fontWeight: 500 }}>
          {v}
        </Tag>
      )
    },
    {
      title: 'Pháp lý',
      dataIndex: 'legalStatus',
      key: 'legalStatus',
      width: 100,
      align: 'center',
      render: v => {
        const displayValue = v || 'Chưa có';
        const color = v === 'LUA' ? 'green' :
          v === 'HNK' ? 'blue' :
          v === 'CLN' ? 'orange' :
          v === 'ONT*' ? 'purple' :
          !v ? 'default' : 'default';
        return (
          <Tag color={color} style={{ fontWeight: 500 }}>
            {displayValue}
          </Tag>
        );
      }
    },
    {
      title: 'Diện tích',
      dataIndex: 'area',
      key: 'area',
      width: 110,
      align: 'right',
      render: v => (
        <Text strong style={{ color: '#52c41a' }}>
          {v?.toLocaleString('vi-VN')} m²
        </Text>
      )
    },
    {
      title: 'Thao tác',
      key: 'actions',
      fixed: 'right',
      width: 200,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openDetail(record)}
            style={{ borderRadius: '6px' }}
          >
            Chi tiết
          </Button>
          <Button
            size="small"
            icon={<HistoryOutlined />}
            onClick={() => openHistory(record)}
            style={{ borderRadius: '6px' }}
          >
            Lịch sử
          </Button>
        </Space>
      )
    }
  ]), []);

  return (
    <Card
      title="Thửa đất của tôi (Org3)"
      extra={
        <Space>
          <Input placeholder="Từ khóa" allowClear style={{ width: 240 }} value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <Button icon={<SearchOutlined />} onClick={onSearch}>Tìm kiếm</Button>
          <Button icon={<ReloadOutlined />} onClick={loadMyLands}>Tải lại</Button>
        </Space>
      }
    >
      <Table
        rowKey={(r) => r.id}
        loading={loading}
        dataSource={lands}
        columns={columns}
        scroll={{ x: 900, y: 600 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} thửa đất`
        }}
        size="middle"
      />
      <Drawer
        title={`Chi tiết thửa đất: ${selected?.id}`}
        width={800}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      >
        {selected && (
          <Tabs activeKey={activeTabKey} onChange={(k) => setActiveTabKey(k)}>
            <TabPane tab="Thông tin cơ bản" key="1">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text strong>Mã thửa đất:</Text>
                  <br />
                  <Text copyable>{selected.id}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>chủ sử dụng:</Text>
                  <br />
                  <Text copyable>{selected.ownerId}</Text>
                </Col>
                <Col span={24}>
                  <Text strong>Vị trí:</Text>
                  <br />
                  <Text>{selected.location}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>Diện tích:</Text>
                  <br />
                  <Text>{selected.area} m²</Text>
                </Col>
                <Col span={12}>
                  <Text strong>Mục đích sử dụng đất:</Text>
                  <br />
                  <Tag color="blue">{selected.landUsePurpose}</Tag>
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    {LAND_USE_PURPOSES[selected.landUsePurpose]}
                  </Text>
                </Col>
                <Col span={12}>
                  <Text strong>Tình trạng pháp lý:</Text>
                  <br />
                  <Tag color={selected.legalStatus === 'LUA' ? 'green' :
                    selected.legalStatus === 'HNK' ? 'blue' :
                    selected.legalStatus === 'CLN' ? 'orange' :
                    selected.legalStatus === 'ONT*' ? 'purple' :
                    !selected.legalStatus ? 'default' : 'default'}>
                    {selected.legalStatus || 'Chưa có'}
                  </Tag>
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    {selected.legalStatus ? LEGAL_STATUSES[selected.legalStatus] : 'Chưa được cấp giấy chứng nhận'}
                  </Text>
                </Col>
                <Col span={12}>
                  <Text strong>Mã giấy chứng nhận:</Text>
                  <br />
                  <Text>{selected.certificateId || 'Chưa có'}</Text>
                </Col>
                <Col span={24}>
                  <Text strong>Thông tin pháp lý bổ sung:</Text>
                  <br />
                  <Text>{selected.legalInfo || 'Không có'}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>Ngày tạo:</Text>
                  <br />
                  <Text>{selected.createdAt ? new Date(selected.createdAt).toLocaleString('vi-VN') : 'N/A'}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>Ngày cập nhật:</Text>
                  <br />
                  <Text>{selected.updatedAt ? new Date(selected.updatedAt).toLocaleString('vi-VN') : 'N/A'}</Text>
                </Col>
              </Row>
            </TabPane>
            <TabPane tab="Tài liệu liên quan" key="2">
              <div style={{ marginTop: 16 }}>
                <strong>Tài liệu đính kèm:</strong>
                <div style={{ marginTop: 8 }}>
                  {documentsLoading ? (
                    // Loading skeleton
                    <div>
                      {[1, 2, 3].map((i) => (
                        <div key={i} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          marginBottom: '8px',
                          background: '#f8f9fa',
                          borderRadius: '6px',
                          border: '1px solid #e9ecef'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ width: '60%', height: '16px', background: '#e9ecef', borderRadius: '4px', marginBottom: '4px' }} />
                            <div style={{ width: '40%', height: '12px', background: '#e9ecef', borderRadius: '4px' }} />
                          </div>
                          <Space>
                            <div style={{ width: '60px', height: '24px', background: '#e9ecef', borderRadius: '4px' }} />
                          </Space>
                        </div>
                      ))}
                    </div>
                  ) : documents && documents.length > 0 ? (
                    // Hiển thị tài liệu - Org3 có thể xem tài liệu theo ID
                    <div>
                      <div style={{ marginBottom: '8px', color: '#666', fontSize: '12px' }}>
                        {documents.length} tài liệu
                      </div>
                      {documents.map((doc, index) => (
                        <div key={index} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          marginBottom: '8px',
                          background: '#f8f9fa',
                          borderRadius: '6px',
                          border: '1px solid #e9ecef'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '500', color: '#1890ff' }}>
                              {doc.title || doc.docID}
                            </div>
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                              {doc.type} • {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(2)} KB` : 'N/A'}
                            </div>
                          </div>
                          <Space>
                            <Tooltip title="Xem chi tiết tài liệu">
                              <Button 
                                type="text" 
                                icon={<FileTextOutlined />} 
                                size="small"
                                onClick={() => onViewDocumentDetail(doc)}
                                style={{ color: '#1890ff' }}
                              />
                            </Tooltip>
                            <Tag 
                              color={getDocumentStatusColor(doc)} 
                              size="small"
                              style={{ 
                                width: '120px',
                                minWidth: '120px',
                                textAlign: 'center',
                                fontSize: '12px',
                                fontWeight: '500',
                                padding: '4px 12px'
                              }}
                            >
                              {getDocumentStatusText(doc)}
                            </Tag>
                          </Space>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Không có tài liệu
                    <div style={{ 
                      padding: '16px', 
                      textAlign: 'center', 
                      color: '#999',
                      background: '#f8f9fa',
                      borderRadius: '6px',
                      border: '1px dashed #e9ecef'
                    }}>
                      <FileTextOutlined style={{ fontSize: '24px', marginBottom: '8px', color: '#ccc' }} />
                      <div>Chưa có tài liệu liên kết</div>
                    </div>
                  )}
                </div>
              </div>
            </TabPane>
            <TabPane tab="Lịch sử thửa đất" key="3">
              <div>
                <div style={{ marginBottom: 16 }}>
                  <Button
                    icon={<HistoryOutlined />}
                    onClick={() => {
                      openDetail(selected);
                    }}
                  >
                    Tải lại lịch sử
                  </Button>
                </div>
                <List
                  header={<div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <strong>Lịch sử thay đổi thửa đất ({history.length})</strong>
                    {history.length>0 && <Tag color="blue">{selected?.id}</Tag>}
                  </div>}
                  bordered
                  dataSource={history}
                  renderItem={(item, index) => (
                    <List.Item style={{ padding: '16px 20px', borderRadius: 8 }}>
                      <div style={{ width: '100%' }}>
                        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center', marginBottom: 12 }}>
                          <Text strong style={{ fontSize: 15 }}>{`Thay đổi ${history.length - index}`}</Text>
                          {item.isDelete ? <Tag color="red">Vô hiệu</Tag> : <Tag color="green">Hiệu lực</Tag>}
                        </div>
                        <div style={{ lineHeight: '1.8' }}>
                          <div style={{ marginBottom: 12 }}>
                            <Text strong>Transaction ID: </Text>
                            <Text type="secondary" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                              {item.txId || 'Chưa bổ sung'}
                            </Text>
                          </div>
                          <div style={{ marginBottom: 12 }}>
                            <Text strong>Timestamp: </Text>
                            <Text type="secondary">
                              {item.timestamp ? new Date(item.timestamp.seconds * 1000).toLocaleString('vi-VN') : 'Chưa bổ sung'}
                            </Text>
                          </div>
                          {item.land && (
                            <>
                              <div style={{ marginBottom: 12 }}>
                                <Text strong>Chủ sử dụng đất: </Text>
                                <Text type="secondary">{item.land.ownerId || 'Chưa bổ sung'}</Text>
                              </div>
                              
                              <div style={{ marginBottom: 12 }}>
                                <Text strong>Diện tích: </Text>
                                <Text type="secondary">{item.land.area || 'Chưa bổ sung'} m²</Text>
                              </div>
                              <div style={{ marginBottom: 12 }}>
                                <Text strong>Vị trí: </Text>
                                <Text type="secondary">{item.land.location || 'Chưa bổ sung'}</Text>
                              </div>
                              <div style={{ marginBottom: 12 }}>
                                <Text strong>Mục đích sử dụng: </Text>
                                {item.land.landUsePurpose ? (
                                  <Tag color="blue">{item.land.landUsePurpose}</Tag>
                                ) : (
                                  <Text type="secondary">Chưa bổ sung</Text>
                                )}
                              </div>
                              <div style={{ marginBottom: 12 }}>
                                <Text strong>Tình trạng pháp lý: </Text>
                                {item.land.legalStatus ? (
                                  <Tag color="purple">{item.land.legalStatus}</Tag>
                                ) : (
                                  <Text type="secondary">Chưa bổ sung</Text>
                                )}
                              </div>
                              <div style={{ marginBottom: 12 }}>
                                <Text strong>Giấy chứng nhận: </Text>
                                {item.land.certificateId ? (
                                  <Tag color="green">{item.land.certificateId}</Tag>
                                ) : (
                                  <Text type="secondary">Chưa bổ sung</Text>
                                )}
                              </div>
                              <div style={{ marginBottom: 12 }}>
                                <Text strong>Ngày cấp giấy chứng nhận: </Text>
                                <Text type="secondary">
                                  {item.land.issueDate && item.land.issueDate !== '0001-01-01T00:00:00Z'
                                    ? new Date(item.land.issueDate).toLocaleString('vi-VN')
                                    : 'Chưa bổ sung'}
                                </Text>
                              </div>
                              <div style={{ marginBottom: 12 }}>
                                <Text strong>Thông tin pháp lý: </Text>
                                <Text type="secondary">{item.land.legalInfo || 'Chưa bổ sung'}</Text>
                              </div>
                              <div style={{ marginBottom: 12 }}>
                                <Text strong>Ngày tạo thửa đất: </Text>
                                <Text type="secondary">
                                  {item.land.createdAt ? new Date(item.land.createdAt).toLocaleString('vi-VN') : 'Chưa bổ sung'}
                                </Text>
                              </div>
                              <div style={{ marginBottom: 12 }}>
                                <Text strong>Ngày cập nhật cuối: </Text>
                                <Text type="secondary">
                                  {item.land.updatedAt ? new Date(item.land.updatedAt).toLocaleString('vi-VN') : 'Chưa bổ sung'}
                                </Text>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </List.Item>
                  )}
                  locale={{ emptyText: 'Chưa có lịch sử thay đổi' }}
                />
              </div>
            </TabPane>
          </Tabs>
        )}
      </Drawer>

      {/* Document Detail Modal */}
      <DocumentDetailModal
        visible={documentDetailOpen}
        onClose={() => setDocumentDetailOpen(false)}
        document={selectedDocument}
        userRole="Org3"
      />

      {/* Online Document Viewer */}
      <OnlineDocumentViewer
        visible={onlineViewerOpen}
        onCancel={() => setOnlineViewerOpen(false)}
        document={selectedDocument}
      />
    </Card>
  );
};

export default LandManagementPage;
