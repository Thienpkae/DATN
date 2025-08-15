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
  Divider,
  Alert,
  Tag,
  Descriptions
} from 'antd';
import {
  HomeOutlined,
  SaveOutlined,
  UserOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import landService from '../../../services/landService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Step } = Steps;

// Constants từ chaincode
const LAND_USE_PURPOSES = [
  'Đất ở',
  'Đất nông nghiệp', 
  'Đất thương mại',
  'Đất công nghiệp',
  'Đất phi nông nghiệp'
];

const LEGAL_STATUSES = [
  'Có giấy chứng nhận',
  'Chưa có GCN',
  'Đang tranh chấp',
  'Đang thế chấp'
];

/**
 * Land Parcel Creation Page for Org1 (Authority)
 * Main function: Create new land parcels - POST /land-parcels
 */
const LandParcelCreatePage = ({ user, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Validate data before submission
      const validation = landService.validateLandData(values);
      if (!validation.isValid) {
        message.error(validation.errors.join(', '));
        return;
      }

      const landParcelData = {
        id: values.id,
        ownerID: values.ownerID,
        location: values.location,
        landUsePurpose: values.landUsePurpose,
        legalStatus: values.legalStatus,
        area: values.area,
        certificateID: values.certificateID || '',
        legalInfo: values.legalInfo || '',
        description: values.description,
        coordinates: values.coordinates,
        district: values.district,
        ward: values.ward,
        streetAddress: values.streetAddress
      };

      await landService.createLandParcel(landParcelData);
      message.success('Thửa đất đã được tạo thành công!');
      form.resetFields();
      setCurrentStep(0);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Lỗi khi tạo thửa đất:', error);
      message.error(error.response?.data?.error || error.message || 'Lỗi khi tạo thửa đất');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    form.validateFields().then(() => {
      setCurrentStep(currentStep + 1);
    });
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const steps = [
    {
      title: 'Thông tin cơ bản',
      icon: <HomeOutlined />,
      content: (
        <div>
          <Alert
            message="Thông tin cơ bản thửa đất"
            description="Điền các thông tin cơ bản cho thửa đất mới. Các trường đánh dấu * là bắt buộc."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="id"
                label="Mã thửa đất *"
                rules={[
                  { required: true, message: 'Vui lòng nhập mã thửa đất!' },
                  { pattern: /^[A-Z0-9]{6,12}$/, message: 'Mã phải có 6-12 ký tự, chỉ chữ hoa và số!' }
                ]}
              >
                <Input placeholder="Ví dụ: LAND001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="ownerID"
                label="CCCD chủ sở hữu *"
                rules={[
                  { required: true, message: 'Vui lòng nhập CCCD chủ sở hữu!' },
                  { pattern: /^\d{12}$/, message: 'CCCD phải có đúng 12 chữ số!' }
                ]}
              >
                <Input placeholder="Ví dụ: 123456789012" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="area"
                label="Diện tích (m²) *"
                rules={[
                  { required: true, message: 'Vui lòng nhập diện tích!' },
                  { type: 'number', min: 0.01, message: 'Diện tích phải lớn hơn 0!' }
                ]}
              >
                <InputNumber 
                  placeholder="Ví dụ: 100.5" 
                  style={{ width: '100%' }}
                  min={0.01}
                  step={0.01}
                  precision={2}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="landUsePurpose"
                label="Mục đích sử dụng đất *"
                rules={[{ required: true, message: 'Vui lòng chọn mục đích sử dụng!' }]}
              >
                <Select placeholder="Chọn mục đích sử dụng">
                  {LAND_USE_PURPOSES.map(purpose => (
                    <Select.Option key={purpose} value={purpose}>
                      {purpose}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="location"
            label="Vị trí *"
            rules={[{ required: true, message: 'Vui lòng nhập vị trí!' }]}
          >
            <TextArea 
              rows={3} 
              placeholder="Nhập thông tin vị trí chi tiết bao gồm địa chỉ, quận, phường, v.v."
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <TextArea 
              rows={2} 
              placeholder="Mô tả bổ sung hoặc ghi chú về thửa đất"
            />
          </Form.Item>
        </div>
      )
    },
    {
      title: 'Thông tin pháp lý',
      icon: <FileTextOutlined />,
      content: (
        <div>
          <Alert
            message="Thông tin pháp lý"
            description="Cung cấp trạng thái pháp lý và thông tin giấy chứng nhận nếu có."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="legalStatus"
                label="Trạng thái pháp lý *"
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái pháp lý!' }]}
              >
                <Select placeholder="Chọn trạng thái pháp lý">
                  {LEGAL_STATUSES.map(status => (
                    <Select.Option key={status} value={status}>
                      {status}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="certificateID"
                label="Mã giấy chứng nhận (Tùy chọn)"
                rules={[
                  { pattern: /^[A-Z0-9]{8,16}$/, message: 'Mã GCN phải có 8-16 ký tự, chỉ chữ hoa và số!' }
                ]}
              >
                <Input placeholder="Ví dụ: CERT001" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="legalInfo"
            label="Thông tin pháp lý"
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const certificateID = getFieldValue('certificateID');
                  if (certificateID && !value) {
                    return Promise.reject(new Error('Thông tin pháp lý là bắt buộc khi có mã giấy chứng nhận!'));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <TextArea 
              rows={4} 
              placeholder="Thông tin pháp lý, chi tiết quyền sở hữu, hạn chế, v.v. (Bắt buộc nếu có Mã GCN)"
            />
          </Form.Item>

          <Alert
            message="Lưu ý"
            description="Nếu bạn cung cấp Mã giấy chứng nhận, Thông tin pháp lý trở thành bắt buộc. Điều này đảm bảo tài liệu đầy đủ cho giấy chứng nhận."
            type="warning"
            showIcon
          />
        </div>
      )
    },
    {
      title: 'Thông tin bổ sung',
      icon: <EnvironmentOutlined />,
      content: (
        <div>
          <Alert
            message="Thông tin bổ sung"
            description="Các thông tin bổ sung để xác định và quản lý thửa đất tốt hơn."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="district"
                label="Quận/Huyện"
              >
                <Input placeholder="Ví dụ: Quận 1" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="ward"
                label="Phường/Xã"
              >
                <Input placeholder="Ví dụ: Phường Bến Nghé" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="streetAddress"
                label="Địa chỉ đường"
              >
                <Input placeholder="Ví dụ: 123 Đường Nguyễn Huệ" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="coordinates"
            label="Tọa độ (Tùy chọn)"
          >
            <TextArea 
              rows={2} 
              placeholder="Tọa độ GPS hoặc tham chiếu bản đồ (Ví dụ: 10.762622, 106.660172)"
            />
          </Form.Item>

          <Alert
            message="Định dạng tọa độ"
            description="Tọa độ nên ở định dạng thập phân (vĩ độ, kinh độ). Ví dụ: 10.762622, 106.660172"
            type="info"
            showIcon
          />
        </div>
      )
    },
    {
      title: 'Xem lại & Gửi',
      icon: <CheckCircleOutlined />,
      content: (
        <div>
          <Alert
            message="Xem lại thông tin"
            description="Vui lòng xem lại tất cả thông tin trước khi gửi. Bạn có thể quay lại các bước trước để thay đổi."
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Card title="Tóm tắt thửa đất" size="small">
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Mã thửa đất">
                <Tag color="blue">{form.getFieldValue('id') || 'Chưa nhập'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="CCCD chủ sở hữu">
                <Tag color="green">{form.getFieldValue('ownerID') || 'Chưa nhập'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Diện tích">
                <Tag color="orange">{form.getFieldValue('area') ? `${form.getFieldValue('area')} m²` : 'Chưa nhập'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Mục đích sử dụng">
                <Tag color="purple">{form.getFieldValue('landUsePurpose') || 'Chưa chọn'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái pháp lý">
                <Tag color="red">{form.getFieldValue('legalStatus') || 'Chưa chọn'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Vị trí">
                <Text ellipsis style={{ maxWidth: 200 }}>
                  {form.getFieldValue('location') || 'Chưa nhập'}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Mã giấy chứng nhận">
                <Tag color={form.getFieldValue('certificateID') ? 'green' : 'default'}>
                  {form.getFieldValue('certificateID') || 'Chưa cung cấp'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Alert
            message="Sẵn sàng gửi"
            description="Tất cả thông tin bắt buộc đã được cung cấp. Nhấn nút Gửi để tạo thửa đất trên blockchain."
            type="success"
            showIcon
            style={{ marginTop: 16 }}
          />
        </div>
      )
    }
  ];

  return (
    <div>
      <Title level={2}>
        <HomeOutlined /> Tạo thửa đất mới
      </Title>
      
      <Alert
        message="Tổ chức: Org1 (Cơ quan quản lý)"
        description="Bạn có quyền tạo thửa đất mới và cấp giấy chứng nhận. Tất cả thay đổi sẽ được ghi lại trên blockchain."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Card>
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          {steps.map(item => (
            <Step key={item.title} title={item.title} icon={item.icon} />
          ))}
        </Steps>

        <div style={{ minHeight: 400 }}>
          {steps[currentStep].content}
        </div>

        <Divider />

        <div style={{ textAlign: 'right' }}>
          <Space>
            {currentStep > 0 && (
              <Button onClick={prevStep}>
                Trước
              </Button>
            )}
            {currentStep < steps.length - 1 && (
              <Button type="primary" onClick={nextStep}>
                Tiếp theo
              </Button>
            )}
            {currentStep === steps.length - 1 && (
              <Button 
                type="primary" 
                icon={<SaveOutlined />}
                onClick={handleSubmit}
                loading={loading}
              >
                Tạo thửa đất
              </Button>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default LandParcelCreatePage;
