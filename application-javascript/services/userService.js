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
        const currentUser = await User.findOne({ cccd });
        if (!currentUser) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }

        const updateData = {};
        let phoneChanged = false;

        if (fullName) updateData.fullName = sanitizeInput(fullName);
        
        if (phone) {
            validatePhone(phone);
            // Kiểm tra xem số điện thoại có thay đổi không
            if (phone !== currentUser.phone) {
                phoneChanged = true;
                // Kiểm tra số điện thoại đã tồn tại chưa
                const existingUser = await User.findOne({ phone, cccd: { $ne: cccd } });
                if (existingUser) {
                    return res.status(400).json({ error: 'Số điện thoại đã tồn tại' });
                }
                updateData.phone = phone;
                updateData.isPhoneVerified = false; // Yêu cầu xác thực lại
            }
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

        let message = 'Cập nhật hồ sơ thành công và thông báo đã được gửi';
        if (phoneChanged) {
            message += '. Vui lòng xác thực số điện thoại mới để tiếp tục sử dụng tài khoản.';
        }

        res.json({ 
            message, 
            user,
            phoneChanged,
            requiresVerification: phoneChanged
        });
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

const getCurrentUser = async (req, res) => {
    try {
        const { cccd, org, role } = req.user;
        
        // Lấy thông tin chi tiết của user hiện tại
        const user = await User.findOne({ cccd }).select('-password -otp -otpExpires');
        if (!user) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }
        
        res.json({
            success: true,
            data: {
                cccd: user.cccd,
                name: user.fullName,
                org: user.org,
                role: user.role,
                phone: user.phone,
                isPhoneVerified: user.isPhoneVerified,
                isLocked: user.isLocked,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
    } catch (error) {
        res.status(500).json({ error: `Lấy thông tin người dùng hiện tại thất bại: ${error.message}` });
    }
};

const getSelfByCccd = async (req, res) => {
    try {
        const { cccd } = req.params;
        const requestingUserCccd = req.user.cccd;
        
        // Chỉ cho phép user lấy thông tin của chính mình
        if (sanitizeInput(cccd) !== requestingUserCccd) {
            return res.status(403).json({ error: 'Bạn chỉ có thể xem thông tin của chính mình' });
        }
        
        const user = await User.findOne({ cccd: sanitizeInput(cccd) }).select('-password -otp -otpExpires');
        if (!user) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }
        
        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: `Lấy thông tin người dùng thất bại: ${error.message}` });
    }
};

const requestPhoneVerification = async (req, res) => {
    const { cccd } = req.user;
    try {
        const user = await User.findOne({ cccd });
        if (!user) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }

        if (user.isPhoneVerified) {
            return res.status(400).json({ error: 'Số điện thoại đã được xác thực' });
        }

        const { sendOTP } = require('../enroll/registerUser');
        const { otp, otpExpires } = await sendOTP(user.phone);
        
        user.otp = otp;
        user.otpExpires = otpExpires;
        user.otpAttempts = 0;
        await user.save();

        res.json({ 
            message: 'OTP đã được gửi đến số điện thoại mới', 
            phone: user.phone 
        });
    } catch (error) {
        res.status(500).json({ error: `Gửi OTP thất bại: ${error.message}` });
    }
};

const verifyPhoneChange = async (req, res) => {
    const { otp } = req.body;
    const { cccd } = req.user;
    try {
        const user = await User.findOne({ cccd });
        if (!user) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }

        if (user.isPhoneVerified) {
            return res.status(400).json({ error: 'Số điện thoại đã được xác thực' });
        }

        if (!user.otp || !user.otpExpires) {
            return res.status(400).json({ error: 'Không tìm thấy OTP. Vui lòng yêu cầu gửi lại OTP' });
        }

        if (new Date() > user.otpExpires) {
            return res.status(400).json({ error: 'OTP đã hết hạn. Vui lòng yêu cầu gửi lại OTP' });
        }

        if (user.otpAttempts >= 5) {
            return res.status(400).json({ error: 'Đã vượt quá số lần thử OTP cho phép. Vui lòng thử lại sau' });
        }

        if (user.otp !== sanitizeInput(otp)) {
            user.otpAttempts = (user.otpAttempts || 0) + 1;
            await user.save();
            return res.status(400).json({ error: 'OTP không đúng' });
        }

        // Xác thực thành công
        user.isPhoneVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        user.otpAttempts = 0;
        await user.save();

        // Send notification
        try {
            await notificationService.notifyUserProfileUpdated(cccd);
        } catch (notificationError) {
            console.error('Notification error:', notificationError);
        }

        res.json({ 
            message: 'Xác thực số điện thoại thành công', 
            user: {
                cccd: user.cccd,
                fullName: user.fullName,
                phone: user.phone,
                org: user.org,
                role: user.role,
                isPhoneVerified: user.isPhoneVerified
            }
        });
    } catch (error) {
        res.status(500).json({ error: `Xác thực OTP thất bại: ${error.message}` });
    }
};

module.exports = {
    getUsers,
    getProfile,
    updateProfile,
    getUserByCCCD,
    updateUser,
    getCurrentUser,
    getSelfByCccd,
    requestPhoneVerification,
    verifyPhoneChange
};
