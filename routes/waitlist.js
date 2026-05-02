const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Helper function to send waitlist notification to admins
const sendWaitlistNotification = async (waitlistData) => {
  try {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const notificationEmail = process.env.WAITLIST_NOTIFICATION_EMAIL || process.env.ADMIN_EMAILS?.split(',')[0];
    if (!notificationEmail) return; // Skip if no email configured

    const emailTemplate = `
      <h2>New Waitlist Signup</h2>
      <p><strong>Email:</strong> <a href="mailto:${waitlistData.email}">${waitlistData.email}</a></p>
      <p><strong>Source:</strong> ${waitlistData.source}</p>
      <p><strong>Joined:</strong> ${new Date().toISOString()}</p>
      <hr>
      <p><strong>Waitlist ID:</strong> ${waitlistData.waitlist_id}</p>
    `;

    await sgMail.send({
      to: notificationEmail,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@dotvests.com',
      subject: `New Waitlist Signup: ${waitlistData.email}`,
      html: emailTemplate
    });
  } catch (error) {
    // Log error but don't fail the user's request
    console.error('Failed to send waitlist notification:', error.message);
  }
};

// Helper function to send welcome email to subscriber
const sendSubscriberWelcomeEmail = async (email) => {
  try {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const emailTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #007AFF; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .benefits { list-style-position: inside; margin: 15px 0; }
          .benefits li { margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          .disclaimer { background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 12px; color: #555; }
          .signature { margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Dotvests</div>
            <p style="color: #666; margin: 5px 0;">Building Wealth Through Technology</p>
          </div>

          <h2>Thank You for Subscribing to Dotvests</h2>

          <p>Hi ${email},</p>

          <p>Thank you for subscribing to Dotvests Technologies. We truly appreciate you taking this step towards your financial future.</p>

          <div class="content">
            <h3>Here's what you stand to gain as a subscriber:</h3>
            <ul class="benefits">
              <li><strong>Early access</strong> to emerging investment opportunities</li>
              <li><strong>Practical tips</strong> to grow and manage your wealth (financial literacy)</li>
              <li><strong>Exclusive news and updates</strong> on blockchain technology and the Web3 ecosystem</li>
              <li><strong>Timely insights</strong> on African and global stock markets</li>
              <li><strong>Curated intelligence</strong> to help you make informed financial decisions</li>
            </ul>
          </div>

          <p>We're here to help you move from <strong>earning to building lasting wealth</strong>.</p>

          <div class="disclaimer">
            <strong>Disclaimer:</strong> DotVests is currently in pre-launch phase. No investment services are offered at this time. All content is for informational purposes only.
          </div>

          <div class="signature">
            <p>Warm regards,</p>
            <p><strong>The Dotvests Team</strong></p>
          </div>

          <div class="footer">
            <p>© 2026 Dotvests Technologies. All rights reserved.</p>
            <p>You received this email because you subscribed to our waitlist.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sgMail.send({
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@dotvests.com',
      subject: 'Thank You for Subscribing to Dotvests',
      html: emailTemplate
    });
  } catch (error) {
    // Log error but don't fail the user's request
    console.error('Failed to send welcome email:', error.message);
  }
};

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

    // Send admin notification email (async, doesn't block response)
    sendWaitlistNotification({
      email: email.toLowerCase(),
      source: source,
      waitlist_id: result.lastInsertRowid
    });

    // Send welcome email to subscriber (async, doesn't block response)
    sendSubscriberWelcomeEmail(email.toLowerCase());

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
