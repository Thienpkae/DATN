'use strict';
const mongoose = require('mongoose');

// System Configuration Schema
const systemConfigSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['security', 'performance', 'ui', 'notification', 'blockchain', 'general']
    },
    description: {
        type: String,
        required: true
    },
    dataType: {
        type: String,
        required: true,
        enum: ['string', 'number', 'boolean', 'object', 'array']
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    lastModifiedBy: {
        type: String,
        required: true
    },
    lastModifiedAt: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);

// System Service - Handles system configuration and settings
const systemService = {
    // Get all system configurations
    async getSystemConfigs(req, res) {
        try {
            const userID = req.user.cccd;
            const { category, isPublic } = req.query;

            let filter = {};
            if (category) {
                filter.category = category;
            }

            // Non-admin users can only see public configurations
            if (req.user.role !== 'admin') {
                filter.isPublic = true;
            } else if (isPublic !== undefined) {
                filter.isPublic = isPublic === 'true';
            }

            const configs = await SystemConfig.find(filter).sort({ category: 1, key: 1 });

            res.json({
                success: true,
                data: configs
            });
        } catch (error) {
            console.error('Error getting system configs:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy cấu hình hệ thống',
                error: error.message
            });
        }
    },

    // Get system configuration by key
    async getSystemConfig(req, res) {
        try {
            const { key } = req.params;
            const userID = req.user.cccd;

            const config = await SystemConfig.findOne({ key });

            if (!config) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy cấu hình'
                });
            }

            // Check if user has permission to view this config
            if (req.user.role !== 'admin' && !config.isPublic) {
                return res.status(403).json({
                    success: false,
                    message: 'Không có quyền xem cấu hình này'
                });
            }

            res.json({
                success: true,
                data: config
            });
        } catch (error) {
            console.error('Error getting system config:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy cấu hình hệ thống',
                error: error.message
            });
        }
    },

    // Create or update system configuration
    async updateSystemConfig(req, res) {
        try {
            const { key } = req.params;
            const { value, category, description, dataType, isPublic } = req.body;
            const userID = req.user.cccd;

            // Validate input
            if (!value || !category || !description || !dataType) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin bắt buộc'
                });
            }

            // Validate data type
            const validDataTypes = ['string', 'number', 'boolean', 'object', 'array'];
            if (!validDataTypes.includes(dataType)) {
                return res.status(400).json({
                    success: false,
                    message: 'Loại dữ liệu không hợp lệ'
                });
            }

            // Validate category
            const validCategories = ['security', 'performance', 'ui', 'notification', 'blockchain', 'general'];
            if (!validCategories.includes(category)) {
                return res.status(400).json({
                    success: false,
                    message: 'Danh mục không hợp lệ'
                });
            }

            // Validate value against data type
            if (!validateValueType(value, dataType)) {
                return res.status(400).json({
                    success: false,
                    message: `Giá trị không khớp với kiểu dữ liệu ${dataType}`
                });
            }

            // Create backup of old config if exists
            const oldConfig = await SystemConfig.findOne({ key });
            if (oldConfig) {
                await createConfigBackup(oldConfig, userID);
            }

            // Update or create configuration
            const config = await SystemConfig.findOneAndUpdate(
                { key },
                {
                    key,
                    value,
                    category,
                    description,
                    dataType,
                    isPublic: isPublic || false,
                    lastModifiedBy: userID,
                    lastModifiedAt: new Date()
                },
                { 
                    upsert: true, 
                    new: true,
                    runValidators: true
                }
            );

            // Log configuration change
            await logConfigChange(key, oldConfig ? 'UPDATE' : 'CREATE', userID, oldConfig?.value, value);

            res.json({
                success: true,
                message: oldConfig ? 'Cấu hình đã được cập nhật' : 'Cấu hình đã được tạo',
                data: config
            });
        } catch (error) {
            console.error('Error updating system config:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi cập nhật cấu hình hệ thống',
                error: error.message
            });
        }
    },

    // Delete system configuration
    async deleteSystemConfig(req, res) {
        try {
            const { key } = req.params;
            const userID = req.user.cccd;

            const config = await SystemConfig.findOne({ key });
            if (!config) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy cấu hình'
                });
            }

            // Create backup before deletion
            await createConfigBackup(config, userID);

            // Delete configuration
            await SystemConfig.deleteOne({ key });

            // Log configuration deletion
            await logConfigChange(key, 'DELETE', userID, config.value, null);

            res.json({
                success: true,
                message: 'Cấu hình đã được xóa'
            });
        } catch (error) {
            console.error('Error deleting system config:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi xóa cấu hình hệ thống',
                error: error.message
            });
        }
    },

    // Get system configuration categories
    async getConfigCategories(req, res) {
        try {
            const categories = [
                {
                    key: 'security',
                    name: 'Bảo mật',
                    description: 'Cấu hình liên quan đến bảo mật hệ thống'
                },
                {
                    key: 'performance',
                    name: 'Hiệu suất',
                    description: 'Cấu hình tối ưu hiệu suất hệ thống'
                },
                {
                    key: 'ui',
                    name: 'Giao diện',
                    description: 'Cấu hình giao diện người dùng'
                },
                {
                    key: 'notification',
                    name: 'Thông báo',
                    description: 'Cấu hình hệ thống thông báo'
                },
                {
                    key: 'blockchain',
                    name: 'Blockchain',
                    description: 'Cấu hình kết nối và xử lý blockchain'
                },
                {
                    key: 'general',
                    name: 'Chung',
                    description: 'Cấu hình chung của hệ thống'
                }
            ];

            res.json({
                success: true,
                data: categories
            });
        } catch (error) {
            console.error('Error getting config categories:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy danh mục cấu hình',
                error: error.message
            });
        }
    },

    // Reset configuration to default
    async resetToDefault(req, res) {
        try {
            const { key } = req.params;
            const userID = req.user.cccd;

            const defaultConfigs = getDefaultConfigurations();
            const defaultConfig = defaultConfigs.find(config => config.key === key);

            if (!defaultConfig) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy cấu hình mặc định'
                });
            }

            // Backup current config
            const currentConfig = await SystemConfig.findOne({ key });
            if (currentConfig) {
                await createConfigBackup(currentConfig, userID);
            }

            // Reset to default
            const config = await SystemConfig.findOneAndUpdate(
                { key },
                {
                    ...defaultConfig,
                    lastModifiedBy: userID,
                    lastModifiedAt: new Date()
                },
                { 
                    upsert: true, 
                    new: true,
                    runValidators: true
                }
            );

            // Log configuration reset
            await logConfigChange(key, 'RESET', userID, currentConfig?.value, defaultConfig.value);

            res.json({
                success: true,
                message: 'Cấu hình đã được reset về mặc định',
                data: config
            });
        } catch (error) {
            console.error('Error resetting config:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi reset cấu hình',
                error: error.message
            });
        }
    },

    // Initialize default configurations
    async initializeDefaultConfigs(req, res) {
        try {
            const userID = req.user.cccd;
            const defaultConfigs = getDefaultConfigurations();
            let createdCount = 0;
            let updatedCount = 0;

            for (const defaultConfig of defaultConfigs) {
                const existingConfig = await SystemConfig.findOne({ key: defaultConfig.key });
                
                if (!existingConfig) {
                    await SystemConfig.create({
                        ...defaultConfig,
                        lastModifiedBy: userID,
                        createdAt: new Date(),
                        lastModifiedAt: new Date()
                    });
                    createdCount++;
                    await logConfigChange(defaultConfig.key, 'INIT', userID, null, defaultConfig.value);
                } else {
                    updatedCount++;
                }
            }

            res.json({
                success: true,
                message: `Khởi tạo cấu hình hoàn thành. Tạo mới: ${createdCount}, Đã tồn tại: ${updatedCount}`,
                data: {
                    created: createdCount,
                    existing: updatedCount,
                    total: defaultConfigs.length
                }
            });
        } catch (error) {
            console.error('Error initializing default configs:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi khởi tạo cấu hình mặc định',
                error: error.message
            });
        }
    }
};

// Helper function to validate value type
function validateValueType(value, dataType) {
    switch (dataType) {
        case 'string':
            return typeof value === 'string';
        case 'number':
            return typeof value === 'number' && !isNaN(value);
        case 'boolean':
            return typeof value === 'boolean';
        case 'object':
            return typeof value === 'object' && value !== null && !Array.isArray(value);
        case 'array':
            return Array.isArray(value);
        default:
            return false;
    }
}

// Configuration Backup Schema
const configBackupSchema = new mongoose.Schema({
    configKey: { type: String, required: true },
    oldValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
    action: { type: String, enum: ['CREATE', 'UPDATE', 'DELETE', 'RESET', 'INIT'], required: true },
    backedUpBy: { type: String, required: true },
    backedUpAt: { type: Date, default: Date.now }
});

const ConfigBackup = mongoose.model('ConfigBackup', configBackupSchema);

// Helper function to create config backup
async function createConfigBackup(config, userID) {
    try {
        await ConfigBackup.create({
            configKey: config.key,
            oldValue: config.value,
            backedUpBy: userID,
            backedUpAt: new Date()
        });
    } catch (error) {
        console.error('Error creating config backup:', error);
    }
}

// Configuration Change Log Schema
const configChangeLogSchema = new mongoose.Schema({
    configKey: { type: String, required: true },
    action: { type: String, enum: ['CREATE', 'UPDATE', 'DELETE', 'RESET', 'INIT'], required: true },
    oldValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
    changedBy: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    ipAddress: { type: String },
    userAgent: { type: String }
});

const ConfigChangeLog = mongoose.model('ConfigChangeLog', configChangeLogSchema);

// Helper function to log configuration changes
async function logConfigChange(key, action, userID, oldValue, newValue) {
    try {
        await ConfigChangeLog.create({
            configKey: key,
            action,
            oldValue,
            newValue,
            changedBy: userID,
            changedAt: new Date()
        });
    } catch (error) {
        console.error('Error logging config change:', error);
    }
}

// Default system configurations
function getDefaultConfigurations() {
    return [
        // Security configurations
        {
            key: 'session_timeout',
            value: 3600,
            category: 'security',
            description: 'Thời gian timeout của phiên đăng nhập (giây)',
            dataType: 'number',
            isPublic: false
        },
        {
            key: 'max_login_attempts',
            value: 5,
            category: 'security',
            description: 'Số lần đăng nhập sai tối đa trước khi khóa tài khoản',
            dataType: 'number',
            isPublic: false
        },
        {
            key: 'password_min_length',
            value: 8,
            category: 'security',
            description: 'Độ dài mật khẩu tối thiểu',
            dataType: 'number',
            isPublic: true
        },
        
        // Performance configurations
        {
            key: 'max_file_size',
            value: 10485760,
            category: 'performance',
            description: 'Kích thước file tối đa cho phép upload (bytes)',
            dataType: 'number',
            isPublic: true
        },
        {
            key: 'pagination_limit',
            value: 50,
            category: 'performance',
            description: 'Số bản ghi tối đa trên một trang',
            dataType: 'number',
            isPublic: true
        },
        
        // UI configurations
        {
            key: 'app_name',
            value: 'Hệ thống Quản lý Đất đai Blockchain',
            category: 'ui',
            description: 'Tên ứng dụng hiển thị',
            dataType: 'string',
            isPublic: true
        },
        {
            key: 'app_version',
            value: '1.0.0',
            category: 'ui',
            description: 'Phiên bản ứng dụng',
            dataType: 'string',
            isPublic: true
        },
        
        // Notification configurations
        {
            key: 'notification_enabled',
            value: true,
            category: 'notification',
            description: 'Bật/tắt hệ thống thông báo',
            dataType: 'boolean',
            isPublic: false
        },
        {
            key: 'notification_retention_days',
            value: 30,
            category: 'notification',
            description: 'Số ngày lưu trữ thông báo',
            dataType: 'number',
            isPublic: false
        },
        
        // Blockchain configurations
        {
            key: 'blockchain_network',
            value: 'test-network',
            category: 'blockchain',
            description: 'Tên mạng blockchain',
            dataType: 'string',
            isPublic: false
        },
        {
            key: 'chaincode_name',
            value: 'land-chaincode',
            category: 'blockchain',
            description: 'Tên chaincode',
            dataType: 'string',
            isPublic: false
        },
        
        // General configurations
        {
            key: 'maintenance_mode',
            value: false,
            category: 'general',
            description: 'Chế độ bảo trì hệ thống',
            dataType: 'boolean',
            isPublic: true
        },
        {
            key: 'support_email',
            value: 'support@landregistry.gov.vn',
            category: 'general',
            description: 'Email hỗ trợ hệ thống',
            dataType: 'string',
            isPublic: true
        }
    ];
}

module.exports = systemService; 