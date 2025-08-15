import apiClient from './api';
import { API_ENDPOINTS } from './api';

// Transaction Management Service
const transactionService = {
  // Process transaction (Org2 only)
  async processTransaction(txID) {
    try {
      const url = API_ENDPOINTS.TRANSACTION.PROCESS.replace(':txID', txID);
      const response = await apiClient.post(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi xử lý giao dịch');
    }
  },

  // Create transfer request (Org3 only)
  async createTransferRequest(transferData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.TRANSACTION.TRANSFER, transferData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tạo yêu cầu chuyển nhượng');
    }
  },

  // Confirm transfer (Org3 only)
  async confirmTransfer(confirmData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.TRANSACTION.CONFIRM, confirmData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi xác nhận chuyển nhượng');
    }
  },

  // Create split request (Org3 only)
  async createSplitRequest(splitData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.TRANSACTION.SPLIT, splitData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tạo yêu cầu tách thửa');
    }
  },

  // Create merge request (Org3 only)
  async createMergeRequest(mergeData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.TRANSACTION.MERGE, mergeData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tạo yêu cầu hợp thửa');
    }
  },

  // Create change purpose request (Org3 only)
  async createChangePurposeRequest(purposeData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.TRANSACTION.CHANGE_PURPOSE, purposeData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tạo yêu cầu thay đổi mục đích sử dụng');
    }
  },

  // Create reissue request (Org3 only)
  async createReissueRequest(reissueData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.TRANSACTION.REISSUE, reissueData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tạo yêu cầu cấp lại giấy chứng nhận');
    }
  },

  // Forward transaction (Org2 only)
  async forwardTransaction(txID, forwardData) {
    try {
      const url = API_ENDPOINTS.TRANSACTION.FORWARD.replace(':txID', txID);
      const response = await apiClient.post(url, forwardData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi chuyển tiếp giao dịch');
    }
  },

  // Approve transfer transaction (Org1 only)
  async approveTransferTransaction(txID, approvalData) {
    try {
      const url = API_ENDPOINTS.TRANSACTION.APPROVE_TRANSFER.replace(':txID', txID);
      const response = await apiClient.post(url, approvalData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi phê duyệt giao dịch chuyển nhượng');
    }
  },

  // Approve split transaction (Org1 only)
  async approveSplitTransaction(txID, approvalData) {
    try {
      const url = API_ENDPOINTS.TRANSACTION.APPROVE_SPLIT.replace(':txID', txID);
      const response = await apiClient.post(url, approvalData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi phê duyệt giao dịch tách thửa');
    }
  },

  // Approve merge transaction (Org1 only)
  async approveMergeTransaction(txID, approvalData) {
    try {
      const url = API_ENDPOINTS.TRANSACTION.APPROVE_MERGE.replace(':txID', txID);
      const response = await apiClient.post(url, approvalData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi phê duyệt giao dịch hợp thửa');
    }
  },

  // Approve change purpose transaction (Org1 only)
  async approveChangePurposeTransaction(txID, approvalData) {
    try {
      const url = API_ENDPOINTS.TRANSACTION.APPROVE_CHANGE_PURPOSE.replace(':txID', txID);
      const response = await apiClient.post(url, approvalData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi phê duyệt giao dịch thay đổi mục đích sử dụng');
    }
  },

  // Approve reissue transaction (Org1 only)
  async approveReissueTransaction(txID, approvalData) {
    try {
      const url = API_ENDPOINTS.TRANSACTION.APPROVE_REISSUE.replace(':txID', txID);
      const response = await apiClient.post(url, approvalData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi phê duyệt giao dịch cấp lại giấy chứng nhận');
    }
  },

  // Reject transaction (Org1 only)
  async rejectTransaction(txID, rejectionData) {
    try {
      const url = API_ENDPOINTS.TRANSACTION.REJECT.replace(':txID', txID);
      const response = await apiClient.post(url, rejectionData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi từ chối giao dịch');
    }
  },

  // Search transactions
  async searchTransactions(searchParams) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.TRANSACTION.SEARCH, {
        params: searchParams
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tìm kiếm giao dịch');
    }
  },

  // Get transactions by status (Org1, Org2 only)
  async getTransactionsByStatus(status) {
    try {
      const url = API_ENDPOINTS.TRANSACTION.GET_BY_STATUS.replace(':status', status);
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy giao dịch theo trạng thái');
    }
  },

  // Get transactions by land parcel
  async getTransactionsByLandParcel(landParcelID) {
    try {
      const url = API_ENDPOINTS.TRANSACTION.GET_BY_LAND.replace(':landParcelID', landParcelID);
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy giao dịch theo thửa đất');
    }
  },

  // Get transactions by owner
  async getTransactionsByOwner(ownerID) {
    try {
      const url = API_ENDPOINTS.TRANSACTION.GET_BY_OWNER.replace(':ownerID', ownerID);
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy giao dịch theo chủ sở hữu');
    }
  },

  // Get transaction history
  async getTransactionHistory(txID) {
    try {
      const url = API_ENDPOINTS.TRANSACTION.GET_HISTORY.replace(':txID', txID);
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy lịch sử giao dịch');
    }
  },

  // Get all transactions (Org1, Org2 only)
  async getAllTransactions() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.TRANSACTION.GET_ALL);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy danh sách giao dịch');
    }
  },

  // Get transaction by ID
  async getTransaction(txID) {
    try {
      const url = API_ENDPOINTS.TRANSACTION.GET_BY_ID.replace(':txID', txID);
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy thông tin giao dịch');
    }
  },

  // Advanced search with multiple criteria
  async advancedSearch(filters) {
    try {
      const searchParams = {
        keyword: filters.keyword || '',
        filters: JSON.stringify({
          type: filters.type,
          status: filters.status,
          landParcelID: filters.landParcelID,
          fromOwnerID: filters.fromOwnerID,
          toOwnerID: filters.toOwnerID,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          action: filters.action
        })
      };
      
      return await this.searchTransactions(searchParams);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tìm kiếm nâng cao');
    }
  },

  // Get transactions with pagination
  async getTransactionsWithPagination(page = 1, pageSize = 10, filters = {}) {
    try {
      const searchParams = {
        page,
        pageSize,
        ...filters
      };
      
      return await this.searchTransactions(searchParams);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy danh sách giao dịch có phân trang');
    }
  },

  // Validate transaction data before submission
  validateTransactionData(transactionData, type) {
    const errors = [];

    if (!transactionData.txID || transactionData.txID.trim() === '') {
      errors.push('Mã giao dịch là bắt buộc');
    }

    if (!transactionData.landParcelID || transactionData.landParcelID.trim() === '') {
      errors.push('Mã thửa đất là bắt buộc');
    }

    switch (type) {
      case 'TRANSFER':
        if (!transactionData.fromOwnerID || transactionData.fromOwnerID.trim() === '') {
          errors.push('CCCD người chuyển nhượng là bắt buộc');
        }
        if (!transactionData.toOwnerID || transactionData.toOwnerID.trim() === '') {
          errors.push('CCCD người nhận chuyển nhượng là bắt buộc');
        }
        break;
      
      case 'SPLIT':
        if (!transactionData.parcelIDs || transactionData.parcelIDs.length === 0) {
          errors.push('Danh sách mã thửa đất tách là bắt buộc');
        }
        break;
      
      case 'MERGE':
        if (!transactionData.parcelIDs || transactionData.parcelIDs.length < 2) {
          errors.push('Cần ít nhất 2 thửa đất để hợp thửa');
        }
        break;
      
      case 'CHANGE_PURPOSE':
        if (!transactionData.newPurpose || transactionData.newPurpose.trim() === '') {
          errors.push('Mục đích sử dụng mới là bắt buộc');
        }
        break;
      case 'REISSUE':
        // No additional validation required for reissue
        break;
      default:
        // No additional validation for unknown types
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Format transaction data for display
  formatTransactionData(transactionData) {
    return {
      ...transactionData,
      createdAt: transactionData.createdAt ? new Date(transactionData.createdAt).toLocaleDateString('vi-VN') : 'N/A',
      updatedAt: transactionData.updatedAt ? new Date(transactionData.updatedAt).toLocaleDateString('vi-VN') : 'N/A'
    };
  },

  // Get transaction type options
  getTransactionTypes() {
    return [
      'TRANSFER',        // Chuyển nhượng
      'SPLIT',          // Tách thửa
      'MERGE',          // Hợp thửa
      'CHANGE_PURPOSE', // Thay đổi mục đích sử dụng
      'REISSUE'         // Cấp lại giấy chứng nhận
    ];
  },

  // Get transaction status options
  getTransactionStatuses() {
    return [
      'PENDING',              // Chờ xử lý
      'CONFIRMED',            // Đã xác nhận
      'FORWARDED',            // Đã chuyển tiếp
      'VERIFIED',             // Đã xác thực
      'SUPPLEMENT_REQUESTED', // Yêu cầu bổ sung
      'APPROVED',             // Đã phê duyệt
      'REJECTED'              // Bị từ chối
    ];
  },

  // Get transaction action options
  getTransactionActions() {
    return [
      'CREATE',   // Tạo mới
      'UPDATE',   // Cập nhật
      'QUERY',    // Truy vấn
      'APPROVE',  // Phê duyệt
      'REJECT'    // Từ chối
    ];
  },

  // Get required documents for transaction type
  getRequiredDocuments(transactionType) {
    const requiredDocs = {
      'TRANSFER': ['Hợp đồng chuyển nhượng', 'Giấy chứng nhận QSDĐ', 'Giấy tờ tùy thân'],
      'SPLIT': ['Đơn xin tách thửa', 'Giấy chứng nhận QSDĐ', 'Sơ đồ thửa đất'],
      'MERGE': ['Đơn xin hợp thửa', 'Giấy chứng nhận QSDĐ', 'Sơ đồ thửa đất'],
      'CHANGE_PURPOSE': ['Đơn xin thay đổi mục đích sử dụng đất', 'Giấy chứng nhận QSDĐ'],
      'REISSUE': ['Đơn xin cấp lại GCN', 'Giấy tờ tùy thân']
    };
    return requiredDocs[transactionType] || [];
  }
};

export default transactionService;
