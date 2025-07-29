import { authAPI } from './api';

// Auth token management
export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

export const setAuthToken = (token) => {
  localStorage.setItem('authToken', token);
};

export const removeAuthToken = () => {
  localStorage.removeItem('authToken');
};

// Auth API calls
export const login = async ({ phone, cccd, password }) => {
  const response = await authAPI.login({ phone, cccd, password });
  if (response.data.token) {
    setAuthToken(response.data.token);
    const payload = JSON.parse(atob(response.data.token.split('.')[1]));
    return {
      userId: payload.userId,
      org: payload.org,
      token: response.data.token
    };
  }
  throw new Error('No token received');
};

export const register = async (userData) => {
  const response = await authAPI.register(userData);
  return response.data;
};

export const registerCitizen = async (userData) => {
  const citizenData = {
    ...userData,
    org: 'Org3',
    role: 'user'
  };
  const response = await authAPI.registerCitizen(citizenData);
  return response.data;
};

export const verifyOTP = async (data) => {
  const response = await authAPI.verifyOTP(data);
  return response.data;
};

export const resendOTP = async (userId) => {
  const response = await authAPI.resendOTP({ userId });
  return response.data;
};

export const logout = async () => {
  try {
    await authAPI.logout();
  } finally {
    removeAuthToken();
  }
};

export const changePassword = async (data) => {
  const response = await authAPI.changePassword(data);
  return response.data;
};

export const forgotPassword = async (data) => {
  const response = await authAPI.forgotPassword(data);
  return response.data;
};

export const resetPassword = async (data) => {
  const response = await authAPI.resetPassword(data);
  return response.data;
};

export default authAPI;
