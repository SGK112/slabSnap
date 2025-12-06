import React from "react";
import { View, Text, ScrollView, Pressable, Platform, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../utils/colors";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

export default function AboutRemnantsScreen() {
  const navigation = useNavigation();

  const openSmartMeasurement = () => {
    navigation.navigate("SmartMeasurement" as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={28} color={colors.text.primary} />
          </Pressable>

          <View style={styles.logoRow}>
            <Text style={styles.mainTitle}>REMODELY</Text>
            <Text style={styles.aiText}>.AI</Text>
          </View>

          <Text style={styles.subtitle}>
            The AI-powered platform connecting homeowners, contractors, and vendors for smarter remodeling
          </Text>

          {/* Hero Icon */}
          <LinearGradient
            colors={[colors.primary[600], colors.primary[700]]}
            style={styles.heroContainer}
          >
            <Ionicons name="home" size={56} color="#ffffff" />
            <Text style={styles.heroText}>
              Plan. Source. Build.
            </Text>
          </LinearGradient>
        </View>

        {/* Who It's For - First */}
        <View style={styles.whoSection}>
          <Text style={styles.whoSectionTitle}>
            Built For Everyone
          </Text>

          <View style={styles.audienceList}>
            <View style={styles.audienceCard}>
              <View style={styles.audienceIconRow}>
                <Ionicons name="home-outline" size={28} color={colors.accent[300]} />
              </View>
              <Text style={styles.audienceTitle}>Homeowners</Text>
              <Text style={styles.audienceDescription}>
                Plan your remodel with AI-powered budget calculators, get instant quotes, find local contractors, and browse materials all in one place.
              </Text>
            </View>

            <View style={styles.audienceCard}>
              <View style={styles.audienceIconRow}>
                <Ionicons name="construct-outline" size={28} color={colors.accent[300]} />
              </View>
              <Text style={styles.audienceTitle}>Contractors & Fabricators</Text>
              <Text style={styles.audienceDescription}>
                Generate professional quotes in minutes, source materials at pro pricing, manage project boards, and grow your business with the Pro Network.
              </Text>
            </View>

            <View style={styles.audienceCard}>
              <View style={styles.audienceIconRow}>
                <Ionicons name="storefront-outline" size={28} color={colors.accent[300]} />
              </View>
              <Text style={styles.audienceTitle}>Vendors & Suppliers</Text>
              <Text style={styles.audienceDescription}>
                List your products in the marketplace, reach contractors and homeowners directly, manage your catalog, and generate qualified leads.
              </Text>
            </View>

            <View style={styles.audienceCard}>
              <View style={styles.audienceIconRow}>
                <Ionicons name="color-palette-outline" size={28} color={colors.accent[300]} />
              </View>
              <Text style={styles.audienceTitle}>Designers & Installers</Text>
              <Text style={styles.audienceDescription}>
                Access premium materials, collaborate with vendors, create stunning visualizations, and streamline your client workflow.
              </Text>
            </View>
          </View>
        </View>

        {/* Platform Features */}
        <View style={styles.solutionSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.solutionIconContainer}>
              <Ionicons name="sparkles" size={28} color={colors.primary[600]} />
            </View>
            <Text style={styles.sectionTitle}>
              Platform Features
            </Text>
          </View>

          <Text style={styles.highlightText}>
            Everything you need to plan, source, and complete your remodeling project.
          </Text>

          {/* Features */}
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="calculator" size={24} color={colors.primary[600]} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>
                  Budget Calculator
                </Text>
                <Text style={styles.featureDescription}>
                  Plan your kitchen or bath remodel with our AI-powered cost estimator that factors in materials, labor, and local pricing.
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="document-text" size={24} color={colors.primary[600]} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>
                  Quick Quote
                </Text>
                <Text style={styles.featureDescription}>
                  Generate professional countertop quotes in minutes with edge profiles, cutouts, and installation options.
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="cube" size={24} color={colors.red[600]} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>
                  Material Catalog
                </Text>
                <Text style={styles.featureDescription}>
                  Browse countertops, cabinets, flooring, lighting, appliances, and more from local vendors with pro pricing.
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="storefront" size={24} color={colors.red[600]} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>
                  Vendor Portal
                </Text>
                <Text style={styles.featureDescription}>
                  Vendors can list products, set pro pricing, manage inventory, and connect directly with contractors.
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="clipboard" size={24} color={colors.accent[500]} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>
                  Project Board
                </Text>
                <Text style={styles.featureDescription}>
                  Track your remodel from start to finish with visual boards for planning, materials, and progress.
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.featureIconContainer, { backgroundColor: colors.success.light }]}>
                <Ionicons name="people" size={24} color={colors.success.main} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>
                  Pro Network
                </Text>
                <Text style={styles.featureDescription}>
                  Connect homeowners with vetted contractors, designers, and installers in your local area.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Material Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.categoriesSectionTitle}>
            Material Categories
          </Text>
          <Text style={styles.categoriesSubtitle}>
            Source everything for your remodel from local vendors
          </Text>

          <View style={styles.categoriesGrid}>
            {[
              { icon: "layers-outline", name: "Countertops", desc: "Granite, Quartz, Marble" },
              { icon: "cube-outline", name: "Cabinets", desc: "Kitchen & Bath" },
              { icon: "grid-outline", name: "Flooring", desc: "Hardwood, LVP, Tile" },
              { icon: "bulb-outline", name: "Lighting", desc: "Pendants, Chandeliers" },
              { icon: "water-outline", name: "Plumbing", desc: "Sinks, Faucets, Fixtures" },
              { icon: "thermometer-outline", name: "Appliances", desc: "Ranges, Refrigerators" },
            ].map((cat, idx) => (
              <View key={idx} style={styles.categoryCard}>
                <Ionicons name={cat.icon as any} size={28} color={colors.primary[600]} />
                <Text style={styles.categoryName}>{cat.name}</Text>
                <Text style={styles.categoryDesc}>{cat.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.measureSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.measureIconContainer}>
              <Ionicons name="rocket" size={28} color={colors.primary[600]} />
            </View>
            <Text style={styles.sectionTitle}>
              How It Works
            </Text>
          </View>

          <View style={styles.stepsList}>
            {[
              { num: "1", title: "Create Your Account", text: "Sign up as a homeowner, contractor, or vendor to unlock role-specific features" },
              { num: "2", title: "Plan Your Project", text: "Use Budget Calculator or Quick Quote to estimate costs and scope" },
              { num: "3", title: "Browse Materials", text: "Explore countertops, cabinets, flooring, and more from local vendors" },
              { num: "4", title: "Connect with Pros", text: "Find contractors, compare quotes, and track your project" },
              { num: "5", title: "Complete Your Remodel", text: "Manage everything from materials to installation in one place" },
            ].map((step) => (
              <View key={step.num} style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>
                    {step.num}
                  </Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>
                    {step.title}
                  </Text>
                  <Text style={styles.stepText}>
                    {step.text}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Smart Measurement Tool */}
        {Platform.OS === "ios" && (
          <View style={styles.measureToolSection}>
            <View style={styles.measureToolCard}>
              <View style={styles.measureToolHeader}>
                <Ionicons name="resize" size={24} color={colors.primary[600]} style={{ marginRight: 12 }} />
                <Text style={styles.measureToolTitle}>
                  Smart Measurement Tool
                </Text>
              </View>
              <Text style={styles.measureToolDescription}>
                Use your iPhone's AR capabilities to measure your space instantly. Perfect for planning countertops, flooring, and more.
              </Text>
              <Pressable
                onPress={openSmartMeasurement}
                style={styles.measureToolButton}
              >
                <Text style={styles.measureToolButtonText}>
                  Open Measurement Tool
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* The Problem We Solve */}
        <View style={styles.problemSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.problemIconContainer}>
              <Ionicons name="help-circle" size={28} color={colors.accent[500]} />
            </View>
            <Text style={styles.sectionTitle}>
              Why REMODELY?
            </Text>
          </View>

          <Text style={styles.bodyText}>
            Remodeling is <Text style={styles.boldText}>fragmented and frustrating</Text>. Homeowners don't know where to start. Contractors waste time on quotes. Vendors struggle to reach customers.
          </Text>

          <View style={styles.quoteBox}>
            <Text style={styles.quoteText}>
              "I spent weeks getting quotes, comparing materials from different stores, and trying to figure out my budget. REMODELY put it all in one place."
            </Text>
            <Text style={styles.quoteAuthor}>— Sarah M., Homeowner</Text>
          </View>

          <Text style={styles.bodyText}>
            REMODELY brings <Text style={styles.boldText}>everything together</Text> — planning tools, material sourcing, vendor connections, and project management — so you can remodel smarter.
          </Text>
        </View>

        {/* Call to Action */}
        <View style={styles.ctaSection}>
          <LinearGradient
            colors={[colors.primary[600], colors.primary[700]]}
            style={styles.ctaCard}
          >
            <Ionicons name="home" size={48} color="#ffffff" style={{ marginBottom: 16 }} />
            <Text style={styles.ctaTitle}>
              Start Your Remodel Today
            </Text>
            <Text style={styles.ctaDescription}>
              Join thousands of homeowners, contractors, and vendors using REMODELY to transform spaces.
            </Text>
            <Pressable
              onPress={() => navigation.navigate("MainTabs" as never)}
              style={styles.ctaButton}
            >
              <Text style={styles.ctaButtonText}>
                Get Started Free
              </Text>
            </Pressable>
          </LinearGradient>
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
  logoRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 12,
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: "300",
    color: colors.neutral[800],
    letterSpacing: 2,
  },
  aiText: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.primary[600],
  },
  subtitle: {
    fontSize: 17,
    color: colors.text.tertiary,
    lineHeight: 26,
    marginBottom: 24,
  },
  heroContainer: {
    borderRadius: 20,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
  },
  heroText: {
    fontSize: 18,
    color: "#ffffff",
    marginTop: 12,
    fontWeight: "600",
    letterSpacing: 1,
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
    borderLeftColor: colors.primary[600],
    marginBottom: 16,
  },
  quoteText: {
    fontSize: 15,
    color: colors.text.tertiary,
    fontStyle: "italic",
    lineHeight: 24,
  },
  quoteAuthor: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: "600",
    marginTop: 12,
  },
  solutionSection: {
    padding: 24,
    paddingVertical: 32,
  },
  highlightText: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.primary[600],
    lineHeight: 26,
    marginBottom: 16,
  },
  featuresList: {
    gap: 20,
    marginTop: 16,
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
    fontSize: 14,
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
  audienceIconRow: {
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
  categoriesSection: {
    backgroundColor: colors.background.secondary,
    padding: 24,
    paddingVertical: 32,
  },
  categoriesSectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: "center",
  },
  categoriesSubtitle: {
    fontSize: 15,
    color: colors.text.tertiary,
    marginBottom: 24,
    textAlign: "center",
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  categoryCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  categoryName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text.primary,
    marginTop: 10,
    marginBottom: 4,
  },
  categoryDesc: {
    fontSize: 12,
    color: colors.text.tertiary,
    textAlign: "center",
  },
  measureSection: {
    padding: 24,
    paddingVertical: 32,
  },
  measureToolSection: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  measureToolCard: {
    backgroundColor: colors.secondary[100],
    borderRadius: 16,
    padding: 20,
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
  stepsList: {
    gap: 20,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[600],
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 4,
  },
  stepText: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  ctaSection: {
    padding: 24,
    paddingBottom: 40,
  },
  ctaCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 12,
  },
  ctaDescription: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  ctaButton: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.primary[600],
  },
});
