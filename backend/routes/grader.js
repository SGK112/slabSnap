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
    <div style="background:#131c2e;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:28px;margin-bottom:24px;">
      <div style="color:#3b82f6;font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px;">Quick Wins — DIY Fixes</div>
      <h3 style="color:#fff;font-size:20px;margin:0 0 16px 0;">Fix these first. No developer needed.</h3>
      ${quickWins.map((qw, i) => {
        const pb = findPlaybookEntry(qw.title);
        return `
        <div style="border-top:1px solid rgba(255,255,255,0.08);padding:18px 0;">
          <div style="display:flex;align-items:flex-start;gap:12px;">
            <div style="flex-shrink:0;width:28px;height:28px;border-radius:8px;background:rgba(59,130,246,0.15);color:#60a5fa;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;">${i + 1}</div>
            <div style="flex:1;">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:6px;">
                <strong style="color:#fff;font-size:16px;">${escape(qw.title)}</strong>
                ${qw.time ? `<span style="background:rgba(34,197,94,0.15);color:#4ade80;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;">${escape(qw.time)}</span>` : ''}
              </div>
              ${qw.desc ? `<p style="color:#9ca3af;margin:0 0 8px 0;font-size:14px;">${escape(qw.desc)}</p>` : ''}
              ${pb ? `
                <p style="color:#cbd5e1;margin:0 0 8px 0;font-size:14px;line-height:1.55;"><strong style="color:#fff;">How to fix:</strong> ${pb.how}</p>
                <a href="${escape(pb.link)}" style="color:#60a5fa;text-decoration:none;font-size:13px;font-weight:600;">→ ${escape(pb.linkText)}</a>
              ` : ''}
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>` : '';

    const googleSignalsHtml = (() => {
      if (!googleSignals) return '';
      const fmt = (k, label, unit) => {
        const v = googleSignals[k];
        if (v == null || v === '' || v === 'Unavailable') return '';
        return `<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:12px;text-align:center;"><div style="color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">${label}</div><div style="color:#fff;font-size:18px;font-weight:700;">${escape(v)}${unit ? `<span style="font-size:12px;color:#9ca3af;font-weight:400;">${unit}</span>` : ''}</div></div>`;
      };
      const items = [
        fmt('performance', 'Lighthouse', '/100'),
        fmt('lcp', 'LCP', ''),
        fmt('cls', 'CLS', ''),
        fmt('fcp', 'FCP', ''),
      ].filter(Boolean).join('');
      if (!items) return '';
      return `
    <div style="background:#131c2e;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:24px;margin-bottom:24px;">
      <div style="color:#3b82f6;font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px;">Google Signals</div>
      <h3 style="color:#fff;font-size:18px;margin:0 0 16px 0;">PageSpeed mobile field data</h3>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;">${items}</div>
    </div>`;
    })();

    const issuesHtml = issues.length ? `
    <div style="background:#131c2e;border:1px solid rgba(239,68,68,0.25);border-radius:16px;padding:24px;margin-bottom:24px;">
      <div style="color:#ef4444;font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px;">Issues Detected</div>
      <h3 style="color:#fff;font-size:18px;margin:0 0 12px 0;">What's hurting your score</h3>
      <ul style="margin:0;padding:0;list-style:none;">
        ${issues.map(i => `<li style="color:#cbd5e1;padding:8px 0 8px 24px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:14px;line-height:1.55;position:relative;"><span style="position:absolute;left:0;color:#ef4444;">!</span>${escape(i)}</li>`).join('')}
      </ul>
    </div>` : '';

    const recsHtml = recommendations.length ? `
    <div style="background:#131c2e;border:1px solid rgba(34,197,94,0.25);border-radius:16px;padding:24px;margin-bottom:24px;">
      <div style="color:#22c55e;font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px;">Recommendations</div>
      <h3 style="color:#fff;font-size:18px;margin:0 0 12px 0;">Bigger improvements once Quick Wins are done</h3>
      <ul style="margin:0;padding:0;list-style:none;">
        ${recommendations.map(r => `<li style="color:#cbd5e1;padding:8px 0 8px 24px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:14px;line-height:1.55;position:relative;"><span style="position:absolute;left:0;color:#22c55e;">+</span>${escape(r)}</li>`).join('')}
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
    <div style="background:#131c2e;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:24px;margin-bottom:24px;">
      <div style="color:#3b82f6;font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px;">Free Tools — Test Your Fixes</div>
      <h3 style="color:#fff;font-size:18px;margin:0 0 12px 0;">Use these to verify each change you make</h3>
      ${links.map(l => `<div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);"><a href="${escape(l.url)}" style="color:#60a5fa;text-decoration:none;font-weight:600;font-size:14px;">→ ${escape(l.label)}</a><div style="color:#9ca3af;font-size:12px;margin-top:2px;">${escape(l.tool)}</div></div>`).join('')}
    </div>`;
    })();

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Your AI Visibility Report</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#0a0f1a;line-height:1.55;">
  <div style="max-width:640px;margin:0 auto;padding:32px 16px;">

    <div style="text-align:center;margin-bottom:28px;">
      <h1 style="color:#fff;font-size:24px;margin:0;font-weight:800;">REMODELY<span style="color:#3b82f6;">.AI</span></h1>
      <p style="color:#6b7280;font-size:13px;margin:6px 0 0 0;">AI Visibility &amp; SEO Report</p>
    </div>

    <div style="background:#131c2e;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:32px;margin-bottom:24px;">
      <h2 style="color:#fff;font-size:20px;margin:0 0 8px 0;">${greeting}</h2>
      <p style="color:#9ca3af;margin:0 0 24px 0;font-size:14px;">Your report for <strong style="color:#fff;">${escape(url)}</strong></p>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
        <div style="background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.18);border-radius:10px;padding:18px;text-align:center;">
          <div style="color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Overall</div>
          <div style="font-size:38px;font-weight:800;color:${overallColor};line-height:1;">${overallScore}</div>
          <div style="display:inline-block;background:${overallColor}20;color:${overallColor};padding:2px 10px;border-radius:4px;font-size:12px;font-weight:700;margin-top:8px;">Grade: ${escape(overallGrade)}</div>
        </div>
        <div style="background:rgba(168,85,247,0.08);border:1px solid rgba(168,85,247,0.18);border-radius:10px;padding:18px;text-align:center;">
          <div style="color:#9ca3af;font-size:11px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">AI Visibility</div>
          <div style="font-size:38px;font-weight:800;color:${buildScoreColor(aiScore)};line-height:1;">${aiScore}</div>
          <div style="color:#9ca3af;font-size:12px;margin-top:8px;">Out of 100</div>
        </div>
      </div>

      <p style="color:#cbd5e1;font-size:15px;margin:0;">${scoreMessage}</p>
    </div>

    ${quickWinsHtml}
    ${issuesHtml}
    ${recsHtml}
    ${googleSignalsHtml}
    ${toolsHtml}

    ${callMeLink ? `
    <div style="background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);border-radius:12px;padding:24px;text-align:center;margin-bottom:16px;">
      <h3 style="color:#fff;font-size:16px;margin:0 0 8px 0;">Want a 2-minute walkthrough?</h3>
      <p style="color:#9ca3af;margin:0 0 16px 0;font-size:13px;">Aria (our AI) will call and explain exactly what to fix and in what order — no sales pitch.</p>
      <a href="${callMeLink}" style="display:inline-block;background:#3b82f6;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Call Me Now</a>
    </div>
    ` : ''}

    <div style="background:rgba(34,197,94,0.05);border:1px solid rgba(34,197,94,0.15);border-radius:12px;padding:18px;text-align:center;margin-bottom:16px;">
      <p style="color:#9ca3af;font-size:13px;margin:0 0 10px 0;">Stuck on any of these? Free 15-minute help, no upsell.</p>
      <a href="https://remodely.ai/#contact" style="display:inline-block;background:transparent;color:#22c55e;border:1px solid #22c55e;padding:8px 16px;border-radius:6px;text-decoration:none;font-weight:600;font-size:13px;">Book Free Help Call</a>
    </div>

    <div style="text-align:center;color:#6b7280;font-size:11px;margin-top:20px;line-height:1.7;">
      <p style="margin:0;">Remodely AI · <a href="https://remodely.ai" style="color:#3b82f6;text-decoration:none;">remodely.ai</a></p>
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

export default router;
