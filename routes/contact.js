const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Helper function to send admin notification email
const sendAdminNotification = async (contactData) => {
  try {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : [];
    if (adminEmails.length === 0) return; // Skip if no admin emails configured

    const emailTemplate = `
      <h2>New Contact Form Submission</h2>
      <p><strong>From:</strong> ${contactData.full_name}</p>
      <p><strong>Email:</strong> <a href="mailto:${contactData.email}">${contactData.email}</a></p>
      <p><strong>Subject:</strong> ${contactData.subject}</p>
      <hr>
      <p><strong>Message:</strong></p>
      <p>${contactData.message.replace(/\n/g, '<br>')}</p>
      <hr>
      <p><small>Submitted at: ${new Date().toISOString()}</small></p>
      <p><a href="${process.env.ADMIN_DASHBOARD_URL || 'http://localhost:3000'}/admin/contact">View in Dashboard</a></p>
    `;

    await sgMail.sendMultiple({
      to: adminEmails,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@dotvests.com',
      subject: `New Contact: ${contactData.subject}`,
      html: emailTemplate
    });
  } catch (error) {
    // Log error but don't fail the user's request
    console.error('Failed to send admin notification:', error.message);
  }
};

// SUBMIT CONTACT MESSAGE
router.post('/submit', (req, res) => {
  try {
    const { full_name, email, subject, message } = req.body;

    // Validate required fields
    if (!full_name || full_name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Full name is required'
      });
    }

    if (!email || email.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    if (!subject || subject.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Subject is required'
      });
    }

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
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

    // Add to contact messages
    const result = db.prepare(`
      INSERT INTO contact_messages (full_name, email, subject, message, status)
      VALUES (?, ?, ?, ?, 'unread')
    `).run(full_name.trim(), email.toLowerCase(), subject.trim(), message.trim());

    // Send admin notification (async, doesn't block response)
    sendAdminNotification({
      full_name: full_name.trim(),
      email: email.toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      contact_id: result.lastInsertRowid
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you for reaching out. We have received your message and will get back to you shortly',
      contact_id: result.lastInsertRowid,
      email: email.toLowerCase(),
      submitted_at: new Date().toISOString()
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not submit contact message',
      error: error.message
    });
  }
});

// GET CONTACT MESSAGES (Admin - for viewing submissions)
router.get('/messages', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const status = req.query.status || 'all';

    let query = 'SELECT id, full_name, email, subject, status, submitted_at FROM contact_messages';
    const params = [];

    if (status !== 'all') {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY submitted_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const messages = db.prepare(query).all(...params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM contact_messages';
    if (status !== 'all') {
      countQuery += ' WHERE status = ?';
    }
    const countParams = status !== 'all' ? [status] : [];
    const totalCount = db.prepare(countQuery).get(...countParams);

    return res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        limit,
        offset,
        total: totalCount.count,
        pages: Math.ceil(totalCount.count / limit)
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not fetch contact messages',
      error: error.message
    });
  }
});

// MARK MESSAGE AS READ (Admin)
router.patch('/messages/:id/read', (req, res) => {
  try {
    const { id } = req.params;

    const message = db.prepare(
      'SELECT id FROM contact_messages WHERE id = ?'
    ).get(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    db.prepare(
      'UPDATE contact_messages SET status = ? WHERE id = ?'
    ).run('read', id);

    return res.status(200).json({
      success: true,
      message: 'Contact message marked as read'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not update contact message',
      error: error.message
    });
  }
});

// DELETE CONTACT MESSAGE (Admin)
router.delete('/messages/:id', (req, res) => {
  try {
    const { id } = req.params;

    db.prepare(
      'DELETE FROM contact_messages WHERE id = ?'
    ).run(id);

    return res.status(200).json({
      success: true,
      message: 'Contact message deleted'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not delete contact message',
      error: error.message
    });
  }
});

module.exports = router;
