'use strict';
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { registerUser, verifyUser, sendOTP } = require('../enroll/registerUser.js');
const { changePassword, forgotPassword, resetPassword, lockUnlockAccount, deleteAccount } = require('../enroll/accountManager.js');
const notificationService = require('./notificationService');
const { validatePassword, validateCCCD, validatePhone, sanitizeInput, validateOrg } = require('../enroll/validation.js');
const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../enroll/CAUtil.js');
const { buildCCPOrg1, buildCCPOrg2, buildCCPOrg3, buildWallet } = require('../enroll/AppUtil.js');
const path = require('path');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
    console.error('JWT_SECRET is not defined in .env');
    process.exit(1);
}

// MSP configurations
const mspOrg1 = 'Org1MSP';
const mspOrg2 = 'Org2MSP';
const mspOrg3 = 'Org3MSP';

// Function to enroll user in Fabric CA
async function enrollUserInFabricCA(userData) {
    try {
        let ccp, msp, caHostName, affiliation, walletPath;

        // Configure based on organization
        switch (userData.org) {
            case 'Org1':
                ccp = buildCCPOrg1();
                msp = mspOrg1;
                caHostName = 'ca.org1.example.com';
                affiliation = 'org1.department1';
                walletPath = path.join(__dirname, '../wallet/org1');
                break;
            case 'Org2':
                ccp = buildCCPOrg2();
                msp = mspOrg2;
                caHostName = 'ca.org2.example.com';
                affiliation = 'org2.department1';
                walletPath = path.join(__dirname, '../wallet/org2');
                break;
            case 'Org3':
                ccp = buildCCPOrg3();
                msp = mspOrg3;
                caHostName = 'ca.org3.example.com';
                affiliation = 'org3.department1';
                walletPath = path.join(__dirname, '../wallet/org3');
                break;
            default:
                throw new Error(`Invalid organization: ${userData.org}`);
        }

        // Build CA client and wallet
        const caClient = buildCAClient(FabricCAServices, ccp, caHostName);
        const wallet = await buildWallet(Wallets, walletPath);

        // Ensure admin is enrolled first
        await enrollAdmin(caClient, wallet, msp);

        // Check if user identity already exists
        const userIdentity = await wallet.get(userData.cccd);
        if (userIdentity) {
            console.log(`✓ Identity for ${userData.fullName} (CCCD: ${userData.cccd}) already exists`);
            return true;
        }

        // Register and enroll user
        const attributes = [
            { name: 'cccd', value: userData.cccd, ecert: true },
            { name: 'role', value: userData.role, ecert: true },
            { name: 'org', value: userData.org, ecert: true }
        ];

        const enrolled = await registerAndEnrollUser(
            caClient,
            wallet,
            msp,
            userData.cccd,
            affiliation,
            attributes
        );

        if (enrolled) {
            console.log(`✓ Enrolled identity: ${userData.fullName} (${userData.org})`);
            return true;
        } else {
            throw new Error('User was not enrolled by CA');
        }
    } catch (error) {
        console.error(`✗ Error enrolling identity for ${userData.fullName}:`, error.message);
        throw error;
    }
}

const authenticateJWT = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Access denied, no token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, jwtSecret);
        const user = await User.findOne({ cccd: decoded.cccd });
        if (!user) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        if (user.isLocked) {
            return res.status(403).json({ error: 'Account is locked' });
        }
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin privileges required' });
    }
    next();
};

const checkOrg = (allowedOrgs) => (req, res, next) => {
    if (!allowedOrgs.includes(req.user.org)) {
        return res.status(403).json({ error: `Access denied, organization ${req.user.org} not allowed. Required: ${allowedOrgs.join(' or ')}` });
    }
    next();
};

const register = async (req, res, next) => {
    const { org, cccd, phone, fullName, password, role } = req.body;
    if (!req.headers.authorization) {
        try {
            if (org && org !== 'Org3') {
                return res.status(403).json({ error: 'Công dân chỉ có thể đăng ký với Org3' });
            }
            validateCCCD(sanitizeInput(cccd));
            validatePhone(sanitizeInput(phone));
            validatePassword(sanitizeInput(password));
            const sanitizedFullName = sanitizeInput(fullName);
            const result = await registerUser('Org3', cccd, phone, sanitizedFullName, password, 'user');
            res.json(result);
        } catch (error) {
            console.error('Lỗi đăng ký:', error);
            if (error.code === 11000) {
                const field = Object.keys(error.keyPattern || {})[0];
                if (field === 'cccd') {
                    return res.status(400).json({ error: 'CCCD đã tồn tại' });
                } else if (field === 'phone') {
                    return res.status(400).json({ error: 'Số điện thoại đã tồn tại' });
                } else if (field === 'userId') {
                    return res.status(400).json({ error: 'ID người dùng đã tồn tại' });
                } else {
                    return res.status(400).json({ error: 'Dữ liệu trùng lặp' });
                }
            }
            res.status(400).json({ error: error.message });
        }
        return;
    }
    authenticateJWT(req, res, async () => {
        requireAdmin(req, res, async () => {
            try {
                // Validate input
                validateOrg(org);
                validateCCCD(sanitizeInput(cccd));
                validatePhone(sanitizeInput(phone));
                validatePassword(sanitizeInput(password));
                const sanitizedFullName = sanitizeInput(fullName);
                const userRole = role === 'admin' ? 'admin' : 'user';

                // Ensure admin can only register users in their own organization
                if (org !== req.user.org) {
                    return res.status(403).json({ error: `Admin can only register users in their own organization (${req.user.org})` });
                }

                // Check duplicates
                const existing = await User.findOne({ $or: [{ cccd: sanitizeInput(cccd) }, { phone: sanitizeInput(phone) }] });
                if (existing) {
                    if (existing.cccd === sanitizeInput(cccd)) {
                        return res.status(400).json({ error: 'CCCD đã tồn tại' });
                    }
                    if (existing.phone === sanitizeInput(phone)) {
                        return res.status(400).json({ error: 'Số điện thoại đã tồn tại' });
                    }
                }

                // Create and activate user immediately (no OTP)
                const newUser = new User({
                    cccd: sanitizeInput(cccd),
                    phone: sanitizeInput(phone),
                    fullName: sanitizedFullName,
                    org,
                    role: userRole,
                    password: sanitizeInput(password),
                    isPhoneVerified: true,
                    isLocked: false
                });
                await newUser.save();

                // Enroll user in Fabric CA
                try {
                    await enrollUserInFabricCA({
                        cccd: sanitizeInput(cccd),
                        fullName: sanitizedFullName,
                        org,
                        role: userRole
                    });
                    console.log(`✓ Successfully enrolled ${cccd} in Fabric CA`);
                } catch (enrollError) {
                    console.error(`✗ Failed to enroll ${cccd} in Fabric CA:`, enrollError.message);
                    // Note: We don't fail the entire registration if Fabric enrollment fails
                    // The user account is still created in MongoDB
                }

                // Send in-app notification; in real env, integrate SMS service here
                try {
                    await notificationService.createNotification(
                        'SYSTEM_ANNOUNCEMENT',
                        sanitizeInput(cccd),
                        {
                            customTitle: 'Tài khoản đã được tạo',
                            customMessage: `Tài khoản của bạn đã được tạo và kích hoạt. Mật khẩu tạm thời: ${password}. Vui lòng đổi mật khẩu sau khi đăng nhập.`,
                            priority: 'HIGH'
                        }
                    );
                } catch (notifyErr) {
                    console.warn('Could not send creation notification:', notifyErr.message);
                }

                console.log(`[Account] Created and activated user ${cccd}. Password sent via notification/SMS placeholder.`);
                res.json({
                    success: true,
                    message: 'Tài khoản đã được tạo và kích hoạt. Mật khẩu đã được gửi tới số điện thoại.',
                    user: {
                        cccd: newUser.cccd,
                        fullName: newUser.fullName,
                        phone: newUser.phone,
                        org: newUser.org,
                        role: newUser.role
                    }
                });
            } catch (error) {
                console.error('Lỗi đăng ký admin:', error);
                if (error.code === 11000) {
                    const field = Object.keys(error.keyPattern || {})[0];
                    if (field === 'cccd') {
                        return res.status(400).json({ error: 'CCCD đã tồn tại' });
                    } else if (field === 'phone') {
                        return res.status(400).json({ error: 'Số điện thoại đã tồn tại' });
                    } else if (field === 'userId') {
                        return res.status(400).json({ error: 'ID người dùng đã tồn tại' });
                    } else {
                        return res.status(400).json({ error: 'Dữ liệu trùng lặp' });
                    }
                }
                res.status(400).json({ error: error.message });
            }
        });
    });
};

const resendOTP = async (req, res) => {
    const { cccd } = req.body;
    try {
        const user = await User.findOne({ cccd: sanitizeInput(cccd) });
        if (!user) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }
        if (user.isPhoneVerified) {
            return res.status(400).json({ error: 'Số điện thoại đã được xác minh' });
        }
        const { otp, otpExpires } = await sendOTP(user.phone);
        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();
        res.json({ message: 'Đã gửi lại OTP đến số điện thoại', phone: user.phone });
    } catch (error) {
        res.status(500).json({ error: `Gửi lại OTP thất bại: ${error.message}` });
    }
};

const verifyOTP = async (req, res) => {
    const { cccd, otp } = req.body;
    try {
        const result = await verifyUser(sanitizeInput(cccd), sanitizeInput(otp));
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const login = async (req, res) => {
    const { phone, cccd, password } = req.body;
    try {
        let user;
        if (phone) {
            user = await User.findOne({ phone: sanitizeInput(phone) });
        } else if (cccd) {
            user = await User.findOne({ cccd: sanitizeInput(cccd) });
        }
        if (!user) {
            return res.status(401).json({ error: 'Thông tin đăng nhập không hợp lệ' });
        }
        if (user.isLocked) {
            return res.status(403).json({ error: 'Tài khoản bị khóa' });
        }
        if (!user.isPhoneVerified) {
            return res.status(403).json({ error: 'Số điện thoại chưa được xác minh' });
        }
        if (!await user.comparePassword(sanitizeInput(password))) {
            return res.status(401).json({ error: 'Thông tin đăng nhập không hợp lệ' });
        }
        const tokenPayload = {
            cccd: user.cccd,
            org: user.org,
            role: user.role,
            name: user.fullName,
            phone: user.phone
        };
        const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '1h' });
        res.json({ 
            message: 'Đăng nhập thành công', 
            token,
            user: {
                cccd: user.cccd,
                fullName: user.fullName,
                phone: user.phone,
                org: user.org,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: `Đăng nhập thất bại: ${error.message}` });
    }
};

const logout = async (req, res) => {
    try {
        res.json({ message: 'Đăng xuất thành công' });
    } catch (error) {
        res.status(500).json({ error: `Đăng xuất thất bại: ${error.message}` });
    }
};

const changeUserPassword = async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const { cccd } = req.user;
    try {
        validatePassword(sanitizeInput(newPassword));
        if (confirmPassword && newPassword !== confirmPassword) {
            return res.status(400).json({ error: 'Mật khẩu không khớp' });
        }
        const result = await changePassword(cccd, sanitizeInput(oldPassword), sanitizeInput(newPassword));
        
        // Send notification to user
        try {
            await notificationService.notifyPasswordChanged(cccd);
        } catch (notificationError) {
            console.error('Notification error:', notificationError);
        }

        res.json({ ...result, message: result.message + ' và thông báo đã được gửi' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const forgotUserPassword = async (req, res) => {
    const { cccd, phone } = req.body;
    try {
        const result = await forgotPassword(sanitizeInput(cccd), sanitizeInput(phone));
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const resetUserPassword = async (req, res) => {
    const { cccd, otp, newPassword } = req.body;
    try {
        validatePassword(sanitizeInput(newPassword));
        const result = await resetPassword(sanitizeInput(cccd), sanitizeInput(otp), sanitizeInput(newPassword));
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const lockUnlockUserAccount = async (req, res) => {
    const { targetCccd, lock } = req.body;
    const { cccd, org } = req.user;
    try {
        if (!targetCccd) {
            return res.status(400).json({ error: 'targetCccd là bắt buộc' });
        }
        // Check if target user belongs to the same organization
        const targetUser = await User.findOne({ cccd: sanitizeInput(targetCccd) });
        if (!targetUser) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }
        if (targetUser.org !== org) {
            return res.status(403).json({ error: `Admin can only manage users in their own organization (${org})` });
        }
        const result = await lockUnlockAccount(cccd, sanitizeInput(targetCccd), lock);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const deleteUserAccount = async (req, res) => {
    const { targetCccd } = req.body;
    const { cccd, org } = req.user;
    try {
        if (!targetCccd) {
            return res.status(400).json({ error: 'targetCccd là bắt buộc' });
        }
        // Check if target user belongs to the same organization
        const targetUser = await User.findOne({ cccd: sanitizeInput(targetCccd) });
        if (!targetUser) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }
        if (targetUser.org !== org) {
            return res.status(403).json({ error: `Admin can only manage users in their own organization (${org})` });
        }
        const result = await deleteAccount(cccd, sanitizeInput(targetCccd));
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    authenticateJWT,
    requireAdmin,
    checkOrg,
    register,
    resendOTP,
    verifyOTP,
    login,
    logout,
    changeUserPassword,
    forgotUserPassword,
    resetUserPassword,
    lockUnlockUserAccount,
    deleteUserAccount,
    enrollUserInFabricCA
};