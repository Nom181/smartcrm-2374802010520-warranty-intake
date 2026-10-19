// services/paging.js - đổi (page, pageSize) thành (limit, offset). Hàm thuần.
function toLimitOffset({ page, pageSize }) {
  return { limit: pageSize, offset: (page - 1) * pageSize };
}

function pageMeta({ page, pageSize }, total) {
  return { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

module.exports = { toLimitOffset, pageMeta };
