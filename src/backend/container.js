// container.js - nơi DUY NHẤT tạo repository và service thật rồi nối chúng với nhau (composition root).
const CustomerRepository = require('./repositories/customer.repository');
const DeviceRepository = require('./repositories/device.repository');
const CatalogRepository = require('./repositories/catalog.repository');
const UserRepository = require('./repositories/user.repository');
const HealthRepository = require('./repositories/health.repository');
const WarrantyRequestRepository = require('./repositories/warranty-request.repository');

const CustomerService = require('./services/customer.service');
const DeviceService = require('./services/device.service');
const CatalogService = require('./services/catalog.service');
const DeadlineService = require('./services/deadline.service');
const WarrantyRequestService = require('./services/warranty-request.service');
const AuthService = require('./services/auth.service');
const HealthService = require('./services/health.service');

function buildServices(db, config) {
  const customerRepo = new CustomerRepository(db);
  const deviceRepo = new DeviceRepository(db);
  const catalogRepo = new CatalogRepository(db);
  const userRepo = new UserRepository(db);
  const healthRepo = new HealthRepository(db);
  const requestRepo = new WarrantyRequestRepository(db);

  return {
    customers: new CustomerService(customerRepo, requestRepo),
    devices: new DeviceService(deviceRepo, requestRepo, { timezone: config.timezone }),
    catalog: new CatalogService(catalogRepo),
    warrantyRequests: new WarrantyRequestService({
      requests: requestRepo,
      customers: customerRepo,
      devices: deviceRepo,
      catalog: catalogRepo,
      deadline: new DeadlineService(catalogRepo),
    }),
    auth: new AuthService(userRepo, config.auth),
    health: new HealthService(healthRepo),
  };
}

module.exports = { buildServices };
