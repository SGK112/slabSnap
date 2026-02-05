import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Vendor } from "../types/vendors";
import { ARIZONA_VENDORS } from "./real-vendors-data";
import vendorsData from "../data/vendors.json";

// Seed data version for vendors
const VENDOR_SEED_VERSION = 1;
const VENDOR_VERSION_KEY = "vendors_seed_version";

interface VendorState {
  vendors: Vendor[];
  favoriteVendorIds: string[];
  dataVersion: number;
  seedDataLoaded: boolean;
  loadMockVendors: () => void;
  loadSeedVendors: () => Promise<void>;
  checkAndLoadSeedVendors: () => Promise<void>;
  addVendor: (vendor: Vendor) => void;
  updateVendor: (vendorId: string, updates: Partial<Vendor>) => void;
  getVendorById: (vendorId: string) => Vendor | undefined;
  toggleFavoriteVendor: (vendorId: string) => void;
}

// Transform vendor from JSON format to app Vendor type
const transformVendorFromJSON = (jsonVendor: any): Vendor => ({
  id: jsonVendor.id,
  name: jsonVendor.company_name,
  type: jsonVendor.type,
  description: `${jsonVendor.services?.join(', ') || ''}`,
  location: {
    address: jsonVendor.location?.address || '',
    city: jsonVendor.location?.city || '',
    state: jsonVendor.location?.state || '',
    zipCode: jsonVendor.location?.zip || '',
    coordinates: {
      latitude: jsonVendor.location?.lat || 0,
      longitude: jsonVendor.location?.lng || 0,
    },
  },
  contact: {
    phone: jsonVendor.phone || '',
    email: jsonVendor.email || '',
    website: jsonVendor.website || '',
  },
  images: [jsonVendor.logo_url].filter(Boolean),
  rating: jsonVendor.rating || 4.5,
  reviewCount: jsonVendor.review_count || 0,
  verified: jsonVendor.verified || false,
  samplesAvailable: true,
  specialties: jsonVendor.services || [],
});

export const useVendorStore = create<VendorState>()(
  persist(
    (set, get) => ({
      vendors: [],
      favoriteVendorIds: [],
      dataVersion: 5,
      seedDataLoaded: false,

      addVendor: (vendor: Vendor) => {
        set((state) => ({
          vendors: [...state.vendors, vendor],
        }));
      },

      updateVendor: (vendorId: string, updates: Partial<Vendor>) => {
        set((state) => ({
          vendors: state.vendors.map((v) =>
            v.id === vendorId ? { ...v, ...updates } : v
          ),
        }));
      },

      getVendorById: (vendorId: string) => {
        return get().vendors.find((v) => v.id === vendorId);
      },

      // Load from real-vendors-data.ts (legacy)
      loadMockVendors: () => {
        set({ vendors: ARIZONA_VENDORS, dataVersion: 5 });
      },

      // Load from vendors.json seed data
      loadSeedVendors: async () => {
        try {
          // Transform JSON vendors to app format
          const jsonVendors = vendorsData.vendors.map(transformVendorFromJSON);

          // Merge with Arizona vendors (dedup by ID)
          const existingIds = new Set(jsonVendors.map((v: Vendor) => v.id));
          const additionalVendors = ARIZONA_VENDORS.filter(v => !existingIds.has(v.id));

          const allVendors = [...jsonVendors, ...additionalVendors];

          // Store seed version
          await AsyncStorage.setItem(VENDOR_VERSION_KEY, String(VENDOR_SEED_VERSION));

          set({
            vendors: allVendors,
            dataVersion: 6,
            seedDataLoaded: true,
          });

          console.log(`Loaded ${allVendors.length} vendors (${jsonVendors.length} from seed, ${additionalVendors.length} additional)`);
        } catch (error) {
          console.error("Failed to load seed vendors:", error);
          // Fallback to real-vendors-data
          set({ vendors: ARIZONA_VENDORS, dataVersion: 5 });
        }
      },

      // Check if vendor seed data needs to be loaded/updated
      checkAndLoadSeedVendors: async () => {
        try {
          const storedVersion = await AsyncStorage.getItem(VENDOR_VERSION_KEY);
          const currentVersion = parseInt(storedVersion || "0", 10);

          if (currentVersion < VENDOR_SEED_VERSION || !get().seedDataLoaded) {
            await get().loadSeedVendors();
          }
        } catch (error) {
          console.error("Failed to check vendor seed data:", error);
          await get().loadSeedVendors();
        }
      },

      toggleFavoriteVendor: (vendorId: string) => {
        const { favoriteVendorIds } = get();
        const isFavorite = favoriteVendorIds.includes(vendorId);

        set({
          favoriteVendorIds: isFavorite
            ? favoriteVendorIds.filter((id) => id !== vendorId)
            : [...favoriteVendorIds, vendorId],
        });
      },
    }),
    {
      name: "vendor-storage",
      storage: createJSONStorage(() => AsyncStorage),
      version: 5,
      migrate: (persistedState: any, version: number) => {
        if (version < 5 || (persistedState && persistedState.dataVersion < 5)) {
          // Force reload with real Arizona vendors
          return {
            vendors: [],
            favoriteVendorIds: [],
            dataVersion: 5,
          };
        }
        return persistedState;
      },
    }
  )
);
