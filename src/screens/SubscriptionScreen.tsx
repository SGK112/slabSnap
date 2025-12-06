import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../utils/colors";
import { useAuthStore } from "../state/authStore";
import { useSubscriptionStore } from "../state/subscriptionStore";
import {
  VENDOR_PLANS,
  PRO_PLANS,
  VendorSubscriptionPlan,
  ProSubscriptionPlan,
  BillingCycle,
} from "../types/subscriptions";

const { width } = Dimensions.get("window");

type PlanType = "vendor" | "pro";

export default function SubscriptionScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const {
    subscription,
    subscribeToPlan,
    cancelSubscription,
    getCurrentTier,
    getDaysUntilRenewal,
    isLoading,
  } = useSubscriptionStore();

  const [planType, setPlanType] = useState<PlanType>(
    user?.userType === "vendor" || user?.userType === "supplier" ? "vendor" : "pro"
  );
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const plans = planType === "vendor" ? VENDOR_PLANS : PRO_PLANS;
  const currentTier = getCurrentTier();

  const handleSelectPlan = async (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;

    if (plan.tier === "free") {
      Alert.alert("Free Plan", "You're already on the free plan!");
      return;
    }

    if (plan.tier === currentTier) {
      Alert.alert("Current Plan", "You're already subscribed to this plan.");
      return;
    }

    setSelectedPlan(planId);
    setProcessing(true);

    try {
      const checkoutUrl = await subscribeToPlan(planId, planType, billingCycle);
      // Open Stripe checkout in browser
      if (checkoutUrl) {
        await Linking.openURL(checkoutUrl);
      } else {
        // Mock success for development
        Alert.alert(
          "Success!",
          `You've upgraded to the ${plan.name} plan!`,
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to process subscription");
    } finally {
      setProcessing(false);
      setSelectedPlan(null);
    }
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      "Cancel Subscription",
      "Are you sure you want to cancel? You'll lose access to premium features at the end of your billing period.",
      [
        { text: "Keep Subscription", style: "cancel" },
        {
          text: "Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelSubscription();
              Alert.alert(
                "Subscription Canceled",
                "Your subscription will end at the end of your current billing period."
              );
            } catch (error: any) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ]
    );
  };

  const getPrice = (plan: VendorSubscriptionPlan | ProSubscriptionPlan) => {
    return billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
  };

  const getSavings = (plan: VendorSubscriptionPlan | ProSubscriptionPlan) => {
    const yearlyCost = plan.monthlyPrice * 12;
    const savings = yearlyCost - plan.yearlyPrice;
    return savings > 0 ? savings : 0;
  };

  const renderFeatureValue = (value: number | string | boolean) => {
    if (typeof value === "boolean") {
      return value ? (
        <Ionicons name="checkmark-circle" size={18} color={colors.success.main} />
      ) : (
        <Ionicons name="close-circle" size={18} color={colors.neutral[300]} />
      );
    }
    if (value === "unlimited") {
      return <Text style={styles.featureValueUnlimited}>Unlimited</Text>;
    }
    if (value === "none") {
      return <Text style={styles.featureValueNone}>-</Text>;
    }
    return <Text style={styles.featureValue}>{value}</Text>;
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription Plans</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Current Plan Status */}
        {subscription && subscription.tier !== "free" && (
          <View style={styles.currentPlanCard}>
            <View style={styles.currentPlanHeader}>
              <View>
                <Text style={styles.currentPlanLabel}>Current Plan</Text>
                <Text style={styles.currentPlanName}>
                  {plans.find((p) => p.id === subscription.planId)?.name || "Pro"}
                </Text>
              </View>
              <View style={styles.currentPlanBadge}>
                <Text style={styles.currentPlanBadgeText}>
                  {subscription.status.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.renewalText}>
              {subscription.status === "active"
                ? `Renews in ${getDaysUntilRenewal()} days`
                : subscription.status === "canceled"
                ? "Access ends at billing period"
                : ""}
            </Text>
            {subscription.status === "active" && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelSubscription}
              >
                <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Plan Type Toggle */}
        <View style={styles.planTypeToggle}>
          <TouchableOpacity
            style={[
              styles.planTypeButton,
              planType === "vendor" && styles.planTypeButtonActive,
            ]}
            onPress={() => setPlanType("vendor")}
          >
            <Ionicons
              name="storefront-outline"
              size={20}
              color={planType === "vendor" ? "white" : colors.text.tertiary}
            />
            <Text
              style={[
                styles.planTypeText,
                planType === "vendor" && styles.planTypeTextActive,
              ]}
            >
              Vendor Plans
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.planTypeButton,
              planType === "pro" && styles.planTypeButtonActive,
            ]}
            onPress={() => setPlanType("pro")}
          >
            <Ionicons
              name="construct-outline"
              size={20}
              color={planType === "pro" ? "white" : colors.text.tertiary}
            />
            <Text
              style={[
                styles.planTypeText,
                planType === "pro" && styles.planTypeTextActive,
              ]}
            >
              Pro Plans
            </Text>
          </TouchableOpacity>
        </View>

        {/* Billing Cycle Toggle */}
        <View style={styles.billingToggle}>
          <TouchableOpacity
            style={[
              styles.billingButton,
              billingCycle === "monthly" && styles.billingButtonActive,
            ]}
            onPress={() => setBillingCycle("monthly")}
          >
            <Text
              style={[
                styles.billingButtonText,
                billingCycle === "monthly" && styles.billingButtonTextActive,
              ]}
            >
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.billingButton,
              billingCycle === "yearly" && styles.billingButtonActive,
            ]}
            onPress={() => setBillingCycle("yearly")}
          >
            <Text
              style={[
                styles.billingButtonText,
                billingCycle === "yearly" && styles.billingButtonTextActive,
              ]}
            >
              Yearly
            </Text>
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>Save 17%</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Plans */}
        <View style={styles.plansContainer}>
          {plans.map((plan, index) => {
            const isCurrentPlan = subscription?.planId === plan.id;
            const isPopular = plan.tier === "pro";
            const price = getPrice(plan);
            const savings = getSavings(plan);

            return (
              <View
                key={plan.id}
                style={[
                  styles.planCard,
                  isPopular && styles.planCardPopular,
                  isCurrentPlan && styles.planCardCurrent,
                ]}
              >
                {isPopular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                  </View>
                )}

                {isCurrentPlan && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>CURRENT PLAN</Text>
                  </View>
                )}

                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planDescription}>{plan.description}</Text>

                <View style={styles.priceContainer}>
                  <Text style={styles.priceAmount}>
                    ${billingCycle === "monthly" ? price : Math.round(price / 12)}
                  </Text>
                  <Text style={styles.pricePeriod}>/month</Text>
                </View>

                {billingCycle === "yearly" && price > 0 && (
                  <Text style={styles.yearlyBilled}>
                    ${price} billed annually
                    {savings > 0 && (
                      <Text style={styles.savings}> (save ${savings})</Text>
                    )}
                  </Text>
                )}

                {plan.trialDays > 0 && !isCurrentPlan && (
                  <View style={styles.trialBadge}>
                    <Ionicons name="time-outline" size={14} color={colors.success.main} />
                    <Text style={styles.trialText}>
                      {plan.trialDays}-day free trial
                    </Text>
                  </View>
                )}

                {/* Features */}
                <View style={styles.featuresContainer}>
                  {planType === "vendor" ? (
                    <>
                      <View style={styles.featureRow}>
                        <Text style={styles.featureLabel}>Product Listings</Text>
                        {renderFeatureValue(
                          (plan as VendorSubscriptionPlan).features.productListings
                        )}
                      </View>
                      <View style={styles.featureRow}>
                        <Text style={styles.featureLabel}>Monthly Promotions</Text>
                        {renderFeatureValue(
                          (plan as VendorSubscriptionPlan).features.monthlySpecials
                        )}
                      </View>
                      <View style={styles.featureRow}>
                        <Text style={styles.featureLabel}>Flyer Uploads</Text>
                        {renderFeatureValue(
                          (plan as VendorSubscriptionPlan).features.flyerUploads
                        )}
                      </View>
                      <View style={styles.featureRow}>
                        <Text style={styles.featureLabel}>Lead Access</Text>
                        {renderFeatureValue(
                          (plan as VendorSubscriptionPlan).features.leadAccess
                        )}
                      </View>
                      <View style={styles.featureRow}>
                        <Text style={styles.featureLabel}>Featured Placement</Text>
                        {renderFeatureValue(
                          (plan as VendorSubscriptionPlan).features.featuredPlacement
                        )}
                      </View>
                      <View style={styles.featureRow}>
                        <Text style={styles.featureLabel}>Team Members</Text>
                        {renderFeatureValue(
                          (plan as VendorSubscriptionPlan).features.teamMembers
                        )}
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.featureRow}>
                        <Text style={styles.featureLabel}>Quotes/Month</Text>
                        {renderFeatureValue(
                          (plan as ProSubscriptionPlan).features.quotesPerMonth
                        )}
                      </View>
                      <View style={styles.featureRow}>
                        <Text style={styles.featureLabel}>Quote Templates</Text>
                        {renderFeatureValue(
                          (plan as ProSubscriptionPlan).features.quoteTemplates
                        )}
                      </View>
                      <View style={styles.featureRow}>
                        <Text style={styles.featureLabel}>Lead Access</Text>
                        {renderFeatureValue(
                          (plan as ProSubscriptionPlan).features.leadAccess
                        )}
                      </View>
                      <View style={styles.featureRow}>
                        <Text style={styles.featureLabel}>Portfolio Projects</Text>
                        {renderFeatureValue(
                          (plan as ProSubscriptionPlan).features.portfolioProjects
                        )}
                      </View>
                      <View style={styles.featureRow}>
                        <Text style={styles.featureLabel}>Verified Badge</Text>
                        {renderFeatureValue(
                          (plan as ProSubscriptionPlan).features.verifiedBadge
                        )}
                      </View>
                      <View style={styles.featureRow}>
                        <Text style={styles.featureLabel}>Invoicing</Text>
                        {renderFeatureValue(
                          (plan as ProSubscriptionPlan).features.invoicing
                        )}
                      </View>
                    </>
                  )}
                </View>

                {/* CTA Button */}
                <TouchableOpacity
                  style={[
                    styles.selectButton,
                    plan.tier === "free" && styles.selectButtonFree,
                    isCurrentPlan && styles.selectButtonCurrent,
                    isPopular && !isCurrentPlan && styles.selectButtonPopular,
                    processing && selectedPlan === plan.id && styles.selectButtonProcessing,
                  ]}
                  onPress={() => handleSelectPlan(plan.id)}
                  disabled={processing || isCurrentPlan || plan.tier === "free"}
                >
                  {processing && selectedPlan === plan.id ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : isCurrentPlan ? (
                    <Text style={styles.selectButtonTextCurrent}>Current Plan</Text>
                  ) : plan.tier === "free" ? (
                    <Text style={styles.selectButtonTextFree}>Free Forever</Text>
                  ) : (
                    <Text
                      style={[
                        styles.selectButtonText,
                        isPopular && styles.selectButtonTextPopular,
                      ]}
                    >
                      {plan.trialDays > 0 ? "Start Free Trial" : "Subscribe"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* FAQ Link */}
        <TouchableOpacity
          style={styles.faqLink}
          onPress={() => navigation.navigate("FAQ")}
        >
          <Ionicons name="help-circle-outline" size={20} color={colors.primary[600]} />
          <Text style={styles.faqLinkText}>Questions? View our FAQ</Text>
        </TouchableOpacity>

        {/* Spacer */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  currentPlanCard: {
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  currentPlanHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  currentPlanLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
    textTransform: "uppercase",
  },
  currentPlanName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text.primary,
    marginTop: 4,
  },
  currentPlanBadge: {
    backgroundColor: colors.success.main,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentPlanBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
  },
  renewalText: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 8,
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: colors.red[600],
    fontSize: 14,
    fontWeight: "500",
  },
  planTypeToggle: {
    flexDirection: "row",
    backgroundColor: colors.neutral[200],
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  planTypeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
  },
  planTypeButtonActive: {
    backgroundColor: colors.primary[600],
  },
  planTypeText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.tertiary,
    marginLeft: 8,
  },
  planTypeTextActive: {
    color: "white",
  },
  billingToggle: {
    flexDirection: "row",
    backgroundColor: colors.neutral[100],
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  billingButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
  },
  billingButtonActive: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  billingButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.tertiary,
  },
  billingButtonTextActive: {
    color: colors.text.primary,
  },
  saveBadge: {
    backgroundColor: colors.success.light,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  saveBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.success.dark,
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.border.light,
  },
  planCardPopular: {
    borderColor: colors.primary[600],
  },
  planCardCurrent: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[600],
  },
  popularBadge: {
    position: "absolute",
    top: -12,
    right: 20,
    backgroundColor: colors.primary[600],
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
  },
  currentBadge: {
    position: "absolute",
    top: -12,
    right: 20,
    backgroundColor: colors.success.main,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
  },
  planName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  priceAmount: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.text.primary,
  },
  pricePeriod: {
    fontSize: 16,
    color: colors.text.tertiary,
    marginLeft: 4,
  },
  yearlyBilled: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginTop: 4,
  },
  savings: {
    color: colors.success.main,
    fontWeight: "600",
  },
  trialBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  trialText: {
    fontSize: 13,
    color: colors.success.main,
    fontWeight: "600",
    marginLeft: 6,
  },
  featuresContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  featureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  featureLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  featureValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.primary,
  },
  featureValueUnlimited: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary[600],
  },
  featureValueNone: {
    fontSize: 14,
    color: colors.neutral[300],
  },
  selectButton: {
    backgroundColor: colors.neutral[200],
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  selectButtonFree: {
    backgroundColor: colors.neutral[100],
  },
  selectButtonCurrent: {
    backgroundColor: colors.success.light,
  },
  selectButtonPopular: {
    backgroundColor: colors.primary[600],
  },
  selectButtonProcessing: {
    backgroundColor: colors.neutral[400],
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
  },
  selectButtonTextPopular: {
    color: "white",
  },
  selectButtonTextCurrent: {
    color: colors.success.dark,
    fontWeight: "600",
  },
  selectButtonTextFree: {
    color: colors.text.tertiary,
    fontWeight: "500",
  },
  faqLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    marginTop: 20,
  },
  faqLinkText: {
    fontSize: 14,
    color: colors.primary[600],
    marginLeft: 8,
    fontWeight: "500",
  },
});
