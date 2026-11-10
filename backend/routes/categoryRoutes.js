const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. READ ALL: Lấy danh sách danh mục
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categories ORDER BY id DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. CREATE: Thêm danh mục mới
router.post('/', async (req, res) => {
  const { name, slug, parent_id } = req.body;
  if (!name || !slug) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập name và slug' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO categories (name, slug, parent_id) VALUES (?, ?, ?)',
      [name, slug, parent_id || null]
    );
    res.status(201).json({ success: true, id: result.insertId, name, slug });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. UPDATE: Sửa danh mục theo ID
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, slug, parent_id } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE categories SET name = ?, slug = ?, parent_id = ? WHERE id = ?',
      [name, slug, parent_id || null, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    }
    res.json({ success: true, message: 'Cập nhật thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. DELETE: Xóa danh mục theo ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM categories WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    }
    res.json({ success: true, message: 'Xóa thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;