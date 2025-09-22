'use strict';
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const zlib = require('zlib');
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
    verifyOTPForForgotPassword,
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
const mapService = require('./services/mapService');
const { initializeAdminAccounts, initializeUserAccounts } = require('./services/initializationService');
const notificationRoutes = require('./routes/notificationRoutes');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve full GeoGIS frontend (HTML/CSS/JS) and its data
const geogisRootDir = path.resolve(__dirname, '../geogis-frontend');
const geogisDataDir = path.resolve(__dirname, '../geogis-frontend/data');
app.use('/geogis', express.static(geogisRootDir));
app.use('/static/geogis', express.static(geogisDataDir));

// Org1 on-chain cadastral map (HTML)
app.get('/org1/cadastral-map', authenticateJWT, checkOrg(['Org1']), (req, res) => {
    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Org1 - Bản đồ địa chính (On-chain)</title>
  <link href="https://unpkg.com/maplibre-gl@3.6.1/dist/maplibre-gl.css" rel="stylesheet" />
  <style>
    html, body, #map { height: 100%; margin: 0; }
    .popup { font: 12px/1.4 sans-serif; }
  </style>
  <script src="https://unpkg.com/maplibre-gl@3.6.1/dist/maplibre-gl.js"></script>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = new maplibregl.Map({
      container: 'map',
      style: {
        version: 8,
        sources: {
          parcels: {
            type: 'geojson',
            data: '${req.protocol}://${req.get('host')}/api/org1/map/geojson'
          }
        },
        layers: [
          { id: 'parcels-fill', type: 'fill', source: 'parcels', paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.25 } },
          { id: 'parcels-line', type: 'line', source: 'parcels', paint: { 'line-color': '#1d4ed8', 'line-width': 0.8 } }
        ]
      },
      center: [105.8, 21.0],
      zoom: 8
    });
    const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false });
    map.on('mousemove', 'parcels-fill', (e) => {
      const f = e.features && e.features[0];
      if (!f) return;
      const p = f.properties || {};
      const html = '<div class="popup">' +
        '<b>Thửa:</b> ' + (p.id || '') + '<br/>' +
        '<b>DC:</b> ' + (p.dc || '') + '<br/>' +
        '<b>Diện tích:</b> ' + (p.area || '') + '<br/>' +
        '<b>Mục đích:</b> ' + (p.usePurpose || '') +
      '</div>';
      popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
    });
    map.on('mouseleave', 'parcels-fill', () => popup.remove());
  </script>
  </body>
  </html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
});

// Org1 on-chain GeoJSON endpoint (gzipped)
app.get('/api/org1/map/geojson', authenticateJWT, checkOrg(['Org1']), mapService.getOrg1CadastralGeoJSON);

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
app.post('/api/auth/verify-otp-forgot-password', verifyOTPForForgotPassword);
app.post('/api/auth/reset-password', resetUserPassword);
app.post('/api/auth/lock-unlock', authenticateJWT, requireAdmin, lockUnlockUserAccount);
app.post('/api/auth/delete', authenticateJWT, requireAdmin, deleteUserAccount);

// User Routes (Profile Management - No Admin Required) - Must come before parameterized routes
app.get('/api/users/profile', authenticateJWT, userService.getProfile);
app.put('/api/users/profile', authenticateJWT, userService.updateProfile);
app.post('/api/users/request-phone-verification', authenticateJWT, userService.requestPhoneVerification);
app.post('/api/users/verify-phone-change', authenticateJWT, userService.verifyPhoneChange);
app.get('/api/users/current', authenticateJWT, userService.getCurrentUser);
app.get('/api/users/self/:cccd', authenticateJWT, userService.getSelfByCccd);

// User Routes (Account Management - Require Admin)
app.get('/api/users', authenticateJWT, requireAdmin, userService.getUsers);
app.get('/api/users/:cccd', authenticateJWT, requireAdmin, userService.getUserByCCCD);
app.put('/api/users/:cccd', authenticateJWT, requireAdmin, userService.updateUser);

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
app.get('/api/documents/:docID/analyze', authenticateJWT, checkOrg(['Org1', 'Org2']), documentService.analyzeDocument);
app.get('/api/documents/:docID', authenticateJWT, documentService.getDocument);
app.put('/api/documents/:docID', authenticateJWT, documentService.updateDocument);
app.delete('/api/documents/:docID', authenticateJWT, documentService.deleteDocument);
app.post('/api/documents/:docID/verify', authenticateJWT, checkOrg(['Org2']), documentService.verifyDocument);
app.post('/api/documents/:docID/reject', authenticateJWT, checkOrg(['Org2']), documentService.rejectDocument);

// Transaction Routes
app.post('/api/transactions/:txID/process', authenticateJWT, checkOrg(['Org2']), transactionService.processTransaction);
app.post('/api/transactions/transfer', authenticateJWT, checkOrg(['Org3']), transactionService.createTransferRequest);
app.post('/api/transactions/confirm', authenticateJWT, checkOrg(['Org3']), transactionService.confirmTransfer);
app.post('/api/transactions/split', authenticateJWT, checkOrg(['Org3']), transactionService.createSplitRequest);
app.post('/api/transactions/merge', authenticateJWT, checkOrg(['Org3']), transactionService.createMergeRequest);
app.post('/api/transactions/change-purpose', authenticateJWT, checkOrg(['Org3']), transactionService.createChangePurposeRequest);
app.post('/api/transactions/reissue', authenticateJWT, checkOrg(['Org3']), transactionService.createReissueRequest);
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