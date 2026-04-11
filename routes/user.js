const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { protect } = require('../middleware/auth');

// GET MY PROFILE
router.get('/profile', protect, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, full_name, email, phone, bvn, nin, 
      kyc_status, account_status, role, created_at 
      FROM users WHERE id = ?
    `).get(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not fetch profile',
      error: error.message
    });
  }
});

// UPDATE PROFILE
router.patch('/profile', protect, (req, res) => {
  try {
    const { full_name, phone } = req.body;

    if (!full_name || full_name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Full name is required and cannot be empty'
      });
    }

    db.prepare(`
      UPDATE users SET full_name = ?, phone = ?
      WHERE id = ?
    `).run(full_name.trim(), phone, req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not update profile',
      error: error.message
    });
  }
});

// SUBMIT KYC
router.post('/kyc', protect, (req, res) => {
  try {
    const { bvn, nin } = req.body;

    if (!bvn || !nin) {
      return res.status(400).json({
        success: false,
        message: 'BVN and NIN are required'
      });
    }

    const user = db.prepare(
      'SELECT kyc_status FROM users WHERE id = ?'
    ).get(req.user.id);

    if (user.kyc_status === 'verified') {
      return res.status(400).json({
        success: false,
        message: 'Your account is already verified'
      });
    }

    db.prepare(`
      UPDATE users SET bvn = ?, nin = ?, kyc_status = 'pending'
      WHERE id = ?
    `).run(bvn, nin, req.user.id);

    db.prepare(`
      INSERT INTO notifications (user_id, title, message)
      VALUES (?, 'KYC Submitted', ?)
    `).run(req.user.id, 'Your KYC documents have been submitted and are under review. This usually takes 24-48 hours.');

    return res.status(200).json({
      success: true,
      message: 'KYC submitted successfully. Under review within 24-48 hours.'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'KYC submission failed',
      error: error.message
    });
  }
});

// GET MY NOTIFICATIONS
router.get('/notifications', protect, (req, res) => {
  try {
    const notifications = db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id);

    const unread = notifications.filter(n => n.is_read === 0).length;

    return res.status(200).json({
      success: true,
      unread_count: unread,
      notifications
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not fetch notifications',
      error: error.message
    });
  }
});

// MARK NOTIFICATION AS READ
router.patch('/notifications/:id', protect, (req, res) => {
  try {
    db.prepare(`
      UPDATE notifications SET is_read = 1
      WHERE id = ? AND user_id = ?
    `).run(req.params.id, req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not update notification',
      error: error.message
    });
  }
});

// MARK ALL NOTIFICATIONS AS READ
router.patch('/notifications', protect, (req, res) => {
  try {
    db.prepare(`
      UPDATE notifications SET is_read = 1
      WHERE user_id = ?
    `).run(req.user.id);

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not update notifications',
      error: error.message
    });
  }
});

// CHANGE PASSWORD
router.patch('/change-password', protect, (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Current and new password are required'
      });
    }

    const user = db.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).get(req.user.id);

    const passwordMatch = bcrypt.compareSync(current_password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    const hashedPassword = bcrypt.hashSync(new_password, 10);

    db.prepare(
      'UPDATE users SET password = ? WHERE id = ?'
    ).run(hashedPassword, req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not change password',
      error: error.message
    });
  }
});

module.exports = router;