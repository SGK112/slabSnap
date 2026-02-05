import React, { useState, useEffect } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../utils/colors";
import { useVendorStore } from "../state/vendorStore";
import { useListingsStore } from "../state/listingsStore";
import { Vendor, VendorType } from "../types/vendors";
import { Listing } from "../types/marketplace";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../nav";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const VENDOR_TYPE_ICONS: Record<VendorType, keyof typeof Ionicons.glyphMap> = {
  fabricator: "hammer",
  "tile-store": "grid",
  "home-remodeling": "home",
  "countertop-specialist": "cube",
  "flooring-specialist": "layers",
  "kitchen-bath": "water",
  "general-contractor": "construct",
  supplier: "storefront",
  distributor: "business",
  showroom: "easel",
};

export default function MapScreenWeb() {
  const navigation = useNavigation<NavigationProp>();
  const { vendors, loadMockVendors } = useVendorStore();
  const { listings } = useListingsStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"vendors" | "listings">("vendors");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (vendors.length === 0) {
      loadMockVendors();
    }
    setLoading(false);
  }, []);

  const filteredVendors = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.location.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredListings = listings.filter(
    (l) =>
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleVendorPress = (vendor: Vendor) => {
    const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(
      `${vendor.location.address}, ${vendor.location.city}, ${vendor.location.state}`
    )}`;
    Linking.openURL(mapsUrl);
  };

  const handleListingPress = (listing: Listing) => {
    navigation.navigate("ListingDetail", { listingId: listing.id });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Nearby</Text>
        <Text style={styles.headerSubtitle}>
          Vendors and listings in your area
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.neutral[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or location..."
            placeholderTextColor={colors.neutral[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color={colors.neutral[400]} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === "vendors" && styles.activeTab]}
          onPress={() => setActiveTab("vendors")}
        >
          <Ionicons
            name="storefront"
            size={18}
            color={activeTab === "vendors" ? colors.primary[600] : colors.neutral[500]}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "vendors" && styles.activeTabText,
            ]}
          >
            Vendors ({filteredVendors.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "listings" && styles.activeTab]}
          onPress={() => setActiveTab("listings")}
        >
          <Ionicons
            name="pricetag"
            size={18}
            color={activeTab === "listings" ? colors.primary[600] : colors.neutral[500]}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "listings" && styles.activeTabText,
            ]}
          >
            Listings ({filteredListings.length})
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === "vendors" ? (
          filteredVendors.length > 0 ? (
            filteredVendors.map((vendor) => (
              <Pressable
                key={vendor.id}
                style={styles.card}
                onPress={() => handleVendorPress(vendor)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.vendorIcon}>
                    <Ionicons
                      name={VENDOR_TYPE_ICONS[vendor.vendorType] || "business"}
                      size={24}
                      color={colors.primary[600]}
                    />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{vendor.name}</Text>
                    <Text style={styles.cardSubtitle}>
                      {vendor.location.city}, {vendor.location.state}
                    </Text>
                    {vendor.rating && (
                      <View style={styles.ratingRow}>
                        <Ionicons name="star" size={14} color="#fbbf24" />
                        <Text style={styles.ratingText}>
                          {vendor.rating.toFixed(1)} ({vendor.reviewCount || 0} reviews)
                        </Text>
                      </View>
                    )}
                  </View>
                  {vendor.verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    </View>
                  )}
                </View>
                <View style={styles.cardActions}>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => vendor.phone && Linking.openURL(`tel:${vendor.phone}`)}
                  >
                    <Ionicons name="call" size={16} color={colors.primary[600]} />
                    <Text style={styles.actionText}>Call</Text>
                  </Pressable>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => handleVendorPress(vendor)}
                  >
                    <Ionicons name="navigate" size={16} color={colors.primary[600]} />
                    <Text style={styles.actionText}>Directions</Text>
                  </Pressable>
                  {vendor.website && (
                    <Pressable
                      style={styles.actionButton}
                      onPress={() => Linking.openURL(vendor.website!)}
                    >
                      <Ionicons name="globe" size={16} color={colors.primary[600]} />
                      <Text style={styles.actionText}>Website</Text>
                    </Pressable>
                  )}
                </View>
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="storefront-outline" size={48} color={colors.neutral[300]} />
              <Text style={styles.emptyText}>No vendors found</Text>
            </View>
          )
        ) : filteredListings.length > 0 ? (
          filteredListings.map((listing) => (
            <Pressable
              key={listing.id}
              style={styles.card}
              onPress={() => handleListingPress(listing)}
            >
              <View style={styles.listingCard}>
                {listing.images[0] && (
                  <Image
                    source={{ uri: listing.images[0] }}
                    style={styles.listingImage}
                  />
                )}
                <View style={styles.listingInfo}>
                  <Text style={styles.cardTitle}>{listing.title}</Text>
                  <Text style={styles.cardSubtitle}>{listing.location}</Text>
                  <Text style={styles.priceText}>${listing.price}</Text>
                </View>
              </View>
            </Pressable>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="pricetag-outline" size={48} color={colors.neutral[300]} />
            <Text style={styles.emptyText}>No listings found</Text>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Web Map Notice */}
      <View style={styles.webNotice}>
        <Ionicons name="information-circle" size={16} color={colors.primary[600]} />
        <Text style={styles.webNoticeText}>
          Download the REMODELY.AI app for the full interactive map experience
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    marginLeft: 12,
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    gap: 6,
  },
  activeTab: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.neutral[500],
  },
  activeTabText: {
    color: colors.primary[600],
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  vendorIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  verifiedBadge: {
    marginLeft: 8,
  },
  cardActions: {
    flexDirection: "row",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.primary[600],
  },
  listingCard: {
    flexDirection: "row",
  },
  listingImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 12,
  },
  listingInfo: {
    flex: 1,
    justifyContent: "center",
  },
  priceText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary[600],
    marginTop: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.tertiary,
    marginTop: 12,
  },
  webNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.primary[50],
    gap: 8,
  },
  webNoticeText: {
    fontSize: 13,
    color: colors.primary[700],
  },
});
