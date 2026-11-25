const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Đăng ký tài khoản mới
router.post('/register', async (req, res) => {
  const { email, password, full_name, phone } = req.body;
  if (!email || !password || !full_name) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu!' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO users (role_id, email, password_hash, full_name, phone) VALUES (1, ?, ?, ?, ?)',
      [email.trim(), password.trim(), full_name.trim(), phone ? phone.trim() : null]
    );
    res.status(201).json({
      success: true,
      user: {
        id: result.insertId,
        email: email.trim(),
        full_name: full_name.trim(),
        phone: phone ? phone.trim() : '',
        role_id: 1,
        role_name: 'customer'
      }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Email này đã được đăng ký!' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Đăng nhập
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
    if (String(user.password_hash).trim() !== String(password).trim()) {
      return res.status(401).json({ success: false, message: 'Mật khẩu không chính xác!' });
    }

    delete user.password_hash;
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cập nhật thông tin hồ sơ khách hàng (Họ tên, SĐT)
router.put('/profile/:id', async (req, res) => {
  const { full_name, phone } = req.body;
  if (!full_name) {
    return res.status(400).json({ success: false, message: 'Họ tên không được để trống!' });
  }
  try {
    await db.query('UPDATE users SET full_name = ?, phone = ? WHERE id = ?', [
      full_name.trim(),
      phone ? phone.trim() : null,
      req.params.id
    ]);
    res.json({ success: true, message: 'Cập nhật hồ sơ thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;