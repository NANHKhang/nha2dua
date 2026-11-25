const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Lấy danh sách đơn hàng (hỗ trợ lọc theo user_id nếu khách hàng xem đơn của mình)
router.get('/', async (req, res) => {
  const { user_id } = req.query;
  try {
    let sql = `
      SELECT o.*, u.email AS user_email 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id
    `;
    const params = [];
    if (user_id) {
      sql += ' WHERE o.user_id = ?';
      params.push(user_id);
    }
    sql += ' ORDER BY o.created_at DESC';

    const [orders] = await db.query(sql, params);

    // Nếu là khách hàng xem đơn của mình, lấy kèm chi tiết món ăn/sản phẩm trong từng đơn
    if (user_id && orders.length > 0) {
      const orderIds = orders.map((o) => o.id);
      const [allItems] = await db.query('SELECT * FROM order_items WHERE order_id IN (?)', [orderIds]);
      const ordersWithItems = orders.map((o) => ({
        ...o,
        items: allItems.filter((it) => it.order_id === o.id)
      }));
      return res.json({ success: true, data: ordersWithItems });
    }

    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Lấy chi tiết sản phẩm trong 1 đơn hàng (Admin)
router.get('/:id/items', async (req, res) => {
  try {
    const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Tạo đơn hàng mới
router.post('/', async (req, res) => {
  const { user_id, receiver_name, receiver_phone, shipping_address, payment_method, note, items } = req.body;
  if (!receiver_name || !receiver_phone || !shipping_address || !items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin nhận hàng và giỏ hàng!' });
  }

  const orderCode = 'ORD' + Date.now().toString().slice(-9);
  const totalAmount = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
  const customerId = user_id || 2;

  try {
    const [orderResult] = await db.query(
      `INSERT INTO orders (order_code, user_id, status, payment_method, payment_status, total_amount, receiver_name, receiver_phone, shipping_address, note) 
       VALUES (?, ?, 'pending', ?, 'unpaid', ?, ?, ?, ?, ?)`,
      [orderCode, customerId, payment_method || 'cod', totalAmount, receiver_name, receiver_phone, shipping_address, note || null]
    );

    const orderId = orderResult.insertId;
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

// Cập nhật trạng thái đơn hàng & thanh toán (Admin)
router.put('/:id/status', async (req, res) => {
  const { status, payment_status } = req.body;
  try {
    await db.query(
      'UPDATE orders SET status = ?, payment_status = ? WHERE id = ?',
      [status, payment_status, req.params.id]
    );
    res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;