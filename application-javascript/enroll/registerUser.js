'use strict';

const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const mongoose = require('mongoose');
const admin = require('../models/firebaseConfig'); 
const { buildCAClient, registerAndEnrollUser } = require('./CAUtil.js');
const { buildCCPOrg1, buildCCPOrg2, buildCCPOrg3, buildWallet } = require('./AppUtil.js');  
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
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`Generated OTP for ${phone}: ${otp}`);
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
        return { otp, otpExpires, phone };
    } catch (error) {
        throw new Error(`Error preparing OTP: ${error.message}`);
    }
}

async function verifyOTP(phone, otp, userId) {
    try {
        const user = await User.findOne({ userId });
        if (!user || user.phone !== phone) {
            throw new Error('User or phone not found');
        }
        if (user.otp !== otp) {
            throw new Error('Invalid OTP');
        }
        return true;
    } catch (error) {
        throw new Error(`Error verifying OTP: ${error.message}`);
    }
}

async function registerUser(org, userId, cccd, phone, fullName, role, password) {
    try {
        const existingUser = await User.findOne({ $or: [{ userId }, { cccd }, { phone }] });
        if (existingUser) {
            if (existingUser.userId === userId) {
                throw new Error('User ID already exists');
            } else if (existingUser.cccd === cccd) {
                throw new Error('CCCD already exists');
            } else if (existingUser.phone === phone) {
                throw new Error('Phone number already exists');
            }
        }

        const { otp, otpExpires } = await sendOTP(phone);

        const tempUser = new User({
            userId,
            cccd,
            phone,
            fullName,
            role,
            org,
            password,
            otp,
            otpExpires,
            isPhoneVerified: false
        });
        await tempUser.save();
        console.log(`Saved temporary user ${userId} to MongoDB with OTP`);

        return { message: 'OTP sent to phone', userId, phone };
    } catch (error) {
        console.error(`Error in registering user: ${error}`);
        throw error;
    }
}

async function verifyUser(userId, otp) {
    try {
        const user = await User.findOne({ userId });
        if (!user) {
            throw new Error('User not found');
        }

        if (user.isPhoneVerified) {
            throw new Error('Phone number already verified');
        }

        if (user.otpExpires < Date.now()) {
            throw new Error('OTP expired');
        }

        const isValidOTP = await verifyOTP(user.phone, otp, userId);
        if (!isValidOTP) {
            throw new Error('Invalid OTP');
        }

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
            throw new Error('Organization must be Org1, Org2 or Org3');
        }

        const wallet = await buildWallet(Wallets, walletPath);
        const attributes = [
            { name: 'cccd', value: user.cccd, ecert: true },
            { name: 'role', value: user.role, ecert: true }
        ];
        await registerAndEnrollUser(caClient, wallet, msp, user.userId, affiliation, attributes);

        user.isPhoneVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        const log = new Log({
            userId,
            action: 'User Registration',
            details: `User ${userId} successfully registered and verified phone`
        });
        await log.save();

        console.log(`Successfully registered user ${userId} for ${user.org}`);
        return { message: 'User registered successfully' };
    } catch (error) {
        console.error(`Error in verifying user: ${error}`);
        throw error;
    }
}

module.exports = { registerUser, verifyUser, sendOTP };

async function main() {
    try {
        if (process.argv.length < 9) {
            console.log('Usage: node registerUser.js <Org> <userId> <cccd> <phone> <fullName> <role> <password>');
            process.exit(1);
        }
        await connectMongoDB();
        const org = process.argv[2];
        const userId = process.argv[3];
        const cccd = process.argv[4];
        const phone = process.argv[5];
        const fullName = process.argv[6];
        const role = process.argv[7];
        const password = process.argv[8];
        await registerUser(org, userId, cccd, phone, fullName, role, password);
        mongoose.disconnect();
    } catch (error) {
        console.error(`Error: ${error}`);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
