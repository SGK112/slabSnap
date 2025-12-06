import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  UserSubscription,
  SubscriptionTier,
  CreditBalance,
  CreditTransaction,
  Promotion,
  DigitalFlyer,
  VENDOR_PLANS,
  PRO_PLANS,
  CREDIT_PACKAGES,
  LEAD_COSTS,
  BOOST_COSTS,
  LeadType,
  BoostType,
} from "../types/subscriptions";
import { API_CONFIG } from "../config/env";

interface SubscriptionState {
  // Current user's subscription
  subscription: UserSubscription | null;
  credits: CreditBalance | null;
  creditHistory: CreditTransaction[];

  // User's promotions and flyers
  promotions: Promotion[];
  flyers: DigitalFlyer[];

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions - Subscription
  fetchSubscription: (userId: string) => Promise<void>;
  subscribeToPlan: (
    planId: string,
    planType: "vendor" | "pro",
    billingCycle: "monthly" | "yearly"
  ) => Promise<string>; // Returns Stripe checkout URL
  cancelSubscription: () => Promise<void>;
  resumeSubscription: () => Promise<void>;
  upgradePlan: (newPlanId: string) => Promise<string>;

  // Actions - Credits
  fetchCredits: (userId: string) => Promise<void>;
  purchaseCredits: (packageId: string) => Promise<string>; // Returns Stripe checkout URL
  spendCredits: (
    amount: number,
    type: "lead" | "boost" | "promotion",
    targetId: string,
    description: string
  ) => Promise<boolean>;
  getLeadCost: (leadType: LeadType) => number;
  getBoostCost: (boostType: BoostType, days: number) => number;

  // Actions - Promotions
  createPromotion: (promo: Partial<Promotion>) => Promise<Promotion>;
  updatePromotion: (id: string, updates: Partial<Promotion>) => Promise<void>;
  deletePromotion: (id: string) => Promise<void>;
  fetchPromotions: (vendorId: string) => Promise<void>;

  // Actions - Flyers
  uploadFlyer: (flyer: Partial<DigitalFlyer>) => Promise<DigitalFlyer>;
  deleteFlyer: (id: string) => Promise<void>;
  fetchFlyers: (vendorId: string) => Promise<void>;

  // Feature checks
  canCreateListing: () => boolean;
  canPostPromotion: () => boolean;
  canUploadFlyer: () => boolean;
  canAccessLeads: () => boolean;
  canCreateQuote: () => boolean;
  getListingLimit: () => number | "unlimited";
  getPromoLimit: () => number | "unlimited";
  getFlyerLimit: () => number | "unlimited";
  getLeadLimit: () => number | "unlimited";
  getQuoteLimit: () => number | "unlimited";

  // Tier info
  getCurrentTier: () => SubscriptionTier;
  isProTier: () => boolean;
  isPremiumTier: () => boolean;
  getDaysUntilRenewal: () => number;
  isTrialing: () => boolean;

  // Helpers
  clearError: () => void;
  reset: () => void;
}

// Mock data for development
const MOCK_SUBSCRIPTION: UserSubscription = {
  id: "sub_mock_1",
  userId: "mock-user-1",
  planId: "vendor-starter",
  tier: "starter",
  planType: "vendor",
  status: "active",
  billingCycle: "monthly",
  currentPeriodStart: Date.now() - 1000 * 60 * 60 * 24 * 15, // 15 days ago
  currentPeriodEnd: Date.now() + 1000 * 60 * 60 * 24 * 15, // 15 days from now
  usage: {
    productsListed: 12,
    specialsPosted: 3,
    flyersUploaded: 1,
    leadsReceived: 8,
  },
  createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
  updatedAt: Date.now(),
};

const MOCK_CREDITS: CreditBalance = {
  userId: "mock-user-1",
  credits: 50,
  bonusCredits: 10,
  lifetimeCredits: 150,
  lifetimeSpent: 90,
};

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscription: null,
      credits: null,
      creditHistory: [],
      promotions: [],
      flyers: [],
      isLoading: false,
      error: null,

      // ============================================
      // SUBSCRIPTION ACTIONS
      // ============================================

      fetchSubscription: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          // In production, fetch from backend
          // const response = await fetch(`${API_CONFIG.baseUrl}/api/subscriptions/${userId}`);
          // const data = await response.json();

          // For now, use mock data
          await new Promise((r) => setTimeout(r, 300));
          set({
            subscription: MOCK_SUBSCRIPTION,
            isLoading: false,
          });
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
        }
      },

      subscribeToPlan: async (planId, planType, billingCycle) => {
        set({ isLoading: true, error: null });
        try {
          // In production, this calls your backend which creates a Stripe checkout session
          const response = await fetch(
            `${API_CONFIG.baseUrl}/api/subscriptions/checkout`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ planId, planType, billingCycle }),
            }
          );
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to create checkout session");
          }

          set({ isLoading: false });
          return data.checkoutUrl; // Return Stripe checkout URL
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },

      cancelSubscription: async () => {
        set({ isLoading: true, error: null });
        try {
          const { subscription } = get();
          if (!subscription) throw new Error("No active subscription");

          // In production, call backend to cancel
          // await fetch(`${API_CONFIG.baseUrl}/api/subscriptions/cancel`, { method: 'POST' });

          set({
            subscription: {
              ...subscription,
              status: "canceled",
              canceledAt: Date.now(),
            },
            isLoading: false,
          });
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
        }
      },

      resumeSubscription: async () => {
        set({ isLoading: true, error: null });
        try {
          const { subscription } = get();
          if (!subscription) throw new Error("No subscription to resume");

          // In production, call backend
          set({
            subscription: {
              ...subscription,
              status: "active",
              canceledAt: undefined,
            },
            isLoading: false,
          });
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
        }
      },

      upgradePlan: async (newPlanId: string) => {
        set({ isLoading: true, error: null });
        try {
          // In production, this creates a Stripe checkout/portal session for upgrade
          const response = await fetch(
            `${API_CONFIG.baseUrl}/api/subscriptions/upgrade`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ newPlanId }),
            }
          );
          const data = await response.json();

          set({ isLoading: false });
          return data.checkoutUrl;
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },

      // ============================================
      // CREDITS ACTIONS
      // ============================================

      fetchCredits: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          // Mock for now
          await new Promise((r) => setTimeout(r, 200));
          set({
            credits: MOCK_CREDITS,
            isLoading: false,
          });
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
        }
      },

      purchaseCredits: async (packageId: string) => {
        set({ isLoading: true, error: null });
        try {
          const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
          if (!pkg) throw new Error("Invalid credit package");

          // In production, create Stripe checkout session
          const response = await fetch(
            `${API_CONFIG.baseUrl}/api/credits/purchase`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ packageId }),
            }
          );
          const data = await response.json();

          set({ isLoading: false });
          return data.checkoutUrl;
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },

      spendCredits: async (amount, type, targetId, description) => {
        const { credits } = get();
        if (!credits) return false;

        const totalCredits = credits.credits + credits.bonusCredits;
        if (totalCredits < amount) return false;

        // Deduct from bonus first, then regular
        let bonusDeduct = Math.min(credits.bonusCredits, amount);
        let regularDeduct = amount - bonusDeduct;

        const newCredits: CreditBalance = {
          ...credits,
          bonusCredits: credits.bonusCredits - bonusDeduct,
          credits: credits.credits - regularDeduct,
          lifetimeSpent: credits.lifetimeSpent + amount,
        };

        const transaction: CreditTransaction = {
          id: `txn_${Date.now()}`,
          userId: credits.userId,
          type: "spend",
          amount: -amount,
          balance: newCredits.credits + newCredits.bonusCredits,
          description,
          leadId: type === "lead" ? targetId : undefined,
          promotionId: type === "promotion" ? targetId : undefined,
          createdAt: Date.now(),
        };

        set({
          credits: newCredits,
          creditHistory: [transaction, ...get().creditHistory],
        });

        return true;
      },

      getLeadCost: (leadType: LeadType) => {
        return LEAD_COSTS[leadType] || 1;
      },

      getBoostCost: (boostType: BoostType, days: number) => {
        return BOOST_COSTS[boostType] * days;
      },

      // ============================================
      // PROMOTIONS ACTIONS
      // ============================================

      createPromotion: async (promo: Partial<Promotion>) => {
        set({ isLoading: true, error: null });
        try {
          const newPromo: Promotion = {
            id: `promo_${Date.now()}`,
            vendorId: promo.vendorId || "",
            vendorName: promo.vendorName || "",
            type: promo.type || "flash_sale",
            title: promo.title || "",
            description: promo.description || "",
            images: promo.images || [],
            visibility: promo.visibility || "public",
            startsAt: promo.startsAt || Date.now(),
            endsAt: promo.endsAt || Date.now() + 1000 * 60 * 60 * 24 * 7,
            views: 0,
            saves: 0,
            clicks: 0,
            leads: 0,
            status: "draft",
            featured: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            ...promo,
          };

          set({
            promotions: [...get().promotions, newPromo],
            isLoading: false,
          });

          return newPromo;
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },

      updatePromotion: async (id: string, updates: Partial<Promotion>) => {
        set({
          promotions: get().promotions.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
          ),
        });
      },

      deletePromotion: async (id: string) => {
        set({
          promotions: get().promotions.filter((p) => p.id !== id),
        });
      },

      fetchPromotions: async (vendorId: string) => {
        set({ isLoading: true });
        try {
          // Mock - in production fetch from backend
          await new Promise((r) => setTimeout(r, 300));
          set({ isLoading: false });
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
        }
      },

      // ============================================
      // FLYERS ACTIONS
      // ============================================

      uploadFlyer: async (flyer: Partial<DigitalFlyer>) => {
        set({ isLoading: true, error: null });
        try {
          const newFlyer: DigitalFlyer = {
            id: `flyer_${Date.now()}`,
            vendorId: flyer.vendorId || "",
            vendorName: flyer.vendorName || "",
            title: flyer.title || "",
            coverImage: flyer.coverImage || "",
            pdfUrl: flyer.pdfUrl || "",
            categories: flyer.categories || [],
            validFrom: flyer.validFrom || Date.now(),
            validUntil:
              flyer.validUntil || Date.now() + 1000 * 60 * 60 * 24 * 30,
            views: 0,
            downloads: 0,
            shares: 0,
            status: "active",
            createdAt: Date.now(),
            ...flyer,
          };

          set({
            flyers: [...get().flyers, newFlyer],
            isLoading: false,
          });

          return newFlyer;
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },

      deleteFlyer: async (id: string) => {
        set({
          flyers: get().flyers.filter((f) => f.id !== id),
        });
      },

      fetchFlyers: async (vendorId: string) => {
        set({ isLoading: true });
        try {
          await new Promise((r) => setTimeout(r, 300));
          set({ isLoading: false });
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
        }
      },

      // ============================================
      // FEATURE CHECKS
      // ============================================

      canCreateListing: () => {
        const { subscription } = get();
        if (!subscription) return true; // Free tier gets some listings

        const limit = get().getListingLimit();
        if (limit === "unlimited") return true;

        return (subscription.usage?.productsListed || 0) < limit;
      },

      canPostPromotion: () => {
        const { subscription } = get();
        if (!subscription) return false;

        const limit = get().getPromoLimit();
        if (limit === "unlimited") return true;
        if (limit === 0) return false;

        return (subscription.usage?.specialsPosted || 0) < limit;
      },

      canUploadFlyer: () => {
        const { subscription } = get();
        if (!subscription) return false;

        const limit = get().getFlyerLimit();
        if (limit === "unlimited") return true;
        if (limit === 0) return false;

        return (subscription.usage?.flyersUploaded || 0) < limit;
      },

      canAccessLeads: () => {
        const { subscription } = get();
        if (!subscription) return false;

        const plan =
          subscription.planType === "vendor"
            ? VENDOR_PLANS.find((p) => p.id === subscription.planId)
            : PRO_PLANS.find((p) => p.id === subscription.planId);

        return plan?.features.leadAccess !== "none";
      },

      canCreateQuote: () => {
        const { subscription } = get();
        if (!subscription || subscription.planType !== "pro") {
          // Free tier gets limited quotes
          return true;
        }

        const limit = get().getQuoteLimit();
        if (limit === "unlimited") return true;

        return (subscription.usage?.quotesCreated || 0) < limit;
      },

      getListingLimit: () => {
        const { subscription } = get();
        if (!subscription) return 5; // Free tier

        if (subscription.planType === "vendor") {
          const plan = VENDOR_PLANS.find((p) => p.id === subscription.planId);
          return plan?.features.productListings || 10;
        }
        return "unlimited"; // Pros have unlimited for their own listings
      },

      getPromoLimit: () => {
        const { subscription } = get();
        if (!subscription) return 0;

        if (subscription.planType === "vendor") {
          const plan = VENDOR_PLANS.find((p) => p.id === subscription.planId);
          return plan?.features.monthlySpecials || 0;
        }
        return 0;
      },

      getFlyerLimit: () => {
        const { subscription } = get();
        if (!subscription) return 0;

        if (subscription.planType === "vendor") {
          const plan = VENDOR_PLANS.find((p) => p.id === subscription.planId);
          return plan?.features.flyerUploads || 0;
        }
        return 0;
      },

      getLeadLimit: () => {
        const { subscription } = get();
        if (!subscription) return 0;

        const plan =
          subscription.planType === "vendor"
            ? VENDOR_PLANS.find((p) => p.id === subscription.planId)
            : PRO_PLANS.find((p) => p.id === subscription.planId);

        return plan?.features.leadsPerMonth || 0;
      },

      getQuoteLimit: () => {
        const { subscription } = get();
        if (!subscription) return 5; // Free tier

        if (subscription.planType === "pro") {
          const plan = PRO_PLANS.find((p) => p.id === subscription.planId);
          return plan?.features.quotesPerMonth || 5;
        }
        return "unlimited";
      },

      // ============================================
      // TIER INFO
      // ============================================

      getCurrentTier: () => {
        const { subscription } = get();
        return subscription?.tier || "free";
      },

      isProTier: () => {
        const tier = get().getCurrentTier();
        return tier === "pro" || tier === "enterprise";
      },

      isPremiumTier: () => {
        const tier = get().getCurrentTier();
        return tier === "enterprise";
      },

      getDaysUntilRenewal: () => {
        const { subscription } = get();
        if (!subscription) return 0;

        const msRemaining = subscription.currentPeriodEnd - Date.now();
        return Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
      },

      isTrialing: () => {
        const { subscription } = get();
        return subscription?.status === "trial";
      },

      // ============================================
      // HELPERS
      // ============================================

      clearError: () => set({ error: null }),

      reset: () =>
        set({
          subscription: null,
          credits: null,
          creditHistory: [],
          promotions: [],
          flyers: [],
          isLoading: false,
          error: null,
        }),
    }),
    {
      name: "subscription-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        subscription: state.subscription,
        credits: state.credits,
        creditHistory: state.creditHistory.slice(0, 50), // Keep last 50 transactions
        promotions: state.promotions,
        flyers: state.flyers,
      }),
    }
  )
);
