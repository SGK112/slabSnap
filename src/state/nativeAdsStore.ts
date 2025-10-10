import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type AdType = "banner" | "featured" | "sponsored" | "tooltip";
export type AdPlacement = "home" | "map" | "listings" | "jobs" | "messages";
export type AdStatus = "draft" | "pending" | "active" | "paused" | "expired" | "rejected";

export interface NativeAd {
  id: string;
  userId: string;
  userType: "vendor" | "fabricator" | "homeowner" | "contractor" | "designer";
  
  // Ad Content
  title: string;
  description: string;
  imageUrl?: string;
  ctaText: string; // "Call Now", "Visit Website", "Request Sample", etc.
  ctaAction: "call" | "website" | "message" | "sample" | "navigate";
  ctaValue: string; // phone number, url, screen name, etc.
  
  // Business Info
  businessName: string;
  businessType: string; // "Fabricator", "Supplier", "Contractor", etc.
  location: string;
  phoneNumber?: string;
  website?: string;
  verified: boolean;
  
  // Ad Settings
  type: AdType;
  placement: AdPlacement[];
  targetAudience?: "all" | "homeowners" | "pros";
  
  // Scheduling
  status: AdStatus;
  startDate: number;
  endDate: number;
  createdAt: number;
  
  // Performance
  impressions: number;
  clicks: number;
  creditsSpent: number;
  dailyBudget: number; // credits per day
}

export interface AdCredits {
  total: number;
  spent: number;
  available: number;
  transactions: AdCreditTransaction[];
}

export interface AdCreditTransaction {
  id: string;
  type: "purchase" | "spent" | "refund";
  amount: number;
  description: string;
  timestamp: number;
  adId?: string;
}

export interface AdCreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  popular?: boolean;
  bonus?: number; // Bonus credits
}

interface NativeAdsState {
  // Ads
  ads: NativeAd[];
  myAds: NativeAd[];
  
  // Credits
  credits: AdCredits;
  
  // Actions
  createAd: (ad: Omit<NativeAd, "id" | "createdAt" | "impressions" | "clicks" | "creditsSpent">) => string;
  updateAd: (adId: string, updates: Partial<NativeAd>) => void;
  deleteAd: (adId: string) => void;
  pauseAd: (adId: string) => void;
  resumeAd: (adId: string) => void;
  
  // Credits
  purchaseCredits: (packageId: string) => void;
  spendCredits: (amount: number, adId: string, description: string) => boolean;
  
  // Display
  getAdsByPlacement: (placement: AdPlacement) => NativeAd[];
  getActiveAds: () => NativeAd[];
  trackImpression: (adId: string) => void;
  trackClick: (adId: string) => void;
  
  // User ads
  getMyAds: (userId: string) => NativeAd[];
  
  // Mock data
  loadMockAds: () => void;
}

// Credit packages
export const AD_CREDIT_PACKAGES: AdCreditPackage[] = [
  {
    id: "starter",
    name: "Starter",
    credits: 100,
    price: 9.99,
  },
  {
    id: "growth",
    name: "Growth",
    credits: 500,
    price: 39.99,
    popular: true,
    bonus: 50,
  },
  {
    id: "professional",
    name: "Professional",
    credits: 1000,
    price: 69.99,
    bonus: 150,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    credits: 5000,
    price: 299.99,
    bonus: 1000,
  },
];

// Cost per ad type (in credits)
export const AD_COSTS = {
  banner: 1, // 1 credit per day
  featured: 3, // 3 credits per day
  sponsored: 2, // 2 credits per day
  tooltip: 5, // 5 credits per day
};

export const useNativeAdsStore = create<NativeAdsState>()(
  persist(
    (set, get) => ({
      ads: [],
      myAds: [],
      credits: {
        total: 0,
        spent: 0,
        available: 0,
        transactions: [],
      },

      createAd: (adData) => {
        const newAd: NativeAd = {
          ...adData,
          id: `ad-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          createdAt: Date.now(),
          impressions: 0,
          clicks: 0,
          creditsSpent: 0,
        };

        set((state) => ({
          ads: [...state.ads, newAd],
          myAds: [...state.myAds, newAd],
        }));

        return newAd.id;
      },

      updateAd: (adId, updates) => {
        set((state) => ({
          ads: state.ads.map((ad) => (ad.id === adId ? { ...ad, ...updates } : ad)),
          myAds: state.myAds.map((ad) => (ad.id === adId ? { ...ad, ...updates } : ad)),
        }));
      },

      deleteAd: (adId) => {
        set((state) => ({
          ads: state.ads.filter((ad) => ad.id !== adId),
          myAds: state.myAds.filter((ad) => ad.id !== adId),
        }));
      },

      pauseAd: (adId) => {
        get().updateAd(adId, { status: "paused" });
      },

      resumeAd: (adId) => {
        get().updateAd(adId, { status: "active" });
      },

      purchaseCredits: (packageId) => {
        const pkg = AD_CREDIT_PACKAGES.find((p) => p.id === packageId);
        if (!pkg) return;

        const totalCredits = pkg.credits + (pkg.bonus || 0);

        const transaction: AdCreditTransaction = {
          id: `tx-${Date.now()}`,
          type: "purchase",
          amount: totalCredits,
          description: `Purchased ${pkg.name} package`,
          timestamp: Date.now(),
        };

        set((state) => ({
          credits: {
            total: state.credits.total + totalCredits,
            spent: state.credits.spent,
            available: state.credits.available + totalCredits,
            transactions: [transaction, ...state.credits.transactions],
          },
        }));
      },

      spendCredits: (amount, adId, description) => {
        const { credits } = get();
        
        if (credits.available < amount) {
          return false; // Not enough credits
        }

        const transaction: AdCreditTransaction = {
          id: `tx-${Date.now()}`,
          type: "spent",
          amount: -amount,
          description,
          timestamp: Date.now(),
          adId,
        };

        set((state) => ({
          credits: {
            total: state.credits.total,
            spent: state.credits.spent + amount,
            available: state.credits.available - amount,
            transactions: [transaction, ...state.credits.transactions],
          },
          ads: state.ads.map((ad) =>
            ad.id === adId ? { ...ad, creditsSpent: ad.creditsSpent + amount } : ad
          ),
        }));

        return true;
      },

      getAdsByPlacement: (placement) => {
        const now = Date.now();
        return get()
          .ads.filter(
            (ad) =>
              ad.status === "active" &&
              ad.placement.includes(placement) &&
              ad.startDate <= now &&
              ad.endDate >= now
          )
          .sort((a, b) => b.creditsSpent - a.creditsSpent); // Prioritize higher spenders
      },

      getActiveAds: () => {
        const now = Date.now();
        return get().ads.filter(
          (ad) => ad.status === "active" && ad.startDate <= now && ad.endDate >= now
        );
      },

      trackImpression: (adId) => {
        set((state) => ({
          ads: state.ads.map((ad) =>
            ad.id === adId ? { ...ad, impressions: ad.impressions + 1 } : ad
          ),
        }));
      },

      trackClick: (adId) => {
        set((state) => ({
          ads: state.ads.map((ad) =>
            ad.id === adId ? { ...ad, clicks: ad.clicks + 1 } : ad
          ),
        }));
      },

      getMyAds: (userId) => {
        return get().ads.filter((ad) => ad.userId === userId);
      },

      loadMockAds: () => {
        const mockAds: NativeAd[] = [
          {
            id: "ad-surprise-granite",
            userId: "user-sg",
            userType: "vendor",
            title: "Premium Granite Slabs",
            description: "50+ colors in stock. Visit our showroom in Surprise, AZ",
            imageUrl: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800",
            ctaText: "Call Now",
            ctaAction: "call",
            ctaValue: "(623) 555-0123",
            businessName: "Surprise Granite Countertops",
            businessType: "Fabricator & Supplier",
            location: "Surprise, AZ",
            phoneNumber: "(623) 555-0123",
            website: "surprisegranite.com",
            verified: true,
            type: "featured",
            placement: ["home", "listings"],
            targetAudience: "all",
            status: "active",
            startDate: Date.now() - 86400000,
            endDate: Date.now() + 86400000 * 30,
            createdAt: Date.now() - 86400000 * 5,
            impressions: 1250,
            clicks: 83,
            creditsSpent: 45,
            dailyBudget: 10,
          },
        ];

        set({ ads: mockAds });
      },
    }),
    {
      name: "native-ads-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
