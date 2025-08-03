import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Upload,
  message,
  Typography,
  Row,
  Col,
  Statistic,
  Descriptions
} from 'antd';
import {
  FileTextOutlined,
  UploadOutlined,
  EyeOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileImageOutlined,
  FilePdfOutlined
} from '@ant-design/icons';
import apiService from '../../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

/**
 * Document Management Page for Org1 (Land Registry Authority)
 * Manages all documents in the system with verification capabilities
 */
const DocumentManagementPage = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    rejected: 0
  });

  useEffect(() => {
    fetchDocuments();
    fetchStats();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllDocuments();
      setDocuments(response.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      message.error('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiService.getDocumentStats();
      setStats(response.stats || {
        total: 0,
        verified: 0,
        pending: 0,
        rejected: 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleViewDocument = (document) => {
    setSelectedDocument(document);
    setModalVisible(true);
  };

  const handleVerifyDocument = async (docID, status, comments = '') => {
    try {
      setLoading(true);
      await apiService.verifyDocument(docID, {
        status,
        verifierComments: comments,
        verifiedBy: user.cccd
      });
      message.success(`Document ${status.toLowerCase()} successfully`);
      fetchDocuments();
      fetchStats();
      setModalVisible(false);
    } catch (error) {
      console.error('Document verification error:', error);
      message.error(error.message || 'Failed to verify document');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const documentData = {
        ...values,
        uploadedBy: user.cccd,
        organizationID: user.org
      };

      await apiService.uploadDocument(documentData);
      message.success('Document uploaded successfully');
      setUploadModalVisible(false);
      form.resetFields();
      fetchDocuments();
      fetchStats();
    } catch (error) {
      console.error('Document upload error:', error);
      message.error(error.message || 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'verified': return 'green';
      case 'pending': return 'orange';
      case 'rejected': return 'red';
      default: return 'default';
    }
  };

  const getFileTypeIcon = (fileName) => {
    const extension = fileName?.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return <FileImageOutlined style={{ color: '#52c41a' }} />;
      default: return <FileTextOutlined />;
    }
  };

  const columns = [
    {
      title: 'Document ID',
      dataIndex: 'docID',
      key: 'docID',
      width: 150,
      render: (text) => <Text code>{text}</Text>
    },
    {
      title: 'File Name',
      dataIndex: 'fileName',
      key: 'fileName',
      width: 200,
      render: (fileName) => (
        <Space>
          {getFileTypeIcon(fileName)}
          <Text>{fileName}</Text>
        </Space>
      )
    },
    {
      title: 'Land Parcel ID',
      dataIndex: 'landParcelID',
      key: 'landParcelID',
      width: 150,
      render: (text) => <Text code>{text}</Text>
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      ellipsis: true
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status}
        </Tag>
      )
    },
    {
      title: 'Uploaded By',
      dataIndex: 'uploadedBy',
      key: 'uploadedBy',
      width: 150
    },
    {
      title: 'Upload Date',
      dataIndex: 'uploadDate',
      key: 'uploadDate',
      width: 150,
      render: (date) => new Date(date).toLocaleDateString('vi-VN')
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDocument(record)}
          >
            View
          </Button>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => window.open(record.ipfsUrl, '_blank')}
          >
            Download
          </Button>
          {record.status === 'Pending' && (
            <>
              <Button
                type="link"
                icon={<CheckCircleOutlined />}
                onClick={() => handleVerifyDocument(record.docID, 'Verified')}
                style={{ color: '#52c41a' }}
              >
                Verify
              </Button>
              <Button
                type="link"
                icon={<CloseCircleOutlined />}
                onClick={() => handleVerifyDocument(record.docID, 'Rejected')}
                danger
              >
                Reject
              </Button>
            </>
          )}
        </Space>
      )
    }
  ];

  const uploadProps = {
    name: 'file',
    multiple: false,
    beforeUpload: (file) => {
      const isValidType = file.type === 'application/pdf' || file.type.startsWith('image/');
      if (!isValidType) {
        message.error('You can only upload PDF or image files!');
        return false;
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('File must be smaller than 10MB!');
        return false;
      }
      return false; // Prevent auto upload
    },
    onChange: (info) => {
      if (info.fileList.length > 0) {
        form.setFieldsValue({ file: info.fileList[0] });
      }
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Title level={2}>Document Management</Title>
          <Text type="secondary">
            Manage and verify all documents in the land registry system
          </Text>
        </div>
        <Button
          type="primary"
          icon={<UploadOutlined />}
          onClick={() => setUploadModalVisible(true)}
        >
          Upload Document
        </Button>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Documents"
              value={stats.total}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Verified"
              value={stats.verified}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending Verification"
              value={stats.pending}
              valueStyle={{ color: '#faad14' }}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Rejected"
              value={stats.rejected}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Documents Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={documents}
          rowKey="docID"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} documents`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Document Details Modal */}
      <Modal
        title="Document Details"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => window.open(selectedDocument?.ipfsUrl, '_blank')}
          >
            Download
          </Button>
        ]}
      >
        {selectedDocument && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Document ID" span={2}>
              <Text code>{selectedDocument.docID}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="File Name">
              <Space>
                {getFileTypeIcon(selectedDocument.fileName)}
                {selectedDocument.fileName}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(selectedDocument.status)}>
                {selectedDocument.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Land Parcel ID">
              <Text code>{selectedDocument.landParcelID}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Uploaded By">
              {selectedDocument.uploadedBy}
            </Descriptions.Item>
            <Descriptions.Item label="Upload Date">
              {new Date(selectedDocument.uploadDate).toLocaleString('vi-VN')}
            </Descriptions.Item>
            <Descriptions.Item label="File Size">
              {selectedDocument.fileSize ? `${(selectedDocument.fileSize / 1024).toFixed(2)} KB` : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Description" span={2}>
              {selectedDocument.description || 'No description provided'}
            </Descriptions.Item>
            {selectedDocument.verifierComments && (
              <Descriptions.Item label="Verifier Comments" span={2}>
                {selectedDocument.verifierComments}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* Upload Document Modal */}
      <Modal
        title="Upload New Document"
        open={uploadModalVisible}
        onOk={handleUploadDocument}
        onCancel={() => {
          setUploadModalVisible(false);
          form.resetFields();
        }}
        confirmLoading={loading}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="docID"
            label="Document ID"
            rules={[{ required: true, message: 'Please enter document ID' }]}
          >
            <Input placeholder="Enter unique document ID" />
          </Form.Item>
          <Form.Item
            name="landParcelID"
            label="Land Parcel ID"
            rules={[{ required: true, message: 'Please enter land parcel ID' }]}
          >
            <Input placeholder="Enter land parcel ID" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <TextArea rows={3} placeholder="Enter document description" />
          </Form.Item>
          <Form.Item
            name="file"
            label="File"
            rules={[{ required: true, message: 'Please select a file' }]}
          >
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>Select File</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DocumentManagementPage;
