import { useState, useCallback, useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as SecureStore from "expo-secure-store";
import { useAuthStore } from "../state/authStore";

// Complete web browser session for proper redirect handling
WebBrowser.maybeCompleteAuthSession();

// Google OAuth Client IDs for Remodely LLC
const GOOGLE_CLIENT_IDS = {
  ios: "254256003480-1da758ce6na2pr5j45qnc771t01kdem9.apps.googleusercontent.com",
  web: "254256003480-hn3ak5dcnbvjrrhqtrv55u9nntk62nav.apps.googleusercontent.com",
};

// Secure storage keys
const SECURE_KEYS = {
  accessToken: "google_access_token",
  refreshToken: "google_refresh_token",
  idToken: "google_id_token",
};

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  givenName?: string;
  familyName?: string;
}

export interface UseGoogleAuthReturn {
  signInWithGoogle: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useGoogleAuth(): UseGoogleAuthReturn {
  const { loginWithGoogle } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use Expo's Google auth provider
  // Only use iOS client ID for native builds - it handles its own redirect URI
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_CLIENT_IDS.ios,
    // Don't set webClientId - we want to use native iOS OAuth
  });

  // Handle the auth response
  useEffect(() => {
    const handleResponse = async () => {

      if (response?.type === "success") {
        setIsLoading(true);
        try {
          const { authentication } = response;

          if (!authentication?.accessToken) {
            throw new Error("No access token received");
          }


          // Store tokens securely
          await SecureStore.setItemAsync(SECURE_KEYS.accessToken, authentication.accessToken);
          if (authentication.idToken) {
            await SecureStore.setItemAsync(SECURE_KEYS.idToken, authentication.idToken);
          }

          // Fetch user info from Google
          const userInfoResponse = await fetch(
            "https://www.googleapis.com/userinfo/v2/me",
            {
              headers: { Authorization: `Bearer ${authentication.accessToken}` },
            }
          );

          if (!userInfoResponse.ok) {
            throw new Error("Failed to fetch user info from Google");
          }

          const userInfo: GoogleUser = await userInfoResponse.json();

          // Login with the Google user info
          await loginWithGoogle({
            id: userInfo.id,
            email: userInfo.email,
            name: userInfo.name || `${userInfo.givenName || ""} ${userInfo.familyName || ""}`.trim(),
            avatar: userInfo.picture,
            accessToken: authentication.accessToken,
            idToken: authentication.idToken,
          });
        } catch (err: any) {
          setError(err.message || "Google sign-in failed");
          await clearStoredTokens();
        } finally {
          setIsLoading(false);
        }
      } else if (response?.type === "error") {
        setError(response.error?.message || "Google sign-in failed");
        setIsLoading(false);
      } else if (response?.type === "cancel" || response?.type === "dismiss") {
        setIsLoading(false);
      }
    };

    if (response) {
      handleResponse();
    }
  }, [response, loginWithGoogle]);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      // Dismiss any existing browser first
      WebBrowser.dismissBrowser().catch(() => {});

      if (!request) {
        throw new Error("Google auth not ready. Please try again.");
      }

      // Start the auth flow
      const result = await promptAsync();

      // If cancelled immediately, reset loading
      if (result?.type === "cancel" || result?.type === "dismiss") {
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "Google sign-in failed");
      setIsLoading(false);
    }
  }, [promptAsync, request]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    signInWithGoogle,
    isLoading,
    error,
    clearError,
  };
}

// Helper to clear stored tokens (for logout)
export async function clearStoredTokens(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SECURE_KEYS.accessToken);
    await SecureStore.deleteItemAsync(SECURE_KEYS.refreshToken);
    await SecureStore.deleteItemAsync(SECURE_KEYS.idToken);
  } catch {
    // Silently handle token clearing errors
  }
}

// Helper to get stored access token
export async function getStoredAccessToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(SECURE_KEYS.accessToken);
  } catch {
    return null;
  }
}

// Helper to check if user has stored Google credentials
export async function hasStoredGoogleCredentials(): Promise<boolean> {
  const token = await getStoredAccessToken();
  return !!token;
}
