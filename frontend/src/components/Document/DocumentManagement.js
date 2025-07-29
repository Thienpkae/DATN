import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  message, 
  Space, 
  Typography,
  Modal, 
  Form, 
  Input,
  Upload
} from 'antd';
import { 
  EyeOutlined,
  PlusOutlined, 
  EditOutlined,
  CheckCircleOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { documentAPI } from '../../services/api';

const { Title } = Typography;

const DocumentManagement = ({ user }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await documentAPI.getAll();
      if (Array.isArray(response.data)) {
        setDocuments(response.data);
      } else {
        console.error("Unexpected response format for getAll documents:", response.data);
        setDocuments([]);
      }
    } catch (error) {
      message.error('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async (values) => {
    try {
      const file = values.file[0].originFileObj; // Extract the file object
      const metadata = { ...values };
      delete metadata.file; // Remove the file from metadata

      await documentAPI.upload(file, metadata);
      message.success('Document uploaded successfully');
      setModalVisible(false);
      form.resetFields();
      fetchDocuments();
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to upload document');
    }
  };

  const handleVerifyDocument = async (docId) => {
    try {
      await documentAPI.verify(docId);
      message.success('Document verified successfully');
      fetchDocuments();
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to verify document');
    }
  };

  const columns = [
    {
      title: 'Document ID',
      dataIndex: 'docID',
      key: 'docID',
    },
    {
      title: 'Land Parcel ID',
      dataIndex: 'landParcelID',
      key: 'landParcelID',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'IPFS Hash',
      dataIndex: 'ipfsHash',
      key: 'ipfsHash',
      render: (hash) => hash ? `${hash.substring(0, 10)}...` : '-',
    },
    {
      title: 'Verified',
      dataIndex: 'verified',
      key: 'verified',
      render: (verified) => verified ? 'Yes' : 'No',
    },
    {
      title: 'Uploaded By',
      dataIndex: 'uploadedBy',
      key: 'uploadedBy',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />}>
            View
          </Button>
          {(user.org === 'Org1' || user.org === 'Org2') && !record.verified && (
            <Button 
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handleVerifyDocument(record.docID)}
            >
              Verify
            </Button>
          )}
          {user.org === 'Org1' && (
            <Button 
              icon={<EditOutlined />}
              onClick={() => {
                setEditingDocument(record);
                form.setFieldsValue(record);
                setModalVisible(true);
              }}
            >
              Edit
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>Document Management</Title>
      
      <Card 
        title="Documents" 
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            Upload Document
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={documents}
          loading={loading}
          rowKey="docID"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingDocument ? "Edit Document" : "Upload Document"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingDocument(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUploadDocument}
        >
          <Form.Item
            name="docID"
            label="Document ID"
            rules={[{ required: true, message: 'Please input document ID!' }]}
          >
            <Input placeholder="Enter document ID" disabled={editingDocument} />
          </Form.Item>

          <Form.Item
            name="landParcelID"
            label="Land Parcel ID"
            rules={[{ required: true, message: 'Please input land parcel ID!' }]}
          >
            <Input placeholder="Enter land parcel ID" />
          </Form.Item>

          <Form.Item
            name="txID"
            label="Transaction ID (Optional)"
          >
            <Input placeholder="Enter related transaction ID" />
          </Form.Item>

          <Form.Item
            name="ipfsHash"
            label="IPFS Hash"
            rules={[{ required: true, message: 'Please input IPFS hash!' }]}
          >
            <Input placeholder="Enter IPFS hash of the document" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please input description!' }]}
          >
            <Input.TextArea placeholder="Enter document description" rows={3} />
          </Form.Item>

          <Form.Item
            name="file" // This will hold the uploaded file
            label="Document File"
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList)}
            rules={[{ required: true, message: 'Please upload a document!' }]}
          >
            <Upload name="document" beforeUpload={() => false} maxCount={1}>
              <Button icon={<UploadOutlined />}>Select File</Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingDocument ? 'Update' : 'Upload'}
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                setEditingDocument(null);
                form.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DocumentManagement;
