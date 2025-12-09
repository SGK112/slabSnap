/**
 * REMODELY.AI - Shopify Integration Service
 * Handles all Shopify API interactions through OAuth
 * Supports multi-store connections for any Shopify merchant
 */

import { API_CONFIG, SHOPIFY_CONFIG } from '../config/env';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import {
  ShopifyStore,
  ShopifyProduct,
  ShopifyOrder,
  ShopifySyncStatus,
  ShopifyConnectionConfig,
} from '../types/shopify';
import { Listing, MaterialCategory } from '../types/marketplace';
import { useListingsStore } from '../state/listingsStore';
import { useAuthStore } from '../state/authStore';

const BASE_URL = API_CONFIG.baseUrl;
const USE_DEMO_MODE = SHOPIFY_CONFIG.useDemoMode;

/**
 * Generate OAuth URL for Shopify store connection
 * User will be redirected to Shopify to authorize the app
 */
export function generateOAuthUrl(storeDomain: string): string {
  // Normalize store domain
  const normalizedDomain = storeDomain.includes('.myshopify.com')
    ? storeDomain
    : `${storeDomain}.myshopify.com`;

  const params = new URLSearchParams({
    client_id: SHOPIFY_CONFIG.apiKey,
    scope: SHOPIFY_CONFIG.scopes,
    redirect_uri: SHOPIFY_CONFIG.redirectUri,
    state: `${normalizedDomain}:${Date.now()}`, // Include store in state for verification
  });

  return `https://${normalizedDomain}/admin/oauth/authorize?${params.toString()}`;
}

/**
 * Start OAuth flow - uses backend to generate OAuth URL and handle callback
 */
export async function startOAuthFlow(storeDomain: string, authToken?: string): Promise<{ success: boolean; store?: ShopifyStore; error?: string }> {
  try {
    // Normalize store domain
    const normalizedDomain = storeDomain.includes('.myshopify.com')
      ? storeDomain.replace('.myshopify.com', '')
      : storeDomain;

    // Get OAuth URL from backend (it handles state and HMAC)
    const urlResponse = await fetch(`${BASE_URL}/api/shopify/auth/url?shop=${normalizedDomain}`, {
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
    });

    if (!urlResponse.ok) {
      const error = await urlResponse.json().catch(() => ({ error: 'Failed to get auth URL' }));
      return { success: false, error: error.error || 'Failed to start OAuth' };
    }

    const { url: authUrl, shop } = await urlResponse.json();

    // Open the browser for OAuth - backend handles the callback
    const result = await WebBrowser.openAuthSessionAsync(
      authUrl,
      SHOPIFY_CONFIG.appScheme
    );

    // The backend handles token exchange in the callback
    // We just need to check if the connection was successful
    if (result.type === 'success' || result.type === 'dismiss') {
      // Give backend time to process the OAuth callback
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check connection status
      const statusResponse = await fetch(`${BASE_URL}/api/shopify/status`, {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
      });

      if (statusResponse.ok) {
        const status = await statusResponse.json();
        if (status.connected && status.store) {
          return { success: true, store: status.store };
        }
      }
    }

    return { success: false, error: 'Authorization cancelled or failed' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'OAuth flow failed' };
  }
}

// Mock Surprise Granite store data
const DEMO_STORE: ShopifyStore = {
  id: 'surprise-granite-demo',
  name: 'Surprise Granite',
  domain: 'surprise-granite.myshopify.com',
  productCount: 24,
  currency: 'USD',
  connectedAt: new Date().toISOString(),
};

// Mock products based on typical granite/stone inventory
const DEMO_PRODUCTS: ShopifyProduct[] = [
  {
    id: 'demo-1',
    shopifyId: 'gid://shopify/Product/1001',
    title: 'Calacatta Gold Marble Slab',
    description: 'Premium Italian Calacatta Gold marble with golden veining. Perfect for kitchen countertops and backsplashes.',
    vendor: 'Surprise Granite',
    productType: 'Marble Slab',
    tags: ['marble', 'premium', 'countertop', 'kitchen'],
    images: [{ id: 'img-1', src: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', alt: 'Calacatta Gold Marble' }],
    variants: [{
      id: 'var-1',
      title: 'Full Slab',
      price: '4500.00',
      compareAtPrice: '5500.00',
      sku: 'CAL-GOLD-001',
      inventoryQuantity: 8,
    }],
    status: 'active',
    syncedToRemodely: false,
  },
  {
    id: 'demo-2',
    shopifyId: 'gid://shopify/Product/1002',
    title: 'Black Galaxy Granite Slab',
    description: 'Stunning Black Galaxy granite with golden speckles. Ideal for modern kitchen and bathroom designs.',
    vendor: 'Surprise Granite',
    productType: 'Granite Slab',
    tags: ['granite', 'black', 'countertop', 'modern'],
    images: [{ id: 'img-2', src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', alt: 'Black Galaxy Granite' }],
    variants: [{
      id: 'var-2',
      title: 'Full Slab',
      price: '2800.00',
      compareAtPrice: '3200.00',
      sku: 'BLK-GAL-001',
      inventoryQuantity: 12,
    }],
    status: 'active',
    syncedToRemodely: false,
  },
  {
    id: 'demo-3',
    shopifyId: 'gid://shopify/Product/1003',
    title: 'Carrara White Marble Remnant',
    description: 'Beautiful Carrara White marble remnant piece. Great for bathroom vanities or small projects.',
    vendor: 'Surprise Granite',
    productType: 'Marble Remnant',
    tags: ['marble', 'remnant', 'bathroom', 'white'],
    images: [{ id: 'img-3', src: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800', alt: 'Carrara White Marble' }],
    variants: [{
      id: 'var-3',
      title: '24x36 inches',
      price: '350.00',
      sku: 'CAR-WHT-REM-001',
      inventoryQuantity: 15,
    }],
    status: 'active',
    syncedToRemodely: false,
  },
  {
    id: 'demo-4',
    shopifyId: 'gid://shopify/Product/1004',
    title: 'Absolute Black Granite',
    description: 'Pure black granite slab with minimal variation. Perfect for a sleek, modern look.',
    vendor: 'Surprise Granite',
    productType: 'Granite Slab',
    tags: ['granite', 'black', 'premium', 'modern'],
    images: [{ id: 'img-4', src: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800', alt: 'Absolute Black Granite' }],
    variants: [{
      id: 'var-4',
      title: 'Full Slab',
      price: '3200.00',
      sku: 'ABS-BLK-001',
      inventoryQuantity: 6,
    }],
    status: 'active',
    syncedToRemodely: false,
  },
  {
    id: 'demo-5',
    shopifyId: 'gid://shopify/Product/1005',
    title: 'Colonial White Granite Slab',
    description: 'Classic Colonial White granite with gray and burgundy specks. Versatile for any design style.',
    vendor: 'Surprise Granite',
    productType: 'Granite Slab',
    tags: ['granite', 'white', 'classic', 'kitchen'],
    images: [{ id: 'img-5', src: 'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=800', alt: 'Colonial White Granite' }],
    variants: [{
      id: 'var-5',
      title: 'Full Slab',
      price: '2400.00',
      sku: 'COL-WHT-001',
      inventoryQuantity: 10,
    }],
    status: 'active',
    syncedToRemodely: false,
  },
  {
    id: 'demo-6',
    shopifyId: 'gid://shopify/Product/1006',
    title: 'Quartzite Super White',
    description: 'Natural quartzite with a bright white appearance. Extremely durable and heat resistant.',
    vendor: 'Surprise Granite',
    productType: 'Quartzite Slab',
    tags: ['quartzite', 'white', 'premium', 'durable'],
    images: [{ id: 'img-6', src: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800', alt: 'Super White Quartzite' }],
    variants: [{
      id: 'var-6',
      title: 'Full Slab',
      price: '5800.00',
      sku: 'QTZ-WHT-001',
      inventoryQuantity: 4,
    }],
    status: 'active',
    syncedToRemodely: false,
  },
  {
    id: 'demo-7',
    shopifyId: 'gid://shopify/Product/1007',
    title: 'Blue Bahia Granite Remnant',
    description: 'Exotic Blue Bahia granite remnant. Unique blue coloring perfect for accent pieces.',
    vendor: 'Surprise Granite',
    productType: 'Granite Remnant',
    tags: ['granite', 'remnant', 'blue', 'exotic'],
    images: [{ id: 'img-7', src: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800', alt: 'Blue Bahia Granite' }],
    variants: [{
      id: 'var-7',
      title: '30x24 inches',
      price: '450.00',
      sku: 'BLU-BAH-REM-001',
      inventoryQuantity: 3,
    }],
    status: 'active',
    syncedToRemodely: false,
  },
  {
    id: 'demo-8',
    shopifyId: 'gid://shopify/Product/1008',
    title: 'Leathered Black Pearl Granite',
    description: 'Leathered finish Black Pearl granite with a soft, matte texture. Fingerprint resistant.',
    vendor: 'Surprise Granite',
    productType: 'Granite Slab',
    tags: ['granite', 'leathered', 'black', 'textured'],
    images: [{ id: 'img-8', src: 'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800', alt: 'Black Pearl Leathered Granite' }],
    variants: [{
      id: 'var-8',
      title: 'Full Slab',
      price: '3500.00',
      sku: 'BLK-PRL-LTH-001',
      inventoryQuantity: 5,
    }],
    status: 'active',
    syncedToRemodely: false,
  },
];

/**
 * Connect a Shopify store via OAuth flow
 * This initiates the OAuth process - the actual connection happens via backend callback
 */
export async function connectShopifyStore(
  config: ShopifyConnectionConfig,
  authToken: string
): Promise<ShopifyStore> {
  // Demo mode - simulate connection for Surprise Granite
  if (USE_DEMO_MODE) {
    await new Promise(resolve => setTimeout(resolve, 800));
    const storeName = config.storeDomain.replace('.myshopify.com', '');
    if (storeName === 'surprise-granite') {
      demoConnected = true;
      demoStoreData = { ...DEMO_STORE, connectedAt: new Date().toISOString() };
      return demoStoreData;
    }
    // Allow any store name in demo mode
    const store: ShopifyStore = {
      id: `demo-${storeName}`,
      name: storeName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      domain: `${storeName}.myshopify.com`,
      productCount: 0,
      currency: 'USD',
      connectedAt: new Date().toISOString(),
    };
    demoConnected = true;
    demoStoreData = store;
    return store;
  }

  // Use the OAuth flow to connect
  const result = await startOAuthFlow(config.storeDomain, authToken);

  if (result.success && result.store) {
    return result.store;
  }

  throw new Error(result.error || 'Failed to connect store');
}

/**
 * Disconnect a Shopify store
 */
export async function disconnectShopifyStore(authToken: string): Promise<void> {
  if (USE_DEMO_MODE) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return;
  }

  const response = await fetch(`${BASE_URL}/api/shopify/disconnect`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to disconnect store');
  }
}

// Track demo connection state (would be persisted in real app)
let demoConnected = false;
let demoStoreData: ShopifyStore | null = null;

/**
 * Get connected store status
 */
export async function getShopifyStatus(authToken: string): Promise<{
  connected: boolean;
  store?: ShopifyStore;
}> {
  if (USE_DEMO_MODE) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      connected: demoConnected,
      store: demoStoreData || undefined,
    };
  }

  const response = await fetch(`${BASE_URL}/api/shopify/status`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get store status');
  }

  return response.json();
}

/**
 * Demo mode helper to set connection state
 */
export function setDemoConnectionState(connected: boolean, store?: ShopifyStore) {
  demoConnected = connected;
  demoStoreData = store || null;
}

/**
 * Map Shopify product type to Remodely category
 */
function mapProductTypeToCategory(productType: string, tags: string[]): MaterialCategory {
  const typeLower = productType.toLowerCase();
  const tagsLower = tags.map(t => t.toLowerCase());

  // Stone-related products
  if (typeLower.includes('granite') || typeLower.includes('marble') ||
      typeLower.includes('quartz') || typeLower.includes('quartzite') ||
      typeLower.includes('slab') || typeLower.includes('remnant') ||
      typeLower.includes('stone') || typeLower.includes('tile') ||
      tagsLower.some(t => t.includes('granite') || t.includes('marble') || t.includes('slab'))) {
    return 'Stone & Tile';
  }

  // Kitchen-related
  if (typeLower.includes('kitchen') || typeLower.includes('cabinet') ||
      typeLower.includes('countertop') || typeLower.includes('appliance') ||
      tagsLower.some(t => t.includes('kitchen') || t.includes('cabinet'))) {
    return 'Kitchen';
  }

  // Bath-related
  if (typeLower.includes('bath') || typeLower.includes('vanit') ||
      typeLower.includes('toilet') || typeLower.includes('shower') ||
      tagsLower.some(t => t.includes('bath') || t.includes('vanity'))) {
    return 'Bath';
  }

  // Flooring
  if (typeLower.includes('floor') || typeLower.includes('hardwood') ||
      typeLower.includes('vinyl') || typeLower.includes('carpet') ||
      tagsLower.some(t => t.includes('floor'))) {
    return 'Flooring';
  }

  // Default to Stone & Tile for Surprise Granite type products
  return 'Stone & Tile';
}

/**
 * Convert a ShopifyProduct to a Remodely Listing
 */
export function convertShopifyProductToListing(
  product: ShopifyProduct,
  sellerId: string,
  sellerName: string,
  sellerRating: number = 5.0,
  location: string = ''
): Listing {
  const firstVariant = product.variants?.[0];
  const price = firstVariant ? parseFloat(firstVariant.price) : 0;

  const listing: Listing = {
    id: `shopify-${product.id}`,
    sellerId,
    sellerName,
    sellerRating,
    title: product.title,
    description: product.description || '',
    category: mapProductTypeToCategory(product.productType, product.tags),
    listingType: product.productType.toLowerCase().includes('remnant') ? 'Remnant' :
                 product.productType.toLowerCase().includes('slab') ? 'Slab' : 'New',
    price,
    images: product.images.map(img => img.src),
    location: location || 'Surprise, AZ',
    status: product.status === 'active' ? 'active' : 'archived',
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    views: 0,
    brand: product.vendor,
  };

  return listing;
}

/**
 * Transform Shopify API product to our ShopifyProduct type
 */
function transformShopifyProduct(product: any): ShopifyProduct {
  const firstVariant = product.variants?.[0] || {};
  const firstImage = product.images?.[0] || {};

  return {
    id: `shopify-${product.id}`,
    shopifyId: `gid://shopify/Product/${product.id}`,
    title: product.title || 'Untitled Product',
    description: product.body_html?.replace(/<[^>]*>/g, '') || product.description || '',
    vendor: product.vendor || '',
    productType: product.product_type || 'Other',
    tags: product.tags?.split(',').map((t: string) => t.trim()).filter(Boolean) || [],
    images: (product.images || []).map((img: any) => ({
      id: `img-${img.id}`,
      src: img.src,
      alt: img.alt || product.title,
    })),
    variants: (product.variants || []).map((v: any) => ({
      id: `var-${v.id}`,
      title: v.title || 'Default',
      price: v.price || '0',
      compareAtPrice: v.compare_at_price || undefined,
      sku: v.sku || '',
      inventoryQuantity: v.inventory_quantity || 0,
    })),
    status: product.status || 'active',
    syncedToRemodely: false,
  };
}

/**
 * Fetch products from Shopify
 */
export async function fetchShopifyProducts(
  authToken: string,
  options?: {
    limit?: number;
    cursor?: string;
    status?: 'active' | 'draft' | 'archived';
  }
): Promise<{
  products: ShopifyProduct[];
  hasMore: boolean;
  cursor?: string;
}> {
  // Always try real API first if we have a token
  if (!USE_DEMO_MODE && authToken) {
    try {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.cursor) params.append('cursor', options.cursor);
      if (options?.status) params.append('status', options.status);

      const response = await fetch(`${BASE_URL}/api/shopify/products?${params}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Transform Shopify API products to our format
        const products = (data.products || []).map(transformShopifyProduct);
        return {
          products,
          hasMore: products.length >= (options?.limit || 50),
          cursor: undefined, // TODO: implement cursor pagination
        };
      }
      // If API call fails, fall through to demo mode
      console.warn('Shopify API call failed, using demo data');
    } catch (error) {
      console.warn('Shopify API error:', error);
    }
  }

  // Fallback to demo mode
  await new Promise(resolve => setTimeout(resolve, 500));
  const limit = options?.limit || 20;
  const startIndex = options?.cursor ? parseInt(options.cursor) : 0;
  const endIndex = Math.min(startIndex + limit, DEMO_PRODUCTS.length);
  const products = DEMO_PRODUCTS.slice(startIndex, endIndex);
  const hasMore = endIndex < DEMO_PRODUCTS.length;
  return {
    products,
    hasMore,
    cursor: hasMore ? endIndex.toString() : undefined,
  };
}

/**
 * Fetch orders from Shopify
 */
export async function fetchShopifyOrders(
  authToken: string,
  options?: {
    limit?: number;
    status?: 'open' | 'closed' | 'cancelled' | 'any';
    fulfillmentStatus?: 'shipped' | 'partial' | 'unshipped' | 'any';
  }
): Promise<{
  orders: ShopifyOrder[];
  hasMore: boolean;
}> {
  if (USE_DEMO_MODE) {
    await new Promise(resolve => setTimeout(resolve, 300));
    // Return empty orders for demo
    return { orders: [], hasMore: false };
  }

  const params = new URLSearchParams();
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.status) params.append('status', options.status);
  if (options?.fulfillmentStatus) params.append('fulfillment_status', options.fulfillmentStatus);

  const response = await fetch(`${BASE_URL}/api/shopify/orders?${params}`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }

  return response.json();
}

/**
 * Import a Shopify product to Remodely listing
 * This creates an actual listing in the local store
 */
export async function importProductToRemodely(
  authToken: string,
  shopifyProductId: string,
  product?: ShopifyProduct
): Promise<{ listingId: string; listing?: Listing }> {
  // Get current user info for seller details
  const user = useAuthStore.getState().user;
  const sellerId = user?.id || 'unknown';
  const sellerName = user?.businessName || user?.name || 'Store';
  const sellerRating = user?.rating || 5.0;
  const location = user?.location || 'Surprise, AZ';

  // If we have the product data, create a local listing
  if (product) {
    const listing = convertShopifyProductToListing(
      product,
      sellerId,
      sellerName,
      sellerRating,
      location
    );

    // Add to local listings store
    useListingsStore.getState().addListing(listing);

    // Also sync to backend if not in demo mode
    if (!USE_DEMO_MODE) {
      try {
        await fetch(`${BASE_URL}/api/shopify/import-product`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            shopifyProductId,
            listing,
          }),
        });
      } catch (error) {
        console.warn('Failed to sync import to backend:', error);
        // Still return success since we saved locally
      }
    }

    return { listingId: listing.id, listing };
  }

  // Fallback: just ID provided - fetch product first if possible
  if (USE_DEMO_MODE) {
    // Find product in demo data
    const demoProduct = DEMO_PRODUCTS.find(p => p.id === shopifyProductId || p.shopifyId === shopifyProductId);
    if (demoProduct) {
      const listing = convertShopifyProductToListing(
        demoProduct,
        sellerId,
        sellerName,
        sellerRating,
        location
      );
      useListingsStore.getState().addListing(listing);
      return { listingId: listing.id, listing };
    }
    // Fallback: Generate a mock listing ID
    return { listingId: `listing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
  }

  const response = await fetch(`${BASE_URL}/api/shopify/import-product`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({ shopifyProductId }),
  });

  if (!response.ok) {
    throw new Error('Failed to import product');
  }

  const result = await response.json();

  // If backend returns a listing, add it to local store
  if (result.listing) {
    useListingsStore.getState().addListing(result.listing);
  }

  return result;
}

/**
 * Import multiple Shopify products to Remodely listings
 */
export async function importMultipleProductsToRemodely(
  authToken: string,
  products: ShopifyProduct[]
): Promise<{ imported: number; listings: Listing[] }> {
  const listings: Listing[] = [];

  for (const product of products) {
    try {
      const result = await importProductToRemodely(authToken, product.id, product);
      if (result.listing) {
        listings.push(result.listing);
      }
    } catch (error) {
      console.error(`Failed to import product ${product.id}:`, error);
    }
  }

  return { imported: listings.length, listings };
}

/**
 * Export a Remodely listing to Shopify
 */
export async function exportListingToShopify(
  authToken: string,
  listingId: string
): Promise<{ shopifyProductId: string }> {
  if (USE_DEMO_MODE) {
    await new Promise(resolve => setTimeout(resolve, 600));
    return { shopifyProductId: `gid://shopify/Product/${Date.now()}` };
  }

  const response = await fetch(`${BASE_URL}/api/shopify/export-listing`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({ listingId }),
  });

  if (!response.ok) {
    throw new Error('Failed to export listing');
  }

  return response.json();
}

/**
 * Sync all products between Shopify and Remodely
 */
export async function syncProducts(
  authToken: string,
  direction: 'import' | 'export' | 'both' = 'both'
): Promise<ShopifySyncStatus> {
  if (USE_DEMO_MODE) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      inProgress: false,
      productsImported: direction !== 'export' ? DEMO_PRODUCTS.length : 0,
      productsExported: direction !== 'import' ? 0 : 0,
      errors: [],
      lastSyncAt: new Date().toISOString(),
    };
  }

  const response = await fetch(`${BASE_URL}/api/shopify/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({ direction }),
  });

  if (!response.ok) {
    throw new Error('Failed to sync products');
  }

  return response.json();
}

/**
 * Get sync status
 */
export async function getSyncStatus(authToken: string): Promise<ShopifySyncStatus> {
  const response = await fetch(`${BASE_URL}/api/shopify/sync-status`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get sync status');
  }

  return response.json();
}

/**
 * Update inventory on Shopify
 */
export async function updateShopifyInventory(
  authToken: string,
  variantId: string,
  quantity: number
): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/shopify/inventory`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({ variantId, quantity }),
  });

  if (!response.ok) {
    throw new Error('Failed to update inventory');
  }
}

/**
 * Generate Shopify OAuth URL for app installation
 */
export function getShopifyOAuthUrl(storeDomain: string, redirectUri: string): string {
  // This would typically be handled by your backend
  // The mobile app would open this URL in a WebView or browser
  return `${BASE_URL}/api/shopify/oauth/authorize?shop=${storeDomain}&redirect_uri=${encodeURIComponent(redirectUri)}`;
}

export default {
  // OAuth functions for multi-store support
  generateOAuthUrl,
  startOAuthFlow,
  // Legacy connection methods
  connect: connectShopifyStore,
  disconnect: disconnectShopifyStore,
  getStatus: getShopifyStatus,
  // Product & Order management
  fetchProducts: fetchShopifyProducts,
  fetchOrders: fetchShopifyOrders,
  importProduct: importProductToRemodely,
  importMultipleProducts: importMultipleProductsToRemodely,
  exportListing: exportListingToShopify,
  sync: syncProducts,
  getSyncStatus,
  updateInventory: updateShopifyInventory,
  getOAuthUrl: getShopifyOAuthUrl,
  setDemoConnectionState,
  // Conversion utilities
  convertToListing: convertShopifyProductToListing,
  // Demo data exports for use in other components
  DEMO_STORE,
  DEMO_PRODUCTS,
};
