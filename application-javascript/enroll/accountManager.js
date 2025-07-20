'use strict';

const mongoose = require('mongoose');
const User = require('../models/User');
const Log = require('../models/Log');
const { sendOTP } = require('./registerUser');
const { validatePassword, validatePhone, sanitizeInput } = require('./validation');

async function changePassword(userId, oldPassword, newPassword) {
    try {
        validatePassword(newPassword);
        const sanitizedUserId = sanitizeInput(userId);

        const user = await User.findOne({ userId: sanitizedUserId });
        if (!user) {
            throw new Error('User not found');
        }

        if (!user.isPhoneVerified) {
            throw new Error('Phone number not verified');
        }

        if (!user.comparePassword) {
            throw new Error('Password comparison method not implemented');
        }

        const isMatch = await user.comparePassword(oldPassword);
        if (!isMatch) {
            throw new Error('Incorrect old password');
        }

        user.password = newPassword;
        await user.save();

        const log = new Log({
            userId: sanitizedUserId,
            action: 'Change Password',
            details: `User ${sanitizedUserId} changed their password`
        });
        await log.save();

        console.log(`Password changed successfully for user ${sanitizedUserId}`);
        return { message: 'Password changed successfully' };
    } catch (error) {
        console.error(`Error in changePassword: ${error.message}`);
        throw error;
    }
}

async function forgotPassword(userId, phone) {
    try {
        validatePhone(phone);
        const sanitizedUserId = sanitizeInput(userId);
        const sanitizedPhone = sanitizeInput(phone);

        const user = await User.findOne({ userId: sanitizedUserId, phone: sanitizedPhone });
        if (!user) {
            throw new Error('User or phone not found');
        }

        if (!user.isPhoneVerified) {
            throw new Error('Phone number not verified');
        }

        const { otp, otpExpires } = await sendOTP(sanitizedPhone);
        user.otp = otp;
        user.otpExpires = otpExpires;
        user.otpAttempts = 0;
        await user.save();

        const log = new Log({
            userId: sanitizedUserId,
            action: 'Forgot Password Request',
            details: `User ${sanitizedUserId} requested password reset OTP`
        });
        await log.save();

        console.log(`OTP sent for password reset for user ${sanitizedUserId}`);
        return { message: 'OTP sent to phone for password reset', userId: sanitizedUserId, phone: sanitizedPhone };
    } catch (error) {
        console.error(`Error in forgotPassword: ${error.message}`);
        throw error;
    }
}

async function resetPassword(userId, otp, newPassword) {
    try {
        validatePassword(newPassword);
        const sanitizedUserId = sanitizeInput(userId);

        const user = await User.findOne({ userId: sanitizedUserId });
        if (!user) {
            throw new Error('User not found');
        }

        if (user.otp !== otp || user.otpExpires < Date.now()) {
            user.otpAttempts = (user.otpAttempts || 0) + 1;
            await user.save();
            throw new Error('Invalid or expired OTP');
        }

        user.password = newPassword;
        user.otp = undefined;
        user.otpExpires = undefined;
        user.otpAttempts = 0;
        await user.save();

        const log = new Log({
            userId: sanitizedUserId,
            action: 'Reset Password',
            details: `User ${sanitizedUserId} reset their password`
        });
        await log.save();

        console.log(`Password reset successfully for user ${sanitizedUserId}`);
        return { message: 'Password reset successfully' };
    } catch (error) {
        console.error(`Error in resetPassword: ${error.message}`);
        throw error;
    }
}

async function lockUnlockAccount(authorityUserId, targetUserId, lock) {
    try {
        const sanitizedAuthorityUserId = sanitizeInput(authorityUserId);
        const sanitizedTargetUserId = sanitizeInput(targetUserId);

        const authority = await User.findOne({ userId: sanitizedAuthorityUserId, org: 'Org1' });
        if (!authority) {
            throw new Error('Only Org1 users can lock/unlock accounts');
        }

        const user = await User.findOne({ userId: sanitizedTargetUserId });
        if (!user) {
            throw new Error('Target user not found');
        }

        user.isLocked = lock;
        await user.save();

        const action = lock ? 'Lock Account' : 'Unlock Account';
        const log = new Log({
            userId: sanitizedAuthorityUserId,
            action,
            details: `User ${sanitizedTargetUserId} ${lock ? 'locked' : 'unlocked'} by ${sanitizedAuthorityUserId}`
        });
        await log.save();

        console.log(`User ${sanitizedTargetUserId} ${lock ? 'locked' : 'unlocked'} successfully`);
        return { message: `User ${sanitizedTargetUserId} ${lock ? 'locked' : 'unlocked'} successfully` };
    } catch (error) {
        console.error(`Error in lockUnlockAccount: ${error.message}`);
        throw error;
    }
}

module.exports = { changePassword, forgotPassword, resetPassword, lockUnlockAccount };