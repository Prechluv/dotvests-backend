const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { protect } = require('../middleware/auth');

// GET WALLET BALANCE
router.get('/', protect, (req, res) => {
  try {
    const wallet = db.prepare(
      'SELECT * FROM wallets WHERE user_id = ?'
    ).get(req.user.id);

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found'
      });
    }

    return res.status(200).json({
      success: true,
      wallet
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not fetch wallet',
      error: error.message
    });
  }
});

// DEPOSIT FUNDS
router.post('/deposit', protect, (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid amount'
      });
    }

    const wallet = db.prepare(
      'SELECT * FROM wallets WHERE user_id = ?'
    ).get(req.user.id);

    const newBalance = wallet.balance + amount;

    db.prepare(
      'UPDATE wallets SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
    ).run(newBalance, req.user.id);

    const reference = 'DEP-' + Date.now() + '-' + req.user.id;

    db.prepare(`
      INSERT INTO transactions (user_id, type, amount, description, reference, status)
      VALUES (?, 'deposit', ?, 'Wallet deposit', ?, 'completed')
    `).run(req.user.id, amount, reference);

    db.prepare(`
      INSERT INTO notifications (user_id, title, message)
      VALUES (?, 'Deposit Successful', ?)
    `).run(req.user.id, `Your wallet has been credited with ₦${amount.toLocaleString()}`);

    return res.status(200).json({
      success: true,
      message: `₦${amount.toLocaleString()} deposited successfully`,
      new_balance: newBalance,
      reference
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Deposit failed. Please try again.',
      error: error.message
    });
  }
});

// WITHDRAW FUNDS
router.post('/withdraw', protect, (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid amount'
      });
    }

    const wallet = db.prepare(
      'SELECT * FROM wallets WHERE user_id = ?'
    ).get(req.user.id);

    if (wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    const newBalance = wallet.balance - amount;

    db.prepare(
      'UPDATE wallets SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
    ).run(newBalance, req.user.id);

    const reference = 'WDR-' + Date.now() + '-' + req.user.id;

    db.prepare(`
      INSERT INTO transactions (user_id, type, amount, description, reference, status)
      VALUES (?, 'withdrawal', ?, 'Wallet withdrawal', ?, 'completed')
    `).run(req.user.id, amount, reference);

    db.prepare(`
      INSERT INTO notifications (user_id, title, message)
      VALUES (?, 'Withdrawal Successful', ?)
    `).run(req.user.id, `₦${amount.toLocaleString()} has been withdrawn from your wallet`);

    return res.status(200).json({
      success: true,
      message: `₦${amount.toLocaleString()} withdrawal successful`,
      new_balance: newBalance,
      reference
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Withdrawal failed. Please try again.',
      error: error.message
    });
  }
});

// GET TRANSACTION HISTORY
router.get('/transactions', protect, (req, res) => {
  try {
    const transactions = db.prepare(`
      SELECT * FROM transactions
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id);

    return res.status(200).json({
      success: true,
      count: transactions.length,
      transactions
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not fetch transactions',
      error: error.message
    });
  }
});

module.exports = router;