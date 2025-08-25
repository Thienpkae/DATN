'use strict';
const { connectToNetwork } = require('./networkService');
const notificationService = require('./notificationService');

// Transaction Service - Handles all transaction operations
const transactionService = {
    // Process a transaction
    async processTransaction(req, res) {
        try {
            const { txID } = req.params;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            await contract.submitTransaction(
                'ProcessTransaction',
                txID
            );

            // Get the updated transaction to return as response data
            const transactionResult = await contract.evaluateTransaction(
                'QueryTransactionByID',
                txID,
                userID
            );

            res.json({
                success: true,
                message: 'Giao dịch đã được xử lý thành công',
                data: JSON.parse(transactionResult.toString())
            });
        } catch (error) {
            console.error('Error processing transaction:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi xử lý giao dịch',
                error: error.message
            });
        }
    },

    // Create transfer request
    async createTransferRequest(req, res) {
        try {
            const { txID, landParcelId, fromOwnerId, toOwnerId } = req.body;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            await contract.submitTransaction(
                'CreateTransferRequest',
                txID,
                landParcelId,
                fromOwnerId,
                toOwnerId
            );

            // Get the created transaction to return as response data
            const transactionResult = await contract.evaluateTransaction(
                'QueryTransactionByID',
                txID,
                userID
            );

            // Send notifications to both parties
            await notificationService.notifyTransferRequest(
                fromOwnerId,  // Person creating the request
                toOwnerId,    // Person receiving the request
                txID, 
                landParcelId
            );

            res.json({
                success: true,
                message: 'Yêu cầu chuyển nhượng đã được tạo thành công và thông báo đã được gửi',
                data: JSON.parse(transactionResult.toString())
            });
        } catch (error) {
            console.error('Error creating transfer request:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tạo yêu cầu chuyển nhượng',
                error: error.message
            });
        }
    },

    // Confirm transfer (by recipient)
    async confirmTransfer(req, res) {
        try {
            const { txID, landParcelID, toOwnerID } = req.body;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            await contract.submitTransaction(
                'ConfirmTransfer',
                txID,
                landParcelID,
                toOwnerID
            );

            // Get the updated transaction to return as response data
            const transactionResult = await contract.evaluateTransaction(
                'QueryTransactionByID',
                txID,
                userID
            );

            // Send notification to both parties
            try {
                const tx = JSON.parse(transactionResult.toString());
                await notificationService.notifyTransferConfirmed(tx.FromOwnerID, tx.ToOwnerID, landParcelID);
            } catch (notificationError) {
                console.error('Notification error:', notificationError);
            }

            res.json({
                success: true,
                message: 'Chuyển nhượng đã được xác nhận thành công và thông báo đã được gửi',
                data: JSON.parse(transactionResult.toString())
            });
        } catch (error) {
            console.error('Error confirming transfer:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi xác nhận chuyển nhượng',
                error: error.message
            });
        }
    },

    // Create split request
    async createSplitRequest(req, res) {
        try {
            const { txID, landParcelID, ownerID, newParcels } = req.body;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            const newParcelsStr = JSON.stringify(newParcels);
            await contract.submitTransaction(
                'CreateSplitRequest',
                txID,
                landParcelID,
                ownerID,
                newParcelsStr
            );

            // Get the created transaction to return as response data
            const transactionResult = await contract.evaluateTransaction(
                'QueryTransactionByID',
                txID,
                userID
            );

            res.json({
                success: true,
                message: 'Yêu cầu tách thửa đã được tạo thành công',
                data: JSON.parse(transactionResult.toString())
            });
        } catch (error) {
            console.error('Error creating split request:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tạo yêu cầu tách thửa',
                error: error.message
            });
        }
    },

    // Create merge request
    async createMergeRequest(req, res) {
        try {
            const { txID, ownerID, parcelIDs, newParcel } = req.body;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            const parcelIDsStr = JSON.stringify(parcelIDs);
            const newParcelStr = JSON.stringify(newParcel);
            await contract.submitTransaction(
                'CreateMergeRequest',
                txID,
                ownerID,
                parcelIDsStr,
                newParcelStr
            );

            // Get the created transaction to return as response data
            const transactionResult = await contract.evaluateTransaction(
                'QueryTransactionByID',
                txID,
                userID
            );

            res.json({
                success: true,
                message: 'Yêu cầu hợp thửa đã được tạo thành công',
                data: JSON.parse(transactionResult.toString())
            });
        } catch (error) {
            console.error('Error creating merge request:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tạo yêu cầu hợp thửa',
                error: error.message
            });
        }
    },

    // Create change purpose request
    async createChangePurposeRequest(req, res) {
        try {
            const { txID, landParcelID, ownerID, newPurpose } = req.body;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            await contract.submitTransaction(
                'CreateChangePurposeRequest',
                txID,
                landParcelID,
                ownerID,
                newPurpose
            );

            // Get the created transaction to return as response data
            const transactionResult = await contract.evaluateTransaction(
                'QueryTransactionByID',
                txID,
                userID
            );

            res.json({
                success: true,
                message: 'Yêu cầu thay đổi mục đích sử dụng đã được tạo thành công',
                data: JSON.parse(transactionResult.toString())
            });
        } catch (error) {
            console.error('Error creating change purpose request:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tạo yêu cầu thay đổi mục đích sử dụng',
                error: error.message
            });
        }
    },

    // Create reissue request
    async createReissueRequest(req, res) {
        try {
            const { txID, landParcelID, ownerID } = req.body;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            await contract.submitTransaction(
                'CreateReissueRequest',
                txID,
                landParcelID,
                ownerID
            );

            // Get the created transaction to return as response data
            const transactionResult = await contract.evaluateTransaction(
                'QueryTransactionByID',
                txID,
                userID
            );

            res.json({
                success: true,
                message: 'Yêu cầu cấp lại GCN đã được tạo thành công',
                data: JSON.parse(transactionResult.toString())
            });
        } catch (error) {
            console.error('Error creating reissue request:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tạo yêu cầu cấp lại GCN',
                error: error.message
            });
        }
    },

    // Forward transaction
    async forwardTransaction(req, res) {
        try {
            const { txID } = req.params;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            await contract.submitTransaction(
                'ForwardTransaction',
                txID
            );

            // Get the updated transaction to return as response data
            const transactionResult = await contract.evaluateTransaction(
                'QueryTransactionByID',
                txID,
                userID
            );

            res.json({
                success: true,
                message: 'Giao dịch đã được chuyển tiếp thành công',
                data: JSON.parse(transactionResult.toString())
            });
        } catch (error) {
            console.error('Error forwarding transaction:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi chuyển tiếp giao dịch',
                error: error.message
            });
        }
    },

    // Approve transfer transaction
    async approveTransferTransaction(req, res) {
        try {
            const { txID } = req.params;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            await contract.submitTransaction(
                'ApproveTransferTransaction',
                txID
            );

            // Get the updated transaction to return as response data
            const transactionResult = await contract.evaluateTransaction(
                'QueryTransactionByID',
                txID,
                userID
            );

            res.json({
                success: true,
                message: 'Giao dịch chuyển nhượng đã được phê duyệt thành công',
                data: JSON.parse(transactionResult.toString())
            });
        } catch (error) {
            console.error('Error approving transfer transaction:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi phê duyệt giao dịch chuyển nhượng',
                error: error.message
            });
        }
    },

    // Approve general transaction
    async approveTransaction(req, res) {
        try {
            const { txID } = req.params;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            await contract.submitTransaction(
                'ApproveTransaction',
                txID
            );

            // Get the updated transaction to return as response data
            const transactionResult = await contract.evaluateTransaction(
                'QueryTransactionByID',
                txID,
                userID
            );

            res.json({
                success: true,
                message: 'Giao dịch đã được phê duyệt thành công',
                data: JSON.parse(transactionResult.toString())
            });
        } catch (error) {
            console.error('Error approving transaction:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi phê duyệt giao dịch',
                error: error.message
            });
        }
    },

    async approveSplitTransaction(req, res) {
        try {
            const { txID } = req.params;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            await contract.submitTransaction(
                'ApproveSplitTransaction',
                txID
            );

            // Get the updated transaction to return as response data
            const transactionResult = await contract.evaluateTransaction(
                'QueryTransactionByID',
                txID,
                userID
            );

            res.json({
                success: true,
                message: 'Giao dịch tách thửa đã được phê duyệt thành công',
                data: JSON.parse(transactionResult.toString())
            });
        } catch (error) {
            console.error('Error approving split transaction:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi phê duyệt giao dịch tách thửa',
                error: error.message
            });
        }
    },

    async approveMergeTransaction(req, res) {
        try {
            const { txID } = req.params;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            await contract.submitTransaction(
                'ApproveMergeTransaction',
                txID
            );

            // Get the updated transaction to return as response data
            const transactionResult = await contract.evaluateTransaction(
                'QueryTransactionByID',
                txID,
                userID
            );

            res.json({
                success: true,
                message: 'Giao dịch hợp thửa đã được phê duyệt thành công',
                data: JSON.parse(transactionResult.toString())
            });
        } catch (error) {
            console.error('Error approving merge transaction:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi phê duyệt giao dịch hợp thửa',
                error: error.message
            });
        }
    },

    async approveChangePurposeTransaction(req, res) {
        try {
            const { txID } = req.params;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            await contract.submitTransaction(
                'ApproveChangePurposeTransaction',
                txID
            );

            // Get the updated transaction to return as response data
            const transactionResult = await contract.evaluateTransaction(
                'QueryTransactionByID',
                txID,
                userID
            );

            res.json({
                success: true,
                message: 'Giao dịch thay đổi mục đích sử dụng đã được phê duyệt thành công',
                data: JSON.parse(transactionResult.toString())
            });
        } catch (error) {
            console.error('Error approving change purpose transaction:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi phê duyệt giao dịch thay đổi mục đích sử dụng',
                error: error.message
            });
        }
    },

    async approveReissueTransaction(req, res) {
        try {
            const { txID } = req.params;
            const { newCertificateID } = req.body;
            const userID = req.user.cccd;
            const org = req.user.org;

            if (!newCertificateID) {
                return res.status(400).json({
                    success: false,
                    message: 'newCertificateID (IPFS hash) là bắt buộc'
                });
            }

            const { contract } = await connectToNetwork(org, userID);

            await contract.submitTransaction(
                'ApproveReissueTransaction',
                txID,
                newCertificateID
            );

            // Get the updated transaction to return as response data
            const transactionResult = await contract.evaluateTransaction(
                'QueryTransactionByID',
                txID,
                userID
            );

            res.json({
                success: true,
                message: 'Giao dịch cấp đổi giấy chứng nhận đã được phê duyệt thành công',
                data: JSON.parse(transactionResult.toString())
            });
        } catch (error) {
            console.error('Error approving reissue transaction:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi phê duyệt giao dịch cấp đổi giấy chứng nhận',
                error: error.message
            });
        }
    },

    // Reject transaction
    async rejectTransaction(req, res) {
        try {
            const { txID } = req.params;
            const { reason } = req.body;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            await contract.submitTransaction(
                'RejectTransaction',
                txID,
                reason
            );

            // Get the updated transaction to return as response data
            const transactionResult = await contract.evaluateTransaction(
                'QueryTransactionByID',
                txID,
                userID
            );

            res.json({
                success: true,
                message: 'Giao dịch đã được từ chối thành công',
                data: JSON.parse(transactionResult.toString())
            });
        } catch (error) {
            console.error('Error rejecting transaction:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi từ chối giao dịch',
                error: error.message
            });
        }
    },

    // Get a specific transaction by ID
    async getTransaction(req, res) {
        try {
            const { txID } = req.params;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);
            
            const result = await contract.evaluateTransaction(
                'QueryTransactionByID',
                txID,
                userID
            );

            const transaction = JSON.parse(result.toString());
            res.json({
                success: true,
                data: transaction
            });
        } catch (error) {
            console.error('Error getting transaction:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy thông tin giao dịch',
                error: error.message
            });
        }
    },

    // Search transactions by keyword
    async searchTransactions(req, res) {
        try {
            const { keyword, filters } = req.query;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            const filtersJSON = filters ? JSON.stringify(filters) : '{}';
            const result = await contract.evaluateTransaction(
                'QueryTransactionsByKeyword',
                keyword || '',
                filtersJSON,
                userID
            );

            const transactions = JSON.parse(result.toString());
            res.json({
                success: true,
                data: transactions
            });
        } catch (error) {
            console.error('Error searching transactions:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tìm kiếm giao dịch',
                error: error.message
            });
        }
    },

    // Get transactions by land parcel
    async getTransactionsByLandParcel(req, res) {
        try {
            const { landParcelID } = req.params;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            const result = await contract.evaluateTransaction(
                'QueryTransactionsByKeyword',
                '',
                JSON.stringify({ landParcelId: landParcelID }),
                userID
            );

            const transactions = JSON.parse(result.toString());
            res.json({
                success: true,
                data: transactions
            });
        } catch (error) {
            console.error('Error getting transactions by land parcel:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy giao dịch theo thửa đất',
                error: error.message
            });
        }
    },

    // Get transaction history
    async getTransactionHistory(req, res) {
        try {
            const { txID } = req.params;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);
            
            const result = await contract.evaluateTransaction(
                'GetTransactionHistory',
                txID,
                userID
            );

            const history = JSON.parse(result.toString());
            res.json({
                success: true,
                data: history
            });
        } catch (error) {
            console.error('Error getting transaction history:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy lịch sử giao dịch',
                error: error.message
            });
        }
    },

    // Get transactions by status (admin only)
    async getTransactionsByStatus(req, res) {
        try {
            const { status } = req.params;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            const result = await contract.evaluateTransaction(
                'QueryTransactionsByStatus',
                status,
                userID
            );

            const transactions = JSON.parse(result.toString());
            res.json({
                success: true,
                data: transactions
            });
        } catch (error) {
            console.error('Error getting transactions by status:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy giao dịch theo trạng thái',
                error: error.message
            });
        }
    },

    // Get transactions by owner
    async getTransactionsByOwner(req, res) {
        try {
            const { ownerID } = req.params;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            const result = await contract.evaluateTransaction(
                'QueryTransactionsByOwner',
                ownerID,
                userID
            );

            const transactions = JSON.parse(result.toString());
            res.json({
                success: true,
                data: transactions
            });
        } catch (error) {
            console.error('Error getting transactions by owner:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy giao dịch theo chủ sử dụng',
                error: error.message
            });
        }
    },

    // Get all transactions (admin only)
    async getAllTransactions(req, res) {
        try {
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            const result = await contract.evaluateTransaction(
                'QueryAllTransactions',
                userID
            );

            const transactions = JSON.parse(result.toString());
            res.json({
                success: true,
                data: transactions
            });
        } catch (error) {
            console.error('Error getting all transactions:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy tất cả giao dịch',
                error: error.message
            });
        }
    }
};

module.exports = transactionService; 