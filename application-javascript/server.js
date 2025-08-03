'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const { buildCCPOrg1, buildCCPOrg2, buildCCPOrg3, buildWallet } = require('./enroll/AppUtil.js');
const { registerUser, verifyUser, sendOTP } = require('./enroll/registerUser.js');
const { changePassword, forgotPassword, resetPassword, lockUnlockAccount, deleteAccount } = require('./enroll/accountManager.js');
const { validatePassword, validateCCCD, validatePhone, sanitizeInput, validateOrg } = require('./enroll/validation.js');
const User = require('./models/User');
const cors = require('cors');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

const app = express();
const port = 3000;
const myChannel = 'mychannel';
const myChaincodeName = 'land-cc';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    console.error('JWT_SECRET is not defined in .env');
    process.exit(1);
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// CORS configuration
app.use(cors({
    origin: ['http://localhost:5000', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Kết nối MongoDB
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

// Initialize admin accounts for each organization
async function initializeAdminAccounts() {
    try {
        console.log('Checking for admin accounts...');
        
        const adminAccounts = [
            {
                cccd: '000000000001',
                phone: '0900000001',
                fullName: 'Admin Organization 1',
                org: 'Org1',
                role: 'admin',
                password: 'Admin123!',
                isPhoneVerified: true,
                isLocked: false
            },
            {
                cccd: '000000000002',
                phone: '0900000002',
                fullName: 'Admin Organization 2',
                org: 'Org2',
                role: 'admin',
                password: 'Admin123!',
                isPhoneVerified: true,
                isLocked: false
            },
            {
                cccd: '000000000003',
                phone: '0900000003',
                fullName: 'Admin Organization 3',
                org: 'Org3',
                role: 'admin',
                password: 'Admin123!',
                isPhoneVerified: true,
                isLocked: false
            }
        ];

        for (const adminData of adminAccounts) {
            const existingAdmin = await User.findOne({ cccd: adminData.cccd });
            
            if (!existingAdmin) {
                // Create admin in MongoDB
                const admin = new User(adminData);
                await admin.save();
                console.log(`Created admin account for ${adminData.org}: ${adminData.cccd}`);
                
                // Register admin with Fabric network
                try {
                    await registerAdminWithFabric(adminData.org, adminData.cccd);
                    console.log(`Registered ${adminData.cccd} with Fabric network for ${adminData.org}`);
                } catch (fabricError) {
                    console.log(`Admin ${adminData.cccd} may already be registered with Fabric: ${fabricError.message}`);
                }
            } else {
                console.log(`Admin account already exists for ${adminData.org}: ${adminData.cccd}`);
            }
        }
        
        console.log('Admin accounts initialization completed');
    } catch (error) {
        console.error(`Failed to initialize admin accounts: ${error.message}`);
    }
}

// Register admin with Fabric network
async function registerAdminWithFabric(org, cccd) {
    const { registerAndEnrollUser } = require('./enroll/CAUtil.js');
    
    let ccp, walletPath, msp;
    if (org === 'Org1') {
        ccp = buildCCPOrg1();
        walletPath = path.join(__dirname, './wallet/org1');
        msp = 'Org1MSP';
    } else if (org === 'Org2') {
        ccp = buildCCPOrg2();
        walletPath = path.join(__dirname, './wallet/org2');
        msp = 'Org2MSP';
    } else if (org === 'Org3') {
        ccp = buildCCPOrg3();
        walletPath = path.join(__dirname, './wallet/org3');
        msp = 'Org3MSP';
    } else {
        throw new Error('Invalid organization');
    }

    const caClient = require('./enroll/CAUtil.js').buildCAClient(
        require('fabric-ca-client'), 
        ccp, 
        `ca.${org.toLowerCase()}.example.com`
    );
    const wallet = await buildWallet(Wallets, walletPath);
    
    await registerAndEnrollUser(caClient, wallet, msp, cccd, `${org.toLowerCase()}.department1`, []);
}

// Middleware xác thực JWT
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

// Middleware kiểm tra quyền admin
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin privileges required' });
    }
    next();
};

// Middleware kiểm tra quyền truy cập theo tổ chức
const checkOrg = (allowedOrgs) => (req, res, next) => {
    if (!allowedOrgs.includes(req.user.org)) {
        return res.status(403).json({ error: `Access denied, organization ${req.user.org} not allowed. Required: ${allowedOrgs.join(' or ')}` });
    }
    next();
};

// Kết nối với Hyperledger Fabric
async function connectToNetwork(org, cccd) {
    let ccp, walletPath;
    if (org === 'Org1') {
        ccp = buildCCPOrg1();
        walletPath = path.join(__dirname, './wallet/org1');
    } else if (org === 'Org2') {
        ccp = buildCCPOrg2();
        walletPath = path.join(__dirname, './wallet/org2');
    } else if (org === 'Org3') {
        ccp = buildCCPOrg3();
        walletPath = path.join(__dirname, './wallet/org3');
    } else {
        throw new Error('Organization must be Org1, Org2, or Org3');
    }

    const wallet = await buildWallet(Wallets, walletPath);
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: cccd, discovery: { enabled: true, asLocalhost: true } });
    const network = await gateway.getNetwork(myChannel);
    const contract = network.getContract(myChaincodeName);

    return { gateway, contract };
}

// Đăng ký người dùng
app.post('/register', async (req, res, next) => {
    const { org, cccd, phone, fullName, password, role } = req.body;
    // If not authenticated, only allow citizen registration (Org3, role user)
    if (!req.headers.authorization) {
        // Citizen self-register
        try {
            if (org && org !== 'Org3') {
                return res.status(403).json({ error: 'Citizens can only register for Org3' });
            }
            const result = await registerUser('Org3', cccd, phone, fullName, password, 'user');
            res.json(result);
        } catch (error) {
            console.error('Registration error:', error);
            
            // Handle specific MongoDB duplicate key errors
            if (error.code === 11000) {
                const field = Object.keys(error.keyPattern || {})[0];
                if (field === 'cccd') {
                    return res.status(400).json({ error: 'CCCD already exists' });
                } else if (field === 'phone') {
                    return res.status(400).json({ error: 'Phone number already exists' });
                } else if (field === 'userId') {
                    return res.status(400).json({ error: 'User ID already exists' });
                } else {
                    return res.status(400).json({ error: 'Duplicate entry found' });
                }
            }
            
            res.status(400).json({ error: error.message });
        }
        return;
    }
    // If authenticated, require admin
    authenticateJWT(req, res, async () => {
        requireAdmin(req, res, async () => {
            try {
                validateOrg(org);
                validateCCCD(cccd);
                validatePhone(phone);
                validatePassword(password);
                const sanitizedFullName = sanitizeInput(fullName);
                const userRole = role === 'admin' ? 'admin' : 'user';
                const result = await registerUser(org, cccd, phone, sanitizedFullName, password, userRole);
                res.json(result);
            } catch (error) {
                console.error('Admin registration error:', error);
                
                // Handle specific MongoDB duplicate key errors
                if (error.code === 11000) {
                    const field = Object.keys(error.keyPattern || {})[0];
                    if (field === 'cccd') {
                        return res.status(400).json({ error: 'CCCD already exists' });
                    } else if (field === 'phone') {
                        return res.status(400).json({ error: 'Phone number already exists' });
                    } else if (field === 'userId') {
                        return res.status(400).json({ error: 'User ID already exists' });
                    } else {
                        return res.status(400).json({ error: 'Duplicate entry found' });
                    }
                }
                
                res.status(400).json({ error: error.message });
            }
        });
    });
});

// Gửi lại OTP
app.post('/resend-otp', async (req, res) => {
    const { cccd } = req.body;
    try {
        const user = await User.findOne({ cccd });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (user.isPhoneVerified) {
            return res.status(400).json({ error: 'Phone number already verified' });
        }
        const { otp, otpExpires } = await sendOTP(user.phone);
        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();
        res.json({ message: 'OTP resent to phone', phone: user.phone });
    } catch (error) {
        res.status(500).json({ error: `Failed to resend OTP: ${error.message}` });
    }
});

// Xác minh OTP
app.post('/verify-otp', async (req, res) => {
    const { cccd, otp } = req.body;
    try {
        const result = await verifyUser(cccd, otp);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Đăng nhập
app.post('/login', async (req, res) => {
    const { phone, cccd, password } = req.body;
    try {
        let user;
        if (phone) {
            user = await User.findOne({ phone });
        } else if (cccd) {
            user = await User.findOne({ cccd });
        }
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        if (user.isLocked) {
            return res.status(403).json({ error: 'Account is locked' });
        }
        if (!user.isPhoneVerified) {
            return res.status(403).json({ error: 'Phone number not verified' });
        }
        if (!await user.comparePassword(password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ cccd: user.cccd, org: user.org }, jwtSecret, { expiresIn: '1h' });
        res.json({ message: 'Login successful', token });
    } catch (error) {
        res.status(500).json({ error: `Login failed: ${error.message}` });
    }
});

// Đăng xuất
app.post('/logout', authenticateJWT, async (req, res) => {
    try {
        // In a stateless JWT system, logout is primarily handled client-side
        // by removing the token. This endpoint is for logging purposes.
        res.json({ message: 'Logout successful' });
    } catch (error) {
        res.status(500).json({ error: `Logout failed: ${error.message}` });
    }
});

// Đổi mật khẩu
app.post('/change-password', authenticateJWT, async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const { cccd } = req.user;
    try {
        // Validate new password strength
        validatePassword(newPassword);
        
        // Check password confirmation if provided
        if (confirmPassword && newPassword !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }
        
        const result = await changePassword(cccd, oldPassword, newPassword);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Quên mật khẩu
app.post('/forgot-password', async (req, res) => {
    const { cccd, phone } = req.body;
    try {
        const result = await forgotPassword(cccd, phone);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Đặt lại mật khẩu
app.post('/reset-password', async (req, res) => {
    const { cccd, otp, newPassword } = req.body;
    try {
        // Validate new password strength
        validatePassword(newPassword);
        
        const result = await resetPassword(cccd, otp, newPassword);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Khóa/Mở khóa tài khoản (chỉ Org1 - Authority có quyền)
app.post('/account/lock-unlock', authenticateJWT, requireAdmin, async (req, res) => {
    const { targetCccd, lock } = req.body;
    const { cccd } = req.user;
    try {
        const result = await lockUnlockAccount(cccd, targetCccd, lock);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Xóa tài khoản (chỉ admin)
app.delete('/account/delete', authenticateJWT, requireAdmin, async (req, res) => {
    const { targetCccd } = req.body;
    if (!targetCccd) {
        return res.status(400).json({ error: 'targetCccd is required' });
    }
    try {
        const result = await deleteAccount(req.user.cccd, targetCccd);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Tạo thửa đất (Org1 - authority organizations)
app.post('/land-parcels', authenticateJWT, checkOrg(['Org1']), async (req, res) => {
    const { id, ownerID, location, landUsePurpose, legalStatus, area } = req.body;
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const statefulTxn = contract.createTransaction('CreateLandParcel');
        statefulTxn.setEndorsingOrganizations('Org1MSP', 'Org2MSP');
        await statefulTxn.submit(id, ownerID, location, landUsePurpose, legalStatus, area.toString(), cccd);
        const result = await contract.evaluateTransaction('QueryLandParcelByID', id, cccd);
        gateway.disconnect();
        res.json({ message: 'Land parcel created', landParcel: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to create land parcel: ${error.message}` });
    }
});

// Update Land Parcel endpoint
app.put('/land-parcels/:landParcelID', authenticateJWT, checkOrg(['Org1']), async (req, res) => {
    const { landParcelID } = req.params;
    const { area, location, purpose, ownerID } = req.body;
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const statefulTxn = contract.createTransaction('UpdateLandParcel');
        statefulTxn.setEndorsingOrganizations('Org1MSP', 'Org2MSP');
        await statefulTxn.submit(landParcelID, area.toString(), location, purpose, ownerID);
        const result = await contract.evaluateTransaction('QueryLandParcelByID', landParcelID, cccd);
        gateway.disconnect();
        res.json({ message: 'Land parcel updated successfully', landParcel: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to update land parcel: ${error.message}` });
    }
});

// Tải lên tài liệu (tất cả các tổ chức)
app.post('/documents', authenticateJWT, checkOrg(['Org1', 'Org2', 'Org3']), async (req, res) => {
    const { docID, landParcelID, txID, ipfsHash, description } = req.body;
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const statefulTxn = contract.createTransaction('UploadDocument');
        statefulTxn.setEndorsingOrganizations('Org1MSP', 'Org2MSP');
        await statefulTxn.submit(docID, landParcelID, txID || '', ipfsHash, description, cccd);
        const result = await contract.evaluateTransaction('QueryDocumentByID', docID, cccd);
        gateway.disconnect();
        res.json({ message: 'Document uploaded', document: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to upload document: ${error.message}` });
    }
});

// Chứng thực tài liệu (Org1, Org2 - officer organizations)
app.post('/documents/:docID/verify', authenticateJWT, checkOrg(['Org1', 'Org2']), async (req, res) => {
    const { docID } = req.params;
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const statefulTxn = contract.createTransaction('VerifyDocument');
        statefulTxn.setEndorsingOrganizations('Org1MSP', 'Org2MSP');
        await statefulTxn.submit(docID);
        const result = await contract.evaluateTransaction('QueryDocumentByID', docID, cccd);
        gateway.disconnect();
        res.json({ message: 'Document verified', document: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to verify document: ${error.message}` });
    }
});

// Update Document endpoint
app.put('/documents/:documentID', authenticateJWT, checkOrg(['Org1']), async (req, res) => {
    const { documentID } = req.params;
    const { ipfsHash, metadata } = req.body;
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const statefulTxn = contract.createTransaction('UpdateDocument');
        statefulTxn.setEndorsingOrganizations('Org1MSP', 'Org2MSP');
        await statefulTxn.submit(documentID, ipfsHash, JSON.stringify(metadata));
        const result = await contract.evaluateTransaction('QueryDocumentByID', documentID, cccd);
        gateway.disconnect();
        res.json({ message: 'Document updated successfully', document: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to update document: ${error.message}` });
    }
});

app.post('/transactions/:txID/process', authenticateJWT, checkOrg(['Org2']), async (req, res) => {
    const { txID } = req.params;
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const statefulTxn = contract.createTransaction('ProcessTransaction');
        statefulTxn.setEndorsingOrganizations('Org1MSP', 'Org2MSP');
        await statefulTxn.submit(txID);
        const result = await contract.evaluateTransaction('QueryTransactionByID', txID, cccd);
        gateway.disconnect();
        res.json({ message: 'Transaction processed', transaction: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to process transaction: ${error.message}` });
    }
});

// Other existing routes remain unchanged
app.post('/certificates', authenticateJWT, checkOrg(['Org1']), async (req, res) => {
    const { certificateID, landParcelID, ownerID, legalInfo } = req.body;
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const statefulTxn = contract.createTransaction('IssueLandCertificate');
        statefulTxn.setEndorsingOrganizations('Org1MSP', 'Org2MSP');
        await statefulTxn.submit(certificateID, landParcelID, ownerID, legalInfo);
        const result = await contract.evaluateTransaction('QueryCertificateByID', certificateID, cccd);
        gateway.disconnect();
        res.json({ message: 'Certificate issued', certificate: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to issue certificate: ${error.message}` });
    }
});

app.post('/transfer-requests', authenticateJWT, checkOrg(['Org3']), async (req, res) => {
    const { txID, landParcelID, fromOwnerID, toOwnerID, details } = req.body;
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const statefulTxn = contract.createTransaction('CreateTransferRequest');
        statefulTxn.setEndorsingOrganizations('Org2MSP', 'Org3MSP');
        await statefulTxn.submit(txID, landParcelID, fromOwnerID, toOwnerID, details);
        const result = await contract.evaluateTransaction('QueryTransactionByID', txID, cccd);
        gateway.disconnect();
        res.json({ message: 'Transfer request created', transaction: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to create transfer request: ${error.message}` });
    }
});

app.post('/transfer-requests/:txID/confirm', authenticateJWT, checkOrg(['Org3']), async (req, res) => {
    const { txID } = req.params;
    const { toOwnerID, agree } = req.body;
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const statefulTxn = contract.createTransaction('ConfirmTransfer');
        statefulTxn.setEndorsingOrganizations('Org1MSP', 'Org3MSP');
        await statefulTxn.submit(txID, toOwnerID, agree.toString());
        const result = await contract.evaluateTransaction('QueryTransactionByID', txID, cccd);
        gateway.disconnect();
        res.json({ message: 'Transfer confirmed', transaction: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to confirm transfer: ${error.message}` });
    }
});

app.post('/split-requests', authenticateJWT, checkOrg(['Org3']), async (req, res) => {
    const { txID, landParcelID, ownerID, newParcels } = req.body;
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const statefulTxn = contract.createTransaction('CreateSplitRequest');
        statefulTxn.setEndorsingOrganizations('Org1MSP', 'Org3MSP');
        await statefulTxn.submit(txID, landParcelID, ownerID, JSON.stringify(newParcels));
        const result = await contract.evaluateTransaction('QueryTransactionByID', txID, cccd);
        gateway.disconnect();
        res.json({ message: 'Split request created', transaction: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to create split request: ${error.message}` });
    }
});

app.post('/merge-requests', authenticateJWT, checkOrg(['Org3']), async (req, res) => {
    const { txID, ownerID, parcelIDs, newParcel } = req.body;
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const statefulTxn = contract.createTransaction('CreateMergeRequest');
        statefulTxn.setEndorsingOrganizations('Org1MSP', 'Org3MSP');
        await statefulTxn.submit(txID, ownerID, JSON.stringify(parcelIDs), JSON.stringify(newParcel));
        const result = await contract.evaluateTransaction('QueryTransactionByID', txID, cccd);
        gateway.disconnect();
        res.json({ message: 'Merge request created', transaction: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to create merge request: ${error.message}` });
    }
});

app.post('/change-purpose-requests', authenticateJWT, checkOrg(['Org3']), async (req, res) => {
    const { txID, landParcelID, ownerID, newPurpose, details } = req.body;
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const statefulTxn = contract.createTransaction('CreateChangePurposeRequest');
        statefulTxn.setEndorsingOrganizations('Org1MSP', 'Org3MSP');
        await statefulTxn.submit(txID, landParcelID, ownerID, newPurpose, details);
        const result = await contract.evaluateTransaction('QueryTransactionByID', txID, cccd);
        gateway.disconnect();
        res.json({ message: 'Change purpose request created', transaction: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to create change purpose request: ${error.message}` });
    }
});

app.post('/reissue-requests', authenticateJWT, checkOrg(['Org3']), async (req, res) => {
    const { txID, landParcelID, ownerID, details } = req.body;
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const statefulTxn = contract.createTransaction('CreateReissueRequest');
        statefulTxn.setEndorsingOrganizations('Org1MSP', 'Org3MSP');
        await statefulTxn.submit(txID, landParcelID, ownerID, details);
        const result = await contract.evaluateTransaction('QueryTransactionByID', txID, cccd);
        gateway.disconnect();
        res.json({ message: 'Reissue request created', transaction: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to create reissue request: ${error.message}` });
    }
});

app.post('/transactions/:txID/forward', authenticateJWT, checkOrg(['Org2']), async (req, res) => {
    const { txID } = req.params;
    const { forwardDetails } = req.body;
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const statefulTxn = contract.createTransaction('ForwardTransaction');
        statefulTxn.setEndorsingOrganizations('Org1MSP', 'Org2MSP');
        await statefulTxn.submit(txID, forwardDetails);
        const result = await contract.evaluateTransaction('QueryTransactionByID', txID, cccd);
        gateway.disconnect();
        res.json({ message: 'Transaction forwarded', transaction: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to forward transaction: ${error.message}` });
    }
});

app.post('/transactions/:txID/approve', authenticateJWT, checkOrg(['Org1']), async (req, res) => {
    const { txID } = req.params;
    const { approveDetails } = req.body;
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const statefulTxn = contract.createTransaction('ApproveTransaction');
        statefulTxn.setEndorsingOrganizations('Org1MSP', 'Org2MSP');
        await statefulTxn.submit(txID, approveDetails);
        const result = await contract.evaluateTransaction('QueryTransactionByID', txID, cccd);
        gateway.disconnect();
        res.json({ message: 'Transaction approved', transaction: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to approve transaction: ${error.message}` });
    }
});

app.post('/transactions/:txID/reject', authenticateJWT, checkOrg(['Org1']), async (req, res) => {
    const { txID } = req.params;
    const { rejectDetails } = req.body;
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const statefulTxn = contract.createTransaction('RejectTransaction');
        statefulTxn.setEndorsingOrganizations('Org1MSP', 'Org2MSP');
        await statefulTxn.submit(txID, rejectDetails);
        const result = await contract.evaluateTransaction('QueryTransactionByID', txID, cccd);
        gateway.disconnect();
        res.json({ message: 'Transaction rejected', transaction: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to reject transaction: ${error.message}` });
    }
});

app.get('/land-parcels/:id', authenticateJWT, checkOrg(['Org1', 'Org2', 'Org3']), async (req, res) => {
    const { id } = req.params;
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const result = await contract.evaluateTransaction('QueryLandParcelByID', id, cccd);
        gateway.disconnect();
        res.json({ landParcel: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to query land parcel: ${error.message}` });
    }
});

app.get('/land-parcels/owner/:ownerID', authenticateJWT, checkOrg(['Org1', 'Org2', 'Org3']), async (req, res) => {
    const { ownerID } = req.params;
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const result = await contract.evaluateTransaction('QueryByKeyword', 'landparcel', '', JSON.stringify({ ownerId: ownerID }), cccd);
        gateway.disconnect();
        res.json({ landParcels: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to query land parcels by owner: ${error.message}` });
    }
});

app.get('/land-parcels/search', authenticateJWT, checkOrg(['Org1', 'Org2']), async (req, res) => {
    const { keyword } = req.query;
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const result = await contract.evaluateTransaction('QueryByKeyword', 'landparcel', keyword || '', '{}', cccd);
        gateway.disconnect();
        res.json({ landParcels: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to search land parcels: ${error.message}` });
    }
});

app.get('/certificates/owner/:ownerID', authenticateJWT, checkOrg(['Org1', 'Org2', 'Org3']), async (req, res) => {
    const { ownerID } = req.params;
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const result = await contract.evaluateTransaction('QueryByKeyword', 'landcertificate', '', JSON.stringify({ ownerId: ownerID }), cccd);
        gateway.disconnect();
        res.json({ certificates: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to query certificates by owner: ${error.message}` });
    }
});

app.get('/certificates/:certificateID', authenticateJWT, checkOrg(['Org1', 'Org2', 'Org3']), async (req, res) => {
    const { certificateID } = req.params;
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const result = await contract.evaluateTransaction('QueryCertificateByID', certificateID, cccd);
        gateway.disconnect();
        res.json({ certificate: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to query certificate: ${error.message}` });
    }
});

app.get('/certificates/land-parcel/:landParcelID', authenticateJWT, checkOrg(['Org1', 'Org2', 'Org3']), async (req, res) => {
    const { landParcelID } = req.params;
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const result = await contract.evaluateTransaction('QueryByKeyword', 'landcertificate', '', JSON.stringify({ landParcelId: landParcelID }), cccd);
        gateway.disconnect();
        res.json({ certificates: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to query certificates by land parcel: ${error.message}` });
    }
});

app.get('/certificates/search', authenticateJWT, checkOrg(['Org1', 'Org2']), async (req, res) => {
    const { keyword, startDate, endDate } = req.query;
    const { cccd, org } = req.user;

    try {
        const filters = { startDate, endDate };
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const result = await contract.evaluateTransaction('QueryByKeyword', 'landcertificate', keyword || '', JSON.stringify(filters), cccd);
        gateway.disconnect();
        res.json({ certificates: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to search certificates: ${error.message}` });
    }
});

app.get('/transactions/:txID', authenticateJWT, checkOrg(['Org1', 'Org2', 'Org3']), async (req, res) => {
    const { txID } = req.params;
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const result = await contract.evaluateTransaction('QueryTransactionByID', txID, cccd);
        gateway.disconnect();
        res.json({ transaction: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to query transaction: ${error.message}` });
    }
});

app.get('/transactions/search', authenticateJWT, checkOrg(['Org1', 'Org2']), async (req, res) => {
    const { keyword, status, txType, startTime, endTime } = req.query;
    const { cccd, org } = req.user;

    try {
        const filters = { status, type: txType, startTime, endTime };
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const result = await contract.evaluateTransaction('QueryByKeyword', 'landtransaction', keyword || '', JSON.stringify(filters), cccd);
        gateway.disconnect();
        res.json({ transactions: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to search transactions: ${error.message}` });
    }
});

app.get('/transactions/land-parcel/:landParcelID', authenticateJWT, checkOrg(['Org1', 'Org2', 'Org3']), async (req, res) => {
    const { landParcelID } = req.params;
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const result = await contract.evaluateTransaction('QueryByKeyword', 'landtransaction', '', JSON.stringify({ landParcelId: landParcelID }), cccd);
        gateway.disconnect();
        res.json({ transactions: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to query transactions by land parcel: ${error.message}` });
    }
});

app.get('/transactions/owner/:ownerID', authenticateJWT, checkOrg(['Org1', 'Org2', 'Org3']), async (req, res) => {
    const { ownerID } = req.params;
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const result = await contract.evaluateTransaction('QueryByKeyword', 'landtransaction', '', JSON.stringify({ ownerId: ownerID }), cccd);
        gateway.disconnect();
        res.json({ transactions: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to query transactions by owner: ${error.message}` });
    }
});

app.get('/documents/:docID', authenticateJWT, checkOrg(['Org1', 'Org2', 'Org3']), async (req, res) => {
    const { docID } = req.params;
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const result = await contract.evaluateTransaction('QueryDocumentByID', docID, cccd);
        gateway.disconnect();
        res.json({ document: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to query document: ${error.message}` });
    }
});

app.get('/documents/search/:id', authenticateJWT, checkOrg(['Org1', 'Org2', 'Org3']), async (req, res) => {
    const { id } = req.params;
    const { keyword } = req.query;
    const { cccd, org } = req.user;

    try {
        const filters = { landParcelId: id };
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const result = await contract.evaluateTransaction('QueryByKeyword', 'document', keyword || '', JSON.stringify(filters), cccd);
        gateway.disconnect();
        res.json({ documents: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to search documents: ${error.message}` });
    }
});

app.get('/documents/transaction/:txID', authenticateJWT, checkOrg(['Org1', 'Org2', 'Org3']), async (req, res) => {
    const { txID } = req.params;
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const result = await contract.evaluateTransaction('QueryByKeyword', 'document', txID, '{}', cccd);
        gateway.disconnect();
        res.json({ documents: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to query documents by transaction: ${error.message}` });
    }
});

app.get('/documents/ipfs/:keyword', authenticateJWT, checkOrg(['Org1', 'Org2']), async (req, res) => {
    const { keyword } = req.params;
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const result = await contract.evaluateTransaction('QueryByKeyword', 'document', keyword, '{}', cccd);
        gateway.disconnect();
        res.json({ documents: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to query documents by IPFS hash: ${error.message}` });
    }
});

app.get('/logs/search/:txID', authenticateJWT, checkOrg(['Org1', 'Org2']), async (req, res) => {
    const { txID } = req.params;
    const { keyword } = req.query;
    const { cccd, org } = req.user;

    try {
        const filters = { txId: txID };
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const result = await contract.evaluateTransaction('QueryByKeyword', 'transactionlog', keyword || txID, JSON.stringify(filters), cccd);
        gateway.disconnect();
        res.json({ logs: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to query logs by identifier: ${error.message}` });
    }
});

// ===== ADDITIONAL COMPREHENSIVE ENDPOINTS =====

// Get all land parcels (Org1, Org2 - for management)
app.get('/land-parcels', authenticateJWT, checkOrg(['Org1', 'Org2']), async (req, res) => {
    const { cccd, org } = req.user;
    const { limit = 50, offset = 0 } = req.query;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const result = await contract.evaluateTransaction('QueryByKeyword', 'landparcel', '', '{}', cccd);
        gateway.disconnect();

        const landParcels = JSON.parse(result.toString());
        const startIndex = parseInt(offset);
        const endIndex = startIndex + parseInt(limit);
        const paginatedResults = landParcels.slice(startIndex, endIndex);

        res.json({
            landParcels: paginatedResults,
            total: landParcels.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        res.status(500).json({ error: `Failed to query all land parcels: ${error.message}` });
    }
});

// Get all certificates (Org1, Org2 - for management)
app.get('/certificates', authenticateJWT, checkOrg(['Org1', 'Org2']), async (req, res) => {
    const { cccd, org } = req.user;
    const { limit = 50, offset = 0 } = req.query;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const result = await contract.evaluateTransaction('QueryByKeyword', 'landcertificate', '', '{}', cccd);
        gateway.disconnect();

        const certificates = JSON.parse(result.toString());
        const startIndex = parseInt(offset);
        const endIndex = startIndex + parseInt(limit);
        const paginatedResults = certificates.slice(startIndex, endIndex);

        res.json({
            certificates: paginatedResults,
            total: certificates.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        res.status(500).json({ error: `Failed to query all certificates: ${error.message}` });
    }
});

// Get all transactions (Org1, Org2 - for management)
app.get('/transactions', authenticateJWT, checkOrg(['Org1', 'Org2']), async (req, res) => {
    const { cccd, org } = req.user;
    const { limit = 50, offset = 0, status } = req.query;

    try {
        const filters = status ? { status } : {};
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const result = await contract.evaluateTransaction('QueryByKeyword', 'landtransaction', '', JSON.stringify(filters), cccd);
        gateway.disconnect();

        const transactions = JSON.parse(result.toString());
        const startIndex = parseInt(offset);
        const endIndex = startIndex + parseInt(limit);
        const paginatedResults = transactions.slice(startIndex, endIndex);

        res.json({
            transactions: paginatedResults,
            total: transactions.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        res.status(500).json({ error: `Failed to query all transactions: ${error.message}` });
    }
});

// Get all documents (Org1, Org2 - for management)
app.get('/documents', authenticateJWT, checkOrg(['Org1', 'Org2']), async (req, res) => {
    const { cccd, org } = req.user;
    const { limit = 50, offset = 0, verified } = req.query;

    try {
        const filters = verified !== undefined ? { verified: verified === 'true' } : {};
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const result = await contract.evaluateTransaction('QueryByKeyword', 'document', '', JSON.stringify(filters), cccd);
        gateway.disconnect();

        const documents = JSON.parse(result.toString());
        const startIndex = parseInt(offset);
        const endIndex = startIndex + parseInt(limit);
        const paginatedResults = documents.slice(startIndex, endIndex);

        res.json({
            documents: paginatedResults,
            total: documents.length,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        res.status(500).json({ error: `Failed to query all documents: ${error.message}` });
    }
});

// Get pending documents for verification (Org2)
app.get('/documents/pending', authenticateJWT, checkOrg(['Org2']), async (req, res) => {
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const result = await contract.evaluateTransaction('QueryByKeyword', 'document', '', JSON.stringify({ verified: false }), cccd);
        gateway.disconnect();
        res.json({ documents: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to query pending documents: ${error.message}` });
    }
});

// Get dashboard statistics (All orgs)
app.get('/dashboard/stats', authenticateJWT, checkOrg(['Org1', 'Org2', 'Org3']), async (req, res) => {
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);

        let stats = {};

        if (org === 'Org3') {
            // Citizens see only their own data
            const [landParcels, certificates, transactions] = await Promise.all([
                contract.evaluateTransaction('QueryByKeyword', 'landparcel', '', JSON.stringify({ ownerId: cccd }), cccd),
                contract.evaluateTransaction('QueryByKeyword', 'landcertificate', '', JSON.stringify({ ownerId: cccd }), cccd),
                contract.evaluateTransaction('QueryByKeyword', 'landtransaction', '', JSON.stringify({ ownerId: cccd }), cccd)
            ]);

            stats = {
                landParcels: JSON.parse(landParcels.toString()).length,
                certificates: JSON.parse(certificates.toString()).length,
                transactions: JSON.parse(transactions.toString()).length,
                documents: 0
            };
        } else {
            // Org1 and Org2 see system-wide data
            const [landParcels, certificates, transactions, documents] = await Promise.all([
                contract.evaluateTransaction('QueryByKeyword', 'landparcel', '', '{}', cccd),
                contract.evaluateTransaction('QueryByKeyword', 'landcertificate', '', '{}', cccd),
                contract.evaluateTransaction('QueryByKeyword', 'landtransaction', '', '{}', cccd),
                contract.evaluateTransaction('QueryByKeyword', 'document', '', '{}', cccd)
            ]);

            const transactionList = JSON.parse(transactions.toString());
            const pendingTransactions = transactionList.filter(tx => tx.status === 'pending' || tx.status === 'submitted').length;
            const completedTransactions = transactionList.filter(tx => tx.status === 'completed' || tx.status === 'approved').length;
            const completionRate = transactionList.length > 0 ? Math.round((completedTransactions / transactionList.length) * 100) : 0;

            stats = {
                landParcels: JSON.parse(landParcels.toString()).length,
                certificates: JSON.parse(certificates.toString()).length,
                transactions: transactionList.length,
                documents: JSON.parse(documents.toString()).length,
                pendingTransactions,
                completedTransactions,
                completionRate,
                averageProcessingTime: 7 // Default value, could be calculated from actual data
            };
        }

        gateway.disconnect();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: `Failed to get dashboard stats: ${error.message}` });
    }
});

// User management endpoints (Admin only)
app.get('/users', authenticateJWT, requireAdmin, async (req, res) => {
    const { limit = 50, offset = 0, org: filterOrg, role } = req.query;

    try {
        let query = {};
        if (filterOrg) query.org = filterOrg;
        if (role) query.role = role;

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
        res.status(500).json({ error: `Failed to get users: ${error.message}` });
    }
});

// Get user profile
app.get('/profile', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findOne({ cccd: req.user.cccd }).select('-password -otp -otpExpires');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: `Failed to get profile: ${error.message}` });
    }
});

// Update user profile
app.put('/profile', authenticateJWT, async (req, res) => {
    const { fullName, phone } = req.body;
    const { cccd } = req.user;

    try {
        const updateData = {};
        if (fullName) updateData.fullName = sanitizeInput(fullName);
        if (phone) {
            validatePhone(phone);
            updateData.phone = phone;
            updateData.isPhoneVerified = false; // Require re-verification if phone changes
        }

        const user = await User.findOneAndUpdate(
            { cccd },
            updateData,
            { new: true }
        ).select('-password -otp -otpExpires');

        res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Phone number already exists' });
        }
        res.status(400).json({ error: error.message });
    }
});

// Get user by CCCD (Admin only)
app.get('/users/:cccd', authenticateJWT, requireAdmin, async (req, res) => {
    const { cccd } = req.params;

    try {
        const user = await User.findOne({ cccd }).select('-password -otp -otpExpires');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: `Failed to get user: ${error.message}` });
    }
});

// Update user (Admin only)
app.put('/users/:cccd', authenticateJWT, requireAdmin, async (req, res) => {
    const { cccd } = req.params;
    const { fullName, phone, role, org, isLocked } = req.body;

    try {
        const updateData = {};
        if (fullName) updateData.fullName = sanitizeInput(fullName);
        if (phone) {
            validatePhone(phone);
            updateData.phone = phone;
        }
        if (role) updateData.role = role;
        if (org) {
            validateOrg(org);
            updateData.org = org;
        }
        if (typeof isLocked === 'boolean') updateData.isLocked = isLocked;

        const user = await User.findOneAndUpdate(
            { cccd },
            updateData,
            { new: true }
        ).select('-password -otp -otpExpires');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User updated successfully', user });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Phone number already exists' });
        }
        res.status(400).json({ error: error.message });
    }
});

// Delete land parcel (Org1 only)
app.delete('/land-parcels/:id', authenticateJWT, checkOrg(['Org1']), async (req, res) => {
    const { id } = req.params;
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const statefulTxn = contract.createTransaction('DeleteLandParcel');
        statefulTxn.setEndorsingOrganizations('Org1MSP', 'Org2MSP');
        await statefulTxn.submit(id);
        gateway.disconnect();
        res.json({ message: 'Land parcel deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: `Failed to delete land parcel: ${error.message}` });
    }
});

// Revoke certificate (Org1 only)
app.post('/certificates/:certificateID/revoke', authenticateJWT, checkOrg(['Org1']), async (req, res) => {
    const { certificateID } = req.params;
    const { reason } = req.body;
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const statefulTxn = contract.createTransaction('RevokeCertificate');
        statefulTxn.setEndorsingOrganizations('Org1MSP', 'Org2MSP');
        await statefulTxn.submit(certificateID, reason || 'Administrative revocation');
        const result = await contract.evaluateTransaction('QueryCertificateByID', certificateID, cccd);
        gateway.disconnect();
        res.json({ message: 'Certificate revoked successfully', certificate: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to revoke certificate: ${error.message}` });
    }
});

// Reject document (Org2 only)
app.post('/documents/:docID/reject', authenticateJWT, checkOrg(['Org2']), async (req, res) => {
    const { docID } = req.params;
    const { reason } = req.body;
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const statefulTxn = contract.createTransaction('RejectDocument');
        statefulTxn.setEndorsingOrganizations('Org1MSP', 'Org2MSP');
        await statefulTxn.submit(docID, reason || 'Document verification failed');
        const result = await contract.evaluateTransaction('QueryDocumentByID', docID, cccd);
        gateway.disconnect();
        res.json({ message: 'Document rejected', document: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to reject document: ${error.message}` });
    }
});

// Get transaction history for a land parcel (All orgs)
app.get('/land-parcels/:id/history', authenticateJWT, checkOrg(['Org1', 'Org2', 'Org3']), async (req, res) => {
    const { id } = req.params;
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const result = await contract.evaluateTransaction('GetLandParcelHistory', id);
        gateway.disconnect();
        res.json({ history: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to get land parcel history: ${error.message}` });
    }
});

// Get system reports (Org1, Org2 only)
app.get('/reports/system', authenticateJWT, checkOrg(['Org1', 'Org2']), async (req, res) => {
    const { startDate, endDate, type } = req.query;
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);

        const filters = {};
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;
        if (type) filters.type = type;

        const [transactions, certificates, documents] = await Promise.all([
            contract.evaluateTransaction('QueryByKeyword', 'landtransaction', '', JSON.stringify(filters), cccd),
            contract.evaluateTransaction('QueryByKeyword', 'landcertificate', '', JSON.stringify(filters), cccd),
            contract.evaluateTransaction('QueryByKeyword', 'document', '', JSON.stringify(filters), cccd)
        ]);

        const transactionData = JSON.parse(transactions.toString());
        const certificateData = JSON.parse(certificates.toString());
        const documentData = JSON.parse(documents.toString());

        const report = {
            summary: {
                totalTransactions: transactionData.length,
                totalCertificates: certificateData.length,
                totalDocuments: documentData.length,
                pendingTransactions: transactionData.filter(tx => tx.status === 'pending').length,
                approvedTransactions: transactionData.filter(tx => tx.status === 'approved').length,
                rejectedTransactions: transactionData.filter(tx => tx.status === 'rejected').length
            },
            transactions: transactionData,
            certificates: certificateData,
            documents: documentData
        };

        gateway.disconnect();
        res.json({ report });
    } catch (error) {
        res.status(500).json({ error: `Failed to generate system report: ${error.message}` });
    }
});

// Get analytics data (Org1, Org2 only)
app.get('/analytics', authenticateJWT, checkOrg(['Org1', 'Org2']), async (req, res) => {
    const { period = '30d' } = req.query;
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);

        // Get all data for analytics
        const [transactions, certificates, landParcels] = await Promise.all([
            contract.evaluateTransaction('QueryByKeyword', 'landtransaction', '', '{}', cccd),
            contract.evaluateTransaction('QueryByKeyword', 'landcertificate', '', '{}', cccd),
            contract.evaluateTransaction('QueryByKeyword', 'landparcel', '', '{}', cccd)
        ]);

        const transactionData = JSON.parse(transactions.toString());
        const certificateData = JSON.parse(certificates.toString());
        const landParcelData = JSON.parse(landParcels.toString());

        // Calculate analytics
        const analytics = {
            transactionTrends: calculateTrends(transactionData, period),
            certificateIssuance: calculateCertificateStats(certificateData, period),
            landParcelDistribution: calculateLandParcelStats(landParcelData),
            processingTimes: calculateProcessingTimes(transactionData),
            statusDistribution: calculateStatusDistribution(transactionData)
        };

        gateway.disconnect();
        res.json({ analytics });
    } catch (error) {
        res.status(500).json({ error: `Failed to get analytics: ${error.message}` });
    }
});

// Bulk operations for land parcels (Org1 only)
app.post('/land-parcels/bulk', authenticateJWT, checkOrg(['Org1']), async (req, res) => {
    const { operation, landParcelIds, data } = req.body;
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);
        const results = [];

        for (const id of landParcelIds) {
            try {
                let result;
                const statefulTxn = contract.createTransaction(`Bulk${operation}`);
                statefulTxn.setEndorsingOrganizations('Org1MSP', 'Org2MSP');

                if (operation === 'Update') {
                    await statefulTxn.submit(id, JSON.stringify(data));
                } else if (operation === 'Delete') {
                    await statefulTxn.submit(id);
                }

                result = await contract.evaluateTransaction('QueryLandParcelByID', id, cccd);
                results.push({ id, success: true, data: JSON.parse(result.toString()) });
            } catch (error) {
                results.push({ id, success: false, error: error.message });
            }
        }

        gateway.disconnect();
        res.json({ message: `Bulk ${operation.toLowerCase()} completed`, results });
    } catch (error) {
        res.status(500).json({ error: `Failed to perform bulk operation: ${error.message}` });
    }
});

// Export data (Org1, Org2 only)
app.get('/export/:dataType', authenticateJWT, checkOrg(['Org1', 'Org2']), async (req, res) => {
    const { dataType } = req.params;
    const { format = 'json', startDate, endDate } = req.query;
    const { cccd, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);

        const filters = {};
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;

        let result;
        switch (dataType) {
            case 'land-parcels':
                result = await contract.evaluateTransaction('QueryByKeyword', 'landparcel', '', JSON.stringify(filters), cccd);
                break;
            case 'certificates':
                result = await contract.evaluateTransaction('QueryByKeyword', 'landcertificate', '', JSON.stringify(filters), cccd);
                break;
            case 'transactions':
                result = await contract.evaluateTransaction('QueryByKeyword', 'landtransaction', '', JSON.stringify(filters), cccd);
                break;
            case 'documents':
                result = await contract.evaluateTransaction('QueryByKeyword', 'document', '', JSON.stringify(filters), cccd);
                break;
            default:
                return res.status(400).json({ error: 'Invalid data type' });
        }

        const data = JSON.parse(result.toString());

        if (format === 'csv') {
            // Convert to CSV format
            const csv = convertToCSV(data);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=${dataType}-export.csv`);
            res.send(csv);
        } else {
            res.json({ data, exportedAt: new Date().toISOString(), count: data.length });
        }

        gateway.disconnect();
    } catch (error) {
        res.status(500).json({ error: `Failed to export data: ${error.message}` });
    }
});

// Get system health status (Admin only)
app.get('/system/health', authenticateJWT, requireAdmin, async (req, res) => {
    try {
        const { cccd, org } = req.user;
        const { gateway, contract } = await connectToNetwork(org, cccd);

        // Test blockchain connectivity
        await contract.evaluateTransaction('QueryByKeyword', 'landparcel', '', '{}', cccd);

        // Test MongoDB connectivity
        const userCount = await User.countDocuments();

        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                blockchain: 'connected',
                database: 'connected',
                userCount
            }
        };

        gateway.disconnect();
        res.json(health);
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// Search across all data types (Org1, Org2 only)
app.get('/search/global', authenticateJWT, checkOrg(['Org1', 'Org2']), async (req, res) => {
    const { query, type } = req.query;
    const { cccd, org } = req.user;

    if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
    }

    try {
        const { gateway, contract } = await connectToNetwork(org, cccd);

        const searchTypes = type ? [type] : ['landparcel', 'landcertificate', 'landtransaction', 'document'];
        const results = {};

        for (const searchType of searchTypes) {
            try {
                const result = await contract.evaluateTransaction('QueryByKeyword', searchType, query, '{}', cccd);
                results[searchType] = JSON.parse(result.toString());
            } catch (error) {
                results[searchType] = [];
            }
        }

        gateway.disconnect();
        res.json({ query, results });
    } catch (error) {
        res.status(500).json({ error: `Failed to perform global search: ${error.message}` });
    }
});

// ===== HELPER FUNCTIONS =====

// Calculate trends for analytics
function calculateTrends(data, period) {
    const now = new Date();
    const periodMs = period === '7d' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    const startDate = new Date(now.getTime() - periodMs);

    const filteredData = data.filter(item => {
        const itemDate = new Date(item.timestamp || item.createdAt || now);
        return itemDate >= startDate;
    });

    return {
        total: filteredData.length,
        period,
        trend: filteredData.length > 0 ? 'up' : 'neutral'
    };
}

// Calculate certificate statistics
function calculateCertificateStats(certificates, period) {
    const now = new Date();
    const periodMs = period === '7d' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    const startDate = new Date(now.getTime() - periodMs);

    const recentCertificates = certificates.filter(cert => {
        const certDate = new Date(cert.issuedDate || cert.timestamp || now);
        return certDate >= startDate;
    });

    return {
        total: certificates.length,
        recent: recentCertificates.length,
        active: certificates.filter(cert => cert.status === 'active').length,
        revoked: certificates.filter(cert => cert.status === 'revoked').length
    };
}

// Calculate land parcel statistics
function calculateLandParcelStats(landParcels) {
    const purposeDistribution = {};
    const statusDistribution = {};

    landParcels.forEach(parcel => {
        const purpose = parcel.landUsePurpose || 'Unknown';
        const status = parcel.legalStatus || 'Unknown';

        purposeDistribution[purpose] = (purposeDistribution[purpose] || 0) + 1;
        statusDistribution[status] = (statusDistribution[status] || 0) + 1;
    });

    return {
        total: landParcels.length,
        purposeDistribution,
        statusDistribution
    };
}

// Calculate processing times
function calculateProcessingTimes(transactions) {
    const completedTransactions = transactions.filter(tx =>
        tx.status === 'completed' || tx.status === 'approved'
    );

    if (completedTransactions.length === 0) {
        return { average: 0, median: 0, count: 0 };
    }

    const processingTimes = completedTransactions.map(tx => {
        const start = new Date(tx.createdAt || tx.timestamp);
        const end = new Date(tx.completedAt || tx.updatedAt || new Date());
        return Math.ceil((end - start) / (1000 * 60 * 60 * 24)); // Days
    });

    const average = processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length;
    const sorted = processingTimes.sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    return {
        average: Math.round(average),
        median,
        count: completedTransactions.length
    };
}

// Calculate status distribution
function calculateStatusDistribution(transactions) {
    const distribution = {};

    transactions.forEach(tx => {
        const status = tx.status || 'Unknown';
        distribution[status] = (distribution[status] || 0) + 1;
    });

    return distribution;
}

// Convert data to CSV format
function convertToCSV(data) {
    if (!data || data.length === 0) {
        return '';
    }

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');

    const csvRows = data.map(row => {
        return headers.map(header => {
            const value = row[header];
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        }).join(',');
    });

    return [csvHeaders, ...csvRows].join('\n');
}

// Khởi động server
async function main() {
    try {
        await connectMongoDB();
        await initializeAdminAccounts();
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (error) {
        console.error(`Failed to start server: ${error}`);
        process.exit(1);
    }
}

main();