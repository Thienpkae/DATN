import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Upload,
  message,
  Typography,
  Space,
  Alert,
  Steps,
  Divider,
  Tag
} from 'antd';
import {
  FileTextOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  HomeOutlined
} from '@ant-design/icons';
import documentService from '../../../services/documentService';
import ipfsService from '../../../services/ipfs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

/**
 * Document Upload Page for Org3 (Citizens)
 * Allows citizens to upload documents for verification
 */
const DocumentUploadPage = ({ user, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [ipfsHash, setIpfsHash] = useState('');
  const [form] = Form.useForm();

  const handleFileUpload = async (file) => {
    try {
      setLoading(true);
      message.info('Đang tải lên tài liệu lên IPFS...');
      
      // Upload to IPFS
      const response = await ipfsService.uploadFile(file);
      setIpfsHash(response.hash);
      setUploadedFile(file);
      
      message.success('Tài liệu đã được tải lên IPFS thành công!');
      setCurrentStep(1);
    } catch (error) {
      console.error('Lỗi khi tải lên IPFS:', error);
      message.error('Lỗi khi tải lên tài liệu lên IPFS');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Validate data before submission
      const validation = documentService.validateDocumentData({
        ...values,
        ipfsHash,
        fileSize: uploadedFile?.size || 0,
        fileType: uploadedFile?.type || ''
      });
      
      if (!validation.isValid) {
        message.error(validation.errors.join(', '));
        return;
      }

      const documentData = {
        ...values,
        ipfsHash,
        fileSize: uploadedFile?.size || 0,
        fileType: uploadedFile?.type || '',
        uploadedBy: user.cccd,
        organizationID: user.org
      };

      await documentService.createDocument(documentData);
      message.success('Tài liệu đã được tạo thành công! Vui lòng chờ xác thực từ cơ quan có thẩm quyền.');
      
      form.resetFields();
      setUploadedFile(null);
      setIpfsHash('');
      setCurrentStep(0);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Lỗi khi tạo tài liệu:', error);
      message.error(error.response?.data?.error || error.message || 'Lỗi khi tạo tài liệu');
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
      title: 'Tải lên tài liệu',
      icon: <UploadOutlined />,
      content: (
        <div>
          <Alert
            message="Tải lên tài liệu"
            description="Chọn tài liệu cần tải lên. Hệ thống hỗ trợ các định dạng: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX, TXT. Kích thước tối đa: 10MB."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Form.Item
            name="file"
            label="Chọn tài liệu"
            rules={[{ required: true, message: 'Vui lòng chọn tài liệu để tải lên!' }]}
          >
            <Upload
              beforeUpload={(file) => {
                const isValidType = [
                  'application/pdf',
                  'image/jpeg',
                  'image/png',
                  'image/gif',
                  'application/msword',
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  'application/vnd.ms-excel',
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                  'text/plain'
                ].includes(file.type);
                
                if (!isValidType) {
                  message.error('Định dạng file không được hỗ trợ!');
                  return false;
                }
                
                const isLt10M = file.size / 1024 / 1024 < 10;
                if (!isLt10M) {
                  message.error('File phải nhỏ hơn 10MB!');
                  return false;
                }
                
                handleFileUpload(file);
                return false; // Prevent default upload
              }}
              accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.txt"
              maxCount={1}
            >
              <Button icon={<UploadOutlined />} size="large">
                Chọn tài liệu
              </Button>
            </Upload>
          </Form.Item>

          {uploadedFile && (
            <Alert
              message="Tài liệu đã được tải lên"
              description={
                <div>
                  <p><strong>Tên file:</strong> {uploadedFile.name}</p>
                  <p><strong>Kích thước:</strong> {(uploadedFile.size / 1024).toFixed(2)} KB</p>
                  <p><strong>IPFS Hash:</strong> <Text code>{ipfsHash}</Text></p>
                </div>
              }
              type="success"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </div>
      )
    },
    {
      title: 'Thông tin tài liệu',
      icon: <FileTextOutlined />,
      content: (
        <div>
          <Alert
            message="Thông tin tài liệu"
            description="Điền các thông tin chi tiết về tài liệu. Các trường đánh dấu * là bắt buộc."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Form.Item
            name="docID"
            label="Mã tài liệu *"
            rules={[
              { required: true, message: 'Vui lòng nhập mã tài liệu!' },
              { pattern: /^[A-Z0-9]{6,12}$/, message: 'Mã phải có 6-12 ký tự, chỉ chữ hoa và số!' }
            ]}
          >
            <Input placeholder="Ví dụ: DOC001" />
          </Form.Item>

          <Form.Item
            name="docType"
            label="Loại tài liệu *"
            rules={[{ required: true, message: 'Vui lòng chọn loại tài liệu!' }]}
          >
            <Select placeholder="Chọn loại tài liệu">
              <Option value="CERTIFICATE">Giấy chứng nhận</Option>
              <Option value="CONTRACT">Hợp đồng</Option>
              <Option value="MAP">Bản đồ</Option>
              <Option value="IDENTITY">Giấy tờ tùy thân</Option>
              <Option value="APPLICATION">Đơn từ</Option>
              <Option value="OTHER">Khác</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label="Tiêu đề tài liệu *"
            rules={[
              { required: true, message: 'Vui lòng nhập tiêu đề!' },
              { min: 5, message: 'Tiêu đề phải có ít nhất 5 ký tự!' }
            ]}
          >
            <Input placeholder="Nhập tiêu đề mô tả tài liệu" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả chi tiết"
            rules={[
              { min: 10, message: 'Mô tả phải có ít nhất 10 ký tự!' }
            ]}
          >
            <TextArea 
              rows={4} 
              placeholder="Mô tả chi tiết về nội dung, mục đích sử dụng của tài liệu"
            />
          </Form.Item>
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

          <Card title="Tóm tắt tài liệu" size="small">
            <div style={{ marginBottom: 16 }}>
              <p><strong>Mã tài liệu:</strong> <Tag color="blue">{form.getFieldValue('docID') || 'Chưa nhập'}</Tag></p>
              <p><strong>Loại tài liệu:</strong> <Tag color="green">{form.getFieldValue('docType') || 'Chưa chọn'}</Tag></p>
              <p><strong>Tiêu đề:</strong> {form.getFieldValue('title') || 'Chưa nhập'}</p>
              <p><strong>Tên file:</strong> {uploadedFile?.name || 'Chưa tải lên'}</p>
              <p><strong>Kích thước:</strong> {uploadedFile ? `${(uploadedFile.size / 1024).toFixed(2)} KB` : 'N/A'}</p>
              <p><strong>IPFS Hash:</strong> <Text code>{ipfsHash || 'Chưa có'}</Text></p>
            </div>
          </Card>

          <Alert
            message="Sẵn sàng gửi"
            description="Tất cả thông tin bắt buộc đã được cung cấp. Nhấn nút Gửi để tạo tài liệu trên blockchain."
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
        <FileTextOutlined /> Tải lên tài liệu mới
      </Title>
      
      <Alert
        message="Tổ chức: Org3 (Công dân)"
        description="Bạn có thể tải lên tài liệu để xác thực. Tài liệu sẽ được gửi đến cơ quan có thẩm quyền để xem xét và xác thực."
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
                icon={<CheckCircleOutlined />}
                onClick={handleSubmit}
                loading={loading}
              >
                Gửi tài liệu
              </Button>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default DocumentUploadPage;
