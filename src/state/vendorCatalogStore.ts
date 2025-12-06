import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  VendorProduct,
  VendorCatalog,
  CatalogLead,
  MaterialCategory,
  StoneType,
  ProductAvailability,
} from "../types/marketplace";

interface VendorCatalogState {
  // Data
  catalogs: VendorCatalog[];
  products: VendorProduct[];
  leads: CatalogLead[];

  // Vendor Catalog Actions
  createCatalog: (catalog: VendorCatalog) => void;
  updateCatalog: (vendorId: string, updates: Partial<VendorCatalog>) => void;
  getCatalogByVendorId: (vendorId: string) => VendorCatalog | undefined;

  // Product Actions
  addProduct: (product: VendorProduct) => void;
  updateProduct: (productId: string, updates: Partial<VendorProduct>) => void;
  deleteProduct: (productId: string) => void;
  publishProduct: (productId: string) => void;
  archiveProduct: (productId: string) => void;

  // Product Getters
  getProductsByVendor: (vendorId: string) => VendorProduct[];
  getPublishedProducts: () => VendorProduct[];
  getProductsByCategory: (category: MaterialCategory) => VendorProduct[];
  searchProducts: (query: string) => VendorProduct[];
  getFeaturedProducts: () => VendorProduct[];

  // Lead Actions
  addLead: (lead: CatalogLead) => void;
  updateLead: (leadId: string, updates: Partial<CatalogLead>) => void;
  getLeadsByVendor: (vendorId: string) => CatalogLead[];
  getNewLeadsCount: (vendorId: string) => number;

  // Load sample data
  loadSampleData: () => void;
}

export const useVendorCatalogStore = create<VendorCatalogState>()(
  persist(
    (set, get) => ({
      catalogs: [],
      products: [],
      leads: [],

      // Catalog Actions
      createCatalog: (catalog) => {
        set((state) => ({
          catalogs: [...state.catalogs, catalog],
        }));
      },

      updateCatalog: (vendorId, updates) => {
        set((state) => ({
          catalogs: state.catalogs.map((c) =>
            c.vendorId === vendorId ? { ...c, ...updates, updatedAt: Date.now() } : c
          ),
        }));
      },

      getCatalogByVendorId: (vendorId) => {
        return get().catalogs.find((c) => c.vendorId === vendorId);
      },

      // Product Actions
      addProduct: (product) => {
        set((state) => ({
          products: [product, ...state.products],
        }));
        // Update catalog product count
        const catalog = get().catalogs.find((c) => c.vendorId === product.vendorId);
        if (catalog) {
          get().updateCatalog(product.vendorId, {
            productCount: catalog.productCount + 1,
          });
        }
      },

      updateProduct: (productId, updates) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === productId ? { ...p, ...updates, updatedAt: Date.now() } : p
          ),
        }));
      },

      deleteProduct: (productId) => {
        const product = get().products.find((p) => p.id === productId);
        set((state) => ({
          products: state.products.filter((p) => p.id !== productId),
        }));
        // Update catalog product count
        if (product) {
          const catalog = get().catalogs.find((c) => c.vendorId === product.vendorId);
          if (catalog) {
            get().updateCatalog(product.vendorId, {
              productCount: Math.max(0, catalog.productCount - 1),
            });
          }
        }
      },

      publishProduct: (productId) => {
        get().updateProduct(productId, {
          status: "published",
          publishedAt: Date.now(),
        });
      },

      archiveProduct: (productId) => {
        get().updateProduct(productId, { status: "archived" });
      },

      // Product Getters
      getProductsByVendor: (vendorId) => {
        return get().products.filter((p) => p.vendorId === vendorId);
      },

      getPublishedProducts: () => {
        return get().products.filter((p) => p.status === "published");
      },

      getProductsByCategory: (category) => {
        return get().products.filter(
          (p) => p.status === "published" && p.category === category
        );
      },

      searchProducts: (query) => {
        const q = query.toLowerCase();
        return get().products.filter(
          (p) =>
            p.status === "published" &&
            (p.name.toLowerCase().includes(q) ||
              p.brand?.toLowerCase().includes(q) ||
              p.colorFamily?.toLowerCase().includes(q) ||
              p.tags?.some((t) => t.toLowerCase().includes(q)) ||
              p.alternateNames?.some((n) => n.toLowerCase().includes(q)))
        );
      },

      getFeaturedProducts: () => {
        return get().products.filter((p) => p.status === "published" && p.featured);
      },

      // Lead Actions
      addLead: (lead) => {
        set((state) => ({
          leads: [lead, ...state.leads],
        }));
      },

      updateLead: (leadId, updates) => {
        set((state) => ({
          leads: state.leads.map((l) =>
            l.id === leadId ? { ...l, ...updates, updatedAt: Date.now() } : l
          ),
        }));
      },

      getLeadsByVendor: (vendorId) => {
        return get().leads.filter((l) => l.vendorId === vendorId);
      },

      getNewLeadsCount: (vendorId) => {
        return get().leads.filter((l) => l.vendorId === vendorId && l.status === "new").length;
      },

      // Sample Data
      loadSampleData: () => {
        const sampleCatalogs: VendorCatalog[] = [
          {
            vendorId: "vendor-msi",
            vendorName: "MSI Surfaces",
            vendorType: "distributor",
            logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200",
            description: "Leading distributor of natural stone, quartz, porcelain, and tile",
            website: "https://www.msisurfaces.com",
            phone: "(800) 555-0100",
            city: "Phoenix",
            state: "AZ",
            deliveryAvailable: true,
            showroomAvailable: true,
            brands: ["Q Premium", "Stile", "Arterra", "Calacatta"],
            productCount: 0,
            rating: 4.8,
            reviewCount: 234,
            plan: "enterprise",
            verified: true,
            createdAt: Date.now() - 86400000 * 365,
            updatedAt: Date.now(),
          },
          {
            vendorId: "vendor-arizona-tile",
            vendorName: "Arizona Tile",
            vendorType: "distributor",
            logo: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=200",
            description: "Premium tile and stone distributor serving the Southwest",
            website: "https://www.arizonatile.com",
            phone: "(800) 555-0200",
            city: "Tempe",
            state: "AZ",
            deliveryAvailable: true,
            showroomAvailable: true,
            installationAvailable: false,
            brands: ["Della Terra", "Centura", "Daltile"],
            productCount: 0,
            rating: 4.7,
            reviewCount: 189,
            plan: "pro",
            verified: true,
            createdAt: Date.now() - 86400000 * 300,
            updatedAt: Date.now(),
          },
          {
            vendorId: "vendor-kb-showroom",
            vendorName: "Premier Kitchen & Bath",
            vendorType: "showroom",
            logo: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200",
            description: "Full-service kitchen and bath showroom with cabinets, appliances, plumbing fixtures",
            website: "https://www.premierkb.com",
            phone: "(602) 555-0300",
            city: "Scottsdale",
            state: "AZ",
            deliveryAvailable: true,
            showroomAvailable: true,
            installationAvailable: true,
            brands: ["KraftMaid", "Kohler", "Delta", "GE", "Bosch", "Sub-Zero"],
            productCount: 0,
            rating: 4.9,
            reviewCount: 312,
            plan: "enterprise",
            verified: true,
            createdAt: Date.now() - 86400000 * 400,
            updatedAt: Date.now(),
          },
          {
            vendorId: "vendor-lighting-plus",
            vendorName: "Lighting Plus Design",
            vendorType: "specialty_store",
            logo: "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=200",
            description: "Lighting specialists - chandeliers, pendants, ceiling fans, smart home lighting",
            website: "https://www.lightingplusdesign.com",
            phone: "(480) 555-0400",
            city: "Mesa",
            state: "AZ",
            deliveryAvailable: true,
            showroomAvailable: true,
            brands: ["Kichler", "Progress", "Hinkley", "Visual Comfort", "Lutron"],
            productCount: 0,
            rating: 4.6,
            reviewCount: 89,
            plan: "pro",
            verified: true,
            createdAt: Date.now() - 86400000 * 200,
            updatedAt: Date.now(),
          },
          {
            vendorId: "vendor-floor-masters",
            vendorName: "Floor Masters",
            vendorType: "specialty_store",
            logo: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=200",
            description: "Hardwood, LVP, carpet, and tile flooring specialists",
            website: "https://www.floormasters.com",
            phone: "(623) 555-0500",
            city: "Glendale",
            state: "AZ",
            deliveryAvailable: true,
            showroomAvailable: true,
            installationAvailable: true,
            brands: ["Shaw", "Mohawk", "Armstrong", "Mannington", "COREtec"],
            productCount: 0,
            rating: 4.7,
            reviewCount: 156,
            plan: "pro",
            verified: true,
            createdAt: Date.now() - 86400000 * 180,
            updatedAt: Date.now(),
          },
        ];

        const sampleProducts: VendorProduct[] = [
          {
            id: "prod-1",
            vendorId: "vendor-msi",
            vendorName: "MSI Surfaces",
            sku: "MSI-CAL-GOLD-001",
            name: "Calacatta Gold",
            description: "Luxurious white marble with dramatic gold and grey veining. Perfect for elegant kitchen countertops and statement pieces.",
            category: "Stone & Tile",
            subcategory: "Quartz Slabs",
            brand: "Q Premium",
            stoneType: "Quartz",
            colorFamily: "White",
            veiningStyle: "dramatic",
            finish: "polished",
            origin: "Italy",
            dimensions: { length: 126, width: 63, thickness: 3 },
            dimensionUnit: "inches",
            pricing: {
              retailPrice: 95,
              proPrice: 75,
              priceUnit: "sq_ft",
              minOrderQty: 1,
            },
            pricingVisibility: "pro_only",
            availability: "in_stock",
            stockQty: 45,
            images: [
              "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
              "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
            ],
            tags: ["luxury", "kitchen", "white", "gold veining", "popular"],
            alternateNames: ["Calacatta Oro", "Golden Calacatta"],
            featured: true,
            samplesAvailable: true,
            createdAt: Date.now() - 86400000 * 30,
            updatedAt: Date.now(),
            status: "published",
          },
          {
            id: "prod-2",
            vendorId: "vendor-msi",
            vendorName: "MSI Surfaces",
            sku: "MSI-ABS-BLK-001",
            name: "Absolute Black",
            description: "Premium solid black granite with minimal grain. Timeless and versatile for any application.",
            category: "Stone & Tile",
            subcategory: "Granite Slabs",
            brand: "Natural Stone",
            stoneType: "Granite",
            colorFamily: "Black",
            veiningStyle: "none",
            finish: "polished",
            origin: "India",
            dimensions: { length: 120, width: 60, thickness: 3 },
            dimensionUnit: "inches",
            pricing: {
              retailPrice: 55,
              proPrice: 42,
              priceUnit: "sq_ft",
              minOrderQty: 1,
            },
            pricingVisibility: "public",
            availability: "in_stock",
            stockQty: 120,
            images: [
              "https://images.unsplash.com/photo-1618220179428-22790b461013?w=800",
            ],
            tags: ["classic", "black", "granite", "durable"],
            alternateNames: ["Jet Black", "Nero Absolute", "Premium Black"],
            featured: false,
            samplesAvailable: true,
            createdAt: Date.now() - 86400000 * 60,
            updatedAt: Date.now(),
            status: "published",
          },
          {
            id: "prod-3",
            vendorId: "vendor-arizona-tile",
            vendorName: "Arizona Tile",
            sku: "AT-CARR-WHT-001",
            name: "Bianco Carrara",
            description: "Classic Italian white marble with soft grey veining. The gold standard for elegant bathrooms and kitchens.",
            category: "Stone & Tile",
            subcategory: "Marble Slabs",
            brand: "Della Terra",
            stoneType: "Marble",
            colorFamily: "White",
            veiningStyle: "subtle",
            finish: "honed",
            origin: "Italy",
            dimensions: { length: 118, width: 65, thickness: 2 },
            dimensionUnit: "inches",
            pricing: {
              retailPrice: 65,
              proPrice: 48,
              priceUnit: "sq_ft",
              minOrderQty: 1,
            },
            pricingVisibility: "pro_only",
            availability: "in_stock",
            stockQty: 32,
            images: [
              "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800",
            ],
            tags: ["marble", "italian", "classic", "bathroom", "kitchen"],
            alternateNames: ["Carrara White", "White Carrara"],
            featured: true,
            newArrival: false,
            samplesAvailable: true,
            createdAt: Date.now() - 86400000 * 45,
            updatedAt: Date.now(),
            status: "published",
          },
          {
            id: "prod-4",
            vendorId: "vendor-arizona-tile",
            vendorName: "Arizona Tile",
            sku: "AT-STEEL-GRY-001",
            name: "Steel Grey Granite",
            description: "Modern grey granite with silver and black flecks. Perfect for contemporary kitchens.",
            category: "Stone & Tile",
            subcategory: "Granite Slabs",
            brand: "Natural Stone",
            stoneType: "Granite",
            colorFamily: "Grey",
            veiningStyle: "subtle",
            finish: "polished",
            origin: "Brazil",
            dimensions: { length: 110, width: 58, thickness: 3 },
            dimensionUnit: "inches",
            pricing: {
              retailPrice: 48,
              proPrice: 35,
              priceUnit: "sq_ft",
              minOrderQty: 1,
            },
            pricingVisibility: "public",
            availability: "low_stock",
            stockQty: 8,
            images: [
              "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800",
            ],
            tags: ["grey", "modern", "granite", "contemporary"],
            alternateNames: ["Silver Grey", "Ash Grey"],
            featured: false,
            onSale: true,
            salePrice: 42,
            samplesAvailable: true,
            createdAt: Date.now() - 86400000 * 90,
            updatedAt: Date.now(),
            status: "published",
          },
          {
            id: "prod-5",
            vendorId: "vendor-msi",
            vendorName: "MSI Surfaces",
            sku: "MSI-QUARTZ-WHT-001",
            name: "Arctic White Quartz",
            description: "Pure white engineered quartz with no veining. Clean, modern, and extremely durable.",
            category: "Stone & Tile",
            subcategory: "Quartz Slabs",
            brand: "Q Premium",
            stoneType: "Quartz",
            colorFamily: "White",
            veiningStyle: "none",
            finish: "polished",
            dimensions: { length: 130, width: 65, thickness: 3 },
            dimensionUnit: "inches",
            pricing: {
              retailPrice: 72,
              proPrice: 58,
              priceUnit: "sq_ft",
              minOrderQty: 1,
            },
            pricingVisibility: "pro_only",
            availability: "in_stock",
            stockQty: 200,
            images: [
              "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800",
            ],
            tags: ["white", "clean", "modern", "quartz", "durable"],
            alternateNames: ["Pure White", "Snow White"],
            featured: false,
            newArrival: true,
            samplesAvailable: true,
            createdAt: Date.now() - 86400000 * 7,
            updatedAt: Date.now(),
            status: "published",
          },
          // Kitchen & Bath Showroom Products
          {
            id: "prod-6",
            vendorId: "vendor-kb-showroom",
            vendorName: "Premier Kitchen & Bath",
            sku: "PKB-CAB-SHK-36",
            name: "Shaker Style Base Cabinet 36\"",
            description: "Classic white shaker cabinet with soft-close doors and drawers. Full overlay design.",
            category: "Kitchen",
            subcategory: "Cabinets",
            brand: "KraftMaid",
            colorFamily: "White",
            finish: "painted",
            dimensions: { length: 36, width: 24, thickness: 34.5 },
            dimensionUnit: "inches",
            pricing: {
              retailPrice: 649,
              proPrice: 519,
              priceUnit: "each",
              minOrderQty: 1,
            },
            pricingVisibility: "pro_only",
            availability: "in_stock",
            stockQty: 24,
            images: [
              "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800",
            ],
            tags: ["shaker", "white", "cabinets", "kitchen", "base cabinet"],
            featured: true,
            samplesAvailable: false,
            createdAt: Date.now() - 86400000 * 20,
            updatedAt: Date.now(),
            status: "published",
          },
          {
            id: "prod-7",
            vendorId: "vendor-kb-showroom",
            vendorName: "Premier Kitchen & Bath",
            sku: "PKB-SINK-FARM-33",
            name: "Farmhouse Apron Front Sink 33\"",
            description: "Fireclay farmhouse sink with reversible design. Scratch and stain resistant.",
            category: "Kitchen",
            subcategory: "Sinks",
            brand: "Kohler",
            colorFamily: "White",
            dimensions: { length: 33, width: 22, thickness: 10 },
            dimensionUnit: "inches",
            pricing: {
              retailPrice: 1299,
              proPrice: 1039,
              priceUnit: "each",
              minOrderQty: 1,
            },
            pricingVisibility: "public",
            availability: "in_stock",
            stockQty: 8,
            images: [
              "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800",
            ],
            tags: ["farmhouse", "apron", "sink", "fireclay", "kitchen"],
            featured: true,
            newArrival: true,
            samplesAvailable: false,
            createdAt: Date.now() - 86400000 * 5,
            updatedAt: Date.now(),
            status: "published",
          },
          {
            id: "prod-8",
            vendorId: "vendor-kb-showroom",
            vendorName: "Premier Kitchen & Bath",
            sku: "PKB-RANGE-GAS-36",
            name: "Professional Gas Range 36\"",
            description: "6-burner professional gas range with convection oven. Stainless steel finish.",
            category: "Kitchen",
            subcategory: "Appliances",
            brand: "GE",
            manufacturer: "GE Appliances",
            colorFamily: "Stainless",
            dimensions: { length: 36, width: 28, thickness: 47 },
            dimensionUnit: "inches",
            pricing: {
              retailPrice: 3499,
              proPrice: 2799,
              priceUnit: "each",
              minOrderQty: 1,
            },
            pricingVisibility: "pro_only",
            availability: "special_order",
            leadTimeDays: 14,
            images: [
              "https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=800",
            ],
            tags: ["range", "gas", "professional", "appliances", "6 burner"],
            featured: false,
            samplesAvailable: false,
            createdAt: Date.now() - 86400000 * 45,
            updatedAt: Date.now(),
            status: "published",
          },
          // Lighting Products
          {
            id: "prod-9",
            vendorId: "vendor-lighting-plus",
            vendorName: "Lighting Plus Design",
            sku: "LP-PEND-ISLAND-3",
            name: "Kitchen Island Pendant - 3 Light",
            description: "Modern brushed nickel 3-light island pendant with clear glass shades. Perfect for kitchen islands.",
            category: "Lighting & Electrical",
            subcategory: "Pendant Lights",
            brand: "Kichler",
            colorFamily: "Nickel",
            dimensions: { length: 36, width: 5, thickness: 12 },
            dimensionUnit: "inches",
            pricing: {
              retailPrice: 389,
              proPrice: 311,
              priceUnit: "each",
              minOrderQty: 1,
            },
            pricingVisibility: "public",
            availability: "in_stock",
            stockQty: 15,
            images: [
              "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=800",
            ],
            tags: ["pendant", "island", "kitchen", "modern", "nickel"],
            featured: true,
            samplesAvailable: false,
            createdAt: Date.now() - 86400000 * 15,
            updatedAt: Date.now(),
            status: "published",
          },
          {
            id: "prod-10",
            vendorId: "vendor-lighting-plus",
            vendorName: "Lighting Plus Design",
            sku: "LP-CHAN-TRANS-6",
            name: "Transitional Chandelier 6-Light",
            description: "Elegant 6-light chandelier with oil-rubbed bronze finish. Ideal for dining rooms and foyers.",
            category: "Lighting & Electrical",
            subcategory: "Chandeliers",
            brand: "Progress",
            colorFamily: "Bronze",
            dimensions: { length: 28, width: 28, thickness: 24 },
            dimensionUnit: "inches",
            pricing: {
              retailPrice: 579,
              proPrice: 463,
              priceUnit: "each",
              minOrderQty: 1,
            },
            pricingVisibility: "pro_only",
            availability: "in_stock",
            stockQty: 6,
            images: [
              "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800",
            ],
            tags: ["chandelier", "transitional", "dining room", "bronze", "6 light"],
            featured: false,
            samplesAvailable: false,
            createdAt: Date.now() - 86400000 * 30,
            updatedAt: Date.now(),
            status: "published",
          },
          // Flooring Products
          {
            id: "prod-11",
            vendorId: "vendor-floor-masters",
            vendorName: "Floor Masters",
            sku: "FM-LVP-OAK-HONEY",
            name: "Luxury Vinyl Plank - Honey Oak",
            description: "Waterproof LVP with attached underlayment. 7\" wide planks with realistic wood grain texture.",
            category: "Flooring",
            subcategory: "Vinyl/LVP",
            brand: "COREtec",
            colorFamily: "Brown",
            finish: "textured",
            dimensions: { length: 48, width: 7, thickness: 0.28 },
            dimensionUnit: "inches",
            pricing: {
              retailPrice: 4.99,
              proPrice: 3.79,
              priceUnit: "sq_ft",
              minOrderQty: 100,
            },
            pricingVisibility: "public",
            availability: "in_stock",
            stockQty: 5000,
            images: [
              "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=800",
            ],
            tags: ["LVP", "vinyl", "waterproof", "oak", "wood look"],
            featured: true,
            onSale: true,
            salePrice: 3.99,
            samplesAvailable: true,
            createdAt: Date.now() - 86400000 * 10,
            updatedAt: Date.now(),
            status: "published",
          },
          {
            id: "prod-12",
            vendorId: "vendor-floor-masters",
            vendorName: "Floor Masters",
            sku: "FM-HW-MAPLE-NAT",
            name: "Solid Hardwood - Natural Maple",
            description: "Premium 3/4\" solid maple hardwood. Pre-finished with aluminum oxide coating. 25 year warranty.",
            category: "Flooring",
            subcategory: "Hardwood",
            brand: "Shaw",
            colorFamily: "Beige",
            finish: "satin",
            dimensions: { length: 84, width: 5, thickness: 0.75 },
            dimensionUnit: "inches",
            pricing: {
              retailPrice: 8.99,
              proPrice: 6.99,
              priceUnit: "sq_ft",
              minOrderQty: 200,
            },
            pricingVisibility: "pro_only",
            availability: "in_stock",
            stockQty: 3200,
            images: [
              "https://images.unsplash.com/photo-1560185007-5f0bb1866cab?w=800",
            ],
            tags: ["hardwood", "maple", "solid", "natural", "premium"],
            featured: false,
            samplesAvailable: true,
            createdAt: Date.now() - 86400000 * 60,
            updatedAt: Date.now(),
            status: "published",
          },
        ];

        // Update product counts for all vendors
        sampleCatalogs.forEach((catalog) => {
          catalog.productCount = sampleProducts.filter((p) => p.vendorId === catalog.vendorId).length;
        });

        set({
          catalogs: sampleCatalogs,
          products: sampleProducts,
          leads: [],
        });
      },
    }),
    {
      name: "vendor-catalog-storage",
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    }
  )
);
