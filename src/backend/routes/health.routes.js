// routes/health.routes.js - GET /api/health: không cần đăng nhập, dùng để kiểm hệ thống còn sống.
const express = require('express');
const wrap = require('../middleware/async-handler');

module.exports = function healthRoutes({ health }) {
  const r = express.Router();
  r.get('/health', wrap(async (req, res) => {
    const result = await health.check();
    res.status(result.status === 'ok' ? 200 : 503).json(result);
  }));
  return r;
};
