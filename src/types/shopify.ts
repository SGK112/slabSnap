/**
 * REMODELY.AI - Shopify Integration Types
 */

export interface ShopifyStore {
  id: string;
  name: string;
  domain: string;
  email: string;
  accessToken: string;
  connectedAt: number;
  lastSyncAt?: number;
  productCount?: number;
  orderCount?: number;
  currency: string;
  timezone: string;
  plan?: string;
}

export interface ShopifyProduct {
  id: string;
  shopifyId: string;
  title: string;
  description: string;
  vendor: string;
  productType: string;
  status: 'active' | 'draft' | 'archived';
  tags: string[];
  images: ShopifyImage[];
  variants: ShopifyVariant[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  handle: string;
  // Remodely-specific fields
  syncedToRemodely: boolean;
  remodelyListingId?: string;
  stoneType?: string;
}

export interface ShopifyImage {
  id: string;
  src: string;
  alt?: string;
  position: number;
  width?: number;
  height?: number;
}

export interface ShopifyVariant {
  id: string;
  shopifyId: string;
  title: string;
  price: string;
  compareAtPrice?: string;
  sku?: string;
  barcode?: string;
  inventoryQuantity: number;
  weight?: number;
  weightUnit?: 'kg' | 'g' | 'lb' | 'oz';
  // Dimensions
  length?: number;
  width?: number;
  thickness?: number;
  dimensionUnit?: 'in' | 'cm' | 'mm';
}

export interface ShopifyOrder {
  id: string;
  shopifyId: string;
  orderNumber: string;
  email: string;
  totalPrice: string;
  subtotalPrice: string;
  totalTax: string;
  currency: string;
  financialStatus: 'pending' | 'authorized' | 'paid' | 'partially_paid' | 'refunded' | 'voided';
  fulfillmentStatus: 'unfulfilled' | 'partial' | 'fulfilled' | null;
  customer: ShopifyCustomer;
  lineItems: ShopifyLineItem[];
  shippingAddress?: ShopifyAddress;
  billingAddress?: ShopifyAddress;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  note?: string;
}

export interface ShopifyCustomer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  ordersCount: number;
  totalSpent: string;
}

export interface ShopifyLineItem {
  id: string;
  productId: string;
  variantId: string;
  title: string;
  variantTitle?: string;
  quantity: number;
  price: string;
  sku?: string;
}

export interface ShopifyAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  provinceCode: string;
  country: string;
  countryCode: string;
  zip: string;
  phone?: string;
}

export interface ShopifySyncStatus {
  inProgress: boolean;
  lastSyncAt?: number;
  productsImported: number;
  productsExported: number;
  errors: string[];
}

export interface ShopifyConnectionConfig {
  storeDomain: string;
  accessToken: string;
  apiVersion?: string;
}

// Sync direction options
export type SyncDirection = 'import' | 'export' | 'both';

// Product mapping for import/export
export interface ProductMapping {
  shopifyProductId: string;
  remodelyListingId: string;
  syncDirection: SyncDirection;
  lastSyncAt: number;
  status: 'synced' | 'pending' | 'error';
  errorMessage?: string;
}
