
Prerequisites
```shell
sudo apt-get install git curl golang-go jq -y

sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release

sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update

sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

docker --version
docker compose version

echo 'alias docker-compose="docker compose"' >> ~/.bashrc
source ~/.bashrc

sudo reboot
```

Install Fabric
```shell
curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh && chmod +x install-fabric.sh
./install-fabric.sh d
```

Install NVM and Node

```shell
# Cài đặt nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

nvm --version

# Cài đặt NodeJS
nvm install 22
nvm alias default 22
nvm use 22
```

Install MongoDB Ubuntu
```shell
sudo apt-get install gnupg curl

curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg \
   --dearmor

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list

sudo apt-get update

sudo apt-get install -y mongodb-org

sudo systemctl start mongod

sudo systemctl daemon-reload

sudo systemctl enable mongod

# Tạo user admin
mongosh

use admin

db.createUser({
  user: "admin",
  pwd: "admin123",
  roles: [ { role: "root", db: "admin" } ]
})
```


How to run project

<h3> Deploy Fabric network </h3>

```shell
cd test-network 

./network.sh createChannel -ca -s couchdb

cd addOrg3

./addOrg3.sh up -ca -s couchdb

cd ..

./network.sh deployCC -ccn land-cc -ccp ../land-chaincode/ -ccl go -cci "Init"
```

<h3> Deploy Backend in 2th terminal </h3>

Enroll Admin for 3 Org 

```shell
cd application-javascript

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
cd frontend

npm i

npm start
```

The frontend will run on http://localhost:5000

The backend API runs on http://localhost:3000

## Default Admin Accounts

When the server starts for the first time, it automatically creates admin accounts for each organization:

| Organization | User ID | Password | CCCD | Phone | Role |
|-------------|---------|----------|------|-------|------|
| Org1 (Land Authority) | admin-org1 | Admin123! | 000000000001 | 0900000001 | Authority Admin |
| Org2 (Government Office) | admin-org2 | Admin123! | 000000000002 | 0900000002 | Officer Admin |  
| Org3 (Citizens) | admin-org3 | Admin123! | 000000000003 | 0900000003 | Citizen Admin |

**Note:** Change these default passwords after first login for security.

<h3> Down Fabric network </h3>

```shell 
./network.sh down
```
