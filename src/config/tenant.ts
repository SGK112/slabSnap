/**
 * Multi-Tenant Configuration for White-Label Deployment
 *
 * This file defines the tenant configuration system for white-labeling
 * the Remodely.AI app for different customers/brands.
 */

export interface TenantFeatures {
  marketplace: boolean;
  roomDesigner: boolean;
  voiceCalls: boolean;
  vendorMap: boolean;
  measurements: boolean;
  quoteRequests: boolean;
  proNetwork: boolean;
  gamification: boolean;
}

export interface TenantBranding {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  headerGradient?: [string, string];
  darkMode?: boolean;
}

export interface TenantConfig {
  id: string;
  name: string;
  displayName: string;
  logo: any; // require() for local asset or URL string
  icon: any;
  branding: TenantBranding;
  vendorFilter?: string[]; // Only show certain vendors (by vendor ID)
  regionFilter?: {
    states?: string[];
    zipCodes?: string[];
    cities?: string[];
  };
  features: TenantFeatures;
  contactInfo?: {
    supportEmail?: string;
    supportPhone?: string;
    website?: string;
  };
  analytics?: {
    googleAnalyticsId?: string;
    mixpanelToken?: string;
  };
  apiEndpoint?: string;
}

// Default tenant (Remodely.AI)
export const DEFAULT_TENANT: TenantConfig = {
  id: 'remodely',
  name: 'REMODELY.AI',
  displayName: 'REMODELY.AI',
  logo: require('../../assets/remodely-logo.svg'),
  icon: require('../../assets/remodely-icon.svg'),
  branding: {
    primaryColor: '#6366f1', // Indigo
    secondaryColor: '#8b5cf6', // Violet
    accentColor: '#f97316', // Orange (from colors.accent)
    headerGradient: ['#6366f1', '#8b5cf6'],
  },
  features: {
    marketplace: true,
    roomDesigner: true,
    voiceCalls: true,
    vendorMap: true,
    measurements: true,
    quoteRequests: true,
    proNetwork: true,
    gamification: true,
  },
  contactInfo: {
    supportEmail: 'support@remodely.ai',
    website: 'https://remodely.ai',
  },
};

// Surprise Granite tenant (future white-label)
export const SURPRISE_GRANITE_TENANT: TenantConfig = {
  id: 'surprise-granite',
  name: 'Surprise Granite',
  displayName: 'Surprise Granite',
  logo: require('../../assets/remodely-logo.svg'), // Would be replaced with SG logo
  icon: require('../../assets/remodely-icon.svg'),
  branding: {
    primaryColor: '#1a1a2e', // Dark navy
    secondaryColor: '#f97316', // Orange accent
    accentColor: '#f97316',
    headerGradient: ['#1a1a2e', '#374151'],
  },
  vendorFilter: ['sg-main'], // Only show Surprise Granite as vendor
  regionFilter: {
    states: ['AZ'],
    cities: ['Surprise', 'Phoenix', 'Peoria', 'Sun City', 'Glendale'],
  },
  features: {
    marketplace: true,
    roomDesigner: true,
    voiceCalls: true,
    vendorMap: true,
    measurements: true,
    quoteRequests: true,
    proNetwork: false, // SG doesn't need pro network
    gamification: false, // Simpler experience
  },
  contactInfo: {
    supportEmail: 'info@surprisegranite.com',
    supportPhone: '(602) 833-3189',
    website: 'https://www.surprisegranite.com',
  },
};

// Tenant registry for easy lookup
export const TENANT_REGISTRY: Record<string, TenantConfig> = {
  remodely: DEFAULT_TENANT,
  'surprise-granite': SURPRISE_GRANITE_TENANT,
};

// Get current tenant (would be set at app initialization based on build config or runtime detection)
let currentTenant: TenantConfig = DEFAULT_TENANT;

export const getCurrentTenant = (): TenantConfig => currentTenant;

export const setCurrentTenant = (tenantId: string): TenantConfig => {
  const tenant = TENANT_REGISTRY[tenantId];
  if (tenant) {
    currentTenant = tenant;
  }
  return currentTenant;
};

// Helper to check if a feature is enabled for current tenant
export const isFeatureEnabled = (feature: keyof TenantFeatures): boolean => {
  return currentTenant.features[feature];
};

// Helper to get branding colors
export const getBrandingColors = (): TenantBranding => {
  return currentTenant.branding;
};

// Helper to check if vendor is allowed for current tenant
export const isVendorAllowed = (vendorId: string): boolean => {
  if (!currentTenant.vendorFilter || currentTenant.vendorFilter.length === 0) {
    return true; // No filter = all vendors allowed
  }
  return currentTenant.vendorFilter.includes(vendorId);
};

// Helper to check if region is allowed for current tenant
export const isRegionAllowed = (
  state?: string,
  city?: string,
  zipCode?: string
): boolean => {
  const filter = currentTenant.regionFilter;
  if (!filter) return true; // No filter = all regions allowed

  if (filter.states && state && !filter.states.includes(state)) {
    return false;
  }
  if (filter.cities && city && !filter.cities.includes(city)) {
    return false;
  }
  if (filter.zipCodes && zipCode && !filter.zipCodes.includes(zipCode)) {
    return false;
  }

  return true;
};
