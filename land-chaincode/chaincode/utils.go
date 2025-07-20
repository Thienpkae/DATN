package chaincode

import (
	"encoding/json"
	"fmt"
	"regexp"
	"time"

	"github.com/hyperledger/fabric-chaincode-go/pkg/cid"
	"github.com/hyperledger/fabric-chaincode-go/pkg/statebased"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// Danh mục hợp lệ theo pháp luật Việt Nam
var validLandUsePurposes = map[string]bool{
	"Đất ở":                   true,
	"Đất nông nghiệp":         true,
	"Đất lâm nghiệp":          true,
	"Đất phi nông nghiệp":     true,
	"Đất chưa sử dụng":        true,
	"Đất sản xuất kinh doanh": true,
	"Đất công cộng":           true,
}

var validLegalStatuses = map[string]bool{
	"Có giấy chứng nhận":      true,
	"Chưa có giấy chứng nhận": true,
	"Đang tranh chấp":         true,
	"Đang thế chấp":           true,
	"Không đủ điều kiện cấp":  true,
}

// requiredDocuments định nghĩa danh sách tài liệu bắt buộc theo loại giao dịch
var requiredDocuments = map[string][]string{
	"TRANSFER": {
		"Giấy chứng nhận quyền sử dụng đất",
		"Hợp đồng chuyển nhượng (công chứng)",
		"Giấy tờ nhân thân (CCCD/CMND)",
	},
	"SPLIT": {
		"Giấy chứng nhận quyền sử dụng đất",
		"Sơ đồ thửa đất",
		"Đơn đề nghị tách thửa",
	},
	"MERGE": {
		"Giấy chứng nhận quyền sử dụng đất",
		"Sơ đồ thửa đất",
		"Đơn đề nghị hợp thửa",
	},
	"CHANGE_PURPOSE": {
		"Giấy chứng nhận quyền sử dụng đất",
		"Đơn đề nghị thay đổi mục đích sử dụng",
	},
	"REISSUE": {
		"Giấy chứng nhận quyền sử dụng đất (bản gốc, nếu có)",
		"Đơn đề nghị cấp lại giấy chứng nhận",
		"Giấy tờ nhân thân (CCCD/CMND)",
	},
}

// ValidateIPFSHash kiểm tra định dạng hash IPFS
func ValidateIPFSHash(hash string) error {
	if len(hash) != 46 && len(hash) != 59 { // CIDv0 (46) hoặc CIDv1 (59)
		return fmt.Errorf("hash IPFS %s không hợp lệ: độ dài không đúng", hash)
	}
	if matched, _ := regexp.MatchString(`^Qm[1-9A-Za-z]{44}$|^bafy[0-9A-Za-z]+`, hash); !matched {
		return fmt.Errorf("hash IPFS %s không đúng định dạng", hash)
	}
	return nil
}

// GetTxTimestampAsTime lấy timestamp của transaction và chuyển đổi thành time.Time
func GetTxTimestampAsTime(ctx contractapi.TransactionContextInterface) (time.Time, error) {
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return time.Time{}, fmt.Errorf("không thể lấy timestamp của transaction: %v", err)
	}

	// Chuyển đổi từ protobuf timestamp sang time.Time
	return time.Unix(txTimestamp.Seconds, int64(txTimestamp.Nanos)), nil
}

// ValidateLandParcel kiểm tra tính hợp lệ của thửa đất
func ValidateLandParcel(ctx contractapi.TransactionContextInterface, parcel LandParcel) error {
	if parcel.ID == "" {
		return fmt.Errorf("ID thửa đất không được để trống")
	}
	if parcel.Area <= 0 {
		return fmt.Errorf("diện tích thửa đất phải lớn hơn 0")
	}
	if parcel.OwnerID == "" {
		return fmt.Errorf("CCCD chủ sở hữu không được để trống")
	}
	if parcel.Location == "" {
		return fmt.Errorf("vị trí thửa đất không được để trống")
	}
	if !validLandUsePurposes[parcel.LandUsePurpose] {
		return fmt.Errorf("mục đích sử dụng đất %s không hợp lệ", parcel.LandUsePurpose)
	}
	if !validLegalStatuses[parcel.LegalStatus] {
		return fmt.Errorf("trạng thái pháp lý %s không hợp lệ", parcel.LegalStatus)
	}

	exists, err := CheckLandParcelExists(ctx, parcel.ID)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("thửa đất %s đã tồn tại", parcel.ID)
	}

	return nil
}

// ValidateLandUsePurpose kiểm tra mục đích sử dụng đất
func ValidateLandUsePurpose(purpose string) error {
	if !validLandUsePurposes[purpose] {
		return fmt.Errorf("mục đích sử dụng đất %s không hợp lệ", purpose)
	}
	return nil
}

// VerifyLandParcelOwnership kiểm tra quyền sở hữu thửa đất
func VerifyLandParcelOwnership(ctx contractapi.TransactionContextInterface, parcelID, ownerID string) error {
	exists, err := CheckLandParcelExists(ctx, parcelID)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("thửa đất %s không tồn tại", parcelID)
	}

	data, err := ctx.GetStub().GetState(parcelID)
	if err != nil {
		return fmt.Errorf("lỗi khi truy vấn thửa đất %s: %v", parcelID, err)
	}
	var parcel LandParcel
	if err := json.Unmarshal(data, &parcel); err != nil {
		return fmt.Errorf("lỗi khi giải mã thửa đất %s: %v", parcelID, err)
	}
	if parcel.OwnerID != ownerID {
		return fmt.Errorf("người dùng %s không sở hữu thửa đất %s", ownerID, parcelID)
	}
	return nil
}

// VerifyLandParcelLegalStatus kiểm tra trạng thái pháp lý của thửa đất
func VerifyLandParcelLegalStatus(ctx contractapi.TransactionContextInterface, parcelID string, restrictedStatuses []string) error {
	data, err := ctx.GetStub().GetState(parcelID)
	if err != nil {
		return fmt.Errorf("lỗi khi truy vấn thửa đất %s: %v", parcelID, err)
	}
	var parcel LandParcel
	if err := json.Unmarshal(data, &parcel); err != nil {
		return fmt.Errorf("lỗi khi giải mã thửa đất %s: %v", parcelID, err)
	}
	for _, status := range restrictedStatuses {
		if parcel.LegalStatus == status {
			return fmt.Errorf("thửa đất %s không đủ điều kiện do trạng thái pháp lý: %s", parcelID, status)
		}
	}
	return nil
}

// CheckRequiredDocuments kiểm tra tài liệu bắt buộc theo loại giao dịch
func CheckRequiredDocuments(ctx contractapi.TransactionContextInterface, txID, txType string) ([]string, error) {
	requiredDocs, exists := requiredDocuments[txType]
	if !exists {
		return nil, fmt.Errorf("loại giao dịch %s không hợp lệ", txType)
	}

	queryString := fmt.Sprintf(`{"selector":{"txId":"%s"}}`, txID)
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi kiểm tra tài liệu cho giao dịch %s: %v", txID, err)
	}
	defer resultsIterator.Close()

	foundDocs := make(map[string]bool)
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, fmt.Errorf("lỗi khi duyệt tài liệu: %v", err)
		}
		var doc Document
		if err := json.Unmarshal(queryResponse.Value, &doc); err != nil {
			return nil, fmt.Errorf("lỗi khi giải mã tài liệu: %v", err)
		}
		foundDocs[doc.Description] = true
	}

	var missingDocs []string
	for _, requiredDoc := range requiredDocs {
		if !foundDocs[requiredDoc] {
			missingDocs = append(missingDocs, requiredDoc)
		}
	}
	return missingDocs, nil
}

// GetTransaction lấy và giải mã giao dịch từ ledger
func GetTransaction(ctx contractapi.TransactionContextInterface, txID string) (LandTransaction, error) {
	exists, err := CheckTransactionExists(ctx, txID)
	if err != nil {
		return LandTransaction{}, err
	}
	if !exists {
		return LandTransaction{}, fmt.Errorf("giao dịch %s không tồn tại", txID)
	}

	data, err := ctx.GetStub().GetState(txID)
	if err != nil {
		return LandTransaction{}, fmt.Errorf("lỗi khi truy vấn giao dịch %s: %v", txID, err)
	}
	var tx LandTransaction
	if err := json.Unmarshal(data, &tx); err != nil {
		return LandTransaction{}, fmt.Errorf("lỗi khi giải mã giao dịch %s: %v", txID, err)
	}
	return tx, nil
}

// CheckLandParcelExists kiểm tra sự tồn tại của thửa đất
func CheckLandParcelExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	data, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, fmt.Errorf("lỗi khi kiểm tra thửa đất %s: %v", id, err)
	}
	return data != nil, nil
}

// CheckCertificateExists kiểm tra sự tồn tại của giấy chứng nhận
func CheckCertificateExists(ctx contractapi.TransactionContextInterface, certificateID string) (bool, error) {
	data, err := ctx.GetStub().GetState(certificateID)
	if err != nil {
		return false, fmt.Errorf("lỗi khi kiểm tra GCN %s: %v", certificateID, err)
	}
	if data == nil {
		return false, nil
	}
	return true, nil
}

// CheckTransactionExists kiểm tra sự tồn tại của giao dịch
func CheckTransactionExists(ctx contractapi.TransactionContextInterface, txID string) (bool, error) {
	data, err := ctx.GetStub().GetState(txID)
	if err != nil {
		return false, fmt.Errorf("lỗi khi kiểm tra giao dịch %s: %v", txID, err)
	}
	return data != nil, nil
}

// ValidateSignature kiểm tra chữ ký số (giả lập tích hợp với hệ thống chữ ký số quốc gia)
func ValidateSignature(ctx contractapi.TransactionContextInterface, signature, userID string) (bool, error) {
	// Giả lập kiểm tra chữ ký số theo Quyết định 28/2018/QĐ-TTg
	if signature == "" {
		return false, fmt.Errorf("chữ ký số không được để trống")
	}
	// Ở đây có thể tích hợp API chữ ký số quốc gia
	return true, nil
}

// GetCallerID lấy ID của người gọi từ transaction context
func GetCallerID(ctx contractapi.TransactionContextInterface) (string, error) {
	clientID, err := cid.GetID(ctx.GetStub())
	if err != nil {
		return "", fmt.Errorf("lỗi khi lấy ID người gọi: %v", err)
	}
	return clientID, nil
}

// GetCallerOrgMSP lấy MSP ID của tổ chức người gọi
func GetCallerOrgMSP(ctx contractapi.TransactionContextInterface) (string, error) {
	clientIdentity, err := cid.New(ctx.GetStub())
	if err != nil {
		return "", fmt.Errorf("lỗi khi khởi tạo client identity: %v", err)
	}

	mspID, err := clientIdentity.GetMSPID()
	if err != nil {
		return "", fmt.Errorf("lỗi khi lấy MSP ID: %v", err)
	}

	return mspID, nil
}

// RecordTransactionLog ghi nhật ký giao dịch
func RecordTransactionLog(ctx contractapi.TransactionContextInterface, txID, action, userID, details string) error {
	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}

	log := TransactionLog{
		TxID:      txID,
		Action:    action,
		UserID:    userID,
		Timestamp: txTime,
		Details:   details,
	}

	logJSON, err := json.Marshal(log)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa nhật ký giao dịch: %v", err)
	}

	logID := fmt.Sprintf("LOG_%s_%s", txID, action)
	if err := ctx.GetStub().PutState(logID, logJSON); err != nil {
		return fmt.Errorf("lỗi khi lưu nhật ký giao dịch %s: %v", logID, err)
	}
	return nil
}

// CheckOrganization kiểm tra quyền truy cập dựa trên tổ chức
func CheckOrganization(ctx contractapi.TransactionContextInterface, allowedOrgs []string) error {
	// Tạo client identity để lấy thông tin tổ chức
	clientIdentity, err := cid.New(ctx.GetStub())
	if err != nil {
		return fmt.Errorf("lỗi khi khởi tạo client identity: %v", err)
	}

	// Lấy MSP ID của người gọi
	mspID, err := clientIdentity.GetMSPID()
	if err != nil {
		return fmt.Errorf("lỗi khi lấy MSP ID: %v", err)
	}

	// Kiểm tra xem MSP ID có trong danh sách được phép không
	for _, allowedOrg := range allowedOrgs {
		if mspID == allowedOrg {
			return nil
		}
	}

	return fmt.Errorf("tổ chức %s không có quyền thực hiện hành động này", mspID)
}

// parseFloat chuyển đổi chuỗi thành float64
func parseFloat(s string) (float64, error) {
	var f float64
	_, err := fmt.Sscanf(s, "%f", &f)
	return f, err
}

// setAssetStateBasedEndorsement thiết lập chính sách chứng thực cấp khóa cho một trạng thái
func setAssetStateBasedEndorsement(ctx contractapi.TransactionContextInterface, stateID string, orgsToEndorse ...string) error {
	endorsementPolicy, err := statebased.NewStateEP(nil)
	if err != nil {
		return fmt.Errorf("failed to create new state-based endorsement policy: %v", err)
	}

	for _, org := range orgsToEndorse {
		err = endorsementPolicy.AddOrgs(statebased.RoleTypePeer, org)
		if err != nil {
			return fmt.Errorf("failed to add org %s to endorsement policy: %v", org, err)
		}
	}

	policy, err := endorsementPolicy.Policy()
	if err != nil {
		return fmt.Errorf("failed to create endorsement policy bytes: %v", err)
	}

	err = ctx.GetStub().SetStateValidationParameter(stateID, policy)
	if err != nil {
		return fmt.Errorf("failed to set validation parameter for state %s: %v", stateID, err)
	}

	return nil
}

// addAssetStateBasedEndorsement thêm một tổ chức mới vào chính sách chứng thực cấp khóa hiện có
func addAssetStateBasedEndorsement(ctx contractapi.TransactionContextInterface, stateID string, orgToEndorse string) error {
	endorsementPolicyBytes, err := ctx.GetStub().GetStateValidationParameter(stateID)
	if err != nil {
		return fmt.Errorf("failed to get existing endorsement policy for state %s: %v", stateID, err)
	}

	newEndorsementPolicy, err := statebased.NewStateEP(endorsementPolicyBytes)
	if err != nil {
		return fmt.Errorf("failed to create new state-based endorsement policy from existing: %v", err)
	}

	err = newEndorsementPolicy.AddOrgs(statebased.RoleTypePeer, orgToEndorse)
	if err != nil {
		return fmt.Errorf("failed to add org %s to endorsement policy: %v", orgToEndorse, err)
	}

	policy, err := newEndorsementPolicy.Policy()
	if err != nil {
		return fmt.Errorf("failed to create endorsement policy bytes: %v", err)
	}

	err = ctx.GetStub().SetStateValidationParameter(stateID, policy)
	if err != nil {
		return fmt.Errorf("failed to set validation parameter for state %s: %v", stateID, err)
	}

	return nil
}
