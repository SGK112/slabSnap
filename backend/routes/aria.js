import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

// Twilio config (add to env vars on Render)
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const ARIA_BRIDGE_URL = process.env.ARIA_BRIDGE_URL || 'wss://aria-bridge.onrender.com';
const THIS_BACKEND_URL = process.env.THIS_BACKEND_URL || 'https://remodely-backend.onrender.com';

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD?.replace(/\s/g, '')
  }
});

// In-memory storage for demo (replace with database in production)
const leads = new Map();
const calls = new Map();
const appointments = new Map();
const callContexts = new Map();  // Store full call context for Aria to fetch

// Tool execution endpoint - called by Aria Bridge during calls
router.post('/tool-execute', async (req, res) => {
  const { tool, arguments: args, callContext } = req.body;

  console.log(`[ARIA TOOL] ${tool}`, JSON.stringify(args).substring(0, 200));

  try {
    let result;

    switch(tool) {
      case 'qualify_lead':
        result = await handleQualifyLead(args, callContext);
        break;

      case 'book_demo':
        result = await handleBookDemo(args, callContext);
        break;

      case 'schedule_appointment':
        result = await handleScheduleAppointment(args, callContext);
        break;

      case 'add_note':
        result = await handleAddNote(args, callContext);
        break;

      case 'update_lead_status':
        result = await handleUpdateLeadStatus(args, callContext);
        break;

      case 'send_follow_up_text':
        result = await handleSendText(args, callContext);
        break;

      case 'send_email':
        result = await handleSendEmail(args, callContext);
        break;

      case 'save_call_summary':
        result = await handleSaveCallSummary(args, callContext);
        break;

      case 'end_call':
        result = await handleEndCall(args, callContext);
        break;

      default:
        result = { success: true, message: `Tool ${tool} acknowledged` };
    }

    return res.json(result);
  } catch (error) {
    console.error(`[ARIA TOOL ERROR] ${tool}:`, error);
    return res.json({ success: false, error: error.message });
  }
});

// Trigger a pre-qual call
router.post('/trigger-call', async (req, res) => {
  const {
    leadId,
    contactName,
    contactPhone,
    contactEmail,
    businessName,
    source,
    // Grader results - so Aria can speak about their specific report
    graderResults
  } = req.body;

  if (!contactPhone) {
    return res.status(400).json({ success: false, error: 'Phone number required' });
  }

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return res.status(500).json({ success: false, error: 'Twilio not configured' });
  }

  try {
    const callId = `prequal_${Date.now()}`;

    // Store full context for Aria to fetch (avoids TwiML size limit)
    const systemInstructions = buildPreQualInstructions(contactName, businessName, graderResults);
    callContexts.set(callId, {
      contactName,
      contactPhone,
      contactEmail,
      businessName,
      leadId,
      source,
      graderResults,
      systemInstructions,
      createdAt: new Date().toISOString()
    });

    // Simple TwiML - Aria fetches full context via API
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${ARIA_BRIDGE_URL}/media-stream/${callId}">
      <Parameter name="contactName" value="${contactName || 'there'}" />
      <Parameter name="contactPhone" value="${contactPhone}" />
      <Parameter name="direction" value="outbound" />
      <Parameter name="purpose" value="pre-qualification" />
      <Parameter name="leadId" value="${leadId || ''}" />
      <Parameter name="agentId" value="aria" />
      <Parameter name="voice" value="coral" />
      <Parameter name="backendUrl" value="${THIS_BACKEND_URL}" />
    </Stream>
  </Connect>
</Response>`;

    // Make the call via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`;
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        To: contactPhone,
        From: TWILIO_PHONE_NUMBER,
        Twiml: twiml
      })
    });

    const callData = await response.json();

    if (callData.sid) {
      // Store call info
      calls.set(callId, {
        twilioSid: callData.sid,
        leadId,
        contactName,
        contactPhone,
        contactEmail,
        businessName,
        source,
        status: 'initiated',
        startedAt: new Date().toISOString()
      });

      console.log(`[ARIA CALL] Initiated: ${callId} to ${contactPhone}`);
      return res.json({ success: true, callId, twilioSid: callData.sid });
    } else {
      throw new Error(callData.message || 'Failed to initiate call');
    }
  } catch (error) {
    console.error('[ARIA CALL ERROR]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Get call status
router.get('/call/:callId', (req, res) => {
  const call = calls.get(req.params.callId);
  if (!call) {
    return res.status(404).json({ success: false, error: 'Call not found' });
  }
  return res.json({ success: true, call });
});

// Get call context and system instructions (called by Aria Bridge)
router.get('/call-context/:callId', (req, res) => {
  const context = callContexts.get(req.params.callId);
  if (!context) {
    return res.status(404).json({ success: false, error: 'Call context not found' });
  }
  return res.json({ success: true, ...context });
});

// Get lead info
router.get('/lead/:leadId', (req, res) => {
  const lead = leads.get(req.params.leadId);
  if (!lead) {
    return res.status(404).json({ success: false, error: 'Lead not found' });
  }
  return res.json({ success: true, lead });
});

// List recent leads
router.get('/leads', (req, res) => {
  const allLeads = Array.from(leads.values())
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 50);
  return res.json({ success: true, leads: allLeads });
});

// === Tool Handlers ===

async function handleQualifyLead(args, callContext) {
  const leadId = callContext.leadId || `lead_${Date.now()}`;

  const leadData = {
    id: leadId,
    ...args,
    contactName: callContext.contactName,
    contactPhone: callContext.contactPhone,
    qualifiedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  leads.set(leadId, leadData);

  // Send notification email for hot leads
  if (args.qualificationScore === 'hot') {
    await sendLeadNotification(leadData);
  }

  console.log(`[QUALIFY] Lead ${leadId}: ${args.qualificationScore}`);

  return {
    success: true,
    leadId,
    message: `Lead qualified as ${args.qualificationScore}`
  };
}

async function handleBookDemo(args, callContext) {
  const appointmentId = `demo_${Date.now()}`;

  const appointment = {
    id: appointmentId,
    type: 'demo',
    ...args,
    contactPhone: callContext.contactPhone,
    createdAt: new Date().toISOString()
  };

  appointments.set(appointmentId, appointment);

  // Send confirmation email
  if (args.contactEmail) {
    await sendDemoConfirmation(args);
  }

  console.log(`[BOOK DEMO] ${appointmentId}: ${args.demoType} on ${args.preferredDate}`);

  return {
    success: true,
    appointmentId,
    message: `Demo booked for ${args.preferredDate}`
  };
}

async function handleScheduleAppointment(args, callContext) {
  const appointmentId = `appt_${Date.now()}`;

  const appointment = {
    id: appointmentId,
    ...args,
    contactPhone: callContext.contactPhone,
    createdAt: new Date().toISOString()
  };

  appointments.set(appointmentId, appointment);

  console.log(`[SCHEDULE] ${appointmentId}: ${args.title} on ${args.date}`);

  return {
    success: true,
    appointmentId,
    message: `Appointment scheduled for ${args.date}`
  };
}

async function handleAddNote(args, callContext) {
  const leadId = callContext.leadId;
  if (leadId && leads.has(leadId)) {
    const lead = leads.get(leadId);
    lead.notes = lead.notes || [];
    lead.notes.push({
      type: args.type || 'general',
      content: args.note,
      createdAt: new Date().toISOString()
    });
    lead.updatedAt = new Date().toISOString();
    leads.set(leadId, lead);
  }

  console.log(`[NOTE] ${args.type}: ${args.note.substring(0, 50)}...`);

  return { success: true, message: 'Note added' };
}

async function handleUpdateLeadStatus(args, callContext) {
  const leadId = callContext.leadId;
  if (leadId && leads.has(leadId)) {
    const lead = leads.get(leadId);
    lead.status = args.status;
    lead.statusReason = args.reason;
    lead.updatedAt = new Date().toISOString();
    leads.set(leadId, lead);
  }

  console.log(`[STATUS] ${args.contactName}: ${args.status}`);

  return { success: true, message: `Status updated to ${args.status}` };
}

async function handleSendText(args, callContext) {
  // TODO: Implement Twilio SMS
  console.log(`[TEXT] To ${args.contactPhone}: ${args.message.substring(0, 50)}...`);
  return { success: true, message: 'Text queued for sending' };
}

async function handleSendEmail(args, callContext) {
  try {
    await transporter.sendMail({
      from: `"Remodely AI" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: args.email,
      subject: args.subject,
      text: args.message,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px;">
        <p>${args.message.replace(/\n/g, '<br>')}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">Sent by Remodely AI</p>
      </div>`
    });

    console.log(`[EMAIL] To ${args.email}: ${args.subject}`);
    return { success: true, message: 'Email sent' };
  } catch (error) {
    console.error('[EMAIL ERROR]:', error);
    return { success: false, error: error.message };
  }
}

async function handleSaveCallSummary(args, callContext) {
  const callId = callContext.callId;
  if (callId && calls.has(callId)) {
    const call = calls.get(callId);
    call.summary = args.summary;
    call.outcome = args.outcome;
    call.endedAt = new Date().toISOString();
    calls.set(callId, call);
  }

  console.log(`[SUMMARY] ${args.outcome}: ${args.summary.substring(0, 100)}...`);

  return { success: true, message: 'Call summary saved' };
}

async function handleEndCall(args, callContext) {
  const callId = callContext.callId;
  if (callId && calls.has(callId)) {
    const call = calls.get(callId);
    call.status = 'completed';
    call.endReason = args.reason;
    call.endSummary = args.summary;
    call.endedAt = new Date().toISOString();
    calls.set(callId, call);
  }

  console.log(`[END CALL] ${args.reason}: ${args.summary || 'No summary'}`);

  return { success: true, message: 'Call ended' };
}

// === Helper Functions ===

function buildPreQualInstructions(contactName, businessName, graderResults) {
  // Build compact context about their grader report — keep TIGHT (TwiML 64KB limit
  // doesn't apply since we fetch via /call-context, but every token costs latency).
  let reportContext = '';
  if (graderResults) {
    const score = graderResults.overall || graderResults.scores?.overall || 0;
    const aiScore = graderResults.ai_visibility || graderResults.scores?.ai_visibility || 0;
    const issues = Array.isArray(graderResults.issues) ? graderResults.issues.slice(0, 3) : [];
    reportContext = `\nTHEIR REPORT: ${score}/100 overall, AI visibility ${aiScore}/100. ${score < 50 ? "AI assistants probably aren't recommending them yet — that's the hook." : 'Solid base, real room to climb.'}`;
    if (issues.length) reportContext += `\nTOP ISSUES: ${issues.join(' · ')}`;
  }

  const hook = graderResults
    ? `Hey ${contactName || 'there'}, this is Aria from Remodely AI — you ran your site through our grader, and I wanted to walk you through what we found. Got a sec?`
    : `Hey ${contactName || 'there'}, it's Aria from Remodely AI. Got a quick minute?`;

  return `You're Aria, the AI agent for Remodely AI (pronounced "Re-MOD-uh-lee" — never "Remode-ly"). You're calling ${contactName || 'a lead'}${businessName ? ` at ${businessName}` : ''}.${reportContext}

WHO WE ARE
Remodely AI is an AI consulting and product company for remodeling, construction, and home-services businesses. Most clients spend $4–12K/month on outside SEO, marketing SaaS, answering services, and ad mgmt. We replace that stack with in-house AI they OWN. Typical savings: $48K+/year. Clients keep their accounts, data, and code — no platform jail.

LIVE PRODUCTS YOU CAN MENTION
- VoiceNow CRM (flagship): AI receptionist + CRM, 24/7 calling, instant SMS quotes, scheduling, iOS + Android apps. voicenowcrm.com
- WebStew: AI website builder.
- AI Visibility Grader: free at remodely.ai/grader.html (the one they just used).

WHAT WE BUILD
AI Video, Marketing Automation, API Integration (QuickBooks, Jobber, ServiceTitan, HCP, Google Calendar, Twilio, Stripe), AI Strategy & Audit, AI Content & SEO, Custom AI Agents, iOS/Android Apps, Custom Websites, Local Listings, Authority/Backlinks, Implementation & Training.

INDUSTRIES
Best fit: remodel, construction, kitchen/bath, granite/cabinet/countertop, GC. Strong fit: HVAC, plumbing, electrical, roofing, landscaping, painting, flooring.

HOW WE WORK
Phase 1 (week 1–2) audit + roadmap. Phase 2 (week 3–10) build + integrate + train. Off external retainers within 90 days.

STYLE
Warm, conversational, NOT salesy. 1–2 sentences per turn. One question at a time. Use their name once you have it. Acknowledge what their grader showed before pitching anything.

CALL FLOW
1. Open with: "${hook}"
2. If busy: "Totally fair — when's a better time?" then schedule_appointment.
3. Ask 3 things, max: what they do, biggest pain (missed calls / follow-up / ranking / admin), what they're spending now on outside marketing.
4. ${graderResults ? "Tie their grader score to a specific service we'd recommend — don't list everything." : "Match their pain to ONE service. Don't pitch the menu."}
5. Soft close: "Want me to book a 30-minute audit call with Joshua? No obligation — we map your stack and tell you what's worth keeping vs. replacing."
6. Hot prospect (decision-maker, has budget, timeline within 60 days): book_demo + qualify_lead score=hot.
7. Warm (interested, no timeline): send_follow_up_text with audit link + qualify_lead score=warm.
8. Cold / not a fit: be polite, save_call_summary outcome=not_qualified.
9. ALWAYS before ending: save_call_summary.

FOUNDING-100 (use sparingly, when interest is real)
"Founding-member pricing closes once we hit a hundred clients. Worth knowing — no need to commit on this call."

GUARDRAILS
- Pronounce "Remodely" as "Re-MOD-uh-lee" every time.
- Don't quote prices on the phone — pricing is custom, angle is savings vs. current spend (40–70% lower).
- Locked to real data — never invent a price, address, or phone number.
- Banned phrases: "synergize", "leverage" (verb), "circle back", "value-add", "best-in-class".`;
}

async function sendLeadNotification(lead) {
  const email = process.env.NOTIFICATION_EMAIL || process.env.SMTP_USER;
  if (!email) return;

  try {
    await transporter.sendMail({
      from: `"Remodely AI" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: email,
      subject: `🔥 HOT LEAD: ${lead.contactName} - ${lead.businessType}`,
      html: `
        <h2>New Hot Lead from Pre-Qual Call</h2>
        <table style="border-collapse: collapse; width: 100%;">
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Name</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${lead.contactName}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Phone</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${lead.contactPhone}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Business</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${lead.businessName || lead.businessType}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Monthly Leads</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${lead.monthlyLeads || 'Unknown'}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Pain Points</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${lead.painPoints || 'N/A'}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Timeline</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${lead.timeline || 'Unknown'}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Next Steps</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${lead.nextSteps || 'Follow up'}</td></tr>
        </table>
        <p style="margin-top: 20px;"><strong>Notes:</strong> ${lead.notes || 'None'}</p>
      `
    });
  } catch (error) {
    console.error('[NOTIFICATION ERROR]:', error);
  }
}

async function sendDemoConfirmation(args) {
  try {
    await transporter.sendMail({
      from: `"Remodely AI" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: args.contactEmail,
      subject: `Your Remodely AI Demo - ${args.preferredDate}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Demo Confirmed!</h2>
          <p>Hi ${args.contactName},</p>
          <p>Thanks for your interest in Remodely AI! Your demo is scheduled for:</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 18px;"><strong>${args.preferredDate}</strong></p>
            <p style="margin: 8px 0 0 0; color: #666;">Demo type: ${args.demoType}</p>
          </div>
          <p>We'll show you how our AI can help ${args.businessName || 'your business'} automate customer follow-up and never miss a lead.</p>
          <p>See you soon!</p>
          <p style="color: #666;">- The Remodely AI Team</p>
        </div>
      `
    });
  } catch (error) {
    console.error('[DEMO CONFIRMATION ERROR]:', error);
  }
}

export default router;
export { callContexts };
