const WebSocket = require('ws');
const url = require('url');
const jwt = require('jsonwebtoken');
const notificationService = require('../services/notificationService');

class NotificationWebSocketServer {
    constructor(server) {
        this.wss = new WebSocket.Server({
            server,
            path: '/ws/notifications'
        });

        this.setupWebSocketServer();
    }

    setupWebSocketServer() {
        this.wss.on('connection', (ws, request) => {
            this.handleConnection(ws, request);
        });

        console.log('🔔 Notification WebSocket server initialized');
    }

    async handleConnection(ws, request) {
        try {
            // Parse URL to get token
            const parsedUrl = url.parse(request.url, true);
            const token = parsedUrl.query.token;

            if (!token) {
                ws.close(1008, 'Token required');
                return;
            }

            // Verify JWT token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded.cccd;

            // Register client with notification service
            notificationService.registerClient(userId, ws);

            // Send connection confirmation
            ws.send(JSON.stringify({
                type: 'CONNECTION_ESTABLISHED',
                message: 'Successfully connected to notification service',
                timestamp: new Date().toISOString()
            }));

            // Handle client messages
            ws.on('message', (data) => {
                this.handleMessage(ws, userId, data);
            });

            // Handle disconnection
            ws.on('close', () => {
                notificationService.unregisterClient(userId);
                console.log(`📱 User ${userId} disconnected from notifications`);
            });

            // Handle errors
            ws.on('error', (error) => {
                console.error(`❌ WebSocket error for user ${userId}:`, error);
                notificationService.unregisterClient(userId);
            });

            // Send recent notifications
            await this.sendRecentNotifications(ws, userId);

        } catch (error) {
            console.error('❌ WebSocket connection error:', error);
            ws.close(1008, 'Authentication failed');
        }
    }

    async handleMessage(ws, userId, data) {
        try {
            const message = JSON.parse(data);

            switch (message.type) {
                case 'PING':
                    ws.send(JSON.stringify({
                        type: 'PONG',
                        timestamp: new Date().toISOString()
                    }));
                    break;

                case 'MARK_AS_READ':
                    if (message.notificationId) {
                        await notificationService.markAsRead(message.notificationId, userId);
                        ws.send(JSON.stringify({
                            type: 'NOTIFICATION_MARKED_READ',
                            notificationId: message.notificationId
                        }));
                    }
                    break;

                case 'GET_UNREAD_COUNT':
                    const count = await notificationService.getUnreadCount(userId);
                    ws.send(JSON.stringify({
                        type: 'UNREAD_COUNT',
                        count
                    }));
                    break;

                default:
                    ws.send(JSON.stringify({
                        type: 'ERROR',
                        message: 'Unknown message type'
                    }));
            }

        } catch (error) {
            console.error('❌ Error handling WebSocket message:', error);
            ws.send(JSON.stringify({
                type: 'ERROR',
                message: 'Invalid message format'
            }));
        }
    }

    async sendRecentNotifications(ws, userId) {
        try {
            const notifications = await notificationService.getUserNotifications(userId, 5);
            const unreadCount = await notificationService.getUnreadCount(userId);

            ws.send(JSON.stringify({
                type: 'RECENT_NOTIFICATIONS',
                data: {
                    notifications,
                    unreadCount
                }
            }));

        } catch (error) {
            console.error('❌ Error sending recent notifications:', error);
        }
    }

    // Broadcast to all connected clients (admin only)
    async broadcastToAll(notification) {
        const message = JSON.stringify({
            type: 'BROADCAST_NOTIFICATION',
            data: notification
        });

        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    // Get connection stats
    getStats() {
        return {
            totalConnections: this.wss.clients.size,
            activeConnections: Array.from(this.wss.clients).filter(
                client => client.readyState === WebSocket.OPEN
            ).length
        };
    }
}

module.exports = NotificationWebSocketServer; 