import express from 'express';
import nodemailer from 'nodemailer';
import * as cheerio from 'cheerio';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Strict rate limiting for grader - prevents abuse
const graderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 10, // 10 requests per hour per IP
  message: {
    error: 'Rate limit exceeded',
    message: 'You can grade up to 10 websites per hour. Please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use X-Forwarded-For for proxied requests (Render, etc.)
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
  }
});

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

// ============================================
// WEBSITE GRADER - Ported from Python
// ============================================

class WebsiteGrader {
  constructor(url) {
    this.url = this.normalizeUrl(url);
    this.domain = new URL(this.url).hostname;
    this.html = null;
    this.$ = null; // cheerio instance
    this.headers = null;
    this.loadTime = null;
    this.scores = {};
    this.issues = [];
    this.recommendations = [];
  }

  normalizeUrl(url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    return url.replace(/\/$/, '');
  }

  async fetchPage() {
    try {
      const start = Date.now();
      const response = await fetch(this.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RemodelySiteGrader/1.0)'
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(15000)
      });
      this.loadTime = (Date.now() - start) / 1000;
      this.html = await response.text();
      this.headers = response.headers;
      this.$ = cheerio.load(this.html);
      this.finalUrl = response.url;
      return true;
    } catch (error) {
      this.issues.push(`Could not fetch website: ${error.message}`);
      return false;
    }
  }

  checkHttps() {
    let score = 0;
    if (this.url.startsWith('https://')) {
      score = 100;
    } else {
      this.issues.push("Website not using HTTPS - security risk");
      this.recommendations.push("Install SSL certificate for HTTPS");
    }
    this.scores.https = score;
    return score;
  }

  checkMobileViewport() {
    let score = 0;
    const viewport = this.$('meta[name="viewport"]');
    if (viewport.length && viewport.attr('content')) {
      const content = viewport.attr('content') || '';
      if (content.includes('width=device-width')) {
        score = 100;
      } else {
        score = 50;
        this.issues.push("Viewport meta tag exists but may not be optimal");
      }
    } else {
      this.issues.push("No viewport meta tag - not mobile friendly");
      this.recommendations.push("Add mobile viewport meta tag");
    }
    this.scores.mobile = score;
    return score;
  }

  checkMetaTags() {
    let score = 0;
    const pointsPerItem = 20;

    // Title
    const title = this.$('title').text().trim();
    if (title) {
      if (title.length >= 10 && title.length <= 60) {
        score += pointsPerItem;
      } else {
        score += pointsPerItem / 2;
        this.issues.push(`Title length (${title.length} chars) should be 10-60 characters`);
      }
    } else {
      this.issues.push("Missing page title");
      this.recommendations.push("Add a descriptive page title (50-60 characters)");
    }

    // Meta description
    const metaDesc = this.$('meta[name="description"]').attr('content');
    if (metaDesc) {
      const descLen = metaDesc.length;
      if (descLen >= 120 && descLen <= 160) {
        score += pointsPerItem;
      } else {
        score += pointsPerItem / 2;
        this.issues.push(`Meta description length (${descLen} chars) should be 120-160 characters`);
      }
    } else {
      this.issues.push("Missing meta description");
      this.recommendations.push("Add meta description for search results");
    }

    // Open Graph tags
    const ogTitle = this.$('meta[property="og:title"]').length;
    const ogDesc = this.$('meta[property="og:description"]').length;
    const ogImage = this.$('meta[property="og:image"]').length;
    const ogCount = ogTitle + ogDesc + ogImage;

    if (ogCount === 3) {
      score += pointsPerItem;
    } else if (ogCount > 0) {
      score += pointsPerItem / 2;
      this.issues.push("Incomplete Open Graph tags for social sharing");
    } else {
      this.issues.push("No Open Graph tags - poor social media sharing");
      this.recommendations.push("Add Open Graph tags for better social sharing");
    }

    // Canonical URL
    const canonical = this.$('link[rel="canonical"]').length;
    if (canonical) {
      score += pointsPerItem;
    } else {
      this.issues.push("No canonical URL specified");
    }

    // Keywords
    const keywords = this.$('meta[name="keywords"]').attr('content');
    if (keywords) {
      score += pointsPerItem;
    }

    this.scores.meta_tags = Math.min(score, 100);
    return this.scores.meta_tags;
  }

  checkHeadings() {
    let score = 0;

    const h1Tags = this.$('h1');
    const h2Tags = this.$('h2');
    const h3Tags = this.$('h3');

    // Should have exactly one H1
    if (h1Tags.length === 1) {
      score += 40;
    } else if (h1Tags.length > 1) {
      score += 20;
      this.issues.push(`Multiple H1 tags found (${h1Tags.length}) - should have only one`);
    } else {
      this.issues.push("No H1 tag found");
      this.recommendations.push("Add a single H1 tag with your main keyword");
    }

    // Should have H2s for structure
    if (h2Tags.length >= 2) {
      score += 30;
    } else if (h2Tags.length === 1) {
      score += 15;
    } else {
      this.issues.push("No H2 tags for content structure");
    }

    // H3s for sub-sections
    if (h3Tags.length >= 1) {
      score += 30;
    }

    this.scores.headings = score;
    return score;
  }

  checkImages() {
    const images = this.$('img');
    if (images.length === 0) {
      this.scores.images = 50;
      return 50;
    }

    let imagesWithAlt = 0;
    let imagesWithLazy = 0;

    images.each((_, img) => {
      const $img = this.$(img);
      if ($img.attr('alt')) imagesWithAlt++;
      if ($img.attr('loading') === 'lazy') imagesWithLazy++;
    });

    const altRatio = imagesWithAlt / images.length;
    const lazyRatio = imagesWithLazy / images.length;

    let score = Math.round((altRatio * 70) + (lazyRatio * 30));

    if (altRatio < 1) {
      const missing = images.length - imagesWithAlt;
      this.issues.push(`${missing} images missing alt text`);
      this.recommendations.push("Add descriptive alt text to all images");
    }

    if (lazyRatio < 0.5 && images.length > 3) {
      this.recommendations.push("Add lazy loading to images for better performance");
    }

    this.scores.images = score;
    return score;
  }

  checkPageSpeed() {
    let score = 100;

    if (this.loadTime) {
      if (this.loadTime < 1) {
        score = 100;
      } else if (this.loadTime < 2) {
        score = 80;
      } else if (this.loadTime < 3) {
        score = 60;
      } else if (this.loadTime < 5) {
        score = 40;
        this.issues.push(`Slow page load time: ${this.loadTime.toFixed(2)}s`);
      } else {
        score = 20;
        this.issues.push(`Very slow page load: ${this.loadTime.toFixed(2)}s`);
        this.recommendations.push("Optimize page speed - compress images, minify CSS/JS");
      }
    }

    this.scores.speed = score;
    return score;
  }

  checkStructuredData() {
    let score = 0;
    const schemaTypes = [];

    // Look for JSON-LD
    this.$('script[type="application/ld+json"]').each((_, script) => {
      try {
        const data = JSON.parse(this.$(script).html());
        if (Array.isArray(data)) {
          data.forEach(item => {
            if (item['@type']) schemaTypes.push(item['@type']);
          });
        } else if (data['@type']) {
          schemaTypes.push(data['@type']);
        }
      } catch (e) {
        // Invalid JSON, skip
      }
    });

    // Check for important schema types
    const importantSchemas = ['LocalBusiness', 'Organization', 'Service', 'Product',
                              'FAQPage', 'HowTo', 'Review', 'AggregateRating'];

    const foundImportant = schemaTypes.filter(s => importantSchemas.includes(s));

    if (foundImportant.length >= 3) {
      score = 100;
    } else if (foundImportant.length >= 2) {
      score = 75;
    } else if (foundImportant.length >= 1) {
      score = 50;
    } else if (schemaTypes.length > 0) {
      score = 25;
    } else {
      this.issues.push("No structured data (Schema.org) found");
      this.recommendations.push("Add LocalBusiness and Service schema for AI discoverability");
    }

    if (!schemaTypes.includes('FAQPage')) {
      this.recommendations.push("Add FAQ schema - AI assistants love citing FAQ content");
    }

    this.scores.structured_data = score;
    this.scores.schema_types = schemaTypes;
    return score;
  }

  checkSocialPresence() {
    let score = 0;
    const socialPlatforms = {
      'facebook.com': 'Facebook',
      'twitter.com': 'Twitter/X',
      'x.com': 'Twitter/X',
      'instagram.com': 'Instagram',
      'linkedin.com': 'LinkedIn',
      'youtube.com': 'YouTube',
      'tiktok.com': 'TikTok',
      'nextdoor.com': 'Nextdoor',
      'yelp.com': 'Yelp'
    };

    const foundPlatforms = [];

    this.$('a[href]').each((_, link) => {
      const href = (this.$(link).attr('href') || '').toLowerCase();
      for (const [platform, name] of Object.entries(socialPlatforms)) {
        if (href.includes(platform) && !foundPlatforms.includes(name)) {
          foundPlatforms.push(name);
        }
      }
    });

    if (foundPlatforms.length >= 5) {
      score = 100;
    } else if (foundPlatforms.length >= 3) {
      score = 75;
    } else if (foundPlatforms.length >= 1) {
      score = 50;
    } else {
      this.issues.push("No social media links found");
      this.recommendations.push("Add links to social profiles - increases AI visibility");
    }

    if (!foundPlatforms.includes('YouTube')) {
      this.recommendations.push("Create YouTube presence - AI heavily indexes video content");
    }
    if (!foundPlatforms.includes('Yelp')) {
      this.recommendations.push("Claim Yelp listing - important for local AI search");
    }

    this.scores.social = score;
    this.scores.social_platforms = foundPlatforms;
    return score;
  }

  checkContactInfo() {
    let score = 0;
    const pageText = this.$('body').text().toLowerCase();

    // Phone number pattern
    const phonePattern = /[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4}/;
    const hasPhone = phonePattern.test(this.html);

    // Email pattern
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const hasEmail = emailPattern.test(this.html);

    // Address indicators
    const addressWords = ['street', 'avenue', 'ave', 'road', 'rd', 'boulevard',
                          'blvd', 'suite', 'floor', 'az', 'arizona', 'phoenix'];
    const hasAddress = addressWords.some(word => pageText.includes(word));

    if (hasPhone) {
      score += 35;
    } else {
      this.issues.push("No phone number visible on page");
      this.recommendations.push("Display phone number prominently");
    }

    if (hasEmail) {
      score += 30;
    } else {
      this.issues.push("No email address visible");
    }

    if (hasAddress) {
      score += 35;
    } else {
      this.issues.push("No physical address found");
      this.recommendations.push("Add full business address for local AI visibility");
    }

    this.scores.contact = score;
    return score;
  }

  checkContentQuality() {
    let score = 0;

    // Remove script, style, nav, footer, header for content analysis
    const $clone = cheerio.load(this.html);
    $clone('script, style, nav, footer, header').remove();
    const text = $clone('body').text().replace(/\s+/g, ' ').trim();
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

    // Word count scoring
    if (wordCount >= 1000) {
      score += 40;
    } else if (wordCount >= 500) {
      score += 30;
    } else if (wordCount >= 300) {
      score += 20;
    } else {
      this.issues.push(`Low content: only ${wordCount} words`);
      this.recommendations.push("Add more content - aim for 500+ words on main pages");
    }

    // Check for FAQ-style content
    const faqIndicators = ['faq', 'frequently asked', 'questions', 'q:', 'a:', 'q&a'];
    const textLower = text.toLowerCase();
    const hasFaq = faqIndicators.some(ind => textLower.includes(ind));

    if (hasFaq) {
      score += 30;
    } else {
      this.recommendations.push("Add FAQ section - AI assistants frequently cite Q&A content");
    }

    // Check for service/product descriptions
    const serviceWords = ['service', 'we offer', 'we provide', 'our services',
                          'what we do', 'how we help'];
    const hasServices = serviceWords.some(word => textLower.includes(word));

    if (hasServices) {
      score += 30;
    }

    this.scores.content = Math.min(score, 100);
    this.scores.word_count = wordCount;
    return this.scores.content;
  }

  checkAiVisibility() {
    let aiScore = 0;
    const aiFactors = [];

    // Structured data is HUGE for AI
    if ((this.scores.structured_data || 0) >= 75) {
      aiScore += 25;
      aiFactors.push("Strong structured data");
    } else if ((this.scores.structured_data || 0) >= 50) {
      aiScore += 15;
    }

    // FAQ content gets cited by AI
    if ((this.scores.schema_types || []).includes('FAQPage')) {
      aiScore += 15;
      aiFactors.push("FAQ schema present");
    }

    // Social presence = more training data
    const socialCount = (this.scores.social_platforms || []).length;
    if (socialCount >= 4) {
      aiScore += 20;
      aiFactors.push("Strong social presence");
    } else if (socialCount >= 2) {
      aiScore += 10;
    }

    // YouTube specifically
    if ((this.scores.social_platforms || []).includes('YouTube')) {
      aiScore += 10;
      aiFactors.push("YouTube presence");
    }

    // Contact info = legitimate business
    if ((this.scores.contact || 0) >= 80) {
      aiScore += 15;
      aiFactors.push("Complete contact info");
    } else if ((this.scores.contact || 0) >= 50) {
      aiScore += 8;
    }

    // Content quality
    if ((this.scores.word_count || 0) >= 500) {
      aiScore += 10;
    }

    // HTTPS
    if ((this.scores.https || 0) === 100) {
      aiScore += 5;
    }

    this.scores.ai_visibility = Math.min(aiScore, 100);
    this.scores.ai_factors = aiFactors;

    if (aiScore < 50) {
      this.recommendations.unshift("PRIORITY: Improve AI visibility to be found by ChatGPT, Grok, etc.");
    }

    return aiScore;
  }

  calculateOverallScore() {
    const weights = {
      ai_visibility: 0.25,
      structured_data: 0.15,
      meta_tags: 0.12,
      mobile: 0.10,
      speed: 0.08,
      headings: 0.08,
      content: 0.08,
      social: 0.06,
      contact: 0.04,
      https: 0.02,
      images: 0.02
    };

    let total = 0;
    for (const [key, weight] of Object.entries(weights)) {
      const score = this.scores[key];
      if (typeof score === 'number') {
        total += score * weight;
      }
    }

    this.scores.overall = Math.round(total);
    return this.scores.overall;
  }

  getGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  async runFullAnalysis() {
    if (!(await this.fetchPage())) {
      return {
        success: false,
        error: 'Could not fetch website',
        url: this.url
      };
    }

    // Run all checks
    this.checkHttps();
    this.checkMobileViewport();
    this.checkMetaTags();
    this.checkHeadings();
    this.checkImages();
    this.checkPageSpeed();
    this.checkStructuredData();
    this.checkSocialPresence();
    this.checkContactInfo();
    this.checkContentQuality();
    this.checkAiVisibility();
    this.calculateOverallScore();

    return {
      success: true,
      url: this.url,
      domain: this.domain,
      scores: {
        overall: this.scores.overall || 0,
        overall_grade: this.getGrade(this.scores.overall || 0),
        ai_visibility: this.scores.ai_visibility || 0,
        ai_visibility_grade: this.getGrade(this.scores.ai_visibility || 0),
        seo: {
          meta_tags: this.scores.meta_tags || 0,
          headings: this.scores.headings || 0,
          structured_data: this.scores.structured_data || 0,
        },
        technical: {
          https: this.scores.https || 0,
          mobile: this.scores.mobile || 0,
          speed: this.scores.speed || 0,
          images: this.scores.images || 0,
        },
        presence: {
          social: this.scores.social || 0,
          contact: this.scores.contact || 0,
          content: this.scores.content || 0,
        }
      },
      details: {
        load_time: this.loadTime ? Math.round(this.loadTime * 100) / 100 : null,
        word_count: this.scores.word_count || 0,
        social_platforms: this.scores.social_platforms || [],
        schema_types: this.scores.schema_types || [],
        ai_factors: this.scores.ai_factors || [],
      },
      issues: this.issues.slice(0, 10),
      recommendations: this.recommendations.slice(0, 8),
    };
  }
}

// Main grading function
async function gradeWebsite(url) {
  const grader = new WebsiteGrader(url);
  return grader.runFullAnalysis();
}

// ============================================
// API ROUTES
// ============================================

// Grade a website - now runs locally instead of proxying
// Rate limited: 10 requests per hour per IP
router.post('/', graderLimiter, async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    console.log(`[GRADER] Analyzing: ${url}`);
    const result = await gradeWebsite(url);
    console.log(`[GRADER] Complete: ${url} - Score: ${result.scores?.overall || 'N/A'}`);

    return res.json(result);
  } catch (error) {
    console.error('Grader error:', error);
    return res.status(500).json({ success: false, error: 'Grading failed: ' + error.message });
  }
});

// Alias for /analyze endpoint (same as /)
router.post('/analyze', graderLimiter, async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    console.log(`[GRADER] Analyzing: ${url}`);
    const result = await gradeWebsite(url);
    console.log(`[GRADER] Complete: ${url} - Score: ${result.scores?.overall || 'N/A'}`);

    return res.json(result);
  } catch (error) {
    console.error('Grader error:', error);
    return res.status(500).json({ success: false, error: 'Grading failed: ' + error.message });
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
