// repositories/health.repository.js - kiểm tra CSDL còn trả lời không.
class HealthRepository {
  constructor(db) { this.db = db; }
  async ping() {
    await this.db.query('SELECT 1');
    return true;
  }
}

module.exports = HealthRepository;
