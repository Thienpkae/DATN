import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Button, Space, message, Drawer, Row, Col, Tabs, List, Typography, Tooltip, Tag, Input, Select } from 'antd';
import { EyeOutlined, HistoryOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import landService from '../../../services/landService';
import { LAND_USE_PURPOSES, LEGAL_STATUSES } from '../../../services/index';
const { Text } = Typography;
const { Option } = Select;

const defaultFilters = {
  keyword: '',
  landUsePurpose: undefined,
  legalStatus: undefined,
};

const LandManagementPage = () => {
  const [loading, setLoading] = useState(false);
  const [lands, setLands] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [detailDefaultTab, setDetailDefaultTab] = useState("1");

  function sortLandIds(lands) {
    return [...lands].sort((a, b) => {
      const parse = (id) => {
        if (!id) return [0, 0];
        const parts = id.split('-');
        const map = parseInt(parts[0], 10) || 0;
        const plot = parseInt(parts[1], 10) || 0;
        return [map, plot];
      };
      const [mapA, plotA] = parse(a.id);
      const [mapB, plotB] = parse(b.id);
      if (mapA !== mapB) return mapA - mapB;
      return plotA - plotB;
    });
  }

  const loadList = React.useCallback(async () => {
    try {
      setLoading(true);
      let res = await landService.getAllLandParcels();
      let data = Array.isArray(res) ? res : (res?.data ?? []);
      if (!data || data.length === 0) {
        const sres = await landService.searchLandParcels({ keyword: '' });
        data = Array.isArray(sres) ? sres : (sres?.data ?? []);
      }
      setLands(sortLandIds(data));
    } catch (e) {
      message.error(e.message || 'Không tải được danh sách thửa đất');
    } finally {
      setLoading(false);
    }
  }, []);

  const onReload = React.useCallback(() => {
    setFilters(defaultFilters);
    loadList();
  }, [loadList]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const onSearch = async () => {
    try {
      setLoading(true);
      const params = {
        keyword: filters.keyword || '',
        landUsePurpose: filters.landUsePurpose,
        legalStatus: filters.legalStatus,
      };
      const res = await landService.advancedSearch(params);
      const data = Array.isArray(res) ? res : (res?.data ?? []);
      setLands(sortLandIds(data));
    } catch (e) {
      message.error(e.message || 'Tìm kiếm thất bại');
    } finally {
      setLoading(false);
    }
  };

  const openDetail = React.useCallback(async (record, defaultTab = "1") => {
    try {
      setSelected(record);
      setDetailOpen(true);
      const res = await landService.getLandParcelHistory(record.id || record.ID || record.landId);
      setHistory(Array.isArray(res) ? res : (res?.data ?? []));
      
      // Set default tab if specified
      if (defaultTab !== "1") {
        setDetailDefaultTab(defaultTab);
      } else {
        setDetailDefaultTab("1");
      }
    } catch (e) {
      setHistory([]);
    }
  }, []);

  const columns = useMemo(() => ([
    { title: 'Mã thửa đất', dataIndex: 'id', key: 'id', render: v => <code>{v}</code> },
    { title: 'Chủ sử dụng', dataIndex: 'ownerId', key: 'ownerId' },
    { title: 'Diện tích (m²)', dataIndex: 'area', key: 'area' },
    { title: 'Vị trí', dataIndex: 'location', key: 'location' },
    { title: 'Mục đích sử dụng', dataIndex: 'landUsePurpose', key: 'landUsePurpose', render: v => <Tag color="blue">{v}</Tag> },
    { title: 'Trạng thái pháp lý', dataIndex: 'legalStatus', key: 'legalStatus', render: v => {
      const displayValue = v || 'Chưa có';
      const color = v === 'LUA' ? 'green' :
        v === 'HNK' ? 'blue' :
        v === 'CLN' ? 'orange' :
        v === 'ONT*' ? 'purple' :
        !v ? 'default' : 'default';
      return <Tag color={color}>{displayValue}</Tag>;
    }},
    { title: 'Giấy chứng nhận', dataIndex: 'certificateId', key: 'certificateId', render: v => v ? <Tag color="green">{v}</Tag> : <Tag color="red">Chưa có</Tag> },
    {
      title: 'Thao tác', key: 'actions', fixed: 'right', render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button icon={<EyeOutlined />} onClick={() => openDetail(record)} />
          </Tooltip>
          <Tooltip title="Xem lịch sử">
            <Button icon={<HistoryOutlined />} onClick={() => openDetail(record, "3")} />
          </Tooltip>
        </Space>
      )
    }
  ]), [openDetail]);

  return (
    <div>
      <Card
        title="Quản lý thửa đất (Org2)"
        extra={
          <Space>
            <Input
              placeholder="Từ khóa"
              allowClear
              style={{ width: 200 }}
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            />
            <Select
              placeholder="Mục đích sử dụng"
              allowClear
              style={{ width: 150 }}
              value={filters.landUsePurpose}
              onChange={(v) => setFilters({ ...filters, landUsePurpose: v })}
            >
              {Object.entries(LAND_USE_PURPOSES).map(([key, value]) => (
                <Option key={key} value={key}>{key} - {value}</Option>
              ))}
            </Select>
            <Select
              placeholder="Trạng thái pháp lý"
              allowClear
              style={{ width: 150 }}
              value={filters.legalStatus}
              onChange={(v) => setFilters({ ...filters, legalStatus: v })}
            >
              {Object.entries(LEGAL_STATUSES).map(([key, value]) => (
                <Option key={key} value={key}>{key} - {value}</Option>
              ))}
            </Select>
            <Button icon={<SearchOutlined />} onClick={onSearch}>Tìm kiếm</Button>
            <Button icon={<ReloadOutlined />} onClick={onReload}>Tải lại</Button>
          </Space>
        }
      >
        <Table
          rowKey={(r) => r.id}
          loading={loading}
          dataSource={lands}
          columns={columns}
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
        <Drawer title={`Chi tiết thửa đất: ${selected?.id}`} width={800} open={detailOpen} onClose={() => setDetailOpen(false)}>
          {selected && (
            <Tabs
              key={selected.id + detailDefaultTab}
              defaultActiveKey={detailDefaultTab}
              items={[
                {
                  key: "1",
                  label: "Thông tin cơ bản",
                  children: (
                    <div style={{ padding: '16px 0' }}>
                      <Row gutter={[24, 16]}>
                        <Col span={12}>
                          <div style={{ marginBottom: 16 }}>
                            <Text strong>Mã thửa đất:</Text>
                            <br />
                            <Text type="secondary" style={{ marginTop: 4, display: 'block' }}>{selected.id}</Text>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ marginBottom: 16 }}>
                            <Text strong>CCCD Chủ sử dụng:</Text>
                            <br />
                            <Text type="secondary" style={{ marginTop: 4, display: 'block' }}>{selected.ownerId}</Text>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ marginBottom: 16 }}>
                            <Text strong>Diện tích:</Text>
                            <br />
                            <Text type="secondary" style={{ marginTop: 4, display: 'block' }}>{selected.area} m²</Text>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ marginBottom: 16 }}>
                            <Text strong>Vị trí:</Text>
                            <br />
                            <Text type="secondary" style={{ marginTop: 4, display: 'block' }}>{selected.location}</Text>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ marginBottom: 16 }}>
                            <Text strong>Mục đích sử dụng đất:</Text>
                            <br />
                            <div style={{ marginTop: 4 }}>
                              <Tag color="blue">{selected.landUsePurpose}</Tag>
                              <Text type="secondary" style={{ marginLeft: 8 }}>
                                {LAND_USE_PURPOSES[selected.landUsePurpose]}
                              </Text>
                            </div>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ marginBottom: 16 }}>
                            <Text strong>Tình trạng pháp lý:</Text>
                            <br />
                            <div style={{ marginTop: 4 }}>
                              <Tag color={selected.legalStatus === 'LUA' ? 'green' : selected.legalStatus === 'HNK' ? 'blue' : 'default'}>
                                {selected.legalStatus}
                              </Tag>
                              <Text type="secondary" style={{ marginLeft: 8 }}>
                                {LEGAL_STATUSES[selected.legalStatus]}
                              </Text>
                            </div>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ marginBottom: 16 }}>
                            <Text strong>Mã giấy chứng nhận:</Text>
                            <br />
                            <div style={{ marginTop: 4 }}>
                              {selected.certificateId ? (
                                <Tag color="green">{selected.certificateId}</Tag>
                              ) : (
                                <Text type="secondary">Chưa có</Text>
                              )}
                            </div>
                          </div>
                        </Col>
                        <Col span={24}>
                          <div style={{ marginBottom: 16 }}>
                            <Text strong>Thông tin pháp lý bổ sung:</Text>
                            <br />
                            <Text type="secondary" style={{ marginTop: 4, display: 'block' }}>{selected.legalInfo || 'Không có'}</Text>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ marginBottom: 16 }}>
                            <Text strong>Ngày tạo:</Text>
                            <br />
                            <Text type="secondary" style={{ marginTop: 4, display: 'block' }}>{selected.createdAt ? new Date(selected.createdAt).toLocaleString('vi-VN') : 'N/A'}</Text>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ marginBottom: 16 }}>
                            <Text strong>Ngày cập nhật:</Text>
                            <br />
                            <Text type="secondary" style={{ marginTop: 4, display: 'block' }}>{selected.updatedAt ? new Date(selected.updatedAt).toLocaleString('vi-VN') : 'N/A'}</Text>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  )
                },
                {
                  key: "3",
                  label: "Lịch sử thửa đất",
                  children: (
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
                        header={<div><strong>Lịch sử thay đổi thửa đất ({history.length})</strong></div>}
                        bordered
                        dataSource={history}
                        renderItem={(item, index) => (
                          <List.Item style={{ padding: '20px 24px' }}>
                            <div style={{ width: '100%' }}>
                              <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '2px solid #f0f0f0' }}>
                                <Text strong style={{ fontSize: 16 }}>{`Thay đổi ${history.length - index}`}</Text>
                                <div style={{ float: 'right' }}>
                                  {item.isDelete ? <Tag color="red">Vô hiệu</Tag> : <Tag color="green">Hiệu lực</Tag>}
                                </div>
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
                  )
                }
              ]}
            />
          )}
        </Drawer>
      </Card>
    </div>
  );
};

export default LandManagementPage;