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

    // Title — first <title> in <head> only. Skip <svg><title> elements which
    // describe icons, not the page (they'd otherwise concatenate to a 300+ char string).
    const title = (this.$('head > title').first().text() || this.$('title').first().text() || '').trim();
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
    const schemaWarnings = [];
    const parsedNodes = [];
    let parseErrors = 0;

    // Google's list of types that legitimately accept aggregateRating
    // (mismatching this is the #1 structured-data error in Search Console)
    const RATING_ALLOWED_TYPES = new Set([
      'Book', 'Course', 'CreativeWorkSeason', 'CreativeWorkSeries', 'Episode',
      'Event', 'Game', 'HowTo', 'LocalBusiness', 'MediaObject', 'Movie',
      'MusicPlaylist', 'MusicRecording', 'Organization', 'Product', 'Recipe',
      'SoftwareApplication',
      // LocalBusiness subtypes Google treats as LocalBusiness
      'GeneralContractor', 'HomeAndConstructionBusiness', 'Restaurant',
      'Store', 'ProfessionalService', 'AutomotiveBusiness', 'Plumber',
      'RoofingContractor', 'Electrician', 'HousePainter', 'HVACBusiness',
      'MovingCompany', 'Locksmith',
    ]);

    // Walk a node and report any aggregateRating attached to a type Google rejects
    const checkNode = (node) => {
      if (!node || typeof node !== 'object') return;
      const t = node['@type'];
      if (t) {
        const types = Array.isArray(t) ? t : [t];
        types.forEach(typ => schemaTypes.push(typ));
        if (node.aggregateRating) {
          const ok = types.some(typ => RATING_ALLOWED_TYPES.has(typ));
          if (!ok) {
            schemaWarnings.push(
              `aggregateRating attached to "${types.join('/')}" — Google rejects ratings on this type. Move it to a LocalBusiness, Organization, or Product node.`
            );
          }
        }
      }
      // Recurse into known nested holders
      ['provider', 'publisher', 'author', 'mainEntity', 'itemReviewed'].forEach(k => {
        if (node[k]) checkNode(node[k]);
      });
      if (Array.isArray(node['@graph'])) node['@graph'].forEach(checkNode);
    };

    // Look for JSON-LD
    this.$('script[type="application/ld+json"]').each((_, script) => {
      const raw = this.$(script).html();
      try {
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          data.forEach(item => { parsedNodes.push(item); checkNode(item); });
        } else {
          parsedNodes.push(data);
          checkNode(data);
        }
      } catch (e) {
        parseErrors++;
      }
    });

    if (parseErrors > 0) {
      this.issues.push(`${parseErrors} JSON-LD block(s) failed to parse — Google ignores invalid structured data`);
      this.recommendations.push("Validate all JSON-LD with Google's Rich Results Test before publishing");
    }

    // Surface the rating-mismatch warning publicly so customers see exactly the issue
    schemaWarnings.forEach(w => {
      this.issues.push(`Structured data: ${w}`);
      this.recommendations.push("Move aggregateRating onto the LocalBusiness/Organization/Product node, not Service or generic types");
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
    } else if (parsedNodes.length > 0) {
      score = 25;
    } else {
      this.issues.push("No structured data (Schema.org) found");
      this.recommendations.push("Add LocalBusiness and Service schema for AI discoverability");
    }

    // Penalize if we found schema but it has Google-rejecting issues
    if (score > 0 && schemaWarnings.length > 0) {
      score = Math.max(25, score - 25);
    }

    if (!schemaTypes.includes('FAQPage')) {
      this.recommendations.push("Add FAQ schema - AI assistants love citing FAQ content");
    }

    this.scores.structured_data = score;
    this.scores.schema_types = schemaTypes;
    this.scores.schema_warnings = schemaWarnings;
    return score;
  }

  // Google PageSpeed Insights — real Core Web Vitals (LCP, INP, CLS, FCP, TTFB)
  // and a Lighthouse performance score. Free; an API key bumps quota from the
  // shared 25k/day pool to a per-key 25k/day. Falls back to GOOGLE_AI_API_KEY
  // (same Google Cloud project) when the dedicated PSI key isn't set.
  // Replaces the load-time guess in this.scores.speed when PSI succeeds.
  async checkCoreWebVitals() {
    const apiKey = process.env.GOOGLE_PSI_API_KEY || process.env.GOOGLE_AI_API_KEY || '';
    const endpoint = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
    const params = new URLSearchParams({
      url: this.url,
      strategy: 'mobile',
      category: 'performance',
    });
    if (apiKey) params.set('key', apiKey);

    try {
      const res = await fetch(`${endpoint}?${params.toString()}`, {
        signal: AbortSignal.timeout(45000),
      });
      if (!res.ok) {
        this.scores.core_web_vitals = { available: false, reason: `PSI HTTP ${res.status}` };
        return null;
      }
      const data = await res.json();
      const lh = data.lighthouseResult || {};
      const audits = lh.audits || {};
      const perfScore = Math.round((lh.categories?.performance?.score ?? 0) * 100);

      const num = (auditId) => {
        const v = audits[auditId]?.numericValue;
        return typeof v === 'number' ? v : null;
      };

      const cwv = {
        available: true,
        performance_score: perfScore,
        // Numeric values in milliseconds (CLS is unitless)
        lcp_ms: num('largest-contentful-paint'),
        inp_ms: num('interaction-to-next-paint') ?? num('experimental-interaction-to-next-paint'),
        cls: num('cumulative-layout-shift'),
        fcp_ms: num('first-contentful-paint'),
        ttfb_ms: num('server-response-time'),
        tbt_ms: num('total-blocking-time'),
        strategy: 'mobile',
        source: 'Google PageSpeed Insights',
      };

      // Promote PSI's perf score into the speed slot — it's the real number
      this.scores.speed = perfScore;

      // Add issue/recommendation lines for any failing CWV thresholds (Google's "good" cutoffs)
      if (cwv.lcp_ms != null && cwv.lcp_ms > 2500) {
        this.issues.push(`Slow LCP: ${(cwv.lcp_ms / 1000).toFixed(1)}s (target < 2.5s)`);
        this.recommendations.push("Improve Largest Contentful Paint — optimize hero image, preload critical assets");
      }
      if (cwv.cls != null && cwv.cls > 0.1) {
        this.issues.push(`Layout shift (CLS) ${cwv.cls.toFixed(2)} (target < 0.1)`);
        this.recommendations.push("Set explicit width/height on images and reserve space for ads/embeds");
      }
      if (cwv.inp_ms != null && cwv.inp_ms > 200) {
        this.issues.push(`Slow interactivity (INP): ${Math.round(cwv.inp_ms)}ms (target < 200ms)`);
      }
      if (perfScore < 50) {
        this.issues.push(`Poor Lighthouse performance score: ${perfScore}/100`);
      }

      this.scores.core_web_vitals = cwv;
      return cwv;
    } catch (err) {
      this.scores.core_web_vitals = { available: false, reason: err.message || 'PSI fetch failed' };
      return null;
    }
  }

  // Pre-filled deep links to Google's official tools so customers can verify externally
  buildGoogleTools() {
    const u = encodeURIComponent(this.url);
    return {
      rich_results: `https://search.google.com/test/rich-results?url=${u}`,
      pagespeed: `https://pagespeed.web.dev/report?url=${u}`,
      mobile_friendly: `https://search.google.com/test/mobile-friendly?url=${u}`,
      safe_browsing: `https://transparencyreport.google.com/safe-browsing/search?url=${u}`,
    };
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

    // Run all checks. Kick off PSI in parallel — it's the slow one (~10-30s).
    const psiPromise = this.checkCoreWebVitals();
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
    await psiPromise; // PSI may overwrite scores.speed with a real Lighthouse number
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
        schema_warnings: this.scores.schema_warnings || [],
        ai_factors: this.scores.ai_factors || [],
        core_web_vitals: this.scores.core_web_vitals || { available: false },
      },
      google_tools: this.buildGoogleTools(),
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

// =============================================================
// COMPETITOR COMPARE — runs the grader on two URLs and returns a
// side-by-side diff. Tool #1 in the suite. Rate limit shared with
// the master grader so two runs count against the same hourly cap.
// =============================================================
router.post('/compare', graderLimiter, async (req, res) => {
  try {
    const { url1, url2 } = req.body || {};

    if (!url1 || !url2) {
      return res.status(400).json({
        success: false,
        error: 'Both url1 and url2 are required'
      });
    }

    console.log(`[COMPARE] ${url1}  vs  ${url2}`);

    // Run both in parallel so the user only waits for the slower of the two.
    const [a, b] = await Promise.all([
      gradeWebsite(url1).catch((err) => ({ success: false, url: url1, error: err.message })),
      gradeWebsite(url2).catch((err) => ({ success: false, url: url2, error: err.message })),
    ]);

    if (!a.success || !b.success) {
      return res.json({
        success: false,
        error: 'One or both sites failed to analyze',
        a, b,
      });
    }

    // Build diff — for each scoreable axis, who wins and by how much
    const axes = [
      ['overall',          a.scores.overall,                 b.scores.overall,                 'Overall'],
      ['ai_visibility',    a.scores.ai_visibility,           b.scores.ai_visibility,           'AI Visibility'],
      ['meta_tags',        a.scores.seo.meta_tags,           b.scores.seo.meta_tags,           'Meta tags'],
      ['headings',         a.scores.seo.headings,            b.scores.seo.headings,            'Headings'],
      ['structured_data',  a.scores.seo.structured_data,     b.scores.seo.structured_data,     'Schema (JSON-LD)'],
      ['mobile',           a.scores.technical.mobile,        b.scores.technical.mobile,        'Mobile-ready'],
      ['speed',            a.scores.technical.speed,         b.scores.technical.speed,         'Page speed'],
      ['https',            a.scores.technical.https,         b.scores.technical.https,         'HTTPS'],
      ['images',           a.scores.technical.images,        b.scores.technical.images,        'Image optimization'],
      ['social',           a.scores.presence.social,         b.scores.presence.social,         'Social presence'],
      ['contact',          a.scores.presence.contact,        b.scores.presence.contact,        'Contact info'],
      ['content',          a.scores.presence.content,        b.scores.presence.content,        'Content depth'],
    ];

    const diff = axes.map(([key, av, bv, label]) => {
      const delta = (av || 0) - (bv || 0);
      let winner = 'tie';
      if (delta >= 5)       winner = 'a';
      else if (delta <= -5) winner = 'b';
      return {
        key, label,
        a: av || 0,
        b: bv || 0,
        delta,
        winner,
      };
    });

    const aWins = diff.filter((d) => d.winner === 'a').length;
    const bWins = diff.filter((d) => d.winner === 'b').length;
    const ties  = diff.filter((d) => d.winner === 'tie').length;

    let verdict = 'tie';
    if (aWins > bWins + 1)      verdict = 'a';
    else if (bWins > aWins + 1) verdict = 'b';

    return res.json({
      success: true,
      a: { url: a.url, domain: a.domain, scores: a.scores, details: a.details, issues: a.issues, recommendations: a.recommendations },
      b: { url: b.url, domain: b.domain, scores: b.scores, details: b.details, issues: b.issues, recommendations: b.recommendations },
      diff,
      summary: { aWins, bWins, ties, verdict, totalAxes: diff.length },
    });
  } catch (error) {
    console.error('Compare error:', error);
    return res.status(500).json({ success: false, error: 'Compare failed: ' + error.message });
  }
});

// =============================================================
// AI ASSISTANT PROBE — does Claude / GPT-4o know this business?
// Tool #2. Queries 2 LLMs with "Tell me about [business]" and
// scores each on whether they mention the business by name, cite
// the right URL, mention the location, and mention services.
// Tighter rate limit (5/hour/IP) since each probe costs real money.
// =============================================================
const aiProbeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    error: 'Rate limit exceeded',
    message: 'You can probe the AI assistants up to 5 times per hour. Try again later.',
    retryAfter: '1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
});

// Inspect the URL once to derive a business name + location if the
// caller didn't pass them in. Re-uses the existing WebsiteGrader.
async function deriveBusinessContext(url) {
  try {
    const grader = new WebsiteGrader(url);
    if (!(await grader.fetchPage())) return { businessName: null, location: null, domain: null };

    const $ = grader.$;

    // Name: og:site_name > <title> first segment > domain
    const ogSite = $('meta[property="og:site_name"]').attr('content');
    const titleRaw = ($('title').text() || '').trim();
    const titleFirst = titleRaw.split(/[\|\-—–·]/)[0].trim();
    const businessName = (ogSite || titleFirst || grader.domain || '').slice(0, 80);

    // Location: hunt for city/state in JSON-LD or meta address
    let location = null;
    $('script[type="application/ld+json"]').each((_, s) => {
      try {
        const data = JSON.parse($(s).html());
        const items = Array.isArray(data) ? data : [data];
        items.forEach((item) => {
          if (location) return;
          const addr = item.address || (item['@graph'] && item['@graph'].find?.((g) => g.address)?.address);
          if (addr) {
            location = [addr.addressLocality, addr.addressRegion]
              .filter(Boolean)
              .join(', ') || null;
          }
        });
      } catch (_) { /* skip bad JSON */ }
    });

    return { businessName, location, domain: grader.domain };
  } catch (err) {
    return { businessName: null, location: null, domain: null, error: err.message };
  }
}

// Query Claude Haiku
async function probeClaude(prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { model: 'claude-haiku-4-5', error: 'not configured' };
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(20000),
    });
    const data = await r.json();
    if (!r.ok) return { model: 'claude-haiku-4-5', error: data.error?.message || `${r.status}` };
    return {
      model: 'claude-haiku-4-5',
      provider: 'Anthropic Claude',
      response: data.content?.[0]?.text || '',
    };
  } catch (err) {
    return { model: 'claude-haiku-4-5', error: err.message };
  }
}

// Query GPT-4o-mini
async function probeOpenAI(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { model: 'gpt-4o-mini', error: 'not configured' };
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(20000),
    });
    const data = await r.json();
    if (!r.ok) return { model: 'gpt-4o-mini', error: data.error?.message || `${r.status}` };
    return {
      model: 'gpt-4o-mini',
      provider: 'OpenAI GPT-4o',
      response: data.choices?.[0]?.message?.content || '',
    };
  } catch (err) {
    return { model: 'gpt-4o-mini', error: err.message };
  }
}

// Score a model's response against the known facts about the business
function scoreProbe({ response, businessName, domain, location }) {
  if (!response) {
    return {
      score: 0,
      mentions_name: false,
      cites_url: false,
      mentions_location: false,
      mentions_services: false,
    };
  }
  const text = response.toLowerCase();
  const name = (businessName || '').toLowerCase();
  const dom = (domain || '').toLowerCase().replace(/^www\./, '');
  const loc = (location || '').toLowerCase();

  const mentions_name = name && text.includes(name);
  const cites_url = dom && (text.includes(dom) || text.includes(`www.${dom}`));
  const mentions_location = loc && text.includes(loc.split(',')[0].trim());
  const mentions_services = /(service|offer|provide|specialize|install|repair|remodel|design|fabricate)/i.test(text);

  let score = 0;
  if (mentions_name)     score += 40;
  if (cites_url)         score += 30;
  if (mentions_location) score += 20;
  if (mentions_services) score += 10;

  // Penalty for clearly hallucinated content if no name match
  if (!mentions_name && response.length > 200) score = Math.max(0, score - 10);

  return { score, mentions_name, cites_url, mentions_location, mentions_services };
}

router.post('/ai-probe', aiProbeLimiter, async (req, res) => {
  try {
    const { url, businessName: providedName, location: providedLoc } = req.body || {};
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    console.log(`[AI-PROBE] ${url}`);

    // Step 1: derive business context if caller didn't provide it
    const ctx = await deriveBusinessContext(url);
    const businessName = providedName || ctx.businessName;
    const location = providedLoc || ctx.location;
    const domain = ctx.domain;

    if (!businessName) {
      return res.status(400).json({
        success: false,
        error: 'Could not determine business name from URL. Pass businessName explicitly.',
      });
    }

    // Step 2: build the probe prompt
    const prompt = location
      ? `Tell me about ${businessName} in ${location}. What services do they offer? Include their website if you know it. Answer naturally as if responding to a real customer asking about a local business.`
      : `Tell me about ${businessName}. What services do they offer? Include their website if you know it. Answer naturally as if responding to a real customer asking about a business.`;

    // Step 3: query both LLMs in parallel
    const [claude, openai] = await Promise.all([
      probeClaude(prompt),
      probeOpenAI(prompt),
    ]);

    // Step 4: score each
    const scoreInputs = { businessName, domain, location };
    const claudeScore = scoreProbe({ response: claude.response, ...scoreInputs });
    const openaiScore = scoreProbe({ response: openai.response, ...scoreInputs });

    const results = [
      { ...claude, ...claudeScore },
      { ...openai, ...openaiScore },
    ];

    // Aggregate
    const validResults = results.filter((r) => !r.error);
    const overall_score = validResults.length
      ? Math.round(validResults.reduce((sum, r) => sum + r.score, 0) / validResults.length)
      : 0;
    const found_by = validResults.filter((r) => r.mentions_name).length;
    const cited_correctly_by = validResults.filter((r) => r.cites_url).length;

    let verdict;
    if (overall_score >= 75)      verdict = 'Strong AI presence — assistants know who you are.';
    else if (overall_score >= 50) verdict = 'Mixed AI presence — some assistants know you, others don\'t.';
    else if (overall_score >= 25) verdict = 'Weak AI presence — most assistants don\'t cite you reliably.';
    else                          verdict = 'Invisible to AI — no assistant returned reliable info about you.';

    return res.json({
      success: true,
      url,
      business: { name: businessName, domain, location },
      prompt,
      results,
      summary: {
        overall_score,
        found_by,
        cited_correctly_by,
        total_probed: results.length,
        verdict,
      },
    });
  } catch (error) {
    console.error('AI probe error:', error);
    return res.status(500).json({ success: false, error: 'AI probe failed: ' + error.message });
  }
});

// =============================================================
// CODE SNIPPET FIXER — Tool #3
// Runs the grader, then for each issue generates a paste-ready
// snippet with the visitor's actual business data filled in.
// Web-guy credibility tool: turns advice into code.
// =============================================================

// Extract structured business data from a fetched page so the
// snippets we generate have real names / phones / addresses, not
// {{placeholders}}.
function extractBusinessData(grader) {
  const $ = grader.$;
  const data = {
    domain: grader.domain,
    url: grader.url,
    title: ($('title').text() || '').trim(),
    description: $('meta[name="description"]').attr('content') || '',
    name: $('meta[property="og:site_name"]').attr('content') ||
          ($('title').text() || '').split(/[\|\-—–·]/)[0].trim() ||
          grader.domain,
    image: $('meta[property="og:image"]').attr('content') || '',
    phone: '',
    email: '',
    address: { street: '', city: '', region: '', postal: '', country: 'US' },
    hours: [],
    schemaTypes: [],
  };

  // Phone: prefer the first US-format phone in the page text
  const phoneMatch = (grader.html || '').match(
    /(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/
  );
  if (phoneMatch) data.phone = phoneMatch[0];

  // Email: first non-noreply email
  const emails = (grader.html || '').match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  ) || [];
  data.email = emails.find((e) => !/noreply|donotreply|no-reply/i.test(e)) || emails[0] || '';

  // From JSON-LD if present, override with cleaner data
  $('script[type="application/ld+json"]').each((_, s) => {
    try {
      const parsed = JSON.parse($(s).html());
      const items = Array.isArray(parsed) ? parsed : [parsed];
      items.forEach((item) => {
        if (!item) return;
        if (item['@type']) data.schemaTypes.push(item['@type']);
        if (item.name && !data.name) data.name = item.name;
        if (item.telephone && !data.phone) data.phone = item.telephone;
        if (item.email && !data.email) data.email = item.email;
        if (item.address) {
          const a = item.address;
          data.address.street = a.streetAddress || data.address.street;
          data.address.city = a.addressLocality || data.address.city;
          data.address.region = a.addressRegion || data.address.region;
          data.address.postal = a.postalCode || data.address.postal;
          data.address.country = a.addressCountry || data.address.country;
        }
        if (item.openingHours) {
          data.hours = Array.isArray(item.openingHours) ? item.openingHours : [item.openingHours];
        }
      });
    } catch (_) {}
  });

  return data;
}

// Snippet generators — each one produces { id, title, where, why,
// language, code } given the business data + grader scores.
function generateSnippets(grader, biz) {
  const snippets = [];
  const s = grader.scores;

  // --- META DESCRIPTION ---------------------------------------
  if (!biz.description || biz.description.length < 120 || biz.description.length > 160) {
    const tagline = `${biz.name} — call ${biz.phone || 'us'} for a free estimate.`;
    const target = biz.description && biz.description.length >= 120 && biz.description.length <= 160
      ? biz.description
      : `${biz.name} provides professional services in ${biz.address.city || 'your area'}. Licensed, insured, free estimates. ${tagline}`.slice(0, 158);
    snippets.push({
      id: 'meta-description',
      title: 'Meta description',
      where: 'In your <head>, replace any existing <meta name="description"> tag.',
      why: 'Google and AI crawlers pull this exact text into search results. 120-160 characters is the sweet spot.',
      language: 'html',
      code: `<meta name="description" content="${target}">`,
    });
  }

  // --- TITLE TAG ----------------------------------------------
  if (!biz.title || biz.title.length < 10 || biz.title.length > 60) {
    const newTitle = `${biz.name}${biz.address.city ? ` | ${biz.address.city}` : ''} — Free Estimates`.slice(0, 60);
    snippets.push({
      id: 'title',
      title: 'Title tag',
      where: 'In your <head>, replace your existing <title> tag.',
      why: '50-60 characters, primary keyword first, location second, brand last. Each page should have a unique title.',
      language: 'html',
      code: `<title>${newTitle}</title>`,
    });
  }

  // --- LOCALBUSINESS JSON-LD SCHEMA ---------------------------
  if (!biz.schemaTypes.includes('LocalBusiness') &&
      !biz.schemaTypes.includes('GeneralContractor') &&
      !biz.schemaTypes.includes('HomeAndConstructionBusiness')) {
    const schema = {
      "@context": "https://schema.org",
      "@type": "GeneralContractor",
      "name": biz.name,
      "url": biz.url,
      ...(biz.image && { "image": biz.image }),
      ...(biz.phone && { "telephone": biz.phone }),
      ...(biz.email && { "email": biz.email }),
      "address": {
        "@type": "PostalAddress",
        ...(biz.address.street && { "streetAddress": biz.address.street }),
        ...(biz.address.city && { "addressLocality": biz.address.city }),
        ...(biz.address.region && { "addressRegion": biz.address.region }),
        ...(biz.address.postal && { "postalCode": biz.address.postal }),
        "addressCountry": biz.address.country || "US"
      },
      "priceRange": "$$",
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          "opens": "08:00",
          "closes": "17:00"
        }
      ]
    };
    snippets.push({
      id: 'localbusiness-schema',
      title: 'LocalBusiness JSON-LD schema',
      where: 'Paste this <script> block right before </head> on every page.',
      why: 'Tells Google, ChatGPT, Perplexity, and Grok what kind of business you are, where, and how to reach you. Single biggest AI-visibility win.',
      language: 'html',
      code: `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`,
    });
  }

  // --- FAQPAGE SCHEMA --------------------------------------
  if (!biz.schemaTypes.includes('FAQPage')) {
    const sampleFaq = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": `How much does ${(biz.name || 'a project').toLowerCase().includes('granite') ? 'a countertop' : 'a typical project'} cost?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Pricing depends on size, materials, and finish. We provide free written estimates within 24 hours. Call us or use the contact form."
          }
        },
        {
          "@type": "Question",
          "name": "Are you licensed and insured?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. We carry full general liability and workers' comp insurance. License numbers are posted on our About page."
          }
        },
        {
          "@type": "Question",
          "name": `What areas do you serve${biz.address.city ? ` near ${biz.address.city}` : ''}?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `${biz.address.city ? `${biz.address.city} and the surrounding metro area. ` : ''}Call to confirm we cover your zip code.`
          }
        }
      ]
    };
    snippets.push({
      id: 'faqpage-schema',
      title: 'FAQ schema',
      where: 'Add this <script> to a /faq page (or your homepage if you don\'t have one). Replace the placeholder Q&As with your real FAQ.',
      why: 'AI assistants love FAQ schema — it lets them quote you directly. Each question is a separate citation opportunity.',
      language: 'html',
      code: `<script type="application/ld+json">\n${JSON.stringify(sampleFaq, null, 2)}\n</script>`,
    });
  }

  // --- OPEN GRAPH ---------------------------------------------
  const ogTitle = grader.$('meta[property="og:title"]').attr('content');
  const ogDesc  = grader.$('meta[property="og:description"]').attr('content');
  const ogImg   = grader.$('meta[property="og:image"]').attr('content');
  if (!ogTitle || !ogDesc || !ogImg) {
    const titleVal = biz.title || biz.name;
    const descVal = biz.description || `${biz.name} — professional services in ${biz.address.city || 'your area'}. Free estimates.`;
    snippets.push({
      id: 'open-graph',
      title: 'Open Graph tags',
      where: 'In your <head>. These control how your page looks when shared on Facebook, LinkedIn, iMessage, etc.',
      why: 'Without OG tags, shared links show a blank preview. With them, you get a branded card with your image.',
      language: 'html',
      code:
`<meta property="og:title" content="${titleVal}">
<meta property="og:description" content="${descVal}">
<meta property="og:image" content="${ogImg || biz.url + '/og-image.jpg'}">
<meta property="og:url" content="${biz.url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${biz.name}">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${titleVal}">
<meta name="twitter:description" content="${descVal}">
<meta name="twitter:image" content="${ogImg || biz.url + '/og-image.jpg'}">`,
    });
  }

  // --- CANONICAL ---------------------------------------------
  const canonical = grader.$('link[rel="canonical"]').attr('href');
  if (!canonical) {
    snippets.push({
      id: 'canonical',
      title: 'Canonical URL',
      where: 'In your <head>, on every page. Update href to match the page\'s actual URL.',
      why: 'Tells Google which version of a URL is the "real" one. Prevents duplicate-content penalties.',
      language: 'html',
      code: `<link rel="canonical" href="${biz.url}">`,
    });
  }

  // --- ROBOTS.TXT ---------------------------------------------
  // We don't fetch /robots.txt; we just include a starter so the
  // visitor can drop one in if they don't have one.
  snippets.push({
    id: 'robots-txt',
    title: 'robots.txt',
    where: `Save as a file at ${biz.url}/robots.txt (root of your site).`,
    why: 'Tells crawlers what to index and where the sitemap is. ChatGPT/Perplexity bots respect this too.',
    language: 'plaintext',
    code:
`User-agent: *
Allow: /

# AI assistant crawlers — explicitly allow
User-agent: GPTBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: anthropic-ai
Allow: /
User-agent: Google-Extended
Allow: /

Sitemap: ${biz.url.replace(/\/$/, '')}/sitemap.xml`,
  });

  // --- TEL: LINK ----------------------------------------------
  if (biz.phone) {
    const telNum = biz.phone.replace(/[^\d+]/g, '');
    snippets.push({
      id: 'tel-link',
      title: 'Make your phone number tappable',
      where: 'Anywhere you display your phone number. Replace plain text with this link.',
      why: 'On mobile (where most contractor leads come from now), tapping starts the call instantly. Plain text doesn\'t.',
      language: 'html',
      code: `<a href="tel:+1${telNum.replace(/^\+?1?/, '')}">${biz.phone}</a>`,
    });
  }

  // --- FALLBACK ALT TEXT --------------------------------------
  const imgs = grader.$('img');
  let missingAlt = 0;
  imgs.each((_, im) => { if (!grader.$(im).attr('alt')) missingAlt++; });
  if (missingAlt > 0) {
    snippets.push({
      id: 'image-alt',
      title: `Add alt text to ${missingAlt} image${missingAlt === 1 ? '' : 's'}`,
      where: 'Edit each <img> tag and add an alt="..." attribute that describes what\'s in the image.',
      why: 'Required for screen readers, helps SEO, and AI assistants use alt text to understand your images. "Image" or "photo" is not useful — describe the actual content.',
      language: 'html',
      code:
`<!-- Bad: -->
<img src="kitchen.jpg">

<!-- Good: -->
<img src="kitchen.jpg" alt="Modern white kitchen with quartz countertops we installed in Phoenix, 2025">`,
    });
  }

  return snippets;
}

router.post('/fix-it', graderLimiter, async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    console.log(`[FIX-IT] ${url}`);

    const grader = new WebsiteGrader(url);
    if (!(await grader.fetchPage())) {
      return res.status(400).json({ success: false, error: 'Could not fetch website' });
    }

    // Run the same checks as the grader so we know what's missing
    grader.checkHttps();
    grader.checkMobileViewport();
    grader.checkMetaTags();
    grader.checkHeadings();
    grader.checkImages();
    grader.checkStructuredData();
    grader.checkSocialPresence();
    grader.checkContactInfo();
    grader.checkContentQuality();

    const biz = extractBusinessData(grader);
    const snippets = generateSnippets(grader, biz);

    return res.json({
      success: true,
      url: grader.url,
      domain: grader.domain,
      business: biz,
      snippets,
      total: snippets.length,
    });
  } catch (error) {
    console.error('Fix-it error:', error);
    return res.status(500).json({ success: false, error: 'Fix-it failed: ' + error.message });
  }
});

// =============================================================
// TOOL #4: GBP AUDIT — Google Business Profile signals
// Without GBP API access, audits the page for the signals that
// connect a site to its GBP listing: LocalBusiness schema NAP,
// social links to GBP, sameAs references, NAP consistency.
// =============================================================
router.post('/gbp', graderLimiter, async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ success: false, error: 'URL is required' });

    console.log(`[GBP] ${url}`);
    const grader = new WebsiteGrader(url);
    if (!(await grader.fetchPage())) {
      return res.status(400).json({ success: false, error: 'Could not fetch website' });
    }
    grader.checkStructuredData();
    grader.checkSocialPresence();
    grader.checkContactInfo();

    const $ = grader.$;
    const html = grader.html || '';
    const checks = [];

    // 1. Schema.org LocalBusiness (or subtype) present?
    const localTypes = ['LocalBusiness', 'GeneralContractor', 'HomeAndConstructionBusiness',
      'ProfessionalService', 'Plumber', 'Electrician', 'HVACBusiness', 'RoofingContractor'];
    const hasLocal = (grader.scores.schema_types || []).some((t) => localTypes.includes(t));
    checks.push({
      key: 'schema_local',
      label: 'LocalBusiness schema with NAP',
      pass: !!hasLocal,
      detail: hasLocal
        ? `Found schema type(s): ${grader.scores.schema_types.filter(t => localTypes.includes(t)).join(', ')}`
        : 'No LocalBusiness or contractor schema detected. AI assistants and Google rely on this to tie your site to your GBP listing.',
    });

    // 2. Direct link to GBP profile (g.page / google.com/maps / business.google.com)
    let gbpLink = null;
    $('a[href]').each((_, a) => {
      const href = ($(a).attr('href') || '').toLowerCase();
      if (/g\.page|google\.com\/maps|business\.google\.com|maps\.app\.goo\.gl/.test(href) && !gbpLink) {
        gbpLink = $(a).attr('href');
      }
    });
    checks.push({
      key: 'gbp_link',
      label: 'Direct link to your GBP listing',
      pass: !!gbpLink,
      detail: gbpLink
        ? `Found link: ${gbpLink}`
        : 'No g.page / Google Maps / business.google.com link found in the page. Add one to your footer or contact section so users (and crawlers) can verify the connection.',
    });

    // 3. sameAs references in JSON-LD that include the GBP profile
    let hasSameAsGBP = false;
    let sameAsList = [];
    $('script[type="application/ld+json"]').each((_, s) => {
      try {
        const parsed = JSON.parse($(s).html());
        const items = Array.isArray(parsed) ? parsed : [parsed];
        items.forEach((item) => {
          if (item && Array.isArray(item.sameAs)) {
            sameAsList.push(...item.sameAs);
            if (item.sameAs.some((x) => /g\.page|google\.com\/maps|business\.google\.com/.test(String(x)))) {
              hasSameAsGBP = true;
            }
          }
        });
      } catch (_) {}
    });
    checks.push({
      key: 'sameAs',
      label: 'sameAs:[GBP URL] in JSON-LD',
      pass: hasSameAsGBP,
      detail: hasSameAsGBP
        ? `Found GBP URL in sameAs array.`
        : sameAsList.length
          ? `sameAs has ${sameAsList.length} entries but no GBP URL. Add your g.page or maps URL.`
          : 'No sameAs array in your JSON-LD. This is the strongest signal you can give Google to link the site to the listing.',
    });

    // 4. NAP consistency — phone in schema matches phone in body
    const phoneInBody = (html.match(/(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/g) || [])
      .map(p => p.replace(/[^\d]/g, '').slice(-10));
    let phoneInSchema = null;
    $('script[type="application/ld+json"]').each((_, s) => {
      try {
        const parsed = JSON.parse($(s).html());
        const items = Array.isArray(parsed) ? parsed : [parsed];
        items.forEach((item) => {
          if (item && item.telephone && !phoneInSchema) {
            phoneInSchema = String(item.telephone).replace(/[^\d]/g, '').slice(-10);
          }
        });
      } catch (_) {}
    });
    const napMatch = phoneInSchema && phoneInBody.includes(phoneInSchema);
    checks.push({
      key: 'nap_consistency',
      label: 'Phone in schema matches phone in body',
      pass: !!napMatch,
      detail: napMatch
        ? `Schema phone (${phoneInSchema}) appears on the page. Crawlers see one consistent number.`
        : phoneInSchema
          ? `Schema phone (${phoneInSchema}) does not appear in the body text. Inconsistent NAP confuses Google.`
          : 'No telephone field in your JSON-LD. Add it so Google can match your site to your GBP listing.',
    });

    // 5. Address completeness in schema
    let hasFullAddress = false;
    $('script[type="application/ld+json"]').each((_, s) => {
      try {
        const parsed = JSON.parse($(s).html());
        const items = Array.isArray(parsed) ? parsed : [parsed];
        items.forEach((item) => {
          const a = item && item.address;
          if (a && a.streetAddress && a.addressLocality && a.addressRegion && a.postalCode) {
            hasFullAddress = true;
          }
        });
      } catch (_) {}
    });
    checks.push({
      key: 'address_complete',
      label: 'Full street address in schema',
      pass: hasFullAddress,
      detail: hasFullAddress
        ? `Found streetAddress + city + region + postal code.`
        : 'Schema is missing one or more address fields. GBP listings need exact NAP match — fill in all of street, city, state, zip.',
    });

    // 6. Opening hours in schema
    let hasHours = false;
    $('script[type="application/ld+json"]').each((_, s) => {
      try {
        const parsed = JSON.parse($(s).html());
        const items = Array.isArray(parsed) ? parsed : [parsed];
        items.forEach((item) => {
          if (item && (item.openingHours || item.openingHoursSpecification)) {
            hasHours = true;
          }
        });
      } catch (_) {}
    });
    checks.push({
      key: 'hours',
      label: 'Opening hours in schema',
      pass: hasHours,
      detail: hasHours
        ? 'Schema declares your hours. AI assistants will report "open now" / "closed now" correctly.'
        : 'No openingHours or openingHoursSpecification. Add it so ChatGPT can answer "are they open right now?"',
    });

    const passed = checks.filter(c => c.pass).length;
    const score = Math.round((passed / checks.length) * 100);

    let verdict;
    if (score >= 80)      verdict = 'Strong GBP signals — Google should connect your site to your listing.';
    else if (score >= 50) verdict = 'Mixed signals — fix the failures below to consolidate your local presence.';
    else                  verdict = 'Weak signals — your site and your GBP listing are probably treated as separate entities.';

    return res.json({
      success: true,
      url: grader.url,
      domain: grader.domain,
      score,
      passed,
      total: checks.length,
      verdict,
      checks,
    });
  } catch (error) {
    console.error('GBP audit error:', error);
    return res.status(500).json({ success: false, error: 'GBP audit failed: ' + error.message });
  }
});

// =============================================================
// TOOL #5: SCHEMA VALIDATOR — Real JSON-LD validation
// Parses every <script type="application/ld+json">, checks for
// JSON validity, required schema.org fields per type, common
// Google Rich Results requirements.
// =============================================================
router.post('/schema', graderLimiter, async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ success: false, error: 'URL is required' });

    console.log(`[SCHEMA] ${url}`);
    const grader = new WebsiteGrader(url);
    if (!(await grader.fetchPage())) {
      return res.status(400).json({ success: false, error: 'Could not fetch website' });
    }

    const $ = grader.$;
    const blocks = [];
    const blockEls = $('script[type="application/ld+json"]').toArray();

    if (blockEls.length === 0) {
      return res.json({
        success: true,
        url: grader.url,
        domain: grader.domain,
        score: 0,
        verdict: 'No JSON-LD schema found. AI assistants have nothing structured to read.',
        blocks: [],
        summary: { total_blocks: 0, valid: 0, invalid: 0, warnings: 0 },
      });
    }

    // Required-fields map for common schema types Google rich-results uses
    const required = {
      LocalBusiness:        ['name', 'address'],
      GeneralContractor:    ['name', 'address'],
      HomeAndConstructionBusiness: ['name', 'address'],
      Organization:         ['name'],
      WebSite:              ['name', 'url'],
      WebPage:              ['name'],
      FAQPage:              ['mainEntity'],
      Question:             ['name', 'acceptedAnswer'],
      Service:              ['name', 'provider'],
      Product:              ['name'],
      Review:               ['reviewBody', 'author'],
      AggregateRating:      ['ratingValue', 'reviewCount'],
      Article:              ['headline', 'author', 'datePublished'],
      BreadcrumbList:       ['itemListElement'],
      HowTo:                ['name', 'step'],
      Event:                ['name', 'startDate', 'location'],
    };

    blockEls.forEach((el, i) => {
      const raw = $(el).html() || '';
      const block = { index: i, valid: false, types: [], issues: [], warnings: [], snippet: raw.slice(0, 220) };

      let parsed;
      try { parsed = JSON.parse(raw); }
      catch (err) {
        block.issues.push(`Invalid JSON: ${err.message}`);
        blocks.push(block);
        return;
      }

      block.valid = true;
      const items = Array.isArray(parsed) ? parsed : [parsed];

      const validateNode = (node, path = '$') => {
        if (!node || typeof node !== 'object') return;
        const t = node['@type'];
        const types = Array.isArray(t) ? t : (t ? [t] : []);
        types.forEach((typeName) => {
          if (typeName) block.types.push(typeName);
          const req = required[typeName];
          if (req) {
            req.forEach((field) => {
              if (!(field in node) || node[field] == null || node[field] === '') {
                block.issues.push(`${path} (${typeName}): missing required field "${field}"`);
              }
            });
          }
        });
        // Common warnings
        if (node['@type'] === 'AggregateRating') {
          if (!('itemReviewed' in node)) {
            block.warnings.push(`${path}: AggregateRating without itemReviewed — Google may ignore it`);
          }
        }
        if (node['@type'] === 'Service' && node.aggregateRating && !node.review) {
          block.warnings.push(`${path}: Service with aggregateRating but no review array — Google flags this in Search Console`);
        }
        // Recurse into nested @graph and known nested fields
        ['@graph', 'mainEntity', 'itemListElement', 'review', 'author', 'provider', 'address']
          .forEach((k) => {
            const v = node[k];
            if (Array.isArray(v)) v.forEach((c, j) => validateNode(c, `${path}.${k}[${j}]`));
            else if (v && typeof v === 'object') validateNode(v, `${path}.${k}`);
          });
      };

      items.forEach((item, j) => validateNode(item, `block[${i}]${items.length > 1 ? `.item[${j}]` : ''}`));
      block.types = [...new Set(block.types)];
      blocks.push(block);
    });

    const valid = blocks.filter(b => b.valid && b.issues.length === 0).length;
    const invalid = blocks.length - valid;
    const totalWarnings = blocks.reduce((s, b) => s + b.warnings.length, 0);
    const totalIssues = blocks.reduce((s, b) => s + b.issues.length, 0);

    let score = 100;
    score -= invalid * 25;
    score -= totalIssues * 8;
    score -= totalWarnings * 4;
    score = Math.max(0, Math.min(100, score));

    let verdict;
    if (score >= 90)      verdict = 'Schema looks clean — every block parses and meets required fields.';
    else if (score >= 70) verdict = 'Mostly valid, a few warnings to address.';
    else if (score >= 40) verdict = 'Multiple issues — Google may be ignoring some rich-result hints.';
    else                  verdict = 'Schema is broken or missing required fields. AI crawlers can\'t use it.';

    return res.json({
      success: true,
      url: grader.url,
      domain: grader.domain,
      score,
      verdict,
      blocks,
      summary: { total_blocks: blocks.length, valid, invalid, total_issues: totalIssues, total_warnings: totalWarnings },
    });
  } catch (error) {
    console.error('Schema validate error:', error);
    return res.status(500).json({ success: false, error: 'Schema validate failed: ' + error.message });
  }
});

// =============================================================
// TOOL #6: MOBILE UX CHECK
// Viewport meta, tap-target presence (tel: / mailto:), font-size
// minimums in inline styles, responsive image markup, hover-only
// interactions detected in CSS.
// =============================================================
router.post('/mobile', graderLimiter, async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ success: false, error: 'URL is required' });

    console.log(`[MOBILE] ${url}`);
    const grader = new WebsiteGrader(url);
    if (!(await grader.fetchPage())) {
      return res.status(400).json({ success: false, error: 'Could not fetch website' });
    }

    const $ = grader.$;
    const html = grader.html || '';
    const checks = [];

    // 1. Viewport meta
    const viewport = $('meta[name="viewport"]').attr('content') || '';
    const hasViewport = viewport.includes('width=device-width');
    checks.push({
      key: 'viewport',
      label: 'Mobile viewport meta tag',
      pass: hasViewport,
      detail: hasViewport
        ? `Found: ${viewport}`
        : 'Missing or non-standard <meta name="viewport"> tag. Mobile browsers will render at desktop width and zoom out.',
    });

    // 2. Phone numbers are clickable as tel: links
    const phoneRegex = /(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/g;
    const allPhones = (html.match(phoneRegex) || []).filter((v, i, a) => a.indexOf(v) === i);
    const telLinks = $('a[href^="tel:"]').length;
    const phoneCount = allPhones.length;
    const phoneClickable = phoneCount === 0 ? null : (telLinks >= 1);
    checks.push({
      key: 'tel_links',
      label: phoneCount > 0
        ? `Phone numbers tappable (tel: links)`
        : 'Phone numbers tappable',
      pass: phoneClickable === true,
      neutral: phoneClickable === null,
      detail: phoneCount === 0
        ? 'No phone numbers found on the page. Add one and wire it as <a href="tel:+1...">.'
        : telLinks >= 1
          ? `Found ${telLinks} tel: link(s). Mobile visitors can tap to call.`
          : `Found ${phoneCount} phone number(s) in text but no tel: links. Mobile visitors can\'t tap to call.`,
    });

    // 3. Email tappable as mailto:
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const allEmails = (html.match(emailRegex) || []).filter((v, i, a) => a.indexOf(v) === i);
    const mailtoLinks = $('a[href^="mailto:"]').length;
    const emailClickable = allEmails.length === 0 ? null : (mailtoLinks >= 1);
    checks.push({
      key: 'mailto_links',
      label: 'Emails tappable (mailto: links)',
      pass: emailClickable === true,
      neutral: emailClickable === null,
      detail: allEmails.length === 0
        ? 'No emails found. Add a contact email wired with <a href="mailto:...">.'
        : mailtoLinks >= 1
          ? `Found ${mailtoLinks} mailto: link(s).`
          : `Found ${allEmails.length} email(s) in text but no mailto: links.`,
    });

    // 4. Responsive images (srcset / sizes / picture)
    const imgs = $('img');
    let responsiveImgs = 0;
    imgs.each((_, im) => {
      if ($(im).attr('srcset') || $(im).attr('sizes') || $(im).parent('picture').length) responsiveImgs++;
    });
    const imgScore = imgs.length === 0 ? null : (responsiveImgs / imgs.length);
    checks.push({
      key: 'responsive_images',
      label: 'Responsive images',
      pass: imgScore === null ? null : imgScore >= 0.5,
      neutral: imgScore === null,
      detail: imgs.length === 0
        ? 'No <img> elements on the page.'
        : `${responsiveImgs} of ${imgs.length} images use srcset / sizes / <picture>. Larger screens download bigger files; mobile gets a smaller version. Add srcset or wrap critical images in <picture>.`,
    });

    // 5. Hover-only interactions (look for CSS-in-HTML hover rules with no touch fallback)
    // Limited heuristic: just check for explicit ":hover {" in inline <style> tags
    const hasHoverOnlyHints = /\:hover\s*\{[^}]*display\s*:/i.test(html);
    checks.push({
      key: 'hover_safe',
      label: 'No hover-only interactions',
      pass: !hasHoverOnlyHints,
      detail: hasHoverOnlyHints
        ? 'Detected :hover rules that toggle display. On touch devices, hover is unreliable — make sure dropdowns, menus, etc. work on tap too.'
        : 'No suspicious hover-only display toggles in inline styles.',
    });

    // 6. Font-size minimum readability — heuristic, look for inline styles with very small font
    const tinyFontHits = (html.match(/font-size\s*:\s*(?:1[01]?|9|8|7|6|5)px/gi) || []).length;
    checks.push({
      key: 'font_size',
      label: 'No tiny inline font-sizes',
      pass: tinyFontHits === 0,
      detail: tinyFontHits === 0
        ? 'No suspicious sub-12px font-size declarations in inline styles.'
        : `Found ${tinyFontHits} inline font-size declaration(s) under 12px. Mobile users will struggle to read.`,
    });

    // 7. Mobile-friendly horizontal scroll guard — check for fixed-width inline styles
    const fixedWidthHits = (html.match(/width\s*:\s*[0-9]{3,4}px/gi) || []).length;
    checks.push({
      key: 'no_fixed_widths',
      label: 'No fixed-pixel widths that overflow mobile',
      pass: fixedWidthHits < 3,
      detail: fixedWidthHits < 3
        ? `Inline width declarations look mobile-friendly (${fixedWidthHits} found).`
        : `Found ${fixedWidthHits} inline fixed-width declarations. Anything over ~360px overflows small phones and causes horizontal scroll.`,
    });

    const evaluable = checks.filter(c => c.pass !== null && !c.neutral);
    const passed = evaluable.filter(c => c.pass).length;
    const score = evaluable.length ? Math.round((passed / evaluable.length) * 100) : 0;

    let verdict;
    if (score >= 85)      verdict = 'Mobile UX is solid — visitors can tap, read, and call without friction.';
    else if (score >= 60) verdict = 'Mostly mobile-friendly with some gaps to close.';
    else                  verdict = 'Mobile UX is broken in multiple ways. Most contractor leads come from phones — fix this first.';

    return res.json({
      success: true,
      url: grader.url,
      domain: grader.domain,
      score,
      passed,
      total: evaluable.length,
      verdict,
      checks,
    });
  } catch (error) {
    console.error('Mobile UX error:', error);
    return res.status(500).json({ success: false, error: 'Mobile UX check failed: ' + error.message });
  }
});

// =============================================================
// TOOL #7: ACCESSIBILITY (A11Y) CHECK
// Alt-text quality, heading hierarchy, form labels, lang attribute,
// skip-link presence, button vs link semantics.
// =============================================================
router.post('/a11y', graderLimiter, async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ success: false, error: 'URL is required' });

    console.log(`[A11Y] ${url}`);
    const grader = new WebsiteGrader(url);
    if (!(await grader.fetchPage())) {
      return res.status(400).json({ success: false, error: 'Could not fetch website' });
    }

    const $ = grader.$;
    const checks = [];

    // 1. <html lang="...">
    const lang = $('html').attr('lang');
    checks.push({
      key: 'lang',
      label: 'html lang attribute',
      pass: !!lang,
      detail: lang ? `Found: lang="${lang}"` : 'Missing <html lang="en"> attribute. Screen readers need this to use the right voice.',
    });

    // 2. <title> non-empty
    const title = ($('title').text() || '').trim();
    checks.push({
      key: 'title',
      label: 'Page title present',
      pass: title.length > 0,
      detail: title ? `Title: "${title.slice(0, 80)}"` : 'No <title> element found.',
    });

    // 3. Single H1
    const h1Count = $('h1').length;
    checks.push({
      key: 'single_h1',
      label: 'Exactly one <h1>',
      pass: h1Count === 1,
      detail: h1Count === 1 ? 'Found one h1.' : h1Count === 0 ? 'No h1 element on the page.' : `Found ${h1Count} h1 elements — should be exactly one.`,
    });

    // 4. Alt text quality (not just presence)
    const imgs = $('img');
    let goodAlt = 0;
    let badAlt = 0;
    let missingAlt = 0;
    const badAltExamples = [];
    imgs.each((_, im) => {
      const alt = $(im).attr('alt');
      const src = $(im).attr('src') || '';
      if (alt === undefined) { missingAlt++; return; }
      const a = alt.trim().toLowerCase();
      // Decorative — empty alt is OK
      if (a === '' && !$(im).attr('role')) { goodAlt++; return; }
      // Bad: filename or generic
      if (
        /^(image|img|photo|picture|graphic|icon)\.?$/i.test(a) ||
        /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(a) ||
        a === 'untitled' ||
        a.length < 4
      ) {
        badAlt++;
        if (badAltExamples.length < 3) badAltExamples.push(`<img src="${src.slice(0, 40)}" alt="${alt}">`);
        return;
      }
      goodAlt++;
    });
    checks.push({
      key: 'alt_quality',
      label: 'Image alt text is descriptive',
      pass: imgs.length === 0 ? null : (badAlt === 0 && missingAlt === 0),
      neutral: imgs.length === 0,
      detail: imgs.length === 0
        ? 'No images on this page.'
        : `${imgs.length} images: ${goodAlt} good, ${badAlt} weak, ${missingAlt} missing. ${badAltExamples.length ? 'Weak examples: ' + badAltExamples.join(' · ') : ''}`,
    });

    // 5. Form inputs have labels or aria-label
    const inputs = $('input:not([type="hidden"]), textarea, select');
    let labeledInputs = 0;
    let unlabeledInputs = 0;
    inputs.each((_, inp) => {
      const id = $(inp).attr('id');
      const ariaLabel = $(inp).attr('aria-label');
      const ariaLabelledby = $(inp).attr('aria-labelledby');
      const placeholder = $(inp).attr('placeholder');
      const wrappedByLabel = $(inp).parents('label').length > 0;
      const labelFor = id ? $(`label[for="${id}"]`).length > 0 : false;
      if (ariaLabel || ariaLabelledby || wrappedByLabel || labelFor) labeledInputs++;
      else if (placeholder) unlabeledInputs++; // placeholder is not a label, but at least informs
      else unlabeledInputs++;
    });
    checks.push({
      key: 'form_labels',
      label: 'Form inputs have labels',
      pass: inputs.length === 0 ? null : (unlabeledInputs === 0),
      neutral: inputs.length === 0,
      detail: inputs.length === 0
        ? 'No form inputs on the page.'
        : `${labeledInputs} of ${labeledInputs + unlabeledInputs} inputs have a real label or aria-label. Placeholder text is NOT a substitute for a label.`,
    });

    // 6. Skip-to-content link
    const skipLink = $('a[href^="#"]').filter((_, a) => /skip/i.test($(a).text())).length > 0;
    checks.push({
      key: 'skip_link',
      label: 'Skip-to-content link',
      pass: skipLink,
      detail: skipLink
        ? 'Found a "Skip to content" link.'
        : 'No skip link. Keyboard users tab through the entire nav before reaching content.',
    });

    // 7. Button vs link semantics — non-anchor buttons should be <button>
    const fakeButtons = $('div[onclick], span[onclick]').length;
    checks.push({
      key: 'button_semantics',
      label: 'Buttons use <button>, not <div onclick>',
      pass: fakeButtons === 0,
      detail: fakeButtons === 0
        ? 'No <div onclick> or <span onclick> elements — proper semantic buttons.'
        : `Found ${fakeButtons} <div>/<span> with inline onclick. Use <button> so screen readers and keyboards work.`,
    });

    // 8. Heading order — h2 before h3 etc
    const headings = [];
    $('h1, h2, h3, h4, h5, h6').each((_, h) => headings.push(parseInt(h.tagName[1], 10)));
    let outOfOrder = false;
    for (let i = 1; i < headings.length; i++) {
      if (headings[i] - headings[i - 1] > 1) { outOfOrder = true; break; }
    }
    checks.push({
      key: 'heading_order',
      label: 'Heading hierarchy is sequential',
      pass: !outOfOrder,
      detail: outOfOrder
        ? 'Some headings skip a level (e.g. h2 directly to h4). Screen readers use heading order to build a page outline.'
        : 'Heading levels descend in order, no skips.',
    });

    const evaluable = checks.filter(c => c.pass !== null && !c.neutral);
    const passed = evaluable.filter(c => c.pass).length;
    const score = evaluable.length ? Math.round((passed / evaluable.length) * 100) : 0;

    let verdict;
    if (score >= 85)      verdict = 'Accessibility looks strong — keyboard and screen-reader users can use this site.';
    else if (score >= 60) verdict = 'Some accessibility gaps. Most are cheap fixes.';
    else                  verdict = 'Multiple accessibility failures. Web developers will notice.';

    return res.json({
      success: true,
      url: grader.url,
      domain: grader.domain,
      score,
      passed,
      total: evaluable.length,
      verdict,
      checks,
    });
  } catch (error) {
    console.error('A11y error:', error);
    return res.status(500).json({ success: false, error: 'Accessibility check failed: ' + error.message });
  }
});

// =============================================================
// TOOL #8: SITEMAP & ROBOTS AUDIT
// Fetches /robots.txt and /sitemap.xml, validates structure,
// checks for AI bot allow rules, validates sitemap freshness.
// =============================================================
router.post('/sitemap', graderLimiter, async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ success: false, error: 'URL is required' });

    let normalizedUrl = url.replace(/\/$/, '');
    if (!normalizedUrl.startsWith('http')) normalizedUrl = 'https://' + normalizedUrl;
    const origin = new URL(normalizedUrl).origin;

    console.log(`[SITEMAP] ${origin}`);

    const checks = [];
    const fetchOpt = { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'RemodelyGrader/1.0' } };

    // 1. robots.txt
    let robotsText = '';
    let robotsOk = false;
    try {
      const r = await fetch(`${origin}/robots.txt`, fetchOpt);
      robotsOk = r.ok;
      if (r.ok) robotsText = await r.text();
    } catch (_) { robotsOk = false; }

    checks.push({
      key: 'robots_present',
      label: 'robots.txt exists',
      pass: robotsOk && robotsText.length > 0,
      detail: robotsOk
        ? `Fetched robots.txt (${robotsText.length} bytes).`
        : 'No robots.txt found at root. Crawlers fall back to default behavior. Add one even if minimal.',
    });

    // 2. AI bot allow rules
    const aiBots = ['GPTBot', 'ChatGPT-User', 'PerplexityBot', 'ClaudeBot', 'anthropic-ai', 'Google-Extended'];
    const aiBotMentions = aiBots.filter((b) => new RegExp(`User-agent:\\s*${b}\\b`, 'i').test(robotsText));
    const blocksAi = aiBots.some((b) => {
      const m = new RegExp(`User-agent:\\s*${b}\\b[\\s\\S]*?Disallow:\\s*\\/\\b`, 'i').test(robotsText);
      return m;
    });
    checks.push({
      key: 'ai_bots_allowed',
      label: 'robots.txt explicitly handles AI crawlers',
      pass: aiBotMentions.length > 0 && !blocksAi,
      detail: aiBotMentions.length === 0
        ? 'robots.txt does not mention GPTBot / ChatGPT-User / PerplexityBot / ClaudeBot. They\'ll fall back to wildcards but explicit Allow rules are stronger signals.'
        : blocksAi
          ? `robots.txt mentions AI bots (${aiBotMentions.join(', ')}) but appears to disallow some. Check this is intentional.`
          : `robots.txt explicitly handles ${aiBotMentions.length} AI crawler(s): ${aiBotMentions.join(', ')}.`,
    });

    // 3. Sitemap directive in robots.txt
    const sitemapMatch = robotsText.match(/Sitemap:\s*(\S+)/i);
    const declaredSitemap = sitemapMatch ? sitemapMatch[1] : null;
    checks.push({
      key: 'sitemap_declared',
      label: 'Sitemap URL declared in robots.txt',
      pass: !!declaredSitemap,
      detail: declaredSitemap
        ? `Found: ${declaredSitemap}`
        : 'No "Sitemap:" line in robots.txt. Crawlers use this to find your sitemap.xml — add it.',
    });

    // 4. sitemap.xml fetchable
    const sitemapUrl = declaredSitemap || `${origin}/sitemap.xml`;
    let sitemapText = '';
    let sitemapOk = false;
    try {
      const r = await fetch(sitemapUrl, fetchOpt);
      sitemapOk = r.ok;
      if (r.ok) sitemapText = await r.text();
    } catch (_) { sitemapOk = false; }

    checks.push({
      key: 'sitemap_present',
      label: 'sitemap.xml is reachable',
      pass: sitemapOk && sitemapText.length > 0,
      detail: sitemapOk
        ? `Fetched ${sitemapUrl} (${sitemapText.length} bytes).`
        : `Could not fetch ${sitemapUrl}. Without a sitemap, crawlers find pages only through links.`,
    });

    // 5. Sitemap structure — count URLs
    const urlMatches = sitemapText.match(/<url>\s*<loc>/g) || [];
    const sitemapIndexMatches = sitemapText.match(/<sitemap>\s*<loc>/g) || [];
    const totalUrls = urlMatches.length;
    const isIndex = sitemapIndexMatches.length > 0;
    checks.push({
      key: 'sitemap_urls',
      label: 'Sitemap contains URLs',
      pass: totalUrls > 0 || isIndex,
      detail: isIndex
        ? `Sitemap is an index pointing to ${sitemapIndexMatches.length} child sitemaps.`
        : totalUrls > 0
          ? `Sitemap declares ${totalUrls} URLs.`
          : 'Sitemap exists but has no <url> entries. Empty sitemap = no crawl roadmap.',
    });

    // 6. lastmod freshness — at least one within last 6 months
    const lastmodDates = sitemapText.match(/<lastmod>([^<]+)<\/lastmod>/g) || [];
    const sixMonthsAgo = Date.now() - 180 * 24 * 60 * 60 * 1000;
    const recentLastmods = lastmodDates.filter(m => {
      const d = m.match(/<lastmod>([^<]+)<\/lastmod>/);
      if (!d) return false;
      const t = Date.parse(d[1]);
      return !isNaN(t) && t > sixMonthsAgo;
    }).length;
    checks.push({
      key: 'sitemap_fresh',
      label: 'Sitemap has recent lastmod dates',
      pass: recentLastmods > 0 || lastmodDates.length === 0,
      detail: lastmodDates.length === 0
        ? 'No <lastmod> dates in sitemap. Add them so crawlers know what changed since last visit.'
        : recentLastmods > 0
          ? `${recentLastmods} of ${lastmodDates.length} entries updated in the last 6 months.`
          : `${lastmodDates.length} entries but none updated in the last 6 months. Crawlers will deprioritize.`,
    });

    const evaluable = checks.filter(c => c.pass !== null);
    const passed = evaluable.filter(c => c.pass).length;
    const score = evaluable.length ? Math.round((passed / evaluable.length) * 100) : 0;

    let verdict;
    if (score >= 85)      verdict = 'Crawlers have a clear roadmap of your site.';
    else if (score >= 60) verdict = 'Some gaps that may slow indexing.';
    else                  verdict = 'Crawlers are flying blind. Fix robots and sitemap basics.';

    return res.json({
      success: true,
      url: origin,
      domain: new URL(origin).hostname,
      score,
      passed,
      total: evaluable.length,
      verdict,
      checks,
      details: {
        robots_url: `${origin}/robots.txt`,
        robots_size: robotsText.length,
        sitemap_url: sitemapUrl,
        sitemap_size: sitemapText.length,
        sitemap_urls: totalUrls,
        ai_bot_rules: aiBotMentions,
      },
    });
  } catch (error) {
    console.error('Sitemap audit error:', error);
    return res.status(500).json({ success: false, error: 'Sitemap audit failed: ' + error.message });
  }
});

// =============================================================
// TOOL #9: HTTPS & SECURITY CHECK
// HTTPS, mixed content (http:// resources on https page), HSTS
// header, basic security header presence.
// =============================================================
router.post('/https', graderLimiter, async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ success: false, error: 'URL is required' });

    let normalizedUrl = url.replace(/\/$/, '');
    if (!normalizedUrl.startsWith('http')) normalizedUrl = 'https://' + normalizedUrl;

    console.log(`[HTTPS] ${normalizedUrl}`);

    const checks = [];
    let response;
    let html = '';
    try {
      response = await fetch(normalizedUrl, {
        signal: AbortSignal.timeout(15000),
        redirect: 'follow',
        headers: { 'User-Agent': 'RemodelyGrader/1.0' },
      });
      html = await response.text();
    } catch (err) {
      return res.status(400).json({ success: false, error: `Could not fetch: ${err.message}` });
    }

    const finalUrl = response.url;
    const isHttps = finalUrl.startsWith('https://');

    // 1. Site uses HTTPS
    checks.push({
      key: 'https',
      label: 'HTTPS enabled',
      pass: isHttps,
      detail: isHttps
        ? `Final URL: ${finalUrl}`
        : `Final URL is HTTP (${finalUrl}). Modern browsers warn users; AI crawlers deprioritize.`,
    });

    // 2. HTTP -> HTTPS redirect
    if (!normalizedUrl.startsWith('http://')) {
      try {
        const httpUrl = normalizedUrl.replace(/^https:/, 'http:');
        const r = await fetch(httpUrl, {
          signal: AbortSignal.timeout(8000),
          redirect: 'manual',
          headers: { 'User-Agent': 'RemodelyGrader/1.0' },
        });
        const location = r.headers.get('location') || '';
        const redirectsToHttps = location.startsWith('https://') || (r.status >= 300 && r.status < 400);
        checks.push({
          key: 'http_redirect',
          label: 'HTTP redirects to HTTPS',
          pass: redirectsToHttps,
          detail: redirectsToHttps
            ? `${httpUrl} returned ${r.status}${location ? ` -> ${location.slice(0, 60)}` : ''}`
            : `${httpUrl} did not redirect (status ${r.status}). Add a 301 redirect from HTTP to HTTPS.`,
        });
      } catch (_) {
        checks.push({
          key: 'http_redirect',
          label: 'HTTP redirects to HTTPS',
          pass: null,
          neutral: true,
          detail: 'Could not test HTTP redirect.',
        });
      }
    }

    // 3. HSTS header
    const hsts = response.headers.get('strict-transport-security');
    checks.push({
      key: 'hsts',
      label: 'Strict-Transport-Security (HSTS) header',
      pass: !!hsts,
      detail: hsts
        ? `Found: ${hsts}`
        : 'No HSTS header. Browsers will allow HTTP downgrades on first visit. Add Strict-Transport-Security: max-age=31536000; includeSubDomains.',
    });

    // 4. X-Content-Type-Options
    const xcto = response.headers.get('x-content-type-options');
    checks.push({
      key: 'xcto',
      label: 'X-Content-Type-Options: nosniff',
      pass: xcto === 'nosniff',
      detail: xcto === 'nosniff'
        ? 'Header set correctly.'
        : 'Missing or wrong. Prevents MIME sniffing exploits. Set to "nosniff".',
    });

    // 5. Referrer-Policy
    const refPol = response.headers.get('referrer-policy');
    checks.push({
      key: 'referrer_policy',
      label: 'Referrer-Policy header',
      pass: !!refPol,
      detail: refPol
        ? `Found: ${refPol}`
        : 'No Referrer-Policy. Add "strict-origin-when-cross-origin" or similar to control what gets sent to third parties.',
    });

    // 6. Mixed content — http:// resources in https page
    if (isHttps) {
      const mixedRefs = (html.match(/(src|href)=["']http:\/\/[^"']+["']/gi) || []).length;
      checks.push({
        key: 'mixed_content',
        label: 'No mixed content (http: resources)',
        pass: mixedRefs === 0,
        detail: mixedRefs === 0
          ? 'All in-page resources use https://.'
          : `Found ${mixedRefs} http:// references on an HTTPS page. Browsers may block these or downgrade the lock icon.`,
      });
    }

    // 7. Content-Security-Policy
    const csp = response.headers.get('content-security-policy');
    checks.push({
      key: 'csp',
      label: 'Content-Security-Policy header',
      pass: !!csp,
      neutral: false,
      detail: csp
        ? `Set (${csp.length} chars).`
        : 'No CSP. Optional but recommended — limits where scripts can load from to prevent XSS.',
    });

    // 8. Server header info disclosure
    const server = response.headers.get('server');
    const exposesVersion = server && /[\d.]+/.test(server);
    checks.push({
      key: 'server_header',
      label: 'Server header doesn\'t expose version',
      pass: !exposesVersion,
      detail: server
        ? exposesVersion
          ? `Server header reveals version: "${server}". Hide or generalize this in your web server config.`
          : `Server: "${server}" — generic, no version exposed.`
        : 'No Server header — good.',
    });

    const evaluable = checks.filter(c => c.pass !== null && !c.neutral);
    const passed = evaluable.filter(c => c.pass).length;
    const score = evaluable.length ? Math.round((passed / evaluable.length) * 100) : 0;

    let verdict;
    if (score >= 85)      verdict = 'Security headers and HTTPS are configured correctly.';
    else if (score >= 60) verdict = 'Basics covered, some hardening still to do.';
    else                  verdict = 'Multiple security gaps. Browsers and audits will flag these.';

    return res.json({
      success: true,
      url: finalUrl,
      domain: new URL(finalUrl).hostname,
      score,
      passed,
      total: evaluable.length,
      verdict,
      checks,
    });
  } catch (error) {
    console.error('HTTPS audit error:', error);
    return res.status(500).json({ success: false, error: 'HTTPS audit failed: ' + error.message });
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
// Quick Win playbook: maps a quick-win title to DIY fix instructions + a
// free official tool / guide link so the recipient can actually fix their
// own site without paying anyone. Match is case-insensitive starts-with.
const QUICK_WIN_PLAYBOOK = [
  { match: /meta description/i,
    how: 'In your page <head>, add: <code style="background:#0a0f1a;padding:2px 6px;border-radius:3px;color:#93c5fd;font-family:monospace">&lt;meta name="description" content="..."&gt;</code> with 150–160 characters describing the page.',
    link: 'https://moz.com/learn/seo/meta-description', linkText: 'Meta description guide (Moz)' },
  { match: /schema|structured data|localbusiness/i,
    how: 'Generate a free LocalBusiness JSON-LD block, then paste it inside the &lt;head&gt; of your homepage. Test with Google Rich Results Test.',
    link: 'https://technicalseo.com/tools/schema-markup-generator/', linkText: 'Schema Markup Generator (free)' },
  { match: /faq/i,
    how: 'Create a /faq page with at least 8 real customer questions. Wrap them in FAQPage JSON-LD schema so Google and AI crawlers index each Q&A.',
    link: 'https://developers.google.com/search/docs/appearance/structured-data/faqpage', linkText: 'FAQPage schema (Google)' },
  { match: /alt text|alt tag|image/i,
    how: 'Every &lt;img&gt; needs alt="describes the image" — describe what is in the image, not the filename. Skip alt only on purely decorative graphics.',
    link: 'https://www.w3.org/WAI/tutorials/images/decision-tree/', linkText: 'Alt text decision tree (W3C)' },
  { match: /social/i,
    how: 'Add visible links to your Facebook, Instagram, Google Business Profile, and LinkedIn in your site footer. Use rel="noopener" target="_blank".',
    link: 'https://support.google.com/business/answer/3038063', linkText: 'Set up Google Business Profile' },
  { match: /contact/i,
    how: 'In your footer (and /contact page), show phone, email, full street address, and hours in plain text — not just an image. Use itemprop or LocalBusiness schema for structured machine-readable data.',
    link: 'https://schema.org/PostalAddress', linkText: 'PostalAddress schema reference' },
  { match: /h1|heading/i,
    how: 'Each page should have exactly one &lt;h1&gt; near the top, written for the keyword you want to rank for + your brand. Demote any duplicate H1s to H2.',
    link: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide', linkText: 'Google SEO Starter Guide' },
  { match: /title/i,
    how: 'Each page &lt;title&gt; should be 50–60 characters, primary keyword first, brand at the end. Unique per page — never duplicate across the site.',
    link: 'https://moz.com/learn/seo/title-tag', linkText: 'Title tag guide (Moz)' },
  { match: /robots|sitemap/i,
    how: 'Publish /sitemap.xml listing every public URL with <lastmod> dates, and /robots.txt that allows crawling and points to the sitemap.',
    link: 'https://www.sitemaps.org/protocol.html', linkText: 'sitemaps.org spec' },
  { match: /llms\.txt|ai visibility|ai.txt/i,
    how: 'Publish a /llms.txt at the root of your site — a plain-text summary of your business AI tools (ChatGPT, Claude, Perplexity) can cite. See the spec for format.',
    link: 'https://llmstxt.org', linkText: 'llms.txt spec' },
  { match: /page speed|performance|lcp|loading/i,
    how: 'Run PageSpeed Insights on your site, then act on the top 3 lab-mode opportunities (typically: defer offscreen images, compress hero video, eliminate render-blocking CSS).',
    link: 'https://pagespeed.web.dev/', linkText: 'PageSpeed Insights (free)' },
  { match: /https|ssl|secure/i,
    how: 'Force HTTPS on every URL. If your host is Cloudflare, Render, Vercel, or similar, switch on "Always Use HTTPS" / "Force SSL" in dashboard settings. Then submit the HTTPS sitemap to Google Search Console.',
    link: 'https://web.dev/articles/why-https-matters', linkText: 'Why HTTPS matters (web.dev)' },
];

function findPlaybookEntry(title) {
  const t = String(title || '');
  for (const p of QUICK_WIN_PLAYBOOK) {
    if (p.match.test(t)) return p;
  }
  return null;
}

function buildScoreColor(score) {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#eab308';
  return '#ef4444';
}

router.post('/send-report', async (req, res) => {
  try {
    const { email, name, url, scores, phone, preferredTime, triggerCall, analysis } = req.body;

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
      issues: (analysis && analysis.issues) || scores.issues || []
    };

    const overallScore = scores.overall || 0;
    const aiScore = scores.ai_visibility || 0;
    const overallGrade = scores.overall_grade || 'N/A';
    const overallColor = buildScoreColor(overallScore);

    let scoreMessage = "Your site is hard for AI and Google to understand. The fixes below are mostly free and DIY.";
    if (overallScore >= 80) scoreMessage = "Strong foundation. The Quick Wins below take you from good to great.";
    else if (overallScore >= 60) scoreMessage = "Solid base with clear room to climb. Each Quick Win below is short and DIY.";

    const greeting = name && !['there', 'user', ''].includes(name.toLowerCase())
      ? `Hi ${name},`
      : "Hi there,";

    // Pull rich data; fall back to empty arrays if frontend didn't send it
    const issues = (analysis && Array.isArray(analysis.issues)) ? analysis.issues.slice(0, 6) : [];
    const recommendations = (analysis && Array.isArray(analysis.recommendations)) ? analysis.recommendations.slice(0, 6) : [];
    const quickWins = (analysis && Array.isArray(analysis.quickWins)) ? analysis.quickWins : [];
    const googleSignals = (analysis && analysis.googleSignals) || null;
    const tools = (analysis && analysis.tools) || {};

    // Build call-me link if phone provided
    const callMeLink = phone ?
      `https://remodely-backend.onrender.com/api/grader/call-me?id=${leadId}` : null;

    // ── Build HTML sections ─────────────────────────────────────────────
    const escape = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

    const quickWinsHtml = quickWins.length ? `
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:28px;margin-bottom:24px;">
      <div style="color:#c2410c;font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px;">Quick Wins — DIY Fixes</div>
      <h3 style="color:#0f172a;font-size:20px;margin:0 0 16px 0;">Fix these first. No developer needed.</h3>
      ${quickWins.map((qw, i) => {
        const pb = findPlaybookEntry(qw.title);
        return `
        <div style="border-top:1px solid #e2e8f0;padding:18px 0;">
          <div style="display:flex;align-items:flex-start;gap:12px;">
            <div style="flex-shrink:0;width:28px;height:28px;border-radius:8px;background:#ffedd5;color:#c2410c;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;">${i + 1}</div>
            <div style="flex:1;">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:6px;">
                <strong style="color:#0f172a;font-size:16px;">${escape(qw.title)}</strong>
                ${qw.time ? `<span style="background:#bbf7d0;color:#15803d;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;">${escape(qw.time)}</span>` : ''}
              </div>
              ${qw.desc ? `<p style="color:#64748b;margin:0 0 8px 0;font-size:14px;">${escape(qw.desc)}</p>` : ''}
              ${pb ? `
                <p style="color:#475569;margin:0 0 8px 0;font-size:14px;line-height:1.55;"><strong style="color:#0f172a;">How to fix:</strong> ${pb.how}</p>
                <a href="${escape(pb.link)}" style="color:#c2410c;text-decoration:none;font-size:13px;font-weight:600;">→ ${escape(pb.linkText)}</a>
              ` : ''}
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>` : '';

    const googleSignalsHtml = (() => {
      if (!googleSignals) return '';
      // Accept both the grader's native shape (core_web_vitals: performance_score/lcp_ms/...)
      // and the simpler {performance, lcp, cls, fcp} shape.
      const fmtMs = (ms) => ms == null ? null : (ms >= 1000 ? (ms / 1000).toFixed(1) + 's' : Math.round(ms) + 'ms');
      const card = (label, value, unit) => {
        if (value == null || value === '' || value === 'Unavailable') return '';
        return `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;text-align:center;"><div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">${label}</div><div style="color:#0f172a;font-size:18px;font-weight:700;">${escape(value)}${unit ? `<span style="font-size:12px;color:#64748b;font-weight:400;">${unit}</span>` : ''}</div></div>`;
      };
      const perf = googleSignals.performance ?? googleSignals.performance_score;
      const lcp = googleSignals.lcp ?? (googleSignals.lcp_ms != null ? fmtMs(googleSignals.lcp_ms) : null);
      const cls = googleSignals.cls != null ? (typeof googleSignals.cls === 'number' ? googleSignals.cls.toFixed(2) : googleSignals.cls) : null;
      const fcp = googleSignals.fcp ?? (googleSignals.fcp_ms != null ? fmtMs(googleSignals.fcp_ms) : null);
      const items = [
        card('Lighthouse', perf, '/100'),
        card('LCP', lcp, ''),
        card('CLS', cls, ''),
        card('FCP', fcp, ''),
      ].filter(Boolean).join('');
      if (!items) return '';
      return `
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;margin-bottom:24px;">
      <div style="color:#c2410c;font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px;">Google Signals</div>
      <h3 style="color:#0f172a;font-size:18px;margin:0 0 16px 0;">PageSpeed mobile field data</h3>
      <div style="display:table;width:100%;border-spacing:4px;">${items}</div>
    </div>`;
    })();

    const issuesHtml = issues.length ? `
    <div style="background:#ffffff;border:1px solid #fecaca;border-radius:16px;padding:24px;margin-bottom:24px;">
      <div style="color:#b91c1c;font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px;">Issues Detected</div>
      <h3 style="color:#0f172a;font-size:18px;margin:0 0 12px 0;">What's hurting your score</h3>
      <ul style="margin:0;padding:0;list-style:none;">
        ${issues.map(i => `<li style="color:#475569;padding:8px 0 8px 24px;border-bottom:1px solid #e2e8f0;font-size:14px;line-height:1.55;position:relative;"><span style="position:absolute;left:0;color:#b91c1c;">!</span>${escape(i)}</li>`).join('')}
      </ul>
    </div>` : '';

    const recsHtml = recommendations.length ? `
    <div style="background:#ffffff;border:1px solid #bbf7d0;border-radius:16px;padding:24px;margin-bottom:24px;">
      <div style="color:#15803d;font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px;">Recommendations</div>
      <h3 style="color:#0f172a;font-size:18px;margin:0 0 12px 0;">Bigger improvements once Quick Wins are done</h3>
      <ul style="margin:0;padding:0;list-style:none;">
        ${recommendations.map(r => `<li style="color:#475569;padding:8px 0 8px 24px;border-bottom:1px solid #e2e8f0;font-size:14px;line-height:1.55;position:relative;"><span style="position:absolute;left:0;color:#15803d;">+</span>${escape(r)}</li>`).join('')}
      </ul>
    </div>` : '';

    const toolsHtml = (() => {
      const t = tools || {};
      const links = [
        { url: t.rich_results, label: 'Test your structured data', tool: 'Google Rich Results Test' },
        { url: t.pagespeed, label: 'Re-run page speed', tool: 'PageSpeed Insights' },
        { url: t.mobile_friendly, label: 'Verify mobile-friendly', tool: 'Google Mobile-Friendly Test' },
        { url: t.safe_browsing, label: 'Check Safe Browsing status', tool: 'Google Safe Browsing' },
      ].filter(l => l.url);
      if (!links.length) return '';
      return `
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;margin-bottom:24px;">
      <div style="color:#c2410c;font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px;">Free Tools — Test Your Fixes</div>
      <h3 style="color:#0f172a;font-size:18px;margin:0 0 12px 0;">Use these to verify each change you make</h3>
      ${links.map(l => `<div style="padding:10px 0;border-bottom:1px solid #e2e8f0;"><a href="${escape(l.url)}" style="color:#c2410c;text-decoration:none;font-weight:600;font-size:14px;">→ ${escape(l.label)}</a><div style="color:#64748b;font-size:12px;margin-top:2px;">${escape(l.tool)}</div></div>`).join('')}
    </div>`;
    })();

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>Your AI Visibility Report</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f1f5f9;line-height:1.55;">
  <div style="max-width:640px;margin:0 auto;padding:32px 16px;">

    <div style="text-align:center;margin-bottom:28px;">
      <h1 style="color:#0f172a;font-size:24px;margin:0;font-weight:800;">REMODELY<span style="color:#c2410c;">.AI</span></h1>
      <p style="color:#64748b;font-size:13px;margin:6px 0 0 0;">AI Visibility &amp; SEO Report</p>
    </div>

    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;margin-bottom:24px;">
      <h2 style="color:#0f172a;font-size:20px;margin:0 0 8px 0;">${greeting}</h2>
      <p style="color:#64748b;margin:0 0 24px 0;font-size:14px;">Your report for <strong style="color:#0f172a;">${escape(url)}</strong></p>

      <div style="display:table;width:100%;border-spacing:6px;margin-bottom:20px;">
        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:18px;text-align:center;">
          <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Overall</div>
          <div style="font-size:38px;font-weight:800;color:${overallColor};line-height:1;">${overallScore}</div>
          <div style="display:inline-block;background:#f1f5f9;color:${overallColor};padding:2px 10px;border-radius:4px;font-size:12px;font-weight:700;margin-top:8px;">Grade: ${escape(overallGrade)}</div>
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px;text-align:center;">
          <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">AI Visibility</div>
          <div style="font-size:38px;font-weight:800;color:${buildScoreColor(aiScore)};line-height:1;">${aiScore}</div>
          <div style="color:#64748b;font-size:12px;margin-top:8px;">Out of 100</div>
        </div>
      </div>

      <p style="color:#475569;font-size:15px;margin:0;">${scoreMessage}</p>
    </div>

    ${quickWinsHtml}
    ${issuesHtml}
    ${recsHtml}
    ${googleSignalsHtml}
    ${toolsHtml}

    ${callMeLink ? `
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:24px;text-align:center;margin-bottom:16px;">
      <h3 style="color:#0f172a;font-size:16px;margin:0 0 8px 0;">Want a 2-minute walkthrough?</h3>
      <p style="color:#64748b;margin:0 0 16px 0;font-size:13px;">Aria (our AI) will call and explain exactly what to fix and in what order — no sales pitch.</p>
      <a href="${callMeLink}" style="display:inline-block;background:#ea580c;color:#ffffff;padding:13px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Call Me Now</a>
    </div>
    ` : ''}

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:18px;text-align:center;margin-bottom:16px;">
      <p style="color:#64748b;font-size:13px;margin:0 0 10px 0;">Stuck on any of these? Free 15-minute help, no upsell.</p>
      <a href="https://remodely.ai/#contact" style="display:inline-block;background:#15803d;color:#ffffff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Book Free Help Call</a>
    </div>

    <div style="text-align:center;color:#64748b;font-size:11px;margin-top:20px;line-height:1.7;">
      <p style="margin:0;">Remodely AI · <a href="https://remodely.ai" style="color:#c2410c;text-decoration:none;">remodely.ai</a></p>
      <p style="margin:4px 0 0 0;">Every fix in this report is something you can do yourself with the linked free tools. We get paid only if you ask us to do it for you.</p>
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

// =============================================================
// TOOL LEAD CAPTURE — POST /api/grader/tool-lead
// Wires the 9 standalone tools into the lead funnel. Visitor runs
// any tool, gets a result, then enters their email to receive a
// detailed report. We:
//   1. Store the lead in graderLeads (same Map used by send-report)
//   2. Email a deeper report via the existing transporter
//   3. Optionally trigger Aria to call them if they provided phone
//
// Body: { email, name?, phone?, tool, url, score?, summary? }
// =============================================================
router.post('/tool-lead', async (req, res) => {
  try {
    const { email, name, phone, tool, url, score, summary } = req.body || {};
    if (!email || !tool || !url) {
      return res.status(400).json({
        success: false,
        error: 'email, tool, and url are required',
      });
    }

    const leadId = `tool_${tool}_${Date.now()}`;
    const lead = {
      id: leadId,
      email,
      name: name || 'there',
      phone: phone || null,
      tool,           // 'compare' | 'ai-probe' | 'fix-it' | 'gbp' | 'schema' | 'mobile' | 'a11y' | 'sitemap' | 'https'
      url,            // the URL they audited
      score: score ?? null,
      summary: summary || null,
      source: `tool:${tool}`,
      createdAt: new Date().toISOString(),
    };
    graderLeads.set(leadId, lead);
    console.log(`[TOOL LEAD] ${tool}  ${email}  url=${url}  score=${score ?? 'n/a'}`);

    // Send a short ack email so the visitor sees something in their inbox.
    // Lead is ALREADY captured above — email is best-effort, don't 500 if SMTP
    // is unconfigured (was a ReferenceError on bare SMTP_USER which dropped
    // every tool-form lead).
    if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      const greeting = name && !['there', 'user', ''].includes(name.toLowerCase())
        ? `Hi ${name},` : 'Hi there,';
      const toolLabel = ({
        compare: 'Competitor Compare',
        'ai-probe': 'AI Assistant Probe',
        'fix-it': 'Code Snippet Fixer',
        gbp: 'GBP Audit',
        schema: 'Schema Validator',
        mobile: 'Mobile UX Check',
        a11y: 'Accessibility Check',
        sitemap: 'Sitemap & Robots Audit',
        https: 'HTTPS & Security Check',
      })[tool] || tool;

      const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#0a0f1a;line-height:1.55;color:#fff;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="text-align:center;margin-bottom:24px;">
      <h1 style="color:#fff;font-size:22px;margin:0;font-weight:800;">REMODELY<span style="color:#fb923c;">.AI</span></h1>
    </div>
    <div style="background:#131c2e;border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:28px;">
      <h2 style="color:#fff;font-size:18px;margin:0 0 8px 0;">${greeting}</h2>
      <p style="color:rgba(255,255,255,0.75);font-size:14px;margin:0 0 16px 0;">Thanks for running the <strong style="color:#fb923c;">${toolLabel}</strong> on <strong style="color:#fff;">${url}</strong>.</p>
      ${score != null ? `<div style="background:rgba(249,115,22,0.08);border:1px solid rgba(249,115,22,0.25);border-radius:10px;padding:18px;text-align:center;margin:16px 0;"><div style="font-size:11px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">YOUR SCORE</div><div style="font-size:36px;font-weight:800;color:#fb923c;line-height:1;">${score}<span style="font-size:14px;color:rgba(255,255,255,0.5);">/100</span></div></div>` : ''}
      ${summary ? `<p style="color:rgba(255,255,255,0.85);font-size:14px;line-height:1.6;margin:0 0 16px 0;">${summary}</p>` : ''}
      <p style="color:rgba(255,255,255,0.7);font-size:14px;line-height:1.6;margin:0 0 12px 0;">Want a deeper analysis? Run the full grader for the unified report covering every check at once.</p>
      <a href="https://www.remodely.ai/grader.html?url=${encodeURIComponent(url)}" style="display:inline-block;background:#f97316;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-top:8px;">Run the full grader →</a>
    </div>
    <div style="text-align:center;color:rgba(255,255,255,0.4);font-size:11px;margin-top:20px;">
      <p style="margin:0;">Remodely AI · <a href="https://www.remodely.ai" style="color:#fb923c;">remodely.ai</a></p>
    </div>
  </div>
</body></html>`;

      const text = `${greeting}\n\nThanks for running the ${toolLabel} on ${url}.\n\n${score != null ? `Your score: ${score}/100\n\n` : ''}${summary || ''}\n\nWant a deeper analysis? Run the full grader: https://www.remodely.ai/grader.html?url=${encodeURIComponent(url)}\n\n— Remodely AI`;

      transporter.sendMail({
        from: `"Remodely AI" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        to: email,
        subject: `Your ${toolLabel} result for ${url}`,
        html,
        text,
      }).catch((err) => console.error('Tool-lead email error:', err));
    }

    // Optionally trigger Aria callback if they gave a phone (fire-and-forget)
    if (phone && score != null && score < 70) {
      triggerAriaCall(leadId, name, phone, url, {
        overall: score,
        ai_visibility: score,
        issues: summary ? [summary] : [],
      }).catch((err) => console.error('Tool-lead auto-call failed:', err));
    }

    return res.json({
      success: true,
      leadId,
      message: 'Lead captured. Check your inbox for the report.',
    });
  } catch (error) {
    console.error('Tool-lead error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// =============================================================
// TOOL #10: SEO CHECKLIST — Comprehensive SEO/marketing setup scanner
// Detects which of the 20+ free tools and signals a contractor site
// has wired up. Categorized: Critical, Important, Nice-to-have.
// =============================================================
router.post('/seo-checklist', graderLimiter, async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ success: false, error: 'URL is required' });

    console.log(`[SEO-CHECKLIST] ${url}`);
    const grader = new WebsiteGrader(url);
    if (!(await grader.fetchPage())) {
      return res.status(400).json({ success: false, error: 'Could not fetch website' });
    }
    grader.checkStructuredData();

    const $ = grader.$;
    const html = grader.html || '';
    const lower = html.toLowerCase();
    const finalUrl = grader.url || url;

    const linkHrefs = [];
    $('a[href]').each((_, a) => linkHrefs.push(($(a).attr('href') || '').toLowerCase()));
    const scriptSrcs = [];
    $('script[src]').each((_, s) => scriptSrcs.push(($(s).attr('src') || '').toLowerCase()));
    const metaNames = {};
    $('meta[name]').each((_, m) => { metaNames[($(m).attr('name') || '').toLowerCase()] = $(m).attr('content') || ''; });
    const metaProps = {};
    $('meta[property]').each((_, m) => { metaProps[($(m).attr('property') || '').toLowerCase()] = $(m).attr('content') || ''; });

    const has = (re) => re.test(lower) || scriptSrcs.some(s => re.test(s)) || linkHrefs.some(h => re.test(h));
    const hasMeta = (name) => !!metaNames[name.toLowerCase()];
    const hasOG = (prop) => !!metaProps[prop.toLowerCase()];

    // ---- HEAD checks for sitemap/robots (parallel) ----
    const origin = (() => { try { return new URL(finalUrl).origin; } catch (_) { return null; } })();
    let sitemapStatus = false, robotsStatus = false, faviconStatus = false;
    if (origin) {
      const headOk = async (path) => {
        try {
          const r = await fetch(origin + path, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(4000) });
          return r.ok;
        } catch (_) { return false; }
      };
      [sitemapStatus, robotsStatus, faviconStatus] = await Promise.all([
        headOk('/sitemap.xml'),
        headOk('/robots.txt'),
        headOk('/favicon.ico'),
      ]);
    }

    const checks = [];
    const add = (tier, label, pass, detail, fixUrl) => checks.push({ tier, label, pass, detail, fixUrl });

    // ---- CRITICAL TIER ----
    add('critical',
      'HTTPS / SSL',
      finalUrl.startsWith('https://'),
      finalUrl.startsWith('https://')
        ? 'Site is served over HTTPS. Required by every modern crawler and browser.'
        : 'Site is on plain HTTP. Google treats this as untrusted and ranks it lower; Chrome shows a "Not Secure" warning.',
      'https://letsencrypt.org/'
    );

    add('critical',
      'Mobile viewport meta',
      hasMeta('viewport'),
      hasMeta('viewport')
        ? 'Has viewport meta — phones render the page correctly.'
        : 'Missing <meta name="viewport"> — mobile users see desktop layout shrunk to thumbnail size. Adds <meta name="viewport" content="width=device-width, initial-scale=1">.',
      null
    );

    add('critical',
      'Google Analytics 4 (or Tag Manager)',
      has(/googletagmanager\.com\/gtag\/js\?id=g-/i) || has(/googletagmanager\.com\/gtm\.js/i) || has(/gtag\(['"]config['"],\s*['"]g-/i),
      (has(/gtag/i) || has(/googletagmanager/i))
        ? 'GA4 / Google Tag Manager detected — you can see traffic and conversions.'
        : 'No analytics detected. Without GA4 you cannot tell which pages convert, where leads come from, or whether ad spend is working.',
      'https://analytics.google.com/'
    );

    add('critical',
      'Google Search Console verification',
      hasMeta('google-site-verification'),
      hasMeta('google-site-verification')
        ? 'GSC ownership verification meta tag present. (DNS-method verification is invisible to this scan but still valid.)'
        : 'No google-site-verification meta tag. You cannot submit sitemaps, request indexing, or see Google search performance until verified.',
      'https://search.google.com/search-console'
    );

    add('critical',
      'Bing Webmaster Tools verification',
      hasMeta('msvalidate.01'),
      hasMeta('msvalidate.01')
        ? 'Bing ownership verified — Bing/Yahoo/Copilot/ChatGPT search can index the site.'
        : 'No msvalidate.01 meta tag. Bing powers ~10% of US search plus most LLM-grounded answers (ChatGPT search, Copilot). Free to verify.',
      'https://www.bing.com/webmasters'
    );

    add('critical',
      'sitemap.xml accessible',
      sitemapStatus,
      sitemapStatus
        ? '/sitemap.xml returns 200 — search engines can discover all pages.'
        : 'No /sitemap.xml found. Without one, Google has to discover pages by crawling links and may miss deep pages entirely.',
      null
    );

    add('critical',
      'robots.txt accessible',
      robotsStatus,
      robotsStatus
        ? '/robots.txt returns 200 — crawlers know what they can and cannot fetch.'
        : 'No /robots.txt found. Crawlers will guess; you cannot block /admin or signal your sitemap location.',
      null
    );

    // ---- IMPORTANT TIER ----
    const localTypes = ['LocalBusiness', 'GeneralContractor', 'HomeAndConstructionBusiness',
      'ProfessionalService', 'Plumber', 'Electrician', 'HVACBusiness', 'RoofingContractor', 'Organization'];
    const hasOrgSchema = (grader.scores.schema_types || []).some(t => localTypes.includes(t));
    add('important',
      'Organization / LocalBusiness schema',
      hasOrgSchema,
      hasOrgSchema
        ? `JSON-LD schema present: ${(grader.scores.schema_types || []).filter(t => localTypes.includes(t)).join(', ')}`
        : 'No Organization or LocalBusiness JSON-LD. AI assistants (ChatGPT, Perplexity) read this to know what your business is and where it is.',
      'https://search.google.com/test/rich-results'
    );

    const hasGbpLink = linkHrefs.some(h => /g\.page|google\.com\/maps|business\.google\.com|maps\.app\.goo\.gl/.test(h));
    add('important',
      'Google Business Profile link',
      hasGbpLink,
      hasGbpLink
        ? 'Site links to your GBP listing — Google connects the two entities.'
        : 'No g.page / google.com/maps link found. Add one to your footer or contact page so Google ties the site to the listing.',
      'https://www.google.com/business/'
    );

    add('important',
      'Open Graph meta tags',
      hasOG('og:title') && hasOG('og:image'),
      (hasOG('og:title') && hasOG('og:image'))
        ? 'og:title + og:image present — link previews on iMessage, Slack, Facebook, LinkedIn show correctly.'
        : 'Missing og:title or og:image. When someone shares your URL in iMessage or Slack, the preview will be blank or wrong.',
      null
    );

    add('important',
      'Twitter Card meta',
      hasMeta('twitter:card'),
      hasMeta('twitter:card')
        ? 'twitter:card declared — proper preview on X/Twitter shares.'
        : 'No twitter:card meta. X/Twitter links render as plain text instead of rich cards.',
      null
    );

    add('important',
      'Canonical tag',
      $('link[rel="canonical"]').length > 0,
      $('link[rel="canonical"]').length > 0
        ? `Declared canonical: ${$('link[rel="canonical"]').attr('href')}`
        : 'No <link rel="canonical">. Google may treat ?utm=… and trailing-slash variants as duplicate pages, splitting ranking signals.',
      null
    );

    add('important',
      'Favicon',
      faviconStatus || $('link[rel*="icon"]').length > 0,
      (faviconStatus || $('link[rel*="icon"]').length > 0)
        ? 'Favicon detected — shows in browser tabs, bookmarks, and Google search results.'
        : 'No favicon. Browser tabs and Google SERPs show a blank icon — looks unfinished.',
      null
    );

    // ---- NICE-TO-HAVE TIER ----
    add('nice',
      'Google Tag Manager',
      has(/googletagmanager\.com\/gtm\.js/i),
      has(/googletagmanager\.com\/gtm\.js/i)
        ? 'GTM container loaded — you can manage pixels and tags without code changes.'
        : 'No GTM. Optional but recommended — lets you add Facebook Pixel, conversion tags, etc. without redeploying.',
      'https://tagmanager.google.com/'
    );

    add('nice',
      'YouTube channel link',
      linkHrefs.some(h => /youtube\.com\/(c\/|channel\/|@|user\/)/.test(h)),
      linkHrefs.some(h => /youtube\.com\/(c\/|channel\/|@|user\/)/.test(h))
        ? 'YouTube channel linked.'
        : 'No YouTube channel link. Google owns YouTube and weighs video heavily; even a few project walkthroughs help SEO.',
      null
    );

    add('nice',
      'Facebook Business page',
      linkHrefs.some(h => /facebook\.com\//.test(h) && !/sharer|share\.php/.test(h)),
      linkHrefs.some(h => /facebook\.com\//.test(h) && !/sharer/.test(h))
        ? 'Facebook profile linked.'
        : 'No Facebook page link. Citations across major social networks help local SEO.',
      null
    );

    add('nice',
      'Instagram profile',
      linkHrefs.some(h => /instagram\.com\//.test(h)),
      linkHrefs.some(h => /instagram\.com\//.test(h))
        ? 'Instagram profile linked.'
        : 'No Instagram link. Project photos belong on Instagram for both clients and SEO citations.',
      null
    );

    add('nice',
      'LinkedIn page',
      linkHrefs.some(h => /linkedin\.com\/(company|in)\//.test(h)),
      linkHrefs.some(h => /linkedin\.com\/(company|in)\//.test(h))
        ? 'LinkedIn profile linked.'
        : 'No LinkedIn link. Useful for commercial/B2B work and adds an authoritative citation.',
      null
    );

    add('nice',
      'Yelp listing',
      linkHrefs.some(h => /yelp\.com\/biz\//.test(h)),
      linkHrefs.some(h => /yelp\.com\/biz\//.test(h))
        ? 'Yelp link present.'
        : 'No Yelp listing link. Yelp powers Apple Maps + Siri results for "near me" queries.',
      'https://biz.yelp.com/'
    );

    add('nice',
      'Houzz Pro',
      linkHrefs.some(h => /houzz\.com\/pro\//.test(h) || /houzz\.com\/professionals/.test(h)),
      linkHrefs.some(h => /houzz\.com\/(pro|professionals)/.test(h))
        ? 'Houzz Pro linked — high-intent remodeling traffic.'
        : 'No Houzz link. For remodeling/kitchens/baths, Houzz is where homeowners actually shop. Free profile.',
      'https://www.houzz.com/pro'
    );

    add('nice',
      'Angi / HomeAdvisor',
      linkHrefs.some(h => /angi\.com|homeadvisor\.com/.test(h)),
      linkHrefs.some(h => /angi\.com|homeadvisor\.com/.test(h))
        ? 'Angi/HomeAdvisor profile linked.'
        : 'No Angi or HomeAdvisor citation. They rank in their own SERPs and feed lead networks.',
      'https://www.angi.com/'
    );

    add('nice',
      'Nextdoor for Business',
      linkHrefs.some(h => /nextdoor\.com\/(pages|profile)/.test(h)),
      linkHrefs.some(h => /nextdoor\.com/.test(h))
        ? 'Nextdoor Business linked — neighbor word-of-mouth.'
        : 'No Nextdoor presence. Free; the highest-trust local-recommendation platform.',
      'https://business.nextdoor.com/'
    );

    add('nice',
      'BBB profile',
      linkHrefs.some(h => /bbb\.org\/.+\/(profile|business)/.test(h)),
      linkHrefs.some(h => /bbb\.org/.test(h))
        ? 'BBB profile linked.'
        : 'No BBB citation. Older homeowners still check BBB; counts as a trust signal for AI summaries.',
      'https://www.bbb.org/get-accredited'
    );

    add('nice',
      'Apple Maps Connect',
      // Indirect signal: Yelp + GBP + sameAs covers it; flag as TODO if no sameAs
      linkHrefs.some(h => /maps\.apple\.com|appleid\.apple\.com\/maps/.test(h)),
      linkHrefs.some(h => /maps\.apple\.com/.test(h))
        ? 'Apple Maps link found.'
        : 'No Apple Maps presence detected. Free at mapsconnect.apple.com — covers iPhone Siri + Apple Maps "near me" results.',
      'https://mapsconnect.apple.com/'
    );

    add('nice',
      'FAQ schema',
      (grader.scores.schema_types || []).includes('FAQPage'),
      (grader.scores.schema_types || []).includes('FAQPage')
        ? 'FAQPage schema present — eligible for FAQ rich results in SERPs.'
        : 'No FAQPage schema. Adds "expandable FAQs" directly under your search result — major CTR boost.',
      'https://search.google.com/test/rich-results'
    );

    // ---- Score by tier ----
    const tierStats = (tier) => {
      const items = checks.filter(c => c.tier === tier);
      const passed = items.filter(c => c.pass).length;
      return { tier, passed, total: items.length, score: items.length ? Math.round((passed / items.length) * 100) : 0 };
    };

    const critical = tierStats('critical');
    const important = tierStats('important');
    const nice = tierStats('nice');

    // Overall: critical weighted 50%, important 30%, nice 20%
    const overall = Math.round(
      (critical.score * 0.5) + (important.score * 0.3) + (nice.score * 0.2)
    );

    let verdict;
    if (overall >= 85)      verdict = 'Strong setup. Most contractors do not get this far. Now focus on content + backlinks.';
    else if (overall >= 60) verdict = 'Decent foundation but the gaps below are leaving traffic on the table.';
    else if (overall >= 35) verdict = 'You are running a website with the marketing infrastructure half-installed. The fixes below take an afternoon.';
    else                    verdict = 'Almost none of the free distribution is wired up. Search engines and AI assistants barely know you exist.';

    return res.json({
      success: true,
      url: finalUrl,
      domain: grader.domain,
      score: overall,
      verdict,
      tiers: { critical, important, nice },
      checks,
    });
  } catch (error) {
    console.error('SEO checklist error:', error);
    return res.status(500).json({ success: false, error: 'Checklist failed: ' + error.message });
  }
});

export default router;
