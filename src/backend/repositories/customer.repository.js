// repositories/customer.repository.js - TẦNG 3: chỉ đọc và ghi bảng customer.
// Không có quy tắc nghiệp vụ ở đây: kiểm trùng, kiểm xoá được hay không là việc của service.
const { likePattern } = require('./sql-helpers');

function toCustomer(row) {
  if (!row) return null;
  return {
    customerId: row.customer_id,
    phone: row.phone,
    fullName: row.full_name,
    email: row.email,
    createdAt: row.created_at,
  };
}

class CustomerRepository {
  constructor(db) { this.db = db; }

  async findById(id) {
    const rows = await this.db.query('SELECT * FROM customer WHERE customer_id = ?', [id]);
    return toCustomer(rows[0]);
  }

  // Tra theo chỉ mục UNIQUE uq_customer_phone (NFR1).
  async findByPhone(phone) {
    const rows = await this.db.query('SELECT * FROM customer WHERE phone = ?', [phone]);
    return toCustomer(rows[0]);
  }

  async list({ q, limit, offset }) {
    const where = q ? 'WHERE phone LIKE ? OR full_name LIKE ?' : '';
    const params = q ? [likePattern(q), likePattern(q)] : [];
    const rows = await this.db.query(
      `SELECT * FROM customer ${where} ORDER BY customer_id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const count = await this.db.query(`SELECT COUNT(*) AS n FROM customer ${where}`, params);
    return { items: rows.map(toCustomer), total: Number(count[0].n) };
  }

  async insert({ phone, fullName, email }) {
    const result = await this.db.query(
      'INSERT INTO customer (phone, full_name, email) VALUES (?, ?, ?)',
      [phone, fullName, email]
    );
    return this.findById(result.insertId);
  }

  async update(id, { phone, fullName, email }) {
    await this.db.query(
      'UPDATE customer SET phone = ?, full_name = ?, email = ? WHERE customer_id = ?',
      [phone, fullName, email, id]
    );
    return this.findById(id);
  }

  async delete(id) {
    const result = await this.db.query('DELETE FROM customer WHERE customer_id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = CustomerRepository;
