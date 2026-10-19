// services/health.service.js - báo tình trạng hệ thống; CSDL tắt thì báo "degraded" thay vì treo.
class HealthService {
  constructor(healthRepo) { this.health = healthRepo; }

  async check() {
    try {
      await this.health.ping();
      return { status: 'ok', db: 'up' };
    } catch (_) {
      return { status: 'degraded', db: 'down' };
    }
  }
}

module.exports = HealthService;
