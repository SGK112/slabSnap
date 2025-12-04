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

// Remodeling categories data with Ionicons
const categories = [
  { id: 1, name: "Countertops", icon: "layers-outline" as const, color: colors.primary[500] },
  { id: 2, name: "Flooring", icon: "grid-outline" as const, color: colors.accent[500] },
  { id: 3, name: "Cabinets", icon: "cube-outline" as const, color: colors.secondary[500] },
  { id: 4, name: "Tile", icon: "apps-outline" as const, color: colors.primary[600] },
];

// Sample preview listings with gradient colors for stone simulation
const previewListings = [
  {
    id: 1,
    name: "Granite Remnant",
    size: '24" x 36"',
    price: "$85",
    material: "Granite",
    gradientColors: ['#2c3e50', '#4a5568', '#2d3748'] as const,
  },
  {
    id: 2,
    name: "Marble Piece",
    size: '18" x 24"',
    price: "$120",
    material: "Marble",
    gradientColors: ['#e2e8f0', '#f7fafc', '#edf2f7'] as const,
  },
  {
    id: 3,
    name: "Quartz Slab",
    size: '30" x 48"',
    price: "$150",
    material: "Quartz",
    gradientColors: ['#d4a574', '#c4a77d', '#b8956f'] as const,
  },
  {
    id: 4,
    name: "Quartzite",
    size: '22" x 30"',
    price: "$95",
    material: "Quartzite",
    gradientColors: ['#718096', '#a0aec0', '#718096'] as const,
  },
];

export default function LandingScreen({ navigation }: any) {

  // Animate remnant blocks
  const block1Opacity = useSharedValue(0);
  const block1TranslateX = useSharedValue(-100);

  const block2Opacity = useSharedValue(0);
  const block2TranslateX = useSharedValue(100);

  const block3Opacity = useSharedValue(0);
  const block3TranslateY = useSharedValue(100);

  // Logo animation
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);

  // Categories animation
  const categoriesOpacity = useSharedValue(0);
  const categoriesTranslateY = useSharedValue(30);

  // Preview animation
  const previewOpacity = useSharedValue(0);
  const previewTranslateY = useSharedValue(30);

  useEffect(() => {
    // Logo entrance
    logoOpacity.value = withTiming(1, { duration: 800 });
    logoScale.value = withSpring(1, {
      damping: 10,
      stiffness: 100,
    });

    // Block 1: Slide from left
    setTimeout(() => {
      block1Opacity.value = withTiming(1, { duration: 500 });
      block1TranslateX.value = withSpring(0, { damping: 12, stiffness: 90 });
    }, 300);

    // Block 2: Slide from right
    setTimeout(() => {
      block2Opacity.value = withTiming(1, { duration: 500 });
      block2TranslateX.value = withSpring(0, { damping: 12, stiffness: 90 });
    }, 500);

    // Block 3: Slide from bottom
    setTimeout(() => {
      block3Opacity.value = withTiming(1, { duration: 500 });
      block3TranslateY.value = withSpring(0, { damping: 12, stiffness: 90 });
    }, 700);

    // Categories fade in
    setTimeout(() => {
      categoriesOpacity.value = withTiming(1, { duration: 600 });
      categoriesTranslateY.value = withSpring(0, { damping: 15, stiffness: 80 });
    }, 900);

    // Preview fade in
    setTimeout(() => {
      previewOpacity.value = withTiming(1, { duration: 600 });
      previewTranslateY.value = withSpring(0, { damping: 15, stiffness: 80 });
    }, 1100);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const block1Style = useAnimatedStyle(() => ({
    opacity: block1Opacity.value,
    transform: [{ translateX: block1TranslateX.value }],
  }));

  const block2Style = useAnimatedStyle(() => ({
    opacity: block2Opacity.value,
    transform: [{ translateX: block2TranslateX.value }],
  }));

  const block3Style = useAnimatedStyle(() => ({
    opacity: block3Opacity.value,
    transform: [{ translateY: block3TranslateY.value }],
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
              {/* Animated Blocks - Blue and Yellow theme */}
              <View style={styles.blocksContainer}>
                <Animated.View style={[styles.block1, block1Style]} />
                <Animated.View style={[styles.block2, block2Style]} />
                <Animated.View style={[styles.block3, block3Style]} />
              </View>

              {/* Logo */}
              <Animated.View style={[logoStyle, styles.logoContainer]}>
                <View style={styles.logoRow}>
                  <Text style={styles.logoMain}>REMODELY</Text>
                  <View style={styles.aiPill}>
                    <Text style={styles.aiText}>.AI</Text>
                  </View>
                </View>
              </Animated.View>
              <Text style={styles.tagline}>Your Local Remodeling Marketplace</Text>
              <View style={styles.taglineDivider} />
            </View>

            {/* Categories Section */}
            <Animated.View style={[styles.categoriesSection, categoriesStyle]}>
              <Text style={styles.sectionTitle}>Browse by Category</Text>
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
                        size={26}
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
                <Text style={styles.sectionTitle}>Featured Materials</Text>
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

            {/* Features Section */}
            <View style={styles.featuresSection}>
              <View style={styles.featureItem}>
                <Ionicons name="location-outline" size={22} color={colors.primary[600]} />
                <Text style={styles.featureText}>Find local materials</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="cash-outline" size={22} color={colors.primary[600]} />
                <Text style={styles.featureText}>Save up to 70%</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="leaf-outline" size={22} color={colors.primary[600]} />
                <Text style={styles.featureText}>Eco-friendly choice</Text>
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
              <Text style={styles.divider}>•</Text>
              <Pressable onPress={() => navigation.navigate("Signup")}>
                <Text style={styles.linkText}>Sign up</Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.learnMoreButton}
              onPress={() => navigation.navigate("AboutRemnants")}
            >
              <Ionicons name="information-circle-outline" size={18} color={colors.primary[600]} style={{ marginRight: 6 }} />
              <Text style={styles.learnMoreText}>Learn More</Text>
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

  // Animated blocks container
  blocksContainer: {
    marginBottom: 30,
    width: 200,
    height: 140,
    position: 'relative',
  },

  // Blue block
  block1: {
    position: 'absolute',
    top: 0,
    left: 10,
    width: 90,
    height: 55,
    backgroundColor: colors.primary[500],
    borderRadius: 12,
    borderWidth: 3,
    borderColor: colors.primary[600],
    shadowColor: colors.primary[700],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  // Darker blue block
  block2: {
    position: 'absolute',
    top: 5,
    right: 0,
    width: 100,
    height: 75,
    backgroundColor: colors.primary[600],
    borderRadius: 12,
    borderWidth: 3,
    borderColor: colors.primary[700],
    shadowColor: colors.primary[800],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  // Yellow/Gold accent block
  block3: {
    position: 'absolute',
    bottom: 0,
    left: 30,
    width: 110,
    height: 50,
    backgroundColor: colors.accent[400],
    borderRadius: 12,
    borderWidth: 3,
    borderColor: colors.accent[500],
    shadowColor: colors.accent[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  // Logo styling
  logoContainer: {
    alignItems: 'center',
  },
  logoRow: {
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
  aiPill: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 4,
  },
  aiText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 15,
    color: colors.neutral[500],
    fontWeight: '400',
    letterSpacing: 0.5,
    marginTop: 14,
    textAlign: 'center',
  },
  taglineDivider: {
    width: 40,
    height: 2,
    backgroundColor: colors.neutral[300],
    borderRadius: 1,
    marginTop: 14,
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  learnMoreText: {
    fontSize: 16,
    color: colors.primary[600],
    fontWeight: '500',
  },
  // CTA button - muted blue
  primaryButton: {
    backgroundColor: colors.primary[600],
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    shadowColor: colors.primary[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
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
    color: colors.neutral[400],
    marginHorizontal: 12,
  },

  // Categories Section
  categoriesSection: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: colors.neutral[800],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutral[700],
  },

  // Preview Section
  previewSection: {
    marginBottom: 28,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    width: 160,
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
    height: 110,
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
    marginBottom: 4,
  },
  previewSize: {
    fontSize: 12,
    color: colors.neutral[500],
    marginBottom: 6,
  },
  previewPrice: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary[700],
  },

  // Features Section
  featuresSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.neutral[600],
    marginTop: 6,
    textAlign: 'center',
  },
});
