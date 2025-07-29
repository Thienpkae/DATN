import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Card, Select, message, Typography, Alert } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined, IdcardOutlined } from '@ant-design/icons';
import { register, registerCitizen } from '../../services/auth';

const { Title, Text } = Typography;
const { Option } = Select;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if this is admin registration (from admin panel)
  const isAdminRegistration = location.state?.isAdminRegistration || false;

  const onFinish = async (values) => {
    setLoading(true);
    try {
      if (!isAdminRegistration) {
        // Citizens: always org3, role user, no userId
        const citizenData = {
          ...values,
          org: 'Org3',
          role: 'user',
        };
        await registerCitizen(citizenData);
        message.success('Registration successful! Please verify your phone number.');
        navigate('/verify-otp');
      } else {
        // Admin registration for org1 and org2 users
        await register(values);
        message.success('Account created successfully! Admin approval required.');
        navigate('/login');
      }
    } catch (error) {
      message.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center-content" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Card style={{ width: 500, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2}>Land Registry System</Title>
          <Text type="secondary">
            {isAdminRegistration ? 'Create Admin Account' : 'Create Citizen Account'}
          </Text>
        </div>
        
        {isAdminRegistration && (
          <Alert
            message="Admin Account Registration"
            description="Registration for Land Authority and Government Officers requires admin approval. Your account will be activated after verification."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        {!isAdminRegistration && (
          <Alert
            message="Citizen Registration"
            description="Register as a citizen to manage your land parcels and access services."
            type="success"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}
        
        <Form
          name="register"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          {isAdminRegistration && (
            <>
              <Form.Item
                name="userType"
                label="Account Type"
                rules={[{ required: true, message: 'Please select account type!' }]}
                initialValue="authority"
              >
                <Select placeholder="Select account type">
                  <Option value="authority">Land Authority</Option>
                  <Option value="officer">Government Officer</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="org"
                label="Organization"
                rules={[{ required: true, message: 'Please select organization!' }]}
              >
                <Select placeholder="Select your organization">
                  <Option value="Org1">Land Authority</Option>
                  <Option value="Org2">Government Officers</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="userId"
                label="User ID"
                rules={[{ required: true, message: 'Please input your user ID!' }]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="Enter user ID"
                />
              </Form.Item>
            </>
          )}

          <Form.Item
            name="fullName"
            label="Full Name"
            rules={[{ required: true, message: 'Please input your full name!' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Enter your full name"
            />
          </Form.Item>

          <Form.Item
            name="cccd"
            label="CCCD Number"
            rules={[
              { required: true, message: 'Please input your CCCD!' },
              { len: 12, message: 'CCCD must be 12 digits!' }
            ]}
          >
            <Input 
              prefix={<IdcardOutlined />} 
              placeholder="Enter 12-digit CCCD number"
            />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone Number"
            rules={[
              { required: true, message: 'Please input your phone number!' },
              { pattern: /^[0-9]{10}$/, message: 'Phone number must be 10 digits!' }
            ]}
          >
            <Input 
              prefix={<PhoneOutlined />} 
              placeholder="Enter 10-digit phone number"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: 'Please input your password!' },
              { min: 8, message: 'Password must be at least 8 characters!' }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Enter password (min 8 characters)"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match!'));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Confirm your password"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              style={{ width: '100%', height: 40 }}
            >
              {isAdminRegistration ? 'Create Admin Account' : 'Register as Citizen'}
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">Already have an account? </Text>
            <Link to="/login">Login here</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Register;
