package chaincode

import "time"

// Land định nghĩa thông tin thửa đất và giấy chứng nhận
type Land struct {
	ID             string    `json:"id"`                  // Mã thửa đất
	OwnerID        string    `json:"ownerId"`             // CCCD của chủ sở hữu
	Area           float64   `json:"area"`                // Diện tích (m²)
	Location       string    `json:"location"`            // Vị trí
	LandUsePurpose string    `json:"landUsePurpose"`      // Mục đích sử dụng
	LegalStatus    string    `json:"legalStatus"`         // Trạng thái pháp lý
	CertificateID  string    `json:"certificateId"`       // Mã giấy chứng nhận
	IssueDate      time.Time `json:"issueDate,omitempty"` // Ngày cấp giấy chứng nhận
	LegalInfo      string    `json:"legalInfo"`           // Thông tin pháp lý
	DocumentIDs    []string  `json:"documentIds"`         // Danh sách ID tài liệu liên quan (chỉ verified documents)
	CreatedAt      time.Time `json:"createdAt"`           // Thời gian tạo
	UpdatedAt      time.Time `json:"updatedAt"`           // Thời gian cập nhật
}

// Document định nghĩa tài liệu độc lập
type Document struct {
	DocID       string    `json:"docID"`       // Mã tài liệu
	Type        string    `json:"type"`        // Loại tài liệu (CERTIFICATE, CONTRACT, MAP, OTHER)
	Title       string    `json:"title"`       // Tiêu đề tài liệu
	Description string    `json:"description"` // Mô tả tài liệu
	IPFSHash    string    `json:"ipfsHash"`    // Hash tài liệu trên IPFS
	FileSize    int64     `json:"fileSize"`    // Kích thước file (bytes)
	FileType    string    `json:"fileType"`    // Loại file (PDF, JPG, PNG, etc.)
	UploadedBy  string    `json:"uploadedBy"`  // CCCD người upload
	Verified    bool      `json:"verified"`    // Trạng thái chứng thực
	VerifiedBy  string    `json:"verifiedBy"`  // CCCD người chứng thực
	VerifiedAt  time.Time `json:"verifiedAt"`  // Thời gian chứng thực
	CreatedAt   time.Time `json:"createdAt"`   // Thời gian tạo
	UpdatedAt   time.Time `json:"updatedAt"`   // Thời gian cập nhật
}

// Transaction định nghĩa giao dịch biến động đất đai
type Transaction struct {
	TxID         string    `json:"txId"`         // Mã giao dịch
	Type         string    `json:"type"`         // Loại giao dịch (TRANSFER, SPLIT, MERGE, CHANGE_PURPOSE, REISSUE)
	LandParcelID string    `json:"landParcelId"` // Mã thửa đất chính
	ParcelIDs    []string  `json:"parcelIds"`    // Danh sách mã thửa đất (cho trường hợp hợp thửa/tách thửa)
	FromOwnerID  string    `json:"fromOwnerId"`  // CCCD người chuyển nhượng
	ToOwnerID    string    `json:"toOwnerId"`    // CCCD người nhận chuyển nhượng
	Status       string    `json:"status"`       // Trạng thái (PENDING, CONFIRMED, FORWARDED, VERIFIED, SUPPLEMENT_REQUESTED, APPROVED, REJECTED)
	Details      string    `json:"details"`      // Chi tiết giao dịch
	UserID       string    `json:"userId"`       // CCCD người thực hiện giao dịch
	Action       string    `json:"action"`       // Hành động cụ thể (CREATE, UPDATE, QUERY, APPROVE, REJECT)
	DocumentIDs  []string  `json:"documentIds"`  // Danh sách ID tài liệu liên quan
	CreatedAt    time.Time `json:"createdAt"`    // Thời gian tạo
	UpdatedAt    time.Time `json:"updatedAt"`    // Thời gian cập nhật
}
