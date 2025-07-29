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
                phone: '+84900000001',
                fullName: 'Admin Organization 1',
                org: 'Org1',
                role: 'admin',
                password: 'Admin123!',
                isPhoneVerified: true,
                isLocked: false
            },
            {
                cccd: '000000000002',
                phone: '+84900000002',
                fullName: 'Admin Organization 2',
                org: 'Org2',
                role: 'admin',
                password: 'Admin123!',
                isPhoneVerified: true,
                isLocked: false
            },
            {
                cccd: '000000000003',
                phone: '+84900000003',
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