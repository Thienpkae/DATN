'use strict';
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const {
    authenticateJWT,
    requireAdmin,
    checkOrg,
    register,
    resendOTP,
    verifyOTP,
    login,
    logout,
    changeUserPassword,
    forgotUserPassword,
    resetUserPassword,
    lockUnlockUserAccount,
    deleteUserAccount
} = require('./services/authService');
const landService = require('./services/landService');
const documentService = require('./services/documentService');
const transactionService = require('./services/transactionService');
const reportService = require('./services/reportService');
const userService = require('./services/userService');
const dashboardService = require('./services/dashboardService');
const logService = require('./services/logService');
const systemService = require('./services/systemService');
const { initializeAdminAccounts, initializeUserAccounts } = require('./services/initializationService');
const notificationRoutes = require('./routes/notificationRoutes');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Authentication Routes
app.post('/api/auth/register', register);
app.post('/api/auth/resend-otp', resendOTP);
app.post('/api/auth/verify-otp', verifyOTP);
app.post('/api/auth/login', login);
app.post('/api/auth/logout', authenticateJWT, logout);
app.post('/api/auth/change-password', authenticateJWT, changeUserPassword);
app.post('/api/auth/forgot-password', forgotUserPassword);
app.post('/api/auth/reset-password', resetUserPassword);
app.post('/api/auth/lock-unlock', authenticateJWT, requireAdmin, lockUnlockUserAccount);
app.post('/api/auth/delete', authenticateJWT, requireAdmin, deleteUserAccount);

// User Routes (Account Management - Require Admin)
app.get('/api/users', authenticateJWT, requireAdmin, userService.getUsers);
app.get('/api/users/:cccd', authenticateJWT, requireAdmin, userService.getUserByCCCD);
app.put('/api/users/:cccd', authenticateJWT, requireAdmin, userService.updateUser);

// User Routes (Profile Management - No Admin Required)
app.get('/api/users/profile', authenticateJWT, userService.getProfile);
app.put('/api/users/profile', authenticateJWT, userService.updateProfile);

// Land Parcel Routes
app.post('/api/land-parcels', authenticateJWT, checkOrg(['Org1']), landService.createLandParcel);
app.put('/api/land-parcels/:id', authenticateJWT, checkOrg(['Org1']), landService.updateLandParcel);
app.post('/api/land-parcels/issue-certificate', authenticateJWT, checkOrg(['Org1']), landService.issueLandCertificate);
app.get('/api/land-parcels/search', authenticateJWT, landService.searchLandParcels);
app.get('/api/land-parcels/owner/:ownerID', authenticateJWT, landService.getLandParcelsByOwner);
app.get('/api/land-parcels', authenticateJWT, checkOrg(['Org1', 'Org2']), landService.getAllLandParcels);
app.get('/api/land-parcels/:id', authenticateJWT, landService.getLandParcel);
app.get('/api/land-parcels/:id/history', authenticateJWT, landService.getLandParcelHistory);

// Document Routes
app.post('/api/documents', authenticateJWT, documentService.createDocument);
app.post('/api/documents/land', authenticateJWT, documentService.linkDocumentToLand);
app.post('/api/documents/transaction', authenticateJWT, documentService.linkDocumentToTransaction);
app.get('/api/documents/search', authenticateJWT, documentService.searchDocuments);
app.get('/api/documents/status/:status', authenticateJWT, documentService.getDocumentsByStatus);
app.get('/api/documents/type/:docType', authenticateJWT, documentService.getDocumentsByType);
app.get('/api/documents/land-parcel/:landParcelID', authenticateJWT, documentService.getDocumentsByLandParcel);
app.get('/api/documents/transaction/:txID', authenticateJWT, documentService.getDocumentsByTransaction);
app.get('/api/documents/uploader/:uploaderID', authenticateJWT, documentService.getDocumentsByUploader);
app.get('/api/documents/history/:docID', authenticateJWT, documentService.getDocumentHistory);
app.get('/api/documents', authenticateJWT, checkOrg(['Org1', 'Org2']), documentService.getAllDocuments);
app.get('/api/documents/:docID', authenticateJWT, documentService.getDocument);
app.put('/api/documents/:docID', authenticateJWT, documentService.updateDocument);
app.delete('/api/documents/:docID', authenticateJWT, documentService.deleteDocument);
app.post('/api/documents/:docID/verify', authenticateJWT, checkOrg(['Org2']), documentService.verifyDocument);
app.post('/api/documents/:docID/reject', authenticateJWT, checkOrg(['Org2']), documentService.rejectDocument);
app.get('/api/documents/:docID/analyze', authenticateJWT, checkOrg(['Org1', 'Org2']), documentService.analyzeDocument);

// Transaction Routes
app.post('/api/transactions/:txID/process', authenticateJWT, checkOrg(['Org2']), transactionService.processTransaction);
app.post('/api/transactions/transfer', authenticateJWT, checkOrg(['Org3']), transactionService.createTransferRequest);
app.post('/api/transactions/confirm', authenticateJWT, checkOrg(['Org3']), transactionService.confirmTransfer);
app.post('/api/transactions/split', authenticateJWT, checkOrg(['Org3']), transactionService.createSplitRequest);
app.post('/api/transactions/merge', authenticateJWT, checkOrg(['Org3']), transactionService.createMergeRequest);
app.post('/api/transactions/change-purpose', authenticateJWT, checkOrg(['Org3']), transactionService.createChangePurposeRequest);
app.post('/api/transactions/reissue', authenticateJWT, checkOrg(['Org3']), transactionService.createReissueRequest);
app.post('/api/transactions/:txID/forward', authenticateJWT, checkOrg(['Org2']), transactionService.forwardTransaction);
app.post('/api/transactions/:txID/approve/transfer', authenticateJWT, checkOrg(['Org1']), transactionService.approveTransferTransaction);
app.post('/api/transactions/:txID/approve/split', authenticateJWT, checkOrg(['Org1']), transactionService.approveSplitTransaction);
app.post('/api/transactions/:txID/approve/merge', authenticateJWT, checkOrg(['Org1']), transactionService.approveMergeTransaction);
app.post('/api/transactions/:txID/approve/change-purpose', authenticateJWT, checkOrg(['Org1']), transactionService.approveChangePurposeTransaction);
app.post('/api/transactions/:txID/approve/reissue', authenticateJWT, checkOrg(['Org1']), transactionService.approveReissueTransaction);
app.post('/api/transactions/:txID/reject', authenticateJWT, checkOrg(['Org1']), transactionService.rejectTransaction);
app.get('/api/transactions/search', authenticateJWT, transactionService.searchTransactions);
app.get('/api/transactions/status/:status', authenticateJWT, checkOrg(['Org1', 'Org2']), transactionService.getTransactionsByStatus);
app.get('/api/transactions/land-parcel/:landParcelID', authenticateJWT, transactionService.getTransactionsByLandParcel);
app.get('/api/transactions/owner/:ownerID', authenticateJWT, transactionService.getTransactionsByOwner);
app.get('/api/transactions/:txID/history', authenticateJWT, transactionService.getTransactionHistory);
app.get('/api/transactions', authenticateJWT, checkOrg(['Org1', 'Org2']), transactionService.getAllTransactions);
app.get('/api/transactions/:txID', authenticateJWT, transactionService.getTransaction);

// Report Routes
app.get('/api/reports/system', authenticateJWT, checkOrg(['Org1', 'Org2']), reportService.getSystemReport);
app.get('/api/reports/analytics', authenticateJWT, checkOrg(['Org1', 'Org2']), reportService.getAnalytics);
app.get('/api/reports/export/:dataType', authenticateJWT, checkOrg(['Org1', 'Org2']), reportService.exportData);

// Dashboard Route
app.get('/api/dashboard', authenticateJWT, dashboardService.getDashboardStats);

// Log Route
app.get('/api/logs/:txID', authenticateJWT, checkOrg(['Org1', 'Org2']), logService.searchLogs);

// System Configuration Routes (UC-67)
app.get('/api/system/configs', authenticateJWT, systemService.getSystemConfigs);
app.get('/api/system/configs/categories', authenticateJWT, systemService.getConfigCategories);
app.get('/api/system/configs/:key', authenticateJWT, systemService.getSystemConfig);
app.put('/api/system/configs/:key', authenticateJWT, requireAdmin, systemService.updateSystemConfig);
app.delete('/api/system/configs/:key', authenticateJWT, requireAdmin, systemService.deleteSystemConfig);
app.post('/api/system/configs/:key/reset', authenticateJWT, requireAdmin, systemService.resetToDefault);
app.post('/api/system/configs/initialize', authenticateJWT, requireAdmin, systemService.initializeDefaultConfigs);

// Notification Routes
app.use('/api/notifications', notificationRoutes);



// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    console.error('Request URL:', req.url);
    res.status(500).json({ error: 'Đã xảy ra lỗi hệ thống' });
    next(); // Call next to continue error handling chain
});

// Start Server
async function startServer() {
    try {
        // Initialize admin accounts
        await initializeAdminAccounts();

        // Initialize user accounts
        await initializeUserAccounts();

        // Start the server
        const server = app.listen(port, () => {
            console.log(`🚀 Server is running on port ${port}`);
            console.log(`📅 Server started at: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`);
            console.log('\n🔑 Default Admin Accounts:');
            console.log('   Org1 Admin - CCCD: 000000000001, Password: Admin123!');
            console.log('   Org2 Admin - CCCD: 000000000002, Password: Admin123!');
            console.log('   Org3 Admin - CCCD: 000000000003, Password: Admin123!');
            console.log('\n👥 Land Registry User Accounts:');
            console.log('   Default Password: User123!');
            console.log('   UBND xã users → Org2');
            console.log('   Other users → Org3');
        });

    } catch (error) {
        console.error(`❌ Failed to start server: ${error.message}`);
        process.exit(1);
    }
}

startServer();