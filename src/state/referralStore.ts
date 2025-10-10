import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ReferralState {
  referralCode: string;
  referredBy: string | null;
  referredUsers: string[];
  totalReferralCredits: number;
  
  generateReferralCode: (userId: string) => void;
  trackReferral: (referrerCode: string, newUserId: string) => void;
  getReferralReward: () => number;
  shareReferralCode: () => string;
}

export const useReferralStore = create<ReferralState>()(
  persist(
    (set, get) => ({
      referralCode: "",
      referredBy: null,
      referredUsers: [],
      totalReferralCredits: 0,

      generateReferralCode: (userId: string) => {
        const code = `STONE${userId.slice(-6).toUpperCase()}`;
        set({ referralCode: code });
      },

      trackReferral: (referrerCode: string, _newUserId: string) => {
        set({
          referredBy: referrerCode,
        });

        // In real app, would notify referrer via backend
        // For now, just track locally
      },

      getReferralReward: () => {
        const { referredUsers } = get();
        return referredUsers.length * 20; // 20 credits per referral
      },

      shareReferralCode: () => {
        const { referralCode } = get();
        return `Join Stone Swap and get 10 free credits! Use my code: ${referralCode}\n\nDownload: https://stoneswap.app/download`;
      },
    }),
    {
      name: "referral-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
