import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../utils/colors";
import { useNativeAdsStore, AD_CREDIT_PACKAGES, AdCreditPackage } from "../state/nativeAdsStore";
import * as Haptics from "expo-haptics";

export default function PurchaseAdCreditsScreen() {
  const navigation = useNavigation();
  const { credits, purchaseCredits } = useNativeAdsStore();
  const [selectedPackage, setSelectedPackage] = useState<AdCreditPackage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectPackage = (pkg: AdCreditPackage) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPackage(pkg);
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Simulate Stripe payment processing
      // In production, integrate with Stripe SDK
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Add credits to account
      purchaseCredits(selectedPackage.id);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        "Purchase Successful!",
        `${selectedPackage.credits + (selectedPackage.bonus || 0)} ad credits have been added to your account.`,
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Purchase Failed", "Please try again or contact support.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Buy Ad Credits</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>{credits.available}</Text>
          <Text style={styles.balanceSubtext}>ad credits available</Text>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="megaphone" size={20} color={colors.primary[600]} />
            <Text style={styles.infoText}>Reach thousands of local customers</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="trending-up" size={20} color={colors.primary[600]} />
            <Text style={styles.infoText}>Boost visibility for your business</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary[600]} />
            <Text style={styles.infoText}>Credits never expire</Text>
          </View>
        </View>

        {/* Credit Packages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Your Package</Text>

          {AD_CREDIT_PACKAGES.map((pkg) => {
            const totalCredits = pkg.credits + (pkg.bonus || 0);
            const pricePerCredit = (pkg.price / totalCredits).toFixed(2);
            const savings = pkg.bonus
              ? Math.round((pkg.bonus / pkg.credits) * 100)
              : 0;

            return (
              <Pressable
                key={pkg.id}
                style={[
                  styles.packageCard,
                  selectedPackage?.id === pkg.id && styles.packageCardSelected,
                  pkg.popular && styles.packageCardPopular,
                ]}
                onPress={() => handleSelectPackage(pkg)}
              >
                {pkg.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>MOST POPULAR</Text>
                  </View>
                )}

                <View style={styles.packageHeader}>
                  <View style={styles.packageInfo}>
                    <Text style={styles.packageName}>{pkg.name}</Text>
                    <Text style={styles.packageCredits}>
                      {pkg.credits.toLocaleString()} credits
                    </Text>
                    {pkg.bonus && (
                      <View style={styles.bonusBadge}>
                        <Text style={styles.bonusText}>+{pkg.bonus} BONUS</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.packagePricing}>
                    <Text style={styles.packagePrice}>${pkg.price.toFixed(2)}</Text>
                    <Text style={styles.packagePricePerCredit}>${pricePerCredit}/credit</Text>
                  </View>
                </View>

                <View style={styles.packageFeatures}>
                  <View style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success.main} />
                    <Text style={styles.featureText}>
                      Total: {totalCredits.toLocaleString()} credits
                    </Text>
                  </View>
                  {savings > 0 && (
                    <View style={styles.featureRow}>
                      <Ionicons name="pricetag" size={16} color={colors.success.main} />
                      <Text style={styles.featureText}>Save {savings}% with bonus</Text>
                    </View>
                  )}
                  <View style={styles.featureRow}>
                    <Ionicons name="infinite" size={16} color={colors.success.main} />
                    <Text style={styles.featureText}>Never expires</Text>
                  </View>
                </View>

                {selectedPackage?.id === pkg.id && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary[600]} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* How It Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          
          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Purchase Credits</Text>
              <Text style={styles.stepText}>
                Buy ad credits with secure Stripe payment
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Create Your Ad</Text>
              <Text style={styles.stepText}>
                Design your ad with images, text, and call-to-action
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Set Budget & Duration</Text>
              <Text style={styles.stepText}>
                Choose your daily budget and how long your ad runs
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Go Live!</Text>
              <Text style={styles.stepText}>
                Your ad appears to local customers searching for stone
              </Text>
            </View>
          </View>
        </View>

        {/* Pricing Guide */}
        <View style={styles.pricingGuide}>
          <Text style={styles.pricingTitle}>Ad Costs Per Day</Text>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Banner Ad</Text>
            <Text style={styles.pricingValue}>1 credit/day</Text>
          </View>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Sponsored Listing</Text>
            <Text style={styles.pricingValue}>2 credits/day</Text>
          </View>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Featured Ad</Text>
            <Text style={styles.pricingValue}>3 credits/day</Text>
          </View>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Tooltip Ad</Text>
            <Text style={styles.pricingValue}>5 credits/day</Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Purchase Button */}
      {selectedPackage && (
        <View style={styles.footer}>
          <View style={styles.footerInfo}>
            <Text style={styles.footerLabel}>You're purchasing:</Text>
            <Text style={styles.footerPackage}>{selectedPackage.name} Package</Text>
            <Text style={styles.footerCredits}>
              {selectedPackage.credits + (selectedPackage.bonus || 0)} credits
            </Text>
          </View>
          <Pressable
            style={[styles.purchaseButton, isProcessing && styles.purchaseButtonDisabled]}
            onPress={handlePurchase}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="lock-closed" size={20} color="white" />
                <Text style={styles.purchaseButtonText}>
                  Pay ${selectedPackage.price.toFixed(2)}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </SafeAreaView>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text.primary,
  },
  content: {
    flex: 1,
  },
  balanceCard: {
    margin: 16,
    padding: 24,
    backgroundColor: colors.primary[600],
    borderRadius: 16,
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: "800",
    color: "white",
    marginBottom: 4,
  },
  balanceSubtext: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: colors.primary[900],
    fontWeight: "500",
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 16,
  },
  packageCard: {
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border.main,
    marginBottom: 16,
    position: "relative",
  },
  packageCardSelected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  packageCardPopular: {
    borderColor: colors.accent[500],
    borderWidth: 3,
  },
  popularBadge: {
    position: "absolute",
    top: -12,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: colors.accent[500],
    borderRadius: 6,
  },
  popularText: {
    fontSize: 11,
    fontWeight: "800",
    color: "white",
    letterSpacing: 0.5,
  },
  packageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  packageInfo: {
    flex: 1,
  },
  packageName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 4,
  },
  packageCredits: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.secondary,
    marginBottom: 8,
  },
  bonusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.success.light,
    borderRadius: 4,
  },
  bonusText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.success.dark,
  },
  packagePricing: {
    alignItems: "flex-end",
  },
  packagePrice: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.primary[600],
  },
  packagePricePerCredit: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  packageFeatures: {
    gap: 8,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: "500",
  },
  selectedIndicator: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  stepCard: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    marginBottom: 12,
    gap: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[600],
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 4,
  },
  stepText: {
    fontSize: 13,
    color: colors.text.tertiary,
    lineHeight: 18,
  },
  pricingGuide: {
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    marginBottom: 24,
  },
  pricingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 16,
  },
  pricingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  pricingLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  pricingValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.primary,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: colors.background.primary,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  footerInfo: {
    marginBottom: 12,
  },
  footerLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginBottom: 4,
  },
  footerPackage: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
  },
  footerCredits: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  purchaseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    backgroundColor: colors.primary[600],
    borderRadius: 12,
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },
});
