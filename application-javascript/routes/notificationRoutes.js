const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const { authenticateJWT } = require('../services/authService');

// Notification Controller
const notificationController = {
    // Lấy danh sách thông báo của user
    async getUserNotifications(req, res) {
        try {
            const userId = req.user.cccd;
            const { limit = 20, status, page = 1 } = req.query;
            
            const skip = (page - 1) * limit;
            const notifications = await notificationService.getUserNotifications(
                userId, 
                parseInt(limit), 
                status
            );

            // Get total count for pagination
            const totalCount = await notificationService.getUnreadCount(userId);

            res.json({
                success: true,
                data: {
                    notifications,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: notifications.length,
                        unreadCount: totalCount
                    }
                }
            });

        } catch (error) {
            console.error('Error getting notifications:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy danh sách thông báo',
                error: error.message
            });
        }
    },

    // Lấy số lượng thông báo chưa đọc
    async getUnreadCount(req, res) {
        try {
            const userId = req.user.cccd;
            const count = await notificationService.getUnreadCount(userId);

            res.json({
                success: true,
                data: { unreadCount: count }
            });

        } catch (error) {
            console.error('Error getting unread count:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy số thông báo chưa đọc',
                error: error.message
            });
        }
    },

    // Đánh dấu thông báo đã đọc
    async markAsRead(req, res) {
        try {
            const userId = req.user.cccd;
            const { notificationId } = req.params;

            await notificationService.markAsRead(notificationId, userId);

            res.json({
                success: true,
                message: 'Thông báo đã được đánh dấu là đã đọc'
            });

        } catch (error) {
            console.error('Error marking notification as read:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi đánh dấu thông báo',
                error: error.message
            });
        }
    },

    // Đánh dấu tất cả thông báo đã đọc
    async markAllAsRead(req, res) {
        try {
            const userId = req.user.cccd;

            const result = await notificationService.markAllAsRead(userId);

            res.json({
                success: true,
                message: `${result.modifiedCount} thông báo đã được đánh dấu là đã đọc`
            });

        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi đánh dấu tất cả thông báo',
                error: error.message
            });
        }
    },

    // Archive thông báo
    async archiveNotification(req, res) {
        try {
            const userId = req.user.cccd;
            const { notificationId } = req.params;

            await notificationService.archiveNotification(notificationId, userId);

            res.json({
                success: true,
                message: 'Thông báo đã được lưu trữ'
            });

        } catch (error) {
            console.error('Error archiving notification:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lưu trữ thông báo',
                error: error.message
            });
        }
    },

    // Tạo thông báo test (chỉ cho development)
    async createTestNotification(req, res) {
        try {
            if (process.env.NODE_ENV === 'production') {
                return res.status(403).json({
                    success: false,
                    message: 'Test notifications not allowed in production'
                });
            }

            const userId = req.user.cccd;
            const { type, title, message } = req.body;

            await notificationService.createNotification(
                type || 'SYSTEM_ANNOUNCEMENT',
                userId,
                { customTitle: title, customMessage: message }
            );

            res.json({
                success: true,
                message: 'Test notification created'
            });

        } catch (error) {
            console.error('Error creating test notification:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tạo thông báo test',
                error: error.message
            });
        }
    }
};

// Routes
router.get('/', authenticateJWT, notificationController.getUserNotifications);
router.get('/unread-count', authenticateJWT, notificationController.getUnreadCount);
router.put('/:notificationId/read', authenticateJWT, notificationController.markAsRead);
router.put('/mark-all-read', authenticateJWT, notificationController.markAllAsRead);
router.put('/:notificationId/archive', authenticateJWT, notificationController.archiveNotification);

// Development only
if (process.env.NODE_ENV !== 'production') {
    router.post('/test', authenticateJWT, notificationController.createTestNotification);
}

module.exports = router; 