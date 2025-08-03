import { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Typography,
  Row,
  Col,
  InputNumber,
  DatePicker,
  message,
  Steps,
  Space,
  Divider
} from 'antd';
import {
  HomeOutlined,
  SaveOutlined,
  UserOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import apiService from '../../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Step } = Steps;

/**
 * Land Parcel Creation Page for Org1 (Authority)
 * Main function: Create new land parcels - POST /land-parcels
 */
const LandParcelCreatePage = ({ user, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();

  const landUsePurposes = [
    'Residential',
    'Commercial',
    'Industrial',
    'Agricultural',
    'Forestry',
    'Public Use',
    'Mixed Use',
    'Recreational',
    'Educational',
    'Healthcare'
  ];

  const legalStatuses = [
    'Registered',
    'Pending Registration',
    'Under Review',
    'Disputed',
    'Transferred',
    'Subdivided',
    'Merged',
    'Cancelled'
  ];

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const landParcelData = {
        id: values.id,
        ownerID: values.ownerID,
        location: values.location,
        landUsePurpose: values.landUsePurpose,
        legalStatus: values.legalStatus,
        area: values.area,
        registrationDate: values.registrationDate?.toISOString(),
        description: values.description,
        coordinates: values.coordinates,
        district: values.district,
        ward: values.ward,
        streetAddress: values.streetAddress
      };

      await apiService.createLandParcel(landParcelData);
      message.success('Land parcel created successfully!');
      form.resetFields();
      setCurrentStep(0);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Create land parcel error:', error);
      message.error(error.response?.data?.error || 'Failed to create land parcel');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: 'Basic Information',
      icon: <FileTextOutlined />,
      content: (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="id"
              label="Land Parcel ID"
              rules={[
                { required: true, message: 'Please enter land parcel ID' },
                { pattern: /^LP\d{6}$/, message: 'ID must be in format LP123456' }
              ]}
            >
              <Input placeholder="LP123456" prefix={<HomeOutlined />} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="ownerID"
              label="Owner ID (CCCD)"
              rules={[
                { required: true, message: 'Please enter owner ID' },
                { len: 12, message: 'CCCD must be 12 digits' }
              ]}
            >
              <Input placeholder="123456789012" prefix={<UserOutlined />} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="landUsePurpose"
              label="Land Use Purpose"
              rules={[{ required: true, message: 'Please select land use purpose' }]}
            >
              <Select placeholder="Select land use purpose">
                {landUsePurposes.map(purpose => (
                  <Select.Option key={purpose} value={purpose}>
                    {purpose}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="legalStatus"
              label="Legal Status"
              rules={[{ required: true, message: 'Please select legal status' }]}
            >
              <Select placeholder="Select legal status">
                {legalStatuses.map(status => (
                  <Select.Option key={status} value={status}>
                    {status}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="area"
              label="Area (m²)"
              rules={[
                { required: true, message: 'Please enter area' },
                { type: 'number', min: 1, message: 'Area must be greater than 0' }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Enter area in square meters"
                min={1}
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="registrationDate"
              label="Registration Date"
              rules={[{ required: true, message: 'Please select registration date' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
      )
    },
    {
      title: 'Location Details',
      icon: <EnvironmentOutlined />,
      content: (
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="location"
              label="General Location"
              rules={[{ required: true, message: 'Please enter location' }]}
            >
              <TextArea
                rows={2}
                placeholder="Enter general location description"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="district"
              label="District"
              rules={[{ required: true, message: 'Please enter district' }]}
            >
              <Input placeholder="Enter district" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="ward"
              label="Ward"
              rules={[{ required: true, message: 'Please enter ward' }]}
            >
              <Input placeholder="Enter ward" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="streetAddress"
              label="Street Address"
            >
              <Input placeholder="Enter street address" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="coordinates"
              label="GPS Coordinates (Optional)"
            >
              <Input placeholder="e.g., 10.762622, 106.660172" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="description"
              label="Additional Description"
            >
              <TextArea
                rows={3}
                placeholder="Enter any additional description or notes"
              />
            </Form.Item>
          </Col>
        </Row>
      )
    },
    {
      title: 'Review & Submit',
      icon: <CheckCircleOutlined />,
      content: (
        <div>
          <Title level={4}>Review Land Parcel Information</Title>
          <Text type="secondary">
            Please review all information before submitting. Once created, some fields may require special permissions to modify.
          </Text>
          <Divider />
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>Land Parcel ID:</Text>
              <div>{form.getFieldValue('id')}</div>
            </Col>
            <Col span={12}>
              <Text strong>Owner ID:</Text>
              <div>{form.getFieldValue('ownerID')}</div>
            </Col>
            <Col span={12}>
              <Text strong>Land Use Purpose:</Text>
              <div>{form.getFieldValue('landUsePurpose')}</div>
            </Col>
            <Col span={12}>
              <Text strong>Legal Status:</Text>
              <div>{form.getFieldValue('legalStatus')}</div>
            </Col>
            <Col span={12}>
              <Text strong>Area:</Text>
              <div>{form.getFieldValue('area')} m²</div>
            </Col>
            <Col span={12}>
              <Text strong>Registration Date:</Text>
              <div>{form.getFieldValue('registrationDate')?.format('DD/MM/YYYY')}</div>
            </Col>
          </Row>
        </div>
      )
    }
  ];

  const next = () => {
    form.validateFields().then(() => {
      setCurrentStep(currentStep + 1);
    }).catch(() => {
      message.error('Please fill in all required fields');
    });
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <HomeOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
        Create New Land Parcel
      </Title>
      <Text type="secondary">
        Create a new land parcel record in the system. This is a main authority function for Org1.
      </Text>

      <Card style={{ marginTop: '24px' }}>
        <Steps current={currentStep} style={{ marginBottom: '32px' }}>
          {steps.map((step, index) => (
            <Step key={index} title={step.title} icon={step.icon} />
          ))}
        </Steps>

        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: '32px' }}
        >
          {steps[currentStep].content}
        </Form>

        <div style={{ marginTop: '32px', textAlign: 'right' }}>
          <Space>
            {currentStep > 0 && (
              <Button onClick={prev}>
                Previous
              </Button>
            )}
            {currentStep < steps.length - 1 && (
              <Button type="primary" onClick={next}>
                Next
              </Button>
            )}
            {currentStep === steps.length - 1 && (
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSubmit}
                loading={loading}
              >
                Create Land Parcel
              </Button>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default LandParcelCreatePage;
