import React, { useEffect } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../utils/colors";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from "react-native-reanimated";

// Expanded remodeling categories - Blue, Red, Yellow brand colors
const categories = [
  { id: 1, name: "Countertops", icon: "layers-outline" as const, color: colors.primary[600] },
  { id: 2, name: "Flooring", icon: "grid-outline" as const, color: colors.red[600] },
  { id: 3, name: "Cabinets", icon: "cube-outline" as const, color: colors.accent[500] },
  { id: 4, name: "Lighting", icon: "bulb-outline" as const, color: colors.primary[500] },
  { id: 5, name: "Appliances", icon: "thermometer-outline" as const, color: colors.red[500] },
  { id: 6, name: "Plumbing", icon: "water-outline" as const, color: colors.primary[700] },
];

// Sample preview products across categories
const previewListings = [
  {
    id: 1,
    name: "Calacatta Gold",
    size: "Quartz Slab",
    price: "$75/sqft",
    material: "Countertops",
    gradientColors: ['#e2e8f0', '#f7fafc', '#edf2f7'] as const,
  },
  {
    id: 2,
    name: "Shaker Cabinet",
    size: "36\" Base",
    price: "$519",
    material: "Kitchen",
    gradientColors: ['#fef3c7', '#fde68a', '#fcd34d'] as const,
  },
  {
    id: 3,
    name: "Honey Oak LVP",
    size: "Luxury Vinyl",
    price: "$3.79/sqft",
    material: "Flooring",
    gradientColors: ['#d4a574', '#c4a77d', '#b8956f'] as const,
  },
  {
    id: 4,
    name: "Island Pendant",
    size: "3-Light",
    price: "$311",
    material: "Lighting",
    gradientColors: ['#718096', '#a0aec0', '#cbd5e0'] as const,
  },
];

// User type cards
const userTypes = [
  {
    id: 1,
    title: "Homeowners",
    desc: "Plan & budget your remodel",
    icon: "home-outline" as const
  },
  {
    id: 2,
    title: "Contractors",
    desc: "Quote, source & manage",
    icon: "construct-outline" as const
  },
  {
    id: 3,
    title: "Vendors",
    desc: "Sell your products",
    icon: "storefront-outline" as const
  },
];

export default function LandingScreen({ navigation }: any) {

  // Logo animation
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);

  // Icon animation
  const iconRotate = useSharedValue(0);
  const iconScale = useSharedValue(0.5);

  // Categories animation
  const categoriesOpacity = useSharedValue(0);
  const categoriesTranslateY = useSharedValue(30);

  // Preview animation
  const previewOpacity = useSharedValue(0);
  const previewTranslateY = useSharedValue(30);

  useEffect(() => {
    // Icon entrance with rotation
    iconScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    iconRotate.value = withSpring(360, { damping: 15, stiffness: 80 });

    // Logo entrance
    setTimeout(() => {
      logoOpacity.value = withTiming(1, { duration: 600 });
      logoScale.value = withSpring(1, { damping: 10, stiffness: 100 });
    }, 300);

    // Categories fade in
    setTimeout(() => {
      categoriesOpacity.value = withTiming(1, { duration: 600 });
      categoriesTranslateY.value = withSpring(0, { damping: 15, stiffness: 80 });
    }, 600);

    // Preview fade in
    setTimeout(() => {
      previewOpacity.value = withTiming(1, { duration: 600 });
      previewTranslateY.value = withSpring(0, { damping: 15, stiffness: 80 });
    }, 900);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotate.value}deg` },
    ],
  }));

  const categoriesStyle = useAnimatedStyle(() => ({
    opacity: categoriesOpacity.value,
    transform: [{ translateY: categoriesTranslateY.value }],
  }));

  const previewStyle = useAnimatedStyle(() => ({
    opacity: previewOpacity.value,
    transform: [{ translateY: previewTranslateY.value }],
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#ffffff', colors.primary[50]]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Logo Section */}
            <View style={styles.brandContainer}>
              {/* Animated Logo Icon */}
              <Animated.View style={[styles.logoIconContainer, iconStyle]}>
                <LinearGradient
                  colors={[colors.primary[600], colors.primary[700]]}
                  style={styles.logoIconGradient}
                >
                  <Ionicons name="home" size={44} color="#ffffff" />
                </LinearGradient>
              </Animated.View>

              {/* Logo Text */}
              <Animated.View style={[logoStyle, styles.logoContainer]}>
                <Text style={styles.logoMain}>REMODELY</Text>
                <Text style={styles.logoAi}>.AI</Text>
              </Animated.View>
              <Text style={styles.tagline}>Your AI-Powered Remodeling Platform</Text>
              <Text style={styles.subTagline}>Plan. Source. Build.</Text>
              <View style={styles.taglineDivider} />
            </View>

            {/* Who Is This For Section */}
            <Animated.View style={[styles.userTypesSection, categoriesStyle]}>
              <Text style={styles.sectionTitle}>Built For Everyone</Text>
              <View style={styles.userTypesRow}>
                {userTypes.map((type) => (
                  <Pressable
                    key={type.id}
                    style={styles.userTypeCard}
                    onPress={() => navigation.navigate("MainTabs")}
                  >
                    <View style={styles.userTypeIconContainer}>
                      <Ionicons
                        name={type.icon}
                        size={24}
                        color={colors.primary[600]}
                      />
                    </View>
                    <Text style={styles.userTypeTitle}>{type.title}</Text>
                    <Text style={styles.userTypeDesc}>{type.desc}</Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>

            {/* Categories Section */}
            <Animated.View style={[styles.categoriesSection, categoriesStyle]}>
              <Text style={styles.sectionTitle}>Browse Categories</Text>
              <View style={styles.categoriesGrid}>
                {categories.map((category) => (
                  <Pressable
                    key={category.id}
                    style={styles.categoryCard}
                    onPress={() => navigation.navigate("MainTabs")}
                  >
                    <View style={[styles.categoryIconContainer, { backgroundColor: category.color + '15' }]}>
                      <Ionicons
                        name={category.icon}
                        size={24}
                        color={category.color}
                      />
                    </View>
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>

            {/* Preview Listings Section */}
            <Animated.View style={[styles.previewSection, previewStyle]}>
              <View style={styles.previewHeader}>
                <Text style={styles.sectionTitle}>Featured Products</Text>
                <Pressable onPress={() => navigation.navigate("MainTabs")}>
                  <Text style={styles.seeAllText}>See All</Text>
                </Pressable>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.previewScroll}
              >
                {previewListings.map((listing) => (
                  <Pressable
                    key={listing.id}
                    style={styles.previewCard}
                    onPress={() => navigation.navigate("MainTabs")}
                  >
                    <LinearGradient
                      colors={listing.gradientColors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.previewImageGradient}
                    >
                      <View style={styles.stoneTextureOverlay}>
                        <View style={styles.stoneVein1} />
                        <View style={styles.stoneVein2} />
                      </View>
                      <View style={styles.materialBadge}>
                        <Text style={styles.materialBadgeText}>{listing.material}</Text>
                      </View>
                    </LinearGradient>
                    <View style={styles.previewCardContent}>
                      <Text style={styles.previewName}>{listing.name}</Text>
                      <Text style={styles.previewSize}>{listing.size}</Text>
                      <Text style={styles.previewPrice}>{listing.price}</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </Animated.View>

            {/* Features Section - Brand colors Blue, Red, Yellow */}
            <View style={styles.featuresSection}>
              <View style={styles.featureItem}>
                <Ionicons name="sparkles-outline" size={22} color={colors.primary[600]} />
                <Text style={styles.featureText}>AI-Powered Tools</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="calculator-outline" size={22} color={colors.red[600]} />
                <Text style={styles.featureText}>Instant Quotes</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="storefront-outline" size={22} color={colors.accent[500]} />
                <Text style={styles.featureText}>Local Vendors</Text>
              </View>
            </View>

            {/* Platform Highlights */}
            <View style={styles.highlightsSection}>
              <View style={styles.highlightItem}>
                <View style={styles.highlightIconContainer}>
                  <Ionicons name="clipboard-outline" size={24} color={colors.primary[600]} />
                </View>
                <View style={styles.highlightContent}>
                  <Text style={styles.highlightTitle}>Project Planning</Text>
                  <Text style={styles.highlightDesc}>Budget calculator, Quick Quote, and AI estimator</Text>
                </View>
              </View>
              <View style={styles.highlightItem}>
                <View style={styles.highlightIconContainer}>
                  <Ionicons name="cube-outline" size={24} color={colors.red[600]} />
                </View>
                <View style={styles.highlightContent}>
                  <Text style={styles.highlightTitle}>Material Catalog</Text>
                  <Text style={styles.highlightDesc}>Kitchen, bath, flooring, lighting from local vendors</Text>
                </View>
              </View>
              <View style={styles.highlightItem}>
                <View style={styles.highlightIconContainer}>
                  <Ionicons name="people-outline" size={24} color={colors.accent[500]} />
                </View>
                <View style={styles.highlightContent}>
                  <Text style={styles.highlightTitle}>Pro Network</Text>
                  <Text style={styles.highlightDesc}>Connect with contractors, designers, and installers</Text>
                </View>
              </View>
            </View>

            {/* CTA Button */}
            <Pressable
              style={styles.primaryButton}
              onPress={() => navigation.navigate("MainTabs")}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 8 }} />
            </Pressable>

            <View style={styles.linkRow}>
              <Pressable onPress={() => navigation.navigate("Login")}>
                <Text style={styles.linkText}>Log in</Text>
              </Pressable>
              <Text style={styles.divider}>|</Text>
              <Pressable onPress={() => navigation.navigate("Signup")}>
                <Text style={styles.linkText}>Sign up</Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.learnMoreButton}
              onPress={() => navigation.navigate("AboutRemnants")}
            >
              <Ionicons name="information-circle-outline" size={18} color={colors.primary[600]} style={{ marginRight: 6 }} />
              <Text style={styles.learnMoreText}>Learn More About REMODELY</Text>
            </Pressable>

            {/* Bottom spacer */}
            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },

  // Logo icon container
  logoIconContainer: {
    marginBottom: 16,
  },
  logoIconGradient: {
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary[800],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },

  // Logo styling
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoMain: {
    fontSize: 36,
    fontWeight: '300',
    color: colors.neutral[800],
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  logoAi: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary[600],
  },
  tagline: {
    fontSize: 16,
    color: colors.neutral[600],
    fontWeight: '500',
    letterSpacing: 0.3,
    marginTop: 12,
    textAlign: 'center',
  },
  subTagline: {
    fontSize: 14,
    color: colors.neutral[400],
    fontWeight: '400',
    marginTop: 4,
    letterSpacing: 1,
  },
  taglineDivider: {
    width: 40,
    height: 2,
    backgroundColor: colors.neutral[300],
    borderRadius: 1,
    marginTop: 14,
  },

  // User types section
  userTypesSection: {
    marginBottom: 24,
  },
  userTypesRow: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  userTypeCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: colors.neutral[800],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  userTypeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  userTypeTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[800],
    textAlign: 'center',
  },
  userTypeDesc: {
    fontSize: 9,
    color: colors.neutral[500],
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 12,
  },

  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  learnMoreText: {
    fontSize: 16,
    color: colors.primary[600],
    fontWeight: '500',
  },
  // CTA button - vibrant red for action
  primaryButton: {
    backgroundColor: colors.red[600],
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    shadowColor: colors.red[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: {
    fontSize: 17,
    color: colors.primary[600],
    fontWeight: '500',
  },
  divider: {
    fontSize: 17,
    color: colors.neutral[300],
    marginHorizontal: 12,
  },

  // Categories Section
  categoriesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: 14,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '31%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: colors.neutral[800],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.neutral[700],
    textAlign: 'center',
  },

  // Preview Section
  previewSection: {
    marginBottom: 24,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary[600],
  },
  previewScroll: {
    paddingRight: 24,
  },
  previewCard: {
    width: 150,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    shadowColor: colors.neutral[800],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  previewImageGradient: {
    height: 100,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  stoneTextureOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  stoneVein1: {
    position: 'absolute',
    top: 20,
    left: -10,
    width: 180,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    transform: [{ rotate: '25deg' }],
  },
  stoneVein2: {
    position: 'absolute',
    bottom: 30,
    right: -20,
    width: 150,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    transform: [{ rotate: '-15deg' }],
  },
  materialBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  materialBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewCardContent: {
    padding: 12,
  },
  previewName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: 2,
  },
  previewSize: {
    fontSize: 11,
    color: colors.neutral[500],
    marginBottom: 4,
  },
  previewPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary[700],
  },

  // Features Section
  featuresSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.neutral[600],
    marginTop: 6,
    textAlign: 'center',
  },

  // Highlights Section
  highlightsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: colors.neutral[800],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  highlightIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.neutral[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  highlightContent: {
    flex: 1,
  },
  highlightTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: 2,
  },
  highlightDesc: {
    fontSize: 13,
    color: colors.neutral[500],
  },
});
