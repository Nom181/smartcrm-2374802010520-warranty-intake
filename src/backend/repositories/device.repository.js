// repositories/device.repository.js - TẦNG 3: chỉ đọc và ghi bảng device.
const { likePattern } = require('./sql-helpers');

function toDevice(row) {
  if (!row) return null;
  // DATE có thể về dạng Date hoặc chuỗi tuỳ cấu hình; chuẩn hoá thành 'YYYY-MM-DD'.
  let purchaseDate = row.purchase_date;
  if (purchaseDate instanceof Date) purchaseDate = purchaseDate.toISOString().slice(0, 10);
  return {
    deviceId: row.device_id,
    serialNo: row.serial_no,
    modelName: row.model_name,
    purchaseDate: purchaseDate || null,
  };
}

class DeviceRepository {
  constructor(db) { this.db = db; }

  async findById(id) {
    const rows = await this.db.query(
      "SELECT device_id, serial_no, model_name, DATE_FORMAT(purchase_date, '%Y-%m-%d') AS purchase_date FROM device WHERE device_id = ?",
      [id]
    );
    return toDevice(rows[0]);
  }

  async findBySerial(serialNo) {
    const rows = await this.db.query(
      "SELECT device_id, serial_no, model_name, DATE_FORMAT(purchase_date, '%Y-%m-%d') AS purchase_date FROM device WHERE serial_no = ?",
      [serialNo]
    );
    return toDevice(rows[0]);
  }

  async list({ q, limit, offset }) {
    const where = q ? 'WHERE serial_no LIKE ? OR model_name LIKE ?' : '';
    const params = q ? [likePattern(q), likePattern(q)] : [];
    const rows = await this.db.query(
      `SELECT device_id, serial_no, model_name, DATE_FORMAT(purchase_date, '%Y-%m-%d') AS purchase_date
         FROM device ${where} ORDER BY device_id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const count = await this.db.query(`SELECT COUNT(*) AS n FROM device ${where}`, params);
    return { items: rows.map(toDevice), total: Number(count[0].n) };
  }

  async insert({ serialNo, modelName, purchaseDate }) {
    const result = await this.db.query(
      'INSERT INTO device (serial_no, model_name, purchase_date) VALUES (?, ?, ?)',
      [serialNo, modelName, purchaseDate]
    );
    return this.findById(result.insertId);
  }

  async update(id, { serialNo, modelName, purchaseDate }) {
    await this.db.query(
      'UPDATE device SET serial_no = ?, model_name = ?, purchase_date = ? WHERE device_id = ?',
      [serialNo, modelName, purchaseDate, id]
    );
    return this.findById(id);
  }

  async delete(id) {
    const result = await this.db.query('DELETE FROM device WHERE device_id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = DeviceRepository;
