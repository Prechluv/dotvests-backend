const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { protect, adminOnly } = require('../middleware/auth');

// GET ALL USERS
router.get('/users', protect, adminOnly, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, full_name, email, phone, kyc_status, 
      account_status, role, created_at 
      FROM users ORDER BY created_at DESC
    `).all();

    return res.status(200).json({
      success: true,
      count: users.length,
      users
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not fetch users',
      error: error.message
    });
  }
});

// GET SINGLE USER
router.get('/users/:id', protect, adminOnly, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, full_name, email, phone, bvn, nin,
      kyc_status, account_status, role, created_at
      FROM users WHERE id = ?
    `).get(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const wallet = db.prepare(
      'SELECT * FROM wallets WHERE user_id = ?'
    ).get(req.params.id);

    const totalOrders = db.prepare(
      'SELECT COUNT(*) as count FROM orders WHERE user_id = ?'
    ).get(req.params.id);

    return res.status(200).json({
      success: true,
      user,
      wallet,
      total_orders: totalOrders.count
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not fetch user',
      error: error.message
    });
  }
});

// APPROVE KYC
router.patch('/kyc/approve/:id', protect, adminOnly, (req, res) => {
  try {
    const user = db.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).get(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    db.prepare(
      'UPDATE users SET kyc_status = "verified" WHERE id = ?'
    ).run(req.params.id);

    db.prepare(`
      INSERT INTO notifications (user_id, title, message)
      VALUES (?, 'KYC Approved', ?)
    `).run(req.params.id, 'Congratulations! Your identity has been verified. You now have full access to DotVests.');

    return res.status(200).json({
      success: true,
      message: 'KYC approved successfully'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not approve KYC',
      error: error.message
    });
  }
});

// REJECT KYC
router.patch('/kyc/reject/:id', protect, adminOnly, (req, res) => {
  try {
    const { reason } = req.body;

    db.prepare(
      'UPDATE users SET kyc_status = "rejected" WHERE id = ?'
    ).run(req.params.id);

    db.prepare(`
      INSERT INTO notifications (user_id, title, message)
      VALUES (?, 'KYC Rejected', ?)
    `).run(req.params.id, `Your KYC submission was rejected. Reason: ${reason || 'Documents could not be verified'}. Please resubmit.`);

    return res.status(200).json({
      success: true,
      message: 'KYC rejected'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not reject KYC',
      error: error.message
    });
  }
});

// SUSPEND USER
router.patch('/users/suspend/:id', protect, adminOnly, (req, res) => {
  try {
    db.prepare(
      'UPDATE users SET account_status = "suspended" WHERE id = ?'
    ).run(req.params.id);

    db.prepare(`
      INSERT INTO notifications (user_id, title, message)
      VALUES (?, 'Account Suspended', ?)
    `).run(req.params.id, 'Your account has been suspended. Please contact support at support@dotvests.com');

    return res.status(200).json({
      success: true,
      message: 'User suspended successfully'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not suspend user',
      error: error.message
    });
  }
});

// ACTIVATE USER
router.patch('/users/activate/:id', protect, adminOnly, (req, res) => {
  try {
    db.prepare(
      'UPDATE users SET account_status = "active" WHERE id = ?'
    ).run(req.params.id);

    db.prepare(`
      INSERT INTO notifications (user_id, title, message)
      VALUES (?, 'Account Activated', ?)
    `).run(req.params.id, 'Your account has been reactivated. Welcome back to DotVests!');

    return res.status(200).json({
      success: true,
      message: 'User activated successfully'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not activate user',
      error: error.message
    });
  }
});

// PLATFORM STATISTICS
router.get('/stats', protect, adminOnly, (req, res) => {
  try {
    const totalUsers = db.prepare(
      'SELECT COUNT(*) as count FROM users WHERE role = "user"'
    ).get();

    const verifiedUsers = db.prepare(
      'SELECT COUNT(*) as count FROM users WHERE kyc_status = "verified"'
    ).get();

    const pendingKyc = db.prepare(
      'SELECT COUNT(*) as count FROM users WHERE kyc_status = "pending"'
    ).get();

    const totalOrders = db.prepare(
      'SELECT COUNT(*) as count FROM orders'
    ).get();

    const totalBuyVolume = db.prepare(
      'SELECT SUM(total) as total FROM orders WHERE type = "buy"'
    ).get();

    const totalSellVolume = db.prepare(
      'SELECT SUM(total) as total FROM orders WHERE type = "sell"'
    ).get();

    const totalDeposits = db.prepare(
      'SELECT SUM(amount) as total FROM transactions WHERE type = "deposit"'
    ).get();

    const totalWithdrawals = db.prepare(
      'SELECT SUM(amount) as total FROM transactions WHERE type = "withdrawal"'
    ).get();

    const totalWalletBalance = db.prepare(
      'SELECT SUM(balance) as total FROM wallets'
    ).get();

    const activeStocks = db.prepare(
      'SELECT COUNT(*) as count FROM stocks WHERE is_active = 1'
    ).get();

    return res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers.count,
          verified: verifiedUsers.count,
          pending_kyc: pendingKyc.count
        },
        trading: {
          total_orders: totalOrders.count,
          total_buy_volume: totalBuyVolume.total || 0,
          total_sell_volume: totalSellVolume.total || 0
        },
        financial: {
          total_deposits: totalDeposits.total || 0,
          total_withdrawals: totalWithdrawals.total || 0,
          total_wallet_balance: totalWalletBalance.total || 0
        },
        platform: {
          active_stocks: activeStocks.count
        }
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not fetch stats',
      error: error.message
    });
  }
});

module.exports = router;