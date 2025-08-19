import apiClient, { API_ENDPOINTS } from './api';

const systemConfigService = {
  async listConfigs(params = {}) {
    const response = await apiClient.get(API_ENDPOINTS.SYSTEM.CONFIGS, { params });
    return response.data;
  },

  async getCategories() {
    const response = await apiClient.get(API_ENDPOINTS.SYSTEM.CONFIG_CATEGORIES);
    return response.data;
  },

  async getConfig(key) {
    const url = API_ENDPOINTS.SYSTEM.GET_CONFIG.replace(':key', encodeURIComponent(key));
    const response = await apiClient.get(url);
    return response.data;
  },

  async updateConfig(key, payload) {
    const url = API_ENDPOINTS.SYSTEM.UPDATE_CONFIG.replace(':key', encodeURIComponent(key));
    const response = await apiClient.put(url, payload);
    return response.data;
  },

  async deleteConfig(key) {
    const url = API_ENDPOINTS.SYSTEM.DELETE_CONFIG.replace(':key', encodeURIComponent(key));
    const response = await apiClient.delete(url);
    return response.data;
  },

  async resetConfig(key) {
    const url = API_ENDPOINTS.SYSTEM.RESET_CONFIG.replace(':key', encodeURIComponent(key));
    const response = await apiClient.post(url);
    return response.data;
  },

  async initializeDefaults() {
    const response = await apiClient.post(API_ENDPOINTS.SYSTEM.INITIALIZE_CONFIG);
    return response.data;
  }
};

export default systemConfigService;


