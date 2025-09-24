'use strict';
const { connectToNetwork } = require('./networkService');
const pdfExtractionService = require('./pdfExtractionService');
const notificationService = require('./notificationService');

// Document Service - Handles all document operations
const documentService = {
    // Create document
    async createDocument(req, res) {
        try {
            const { docID, docType, title, description, ipfsHash, fileType, fileSize, status } = req.body;
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

            // Auto-generate document ID if not provided
            const finalDocID = docID || `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

            // Use description directly
            const finalDescription = description || '';

            // Set default status if not provided
            const documentStatus = status || 'PENDING';

            // Create document using existing function
            await contract.submitTransaction(
                'CreateDocument',
                finalDocID,
                docType,
                title,
                finalDescription,
                ipfsHash,
                fileType,
                fileSize || 0,
                documentStatus,
                documentStatus === 'VERIFIED' ? userID : ''
            );

            // Send notification to user
            try {
                await notificationService.notifyDocumentCreated(userID, finalDocID);
            } catch (notificationError) {
                console.error('Notification error:', notificationError);
            }

            res.json({
                success: true,
                message: 'Tài liệu đã được tạo thành công và thông báo đã được gửi',
                data: {
                    docID: finalDocID,
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

    // Link documents to land parcel (supports multiple documents) - UC-17
    async linkDocumentToLand(req, res) {
        try {
            const { docIDs, landParcelId } = req.body;
            const userID = req.user.cccd;
            const org = req.user.org;

            // Validate input
            if (!docIDs || (!Array.isArray(docIDs) && typeof docIDs !== 'string')) {
                return res.status(400).json({
                    success: false,
                    message: 'docIDs phải là mảng ID tài liệu hoặc ID đơn lẻ'
                });
            }

            const { contract } = await connectToNetwork(org, userID);

            // Convert to JSON string if array, keep as string if single ID
            const docIDsParam = Array.isArray(docIDs) ? JSON.stringify(docIDs) : docIDs;

            await contract.submitTransaction(
                'LinkDocumentToLand',
                docIDsParam,
                landParcelId
            );

            const responseMessage = Array.isArray(docIDs) && docIDs.length > 1 
                ? `${docIDs.length} tài liệu bổ sung đã được liên kết với thửa đất thành công`
                : 'Tài liệu bổ sung đã được liên kết với thửa đất thành công';

            res.json({
                success: true,
                message: responseMessage,
                data: {
                    docIDs: Array.isArray(docIDs) ? docIDs : [docIDs],
                    landParcelId,
                    linkedAt: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Error linking documents to land:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi liên kết tài liệu bổ sung với thửa đất',
                error: error.message
            });
        }
    },

    // Link supplement documents to transaction (supports multiple documents) - UC-18
    async linkDocumentToTransaction(req, res) {
        try {
            const { docIDs, transactionId } = req.body;
            const userID = req.user.cccd;
            const org = req.user.org;

            // Validate input
            if (!docIDs || (!Array.isArray(docIDs) && typeof docIDs !== 'string')) {
                return res.status(400).json({
                    success: false,
                    message: 'docIDs phải là mảng ID tài liệu hoặc ID đơn lẻ'
                });
            }

            const { contract } = await connectToNetwork(org, userID);

            // Convert to JSON string if array, keep as string if single ID
            const docIDsParam = Array.isArray(docIDs) ? JSON.stringify(docIDs) : docIDs;

            await contract.submitTransaction(
                'LinkDocumentToTransaction',
                docIDsParam,
                transactionId
            );

            const responseMessage = Array.isArray(docIDs) && docIDs.length > 1 
                ? `${docIDs.length} tài liệu bổ sung đã được liên kết với giao dịch thành công`
                : 'Tài liệu bổ sung đã được liên kết với giao dịch thành công';

            res.json({
                success: true,
                message: responseMessage,
                data: {
                    docIDs: Array.isArray(docIDs) ? docIDs : [docIDs],
                    transactionId,
                    linkedAt: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Error linking supplement documents to transaction:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi liên kết tài liệu bổ sung với giao dịch',
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

            let documents = [];
            const resultString = result.toString().trim();
            
            if (resultString && resultString !== 'null' && resultString !== '') {
                try {
                    documents = JSON.parse(resultString);
                } catch (parseError) {
                    console.warn('Could not parse documents result:', parseError);
                    documents = [];
                }
            }

            // Ensure documents is always an array
            if (!Array.isArray(documents)) {
                documents = [];
            }

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
            const { keyword, filters, ...otherParams } = req.query;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);
            
            // Build filters object from query params
            let filtersObj = {};
            
            // If filters is provided as a string, try to parse it
            if (filters) {
                try {
                    filtersObj = JSON.parse(filters);
                } catch (e) {
                    console.log('Invalid filters JSON, ignoring:', filters);
                }
            }
            
            // Add other query params as filters with proper mapping
            Object.keys(otherParams).forEach(key => {
                if (otherParams[key] !== undefined && otherParams[key] !== '') {
                    // Map frontend parameters to chaincode expected parameters
                    if (key === 'uploaderID') {
                        filtersObj['uploadedBy'] = otherParams[key];
                    } else if (key === 'verified') {
                        // Map verified to status
                        if (otherParams[key] === 'true') {
                            filtersObj['status'] = 'VERIFIED';
                        } else if (otherParams[key] === 'false') {
                            filtersObj['status'] = 'PENDING'; // or any non-VERIFIED status
                        }
                    } else {
                        filtersObj[key] = otherParams[key];
                    }
                }
            });
            
            const filtersJSON = JSON.stringify(filtersObj);
            console.log('Final filters JSON:', filtersJSON);
            
            const result = await contract.evaluateTransaction(
                'QueryDocumentsByKeyword',
                keyword || '',
                filtersJSON,
                userID
            );

            console.log('Raw chaincode result:', result.toString());
            
            let documents;
            try {
                const resultString = result.toString();
                if (!resultString || resultString.trim() === '') {
                    console.log('Empty response from chaincode, returning empty array');
                    documents = [];
                } else {
                    documents = JSON.parse(resultString);
                }
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.error('Raw result:', result.toString());
                throw new Error('Invalid response from chaincode: ' + parseError.message);
            }
            
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
            const { docID } = req.params;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            const result = await contract.evaluateTransaction(
                'QueryDocumentHistory',
                docID,
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
            console.log(`Using Gemini for analysis`);
            
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