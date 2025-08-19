package chaincode

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/hyperledger/fabric-chaincode-go/pkg/cid"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

var validLandUsePurposes = map[string]bool{
	"BHK": true, // Đất bằng trồng cây hàng năm khác
	"DTL": true, // Đất thủy lợi
	"LUC": true, // Đất chuyên trồng lúa nước
	"DGT": true, // Đất giao thông
	"LNQ": true, // Đất trồng cây lâu năm khác
	"ONT": true, // Đất ở tại nông thôn
	"SKC": true, // Đất khu công nghiệp
}

var validLegalStatuses = map[string]bool{
	"HNK":  true, // Đất trồng cây hàng năm khác
	"LUA":  true, // Đất lúa nước còn lại
	"ONT*": true, // Đất ở tại nông thôn
	"CLN":  true, // Đất trồng cây lâu năm
}

var requiredDocuments = map[string][]string{
	"TRANSFER":       {"Hợp đồng chuyển nhượng", "Giấy chứng nhận QSDĐ", "Giấy tờ tùy thân"},
	"SPLIT":          {"Đơn xin tách thửa", "Giấy chứng nhận QSDĐ", "Sơ đồ thửa đất"},
	"MERGE":          {"Đơn xin hợp thửa", "Giấy chứng nhận QSDĐ", "Sơ đồ thửa đất"},
	"CHANGE_PURPOSE": {"Đơn xin thay đổi mục đích sử dụng đất", "Giấy chứng nhận QSDĐ"},
	"REISSUE":        {"Đơn xin cấp lại GCN", "Giấy tờ tùy thân"},
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

// GetTxTimestampAsTime lấy timestamp của transaction và chuyển đổi thành time.Time ở múi giờ Việt Nam (+07:00)
func GetTxTimestampAsTime(ctx contractapi.TransactionContextInterface) (time.Time, error) {
	timestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return time.Time{}, fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}
	loc, err := time.LoadLocation("Asia/Ho_Chi_Minh")
	if err != nil {
		return time.Time{}, fmt.Errorf("lỗi khi tải múi giờ: %v", err)
	}
	return time.Unix(timestamp.Seconds, int64(timestamp.Nanos)).In(loc), nil
}

// ValidateLand kiểm tra tính hợp lệ của thửa đất
func ValidateLand(ctx contractapi.TransactionContextInterface, land Land, isUpdate bool) error {
	if land.ID == "" {
		return fmt.Errorf("ID thửa đất không được để trống")
	}
	if land.Area <= 0 {
		return fmt.Errorf("diện tích thửa đất phải lớn hơn 0")
	}
	if land.OwnerID == "" {
		return fmt.Errorf("CCCD chủ sở hữu không được để trống")
	}
	if land.Location == "" {
		return fmt.Errorf("vị trí thửa đất không được để trống")
	}
	if !validLandUsePurposes[land.LandUsePurpose] {
		return fmt.Errorf("mục đích sử dụng đất %s không hợp lệ", land.LandUsePurpose)
	}
	if !validLegalStatuses[land.LegalStatus] {
		return fmt.Errorf("trạng thái pháp lý %s không hợp lệ", land.LegalStatus)
	}

	// Validate IPFS documents if any
	for _, docID := range land.DocumentIDs {
		// Get document to validate IPFS hash
		doc, err := GetDocument(ctx, docID)
		if err != nil {
			// Skip validation if document doesn't exist
			continue
		}
		if doc.IPFSHash != "" {
			if err := ValidateIPFSHash(doc.IPFSHash); err != nil {
				return fmt.Errorf("hash IPFS không hợp lệ: %v", err)
			}
		}
	}

	exists, err := CheckLandExists(ctx, land.ID)
	if err != nil {
		return err
	}
	if isUpdate {
		if !exists {
			return fmt.Errorf("thửa đất %s không tồn tại", land.ID)
		}
	} else {
		if exists {
			return fmt.Errorf("thửa đất %s đã tồn tại", land.ID)
		}
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

// VerifyLandOwnership kiểm tra quyền sở hữu thửa đất
func VerifyLandOwnership(ctx contractapi.TransactionContextInterface, landID, ownerID string) error {
	data, err := ctx.GetStub().GetState(landID)
	if err != nil {
		return fmt.Errorf("lỗi khi kiểm tra thửa đất %s: %v", landID, err)
	}
	if data == nil {
		return fmt.Errorf("thửa đất %s không tồn tại", landID)
	}
	var land Land
	if err := json.Unmarshal(data, &land); err != nil {
		return fmt.Errorf("lỗi khi giải mã thửa đất: %v", err)
	}
	if land.OwnerID != ownerID {
		return fmt.Errorf("người dùng %s không sở hữu thửa đất %s", ownerID, landID)
	}
	return nil
}

// VerifyLandLegalStatus kiểm tra trạng thái pháp lý của thửa đất
func VerifyLandLegalStatus(ctx contractapi.TransactionContextInterface, landID string, restrictedStatuses []string) error {
	data, err := ctx.GetStub().GetState(landID)
	if err != nil {
		return fmt.Errorf("lỗi khi kiểm tra thửa đất %s: %v", landID, err)
	}
	if data == nil {
		return fmt.Errorf("thửa đất %s không tồn tại", landID)
	}
	var land Land
	if err := json.Unmarshal(data, &land); err != nil {
		return fmt.Errorf("lỗi khi giải mã thửa đất: %v", err)
	}
	for _, status := range restrictedStatuses {
		if land.LegalStatus == status {
			return fmt.Errorf("thửa đất %s đang ở trạng thái %s", landID, status)
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

	// Get transaction to check its documents
	tx, err := GetTransaction(ctx, txID)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi truy vấn giao dịch %s: %v", txID, err)
	}

	// Nếu không có tài liệu nào được tải lên
	if len(tx.DocumentIDs) == 0 {
		return requiredDocs, nil
	}

	// Tạo query để tìm metadata của các tài liệu
	var foundDocTypes []string
	for _, docID := range tx.DocumentIDs {
		if docID == "" {
			continue
		}

		// Get document to check IPFS hash
		doc, err := GetDocument(ctx, docID)
		if err != nil {
			continue
		}

		hash := doc.IPFSHash
		if hash == "" {
			continue
		}

		// Query để tìm document metadata theo hash
		queryString := fmt.Sprintf(`{
			"selector": {
				"hash": "%s",
				"txId": "%s"
			}
		}`, hash, txID)

		resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
		if err != nil {
			// Nếu không tìm thấy metadata, bỏ qua hash này
			continue
		}
		defer resultsIterator.Close()

		for resultsIterator.HasNext() {
			queryResponse, err := resultsIterator.Next()
			if err != nil {
				continue
			}

			var docData map[string]interface{}
			if err := json.Unmarshal(queryResponse.Value, &docData); err != nil {
				continue
			}

			// Kiểm tra xem có trường description hoặc name không
			description := ""
			if desc, ok := docData["description"].(string); ok {
				description = desc
			} else if name, ok := docData["name"].(string); ok {
				description = name
			} else if docType, ok := docData["type"].(string); ok {
				description = docType
			}

			if description != "" {
				foundDocTypes = append(foundDocTypes, description)
			}
		}
	}

	// Nếu không tìm thấy metadata, sử dụng logic đơn giản
	if len(foundDocTypes) == 0 {
		// Giả định rằng số lượng tài liệu tải lên tương ứng với yêu cầu
		if len(tx.DocumentIDs) >= len(requiredDocs) {
			return []string{}, nil // Đủ tài liệu
		}
		return requiredDocs, nil // Thiếu tài liệu
	}

	// Kiểm tra từng loại tài liệu bắt buộc
	var missingDocs []string
	for _, requiredDoc := range requiredDocs {
		found := false

		for _, foundDoc := range foundDocTypes {
			// So sánh không phân biệt hoa thường và bỏ qua khoảng trắng
			if matchDocument(requiredDoc, foundDoc) {
				found = true
				break
			}
		}

		if !found {
			missingDocs = append(missingDocs, requiredDoc)
		}
	}

	return missingDocs, nil
}

// matchDocument kiểm tra xem tài liệu có khớp với yêu cầu không
func matchDocument(required, found string) bool {
	// Chuẩn hóa chuỗi: chuyển thành chữ thường và loại bỏ khoảng trắng
	normalizeString := func(s string) string {
		return strings.ToLower(strings.TrimSpace(s))
	}

	requiredNorm := normalizeString(required)
	foundNorm := normalizeString(found)

	// Kiểm tra khớp chính xác
	if requiredNorm == foundNorm {
		return true
	}

	// Kiểm tra chứa từ khóa chính
	keywords := map[string][]string{
		"hợp đồng chuyển nhượng":                {"hợp đồng", "chuyển nhượng", "hop dong", "chuyen nhuong"},
		"giấy chứng nhận qsdđ":                  {"giấy chứng nhận", "gcn", "chứng nhận", "quyền sử dụng", "certificate"},
		"giấy tờ tùy thân":                      {"cccd", "cmnd", "tùy thân", "căn cước", "chứng minh"},
		"đơn xin tách thửa":                     {"đơn", "tách", "thửa", "application", "split"},
		"sơ đồ thửa đất":                        {"sơ đồ", "bản vẽ", "survey", "diagram"},
		"đơn xin hợp thửa":                      {"hợp", "gộp", "merge", "nhập"},
		"đơn xin thay đổi mục đích sử dụng đất": {"thay đổi", "mục đích", "chuyển đổi", "change"},
		"đơn xin cấp lại gcn":                   {"cấp lại", "tái cấp", "reissue"},
	}

	// Tìm từ khóa tương ứng với tài liệu yêu cầu
	var matchKeywords []string
	for key, words := range keywords {
		if strings.Contains(requiredNorm, key) || strings.Contains(key, requiredNorm) {
			matchKeywords = words
			break
		}
	}

	// Kiểm tra xem tài liệu tìm thấy có chứa từ khóa không
	if len(matchKeywords) > 0 {
		for _, keyword := range matchKeywords {
			if strings.Contains(foundNorm, keyword) {
				return true
			}
		}
	}

	// Kiểm tra từ khóa chung
	commonKeywords := []string{"đơn", "giấy", "chứng nhận", "hợp đồng", "sơ đồ"}
	requiredHasCommon := false
	foundHasCommon := false

	for _, keyword := range commonKeywords {
		if strings.Contains(requiredNorm, keyword) {
			requiredHasCommon = true
		}
		if strings.Contains(foundNorm, keyword) {
			foundHasCommon = true
		}
	}

	// Nếu cả hai đều có từ khóa chung và có độ tương đồng cao
	if requiredHasCommon && foundHasCommon {
		return calculateSimilarity(requiredNorm, foundNorm) > 0.6
	}

	return false
}

// calculateSimilarity tính độ tương đồng giữa hai chuỗi
func calculateSimilarity(s1, s2 string) float64 {
	if s1 == s2 {
		return 1.0
	}

	words1 := strings.Fields(s1)
	words2 := strings.Fields(s2)

	if len(words1) == 0 || len(words2) == 0 {
		return 0.0
	}

	commonWords := 0
	for _, w1 := range words1 {
		for _, w2 := range words2 {
			if w1 == w2 {
				commonWords++
				break
			}
		}
	}

	// Jaccard similarity
	totalWords := len(words1) + len(words2) - commonWords
	if totalWords == 0 {
		return 0.0
	}

	return float64(commonWords) / float64(totalWords)
}

// GetTransaction lấy và giải mã giao dịch từ ledger
func GetTransaction(ctx contractapi.TransactionContextInterface, txID string) (*Transaction, error) {
	data, err := ctx.GetStub().GetState(txID)
	if err != nil {
		return nil, fmt.Errorf("lỗi khi truy vấn giao dịch %s: %v", txID, err)
	}
	if data == nil {
		return nil, fmt.Errorf("giao dịch %s không tồn tại", txID)
	}
	var tx Transaction
	if err := json.Unmarshal(data, &tx); err != nil {
		return nil, fmt.Errorf("lỗi khi giải mã giao dịch: %v", err)
	}
	return &tx, nil
}

// GetDocument lấy và giải mã tài liệu từ ledger (phiên bản đơn giản cho utils)
func GetDocument(ctx contractapi.TransactionContextInterface, docID string) (*Document, error) {
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
	return &doc, nil
}

// CheckLandExists kiểm tra sự tồn tại của thửa đất
func CheckLandExists(ctx contractapi.TransactionContextInterface, landID string) (bool, error) {
	data, err := ctx.GetStub().GetState(landID)
	if err != nil {
		return false, fmt.Errorf("lỗi khi kiểm tra thửa đất %s: %v", landID, err)
	}
	return data != nil, nil
}

// CheckTransactionExists kiểm tra sự tồn tại của giao dịch
func CheckTransactionExists(ctx contractapi.TransactionContextInterface, txID string) (bool, error) {
	data, err := ctx.GetStub().GetState(txID)
	if err != nil {
		return false, fmt.Errorf("lỗi khi kiểm tra giao dịch %s: %v", txID, err)
	}
	return data != nil, nil
}

// GetCallerID lấy CCCD của người gọi từ certificate attributes
func GetCallerID(ctx contractapi.TransactionContextInterface) (string, error) {
	// Thử lấy CCCD từ certificate attributes trước
	cccd, found, err := cid.GetAttributeValue(ctx.GetStub(), "cccd")
	if err == nil && found {
		return cccd, nil
	}

	// Nếu không tìm thấy attribute, thử parse từ certificate ID
	clientID, err := cid.GetID(ctx.GetStub())
	if err != nil {
		return "", fmt.Errorf("lỗi khi lấy ID người gọi: %v", err)
	}

	// Decode base64 certificate ID
	certBytes, err := base64.StdEncoding.DecodeString(clientID)
	if err != nil {
		return "", fmt.Errorf("lỗi khi decode certificate ID: %v", err)
	}

	// Parse certificate ID để lấy CCCD
	certIDStr := string(certBytes)

	// Certificate ID có format: x509::CN=CCCD,OU=org+OU=client+OU=department1::CN=fabric-ca-server,OU=Fabric,O=Hyperledger,ST=North Carolina,C=US
	// Tìm phần CN=CCCD
	if strings.Contains(certIDStr, "CN=") {
		parts := strings.Split(certIDStr, "::")
		if len(parts) >= 2 {
			cnPart := parts[1] // Lấy phần CN=CCCD,OU=...
			cnFields := strings.Split(cnPart, ",")
			for _, field := range cnFields {
				if strings.HasPrefix(field, "CN=") {
					cccd := strings.TrimPrefix(field, "CN=")
					// Kiểm tra xem có phải CCCD hợp lệ không (12 số)
					if len(cccd) == 12 && isNumeric(cccd) {
						return cccd, nil
					}
				}
			}
		}
	}

	return "", fmt.Errorf("không thể tìm thấy CCCD trong certificate")
}

// isNumeric kiểm tra xem chuỗi có phải toàn số không
func isNumeric(s string) bool {
	for _, c := range s {
		if c < '0' || c > '9' {
			return false
		}
	}
	return true
}

// GetCallerOrgMSP lấy MSP ID của tổ chức người gọi
func GetCallerOrgMSP(ctx contractapi.TransactionContextInterface) (string, error) {
	mspID, err := cid.GetMSPID(ctx.GetStub())
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

	// Create a transaction log entry
	logTx := Transaction{
		TxID:      fmt.Sprintf("LOG_%s_%s_%d", txID, action, txTime.UnixNano()),
		Type:      "LOG",
		UserID:    userID,
		Action:    action,
		Details:   details,
		CreatedAt: txTime,
		UpdatedAt: txTime,
	}

	logJSON, err := json.Marshal(logTx)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa nhật ký giao dịch: %v", err)
	}
	if err := ctx.GetStub().PutState(logTx.TxID, logJSON); err != nil {
		return fmt.Errorf("lỗi khi lưu nhật ký giao dịch %s: %v", logTx.TxID, err)
	}
	return nil
}

// CheckOrganization kiểm tra quyền truy cập dựa trên tổ chức
func CheckOrganization(ctx contractapi.TransactionContextInterface, allowedOrgs []string) error {
	mspID, err := GetCallerOrgMSP(ctx)
	if err != nil {
		return err
	}
	for _, org := range allowedOrgs {
		if mspID == org {
			return nil
		}
	}
	return fmt.Errorf("tổ chức %s không được phép thực hiện hành động này", mspID)
}

// parseFloat chuyển đổi chuỗi thành float64
func parseFloat(s string) (float64, error) {
	var f float64
	_, err := fmt.Sscanf(s, "%f", &f)
	if err != nil {
		return 0, fmt.Errorf("lỗi khi chuyển đổi chuỗi %s sang số thực: %v", s, err)
	}
	return f, nil
}
