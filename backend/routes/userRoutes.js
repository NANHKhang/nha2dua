const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.email, u.full_name, u.phone, u.is_active, u.role_id, u.created_at, r.name AS role_name 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      ORDER BY u.id ASC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  const { is_active, role_id } = req.body;
  try {
    await db.query('UPDATE users SET is_active = ?, role_id = ? WHERE id = ?', [is_active, role_id, req.params.id]);
    res.json({ success: true, message: 'Cập nhật tài khoản thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;