/**
 * Comprehensive Stone Color Catalog
 * Bootstrap data from Surprise Granite and major suppliers (MSI, Cambria, etc.)
 */

export interface StoneColor {
  id: string;
  name: string;
  type: "Granite" | "Marble" | "Quartzite" | "Quartz" | "Porcelain";
  supplier: string; // MSI, Cambria, Surprise Granite, etc.
  imageUrl: string;
  description: string;
  popular: boolean;
  colors: string[]; // Dominant colors like ["white", "gray", "black"]
  finish?: "Polished" | "Honed" | "Leathered";
  priceRange?: "budget" | "mid" | "premium";
}

// GRANITE COLORS
export const GRANITE_COLORS: StoneColor[] = [
  // Surprise Granite Selections
  {
    id: "sg-black-galaxy",
    name: "Black Galaxy",
    type: "Granite",
    supplier: "Surprise Granite",
    imageUrl: "https://images.unsplash.com/photo-1615529182904-14819c35db37?w=800",
    description: "Deep black granite with golden specks resembling stars",
    popular: true,
    colors: ["black", "gold"],
    finish: "Polished",
    priceRange: "mid",
  },
  {
    id: "sg-santa-cecilia",
    name: "Santa Cecilia",
    type: "Granite",
    supplier: "Surprise Granite",
    imageUrl: "https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?w=800",
    description: "Warm gold and brown tones with burgundy accents",
    popular: true,
    colors: ["gold", "brown", "burgundy"],
    finish: "Polished",
    priceRange: "budget",
  },
  {
    id: "sg-uba-tuba",
    name: "Uba Tuba",
    type: "Granite",
    supplier: "Surprise Granite",
    imageUrl: "https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800",
    description: "Dark green granite with gold and black flecks",
    popular: true,
    colors: ["green", "black", "gold"],
    finish: "Polished",
    priceRange: "budget",
  },
  {
    id: "sg-bianco-antico",
    name: "Bianco Antico",
    type: "Granite",
    supplier: "Surprise Granite",
    imageUrl: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800",
    description: "White background with gray and burgundy veining",
    popular: true,
    colors: ["white", "gray", "burgundy"],
    finish: "Polished",
    priceRange: "mid",
  },
  {
    id: "sg-colonial-white",
    name: "Colonial White",
    type: "Granite",
    supplier: "Surprise Granite",
    imageUrl: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800",
    description: "Clean white with gray speckling",
    popular: true,
    colors: ["white", "gray"],
    finish: "Polished",
    priceRange: "budget",
  },
  {
    id: "sg-giallo-ornamental",
    name: "Giallo Ornamental",
    type: "Granite",
    supplier: "Surprise Granite",
    imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800",
    description: "Creamy beige with gray and black minerals",
    popular: true,
    colors: ["beige", "gray", "black"],
    finish: "Polished",
    priceRange: "budget",
  },
  {
    id: "sg-blue-pearl",
    name: "Blue Pearl",
    type: "Granite",
    supplier: "Surprise Granite",
    imageUrl: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800",
    description: "Dark gray with iridescent blue crystals",
    popular: true,
    colors: ["gray", "blue"],
    finish: "Polished",
    priceRange: "mid",
  },
  {
    id: "sg-absolute-black",
    name: "Absolute Black",
    type: "Granite",
    supplier: "Surprise Granite",
    imageUrl: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
    description: "Pure black granite with consistent color",
    popular: true,
    colors: ["black"],
    finish: "Polished",
    priceRange: "mid",
  },
  {
    id: "sg-tan-brown",
    name: "Tan Brown",
    type: "Granite",
    supplier: "Surprise Granite",
    imageUrl: "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800",
    description: "Rich brown with black and tan flecks",
    popular: true,
    colors: ["brown", "black", "tan"],
    finish: "Polished",
    priceRange: "budget",
  },
  {
    id: "sg-kashmir-white",
    name: "Kashmir White",
    type: "Granite",
    supplier: "Surprise Granite",
    imageUrl: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800",
    description: "White with gray and burgundy spots",
    popular: true,
    colors: ["white", "gray", "burgundy"],
    finish: "Polished",
    priceRange: "mid",
  },
];

// QUARTZ COLORS (Cambria, MSI, etc.)
export const QUARTZ_COLORS: StoneColor[] = [
  // Cambria
  {
    id: "cambria-britannica",
    name: "Britannica",
    type: "Quartz",
    supplier: "Cambria",
    imageUrl: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800",
    description: "Warm white with subtle gold veining",
    popular: true,
    colors: ["white", "gold"],
    finish: "Polished",
    priceRange: "premium",
  },
  {
    id: "cambria-ella",
    name: "Ella",
    type: "Quartz",
    supplier: "Cambria",
    imageUrl: "https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800",
    description: "Elegant white with soft gray veining",
    popular: true,
    colors: ["white", "gray"],
    finish: "Polished",
    priceRange: "premium",
  },
  {
    id: "cambria-torquay",
    name: "Torquay",
    type: "Quartz",
    supplier: "Cambria",
    imageUrl: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800",
    description: "Bold white with dramatic gray veining",
    popular: true,
    colors: ["white", "gray"],
    finish: "Polished",
    priceRange: "premium",
  },
  // MSI Quartz
  {
    id: "msi-calacatta-laza",
    name: "Calacatta Laza",
    type: "Quartz",
    supplier: "MSI",
    imageUrl: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800",
    description: "White quartz with gold veining",
    popular: true,
    colors: ["white", "gold"],
    finish: "Polished",
    priceRange: "mid",
  },
  {
    id: "msi-carrara-white",
    name: "Carrara White",
    type: "Quartz",
    supplier: "MSI",
    imageUrl: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800",
    description: "Classic white with soft gray veining",
    popular: true,
    colors: ["white", "gray"],
    finish: "Polished",
    priceRange: "mid",
  },
  {
    id: "msi-alpine-white",
    name: "Alpine White",
    type: "Quartz",
    supplier: "MSI",
    imageUrl: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800",
    description: "Pure white quartz surface",
    popular: true,
    colors: ["white"],
    finish: "Polished",
    priceRange: "budget",
  },
  {
    id: "msi-statuario-venato",
    name: "Statuario Venato",
    type: "Quartz",
    supplier: "MSI",
    imageUrl: "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800",
    description: "White with dramatic gray veining",
    popular: true,
    colors: ["white", "gray"],
    finish: "Polished",
    priceRange: "mid",
  },
  {
    id: "msi-babylon-gray",
    name: "Babylon Gray",
    type: "Quartz",
    supplier: "MSI",
    imageUrl: "https://images.unsplash.com/photo-1615529182904-14819c35db37?w=800",
    description: "Medium gray with subtle movement",
    popular: true,
    colors: ["gray"],
    finish: "Polished",
    priceRange: "mid",
  },
];

// MARBLE COLORS
export const MARBLE_COLORS: StoneColor[] = [
  {
    id: "marble-carrara",
    name: "Carrara",
    type: "Marble",
    supplier: "MSI",
    imageUrl: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800",
    description: "Classic white marble with soft gray veining",
    popular: true,
    colors: ["white", "gray"],
    finish: "Polished",
    priceRange: "premium",
  },
  {
    id: "marble-calacatta",
    name: "Calacatta",
    type: "Marble",
    supplier: "MSI",
    imageUrl: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800",
    description: "White marble with bold gold veining",
    popular: true,
    colors: ["white", "gold"],
    finish: "Polished",
    priceRange: "premium",
  },
  {
    id: "marble-statuario",
    name: "Statuario",
    type: "Marble",
    supplier: "MSI",
    imageUrl: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800",
    description: "Pure white with dramatic gray veining",
    popular: true,
    colors: ["white", "gray"],
    finish: "Polished",
    priceRange: "premium",
  },
];

// QUARTZITE COLORS
export const QUARTZITE_COLORS: StoneColor[] = [
  {
    id: "quartzite-taj-mahal",
    name: "Taj Mahal",
    type: "Quartzite",
    supplier: "MSI",
    imageUrl: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800",
    description: "Soft white with gold and taupe veining",
    popular: true,
    colors: ["white", "gold", "taupe"],
    finish: "Polished",
    priceRange: "premium",
  },
  {
    id: "quartzite-sea-pearl",
    name: "Sea Pearl",
    type: "Quartzite",
    supplier: "MSI",
    imageUrl: "https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800",
    description: "Light gray with subtle movement",
    popular: true,
    colors: ["gray", "white"],
    finish: "Polished",
    priceRange: "premium",
  },
];

// ALL COLORS COMBINED
export const ALL_STONE_COLORS: StoneColor[] = [
  ...GRANITE_COLORS,
  ...QUARTZ_COLORS,
  ...MARBLE_COLORS,
  ...QUARTZITE_COLORS,
];

// Helper functions
export const getColorsByType = (type: string): StoneColor[] => {
  return ALL_STONE_COLORS.filter(color => color.type === type);
};

export const getPopularColors = (): StoneColor[] => {
  return ALL_STONE_COLORS.filter(color => color.popular);
};

export const getColorsBySupplier = (supplier: string): StoneColor[] => {
  return ALL_STONE_COLORS.filter(color => color.supplier === supplier);
};

export const searchColors = (query: string): StoneColor[] => {
  const lowerQuery = query.toLowerCase();
  return ALL_STONE_COLORS.filter(color => 
    color.name.toLowerCase().includes(lowerQuery) ||
    color.type.toLowerCase().includes(lowerQuery) ||
    color.supplier.toLowerCase().includes(lowerQuery) ||
    color.colors.some(c => c.toLowerCase().includes(lowerQuery))
  );
};
