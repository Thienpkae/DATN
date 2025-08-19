import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Button, Input, Select, Space, Tag, message, Drawer, Row, Col } from 'antd';
import { SearchOutlined, ReloadOutlined, HistoryOutlined } from '@ant-design/icons';
import landService from '../../../services/landService';

const { Option } = Select;

const LandManagementPage = () => {
  const [loading, setLoading] = useState(false);
  const [lands, setLands] = useState([]);
  const [filters, setFilters] = useState({ keyword: '', landUsePurpose: undefined, legalStatus: undefined });
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);

  const loadList = async () => {
    try {
      setLoading(true);
      let res = await landService.getAllLandParcels();
      let data = Array.isArray(res) ? res : (res?.data ?? []);
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

  useEffect(() => { loadList(); }, []);

  const onSearch = async () => {
    try {
      setLoading(true);
      const res = await landService.advancedSearch({
        keyword: filters.keyword,
        landUsePurpose: filters.landUsePurpose,
        legalStatus: filters.legalStatus,
      });
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
        </Space>
      )
    }
  ]), []);

  return (
    <Card
      title="Xem thửa đất (Org2)"
      extra={
        <Space>
          <Input placeholder="Từ khóa" allowClear style={{ width: 220 }} value={filters.keyword} onChange={(e) => setFilters({ ...filters, keyword: e.target.value })} />
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
        </Space>
      }
    >
      <Table rowKey={(r) => r.id} loading={loading} dataSource={lands} columns={columns} scroll={{ x: 1200 }} pagination={{ pageSize: 10, showSizeChanger: true }} />

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


