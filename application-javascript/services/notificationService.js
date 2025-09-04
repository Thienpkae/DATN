const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationService {
    constructor() {
        // WebSocket removed - using polling instead
    }

    // Main method to create and send notification
    async createNotification(type, recipientId, data) {
        try {
            // Generate notification content based on type
            const notificationContent = this.generateNotificationContent(type, data);
            
            // Create notification record
            const notification = new Notification({
                recipientId,
                type,
                title: notificationContent.title,
                message: notificationContent.message,
                relatedData: data,
                priority: notificationContent.priority || 'MEDIUM'
            });

            await notification.save();

            // Send real-time notification
            await this.sendRealTimeNotification(recipientId, notification);

            console.log(`🔔 Notification created: ${type} for user ${recipientId}`);
            return notification;

        } catch (error) {
            console.error('❌ Error creating notification:', error);
            throw error;
        }
    }

    // Generate notification content based on type and data
    generateNotificationContent(type, data) {
        const { userId, transactionId, landParcelId, documentId, area, customTitle, customMessage } = data;

        // Handle custom notifications
        if (customTitle && customMessage) {
            return {
                title: customTitle,
                message: customMessage,
                priority: data.priority || 'MEDIUM'
            };
        }

        switch (type) {
            // === TRANSACTION NOTIFICATIONS ===
            case 'TRANSACTION_CREATED':
                return {
                    title: '📝 Giao dịch đã được tạo',
                    message: `Giao dịch ${transactionId} đã được tạo thành công. Trạng thái: Chờ xử lý.`,
                    priority: 'MEDIUM'
                };

            case 'TRANSFER_REQUEST_CREATED':
                return {
                    title: '🔄 Yêu cầu chuyển nhượng đã tạo',
                    message: `Bạn đã tạo yêu cầu chuyển nhượng thửa đất ${landParcelId}. Mã giao dịch: ${transactionId}`,
                    priority: 'HIGH'
                };

            case 'TRANSFER_REQUEST_RECEIVED':
                return {
                    title: '📨 Nhận yêu cầu chuyển nhượng',
                    message: `Bạn nhận được yêu cầu chuyển nhượng thửa đất ${landParcelId}. Mã giao dịch: ${transactionId}. Vui lòng xem xét và xác nhận.`,
                    priority: 'HIGH'
                };

            case 'TRANSFER_CONFIRMED':
                const role = data.role;
                if (role === 'seller') {
                    return {
                        title: '✅ Chuyển nhượng đã xác nhận',
                        message: `Người mua đã xác nhận chuyển nhượng thửa đất ${landParcelId}. Quá trình chuyển nhượng đã hoàn tất.`,
                        priority: 'HIGH'
                    };
                } else {
                    return {
                        title: '🎉 Nhận chuyển nhượng thành công',
                        message: `Bạn đã xác nhận và nhận chuyển nhượng thửa đất ${landParcelId} thành công.`,
                        priority: 'HIGH'
                    };
                }

            case 'SPLIT_REQUEST_CREATED':
                return {
                    title: '✂️ Yêu cầu tách thửa đã tạo',
                    message: `Bạn đã tạo yêu cầu tách thửa đất ${landParcelId}. Mã giao dịch: ${transactionId}`,
                    priority: 'MEDIUM'
                };

            case 'MERGE_REQUEST_CREATED':
                return {
                    title: '🔗 Yêu cầu hợp nhất đã tạo',
                    message: `Bạn đã tạo yêu cầu hợp nhất thửa đất. Mã giao dịch: ${transactionId}`,
                    priority: 'MEDIUM'
                };

            case 'CHANGE_PURPOSE_REQUEST_CREATED':
                return {
                    title: '🔄 Yêu cầu đổi mục đích đã tạo',
                    message: `Bạn đã tạo yêu cầu thay đổi mục đích sử dụng thửa đất ${landParcelId}. Mã giao dịch: ${transactionId}`,
                    priority: 'MEDIUM'
                };

            case 'REISSUE_REQUEST_CREATED':
                return {
                    title: '📋 Yêu cầu cấp lại GCN đã tạo',
                    message: `Bạn đã tạo yêu cầu cấp lại giấy chứng nhận cho thửa đất ${landParcelId}. Mã giao dịch: ${transactionId}`,
                    priority: 'MEDIUM'
                };

            case 'TRANSACTION_PROCESSED':
                return {
                    title: '⚙️ Giao dịch đã xử lý',
                    message: `Giao dịch ${transactionId} của bạn đã được xử lý thành công.`,
                    priority: 'HIGH'
                };


            case 'TRANSACTION_APPROVED':
                return {
                    title: '✅ Giao dịch được phê duyệt',
                    message: `Giao dịch ${transactionId} của bạn đã được phê duyệt thành công!`,
                    priority: 'HIGH'
                };

            case 'TRANSACTION_REJECTED':
                return {
                    title: '❌ Giao dịch bị từ chối',
                    message: `Giao dịch ${transactionId} của bạn đã bị từ chối. Vui lòng kiểm tra lý do và thực hiện lại nếu cần.`,
                    priority: 'HIGH'
                };

            // === DOCUMENT NOTIFICATIONS ===
            case 'DOCUMENT_CREATED':
                return {
                    title: '📄 Tài liệu đã tạo',
                    message: `Bạn đã tạo tài liệu ${documentId} thành công. Trạng thái: Chờ xác minh.`,
                    priority: 'MEDIUM'
                };

            case 'DOCUMENT_UPDATED':
                return {
                    title: '📝 Tài liệu đã cập nhật',
                    message: `Bạn đã cập nhật tài liệu ${documentId} thành công.`,
                    priority: 'MEDIUM'
                };

            case 'DOCUMENT_VERIFIED':
                return {
                    title: '✅ Tài liệu đã xác minh',
                    message: `Tài liệu ${documentId} của bạn đã được xác minh thành công.`,
                    priority: 'HIGH'
                };

            case 'DOCUMENT_REJECTED':
                return {
                    title: '❌ Tài liệu bị từ chối',
                    message: `Tài liệu ${documentId} của bạn đã bị từ chối. Vui lòng kiểm tra và tải lên lại.`,
                    priority: 'HIGH'
                };

            case 'DOCUMENT_LINKED':
                return {
                    title: '🔗 Tài liệu đã liên kết',
                    message: `Bạn đã liên kết tài liệu ${documentId} thành công.`,
                    priority: 'MEDIUM'
                };

            case 'DOCUMENT_DELETED':
                return {
                    title: '🗑️ Tài liệu đã xóa',
                    message: `Bạn đã xóa tài liệu ${documentId} thành công.`,
                    priority: 'MEDIUM'
                };

            // === SYSTEM NOTIFICATIONS ===
            case 'SYSTEM_ANNOUNCEMENT':
                return {
                    title: '📢 Thông báo hệ thống',
                    message: customMessage || 'Bạn có thông báo mới từ hệ thống.',
                    priority: 'MEDIUM'
                };

            // === LAND PARCEL NOTIFICATIONS ===
            case 'LAND_PARCEL_CREATED':
                return {
                    title: '🏠 Thửa đất đã tạo',
                    message: `Thửa đất ${landParcelId} đã được tạo thành công.`,
                    priority: 'HIGH'
                };

            case 'LAND_PARCEL_UPDATED':
                return {
                    title: '📝 Thửa đất đã cập nhật',
                    message: `Thông tin thửa đất ${landParcelId} đã được cập nhật thành công.`,
                    priority: 'MEDIUM'
                };

            case 'LAND_CERTIFICATE_ISSUED':
                return {
                    title: '📜 Giấy chứng nhận đã cấp',
                    message: `Giấy chứng nhận quyền sử dụng đất cho thửa đất ${landParcelId} đã được cấp thành công. Mã chứng nhận: ${data.certificateId}`,
                    priority: 'HIGH'
                };

            // === USER NOTIFICATIONS ===
            case 'USER_PROFILE_UPDATED':
                return {
                    title: '👤 Hồ sơ đã cập nhật',
                    message: `Bạn đã cập nhật thông tin hồ sơ cá nhân thành công.`,
                    priority: 'MEDIUM'
                };

            case 'PASSWORD_CHANGED':
                return {
                    title: '🔒 Mật khẩu đã thay đổi',
                    message: `Bạn đã thay đổi mật khẩu thành công.`,
                    priority: 'HIGH'
                };

            case 'ACCOUNT_LOCKED':
                return {
                    title: '🔒 Tài khoản đã bị khóa',
                    message: customMessage || 'Tài khoản của bạn đã bị khóa bởi quản trị viên. Liên hệ hỗ trợ nếu cần thiết.',
                    priority: 'HIGH'
                };

            case 'ACCOUNT_UNLOCKED':
                return {
                    title: '🔓 Tài khoản đã được mở khóa',
                    message: customMessage || 'Tài khoản của bạn đã được mở khóa bởi quản trị viên. Bạn có thể đăng nhập lại.',
                    priority: 'HIGH'
                };

            default:
                return {
                    title: '🔔 Thông báo mới',
                    message: 'Bạn có thông báo mới từ hệ thống.',
                    priority: 'LOW'
                };
        }
    }

    // Send notification (WebSocket removed - using polling instead)
    async sendRealTimeNotification(userId, notification) {
        // WebSocket removed - notifications will be fetched via API polling
        console.log(`📤 Notification created for user ${userId}: ${notification.title}`);
    }

    // Notify multiple users
    async notifyMultipleUsers(type, userIds, data) {
        const promises = userIds.map(userId => 
            this.createNotification(type, userId, data)
        );
        
        return Promise.allSettled(promises);
    }

    // Business logic methods for different scenarios

    // === TRANSACTION NOTIFICATIONS ===
    async notifyTransactionCreated(userId, transactionId, landParcelId, type = 'TRANSACTION_CREATED') {
        await this.createNotification(type, userId, {
            transactionId,
            landParcelId,
            userId
        });
    }

    // Special method for transfer requests - notify both parties
    async notifyTransferRequest(fromUserId, toUserId, transactionId, landParcelId) {
        // Notify person creating the request
        await this.createNotification('TRANSFER_REQUEST_CREATED', fromUserId, {
            transactionId,
            landParcelId,
            userId: fromUserId,
            relatedUserId: toUserId
        });

        // Notify person receiving the request
        await this.createNotification('TRANSFER_REQUEST_RECEIVED', toUserId, {
            transactionId,
            landParcelId,
            userId: fromUserId,
            relatedUserId: toUserId
        });
    }

    async notifyTransactionProcessed(userId, transactionId) {
        await this.createNotification('TRANSACTION_PROCESSED', userId, {
            transactionId,
            userId
        });
    }


    async notifyTransactionApproved(userId, transactionId, transactionData = null) {
        await this.createNotification('TRANSACTION_APPROVED', userId, {
            transactionId,
            userId
        });

        // For transfer transactions, also notify the other party
        if (transactionData && transactionData.txType === 'TRANSFER' && transactionData.toOwnerId) {
            await this.createNotification('TRANSACTION_APPROVED', transactionData.toOwnerId, {
                transactionId,
                userId: transactionData.toOwnerId
            });
        }
    }

    async notifyTransactionRejected(userId, transactionId) {
        await this.createNotification('TRANSACTION_REJECTED', userId, {
            transactionId,
            userId
        });
    }

    // === DOCUMENT NOTIFICATIONS ===
    async notifyDocumentCreated(userId, documentId) {
        await this.createNotification('DOCUMENT_CREATED', userId, {
            documentId,
            userId
        });
    }

    // Special method for document verification - notify uploader
    async notifyDocumentVerification(uploaderId, documentId, verified = true) {
        const type = verified ? 'DOCUMENT_VERIFIED' : 'DOCUMENT_REJECTED';
        await this.createNotification(type, uploaderId, {
            documentId,
            userId: uploaderId
        });
    }

    async notifyDocumentUpdated(userId, documentId) {
        await this.createNotification('DOCUMENT_UPDATED', userId, {
            documentId,
            userId
        });
    }

    async notifyDocumentVerified(userId, documentId) {
        await this.createNotification('DOCUMENT_VERIFIED', userId, {
            documentId,
            userId
        });
    }

    async notifyDocumentRejected(userId, documentId) {
        await this.createNotification('DOCUMENT_REJECTED', userId, {
            documentId,
            userId
        });
    }

    async notifyDocumentLinked(userId, documentId) {
        await this.createNotification('DOCUMENT_LINKED', userId, {
            documentId,
            userId
        });
    }

    async notifyDocumentDeleted(userId, documentId) {
        await this.createNotification('DOCUMENT_DELETED', userId, {
            documentId,
            userId
        });
    }

    // === LAND PARCEL NOTIFICATIONS ===
    async notifyLandParcelCreated(userId, landParcelId) {
        await this.createNotification('LAND_PARCEL_CREATED', userId, {
            landParcelId,
            userId
        });
    }

    async notifyLandParcelUpdated(userId, landParcelId) {
        await this.createNotification('LAND_PARCEL_UPDATED', userId, {
            landParcelId,
            userId
        });
    }

    async notifyLandCertificateIssued(ownerId, landParcelId, certificateId) {
        await this.createNotification('LAND_CERTIFICATE_ISSUED', ownerId, {
            landParcelId,
            certificateId,
            ownerId
        });
    }

    async notifyTransferConfirmed(fromOwnerId, toOwnerId, landParcelId) {
        // Notify seller
        await this.createNotification('TRANSFER_CONFIRMED', fromOwnerId, {
            landParcelId,
            role: 'seller',
            toOwnerId
        });
        
        // Notify buyer
        await this.createNotification('TRANSFER_CONFIRMED', toOwnerId, {
            landParcelId,
            role: 'buyer',
            fromOwnerId
        });
    }

    // === USER NOTIFICATIONS ===
    async notifyUserProfileUpdated(userId) {
        await this.createNotification('USER_PROFILE_UPDATED', userId, {
            userId
        });
    }

    async notifyPasswordChanged(userId) {
        await this.createNotification('PASSWORD_CHANGED', userId, {
            userId
        });
    }

    // Get user notifications
    async getUserNotifications(userId, limit = 20, status = null) {
        const query = { recipientId: userId };
        if (status) {
            query.status = status;
        }

        return Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .exec();
    }

    // Get unread count
    async getUnreadCount(userId) {
        return Notification.getUnreadCount(userId);
    }

    // Mark notification as read
    async markAsRead(notificationId, userId) {
        const notification = await Notification.findOne({
            _id: notificationId,
            recipientId: userId
        });

        if (notification) {
            return notification.markAsRead();
        }
        
        throw new Error('Notification not found');
    }

    // Mark all notifications as read
    async markAllAsRead(userId) {
        return Notification.markAllAsRead(userId);
    }

    // Archive notification
    async archiveNotification(notificationId, userId) {
        const notification = await Notification.findOne({
            _id: notificationId,
            recipientId: userId
        });

        if (notification) {
            return notification.archive();
        }
        
        throw new Error('Notification not found');
    }
}

// Export singleton instance
module.exports = new NotificationService(); 