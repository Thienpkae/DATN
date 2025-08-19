import apiClient, { API_ENDPOINTS } from './api';

// User Service - Admin-only operations and profile access
const userService = {
  async listUsers(params = {}) {
    const { limit = 50, offset = 0, org, role } = params;
    const response = await apiClient.get(API_ENDPOINTS.USER.LIST_ALL, {
      params: { limit, offset, org, role }
    });
    return response.data;
  },

  async getProfile() {
    const response = await apiClient.get(API_ENDPOINTS.USER.PROFILE);
    return response.data;
  },

  async updateProfile(payload) {
    const response = await apiClient.put(API_ENDPOINTS.USER.UPDATE_PROFILE, payload);
    return response.data;
  },

  async getByCccd(cccd) {
    const url = API_ENDPOINTS.USER.GET_BY_CCCD.replace(':cccd', encodeURIComponent(cccd));
    const response = await apiClient.get(url);
    return response.data;
  },

  async updateByCccd(cccd, payload) {
    const url = API_ENDPOINTS.USER.UPDATE_BY_CCCD.replace(':cccd', encodeURIComponent(cccd));
    try {
      const response = await apiClient.put(url, payload);
      return response.data;
    } catch (error) {
      // Surface specific duplicate phone error
      const msg = error?.response?.data?.error;
      if (msg && /điện thoại|phone/i.test(msg) && /tồn tại|exists/i.test(msg)) {
        const err = new Error('Số điện thoại đã tồn tại');
        err.response = error.response;
        throw err;
      }
      throw error;
    }
  },

  // Admin actions
  async lockUnlockAccount(targetCccd, lock) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOCK_UNLOCK, { targetCccd, lock });
    return response.data;
  },

  async deleteAccount(targetCccd) {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.DELETE_ACCOUNT, { targetCccd });
    return response.data;
  },
};

export default userService;


