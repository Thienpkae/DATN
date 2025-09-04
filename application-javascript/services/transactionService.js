'use strict';
const { connectToNetwork } = require('./networkService');
const notificationService = require('./notificationService');

// Transaction Service - Handles all transaction operations
const transactionService = {
    // Process a transaction with 3 decision states (UC-31)
    async processTransaction(req, res) {
        try {
            const { txID } = req.params;
            const { decision, reason } = req.body;
            const userID = req.user.cccd;
            const org = req.user.org;

            // Validate decision
            if (!['APPROVE', 'SUPPLEMENT', 'REJECT'].includes(decision)) {
                return res.status(400).json({
                    success: false,
                    message: 'Quyết định không hợp lệ. Sử dụng: APPROVE, SUPPLEMENT, hoặc REJECT'
                });
            }

            // Validate reason for REJECT
            if (decision === 'REJECT' && !reason) {
                return res.status(400).json({
                    success: false,
                    message: 'Phải có lý do khi từ chối hồ sơ'
                });
            }

            const { contract } = await connectToNetwork(org, userID);

            await contract.submitTransaction(
                'ProcessTransaction',
                txID,
                decision,
                reason || ''
            );

            // Get the updated transaction to return as response data
            const transactionResult = await contract.evaluateTransaction(
                'QueryTransactionByID',
                txID
            );

            const actionMessage = {
                'APPROVE': 'Giao dịch đã được xác nhận đạt yêu cầu',
                'SUPPLEMENT': 'Đã yêu cầu bổ sung tài liệu cho giao dịch',
                'REJECT': 'Giao dịch đã bị từ chối'
            };

            res.json({
                success: true,
                message: actionMessage[decision],
                data: transactionResult ? JSON.parse(transactionResult.toString()) : { success: true }
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
            const { landParcelId, toOwnerId, documentIds, reason } = req.body;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            // Tạo giao dịch với documents - chaincode sẽ tự động tạo txID và link documents
            const documentIdsStr = documentIds && Array.isArray(documentIds) ? JSON.stringify(documentIds) : "[]";
            await contract.submitTransaction(
                'CreateTransferRequest',
                landParcelId,
                toOwnerId,
                documentIdsStr,
                reason || ''
            );

            // Tìm giao dịch vừa tạo
            let createdTransaction = null;
            try {
                const allTransactionsResult = await contract.evaluateTransaction(
                    'QueryTransactionsByOwner',
                    userID
                );
                if (allTransactionsResult) {
                    const allTransactions = JSON.parse(allTransactionsResult.toString());
                    
                    // Tìm transaction vừa tạo (có timestamp gần nhất và type TRANSFER)
                    createdTransaction = allTransactions
                        .filter(tx => tx.type === 'TRANSFER' && tx.landParcelId === landParcelId && tx.toOwnerId === toOwnerId)
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
                }
            } catch (queryError) {
                console.warn('Could not find created transaction:', queryError.message);
            }

            const actualTxID = createdTransaction ? createdTransaction.txId : null;

            // Get the final transaction data
            let transactionResult = null;
            if (actualTxID) {
                try {
                    const result = await contract.evaluateTransaction(
                        'QueryTransactionByID',
                        actualTxID
                    );
                    if (result) {
                        transactionResult = result;
                    }
                } catch (queryError) {
                    console.warn('Could not get transaction details:', queryError.message);
                }
            }

            // Send notifications to both parties
            if (actualTxID) {
                await notificationService.notifyTransferRequest(
                    userID,     // requester (fromOwner is caller)
                    toOwnerId,  // recipient
                    actualTxID, 
                    landParcelId
                );
            }

            res.json({
                success: true,
                message: `Yêu cầu chuyển nhượng đã được tạo thành công${documentIds?.length > 0 ? ` với ${documentIds.length} tài liệu đính kèm` : ''} và thông báo đã được gửi`,
                data: transactionResult ? JSON.parse(transactionResult.toString()) : { success: true, txID: actualTxID }
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

    // Confirm transfer (by recipient) - Accept or Reject
    async confirmTransfer(req, res) {
        try {
            const { txID, landParcelID, toOwnerID, isAccepted, reason } = req.body;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            await contract.submitTransaction(
                'ConfirmTransfer',
                txID,
                landParcelID,
                toOwnerID,
                isAccepted.toString(),
                reason || ''
            );

            // Get the updated transaction to return as response data
            const transactionResult = await contract.evaluateTransaction(
                'QueryTransactionByID',
                txID
            );

            // Send notification to both parties
            try {
                const tx = JSON.parse(transactionResult.toString());
                if (isAccepted) {
                    await notificationService.notifyTransferConfirmed(tx.FromOwnerID, tx.ToOwnerID, landParcelID);
                } else {
                    await notificationService.notifyTransferRejected(tx.FromOwnerID, tx.ToOwnerID, landParcelID, reason);
                }
            } catch (notificationError) {
                console.error('Notification error:', notificationError);
            }

            const actionText = isAccepted ? 'chấp nhận' : 'từ chối';
            res.json({
                success: true,
                message: `Giao dịch chuyển nhượng đã được ${actionText} thành công và thông báo đã được gửi`,
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

    // Create split request - theo luồng chaincode mới
    async createSplitRequest(req, res) {
        try {
            const { landParcelID, documentIds, reason } = req.body;
            const userID = req.user.cccd;
            const org = req.user.org;

            // Validate input
            if (!landParcelID) {
                return res.status(400).json({
                    success: false,
                    message: 'Mã thửa đất là bắt buộc'
                });
            }

            const { contract } = await connectToNetwork(org, userID);

            // Theo chaincode mới: CreateSplitRequest(landParcelID, documentIdsStr, reason)
            const documentIdsStr = documentIds && Array.isArray(documentIds) ? JSON.stringify(documentIds) : "[]";
            await contract.submitTransaction(
                'CreateSplitRequest',
                landParcelID,
                documentIdsStr,
                reason || ''
            );

            // Tìm giao dịch vừa tạo
            let createdTransaction = null;
            try {
                const allTransactionsResult = await contract.evaluateTransaction(
                    'QueryTransactionsByOwner',
                    userID
                );
                if (allTransactionsResult) {
                    const allTransactions = JSON.parse(allTransactionsResult.toString());
                    
                    createdTransaction = allTransactions
                        .filter(tx => tx.type === 'SPLIT' && tx.landParcelId === landParcelID)
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
                }
            } catch (queryError) {
                console.warn('Could not find created transaction:', queryError.message);
            }

            const actualTxID = createdTransaction ? createdTransaction.txId : null;

            // Get the final transaction data
            let transactionResult = null;
            if (actualTxID) {
                try {
                    const result = await contract.evaluateTransaction(
                        'QueryTransactionByID',
                        actualTxID
                    );
                    if (result) {
                        transactionResult = result;
                    }
                } catch (queryError) {
                    console.warn('Could not get transaction details:', queryError.message);
                }
            }

            res.json({
                success: true,
                message: `Yêu cầu tách thửa đã được tạo thành công${documentIds?.length > 0 ? ` với ${documentIds.length} tài liệu đính kèm` : ''}. Thửa đất sẽ được tách khi phê duyệt.`,
                data: transactionResult ? JSON.parse(transactionResult.toString()) : { success: true, txID: actualTxID }
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

    // Create merge request - theo luồng chaincode mới
    async createMergeRequest(req, res) {
        try {
            const { parcelIDs, documentIds, reason } = req.body;
            const userID = req.user.cccd;
            const org = req.user.org;

            // Validate input
            if (!parcelIDs || !Array.isArray(parcelIDs) || parcelIDs.length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'Cần ít nhất 2 thửa đất để thực hiện gộp thửa'
                });
            }

            const { contract } = await connectToNetwork(org, userID);

            // Theo chaincode mới: CreateMergeRequest(parcelIDsStr, documentIdsStr, reason)
            const parcelIDsStr = JSON.stringify(parcelIDs);
            const documentIdsStr = documentIds && Array.isArray(documentIds) ? JSON.stringify(documentIds) : "[]";
            await contract.submitTransaction(
                'CreateMergeRequest',
                parcelIDsStr,
                documentIdsStr,
                reason || ''
            );

            // Tìm giao dịch vừa tạo
            let createdTransaction = null;
            try {
                const allTransactionsResult = await contract.evaluateTransaction(
                    'QueryTransactionsByOwner',
                    userID
                );
                if (allTransactionsResult) {
                    const allTransactions = JSON.parse(allTransactionsResult.toString());
                    
                    createdTransaction = allTransactions
                        .filter(tx => tx.type === 'MERGE' && JSON.stringify(tx.parcelIds) === parcelIDsStr)
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
                }
            } catch (queryError) {
                console.warn('Could not find created transaction:', queryError.message);
            }

            const actualTxID = createdTransaction ? createdTransaction.txId : null;

            // Get the final transaction data
            let transactionResult = null;
            if (actualTxID) {
                try {
                    const result = await contract.evaluateTransaction(
                        'QueryTransactionByID',
                        actualTxID
                    );
                    if (result) {
                        transactionResult = result;
                    }
                } catch (queryError) {
                    console.warn('Could not get transaction details:', queryError.message);
                }
            }

            res.json({
                success: true,
                message: `Yêu cầu hợp thửa ${parcelIDs.length} thửa đất đã được tạo thành công${documentIds?.length > 0 ? ` với ${documentIds.length} tài liệu đính kèm` : ''}. Thửa đất sẽ được gộp khi phê duyệt.`,
                data: transactionResult ? JSON.parse(transactionResult.toString()) : { success: true, txID: actualTxID }
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
            const { landParcelID, newPurpose, documentIds, reason } = req.body;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            const documentIdsStr = documentIds && Array.isArray(documentIds) ? JSON.stringify(documentIds) : "[]";
            await contract.submitTransaction(
                'CreateChangePurposeRequest',
                landParcelID,
                newPurpose,
                documentIdsStr,
                reason || ''
            );

            // Tìm giao dịch vừa tạo
            let createdTransaction = null;
            try {
                const allTransactionsResult = await contract.evaluateTransaction(
                    'QueryTransactionsByOwner',
                    userID
                );
                if (allTransactionsResult) {
                    const allTransactions = JSON.parse(allTransactionsResult.toString());
                    
                    createdTransaction = allTransactions
                        .filter(tx => tx.type === 'CHANGE_PURPOSE' && tx.landParcelId === landParcelID)
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
                }
            } catch (queryError) {
                console.warn('Could not find created transaction:', queryError.message);
            }

            const actualTxID = createdTransaction ? createdTransaction.txId : null;

            // Get the created transaction to return as response data
            let transactionResult = null;
            if (actualTxID) {
                try {
                    const result = await contract.evaluateTransaction(
                        'QueryTransactionByID',
                        actualTxID
                    );
                    if (result) {
                        transactionResult = result;
                    }
                } catch (queryError) {
                    console.warn('Could not get transaction details:', queryError.message);
                }
            }

            res.json({
                success: true,
                message: `Yêu cầu thay đổi mục đích sử dụng đã được tạo thành công${documentIds?.length > 0 ? ` với ${documentIds.length} tài liệu đính kèm` : ''}`,
                data: transactionResult ? JSON.parse(transactionResult.toString()) : { success: true, txID: actualTxID }
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
            const { landParcelID, documentIds, reason } = req.body;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            const documentIdsStr = documentIds && Array.isArray(documentIds) ? JSON.stringify(documentIds) : "[]";
            await contract.submitTransaction(
                'CreateReissueRequest',
                landParcelID,
                documentIdsStr,
                reason || ''
            );

            // Tìm giao dịch vừa tạo
            let createdTransaction = null;
            try {
                const allTransactionsResult = await contract.evaluateTransaction(
                    'QueryTransactionsByOwner',
                    userID
                );
                if (allTransactionsResult) {
                    const allTransactions = JSON.parse(allTransactionsResult.toString());
                    
                    createdTransaction = allTransactions
                        .filter(tx => tx.type === 'REISSUE' && tx.landParcelId === landParcelID)
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
                }
            } catch (queryError) {
                console.warn('Could not find created transaction:', queryError.message);
            }

            const actualTxID = createdTransaction ? createdTransaction.txId : null;

            // Get the created transaction to return as response data
            let transactionResult = null;
            if (actualTxID) {
                try {
                    const result = await contract.evaluateTransaction(
                        'QueryTransactionByID',
                        actualTxID
                    );
                    if (result) {
                        transactionResult = result;
                    }
                } catch (queryError) {
                    console.warn('Could not get transaction details:', queryError.message);
                }
            }

            res.json({
                success: true,
                message: `Yêu cầu cấp lại GCN đã được tạo thành công${documentIds?.length > 0 ? ` với ${documentIds.length} tài liệu đính kèm` : ''}`,
                data: transactionResult ? JSON.parse(transactionResult.toString()) : { success: true, txID: actualTxID }
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
                txID
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
                txID
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

    // Phê duyệt tách thửa với thông tin thửa đất mới
    async approveSplitTransaction(req, res) {
        try {
            const { txID } = req.params;
            const { landID, newParcels } = req.body;
            const userID = req.user.cccd;
            const org = req.user.org;

            // Validate input
            if (!landID) {
                return res.status(400).json({
                    success: false,
                    message: 'Mã thửa đất gốc là bắt buộc'
                });
            }

            if (!newParcels || !Array.isArray(newParcels) || newParcels.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Danh sách thửa đất mới là bắt buộc'
                });
            }

            const { contract } = await connectToNetwork(org, userID);

            // Lấy thông tin giao dịch để biết chủ sở hữu gốc
            const originalTransactionResult = await contract.evaluateTransaction(
                'QueryTransactionByID',
                txID
            );
            const transaction = JSON.parse(originalTransactionResult.toString());
            
            // Lấy thông tin thửa đất gốc để kế thừa các thông tin cần thiết
            const originalLandResult = await contract.evaluateTransaction(
                'QueryLandByID',
                landID
            );
            const originalLand = JSON.parse(originalLandResult.toString());
            
            // Tách biệt thửa cập nhật (trùng ID gốc) và thửa tạo mới
            const updateParcels = [];
            const createParcels = [];
            
            newParcels.forEach(parcel => {
                const enrichedParcel = {
                    ...parcel,
                    OwnerID: transaction.fromOwnerId || transaction.FromOwnerID,
                    Location: originalLand.location,
                    LandUsePurpose: originalLand.landUsePurpose,
                    LegalStatus: ""
                };
                
                if (parcel.id === landID) {
                    // Thửa này sẽ được cập nhật (trùng ID gốc)
                    updateParcels.push(enrichedParcel);
                } else {
                    // Thửa này sẽ được tạo mới
                    createParcels.push(enrichedParcel);
                }
            });
            
            // Sắp xếp lại: thửa cập nhật trước, thửa tạo mới sau
            const newParcelsWithOwner = [...updateParcels, ...createParcels];
            
            console.log('📋 Transaction info:', transaction);
            console.log('🏠 Original land info:', originalLand);
            console.log('🎯 Land ID from request:', landID);
            console.log('📦 New parcels from request:', newParcels);
            console.log('🏠 New parcels with owner:', newParcelsWithOwner);

            // Theo chaincode: ApproveSplitTransaction(txID, landID, newParcelsStr)
            const newParcelsStr = JSON.stringify(newParcelsWithOwner);
            await contract.submitTransaction(
                'ApproveSplitTransaction',
                txID,
                landID,
                newParcelsStr
            );

            // Get the updated transaction to return as response data
            const updatedTransactionResult = await contract.evaluateTransaction(
                'QueryTransactionByID',
                txID
            );

            res.json({
                success: true,
                message: `Giao dịch tách thửa đã được phê duyệt thành công. Đã tạo/cập nhật ${newParcels.length} thửa đất mới.`,
                data: JSON.parse(updatedTransactionResult.toString())
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

    // Phê duyệt gộp thửa với thông tin thửa đất gộp
    async approveMergeTransaction(req, res) {
        try {
            const { txID } = req.params;
            const { landIds, selectedLandID, newParcel } = req.body;
            const userID = req.user.cccd;
            const org = req.user.org;

            // Validate input
            if (!landIds || !Array.isArray(landIds) || landIds.length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'Cần ít nhất 2 thửa đất để gộp'
                });
            }

            if (!selectedLandID) {
                return res.status(400).json({
                    success: false,
                    message: 'Mã thửa đất được chọn làm thửa chính là bắt buộc'
                });
            }

            if (!newParcel) {
                return res.status(400).json({
                    success: false,
                    message: 'Thông tin thửa đất sau gộp là bắt buộc'
                });
            }

            const { contract } = await connectToNetwork(org, userID);

            // Theo chaincode: ApproveMergeTransaction(txID, landIdsStr, selectedLandID, newParcelStr)
            const landIdsStr = JSON.stringify(landIds);
            const newParcelStr = JSON.stringify(newParcel);
            await contract.submitTransaction(
                'ApproveMergeTransaction',
                txID,
                landIdsStr,
                selectedLandID,
                newParcelStr
            );

            // Get the updated transaction to return as response data
            const transactionResult = await contract.evaluateTransaction(
                'QueryTransactionByID',
                txID
            );

            res.json({
                success: true,
                message: `Giao dịch gộp thửa đã được phê duyệt thành công. Đã gộp ${landIds.length} thửa đất thành thửa ${selectedLandID}.`,
                data: JSON.parse(transactionResult.toString())
            });
        } catch (error) {
            console.error('Error approving merge transaction:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi phê duyệt giao dịch gộp thửa',
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
                txID
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
                txID
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
                txID
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
                txID
            );

            if (result) {
                const transaction = JSON.parse(result.toString());
                res.json({
                    success: true,
                    data: transaction
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Giao dịch không tồn tại'
                });
            }
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
                filtersJSON
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
                JSON.stringify({ landParcelId: landParcelID })
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
                txID
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
                status
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
                ownerID
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
                'QueryAllTransactions'
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