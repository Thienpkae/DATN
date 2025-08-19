import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Space, Tag, message, Drawer, Row, Col, Tabs, List, Typography, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, SearchOutlined, ReloadOutlined, HistoryOutlined, FileDoneOutlined, EyeOutlined, LinkOutlined, FileTextOutlined } from '@ant-design/icons';
import landService from '../../../services/landService';
import { LAND_USE_PURPOSES, LEGAL_STATUSES } from '../../../services/index';

const { Option } = Select;
const { TabPane } = Tabs;
const { Text } = Typography;

const defaultFilters = {
  keyword: '',
  location: undefined,
  landUsePurpose: undefined,
  legalStatus: undefined,
  minArea: undefined,
  maxArea: undefined,
};

const LandManagementPage = () => {
  const [loading, setLoading] = useState(false);
  const [lands, setLands] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [issueForm] = Form.useForm();

  const loadList = async () => {
    try {
      setLoading(true);
      // Prefer admin list if permitted
      let res = await landService.getAllLandParcels();
      let data = Array.isArray(res) ? res : (res?.data ?? []);
      // Fallback to keyword search when API returns empty
      if (!data || data.length === 0) {
        const sres = await landService.searchLandParcels({ keyword: '' });
        data = Array.isArray(sres) ? sres : (sres?.data ?? []);
      }
      setLands(data);
    } catch (e) {
      message.error(e.message || 'Không tải được danh sách thửa đất');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  const onSearch = async () => {
    try {
      setLoading(true);
      const params = {
        keyword: filters.keyword || '',
        location: filters.location,
        landUsePurpose: filters.landUsePurpose,
        legalStatus: filters.legalStatus,
        minArea: filters.minArea,
        maxArea: filters.maxArea,
      };
      const res = await landService.advancedSearch(params);
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
      const res = await landService.getLandParcelHistory(record.id || record.ID || record.landId);
      setHistory(Array.isArray(res) ? res : (res?.data ?? []));
    } catch (e) {
      setHistory([]);
    }
  };

  const onCreate = async () => {
    try {
      const values = await form.validateFields();
      const validation = landService.validateLandData({
        id: values.id,
        ownerID: values.ownerID,
        area: values.area,
        location: values.location,
        landUsePurpose: values.landUsePurpose,
        legalStatus: values.legalStatus,
      });
      if (!validation.isValid) {
        message.warning(validation.errors.join('\n'));
        return;
      }
      setLoading(true);
      await landService.createLandParcel({
        id: values.id,
        ownerID: values.ownerID,
        area: Number(values.area),
        location: values.location,
        landUsePurpose: values.landUsePurpose,
        legalStatus: values.legalStatus,
        certificateID: values.certificateID,
        legalInfo: values.legalInfo,
      });
      message.success('Tạo thửa đất thành công');
      setCreateOpen(false);
      form.resetFields();
      loadList();
    } catch (e) {
      message.error(e.message || 'Tạo thửa đất thất bại');
    } finally {
      setLoading(false);
    }
  };

  const onEdit = async () => {
    try {
      const values = await editForm.validateFields();
      setLoading(true);
      await landService.updateLandParcel(values.id, {
        area: Number(values.area),
        location: values.location,
        landUsePurpose: values.landUsePurpose,
        legalStatus: values.legalStatus,
        certificateID: values.certificateID,
        legalInfo: values.legalInfo,
      });
      message.success('Cập nhật thửa đất thành công');
      setEditOpen(false);
      loadList();
    } catch (e) {
      message.error(e.message || 'Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  const onIssue = async () => {
    try {
      const values = await issueForm.validateFields();
      setLoading(true);
      await landService.issueLandCertificate({
        certificateID: values.certificateID,
        landParcelID: values.landParcelID,
        ownerID: values.ownerID,
        legalInfo: values.legalInfo,
      });
      message.success('Cấp giấy chứng nhận thành công');
      setIssueOpen(false);
      loadList();
    } catch (e) {
      message.error(e.message || 'Cấp GCN thất bại');
    } finally {
      setLoading(false);
    }
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
      title: 'Chủ sở hữu',
      dataIndex: 'ownerId',
      key: 'ownerId',
      width: 140,
      ellipsis: {
        showTitle: false,
      },
      render: (text) => (
        <Tooltip placement="topLeft" title={text}>
          <Text>{text}</Text>
        </Tooltip>
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
      title: 'Mục đích SDĐ',
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
      render: v => (
        <Tag
          color={v === 'LUA' ? 'green' : v === 'HNK' ? 'blue' : v === 'CLN' ? 'orange' : 'default'}
          style={{ fontWeight: 500 }}
        >
          {v}
        </Tag>
      )
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
            icon={<EditOutlined />}
            onClick={() => {
              setSelected(record);
              editForm.setFieldsValue({
                id: record.id,
                area: record.area,
                location: record.location,
                landUsePurpose: record.landUsePurpose,
                legalStatus: record.legalStatus,
                certificateID: record.certificateId,
                legalInfo: record.legalInfo,
              });
              setEditOpen(true);
            }}
            style={{ borderRadius: '6px' }}
          >
            Sửa
          </Button>
        </Space>
      )
    }
  ]), [editForm]);

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <Card
        extra={
          <Space wrap>
            <Input
              placeholder="Tìm kiếm theo từ khóa..."
              allowClear
              prefix={<SearchOutlined />}
              style={{ width: 250, borderRadius: '8px' }}
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            />
            <Select
              placeholder="Mục đích SDĐ"
              allowClear
              style={{ width: 200, borderRadius: '8px' }}
              value={filters.landUsePurpose}
              onChange={(v) => setFilters({ ...filters, landUsePurpose: v })}
            >
              {Object.entries(LAND_USE_PURPOSES).map(([key, value]) => (
                <Option key={key} value={key}>{key} - {value}</Option>
              ))}
            </Select>
            <Select
              placeholder="Pháp lý"
              allowClear
              style={{ width: 180, borderRadius: '8px' }}
              value={filters.legalStatus}
              onChange={(v) => setFilters({ ...filters, legalStatus: v })}
            >
              {Object.entries(LEGAL_STATUSES).map(([key, value]) => (
                <Option key={key} value={key}>{key} - {value}</Option>
              ))}
            </Select>
            <Button
              icon={<SearchOutlined />}
              onClick={onSearch}
              style={{ borderRadius: '8px' }}
            >
              Tìm kiếm
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadList}
              style={{ borderRadius: '8px' }}
            >
              Tải lại
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateOpen(true)}
              style={{
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                border: 'none'
              }}
            >
              Tạo thửa đất
            </Button>
          </Space>
        }
        style={{
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: 'none'
        }}
      >
      <Table
        rowKey={(r) => r.id}
        loading={loading}
        dataSource={lands}
        columns={columns}
        scroll={{ x: 1200, y: 600 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} thửa đất`,
          style: { marginTop: '16px' }
        }}
        size="middle"
        style={{
          marginTop: '16px'
        }}
        rowClassName={(_, index) =>
          index % 2 === 0 ? 'table-row-light' : 'table-row-dark'
        }
      />

      <style jsx>{`
        .table-row-light {
          background-color: #fafafa;
        }
        .table-row-dark {
          background-color: #ffffff;
        }
        .ant-table-thead > tr > th {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          font-weight: 600;
          color: #1890ff;
          border-bottom: 2px solid #1890ff;
        }
        .ant-table-tbody > tr:hover > td {
          background-color: #e6f7ff !important;
        }
      `}</style>

      {/* Create Land Parcel */}
      <Modal title="Tạo thửa đất" open={createOpen} onOk={onCreate} onCancel={() => setCreateOpen(false)} confirmLoading={loading} width={720}>
        <Form layout="vertical" form={form}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="id" label="Mã thửa đất" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="ownerID" label="CCCD Chủ sở hữu" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="area" label="Diện tích (m²)" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="location" label="Vị trí" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="landUsePurpose" label="Mục đích SDĐ" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Select placeholder="Chọn">
                  {Object.entries(LAND_USE_PURPOSES).map(([key, value]) => (
                    <Option key={key} value={key}>{value}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="legalStatus" label="Trạng thái pháp lý" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Select placeholder="Chọn">
                  {Object.entries(LEGAL_STATUSES).map(([key, value]) => (
                    <Option key={key} value={key}>{value}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="certificateID" label="Mã GCN (tuỳ chọn)">
            <Input />
          </Form.Item>
          <Form.Item name="legalInfo" label="Thông tin pháp lý">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Land Parcel */}
      <Modal title="Cập nhật thửa đất" open={editOpen} onOk={onEdit} onCancel={() => setEditOpen(false)} confirmLoading={loading} width={720}>
        <Form layout="vertical" form={editForm}>
          <Form.Item name="id" label="Mã thửa đất">
            <Input disabled />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="area" label="Diện tích (m²)" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="location" label="Vị trí" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="landUsePurpose" label="Mục đích SDĐ" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Select placeholder="Chọn">
                  {Object.entries(LAND_USE_PURPOSES).map(([key, value]) => (
                    <Option key={key} value={key}>{value}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="legalStatus" label="Trạng thái pháp lý" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Select placeholder="Chọn">
                  {Object.entries(LEGAL_STATUSES).map(([key, value]) => (
                    <Option key={key} value={key}>{value}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="certificateID" label="Mã GCN (tuỳ chọn)">
            <Input />
          </Form.Item>
          <Form.Item name="legalInfo" label="Thông tin pháp lý">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Issue Certificate */}
      <Modal title="Cấp Giấy chứng nhận (GCN)" open={issueOpen} onOk={onIssue} onCancel={() => setIssueOpen(false)} confirmLoading={loading} width={640}>
        <Form layout="vertical" form={issueForm}>
          <Form.Item name="certificateID" label="Mã GCN" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="landParcelID" label="Mã thửa đất" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="ownerID" label="CCCD Chủ sở hữu" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="legalInfo" label="Thông tin pháp lý">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Enhanced Detail Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Chi tiết thửa đất: {selected?.id}</span>
            <Space>
              <Button
                type="primary"
                icon={<FileDoneOutlined />}
                onClick={() => {
                  if (selected) {
                    issueForm.setFieldsValue({
                      landParcelID: selected.id,
                      ownerID: selected.ownerId,
                    });
                    setIssueOpen(true);
                  }
                }}
              >
                Cấp GCN
              </Button>
            </Space>
          </div>
        }
        width={800}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      >
        {selected && (
          <Tabs defaultActiveKey="1">
            <TabPane tab="Thông tin cơ bản" key="1">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text strong>Mã thửa đất:</Text>
                  <br />
                  <Text copyable>{selected.id}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>Chủ sở hữu:</Text>
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
                  <Tag color={selected.legalStatus === 'LUA' ? 'green' : selected.legalStatus === 'HNK' ? 'blue' : 'default'}>
                    {selected.legalStatus}
                  </Tag>
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    {LEGAL_STATUSES[selected.legalStatus]}
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
              <div style={{ marginBottom: 16 }}>
                <Button
                  type="primary"
                  icon={<LinkOutlined />}
                  onClick={() => {
                    message.info('Chức năng liên kết tài liệu đang được phát triển');
                  }}
                >
                  Liên kết tài liệu
                </Button>
              </div>
              <List
                header={<div><strong>Danh sách tài liệu ({selected.documentIds?.length || 0})</strong></div>}
                bordered
                dataSource={selected.documentIds || []}
                renderItem={(docId, index) => (
                  <List.Item
                    actions={[
                      <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => {
                          message.info(`Xem tài liệu: ${docId}`);
                        }}
                      >
                        Xem
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<FileTextOutlined />}
                      title={`Tài liệu ${index + 1}`}
                      description={`ID: ${docId}`}
                    />
                  </List.Item>
                )}
                locale={{
                  emptyText: 'Chưa có tài liệu nào được liên kết'
                }}
              />
            </TabPane>

            <TabPane tab="Lịch sử thửa đất" key="3">
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
                  <List.Item>
                    <List.Item.Meta
                      title={`Thay đổi ${index + 1}`}
                      description={
                        <div>
                          <div><strong>Transaction ID:</strong> {item.txId || 'N/A'}</div>
                          <div><strong>Thời gian:</strong> {item.timestamp ? new Date(item.timestamp.seconds * 1000).toLocaleString('vi-VN') : 'N/A'}</div>
                          <div><strong>Trạng thái:</strong> {item.isDelete ? 'Xóa' : 'Cập nhật'}</div>
                          {item.land && (
                            <div style={{ marginTop: 8 }}>
                              <div><strong>Diện tích:</strong> {item.land.area} m²</div>
                              <div><strong>Mục đích SDĐ:</strong> {item.land.landUsePurpose}</div>
                              <div><strong>Pháp lý:</strong> {item.land.legalStatus}</div>
                            </div>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
                locale={{
                  emptyText: 'Chưa có lịch sử thay đổi'
                }}
              />
            </TabPane>
          </Tabs>
        )}
      </Drawer>
    </Card>
    </div>
  );
};

export default LandManagementPage;


