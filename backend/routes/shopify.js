/**
 * Shopify Routes - OAuth and API proxy
 */

import express from 'express';
import crypto from 'crypto';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// In-memory state storage (use Redis in production)
const pendingStates = new Map();

/**
 * GET /api/shopify/auth/url
 * Get OAuth URL for connecting Shopify store
 */
router.get('/auth/url', protect, async (req, res) => {
  try {
    const { shop } = req.query;

    if (!shop) {
      return res.status(400).json({ error: 'Shop domain is required' });
    }

    const clientId = process.env.SHOPIFY_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: 'Shopify not configured' });
    }

    // Normalize shop domain
    const normalizedShop = shop
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\.myshopify\.com$/, '')
      .trim();

    // Generate state for CSRF protection
    const state = crypto.randomBytes(16).toString('hex');

    // Store state with user ID (expires in 10 minutes)
    pendingStates.set(state, {
      userId: req.user.userId,
      shop: normalizedShop,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    // Build OAuth URL
    const redirectUri = `${process.env.API_URL || 'https://remodely-backend.onrender.com'}/api/shopify/auth/callback`;
    const scopes = 'read_products,write_products,read_orders,read_customers';

    const authUrl = `https://${normalizedShop}.myshopify.com/admin/oauth/authorize?` +
      `client_id=${clientId}&` +
      `scope=${scopes}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${state}`;

    res.json({
      success: true,
      url: authUrl,
      shop: `${normalizedShop}.myshopify.com`,
    });
  } catch (error) {
    console.error('Shopify auth URL error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/shopify/auth/callback
 * OAuth callback from Shopify
 */
router.get('/auth/callback', async (req, res) => {
  try {
    const { code, shop, state, hmac } = req.query;

    if (!code || !shop || !state) {
      return res.status(400).send(errorHtml('Missing required parameters'));
    }

    // Verify state
    const pendingState = pendingStates.get(state);
    if (!pendingState || Date.now() > pendingState.expiresAt) {
      pendingStates.delete(state);
      return res.status(400).send(errorHtml('Invalid or expired state. Please try again.'));
    }

    const userId = pendingState.userId;
    pendingStates.delete(state);

    // Exchange code for access token
    const clientId = process.env.SHOPIFY_CLIENT_ID;
    const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Token exchange failed:', tokenData);
      return res.status(400).send(errorHtml('Failed to get access token'));
    }

    // Get shop info
    const shopResponse = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': tokenData.access_token,
      },
    });

    const shopData = await shopResponse.json();
    const storeName = shopData.shop?.name || shop;

    // Save to user
    await User.findByIdAndUpdate(userId, {
      shopify: {
        connected: true,
        storeDomain: shop,
        accessToken: tokenData.access_token,
        scope: tokenData.scope,
        storeName,
        connectedAt: new Date(),
      },
    });

    res.send(successHtml(storeName));
  } catch (error) {
    console.error('Shopify callback error:', error);
    res.status(500).send(errorHtml(error.message));
  }
});

/**
 * GET /api/shopify/status
 * Get Shopify connection status
 */
router.get('/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user || !user.shopify?.connected) {
      return res.json({
        success: true,
        connected: false,
      });
    }

    res.json({
      success: true,
      connected: true,
      store: {
        name: user.shopify.storeName,
        domain: user.shopify.storeDomain,
        connectedAt: user.shopify.connectedAt,
      },
    });
  } catch (error) {
    console.error('Shopify status error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/shopify/disconnect
 * Disconnect Shopify store
 */
router.post('/disconnect', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.userId, {
      $unset: { shopify: 1 },
    });

    res.json({ success: true, message: 'Disconnected from Shopify' });
  } catch (error) {
    console.error('Shopify disconnect error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/shopify/products
 * Get products from connected store
 */
router.get('/products', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user?.shopify?.connected) {
      return res.status(400).json({ error: 'Shopify not connected' });
    }

    const { limit = 50 } = req.query;

    const response = await fetch(
      `https://${user.shopify.storeDomain}/admin/api/2024-01/products.json?limit=${limit}`,
      {
        headers: {
          'X-Shopify-Access-Token': user.shopify.accessToken,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errors || 'Failed to fetch products');
    }

    res.json({
      success: true,
      products: data.products || [],
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: error.message });
  }
});

// HTML templates for OAuth callback
const successHtml = (storeName) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Shopify Connected</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 40px;
      background: rgba(255,255,255,0.1);
      border-radius: 20px;
      backdrop-filter: blur(10px);
      max-width: 400px;
      margin: 20px;
    }
    .success-icon { font-size: 64px; margin-bottom: 20px; }
    h1 { margin: 0 0 10px 0; font-size: 24px; }
    p { margin: 10px 0; opacity: 0.9; }
    .store-name { font-weight: bold; color: #4ade80; }
    .instruction {
      margin-top: 30px;
      padding: 15px;
      background: rgba(255,255,255,0.1);
      border-radius: 10px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="success-icon">✓</div>
    <h1>Shopify Connected!</h1>
    <p>Your store <span class="store-name">${storeName}</span> is now connected.</p>
    <div class="instruction">
      You can close this window and return to the Remodely app.
    </div>
  </div>
</body>
</html>
`;

const errorHtml = (message) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Connection Failed</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 40px;
      background: rgba(255,255,255,0.1);
      border-radius: 20px;
      backdrop-filter: blur(10px);
      max-width: 400px;
      margin: 20px;
    }
    .error-icon { font-size: 64px; margin-bottom: 20px; }
    h1 { margin: 0 0 10px 0; font-size: 24px; }
    p { margin: 10px 0; opacity: 0.9; }
    .error-msg { font-size: 12px; opacity: 0.7; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="error-icon">✕</div>
    <h1>Connection Failed</h1>
    <p>We couldn't connect your Shopify store.</p>
    <p class="error-msg">${message}</p>
    <p>Please close this window and try again.</p>
  </div>
</body>
</html>
`;

export default router;
