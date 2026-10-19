// validators/device.validator.js - TẦNG 1 cho thiết bị.
const {
  throwIfErrors, ensureObject, requiredString, optionalString, parsePaging, parseSearch,
} = require('./common');

const RE_SERIAL = /^[A-Za-z0-9-]{6,50}$/;
const RE_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Ngày phải có thật: 2026-02-30 bị từ chối.
function isRealDate(text) {
  if (!RE_DATE.test(text)) return false;
  const d = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === text;
}

function validateDeviceBody(body) {
  const b = ensureObject(body);
  const loi = [];
  const rawSerial = typeof b.serialNo === 'string' ? b.serialNo.trim() : '';
  let serialNo;
  if (!RE_SERIAL.test(rawSerial)) {
    loi.push({ truong: 'serialNo', ly_do: 'số serial gồm chữ, số, gạch ngang; dài 6–50 ký tự' });
  } else {
    serialNo = rawSerial.toUpperCase(); // chuẩn hoá để không trùng vì khác chữ hoa/thường
  }
  const modelName = requiredString(b, 'modelName', { min: 2, max: 100, label: 'Mẫu thiết bị' }, loi);
  const purchaseDate = optionalString(b, 'purchaseDate', {
    max: 10, label: 'Ngày mua', pattern: /^\d{4}-\d{2}-\d{2}$/, patternMessage: 'ngày mua phải theo định dạng YYYY-MM-DD',
  }, loi);
  if (purchaseDate && !isRealDate(purchaseDate)) {
    loi.push({ truong: 'purchaseDate', ly_do: 'ngày mua không tồn tại trong lịch' });
  }
  throwIfErrors(loi);
  return { serialNo, modelName, purchaseDate: purchaseDate || null };
}

function validateLookupSerial(query = {}) {
  const loi = [];
  const raw = typeof query.serial === 'string' ? query.serial.trim() : '';
  if (!RE_SERIAL.test(raw)) {
    loi.push({ truong: 'serial', ly_do: 'số serial gồm chữ, số, gạch ngang; dài 6–50 ký tự' });
  }
  throwIfErrors(loi);
  return { serialNo: raw.toUpperCase() };
}

function validateListDevices(query = {}) {
  const loi = [];
  const q = parseSearch(query, loi);
  const { page, pageSize } = parsePaging(query, loi);
  throwIfErrors(loi);
  return { q, page, pageSize };
}

module.exports = {
  validateCreateDevice: validateDeviceBody,
  validateUpdateDevice: validateDeviceBody,
  validateLookupSerial,
  validateListDevices,
};
