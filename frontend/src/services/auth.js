import apiService from './api';

// Auth token management
export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

export const setAuthToken = (token) => {
  localStorage.setItem('authToken', token);
};

export const removeAuthToken = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};

// Get current user from localStorage
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = getAuthToken();
  const user = getCurrentUser();
  return !!(token && user);
};

// Auth API calls
export const login = async ({ cccd, phone, password }) => {
  try {
    // Send both cccd and phone, let backend decide which to use
    const loginData = { password };
    if (cccd) loginData.cccd = cccd;
    if (phone) loginData.phone = phone;

    const response = await apiService.login(loginData);

    if (response && response.token) {
      setAuthToken(response.token);

      try {
        const payload = JSON.parse(atob(response.token.split('.')[1]));
        // Backend uses 'cccd' as the user identifier, map it to userId for frontend consistency
        const userData = {
          userId: payload.cccd || payload.userId || payload.sub || payload.id,
          username: payload.cccd || payload.username,
          org: payload.org || payload.organization,
          role: payload.role || 'user',
          token: response.token
        };

        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(userData));

        return userData;
      } catch (parseError) {
        console.error('Token parsing error:', parseError);
        // If token parsing fails, use response data directly
        const userData = {
          userId: response.cccd || response.userId || response.user?.id,
          username: response.cccd || response.username,
          org: response.org || response.organization,
          role: response.role || 'user',
          token: response.token
        };

        localStorage.setItem('user', JSON.stringify(userData));
        return userData;
      }
    }
    throw new Error('No token received from server');
  } catch (error) {
    console.error('Login error:', error);
    removeAuthToken(); // Clear any existing token on login failure
    throw error;
  }
};

export const register = async (userData) => {
  try {
    const response = await apiService.register(userData);
    return response;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const registerCitizen = async (userData) => {
  try {
    const citizenData = {
      ...userData,
      org: 'Org3',
      role: 'user'
    };
    const response = await apiService.register(citizenData);
    return response;
  } catch (error) {
    console.error('Citizen registration error:', error);
    throw error;
  }
};

export const verifyOTP = async (cccd, otp) => {
  try {
    const response = await apiService.verifyOTP(cccd, otp);
    return response;
  } catch (error) {
    console.error('OTP verification error:', error);
    throw error;
  }
};

export const resendOTP = async (cccd) => {
  try {
    const response = await apiService.resendOTP(cccd);
    return response;
  } catch (error) {
    console.error('Resend OTP error:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await apiService.logout();
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    removeAuthToken();
  }
};

export const changePassword = async (data) => {
  try {
    const response = await apiService.changePassword(data);
    return response;
  } catch (error) {
    console.error('Change password error:', error);
    throw error;
  }
};

export const forgotPassword = async (data) => {
  try {
    const response = await apiService.forgotPassword(data);
    return response;
  } catch (error) {
    console.error('Forgot password error:', error);
    throw error;
  }
};

export const resetPassword = async (data) => {
  try {
    const response = await apiService.resetPassword(data);
    return response;
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
};

const authService = {
  login,
  register,
  registerCitizen,
  verifyOTP,
  resendOTP,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  getCurrentUser,
  isAuthenticated
};

export default authService;