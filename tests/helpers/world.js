// tests/helpers/world.js - dựng "thế giới thử nghiệm": service THẬT + repository GIẢ + đồng hồ giả.
const CustomerService = require('../../src/backend/services/customer.service');
const DeviceService = require('../../src/backend/services/device.service');
const CatalogService = require('../../src/backend/services/catalog.service');
const DeadlineService = require('../../src/backend/services/deadline.service');
const WarrantyRequestService = require('../../src/backend/services/warranty-request.service');
const AuthService = require('../../src/backend/services/auth.service');
const HealthService = require('../../src/backend/services/health.service');
const { hashPassword } = require('../../src/backend/services/password');
const { createApp } = require('../../src/backend/app');
const fakes = require('./fakes');

const SECRET = 'khoa-bi-mat-chi-dung-trong-kiem-thu-0123456789';
const PASSWORD = 'Demo@2026';
const START = new Date('2026-10-20T03:00:00.000Z'); // 10:00 giờ Việt Nam

async function makeWorld() {
  const clock = { now: new Date(START) };
  const now = () => clock.now;

  const customerRepo = new fakes.FakeCustomerRepo();
  const deviceRepo = new fakes.FakeDeviceRepo();
  const catalogRepo = new fakes.FakeCatalogRepo();
  const requestRepo = new fakes.FakeRequestRepo(customerRepo, deviceRepo, catalogRepo);
  const healthRepo = new fakes.FakeHealthRepo();
  const hash = await hashPassword(PASSWORD);
  const userRepo = new fakes.FakeUserRepo([
    { userId: 1, username: 'staff01', passwordHash: hash, fullName: 'Nhân viên 01', role: 'STAFF' },
    { userId: 2, username: 'manager01', passwordHash: hash, fullName: 'Quản lý 01', role: 'MANAGER' },
  ]);

  const services = {
    customers: new CustomerService(customerRepo, requestRepo),
    devices: new DeviceService(deviceRepo, requestRepo, { clock: now, timezone: 'Asia/Ho_Chi_Minh' }),
    catalog: new CatalogService(catalogRepo),
    warrantyRequests: new WarrantyRequestService({
      requests: requestRepo, customers: customerRepo, devices: deviceRepo,
      catalog: catalogRepo, deadline: new DeadlineService(catalogRepo), clock: now,
    }),
    auth: new AuthService(userRepo, { secret: SECRET, ttlHours: 8 }, now),
    health: new HealthService(healthRepo),
  };
  const silentLogger = { error() {}, log() {} };
  const app = createApp(services, { logger: silentLogger });
  return { clock, services, repos: { customerRepo, deviceRepo, catalogRepo, requestRepo, healthRepo }, app };
}

// Mở máy chủ thật trên cổng ngẫu nhiên để gọi bằng fetch; nhớ gọi close() khi xong.
function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({
        baseUrl: `http://127.0.0.1:${port}/api`,
        close: () => new Promise((r) => server.close(r)),
      });
    });
  });
}

async function call(baseUrl, method, path, { token, body, raw } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined || raw !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${baseUrl}${path}`, {
    method, headers, body: raw !== undefined ? raw : body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null, text };
}

async function loginAs(baseUrl, username) {
  const r = await call(baseUrl, 'POST', '/auth/login', { body: { username, password: PASSWORD } });
  return r.body.data.token;
}

module.exports = { makeWorld, listen, call, loginAs, PASSWORD, START };
