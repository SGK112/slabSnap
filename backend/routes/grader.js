import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

// In-memory lead storage (for call-me links)
const graderLeads = new Map();

// Backend URL for internal API calls
const THIS_BACKEND_URL = process.env.THIS_BACKEND_URL || 'https://remodely-backend.onrender.com';

// Email transporter using existing SMTP env vars
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD?.replace(/\s/g, '')
  }
});

// Grade a website - proxy to Python grader
router.post('/', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    const response = await fetch('https://remodely-grader.onrender.com/api/grade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error('Grader error:', error);
    return res.status(500).json({ success: false, error: 'Grading failed' });
  }
});

// Send email report and optionally trigger/schedule Aria call
router.post('/send-report', async (req, res) => {
  try {
    const { email, name, url, scores, phone, preferredTime, triggerCall } = req.body;

    if (!email || !name || !url || !scores) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Store lead for Aria calls
    const leadId = `grader_${Date.now()}`;
    const graderResults = {
      domain: url,
      overall: scores.overall,
      overall_grade: scores.overall_grade,
      ai_visibility: scores.ai_visibility,
      issues: scores.issues || []
    };

    const overallScore = scores.overall || 0;
    const aiScore = scores.ai_visibility || 0;
    const overallGrade = scores.overall_grade || 'N/A';

    let scoreColor = '#ef4444';
    let scoreMessage = "Your business is invisible to AI. This needs attention.";

    if (overallScore >= 70) {
      scoreColor = '#22c55e';
      scoreMessage = "Good job! Your site has solid foundations.";
    } else if (overallScore >= 50) {
      scoreColor = '#eab308';
      scoreMessage = "There's room for improvement.";
    }

    const greeting = name && !['there', 'user', ''].includes(name.toLowerCase())
      ? `Hi ${name},`
      : "Here's your report!";

    // Build call-me link if phone provided
    const callMeLink = phone ?
      `https://remodely-backend.onrender.com/api/grader/call-me?id=${leadId}` : null;

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#0a0f1a;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#fff;font-size:24px;margin:0;">REMODELY<span style="color:#3b82f6;">.AI</span></h1>
    </div>
    <div style="background:#131c2e;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:32px;margin-bottom:24px;">
      <h2 style="color:#fff;font-size:20px;margin:0 0 8px 0;">${greeting}</h2>
      <p style="color:#9ca3af;margin:0 0 24px 0;">Your AI Visibility Report for <strong style="color:#fff;">${url}</strong></p>
      <div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
        <div style="font-size:14px;color:#9ca3af;text-transform:uppercase;margin-bottom:8px;">Overall Score</div>
        <div style="font-size:48px;font-weight:700;color:${scoreColor};">${overallScore}</div>
        <div style="display:inline-block;background:${scoreColor}20;color:${scoreColor};padding:4px 12px;border-radius:4px;font-size:14px;font-weight:600;margin-top:8px;">Grade: ${overallGrade}</div>
      </div>
      <div style="margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.1);">
          <span style="color:#9ca3af;">AI Visibility</span>
          <span style="color:#fff;font-weight:600;">${aiScore}/100</span>
        </div>
      </div>
      <p style="color:#9ca3af;font-size:15px;margin:0;">${scoreMessage}</p>
    </div>
    ${callMeLink ? `
    <div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);border-radius:12px;padding:24px;text-align:center;margin-bottom:16px;">
      <h3 style="color:#fff;font-size:18px;margin:0 0 8px 0;">Have Aria Call You Now</h3>
      <p style="color:#9ca3af;margin:0 0 16px 0;font-size:14px;">Our AI assistant will call to discuss your results.</p>
      <a href="${callMeLink}" style="display:inline-block;background:#3b82f6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Call Me Now</a>
    </div>
    ` : ''}
    <div style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2);border-radius:12px;padding:24px;text-align:center;">
      <h3 style="color:#fff;font-size:18px;margin:0 0 8px 0;">Want to Improve Your Score?</h3>
      <p style="color:#9ca3af;margin:0 0 16px 0;font-size:14px;">Book a free 15-minute consultation with our team.</p>
      <a href="https://remodely.ai/#contact" style="display:inline-block;background:#22c55e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Book Free Consultation</a>
    </div>
    <div style="text-align:center;color:#6b7280;font-size:12px;margin-top:24px;">
      <p style="margin:0;">Remodely AI | <a href="https://remodely.ai" style="color:#3b82f6;">remodely.ai</a></p>
    </div>
  </div>
</body>
</html>`;

    await transporter.sendMail({
      from: `"Remodely AI" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: email,
      subject: `Your AI Visibility Report - Score: ${overallScore}/100`,
      html
    });

    // Store lead for call-me link
    if (phone) {
      graderLeads.set(leadId, {
        name,
        email,
        phone,
        url,
        graderResults,
        preferredTime,
        createdAt: new Date().toISOString()
      });
    }

    // Trigger immediate call if requested
    if (triggerCall && phone) {
      triggerAriaCall(leadId, name, phone, url, graderResults).catch(err => {
        console.error('Auto-call failed:', err);
      });
    }

    console.log(`Report sent to ${email}`);
    return res.json({ success: true, message: 'Report sent', leadId });
  } catch (error) {
    console.error('Send report error:', error);
    return res.status(500).json({ success: false, error: 'Failed to send report' });
  }
});

// Call-me endpoint (from email link)
router.get('/call-me', async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).send('Missing lead ID');
  }

  const lead = graderLeads.get(id);
  if (!lead) {
    return res.send(`
      <html>
        <head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body style="font-family:Arial;text-align:center;padding:40px;background:#0a0f1a;color:#fff;">
          <h2>Link Expired</h2>
          <p>This call link has expired. Please request a new report.</p>
          <a href="https://remodely.ai/grader.html" style="color:#3b82f6;">Get New Report</a>
        </body>
      </html>
    `);
  }

  try {
    await triggerAriaCall(id, lead.name, lead.phone, lead.url, lead.graderResults);

    return res.send(`
      <html>
        <head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body style="font-family:Arial;text-align:center;padding:40px;background:#0a0f1a;color:#fff;">
          <h2 style="color:#22c55e;">Calling You Now!</h2>
          <p>Aria will call ${lead.phone} in a moment.</p>
          <p style="color:#9ca3af;font-size:14px;">Please answer the call to discuss your AI visibility results.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Call-me error:', error);
    return res.status(500).send(`
      <html>
        <head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body style="font-family:Arial;text-align:center;padding:40px;background:#0a0f1a;color:#fff;">
          <h2 style="color:#ef4444;">Call Failed</h2>
          <p>Unable to initiate call. Please try again or contact us directly.</p>
        </body>
      </html>
    `);
  }
});

// Helper to trigger Aria call via internal API
async function triggerAriaCall(leadId, name, phone, url, graderResults) {
  const response = await fetch(`${THIS_BACKEND_URL}/api/aria-realtime/trigger-call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      leadId,
      contactName: name,
      contactPhone: phone,
      businessName: url,
      graderResults,
      source: 'grader_email'
    })
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Call failed');
  }

  console.log(`[GRADER CALL] Initiated via aria-realtime: ${data.callId}`);
  return data;
}

export default router;
