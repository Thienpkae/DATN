import apiClient, { API_ENDPOINTS } from './api';

const logService = {
  async searchByTxId(txID) {
    const url = API_ENDPOINTS.LOGS.SEARCH.replace(':txID', encodeURIComponent(txID));
    const response = await apiClient.get(url);
    return response.data;
  }
};

export default logService;


