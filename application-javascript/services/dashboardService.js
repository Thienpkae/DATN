'use strict';
const { connectToNetwork } = require('./networkService');

const dashboardService = {
    async getDashboardStats(req, res) {
        try {
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);
            
            // Get all land parcels
            const landResult = await contract.evaluateTransaction(
                'QueryByKeyword',
                'land',
                '',
                '{}',
                userID
            );

            const lands = JSON.parse(landResult.toString());
            
            // Get all transactions
            const txResult = await contract.evaluateTransaction(
                'QueryByKeyword',
                'transaction',
                '',
                '{}',
                userID
            );

            const transactions = JSON.parse(txResult.toString());

            // Calculate dashboard statistics
            const stats = {
                totalLands: lands.length,
                totalTransactions: transactions.length,
                landsWithCertificates: lands.filter(land => land.certificateId && land.certificateId !== '').length,
                verifiedDocuments: lands.filter(land => land.documentsVerified).length,
                pendingTransactions: transactions.filter(tx => tx.status === 'PENDING').length,
                approvedTransactions: transactions.filter(tx => tx.status === 'APPROVED').length,
                totalArea: lands.reduce((sum, land) => sum + (land.area || 0), 0)
            };

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Error getting dashboard stats:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy thống kê dashboard',
                error: error.message
            });
        }
    }
};

module.exports = dashboardService; 