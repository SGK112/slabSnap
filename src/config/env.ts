/**
 * REMODELY.AI - Environment Configuration
 * Centralized, secure access to environment variables
 */

// Helper to get env var with validation
const getEnvVar = (key: string, required: boolean = false): string => {
  const value = process.env[key];

  if (required && !value) {
    console.error(`Missing required environment variable: ${key}`);
    // In production, you might want to throw an error
    // throw new Error(`Missing required environment variable: ${key}`);
  }

  return value || '';
};

// Validate that a key looks like a real API key (not placeholder)
const isValidApiKey = (key: string, prefix?: string): boolean => {
  if (!key) return false;
  if (key.includes('your-') || key.includes('...')) return false;
  if (prefix && !key.startsWith(prefix)) return false;
  return key.length > 20;
};

/**
 * AI Services Configuration
 */
export const AI_CONFIG = {
  openai: {
    apiKey: getEnvVar('EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY'),
    get isConfigured() {
      return isValidApiKey(this.apiKey, 'sk-');
    },
  },
  anthropic: {
    apiKey: getEnvVar('EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY'),
    get isConfigured() {
      return isValidApiKey(this.apiKey, 'sk-ant-');
    },
  },
  grok: {
    apiKey: getEnvVar('EXPO_PUBLIC_VIBECODE_GROK_API_KEY'),
    get isConfigured() {
      return isValidApiKey(this.apiKey, 'xai-');
    },
  },
  google: {
    apiKey: getEnvVar('EXPO_PUBLIC_VIBECODE_GOOGLE_API_KEY'),
    get isConfigured() {
      return isValidApiKey(this.apiKey);
    },
  },
  elevenlabs: {
    apiKey: getEnvVar('EXPO_PUBLIC_VIBECODE_ELEVENLABS_API_KEY'),
    get isConfigured() {
      return isValidApiKey(this.apiKey);
    },
  },
};

/**
 * Google Maps Configuration
 */
export const MAPS_CONFIG = {
  apiKey: getEnvVar('EXPO_PUBLIC_GOOGLE_MAPS_API_KEY'),
  get isConfigured() {
    return isValidApiKey(this.apiKey, 'AIza');
  },
};

/**
 * Stripe Configuration
 */
export const STRIPE_CONFIG = {
  publishableKey: getEnvVar('EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
  // Note: Secret key should ONLY be used on backend server, never in app
  get isConfigured() {
    return isValidApiKey(this.publishableKey, 'pk_');
  },
};

/**
 * Vibecode Services Configuration
 */
export const VIBECODE_CONFIG = {
  projectId: getEnvVar('EXPO_PUBLIC_VIBECODE_PROJECT_ID'),
  get isConfigured() {
    return !!this.projectId && this.projectId.length > 10;
  },
};

/**
 * Shopify Configuration
 */
export const SHOPIFY_CONFIG = {
  apiKey: getEnvVar('EXPO_PUBLIC_SHOPIFY_API_KEY'),
  apiSecret: getEnvVar('EXPO_PUBLIC_SHOPIFY_API_SECRET'),
  scopes: 'read_products,read_orders,read_inventory',
  redirectUri: getEnvVar('EXPO_PUBLIC_SHOPIFY_REDIRECT_URI') || 'https://voiceflow-crm.onrender.com/api/shopify/callback',
  useDemoMode: getEnvVar('EXPO_PUBLIC_SHOPIFY_DEMO_MODE') !== 'false', // Default to demo mode
  get isConfigured() {
    return isValidApiKey(this.apiKey) && isValidApiKey(this.apiSecret);
  },
};

/**
 * API Configuration
 */
export const API_CONFIG = {
  baseUrl: getEnvVar('EXPO_PUBLIC_API_URL') || 'https://voiceflow-crm.onrender.com',
  version: getEnvVar('EXPO_PUBLIC_API_VERSION') || 'v1',
  useBackendProxy: getEnvVar('EXPO_PUBLIC_USE_BACKEND_PROXY') === 'true',
  get isConfigured() {
    return !!this.baseUrl && this.baseUrl.startsWith('http');
  },
};

/**
 * App Environment
 */
export const APP_ENV = {
  current: getEnvVar('EXPO_PUBLIC_APP_ENV') || 'development',
  isDevelopment: (getEnvVar('EXPO_PUBLIC_APP_ENV') || 'development') === 'development',
  isProduction: getEnvVar('EXPO_PUBLIC_APP_ENV') === 'production',
  isStaging: getEnvVar('EXPO_PUBLIC_APP_ENV') === 'staging',
};

/**
 * Validate all required configurations
 * Call this at app startup to warn about missing keys
 */
export const validateConfig = (): { valid: boolean; warnings: string[] } => {
  const warnings: string[] = [];

  // Required for core features
  if (!MAPS_CONFIG.isConfigured) {
    warnings.push('Google Maps API key not configured - map features will not work');
  }

  // Optional but recommended
  if (!AI_CONFIG.openai.isConfigured && !AI_CONFIG.anthropic.isConfigured) {
    warnings.push('No AI API keys configured - AI features will be disabled');
  }

  if (!STRIPE_CONFIG.isConfigured) {
    warnings.push('Stripe not configured - payment features will be disabled');
  }

  // Log warnings in development
  if (APP_ENV.isDevelopment && warnings.length > 0) {
    console.warn('=== Configuration Warnings ===');
    warnings.forEach(w => console.warn(`⚠️ ${w}`));
    console.warn('==============================');
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
};

/**
 * Feature flags based on configuration
 */
export const FEATURES = {
  get aiEnabled() {
    // AI is enabled if using backend proxy OR if direct API keys are configured
    return API_CONFIG.useBackendProxy || AI_CONFIG.openai.isConfigured || AI_CONFIG.anthropic.isConfigured;
  },
  get mapsEnabled() {
    return MAPS_CONFIG.isConfigured;
  },
  get paymentsEnabled() {
    return STRIPE_CONFIG.isConfigured;
  },
  get voiceEnabled() {
    // Voice is enabled if using backend proxy OR if ElevenLabs key is configured
    return API_CONFIG.useBackendProxy || AI_CONFIG.elevenlabs.isConfigured;
  },
  get backendProxyEnabled() {
    return API_CONFIG.useBackendProxy && API_CONFIG.isConfigured;
  },
};

export default {
  AI: AI_CONFIG,
  VIBECODE: VIBECODE_CONFIG,
  MAPS: MAPS_CONFIG,
  STRIPE: STRIPE_CONFIG,
  SHOPIFY: SHOPIFY_CONFIG,
  API: API_CONFIG,
  ENV: APP_ENV,
  FEATURES,
  validateConfig,
};
