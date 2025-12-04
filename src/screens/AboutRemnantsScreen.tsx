import React from "react";
import { View, Text, ScrollView, Pressable, Platform, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../utils/colors";
import { useNavigation } from "@react-navigation/native";

export default function AboutRemnantsScreen() {
  const navigation = useNavigation();

  const openSmartMeasurement = () => {
    navigation.navigate("SmartMeasurement" as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.headerSection}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={28} color={colors.text.primary} />
          </Pressable>

          <Text style={styles.mainTitle}>
            What is Remodely?
          </Text>
          
          <Text style={styles.subtitle}>
            The sustainable marketplace for stone remnants, powered by Surprise Granite
          </Text>

          {/* Hero Icon */}
          <View style={styles.heroContainer}>
            <Ionicons name="cube" size={72} color={colors.accent[500]} />
            <Text style={styles.heroText}>
              Perfect pieces, perfectly sized
            </Text>
          </View>
        </View>

        {/* The Problem */}
        <View style={styles.problemSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.problemIconContainer}>
              <Ionicons name="alert-circle" size={28} color={colors.accent[500]} />
            </View>
            <Text style={styles.sectionTitle}>
              The Problem
            </Text>
          </View>

          <Text style={styles.bodyText}>
            Stone fabricators and contractors have <Text style={styles.boldText}>thousands of remnants</Text> — leftover pieces from larger projects — sitting in warehouses across the country.
          </Text>

          <Text style={styles.bodyText}>
            Meanwhile, manufacturers only sell <Text style={styles.boldText}>full slabs</Text>, making it expensive and wasteful for small projects.
          </Text>

          <View style={styles.quoteBox}>
            <Text style={styles.quoteText}>
              "I only need 2 square feet for my bathroom vanity, but I have to buy a 25 square foot slab?"
            </Text>
          </View>
        </View>

        {/* The Solution */}
        <View style={styles.solutionSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.solutionIconContainer}>
              <Ionicons name="checkmark-circle" size={28} color={colors.primary[600]} />
            </View>
            <Text style={styles.sectionTitle}>
              The Solution
            </Text>
          </View>

          <Text style={styles.highlightText}>
            Remodely connects you with remodeling materials in your area.
          </Text>

          <Text style={styles.bodyText}>
            Find that perfect piece for your project — whether you are a contractor, homeowner, or designer looking for the ideal material to match or fit your space.
          </Text>

          {/* Features */}
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="location" size={24} color={colors.primary[600]} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>
                  Find Local Remnants
                </Text>
                <Text style={styles.featureDescription}>
                  Browse stone pieces available near you from fabricators and contractors
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="resize" size={24} color={colors.primary[600]} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>
                  Filter by Size
                </Text>
                <Text style={styles.featureDescription}>
                  Search by exact dimensions you need — no more buying oversized slabs
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="camera" size={24} color={colors.primary[600]} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>
                  Measure Your Space
                </Text>
                <Text style={styles.featureDescription}>
                  Use your phone's camera with measurement tools to find pieces that fit
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIconContainer, { backgroundColor: colors.success.light }]}>
                <Ionicons name="leaf" size={24} color={colors.success.main} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>
                  Sustainable & Affordable
                </Text>
                <Text style={styles.featureDescription}>
                  Recycle premium materials at fraction of the cost while reducing waste
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Who It's For */}
        <View style={styles.whoSection}>
          <Text style={styles.whoSectionTitle}>
            Perfect For
          </Text>

          <View style={styles.audienceList}>
            <View style={styles.audienceCard}>
              <Text style={styles.audienceEmoji}>🏠</Text>
              <Text style={styles.audienceTitle}>Homeowners</Text>
              <Text style={styles.audienceDescription}>
                Small projects like bathroom vanities, kitchen islands, or fireplace surrounds
              </Text>
            </View>

            <View style={styles.audienceCard}>
              <Text style={styles.audienceEmoji}>👷</Text>
              <Text style={styles.audienceTitle}>Contractors</Text>
              <Text style={styles.audienceDescription}>
                Source cost-effective materials for repairs, small jobs, or matching existing installations
              </Text>
            </View>

            <View style={styles.audienceCard}>
              <Text style={styles.audienceEmoji}>🎨</Text>
              <Text style={styles.audienceTitle}>Designers</Text>
              <Text style={styles.audienceDescription}>
                Discover unique pieces for accent walls, tabletops, or custom design elements
              </Text>
            </View>

            <View style={styles.audienceCard}>
              <Text style={styles.audienceEmoji}>♻️</Text>
              <Text style={styles.audienceTitle}>Fabricators</Text>
              <Text style={styles.audienceDescription}>
                Turn warehouse inventory into revenue while helping reduce industry waste
              </Text>
            </View>
          </View>
        </View>

        {/* How to Measure */}
        <View style={styles.measureSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.measureIconContainer}>
              <Ionicons name="resize" size={28} color={colors.primary[600]} />
            </View>
            <Text style={styles.sectionTitle}>
              How to Measure
            </Text>
          </View>

          {Platform.OS === "ios" && (
            <View style={styles.measureToolCard}>
              <View style={styles.measureToolHeader}>
                <Ionicons name="resize" size={24} color={colors.primary[600]} style={{ marginRight: 12 }} />
                <Text style={styles.measureToolTitle}>
                  Use Smart Measurement Tool
                </Text>
              </View>
              <Text style={styles.measureToolDescription}>
                Remodely has a built-in AR measurement tool perfect for measuring your space!
              </Text>
              <Pressable
                onPress={openSmartMeasurement}
                style={styles.measureToolButton}
              >
                <Text style={styles.measureToolButtonText}>
                  Open Smart Measurement Tool
                </Text>
              </Pressable>
            </View>
          )}

          <Text style={styles.stepsHeader}>
            Steps to Find Your Perfect Remnant:
          </Text>

          <View style={styles.stepsList}>
            {[
              { num: "1", text: "Measure your space (length, width, thickness needed)" },
              { num: "2", text: "Open Remodely and use dimension filters" },
              { num: "3", text: "Browse remnants that fit your requirements" },
              { num: "4", text: "Contact seller and arrange pickup or delivery" },
              { num: "5", text: "Save money and help reduce stone waste!" },
            ].map((step) => (
              <View key={step.num} style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>
                    {step.num}
                  </Text>
                </View>
                <Text style={styles.stepText}>
                  {step.text}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Call to Action */}
        <View style={styles.ctaSection}>
          <View style={styles.ctaCard}>
            <Ionicons name="leaf" size={48} color={colors.primary[600]} style={{ marginBottom: 16 }} />
            <Text style={styles.ctaTitle}>
              Start Finding Remnants Today
            </Text>
            <Text style={styles.ctaDescription}>
              Join the sustainable stone marketplace and find the perfect piece for your project
            </Text>
            <Pressable
              onPress={() => navigation.navigate("MainTabs" as never)}
              style={styles.ctaButton}
            >
              <Text style={styles.ctaButtonText}>
                Browse Remnants
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  headerSection: {
    padding: 24,
    paddingTop: 16,
  },
  closeButton: {
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: "700",
    color: colors.primary[600],
    letterSpacing: -1,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: colors.text.tertiary,
    lineHeight: 28,
    marginBottom: 32,
  },
  heroContainer: {
    backgroundColor: colors.accent[100],
    borderRadius: 16,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  heroText: {
    fontSize: 16,
    color: colors.text.tertiary,
    marginTop: 12,
    fontWeight: "500",
  },
  problemSection: {
    backgroundColor: colors.background.secondary,
    padding: 24,
    paddingVertical: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  problemIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent[100],
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  solutionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondary[100],
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  measureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondary[100],
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text.primary,
    flex: 1,
  },
  bodyText: {
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 26,
    marginBottom: 16,
  },
  boldText: {
    fontWeight: "700",
    color: colors.text.primary,
  },
  quoteBox: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent[500],
  },
  quoteText: {
    fontSize: 15,
    color: colors.text.tertiary,
    fontStyle: "italic",
    lineHeight: 24,
  },
  solutionSection: {
    padding: 24,
    paddingVertical: 32,
  },
  highlightText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary[600],
    lineHeight: 28,
    marginBottom: 16,
  },
  featuresList: {
    gap: 20,
    marginTop: 24,
  },
  featureItem: {
    flexDirection: "row",
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondary[100],
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 15,
    color: colors.text.tertiary,
    lineHeight: 22,
  },
  whoSection: {
    backgroundColor: colors.primary[600],
    padding: 24,
    paddingVertical: 40,
  },
  whoSectionTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 24,
    textAlign: "center",
  },
  audienceList: {
    gap: 16,
  },
  audienceCard: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 16,
    padding: 20,
  },
  audienceEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  audienceTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.accent[300],
    marginBottom: 8,
  },
  audienceDescription: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 22,
  },
  measureSection: {
    padding: 24,
    paddingVertical: 32,
  },
  measureToolCard: {
    backgroundColor: colors.secondary[100],
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  measureToolHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  measureToolTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.primary,
  },
  measureToolDescription: {
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  measureToolButton: {
    backgroundColor: colors.primary[600],
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  measureToolButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  stepsHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 16,
  },
  stepsList: {
    gap: 16,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[600],
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  stepText: {
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 24,
    flex: 1,
  },
  ctaSection: {
    padding: 24,
    paddingTop: 0,
    paddingBottom: 40,
  },
  ctaCard: {
    backgroundColor: colors.accent[100],
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text.primary,
    textAlign: "center",
    marginBottom: 12,
  },
  ctaDescription: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  ctaButton: {
    backgroundColor: colors.primary[600],
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
});
