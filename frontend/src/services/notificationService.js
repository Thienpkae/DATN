import apiClient, { API_ENDPOINTS, handleApiError } from './api';

// Notification Management Service - Tích hợp trực tiếp với backend APIs
const notificationService = {
  // Get all notifications for current user
  async getMyNotifications() {
    try {
      // Sử dụng LIST endpoint thay vì GET_MY không tồn tại
      const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.LIST);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get all notifications (for admin users)
  async getAllNotifications() {
    try {
      // Thay thế bằng LIST endpoint do không có GET_ALL
      const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.LIST);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get notifications by user ID
  async getNotificationsByUser(userId) {
    try {
      // API này không tồn tại, sử dụng LIST với query params
      const response = await apiClient.get(`${API_ENDPOINTS.NOTIFICATIONS.LIST}?userId=${userId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get notification by ID
  async getNotificationById(notificationId) {
    try {
      // API này không tồn tại, sử dụng LIST với filter
      const response = await apiClient.get(`${API_ENDPOINTS.NOTIFICATIONS.LIST}?id=${notificationId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const url = API_ENDPOINTS.NOTIFICATIONS.MARK_READ.replace(':id', notificationId);
      const response = await apiClient.patch(url);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const response = await apiClient.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Delete notification
  async deleteNotification(notificationId) {
    try {
      const url = API_ENDPOINTS.NOTIFICATIONS.DELETE.replace(':id', notificationId);
      const response = await apiClient.delete(url);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Delete all notifications for current user
  async deleteAllMyNotifications() {
    try {
      // API không tồn tại, tạm thời comment out hoặc dùng workaround
      // const response = await apiClient.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE_ALL_MY);
      console.warn('deleteAllMyNotifications API không có sẵn - cần triển khai backend');
      return { success: false, message: 'Chức năng chưa được triển khai' };
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Create custom notification (for admin users)
  async createCustomNotification(notificationData) {
    try {
      // API không tồn tại, tạm thời comment out
      // const response = await apiClient.post(API_ENDPOINTS.NOTIFICATIONS.CREATE_CUSTOM, notificationData);
      console.warn('createCustomNotification API không có sẵn - cần triển khai backend');
      return { success: false, message: 'Chức năng chưa được triển khai' };
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Send system announcement (for admin users)
  async sendSystemAnnouncement(announcementData) {
    try {
      // API không tồn tại, tạm thời comment out
      // const response = await apiClient.post(API_ENDPOINTS.NOTIFICATIONS.SEND_ANNOUNCEMENT, announcementData);
      console.warn('sendSystemAnnouncement API không có sẵn - cần triển khai backend');
      return { success: false, message: 'Chức năng chưa được triển khai' };
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get notification statistics
  async getNotificationStats() {
    try {
      // API không tồn tại, tạm thời comment out
      // const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.GET_STATS);
      console.warn('getNotificationStats API không có sẵn - cần triển khai backend');
      return { success: false, message: 'Chức năng chưa được triển khai' };
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Search notifications
  async searchNotifications(searchParams) {
    try {
      // API không tồn tại, sử dụng LIST với query params
      const queryString = new URLSearchParams(searchParams).toString();
      const response = await apiClient.get(`${API_ENDPOINTS.NOTIFICATIONS.LIST}?${queryString}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get unread count
  async getUnreadCount() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.GET_UNREAD_COUNT);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get notification types
  getNotificationTypes() {
    return [
      { value: 'TRANSACTION_CREATED', label: 'Giao dịch đã tạo', color: 'blue' },
      { value: 'TRANSFER_REQUEST_CREATED', label: 'Yêu cầu chuyển nhượng', color: 'green' },
      { value: 'TRANSFER_REQUEST_RECEIVED', label: 'Nhận yêu cầu chuyển nhượng', color: 'orange' },
      { value: 'TRANSFER_CONFIRMED', label: 'Chuyển nhượng đã xác nhận', color: 'green' },
      { value: 'SPLIT_REQUEST_CREATED', label: 'Yêu cầu tách thửa', color: 'cyan' },
      { value: 'MERGE_REQUEST_CREATED', label: 'Yêu cầu gộp thửa', color: 'purple' },
      { value: 'CHANGE_PURPOSE_REQUEST_CREATED', label: 'Yêu cầu đổi mục đích', color: 'geekblue' },
      { value: 'REISSUE_REQUEST_CREATED', label: 'Yêu cầu cấp lại GCN', color: 'lime' },
      { value: 'TRANSACTION_PROCESSED', label: 'Giao dịch đã xử lý', color: 'blue' },
      { value: 'TRANSACTION_APPROVED', label: 'Giao dịch được phê duyệt', color: 'green' },
      { value: 'TRANSACTION_REJECTED', label: 'Giao dịch bị từ chối', color: 'red' },
      { value: 'DOCUMENT_CREATED', label: 'Tài liệu đã tạo', color: 'blue' },
      { value: 'DOCUMENT_UPDATED', label: 'Tài liệu đã cập nhật', color: 'orange' },
      { value: 'DOCUMENT_VERIFIED', label: 'Tài liệu đã xác minh', color: 'green' },
      { value: 'DOCUMENT_REJECTED', label: 'Tài liệu bị từ chối', color: 'red' },
      { value: 'DOCUMENT_LINKED', label: 'Tài liệu đã liên kết', color: 'purple' },
      { value: 'DOCUMENT_DELETED', label: 'Tài liệu đã xóa', color: 'red' },
      { value: 'SYSTEM_ANNOUNCEMENT', label: 'Thông báo hệ thống', color: 'gold' },
      { value: 'LAND_PARCEL_CREATED', label: 'Thửa đất đã tạo', color: 'green' },
      { value: 'LAND_PARCEL_UPDATED', label: 'Thửa đất đã cập nhật', color: 'blue' },
      { value: 'LAND_CERTIFICATE_ISSUED', label: 'GCN đã cấp', color: 'green' },
      { value: 'USER_PROFILE_UPDATED', label: 'Hồ sơ đã cập nhật', color: 'blue' },
      { value: 'PASSWORD_CHANGED', label: 'Mật khẩu đã thay đổi', color: 'orange' }
    ];
  },

  // Get priority levels
  getPriorityLevels() {
    return [
      { value: 'LOW', label: 'Thấp', color: 'default' },
      { value: 'MEDIUM', label: 'Trung bình', color: 'blue' },
      { value: 'HIGH', label: 'Cao', color: 'red' }
    ];
  },

  // Get priority color
  getPriorityColor(priority) {
    const priorityMap = {
      'LOW': 'default',
      'MEDIUM': 'blue',
      'HIGH': 'red'
    };
    return priorityMap[priority] || 'default';
  },

  // Get notification type color
  getTypeColor(type) {
    const typeMap = {
      'TRANSACTION_CREATED': 'blue',
      'TRANSFER_REQUEST_CREATED': 'green',
      'TRANSFER_REQUEST_RECEIVED': 'orange',
      'TRANSFER_CONFIRMED': 'green',
      'SPLIT_REQUEST_CREATED': 'cyan',
      'MERGE_REQUEST_CREATED': 'purple',
      'CHANGE_PURPOSE_REQUEST_CREATED': 'geekblue',
      'REISSUE_REQUEST_CREATED': 'lime',
      'TRANSACTION_PROCESSED': 'blue',
      'TRANSACTION_APPROVED': 'green',
      'TRANSACTION_REJECTED': 'red',
      'DOCUMENT_CREATED': 'blue',
      'DOCUMENT_UPDATED': 'orange',
      'DOCUMENT_VERIFIED': 'green',
      'DOCUMENT_REJECTED': 'red',
      'DOCUMENT_LINKED': 'purple',
      'DOCUMENT_DELETED': 'red',
      'SYSTEM_ANNOUNCEMENT': 'gold',
      'LAND_PARCEL_CREATED': 'green',
      'LAND_PARCEL_UPDATED': 'blue',
      'LAND_CERTIFICATE_ISSUED': 'green',
      'USER_PROFILE_UPDATED': 'blue',
      'PASSWORD_CHANGED': 'orange'
    };
    return typeMap[type] || 'default';
  },

  // Format notification data for display
  formatNotificationData(notification) {
    return {
      ...notification,
      createdAt: notification.createdAt ? new Date(notification.createdAt).toLocaleString('vi-VN') : 'N/A',
      updatedAt: notification.updatedAt ? new Date(notification.updatedAt).toLocaleString('vi-VN') : 'N/A'
    };
  },

  // Get notification type label
  getTypeLabel(type) {
    const typeMap = {
      'TRANSACTION_CREATED': 'Giao dịch đã tạo',
      'TRANSFER_REQUEST_CREATED': 'Yêu cầu chuyển nhượng',
      'TRANSFER_REQUEST_RECEIVED': 'Nhận yêu cầu chuyển nhượng',
      'TRANSFER_CONFIRMED': 'Chuyển nhượng đã xác nhận',
      'SPLIT_REQUEST_CREATED': 'Yêu cầu tách thửa',
      'MERGE_REQUEST_CREATED': 'Yêu cầu gộp thửa',
      'CHANGE_PURPOSE_REQUEST_CREATED': 'Yêu cầu đổi mục đích',
      'REISSUE_REQUEST_CREATED': 'Yêu cầu cấp lại GCN',
      'TRANSACTION_PROCESSED': 'Giao dịch đã xử lý',
      'TRANSACTION_APPROVED': 'Giao dịch được phê duyệt',
      'TRANSACTION_REJECTED': 'Giao dịch bị từ chối',
      'DOCUMENT_CREATED': 'Tài liệu đã tạo',
      'DOCUMENT_UPDATED': 'Tài liệu đã cập nhật',
      'DOCUMENT_VERIFIED': 'Tài liệu đã xác minh',
      'DOCUMENT_REJECTED': 'Tài liệu bị từ chối',
      'DOCUMENT_LINKED': 'Tài liệu đã liên kết',
      'DOCUMENT_DELETED': 'Tài liệu đã xóa',
      'SYSTEM_ANNOUNCEMENT': 'Thông báo hệ thống',
      'LAND_PARCEL_CREATED': 'Thửa đất đã tạo',
      'LAND_PARCEL_UPDATED': 'Thửa đất đã cập nhật',
      'LAND_CERTIFICATE_ISSUED': 'GCN đã cấp',
      'USER_PROFILE_UPDATED': 'Hồ sơ đã cập nhật',
      'PASSWORD_CHANGED': 'Mật khẩu đã thay đổi'
    };
    return typeMap[type] || type;
  },

  // Get priority label
  getPriorityLabel(priority) {
    const priorityMap = {
      'LOW': 'Thấp',
      'MEDIUM': 'Trung bình',
      'HIGH': 'Cao'
    };
    return priorityMap[priority] || priority;
  }
};

export default notificationService;
