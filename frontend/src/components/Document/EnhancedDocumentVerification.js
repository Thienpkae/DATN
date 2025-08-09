import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Typography,
  Tag,
  message,
  Descriptions,
  Progress,
  Alert,
  Divider,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  DownloadOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import apiService from '../../services/api';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const EnhancedDocumentVerification = ({ document, onVerify, onReject }) => {
  const [loading, setLoading] = useState(false);
  const [analysisModalVisible, setAnalysisModalVisible] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [verificationForm] = Form.useForm();

  const handleAnalyzeDocument = async () => {
    if (!document.ipfsHash) {
      message.error('Không có IPFS hash để phân tích');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.analyzeDocument(document.ipfsHash);
      
      if (response.success) {
        setAnalysisResult(response.data);
        setAnalysisModalVisible(true);
      } else {
        message.error('Lỗi khi phân tích tài liệu');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      message.error('Lỗi khi phân tích tài liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDocument = async (values) => {
    setLoading(true);
    try {
      const verificationData = {
        expectedCCCD: values.expectedCCCD,
        expectedLandParcelID: values.expectedLandParcelID
      };

      const response = await apiService.verifyDocument(document.docID, verificationData);
      
      if (response.success) {
        message.success('Tài liệu đã được chứng thực thành công');
        onVerify && onVerify(response.data);
      } else {
        message.error('Lỗi khi chứng thực tài liệu');
      }
    } catch (error) {
      console.error('Verification error:', error);
      message.error('Lỗi khi chứng thực tài liệu');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'green';
    if (confidence >= 60) return 'orange';
    return 'red';
  };

  const getVerificationStatus = (analysis) => {
    if (!analysis) return 'unknown';
    
    const { verification } = analysis;
    if (verification.overallVerified) return 'verified';
    if (verification.cccdVerified && !verification.landParcelVerified) return 'partial';
    return 'failed';
  };

  const renderAnalysisResult = () => {
    if (!analysisResult) return null;

    const { extractedInfo, verification, metadata } = analysisResult;
    const confidence = analysisResult.confidence || 0;
    const status = getVerificationStatus(analysisResult);

    return (
      <div>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Statistic
              title="Độ tin cậy"
              value={confidence}
              suffix="%"
              valueStyle={{ color: getConfidenceColor(confidence) }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="Số trang"
              value={metadata?.pages || 0}
            />
          </Col>
        </Row>

        <Alert
          message={
            status === 'verified' ? 'Tài liệu hợp lệ' :
            status === 'partial' ? 'Tài liệu cần kiểm tra thêm' :
            'Tài liệu không hợp lệ'
          }
          type={
            status === 'verified' ? 'success' :
            status === 'partial' ? 'warning' :
            'error'
          }
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Descriptions title="Thông tin trích xuất" bordered>
          <Descriptions.Item label="CCCD" span={3}>
            <Space>
              <Text>{extractedInfo.cccd || 'Không tìm thấy'}</Text>
              {verification.cccdVerified ? 
                <Tag color="green" icon={<CheckCircleOutlined />}>Hợp lệ</Tag> :
                <Tag color="red" icon={<CloseCircleOutlined />}>Không khớp</Tag>
              }
            </Space>
          </Descriptions.Item>
          
          <Descriptions.Item label="Loại tài liệu" span={3}>
            <Text>{extractedInfo.documentType}</Text>
          </Descriptions.Item>
          
          <Descriptions.Item label="Mã thửa đất" span={3}>
            <Space>
              <Text>{extractedInfo.landParcelID || 'Không tìm thấy'}</Text>
              {verification.landParcelVerified ? 
                <Tag color="green" icon={<CheckCircleOutlined />}>Hợp lệ</Tag> :
                <Tag color="red" icon={<CloseCircleOutlined />}>Không khớp</Tag>
              }
            </Space>
          </Descriptions.Item>
          
          <Descriptions.Item label="Tên chủ sở hữu" span={3}>
            <Text>{extractedInfo.ownerName || 'Không tìm thấy'}</Text>
          </Descriptions.Item>
          
          <Descriptions.Item label="Diện tích" span={3}>
            <Text>{extractedInfo.landArea ? `${extractedInfo.landArea} m²` : 'Không tìm thấy'}</Text>
          </Descriptions.Item>
          
          <Descriptions.Item label="Vị trí" span={3}>
            <Text>{extractedInfo.landLocation || 'Không tìm thấy'}</Text>
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        <Title level={5}>Chi tiết xác thực</Title>
        <Descriptions bordered size="small">
          <Descriptions.Item label="CCCD khớp">
            <Tag color={verification.cccdVerified ? 'green' : 'red'}>
              {verification.cccdVerified ? 'Có' : 'Không'}
            </Tag>
          </Descriptions.Item>
          
          <Descriptions.Item label="Mã thửa đất khớp">
            <Tag color={verification.landParcelVerified ? 'green' : 'red'}>
              {verification.landParcelVerified ? 'Có' : 'Không'}
            </Tag>
          </Descriptions.Item>
          
          <Descriptions.Item label="Tổng thể">
            <Tag color={verification.overallVerified ? 'green' : 'red'}>
              {verification.overallVerified ? 'Hợp lệ' : 'Không hợp lệ'}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </div>
    );
  };

  return (
    <>
      <Card
        title={
          <Space>
            <FileTextOutlined />
            <span>Xác thực tài liệu nâng cao</span>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<SearchOutlined />}
              onClick={handleAnalyzeDocument}
              loading={loading}
            >
              Phân tích PDF
            </Button>
            <Button
              icon={<EyeOutlined />}
              onClick={() => window.open(`https://ipfs.io/ipfs/${document.ipfsHash}`, '_blank')}
            >
              Xem tài liệu
            </Button>
          </Space>
        }
      >
        <Descriptions bordered>
          <Descriptions.Item label="ID tài liệu" span={2}>
            {document.docID}
          </Descriptions.Item>
          
          <Descriptions.Item label="IPFS Hash" span={2}>
            <Text code>{document.ipfsHash}</Text>
          </Descriptions.Item>
          
          <Descriptions.Item label="Mô tả" span={2}>
            {document.description || 'Không có mô tả'}
          </Descriptions.Item>
          
          <Descriptions.Item label="Trạng thái" span={2}>
            <Tag color={document.status === 'Pending' ? 'orange' : 'green'}>
              {document.status}
            </Tag>
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        <Form
          form={verificationForm}
          layout="vertical"
          onFinish={handleVerifyDocument}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="expectedCCCD"
                label="CCCD mong đợi"
                rules={[{ required: true, message: 'Vui lòng nhập CCCD' }]}
              >
                <Input placeholder="Nhập CCCD để xác thực" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="expectedLandParcelID"
                label="Mã thửa đất mong đợi"
              >
                <Input placeholder="Nhập mã thửa đất (tùy chọn)" />
              </Form.Item>
            </Col>
          </Row>

          <Space>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => verificationForm.submit()}
              loading={loading}
            >
              Chứng thực
            </Button>
            
            <Button
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => onReject && onReject(document.docID)}
            >
              Từ chối
            </Button>
          </Space>
        </Form>
      </Card>

      <Modal
        title={
          <Space>
            <InfoCircleOutlined />
            <span>Kết quả phân tích PDF</span>
          </Space>
        }
        open={analysisModalVisible}
        onCancel={() => setAnalysisModalVisible(false)}
        footer={null}
        width={800}
      >
        {renderAnalysisResult()}
      </Modal>
    </>
  );
};

export default EnhancedDocumentVerification; 