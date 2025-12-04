/**
 * REMODELY.AI - Shopify Integration Service
 * Handles all Shopify API interactions through the backend proxy
 */

import { API_CONFIG } from '../config/env';
import {
  ShopifyStore,
  ShopifyProduct,
  ShopifyOrder,
  ShopifySyncStatus,
  ShopifyConnectionConfig,
} from '../types/shopify';

const BASE_URL = API_CONFIG.baseUrl;

/**
 * Connect a Shopify store
 */
export async function connectShopifyStore(
  config: ShopifyConnectionConfig,
  authToken: string
): Promise<ShopifyStore> {
  const response = await fetch(`${BASE_URL}/api/shopify/connect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      storeDomain: config.storeDomain,
      accessToken: config.accessToken,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Connection failed' }));
    throw new Error(error.message || `Failed to connect: ${response.status}`);
  }

  return response.json();
}

/**
 * Disconnect a Shopify store
 */
export async function disconnectShopifyStore(authToken: string): Promise<void> {
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

/**
 * Get connected store status
 */
export async function getShopifyStatus(authToken: string): Promise<{
  connected: boolean;
  store?: ShopifyStore;
}> {
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
  const params = new URLSearchParams();
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.cursor) params.append('cursor', options.cursor);
  if (options?.status) params.append('status', options.status);

  const response = await fetch(`${BASE_URL}/api/shopify/products?${params}`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  return response.json();
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
 */
export async function importProductToRemodely(
  authToken: string,
  shopifyProductId: string
): Promise<{ listingId: string }> {
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

  return response.json();
}

/**
 * Export a Remodely listing to Shopify
 */
export async function exportListingToShopify(
  authToken: string,
  listingId: string
): Promise<{ shopifyProductId: string }> {
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
  connect: connectShopifyStore,
  disconnect: disconnectShopifyStore,
  getStatus: getShopifyStatus,
  fetchProducts: fetchShopifyProducts,
  fetchOrders: fetchShopifyOrders,
  importProduct: importProductToRemodely,
  exportListing: exportListingToShopify,
  sync: syncProducts,
  getSyncStatus,
  updateInventory: updateShopifyInventory,
  getOAuthUrl: getShopifyOAuthUrl,
};
