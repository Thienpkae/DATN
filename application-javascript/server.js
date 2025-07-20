'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const { buildCCPOrg1, buildCCPOrg2, buildCCPOrg3, buildWallet } = require('./enroll/AppUtil.js');
const { registerUser, verifyUser, sendOTP } = require('./enroll/registerUser.js');
const { changePassword, forgotPassword, resetPassword, lockUnlockAccount } = require('./enroll/accountManager.js');
const { validatePassword, validateCCCD, validatePhone, sanitizeInput, validateOrg } = require('./enroll/validation.js');
const User = require('./models/User');
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

// Middleware xác thực JWT
const authenticateJWT = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Access denied, no token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, jwtSecret);
        const user = await User.findOne({ userId: decoded.userId });
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

// Middleware kiểm tra quyền truy cập theo tổ chức
const checkOrg = (allowedOrgs) => (req, res, next) => {
    if (!allowedOrgs.includes(req.user.org)) {
        return res.status(403).json({ error: `Access denied, organization ${req.user.org} not allowed. Required: ${allowedOrgs.join(' or ')}` });
    }
    next();
};

// Kết nối với Hyperledger Fabric
async function connectToNetwork(org, userId) {
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
    await gateway.connect(ccp, { wallet, identity: userId, discovery: { enabled: true, asLocalhost: true } });
    const network = await gateway.getNetwork(myChannel);
    const contract = network.getContract(myChaincodeName);

    return { gateway, contract };
}

// Đăng ký người dùng
app.post('/register', async (req, res) => {
    const { org, userId, cccd, phone, fullName, password } = req.body;
    try {
        // Validate organization
        validateOrg(org);
        
        // Validate inputs
        validateCCCD(cccd);
        validatePhone(phone);
        validatePassword(password);
        
        // Sanitize inputs
        const sanitizedUserId = sanitizeInput(userId);
        const sanitizedFullName = sanitizeInput(fullName);
        
        const result = await registerUser(org, sanitizedUserId, cccd, phone, sanitizedFullName, password);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Gửi lại OTP
app.post('/resend-otp', async (req, res) => {
    const { userId } = req.body;
    try {
        const user = await User.findOne({ userId });
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
    const { userId, otp } = req.body;
    try {
        const result = await verifyUser(userId, otp);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Đăng nhập
app.post('/login', async (req, res) => {
    const { userId, password } = req.body;
    try {
        const user = await User.findOne({ userId });
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

        const token = jwt.sign({ userId: user.userId, org: user.org }, jwtSecret, { expiresIn: '1h' });
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
    const { userId } = req.user;
    try {
        // Validate new password strength
        validatePassword(newPassword);
        
        // Check password confirmation if provided
        if (confirmPassword && newPassword !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }
        
        const result = await changePassword(userId, oldPassword, newPassword);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Quên mật khẩu
app.post('/forgot-password', async (req, res) => {
    const { userId, phone } = req.body;
    try {
        const result = await forgotPassword(userId, phone);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Đặt lại mật khẩu
app.post('/reset-password', async (req, res) => {
    const { userId, otp, newPassword } = req.body;
    try {
        // Validate new password strength
        validatePassword(newPassword);
        
        const result = await resetPassword(userId, otp, newPassword);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Khóa/Mở khóa tài khoản (chỉ Org1 - Authority có quyền)
app.post('/account/lock-unlock', authenticateJWT, checkOrg(['Org1']), async (req, res) => {
    const { targetUserId, lock } = req.body;
    const { userId } = req.user;
    try {
        const result = await lockUnlockAccount(userId, targetUserId, lock);
        res.json(result);
    } catch (error) {
        res.status(error.message.includes('Org1') ? 403 : 400).json({ error: error.message });
    }
});

// Tạo thửa đất (Org1 - authority organizations)
app.post('/land-parcels', authenticateJWT, checkOrg(['Org1']), async (req, res) => {
    const { id, ownerID, location, landUsePurpose, legalStatus, area } = req.body;
    const { userId, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const statefulTxn = contract.createTransaction('CreateLandParcel');
        statefulTxn.setEndorsingOrganizations('Org1MSP', 'Org2MSP');
        await statefulTxn.submit(id, ownerID, location, landUsePurpose, legalStatus, area.toString(), userId);
        const result = await contract.evaluateTransaction('QueryLandParcelByID', id, userId);
        gateway.disconnect();
        res.json({ message: 'Land parcel created', landParcel: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to create land parcel: ${error.message}` });
    }
});

// Tải lên tài liệu (tất cả các tổ chức)
app.post('/documents', authenticateJWT, checkOrg(['Org1', 'Org2', 'Org3']), async (req, res) => {
    const { docID, landParcelID, txID, ipfsHash, description } = req.body;
    const { userId, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const statefulTxn = contract.createTransaction('UploadDocument');
        statefulTxn.setEndorsingOrganizations('Org1MSP', 'Org2MSP');
        await statefulTxn.submit(docID, landParcelID, txID || '', ipfsHash, description, userId);
        const result = await contract.evaluateTransaction('QueryDocumentByID', docID, userId);
        gateway.disconnect();
        res.json({ message: 'Document uploaded', document: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to upload document: ${error.message}` });
    }
});

// Chứng thực tài liệu (Org1, Org2 - officer organizations)
app.post('/documents/:docID/verify', authenticateJWT, checkOrg(['Org1', 'Org2']), async (req, res) => {
    const { docID } = req.params;
    const { userId, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const statefulTxn = contract.createTransaction('VerifyDocument');
        statefulTxn.setEndorsingOrganizations('Org1MSP', 'Org2MSP');
        await statefulTxn.submit(docID);
        const result = await contract.evaluateTransaction('QueryDocumentByID', docID, userId);
        gateway.disconnect();
        res.json({ message: 'Document verified', document: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to verify document: ${error.message}` });
    }
});

app.post('/transactions/:txID/process', authenticateJWT, checkOrg(['Org2']), async (req, res) => {
    const { txID } = req.params;
    const { userId, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const statefulTxn = contract.createTransaction('ProcessTransaction');
        statefulTxn.setEndorsingOrganizations('Org1MSP', 'Org2MSP');
        await statefulTxn.submit(txID);
        const result = await contract.evaluateTransaction('QueryTransactionByID', txID, userId);
        gateway.disconnect();
        res.json({ message: 'Transaction processed', transaction: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to process transaction: ${error.message}` });
    }
});

// Other existing routes remain unchanged
app.post('/certificates', authenticateJWT, checkOrg(['Org1']), async (req, res) => {
    const { certificateID, landParcelID, ownerID, legalInfo, signature } = req.body;
    const { userId, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const statefulTxn = contract.createTransaction('IssueLandCertificate');
        statefulTxn.setEndorsingOrganizations('Org1MSP', 'Org2MSP');
        await statefulTxn.submit(certificateID, landParcelID, ownerID, legalInfo, signature);
        const result = await contract.evaluateTransaction('QueryCertificateByID', certificateID, userId);
        gateway.disconnect();
        res.json({ message: 'Certificate issued', certificate: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to issue certificate: ${error.message}` });
    }
});

app.post('/transfer-requests', authenticateJWT, checkOrg(['Org3']), async (req, res) => {
    const { txID, landParcelID, fromOwnerID, toOwnerID, details, signature } = req.body;
    const { userId, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const statefulTxn = contract.createTransaction('CreateTransferRequest');
        statefulTxn.setEndorsingOrganizations('Org2MSP', 'Org3MSP');
        await statefulTxn.submit(txID, landParcelID, fromOwnerID, toOwnerID, details, signature);
        const result = await contract.evaluateTransaction('QueryTransactionByID', txID, userId);
        gateway.disconnect();
        res.json({ message: 'Transfer request created', transaction: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to create transfer request: ${error.message}` });
    }
});

app.post('/transfer-requests/:txID/confirm', authenticateJWT, checkOrg(['Org3']), async (req, res) => {
    const { txID } = req.params;
    const { toOwnerID, signature, agree } = req.body;
    const { userId, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const statefulTxn = contract.createTransaction('ConfirmTransfer');
        statefulTxn.setEndorsingOrganizations('Org1MSP', 'Org3MSP');
        await statefulTxn.submit(txID, toOwnerID, signature, agree.toString());
        const result = await contract.evaluateTransaction('QueryTransactionByID', txID, userId);
        gateway.disconnect();
        res.json({ message: 'Transfer confirmed', transaction: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to confirm transfer: ${error.message}` });
    }
});

app.post('/split-requests', authenticateJWT, checkOrg(['Org3']), async (req, res) => {
    const { txID, landParcelID, ownerID, signature, newParcels } = req.body;
    const { userId, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const statefulTxn = contract.createTransaction('CreateSplitRequest');
        statefulTxn.setEndorsingOrganizations('Org1MSP', 'Org3MSP');
        await statefulTxn.submit(txID, landParcelID, ownerID, signature, JSON.stringify(newParcels));
        const result = await contract.evaluateTransaction('QueryTransactionByID', txID, userId);
        gateway.disconnect();
        res.json({ message: 'Split request created', transaction: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to create split request: ${error.message}` });
    }
});

app.post('/merge-requests', authenticateJWT, checkOrg(['Org3']), async (req, res) => {
    const { txID, ownerID, signature, parcelIDs, newParcel } = req.body;
    const { userId, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const statefulTxn = contract.createTransaction('CreateMergeRequest');
        statefulTxn.setEndorsingOrganizations('Org1MSP', 'Org3MSP');
        await statefulTxn.submit(txID, ownerID, signature, JSON.stringify(parcelIDs), JSON.stringify(newParcel));
        const result = await contract.evaluateTransaction('QueryTransactionByID', txID, userId);
        gateway.disconnect();
        res.json({ message: 'Merge request created', transaction: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to create merge request: ${error.message}` });
    }
});

app.post('/change-purpose-requests', authenticateJWT, checkOrg(['Org3']), async (req, res) => {
    const { txID, landParcelID, ownerID, newPurpose, details, signature } = req.body;
    const { userId, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const statefulTxn = contract.createTransaction('CreateChangePurposeRequest');
        statefulTxn.setEndorsingOrganizations('Org1MSP', 'Org3MSP');
        await statefulTxn.submit(txID, landParcelID, ownerID, newPurpose, details, signature);
        const result = await contract.evaluateTransaction('QueryTransactionByID', txID, userId);
        gateway.disconnect();
        res.json({ message: 'Change purpose request created', transaction: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to create change purpose request: ${error.message}` });
    }
});

app.post('/reissue-requests', authenticateJWT, checkOrg(['Org3']), async (req, res) => {
    const { txID, landParcelID, ownerID, details, signature } = req.body;
    const { userId, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const statefulTxn = contract.createTransaction('CreateReissueRequest');
        statefulTxn.setEndorsingOrganizations('Org1MSP', 'Org3MSP');
        await statefulTxn.submit(txID, landParcelID, ownerID, details, signature);
        const result = await contract.evaluateTransaction('QueryTransactionByID', txID, userId);
        gateway.disconnect();
        res.json({ message: 'Reissue request created', transaction: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to create reissue request: ${error.message}` });
    }
});

app.post('/transactions/:txID/forward', authenticateJWT, checkOrg(['Org2']), async (req, res) => {
    const { txID } = req.params;
    const { forwardDetails } = req.body;
    const { userId, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const statefulTxn = contract.createTransaction('ForwardTransaction');
        statefulTxn.setEndorsingOrganizations('Org1MSP', 'Org2MSP');
        await statefulTxn.submit(txID, forwardDetails);
        const result = await contract.evaluateTransaction('QueryTransactionByID', txID, userId);
        gateway.disconnect();
        res.json({ message: 'Transaction forwarded', transaction: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to forward transaction: ${error.message}` });
    }
});

app.post('/transactions/:txID/approve', authenticateJWT, checkOrg(['Org1']), async (req, res) => {
    const { txID } = req.params;
    const { approveDetails } = req.body;
    const { userId, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const statefulTxn = contract.createTransaction('ApproveTransaction');
        statefulTxn.setEndorsingOrganizations('Org1MSP', 'Org2MSP');
        await statefulTxn.submit(txID, approveDetails);
        const result = await contract.evaluateTransaction('QueryTransactionByID', txID, userId);
        gateway.disconnect();
        res.json({ message: 'Transaction approved', transaction: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to approve transaction: ${error.message}` });
    }
});

app.post('/transactions/:txID/reject', authenticateJWT, checkOrg(['Org1']), async (req, res) => {
    const { txID } = req.params;
    const { rejectDetails } = req.body;
    const { userId, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const statefulTxn = contract.createTransaction('RejectTransaction');
        statefulTxn.setEndorsingOrganizations('Org1MSP', 'Org2MSP');
        await statefulTxn.submit(txID, rejectDetails);
        const result = await contract.evaluateTransaction('QueryTransactionByID', txID, userId);
        gateway.disconnect();
        res.json({ message: 'Transaction rejected', transaction: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to reject transaction: ${error.message}` });
    }
});

app.get('/land-parcels/:id', authenticateJWT, checkOrg(['Org1', 'Org2', 'Org3']), async (req, res) => {
    const { id } = req.params;
    const { userId, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const result = await contract.evaluateTransaction('QueryLandParcelByID', id, userId);
        gateway.disconnect();
        res.json({ landParcel: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to query land parcel: ${error.message}` });
    }
});

app.get('/land-parcels/owner/:ownerID', authenticateJWT, checkOrg(['Org1', 'Org2', 'Org3']), async (req, res) => {
    const { ownerID } = req.params;
    const { userId, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const result = await contract.evaluateTransaction('QueryLandParcelsByOwner', ownerID, userId);
        gateway.disconnect();
        res.json({ landParcels: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to query land parcels by owner: ${error.message}` });
    }
});

app.get('/land-parcels/location/:location', authenticateJWT, async (req, res) => {
    const { location } = req.params;
    const { userId, org } = req.user;
    if (!['Org1', 'Org2'].includes(org)) {
        return res.status(403).json({ error: 'Access denied, required organization: Org1 or Org2' });
    }

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const result = await contract.evaluateTransaction('QueryLandParcelsByLocation', location);
        gateway.disconnect();
        res.json({ landParcels: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to query land parcels by location: ${error.message}` });
    }
});

app.get('/land-parcels/purpose/:landUsePurpose', authenticateJWT, async (req, res) => {
    const { landUsePurpose } = req.params;
    const { userId, org } = req.user;
    if (!['Org1', 'Org2'].includes(org)) {
        return res.status(403).json({ error: 'Access denied, required organization: Org1 or Org2' });
    }

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const result = await contract.evaluateTransaction('QueryLandParcelsByPurpose', landUsePurpose);
        gateway.disconnect();
        res.json({ landParcels: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to query land parcels by purpose: ${error.message}` });
    }
});

app.get('/land-parcels/legal-status/:legalStatus', authenticateJWT, async (req, res) => {
    const { legalStatus } = req.params;
    const { userId, org } = req.user;
    if (!['Org1', 'Org2'].includes(org)) {
        return res.status(403).json({ error: 'Access denied, required organization: Org1 or Org2' });
    }

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const result = await contract.evaluateTransaction('QueryLandParcelsByLegalStatus', legalStatus);
        gateway.disconnect();
        res.json({ landParcels: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to query land parcels by legal status: ${error.message}` });
    }
});

app.get('/certificates/owner/:ownerID', authenticateJWT, checkOrg(['Org1', 'Org2', 'Org3']), async (req, res) => {
    const { ownerID } = req.params;
    const { userId, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const result = await contract.evaluateTransaction('QueryCertificatesByOwner', ownerID, userId);
        gateway.disconnect();
        res.json({ certificates: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to query certificates by owner: ${error.message}` });
    }
});

app.get('/certificates/:certificateID', authenticateJWT, checkOrg(['Org1', 'Org2', 'Org3']), async (req, res) => {
    const { certificateID } = req.params;
    const { userId, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const result = await contract.evaluateTransaction('QueryCertificateByID', certificateID, userId);
        gateway.disconnect();
        res.json({ certificate: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to query certificate: ${error.message}` });
    }
});

app.get('/certificates/land-parcel/:landParcelID', authenticateJWT, checkOrg(['Org1', 'Org2', 'Org3']), async (req, res) => {
    const { landParcelID } = req.params;
    const { userId, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const result = await contract.evaluateTransaction('QueryCertificatesByLandParcel', landParcelID, userId);
        gateway.disconnect();
        res.json({ certificates: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to query certificates by land parcel: ${error.message}` });
    }
});

app.get('/certificates/issue-date', authenticateJWT, async (req, res) => {
    const { startDate, endDate } = req.query;
    const { userId, org } = req.user;
    if (!['Org1', 'Org2'].includes(org)) {
        return res.status(403).json({ error: 'Access denied, required organization: Org1 or Org2' });
    }

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const result = await contract.evaluateTransaction('QueryCertificatesByIssueDate', startDate, endDate);
        gateway.disconnect();
        res.json({ certificates: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to query certificates by issue date: ${error.message}` });
    }
});

app.get('/transactions/:txID', authenticateJWT, checkOrg(['Org1', 'Org2', 'Org3']), async (req, res) => {
    const { txID } = req.params;
    const { userId, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const result = await contract.evaluateTransaction('QueryTransactionByID', txID, userId);
        gateway.disconnect();
        res.json({ transaction: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to query transaction: ${error.message}` });
    }
});

app.get('/transactions/criteria', authenticateJWT, async (req, res) => {
    const { status, txType, startTime, endTime } = req.query;
    const { userId, org } = req.user;
    if (!['Org1', 'Org2'].includes(org)) {
        return res.status(403).json({ error: 'Access denied, required organization: Org1 or Org2' });
    }

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const result = await contract.evaluateTransaction('QueryTransactionsByCriteria', status, txType, startTime, endTime);
        gateway.disconnect();
        res.json({ transactions: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to query transactions by criteria: ${error.message}` });
    }
});

app.get('/transactions/land-parcel/:landParcelID', authenticateJWT, checkOrg(['Org1', 'Org2', 'Org3']), async (req, res) => {
    const { landParcelID } = req.params;
    const { userId, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const result = await contract.evaluateTransaction('QueryTransactionsByLandParcel', landParcelID, userId);
        gateway.disconnect();
        res.json({ transactions: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to query transactions by land parcel: ${error.message}` });
    }
});

app.get('/transactions/owner/:ownerID', authenticateJWT, checkOrg(['Org1', 'Org2', 'Org3']), async (req, res) => {
    const { ownerID } = req.params;
    const { userId, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const result = await contract.evaluateTransaction('QueryTransactionsByOwner', ownerID, userId);
        gateway.disconnect();
        res.json({ transactions: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to query transactions by owner: ${error.message}` });
    }
});

app.get('/documents/:docID', authenticateJWT, checkOrg(['Org1', 'Org2', 'Org3']), async (req, res) => {
    const { docID } = req.params;
    const { userId, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const result = await contract.evaluateTransaction('QueryDocumentByID', docID, userId);
        gateway.disconnect();
        res.json({ document: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to query document: ${error.message}` });
    }
});

app.get('/documents/land-parcel/:landParcelID', authenticateJWT, checkOrg(['Org1', 'Org2', 'Org3']), async (req, res) => {
    const { landParcelID } = req.params;
    const { userId, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const result = await contract.evaluateTransaction('QueryDocumentsByLandParcel', landParcelID, userId);
        gateway.disconnect();
        res.json({ documents: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to query documents by land parcel: ${error.message}` });
    }
});

app.get('/documents/transaction/:txID', authenticateJWT, checkOrg(['Org1', 'Org2', 'Org3']), async (req, res) => {
    const { txID } = req.params;
    const { userId, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const result = await contract.evaluateTransaction('QueryDocumentsByTransaction', txID, userId);
        gateway.disconnect();
        res.json({ documents: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to query documents by transaction: ${error.message}` });
    }
});

app.get('/documents/ipfs/:ipfsHash', authenticateJWT, async (req, res) => {
    const { ipfsHash } = req.params;
    const { userId, org } = req.user;
    if (!['Org1', 'Org2'].includes(org)) {
        return res.status(403).json({ error: 'Access denied, required organization: Org1 or Org2' });
    }

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const result = await contract.evaluateTransaction('QueryDocumentsByIPFSHash', ipfsHash);
        gateway.disconnect();
        res.json({ documents: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to query documents by IPFS hash: ${error.message}` });
    }
});

app.get('/logs/transaction/:txID', authenticateJWT, async (req, res) => {
    const { txID } = req.params;
    const { userId, org } = req.user;
    if (!['Org1', 'Org2'].includes(org)) {
        return res.status(403).json({ error: 'Access denied, required organization: Org1 or Org2' });
    }

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const result = await contract.evaluateTransaction('QueryLogsByTransaction', txID, userId);
        gateway.disconnect();
        res.json({ logs: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to query logs by transaction: ${error.message}` });
    }
});

// Khởi động server
async function main() {
    try {
        await connectMongoDB();
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (error) {
        console.error(`Failed to start server: ${error}`);
        process.exit(1);
    }
}

main();