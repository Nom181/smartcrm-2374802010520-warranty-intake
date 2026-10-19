// npm run migrate - tạo CSDL (nếu chưa có) và dựng bảng. Chạy lại bao nhiêu lần cũng không lỗi.
require('./sql-runner').main('migrations', { createDatabase: true });
