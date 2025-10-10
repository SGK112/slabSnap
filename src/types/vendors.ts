// Expanded vendor types for full remodeling marketplace
export type VendorType = 
  | "stone-supplier"
  | "cabinet-maker"
  | "wood-supplier" // Flooring, lumber, millwork
  | "lighting-store"
  | "metal-fabricator" // Railings, fixtures, custom metalwork
  | "glass-supplier" // Windows, doors, shower enclosures
  | "tile-store"
  | "landscaping-supply"
  | "plumbing-supply"
  | "appliance-store"
  | "paint-store"
  | "flooring-store"
  | "countertop-specialist"
  | "hardware-store"
  | "window-door-supplier"
  | "general-contractor"
  | "home-remodeling"
  | "fabricator"
  | "installer"
  | "designer" // Interior designers
  | "architect";


export interface StoneInventoryItem {
  id: string;
  stoneName: string;
  stoneType: "Granite" | "Marble" | "Quartzite" | "Quartz" | "Other";
  color: string;
  finish?: "Polished" | "Honed" | "Leathered" | "Brushed";
  supplierBrand?: string; // e.g., "Cosentino", "Caesarstone", "Cambria"
  lotNumber?: string;
  dimensions?: {
    length: number;
    width: number;
    thickness: number;
  };
  pricePerSqFt?: number;
  availability: "In Stock" | "Available" | "Coming Soon" | "Sold Out";
  images?: string[];
}

export interface VendorRelationship {
  vendorId: string; // ID of the supplier/distributor they buy from
  vendorName: string; // Name like "Cosentino", "MSI", "The Yard AZ"
  relationshipType: "primary-supplier" | "secondary-supplier" | "partner";
  activeInventory: string[]; // Array of stone names/types they currently have from this supplier
}

export interface Vendor {
  id: string;
  name: string;
  type: VendorType;
  description: string;
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  businessHours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  images: string[];
  rating: number;
  reviewCount: number;
  verified: boolean;
  specialties: string[];
  samplesAvailable?: boolean;
  inventory?: {
    granite: number;
    marble: number;
    quartzite: number;
    quartz: number;
  };
  // NEW: Detailed stone inventory
  stoneInventory?: StoneInventoryItem[];
  // NEW: Vendor relationships (who they buy from)
  supplierRelationships?: VendorRelationship[];
  // NEW: Tags for searchability
  tags?: string[]; // e.g., ["Cosentino dealer", "Cambria certified", "remnants"]
}
