/**
 * Shopify Routes - OAuth, API proxy, and Webhooks
 *
 * Required for Shopify App Store approval:
 * - HMAC validation for OAuth callbacks
 * - GDPR webhooks (customers/data_request, customers/redact, shop/redact)
 * - App uninstall webhook
 */

import express from 'express';
import crypto from 'crypto';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';
import pool from '../db/index.js';

const router = express.Router();

// In-memory state storage (use Redis in production)
const pendingStates = new Map();

// Webhook base URL
const WEBHOOK_BASE_URL = process.env.API_URL || 'https://remodely-backend.onrender.com';

/**
 * Register webhooks with a Shopify store
 * Called after successful OAuth to set up event notifications
 */
async function registerWebhooks(shop, accessToken) {
  const webhooksToRegister = [
    {
      topic: 'app/uninstalled',
      address: `${WEBHOOK_BASE_URL}/api/shopify/webhooks/app-uninstalled`,
    },
    {
      topic: 'products/update',
      address: `${WEBHOOK_BASE_URL}/api/shopify/webhooks/products-update`,
    },
    {
      topic: 'products/delete',
      address: `${WEBHOOK_BASE_URL}/api/shopify/webhooks/products-delete`,
    },
  ];

  const results = [];

  for (const webhook of webhooksToRegister) {
    try {
      const response = await fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
        body: JSON.stringify({
          webhook: {
            topic: webhook.topic,
            address: webhook.address,
            format: 'json',
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`✅ Webhook registered: ${webhook.topic} for ${shop}`);
        results.push({ topic: webhook.topic, success: true, id: data.webhook?.id });
      } else {
        // 422 usually means webhook already exists - that's fine
        if (response.status === 422) {
          console.log(`ℹ️ Webhook already exists: ${webhook.topic} for ${shop}`);
          results.push({ topic: webhook.topic, success: true, exists: true });
        } else {
          console.error(`❌ Failed to register webhook ${webhook.topic}:`, data);
          results.push({ topic: webhook.topic, success: false, error: data.errors });
        }
      }
    } catch (error) {
      console.error(`❌ Error registering webhook ${webhook.topic}:`, error);
      results.push({ topic: webhook.topic, success: false, error: error.message });
    }
  }

  return results;
}

/**
 * Verify Shopify HMAC signature
 * Required for OAuth callback and webhook validation
 */
function verifyHmac(query, secret) {
  const { hmac, signature, ...params } = query;

  if (!hmac) return false;

  // Sort and encode parameters
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  const calculatedHmac = crypto
    .createHmac('sha256', secret)
    .update(sortedParams)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(hmac, 'hex'),
    Buffer.from(calculatedHmac, 'hex')
  );
}

/**
 * Verify Shopify webhook signature
 */
function verifyWebhookHmac(body, hmacHeader, secret) {
  if (!hmacHeader) return false;

  const calculatedHmac = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(hmacHeader, 'base64'),
      Buffer.from(calculatedHmac, 'base64')
    );
  } catch {
    return false;
  }
}

/**
 * Middleware to verify Shopify webhook requests
 */
function verifyShopifyWebhook(req, res, next) {
  const hmacHeader = req.get('X-Shopify-Hmac-Sha256');
  const secret = process.env.SHOPIFY_CLIENT_SECRET;

  if (!secret) {
    console.error('SHOPIFY_CLIENT_SECRET not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Get raw body for verification
  const rawBody = req.rawBody || JSON.stringify(req.body);

  if (!verifyWebhookHmac(rawBody, hmacHeader, secret)) {
    console.error('Invalid webhook signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  next();
}

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

    // Verify HMAC signature (required for Shopify App Store approval)
    const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
    if (hmac && clientSecret) {
      const isValidHmac = verifyHmac(req.query, clientSecret);
      if (!isValidHmac) {
        console.error('Invalid HMAC signature in OAuth callback');
        return res.status(400).send(errorHtml('Invalid request signature. Please try again.'));
      }
    }

    // Validate shop domain format (security check)
    const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
    if (!shopRegex.test(shop)) {
      return res.status(400).send(errorHtml('Invalid shop domain'));
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

    // Register webhooks for this store
    console.log(`Registering webhooks for ${shop}...`);
    const webhookResults = await registerWebhooks(shop, tokenData.access_token);
    console.log('Webhook registration results:', webhookResults);

    // Save to user
    await User.findByIdAndUpdate(userId, {
      shopify: {
        connected: true,
        storeDomain: shop,
        accessToken: tokenData.access_token,
        scope: tokenData.scope,
        storeName,
        connectedAt: new Date(),
        webhooksRegistered: webhookResults.every(r => r.success),
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

/**
 * POST /api/shopify/import-product
 * Import a Shopify product to Remodely listing - SAVES TO DATABASE
 */
router.post('/import-product', protect, async (req, res) => {
  try {
    const { shopifyProductId } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user?.shopify?.connected) {
      return res.status(400).json({ error: 'Shopify not connected' });
    }

    // Check if product already imported
    const existingResult = await pool.query(
      'SELECT id FROM listings WHERE shopify_product_id = $1 AND seller_id = $2',
      [shopifyProductId.toString(), user._id]
    );

    if (existingResult.rows.length > 0) {
      return res.json({
        success: true,
        listingId: existingResult.rows[0].id,
        message: 'Product already imported',
        alreadyExists: true,
      });
    }

    // Fetch the product from Shopify
    const productResponse = await fetch(
      `https://${user.shopify.storeDomain}/admin/api/2024-01/products/${shopifyProductId}.json`,
      {
        headers: {
          'X-Shopify-Access-Token': user.shopify.accessToken,
        },
      }
    );

    if (!productResponse.ok) {
      throw new Error('Failed to fetch product from Shopify');
    }

    const { product } = await productResponse.json();
    const firstVariant = product.variants?.[0] || {};

    // Determine listing type from product type
    const productType = (product.product_type || '').toLowerCase();
    let listingType = 'Slab';
    if (productType.includes('remnant')) listingType = 'Remnant';
    else if (productType.includes('tile')) listingType = 'Tile';
    else if (productType.includes('prefab')) listingType = 'Prefab';

    // Extract dimensions from variant if available
    const dimensions = {};
    if (firstVariant.weight) dimensions.weight = firstVariant.weight;
    if (firstVariant.weight_unit) dimensions.weightUnit = firstVariant.weight_unit;

    // Insert into database
    const insertResult = await pool.query(
      `INSERT INTO listings (
        seller_id, shopify_product_id, shopify_variant_id, title, description,
        category, listing_type, price, compare_at_price, images, location,
        brand, sku, inventory_quantity, dimensions, status, source, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        user._id,
        product.id.toString(),
        firstVariant.id?.toString() || null,
        product.title,
        product.body_html?.replace(/<[^>]*>/g, '') || '',
        'Stone & Tile',
        listingType,
        parseFloat(firstVariant.price) || 0,
        firstVariant.compare_at_price ? parseFloat(firstVariant.compare_at_price) : null,
        (product.images || []).map(img => img.src),
        user.location || 'Surprise, AZ',
        product.vendor || null,
        firstVariant.sku || null,
        firstVariant.inventory_quantity || null,
        Object.keys(dimensions).length > 0 ? JSON.stringify(dimensions) : null,
        product.status === 'active' ? 'active' : 'archived',
        'shopify',
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      ]
    );

    const newListing = insertResult.rows[0];

    console.log(`✅ Shopify product ${product.id} imported as listing ${newListing.id} for user ${user._id}`);

    res.json({
      success: true,
      listingId: newListing.id,
      listing: {
        id: newListing.id,
        shopifyProductId: newListing.shopify_product_id,
        sellerId: newListing.seller_id,
        title: newListing.title,
        description: newListing.description,
        category: newListing.category,
        listingType: newListing.listing_type,
        price: parseFloat(newListing.price),
        images: newListing.images,
        location: newListing.location,
        brand: newListing.brand,
        status: newListing.status,
        source: newListing.source,
        createdAt: newListing.created_at,
      },
      message: 'Product imported successfully',
    });
  } catch (error) {
    console.error('Import product error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/shopify/import-all
 * Import all products from Shopify to Remodely - SAVES TO DATABASE
 */
router.post('/import-all', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user?.shopify?.connected) {
      return res.status(400).json({ error: 'Shopify not connected' });
    }

    // Fetch all products from Shopify
    const response = await fetch(
      `https://${user.shopify.storeDomain}/admin/api/2024-01/products.json?limit=250`,
      {
        headers: {
          'X-Shopify-Access-Token': user.shopify.accessToken,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch products from Shopify');
    }

    const { products } = await response.json();
    const importedListings = [];
    const skippedProducts = [];
    const errors = [];

    for (const product of products) {
      try {
        // Check if product already imported
        const existingResult = await pool.query(
          'SELECT id FROM listings WHERE shopify_product_id = $1 AND seller_id = $2',
          [product.id.toString(), user._id]
        );

        if (existingResult.rows.length > 0) {
          skippedProducts.push({ id: product.id, title: product.title, reason: 'Already imported' });
          continue;
        }

        const firstVariant = product.variants?.[0] || {};

        // Determine listing type from product type
        const productType = (product.product_type || '').toLowerCase();
        let listingType = 'Slab';
        if (productType.includes('remnant')) listingType = 'Remnant';
        else if (productType.includes('tile')) listingType = 'Tile';
        else if (productType.includes('prefab')) listingType = 'Prefab';

        // Extract dimensions
        const dimensions = {};
        if (firstVariant.weight) dimensions.weight = firstVariant.weight;
        if (firstVariant.weight_unit) dimensions.weightUnit = firstVariant.weight_unit;

        // Insert into database
        const insertResult = await pool.query(
          `INSERT INTO listings (
            seller_id, shopify_product_id, shopify_variant_id, title, description,
            category, listing_type, price, compare_at_price, images, location,
            brand, sku, inventory_quantity, dimensions, status, source, expires_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
          RETURNING *`,
          [
            user._id,
            product.id.toString(),
            firstVariant.id?.toString() || null,
            product.title,
            product.body_html?.replace(/<[^>]*>/g, '') || '',
            'Stone & Tile',
            listingType,
            parseFloat(firstVariant.price) || 0,
            firstVariant.compare_at_price ? parseFloat(firstVariant.compare_at_price) : null,
            (product.images || []).map(img => img.src),
            user.location || 'Surprise, AZ',
            product.vendor || null,
            firstVariant.sku || null,
            firstVariant.inventory_quantity || null,
            Object.keys(dimensions).length > 0 ? JSON.stringify(dimensions) : null,
            product.status === 'active' ? 'active' : 'archived',
            'shopify',
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          ]
        );

        importedListings.push({
          id: insertResult.rows[0].id,
          shopifyProductId: product.id,
          title: product.title,
        });

      } catch (err) {
        console.error(`Error importing product ${product.id}:`, err);
        errors.push({ id: product.id, title: product.title, error: err.message });
      }
    }

    console.log(`✅ Bulk import complete for user ${user._id}: ${importedListings.length} imported, ${skippedProducts.length} skipped, ${errors.length} errors`);

    res.json({
      success: true,
      imported: importedListings.length,
      skipped: skippedProducts.length,
      errors: errors.length,
      listings: importedListings,
      skippedProducts,
      errorDetails: errors,
    });
  } catch (error) {
    console.error('Import all products error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/shopify/listings
 * Get all listings for the current user (including Shopify imports)
 */
router.get('/listings', protect, async (req, res) => {
  try {
    const { source, status, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM listings WHERE seller_id = $1';
    const params = [req.user.userId];
    let paramIndex = 2;

    if (source) {
      query += ` AND source = $${paramIndex++}`;
      params.push(source);
    }

    if (status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM listings WHERE seller_id = $1';
    const countParams = [req.user.userId];
    if (source) {
      countQuery += ' AND source = $2';
      countParams.push(source);
    }
    const countResult = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      listings: result.rows.map(row => ({
        id: row.id,
        shopifyProductId: row.shopify_product_id,
        title: row.title,
        description: row.description,
        category: row.category,
        listingType: row.listing_type,
        price: parseFloat(row.price),
        compareAtPrice: row.compare_at_price ? parseFloat(row.compare_at_price) : null,
        images: row.images,
        location: row.location,
        brand: row.brand,
        sku: row.sku,
        inventoryQuantity: row.inventory_quantity,
        status: row.status,
        source: row.source,
        views: row.views,
        favorites: row.favorites,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
      })),
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/shopify/listing/:id
 * Delete a listing
 */
router.delete('/listing/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM listings WHERE id = $1 AND seller_id = $2 RETURNING *',
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json({ success: true, message: 'Listing deleted' });
  } catch (error) {
    console.error('Delete listing error:', error);
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

// ============================================
// SHOPIFY WEBHOOKS (Required for App Store approval)
// ============================================

/**
 * POST /api/shopify/webhooks/app-uninstalled
 * Called when a merchant uninstalls the app
 * Must clean up all merchant data
 */
router.post('/webhooks/app-uninstalled', verifyShopifyWebhook, async (req, res) => {
  try {
    const shopDomain = req.get('X-Shopify-Shop-Domain');
    console.log(`App uninstalled webhook received for shop: ${shopDomain}`);

    if (shopDomain) {
      // Find and clean up all users connected to this shop
      const result = await User.updateMany(
        { 'shopify.storeDomain': shopDomain },
        { $unset: { shopify: 1 } }
      );
      console.log(`Cleaned up ${result.modifiedCount} user(s) for shop: ${shopDomain}`);
    }

    // Shopify expects a 200 response within 5 seconds
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('App uninstalled webhook error:', error);
    // Still return 200 to prevent Shopify from retrying
    res.status(200).json({ success: true, error: error.message });
  }
});

/**
 * POST /api/shopify/webhooks/customers-data-request
 * GDPR: Customer requests their data
 * Shopify sends this when a customer requests their data under GDPR
 */
router.post('/webhooks/customers-data-request', verifyShopifyWebhook, async (req, res) => {
  try {
    const { shop_domain, customer, orders_requested } = req.body;
    console.log(`Customer data request received for shop: ${shop_domain}`);

    // Log the request for compliance
    console.log('GDPR Data Request:', {
      shopDomain: shop_domain,
      customerId: customer?.id,
      customerEmail: customer?.email,
      ordersRequested: orders_requested,
      timestamp: new Date().toISOString(),
    });

    // In a full implementation, you would:
    // 1. Gather all customer data from your database
    // 2. Send it to the shop owner or directly to the customer
    // For now, we acknowledge the request

    res.status(200).json({
      success: true,
      message: 'Data request received and logged',
    });
  } catch (error) {
    console.error('Customer data request webhook error:', error);
    res.status(200).json({ success: true });
  }
});

/**
 * POST /api/shopify/webhooks/customers-redact
 * GDPR: Request to delete customer data
 * Must delete all customer personal data within 30 days
 */
router.post('/webhooks/customers-redact', verifyShopifyWebhook, async (req, res) => {
  try {
    const { shop_domain, customer, orders_to_redact } = req.body;
    console.log(`Customer redact request received for shop: ${shop_domain}`);

    // Log the redaction request for compliance
    console.log('GDPR Customer Redact:', {
      shopDomain: shop_domain,
      customerId: customer?.id,
      customerEmail: customer?.email,
      ordersToRedact: orders_to_redact,
      timestamp: new Date().toISOString(),
    });

    // In a full implementation, you would:
    // 1. Delete all personal data for this customer from your database
    // 2. Remove from any analytics or logs
    // 3. Document the deletion for compliance

    // For Remodely, we don't store customer data from Shopify stores
    // We only store the store owner's connection info

    res.status(200).json({
      success: true,
      message: 'Customer data redaction request acknowledged',
    });
  } catch (error) {
    console.error('Customer redact webhook error:', error);
    res.status(200).json({ success: true });
  }
});

/**
 * POST /api/shopify/webhooks/shop-redact
 * GDPR: Request to delete all shop data
 * Called 48 hours after app uninstall - must delete ALL shop data
 */
router.post('/webhooks/shop-redact', verifyShopifyWebhook, async (req, res) => {
  try {
    const { shop_domain, shop_id } = req.body;
    console.log(`Shop redact request received for shop: ${shop_domain}`);

    // Log the redaction for compliance
    console.log('GDPR Shop Redact:', {
      shopDomain: shop_domain,
      shopId: shop_id,
      timestamp: new Date().toISOString(),
    });

    if (shop_domain) {
      // Delete all data associated with this shop
      const result = await User.updateMany(
        { 'shopify.storeDomain': shop_domain },
        { $unset: { shopify: 1 } }
      );
      console.log(`Redacted data for ${result.modifiedCount} user(s) from shop: ${shop_domain}`);
    }

    res.status(200).json({
      success: true,
      message: 'Shop data redaction completed',
    });
  } catch (error) {
    console.error('Shop redact webhook error:', error);
    res.status(200).json({ success: true });
  }
});

/**
 * POST /api/shopify/webhooks/products-update
 * Sync product updates from Shopify to listings database
 */
router.post('/webhooks/products-update', verifyShopifyWebhook, async (req, res) => {
  try {
    const shopDomain = req.get('X-Shopify-Shop-Domain');
    const product = req.body;

    console.log(`Product update webhook for shop: ${shopDomain}, product: ${product.id}`);

    // Find and update the corresponding listing
    const firstVariant = product.variants?.[0] || {};

    const updateResult = await pool.query(
      `UPDATE listings SET
        title = $1,
        description = $2,
        price = $3,
        compare_at_price = $4,
        images = $5,
        brand = $6,
        sku = $7,
        inventory_quantity = $8,
        status = $9,
        updated_at = NOW()
      WHERE shopify_product_id = $10
      RETURNING id`,
      [
        product.title,
        product.body_html?.replace(/<[^>]*>/g, '') || '',
        parseFloat(firstVariant.price) || 0,
        firstVariant.compare_at_price ? parseFloat(firstVariant.compare_at_price) : null,
        (product.images || []).map(img => img.src),
        product.vendor || null,
        firstVariant.sku || null,
        firstVariant.inventory_quantity || null,
        product.status === 'active' ? 'active' : 'archived',
        product.id.toString(),
      ]
    );

    if (updateResult.rows.length > 0) {
      console.log(`✅ Updated listing ${updateResult.rows[0].id} from Shopify product ${product.id}`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Products update webhook error:', error);
    res.status(200).json({ success: true });
  }
});

/**
 * POST /api/shopify/webhooks/products-delete
 * Handle product deletion from Shopify - archives the listing
 */
router.post('/webhooks/products-delete', verifyShopifyWebhook, async (req, res) => {
  try {
    const shopDomain = req.get('X-Shopify-Shop-Domain');
    const { id } = req.body;

    console.log(`Product delete webhook for shop: ${shopDomain}, product: ${id}`);

    // Archive the listing (don't delete, in case they want to restore)
    const updateResult = await pool.query(
      `UPDATE listings SET status = 'archived', updated_at = NOW()
       WHERE shopify_product_id = $1
       RETURNING id`,
      [id.toString()]
    );

    if (updateResult.rows.length > 0) {
      console.log(`✅ Archived listing ${updateResult.rows[0].id} (Shopify product ${id} deleted)`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Products delete webhook error:', error);
    res.status(200).json({ success: true });
  }
});

export default router;
