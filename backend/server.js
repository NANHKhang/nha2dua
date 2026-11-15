const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');

const categoryRoutes = require('./routes/categoryRoutes');

const app = express();

app.use(express.json());
app.use(cors());

// Route trang chủ của Backend (phải đặt trước app.listen)
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Backend API Furniture Shop đang hoạt động!' });
});

app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    res.json({ message: 'Backend & CSDL hoạt động bình thường!', data: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use('/api/categories', categoryRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend Server running on port ${PORT}`);
});