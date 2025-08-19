import axios from 'axios';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
const API_TIMEOUT = 30000; // 30 seconds

// API Endpoints Structure - Updated to match backend exactly
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    VERIFY_OTP: '/auth/verify-otp',
    RESEND_OTP: '/auth/resend-otp',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
    LOCK_UNLOCK: '/auth/lock-unlock',
    DELETE_ACCOUNT: '/auth/delete',
  },
  USER: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    LIST_ALL: '/users',
    GET_BY_CCCD: '/users/:cccd',
    UPDATE_BY_CCCD: '/users/:cccd',
    GET_SELF_BY_CCCD: '/users/self/:cccd',
  },
  LAND: {
    CREATE: '/land-parcels',
    UPDATE: '/land-parcels/:id',
    GET_BY_ID: '/land-parcels/:id',
    GET_ALL: '/land-parcels',
    SEARCH: '/land-parcels/search',
    GET_BY_OWNER: '/land-parcels/owner/:ownerID',
    GET_HISTORY: '/land-parcels/:id/history',
    ISSUE_CERTIFICATE: '/land-parcels/issue-certificate',
  },
  DOCUMENT: {
    CREATE: '/documents',
    UPDATE: '/documents/:docID',
    DELETE: '/documents/:docID',
    GET_BY_ID: '/documents/:docID',
    GET_ALL: '/documents',
    SEARCH: '/documents/search',
    GET_BY_STATUS: '/documents/status/:status',
    GET_BY_TYPE: '/documents/type/:docType',
    GET_BY_LAND: '/documents/land-parcel/:landParcelID',
    GET_BY_TRANSACTION: '/documents/transaction/:txID',
    GET_BY_UPLOADER: '/documents/uploader/:uploaderID',
    GET_HISTORY: '/documents/history/:ipfsHash',
    VERIFY: '/documents/:docID/verify',
    REJECT: '/documents/:docID/reject',
    ANALYZE: '/documents/:docID/analyze',
    LINK_TO_LAND: '/documents/land',
    LINK_TO_TRANSACTION: '/documents/transaction',
  },
  TRANSACTION: {
    PROCESS: '/transactions/:txID/process',
    TRANSFER: '/transactions/transfer',
    CONFIRM: '/transactions/confirm',
    SPLIT: '/transactions/split',
    MERGE: '/transactions/merge',
    CHANGE_PURPOSE: '/transactions/change-purpose',
    REISSUE: '/transactions/reissue',
    FORWARD: '/transactions/:txID/forward',
    APPROVE_TRANSFER: '/transactions/:txID/approve/transfer',
    APPROVE_SPLIT: '/transactions/:txID/approve/split',
    APPROVE_MERGE: '/transactions/:txID/approve/merge',
    APPROVE_CHANGE_PURPOSE: '/transactions/:txID/approve/change-purpose',
    APPROVE_REISSUE: '/transactions/:txID/approve/reissue',
    REJECT: '/transactions/:txID/reject',
    SEARCH: '/transactions/search',
    GET_BY_STATUS: '/transactions/status/:status',
    GET_BY_LAND: '/transactions/land-parcel/:landParcelID',
    GET_BY_OWNER: '/transactions/owner/:ownerID',
    GET_HISTORY: '/transactions/:txID/history',
    GET_ALL: '/transactions',
    GET_BY_ID: '/transactions/:txID',
  },
  DASHBOARD: {
    MAIN: '/dashboard',
    STATS: '/dashboard',
  },
  REPORTS: {
    SYSTEM: '/reports/system',
    ANALYTICS: '/reports/analytics',
    EXPORT: '/reports/export/:dataType',
  },
  SYSTEM: {
    CONFIGS: '/system/configs',
    CONFIG_CATEGORIES: '/system/configs/categories',
    GET_CONFIG: '/system/configs/:key',
    UPDATE_CONFIG: '/system/configs/:key',
    DELETE_CONFIG: '/system/configs/:key',
    RESET_CONFIG: '/system/configs/:key/reset',
    INITIALIZE_CONFIG: '/system/configs/initialize',
  },
  NOTIFICATIONS: {
    LIST: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    MARK_READ: '/notifications/mark-read',
    MARK_ALL_READ: '/notifications/mark-all-read',
    PREFERENCES: '/notifications/preferences',
    SEND: '/notifications/send',
  },
  IPFS: {
    UPLOAD: '/ipfs/upload',
    GET: '/ipfs/:hash',
    DELETE: '/ipfs/:hash',
    PIN: '/ipfs/pin',
    UNPIN: '/ipfs/unpin',
  },
  LOGS: {
    SEARCH: '/logs/:txID',
  },
  WS: {
    NOTIFICATIONS: '/ws/notifications',
  },
};

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh and errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - Try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { token } = response.data;
          localStorage.setItem('jwt_token', token);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - redirect to login
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Request/Response Transformers
export const transformRequest = (data) => {
  // Transform frontend data format to backend format
  if (data && typeof data === 'object') {
    // Handle date formatting
    if (data.createdAt && data.createdAt instanceof Date) {
      data.createdAt = data.createdAt.toISOString();
    }
    if (data.updatedAt && data.updatedAt instanceof Date) {
      data.updatedAt = data.updatedAt.toISOString();
    }
    
    // Handle file uploads
    if (data.file && data.file instanceof File) {
      const formData = new FormData();
      formData.append('file', data.file);
      // Add other fields
      Object.keys(data).forEach(key => {
        if (key !== 'file') {
          formData.append(key, data[key]);
        }
      });
      return formData;
    }
  }
  return data;
};

export const transformResponse = (data) => {
  // Transform backend data format to frontend format
  if (data && typeof data === 'object') {
    // Handle date parsing
    if (data.createdAt && typeof data.createdAt === 'string') {
      data.createdAt = new Date(data.createdAt);
    }
    if (data.updatedAt && typeof data.updatedAt === 'string') {
      data.updatedAt = new Date(data.updatedAt);
    }
    
    // Handle nested objects
    if (data.landParcel && typeof data.landParcel === 'string') {
      try {
        data.landParcel = JSON.parse(data.landParcel);
      } catch (e) {
        // Keep as string if parsing fails
      }
    }
  }
  return data;
};

// Error Handling Middleware
export const handleApiError = (error) => {
  let message = 'Đã xảy ra lỗi không xác định';
  let type = 'error';

  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        message = data.message || 'Dữ liệu không hợp lệ';
        type = 'warning';
        break;
      case 401:
        message = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        type = 'error';
        // Redirect to login
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        break;
      case 403:
        message = 'Bạn không có quyền thực hiện hành động này';
        type = 'error';
        break;
      case 404:
        message = 'Không tìm thấy dữ liệu yêu cầu';
        type = 'warning';
        break;
      case 409:
        message = data.message || 'Dữ liệu đã tồn tại';
        type = 'warning';
        break;
      case 422:
        message = data.message || 'Dữ liệu không hợp lệ';
        type = 'warning';
        break;
      case 500:
        message = 'Lỗi server. Vui lòng thử lại sau.';
        type = 'error';
        break;
      default:
        message = data.message || `Lỗi ${status}: ${data.error || 'Unknown error'}`;
        type = 'error';
    }
  } else if (error.request) {
    // Request was made but no response received
    message = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
    type = 'error';
  } else {
    // Something else happened
    message = error.message || 'Đã xảy ra lỗi không xác định';
    type = 'error';
  }

  return { message, type, originalError: error };
};

// Retry Logic for Failed Requests
export const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying with exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError;
};

// API Helper Functions
export const createApiCall = (endpoint, method = 'GET', data = null, config = {}) => {
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  const requestConfig = {
    method,
    url,
    ...config,
  };

  if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
    requestConfig.data = transformRequest(data);
  }

  return apiClient(requestConfig).then(response => {
    return transformResponse(response.data);
  });
};

// Export default apiClient for direct use
export default apiClient;
