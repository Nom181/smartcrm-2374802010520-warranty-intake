// routes/device.routes.js - TẦNG 1: thiết bị. Chỉ nhân viên tiếp nhận (STAFF) dùng.
const express = require('express');
const wrap = require('../middleware/async-handler');
const { requireAuth, requireRole } = require('../middleware/auth');
const { parseId } = require('../validators/common');
const v = require('../validators/device.validator');

module.exports = function deviceRoutes({ auth, devices }) {
  const r = express.Router();
  r.use('/devices', requireAuth(auth), requireRole('STAFF'));

  r.get('/devices/lookup', wrap(async (req, res) => {
    const { serialNo } = v.validateLookupSerial(req.query);
    res.json({ data: await devices.lookupBySerial(serialNo) });
  }));

  r.get('/devices', wrap(async (req, res) => {
    const { items, meta } = await devices.list(v.validateListDevices(req.query));
    res.json({ data: items, meta });
  }));

  r.get('/devices/:id', wrap(async (req, res) => {
    res.json({ data: await devices.get(parseId(req.params.id)) });
  }));

  r.post('/devices', wrap(async (req, res) => {
    const created = await devices.create(v.validateCreateDevice(req.body));
    res.status(201).json({ data: created });
  }));

  r.put('/devices/:id', wrap(async (req, res) => {
    const updated = await devices.update(parseId(req.params.id), v.validateUpdateDevice(req.body));
    res.json({ data: updated });
  }));

  r.delete('/devices/:id', wrap(async (req, res) => {
    await devices.remove(parseId(req.params.id));
    res.status(204).end();
  }));

  return r;
};
