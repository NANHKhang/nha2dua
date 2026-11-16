const express = require('express');
const cors = require('cors');
require('dotenv').config();
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();

app.use(express.json());
// Cho phép Frontend trên Vercel và Local gọi API
app.use(cors({
  origin: ['https://nha2dua.vercel.app', 'http://localhost:5173']
}));

// Thông báo trạng thái server (không trả dữ liệu nghiệp vụ ở đây)
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'API Server is running' });
});

// Cổng API chính cung cấp dữ liệu JSON cho Frontend
app.use('/api/categories', categoryRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});