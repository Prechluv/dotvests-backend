const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

// REGISTER
router.post('/register', (req, res) => {
  try {
    const { full_name, email, phone, password } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email and password are required'
      });
    }

    const existingUser = db.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).get(email);

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = db.prepare(`
      INSERT INTO users (full_name, email, phone, password)
      VALUES (?, ?, ?, ?)
    `).run(full_name, email, phone, hashedPassword);

    db.prepare(`
      INSERT INTO wallets (user_id, balance)
      VALUES (?, 0.00)
    `).run(newUser.lastInsertRowid);

    const token = jwt.sign(
      {
        id: newUser.lastInsertRowid,
        email,
        role: 'user'
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: newUser.lastInsertRowid,
        full_name,
        email,
        phone
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      error: error.message
    });
  }
});

// LOGIN
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = db.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).get(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (user.account_status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Contact support.'
      });
    }

    const passwordMatch = bcrypt.compareSync(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        kyc_status: user.kyc_status,
        account_status: user.account_status,
        role: user.role
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
      error: error.message
    });
  }
});

// GET CURRENT USER
router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = db.prepare(
      'SELECT id, full_name, email, phone, kyc_status, account_status, role, created_at FROM users WHERE id = ?'
    ).get(decoded.id);

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
      message: 'Could not fetch user',
      error: error.message
    });
  }
});

// FORGOT PASSWORD
router.post('/forgot-password', (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = db.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).get(email);

    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a reset link has been sent.'
      });
    }

    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const resetExpiry = Date.now() + 3600000; // 1 hour

    db.prepare(`
      UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?
    `).run(resetToken, resetExpiry, user.id);

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: email,
      from: process.env.FROM_EMAIL,
      subject: 'DotVests — Password Reset Request',
      html: `
        <div style="background:#0a0a0a;padding:40px;font-family:Arial,sans-serif;color:#e0e0e0;">
          <h1 style="color:#D4AF37;">DotVests</h1>
          <h2 style="color:#fff;">Password Reset Request</h2>
          <p>You requested a password reset for your DotVests account.</p>
          <p>Click the button below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetLink}" style="display:inline-block;background:#D4AF37;color:#000;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin:20px 0;">Reset My Password</a>
          <p style="color:#888;font-size:0.85em;">If you did not request this, ignore this email. Your password will not change.</p>
          <p style="color:#555;font-size:0.8em;">DotVests Technologies Limited — Built from Ogoni Land</p>
        </div>
      `
    };

    sgMail.send(msg).then(() => {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a reset link has been sent.'
      });
    }).catch((error) => {
      console.error('Email error:', error);
      return res.status(500).json({
        success: false,
        message: 'Could not send reset email. Please try again.',
        error: error.message
      });
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.',
      error: error.message
    });
  }
});

// RESET PASSWORD
router.post('/reset-password', (req, res) => {
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    const user = db.prepare(
      'SELECT * FROM users WHERE reset_token = ?'
    ).get(token);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    if (Date.now() > user.reset_token_expiry) {
      return res.status(400).json({
        success: false,
        message: 'Reset token has expired. Please request a new one.'
      });
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync(new_password, 10);

    db.prepare(`
      UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL
      WHERE id = ?
    `).run(hashedPassword, user.id);

    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: user.email,
      from: process.env.FROM_EMAIL,
      subject: 'DotVests — Password Changed Successfully',
      html: `
        <div style="background:#0a0a0a;padding:40px;font-family:Arial,sans-serif;color:#e0e0e0;">
          <h1 style="color:#D4AF37;">DotVests</h1>
          <h2 style="color:#00C076;">Password Changed Successfully</h2>
          <p>Your DotVests password has been changed successfully.</p>
          <p>If you did not make this change, contact us immediately at support@dotvests.com</p>
          <p style="color:#555;font-size:0.8em;">DotVests Technologies Limited — Built from Ogoni Land</p>
        </div>
      `
    };

    sgMail.send(msg).catch(err => console.error('Confirmation email error:', err));

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Password reset failed. Please try again.',
      error: error.message
    });
  }
});
module.exports = router;