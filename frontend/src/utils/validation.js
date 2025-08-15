import * as Yup from 'yup';

// Common validation patterns
const PHONE_REGEX = /^[0-9]{10,11}$/;
const CCCD_REGEX = /^[0-9]{12}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Common validation messages
const VALIDATION_MESSAGES = {
  REQUIRED: 'Trường này là bắt buộc',
  INVALID_FORMAT: 'Định dạng không hợp lệ',
  MIN_LENGTH: (field, min) => `${field} phải có ít nhất ${min} ký tự`,
  MAX_LENGTH: (field, max) => `${field} không được vượt quá ${max} ký tự`,
  INVALID_PHONE: 'Số điện thoại không hợp lệ (10-11 số)',
  INVALID_CCCD: 'CCCD phải có đúng 12 số',
  INVALID_EMAIL: 'Email không hợp lệ',
  INVALID_PASSWORD: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt',
  PASSWORD_MISMATCH: 'Mật khẩu xác nhận không khớp',
  INVALID_AREA: 'Diện tích phải là số dương',
  INVALID_COORDINATES: 'Tọa độ không hợp lệ',
  INVALID_DATE: 'Ngày tháng không hợp lệ',
  FUTURE_DATE_NOT_ALLOWED: 'Không được chọn ngày trong tương lai',
  PAST_DATE_NOT_ALLOWED: 'Không được chọn ngày trong quá khứ',
};

// Land Parcel Validation Schema
export const landParcelSchema = Yup.object().shape({
  landParcelID: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .min(5, VALIDATION_MESSAGES.MIN_LENGTH('Mã thửa đất', 5))
    .max(50, VALIDATION_MESSAGES.MAX_LENGTH('Mã thửa đất', 50))
    .matches(/^[A-Z0-9_-]+$/, 'Mã thửa đất chỉ được chứa chữ hoa, số, dấu gạch dưới và gạch ngang'),

  location: Yup.object().shape({
    address: Yup.string()
      .required(VALIDATION_MESSAGES.REQUIRED)
      .min(10, VALIDATION_MESSAGES.MIN_LENGTH('Địa chỉ', 10))
      .max(200, VALIDATION_MESSAGES.MAX_LENGTH('Địa chỉ', 200)),

    district: Yup.string()
      .required(VALIDATION_MESSAGES.REQUIRED)
      .min(2, VALIDATION_MESSAGES.MIN_LENGTH('Quận/Huyện', 2))
      .max(50, VALIDATION_MESSAGES.MAX_LENGTH('Quận/Huyện', 50)),

    city: Yup.string()
      .required(VALIDATION_MESSAGES.REQUIRED)
      .min(2, VALIDATION_MESSAGES.MIN_LENGTH('Tỉnh/Thành phố', 2))
      .max(50, VALIDATION_MESSAGES.MAX_LENGTH('Tỉnh/Thành phố', 50)),

    coordinates: Yup.object().shape({
      latitude: Yup.number()
        .required(VALIDATION_MESSAGES.REQUIRED)
        .min(-90, 'Vĩ độ phải từ -90 đến 90')
        .max(90, 'Vĩ độ phải từ -90 đến 90'),

      longitude: Yup.number()
        .required(VALIDATION_MESSAGES.REQUIRED)
        .min(-180, 'Kinh độ phải từ -180 đến 180')
        .max(180, 'Kinh độ phải từ -180 đến 180'),
    }),
  }),

  area: Yup.number()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .positive(VALIDATION_MESSAGES.INVALID_AREA)
    .max(1000000, 'Diện tích không được vượt quá 1,000,000 m²'),

  purpose: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .oneOf([
      'residential',
      'agricultural',
      'commercial',
      'industrial',
      'mixed_use',
      'conservation',
      'other'
    ], 'Mục đích sử dụng không hợp lệ'),

  legalStatus: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .oneOf([
      'registered',
      'pending_registration',
      'under_review',
      'approved',
      'rejected',
      'suspended'
    ], 'Trạng thái pháp lý không hợp lệ'),

  owner: Yup.object().shape({
    cccd: Yup.string()
      .required(VALIDATION_MESSAGES.REQUIRED)
      .matches(CCCD_REGEX, VALIDATION_MESSAGES.INVALID_CCCD),

    fullName: Yup.string()
      .required(VALIDATION_MESSAGES.REQUIRED)
      .min(2, VALIDATION_MESSAGES.MIN_LENGTH('Họ tên', 2))
      .max(100, VALIDATION_MESSAGES.MAX_LENGTH('Họ tên', 100)),

    phone: Yup.string()
      .required(VALIDATION_MESSAGES.REQUIRED)
      .matches(PHONE_REGEX, VALIDATION_MESSAGES.INVALID_PHONE),

    email: Yup.string()
      .email(VALIDATION_MESSAGES.INVALID_EMAIL)
      .max(100, VALIDATION_MESSAGES.MAX_LENGTH('Email', 100)),
  }),

  description: Yup.string()
    .max(1000, VALIDATION_MESSAGES.MAX_LENGTH('Mô tả', 1000)),

  documents: Yup.array().of(
    Yup.object().shape({
      documentID: Yup.string().required(),
      documentType: Yup.string().required(),
      fileName: Yup.string().required(),
      fileSize: Yup.number().positive(),
      uploadDate: Yup.date().required(),
    })
  ),
});

// Document Validation Schema
export const documentSchema = Yup.object().shape({
  documentType: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .oneOf([
      'identity_document',
      'land_certificate',
      'survey_map',
      'ownership_proof',
      'transaction_contract',
      'other'
    ], 'Loại tài liệu không hợp lệ'),

  fileName: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .min(1, VALIDATION_MESSAGES.MIN_LENGTH('Tên file', 1))
    .max(255, VALIDATION_MESSAGES.MAX_LENGTH('Tên file', 255)),

  fileSize: Yup.number()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .positive('Kích thước file phải là số dương')
    .max(50 * 1024 * 1024, 'File không được vượt quá 50MB'),

  fileType: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .oneOf([
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ], 'Định dạng file không được hỗ trợ'),

  description: Yup.string()
    .max(500, VALIDATION_MESSAGES.MAX_LENGTH('Mô tả', 500)),

  tags: Yup.array().of(
    Yup.string().min(1).max(50)
  ).max(10, 'Không được quá 10 tags'),

  metadata: Yup.object().shape({
    uploader: Yup.string().required(),
    uploadDate: Yup.date().required(),
    version: Yup.string().matches(/^\d+\.\d+\.\d+$/, 'Phiên bản phải có định dạng x.y.z'),
  }),
});

// Transaction Validation Schema
export const transactionSchema = Yup.object().shape({
  transactionType: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .oneOf([
      'transfer',
      'split',
      'merge',
      'change_purpose',
      'reissue_certificate'
    ], 'Loại giao dịch không hợp lệ'),

  landParcelID: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .min(5, VALIDATION_MESSAGES.MIN_LENGTH('Mã thửa đất', 5))
    .max(50, VALIDATION_MESSAGES.MAX_LENGTH('Mã thửa đất', 50)),

  requester: Yup.object().shape({
    cccd: Yup.string()
      .required(VALIDATION_MESSAGES.REQUIRED)
      .matches(CCCD_REGEX, VALIDATION_MESSAGES.INVALID_CCCD),

    fullName: Yup.string()
      .required(VALIDATION_MESSAGES.REQUIRED)
      .min(2, VALIDATION_MESSAGES.MIN_LENGTH('Họ tên', 2))
      .max(100, VALIDATION_MESSAGES.MAX_LENGTH('Họ tên', 100)),

    phone: Yup.string()
      .required(VALIDATION_MESSAGES.REQUIRED)
      .matches(PHONE_REGEX, VALIDATION_MESSAGES.INVALID_PHONE),

    email: Yup.string()
      .email(VALIDATION_MESSAGES.INVALID_EMAIL)
      .max(100, VALIDATION_MESSAGES.MAX_LENGTH('Email', 100)),
  }),

  details: Yup.object().when('transactionType', {
    is: 'transfer',
    then: Yup.object().shape({
      newOwner: Yup.object().shape({
        cccd: Yup.string()
          .required(VALIDATION_MESSAGES.REQUIRED)
          .matches(CCCD_REGEX, VALIDATION_MESSAGES.INVALID_CCCD),
        fullName: Yup.string().required(),
        phone: Yup.string().required(),
        email: Yup.string().email(),
      }),
      transferReason: Yup.string()
        .required(VALIDATION_MESSAGES.REQUIRED)
        .min(10, VALIDATION_MESSAGES.MIN_LENGTH('Lý do chuyển nhượng', 10))
        .max(500, VALIDATION_MESSAGES.MAX_LENGTH('Lý do chuyển nhượng', 500)),
    }),
    is: 'split',
    then: Yup.object().shape({
      newParcels: Yup.array().of(
        Yup.object().shape({
          area: Yup.number().positive().required(),
          purpose: Yup.string().required(),
          description: Yup.string().max(500),
        })
      ).min(2, 'Phải có ít nhất 2 thửa đất mới').required(),
      splitReason: Yup.string()
        .required(VALIDATION_MESSAGES.REQUIRED)
        .min(10, VALIDATION_MESSAGES.MIN_LENGTH('Lý do tách thửa', 10))
        .max(500, VALIDATION_MESSAGES.MAX_LENGTH('Lý do tách thửa', 500)),
    }),
    is: 'merge',
    then: Yup.object().shape({
      targetParcelIDs: Yup.array()
        .of(Yup.string().required())
        .min(2, 'Phải có ít nhất 2 thửa đất để gộp')
        .required(),
      mergeReason: Yup.string()
        .required(VALIDATION_MESSAGES.REQUIRED)
        .min(10, VALIDATION_MESSAGES.MIN_LENGTH('Lý do gộp thửa', 10))
        .max(500, VALIDATION_MESSAGES.MAX_LENGTH('Lý do gộp thửa', 500)),
    }),
    is: 'change_purpose',
    then: Yup.object().shape({
      newPurpose: Yup.string()
        .required(VALIDATION_MESSAGES.REQUIRED)
        .oneOf([
          'residential',
          'agricultural',
          'commercial',
          'industrial',
          'mixed_use',
          'conservation',
          'other'
        ], 'Mục đích sử dụng mới không hợp lệ'),
      changeReason: Yup.string()
        .required(VALIDATION_MESSAGES.REQUIRED)
        .min(10, VALIDATION_MESSAGES.MIN_LENGTH('Lý do thay đổi', 10))
        .max(500, VALIDATION_MESSAGES.MAX_LENGTH('Lý do thay đổi', 500)),
    }),
    is: 'reissue_certificate',
    then: Yup.object().shape({
      reissueReason: Yup.string()
        .required(VALIDATION_MESSAGES.REQUIRED)
        .min(10, VALIDATION_MESSAGES.MIN_LENGTH('Lý do cấp lại', 10))
        .max(500, VALIDATION_MESSAGES.MAX_LENGTH('Lý do cấp lại', 500)),
      lostCertificate: Yup.boolean().required(),
      policeReport: Yup.string().when('lostCertificate', {
        is: true,
        then: Yup.string().required('Phải có biên bản mất GCN'),
      }),
    }),
  }),

  documents: Yup.array().of(
    Yup.string().required('Phải có ít nhất một tài liệu liên quan')
  ).min(1, 'Phải có ít nhất một tài liệu liên quan'),

  priority: Yup.string()
    .oneOf(['low', 'medium', 'high', 'urgent'], 'Mức độ ưu tiên không hợp lệ')
    .default('medium'),
});

// User Validation Schema
export const userSchema = Yup.object().shape({
  cccd: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .matches(CCCD_REGEX, VALIDATION_MESSAGES.INVALID_CCCD),

  fullName: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .min(2, VALIDATION_MESSAGES.MIN_LENGTH('Họ tên', 2))
    .max(100, VALIDATION_MESSAGES.MAX_LENGTH('Họ tên', 100)),

  phone: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .matches(PHONE_REGEX, VALIDATION_MESSAGES.INVALID_PHONE),

  email: Yup.string()
    .email(VALIDATION_MESSAGES.INVALID_EMAIL)
    .max(100, VALIDATION_MESSAGES.MAX_LENGTH('Email', 100)),

  password: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .min(8, VALIDATION_MESSAGES.MIN_LENGTH('Mật khẩu', 8))
    .matches(PASSWORD_REGEX, VALIDATION_MESSAGES.INVALID_PASSWORD),

  confirmPassword: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .oneOf([Yup.ref('password'), null], VALIDATION_MESSAGES.PASSWORD_MISMATCH),

  org: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .oneOf(['Org1', 'Org2', 'Org3'], 'Tổ chức không hợp lệ'),

  role: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .oneOf(['admin', 'user', 'manager'], 'Vai trò không hợp lệ'),

  address: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .min(10, VALIDATION_MESSAGES.MIN_LENGTH('Địa chỉ', 10))
    .max(200, VALIDATION_MESSAGES.MAX_LENGTH('Địa chỉ', 200)),

  dateOfBirth: Yup.date()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .max(new Date(), VALIDATION_MESSAGES.FUTURE_DATE_NOT_ALLOWED)
    .min(new Date('1900-01-01'), 'Ngày sinh không hợp lệ'),
});

// Login Validation Schema
export const loginSchema = Yup.object().shape({
  identifier: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .test('identifier', 'Phải nhập CCCD hoặc số điện thoại', function(value) {
      if (!value) return false;
      return CCCD_REGEX.test(value) || PHONE_REGEX.test(value);
    }),

  password: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED),
});

// OTP Validation Schema
export const otpSchema = Yup.object().shape({
  cccd: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .matches(CCCD_REGEX, VALIDATION_MESSAGES.INVALID_CCCD),

  otp: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .length(6, 'OTP phải có đúng 6 số')
    .matches(/^[0-9]+$/, 'OTP chỉ được chứa số'),
});

// Password Change Schema
export const passwordChangeSchema = Yup.object().shape({
  currentPassword: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED),

  newPassword: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .min(8, VALIDATION_MESSAGES.MIN_LENGTH('Mật khẩu mới', 8))
    .matches(PASSWORD_REGEX, VALIDATION_MESSAGES.INVALID_PASSWORD),

  confirmNewPassword: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .oneOf([Yup.ref('newPassword'), null], VALIDATION_MESSAGES.PASSWORD_MISMATCH),
});

// Password Reset Schema
export const passwordResetSchema = Yup.object().shape({
  cccd: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .matches(CCCD_REGEX, VALIDATION_MESSAGES.INVALID_CCCD),

  otp: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .length(6, 'OTP phải có đúng 6 số')
    .matches(/^[0-9]+$/, 'OTP chỉ được chứa số'),

  newPassword: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .min(8, VALIDATION_MESSAGES.MIN_LENGTH('Mật khẩu mới', 8))
    .matches(PASSWORD_REGEX, VALIDATION_MESSAGES.INVALID_PASSWORD),

  confirmNewPassword: Yup.string()
    .required(VALIDATION_MESSAGES.REQUIRED)
    .oneOf([Yup.ref('newPassword'), null], VALIDATION_MESSAGES.PASSWORD_MISMATCH),
});

// Validation Helper Functions
export const validateField = async (schema, field, value) => {
  try {
    await schema.validateAt(field, { [field]: value });
    return { isValid: true, error: null };
  } catch (error) {
    return { isValid: false, error: error.message };
  }
};

export const validateForm = async (schema, data) => {
  try {
    await schema.validate(data, { abortEarly: false });
    return { isValid: true, errors: {} };
  } catch (error) {
    const errors = {};
    error.inner.forEach((err) => {
      errors[err.path] = err.message;
    });
    return { isValid: false, errors };
  }
};

export const validatePartial = async (schema, data, fields) => {
  try {
    const partialSchema = Yup.object().shape(
      fields.reduce((acc, field) => {
        acc[field] = schema.fields[field];
        return acc;
      }, {})
    );
    
    await partialSchema.validate(data, { abortEarly: false });
    return { isValid: true, errors: {} };
  } catch (error) {
    const errors = {};
    error.inner.forEach((err) => {
      errors[err.path] = err.message;
    });
    return { isValid: false, errors };
  }
};

// Export all schemas and utilities
export default {
  // Schemas
  landParcelSchema,
  documentSchema,
  transactionSchema,
  userSchema,
  loginSchema,
  otpSchema,
  passwordChangeSchema,
  passwordResetSchema,
  
  // Helper functions
  validateField,
  validateForm,
  validatePartial,
  
  // Constants
  VALIDATION_MESSAGES,
  PHONE_REGEX,
  CCCD_REGEX,
  EMAIL_REGEX,
  PASSWORD_REGEX,
};
