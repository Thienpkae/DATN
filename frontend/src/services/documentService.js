import apiClient from './api';
import { API_ENDPOINTS } from './api';

// Document Management Service
const documentService = {
  // Create new document
  async createDocument(documentData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.DOCUMENT.CREATE, documentData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tạo tài liệu');
    }
  },

  // Update existing document
  async updateDocument(docID, updateData) {
    try {
      const url = API_ENDPOINTS.DOCUMENT.UPDATE.replace(':docID', docID);
      const response = await apiClient.put(url, updateData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi cập nhật tài liệu');
    }
  },

  // Get document by ID
  async getDocument(docID) {
    try {
      const url = API_ENDPOINTS.DOCUMENT.GET_BY_ID.replace(':docID', docID);
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy thông tin tài liệu');
    }
  },

  // Get all documents (for Org1, Org2)
  async getAllDocuments() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.DOCUMENT.GET_ALL);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy danh sách tài liệu');
    }
  },

  // Search documents by keyword and filters
  async searchDocuments(searchParams) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.DOCUMENT.SEARCH, {
        params: searchParams
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tìm kiếm tài liệu');
    }
  },

  // Get documents by status
  async getDocumentsByStatus(status) {
    try {
      const url = API_ENDPOINTS.DOCUMENT.GET_BY_STATUS.replace(':status', status);
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy tài liệu theo trạng thái');
    }
  },

  // Get documents by type
  async getDocumentsByType(docType) {
    try {
      const url = API_ENDPOINTS.DOCUMENT.GET_BY_TYPE.replace(':docType', docType);
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy tài liệu theo loại');
    }
  },

  // Get documents by land parcel
  async getDocumentsByLandParcel(landParcelID) {
    try {
      const url = API_ENDPOINTS.DOCUMENT.GET_BY_LAND.replace(':landParcelID', landParcelID);
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy tài liệu theo thửa đất');
    }
  },

  // Get documents by transaction
  async getDocumentsByTransaction(txID) {
    try {
      const url = API_ENDPOINTS.DOCUMENT.GET_BY_TRANSACTION.replace(':txID', txID);
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy tài liệu theo giao dịch');
    }
  },

  // Get documents by uploader
  async getDocumentsByUploader(uploaderID) {
    try {
      const url = API_ENDPOINTS.DOCUMENT.GET_BY_UPLOADER.replace(':uploaderID', uploaderID);
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy tài liệu theo người upload');
    }
  },

  // Get document history
  async getDocumentHistory(ipfsHash) {
    try {
      const url = API_ENDPOINTS.DOCUMENT.GET_HISTORY.replace(':ipfsHash', ipfsHash);
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy lịch sử tài liệu');
    }
  },

  // Delete document
  async deleteDocument(docID) {
    try {
      const url = API_ENDPOINTS.DOCUMENT.DELETE.replace(':docID', docID);
      const response = await apiClient.delete(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi xóa tài liệu');
    }
  },

  // Link document to land parcel
  async linkDocumentToLand(linkData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.DOCUMENT.LINK_TO_LAND, linkData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi liên kết tài liệu với thửa đất');
    }
  },

  // Link document to transaction
  async linkDocumentToTransaction(linkData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.DOCUMENT.LINK_TO_TRANSACTION, linkData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi liên kết tài liệu với giao dịch');
    }
  },

  // Verify document (Org2 only)
  async verifyDocument(docID, verificationData) {
    try {
      const url = API_ENDPOINTS.DOCUMENT.VERIFY.replace(':docID', docID);
      const response = await apiClient.post(url, verificationData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi xác thực tài liệu');
    }
  },

  // Reject document (Org2 only)
  async rejectDocument(docID, rejectionData) {
    try {
      const url = API_ENDPOINTS.DOCUMENT.REJECT.replace(':docID', docID);
      const response = await apiClient.post(url, rejectionData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi từ chối tài liệu');
    }
  },

  // Analyze document (Org1, Org2 only)
  async analyzeDocument(docID) {
    try {
      const url = API_ENDPOINTS.DOCUMENT.ANALYZE.replace(':docID', docID);
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
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
    if (!document || !document.description) {
      return {
        hasMetadata: false,
        originalDescription: document?.description || '',
        metadataHash: null,
        metadataUploadedAt: null,
        metadataUploadedBy: null
      };
    }

    try {
      // Try to parse description as JSON metadata
      const parsed = JSON.parse(document.description);
      
      // Check if it's our metadata format
      if (parsed.metadataHash && parsed.metadataUploadedAt) {
        return {
          hasMetadata: true,
          originalDescription: parsed.originalDescription || '',
          metadataHash: parsed.metadataHash,
          metadataUploadedAt: parsed.metadataUploadedAt,
          metadataUploadedBy: parsed.metadataUploadedBy
        };
      }
    } catch (e) {
      // If parsing fails, it's just a regular description
    }

    return {
      hasMetadata: false,
      originalDescription: document.description,
      metadataHash: null,
      metadataUploadedAt: null,
      metadataUploadedBy: null
    };
  },

  // Get document with parsed metadata
  getDocumentWithMetadata(document) {
    const metadata = this.extractMetadata(document);
    return {
      ...document,
      metadata,
      // For backward compatibility, keep original description accessible
      originalDescription: metadata.originalDescription,
      // If there's metadata, use it for display
      displayDescription: metadata.hasMetadata ? metadata.originalDescription : document.description
    };
  },

  // Get all documents with parsed metadata
  async getAllDocumentsWithMetadata() {
    try {
      const documents = await this.getAllDocuments();
      return documents.map(doc => this.getDocumentWithMetadata(doc));
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy danh sách tài liệu');
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
    const metadata = this.extractMetadata(documentData);
    
    return {
      ...documentData,
      metadata,
      fileSize: documentData.fileSize ? `${(documentData.fileSize / 1024).toFixed(2)} KB` : 'N/A',
      createdAt: documentData.createdAt ? new Date(documentData.createdAt).toLocaleDateString('vi-VN') : 'N/A',
      updatedAt: documentData.updatedAt ? new Date(documentData.updatedAt).toLocaleDateString('vi-VN') : 'N/A',
      verifiedAt: documentData.verifiedAt ? new Date(documentData.verifiedAt).toLocaleDateString('vi-VN') : 'N/A',
      // Use metadata description if available
      displayDescription: metadata.hasMetadata ? metadata.originalDescription : documentData.description
    };
  },

  // Get document type options
  getDocumentTypes() {
    return [
      'CERTIFICATE',    // Giấy chứng nhận
      'CONTRACT',       // Hợp đồng
      'MAP',           // Bản đồ
      'IDENTITY',      // Giấy tờ tùy thân
      'APPLICATION',   // Đơn từ
      'OTHER'          // Khác
    ];
  },

  // Get document status options
  getDocumentStatuses() {
    return [
      'PENDING',       // Chờ xử lý
      'VERIFIED',      // Đã xác thực
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
  }
};

export default documentService;
