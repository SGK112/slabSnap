import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "../types/marketplace";
import { API_CONFIG } from "../config/env";

// PRODUCTION: Set to false for real authentication
// Only set to true for local development without backend
const USE_MOCK_AUTH = false;

// Mock user for testing
const MOCK_USER: User = {
  id: "mock-user-1",
  email: "test@test.com",
  name: "Demo User",
  avatar: undefined,
  phone: "(555) 123-4567",
  location: "Phoenix, AZ",
  bio: "Remodeling enthusiast exploring materials and deals",
  rating: 4.8,
  reviewCount: 12,
  credits: 10,
  joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 30, // 30 days ago
  listingCount: 3,
  userType: "homeowner",
  businessName: undefined,
  verified: true,
  adCredits: 5,
  integrations: {
    shopify: undefined,
    slack: undefined,
    googleCalendar: undefined,
    stripe: undefined,
  },
};

// Project types for matching with contractors
export type ProjectType =
  | "kitchen"
  | "bathroom"
  | "outdoor"
  | "flooring"
  | "countertops"
  | "plumbing"
  | "electrical"
  | "landscaping"
  | "general";

// Project intent from quiz
export interface ProjectIntent {
  id: string;
  type: ProjectType;
  subtype?: string;
  description?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  budget?: "low" | "medium" | "high" | "luxury";
  timeline?: "urgent" | "soon" | "planning" | "exploring";
  diyLevel?: "full_diy" | "some_help" | "full_pro";
  createdAt: number;
}

// Badges earned from quizzes and activities
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt?: number;
  category: "quiz" | "project" | "engagement" | "achievement";
}

// Style preferences from quiz
interface StylePreferences {
  primaryStyle?: string;
  secondaryStyle?: string;
  colorPalette?: string;
  materialPreference?: string;
  styleName?: string;
  onboardingComplete?: boolean;
  // New project-focused preferences
  projectTypes?: ProjectType[];
  activeProjects?: ProjectIntent[];
  completedQuizzes?: string[];
  badges?: Badge[];
  preferredContractorTypes?: string[];
  budgetRange?: string;
  timelinePreference?: string;
}

// Google Auth payload
interface GoogleAuthPayload {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  accessToken: string;
  idToken?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isLoading: boolean;
  error: string | null;
  preferences: StylePreferences;
  authProvider: "email" | "google" | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (payload: GoogleAuthPayload) => Promise<void>;
  signup: (email: string, password: string, name: string, userType?: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  updatePreferences: (updates: Partial<StylePreferences>) => void;
  completeOnboarding: () => void;
  addCredits: (amount: number) => void;
  deductCredits: (amount: number) => boolean;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
  // New project/quiz functions
  addBadge: (badge: Badge) => void;
  addProject: (project: ProjectIntent) => void;
  completeQuiz: (quizId: string) => void;
  hasBadge: (badgeId: string) => boolean;
  hasCompletedQuiz: (quizId: string) => boolean;
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
      preferences: {},
      authProvider: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        // Mock authentication for testing
        if (USE_MOCK_AUTH) {
          // Simulate network delay
          await new Promise(resolve => setTimeout(resolve, 500));

          // Accept any email/password for demo
          const user: User = {
            ...MOCK_USER,
            email: email,
            name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
          };

          set({
            user,
            token: 'mock-token-' + Date.now(),
            isAuthenticated: true,
            isLoading: false,
            error: null,
            authProvider: "email",
          });
          return;
        }

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
            authProvider: "email",
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Login failed',
          });
          throw error;
        }
      },

      loginWithGoogle: async (payload: GoogleAuthPayload) => {
        set({ isLoading: true, error: null });

        try {
          // Create user from Google payload
          const user: User = {
            id: `google-${payload.id}`,
            email: payload.email,
            name: payload.name,
            avatar: payload.avatar,
            rating: 5.0,
            reviewCount: 0,
            credits: 5, // New users get 5 credits
            joinedAt: Date.now(),
            listingCount: 0,
            userType: "homeowner",
            adCredits: 0,
            verified: true, // Google users are auto-verified
          };

          // In production, you would send the idToken to your backend
          // to verify it and create/update the user in your database
          // const response = await fetch(`${API_CONFIG.baseUrl}/api/auth/google`, {
          //   method: 'POST',
          //   headers: { 'Content-Type': 'application/json' },
          //   body: JSON.stringify({ idToken: payload.idToken }),
          // });

          set({
            user,
            token: payload.accessToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            authProvider: "google",
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Google sign-in failed',
          });
          throw error;
        }
      },

      signup: async (email: string, password: string, name: string, userType: string = 'homeowner') => {
        set({ isLoading: true, error: null });

        // Mock signup for testing
        if (USE_MOCK_AUTH) {
          // Simulate network delay
          await new Promise(resolve => setTimeout(resolve, 500));

          const user: User = {
            ...MOCK_USER,
            id: 'user-' + Date.now(),
            email: email,
            name: name,
            userType: userType as any,
            joinedAt: Date.now(),
            credits: 5, // New users get 5 credits
            reviewCount: 0,
            listingCount: 0,
          };

          set({
            user,
            token: 'mock-token-' + Date.now(),
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return;
        }

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
        set({ user: null, token: null, isAuthenticated: false, error: null, authProvider: null });
      },

      updateUser: (updates: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...updates } });
        }
      },

      updatePreferences: (updates: Partial<StylePreferences>) => {
        const { preferences } = get();
        set({ preferences: { ...preferences, ...updates } });
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

      addBadge: (badge: Badge) => {
        const { preferences } = get();
        const existingBadges = preferences.badges || [];
        // Don't add duplicates
        if (existingBadges.some(b => b.id === badge.id)) return;

        const newBadge = { ...badge, earnedAt: Date.now() };
        set({
          preferences: {
            ...preferences,
            badges: [...existingBadges, newBadge],
          },
        });
      },

      addProject: (project: ProjectIntent) => {
        const { preferences } = get();
        const existingProjects = preferences.activeProjects || [];
        set({
          preferences: {
            ...preferences,
            activeProjects: [...existingProjects, project],
            projectTypes: [
              ...new Set([...(preferences.projectTypes || []), project.type]),
            ],
          },
        });
      },

      completeQuiz: (quizId: string) => {
        const { preferences } = get();
        const completedQuizzes = preferences.completedQuizzes || [];
        if (completedQuizzes.includes(quizId)) return;

        set({
          preferences: {
            ...preferences,
            completedQuizzes: [...completedQuizzes, quizId],
          },
        });
      },

      hasBadge: (badgeId: string) => {
        const { preferences } = get();
        return (preferences.badges || []).some(b => b.id === badgeId);
      },

      hasCompletedQuiz: (quizId: string) => {
        const { preferences } = get();
        return (preferences.completedQuizzes || []).includes(quizId);
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
        preferences: state.preferences,
        authProvider: state.authProvider,
      }),
    }
  )
);
