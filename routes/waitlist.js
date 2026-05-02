const express = require('express');
const router = express.Router();
const db = require('../config/db');

// JOIN WAITLIST
router.post('/join', (req, res) => {
  try {
    const { email, source = 'unknown' } = req.body;

    // Validate email
    if (!email || email.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Check if email already exists
    const existing = db.prepare(
      'SELECT id FROM waitlist WHERE email = ?'
    ).get(email.toLowerCase());

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You are already on the waitlist with this email'
      });
    }

    // Add to waitlist
    const result = db.prepare(`
      INSERT INTO waitlist (email, source, status)
      VALUES (?, ?, 'pending')
    `).run(email.toLowerCase(), source);

    return res.status(201).json({
      success: true,
      message: 'You have successfully joined the waitlist',
      message_detail: 'Updates will be shared via the email you provided',
      waitlist_id: result.lastInsertRowid,
      email: email.toLowerCase(),
      joined_at: new Date().toISOString()
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not join waitlist',
      error: error.message
    });
  }
});

// GET WAITLIST COUNT (Public - no auth needed)
router.get('/count', (req, res) => {
  try {
    const result = db.prepare(
      'SELECT COUNT(*) as count FROM waitlist WHERE status = ?'
    ).get('pending');

    return res.status(200).json({
      success: true,
      count: result.count,
      message: `${result.count} people are on the waitlist`
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not fetch waitlist count',
      error: error.message
    });
  }
});

// CHECK IF EMAIL IS ON WAITLIST (Public - no auth needed)
router.post('/check', (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = db.prepare(
      'SELECT id, status, joined_at FROM waitlist WHERE email = ?'
    ).get(email.toLowerCase());

    if (!user) {
      return res.status(200).json({
        success: true,
        on_waitlist: false,
        message: 'Email not found on waitlist'
      });
    }

    return res.status(200).json({
      success: true,
      on_waitlist: true,
      status: user.status,
      joined_at: user.joined_at,
      message: `Email is on waitlist with status: ${user.status}`
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not check waitlist status',
      error: error.message
    });
  }
});

// REMOVE FROM WAITLIST (for testing/admin purposes)
router.delete('/remove', (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    db.prepare(
      'DELETE FROM waitlist WHERE email = ?'
    ).run(email.toLowerCase());

    return res.status(200).json({
      success: true,
      message: 'Email removed from waitlist'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not remove from waitlist',
      error: error.message
    });
  }
});

module.exports = router;
