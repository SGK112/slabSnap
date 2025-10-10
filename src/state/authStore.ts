import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "../types/marketplace";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  completeOnboarding: () => void;
  addCredits: (amount: number) => void;
  deductCredits: (amount: number) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isOnboarded: false,

      login: async (email: string, _password: string) => {
        // Mock login - in production, integrate with real auth
        const mockUser: User = {
          id: "user-" + Date.now(),
          email,
          name: email.split("@")[0],
          rating: 5.0,
          reviewCount: 0,
          credits: 5, // Give 5 free credits on login
          joinedAt: Date.now(),
          listingCount: 0,
          userType: "homeowner",
          adCredits: 0,
        };
        
        set({ user: mockUser, isAuthenticated: true });
      },

      signup: async (email: string, _password: string, name: string) => {
        // Mock signup - in production, integrate with real auth
        const mockUser: User = {
          id: "user-" + Date.now(),
          email,
          name,
          rating: 5.0,
          reviewCount: 0,
          credits: 5, // Give 5 free credits on signup
          joinedAt: Date.now(),
          listingCount: 0,
          userType: "homeowner", // Default, will be updated in SignupScreen
          adCredits: 0, // Default, will be updated based on account type
        };
        
        set({ user: mockUser, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      updateUser: (updates: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...updates } });
        }
      },

      completeOnboarding: () => {
        set({ isOnboarded: true });
      },

      addCredits: (amount: number) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, credits: user.credits + amount } });
        }
      },

      deductCredits: (amount: number) => {
        const { user } = get();
        if (user && user.credits >= amount) {
          set({ user: { ...user, credits: user.credits - amount } });
          return true;
        }
        return false;
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
