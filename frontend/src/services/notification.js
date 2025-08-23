import apiClient, { API_ENDPOINTS, handleApiError } from './api';

// Notification Service - Handles all notification operations
const notificationService = {
  // WebSocket removed - using polling instead
  
  // Initialize WebSocket connection (disabled)
  initializeWebSocket(userId, onMessage, onError, onClose) {
    console.log('WebSocket disabled - using polling instead');
    // Call onMessage with empty data to indicate WebSocket is disabled
    onMessage({ type: 'WEBSOCKET_DISABLED', data: null });
  },

  // Close WebSocket connection (disabled)
  closeWebSocket() {
    console.log('WebSocket disabled - using polling instead');
  },

  // Subscribe to notifications (disabled)
  async subscribe(userId) {
    console.log('WebSocket disabled - using polling instead');
  },

  // Unsubscribe from notifications (disabled)
  async unsubscribe(userId) {
    console.log('WebSocket disabled - using polling instead');
  },

  // Get all notifications
  async getNotifications() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.LIST);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get user notifications from backend
  async getUserNotifications(filters = {}) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.LIST, { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw handleApiError(error);
    }
  },

  // Get unread notification count
  async getUnreadCount() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const response = await apiClient.put(
        `${API_ENDPOINTS.NOTIFICATIONS.LIST}/${encodeURIComponent(notificationId)}/read`
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const response = await apiClient.put(
        `${API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ}`
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Archive notification
  async archiveNotification(notificationId) {
    try {
      const response = await apiClient.put(
        `${API_ENDPOINTS.NOTIFICATIONS.LIST}/${encodeURIComponent(notificationId)}/archive`
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get notification preferences
  async getPreferences() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.PREFERENCES);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Update notification preferences
  async updatePreferences(preferences) {
    try {
      const response = await apiClient.put(API_ENDPOINTS.NOTIFICATIONS.PREFERENCES, preferences);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Send notification (Admin only)
  async sendNotification(notificationData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.NOTIFICATIONS.SEND, notificationData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Validate notification data
  validateNotificationData(notificationData) {
    const errors = [];

    if (!notificationData.title || notificationData.title.trim() === '') {
      errors.push('Tiêu đề thông báo không được để trống');
    }

    if (!notificationData.message || notificationData.message.trim() === '') {
      errors.push('Nội dung thông báo không được để trống');
    }

    if (!notificationData.type || notificationData.type.trim() === '') {
      errors.push('Loại thông báo không được để trống');
    }

    if (!notificationData.recipientId || notificationData.recipientId.trim() === '') {
      errors.push('Người nhận thông báo không được để trống');
    }

    // Validate notification type
    const validTypes = ['info', 'success', 'warning', 'error'];
    if (!validTypes.includes(notificationData.type)) {
      errors.push('Loại thông báo không hợp lệ');
    }

    return errors;
  },

  // Format notification data for display
  formatNotificationData(notification) {
    return {
      ...notification,
      createdAt: notification.createdAt ? new Date(notification.createdAt) : null,
      updatedAt: notification.updatedAt ? new Date(notification.updatedAt) : null,
      readAt: notification.readAt ? new Date(notification.readAt) : null,
      // Format dates for display
      createdAtFormatted: notification.createdAt ? new Date(notification.createdAt).toLocaleString('vi-VN') : 'N/A',
      updatedAtFormatted: notification.updatedAt ? new Date(notification.updatedAt).toLocaleString('vi-VN') : 'N/A',
      readAtFormatted: notification.readAt ? new Date(notification.readAt).toLocaleString('vi-VN') : 'N/A',
      // Time ago
      timeAgo: this.getTimeAgo(notification.createdAt),
      // Status display
      statusDisplay: notification.read ? 'Đã đọc' : 'Chưa đọc',
      statusColor: notification.read ? 'default' : 'primary'
    };
  },

  // Get time ago string
  getTimeAgo(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Vừa xong';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} phút trước`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} giờ trước`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ngày trước`;
    } else if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} tháng trước`;
    } else {
      const years = Math.floor(diffInSeconds / 31536000);
      return `${years} năm trước`;
    }
  },

  // Get notification icon based on type
  getNotificationIcon(type) {
    const iconMap = {
      'info': 'info-circle',
      'success': 'check-circle',
      'warning': 'exclamation-circle',
      'error': 'close-circle'
    };
    return iconMap[type] || 'bell';
  },

  // Get notification color based on type
  getNotificationColor(type) {
    const colorMap = {
      'info': '#1890ff',
      'success': '#52c41a',
      'warning': '#faad14',
      'error': '#f5222d'
    };
    return colorMap[type] || '#1890ff';
  },

  // Create notification object
  createNotification(data) {
    return {
      id: data.id || Date.now().toString(),
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      recipientId: data.recipientId,
      senderId: data.senderId,
      relatedEntity: data.relatedEntity || null,
      relatedEntityType: data.relatedEntityType || null,
      priority: data.priority || 'normal',
      expiresAt: data.expiresAt || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      read: false,
      readAt: null
    };
  },

  // Filter notifications
  filterNotifications(notifications, filters = {}) {
    let filtered = [...notifications];

    // Filter by type
    if (filters.type) {
      filtered = filtered.filter(n => n.type === filters.type);
    }

    // Filter by read status
    if (filters.read !== undefined) {
      filtered = filtered.filter(n => n.read === filters.read);
    }

    // Filter by date range
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filtered = filtered.filter(n => new Date(n.createdAt) >= startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      filtered = filtered.filter(n => new Date(n.createdAt) <= endDate);
    }

    // Filter by priority
    if (filters.priority) {
      filtered = filtered.filter(n => n.priority === filters.priority);
    }

    // Filter by related entity
    if (filters.relatedEntityType) {
      filtered = filtered.filter(n => n.relatedEntityType === filters.relatedEntityType);
    }

    return filtered;
  },

  // Sort notifications
  sortNotifications(notifications, sortBy = 'createdAt', sortOrder = 'desc') {
    const sorted = [...notifications];
    
    sorted.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      // Handle date sorting
      if (sortBy === 'createdAt' || sortBy === 'updatedAt' || sortBy === 'readAt') {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      }
      
      // Handle priority sorting
      if (sortBy === 'priority') {
        const priorityOrder = { 'high': 3, 'normal': 2, 'low': 1 };
        aValue = priorityOrder[aValue] || 0;
        bValue = priorityOrder[bValue] || 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return sorted;
  },

  // Get notification statistics
  getNotificationStats(notifications) {
    const stats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      read: notifications.filter(n => n.read).length,
      byType: {},
      byPriority: {},
      byDate: {}
    };

    // Count by type
    notifications.forEach(n => {
      stats.byType[n.type] = (stats.byType[n.type] || 0) + 1;
    });

    // Count by priority
    notifications.forEach(n => {
      stats.byPriority[n.priority] = (stats.byPriority[n.priority] || 0) + 1;
    });

    // Count by date (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });

    last7Days.forEach(date => {
      stats.byDate[date] = notifications.filter(n => 
        n.createdAt.startsWith(date)
      ).length;
    });

    return stats;
  }
};

export default notificationService;
