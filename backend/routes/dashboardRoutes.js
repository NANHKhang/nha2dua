const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/stats', async (req, res) => {
  try {
    const [[{ totalRevenue }]] = await db.query(
      "SELECT COALESCE(SUM(total_amount), 0) AS totalRevenue FROM orders WHERE status = 'completed'"
    );
    const [[{ totalOrders }]] = await db.query('SELECT COUNT(*) AS totalOrders FROM orders');
    const [[{ totalProducts }]] = await db.query('SELECT COUNT(*) AS totalProducts FROM products WHERE is_active = 1');
    const [[{ totalUsers }]] = await db.query('SELECT COUNT(*) AS totalUsers FROM users WHERE role_id = 1');

    const [recentOrders] = await db.query(
      'SELECT id, order_code, receiver_name, total_amount, status, payment_status, created_at FROM orders ORDER BY created_at DESC LIMIT 5'
    );

    res.json({
      success: true,
      data: { totalRevenue, totalOrders, totalProducts, totalUsers, recentOrders }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;