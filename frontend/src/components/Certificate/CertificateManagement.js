import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  message, 
  Space, 
  Typography,
  Row,
  Col
} from 'antd';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { certificateAPI } from '../../services/api';

const { Title } = Typography;

const CertificateManagement = ({ user }) => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewingCertificate, setViewingCertificate] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      // This would need system-wide certificate query for Org1
      const response = await certificateAPI.getAll();
      if (Array.isArray(response.data)) {
        setCertificates(response.data);
      } else {
        console.error("Unexpected response format for getAll certificates:", response.data);
        setCertificates([]);
      }
    } catch (error) {
      message.error('Failed to fetch certificates');
    } finally {
      setLoading(false);
    }
  };

  const handleIssueCertificate = async (values) => {
    try {
      await certificateAPI.issue(values);
      message.success('Certificate issued successfully');
      setModalVisible(false);
      form.resetFields();
      fetchCertificates();
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to issue certificate');
    }
  };

  const columns = [
    {
      title: 'Certificate ID',
      dataIndex: 'certificateID',
      key: 'certificateID',
    },
    {
      title: 'Land Parcel ID',
      dataIndex: 'landParcelID',
      key: 'landParcelID',
    },
    {
      title: 'Owner ID',
      dataIndex: 'ownerID',
      key: 'ownerID',
    },
    {
      title: 'Issue Date',
      dataIndex: 'issueDate',
      key: 'issueDate',
      render: (date) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          icon={<EyeOutlined />} 
          onClick={() => {
            setViewingCertificate(record);
            setViewModalVisible(true);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>Certificate Management</Title>
      
      <Card 
        title="Land Certificates" 
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            Issue Certificate
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={certificates}
          loading={loading}
          rowKey="certificateID"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Issue Certificate Modal */}
      <Modal
        title="Issue Land Certificate"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleIssueCertificate}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="certificateID"
                label="Certificate ID"
                rules={[{ required: true, message: 'Please input certificate ID!' }]}
              >
                <Input placeholder="Enter certificate ID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="landParcelID"
                label="Land Parcel ID"
                rules={[{ required: true, message: 'Please input land parcel ID!' }]}
              >
                <Input placeholder="Enter land parcel ID" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="ownerID"
            label="Owner ID"
            rules={[{ required: true, message: 'Please input owner ID!' }]}
          >
            <Input placeholder="Enter owner ID" />
          </Form.Item>

          <Form.Item
            name="legalInfo"
            label="Legal Information"
            rules={[{ required: true, message: 'Please input legal information!' }]}
          >
            <Input.TextArea 
              placeholder="Enter legal information and certificate details"
              rows={4}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Issue Certificate
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Certificate Modal */}
      <Modal
        title="Certificate Details"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>
        ]}
        width={600}
      >
        {viewingCertificate && (
          <div>
            <p><strong>Certificate ID:</strong> {viewingCertificate.certificateID}</p>
            <p><strong>Land Parcel ID:</strong> {viewingCertificate.landParcelID}</p>
            <p><strong>Owner ID:</strong> {viewingCertificate.ownerID}</p>
            <p><strong>Issue Date:</strong> {viewingCertificate.issueDate ? new Date(viewingCertificate.issueDate).toLocaleString() : '-'}</p>
            <p><strong>Legal Information:</strong></p>
            <p>{viewingCertificate.legalInfo}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CertificateManagement;
