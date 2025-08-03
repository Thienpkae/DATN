import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Typography,
  Row,
  Col,
  DatePicker,
  message,
  Table,
  Space,
  Modal,
  Descriptions,
  Tag
} from 'antd';
import {
  SafetyCertificateOutlined,
  SearchOutlined,
  EyeOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import apiService from '../../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

/**
 * Certificate Issuance Page for Org1 (Authority)
 * Main function: Issue land certificates - POST /certificates
 */
const CertificateIssuancePage = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [landParcels, setLandParcels] = useState([]);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchLandParcels();
  }, []);

  const fetchLandParcels = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAllLandParcels({ limit: 100 });
      setLandParcels(response.landParcels || []);
    } catch (error) {
      console.error('Error fetching land parcels:', error);
      message.error('Failed to fetch land parcels');
    } finally {
      setLoading(false);
    }
  };

  const handleIssueCertificate = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const certificateData = {
        certificateID: values.certificateID,
        landParcelID: values.landParcelID,
        ownerID: values.ownerID,
        legalInfo: values.legalInfo,
        issueDate: values.issueDate?.toISOString(),
        expiryDate: values.expiryDate?.toISOString(),
        certificateType: values.certificateType,
        notes: values.notes
      };

      await apiService.issueCertificate(certificateData);
      message.success('Certificate issued successfully!');
      form.resetFields();
      setModalVisible(false);
      setSelectedParcel(null);
    } catch (error) {
      console.error('Issue certificate error:', error);
      message.error(error.response?.data?.error || 'Failed to issue certificate');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectParcel = (parcel) => {
    setSelectedParcel(parcel);
    form.setFieldsValue({
      landParcelID: parcel.id,
      ownerID: parcel.ownerID,
      certificateID: `CERT-${parcel.id}-${Date.now()}`,
      legalInfo: `Land Certificate for parcel ${parcel.id} located at ${parcel.location}`
    });
    setModalVisible(true);
  };

  const handlePreviewParcel = (parcel) => {
    setSelectedParcel(parcel);
    setPreviewModalVisible(true);
  };

  const columns = [
    {
      title: 'Parcel ID',
      dataIndex: 'id',
      key: 'id',
      render: (id) => <Text strong>{id}</Text>
    },
    {
      title: 'Owner ID',
      dataIndex: 'ownerID',
      key: 'ownerID'
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      ellipsis: true
    },
    {
      title: 'Area (m²)',
      dataIndex: 'area',
      key: 'area',
      render: (area) => area?.toLocaleString()
    },
    {
      title: 'Land Use',
      dataIndex: 'landUsePurpose',
      key: 'landUsePurpose',
      render: (purpose) => <Tag color="blue">{purpose}</Tag>
    },
    {
      title: 'Legal Status',
      dataIndex: 'legalStatus',
      key: 'legalStatus',
      render: (status) => {
        const colors = {
          'Registered': 'green',
          'Pending Registration': 'orange',
          'Under Review': 'blue',
          'Disputed': 'red'
        };
        return <Tag color={colors[status] || 'default'}>{status}</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handlePreviewParcel(record)}
          >
            Preview
          </Button>
          <Button
            type="primary"
            icon={<SafetyCertificateOutlined />}
            onClick={() => handleSelectParcel(record)}
            disabled={record.legalStatus !== 'Registered'}
          >
            Issue Certificate
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <SafetyCertificateOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
        Certificate Issuance
      </Title>
      <Text type="secondary">
        Issue land certificates for registered land parcels. This is a main authority function for Org1.
      </Text>

      <Card style={{ marginTop: '24px' }}>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4}>Available Land Parcels</Title>
          <Space>
            <Input.Search
              placeholder="Search by Parcel ID or Owner"
              allowClear
              style={{ width: 300 }}
              prefix={<SearchOutlined />}
            />
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={landParcels}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} parcels`
          }}
        />
      </Card>

      {/* Certificate Issuance Modal */}
      <Modal
        title="Issue Land Certificate"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setSelectedParcel(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            icon={<SafetyCertificateOutlined />}
            onClick={handleIssueCertificate}
            loading={loading}
          >
            Issue Certificate
          </Button>
        ]}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="certificateID"
                label="Certificate ID"
                rules={[{ required: true, message: 'Please enter certificate ID' }]}
              >
                <Input prefix={<FileTextOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="certificateType"
                label="Certificate Type"
                rules={[{ required: true, message: 'Please select certificate type' }]}
              >
                <Select placeholder="Select certificate type">
                  <Select.Option value="Land Use Rights Certificate">Land Use Rights Certificate</Select.Option>
                  <Select.Option value="Ownership Certificate">Ownership Certificate</Select.Option>
                  <Select.Option value="Temporary Certificate">Temporary Certificate</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="landParcelID"
                label="Land Parcel ID"
                rules={[{ required: true, message: 'Please enter land parcel ID' }]}
              >
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="ownerID"
                label="Owner ID"
                rules={[{ required: true, message: 'Please enter owner ID' }]}
              >
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="issueDate"
                label="Issue Date"
                rules={[{ required: true, message: 'Please select issue date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="expiryDate"
                label="Expiry Date (Optional)"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="legalInfo"
                label="Legal Information"
                rules={[{ required: true, message: 'Please enter legal information' }]}
              >
                <TextArea rows={3} placeholder="Enter legal information for the certificate" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="notes"
                label="Additional Notes"
              >
                <TextArea rows={2} placeholder="Enter any additional notes" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Land Parcel Preview Modal */}
      <Modal
        title="Land Parcel Details"
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewModalVisible(false)}>
            Close
          </Button>
        ]}
        width={600}
      >
        {selectedParcel && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Parcel ID">{selectedParcel.id}</Descriptions.Item>
            <Descriptions.Item label="Owner ID">{selectedParcel.ownerID}</Descriptions.Item>
            <Descriptions.Item label="Location" span={2}>{selectedParcel.location}</Descriptions.Item>
            <Descriptions.Item label="Area">{selectedParcel.area?.toLocaleString()} m²</Descriptions.Item>
            <Descriptions.Item label="Land Use Purpose">{selectedParcel.landUsePurpose}</Descriptions.Item>
            <Descriptions.Item label="Legal Status">{selectedParcel.legalStatus}</Descriptions.Item>
            <Descriptions.Item label="Registration Date">
              {selectedParcel.registrationDate ? new Date(selectedParcel.registrationDate).toLocaleDateString() : 'N/A'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default CertificateIssuancePage;
