import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Space, Tag, message, Drawer, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, SearchOutlined, ReloadOutlined, HistoryOutlined, FileDoneOutlined } from '@ant-design/icons';
import landService from '../../../services/landService';

const { Option } = Select;

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
    { title: 'Mã thửa đất', dataIndex: 'id', key: 'id' },
    { title: 'Chủ sở hữu', dataIndex: 'ownerId', key: 'ownerId' },
    { title: 'Vị trí', dataIndex: 'location', key: 'location' },
    { title: 'Mục đích SDĐ', dataIndex: 'landUsePurpose', key: 'landUsePurpose', render: v => <Tag>{v}</Tag> },
    { title: 'Pháp lý', dataIndex: 'legalStatus', key: 'legalStatus', render: v => <Tag color={v === 'Có giấy chứng nhận' ? 'green' : v === 'Đang tranh chấp' || v === 'Đang thế chấp' ? 'red' : 'default'}>{v}</Tag> },
    { title: 'Diện tích', dataIndex: 'area', key: 'area', render: v => `${v} m²` },
    {
      title: 'Thao tác', key: 'actions', fixed: 'right', render: (_, record) => (
        <Space>
          <Button icon={<HistoryOutlined />} onClick={() => openDetail(record)}>Lịch sử</Button>
          <Button icon={<EditOutlined />} onClick={() => {
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
          }}>Sửa</Button>
          <Button type="primary" icon={<FileDoneOutlined />} onClick={() => {
            issueForm.setFieldsValue({
              landParcelID: record.id,
              ownerID: record.ownerId,
            });
            setIssueOpen(true);
          }}>Cấp GCN</Button>
        </Space>
      )
    }
  ]), [editForm, issueForm]);

  return (
    <Card
      title="Quản lý thửa đất (Org1)"
      extra={
        <Space>
          <Input
            placeholder="Từ khóa"
            allowClear
            style={{ width: 220 }}
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
          />
          <Select placeholder="Mục đích SDĐ" allowClear style={{ width: 180 }} value={filters.landUsePurpose} onChange={(v) => setFilters({ ...filters, landUsePurpose: v })}>
            <Option value="Đất ở">Đất ở</Option>
            <Option value="Đất nông nghiệp">Đất nông nghiệp</Option>
            <Option value="Đất thương mại">Đất thương mại</Option>
            <Option value="Đất công nghiệp">Đất công nghiệp</Option>
            <Option value="Đất phi nông nghiệp">Đất phi nông nghiệp</Option>
          </Select>
          <Select placeholder="Trạng thái pháp lý" allowClear style={{ width: 180 }} value={filters.legalStatus} onChange={(v) => setFilters({ ...filters, legalStatus: v })}>
            <Option value="Có giấy chứng nhận">Có giấy chứng nhận</Option>
            <Option value="Chưa có GCN">Chưa có GCN</Option>
            <Option value="Đang tranh chấp">Đang tranh chấp</Option>
            <Option value="Đang thế chấp">Đang thế chấp</Option>
          </Select>
          <Button icon={<SearchOutlined />} onClick={onSearch}>Tìm kiếm</Button>
          <Button icon={<ReloadOutlined />} onClick={loadList}>Tải lại</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>Tạo thửa đất</Button>
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
                  <Option value="Đất ở">Đất ở</Option>
                  <Option value="Đất nông nghiệp">Đất nông nghiệp</Option>
                  <Option value="Đất thương mại">Đất thương mại</Option>
                  <Option value="Đất công nghiệp">Đất công nghiệp</Option>
                  <Option value="Đất phi nông nghiệp">Đất phi nông nghiệp</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="legalStatus" label="Trạng thái pháp lý" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Select placeholder="Chọn">
                  <Option value="Có giấy chứng nhận">Có giấy chứng nhận</Option>
                  <Option value="Chưa có GCN">Chưa có GCN</Option>
                  <Option value="Đang tranh chấp">Đang tranh chấp</Option>
                  <Option value="Đang thế chấp">Đang thế chấp</Option>
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
                  <Option value="Đất ở">Đất ở</Option>
                  <Option value="Đất nông nghiệp">Đất nông nghiệp</Option>
                  <Option value="Đất thương mại">Đất thương mại</Option>
                  <Option value="Đất công nghiệp">Đất công nghiệp</Option>
                  <Option value="Đất phi nông nghiệp">Đất phi nông nghiệp</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="legalStatus" label="Trạng thái pháp lý" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Select placeholder="Chọn">
                  <Option value="Có giấy chứng nhận">Có giấy chứng nhận</Option>
                  <Option value="Chưa có GCN">Chưa có GCN</Option>
                  <Option value="Đang tranh chấp">Đang tranh chấp</Option>
                  <Option value="Đang thế chấp">Đang thế chấp</Option>
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

      {/* Detail + History */}
      <Drawer title="Chi tiết thửa đất" width={720} open={detailOpen} onClose={() => setDetailOpen(false)}>
        {selected && (
          <div>
            <Row gutter={16}>
              <Col span={12}><strong>Mã:</strong> {selected.id}</Col>
              <Col span={12}><strong>Chủ sở hữu:</strong> {selected.ownerId}</Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 12 }}>
              <Col span={12}><strong>Vị trí:</strong> {selected.location}</Col>
              <Col span={12}><strong>Diện tích:</strong> {selected.area} m²</Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 12 }}>
              <Col span={12}><strong>Mục đích SDĐ:</strong> {selected.landUsePurpose}</Col>
              <Col span={12}><strong>Pháp lý:</strong> {selected.legalStatus}</Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 12 }}>
              <Col span={12}><strong>Mã GCN:</strong> {selected.certificateId || '-'}</Col>
              <Col span={12}><strong>Pháp lý thêm:</strong> {selected.legalInfo || '-'}</Col>
            </Row>
            <div style={{ marginTop: 16 }}>
              <strong>Lịch sử:</strong>
              <ul>
                {history.map((h, idx) => (
                  <li key={idx}>
                    <span>{h.txId || h.txID || h.transactionID || '-'} - {new Date(h.timestamp || h.time || Date.now()).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Drawer>
    </Card>
  );
};

export default LandManagementPage;


