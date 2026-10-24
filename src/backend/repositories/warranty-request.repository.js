// repositories/warranty-request.repository.js - TẦNG 3: đọc/ghi warranty_request và request_status_log.
// Chỉ biết SQL. Việc "được phép chuyển trạng thái hay không" do service quyết định;
// repository chỉ thực hiện cập nhật CÓ ĐIỀU KIỆN (khoá lạc quan) và ghi lịch sử trong cùng giao dịch.
const { likePattern } = require('./sql-helpers');

const SELECT_REQUEST = `
  SELECT r.request_id, r.customer_id, r.device_id, r.issue_desc, r.category_id, r.priority,
         r.status, r.received_at, r.committed_deadline,
         c.full_name AS customer_name, c.phone AS customer_phone,
         d.serial_no, d.model_name,
         ic.code AS category_code, ic.name AS category_name
    FROM warranty_request r
    JOIN customer c ON c.customer_id = r.customer_id
    JOIN device d ON d.device_id = r.device_id
    LEFT JOIN issue_category ic ON ic.category_id = r.category_id`;

// HỢP ĐỒNG DỮ LIỆU (ranh giới repository -> service -> API -> giao diện): MỘT phiếu bảo hành.
// Hàm này là chỗ DUY NHẤT biết tên cột của bảng; tầng trên không bao giờ đọc tên cột SQL.
//   requestId, customerId, deviceId : số nguyên, luôn có
//   issueDesc                       : chuỗi, luôn có, tối đa 1000 ký tự (QT9)
//   categoryId, category            : null khi CHƯA phân loại; có thì category = { code, name }
//   priority                        : 'URGENT' | 'NORMAL' | 'LOW' | null (chưa chọn)
//   status                          : 'NEW' | 'CLASSIFIED' | 'RECEIVED', luôn có (QT5)
//   receivedAt, committedDeadline   : thời điểm UTC (Date), null khi chưa tiếp nhận / chưa sinh hạn
//   customer                        : { fullName, phone }; device: { serialNo, modelName }, luôn có
// KHI SAI: row rỗng/null -> trả null (service ném KHONG_TIM_THAY_PHIEU -> 404), không ném lỗi thô.
// Đổi hợp đồng: thêm trường song song -> chuyển từng bên gọi -> mới xoá trường cũ (xem docs/hop-dong-du-lieu.md).
function toRequest(row) {
  if (!row) return null;
  return {
    requestId: row.request_id,
    customerId: row.customer_id,
    deviceId: row.device_id,
    issueDesc: row.issue_desc,
    categoryId: row.category_id,
    priority: row.priority,
    status: row.status,
    receivedAt: row.received_at,
    committedDeadline: row.committed_deadline,
    customer: { fullName: row.customer_name, phone: row.customer_phone },
    device: { serialNo: row.serial_no, modelName: row.model_name },
    category: row.category_id ? { code: row.category_code, name: row.category_name } : null,
  };
}

// Các cột cho phép cập nhật qua applyChange (danh sách trắng, tránh ghép tên cột tuỳ tiện).
const UPDATABLE = {
  issueDesc: 'issue_desc',
  categoryId: 'category_id',
  priority: 'priority',
  committedDeadline: 'committed_deadline',
};

class WarrantyRequestRepository {
  constructor(db) { this.db = db; }

  async findById(id) {
    const rows = await this.db.query(`${SELECT_REQUEST} WHERE r.request_id = ?`, [id]);
    return toRequest(rows[0]);
  }

  async list({ status, q, limit, offset }) {
    const conditions = [];
    const params = [];
    if (status) { conditions.push('r.status = ?'); params.push(status); }
    if (q) {
      conditions.push('(c.phone LIKE ? OR c.full_name LIKE ? OR d.serial_no LIKE ?)');
      params.push(likePattern(q), likePattern(q), likePattern(q));
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await this.db.query(
      `${SELECT_REQUEST} ${where} ORDER BY r.received_at DESC, r.request_id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const count = await this.db.query(
      `SELECT COUNT(*) AS n FROM warranty_request r
         JOIN customer c ON c.customer_id = r.customer_id
         JOIN device d ON d.device_id = r.device_id ${where}`,
      params
    );
    return { items: rows.map(toRequest), total: Number(count[0].n) };
  }

  // Tạo phiếu ở trạng thái NEW và ghi dòng lịch sử đầu tiên trong CÙNG một giao dịch.
  async insert({ customerId, deviceId, issueDesc, receivedAt }) {
    const id = await this.db.transaction(async (tx) => {
      const result = await tx.query(
        `INSERT INTO warranty_request (customer_id, device_id, issue_desc, status, received_at)
         VALUES (?, ?, ?, 'NEW', ?)`,
        [customerId, deviceId, issueDesc, receivedAt]
      );
      await tx.query(
        "INSERT INTO request_status_log (request_id, to_status, changed_at) VALUES (?, 'NEW', ?)",
        [result.insertId, receivedAt]
      );
      return result.insertId;
    });
    return this.findById(id);
  }

  // Cập nhật CÓ ĐIỀU KIỆN: chỉ ghi nếu phiếu vẫn đang ở expectedStatus (chống hai người sửa cùng lúc).
  // newStatus khác expectedStatus thì ghi thêm một dòng lịch sử (QT5), cùng giao dịch.
  // Trả về true nếu cập nhật được, false nếu trạng thái đã bị người khác đổi.
  async applyChange(id, expectedStatus, fields, newStatus, changedAt) {
    const sets = [];
    const params = [];
    for (const [key, value] of Object.entries(fields)) {
      if (!UPDATABLE[key]) throw new Error(`Cột không được phép cập nhật: ${key}`);
      sets.push(`${UPDATABLE[key]} = ?`);
      params.push(value);
    }
    if (newStatus !== expectedStatus) { sets.push('status = ?'); params.push(newStatus); }
    if (sets.length === 0) return true;

    return this.db.transaction(async (tx) => {
      const result = await tx.query(
        `UPDATE warranty_request SET ${sets.join(', ')} WHERE request_id = ? AND status = ?`,
        [...params, id, expectedStatus]
      );
      if (result.affectedRows === 0) return false;
      if (newStatus !== expectedStatus) {
        await tx.query(
          'INSERT INTO request_status_log (request_id, to_status, changed_at) VALUES (?, ?, ?)',
          [id, newStatus, changedAt]
        );
      }
      return true;
    });
  }

  // Xoá phiếu (kèm lịch sử) chỉ khi đang ở expectedStatus. Trả về true nếu đã xoá.
  async deleteIfStatus(id, expectedStatus) {
    return this.db.transaction(async (tx) => {
      const rows = await tx.query(
        'SELECT request_id FROM warranty_request WHERE request_id = ? AND status = ? FOR UPDATE',
        [id, expectedStatus]
      );
      if (rows.length === 0) return false;
      await tx.query('DELETE FROM request_status_log WHERE request_id = ?', [id]);
      await tx.query('DELETE FROM warranty_request WHERE request_id = ?', [id]);
      return true;
    });
  }

  async listLogs(requestId) {
    const rows = await this.db.query(
      'SELECT to_status, changed_at FROM request_status_log WHERE request_id = ? ORDER BY changed_at, log_id',
      [requestId]
    );
    return rows.map((r) => ({ toStatus: r.to_status, changedAt: r.changed_at }));
  }

  async countByCustomer(customerId) {
    const rows = await this.db.query(
      'SELECT COUNT(*) AS n FROM warranty_request WHERE customer_id = ?', [customerId]);
    return Number(rows[0].n);
  }

  async countByDevice(deviceId) {
    const rows = await this.db.query(
      'SELECT COUNT(*) AS n FROM warranty_request WHERE device_id = ?', [deviceId]);
    return Number(rows[0].n);
  }

  async countByStatus() {
    const rows = await this.db.query(
      'SELECT status, COUNT(*) AS n FROM warranty_request GROUP BY status');
    const result = { NEW: 0, CLASSIFIED: 0, RECEIVED: 0 };
    for (const r of rows) result[r.status] = Number(r.n);
    return result;
  }

  // Số phiếu đã có hạn cam kết nhưng hạn đó đã qua tại thời điểm `now`.
  async countPastDeadline(now) {
    const rows = await this.db.query(
      'SELECT COUNT(*) AS n FROM warranty_request WHERE committed_deadline IS NOT NULL AND committed_deadline < ?',
      [now]
    );
    return Number(rows[0].n);
  }
}

module.exports = WarrantyRequestRepository;

// Xuất riêng hàm chuyển đổi để kiểm thử hợp đồng (tests/04-hop-dong.test.js).
module.exports.toRequest = toRequest;
