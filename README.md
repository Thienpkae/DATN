
Dependencies: Set up Hyperledger Fabric environment: [Hyperledger Fabric Official Docs](https://hyperledger-fabric.readthedocs.io/en/latest/getting_started.html)

How to run project

<h3> Deploy Fabric network </h3>

```shell
cd test-network 

./network.sh createChannel -ca -s couchdb

cd addOrg3

./addOrg3.sh up -ca -s couchdb

cd ..

./network.sh deployCC -ccn land-cc -ccp ../land-chaincode/ -ccl go -ccep "OR('Org1MSP.peer','Org2MSP.peer','Org3MSP.peer')"
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


<h3> Down Fabric network </h3>

```shell 
cd ../test-network
./network.sh down
```
