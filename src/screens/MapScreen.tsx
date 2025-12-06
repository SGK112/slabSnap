import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Dimensions,
  Linking,
  TextInput,
  ActivityIndicator,
  Animated as RNAnimated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, Region, Polyline } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../utils/colors";
import { useVendorStore } from "../state/vendorStore";
import { useListingsStore } from "../state/listingsStore";
import { useJobsStore } from "../state/jobsStore";
import { Vendor, VendorType } from "../types/vendors";
import { Listing } from "../types/marketplace";
import { Job } from "../types/jobs";
import * as Location from "expo-location";
import { BlurView } from "expo-blur";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore, ProjectIntent, ProjectType } from "../state/authStore";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../nav";
import { geocodeAddress } from "../utils/geocoding";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type MapItemType = "vendor" | "listing";

const VENDOR_TYPE_ICONS: Record<VendorType, keyof typeof Ionicons.glyphMap> = {
  fabricator: "hammer",
  "tile-store": "grid",
  "home-remodeling": "home",
  "countertop-specialist": "cube",
  "stone-supplier": "business",
  installer: "construct",
  designer: "color-palette",
  "cabinet-maker": "albums",
  "wood-supplier": "leaf",
  "lighting-store": "bulb",
  "metal-fabricator": "hardware-chip",
  "glass-supplier": "square-outline",
  "landscaping-supply": "flower",
  "plumbing-supply": "water",
  "appliance-store": "tv",
  "paint-store": "color-fill",
  "flooring-store": "layers",
  "hardware-store": "build",
  "window-door-supplier": "browsers",
  "general-contractor": "briefcase",
  architect: "easel",
};

const VENDOR_TYPE_COLORS: Record<VendorType, string> = {
  fabricator: "#ef4444",
  "tile-store": "#f59e0b",
  "home-remodeling": "#10b981",
  "countertop-specialist": "#3b82f6",
  "stone-supplier": "#8b5cf6",
  installer: "#ec4899",
  designer: "#14b8a6",
  "cabinet-maker": "#6366f1",
  "wood-supplier": "#84cc16",
  "lighting-store": "#eab308",
  "metal-fabricator": "#64748b",
  "glass-supplier": "#06b6d4",
  "landscaping-supply": "#22c55e",
  "plumbing-supply": "#0ea5e9",
  "appliance-store": "#a855f7",
  "paint-store": "#f43f5e",
  "flooring-store": "#d97706",
  "hardware-store": "#78716c",
  "window-door-supplier": "#0891b2",
  "general-contractor": "#7c3aed",
  architect: "#2563eb",
};

const VENDOR_TYPE_LABELS: Record<VendorType, string> = {
  fabricator: "Fabricator",
  "tile-store": "Tile Store",
  "home-remodeling": "Home Remodeling",
  "countertop-specialist": "Countertop Specialist",
  "stone-supplier": "Stone Supplier",
  installer: "Installer",
  designer: "Designer",
  "cabinet-maker": "Cabinet Maker",
  "wood-supplier": "Wood Supplier",
  "lighting-store": "Lighting Store",
  "metal-fabricator": "Metal Fabricator",
  "glass-supplier": "Glass Supplier",
  "landscaping-supply": "Landscaping Supply",
  "plumbing-supply": "Plumbing Supply",
  "appliance-store": "Appliance Store",
  "paint-store": "Paint Store",
  "flooring-store": "Flooring Store",
  "hardware-store": "Hardware Store",
  "window-door-supplier": "Window & Door",
  "general-contractor": "General Contractor",
  architect: "Architect",
};

// Project type visual config
const PROJECT_TYPE_CONFIG: Record<ProjectType, { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
  kitchen: { icon: "restaurant", color: "#f97316", label: "Kitchen" },
  bathroom: { icon: "water", color: "#06b6d4", label: "Bathroom" },
  outdoor: { icon: "sunny", color: "#22c55e", label: "Outdoor" },
  flooring: { icon: "apps", color: "#a855f7", label: "Flooring" },
  countertops: { icon: "layers", color: "#6366f1", label: "Countertops" },
  plumbing: { icon: "construct", color: "#3b82f6", label: "Plumbing" },
  electrical: { icon: "flash", color: "#eab308", label: "Electrical" },
  landscaping: { icon: "leaf", color: "#10b981", label: "Landscaping" },
  general: { icon: "build", color: "#6b7280", label: "General" },
};

// Keyword mapping for intelligent search
const SEARCH_KEYWORDS: Record<string, VendorType[]> = {
  // Countertop related
  countertop: ["countertop-specialist", "fabricator", "stone-supplier"],
  countertops: ["countertop-specialist", "fabricator", "stone-supplier"],
  counter: ["countertop-specialist", "fabricator"],
  
  // Tile related
  tile: ["tile-store", "installer"],
  tiles: ["tile-store", "installer"],
  tiling: ["tile-store", "installer"],
  
  // Stone/Slab related
  slab: ["stone-supplier", "fabricator"],
  slabs: ["stone-supplier", "fabricator"],
  granite: ["stone-supplier", "fabricator", "countertop-specialist"],
  marble: ["stone-supplier", "fabricator", "countertop-specialist"],
  quartz: ["stone-supplier", "fabricator", "countertop-specialist"],
  quartzite: ["stone-supplier", "fabricator", "countertop-specialist"],
  stone: ["stone-supplier", "fabricator"],
  
  // Fabrication related
  fabrication: ["fabricator"],
  fabricator: ["fabricator"],
  fabricate: ["fabricator"],
  
  // Installation related
  install: ["installer", "countertop-specialist"],
  installer: ["installer"],
  installation: ["installer", "countertop-specialist"],
  
  // Remodeling related
  remodel: ["home-remodeling", "designer", "countertop-specialist"],
  remodeling: ["home-remodeling", "designer", "countertop-specialist"],
  renovation: ["home-remodeling", "designer"],
  
  // Design related
  design: ["designer", "home-remodeling"],
  designer: ["designer"],
  
  // Kitchen/Bathroom
  kitchen: ["countertop-specialist", "fabricator", "home-remodeling", "designer"],
  bathroom: ["countertop-specialist", "tile-store", "home-remodeling", "designer"],
  
  // Supplier related
  supplier: ["stone-supplier"],
  supply: ["stone-supplier"],
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Types for clustering
interface MapCluster {
  id: string;
  latitude: number;
  longitude: number;
  count: number;
  items: Array<{ type: "vendor" | "listing" | "job"; item: Vendor | Listing | Job }>;
}

// Calculate distance between two coordinates in miles
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Check if vendor is currently open based on business hours
function isVendorOpen(vendor: Vendor): boolean {
  // Default business hours if not specified
  const defaultHours = {
    open: 8, // 8 AM
    close: 18, // 6 PM
  };

  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

  // Weekend check - assume closed on Sunday, reduced hours Saturday
  if (currentDay === 0) return false; // Sunday - closed
  if (currentDay === 6) {
    // Saturday - 9 AM to 3 PM
    return currentHour >= 9 && currentHour < 15;
  }

  // Use vendor's hours if available, otherwise default
  const hours = vendor.businessHours || defaultHours;
  const openHour = typeof hours === "object" && "open" in hours ? hours.open : defaultHours.open;
  const closeHour = typeof hours === "object" && "close" in hours ? hours.close : defaultHours.close;

  return currentHour >= openHour && currentHour < closeHour;
}

// Simple clustering algorithm
function clusterMarkers(
  vendors: Vendor[],
  listings: Listing[],
  jobs: Job[],
  zoomLevel: number,
  showVendors: boolean,
  showListings: boolean,
  showJobs: boolean
): { clusters: MapCluster[]; unclustered: Array<{ type: string; item: any }> } {
  // Clustering threshold based on zoom level (in degrees)
  // Lower zoom = more clustered, higher zoom = less clustered
  const clusterThreshold = zoomLevel > 0.1 ? 0.08 : zoomLevel > 0.05 ? 0.04 : 0.02;

  const allItems: Array<{ type: "vendor" | "listing" | "job"; item: any; lat: number; lng: number }> = [];

  // Collect all items with coordinates
  if (showVendors) {
    vendors.forEach(v => {
      if (v.location?.coordinates) {
        allItems.push({
          type: "vendor",
          item: v,
          lat: v.location.coordinates.latitude,
          lng: v.location.coordinates.longitude,
        });
      }
    });
  }

  if (showListings) {
    listings.forEach(l => {
      if (l.coordinates) {
        allItems.push({
          type: "listing",
          item: l,
          lat: l.coordinates.latitude,
          lng: l.coordinates.longitude,
        });
      }
    });
  }

  if (showJobs) {
    jobs.forEach(j => {
      if (j.coordinates) {
        allItems.push({
          type: "job",
          item: j,
          lat: j.coordinates.latitude,
          lng: j.coordinates.longitude,
        });
      }
    });
  }

  // If few items or zoomed in, don't cluster
  if (allItems.length <= 5 || zoomLevel < 0.03) {
    return {
      clusters: [],
      unclustered: allItems.map(i => ({ type: i.type, item: i.item })),
    };
  }

  const clusters: MapCluster[] = [];
  const clustered = new Set<number>();

  // Simple greedy clustering
  for (let i = 0; i < allItems.length; i++) {
    if (clustered.has(i)) continue;

    const nearby: typeof allItems = [allItems[i]];
    clustered.add(i);

    for (let j = i + 1; j < allItems.length; j++) {
      if (clustered.has(j)) continue;

      const latDiff = Math.abs(allItems[i].lat - allItems[j].lat);
      const lngDiff = Math.abs(allItems[i].lng - allItems[j].lng);

      if (latDiff < clusterThreshold && lngDiff < clusterThreshold) {
        nearby.push(allItems[j]);
        clustered.add(j);
      }
    }

    if (nearby.length >= 3) {
      // Create cluster
      const avgLat = nearby.reduce((sum, n) => sum + n.lat, 0) / nearby.length;
      const avgLng = nearby.reduce((sum, n) => sum + n.lng, 0) / nearby.length;

      clusters.push({
        id: `cluster-${i}`,
        latitude: avgLat,
        longitude: avgLng,
        count: nearby.length,
        items: nearby.map(n => ({ type: n.type, item: n.item })),
      });
    }
  }

  // Get unclustered items
  const unclustered = allItems
    .filter((_, i) => !clustered.has(i) || allItems.filter((_, j) => clustered.has(j)).length < 3)
    .map(i => ({ type: i.type, item: i.item }));

  return { clusters, unclustered };
}

// Route stop interface
interface RouteStop {
  id: string;
  name: string;
  coordinates: { latitude: number; longitude: number };
  type: "vendor" | "listing" | "job" | "user";
}

// Memoized Vendor Marker Component to prevent flickering
const VendorMarker = React.memo(({ 
  vendor, 
  isSelected, 
  onPress 
}: { 
  vendor: Vendor; 
  isSelected: boolean; 
  onPress: () => void;
}) => (
  <Marker
    key={`vendor-${vendor.id}`}
    coordinate={vendor.location.coordinates}
    onPress={onPress}
  >
    <View style={styles.markerContainer}>
      <View
        style={[
          styles.vendorMarker,
          {
            backgroundColor: VENDOR_TYPE_COLORS[vendor.type],
            borderColor: isSelected ? "white" : "transparent",
            borderWidth: 3,
          },
        ]}
      >
        <Ionicons
          name={VENDOR_TYPE_ICONS[vendor.type]}
          size={20}
          color="white"
        />
      </View>
      {vendor.verified && (
        <View style={styles.verifiedMarkerBadge}>
          <Ionicons name="checkmark-circle" size={12} color="#10b981" />
        </View>
      )}
    </View>
  </Marker>
));

// Memoized Listing Marker Component to prevent flickering
const ListingMarker = React.memo(({ 
  listing, 
  isSelected, 
  onPress 
}: { 
  listing: Listing; 
  isSelected: boolean; 
  onPress: () => void;
}) => {
  if (!listing.coordinates) return null;
  
  return (
    <Marker
      key={`listing-${listing.id}`}
      coordinate={listing.coordinates}
      onPress={onPress}
    >
      <View style={styles.markerContainer}>
        <View
          style={[
            styles.listingMarker,
            {
              borderColor: isSelected ? colors.accent[500] : "white",
              borderWidth: isSelected ? 3 : 2,
            },
          ]}
        >
          <Ionicons
            name={listing.listingType === "Slab" ? "square" : "apps"}
            size={18}
            color={colors.accent[500]}
          />
        </View>
        {listing.listingType === "Remnant" && (
          <View style={styles.remnantBadge}>
            <Text style={styles.remnantBadgeText}>R</Text>
          </View>
        )}
      </View>
    </Marker>
  );
});

// Memoized Job Marker Component to prevent flickering
const JobMarker = React.memo(({
  job,
  isSelected,
  onPress
}: {
  job: Job;
  isSelected: boolean;
  onPress: () => void;
}) => {
  if (!job.coordinates) return null;

  return (
    <Marker
      key={`job-${job.id}`}
      coordinate={job.coordinates}
      onPress={onPress}
    >
      <View style={styles.markerContainer}>
        <View
          style={[
            styles.jobMarker,
            {
              borderColor: isSelected ? "#8b5cf6" : "white",
              borderWidth: isSelected ? 3 : 2,
            },
          ]}
        >
          <Ionicons
            name="briefcase"
            size={18}
            color="#8b5cf6"
          />
        </View>
        {job.bidCount > 0 && (
          <View style={styles.jobBadge}>
            <Text style={styles.jobBadgeText}>{job.bidCount}</Text>
          </View>
        )}
      </View>
    </Marker>
  );
});

// Memoized Project Marker Component for user's own projects
const ProjectMarker = React.memo(({
  project,
  isSelected,
  onPress,
}: {
  project: ProjectIntent;
  isSelected: boolean;
  onPress: () => void;
}) => {
  if (!project.location) return null;

  const config = PROJECT_TYPE_CONFIG[project.type] || PROJECT_TYPE_CONFIG.general;

  return (
    <Marker
      key={`project-${project.id}`}
      coordinate={{
        latitude: project.location.latitude,
        longitude: project.location.longitude,
      }}
      onPress={onPress}
    >
      <View style={styles.markerContainer}>
        <View
          style={[
            styles.projectMarker,
            {
              backgroundColor: config.color,
              borderColor: isSelected ? "white" : "transparent",
              borderWidth: isSelected ? 3 : 0,
            },
          ]}
        >
          <Ionicons name={config.icon} size={18} color="white" />
        </View>
        {/* "My Project" badge */}
        <View style={styles.myProjectBadge}>
          <Ionicons name="home" size={10} color="#fff" />
        </View>
      </View>
    </Marker>
  );
});

// Helper function to get vendor types from search query
function getVendorTypesFromSearch(searchQuery: string): VendorType[] {
  const searchLower = searchQuery.toLowerCase().trim();
  const matchedTypes = new Set<VendorType>();
  
  // Check each keyword
  Object.entries(SEARCH_KEYWORDS).forEach(([keyword, types]) => {
    if (searchLower.includes(keyword)) {
      types.forEach(type => matchedTypes.add(type));
    }
  });
  
  return Array.from(matchedTypes);
}

// Helper function to check if vendor matches search intelligently
function vendorMatchesSearch(vendor: Vendor, searchQuery: string): boolean {
  if (!searchQuery) return true;
  
  const searchLower = searchQuery.toLowerCase().trim();
  
  // Direct name/description/location match
  const directMatch = 
    vendor.name.toLowerCase().includes(searchLower) ||
    vendor.description.toLowerCase().includes(searchLower) ||
    vendor.location.address.toLowerCase().includes(searchLower) ||
    vendor.location.city.toLowerCase().includes(searchLower) ||
    vendor.location.state.toLowerCase().includes(searchLower) ||
    vendor.location.zipCode.toLowerCase().includes(searchLower) ||
    `${vendor.location.city} ${vendor.location.state}`.toLowerCase().includes(searchLower) ||
    `${vendor.location.city}, ${vendor.location.state}`.toLowerCase().includes(searchLower) ||
    (vendor.specialties && vendor.specialties.some(s => s.toLowerCase().includes(searchLower)));
  
  if (directMatch) return true;
  
  // Check tags
  if (vendor.tags && vendor.tags.some(tag => tag.toLowerCase().includes(searchLower))) {
    return true;
  }
  
  // Check stone inventory for specific stone names/types/colors
  if (vendor.stoneInventory) {
    const stoneMatch = vendor.stoneInventory.some(stone => 
      stone.stoneName.toLowerCase().includes(searchLower) ||
      stone.stoneType.toLowerCase().includes(searchLower) ||
      stone.color.toLowerCase().includes(searchLower) ||
      (stone.supplierBrand && stone.supplierBrand.toLowerCase().includes(searchLower))
    );
    if (stoneMatch) return true;
  }
  
  // Check supplier relationships - search for vendors by their suppliers
  // e.g., search "MSI" shows all contractors who buy from MSI
  // or search "Cosentino" shows all who buy from Cosentino
  if (vendor.supplierRelationships) {
    const supplierMatch = vendor.supplierRelationships.some(rel =>
      rel.vendorName.toLowerCase().includes(searchLower) ||
      rel.activeInventory.some(item => item.toLowerCase().includes(searchLower))
    );
    if (supplierMatch) return true;
  }
  
  // Keyword-based type matching
  const relevantTypes = getVendorTypesFromSearch(searchQuery);
  if (relevantTypes.length > 0 && relevantTypes.includes(vendor.type)) {
    return true;
  }
  
  // Check if vendor type label matches
  const typeLabel = VENDOR_TYPE_LABELS[vendor.type].toLowerCase();
  if (typeLabel.includes(searchLower)) {
    return true;
  }
  
  return false;
}

export default function MapScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { vendors, loadMockVendors, favoriteVendorIds, toggleFavoriteVendor } = useVendorStore();
  const { listings, loadMockData, favoriteIds, toggleFavorite } = useListingsStore();
  const { jobs, loadMockJobs } = useJobsStore();
  const { preferences } = useAuthStore();
  const mapRef = useRef<MapView>(null);

  // Get user's projects from preferences
  const myProjects = (preferences.activeProjects || []).filter(p => p.location);
  
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showFullCard, setShowFullCard] = useState(false); // Toggle between preview and full card
  const [selectedTypes, setSelectedTypes] = useState<VendorType[]>([]); // Empty = show all types
  const [userLocation, setUserLocation] = useState<Region | null>(null);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 33.6369,  // Default: Surprise, AZ
    longitude: -112.3652,
    latitudeDelta: 0.15,
    longitudeDelta: 0.15,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showCategoryFilters, setShowCategoryFilters] = useState(false);
  const [showListings, setShowListings] = useState(true); // Enable listings by default
  const [showVendors, setShowVendors] = useState(true);
  const [showJobs, setShowJobs] = useState(false);
  const [showMyProjects, setShowMyProjects] = useState(true); // Show user's pinned projects
  const [selectedProject, setSelectedProject] = useState<ProjectIntent | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [geocodedVendors, setGeocodedVendors] = useState<Vendor[]>([]);
  const [geocodedListings, setGeocodedListings] = useState<Listing[]>([]);
  const [geocodedJobs, setGeocodedJobs] = useState<Job[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // New map enhancement states
  const [showOpenOnly, setShowOpenOnly] = useState(false); // "Open Now" filter
  const [currentZoom, setCurrentZoom] = useState(0.15); // Track zoom level for clustering
  const [routeMode, setRouteMode] = useState(false); // Route planner mode
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]); // Stops in route
  const [showNearbyVendors, setShowNearbyVendors] = useState(false); // "Near This Listing" mode
  const [nearbyRadius, setNearbyRadius] = useState(5); // Miles radius for nearby
  const [selectedCluster, setSelectedCluster] = useState<MapCluster | null>(null); // Expanded cluster

  useEffect(() => {
    // Always reload vendors to ensure latest data (especially for new Arizona vendors)
    loadMockVendors();
    
    if (listings.length === 0) {
      loadMockData();
    }
    
    if (jobs.length === 0) {
      loadMockJobs();
    }
    
    getUserLocation();
  }, []);

  // Geocode everything when data loads
  useEffect(() => {
    if (vendors.length > 0 && geocodedVendors.length === 0) {
      geocodeAllData();
    }
  }, [vendors, listings, jobs]);

  const geocodeAllData = async () => {
    setIsGeocoding(true);
    console.log("[MapScreen] Starting geocoding for all data...");
    
    // Geocode vendors
    const updatedVendors = await Promise.all(
      vendors.map(async (vendor) => {
        const coords = await geocodeAddress(
          vendor.location.address,
          vendor.location.city,
          vendor.location.state,
          vendor.location.zipCode
        );
        
        if (coords) {
          console.log(`[Geocoded Vendor] ${vendor.name}: ${coords.latitude}, ${coords.longitude}`);
          return {
            ...vendor,
            location: {
              ...vendor.location,
              coordinates: coords,
            },
          };
        }
        
        console.warn(`[Geocode Failed] ${vendor.name}, using original coords`);
        return vendor;
      })
    );
    
    // Geocode listings that don't have coordinates or need update
    const updatedListings = await Promise.all(
      listings.map(async (listing) => {
        // Parse location string (e.g. "Phoenix, AZ")
        const locationParts = listing.location.split(",").map(s => s.trim());
        if (locationParts.length >= 2) {
          const city = locationParts[0];
          const state = locationParts[1];
          
          const coords = await geocodeAddress("", city, state, "");
          
          if (coords) {
            console.log(`[Geocoded Listing] ${listing.title}: ${coords.latitude}, ${coords.longitude}`);
            return {
              ...listing,
              coordinates: coords,
            };
          }
        }
        
        console.warn(`[Geocode Failed] Listing: ${listing.title}, using original coords`);
        return listing;
      })
    );
    
    // Geocode jobs that have location data
    const updatedJobs = await Promise.all(
      jobs.map(async (job) => {
        // Parse job location (e.g. "Phoenix, AZ")
        const locationParts = job.location.split(",").map(s => s.trim());
        if (locationParts.length >= 2) {
          const city = locationParts[0];
          const state = locationParts[1];
          
          const coords = await geocodeAddress("", city, state, "");
          
          if (coords) {
            console.log(`[Geocoded Job] ${job.title}: ${coords.latitude}, ${coords.longitude}`);
            return {
              ...job,
              coordinates: coords,
            };
          }
        }
        
        console.warn(`[Geocode Failed] Job: ${job.title}`);
        return job;
      })
    );
    
    setGeocodedVendors(updatedVendors);
    setGeocodedListings(updatedListings);
    setGeocodedJobs(updatedJobs);
    setIsGeocoding(false);
    console.log("[MapScreen] Geocoding complete!");
  };

  // Debug: Log vendor count
  useEffect(() => {
    console.log(`[MapScreen] Loaded ${vendors.length} vendors`);
    if (vendors.length > 0) {
      console.log('[MapScreen] First vendor:', vendors[0]?.name, vendors[0]?.location?.city);
      const azVendors = vendors.filter(v => v.location.state === 'AZ');
      console.log(`[MapScreen] Arizona vendors: ${azVendors.length}`);
      azVendors.forEach(v => console.log(`  - ${v.name} at ${v.location.city}`));
    }
  }, [vendors]);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("[MapScreen] Location permission not granted");
        return;
      }

      console.log("[MapScreen] Getting current position...");
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      console.log(`[MapScreen] Got location: ${location.coords.latitude}, ${location.coords.longitude}`);

      // 5 mile radius = ~0.072 degrees latitude, so delta of 0.15 covers ~10 miles
      const region: Region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.15,
        longitudeDelta: 0.15,
      };

      setUserLocation(region);
      setMapRegion(region);

      // Animate map to user location
      if (mapRef.current) {
        mapRef.current.animateToRegion(region, 1000);
      }
    } catch (error) {
      console.error("[MapScreen] Error getting location:", error);
    }
  };

  // Filter vendors - use geocoded vendors if available
  const vendorsToUse = geocodedVendors.length > 0 ? geocodedVendors : vendors;
  const filteredVendors = vendorsToUse.filter((vendor) => {
    if (!showVendors) return false;

    const matchesTypeFilter = selectedTypes.length === 0 || selectedTypes.includes(vendor.type);

    // Use intelligent search matching
    const matchesSearch = vendorMatchesSearch(vendor, searchQuery);

    // "Open Now" filter
    const matchesOpenFilter = !showOpenOnly || isVendorOpen(vendor);

    // "Near This Listing" filter
    let matchesNearbyFilter = true;
    if (showNearbyVendors && selectedListing?.coordinates && vendor.location?.coordinates) {
      const distance = calculateDistance(
        selectedListing.coordinates.latitude,
        selectedListing.coordinates.longitude,
        vendor.location.coordinates.latitude,
        vendor.location.coordinates.longitude
      );
      matchesNearbyFilter = distance <= nearbyRadius;
    }

    return matchesTypeFilter && matchesSearch && matchesOpenFilter && matchesNearbyFilter;
  });

  // Calculate open vendor count for UI badge
  const openVendorCount = vendorsToUse.filter(v => showVendors && isVendorOpen(v)).length;

  // Filter listings - use geocoded listings if available
  const listingsToUse = geocodedListings.length > 0 ? geocodedListings : listings;
  const filteredListings = listingsToUse.filter((listing) => {
    if (!showListings) return false;
    if (!listing.coordinates) return false;
    if (listing.status !== "active") return false;
    
    const matchesSearch = !searchQuery ||
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (listing.stoneType?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    return matchesSearch;
  });

  // Auto-enable relevant categories when searching
  React.useEffect(() => {
    if (searchQuery.trim()) {
      // Check what type of results match the search
      const hasVendorMatches = vendorsToUse.some(v => vendorMatchesSearch(v, searchQuery));
      const hasListingMatches = listingsToUse.some(l => {
        if (!l.coordinates || l.status !== "active") return false;
        return l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (l.stoneType?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      });
      const hasJobMatches = jobsToUse.some(j => {
        if (!j.coordinates || j.status !== "open") return false;
        return j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          j.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          j.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          j.category.toLowerCase().includes(searchQuery.toLowerCase());
      });

      // Auto-enable categories that have matches
      if (hasListingMatches && !showListings) {
        setShowListings(true);
      }
      if (hasJobMatches && !showJobs) {
        setShowJobs(true);
      }
      // Vendors are already enabled by default
    }
  }, [searchQuery]);

  // Filter jobs - use geocoded jobs if available
  const jobsToUse = geocodedJobs.length > 0 ? geocodedJobs : jobs;
  const filteredJobs = jobsToUse.filter((job) => {
    if (!showJobs) return false;
    if (!job.coordinates) return false;
    if (job.status !== "open") return false;
    
    const matchesSearch = !searchQuery ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const toggleTypeFilter = (type: VendorType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleVendorMarkerPress = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setSelectedListing(null);
    setSelectedJob(null);
    setSelectedProject(null);
    setShowFullCard(false); // Show preview first
    
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: vendor.location.coordinates.latitude,
        longitude: vendor.location.coordinates.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 500);
    }
  };

  const handleListingMarkerPress = (listing: Listing) => {
    if (!listing.coordinates) return;

    setSelectedListing(listing);
    setSelectedVendor(null);
    setSelectedJob(null);
    setSelectedProject(null);
    setShowFullCard(false); // Show preview first
    
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: listing.coordinates.latitude,
        longitude: listing.coordinates.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 500);
    }
  };

  const handleJobMarkerPress = (job: Job) => {
    if (!job.coordinates) return;

    setSelectedJob(job);
    setSelectedVendor(null);
    setSelectedListing(null);
    setSelectedProject(null);
    setShowFullCard(false); // Show preview first

    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: job.coordinates.latitude,
        longitude: job.coordinates.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 500);
    }
  };

  const handleProjectMarkerPress = (project: ProjectIntent) => {
    if (!project.location) return;

    setSelectedProject(project);
    setSelectedVendor(null);
    setSelectedListing(null);
    setSelectedJob(null);
    setShowFullCard(false);

    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: project.location.latitude,
        longitude: project.location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 500);
    }
  };

  const handleCall = (phone: string) => {
    const phoneNumber = phone.replace(/[^0-9]/g, "");
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleDirections = (coords: { latitude: number; longitude: number }) => {
    const { latitude, longitude } = coords;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  // Track zoom level for clustering
  const handleRegionChange = useCallback((region: Region) => {
    setCurrentZoom(region.latitudeDelta);
  }, []);

  // Route planner functions
  const addToRoute = useCallback((item: Vendor | Listing | Job, type: "vendor" | "listing" | "job") => {
    let coords: { latitude: number; longitude: number } | undefined;
    let name = "";
    let id = "";

    if (type === "vendor") {
      const vendor = item as Vendor;
      coords = vendor.location?.coordinates;
      name = vendor.name;
      id = `vendor-${vendor.id}`;
    } else if (type === "listing") {
      const listing = item as Listing;
      coords = listing.coordinates;
      name = listing.title;
      id = `listing-${listing.id}`;
    } else {
      const job = item as Job;
      coords = job.coordinates;
      name = job.title;
      id = `job-${job.id}`;
    }

    if (!coords) return;

    // Don't add duplicates
    if (routeStops.find(s => s.id === id)) return;

    setRouteStops(prev => [...prev, { id, name, coordinates: coords!, type }]);
  }, [routeStops]);

  const removeFromRoute = useCallback((stopId: string) => {
    setRouteStops(prev => prev.filter(s => s.id !== stopId));
  }, []);

  const clearRoute = useCallback(() => {
    setRouteStops([]);
    setRouteMode(false);
  }, []);

  const openRouteInMaps = useCallback(() => {
    if (routeStops.length === 0) return;

    // Build Google Maps URL with multiple waypoints
    let url = "https://www.google.com/maps/dir/";

    // Add current location as start
    if (userLocation) {
      url += `${userLocation.latitude},${userLocation.longitude}/`;
    }

    // Add all stops
    routeStops.forEach((stop, i) => {
      url += `${stop.coordinates.latitude},${stop.coordinates.longitude}`;
      if (i < routeStops.length - 1) url += "/";
    });

    Linking.openURL(url);
  }, [routeStops, userLocation]);

  // Calculate total route distance
  const routeDistance = useMemo(() => {
    if (routeStops.length < 2) return 0;

    let total = 0;
    for (let i = 0; i < routeStops.length - 1; i++) {
      total += calculateDistance(
        routeStops[i].coordinates.latitude,
        routeStops[i].coordinates.longitude,
        routeStops[i + 1].coordinates.latitude,
        routeStops[i + 1].coordinates.longitude
      );
    }
    return total;
  }, [routeStops]);

  // Generate route polyline coordinates
  const routeCoordinates = useMemo(() => {
    if (routeStops.length < 2) return [];

    const coords: Array<{ latitude: number; longitude: number }> = [];

    // Optionally add user location as start
    if (userLocation && routeStops.length > 0) {
      coords.push({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      });
    }

    // Add all stops
    routeStops.forEach(stop => {
      coords.push(stop.coordinates);
    });

    return coords;
  }, [routeStops, userLocation]);

  // Handle cluster tap - zoom in to show items
  const handleClusterPress = useCallback((cluster: MapCluster) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: cluster.latitude,
        longitude: cluster.longitude,
        latitudeDelta: currentZoom / 3, // Zoom in
        longitudeDelta: currentZoom / 3,
      }, 500);
    }
    setSelectedCluster(cluster);
  }, [currentZoom]);

  // Compact Preview Cards (Google Maps style - appear above marker)
  const VendorPreviewCard = ({ vendor }: { vendor: Vendor }) => {
    const vendorOpen = isVendorOpen(vendor);
    const isInRoute = routeStops.some(s => s.id === `vendor-${vendor.id}`);

    return (
      <View style={styles.previewCard}>
        <Pressable
          style={styles.previewCardContent}
          onPress={() => setShowFullCard(true)}
        >
          <View style={{ flex: 1 }}>
            <View style={styles.previewTitleRow}>
              <Text style={styles.previewTitle} numberOfLines={1}>{vendor.name}</Text>
              {vendorOpen && (
                <View style={styles.openBadge}>
                  <Text style={styles.openBadgeText}>Open</Text>
                </View>
              )}
            </View>
            <View style={styles.previewMeta}>
              <View style={styles.previewStars}>
                <Ionicons name="star" size={12} color="#f59e0b" />
                <Text style={styles.previewRating}>{vendor.rating}</Text>
              </View>
              <Text style={styles.previewType}>{VENDOR_TYPE_LABELS[vendor.type]}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
        </Pressable>

        {/* Route mode: Add to route button */}
        {routeMode && (
          <Pressable
            style={[styles.addToRouteButton, isInRoute && styles.addToRouteButtonActive]}
            onPress={() => {
              if (isInRoute) {
                removeFromRoute(`vendor-${vendor.id}`);
              } else {
                addToRoute(vendor, "vendor");
              }
            }}
          >
            <Ionicons
              name={isInRoute ? "checkmark-circle" : "add-circle"}
              size={18}
              color={isInRoute ? "#10b981" : colors.primary[600]}
            />
            <Text style={[styles.addToRouteText, isInRoute && styles.addToRouteTextActive]}>
              {isInRoute ? "In Route" : "Add to Route"}
            </Text>
          </Pressable>
        )}
      </View>
    );
  };

  const ListingPreviewCard = ({ listing }: { listing: Listing }) => {
    const isInRoute = routeStops.some(s => s.id === `listing-${listing.id}`);

    return (
      <View style={styles.previewCard}>
        <Pressable
          style={styles.previewCardContent}
          onPress={() => setShowFullCard(true)}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.previewTitle} numberOfLines={1}>{listing.title}</Text>
            <View style={styles.previewMeta}>
              <Text style={styles.previewPrice}>${listing.price}</Text>
              <Text style={styles.previewType}>{listing.stoneType}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
        </Pressable>

        {/* Quick actions for listings */}
        <View style={styles.previewQuickActions}>
          {/* Near This Listing button */}
          <Pressable
            style={[styles.nearbyButton, showNearbyVendors && styles.nearbyButtonActive]}
            onPress={() => setShowNearbyVendors(!showNearbyVendors)}
          >
            <Ionicons
              name="location"
              size={16}
              color={showNearbyVendors ? "#ffffff" : colors.accent[500]}
            />
            <Text style={[styles.nearbyButtonText, showNearbyVendors && styles.nearbyButtonTextActive]}>
              {showNearbyVendors ? "Hide Nearby" : "Near This"}
            </Text>
          </Pressable>

          {/* Route mode: Add to route button */}
          {routeMode && (
            <Pressable
              style={[styles.addToRouteButton, isInRoute && styles.addToRouteButtonActive]}
              onPress={() => {
                if (isInRoute) {
                  removeFromRoute(`listing-${listing.id}`);
                } else {
                  addToRoute(listing, "listing");
                }
              }}
            >
              <Ionicons
                name={isInRoute ? "checkmark-circle" : "add-circle"}
                size={16}
                color={isInRoute ? "#10b981" : colors.primary[600]}
              />
              <Text style={[styles.addToRouteText, isInRoute && styles.addToRouteTextActive]}>
                {isInRoute ? "In Route" : "Add"}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  const JobPreviewCard = ({ job }: { job: Job }) => {
    const isInRoute = routeStops.some(s => s.id === `job-${job.id}`);

    return (
      <View style={styles.previewCard}>
        <Pressable
          style={styles.previewCardContent}
          onPress={() => setShowFullCard(true)}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.previewTitle} numberOfLines={1}>{job.title}</Text>
            <View style={styles.previewMeta}>
              <Text style={styles.previewPrice}>
                {job.budget ? `$${job.budget.min}-$${job.budget.max}` : "TBD"}
              </Text>
              <Text style={styles.previewType}>{job.bidCount} bids</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
        </Pressable>

        {/* Route mode: Add to route button */}
        {routeMode && (
          <Pressable
            style={[styles.addToRouteButton, isInRoute && styles.addToRouteButtonActive]}
            onPress={() => {
              if (isInRoute) {
                removeFromRoute(`job-${job.id}`);
              } else {
                addToRoute(job, "job");
              }
            }}
          >
            <Ionicons
              name={isInRoute ? "checkmark-circle" : "add-circle"}
              size={18}
              color={isInRoute ? "#10b981" : colors.primary[600]}
            />
            <Text style={[styles.addToRouteText, isInRoute && styles.addToRouteTextActive]}>
              {isInRoute ? "In Route" : "Add to Route"}
            </Text>
          </Pressable>
        )}
      </View>
    );
  };

  const VendorDetailCard = ({ vendor }: { vendor: Vendor }) => {
    const isFavorite = favoriteVendorIds.includes(vendor.id);

    return (
      <View style={styles.detailCard}>
        <Image
          source={{ uri: vendor.images[0] }}
          style={styles.detailCardImage}
          resizeMode="cover"
        />
        
        {/* Close button */}
        <Pressable
          style={styles.closeButton}
          onPress={() => {
            setSelectedVendor(null);
            setShowFullCard(false);
          }}
        >
          <Ionicons name="close" size={20} color={colors.neutral[600]} />
        </Pressable>
        
        <BlurView intensity={95} style={styles.detailCardContent} tint="light">
          <View style={styles.detailCardHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.vendorBadge}>
                <Ionicons
                  name={VENDOR_TYPE_ICONS[vendor.type]}
                  size={14}
                  color={VENDOR_TYPE_COLORS[vendor.type]}
                />
                <Text style={[styles.vendorBadgeText, { color: VENDOR_TYPE_COLORS[vendor.type] }]}>
                  {VENDOR_TYPE_LABELS[vendor.type]}
                </Text>
              </View>
              <Text style={styles.detailCardTitle} numberOfLines={1}>
                {vendor.name}
              </Text>
              {vendor.verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
            </View>
          </View>

          {/* Location Section */}
          <View style={styles.locationSection}>
            <Ionicons name="location" size={16} color={colors.text.tertiary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.locationAddress} numberOfLines={1}>{vendor.location.address}</Text>
              <Text style={styles.locationCity}>
                {vendor.location.city}, {vendor.location.state} {vendor.location.zipCode}
              </Text>
            </View>
          </View>

          <View style={styles.ratingRow}>
            <View style={styles.stars}>
              {[...Array(5)].map((_, i) => (
                <Ionicons
                  key={i}
                  name={i < Math.floor(vendor.rating) ? "star" : "star-outline"}
                  size={14}
                  color="#f59e0b"
                />
              ))}
            </View>
            <Text style={styles.ratingText}>
              {vendor.rating} ({vendor.reviewCount} reviews)
            </Text>
          </View>

          {/* Primary Actions */}
          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => handleCall(vendor.contact.phone)}
            >
              <Ionicons name="call" size={18} color="white" />
              <Text style={styles.actionButtonTextPrimary}>Call</Text>
            </Pressable>

            <Pressable
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => handleDirections(vendor.location.coordinates)}
            >
              <Ionicons name="navigate" size={18} color={colors.primary[600]} />
              <Text style={styles.actionButtonTextSecondary}>Directions</Text>
            </Pressable>
          </View>

          {/* Secondary Actions */}
          <View style={styles.secondaryActions}>
            <Pressable
              style={styles.secondaryActionButton}
              onPress={() => {
                // Navigate to vendor profile - would need to implement this screen
                setSelectedVendor(null);
                // navigation.navigate("VendorProfile", { vendorId: vendor.id });
              }}
            >
              <Ionicons name="person-outline" size={18} color={colors.text.secondary} />
              <Text style={styles.secondaryActionText}>View Profile</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryActionButton}
              onPress={() => toggleFavoriteVendor(vendor.id)}
            >
              <Ionicons 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={18} 
                color={isFavorite ? colors.accent[500] : colors.text.secondary} 
              />
              <Text style={[styles.secondaryActionText, isFavorite && { color: colors.accent[500] }]}>
                {isFavorite ? "Favorited" : "Favorite"}
              </Text>
            </Pressable>
          </View>
        </BlurView>
      </View>
    );
  };

  const ListingDetailCard = ({ listing }: { listing: Listing }) => {
    const isFavorite = favoriteIds.includes(listing.id);

    return (
      <View style={styles.detailCard}>
        <Image
          source={{ uri: listing.images[0] }}
          style={styles.detailCardImage}
          resizeMode="cover"
        />
        
        {/* Close button */}
        <Pressable
          style={styles.closeButton}
          onPress={() => {
            setSelectedListing(null);
            setShowFullCard(false);
          }}
        >
          <Ionicons name="close" size={20} color={colors.neutral[600]} />
        </Pressable>
        
        <BlurView intensity={95} style={styles.detailCardContent} tint="light">
          <View style={styles.detailCardHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.listingTypeBadge}>
                <Ionicons
                  name={listing.listingType === "Slab" ? "square" : "apps"}
                  size={12}
                  color={colors.accent[600]}
                />
                <Text style={styles.listingTypeBadgeText}>{listing.listingType}</Text>
              </View>
              <Text style={styles.detailCardTitle} numberOfLines={1}>
                {listing.title}
              </Text>
              <Text style={styles.listingPrice}>${listing.price}</Text>
            </View>
            
            <Pressable
              onPress={() => toggleFavorite(listing.id)}
              style={styles.favoriteButton}
            >
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={24}
                color={isFavorite ? colors.accent[500] : colors.neutral[400]}
              />
            </Pressable>
          </View>

          <View style={styles.listingMeta}>
            <View style={styles.listingMetaItem}>
              <Ionicons name="cube-outline" size={16} color={colors.text.tertiary} />
              <Text style={styles.listingMetaText}>{listing.stoneType}</Text>
            </View>
            <View style={styles.listingMetaItem}>
              <Ionicons name="location-outline" size={16} color={colors.text.tertiary} />
              <Text style={styles.listingMetaText}>{listing.location}</Text>
            </View>
          </View>

          {/* Primary Actions */}
          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.actionButton, styles.primaryButton, { flex: 1 }]}
              onPress={() => {
                setSelectedListing(null);
                navigation.navigate("ListingDetail", { listingId: listing.id });
              }}
            >
              <Text style={styles.actionButtonTextPrimary}>View Details</Text>
            </Pressable>

            <Pressable
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => {
                if (listing.coordinates) {
                  handleDirections(listing.coordinates);
                }
              }}
            >
              <Ionicons name="navigate" size={18} color={colors.primary[600]} />
            </Pressable>
          </View>

          {/* Secondary Actions */}
          <View style={styles.secondaryActions}>
            <Pressable
              style={styles.secondaryActionButton}
              onPress={() => {
                setSelectedListing(null);
                // Navigate to seller profile
                if (listing.sellerId) {
                  navigation.navigate("UserProfile", { userId: listing.sellerId });
                }
              }}
            >
              <Ionicons name="person-outline" size={18} color={colors.text.secondary} />
              <Text style={styles.secondaryActionText}>Seller Profile</Text>
            </Pressable>
          </View>
        </BlurView>
      </View>
    );
  };

  const JobDetailCard = ({ job }: { job: Job }) => {
    return (
      <View style={styles.detailCard}>
        <Image
          source={{ uri: job.images[0] }}
          style={styles.detailCardImage}
          resizeMode="cover"
        />
        
        {/* Close button */}
        <Pressable
          style={styles.closeButton}
          onPress={() => {
            setSelectedJob(null);
            setShowFullCard(false);
          }}
        >
          <Ionicons name="close" size={20} color={colors.neutral[600]} />
        </Pressable>
        
        <BlurView intensity={95} style={styles.detailCardContent} tint="light">
          <View style={styles.detailCardHeader}>
            <View style={{ flex: 1 }}>
              <View style={[styles.listingTypeBadge, { backgroundColor: "#ede9fe" }]}>
                <Ionicons name="briefcase" size={12} color="#8b5cf6" />
                <Text style={[styles.listingTypeBadgeText, { color: "#8b5cf6" }]}>Job Posting</Text>
              </View>
              <Text style={styles.detailCardTitle} numberOfLines={1}>
                {job.title}
              </Text>
              <Text style={[styles.listingPrice, { color: "#8b5cf6" }]}>
                {job.budget ? `$${job.budget.min} - $${job.budget.max}` : "Budget TBD"}
              </Text>
            </View>
          </View>

          <View style={styles.listingMeta}>
            <View style={styles.listingMetaItem}>
              <Ionicons name="person-outline" size={16} color={colors.text.tertiary} />
              <Text style={styles.listingMetaText}>{job.userName}</Text>
            </View>
            <View style={styles.listingMetaItem}>
              <Ionicons name="people-outline" size={16} color={colors.text.tertiary} />
              <Text style={styles.listingMetaText}>{job.bidCount} bids</Text>
            </View>
            <View style={styles.listingMetaItem}>
              <Ionicons name="location-outline" size={16} color={colors.text.tertiary} />
              <Text style={styles.listingMetaText}>{job.location}</Text>
            </View>
          </View>

          {/* Primary Actions */}
          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.actionButton, { flex: 1, backgroundColor: "#8b5cf6" }]}
              onPress={() => {
                setSelectedJob(null);
                navigation.navigate("JobDetail", { jobId: job.id });
              }}
            >
              <Text style={styles.actionButtonTextPrimary}>View Job</Text>
            </Pressable>

            <Pressable
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => {
                if (job.coordinates) {
                  handleDirections(job.coordinates);
                }
              }}
            >
              <Ionicons name="navigate" size={18} color={colors.primary[600]} />
            </Pressable>
          </View>

          {/* Secondary Actions */}
          <View style={styles.secondaryActions}>
            <Pressable
              style={styles.secondaryActionButton}
              onPress={() => {
                setSelectedJob(null);
                // Navigate to poster profile
                if (job.userId) {
                  navigation.navigate("UserProfile", { userId: job.userId });
                }
              }}
            >
              <Ionicons name="person-outline" size={18} color={colors.text.secondary} />
              <Text style={styles.secondaryActionText}>Poster Profile</Text>
            </Pressable>
          </View>
        </BlurView>
      </View>
    );
  };

  const totalResults = filteredVendors.length + filteredListings.length + filteredJobs.length;

  // Zoom to search results when search query changes
  React.useEffect(() => {
    if (searchQuery && totalResults > 0 && mapRef.current) {
      // Collect all coordinates from results
      const allCoords: Array<{ latitude: number; longitude: number }> = [];
      
      filteredVendors.forEach(v => allCoords.push(v.location.coordinates));
      filteredListings.forEach(l => l.coordinates && allCoords.push(l.coordinates));
      filteredJobs.forEach(j => j.coordinates && allCoords.push(j.coordinates));
      
      if (allCoords.length > 0) {
        // Calculate bounds
        const lats = allCoords.map(c => c.latitude);
        const lngs = allCoords.map(c => c.longitude);
        
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        
        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;
        const latDelta = (maxLat - minLat) * 1.5; // Add 50% padding
        const lngDelta = (maxLng - minLng) * 1.5;
        
        // Zoom to fit all results
        mapRef.current.animateToRegion({
          latitude: centerLat,
          longitude: centerLng,
          latitudeDelta: Math.max(latDelta, 0.05), // Minimum zoom level
          longitudeDelta: Math.max(lngDelta, 0.05),
        }, 1000);
      }
    }
  }, [searchQuery, totalResults]);

  // Debug logging
  React.useEffect(() => {
    console.log(`[MapScreen] Total vendors: ${vendors.length}, Geocoded: ${geocodedVendors.length}`);
    console.log(`[MapScreen] Total listings: ${listings.length}, Geocoded: ${geocodedListings.length}`);
    console.log(`[MapScreen] Filtered results: ${filteredVendors.length} vendors, ${filteredListings.length} listings, ${filteredJobs.length} jobs`);
    console.log(`[MapScreen] Show flags: vendors=${showVendors}, listings=${showListings}, jobs=${showJobs}`);
    if (searchQuery) {
      console.log(`[MapScreen] Search query: "${searchQuery}"`);
    }
  }, [filteredVendors.length, filteredListings.length, filteredJobs.length, searchQuery]);

  return (
    <View style={styles.container}>
      {isGeocoding && (
        <View style={styles.geocodingOverlay}>
          <ActivityIndicator size="large" color={colors.accent[500]} />
          <Text style={styles.geocodingText}>Loading accurate map locations...</Text>
        </View>
      )}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={mapRegion}
        showsUserLocation
        showsMyLocationButton={false}
        onRegionChangeComplete={handleRegionChange}
        followsUserLocation={false}
      >
        {/* Route Polyline */}
        {routeMode && routeCoordinates.length >= 2 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={colors.primary[600]}
            strokeWidth={4}
            lineDashPattern={[10, 5]}
          />
        )}

        {/* Route Stop Markers */}
        {routeMode && routeStops.map((stop, index) => (
          <Marker
            key={stop.id}
            coordinate={stop.coordinates}
          >
            <View style={styles.routeStopMarker}>
              <Text style={styles.routeStopNumber}>{index + 1}</Text>
            </View>
          </Marker>
        ))}

        {/* Vendor Markers */}
        {filteredVendors.map((vendor) => (
          <VendorMarker
            key={`vendor-${vendor.id}`}
            vendor={vendor}
            isSelected={selectedVendor?.id === vendor.id}
            onPress={() => handleVendorMarkerPress(vendor)}
          />
        ))}

        {/* Listing Markers */}
        {filteredListings.map((listing) => (
          <ListingMarker
            key={`listing-${listing.id}`}
            listing={listing}
            isSelected={selectedListing?.id === listing.id}
            onPress={() => handleListingMarkerPress(listing)}
          />
        ))}

        {/* Job Markers */}
        {filteredJobs.map((job) => (
          <JobMarker
            key={`job-${job.id}`}
            job={job}
            isSelected={selectedJob?.id === job.id}
            onPress={() => handleJobMarkerPress(job)}
          />
        ))}

        {/* My Project Markers */}
        {showMyProjects && myProjects.map((project) => (
          <ProjectMarker
            key={`project-${project.id}`}
            project={project}
            isSelected={selectedProject?.id === project.id}
            onPress={() => handleProjectMarkerPress(project)}
          />
        ))}
      </MapView>

      {/* Header with Search - Wrapped in SafeAreaView */}
      <SafeAreaView style={styles.headerSafeArea} edges={["top"]}>
        <View style={styles.header}>
          <BlurView intensity={95} style={styles.headerContent} tint="light">
            {/* Compact Search Bar */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={colors.text.tertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search map..."
                placeholderTextColor={colors.text.tertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                onSubmitEditing={() => {
                  // Log search results when user hits enter
                  console.log(`[MapScreen] Search: "${searchQuery}"`);
                  console.log(`[MapScreen] Found: ${filteredVendors.length} vendors, ${filteredListings.length} listings, ${filteredJobs.length} jobs`);
                }}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={18} color={colors.text.tertiary} />
                </Pressable>
              )}
            </View>

            {/* Collapsible Category Filters */}
            {showCategoryFilters && (
              <View style={styles.expandedFilters}>
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Show on Map</Text>
                  <View style={styles.categoryToggleGrid}>
                    <Pressable
                      style={[styles.categoryToggleCard, !showVendors && styles.categoryToggleCardInactive]}
                      onPress={() => setShowVendors(!showVendors)}
                    >
                      <Ionicons 
                        name="business" 
                        size={24} 
                        color={showVendors ? colors.primary[600] : colors.text.tertiary} 
                      />
                      <Text style={[styles.categoryToggleText, !showVendors && styles.categoryToggleTextInactive]}>
                        Vendors
                      </Text>
                      <Text style={[styles.categoryToggleCount, !showVendors && styles.categoryToggleCountInactive]}>
                        {filteredVendors.length}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[styles.categoryToggleCard, !showListings && styles.categoryToggleCardInactive]}
                      onPress={() => setShowListings(!showListings)}
                    >
                      <Ionicons 
                        name="layers" 
                        size={24} 
                        color={showListings ? colors.accent[500] : colors.text.tertiary} 
                      />
                      <Text style={[styles.categoryToggleText, !showListings && styles.categoryToggleTextInactive]}>
                        Listings
                      </Text>
                      <Text style={[styles.categoryToggleCount, !showListings && styles.categoryToggleCountInactive]}>
                        {filteredListings.length}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[styles.categoryToggleCard, !showJobs && styles.categoryToggleCardInactive]}
                      onPress={() => setShowJobs(!showJobs)}
                    >
                      <Ionicons 
                        name="briefcase" 
                        size={24} 
                        color={showJobs ? "#8b5cf6" : colors.text.tertiary} 
                      />
                      <Text style={[styles.categoryToggleText, !showJobs && styles.categoryToggleTextInactive]}>
                        Jobs
                      </Text>
                      <Text style={[styles.categoryToggleCount, !showJobs && styles.categoryToggleCountInactive]}>
                        {filteredJobs.length}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* Vendor Type Filters */}
                {showVendors && (
                  <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>Vendor Types</Text>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      style={styles.vendorTypeScroll}
                    >
                      {(Object.keys(VENDOR_TYPE_LABELS) as VendorType[]).map((type) => {
                        const isSelected = selectedTypes.includes(type);
                        const count = vendors.filter(v => v.type === type).length;
                        return (
                          <Pressable
                            key={type}
                            style={[styles.vendorTypeChip, isSelected && styles.vendorTypeChipActive]}
                            onPress={() => toggleTypeFilter(type)}
                          >
                            <Ionicons
                              name={VENDOR_TYPE_ICONS[type]}
                              size={16}
                              color={isSelected ? "white" : VENDOR_TYPE_COLORS[type]}
                            />
                            <Text style={[styles.vendorTypeChipText, isSelected && styles.vendorTypeChipTextActive]}>
                              {VENDOR_TYPE_LABELS[type]}
                            </Text>
                            <Text style={[styles.vendorTypeChipCount, isSelected && styles.vendorTypeChipCountActive]}>
                              {count}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                    {selectedTypes.length > 0 && (
                      <Pressable
                        style={styles.clearTypesButton}
                        onPress={() => setSelectedTypes([])}
                      >
                        <Text style={styles.clearTypesText}>Clear filters</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Quick Filter Chips */}
            <View style={styles.quickFilterRow}>
              {/* Open Now Toggle */}
              <Pressable
                style={[styles.quickFilterChip, showOpenOnly && styles.quickFilterChipActive]}
                onPress={() => setShowOpenOnly(!showOpenOnly)}
              >
                <Ionicons
                  name="time"
                  size={16}
                  color={showOpenOnly ? "#ffffff" : "#10b981"}
                />
                <Text style={[styles.quickFilterChipText, showOpenOnly && styles.quickFilterChipTextActive]}>
                  Open Now
                </Text>
                {showOpenOnly && (
                  <Text style={styles.quickFilterCount}>{openVendorCount}</Text>
                )}
              </Pressable>

              {/* Route Planner Toggle */}
              <Pressable
                style={[styles.quickFilterChip, routeMode && styles.quickFilterChipActiveRoute]}
                onPress={() => setRouteMode(!routeMode)}
              >
                <Ionicons
                  name="navigate"
                  size={16}
                  color={routeMode ? "#ffffff" : colors.primary[600]}
                />
                <Text style={[styles.quickFilterChipText, routeMode && styles.quickFilterChipTextActive]}>
                  Route
                </Text>
                {routeStops.length > 0 && (
                  <View style={[styles.routeStopsBadge, routeMode && styles.routeStopsBadgeActive]}>
                    <Text style={[styles.routeStopsBadgeText, routeMode && styles.routeStopsBadgeTextActive]}>
                      {routeStops.length}
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>

            {/* Compact Filter Row */}
            <View style={styles.compactFilterRow}>
              <Pressable
                style={styles.categoriesToggle}
                onPress={() => setShowCategoryFilters(!showCategoryFilters)}
              >
                <Ionicons name="options" size={18} color={colors.text.secondary} />
                <Text style={styles.categoriesToggleText}>Filters</Text>
                <Ionicons
                  name={showCategoryFilters ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={colors.text.tertiary}
                />
                {(selectedTypes.length > 0 || !showVendors || !showListings || !showJobs || showOpenOnly) && (
                  <View style={styles.activeFilterBadge}>
                    <Text style={styles.activeFilterBadgeText}>●</Text>
                  </View>
                )}
              </Pressable>

              <View style={styles.resultsBadge}>
                <Text style={styles.resultsBadgeText}>
                  {totalResults} {totalResults === 1 ? "result" : "results"}
                </Text>
              </View>
            </View>
          </BlurView>
        </View>
      </SafeAreaView>

      {/* My Location Button */}
      <Pressable style={styles.myLocationButton} onPress={getUserLocation}>
        <BlurView intensity={95} style={styles.myLocationButtonContent} tint="light">
          <Ionicons name="locate" size={24} color={colors.primary[600]} />
        </BlurView>
      </Pressable>

      {/* Route Planner Panel */}
      {routeMode && (
        <View style={styles.routePlannerPanel}>
          <BlurView intensity={95} style={styles.routePlannerContent} tint="light">
            <View style={styles.routePlannerHeader}>
              <View>
                <Text style={styles.routePlannerTitle}>Route Planner</Text>
                <Text style={styles.routePlannerSubtitle}>
                  {routeStops.length === 0
                    ? "Tap markers to add stops"
                    : `${routeStops.length} stop${routeStops.length > 1 ? "s" : ""} • ${routeDistance.toFixed(1)} mi`}
                </Text>
              </View>
              <Pressable onPress={clearRoute}>
                <Ionicons name="close-circle" size={28} color={colors.text.tertiary} />
              </Pressable>
            </View>

            {routeStops.length > 0 && (
              <ScrollView style={styles.routeStopsList} showsVerticalScrollIndicator={false}>
                {routeStops.map((stop, index) => (
                  <View key={stop.id} style={styles.routeStopItem}>
                    <View style={styles.routeStopNumber}>
                      <Text style={styles.routeStopNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.routeStopName} numberOfLines={1}>
                      {stop.name}
                    </Text>
                    <Pressable onPress={() => removeFromRoute(stop.id)}>
                      <Ionicons name="remove-circle" size={22} color={colors.error.main} />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            )}

            {routeStops.length >= 1 && (
              <Pressable style={styles.routeStartButton} onPress={openRouteInMaps}>
                <Ionicons name="navigate" size={20} color="#ffffff" />
                <Text style={styles.routeStartButtonText}>Open in Maps</Text>
              </Pressable>
            )}
          </BlurView>
        </View>
      )}

      {/* Near This Listing indicator */}
      {showNearbyVendors && selectedListing && (
        <View style={styles.nearbyIndicator}>
          <BlurView intensity={95} style={styles.nearbyIndicatorContent} tint="light">
            <Ionicons name="location" size={18} color={colors.accent[500]} />
            <Text style={styles.nearbyIndicatorText}>
              Showing vendors within {nearbyRadius} mi of listing
            </Text>
            <Pressable onPress={() => setShowNearbyVendors(false)}>
              <Ionicons name="close" size={18} color={colors.text.tertiary} />
            </Pressable>
          </BlurView>
        </View>
      )}

      {/* Results Carousel - Show when there are search results or selections */}
      {/* Preview Cards - Small cards (Google Maps style) */}
      {!showFullCard && selectedVendor && (
        <VendorPreviewCard vendor={selectedVendor} />
      )}
      {!showFullCard && selectedListing && (
        <ListingPreviewCard listing={selectedListing} />
      )}
      {!showFullCard && selectedJob && (
        <JobPreviewCard job={selectedJob} />
      )}

      {/* Full Detail Cards - Show when preview is tapped */}
      {showFullCard && selectedVendor && (
        <View style={styles.detailCardContainer}>
          <VendorDetailCard vendor={selectedVendor} />
        </View>
      )}
      {showFullCard && selectedListing && (
        <View style={styles.detailCardContainer}>
          <ListingDetailCard listing={selectedListing} />
        </View>
      )}
      {showFullCard && selectedJob && (
        <View style={styles.detailCardContainer}>
          <JobDetailCard job={selectedJob} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  geocodingOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -100 }, { translateY: -50 }],
    backgroundColor: "white",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    width: 200,
  },
  geocodingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.primary,
    textAlign: "center",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  headerSafeArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerContent: {
    borderRadius: 16,
    overflow: "hidden",
    padding: 14,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.main,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
    padding: 0,
  },
  markerContainer: {
    alignItems: "center",
  },
  vendorMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  listingMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  verifiedMarkerBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 2,
  },
  remnantBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: colors.accent[500],
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  remnantBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "white",
  },
  projectMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  myProjectBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#6366f1",
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
    color: "white",
  },
  jobMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  jobBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#8b5cf6",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
    paddingHorizontal: 4,
  },
  jobBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "white",
  },
  myLocationButton: {
    position: "absolute",
    bottom: 140,
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  myLocationButtonContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  detailCard: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  detailCardContainer: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
  },
  carouselCard: {
    width: SCREEN_WIDTH - 80,
    marginRight: 12,
  },
  detailCardImage: {
    width: "100%",
    height: 160,
  },
  detailCardContent: {
    padding: 20,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  detailCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  vendorBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.background.secondary,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  vendorBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  listingTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.accent[100],
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  listingTypeBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.accent[600],
  },
  detailCardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 4,
  },
  listingPrice: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.accent[500],
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  verifiedText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#10b981",
  },
  favoriteButton: {
    padding: 8,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  stars: {
    flexDirection: "row",
    gap: 2,
  },
  ratingText: {
    fontSize: 13,
    color: colors.text.tertiary,
    fontWeight: "500",
  },
  listingMeta: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
  },
  listingMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  listingMetaText: {
    fontSize: 13,
    color: colors.text.tertiary,
    fontWeight: "500",
  },
  detailDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  dimensions: {
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  dimensionsText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.primary,
  },
  specialties: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 16,
  },
  specialtyChip: {
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  specialtyText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.text.secondary,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary[600],
  },
  secondaryButton: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.main,
  },
  actionButtonTextPrimary: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
  actionButtonTextSecondary: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary[600],
  },
  secondaryActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    backgroundColor: colors.background.secondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border.main,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  cardBottomActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.main,
  },
  cardFavoriteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    backgroundColor: colors.background.secondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border.main,
  },
  cardCloseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.background.secondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border.main,
  },
  cardActionText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  locationSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.background.tertiary,
    borderRadius: 10,
    marginBottom: 12,
  },
  locationAddress: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.primary,
    lineHeight: 18,
  },
  locationCity: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  emojiIcon: {
    fontSize: 18,
  },
  expandedFilters: {
    marginTop: 12,
    gap: 16,
  },
  filterSection: {
    gap: 10,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  categoryToggleGrid: {
    flexDirection: "row",
    gap: 10,
  },
  categoryToggleCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.background.secondary,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.main,
  },
  categoryToggleCardInactive: {
    opacity: 0.5,
    borderColor: colors.border.light,
  },
  categoryToggleText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text.primary,
  },
  categoryToggleTextInactive: {
    color: colors.text.tertiary,
  },
  categoryToggleCount: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text.primary,
  },
  categoryToggleCountInactive: {
    color: colors.text.tertiary,
  },
  vendorTypeScroll: {
    marginTop: 4,
  },
  vendorTypeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border.main,
  },
  vendorTypeChipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  vendorTypeChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.primary,
  },
  vendorTypeChipTextActive: {
    color: "white",
  },
  vendorTypeChipCount: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text.tertiary,
  },
  vendorTypeChipCountActive: {
    color: "white",
    opacity: 0.8,
  },
  clearTypesButton: {
    marginTop: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  clearTypesText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.accent[500],
  },
  compactFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  categoriesToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border.main,
  },
  categoriesToggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  activeFilterBadge: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 2,
  },
  activeFilterBadgeText: {
    fontSize: 10,
    color: colors.accent[500],
  },
  resultsBadge: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border.main,
  },
  resultsBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  resultsCarouselContainer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    height: 280,
  },
  resultsCarouselContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  // Preview Card Styles (Google Maps style)
  previewCard: {
    position: "absolute",
    bottom: 60,
    left: SCREEN_WIDTH / 2 - 140,
    width: 280,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  previewCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 4,
  },
  previewMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  previewStars: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  previewRating: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.primary,
  },
  previewPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.accent[500],
  },
  previewType: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.text.tertiary,
  },

  // New styles for map enhancements

  // Quick filter row
  quickFilterRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    marginBottom: 4,
  },
  quickFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border.main,
  },
  quickFilterChipActive: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  quickFilterChipActiveRoute: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  quickFilterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  quickFilterChipTextActive: {
    color: "#ffffff",
  },
  quickFilterCount: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
    marginLeft: 2,
  },

  // Route badges
  routeStopsBadge: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  routeStopsBadgeActive: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  routeStopsBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary[600],
  },
  routeStopsBadgeTextActive: {
    color: "#ffffff",
  },

  // Route planner panel
  routePlannerPanel: {
    position: "absolute",
    bottom: 100,
    left: 16,
    right: 16,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  routePlannerContent: {
    padding: 16,
  },
  routePlannerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  routePlannerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text.primary,
  },
  routePlannerSubtitle: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  routeStopsList: {
    maxHeight: 150,
    marginBottom: 12,
  },
  routeStopItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.main,
  },
  routeStopMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary[600],
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  routeStopNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary[600],
    alignItems: "center",
    justifyContent: "center",
  },
  routeStopNumberText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  routeStopName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: colors.text.primary,
  },
  routeStartButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary[600],
    paddingVertical: 14,
    borderRadius: 12,
  },
  routeStartButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },

  // Open badge
  previewTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  openBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  openBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#10b981",
    textTransform: "uppercase",
  },

  // Add to route button
  addToRouteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    marginTop: 10,
    backgroundColor: colors.primary[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  addToRouteButtonActive: {
    backgroundColor: "#dcfce7",
    borderColor: "#10b981",
  },
  addToRouteText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary[600],
  },
  addToRouteTextActive: {
    color: "#10b981",
  },

  // Preview quick actions
  previewQuickActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },

  // Near This button
  nearbyButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    backgroundColor: colors.accent[100],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent[200],
  },
  nearbyButtonActive: {
    backgroundColor: colors.accent[500],
    borderColor: colors.accent[500],
  },
  nearbyButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.accent[600],
  },
  nearbyButtonTextActive: {
    color: "#ffffff",
  },

  // Nearby indicator
  nearbyIndicator: {
    position: "absolute",
    top: 180,
    left: 16,
    right: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  nearbyIndicatorContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  nearbyIndicatorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: colors.text.secondary,
  },
});
