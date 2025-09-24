import React, { useState, useEffect } from 'react';
import { Modal, Button, Space, message, Typography, Row, Col, Tag, Divider, Alert } from 'antd';
import { DownloadOutlined, FileTextOutlined, FileWordOutlined, FileExcelOutlined, FilePdfOutlined, FileImageOutlined } from '@ant-design/icons';
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
      
      console.log('🔍 Debug - Document info:', {
        docType,
        hash,
        document: document
      });
      
      // Reset state khi mở modal mới
      setFileType(docType);
      setViewerUrl('');
      setError(null);
      
      try {
        // Tạo URL để xem file
        if (docType.includes('pdf')) {
          console.log('📄 Detected PDF file');
          const pdfUrl = ipfsService.getInlineFileUrl(hash);
          setViewerUrl(pdfUrl);
        } else if (docType.includes('image')) {
          console.log('🖼️ Detected Image file');
          const imageUrl = ipfsService.getInlineFileUrl(hash);
          setViewerUrl(imageUrl);
        } else if (docType.includes('word') || docType.includes('docx') || docType.includes('doc') || 
                   docType.includes('openxmlformats-officedocument.wordprocessingml.document')) {
          console.log('📘 Detected Word file - Using Microsoft Office Online Viewer');
          const fileUrl = ipfsService.getInlineFileUrl(hash);
          const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
          console.log('🔗 Office Online URL:', officeUrl);
          setViewerUrl(officeUrl);
        } else if (docType.includes('excel') || docType.includes('xlsx') || docType.includes('xls') ||
                   docType.includes('openxmlformats-officedocument.spreadsheetml.sheet')) {
          console.log('📊 Detected Excel file - Using Microsoft Office Online Viewer');
          const fileUrl = ipfsService.getInlineFileUrl(hash);
          const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
          setViewerUrl(officeUrl);
        } else if (docType.includes('text') || docType.includes('json') || docType.includes('xml')) {
          console.log('📝 Detected Text/JSON/XML file');
          const textUrl = ipfsService.getInlineFileUrl(hash);
          setViewerUrl(textUrl);
        } else {
          console.log('❓ Unknown file type - Using Google Docs Viewer');
          const fileUrl = ipfsService.getInlineFileUrl(hash);
          const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
          setViewerUrl(googleDocsUrl);
        }
      } catch (error) {
        console.error('❌ Lỗi khi tạo URL preview:', error);
        setError('Không thể tạo URL để xem file');
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
      // Silent success to avoid intrusive toasts when previewing
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
    } else if (fileType.includes('word') || fileType.includes('docx') || fileType.includes('doc') ||
               fileType.includes('openxmlformats-officedocument.wordprocessingml.document')) {
      return (
        <div>
          <Alert
            message="File Word Document"
            description="Đang sử dụng Microsoft Office Online Viewer để xem file. Nếu không hiển thị được, vui lòng tải xuống file để xem."
            type="info"
            showIcon
            icon={<FileWordOutlined />}
            style={{ marginBottom: 16 }}
          />
          <iframe
            src={viewerUrl}
            style={{ width: '100%', height: '600px', border: 'none' }}
            title="Word Document Viewer"
            onError={() => setError('Không thể tải file Word. Vui lòng tải xuống để xem.')}
          />
        </div>
      );
    } else if (fileType.includes('excel') || fileType.includes('xlsx') || fileType.includes('xls') ||
               fileType.includes('openxmlformats-officedocument.spreadsheetml.sheet')) {
      return (
        <div>
          <Alert
            message="File Excel Spreadsheet"
            description="Đang sử dụng Microsoft Office Online Viewer để xem file. Nếu không hiển thị được, vui lòng tải xuống file để xem."
            type="info"
            showIcon
            icon={<FileExcelOutlined />}
            style={{ marginBottom: 16 }}
          />
          <iframe
            src={viewerUrl}
            style={{ width: '100%', height: '600px', border: 'none' }}
            title="Excel Document Viewer"
            onError={() => setError('Không thể tải file Excel. Vui lòng tải xuống để xem.')}
          />
        </div>
      );
    } else {
      return (
        <div>
          <Alert
            message="File không hỗ trợ preview trực tuyến"
            description="Loại file này không thể xem trước. Vui lòng tải xuống để xem nội dung."
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <iframe
            src={viewerUrl}
            style={{ width: '100%', height: '600px', border: 'none' }}
            title="Document Viewer"
            onError={() => setError('Không thể tải file. Vui lòng tải xuống để xem.')}
          />
        </div>
      );
    }
  };

  const getFileTypeLabel = () => {
    if (fileType.includes('pdf')) return 'PDF Document';
    if (fileType.includes('image')) return 'Image File';
    if (fileType.includes('word') || fileType.includes('docx') || fileType.includes('doc') ||
        fileType.includes('openxmlformats-officedocument.wordprocessingml.document')) return 'Word Document';
    if (fileType.includes('excel') || fileType.includes('xlsx') || fileType.includes('xls') ||
        fileType.includes('openxmlformats-officedocument.spreadsheetml.sheet')) return 'Excel Document';
    if (fileType.includes('text')) return 'Text Document';
    if (fileType.includes('json')) return 'JSON File';
    if (fileType.includes('xml')) return 'XML File';
    return 'Document';
  };

  const getFileTypeIcon = () => {
    if (fileType.includes('pdf')) return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
    if (fileType.includes('image')) return <FileImageOutlined style={{ color: '#52c41a' }} />;
    if (fileType.includes('word') || fileType.includes('docx') || fileType.includes('doc') ||
        fileType.includes('openxmlformats-officedocument.wordprocessingml.document')) 
      return <FileWordOutlined style={{ color: '#1890ff' }} />;
    if (fileType.includes('excel') || fileType.includes('xlsx') || fileType.includes('xls') ||
        fileType.includes('openxmlformats-officedocument.spreadsheetml.sheet')) 
      return <FileExcelOutlined style={{ color: '#52c41a' }} />;
    return <FileTextOutlined style={{ color: '#666' }} />;
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
      onCancel={() => {
        // Cleanup state khi đóng modal
        setViewerUrl('');
        setFileType('');
        setError(null);
        onCancel();
      }}
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
      styles={{ body: { padding: '16px', maxHeight: '80vh', overflow: 'auto' } }}
    >
      {document && (
        <div style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>Loại file: </Text>
              <Tag color="blue" icon={getFileTypeIcon()}>
                {getFileTypeLabel()}
              </Tag>
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
