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

	// Validate certificate information - khi có trạng thái pháp lý thì phải có đầy đủ thông tin GCN
	// Trừ các trạng thái đặc biệt: "", "Đang tranh chấp", "Đang thế chấp"
	if legalStatus != "" && legalStatus != "Đang tranh chấp" && legalStatus != "Đang thế chấp" {
		if certificateID == "" || legalInfo == "" {
			return fmt.Errorf("khi có trạng thái pháp lý '%s', certificateID và legalInfo là bắt buộc", legalStatus)
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
func (s *LandRegistryChaincode) UpdateLandParcel(ctx contractapi.TransactionContextInterface, id, area, location, landUsePurpose, legalStatus, certificateID, legalInfo string) error {
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
func (s *LandRegistryChaincode) CreateSplitRequest(ctx contractapi.TransactionContextInterface, landParcelID, newParcelsStr, documentIdsStr, reason string) error {
	if err := CheckOrganization(ctx, []string{"Org3MSP"}); err != nil {
		return err
	}
	callerID, err := GetCallerID(ctx)
	if err != nil {
		return err
	}
	var newParcels []Land
	if err := json.Unmarshal([]byte(newParcelsStr), &newParcels); err != nil {
		return fmt.Errorf("lỗi khi giải mã danh sách thửa đất mới: %v", err)
	}
	if err := VerifyLandOwnership(ctx, landParcelID, callerID); err != nil {
		return err
	}
	if err := VerifyLandLegalStatus(ctx, landParcelID, []string{"Đang tranh chấp", "Đang thế chấp"}); err != nil {
		return err
	}
	existingLand, err := s.QueryLandByID(ctx, landParcelID)
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
	details := fmt.Sprintf("Tách thửa đất %s thành %d thửa", landParcelID, len(newParcels))
	if reason != "" {
		details = fmt.Sprintf("%s. Lý do: %s", details, reason)
	}

	tx := Transaction{
		TxID:         txID,
		Type:         "SPLIT",
		LandParcelID: landParcelID,
		ParcelIDs:    []string{}, // Khởi tạo empty slice thay vì nil
		FromOwnerID:  callerID,
		ToOwnerID:    callerID,
		Status:       "PENDING",
		Details:      details,
		UserID:       callerID, // Tự động điền người thực hiện
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
	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "CREATE_SPLIT_REQUEST", callerID, fmt.Sprintf("Tạo yêu cầu tách thửa %s", txID))
}

// CreateMergeRequest - Tạo yêu cầu hợp thửa (auto-generate txID)
func (s *LandRegistryChaincode) CreateMergeRequest(ctx contractapi.TransactionContextInterface, parcelIDsStr, newParcelStr, documentIdsStr, reason string) error {
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
	var newLand Land
	if err := json.Unmarshal([]byte(newParcelStr), &newLand); err != nil {
		return fmt.Errorf("lỗi khi giải mã thửa đất mới: %v", err)
	}
	var totalArea float64
	for _, parcelID := range parcelIDs {
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
	details := fmt.Sprintf("Hợp nhất các thửa đất %v thành %s", parcelIDs, newLand.ID)
	if reason != "" {
		details = fmt.Sprintf("%s. Lý do: %s", details, reason)
	}

	tx := Transaction{
		TxID:         txID,
		Type:         "MERGE",
		LandParcelID: newLand.ID,
		ParcelIDs:    parcelIDs,
		FromOwnerID:  callerID,
		ToOwnerID:    callerID,
		Status:       "PENDING",
		Details:      details,
		UserID:       callerID, // Tự động điền người thực hiện
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
	newLand.CreatedAt = txTime
	newLand.UpdatedAt = txTime
	newLandJSON, err := json.Marshal(newLand)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa thửa đất mới: %v", err)
	}
	if err := ctx.GetStub().PutState(newLand.ID, newLandJSON); err != nil {
		return fmt.Errorf("lỗi khi lưu thửa đất mới %s: %v", newLand.ID, err)
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
		UserID:       callerID, // Tự động điền người thực hiện
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
	if err := ValidateLandUsePurpose(newPurpose); err != nil {
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
		UserID:       callerID, // Tự động điền người thực hiện
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
		UserID:       callerID, // Tự động điền người thực hiện
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
	if tx.Status != "APPROVED" {
		return fmt.Errorf("giao dịch %s không ở trạng thái APPROVED để xác nhận", txID)
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

	// Kiểm tra và xác minh tài liệu trước khi quyết định
	var verifiedDocs, rejectedDocs []string
	var docErrors []string

	// Xử lý xác minh từng tài liệu đính kèm
	for _, docID := range tx.DocumentIDs {
		doc, err := s.GetDocument(ctx, docID)
		if err != nil {
			docErrors = append(docErrors, fmt.Sprintf("Không tìm thấy tài liệu %s", docID))
			continue
		}

		// Tự động xác minh tài liệu (giả định logic xác minh)
		if doc.Type != "" && doc.IPFSHash != "" {
			if !IsDocumentVerified(doc) {
				// Tự động xác minh tài liệu hợp lệ
				txTime, _ := GetTxTimestampAsTime(ctx)
				SetDocumentVerified(doc, userID, txTime)

				docJSON, _ := json.Marshal(doc)
				ctx.GetStub().PutState(docID, docJSON)
			}
			verifiedDocs = append(verifiedDocs, doc.Title)
		} else {
			rejectedDocs = append(rejectedDocs, doc.Title)
		}
	}

	// Xử lý theo 3 trạng thái quyết định
	txTime, err := GetTxTimestampAsTime(ctx)
	if err != nil {
		return fmt.Errorf("lỗi khi lấy timestamp: %v", err)
	}

	var logAction, statusDetails string

	switch decision {
	case "APPROVE":
		// Xác nhận đạt yêu cầu và chuyển tiếp
		if len(rejectedDocs) > 0 {
			return fmt.Errorf("không thể phê duyệt vì có tài liệu không hợp lệ: %v", rejectedDocs)
		}
		tx.Status = "VERIFIED"
		statusDetails = fmt.Sprintf("Hồ sơ đạt yêu cầu. Đã xác minh %d tài liệu: %v", len(verifiedDocs), verifiedDocs)
		if reason != "" {
			statusDetails += fmt.Sprintf(". Ghi chú: %s", reason)
		}
		logAction = "Xác nhận đạt yêu cầu và chuyển tiếp"

	case "SUPPLEMENT":
		// Yêu cầu bổ sung
		tx.Status = "SUPPLEMENT_REQUESTED"
		statusDetails = fmt.Sprintf("Yêu cầu bổ sung tài liệu.")
		if len(verifiedDocs) > 0 {
			statusDetails += fmt.Sprintf(" Đã xác minh %d tài liệu: %v.", len(verifiedDocs), verifiedDocs)
		}
		if len(rejectedDocs) > 0 {
			statusDetails += fmt.Sprintf(" Tài liệu cần bổ sung/sửa: %v.", rejectedDocs)
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

	// Cập nhật thông tin giao dịch
	tx.Details = statusDetails
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

// ForwardTransaction - Chuyển tiếp giao dịch đã được xác nhận lên Sở TN&MT (Org2)
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
	// Chỉ cho phép chuyển tiếp giao dịch đã được xác nhận (VERIFIED)
	if tx.Status != "VERIFIED" {
		return fmt.Errorf("chỉ có thể chuyển tiếp giao dịch đã được xác nhận đạt yêu cầu (trạng thái VERIFIED)")
	}
	
	tx.Status = "FORWARDED"
	tx.Details = fmt.Sprintf("%s; Đã chuyển tiếp hồ sơ lên Sở TN&MT để phê duyệt", tx.Details)
	
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
	
	return RecordTransactionLog(ctx, ctx.GetStub().GetTxID(), "FORWARD_TRANSACTION", userID, fmt.Sprintf("Chuyển tiếp giao dịch %s lên Sở TN&MT", txID))
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
		land.CertificateID = "" // Xóa giấy chứng nhận cũ
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
	err = s.UpdateLandParcel(ctx, tx.LandParcelID, fmt.Sprintf("%.2f", land.Area), land.Location, land.LandUsePurpose, land.LegalStatus, newCertificateID, legalInfo)
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
	originalLand, err := s.QueryLandByID(ctx, tx.LandParcelID)
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

	// Vô hiệu hóa thửa đất gốc (giữ lại để lưu trữ lịch sử, không xóa)
	if originalLand.CertificateID != "" {
		originalLand.CertificateID = "" // Vô hiệu hóa giấy chứng nhận cũ
		originalLand.IssueDate = time.Time{} // Reset ngày cấp
		originalLand.LegalInfo = "Giấy chứng nhận đã vô hiệu do tách thửa đất"
	}
	
	// Đánh dấu thửa đất cũ là không còn hoạt động (để lưu trữ lịch sử)
	originalLand.LegalStatus = ""
	originalLand.UpdatedAt = txTime
	
	// Cập nhật thửa đất gốc (giữ lại, không xóa)
	updatedLandJSON, err := json.Marshal(originalLand)
	if err != nil {
		return fmt.Errorf("lỗi khi mã hóa thửa đất cũ: %v", err)
	}
	if err := ctx.GetStub().PutState(tx.LandParcelID, updatedLandJSON); err != nil {
		return fmt.Errorf("lỗi khi cập nhật thửa đất gốc %s: %v", tx.LandParcelID, err)
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
		land, err := s.QueryLandByID(ctx, parcelID)
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

	// Vô hiệu hóa các thửa đất gốc (giữ lại để lưu trữ lịch sử, không xóa)
	for _, parcelID := range tx.ParcelIDs {
		parcelID = strings.TrimSpace(parcelID)
		
		// Lấy thông tin thửa đất để vô hiệu hóa
		originalLand, err := s.QueryLandByID(ctx, parcelID)
		if err != nil {
			return fmt.Errorf("lỗi khi truy vấn thửa đất %s: %v", parcelID, err)
		}
		
		// Vô hiệu hóa giấy chứng nhận
		if originalLand.CertificateID != "" {
			originalLand.CertificateID = "" // Vô hiệu hóa giấy chứng nhận cũ
			originalLand.IssueDate = time.Time{} // Reset ngày cấp
			originalLand.LegalInfo = "Giấy chứng nhận đã vô hiệu do hợp thửa đất"
		}
		
		// Đánh dấu thửa đất cũ là không còn hoạt động (để lưu trữ lịch sử)
		originalLand.LegalStatus = ""
		originalLand.UpdatedAt = txTime
		
		// Cập nhật thửa đất gốc (giữ lại, không xóa)
		updatedLandJSON, err := json.Marshal(originalLand)
		if err != nil {
			return fmt.Errorf("lỗi khi mã hóa thửa đất cũ %s: %v", parcelID, err)
		}
		if err := ctx.GetStub().PutState(parcelID, updatedLandJSON); err != nil {
			return fmt.Errorf("lỗi khi cập nhật thửa đất gốc %s: %v", parcelID, err)
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

	land, err := s.QueryLandByID(ctx, tx.LandParcelID)
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

	// Vô hiệu hóa giấy chứng nhận cũ (do thông tin thay đổi)
	if land.CertificateID != "" {
		land.CertificateID = "" // Xóa giấy chứng nhận cũ
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


