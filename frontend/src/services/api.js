/**
 * API Service Layer
 * Handles all communication with the backend server
 * Updated to match actual backend endpoints
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('authToken');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  // Get authentication token
  getToken() {
    return this.token || localStorage.getItem('authToken');
  }

  // Clear authentication
  clearAuth() {
    this.token = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  // Make HTTP request
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      // Handle 401 unauthorized
      if (response.status === 401) {
        this.clearAuth();
        window.location.href = '/login';
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.error || `HTTP error! status: ${response.status}`,
          response.status,
          data
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(`Network error: ${error.message}`, 0, null);
    }
  }

  // HTTP methods
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: data,
    });
  }

  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data,
    });
  }

  async delete(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      body: data,
    });
  }

  // Authentication APIs
  async login(credentials) {
    const response = await this.post('/login', credentials);
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async logout() {
    try {
      await this.post('/logout');
    } finally {
      this.clearAuth();
    }
  }

  async register(userData) {
    return this.post('/register', userData);
  }

  // verifyOTP method moved to avoid duplicates

  async resendOTP(cccd) {
    return this.post('/resend-otp', { cccd });
  }

  // changePassword method moved to avoid duplicates

  async forgotPassword(data) {
    return this.post('/forgot-password', data);
  }

  async resetPassword(data) {
    return this.post('/reset-password', data);
  }

  // User Management APIs
  async lockUnlockAccount(targetCccd, lock) {
    return this.post('/account/lock-unlock', { targetCccd, lock });
  }

  async deleteAccount(targetCccd) {
    return this.delete('/account/delete', { targetCccd });
  }

  // Land Parcel APIs
  async createLandParcel(landParcelData) {
    return this.post('/land-parcels', landParcelData);
  }

  async updateLandParcel(landParcelID, updateData) {
    return this.put(`/land-parcels/${landParcelID}`, updateData);
  }

  async getLandParcel(id) {
    return this.get(`/land-parcels/${id}`);
  }

  async getLandParcelsByOwner(ownerID) {
    return this.get(`/land-parcels/owner/${ownerID}`);
  }

  async searchLandParcels(keyword) {
    return this.get('/land-parcels/search', { keyword });
  }

  // Certificate APIs
  async issueCertificate(certificateData) {
    return this.post('/certificates', certificateData);
  }

  async getCertificate(certificateID) {
    return this.get(`/certificates/${certificateID}`);
  }

  async getCertificatesByOwner(ownerID) {
    return this.get(`/certificates/owner/${ownerID}`);
  }

  async getCertificatesByLandParcel(landParcelID) {
    return this.get(`/certificates/land-parcel/${landParcelID}`);
  }

  async searchCertificates(params) {
    return this.get('/certificates/search', params);
  }

  // Transaction APIs
  async createTransferRequest(transferData) {
    return this.post('/transfer-requests', transferData);
  }

  async confirmTransfer(txID, confirmData) {
    return this.post(`/transfer-requests/${txID}/confirm`, confirmData);
  }

  async createSplitRequest(splitData) {
    return this.post('/split-requests', splitData);
  }

  async createMergeRequest(mergeData) {
    return this.post('/merge-requests', mergeData);
  }

  async createChangePurposeRequest(changePurposeData) {
    return this.post('/change-purpose-requests', changePurposeData);
  }

  async createReissueRequest(reissueData) {
    return this.post('/reissue-requests', reissueData);
  }

  // processTransaction and forwardTransaction methods moved to avoid duplicates

  async approveTransaction(txID, approveDetails) {
    return this.post(`/transactions/${txID}/approve`, { approveDetails });
  }

  async rejectTransaction(txID, rejectDetails) {
    return this.post(`/transactions/${txID}/reject`, { rejectDetails });
  }

  async getTransaction(txID) {
    return this.get(`/transactions/${txID}`);
  }

  async searchTransactions(params) {
    return this.get('/transactions/search', params);
  }

  async getTransactionsByLandParcel(landParcelID) {
    return this.get(`/transactions/land-parcel/${landParcelID}`);
  }

  async getTransactionsByOwner(ownerID) {
    return this.get(`/transactions/owner/${ownerID}`);
  }

  // Document APIs
  async uploadDocument(documentData) {
    return this.post('/documents', documentData);
  }

  async updateDocument(documentID, updateData) {
    return this.put(`/documents/${documentID}`, updateData);
  }

  async verifyDocument(docID) {
    return this.post(`/documents/${docID}/verify`);
  }

  async getDocument(docID) {
    return this.get(`/documents/${docID}`);
  }

  async searchDocuments(id, keyword) {
    return this.get(`/documents/search/${id}`, { keyword });
  }

  async getDocumentsByTransaction(txID) {
    return this.get(`/documents/transaction/${txID}`);
  }

  async getDocumentsByIPFS(keyword) {
    return this.get(`/documents/ipfs/${keyword}`);
  }

  // Logs APIs
  async searchLogs(txID, keyword) {
    return this.get(`/logs/search/${txID}`, { keyword });
  }

  // Transaction Management APIs
  async getAllTransactions() {
    return this.get('/transactions');
  }

  async getTransactionStats() {
    return this.get('/transactions/stats');
  }

  async getTransactionStatsByOwner(ownerID) {
    return this.get(`/transactions/stats/owner/${ownerID}`);
  }

  // Document Management APIs
  async getAllDocuments() {
    return this.get('/documents');
  }

  async getDocumentStats() {
    return this.get('/documents/stats');
  }

  // Certificate Verification APIs
  async getAllCertificates() {
    return this.get('/certificates');
  }

  async verifyCertificate(certificateID, verificationData) {
    return this.post(`/certificates/${certificateID}/verify`, verificationData);
  }

  async getCertificateStats() {
    return this.get('/certificates/stats');
  }

  async getCertificateStatsByOwner(ownerID) {
    return this.get(`/certificates/stats/owner/${ownerID}`);
  }

  async searchCertificatesByOwner(ownerID, keyword) {
    return this.get(`/certificates/search/owner/${ownerID}`, { keyword });
  }

  async downloadCertificate(certificateID) {
    return this.get(`/certificates/${certificateID}/download`, {}, {
      responseType: 'blob'
    });
  }

  // Additional Transaction Request APIs are already defined above

  // System APIs
  async getSystemHealth() {
    return this.get('/system/health');
  }

  async getSystemStats() {
    return this.get('/system/stats');
  }

  // Reports APIs
  async getReports(params) {
    return this.get('/reports', params);
  }

  async exportReport(params) {
    return this.get('/reports/export', params, { responseType: 'blob' });
  }

  // User Management APIs
  async getUsers() {
    return this.get('/users');
  }

  async getUserStats() {
    return this.get('/users/stats');
  }

  async createUser(userData) {
    return this.post('/users', userData);
  }

  async updateUser(userId, userData) {
    return this.put(`/users/${userId}`, userData);
  }

  async deleteUser(userId) {
    return this.delete(`/users/${userId}`);
  }

  async updateUserStatus(userId, active) {
    return this.put(`/users/${userId}/status`, { active });
  }

  // System Settings APIs
  async getSystemSettings() {
    return this.get('/system/settings');
  }

  async updateSystemSettings(settings) {
    return this.put('/system/settings', settings);
  }

  async testSystemConnection() {
    return this.get('/system/test-connection');
  }

  // Land Parcel History APIs
  async getLandParcelHistory(landParcelId, params = {}) {
    return this.get(`/land-parcels/${landParcelId}/history`, params);
  }

  // Bulk Operations APIs
  async uploadBulkFile(formData) {
    return this.post('/land-parcels/bulk/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }

  async performBulkOperation(operationData) {
    return this.post('/land-parcels/bulk', operationData);
  }

  async exportData(params) {
    return this.get('/export/land-parcels', params, { responseType: 'blob' });
  }

  // Global Search APIs
  async globalSearch(params) {
    return this.get('/search/global', params);
  }

  // Transaction Processing APIs (Org2)
  async processTransaction(txID, processData) {
    return this.post(`/transactions/${txID}/process`, processData);
  }

  async forwardTransaction(txID, forwardData) {
    return this.post(`/transactions/${txID}/forward`, forwardData);
  }

  async getTransactionProcessingStats() {
    return this.get('/transactions/processing/stats');
  }

  // Profile Management APIs (Org3)
  async getProfile() {
    return this.get('/profile');
  }

  async updateProfile(profileData) {
    return this.put('/profile', profileData);
  }

  async changePassword(passwordData) {
    return this.post('/change-password', passwordData);
  }

  async requestOTP(otpData) {
    return this.post('/request-otp', otpData);
  }

  async verifyOTP(otpData) {
    return this.post('/verify-otp', otpData);
  }

  async uploadAvatar(formData) {
    return this.post('/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }

  // Certificate Revocation API (Org1)
  async revokeCertificate(certificateID, revocationData) {
    return this.post(`/certificates/${certificateID}/revoke`, revocationData);
  }

  // Document Rejection API (Org2)
  async rejectDocument(docID, rejectionData) {
    return this.post(`/documents/${docID}/reject`, rejectionData);
  }

  // Pending Documents API (Org2)
  async getPendingDocuments() {
    return this.get('/documents/pending');
  }

  // Additional Transaction Types methods already defined above

  // Personal Statistics API (Org3)
  async getPersonalStats() {
    return this.get('/dashboard/stats');
  }

  // Analytics API
  async getAnalytics(params = {}) {
    return this.get('/analytics', params);
  }

  // ===== BACKEND-MATCHED API METHODS =====

  // Land Parcel APIs (matching server.js exactly)
  async getAllLandParcels(params = {}) {
    return this.get('/land-parcels', params);
  }

  async deleteLandParcel(id) {
    return this.delete(`/land-parcels/${id}`);
  }

  // Additional Backend-Matched API Methods (non-duplicates only)

  // System Reports API (new)
  async getSystemReports(startDate = '', endDate = '', type = '') {
    return this.get('/reports/system', { startDate, endDate, type });
  }

  // Analytics Data API (new)
  async getAnalyticsData(period = '30d') {
    return this.get('/analytics', { period });
  }

  // Bulk Operations API (enhanced)
  async bulkLandParcelOperation(operation, landParcelIds, data = {}) {
    return this.post('/land-parcels/bulk', { operation, landParcelIds, data });
  }

  // ===== ADDITIONAL MAIN FUNCTIONS (Non-duplicates only) =====

  // User Management APIs (All Orgs - Admin only) - New methods only
  async registerUser(userData) {
    return this.post('/register', userData);
  }

  async getAllUsers(params = {}) {
    return this.get('/users', params);
  }

  async getUserByCccd(cccd) {
    return this.get(`/users/${cccd}`);
  }

  // Note: updateDocument, lockUnlockAccount, deleteAccount, and updateUser
  // are already defined earlier in this file
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
export { ApiError };
