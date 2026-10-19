// routes/warranty-request.routes.js - TẦNG 1: phiếu bảo hành.
// Xem (GET): STAFF và MANAGER. Tạo/sửa/phân loại/xoá: chỉ STAFF (SRS mục 2).
const express = require('express');
const wrap = require('../middleware/async-handler');
const { requireAuth, requireRole } = require('../middleware/auth');
const { parseId } = require('../validators/common');
const v = require('../validators/warranty-request.validator');

module.exports = function warrantyRequestRoutes({ auth, warrantyRequests }) {
  const r = express.Router();
  const staffOnly = requireRole('STAFF');
  r.use('/requests', requireAuth(auth));

  // Số liệu tổng hợp cho màn hình danh sách (đặt TRƯỚC /requests/:id)
  r.get('/requests/summary', wrap(async (req, res) => {
    res.json({ data: await warrantyRequests.summary() });
  }));

  // FR7: GET /requests?status=NEW&q=0912&page=1&pageSize=20
  r.get('/requests', wrap(async (req, res) => {
    const { items, meta } = await warrantyRequests.list(v.validateListRequests(req.query));
    res.json({ data: items, meta });
  }));

  r.get('/requests/:id', wrap(async (req, res) => {
    res.json({ data: await warrantyRequests.get(parseId(req.params.id)) });
  }));

  r.post('/requests', staffOnly, wrap(async (req, res) => {
    const created = await warrantyRequests.create(v.validateCreateRequest(req.body));
    res.status(201).json({ data: created });
  }));

  r.patch('/requests/:id', staffOnly, wrap(async (req, res) => {
    const id = parseId(req.params.id);
    res.json({ data: await warrantyRequests.updateDescription(id, v.validateUpdateDescription(req.body)) });
  }));

  // FR4: chọn nhóm sự cố -> CLASSIFIED
  r.put('/requests/:id/category', staffOnly, wrap(async (req, res) => {
    const id = parseId(req.params.id);
    res.json({ data: await warrantyRequests.setCategory(id, v.validateSetCategory(req.body)) });
  }));

  // FR5: chọn mức ưu tiên
  r.put('/requests/:id/priority', staffOnly, wrap(async (req, res) => {
    const id = parseId(req.params.id);
    res.json({ data: await warrantyRequests.setPriority(id, v.validateSetPriority(req.body)) });
  }));

  // FR6: sinh hạn cam kết xử lý -> RECEIVED
  r.post('/requests/:id/deadline', staffOnly, wrap(async (req, res) => {
    res.json({ data: await warrantyRequests.generateDeadline(parseId(req.params.id)) });
  }));

  r.delete('/requests/:id', staffOnly, wrap(async (req, res) => {
    await warrantyRequests.remove(parseId(req.params.id));
    res.status(204).end();
  }));

  return r;
};
