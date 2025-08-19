import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Button, Input, Space, Tag, message, Drawer, Row, Col } from 'antd';
import { SearchOutlined, ReloadOutlined, HistoryOutlined } from '@ant-design/icons';
import landService from '../../../services/landService';
import authService from '../../../services/auth';

const LandManagementPage = () => {
  const [loading, setLoading] = useState(false);
  const [lands, setLands] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);

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
      const res = await landService.advancedSearch({ keyword });
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
      title="Thửa đất của tôi (Org3)"
      extra={
        <Space>
          <Input placeholder="Từ khóa" allowClear style={{ width: 240 }} value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <Button icon={<SearchOutlined />} onClick={onSearch}>Tìm kiếm</Button>
          <Button icon={<ReloadOutlined />} onClick={loadMyLands}>Tải lại</Button>
        </Space>
      }
    >
      <Table rowKey={(r) => r.id} loading={loading} dataSource={lands} columns={columns} pagination={{ pageSize: 10, showSizeChanger: true }} />

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


