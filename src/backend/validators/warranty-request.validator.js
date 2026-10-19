// validators/warranty-request.validator.js - TẦNG 1 cho phiếu bảo hành.
const {
  PRIORITIES, STATUSES,
  throwIfErrors, ensureObject, requiredString, positiveInt, parsePaging, parseSearch,
} = require('./common');

const MAX_DESC = 1000; // độ dài tối đa của mô tả lỗi (ký tự)

function validateCreateRequest(body) {
  const b = ensureObject(body);
  const loi = [];
  const customerId = positiveInt(b.customerId, 'customerId', loi);
  const deviceId = positiveInt(b.deviceId, 'deviceId', loi);
  const issueDesc = requiredString(b, 'issueDesc', { min: 1, max: MAX_DESC, label: 'Mô tả lỗi' }, loi);
  throwIfErrors(loi);
  return { customerId, deviceId, issueDesc };
}

function validateUpdateDescription(body) {
  const b = ensureObject(body);
  const loi = [];
  const issueDesc = requiredString(b, 'issueDesc', { min: 1, max: MAX_DESC, label: 'Mô tả lỗi' }, loi);
  throwIfErrors(loi);
  return { issueDesc };
}

function validateSetCategory(body) {
  const b = ensureObject(body);
  const loi = [];
  const categoryId = positiveInt(b.categoryId, 'categoryId', loi);
  throwIfErrors(loi);
  return { categoryId };
}

function validateSetPriority(body) {
  const b = ensureObject(body);
  const loi = [];
  if (!PRIORITIES.includes(b.priority)) {
    loi.push({ truong: 'priority', ly_do: `phải là một trong: ${PRIORITIES.join(', ')}` });
  }
  throwIfErrors(loi);
  return { priority: b.priority };
}

function validateListRequests(query = {}) {
  const loi = [];
  let status = null;
  if (query.status !== undefined && query.status !== '') {
    if (STATUSES.includes(query.status)) status = query.status;
    else loi.push({ truong: 'status', ly_do: `phải là một trong: ${STATUSES.join(', ')}` });
  }
  const q = parseSearch(query, loi);
  const { page, pageSize } = parsePaging(query, loi);
  throwIfErrors(loi);
  return { status, q, page, pageSize };
}

module.exports = {
  validateCreateRequest, validateUpdateDescription, validateSetCategory,
  validateSetPriority, validateListRequests, MAX_DESC,
};
