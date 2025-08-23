import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Space, Tag, Typography, message, List, Tooltip, Divider, Alert } from 'antd';
import { DownloadOutlined, EyeOutlined, ReloadOutlined, CopyOutlined } from '@ant-design/icons';
import ipfsService from '../../services/ipfs';

const { Text } = Typography;

const IPFSViewer = ({ 
  ipfsHash, 
  fileName = 'File', 
  fileType = 'Unknown',
  fileSize = 0,
  showDetails = false 
}) => {
  const [fileInfo, setFileInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadFileInfo = useCallback(async () => {
    if (!ipfsHash) return;
    
    try {
      setLoading(true);
      setError(null);
      const info = await ipfsService.getFileInfoFromIPFS(ipfsHash);
      setFileInfo(info);
    } catch (e) {
      setError(e.message || 'Không thể tải thông tin file');
    } finally {
      setLoading(false);
    }
  }, [ipfsHash]);

  useEffect(() => {
    if (showDetails) {
      loadFileInfo();
    }
  }, [showDetails, loadFileInfo]);

  const handleDownload = async () => {
    try {
      await ipfsService.downloadFileFromIPFS(ipfsHash, fileName);
      message.success('Tải file thành công');
    } catch (e) {
      message.error(e.message || 'Tải file thất bại');
    }
  };

  const handleViewOnline = () => {
    const url = ipfsService.getPinataFileUrl(ipfsHash);
    window.open(url, '_blank');
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(ipfsHash);
    message.success('Đã copy IPFS hash');
  };

  const validateHash = () => {
    return ipfsService.validateIPFSHash(ipfsHash);
  };



  if (!ipfsHash) {
    return (
      <Alert
        message="Không có IPFS hash"
        description="Vui lòng cung cấp IPFS hash để xem thông tin file"
        type="warning"
        showIcon
      />
    );
  }

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Text strong>IPFS Hash:</Text>
          <code style={{ 
            fontSize: '12px', 
            background: '#f5f5f5', 
            padding: '4px 8px', 
            borderRadius: '4px',
            maxWidth: '300px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'inline-block'
          }}>
            {ipfsHash}
          </code>
          <Tooltip title="Copy hash">
            <Button 
              size="small" 
              icon={<CopyOutlined />} 
              onClick={handleCopyHash}
            />
          </Tooltip>
        </Space>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Space>
          <Text strong>File:</Text>
          <Text>{fileName}</Text>
          <Tag color="blue">{fileType}</Tag>
          {fileSize > 0 && (
            <Text type="secondary">({(fileSize / 1024).toFixed(2)} KB)</Text>
          )}
        </Space>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button 
            type="primary" 
            icon={<DownloadOutlined />} 
            onClick={handleDownload}
          >
            Tải về
          </Button>
          <Button 
            icon={<EyeOutlined />} 
            onClick={handleViewOnline}
          >
            Xem trực tuyến
          </Button>
          {showDetails && (
            <Button 
              icon={<ReloadOutlined />} 
              onClick={loadFileInfo}
              loading={loading}
            >
              Làm mới
            </Button>
          )}
        </Space>
      </div>

      {!validateHash() && (
        <Alert
          message="IPFS Hash không hợp lệ"
          description="Hash phải bắt đầu bằng 'Qm' và có độ dài 46 ký tự"
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {error && (
        <Alert
          message="Lỗi khi tải thông tin file"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {fileInfo && (
        <>
          <Divider orientation="left">Thông tin file từ IPFS</Divider>
          <List size="small" bordered>
            <List.Item>
              <List.Item.Meta
                title="Content Type"
                description={fileInfo.contentType || 'Không xác định'}
              />
            </List.Item>
            <List.Item>
              <List.Item.Meta
                title="Kích thước"
                description={fileInfo.length ? `${(fileInfo.length / 1024).toFixed(2)} KB` : 'Không xác định'}
              />
            </List.Item>
            <List.Item>
              <List.Item.Meta
                title="Cập nhật lần cuối"
                description={fileInfo.lastModified ? new Date(fileInfo.lastModified).toLocaleString('vi-VN') : 'Không xác định'}
              />
            </List.Item>
          </List>
        </>
      )}


    </Card>
  );
};

export default IPFSViewer;
