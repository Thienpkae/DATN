import React, { useState, useEffect } from 'react';
import { Modal, Button, Space, message, Typography, Row, Col, Tag, Divider } from 'antd';
import { DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import ipfsService from '../../services/ipfs';

const { Text } = Typography;

const OnlineDocumentViewer = ({ 
  visible, 
  onCancel, 
  document = null,
  ipfsHash = null 
}) => {
  const [loading, setLoading] = useState(false);
  const [viewerUrl, setViewerUrl] = useState('');
  const [fileType, setFileType] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible && (document?.ipfsHash || ipfsHash)) {
      const hash = document?.ipfsHash || ipfsHash;
      const docType = document?.fileType || '';
      
      setFileType(docType);
      setViewerUrl('');
      setError(null);
      
      // Tạo URL để xem file
      if (docType.includes('pdf')) {
        // Sử dụng PDF.js viewer hoặc Google Docs viewer
        const pdfUrl = ipfsService.getPinataFileUrl(hash);
        setViewerUrl(pdfUrl);
      } else if (docType.includes('image')) {
        // Hiển thị ảnh trực tiếp
        const imageUrl = ipfsService.getPinataFileUrl(hash);
        setViewerUrl(imageUrl);
      } else if (docType.includes('text') || docType.includes('json') || docType.includes('xml')) {
        // Hiển thị text trực tiếp
        const textUrl = ipfsService.getPinataFileUrl(hash);
        setViewerUrl(textUrl);
      } else {
        // Sử dụng Google Docs viewer cho các file khác
        const fileUrl = ipfsService.getPinataFileUrl(hash);
        const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
        setViewerUrl(googleDocsUrl);
      }
    }
  }, [visible, document, ipfsHash]);

  const handleDownload = async () => {
    const hash = document?.ipfsHash || ipfsHash;
    if (!hash) {
      message.error('Không có hash IPFS để tải file');
      return;
    }
    
    try {
      setLoading(true);
      const fileName = document?.title || document?.docID || 'document';
      await ipfsService.downloadFileFromIPFS(hash, fileName);
      message.success('Tải file thành công');
    } catch (e) {
      message.error(e.message || 'Tải file thất bại');
    } finally {
      setLoading(false);
    }
  };

  const renderViewer = () => {
    if (!viewerUrl) return null;

    if (fileType.includes('pdf')) {
      return (
        <iframe
          src={viewerUrl}
          style={{ width: '100%', height: '600px', border: 'none' }}
          title="PDF Viewer"
        />
      );
    } else if (fileType.includes('image')) {
      return (
        <div style={{ textAlign: 'center' }}>
          <img
            src={viewerUrl}
            alt="Document"
            style={{ maxWidth: '100%', maxHeight: '600px', objectFit: 'contain' }}
          />
        </div>
      );
    } else if (fileType.includes('text') || fileType.includes('json') || fileType.includes('xml')) {
      return (
        <iframe
          src={viewerUrl}
          style={{ width: '100%', height: '600px', border: 'none' }}
          title="Text Viewer"
        />
      );
    } else {
      return (
        <iframe
          src={viewerUrl}
          style={{ width: '100%', height: '600px', border: 'none' }}
          title="Document Viewer"
        />
      );
    }
  };

  const getFileTypeLabel = () => {
    if (fileType.includes('pdf')) return 'PDF Document';
    if (fileType.includes('image')) return 'Image File';
    if (fileType.includes('text')) return 'Text Document';
    if (fileType.includes('json')) return 'JSON File';
    if (fileType.includes('xml')) return 'XML File';
    if (fileType.includes('word') || fileType.includes('docx')) return 'Word Document';
    if (fileType.includes('excel') || fileType.includes('xlsx')) return 'Excel Document';
    return 'Document';
  };

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined />
          <span>Xem trực tuyến: {document?.title || document?.docID || 'Tài liệu'}</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Đóng
        </Button>,
        <Button 
          key="download" 
          type="primary" 
          icon={<DownloadOutlined />} 
          onClick={handleDownload}
          loading={loading}
        >
          Tải về
        </Button>
      ]}
      width="90%"
      style={{ top: 20 }}
      bodyStyle={{ padding: '16px', maxHeight: '80vh', overflow: 'auto' }}
    >
      {document && (
        <div style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>Loại file: </Text>
              <Tag color="blue">{getFileTypeLabel()}</Tag>
            </Col>
            <Col span={12}>
              <Text strong>Kích thước: </Text>
              <Text type="secondary">
                {document.fileSize ? `${(document.fileSize / 1024).toFixed(2)} KB` : 'N/A'}
              </Text>
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 8 }}>
            <Col span={24}>
              <Text strong>IPFS Hash: </Text>
              <Text type="secondary" style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                {document.ipfsHash}
              </Text>
            </Col>
          </Row>
          <Divider />
        </div>
      )}

      {error && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#ff4d4f' }}>
          <Text type="danger">{error}</Text>
        </div>
      )}

      {!error && (
        <div style={{ minHeight: '600px', position: 'relative' }}>
          {renderViewer()}
        </div>
      )}
    </Modal>
  );
};

export default OnlineDocumentViewer;
