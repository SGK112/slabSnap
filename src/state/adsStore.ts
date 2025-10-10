import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AdsState {
  adsEnabled: boolean;
  dismissedAds: string[]; // IDs of dismissed ads
  lastShownAdTimestamp: number;
  toggleAds: () => void;
  dismissAd: (adId: string) => void;
  shouldShowAd: (adId: string, cooldownMinutes?: number) => boolean;
  updateLastShownAdTimestamp: () => void;
}

export const useAdsStore = create<AdsState>()(
  persist(
    (set, get) => ({
      adsEnabled: true, // Always enabled, no toggle
      dismissedAds: [],
      lastShownAdTimestamp: 0,

      toggleAds: () => {
        // Ads are always enabled - this function is deprecated
        // Keep for backwards compatibility but do nothing
      },

      dismissAd: (adId: string) => {
        set((state) => ({
          dismissedAds: [...state.dismissedAds, adId],
        }));
      },

      shouldShowAd: (adId: string, cooldownMinutes = 30) => {
        const state = get();
        
        // Ads are always enabled for collaboration
        // Check if ads are enabled - always true now
        
        // Check if this specific ad was dismissed
        if (state.dismissedAds.includes(adId)) return false;
        
        // Check cooldown period
        const now = Date.now();
        const cooldownMs = cooldownMinutes * 60 * 1000;
        if (now - state.lastShownAdTimestamp < cooldownMs) return false;
        
        return true;
      },

      updateLastShownAdTimestamp: () => {
        set({ lastShownAdTimestamp: Date.now() });
      },
    }),
    {
      name: "ads-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
