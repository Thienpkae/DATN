const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const { buildCCPOrg1, buildCCPOrg2, buildCCPOrg3, buildWallet } = require('./enroll/AppUtil.js');
const { registerUser, verifyUser, sendOTP } = require('./enroll/registerUser.js');
const User = require('./models/User');
require('dotenv').config();

const app = express();
const port = 3000;
const myChannel = 'mychannel';
const myChaincodeName = 'auction';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    console.error('JWT_SECRET is not defined in .env');
    process.exit(1);
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

const checkRole = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: `Access denied, required role: ${roles.join(' or ')}` });
    }
    next();
};

async function connectToNetwork(org, userId) {
    let ccp, walletPath;
    if (org === 'Org1') {
        ccp = buildCCPOrg1();
        walletPath = path.join(__dirname, 'wallet/org1');
    } else if (org === 'Org2') {
        ccp = buildCCPOrg2();
        walletPath = path.join(__dirname, 'wallet/org2');
    } else if (org === 'Org3') {
        ccp = buildCCPOrg3();
        walletPath = path.join(__dirname, 'wallet/org3');
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

app.post('/register', async (req, res) => {
    const { org, userId, cccd, phone, fullName, role, password } = req.body;
    if (!['Org1', 'Org2', 'Org3'].includes(org)) {
        return res.status(400).json({ error: 'Invalid organization. Must be Org1, Org2, or Org3' });
    }
    try {
        const result = await registerUser(org, userId, cccd, phone, fullName, role, password);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

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

app.post('/verify-otp', async (req, res) => {
    const { userId, otp } = req.body;
    try {
        const result = await verifyUser(userId, otp);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/login', async (req, res) => {
    const { userId, password } = req.body;
    try {
        const user = await User.findOne({ userId });
        if (!user || !await user.comparePassword(password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        if (!user.isPhoneVerified) {
            return res.status(403).json({ error: 'Phone number not verified' });
        }

        const token = jwt.sign({ userId: user.userId, role: user.role, org: user.org }, jwtSecret, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: `Login failed: ${error.message}` });
    }
});

app.post('/auctions', authenticateJWT, checkRole(['auctioneer']), async (req, res) => {
    const { auctionID, item } = req.body;
    const { userId, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const statefulTxn = contract.createTransaction('CreateAuction');
        await statefulTxn.submit(auctionID, item);
        const result = await contract.evaluateTransaction('QueryAuction', auctionID);
        gateway.disconnect();
        res.json({ message: 'Auction created', auction: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to create auction: ${error.message}` });
    }
});

app.post('/auctions/:auctionID/bids', authenticateJWT, checkRole(['bidder']), async (req, res) => {
    const { auctionID } = req.params;
    const { price } = req.body;
    const { userId, org } = req.user;
    const orgMSP = org === 'Org1' ? 'Org1MSP' : org === 'Org2' ? 'Org2MSP' : 'Org3MSP';

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const bidder = await contract.evaluateTransaction('GetSubmittingClientIdentity');
        const bidData = { objectType: 'bid', price: parseInt(price), org: orgMSP, bidder: bidder.toString() };
        const statefulTxn = contract.createTransaction('Bid');
        statefulTxn.setEndorsingOrganizations(orgMSP);
        const tmapData = Buffer.from(JSON.stringify(bidData));
        statefulTxn.setTransient({ bid: tmapData });
        const bidID = statefulTxn.getTransactionId();
        await statefulTxn.submit(auctionID);
        const result = await contract.evaluateTransaction('QueryBid', auctionID, bidID);
        gateway.disconnect();
        res.json({ message: 'Bid created', bidID, bid: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to place bid: ${error.message}` });
    }
});

app.post('/auctions/:auctionID/bids/:bidID/submit', authenticateJWT, checkRole(['bidder']), async (req, res) => {
    const { auctionID, bidID } = req.params;
    const { userId, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const auctionString = await contract.evaluateTransaction('QueryAuction', auctionID);
        const auctionJSON = JSON.parse(auctionString);
        const statefulTxn = contract.createTransaction('SubmitBid');
        const endorsingOrgs = auctionJSON.organizations || ['Org1MSP', 'Org2MSP', 'Org3MSP'];
        statefulTxn.setEndorsingOrganizations(...endorsingOrgs);
        await statefulTxn.submit(auctionID, bidID);
        const result = await contract.evaluateTransaction('QueryAuction', auctionID);
        gateway.disconnect();
        res.json({ message: 'Bid submitted', auction: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to submit bid: ${error.message}` });
    }
});

app.post('/auctions/:auctionID/bids/:bidID/reveal', authenticateJWT, checkRole(['bidder']), async (req, res) => {
    const { auctionID, bidID } = req.params;
    const { userId, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const bidString = await contract.evaluateTransaction('QueryBid', auctionID, bidID);
        const bidJSON = JSON.parse(bidString);
        const auctionString = await contract.evaluateTransaction('QueryAuction', auctionID);
        const auctionJSON = JSON.parse(auctionString);
        const bidData = { objectType: 'bid', price: parseInt(bidJSON.price), org: bidJSON.org, bidder: bidJSON.bidder };
        const statefulTxn = contract.createTransaction('RevealBid');
        const tmapData = Buffer.from(JSON.stringify(bidData));
        statefulTxn.setTransient({ bid: tmapData });
        const endorsingOrgs = auctionJSON.organizations || ['Org1MSP', 'Org2MSP', 'Org3MSP'];
        statefulTxn.setEndorsingOrganizations(...endorsingOrgs);
        await statefulTxn.submit(auctionID, bidID);
        const result = await contract.evaluateTransaction('QueryAuction', auctionID);
        gateway.disconnect();
        res.json({ message: 'Bid revealed', auction: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to reveal bid: ${error.message}` });
    }
});

app.post('/auctions/:auctionID/close', authenticateJWT, checkRole(['auctioneer']), async (req, res) => {
    const { auctionID } = req.params;
    const { userId, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const auctionString = await contract.evaluateTransaction('QueryAuction', auctionID);
        const auctionJSON = JSON.parse(auctionString);
        const statefulTxn = contract.createTransaction('CloseAuction');
        const endorsingOrgs = auctionJSON.organizations || ['Org1MSP', 'Org2MSP', 'Org3MSP'];
        statefulTxn.setEndorsingOrganizations(...endorsingOrgs);
        await statefulTxn.submit(auctionID);
        const result = await contract.evaluateTransaction('QueryAuction', auctionID);
        gateway.disconnect();
        res.json({ message: 'Auction closed', auction: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to close auction: ${error.message}` });
    }
});

app.post('/auctions/:auctionID/end', authenticateJWT, checkRole(['auctioneer']), async (req, res) => {
    const { auctionID } = req.params;
    const { userId, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const auctionString = await contract.evaluateTransaction('QueryAuction', auctionID);
        const auctionJSON = JSON.parse(auctionString);
        const statefulTxn = contract.createTransaction('EndAuction');
        const endorsingOrgs = auctionJSON.organizations || ['Org1MSP', 'Org2MSP', 'Org3MSP'];
        statefulTxn.setEndorsingOrganizations(...endorsingOrgs);
        await statefulTxn.submit(auctionID);
        const result = await contract.evaluateTransaction('QueryAuction', auctionID);
        gateway.disconnect();
        res.json({ message: 'Auction ended', auction: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to end auction: ${error.message}` });
    }
});

app.get('/auctions/:auctionID', authenticateJWT, checkRole(['admin', 'auctioneer', 'bidder']), async (req, res) => {
    const { auctionID } = req.params;
    const { userId, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const result = await contract.evaluateTransaction('QueryAuction', auctionID);
        gateway.disconnect();
        res.json({ auction: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to query auction: ${error.message}` });
    }
});

app.get('/auctions/:auctionID/bids/:bidID', authenticateJWT, checkRole(['bidder']), async (req, res) => {
    const { auctionID, bidID } = req.params;
    const { userId, org } = req.user;

    try {
        const { gateway, contract } = await connectToNetwork(org, userId);
        const result = await contract.evaluateTransaction('QueryBid', auctionID, bidID);
        gateway.disconnect();
        res.json({ bid: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ error: `Failed to query bid: ${error.message}` });
    }
});

async function startServer() {
    await connectMongoDB();
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

startServer();