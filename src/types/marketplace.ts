// Material Categories for Remodeling Marketplace
// Organized by project type for better browsing

export type MaterialCategory =
  | "Kitchen"
  | "Bath"
  | "Flooring"
  | "Doors & Windows"
  | "Lighting & Electrical"
  | "Plumbing"
  | "Stone & Tile"
  | "Lumber & Millwork"
  | "HVAC"
  | "Outdoor"
  | "Tools & Equipment"
  | "Other";

// Subcategories for each main category
export type KitchenSubcategory =
  | "Cabinets"
  | "Countertops"
  | "Sinks"
  | "Faucets"
  | "Appliances"
  | "Range Hoods"
  | "Backsplash"
  | "Hardware"
  | "Islands"
  | "Pantry"
  | "Other";

export type BathSubcategory =
  | "Vanities"
  | "Toilets"
  | "Bathtubs"
  | "Showers"
  | "Faucets"
  | "Sinks"
  | "Mirrors"
  | "Medicine Cabinets"
  | "Accessories"
  | "Tile"
  | "Other";

export type FlooringSubcategory =
  | "Hardwood"
  | "Laminate"
  | "Vinyl/LVP"
  | "Tile"
  | "Carpet"
  | "Engineered Wood"
  | "Bamboo"
  | "Cork"
  | "Concrete"
  | "Underlayment"
  | "Other";

export type DoorsWindowsSubcategory =
  | "Interior Doors"
  | "Exterior Doors"
  | "Sliding Doors"
  | "French Doors"
  | "Garage Doors"
  | "Windows"
  | "Skylights"
  | "Door Hardware"
  | "Window Treatments"
  | "Screens"
  | "Other";

export type LightingElectricalSubcategory =
  | "Chandeliers"
  | "Pendant Lights"
  | "Recessed Lighting"
  | "Wall Sconces"
  | "Ceiling Fans"
  | "Outdoor Lighting"
  | "Under Cabinet"
  | "Switches & Outlets"
  | "Electrical Panels"
  | "Smart Home"
  | "Other";

export type PlumbingSubcategory =
  | "Pipes & Fittings"
  | "Water Heaters"
  | "Sump Pumps"
  | "Water Filtration"
  | "Valves"
  | "Drains"
  | "Fixtures"
  | "Water Softeners"
  | "Other";

export type StoneTileSubcategory =
  | "Granite Slabs"
  | "Marble Slabs"
  | "Quartz Slabs"
  | "Quartzite Slabs"
  | "Soapstone"
  | "Remnants"
  | "Ceramic Tile"
  | "Porcelain Tile"
  | "Natural Stone Tile"
  | "Mosaic Tile"
  | "Pavers"
  | "Other";

export type LumberMillworkSubcategory =
  | "Dimensional Lumber"
  | "Plywood"
  | "Trim & Molding"
  | "Baseboards"
  | "Crown Molding"
  | "Decking"
  | "Beams"
  | "Columns"
  | "Stair Parts"
  | "Shiplap"
  | "Other";

export type HVACSubcategory =
  | "Air Conditioners"
  | "Furnaces"
  | "Heat Pumps"
  | "Ductwork"
  | "Vents & Registers"
  | "Thermostats"
  | "Mini Splits"
  | "Air Purifiers"
  | "Humidifiers"
  | "Other";

export type OutdoorSubcategory =
  | "Fencing"
  | "Decking"
  | "Pavers"
  | "Outdoor Kitchens"
  | "Fire Pits"
  | "Pergolas"
  | "Gazebos"
  | "Planters"
  | "Outdoor Furniture"
  | "Irrigation"
  | "Other";

export type ToolsEquipmentSubcategory =
  | "Power Tools"
  | "Hand Tools"
  | "Ladders"
  | "Scaffolding"
  | "Compressors"
  | "Generators"
  | "Tile Saws"
  | "Table Saws"
  | "Safety Equipment"
  | "Storage"
  | "Other";

export type OtherSubcategory =
  | "Insulation"
  | "Roofing"
  | "Siding"
  | "Paint"
  | "Drywall"
  | "Concrete"
  | "Fasteners"
  | "Adhesives"
  | "Miscellaneous";

// Union type for all subcategories
export type Subcategory =
  | KitchenSubcategory
  | BathSubcategory
  | FlooringSubcategory
  | DoorsWindowsSubcategory
  | LightingElectricalSubcategory
  | PlumbingSubcategory
  | StoneTileSubcategory
  | LumberMillworkSubcategory
  | HVACSubcategory
  | OutdoorSubcategory
  | ToolsEquipmentSubcategory
  | OtherSubcategory;

// Category configuration with subcategories and icons
export interface CategoryConfig {
  name: MaterialCategory;
  icon: string;
  subcategories: string[];
}

export const CATEGORY_CONFIG: CategoryConfig[] = [
  {
    name: "Kitchen",
    icon: "restaurant-outline",
    subcategories: ["Cabinets", "Countertops", "Sinks", "Faucets", "Appliances", "Range Hoods", "Backsplash", "Hardware", "Islands", "Pantry", "Other"],
  },
  {
    name: "Bath",
    icon: "water-outline",
    subcategories: ["Vanities", "Toilets", "Bathtubs", "Showers", "Faucets", "Sinks", "Mirrors", "Medicine Cabinets", "Accessories", "Tile", "Other"],
  },
  {
    name: "Flooring",
    icon: "grid-outline",
    subcategories: ["Hardwood", "Laminate", "Vinyl/LVP", "Tile", "Carpet", "Engineered Wood", "Bamboo", "Cork", "Concrete", "Underlayment", "Other"],
  },
  {
    name: "Doors & Windows",
    icon: "browsers-outline",
    subcategories: ["Interior Doors", "Exterior Doors", "Sliding Doors", "French Doors", "Garage Doors", "Windows", "Skylights", "Door Hardware", "Window Treatments", "Screens", "Other"],
  },
  {
    name: "Lighting & Electrical",
    icon: "bulb-outline",
    subcategories: ["Chandeliers", "Pendant Lights", "Recessed Lighting", "Wall Sconces", "Ceiling Fans", "Outdoor Lighting", "Under Cabinet", "Switches & Outlets", "Electrical Panels", "Smart Home", "Other"],
  },
  {
    name: "Plumbing",
    icon: "construct-outline",
    subcategories: ["Pipes & Fittings", "Water Heaters", "Sump Pumps", "Water Filtration", "Valves", "Drains", "Fixtures", "Water Softeners", "Other"],
  },
  {
    name: "Stone & Tile",
    icon: "layers-outline",
    subcategories: ["Granite Slabs", "Marble Slabs", "Quartz Slabs", "Quartzite Slabs", "Soapstone", "Remnants", "Ceramic Tile", "Porcelain Tile", "Natural Stone Tile", "Mosaic Tile", "Pavers", "Other"],
  },
  {
    name: "Lumber & Millwork",
    icon: "cube-outline",
    subcategories: ["Dimensional Lumber", "Plywood", "Trim & Molding", "Baseboards", "Crown Molding", "Decking", "Beams", "Columns", "Stair Parts", "Shiplap", "Other"],
  },
  {
    name: "HVAC",
    icon: "thermometer-outline",
    subcategories: ["Air Conditioners", "Furnaces", "Heat Pumps", "Ductwork", "Vents & Registers", "Thermostats", "Mini Splits", "Air Purifiers", "Humidifiers", "Other"],
  },
  {
    name: "Outdoor",
    icon: "leaf-outline",
    subcategories: ["Fencing", "Decking", "Pavers", "Outdoor Kitchens", "Fire Pits", "Pergolas", "Gazebos", "Planters", "Outdoor Furniture", "Irrigation", "Other"],
  },
  {
    name: "Tools & Equipment",
    icon: "hammer-outline",
    subcategories: ["Power Tools", "Hand Tools", "Ladders", "Scaffolding", "Compressors", "Generators", "Tile Saws", "Table Saws", "Safety Equipment", "Storage", "Other"],
  },
  {
    name: "Other",
    icon: "ellipsis-horizontal-outline",
    subcategories: ["Insulation", "Roofing", "Siding", "Paint", "Drywall", "Concrete", "Fasteners", "Adhesives", "Miscellaneous"],
  },
];

// Helper function to get subcategories for a category
export function getSubcategoriesForCategory(category: MaterialCategory): string[] {
  const config = CATEGORY_CONFIG.find(c => c.name === category);
  return config?.subcategories || [];
}

// Helper function to get icon for a category
export function getCategoryIcon(category: MaterialCategory): string {
  const config = CATEGORY_CONFIG.find(c => c.name === category);
  return config?.icon || "help-outline";
}

// Specific stone types (for Stone & Tile category - slabs)
export type StoneType =
  | "Granite"
  | "Marble"
  | "Quartzite"
  | "Quartz"
  | "Soapstone"
  | "Limestone"
  | "Travertine"
  | "Slate"
  | "Onyx"
  | "Porcelain"
  | "Other";

export type ListingType = "New" | "Used" | "Surplus" | "Remnant" | "Slab" | "Custom";

export type ListingStatus = "active" | "archived" | "sold";

export type UserType = "homeowner" | "vendor" | "fabricator" | "contractor" | "designer" | "supplier" | "installer";

// Pro specialties for contractors/installers
export type ProSpecialty =
  | "Countertops"
  | "Cabinets"
  | "Flooring"
  | "Tile"
  | "Plumbing"
  | "Electrical"
  | "General Remodeling"
  | "Kitchen & Bath"
  | "Outdoor Living"
  | "HVAC"
  | "Painting"
  | "Drywall";

// Service areas for pros
export interface ServiceArea {
  city: string;
  state: string;
  radius: number; // miles
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// Portfolio project for pros
export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  images: string[];
  videos?: string[]; // Video URLs for project walkthrough
  category: MaterialCategory;
  completedAt: number;
  location?: string;
  clientTestimonial?: string;
  likes?: string[]; // User IDs who liked this project
  likeCount?: number;
}

// Integration connection status
export interface IntegrationConnection {
  connected: boolean;
  connectedAt?: string;
  username?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

// Notification preferences
export interface NotificationPreferences {
  push: boolean;
  email: boolean;
  sms: boolean;
  slack?: boolean;
  // What to notify about
  newMessages: boolean;
  newLeads: boolean;
  priceAlerts: boolean;
  nearbyListings: boolean;
  orderUpdates: boolean;
}

export interface ListingPiece {
  id: string;
  pieceNumber: number;
  dimensions: {
    length: number;
    width: number;
    thickness?: number;
    height?: number;
  };
  quantity?: number;
  notes?: string;
}

export interface Listing {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string;
  sellerRating: number;
  sellerVendorId?: string;
  title: string;
  description: string;
  category: MaterialCategory;
  subcategory?: Subcategory | string;
  stoneType?: StoneType; // For Stone & Tile slabs
  listingType: ListingType;
  price: number;
  images: string[];
  videos?: string[]; // Video URLs for product demos
  location: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  dimensions?: {
    length: number;
    width: number;
    thickness?: number;
    height?: number;
  };
  pieces?: ListingPiece[];
  totalQuantity?: number;
  quantityUnit?: "pieces" | "sq_ft" | "linear_ft" | "slabs" | "tiles" | "boxes";
  status: ListingStatus;
  createdAt: number;
  expiresAt: number;
  views: number;
  likes?: string[]; // User IDs who liked this listing
  likeCount?: number;
  samplesAvailable?: boolean;
  colorId?: string;
  colorName?: string;
  supplierName?: string;
  brand?: string;
  model?: string;
  condition?: "new" | "like-new" | "good" | "fair";
  sustainable?: boolean;
  localMade?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
  location?: string;
  bio?: string;
  rating: number;
  reviewCount: number;
  credits: number;
  joinedAt: number;
  listingCount: number;
  userType: UserType;
  businessName?: string;
  businessType?: string;
  verified?: boolean;
  adCredits?: number;

  // Social & Marketing Connections
  socialConnections?: {
    facebook?: string;
    instagram?: string;
    pinterest?: string;
    houzz?: string;
    website?: string;
    youtube?: string;
    tiktok?: string;
  };

  // Business Integrations
  integrations?: {
    shopify?: IntegrationConnection & { shop?: string };
    slack?: IntegrationConnection & { channel?: string; webhookUrl?: string };
    quickbooks?: IntegrationConnection;
    googleCalendar?: IntegrationConnection;
    stripe?: IntegrationConnection & { accountId?: string };
  };

  // Notification Settings
  notifications?: NotificationPreferences;

  // Pro/Business specific fields
  specialties?: ProSpecialty[];
  serviceAreas?: ServiceArea[];
  portfolio?: PortfolioProject[];
  yearsInBusiness?: number;
  licenseNumber?: string;
  insuranceVerified?: boolean;
  backgroundChecked?: boolean;
  responseTime?: "< 1 hour" | "< 4 hours" | "< 24 hours" | "1-2 days";

  // Stats
  completedJobs?: number;
  repeatClientRate?: number;

  sustainableBusiness?: boolean;
  certifications?: string[];

  // Legacy shopify field for backward compatibility
  shopify?: {
    connected: boolean;
    shop?: string;
    accessToken?: string;
    connectedAt?: string;
  };
}

export interface Review {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  toUserId: string;
  listingId: string;
  rating: number;
  comment: string;
  createdAt: number;
}

// ============================================
// PROJECT BOARD - Collaboration Feature
// ============================================

export type ProjectStatus = "planning" | "in_progress" | "on_hold" | "completed" | "cancelled";
export type ProjectRoomType = "kitchen" | "bathroom" | "living_room" | "bedroom" | "outdoor" | "basement" | "garage" | "whole_home" | "other";

export interface ProjectMaterial {
  id: string;
  listingId?: string; // Link to marketplace listing
  name: string;
  category: MaterialCategory;
  brand?: string;
  model?: string;
  color?: string;
  imageUrl?: string;
  price?: number;
  quantity?: number;
  quantityUnit?: "sq_ft" | "linear_ft" | "pieces" | "each";
  vendorId?: string;
  vendorName?: string;
  status: "considering" | "selected" | "ordered" | "delivered" | "installed";
  notes?: string;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  description?: string;
  dueDate?: number;
  completedAt?: number;
  status: "pending" | "in_progress" | "completed";
}

export interface ProjectCollaborator {
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  role: "owner" | "contractor" | "designer" | "vendor" | "viewer";
  addedAt: number;
}

export interface Project {
  id: string;
  ownerId: string; // Homeowner who owns the project
  ownerName: string;
  title: string;
  description?: string;
  roomType: ProjectRoomType;
  status: ProjectStatus;
  budget?: {
    min: number;
    max: number;
  };
  estimatedCost?: number;
  actualCost?: number;
  address?: string;
  photos?: string[]; // Room/space photos
  materials: ProjectMaterial[];
  milestones: ProjectMilestone[];
  collaborators: ProjectCollaborator[];
  measurements?: {
    length?: number;
    width?: number;
    height?: number;
    sqft?: number;
  };
  createdAt: number;
  updatedAt: number;
  startDate?: number;
  completionDate?: number;
}

// ============================================
// QUICK QUOTE - For Pros
// ============================================

export interface QuoteLineItem {
  id: string;
  description: string;
  category: "materials" | "labor" | "equipment" | "permits" | "other";
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface Quote {
  id: string;
  projectId?: string;
  proId: string;
  proName: string;
  proBusiness?: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  title: string;
  description?: string;
  lineItems: QuoteLineItem[];
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  discount?: number;
  discountType?: "percentage" | "fixed";
  total: number;
  status: "draft" | "sent" | "viewed" | "accepted" | "declined" | "expired";
  validUntil?: number;
  notes?: string;
  terms?: string;
  createdAt: number;
  updatedAt: number;
  sentAt?: number;
  respondedAt?: number;
}

// ============================================
// SAMPLE REQUESTS
// ============================================

export interface SampleRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  userAddress: string;
  listingId?: string;
  vendorId: string;
  vendorName: string;
  materialName: string;
  materialCategory: MaterialCategory;
  colorName?: string;
  brand?: string;
  quantity: number;
  status: "pending" | "shipped" | "delivered" | "cancelled";
  notes?: string;
  createdAt: number;
  shippedAt?: number;
  trackingNumber?: string;
}

// ============================================
// BUDGET CALCULATOR
// ============================================

export interface BudgetEstimate {
  id: string;
  userId: string;
  projectType: ProjectRoomType;
  sqft: number;
  qualityTier: "budget" | "mid_range" | "premium" | "luxury";
  items: {
    category: string;
    lowEstimate: number;
    highEstimate: number;
    selected?: number;
  }[];
  totalLow: number;
  totalHigh: number;
  createdAt: number;
}

// ============================================
// LEAD SYSTEM - For Pros
// ============================================

export type LeadStatus = "new" | "contacted" | "quoted" | "won" | "lost";
export type LeadSource = "marketplace" | "referral" | "sample_request" | "quote_request" | "direct";

export interface Lead {
  id: string;
  proId: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  projectType: ProjectRoomType;
  description: string;
  budget?: {
    min: number;
    max: number;
  };
  timeline?: string;
  source: LeadSource;
  status: LeadStatus;
  priority: "low" | "medium" | "high";
  notes?: string;
  followUpDate?: number;
  createdAt: number;
  updatedAt: number;
  convertedAt?: number;
  quoteId?: string;
  projectId?: string;
}

// ============================================
// VENDOR CATALOG - Self-Service Product Management
// ============================================

export type VendorType =
  | "manufacturer"
  | "distributor"
  | "retailer"
  | "fabricator"
  | "wholesaler"
  | "showroom"           // Kitchen & Bath showrooms
  | "home_center"        // Big box stores, lumber yards
  | "specialty_store"    // Tile shops, lighting stores, appliance dealers
  | "online_retailer"    // E-commerce focused
  | "trade_supplier"     // Wholesale to trade only
  | "design_center"      // Multi-brand design centers
  | "outlet"             // Discount/overstock
  | "rental"             // Equipment rental
  | "multi_category";    // Sells across many categories
export type ProductAvailability = "in_stock" | "low_stock" | "out_of_stock" | "special_order" | "discontinued";
export type PricingVisibility = "public" | "pro_only" | "request_quote" | "hidden";

export interface VendorProduct {
  id: string;
  vendorId: string;
  vendorName: string;
  sku?: string;
  name: string;
  description?: string;
  category: MaterialCategory;
  subcategory?: string;
  brand?: string;
  manufacturer?: string;

  // Stone/Slab specific
  stoneType?: StoneType;
  colorFamily?: string;
  veiningStyle?: "none" | "subtle" | "moderate" | "dramatic";
  finish?: "polished" | "honed" | "leathered" | "brushed" | "flamed";
  origin?: string; // Country of origin

  // Dimensions
  dimensions?: {
    length: number;
    width: number;
    thickness?: number;
  };
  dimensionUnit?: "inches" | "cm" | "mm";

  // Pricing
  pricing: {
    retailPrice?: number;
    proPrice?: number;
    costPrice?: number; // Hidden, for vendor's reference
    priceUnit: "sq_ft" | "linear_ft" | "each" | "slab" | "box";
    minOrderQty?: number;
  };
  pricingVisibility: PricingVisibility;

  // Availability
  availability: ProductAvailability;
  stockQty?: number;
  leadTimeDays?: number;

  // Media
  images: string[];
  videos?: string[];
  specSheet?: string; // PDF URL

  // Tags for search
  tags?: string[];
  alternateNames?: string[]; // "Jet Black", "Nero Absolute", etc.

  // Location
  warehouseLocation?: string;

  // Flags
  featured?: boolean;
  newArrival?: boolean;
  onSale?: boolean;
  salePrice?: number;
  samplesAvailable?: boolean;

  // Metadata
  createdAt: number;
  updatedAt: number;
  publishedAt?: number;
  status: "draft" | "published" | "archived";
}

export interface VendorCatalog {
  vendorId: string;
  vendorName: string;
  vendorType: VendorType;
  logo?: string;
  coverImage?: string;
  description?: string;
  website?: string;
  phone?: string;
  email?: string;

  // Location
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };

  // Service info
  serviceRadius?: number; // miles
  deliveryAvailable?: boolean;
  installationAvailable?: boolean;
  showroomAvailable?: boolean;

  // Brands carried
  brands?: string[];

  // Stats
  productCount: number;
  rating?: number;
  reviewCount?: number;

  // Subscription/Plan
  plan?: "free" | "basic" | "pro" | "enterprise";
  featuredUntil?: number;

  createdAt: number;
  updatedAt: number;
  verified?: boolean;
}

// Lead from catalog view
export interface CatalogLead {
  id: string;
  vendorId: string;
  productId?: string;
  productName?: string;

  // Customer info
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  customerType: "homeowner" | "contractor" | "designer";

  // Request type
  requestType: "quote" | "sample" | "availability" | "bulk_pricing" | "custom";
  message?: string;

  // Project details
  projectType?: ProjectRoomType;
  estimatedSqft?: number;
  timeline?: string;

  // Contractor info (if applicable)
  contractorId?: string;
  contractorName?: string;
  contractorBusiness?: string;

  status: "new" | "viewed" | "contacted" | "quoted" | "won" | "lost";
  createdAt: number;
  updatedAt: number;
  notes?: string;
}

// ============================================
// COMMUNITY TOPICS BOARD
// ============================================

export type TopicCategory =
  | "general"
  | "tile_shower"      // HOT category - tile showers trend
  | "flooring"
  | "kitchen"
  | "bathroom"
  | "outdoor"
  | "tips_tricks"
  | "before_after"
  | "deals_finds"
  | "ask_pros"
  | "project_help"
  | "industry_news";

export type TopicAuthorRole = "homeowner" | "contractor" | "designer" | "project_manager" | "vendor" | "fabricator";

export interface TopicComment {
  id: string;
  topicId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: TopicAuthorRole;
  authorVerified?: boolean;
  content: string;
  images?: string[];
  likes?: string[];
  likeCount?: number;
  replyToId?: string; // For nested replies
  createdAt: number;
  updatedAt?: number;
  isEdited?: boolean;
}

export interface CommunityTopic {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: TopicAuthorRole;
  authorVerified?: boolean;
  title: string;
  content: string;
  category: TopicCategory;
  images?: string[];
  videos?: string[];
  tags?: string[];

  // Engagement
  likes?: string[];
  likeCount?: number;
  commentCount?: number;
  viewCount?: number;

  // Flags
  isPinned?: boolean;
  isFeatured?: boolean;
  isTrending?: boolean;

  // Related content
  relatedListingId?: string;
  relatedProjectId?: string;

  createdAt: number;
  updatedAt?: number;
  lastActivityAt?: number;
  status: "active" | "closed" | "archived" | "flagged";
}

// Trending Topics Config - for featuring hot categories
export interface TrendingTopic {
  category: TopicCategory;
  label: string;
  icon: string;
  color: string;
  isHot?: boolean;
}

export const TRENDING_TOPICS: TrendingTopic[] = [
  { category: "tile_shower", label: "Tile & Shower", icon: "water", color: "#0891b2", isHot: true },
  { category: "flooring", label: "Flooring", icon: "grid", color: "#7c3aed", isHot: false },
  { category: "before_after", label: "Before & After", icon: "images", color: "#059669", isHot: false },
  { category: "deals_finds", label: "Deals & Finds", icon: "pricetag", color: "#dc2626", isHot: true },
  { category: "ask_pros", label: "Ask the Pros", icon: "chatbubbles", color: "#2563eb", isHot: false },
  { category: "project_help", label: "Project Help", icon: "help-circle", color: "#d97706", isHot: false },
];
