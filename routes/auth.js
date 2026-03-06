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

module.exports = router;