package chaincode

import (
	"encoding/json"
	"fmt"
	"log"
	"strconv"
	"strings"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// ========================================
// LAND QUERY FUNCTIONS
// ========================================

// QueryLandByID - Truy vấn thửa đất theo ID với kiểm tra quyền truy cập
func (s *LandRegistryChaincode) QueryLandByID(ctx contractapi.TransactionContextInterface, landID string) (*Land, error) {
	// Lấy userID từ context
	userID, err := GetCallerID(ctx)
	if err != nil {
		return nil, err
	}

	data, err := ctx.GetStub().GetState(landID)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi truy vấn thửa đất %s: %v", landID, err)
	}
	if data == nil {
		return nil, fmt.Errorf("thửa đất %s không tồn tại", landID)
	}

    var land Land
    if err := json.Unmarshal(data, &land); err != nil {
		return nil, fmt.Errorf("lỗi khi giải mã thửa đất: %v", err)
	}
    // Normalize null arrays
    if land.DocumentIDs == nil {
        land.DocumentIDs = []string{}
    }

	// Kiểm tra quyền truy cập cho Org3MSP (công dân)
	mspID, err := GetCallerOrgMSP(ctx)
	if err != nil {
		return nil, err
	}
	if mspID == "Org3MSP" && land.OwnerID != userID {
		return nil, fmt.Errorf("người dùng %s không có quyền truy cập thửa đất %s", userID, landID)
	}

	return &land, nil
}

// GetLand - Lấy thông tin thửa đất theo ID (wrapper function)
func (s *LandRegistryChaincode) GetLand(ctx contractapi.TransactionContextInterface, landID string) (*Land, error) {
	return s.QueryLandByID(ctx, landID)
}

// QueryLandsByOwner - Truy vấn tất cả thửa đất của một chủ sử dụng
func (s *LandRegistryChaincode) QueryLandsByOwner(ctx contractapi.TransactionContextInterface, ownerID string) ([]*Land, error) {
	mspID, err := GetCallerOrgMSP(ctx)
	if err != nil {
		return nil, err
	}

	// Lấy userID từ context
	userID, err := GetCallerID(ctx)
	if err != nil {
		return nil, err
	}

	// Org3MSP chỉ có thể truy vấn thửa đất của chính họ
	if mspID == "Org3MSP" && ownerID != userID {
		return nil, fmt.Errorf("người dùng %s không có quyền truy vấn thửa đất của %s", userID, ownerID)
	}

	// Tạo truy vấn tìm kiếm theo ownerId
	queryString := fmt.Sprintf(`{"selector":{"ownerId":"%s","id":{"$exists":true},"landUsePurpose":{"$exists":true}}}`, ownerID)

	lands, err := s.getQueryResultForLands(ctx, queryString)
	if err != nil {
		return nil, err
	}

	logDetails := fmt.Sprintf("Truy vấn thửa đất theo chủ sử dụng %s", ownerID)
	if err := RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "QUERY_LANDS_BY_OWNER", userID, logDetails); err != nil {
		fmt.Printf("Lỗi khi ghi log giao dịch: %v\n", err)
	}

	return lands, nil
}

// QueryLandsByKeyword - Truy vấn thửa đất theo từ khóa với bộ lọc
func (s *LandRegistryChaincode) QueryLandsByKeyword(ctx contractapi.TransactionContextInterface, keyword string, filtersJSON string) ([]*Land, error) {
	// Lấy userID từ context
	userID, err := GetCallerID(ctx)
	if err != nil {
		return nil, err
	}
	mspID, err := GetCallerOrgMSP(ctx)
	if err != nil {
		return nil, err
	}

	// Parse filters từ JSON
	filters := make(map[string]string)
	if filtersJSON != "" {
		if err := json.Unmarshal([]byte(filtersJSON), &filters); err != nil {
			return nil, fmt.Errorf("lỗi khi parse filters: %v", err)
		}
	}

	// Tạo truy vấn Mango
	queryString := buildQueryStringForLands(keyword, filters, userID, mspID)
	log.Printf("Land Query String: %s", queryString)

	// Thực hiện truy vấn
	lands, err := s.getQueryResultForLands(ctx, queryString)
	if err != nil {
		return nil, err
	}

	// Kiểm tra quyền truy cập cho Org3MSP
	if mspID == "Org3MSP" {
		filteredLands := []*Land{}
		for _, land := range lands {
			if land.OwnerID == userID {
				filteredLands = append(filteredLands, land)
			}
		}
		return filteredLands, nil
	}

	return lands, nil
}

// QueryAllLands - Truy vấn tất cả thửa đất (chỉ cho admin)
func (s *LandRegistryChaincode) QueryAllLands(ctx contractapi.TransactionContextInterface) ([]*Land, error) {
	// Chỉ Org1MSP và Org2MSP mới có thể truy vấn tất cả
	if err := CheckOrganization(ctx, []string{"Org1MSP", "Org2MSP"}); err != nil {
		return nil, err
	}

	queryString := `{"selector":{"id":{"$exists":true},"landUsePurpose":{"$exists":true}}}`
	lands, err := s.getQueryResultForLands(ctx, queryString)
	if err != nil {
		return nil, err
	}

	return lands, nil
}

// GetLandHistory - Trả về lịch sử thay đổi của một thửa đất
func (s *LandRegistryChaincode) GetLandHistory(ctx contractapi.TransactionContextInterface, landID string) ([]map[string]interface{}, error) {
	// Lấy userID từ context
	userID, err := GetCallerID(ctx)
	if err != nil {
		return nil, err
	}

	mspID, err := GetCallerOrgMSP(ctx)
	if err != nil {
		return nil, err
	}

	// Kiểm tra quyền truy cập cho Org3MSP
	if mspID == "Org3MSP" {
		land, err := s.QueryLandByID(ctx, landID)
		if err != nil {
			return nil, fmt.Errorf("lỗi khi kiểm tra quyền sở hữu thửa đất %s: %v", landID, err)
		}
		if land.OwnerID != userID {
			return nil, fmt.Errorf("người dùng %s không có quyền truy cập lịch sử thửa đất %s", userID, landID)
		}
	}

	resultsIterator, err := ctx.GetStub().GetHistoryForKey(landID)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi truy vấn lịch sử thửa đất %s: %v", landID, err)
	}
	defer resultsIterator.Close()

	// Initialize empty slice to ensure proper JSON array even when no results
	history := make([]map[string]interface{}, 0)
	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return nil, fmt.Errorf("lỗi khi đọc kết quả lịch sử: %v", err)
		}

		var land Land
		if len(response.Value) > 0 {
			if err := json.Unmarshal(response.Value, &land); err != nil {
				return nil, fmt.Errorf("lỗi khi giải mã dữ liệu thửa đất: %v", err)
			}
		} else {
			land = Land{ID: landID}
		}

		historyEntry := map[string]interface{}{
			"txId":      response.TxId,
			"timestamp": response.Timestamp,
			"isDelete":  response.IsDelete,
			"land":      land,
		}
		history = append(history, historyEntry)
	}

	if len(history) == 0 {
		return nil, fmt.Errorf("không tìm thấy lịch sử cho thửa đất %s", landID)
	}

	logDetails := fmt.Sprintf("Truy vấn lịch sử thửa đất %s", landID)
	if err := RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "GET_LAND_HISTORY", userID, logDetails); err != nil {
		fmt.Printf("Lỗi khi ghi log giao dịch: %v\n", err)
	}

	return history, nil
}

// ========================================
// DOCUMENT QUERY FUNCTIONS
// ========================================

// GetDocument - Lấy thông tin tài liệu theo ID
func (s *LandRegistryChaincode) GetDocument(ctx contractapi.TransactionContextInterface, docID string) (*Document, error) {
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

	// Kiểm tra quyền truy cập cho Org3
	mspID, err := GetCallerOrgMSP(ctx)
	if err != nil {
		return nil, err
	}
	if mspID == "Org3MSP" {
		userID, err := GetCallerID(ctx)
		if err != nil {
			return nil, err
		}
		
		// Allow access if user uploaded the document
		if doc.UploadedBy == userID {
			return &doc, nil
		}
		
		// Allow access if document is part of a transaction where user is involved
		if s.canUserAccessTransactionDocument(ctx, userID, docID) {
			return &doc, nil
		}
		
		// Allow access if document is linked to a land parcel owned by the user
		if s.canUserAccessLandDocument(ctx, userID, docID) {
			return &doc, nil
		}
		
		return nil, fmt.Errorf("người dùng %s không có quyền truy cập tài liệu %s", userID, docID)
	}

	return &doc, nil
}

// QueryDocuments - Truy vấn tài liệu theo thửa đất hoặc giao dịch
func (s *LandRegistryChaincode) QueryDocuments(ctx contractapi.TransactionContextInterface, entityType, entityID string) ([]string, error) {
	switch entityType {
	case "land":
		land, err := s.QueryLandByID(ctx, entityID)
		if err != nil {
			return nil, err
		}
		return land.DocumentIDs, nil
	case "transaction":
		tx, err := s.QueryTransactionByID(ctx, entityID)
		if err != nil {
			return nil, err
		}
		return tx.DocumentIDs, nil
	default:
		return nil, fmt.Errorf("loại thực thể %s không được hỗ trợ", entityType)
	}
}

// QueryDocumentsByLandParcel - Truy vấn tài liệu theo thửa đất
func (s *LandRegistryChaincode) QueryDocumentsByLandParcel(ctx contractapi.TransactionContextInterface, landParcelID string) ([]*Document, error) {
	land, err := s.QueryLandByID(ctx, landParcelID)
	if err != nil {
		return nil, err
	}

	var documents []*Document
	for _, docID := range land.DocumentIDs {
		doc, err := s.GetDocument(ctx, docID)
		if err == nil {
			documents = append(documents, doc)
		}
	}

	return documents, nil
}

// QueryDocumentsByTransaction - Truy vấn tài liệu theo giao dịch
func (s *LandRegistryChaincode) QueryDocumentsByTransaction(ctx contractapi.TransactionContextInterface, txID string) ([]*Document, error) {
	tx, err := s.QueryTransactionByID(ctx, txID)
	if err != nil {
		return nil, err
	}

	var documents []*Document
	for _, docID := range tx.DocumentIDs {
		doc, err := s.GetDocument(ctx, docID)
		if err == nil {
			documents = append(documents, doc)
		}
	}

	return documents, nil
}

// QueryDocumentsByStatus - Truy vấn tài liệu theo trạng thái (pending/verified)
func (s *LandRegistryChaincode) QueryDocumentsByStatus(ctx contractapi.TransactionContextInterface, status string) ([]*Document, error) {
	// Lấy userID từ context
	userID, err := GetCallerID(ctx)
	if err != nil {
		return nil, err
	}

	switch status {
	case "pending":
		// Chỉ Org2 mới được truy vấn tài liệu chờ chứng thực
		if err := CheckOrganization(ctx, []string{"Org2MSP"}); err != nil {
			return nil, err
		}
	case "verified":
		// Tất cả các org đều có thể xem verified documents - không cần check
	default:
		return nil, fmt.Errorf("trạng thái %s không được hỗ trợ", status)
	}

	// Truy vấn tất cả tài liệu theo trạng thái
	queryString := fmt.Sprintf(`{"selector":{"status":"%s"}}`, strings.ToUpper(status))

	documents, err := s.getQueryResultForDocuments(ctx, queryString)
	if err != nil {
		return nil, err
	}

	// Lọc theo quyền truy cập cho Org3
	mspID, err := GetCallerOrgMSP(ctx)
	if err == nil && mspID == "Org3MSP" {
		var filteredDocs []*Document
		for _, doc := range documents {
			if doc.UploadedBy == userID {
				filteredDocs = append(filteredDocs, doc)
			}
		}
		return filteredDocs, nil
	}

	return documents, nil
}

// QueryDocumentsByType - Truy vấn tài liệu theo loại
func (s *LandRegistryChaincode) QueryDocumentsByType(ctx contractapi.TransactionContextInterface, docType string) ([]*Document, error) {
	// Lấy userID từ context
	userID, err := GetCallerID(ctx)
	if err != nil {
		return nil, err
	}

	queryString := fmt.Sprintf(`{"selector":{"type":"%s"}}`, docType)

	documents, err := s.getQueryResultForDocuments(ctx, queryString)
	if err != nil {
		return nil, err
	}

	// Lọc theo quyền truy cập cho Org3
	mspID, err := GetCallerOrgMSP(ctx)
	if err == nil && mspID == "Org3MSP" {
		var filteredDocs []*Document
		for _, doc := range documents {
			if doc.UploadedBy == userID {
				filteredDocs = append(filteredDocs, doc)
			}
		}
		return filteredDocs, nil
	}

	return documents, nil
}

// QueryDocumentsByUploader - Truy vấn tài liệu theo người upload
func (s *LandRegistryChaincode) QueryDocumentsByUploader(ctx contractapi.TransactionContextInterface, uploaderID string) ([]*Document, error) {
	// Lấy userID từ context
	userID, err := GetCallerID(ctx)
	if err != nil {
		return nil, err
	}

	// Kiểm tra quyền truy cập cho Org3
	mspID, err := GetCallerOrgMSP(ctx)
	if err != nil {
		return nil, err
	}

	if mspID == "Org3MSP" && uploaderID != userID {
		// Chỉ cho phép xem tài liệu của chính mình
		return nil, fmt.Errorf("người dùng %s không có quyền xem tài liệu của %s", userID, uploaderID)
	}

	queryString := fmt.Sprintf(`{"selector":{"uploadedBy":"%s"}}`, uploaderID)

	documents, err := s.getQueryResultForDocuments(ctx, queryString)
	if err != nil {
		return nil, err
	}

	return documents, nil
}

// QueryDocumentsByKeyword - Truy vấn tài liệu theo từ khóa
func (s *LandRegistryChaincode) QueryDocumentsByKeyword(ctx contractapi.TransactionContextInterface, keyword string, filtersJSON string) ([]*Document, error) {
	// Lấy userID từ context
	userID, err := GetCallerID(ctx)
	if err != nil {
		return nil, err
	}
	mspID, err := GetCallerOrgMSP(ctx)
	if err != nil {
		return nil, err
	}

	// Parse filters từ JSON
	filters := make(map[string]string)
	if filtersJSON != "" {
		if err := json.Unmarshal([]byte(filtersJSON), &filters); err != nil {
			return nil, fmt.Errorf("lỗi khi parse filters: %v", err)
		}
	}

	// Tạo query cho tài liệu
	queryString := buildQueryStringForDocuments(keyword, filters, userID, mspID)
	log.Printf("Document Query String: %s", queryString)

	documents, err := s.getQueryResultForDocuments(ctx, queryString)
	if err != nil {
		log.Printf("Error executing document query: %v", err)
		return nil, fmt.Errorf("lỗi khi thực hiện truy vấn tài liệu: %v", err)
	}

	log.Printf("Found %d documents", len(documents))
	return documents, nil
}

// QueryAllDocuments - Truy vấn tất cả tài liệu (chỉ cho admin)
func (s *LandRegistryChaincode) QueryAllDocuments(ctx contractapi.TransactionContextInterface) ([]*Document, error) {
	// Chỉ Org1MSP và Org2MSP mới có thể truy vấn tất cả
	if err := CheckOrganization(ctx, []string{"Org1MSP", "Org2MSP"}); err != nil {
		return nil, err
	}

	queryString := `{"selector":{"docID":{"$exists":true,"$ne":""},"type":{"$exists":true,"$nin":["","LOG"]},"ipfsHash":{"$exists":true,"$ne":""}}}`
	documents, err := s.getQueryResultForDocuments(ctx, queryString)
	if err != nil {
		return nil, err
	}

	return documents, nil
}

// QueryPendingDocuments - Truy vấn tài liệu chờ chứng thực (backward compatibility)
func (s *LandRegistryChaincode) QueryPendingDocuments(ctx contractapi.TransactionContextInterface) ([]*Document, error) {
	return s.QueryDocumentsByStatus(ctx, "pending")
}

// QueryVerifiedDocuments - Truy vấn tài liệu đã chứng thực (backward compatibility)
func (s *LandRegistryChaincode) QueryVerifiedDocuments(ctx contractapi.TransactionContextInterface) ([]*Document, error) {
	return s.QueryDocumentsByStatus(ctx, "verified")
}

// QueryDocumentHistory - Truy vấn lịch sử thay đổi của tài liệu (sử dụng GetHistoryForKey)
func (s *LandRegistryChaincode) QueryDocumentHistory(ctx contractapi.TransactionContextInterface, docID string) ([]map[string]interface{}, error) {
    // Lấy userID từ context
    userID, err := GetCallerID(ctx)
    if err != nil {
        return nil, err
    }

    // Kiểm tra quyền truy cập
    mspID, err := GetCallerOrgMSP(ctx)
    if err != nil {
        return nil, err
    }

    // Lấy lịch sử thay đổi của tài liệu sử dụng GetHistoryForKey
    resultsIterator, err := ctx.GetStub().GetHistoryForKey(docID)
    if err != nil {
        return nil, fmt.Errorf("lỗi khi lấy lịch sử tài liệu: %v", err)
    }
    defer resultsIterator.Close()

    var history []map[string]interface{}
    var firstSnapshot Document
    hasSnapshot := false

    for resultsIterator.HasNext() {
        response, err := resultsIterator.Next()
        if err != nil {
            return nil, fmt.Errorf("lỗi khi đọc kết quả lịch sử: %v", err)
        }

        var docData Document
        if len(response.Value) > 0 {
            if err := json.Unmarshal(response.Value, &docData); err != nil {
                return nil, fmt.Errorf("lỗi khi giải mã dữ liệu tài liệu: %v", err)
            }
            if !hasSnapshot {
                firstSnapshot = docData
                hasSnapshot = true
            }
        } else {
            docData = Document{DocID: docID}
        }

        historyEntry := map[string]interface{}{
            "txId":      response.TxId,
            "timestamp": response.Timestamp,
            "isDelete":  response.IsDelete,
            "document":  docData,
        }
        history = append(history, historyEntry)
    }

    if len(history) == 0 {
        return nil, fmt.Errorf("không tìm thấy lịch sử cho tài liệu %s", docID)
    }

    // Org3MSP chỉ có thể xem lịch sử tài liệu của chính mình
    if mspID == "Org3MSP" {
        if hasSnapshot {
            if firstSnapshot.UploadedBy != userID {
                return nil, fmt.Errorf("người dùng %s không có quyền xem lịch sử tài liệu %s", userID, docID)
            }
        } else {
            // Không thể xác định chủ sở hữu từ lịch sử (hiếm gặp), từ chối để an toàn
            return nil, fmt.Errorf("không thể xác minh quyền truy cập lịch sử tài liệu %s", docID)
        }
    }

    // Ghi log giao dịch
    logDetails := fmt.Sprintf("Truy vấn lịch sử tài liệu %s", docID)
    if err := RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "QUERY_DOCUMENT_HISTORY", userID, logDetails); err != nil {
        log.Printf("Lỗi khi ghi log giao dịch: %v", err)
    }

    return history, nil
}

// ========================================
// TRANSACTION QUERY FUNCTIONS
// ========================================

// QueryTransactionByID - Truy vấn giao dịch theo ID với kiểm tra quyền truy cập
func (s *LandRegistryChaincode) QueryTransactionByID(ctx contractapi.TransactionContextInterface, txID string) (*Transaction, error) {
	// Lấy userID từ context
	userID, err := GetCallerID(ctx)
	if err != nil {
		return nil, err
	}

	tx, err := GetTransaction(ctx, txID)
	if err != nil {
		return nil, err
	}

	// Kiểm tra quyền truy cập cho Org3MSP
	mspID, err := GetCallerOrgMSP(ctx)
	if err != nil {
		return nil, err
	}
	if mspID == "Org3MSP" && tx.FromOwnerID != userID && tx.ToOwnerID != userID {
		return nil, fmt.Errorf("người dùng %s không có quyền truy cập giao dịch %s", userID, txID)
	}

	return tx, nil
}

// GetTransaction - Lấy thông tin giao dịch theo ID (wrapper function)
func (s *LandRegistryChaincode) GetTransaction(ctx contractapi.TransactionContextInterface, txID string) (*Transaction, error) {
	return s.QueryTransactionByID(ctx, txID)
}

// QueryTransactionsByOwner - Truy vấn tất cả giao dịch của một chủ sử dụng
func (s *LandRegistryChaincode) QueryTransactionsByOwner(ctx contractapi.TransactionContextInterface, ownerID string) ([]*Transaction, error) {
	mspID, err := GetCallerOrgMSP(ctx)
	if err != nil {
		return nil, err
	}

	// Lấy userID từ context
	userID, err := GetCallerID(ctx)
	if err != nil {
		return nil, err
	}

	// Org3MSP chỉ có thể truy vấn giao dịch của chính họ
	if mspID == "Org3MSP" && ownerID != userID {
		return nil, fmt.Errorf("người dùng %s không có quyền truy vấn giao dịch của %s", userID, ownerID)
	}

	// Tạo truy vấn tìm kiếm giao dịch mà user tham gia (loại bỏ LOG entries)
	queryString := fmt.Sprintf(`{"selector":{"$or":[{"fromOwnerId":"%s"},{"toOwnerId":"%s"}],"txId":{"$exists":true},"type":{"$exists":true,"$ne":"LOG"}}}`, ownerID, ownerID)

	transactions, err := s.getQueryResultForTransactions(ctx, queryString)
	if err != nil {
		return nil, err
	}

	logDetails := fmt.Sprintf("Truy vấn giao dịch theo chủ sử dụng %s", ownerID)
	if err := RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "QUERY_TRANSACTIONS_BY_OWNER", userID, logDetails); err != nil {
		fmt.Printf("Lỗi khi ghi log giao dịch: %v\n", err)
	}

	return transactions, nil
}

// QueryTransactionsByStatus - Truy vấn giao dịch theo trạng thái
func (s *LandRegistryChaincode) QueryTransactionsByStatus(ctx contractapi.TransactionContextInterface, status string) ([]*Transaction, error) {
	// Chỉ có Org1MSP và Org2MSP mới có thể truy vấn theo trạng thái
	if err := CheckOrganization(ctx, []string{"Org1MSP", "Org2MSP"}); err != nil {
		return nil, err
	}

	// Lấy userID từ context
	userID, err := GetCallerID(ctx)
	if err != nil {
		return nil, err
	}

	// Tạo truy vấn tìm kiếm theo trạng thái (loại bỏ LOG entries)
	queryString := fmt.Sprintf(`{"selector":{"status":"%s","txId":{"$exists":true},"type":{"$exists":true,"$ne":"LOG"}}}`, status)

	transactions, err := s.getQueryResultForTransactions(ctx, queryString)
	if err != nil {
		return nil, err
	}

	logDetails := fmt.Sprintf("Truy vấn giao dịch theo trạng thái %s", status)
	if err := RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "QUERY_TRANSACTIONS_BY_STATUS", userID, logDetails); err != nil {
		fmt.Printf("Lỗi khi ghi log giao dịch: %v\n", err)
	}

	return transactions, nil
}

// QueryTransactionsByKeyword - Truy vấn giao dịch theo từ khóa với bộ lọc
func (s *LandRegistryChaincode) QueryTransactionsByKeyword(ctx contractapi.TransactionContextInterface, keyword string, filtersJSON string) ([]*Transaction, error) {
	// Lấy userID từ context
	userID, err := GetCallerID(ctx)
	if err != nil {
		return nil, err
	}
	mspID, err := GetCallerOrgMSP(ctx)
	if err != nil {
		return nil, err
	}
	// Parse filters từ JSON
	filters := make(map[string]string)
	if filtersJSON != "" {
		if err := json.Unmarshal([]byte(filtersJSON), &filters); err != nil {
			return nil, fmt.Errorf("lỗi khi parse filters: %v", err)
		}
	}

	// Tạo truy vấn Mango
	queryString := buildQueryStringForTransactions(keyword, filters, userID, mspID)
	log.Printf("Transaction Query String: %s", queryString)

	// Thực hiện truy vấn
	txs, err := s.getQueryResultForTransactions(ctx, queryString)
	if err != nil {
		return nil, err
	}

	// Kiểm tra quyền truy cập cho Org3MSP
	if mspID == "Org3MSP" {
		filteredTxs := []*Transaction{}
		for _, tx := range txs {
			if tx.FromOwnerID == userID || tx.ToOwnerID == userID {
				filteredTxs = append(filteredTxs, tx)
			}
		}
		return filteredTxs, nil
	}

	return txs, nil
}

// QueryAllTransactions - Truy vấn tất cả giao dịch (chỉ cho admin)
func (s *LandRegistryChaincode) QueryAllTransactions(ctx contractapi.TransactionContextInterface) ([]*Transaction, error) {
	// Chỉ Org1MSP và Org2MSP mới có thể truy vấn tất cả
	if err := CheckOrganization(ctx, []string{"Org1MSP", "Org2MSP"}); err != nil {
		return nil, err
	}

	queryString := `{"selector":{"txId":{"$exists":true},"type":{"$exists":true,"$ne":"LOG"}}}`
	transactions, err := s.getQueryResultForTransactions(ctx, queryString)
	if err != nil {
		return nil, err
	}

	return transactions, nil
}

// GetTransactionHistory - Trả về lịch sử thay đổi của một giao dịch
func (s *LandRegistryChaincode) GetTransactionHistory(ctx contractapi.TransactionContextInterface, txID string) ([]map[string]interface{}, error) {
	// Lấy userID từ context
	userID, err := GetCallerID(ctx)
	if err != nil {
		return nil, err
	}

	mspID, err := GetCallerOrgMSP(ctx)
	if err != nil {
		return nil, err
	}

	// Kiểm tra quyền truy cập cho Org3MSP
	if mspID == "Org3MSP" {
		tx, err := s.QueryTransactionByID(ctx, txID)
		if err != nil {
			return nil, fmt.Errorf("lỗi khi kiểm tra quyền truy cập giao dịch %s: %v", txID, err)
		}
		if tx.FromOwnerID != userID && tx.ToOwnerID != userID {
			return nil, fmt.Errorf("người dùng %s không có quyền truy cập lịch sử giao dịch %s", userID, txID)
		}
	}

	resultsIterator, err := ctx.GetStub().GetHistoryForKey(txID)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi truy vấn lịch sử giao dịch %s: %v", txID, err)
	}
	defer resultsIterator.Close()

	// Initialize empty slice to ensure proper JSON array even when no results
	history := make([]map[string]interface{}, 0)
	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return nil, fmt.Errorf("lỗi khi đọc kết quả lịch sử: %v", err)
		}

		var tx Transaction
		if len(response.Value) > 0 {
			if err := json.Unmarshal(response.Value, &tx); err != nil {
				return nil, fmt.Errorf("lỗi khi giải mã dữ liệu giao dịch: %v", err)
			}
		} else {
			tx = Transaction{TxID: txID}
		}

		historyEntry := map[string]interface{}{
			"txId":        response.TxId,
			"timestamp":   response.Timestamp,
			"isDelete":    response.IsDelete,
			"transaction": tx,
		}
		history = append(history, historyEntry)
	}

	if len(history) == 0 {
		return nil, fmt.Errorf("không tìm thấy lịch sử cho giao dịch %s", txID)
	}

	logDetails := fmt.Sprintf("Truy vấn lịch sử giao dịch %s", txID)
	if err := RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "GET_TRANSACTION_HISTORY", userID, logDetails); err != nil {
		fmt.Printf("Lỗi khi ghi log giao dịch: %v\n", err)
	}

	return history, nil
}

// ========================================
// GENERAL QUERY FUNCTIONS
// ========================================

// QueryByKeyword - wrapper function for backward compatibility (returns []byte)
func (s *LandRegistryChaincode) QueryByKeyword(ctx contractapi.TransactionContextInterface, entityType, keyword string, filtersJSON string) ([]byte, error) {
	switch entityType {
	case "land":
		lands, err := s.QueryLandsByKeyword(ctx, keyword, filtersJSON)
		if err != nil {
			return nil, err
		}
		resultBytes, err := json.Marshal(lands)
		if err != nil {
			return nil, fmt.Errorf("lỗi khi tuần tự hóa kết quả land: %v", err)
		}
		return resultBytes, nil

	case "transaction":
		txs, err := s.QueryTransactionsByKeyword(ctx, keyword, filtersJSON)
		if err != nil {
			return nil, err
		}
		resultBytes, err := json.Marshal(txs)
		if err != nil {
			return nil, fmt.Errorf("lỗi khi tuần tự hóa kết quả transaction: %v", err)
		}
		return resultBytes, nil

	case "document":
		// Truy vấn tài liệu theo từ khóa
		documents, err := s.QueryDocumentsByKeyword(ctx, keyword, filtersJSON)
		if err != nil {
			return nil, err
		}
		resultBytes, err := json.Marshal(documents)
		if err != nil {
			return nil, fmt.Errorf("lỗi khi tuần tự hóa kết quả document: %v", err)
		}
		return resultBytes, nil

	default:
		return nil, fmt.Errorf("loại thực thể %s không được hỗ trợ", entityType)
	}
}

// QueryForKeyword - wrapper function for backward compatibility
func (s *LandRegistryChaincode) QueryForKeyword(ctx contractapi.TransactionContextInterface, entityType, keyword, filtersJSON string) ([]byte, error) {
	return s.QueryByKeyword(ctx, entityType, keyword, filtersJSON)
}

// ========================================
// HELPER QUERY FUNCTIONS
// ========================================

// buildQueryStringForLands - Tạo chuỗi truy vấn Mango cho thửa đất
func buildQueryStringForLands(keyword string, filters map[string]string, userID, mspID string) string {
	selector := map[string]interface{}{}

	// Thửa đất có các trường id, ownerId, landUsePurpose. legalStatus
	selector["id"] = map[string]interface{}{"$exists": true}
	selector["ownerId"] = map[string]interface{}{"$exists": true}
	selector["landUsePurpose"] = map[string]interface{}{"$exists": true}
	selector["legalStatus"] = map[string]interface{}{"$exists": true}

    if keyword != "" {
		// For numeric searches, try to parse as number for area field
		var areaConditions []map[string]interface{}
		if areaValue, err := strconv.ParseFloat(keyword, 64); err == nil {
			areaConditions = append(areaConditions, map[string]interface{}{"area": areaValue})
		}

		// Create search conditions - CouchDB regex is case-sensitive by default
        pattern := ".*" + escapeRegex(keyword) + ".*"
        searchConditions := []map[string]interface{}{
            {"id": map[string]interface{}{"$regex": pattern}},
            {"ownerId": map[string]interface{}{"$regex": pattern}},
            {"location": map[string]interface{}{"$regex": pattern}},
            {"landUsePurpose": map[string]interface{}{"$regex": pattern}},
            {"legalStatus": map[string]interface{}{"$regex": pattern}},
        }

		// Add area conditions if keyword is numeric
		searchConditions = append(searchConditions, areaConditions...)

		selector["$or"] = searchConditions
	}

	// Áp dụng các bộ lọc bổ sung
	for key, value := range filters {
		selector[key] = value
	}

	// Áp dụng kiểm soát truy cập theo tổ chức
	if mspID == "Org3MSP" {
		selector["ownerId"] = userID
	}

	queryBytes, _ := json.Marshal(map[string]interface{}{
		"selector": selector,
	})
	return string(queryBytes)
}

// buildQueryStringForTransactions - Tạo chuỗi truy vấn Mango cho giao dịch
func buildQueryStringForTransactions(keyword string, filters map[string]string, userID, mspID string) string {
	selector := map[string]interface{}{}

	// Giao dịch có các trường txId, type (loại bỏ LOG entries)
	selector["txId"] = map[string]interface{}{"$exists": true}
	selector["type"] = map[string]interface{}{"$exists": true, "$ne": "LOG"}

	if keyword != "" {
		// Create search conditions - use contains-style regex with escaping
		pattern := ".*" + escapeRegex(keyword) + ".*"
		selector["$or"] = []map[string]interface{}{
			{"txId": map[string]interface{}{"$regex": pattern}},
			{"type": map[string]interface{}{"$regex": pattern}},
			{"status": map[string]interface{}{"$regex": pattern}},
			{"details": map[string]interface{}{"$regex": pattern}},
			{"fromOwnerId": map[string]interface{}{"$regex": pattern}},
			{"toOwnerId": map[string]interface{}{"$regex": pattern}},
			{"userID": map[string]interface{}{"$regex": pattern}},
		}
	}

	// Áp dụng các bộ lọc bổ sung
	for key, value := range filters {
		selector[key] = value
	}

	// Áp dụng kiểm soát truy cập theo tổ chức
	if mspID == "Org3MSP" {
		if existingOr, hasOr := selector["$or"]; hasOr {
			// Nếu đã có mệnh đề $or (từ tìm kiếm keyword), kết hợp với kiểm soát truy cập
			selector["$and"] = []map[string]interface{}{
				{"$or": existingOr},
				{"$or": []map[string]interface{}{
					{"fromOwnerId": userID},
					{"toOwnerId": userID},
				}},
			}
			delete(selector, "$or")
		} else {
			selector["$or"] = []map[string]interface{}{
				{"fromOwnerId": userID},
				{"toOwnerId": userID},
			}
		}
	}

	queryBytes, _ := json.Marshal(map[string]interface{}{
		"selector": selector,
	})
	return string(queryBytes)
}

// buildQueryStringForDocuments - Tạo query string cho tài liệu
func buildQueryStringForDocuments(keyword string, filters map[string]string, userID, mspID string) string {
	selector := map[string]interface{}{}

	// Luôn lọc ra các bản ghi trống và LOG entries
	selector["docID"] = map[string]interface{}{"$exists": true, "$ne": ""}
	selector["type"] = map[string]interface{}{"$exists": true, "$nin": []string{"", "LOG"}}
	selector["ipfsHash"] = map[string]interface{}{"$exists": true, "$ne": ""}

	// Áp dụng các bộ lọc bổ sung
	for key, value := range filters {
		// Handle special filter fields
		if key == "verified" {
			if value == "true" {
				selector["status"] = "VERIFIED"
			} else if value == "false" {
				selector["status"] = map[string]interface{}{"$ne": "VERIFIED"}
			}
		} else if key == "type" {
			selector["type"] = value
		} else if key == "status" {
			selector["status"] = value
		} else {
			selector[key] = value
		}
	}

	// Áp dụng kiểm soát truy cập theo tổ chức
	if mspID == "Org3MSP" {
		selector["uploadedBy"] = userID
	}

	// Nếu có keyword, thêm search conditions
	if keyword != "" {
		// Tìm kiếm theo từ khóa trong các trường liên quan (contains, escape special chars)
		pattern := ".*" + escapeRegex(keyword) + ".*"
		searchConditions := []map[string]interface{}{
			{"docID": map[string]interface{}{"$regex": pattern}},
			{"title": map[string]interface{}{"$regex": pattern}},
			{"description": map[string]interface{}{"$regex": pattern}},
			{"uploadedBy": map[string]interface{}{"$regex": pattern}},
		}
		selector["$or"] = searchConditions
	}

	queryBytes, _ := json.Marshal(map[string]interface{}{
		"selector": selector,
	})
	return string(queryBytes)
}

// escapeRegex escapes special regex characters to safely build a contains pattern
func escapeRegex(input string) string {
    replacer := strings.NewReplacer(
        "\\", "\\\\",
        ".", "\\.",
        "+", "\\+",
        "*", "\\*",
        "?", "\\?",
        "^", "\\^",
        "$", "\\$",
        "(", "\\(",
        ")", "\\)",
        "[", "\\[",
        "]", "\\]",
        "{", "\\{",
        "}", "\\}",
        "|", "\\|",
    )
    return replacer.Replace(input)
}

// getQueryResultForLands - Executes the passed in query string and returns land results
func (s *LandRegistryChaincode) getQueryResultForLands(ctx contractapi.TransactionContextInterface, queryString string) ([]*Land, error) {
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	results := []*Land{}

    for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		var land *Land

		err = json.Unmarshal(response.Value, &land)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal land JSON: %v", err)
		}
        // Normalize null arrays to empty arrays for backward compatibility
        if land != nil && land.DocumentIDs == nil {
            land.DocumentIDs = []string{}
        }

		results = append(results, land)
	}
	return results, nil
}

// getQueryResultForTransactions - Executes the passed in query string and returns transaction results
func (s *LandRegistryChaincode) getQueryResultForTransactions(ctx contractapi.TransactionContextInterface, queryString string) ([]*Transaction, error) {
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	results := []*Transaction{}

	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		var tx *Transaction

		err = json.Unmarshal(response.Value, &tx)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal transaction JSON: %v", err)
		}

		// Skip LOG entries - additional safety check
		if tx.Type == "LOG" {
			continue
		}

		// Normalize null arrays to empty arrays for backward compatibility
		if tx.DocumentIDs == nil {
			tx.DocumentIDs = []string{}
		}
		if tx.ParcelIDs == nil {
			tx.ParcelIDs = []string{}
		}

		results = append(results, tx)
	}
	return results, nil
}

// getQueryResultForDocuments - Helper function để truy vấn tài liệu
func (s *LandRegistryChaincode) getQueryResultForDocuments(ctx contractapi.TransactionContextInterface, queryString string) ([]*Document, error) {
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi truy vấn tài liệu: %v", err)
	}
	defer resultsIterator.Close()

	var documents []*Document
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, fmt.Errorf("lỗi khi đọc kết quả truy vấn: %v", err)
		}

		var doc Document
		if err := json.Unmarshal(queryResult.Value, &doc); err != nil {
			log.Printf("Lỗi khi giải mã tài liệu: %v", err)
			continue
		}
		
		// Lọc ra các bản ghi trống và LOG entries
		if doc.DocID == "" || doc.Type == "" || doc.Type == "LOG" || doc.IPFSHash == "" {
			continue
		}
		
		documents = append(documents, &doc)
	}

	return documents, nil
}

// canUserAccessTransactionDocument - Kiểm tra xem người dùng có thể truy cập tài liệu của giao dịch không
func (s *LandRegistryChaincode) canUserAccessTransactionDocument(ctx contractapi.TransactionContextInterface, userID, docID string) bool {
	// Tạo query tìm kiếm các giao dịch chứa document này và user tham gia
	queryString := fmt.Sprintf(`{
		"selector": {
			"$and": [
				{"txId": {"$exists": true}},
				{"type": {"$exists": true, "$ne": "LOG"}},
				{"documentIds": {"$elemMatch": {"$eq": "%s"}}},
				{"$or": [
					{"fromOwnerId": "%s"},
					{"toOwnerId": "%s"}
				]}
			]
		}
	}`, docID, userID, userID)
	
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		log.Printf("Lỗi khi truy vấn giao dịch chứa tài liệu %s: %v", docID, err)
		return false
	}
	defer resultsIterator.Close()
	
	// Nếu tìm thấy ít nhất một giao dịch, cho phép truy cập
	return resultsIterator.HasNext()
}

// canUserAccessLandDocument - Kiểm tra xem người dùng có sở hữu thửa đất nào liên kết với tài liệu hay không
func (s *LandRegistryChaincode) canUserAccessLandDocument(ctx contractapi.TransactionContextInterface, userID, docID string) bool {
	// Tạo query tìm kiếm các thửa đất chứa document này và thuộc sở hữu của user
	queryString := fmt.Sprintf(`{
		"selector": {
			"$and": [
				{"id": {"$exists": true}},
				{"landUsePurpose": {"$exists": true}},
				{"documentIds": {"$elemMatch": {"$eq": "%s"}}},
				{"ownerId": "%s"}
			]
		}
	}`, docID, userID)
	
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		log.Printf("Lỗi khi truy vấn thửa đất chứa tài liệu %s: %v", docID, err)
		return false
	}
	defer resultsIterator.Close()
	
	// Nếu tìm thấy ít nhất một thửa đất, cho phép truy cập
	return resultsIterator.HasNext()
}
