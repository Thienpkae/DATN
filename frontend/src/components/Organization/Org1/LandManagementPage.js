import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Space, Tag, message, Drawer, Row, Col, Tabs, List, Typography, Tooltip, Upload, Alert, Divider, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, SearchOutlined, ReloadOutlined, HistoryOutlined, FileDoneOutlined, EyeOutlined, LinkOutlined, FileTextOutlined, UploadOutlined } from '@ant-design/icons';
import landService from '../../../services/landService';
import authService from '../../../services/auth';
import documentService from '../../../services/documentService';
import ipfsService from '../../../services/ipfs';

import DocumentDetailModal from '../../Common/DocumentDetailModal';
import OnlineDocumentViewer from '../../Common/OnlineDocumentViewer';
import { LAND_USE_PURPOSES, LEGAL_STATUSES } from '../../../services/index';

const { Option } = Select;

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

  // Helper function để map mục đích sử dụng đất sang trạng thái pháp lý
  const getLegalStatusByLandUse = (landUsePurpose) => {
    const mapping = {
      'BHK': 'HNK',      // Đất bằng trồng cây hàng năm khác → HNK
      'LUC': 'LUA',      // Đất lúa → LUA
      'ONT': 'ONT*',     // Đất ở tại nông thôn → ONT*
      'LNQ': 'CLN',      // Đất lâm nghiệp → CLN
    };
    return mapping[landUsePurpose] || '';
  };
  
  // Document linking states
  const [documentDetailOpen, setDocumentDetailOpen] = useState(false);
  const [onlineViewerOpen, setOnlineViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [linkedDocuments, setLinkedDocuments] = useState([]);
  const [availableDocuments, setAvailableDocuments] = useState([]);
  const [selectedDocumentsForLinking, setSelectedDocumentsForLinking] = useState([]);
  const [linkingDocuments, setLinkingDocuments] = useState(false);
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

  const openDetail = React.useCallback(async (record) => {
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
      
      // Load available documents for linking
      await loadAvailableDocuments();
    } catch (e) {
      setHistory([]);
      setLinkedDocuments([]);
    }
  }, []);

  const onCreate = async () => {
    try {
      const values = await form.validateFields();
      const landId = values.id;

      setLoading(true);
      await landService.createLandParcel({
        id: landId,
        ownerID: values.ownerID,
        area: Number(values.area),
        location: values.location,
        landUsePurpose: values.landUsePurpose,
        legalStatus: '', // Không có trạng thái pháp lý khi tạo mới
        certificateId: '', // Không có mã GCN khi tạo mới
        legalInfo: ''     // Không có thông tin pháp lý khi tạo mới
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
        legalStatus: '', // Không cho phép thay đổi trạng thái pháp lý
        legalInfo: ''   // Không cho phép thay đổi thông tin pháp lý
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
      const currentUser = authService.getCurrentUser();
      
      if (!certificateFile) {
        message.error('Vui lòng chọn file giấy chứng nhận');
        return;
      }

      setUploadingCertificate(true);

      // Build certificate identifiers from form inputs
      const normalizedSerial = String(values.serialNumber || '').trim();
      const normalizedRegistry = String(values.registryNumber || '').trim();
      const generatedDocId = `${normalizedSerial}-${normalizedRegistry}`;

      // Upload certificate file to IPFS (metadata for reference only)
      const certificateMetadata = {
        docID: generatedDocId,
        docType: 'CERTIFICATE',
        title: `Giấy chứng nhận thửa đất ${values.landId}`,
        description: `GCN: Số seri ${normalizedSerial} - Số vào sổ ${normalizedRegistry}`,
        organization: 'Org1',
        uploadedBy: currentUser?.userId || 'UNKNOWN'
      };

      const uploadResult = await ipfsService.uploadDocumentToIPFS(
        certificateFile,
        certificateMetadata,
        null
      );

      // Create certificate document (verified by authority)
      const createDocResult = await documentService.createDocument({
        docID: certificateMetadata.docID,
        docType: 'CERTIFICATE',
        title: certificateMetadata.title,
        description: certificateMetadata.description,
        ipfsHash: uploadResult.fileHash,
        metadataHash: uploadResult.metadataHash,
        fileType: certificateFile.type || certificateFile.name.split('.').pop().toUpperCase(),
        fileSize: certificateFile.size,
        status: 'VERIFIED'
      });

      console.log('Certificate document created:', createDocResult);

      // Update land parcel with certificate ID, legal info and legal status
      await landService.updateLandParcel(values.landId, {
        certificateId: certificateMetadata.docID,
        legalInfo: values.legalInfo,
        legalStatus: values.legalStatus
      });

      message.success('Cấp giấy chứng nhận thành công');
      setIssueOpen(false);
      issueForm.resetFields();
      setCertificateFile(null);
      setCertificateFileList([]);
      loadList();
      
      // Dispatch custom event to notify document management pages to refresh
      window.dispatchEvent(new CustomEvent('documentCreated', {
        detail: { documentId: certificateMetadata.docID }
      }));
    } catch (e) {
      message.error(e.message || 'Cấp giấy chứng nhận thất bại');
    } finally {
      setUploadingCertificate(false);
    }
  };

  const handleCertificateFileChange = (info) => {
    const { fileList: newFileList } = info;
    
    if (newFileList.length === 0) {
      // File removed
      setCertificateFile(null);
      setCertificateFileList([]);
      return;
    }
    
    const file = info.file.originFileObj || info.file;
    if (file) {
      setCertificateFile(file);
      setCertificateFileList(newFileList);
    }
  };

  const openDocumentViewer = async (document) => {
    setSelectedDocument(document);
    setDocumentDetailOpen(true);
  };

  
  const loadAvailableDocuments = async () => {
    try {
      const docs = await documentService.getAllDocumentsWithMetadata();
      setAvailableDocuments(docs);
    } catch (e) {
      console.error('Error loading available documents:', e);
      setAvailableDocuments([]);
    }
  };
  
  const handleLinkSelectedDocuments = async () => {
    if (!selectedDocumentsForLinking.length) {
      message.warning('Vui lòng chọn ít nhất một tài liệu');
      return;
    }
    
    try {
      setLinkingDocuments(true);
      await documentService.linkDocumentToLand(selectedDocumentsForLinking, selected.id);
      message.success('Liên kết tài liệu thành công');
      setSelectedDocumentsForLinking([]);
      // Refresh land detail to show updated linked documents
      await openDetail(selected);
    } catch (e) {
      message.error(e.message || 'Liên kết thất bại');
    } finally {
      setLinkingDocuments(false);
    }
  };

  const columns = useMemo(() => ([
    { title: 'Mã thửa đất', dataIndex: 'id', key: 'id', render: v => <code>{v}</code> },
    { title: 'Chủ sử dụng', dataIndex: 'ownerId', key: 'ownerId' },
    { title: 'Diện tích (m²)', dataIndex: 'area', key: 'area' },
    { title: 'Vị trí', dataIndex: 'location', key: 'location' },
    { title: 'Mục đích sử dụng', dataIndex: 'landUsePurpose', key: 'landUsePurpose', render: v => <Tag color="blue">{v}</Tag> },
    { title: 'Trạng thái pháp lý', dataIndex: 'legalStatus', key: 'legalStatus', render: v => {
      const displayValue = v || 'Chưa có';
      const color = v === 'LUA' ? 'green' : 
                   v === 'HNK' ? 'blue' : 
                   v === 'CLN' ? 'orange' : 
                   v === 'ONT*' ? 'purple' :
                   !v ? 'default' : 'default';
      return <Tag color={color}>{displayValue}</Tag>;
    }},
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
                // Tự động điền trạng thái pháp lý theo mục đích sử dụng đất
                const legalStatus = getLegalStatusByLandUse(record.landUsePurpose);
                issueForm.setFieldsValue({ 
                  landId: record.id,
                  legalStatus: legalStatus
                });
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
  ]), [issueForm, editForm, openDetail]);

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
            </Row>
            <Alert
              message="Lưu ý"
              description="Chỉ có thể cập nhật diện tích, vị trí và mục đích sử dụng đất. Để thay đổi trạng thái pháp lý, vui lòng sử dụng chức năng cấp GCN."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
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

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item 
                  name="serialNumber" 
                  label="Số seri GCN"
                  rules={[{ required: true, message: 'Vui lòng nhập Số seri' }]}
                >
                  <Input placeholder="Nhập Số seri trên GCN" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="registryNumber" 
                  label="Số vào sổ cấp GCN"
                  rules={[{ required: true, message: 'Vui lòng nhập Số vào sổ cấp GCN' }]}
                >
                  <Input placeholder="Nhập Số vào sổ cấp GCN" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item 
              name="legalStatus" 
              label="Trạng thái pháp lý"
              rules={[{ required: true, message: 'Vui lòng chọn trạng thái pháp lý' }]}
            >
              <Select placeholder="Chọn trạng thái pháp lý" allowClear>
                {Object.entries(LEGAL_STATUSES).map(([key, value]) => (
                  <Option key={key} value={key}>{key} - {value}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item 
              name="legalInfo" 
              label="Thông tin pháp lý"
              rules={[{ required: true, message: 'Vui lòng nhập thông tin pháp lý' }]}
            >
              <TextArea 
                rows={3} 
                placeholder="Nhập thông tin pháp lý của giấy chứng nhận (bắt buộc)"
              />
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
            <Tabs 
              defaultActiveKey="1"
              items={[
                {
                  key: "1",
                  label: "Thông tin cơ bản",
                  children: (
                    <div style={{ padding: '16px 0' }}>
                      <Row gutter={[24, 16]}>
                  <Col span={12}>
                          <div style={{ marginBottom: 16 }}>
                    <Text strong>Mã thửa đất:</Text>
                    <br />
                            <Text type="secondary" style={{ marginTop: 4, display: 'block' }}>{selected.id}</Text>
                          </div>
                  </Col>
                  <Col span={12}>
                          <div style={{ marginBottom: 16 }}>
                            <Text strong>CCCD Chủ sử dụng:</Text>
                    <br />
                            <Text type="secondary" style={{ marginTop: 4, display: 'block' }}>{selected.ownerId}</Text>
                          </div>
                  </Col>
                  <Col span={12}>
                          <div style={{ marginBottom: 16 }}>
                    <Text strong>Diện tích:</Text>
                    <br />
                            <Text type="secondary" style={{ marginTop: 4, display: 'block' }}>{selected.area} m²</Text>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ marginBottom: 16 }}>
                            <Text strong>Vị trí:</Text>
                            <br />
                            <Text type="secondary" style={{ marginTop: 4, display: 'block' }}>{selected.location}</Text>
                          </div>
                  </Col>
                  <Col span={12}>
                          <div style={{ marginBottom: 16 }}>
                    <Text strong>Mục đích sử dụng đất:</Text>
                    <br />
                            <div style={{ marginTop: 4 }}>
                    <Tag color="blue">{selected.landUsePurpose}</Tag>
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      {LAND_USE_PURPOSES[selected.landUsePurpose]}
                    </Text>
                            </div>
                          </div>
                  </Col>
                  <Col span={12}>
                          <div style={{ marginBottom: 16 }}>
                    <Text strong>Tình trạng pháp lý:</Text>
                    <br />
                            <div style={{ marginTop: 4 }}>
                    <Tag color={selected.legalStatus === 'LUA' ? 'green' : selected.legalStatus === 'HNK' ? 'blue' : 'default'}>
                      {selected.legalStatus}
                    </Tag>
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      {LEGAL_STATUSES[selected.legalStatus]}
                    </Text>
                            </div>
                          </div>
                  </Col>
                  <Col span={12}>
                          <div style={{ marginBottom: 16 }}>
                    <Text strong>Mã giấy chứng nhận:</Text>
                    <br />
                            <div style={{ marginTop: 4 }}>
                              {selected.certificateId ? (
                                <div>
                                  <Tag color="green">{selected.certificateId}</Tag>
                                  <Button 
                                    type="link" 
                                    size="small" 
                                    icon={<EyeOutlined />}
                                    onClick={async () => {
                                      try {
                                        // Lấy thông tin document certificate từ API
                                        const certDoc = await documentService.getDocument(selected.certificateId);
                                        openDocumentViewer(certDoc);
                                      } catch (error) {
                                        message.error('Không thể tải thông tin giấy chứng nhận: ' + error.message);
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
                            </div>
                          </div>
                  </Col>
                  <Col span={24}>
                          <div style={{ marginBottom: 16 }}>
                    <Text strong>Thông tin pháp lý bổ sung:</Text>
                    <br />
                            <Text type="secondary" style={{ marginTop: 4, display: 'block' }}>{selected.legalInfo || 'Không có'}</Text>
                          </div>
                  </Col>
                  <Col span={12}>
                          <div style={{ marginBottom: 16 }}>
                    <Text strong>Ngày tạo:</Text>
                    <br />
                            <Text type="secondary" style={{ marginTop: 4, display: 'block' }}>{selected.createdAt ? new Date(selected.createdAt).toLocaleString('vi-VN') : 'N/A'}</Text>
                          </div>
                  </Col>
                  <Col span={12}>
                          <div style={{ marginBottom: 16 }}>
                    <Text strong>Ngày cập nhật:</Text>
                    <br />
                            <Text type="secondary" style={{ marginTop: 4, display: 'block' }}>{selected.updatedAt ? new Date(selected.updatedAt).toLocaleString('vi-VN') : 'N/A'}</Text>
                          </div>
                  </Col>
                </Row>
                    </div>
                  )
                },
                {
                  key: "2",
                  label: "Tài liệu liên quan",
                  children: (
                    <div>
                      {/* Liên kết tài liệu mới */}
                      <div style={{ marginBottom: 24, padding: '16px', background: '#f9f9f9', borderRadius: '8px' }}>
                        <div style={{ marginBottom: 16 }}>
                          <Text strong style={{ fontSize: 16 }}>Liên kết tài liệu mới</Text>
                        </div>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                            <div style={{ flex: 1 }}>
                              <Text strong style={{ marginBottom: 8, display: 'block' }}>Chọn tài liệu:</Text>
                              <Select
                                mode="multiple"
                                placeholder="Chọn tài liệu để liên kết"
                                value={selectedDocumentsForLinking}
                                onChange={setSelectedDocumentsForLinking}
                                style={{ width: '100%' }}
                                filterOption={(input, option) =>
                                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                }
                                showSearch
                              >
                                {availableDocuments
                                  .filter(doc => !linkedDocuments.includes(doc.docID))
                                  .map(doc => (
                                    <Option key={doc.docID} value={doc.docID}>
                                      {doc.title || doc.docID} ({documentService.getDocumentTypeName(doc.docType || doc.Type)})
                                    </Option>
                                  ))
                                }
                              </Select>
                            </div>
                            <Button
                              type="primary"
                              icon={<LinkOutlined />}
                              onClick={handleLinkSelectedDocuments}
                              loading={linkingDocuments}
                              disabled={!selectedDocumentsForLinking.length}
                            >
                              Liên kết
                            </Button>
                          </div>
                          {selectedDocumentsForLinking.length > 0 && (
                            <div style={{ marginTop: 8 }}>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                Đã chọn {selectedDocumentsForLinking.length} tài liệu
                              </Text>
                            </div>
                          )}
                        </Space>
                      </div>
                      
                      {/* Danh sách tài liệu đã liên kết */}
                      <List
                        header={<div><strong>Danh sách tài liệu đã liên kết ({linkedDocuments.length})</strong></div>}
                        bordered
                        dataSource={linkedDocuments}
                        renderItem={(docId, index) => (
                          <List.Item
                            actions={[
                              <Button
                                size="small"
                                icon={<EyeOutlined />}
                                onClick={async () => {
                                  try {
                                    // Load document details
                                    const doc = await documentService.getDocument(docId);
                                    if (doc) {
                                      openDocumentViewer(doc);
                                    } else {
                                      message.info('Không thể tìm thấy thông tin tài liệu');
                                    }
                                  } catch (error) {
                                    message.error('Lỗi khi tải thông tin tài liệu: ' + error.message);
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
                    </div>
                  )
                },
                {
                  key: "3", 
                  label: "Lịch sử thửa đất",
                  children: (
                    <div>
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
                    <List.Item style={{ padding: '20px 24px' }}>
                      <div style={{ width: '100%' }}>
                        <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '2px solid #f0f0f0' }}>
                          <Text strong style={{ fontSize: 16 }}>{`Thay đổi ${history.length - index}`}</Text>
                          <div style={{ float: 'right' }}>
                            {item.isDelete ? <Tag color="red">Vô hiệu</Tag> : <Tag color="green">Hiệu lực</Tag>}
                          </div>
                        </div>
                        
                        {/* Single column layout */}
                        <div style={{ lineHeight: '1.8' }}>
                          <div style={{ marginBottom: 12 }}>
                            <Text strong>Transaction ID: </Text>
                            <Text type="secondary" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                              {item.txId || 'Chưa bổ sung'}
                            </Text>
                          </div>
                          
                          <div style={{ marginBottom: 12 }}>
                            <Text strong>Timestamp: </Text>
                            <Text type="secondary">
                              {item.timestamp ? new Date(item.timestamp.seconds * 1000).toLocaleString('vi-VN') : 'Chưa bổ sung'}
                            </Text>
                          </div>

                            {item.land && (
                            <>
                              <div style={{ marginBottom: 12 }}>
                                <Text strong>Chủ sử dụng đất: </Text>
                                <Text type="secondary">{item.land.ownerId || 'Chưa bổ sung'}</Text>
                              </div>
                              
                              <div style={{ marginBottom: 12 }}>
                                <Text strong>Diện tích: </Text>
                                <Text type="secondary">{item.land.area || 'Chưa bổ sung'} m²</Text>
                              </div>
                              
                              <div style={{ marginBottom: 12 }}>
                                <Text strong>Vị trí: </Text>
                                <Text type="secondary">{item.land.location || 'Chưa bổ sung'}</Text>
                              </div>
                              
                              <div style={{ marginBottom: 12 }}>
                                <Text strong>Mục đích sử dụng: </Text>
                                {item.land.landUsePurpose ? (
                                  <Tag color="blue">{item.land.landUsePurpose}</Tag>
                                ) : (
                                  <Text type="secondary">Chưa bổ sung</Text>
                                )}
                              </div>
                              
                              <div style={{ marginBottom: 12 }}>
                                <Text strong>Tình trạng pháp lý: </Text>
                                {item.land.legalStatus ? (
                                  <Tag color="purple">{item.land.legalStatus}</Tag>
                                ) : (
                                  <Text type="secondary">Chưa bổ sung</Text>
                                )}
                              </div>
                              
                              <div style={{ marginBottom: 12 }}>
                                <Text strong>Giấy chứng nhận: </Text>
                                {item.land.certificateId ? (
                                  <Tag color="green">{item.land.certificateId}</Tag>
                                ) : (
                                  <Text type="secondary">Chưa bổ sung</Text>
                            )}
                          </div>
                              
                              <div style={{ marginBottom: 12 }}>
                                <Text strong>Ngày cấp giấy chứng nhận: </Text>
                                <Text type="secondary">
                                  {item.land.issueDate && item.land.issueDate !== '0001-01-01T00:00:00Z' 
                                    ? new Date(item.land.issueDate).toLocaleString('vi-VN')
                                    : 'Chưa bổ sung'
                                  }
                                </Text>
                              </div>
                              
                              <div style={{ marginBottom: 12 }}>
                                <Text strong>Thông tin pháp lý: </Text>
                                <Text type="secondary">{item.land.legalInfo || 'Chưa bổ sung'}</Text>
                              </div>
                              
                              <div style={{ marginBottom: 12 }}>
                                <Text strong>Ngày tạo thửa đất: </Text>
                                <Text type="secondary">
                                  {item.land.createdAt ? new Date(item.land.createdAt).toLocaleString('vi-VN') : 'Chưa bổ sung'}
                                </Text>
                              </div>
                              
                              <div style={{ marginBottom: 12 }}>
                                <Text strong>Ngày cập nhật cuối: </Text>
                                <Text type="secondary">
                                  {item.land.updatedAt ? new Date(item.land.updatedAt).toLocaleString('vi-VN') : 'Chưa bổ sung'}
                                </Text>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </List.Item>
                  )}
                  locale={{ emptyText: 'Chưa có lịch sử thay đổi' }}
                />
                    </div>
                  )
                }
              ]}
            />
          )}
        </Drawer>


        {/* Document Detail Modal */}
        <DocumentDetailModal
          visible={documentDetailOpen}
          onClose={() => setDocumentDetailOpen(false)}
          document={selectedDocument}
          userRole="Org1"
        />
        
        {/* Online Document Viewer */}
        <OnlineDocumentViewer
          visible={onlineViewerOpen}
          onCancel={() => setOnlineViewerOpen(false)}
          document={selectedDocument}
        />
      </Card>
    </div>
  );
};

export default LandManagementPage;