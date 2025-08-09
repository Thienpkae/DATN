'use strict';
const { connectToNetwork } = require('./networkService');

const logService = {
    async searchLogs(req, res) {
        try {
            const { txID } = req.params;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);
            
            // Get transaction history which contains logs
            const result = await contract.evaluateTransaction(
                'GetTransactionHistory',
                txID,
                userID
            );

            const history = JSON.parse(result.toString());
            
            // Extract log information from transaction history
            const logs = history.map(entry => ({
                txId: entry.txId,
                timestamp: entry.timestamp,
                isDelete: entry.isDelete,
                transaction: entry.transaction
            }));

            res.json({
                success: true,
                data: logs
            });
        } catch (error) {
            console.error('Error searching logs:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tìm kiếm logs',
                error: error.message
            });
        }
    }
};

module.exports = logService; 