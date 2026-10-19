// services/catalog.service.js - đọc danh mục nhóm sự cố và quy tắc SLA (NFR5: lấy từ CSDL).
class CatalogService {
  constructor(catalogRepo) { this.catalog = catalogRepo; }
  listCategories() { return this.catalog.listCategories(); }
  listSlaRules() { return this.catalog.listSlaRules(); }
}

module.exports = CatalogService;
