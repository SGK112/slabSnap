/**
 * REMODELY.AI - Shopify Store State Management
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ShopifyStore,
  ShopifyProduct,
  ShopifyOrder,
  ShopifySyncStatus,
} from '../types/shopify';
import shopifyService from '../api/shopify-service';

interface ShopifyState {
  // Connection state
  isConnected: boolean;
  store: ShopifyStore | null;
  isConnecting: boolean;
  connectionError: string | null;

  // Products
  products: ShopifyProduct[];
  productsLoading: boolean;
  productsError: string | null;
  hasMoreProducts: boolean;
  productsCursor: string | null;

  // Orders
  orders: ShopifyOrder[];
  ordersLoading: boolean;
  ordersError: string | null;

  // Sync state
  syncStatus: ShopifySyncStatus;
  isSyncing: boolean;

  // Actions
  connect: (storeDomain: string, accessToken: string, authToken: string) => Promise<void>;
  disconnect: (authToken: string) => Promise<void>;
  checkStatus: (authToken: string) => Promise<void>;
  fetchProducts: (authToken: string, refresh?: boolean) => Promise<void>;
  fetchOrders: (authToken: string) => Promise<void>;
  importProduct: (authToken: string, shopifyProductId: string) => Promise<string>;
  exportListing: (authToken: string, listingId: string) => Promise<string>;
  syncAll: (authToken: string, direction?: 'import' | 'export' | 'both') => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialSyncStatus: ShopifySyncStatus = {
  inProgress: false,
  productsImported: 0,
  productsExported: 0,
  errors: [],
};

export const useShopifyStore = create<ShopifyState>()(
  persist(
    (set, get) => ({
      // Initial state
      isConnected: false,
      store: null,
      isConnecting: false,
      connectionError: null,

      products: [],
      productsLoading: false,
      productsError: null,
      hasMoreProducts: false,
      productsCursor: null,

      orders: [],
      ordersLoading: false,
      ordersError: null,

      syncStatus: initialSyncStatus,
      isSyncing: false,

      // Connect to Shopify store
      connect: async (storeDomain: string, accessToken: string, authToken: string) => {
        set({ isConnecting: true, connectionError: null });

        try {
          const store = await shopifyService.connect(
            { storeDomain, accessToken },
            authToken
          );

          set({
            isConnected: true,
            store,
            isConnecting: false,
            connectionError: null,
          });
        } catch (error) {
          set({
            isConnecting: false,
            connectionError: error instanceof Error ? error.message : 'Connection failed',
          });
          throw error;
        }
      },

      // Disconnect from Shopify store
      disconnect: async (authToken: string) => {
        try {
          await shopifyService.disconnect(authToken);
          set({
            isConnected: false,
            store: null,
            products: [],
            orders: [],
            syncStatus: initialSyncStatus,
          });
        } catch (error) {
          console.error('Failed to disconnect:', error);
          throw error;
        }
      },

      // Check connection status
      checkStatus: async (authToken: string) => {
        try {
          const status = await shopifyService.getStatus(authToken);
          set({
            isConnected: status.connected,
            store: status.store || null,
          });
        } catch (error) {
          console.error('Failed to check status:', error);
          set({ isConnected: false, store: null });
        }
      },

      // Fetch products from Shopify
      fetchProducts: async (authToken: string, refresh = false) => {
        const state = get();

        if (state.productsLoading) return;
        if (!refresh && state.products.length > 0 && !state.hasMoreProducts) return;

        set({ productsLoading: true, productsError: null });

        try {
          const cursor = refresh ? undefined : state.productsCursor || undefined;
          const result = await shopifyService.fetchProducts(authToken, {
            limit: 20,
            cursor,
            status: 'active',
          });

          set({
            products: refresh
              ? result.products
              : [...state.products, ...result.products],
            hasMoreProducts: result.hasMore,
            productsCursor: result.cursor || null,
            productsLoading: false,
          });
        } catch (error) {
          set({
            productsLoading: false,
            productsError: error instanceof Error ? error.message : 'Failed to fetch products',
          });
        }
      },

      // Fetch orders from Shopify
      fetchOrders: async (authToken: string) => {
        set({ ordersLoading: true, ordersError: null });

        try {
          const result = await shopifyService.fetchOrders(authToken, {
            limit: 50,
            status: 'any',
          });

          set({
            orders: result.orders,
            ordersLoading: false,
          });
        } catch (error) {
          set({
            ordersLoading: false,
            ordersError: error instanceof Error ? error.message : 'Failed to fetch orders',
          });
        }
      },

      // Import a single product to Remodely
      importProduct: async (authToken: string, shopifyProductId: string) => {
        const result = await shopifyService.importProduct(authToken, shopifyProductId);

        // Update the product's sync status in local state
        set(state => ({
          products: state.products.map(p =>
            p.shopifyId === shopifyProductId
              ? { ...p, syncedToRemodely: true, remodelyListingId: result.listingId }
              : p
          ),
        }));

        return result.listingId;
      },

      // Export a listing to Shopify
      exportListing: async (authToken: string, listingId: string) => {
        const result = await shopifyService.exportListing(authToken, listingId);
        return result.shopifyProductId;
      },

      // Sync all products
      syncAll: async (authToken: string, direction = 'both') => {
        set({ isSyncing: true });

        try {
          const status = await shopifyService.sync(authToken, direction);
          set({
            syncStatus: status,
            isSyncing: false,
          });

          // Refresh products after sync
          await get().fetchProducts(authToken, true);
        } catch (error) {
          set({
            isSyncing: false,
            syncStatus: {
              ...get().syncStatus,
              errors: [error instanceof Error ? error.message : 'Sync failed'],
            },
          });
          throw error;
        }
      },

      // Clear errors
      clearError: () => {
        set({
          connectionError: null,
          productsError: null,
          ordersError: null,
        });
      },

      // Reset store
      reset: () => {
        set({
          isConnected: false,
          store: null,
          isConnecting: false,
          connectionError: null,
          products: [],
          productsLoading: false,
          productsError: null,
          hasMoreProducts: false,
          productsCursor: null,
          orders: [],
          ordersLoading: false,
          ordersError: null,
          syncStatus: initialSyncStatus,
          isSyncing: false,
        });
      },
    }),
    {
      name: 'remodely-shopify-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isConnected: state.isConnected,
        store: state.store,
      }),
    }
  )
);
