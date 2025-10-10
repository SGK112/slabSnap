import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Achievement, AchievementType, UserStreak } from "../types/gamification";

interface GamificationState {
  achievements: Achievement[];
  unlockedAchievements: AchievementType[];
  streak: UserStreak;
  totalPoints: number;
  level: number;
  showAchievementPopup: Achievement | null;
  
  initializeAchievements: () => void;
  unlockAchievement: (achievementId: AchievementType) => void;
  updateStreak: () => void;
  addPoints: (points: number) => void;
  dismissAchievementPopup: () => void;
  checkAndUnlockAchievements: (stats: {
    listingCount?: number;
    salesCount?: number;
    purchaseCount?: number;
    rating?: number;
  }) => void;
}

const ALL_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_listing",
    title: "First Steps",
    description: "Create your first listing",
    icon: "add-circle",
    reward: { type: "credits", amount: 5 },
  },
  {
    id: "first_sale",
    title: "Deal Maker",
    description: "Complete your first sale",
    icon: "cash",
    reward: { type: "credits", amount: 10 },
  },
  {
    id: "first_purchase",
    title: "Stone Collector",
    description: "Make your first purchase",
    icon: "cart",
    reward: { type: "credits", amount: 5 },
  },
  {
    id: "seller_level_5",
    title: "Rising Star",
    description: "Sell 5 items",
    icon: "star",
    reward: { type: "credits", amount: 20 },
  },
  {
    id: "seller_level_10",
    title: "Power Seller",
    description: "Sell 10 items",
    icon: "trophy",
    reward: { type: "credits", amount: 50 },
  },
  {
    id: "five_star_rating",
    title: "Perfect Rating",
    description: "Achieve a 5.0 rating",
    icon: "star",
    reward: { type: "badge" },
  },
  {
    id: "streak_7",
    title: "Week Warrior",
    description: "Log in for 7 days straight",
    icon: "flame",
    reward: { type: "credits", amount: 15 },
  },
  {
    id: "streak_30",
    title: "Dedication Master",
    description: "Log in for 30 days straight",
    icon: "flame",
    reward: { type: "credits", amount: 100 },
  },
  {
    id: "early_bird",
    title: "Early Bird",
    description: "List an item before 8 AM",
    icon: "sunny",
    reward: { type: "credits", amount: 5 },
  },
  {
    id: "bargain_hunter",
    title: "Bargain Hunter",
    description: "Save 50% or more on a purchase",
    icon: "pricetag",
    reward: { type: "credits", amount: 10 },
  },
  {
    id: "referral_champion",
    title: "Referral Champion",
    description: "Invite 5 friends who join",
    icon: "people",
    reward: { type: "credits", amount: 100 },
  },
];

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      achievements: [],
      unlockedAchievements: [],
      streak: {
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: 0,
      },
      totalPoints: 0,
      level: 1,
      showAchievementPopup: null,

      initializeAchievements: () => {
        set({ achievements: ALL_ACHIEVEMENTS });
      },

      unlockAchievement: (achievementId: AchievementType) => {
        const { unlockedAchievements, achievements } = get();
        
        if (unlockedAchievements.includes(achievementId)) {
          return; // Already unlocked
        }

        const achievement = achievements.find((a) => a.id === achievementId);
        if (!achievement) return;

        const unlockedAchievement = {
          ...achievement,
          unlockedAt: Date.now(),
        };

        set({
          unlockedAchievements: [...unlockedAchievements, achievementId],
          showAchievementPopup: unlockedAchievement,
        });

        // Add reward points
        if (achievement.reward?.type === "credits" && achievement.reward.amount) {
          get().addPoints(achievement.reward.amount);
        }
      },

      updateStreak: () => {
        const { streak } = get();
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        const lastActive = streak.lastActiveDate;

        if (!lastActive) {
          // First time
          set({
            streak: {
              currentStreak: 1,
              longestStreak: 1,
              lastActiveDate: now,
            },
          });
          return;
        }

        const daysSinceLastActive = Math.floor((now - lastActive) / oneDay);

        if (daysSinceLastActive === 0) {
          // Same day, no change
          return;
        } else if (daysSinceLastActive === 1) {
          // Next day, increment streak
          const newStreak = streak.currentStreak + 1;
          set({
            streak: {
              currentStreak: newStreak,
              longestStreak: Math.max(newStreak, streak.longestStreak),
              lastActiveDate: now,
            },
          });

          // Check streak achievements
          if (newStreak === 7) {
            get().unlockAchievement("streak_7");
          }
          if (newStreak === 30) {
            get().unlockAchievement("streak_30");
          }
        } else {
          // Streak broken
          set({
            streak: {
              ...streak,
              currentStreak: 1,
              lastActiveDate: now,
            },
          });
        }
      },

      addPoints: (points: number) => {
        const { totalPoints } = get();
        const newTotal = totalPoints + points;
        const newLevel = Math.floor(newTotal / 100) + 1;

        set({
          totalPoints: newTotal,
          level: newLevel,
        });
      },

      dismissAchievementPopup: () => {
        set({ showAchievementPopup: null });
      },

      checkAndUnlockAchievements: (stats) => {
        const { unlockAchievement } = get();

        if (stats.listingCount && stats.listingCount >= 1) {
          unlockAchievement("first_listing");
        }
        if (stats.salesCount && stats.salesCount >= 1) {
          unlockAchievement("first_sale");
        }
        if (stats.salesCount && stats.salesCount >= 5) {
          unlockAchievement("seller_level_5");
        }
        if (stats.salesCount && stats.salesCount >= 10) {
          unlockAchievement("seller_level_10");
        }
        if (stats.purchaseCount && stats.purchaseCount >= 1) {
          unlockAchievement("first_purchase");
        }
        if (stats.rating && stats.rating === 5.0) {
          unlockAchievement("five_star_rating");
        }
      },
    }),
    {
      name: "gamification-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
