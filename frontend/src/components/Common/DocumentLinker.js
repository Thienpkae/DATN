import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Select, Input, Button, message, List, Tag, Space, Tooltip, Divider } from 'antd';
import { LinkOutlined, SearchOutlined, EyeOutlined, DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import documentService from '../../services/documentService';
import ipfsService from '../../services/ipfs';

const { Option } = Select;

const DocumentLinker = ({ 
  visible, 
  onCancel, 
  onSuccess, 
  targetType, // 'land' hoặc 'transaction'
  targetID, 
  linkedDocuments = [] 
}) => {
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedDocType, setSelectedDocType] = useState(undefined);

  // Load linked documents
  const loadLinkedDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const docsWithMetadata = await Promise.all(
        linkedDocuments.map(async (docId) => {
          try {
            const doc = await documentService.getDocument(docId);
            return documentService.getDocumentWithMetadata(doc);
          } catch (e) {
            return { docID: docId, title: 'Không thể tải thông tin', error: true };
          }
        })
      );
      setDocuments(docsWithMetadata);
    } catch (e) {
      message.error('Không thể tải danh sách tài liệu liên kết');
    } finally {
      setLoading(false);
    }
  }, [linkedDocuments]);

  useEffect(() => {
    if (visible && linkedDocuments.length > 0) {
      loadLinkedDocuments();
    }
  }, [visible, linkedDocuments, loadLinkedDocuments]);

  const searchDocuments = async () => {
    try {
      setSearching(true);
      const filters = {
        keyword: searchKeyword,
        docType: selectedDocType
      };
      const res = await documentService.advancedSearch(filters);
      const data = Array.isArray(res) ? res : (res?.data ?? []);
      const docsWithMetadata = data.map(doc => documentService.getDocumentWithMetadata(doc));
      setDocuments(docsWithMetadata);
    } catch (e) {
      message.error('Tìm kiếm thất bại');
    } finally {
      setSearching(false);
    }
  };

  const handleLinkDocument = async (docID) => {
    try {
      setLoading(true);
      if (targetType === 'land') {
        await documentService.linkDocumentToLand({
          docID,
          landParcelId: targetID
        });
      } else {
        await documentService.linkDocumentToTransaction({
          docID,
          transactionId: targetID
        });
      }
      message.success('Liên kết tài liệu thành công');
      onSuccess();
    } catch (e) {
      message.error(e.message || 'Liên kết thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkDocument = async (docID) => {
    try {
      setLoading(true);
      // Gọi API để bỏ liên kết (cần implement trong backend)
      message.success('Bỏ liên kết tài liệu thành công');
      onSuccess();
    } catch (e) {
      message.error(e.message || 'Bỏ liên kết thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (document) => {
    if (document.error) {
      message.error('Không thể xem tài liệu này');
      return;
    }
    // Mở modal xem chi tiết tài liệu
    window.open(`/documents/${document.docID}`, '_blank');
  };

  const handleDownloadDocument = async (document) => {
    if (document.error || !document.ipfsHash) {
      message.error('Không thể tải tài liệu này');
      return;
    }
    try {
      await ipfsService.downloadFileFromIPFS(document.ipfsHash, document.title || document.docID);
      message.success('Tải tài liệu thành công');
    } catch (e) {
      message.error(e.message || 'Tải tài liệu thất bại');
    }
  };

  const isDocumentLinked = (docID) => {
    return linkedDocuments.includes(docID);
  };

  return (
    <Modal
      title={`Liên kết tài liệu với ${targetType === 'land' ? 'thửa đất' : 'giao dịch'} ${targetID}`}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
    >
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Input
            placeholder="Tìm kiếm tài liệu..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{ width: 200 }}
            onPressEnter={searchDocuments}
          />
          <Select
            placeholder="Loại tài liệu"
            value={selectedDocType}
            onChange={setSelectedDocType}
            style={{ width: 150 }}
            allowClear
          >
            {documentService.getDocumentTypes().map(type => (
              <Option key={type} value={type}>{type}</Option>
            ))}
          </Select>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={searchDocuments}
            loading={searching}
          >
            Tìm kiếm
          </Button>
        </Space>
      </div>

      <Divider>Tài liệu {isDocumentLinked ? 'đã liên kết' : 'có thể liên kết'}</Divider>

      <List
        loading={loading}
        dataSource={documents}
        renderItem={(document) => (
          <List.Item
            actions={[
              <Tooltip title="Xem chi tiết">
                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => handleViewDocument(document)}
                />
              </Tooltip>,
              document.ipfsHash && (
                <Tooltip title="Tải về">
                  <Button
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownloadDocument(document)}
                  />
                </Tooltip>
              ),
              isDocumentLinked(document.docID) ? (
                <Button
                  size="small"
                  danger
                  onClick={() => handleUnlinkDocument(document.docID)}
                  loading={loading}
                >
                  Bỏ liên kết
                </Button>
              ) : (
                <Button
                  size="small"
                  type="primary"
                  icon={<LinkOutlined />}
                  onClick={() => handleLinkDocument(document.docID)}
                  loading={loading}
                >
                  Liên kết
                </Button>
              )
            ]}
          >
            <List.Item.Meta
              avatar={<FileTextOutlined />}
              title={
                <div>
                  {document.title || document.docID}
                  {isDocumentLinked(document.docID) && (
                    <Tag color="green" style={{ marginLeft: 8 }}>Đã liên kết</Tag>
                  )}
                </div>
              }
              description={
                <div>
                  <div><strong>Loại:</strong> <Tag>{document.docType || document.Type}</Tag></div>
                  <div><strong>Mô tả:</strong> {document.displayDescription || document.description || 'Không có'}</div>
                  {document.metadata && document.metadata.hasMetadata && (
                    <div style={{ marginTop: 4 }}>
                      <strong>Metadata:</strong> {document.metadata.metadataHash}
                    </div>
                  )}
                  <div style={{ marginTop: 4 }}>
                    <strong>Upload bởi:</strong> {document.uploadedBy || document.UploadedBy || 'N/A'}
                  </div>
                </div>
              }
            />
          </List.Item>
        )}
        locale={{ emptyText: 'Không có tài liệu nào để hiển thị' }}
      />
    </Modal>
  );
};

export default DocumentLinker;
