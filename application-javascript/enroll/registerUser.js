'use strict';

const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const mongoose = require('mongoose');
const admin = require('../models/firebaseConfig'); 
const { buildCAClient, registerAndEnrollUser } = require('./CAUtil.js');
const { buildCCPOrg1, buildCCPOrg2, buildCCPOrg3, buildWallet } = require('./AppUtil.js');  
const { validatePassword, validateCCCD, validatePhone, sanitizeInput, validateOrg } = require('./validation');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');
const Log = require('../models/Log');

const mspOrg1 = 'Org1MSP';
const mspOrg2 = 'Org2MSP';
const mspOrg3 = 'Org3MSP';

async function connectMongoDB() {
    try {
        console.log('MONGO_URI:', process.env.MONGO_URI);
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined in .env');
        }
        await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected to MongoDB');
        console.log(`Today's date and time is ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })}`);
    } catch (error) {
        console.error(`Failed to connect to MongoDB: ${error}`);
        process.exit(1);
    }
}

async function sendOTP(phone) {
    try {
        validatePhone(phone);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`Generated OTP for ${phone}: ${otp}`);
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
        return { otp, otpExpires, phone };
    } catch (error) {
        console.error(`Error preparing OTP: ${error.message}`);
        throw error;
    }
}

async function verifyOTP(phone, otp, cccd) {
    try {
        const user = await User.findOne({ cccd });
        if (!user || user.phone !== phone) {
            throw new Error('User or phone not found');
        }
        if (user.otpAttempts >= 5) {
            throw new Error('Too many OTP attempts. Please try again later.');
        }
        if (user.otp !== otp) {
            user.otpAttempts = (user.otpAttempts || 0) + 1;
            await user.save();
            throw new Error('Invalid OTP');
        }
        return true;
    } catch (error) {
        console.error(`Error verifying OTP for CCCD ${cccd}: ${error.message}`);
        throw error;
    }
}

async function registerUser(org, cccd, phone, fullName, password, role = 'user') {
    try {
        validateOrg(org);
        validateCCCD(cccd);
        validatePhone(phone);
        validatePassword(password);

        const sanitizedCccd = sanitizeInput(cccd);
        const sanitizedPhone = sanitizeInput(phone);
        const sanitizedFullName = sanitizeInput(fullName);

        const existingUser = await User.findOne({ $or: [{ cccd: sanitizedCccd }, { phone: sanitizedPhone }] });
        if (existingUser) {
            if (existingUser.cccd === sanitizedCccd) {
                throw new Error('CCCD already exists');
            } else if (existingUser.phone === sanitizedPhone) {
                throw new Error('Phone number already exists');
            }
        }

        const { otp, otpExpires } = await sendOTP(sanitizedPhone);

        const tempUser = new User({
            cccd: sanitizedCccd,
            phone: sanitizedPhone,
            fullName: sanitizedFullName,
            org,
            role,
            password,
            otp,
            otpExpires,
            otpAttempts: 0,
            isPhoneVerified: false,
            isLocked: false
        });
        await tempUser.save();
        console.log(`Saved temporary user with CCCD ${sanitizedCccd} to MongoDB with OTP`);

        return { message: 'OTP sent to phone', cccd: sanitizedCccd, phone: sanitizedPhone };
    } catch (error) {
        console.error(`Error in registering user: ${error}`);
        throw error;
    }
}

async function verifyUser(cccd, otp) {
    try {
        const user = await User.findOne({ cccd });
        if (!user) {
            throw new Error('User not found');
        }

        if (user.isPhoneVerified) {
            throw new Error('Phone number already verified');
        }

        if (user.otpExpires < Date.now()) {
            throw new Error('OTP expired');
        }

        await verifyOTP(user.phone, otp, cccd);

        let ccp, caClient, walletPath, msp, affiliation;
        if (user.org === 'Org1') {
            ccp = buildCCPOrg1();
            caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
            walletPath = path.join(__dirname, '../wallet/org1');
            msp = mspOrg1;
            affiliation = 'org1.department1';
        } else if (user.org === 'Org2') {
            ccp = buildCCPOrg2();
            caClient = buildCAClient(FabricCAServices, ccp, 'ca.org2.example.com');
            walletPath = path.join(__dirname, '../wallet/org2');
            msp = mspOrg2;
            affiliation = 'org2.department1';
        } else if (user.org === 'Org3') {
            ccp = buildCCPOrg3();
            caClient = buildCAClient(FabricCAServices, ccp, 'ca.org3.example.com');
            walletPath = path.join(__dirname, '../wallet/org3');
            msp = mspOrg3;
            affiliation = 'org3.department1';
        } else {
            throw new Error('Invalid organization');
        }

        const wallet = await buildWallet(Wallets, walletPath);
        const attributes = [
            { name: 'cccd', value: user.cccd, ecert: true }
        ];
        const enrolled = await registerAndEnrollUser(caClient, wallet, msp, user.cccd, affiliation, attributes);
        if (!enrolled) {
            throw new Error('User was not enrolled by CA');
        }

        // Double-check identity exists in wallet before marking verified
        const checkIdentity = await wallet.get(user.cccd);
        if (!checkIdentity) {
            throw new Error('Identity not found in wallet after enrollment');
        }

        user.isPhoneVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        user.otpAttempts = 0;
        await user.save();

        const log = new Log({
            cccd,
            action: 'User Registration',
            details: `User with CCCD ${cccd} successfully registered and verified phone`
        });
        await log.save();

        console.log(`Successfully registered user with CCCD ${cccd} for ${user.org}`);
        return { message: 'User registered successfully', cccd: user.cccd, phone: user.phone };
    } catch (error) {
        console.error(`Error in verifying user: ${error}`);
        throw error;
    }
}

module.exports = { registerUser, verifyUser, sendOTP };

async function main() {
    try {
        if (process.argv.length < 7) {
            console.log('Usage: node registerUser.js <Org> <cccd> <phone> <fullName> <password> <role>');
            process.exit(1);
        }
        await connectMongoDB();
        const org = process.argv[2];
        const cccd = process.argv[3];
        const phone = process.argv[4];
        const fullName = process.argv[5];
        const password = process.argv[6];
        const role = process.argv[7];
        await registerUser(org, cccd, phone, fullName, password, role);
        mongoose.disconnect();
    } catch (error) {
        console.error(`Error: ${error}`);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}