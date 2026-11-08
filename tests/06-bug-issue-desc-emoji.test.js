// BUG-004 (hồi quy): giới hạn "tối đa 1000 ký tự" (QT9) phải đếm KÝ TỰ, không đếm đơn vị UTF-16.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateCreateRequest } = require('../src/backend/validators/warranty-request.validator');

const make = (issueDesc) => validateCreateRequest({ customerId: 1, deviceId: 1, issueDesc });

test('BUG-004: 1000 emoji (1000 ký tự) là HỢP LỆ', () => {
  assert.equal([...make('😀'.repeat(1000)).issueDesc].length, 1000);
});

test('BUG-004: 1001 emoji (1001 ký tự) vẫn bị TỪ CHỐI', () => {
  assert.throws(() => make('😀'.repeat(1001)), (e) => e.code === 'DU_LIEU_KHONG_HOP_LE');
});