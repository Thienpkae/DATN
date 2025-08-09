const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    // Người nhận thông báo
    recipientId: {
        type: String,
        required: true,
        index: true // Index để query nhanh
    },
    
    // Loại thông báo
    type: {
        type: String,
        required: true,
        enum: [
            // Transaction notifications
            'TRANSACTION_CREATED',          // Giao dịch đã tạo
            'TRANSFER_REQUEST_CREATED',     // Yêu cầu chuyển nhượng đã tạo
            'TRANSFER_REQUEST_RECEIVED',    // Nhận yêu cầu chuyển nhượng
            'SPLIT_REQUEST_CREATED',        // Yêu cầu tách thửa đã tạo
            'MERGE_REQUEST_CREATED',        // Yêu cầu hợp nhất đã tạo
            'CHANGE_PURPOSE_REQUEST_CREATED', // Yêu cầu đổi mục đích đã tạo
            'REISSUE_REQUEST_CREATED',      // Yêu cầu cấp lại GCN đã tạo
            'TRANSFER_CONFIRMED',           // Chuyển nhượng đã xác nhận
            'TRANSACTION_PROCESSED',        // Giao dịch đã xử lý
            'TRANSACTION_FORWARDED',        // Giao dịch đã chuyển tiếp
            'TRANSACTION_APPROVED',         // Giao dịch được phê duyệt
            'TRANSACTION_REJECTED',         // Giao dịch bị từ chối
            
            // Document notifications
            'DOCUMENT_CREATED',             // Tài liệu đã tạo
            'DOCUMENT_UPDATED',             // Tài liệu đã cập nhật
            'DOCUMENT_VERIFIED',            // Tài liệu được xác minh
            'DOCUMENT_REJECTED',            // Tài liệu bị từ chối
            'DOCUMENT_LINKED',              // Tài liệu đã liên kết
            'DOCUMENT_DELETED',             // Tài liệu đã xóa
            
            // Land parcel notifications
            'LAND_PARCEL_CREATED',          // Thửa đất đã tạo
            'LAND_PARCEL_UPDATED',          // Thửa đất đã cập nhật
            
            // User notifications
            'USER_PROFILE_UPDATED',         // Hồ sơ đã cập nhật
            'PASSWORD_CHANGED',             // Mật khẩu đã thay đổi
            
            // System notifications
            'SYSTEM_ANNOUNCEMENT'           // Thông báo hệ thống
        ]
    },
    
    // Tiêu đề thông báo
    title: {
        type: String,
        required: true,
        maxlength: 200
    },
    
    // Nội dung thông báo
    message: {
        type: String,
        required: true,
        maxlength: 1000
    },
    
    // Dữ liệu liên quan (transaction ID, land ID, etc.)
    relatedData: {
        transactionId: String,
        landParcelId: String,
        documentId: String,
        userId: String,
        amount: Number,
        area: Number,
        customTitle: String,
        customMessage: String
    },
    
    // Trạng thái
    status: {
        type: String,
        enum: ['UNREAD', 'READ', 'ARCHIVED'],
        default: 'UNREAD'
    },
    
    // Độ ưu tiên
    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        default: 'MEDIUM'
    },
    
    // Thời gian
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    
    readAt: {
        type: Date
    },
    
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 ngày
    }
}, {
    timestamps: true
});

// Indexes cho performance
notificationSchema.index({ recipientId: 1, status: 1 });
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

// TTL index để tự động xóa notification cũ
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual cho URL
notificationSchema.virtual('actionUrl').get(function() {
    const { transactionId, landParcelId, documentId } = this.relatedData;
    
    switch (this.type) {
        case 'TRANSACTION_CREATED':
        case 'TRANSFER_REQUEST_CREATED':
        case 'TRANSFER_REQUEST_RECEIVED':
        case 'SPLIT_REQUEST_CREATED':
        case 'MERGE_REQUEST_CREATED':
        case 'CHANGE_PURPOSE_REQUEST_CREATED':
        case 'REISSUE_REQUEST_CREATED':
        case 'TRANSFER_CONFIRMED':
        case 'TRANSACTION_PROCESSED':
        case 'TRANSACTION_FORWARDED':
        case 'TRANSACTION_APPROVED':
        case 'TRANSACTION_REJECTED':
            return `/transactions/${transactionId}`;
        case 'DOCUMENT_CREATED':
        case 'DOCUMENT_UPDATED':
        case 'DOCUMENT_VERIFIED':
        case 'DOCUMENT_REJECTED':
        case 'DOCUMENT_LINKED':
        case 'DOCUMENT_DELETED':
            return `/documents/${documentId}`;
        case 'LAND_PARCEL_CREATED':
        case 'LAND_PARCEL_UPDATED':
            return `/land-parcels/${landParcelId}`;
        case 'USER_PROFILE_UPDATED':
        case 'PASSWORD_CHANGED':
            return `/profile`;
        default:
            return '/notifications';
    }
});

// Methods
notificationSchema.methods.markAsRead = function() {
    this.status = 'READ';
    this.readAt = new Date();
    return this.save();
};

notificationSchema.methods.archive = function() {
    this.status = 'ARCHIVED';
    return this.save();
};

// Static methods
notificationSchema.statics.getUnreadCount = function(recipientId) {
    return this.countDocuments({ 
        recipientId, 
        status: 'UNREAD' 
    });
};

notificationSchema.statics.getRecentNotifications = function(recipientId, limit = 20) {
    return this.find({ recipientId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();
};

notificationSchema.statics.markAllAsRead = function(recipientId) {
    return this.updateMany(
        { recipientId, status: 'UNREAD' },
        { status: 'READ', readAt: new Date() }
    );
};

module.exports = mongoose.model('Notification', notificationSchema); 