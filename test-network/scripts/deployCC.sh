#!/usr/bin/env bash

source scripts/utils.sh

CHANNEL_NAME=${1:-"mychannel"}
CC_NAME=${2}
CC_SRC_PATH=${3}
CC_SRC_LANGUAGE=${4}
CC_VERSION=${5:-"1.0"}
CC_SEQUENCE=${6:-"1"}
CC_INIT_FCN=${7:-"NA"}
CC_END_POLICY=${8:-"NA"}
CC_COLL_CONFIG=${9:-"NA"}
DELAY=${10:-"3"}
MAX_RETRY=${11:-"5"}
VERBOSE=${12:-"false"}

println "executing with the following"
println "- CHANNEL_NAME: ${C_GREEN}${CHANNEL_NAME}${C_RESET}"
println "- CC_NAME: ${C_GREEN}${CC_NAME}${C_RESET}"
println "- CC_SRC_PATH: ${C_GREEN}${CC_SRC_PATH}${C_RESET}"
println "- CC_SRC_LANGUAGE: ${C_GREEN}${CC_SRC_LANGUAGE}${C_RESET}"
println "- CC_VERSION: ${C_GREEN}${CC_VERSION}${C_RESET}"
println "- CC_SEQUENCE: ${C_GREEN}${CC_SEQUENCE}${C_RESET}"
println "- CC_END_POLICY: ${C_GREEN}${CC_END_POLICY}${C_RESET}"
println "- CC_COLL_CONFIG: ${C_GREEN}${CC_COLL_CONFIG}${C_RESET}"
println "- CC_INIT_FCN: ${C_GREEN}${CC_INIT_FCN}${C_RESET}"
println "- DELAY: ${C_GREEN}${DELAY}${C_RESET}"
println "- MAX_RETRY: ${C_GREEN}${MAX_RETRY}${C_RESET}"
println "- VERBOSE: ${C_GREEN}${VERBOSE}${C_RESET}"

INIT_REQUIRED="--init-required"
if [ "$CC_INIT_FCN" = "NA" ]; then
  INIT_REQUIRED=""
fi

if [ "$CC_END_POLICY" = "NA" ]; then
  CC_END_POLICY=""
else
  CC_END_POLICY="--signature-policy $CC_END_POLICY"
fi

if [ "$CC_COLL_CONFIG" = "NA" ]; then
  CC_COLL_CONFIG=""
else
  CC_COLL_CONFIG="--collections-config $CC_COLL_CONFIG"
fi

FABRIC_CFG_PATH=$PWD/configtx/

. scripts/envVar.sh
. scripts/ccutils.sh

function checkPrereqs() {
  jq --version > /dev/null 2>&1

  if [[ $? -ne 0 ]]; then
    errorln "jq command not found..."
    errorln
    errorln "Follow the instructions in the Fabric docs to install the prereqs"
    errorln "https://hyperledger-fabric.readthedocs.io/en/latest/prereqs.html"
    exit 1
  fi
}

checkPrereqs

./scripts/packageCC.sh $CC_NAME $CC_SRC_PATH $CC_SRC_LANGUAGE $CC_VERSION 

PACKAGE_ID=$(peer lifecycle chaincode calculatepackageid ${CC_NAME}.tar.gz)

## Install chaincode on all orgs
infoln "Installing chaincode on peer0.org1..."
installChaincode 1
infoln "Installing chaincode on peer0.org2..."
installChaincode 2
infoln "Installing chaincode on peer0.org3..."
installChaincode 3

resolveSequence

## Query installed
queryInstalled 1

## Approve for org1
approveForMyOrg 1

## Check readiness - org1 approved
checkCommitReadiness 1 "\"Org1MSP\": true" "\"Org2MSP\": false" "\"Org3MSP\": false"
checkCommitReadiness 2 "\"Org1MSP\": true" "\"Org2MSP\": false" "\"Org3MSP\": false"
checkCommitReadiness 3 "\"Org1MSP\": true" "\"Org2MSP\": false" "\"Org3MSP\": false"

## Approve for org2
approveForMyOrg 2

## Check readiness - org1+org2 approved
checkCommitReadiness 1 "\"Org1MSP\": true" "\"Org2MSP\": true" "\"Org3MSP\": false"
checkCommitReadiness 2 "\"Org1MSP\": true" "\"Org2MSP\": true" "\"Org3MSP\": false"
checkCommitReadiness 3 "\"Org1MSP\": true" "\"Org2MSP\": true" "\"Org3MSP\": false"

## Approve for org3
approveForMyOrg 3

## Check readiness - all orgs approved
checkCommitReadiness 1 "\"Org1MSP\": true" "\"Org2MSP\": true" "\"Org3MSP\": true"
checkCommitReadiness 2 "\"Org1MSP\": true" "\"Org2MSP\": true" "\"Org3MSP\": true"
checkCommitReadiness 3 "\"Org1MSP\": true" "\"Org2MSP\": true" "\"Org3MSP\": true"

## Commit chaincode definition
commitChaincodeDefinition 1 2 3

## Query committed
queryCommitted 1
queryCommitted 2
queryCommitted 3

## Invoke Init if required
if [ "$CC_INIT_FCN" = "NA" ]; then
  infoln "Chaincode initialization is not required"
else
  chaincodeInvokeInit 1 2 3
fi

exit 0
