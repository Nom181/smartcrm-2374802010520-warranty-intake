// routes/http-error-map.js - bản đồ dịch MÃ NGHIỆP VỤ -> MÃ HTTP.
// Toàn bộ phần "biết về HTTP" của xử lý lỗi nằm ở đây; services không biết các con số này.
const HTTP_BY_CODE = {
  // 400: sai định dạng (validator, tầng 1)
  DU_LIEU_KHONG_HOP_LE: 400,
  JSON_KHONG_HOP_LE: 400,
  // 401 / 403: đăng nhập và phân quyền
  CHUA_DANG_NHAP: 401,
  SAI_THONG_TIN_DANG_NHAP: 401,
  KHONG_DU_QUYEN: 403,
  // 404: không tìm thấy
  KHONG_TIM_THAY_KHACH_HANG: 404,
  KHACH_KHONG_TON_TAI: 404,
  KHONG_TIM_THAY_THIET_BI: 404,
  THIET_BI_KHONG_TON_TAI: 404,
  PHIEU_KHONG_TON_TAI: 404,
  KHONG_TIM_THAY_DUONG_DAN: 404,
  // 409: xung đột với trạng thái hiện có
  SO_DIEN_THOAI_DA_TON_TAI: 409,
  SERIAL_DA_TON_TAI: 409,
  KHACH_CO_PHIEU: 409,
  THIET_BI_CO_PHIEU: 409,
  PHIEU_DA_TIEP_NHAN: 409,
  PHIEU_CHI_XOA_KHI_MOI: 409,
  PHIEU_DA_THAY_DOI: 409,
  // 422: đúng cú pháp nhưng vi phạm quy tắc nghiệp vụ (service, tầng 2)
  CHUA_CO_MO_TA_LOI: 422,
  NHOM_SU_CO_KHONG_HOP_LE: 422,
  THIEU_THONG_TIN_PHAN_LOAI: 422,
  THIEU_QUY_TAC_SLA: 422,
  NGAY_MUA_TRONG_TUONG_LAI: 422,
};

module.exports = { HTTP_BY_CODE };
