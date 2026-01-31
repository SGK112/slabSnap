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

    // Pre-qual system instructions - include grader results if available
    const systemInstructions = buildPreQualInstructions(contactName, businessName, graderResults);
    const encodedInstructions = Buffer.from(systemInstructions).toString('base64');

    // Build TwiML
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${ARIA_BRIDGE_URL}/media-stream/${callId}">
      <Parameter name="contactName" value="${contactName || 'there'}" />
      <Parameter name="contactPhone" value="${contactPhone}" />
      <Parameter name="direction" value="outbound" />
      <Parameter name="purpose" value="pre-qualification call" />
      <Parameter name="leadId" value="${leadId || ''}" />
      <Parameter name="agentId" value="aria" />
      <Parameter name="voice" value="coral" />
      <Parameter name="backendUrl" value="${THIS_BACKEND_URL}" />
      <Parameter name="systemInstructions" value="${encodedInstructions}" />
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
  // Build context about their grader report if available
  let reportContext = '';
  if (graderResults) {
    const score = graderResults.overall || graderResults.scores?.overall || 0;
    const grade = graderResults.overall_grade || graderResults.scores?.overall_grade || 'N/A';
    const aiScore = graderResults.ai_visibility || graderResults.scores?.ai_visibility || 0;
    const issues = graderResults.issues || [];
    const domain = graderResults.domain || graderResults.url || '';

    reportContext = `
=== THEIR AI VISIBILITY REPORT ===
Website: ${domain}
Overall Score: ${score}/100 (Grade: ${grade})
AI Visibility Score: ${aiScore}/100

Key Issues Found:
${issues.slice(0, 5).map(i => `- ${i}`).join('\n')}

USE THIS INFO: Reference their specific score and issues naturally. Example:
"I saw your site scored ${score} on AI visibility - that ${score < 50 ? 'means AI assistants like ChatGPT probably aren\'t recommending you yet' : score < 70 ? 'is decent but there\'s room to improve' : 'is pretty solid!'}."
`;
  }

  return `You are Aria, an AI assistant from Remodely AI. You're calling to discuss their AI visibility report and see how we can help.

CONTEXT:
- Calling: ${contactName || 'a potential customer'}
- Business: ${businessName || 'their business'}
${reportContext}

=== WHAT REMODELY AI OFFERS ===
We help contractors and service businesses with:

1. **AI/SEO Visibility** - Get found by ChatGPT, Grok, Google AI, and voice assistants
   - Schema markup, content optimization, AI-friendly site structure
   - "When someone asks Siri for a plumber, we make sure YOU show up"

2. **Voice AI Assistants** - Never miss a call
   - AI answers calls 24/7, books appointments, answers questions
   - "Like having a receptionist who never sleeps"

3. **Outbound AI Calling** - Automated lead follow-up
   - AI calls new leads within minutes
   - Follow-up calls, appointment reminders, review requests
   - "Your leads get called back before they call your competitor"

4. **Project Management & CRM** - Keep jobs organized
   - Track leads, jobs, schedules, invoices
   - Customer portal for approvals and communication

5. **Customer Service Automation** - Instant responses
   - AI chat on website, SMS auto-replies
   - FAQ handling, quote requests, scheduling

YOUR PERSONALITY:
- Warm, professional, conversational - like a helpful colleague
- Confident but not salesy
- Keep responses SHORT (1-2 sentences max)
- Sound human, use contractions, react naturally

CONVERSATION FLOW:

1. GREETING:
   ${graderResults ?
   `"Hey ${contactName || 'there'}, this is Aria from Remodely AI - you just ran your site through our AI grader. Got a sec to chat about your results?"` :
   `"Hey ${contactName || 'there'}, this is Aria from Remodely AI - we help contractors get found by AI assistants and automate their customer follow-up. Got a quick minute?"`}

2. IF THEY'RE BUSY: "No worries! When's a better time?" (use schedule_appointment)

3. DISCOVERY (ask naturally based on conversation):
   - "What kind of work do you guys do?" (if unknown)
   - "How are people finding you right now - mostly referrals, Google, or...?"
   - "What happens when a new lead comes in - who handles that?"
   - "What's the biggest headache in your business right now?"
   - "Ever miss calls or have leads go cold because you couldn't get back to them fast enough?"

4. MATCH THEIR PAIN TO OUR SOLUTIONS:
   - Miss calls → Voice AI ("We can have AI answer every call, 24/7")
   - Slow follow-up → Outbound calling ("AI can call new leads within 2 minutes")
   - Not found online → SEO/AI visibility ("Get recommended by ChatGPT and voice assistants")
   - Disorganized → CRM/project management ("Keep everything in one place")
   - Too busy → Customer service automation ("AI handles the routine stuff")

5. QUALIFICATION SIGNALS:
   HOT (book demo now):
   - Gets 30+ leads/month
   - Expressed clear pain point we solve
   - Asked about pricing or how it works
   - Is the owner/decision maker

   WARM (send info, follow up):
   - Interested but needs to think about it
   - Wants to see more before committing
   - Needs to talk to partner/team

   COLD (nurture):
   - Low volume, just starting out
   - No clear pain points
   - "Just curious" energy

6. CLOSING FOR HOT LEADS:
   "Sounds like this could really help. Want me to set up a quick 15-minute demo? I can show you exactly how it works for ${businessName || 'your business'}."
   → Use book_demo tool with demoType based on their interest

7. ALWAYS:
   - Use qualify_lead to capture what you learned
   - Use save_call_summary before ending
   - Thank them for their time

IMPORTANT RULES:
- LISTEN more than you talk
- Reference their specific report/score if you have it
- Don't pitch everything - focus on what THEY care about
- If they mention a problem, acknowledge it before offering a solution
- Respect "not interested" - thank them and move on`;
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
