package chaincode

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// QueryLandParcelByID truy vấn thông tin thửa đất theo ID (UC-08, Org1, Org2, Org3)
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

	return &parcel, RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "QUERY_LAND_PARCEL", userID, fmt.Sprintf("Truy vấn thửa đất %s", id))
}

// QueryLandParcelsByOwner truy vấn danh sách thửa đất theo OwnerID (UC-08, UC-12, Org3 only)
func (s *LandRegistryChaincode) QueryLandParcelsByOwner(ctx contractapi.TransactionContextInterface, ownerID, userID string) ([]*LandParcel, error) {
	if err := CheckOrganization(ctx, []string{"Org3MSP"}); err != nil {
		return nil, err
	}

	// Chỉ cho phép người dân truy vấn thửa đất của chính mình
	if ownerID != userID {
		return nil, fmt.Errorf("người dùng %s không có quyền truy vấn thửa đất của ownerID %s", userID, ownerID)
	}

	queryString := fmt.Sprintf(`{"selector":{"ownerId":"%s"}}`, ownerID)
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi truy vấn thửa đất theo ownerID %s: %v", ownerID, err)
	}
	defer resultsIterator.Close()

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
		parcels = append(parcels, &parcel)
	}

	return parcels, RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "QUERY_LAND_PARCELS_BY_OWNER", userID, fmt.Sprintf("Truy vấn danh sách thửa đất của ownerID %s", ownerID))
}

// QueryLandParcelsByLocation truy vấn thửa đất theo vị trí (UC-08, Org1, Org2 only)
func (s *LandRegistryChaincode) QueryLandParcelsByLocation(ctx contractapi.TransactionContextInterface, location string) ([]*LandParcel, error) {
	if err := CheckOrganization(ctx, []string{"Org1MSP", "Org2MSP"}); err != nil {
		return nil, err
	}
	userID, err := GetCallerID(ctx)
	if err != nil {
		return nil, err
	}

	queryString := fmt.Sprintf(`{"selector":{"location":"%s"}}`, location)
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi truy vấn thửa đất theo location %s: %v", location, err)
	}
	defer resultsIterator.Close()

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
		parcels = append(parcels, &parcel)
	}

	return parcels, RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "QUERY_LAND_PARCELS_BY_LOCATION", userID, fmt.Sprintf("Truy vấn thửa đất theo location %s", location))
}

// QueryLandParcelsByPurpose truy vấn thửa đất theo mục đích sử dụng (UC-08, Org1, Org2 only)
func (s *LandRegistryChaincode) QueryLandParcelsByPurpose(ctx contractapi.TransactionContextInterface, landUsePurpose string) ([]*LandParcel, error) {
	if err := CheckOrganization(ctx, []string{"Org1MSP", "Org2MSP"}); err != nil {
		return nil, err
	}
	userID, err := GetCallerID(ctx)
	if err != nil {
		return nil, err
	}

	queryString := fmt.Sprintf(`{"selector":{"landUsePurpose":"%s"}}`, landUsePurpose)
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi truy vấn thửa đất theo mục đích sử dụng %s: %v", landUsePurpose, err)
	}
	defer resultsIterator.Close()

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
		parcels = append(parcels, &parcel)
	}

	return parcels, RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "QUERY_LAND_PARCELS_BY_PURPOSE", userID, fmt.Sprintf("Truy vấn thửa đất theo mục đích sử dụng %s", landUsePurpose))
}

// QueryLandParcelsByLegalStatus truy vấn thửa đất theo trạng thái pháp lý (UC-08, Org1, Org2 only)
func (s *LandRegistryChaincode) QueryLandParcelsByLegalStatus(ctx contractapi.TransactionContextInterface, legalStatus string) ([]*LandParcel, error) {
	if err := CheckOrganization(ctx, []string{"Org1MSP", "Org2MSP"}); err != nil {
		return nil, err
	}
	userID, err := GetCallerID(ctx)
	if err != nil {
		return nil, err
	}

	queryString := fmt.Sprintf(`{"selector":{"legalStatus":"%s"}}`, legalStatus)
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi truy vấn thửa đất theo trạng thái pháp lý %s: %v", legalStatus, err)
	}
	defer resultsIterator.Close()

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
		parcels = append(parcels, &parcel)
	}

	return parcels, RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "QUERY_LAND_PARCELS_BY_LEGAL_STATUS", userID, fmt.Sprintf("Truy vấn thửa đất theo trạng thái pháp lý %s", legalStatus))
}

// QueryCertificatesByOwner truy vấn danh sách GCN theo OwnerID (UC-12, Org3 only)
func (s *LandRegistryChaincode) QueryCertificatesByOwner(ctx contractapi.TransactionContextInterface, ownerID, userID string) ([]*LandCertificate, error) {
	if err := CheckOrganization(ctx, []string{"Org3MSP"}); err != nil {
		return nil, err
	}

	// Chỉ cho phép người dân truy vấn GCN của chính mình
	if ownerID != userID {
		return nil, fmt.Errorf("người dùng %s không có quyền truy vấn GCN của ownerID %s", userID, ownerID)
	}

	queryString := fmt.Sprintf(`{"selector":{"ownerId":"%s"}}`, ownerID)
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi truy vấn GCN theo ownerID %s: %v", ownerID, err)
	}
	defer resultsIterator.Close()

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
		cert.Signature = "" // Ẩn chữ ký số
		certificates = append(certificates, &cert)
	}

	return certificates, RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "QUERY_CERTIFICATES_BY_OWNER", userID, fmt.Sprintf("Truy vấn danh sách GCN của ownerID %s", ownerID))
}

// QueryCertificateByID truy vấn chi tiết GCN theo CertificateID (UC-12, UC-27, Org3 only)
func (s *LandRegistryChaincode) QueryCertificateByID(ctx contractapi.TransactionContextInterface, certificateID, userID string) (*LandCertificate, error) {
	if err := CheckOrganization(ctx, []string{"Org3MSP"}); err != nil {
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

	// Chỉ cho phép người dân xem GCN của mình
	if cert.OwnerID != userID {
		return nil, fmt.Errorf("người dùng %s không có quyền truy vấn GCN %s", userID, certificateID)
	}

	cert.Signature = "" // Ẩn chữ ký số

	return &cert, RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "QUERY_CERTIFICATE", userID, fmt.Sprintf("Truy vấn GCN %s", certificateID))
}

// QueryCertificatesByLandParcel truy vấn GCN theo LandParcelID (UC-12, Org3 only)
func (s *LandRegistryChaincode) QueryCertificatesByLandParcel(ctx contractapi.TransactionContextInterface, landParcelID, userID string) ([]*LandCertificate, error) {
	if err := CheckOrganization(ctx, []string{"Org3MSP"}); err != nil {
		return nil, err
	}

	// Chỉ cho phép người dân truy vấn GCN của thửa đất thuộc sở hữu của họ
	data, err := ctx.GetStub().GetState(landParcelID)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi kiểm tra thửa đất %s: %v", landParcelID, err)
	}
	if data == nil {
		return nil, fmt.Errorf("thửa đất %s không tồn tại", landParcelID)
	}
	var parcel LandParcel
	if err := json.Unmarshal(data, &parcel); err != nil {
		return nil, fmt.Errorf("lỗi khi giải mã thửa đất: %v", err)
	}
	if parcel.OwnerID != userID {
		return nil, fmt.Errorf("người dùng %s không có quyền truy vấn GCN của thửa đất %s", userID, landParcelID)
	}

	queryString := fmt.Sprintf(`{"selector":{"landParcelId":"%s"}}`, landParcelID)
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi truy vấn GCN theo landParcelID %s: %v", landParcelID, err)
	}
	defer resultsIterator.Close()

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
		cert.Signature = "" // Ẩn chữ ký số
		certificates = append(certificates, &cert)
	}

	return certificates, RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "QUERY_CERTIFICATES_BY_LAND_PARCEL", userID, fmt.Sprintf("Truy vấn GCN theo landParcelID %s", landParcelID))
}

// QueryCertificatesByIssueDate truy vấn GCN theo khoảng thời gian cấp (UC-27, Org1, Org2 only)
func (s *LandRegistryChaincode) QueryCertificatesByIssueDate(ctx contractapi.TransactionContextInterface, startDate, endDate string) ([]*LandCertificate, error) {
	if err := CheckOrganization(ctx, []string{"Org1MSP", "Org2MSP"}); err != nil {
		return nil, err
	}
	userID, err := GetCallerID(ctx)
	if err != nil {
		return nil, err
	}

	queryString := fmt.Sprintf(`{"selector":{"issueDate":{"$gte":"%s","$lte":"%s"}}}`, startDate, endDate)
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi truy vấn GCN theo issueDate: %v", err)
	}
	defer resultsIterator.Close()

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
		certificates = append(certificates, &cert)
	}

	return certificates, RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "QUERY_CERTIFICATES_BY_ISSUE_DATE", userID, fmt.Sprintf("Truy vấn GCN theo issueDate từ %s đến %s", startDate, endDate))
}

// QueryTransactionByID truy vấn trạng thái và lịch sử xử lý hồ sơ (UC-19, Org3 only)
func (s *LandRegistryChaincode) QueryTransactionByID(ctx contractapi.TransactionContextInterface, txID, userID string) (*LandTransaction, error) {
	if err := CheckOrganization(ctx, []string{"Org3MSP"}); err != nil {
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

	// Chỉ cho phép người dân xem giao dịch liên quan đến họ
	if tx.FromOwnerID != userID && tx.ToOwnerID != userID {
		return nil, fmt.Errorf("người dùng %s không có quyền truy vấn giao dịch %s", userID, txID)
	}

	tx.Signature = "" // Ẩn chữ ký số

	return &tx, RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "QUERY_TRANSACTION", userID, fmt.Sprintf("Truy vấn giao dịch %s", txID))
}

// QueryTransactionsByCriteria truy vấn và lọc hồ sơ theo tiêu chí (UC-09, Org1, Org2 only)
func (s *LandRegistryChaincode) QueryTransactionsByCriteria(ctx contractapi.TransactionContextInterface, status, txType, startTime, endTime string) ([]*LandTransaction, error) {
	if err := CheckOrganization(ctx, []string{"Org1MSP", "Org2MSP"}); err != nil {
		return nil, err
	}
	userID, err := GetCallerID(ctx)
	if err != nil {
		return nil, err
	}

	queryString := fmt.Sprintf(`{"selector":{"type":"%s","status":"%s","createdAt":{"$gte":"%s","$lte":"%s"}}}`, txType, status, startTime, endTime)
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi truy vấn hồ sơ theo tiêu chí: %v", err)
	}
	defer resultsIterator.Close()

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
		transactions = append(transactions, &tx)
	}

	return transactions, RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "QUERY_TRANSACTIONS_BY_CRITERIA", userID, fmt.Sprintf("Truy vấn hồ sơ theo tiêu chí status=%s, type=%s, từ %s đến %s", status, txType, startTime, endTime))
}

// QueryTransactionsByLandParcel truy vấn giao dịch theo LandParcelID (UC-08, Org3 only)
func (s *LandRegistryChaincode) QueryTransactionsByLandParcel(ctx contractapi.TransactionContextInterface, landParcelID, userID string) ([]*LandTransaction, error) {
	if err := CheckOrganization(ctx, []string{"Org3MSP"}); err != nil {
		return nil, err
	}

	// Chỉ cho phép người dân truy vấn giao dịch của thửa đất thuộc sở hữu của họ
	data, err := ctx.GetStub().GetState(landParcelID)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi kiểm tra thửa đất %s: %v", landParcelID, err)
	}
	if data == nil {
		return nil, fmt.Errorf("thửa đất %s không tồn tại", landParcelID)
	}
	var parcel LandParcel
	if err := json.Unmarshal(data, &parcel); err != nil {
		return nil, fmt.Errorf("lỗi khi giải mã thửa đất: %v", err)
	}
	if parcel.OwnerID != userID {
		return nil, fmt.Errorf("người dùng %s không có quyền truy vấn giao dịch của thửa đất %s", userID, landParcelID)
	}

	queryString := fmt.Sprintf(`{"selector":{"landParcelId":"%s"}}`, landParcelID)
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi truy vấn giao dịch theo landParcelID %s: %v", landParcelID, err)
	}
	defer resultsIterator.Close()

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
		tx.Signature = "" // Ẩn chữ ký số
		transactions = append(transactions, &tx)
	}

	return transactions, RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "QUERY_TRANSACTIONS_BY_LAND_PARCEL", userID, fmt.Sprintf("Truy vấn giao dịch theo landParcelID %s", landParcelID))
}

// QueryTransactionsByOwner truy vấn giao dịch theo OwnerID (UC-09, Org3 only)
func (s *LandRegistryChaincode) QueryTransactionsByOwner(ctx contractapi.TransactionContextInterface, ownerID, userID string) ([]*LandTransaction, error) {
	if err := CheckOrganization(ctx, []string{"Org3MSP"}); err != nil {
		return nil, err
	}

	// Chỉ cho phép người dân truy vấn giao dịch liên quan đến chính họ
	if ownerID != userID {
		return nil, fmt.Errorf("người dùng %s không có quyền truy vấn giao dịch của ownerID %s", userID, ownerID)
	}

	queryString := fmt.Sprintf(`{"selector":{"$or":[{"fromOwnerId":"%s"},{"toOwnerId":"%s"}]}}`, ownerID, ownerID)
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi truy vấn giao dịch theo ownerID %s: %v", ownerID, err)
	}
	defer resultsIterator.Close()

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
		tx.Signature = "" // Ẩn chữ ký số
		transactions = append(transactions, &tx)
	}

	return transactions, RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "QUERY_TRANSACTIONS_BY_OWNER", userID, fmt.Sprintf("Truy vấn giao dịch theo ownerID %s", ownerID))
}

// QueryDocumentByID truy vấn tài liệu theo DocID (UC-11, Org3 only)
func (s *LandRegistryChaincode) QueryDocumentByID(ctx contractapi.TransactionContextInterface, docID, userID string) (*Document, error) {
	if err := CheckOrganization(ctx, []string{"Org3MSP"}); err != nil {
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

	// Chỉ cho phép người dân xem tài liệu liên quan đến thửa đất của họ
	data, err = ctx.GetStub().GetState(doc.LandParcelID)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi kiểm tra thửa đất %s: %v", doc.LandParcelID, err)
	}
	if data == nil {
		return nil, fmt.Errorf("thửa đất %s không tồn tại", doc.LandParcelID)
	}
	var parcel LandParcel
	if err := json.Unmarshal(data, &parcel); err != nil {
		return nil, fmt.Errorf("lỗi khi giải mã thửa đất: %v", err)
	}
	if parcel.OwnerID != userID {
		return nil, fmt.Errorf("người dùng %s không có quyền truy vấn tài liệu %s", userID, docID)
	}

	return &doc, RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "QUERY_DOCUMENT", userID, fmt.Sprintf("Truy vấn tài liệu %s", docID))
}

// QueryDocumentsByLandParcel truy vấn tài liệu theo LandParcelID (UC-11, Org3 only)
func (s *LandRegistryChaincode) QueryDocumentsByLandParcel(ctx contractapi.TransactionContextInterface, landParcelID, userID string) ([]*Document, error) {
	if err := CheckOrganization(ctx, []string{"Org3MSP"}); err != nil {
		return nil, err
	}

	// Chỉ cho phép người dân xem tài liệu của thửa đất thuộc sở hữu của họ
	data, err := ctx.GetStub().GetState(landParcelID)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi kiểm tra thửa đất %s: %v", landParcelID, err)
	}
	if data == nil {
		return nil, fmt.Errorf("thửa đất %s không tồn tại", landParcelID)
	}
	var parcel LandParcel
	if err := json.Unmarshal(data, &parcel); err != nil {
		return nil, fmt.Errorf("lỗi khi giải mã thửa đất: %v", err)
	}
	if parcel.OwnerID != userID {
		return nil, fmt.Errorf("người dùng %s không có quyền truy vấn tài liệu của thửa đất %s", userID, landParcelID)
	}

	queryString := fmt.Sprintf(`{"selector":{"landParcelId":"%s"}}`, landParcelID)
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi truy vấn tài liệu theo landParcelID %s: %v", landParcelID, err)
	}
	defer resultsIterator.Close()

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
		documents = append(documents, &doc)
	}

	return documents, RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "QUERY_DOCUMENTS_BY_LAND_PARCEL", userID, fmt.Sprintf("Truy vấn tài liệu theo landParcelID %s", landParcelID))
}

// QueryDocumentsByTransaction truy vấn tài liệu theo TxID (UC-25, Org3 only)
func (s *LandRegistryChaincode) QueryDocumentsByTransaction(ctx contractapi.TransactionContextInterface, txID, userID string) ([]*Document, error) {
	if err := CheckOrganization(ctx, []string{"Org3MSP"}); err != nil {
		return nil, err
	}

	// Chỉ cho phép người dân xem tài liệu của giao dịch liên quan đến họ
	data, err := ctx.GetStub().GetState(txID)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi kiểm tra giao dịch %s: %v", txID, err)
	}
	if data == nil {
		return nil, fmt.Errorf("giao dịch %s không tồn tại", txID)
	}
	var tx LandTransaction
	if err := json.Unmarshal(data, &tx); err != nil {
		return nil, fmt.Errorf("lỗi khi giải mã giao dịch: %v", err)
	}
	if tx.FromOwnerID != userID && tx.ToOwnerID != userID {
		return nil, fmt.Errorf("người dùng %s không có quyền truy vấn tài liệu của giao dịch %s", userID, txID)
	}

	queryString := fmt.Sprintf(`{"selector":{"txId":"%s"}}`, txID)
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi truy vấn tài liệu theo txID %s: %v", txID, err)
	}
	defer resultsIterator.Close()

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
		documents = append(documents, &doc)
	}

	return documents, RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "QUERY_DOCUMENTS_BY_TRANSACTION", userID, fmt.Sprintf("Truy vấn tài liệu theo txID %s", txID))
}

// QueryDocumentsByIPFSHash truy vấn tài liệu theo IPFS hash (UC-25, Org1, Org2 only)
func (s *LandRegistryChaincode) QueryDocumentsByIPFSHash(ctx contractapi.TransactionContextInterface, ipfsHash string) ([]*Document, error) {
	if err := CheckOrganization(ctx, []string{"Org1MSP", "Org2MSP"}); err != nil {
		return nil, err
	}
	userID, err := GetCallerID(ctx)
	if err != nil {
		return nil, err
	}

	if err := ValidateIPFSHash(ipfsHash); err != nil {
		return nil, err
	}

	queryString := fmt.Sprintf(`{"selector":{"ipfsHash":"%s"}}`, ipfsHash)
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi truy vấn tài liệu theo ipfsHash %s: %v", ipfsHash, err)
	}
	defer resultsIterator.Close()

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
		documents = append(documents, &doc)
	}

	return documents, RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "QUERY_DOCUMENTS_BY_IPFS_HASH", userID, fmt.Sprintf("Truy vấn tài liệu theo ipfsHash %s", ipfsHash))
}

// QueryLogsByTransaction truy vấn nhật ký giao dịch theo TxID (UC-19, Org1, Org2 only)
func (s *LandRegistryChaincode) QueryLogsByTransaction(ctx contractapi.TransactionContextInterface, txID, userID string) ([]*TransactionLog, error) {
	if err := CheckOrganization(ctx, []string{"Org1MSP", "Org2MSP"}); err != nil {
		return nil, err
	}

	// Kiểm tra giao dịch tồn tại
	data, err := ctx.GetStub().GetState(txID)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi kiểm tra giao dịch %s: %v", txID, err)
	}
	if data == nil {
		return nil, fmt.Errorf("giao dịch %s không tồn tại", txID)
	}

	// Truy vấn nhật ký giao dịch
	queryString := fmt.Sprintf(`{"selector":{"txId":"%s"}}`, txID)
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi truy vấn nhật ký theo txID %s: %v", txID, err)
	}
	defer resultsIterator.Close()

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

	return logs, RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "QUERY_LOGS_BY_TRANSACTION", userID, fmt.Sprintf("Truy vấn nhật ký giao dịch theo txID %s", txID))
}
