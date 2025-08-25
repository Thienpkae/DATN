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

	// Gọi hàm khởi tạo dữ liệu trực tiếp (bỏ qua kiểm tra tổ chức)
	err := s.initLandDataInternal(ctx)
	if err != nil {
		fmt.Printf("❌ Lỗi khi khởi tạo dữ liệu thửa đất: %v\n", err)
		return fmt.Errorf("lỗi khởi tạo dữ liệu thửa đất: %v", err)
	}

	fmt.Println("✅ Khởi tạo Land Registry Chaincode thành công!")
	return nil
}

// InitLandData - Khởi tạo dữ liệu thửa đất từ dữ liệu thực tế (có kiểm tra quyền)
func (s *LandRegistryChaincode) InitLandData(ctx contractapi.TransactionContextInterface) error {
	// Chỉ cho phép Org1MSP thực hiện khởi tạo
	if err := CheckOrganization(ctx, []string{"Org1MSP"}); err != nil {
		return err
	}

	return s.initLandDataInternal(ctx)
}

// initLandDataInternal - Hàm nội bộ khởi tạo dữ liệu thửa đất (không kiểm tra quyền)
func (s *LandRegistryChaincode) initLandDataInternal(ctx contractapi.TransactionContextInterface) error {

	// Lấy timestamp
	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}

	// Dữ liệu thực tế từ bản đồ số
	landData := []struct {
		MapNumber   int
		PlotNumber  int
		OwnerName   string
		Area        float64
		LandPurpose string
		LegalArea   float64
		LegalStatus string
		Address     string
		OwnerCCCD   string
	}{
		{1, 2, "UBND xã", 57.2, "BHK", 0, "", "", "001000000022"},
		{1, 3, "UBND xã", 58.5, "BHK", 0, "", "", "001000000022"},
		{1, 4, "Ông: Bùi Văn Dậu", 193.1, "BHK", 193.1, "HNK", "Đồng Bãi Tổng, xã Đan Phượng, huyện Đan Phượng, thành phố Hà Nội", "001204037324"},
		{1, 5, "Ông: Bùi Mạnh Thắng", 135.0, "BHK", 135.0, "HNK", "Đồng Bãi Tổng, xã Đan Phượng, huyện Đan Phượng, thành phố Hà Nội", "001204037325"},
		{1, 27, "Tạ Thị Thơm", 143.1, "BHK", 143.1, "HNK", "Đồng Bãi Tổng, xã Đan Phượng, huyện Đan Phượng, thành phố Hà Nội", "001204037326"},
		{1, 28, "Bùi Văn Đệ", 213.8, "BHK", 0, "", "", "001204037327"},
		{1, 29, "UBND xã", 266.8, "DTL", 0, "", "", "001000000028"},
		{1, 57, "Ông: Nguyễn Văn Minh", 800.2, "BHK", 800.2, "HNK", "Đồng Bãi Tổng Màu, xã Đan Phượng, huyện Đan Phượng, thành phố Hà Nội", "001204037329"},
		{1, 58, "Hộ ông: Nguyễn Hữu Hợi", 1262.1, "BHK", 1262.1, "HNK", "Đồng Bãi Tổng Màu, xã Đan Phượng, huyện Đan Phượng, thành phố Hà Nội", "001204037330"},
		{1, 165, "Hộ bà: Nguyễn Thị Nhu", 402.5, "LUC", 402.5, "LUA", "Đồng Bãi Tổng, xã Đan Phượng, huyện Đan Phượng, thành phố Hà Nội", "001204037331"},
		{1, 201, "Ông: Bùi Văn Bình", 1268.2, "LUC", 1268.2, "LUA", "Đồng Khổ 7, xã Đan Phượng, huyện Đan Phượng, thành phố Hà Nội", "001204037332"},
		{2, 374, "Hộ ông: Nguyễn Hữu Thắng", 239.2, "LUC", 239.2, "LUA", "Đồng Bãi Tổng Màu, xã Đan Phượng, huyện Đan Phượng, thành phố Hà Nội", "001204037333"},
		{2, 430, "UBND xã", 540.4, "DTL", 0, "", "", "001000000034"},
		{3, 37, "Hộ bà: Nguyễn Thị Yến", 296.0, "LUC", 296.0, "LUA", "Bãi Tổng màu, xã Đan Phượng, huyện Đan Phượng, thành phố Hà Nội", "001204037335"},
		{3, 84, "UBND xã", 1362.7, "DTL", 0, "", "", "001000000036"},
		{4, 30, "UBND xã", 1993.9, "DGT", 0, "", "", "001000000037"},
		{5, 153, "Bùi Mạnh Hưng", 539.7, "LUC", 0, "", "", "001204037338"},
		{6, 71, "UBND xã", 7070.2, "DGT", 0, "", "", "001000000039"},
		{6, 76, "Nguyễn Xuân Thuỷ", 1955.0, "LNQ", 0, "", "Đồng Rằm, xã Đan Phượng, huyện Đan Phượng, thành phố Hà Nội", "001204037340"},
		{7, 27, "Hộ ông: Nguyễn Hữu Sông", 511.2, "LNQ", 0, "", "", "001204037341"},
		{7, 49, "Ông: Nguyễn Xuân Trường", 314.0, "LUC", 314.0, "LUA", "", "001204037342"},
		{8, 83, "Ông: Chu Văn Cát", 626.0, "LUC", 626.0, "LUA", "", "001204037343"},
		{8, 89, "Hộ ông: Nguyễn Đăng Sơn", 406.0, "LUC", 406.0, "LUA", "", "001204037344"},
		{9, 23, "Ông: Nguyễn Đăng Thư", 580.0, "LUC", 580.0, "LUA", "", "001204037345"},
		{10, 15, "Nguyễn Hữu Thắng", 125.2, "ONT", 0, "", "", "001204037346"},
		{10, 21, "Cty CPXK thực phẩm", 17929.2, "SKC", 0, "", "", "001204037347"},
		{10, 45, "Công ty TNHH Minh Phát", 10004.2, "SKC", 0, "", "", "001204037348"},
		{11, 3, "Hợp Tác Xã", 1200.0, "LNQ", 0, "", "", "001204037349"},
		{11, 45, "Nguyễn Văn Hữu", 2077.0, "SKC", 0, "", "", "001204037350"},
		{11, 48, "Hộ ông: Bùi Văn Nở", 80.2, "ONT", 80.2, "ONT*", "", "001204037352"},
		{11, 68, "Bà: Trần Thị Bạch Tuyết", 2302.1, "BHK", 2302.1, "HNK", "", "001204037353"},
		{12, 70, "Bà: Bùi Thị Lợi", 115.7, "ONT", 115.7, "ONT*", "", "001204037354"},
		{12, 93, "Nguyễn Mạnh Kim", 1371.0, "LNQ", 0, "", "", "001204037355"},
		{13, 343, "Hộ ông: Phạm Minh Thắng", 804.9, "BHK", 804.9, "HNK", "", "001204037356"},
		{14, 116, "Hộ ông: Chu Văn Hè", 374.9, "LUC", 374.9, "LUA", "", "001204037357"},
		{14, 453, "Ông: Chu Văn Việt", 597.8, "LUC", 597.8, "LUA", "", "001204037358"},
		{15, 81, "Phạm Văn Chung", 250.9, "LUC", 0, "", "", "001204037359"},
		{15, 437, "Nguyễn Văn Chiến", 74.1, "SKC", 0, "", "", "001204037360"},
		{16, 56, "Bùi Thị Nhâm", 83.4, "SKC", 0, "", "", "001204037361"},
		{17, 7, "Nguyễn Văn Tước", 1139.6, "LNQ", 0, "", "", "001204037362"},
		{18, 8, "Ông: Nguyễn Văn Liên", 606.5, "LUC", 606.5, "", "", "001204037363"},
		{18, 18, "Bà: Bùi Thị Lan", 663.5, "LUC", 663.5, "LUA", "", "001204037364"},
		{19, 8, "Ông: Bùi Vinh Viết", 1862.5, "LUC", 1862.5, "LUA", "", "001204037365"},
		{19, 26, "Hộ ông: Tạ Đăng Bình", 90.0, "ONT", 90.0, "ONT*", "", "001204037367"},
		{19, 280, "Bà: Tạ Thị Đậm", 500.2, "LNQ", 500.2, "CLN", "", "001204037368"},
		{20, 18, "Hộ ông: Nguyễn Văn Quảng", 108.8, "ONT", 108.8, "ONT*", "", "001204037369"},
		{20, 56, "Hộ ông: Nguyễn Hữu Bách", 106.7, "ONT", 106.7, "ONT*", "", "001204037370"},
		{20, 105, "Ông: Nguyễn Kiến Thức", 203.8, "ONT", 203.8, "ONT*", "", "001204037371"},
		{20, 177, "Ông: Nguyễn Văn Doãn", 89.0, "ONT", 89.0, "ONT*", "", "001204037372"},
		{21, 70, "Hộ bà: Nguyễn Thị Yến", 153.0, "ONT", 153.0, "ONT*", "", "001204037373"},
		{21, 85, "Bà: Nguyễn Thị Thanh", 362.9, "LUC", 362.9, "LUA", "", "001204037374"},
		{21, 198, "Hộ ông: Ngô Văn ích", 364.5, "ONT", 364.5, "ONT*", "", "001204037375"},
		{22, 47, "Bà: Bùi Thị Năm", 384.1, "LUC", 384.1, "LUA", "", "001204037376"},
		{23, 5, "Cty CP Xây Dựng Số 1", 22047.6, "SKC", 0, "", "", "001204037377"},
		{23, 13, "Cty CNHH Gia Nhất", 5018.3, "SKC", 0, "", "", "001204037378"},
	}

	var successCount, errorCount int

	for _, data := range landData {
		// Tạo LandID bằng cách kết hợp mapNumber và plotNumber
		landID := fmt.Sprintf("%d-%d", data.MapNumber, data.PlotNumber)

		// Kiểm tra xem thửa đất đã tồn tại chưa
		exists, err := CheckLandExists(ctx, landID)
		if err != nil {
			fmt.Printf("Lỗi khi kiểm tra thửa đất %s: %v\n", landID, err)
			errorCount++
			continue
		}
		if exists {
			fmt.Printf("Thửa đất %s đã tồn tại, bỏ qua\n", landID)
			continue
		}

		// Xác định địa chỉ
		location := data.Address
		if location == "" {
			location = "Xã Đan Phượng, huyện Đan Phượng, thành phố Hà Nội"
		}

		// Tạo thửa đất mới
		land := Land{
			ID:             landID,
			OwnerID:        data.OwnerCCCD,
			Area:           data.Area,
			Location:       location,
			LandUsePurpose: data.LandPurpose,
			LegalStatus:    data.LegalStatus,
			CertificateID:  "",
			LegalInfo:      "",
			DocumentIDs:    []string{},
			CreatedAt:      txTime,
			UpdatedAt:      txTime,
		}

		// Validate thửa đất
		if err := ValidateLand(ctx, land, false); err != nil {
			fmt.Printf("Thửa đất %s không hợp lệ: %v\n", landID, err)
			errorCount++
			continue
		}

		// Lưu thửa đất
		landJSON, err := json.Marshal(land)
		if err != nil {
			fmt.Printf("Lỗi khi mã hóa thửa đất %s: %v\n", landID, err)
			errorCount++
			continue
		}

		if err := ctx.GetStub().PutState(landID, landJSON); err != nil {
			fmt.Printf("Lỗi khi lưu thửa đất %s: %v\n", landID, err)
			errorCount++
			continue
		}

		successCount++
		fmt.Printf("✅ Đã tạo thửa đất %s cho %s\n", landID, data.OwnerName)
	}

	// Ghi log kết quả
	result := fmt.Sprintf("Khởi tạo hoàn thành: %d thành công, %d lỗi", successCount, errorCount)
	fmt.Println(result)

	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "INIT_LAND_DATA", "SYSTEM", result)
}

// ========================================
// LAND PARCEL MANAGEMENT FUNCTIONS
// ========================================

// CreateLandParcel - Tạo thửa đất mới
func (s *LandRegistryChaincode) CreateLandParcel(ctx contractapi.TransactionContextInterface, id, ownerID, location, landUsePurpose, legalStatus, area, certificateID, legalInfo string, userID string) error {
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

	// Validate certificate information
	if certificateID != "" && legalInfo == "" {
		return fmt.Errorf("legalInfo là bắt buộc khi có certificateID")
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
		CreatedAt:      txTime,
		UpdatedAt:      txTime,
	}

	// Set IssueDate and LegalInfo only if CertificateID is provided
	if certificateID != "" {
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
func (s *LandRegistryChaincode) UpdateLandParcel(ctx contractapi.TransactionContextInterface, id, area, location, landUsePurpose, legalStatus, certificateID, legalInfo string) error {
	if err := CheckOrganization(ctx, []string{"Org1MSP"}); err != nil {
		return err
	}
	userID, err := GetCallerID(ctx)
	if err != nil {
		return err
	}
	existingLand, err := s.QueryLandByID(ctx, id, userID)
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

	// Validate certificate information
	if certificateID != "" && legalInfo == "" {
		return fmt.Errorf("legalInfo là bắt buộc khi có certificateID")
	}

	updatedLand := Land{
		ID:             id,
		OwnerID:        existingLand.OwnerID,
		Area:           areaFloat,
		Location:       location,
		LandUsePurpose: landUsePurpose,
		LegalStatus:    legalStatus,
		DocumentIDs:    existingLand.DocumentIDs,
		CreatedAt:      existingLand.CreatedAt,
		UpdatedAt:      txTime,
	}

	// Handle certificate information updates
	if certificateID != "" {
		// Update certificate information with new IssueDate
		updatedLand.CertificateID = certificateID
		updatedLand.LegalInfo = legalInfo
		updatedLand.IssueDate = txTime
	} else {
		// Keep existing certificate information
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

// IssueLandCertificate - Cấp giấy chứng nhận quyền sử dụng đất
func (s *LandRegistryChaincode) IssueLandCertificate(ctx contractapi.TransactionContextInterface, certificateID, landParcelID, ownerID, legalInfo string) error {
	if err := CheckOrganization(ctx, []string{"Org1MSP"}); err != nil {
		return err
	}
	userID, err := GetCallerID(ctx)
	if err != nil {
		return err
	}

	// Validate certificateID as IPFS hash
	if certificateID == "" {
		return fmt.Errorf("certificateID không được để trống")
	}
	if len(certificateID) < 10 {
		return fmt.Errorf("certificateID phải là IPFS hash hợp lệ")
	}

	if err := VerifyLandLegalStatus(ctx, landParcelID, []string{"Đang tranh chấp", "Đang thế chấp"}); err != nil {
		return err
	}
	land, err := s.QueryLandByID(ctx, landParcelID, userID)
	if err != nil {
		return fmt.Errorf("lỗi khi truy vấn thửa đất %s: %v", landParcelID, err)
	}

	isInitialIssue := land.CertificateID == ""
	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}

	// Update land with certificate information (certificateID is IPFS hash)
	land.CertificateID = certificateID // IPFS hash of the certificate document
	land.IssueDate = txTime
	land.LegalInfo = legalInfo
	land.LegalStatus = "Có giấy chứng nhận"
	land.UpdatedAt = txTime

	landJSON, err := json.Marshal(land)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa thửa đất: %v", err)
	}
	if err := ctx.GetStub().PutState(landParcelID, landJSON); err != nil {
		return fmt.Errorf("lỗi khi cập nhật thửa đất: %v", err)
	}

	logAction := map[bool]string{true: "ISSUE_INITIAL_CERTIFICATE", false: "ISSUE_REISSUE_CERTIFICATE"}[isInitialIssue]
	logDetails := map[bool]string{true: "Cấp mới GCN", false: "Cấp đổi GCN"}[isInitialIssue]
	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), logAction, userID, fmt.Sprintf("%s %s (IPFS: %s) cho thửa đất %s", logDetails, certificateID, certificateID, landParcelID))
}

// ========================================
// DOCUMENT MANAGEMENT FUNCTIONS
// ========================================

// CreateDocument - Tạo tài liệu mới
func (s *LandRegistryChaincode) CreateDocument(ctx contractapi.TransactionContextInterface, docID, docType, title, description, ipfsHash, fileType string, fileSize int64, verified bool, verifiedBy string) error {
	userID, err := GetCallerID(ctx)
	if err != nil {
		return err
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
		Verified:    verified,
		VerifiedBy:  verifiedBy,
		CreatedAt:   txTime,
		UpdatedAt:   txTime,
	}

	// Set verified time if verified
	if verified {
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

	// Kiểm tra xem tài liệu đã được chứng thực chưa
	if doc.Verified {
		return fmt.Errorf("tài liệu %s đã được chứng thực", docID)
	}

	// Lấy timestamp
	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}

	// Chứng thực tài liệu
	doc.Verified = true
	doc.VerifiedBy = userID
	doc.VerifiedAt = txTime
	doc.UpdatedAt = txTime

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

	// Từ chối tài liệu
	doc.Verified = false
	doc.VerifiedBy = ""
	doc.VerifiedAt = time.Time{}
	doc.UpdatedAt = txTime
	// Thêm reason vào description
	doc.Description = doc.Description + " [REJECTED: " + reason + "]"

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

// LinkDocumentToLand - Link existing document to land parcel after verification
func (s *LandRegistryChaincode) LinkDocumentToLand(ctx contractapi.TransactionContextInterface, docID, landParcelID string) error {
	userID, err := GetCallerID(ctx)
	if err != nil {
		return err
	}
	mspID, err := GetCallerOrgMSP(ctx)
	if err != nil {
		return err
	}

	// Kiểm tra quyền sở hữu cho Org3
	if mspID == "Org3MSP" {
		if err := VerifyLandOwnership(ctx, landParcelID, userID); err != nil {
			return err
		}
	}

	// Kiểm tra tài liệu tồn tại
	doc, err := s.GetDocument(ctx, docID)
	if err != nil {
		return fmt.Errorf("không tìm thấy tài liệu %s: %v", docID, err)
	}

	// Kiểm tra quyền: chỉ owner hoặc admin có thể link document
	if mspID == "Org3MSP" && doc.UploadedBy != userID {
		return fmt.Errorf("bạn chỉ có thể link tài liệu của mình")
	}

	// Kiểm tra tài liệu đã được verify chưa (chỉ verified documents mới được link)
	if !doc.Verified {
		return fmt.Errorf("tài liệu %s chưa được xác minh, không thể link", docID)
	}

	// Kiểm tra thửa đất tồn tại
	land, err := s.QueryLandByID(ctx, landParcelID, userID)
	if err != nil {
		return fmt.Errorf("lỗi khi truy vấn thửa đất %s: %v", landParcelID, err)
	}

	// Kiểm tra xem document đã được link chưa
	for _, existingDocID := range land.DocumentIDs {
		if existingDocID == docID {
			return fmt.Errorf("tài liệu %s đã được link với thửa đất %s", docID, landParcelID)
		}
	}

	// Lấy timestamp
	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}

	// Thêm document ID vào thửa đất
	land.DocumentIDs = append(land.DocumentIDs, docID)
	land.UpdatedAt = txTime

	landJSON, err := json.Marshal(land)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa thửa đất: %v", err)
	}
	if err := ctx.GetStub().PutState(landParcelID, landJSON); err != nil {
		return fmt.Errorf("lỗi khi cập nhật thửa đất: %v", err)
	}

	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "LINK_DOCUMENT_TO_LAND", userID, fmt.Sprintf("Link tài liệu %s với thửa đất %s", doc.Title, landParcelID))
}

// LinkDocumentToTransaction - Link existing document to transaction after verification
func (s *LandRegistryChaincode) LinkDocumentToTransaction(ctx contractapi.TransactionContextInterface, docID, transactionID string) error {
	userID, err := GetCallerID(ctx)
	if err != nil {
		return err
	}
	mspID, err := GetCallerOrgMSP(ctx)
	if err != nil {
		return err
	}

	// Kiểm tra quyền truy cập giao dịch cho Org3
	if mspID == "Org3MSP" {
		tx, err := GetTransaction(ctx, transactionID)
		if err != nil {
			return fmt.Errorf("lỗi khi truy vấn giao dịch %s: %v", transactionID, err)
		}
		if tx.FromOwnerID != userID && tx.ToOwnerID != userID {
			return fmt.Errorf("người dùng %s không có quyền truy cập giao dịch %s", userID, transactionID)
		}
	}

	// Kiểm tra tài liệu tồn tại
	doc, err := s.GetDocument(ctx, docID)
	if err != nil {
		return fmt.Errorf("không tìm thấy tài liệu %s: %v", docID, err)
	}

	// Kiểm tra quyền: chỉ owner hoặc admin có thể link document
	if mspID == "Org3MSP" && doc.UploadedBy != userID {
		return fmt.Errorf("bạn chỉ có thể link tài liệu của mình")
	}

	// Kiểm tra tài liệu đã được verify chưa (chỉ verified documents mới được link)
	if !doc.Verified {
		return fmt.Errorf("tài liệu %s chưa được xác minh, không thể link", docID)
	}

	// Kiểm tra giao dịch tồn tại
	tx, err := GetTransaction(ctx, transactionID)
	if err != nil {
		return fmt.Errorf("lỗi khi truy vấn giao dịch %s: %v", transactionID, err)
	}

	// Kiểm tra xem document đã được link chưa
	for _, existingDocID := range tx.DocumentIDs {
		if existingDocID == docID {
			return fmt.Errorf("tài liệu %s đã được link với giao dịch %s", docID, transactionID)
		}
	}

	// Lấy timestamp
	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}

	// Thêm document ID vào giao dịch
	tx.DocumentIDs = append(tx.DocumentIDs, docID)
	tx.UpdatedAt = txTime

	txJSON, err := json.Marshal(tx)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa giao dịch: %v", err)
	}
	if err := ctx.GetStub().PutState(transactionID, txJSON); err != nil {
		return fmt.Errorf("lỗi khi cập nhật giao dịch: %v", err)
	}

	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "LINK_DOCUMENT_TO_TRANSACTION", userID, fmt.Sprintf("Link tài liệu %s với giao dịch %s", doc.Title, transactionID))
}

// ========================================
// TRANSACTION MANAGEMENT FUNCTIONS
// ========================================

// CreateSplitRequest - Tạo yêu cầu tách thửa
func (s *LandRegistryChaincode) CreateSplitRequest(ctx contractapi.TransactionContextInterface, txID, landParcelID, ownerID, newParcelsStr string) error {
	if err := CheckOrganization(ctx, []string{"Org3MSP"}); err != nil {
		return err
	}
	var newParcels []Land
	if err := json.Unmarshal([]byte(newParcelsStr), &newParcels); err != nil {
		return fmt.Errorf("lỗi khi giải mã danh sách thửa đất mới: %v", err)
	}
	if err := VerifyLandOwnership(ctx, landParcelID, ownerID); err != nil {
		return err
	}
	if err := VerifyLandLegalStatus(ctx, landParcelID, []string{"Đang tranh chấp", "Đang thế chấp"}); err != nil {
		return err
	}
	existingLand, err := s.QueryLandByID(ctx, landParcelID, ownerID)
	if err != nil {
		return fmt.Errorf("lỗi khi truy vấn thửa đất %s: %v", landParcelID, err)
	}
	var totalArea float64
	for _, newLand := range newParcels {
		if err := ValidateLand(ctx, newLand, false); err != nil {
			return fmt.Errorf("thửa đất mới %s không hợp lệ: %v", newLand.ID, err)
		}
		totalArea += newLand.Area
	}
	if totalArea > existingLand.Area {
		return fmt.Errorf("tổng diện tích các thửa mới (%f m²) vượt quá diện tích thửa gốc (%f m²)", totalArea, existingLand.Area)
	}
	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}
	tx := Transaction{
		TxID:         txID,
		Type:         "SPLIT",
		LandParcelID: landParcelID,
		FromOwnerID:  ownerID,
		ToOwnerID:    ownerID,
		Status:       "PENDING",
		Details:      fmt.Sprintf("Tách thửa đất %s thành %d thửa", landParcelID, len(newParcels)),
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
	for _, newLand := range newParcels {
		newLand.CreatedAt = txTime
		newLand.UpdatedAt = txTime
		newLandJSON, err := json.Marshal(newLand)
		if err != nil {
			return fmt.Errorf("lỗi khi mã hóa thửa đất mới: %v", err)
		}
		if err := ctx.GetStub().PutState(newLand.ID, newLandJSON); err != nil {
			return fmt.Errorf("lỗi khi lưu thửa đất mới %s: %v", newLand.ID, err)
		}
	}
	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "CREATE_SPLIT_REQUEST", ownerID, fmt.Sprintf("Tạo yêu cầu tách thửa %s", txID))
}

// CreateMergeRequest - Tạo yêu cầu hợp thửa
func (s *LandRegistryChaincode) CreateMergeRequest(ctx contractapi.TransactionContextInterface, txID, ownerID, parcelIDsStr, newParcelStr string) error {
	if err := CheckOrganization(ctx, []string{"Org3MSP"}); err != nil {
		return err
	}
	var parcelIDs []string
	if err := json.Unmarshal([]byte(parcelIDsStr), &parcelIDs); err != nil {
		return fmt.Errorf("lỗi khi giải mã danh sách parcelIDs: %v", err)
	}
	var newLand Land
	if err := json.Unmarshal([]byte(newParcelStr), &newLand); err != nil {
		return fmt.Errorf("lỗi khi giải mã thửa đất mới: %v", err)
	}
	var totalArea float64
	for _, parcelID := range parcelIDs {
		if err := VerifyLandOwnership(ctx, parcelID, ownerID); err != nil {
			return err
		}
		if err := VerifyLandLegalStatus(ctx, parcelID, []string{"Đang tranh chấp", "Đang thế chấp"}); err != nil {
			return err
		}
		land, err := s.QueryLandByID(ctx, parcelID, ownerID)
		if err != nil {
			return fmt.Errorf("lỗi khi truy vấn thửa đất %s: %v", parcelID, err)
		}
		totalArea += land.Area
	}
	if err := ValidateLand(ctx, newLand, false); err != nil {
		return fmt.Errorf("thửa đất mới %s không hợp lệ: %v", newLand.ID, err)
	}
	if newLand.Area != totalArea {
		return fmt.Errorf("diện tích thửa đất mới (%f m²) không khớp với tổng diện tích các thửa đất gốc (%f m²)", newLand.Area, totalArea)
	}
	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}
	tx := Transaction{
		TxID:         txID,
		Type:         "MERGE",
		LandParcelID: newLand.ID,
		ParcelIDs:    parcelIDs,
		FromOwnerID:  ownerID,
		ToOwnerID:    ownerID,
		Status:       "PENDING",
		Details:      fmt.Sprintf("Hợp nhất các thửa đất %v thành %s", parcelIDs, newLand.ID),
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
	newLand.CreatedAt = txTime
	newLand.UpdatedAt = txTime
	newLandJSON, err := json.Marshal(newLand)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa thửa đất mới: %v", err)
	}
	if err := ctx.GetStub().PutState(newLand.ID, newLandJSON); err != nil {
		return fmt.Errorf("lỗi khi lưu thửa đất mới %s: %v", newLand.ID, err)
	}
	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "CREATE_MERGE_REQUEST", ownerID, fmt.Sprintf("Tạo yêu cầu hợp thửa %s", txID))
}

// CreateTransferRequest - Tạo yêu cầu chuyển nhượng
func (s *LandRegistryChaincode) CreateTransferRequest(ctx contractapi.TransactionContextInterface, txID, landParcelID, fromOwnerID, toOwnerID string) error {
	if err := CheckOrganization(ctx, []string{"Org3MSP"}); err != nil {
		return err
	}
	if err := VerifyLandOwnership(ctx, landParcelID, fromOwnerID); err != nil {
		return err
	}
	if err := VerifyLandLegalStatus(ctx, landParcelID, []string{"Đang tranh chấp", "Đang thế chấp"}); err != nil {
		return err
	}
	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}
	tx := Transaction{
		TxID:         txID,
		Type:         "TRANSFER",
		LandParcelID: landParcelID,
		FromOwnerID:  fromOwnerID,
		ToOwnerID:    toOwnerID,
		Status:       "PENDING",
		Details:      fmt.Sprintf("Chuyển nhượng thửa đất %s từ %s sang %s", landParcelID, fromOwnerID, toOwnerID),
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

// CreateChangePurposeRequest - Tạo yêu cầu thay đổi mục đích sử dụng
func (s *LandRegistryChaincode) CreateChangePurposeRequest(ctx contractapi.TransactionContextInterface, txID, landParcelID, ownerID, newPurpose string) error {
	if err := CheckOrganization(ctx, []string{"Org3MSP"}); err != nil {
		return err
	}
	if err := VerifyLandOwnership(ctx, landParcelID, ownerID); err != nil {
		return err
	}
	if err := VerifyLandLegalStatus(ctx, landParcelID, []string{"Đang tranh chấp", "Đang thế chấp"}); err != nil {
		return err
	}
	if err := ValidateLandUsePurpose(newPurpose); err != nil {
		return err
	}
	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}
	tx := Transaction{
		TxID:         txID,
		Type:         "CHANGE_PURPOSE",
		LandParcelID: landParcelID,
		FromOwnerID:  ownerID,
		ToOwnerID:    ownerID,
		Status:       "PENDING",
		Details:      fmt.Sprintf("Thay đổi mục đích sử dụng đất %s sang %s", landParcelID, newPurpose),
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

// CreateReissueRequest - Tạo yêu cầu cấp lại giấy chứng nhận
func (s *LandRegistryChaincode) CreateReissueRequest(ctx contractapi.TransactionContextInterface, txID, landParcelID, ownerID string) error {
	if err := CheckOrganization(ctx, []string{"Org3MSP"}); err != nil {
		return err
	}
	if err := VerifyLandOwnership(ctx, landParcelID, ownerID); err != nil {
		return err
	}
	if err := VerifyLandLegalStatus(ctx, landParcelID, []string{"Đang tranh chấp", "Đang thế chấp"}); err != nil {
		return err
	}
	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}
	tx := Transaction{
		TxID:         txID,
		Type:         "REISSUE",
		LandParcelID: landParcelID,
		FromOwnerID:  ownerID,
		ToOwnerID:    ownerID,
		Status:       "PENDING",
		Details:      fmt.Sprintf("Yêu cầu cấp lại GCN cho thửa đất %s", landParcelID),
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

// ConfirmTransfer - Xác nhận chuyển nhượng (bởi người nhận)
func (s *LandRegistryChaincode) ConfirmTransfer(ctx contractapi.TransactionContextInterface, txID, landParcelID, toOwnerID string) error {
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
	if tx.Status != "APPROVED" {
		return fmt.Errorf("giao dịch %s chưa được phê duyệt", txID)
	}
	land, err := s.QueryLandByID(ctx, landParcelID, userID)
	if err != nil {
		return fmt.Errorf("lỗi khi truy vấn thửa đất %s: %v", landParcelID, err)
	}
	land.OwnerID = toOwnerID
	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}
	land.UpdatedAt = txTime
	landJSON, err := json.Marshal(land)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa thửa đất: %v", err)
	}
	if err := ctx.GetStub().PutState(landParcelID, landJSON); err != nil {
		return fmt.Errorf("lỗi khi cập nhật thửa đất: %v", err)
	}
	// Cập nhật giấy chứng nhận nếu có
	if land.CertificateID != "" {
		// Cập nhật thông tin chủ sử dụng trong land struct
		land.UpdatedAt = txTime
		landJSON, err := json.Marshal(land)
		if err != nil {
			return fmt.Errorf("lỗi khi mã hóa thửa đất: %v", err)
		}
		if err := ctx.GetStub().PutState(landParcelID, landJSON); err != nil {
			return fmt.Errorf("lỗi khi cập nhật thửa đất: %v", err)
		}
	}
	tx.Status = "CONFIRMED"
	tx.Details = fmt.Sprintf("%s; Đã xác nhận chuyển nhượng", tx.Details)
	tx.UpdatedAt = txTime
	txJSON, err := json.Marshal(tx)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa giao dịch: %v", err)
	}
	if err := ctx.GetStub().PutState(txID, txJSON); err != nil {
		return fmt.Errorf("lỗi khi cập nhật giao dịch: %v", err)
	}
	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "CONFIRM_TRANSFER", userID, fmt.Sprintf("Xác nhận chuyển nhượng %s", txID))
}

// ========================================
// TRANSACTION PROCESSING FUNCTIONS (ORG2)
// ========================================

// ProcessTransaction - Xử lý và thẩm định giao dịch (Org2)
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

// ForwardTransaction - Chuyển tiếp giao dịch lên cấp trên (Org2)
func (s *LandRegistryChaincode) ForwardTransaction(ctx contractapi.TransactionContextInterface, txID string) error {
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
	tx.Details = fmt.Sprintf("%s; Đã chuyển tiếp hồ sơ", tx.Details)
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
	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "FORWARD_TRANSACTION", userID, fmt.Sprintf("Chuyển tiếp giao dịch %s", txID))
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
	if tx.Status != "FORWARDED" {
		return fmt.Errorf("giao dịch %s không ở trạng thái FORWARDED", txID)
	}
	if tx.Type != "TRANSFER" {
		return fmt.Errorf("giao dịch %s không phải là chuyển nhượng", txID)
	}

	land, err := s.QueryLandByID(ctx, tx.LandParcelID, userID)
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
	if tx.Status != "FORWARDED" {
		return fmt.Errorf("giao dịch %s không ở trạng thái FORWARDED", txID)
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

	land, err := s.QueryLandByID(ctx, tx.LandParcelID, userID)
	if err != nil {
		return fmt.Errorf("lỗi khi truy vấn thửa đất %s: %v", tx.LandParcelID, err)
	}
	if land.OwnerID != tx.FromOwnerID {
		return fmt.Errorf("người dùng %s không sở hữu thửa đất %s", tx.FromOwnerID, tx.LandParcelID)
	}

	if err := VerifyLandLegalStatus(ctx, tx.LandParcelID, []string{"Đang tranh chấp", "Đang thế chấp"}); err != nil {
		return err
	}

	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}

	// Update land with new certificate information (newCertificateID is IPFS hash)
	oldCertificateID := land.CertificateID
	land.CertificateID = newCertificateID // IPFS hash of the new certificate document
	land.IssueDate = txTime
	land.LegalInfo = fmt.Sprintf("Cấp đổi GCN cho thửa đất %s", tx.LandParcelID)
	land.LegalStatus = "Có giấy chứng nhận"
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
	tx.Details = fmt.Sprintf("%s; Đã phê duyệt cấp đổi giấy chứng nhận với IPFS hash: %s", tx.Details, newCertificateID)
	tx.UpdatedAt = txTime
	txJSON, err := json.Marshal(tx)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa giao dịch: %v", err)
	}
	if err := ctx.GetStub().PutState(txID, txJSON); err != nil {
		return fmt.Errorf("lỗi khi cập nhật giao dịch: %v", err)
	}

	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "APPROVE_REISSUE", userID, fmt.Sprintf("Phê duyệt cấp đổi GCN từ %s sang %s (IPFS: %s) cho thửa đất %s", oldCertificateID, newCertificateID, newCertificateID, tx.LandParcelID))
}

// ApproveSplitTransaction - Phê duyệt giao dịch tách thửa và tạo các thửa đất mới
func (s *LandRegistryChaincode) ApproveSplitTransaction(ctx contractapi.TransactionContextInterface, txID string) error {
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
	if tx.Type != "SPLIT" {
		return fmt.Errorf("giao dịch %s không phải là tách thửa", txID)
	}

	// Lấy thông tin thửa đất gốc để kiểm tra
	originalLand, err := s.QueryLandByID(ctx, tx.LandParcelID, userID)
	if err != nil {
		return fmt.Errorf("lỗi khi truy vấn thửa đất %s: %v", tx.LandParcelID, err)
	}

	// Kiểm tra quyền sở hữu
	if originalLand.OwnerID != tx.FromOwnerID {
		return fmt.Errorf("người dùng %s không sở hữu thửa đất %s", tx.FromOwnerID, tx.LandParcelID)
	}

	// Tạo các thửa đất mới từ thông tin trong transaction
	// Các thửa đất mới đã được tạo trong CreateSplitRequest
	// Ở đây chỉ cần xóa thửa đất gốc và cập nhật trạng thái

	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}

	// Xóa thửa đất gốc
	if err := ctx.GetStub().DelState(tx.LandParcelID); err != nil {
		return fmt.Errorf("lỗi khi xóa thửa đất gốc %s: %v", tx.LandParcelID, err)
	}

	// Cập nhật trạng thái giao dịch
	tx.Status = "APPROVED"
	tx.Details = fmt.Sprintf("%s; Đã phê duyệt tách thửa và tạo %d thửa đất mới", tx.Details, len(tx.ParcelIDs))
	tx.UpdatedAt = txTime
	txJSON, err := json.Marshal(tx)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa giao dịch: %v", err)
	}
	if err := ctx.GetStub().PutState(txID, txJSON); err != nil {
		return fmt.Errorf("lỗi khi cập nhật giao dịch: %v", err)
	}

	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "APPROVE_SPLIT", userID, fmt.Sprintf("Phê duyệt tách thửa %s thành %d thửa mới", txID, len(tx.ParcelIDs)))
}

// ApproveMergeTransaction - Phê duyệt giao dịch hợp thửa và tạo thửa đất mới
func (s *LandRegistryChaincode) ApproveMergeTransaction(ctx contractapi.TransactionContextInterface, txID string) error {
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
	if tx.Type != "MERGE" {
		return fmt.Errorf("giao dịch %s không phải là hợp thửa", txID)
	}

	// Kiểm tra quyền sở hữu tất cả các thửa đất
	for _, parcelID := range tx.ParcelIDs {
		parcelID = strings.TrimSpace(parcelID)
		land, err := s.QueryLandByID(ctx, parcelID, userID)
		if err != nil {
			return fmt.Errorf("lỗi khi truy vấn thửa đất %s: %v", parcelID, err)
		}
		if land.OwnerID != tx.FromOwnerID {
			return fmt.Errorf("người dùng %s không sở hữu thửa đất %s", tx.FromOwnerID, parcelID)
		}
	}

	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}

	// Xóa các thửa đất gốc
	for _, parcelID := range tx.ParcelIDs {
		parcelID = strings.TrimSpace(parcelID)
		if err := ctx.GetStub().DelState(parcelID); err != nil {
			return fmt.Errorf("lỗi khi xóa thửa đất gốc %s: %v", parcelID, err)
		}
	}

	// Thửa đất mới đã được tạo trong CreateMergeRequest
	// Ở đây chỉ cần cập nhật trạng thái giao dịch

	// Cập nhật trạng thái giao dịch
	tx.Status = "APPROVED"
	tx.Details = fmt.Sprintf("%s; Đã phê duyệt hợp thửa và tạo thửa đất mới", tx.Details)
	tx.UpdatedAt = txTime
	txJSON, err := json.Marshal(tx)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa giao dịch: %v", err)
	}
	if err := ctx.GetStub().PutState(txID, txJSON); err != nil {
		return fmt.Errorf("lỗi khi cập nhật giao dịch: %v", err)
	}

	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "APPROVE_MERGE", userID, fmt.Sprintf("Phê duyệt hợp thửa %s thành thửa mới", txID))
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
	if tx.Status != "FORWARDED" {
		return fmt.Errorf("giao dịch %s không ở trạng thái FORWARDED", txID)
	}
	if tx.Type != "CHANGE_PURPOSE" {
		return fmt.Errorf("giao dịch %s không phải là thay đổi mục đích sử dụng", txID)
	}

	land, err := s.QueryLandByID(ctx, tx.LandParcelID, userID)
	if err != nil {
		return fmt.Errorf("lỗi khi truy vấn thửa đất %s: %v", tx.LandParcelID, err)
	}

	// Kiểm tra quyền sở hữu
	if land.OwnerID != tx.FromOwnerID {
		return fmt.Errorf("người dùng %s không sở hữu thửa đất %s", tx.FromOwnerID, tx.LandParcelID)
	}

	// Trích xuất mục đích sử dụng mới từ details
	newPurpose := strings.Split(tx.Details, "sang ")[1]
	if err := ValidateLandUsePurpose(newPurpose); err != nil {
		return err
	}

	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
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
	tx.Details = fmt.Sprintf("%s; Đã phê duyệt thay đổi mục đích sử dụng", tx.Details)
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
	if tx.Status != "FORWARDED" {
		return fmt.Errorf("giao dịch %s không ở trạng thái FORWARDED", txID)
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
