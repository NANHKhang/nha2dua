const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Đăng ký tài khoản khách hàng (mặc định role_id = 1)
router.post('/register', async (req, res) => {
  const { email, password, full_name, phone } = req.body;
  if (!email || !password || !full_name) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập đủ họ tên, email và mật khẩu!' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO users (role_id, email, password_hash, full_name, phone) VALUES (1, ?, ?, ?, ?)',
      [email.trim(), password, full_name.trim(), phone || null]
    );
    res.status(201).json({
      success: true,
      user: { id: result.insertId, email: email.trim(), full_name: full_name.trim(), phone, role_id: 1, role_name: 'customer' }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Email này đã được đăng ký!' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Đăng nhập: Kiểm tra cả Email và Mật khẩu
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ email và mật khẩu!' });
  }
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.email, u.password_hash, u.full_name, u.phone, u.is_active, u.role_id, r.name AS role_name 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      WHERE u.email = ?
    `, [email.trim()]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Email không tồn tại trong hệ thống!' });
    }

    const user = rows[0];

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa!' });
    }

    // Kiểm tra mật khẩu
    if (user.password_hash !== password) {
      return res.status(401).json({ success: false, message: 'Mật khẩu không chính xác!' });
    }

    delete user.password_hash;
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;