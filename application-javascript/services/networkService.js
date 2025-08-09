'use strict';
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const { buildCCPOrg1, buildCCPOrg2, buildCCPOrg3, buildWallet } = require('../enroll/AppUtil.js');

const myChannel = 'mychannel';
const myChaincodeName = 'land-cc';

async function connectToNetwork(org, cccd) {
    let ccp, walletPath;
    if (org === 'Org1') {
        ccp = buildCCPOrg1();
        walletPath = path.join(__dirname, '../wallet/org1');
    } else if (org === 'Org2') {
        ccp = buildCCPOrg2();
        walletPath = path.join(__dirname, '../wallet/org2');
    } else if (org === 'Org3') {
        ccp = buildCCPOrg3();
        walletPath = path.join(__dirname, '../wallet/org3');
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

async function registerAdminWithFabric(org, cccd) {
    const { registerAndEnrollUser } = require('../enroll/CAUtil.js');
    let ccp, walletPath, msp;
    if (org === 'Org1') {
        ccp = buildCCPOrg1();
        walletPath = path.join(__dirname, '../wallet/org1');
        msp = 'Org1MSP';
    } else if (org === 'Org2') {
        ccp = buildCCPOrg2();
        walletPath = path.join(__dirname, '../wallet/org2');
        msp = 'Org2MSP';
    } else if (org === 'Org3') {
        ccp = buildCCPOrg3();
        walletPath = path.join(__dirname, '../wallet/org3');
        msp = 'Org3MSP';
    } else {
        throw new Error('Invalid organization');
    }
    const caClient = require('../enroll/CAUtil.js').buildCAClient(
        require('fabric-ca-client'),
        ccp,
        `ca.${org.toLowerCase()}.example.com`
    );
    const wallet = await buildWallet(Wallets, walletPath);
    await registerAndEnrollUser(caClient, wallet, msp, cccd, `${org.toLowerCase()}.department1`, []);
}

module.exports = { connectToNetwork, registerAdminWithFabric };