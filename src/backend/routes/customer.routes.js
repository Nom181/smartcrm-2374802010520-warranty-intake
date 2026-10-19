// routes/customer.routes.js - TẦNG 1: khách hàng. Chỉ nhân viên tiếp nhận (STAFF) dùng.
const express = require('express');
const wrap = require('../middleware/async-handler');
const { requireAuth, requireRole } = require('../middleware/auth');
const { parseId } = require('../validators/common');
const v = require('../validators/customer.validator');

module.exports = function customerRoutes({ auth, customers }) {
  const r = express.Router();
  r.use('/customers', requireAuth(auth), requireRole('STAFF'));

  // FR1: GET /customers/lookup?phone=0912345678  (đặt TRƯỚC /customers/:id)
  r.get('/customers/lookup', wrap(async (req, res) => {
    const { phone } = v.validateLookupPhone(req.query);
    res.json({ data: await customers.lookupByPhone(phone) });
  }));

  r.get('/customers', wrap(async (req, res) => {
    const { items, meta } = await customers.list(v.validateListCustomers(req.query));
    res.json({ data: items, meta });
  }));

  r.get('/customers/:id', wrap(async (req, res) => {
    res.json({ data: await customers.get(parseId(req.params.id)) });
  }));

  // FR2
  r.post('/customers', wrap(async (req, res) => {
    const created = await customers.create(v.validateCreateCustomer(req.body));
    res.status(201).json({ data: created });
  }));

  r.put('/customers/:id', wrap(async (req, res) => {
    const updated = await customers.update(parseId(req.params.id), v.validateUpdateCustomer(req.body));
    res.json({ data: updated });
  }));

  r.delete('/customers/:id', wrap(async (req, res) => {
    await customers.remove(parseId(req.params.id));
    res.status(204).end();
  }));

  return r;
};
