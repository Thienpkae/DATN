import React, { useState } from 'react';
import { Card, Input, Button, List, Typography, Space, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import logService from '../../services/logService';

const { Text } = Typography;

const LogsPage = () => {
  const [txId, setTxId] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const onSearch = async () => {
    if (!txId) {
      message.warning('Nhập Transaction ID');
      return;
    }
    try {
      setLoading(true);
      const res = await logService.searchByTxId(txId);
      const items = Array.isArray(res.logs) ? res.logs : (res ? [res] : []);
      setResults(items);
    } catch (e) {
      message.error(e.message || 'Tìm kiếm thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="Tìm kiếm Logs theo Transaction ID"
      extra={
        <Space>
          <Input
            placeholder="Nhập Transaction ID"
            value={txId}
            onChange={(e) => setTxId(e.target.value)}
            style={{ width: 360 }}
            allowClear
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={onSearch} loading={loading}>
            Tìm kiếm
          </Button>
        </Space>
      }
    >
      <List
        dataSource={results}
        renderItem={(item) => (
          <List.Item>
            <div style={{ width: '100%' }}>
              <div><Text strong>txID:</Text> {item.txID || item.txId || '-'}</div>
              <div><Text strong>status:</Text> {item.status || '-'}</div>
              <div><Text strong>message:</Text> {item.message || item.error || '-'}</div>
              {item.timestamp && (
                <div><Text strong>time:</Text> {new Date(item.timestamp).toLocaleString()}</div>
              )}
            </div>
          </List.Item>
        )}
      />
    </Card>
  );
};

export default LogsPage;


