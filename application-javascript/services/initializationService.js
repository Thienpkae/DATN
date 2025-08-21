'use strict';

const User = require('../models/User');
const { enrollUserInFabricCA } = require('./authService');

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

                // Enroll admin identity in Fabric CA
                try {
                    await enrollUserInFabricCA({
                        cccd: adminData.cccd,
                        fullName: adminData.fullName,
                        org: adminData.org,
                        role: adminData.role
                    });
                    console.log(`✅ Enrolled admin identity for ${adminData.org}: ${adminData.cccd}`);
                } catch (enrollError) {
                    console.error(`❌ Failed to enroll admin identity for ${adminData.org}: ${enrollError.message}`);
                }
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
      { mapSheet: 1, user: 'UBND xã', cccd: '001000000022', phone: '0901234567' },
      { mapSheet: 1, user: 'UBND xã', cccd: '001000000023', phone: '0901234568' },
      { mapSheet: 1, user: 'Bùi Văn Dậu', cccd: '001204037324', phone: '0901234569' },
      { mapSheet: 1, user: 'Bùi Mạnh Thắng', cccd: '001204037325', phone: '0901234570' },
      { mapSheet: 1, user: 'Tạ Thị Thơm', cccd: '001204037326', phone: '0901234571' },
      { mapSheet: 1, user: 'Bùi Văn Đệ', cccd: '001204037327', phone: '0901234572' },
      { mapSheet: 1, user: 'UBND xã', cccd: '001000000028', phone: '0901234573' },
      { mapSheet: 1, user: 'Nguyễn Văn Minh', cccd: '001204037329', phone: '0901234574' },
      { mapSheet: 1, user: 'Nguyễn Hữu Hợi', cccd: '001204037330', phone: '0901234575' },
      { mapSheet: 1, user: 'Nguyễn Thị Nhu', cccd: '001204037331', phone: '0901234576' },
      { mapSheet: 1, user: 'Bùi Văn Bình', cccd: '001204037332', phone: '0901234577' },
      { mapSheet: 2, user: 'Nguyễn Hữu Thắng', cccd: '001204037333', phone: '0901234578' },
      { mapSheet: 2, user: 'UBND xã', cccd: '001000000034', phone: '0901234579' },
      { mapSheet: 3, user: 'Nguyễn Thị Yến', cccd: '001204037335', phone: '0901234580' },
      { mapSheet: 3, user: 'UBND xã', cccd: '001000000036', phone: '0901234581' },
      { mapSheet: 4, user: 'UBND xã', cccd: '001000000037', phone: '0901234582' },
      { mapSheet: 5, user: 'Bùi Mạnh Hưng', cccd: '001204037338', phone: '0901234583' },
      { mapSheet: 6, user: 'UBND xã', cccd: '001000000039', phone: '0901234584' },
      { mapSheet: 6, user: 'Nguyễn Xuân Thuỷ', cccd: '001204037340', phone: '0901234585' },
      { mapSheet: 7, user: 'Nguyễn Hữu Sông', cccd: '001204037341', phone: '0901234586' },
      { mapSheet: 7, user: 'Nguyễn Xuân Trường', cccd: '001204037342', phone: '0901234587' },
      { mapSheet: 8, user: 'Chu Văn Cát', cccd: '001204037343', phone: '0901234588' },
      { mapSheet: 8, user: 'Nguyễn Đăng Sơn', cccd: '001204037344', phone: '0901234589' },
      { mapSheet: 9, user: 'Nguyễn Đăng Thư', cccd: '001204037345', phone: '0901234590' },
      { mapSheet: 10, user: 'Nguyễn Hữu Thắng', cccd: '001204037346', phone: '0901234591' },
      { mapSheet: 10, user: 'Cty CPXK thực phẩm', cccd: '001204037347', phone: '0901234592' },
      { mapSheet: 10, user: 'Công ty TNHH Minh Phát', cccd: '001204037348', phone: '0901234593' },
      { mapSheet: 11, user: 'Hợp Tác Xã', cccd: '001204037349', phone: '0901234594' },
      { mapSheet: 11, user: 'Nguyễn Văn Hữu', cccd: '001204037350', phone: '0901234595' },
      { mapSheet: 11, user: 'Bùi Văn Nở', cccd: '001204037352', phone: '0901234597' },
      { mapSheet: 11, user: 'Trần Thị Bạch Tuyết', cccd: '001204037353', phone: '0901234598' },
      { mapSheet: 12, user: 'Bùi Thị Lợi', cccd: '001204037354', phone: '0901234599' },
      { mapSheet: 12, user: 'Nguyễn Mạnh Kim', cccd: '001204037355', phone: '0901234600' },
      { mapSheet: 13, user: 'Phạm Minh Thắng', cccd: '001204037356', phone: '0901234601' },
      { mapSheet: 14, user: 'Chu Văn Hè', cccd: '001204037357', phone: '0901234602' },
      { mapSheet: 14, user: 'Chu Văn Việt', cccd: '001204037358', phone: '0901234603' },
      { mapSheet: 15, user: 'Phạm Văn Chung', cccd: '001204037359', phone: '0901234604' },
      { mapSheet: 15, user: 'Nguyễn Văn Chiến', cccd: '001204037360', phone: '0901234605' },
      { mapSheet: 16, user: 'Bùi Thị Nhâm', cccd: '001204037361', phone: '0901234606' },
      { mapSheet: 17, user: 'Nguyễn Văn Tước', cccd: '001204037362', phone: '0901234607' },
      { mapSheet: 18, user: 'Nguyễn Văn Liên', cccd: '001204037363', phone: '0901234608' },
      { mapSheet: 18, user: 'Bùi Thị Lan', cccd: '001204037364', phone: '0901234609' },
      { mapSheet: 19, user: 'Bùi Vinh Viết', cccd: '001204037365', phone: '0901234610' },
      { mapSheet: 19, user: 'Tạ Đăng Bình', cccd: '001204037367', phone: '0901234612' },
      { mapSheet: 19, user: 'Tạ Thị Đậm', cccd: '001204037368', phone: '0901234613' },
      { mapSheet: 20, user: 'Nguyễn Văn Quảng', cccd: '001204037369', phone: '0901234614' },
      { mapSheet: 20, user: 'Nguyễn Hữu Bách', cccd: '001204037370', phone: '0901234615' },
      { mapSheet: 20, user: 'Nguyễn Kiến Thức', cccd: '001204037371', phone: '0901234616' },
      { mapSheet: 20, user: 'Nguyễn Văn Doãn', cccd: '001204037372', phone: '0901234617' },
      { mapSheet: 21, user: 'Nguyễn Thị Yến', cccd: '001204037373', phone: '0901234618' },
      { mapSheet: 21, user: 'Nguyễn Thị Thanh', cccd: '001204037374', phone: '0901234619' },
      { mapSheet: 21, user: 'Ngô Văn Ích', cccd: '001204037375', phone: '0901234620' },
      { mapSheet: 22, user: 'Bùi Thị Năm', cccd: '001204037376', phone: '0901234621' },
      { mapSheet: 23, user: 'Cty CP Xây Dựng Số 1', cccd: '001204037377', phone: '0901234622' },
      { mapSheet: 23, user: 'Cty CNHH Gia Nhất', cccd: '001204037378', phone: '0901234623' }
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

    // Lưu vào database và enroll identity
    for (const userData of userAccounts) {
      const existingUser = await User.findOne({ cccd: userData.cccd });
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        console.log(`✅ Created user account for ${userData.fullName}: ${userData.cccd}`);

        // Enroll user identity in Fabric CA
        try {
          await enrollUserInFabricCA({
            cccd: userData.cccd,
            fullName: userData.fullName,
            org: userData.org,
            role: userData.role
          });
          console.log(`✅ Enrolled user identity for ${userData.fullName}: ${userData.cccd} \n`);
        } catch (enrollError) {
          console.error(`❌ Failed to enroll user identity for ${userData.fullName}: ${enrollError.message}`);
        }
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
