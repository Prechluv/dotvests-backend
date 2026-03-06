const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { protect } = require('../middleware/auth');

// PLACE ORDER (BUY OR SELL)
router.post('/place', protect, (req, res) => {
  try {
    const { stock_id, type, quantity, price } = req.body;

    if (!stock_id || !type || !quantity || !price) {
      return res.status(400).json({
        success: false,
        message: 'Stock, type, quantity and price are all required'
      });
    }

    if (type !== 'buy' && type !== 'sell') {
      return res.status(400).json({
        success: false,
        message: 'Order type must be buy or sell'
      });
    }

    const stock = db.prepare(
      'SELECT * FROM stocks WHERE id = ? AND is_active = 1'
    ).get(stock_id);

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found or unavailable'
      });
    }

    const total = quantity * price;
    const wallet = db.prepare(
      'SELECT * FROM wallets WHERE user_id = ?'
    ).get(req.user.id);

    // BUY ORDER — check wallet balance
    if (type === 'buy') {
      if (wallet.balance < total) {
        return res.status(400).json({
          success: false,
          message: `Insufficient balance. You need ₦${total.toLocaleString()} but have ₦${wallet.balance.toLocaleString()}`
        });
      }

      // Deduct from wallet
      db.prepare(
        'UPDATE wallets SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
      ).run(wallet.balance - total, req.user.id);

      // Record transaction
      const reference = 'BUY-' + Date.now() + '-' + req.user.id;
      db.prepare(`
        INSERT INTO transactions (user_id, type, amount, description, reference, status)
        VALUES (?, 'buy', ?, ?, ?, 'completed')
      `).run(req.user.id, total, `Bought ${quantity} units of ${stock.ticker}`, reference);

      // Update portfolio
      const existing = db.prepare(
        'SELECT * FROM portfolio WHERE user_id = ? AND stock_id = ?'
      ).get(req.user.id, stock_id);

      if (existing) {
        const newQuantity = existing.quantity + quantity;
        const newAvgPrice = ((existing.avg_buy_price * existing.quantity) + (price * quantity)) / newQuantity;
        db.prepare(`
          UPDATE portfolio SET quantity = ?, avg_buy_price = ?, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ? AND stock_id = ?
        `).run(newQuantity, newAvgPrice, req.user.id, stock_id);
      } else {
        db.prepare(`
          INSERT INTO portfolio (user_id, stock_id, quantity, avg_buy_price)
          VALUES (?, ?, ?, ?)
        `).run(req.user.id, stock_id, quantity, price);
      }

      // Notify user
      db.prepare(`
        INSERT INTO notifications (user_id, title, message)
        VALUES (?, 'Buy Order Executed', ?)
      `).run(req.user.id, `You bought ${quantity} units of ${stock.ticker} at ₦${price.toLocaleString()} each`);
    }

    // SELL ORDER — check portfolio holdings
    if (type === 'sell') {
      const holding = db.prepare(
        'SELECT * FROM portfolio WHERE user_id = ? AND stock_id = ?'
      ).get(req.user.id, stock_id);

      if (!holding || holding.quantity < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient holdings. You only have ${holding ? holding.quantity : 0} units of ${stock.ticker}`
        });
      }

      // Credit wallet
      db.prepare(
        'UPDATE wallets SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
      ).run(wallet.balance + total, req.user.id);

      // Record transaction
      const reference = 'SELL-' + Date.now() + '-' + req.user.id;
      db.prepare(`
        INSERT INTO transactions (user_id, type, amount, description, reference, status)
        VALUES (?, 'sell', ?, ?, ?, 'completed')
      `).run(req.user.id, total, `Sold ${quantity} units of ${stock.ticker}`, reference);

      // Update portfolio
      const newQuantity = holding.quantity - quantity;
      if (newQuantity === 0) {
        db.prepare(
          'DELETE FROM portfolio WHERE user_id = ? AND stock_id = ?'
        ).run(req.user.id, stock_id);
      } else {
        db.prepare(`
          UPDATE portfolio SET quantity = ?, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ? AND stock_id = ?
        `).run(newQuantity, req.user.id, stock_id);
      }

      // Notify user
      db.prepare(`
        INSERT INTO notifications (user_id, title, message)
        VALUES (?, 'Sell Order Executed', ?)
      `).run(req.user.id, `You sold ${quantity} units of ${stock.ticker} at ₦${price.toLocaleString()} each`);
    }

    // Record the order
    const order = db.prepare(`
      INSERT INTO orders (user_id, stock_id, type, quantity, price, total, status)
      VALUES (?, ?, ?, ?, ?, ?, 'executed')
    `).run(req.user.id, stock_id, type, quantity, price, total);

    return res.status(201).json({
      success: true,
      message: `${type.toUpperCase()} order executed successfully`,
      order: {
        id: order.lastInsertRowid,
        stock: stock.ticker,
        type,
        quantity,
        price,
        total
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Order failed. Please try again.',
      error: error.message
    });
  }
});

// GET MY ORDER HISTORY
router.get('/my-orders', protect, (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.*, s.name as stock_name, s.ticker
      FROM orders o
      INNER JOIN stocks s ON o.stock_id = s.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `).all(req.user.id);

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not fetch orders',
      error: error.message
    });
  }
});

// GET SINGLE ORDER
router.get('/:id', protect, (req, res) => {
  try {
    const order = db.prepare(`
      SELECT o.*, s.name as stock_name, s.ticker
      FROM orders o
      INNER JOIN stocks s ON o.stock_id = s.id
      WHERE o.id = ? AND o.user_id = ?
    `).get(req.params.id, req.user.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    return res.status(200).json({
      success: true,
      order
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not fetch order',
      error: error.message
    });
  }
});

module.exports = router