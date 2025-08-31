import apiClient, { API_ENDPOINTS, handleApiError } from './api';

// Transaction Management Service - Tích hợp trực tiếp với backend APIs
const transactionService = {
  // Create transfer request
  async createTransferRequest(transferData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.TRANSACTION.TRANSFER, {
        landParcelId: transferData.landParcelID,
        fromOwnerId: transferData.fromOwnerID,
        toOwnerId: transferData.toOwnerID,
        documentIds: transferData.documentIds || [],
        reason: transferData.reason || ''
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Create split request
  async createSplitRequest(splitData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.TRANSACTION.SPLIT, {
        ...splitData,
        reason: splitData.reason || ''
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tạo yêu cầu tách thửa');
    }
  },

  // Create merge request
  async createMergeRequest(mergeData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.TRANSACTION.MERGE, {
        ...mergeData,
        reason: mergeData.reason || ''
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tạo yêu cầu gộp thửa');
    }
  },

  // Create change purpose request
  async createChangePurposeRequest(changePurposeData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.TRANSACTION.CHANGE_PURPOSE, {
        ...changePurposeData,
        reason: changePurposeData.reason || ''
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tạo yêu cầu đổi mục đích sử dụng');
    }
  },

  // Create reissue request
  async createReissueRequest(reissueData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.TRANSACTION.REISSUE, {
        ...reissueData,
        reason: reissueData.reason || ''
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tạo yêu cầu cấp lại giấy chứng nhận');
    }
  },

  // Confirm transfer (for receivers)
  async confirmTransfer(confirmData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.TRANSACTION.CONFIRM, confirmData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi xác nhận chuyển nhượng');
    }
  },

  // Process transaction with 3 decision states (Org2) - UC-31
  async processTransaction(txID, decision, reason = '') {
    try {
      const url = API_ENDPOINTS.TRANSACTION.PROCESS.replace(':txID', txID);
      const response = await apiClient.post(url, { decision, reason });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Forward transaction (Org2)
  async forwardTransaction(txID) {
    try {
      const url = API_ENDPOINTS.TRANSACTION.FORWARD.replace(':txID', txID);
      const response = await apiClient.post(url);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Approve transfer transaction (Org1)
  async approveTransferTransaction(txID) {
    try {
      const url = API_ENDPOINTS.TRANSACTION.APPROVE_TRANSFER.replace(':txID', txID);
      const response = await apiClient.post(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi phê duyệt giao dịch chuyển nhượng');
    }
  },

  // Approve split transaction (Org1)
  async approveSplitTransaction(txID) {
    try {
      const url = API_ENDPOINTS.TRANSACTION.APPROVE_SPLIT.replace(':txID', txID);
      const response = await apiClient.post(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi phê duyệt giao dịch tách thửa');
    }
  },

  // Approve merge transaction (Org1)
  async approveMergeTransaction(txID) {
    try {
      const url = API_ENDPOINTS.TRANSACTION.APPROVE_MERGE.replace(':txID', txID);
      const response = await apiClient.post(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi phê duyệt giao dịch gộp thửa');
    }
  },

  // Approve change purpose transaction (Org1)
  async approveChangePurposeTransaction(txID) {
    try {
      const url = API_ENDPOINTS.TRANSACTION.APPROVE_CHANGE_PURPOSE.replace(':txID', txID);
      const response = await apiClient.post(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi phê duyệt giao dịch đổi mục đích');
    }
  },

  // Approve reissue transaction (Org1)
  async approveReissueTransaction(txID, newCertificateID) {
    try {
      const url = API_ENDPOINTS.TRANSACTION.APPROVE_REISSUE.replace(':txID', txID);
      const response = await apiClient.post(url, { newCertificateID });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi phê duyệt giao dịch cấp lại GCN');
    }
  },

  // Reject transaction (Org1)
  async rejectTransaction(txID, reason) {
    try {
      const url = API_ENDPOINTS.TRANSACTION.REJECT.replace(':txID', txID);
      const response = await apiClient.post(url, { reason });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi từ chối giao dịch');
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

  // Get all transactions
  async getAllTransactions() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.TRANSACTION.GET_ALL);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get transactions by user
  async getTransactionsByUser(userID) {
    try {
      const url = API_ENDPOINTS.TRANSACTION.GET_BY_OWNER.replace(':ownerID', userID);
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
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

  // Get transactions by status
  async getTransactionsByStatus(status) {
    try {
      const url = API_ENDPOINTS.TRANSACTION.GET_BY_STATUS.replace(':status', status);
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy giao dịch theo trạng thái');
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

  // Validate transaction data
  validateTransactionData(transactionData, type) {
    const errors = [];

    if (!transactionData.landParcelID || transactionData.landParcelID.trim() === '') {
      errors.push('Mã thửa đất là bắt buộc');
    }

    switch (type) {
      case 'TRANSFER':
        if (!transactionData.toOwnerID || transactionData.toOwnerID.trim() === '') {
          errors.push('CCCD người nhận là bắt buộc');
        }
        break;
      case 'SPLIT':
        if (!transactionData.newParcels || !Array.isArray(transactionData.newParcels) || transactionData.newParcels.length === 0) {
          errors.push('Danh sách thửa đất mới là bắt buộc');
        }
        break;
      case 'MERGE':
        if (!transactionData.parcelIDs || !Array.isArray(transactionData.parcelIDs) || transactionData.parcelIDs.length < 2) {
          errors.push('Cần ít nhất 2 thửa đất để gộp');
        }
        if (!transactionData.newParcel) {
          errors.push('Thông tin thửa đất mới là bắt buộc');
        }
        break;
      case 'CHANGE_PURPOSE':
        if (!transactionData.newPurpose || transactionData.newPurpose.trim() === '') {
          errors.push('Mục đích sử dụng mới là bắt buộc');
        }
        break;
      case 'REISSUE':
        // No additional validation for reissue
        break;
      default:
        errors.push('Loại giao dịch không hợp lệ');
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

  // Get transaction status text in Vietnamese
  getTransactionStatusText(status) {
    const statusTexts = {
      'PENDING': 'Chờ xử lý',
      'VERIFIED': 'Đã thẩm định',
      'FORWARDED': 'Đã chuyển tiếp',
      'APPROVED': 'Đã phê duyệt',
      'REJECTED': 'Bị từ chối',
      'CONFIRMED': 'Đã xác nhận',
      'SUPPLEMENT_REQUESTED': 'Yêu cầu bổ sung'
    };
    return statusTexts[status] || status;
  },

  // Get transaction type text in Vietnamese
  getTransactionTypeText(type) {
    const typeTexts = {
      'TRANSFER': 'Chuyển nhượng',
      'SPLIT': 'Tách thửa',
      'MERGE': 'Gộp thửa',
      'CHANGE_PURPOSE': 'Đổi mục đích sử dụng',
      'REISSUE': 'Cấp lại giấy chứng nhận'
    };
    return typeTexts[type] || type;
  },

  // Get lands by owner
  async getLandsByOwner(ownerID) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.LAND.GET_BY_OWNER.replace(':ownerID', ownerID));
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy danh sách thửa đất');
    }
  }
};

export default transactionService;