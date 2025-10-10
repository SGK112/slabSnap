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
          {
            id: "1",
            sellerId: "seller1",
            sellerName: "John Stone",
            sellerRating: 4.8,
            title: "Premium Carrara Marble Slab",
            description: "Beautiful white Carrara marble slab with grey veining. Perfect for kitchen countertops or bathroom vanities. Never used, mint condition.",
            stoneType: "Marble",
            listingType: "Slab",
            price: 1200,
            images: ["https://cdn.msisurfaces.com/images/colornames/thumbnails/bianco-antico-granite.jpg"],
            location: "Phoenix, AZ",
            coordinates: { latitude: 33.4484, longitude: -112.0740 },
            dimensions: { length: 120, width: 72, thickness: 3 },
            status: "active",
            createdAt: Date.now() - 1000 * 60 * 60 * 24,
            expiresAt: Date.now() + 1000 * 60 * 60 * 48,
            views: 45,
          },
          {
            id: "2",
            sellerId: "seller2",
            sellerName: "Maria Granite",
            sellerRating: 5.0,
            title: "Black Galaxy Granite Remnant",
            description: "Stunning black granite with gold flecks. Great for small projects, bar tops, or accent pieces.",
            stoneType: "Granite",
            listingType: "Remnant",
            price: 350,
            images: ["https://cdn.msisurfaces.com/images/colornames/thumbnails/black-galaxy-granite.jpg"],
            location: "Scottsdale, AZ",
            coordinates: { latitude: 33.4942, longitude: -111.9261 },
            dimensions: { length: 48, width: 30, thickness: 2 },
            status: "active",
            createdAt: Date.now() - 1000 * 60 * 60 * 12,
            expiresAt: Date.now() + 1000 * 60 * 60 * 60,
            views: 23,
          },
          {
            id: "3",
            sellerId: "seller3",
            sellerName: "David Quartz",
            sellerRating: 4.5,
            title: "Calacatta Gold Quartz Slab",
            description: "Engineered quartz with Calacatta marble look. Durable and low maintenance. Perfect for high-traffic areas.",
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
            sellerName: "John Stone",
            sellerRating: 4.8,
            title: "Alaska White Granite Remnant",
            description: "Natural white granite remnant with dramatic veining, heat-resistant and durable. Ideal for kitchen islands or bathroom counters.",
            stoneType: "Granite",
            listingType: "Remnant",
            price: 425,
            images: ["https://cdn.msisurfaces.com/images/colornames/thumbnails/andino-white-granite.jpg"],
            location: "Mesa, AZ",
            coordinates: { latitude: 33.4152, longitude: -111.8315 },
            dimensions: { length: 54, width: 36, thickness: 2 },
            status: "active",
            createdAt: Date.now() - 1000 * 60 * 60 * 6,
            expiresAt: Date.now() + 1000 * 60 * 60 * 66,
            views: 12,
          },
          {
            id: "5",
            sellerId: "seller4",
            sellerName: "Sarah Marble",
            sellerRating: 4.9,
            title: "Giallo Ornamental Granite Slab",
            description: "Warm golden granite with intricate patterns. Adds elegance to any space. Professionally cut and polished.",
            stoneType: "Granite",
            listingType: "Slab",
            price: 950,
            images: ["https://cdn.msisurfaces.com/images/colornames/thumbnails/giallo-ornamental-granite.jpg"],
            location: "Glendale, AZ",
            coordinates: { latitude: 33.5387, longitude: -112.1859 },
            dimensions: { length: 118, width: 70, thickness: 3 },
            status: "active",
            createdAt: Date.now() - 1000 * 60 * 60 * 18,
            expiresAt: Date.now() + 1000 * 60 * 60 * 54,
            views: 89,
          },
          {
            id: "6",
            sellerId: "seller2",
            sellerName: "Maria Granite",
            sellerRating: 5.0,
            title: "Blue Pearl Granite Slab",
            description: "Stunning Norwegian granite with blue shimmer and metallic appearance. Rare and beautiful stone perfect for statement pieces.",
            stoneType: "Granite",
            listingType: "Slab",
            price: 1350,
            images: ["https://cdn.msisurfaces.com/images/colornames/thumbnails/blue-pearl-granite.jpg"],
            location: "Chandler, AZ",
            coordinates: { latitude: 33.3062, longitude: -111.8413 },
            dimensions: { length: 124, width: 74, thickness: 3 },
            status: "active",
            createdAt: Date.now() - 1000 * 60 * 60 * 8,
            expiresAt: Date.now() + 1000 * 60 * 60 * 64,
            views: 103,
          },
          {
            id: "7",
            sellerId: "seller5",
            sellerName: "Tom Countertops",
            sellerRating: 4.7,
            title: "Colonial White Granite Remnant",
            description: "Classic white granite with subtle grey and beige flecks. Perfect size for bathroom vanities or small kitchen projects.",
            stoneType: "Granite",
            listingType: "Remnant",
            price: 380,
            images: ["https://cdn.msisurfaces.com/images/colornames/thumbnails/colonial-white-granite.jpg"],
            location: "Surprise, AZ",
            coordinates: { latitude: 33.6292, longitude: -112.3679 },
            dimensions: { length: 52, width: 34, thickness: 2 },
            status: "active",
            createdAt: Date.now() - 1000 * 60 * 60 * 4,
            expiresAt: Date.now() + 1000 * 60 * 60 * 68,
            views: 34,
          },
          {
            id: "8",
            sellerId: "seller3",
            sellerName: "David Quartz",
            sellerRating: 4.5,
            title: "Absolute Black Granite Slab",
            description: "Premium jet black granite. Consistent color, highly polished finish. Timeless elegance for modern kitchens.",
            stoneType: "Granite",
            listingType: "Slab",
            price: 1100,
            images: ["https://cdn.msisurfaces.com/images/colornames/thumbnails/absolute-black-granite.jpg"],
            location: "Gilbert, AZ",
            coordinates: { latitude: 33.3528, longitude: -111.7890 },
            dimensions: { length: 122, width: 72, thickness: 3 },
            status: "active",
            createdAt: Date.now() - 1000 * 60 * 60 * 28,
            expiresAt: Date.now() + 1000 * 60 * 60 * 44,
            views: 156,
          },
        ];

        set({ listings: mockListings, dataVersion: 4 });
      },
    }),
    {
      name: "listings-storage",
      storage: createJSONStorage(() => AsyncStorage),
      version: 4,
      migrate: (persistedState: any, version: number) => {
        if (version < 4) {
          // Clear old data and return fresh state
          return {
            listings: [],
            myListings: [],
            favoriteIds: [],
            dataVersion: 4,
          };
        }
        return persistedState;
      },
    }
  )
);
