
Dependencies: Set up Hyperledger Fabric environment: [Hyperledger Fabric Official Docs](https://hyperledger-fabric.readthedocs.io/en/latest/getting_started.html)

How to run project

<h3> Deploy Fabric network </h3>

```shell
cd test-network 

./network.sh createChannel -ca -s couchdb

cd addOrg3

./addOrg3.sh up -ca -s couchdb

cd ..

./network.sh deployCC -ccn auction -ccp ../chaincode-go -ccl go
```

<h3> Deploy Backend </h3>

Install packages

```shell
cd ../application-javascript

npm i
```

Enroll Admin for 3 Org

```shell
cd enroll

node enrollAdmin.js org1
node enrollAdmin.js org2
node enrollAdmin.js org3
```

Run server

```shell
cd ..

node app.js 
```

This is Postman test: [Auction Fabric test](https://www.postman.com/research-administrator-81537314/workspace/n-tt-nghip/collection/37567808-4ba15873-7906-42aa-8f1f-610c8678b67d?action=share&creator=37567808)

<h3> Down Fabric network </h3>

```shell 
cd test-network
./network.sh down
```
