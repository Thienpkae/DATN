import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Descriptions, Tag, Button, Space, message, Divider, Alert } from 'antd';
import { DownloadOutlined, EyeOutlined, FileTextOutlined } from '@ant-design/icons';
import documentService from '../../services/documentService';
import ipfsService from '../../services/ipfs';
import IPFSViewer from './IPFSViewer';

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
      width={900}
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
        <>
          <Descriptions title="Thông tin cơ bản" bordered column={2} style={{ marginBottom: 24 }}>
            <Descriptions.Item label="Mã tài liệu" span={2}>
              <code style={{ fontSize: '14px', background: '#f5f5f5', padding: '4px 8px', borderRadius: '4px' }}>
                {document.docID || document.ID}
              </code>
            </Descriptions.Item>
            <Descriptions.Item label="Tiêu đề">
              {document.title || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Loại tài liệu">
              <Tag color="blue">{document.docType || document.Type}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái xác thực">
              <Tag color={document.verified ? 'green' : 'orange'}>
                {document.verified ? 'Đã xác thực' : 'Chờ xác thực'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Loại file">
              {document.fileType || document.FileType || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Kích thước">
              {document.fileSize || document.FileSize ? 
                `${((document.fileSize || document.FileSize) / 1024).toFixed(2)} KB` : 'N/A'
              }
            </Descriptions.Item>
            <Descriptions.Item label="Người upload">
              {document.uploadedBy || document.UploadedBy || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {document.createdAt ? new Date(document.createdAt).toLocaleString('vi-VN') : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Mô tả" span={2}>
              {document.displayDescription || document.description || 'Không có mô tả'}
            </Descriptions.Item>
          </Descriptions>

          {document.metadata && document.metadata.hasMetadata && (
            <>
              <Divider orientation="left">Metadata IPFS</Divider>
              <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
                <Descriptions.Item label="Metadata Hash">
                  <code style={{ fontSize: '12px', background: '#f5f5f5', padding: '4px 8px', borderRadius: '4px' }}>
                    {document.metadata.metadataHash}
                  </code>
                </Descriptions.Item>
                <Descriptions.Item label="Upload lúc">
                  {document.metadata.metadataUploadedAt ? 
                    new Date(document.metadata.metadataUploadedAt).toLocaleString('vi-VN') : 'N/A'
                  }
                </Descriptions.Item>
                <Descriptions.Item label="Upload bởi">
                  {document.metadata.metadataUploadedBy || 'N/A'}
                </Descriptions.Item>
              </Descriptions>
            </>
          )}

          {document.ipfsHash && (
            <>
              <Divider orientation="left">IPFS File</Divider>
              <IPFSViewer
                ipfsHash={document.ipfsHash}
                fileName={document.title || document.docID}
                fileType={document.fileType || document.FileType}
                fileSize={document.fileSize || document.FileSize}
                showDetails={true}
              />
            </>
          )}

          {document.verified && (
            <>
              <Divider orientation="left">Thông tin xác thực</Divider>
              <Descriptions bordered column={2}>
                <Descriptions.Item label="Người xác thực">
                  {document.verifiedBy || document.VerifiedBy || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Thời gian xác thực">
                  {document.verifiedAt ? new Date(document.verifiedAt).toLocaleString('vi-VN') : 'N/A'}
                </Descriptions.Item>
              </Descriptions>
            </>
          )}
        </>
      )}
    </Modal>
  );
};

export default DocumentViewer;
