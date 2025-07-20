'use strict';

const validator = require('validator');

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const cccdRegex = /^\d{12}$/;
const cmndRegex = /^\d{9}$/;
const phoneRegex = /^(?:\+84|0)(3[2-9]|5[689]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}$/;

class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}

function validatePassword(password) {
    if (!password) {
        throw new ValidationError('Password is required');
    }
    if (!passwordRegex.test(password)) {
        throw new ValidationError('Password must be at least 8 characters long, include uppercase, lowercase, number, and special character');
    }
}

function validateCCCD(cccd) {
    if (!cccdRegex.test(cccd) && !cmndRegex.test(cccd)) {
        throw new ValidationError('CCCD must be 9 or 12 digits');
    }
}

function validatePhone(phone) {
    if (!phoneRegex.test(phone)) {
        throw new ValidationError('Invalid Vietnamese phone number');
    }
}

function sanitizeInput(input) {
    return validator.escape(input);
}

function validateOrg(org) {
    const validOrgs = ['Org1', 'Org2', 'Org3'];
    if (!validOrgs.includes(org)) {
        throw new ValidationError('Organization must be Org1, Org2, or Org3');
    }
}

module.exports = { validatePassword, validateCCCD, validatePhone, sanitizeInput, validateOrg };