package chaincode

import "time"

// LandParcel định nghĩa thông tin thửa đất
type LandParcel struct {
	ID             string    `json:"id"`             // Mã thửa đất
	OwnerID        string    `json:"ownerId"`        // CCCD của chủ sở hữu
	Area           float64   `json:"area"`           // Diện tích (m²)
	Location       string    `json:"location"`       // Vị trí
	LandUsePurpose string    `json:"landUsePurpose"` // Mục đích sử dụng
	LegalStatus    string    `json:"legalStatus"`    // Trạng thái pháp lý
	CertificateID  string    `json:"certificateId"`  // Mã giấy chứng nhận
	CreatedAt      time.Time `json:"createdAt"`      // Thời gian tạo
	UpdatedAt      time.Time `json:"updatedAt"`      // Thời gian cập nhật
}

// LandCertificate định nghĩa giấy chứng nhận QSDĐ
type LandCertificate struct {
	CertificateID string    `json:"certificateId"` // Mã giấy chứng nhận
	LandParcelID  string    `json:"landParcelId"`  // Mã thửa đất
	OwnerID       string    `json:"ownerId"`       // CCCD của chủ sở hữu
	IssueDate     time.Time `json:"issueDate"`     // Ngày cấp
	LegalInfo     string    `json:"legalInfo"`     // Thông tin pháp lý
	CreatedAt     time.Time `json:"createdAt"`     // Thời gian tạo
	UpdatedAt     time.Time `json:"updatedAt"`     // Thời gian cập nhật
}

// LandTransaction định nghĩa giao dịch biến động đất đai
type LandTransaction struct {
	TxID         string    `json:"txId"`         // Mã giao dịch
	Type         string    `json:"type"`         // Loại giao dịch (TRANSFER, SPLIT, MERGE, CHANGE_PURPOSE, REISSUE)
	LandParcelID string    `json:"landParcelId"` // Mã thửa đất
	FromOwnerID  string    `json:"fromOwnerId"`  // CCCD người chuyển nhượng (nếu có)
	ToOwnerID    string    `json:"toOwnerId"`    // CCCD người nhận chuyển nhượng (nếu có)
	Status       string    `json:"status"`       // Trạng thái (PENDING, CONFIRMED, FORWARDED, VERIFIED, SUPPLEMENT_REQUESTED, APPROVED, REJECTED)
	Details      string    `json:"details"`      // Chi tiết giao dịch
	CreatedAt    time.Time `json:"createdAt"`    // Thời gian tạo
	UpdatedAt    time.Time `json:"updatedAt"`    // Thời gian cập nhật
}

// Document định nghĩa tài liệu đất đai
type Document struct {
	DocID        string    `json:"docId"`        // Mã tài liệu
	LandParcelID string    `json:"landParcelId"` // Mã thửa đất
	TxID         string    `json:"txId"`         // Mã giao dịch (nếu có)
	IPFSHash     string    `json:"ipfsHash"`     // Hash tài liệu trên IPFS
	Description  string    `json:"description"`  // Mô tả tài liệu
	Verified     bool      `json:"verified"`     // Ghi nhận trạng thái chứng thực
	VerifiedBy   string    `json:"verifiedBy"`   // Ghi nhận người chứng thực
	VerifiedAt   time.Time `json:"verifiedAt"`   // Ghi nhận thời điểm chứng thực
	CreatedAt    time.Time `json:"createdAt"`    // Thời gian tạo
	UpdatedAt    time.Time `json:"updatedAt"`    // Thời gian cập nhật
}

// TransactionLog định nghĩa nhật ký giao dịch trên blockchain
type TransactionLog struct {
	LogID     string    `json:"logId"`     // Mã nhật ký
	TxID      string    `json:"txId"`      // Mã giao dịch liên quan
	Action    string    `json:"action"`    // Hành động (CREATE, UPDATE, QUERY, etc.)
	UserID    string    `json:"userId"`    // CCCD người thực hiện
	Timestamp time.Time `json:"timestamp"` // Thời gian thực hiện
	Details   string    `json:"details"`   // Chi tiết hành động
}
