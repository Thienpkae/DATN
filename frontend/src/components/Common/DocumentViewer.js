import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Tag, Button, Space, message, Alert, Typography, Tabs, Row, Col, Divider } from 'antd';
import { DownloadOutlined, FileTextOutlined, EyeOutlined } from '@ant-design/icons';
import documentService from '../../services/documentService';
import ipfsService from '../../services/ipfs';

const { Text } = Typography;

const DocumentViewer = ({ 
  visible, 
  onCancel, 
  documentID,
  documentData = null 
}) => {
  const [loading, setLoading] = useState(false);
  const [document, setDocument] = useState(null);
  const [error, setError] = useState(null);

  const loadDocument = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const doc = await documentService.getDocument(documentID);
      const docWithMetadata = documentService.getDocumentWithMetadata(doc);
      setDocument(docWithMetadata);
    } catch (e) {
      setError(e.message || 'Không thể tải thông tin tài liệu');
    } finally {
      setLoading(false);
    }
  }, [documentID]);

  useEffect(() => {
    if (visible && documentID) {
      loadDocument();
    } else if (visible && documentData) {
      setDocument(documentService.getDocumentWithMetadata(documentData));
    }
  }, [visible, documentID, documentData, loadDocument]);

  const handleDownload = async () => {
    if (!document?.ipfsHash) {
      message.error('Không có hash IPFS để tải file');
      return;
    }
    
    try {
      await ipfsService.downloadFileFromIPFS(document.ipfsHash, document.title || document.docID);
      message.success('Tải file thành công');
    } catch (e) {
      message.error(e.message || 'Tải file thất bại');
    }
  };

  const handleViewOnline = () => {
    if (!document?.ipfsHash) {
      message.error('Không có hash IPFS để xem file');
      return;
    }
    
    const url = ipfsService.getPinataFileUrl(document.ipfsHash);
    window.open(url, '_blank');
  };



  if (!document && !loading) {
    return null;
  }

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined />
          <span>Chi tiết tài liệu: {document?.title || document?.docID || 'Đang tải...'}</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Đóng
        </Button>,
        document?.ipfsHash && (
          <Button key="view" icon={<EyeOutlined />} onClick={handleViewOnline}>
            Xem trực tuyến
          </Button>
        ),
        document?.ipfsHash && (
          <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={handleDownload}>
            Tải về
          </Button>
        )
      ]}
      width={800}
    >
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div>Đang tải thông tin tài liệu...</div>
        </div>
      )}

      {error && (
        <Alert
          message="Lỗi"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {document && (
        <Tabs
          defaultActiveKey="basic"
          items={[
            {
              key: 'basic',
              label: 'Thông tin cơ bản',
              children: (
                <div style={{ padding: '16px 0' }}>
                  <Row gutter={24}>
                    <Col span={24}>
                      <div style={{ marginBottom: 24, padding: '20px 0', borderBottom: '1px solid #f0f0f0' }}>
                        <Text strong style={{ fontSize: 18 }}>{document.title}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 13 }}>Mã: <code>{document.docID}</code></Text>
                      </div>
                    </Col>
                  </Row>
                  
                  <Row gutter={24}>
                    <Col span={12}>
                      <div style={{ marginBottom: 12 }}>
                        <Text strong>Loại tài liệu: </Text>
                        <Tag color="blue">{document.type}</Tag>
                      </div>
                      
                      <div style={{ marginBottom: 12 }}>
                        <Text strong>Trạng thái xác thực: </Text>
                        <Tag color={document.verified ? 'green' : 'orange'}>
                          {document.verified ? 'Đã xác thực' : 'Chờ xác thực'}
                        </Tag>
                      </div>
                      
                      <div style={{ marginBottom: 12 }}>
                        <Text strong>Loại file: </Text>
                        <Text type="secondary">{document.fileType}</Text>
                      </div>
                      
                      <div style={{ marginBottom: 12 }}>
                        <Text strong>Kích thước: </Text>
                        <Text type="secondary">{(document.fileSize / 1024).toFixed(2)} KB</Text>
                      </div>
                    </Col>
                    
                    <Col span={12}>
                      <div style={{ marginBottom: 12 }}>
                        <Text strong>Người upload: </Text>
                        <Text type="secondary">{document.uploadedBy}</Text>
                      </div>
                      
                      <div style={{ marginBottom: 12 }}>
                        <Text strong>Ngày tạo: </Text>
                        <Text type="secondary">{new Date(document.createdAt).toLocaleString('vi-VN')}</Text>
                      </div>
                      
                      <div style={{ marginBottom: 12 }}>
                        <Text strong>Ngày cập nhật: </Text>
                        <Text type="secondary">{new Date(document.updatedAt).toLocaleString('vi-VN')}</Text>
                      </div>
                      
                      <div style={{ marginBottom: 12 }}>
                        <Text strong>IPFS Hash: </Text>
                        <code style={{ fontSize: '12px', background: '#f5f5f5', padding: '4px 8px', borderRadius: '4px' }}>
                          {document.ipfsHash}
                        </code>
                      </div>
                    </Col>
                  </Row>
                  
                  <Divider />
                  
                  <div style={{ marginBottom: 12 }}>
                    <Text strong>Mô tả: </Text>
                    <Text type="secondary">
                      {(() => {
                        try {
                          const parsed = JSON.parse(document.description || '{}');
                          return parsed.originalDescription || 'Không có mô tả';
                        } catch {
                          return document.description || 'Không có mô tả';
                        }
                      })()}
                    </Text>
                  </div>
                </div>
              )
            },
            {
              key: 'metadata',
              label: 'Metadata IPFS',
              children: (
                <div style={{ padding: '16px 0' }}>
                  {(() => {
                    try {
                      const parsed = JSON.parse(document.description || '{}');
                      if (parsed.metadataHash) {
                        return (
                          <div>
                            <div style={{ marginBottom: 16 }}>
                              <Text strong>Metadata Hash: </Text>
                              <code style={{ fontSize: '12px', background: '#f5f5f5', padding: '4px 8px', borderRadius: '4px' }}>
                                {parsed.metadataHash}
                              </code>
                            </div>
                            
                            <div style={{ marginBottom: 16 }}>
                              <Text strong>Ngày upload metadata: </Text>
                              <Text type="secondary">
                                {parsed.metadataUploadedAt ? new Date(parsed.metadataUploadedAt).toLocaleString('vi-VN') : 'Không có'}
                              </Text>
                            </div>
                            
                            <div style={{ marginBottom: 16 }}>
                              <Text strong>Người upload metadata: </Text>
                              <Text type="secondary">{parsed.metadataUploadedBy || 'Không có'}</Text>
                            </div>
                          </div>
                        );
                      } else {
                        return <Text type="secondary">Không có metadata IPFS</Text>;
                      }
                    } catch {
                      return <Text type="secondary">Không có metadata IPFS</Text>;
                    }
                  })()}
                  
                  <Divider />
                  
                  <div style={{ marginBottom: 12 }}>
                    <Text strong>Hash file: </Text>
                    <code style={{ fontSize: '12px', background: '#f5f5f5', padding: '4px 8px', borderRadius: '4px' }}>
                      {document.ipfsHash}
                    </code>
                  </div>
                </div>
              )
            },
            {
              key: 'analysis',
              label: 'Phân tích tài liệu',
              children: (
                <div style={{ padding: '16px 0' }}>
                  <Text type="secondary">Chức năng phân tích tài liệu sẽ được phát triển sau.</Text>
                </div>
              )
            },
            {
              key: 'verification',
              label: 'Xác thực tài liệu',
              children: (
                <div style={{ padding: '16px 0' }}>
                  <div style={{ marginBottom: 12 }}>
                    <Text strong>Trạng thái: </Text>
                    <Tag color={document.verified ? 'green' : 'orange'}>
                      {document.verified ? 'Đã xác thực' : 'Chờ xác thực'}
                    </Tag>
                  </div>
                  
                  {document.verified && (
                    <>
                      <div style={{ marginBottom: 12 }}>
                        <Text strong>Người xác thực: </Text>
                        <Text type="secondary">{document.verifiedBy || 'Không có'}</Text>
                      </div>
                      
                      <div style={{ marginBottom: 12 }}>
                        <Text strong>Ngày xác thực: </Text>
                        <Text type="secondary">
                          {document.verifiedAt && document.verifiedAt !== '0001-01-01T00:00:00Z' 
                            ? new Date(document.verifiedAt).toLocaleString('vi-VN') 
                            : 'Không có'}
                        </Text>
                      </div>
                    </>
                  )}
                </div>
              )
            }
          ]}
        />
      )}

    </Modal>
  );
};

export default DocumentViewer;
