import React from "react";
import { View, Text, Pressable, Image, StyleSheet, Linking, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeAd } from "../state/nativeAdsStore";
import { colors } from "../utils/colors";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

interface NativeAdCardProps {
  ad: NativeAd;
  viewMode?: "grid" | "large" | "compact";
  onPress?: () => void;
  onImpression?: () => void;
}

export function NativeAdCard({ ad, viewMode = "grid", onPress, onImpression }: NativeAdCardProps) {
  React.useEffect(() => {
    // Track impression when ad is rendered
    onImpression?.();
  }, []);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();

    // Handle CTA action
    switch (ad.ctaAction) {
      case "call":
        if (ad.phoneNumber) {
          Linking.openURL(`tel:${ad.phoneNumber}`);
        }
        break;
      case "website":
        if (ad.website) {
          const url = ad.website.startsWith("http") ? ad.website : `https://${ad.website}`;
          Linking.openURL(url);
        }
        break;
      case "message":
        // Handle message action (could navigate to messages screen)
        break;
    }
  };

  // Grid view (2 columns)
  if (viewMode === "grid") {
    return (
      <Pressable style={styles.gridCard} onPress={handlePress}>
        {ad.imageUrl ? (
          <Image source={{ uri: ad.imageUrl }} style={styles.gridImage} resizeMode="cover" />
        ) : (
          <View style={[styles.gridImage, styles.placeholderImage]}>
            <Ionicons name="business" size={48} color={colors.neutral[400]} />
          </View>
        )}
        
        {/* Ad Badge */}
        <View style={styles.adBadge}>
          <Ionicons name="megaphone" size={12} color="white" />
          <Text style={styles.adBadgeText}>Ad</Text>
        </View>

        {/* Verified Badge */}
        {ad.verified && (
          <View style={styles.verifiedBadgeGrid}>
            <Ionicons name="checkmark-circle" size={20} color={colors.accent[500]} />
          </View>
        )}

        <View style={styles.gridInfo}>
          <Text style={styles.gridBusinessName} numberOfLines={1}>
            {ad.businessName}
          </Text>
          <Text style={styles.gridTitle} numberOfLines={2}>
            {ad.title}
          </Text>
          <Text style={styles.gridDescription} numberOfLines={1}>
            {ad.description}
          </Text>
          
          <Pressable style={styles.gridCTA} onPress={handlePress}>
            <Text style={styles.gridCTAText}>{ad.ctaText}</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary[600]} />
          </Pressable>
        </View>
      </Pressable>
    );
  }

  // Large card view
  if (viewMode === "large") {
    return (
      <Pressable style={styles.largeCard} onPress={handlePress}>
        {ad.imageUrl ? (
          <Image source={{ uri: ad.imageUrl }} style={styles.largeImage} resizeMode="cover" />
        ) : (
          <View style={[styles.largeImage, styles.placeholderImage]}>
            <Ionicons name="business" size={80} color={colors.neutral[400]} />
          </View>
        )}

        {/* Ad Badge */}
        <View style={styles.adBadgeLarge}>
          <Ionicons name="megaphone" size={14} color="white" />
          <Text style={styles.adBadgeTextLarge}>Sponsored</Text>
        </View>

        <View style={styles.largeInfo}>
          <View style={styles.largeHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.businessRow}>
                <Text style={styles.largeBusinessName} numberOfLines={1}>
                  {ad.businessName}
                </Text>
                {ad.verified && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.accent[500]} />
                )}
              </View>
              <Text style={styles.businessType}>{ad.businessType}</Text>
            </View>
          </View>

          <Text style={styles.largeTitle} numberOfLines={2}>
            {ad.title}
          </Text>
          <Text style={styles.largeDescription} numberOfLines={2}>
            {ad.description}
          </Text>

          <View style={styles.largeMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="location" size={16} color={colors.text.tertiary} />
              <Text style={styles.metaText}>{ad.location}</Text>
            </View>
            {ad.phoneNumber && (
              <View style={styles.metaItem}>
                <Ionicons name="call" size={16} color={colors.text.tertiary} />
                <Text style={styles.metaText}>{ad.phoneNumber}</Text>
              </View>
            )}
          </View>

          <Pressable style={styles.largeCTA} onPress={handlePress}>
            <Text style={styles.largeCTAText}>{ad.ctaText}</Text>
            <Ionicons name="arrow-forward" size={18} color="white" />
          </Pressable>
        </View>
      </Pressable>
    );
  }

  // Compact list view
  return (
    <Pressable style={styles.compactCard} onPress={handlePress}>
      {ad.imageUrl ? (
        <Image source={{ uri: ad.imageUrl }} style={styles.compactImage} resizeMode="cover" />
      ) : (
        <View style={[styles.compactImage, styles.placeholderImage]}>
          <Ionicons name="business" size={32} color={colors.neutral[400]} />
        </View>
      )}

      <View style={styles.compactInfo}>
        <View style={styles.compactHeader}>
          <Text style={styles.compactBusinessName} numberOfLines={1}>
            {ad.businessName}
          </Text>
          {ad.verified && (
            <Ionicons name="checkmark-circle" size={16} color={colors.accent[500]} />
          )}
        </View>
        <Text style={styles.compactTitle} numberOfLines={1}>
          {ad.title}
        </Text>
        <Text style={styles.compactDescription} numberOfLines={1}>
          {ad.description}
        </Text>
      </View>

      <View style={styles.compactCTA}>
        <View style={styles.adBadgeCompact}>
          <Text style={styles.adBadgeTextCompact}>Ad</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Grid View Styles
  gridCard: {
    width: GRID_CARD_WIDTH,
    marginBottom: 16,
    marginHorizontal: 6,
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: "#fbbf24", // Yellow border for ads
  },
  gridImage: {
    width: "100%",
    height: GRID_CARD_WIDTH,
    backgroundColor: colors.neutral[100],
  },
  placeholderImage: {
    alignItems: "center",
    justifyContent: "center",
  },
  adBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f59e0b",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  adBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "white",
    letterSpacing: 0.5,
  },
  verifiedBadgeGrid: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 2,
  },
  gridInfo: {
    padding: 14,
  },
  gridBusinessName: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.primary[600],
    marginBottom: 4,
  },
  gridTitle: {
    fontSize: 15,
    color: colors.text.primary,
    fontWeight: "600",
    lineHeight: 20,
    marginBottom: 4,
  },
  gridDescription: {
    fontSize: 13,
    color: colors.text.tertiary,
    fontWeight: "500",
    marginBottom: 10,
  },
  gridCTA: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background.secondary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  gridCTAText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary[600],
  },

  // Large Card View Styles
  largeCard: {
    backgroundColor: "white",
    borderRadius: 20,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 3,
    borderColor: "#fbbf24",
  },
  largeImage: {
    width: "100%",
    height: 280,
    backgroundColor: colors.neutral[100],
  },
  adBadgeLarge: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f59e0b",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  adBadgeTextLarge: {
    fontSize: 13,
    fontWeight: "700",
    color: "white",
    letterSpacing: 0.5,
  },
  largeInfo: {
    padding: 20,
  },
  largeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  businessRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  largeBusinessName: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.primary[600],
  },
  businessType: {
    fontSize: 13,
    color: colors.text.tertiary,
    fontWeight: "500",
    marginTop: 2,
  },
  largeTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 8,
    lineHeight: 28,
  },
  largeDescription: {
    fontSize: 15,
    color: colors.text.secondary,
    fontWeight: "500",
    lineHeight: 22,
    marginBottom: 16,
  },
  largeMeta: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: colors.text.tertiary,
    fontWeight: "600",
  },
  largeCTA: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary[600],
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  largeCTAText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },

  // Compact List View Styles
  compactCard: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: "#fbbf24",
  },
  compactImage: {
    width: 100,
    height: 100,
    backgroundColor: colors.neutral[100],
  },
  compactInfo: {
    flex: 1,
    padding: 14,
    justifyContent: "center",
  },
  compactHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 6,
  },
  compactBusinessName: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.primary[600],
  },
  compactTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 2,
  },
  compactDescription: {
    fontSize: 13,
    color: colors.text.tertiary,
    fontWeight: "500",
  },
  compactCTA: {
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  adBadgeCompact: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  adBadgeTextCompact: {
    fontSize: 10,
    fontWeight: "700",
    color: "#f59e0b",
    letterSpacing: 0.5,
  },
});
