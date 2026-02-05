import React, { useEffect, useState, useRef } from "react";
import { View, Text, ScrollView, Pressable, Image, Linking, StyleSheet, Dimensions, NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../nav";
import { useListingsStore } from "../state/listingsStore";
import { useAuthStore } from "../state/authStore";
import { useMessagingStore } from "../state/messagingStore";
import { useVendorStore } from "../state/vendorStore";
import { useAdsStore } from "../state/adsStore";
import { shareListingToSocial } from "../utils/sharing";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { colors } from "../utils/colors";
import { VendorAdTooltip } from "../components/VendorAdTooltip";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type RouteType = RouteProp<RootStackParamList, "ListingDetail">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, "ListingDetail">;

export default function ListingDetailScreen() {
  const route = useRoute<RouteType>();
  const navigation = useNavigation<NavigationProp>();
  const { listingId } = route.params;
  const { getListingById, incrementViews, toggleFavorite, favoriteIds } =
    useListingsStore();
  const { user } = useAuthStore();
  const { conversations, createConversation } = useMessagingStore();
  const { vendors } = useVendorStore();
  const { shouldShowAd, dismissAd, updateLastShownAdTimestamp } = useAdsStore();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageScrollRef = useRef<ScrollView>(null);

  const listing = getListingById(listingId);
  
  // Find a relevant vendor based on listing location
  const relevantVendor = vendors.find(v => 
    v.verified && 
    v.location.city === listing?.location.split(",")[0].trim()
  ) || vendors.find(v => v.verified) || vendors[0];

  useEffect(() => {
    if (listing) {
      incrementViews(listingId);
    }
  }, [listingId]);
  
  const handleImageScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentImageIndex(index);
  };

  if (!listing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.neutral[300]} />
          <Text style={styles.errorText}>
            Listing not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isFavorite = favoriteIds.includes(listing.id);
  const timeLeft = formatDistanceToNow(listing.expiresAt, { addSuffix: true });

  const handleContact = () => {
    // Check auth first
    if (!user) {
      navigation.navigate("Login" as any);
      return;
    }
    
    // Check if conversation already exists
    const existingConversation = conversations.find(
      (conv) =>
        conv.listingId === listing.id &&
        (conv.otherUserId === listing.sellerId || conv.otherUserId === user.id)
    );

    if (existingConversation) {
      navigation.navigate("Chat", { conversationId: existingConversation.id });
    } else {
      // Create new conversation
      const newConversation = {
        id: `conv-${Date.now()}`,
        listingId: listing.id,
        listingTitle: listing.title,
        listingImage: listing.images[0],
        otherUserId: listing.sellerId,
        otherUserName: listing.sellerName,
        otherUserAvatar: listing.sellerAvatar,
        lastMessage: "",
        lastMessageTime: Date.now(),
        unreadCount: 0,
        channel: "listing" as const,
        platform: "slabsnap" as const,
      };
      
      createConversation(newConversation);
      navigation.navigate("Chat", { conversationId: newConversation.id });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <SafeAreaView edges={["top"]} style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        
        <View style={styles.headerActions}>
          <Pressable
            style={styles.headerActionButton}
            onPress={() => shareListingToSocial(listing)}
          >
            <Ionicons name="share-social" size={20} color={colors.text.primary} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Images with Pagination */}
        <View style={styles.imageContainer}>
          <ScrollView
            ref={imageScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleImageScroll}
            scrollEventThrottle={16}
            style={styles.imageScroll}
          >
            {listing.images.map((uri, index) => (
              <Image
                key={index}
                source={{ uri }}
                style={styles.image}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          
          {/* Pagination Dots */}
          {listing.images.length > 1 && (
            <View style={styles.paginationContainer}>
              {listing.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === currentImageIndex && styles.paginationDotActive
                  ]}
                />
              ))}
            </View>
          )}
          
          {/* Image Counter */}
          {listing.images.length > 1 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {currentImageIndex + 1} / {listing.images.length}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Price & Type */}
          <View style={styles.priceSection}>
            <Text style={styles.price}>${listing.price}</Text>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{listing.listingType}</Text>
            </View>
          </View>

          {/* Title & Stone Type */}
          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.stoneType}>{listing.stoneType}</Text>

          {/* Quick Info Grid */}
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Ionicons name="location" size={18} color={colors.primary[600]} />
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{listing.location}</Text>
            </View>

            {listing.dimensions && (
              <View style={styles.infoCard}>
                <Ionicons name="resize" size={18} color={colors.primary[600]} />
                <Text style={styles.infoLabel}>Dimensions</Text>
                <Text style={styles.infoValue}>
                  {listing.dimensions.length}" × {listing.dimensions.width}" × {listing.dimensions.thickness}"
                </Text>
              </View>
            )}

            <View style={styles.infoCard}>
              <Ionicons name="time" size={18} color={colors.accent[500]} />
              <Text style={styles.infoLabel}>Expires</Text>
              <Text style={styles.infoValue}>{timeLeft}</Text>
            </View>

            <View style={styles.infoCard}>
              <Ionicons name="eye" size={18} color={colors.neutral[500]} />
              <Text style={styles.infoLabel}>Views</Text>
              <Text style={styles.infoValue}>{listing.views}</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{listing.description}</Text>
          </View>

          {/* Map Location Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.mapContainer}>
              <Image
                source={{ uri: "https://developers.google.com/static/maps/images/landing/hero_maps_static_api.png" }}
                style={styles.mapImage}
                resizeMode="cover"
              />
              
              {/* Location marker pin */}
              <View style={styles.markerContainer}>
                <Ionicons name="location-sharp" size={40} color={colors.primary[600]} />
              </View>

              {/* Get Directions Button */}
              <Pressable
                style={styles.directionsButton}
                onPress={() => {
                  const url = `https://maps.apple.com/?q=${encodeURIComponent(listing.location)}`;
                  Linking.openURL(url);
                }}
              >
                <Ionicons name="navigate" size={16} color="white" />
                <Text style={styles.directionsButtonText}>Directions</Text>
              </Pressable>
            </View>
          </View>

          {/* Seller */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Seller</Text>
            <Pressable
              style={styles.sellerCard}
              onPress={() =>
                navigation.navigate("UserProfile", { userId: listing.sellerId })
              }
            >
              <View style={styles.sellerInfo}>
                <View style={styles.sellerAvatar}>
                  <Ionicons name="person" size={28} color={colors.neutral[500]} />
                </View>
                <View style={styles.sellerDetails}>
                  <Text style={styles.sellerName}>{listing.sellerName}</Text>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={14} color={colors.accent[500]} />
                    <Text style={styles.ratingText}>{listing.sellerRating.toFixed(1)} rating</Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
            </Pressable>
          </View>

          {/* Warning */}
          <View style={styles.warningCard}>
            <Ionicons name="shield-checkmark" size={20} color={colors.warning.main} />
            <Text style={styles.warningText}>
              Meet in a safe public place. Inspect items before purchase. Never send money in advance.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <Pressable
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(listing.id)}
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={24}
            color={isFavorite ? colors.accent[500] : colors.text.primary}
          />
        </Pressable>

        <Pressable
          style={styles.contactButton}
          onPress={handleContact}
        >
          <Ionicons name="chatbubble" size={18} color="white" style={{ marginRight: 8 }} />
          <Text style={styles.contactButtonText}>
            {user ? "Message Seller" : "Log In to Message"}
          </Text>
        </Pressable>
      </View>
      
      {/* Vendor Ad Tooltip */}
      {relevantVendor && shouldShowAd(`listing-${listingId}-vendor-ad`, 60) && (
        <VendorAdTooltip
          vendor={relevantVendor}
          position="bottom"
          context={`Need help with ${listing.stoneType} installation?`}
          onDismiss={() => {
            dismissAd(`listing-${listingId}-vendor-ad`);
            updateLastShownAdTimestamp();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.background.primary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backText: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text.primary,
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 16,
    color: colors.text.tertiary,
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: "relative",
    marginBottom: 20,
  },
  imageScroll: {
    height: 300,
  },
  image: {
    width: SCREEN_WIDTH,
    height: 300,
  },
  paginationContainer: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  paginationDotActive: {
    backgroundColor: "white",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  imageCounter: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  imageCounterText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  priceSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  price: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  typeBadge: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  typeBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "white",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  stoneType: {
    fontSize: 16,
    color: colors.text.tertiary,
    fontWeight: "500",
    marginBottom: 24,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 32,
  },
  infoCard: {
    flex: 1,
    minWidth: "47%",
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.main,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.tertiary,
    marginTop: 8,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.primary,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  mapContainer: {
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.background.tertiary,
    position: "relative",
  },
  mapImage: {
    width: "100%",
    height: "100%",
  },
  markerContainer: {
    position: "absolute",
    top: "35%",
    left: "50%",
    transform: [{ translateX: -20 }, { translateY: -40 }],
  },
  directionsButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: colors.primary[600],
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  directionsButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  sellerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.main,
  },
  sellerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sellerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.background.tertiary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: colors.text.tertiary,
    fontWeight: "500",
  },
  warningCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.warning.light,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.accent[200],
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 20,
    fontWeight: "500",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background.primary,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.light,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  favoriteButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border.main,
  },
  contactButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary[600],
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  contactButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "white",
  },
});
