import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Tabs, Row, Col, Tag, Button, Space, Typography, Divider, Form, Input, message, Skeleton, Spin } from 'antd';
import { 
  FileTextOutlined, 
  EyeOutlined,
  DownloadOutlined,
  FileTextOutlined as AnalyzeIcon
} from '@ant-design/icons';
import documentService from '../../services/documentService';
import OnlineDocumentViewer from './OnlineDocumentViewer';

const { Text } = Typography;
const { TextArea } = Input;

const DocumentDetailModal = ({ 
  document, 
  visible, 
  onClose, 
  onVerify, 
  onReject,
  onAnalyze: externalOnAnalyze, // External analyze function
  analysis, // Analysis results from external source
  blockchainData, // Blockchain data for comparison
  comparisonResult, // Comparison result
  userRole = 'Org2', // 'Org1', 'Org2', 'Org3'
  analyzing: externalAnalyzing, // External analyzing state
  ...props
}) => {
  const [documentHistory, setDocumentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [onlineViewerOpen, setOnlineViewerOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Get analyzing state from props if provided, otherwise use internal state
  const isAnalyzing = externalAnalyzing !== undefined ? externalAnalyzing : analyzing;

  // Helper function để xác định trạng thái tài liệu dựa trên logic 3 trạng thái
  const getDocumentStatus = (doc) => {
    if (!doc) return { text: 'N/A', color: 'default' };
    
    if (doc.status === 'VERIFIED') {
      return { text: 'Đã thẩm định', color: 'green' };
    }
    
    if (doc.status === 'REJECTED') {
      return { text: 'Không hợp lệ', color: 'red' };
    }
    
    return { text: 'Chờ xác thực', color: 'orange' };
  };

  // Load lịch sử tài liệu khi modal mở
  const loadDocumentHistory = useCallback(async () => {
    if (!document?.docID) return;
    
    try {
      setHistoryLoading(true);
      const history = await documentService.getDocumentHistory(document.docID);
      setDocumentHistory(Array.isArray(history) ? history : (history?.data ?? []));
    } catch (e) {
      console.warn('Không thể load lịch sử tài liệu:', e);
      setDocumentHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [document?.docID]);

  useEffect(() => {
    if (visible && document) {
      loadDocumentHistory();
    }
  }, [visible, document, loadDocumentHistory]);

  const handleVerify = async () => {
    try {
      if (!verificationNotes.trim()) {
        message.error('Vui lòng nhập ghi chú xác thực');
        return;
      }
      
      if (onVerify) {
        await onVerify(document.docID, verificationNotes);
        message.success('Xác thực tài liệu thành công');
        setVerifyModalOpen(false);
        setVerificationNotes('');
        onClose(); // Đóng modal chính
      }
    } catch (e) {
      message.error(e.message || 'Xác thực thất bại');
    }
  };

  const handleReject = async () => {
    try {
      if (!rejectionReason.trim()) {
        message.error('Vui lòng nhập lý do từ chối');
        return;
      }
      
      if (onReject) {
        await onReject(document.docID, rejectionReason);
        message.success('Từ chối tài liệu thành công');
        setRejectModalOpen(false);
        setRejectionReason('');
        onClose(); // Đóng modal chính
      }
    } catch (e) {
      message.error(e.message || 'Từ chối thất bại');
    }
  };

  const handlePreview = () => {
    setOnlineViewerOpen(true);
  };

  const handleDownload = async (doc) => {
    try {
      if (doc.ipfsHash) {
        // Implement download logic here
        message.info('Chức năng tải về đang được phát triển');
      }
    } catch (e) {
      message.error('Không thể tải về tài liệu');
    }
  };

  const onAnalyze = async (docID) => {
    try {
      setAnalyzing(true);
      console.log('Starting document analysis for:', docID);
      
      // Call document analysis API with Gemini
      const result = await documentService.analyzeDocument(docID, true); // useGemini = true
      
      if (result.success && result.data && result.data.analysis) {
        const analysisData = result.data.analysis;
        console.log('Analysis result:', analysisData);
        
        // Display analysis results
        const extractedInfo = analysisData.extractedInfo;
        let analysisMessage = 'Phân tích tài liệu hoàn thành:\n\n';
        
        if (extractedInfo) {
          if (extractedInfo.cccd) analysisMessage += `🆔 CCCD/CMND: ${extractedInfo.cccd}\n`;
          if (extractedInfo.landParcelID) analysisMessage += `🏠 Mã thửa đất: ${extractedInfo.landParcelID}\n`;
          if (extractedInfo.ownerName) analysisMessage += `👤 Tên chủ sử dụng: ${extractedInfo.ownerName}\n`;
          if (extractedInfo.landArea) analysisMessage += `📏 Diện tích: ${extractedInfo.landArea} m²\n`;
          if (extractedInfo.landLocation) analysisMessage += `📍 Địa chỉ: ${extractedInfo.landLocation}\n`;
          if (extractedInfo.landType) analysisMessage += `🌿 Loại đất: ${extractedInfo.landType}\n`;
          if (analysisData.confidence) analysisMessage += `\n📊 Độ tin cậy: ${analysisData.confidence}%`;
        }
        
        message.success({
          content: analysisMessage,
          duration: 10, // Show for 10 seconds
          style: { whiteSpace: 'pre-line' }
        });
      } else {
        throw new Error('Dữ liệu phân tích không hợp lệ');
      }
    } catch (e) {
      console.error('Analysis error:', e);
      message.error(e.message || 'Phân tích thất bại');
    } finally {
      setAnalyzing(false);
    }
  };

  const getFileTypeDisplay = (fileType) => {
    if (!fileType) return 'N/A';
    if (fileType.includes('pdf')) return 'PDF';
    if (fileType.includes('word') || fileType.includes('docx')) return 'DOCX';
    if (fileType.includes('excel') || fileType.includes('xlsx')) return 'XLSX';
    if (fileType.includes('image')) return 'IMAGE';
    return 'FILE';
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    let date;
    if (timestamp.seconds) {
      // Timestamp từ blockchain (seconds + nanos)
      date = new Date(timestamp.seconds * 1000 + (timestamp.nanos || 0) / 1000000);
    } else {
      // Timestamp thông thường
      date = new Date(timestamp);
    }
    
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Tạo tabs dựa trên userRole
  const createTabItems = () => {
    const basicTab = {
      key: "1",
      label: "Thông tin cơ bản",
      children: (
        <div style={{ padding: '16px 0' }}>
          <Row gutter={24}>
            <Col span={24}>
              <div style={{ marginBottom: 24, padding: '20px 0', borderBottom: '1px solid #f0f0f0' }}>
                <Text strong style={{ fontSize: 18 }}>{document?.title}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 13 }}>Mã: <code>{document?.docID}</code></Text>
              </div>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <div style={{ marginBottom: 16 }}>
                <Text strong>Loại tài liệu</Text>
                <br />
                <Tag color="blue" style={{ marginTop: 6 }}>{document?.type}</Tag>
              </div>
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: 16 }}>
                <Text strong>Trạng thái</Text>
                <br />
                <div style={{ marginTop: 6 }}>
                  <Tag color={getDocumentStatus(document).color}>
                    {getDocumentStatus(document).text}
                  </Tag>
                </div>
              </div>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <div style={{ marginBottom: 16 }}>
                <Text strong>Loại file</Text>
                <br />
                <Tag color="blue" style={{ marginTop: 6 }}>{getFileTypeDisplay(document?.fileType)}</Tag>
              </div>
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: 16 }}>
                <Text strong>Kích thước</Text>
                <br />
                <Text type="secondary" style={{ marginTop: 6, display: 'block' }}>
                  {document?.fileSize ? `${(document.fileSize / 1024).toFixed(2)} KB` : 'N/A'}
                </Text>
              </div>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <div style={{ marginBottom: 16 }}>
                <Text strong>Người upload</Text>
                <br />
                <Text type="secondary" style={{ marginTop: 6, display: 'block' }}>{document?.uploadedBy}</Text>
              </div>
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: 16 }}>
                <Text strong>Ngày tạo</Text>
                <br />
                <Text type="secondary" style={{ marginTop: 6, display: 'block' }}>
                  {document?.createdAt ? new Date(document.createdAt).toLocaleString('vi-VN') : 'N/A'}
                </Text>
              </div>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={24}>
              <div style={{ marginBottom: 16 }}>
                <Text strong>Mô tả</Text>
                <br />
                <Text type="secondary" style={{ marginTop: 6, display: 'block', lineHeight: 1.6 }}>
                  {document?.description || 'Không có mô tả'}
                </Text>
              </div>
            </Col>
          </Row>
          <Divider />
          <Row gutter={24}>
            <Col span={24}>
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Space size="large">
                  <Button
                    type="primary"
                    icon={<EyeOutlined />}
                    onClick={handlePreview}
                    disabled={!document?.ipfsHash}
                    size="large"
                  >
                    Xem trực tuyến
                  </Button>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownload(document)}
                    disabled={!document?.ipfsHash}
                    size="large"
                  >
                    Tải về
                  </Button>
                </Space>
              </div>
            </Col>
          </Row>
          <Divider />
          {/* Status Display */}
          {document?.status === 'VERIFIED' ? (
            <div style={{
              background: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: 8,
              padding: 16,
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            }}>
              <Text type="success" strong style={{ fontSize: 16 }}>
                ✅ Tài liệu đã được xác thực
              </Text>
              <div style={{
                marginTop: 12,
                display: 'flex',
                justifyContent: 'center',
                gap: 16,
                flexWrap: 'wrap',
              }}>
                <div style={{ background: '#e6ffe6', padding: '8px 12px', borderRadius: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Bởi: {document.verifiedBy || 'N/A'}
                  </Text>
                </div>
                <div style={{ background: '#e6ffe6', padding: '8px 12px', borderRadius: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Lúc: {document.verifiedAt && document.verifiedAt !== '0001-01-01T00:00:00Z'
                      ? new Date(document.verifiedAt).toLocaleString('vi-VN')
                      : 'N/A'}
                  </Text>
                </div>
              </div>
            </div>
          ) : document?.status === 'REJECTED' ? (
            <div style={{
              background: '#fff2f0',
              border: '1px solid #ffccc7',
              borderRadius: 8,
              padding: 16,
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            }}>
              <Text strong style={{ fontSize: 16, color: '#cf1322' }}>
                ❌ Tài liệu đã bị từ chối
              </Text>
              <div style={{
                marginTop: 12,
                display: 'flex',
                justifyContent: 'center',
                gap: 16,
                flexWrap: 'wrap',
              }}>
                <div style={{ background: '#ffe6e6', padding: '8px 12px', borderRadius: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Bởi: {(() => {
                      const rejectionMatch = document?.description?.match(/\[REJECTED: (.*?)\s*\|\s*By: (.*?)\s*\|\s*At: (.*?)\]/);
                      return rejectionMatch ? rejectionMatch[2] : 'N/A';
                    })()}
                  </Text>
                </div>
                <div style={{ background: '#ffe6e6', padding: '8px 12px', borderRadius: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Lúc: {(() => {
                      const rejectionMatch = document?.description?.match(/\[REJECTED: (.*?)\s*\|\s*By: (.*?)\s*\|\s*At: (.*?)\]/);
                      return rejectionMatch ? new Date(rejectionMatch[3]).toLocaleString('vi-VN') : 'N/A';
                    })()}
                  </Text>
                </div>
              </div>
              <Text type="secondary" style={{ fontSize: 12, marginTop: 12 }}>
                Tài liệu này không thể được xác thực do đã bị từ chối
              </Text>
            </div>
          ) : (
            <div style={{
              background: '#f0f8ff',
              border: '1px solid #d6e4ff',
              borderRadius: 8,
              padding: 16,
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            }}>
              <Text type="secondary" strong style={{ fontSize: 16 }}>
                ✓ Tài liệu đang chờ xác thực
              </Text>
            </div>
          )}
        </div>
      )
    };

    // Tạo analysisTab khác nhau cho từng userRole
    const getAnalysisTabContent = () => {
      if (userRole === 'Org1') {
        // Org1: Chỉ có phân tích, không có phần xác thực
        return (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Button
                type='primary'
                icon={<AnalyzeIcon />}
                onClick={() => externalOnAnalyze ? externalOnAnalyze(document?.docID) : onAnalyze(document?.docID)}
                loading={isAnalyzing}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? 'Đang phân tích...' : 'Phân tích tài liệu với Gemini'}
              </Button>
            </div>
            
            {/* Loading overlay when analyzing */}
            {isAnalyzing ? (
              <div style={{
                position: 'relative',
                minHeight: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: 8,
                border: '1px solid #e8e8e8'
              }}>
                <Spin size="large">
                  <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <div style={{ fontSize: 16, fontWeight: 'bold', color: '#1890ff', marginBottom: 8 }}>
                      🤖 Đang phân tích tài liệu với Gemini AI
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      Vui lòng chờ trong giây lát...
                    </div>
                  </div>
                </Spin>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 32 }}>
                <Text type='secondary'>Chưa có kết quả phân tích</Text>
                <br />
                <Text type='secondary' style={{ fontSize: '12px' }}>
                  Nhấn nút "Phân tích tài liệu" để bắt đầu phân tích
                </Text>
              </div>
            )}
          </div>
        );
      } else {
        // Org2: Đầy đủ phân tích + xác thực
        return (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Button
                type='primary'
                icon={<AnalyzeIcon />}
                onClick={() => externalOnAnalyze ? externalOnAnalyze(document?.docID) : onAnalyze(document?.docID)}
                loading={isAnalyzing}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? 'Đang phân tích...' : 'Phân tích tài liệu với Gemini'}
              </Button>
            </div>
            
            {/* Loading overlay when analyzing */}
            {isAnalyzing ? (
              <div style={{
                position: 'relative',
                minHeight: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: 8,
                border: '1px solid #e8e8e8'
              }}>
                <Spin size="large">
                  <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <div style={{ fontSize: 16, fontWeight: 'bold', color: '#1890ff', marginBottom: 8 }}>
                      🤖 Đang phân tích tài liệu với Gemini AI
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      Vui lòng chờ trong giây lát...
                    </div>
                  </div>
                </Spin>
              </div>
            ) : analysis && analysis.extractedInfo ? (
              <div>
                <div style={{ marginBottom: 24 }}>
                  <Text strong style={{ fontSize: 16, color: '#1890ff' }}>Phân tích tài liệu hoàn thành:</Text>
                </div>
                
                <Row gutter={16}>
                  <Col span={12}>
                    <div style={{ background: '#f0f2ff', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                      <Text strong>🆔 CCCD/CMND: </Text>
                      <Text>{analysis.extractedInfo.cccd || 'N/A'}</Text>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ background: '#f0f2ff', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                      <Text strong>🏠 Mã thửa đất: </Text>
                      <Text>{analysis.extractedInfo.landParcelID || 'N/A'}</Text>
                    </div>
                  </Col>
                </Row>
                
                <Row gutter={16}>
                  <Col span={12}>
                    <div style={{ background: '#f0f2ff', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                      <Text strong>👤 Tên chủ sử dụng: </Text>
                      <Text>{analysis.extractedInfo.ownerName || 'N/A'}</Text>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ background: '#f0f2ff', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                      <Text strong>📏 Diện tích: </Text>
                      <Text>{analysis.extractedInfo.landArea ? `${analysis.extractedInfo.landArea} m²` : 'N/A'}</Text>
                    </div>
                  </Col>
                </Row>
                
                <Row gutter={16}>
                  <Col span={12}>
                    <div style={{ background: '#f0f2ff', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                      <Text strong>📍 Địa chỉ: </Text>
                      <Text>{analysis.extractedInfo.landLocation || 'N/A'}</Text>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ background: '#f0f2ff', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                      <Text strong>🌿 Loại đất: </Text>
                      <Text>{analysis.extractedInfo.landType || 'N/A'}</Text>
                    </div>
                  </Col>
                </Row>
                
                {analysis.confidence && (
                  <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '8px', padding: '12px', marginBottom: '16px', textAlign: 'center' }}>
                    <Text strong>📊 Độ tin cậy: {analysis.confidence}%</Text>
                  </div>
                )}
                
                {/* Blockchain Comparison Results */}
                {comparisonResult && (
                  <div>
                    <Divider />
                    <Text strong style={{ fontSize: 16, color: '#1890ff' }}>Kết quả so sánh với Blockchain:</Text>
                    <div style={{ marginTop: 16 }}>
                      <div style={{ 
                        background: comparisonResult.matchPercentage >= 80 ? '#f6ffed' : comparisonResult.matchPercentage <= 30 ? '#fff2f0' : '#fff7e6', 
                        border: comparisonResult.matchPercentage >= 80 ? '1px solid #b7eb8f' : comparisonResult.matchPercentage <= 30 ? '1px solid #ffccc7' : '1px solid #ffd591',
                        borderRadius: '8px', 
                        padding: '16px', 
                        textAlign: 'center',
                        marginBottom: '16px'
                      }}>
                        <Text strong style={{ fontSize: 18 }}>
                          Độ khớp: {comparisonResult.matchPercentage}%
                        </Text>
                        <br />
                        <Text type="secondary">
                          Khớp {comparisonResult.matchedFields}/{comparisonResult.totalFields} trường thông tin
                        </Text>
                      </div>
                      
                      {/* Detailed comparison */}
                      {comparisonResult.details && comparisonResult.details.length > 0 && (
                        <div style={{ background: '#fafafa', padding: '12px', borderRadius: '8px' }}>
                          <Text strong style={{ marginBottom: 8, display: 'block' }}>Chi tiết so sánh:</Text>
                          {comparisonResult.details.map((detail, index) => (
                            <div key={index} style={{ marginBottom: '4px' }}>
                              <Text style={{ fontSize: '12px' }}>{detail}</Text>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Recommendation */}
                      {comparisonResult.recommendation && (
                        <div style={{ 
                          marginTop: 16,
                          background: comparisonResult.recommendation === 'verify' ? '#f6ffed' : comparisonResult.recommendation === 'reject' ? '#fff2f0' : '#fff7e6',
                          border: comparisonResult.recommendation === 'verify' ? '1px solid #b7eb8f' : comparisonResult.recommendation === 'reject' ? '1px solid #ffccc7' : '1px solid #ffd591',
                          borderRadius: '8px', 
                          padding: '12px'
                        }}>
                          <Text strong>Khuyến nghị: </Text>
                          <Text>
                            {comparisonResult.recommendation === 'verify' ? '✅ Nên xác thực tài liệu' : 
                             comparisonResult.recommendation === 'reject' ? '❌ Nên từ chối tài liệu' : 
                             '⚠️ Cần xem xét kỹ thêm'}
                          </Text>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : !isAnalyzing ? (
              <div style={{ textAlign: 'center', padding: 32 }}>
                <Text type='secondary'>Chưa có kết quả phân tích</Text>
                <br />
                <Text type='secondary' style={{ fontSize: '12px' }}>
                  Nhấn nút "Phân tích tài liệu" để bắt đầu phân tích và hỗ trợ quyết định xác thực
                </Text>
              </div>
            ) : null}
            <Divider />
            <div
              style={{
                background: '#f0f8ff',
                border: '1px solid #d6e4ff',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
              }}
            >
              <Text strong style={{ fontSize: '16px', marginBottom: '16px', display: 'block' }}>
                🎯 Chức năng xác thực tài liệu
              </Text>
              <Text type='secondary' style={{ marginBottom: '16px', display: 'block' }}>
                Xác thực hoặc từ chối tài liệu này sau khi phân tích
              </Text>
              <Space size='large'>
                <Button
                  type='primary'
                  icon={<FileTextOutlined />}
                  onClick={() => setVerifyModalOpen(true)}
                  size='large'
                  style={{ minWidth: '120px' }}
                  disabled={document?.status === 'VERIFIED' || document?.status === 'REJECTED'}
                >
                  Xác thực
                </Button>
                <Button
                  danger
                  icon={<FileTextOutlined />}
                  onClick={() => setRejectModalOpen(true)}
                  size='large'
                  style={{ minWidth: '120px' }}
                  disabled={document?.status === 'VERIFIED' || document?.status === 'REJECTED'}
                >
                  Từ chối
                </Button>
              </Space>
            </div>
          </div>
        );
      }
    };

    const analysisTab = {
      key: '2',
      label: 'Phân tích tài liệu',
      children: getAnalysisTabContent()
    };

    const historyTab = {
      key: "4",
      label: "Lịch sử thay đổi",
      children: (
        <div style={{ padding: '16px 0' }}>
          {/* Lịch sử thay đổi từ chaincode GetHistoryForKey */}
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ fontSize: 16 }}>Lịch sử thay đổi tài liệu</Text>
          </div>
          
          {historyLoading ? (
            <Skeleton active />
          ) : documentHistory && documentHistory.length > 0 ? (
            <div>
              {documentHistory.map((item, index) => (
                <div key={index} style={{ 
                  background: '#fff', 
                  border: '1px solid #e8e8e8', 
                  borderRadius: '8px', 
                  padding: '16px',
                  marginBottom: '12px'
                }}>
                  <Row gutter={16}>
                    <Col span={24}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Tag color={item.isDelete ? 'red' : 'blue'}>
                          {item.isDelete ? 'Đã xóa' : 'Thay đổi'}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {formatTimestamp(item.timestamp)}
                        </Text>
                      </div>
                    </Col>
                  </Row>
                  
                  <Row gutter={16}>
                    <Col span={12}>
                      <Text strong>Transaction ID:</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                        {item.txId}
                      </Text>
                    </Col>
                    <Col span={12}>
                      <Text strong>Tiêu đề:</Text>
                      <br />
                      <Text type="secondary">{item.document?.title || 'N/A'}</Text>
                    </Col>
                  </Row>
                  
                  <Row gutter={16} style={{ marginTop: 8 }}>
                    <Col span={12}>
                      <Text strong>Loại tài liệu:</Text>
                      <br />
                      <Tag color="blue">{item.document?.type || 'N/A'}</Tag>
                    </Col>
                    <Col span={12}>
                      <Text strong>Trạng thái xác thực:</Text>
                      <br />
                      <Tag color={getDocumentStatus(item.document).color}>
                        {getDocumentStatus(item.document).text}
                      </Tag>
                    </Col>
                  </Row>
                  
                  <Row gutter={16} style={{ marginTop: 8 }}>
                    <Col span={12}>
                      <Text strong>Người xác thực:</Text>
                      <br />
                      <Text type="secondary">{item.document?.verifiedBy || 'Chưa có'}</Text>
                    </Col>
                    <Col span={12}>
                      <Text strong>Ngày xác thực:</Text>
                      <br />
                      <Text type="secondary">
                        {item.document?.verifiedAt && item.document.verifiedAt !== '0001-01-01T00:00:00Z' ? 
                          new Date(item.document.verifiedAt).toLocaleString('vi-VN') : 'Chưa có'
                        }
                      </Text>
                    </Col>
                  </Row>
                  
                  <Row gutter={16} style={{ marginTop: 8 }}>
                    <Col span={12}>
                      <Text strong>Người upload:</Text>
                      <br />
                      <Text type="secondary">{item.document?.uploadedBy || 'N/A'}</Text>
                    </Col>
                    <Col span={12}>
                      <Text strong>Ngày tạo:</Text>
                      <br />
                      <Text type="secondary">
                        {item.document?.createdAt ? new Date(item.document.createdAt).toLocaleString('vi-VN') : 'N/A'}
                      </Text>
                    </Col>
                  </Row>
                  
                  <Row gutter={16} style={{ marginTop: 8 }}>
                    <Col span={12}>
                      <Text strong>Ngày cập nhật:</Text>
                      <br />
                      <Text type="secondary">
                        {item.document?.updatedAt ? new Date(item.document.updatedAt).toLocaleString('vi-VN') : 'N/A'}
                      </Text>
                    </Col>
                    <Col span={12}>
                      <Text strong>IPFS Hash:</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                        {item.document?.ipfsHash || 'N/A'}
                      </Text>
                    </Col>
                  </Row>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              background: '#f9f9f9', 
              border: '1px solid #e8e8e8', 
              borderRadius: '8px', 
              padding: '32px',
              textAlign: 'center'
            }}>
              <Text type="secondary">Chưa có lịch sử thay đổi</Text>
            </div>
          )}
        </div>
      )
    };

    // Trả về tabs tùy theo userRole
    if (userRole === 'Org3') {
      // Org3: Chỉ có tab thông tin cơ bản và lịch sử
      return [basicTab, historyTab];
    } else if (userRole === 'Org2') {
      // Org2: Có tất cả tabs
      return [basicTab, analysisTab, historyTab];
    } else {
      // Org1: Có tab thông tin, phân tích và lịch sử (không có nút xác thực/từ chối)
      return [basicTab, analysisTab, historyTab];
    }
  };

  const tabItems = createTabItems();

  return (
    <>
      {/* Modal chính */}
      <Modal
        title="Chi tiết tài liệu & Phân tích"
        open={visible}
        onCancel={onClose}
        width={800}
        footer={[
          <Button key="close" onClick={onClose}>
            Đóng
          </Button>
        ]}
      >
        {document ? (
          <div>
            <Tabs 
              defaultActiveKey="1"
              items={tabItems}
            />
          </div>
        ) : (
          <Skeleton active />
        )}
      </Modal>

      {/* Modal xác thực */}
      <Modal
        title="Xác thực tài liệu"
        open={verifyModalOpen}
        onOk={handleVerify}
        onCancel={() => {
          setVerifyModalOpen(false);
          setVerificationNotes('');
        }}
        confirmLoading={false}
        okText="Xác thực"
        cancelText="Hủy"
        width={500}
      >
        <div style={{ padding: '16px 0' }}>
          <p><strong>Tài liệu:</strong> {document?.title}</p>
          <p><strong>Mã:</strong> {document?.docID}</p>
          <Divider />
          <Form layout="vertical">
            <Form.Item 
              label="Ghi chú xác thực" 
              required
              help="Nhập ghi chú về việc xác thực tài liệu này"
            >
              <TextArea
                rows={4}
                placeholder="Nhập ghi chú xác thực..."
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
              />
            </Form.Item>
          </Form>
        </div>
      </Modal>

      {/* Modal từ chối */}
      <Modal
        title="Từ chối tài liệu"
        open={rejectModalOpen}
        onOk={handleReject}
        onCancel={() => {
          setRejectModalOpen(false);
          setRejectionReason('');
        }}
        confirmLoading={false}
        okText="Từ chối"
        cancelText="Hủy"
        width={500}
        okButtonProps={{ danger: true }}
      >
        <div style={{ padding: '16px 0' }}>
          <p><strong>Tài liệu:</strong> {document?.title}</p>
          <p><strong>Mã:</strong> {document?.docID}</p>
          <Divider />
          <Form layout="vertical">
            <Form.Item 
              label="Lý do từ chối" 
              required
              help="Nhập lý do từ chối tài liệu này"
            >
              <TextArea
                rows={4}
                placeholder="Nhập lý do từ chối..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </Form.Item>
          </Form>
        </div>
      </Modal>

      {/* Online Document Viewer */}
      <OnlineDocumentViewer
        visible={onlineViewerOpen}
        onCancel={() => setOnlineViewerOpen(false)}
        document={document}
      />
    </>
  );
};

export default DocumentDetailModal;
