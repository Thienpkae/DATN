import React, { useState } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Select, 
  message, 
  Typography,
  Row,
  Col,
  Space,
  Divider
} from 'antd';
import { 
  SendOutlined
} from '@ant-design/icons';
import { transactionAPI } from '../../services/api';

const { Title } = Typography;
const { Option } = Select;

const TransactionRequests = ({ user }) => {
  const [form] = Form.useForm();
  const [requestType, setRequestType] = useState('transfer');
  const [loading, setLoading] = useState(false);

  const handleSubmitRequest = async (values) => {
    setLoading(true);
    try {
      const requestData = {
        ...values,
        txID: `TX${Date.now()}`, // Generate unique transaction ID
        txType: requestType, // Add transaction type
      };

      // Handle specific data for split and merge requests
      if (requestType === 'split') {
        requestData.newParcels = JSON.parse(values.newParcels || '[]');
      } else if (requestType === 'merge') {
        requestData.parcelIDs = values.parcelIDs.split(',').map(id => id.trim());
        requestData.newParcel = JSON.parse(values.newParcel || '{}');
      }

      await transactionAPI.create(requestData);

      message.success('Request submitted successfully');
      form.resetFields();
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const renderRequestForm = () => {
    switch (requestType) {
      case 'transfer':
        return (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="landParcelID"
                  label="Land Parcel ID"
                  rules={[{ required: true, message: 'Please input land parcel ID!' }]}
                >
                  <Input placeholder="Enter land parcel ID" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="toOwnerID"
                  label="Transfer To (Owner ID)"
                  rules={[{ required: true, message: 'Please input new owner ID!' }]}
                >
                  <Input placeholder="Enter new owner ID" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name="fromOwnerID"
              label="Current Owner ID"
              initialValue={user.userId}
              rules={[{ required: true }]}
            >
              <Input disabled />
            </Form.Item>
            <Form.Item
              name="details"
              label="Transfer Details"
              rules={[{ required: true, message: 'Please provide transfer details!' }]}
            >
              <Input.TextArea placeholder="Provide details about the transfer" rows={3} />
            </Form.Item>
          </>
        );

      case 'split':
        return (
          <>
            <Form.Item
              name="landParcelID"
              label="Land Parcel ID to Split"
              rules={[{ required: true, message: 'Please input land parcel ID!' }]}
            >
              <Input placeholder="Enter land parcel ID" />
            </Form.Item>
            <Form.Item
              name="ownerID"
              label="Owner ID"
              initialValue={user.userId}
              rules={[{ required: true }]}
            >
              <Input disabled />
            </Form.Item>
            <Form.Item
              name="newParcels"
              label="New Parcels (JSON format)"
              rules={[{ required: true, message: 'Please provide new parcels data!' }]}
            >
              <Input.TextArea 
                placeholder='[{"id": "P001", "area": "500", "location": "North section"}]'
                rows={4}
              />
            </Form.Item>
          </>
        );

      case 'merge':
        return (
          <>
            <Form.Item
              name="parcelIDs"
              label="Parcel IDs to Merge (comma-separated)"
              rules={[{ required: true, message: 'Please input parcel IDs!' }]}
            >
              <Input placeholder="P001, P002, P003" />
            </Form.Item>
            <Form.Item
              name="ownerID"
              label="Owner ID"
              initialValue={user.userId}
              rules={[{ required: true }]}
            >
              <Input disabled />
            </Form.Item>
            <Form.Item
              name="newParcel"
              label="New Merged Parcel (JSON format)"
              rules={[{ required: true, message: 'Please provide new parcel data!' }]}
            >
              <Input.TextArea 
                placeholder='{"id": "P004", "area": "1500", "location": "Combined area"}'
                rows={3}
              />
            </Form.Item>
          </>
        );

      case 'changePurpose':
        return (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="landParcelID"
                  label="Land Parcel ID"
                  rules={[{ required: true, message: 'Please input land parcel ID!' }]}
                >
                  <Input placeholder="Enter land parcel ID" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="newPurpose"
                  label="New Purpose"
                  rules={[{ required: true, message: 'Please select new purpose!' }]}
                >
                  <Select placeholder="Select new purpose">
                    <Option value="residential">Residential</Option>
                    <Option value="commercial">Commercial</Option>
                    <Option value="agricultural">Agricultural</Option>
                    <Option value="industrial">Industrial</Option>
                    <Option value="other">Other</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name="ownerID"
              label="Owner ID"
              initialValue={user.userId}
              rules={[{ required: true }]}
            >
              <Input disabled />
            </Form.Item>
            <Form.Item
              name="details"
              label="Change Details"
              rules={[{ required: true, message: 'Please provide change details!' }]}
            >
              <Input.TextArea placeholder="Provide reason for purpose change" rows={3} />
            </Form.Item>
          </>
        );

      case 'reissue':
        return (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="landParcelID"
                  label="Land Parcel ID"
                  rules={[{ required: true, message: 'Please input land parcel ID!' }]}
                >
                  <Input placeholder="Enter land parcel ID" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="ownerID"
                  label="Owner ID"
                  initialValue={user.userId}
                  rules={[{ required: true }]}
                >
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name="details"
              label="Reissue Reason"
              rules={[{ required: true, message: 'Please provide reissue reason!' }]}
            >
              <Input.TextArea placeholder="Provide reason for certificate reissue" rows={3} />
            </Form.Item>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <Title level={2}>Submit Transaction Requests</Title>
      
      <Card title="Create New Request">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitRequest}
        >
          <Form.Item label="Request Type">
            <Select 
              value={requestType} 
              onChange={setRequestType}
              size="large"
            >
              <Option value="transfer">Land Transfer</Option>
              <Option value="split">Land Split</Option>
              <Option value="merge">Land Merge</Option>
              <Option value="changePurpose">Change Purpose</Option>
              <Option value="reissue">Certificate Reissue</Option>
            </Select>
          </Form.Item>

          <Divider />

          {renderRequestForm()}

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<SendOutlined />}
                size="large"
              >
                Submit Request
              </Button>
              <Button 
                onClick={() => form.resetFields()}
                size="large"
              >
                Reset
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default TransactionRequests;
