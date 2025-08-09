'use strict';
const { connectToNetwork } = require('./networkService');

const reportService = {
    async getSystemReport(req, res) {
        try {
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);
            
            const landResult = await contract.evaluateTransaction(
                'QueryByKeyword',
                'land',
                '',
                '{}',
                userID
            );

            const lands = JSON.parse(landResult.toString());
            
            const txResult = await contract.evaluateTransaction(
                'QueryByKeyword',
                'transaction',
                '',
                '{}',
                userID
            );

            const transactions = JSON.parse(txResult.toString());

            const report = {
                summary: {
                    totalLands: lands.length,
                    totalTransactions: transactions.length,
                    landsWithCertificates: lands.filter(land => land.certificateId && land.certificateId !== '').length,
                    verifiedDocuments: lands.filter(land => land.documentsVerified).length,
                    pendingTransactions: transactions.filter(tx => tx.status === 'PENDING').length,
                    approvedTransactions: transactions.filter(tx => tx.status === 'APPROVED').length,
                    totalArea: lands.reduce((sum, land) => sum + (land.area || 0), 0)
                },
                generatedAt: new Date().toISOString()
            };

            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            console.error('Error getting system report:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tạo báo cáo hệ thống',
                error: error.message
            });
        }
    },

    async getAnalytics(req, res) {
        try {
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);
            
            const landResult = await contract.evaluateTransaction(
                'QueryByKeyword',
                'land',
                '',
                '{}',
                userID
            );

            const lands = JSON.parse(landResult.toString());
            
            const txResult = await contract.evaluateTransaction(
                'QueryByKeyword',
                'transaction',
                '',
                '{}',
                userID
            );

            const transactions = JSON.parse(txResult.toString());

            const analytics = {
                totalLands: lands.length,
                totalTransactions: transactions.length,
                landsWithCertificates: lands.filter(land => land.certificateId && land.certificateId !== '').length,
                verifiedDocuments: lands.filter(land => land.documentsVerified).length,
                totalArea: lands.reduce((sum, land) => sum + (land.area || 0), 0),
                transactionStatus: transactions.reduce((acc, tx) => {
                    const status = tx.status || 'Không xác định';
                    acc[status] = (acc[status] || 0) + 1;
                    return acc;
                }, {}),
                landUsePurpose: lands.reduce((acc, land) => {
                    const purpose = land.landUsePurpose || 'Không xác định';
                    acc[purpose] = (acc[purpose] || 0) + 1;
                    return acc;
                }, {})
            };

            res.json({
                success: true,
                data: analytics
            });
        } catch (error) {
            console.error('Error getting analytics:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy dữ liệu phân tích',
                error: error.message
            });
        }
    },

    async exportData(req, res) {
        try {
            const { dataType } = req.params;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);
            
            let data = {};
            let filename = '';

            switch (dataType) {
                case 'lands':
                    const landResult = await contract.evaluateTransaction(
                        'QueryByKeyword',
                        'land',
                        '',
                        '{}',
                        userID
                    );
                    data = JSON.parse(landResult.toString());
                    filename = `lands_export_${new Date().toISOString().split('T')[0]}.json`;
                    break;

                case 'transactions':
                    const txResult = await contract.evaluateTransaction(
                        'QueryByKeyword',
                        'transaction',
                        '',
                        '{}',
                        userID
                    );
                    data = JSON.parse(txResult.toString());
                    filename = `transactions_export_${new Date().toISOString().split('T')[0]}.json`;
                    break;

                default:
                    return res.status(400).json({
                        success: false,
                        message: 'Loại dữ liệu không được hỗ trợ'
                    });
            }

            res.json({
                success: true,
                data: data,
                filename: filename
            });
        } catch (error) {
            console.error('Error exporting data:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi xuất dữ liệu',
                error: error.message
            });
        }
    }
};

module.exports = reportService; 