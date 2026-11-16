const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET: Lấy toàn bộ danh mục từ Aiven trả về JSON cho Frontend
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categories ORDER BY id ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST: Nhận dữ liệu từ Frontend và lưu vào Aiven
router.post('/', async (req, res) => {
  const { name, slug, parent_id } = req.body;
  if (!name || !slug) {
    return res.status(400).json({ success: false, message: 'Thiếu name hoặc slug' });
  }
  try {
    const [maxRows] = await db.query('SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM categories');
    const nextId = maxRows[0].nextId;

    await db.query(
      'INSERT INTO categories (id, name, slug, parent_id) VALUES (?, ?, ?, ?)',
      [nextId, name, slug, parent_id || null]
    );
    res.status(201).json({ success: true, id: nextId, name, slug });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT: Cập nhật dòng dữ liệu trên Aiven
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

// DELETE: Xóa dữ liệu trên Aiven và dồn lại ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM categories WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    }

    try {
      await db.query('UPDATE categories SET id = id - 1 WHERE id > ? ORDER BY id ASC', [id]);
      const [maxRows] = await db.query('SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM categories');
      await db.query(`ALTER TABLE categories AUTO_INCREMENT = ${Number(maxRows[0].nextId)}`);
    } catch (e) {}

    res.json({ success: true, message: 'Xóa thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;