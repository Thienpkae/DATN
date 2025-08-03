// Enhanced Common Components Index
// This file provides easy imports for all enhanced components

// Core Components
export { default as LoadingSpinner } from './LoadingSpinner';
export { default as ErrorBoundary } from './ErrorBoundary';
export { default as NotificationSystem } from './NotificationSystem';
export { default as DashboardOverview } from './DashboardOverview';

// Advanced Components
export { default as EnhancedTable, StatusTag, TableActions } from './EnhancedTable';
export { 
  default as EnhancedForm, 
  FormFieldTypes, 
  ValidationRules 
} from './EnhancedForm';
export { 
  default as EnhancedModal,
  ConfirmModal,
  InfoModal,
  SuccessModal,
  ErrorModal,
  WarningModal,
  LoadingModal,
  ModalUtils
} from './EnhancedModal';
export { 
  default as SearchFilter, 
  FilterTypes, 
  QuickFilters 
} from './SearchFilter';
export { 
  default as StatsDashboard, 
  createStat 
} from './StatsDashboard';

// Animation Components (if framer-motion is available)
export { 
  default as PageTransition,
  SlideTransition,
  FadeTransition,
  ScaleTransition,
  StaggerContainer,
  StaggerItem
} from './PageTransition';

// Re-export commonly used utilities
export const Components = {
  // Core
  LoadingSpinner: require('./LoadingSpinner').default,
  ErrorBoundary: require('./ErrorBoundary').default,
  NotificationSystem: require('./NotificationSystem').default,
  DashboardOverview: require('./DashboardOverview').default,
  
  // Advanced
  EnhancedTable: require('./EnhancedTable').default,
  EnhancedForm: require('./EnhancedForm').default,
  EnhancedModal: require('./EnhancedModal').default,
  SearchFilter: require('./SearchFilter').default,
  StatsDashboard: require('./StatsDashboard').default,
  
  // Animations
  PageTransition: require('./PageTransition').default
};

// Utility functions
export const Utils = {
  // Notification helpers
  notify: {
    success: (message, description) => 
      require('./NotificationSystem').default.success(message, description),
    error: (message, description) => 
      require('./NotificationSystem').default.error(message, description),
    warning: (message, description) => 
      require('./NotificationSystem').default.warning(message, description),
    info: (message, description) => 
      require('./NotificationSystem').default.info(message, description),
  },
  
  // Modal helpers
  modal: require('./EnhancedModal').ModalUtils,
  
  // Form field helpers
  field: require('./EnhancedForm').FormFieldTypes,
  
  // Validation helpers
  validate: require('./EnhancedForm').ValidationRules,
  
  // Filter helpers
  filter: require('./SearchFilter').FilterTypes,
  
  // Quick filter helpers
  quickFilter: require('./SearchFilter').QuickFilters,
  
  // Table action helpers
  tableAction: require('./EnhancedTable').TableActions,
  
  // Stats helpers
  stat: require('./StatsDashboard').createStat
};

// Component configuration presets
export const Presets = {
  // Table presets
  tables: {
    landParcels: {
      searchable: true,
      filterable: true,
      exportable: true,
      selectable: true,
      pagination: { pageSize: 20 }
    },
    transactions: {
      searchable: true,
      filterable: true,
      exportable: true,
      refreshable: true,
      pagination: { pageSize: 15 }
    },
    certificates: {
      searchable: true,
      exportable: true,
      pagination: { pageSize: 10 }
    }
  },
  
  // Form presets
  forms: {
    landParcel: {
      layout: 'vertical',
      size: 'large',
      showSteps: true
    },
    user: {
      layout: 'vertical',
      size: 'large'
    },
    transaction: {
      layout: 'vertical',
      size: 'large',
      showSteps: true
    }
  },
  
  // Modal presets
  modals: {
    confirm: {
      width: 420,
      centered: true,
      maskClosable: false
    },
    form: {
      width: 720,
      centered: true,
      destroyOnClose: true
    },
    details: {
      width: 800,
      centered: true
    }
  }
};

// Theme configurations
export const Themes = {
  org1: {
    primaryColor: '#1890ff',
    secondaryColor: '#f0f2f5',
    name: 'Land Authority'
  },
  org2: {
    primaryColor: '#52c41a',
    secondaryColor: '#f6ffed',
    name: 'Government Officers'
  },
  org3: {
    primaryColor: '#fa8c16',
    secondaryColor: '#fff7e6',
    name: 'Citizens'
  }
};

// Common constants
export const Constants = {
  // Animation durations
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500
  },
  
  // Breakpoints
  BREAKPOINTS: {
    XS: 480,
    SM: 576,
    MD: 768,
    LG: 992,
    XL: 1200,
    XXL: 1600
  },
  
  // Z-index layers
  Z_INDEX: {
    DROPDOWN: 1000,
    STICKY: 1020,
    FIXED: 1030,
    MODAL_BACKDROP: 1040,
    MODAL: 1050,
    POPOVER: 1060,
    TOOLTIP: 1070,
    NOTIFICATION: 1080
  },
  
  // Status colors
  STATUS_COLORS: {
    SUCCESS: '#52c41a',
    WARNING: '#faad14',
    ERROR: '#ff4d4f',
    INFO: '#1890ff',
    PROCESSING: '#722ed1'
  }
};

// Export everything as default for convenience
export default {
  Components,
  Utils,
  Presets,
  Themes,
  Constants
};