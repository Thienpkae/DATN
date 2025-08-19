import apiClient, { API_ENDPOINTS, handleApiError } from './api';

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
        // Store token
        localStorage.setItem('jwt_token', response.data.token);
        
        // Get user info from backend
        try {
          // Wait a bit for token to be properly set
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const userResponse = await apiClient.get(API_ENDPOINTS.USER.PROFILE, {
            headers: { Authorization: `Bearer ${response.data.token}` }
          });
          
          console.log('User profile response:', userResponse.data);
          
          if (userResponse.data.user) {
            const user = {
              userId: userResponse.data.user.cccd,
              cccd: userResponse.data.user.cccd,
              org: userResponse.data.user.org,
              role: userResponse.data.user.role,
              name: userResponse.data.user.fullName,
              phone: userResponse.data.user.phone
            };
            
            console.log('Setting user in localStorage:', user);
            localStorage.setItem('user', JSON.stringify(user));
          } else {
            throw new Error('No user data in response');
          }
        } catch (userError) {
          console.warn('Could not fetch user details, using JWT payload:', userError);
          // Fallback to JWT payload if user fetch fails
          try {
            const payload = JSON.parse(atob(response.data.token.split('.')[1]));
            console.log('JWT payload:', payload);
            
            if (!payload.cccd || !payload.org) {
              throw new Error('JWT payload missing required fields');
            }
            
            const user = {
              userId: payload.cccd,
              cccd: payload.cccd,
              org: payload.org,
              role: payload.role || 'user',
              name: payload.name || 'User'
            };
            
            console.log('Setting user from JWT in localStorage:', user);
            localStorage.setItem('user', JSON.stringify(user));
          } catch (jwtError) {
            console.error('Failed to parse JWT payload:', jwtError);
            // Try to create minimal user data
            const user = {
              userId: 'unknown',
              cccd: 'unknown',
              org: 'Org3',
              role: 'user',
              name: 'User'
            };
            console.log('Setting minimal user in localStorage:', user);
            localStorage.setItem('user', JSON.stringify(user));
          }
        }
        
        localStorage.setItem('refresh_token', response.data.refreshToken || '');
      }
      
      return response.data;
    } catch (error) {
      throw handleApiError(error);
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
  async changePassword(oldPassword, newPassword, confirmPassword) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        oldPassword,
        newPassword,
        confirmPassword
      });
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
      return userStr ? JSON.parse(userStr) : null;
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
          userId: response.data.user.cccd,
          cccd: response.data.user.cccd,
          name: response.data.user.fullName
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