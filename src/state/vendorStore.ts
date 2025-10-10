import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Vendor } from "../types/vendors";
import { ARIZONA_VENDORS } from "./real-vendors-data";

interface VendorState {
  vendors: Vendor[];
  favoriteVendorIds: string[];
  dataVersion: number;
  loadMockVendors: () => void;
  addVendor: (vendor: Vendor) => void;
  updateVendor: (vendorId: string, updates: Partial<Vendor>) => void;
  getVendorById: (vendorId: string) => Vendor | undefined;
  toggleFavoriteVendor: (vendorId: string) => void;
}

export const useVendorStore = create<VendorState>()(
  persist(
    (set, get) => ({
      vendors: [],
      favoriteVendorIds: [],
      dataVersion: 5,

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

      loadMockVendors: () => {
        set({ vendors: ARIZONA_VENDORS, dataVersion: 5 });
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
