import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "../types/marketplace";
import { API_CONFIG } from "../config/env";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, userType?: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  completeOnboarding: () => void;
  addCredits: (amount: number) => void;
  deductCredits: (amount: number) => boolean;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isOnboarded: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`${API_CONFIG.baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Login failed');
          }

          const user: User = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            rating: 5.0,
            reviewCount: 0,
            credits: data.user.credits || 5,
            joinedAt: Date.now(),
            listingCount: 0,
            userType: data.user.userType || 'homeowner',
            adCredits: data.user.adCredits || 0,
            shopify: data.user.shopify,
          };

          set({
            user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Login failed',
          });
          throw error;
        }
      },

      signup: async (email: string, password: string, name: string, userType: string = 'homeowner') => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`${API_CONFIG.baseUrl}/api/auth/signup`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, name, userType }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Signup failed');
          }

          const user: User = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            rating: 5.0,
            reviewCount: 0,
            credits: data.user.credits || 5,
            joinedAt: Date.now(),
            listingCount: 0,
            userType: data.user.userType || userType,
            adCredits: data.user.adCredits || 0,
          };

          set({
            user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Signup failed',
          });
          throw error;
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, error: null });
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

      clearError: () => {
        set({ error: null });
      },

      refreshProfile: async () => {
        const { token } = get();
        if (!token) return;

        try {
          const response = await fetch(`${API_CONFIG.baseUrl}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (response.ok && data.user) {
            const { user: currentUser } = get();
            set({
              user: {
                ...currentUser,
                id: data.user.id,
                email: data.user.email,
                name: data.user.name,
                credits: data.user.credits,
                adCredits: data.user.adCredits,
                userType: data.user.userType,
                shopify: data.user.shopify,
              } as User,
            });
          }
        } catch (error) {
          console.error('Failed to refresh profile:', error);
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        isOnboarded: state.isOnboarded,
      }),
    }
  )
);
