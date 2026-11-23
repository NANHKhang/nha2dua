const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, c.name AS category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ORDER BY p.id DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', async (req, res) => {
  const { category_id, name, slug, description, price, stock_quantity, thumbnail_url, is_active } = req.body;
  if (!name || !slug || !category_id || price === undefined) {
    return res.status(400).json({ success: false, message: 'Vui lòng điền đủ thông tin bắt buộc' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO products (category_id, name, slug, description, price, stock_quantity, thumbnail_url, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [category_id, name, slug, description || null, price, stock_quantity || 0, thumbnail_url || null, is_active ?? 1]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { category_id, name, slug, description, price, stock_quantity, thumbnail_url, is_active } = req.body;
  try {
    await db.query(
      'UPDATE products SET category_id=?, name=?, slug=?, description=?, price=?, stock_quantity=?, thumbnail_url=?, is_active=? WHERE id=?',
      [category_id, name, slug, description || null, price, stock_quantity || 0, thumbnail_url || null, is_active ?? 1, id]
    );
    res.json({ success: true, message: 'Cập nhật sản phẩm thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ success: true, message: 'Đã xóa vĩnh viễn sản phẩm' });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      await db.query('UPDATE products SET is_active = 0 WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Sản phẩm đã từng có đơn hàng nên hệ thống tự động chuyển sang trạng thái ẨN (Xóa mềm)!' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;