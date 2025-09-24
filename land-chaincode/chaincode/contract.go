package chaincode

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type LandRegistryChaincode struct {
	contractapi.Contract
}

// Init - Hàm khởi tạo chaincode, tự động chạy khi deploy chaincode
func (s *LandRegistryChaincode) Init(ctx contractapi.TransactionContextInterface) error {
	fmt.Println("🚀 Bắt đầu khởi tạo Land Registry Chaincode...")

	// Gọi hàm khởi tạo dữ liệu mẫu
	err := s.InitRealData(ctx)
	if err != nil {
		fmt.Printf("❌ Lỗi khi khởi tạo dữ liệu thửa đất: %v\n", err)
		return fmt.Errorf("lỗi khởi tạo dữ liệu thửa đất: %v", err)
	}

	fmt.Println("✅ Khởi tạo Land Registry Chaincode thành công!")
	return nil
}

// ========================================
// LAND PARCEL MANAGEMENT FUNCTIONS

// CreateLandParcel - Tạo thửa đất mới
func (s *LandRegistryChaincode) CreateLandParcel(ctx contractapi.TransactionContextInterface, id, ownerID, location, landUsePurpose, legalStatus, area, certificateID, legalInfo, geometryCID string, userID string) error {
	if err := CheckOrganization(ctx, []string{"Org1MSP"}); err != nil {
		return err
	}
	areaFloat, err := parseFloat(area)
	if err != nil {
		return fmt.Errorf("lỗi khi chuyển đổi diện tích: %v", err)
	}
	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}

	// Validate certificate information - khi có trạng thái pháp lý thì phải có đầy đủ thông tin GCN
	// Trừ các trạng thái đặc biệt: "", "Đang tranh chấp", "Đang thế chấp"
	if legalStatus != "" && legalStatus != "Đang tranh chấp" && legalStatus != "Đang thế chấp" {
		if certificateID == "" || legalInfo == "" {
			return fmt.Errorf("khi có trạng thái pháp lý '%s', certificateID và legalInfo là bắt buộc", legalStatus)
		}
	}

	// Validate geometry CID nếu được cung cấp
	if geometryCID != "" {
		if err := ValidateIPFSHash(geometryCID); err != nil {
			return fmt.Errorf("geometry CID không hợp lệ: %v", err)
		}
	}

	land := Land{
		ID:             id,
		OwnerID:        ownerID,
		Area:           areaFloat,
		Location:       location,
		LandUsePurpose: landUsePurpose,
		LegalStatus:    legalStatus,
		CertificateID:  certificateID,
		DocumentIDs:    []string{},
		GeometryCID:    geometryCID,
		CreatedAt:      txTime,
		UpdatedAt:      txTime,
	}

	// Set IssueDate and LegalInfo khi có trạng thái pháp lý hoặc certificateID
	// Trừ các trạng thái đặc biệt: "", "Đang tranh chấp", "Đang thế chấp"
	if legalStatus != "" && legalStatus != "Đang tranh chấp" && legalStatus != "Đang thế chấp" {
		land.IssueDate = txTime
		land.LegalInfo = legalInfo
	} else if certificateID != "" {
		// Fallback: nếu có certificateID nhưng không có trạng thái pháp lý
		land.IssueDate = txTime
		land.LegalInfo = legalInfo
	}
	if err := ValidateLand(ctx, land, false); err != nil {
		return err
	}
	landJSON, err := json.Marshal(land)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa thửa đất: %v", err)
	}
	if err := ctx.GetStub().PutState(id, landJSON); err != nil {
		return fmt.Errorf("lỗi khi lưu thửa đất: %v", err)
	}
	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "CREATE_LAND_PARCEL", userID, fmt.Sprintf("Tạo thửa đất %s", id))
}

// UpdateLandParcel - Cập nhật thông tin thửa đất
func (s *LandRegistryChaincode) UpdateLandParcel(ctx contractapi.TransactionContextInterface, id, area, location, landUsePurpose, legalStatus, certificateID, legalInfo, geometryCID string) error {
	if err := CheckOrganization(ctx, []string{"Org1MSP"}); err != nil {
		return err
	}
	userID, err := GetCallerID(ctx)
	if err != nil {
		return err
	}
	existingLand, err := s.QueryLandByID(ctx, id)
	if err != nil {
		return fmt.Errorf("lỗi khi truy vấn thửa đất %s: %v", id, err)
	}
	if err := VerifyLandLegalStatus(ctx, id, []string{"Đang tranh chấp", "Đang thế chấp"}); err != nil {
		return err
	}
	areaFloat, err := parseFloat(area)
	if err != nil {
		return fmt.Errorf("lỗi khi chuyển đổi diện tích: %v", err)
	}
	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}

	// Validate certificate information - khi có trạng thái pháp lý thì phải có đầy đủ thông tin GCN
	// Trừ các trạng thái đặc biệt: "", "Đang tranh chấp", "Đang thế chấp"
	if legalStatus != "" && legalStatus != "Đang tranh chấp" && legalStatus != "Đang thế chấp" {
		if certificateID == "" || legalInfo == "" {
			return fmt.Errorf("khi có trạng thái pháp lý '%s', certificateID và legalInfo là bắt buộc", legalStatus)
		}
	}

	// Xử lý geometry CID
	if geometryCID != "" {
		if err := ValidateIPFSHash(geometryCID); err != nil {
			return fmt.Errorf("geometry CID không hợp lệ: %v", err)
		}
	} else {
		// Giữ nguyên geometry CID hiện tại nếu không được cung cấp
		geometryCID = existingLand.GeometryCID
	}

	updatedLand := Land{
		ID:             id,
		OwnerID:        existingLand.OwnerID,
		Area:           areaFloat,
		Location:       location,
		LandUsePurpose: landUsePurpose,
		LegalStatus:    legalStatus,
		DocumentIDs:    existingLand.DocumentIDs,
		GeometryCID:    geometryCID,
		CreatedAt:      existingLand.CreatedAt,
		UpdatedAt:      txTime,
	}

	// Handle certificate information updates
	// Trừ các trạng thái đặc biệt: "", "Đang tranh chấp", "Đang thế chấp"
	if legalStatus != "" && legalStatus != "Đang tranh chấp" && legalStatus != "Đang thế chấp" {
		// Khi có trạng thái pháp lý, phải có đầy đủ thông tin GCN
		updatedLand.CertificateID = certificateID
		updatedLand.LegalInfo = legalInfo
		updatedLand.IssueDate = txTime
	} else if certificateID != "" {
		// Fallback: nếu có certificateID nhưng không có trạng thái pháp lý
		updatedLand.CertificateID = certificateID
		updatedLand.LegalInfo = legalInfo
		updatedLand.IssueDate = txTime
	} else {
		// Giữ nguyên thông tin GCN cũ
		updatedLand.CertificateID = existingLand.CertificateID
		updatedLand.LegalInfo = existingLand.LegalInfo
		updatedLand.IssueDate = existingLand.IssueDate
	}
	if err := ValidateLand(ctx, updatedLand, true); err != nil {
		return err
	}
	landJSON, err := json.Marshal(updatedLand)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa thửa đất: %v", err)
	}
	if err := ctx.GetStub().PutState(id, landJSON); err != nil {
		return fmt.Errorf("lỗi khi cập nhật thửa đất: %v", err)
	}
	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "UPDATE_LAND_PARCEL", userID, fmt.Sprintf("Cập nhật thửa đất %s", id))
}

// IssueLandCertificate - Hàm này đã bị xóa vì không còn cần thiết
// Giấy chứng nhận và thông tin pháp lý giờ được xử lý trực tiếp trong CreateLandParcel và UpdateLandParcel

// ========================================
// DOCUMENT MANAGEMENT FUNCTIONS
// ========================================

// CreateDocument - Tạo tài liệu mới
func (s *LandRegistryChaincode) CreateDocument(ctx contractapi.TransactionContextInterface, docID, docType, title, description, ipfsHash, fileType string, fileSize int64, status string, verifiedBy string) error {
	userID, err := GetCallerID(ctx)
	if err != nil {
		return err
	}

	// Validate loại tài liệu
	if err := ValidateDocumentType(docType); err != nil {
		return fmt.Errorf("loại tài liệu không hợp lệ: %v", err)
	}

	// Kiểm tra tính hợp lệ của IPFS hash
	if err := ValidateIPFSHash(ipfsHash); err != nil {
		return fmt.Errorf("hash IPFS không hợp lệ: %v", err)
	}

	// Kiểm tra xem tài liệu đã tồn tại chưa
	existingDoc, err := s.GetDocument(ctx, docID)
	if err == nil && existingDoc != nil {
		return fmt.Errorf("tài liệu %s đã tồn tại", docID)
	}

	// Lấy timestamp
	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}

	// Validate trạng thái tài liệu
	if !IsValidDocumentStatus(status) {
		return fmt.Errorf("trạng thái tài liệu không hợp lệ: %s", status)
	}

	// Tạo tài liệu mới
	doc := &Document{
		DocID:       docID,
		Type:        docType,
		Title:       title,
		Description: description,
		IPFSHash:    ipfsHash,
		FileSize:    fileSize,
		FileType:    fileType,
		UploadedBy:  userID,
		Status:      status,
		VerifiedBy:  verifiedBy,
		CreatedAt:   txTime,
		UpdatedAt:   txTime,
	}

	// Set verified time if verified
	if status == "VERIFIED" {
		doc.VerifiedAt = txTime
	}

	// Lưu tài liệu
	docJSON, err := json.Marshal(doc)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa tài liệu: %v", err)
	}
	if err := ctx.GetStub().PutState(docID, docJSON); err != nil {
		return fmt.Errorf("lỗi khi lưu tài liệu: %v", err)
	}

	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "CREATE_DOCUMENT", userID, fmt.Sprintf("Tạo tài liệu %s", title))
}

// UpdateDocument - Cập nhật thông tin tài liệu
func (s *LandRegistryChaincode) UpdateDocument(ctx contractapi.TransactionContextInterface, docID, title, description string) error {
	userID, err := GetCallerID(ctx)
	if err != nil {
		return err
	}

	// Lấy tài liệu hiện tại
	doc, err := s.GetDocument(ctx, docID)
	if err != nil {
		return err
	}

	// Kiểm tra quyền chỉnh sửa - ai upload thì mới được thao tác
	if doc.UploadedBy != userID {
		return fmt.Errorf("người dùng %s không có quyền chỉnh sửa tài liệu %s", userID, docID)
	}

	// Lấy timestamp
	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}

	// Cập nhật thông tin
	doc.Title = title
	doc.Description = description
	doc.UpdatedAt = txTime

	// Lưu tài liệu
	docJSON, err := json.Marshal(doc)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa tài liệu: %v", err)
	}
	if err := ctx.GetStub().PutState(docID, docJSON); err != nil {
		return fmt.Errorf("lỗi khi cập nhật tài liệu: %v", err)
	}

	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "UPDATE_DOCUMENT", userID, fmt.Sprintf("Cập nhật tài liệu %s", docID))
}

// DeleteDocument - Xóa tài liệu
func (s *LandRegistryChaincode) DeleteDocument(ctx contractapi.TransactionContextInterface, docID string) error {
	userID, err := GetCallerID(ctx)
	if err != nil {
		return err
	}

	// Lấy tài liệu hiện tại
	doc, err := s.GetDocument(ctx, docID)
	if err != nil {
		return err
	}

	// Kiểm tra quyền xóa - ai upload thì mới được thao tác
	if doc.UploadedBy != userID {
		return fmt.Errorf("người dùng %s không có quyền xóa tài liệu %s", userID, docID)
	}

	// Kiểm tra liên kết với thửa đất và giao dịch trước khi xóa
	// Sử dụng query để tìm các thửa đất và giao dịch có chứa docID này
	landQueryString := fmt.Sprintf(`{"selector":{"documentIds":{"$elemMatch":{"$eq":"%s"}}}}`, docID)
	landIterator, err := ctx.GetStub().GetQueryResult(landQueryString)
	if err != nil {
		return fmt.Errorf("lỗi khi kiểm tra liên kết thửa đất: %v", err)
	}
	defer landIterator.Close()
	
	var linkedLandIDs []string
	for landIterator.HasNext() {
		landResponse, err := landIterator.Next()
		if err != nil {
			continue
		}
		var land Land
		if err := json.Unmarshal(landResponse.Value, &land); err == nil {
			linkedLandIDs = append(linkedLandIDs, land.ID)
		}
	}
	
	txQueryString := fmt.Sprintf(`{"selector":{"documentIds":{"$elemMatch":{"$eq":"%s"}},"type":{"$ne":"LOG"}}}`, docID)
	txIterator, err := ctx.GetStub().GetQueryResult(txQueryString)
	if err != nil {
		return fmt.Errorf("lỗi khi kiểm tra liên kết giao dịch: %v", err)
	}
	defer txIterator.Close()
	
	var linkedTxIDs []string
	for txIterator.HasNext() {
		txResponse, err := txIterator.Next()
		if err != nil {
			continue
		}
		var tx Transaction
		if err := json.Unmarshal(txResponse.Value, &tx); err == nil {
			linkedTxIDs = append(linkedTxIDs, tx.TxID)
		}
	}

	// Nếu có liên kết, không cho phép xóa
	if len(linkedLandIDs) > 0 || len(linkedTxIDs) > 0 {
		errorMsg := fmt.Sprintf("không thể xóa tài liệu %s vì đang được liên kết với:", docID)
		if len(linkedLandIDs) > 0 {
			errorMsg += fmt.Sprintf(" %d thửa đất (%s)", len(linkedLandIDs), strings.Join(linkedLandIDs, ", "))
		}
		if len(linkedTxIDs) > 0 {
			errorMsg += fmt.Sprintf(" %d giao dịch (%s)", len(linkedTxIDs), strings.Join(linkedTxIDs, ", "))
		}
		errorMsg += ". Vui lòng hủy liên kết trước khi xóa tài liệu."
		return fmt.Errorf(errorMsg)
	}

	// Xóa tài liệu
	if err := ctx.GetStub().DelState(docID); err != nil {
		return fmt.Errorf("lỗi khi xóa tài liệu: %v", err)
	}

	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "DELETE_DOCUMENT", userID, fmt.Sprintf("Xóa tài liệu %s", docID))
}

// VerifyDocument - Chứng thực tài liệu (chỉ Org2)
func (s *LandRegistryChaincode) VerifyDocument(ctx contractapi.TransactionContextInterface, docID string) error {
	// Chỉ Org2 mới được chứng thực tài liệu
	if err := CheckOrganization(ctx, []string{"Org2MSP"}); err != nil {
		return err
	}

	userID, err := GetCallerID(ctx)
	if err != nil {
		return err
	}

	// Lấy tài liệu
	doc, err := s.GetDocument(ctx, docID)
	if err != nil {
		return err
	}

	// Kiểm tra xem tài liệu có thể được xác thực không
	if !CanVerifyDocument(doc) {
		return fmt.Errorf("tài liệu %s không thể được xác thực (trạng thái: %s)", docID, doc.Status)
	}

	// Lấy timestamp
	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}

	// Chứng thực tài liệu
	SetDocumentVerified(doc, userID, txTime)

	// Lưu tài liệu
	docJSON, err := json.Marshal(doc)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa tài liệu: %v", err)
	}
	if err := ctx.GetStub().PutState(docID, docJSON); err != nil {
		return fmt.Errorf("lỗi khi cập nhật tài liệu: %v", err)
	}

	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "VERIFY_DOCUMENT", userID, fmt.Sprintf("Chứng thực tài liệu %s", docID))
}

// RejectDocument - Từ chối tài liệu (chỉ Org2)
func (s *LandRegistryChaincode) RejectDocument(ctx contractapi.TransactionContextInterface, docID, reason string) error {
	// Chỉ Org2 mới được từ chối tài liệu
	if err := CheckOrganization(ctx, []string{"Org2MSP"}); err != nil {
		return err
	}

	userID, err := GetCallerID(ctx)
	if err != nil {
		return err
	}

	// Lấy tài liệu
	doc, err := s.GetDocument(ctx, docID)
	if err != nil {
		return err
	}

	// Lấy timestamp
	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}

	// Kiểm tra xem tài liệu có thể bị từ chối không
	if !CanRejectDocument(doc) {
		return fmt.Errorf("tài liệu %s không thể bị từ chối (trạng thái: %s)", docID, doc.Status)
	}

	// Từ chối tài liệu
	SetDocumentRejected(doc, userID, txTime)

	// Lưu thông tin từ chối vào Description với format chuẩn để dễ nhận biết
	rejectionInfo := fmt.Sprintf(" [REJECTED: %s | By: %s | At: %s]", reason, userID, txTime.Format("2006-01-02 15:04:05"))
	doc.Description = doc.Description + rejectionInfo

	// Lưu tài liệu
	docJSON, err := json.Marshal(doc)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa tài liệu: %v", err)
	}
	if err := ctx.GetStub().PutState(docID, docJSON); err != nil {
		return fmt.Errorf("lỗi khi cập nhật tài liệu: %v", err)
	}

	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "REJECT_DOCUMENT", userID, fmt.Sprintf("Từ chối tài liệu %s: %s", docID, reason))
}

// LinkDocumentToLand - Link existing documents to land parcel after verification (supports multiple documents)
func (s *LandRegistryChaincode) LinkDocumentToLand(ctx contractapi.TransactionContextInterface, docIDs, landParcelID string) error {
	userID, err := GetCallerID(ctx)
	if err != nil {
		return err
	}

	// Chỉ cho phép Org1 liên kết tài liệu với thửa đất
	if err := CheckOrganization(ctx, []string{"Org1MSP"}); err != nil {
		return err
	}

	// Parse docIDs string thành slice
	var docIDList []string
	if err := json.Unmarshal([]byte(docIDs), &docIDList); err != nil {
		// Fallback: nếu không phải JSON array, coi như single docID
		docIDList = []string{docIDs}
	}

	if len(docIDList) == 0 {
		return fmt.Errorf("không có tài liệu nào để liên kết")
	}

	// Kiểm tra thửa đất tồn tại
	land, err := s.QueryLandByID(ctx, landParcelID)
	if err != nil {
		return fmt.Errorf("lỗi khi truy vấn thửa đất %s: %v", landParcelID, err)
	}

	var linkedDocs []string
	var errors []string

	// Xử lý từng tài liệu
	for _, docID := range docIDList {
		// Kiểm tra tài liệu tồn tại
		doc, err := s.GetDocument(ctx, docID)
		if err != nil {
			errors = append(errors, fmt.Sprintf("không tìm thấy tài liệu %s: %v", docID, err))
			continue
		}

		// Kiểm tra tài liệu đã được verify chưa (chỉ verified documents mới được link)
		if !IsDocumentVerified(doc) {
			errors = append(errors, fmt.Sprintf("tài liệu %s chưa được xác minh, không thể link", docID))
			continue
		}

		// Kiểm tra xem document đã được link chưa
		alreadyLinked := false
		for _, existingDocID := range land.DocumentIDs {
			if existingDocID == docID {
				errors = append(errors, fmt.Sprintf("tài liệu %s đã được link với thửa đất %s", docID, landParcelID))
				alreadyLinked = true
				break
			}
		}

		if !alreadyLinked {
			land.DocumentIDs = append(land.DocumentIDs, docID)
			linkedDocs = append(linkedDocs, doc.Title)
		}
	}

	// Nếu không có tài liệu nào được link thành công
	if len(linkedDocs) == 0 {
		return fmt.Errorf("không có tài liệu nào được liên kết thành công. Lỗi: %v", errors)
	}

	// Lấy timestamp
	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}

	// Cập nhật thửa đất
	land.UpdatedAt = txTime

	landJSON, err := json.Marshal(land)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa thửa đất: %v", err)
	}
	if err := ctx.GetStub().PutState(landParcelID, landJSON); err != nil {
		return fmt.Errorf("lỗi khi cập nhật thửa đất: %v", err)
	}

	// Ghi log
	logMessage := fmt.Sprintf("Link %d tài liệu bổ sung (%v) với thửa đất %s", len(linkedDocs), linkedDocs, landParcelID)
	if len(errors) > 0 {
		logMessage += fmt.Sprintf(". Một số lỗi: %v", errors)
	}

	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "LINK_DOCUMENTS_TO_LAND", userID, logMessage)
}

// LinkDocumentToTransaction - Link existing documents to transaction (supports multiple documents)
func (s *LandRegistryChaincode) LinkDocumentToTransaction(ctx contractapi.TransactionContextInterface, docIDs, transactionID string) error {
	userID, err := GetCallerID(ctx)
	if err != nil {
		return err
	}
	mspID, err := GetCallerOrgMSP(ctx)
	if err != nil {
		return err
	}

	// Chỉ cho phép Org3 liên kết tài liệu với giao dịch
	if err := CheckOrganization(ctx, []string{"Org3MSP"}); err != nil {
		return err
	}

	// Parse docIDs string thành slice
	var docIDList []string
	if err := json.Unmarshal([]byte(docIDs), &docIDList); err != nil {
		// Fallback: nếu không phải JSON array, coi như single docID
		docIDList = []string{docIDs}
	}

	if len(docIDList) == 0 {
		return fmt.Errorf("không có tài liệu nào để liên kết")
	}

	// Kiểm tra giao dịch tồn tại và quyền truy cập
	tx, err := GetTransaction(ctx, transactionID)
	if err != nil {
		return fmt.Errorf("lỗi khi truy vấn giao dịch %s: %v", transactionID, err)
	}

	// Kiểm tra quyền truy cập giao dịch cho Org3
	if mspID == "Org3MSP" {
		if tx.FromOwnerID != userID && tx.ToOwnerID != userID {
			return fmt.Errorf("người dùng %s không có quyền truy cập giao dịch %s", userID, transactionID)
		}
	}

	// Kiểm tra giao dịch có ở trạng thái SUPPLEMENT_REQUESTED không (theo UC-18 cần yêu cầu bổ sung từ Org2)
	if tx.Status != "SUPPLEMENT_REQUESTED" {
		return fmt.Errorf("chỉ có thể liên kết tài liệu bổ sung khi giao dịch ở trạng thái yêu cầu bổ sung")
	}

	var linkedDocs []string
	var errors []string

	// Xử lý từng tài liệu
	for _, docID := range docIDList {
		// Kiểm tra tài liệu tồn tại
		doc, err := s.GetDocument(ctx, docID)
		if err != nil {
			errors = append(errors, fmt.Sprintf("không tìm thấy tài liệu %s: %v", docID, err))
			continue
		}

		// Kiểm tra quyền: chỉ owner (người upload) có thể link document
		if mspID == "Org3MSP" && doc.UploadedBy != userID {
			errors = append(errors, fmt.Sprintf("bạn chỉ có thể link tài liệu của mình. Tài liệu %s không thuộc sở hữu", docID))
			continue
		}

		// Kiểm tra xem document đã được link chưa
		alreadyLinked := false
		for _, existingDocID := range tx.DocumentIDs {
			if existingDocID == docID {
				errors = append(errors, fmt.Sprintf("tài liệu %s đã được link với giao dịch %s", docID, transactionID))
				alreadyLinked = true
				break
			}
		}

		if !alreadyLinked {
			tx.DocumentIDs = append(tx.DocumentIDs, docID)
			linkedDocs = append(linkedDocs, doc.Title)
		}
	}

	// Nếu không có tài liệu nào được link thành công
	if len(linkedDocs) == 0 {
		return fmt.Errorf("không có tài liệu nào được liên kết thành công. Lỗi: %v", errors)
	}

	// Lấy timestamp
	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}

	// Cập nhật giao dịch - đặt lại status về PENDING để Org2 xử lý lại
	tx.UpdatedAt = txTime
	tx.Status = "PENDING"

	txJSON, err := json.Marshal(tx)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa giao dịch: %v", err)
	}
	if err := ctx.GetStub().PutState(transactionID, txJSON); err != nil {
		return fmt.Errorf("lỗi khi cập nhật giao dịch: %v", err)
	}

	// Ghi log
	logMessage := fmt.Sprintf("Link %d tài liệu bổ sung (%v) với giao dịch %s", len(linkedDocs), linkedDocs, transactionID)
	if len(errors) > 0 {
		logMessage += fmt.Sprintf(". Một số lỗi: %v", errors)
	}

	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "LINK_SUPPLEMENT_DOCUMENTS_TO_TRANSACTION", userID, logMessage)
}

// ========================================
// TRANSACTION MANAGEMENT FUNCTIONS
// ========================================

// CreateSplitRequest - Tạo yêu cầu tách thửa (auto-generate txID)
func (s *LandRegistryChaincode) CreateSplitRequest(ctx contractapi.TransactionContextInterface, landParcelID, documentIdsStr, reason string) error {
	if err := CheckOrganization(ctx, []string{"Org3MSP"}); err != nil {
		return err
	}
	callerID, err := GetCallerID(ctx)
	if err != nil {
		return err
	}
	if err := VerifyLandOwnership(ctx, landParcelID, callerID); err != nil {
		return err
	}
	if err := VerifyLandLegalStatus(ctx, landParcelID, []string{"Đang tranh chấp", "Đang thế chấp"}); err != nil {
		return err
	}
	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}
	// Parse document IDs if provided
	var documentIDs []string
	if documentIdsStr != "" {
		if err := json.Unmarshal([]byte(documentIdsStr), &documentIDs); err != nil {
			return fmt.Errorf("lỗi khi giải mã danh sách document IDs: %v", err)
		}
	}
	// Tự động tạo txID với timestamp
	txID := fmt.Sprintf("TACH_THUA_%d_%s_%s", txTime.Unix(), callerID, landParcelID)
	// Tạo Details với lý do
	details := fmt.Sprintf("Tách thửa đất %s", landParcelID)
	if reason != "" {
		details = fmt.Sprintf("%s. Lý do: %s", details, reason)
	}
	tx := Transaction{
		TxID:         txID,
		Type:         "SPLIT",
		LandParcelID: landParcelID,
		ParcelIDs:    []string{}, // Để trống, sẽ cập nhật khi approve
		FromOwnerID:  callerID,
		ToOwnerID:    callerID,
		Status:       "PENDING",
		Details:      details,
		UserID:       callerID,
		DocumentIDs:  documentIDs,
		CreatedAt:    txTime,
		UpdatedAt:    txTime,
	}
	txJSON, err := json.Marshal(tx)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa giao dịch: %v", err)
	}
	if err := ctx.GetStub().PutState(txID, txJSON); err != nil {
		return fmt.Errorf("lỗi khi lưu giao dịch: %v", err)
	}
	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "CREATE_SPLIT_REQUEST", callerID, fmt.Sprintf("Tạo yêu cầu tách thửa %s", txID))
}

// CreateMergeRequest - Tạo yêu cầu hợp thửa (auto-generate txID)
func (s *LandRegistryChaincode) CreateMergeRequest(ctx contractapi.TransactionContextInterface, parcelIDsStr, documentIdsStr, reason string) error {
	if err := CheckOrganization(ctx, []string{"Org3MSP"}); err != nil {
		return err
	}
	callerID, err := GetCallerID(ctx)
	if err != nil {
		return err
	}
	var parcelIDs []string
	if err := json.Unmarshal([]byte(parcelIDsStr), &parcelIDs); err != nil {
		return fmt.Errorf("lỗi khi giải mã danh sách parcelIDs: %v", err)
	}
	var totalArea float64
	for _, parcelID := range parcelIDs {
		parcelID = strings.TrimSpace(parcelID)
		if err := VerifyLandOwnership(ctx, parcelID, callerID); err != nil {
			return err
		}
		if err := VerifyLandLegalStatus(ctx, parcelID, []string{"Đang tranh chấp", "Đang thế chấp"}); err != nil {
			return err
		}
		land, err := s.QueryLandByID(ctx, parcelID)
		if err != nil {
			return fmt.Errorf("lỗi khi truy vấn thửa đất %s: %v", parcelID, err)
		}
		totalArea += land.Area
	}
	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}
	// Parse document IDs if provided
	var documentIDs []string
	if documentIdsStr != "" {
		if err := json.Unmarshal([]byte(documentIdsStr), &documentIDs); err != nil {
			return fmt.Errorf("lỗi khi giải mã danh sách document IDs: %v", err)
		}
	}
	// Tự động tạo txID với timestamp
	txID := fmt.Sprintf("HOP_THUA_%d_%s_%v", txTime.Unix(), callerID, parcelIDs)
	// Tạo Details với lý do
	details := fmt.Sprintf("Hợp nhất các thửa đất %v", parcelIDs)
	if reason != "" {
		details = fmt.Sprintf("%s. Lý do: %s", details, reason)
	}
	tx := Transaction{
		TxID:         txID,
		Type:         "MERGE",
		LandParcelID: "", // Để trống, sẽ set khi approve
		ParcelIDs:    parcelIDs,
		FromOwnerID:  callerID,
		ToOwnerID:    callerID,
		Status:       "PENDING",
		Details:      details,
		UserID:       callerID,
		DocumentIDs:  documentIDs,
		CreatedAt:    txTime,
		UpdatedAt:    txTime,
	}
	txJSON, err := json.Marshal(tx)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa giao dịch: %v", err)
	}
	if err := ctx.GetStub().PutState(txID, txJSON); err != nil {
		return fmt.Errorf("lỗi khi lưu giao dịch: %v", err)
	}
	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "CREATE_MERGE_REQUEST", callerID, fmt.Sprintf("Tạo yêu cầu hợp thửa %s", txID))
}

// CreateTransferRequest - Tạo yêu cầu chuyển nhượng (auto-generate txID)
func (s *LandRegistryChaincode) CreateTransferRequest(ctx contractapi.TransactionContextInterface, landParcelID, toOwnerID, documentIdsStr, reason string) error {
	if err := CheckOrganization(ctx, []string{"Org3MSP"}); err != nil {
		return err
	}
	callerID, err := GetCallerID(ctx)
	if err != nil {
		return err
	}
	if err := VerifyLandOwnership(ctx, landParcelID, callerID); err != nil {
		return err
	}
	if err := VerifyLandLegalStatus(ctx, landParcelID, []string{"Đang tranh chấp", "Đang thế chấp"}); err != nil {
		return err
	}
	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}

	// Parse document IDs if provided
	var documentIDs []string
	if documentIdsStr != "" {
		if err := json.Unmarshal([]byte(documentIdsStr), &documentIDs); err != nil {
			return fmt.Errorf("lỗi khi giải mã danh sách document IDs: %v", err)
		}
	}

	// Tự động tạo txID với timestamp
	txID := fmt.Sprintf("CHUYEN_NHUONG_%d_%s_%s", txTime.Unix(), callerID, landParcelID)

	// Tạo Details với lý do
	details := fmt.Sprintf("Chuyển nhượng thửa đất %s từ %s sang %s", landParcelID, callerID, toOwnerID)
	if reason != "" {
		details = fmt.Sprintf("%s. Lý do: %s", details, reason)
	}

	tx := Transaction{
		TxID:         txID,
		Type:         "TRANSFER",
		LandParcelID: landParcelID,
		ParcelIDs:    []string{}, // Khởi tạo empty slice thay vì nil
		FromOwnerID:  callerID,
		ToOwnerID:    toOwnerID,
		Status:       "PENDING",
		Details:      details,
		UserID:       callerID,    // Tự động điền người thực hiện
		DocumentIDs:  documentIDs, // Sử dụng documentIDs được parse
		CreatedAt:    txTime,
		UpdatedAt:    txTime,
	}
	txJSON, err := json.Marshal(tx)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa giao dịch: %v", err)
	}
	if err := ctx.GetStub().PutState(txID, txJSON); err != nil {
		return fmt.Errorf("lỗi khi lưu giao dịch: %v", err)
	}
	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "CREATE_TRANSFER_REQUEST", callerID, fmt.Sprintf("Tạo yêu cầu chuyển nhượng %s", txID))
}

// CreateChangePurposeRequest - Tạo yêu cầu thay đổi mục đích sử dụng (auto-generate txID)
func (s *LandRegistryChaincode) CreateChangePurposeRequest(ctx contractapi.TransactionContextInterface, landParcelID, newPurpose, documentIdsStr, reason string) error {
	if err := CheckOrganization(ctx, []string{"Org3MSP"}); err != nil {
		return err
	}
	callerID, err := GetCallerID(ctx)
	if err != nil {
		return err
	}
	if err := VerifyLandOwnership(ctx, landParcelID, callerID); err != nil {
		return err
	}
	if err := VerifyLandLegalStatus(ctx, landParcelID, []string{"Đang tranh chấp", "Đang thế chấp"}); err != nil {
		return err
	}
	// Removed ValidateLandUsePurpose validation as requested
	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}

	// Parse document IDs if provided
	var documentIDs []string
	if documentIdsStr != "" {
		if err := json.Unmarshal([]byte(documentIdsStr), &documentIDs); err != nil {
			return fmt.Errorf("lỗi khi giải mã danh sách document IDs: %v", err)
		}
	}

	// Tự động tạo txID với timestamp
	txID := fmt.Sprintf("DOI_MUC_DICH_%d_%s_%s", txTime.Unix(), callerID, landParcelID)

	// Tạo Details với lý do
	details := fmt.Sprintf("Thay đổi mục đích sử dụng đất %s sang %s", landParcelID, newPurpose)
	if reason != "" {
		details = fmt.Sprintf("%s. Lý do: %s", details, reason)
	}

	tx := Transaction{
		TxID:         txID,
		Type:         "CHANGE_PURPOSE",
		LandParcelID: landParcelID,
		ParcelIDs:    []string{}, // Khởi tạo empty slice thay vì nil
		FromOwnerID:  callerID,
		ToOwnerID:    callerID,
		Status:       "PENDING",
		Details:      details,
		UserID:       callerID,    // Tự động điền người thực hiện
		DocumentIDs:  documentIDs, // Sử dụng documentIDs được parse
		CreatedAt:    txTime,
		UpdatedAt:    txTime,
	}
	txJSON, err := json.Marshal(tx)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa giao dịch: %v", err)
	}
	if err := ctx.GetStub().PutState(txID, txJSON); err != nil {
		return fmt.Errorf("lỗi khi lưu giao dịch: %v", err)
	}
	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "CREATE_CHANGE_PURPOSE_REQUEST", callerID, fmt.Sprintf("Tạo yêu cầu thay đổi mục đích sử dụng %s", txID))
}

// CreateReissueRequest - Tạo yêu cầu cấp lại giấy chứng nhận (auto-generate txID)
func (s *LandRegistryChaincode) CreateReissueRequest(ctx contractapi.TransactionContextInterface, landParcelID, documentIdsStr, reason string) error {
	if err := CheckOrganization(ctx, []string{"Org3MSP"}); err != nil {
		return err
	}
	callerID, err := GetCallerID(ctx)
	if err != nil {
		return err
	}
	if err := VerifyLandOwnership(ctx, landParcelID, callerID); err != nil {
		return err
	}
	if err := VerifyLandLegalStatus(ctx, landParcelID, []string{"Đang tranh chấp", "Đang thế chấp"}); err != nil {
		return err
	}
	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}

	// Parse document IDs if provided
	var documentIDs []string
	if documentIdsStr != "" {
		if err := json.Unmarshal([]byte(documentIdsStr), &documentIDs); err != nil {
			return fmt.Errorf("lỗi khi giải mã danh sách document IDs: %v", err)
		}
	}

	// Tự động tạo txID với timestamp
	txID := fmt.Sprintf("CAP_LAI_GCN_%d_%s_%s", txTime.Unix(), callerID, landParcelID)

	// Tạo Details với lý do
	details := fmt.Sprintf("Yêu cầu cấp lại GCN cho thửa đất %s", landParcelID)
	if reason != "" {
		details = fmt.Sprintf("%s. Lý do: %s", details, reason)
	}

	tx := Transaction{
		TxID:         txID,
		Type:         "REISSUE",
		LandParcelID: landParcelID,
		ParcelIDs:    []string{}, // Khởi tạo empty slice thay vì nil
		FromOwnerID:  callerID,
		ToOwnerID:    callerID,
		Status:       "PENDING",
		Details:      details,
		UserID:       callerID,    // Tự động điền người thực hiện
		DocumentIDs:  documentIDs, // Sử dụng documentIDs được parse
		CreatedAt:    txTime,
		UpdatedAt:    txTime,
	}
	txJSON, err := json.Marshal(tx)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa giao dịch: %v", err)
	}
	if err := ctx.GetStub().PutState(txID, txJSON); err != nil {
		return fmt.Errorf("lỗi khi lưu giao dịch: %v", err)
	}
	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "CREATE_REISSUE_REQUEST", callerID, fmt.Sprintf("Tạo yêu cầu cấp lại GCN %s", txID))
}

// ConfirmTransfer - Xác nhận hoặc từ chối chuyển nhượng (bởi người nhận)
func (s *LandRegistryChaincode) ConfirmTransfer(ctx contractapi.TransactionContextInterface, txID, landParcelID, toOwnerID, isAcceptedStr, reason string) error {
	if err := CheckOrganization(ctx, []string{"Org3MSP"}); err != nil {
		return err
	}
	userID, err := GetCallerID(ctx)
	if err != nil {
		return err
	}
	tx, err := GetTransaction(ctx, txID)
	if err != nil {
		return err
	}
	if tx.Type != "TRANSFER" {
		return fmt.Errorf("giao dịch %s không phải là chuyển nhượng", txID)
	}
	if tx.ToOwnerID != userID {
		return fmt.Errorf("người dùng %s không phải là người nhận chuyển nhượng", userID)
	}
	if tx.Status != "PENDING" {
		return fmt.Errorf("giao dịch %s không ở trạng thái PENDING để xác nhận", txID)
	}

	// Parse isAccepted
	isAccepted := isAcceptedStr == "true"

	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}

	var actionLog string
	if isAccepted {
		tx.Status = "CONFIRMED"
		tx.Details = fmt.Sprintf("%s; Người nhận đã chấp nhận chuyển nhượng", tx.Details)
		actionLog = "CONFIRM_TRANSFER_ACCEPTED"
	} else {
		tx.Status = "REJECTED"
		if reason != "" {
			tx.Details = fmt.Sprintf("%s; Người nhận từ chối chuyển nhượng - Lý do: %s", tx.Details, reason)
		} else {
			tx.Details = fmt.Sprintf("%s; Người nhận từ chối chuyển nhượng", tx.Details)
		}
		actionLog = "CONFIRM_TRANSFER_REJECTED"
	}

	tx.UpdatedAt = txTime
	txJSON, err := json.Marshal(tx)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa giao dịch: %v", err)
	}
	if err := ctx.GetStub().PutState(txID, txJSON); err != nil {
		return fmt.Errorf("lỗi khi cập nhật giao dịch: %v", err)
	}

	actionText := "chấp nhận"
	if !isAccepted {
		actionText = "từ chối"
	}
	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), actionLog, userID, fmt.Sprintf("Người nhận %s chuyển nhượng %s", actionText, txID))
}

// ========================================
// TRANSACTION PROCESSING FUNCTIONS (ORG2)
// ========================================

// ProcessTransaction - Xử lý và thẩm định giao dịch với 3 trạng thái (Org2) - UC-31
func (s *LandRegistryChaincode) ProcessTransaction(ctx contractapi.TransactionContextInterface, txID, decision, reason string) error {
	if err := CheckOrganization(ctx, []string{"Org2MSP"}); err != nil {
		return err
	}
	userID, err := GetCallerID(ctx)
	if err != nil {
		return err
	}
	tx, err := GetTransaction(ctx, txID)
	if err != nil {
		return err
	}
	// Kiểm tra trạng thái dựa trên loại giao dịch
	if tx.Type == "TRANSFER" {
		// Giao dịch TRANSFER cần có xác nhận từ người nhận trước
		if tx.Status != "CONFIRMED" {
			return fmt.Errorf("giao dịch chuyển nhượng %s chưa được người nhận xác nhận", txID)
		}
	} else {
		// Các loại giao dịch khác (SPLIT, MERGE, CHANGE_PURPOSE, REISSUE) xử lý trực tiếp từ PENDING
		if tx.Status != "PENDING" {
			return fmt.Errorf("giao dịch %s không ở trạng thái chờ xử lý", txID)
		}
	}

	// Kiểm tra trạng thái tài liệu hiện tại (không tự động xác minh)
	var verifiedDocs, pendingDocs, rejectedDocs []string
	var docErrors []string

	// Kiểm tra trạng thái từng tài liệu đính kèm
	for _, docID := range tx.DocumentIDs {
		doc, err := s.GetDocument(ctx, docID)
		if err != nil {
			docErrors = append(docErrors, fmt.Sprintf("Không tìm thấy tài liệu %s", docID))
			continue
		}

		// Chỉ kiểm tra trạng thái, không tự động xác minh
		if doc.Type != "" && doc.IPFSHash != "" {
			if IsDocumentVerified(doc) {
				verifiedDocs = append(verifiedDocs, doc.Title)
			} else if doc.Status == "REJECTED" {
				rejectedDocs = append(rejectedDocs, doc.Title)
			} else {
				// Document đang PENDING - chưa được Org2 xác thực
				pendingDocs = append(pendingDocs, doc.Title)
			}
		} else {
			rejectedDocs = append(rejectedDocs, doc.Title)
		}
	}

	// Xử lý theo 3 trạng thái quyết định
	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗ6i khi lấy timestamp: %v", err)
	}

	var logAction, statusDetails string

	switch decision {
	case "APPROVE":
		// Xác nhận đạt yêu cầu và chuyển sang trạng thái VERIFIED để Org1 xử lý
		if len(rejectedDocs) > 0 {
			return fmt.Errorf("không thể thẩm định đạt yêu cầu vì có tài liệu không hợp lệ: %v", rejectedDocs)
		}
		if len(pendingDocs) > 0 {
			return fmt.Errorf("không thể thẩm định đạt yêu cầu vì còn tài liệu chưa được xác thực: %v", pendingDocs)
		}
		// Chuyển sang VERIFIED thay vì FORWARDED - loại bỏ bước chuyển tiếp thủ công
		tx.Status = "VERIFIED"
		statusDetails = fmt.Sprintf("Hồ sơ đạt yêu cầu.")
		if len(verifiedDocs) > 0 {
			statusDetails += fmt.Sprintf(" Tài liệu đã xác thực: %v.", verifiedDocs)
		}
		statusDetails += " Sẵn sàng cho Sở TN&MT xử lý."
		if reason != "" {
			statusDetails += fmt.Sprintf(" Ghi chú: %s", reason)
		}
		logAction = "Xác nhận đạt yêu cầu và chuyển sang trạng thái VERIFIED"

	case "SUPPLEMENT":
		// Yêu cầu bổ sung
		tx.Status = "SUPPLEMENT_REQUESTED"
		statusDetails = fmt.Sprintf("Yêu cầu bổ sung tài liệu.")
		if len(verifiedDocs) > 0 {
			statusDetails += fmt.Sprintf(" Tài liệu đã xác thực: %v.", verifiedDocs)
		}
		if len(pendingDocs) > 0 {
			statusDetails += fmt.Sprintf(" Tài liệu chưa xác thực: %v.", pendingDocs)
		}
		if len(rejectedDocs) > 0 {
			statusDetails += fmt.Sprintf(" Tài liệu không hợp lệ: %v.", rejectedDocs)
		}
		if reason != "" {
			statusDetails += fmt.Sprintf(" Lý do: %s", reason)
		}
		logAction = "Yêu cầu bổ sung tài liệu"

	case "REJECT":
		// Từ chối hồ sơ
		tx.Status = "REJECTED"
		statusDetails = fmt.Sprintf("Hồ sơ bị từ chối.")
		if reason == "" {
			return fmt.Errorf("phải có lý do khi từ chối hồ sơ")
		}
		statusDetails += fmt.Sprintf(" Lý do: %s", reason)
		if len(rejectedDocs) > 0 {
			statusDetails += fmt.Sprintf(" Tài liệu không hợp lệ: %v", rejectedDocs)
		}
		logAction = "Từ chối hồ sơ"

	default:
		return fmt.Errorf("quyết định không hợp lệ. Sử dụng: APPROVE, SUPPLEMENT, hoặc REJECT")
	}

    // Cập nhật thông tin giao dịch, giữ nguyên chi tiết ban đầu để Org1 có thể trích xuất tham số
    if strings.TrimSpace(tx.Details) != "" {
        tx.Details = fmt.Sprintf("%s. %s", tx.Details, statusDetails)
    } else {
        tx.Details = statusDetails
    }
	tx.UpdatedAt = txTime

	txJSON, err := json.Marshal(tx)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa giao dịch: %v", err)
	}
	if err := ctx.GetStub().PutState(txID, txJSON); err != nil {
		return fmt.Errorf("lỗi khi cập nhật giao dịch: %v", err)
	}

	// Ghi log chi tiết
	logDetails := fmt.Sprintf("%s giao dịch %s. %s", logAction, txID, statusDetails)
	if len(docErrors) > 0 {
		logDetails += fmt.Sprintf(" Lỗi tài liệu: %v", docErrors)
	}

	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "PROCESS_TRANSACTION_DOSSIER", userID, logDetails)
}


// ========================================
// TRANSACTION APPROVAL FUNCTIONS (ORG1)
// ========================================

// ApproveTransferTransaction - Phê duyệt giao dịch chuyển nhượng
func (s *LandRegistryChaincode) ApproveTransferTransaction(ctx contractapi.TransactionContextInterface, txID string) error {
	if err := CheckOrganization(ctx, []string{"Org1MSP"}); err != nil {
		return err
	}
	userID, err := GetCallerID(ctx)
	if err != nil {
		return err
	}
	tx, err := GetTransaction(ctx, txID)
	if err != nil {
		return err
	}
	if tx.Status != "VERIFIED" {
		return fmt.Errorf("giao dịch %s không ở trạng thái VERIFIED", txID)
	}
	if tx.Type != "TRANSFER" {
		return fmt.Errorf("giao dịch %s không phải là chuyển nhượng", txID)
	}

	land, err := s.QueryLandByID(ctx, tx.LandParcelID)
	if err != nil {
		return fmt.Errorf("lỗi khi truy vấn thửa đất %s: %v", tx.LandParcelID, err)
	}
	if land.OwnerID != tx.FromOwnerID {
		return fmt.Errorf("người dùng %s không sở hữu thửa đất %s", tx.FromOwnerID, tx.LandParcelID)
	}

	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}

	// Vô hiệu hóa giấy chứng nhận cũ (do chủ sử dụng thay đổi)
	if land.CertificateID != "" {
		land.CertificateID = ""      // Xóa giấy chứng nhận cũ
		land.IssueDate = time.Time{} // Reset ngày cấp
		land.LegalInfo = "Giấy chứng nhận đã vô hiệu do chuyển nhượng quyền sử dụng đất"
	}

	// Cập nhật chủ sử dụng thửa đất
	land.OwnerID = tx.ToOwnerID
	land.UpdatedAt = txTime
	landJSON, err := json.Marshal(land)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa thửa đất: %v", err)
	}
	if err := ctx.GetStub().PutState(tx.LandParcelID, landJSON); err != nil {
		return fmt.Errorf("lỗi khi cập nhật thửa đất: %v", err)
	}

	// Cập nhật trạng thái giao dịch
	tx.Status = "APPROVED"
	tx.Details = fmt.Sprintf("%s; Đã phê duyệt chuyển nhượng", tx.Details)
	tx.UpdatedAt = txTime
	txJSON, err := json.Marshal(tx)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa giao dịch: %v", err)
	}
	if err := ctx.GetStub().PutState(txID, txJSON); err != nil {
		return fmt.Errorf("lỗi khi cập nhật giao dịch: %v", err)
	}

	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "APPROVE_TRANSFER", userID, fmt.Sprintf("Phê duyệt chuyển nhượng %s", txID))
}



// ApproveReissueTransaction - Phê duyệt giao dịch cấp đổi giấy chứng nhận với IPFS hash mới
func (s *LandRegistryChaincode) ApproveReissueTransaction(ctx contractapi.TransactionContextInterface, txID string, newCertificateID string) error {
	if err := CheckOrganization(ctx, []string{"Org1MSP"}); err != nil {
		return err
	}
	userID, err := GetCallerID(ctx)
	if err != nil {
		return err
	}
	tx, err := GetTransaction(ctx, txID)
	if err != nil {
		return err
	}
	if tx.Status != "VERIFIED" {
		return fmt.Errorf("giao dịch %s không ở trạng thái VERIFIED", txID)
	}
	if tx.Type != "REISSUE" {
		return fmt.Errorf("giao dịch %s không phải là cấp đổi giấy chứng nhận", txID)
	}

	// Validate newCertificateID as IPFS hash
	if newCertificateID == "" {
		return fmt.Errorf("newCertificateID không được để trống")
	}
	if len(newCertificateID) < 10 {
		return fmt.Errorf("newCertificateID phải là IPFS hash hợp lệ")
	}

	land, err := s.QueryLandByID(ctx, tx.LandParcelID)
	if err != nil {
		return fmt.Errorf("lỗi khi truy vấn thửa đất %s: %v", tx.LandParcelID, err)
	}
	if land.OwnerID != tx.FromOwnerID {
		return fmt.Errorf("người dùng %s không sở hữu thửa đất %s", tx.FromOwnerID, tx.LandParcelID)
	}

	if err := VerifyLandLegalStatus(ctx, tx.LandParcelID, []string{"Đang tranh chấp", "Đang thế chấp"}); err != nil {
		return err
	}

	// Sử dụng UpdateLandParcel để cập nhật GCN và thông tin pháp lý
	legalInfo := fmt.Sprintf("Cấp đổi GCN cho thửa đất %s", tx.LandParcelID)
	err = s.UpdateLandParcel(ctx, tx.LandParcelID, fmt.Sprintf("%.2f", land.Area), land.Location, land.LandUsePurpose, land.LegalStatus, newCertificateID, legalInfo, land.GeometryCID)
	if err != nil {
		return fmt.Errorf("lỗi khi cập nhật thửa đất: %v", err)
	}

	// Cập nhật trạng thái giao dịch
	tx.Status = "APPROVED"
	tx.Details = fmt.Sprintf("%s; Đã phê duyệt cấp đổi giấy chứng nhận với IPFS hash: %s", tx.Details, newCertificateID)
	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}
	tx.UpdatedAt = txTime
	txJSON, err := json.Marshal(tx)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa giao dịch: %v", err)
	}
	if err := ctx.GetStub().PutState(txID, txJSON); err != nil {
		return fmt.Errorf("lỗi khi cập nhật giao dịch: %v", err)
	}

	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "APPROVE_REISSUE", userID, fmt.Sprintf("Phê duyệt cấp đổi GCN cho thửa đất %s với IPFS hash: %s", tx.LandParcelID, newCertificateID))
}

// ApproveSplitTransaction approves a split transaction, updating the original land first if its ID matches, then creating new parcels, invalidating all certificates
func (s *LandRegistryChaincode) ApproveSplitTransaction(ctx contractapi.TransactionContextInterface, txID, landID, newParcelsStr string) error {
	if err := CheckOrganization(ctx, []string{"Org1MSP"}); err != nil {
		return err
	}
	userID, err := GetCallerID(ctx)
	if err != nil {
		return err
	}
	tx, err := GetTransaction(ctx, txID)
	if err != nil {
		return err
	}
	if tx.Status != "VERIFIED" {
		return fmt.Errorf("giao dịch %s không ở trạng thái VERIFIED", txID)
	}
	if tx.Type != "SPLIT" {
		return fmt.Errorf("giao dịch %s không phải là tách thửa", txID)
	}
	originalLand, err := s.QueryLandByID(ctx, landID)
	if err != nil {
		return fmt.Errorf("lỗi khi truy vấn thửa đất gốc %s: %v", landID, err)
	}
	if originalLand.OwnerID != tx.FromOwnerID {
		return fmt.Errorf("người dùng %s không sở hữu thửa đất %s", tx.FromOwnerID, landID)
	}
	var newParcels []Land
	if err := json.Unmarshal([]byte(newParcelsStr), &newParcels); err != nil {
		return fmt.Errorf("lỗi khi giải mã danh sách thửa đất mới: %v", err)
	}
	if len(newParcels) == 0 {
		return fmt.Errorf("danh sách thửa đất mới trống")
	}
	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}
	var totalArea float64
	var newLandIDs []string
	var updatedOriginal bool
	// Step 1: Validate and process all parcels
	for _, newLand := range newParcels {
		// Determine if this is an update (ID matches original) or create new
		isUpdate := newLand.ID == landID
		
		// Validate with appropriate flag
		if err := ValidateLand(ctx, newLand, isUpdate); err != nil {
			return fmt.Errorf("thửa đất mới %s không hợp lệ: %v", newLand.ID, err)
		}
		
		totalArea += newLand.Area
		newLand.CreatedAt = txTime
		newLand.UpdatedAt = txTime
		newLand.OwnerID = tx.FromOwnerID // Inherit owner
		// Kế thừa mục đích sử dụng và vị trí từ thửa đất gốc
		newLand.LandUsePurpose = originalLand.LandUsePurpose
		newLand.Location = originalLand.Location
		
		// Xử lý geometry CID cho thửa đất mới
		if newLand.GeometryCID != "" {
			// Validate geometry CID nếu được cung cấp từ giao diện
			if err := ValidateIPFSHash(newLand.GeometryCID); err != nil {
				return fmt.Errorf("geometry CID không hợp lệ cho thửa đất %s: %v", newLand.ID, err)
			}
		} else if isUpdate {
			// Nếu là cập nhật thửa đất gốc và không có geometry CID mới, giữ nguyên
			newLand.GeometryCID = originalLand.GeometryCID
		}
		
		// Invalidate certificate for all parcels
		newLand.CertificateID = ""
		newLand.IssueDate = time.Time{}
		newLand.LegalInfo = "Giấy chứng nhận sẽ được cấp mới sau tách thửa"
		newLand.LegalStatus = ""
		
		if isUpdate {
			// Update original land
			updatedOriginal = true
			newLand.DocumentIDs = originalLand.DocumentIDs // Keep existing documents
		}
		
		// Save the land parcel
		landJSON, err := json.Marshal(newLand)
		if err != nil {
			return fmt.Errorf("lỗi khi mã hóa thửa đất %s: %v", newLand.ID, err)
		}
		if err := ctx.GetStub().PutState(newLand.ID, landJSON); err != nil {
			return fmt.Errorf("lỗi khi lưu thửa đất %s: %v", newLand.ID, err)
		}
		newLandIDs = append(newLandIDs, newLand.ID)
	}
	if totalArea > originalLand.Area {
		return fmt.Errorf("tổng diện tích các thửa mới (%f m²) vượt quá diện tích thửa gốc (%f m²)", totalArea, originalLand.Area)
	}
	// Step 3: Invalidate original land if not updated
	if !updatedOriginal {
		originalLand.CertificateID = ""
		originalLand.IssueDate = time.Time{}
		originalLand.LegalInfo = "Giấy chứng nhận đã vô hiệu do tách thửa đất"
		originalLand.LegalStatus = ""
		originalLand.UpdatedAt = txTime
		updatedLandJSON, err := json.Marshal(originalLand)
		if err != nil {
			return fmt.Errorf("lỗi khi mã hóa thửa đất gốc %s: %v", landID, err)
		}
		if err := ctx.GetStub().PutState(landID, updatedLandJSON); err != nil {
			return fmt.Errorf("lỗi khi cập nhật thửa đất gốc %s: %v", landID, err)
		}
	}
	// Update transaction
	tx.ParcelIDs = newLandIDs
	tx.Status = "APPROVED"
	tx.Details = fmt.Sprintf("%s; Đã phê duyệt tách thửa và tạo/cập nhật %d thửa đất mới, tất cả GCN đã vô hiệu hóa", tx.Details, len(newLandIDs))
	tx.UpdatedAt = txTime
	txJSON, err := json.Marshal(tx)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa giao dịch: %v", err)
	}
	if err := ctx.GetStub().PutState(txID, txJSON); err != nil {
		return fmt.Errorf("lỗi khi cập nhật giao dịch: %v", err)
	}
	// Emit event for off-chain apps
	if err := ctx.GetStub().SetEvent("SPLIT_APPROVED", txJSON); err != nil {
		return fmt.Errorf("lỗi khi emit event: %v", err)
	}
	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "APPROVE_SPLIT", userID, fmt.Sprintf("Phê duyệt tách thửa %s thành %d thửa mới, tất cả GCN đã vô hiệu hóa", txID, len(newLandIDs)))
}

// ApproveMergeTransaction approves a merge transaction, updating the selected original land and invalidating all certificates
func (s *LandRegistryChaincode) ApproveMergeTransaction(ctx contractapi.TransactionContextInterface, txID, landIdsStr, selectedLandID, newParcelStr string) error {
	if err := CheckOrganization(ctx, []string{"Org1MSP"}); err != nil {
		return err
	}
	userID, err := GetCallerID(ctx)
	if err != nil {
		return err
	}
	tx, err := GetTransaction(ctx, txID)
	if err != nil {
		return err
	}
	if tx.Status != "VERIFIED" {
		return fmt.Errorf("giao dịch %s không ở trạng thái VERIFIED", txID)
	}
	if tx.Type != "MERGE" {
		return fmt.Errorf("giao dịch %s không phải là hợp thửa", txID)
	}
	var landIds []string
	if err := json.Unmarshal([]byte(landIdsStr), &landIds); err != nil {
		return fmt.Errorf("lỗi khi giải mã danh sách landIds: %v", err)
	}
	// Lấy thông tin area và geometryCID từ newParcelStr
	var newParcelData struct {
		ID          string  `json:"id"`
		Area        float64 `json:"area"`
		GeometryCID string  `json:"geometryCid"`
	}
	if err := json.Unmarshal([]byte(newParcelStr), &newParcelData); err != nil {
		return fmt.Errorf("lỗi khi giải mã thông tin thửa đất mới: %v", err)
	}
	// Verify selectedLandID is in landIds
	isValidSelected := false
	for _, id := range landIds {
		if id == selectedLandID {
			isValidSelected = true
			break
		}
	}
	if !isValidSelected {
		return fmt.Errorf("selectedLandID %s không nằm trong danh sách landIds %v", selectedLandID, landIds)
	}
	var totalArea float64
	var baseLocation string
	for i, parcelID := range landIds {
		parcelID = strings.TrimSpace(parcelID)
		land, err := s.QueryLandByID(ctx, parcelID)
		if err != nil {
			return fmt.Errorf("lỗi khi truy vấn thửa đất %s: %v", parcelID, err)
		}
		if land.OwnerID != tx.FromOwnerID {
			return fmt.Errorf("người dùng %s không sở hữu thửa đất %s", tx.FromOwnerID, parcelID)
		}
		totalArea += land.Area
		if i == 0 {
			baseLocation = land.Location
		} else if land.Location != baseLocation {
			return fmt.Errorf("thửa đất %s không cùng vị trí với các thửa khác", parcelID)
		}
	}
	// Không validate toàn bộ struct, chỉ kiểm tra area
	if newParcelData.Area <= 0 {
		return fmt.Errorf("diện tích thừa đất mới phải lớn hơn 0")
	}
	if newParcelData.Area != totalArea {
		return fmt.Errorf("diện tích thừa đất mới (%f m²) không khớp với tổng diện tích các thừa đất gốc (%f m²)", newParcelData.Area, totalArea)
	}
	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}
	// Step 1: Lấy thông tin thừa đất chính hiện tại và chỉ cập nhật area
	existingLand, err := s.QueryLandByID(ctx, selectedLandID)
	if err != nil {
		return fmt.Errorf("lỗi khi truy vấn thừa đất gốc %s: %v", selectedLandID, err)
	}
	// Chỉ cập nhật area và vô hiệu hóa GCN, giữ nguyên các thông tin khác
	existingLand.Area = newParcelData.Area
	existingLand.UpdatedAt = txTime
	existingLand.CertificateID = "" // Invalidate certificate
	existingLand.IssueDate = time.Time{}
	existingLand.LegalInfo = "Giấy chứng nhận sẽ được cấp mới sau hợp thừa"
	existingLand.LegalStatus = ""
	
	// Xử lý geometry CID cho thửa đất hợp nhất
	if newParcelData.GeometryCID != "" {
		if err := ValidateIPFSHash(newParcelData.GeometryCID); err != nil {
			return fmt.Errorf("geometry CID không hợp lệ: %v", err)
		}
		existingLand.GeometryCID = newParcelData.GeometryCID
	}
	
	landJSON, err := json.Marshal(existingLand)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa thửa đất gốc %s: %v", selectedLandID, err)
	}
	if err := ctx.GetStub().PutState(selectedLandID, landJSON); err != nil {
		return fmt.Errorf("lỗi khi cập nhật thửa đất gốc %s: %v", selectedLandID, err)
	}
	// Step 2: Invalidate other original lands
	for _, parcelID := range landIds {
		if parcelID == selectedLandID {
			continue // Skip the updated land
		}
		originalLand, err := s.QueryLandByID(ctx, parcelID)
		if err != nil {
			return fmt.Errorf("lỗi khi truy vấn thửa đất %s: %v", parcelID, err)
		}
		originalLand.CertificateID = ""
		originalLand.IssueDate = time.Time{}
		originalLand.LegalInfo = "Giấy chứng nhận đã vô hiệu do hợp thửa đất"
		originalLand.LegalStatus = ""
		originalLand.UpdatedAt = txTime
		updatedLandJSON, err := json.Marshal(originalLand)
		if err != nil {
			return fmt.Errorf("lỗi khi mã hóa thửa đất cũ %s: %v", parcelID, err)
		}
		if err := ctx.GetStub().PutState(parcelID, updatedLandJSON); err != nil {
			return fmt.Errorf("lỗi khi cập nhật thửa đất cũ %s: %v", parcelID, err)
		}
	}
	// Update transaction
	tx.LandParcelID = selectedLandID
	tx.Status = "APPROVED"
	tx.Details = fmt.Sprintf("%s; Đã phê duyệt hợp thửa và cập nhật thửa đất %s, tất cả GCN đã vô hiệu hóa", tx.Details, selectedLandID)
	tx.UpdatedAt = txTime
	txJSON, err := json.Marshal(tx)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa giao dịch: %v", err)
	}
	if err := ctx.GetStub().PutState(txID, txJSON); err != nil {
		return fmt.Errorf("lỗi khi cập nhật giao dịch: %v", err)
	}
	// Emit event for off-chain apps
	if err := ctx.GetStub().SetEvent("MERGE_APPROVED", txJSON); err != nil {
		return fmt.Errorf("lỗi khi emit event: %v", err)
	}
	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "APPROVE_MERGE", userID, fmt.Sprintf("Phê duyệt hợp thửa %s thành thửa %s, tất cả GCN đã vô hiệu hóa", txID, selectedLandID))
}

// ApproveChangePurposeTransaction - Phê duyệt giao dịch thay đổi mục đích sử dụng
func (s *LandRegistryChaincode) ApproveChangePurposeTransaction(ctx contractapi.TransactionContextInterface, txID string) error {
	if err := CheckOrganization(ctx, []string{"Org1MSP"}); err != nil {
		return err
	}
	userID, err := GetCallerID(ctx)
	if err != nil {
		return err
	}
	tx, err := GetTransaction(ctx, txID)
	if err != nil {
		return err
	}
	if tx.Status != "VERIFIED" {
		return fmt.Errorf("giao dịch %s không ở trạng thái VERIFIED", txID)
	}
	if tx.Type != "CHANGE_PURPOSE" {
		return fmt.Errorf("giao dịch %s không phải là thay đổi mục đích sử dụng", txID)
	}

	land, err := s.QueryLandByID(ctx, tx.LandParcelID)
	if err != nil {
		return fmt.Errorf("lỗi khi truy vấn thửa đất %s: %v", tx.LandParcelID, err)
	}

	// Kiểm tra quyền sở hữu
	if land.OwnerID != tx.FromOwnerID {
		return fmt.Errorf("người dùng %s không sở hữu thửa đất %s", tx.FromOwnerID, tx.LandParcelID)
	}

    // Trích xuất mục đích sử dụng mới từ details một cách an toàn
    // Helper: lấy nội dung sau "sang " đến trước dấu kết câu tiếp theo
    extractPurpose := func(source string) string {
        idx := strings.LastIndex(source, "sang ")
        if idx == -1 {
            return ""
        }
        rest := strings.TrimSpace(source[idx+len("sang "):])
        // Cắt đến dấu phân cách đầu tiên (., ;, , hoặc xuống dòng)
        cut := len(rest)
        for _, d := range []string{".", ";", ",", "\n"} {
            if i := strings.Index(rest, d); i != -1 && i < cut {
                cut = i
            }
        }
        return strings.TrimSpace(rest[:cut])
    }

    var newPurpose string
    // 1) Thử trích trực tiếp từ chi tiết hiện tại
    newPurpose = extractPurpose(tx.Details)

    // 2) Nếu không có, backfill từ lịch sử giao dịch (snapshot đầu tiên thường chứa câu gốc có "sang <mục đích>")
    if newPurpose == "" {
        resultsIterator, err := ctx.GetStub().GetHistoryForKey(txID)
        if err != nil {
            return fmt.Errorf("lỗi khi lấy lịch sử giao dịch: %v", err)
        }
        defer resultsIterator.Close()
        for resultsIterator.HasNext() {
            response, err := resultsIterator.Next()
            if err != nil {
                return fmt.Errorf("lỗi khi đọc lịch sử giao dịch: %v", err)
            }
            if len(response.Value) == 0 {
                continue
            }
            var snap Transaction
            if err := json.Unmarshal(response.Value, &snap); err != nil {
                continue
            }
            if p := extractPurpose(snap.Details); p != "" {
                newPurpose = p
                break
            }
        }
    }

    if newPurpose == "" {
        return fmt.Errorf("không tìm thấy mục đích sử dụng mới trong chi tiết giao dịch hiện tại hoặc lịch sử: %s", tx.Details)
    }
	// Removed ValidateLandUsePurpose validation as requested

	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}

	// Vô hiệu hóa giấy chứng nhận cũ (do thông tin thay đổi)
	if land.CertificateID != "" {
		land.CertificateID = ""      // Xóa giấy chứng nhận cũ
		land.IssueDate = time.Time{} // Reset ngày cấp
		land.LegalInfo = "Giấy chứng nhận đã vô hiệu do thay đổi mục đích sử dụng đất"
	}

	// Cập nhật mục đích sử dụng
    land.LandUsePurpose = newPurpose
	land.UpdatedAt = txTime
	landJSON, err := json.Marshal(land)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa thửa đất: %v", err)
	}
	if err := ctx.GetStub().PutState(tx.LandParcelID, landJSON); err != nil {
		return fmt.Errorf("lỗi khi cập nhật thửa đất: %v", err)
	}

	// Cập nhật trạng thái giao dịch
	tx.Status = "APPROVED"
    tx.Details = fmt.Sprintf("%s; Đã phê duyệt thay đổi mục đích sử dụng sang %s", tx.Details, newPurpose)
	tx.UpdatedAt = txTime
	txJSON, err := json.Marshal(tx)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa giao dịch: %v", err)
	}
	if err := ctx.GetStub().PutState(txID, txJSON); err != nil {
		return fmt.Errorf("lỗi khi cập nhật giao dịch: %v", err)
	}

	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "APPROVE_CHANGE_PURPOSE", userID, fmt.Sprintf("Phê duyệt thay đổi mục đích sử dụng %s", txID))
}

// RejectTransaction - Từ chối giao dịch
func (s *LandRegistryChaincode) RejectTransaction(ctx contractapi.TransactionContextInterface, txID, reason string) error {
	if err := CheckOrganization(ctx, []string{"Org1MSP"}); err != nil {
		return err
	}
	userID, err := GetCallerID(ctx)
	if err != nil {
		return err
	}
	tx, err := GetTransaction(ctx, txID)
	if err != nil {
		return err
	}
	if tx.Status != "VERIFIED" {
		return fmt.Errorf("giao dịch %s không ở trạng thái VERIFIED", txID)
	}
	tx.Status = "REJECTED"
	tx.Details = fmt.Sprintf("%s; Lý do từ chối: %s", tx.Details, reason)
	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}
	tx.UpdatedAt = txTime
	txJSON, err := json.Marshal(tx)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa giao dịch: %v", err)
	}
	if err := ctx.GetStub().PutState(txID, txJSON); err != nil {
		return fmt.Errorf("lỗi khi cập nhật giao dịch: %v", err)
	}
	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "REJECT_TRANSACTION", userID, fmt.Sprintf("Từ chối giao dịch %s: %s", txID, reason))
}

