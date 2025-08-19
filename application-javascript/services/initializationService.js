'use strict';

const User = require('../models/User');

/**
 * Initialize admin accounts for each organization
 */
async function initializeAdminAccounts() {
    try {
        console.log('Checking for admin accounts...');

        const adminAccounts = [
            {
                cccd: '000000000001',
                phone: '0900000001',
                fullName: 'Admin Organization 1',
                org: 'Org1',
                role: 'admin',
                password: 'Admin123!',
                isPhoneVerified: true,
                isLocked: false
            },
            {
                cccd: '000000000002',
                phone: '0900000002',
                fullName: 'Admin Organization 2',
                org: 'Org2',
                role: 'admin',
                password: 'Admin123!',
                isPhoneVerified: true,
                isLocked: false
            },
            {
                cccd: '000000000003',
                phone: '0900000003',
                fullName: 'Admin Organization 3',
                org: 'Org3',
                role: 'admin',
                password: 'Admin123!',
                isPhoneVerified: true,
                isLocked: false
            }
        ];

        for (const adminData of adminAccounts) {
            const existingAdmin = await User.findOne({ cccd: adminData.cccd });

            if (!existingAdmin) {
                // Create admin in MongoDB
                const admin = new User(adminData);
                await admin.save();
                console.log(`✅ Created admin account for ${adminData.org}: ${adminData.cccd}`);
            } else {
                console.log(`ℹ️  Admin account already exists for ${adminData.org}: ${adminData.cccd}`);
            }
        }

        console.log('✅ Admin accounts initialization completed');
    } catch (error) {
        console.error(`❌ Failed to initialize admin accounts: ${error.message}`);
    }
}

async function initializeUserAccounts() {
  try {
    console.log('Checking for user accounts...');

    // Dữ liệu từ bảng bản đồ số, gộp các bản ghi UBND xã theo tờ bản đồ
    const landData = [
      { mapSheet: 1, user: 'UBND xã', cccd: '0010204037322', phone: '0901234567' },
      { mapSheet: 1, user: 'UBND xã', cccd: '0010204037323', phone: '0901234568' },
      { mapSheet: 1, user: 'Bùi Văn Dậu', cccd: '0010204037324', phone: '0901234569' },
      { mapSheet: 1, user: 'Bùi Mạnh Thắng', cccd: '0010204037325', phone: '0901234570' },
      { mapSheet: 1, user: 'Tạ Thị Thơm', cccd: '0010204037326', phone: '0901234571' },
      { mapSheet: 1, user: 'Bùi Văn Đệ', cccd: '0010204037327', phone: '0901234572' },
      { mapSheet: 1, user: 'UBND xã', cccd: '0010204037328', phone: '0901234573' },
      { mapSheet: 1, user: 'Nguyễn Văn Minh', cccd: '0010204037329', phone: '0901234574' },
      { mapSheet: 1, user: 'Nguyễn Hữu Hợi', cccd: '0010204037330', phone: '0901234575' },
      { mapSheet: 1, user: 'Nguyễn Thị Nhu', cccd: '0010204037331', phone: '0901234576' },
      { mapSheet: 1, user: 'Bùi Văn Bình', cccd: '0010204037332', phone: '0901234577' },
      { mapSheet: 2, user: 'Nguyễn Hữu Thắng', cccd: '0010204037333', phone: '0901234578' },
      { mapSheet: 2, user: 'UBND xã', cccd: '0010204037334', phone: '0901234579' },
      { mapSheet: 3, user: 'Nguyễn Thị Yến', cccd: '0010204037335', phone: '0901234580' },
      { mapSheet: 3, user: 'UBND xã', cccd: '0010204037336', phone: '0901234581' },
      { mapSheet: 4, user: 'UBND xã', cccd: '0010204037337', phone: '0901234582' },
      { mapSheet: 5, user: 'Bùi Mạnh Hưng', cccd: '0010204037338', phone: '0901234583' },
      { mapSheet: 6, user: 'UBND xã', cccd: '0010204037339', phone: '0901234584' },
      { mapSheet: 6, user: 'Nguyễn Xuân Thuỷ', cccd: '0010204037340', phone: '0901234585' },
      { mapSheet: 7, user: 'Nguyễn Hữu Sông', cccd: '0010204037341', phone: '0901234586' },
      { mapSheet: 7, user: 'Nguyễn Xuân Trường', cccd: '0010204037342', phone: '0901234587' },
      { mapSheet: 8, user: 'Chu Văn Cát', cccd: '0010204037343', phone: '0901234588' },
      { mapSheet: 8, user: 'Nguyễn Đăng Sơn', cccd: '0010204037344', phone: '0901234589' },
      { mapSheet: 9, user: 'Nguyễn Đăng Thư', cccd: '0010204037345', phone: '0901234590' },
      { mapSheet: 10, user: 'Nguyễn Hữu Thắng', cccd: '0010204037346', phone: '0901234591' },
      { mapSheet: 10, user: 'Cty CPXK thực phẩm', cccd: '0010204037347', phone: '0901234592' },
      { mapSheet: 10, user: 'Công ty TNHH Minh Phát', cccd: '0010204037348', phone: '0901234593' },
      { mapSheet: 11, user: 'Hợp Tác Xã', cccd: '0010204037349', phone: '0901234594' },
      { mapSheet: 11, user: 'Nguyễn Văn Hữu', cccd: '0010204037350', phone: '0901234595' },
      { mapSheet: 11, user: 'Bùi Văn Nở', cccd: '0010204037351', phone: '0901234596' },
      { mapSheet: 11, user: 'Bùi Văn Nở', cccd: '0010204037352', phone: '0901234597' },
      { mapSheet: 11, user: 'Trần Thị Bạch Tuyết', cccd: '0010204037353', phone: '0901234598' },
      { mapSheet: 12, user: 'Bùi Thị Lợi', cccd: '0010204037354', phone: '0901234599' },
      { mapSheet: 12, user: 'Nguyễn Mạnh Kim', cccd: '0010204037355', phone: '0901234600' },
      { mapSheet: 13, user: 'Phạm Minh Thắng', cccd: '0010204037356', phone: '0901234601' },
      { mapSheet: 14, user: 'Chu Văn Hè', cccd: '0010204037357', phone: '0901234602' },
      { mapSheet: 14, user: 'Chu Văn Việt', cccd: '0010204037358', phone: '0901234603' },
      { mapSheet: 15, user: 'Phạm Văn Chung', cccd: '0010204037359', phone: '0901234604' },
      { mapSheet: 15, user: 'Nguyễn Văn Chiến', cccd: '0010204037360', phone: '0901234605' },
      { mapSheet: 16, user: 'Bùi Thị Nhâm', cccd: '0010204037361', phone: '0901234606' },
      { mapSheet: 17, user: 'Nguyễn Văn Tước', cccd: '0010204037362', phone: '0901234607' },
      { mapSheet: 18, user: 'Nguyễn Văn Liên', cccd: '0010204037363', phone: '0901234608' },
      { mapSheet: 18, user: 'Bùi Thị Lan', cccd: '0010204037364', phone: '0901234609' },
      { mapSheet: 19, user: 'Bùi Vinh Viết', cccd: '0010204037365', phone: '0901234610' },
      { mapSheet: 19, user: 'Tạ Đăng Bình', cccd: '0010204037366', phone: '0901234611' },
      { mapSheet: 19, user: 'Tạ Đăng Bình', cccd: '0010204037367', phone: '0901234612' },
      { mapSheet: 19, user: 'Tạ Thị Đậm', cccd: '0010204037368', phone: '0901234613' },
      { mapSheet: 20, user: 'Nguyễn Văn Quảng', cccd: '0010204037369', phone: '0901234614' },
      { mapSheet: 20, user: 'Nguyễn Hữu Bách', cccd: '0010204037370', phone: '0901234615' },
      { mapSheet: 20, user: 'Nguyễn Kiến Thức', cccd: '0010204037371', phone: '0901234616' },
      { mapSheet: 20, user: 'Nguyễn Văn Doãn', cccd: '0010204037372', phone: '0901234617' },
      { mapSheet: 21, user: 'Nguyễn Thị Yến', cccd: '0010204037373', phone: '0901234618' },
      { mapSheet: 21, user: 'Nguyễn Thị Thanh', cccd: '0010204037374', phone: '0901234619' },
      { mapSheet: 21, user: 'Ngô Văn Ích', cccd: '0010204037375', phone: '0901234620' },
      { mapSheet: 22, user: 'Bùi Thị Năm', cccd: '0010204037376', phone: '0901234621' },
      { mapSheet: 23, user: 'Cty CP Xây Dựng Số 1', cccd: '0010204037377', phone: '0901234622' },
      { mapSheet: 23, user: 'Cty CNHH Gia Nhất', cccd: '0010204037378', phone: '0901234623' }
    ];

    // Tạo danh sách tài khoản, chỉ giữ 1 UBND xã cho mỗi tờ bản đồ
    const uniqueUserAccounts = [];
    const seenUBNDPerSheet = new Map();

    for (const data of landData) {
      if (data.user === 'UBND xã') {
        const key = data.mapSheet;
        if (!seenUBNDPerSheet.has(key)) {
          seenUBNDPerSheet.set(key, true);
          uniqueUserAccounts.push({
            fullName: `UBND xã ${data.mapSheet}`,
            cccd: data.cccd,
            phone: data.phone,
            org: 'Org2'
          });
        }
      } else {
        uniqueUserAccounts.push({
          fullName: data.user,
          cccd: data.cccd,
          phone: data.phone,
          org: 'Org3'
        });
      }
    }

    // Thêm các trường mặc định
    const userAccounts = uniqueUserAccounts.map(user => ({
      ...user,
      role: 'user',
      password: 'User123!',
      isPhoneVerified: true,
      isLocked: false
    }));

    // Lưu vào database
    for (const userData of userAccounts) {
      const existingUser = await User.findOne({ cccd: userData.cccd });
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        console.log(`✅ Created user account for ${userData.fullName}: ${userData.cccd}`);
      } else {
        console.log(`ℹ️ User account already exists for ${userData.fullName}: ${userData.cccd}`);
      }
    }
    console.log('✅ User accounts initialization completed');
  } catch (error) {
    console.error(`❌ Failed to initialize user accounts: ${error.message}`);
  }
}

module.exports = {
    initializeAdminAccounts,
    initializeUserAccounts
};
