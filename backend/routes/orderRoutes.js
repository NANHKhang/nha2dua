const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 1. Lấy danh sách đơn hàng (Admin)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT o.*, u.email AS user_email 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id 
      ORDER BY o.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Lấy chi tiết sản phẩm trong 1 đơn hàng
router.get('/:id/items', async (req, res) => {
  try {
    const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Tạo đơn hàng mới từ giỏ hàng của User
router.post('/', async (req, res) => {
  const { user_id, receiver_name, receiver_phone, shipping_address, payment_method, note, items } = req.body;

  if (!receiver_name || !receiver_phone || !shipping_address || !items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập đủ thông tin nhận hàng và chọn ít nhất 1 sản phẩm!' });
  }

  // Tạo mã đơn hàng 12 ký tự (CHAR(12))
  const orderCode = 'ORD' + Date.now().toString().slice(-9);
  const totalAmount = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
  // Nếu khách chưa đăng nhập thì gán tạm user_id = 2 (tài khoản khách mẫu trong DB)
  const customerId = user_id || 2;

  try {
    const [orderResult] = await db.query(
      `INSERT INTO orders (order_code, user_id, status, payment_method, payment_status, total_amount, receiver_name, receiver_phone, shipping_address, note) 
       VALUES (?, ?, 'pending', ?, 'unpaid', ?, ?, ?, ?, ?)`,
      [orderCode, customerId, payment_method || 'cod', totalAmount, receiver_name, receiver_phone, shipping_address, note || null]
    );

    const orderId = orderResult.insertId;

    // Lưu từng dòng sản phẩm vào order_items và trừ tồn kho
    for (const item of items) {
      await db.query(
        'INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.id, item.name, item.price, item.quantity]
      );
      await db.query(
        'UPDATE products SET stock_quantity = GREATEST(stock_quantity - ?, 0) WHERE id = ?',
        [item.quantity, item.id]
      );
    }

    res.status(201).json({ success: true, order_code: orderCode, message: 'Đặt hàng thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Cập nhật trạng thái đơn hàng (Admin)
router.put('/:id/status', async (req, res) => {
  const { status, payment_status } = req.body;
  try {
    await db.query(
      'UPDATE orders SET status = ?, payment_status = ? WHERE id = ?',
      [status, payment_status, req.params.id]
    );
    res.json({ success: true, message: 'Cập nhật trạng thái đơn hàng thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;