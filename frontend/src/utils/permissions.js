// Permission Constants
export const PERMISSIONS = {
  // Land Management
  LAND_CREATE: 'land:create',
  LAND_READ: 'land:read',
  LAND_UPDATE: 'land:update',
  LAND_DELETE: 'land:delete',
  LAND_SEARCH: 'land:search',
  LAND_APPROVE: 'land:approve',
  LAND_ISSUE_CERTIFICATE: 'land:issue_certificate',
  LAND_HISTORY: 'land:history',
  
  // Document Management
  DOCUMENT_UPLOAD: 'document:upload',
  DOCUMENT_READ: 'document:read',
  DOCUMENT_UPDATE: 'document:update',
  DOCUMENT_DELETE: 'document:delete',
  DOCUMENT_VERIFY: 'document:verify',
  DOCUMENT_REJECT: 'document:reject',
  DOCUMENT_ANALYZE: 'document:analyze',
  DOCUMENT_LINK: 'document:link',
  DOCUMENT_SEARCH: 'document:search',
  DOCUMENT_HISTORY: 'document:history',
  
  // Transaction Management
  TRANSACTION_CREATE: 'transaction:create',
  TRANSACTION_READ: 'transaction:read',
  TRANSACTION_UPDATE: 'transaction:update',
  TRANSACTION_DELETE: 'transaction:delete',
  TRANSACTION_APPROVE: 'transaction:approve',
  TRANSACTION_REJECT: 'transaction:reject',
  TRANSACTION_PROCESS: 'transaction:process',
  TRANSACTION_FORWARD: 'transaction:forward',
  TRANSACTION_SEARCH: 'transaction:search',
  TRANSACTION_HISTORY: 'transaction:history',
  
  // User Management (Admin only - within their org)
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_LOCK_UNLOCK: 'user:lock_unlock',
  USER_PROFILE: 'user:profile',
  
  // System Management (Admin only - within their org)
  SYSTEM_CONFIG_READ: 'system:config:read',
  SYSTEM_CONFIG_UPDATE: 'system:config:update',
  SYSTEM_CONFIG_DELETE: 'system:config:delete',
  SYSTEM_CONFIG_RESET: 'system:config:reset',
  SYSTEM_CONFIG_INIT: 'system:config:init',
  SYSTEM_LOGS_READ: 'system:logs:read',
  
  // Reports
  REPORTS_GENERATE: 'reports:generate',
  REPORTS_EXPORT: 'reports:export',
  
  // Dashboard
  DASHBOARD_READ: 'dashboard:read',
  
  // Notifications
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_SEND: 'notification:send',
};

// Role-based Permission Mapping - Dựa trên backend thực tế
export const ROLE_PERMISSIONS = {
  // Org1 - Land Registry Authority
  'Org1_admin': [
    // User Management - Chỉ trong Org1 (requireAdmin)
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_LOCK_UNLOCK,
    
    // System Management - Chỉ trong Org1 (requireAdmin)
    PERMISSIONS.SYSTEM_CONFIG_READ,
    PERMISSIONS.SYSTEM_CONFIG_UPDATE,
    PERMISSIONS.SYSTEM_CONFIG_DELETE,
    PERMISSIONS.SYSTEM_CONFIG_RESET,
    PERMISSIONS.SYSTEM_CONFIG_INIT,
    PERMISSIONS.SYSTEM_LOGS_READ,
    
    // Business Functions - Theo checkOrg(['Org1'])
    PERMISSIONS.LAND_CREATE,
    PERMISSIONS.LAND_UPDATE,
    PERMISSIONS.LAND_ISSUE_CERTIFICATE,
    
    // Business Functions - Theo checkOrg(['Org1', 'Org2'])
    PERMISSIONS.LAND_READ,
    PERMISSIONS.LAND_SEARCH,
    PERMISSIONS.LAND_HISTORY,
    PERMISSIONS.DOCUMENT_READ,
    PERMISSIONS.DOCUMENT_ANALYZE,
    PERMISSIONS.TRANSACTION_READ,
    PERMISSIONS.TRANSACTION_HISTORY,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.DASHBOARD_READ,
    
    // Business Functions - Theo checkOrg(['Org1']) - Transaction Approval
    PERMISSIONS.TRANSACTION_APPROVE,
    PERMISSIONS.TRANSACTION_REJECT,
    
    // Routes không có middleware
    PERMISSIONS.USER_PROFILE,
    PERMISSIONS.DOCUMENT_UPLOAD,
    PERMISSIONS.DOCUMENT_UPDATE,
    PERMISSIONS.DOCUMENT_DELETE,
    PERMISSIONS.DOCUMENT_LINK,
    PERMISSIONS.DOCUMENT_SEARCH,
    PERMISSIONS.DOCUMENT_HISTORY,
    PERMISSIONS.TRANSACTION_SEARCH,
    PERMISSIONS.NOTIFICATION_READ,
  ],
  
  'Org1_user': [
    // Business Functions - Theo checkOrg(['Org1'])
    PERMISSIONS.LAND_CREATE,
    PERMISSIONS.LAND_UPDATE,
    PERMISSIONS.LAND_ISSUE_CERTIFICATE,
    
    // Business Functions - Theo checkOrg(['Org1', 'Org2'])
    PERMISSIONS.LAND_READ,
    PERMISSIONS.LAND_SEARCH,
    PERMISSIONS.LAND_HISTORY,
    PERMISSIONS.DOCUMENT_READ,
    PERMISSIONS.DOCUMENT_ANALYZE,
    PERMISSIONS.TRANSACTION_READ,
    PERMISSIONS.TRANSACTION_HISTORY,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.DASHBOARD_READ,
    
    // Business Functions - Theo checkOrg(['Org1']) - Transaction Approval
    PERMISSIONS.TRANSACTION_APPROVE,
    PERMISSIONS.TRANSACTION_REJECT,
    
    // Routes không có middleware
    PERMISSIONS.USER_PROFILE,
    PERMISSIONS.DOCUMENT_UPLOAD,
    PERMISSIONS.DOCUMENT_UPDATE,
    PERMISSIONS.DOCUMENT_DELETE,
    PERMISSIONS.DOCUMENT_LINK,
    PERMISSIONS.DOCUMENT_SEARCH,
    PERMISSIONS.DOCUMENT_HISTORY,
    PERMISSIONS.TRANSACTION_SEARCH,
    PERMISSIONS.NOTIFICATION_READ,
  ],
  
  // Org2 - Verification Authority
  'Org2_admin': [
    // User Management - Chỉ trong Org2 (requireAdmin)
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_LOCK_UNLOCK,
    
    // System Management - Chỉ trong Org2 (requireAdmin)
    PERMISSIONS.SYSTEM_CONFIG_READ,
    PERMISSIONS.SYSTEM_CONFIG_UPDATE,
    PERMISSIONS.SYSTEM_CONFIG_DELETE,
    PERMISSIONS.SYSTEM_CONFIG_RESET,
    PERMISSIONS.SYSTEM_CONFIG_INIT,
    PERMISSIONS.SYSTEM_LOGS_READ,
    
    // Business Functions - Theo checkOrg(['Org1', 'Org2'])
    PERMISSIONS.LAND_READ,
    PERMISSIONS.LAND_SEARCH,
    PERMISSIONS.LAND_HISTORY,
    PERMISSIONS.DOCUMENT_READ,
    PERMISSIONS.DOCUMENT_ANALYZE,
    PERMISSIONS.TRANSACTION_READ,
    PERMISSIONS.TRANSACTION_HISTORY,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.DASHBOARD_READ,
    
    // Business Functions - Theo checkOrg(['Org2'])
    PERMISSIONS.DOCUMENT_VERIFY,
    PERMISSIONS.DOCUMENT_REJECT,
    PERMISSIONS.TRANSACTION_PROCESS,
    PERMISSIONS.TRANSACTION_FORWARD,
    
    // Routes không có middleware
    PERMISSIONS.USER_PROFILE,
    PERMISSIONS.DOCUMENT_UPLOAD,
    PERMISSIONS.DOCUMENT_UPDATE,
    PERMISSIONS.DOCUMENT_DELETE,
    PERMISSIONS.DOCUMENT_LINK,
    PERMISSIONS.DOCUMENT_SEARCH,
    PERMISSIONS.DOCUMENT_HISTORY,
    PERMISSIONS.TRANSACTION_SEARCH,
    PERMISSIONS.NOTIFICATION_READ,
  ],
  
  'Org2_user': [
    // Business Functions - Theo checkOrg(['Org1', 'Org2'])
    PERMISSIONS.LAND_READ,
    PERMISSIONS.LAND_SEARCH,
    PERMISSIONS.LAND_HISTORY,
    PERMISSIONS.DOCUMENT_READ,
    PERMISSIONS.DOCUMENT_ANALYZE,
    PERMISSIONS.TRANSACTION_READ,
    PERMISSIONS.TRANSACTION_HISTORY,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.DASHBOARD_READ,
    
    // Business Functions - Theo checkOrg(['Org2'])
    PERMISSIONS.DOCUMENT_VERIFY,
    PERMISSIONS.DOCUMENT_REJECT,
    PERMISSIONS.TRANSACTION_PROCESS,
    PERMISSIONS.TRANSACTION_FORWARD,
    
    // Routes không có middleware
    PERMISSIONS.USER_PROFILE,
    PERMISSIONS.DOCUMENT_UPLOAD,
    PERMISSIONS.DOCUMENT_UPDATE,
    PERMISSIONS.DOCUMENT_DELETE,
    PERMISSIONS.DOCUMENT_LINK,
    PERMISSIONS.DOCUMENT_SEARCH,
    PERMISSIONS.DOCUMENT_HISTORY,
    PERMISSIONS.TRANSACTION_SEARCH,
    PERMISSIONS.NOTIFICATION_READ,
  ],
  
  // Org3 - Citizens/Users
  'Org3_admin': [
    // User Management - Chỉ trong Org3 (requireAdmin)
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_LOCK_UNLOCK,
    
    // Business Functions - Theo checkOrg(['Org3'])
    PERMISSIONS.TRANSACTION_CREATE,
    
    // Routes không có middleware
    PERMISSIONS.USER_PROFILE,
    PERMISSIONS.LAND_READ,
    PERMISSIONS.LAND_SEARCH,
    PERMISSIONS.LAND_HISTORY,
    PERMISSIONS.DOCUMENT_UPLOAD,
    PERMISSIONS.DOCUMENT_READ,
    PERMISSIONS.DOCUMENT_UPDATE,
    PERMISSIONS.DOCUMENT_DELETE,
    PERMISSIONS.DOCUMENT_LINK,
    PERMISSIONS.DOCUMENT_SEARCH,
    PERMISSIONS.DOCUMENT_HISTORY,
    PERMISSIONS.TRANSACTION_READ,
    PERMISSIONS.TRANSACTION_HISTORY,
    PERMISSIONS.TRANSACTION_SEARCH,
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.NOTIFICATION_READ,
  ],
  
  'Org3_user': [
    // Business Functions - Theo checkOrg(['Org3'])
    PERMISSIONS.TRANSACTION_CREATE,
    
    // Routes không có middleware
    PERMISSIONS.USER_PROFILE,
    PERMISSIONS.LAND_READ,
    PERMISSIONS.LAND_SEARCH,
    PERMISSIONS.LAND_HISTORY,
    PERMISSIONS.DOCUMENT_UPLOAD,
    PERMISSIONS.DOCUMENT_READ,
    PERMISSIONS.DOCUMENT_UPDATE,
    PERMISSIONS.DOCUMENT_DELETE,
    PERMISSIONS.DOCUMENT_LINK,
    PERMISSIONS.DOCUMENT_SEARCH,
    PERMISSIONS.DOCUMENT_HISTORY,
    PERMISSIONS.TRANSACTION_READ,
    PERMISSIONS.TRANSACTION_HISTORY,
    PERMISSIONS.TRANSACTION_SEARCH,
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.NOTIFICATION_READ,
  ],
};

// Permission checking functions
export const hasPermission = (userRole, userOrg, permission) => {
  if (!userRole || !userOrg || !permission) return false;
  
  const roleKey = `${userOrg}_${userRole}`;
  const rolePermissions = ROLE_PERMISSIONS[roleKey] || [];
  
  return rolePermissions.includes(permission);
};

export const hasAnyPermission = (userRole, userOrg, permissions) => {
  if (!userRole || !userOrg || !permissions || !Array.isArray(permissions)) return false;
  
  return permissions.some(permission => hasPermission(userRole, userOrg, permission));
};

export const hasAllPermissions = (userRole, userOrg, permissions) => {
  if (!userRole || !userOrg || !permissions || !Array.isArray(permissions)) return false;
  
  return permissions.every(permission => hasPermission(userRole, userOrg, permission));
};

// Access control functions
export const checkAccess = (requiredPermissions, userRole, userOrg, requireAll = false) => {
  if (!userRole || !userOrg || !requiredPermissions) return false;
  
  if (requireAll) {
    return hasAllPermissions(userRole, userOrg, requiredPermissions);
  }
  
  return hasAnyPermission(userRole, userOrg, requiredPermissions);
};

// Organization-specific access control
export const checkOrgAccess = (userOrg, requiredOrg) => {
  if (!userOrg || !requiredOrg) return false;
  
  // Users can only access their own organization
  return userOrg === requiredOrg;
};

export const checkMultiOrgAccess = (userOrg, requiredOrgs) => {
  if (!userOrg || !requiredOrgs || !Array.isArray(requiredOrgs)) return false;
  
  // Users can access if they belong to any of the required organizations
  return requiredOrgs.includes(userOrg);
};

// Check if user is admin of their organization
export const isOrgAdmin = (userRole, userOrg) => {
  return userRole === 'admin' && userOrg && ['Org1', 'Org2', 'Org3'].includes(userOrg);
};

// Check if user belongs to specific organization
export const belongsToOrg = (userOrg, targetOrg) => {
  return userOrg === targetOrg;
};

// Check specific permissions for each organization
export const checkLandAccess = (action, userRole, userOrg) => {
  const landPermissions = {
    create: [PERMISSIONS.LAND_CREATE],
    read: [PERMISSIONS.LAND_READ],
    update: [PERMISSIONS.LAND_UPDATE],
    delete: [PERMISSIONS.LAND_DELETE],
    search: [PERMISSIONS.LAND_SEARCH],
    approve: [PERMISSIONS.LAND_APPROVE],
    issue_certificate: [PERMISSIONS.LAND_ISSUE_CERTIFICATE],
    history: [PERMISSIONS.LAND_HISTORY],
  };
  
  return checkAccess(landPermissions[action] || [], userRole, userOrg);
};

export const checkDocumentAccess = (action, userRole, userOrg) => {
  const documentPermissions = {
    upload: [PERMISSIONS.DOCUMENT_UPLOAD],
    read: [PERMISSIONS.DOCUMENT_READ],
    update: [PERMISSIONS.DOCUMENT_UPDATE],
    delete: [PERMISSIONS.DOCUMENT_DELETE],
    verify: [PERMISSIONS.DOCUMENT_VERIFY],
    reject: [PERMISSIONS.DOCUMENT_REJECT],
    analyze: [PERMISSIONS.DOCUMENT_ANALYZE],
    link: [PERMISSIONS.DOCUMENT_LINK],
    search: [PERMISSIONS.DOCUMENT_SEARCH],
    history: [PERMISSIONS.DOCUMENT_HISTORY],
  };
  
  return checkAccess(documentPermissions[action] || [], userRole, userOrg);
};

export const checkTransactionAccess = (action, userRole, userOrg) => {
  const transactionPermissions = {
    create: [PERMISSIONS.TRANSACTION_CREATE],
    read: [PERMISSIONS.TRANSACTION_READ],
    update: [PERMISSIONS.TRANSACTION_UPDATE],
    delete: [PERMISSIONS.TRANSACTION_DELETE],
    approve: [PERMISSIONS.TRANSACTION_APPROVE],
    reject: [PERMISSIONS.TRANSACTION_REJECT],
    process: [PERMISSIONS.TRANSACTION_PROCESS],
    forward: [PERMISSIONS.TRANSACTION_FORWARD],
    search: [PERMISSIONS.TRANSACTION_SEARCH],
    history: [PERMISSIONS.TRANSACTION_HISTORY],
  };
  
  return checkAccess(transactionPermissions[action] || [], userRole, userOrg);
};

export const checkUserAccess = (action, userRole, userOrg) => {
  const userPermissions = {
    create: [PERMISSIONS.USER_CREATE],
    read: [PERMISSIONS.USER_READ],
    update: [PERMISSIONS.USER_UPDATE],
    delete: [PERMISSIONS.USER_DELETE],
    lock_unlock: [PERMISSIONS.USER_LOCK_UNLOCK],
    profile: [PERMISSIONS.USER_PROFILE],
  };
  
  return checkAccess(userPermissions[action] || [], userRole, userOrg);
};

// Advanced permission checking
export const checkConditionalAccess = (userRole, userOrg, permission, condition) => {
  // Check basic permission first
  if (!hasPermission(userRole, userOrg, permission)) return false;
  
  // Apply additional conditions
  if (condition && typeof condition === 'function') {
    return condition(userRole, userOrg);
  }
  
  return true;
};

// Permission-based component rendering
export const withPermission = (Component, requiredPermission, fallback = null) => {
  return (props) => {
    const { user } = props;
    
    if (!user || !hasPermission(user.role, user.org, requiredPermission)) {
      return fallback;
    }
    
    return <Component {...props} />;
  };
};

export const withPermissions = (Component, requiredPermissions, requireAll = false, fallback = null) => {
  return (props) => {
    const { user } = props;
    
    if (!user || !checkAccess(requiredPermissions, user.role, user.org, requireAll)) {
      return fallback;
    }
    
    return <Component {...props} />;
  };
};

// Export all permission utilities
const permissions = {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  checkAccess,
  checkLandAccess,
  checkDocumentAccess,
  checkTransactionAccess,
  checkUserAccess,
  checkOrgAccess,
  checkMultiOrgAccess,
  checkConditionalAccess,
  isOrgAdmin,
  belongsToOrg,
  withPermission,
  withPermissions,
};

export default permissions;
