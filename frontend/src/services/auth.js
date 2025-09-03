import apiClient, { API_ENDPOINTS, handleApiError } from './api';
import { normalizeVietnameseName } from '../utils/text';

// Auth Service - Handles all authentication operations
const authService = {
  // Register new user
  async register(userData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Login user
  async login(credentials) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
      if (response.data.token) {
        localStorage.setItem('jwt_token', response.data.token);
        // Prefer user object from login response; fallback to JWT payload
        if (response.data.user) {
          const u = response.data.user;
          const user = {
            userId: u.cccd,
            cccd: u.cccd,
            org: u.org,
            role: u.role,
            name: normalizeVietnameseName(u.fullName),
            phone: u.phone || ''
          };
          localStorage.setItem('user', JSON.stringify(user));
        } else {
          try {
            const payload = JSON.parse(atob(response.data.token.split('.')[1]));
            const user = {
              userId: payload.cccd,
              cccd: payload.cccd,
              org: payload.org,
              role: payload.role || 'user',
              name: normalizeVietnameseName(payload.name || 'User'),
              phone: payload.phone || ''
            };
            localStorage.setItem('user', JSON.stringify(user));
          } catch (jwtError) {
            console.error('Failed to parse JWT payload:', jwtError);
          }
        }
        localStorage.setItem('refresh_token', response.data.refreshToken || '');
      }
      return response.data;
    } catch (error) {
      // Custom error handling for login - don't use global handleApiError
      // to avoid triggering session expiry logic
      if (error.response) {
        const errorData = error.response.data;
        const errorMessage = errorData?.error || errorData?.message || 'Đăng nhập thất bại';
        const loginError = new Error(errorMessage);
        loginError.response = error.response;
        throw loginError;
      } else if (error.request) {
        throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        throw new Error(error.message || 'Đã xảy ra lỗi không xác định');
      }
    }
  },

  // Verify OTP
  async verifyOTP(cccd, otp) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.VERIFY_OTP, { cccd, otp });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Verify OTP for forgot password
  async verifyOTPForForgotPassword(cccd, otp) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.VERIFY_OTP_FORGOT_PASSWORD, { cccd, otp });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Resend OTP
  async resendOTP(cccd) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.RESEND_OTP, { cccd });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Forgot password
  async forgotPassword(cccd, phone) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { cccd, phone });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Reset password
  async resetPassword(cccd, otp, newPassword) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, { 
        cccd, 
        otp, 
        newPassword 
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Change password
  async changePassword(passwordData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, passwordData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Logout
  async logout() {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  },

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('jwt_token');
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp && payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  },

  // Get current user
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      const parsed = JSON.parse(userStr);
      if (parsed && parsed.name) {
        parsed.name = normalizeVietnameseName(parsed.name);
      }
      // Backfill phone from JWT payload if missing
      if (!parsed?.phone) {
        try {
          const token = localStorage.getItem('jwt_token');
          if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload?.phone) {
              parsed.phone = payload.phone;
              // persist back to storage so subsequent reads include phone
              localStorage.setItem('user', JSON.stringify(parsed));
            }
          }
        } catch (_) { /* ignore */ }
      }
      return parsed;
    } catch (error) {
      return null;
    }
  },

  // Get auth token
  getAuthToken() {
    return localStorage.getItem('jwt_token');
  },

  // Check if user has admin role
  isAdmin() {
    const user = this.getCurrentUser();
    return user && (user.role === 'admin');
  },

  // Check if user belongs to specific organization
  belongsToOrg(org) {
    const user = this.getCurrentUser();
    return user && user.org === org;
  },

  // Check user permissions
  hasPermission(permission) {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    // Admin has all permissions
    if (this.isAdmin()) return true;
    
    // Organization-based permissions
    switch (permission) {
      case 'land_management':
        return user.org === 'Org1';
      case 'document_verification':
        return user.org === 'Org2';
      case 'land_ownership':
        return user.org === 'Org3';
      case 'view_all_lands':
        return ['Org1', 'Org2'].includes(user.org);
      case 'view_all_transactions':
        return ['Org1', 'Org2'].includes(user.org);
      case 'view_all_documents':
        return ['Org1', 'Org2'].includes(user.org);
      default:
        return false;
    }
  },

  // Update profile
  async updateProfile(profileData) {
    try {
      const response = await apiClient.put(API_ENDPOINTS.USER.UPDATE_PROFILE, profileData);
      
      if (response.data.user) {
        // Update local user data
        const currentUser = this.getCurrentUser();
        const updatedUser = {
          ...currentUser,
          ...response.data.user,
          ...response.data.phone,
          userId: response.data.user.cccd,
          cccd: response.data.user.cccd,
          name: normalizeVietnameseName(response.data.user.fullName),
          phone: response.data.phone
        };
        
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
      }
      
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Refresh token (if needed)
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post('/auth/refresh', { refreshToken });
      const { token } = response.data;
      
      localStorage.setItem('jwt_token', token);
      return token;
    } catch (error) {
      // Refresh failed - clear auth data
      this.logout();
      throw error;
    }
  }
};

export default authService;