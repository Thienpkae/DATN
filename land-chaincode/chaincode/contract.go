package chaincode

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// LandRegistryChaincode định nghĩa cấu trúc chaincode
type LandRegistryChaincode struct {
	contractapi.Contract
}

// VerifyDocument chứng thực tính hợp lệ của tài liệu (Nghị định 121/2025/NĐ-CP, Org2 only)
func (s *LandRegistryChaincode) VerifyDocument(ctx contractapi.TransactionContextInterface, docID string) error {
	if err := CheckOrganization(ctx, []string{"Org2MSP"}); err != nil {
		return err
	}
	userID, err := GetCallerID(ctx)
	if err != nil {
		return err
	}

	data, err := ctx.GetStub().GetState(docID)
	if err != nil {
		return fmt.Errorf("lỗi khi truy vấn tài liệu %s: %v", docID, err)
	}
	if data == nil {
		return fmt.Errorf("tài liệu %s không tồn tại", docID)
	}

	var doc Document
	if err := json.Unmarshal(data, &doc); err != nil {
		return fmt.Errorf("lỗi khi giải mã tài liệu: %v", err)
	}

	// Kiểm tra tính hợp lệ của tài liệu
	if err := ValidateIPFSHash(doc.IPFSHash); err != nil {
		return fmt.Errorf("hash IPFS không hợp lệ: %v", err)
	}
	if doc.Description == "" {
		return fmt.Errorf("mô tả tài liệu không được để trống")
	}
	// Kiểm tra loại tài liệu được hỗ trợ theo Nghị định 121/2025/NĐ-CP
	supportedDocs := []string{"Hợp đồng", "Đơn xin", "CMND/CCCD", "Sổ hộ khẩu", "Bản đồ"}
	isSupported := false
	for _, supported := range supportedDocs {
		if strings.Contains(doc.Description, supported) {
			isSupported = true
			break
		}
	}
	if !isSupported {
		return fmt.Errorf("tài liệu với mô tả %s không được hỗ trợ để chứng thực", doc.Description)
	}

	// Cập nhật trạng thái tài liệu
	doc.Verified = true
	doc.VerifiedBy = userID
	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}
	doc.VerifiedAt = txTime

	docJSON, err := json.Marshal(doc)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa tài liệu: %v", err)
	}

	if err := ctx.GetStub().PutState(docID, docJSON); err != nil {
		return fmt.Errorf("lỗi khi cập nhật tài liệu: %v", err)
	}

	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "VERIFY_DOCUMENT", userID, fmt.Sprintf("Chứng thực tài liệu %s", docID))
}

// ProcessTransaction tiếp nhận và thẩm định hồ sơ tự động (UC-20, UC-22, Org2 only)
func (s *LandRegistryChaincode) ProcessTransaction(ctx contractapi.TransactionContextInterface, txID string) error {
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
	if tx.Status != "PENDING" {
		return fmt.Errorf("giao dịch %s không ở trạng thái PENDING", txID)
	}

	// Kiểm tra và chứng thực tài liệu bắt buộc
	documents, err := s.QueryDocumentsByTransaction(ctx, txID, userID)
	if err != nil {
		return fmt.Errorf("lỗi khi truy vấn tài liệu của giao dịch %s: %v", txID, err)
	}
	for _, doc := range documents {
		if !doc.Verified {
			if err := s.VerifyDocument(ctx, doc.DocID); err != nil {
				return fmt.Errorf("lỗi khi chứng thực tài liệu %s: %v", doc.DocID, err)
			}
		}
	}

	// Kiểm tra tài liệu bắt buộc theo loại giao dịch
	missingDocs, err := CheckRequiredDocuments(ctx, txID, tx.Type)
	if err != nil {
		return err
	}
	if len(missingDocs) > 0 {
		tx.Status = "SUPPLEMENT_REQUESTED"
		tx.Details = fmt.Sprintf("%s; Yêu cầu bổ sung: Thiếu %v", tx.Details, missingDocs)
	} else {
		tx.Status = "VERIFIED"
		tx.Details = fmt.Sprintf("%s; Hồ sơ đầy đủ, đã thẩm định", tx.Details)
	}
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

	action := map[string]string{
		"SUPPLEMENT_REQUESTED": "Yêu cầu bổ sung hồ sơ",
		"VERIFIED":             "Thẩm định hồ sơ",
	}[tx.Status]
	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "PROCESS_TRANSACTION", userID, fmt.Sprintf("%s %s", action, txID))
}

// IssueLandCertificate cấp GCN điện tử mới hoặc cấp đổi (UC-26, Nghị định 151/2025/NĐ-CP, Org1 only)
func (s *LandRegistryChaincode) IssueLandCertificate(ctx contractapi.TransactionContextInterface, certificateID, landParcelID, ownerID, legalInfo, signature string) error {
	if err := CheckOrganization(ctx, []string{"Org1MSP"}); err != nil {
		return err
	}
	userID, err := GetCallerID(ctx)
	if err != nil {
		return err
	}

	if _, err := CheckCertificateExists(ctx, certificateID); err != nil {
		return err
	}

	if err := VerifyLandParcelLegalStatus(ctx, landParcelID, []string{"Đang tranh chấp", "Đang thế chấp"}); err != nil {
		return err
	}

	if ok, err := ValidateSignature(ctx, signature, ownerID); !ok {
		return err
	}

	// Kiểm tra xem là cấp mới hay cấp đổi
	data, err := ctx.GetStub().GetState(landParcelID)
	if err != nil {
		return fmt.Errorf("lỗi khi truy vấn thửa đất: %v", err)
	}
	if data == nil {
		return fmt.Errorf("thửa đất %s không tồn tại", landParcelID)
	}
	var parcel LandParcel
	if err := json.Unmarshal(data, &parcel); err != nil {
		return fmt.Errorf("lỗi khi giải mã thửa đất: %v", err)
	}

	isInitialIssue := parcel.CertificateID == ""

	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}

	cert := LandCertificate{
		CertificateID: certificateID,
		LandParcelID:  landParcelID,
		OwnerID:       ownerID,
		IssueDate:     txTime,
		LegalInfo:     legalInfo,
		Signature:     signature,
		CreatedAt:     txTime,
		UpdatedAt:     txTime,
	}

	certJSON, err := json.Marshal(cert)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa GCN: %v", err)
	}

	if err := ctx.GetStub().PutState(certificateID, certJSON); err != nil {
		return fmt.Errorf("lỗi khi lưu GCN: %v", err)
	}

	parcel.CertificateID = certificateID
	parcel.LegalStatus = "Có giấy chứng nhận"
	parcel.UpdatedAt = txTime
	parcelJSON, err := json.Marshal(parcel)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa thửa đất: %v", err)
	}
	if err := ctx.GetStub().PutState(landParcelID, parcelJSON); err != nil {
		return fmt.Errorf("lỗi khi cập nhật thửa đất: %v", err)
	}

	// Ghi log phân biệt cấp mới hoặc cấp đổi
	logAction := map[bool]string{true: "ISSUE_INITIAL_CERTIFICATE", false: "ISSUE_REISSUE_CERTIFICATE"}[isInitialIssue]
	logDetails := map[bool]string{true: "Cấp mới GCN", false: "Cấp đổi GCN"}[isInitialIssue]
	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), logAction, userID, fmt.Sprintf("%s %s cho thửa đất %s", logDetails, certificateID, landParcelID))
}

// CreateLandParcel tạo thửa đất mới (UC-11, UC-15, UC-16, Org1 only)
func (s *LandRegistryChaincode) CreateLandParcel(ctx contractapi.TransactionContextInterface, id, ownerID, location, landUsePurpose, legalStatus, area string, userID string) error {
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

	parcel := LandParcel{
		ID:             id,
		OwnerID:        ownerID,
		Area:           areaFloat,
		Location:       location,
		LandUsePurpose: landUsePurpose,
		LegalStatus:    legalStatus,
		CertificateID:  "",
		CreatedAt:      txTime,
		UpdatedAt:      txTime,
	}

	if err := ValidateLandParcel(ctx, parcel); err != nil {
		return err
	}

	parcelJSON, err := json.Marshal(parcel)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa thửa đất: %v", err)
	}

	if err := ctx.GetStub().PutState(id, parcelJSON); err != nil {
		return fmt.Errorf("lỗi khi lưu thửa đất: %v", err)
	}

	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "CREATE_LAND_PARCEL", userID, fmt.Sprintf("Tạo thửa đất %s", id))
}

// UploadDocument lưu hash tài liệu từ IPFS (UC-11, UC-25, Org3 only)
func (s *LandRegistryChaincode) UploadDocument(ctx contractapi.TransactionContextInterface, docID, landParcelID, txID, ipfsHash, description, userID string) error {
	if err := CheckOrganization(ctx, []string{"Org3MSP"}); err != nil {
		return err
	}

	if err := ValidateIPFSHash(ipfsHash); err != nil {
		return err
	}

	if err := VerifyLandParcelOwnership(ctx, landParcelID, userID); err != nil {
		return err
	}

	if txID != "" {
		if _, err := CheckTransactionExists(ctx, txID); err != nil {
			return err
		}
	}

	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}

	doc := Document{
		DocID:        docID,
		LandParcelID: landParcelID,
		TxID:         txID,
		IPFSHash:     ipfsHash,
		Description:  description,
		Verified:     false,
		CreatedAt:    txTime,
		UpdatedAt:    txTime,
	}

	docJSON, err := json.Marshal(doc)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa tài liệu: %v", err)
	}

	if err := ctx.GetStub().PutState(docID, docJSON); err != nil {
		return fmt.Errorf("lỗi khi lưu tài liệu: %v", err)
	}

	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "UPLOAD_DOCUMENT", userID, fmt.Sprintf("Tải lên tài liệu %s cho thửa đất %s", docID, landParcelID))
}

// CreateTransferRequest tạo yêu cầu chuyển nhượng (UC-13, Org3 only)
func (s *LandRegistryChaincode) CreateTransferRequest(ctx contractapi.TransactionContextInterface, txID, landParcelID, fromOwnerID, toOwnerID, details, signature string) error {
	if err := CheckOrganization(ctx, []string{"Org3MSP"}); err != nil {
		return err
	}

	if err := VerifyLandParcelOwnership(ctx, landParcelID, fromOwnerID); err != nil {
		return err
	}
	if err := VerifyLandParcelLegalStatus(ctx, landParcelID, []string{"Đang tranh chấp", "Đang thế chấp"}); err != nil {
		return err
	}

	if ok, err := ValidateSignature(ctx, signature, fromOwnerID); !ok {
		return err
	}

	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}

	tx := LandTransaction{
		TxID:         txID,
		Type:         "TRANSFER",
		LandParcelID: landParcelID,
		FromOwnerID:  fromOwnerID,
		ToOwnerID:    toOwnerID,
		Status:       "PENDING",
		Details:      details,
		Signature:    signature,
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

	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "CREATE_TRANSFER_REQUEST", fromOwnerID, fmt.Sprintf("Tạo yêu cầu chuyển nhượng %s", txID))
}

// ConfirmTransfer xác nhận đồng ý nhận chuyển nhượng (UC-14, Org3 only)
func (s *LandRegistryChaincode) ConfirmTransfer(ctx contractapi.TransactionContextInterface, txID, toOwnerID, signature string, agree bool) error {
	if err := CheckOrganization(ctx, []string{"Org3MSP"}); err != nil {
		return err
	}

	tx, err := GetTransaction(ctx, txID)
	if err != nil {
		return err
	}
	if tx.Type != "TRANSFER" || tx.ToOwnerID != toOwnerID || tx.Status != "PENDING" {
		return fmt.Errorf("giao dịch %s không hợp lệ hoặc không ở trạng thái PENDING", txID)
	}

	if ok, err := ValidateSignature(ctx, signature, toOwnerID); !ok {
		return err
	}

	tx.Status = map[bool]string{true: "CONFIRMED", false: "REJECTED"}[agree]
	tx.Signature = signature
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

	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "CONFIRM_TRANSFER", toOwnerID, fmt.Sprintf("Xác nhận %s cho giao dịch %s", map[bool]string{true: "đồng ý", false: "từ chối"}[agree], txID))
}

// CreateSplitRequest tạo yêu cầu tách thửa (UC-15, Org3 only)
func (s *LandRegistryChaincode) CreateSplitRequest(ctx contractapi.TransactionContextInterface, txID, landParcelID, ownerID, signature, newParcelsStr string) error {
	if err := CheckOrganization(ctx, []string{"Org3MSP"}); err != nil {
		return err
	}

	var newParcels []LandParcel
	if err := json.Unmarshal([]byte(newParcelsStr), &newParcels); err != nil {
		return fmt.Errorf("lỗi khi giải mã danh sách thửa đất mới: %v", err)
	}

	if err := VerifyLandParcelOwnership(ctx, landParcelID, ownerID); err != nil {
		return err
	}
	if err := VerifyLandParcelLegalStatus(ctx, landParcelID, []string{"Đang tranh chấp", "Đang thế chấp"}); err != nil {
		return err
	}

	data, err := ctx.GetStub().GetState(landParcelID)
	if err != nil {
		return fmt.Errorf("lỗi khi truy vấn thửa đất: %v", err)
	}
	var parcel LandParcel
	if err := json.Unmarshal(data, &parcel); err != nil {
		return fmt.Errorf("lỗi khi giải mã thửa đất: %v", err)
	}

	var totalArea float64
	for _, newParcel := range newParcels {
		if err := ValidateLandParcel(ctx, newParcel); err != nil {
			return fmt.Errorf("thửa đất mới %s không hợp lệ: %v", newParcel.ID, err)
		}
		totalArea += newParcel.Area
	}
	if totalArea > parcel.Area {
		return fmt.Errorf("tổng diện tích các thửa mới (%f m²) vượt quá diện tích thửa gốc (%f m²)", totalArea, parcel.Area)
	}

	if ok, err := ValidateSignature(ctx, signature, ownerID); !ok {
		return err
	}

	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}

	tx := LandTransaction{
		TxID:         txID,
		Type:         "SPLIT",
		LandParcelID: landParcelID,
		FromOwnerID:  ownerID,
		ToOwnerID:    ownerID,
		Status:       "PENDING",
		Details:      fmt.Sprintf("Tách thửa đất %s thành %d thửa", landParcelID, len(newParcels)),
		Signature:    signature,
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

	for _, newParcel := range newParcels {
		newParcel.CreatedAt = txTime
		newParcel.UpdatedAt = txTime
		newParcelJSON, err := json.Marshal(newParcel)
		if err != nil {
			return fmt.Errorf("lỗi khi mã hóa thửa đất mới: %v", err)
		}
		if err := ctx.GetStub().PutState(newParcel.ID, newParcelJSON); err != nil {
			return fmt.Errorf("lỗi khi lưu thửa đất mới %s: %v", newParcel.ID, err)
		}
	}

	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "CREATE_SPLIT_REQUEST", ownerID, fmt.Sprintf("Tạo yêu cầu tách thửa %s", txID))
}

// CreateMergeRequest tạo yêu cầu hợp thửa (UC-16, Org3 only)
func (s *LandRegistryChaincode) CreateMergeRequest(ctx contractapi.TransactionContextInterface, txID, ownerID, signature, parcelIDsStr, newParcelStr string) error {
	if err := CheckOrganization(ctx, []string{"Org3MSP"}); err != nil {
		return err
	}

	var parcelIDs []string
	if err := json.Unmarshal([]byte(parcelIDsStr), &parcelIDs); err != nil {
		return fmt.Errorf("lỗi khi giải mã danh sách parcelIDs: %v", err)
	}
	var newParcel LandParcel
	if err := json.Unmarshal([]byte(newParcelStr), &newParcel); err != nil {
		return fmt.Errorf("lỗi khi giải mã thửa đất mới: %v", err)
	}

	if ok, err := ValidateSignature(ctx, signature, ownerID); !ok {
		return err
	}

	var totalArea float64
	for _, parcelID := range parcelIDs {
		if err := VerifyLandParcelOwnership(ctx, parcelID, ownerID); err != nil {
			return err
		}
		if err := VerifyLandParcelLegalStatus(ctx, parcelID, []string{"Đang tranh chấp", "Đang thế chấp"}); err != nil {
			return err
		}
		data, err := ctx.GetStub().GetState(parcelID)
		if err != nil {
			return fmt.Errorf("lỗi khi truy vấn thửa đất %s: %v", parcelID, err)
		}
		var parcel LandParcel
		if err := json.Unmarshal(data, &parcel); err != nil {
			return fmt.Errorf("lỗi khi giải mã thửa đất %s: %v", parcelID, err)
		}
		totalArea += parcel.Area
	}

	if err := ValidateLandParcel(ctx, newParcel); err != nil {
		return fmt.Errorf("thửa đất mới %s không hợp lệ: %v", newParcel.ID, err)
	}
	if newParcel.Area != totalArea {
		return fmt.Errorf("diện tích thửa đất mới (%f m²) không khớp với tổng diện tích các thửa đất gốc (%f m²)", newParcel.Area, totalArea)
	}

	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}

	tx := LandTransaction{
		TxID:         txID,
		Type:         "MERGE",
		LandParcelID: newParcel.ID,
		FromOwnerID:  ownerID,
		ToOwnerID:    ownerID,
		Status:       "PENDING",
		Details:      fmt.Sprintf("Hợp nhất các thửa đất %v thành %s", parcelIDs, newParcel.ID),
		Signature:    signature,
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

	newParcel.CreatedAt = txTime
	newParcel.UpdatedAt = txTime
	newParcelJSON, err := json.Marshal(newParcel)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa thửa đất mới: %v", err)
	}
	if err := ctx.GetStub().PutState(newParcel.ID, newParcelJSON); err != nil {
		return fmt.Errorf("lỗi khi lưu thửa đất mới %s: %v", newParcel.ID, err)
	}

	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "CREATE_MERGE_REQUEST", ownerID, fmt.Sprintf("Tạo yêu cầu hợp thửa %s", txID))
}

// CreateChangePurposeRequest tạo yêu cầu thay đổi mục đích sử dụng đất (UC-17, Org3 only)
func (s *LandRegistryChaincode) CreateChangePurposeRequest(ctx contractapi.TransactionContextInterface, txID, landParcelID, ownerID, newPurpose, details, signature string) error {
	if err := CheckOrganization(ctx, []string{"Org3MSP"}); err != nil {
		return err
	}

	if err := VerifyLandParcelOwnership(ctx, landParcelID, ownerID); err != nil {
		return err
	}
	if err := VerifyLandParcelLegalStatus(ctx, landParcelID, []string{"Đang tranh chấp", "Đang thế chấp"}); err != nil {
		return err
	}
	if err := ValidateLandUsePurpose(newPurpose); err != nil {
		return err
	}

	if ok, err := ValidateSignature(ctx, signature, ownerID); !ok {
		return err
	}

	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}

	tx := LandTransaction{
		TxID:         txID,
		Type:         "CHANGE_PURPOSE",
		LandParcelID: landParcelID,
		FromOwnerID:  ownerID,
		ToOwnerID:    ownerID,
		Status:       "PENDING",
		Details:      fmt.Sprintf("Thay đổi mục đích sử dụng thửa đất %s sang %s: %s", landParcelID, newPurpose, details),
		Signature:    signature,
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

	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "CREATE_CHANGE_PURPOSE_REQUEST", ownerID, fmt.Sprintf("Tạo yêu cầu thay đổi mục đích sử dụng %s", txID))
}

// CreateReissueRequest tạo yêu cầu cấp lại giấy chứng nhận (UC-18, Org3 only)
func (s *LandRegistryChaincode) CreateReissueRequest(ctx contractapi.TransactionContextInterface, txID, landParcelID, ownerID, details, signature string) error {
	if err := CheckOrganization(ctx, []string{"Org3MSP"}); err != nil {
		return err
	}

	if err := VerifyLandParcelOwnership(ctx, landParcelID, ownerID); err != nil {
		return err
	}
	if err := VerifyLandParcelLegalStatus(ctx, landParcelID, []string{"Đang tranh chấp", "Đang thế chấp"}); err != nil {
		return err
	}

	if ok, err := ValidateSignature(ctx, signature, ownerID); !ok {
		return err
	}

	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}

	tx := LandTransaction{
		TxID:         txID,
		Type:         "REISSUE",
		LandParcelID: landParcelID,
		FromOwnerID:  ownerID,
		ToOwnerID:    ownerID,
		Status:       "PENDING",
		Details:      fmt.Sprintf("Yêu cầu cấp lại GCN cho thửa đất %s: %s", landParcelID, details),
		Signature:    signature,
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

	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "CREATE_REISSUE_REQUEST", ownerID, fmt.Sprintf("Tạo yêu cầu cấp lại GCN %s", txID))
}

// ForwardTransaction chuyển tiếp hồ sơ (UC-21, Org2 only)
func (s *LandRegistryChaincode) ForwardTransaction(ctx contractapi.TransactionContextInterface, txID, forwardDetails string) error {
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
	if tx.Status != "VERIFIED" && tx.Status != "SUPPLEMENT_REQUESTED" {
		return fmt.Errorf("giao dịch %s không ở trạng thái VERIFIED hoặc SUPPLEMENT_REQUESTED", txID)
	}

	tx.Status = "FORWARDED"
	tx.Details = fmt.Sprintf("%s; Chuyển tiếp: %s", tx.Details, forwardDetails)
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

	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "FORWARD_TRANSACTION", userID, fmt.Sprintf("Chuyển tiếp hồ sơ %s", txID))
}

// ApproveTransaction phê duyệt hồ sơ (UC-24, Org1 only)
func (s *LandRegistryChaincode) ApproveTransaction(ctx contractapi.TransactionContextInterface, txID, approveDetails string) error {
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
	if tx.Status != "FORWARDED" {
		return fmt.Errorf("giao dịch %s không ở trạng thái FORWARDED", txID)
	}

	missingDocs, err := CheckRequiredDocuments(ctx, txID, tx.Type)
	if err != nil {
		return err
	}
	if len(missingDocs) > 0 {
		return fmt.Errorf("giao dịch %s thiếu tài liệu: %v", txID, missingDocs)
	}

	tx.Status = "APPROVED"
	tx.Details = fmt.Sprintf("%s; Phê duyệt: %s", tx.Details, approveDetails)
	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}
	tx.UpdatedAt = txTime

	switch tx.Type {
	case "TRANSFER":
		data, err := ctx.GetStub().GetState(tx.LandParcelID)
		if err != nil {
			return fmt.Errorf("lỗi khi truy vấn thửa đất %s: %v", tx.LandParcelID, err)
		}
		var parcel LandParcel
		if err := json.Unmarshal(data, &parcel); err != nil {
			return fmt.Errorf("lỗi khi giải mã thửa đất: %v", err)
		}
		parcel.OwnerID = tx.ToOwnerID
		parcel.UpdatedAt = txTime
		parcelJSON, err := json.Marshal(parcel)
		if err != nil {
			return fmt.Errorf("lỗi khi mã hóa thửa đất: %v", err)
		}
		if err := ctx.GetStub().PutState(tx.LandParcelID, parcelJSON); err != nil {
			return fmt.Errorf("lỗi khi cập nhật thửa đất: %v", err)
		}

		if parcel.CertificateID != "" {
			data, err := ctx.GetStub().GetState(parcel.CertificateID)
			if err != nil {
				return fmt.Errorf("lỗi khi truy vấn GCN %s: %v", parcel.CertificateID, err)
			}
			var cert LandCertificate
			if err := json.Unmarshal(data, &cert); err != nil {
				return fmt.Errorf("lỗi khi giải mã GCN: %v", err)
			}
			cert.OwnerID = tx.ToOwnerID
			cert.UpdatedAt = txTime
			certJSON, err := json.Marshal(cert)
			if err != nil {
				return fmt.Errorf("lỗi khi mã hóa GCN: %v", err)
			}
			if err := ctx.GetStub().PutState(parcel.CertificateID, certJSON); err != nil {
				return fmt.Errorf("lỗi khi cập nhật GCN: %v", err)
			}
		}

	case "SPLIT":
		if err := ctx.GetStub().DelState(tx.LandParcelID); err != nil {
			return fmt.Errorf("lỗi khi xóa thửa đất gốc %s: %v", tx.LandParcelID, err)
		}

	case "MERGE":
		parcelIDs := strings.Split(strings.TrimPrefix(strings.Split(tx.Details, "thành")[0], "Hợp nhất các thửa đất "), ",")
		for _, parcelID := range parcelIDs {
			parcelID = strings.TrimSpace(parcelID)
			if err := ctx.GetStub().DelState(parcelID); err != nil {
				return fmt.Errorf("lỗi khi xóa thửa đất gốc %s: %v", parcelID, err)
			}
		}

	case "CHANGE_PURPOSE":
		data, err := ctx.GetStub().GetState(tx.LandParcelID)
		if err != nil {
			return fmt.Errorf("lỗi khi truy vấn thửa đất %s: %v", tx.LandParcelID, err)
		}
		var parcel LandParcel
		if err := json.Unmarshal(data, &parcel); err != nil {
			return fmt.Errorf("lỗi khi giải mã thửa đất: %v", err)
		}
		newPurpose := strings.Split(strings.Split(tx.Details, "sang ")[1], ":")[0]
		if err := ValidateLandUsePurpose(newPurpose); err != nil {
			return err
		}
		parcel.LandUsePurpose = newPurpose
		parcel.UpdatedAt = txTime
		parcelJSON, err := json.Marshal(parcel)
		if err != nil {
			return fmt.Errorf("lỗi khi mã hóa thửa đất: %v", err)
		}
		if err := ctx.GetStub().PutState(tx.LandParcelID, parcelJSON); err != nil {
			return fmt.Errorf("lỗi khi cập nhật thửa đất: %v", err)
		}
	}

	txJSON, err := json.Marshal(tx)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa giao dịch: %v", err)
	}

	if err := ctx.GetStub().PutState(txID, txJSON); err != nil {
		return fmt.Errorf("lỗi khi cập nhật giao dịch: %v", err)
	}

	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "APPROVE_TRANSACTION", userID, fmt.Sprintf("Phê duyệt hồ sơ %s", txID))
}

// RejectTransaction từ chối hồ sơ (UC-24, Org1 only)
func (s *LandRegistryChaincode) RejectTransaction(ctx contractapi.TransactionContextInterface, txID, rejectDetails string) error {
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
	if tx.Status != "FORWARDED" {
		return fmt.Errorf("giao dịch %s không ở trạng thái FORWARDED", txID)
	}

	tx.Status = "REJECTED"
	tx.Details = fmt.Sprintf("%s; Từ chối: %s", tx.Details, rejectDetails)
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

	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "REJECT_TRANSACTION", userID, fmt.Sprintf("Từ chối hồ sơ %s", txID))
}
