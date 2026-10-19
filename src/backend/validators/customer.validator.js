// validators/customer.validator.js - TẦNG 1 cho khách hàng.
const {
  throwIfErrors, ensureObject, requiredString, optionalString, parsePaging, parseSearch,
} = require('./common');

// QT1: đúng 10 chữ số và bắt đầu bằng 0.
const RE_PHONE = /^0\d{9}$/;
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function checkPhone(value, loi) {
  const phone = typeof value === 'string' ? value.trim() : '';
  if (!RE_PHONE.test(phone)) {
    loi.push({ truong: 'phone', ly_do: 'số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng 0' });
    return undefined;
  }
  return phone;
}

function validateLookupPhone(query = {}) {
  const loi = [];
  const phone = checkPhone(query.phone, loi);
  throwIfErrors(loi);
  return { phone };
}

function validateCustomerBody(body) {
  const b = ensureObject(body);
  const loi = [];
  const phone = checkPhone(b.phone, loi);
  const fullName = requiredString(b, 'fullName', { min: 2, max: 100, label: 'Họ tên' }, loi);
  const email = optionalString(b, 'email', {
    max: 100, label: 'Email', pattern: RE_EMAIL, patternMessage: 'email không đúng định dạng',
  }, loi);
  throwIfErrors(loi);
  return { phone, fullName, email };
}

function validateListCustomers(query = {}) {
  const loi = [];
  const q = parseSearch(query, loi);
  const { page, pageSize } = parsePaging(query, loi);
  throwIfErrors(loi);
  return { q, page, pageSize };
}

module.exports = {
  validateLookupPhone,
  validateCreateCustomer: validateCustomerBody,
  validateUpdateCustomer: validateCustomerBody,
  validateListCustomers,
  RE_PHONE,
};
