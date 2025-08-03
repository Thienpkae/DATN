import React, { useState, useCallback } from 'react';
import { 
  Upload, 
  Button, 
  Card, 
  Progress, 
  List, 
  Typography, 
  Space, 
  Tag, 
  Modal, 
  Image, 
  message,
  Tooltip,
  Popconfirm,
  Row,
  Col,
  Alert,
  Descriptions,
  Badge,
  Divider
} from 'antd';
import { 
  InboxOutlined, 
  UploadOutlined, 
  FileTextOutlined, 
  EyeOutlined, 
  DownloadOutlined, 
  DeleteOutlined,
  CloudUploadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileOutlined,
  LinkOutlined,
  SecurityScanOutlined
} from '@ant-design/icons';
import { documentAPI, ipfsAPI } from '../../services/api';

const { Dragger } = Upload;
const { Title, Text, Paragraph } = Typography;

const EnhancedFileUpload = ({ 
  landParcelId, 
  transactionId, 
  onUploadComplete,
  maxFiles = 10,
  maxFileSize = 50, // MB
  acceptedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt'],
  showIPFSInfo = true,
  user
}) => {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [ipfsHashes, setIpfsHashes] = useState({});

  // Get file icon based on file type
  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    const iconMap = {
      'pdf': <FilePdfOutlined style={{ color: '#ff4d4f' }} />,
      'doc': <FileWordOutlined style={{ color: '#1890ff' }} />,
      'docx': <FileWordOutlined style={{ color: '#1890ff' }} />,
      'xls': <FileExcelOutlined style={{ color: '#52c41a' }} />,
      'xlsx': <FileExcelOutlined style={{ color: '#52c41a' }} />,
      'jpg': <FileImageOutlined style={{ color: '#fa8c16' }} />,
      'jpeg': <FileImageOutlined style={{ color: '#fa8c16' }} />,
      'png': <FileImageOutlined style={{ color: '#fa8c16' }} />,
      'gif': <FileImageOutlined style={{ color: '#fa8c16' }} />,
      'txt': <FileTextOutlined style={{ color: '#8c8c8c' }} />
    };
    return iconMap[extension] || <FileOutlined style={{ color: '#8c8c8c' }} />;
  };

  // Validate file before upload
  const beforeUpload = (file) => {
    const isValidType = acceptedTypes.some(type => 
      file.name.toLowerCase().endsWith(type.toLowerCase())
    );
    
    if (!isValidType) {
      message.error(`File type not supported. Accepted types: ${acceptedTypes.join(', ')}`);
      return false;
    }

    const isValidSize = file.size / 1024 / 1024 < maxFileSize;
    if (!isValidSize) {
      message.error(`File must be smaller than ${maxFileSize}MB`);
      return false;
    }

    if (fileList.length >= maxFiles) {
      message.error(`Maximum ${maxFiles} files allowed`);
      return false;
    }

    return false; // Prevent automatic upload
  };

  // Handle file selection
  const handleFileChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  // Upload file to IPFS and backend
  const uploadToIPFS = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify({
        name: file.name,
        size: file.size,
        type: file.type,
        landParcelId,
        transactionId,
        uploadedBy: user?.userId || user?.cccd,
        uploadedAt: new Date().toISOString()
      }));

      const response = await ipfsAPI.uploadFile(formData);
      return response.data;
    } catch (error) {
      console.error('IPFS upload error:', error);
      throw error;
    }
  };

  // Upload files
  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('Please select files to upload');
      return;
    }

    setUploading(true);
    const uploadPromises = fileList.map(async (fileItem, index) => {
      try {
        setUploadProgress(prev => ({ ...prev, [fileItem.uid]: 0 }));

        // Upload to IPFS
        const ipfsResult = await uploadToIPFS(fileItem.originFileObj);
        
        setUploadProgress(prev => ({ ...prev, [fileItem.uid]: 50 }));
        setIpfsHashes(prev => ({ ...prev, [fileItem.uid]: ipfsResult.hash }));

        // Upload to backend
        const documentData = {
          docID: `DOC_${Date.now()}_${index}`,
          landParcelID: landParcelId,
          txID: transactionId || '',
          ipfsHash: ipfsResult.hash,
          description: `${fileItem.name} - Uploaded via enhanced interface`
        };

        await documentAPI.uploadToIPFS(
          fileItem.originFileObj, 
          documentData, 
          ipfsResult.hash
        );

        setUploadProgress(prev => ({ ...prev, [fileItem.uid]: 100 }));
        
        return {
          ...fileItem,
          status: 'done',
          ipfsHash: ipfsResult.hash,
          url: ipfsResult.url
        };
      } catch (error) {
        console.error('Upload error:', error);
        setUploadProgress(prev => ({ ...prev, [fileItem.uid]: -1 }));
        return {
          ...fileItem,
          status: 'error',
          error: error.message
        };
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      const successCount = results.filter(r => r.status === 'done').length;
      const errorCount = results.filter(r => r.status === 'error').length;

      if (successCount > 0) {
        message.success(`${successCount} file(s) uploaded successfully`);
      }
      if (errorCount > 0) {
        message.error(`${errorCount} file(s) failed to upload`);
      }

      setFileList(results);
      
      if (onUploadComplete) {
        onUploadComplete(results.filter(r => r.status === 'done'));
      }
    } catch (error) {
      message.error('Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  // Preview file
  const handlePreview = (file) => {
    setPreviewFile(file);
    setPreviewVisible(true);
  };

  // Download file
  const handleDownload = async (file) => {
    try {
      if (file.ipfsHash) {
        const response = await ipfsAPI.getFile(file.ipfsHash);
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      message.error('Download failed');
    }
  };

  // Remove file
  const handleRemove = (file) => {
    setFileList(prev => prev.filter(item => item.uid !== file.uid));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[file.uid];
      return newProgress;
    });
    setIpfsHashes(prev => {
      const newHashes = { ...prev };
      delete newHashes[file.uid];
      return newHashes;
    });
  };

  // Render upload progress
  const renderProgress = (file) => {
    const progress = uploadProgress[file.uid];
    if (progress === undefined) return null;
    
    if (progress === -1) {
      return (
        <div style={{ marginTop: '8px' }}>
          <Progress 
            percent={100} 
            status="exception" 
            size="small"
            format={() => 'Failed'}
          />
        </div>
      );
    }
    
    return (
      <div style={{ marginTop: '8px' }}>
        <Progress
          percent={progress}
          size="small"
          status={progress === 100 ? 'success' : 'active'}
          format={(percent) => `${percent}%`}
        />
      </div>
    );
  };

  return (
    <div>
      <Card
        title={
          <Space>
            <CloudUploadOutlined />
            <span>Document Upload</span>
            {showIPFSInfo && (
              <Tag color="blue" icon={<SecurityScanOutlined />}>
                IPFS Secured
              </Tag>
            )}
          </Space>
        }
        className="professional-card"
      >
        {/* Upload Instructions */}
        <Alert
          message="Upload Guidelines"
          description={
            <div>
              <Paragraph style={{ marginBottom: '8px' }}>
                • Maximum {maxFiles} files, each up to {maxFileSize}MB
              </Paragraph>
              <Paragraph style={{ marginBottom: '8px' }}>
                • Accepted formats: {acceptedTypes.join(', ')}
              </Paragraph>
              <Paragraph style={{ marginBottom: 0 }}>
                • Files are automatically encrypted and stored on IPFS for security
              </Paragraph>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />

        {/* Drag and Drop Upload */}
        <Dragger
          multiple
          beforeUpload={beforeUpload}
          onChange={handleFileChange}
          fileList={fileList}
          showUploadList={false}
          style={{ marginBottom: '16px' }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
          </p>
          <p className="ant-upload-text">
            Click or drag files to this area to upload
          </p>
          <p className="ant-upload-hint">
            Support for secure document upload with blockchain verification
          </p>
        </Dragger>

        {/* File List */}
        {fileList.length > 0 && (
          <div>
            <Divider orientation="left">
              <Space>
                <FileTextOutlined />
                <span>Selected Files ({fileList.length})</span>
              </Space>
            </Divider>
            
            <List
              itemLayout="horizontal"
              dataSource={fileList}
              renderItem={(file) => (
                <List.Item
                  actions={[
                    <Tooltip title="Preview">
                      <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => handlePreview(file)}
                        disabled={!['jpg', 'jpeg', 'png', 'pdf'].some(ext =>
                          file.name.toLowerCase().endsWith(ext)
                        )}
                      />
                    </Tooltip>,
                    file.status === 'done' && (
                      <Tooltip title="Download">
                        <Button
                          type="text"
                          icon={<DownloadOutlined />}
                          onClick={() => handleDownload(file)}
                        />
                      </Tooltip>
                    ),
                    <Popconfirm
                      title="Remove this file?"
                      onConfirm={() => handleRemove(file)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                      />
                    </Popconfirm>
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    avatar={getFileIcon(file.name)}
                    title={
                      <Space>
                        <span>{file.name}</span>
                        {file.status === 'done' && (
                          <Badge status="success" text="Uploaded" />
                        )}
                        {file.status === 'error' && (
                          <Badge status="error" text="Failed" />
                        )}
                        {ipfsHashes[file.uid] && (
                          <Tooltip title={`IPFS Hash: ${ipfsHashes[file.uid]}`}>
                            <Tag color="green" size="small">
                              <LinkOutlined /> IPFS
                            </Tag>
                          </Tooltip>
                        )}
                      </Space>
                    }
                    description={
                      <div>
                        <Text type="secondary">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </Text>
                        {file.error && (
                          <Text type="danger" style={{ marginLeft: '8px' }}>
                            Error: {file.error}
                          </Text>
                        )}
                        {renderProgress(file)}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        )}

        {/* Upload Button */}
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Space>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={handleUpload}
              loading={uploading}
              disabled={fileList.length === 0}
              size="large"
            >
              {uploading ? 'Uploading...' : `Upload ${fileList.length} File(s)`}
            </Button>
            
            {fileList.length > 0 && (
              <Button
                icon={<DeleteOutlined />}
                onClick={() => setFileList([])}
                disabled={uploading}
              >
                Clear All
              </Button>
            )}
          </Space>
        </div>

        {/* IPFS Information */}
        {showIPFSInfo && (
          <div style={{ marginTop: '24px' }}>
            <Divider orientation="left">
              <Space>
                <SecurityScanOutlined />
                <span>Security Information</span>
              </Space>
            </Divider>
            
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card size="small" title="IPFS Storage">
                  <Paragraph style={{ fontSize: '12px', marginBottom: 0 }}>
                    Files are stored on the InterPlanetary File System (IPFS)
                    for decentralized, tamper-proof document management.
                  </Paragraph>
                </Card>
              </Col>
              
              <Col xs={24} md={12}>
                <Card size="small" title="Blockchain Verification">
                  <Paragraph style={{ fontSize: '12px', marginBottom: 0 }}>
                    Document hashes are recorded on the blockchain to ensure
                    authenticity and prevent unauthorized modifications.
                  </Paragraph>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Card>

      {/* Preview Modal */}
      <Modal
        open={previewVisible}
        title={previewFile?.name}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
      >
        {previewFile && (
          <div>
            {['jpg', 'jpeg', 'png', 'gif'].some(ext =>
              previewFile.name.toLowerCase().endsWith(ext)
            ) ? (
              <Image
                width="100%"
                src={previewFile.url || URL.createObjectURL(previewFile.originFileObj)}
                alt={previewFile.name}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                {getFileIcon(previewFile.name)}
                <div style={{ marginTop: '16px' }}>
                  <Title level={4}>{previewFile.name}</Title>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Size">
                      {(previewFile.size / 1024 / 1024).toFixed(2)} MB
                    </Descriptions.Item>
                    <Descriptions.Item label="Type">
                      {previewFile.type || 'Unknown'}
                    </Descriptions.Item>
                    {ipfsHashes[previewFile.uid] && (
                      <Descriptions.Item label="IPFS Hash">
                        <Text code copyable>
                          {ipfsHashes[previewFile.uid]}
                        </Text>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EnhancedFileUpload;