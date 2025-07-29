package chaincode

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// QueryByKeyword thực hiện truy vấn theo từ khóa trên các thực thể với bộ lọc và phân quyền
func (s *LandRegistryChaincode) QueryByKeyword(ctx contractapi.TransactionContextInterface, entityType, keyword string, filters map[string]string, userID string) (interface{}, error) {
	// Xác định tổ chức của người gọi
	mspID, err := GetCallerOrgMSP(ctx)
	if err != nil {
		return nil, err
	}

	// Chuẩn hóa entityType
	entityType = strings.ToLower(entityType)
	var allowedEntities []string
	var allowedOrgs []string

	// Phân quyền theo tổ chức và thực thể
	switch mspID {
	case "Org1MSP", "Org2MSP":
		allowedEntities = []string{"landparcel", "landcertificate", "landtransaction", "document", "transactionlog"}
		allowedOrgs = []string{"Org1MSP", "Org2MSP"}
	case "Org3MSP":
		allowedEntities = []string{"landparcel", "landcertificate", "landtransaction", "document"}
		allowedOrgs = []string{"Org3MSP"}
	default:
		return nil, fmt.Errorf("tổ chức %s không được phép truy vấn", mspID)
	}

	// Kiểm tra entityType hợp lệ
	if !contains(allowedEntities, entityType) {
		return nil, fmt.Errorf("thực thể %s không được phép truy vấn bởi tổ chức %s", entityType, mspID)
	}

	// Kiểm tra quyền tổ chức
	if err := CheckOrganization(ctx, allowedOrgs); err != nil {
		return nil, err
	}

	// Xây dựng query string
	queryString, err := buildQueryString(entityType, keyword, filters, userID, mspID)
	if err != nil {
		return nil, err
	}

	// Thực hiện truy vấn
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi truy vấn %s: %v", entityType, err)
	}
	defer resultsIterator.Close()

	// Xử lý kết quả theo entityType
	switch entityType {
	case "landparcel":
		var parcels []*LandParcel
		for resultsIterator.HasNext() {
			queryResponse, err := resultsIterator.Next()
			if err != nil {
				return nil, fmt.Errorf("lỗi khi duyệt kết quả: %v", err)
			}
			var parcel LandParcel
			if err := json.Unmarshal(queryResponse.Value, &parcel); err != nil {
				return nil, fmt.Errorf("lỗi khi giải mã thửa đất: %v", err)
			}
			// Kiểm tra quyền Org3
			if mspID == "Org3MSP" && parcel.OwnerID != userID {
				continue
			}
			parcels = append(parcels, &parcel)
		}
		return parcels, RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "QUERY_BY_KEYWORD", userID, fmt.Sprintf("Truy vấn thửa đất với từ khóa %s", keyword))

	case "landcertificate":
		var certificates []*LandCertificate
		for resultsIterator.HasNext() {
			queryResponse, err := resultsIterator.Next()
			if err != nil {
				return nil, fmt.Errorf("lỗi khi duyệt kết quả: %v", err)
			}
			var cert LandCertificate
			if err := json.Unmarshal(queryResponse.Value, &cert); err != nil {
				return nil, fmt.Errorf("lỗi khi giải mã GCN: %v", err)
			}
			// Kiểm tra quyền Org3
			if mspID == "Org3MSP" && cert.OwnerID != userID {
				continue
			}
			certificates = append(certificates, &cert)
		}
		return certificates, RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "QUERY_BY_KEYWORD", userID, fmt.Sprintf("Truy vấn GCN với từ khóa %s", keyword))

	case "landtransaction":
		var transactions []*LandTransaction
		for resultsIterator.HasNext() {
			queryResponse, err := resultsIterator.Next()
			if err != nil {
				return nil, fmt.Errorf("lỗi khi duyệt kết quả: %v", err)
			}
			var tx LandTransaction
			if err := json.Unmarshal(queryResponse.Value, &tx); err != nil {
				return nil, fmt.Errorf("lỗi khi giải mã giao dịch: %v", err)
			}
			// Kiểm tra quyền Org3
			if mspID == "Org3MSP" && tx.FromOwnerID != userID && tx.ToOwnerID != userID {
				continue
			}
			transactions = append(transactions, &tx)
		}
		return transactions, RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "QUERY_BY_KEYWORD", userID, fmt.Sprintf("Truy vấn giao dịch với từ khóa %s", keyword))

	case "document":
		var documents []*Document
		for resultsIterator.HasNext() {
			queryResponse, err := resultsIterator.Next()
			if err != nil {
				return nil, fmt.Errorf("lỗi khi duyệt kết quả: %v", err)
			}
			var doc Document
			if err := json.Unmarshal(queryResponse.Value, &doc); err != nil {
				return nil, fmt.Errorf("lỗi khi giải mã tài liệu: %v", err)
			}
			// Kiểm tra quyền Org3
			if mspID == "Org3MSP" {
				parcelData, err := ctx.GetStub().GetState(doc.LandParcelID)
				if err != nil || parcelData == nil {
					continue
				}
				var parcel LandParcel
				if err := json.Unmarshal(parcelData, &parcel); err != nil {
					continue
				}
				if parcel.OwnerID != userID {
					continue
				}
			}
			documents = append(documents, &doc)
		}
		return documents, RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "QUERY_BY_KEYWORD", userID, fmt.Sprintf("Truy vấn tài liệu với từ khóa %s", keyword))

	case "transactionlog":
		var logs []*TransactionLog
		for resultsIterator.HasNext() {
			queryResponse, err := resultsIterator.Next()
			if err != nil {
				return nil, fmt.Errorf("lỗi khi duyệt kết quả: %v", err)
			}
			var log TransactionLog
			if err := json.Unmarshal(queryResponse.Value, &log); err != nil {
				return nil, fmt.Errorf("lỗi khi giải mã nhật ký: %v", err)
			}
			logs = append(logs, &log)
		}
		return logs, RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "QUERY_BY_KEYWORD", userID, fmt.Sprintf("Truy vấn nhật ký với từ khóa %s", keyword))
	}

	return nil, fmt.Errorf("thực thể %s không được hỗ trợ", entityType)
}

// QueryLandParcelByID truy vấn theo ID khóa chính (Org1, Org2, Org3)
func (s *LandRegistryChaincode) QueryLandParcelByID(ctx contractapi.TransactionContextInterface, id, userID string) (*LandParcel, error) {
	if err := CheckOrganization(ctx, []string{"Org1MSP", "Org2MSP", "Org3MSP"}); err != nil {
		return nil, err
	}

	data, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi truy vấn thửa đất %s: %v", id, err)
	}
	if data == nil {
		return nil, fmt.Errorf("thửa đất %s không tồn tại", id)
	}

	var parcel LandParcel
	if err := json.Unmarshal(data, &parcel); err != nil {
		return nil, fmt.Errorf("lỗi khi giải mã thửa đất: %v", err)
	}

	// Kiểm tra quyền Org3
	if mspID, _ := GetCallerOrgMSP(ctx); mspID == "Org3MSP" && parcel.OwnerID != userID {
		return nil, fmt.Errorf("người dùng %s không có quyền truy vấn thửa đất %s", userID, id)
	}

	return &parcel, RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "QUERY_LAND_PARCEL", userID, fmt.Sprintf("Truy vấn thửa đất %s", id))
}

// QueryCertificateByID truy vấn GCN theo ID khóa chính (Org1, Org2, Org3)
func (s *LandRegistryChaincode) QueryCertificateByID(ctx contractapi.TransactionContextInterface, certificateID, userID string) (*LandCertificate, error) {
	if err := CheckOrganization(ctx, []string{"Org1MSP", "Org2MSP", "Org3MSP"}); err != nil {
		return nil, err
	}

	data, err := ctx.GetStub().GetState(certificateID)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi truy vấn GCN %s: %v", certificateID, err)
	}
	if data == nil {
		return nil, fmt.Errorf("GCN %s không tồn tại", certificateID)
	}

	var cert LandCertificate
	if err := json.Unmarshal(data, &cert); err != nil {
		return nil, fmt.Errorf("lỗi khi giải mã GCN: %v", err)
	}

	// Kiểm tra quyền Org3
	if mspID, _ := GetCallerOrgMSP(ctx); mspID == "Org3MSP" && cert.OwnerID != userID {
		return nil, fmt.Errorf("người dùng %s không có quyền truy vấn GCN %s", userID, certificateID)
	}

	return &cert, RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "QUERY_CERTIFICATE", userID, fmt.Sprintf("Truy vấn GCN %s", certificateID))
}

// QueryTransactionByID truy vấn giao dịch theo ID khóa chính (Org1, Org2, Org3)
func (s *LandRegistryChaincode) QueryTransactionByID(ctx contractapi.TransactionContextInterface, txID, userID string) (*LandTransaction, error) {
	if err := CheckOrganization(ctx, []string{"Org1MSP", "Org2MSP", "Org3MSP"}); err != nil {
		return nil, err
	}

	data, err := ctx.GetStub().GetState(txID)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi truy vấn giao dịch %s: %v", txID, err)
	}
	if data == nil {
		return nil, fmt.Errorf("giao dịch %s không tồn tại", txID)
	}

	var tx LandTransaction
	if err := json.Unmarshal(data, &tx); err != nil {
		return nil, fmt.Errorf("lỗi khi giải mã giao dịch: %v", err)
	}

	// Kiểm tra quyền Org3
	if mspID, _ := GetCallerOrgMSP(ctx); mspID == "Org3MSP" && tx.FromOwnerID != userID && tx.ToOwnerID != userID {
		return nil, fmt.Errorf("người dùng %s không có quyền truy vấn giao dịch %s", userID, txID)
	}

	return &tx, RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "QUERY_TRANSACTION", userID, fmt.Sprintf("Truy vấn giao dịch %s", txID))
}

// QueryDocumentByID truy vấn tài liệu theo ID khóa chính (Org1, Org2, Org3)
func (s *LandRegistryChaincode) QueryDocumentByID(ctx contractapi.TransactionContextInterface, docID, userID string) (*Document, error) {
	if err := CheckOrganization(ctx, []string{"Org1MSP", "Org2MSP", "Org3MSP"}); err != nil {
		return nil, err
	}

	data, err := ctx.GetStub().GetState(docID)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi truy vấn tài liệu %s: %v", docID, err)
	}
	if data == nil {
		return nil, fmt.Errorf("tài liệu %s không tồn tại", docID)
	}

	var doc Document
	if err := json.Unmarshal(data, &doc); err != nil {
		return nil, fmt.Errorf("lỗi khi giải mã tài liệu: %v", err)
	}

	// Kiểm tra quyền Org3
	if mspID, _ := GetCallerOrgMSP(ctx); mspID == "Org3MSP" {
		parcelData, err := ctx.GetStub().GetState(doc.LandParcelID)
		if err != nil {
			return nil, fmt.Errorf("lỗi khi kiểm tra thửa đất %s: %v", doc.LandParcelID, err)
		}
		if parcelData == nil {
			return nil, fmt.Errorf("thửa đất %s không tồn tại", doc.LandParcelID)
		}
		var parcel LandParcel
		if err := json.Unmarshal(parcelData, &parcel); err != nil {
			return nil, fmt.Errorf("lỗi khi giải mã thửa đất: %v", err)
		}
		if parcel.OwnerID != userID {
			return nil, fmt.Errorf("người dùng %s không có quyền truy vấn tài liệu %s", userID, docID)
		}
	}

	return &doc, RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "QUERY_DOCUMENT", userID, fmt.Sprintf("Truy vấn tài liệu %s", docID))
}

// buildQueryString xây dựng CouchDB query string dựa trên entityType, keyword và filters
func buildQueryString(entityType, keyword string, filters map[string]string, userID, mspID string) (string, error) {
	selector := map[string]interface{}{}

	// Thêm từ khóa tìm kiếm
	if keyword != "" {
		keyword = strings.ReplaceAll(keyword, `"`, `\"`) // Sanitize
		regexKeyword := fmt.Sprintf(".*%s.*", keyword)
		switch entityType {
		case "landparcel":
			selector["$or"] = []map[string]interface{}{
				{"location": map[string]string{"$regex": regexKeyword}},
				{"landUsePurpose": map[string]string{"$regex": regexKeyword}},
				{"legalStatus": map[string]string{"$regex": regexKeyword}},
			}
		case "landcertificate":
			selector["legalInfo"] = map[string]string{"$regex": regexKeyword}
		case "landtransaction":
			selector["$or"] = []map[string]interface{}{
				{"details": map[string]string{"$regex": regexKeyword}},
				{"type": map[string]string{"$regex": regexKeyword}},
				{"status": map[string]string{"$regex": regexKeyword}},
			}
		case "document":
			selector["$or"] = []map[string]interface{}{
				{"description": map[string]string{"$regex": regexKeyword}},
				{"ipfsHash": map[string]string{"$regex": regexKeyword}},
			}
		case "transactionlog":
			selector["$or"] = []map[string]interface{}{
				{"details": map[string]string{"$regex": regexKeyword}},
				{"action": map[string]string{"$regex": regexKeyword}},
			}
		}
	}

	// Thêm bộ lọc
	if mspID == "Org3MSP" {
		switch entityType {
		case "landparcel", "landcertificate":
			selector["ownerId"] = userID
		case "landtransaction":
			selector["$or"] = []map[string]interface{}{
				{"fromOwnerId": userID},
				{"toOwnerId": userID},
			}
		case "document":
			// Lọc tài liệu theo landParcelID của người dùng sẽ được xử lý sau khi truy vấn
		}
	}

	if filters != nil {
		switch entityType {
		case "landcertificate":
			if startDate, ok := filters["startDate"]; ok && startDate != "" {
				if _, ok := selector["issueDate"]; !ok {
					selector["issueDate"] = map[string]string{}
				}
				selector["issueDate"].(map[string]string)["$gte"] = startDate
			}
			if endDate, ok := filters["endDate"]; ok && endDate != "" {
				if _, ok := selector["issueDate"]; !ok {
					selector["issueDate"] = map[string]string{}
				}
				selector["issueDate"].(map[string]string)["$lte"] = endDate
			}
		case "landtransaction":
			if status, ok := filters["status"]; ok && status != "" {
				selector["status"] = status
			}
			if txType, ok := filters["type"]; ok && txType != "" {
				selector["type"] = txType
			}
			if startTime, ok := filters["startTime"]; ok && startTime != "" {
				if _, ok := selector["createdAt"]; !ok {
					selector["createdAt"] = map[string]string{}
				}
				selector["createdAt"].(map[string]string)["$gte"] = startTime
			}
			if endTime, ok := filters["endTime"]; ok && endTime != "" {
				if _, ok := selector["createdAt"]; !ok {
					selector["createdAt"] = map[string]string{}
				}
				selector["createdAt"].(map[string]string)["$lte"] = endTime
			}
		}
	}

	// Đảm bảo selector không rỗng
	if len(selector) == 0 {
		selector["$and"] = []map[string]interface{}{}
	}

	queryBytes, err := json.Marshal(map[string]interface{}{"selector": selector})
	if err != nil {
		return "", fmt.Errorf("lỗi khi mã hóa query: %v", err)
	}

	return string(queryBytes), nil
}

// contains kiểm tra phần tử có trong slice
func contains(slice []string, elem string) bool {
	for _, s := range slice {
		if s == elem {
			return true
		}
	}
	return false
}
