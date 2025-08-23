'use strict';
const { connectToNetwork } = require('./networkService');
const notificationService = require('./notificationService');

// Land Service - Handles all land parcel operations
const landService = {
    // Create a new land parcel
    async createLandParcel(req, res) {
        try {
            const { id, ownerId, location, landUsePurpose, legalStatus, area, certificateId, legalInfo } = req.body;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            // Validate and convert area
            const areaStr = area !== undefined && area !== null ? area.toString() : '';
            if (!areaStr || isNaN(parseFloat(areaStr)) || parseFloat(areaStr) < 0) {
            throw new Error('Diện tích không hợp lệ');
            }

            await contract.submitTransaction(
                'CreateLandParcel',
                id,
                ownerId,
                location,
                landUsePurpose,
                legalStatus,
                areaStr,
                certificateId || '',
                legalInfo || '',
                userID
            );

            // Get the created land parcel to return as response data
            const landResult = await contract.evaluateTransaction(
                'QueryLandByID',
                id,
                userID
            );

            // Send notification to land owner
            try {
                await notificationService.notifyLandParcelCreated(ownerId, id);
            } catch (notificationError) {
                console.error('Notification error:', notificationError);
            }

            res.json({
                success: true,
                message: 'Thửa đất đã được tạo thành công và thông báo đã được gửi',
                data: JSON.parse(landResult.toString())
            });
        } catch (error) {
            console.error('Error creating land parcel:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tạo thửa đất',
                error: error.message
            });
        }
    },

    // Update an existing land parcel
    async updateLandParcel(req, res) {
        try {
            const { id } = req.params;
            const { area, location, landUsePurpose, legalStatus, certificateId, legalInfo } = req.body;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            // Get current land parcel data to fill missing fields
            const currentLandResult = await contract.evaluateTransaction('QueryLandByID', id, userID);
            const currentLand = JSON.parse(currentLandResult.toString());

            // Use current values for fields not provided in update
            const finalArea = area !== undefined && area !== null ? area.toString() : currentLand.area.toString();
            const finalLocation = location !== undefined ? location : currentLand.location;
            const finalLandUsePurpose = landUsePurpose !== undefined ? landUsePurpose : currentLand.landUsePurpose;
            const finalLegalStatus = legalStatus !== undefined ? legalStatus : currentLand.legalStatus;
            const finalCertificateId = certificateId !== undefined ? certificateId : currentLand.certificateID;
            const finalLegalInfo = legalInfo !== undefined ? legalInfo : currentLand.legalInfo;

            // Validate area if provided
            if (area !== undefined && area !== null && (isNaN(parseFloat(finalArea)) || parseFloat(finalArea) < 0)) {
                throw new Error('Diện tích không hợp lệ');
            }

            await contract.submitTransaction(
                'UpdateLandParcel',
                id,
                finalArea,
                finalLocation,
                finalLandUsePurpose,
                finalLegalStatus,
                finalCertificateId,
                finalLegalInfo
            );

            // Get the updated land parcel to return as response data
            const landResult = await contract.evaluateTransaction(
                'QueryLandByID',
                id,
                userID
            );

            res.json({
                success: true,
                message: 'Thửa đất đã được cập nhật thành công',
                data: JSON.parse(landResult.toString())
            });
        } catch (error) {
            console.error('Error updating land parcel:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi cập nhật thửa đất',
                error: error.message
            });
        }
    },

    // Issue land certificate
    async issueLandCertificate(req, res) {
        try {
            const { certificateID, landParcelID, ownerID, legalInfo } = req.body;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            await contract.submitTransaction(
                'IssueLandCertificate',
                certificateID,
                landParcelID,
                ownerID,
                legalInfo
            );

            // Get the updated land parcel to return as response data
            const landResult = await contract.evaluateTransaction(
                'QueryLandByID',
                landParcelID,
                userID
            );

            // Send notification to land owner
            try {
                await notificationService.notifyLandCertificateIssued(ownerID, landParcelID, certificateID);
            } catch (notificationError) {
                console.error('Notification error:', notificationError);
            }

            res.json({
                success: true,
                message: 'Giấy chứng nhận đã được cấp thành công và thông báo đã được gửi',
                data: JSON.parse(landResult.toString())
            });
        } catch (error) {
            console.error('Error issuing land certificate:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi cấp giấy chứng nhận',
                error: error.message
            });
        }
    },

    // Get a specific land parcel by ID
    async getLandParcel(req, res) {
        try {
            const { id } = req.params;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);
            
            const result = await contract.evaluateTransaction(
                'QueryLandByID',
                id,
                userID
            );

            const land = JSON.parse(result.toString());
            res.json({
                success: true,
                data: land
            });
        } catch (error) {
            console.error('Error getting land parcel:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy thông tin thửa đất',
                error: error.message
            });
        }
    },

    // Get all land parcels by owner
    async getLandParcelsByOwner(req, res) {
        try {
            const { ownerID } = req.params;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);
            
            const result = await contract.evaluateTransaction(
                'QueryLandsByOwner',
                ownerID,
                userID
            );

            const lands = JSON.parse(result.toString());
            res.json({
                success: true,
                data: lands
            });
        } catch (error) {
            console.error('Error getting land parcels by owner:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy danh sách thửa đất',
                error: error.message
            });
        }
    },

    // Search land parcels by keyword
    async searchLandParcels(req, res) {
        try {
            const { keyword, filters } = req.query;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            // If filters is a string, use it directly; if object, stringify
            let filtersJSON = '{}';
            if (typeof filters === 'string' && filters.trim() !== '') {
                filtersJSON = filters;
            } else if (typeof filters === 'object' && filters !== null) {
                filtersJSON = JSON.stringify(filters);
            }

            const result = await contract.evaluateTransaction(
                'QueryLandsByKeyword',
                keyword || '',
                filtersJSON,
                userID
            );

            const lands = JSON.parse(result.toString());
            res.json({
                success: true,
                data: lands
            });
        } catch (error) {
            console.error('Error searching land parcels:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi tìm kiếm thửa đất',
                error: error.message
            });
        }
    },

    // Get all land parcels (admin only)
    async getAllLandParcels(req, res) {
        try {
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);

            const result = await contract.evaluateTransaction(
                'QueryAllLands',
                userID
            );

            const lands = JSON.parse(result.toString());
            res.json({
                success: true,
                data: lands
            });
        } catch (error) {
            console.error('Error getting all land parcels:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy danh sách tất cả thửa đất',
                error: error.message
            });
        }
    },

    // Get land parcel history
    async getLandParcelHistory(req, res) {
        try {
            const { id } = req.params;
            const userID = req.user.cccd;
            const org = req.user.org;

            const { contract } = await connectToNetwork(org, userID);
            
            const result = await contract.evaluateTransaction(
                'GetLandHistory',
                id,
                userID
            );

            const history = JSON.parse(result.toString());
            res.json({
                success: true,
                data: history
            });
        } catch (error) {
            console.error('Error getting land parcel history:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy lịch sử thửa đất',
                error: error.message
            });
        }
    }
};

module.exports = landService; 