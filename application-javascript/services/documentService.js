'use strict';
const { connectToNetwork } = require('./networkService');
const pdfExtractionService = require('./pdfExtractionService');
const notificationService = require('./notificationService');

// Document Service - Handles all document operations
const documentService = {
    // Create document
    async createDocument(req, res) {
        try {
            const { docID, docType, title, description, ipfsHash, fileType, fileSize } = req.body;
            const userID = req.user.cccd;
            const org = req.user.org;

            // Validate IPFS hash
            if (!ipfsHash || ipfsHash.length < 10) {
                return res.status(400).json({
                    success: false,
                    message: 'IPFS hash phải hợp lệ'
                });
            }

            const { contract } = await connectToNetwork(org, userID);

            await contract.submitTransaction(
                'CreateDocument',
                docID,
                docType,
                title,
                description,
                ipfsHash,
                fileType,
                fileSize || 0
            );

            // Send notification to user
            try {
                await notificationService.notifyDocumentCreated(userID, docID);
            } catch (notificationError) {
                console.error('Notification error:', notificationError);
            }

            res.json({
                success: true,
                message: 'Tài liệu đã được tạo thành công và thông báo đã được gửi',
                data: {
                    docID,
                    title,
                    description,
                    ipfsHash,
                    createdAt: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Error creating document:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tạo tài liệu',
                error: error.message
            });
        }
    },

    // Link document to land parcel (after verification)
    async linkDocumentToLand(req, res) {
        try {
            const { docID, landParcelId } = req.body;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            await contract.submitTransaction(
                'LinkDocumentToLand',
                docID,
                landParcelId
            );

            res.json({
                success: true,
                message: 'Tài liệu đã được liên kết với thửa đất thành công',
                data: {
                    docID,
                    landParcelId,
                    linkedAt: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Error linking document to land:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi liên kết tài liệu với thửa đất',
                error: error.message
            });
        }
    },

    // Link document to transaction (after verification)
    async linkDocumentToTransaction(req, res) {
        try {
            const { docID, transactionId } = req.body;
            const userID = req.user.cccd;
            const org = req.user.org;

            // For document updates, we need to upload a new document with updated information
            const { contract } = await connectToNetwork(org, userID);

            await contract.submitTransaction(
                'LinkDocumentToTransaction',
                docID,
                transactionId
            );

            res.json({
                success: true,
                message: 'Tài liệu đã được liên kết với giao dịch thành công',
                data: {
                    docID,
                    transactionId,
                    linkedAt: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Error linking document to transaction:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi liên kết tài liệu với giao dịch',
                error: error.message
            });
        }
    },

    // Get document by ID
    async getDocument(req, res) {
        try {
            const { docID } = req.params;
            const userID = req.user.cccd;
            const org = req.user.org;

            // Documents are stored as part of land parcels or transactions
            // We need to search for documents related to this docID
            const { contract } = await connectToNetwork(org, userID);
            
            const result = await contract.evaluateTransaction(
                'GetDocument',
                docID
            );

            const document = JSON.parse(result.toString());

            res.json({
                success: true,
                data: document
            });
        } catch (error) {
            console.error('Error getting document:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy thông tin tài liệu',
                error: error.message
            });
        }
    },

    // Update document
    async updateDocument(req, res) {
        try {
            const { docID } = req.params;
            const { title, description } = req.body;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);
            
            await contract.submitTransaction(
                'UpdateDocument',
                docID,
                title,
                description
            );

            res.json({
                success: true,
                message: 'Tài liệu đã được cập nhật thành công',
                data: {
                    docID,
                    title,
                    description,
                    updatedAt: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Error updating document:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi cập nhật tài liệu',
                error: error.message
            });
        }
    },

    // Delete document
    async deleteDocument(req, res) {
        try {
            const { docID } = req.params;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            await contract.submitTransaction(
                'DeleteDocument',
                docID
            );

            res.json({
                success: true,
                message: 'Tài liệu đã được xóa thành công',
                data: {
                    docID,
                    deletedAt: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Error deleting document:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi xóa tài liệu',
                error: error.message
            });
        }
    },

    // Verify document (Org2 only)
    async verifyDocument(req, res) {
        try {
            const { docID } = req.params;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);
            
            // Get document info to find the uploader
            const documentResult = await contract.evaluateTransaction('GetDocument', docID);
            const document = JSON.parse(documentResult.toString());

            await contract.submitTransaction(
                'VerifyDocument',
                docID
            );
            
            // Send notification to document uploader
            try {
                await notificationService.notifyDocumentVerification(document.uploadedBy, docID, true);
            } catch (notificationError) {
                console.error('Notification error:', notificationError);
            }

            res.json({
                success: true,
                message: 'Tài liệu đã được chứng thực thành công và thông báo đã được gửi',
                data: {
                    docID,
                    verified: true,
                    verifiedBy: userID,
                    verifiedAt: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Error verifying document:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi chứng thực tài liệu',
                error: error.message
                    });
                }
    },

    // Reject document (Org2 only)
    async rejectDocument(req, res) {
        try {
            const { docID } = req.params;
            const { reason } = req.body;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            await contract.submitTransaction(
                'RejectDocument',
                docID,
                reason
            );

            res.json({
                success: true,
                message: 'Tài liệu đã được từ chối',
                data: {
                    docID,
                    rejected: true,
                    rejectedBy: userID,
                    rejectionReason: reason,
                    rejectedAt: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Error rejecting document:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi từ chối tài liệu',
                error: error.message
            });
        }
    },

    // Get documents by land parcel
    async getDocumentsByLandParcel(req, res) {
        try {
            const { landParcelId } = req.params;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);
            
            const result = await contract.evaluateTransaction(
                'QueryDocumentsByLandParcel',
                landParcelId,
                userID
            );

            const documents = JSON.parse(result.toString());

            res.json({
                success: true,
                data: {
                    landParcelID,
                    documents: documents,
                    count: documents.length
                }
            });
        } catch (error) {
            console.error('Error getting documents by land parcel:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy tài liệu theo thửa đất',
                error: error.message
            });
        }
    },

    // Get documents by transaction
    async getDocumentsByTransaction(req, res) {
        try {
            const { txId } = req.params;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);
            
            const result = await contract.evaluateTransaction(
                'QueryDocumentsByTransaction',
                txId,
                userID
            );

            const documents = JSON.parse(result.toString());

            res.json({
                success: true,
                data: {
                    txID,
                    documents: documents,
                    count: documents.length
                }
            });
        } catch (error) {
            console.error('Error getting documents by transaction:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy tài liệu theo giao dịch',
                error: error.message
            });
        }
    },

    // Get documents by status
    async getDocumentsByStatus(req, res) {
        try {
            const { status } = req.params; // 'pending' or 'verified'
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);
            
            const result = await contract.evaluateTransaction(
                'QueryDocumentsByStatus',
                status,
                userID
            );

            const documents = JSON.parse(result.toString());
            
            res.json({
                success: true,
                data: {
                    status,
                    documents: documents,
                    count: documents.length
                }
            });
        } catch (error) {
            console.error('Error getting documents by status:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy tài liệu theo trạng thái',
                error: error.message
            });
        }
    },

    // Get documents by type
    async getDocumentsByType(req, res) {
        try {
            const { docType } = req.params;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);
            
            const result = await contract.evaluateTransaction(
                'QueryDocumentsByType',
                docType,
                userID
            );

            const documents = JSON.parse(result.toString());

            res.json({
                success: true,
                data: {
                    docType,
                    documents: documents,
                    count: documents.length
                }
            });
        } catch (error) {
            console.error('Error getting documents by type:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy tài liệu theo loại',
                error: error.message
            });
        }
    },

    // Get documents by uploader
    async getDocumentsByUploader(req, res) {
        try {
            const { uploaderID } = req.params;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);
            
            const result = await contract.evaluateTransaction(
                'QueryDocumentsByUploader',
                uploaderID,
                userID
            );

            const documents = JSON.parse(result.toString());

            res.json({
                success: true,
                data: {
                    uploaderID,
                    documents: documents,
                    count: documents.length
                }
            });
        } catch (error) {
            console.error('Error getting documents by uploader:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy tài liệu theo người upload',
                error: error.message
            });
        }
    },

    // Search documents by keyword
    async searchDocuments(req, res) {
        try {
            const { keyword } = req.query;
            const { filters } = req.query;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);
            
            const filtersJSON = filters ? JSON.stringify(filters) : '{}';
            const result = await contract.evaluateTransaction(
                'QueryDocumentsByKeyword',
                keyword || '',
                filtersJSON,
                userID
            );

            const documents = JSON.parse(result.toString());
            
            res.json({
                success: true,
                data: {
                    keyword,
                    documents: documents,
                    count: documents.length
                }
            });
        } catch (error) {
            console.error('Error searching documents:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tìm kiếm tài liệu',
                error: error.message
            });
        }
    },

    // Get documents by status
    async getDocumentsByStatus(req, res) {
        try {
            const { status } = req.params;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            const result = await contract.evaluateTransaction(
                'QueryDocumentsByStatus',
                status,
                userID
            );

            const documents = JSON.parse(result.toString());
            res.json({
                success: true,
                data: documents
            });
        } catch (error) {
            console.error('Error getting documents by status:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy tài liệu theo trạng thái',
                error: error.message
            });
        }
    },

    // Get documents by type
    async getDocumentsByType(req, res) {
        try {
            const { docType } = req.params;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            const result = await contract.evaluateTransaction(
                'QueryDocumentsByType',
                docType,
                userID
            );

            const documents = JSON.parse(result.toString());
            res.json({
                success: true,
                data: documents
            });
        } catch (error) {
            console.error('Error getting documents by type:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy tài liệu theo loại',
                error: error.message
            });
        }
    },

    // Get documents by land parcel
    async getDocumentsByLandParcel(req, res) {
        try {
            const { landParcelID } = req.params;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            const result = await contract.evaluateTransaction(
                'QueryDocumentsByLandParcel',
                landParcelID,
                userID
            );

            const documents = JSON.parse(result.toString());
            res.json({
                success: true,
                data: documents
            });
        } catch (error) {
            console.error('Error getting documents by land parcel:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy tài liệu theo thửa đất',
                error: error.message
            });
        }
    },

    // Get documents by transaction
    async getDocumentsByTransaction(req, res) {
        try {
            const { txID } = req.params;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            const result = await contract.evaluateTransaction(
                'QueryDocumentsByTransaction',
                txID,
                userID
            );

            const documents = JSON.parse(result.toString());
            res.json({
                success: true,
                data: documents
            });
        } catch (error) {
            console.error('Error getting documents by transaction:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy tài liệu theo giao dịch',
                error: error.message
            });
        }
    },

    // Get all documents (admin only)
    async getAllDocuments(req, res) {
        try {
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            const result = await contract.evaluateTransaction(
                'QueryAllDocuments',
                userID
            );

            const documents = JSON.parse(result.toString());
            res.json({
                success: true,
                data: documents
            });
        } catch (error) {
            console.error('Error getting all documents:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy tất cả tài liệu',
                error: error.message
            });
        }
    },

    // Get document history
    async getDocumentHistory(req, res) {
        try {
            const { ipfsHash } = req.params;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            const result = await contract.evaluateTransaction(
                'QueryDocumentHistory',
                ipfsHash,
                userID
            );

            const history = JSON.parse(result.toString());
            res.json({
                success: true,
                data: history
            });
        } catch (error) {
            console.error('Error getting document history:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy lịch sử tài liệu',
                error: error.message
            });
        }
    },

    // Analyze document content
    async analyzeDocument(req, res) {
        try {
            const { docID } = req.params;
            const { expectedCCCD, expectedLandParcelId } = req.query;
            
            console.log(`Analyzing document: ${docID}`);
            
            // Get document info first
            const userID = req.user.cccd;
            const org = req.user.org;
            const { contract } = await connectToNetwork(org, userID);
            
            const docResult = await contract.evaluateTransaction(
                'GetDocument',
                docID
            );
            
            const document = JSON.parse(docResult.toString());
            
            if (!document.ipfsHash) {
                return res.status(400).json({
                    success: false,
                    message: 'Tài liệu không có IPFS hash để phân tích',
                    error: 'No IPFS hash available'
                });
            }
            
            const analysis = await pdfExtractionService.analyzeDocument(
                document.ipfsHash,
                expectedCCCD,
                expectedLandParcelId
            );

            if (!analysis.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Lỗi khi phân tích tài liệu',
                    error: analysis.error
                });
            }
            
            res.json({
                success: true,
                message: 'Phân tích tài liệu thành công',
                data: {
                    docID,
                    document: document,
                    analysis: analysis
                }
            });
        } catch (error) {
            console.error('Error analyzing document:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi phân tích tài liệu',
                error: error.message
            });
        }
    }
};

module.exports = documentService; 