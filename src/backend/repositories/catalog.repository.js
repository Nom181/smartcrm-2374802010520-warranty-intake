// repositories/catalog.repository.js - đọc danh mục: issue_category và sla_rule (NFR5: danh mục nằm trong CSDL).
function toCategory(row) {
  return row ? { categoryId: row.category_id, code: row.code, name: row.name } : null;
}
function toSlaRule(row) {
  return row
    ? { categoryId: row.category_id, priority: row.priority, slaHours: row.sla_hours }
    : null;
}

class CatalogRepository {
  constructor(db) { this.db = db; }

  async listCategories() {
    const rows = await this.db.query('SELECT * FROM issue_category ORDER BY category_id');
    return rows.map(toCategory);
  }

  async findCategoryById(id) {
    const rows = await this.db.query('SELECT * FROM issue_category WHERE category_id = ?', [id]);
    return toCategory(rows[0]);
  }

  async listSlaRules() {
    const rows = await this.db.query(
      "SELECT * FROM sla_rule ORDER BY category_id, FIELD(priority, 'URGENT', 'NORMAL', 'LOW')"
    );
    return rows.map(toSlaRule);
  }

  // Tra đúng một quy tắc theo cặp (nhóm sự cố, mức ưu tiên); chỉ mục uq_sla_category_priority.
  async findSlaRule(categoryId, priority) {
    const rows = await this.db.query(
      'SELECT * FROM sla_rule WHERE category_id = ? AND priority = ?',
      [categoryId, priority]
    );
    return toSlaRule(rows[0]);
  }

  async listSlaRulesByCategory(categoryId) {
    const rows = await this.db.query(
      "SELECT * FROM sla_rule WHERE category_id = ? ORDER BY FIELD(priority, 'URGENT', 'NORMAL', 'LOW')",
      [categoryId]
    );
    return rows.map(toSlaRule);
  }
}

module.exports = CatalogRepository;
