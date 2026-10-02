require('dotenv').config();
const express = require('express');
const app = express();

const PORT = process.env.APP_PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello Smart CRM');
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
