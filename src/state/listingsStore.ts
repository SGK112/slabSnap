import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Listing } from "../types/marketplace";

interface ListingsState {
  listings: Listing[];
  myListings: Listing[];
  favoriteIds: string[];
  dataVersion: number;
  addListing: (listing: Listing) => void;
  updateListing: (id: string, updates: Partial<Listing>) => void;
  deleteListing: (id: string) => void;
  archiveExpiredListings: () => void;
  toggleFavorite: (id: string) => void;
  incrementViews: (id: string) => void;
  getListingById: (id: string) => Listing | undefined;
  getUserListings: (userId: string) => Listing[];
  loadMockData: () => void;
}

export const useListingsStore = create<ListingsState>()(
  persist(
    (set, get) => ({
      listings: [],
      myListings: [],
      favoriteIds: [],
      dataVersion: 3,

      addListing: (listing: Listing) => {
        set((state) => ({
          listings: [listing, ...state.listings],
          myListings: [listing, ...state.myListings],
        }));
      },

      updateListing: (id: string, updates: Partial<Listing>) => {
        set((state) => ({
          listings: state.listings.map((listing) =>
            listing.id === id ? { ...listing, ...updates } : listing
          ),
          myListings: state.myListings.map((listing) =>
            listing.id === id ? { ...listing, ...updates } : listing
          ),
        }));
      },

      deleteListing: (id: string) => {
        set((state) => ({
          listings: state.listings.filter((listing) => listing.id !== id),
          myListings: state.myListings.filter((listing) => listing.id !== id),
        }));
      },

      archiveExpiredListings: () => {
        const now = Date.now();
        set((state) => ({
          listings: state.listings.map((listing) =>
            listing.expiresAt < now && listing.status === "active"
              ? { ...listing, status: "archived" }
              : listing
          ),
          myListings: state.myListings.map((listing) =>
            listing.expiresAt < now && listing.status === "active"
              ? { ...listing, status: "archived" }
              : listing
          ),
        }));
      },

      toggleFavorite: (id: string) => {
        set((state) => ({
          favoriteIds: state.favoriteIds.includes(id)
            ? state.favoriteIds.filter((fid) => fid !== id)
            : [...state.favoriteIds, id],
        }));
      },

      incrementViews: (id: string) => {
        set((state) => ({
          listings: state.listings.map((listing) =>
            listing.id === id
              ? { ...listing, views: listing.views + 1 }
              : listing
          ),
        }));
      },

      getListingById: (id: string) => {
        return get().listings.find((listing) => listing.id === id);
      },

      getUserListings: (userId: string) => {
        return get().listings.filter((listing) => listing.sellerId === userId);
      },

      loadMockData: () => {
        const mockListings: Listing[] = [
          // Kitchen Items
          {
            id: "1",
            sellerId: "seller1",
            sellerName: "Arizona Cabinets",
            sellerRating: 4.8,
            title: "White Shaker Kitchen Cabinets - Full Set",
            description: "Complete set of white shaker cabinets for kitchen remodel. Includes uppers, lowers, and island base. Soft-close hinges and dovetail drawers.",
            category: "Kitchen",
            subcategory: "Cabinets",
            listingType: "Surplus",
            price: 3200,
            images: ["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800"],
            location: "Phoenix, AZ",
            coordinates: { latitude: 33.4484, longitude: -112.0740 },
            status: "active",
            createdAt: Date.now() - 1000 * 60 * 60 * 24,
            expiresAt: Date.now() + 1000 * 60 * 60 * 48,
            views: 89,
          },
          {
            id: "2",
            sellerId: "seller2",
            sellerName: "Pro Kitchen Supply",
            sellerRating: 5.0,
            title: "GE Stainless Steel Appliance Package",
            description: "Brand new GE appliance package - fridge, range, dishwasher, microwave. Never installed, still in boxes. Paid $4800, must sell due to remodel change.",
            category: "Kitchen",
            subcategory: "Appliances",
            listingType: "New",
            price: 3500,
            images: ["https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800"],
            location: "Scottsdale, AZ",
            coordinates: { latitude: 33.4942, longitude: -111.9261 },
            status: "active",
            createdAt: Date.now() - 1000 * 60 * 60 * 12,
            expiresAt: Date.now() + 1000 * 60 * 60 * 60,
            views: 156,
          },
          // Stone & Tile Items
          {
            id: "3",
            sellerId: "seller3",
            sellerName: "Desert Stone Works",
            sellerRating: 4.5,
            title: "Calacatta Gold Quartz Slab",
            description: "Engineered quartz with Calacatta marble look. Durable and low maintenance. Perfect for high-traffic areas.",
            category: "Stone & Tile",
            subcategory: "Quartz Slabs",
            stoneType: "Quartz",
            listingType: "Slab",
            price: 890,
            images: ["https://cdn.prod.website-files.com/6456ce4476abb2d4f9fbad10/6456ce4576abb2d282fbbce3_Silestone-surprise-granite-bianco-calacatta-close-up.avif"],
            location: "Tempe, AZ",
            coordinates: { latitude: 33.4255, longitude: -111.9400 },
            dimensions: { length: 126, width: 63, thickness: 3 },
            status: "active",
            createdAt: Date.now() - 1000 * 60 * 60 * 36,
            expiresAt: Date.now() + 1000 * 60 * 60 * 36,
            views: 67,
          },
          {
            id: "4",
            sellerId: "seller1",
            sellerName: "Arizona Cabinets",
            sellerRating: 4.8,
            title: "Black Galaxy Granite Remnant",
            description: "Stunning black granite with gold flecks. Great for small projects, bar tops, or accent pieces.",
            category: "Stone & Tile",
            subcategory: "Remnants",
            stoneType: "Granite",
            listingType: "Remnant",
            price: 350,
            images: ["https://cdn.msisurfaces.com/images/colornames/thumbnails/black-galaxy-granite.jpg"],
            location: "Mesa, AZ",
            coordinates: { latitude: 33.4152, longitude: -111.8315 },
            dimensions: { length: 48, width: 30, thickness: 2 },
            status: "active",
            createdAt: Date.now() - 1000 * 60 * 60 * 6,
            expiresAt: Date.now() + 1000 * 60 * 60 * 66,
            views: 23,
          },
          // Bath Items
          {
            id: "5",
            sellerId: "seller4",
            sellerName: "Bath & Beyond AZ",
            sellerRating: 4.9,
            title: "72\" Double Vanity with Marble Top",
            description: "Beautiful double sink bathroom vanity. Espresso finish, soft-close drawers, Carrara marble top with backsplash. Used for staging only.",
            category: "Bath",
            subcategory: "Vanities",
            listingType: "Used",
            price: 1200,
            images: ["https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800"],
            location: "Glendale, AZ",
            coordinates: { latitude: 33.5387, longitude: -112.1859 },
            dimensions: { length: 72, width: 22 },
            status: "active",
            createdAt: Date.now() - 1000 * 60 * 60 * 18,
            expiresAt: Date.now() + 1000 * 60 * 60 * 54,
            views: 78,
          },
          {
            id: "6",
            sellerId: "seller2",
            sellerName: "Pro Kitchen Supply",
            sellerRating: 5.0,
            title: "Kohler Freestanding Bathtub",
            description: "Kohler Archer 5ft freestanding soaking tub. White acrylic, never installed. Includes drain kit. Retails for $2500.",
            category: "Bath",
            subcategory: "Bathtubs",
            listingType: "New",
            price: 1650,
            images: ["https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800"],
            location: "Chandler, AZ",
            coordinates: { latitude: 33.3062, longitude: -111.8413 },
            status: "active",
            createdAt: Date.now() - 1000 * 60 * 60 * 8,
            expiresAt: Date.now() + 1000 * 60 * 60 * 64,
            views: 45,
          },
          // Flooring
          {
            id: "7",
            sellerId: "seller5",
            sellerName: "Flooring Depot",
            sellerRating: 4.7,
            title: "White Oak Hardwood - 400 sq ft",
            description: "Premium white oak hardwood flooring. 5\" wide planks, satin finish. Leftover from renovation project. Sold as lot.",
            category: "Flooring",
            subcategory: "Hardwood",
            listingType: "Surplus",
            price: 2400,
            totalQuantity: 400,
            quantityUnit: "sq_ft",
            images: ["https://images.unsplash.com/photo-1615529328331-f8917597711f?w=800"],
            location: "Surprise, AZ",
            coordinates: { latitude: 33.6292, longitude: -112.3679 },
            status: "active",
            createdAt: Date.now() - 1000 * 60 * 60 * 4,
            expiresAt: Date.now() + 1000 * 60 * 60 * 68,
            views: 112,
          },
          {
            id: "8",
            sellerId: "seller3",
            sellerName: "Desert Stone Works",
            sellerRating: 4.5,
            title: "Luxury Vinyl Plank - Weathered Gray",
            description: "LifeProof luxury vinyl plank flooring. Waterproof, scratch-resistant. 12 boxes (240 sq ft total). Great for rentals or high-traffic areas.",
            category: "Flooring",
            subcategory: "Vinyl/LVP",
            listingType: "Surplus",
            price: 480,
            totalQuantity: 240,
            quantityUnit: "sq_ft",
            images: ["https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=800"],
            location: "Gilbert, AZ",
            coordinates: { latitude: 33.3528, longitude: -111.7890 },
            status: "active",
            createdAt: Date.now() - 1000 * 60 * 60 * 28,
            expiresAt: Date.now() + 1000 * 60 * 60 * 44,
            views: 87,
          },
          // Doors & Windows
          {
            id: "9",
            sellerId: "seller6",
            sellerName: "Valley Door & Window",
            sellerRating: 4.6,
            title: "8ft French Patio Doors - White",
            description: "Pella 8ft sliding French patio doors. Low-E glass, built-in blinds, white vinyl frame. Removed during kitchen expansion. Excellent condition.",
            category: "Doors & Windows",
            subcategory: "Sliding Doors",
            listingType: "Used",
            price: 850,
            images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800"],
            location: "Peoria, AZ",
            coordinates: { latitude: 33.5806, longitude: -112.2374 },
            dimensions: { length: 96, width: 80 },
            status: "active",
            createdAt: Date.now() - 1000 * 60 * 60 * 16,
            expiresAt: Date.now() + 1000 * 60 * 60 * 56,
            views: 63,
          },
          // Lighting
          {
            id: "10",
            sellerId: "seller4",
            sellerName: "Bath & Beyond AZ",
            sellerRating: 4.9,
            title: "Modern Crystal Chandelier - 36\"",
            description: "Stunning crystal chandelier with chrome finish. 36\" diameter, adjustable height. Perfect for dining room or foyer. Designer overstock.",
            category: "Lighting & Electrical",
            subcategory: "Chandeliers",
            listingType: "New",
            price: 650,
            images: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800"],
            location: "Scottsdale, AZ",
            coordinates: { latitude: 33.4942, longitude: -111.9261 },
            status: "active",
            createdAt: Date.now() - 1000 * 60 * 60 * 10,
            expiresAt: Date.now() + 1000 * 60 * 60 * 62,
            views: 134,
          },
          // Outdoor
          {
            id: "11",
            sellerId: "seller7",
            sellerName: "Desert Outdoor Living",
            sellerRating: 4.8,
            title: "Travertine Pool Pavers - 500 sq ft",
            description: "French pattern travertine pavers. Tumbled finish, non-slip. Removed from pool deck remodel. Clean and ready to install.",
            category: "Outdoor",
            subcategory: "Pavers",
            listingType: "Used",
            price: 1500,
            totalQuantity: 500,
            quantityUnit: "sq_ft",
            images: ["https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800"],
            location: "Paradise Valley, AZ",
            coordinates: { latitude: 33.5311, longitude: -111.9426 },
            status: "active",
            createdAt: Date.now() - 1000 * 60 * 60 * 20,
            expiresAt: Date.now() + 1000 * 60 * 60 * 52,
            views: 98,
          },
          // Tools & Equipment
          {
            id: "12",
            sellerId: "seller5",
            sellerName: "Flooring Depot",
            sellerRating: 4.7,
            title: "Dewalt 10\" Wet Tile Saw",
            description: "Professional grade Dewalt tile saw with stand. Cuts up to 24\" tiles. Used on 3 jobs, excellent condition. Includes extra blade.",
            category: "Tools & Equipment",
            subcategory: "Tile Saws",
            listingType: "Used",
            price: 425,
            images: ["https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800"],
            location: "Tempe, AZ",
            coordinates: { latitude: 33.4255, longitude: -111.9400 },
            status: "active",
            createdAt: Date.now() - 1000 * 60 * 60 * 14,
            expiresAt: Date.now() + 1000 * 60 * 60 * 58,
            views: 76,
          },
        ];

        set({ listings: mockListings, dataVersion: 5 });
      },
    }),
    {
      name: "listings-storage",
      storage: createJSONStorage(() => AsyncStorage),
      version: 5,
      migrate: (persistedState: any, version: number) => {
        if (version < 5) {
          // Clear old data for new category structure
          return {
            listings: [],
            myListings: [],
            favoriteIds: [],
            dataVersion: 5,
          };
        }
        return persistedState;
      },
    }
  )
);
