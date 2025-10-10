import React, { useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../utils/colors";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";

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
  
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background.primary, colors.background.secondary]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            
            {/* Spacer */}
            <View style={{ flex: 1 }} />

            {/* Logo Section */}
            <View style={styles.brandContainer}>
              {/* Animated Blocks */}
              <View style={styles.blocksContainer}>
                <Animated.View style={[styles.block1, block1Style]} />
                <Animated.View style={[styles.block2, block2Style]} />
                <Animated.View style={[styles.block3, block3Style]} />
              </View>

              {/* Logo */}
              <Animated.View style={logoStyle}>
                <Text style={styles.logo}>SlabSnap</Text>
              </Animated.View>
              <Text style={styles.tagline}>Powered by Surprise Granite</Text>
              
              <Pressable 
                style={styles.learnMoreButton}
                onPress={() => navigation.navigate("AboutRemnants")}
              >
                <Ionicons name="information-circle-outline" size={18} color={colors.primary[600]} style={{ marginRight: 6 }} />
                <Text style={styles.learnMoreText}>What are remnants?</Text>
              </Pressable>
            </View>

            {/* Spacer */}
            <View style={{ flex: 1.5 }} />

            {/* CTA */}
            <Pressable
              style={styles.primaryButton}
              onPress={() => navigation.navigate("MainTabs")}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} />
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

            {/* Bottom spacer */}
            <View style={{ height: 40 }} />
          </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  brandContainer: {
    alignItems: 'center',
  },
  
  // Animated blocks container
  blocksContainer: {
    marginBottom: 30,
    width: 200,
    height: 140,
    position: 'relative',
  },
  
  // Three clean stone blocks
  block1: {
    position: 'absolute',
    top: 0,
    left: 10,
    width: 90,
    height: 55,
    backgroundColor: colors.accent[500],
    borderRadius: 12,
    borderWidth: 3,
    borderColor: colors.accent[600],
    shadowColor: colors.accent[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  block2: {
    position: 'absolute',
    top: 5,
    right: 0,
    width: 100,
    height: 75,
    backgroundColor: colors.accent[500],
    borderRadius: 12,
    borderWidth: 3,
    borderColor: colors.accent[600],
    shadowColor: colors.accent[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  block3: {
    position: 'absolute',
    bottom: 0,
    left: 30,
    width: 110,
    height: 50,
    backgroundColor: colors.accent[500],
    borderRadius: 12,
    borderWidth: 3,
    borderColor: colors.accent[600],
    shadowColor: colors.accent[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  // Logo with emojis
  logo: {
    fontSize: 56,
    fontWeight: '300',
    color: colors.primary[700],
    letterSpacing: -1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 17,
    color: colors.text.tertiary,
    fontWeight: '400',
    letterSpacing: 1,
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
  primaryButton: {
    backgroundColor: colors.primary[600],
    borderRadius: 14,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: {
    fontSize: 17,
    color: colors.text.tertiary,
    fontWeight: '400',
  },
  divider: {
    fontSize: 17,
    color: colors.neutral[300],
    marginHorizontal: 12,
  },
});
