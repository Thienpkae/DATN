import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card,
  Upload, 
  Button,
  message,
  Progress,
  List,
  Tag,
  Space,
  Modal,
  Tooltip,
  Alert,
  Descriptions,
  Typography
} from 'antd';
import { 
  EyeOutlined,
  DownloadOutlined,
  DeleteOutlined,
  CloudUploadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { downloadFromIPFS, isIPFSAvailable } from '../../services/ipfs';
import { ipfsAPI } from '../../services/api'; 

const { Title, Text } = Typography;
const { Dragger } = Upload;

const IPFSFileUpload = ({ onFileUploaded, landParcelId, transactionId, initialFiles = [] }) => {
  const [uploading, setUploading] = useState(false);
  const [ipfsAvailable, setIpfsAvailable] = useState(false); // Declared ipfsAvailable
  const [uploadProgress, setUploadProgress] = useState({}); // Declared uploadProgress
  const [fileList, setFileList] = useState([]); // Declared fileList
  const [previewVisible, setPreviewVisible] = useState(false); // Declared previewVisible
  const [previewFile, setPreviewFile] = useState(null); // Declared previewFile

  const loadExistingFiles = useCallback(async () => {
    if (initialFiles && initialFiles.length > 0) {
      setFileList(initialFiles.map(file => ({ 
        uid: file.ipfsHash,
        name: file.name,
        status: 'done',
        ipfsHash: file.ipfsHash,
        type: file.type,
        size: file.size,
        uploadDate: file.uploadedAt
      })));
    }
  }, [initialFiles]);

  useEffect(() => {
    loadExistingFiles();
    checkIPFSStatus(); // Call checkIPFSStatus on mount
  }, [loadExistingFiles]);

  const checkIPFSStatus = async () => {
    try {
      const available = await isIPFSAvailable();
      setIpfsAvailable(available);
      if (!available) {
        message.warning('IPFS node is not available. Please start IPFS daemon.');
      }
    } catch (error) {
      console.error('IPFS status check failed:', error);
      setIpfsAvailable(false);
    }
  };

  const handleUpload = async (file) => {
    if (!ipfsAvailable) {
      message.error('IPFS is not available. Please check your IPFS connection.');
      return false;
    }

    try {
      setUploading(true);
      setUploadProgress({ [file.uid]: 0 });

      // Create metadata
      const metadata = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        landParcelId: landParcelId,
        transactionId: transactionId,
        uploadedAt: new Date().toISOString(),
        uploadedBy: localStorage.getItem('userId') || 'anonymous'
      };

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const current = prev[file.uid] || 0;
          if (current < 90) {
            return { ...prev, [file.uid]: current + 10 };
          }
          return prev;
        });
      }, 100);

      // Upload to IPFS
      const ipfsResponse = await ipfsAPI.uploadFile(file, metadata);
      
      if (onFileUploaded) { // Changed onUploadSuccess to onFileUploaded
        await onFileUploaded(ipfsResponse, file);
      }
      
      clearInterval(progressInterval); // Clear interval on success
      setUploadProgress(prev => ({ ...prev, [file.uid]: 100 })); // Set to 100% on success
      setFileList(prev => [...prev, { // Add uploaded file to fileList
        uid: ipfsResponse.hash,
        name: file.name,
        status: 'done',
        ipfsHash: ipfsResponse.hash,
        type: file.type,
        size: ipfsResponse.size,
        uploadDate: new Date().toISOString()
      }]);

    } catch (error) {
      console.error('Upload failed:', error);
      message.error(`Upload failed: ${error.message}`);
      setUploadProgress(prev => ({ ...prev, [file.uid]: 0 }));
    } finally {
      setUploading(false);
    }

    return false; // Prevent default upload behavior
  };

  const handlePreview = async (file) => {
    try {
      if (file.ipfsHash) {
        const data = await downloadFromIPFS(file.ipfsHash);
        const blob = new Blob([data], { type: file.type });
        const url = URL.createObjectURL(blob);
        
        setPreviewFile({
          ...file,
          url: url
        });
        setPreviewVisible(true);
      }
    } catch (error) {
      message.error('Failed to load file from IPFS');
    }
  };

  const handleDownload = async (file) => {
    try {
      const data = await downloadFromIPFS(file.ipfsHash);
      const blob = new Blob([data], { type: file.type });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      message.success('File downloaded successfully');
    } catch (error) {
      message.error('Failed to download file from IPFS');
    }
  };

  const handleDelete = async (file) => {
    try {
      // Unpin from IPFS
      await ipfsAPI.unpinFile(file.ipfsHash);
      
      // Remove from local state
      setFileList(prev => prev.filter(f => f.uid !== file.uid));
      
      message.success('File removed successfully');
    } catch (error) {
      message.error('Failed to remove file');
    }
  };

  const uploadProps = {
    name: 'file',
    multiple: true,
    beforeUpload: handleUpload,
    fileList: [],
    showUploadList: false,
    accept: '.pdf,.jpg,.jpeg,.png,.doc,.docx,.txt'
  };

  const getFileIcon = (type) => {
    if (type?.includes('image')) return '🖼️';
    if (type?.includes('pdf')) return '📄';
    if (type?.includes('word') || type?.includes('document')) return '📝';
    return '📁';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'done': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'error': return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      default: return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
    }
  };

  return (
    <div className="ipfs-file-upload">
      <Card
        title={
          <Space>
            <CloudUploadOutlined />
            <span>IPFS Document Storage</span>
            <Tag color={ipfsAvailable ? 'green' : 'red'}>
              {ipfsAvailable ? 'Connected' : 'Disconnected'}
            </Tag>
          </Space>
        }
        extra={
          <Button icon={<InfoCircleOutlined />} onClick={checkIPFSStatus}>
            Check Status
          </Button>
        }
      >
        {!ipfsAvailable && (
          <Alert
            message="IPFS Not Available"
            description="Please ensure IPFS daemon is running on your system. Start with: ipfs daemon"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Dragger {...uploadProps} disabled={!ipfsAvailable || uploading}>
          <p className="ant-upload-drag-icon">
            <CloudUploadOutlined />
          </p>
          <p className="ant-upload-text">
            Click or drag files to upload to IPFS
          </p>
          <p className="ant-upload-hint">
            Support for PDF, images, documents. Files will be stored on IPFS network.
          </p>
        </Dragger>

        {Object.keys(uploadProgress).length > 0 && (
          <div style={{ marginTop: 16 }}>
            {Object.entries(uploadProgress).map(([uid, progress]) => (
              <div key={uid} style={{ marginBottom: 8 }}>
                <Text>Uploading to IPFS...</Text>
                <Progress percent={progress} size="small" />
              </div>
            ))}
          </div>
        )}

        {fileList.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <Title level={4}>Uploaded Files</Title>
            <List
              dataSource={fileList}
              renderItem={(file) => (
                <List.Item
                  actions={[
                    <Tooltip title="Preview">
                      <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => handlePreview(file)}
                      />
                    </Tooltip>,
                    <Tooltip title="Download">
                      <Button
                        type="link"
                        icon={<DownloadOutlined />}
                        onClick={() => handleDownload(file)}
                      />
                    </Tooltip>,
                    <Tooltip title="Remove">
                      <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(file)}
                      />
                    </Tooltip>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<span style={{ fontSize: 24 }}>{getFileIcon(file.type)}</span>}
                    title={
                      <Space>
                        {getStatusIcon(file.status)}
                        <span>{file.name}</span>
                        <Tag color="blue">IPFS</Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <div>Size: {(file.size / 1024).toFixed(2)} KB</div>
                        <div>Hash: {file.ipfsHash}</div>
                        <div>Uploaded: {new Date(file.uploadDate).toLocaleString()}</div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        )}
      </Card>

      {/* Preview Modal */}
      <Modal
        title="File Preview"
        visible={previewVisible}
        onCancel={() => {
          setPreviewVisible(false);
          if (previewFile?.url) {
            URL.revokeObjectURL(previewFile.url);
          }
        }}
        footer={[
          <Button key="download" onClick={() => handleDownload(previewFile)}>
            Download
          </Button>,
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {previewFile && (
          <div>
            <Descriptions size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="File Name">{previewFile.name}</Descriptions.Item>
              <Descriptions.Item label="File Size">{(previewFile.size / 1024).toFixed(2)} KB</Descriptions.Item>
              <Descriptions.Item label="IPFS Hash">{previewFile.ipfsHash}</Descriptions.Item>
              <Descriptions.Item label="Upload Date">{new Date(previewFile.uploadDate).toLocaleString()}</Descriptions.Item>
            </Descriptions>
            
            {previewFile.type?.includes('image') && (
              <img
                src={previewFile.url}
                alt={previewFile.name}
                style={{ maxWidth: '100%', maxHeight: 400 }}
              />
            )}
            
            {previewFile.type?.includes('pdf') && (
              <iframe
                src={previewFile.url}
                width="100%"
                height="400px"
                title={previewFile.name}
              />
            )}
            
            {!previewFile.type?.includes('image') && !previewFile.type?.includes('pdf') && (
              <Alert
                message="Preview not available"
                description="This file type cannot be previewed. Please download to view."
                type="info"
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default IPFSFileUpload;
