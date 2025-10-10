// Material Categories for Remodeling Marketplace
export type MaterialCategory = 
  | "Stone" // Consolidated: Granite, Marble, Quartz, Quartzite
  | "Cabinets"
  | "Wood" // Flooring, trim, beams
  | "Lighting"
  | "Metal" // Fixtures, railings, hardware
  | "Glass" // Windows, doors, backsplashes
  | "Tile" // Ceramic, porcelain, mosaic
  | "Landscaping" // Pavers, outdoor stone, plants
  | "Plumbing" // Fixtures, sinks, faucets
  | "Appliances"
  | "Paint" // Interior/exterior finishes
  | "Flooring" // Laminate, vinyl, hardwood
  | "Countertops" // All types
  | "Hardware" // Door handles, hinges, pulls
  | "Windows"
  | "Doors"
  | "Other";

// Specific stone types (subset of Stone category)
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

export type UserType = "homeowner" | "vendor" | "fabricator" | "contractor" | "designer";

export interface ListingPiece {
  id: string;
  pieceNumber: number;
  dimensions: {
    length: number;
    width: number;
    thickness?: number;
    height?: number;
  };
  quantity?: number; // For tiles, flooring (sq ft), etc
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
  category: MaterialCategory; // New: replaces stoneType
  stoneType?: StoneType; // Optional: only for Stone category
  listingType: ListingType;
  price: number;
  images: string[];
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
  pieces?: ListingPiece[]; // Multiple pieces with individual dimensions
  totalQuantity?: number; // Total qty (# of pieces, or sq ft for flooring/tile)
  quantityUnit?: "pieces" | "sq_ft" | "linear_ft" | "slabs" | "tiles" | "boxes";
  status: ListingStatus;
  createdAt: number;
  expiresAt: number;
  views: number;
  samplesAvailable?: boolean;
  colorId?: string; // For stone/paint/finishes
  colorName?: string;
  supplierName?: string; // Brand/manufacturer
  brand?: string;
  model?: string;
  condition?: "new" | "like-new" | "good" | "fair";
  sustainable?: boolean; // Eco-friendly badge
  localMade?: boolean; // Made locally badge
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
  // Social integrations
  socialConnections?: {
    facebook?: string;
    instagram?: string;
    pinterest?: string;
    houzz?: string;
    website?: string;
  };
  // Sustainability
  sustainableBusiness?: boolean;
  certifications?: string[]; // LEED, EPA, etc.
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
