// app.js - ghép các tầng lại. Không có logic nghiệp vụ ở đây.
// Nhận `services` từ bên ngoài để kiểm thử có thể tiêm dịch vụ giả mà không cần CSDL.
const express = require('express');
const { createErrorHandler, notFoundHandler } = require('./middleware/error-handler');

function createApp(services, { logger = console } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  const api = express.Router();
  api.use(require('./routes/health.routes')(services));
  api.use(require('./routes/auth.routes')(services));
  api.use(require('./routes/customer.routes')(services));
  api.use(require('./routes/device.routes')(services));
  api.use(require('./routes/warranty-request.routes')(services));
  api.use(require('./routes/catalog.routes')(services));
  app.use('/api', api);

  app.use(notFoundHandler);
  app.use(createErrorHandler(logger));
  return app;
}

module.exports = { createApp };
