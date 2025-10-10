export type AchievementType = 
  | "first_listing"
  | "first_sale" 
  | "first_purchase"
  | "seller_level_5"
  | "seller_level_10"
  | "five_star_rating"
  | "early_bird"
  | "bargain_hunter"
  | "power_seller"
  | "community_hero"
  | "streak_7"
  | "streak_30"
  | "referral_champion";

export interface Achievement {
  id: AchievementType;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: number;
  progress?: number;
  maxProgress?: number;
  reward?: {
    type: "credits" | "badge";
    amount?: number;
  };
}

export interface UserStreak {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: number;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  avatar?: string;
  score: number;
  rank: number;
  badge?: string;
}
