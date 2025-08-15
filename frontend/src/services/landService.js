import apiClient from './api';
import { API_ENDPOINTS } from './api';

// Land Management Service
const landService = {
  // Create new land parcel
  async createLandParcel(landData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.LAND.CREATE, landData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tạo thửa đất');
    }
  },

  // Update existing land parcel
  async updateLandParcel(id, updateData) {
    try {
      const url = API_ENDPOINTS.LAND.UPDATE.replace(':id', id);
      const response = await apiClient.put(url, updateData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi cập nhật thửa đất');
    }
  },

  // Get land parcel by ID
  async getLandParcel(id) {
    try {
      const url = API_ENDPOINTS.LAND.GET_BY_ID.replace(':id', id);
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy thông tin thửa đất');
    }
  },

  // Get all land parcels (for Org1, Org2)
  async getAllLandParcels() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.LAND.GET_ALL);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy danh sách thửa đất');
    }
  },

  // Search land parcels by keyword and filters
  async searchLandParcels(searchParams) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.LAND.SEARCH, {
        params: searchParams
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tìm kiếm');
    }
  },

  // Get land parcels by owner
  async getLandParcelsByOwner(ownerID) {
    try {
      const url = API_ENDPOINTS.LAND.GET_BY_OWNER.replace(':ownerID', ownerID);
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy thửa đất theo chủ sở hữu');
    }
  },

  // Get land parcel history
  async getLandParcelHistory(id) {
    try {
      const url = API_ENDPOINTS.LAND.GET_HISTORY.replace(':id', id);
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy lịch sử thửa đất');
    }
  },

  // Issue land certificate
  async issueLandCertificate(certificateData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.LAND.ISSUE_CERTIFICATE, certificateData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi cấp giấy chứng nhận');
    }
  },

  // Advanced search with multiple criteria
  async advancedSearch(filters) {
    try {
      const searchParams = {
        keyword: filters.keyword || '',
        filters: JSON.stringify({
          location: filters.location,
          landUsePurpose: filters.landUsePurpose,
          legalStatus: filters.legalStatus,
          minArea: filters.minArea,
          maxArea: filters.maxArea,
          ownerID: filters.ownerID,
          hasCertificate: filters.hasCertificate,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo
        })
      };
      
      return await this.searchLandParcels(searchParams);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi tìm kiếm nâng cao');
    }
  },

  // Get land parcels with pagination
  async getLandParcelsWithPagination(page = 1, pageSize = 10, filters = {}) {
    try {
      const searchParams = {
        page,
        pageSize,
        ...filters
      };
      
      return await this.searchLandParcels(searchParams);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi khi lấy danh sách thửa đất có phân trang');
    }
  },

  // Validate land data before submission
  validateLandData(landData) {
    const errors = [];

    if (!landData.id || landData.id.trim() === '') {
      errors.push('Mã thửa đất là bắt buộc');
    }

    if (!landData.ownerID || landData.ownerID.trim() === '') {
      errors.push('CCCD chủ sở hữu là bắt buộc');
    }

    if (!landData.location || landData.location.trim() === '') {
      errors.push('Vị trí là bắt buộc');
    }

    if (!landData.area || landData.area <= 0) {
      errors.push('Diện tích phải lớn hơn 0');
    }

    if (!landData.landUsePurpose) {
      errors.push('Mục đích sử dụng đất là bắt buộc');
    }

    if (!landData.legalStatus) {
      errors.push('Trạng thái pháp lý là bắt buộc');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Format land data for display
  formatLandData(landData) {
    return {
      ...landData,
      area: landData.area ? `${landData.area} m²` : 'N/A',
      createdAt: landData.createdAt ? new Date(landData.createdAt).toLocaleDateString('vi-VN') : 'N/A',
      updatedAt: landData.updatedAt ? new Date(landData.updatedAt).toLocaleDateString('vi-VN') : 'N/A',
      issueDate: landData.issueDate ? new Date(landData.issueDate).toLocaleDateString('vi-VN') : 'N/A'
    };
  }
};

export default landService;
