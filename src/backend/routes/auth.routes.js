// routes/auth.routes.js - TẦNG 1: dịch HTTP <-> nghiệp vụ cho đăng nhập.
const express = require('express');
const wrap = require('../middleware/async-handler');
const { requireAuth } = require('../middleware/auth');
const { validateLogin } = require('../validators/auth.validator');

module.exports = function authRoutes({ auth }) {
  const r = express.Router();

  r.post('/auth/login', wrap(async (req, res) => {
    const input = validateLogin(req.body);
    const result = await auth.login(input);
    res.json({ data: result });
  }));

  // Cho giao diện kiểm token còn hiệu lực và lấy lại thông tin người dùng.
  r.get('/auth/me', requireAuth(auth), (req, res) => {
    res.json({ data: req.user });
  });

  return r;
};
