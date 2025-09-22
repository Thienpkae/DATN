package chaincode

import (
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// InitRealData - Initialize empty (data will be loaded separately)
func (s *LandRegistryChaincode) InitRealData(ctx contractapi.TransactionContextInterface) error {
	// Empty initialization - data will be loaded via LoadData functions
	return nil
}

