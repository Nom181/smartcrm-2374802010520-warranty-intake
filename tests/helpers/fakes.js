// tests/helpers/fakes.js - repository GIẢ lưu trong bộ nhớ, cùng giao diện với repository MySQL thật.
// Nhờ đó kiểm thử chạy được trên mọi máy, không cần cơ sở dữ liệu.
const { DuplicateKeyError } = require('../../src/backend/errors');

class FakeCustomerRepo {
  constructor() { this.rows = []; this.nextId = 1; }
  async findById(id) { return this.rows.find((c) => c.customerId === id) || null; }
  async findByPhone(phone) { return this.rows.find((c) => c.phone === phone) || null; }
  async list({ q, limit, offset }) {
    const all = this.rows.filter((c) => !q || c.phone.includes(q) || c.fullName.includes(q));
    return { items: all.slice(offset, offset + limit), total: all.length };
  }
  async insert({ phone, fullName, email }) {
    if (this.rows.some((c) => c.phone === phone)) throw new DuplicateKeyError('uq_customer_phone');
    const row = { customerId: this.nextId++, phone, fullName, email, createdAt: new Date() };
    this.rows.push(row);
    return row;
  }
  async update(id, { phone, fullName, email }) {
    const row = await this.findById(id);
    Object.assign(row, { phone, fullName, email });
    return row;
  }
  async delete(id) {
    const n = this.rows.length;
    this.rows = this.rows.filter((c) => c.customerId !== id);
    return this.rows.length < n;
  }
}

class FakeDeviceRepo {
  constructor() { this.rows = []; this.nextId = 1; }
  async findById(id) { return this.rows.find((d) => d.deviceId === id) || null; }
  async findBySerial(s) { return this.rows.find((d) => d.serialNo === s) || null; }
  async list({ q, limit, offset }) {
    const all = this.rows.filter((d) => !q || d.serialNo.includes(q) || d.modelName.includes(q));
    return { items: all.slice(offset, offset + limit), total: all.length };
  }
  async insert({ serialNo, modelName, purchaseDate }) {
    if (this.rows.some((d) => d.serialNo === serialNo)) throw new DuplicateKeyError('uq_device_serial');
    const row = { deviceId: this.nextId++, serialNo, modelName, purchaseDate };
    this.rows.push(row);
    return row;
  }
  async update(id, { serialNo, modelName, purchaseDate }) {
    const row = await this.findById(id);
    Object.assign(row, { serialNo, modelName, purchaseDate });
    return row;
  }
  async delete(id) {
    const n = this.rows.length;
    this.rows = this.rows.filter((d) => d.deviceId !== id);
    return this.rows.length < n;
  }
}

// Danh mục và bảng SLA đúng như seeds/001_seed_catalog.sql
class FakeCatalogRepo {
  constructor() {
    this.categories = [
      { categoryId: 1, code: 'HARDWARE', name: 'Lỗi phần cứng' },
      { categoryId: 2, code: 'SOFTWARE', name: 'Lỗi phần mềm' },
      { categoryId: 3, code: 'WEAR_AND_TEAR', name: 'Hao mòn tự nhiên' },
    ];
    const hours = { 1: [24, 72, 120], 2: [12, 48, 96], 3: [48, 96, 168] };
    this.rules = [];
    for (const [cat, h] of Object.entries(hours)) {
      ['URGENT', 'NORMAL', 'LOW'].forEach((p, i) =>
        this.rules.push({ categoryId: Number(cat), priority: p, slaHours: h[i] }));
    }
  }
  async listCategories() { return this.categories; }
  async findCategoryById(id) { return this.categories.find((c) => c.categoryId === id) || null; }
  async listSlaRules() { return this.rules; }
  async findSlaRule(categoryId, priority) {
    return this.rules.find((r) => r.categoryId === categoryId && r.priority === priority) || null;
  }
  async listSlaRulesByCategory(categoryId) { return this.rules.filter((r) => r.categoryId === categoryId); }
}

class FakeUserRepo {
  constructor(users = []) { this.users = users; }
  async findByUsername(username) { return this.users.find((u) => u.username === username) || null; }
}

class FakeHealthRepo {
  constructor() { this.down = false; }
  async ping() { if (this.down) throw new Error('down'); return true; }
}

// Cố ý bắt chước đúng hành vi khoá lạc quan của bản MySQL: chỉ ghi khi status còn như kỳ vọng.
class FakeRequestRepo {
  constructor(customers, devices, catalog) {
    this.customers = customers; this.devices = devices; this.catalog = catalog;
    this.rows = []; this.logs = []; this.nextId = 1;
    this.forceConflict = false; // ép applyChange trả false để mô phỏng hai người sửa cùng lúc
    this.failWith = null;       // ép mọi thao tác ném lỗi này (mô phỏng sự cố CSDL)
  }
  guard() { if (this.failWith) throw this.failWith; }
  async hydrate(row) {
    if (!row) return null;
    const c = await this.customers.findById(row.customerId);
    const d = await this.devices.findById(row.deviceId);
    const cat = row.categoryId ? await this.catalog.findCategoryById(row.categoryId) : null;
    return {
      ...row,
      customer: { fullName: c.fullName, phone: c.phone },
      device: { serialNo: d.serialNo, modelName: d.modelName },
      category: cat ? { code: cat.code, name: cat.name } : null,
    };
  }
  async findById(id) { this.guard(); return this.hydrate(this.rows.find((r) => r.requestId === id)); }
  async list({ status, q, limit, offset }) {
    this.guard();
    let all = this.rows.filter((r) => !status || r.status === status);
    const hydrated = [];
    for (const r of all) hydrated.push(await this.hydrate(r));
    all = hydrated.filter((r) => !q || r.customer.phone.includes(q) || r.customer.fullName.includes(q) || r.device.serialNo.includes(q));
    all.sort((a, b) => b.requestId - a.requestId);
    return { items: all.slice(offset, offset + limit), total: all.length };
  }
  async insert({ customerId, deviceId, issueDesc, receivedAt }) {
    this.guard();
    const row = {
      requestId: this.nextId++, customerId, deviceId, issueDesc, categoryId: null, priority: null,
      status: 'NEW', receivedAt, committedDeadline: null,
    };
    this.rows.push(row);
    this.logs.push({ requestId: row.requestId, toStatus: 'NEW', changedAt: receivedAt });
    return this.hydrate(row);
  }
  async applyChange(id, expectedStatus, fields, newStatus, changedAt) {
    this.guard();
    if (this.forceConflict) return false;
    const row = this.rows.find((r) => r.requestId === id);
    if (!row || row.status !== expectedStatus) return false;
    Object.assign(row, fields);
    if (newStatus !== expectedStatus) {
      row.status = newStatus;
      this.logs.push({ requestId: id, toStatus: newStatus, changedAt });
    }
    return true;
  }
  async deleteIfStatus(id, expectedStatus) {
    this.guard();
    const row = this.rows.find((r) => r.requestId === id && r.status === expectedStatus);
    if (!row) return false;
    this.rows = this.rows.filter((r) => r !== row);
    this.logs = this.logs.filter((l) => l.requestId !== id);
    return true;
  }
  async listLogs(requestId) {
    return this.logs.filter((l) => l.requestId === requestId).map((l) => ({ toStatus: l.toStatus, changedAt: l.changedAt }));
  }
  async countByCustomer(id) { return this.rows.filter((r) => r.customerId === id).length; }
  async countByDevice(id) { return this.rows.filter((r) => r.deviceId === id).length; }
  async countByStatus() {
    const out = { NEW: 0, CLASSIFIED: 0, RECEIVED: 0 };
    for (const r of this.rows) out[r.status] += 1;
    return out;
  }
  async countPastDeadline(now) {
    return this.rows.filter((r) => r.committedDeadline && r.committedDeadline < now).length;
  }
}

module.exports = {
  FakeCustomerRepo, FakeDeviceRepo, FakeCatalogRepo, FakeUserRepo, FakeHealthRepo, FakeRequestRepo,
};
