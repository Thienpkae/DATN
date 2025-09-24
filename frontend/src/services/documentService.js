import apiClient from './api';
import { API_ENDPOINTS } from './api';

// Define constants locally to avoid circular dependency
const DOCUMENT_TYPES = {
  CERTIFICATE: 'CERTIFICATE',     // Giấy chứng nhận
  CONTRACT: 'CONTRACT',           // Hợp đồng
  MAP: 'MAP',                     // Bản đồ
  FORM: 'FORM',                   // Đơn đăng ký
  TAX_DOCUMENT: 'TAX_DOCUMENT',   // Tài liệu thuế
  TECHNICAL_DOC: 'TECHNICAL_DOC', // Tài liệu kỹ thuật
  LEGAL_DOC: 'LEGAL_DOC',         // Tài liệu pháp lý
  OTHER: 'OTHER'                  // Khác
};

const DOCUMENT_TYPE_NAMES = {
  CERTIFICATE: 'Giấy chứng nhận',
  CONTRACT: 'Hợp đồng',
  MAP: 'Bản đồ',
  FORM: 'Đơn đăng ký',
  TAX_DOCUMENT: 'Tài liệu thuế',
  TECHNICAL_DOC: 'Tài liệu kỹ thuật',
  LEGAL_DOC: 'Tài liệu pháp lý',
  OTHER: 'Khác'
};

// Document Management Service
const documentService = {
  // Create new document
  async createDocument(documentData) {
    try {
      console.log('Calling createDocument API with data:', documentData);
      const response = await apiClient.post(API_ENDPOINTS.DOCUMENT.CREATE, documentData);
      console.log('createDocument response:', response);
      return response.data;
    } catch (error) {
      console.error('createDocument error:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi tạo tài liệu');
    }
  },

  // Update existing document
  async updateDocument(docID, updateData) {
    try {
      console.log('Calling updateDocument API for:', docID, 'with data:', updateData);
      const url = API_ENDPOINTS.DOCUMENT.UPDATE.replace(':docID', docID);
      const response = await apiClient.put(url, updateData);
      console.log('updateDocument response:', response);
      return response.data;
    } catch (error) {
      console.error('updateDocument error:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi cập nhật tài liệu');
    }
  },

  // Get document by ID
  async getDocument(docID) {
    try {
      console.log('Calling getDocument API for:', docID);
      const url = API_ENDPOINTS.DOCUMENT.GET_BY_ID.replace(':docID', docID);
      const response = await apiClient.get(url);
      console.log('getDocument response:', response);
      // Backend returns { success: true, data: {...} }
      return response.data.data || response.data;
    } catch (error) {
      console.error('getDocument error:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy thông tin tài liệu');
    }
  },

  // Get all documents (for Org1, Org2)
  async getAllDocuments() {
    try {
      console.log('Calling getAllDocuments API...');
      const response = await apiClient.get(API_ENDPOINTS.DOCUMENT.GET_ALL);
      console.log('getAllDocuments response:', response);
      // Backend returns { success: true, data: [...] }
      return response.data.data || response.data;
    } catch (error) {
      console.error('getAllDocuments error:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy danh sách tài liệu');
    }
  },

  // Search documents by keyword and filters
  async searchDocuments(searchParams) {
    try {
      console.log('Calling searchDocuments API with params:', searchParams);
      const response = await apiClient.get(API_ENDPOINTS.DOCUMENT.SEARCH, {
        params: searchParams
      });
      console.log('searchDocuments response:', response);
      // Backend returns { success: true, data: [...] } or { success: true, data: {documents: [...]} }
      const data = response.data.data || response.data;
      // Đảm bảo luôn trả về array
      if (Array.isArray(data)) {
        return data;
      } else if (data && Array.isArray(data.documents)) {
        return data.documents;
      } else {
        return [];
      }
    } catch (error) {
      console.error('searchDocuments error:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi tìm kiếm');
    }
  },

  // Get documents by status
  async getDocumentsByStatus(status) {
    try {
      console.log('Calling getDocumentsByStatus API for:', status);
      const url = API_ENDPOINTS.DOCUMENT.GET_BY_STATUS.replace(':status', status);
      const response = await apiClient.get(url);
      console.log('getDocumentsByStatus response:', response);
      return response.data.data || response.data;
    } catch (error) {
      console.error('getDocumentsByStatus error:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy tài liệu theo trạng thái');
    }
  },

  // Get documents by type
  async getDocumentsByType(docType) {
    try {
      console.log('Calling getDocumentsByType API for:', docType);
      const url = API_ENDPOINTS.DOCUMENT.GET_BY_TYPE.replace(':docType', docType);
      const response = await apiClient.get(url);
      console.log('getDocumentsByType response:', response);
      return response.data.data || response.data;
    } catch (error) {
      console.error('getDocumentsByType error:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy tài liệu theo loại');
    }
  },

  // Get documents by land parcel
  async getDocumentsByLandParcel(landParcelID) {
    try {
      console.log('Calling getDocumentsByLandParcel API for:', landParcelID);
      const url = API_ENDPOINTS.DOCUMENT.GET_BY_LAND.replace(':landParcelID', landParcelID);
      const response = await apiClient.get(url);
      console.log('getDocumentsByLandParcel response:', response);
      return response.data.data || response.data;
    } catch (error) {
      console.error('getDocumentsByLandParcel error:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy tài liệu theo thửa đất');
    }
  },

  // Get documents by transaction
  async getDocumentsByTransaction(txID) {
    try {
      console.log('Calling getDocumentsByTransaction API for:', txID);
      const url = API_ENDPOINTS.DOCUMENT.GET_BY_TRANSACTION.replace(':txID', txID);
      const response = await apiClient.get(url);
      console.log('getDocumentsByTransaction response:', response);
      return response.data.data || response.data;
    } catch (error) {
      console.error('getDocumentsByTransaction error:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy tài liệu theo giao dịch');
    }
  },

  // Get documents by uploader
  async getDocumentsByUploader(uploaderID) {
    try {
      console.log('Calling getDocumentsByUploader API for:', uploaderID);
      const url = API_ENDPOINTS.DOCUMENT.GET_BY_UPLOADER.replace(':uploaderID', uploaderID);
      const response = await apiClient.get(url);
      console.log('getDocumentsByUploader response:', response);
      return response.data.data || response.data;
    } catch (error) {
      console.error('getDocumentsByUploader error:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy tài liệu theo người upload');
    }
  },

  // Get document history
  async getDocumentHistory(docID) {
    try {
      console.log('Calling getDocumentHistory API for:', docID);
      const url = API_ENDPOINTS.DOCUMENT.GET_HISTORY.replace(':docID', docID);
      const response = await apiClient.get(url);
      console.log('getDocumentHistory response:', response);
      return response.data.data || response.data;
    } catch (error) {
      console.error('getDocumentHistory error:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy lịch sử tài liệu');
    }
  },

  // Get document audit (history + user/actions)
  async getDocumentAudit(docID) {
    try {
      const url = API_ENDPOINTS.DOCUMENT.GET_AUDIT.replace(':docID', docID);
      const response = await apiClient.get(url);
      return response.data.data || response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi truy vết tài liệu');
    }
  },

  // Delete document
  async deleteDocument(docID) {
    try {
      console.log('Calling deleteDocument API for:', docID);
      const url = API_ENDPOINTS.DOCUMENT.DELETE.replace(':docID', docID);
      const response = await apiClient.delete(url);
      console.log('deleteDocument response:', response);
      return response.data;
    } catch (error) {
      console.error('deleteDocument error:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi xóa tài liệu');
    }
  },

  // Link documents to land parcel (supports multiple documents) - UC-17
  async linkDocumentToLand(docIDs, landParcelID) {
    try {
      console.log('Calling linkDocumentToLand API for:', docIDs, 'land:', landParcelID);
      const response = await apiClient.post(API_ENDPOINTS.DOCUMENT.LINK_TO_LAND, {
        docIDs,
        landParcelId: landParcelID
      });
      console.log('linkDocumentToLand response:', response);
      return response.data;
    } catch (error) {
      console.error('linkDocumentToLand error:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi liên kết tài liệu bổ sung với thửa đất');
    }
  },

  // Unlink document from land parcel
  async unlinkDocumentFromLand(docID, landParcelID) {
    try {
      console.log('Calling unlinkDocumentFromLand API for:', docID, 'land:', landParcelID);
      const response = await apiClient.delete(API_ENDPOINTS.DOCUMENT.LINK_TO_LAND, {
        data: { docID, landParcelID }
      });
      console.log('unlinkDocumentFromLand response:', response);
      return response.data;
    } catch (error) {
      console.error('unlinkDocumentFromLand error:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi hủy liên kết tài liệu với thửa đất');
    }
  },

  // Link supplement documents to transaction (supports multiple documents) - UC-18
  async linkDocumentToTransaction(docIDs, txID) {
    try {
      console.log('Calling linkDocumentToTransaction API for:', docIDs, 'transaction:', txID);
      const response = await apiClient.post(API_ENDPOINTS.DOCUMENT.LINK_TO_TRANSACTION, {
        docIDs,
        transactionId: txID
      });
      console.log('linkDocumentToTransaction response:', response);
      return response.data;
    } catch (error) {
      console.error('linkDocumentToTransaction error:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi liên kết tài liệu bổ sung với giao dịch');
    }
  },

  // Unlink document from transaction
  async unlinkDocumentFromTransaction(docID, txID) {
    try {
      console.log('Calling unlinkDocumentFromTransaction API for:', docID, 'transaction:', txID);
      const response = await apiClient.delete(API_ENDPOINTS.DOCUMENT.LINK_TO_TRANSACTION, {
        data: { docID, txID }
      });
      console.log('unlinkDocumentFromTransaction response:', response);
      return response.data;
    } catch (error) {
      console.error('unlinkDocumentFromTransaction error:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi hủy liên kết tài liệu với giao dịch');
    }
  },

  // Verify document
  async verifyDocument(docID, notes) {
    try {
      console.log('Calling verifyDocument API for:', docID, 'notes:', notes);
      const url = API_ENDPOINTS.DOCUMENT.VERIFY.replace(':docID', docID);
      const response = await apiClient.post(url, { notes });
      console.log('verifyDocument response:', response);
      return response.data;
    } catch (error) {
      console.error('verifyDocument error:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi xác thực tài liệu');
    }
  },

  // Reject document
  async rejectDocument(docID, reason) {
    try {
      console.log('Calling rejectDocument API for:', docID, 'reason:', reason);
      const url = API_ENDPOINTS.DOCUMENT.REJECT.replace(':docID', docID);
      const response = await apiClient.post(url, { reason });
      console.log('rejectDocument response:', response);
      return response.data;
    } catch (error) {
      console.error('rejectDocument error:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi từ chối tài liệu');
    }
  },

  // Analyze document
  async analyzeDocument(docID, useGemini = false) {
    try {
      console.log('Calling analyzeDocument API for:', docID, 'Use Gemini:', useGemini);
      const url = API_ENDPOINTS.DOCUMENT.ANALYZE.replace(':docID', docID);
      const params = useGemini ? { useGemini: 'true' } : {};
      const response = await apiClient.get(url, { params });
      console.log('analyzeDocument response:', response);
      return response.data;
    } catch (error) {
      console.error('analyzeDocument error:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi phân tích tài liệu');
    }
  },

  // Advanced search with multiple criteria
  async advancedSearch(filters) {
    try {
      const searchParams = {
        keyword: filters.keyword || '',
        filters: JSON.stringify({
          docType: filters.docType,
          status: filters.status,
          uploaderID: filters.uploaderID,
          landParcelID: filters.landParcelID,
          transactionID: filters.transactionID,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          fileType: filters.fileType,
          minFileSize: filters.minFileSize,
          maxFileSize: filters.maxFileSize
        })
      };
      
      return await this.searchDocuments(searchParams);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tìm kiếm nâng cao');
    }
  },

  // Get documents with pagination
  async getDocumentsWithPagination(page = 1, pageSize = 10, filters = {}) {
    try {
      const searchParams = {
        page,
        pageSize,
        ...filters
      };
      
      return await this.searchDocuments(searchParams);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy danh sách tài liệu có phân trang');
    }
  },

  // Extract metadata from document description
  extractMetadata(document) {
    try {
      console.log('Extracting metadata from document:', document);
      if (!document || !document.description) {
        console.log('No description found, returning null');
        return null;
      }

      try {
        const metadata = JSON.parse(document.description);
        console.log('Parsed metadata:', metadata);
        return metadata;
      } catch (parseError) {
        console.log('Failed to parse description as JSON, treating as plain text');
        return null;
      }
    } catch (error) {
      console.error('Error extracting metadata:', error);
      return null;
    }
  },

  // Get document with parsed metadata
  getDocumentWithMetadata(document) {
    try {
      console.log('Getting document with metadata for:', document);
      const metadata = this.extractMetadata(document);
      console.log('Extracted metadata:', metadata);
      
      return {
        ...document,
        metadata,
        // For backward compatibility, keep original description accessible
        originalDescription: metadata ? metadata.originalDescription : document.description,
        // If there's metadata, use it for display
        displayDescription: metadata ? metadata.originalDescription : document.description
      };
    } catch (error) {
      console.error('Error getting document with metadata:', error);
      return document;
    }
  },

  // Get all documents with parsed metadata
  async getAllDocumentsWithMetadata() {
    try {
      console.log('Calling getAllDocumentsWithMetadata...');
      const response = await this.getAllDocuments();
      console.log('Raw documents from API:', response);
      
      // Backend returns { success: true, data: [...] }
      const documents = response.data || response;
      const documentsWithMetadata = documents.map(doc => this.getDocumentWithMetadata(doc));
      console.log('Documents with metadata:', documentsWithMetadata);
      
      return documentsWithMetadata;
    } catch (error) {
      console.error('Error getting all documents with metadata:', error);
      throw error;
    }
  },

  // Validate document data before submission
  validateDocumentData(documentData) {
    const errors = [];

    if (!documentData.docID || documentData.docID.trim() === '') {
      errors.push('Mã tài liệu là bắt buộc');
    }

    if (!documentData.docType || documentData.docType.trim() === '') {
      errors.push('Loại tài liệu là bắt buộc');
    }

    if (!documentData.title || documentData.title.trim() === '') {
      errors.push('Tiêu đề tài liệu là bắt buộc');
    }

    if (!documentData.ipfsHash || documentData.ipfsHash.trim() === '') {
      errors.push('Hash IPFS là bắt buộc');
    }

    if (!documentData.fileType || documentData.fileType.trim() === '') {
      errors.push('Loại file là bắt buộc');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Format document data for display
  formatDocumentData(documentData) {
    try {
      console.log('Formatting document data for:', documentData);
      const metadata = this.extractMetadata(documentData);
      console.log('Extracted metadata for formatting:', metadata);
      
      return {
        ...documentData,
        metadata,
        // For backward compatibility, keep original description accessible
        originalDescription: metadata ? metadata.originalDescription : documentData.description,
        // If there's metadata, use it for display
        displayDescription: metadata ? metadata.originalDescription : documentData.description,
        // Format dates
        createdAt: documentData.createdAt ? new Date(documentData.createdAt).toLocaleDateString('vi-VN') : 'N/A',
        updatedAt: documentData.updatedAt ? new Date(documentData.updatedAt).toLocaleDateString('vi-VN') : 'N/A',
        verifiedAt: documentData.verifiedAt ? new Date(documentData.verifiedAt).toLocaleDateString('vi-VN') : 'N/A',
      };
    } catch (error) {
      console.error('Error formatting document data:', error);
      return documentData;
    }
  },

  // Get document type options
  getDocumentTypes() {
    return Object.values(DOCUMENT_TYPES);
  },

  // Get document type display names
  getDocumentTypeNames() {
    return DOCUMENT_TYPE_NAMES;
  },

  // Get document type display name by type
  getDocumentTypeName(type) {
    return DOCUMENT_TYPE_NAMES[type] || type;
  },

  // Get document status options
  getDocumentStatuses() {
    return [
      'PENDING',       // Chờ xử lý
      'VERIFIED',      // Đã thẩm định
      'REJECTED',      // Bị từ chối
      'EXPIRED',       // Hết hạn
      'ARCHIVED'       // Đã lưu trữ
    ];
  },

  // Get file type options
  getFileTypes() {
    return [
      'PDF',
      'JPG',
      'PNG',
      'DOC',
      'DOCX',
      'XLS',
      'XLSX',
      'TXT'
    ];
  },

  // Convert MIME type to display name
  getDisplayFileType(mimeType) {
    if (!mimeType) return 'Unknown';
    
    // Common MIME type mappings
    const mimeToDisplayType = {
      'application/pdf': 'PDF',
      'application/msword': 'DOC',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
      'application/vnd.ms-excel': 'XLS',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
      'application/vnd.ms-powerpoint': 'PPT',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
      'text/plain': 'TXT',
      'text/csv': 'CSV',
      'image/jpeg': 'JPG',
      'image/jpg': 'JPG',
      'image/png': 'PNG',
      'image/gif': 'GIF',
      'image/bmp': 'BMP',
      'image/tiff': 'TIFF',
      'application/zip': 'ZIP',
      'application/x-rar-compressed': 'RAR',
      'application/json': 'JSON',
      'application/xml': 'XML',
      'text/html': 'HTML',
      'text/css': 'CSS',
      'application/javascript': 'JS'
    };

    // Try exact match first
    if (mimeToDisplayType[mimeType]) {
      return mimeToDisplayType[mimeType];
    }

    // Try pattern matching for common cases
    if (mimeType.includes('word')) return 'DOC/DOCX';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'XLS/XLSX';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'PPT/PPTX';
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.startsWith('image/')) {
      const subtype = mimeType.split('/')[1]?.toUpperCase();
      return subtype || 'Image';
    }
    if (mimeType.startsWith('text/')) return 'Text';
    if (mimeType.startsWith('audio/')) return 'Audio';
    if (mimeType.startsWith('video/')) return 'Video';
    
    // Fallback: return the subtype or the whole mime type
    const parts = mimeType.split('/');
    if (parts.length === 2) {
      return parts[1].toUpperCase();
    }
    
    return mimeType;
  },

  // Get current user information
  async getCurrentUser() {
    try {
      console.log('Calling getCurrentUser API...');
      const response = await apiClient.get(API_ENDPOINTS.USER.GET_CURRENT);
      console.log('getCurrentUser response:', response);
      return response.data.data || response.data;
    } catch (error) {
      console.error('getCurrentUser error:', error);
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy thông tin người dùng hiện tại');
    }
  },

  // Get land information by LandID
  async getLandByID(landID) {
    try {
      console.log('Calling getLandByID API for:', landID);
      const url = API_ENDPOINTS.LAND.GET_BY_ID.replace(':landID', landID);
      const response = await apiClient.get(url);
      console.log('getLandByID response:', response);
      return response.data.data || response.data;
    } catch (error) {
      console.error('getLandByID error:', error);
      // Return null if land not found, don't throw error
      return null;
    }
  }
};

export default documentService;
