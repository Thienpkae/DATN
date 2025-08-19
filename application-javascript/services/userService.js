'use strict';
const User = require('../models/User');
const { sanitizeInput, validatePhone, validateOrg } = require('../enroll/validation.js');
const notificationService = require('./notificationService');

const getUsers = async (req, res) => {
    const { limit = 50, offset = 0, org: filterOrg, role } = req.query;
    const { org } = req.user;
    try {
        let query = { org }; // Restrict to users in the same organization as the admin
        if (filterOrg && filterOrg !== org) {
            return res.status(403).json({ error: `Admin can only view users in their own organization (${org})` });
        }
        if (role) query.role = sanitizeInput(role);
        const users = await User.find(query)
            .select('-password -otp -otpExpires')
            .limit(parseInt(limit))
            .skip(parseInt(offset))
            .sort({ createdAt: -1 });
        const total = await User.countDocuments(query);
        res.json({
            users,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        res.status(500).json({ error: `Lấy danh sách người dùng thất bại: ${error.message}` });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findOne({ cccd: req.user.cccd }).select('-password -otp -otpExpires');
        if (!user) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }
        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: `Lấy hồ sơ thất bại: ${error.message}` });
    }
};

const updateProfile = async (req, res) => {
    const { fullName, phone } = req.body;
    const { cccd } = req.user;
    try {
        const updateData = {};
        if (fullName) updateData.fullName = sanitizeInput(fullName);
        if (phone) {
            validatePhone(phone);
            updateData.phone = phone;
            updateData.isPhoneVerified = false;
        }
        const user = await User.findOneAndUpdate(
            { cccd },
            updateData,
            { new: true }
        ).select('-password -otp -otpExpires');

        // Send notification to user
        try {
            await notificationService.notifyUserProfileUpdated(cccd);
        } catch (notificationError) {
            console.error('Notification error:', notificationError);
        }

        res.json({ message: 'Cập nhật hồ sơ thành công và thông báo đã được gửi', user });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Số điện thoại đã tồn tại' });
        }
        res.status(400).json({ error: error.message });
    }
};

const getUserByCCCD = async (req, res) => {
    const { cccd } = req.params;
    const { org } = req.user;
    try {
        const user = await User.findOne({ cccd: sanitizeInput(cccd) }).select('-password -otp -otpExpires');
        if (!user) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }
        if (user.org !== org) {
            return res.status(403).json({ error: `Admin can only view users in their own organization (${org})` });
        }
        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: `Lấy thông tin người dùng thất bại: ${error.message}` });
    }
};

const updateUser = async (req, res) => {
    const { cccd } = req.params;
    const { fullName, phone, role, org, isLocked } = req.body;
    const { org: adminOrg } = req.user;
    try {
        // Check if target user belongs to the same organization
        const targetUser = await User.findOne({ cccd: sanitizeInput(cccd) });
        if (!targetUser) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }
        if (targetUser.org !== adminOrg) {
            return res.status(403).json({ error: `Admin can only manage users in their own organization (${adminOrg})` });
        }
        const updateData = {};
        if (fullName) updateData.fullName = sanitizeInput(fullName);
        if (phone) {
            validatePhone(phone);
            updateData.phone = phone;
        }
        if (role) updateData.role = sanitizeInput(role);
        if (org) {
            validateOrg(org);
            if (org !== adminOrg) {
                return res.status(403).json({ error: `Admin can only assign users to their own organization (${adminOrg})` });
            }
            updateData.org = org;
        }
        if (typeof isLocked === 'boolean') updateData.isLocked = isLocked;
        const user = await User.findOneAndUpdate(
            { cccd: sanitizeInput(cccd) },
            updateData,
            { new: true }
        ).select('-password -otp -otpExpires');
        if (!user) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }
        res.json({ message: 'Cập nhật người dùng thành công', user });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Số điện thoại đã tồn tại' });
        }
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    getUsers,
    getProfile,
    updateProfile,
    getUserByCCCD,
    getSelfByCCCD,
    updateUser
};