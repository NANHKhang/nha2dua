const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');

// Import route vừa tạo
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();

app.use(express.json());
app.use(cors());

// Route kiểm tra sức khỏe hệ thống hiện tại
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    res.json({ message: 'Backend & CSDL hoạt động bình thường!', data: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Nhúng các route CRUD của categories vào URL /api/categories
app.use('/api/categories', categoryRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend Server running on port ${PORT}`);
});