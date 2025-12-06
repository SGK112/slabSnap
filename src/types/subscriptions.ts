/**
 * REMODELY.AI Subscription & Revenue System
 *
 * Revenue Streams:
 * 1. Vendor/Distributor Subscriptions - Monthly fee for product catalog, leads, specials
 * 2. Contractor Pro Subscriptions - Enhanced quoting, lead access, verification
 * 3. Promoted Listings - Pay to boost visibility (credits or subscription)
 * 4. Lead Fees - Pay-per-lead or included in subscription
 * 5. Transaction Fees - Small % on completed quotes/jobs (future)
 */

// ============================================
// SUBSCRIPTION TIERS
// ============================================

export type SubscriptionTier = "free" | "starter" | "pro" | "enterprise";
export type BillingCycle = "monthly" | "yearly";
export type UserRole = "homeowner" | "contractor" | "designer" | "vendor" | "distributor" | "fabricator";

// Vendor/Supplier Subscription Plans
export interface VendorSubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number; // Discount for annual
  features: {
    productListings: number | "unlimited"; // Number of products in catalog
    monthlySpecials: number | "unlimited"; // Promotional posts per month
    flyerUploads: number | "unlimited"; // PDF flyer uploads per month
    leadAccess: "none" | "limited" | "full"; // Access to contractor/homeowner leads
    leadsPerMonth: number | "unlimited";
    featuredPlacement: boolean; // Featured in search results
    analyticsAccess: "basic" | "advanced" | "full";
    apiAccess: boolean;
    dedicatedSupport: boolean;
    customBranding: boolean;
    multiLocation: boolean; // Multiple store locations
    teamMembers: number | "unlimited";
  };
  trialDays: number;
}

// Contractor/Pro Subscription Plans
export interface ProSubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: {
    quotesPerMonth: number | "unlimited";
    quoteTemplates: number | "unlimited";
    leadAccess: "none" | "limited" | "priority"; // Priority = first access to leads
    leadsPerMonth: number | "unlimited";
    portfolioProjects: number | "unlimited";
    verifiedBadge: boolean;
    featuredProfile: boolean;
    analyticsAccess: "basic" | "advanced";
    directMessaging: "limited" | "unlimited";
    teamMembers: number;
    jobScheduling: boolean;
    clientManagement: boolean; // CRM features
    invoicing: boolean;
  };
  trialDays: number;
}

// ============================================
// SUBSCRIPTION STATE
// ============================================

export type SubscriptionStatus = "active" | "trial" | "past_due" | "canceled" | "expired";

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  tier: SubscriptionTier;
  planType: "vendor" | "pro";
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  trialEndsAt?: number;
  canceledAt?: number;
  // Usage tracking
  usage: {
    productsListed?: number;
    specialsPosted?: number;
    flyersUploaded?: number;
    leadsReceived?: number;
    quotesCreated?: number;
  };
  // Stripe integration
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: number;
  updatedAt: number;
}

// ============================================
// PROMOTIONS & SPECIALS
// ============================================

export type PromotionType =
  | "flash_sale"      // Limited time discount
  | "clearance"       // Clearing inventory
  | "new_arrival"     // New product launch
  | "seasonal"        // Holiday/seasonal sale
  | "bundle"          // Buy together deal
  | "contractor_only" // Trade pricing
  | "flyer"           // Digital flyer/catalog
  | "announcement";   // General announcement

export interface Promotion {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorLogo?: string;
  type: PromotionType;
  title: string;
  description: string;
  // Rich content
  images: string[];
  videoUrl?: string;
  flyerPdf?: string; // PDF flyer URL
  // Targeting
  categories?: string[]; // Material categories this applies to
  productIds?: string[]; // Specific products on sale
  // Discount details
  discountType?: "percentage" | "fixed" | "bogo" | "none";
  discountValue?: number;
  originalPrice?: number;
  salePrice?: number;
  // Visibility
  visibility: "public" | "pro_only" | "followers";
  // Location
  location?: {
    city: string;
    state: string;
    radius: number; // Miles to show this promotion
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  // Timing
  startsAt: number;
  endsAt: number;
  // Engagement
  views: number;
  saves: number;
  clicks: number;
  leads: number; // Leads generated from this promo
  // Status
  status: "draft" | "scheduled" | "active" | "ended" | "archived";
  featured: boolean; // Paid featured placement
  createdAt: number;
  updatedAt: number;
}

// ============================================
// FLYERS & MARKETING CONTENT
// ============================================

export interface DigitalFlyer {
  id: string;
  vendorId: string;
  vendorName: string;
  title: string;
  description?: string;
  // Content
  coverImage: string;
  pdfUrl: string;
  pageCount?: number;
  // Categories featured
  categories: string[];
  brands?: string[];
  // Validity
  validFrom: number;
  validUntil: number;
  // Engagement
  views: number;
  downloads: number;
  shares: number;
  // Location targeting
  location?: {
    city: string;
    state: string;
    radius: number;
  };
  status: "draft" | "active" | "expired" | "archived";
  createdAt: number;
}

// ============================================
// QUOTING SYSTEM (B2B & B2C)
// ============================================

export type QuoteRequestType =
  | "material_only"      // Just materials pricing
  | "fabrication"        // Fab + materials
  | "install_only"       // Installation only
  | "full_service"       // Materials + fab + install
  | "consultation";      // Design/consultation

export type QuoteRequestSource =
  | "marketplace"        // From listing inquiry
  | "vendor_catalog"     // From vendor product page
  | "direct_message"     // DM request
  | "referral"           // Referred by another pro
  | "qr_code"            // Scanned QR at vendor location
  | "widget";            // Embedded quote form on external site

export interface QuoteRequest {
  id: string;
  // Who's requesting
  requesterId: string;
  requesterName: string;
  requesterType: "homeowner" | "contractor" | "designer";
  requesterEmail?: string;
  requesterPhone?: string;
  // For contractors quoting other contractors (B2B)
  requesterBusiness?: string;
  requesterLicense?: string;
  // Who it's going to
  recipientId: string;
  recipientName: string;
  recipientType: "vendor" | "contractor" | "fabricator";
  // Request details
  type: QuoteRequestType;
  source: QuoteRequestSource;
  // Project info
  projectType?: string;
  projectAddress?: string;
  projectCity?: string;
  projectState?: string;
  projectZip?: string;
  projectDescription: string;
  // Materials requested
  materials?: {
    category: string;
    subcategory?: string;
    productId?: string;
    productName?: string;
    quantity?: number;
    unit?: string;
    notes?: string;
  }[];
  // Measurements
  measurements?: {
    totalSqFt?: number;
    pieces?: {
      name: string;
      length: number;
      width: number;
      sqFt: number;
    }[];
  };
  // Attachments
  images?: string[];
  drawings?: string[]; // CAD/sketches
  // Budget
  budgetRange?: {
    min: number;
    max: number;
  };
  timeline?: "asap" | "1_week" | "2_weeks" | "1_month" | "flexible";
  // Status
  status: "pending" | "viewed" | "quoted" | "accepted" | "declined" | "expired";
  priority: "normal" | "urgent";
  // Timestamps
  createdAt: number;
  viewedAt?: number;
  quotedAt?: number;
  respondedAt?: number;
  expiresAt?: number;
}

export interface QuoteResponse {
  id: string;
  requestId: string;
  // Who's responding
  responderId: string;
  responderName: string;
  responderBusiness?: string;
  responderType: "vendor" | "contractor" | "fabricator";
  // Quote details
  lineItems: {
    id: string;
    description: string;
    category: "materials" | "fabrication" | "labor" | "install" | "delivery" | "other";
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
    notes?: string;
  }[];
  // Pricing
  subtotal: number;
  taxRate?: number;
  tax?: number;
  discount?: number;
  discountReason?: string;
  total: number;
  // Terms
  validDays: number;
  validUntil: number;
  paymentTerms?: string;
  leadTime?: string; // "2-3 weeks"
  warranty?: string;
  notes?: string;
  termsAndConditions?: string;
  // Attachments
  attachments?: {
    name: string;
    url: string;
    type: "pdf" | "image" | "doc";
  }[];
  // Status
  status: "draft" | "sent" | "viewed" | "accepted" | "declined" | "expired" | "revised";
  revisionOf?: string; // ID of previous quote if this is a revision
  // Timestamps
  createdAt: number;
  sentAt?: number;
  viewedAt?: number;
  respondedAt?: number;
}

// ============================================
// LEADS & CREDITS
// ============================================

export type LeadType =
  | "quote_request"    // Someone requested a quote
  | "product_inquiry"  // Asked about a product
  | "sample_request"   // Requested samples
  | "contact_form"     // General contact
  | "phone_click"      // Clicked phone number
  | "directions"       // Clicked for directions
  | "website_click";   // Clicked website link

export interface MarketplaceLead {
  id: string;
  // Lead recipient
  recipientId: string;
  recipientType: "vendor" | "contractor";
  // Lead source
  type: LeadType;
  source: "listing" | "profile" | "catalog" | "promotion" | "search";
  sourceId?: string; // Listing/promotion/product ID
  // Lead info
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  contactType: "homeowner" | "contractor" | "designer";
  message?: string;
  // Location
  city?: string;
  state?: string;
  zipCode?: string;
  // Value tracking
  creditCost: number; // How many credits this lead costs
  estimatedValue?: number; // Estimated project value
  // Status
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  qualityScore?: number; // 1-10 lead quality score
  // Timestamps
  createdAt: number;
  contactedAt?: number;
  convertedAt?: number;
}

// Credit system for pay-per-lead or boosting
export interface CreditBalance {
  userId: string;
  credits: number;
  bonusCredits: number; // Promotional credits
  lifetimeCredits: number;
  lifetimeSpent: number;
  lastPurchase?: number;
  autoReload?: {
    enabled: boolean;
    threshold: number; // Reload when below this
    amount: number; // Credits to purchase
  };
}

export interface CreditTransaction {
  id: string;
  userId: string;
  type: "purchase" | "spend" | "refund" | "bonus" | "referral";
  amount: number; // Positive for additions, negative for deductions
  balance: number; // Balance after transaction
  description: string;
  // For purchases
  paymentMethod?: string;
  stripePaymentId?: string;
  // For spending
  leadId?: string;
  promotionId?: string;
  listingId?: string;
  createdAt: number;
}

// ============================================
// FEATURED/BOOST SYSTEM
// ============================================

export type BoostType =
  | "listing"          // Boost a marketplace listing
  | "profile"          // Boost pro profile in search
  | "promotion"        // Featured promo placement
  | "catalog";         // Featured vendor catalog

export interface BoostPurchase {
  id: string;
  userId: string;
  type: BoostType;
  targetId: string; // ID of listing/profile/promo being boosted
  // Duration
  duration: number; // Days
  startsAt: number;
  endsAt: number;
  // Cost
  creditsCost: number;
  // Performance
  impressions: number;
  clicks: number;
  leads: number;
  // Status
  status: "active" | "ended" | "canceled";
  createdAt: number;
}

// ============================================
// DEFAULT PLANS
// ============================================

export const VENDOR_PLANS: VendorSubscriptionPlan[] = [
  {
    id: "vendor-free",
    tier: "free",
    name: "Basic Listing",
    description: "Get discovered by local pros and homeowners",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: {
      productListings: 10,
      monthlySpecials: 2,
      flyerUploads: 0,
      leadAccess: "none",
      leadsPerMonth: 0,
      featuredPlacement: false,
      analyticsAccess: "basic",
      apiAccess: false,
      dedicatedSupport: false,
      customBranding: false,
      multiLocation: false,
      teamMembers: 1,
    },
    trialDays: 0,
  },
  {
    id: "vendor-starter",
    tier: "starter",
    name: "Starter",
    description: "Perfect for small shops and showrooms",
    monthlyPrice: 49,
    yearlyPrice: 470, // ~2 months free
    features: {
      productListings: 100,
      monthlySpecials: 10,
      flyerUploads: 2,
      leadAccess: "limited",
      leadsPerMonth: 20,
      featuredPlacement: false,
      analyticsAccess: "basic",
      apiAccess: false,
      dedicatedSupport: false,
      customBranding: false,
      multiLocation: false,
      teamMembers: 2,
    },
    trialDays: 14,
  },
  {
    id: "vendor-pro",
    tier: "pro",
    name: "Pro",
    description: "For growing distributors and multi-location vendors",
    monthlyPrice: 149,
    yearlyPrice: 1430, // ~2 months free
    features: {
      productListings: "unlimited",
      monthlySpecials: "unlimited",
      flyerUploads: 10,
      leadAccess: "full",
      leadsPerMonth: "unlimited",
      featuredPlacement: true,
      analyticsAccess: "advanced",
      apiAccess: true,
      dedicatedSupport: false,
      customBranding: true,
      multiLocation: true,
      teamMembers: 5,
    },
    trialDays: 14,
  },
  {
    id: "vendor-enterprise",
    tier: "enterprise",
    name: "Enterprise",
    description: "For major distributors and manufacturers",
    monthlyPrice: 499,
    yearlyPrice: 4790, // ~2 months free
    features: {
      productListings: "unlimited",
      monthlySpecials: "unlimited",
      flyerUploads: "unlimited",
      leadAccess: "full",
      leadsPerMonth: "unlimited",
      featuredPlacement: true,
      analyticsAccess: "full",
      apiAccess: true,
      dedicatedSupport: true,
      customBranding: true,
      multiLocation: true,
      teamMembers: "unlimited",
    },
    trialDays: 30,
  },
];

export const PRO_PLANS: ProSubscriptionPlan[] = [
  {
    id: "pro-free",
    tier: "free",
    name: "Basic Pro",
    description: "Get started on the marketplace",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: {
      quotesPerMonth: 5,
      quoteTemplates: 1,
      leadAccess: "none",
      leadsPerMonth: 0,
      portfolioProjects: 5,
      verifiedBadge: false,
      featuredProfile: false,
      analyticsAccess: "basic",
      directMessaging: "limited",
      teamMembers: 1,
      jobScheduling: false,
      clientManagement: false,
      invoicing: false,
    },
    trialDays: 0,
  },
  {
    id: "pro-starter",
    tier: "starter",
    name: "Pro Starter",
    description: "For independent contractors",
    monthlyPrice: 29,
    yearlyPrice: 279, // ~2 months free
    features: {
      quotesPerMonth: 25,
      quoteTemplates: 5,
      leadAccess: "limited",
      leadsPerMonth: 10,
      portfolioProjects: 20,
      verifiedBadge: false,
      featuredProfile: false,
      analyticsAccess: "basic",
      directMessaging: "unlimited",
      teamMembers: 1,
      jobScheduling: true,
      clientManagement: false,
      invoicing: false,
    },
    trialDays: 14,
  },
  {
    id: "pro-business",
    tier: "pro",
    name: "Pro Business",
    description: "For established contractors and shops",
    monthlyPrice: 79,
    yearlyPrice: 759, // ~2 months free
    features: {
      quotesPerMonth: "unlimited",
      quoteTemplates: "unlimited",
      leadAccess: "priority",
      leadsPerMonth: 50,
      portfolioProjects: "unlimited",
      verifiedBadge: true,
      featuredProfile: true,
      analyticsAccess: "advanced",
      directMessaging: "unlimited",
      teamMembers: 5,
      jobScheduling: true,
      clientManagement: true,
      invoicing: true,
    },
    trialDays: 14,
  },
  {
    id: "pro-enterprise",
    tier: "enterprise",
    name: "Pro Enterprise",
    description: "For large contractors and fabrication shops",
    monthlyPrice: 199,
    yearlyPrice: 1910, // ~2 months free
    features: {
      quotesPerMonth: "unlimited",
      quoteTemplates: "unlimited",
      leadAccess: "priority",
      leadsPerMonth: "unlimited",
      portfolioProjects: "unlimited",
      verifiedBadge: true,
      featuredProfile: true,
      analyticsAccess: "advanced",
      directMessaging: "unlimited",
      teamMembers: 25,
      jobScheduling: true,
      clientManagement: true,
      invoicing: true,
    },
    trialDays: 30,
  },
];

// Credit pricing
export const CREDIT_PACKAGES = [
  { id: "credits-10", credits: 10, price: 10, bonus: 0 },
  { id: "credits-25", credits: 25, price: 20, bonus: 5 },
  { id: "credits-50", credits: 50, price: 35, bonus: 15 },
  { id: "credits-100", credits: 100, price: 60, bonus: 40 },
  { id: "credits-250", credits: 250, price: 125, bonus: 125 },
];

// Lead costs (credits)
export const LEAD_COSTS = {
  quote_request: 5,
  product_inquiry: 2,
  sample_request: 3,
  contact_form: 1,
  phone_click: 1,
  directions: 0,
  website_click: 0,
};

// Boost pricing (credits per day)
export const BOOST_COSTS = {
  listing: 2,
  profile: 5,
  promotion: 3,
  catalog: 10,
};
