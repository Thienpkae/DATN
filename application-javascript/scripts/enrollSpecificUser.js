const mongoose = require('mongoose');
const User = require('../models/User');
const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../enroll/CAUtil.js');
const { buildCCPOrg1, buildCCPOrg2, buildCCPOrg3, buildWallet } = require('../enroll/AppUtil.js');
const path = require('path');

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

async function enrollSpecificUser(cccd) {
    try {
        await mongoose.connect('mongodb://admin:admin123@localhost:27017/land?authSource=admin');
        console.log('Connected to MongoDB');
        
        const user = await User.findOne({cccd: cccd});
        if (!user) {
            console.log('User not found');
            return;
        }
        
        console.log(`Found user: ${user.fullName}, Org: ${user.org}, CCCD: ${user.cccd}`);
        
        await enrollUserInFabricCA({
            cccd: user.cccd,
            fullName: user.fullName,
            org: user.org,
            role: user.role
        });
        
        console.log('✅ Successfully enrolled user in Fabric CA');
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB connection closed');
    }
}

// Get CCCD from command line argument
const cccd = process.argv[2];
if (!cccd) {
    console.log('Usage: node enrollSpecificUser.js <CCCD>');
    console.log('Example: node enrollSpecificUser.js 000000000011');
    process.exit(1);
}

enrollSpecificUser(cccd);
