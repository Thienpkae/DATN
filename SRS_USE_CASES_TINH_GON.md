# 📋 **SRS - ĐẶC TẢ YÊU CẦU PHẦN MỀM - PHIÊN BẢN TINH GỌN**

## 🎯 **TỔNG QUAN HỆ THỐNG**
Hệ thống quản lý đất đai dựa trên blockchain Hyperledger Fabric với 4 tổ chức:
- **Org1**: Sở Tài nguyên & Môi trường (Sở TN&MT)
- **Org2**: Ủy ban nhân dân cấp xã (UBND cấp xã)  
- **Org3**: Công dân (người sử dụng đất)
- **Admin**: Quản trị viên hệ thống

---

## 📊 **DANH SÁCH TỔNG HỢP CÁC CHỨC NĂNG**

### **🔐 MODULE 1: XÁC THỰC VÀ QUẢN LÝ TÀI KHOẢN (8 chức năng)**
| **STT** | **Tên chức năng** | **Actor** | **Mô tả** |
|---------|-------------------|-----------|-----------|
| **UC-01** | Đăng ký tài khoản | Công dân | Đăng ký tài khoản mới với xác thực OTP |
| **UC-02** | Tạo tài khoản cán bộ | Admin | Admin tạo tài khoản cho cán bộ các tổ chức |
| **UC-03** | Đăng nhập hệ thống | Tất cả người dùng | Xác thực và đăng nhập vào hệ thống |
| **UC-04** | Đăng xuất hệ thống | Tất cả người dùng | Đăng xuất khỏi hệ thống |
| **UC-05** | Đổi mật khẩu | Tất cả người dùng | Thay đổi mật khẩu tài khoản |
| **UC-06** | Quên mật khẩu | Tất cả người dùng | Khôi phục mật khẩu qua OTP |
| **UC-07** | Cập nhật thông tin tài khoản | Admin | Admin quản lý thông tin người dùng |
| **UC-08** | Khóa/Mở khóa tài khoản | Admin | Kiểm soát trạng thái hoạt động tài khoản |

### **🏞️ MODULE 2: QUẢN LÝ THỬA ĐẤT (6 chức năng)**
| **STT** | **Tên chức năng** | **Actor** | **Mô tả** |
|---------|-------------------|-----------|-----------|
| **UC-09** | Tạo thửa đất mới | Cán bộ Sở TN&MT | Khởi tạo thửa đất mới trên blockchain |
| **UC-10** | Cập nhật thông tin thửa đất | Cán bộ Sở TN&MT | Chỉnh sửa thông tin thửa đất |
| **UC-11** | Tìm kiếm thửa đất | Tất cả người dùng | Tìm kiếm theo tiêu chí đa dạng |
| **UC-12** | Xem chi tiết thửa đất | Tất cả người dùng | Hiển thị thông tin chi tiết thửa đất |
| **UC-13** | Xem lịch sử thay đổi thửa đất | Tất cả người dùng | Theo dõi lịch sử biến động thửa đất |
| **UC-14** | Cấp giấy chứng nhận quyền sử dụng đất | Cán bộ Sở TN&MT | Cấp GCN cho thửa đất hợp lệ |

### **📄 MODULE 3: QUẢN LÝ TÀI LIỆU (9 chức năng)**
| **STT** | **Tên chức năng** | **Actor** | **Mô tả** |
|---------|-------------------|-----------|-----------|
| **UC-15** | Tạo tài liệu | Tất cả người dùng | Upload tài liệu lên IPFS |
| **UC-16** | Xem chi tiết tài liệu | Tất cả người dùng | Hiển thị thông tin chi tiết tài liệu |
| **UC-17** | Liên kết tài liệu bổ sung cho thửa đất | Cán bộ Sở TN&MT | Gắn tài liệu bổ sung vào thửa đất (tự động xác thực) |
| **UC-18** | Liên kết tài liệu bổ sung cho giao dịch | Công dân | Đính kèm tài liệu bổ sung vào giao dịch theo yêu cầu Org2 |
| **UC-19** | Cập nhật tài liệu | Tất cả người dùng | Chỉnh sửa tài liệu (chỉ người upload) |
| **UC-20** | Xóa tài liệu | Tất cả người dùng | Xóa tài liệu (chỉ người upload) |
| **UC-21** | Xác minh tài liệu | Cán bộ UBND cấp xã | Xác thực hoặc từ chối tài liệu |
| **UC-22** | Tìm kiếm tài liệu | Tất cả người dùng | Tìm kiếm theo tiêu chí đa dạng |
| **UC-23** | Xem lịch sử thay đổi tài liệu | Tất cả người dùng | Theo dõi lịch sử biến động tài liệu |

### **🔄 MODULE 4: QUẢN LÝ GIAO DỊCH (16 chức năng)**
| **STT** | **Tên chức năng** | **Actor** | **Mô tả** |
|---------|-------------------|-----------|-----------|
| **UC-24** | Tạo giao dịch chuyển nhượng | Công dân | Khởi tạo yêu cầu chuyển nhượng đất |
| **UC-25** | Tạo giao dịch tách thửa | Công dân | Khởi tạo yêu cầu tách thửa đất |
| **UC-26** | Tạo giao dịch gộp thửa | Công dân | Khởi tạo yêu cầu gộp thửa đất |
| **UC-27** | Tạo giao dịch đổi mục đích sử dụng | Công dân | Khởi tạo yêu cầu thay đổi mục đích |
| **UC-28** | Tạo giao dịch cấp lại GCN | Công dân | Khởi tạo yêu cầu cấp lại giấy chứng nhận |
| **UC-29** | Xem chi tiết giao dịch | Tất cả người dùng | Hiển thị thông tin chi tiết giao dịch |
| **UC-30** | Xác nhận nhận chuyển nhượng đất | Công dân | Bên nhận xác nhận giao dịch chuyển nhượng |
| **UC-31** | Xử lý hồ sơ giao dịch | Cán bộ UBND cấp xã | Thẩm định hồ sơ với 3 trạng thái: Xác nhận, Yêu cầu bổ sung, Từ chối |
| **UC-32** | Phê duyệt giao dịch chuyển nhượng | Cán bộ Sở TN&MT | Phê duyệt cuối cùng, vô hiệu hóa GCN cũ |
| **UC-33** | Phê duyệt giao dịch tách thửa | Cán bộ Sở TN&MT | Phê duyệt cuối cùng, vô hiệu hóa GCN cũ |
| **UC-34** | Phê duyệt giao dịch gộp thửa | Cán bộ Sở TN&MT | Phê duyệt cuối cùng, vô hiệu hóa GCN cũ |
| **UC-35** | Phê duyệt giao dịch đổi mục đích | Cán bộ Sở TN&MT | Phê duyệt cuối cùng, vô hiệu hóa GCN cũ |
| **UC-36** | Phê duyệt giao dịch cấp lại GCN | Cán bộ Sở TN&MT | Phê duyệt cuối cùng, cập nhật GCN mới |
| **UC-37** | Từ chối giao dịch | Cán bộ Sở TN&MT | Từ chối giao dịch không đáp ứng yêu cầu |
| **UC-38** | Tìm kiếm giao dịch | Tất cả người dùng | Tìm kiếm theo tiêu chí đa dạng |
| **UC-39** | Xem lịch sử thay đổi giao dịch | Tất cả người dùng | Theo dõi lịch sử xử lý và thay đổi giao dịch |
| **UC-40** | Xem lịch sử giao dịch | Tất cả người dùng | Xem danh sách tất cả giao dịch đã thực hiện |


---

## 🔐 **MODULE 1: ĐẶC TẢ CHI TIẾT USE CASE - XÁC THỰC VÀ QUẢN LÝ TÀI KHOẢN**

---

### **UC-01: Đăng ký tài khoản**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Đăng ký tài khoản người dùng mới |
| **Tác nhân** | Công dân (Org3) |
| **Mục đích** | Tạo tài khoản để truy cập hệ thống quản lý đất đai |
| **Tiền điều kiện** | - Người dùng có CCCD hợp lệ và số điện thoại đang sử dụng<br/>- Chưa có tài khoản trong hệ thống |
| **Kết quả đạt được** | - Tài khoản mới được tạo thành công<br/>- Mã xác thực được gửi đến số điện thoại<br/>- Người dùng có thể tiến hành kích hoạt tài khoản |
| **Quy trình thực hiện** | 1. Công dân truy cập trang đăng ký<br/>2. Công dân nhập thông tin: CCCD, họ tên, số điện thoại, và tạo mật khẩu<br/>3. Hệ thống tự động gán người dùng vào tổ chức mặc định Org3 – Công dân<br/>4. Hệ thống kiểm tra tính hợp lệ của CCCD (12 chữ số)<br/>5. Hệ thống xác minh CCCD và số điện thoại chưa được đăng ký<br/>6. Hệ thống tạo tài khoản với trạng thái "chờ kích hoạt"<br/>7. Hệ thống sinh mã OTP và gửi qua SMS<br/>8. Công dân nhập mã OTP để xác thực<br/>9. Hệ thống xác thực OTP và kích hoạt tài khoản<br/>10. Hệ thống thông báo đăng ký thành công |
| **Trường hợp ngoại lệ** | - CCCD đã tồn tại: Hệ thống thông báo "CCCD đã được sử dụng cho tài khoản khác"<br/>- Số điện thoại đã tồn tại: Hệ thống thông báo "Số điện thoại đã được đăng ký"<br/>- OTP hết hạn: Hệ thống yêu cầu gửi lại OTP mới<br/>- OTP sai: Hệ thống thông báo lỗi và yêu cầu nhập lại (tối đa 3 lần)<br/>- Lỗi gửi SMS: Hệ thống thông báo lỗi và cho phép thử lại |
| **Quy tắc nghiệp vụ** | - CCCD phải đúng 12 chữ số<br/>- Mỗi CCCD và số điện thoại chỉ đăng ký được một tài khoản<br/>- Mã OTP có hiệu lực trong 5 phút<br/>- Mật khẩu phải đủ mạnh để bảo mật<br/>- Tài khoản chỉ được kích hoạt sau khi xác thực OTP thành công |

---

### **UC-02: Tạo tài khoản cán bộ**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Tạo tài khoản cán bộ |
| **Tác nhân** | Admin |
| **Mục đích** | Tạo tài khoản cho cán bộ trong tổ chức của mình |
| **Tiền điều kiện** | - Admin đã đăng nhập với quyền quản trị tổ chức<br/>- Có thông tin cán bộ cần tạo tài khoản |
| **Kết quả đạt được** | - Tài khoản cán bộ được tạo và kích hoạt ngay<br/>- Thông tin đăng nhập được gửi cho cán bộ<br/>- Cán bộ có thể đăng nhập với mật khẩu tạm |
| **Quy trình thực hiện** | 1. Admin đăng nhập và truy cập "Quản lý người dùng"<br/>2. Admin chọn "Tạo tài khoản cán bộ"<br/>3. Admin nhập thông tin cán bộ: CCCD, họ tên, số điện thoại<br/>4. Hệ thống tự động gán vào tổ chức của Admin<br/>5. Hệ thống tạo tài khoản với trạng thái "đã kích hoạt"<br/>6. Hệ thống tạo mật khẩu tạm thời<br/>7. Hệ thống gửi thông tin đăng nhập qua số điện thoại cho cán bộ |
| **Trường hợp ngoại lệ** | - CCCD đã tồn tại: Hệ thống thông báo "CCCD đã được sử dụng cho tài khoản khác"<br/>- Admin không có quyền: Hệ thống từ chối truy cập<br/>- Lỗi gửi SMS: Hệ thống thông báo lỗi và cho phép thử lại |
| **Quy tắc nghiệp vụ** | - Chỉ Admin của tổ chức mới có quyền tạo tài khoản cho tổ chức đó<br/>- Tài khoản được kích hoạt ngay khi tạo<br/>- Cán bộ phải đổi mật khẩu ở lần đăng nhập đầu tiên<br/>- Mật khẩu tạm có hiệu lực 7 ngày |

---

### **UC-03: Đăng nhập hệ thống**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Đăng nhập hệ thống |
| **Tác nhân** | Tất cả người dùng |
| **Mục đích** | Xác thực danh tính và truy cập vào hệ thống |
| **Tiền điều kiện** | - Đã có tài khoản được kích hoạt<br/>- Biết CCCD và mật khẩu |
| **Kết quả đạt được** | - Đăng nhập thành công vào hệ thống<br/>- Nhận token xác thực để truy cập các chức năng<br/>- Chuyển đến trang chính theo quyền hạn |
| **Quy trình thực hiện** | 1. Người dùng nhập CCCD và mật khẩu<br/>2. Hệ thống kiểm tra tài khoản có tồn tại không<br/>3. Hệ thống kiểm tra mật khẩu có đúng không<br/>4. Hệ thống kiểm tra tài khoản có bị khóa không<br/>5. Hệ thống tạo phiên đăng nhập và token<br/>6. Hệ thống ghi lại thời gian đăng nhập<br/>7. Hệ thống chuyển hướng đến trang chính |
| **Trường hợp ngoại lệ** | - CCCD không tồn tại: Hệ thống thông báo "Tài khoản không tồn tại"<br/>- Mật khẩu sai: Hệ thống thông báo "Mật khẩu không đúng"<br/>- Tài khoản bị khóa: Hệ thống thông báo "Tài khoản đã bị khóa" |
| **Quy tắc nghiệp vụ** | - Nhập sai mật khẩu 5 lần sẽ khóa tài khoản 30 phút<br/>- Phiên đăng nhập có hiệu lực 8 giờ<br/>- Mỗi người chỉ được đăng nhập một phiên tại một thời điểm |

---

### **UC-04: Đăng xuất hệ thống**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Đăng xuất hệ thống |
| **Tác nhân** | Tất cả người dùng |
| **Mục đích** | Kết thúc phiên làm việc và bảo mật tài khoản |
| **Tiền điều kiện** | - Đã đăng nhập vào hệ thống<br/>- Có phiên làm việc đang hoạt động |
| **Kết quả đạt được** | - Phiên đăng nhập được kết thúc<br/>- Token xác thực bị vô hiệu hóa<br/>- Chuyển về trang đăng nhập |
| **Quy trình thực hiện** | 1. Người dùng nhấn nút đăng xuất<br/>2. Hệ thống xác nhận yêu cầu đăng xuất<br/>3. Hệ thống vô hiệu hóa token hiện tại<br/>4. Hệ thống xóa thông tin phiên làm việc<br/>5. Hệ thống ghi lại thời gian đăng xuất<br/>6. Hệ thống chuyển về trang đăng nhập |
| **Trường hợp ngoại lệ** | - Mất kết nối: Hệ thống tự động đăng xuất sau thời gian timeout<br/>- Lỗi hệ thống: Phiên vẫn được kết thúc để đảm bảo bảo mật |
| **Quy tắc nghiệp vụ** | - Tự động đăng xuất sau 8 giờ không hoạt động<br/>- Xóa hoàn toàn thông tin phiên trong bộ nhớ<br/>- Không thể khôi phục phiên sau khi đăng xuất |

---

### **UC-05: Đổi mật khẩu**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Đổi mật khẩu |
| **Tác nhân** | Tất cả người dùng |
| **Mục đích** | Cập nhật mật khẩu mới để tăng cường bảo mật |
| **Tiền điều kiện** | - Đã đăng nhập vào hệ thống<br/>- Biết mật khẩu hiện tại |
| **Kết quả đạt được** | - Mật khẩu được cập nhật thành công<br/>- Thông báo thay đổi được gửi đến người dùng<br/>- Tất cả phiên khác bị đăng xuất |
| **Quy trình thực hiện** | 1. Người dùng nhập mật khẩu hiện tại<br/>2. Người dùng nhập mật khẩu mới và xác nhận<br/>3. Hệ thống kiểm tra mật khẩu hiện tại có đúng không<br/>4. Hệ thống kiểm tra mật khẩu mới có đủ mạnh không<br/>5. Hệ thống mã hóa và lưu mật khẩu mới<br/>6. Hệ thống gửi thông báo thay đổi mật khẩu<br/>7. Hệ thống đăng xuất tất cả phiên khác |
| **Trường hợp ngoại lệ** | - Mật khẩu hiện tại sai: Hệ thống thông báo "Mật khẩu hiện tại không đúng"<br/>- Mật khẩu mới không đủ mạnh: Hệ thống yêu cầu tạo mật khẩu mạnh hơn<br/>- Mật khẩu mới trùng cũ: Hệ thống yêu cầu chọn mật khẩu khác |
| **Quy tắc nghiệp vụ** | - Mật khẩu mới phải khác 3 mật khẩu gần nhất<br/>- Độ dài tối thiểu 8 ký tự, có số và ký tự đặc biệt<br/>- Thông báo qua SMS khi thay đổi |

---

### **UC-06: Quên mật khẩu**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Quên mật khẩu |
| **Tác nhân** | Tất cả người dùng |
| **Mục đích** | Khôi phục quyền truy cập tài khoản khi quên mật khẩu |
| **Tiền điều kiện** | - Đã có tài khoản trong hệ thống<br/>- Có số điện thoại đã đăng ký và biết CCCD |
| **Kết quả đạt được** | - Mã OTP được gửi đến số điện thoại đã đăng ký<br/>- Xác thực thành công và được phép đặt mật khẩu mới<br/>- Tài khoản có thể đăng nhập với mật khẩu mới |
| **Quy trình thực hiện** | 1. Người dùng nhập CCCD và số điện thoại<br/>2. Hệ thống kiểm tra CCCD có tồn tại và khớp với số điện thoại không<br/>3. Hệ thống tạo mã OTP và gửi đến số điện thoại<br/>4. Người dùng nhập mã OTP<br/>5. Hệ thống kiểm tra tính hợp lệ của OTP<br/>6. Hệ thống cho phép người dùng đặt mật khẩu mới<br/>7. Người dùng nhập mật khẩu mới và xác nhận<br/>8. Hệ thống kiểm tra mật khẩu mới có đủ mạnh không<br/>9. Hệ thống lưu mật khẩu mới và thông báo thành công |
| **Trường hợp ngoại lệ** | - CCCD và số điện thoại không khớp: Hệ thống thông báo "Thông tin không chính xác"<br/>- OTP sai: Hệ thống yêu cầu nhập lại<br/>- OTP hết hạn: Hệ thống yêu cầu gửi lại<br/>- Mật khẩu mới không đủ mạnh: Hệ thống yêu cầu tạo mật khẩu mạnh hơn |
| **Quy tắc nghiệp vụ** | - OTP có hiệu lực trong 5 phút<br/>- Tối đa 5 lần nhập sai OTP<br/>- Mật khẩu mới phải khác mật khẩu cũ<br/>- Độ dài tối thiểu 8 ký tự, có số và ký tự đặc biệt |

---

### **UC-07: Cập nhật thông tin tài khoản**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Cập nhật thông tin tài khoản |
| **Tác nhân** | Tất cả người dùng |
| **Mục đích** | Người dùng cập nhật thông tin cá nhân của chính mình |
| **Tiền điều kiện** | - Người dùng đã đăng nhập vào hệ thống<br/>- Tài khoản đang hoạt động bình thường |
| **Kết quả đạt được** | - Thông tin cá nhân được cập nhật thành công<br/>- Lịch sử thay đổi được ghi lại<br/>- Hệ thống gửi thông báo xác nhận cập nhật |
| **Quy trình thực hiện** | 1. Người dùng truy cập "Thông tin cá nhân"<br/>2. Người dùng chọn "Cập nhật thông tin"<br/>3. Người dùng chỉnh sửa các thông tin: họ tên, số điện thoại<br/>4. Nếu thay đổi số điện thoại: Hệ thống gửi OTP đến số mới<br/>5. Người dùng nhập OTP để xác thực (nếu đổi SĐT)<br/>6. Hệ thống kiểm tra tính hợp lệ của thông tin mới<br/>7. Hệ thống kiểm tra số điện thoại mới có bị trùng không<br/>8. Hệ thống lưu thông tin mới<br/>9. Hệ thống ghi lại lịch sử thay đổi<br/>10. Hệ thống gửi thông báo xác nhận cập nhật thành công |
| **Trường hợp ngoại lệ** | - Số điện thoại đã được sử dụng: Hệ thống thông báo "Số điện thoại đã được đăng ký"<br/>- Thông tin không hợp lệ: Hệ thống yêu cầu nhập lại<br/>- OTP không đúng hoặc hết hạn: Hệ thống yêu cầu nhập lại hoặc gửi lại OTP<br/>- Không thể gửi OTP: Hệ thống thông báo lỗi và yêu cầu thử lại |
| **Quy tắc nghiệp vụ** | - CCCD không được phép thay đổi<br/>- Số điện thoại phải duy nhất trong hệ thống<br/>- Bắt buộc xác thực OTP khi thay đổi số điện thoại<br/>- OTP có hiệu lực trong 5 phút<br/>- Ghi lại đầy đủ thông tin: ai thay đổi, khi nào, thay đổi gì<br/>- Thông báo xác nhận sau khi cập nhật thành công |

---

### **UC-08: Khóa/Mở khóa tài khoản**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Khóa/Mở khóa tài khoản |
| **Tác nhân** | Admin |
| **Mục đích** | Khóa hoặc mở khóa tài khoản người dùng trong tổ chức |
| **Tiền điều kiện** | - Admin đã đăng nhập với quyền quản trị<br/>- Tài khoản cần quản lý thuộc tổ chức của Admin |
| **Kết quả đạt được** | - Trạng thái tài khoản được thay đổi thành công<br/>- Lịch sử thay đổi được ghi lại<br/>- Người dùng bị ảnh hưởng được thông báo |
| **Quy trình thực hiện** | 1. Admin truy cập "Quản lý người dùng"<br/>2. Admin tìm và chọn tài khoản cần quản lý<br/>3. Admin chọn "Khóa" hoặc "Mở khóa"<br/>4. Admin nhập lý do thực hiện<br/>5. Hệ thống kiểm tra quyền của Admin<br/>6. Hệ thống thay đổi trạng thái tài khoản<br/>7. Hệ thống ghi lại lịch sử với lý do<br/>8. Hệ thống gửi thông báo cho người bị ảnh hưởng |
| **Trường hợp ngoại lệ** | - Không có quyền: Hệ thống từ chối thao tác<br/>- Tài khoản không thuộc tổ chức: Hệ thống thông báo lỗi<br/>- Lý do không hợp lệ: Hệ thống yêu cầu nhập lý do |
| **Quy tắc nghiệp vụ** | - Admin chỉ quản lý được tài khoản trong tổ chức của mình<br/>- Phải có lý do khi khóa/mở khóa<br/>- Ghi lại đầy đủ thông tin: ai, khi nào, làm gì, tại sao<br/>- Thông báo ngay cho người bị ảnh hưởng |

---

## **MODULE 2: ĐẶC TẢ CHI TIẾT USE CASE - QUẢN LÝ THỬA ĐẤT**

### **UC-09: Tạo thửa đất mới**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Tạo thửa đất mới |
| **Tác nhân** | Cán bộ Sở TN&MT (Org1) |
| **Mục đích** | Ghi nhận quyền sử dụng đất hợp pháp vào blockchain |
| **Tiền điều kiện** | - Cán bộ đã đăng nhập với quyền Org1<br/>- Có đầy đủ hồ sơ pháp lý của thửa đất<br/>- Chủ sử dụng đã có tài khoản trong hệ thống |
| **Kết quả đạt được** | - Thửa đất được tạo thành công với mã số duy nhất<br/>- Thông tin được lưu trữ bất biến trên blockchain<br/>- Chủ sử dụng nhận thông báo về thửa đất mới<br/>- Giấy chứng nhận quyền sử dụng đất được cấp (nếu có) |
| **Quy trình thực hiện** | 1. Cán bộ nhập thông tin thửa đất: ID, người sử dụng đất (CCCD), vị trí, mục đích sử dụng, trạng thái pháp lý, diện tích<br/>2. Cán bộ có thể nhập thông tin giấy chứng nhận: mã GCN (IPFS hash), thông tin pháp lý<br/>3. Hệ thống kiểm tra tính hợp lệ của thông tin theo quy tắc nghiệp vụ<br/>4. Hệ thống tạo thửa đất với thông tin cơ bản và danh sách tài liệu rỗng<br/>5. Hệ thống lưu thông tin thửa đất vào blockchain<br/>6. Hệ thống trả về thông tin thửa đất đã tạo thành công<br/>7. Hệ thống gửi thông báo xác nhận cho cán bộ thực hiện<br/>10. Hệ thống gửi thông báo cho người sử dụng đất |
| **Trường hợp ngoại lệ** | - ID thửa đất đã tồn tại: Hệ thống thông báo "Thửa đất đã tồn tại"<br/>- Chủ sử dụng không tồn tại: Hệ thống yêu cầu đăng ký người sử dụng đất trước<br/>- Thông tin không hợp lệ: Hệ thống hiển thị lỗi chi tiết để sửa<br/>- Có mã GCN nhưng thiếu thông tin pháp lý: Hệ thống yêu cầu bổ sung |
| **Quy tắc nghiệp vụ** | - Mỗi thửa đất có ID duy nhất trong toàn hệ thống<br/>- Diện tích phải lớn hơn 0 và được ghi bằng mét vuông<br/>- Mục đích sử dụng phải thuộc danh mục: Đất ở, Đất nông nghiệp, Đất thương mại, Đất công nghiệp, Đất phi nông nghiệp<br/>- Trạng thái pháp lý phải thuộc: Có giấy chứng nhận, Chưa có GCN, Đang tranh chấp, Đang thế chấp<br/>- Nếu có mã GCN thì phải có thông tin pháp lý<br/>- Thông tin được lưu trữ bất biến trên blockchain |

---

### **UC-10: Cập nhật thông tin thửa đất**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Cập nhật thông tin thửa đất |
| **Tác nhân** | Cán bộ Sở TN&MT (Org1) |
| **Mục đích** | Cập nhật thông tin thửa đất khi có thay đổi |
| **Tiền điều kiện** | - Cán bộ đã đăng nhập với quyền Org1<br/>- Thửa đất đã tồn tại trong hệ thống<br/>- Thửa đất không ở trạng thái "Đang tranh chấp" hoặc "Đang thế chấp" |
| **Kết quả đạt được** | - Thông tin thửa đất được cập nhật thành công<br/>- Lịch sử thay đổi được ghi lại<br/>- Chủ sử dụng nhận thông báo về thay đổi<br/>- Giấy chứng nhận được cập nhật (nếu có) |
| **Quy trình thực hiện** | 1. Cán bộ tìm kiếm thửa đất cần cập nhật<br/>2. Cán bộ chỉnh sửa thông tin: diện tích, vị trí, mục đích sử dụng, trạng thái pháp lý<br/>3. Cán bộ có thể cập nhật thông tin giấy chứng nhận: mã GCN (IPFS hash), thông tin pháp lý<br/>4. Hệ thống kiểm tra quyền chỉnh sửa và trạng thái thửa đất<br/>5. Hệ thống kiểm tra tính hợp lệ của thông tin mới<br/>6. Hệ thống lưu thông tin cập nhật vào blockchain<br/>7. Hệ thống ghi lại lịch sử thay đổi<br/>8. Hệ thống trả về thông tin đã cập nhật<br/>9. Hệ thống gửi thông báo xác nhận cho cán bộ thực hiện<br/>10. Hệ thống gửi thông báo thay đổi cho chủ sử dụng đất |
| **Trường hợp ngoại lệ** | - Thửa đất không tồn tại: Hệ thống thông báo "Thửa đất không tìm thấy"<br/>- Thửa đất đang tranh chấp/thế chấp: Hệ thống từ chối cập nhật<br/>- Thông tin không hợp lệ: Hệ thống yêu cầu sửa lại<br/>- Có mã GCN nhưng thiếu thông tin pháp lý: Hệ thống yêu cầu bổ sung |
| **Quy tắc nghiệp vụ** | - Không được thay đổi ID thửa đất và người sử dụng đất<br/>- Có thể cập nhật: diện tích, vị trí, mục đích sử dụng, trạng thái pháp lý<br/>- Nếu có mã GCN thì phải có thông tin pháp lý<br/>- Thửa đất đang tranh chấp hoặc thế chấp không thể cập nhật<br/>- Mọi thay đổi phải được ghi lại lịch sử bất biến |

---

### **UC-11: Tìm kiếm thửa đất**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Tìm kiếm thửa đất |
| **Tác nhân** | Tất cả người dùng |
| **Mục đích** | Tra cứu thông tin thửa đất nhanh chóng và chính xác theo nhiều tiêu chí |
| **Tiền điều kiện** | - Đã đăng nhập vào hệ thống<br/>- Có ít nhất một tiêu chí tìm kiếm |
| **Kết quả đạt được** | - Danh sách thửa đất phù hợp được hiển thị<br/>- Thông tin cơ bản của mỗi thửa đất được xem<br/>- Có thể xem chi tiết từng thửa đất<br/>- Thống kê tổng hợp về kết quả tìm kiếm |
| **Quy trình thực hiện** | 1. Người dùng nhập tiêu chí tìm kiếm: ID thửa đất, từ khóa, bộ lọc<br/>2. Người dùng có thể tìm theo: vị trí, mục đích sử dụng, trạng thái pháp lý, người sử dụng đất<br/>3. Hệ thống tìm kiếm trong cơ sở dữ liệu blockchain<br/>4. Hệ thống lọc kết quả theo quyền truy cập của người dùng<br/>5. Hệ thống hiển thị danh sách kết quả phù hợp<br/>6. Hệ thống cho phép sắp xếp theo các tiêu chí<br/>7. Hệ thống hỗ trợ phân trang nếu có nhiều kết quả<br/>8. Người dùng có thể chọn xem chi tiết thửa đất |
| **Trường hợp ngoại lệ** | - Không tìm thấy kết quả: Hệ thống thông báo "Không tìm thấy thửa đất phù hợp"<br/>- Tiêu chí tìm kiếm không hợp lệ: Hệ thống yêu cầu nhập lại<br/>- Lỗi truy vấn: Hệ thống thông báo lỗi và cho phép thử lại |
| **Quy tắc nghiệp vụ** | - Người dùng chỉ xem được thửa đất được phép theo quyền hạn<br/>- Kết quả tìm kiếm được giới hạn 100 bản ghi<br/>- Hỗ trợ tìm kiếm theo từ khóa và bộ lọc nâng cao<br/>- Org3 chỉ xem được thửa đất thuộc quyền sử dụng<br/>- Tích hợp các chức năng: xem theo người sử dụng, xem tất cả, xem theo tiêu chí |

---

### **UC-12: Xem chi tiết thửa đất**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Xem chi tiết thửa đất |
| **Tác nhân** | Tất cả người dùng |
| **Mục đích** | Xem đầy đủ thông tin và trạng thái hiện tại của thửa đất |
| **Tiền điều kiện** | - Đã đăng nhập vào hệ thống<br/>- Có ID thửa đất cần xem<br/>- Có quyền xem thửa đất này |
| **Kết quả đạt được** | - Thông tin đầy đủ của thửa đất được hiển thị<br/>- Lịch sử giao dịch được xem<br/>- Tài liệu liên quan được liệt kê<br/>- Trạng thái hiện tại được kiểm tra |
| **Quy trình thực hiện** | 1. Người dùng chọn thửa đất để xem chi tiết<br/>2. Hệ thống kiểm tra quyền truy cập của người dùng<br/>3. Hệ thống tải thông tin chi tiết từ blockchain<br/>4. Hệ thống hiển thị thông tin cơ bản: ID, vị trí, diện tích, mục đích sử dụng, trạng thái pháp lý<br/>5. Hệ thống hiển thị thông tin người sử dụng đất hiện tại<br/>6. Hệ thống hiển thị thông tin giấy chứng nhận: mã GCN, ngày cấp, thông tin pháp lý<br/>7. Hệ thống hiển thị danh sách tài liệu đã xác minh |
| **Trường hợp ngoại lệ** | - Thửa đất không tồn tại: Hệ thống thông báo "Thửa đất không tìm thấy"<br/>- Không có quyền xem: Hệ thống từ chối truy cập<br/>- Lỗi tải dữ liệu: Hệ thống thông báo lỗi |
| **Quy tắc nghiệp vụ** | - Thông tin được lấy trực tiếp từ blockchain<br/>- Org3 chỉ xem được thửa đất thuộc quyền sử dụng<br/>- Thông tin giấy chứng nhận chỉ hiển thị khi có GCN |

---

### **UC-13: Xem lịch sử thay đổi của thửa đất**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Xem lịch sử thay đổi của thửa đất |
| **Tác nhân** | Tất cả người dùng |
| **Mục đích** | Theo dõi quá trình thay đổi thông tin thuộc tính của thửa đất theo thời gian |
| **Tiền điều kiện** | - Đã đăng nhập vào hệ thống<br/>- Đã xem chi tiết thửa đất (UC-12)<br/>- Có quyền xem lịch sử thửa đất này |
| **Kết quả đạt được** | - Lịch sử đầy đủ các thay đổi thông tin thuộc tính được hiển thị<br/>- Thông tin về mỗi lần thay đổi được xem<br/>- Thời gian và người thực hiện thay đổi được ghi rõ |
| **Quy trình thực hiện** | 1. Người dùng đang xem chi tiết thửa đất (UC-12)<br/>2. Người dùng chọn tab "Lịch sử thay đổi"<br/>3. Hệ thống kiểm tra quyền truy cập lịch sử thửa đất<br/>4. Hệ thống truy vấn lịch sử thay đổi thông tin thuộc tính từ blockchain<br/>5. Hệ thống hiển thị danh sách các thay đổi theo thứ tự thời gian |
| **Trường hợp ngoại lệ** | - Thửa đất không có lịch sử thay đổi: Hệ thống thông báo "Chưa có thay đổi nào"<br/>- Không có quyền xem lịch sử: Hệ thống từ chối truy cập<br/>- Lỗi truy vấn blockchain: Hệ thống thông báo lỗi |
| **Quy tắc nghiệp vụ** | - Lịch sử thay đổi được lưu trữ bất biến trên blockchain<br/>- Org3 chỉ xem được lịch sử thửa đất thuộc quyền sở hữu<br/>- Chỉ hiển thị các thay đổi thông tin thuộc tính được phép xem<br/>- Mỗi lần thay đổi đều có timestamp và người thực hiện |

---

### **UC-14: Cấp giấy chứng nhận quyền sử dụng đất**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Cấp giấy chứng nhận quyền sử dụng đất |
| **Tác nhân** | Cán bộ Sở TN&MT (Org1) |
| **Mục đích** | Cấp giấy chứng nhận quyền sử dụng đất cho thửa đất đã đủ điều kiện |
| **Tiền điều kiện** | - Cán bộ đã đăng nhập với quyền Org1<br/>- Thửa đất đã tồn tại và có đầy đủ hồ sơ pháp lý<br/>- Thửa đất chưa có giấy chứng nhận<br/>- Đã hoàn thành xác minh tài liệu và thông tin |
| **Kết quả đạt được** | - Giấy chứng nhận quyền sử dụng đất được cấp cho thửa đất đủ điều kiện<br/>- Mã GCN được xác lập theo định dạng "Số seri - Số vào sổ" và quản lý thống nhất trên hệ thống<br/>- Thông tin pháp lý của thửa đất được cập nhật; trạng thái phản ánh đúng sau cấp GCN<br/>- Các bên liên quan nhận thông báo theo thẩm quyền |
| **Quy trình thực hiện** | 1. Cán bộ lựa chọn thửa đất đủ điều kiện cấp GCN trong danh sách quản lý<br/>2. Cán bộ nhập thông tin GCN: Số seri, Số vào sổ cấp GCN và nội dung pháp lý liên quan<br/>3. Cán bộ đính kèm bản điện tử giấy chứng nhận vào hồ sơ thửa đất<br/>4. Hệ thống ghi nhận giấy chứng nhận với mã GCN theo "Số seri - Số vào sổ" và gắn vào thửa đất tương ứng<br/>5. Hệ thống cập nhật thông tin pháp lý và trạng thái thửa đất sau cấp GCN<br/>6. Hệ thống thông báo kết quả đến chủ sử dụng đất và ghi nhận xác nhận thực hiện của cán bộ |
| **Trường hợp ngoại lệ** | - Thửa đất đã có GCN: Hệ thống thông báo "Thửa đất đã có giấy chứng nhận"<br/>- Hồ sơ chưa đầy đủ: Hệ thống yêu cầu bổ sung trước khi cấp<br/>- File GCN không hợp lệ: Hệ thống yêu cầu tải lên file PDF hợp lệ<br/>- Lỗi lưu trữ IPFS: Hệ thống thông báo lỗi và yêu cầu thử lại |
| **Quy tắc nghiệp vụ** | - Chỉ cán bộ Sở TN&MT (Org1) có thẩm quyền cấp GCN<br/>- Một thửa đất chỉ có một giấy chứng nhận hợp lệ tại một thời điểm<br/>- Mã GCN phải duy nhất, cấu trúc theo "Số seri - Số vào sổ cấp GCN" theo quy định quản lý hồ sơ<br/>- Hồ sơ cấp GCN phải kèm bản điện tử giấy chứng nhận và nội dung pháp lý liên quan<br/>- Trạng thái và thông tin pháp lý của thửa đất phải được cập nhật ngay sau khi cấp GCN |

---

## **MODULE 3: ĐẶC TẢ CHI TIẾT USE CASE - QUẢN LÝ TÀI LIỆU**

### **UC-15: Tạo tài liệu**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Tạo tài liệu |
| **Tác nhân** | Tất cả người dùng |
| **Mục đích** | Tạo và tải lên tài liệu mới vào hệ thống |
| **Tiền điều kiện** | - Đã đăng nhập vào hệ thống<br/>- Có file tài liệu hợp lệ để tải lên<br/>- Có thông tin mô tả tài liệu |
| **Kết quả đạt được** | - Tài liệu được tải lên và lưu trữ thành công<br/>- Metadata được ghi nhận trên blockchain<br/>- File được lưu trữ an toàn trên IPFS<br/>- Người tạo nhận thông báo xác nhận |
| **Quy trình thực hiện** | 1. Người dùng chọn file tài liệu từ máy tính<br/>2. Người dùng nhập thông tin: tên tài liệu, loại, mô tả<br/>3. Hệ thống kiểm tra định dạng và kích thước file<br/>4. Hệ thống tải file lên IPFS và nhận hash<br/>5. Hệ thống tạo metadata tài liệu với thông tin người tạo<br/>6. Hệ thống lưu metadata lên blockchain<br/>7. Hệ thống gửi thông báo tạo tài liệu thành công<br/>8. Hệ thống trả về thông tin tài liệu đã tạo |
| **Trường hợp ngoại lệ** | - File không đúng định dạng: Hệ thống thông báo "Định dạng file không được hỗ trợ"<br/>- File quá lớn: Hệ thống thông báo "Kích thước file vượt quá giới hạn"<br/>- Lỗi tải lên IPFS: Hệ thống thông báo lỗi và cho phép thử lại |
| **Quy tắc nghiệp vụ** | - Chỉ hỗ trợ file PDF, DOCX, JPG, PNG<br/>- Kích thước file tối đa 10MB<br/>- Metadata được lưu bất biến trên blockchain<br/>- File được mã hóa trước khi lưu trữ |

---

### **UC-16: Xem chi tiết tài liệu**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Xem chi tiết tài liệu |
| **Tác nhân** | Tất cả người dùng |
| **Mục đích** | Hiển thị thông tin chi tiết và nội dung tài liệu |
| **Tiền điều kiện** | - Đã đăng nhập vào hệ thống<br/>- Có mã tài liệu cần xem<br/>- Có quyền truy cập tài liệu |
| **Kết quả đạt được** | - Thông tin metadata được hiển thị đầy đủ<br/>- Nội dung tài liệu được xem trực tuyến<br/>- Lịch sử truy cập được ghi lại<br/>- Có thể tải xuống nếu có quyền |
| **Quy trình thực hiện** | 1. Người dùng chọn tài liệu để xem chi tiết<br/>2. Hệ thống kiểm tra quyền truy cập của người dùng<br/>3. Hệ thống tải thông tin chi tiết từ blockchain<br/>4. Hệ thống lấy file từ IPFS và giải mã<br/>5. Hệ thống hiển thị thông tin: tên, loại, người tạo, ngày tạo<br/>6. Hệ thống hiển thị nội dung file trong viewer<br/>7. Hệ thống ghi lại lịch sử truy cập<br/>8. Hệ thống cung cấp tùy chọn tải xuống |
| **Trường hợp ngoại lệ** | - Tài liệu không tồn tại: Hệ thống thông báo "Tài liệu không tìm thấy"<br/>- Không có quyền xem: Hệ thống từ chối truy cập<br/>- File bị lỗi: Hệ thống thông báo "Không thể mở tài liệu" |
| **Quy tắc nghiệp vụ** | - Chỉ xem được tài liệu có quyền truy cập<br/>- Mọi lần xem đều được ghi log<br/>- Tài liệu được hiển thị trong viewer bảo mật |

---

### **UC-17: Liên kết tài liệu bổ sung cho thửa đất**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Liên kết tài liệu bổ sung cho thửa đất |
| **Tác nhân** | Cán bộ Sở TN&MT (Org1) |
| **Mục đích** | Liên kết tài liệu bổ sung với thửa đất khi cần thiết; tài liệu được liên kết sẽ tự động được xác thực |
| **Tiền điều kiện** | - Đã đăng nhập với quyền Org1<br/>- Đã xem chi tiết thửa đất (UC-12)<br/>- Đang ở tab "Tài liệu liên quan" của thửa đất |
| **Kết quả đạt được** | - Mối quan hệ giữa tài liệu và thửa đất được tạo<br/>- Tài liệu được tự động đánh dấu đã xác thực<br/>- Thông tin liên kết được lưu trữ trên blockchain<br/>- Tài liệu xuất hiện trong danh sách mã tài liệu liên quan của thửa đất<br/>- Chủ sử dụng thửa đất nhận thông báo |
| **Quy trình thực hiện** | 1. Cán bộ Org1 đang xem chi tiết thửa đất (UC-12)<br/>2. Cán bộ chuyển sang tab "Tài liệu liên quan"<br/>3. Cán bộ chọn "Thêm tài liệu mới" hoặc "Liên kết tài liệu có sẵn"<br/>4. Nếu tạo tài liệu mới: tải lên file, nhập metadata, hệ thống lưu IPFS và metadata<br/>5. Hệ thống kiểm tra tài liệu chưa được liên kết với thửa đất này<br/>6. Hệ thống thêm mã tài liệu vào danh sách mã tài liệu liên quan của thửa đất<br/>7. Hệ thống tự động đánh dấu tài liệu đã được xác thực<br/>8. Hệ thống cập nhật thông tin trên blockchain và ghi log<br/>9. Hệ thống gửi thông báo cho chủ sử dụng thửa đất |
| **Trường hợp ngoại lệ** | - Không có quyền Org1: Hệ thống từ chối truy cập<br/>- Tài liệu không hợp lệ: Hệ thống thông báo lỗi<br/>- Tài liệu đã liên kết: Hệ thống thông báo đã liên kết trước đó<br/>- Lỗi lưu trữ IPFS: Hệ thống thông báo và cho phép thử lại |
| **Quy tắc nghiệp vụ** | - Chỉ Org1 được phép liên kết tài liệu với thửa đất<br/>- Liên kết xong tài liệu tự động ở trạng thái đã xác thực<br/>- Một tài liệu có thể liên kết với nhiều thửa đất<br/>- Liên kết được lưu bất biến và có timestamp |

---

### **UC-18: Liên kết tài liệu bổ sung cho giao dịch**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Liên kết tài liệu bổ sung cho giao dịch |
| **Tác nhân** | Công dân (Org3) |
| **Mục đích** | Chủ sử dụng đính kèm tài liệu bổ sung vào hồ sơ giao dịch theo yêu cầu của cán bộ Org2 |
| **Tiền điều kiện** | - Đã đăng nhập với quyền Org3<br/>- Đã xem chi tiết giao dịch (UC-29)<br/>- Là bên liên quan của giao dịch<br/>- Tài liệu thuộc sở hữu của người dùng<br/>- Cán bộ Org2 đã thẩm định và yêu cầu bổ sung tài liệu cho giao dịch |
| **Kết quả đạt được** | - Tài liệu bổ sung được liên kết với giao dịch theo yêu cầu<br/>- Thông tin liên kết được lưu trữ trên blockchain<br/>- Cán bộ cấp xã (Org2) nhận thông báo về tài liệu bổ sung và tiếp tục xử lý hồ sơ |
| **Quy trình thực hiện** | 1. Người dùng (Org3) xem chi tiết giao dịch (UC-29)<br/>2. Người dùng chọn "Đính kèm/ Liên kết tài liệu"<br/>3. Người dùng chọn tài liệu thuộc sở hữu (có thể tạo mới trước đó - UC-15), tài liệu có thể đang ở trạng thái chờ xác minh<br/>4. Hệ thống kiểm tra quyền sở hữu tài liệu và quyền với giao dịch<br/>5. Hệ thống kiểm tra tài liệu chưa liên kết trùng lặp<br/>6. Hệ thống thêm mã tài liệu vào danh sách tài liệu của giao dịch<br/>7. Hệ thống cập nhật thông tin trên blockchain và ghi log<br/>8. Hệ thống thông báo cho Org2 để thẩm định và xác minh các tài liệu đính kèm |
| **Trường hợp ngoại lệ** | - Không phải tài liệu của người dùng: Hệ thống từ chối thao tác<br/>- Không phải bên liên quan giao dịch: Hệ thống từ chối<br/>- Tài liệu đã liên kết: Hệ thống thông báo trùng lặp<br/>- Lỗi hệ thống: Hệ thống thông báo và cho phép thử lại |
| **Quy tắc nghiệp vụ** | - Chỉ Org3 được phép liên kết tài liệu bổ sung vào giao dịch của mình<br/>- Chức năng này chỉ được kích hoạt sau khi Org2 yêu cầu bổ sung tài liệu<br/>- Tài liệu bổ sung có thể chưa được xác minh; Org2 sẽ xác minh các tài liệu bổ sung<br/>- Mỗi liên kết được ghi log với timestamp |



### **UC-19: Cập nhật tài liệu**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Cập nhật tài liệu |
| **Tác nhân** | Tất cả người dùng |
| **Mục đích** | Cập nhật thông tin mô tả và phân loại tài liệu |
| **Tiền điều kiện** | - Đã đăng nhập vào hệ thống<br/>- Là người tạo (người upload) của tài liệu<br/>- Tài liệu chưa bị khóa chỉnh sửa |
| **Kết quả đạt được** | - Metadata tài liệu được cập nhật thành công<br/>- Lịch sử thay đổi được ghi lại<br/>- Phiên bản mới được tạo trên blockchain<br/>- Thông báo được gửi đến người liên quan |
| **Quy trình thực hiện** | 1. Người dùng chọn tài liệu cần cập nhật<br/>2. Người dùng chỉnh sửa thông tin: tên, mô tả, loại<br/>3. Hệ thống kiểm tra quyền chỉnh sửa<br/>4. Hệ thống validate thông tin mới<br/>5. Hệ thống tạo phiên bản metadata mới<br/>6. Hệ thống lưu thay đổi lên blockchain<br/>7. Hệ thống ghi lại lịch sử thay đổi<br/>8. Hệ thống gửi thông báo cập nhật |
| **Trường hợp ngoại lệ** | - Không có quyền chỉnh sửa: Hệ thống từ chối thao tác<br/>- Tài liệu đã bị khóa: Hệ thống thông báo "Tài liệu không thể chỉnh sửa"<br/>- Thông tin không hợp lệ: Hệ thống yêu cầu sửa lại |
| **Quy tắc nghiệp vụ** | - Không thể thay đổi file gốc, chỉ metadata<br/>- Mọi thay đổi đều tạo version mới<br/>- Lịch sử thay đổi được lưu vĩnh viễn<br/>- Chỉ người upload (chủ sở hữu) mới được chỉnh sửa |

---

### **UC-20: Xóa tài liệu**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Xóa tài liệu |
| **Tác nhân** | Tất cả người dùng |
| **Mục đích** | Loại bỏ tài liệu không cần thiết hoặc sai sót |
| **Tiền điều kiện** | - Đã đăng nhập vào hệ thống<br/>- Là người tạo (người upload) của tài liệu<br/>- Tài liệu chưa được liên kết với giao dịch quan trọng |
| **Kết quả đạt được** | - Tài liệu được đánh dấu xóa trên blockchain<br/>- File được xóa khỏi IPFS<br/>- Metadata được cập nhật trạng thái deleted<br/>- Thông báo xóa được gửi đi |
| **Quy trình thực hiện** | 1. Người dùng chọn tài liệu cần xóa<br/>2. Hệ thống kiểm tra quyền xóa và ràng buộc<br/>3. Hệ thống hiển thị cảnh báo xóa vĩnh viễn<br/>4. Người dùng xác nhận quyết định xóa<br/>5. Hệ thống đánh dấu xóa trên blockchain<br/>6. Hệ thống xóa file khỏi IPFS<br/>7. Hệ thống ghi nhật ký hành động xóa<br/>8. Hệ thống gửi thông báo đã xóa |
| **Trường hợp ngoại lệ** | - Tài liệu đang được sử dụng: Hệ thống từ chối xóa<br/>- Không có quyền xóa: Hệ thống từ chối thao tác<br/>- Lỗi xóa tệp: Hệ thống báo lỗi và hoàn tác |
| **Quy tắc nghiệp vụ** | - Chỉ người upload (chủ sở hữu) mới được xóa tài liệu của mình<br/>- Không thể xóa tài liệu đang liên kết với giao dịch đang xử lý<br/>- Hành động xóa được ghi nhật ký vĩnh viễn |

---

### **UC-21: Xác minh tài liệu**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Xác minh tài liệu |
| **Tác nhân** | Cán bộ hành chính cấp xã (Org2) |
| **Mục đích** | Xác minh tính xác thực và hợp lệ của tài liệu, so khớp thông tin với dữ liệu blockchain |
| **Tiền điều kiện** | - Đã đăng nhập với quyền Org2<br/>- Tài liệu ở trạng thái chờ xác minh<br/>- Có đầy đủ thông tin để kiểm tra |
| **Kết quả đạt được** | - Tài liệu được đánh dấu đã xác minh<br/>- Trạng thái được cập nhật trên blockchain<br/>- Người gửi nhận thông báo kết quả<br/>- Tài liệu có thể được sử dụng trong giao dịch |
| **Quy trình thực hiện** | 1. Cán bộ Org2 xem danh sách tài liệu chờ xác minh<br/>2. Cán bộ kiểm tra nội dung và tính hợp lệ<br/>3. Cán bộ so khớp thông tin tài liệu với dữ liệu blockchain<br/>4. Cán bộ nhập nhận xét và kết quả xác minh<br/>5. Hệ thống ghi nhận quyết định xác minh<br/>6. Hệ thống cập nhật trạng thái lên blockchain<br/>7. Hệ thống ghi lại log xác minh<br/>8. Hệ thống gửi thông báo kết quả<br/> |
| **Trường hợp ngoại lệ** | - Tài liệu không hợp lệ: Hệ thống từ chối và yêu cầu sửa<br/>- Thiếu thông tin: Hệ thống yêu cầu bổ sung<br/>- Không có quyền xác minh: Hệ thống từ chối |
| **Quy tắc nghiệp vụ** | - Chỉ cán bộ Org2 có quyền xác minh<br/>- Mỗi tài liệu chỉ cần xác minh một lần<br/>- Kết quả xác minh không thể thay đổi<br/>- Phải so khớp thông tin với dữ liệu blockchain |

---

### **UC-22: Tìm kiếm tài liệu**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Tìm kiếm tài liệu |
| **Tác nhân** | Tất cả người dùng |
| **Mục đích** | Tra cứu tài liệu nhanh chóng và chính xác theo nhiều tiêu chí |
| **Tiền điều kiện** | - Đã đăng nhập vào hệ thống<br/>- Có ít nhất một tiêu chí tìm kiếm |
| **Kết quả đạt được** | - Danh sách tài liệu phù hợp được hiển thị<br/>- Thông tin cơ bản của mỗi tài liệu được xem<br/>- Có thể xem chi tiết từng tài liệu |
| **Quy trình thực hiện** | 1. Người dùng nhập tiêu chí tìm kiếm: tên, loại, người tạo<br/>2. Người dùng có thể tìm theo: trạng thái, thửa đất, giao dịch, ngày tạo<br/>3. Hệ thống tìm kiếm trong cơ sở dữ liệu blockchain<br/>4. Hệ thống lọc kết quả theo quyền truy cập<br/>5. Hệ thống hiển thị danh sách kết quả<br/>6. Hệ thống cho phép sắp xếp theo ngày tạo, tên<br/>7. Hệ thống hỗ trợ phân trang nếu có nhiều kết quả<br/>8. Người dùng có thể chọn xem chi tiết tài liệu |
| **Trường hợp ngoại lệ** | - Không tìm thấy kết quả: Hệ thống thông báo "Không tìm thấy tài liệu phù hợp"<br/>- Tiêu chí không hợp lệ: Hệ thống yêu cầu nhập lại<br/>- Lỗi truy vấn: Hệ thống thông báo lỗi |
| **Quy tắc nghiệp vụ** | - Chỉ tìm được tài liệu có quyền truy cập<br/>- Kết quả được giới hạn 100 bản ghi<br/>- Hỗ trợ tìm kiếm mờ cho tên tài liệu<br/>- Tích hợp các chức năng: xem theo thửa đất, xem theo giao dịch, xem theo trạng thái, xem theo loại, xem theo người tải lên |

---

### **UC-23: Xem lịch sử thay đổi của tài liệu**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Xem lịch sử thay đổi của tài liệu |
| **Tác nhân** | Tất cả người dùng |
| **Mục đích** | Theo dõi quá trình thay đổi thông tin và trạng thái của tài liệu |
| **Tiền điều kiện** | - Đã đăng nhập vào hệ thống<br/>- Đã xem chi tiết tài liệu (UC-16)<br/>- Có quyền xem lịch sử tài liệu này |
| **Kết quả đạt được** | - Lịch sử đầy đủ các thay đổi thông tin được hiển thị<br/>- Thông tin về mỗi lần thay đổi được xem<br/>- Thời gian và người thực hiện thay đổi được ghi rõ |
| **Quy trình thực hiện** | 1. Người dùng đang xem chi tiết tài liệu (UC-16)<br/>2. Người dùng chọn tab "Lịch sử thay đổi"<br/>3. Hệ thống kiểm tra quyền truy cập lịch sử tài liệu<br/>4. Hệ thống truy vấn lịch sử thay đổi thông tin từ blockchain<br/>5. Hệ thống hiển thị danh sách các thay đổi theo thứ tự thời gian |
| **Trường hợp ngoại lệ** | - Tài liệu không có lịch sử thay đổi: Hệ thống thông báo "Chưa có thay đổi nào"<br/>- Không có quyền xem lịch sử: Hệ thống từ chối truy cập<br/>- Lỗi truy vấn blockchain: Hệ thống thông báo lỗi |
| **Quy tắc nghiệp vụ** | - Lịch sử thay đổi được lưu trữ bất biến trên blockchain<br/>- Org3 chỉ xem được lịch sử tài liệu thuộc quyền sở hữu<br/>- Chỉ hiển thị các thay đổi thông tin được phép xem<br/>- Mỗi lần thay đổi đều có timestamp và người thực hiện |

---

## **MODULE 4: ĐẶC TẢ CHI TIẾT USE CASE - QUẢN LÝ GIAO DỊCH**

### **UC-24: Tạo giao dịch chuyển nhượng**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Tạo giao dịch chuyển nhượng |
| **Tác nhân** | Công dân (Org3)|
| **Mục đích** | Khởi tạo quy trình chuyển nhượng quyền sử dụng đất |
| **Tiền điều kiện** | - Đã đăng nhập với quyền Org3<br/>- Là người sử dụng đất hợp pháp của thửa đất<br/>- Thửa đất không đang trong giao dịch khác<br/>- Thửa đất không ở trạng thái tranh chấp hoặc thế chấp |
| **Kết quả đạt được** | - Yêu cầu chuyển nhượng được tạo thành công<br/>- Thông tin được lưu trên blockchain<br/>- Bên nhận được thông báo<br/>- Quy trình xử lý được bắt đầu |
| **Quy trình thực hiện** | 1. Chủ sử dụng chọn thửa đất cần chuyển nhượng<br/>2. Chủ sử dụng nhập thông tin bên nhận (CCCD)<br/>3. Chủ sử dụng tải lên/chọn và liên kết các tài liệu bắt buộc cho hồ sơ giao dịch (UC-18)<br/>4. Hệ thống kiểm tra quyền sở dụng và trạng thái thửa đất<br/>5. Hệ thống kiểm tra thửa đất không ở trạng thái tranh chấp/thế chấp<br/>6. Hệ thống tạo yêu cầu chuyển nhượng kèm danh sách tài liệu đính kèm<br/>7. Hệ thống gửi thông báo cho bên nhận (Org3)<br/>8. Hệ thống gửi thông báo cho cơ quan hành chính cấp xã (Org2) |
| **Trường hợp ngoại lệ** | - Không phải người sử dụng đất: Hệ thống từ chối tạo yêu cầu<br/>- Thửa đất đang tranh chấp/thế chấp: Hệ thống thông báo "Thửa đất không thể chuyển nhượng"<br/>- Bên nhận không tồn tại: Hệ thống yêu cầu kiểm tra thông tin<br/>- Thửa đất đang giao dịch: Hệ thống thông báo "Thửa đất đang trong giao dịch khác" |
| **Quy tắc nghiệp vụ** | - Chỉ người sử dụng đất mới có quyền tạo yêu cầu<br/>- Thửa đất phải không ở trạng thái tranh chấp hoặc thế chấp<br/>- Một thửa đất chỉ có một giao dịch tại một thời điểm |

---

### **UC-25: Tạo giao dịch tách thửa**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Tạo giao dịch tách thửa |
| **Tác nhân** | Công dân (Org3) |
| **Mục đích** | Chia nhỏ thửa đất để quản lý hoặc chuyển nhượng riêng biệt |
| **Tiền điều kiện** | - Đã đăng nhập với quyền Org3<br/>- Là người sử dụng đất hợp pháp của thửa đất<br/>- Thửa đất có diện tích đủ lớn để tách<br/>- Thửa đất không ở trạng thái tranh chấp hoặc thế chấp |
| **Kết quả đạt được** | - Yêu cầu tách thửa được tạo thành công<br/>- Kế hoạch tách được lưu trữ<br/>- Các thửa đất mới được tạo trên blockchain<br/>- Quy trình thẩm định được bắt đầu |
| **Quy trình thực hiện** | 1. Chủ sử dụng chọn thửa đất cần tách<br/>2. Chủ sử dụng nhập thông tin các thửa đất mới (mã, diện tích, vị trí)<br/>3. Chủ sử dụng tải lên/chọn và liên kết các tài liệu bắt buộc cho hồ sơ giao dịch (UC-18)<br/>4. Hệ thống kiểm tra quyền sở dụng và trạng thái thửa đất<br/>5. Hệ thống kiểm tra thửa đất không ở trạng thái tranh chấp/thế chấp<br/>6. Hệ thống validate thông tin các thửa đất mới<br/>7. Hệ thống kiểm tra tổng diện tích không vượt quá thửa gốc<br/>8. Hệ thống tạo yêu cầu tách thửa kèm danh sách tài liệu đính kèm<br/>9. Hệ thống gửi thông báo cho cơ quan hành chính cấp xã (Org2) |
| **Trường hợp ngoại lệ** | - Không phải người sử dụng đất: Hệ thống từ chối tạo yêu cầu<br/>- Thửa đất đang tranh chấp/thế chấp: Hệ thống thông báo "Thửa đất không thể tách"<br/>- Tổng diện tích vượt quá: Hệ thống thông báo "Tổng diện tích vượt quá thửa gốc"<br/>- Thông tin thửa mới không hợp lệ: Hệ thống yêu cầu sửa đổi |
| **Quy tắc nghiệp vụ** | - Chỉ người sử dụng đất mới có quyền tạo yêu cầu<br/>- Thửa đất phải không ở trạng thái tranh chấp hoặc thế chấp<br/>- Tổng diện tích các thửa mới không được vượt quá thửa gốc<br/>- Thông tin thửa đất mới phải hợp lệ theo quy định |

---

### **UC-26: Tạo giao dịch gộp thửa**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Tạo giao dịch gộp thửa |
| **Tác nhân** | Công dân (Org3) |
| **Mục đích** | Hợp nhất nhiều thửa đất liền kề để quản lý thống nhất |
| **Tiền điều kiện** | - Đã đăng nhập với quyền Org3<br/>- Là người sử dụng đất của tất cả thửa đất cần gộp<br/>- Các thửa đất phải liền kề nhau<br/>- Tất cả thửa đất không ở trạng thái tranh chấp hoặc thế chấp |
| **Kết quả đạt được** | - Yêu cầu gộp thửa được tạo thành công<br/>- Kế hoạch gộp được lưu trữ<br/>- Thửa đất mới được tạo trên blockchain<br/>- Quy trình thẩm định được bắt đầu |
| **Quy trình thực hiện** | 1. Chủ sử dụng chọn các thửa đất cần gộp<br/>2. Chủ sử dụng nhập thông tin thửa đất mới sau khi gộp<br/>3. Chủ sử dụng tải lên/chọn và liên kết các tài liệu bắt buộc cho hồ sơ giao dịch (UC-18)<br/>4. Hệ thống kiểm tra quyền sở hữu tất cả thửa đất<br/>5. Hệ thống kiểm tra tất cả thửa đất không ở trạng thái tranh chấp/thế chấp<br/>6. Hệ thống validate thông tin thửa đất mới<br/>7. Hệ thống kiểm tra diện tích thửa mới khớp với tổng diện tích các thửa gốc<br/>8. Hệ thống tạo yêu cầu gộp thửa kèm danh sách tài liệu đính kèm<br/>9. Hệ thống gửi thông báo cho cơ quan hành chính cấp xã (Org2) |
| **Trường hợp ngoại lệ** | - Không sở hữu đầy đủ: Hệ thống thông báo thiếu quyền sở hữu<br/>- Thửa đất đang tranh chấp/thế chấp: Hệ thống thông báo "Thửa đất không thể gộp"<br/>- Diện tích không khớp: Hệ thống thông báo "Diện tích thửa mới không khớp với tổng diện tích"<br/>- Thông tin thửa mới không hợp lệ: Hệ thống yêu cầu sửa đổi |
| **Quy tắc nghiệp vụ** | - Chỉ người sử dụng đất mới có quyền tạo yêu cầu<br/>- Tất cả thửa đất phải không ở trạng thái tranh chấp hoặc thế chấp<br/>- Diện tích thửa đất mới phải bằng tổng diện tích các thửa gốc<br/>- Thông tin thửa đất mới phải hợp lệ theo quy định |

---

### **UC-27: Tạo giao dịch đổi mục đích sử dụng**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Tạo giao dịch đổi mục đích sử dụng |
| **Tác nhân** | Công dân (Org3) |
| **Mục đích** | Thay đổi mục đích sử dụng đất theo nhu cầu mới |
| **Tiền điều kiện** | - Đã đăng nhập với quyền Org3<br/>- Là người sử dụng đất hợp pháp của thửa đất<br/>- Mục đích mới phải được phép theo quy hoạch<br/>- Thửa đất không ở trạng thái tranh chấp hoặc thế chấp |
| **Kết quả đạt được** | - Yêu cầu đổi mục đích được tạo thành công<br/>- Hồ sơ đề xuất được lưu trữ<br/>- Cơ quan có thẩm quyền nhận thông báo<br/>- Quy trình thẩm định được bắt đầu |
| **Quy trình thực hiện** | 1. Chủ sử dụng chọn thửa đất cần đổi mục đích<br/>2. Chủ sử dụng chọn mục đích sử dụng mới<br/>3. Chủ sử dụng nhập lý do và kế hoạch sử dụng<br/>4. Chủ sử dụng tải lên/chọn và liên kết các tài liệu bắt buộc cho hồ sơ giao dịch (UC-18)<br/>5. Hệ thống kiểm tra quyền sở hữu và trạng thái thửa đất<br/>6. Hệ thống kiểm tra thửa đất không ở trạng thái tranh chấp/thế chấp<br/>7. Hệ thống kiểm tra tính phù hợp của mục đích mới<br/>8. Hệ thống tạo yêu cầu đổi mục đích kèm danh sách tài liệu đính kèm<br/>9. Hệ thống gửi thông báo cho cơ quan hành chính cấp xã (Org2) |
| **Trường hợp ngoại lệ** | - Không phải người sử dụng đất: Hệ thống từ chối tạo yêu cầu<br/>- Thửa đất đang tranh chấp/thế chấp: Hệ thống thông báo "Thửa đất không thể đổi mục đích"<br/>- Mục đích không được phép: Hệ thống thông báo "Mục đích không phù hợp quy hoạch"<br/>- Thửa đất đang giao dịch: Hệ thống từ chối tạo yêu cầu |
| **Quy tắc nghiệp vụ** | - Chỉ người sử dụng đất mới có quyền tạo yêu cầu<br/>- Thửa đất phải không ở trạng thái tranh chấp hoặc thế chấp<br/>- Mục đích mới phải tuân thủ quy hoạch địa phương<br/>- Phải đóng phí chuyển đổi theo quy định |

---

### **UC-28: Tạo giao dịch cấp lại GCN**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Tạo giao dịch cấp lại GCN |
| **Tác nhân** | Công dân (Org3) |
| **Mục đích** | Xin cấp lại GCN khi bị mất, hư hỏng hoặc cần cập nhật |
| **Tiền điều kiện** | - Đã đăng nhập với quyền Org3<br/>- Là người sử dụng đất hợp pháp của thửa đất<br/>- Có lý do chính đáng để cấp lại<br/>- Thửa đất không ở trạng thái tranh chấp hoặc thế chấp |
| **Kết quả đạt được** | - Yêu cầu cấp lại GCN được tạo thành công<br/>- Lý do cấp lại được ghi nhận<br/>- Cơ quan có thẩm quyền nhận thông báo<br/>- Quy trình xử lý được bắt đầu |
| **Quy trình thực hiện** | 1. Chủ sử dụng chọn thửa đất cần cấp lại GCN<br/>2. Chủ sử dụng chọn lý do: mất, hư hỏng, thay đổi thông tin<br/>3. Chủ sử dụng nhập mô tả chi tiết về lý do<br/>4. Chủ sử dụng tải lên/chọn và liên kết các tài liệu bắt buộc cho hồ sơ giao dịch (UC-18)<br/>5. Hệ thống kiểm tra quyền sở hữu và trạng thái thửa đất<br/>6. Hệ thống kiểm tra thửa đất không ở trạng thái tranh chấp/thế chấp<br/>7. Hệ thống tạo yêu cầu cấp lại GCN kèm danh sách tài liệu đính kèm<br/>8. Hệ thống gửi thông báo cho cơ quan hành chính cấp xã (Org2) |
| **Trường hợp ngoại lệ** | - Không phải người sử dụng đất: Hệ thống từ chối tạo yêu cầu<br/>- Thửa đất đang tranh chấp/thế chấp: Hệ thống thông báo "Thửa đất không thể cấp lại GCN"<br/>- Lý do không hợp lệ: Hệ thống yêu cầu làm rõ<br/>- Đã có yêu cầu đang xử lý: Hệ thống thông báo trùng lặp |
| **Quy tắc nghiệp vụ** | - Chỉ người sử dụng đất mới có quyền tạo yêu cầu<br/>- Thửa đất phải không ở trạng thái tranh chấp hoặc thế chấp<br/>- Phải có bằng chứng cho lý do cấp lại<br/>- Phí cấp lại theo quy định của địa phương |

---


### **UC-29: Xem chi tiết giao dịch**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Xem chi tiết giao dịch |
| **Tác nhân** | Tất cả người dùng |
| **Mục đích** | Xem đầy đủ thông tin và trạng thái hiện tại của giao dịch |
| **Tiền điều kiện** | - Đã đăng nhập vào hệ thống<br/>- Có mã giao dịch cần xem<br/>- Có quyền xem giao dịch này |
| **Kết quả đạt được** | - Thông tin đầy đủ của giao dịch được hiển thị<br/>- Lịch sử xử lý được xem<br/>- Tài liệu liên quan được liệt kê<br/>- Trạng thái hiện tại được kiểm tra |
| **Quy trình thực hiện** | 1. Người dùng chọn giao dịch để xem chi tiết<br/>2. Hệ thống kiểm tra quyền truy cập của người dùng<br/>3. Hệ thống tải thông tin chi tiết từ blockchain<br/>4. Hệ thống hiển thị thông tin cơ bản: mã giao dịch, loại, trạng thái, ngày tạo<br/>5. Hệ thống hiển thị thông tin các bên tham gia<br/>6. Hệ thống hiển thị thông tin thửa đất liên quan<br/>7. Hệ thống hiển thị danh sách tài liệu đã liên kết|
| **Trường hợp ngoại lệ** | - Giao dịch không tồn tại: Hệ thống thông báo "Giao dịch không tìm thấy"<br/>- Không có quyền xem: Hệ thống từ chối truy cập<br/>- Lỗi tải dữ liệu: Hệ thống thông báo lỗi |
| **Quy tắc nghiệp vụ** | - Thông tin được lấy trực tiếp từ blockchain<br/>- Người dùng chỉ xem được giao dịch được phép theo quyền hạn<br/>- Lịch sử hiển thị theo thứ tự thời gian mới nhất<br/>- Chỉ hiển thị tài liệu đã được liên kết |

---

### **UC-30: Xác nhận nhận chuyển nhượng đất**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Xác nhận nhận chuyển nhượng đất |
| **Tác nhân** | Công dân (Org3) |
| **Mục đích** | Bên nhận quyết định đồng ý hoặc từ chối nhận chuyển nhượng thửa đất |
| **Tiền điều kiện** | - Đã đăng nhập với quyền Org3<br/>- Được chỉ định là bên nhận trong yêu cầu chuyển nhượng<br/>- Giao dịch chuyển nhượng đã được cán bộ cấp xã thẩm định và chuyển tiếp<br/>- Nhận được thông báo về yêu cầu xác nhận |
| **Kết quả đạt được** | - Quyết định của bên nhận được ghi nhận và thông báo<br/>- Giao dịch tiếp tục quy trình nếu được chấp nhận<br/>- Giao dịch kết thúc nếu bị từ chối<br/>- Bên chuyển nhượng được thông báo về quyết định |
| **Quy trình thực hiện** | 1. Bên nhận truy cập hệ thống và xem danh sách giao dịch liên quan<br/>2. Bên nhận xem chi tiết yêu cầu chuyển nhượng được gửi đến mình<br/>3. Bên nhận xem xét thông tin thửa đất, điều kiện chuyển nhượng và tài liệu đính kèm<br/>4. Bên nhận đưa ra quyết định: Đồng ý hoặc Từ chối<br/>5. Nếu từ chối, bên nhận có thể ghi rõ lý do<br/>6. Hệ thống ghi nhận quyết định của bên nhận<br/>7. Hệ thống thông báo cho bên chuyển nhượng về quyết định<br/>8. Hệ thống thông báo cho cán bộ cấp xã (Org2) để tiếp tục xử lý hồ sơ (nếu được chấp nhận) |
| **Trường hợp ngoại lệ** | - Từ chối nhận chuyển nhượng: Hệ thống kết thúc giao dịch và thông báo cho các bên<br/>- Quá thời hạn xác nhận: Hệ thống tự động hủy giao dịch<br/>- Không có quyền xác nhận: Hệ thống từ chối truy cập |
| **Quy tắc nghiệp vụ** | - Chỉ bên nhận được chỉ định mới có quyền xác nhận<br/>- Thời hạn xác nhận là 7 ngày kể từ khi nhận thông báo<br/>- Sau khi xác nhận không thể thay đổi quyết định<br/>- Quyết định từ chối phải có lý do rõ ràng<br/>- Thông báo được gửi tự động cho các bên liên quan |

---


### **UC-31: Xử lý hồ sơ giao dịch**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Xử lý hồ sơ giao dịch |
| **Tác nhân** | Cán bộ hành chính cấp xã (Org2) |
| **Mục đích** | Thẩm định tính hợp lệ của giao dịch và hồ sơ; có thể xác nhận đạt yêu cầu và chuyển tiếp, yêu cầu bổ sung, hoặc từ chối hồ sơ |
| **Tiền điều kiện** | - Đã đăng nhập với quyền cán bộ cấp xã<br/>- Đã xem chi tiết giao dịch (UC-29)<br/>- Giao dịch đang chờ xử lý<br/>- Giao dịch đã được xác nhận bởi các bên (nếu là chuyển nhượng) |
| **Kết quả đạt được** | - Giao dịch được thẩm định và đánh giá toàn diện<br/>- Hồ sơ được kiểm tra tính đầy đủ; từng tài liệu đính kèm được xác minh hoặc từ chối với lý do<br/>- Giao dịch được cập nhật với một trong 3 trạng thái: **Xác nhận đạt yêu cầu và chuyển tiếp**, **Yêu cầu bổ sung**, hoặc **Từ chối hồ sơ**<br/>- Giao dịch đạt yêu cầu được chuyển tiếp lên Sở TN&MT để phê duyệt<br/>- Giao dịch yêu cầu bổ sung kích hoạt UC-18 cho Org3 |
| **Quy trình thực hiện** | 1. Cán bộ cấp xã xem chi tiết giao dịch cần xử lý (UC-29)<br/>2. Cán bộ kiểm tra danh sách tài liệu đã liên kết; thực hiện xác minh hoặc từ chối từng tài liệu kèm lý do<br/>3. Cán bộ đánh giá tính hợp lệ tổng thể của hồ sơ giao dịch sau khi xử lý tài liệu<br/>4. Cán bộ quyết định một trong 3 lựa chọn:<br/>   - **Xác nhận đạt yêu cầu**: Tất cả tài liệu hợp lệ → chuyển tiếp lên Sở TN&MT<br/>   - **Yêu cầu bổ sung**: Thiếu tài liệu/tài liệu không hợp lệ → kích hoạt UC-18 cho Org3<br/>   - **Từ chối hồ sơ**: Hồ sơ không đủ điều kiện hoặc không hợp lệ<br/>5. Hệ thống cập nhật trạng thái giao dịch theo quyết định<br/>6. Hệ thống gửi thông báo cho các bên liên quan về kết quả thẩm định |
| **Trường hợp ngoại lệ** | - Giao dịch không đang chờ xử lý: Hệ thống từ chối xử lý<br/>- Không có quyền xử lý: Hệ thống từ chối truy cập<br/>- Lỗi hệ thống: Thông báo lỗi và cho phép thử lại |
| **Quy tắc nghiệp vụ** | - Chỉ cán bộ cấp xã mới có quyền xử lý giao dịch<br/>- Chỉ xử lý được giao dịch đang ở trạng thái chờ xử lý<br/>- Có 3 trạng thái xử lý rõ ràng: **Xác nhận đạt yêu cầu**, **Yêu cầu bổ sung**, **Từ chối hồ sơ**<br/>- Trạng thái "Yêu cầu bổ sung" kích hoạt UC-18 cho phép Org3 liên kết tài liệu bổ sung<br/>- Chỉ khi hồ sơ đầy đủ và hợp lệ thì giao dịch mới được chuyển tiếp<br/>- Quyết định xử lý phải có lý do rõ ràng và được ghi nhận |

---


### **UC-32: Phê duyệt giao dịch chuyển nhượng**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Phê duyệt giao dịch chuyển nhượng |
| **Tác nhân** | Cán bộ Sở TN&MT (Org1) |
| **Mục đích** | Xác nhận và hoàn thành quy trình chuyển nhượng |
| **Tiền điều kiện** | - Đã đăng nhập với quyền cán bộ Sở TN&MT<br/>- Giao dịch đã được chuyển tiếp từ cấp xã<br/>- Giao dịch loại chuyển nhượng |
| **Kết quả đạt được** | - Quyền sở hữu được chuyển đổi chính thức<br/>- Hệ thống được cập nhật thông tin mới<br/>- Giao dịch được chuyển sang trạng thái đã phê duyệt<br/>- Các bên nhận thông báo hoàn thành |
| **Quy trình thực hiện** | 1. Cán bộ Sở TN&MT xem chi tiết giao dịch cần phê duyệt (UC-29)<br/>2. Hệ thống kiểm tra giao dịch đã được chuyển tiếp và loại chuyển nhượng<br/>3. Hệ thống kiểm tra quyền sở hữu thửa đất<br/>4. Hệ thống vô hiệu hóa giấy chứng nhận cũ<br/>5. Hệ thống cập nhật người sử dụng đất mới<br/>6. Hệ thống cập nhật trạng thái giao dịch sang đã phê duyệt<br/>7. Hệ thống gửi thông báo cho bên chuyển nhượng (Org3)<br/>8. Hệ thống gửi thông báo cho bên nhận chuyển nhượng (Org3)<br/>9. Hệ thống gửi thông báo cho cơ quan hành chính cấp xã (Org2) |
| **Trường hợp ngoại lệ** | - Giao dịch chưa được chuyển tiếp: Hệ thống từ chối phê duyệt<br/>- Giao dịch không phải loại chuyển nhượng: Hệ thống từ chối phê duyệt<br/>- Không phải người sử dụng đất: Hệ thống từ chối phê duyệt<br/>- Lỗi cập nhật: Hệ thống báo lỗi |
| **Quy tắc nghiệp vụ** | - Chỉ Sở TN&MT mới có quyền phê duyệt cuối cùng<br/>- Chỉ phê duyệt được giao dịch đã được chuyển tiếp<br/>- Phê duyệt tạo ra thay đổi bất biến trên hệ thống |

---

### **UC-33: Phê duyệt giao dịch tách thửa**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Phê duyệt giao dịch tách thửa |
| **Tác nhân** | Cán bộ Sở TN&MT (Org1) |
| **Mục đích** | Xác nhận và thực hiện việc tách thửa đất |
| **Tiền điều kiện** | - Đã đăng nhập với quyền Org1<br/>- Kế hoạch tách đã được thẩm định<br/>- Đã hoàn thành khảo sát thực địa |
| **Kết quả đạt được** | - Thửa đất gốc được đánh dấu đã tách<br/>- Các thửa đất mới được tạo trên blockchain<br/>- Chủ sử dụng nhận thông báo hoàn thành |
| **Quy trình thực hiện** | 1. Cán bộ Org1 xem chi tiết giao dịch tách thửa đã thẩm định (UC-29)<br/>2. Cán bộ kiểm tra kết quả khảo sát thực địa<br/>3. Cán bộ xác nhận kế hoạch tách phù hợp<br/>4. Cán bộ phê duyệt tách thửa<br/>5. Hệ thống vô hiệu hóa giấy chứng nhận cũ của thửa gốc<br/>6. Hệ thống đánh dấu thửa gốc đã tách<br/>7. Hệ thống tạo các thửa đất mới với mã riêng<br/>8. Hệ thống gửi thông báo hoàn thành cho chủ sử dụng đất (Org3)<br/>9. Hệ thống gửi thông báo cho cơ quan hành chính cấp xã (Org2) |
| **Trường hợp ngoại lệ** | - Kế hoạch tách không phù hợp: Chuyển sang UC-36 (Từ chối)<br/>- Lỗi tạo thửa mới: Hệ thống báo lỗi và hoàn tác<br/>- Diện tích không khớp: Hệ thống yêu cầu kiểm tra lại |
| **Quy tắc nghiệp vụ** | - Tổng diện tích các thửa mới phải bằng thửa gốc<br/>- Mỗi thửa mới có mã số riêng biệt<br/>- Thửa gốc không thể sử dụng sau khi tách |

---

### **UC-34: Phê duyệt giao dịch gộp thửa**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Phê duyệt giao dịch gộp thửa |
| **Tác nhân** | Cán bộ Sở TN&MT (Org1) |
| **Mục đích** | Xác nhận và thực hiện việc gộp nhiều thửa thành một |
| **Tiền điều kiện** | - Đã đăng nhập với quyền Org1<br/>- Kế hoạch gộp đã được thẩm định<br/>- Đã hoàn thành khảo sát thực địa |
| **Kết quả đạt được** | - Các thửa đất cũ được đánh dấu đã gộp<br/>- Thửa đất mới được tạo trên blockchain<br/>- Chủ sử dụng nhận thông báo hoàn thành |
| **Quy trình thực hiện** | 1. Cán bộ Org1 xem chi tiết giao dịch gộp thửa đã thẩm định (UC-29)<br/>2. Cán bộ kiểm tra kết quả khảo sát thực địa<br/>3. Cán bộ xác nhận kế hoạch gộp phù hợp<br/>4. Cán bộ phê duyệt gộp thửa<br/>5. Hệ thống vô hiệu hóa giấy chứng nhận cũ của các thửa đất gốc<br/>6. Hệ thống đánh dấu các thửa cũ đã gộp<br/>7. Hệ thống tạo thửa đất mới với thông tin gộp<br/>8. Hệ thống gửi thông báo hoàn thành cho chủ sử dụng đất (Org3)<br/>9. Hệ thống gửi thông báo cho cơ quan hành chính cấp xã (Org2) |
| **Trường hợp ngoại lệ** | - Kế hoạch gộp không phù hợp: Chuyển sang UC-36 (Từ chối)<br/>- Lỗi tạo thửa mới: Hệ thống báo lỗi và hoàn tác<br/>- Diện tích không khớp: Hệ thống yêu cầu kiểm tra lại |
| **Quy tắc nghiệp vụ** | - Diện tích thửa mới bằng tổng diện tích các thửa cũ<br/>- Các thửa cũ không thể sử dụng sau khi gộp<br/>- Thửa mới có mã số hoàn toàn mới |

---

### **UC-35: Phê duyệt giao dịch đổi mục đích**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Phê duyệt giao dịch đổi mục đích |
| **Tác nhân** | Cán bộ Sở TN&MT (Org1) |
| **Mục đích** | Xác nhận và thực hiện thay đổi mục đích sử dụng |
| **Tiền điều kiện** | - Đã đăng nhập với quyền Org1<br/>- Đề xuất đổi mục đích đã được thẩm định<br/>- Phù hợp với quy hoạch địa phương |
| **Kết quả đạt được** | - Mục đích sử dụng được cập nhật trên blockchain<br/>- Giấy chứng nhận cũ được vô hiệu hóa<br/>- Phí chuyển đổi được ghi nhận<br/>- Chủ sử dụng nhận thông báo hoàn thành |
| **Quy trình thực hiện** | 1. Cán bộ Org1 xem chi tiết giao dịch đổi mục đích đã thẩm định (UC-29)<br/>2. Cán bộ kiểm tra tính phù hợp với quy hoạch<br/>3. Cán bộ xác nhận phí chuyển đổi đã đóng<br/>4. Cán bộ phê duyệt đổi mục đích<br/>5. Hệ thống vô hiệu hóa giấy chứng nhận cũ<br/>6. Hệ thống cập nhật mục đích sử dụng trên blockchain<br/>7. Hệ thống gửi thông báo hoàn thành cho chủ sử dụng đất (Org3)<br/>8. Hệ thống gửi thông báo cho cơ quan hành chính cấp xã (Org2) |
| **Trường hợp ngoại lệ** | - Không phù hợp quy hoạch: Chuyển sang UC-36 (Từ chối)<br/>- Chưa đóng phí: Hệ thống yêu cầu hoàn thành thanh toán<br/>- Lỗi cập nhật: Hệ thống báo lỗi và hoàn tác |
| **Quy tắc nghiệp vụ** | - Phải tuân thủ nghiêm ngặt quy hoạch<br/>- Phí chuyển đổi phải được thanh toán đầy đủ<br/>- Thay đổi được ghi nhận vĩnh viễn |

---

### **UC-36: Phê duyệt giao dịch cấp lại GCN**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Phê duyệt giao dịch cấp lại GCN |
| **Tác nhân** | Cán bộ Sở TN&MT (Org1) |
| **Mục đích** | Xác nhận và cấp lại GCN cho người sử dụng đất |
| **Tiền điều kiện** | - Đã đăng nhập với quyền Org1<br/>- Yêu cầu cấp lại đã được xác minh<br/>- Lý do cấp lại được chấp nhận |
| **Kết quả đạt được** | - Thửa đất được cập nhật với GCN mới<br/>- Thông tin cấp lại được ghi nhận<br/>- Chủ sử dụng nhận thông báo hoàn thành |
| **Quy trình thực hiện** | 1. Cán bộ Org1 xem chi tiết giao dịch cấp lại GCN (UC-29)<br/>2. Cán bộ kiểm tra lý do và bằng chứng<br/>3. Cán bộ xác nhận quyền sở hữu hiện tại<br/>4. Cán bộ nhập số seri GCN mới và số vào sổ cấp GCN<br/>5. Cán bộ upload file GCN mới lên IPFS<br/>6. Cán bộ nhập thông tin pháp lý cho GCN mới<br/>7. Cán bộ phê duyệt cấp lại GCN<br/>8. Hệ thống cập nhật thửa đất với IPFS hash và thông tin pháp lý mới<br/>9. Hệ thống ghi nhận lý do và thời gian cấp lại<br/>10. Hệ thống gửi thông báo hoàn thành cho chủ sử dụng đất (Org3)<br/>11. Hệ thống gửi thông báo cho cơ quan hành chính cấp xã (Org2) |
| **Trường hợp ngoại lệ** | - Lý do không hợp lệ: Chuyển sang UC-37 (Từ chối)<br/>- Không xác minh được quyền sở hữu: Hệ thống yêu cầu bổ sung<br/>- Số seri hoặc số vào sổ không hợp lệ: Hệ thống yêu cầu nhập lại<br/>- File GCN không hợp lệ: Hệ thống yêu cầu upload lại<br/>- Thông tin pháp lý không đầy đủ: Hệ thống yêu cầu bổ sung<br/>- Lỗi upload lên IPFS: Hệ thống báo lỗi |
| **Quy tắc nghiệp vụ** | - Phải có bằng chứng rõ ràng cho lý do cấp lại<br/>- GCN mới có giá trị pháp lý đầy đủ<br/>- Phí cấp lại theo quy định |

---

### **UC-37: Từ chối giao dịch**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Từ chối giao dịch |
| **Tác nhân** | Cán bộ Sở TN&MT (Org1) |
| **Mục đích** | Từ chối các giao dịch không đáp ứng yêu cầu |
| **Tiền điều kiện** | - Đã đăng nhập với quyền cán bộ Sở TN&MT<br/>- Giao dịch đã được chuyển tiếp từ cấp xã<br/>- Có lý do rõ ràng để từ chối |
| **Kết quả đạt được** | - Giao dịch được đánh dấu bị từ chối<br/>- Lý do từ chối được ghi rõ<br/>- Giao dịch được chuyển sang trạng thái bị từ chối<br/>- Các bên liên quan nhận thông báo |
| **Quy trình thực hiện** | 1. Cán bộ Sở TN&MT xem chi tiết giao dịch cần từ chối (UC-29)<br/>2. Cán bộ nhập lý do từ chối chi tiết<br/>3. Cán bộ xác nhận quyết định từ chối<br/>4. Hệ thống cập nhật trạng thái giao dịch sang bị từ chối<br/>5. Hệ thống ghi nhận lý do từ chối<br/>6. Hệ thống gửi thông báo cho chủ sử dụng đất (Org3)<br/>7. Hệ thống gửi thông báo cho cơ quan hành chính cấp xã (Org2) |
| **Trường hợp ngoại lệ** | - Chưa có lý do rõ ràng: Hệ thống yêu cầu nhập lý do<br/>- Không có quyền từ chối: Hệ thống từ chối thao tác<br/>- Giao dịch đã được xử lý: Hệ thống thông báo trạng thái |
| **Quy tắc nghiệp vụ** | - Phải có lý do rõ ràng khi từ chối<br/>- Người gửi có quyền nộp lại sau khi sửa<br/>- Lịch sử từ chối được lưu trữ |

---

### **UC-38: Tìm kiếm giao dịch**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Tìm kiếm giao dịch |
| **Tác nhân** | Tất cả người dùng |
| **Mục đích** | Tra cứu giao dịch nhanh chóng và chính xác theo nhiều tiêu chí |
| **Tiền điều kiện** | - Đã đăng nhập vào hệ thống<br/>- Có ít nhất một tiêu chí tìm kiếm |
| **Kết quả đạt được** | - Danh sách giao dịch phù hợp được hiển thị<br/>- Thông tin cơ bản của mỗi giao dịch được xem<br/>- Có thể xem chi tiết từng giao dịch |
| **Quy trình thực hiện** | 1. Người dùng nhập tiêu chí tìm kiếm: mã giao dịch, loại giao dịch, trạng thái<br/>2. Người dùng có thể tìm theo: thửa đất, người sử dụng đất, ngày tạo, ngày xử lý<br/>3. Hệ thống tìm kiếm trong cơ sở dữ liệu blockchain<br/>4. Hệ thống lọc kết quả theo quyền truy cập<br/>5. Hệ thống hiển thị danh sách kết quả<br/>6. Hệ thống cho phép sắp xếp theo ngày tạo, trạng thái<br/>7. Hệ thống hỗ trợ phân trang nếu có nhiều kết quả<br/>8. Người dùng có thể chọn xem chi tiết giao dịch |
| **Trường hợp ngoại lệ** | - Không tìm thấy kết quả: Hệ thống thông báo "Không tìm thấy giao dịch phù hợp"<br/>- Tiêu chí không hợp lệ: Hệ thống yêu cầu nhập lại<br/>- Lỗi truy vấn: Hệ thống thông báo lỗi |
| **Quy tắc nghiệp vụ** | - Chỉ tìm được giao dịch có quyền truy cập<br/>- Kết quả được giới hạn 100 bản ghi<br/>- Hỗ trợ tìm kiếm mờ cho mã giao dịch<br/>- Tích hợp các chức năng: xem theo thửa đất, xem theo người sử dụng đất, xem tất cả giao dịch |

### **UC-39: Xem lịch sử thay đổi của giao dịch**

| **Thuộc tính** | **Mô tả** |
|----------------|-----------|
| **Tên chức năng** | Xem lịch sử thay đổi của giao dịch |
| **Tác nhân** | Tất cả người dùng |
| **Mục đích** | Theo dõi quá trình xử lý và thay đổi trạng thái của giao dịch theo thời gian |
| **Tiền điều kiện** | - Đã đăng nhập vào hệ thống<br/>- Đã xem chi tiết giao dịch (UC-29)<br/>- Có quyền xem lịch sử giao dịch này |
| **Kết quả đạt được** | - Lịch sử đầy đủ các thay đổi trạng thái được hiển thị<br/>- Thông tin về mỗi lần xử lý được xem chi tiết<br/>- Thời gian và người thực hiện được ghi rõ<br/>- Ghi chú và lý do thay đổi được hiển thị |
| **Quy trình thực hiện** | 1. Người dùng đang xem chi tiết giao dịch (UC-29)<br/>2. Người dùng chọn tab "Lịch sử xử lý" hoặc nút "Xem lịch sử"<br/>3. Hệ thống kiểm tra quyền truy cập lịch sử giao dịch<br/>4. Hệ thống truy vấn lịch sử xử lý từ blockchain<br/>5. Hệ thống hiển thị timeline các thay đổi theo thứ tự thời gian<br/>6. Hệ thống hiển thị chi tiết từng bước: trạng thái cũ/mới, người thực hiện, thời gian, ghi chú |
| **Trường hợp ngoại lệ** | - Giao dịch không có lịch sử thay đổi: Hệ thống thông báo "Chưa có thay đổi nào"<br/>- Không có quyền xem lịch sử: Hệ thống từ chối truy cập<br/>- Lỗi truy vấn blockchain: Hệ thống thông báo lỗi |
| **Quy tắc nghiệp vụ** | - Lịch sử xử lý được lưu trữ bất biến trên blockchain<br/>- Org3 chỉ xem được lịch sử giao dịch thuộc quyền sở hữu<br/>- Org1, Org2 có thể xem lịch sử tất cả giao dịch trong phạm vi quản lý<br/>- Mỗi lần thay đổi trạng thái đều có timestamp, người thực hiện và lý do|

---

