const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. READ ALL: Lấy danh sách danh mục theo thứ tự ID tăng dần (1, 2, 3...)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categories ORDER BY id ASC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. CREATE: Thêm danh mục mới với ID liền kề (không bị nhảy số trên TiDB)
router.post('/', async (req, res) => {
  const { name, slug, parent_id } = req.body;
  if (!name || !slug) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập name và slug' });
  }
  try {
    // Lấy ID tiếp theo = MAX(id) + 1 (nếu bảng trống thì bắt đầu từ 1)
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

// 4. DELETE: Xóa danh mục và dồn lại ID các dòng phía sau
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM categories WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    }

    // Dồn lại ID của các danh mục nằm sau mục vừa xóa (ví dụ xóa 2 thì 3 thành 2)
    try {
      await db.query('UPDATE categories SET id = id - 1 WHERE id > ? ORDER BY id ASC', [id]);
    } catch (reIndexErr) {
      // Bỏ qua nếu có danh mục con hoặc sản phẩm đang tham chiếu khóa ngoại tới ID cũ
    }

    res.json({ success: true, message: 'Xóa thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;