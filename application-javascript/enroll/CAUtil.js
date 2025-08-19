'use strict';

const adminUserId = 'admin';
const adminUserPasswd = 'adminpw';

exports.buildCAClient = (FabricCAServices, ccp, caHostName) => {
	const caInfo = ccp.certificateAuthorities[caHostName];
	const caTLSCACerts = caInfo.tlsCACerts.pem;
	const caClient = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);
	console.log(`Built a CA Client named ${caInfo.caName}`);
	return caClient;
};

exports.enrollAdmin = async (caClient, wallet, orgMspId) => {
	try {
		const identity = await wallet.get(adminUserId);
		if (identity) {
			console.log('An identity for the admin user already exists in the wallet');
			return;
		}
		const enrollment = await caClient.enroll({ enrollmentID: adminUserId, enrollmentSecret: adminUserPasswd });
		const x509Identity = {
			credentials: {
				certificate: enrollment.certificate,
				privateKey: enrollment.key.toBytes(),
			},
			mspId: orgMspId,
			type: 'X.509',
		};
		await wallet.put(adminUserId, x509Identity);
		console.log('Successfully enrolled admin user and imported it into the wallet');
	} catch (error) {
		console.error(`Failed to enroll admin user: ${error}`);
	}
};

exports.registerAndEnrollUser = async (caClient, wallet, orgMspId, cccd, affiliation, attributes) => {
	try {
		const userIdentity = await wallet.get(cccd);
		if (userIdentity) {
			console.log(`An identity for the user with CCCD ${cccd} already exists in the wallet`);
			return true;
		}
		const adminIdentity = await wallet.get(adminUserId);
		if (!adminIdentity) {
			throw new Error('Admin identity is missing in wallet. Please enroll admin first.');
		}
		const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
		const adminUser = await provider.getUserContext(adminIdentity, adminUserId);
		let secret;
		try {
			secret = await caClient.register({
				affiliation: affiliation,
				enrollmentID: cccd,
				role: 'client',
				attrs: attributes
			}, adminUser);
		} catch (err) {
			// Attempt to create the affiliation then retry once if authorization failure
			if (String(err).includes('Authorization failure')) {
				try {
					const affService = caClient.newAffiliationService();
					await affService.create({ name: affiliation, force: true }, adminUser);
					secret = await caClient.register({
						affiliation: affiliation,
						enrollmentID: cccd,
						role: 'client',
						attrs: attributes
					}, adminUser);
				} catch (e2) {
					throw err; // keep original error context
				}
			} else {
				throw err;
			}
		}
		const enrollment = await caClient.enroll({
			enrollmentID: cccd,
			enrollmentSecret: secret,
			attr_reqs: attributes.map(attr => ({ name: attr.name, optional: false }))
		});
		const x509Identity = {
			credentials: {
				certificate: enrollment.certificate,
				privateKey: enrollment.key.toBytes(),
			},
			mspId: orgMspId,
			type: 'X.509',
		};
		await wallet.put(cccd, x509Identity);
		console.log(`Successfully registered and enrolled user with CCCD ${cccd} with attributes`);
		return true;
	} catch (error) {
		console.error(`Failed to register user with CCCD ${cccd}: ${error}`);
		throw error;
	}
};