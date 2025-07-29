
Dependencies: Set up Hyperledger Fabric environment: [Hyperledger Fabric Official Docs](https://hyperledger-fabric.readthedocs.io/en/latest/getting_started.html)

How to run project

<h3> Deploy Fabric network </h3>

```shell
cd test-network 

./network.sh createChannel -ca -s couchdb

cd addOrg3

./addOrg3.sh up -ca -s couchdb

cd ..

./network.sh deployCC -ccn land-cc -ccp ../land-chaincode/ -ccl go 
```

<h3> Deploy Backend </h3>

Enroll Admin for 3 Org

```shell
cd ../application-javascript

cd enroll

node enrollAdmin.js org1
node enrollAdmin.js org2
node enrollAdmin.js org3

cd ..
```

If an error occurs because the wallet already exists, remove wallet folder.

If missing packages

```shell
npm i
```
Run server

```shell

node server.js 
```

Test Postman: [API](https://www.postman.com/research-administrator-81537314/workspace/n-tt-nghip/collection/37567808-7d58adb8-3a6e-410e-b4f6-0faaf3f17c2a?action=share&creator=37567808)

<h3> Deploy Frontend </h3>

```shell
cd ../frontend

npm install

npm start
```

The frontend will run on http://localhost:5000
The backend API runs on http://localhost:3000

## Default Admin Accounts

When the server starts for the first time, it automatically creates admin accounts for each organization:

| Organization | User ID | Password | CCCD | Phone | Role |
|-------------|---------|----------|------|-------|------|
| Org1 (Land Authority) | admin-org1 | Admin123! | 000000000001 | +84900000001 | Authority Admin |
| Org2 (Government Office) | admin-org2 | Admin123! | 000000000002 | +84900000002 | Officer Admin |  
| Org3 (Citizens) | admin-org3 | Admin123! | 000000000003 | +84900000003 | Citizen Admin |

**Note:** Change these default passwords after first login for security.

<h3> Down Fabric network </h3>

```shell 
cd ../test-network
./network.sh down
```
