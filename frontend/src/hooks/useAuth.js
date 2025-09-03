import { useState, useEffect, useCallback, useRef } from 'react';
import authService from '../services/auth';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const refreshIntervalRef = useRef(null);
  const intervalIdRef = useRef(null);

  // Initialize authentication state
  useEffect(() => {
    const initAuth = async () => {
      try {
        setIsLoading(true);
        
        // Check if user is authenticated by JWT token
        console.log('Checking authentication...');
        if (authService.isAuthenticated()) {
          console.log('JWT is valid, getting user...');
          const currentUser = authService.getCurrentUser();
          console.log('Current user from localStorage:', currentUser);
          
          if (currentUser) {
            setUser(currentUser);
            setIsAuthenticated(true);
            console.log('User authenticated on init:', currentUser);
          } else {
            console.warn('JWT valid but no user in localStorage');
          }
        } else {
          console.log('JWT is not valid or expired');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Cleanup on unmount
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const currentIntervalId = intervalIdRef.current;
      if (currentIntervalId) {
        clearInterval(currentIntervalId);
      }
    };
  }, []);

  // Login function
  const login = useCallback(async (credentials) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await authService.login(credentials);
      
      // Get user from localStorage (set by authService.login)
      const user = authService.getCurrentUser();
      console.log('User from localStorage after login:', user);
      
      if (user) {
        setUser(user);
        setIsAuthenticated(true);
        console.log('User set in state:', user);
      } else {
        throw new Error('Không thể lấy thông tin người dùng');
      }
      
      return user;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      // Clear session data
      
      const currentInterval = refreshIntervalRef.current;
      if (currentInterval) {
        clearInterval(currentInterval);
      }
    }
  }, []);

  // Update user profile
  const updateProfile = useCallback(async (profileData) => {
    try {
      setError(null);
      const updatedUser = await authService.updateProfile(profileData);
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, []);

  // Change password
  const changePassword = useCallback(async (passwordData) => {
    try {
      setError(null);
      await authService.changePassword(passwordData);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }, []);

  // Refresh token
  const refreshToken = useCallback(async () => {
    try {
      const newUser = await authService.refreshToken();
      setUser(newUser);
      return newUser;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, logout user
      await logout();
      throw error;
    }
  }, [logout]);

  // Permission checking functions
  const hasRole = useCallback((role) => {
    return user?.role === role;
  }, [user]);

  const hasPermission = useCallback((permission) => {
    if (!user) return false;
    return hasPermission(user.role, user.org, permission);
  }, [user]);

  const hasAnyPermission = useCallback((permissions) => {
    if (!user) return false;
    return hasAnyPermission(user.role, user.org, permissions);
  }, [user]);

  const hasAllPermissions = useCallback((permissions) => {
    if (!user) return false;
    return hasAllPermissions(user.role, user.org, permissions);
  }, [user]);

  const checkAccess = useCallback((requiredPermissions, requireAll = false) => {
    if (!user) return false;
    return checkAccess(requiredPermissions, user.role, user.org, requireAll);
  }, [user]);

  // Organization-specific functions
  const belongsToOrg = useCallback((targetOrg) => {
    if (!user) return false;
    return user.org === targetOrg;
  }, [user]);

  const getUserOrg = useCallback(() => {
    return user?.org;
  }, [user]);

  const getUserRole = useCallback(() => {
    return user?.role;
  }, [user]);

  const isAdmin = useCallback(() => {
    if (!user) return false;
    return user.role === 'admin';
  }, [user]);

  const isOrg1User = useCallback(() => {
    return user?.org === 'Org1';
  }, [user]);

  const isOrg2User = useCallback(() => {
    return user?.org === 'Org2';
  }, [user]);

  const isOrg3User = useCallback(() => {
    return user?.org === 'Org3';
  }, [user]);

  // Specific access checking functions
  const canAccessLand = useCallback((action) => {
    if (!user) return false;
    // Basic land access logic
    return ['Org1', 'Org2'].includes(user.org) || (user.org === 'Org3' && action === 'read');
  }, [user]);

  const canAccessDocument = useCallback((action) => {
    if (!user) return false;
    // Basic document access logic
    return ['Org1', 'Org2'].includes(user.org) || (user.org === 'Org3' && action === 'read');
  }, [user]);

  const canAccessTransaction = useCallback((action) => {
    if (!user) return false;
    // Basic transaction access logic
    return ['Org1', 'Org2'].includes(user.org) || (user.org === 'Org3' && action === 'read');
  }, [user]);

  const canAccessUser = useCallback((action) => {
    if (!user) return false;
    // Basic user access logic
    return user.role === 'admin' || action === 'profile';
  }, [user]);

  // Organization access checking
  const canAccessOrg = useCallback((targetOrg) => {
    if (!user) return false;
    return user.org === targetOrg;
  }, [user]);

  const canAccessMultiOrg = useCallback((targetOrgs) => {
    if (!user) return false;
    return targetOrgs.includes(user.org);
  }, [user]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    
    // Actions
    login,
    logout,
    updateProfile,
    changePassword,
    refreshToken,
    
    // Permission checking
    hasRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    checkAccess,
    
    // Organization checking
    belongsToOrg,
    getUserOrg,
    getUserRole,
    isAdmin,
    isOrg1User,
    isOrg2User,
    isOrg3User,
    
    // Specific access checking
    canAccessLand,
    canAccessDocument,
    canAccessTransaction,
    canAccessUser,
    
    // Organization access
    canAccessOrg,
    canAccessMultiOrg,
    
    // Utility
    clearError,
  };
};

export default useAuth;
