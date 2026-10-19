// npm run seed - nạp dữ liệu mẫu. Chạy lại bao nhiêu lần cũng không nhân đôi dữ liệu.
require('./sql-runner').main('seeds', { createDatabase: false });
