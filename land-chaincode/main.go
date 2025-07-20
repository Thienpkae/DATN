package main

import (
	"fabric/DATN/land-chaincode/chaincode"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

func main() {
	chaincode, err := contractapi.NewChaincode(&chaincode.LandRegistryChaincode{})
	if err != nil {
		panic("Lỗi khi khởi tạo chaincode: " + err.Error())
	}

	if err := chaincode.Start(); err != nil {
		panic("Lỗi khi khởi động chaincode: " + err.Error())
	}
}
