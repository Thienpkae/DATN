#!/bin/bash

# Set environment variables
export PATH=${PWD}/bin:$PATH
export FABRIC_CFG_PATH=$PWD/configtx/

# Set MSP environment variables for Org1
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem
export CORE_PEER_TLS_ENABLED=true

# Load All Data
echo "Loading all geometry data..."
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile $PWD/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem -C mychannel -n land-cc --peerAddresses localhost:7051 --tlsRootCertFiles $PWD/organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem --peerAddresses localhost:9051 --tlsRootCertFiles $PWD/organizations/peerOrganizations/org2.example.com/tlsca/tlsca.org2.example.com-cert.pem --peerAddresses localhost:11051 --tlsRootCertFiles $PWD/organizations/peerOrganizations/org3.example.com/tlsca/tlsca.org3.example.com-cert.pem -c '{"function":"LoadAllData","Args":[]}'

echo "Data loading complete!"
