import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  RefreshControl,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CompositeNavigationProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { RootStackParamList, TabParamList } from "../nav";
import { useListingsStore } from "../state/listingsStore";
import { useGamificationStore } from "../state/gamificationStore";
import { useLanguageStore } from "../state/languageStore";
import { useVendorStore } from "../state/vendorStore";
import { useAdsStore } from "../state/adsStore";
import { useNativeAdsStore } from "../state/nativeAdsStore";
import { useJobsStore } from "../state/jobsStore";
import { MaterialCategory } from "../types/marketplace";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../utils/colors";
import { VendorAdTooltip } from "../components/VendorAdTooltip";
import { NativeAdCard } from "../components/NativeAdCard";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_PADDING = 16;
const CARD_WIDTH = SCREEN_WIDTH - (CARD_PADDING * 2);
const GRID_CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

type ViewMode = "large" | "grid" | "compact";
type SortMode = "recent" | "price-low" | "price-high" | "popular";

type NavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<RootStackParamList, "MainTabs">,
  BottomTabNavigationProp<TabParamList>
>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { listings, loadMockData, archiveExpiredListings, toggleFavorite, favoriteIds } =
    useListingsStore();
  const { updateStreak, streak } = useGamificationStore();
  const { translations: t } = useLanguageStore();
  const { vendors } = useVendorStore();
  const { shouldShowAd, dismissAd, updateLastShownAdTimestamp } = useAdsStore();
  const { getAdsByPlacement, trackImpression, trackClick, loadMockAds } = useNativeAdsStore();
  const { jobs, loadMockJobs } = useJobsStore();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | MaterialCategory>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  
  // Select a featured vendor for ads
  const featuredVendor = vendors.find(v => v.verified && v.rating >= 4.5) || vendors[0];

  // Get active ads for home placement
  const homeAds = getAdsByPlacement("home");

  useEffect(() => {
    updateStreak();
    
    const hasLoadedData = listings.length > 0;
    if (!hasLoadedData) {
      loadMockData();
    }
    archiveExpiredListings();
    
    // Load jobs
    if (jobs.length === 0) {
      loadMockJobs();
    }
    
    // Load mock ads
    loadMockAds();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    archiveExpiredListings();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const filteredListings = listings
    .filter((listing) => {
      if (listing.status !== "active") return false;
      
      const matchesSearch =
        listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = selectedType === "all" || 
        // @ts-ignore - backward compatibility with old listings
        listing.category === selectedType ||
        // @ts-ignore - legacy stone types map to "Stone" category
        (selectedType === "Stone" && listing.stoneType);
      
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (sortMode) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "popular":
          return (favoriteIds.includes(b.id) ? 1 : 0) - (favoriteIds.includes(a.id) ? 1 : 0);
        case "recent":
        default:
          return 0; // Keep original order for recent
      }
    });

  const materialCategories: Array<"all" | MaterialCategory> = [
    "all",
    "Stone",
    "Cabinets",
    "Wood",
    "Tile",
    "Lighting",
    "Plumbing",
    "Flooring",
  ];

  // Merge listings, ads, and jobs into feed - insert jobs every 6-8 items
  const mergeFeedItems = () => {
    const merged: Array<{ type: "listing" | "ad" | "job"; data: any; id: string }> = [];
    let adIndex = 0;
    let jobIndex = 0;
    const activeJobs = jobs.filter(j => j.status === "open");

    filteredListings.forEach((listing, index) => {
      merged.push({ type: "listing", data: listing, id: listing.id });

      // Insert ad after every 4 listings
      if ((index + 1) % 4 === 0 && adIndex < homeAds.length) {
        merged.push({
          type: "ad",
          data: homeAds[adIndex],
          id: `ad-${homeAds[adIndex].id}`,
        });
        adIndex++;
      }

      // Insert job after every 6-8 listings
      if ((index + 1) % 7 === 0 && jobIndex < activeJobs.length) {
        merged.push({
          type: "job",
          data: activeJobs[jobIndex],
          id: `job-${activeJobs[jobIndex].id}`,
        });
        jobIndex++;
      }
    });

    return merged;
  };

  const itemsToRender = mergeFeedItems();

  // Get translated category name
  const getCategoryName = (type: "all" | MaterialCategory): string => {
    if (type === "all") return t.home.all;
    // For now, return the type as-is until we add translations
    return type;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Compact Header with Search Bar */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={22} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search cutStone"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </Pressable>
          )}
        </View>
        
        <Pressable 
          style={styles.locationButton}
          onPress={() => navigation.navigate("Map")}
        >
          <Ionicons name="location" size={18} color="#0f172a" />
          <Text style={styles.locationText}>Map</Text>
        </Pressable>
      </View>

      {/* Collapsible Categories */}
      {showCategories && (
        <View style={styles.categoryContainer}>
          <View style={styles.categoryRow}>
            <Pressable 
              style={styles.categoryCard}
              onPress={() => { setSelectedType("all"); setShowCategories(false); }}
            >
              <View style={[styles.categoryIcon, { backgroundColor: '#f97316' }]}>
                <Ionicons name="pricetag" size={32} color="white" />
              </View>
              <Text style={styles.categoryText}>For sale</Text>
            </Pressable>

            <Pressable 
              style={styles.categoryCard}
              onPress={() => { navigation.navigate("Map"); setShowCategories(false); }}
            >
              <View style={[styles.categoryIcon, { backgroundColor: '#2563eb' }]}>
                <Ionicons name="map" size={32} color="white" />
              </View>
              <Text style={styles.categoryText}>Vendors</Text>
            </Pressable>

            <Pressable 
              style={styles.categoryCard}
              onPress={() => { navigation.navigate("SmartMeasurement" as never); setShowCategories(false); }}
            >
              <View style={[styles.categoryIcon, { backgroundColor: '#10b981' }]}>
                <Ionicons name="resize" size={32} color="white" />
              </View>
              <Text style={styles.categoryText}>Measure</Text>
            </Pressable>

            <Pressable 
              style={styles.categoryCard}
              onPress={() => { navigation.navigate("JobBoard" as never); setShowCategories(false); }}
            >
              <View style={[styles.categoryIcon, { backgroundColor: '#8b5cf6' }]}>
                <Ionicons name="briefcase" size={32} color="white" />
              </View>
              <Text style={styles.categoryText}>Jobs</Text>
            </Pressable>
          </View>

          <View style={styles.categoryRow}>
            <Pressable 
              style={styles.categoryCard}
              onPress={() => { setSelectedType("Stone"); setShowCategories(false); }}
            >
              <View style={[styles.categoryIcon, { backgroundColor: '#ec4899' }]}>
                <Ionicons name="cube" size={32} color="white" />
              </View>
              <Text style={styles.categoryText}>Stone</Text>
            </Pressable>

            <Pressable 
              style={styles.categoryCard}
              onPress={() => { setSelectedType("Cabinets"); setShowCategories(false); }}
            >
              <View style={[styles.categoryIcon, { backgroundColor: '#6366f1' }]}>
                <Ionicons name="apps-outline" size={32} color="white" />
              </View>
              <Text style={styles.categoryText}>Cabinets</Text>
            </Pressable>

            <Pressable 
              style={styles.categoryCard}
              onPress={() => { navigation.navigate("Chat" as never); setShowCategories(false); }}
            >
              <View style={[styles.categoryIcon, { backgroundColor: '#f59e0b' }]}>
                <Ionicons name="chatbubbles" size={32} color="white" />
              </View>
              <Text style={styles.categoryText}>AI Chat</Text>
            </Pressable>
            
            <Pressable 
              style={styles.categoryCard}
              onPress={() => { setSelectedType("Tile"); setShowCategories(false); }}
            >
              <View style={[styles.categoryIcon, { backgroundColor: '#14b8a6' }]}>
                <Ionicons name="grid" size={32} color="white" />
              </View>
              <Text style={styles.categoryText}>Tile</Text>
            </Pressable>
          </View>

          <View style={styles.categoryRow}>
            <Pressable 
              style={styles.categoryCard}
              onPress={() => { setSelectedType("Wood"); setShowCategories(false); }}
            >
              <View style={[styles.categoryIcon, { backgroundColor: '#92400e' }]}>
                <Ionicons name="leaf" size={32} color="white" />
              </View>
              <Text style={styles.categoryText}>Wood</Text>
            </Pressable>

            <Pressable 
              style={styles.categoryCard}
              onPress={() => { setSelectedType("Lighting"); setShowCategories(false); }}
            >
              <View style={[styles.categoryIcon, { backgroundColor: '#fbbf24' }]}>
                <Ionicons name="bulb" size={32} color="white" />
              </View>
              <Text style={styles.categoryText}>Lighting</Text>
            </Pressable>

            <Pressable 
              style={styles.categoryCard}
              onPress={() => { setSelectedType("Flooring"); setShowCategories(false); }}
            >
              <View style={[styles.categoryIcon, { backgroundColor: '#a855f7' }]}>
                <Ionicons name="layers" size={32} color="white" />
              </View>
              <Text style={styles.categoryText}>Flooring</Text>
            </Pressable>
            
            <Pressable 
              style={styles.categoryCard}
              onPress={() => { setSelectedType("Plumbing"); setShowCategories(false); }}
            >
              <View style={[styles.categoryIcon, { backgroundColor: '#06b6d4' }]}>
                <Ionicons name="water" size={32} color="white" />
              </View>
              <Text style={styles.categoryText}>Plumbing</Text>
            </Pressable>
          </View>
          
          <Pressable 
            style={styles.collapseButton}
            onPress={() => setShowCategories(false)}
          >
            <Ionicons name="chevron-up" size={24} color="#6b7280" />
          </Pressable>
        </View>
      )}

      {/* Compact Filter Pills */}
      <View style={styles.filterContainer}>
        <Pressable 
          style={styles.categoriesToggle}
          onPress={() => setShowCategories(!showCategories)}
        >
          <Ionicons name="apps" size={20} color="#6b7280" />
          <Text style={styles.categoriesToggleText}>Categories</Text>
          <Ionicons name={showCategories ? "chevron-up" : "chevron-down"} size={18} color="#6b7280" />
        </Pressable>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={{ paddingLeft: 12 }}
        >
          {materialCategories.map((type) => (
            <Pressable
              key={type}
              style={[
                styles.filterChip,
                selectedType === type && styles.filterChipActive
              ]}
              onPress={() => setSelectedType(type)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedType === type && styles.filterTextActive
                ]}
              >
                {getCategoryName(type)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Listings Header with View Mode Toggle */}
      <View style={styles.listingsHeader}>
        <Text style={styles.listingsTitle}>For sale</Text>
        <View style={styles.headerControls}>
          <View style={styles.viewModeToggle}>
            <Pressable 
              style={[styles.viewModeButton, viewMode === "large" && styles.viewModeButtonActive]}
              onPress={() => setViewMode("large")}
            >
              <Ionicons name="square" size={18} color={viewMode === "large" ? "#10b981" : "#9ca3af"} />
            </Pressable>
            <Pressable 
              style={[styles.viewModeButton, viewMode === "grid" && styles.viewModeButtonActive]}
              onPress={() => setViewMode("grid")}
            >
              <Ionicons name="grid" size={18} color={viewMode === "grid" ? "#10b981" : "#9ca3af"} />
            </Pressable>
            <Pressable 
              style={[styles.viewModeButton, viewMode === "compact" && styles.viewModeButtonActive]}
              onPress={() => setViewMode("compact")}
            >
              <Ionicons name="list" size={18} color={viewMode === "compact" ? "#10b981" : "#9ca3af"} />
            </Pressable>
          </View>
          <Pressable 
            style={styles.filterButton}
            onPress={() => setShowSortMenu(!showSortMenu)}
          >
            <Ionicons name="options" size={24} color={colors.text.primary} />
          </Pressable>
        </View>
      </View>

      {/* Sort Menu */}
      {showSortMenu && (
        <View style={styles.sortMenu}>
          {(["recent", "price-low", "price-high", "popular"] as SortMode[]).map((mode) => (
            <Pressable
              key={mode}
              style={[styles.sortOption, sortMode === mode && styles.sortOptionActive]}
              onPress={() => {
                setSortMode(mode);
                setShowSortMenu(false);
              }}
            >
              <Text style={[styles.sortOptionText, sortMode === mode && styles.sortOptionTextActive]}>
                {mode === "recent" && "Most Recent"}
                {mode === "price-low" && "Price: Low to High"}
                {mode === "price-high" && "Price: High to Low"}
                {mode === "popular" && "Most Popular"}
              </Text>
              {sortMode === mode && (
                <Ionicons name="checkmark" size={20} color={colors.accent[500]} />
              )}
            </Pressable>
          ))}
        </View>
      )}

      {/* Content - Adaptive Views */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredListings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color={colors.neutral[300]} />
            <Text style={styles.emptyTitle}>{t.home.noListings}</Text>
            <Text style={styles.emptyText}>Try adjusting your filters</Text>
          </View>
        ) : viewMode === "grid" ? (
          <View style={styles.gridContainer}>
            {itemsToRender.map((item) => {
              if (item.type === "ad") {
                return (
                  <NativeAdCard
                    key={item.id}
                    ad={item.data}
                    viewMode="grid"
                    onImpression={() => trackImpression(item.data.id)}
                    onPress={() => trackClick(item.data.id)}
                  />
                );
              }

              const listing = item.data;
              const isFavorite = favoriteIds.includes(listing.id);
              return (
                <Pressable
                  key={listing.id}
                  style={styles.gridCard}
                  onPress={() => navigation.navigate("ListingDetail", { listingId: listing.id })}
                >
                  <Image
                    source={{ uri: listing.images[0] }}
                    style={styles.gridImage}
                    resizeMode="cover"
                  />
                  <Pressable
                    style={styles.favoriteButton}
                    onPress={() => toggleFavorite(listing.id)}
                  >
                    <Ionicons
                      name={isFavorite ? "heart" : "heart-outline"}
                      size={24}
                      color={isFavorite ? "#ef4444" : "#ffffff"}
                    />
                  </Pressable>
                  <View style={styles.gridInfo}>
                    <Text style={styles.gridPrice}>${listing.price}</Text>
                    <Text style={styles.gridTitle} numberOfLines={2}>
                      {listing.title}
                    </Text>
                    {listing.dimensions && (
                      <View style={styles.dimensionsRow}>
                        <Ionicons name="resize-outline" size={14} color="#10b981" />
                        <Text style={styles.dimensionsText}>
                          {listing.dimensions.length}" × {listing.dimensions.width}"
                        </Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : viewMode === "large" ? (
          <View style={styles.listContainer}>
            {itemsToRender.map((item) => {
              if (item.type === "ad") {
                return (
                  <NativeAdCard
                    key={item.id}
                    ad={item.data}
                    viewMode="large"
                    onImpression={() => trackImpression(item.data.id)}
                    onPress={() => trackClick(item.data.id)}
                  />
                );
              }

              const listing = item.data;
              const isFavorite = favoriteIds.includes(listing.id);
              return (
                <Pressable
                  key={listing.id}
                  style={styles.largeCard}
                  onPress={() => navigation.navigate("ListingDetail", { listingId: listing.id })}
                >
                  <Image
                    source={{ uri: listing.images[0] }}
                    style={styles.largeImage}
                    resizeMode="cover"
                  />
                  <Pressable
                    style={styles.favoriteButtonLarge}
                    onPress={() => toggleFavorite(listing.id)}
                  >
                    <Ionicons
                      name={isFavorite ? "heart" : "heart-outline"}
                      size={28}
                      color={isFavorite ? "#ef4444" : "#ffffff"}
                    />
                  </Pressable>
                  <View style={styles.largeInfo}>
                    <View style={styles.largeHeader}>
                      <Text style={styles.largePrice}>${listing.price}</Text>
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>{listing.stoneType}</Text>
                      </View>
                    </View>
                    <Text style={styles.largeTitle} numberOfLines={2}>
                      {listing.title}
                    </Text>
                    <Text style={styles.largeDescription} numberOfLines={2}>
                      {listing.description}
                    </Text>
                    <View style={styles.largeMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons name="resize" size={16} color="#6b7280" />
                        <Text style={styles.metaText}>
                          {listing.dimensions?.length || 0}" × {listing.dimensions?.width || 0}"
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="location" size={16} color="#6b7280" />
                        <Text style={styles.metaText}>{listing.location.split(",")[0]}</Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.compactContainer}>
            {itemsToRender.map((item) => {
              if (item.type === "ad") {
                return (
                  <NativeAdCard
                    key={item.id}
                    ad={item.data}
                    viewMode="compact"
                    onImpression={() => trackImpression(item.data.id)}
                    onPress={() => trackClick(item.data.id)}
                  />
                );
              }

              const listing = item.data;
              const isFavorite = favoriteIds.includes(listing.id);
              return (
                <Pressable
                  key={listing.id}
                  style={styles.compactCard}
                  onPress={() => navigation.navigate("ListingDetail", { listingId: listing.id })}
                >
                  <Image
                    source={{ uri: listing.images[0] }}
                    style={styles.compactImage}
                    resizeMode="cover"
                  />
                  <View style={styles.compactInfo}>
                    <View style={styles.compactHeader}>
                      <Text style={styles.compactPrice}>${listing.price}</Text>
                      <Text style={styles.compactType}>{listing.stoneType}</Text>
                    </View>
                    <Text style={styles.compactTitle} numberOfLines={1}>
                      {listing.title}
                    </Text>
                    <Text style={styles.compactDescription} numberOfLines={1}>
                      {listing.description}
                    </Text>
                    {listing.dimensions && (
                      <View style={styles.dimensionsRow}>
                        <Ionicons name="resize-outline" size={12} color="#10b981" />
                        <Text style={styles.dimensionsText}>
                          {listing.dimensions.length}" × {listing.dimensions.width}"
                        </Text>
                      </View>
                    )}
                  </View>
                  <Pressable
                    style={styles.compactFavorite}
                    onPress={() => toggleFavorite(listing.id)}
                  >
                    <Ionicons
                      name={isFavorite ? "heart" : "heart-outline"}
                      size={22}
                      color={isFavorite ? "#ef4444" : "#9ca3af"}
                    />
                  </Pressable>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
      
      {/* Vendor Ad Tooltip */}
      {featuredVendor && shouldShowAd("home-vendor-ad", 60) && (
        <VendorAdTooltip
          vendor={featuredVendor}
          position="bottom"
          context="Looking for quality countertops in Arizona?"
          onDismiss={() => {
            dismissAd("home-vendor-ad");
            updateLastShownAdTimestamp();
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: 'white',
    borderRadius: 32,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: colors.text.primary,
    fontWeight: "500",
  },
  locationButton: {
    backgroundColor: '#eab308',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    shadowColor: '#eab308',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonDisabled: {
    opacity: 0.5,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: 0.3,
  },
  categoryContainer: {
    backgroundColor: 'white',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  categoryCard: {
    alignItems: 'center',
    width: (SCREEN_WIDTH - 80) / 4,
  },
  categoryIcon: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  collapseButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  filterContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoriesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    marginLeft: 16,
    borderRadius: 20,
    gap: 6,
  },
  categoriesToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterScroll: {
    flex: 1,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  listingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  listingsTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 4,
    gap: 2,
  },
  viewModeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewModeButtonActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  sortMenu: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  sortOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  sortOptionActive: {
    backgroundColor: '#f0fdf4',
  },
  sortOptionText: {
    fontSize: 15,
    color: colors.text.secondary,
    fontWeight: "500",
  },
  sortOptionTextActive: {
    color: '#10b981',
    fontWeight: "700",
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text.primary,
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.tertiary,
    fontWeight: "500",
  },
  // Grid View (2 columns)
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
  },
  gridCard: {
    width: GRID_CARD_WIDTH,
    marginBottom: 16,
    marginHorizontal: 6,
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  gridImage: {
    width: '100%',
    height: GRID_CARD_WIDTH,
    backgroundColor: '#f3f4f6',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridInfo: {
    padding: 14,
  },
  gridPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  gridTitle: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '600',
    lineHeight: 20,
  },
  dimensionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  dimensionsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10b981',
    letterSpacing: 0.2,
  },
  // Large Card View
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  largeCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  largeImage: {
    width: '100%',
    height: 280,
    backgroundColor: '#f3f4f6',
  },
  favoriteButtonLarge: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeInfo: {
    padding: 20,
  },
  largeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  largePrice: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -1,
  },
  typeBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.3,
  },
  largeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 28,
  },
  largeDescription: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
    lineHeight: 22,
    marginBottom: 16,
  },
  largeMeta: {
    flexDirection: 'row',
    gap: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  // Compact List View
  compactContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  compactCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  compactImage: {
    width: 100,
    height: 100,
    backgroundColor: '#f3f4f6',
  },
  compactInfo: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  compactPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  compactType: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
    letterSpacing: 0.3,
  },
  compactTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  compactDescription: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  },
  compactFavorite: {
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
});
