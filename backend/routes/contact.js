/**
 * Contact Form Email Route
 * Sends contact form submissions via SMTP
 */

import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

// Create transporter using environment variables
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

// POST /api/contact - Send contact form email
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: name, email, subject, message',
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address',
      });
    }

    // Subject text mapping
    const subjectMap = {
      general: 'General Inquiry',
      support: 'Technical Support',
      partnership: 'Business Partnership',
      feedback: 'Feedback & Suggestions',
    };

    const subjectText = subjectMap[subject] || subject;

    // Create transporter
    const transporter = createTransporter();

    // Email content
    const mailOptions = {
      from: `"REMODELY.AI Website" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
      replyTo: email,
      subject: `[REMODELY.AI] ${subjectText} from ${name}`,
      text: `
New Contact Form Submission
============================

Name: ${name}
Email: ${email}
Subject: ${subjectText}

Message:
${message}

---
Sent from REMODELY.AI website contact form
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0d9488, #14b8a6); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .field { margin-bottom: 15px; }
    .label { font-weight: bold; color: #374151; }
    .value { margin-top: 5px; }
    .message-box { background: white; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; margin-top: 10px; }
    .footer { text-align: center; padding: 15px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">New Contact Form Submission</h2>
      <p style="margin: 5px 0 0 0; opacity: 0.9;">REMODELY.AI Website</p>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">Name</div>
        <div class="value">${name}</div>
      </div>
      <div class="field">
        <div class="label">Email</div>
        <div class="value"><a href="mailto:${email}">${email}</a></div>
      </div>
      <div class="field">
        <div class="label">Subject</div>
        <div class="value">${subjectText}</div>
      </div>
      <div class="field">
        <div class="label">Message</div>
        <div class="message-box">${message.replace(/\n/g, '<br>')}</div>
      </div>
    </div>
    <div class="footer">
      Sent from REMODELY.AI website contact form
    </div>
  </div>
</body>
</html>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    console.log(`✉️ Contact email sent from ${email}`);

    res.json({
      success: true,
      message: 'Your message has been sent successfully!',
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message. Please try again later.',
    });
  }
});

export default router;
