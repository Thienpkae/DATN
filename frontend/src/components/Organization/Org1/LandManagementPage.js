import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Space, Tag, message, Drawer, Row, Col, Tabs, List, Typography, Tooltip, Upload, Alert, Divider, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, SearchOutlined, ReloadOutlined, HistoryOutlined, FileDoneOutlined, EyeOutlined, LinkOutlined, FileTextOutlined, UploadOutlined } from '@ant-design/icons';
import landService from '../../../services/landService';
import documentService from '../../../services/documentService';
import ipfsService from '../../../services/ipfs';
import { DocumentLinker, DocumentViewer } from '../../Common';
import { LAND_USE_PURPOSES, LEGAL_STATUSES } from '../../../services/index';

const { Option } = Select;
const { TabPane } = Tabs;
const { Text } = Typography;
const { TextArea } = Input;

const defaultFilters = {
  keyword: '',
  landUsePurpose: undefined,
  legalStatus: undefined,
  minArea: undefined,
  maxArea: undefined,
};

const LandManagementPage = () => {
  const [loading, setLoading] = useState(false);
  const [lands, setLands] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [issueForm] = Form.useForm();
  
  // Document linking states
  const [documentLinkerOpen, setDocumentLinkerOpen] = useState(false);
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [linkedDocuments, setLinkedDocuments] = useState([]);
  const [uploadingCertificate, setUploadingCertificate] = useState(false);
  const [certificateFile, setCertificateFile] = useState(null);
  const [certificateFileList, setCertificateFileList] = useState([]);

  // Helper to sort by MapNumber and PlotNumber
  function sortLandIds(lands) {
    return [...lands].sort((a, b) => {
      const parse = (id) => {
        if (!id) return [0, 0];
        const parts = id.split('-');
        const map = parseInt(parts[0], 10) || 0;
        const plot = parseInt(parts[1], 10) || 0;
        return [map, plot];
      };
      const [mapA, plotA] = parse(a.id);
      const [mapB, plotB] = parse(b.id);
      if (mapA !== mapB) return mapA - mapB;
      return plotA - plotB;
    });
  }

  const loadList = React.useCallback(async () => {
    try {
      setLoading(true);
      let res = await landService.getAllLandParcels();
      let data = Array.isArray(res) ? res : (res?.data ?? []);
      if (!data || data.length === 0) {
        const sres = await landService.searchLandParcels({ keyword: '' });
        data = Array.isArray(sres) ? sres : (sres?.data ?? []);
      }
      setLands(sortLandIds(data));
    } catch (e) {
      message.error(e.message || 'Không tải được danh sách thửa đất');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const onSearch = async () => {
    try {
      setLoading(true);
      const params = {
        keyword: filters.keyword || '',
        landUsePurpose: filters.landUsePurpose,
        legalStatus: filters.legalStatus,
        minArea: filters.minArea,
        maxArea: filters.maxArea,
      };
      const res = await landService.advancedSearch(params);
      const data = Array.isArray(res) ? res : (res?.data ?? []);
      setLands(sortLandIds(data));
    } catch (e) {
      message.error(e.message || 'Tìm kiếm thất bại');
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (record) => {
    try {
      setSelected(record);
      setDetailOpen(true);
      const res = await landService.getLandParcelHistory(record.id || record.ID || record.landId);
      setHistory(Array.isArray(res) ? res : (res?.data ?? []));
      
      // Load linked documents
      if (record.documentIds && record.documentIds.length > 0) {
        setLinkedDocuments(record.documentIds);
      } else {
        setLinkedDocuments([]);
      }
    } catch (e) {
      setHistory([]);
      setLinkedDocuments([]);
    }
  };

  const onCreate = async () => {
    try {
      const values = await form.validateFields();
      const landId = values.id;
      const validation = landService.validateLandData({
        id: landId,
        ownerID: values.ownerID,
        area: values.area,
        location: values.location,
        landUsePurpose: values.landUsePurpose,
        legalStatus: values.legalStatus,
        legalInfo: values.legalInfo
      });
      if (!validation.isValid) {
        message.warning(validation.errors.join('\n'));
        return;
      }
      setLoading(true);
      await landService.createLandParcel({
        id: landId,
        ownerID: values.ownerID,
        area: Number(values.area),
        location: values.location,
        landUsePurpose: values.landUsePurpose,
        legalStatus: values.legalStatus,
        legalInfo: values.legalInfo
      });
      message.success('Tạo thửa đất thành công');
      setCreateOpen(false);
      form.resetFields();
      loadList();
    } catch (e) {
      message.error(e.message || 'Tạo thửa đất thất bại');
    } finally {
      setLoading(false);
    }
  };

  const onEdit = async () => {
    try {
      const values = await editForm.validateFields();
      setLoading(true);
      await landService.updateLandParcel(values.id, {
        area: Number(values.area),
        location: values.location,
        landUsePurpose: values.landUsePurpose,
        legalStatus: values.legalStatus,
        legalInfo: values.legalInfo
      });
      message.success('Cập nhật thửa đất thành công');
      setEditOpen(false);
      loadList();
    } catch (e) {
      message.error(e.message || 'Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  const onIssueCertificate = async () => {
    try {
      const values = await issueForm.validateFields();
      
      if (!certificateFile) {
        message.error('Vui lòng chọn file giấy chứng nhận');
        return;
      }

      setUploadingCertificate(true);

      // Upload certificate file to IPFS
      const certificateMetadata = {
        docID: `CERT_${values.landId}_${Date.now()}`,
        docType: 'CERTIFICATE',
        title: `Giấy chứng nhận thửa đất ${values.landId}`,
        description: `Giấy chứng nhận quyền sử dụng đất cho thửa đất ${values.landId}`,
        organization: 'Org1',
        uploadedBy: 'SYSTEM'
      };

      const uploadResult = await ipfsService.uploadDocumentToIPFS(
        certificateFile,
        certificateMetadata,
        null
      );

      // Create certificate document
      await documentService.createDocument({
        docID: certificateMetadata.docID,
        docType: 'CERTIFICATE',
        title: certificateMetadata.title,
        description: certificateMetadata.description,
        ipfsHash: uploadResult.fileHash,
        metadataHash: uploadResult.metadataHash,
        fileType: certificateFile.type || certificateFile.name.split('.').pop().toUpperCase(),
        fileSize: certificateFile.size
      });

      // Update land parcel with certificate ID
      await landService.updateLandParcel(values.landId, {
        certificateId: certificateMetadata.docID
      });

      message.success('Cấp giấy chứng nhận thành công');
      setIssueOpen(false);
      issueForm.resetFields();
      setCertificateFile(null);
      setCertificateFileList([]);
      loadList();
      openDetail(selected);
    } catch (e) {
      message.error(e.message || 'Cấp giấy chứng nhận thất bại');
    } finally {
      setUploadingCertificate(false);
    }
  };

  const handleCertificateFileChange = (info) => {
    if (info.file.status === 'removed') {
      setCertificateFile(null);
      setCertificateFileList([]);
      return;
    }
    
    const file = info.file.originFileObj;
    if (file) {
      setCertificateFile(file);
      setCertificateFileList([info.file]);
    }
  };

  const openDocumentLinker = () => {
    setDocumentLinkerOpen(true);
  };

  const openDocumentViewer = (document) => {
    setSelectedDocument(document);
    setDocumentViewerOpen(true);
  };

  const handleDocumentLinkSuccess = () => {
    // Reload land details to get updated document list
    if (selected) {
      openDetail(selected);
    }
  };

  const columns = useMemo(() => ([
    { title: 'Mã thửa đất', dataIndex: 'id', key: 'id', render: v => <code>{v}</code> },
    { title: 'Chủ sử dụng', dataIndex: 'ownerId', key: 'ownerId' },
    { title: 'Diện tích (m²)', dataIndex: 'area', key: 'area' },
    { title: 'Vị trí', dataIndex: 'location', key: 'location' },
    { title: 'Mục đích sử dụng', dataIndex: 'landUsePurpose', key: 'landUsePurpose', render: v => <Tag color="blue">{v}</Tag> },
    { title: 'Trạng thái pháp lý', dataIndex: 'legalStatus', key: 'legalStatus', render: v => <Tag color={v === 'LUA' ? 'green' : v === 'HNK' ? 'blue' : 'default'}>{v}</Tag> },
    { title: 'Giấy chứng nhận', dataIndex: 'certificateId', key: 'certificateId', render: v => v ? <Tag color="green">{v}</Tag> : <Tag color="red">Chưa có</Tag> },
    {
      title: 'Thao tác', key: 'actions', fixed: 'right', render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button icon={<EyeOutlined />} onClick={() => openDetail(record)} />
          </Tooltip>
          <Tooltip title="Cấp giấy chứng nhận">
            <Button 
              icon={<FileDoneOutlined />} 
              onClick={() => {
                issueForm.setFieldsValue({ landId: record.id });
                setIssueOpen(true);
              }}
              disabled={!!record.certificateId}
            />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button icon={<EditOutlined />} onClick={() => {
              setSelected(record);
              editForm.setFieldsValue({
                id: record.id,
                area: record.area,
                location: record.location,
                landUsePurpose: record.landUsePurpose,
                legalStatus: record.legalStatus,
                legalInfo: record.legalInfo
              });
              setEditOpen(true);
            }} />
          </Tooltip>
        </Space>
      )
    }
  ]), [issueForm, editForm]);

  return (
    <div>
      <Card
        title="Quản lý thửa đất (Org1)"
        extra={
          <Space>
            <Input
              placeholder="Từ khóa"
              allowClear
              style={{ width: 200 }}
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            />
            <Select placeholder="Mục đích sử dụng" allowClear style={{ width: 150 }} value={filters.landUsePurpose} onChange={(v) => setFilters({ ...filters, landUsePurpose: v })}>
              {Object.entries(LAND_USE_PURPOSES).map(([key, value]) => (
                <Option key={key} value={key}>{key} - {value}</Option>
              ))}
            </Select>
            <Select placeholder="Trạng thái pháp lý" allowClear style={{ width: 150 }} value={filters.legalStatus} onChange={(v) => setFilters({ ...filters, legalStatus: v })}>
              {Object.entries(LEGAL_STATUSES).map(([key, value]) => (
                <Option key={key} value={key}>{key} - {value}</Option>
              ))}
            </Select>
            <Button icon={<SearchOutlined />} onClick={onSearch}>Tìm kiếm</Button>
            <Button icon={<ReloadOutlined />} onClick={loadList}>Tải lại</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>Tạo thửa đất</Button>
          </Space>
        }
      >
        <Table
          rowKey={(r) => r.id}
          loading={loading}
          dataSource={lands}
          columns={columns}
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />

        {/* Create Land Parcel */}
        <Modal title="Tạo thửa đất mới" open={createOpen} onOk={onCreate} onCancel={() => setCreateOpen(false)} confirmLoading={loading} width={720}>
          <Form layout="vertical" form={form}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="id"
                  label="Mã thửa đất"
                  rules={[
                    { required: true, message: 'Bắt buộc' },
                    { pattern: /^\d+-\d+$/, message: 'Định dạng phải là Số tờ-Số thửa, ví dụ: 1-2' }
                  ]}
                >
                  <Input placeholder="Ví dụ: 1-2" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="ownerID"
                  label="CCCD Chủ sử dụng"
                  rules={[ 
                    { required: true, message: 'Bắt buộc' },
                    { pattern: /^\d{12}$/,
                      message: 'CCCD phải gồm đúng 12 chữ số' }
                  ]}
                >
                  <Input maxLength={12} inputMode="numeric" pattern="[0-9]*" placeholder="Nhập 12 số CCCD" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="area" label="Diện tích (m²)" rules={[{ required: true, message: 'Bắt buộc' }, { type: 'number', min: 0.1, message: 'Diện tích phải lớn hơn 0' }]}>
                  <InputNumber min={0.1} step={0.01} precision={2} style={{ width: '100%' }} placeholder="Nhập diện tích" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="location" label="Vị trí" rules={[{ required: true, message: 'Bắt buộc' }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="landUsePurpose" label="Mục đích sử dụng đất" rules={[{ required: true, message: 'Bắt buộc' }]}>
                  <Select placeholder="Chọn">
                    {Object.entries(LAND_USE_PURPOSES).map(([key, value]) => (
                      <Option key={key} value={key}>{key} - {value}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="legalStatus" label="Trạng thái pháp lý" rules={[{ required: true, message: 'Bắt buộc' }]}>
                  <Select placeholder="Chọn">
                    {Object.entries(LEGAL_STATUSES).map(([key, value]) => (
                      <Option key={key} value={key}>{key} - {value}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="legalInfo" label="Thông tin pháp lý">
              <TextArea rows={4} />
            </Form.Item>
          </Form>
        </Modal>

        {/* Edit Land Parcel */}
        <Modal title="Cập nhật thửa đất" open={editOpen} onOk={onEdit} onCancel={() => setEditOpen(false)} confirmLoading={loading} width={720}>
          <Form layout="vertical" form={editForm}>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="id"
                  label="Mã thửa đất (không thay đổi)"
                  rules={[
                    { required: true, message: 'Bắt buộc' },
                    { pattern: /^\d+-\d+$/, message: 'Định dạng phải là Số tờ-Số thửa, ví dụ: 1-2' }
                  ]}
                >
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="area" label="Diện tích (m²)" rules={[{ required: true, message: 'Bắt buộc' }, { type: 'number', min: 0.1, message: 'Diện tích phải lớn hơn 0' }]}>
                  <InputNumber min={0.1} step={0.01} precision={2} style={{ width: '100%' }} placeholder="Nhập diện tích" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="location" label="Vị trí" rules={[{ required: true, message: 'Bắt buộc' }]}>
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="landUsePurpose" label="Mục đích sử dụng đất" rules={[{ required: true, message: 'Bắt buộc' }]}>
                  <Select placeholder="Chọn">
                    {Object.entries(LAND_USE_PURPOSES).map(([key, value]) => (
                      <Option key={key} value={key}>{key} - {value}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="legalStatus" label="Trạng thái pháp lý" rules={[{ required: true, message: 'Bắt buộc' }]}>
                  <Select placeholder="Chọn">
                    {Object.entries(LEGAL_STATUSES).map(([key, value]) => (
                      <Option key={key} value={key}>{key} - {value}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="legalInfo" label="Thông tin pháp lý">
              <TextArea rows={4} />
            </Form.Item>
          </Form>
        </Modal>

        {/* Issue Certificate */}
        <Modal 
          title="Cấp giấy chứng nhận quyền sử dụng đất" 
          open={issueOpen} 
          onOk={onIssueCertificate} 
          onCancel={() => {
            setIssueOpen(false);
            setCertificateFile(null);
            setCertificateFileList([]);
          }} 
          confirmLoading={uploadingCertificate} 
          width={720}
          okText="Cấp giấy chứng nhận"
          cancelText="Hủy"
        >
          <Form layout="vertical" form={issueForm}>
            <Form.Item name="landId" label="Mã thửa đất">
              <Input disabled />
            </Form.Item>
            
            <Divider>Upload file giấy chứng nhận lên IPFS</Divider>
            
            <Form.Item label="Chọn file giấy chứng nhận" required>
              <Upload
                fileList={certificateFileList}
                beforeUpload={() => false}
                onChange={handleCertificateFileChange}
                maxCount={1}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              >
                <Button icon={<UploadOutlined />}>Chọn file</Button>
              </Upload>
              <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                Hỗ trợ: PDF, DOC, DOCX, JPG, PNG. Tối đa 50MB
              </div>
            </Form.Item>

            {certificateFile && (
              <Alert
                message={`File đã chọn: ${certificateFile.name}`}
                description={`Kích thước: ${(certificateFile.size / 1024).toFixed(2)} KB | Loại: ${certificateFile.type || 'Không xác định'}`}
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
          </Form>
        </Modal>

        {/* Land Detail Drawer */}
        <Drawer title={`Chi tiết thửa đất: ${selected?.id}`} width={800} open={detailOpen} onClose={() => setDetailOpen(false)}>
          {selected && (
            <Tabs defaultActiveKey="1">
              <TabPane tab="Thông tin cơ bản" key="1">
                <Row gutter={16}>
                  <Col span={12}>
                    <Text strong>Mã thửa đất:</Text>
                    <br />
                    <Text type="secondary">{selected.id}</Text>
                  </Col>
                  <Col span={12}>
                    <Text strong>CCCD Chủ sử dụng:</Text>
                    <br />
                    <Text type="secondary">{selected.ownerId}</Text>
                  </Col>
                  <Col span={12}>
                    <Text strong>Diện tích:</Text>
                    <br />
                    <Text type="secondary">{selected.area} m²</Text>
                  </Col>
                  <Col span={12}>
                    <Text strong>Vị trí:</Text>
                    <br />
                    <Text type="secondary">{selected.location}</Text>
                  </Col>
                  <Col span={12}>
                    <Text strong>Mục đích sử dụng đất:</Text>
                    <br />
                    <Tag color="blue">{selected.landUsePurpose}</Tag>
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      {LAND_USE_PURPOSES[selected.landUsePurpose]}
                    </Text>
                  </Col>
                  <Col span={12}>
                    <Text strong>Tình trạng pháp lý:</Text>
                    <br />
                    <Tag color={selected.legalStatus === 'LUA' ? 'green' : selected.legalStatus === 'HNK' ? 'blue' : 'default'}>
                      {selected.legalStatus}
                    </Tag>
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      {LEGAL_STATUSES[selected.legalStatus]}
                    </Text>
                  </Col>
                  <Col span={12}>
                    <Text strong>Mã giấy chứng nhận:</Text>
                    <br />
                    {selected.certificateId ? (
                      <div>
                        <Tag color="green">{selected.certificateId}</Tag>
                        <Button 
                          type="link" 
                          size="small" 
                          icon={<EyeOutlined />}
                          onClick={() => {
                            // Tìm tài liệu certificate và mở viewer
                            const certDoc = linkedDocuments.find(doc => doc.docID === selected.certificateId);
                            if (certDoc) {
                              openDocumentViewer(certDoc);
                            } else {
                              message.info('Không thể tìm thấy thông tin giấy chứng nhận');
                            }
                          }}
                          style={{ padding: 0, marginLeft: 8 }}
                        >
                          Xem
                        </Button>
                      </div>
                    ) : (
                      <Text type="secondary">Chưa có</Text>
                    )}
                  </Col>
                  <Col span={24}>
                    <Text strong>Thông tin pháp lý bổ sung:</Text>
                    <br />
                    <Text>{selected.legalInfo || 'Không có'}</Text>
                  </Col>
                  <Col span={12}>
                    <Text strong>Ngày tạo:</Text>
                    <br />
                    <Text>{selected.createdAt ? new Date(selected.createdAt).toLocaleString('vi-VN') : 'N/A'}</Text>
                  </Col>
                  <Col span={12}>
                    <Text strong>Ngày cập nhật:</Text>
                    <br />
                    <Text>{selected.updatedAt ? new Date(selected.updatedAt).toLocaleString('vi-VN') : 'N/A'}</Text>
                  </Col>
                </Row>
              </TabPane>
              <TabPane tab="Tài liệu liên quan" key="2">
                <div style={{ marginBottom: 16 }}>
                  <Button
                    type="primary"
                    icon={<LinkOutlined />}
                    onClick={openDocumentLinker}
                  >
                    Liên kết tài liệu
                  </Button>
                </div>
                <List
                  header={<div><strong>Danh sách tài liệu ({linkedDocuments.length})</strong></div>}
                  bordered
                  dataSource={linkedDocuments}
                  renderItem={(docId, index) => (
                    <List.Item
                      actions={[
                        <Button
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => {
                            // Tìm tài liệu và mở viewer
                            const doc = linkedDocuments.find(d => d.docID === docId);
                            if (doc) {
                              openDocumentViewer(doc);
                            } else {
                              message.info('Không thể tìm thấy thông tin tài liệu');
                            }
                          }}
                        >
                          Xem
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<FileTextOutlined />}
                        title={`Tài liệu ${index + 1}`}
                        description={`ID: ${docId}`}
                      />
                    </List.Item>
                  )}
                  locale={{ emptyText: 'Chưa có tài liệu nào được liên kết' }}
                />
              </TabPane>
              <TabPane tab="Lịch sử thửa đất" key="3">
                <div style={{ marginBottom: 16 }}>
                  <Button
                    icon={<HistoryOutlined />}
                    onClick={() => {
                      openDetail(selected);
                    }}
                  >
                    Tải lại lịch sử
                  </Button>
                </div>
                <List
                  header={<div><strong>Lịch sử thay đổi thửa đất ({history.length})</strong></div>}
                  bordered
                  dataSource={history}
                  renderItem={(item, index) => (
                    <List.Item>
                      <List.Item.Meta
                        title={`Thay đổi ${index + 1}`}
                        description={
                          <div>
                            <div><strong>Transaction ID:</strong> {item.txId || 'N/A'}</div>
                            <div><strong>Thời gian:</strong> {item.timestamp ? new Date(item.timestamp.seconds * 1000).toLocaleString('vi-VN') : 'N/A'}</div>
                            <div><strong>Trạng thái:</strong> {item.isDelete ? 'Vô hiệu' : 'Hiệu lực'}</div>
                            {item.land && (
                              <div style={{ marginTop: 8 }}>
                                <div><strong>Diện tích:</strong> {item.land.area} m²</div>
                                <div><strong>Mục đích sử dụng đất:</strong> {item.land.landUsePurpose}</div>
                                <div><strong>Pháp lý:</strong> {item.land.legalStatus}</div>
                              </div>
                            )}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                  locale={{ emptyText: 'Chưa có lịch sử thay đổi' }}
                />
              </TabPane>
            </Tabs>
          )}
        </Drawer>

        {/* Document Linker Modal */}
        <DocumentLinker
          visible={documentLinkerOpen}
          onCancel={() => setDocumentLinkerOpen(false)}
          onSuccess={handleDocumentLinkSuccess}
          targetType="land"
          targetID={selected?.id}
          linkedDocuments={linkedDocuments}
        />

        {/* Document Viewer Modal */}
        <DocumentViewer
          visible={documentViewerOpen}
          onCancel={() => setDocumentViewerOpen(false)}
          documentData={selectedDocument}
        />
      </Card>
    </div>
  );
};

export default LandManagementPage;