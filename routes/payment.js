const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../config/db');
const { protect } = require('../middleware/auth');

router.post('/initialize', protect, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum deposit is N100'
      });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: user.email,
        amount: amount * 100,
        metadata: {
          user_id: req.user.id,
          full_name: user.full_name
        }
      },
      {
        headers: {
          Authorization: 'Bearer ' + process.env.PAYSTACK_SECRET_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    const { authorization_url, access_code, reference } = response.data.data;

    db.prepare(
      'INSERT INTO transactions (user_id, type, amount, description, reference, status) VALUES (?, \'deposit\', ?, \'Wallet deposit via Paystack\', ?, \'pending\')'
    ).run(req.user.id, amount, reference);

    return res.status(200).json({
      success: true,
      message: 'Payment initialized',
      data: {
        authorization_url,
        access_code,
        reference,
        amount
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not initialize payment',
      error: error.message
    });
  }
});

router.get('/verify/:reference', protect, async (req, res) => {
  try {
    const { reference } = req.params;

    const response = await axios.get(
      'https://api.paystack.co/transaction/verify/' + reference,
      {
        headers: {
          Authorization: 'Bearer ' + process.env.PAYSTACK_SECRET_KEY
        }
      }
    );

    const { status, amount, metadata } = response.data.data;

    if (status !== 'success') {
      return res.status(400).json({
        success: false,
        message: 'Payment not successful'
      });
    }

    const existing = db.prepare(
      'SELECT * FROM transactions WHERE reference = ? AND status = ?'
    ).get(reference, 'completed');

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Transaction already processed'
      });
    }

    const amountInNaira = amount / 100;

    const wallet = db.prepare(
      'SELECT * FROM wallets WHERE user_id = ?'
    ).get(req.user.id);

    db.prepare(
      'UPDATE wallets SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
    ).run(wallet.balance + amountInNaira, req.user.id);

    db.prepare(
      'UPDATE transactions SET status = ? WHERE reference = ?'
    ).run('completed', reference);

    db.prepare(
      'INSERT INTO notifications (user_id, title, message) VALUES (?, \'Deposit Successful\', ?)'
    ).run(req.user.id, `₦${amountInNaira.toLocaleString()} has been added to your DotVests wallet`);

    return res.status(200).json({
      success: true,
      message: `₦${amountInNaira.toLocaleString()} deposited successfully`,
      new_balance: wallet.balance + amountInNaira
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not verify payment',
      error: error.message
    });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const hash = require('crypto')
      .createHmac('sha512', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(401).json({ message: 'Invalid signature' });
    }

    const { event, data } = req.body;

    if (event === 'charge.success') {
      const { reference, amount, metadata } = data;
      const user_id = metadata.user_id;
      const amountInNaira = amount / 100;

      const existing = db.prepare(
        'SELECT * FROM transactions WHERE reference = ? AND status = ?'
      ).get(reference, 'completed');

      if (!existing) {
        const wallet = db.prepare(
          'SELECT * FROM wallets WHERE user_id = ?'
        ).get(user_id);

        if (wallet) {
          db.prepare(
            'UPDATE wallets SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
          ).run(wallet.balance + amountInNaira, user_id);

          db.prepare(
            'UPDATE transactions SET status = ? WHERE reference = ?'
          ).run('completed', reference);

          db.prepare(
            'INSERT INTO notifications (user_id, title, message) VALUES (?, \'Deposit Successful\', ?)'
          ).run(user_id, amountInNaira + ' has been added to your DotVests wallet');
        }
      }
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;