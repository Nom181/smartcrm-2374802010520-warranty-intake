// routes/catalog.routes.js - TẦNG 1: danh mục nhóm sự cố và quy tắc SLA (chỉ đọc), cho mọi người dùng đã đăng nhập.
const express = require('express');
const wrap = require('../middleware/async-handler');
const { requireAuth } = require('../middleware/auth');

module.exports = function catalogRoutes({ auth, catalog }) {
  const r = express.Router();
  r.get('/categories', requireAuth(auth), wrap(async (req, res) => {
    res.json({ data: await catalog.listCategories() });
  }));
  r.get('/sla-rules', requireAuth(auth), wrap(async (req, res) => {
    res.json({ data: await catalog.listSlaRules() });
  }));
  return r;
};
