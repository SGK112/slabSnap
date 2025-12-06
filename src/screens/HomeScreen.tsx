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
  Modal,
  Alert,
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
import { useAuthStore, ProjectType } from "../state/authStore";
import { MaterialCategory, CATEGORY_CONFIG, getCategoryIcon } from "../types/marketplace";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../utils/colors";
import { VendorAdTooltip } from "../components/VendorAdTooltip";
import { NativeAdCard } from "../components/NativeAdCard";
import * as Haptics from "expo-haptics";

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

// Helper function for time-based greeting
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

// Map project types to relevant material categories for personalization
const PROJECT_TYPE_TO_CATEGORIES: Record<ProjectType, MaterialCategory[]> = {
  kitchen: ["Kitchen", "Stone & Tile", "Lighting & Electrical"],
  bathroom: ["Bath", "Stone & Tile", "Plumbing"],
  outdoor: ["Outdoor", "Stone & Tile"],
  flooring: ["Flooring", "Stone & Tile", "Lumber & Millwork"],
  countertops: ["Stone & Tile", "Kitchen", "Bath"],
  plumbing: ["Plumbing", "Bath", "Kitchen"],
  electrical: ["Lighting & Electrical"],
  landscaping: ["Outdoor"],
  general: ["Kitchen", "Bath", "Stone & Tile"],
};

// Style-based recommendations
const STYLE_TO_KEYWORDS: Record<string, string[]> = {
  modern: ["modern", "sleek", "minimalist", "contemporary", "clean"],
  traditional: ["traditional", "classic", "timeless", "elegant", "ornate"],
  rustic: ["rustic", "natural", "wood", "reclaimed", "farmhouse"],
  industrial: ["industrial", "metal", "concrete", "raw", "urban"],
  coastal: ["coastal", "beach", "blue", "white", "nautical"],
  bohemian: ["bohemian", "eclectic", "colorful", "artisan", "textured"],
};

// Quick Quote Request Modal - Simple & Powerful Lead Gen
const QuoteRequestModal = ({
  visible,
  onClose,
  vendors,
}: {
  visible: boolean;
  onClose: () => void;
  vendors: any[];
}) => {
  const [projectType, setProjectType] = useState<string>("kitchen");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [zip, setZip] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const projectTypes = [
    { id: "kitchen", label: "Kitchen", icon: "restaurant-outline" as const },
    { id: "bathroom", label: "Bathroom", icon: "water-outline" as const },
    { id: "flooring", label: "Flooring", icon: "grid-outline" as const },
    { id: "outdoor", label: "Outdoor", icon: "leaf-outline" as const },
    { id: "other", label: "Other", icon: "ellipsis-horizontal" as const },
  ];

  const handleSubmit = () => {
    if (!name || !phone || !zip) {
      Alert.alert("Missing Info", "Please fill in all fields to get your free quotes");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitted(true);
    // In production, this would send the lead to matching contractors
  };

  const handleClose = () => {
    setSubmitted(false);
    setName("");
    setPhone("");
    setZip("");
    onClose();
  };

  if (submitted) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "#dcfce7", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
              <Ionicons name="checkmark-circle" size={48} color="#10b981" />
            </View>
            <Text style={{ fontSize: 28, fontWeight: "800", color: "#0f172a", textAlign: "center", marginBottom: 12 }}>
              Quotes on the way!
            </Text>
            <Text style={{ fontSize: 16, color: "#6b7280", textAlign: "center", lineHeight: 24, marginBottom: 32 }}>
              We're connecting you with up to 3 verified pros in your area. Expect calls within 24 hours.
            </Text>
            <View style={{ backgroundColor: "white", borderRadius: 16, padding: 20, width: "100%", marginBottom: 24 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#6b7280", marginBottom: 12 }}>MATCHED PROS</Text>
              {vendors.slice(0, 3).map((v, i) => (
                <View key={i} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: "#f3f4f6" }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary[100], alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: colors.primary[600] }}>{v.name?.charAt(0) || "P"}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: "600", color: "#0f172a" }}>{v.name || `Pro ${i + 1}`}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                      <Ionicons name="star" size={12} color="#f59e0b" />
                      <Text style={{ fontSize: 13, color: "#6b7280", marginLeft: 4 }}>{v.rating || 4.8}</Text>
                      {v.verified && (
                        <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 8 }}>
                          <Ionicons name="shield-checkmark" size={12} color="#10b981" />
                          <Text style={{ fontSize: 11, color: "#10b981", marginLeft: 2 }}>Verified</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
            <Pressable
              style={{ backgroundColor: colors.primary[600], paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, width: "100%" }}
              onPress={handleClose}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: "white", textAlign: "center" }}>Done</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", backgroundColor: "white" }}>
          <Pressable onPress={handleClose}>
            <Ionicons name="close" size={28} color="#6b7280" />
          </Pressable>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#0f172a" }}>Get Free Quotes</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
          {/* Hero */}
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <LinearGradient colors={[colors.accent[400], colors.accent[500]]} style={{ width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <Ionicons name="flash" size={32} color="white" />
            </LinearGradient>
            <Text style={{ fontSize: 24, fontWeight: "800", color: "#0f172a", textAlign: "center", marginBottom: 8 }}>
              Compare quotes from top pros
            </Text>
            <Text style={{ fontSize: 15, color: "#6b7280", textAlign: "center" }}>
              Free, no obligation • Takes 30 seconds
            </Text>
          </View>

          {/* Project Type */}
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 12 }}>What's your project?</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 20 }}>
            {projectTypes.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => setProjectType(p.id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 20,
                  marginRight: 8,
                  marginBottom: 8,
                  backgroundColor: projectType === p.id ? colors.primary[600] : "white",
                  borderWidth: 1,
                  borderColor: projectType === p.id ? colors.primary[600] : "#e5e7eb",
                }}
              >
                <Ionicons name={p.icon} size={18} color={projectType === p.id ? "white" : "#6b7280"} />
                <Text style={{ marginLeft: 6, fontSize: 14, fontWeight: "600", color: projectType === p.id ? "white" : "#374151" }}>{p.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Contact Info */}
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 12 }}>Your info</Text>
          <View style={{ backgroundColor: "white", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 20 }}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor="#9ca3af"
              style={{ fontSize: 16, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" }}
            />
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone number"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
              style={{ fontSize: 16, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" }}
            />
            <TextInput
              value={zip}
              onChangeText={setZip}
              placeholder="ZIP code"
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
              maxLength={5}
              style={{ fontSize: 16, paddingHorizontal: 16, paddingVertical: 14 }}
            />
          </View>

          {/* Trust Badges */}
          <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 24 }}>
            <View style={{ alignItems: "center" }}>
              <Ionicons name="shield-checkmark" size={24} color="#10b981" />
              <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 4, fontWeight: "500" }}>Verified Pros</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Ionicons name="lock-closed" size={24} color="#3b82f6" />
              <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 4, fontWeight: "500" }}>Secure</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Ionicons name="cash-outline" size={24} color="#f59e0b" />
              <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 4, fontWeight: "500" }}>100% Free</Text>
            </View>
          </View>

          {/* Submit */}
          <Pressable
            style={{ backgroundColor: colors.accent[500], paddingVertical: 18, borderRadius: 14, alignItems: "center", shadowColor: colors.accent[500], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
            onPress={handleSubmit}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", color: "white" }}>Get My Free Quotes</Text>
          </Pressable>

          <Text style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", marginTop: 12 }}>
            By submitting, you agree to be contacted by local pros
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { listings, loadMockData, archiveExpiredListings, toggleFavorite, favoriteIds } =
    useListingsStore();
  const { updateStreak, streak } = useGamificationStore();
  const { user, preferences } = useAuthStore();
  const { translations: t } = useLanguageStore();
  const { vendors } = useVendorStore();
  const { shouldShowAd, dismissAd, updateLastShownAdTimestamp } = useAdsStore();
  const { getAdsByPlacement, trackImpression, trackClick, loadMockAds } = useNativeAdsStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | MaterialCategory>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  
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
        listing.category === selectedType ||
        // Backward compatibility: map old stoneType listings to Stone & Tile
        (selectedType === "Stone & Tile" && listing.stoneType);

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

  // Get categories from config
  const materialCategories: Array<"all" | MaterialCategory> = [
    "all",
    ...CATEGORY_CONFIG.map(c => c.name),
  ];

  // Merge listings and ads into feed
  const mergeFeedItems = () => {
    const merged: Array<{ type: "listing" | "ad"; data: any; id: string }> = [];
    let adIndex = 0;

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
    });

    return merged;
  };

  const itemsToRender = mergeFeedItems();

  // Check if user has completed style quiz
  const hasCompletedQuiz = preferences.onboardingComplete || (preferences.completedQuizzes?.length || 0) > 0;
  const userProjectTypes = preferences.projectTypes || [];
  const userStyle = preferences.primaryStyle?.toLowerCase() || "";

  // Get personalized "For You" listings based on project types and style
  const getPersonalizedListings = () => {
    if (!hasCompletedQuiz || userProjectTypes.length === 0) return [];

    // Get relevant categories based on user's project types
    const relevantCategories: MaterialCategory[] = [];
    userProjectTypes.forEach(projectType => {
      const cats = PROJECT_TYPE_TO_CATEGORIES[projectType] || [];
      cats.forEach(cat => {
        if (!relevantCategories.includes(cat)) {
          relevantCategories.push(cat);
        }
      });
    });

    // Get style keywords
    const styleKeywords = STYLE_TO_KEYWORDS[userStyle] || [];

    // Score and filter listings
    return filteredListings
      .map(listing => {
        let score = 0;

        // Category match
        if (relevantCategories.includes(listing.category as MaterialCategory)) {
          score += 3;
        }

        // Style keyword match
        const titleLower = listing.title.toLowerCase();
        const descLower = listing.description.toLowerCase();
        styleKeywords.forEach(keyword => {
          if (titleLower.includes(keyword) || descLower.includes(keyword)) {
            score += 2;
          }
        });

        // Favorites get a boost
        if (favoriteIds.includes(listing.id)) {
          score += 1;
        }

        return { listing, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(item => item.listing);
  };

  const personalizedListings = getPersonalizedListings();

  // Get translated category name
  const getCategoryName = (type: "all" | MaterialCategory): string => {
    if (type === "all") return t.home.all;
    // For now, return the type as-is until we add translations
    return type;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Branded Header */}
      <LinearGradient
        colors={[colors.primary[600], colors.primary[700]]}
        style={styles.header}
      >
        {/* Welcome Row */}
        <View style={styles.welcomeRow}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</Text>
            <Text style={styles.taglineSmall}>Remodel Locally. Source Intelligently.</Text>
          </View>
          <View style={styles.headerActions}>
            {streak.currentStreak > 0 && (
              <View style={styles.streakBadge}>
                <Ionicons name="flame" size={14} color="#ffffff" />
                <Text style={styles.streakText}>{streak.currentStreak}</Text>
              </View>
            )}
            <Pressable
              style={styles.notificationButton}
              onPress={() => navigation.navigate("Messages" as never)}
            >
              <Ionicons name="notifications-outline" size={22} color="#ffffff" />
              <View style={styles.notificationDot} />
            </Pressable>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search materials, vendors..."
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
            style={styles.mapButton}
            onPress={() => navigation.navigate("Map")}
          >
            <Ionicons name="map" size={20} color="#ffffff" />
          </Pressable>
        </View>
      </LinearGradient>

      {/* Quick Actions Toggle Bar */}
      <Pressable
        style={styles.quickActionsToggle}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowQuickActions(!showQuickActions);
        }}
      >
        <View style={styles.filterToggleLeft}>
          <Ionicons name="apps" size={18} color={colors.primary[600]} />
          <Text style={styles.filterToggleText}>Quick Actions</Text>
        </View>
        <Ionicons
          name={showQuickActions ? "chevron-up" : "chevron-down"}
          size={20}
          color="#6b7280"
        />
      </Pressable>

      {/* Quick Actions - Collapsible Horizontal Scroll */}
      {showQuickActions && (
        <View style={styles.quickActionsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActionsScroll}
        >
          {/* Inspiration Feed - Primary Engagement CTA */}
          <Pressable
            style={styles.quickActionItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.navigate("InspirationFeed" as never);
            }}
          >
            <LinearGradient
              colors={['#ec4899', '#f43f5e']}
              style={[styles.quickActionIcon, { shadowColor: '#ec4899', shadowOpacity: 0.4 }]}
            >
              <Ionicons name="sparkles" size={24} color="white" />
            </LinearGradient>
            <Text style={[styles.quickActionText, { color: '#ec4899', fontWeight: '700' }]}>Explore</Text>
          </Pressable>

          {/* Style Quiz */}
          <Pressable
            style={styles.quickActionItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.navigate("StyleQuiz" as never);
            }}
          >
            <LinearGradient
              colors={['#a855f7', '#9333ea']}
              style={styles.quickActionIcon}
            >
              <Ionicons name="heart" size={24} color="white" />
            </LinearGradient>
            <Text style={styles.quickActionText}>My Style</Text>
          </Pressable>

          {/* Get Quotes - Primary Lead Gen CTA */}
          <Pressable
            style={styles.quickActionItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowQuoteModal(true);
            }}
          >
            <LinearGradient
              colors={[colors.accent[400], colors.accent[500]]}
              style={[styles.quickActionIcon, { shadowColor: colors.accent[500], shadowOpacity: 0.4 }]}
            >
              <Ionicons name="flash" size={24} color="white" />
            </LinearGradient>
            <Text style={[styles.quickActionText, { color: colors.accent[600], fontWeight: '700' }]}>Get Quotes</Text>
          </Pressable>

          <Pressable
            style={styles.quickActionItem}
            onPress={() => setSelectedType("all")}
          >
            <LinearGradient
              colors={[colors.red[500], colors.red[600]]}
              style={styles.quickActionIcon}
            >
              <Ionicons name="pricetag" size={24} color="white" />
            </LinearGradient>
            <Text style={styles.quickActionText}>For Sale</Text>
          </Pressable>

          <Pressable
            style={styles.quickActionItem}
            onPress={() => navigation.navigate("Map")}
          >
            <LinearGradient
              colors={[colors.primary[500], colors.primary[600]]}
              style={styles.quickActionIcon}
            >
              <Ionicons name="storefront" size={24} color="white" />
            </LinearGradient>
            <Text style={styles.quickActionText}>Vendors</Text>
          </Pressable>

          <Pressable
            style={styles.quickActionItem}
            onPress={() => navigation.navigate("SmartMeasurement" as never)}
          >
            <LinearGradient
              colors={['#06b6d4', '#0891b2']}
              style={styles.quickActionIcon}
            >
              <Ionicons name="scan" size={24} color="white" />
            </LinearGradient>
            <Text style={styles.quickActionText}>Measure</Text>
          </Pressable>

          <Pressable
            style={styles.quickActionItem}
            onPress={() => setSelectedType("Kitchen")}
          >
            <LinearGradient
              colors={['#8b5cf6', '#7c3aed']}
              style={styles.quickActionIcon}
            >
              <Ionicons name="restaurant-outline" size={24} color="white" />
            </LinearGradient>
            <Text style={styles.quickActionText}>Kitchen</Text>
          </Pressable>

          <Pressable
            style={styles.quickActionItem}
            onPress={() => navigation.navigate("Add" as never)}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={styles.quickActionIcon}
            >
              <Ionicons name="add-circle" size={24} color="white" />
            </LinearGradient>
            <Text style={styles.quickActionText}>Sell</Text>
          </Pressable>

          <Pressable
            style={styles.quickActionItem}
            onPress={() => navigation.navigate("Calendar" as never)}
          >
            <LinearGradient
              colors={['#f59e0b', '#d97706']}
              style={styles.quickActionIcon}
            >
              <Ionicons name="calendar" size={24} color="white" />
            </LinearGradient>
            <Text style={styles.quickActionText}>Calendar</Text>
          </Pressable>

          <Pressable
            style={styles.quickActionItem}
            onPress={() => navigation.navigate("CommunityBoard" as never)}
          >
            <LinearGradient
              colors={['#ec4899', '#db2777']}
              style={[styles.quickActionIcon, { position: 'relative' }]}
            >
              <Ionicons name="chatbubbles" size={24} color="white" />
            </LinearGradient>
            <Text style={styles.quickActionText}>Community</Text>
          </Pressable>
        </ScrollView>
        </View>
      )}

      {/* Collapsible Filter Bar */}
      <Pressable
        style={styles.filterToggleBar}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowFilters(!showFilters);
        }}
      >
        <View style={styles.filterToggleLeft}>
          <Ionicons name="filter" size={18} color={colors.primary[600]} />
          <Text style={styles.filterToggleText}>
            {selectedType === "all" ? "All Categories" : selectedType}
          </Text>
          {selectedType !== "all" && (
            <View style={styles.activeFilterBadge}>
              <Text style={styles.activeFilterBadgeText}>1</Text>
            </View>
          )}
        </View>
        <Ionicons
          name={showFilters ? "chevron-up" : "chevron-down"}
          size={20}
          color="#6b7280"
        />
      </Pressable>

      {/* Material Filter Pills - Collapsible */}
      {showFilters && (
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
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
      )}

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
        {/* Lead Gen Banner - Simple & Prominent */}
        <Pressable
          style={styles.leadGenBanner}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowQuoteModal(true);
          }}
        >
          <LinearGradient
            colors={[colors.accent[500], colors.accent[600]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.leadGenGradient}
          >
            <View style={styles.leadGenContent}>
              <View style={styles.leadGenIconContainer}>
                <Ionicons name="flash" size={28} color="white" />
              </View>
              <View style={styles.leadGenText}>
                <Text style={styles.leadGenTitle}>Get 3 Free Quotes</Text>
                <Text style={styles.leadGenSubtitle}>Compare prices from verified local pros</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="white" />
            </View>
          </LinearGradient>
        </Pressable>

        {/* Style Quiz CTA - Show if user hasn't completed quiz */}
        {!hasCompletedQuiz && (
          <Pressable
            style={styles.quizCtaBanner}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.navigate("StyleQuiz" as never);
            }}
          >
            <LinearGradient
              colors={['#a855f7', '#9333ea']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.quizCtaGradient}
            >
              <View style={styles.quizCtaContent}>
                <View style={styles.quizCtaIconContainer}>
                  <Ionicons name="heart" size={24} color="white" />
                </View>
                <View style={styles.quizCtaText}>
                  <Text style={styles.quizCtaTitle}>Discover Your Style</Text>
                  <Text style={styles.quizCtaSubtitle}>Take a 2-min quiz for personalized recommendations</Text>
                </View>
                <View style={styles.quizCtaBadge}>
                  <Text style={styles.quizCtaBadgeText}>NEW</Text>
                </View>
              </View>
            </LinearGradient>
          </Pressable>
        )}

        {/* For You Section - Personalized based on quiz results */}
        {hasCompletedQuiz && personalizedListings.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="sparkles" size={22} color="#a855f7" />
                <Text style={styles.sectionTitle}>For You</Text>
                {preferences.styleName && (
                  <View style={styles.styleTag}>
                    <Text style={styles.styleTagText}>{preferences.styleName}</Text>
                  </View>
                )}
              </View>
              <Pressable onPress={() => navigation.navigate("InspirationFeed" as never)}>
                <Text style={styles.seeAllText}>Explore</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {personalizedListings.map((listing) => {
                const isFavorite = favoriteIds.includes(listing.id);
                return (
                  <Pressable
                    key={`personalized-${listing.id}`}
                    style={styles.personalizedCard}
                    onPress={() => navigation.navigate("ListingDetail", { listingId: listing.id })}
                  >
                    <Image
                      source={{ uri: listing.images[0] }}
                      style={styles.personalizedImage}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.75)']}
                      style={styles.personalizedGradient}
                    >
                      <View style={styles.personalizedBadge}>
                        <Ionicons name="sparkles" size={10} color="white" />
                        <Text style={styles.personalizedBadgeText}>Match</Text>
                      </View>
                      <Text style={styles.personalizedPrice}>${listing.price}</Text>
                      <Text style={styles.personalizedTitle} numberOfLines={1}>{listing.title}</Text>
                    </LinearGradient>
                    <Pressable
                      style={styles.personalizedFavorite}
                      onPress={() => toggleFavorite(listing.id)}
                    >
                      <Ionicons
                        name={isFavorite ? "heart" : "heart-outline"}
                        size={20}
                        color={isFavorite ? "#ef4444" : "#ffffff"}
                      />
                    </Pressable>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Active Projects Section - Show user's project pins */}
        {(preferences.activeProjects?.length || 0) > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="construct" size={20} color={colors.primary[600]} />
                <Text style={styles.sectionTitle}>My Projects</Text>
              </View>
              <Pressable onPress={() => navigation.navigate("Map")}>
                <Text style={styles.seeAllText}>View Map</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {preferences.activeProjects?.slice(0, 5).map((project) => (
                <Pressable
                  key={`project-${project.id}`}
                  style={styles.projectCard}
                  onPress={() => navigation.navigate("Map")}
                >
                  <LinearGradient
                    colors={[colors.primary[500], colors.primary[700]]}
                    style={styles.projectCardGradient}
                  >
                    <View style={styles.projectIconWrap}>
                      <Ionicons
                        name={
                          project.type === "kitchen" ? "restaurant" :
                          project.type === "bathroom" ? "water" :
                          project.type === "outdoor" ? "leaf" :
                          project.type === "flooring" ? "grid" :
                          "construct"
                        }
                        size={24}
                        color="white"
                      />
                    </View>
                    <Text style={styles.projectType}>
                      {project.type.charAt(0).toUpperCase() + project.type.slice(1)}
                    </Text>
                    {project.subtype && (
                      <Text style={styles.projectSubtype}>{project.subtype}</Text>
                    )}
                    {project.timeline && (
                      <View style={styles.projectTimelineBadge}>
                        <Text style={styles.projectTimelineText}>
                          {project.timeline === "urgent" ? "Urgent" :
                           project.timeline === "soon" ? "Soon" :
                           project.timeline === "planning" ? "Planning" : "Exploring"}
                        </Text>
                      </View>
                    )}
                  </LinearGradient>
                </Pressable>
              ))}
              {/* Add New Project Card */}
              <Pressable
                style={styles.addProjectCard}
                onPress={() => navigation.navigate("StyleQuiz" as never)}
              >
                <Ionicons name="add-circle-outline" size={32} color={colors.primary[400]} />
                <Text style={styles.addProjectText}>Add Project</Text>
              </Pressable>
            </ScrollView>
          </View>
        )}

        {/* Hot Deals Section - Horizontal Scroll */}
        {filteredListings.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="flame" size={22} color="#ef4444" />
                <Text style={styles.sectionTitle}>Hot Deals</Text>
              </View>
              <Pressable onPress={() => setSortMode("price-low")}>
                <Text style={styles.seeAllText}>See All</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {filteredListings
                .filter(l => l.price < 500)
                .slice(0, 6)
                .map((listing) => {
                  const isFavorite = favoriteIds.includes(listing.id);
                  return (
                    <Pressable
                      key={`hot-${listing.id}`}
                      style={styles.hotDealCard}
                      onPress={() => navigation.navigate("ListingDetail", { listingId: listing.id })}
                    >
                      <Image
                        source={{ uri: listing.images[0] }}
                        style={styles.hotDealImage}
                        resizeMode="cover"
                      />
                      <View style={styles.hotDealBadge}>
                        <Ionicons name="flame" size={12} color="white" />
                        <Text style={styles.hotDealBadgeText}>Deal</Text>
                      </View>
                      <Pressable
                        style={styles.hotDealFavorite}
                        onPress={() => toggleFavorite(listing.id)}
                      >
                        <Ionicons
                          name={isFavorite ? "heart" : "heart-outline"}
                          size={20}
                          color={isFavorite ? "#ef4444" : "#ffffff"}
                        />
                      </Pressable>
                      <View style={styles.hotDealInfo}>
                        <Text style={styles.hotDealPrice}>${listing.price}</Text>
                        <Text style={styles.hotDealTitle} numberOfLines={1}>{listing.title}</Text>
                        <View style={styles.listingStats}>
                          {listing.dimensions && (
                            <Text style={styles.hotDealDimensions}>
                              {listing.dimensions.length}" × {listing.dimensions.width}"
                            </Text>
                          )}
                          {(listing.likeCount || listing.likes?.length) ? (
                            <View style={styles.likeCounter}>
                              <Ionicons name="heart" size={10} color="#ef4444" />
                              <Text style={styles.likeCountText}>{listing.likeCount || listing.likes?.length || 0}</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
            </ScrollView>
          </View>
        )}

        {/* Top Vendors Section */}
        {vendors.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="shield-checkmark" size={20} color="#10b981" />
                <Text style={styles.sectionTitle}>Top Rated Pros</Text>
              </View>
              <Pressable onPress={() => navigation.navigate("Map")}>
                <Text style={styles.seeAllText}>View Map</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {vendors
                .filter(v => v.verified)
                .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                .slice(0, 5)
                .map((vendor) => (
                  <Pressable
                    key={`vendor-${vendor.id}`}
                    style={styles.vendorCard}
                    onPress={() => navigation.navigate("UserProfile", { userId: vendor.id })}
                  >
                    <LinearGradient
                      colors={[colors.primary[500], colors.primary[600]]}
                      style={styles.vendorAvatar}
                    >
                      <Text style={styles.vendorInitial}>{vendor.name?.charAt(0) || "V"}</Text>
                    </LinearGradient>
                    <Text style={styles.vendorName} numberOfLines={1}>{vendor.name}</Text>
                    <View style={styles.vendorRating}>
                      <Ionicons name="star" size={12} color="#f59e0b" />
                      <Text style={styles.vendorRatingText}>{vendor.rating?.toFixed(1) || "4.8"}</Text>
                    </View>
                    <View style={styles.vendorBadge}>
                      <Ionicons name="shield-checkmark" size={10} color="#10b981" />
                      <Text style={styles.vendorBadgeText}>Verified</Text>
                    </View>
                  </Pressable>
                ))}
            </ScrollView>
          </View>
        )}

        {/* Premium Materials Section */}
        {filteredListings.filter(l => l.price >= 500).length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="diamond" size={20} color="#8b5cf6" />
                <Text style={styles.sectionTitle}>Premium Materials</Text>
              </View>
              <Pressable onPress={() => setSortMode("price-high")}>
                <Text style={styles.seeAllText}>See All</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {filteredListings
                .filter(l => l.price >= 500)
                .slice(0, 6)
                .map((listing) => {
                  const isFavorite = favoriteIds.includes(listing.id);
                  return (
                    <Pressable
                      key={`premium-${listing.id}`}
                      style={styles.premiumCard}
                      onPress={() => navigation.navigate("ListingDetail", { listingId: listing.id })}
                    >
                      <Image
                        source={{ uri: listing.images[0] }}
                        style={styles.premiumImage}
                        resizeMode="cover"
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.7)']}
                        style={styles.premiumGradient}
                      >
                        <View style={styles.premiumBadge}>
                          <Ionicons name="diamond" size={10} color="white" />
                          <Text style={styles.premiumBadgeText}>Premium</Text>
                        </View>
                        <Text style={styles.premiumPrice}>${listing.price.toLocaleString()}</Text>
                        <Text style={styles.premiumTitle} numberOfLines={1}>{listing.title}</Text>
                      </LinearGradient>
                      <Pressable
                        style={styles.premiumFavorite}
                        onPress={() => toggleFavorite(listing.id)}
                      >
                        <Ionicons
                          name={isFavorite ? "heart" : "heart-outline"}
                          size={22}
                          color={isFavorite ? "#ef4444" : "#ffffff"}
                        />
                      </Pressable>
                    </Pressable>
                  );
                })}
            </ScrollView>
          </View>
        )}

        {/* All Listings Header */}
        <View style={styles.allListingsHeader}>
          <Text style={styles.allListingsTitle}>All Materials</Text>
          <Text style={styles.listingsCount}>{filteredListings.length} items</Text>
        </View>

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
                    <View style={styles.gridPriceRow}>
                      <Text style={styles.gridPrice}>${listing.price}</Text>
                      {(listing.likeCount || listing.likes?.length) ? (
                        <View style={styles.likeCounter}>
                          <Ionicons name="heart" size={10} color="#ef4444" />
                          <Text style={styles.likeCountText}>{listing.likeCount || listing.likes?.length || 0}</Text>
                        </View>
                      ) : null}
                    </View>
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
                        <Text style={styles.typeBadgeText}>{listing.subcategory || listing.category}</Text>
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
                      {(listing.likeCount || listing.likes?.length) ? (
                        <View style={styles.metaItem}>
                          <Ionicons name="heart" size={14} color="#ef4444" />
                          <Text style={styles.metaText}>{listing.likeCount || listing.likes?.length} likes</Text>
                        </View>
                      ) : null}
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
                      <Text style={styles.compactType}>{listing.subcategory || listing.category}</Text>
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

      {/* Quote Request Modal - Lead Generation */}
      <QuoteRequestModal
        visible={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        vendors={vendors}
      />
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
    paddingTop: 8,
    paddingBottom: 16,
  },
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  taglineSmall: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '400',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent[500],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 3,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.red[500],
    borderWidth: 1.5,
    borderColor: colors.primary[600],
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: colors.text.primary,
    fontWeight: "500",
  },
  mapButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationButton: {
    backgroundColor: colors.accent[400],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  // Quick Actions - Horizontal Scroll
  quickActionsContainer: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  quickActionsScroll: {
    paddingHorizontal: 16,
    gap: 16,
  },
  quickActionItem: {
    alignItems: 'center',
    width: 70,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  // Collapsible Toggle Bars
  quickActionsToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  filterToggleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterToggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  activeFilterBadge: {
    backgroundColor: colors.primary[600],
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFilterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
  },
  filterContainer: {
    backgroundColor: 'white',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
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
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
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
  // Lead Gen Banner Styles
  leadGenBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.accent[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  leadGenGradient: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  leadGenContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leadGenIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  leadGenText: {
    flex: 1,
  },
  leadGenTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  leadGenSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
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
  // Section Styles
  sectionContainer: {
    marginTop: 16,
    paddingBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
  },
  horizontalScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  // Hot Deal Cards
  hotDealCard: {
    width: 160,
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  hotDealImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f3f4f6',
  },
  hotDealBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  hotDealBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
  },
  hotDealFavorite: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotDealInfo: {
    padding: 12,
  },
  hotDealPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  hotDealTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
  },
  hotDealDimensions: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  listingStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  likeCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  likeCountText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ef4444',
  },
  gridPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  // Vendor Cards
  vendorCard: {
    width: 100,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  vendorAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  vendorInitial: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
  },
  vendorName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 4,
  },
  vendorRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  vendorRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  vendorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  vendorBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10b981',
  },
  // Premium Cards
  premiumCard: {
    width: 200,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  premiumImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
  },
  premiumGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    paddingTop: 40,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
  premiumPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
  },
  premiumTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
  },
  premiumFavorite: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // All Listings Header
  allListingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: '#f8f9fa',
  },
  allListingsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  listingsCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
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
  // Quiz CTA Banner Styles
  quizCtaBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  quizCtaGradient: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  quizCtaContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quizCtaIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quizCtaText: {
    flex: 1,
  },
  quizCtaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  quizCtaSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  quizCtaBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  quizCtaBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
  },
  // Style Tag
  styleTag: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 8,
  },
  styleTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9333ea',
  },
  // Personalized Cards
  personalizedCard: {
    width: 180,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  personalizedImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
  },
  personalizedGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    paddingTop: 40,
  },
  personalizedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#a855f7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  personalizedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
  personalizedPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
  },
  personalizedTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
  },
  personalizedFavorite: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Project Cards
  projectCard: {
    width: 130,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  projectCardGradient: {
    padding: 16,
    alignItems: 'center',
    minHeight: 140,
  },
  projectIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  projectType: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 4,
  },
  projectSubtype: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 8,
  },
  projectTimelineBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 4,
  },
  projectTimelineText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
  },
  addProjectCard: {
    width: 100,
    minHeight: 140,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary[200],
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
  },
  addProjectText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[500],
    marginTop: 8,
    textAlign: 'center',
  },
});
