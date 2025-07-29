import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/login', credentials),
  register: (userData) => api.post('/register', userData),
  registerCitizen: (userData) => api.post('/register', { ...userData, org: 'Org3' }),
  verifyOTP: (data) => api.post('/verify-otp', data),
  resendOTP: (data) => api.post('/resend-otp', data),
  logout: () => api.post('/logout'),
  forgotPassword: (data) => api.post('/forgot-password', data),
  resetPassword: (data) => api.post('/reset-password', data),
  changePassword: (data) => api.post('/change-password', data),
};

// Admin API
export const adminAPI = {
  // User management
  getAllUsers: () => api.get('/admin/users'),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  createUser: (userData) => api.post('/admin/users', userData),
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  activateUser: (id) => api.patch(`/admin/users/${id}/activate`),
  deactivateUser: (id) => api.patch(`/admin/users/${id}/deactivate`),

  // Organization management
  getOrganizations: () => api.get('/admin/organizations'),
  createOrganization: (orgData) => api.post('/admin/organizations', orgData),
  updateOrganization: (id, orgData) => api.put(`/admin/organizations/${id}`, orgData),
  deleteOrganization: (id) => api.delete(`/admin/organizations/${id}`),

  // System statistics
  getSystemStats: () => api.get('/admin/stats'),
  getLoginHistory: () => api.get('/admin/login-history'),
  getAuditLogs: () => api.get('/admin/audit-logs'),

  // Bulk operations
  bulkCreateUsers: (users) => api.post('/admin/users/bulk', { users }),
  exportUsers: () => api.get('/admin/users/export'),
  importUsers: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/admin/users/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

// Land Parcel API
export const landParcelAPI = {
  getAll: () => api.get('/land-parcels'),
  getById: (id) => api.get(`/land-parcels/${id}`),
  create: (data) => api.post('/land-parcels', data),
  update: (id, data) => api.put(`/land-parcels/${id}`, data),
  delete: (id) => api.delete(`/land-parcels/${id}`),
  getHistory: (id) => api.get(`/land-parcels/${id}/history`),
  transfer: (id, data) => api.post(`/land-parcels/${id}/transfer`, data),
  getByOwner: (ownerId) => api.get(`/land-parcels/owner/${ownerId}`),
  search: (query) => api.get(`/land-parcels/search?keyword=${encodeURIComponent(query)}`),
  verify: (id) => api.post(`/land-parcels/${id}/verify`),
  uploadDocument: (id, file, ipfsHash) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('ipfsHash', ipfsHash);
    return api.post(`/land-parcels/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

// Certificate API
export const certificateAPI = {
  getAll: () => api.get('/certificates'),
  getById: (id) => api.get(`/certificates/${id}`),
  create: (data) => api.post('/certificates', data),
  update: (id, data) => api.put(`/certificates/${id}`, data),
  delete: (id) => api.delete(`/certificates/${id}`),
  issue: (data) => api.post('/certificates', data),
  revoke: (id, reason) => api.post(`/certificates/${id}/revoke`, { reason }),
  verify: (id) => api.get(`/certificates/${id}/verify`),
  download: (id) => api.get(`/certificates/${id}/download`, { responseType: 'blob' }),
  getByLandParcel: (landParcelId) => api.get(`/certificates/land-parcel/${landParcelId}`),
  uploadToIPFS: (id, ipfsHash) => api.post(`/certificates/${id}/ipfs`, { ipfsHash }),
};

// Transaction API
export const transactionAPI = {
  getAll: () => api.get('/transactions'),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  getByUser: (userId) => api.get(`/transactions/owner/${userId}`),
  getByLandParcel: (landParcelId) => api.get(`/transactions/land-parcel/${landParcelId}`),
  getHistory: () => api.get('/transactions/history'),
  getPending: () => api.get('/transactions/pending'),
  approve: (id) => api.post(`/transactions/${id}/approve`),
  reject: (id, reason) => api.post(`/transactions/${id}/reject`, { reason }),
  cancel: (id) => api.post(`/transactions/${id}/cancel`),
};

// Document API
export const documentAPI = {
  getAll: () => api.get('/documents'),
  getById: (id) => api.get(`/documents/${id}`),
  upload: (file, metadata) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('metadata', JSON.stringify(metadata));
    return api.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadToIPFS: (file, metadata, ipfsHash) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('metadata', JSON.stringify(metadata));
    formData.append('ipfsHash', ipfsHash);
    return api.post('/documents/ipfs', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  download: (id) => api.get(`/documents/${id}/download`, { responseType: 'blob' }),
  downloadFromIPFS: (ipfsHash) => api.get(`/documents/ipfs/${ipfsHash}`, { responseType: 'blob' }),
  delete: (id) => api.delete(`/documents/${id}`),
  getByLandParcel: (landParcelId) => api.get(`/documents/land-parcel/${landParcelId}`),
  verify: (id) => api.get(`/documents/${id}/verify`),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getNotifications: () => api.get('/users/notifications'),
  markNotificationRead: (id) => api.patch(`/users/notifications/${id}/read`),
  getActivity: () => api.get('/users/activity'),
  changePassword: (data) => api.post('/users/change-password', data),
  enable2FA: () => api.post('/users/2fa/enable'),
  disable2FA: () => api.post('/users/2fa/disable'),
  verify2FA: (code) => api.post('/users/2fa/verify', { code }),
};

// Reports API
export const reportsAPI = {
  getLandParcelReport: (params) => api.get('/reports/land-parcels', { params }),
  getTransactionReport: (params) => api.get('/reports/transactions', { params }),
  getCertificateReport: (params) => api.get('/reports/certificates', { params }),
  getUserReport: (params) => api.get('/reports/users', { params }),
  getSystemReport: () => api.get('/reports/system'),
  exportReport: (type, params) => api.get(`/reports/${type}/export`, { 
    params, 
    responseType: 'blob' 
  }),
  getAnalytics: () => api.get('/reports/analytics'),
  getDashboardStats: () => api.get('/reports/dashboard'),
};

// IPFS API
export const ipfsAPI = {
  uploadFile: (file, metadata) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata));
    return api.post('/ipfs/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getFile: (hash) => api.get(`/ipfs/${hash}`, { responseType: 'blob' }),
  getFileInfo: (hash) => api.get(`/ipfs/${hash}/info`),
  pinFile: (hash) => api.post(`/ipfs/${hash}/pin`),
  unpinFile: (hash) => api.delete(`/ipfs/${hash}/pin`),
  listPinned: () => api.get('/ipfs/pinned'),
  getNodeInfo: () => api.get('/ipfs/node'),
};

// Export all APIs
const apiService = {
  authAPI,
  adminAPI,
  landParcelAPI,
  certificateAPI,
  transactionAPI,
  documentAPI,
  userAPI,
  reportsAPI,
  ipfsAPI,
};

export default apiService;
