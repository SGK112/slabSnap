import React, { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Animated, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../utils/colors";
import { Vendor } from "../types/vendors";
import * as Haptics from "expo-haptics";

interface VendorAdTooltipProps {
  vendor: Vendor;
  position?: "top" | "bottom";
  context?: string; // e.g., "Looking for granite in Phoenix?"
  onDismiss?: () => void;
  autoShow?: boolean;
}

export function VendorAdTooltip({
  vendor,
  position = "bottom",
  context,
  onDismiss,
  autoShow = true,
}: VendorAdTooltipProps) {
  const [visible, setVisible] = useState(autoShow);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(position === "top" ? -100 : 100));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: position === "top" ? -100 : 100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      onDismiss?.();
    });
  };

  const handleCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`tel:${vendor.contact.phone}`);
  };

  const handleVisit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (vendor.contact.website) {
      Linking.openURL(`https://${vendor.contact.website}`);
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        position === "top" ? styles.containerTop : styles.containerBottom,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* AR-style glow effect */}
      <View style={styles.glowEffect} />
      
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            {vendor.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color={colors.accent[500]} />
              </View>
            )}
            <Text style={styles.title} numberOfLines={1}>
              {vendor.name}
            </Text>
          </View>
          <Pressable onPress={handleDismiss} style={styles.dismissButton} hitSlop={8}>
            <Ionicons name="close" size={20} color={colors.text.tertiary} />
          </Pressable>
        </View>

        {/* Context Message */}
        {context && (
          <Text style={styles.context}>{context}</Text>
        )}

        {/* Info Row */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="star" size={14} color={colors.accent[500]} />
            <Text style={styles.infoText}>
              {vendor.rating} ({vendor.reviewCount})
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoItem}>
            <Ionicons name="location" size={14} color={colors.primary[600]} />
            <Text style={styles.infoText}>
              {vendor.location.city}
            </Text>
          </View>
          {vendor.specialties && vendor.specialties.length > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoItem}>
                <Ionicons name="hammer" size={14} color={colors.primary[600]} />
                <Text style={styles.infoText} numberOfLines={1}>
                  {vendor.specialties[0]}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Pressable
            style={[styles.actionButton, styles.callButton]}
            onPress={handleCall}
          >
            <Ionicons name="call" size={16} color="white" />
            <Text style={styles.callButtonText}>Call Now</Text>
          </Pressable>
          
          {vendor.contact.website && (
            <Pressable
              style={[styles.actionButton, styles.visitButton]}
              onPress={handleVisit}
            >
              <Ionicons name="globe-outline" size={16} color={colors.primary[600]} />
              <Text style={styles.visitButtonText}>Visit Site</Text>
            </Pressable>
          )}
        </View>

        {/* Sponsored Label */}
        <View style={styles.sponsoredLabel}>
          <Ionicons name="information-circle" size={12} color={colors.text.quaternary} />
          <Text style={styles.sponsoredText}>Sponsored • Pro Network Partner</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 1000,
    borderRadius: 16,
    backgroundColor: colors.background.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: "hidden",
  },
  containerTop: {
    top: 80,
  },
  containerBottom: {
    bottom: 100,
  },
  glowEffect: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.accent[500],
    shadowColor: colors.accent[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text.primary,
    flex: 1,
  },
  dismissButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background.tertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  context: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontWeight: "500",
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: colors.border.light,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  callButton: {
    backgroundColor: colors.primary[600],
  },
  callButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
  visitButton: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.main,
  },
  visitButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary[600],
  },
  sponsoredLabel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  sponsoredText: {
    fontSize: 10,
    color: colors.text.quaternary,
    fontWeight: "500",
  },
});
