import apiClient, { API_ENDPOINTS, handleApiError } from './api';

// Dashboard Service - Handles all dashboard operations
const dashboardService = {
  // Get main dashboard statistics
  async getDashboardStats() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.DASHBOARD.STATS);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get system report
  async getSystemReport() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.REPORTS.SYSTEM);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get analytics report
  async getAnalyticsReport() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.REPORTS.ANALYTICS);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Export data
  async exportData(dataType, format = 'json', filters = {}) {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(`filters[${key}]`, filters[key]);
        }
      });

      const response = await apiClient.get(`${API_ENDPOINTS.REPORTS.EXPORT.replace(':dataType', dataType)}?${params.toString()}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get system configurations
  async getSystemConfigs() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.SYSTEM.CONFIGS);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get system config categories
  async getConfigCategories() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.SYSTEM.CONFIG_CATEGORIES);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get specific system config
  async getSystemConfig(key) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.SYSTEM.GET_CONFIG.replace(':key', key));
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Update system config (Admin only)
  async updateSystemConfig(key, value) {
    try {
      const response = await apiClient.put(API_ENDPOINTS.SYSTEM.UPDATE_CONFIG.replace(':key', key), { value });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Delete system config (Admin only)
  async deleteSystemConfig(key) {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.SYSTEM.DELETE_CONFIG.replace(':key', key));
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Reset system config to default (Admin only)
  async resetSystemConfig(key) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.SYSTEM.RESET_CONFIG.replace(':key', key));
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Initialize default configs (Admin only)
  async initializeDefaultConfigs() {
    try {
      const response = await apiClient.post(API_ENDPOINTS.SYSTEM.INITIALIZE_CONFIG);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get logs by transaction ID
  async getLogsByTransaction(txID) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.LOGS.SEARCH.replace(':txID', txID));
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Format dashboard data for display
  formatDashboardData(data) {
    if (!data) return null;

    return {
      ...data,
      // Format timestamps
      lastUpdated: data.lastUpdated ? new Date(data.lastUpdated) : new Date(),
      lastUpdatedFormatted: data.lastUpdated ? new Date(data.lastUpdated).toLocaleString('vi-VN') : 'N/A',
      
      // Format statistics
      landStats: this.formatLandStats(data.landStats),
      transactionStats: this.formatTransactionStats(data.transactionStats),
      documentStats: this.formatDocumentStats(data.documentStats),
      userStats: this.formatUserStats(data.userStats),
      
      // Format system info
      systemInfo: this.formatSystemInfo(data.systemInfo)
    };
  },

  // Format land statistics
  formatLandStats(landStats) {
    if (!landStats) return null;

    return {
      ...landStats,
      totalArea: this.formatArea(landStats.totalArea),
      averageArea: this.formatArea(landStats.averageArea),
      areaDistribution: landStats.areaDistribution || {},
      purposeDistribution: landStats.purposeDistribution || {},
      statusDistribution: landStats.statusDistribution || {}
    };
  },

  // Format transaction statistics
  formatTransactionStats(txStats) {
    if (!txStats) return null;

    return {
      ...txStats,
      statusDistribution: txStats.statusDistribution || {},
      typeDistribution: txStats.typeDistribution || {},
      monthlyTrend: txStats.monthlyTrend || [],
      processingTime: this.formatProcessingTime(txStats.averageProcessingTime)
    };
  },

  // Format document statistics
  formatDocumentStats(docStats) {
    if (!docStats) return null;

    return {
      ...docStats,
      typeDistribution: docStats.typeDistribution || {},
      statusDistribution: docStats.statusDistribution || {},
      fileSizeDistribution: docStats.fileSizeDistribution || {},
      verificationTime: this.formatProcessingTime(docStats.averageVerificationTime)
    };
  },

  // Format user statistics
  formatUserStats(userStats) {
    if (!userStats) return null;

    return {
      ...userStats,
      orgDistribution: userStats.orgDistribution || {},
      roleDistribution: userStats.roleDistribution || {},
      activityDistribution: userStats.activityDistribution || {}
    };
  },

  // Format system information
  formatSystemInfo(systemInfo) {
    if (!systemInfo) return null;

    return {
      ...systemInfo,
      uptime: this.formatUptime(systemInfo.uptime),
      memoryUsage: this.formatMemoryUsage(systemInfo.memoryUsage),
      diskUsage: this.formatDiskUsage(systemInfo.diskUsage),
      blockchainStatus: this.formatBlockchainStatus(systemInfo.blockchainStatus)
    };
  },

  // Format area for display
  formatArea(area) {
    if (!area || area === 0) return '0 m²';
    
    if (area >= 10000) {
      return `${(area / 10000).toFixed(2)} ha`;
    } else if (area >= 1000000) {
      return `${(area / 1000000).toFixed(2)} km²`;
    } else {
      return `${area.toFixed(2)} m²`;
    }
  },

  // Format processing time
  formatProcessingTime(timeInSeconds) {
    if (!timeInSeconds || timeInSeconds === 0) return '0 giây';
    
    if (timeInSeconds < 60) {
      return `${timeInSeconds.toFixed(1)} giây`;
    } else if (timeInSeconds < 3600) {
      const minutes = Math.floor(timeInSeconds / 60);
      const seconds = timeInSeconds % 60;
      return `${minutes} phút ${seconds.toFixed(0)} giây`;
    } else {
      const hours = Math.floor(timeInSeconds / 3600);
      const minutes = Math.floor((timeInSeconds % 3600) / 60);
      return `${hours} giờ ${minutes} phút`;
    }
  },

  // Format uptime
  formatUptime(uptimeInSeconds) {
    if (!uptimeInSeconds || uptimeInSeconds === 0) return '0 giây';
    
    const days = Math.floor(uptimeInSeconds / 86400);
    const hours = Math.floor((uptimeInSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeInSeconds % 3600) / 60);
    const seconds = uptimeInSeconds % 60;
    
    if (days > 0) {
      return `${days} ngày ${hours} giờ ${minutes} phút`;
    } else if (hours > 0) {
      return `${hours} giờ ${minutes} phút`;
    } else if (minutes > 0) {
      return `${minutes} phút ${seconds} giây`;
    } else {
      return `${seconds} giây`;
    }
  },

  // Format memory usage
  formatMemoryUsage(usage) {
    if (!usage) return 'N/A';
    
    const { used, total, unit = 'MB' } = usage;
    const percentage = total > 0 ? ((used / total) * 100).toFixed(1) : 0;
    
    return {
      used: `${used} ${unit}`,
      total: `${total} ${unit}`,
      percentage: `${percentage}%`,
      status: percentage > 90 ? 'critical' : percentage > 80 ? 'warning' : 'normal'
    };
  },

  // Format disk usage
  formatDiskUsage(usage) {
    if (!usage) return 'N/A';
    
    const { used, total, unit = 'GB' } = usage;
    const percentage = total > 0 ? ((used / total) * 100).toFixed(1) : 0;
    
    return {
      used: `${used} ${unit}`,
      total: `${total} ${unit}`,
      percentage: `${percentage}%`,
      status: percentage > 90 ? 'critical' : percentage > 80 ? 'warning' : 'normal'
    };
  },

  // Format blockchain status
  formatBlockchainStatus(status) {
    if (!status) return 'N/A';
    
    const { network, peers, channels, chaincodes } = status;
    
    return {
      network: network || 'Unknown',
      peers: {
        total: peers?.total || 0,
        online: peers?.online || 0,
        offline: peers?.offline || 0,
        status: peers?.online > 0 ? 'online' : 'offline'
      },
      channels: {
        total: channels?.total || 0,
        active: channels?.active || 0,
        status: channels?.active > 0 ? 'active' : 'inactive'
      },
      chaincodes: {
        total: chaincodes?.total || 0,
        active: chaincodes?.active || 0,
        status: chaincodes?.active > 0 ? 'active' : 'inactive'
      },
      overallStatus: this.getOverallBlockchainStatus(status)
    };
  },

  // Get overall blockchain status
  getOverallBlockchainStatus(status) {
    const { peers, channels, chaincodes } = status;
    
    if (peers?.online === 0 || channels?.active === 0 || chaincodes?.active === 0) {
      return 'offline';
    } else if (peers?.online < peers?.total || channels?.active < channels?.total || chaincodes?.active < chaincodes?.total) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  },

  // Get chart data for dashboard
  getChartData(stats, chartType) {
    if (!stats) return null;

    switch (chartType) {
      case 'landPurpose':
        return this.formatChartData(stats.landStats?.purposeDistribution, 'Mục đích sử dụng', 'Diện tích');
      
      case 'landStatus':
        return this.formatChartData(stats.landStats?.statusDistribution, 'Trạng thái pháp lý', 'Số lượng');
      
      case 'transactionStatus':
        return this.formatChartData(stats.transactionStats?.statusDistribution, 'Trạng thái giao dịch', 'Số lượng');
      
      case 'transactionType':
        return this.formatChartData(stats.transactionStats?.typeDistribution, 'Loại giao dịch', 'Số lượng');
      
      case 'documentType':
        return this.formatChartData(stats.documentStats?.typeDistribution, 'Loại tài liệu', 'Số lượng');
      
      case 'documentStatus':
        return this.formatChartData(stats.documentStats?.statusDistribution, 'Trạng thái tài liệu', 'Số lượng');
      
      case 'userOrg':
        return this.formatChartData(stats.userStats?.orgDistribution, 'Tổ chức', 'Số lượng');
      
      default:
        return null;
    }
  },

  // Format chart data
  formatChartData(data, labelKey, valueKey) {
    if (!data) return [];
    
    return Object.entries(data).map(([key, value]) => ({
      [labelKey]: key,
      [valueKey]: value
    }));
  }
};

export default dashboardService;
