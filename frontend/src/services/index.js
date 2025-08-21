// Export all services
export { default as apiClient, API_ENDPOINTS, handleApiError, retryRequest, createApiCall } from './api';
export { default as authService } from './auth';
export { default as landService } from './landService';
export { default as documentService } from './documentService';
export { default as transactionService } from './transactionService';
export { default as dashboardService } from './dashboard';
export { default as notificationService } from './notification';

// Export service types for TypeScript-like usage
export const SERVICE_TYPES = {
  AUTH: 'auth',
  LAND: 'land',
  DOCUMENT: 'document',
  TRANSACTION: 'transaction',
  DASHBOARD: 'dashboard',
  NOTIFICATION: 'notification'
};

// Export permission constants
export const PERMISSIONS = {
  // Land management permissions
  LAND_CREATE: 'land_create',
  LAND_UPDATE: 'land_update',
  LAND_DELETE: 'land_delete',
  LAND_VIEW: 'land_view',
  LAND_VIEW_ALL: 'land_view_all',
  LAND_ISSUE_CERTIFICATE: 'land_issue_certificate',
  
  // Document management permissions
  DOCUMENT_CREATE: 'document_create',
  DOCUMENT_UPDATE: 'document_update',
  DOCUMENT_DELETE: 'document_delete',
  DOCUMENT_VIEW: 'document_view',
  DOCUMENT_VIEW_ALL: 'document_view_all',
  DOCUMENT_VERIFY: 'document_verify',
  DOCUMENT_REJECT: 'document_reject',
  DOCUMENT_LINK: 'document_link',
  
  // Transaction management permissions
  TRANSACTION_CREATE: 'transaction_create',
  TRANSACTION_UPDATE: 'transaction_update',
  TRANSACTION_DELETE: 'transaction_delete',
  TRANSACTION_VIEW: 'transaction_view',
  TRANSACTION_VIEW_ALL: 'transaction_view_all',
  TRANSACTION_PROCESS: 'transaction_process',
  TRANSACTION_APPROVE: 'transaction_approve',
  TRANSACTION_REJECT: 'transaction_reject',
  TRANSACTION_FORWARD: 'transaction_forward',
  
  // System management permissions
  SYSTEM_CONFIG_VIEW: 'system_config_view',
  SYSTEM_CONFIG_UPDATE: 'system_config_update',
  SYSTEM_CONFIG_DELETE: 'system_config_delete',
  SYSTEM_REPORT_VIEW: 'system_report_view',
  SYSTEM_REPORT_EXPORT: 'system_report_export',
  
  // User management permissions
  USER_VIEW: 'user_view',
  USER_VIEW_ALL: 'user_view_all',
  USER_CREATE: 'user_create',
  USER_UPDATE: 'user_update',
  USER_DELETE: 'user_delete',
  USER_LOCK_UNLOCK: 'user_lock_unlock',
  
  // Notification permissions
  NOTIFICATION_VIEW: 'notification_view',
  NOTIFICATION_SEND: 'notification_send',
  NOTIFICATION_PREFERENCES: 'notification_preferences'
};

// Export organization constants - EXACTLY match chaincode
export const ORGANIZATIONS = {
  ORG1: 'Org1', 
  ORG2: 'Org2', 
  ORG3: 'Org3'  
};

// Export role constants
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
};

// Export transaction types - EXACTLY match chaincode
export const TRANSACTION_TYPES = {
  TRANSFER: 'TRANSFER',
  SPLIT: 'SPLIT',
  MERGE: 'MERGE',
  CHANGE_PURPOSE: 'CHANGE_PURPOSE',
  REISSUE: 'REISSUE'
};

// Export transaction statuses - EXACTLY match chaincode
export const TRANSACTION_STATUSES = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  FORWARDED: 'FORWARDED',
  VERIFIED: 'VERIFIED',
  SUPPLEMENT_REQUESTED: 'SUPPLEMENT_REQUESTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

// Export document types - EXACTLY match chaincode
export const DOCUMENT_TYPES = {
  CERTIFICATE: 'CERTIFICATE',
  CONTRACT: 'CONTRACT',
  MAP: 'MAP',
  OTHER: 'OTHER'
};

// Export land use purposes - EXACTLY match chaincode
export const LAND_USE_PURPOSES = {
  BHK: 'Đất bằng trồng cây hàng năm khác',
  DTL: 'Đất thủy lợi',
  LUC: 'Đất chuyên trồng lúa nước',
  DGT: 'Đất giao thông',
  LNQ: 'Đất trồng cây lâu năm khác',
  ONT: 'Đất ở tại nông thôn',
  SKC: 'Đất khu công nghiệp'
};

// Export legal statuses - EXACTLY match chaincode
export const LEGAL_STATUSES = {
  HNK: 'Đất trồng cây hàng năm khác',
  LUA: 'Đất lúa nước còn lại',
  'ONT*': 'Đất ở tại nông thôn',
  CLN: 'Đất trồng cây lâu năm'
};

// Export notification types
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
};

// Export file types - EXACTLY match chaincode supported types
export const FILE_TYPES = {
  PDF: 'PDF',
  JPG: 'JPG',
  JPEG: 'JPEG',
  PNG: 'PNG',
  DOC: 'DOC',
  DOCX: 'DOCX',
  XLS: 'XLS',
  XLSX: 'XLSX'
};

// Export priority levels
export const PRIORITY_LEVELS = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high'
};

// Export report formats
export const REPORT_FORMATS = {
  JSON: 'json',
  CSV: 'csv',
  EXCEL: 'excel',
  PDF: 'pdf'
};

// Export chart types
export const CHART_TYPES = {
  PIE: 'pie',
  BAR: 'bar',
  LINE: 'line',
  AREA: 'area',
  COLUMN: 'column'
};

// Export time periods
export const TIME_PERIODS = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  QUARTER: 'quarter',
  YEAR: 'year'
};

// Export sort orders
export const SORT_ORDERS = {
  ASC: 'asc',
  DESC: 'desc'
};

// Export filter operators
export const FILTER_OPERATORS = {
  EQUALS: 'equals',
  NOT_EQUALS: 'not_equals',
  CONTAINS: 'contains',
  NOT_CONTAINS: 'not_contains',
  GREATER_THAN: 'greater_than',
  LESS_THAN: 'less_than',
  GREATER_THAN_EQUALS: 'greater_than_equals',
  LESS_THAN_EQUALS: 'less_than_equals',
  IN: 'in',
  NOT_IN: 'not_in',
  BETWEEN: 'between',
  IS_NULL: 'is_null',
  IS_NOT_NULL: 'is_not_null'
};

// Export validation rules
export const VALIDATION_RULES = {
  REQUIRED: 'required',
  EMAIL: 'email',
  PHONE: 'phone',
  CCCD: 'cccd',
  MIN_LENGTH: 'min_length',
  MAX_LENGTH: 'max_length',
  MIN_VALUE: 'min_value',
  MAX_VALUE: 'max_value',
  PATTERN: 'pattern',
  CUSTOM: 'custom'
};

// Export error types
export const ERROR_TYPES = {
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  NOT_FOUND: 'not_found',
  CONFLICT: 'conflict',
  SERVER_ERROR: 'server_error',
  NETWORK_ERROR: 'network_error',
  BLOCKCHAIN_ERROR: 'blockchain_error'
};

// Export success types
export const SUCCESS_TYPES = {
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
  PROCESSED: 'processed',
  APPROVED: 'approved',
  VERIFIED: 'verified',
  SENT: 'sent'
};

// Export required documents for each transaction type - EXACTLY match chaincode
export const REQUIRED_DOCUMENTS = {
  TRANSFER: ['Hợp đồng chuyển nhượng', 'Giấy chứng nhận QSDĐ', 'Giấy tờ tùy thân'],
  SPLIT: ['Đơn xin tách thửa', 'Giấy chứng nhận QSDĐ', 'Sơ đồ thửa đất'],
  MERGE: ['Đơn xin hợp thửa', 'Giấy chứng nhận QSDĐ', 'Sơ đồ thửa đất'],
  CHANGE_PURPOSE: ['Đơn xin thay đổi mục đích sử dụng đất', 'Giấy chứng nhận QSDĐ'],
  REISSUE: ['Đơn xin cấp lại GCN', 'Giấy tờ tùy thân']
};

// Export IPFS validation rules - EXACTLY match chaincode
export const IPFS_VALIDATION = {
  MIN_LENGTH: 46,  // CIDv0
  MAX_LENGTH: 59,  // CIDv1
  VALID_PREFIXES: ['Qm', 'bafy'],
  VALID_PATTERNS: {
    CIDV0: /^Qm[1-9A-Za-z]{44}$/,
    CIDV1: /^bafy[0-9A-Za-z]+/
  }
};

// Export organization permissions - EXACTLY match chaincode access control
export const ORGANIZATION_PERMISSIONS = {
  ORG1: {
    name: 'Cơ quan đăng ký đất đai',
    permissions: [
      'land_create', 'land_update', 'land_delete', 'land_view_all',
      'transaction_approve', 'transaction_reject',
      'document_view_all', 'system_config_view', 'system_config_update'
    ],
    canProcess: ['FORWARDED'], // Can approve/reject transactions
    canView: ['all'] // Can view all data
  },
  ORG2: {
    name: 'Đơn vị hành chính cấp xã',
    permissions: [
      'land_view_all', 'transaction_process', 'transaction_forward',
      'document_verify', 'document_reject', 'document_view_all'
    ],
    canProcess: ['VERIFIED'], // Can process verified transactions
    canView: ['all'] // Can view all data
  },
  ORG3: {
    name: 'Công dân/Chủ sở hữu đất',
    permissions: [
      'land_view', 'transaction_create', 'transaction_confirm',
      'document_create', 'document_view'
    ],
    canProcess: ['PENDING'], // Can confirm pending transactions
    canView: ['own'] // Can only view own data
  }
};
