import apiClient, { API_ENDPOINTS, handleApiError } from './api';

// Land Management Service - Tích hợp trực tiếp với backend APIs
const landService = {
  // Create new land parcel
  async createLandParcel(landData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.LAND.CREATE, {
        id: landData.id,
        ownerId: landData.ownerID, 
        location: landData.location,
        landUsePurpose: landData.landUsePurpose,
        legalStatus: landData.legalStatus,
        area: Number(landData.area),
        certificateId: landData.certificateID || '',
        legalInfo: landData.legalInfo || ''
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Update existing land parcel
  async updateLandParcel(id, updateData) {
    try {
      // Chỉ gửi những field có giá trị
      const payload = {};
      
      if (updateData.area !== undefined) {
        payload.area = Number(updateData.area);
      }
      if (updateData.location !== undefined) {
        payload.location = updateData.location;
      }
      if (updateData.landUsePurpose !== undefined) {
        payload.landUsePurpose = updateData.landUsePurpose;
      }
      if (updateData.legalStatus !== undefined) {
        payload.legalStatus = updateData.legalStatus;
      }
      if (updateData.certificateId !== undefined) {
        payload.certificateId = updateData.certificateId;
      }
      if (updateData.legalInfo !== undefined) {
        payload.legalInfo = updateData.legalInfo;
      }

      const response = await fetch(`/api/land-parcels/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Lỗi khi cập nhật thửa đất');
      }
      return result;
    } catch (error) {
      throw new Error(error.message || 'Lỗi khi cập nhật thửa đất');
    }
  },

  // Get land parcel by ID
  async getLandParcel(id) {
    try {
      const response = await fetch(`/api/land-parcels/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        }
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Lỗi khi lấy thông tin thửa đất');
      }
      return result.data;
    } catch (error) {
      throw new Error(error.message || 'Lỗi khi lấy thông tin thửa đất');
    }
  },

  // Get all land parcels (for Org1, Org2)
  async getAllLandParcels() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.LAND.GET_ALL);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Search land parcels by keyword and filters
  async searchLandParcels(searchParams) {
    try {
      const queryParams = new URLSearchParams(searchParams);
      const response = await fetch(`/api/land-parcels/search?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        }
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Lỗi khi tìm kiếm');
      }
      return result.data;
    } catch (error) {
      throw new Error(error.message || 'Lỗi khi tìm kiếm');
    }
  },

  // Get land parcels by owner
  async getLandParcelsByOwner(ownerID) {
    try {
      const response = await fetch(`/api/land-parcels/owner/${ownerID}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        }
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Lỗi khi lấy thửa đất theo chủ sử dụng');
      }
      return result.data;
    } catch (error) {
      throw new Error(error.message || 'Lỗi khi lấy thửa đất theo chủ sử dụng');
    }
  },

  // Get land parcel history
  async getLandParcelHistory(id) {
    try {
      const response = await fetch(`/api/land-parcels/${id}/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        }
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Lỗi khi lấy lịch sử thửa đất');
      }
      return result.data;
    } catch (error) {
      throw new Error(error.message || 'Lỗi khi lấy lịch sử thửa đất');
    }
  },

  // Issue land certificate
  async issueLandCertificate(certificateData) {
    try {
      const response = await fetch('/api/land-parcels/issue-certificate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify(certificateData)
      });
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Lỗi khi cấp giấy chứng nhận');
      }
      return result;
    } catch (error) {
      throw new Error(error.message || 'Lỗi khi cấp giấy chứng nhận');
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
          minArea: filters.minArea !== undefined ? filters.minArea.toString() : undefined, // Convert to string
          maxArea: filters.maxArea !== undefined ? filters.maxArea.toString() : undefined, // Convert to string
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
      errors.push('CCCD chủ sử dụng là bắt buộc');
    }

    if (!landData.location || landData.location.trim() === '') {
      errors.push('Vị trí là bắt buộc');
    }

    if (landData.area === undefined || landData.area === null || Number(landData.area) <= 0) {
      errors.push('Diện tích phải lớn hơn 0');
    }

    if (!landData.landUsePurpose) {
      errors.push('Mục đích sử dụng đất là bắt buộc');
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
