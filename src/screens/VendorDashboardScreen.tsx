import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  RefreshControl,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../utils/colors";
import { useAuthStore } from "../state/authStore";
import { useSubscriptionStore } from "../state/subscriptionStore";
import { VENDOR_PLANS } from "../types/subscriptions";

const { width } = Dimensions.get("window");

type TabType = "overview" | "products" | "promotions" | "leads" | "analytics";

export default function VendorDashboardScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const {
    subscription,
    credits,
    promotions,
    flyers,
    fetchSubscription,
    fetchCredits,
    getCurrentTier,
    getListingLimit,
    getPromoLimit,
    canPostPromotion,
    canUploadFlyer,
  } = useSubscriptionStore();

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchSubscription(user.id);
      fetchCredits(user.id);
    }
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (user?.id) {
      await Promise.all([fetchSubscription(user.id), fetchCredits(user.id)]);
    }
    setRefreshing(false);
  };

  const tier = getCurrentTier();
  const plan = VENDOR_PLANS.find((p) => p.id === subscription?.planId);

  // Stats cards data
  const stats = [
    {
      label: "Products Listed",
      value: subscription?.usage?.productsListed || 0,
      limit: getListingLimit(),
      icon: "cube-outline",
      color: colors.primary[600],
    },
    {
      label: "Active Promotions",
      value: subscription?.usage?.specialsPosted || 0,
      limit: getPromoLimit(),
      icon: "megaphone-outline",
      color: colors.secondary[500],
    },
    {
      label: "Leads This Month",
      value: subscription?.usage?.leadsReceived || 0,
      limit: plan?.features.leadsPerMonth || 0,
      icon: "people-outline",
      color: colors.accent[500],
    },
    {
      label: "Credits Balance",
      value: (credits?.credits || 0) + (credits?.bonusCredits || 0),
      limit: null,
      icon: "wallet-outline",
      color: colors.navy[500],
    },
  ];

  const quickActions = [
    {
      id: "add-product",
      label: "Add Product",
      icon: "add-circle-outline",
      onPress: () => navigation.navigate("CreateListing"),
    },
    {
      id: "new-promo",
      label: "New Promotion",
      icon: "megaphone-outline",
      onPress: () => {
        if (canPostPromotion()) {
          navigation.navigate("CreatePromotion");
        } else {
          Alert.alert(
            "Upgrade Required",
            "Upgrade your plan to post more promotions.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "View Plans",
                onPress: () => navigation.navigate("Subscription"),
              },
            ]
          );
        }
      },
    },
    {
      id: "upload-flyer",
      label: "Upload Flyer",
      icon: "document-outline",
      onPress: () => {
        if (canUploadFlyer()) {
          navigation.navigate("UploadFlyer");
        } else {
          Alert.alert(
            "Upgrade Required",
            "Upgrade your plan to upload flyers.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "View Plans",
                onPress: () => navigation.navigate("Subscription"),
              },
            ]
          );
        }
      },
    },
    {
      id: "view-leads",
      label: "View Leads",
      icon: "people-outline",
      onPress: () => navigation.navigate("Leads"),
    },
  ];

  const renderOverview = () => (
    <View>
      {/* Subscription Status Card */}
      <View style={styles.subscriptionCard}>
        <View style={styles.subscriptionHeader}>
          <View>
            <Text style={styles.subscriptionTitle}>
              {plan?.name || "Free Plan"}
            </Text>
            <Text style={styles.subscriptionSubtitle}>
              {subscription?.status === "active"
                ? `Renews in ${useSubscriptionStore.getState().getDaysUntilRenewal()} days`
                : subscription?.status === "trial"
                ? "Trial Period"
                : "No active subscription"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => navigation.navigate("Subscription")}
          >
            <Text style={styles.upgradeButtonText}>
              {tier === "free" ? "Upgrade" : "Manage"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: stat.color + "15" }]}>
              <Ionicons name={stat.icon as any} size={24} color={stat.color} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
            {stat.limit !== null && stat.limit !== "unlimited" && (
              <Text style={styles.statLimit}>
                of {stat.limit} {stat.limit === 0 ? "(upgrade)" : ""}
              </Text>
            )}
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionCard}
            onPress={action.onPress}
          >
            <Ionicons
              name={action.icon as any}
              size={28}
              color={colors.primary[600]}
            />
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Activity */}
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <View style={styles.activityCard}>
        <View style={styles.activityItem}>
          <View style={styles.activityDot} />
          <View style={styles.activityContent}>
            <Text style={styles.activityText}>New lead from John D.</Text>
            <Text style={styles.activityTime}>2 hours ago</Text>
          </View>
        </View>
        <View style={styles.activityItem}>
          <View style={styles.activityDot} />
          <View style={styles.activityContent}>
            <Text style={styles.activityText}>
              Your "Flash Sale" promo got 45 views
            </Text>
            <Text style={styles.activityTime}>5 hours ago</Text>
          </View>
        </View>
        <View style={styles.activityItem}>
          <View style={styles.activityDot} />
          <View style={styles.activityContent}>
            <Text style={styles.activityText}>
              Product "Calacatta Gold" received 3 inquiries
            </Text>
            <Text style={styles.activityTime}>Yesterday</Text>
          </View>
        </View>
      </View>

      {/* Upgrade CTA for free users */}
      {tier === "free" && (
        <View style={styles.upgradeCTA}>
          <View style={styles.upgradeContent}>
            <Ionicons
              name="rocket-outline"
              size={32}
              color={colors.primary[600]}
            />
            <View style={styles.upgradeText}>
              <Text style={styles.upgradeTitle}>Unlock More Features</Text>
              <Text style={styles.upgradeDescription}>
                Get unlimited products, promotions, and lead access
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.upgradeCTAButton}
            onPress={() => navigation.navigate("Subscription")}
          >
            <Text style={styles.upgradeCTAButtonText}>View Plans</Text>
            <Ionicons name="arrow-forward" size={18} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderProducts = () => (
    <View>
      <View style={styles.productsHeader}>
        <Text style={styles.productsCount}>
          {subscription?.usage?.productsListed || 0} Products
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("CreateListing")}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>Add Product</Text>
        </TouchableOpacity>
      </View>

      {/* Product list placeholder */}
      <View style={styles.emptyState}>
        <Ionicons name="cube-outline" size={64} color={colors.neutral[300]} />
        <Text style={styles.emptyTitle}>No products yet</Text>
        <Text style={styles.emptyDescription}>
          Add your inventory to start receiving inquiries
        </Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.navigate("CreateListing")}
        >
          <Text style={styles.emptyButtonText}>Add First Product</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPromotions = () => (
    <View>
      <View style={styles.productsHeader}>
        <Text style={styles.productsCount}>
          {promotions.length} Promotions
        </Text>
        <TouchableOpacity
          style={[
            styles.addButton,
            !canPostPromotion() && styles.addButtonDisabled,
          ]}
          onPress={() => {
            if (canPostPromotion()) {
              navigation.navigate("CreatePromotion");
            } else {
              Alert.alert("Upgrade Required", "Upgrade to post more promotions");
            }
          }}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>New Promo</Text>
        </TouchableOpacity>
      </View>

      {promotions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="megaphone-outline"
            size={64}
            color={colors.neutral[300]}
          />
          <Text style={styles.emptyTitle}>No promotions yet</Text>
          <Text style={styles.emptyDescription}>
            Create sales, specials, and announcements to attract customers
          </Text>
          {canPostPromotion() ? (
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate("CreatePromotion")}
            >
              <Text style={styles.emptyButtonText}>Create Promotion</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate("Subscription")}
            >
              <Text style={styles.emptyButtonText}>Upgrade to Post</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView>
          {promotions.map((promo) => (
            <TouchableOpacity key={promo.id} style={styles.promoCard}>
              <View style={styles.promoHeader}>
                <View
                  style={[
                    styles.promoTypeBadge,
                    {
                      backgroundColor:
                        promo.type === "flash_sale"
                          ? colors.red[100]
                          : colors.primary[50],
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.promoTypeText,
                      {
                        color:
                          promo.type === "flash_sale"
                            ? colors.red[600]
                            : colors.primary[600],
                      },
                    ]}
                  >
                    {promo.type.replace("_", " ").toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.promoStatus}>{promo.status}</Text>
              </View>
              <Text style={styles.promoTitle}>{promo.title}</Text>
              <View style={styles.promoStats}>
                <Text style={styles.promoStat}>
                  <Ionicons name="eye-outline" size={14} /> {promo.views} views
                </Text>
                <Text style={styles.promoStat}>
                  <Ionicons name="bookmark-outline" size={14} /> {promo.saves}{" "}
                  saves
                </Text>
                <Text style={styles.promoStat}>
                  <Ionicons name="people-outline" size={14} /> {promo.leads}{" "}
                  leads
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderLeads = () => (
    <View>
      <View style={styles.leadsHeader}>
        <Text style={styles.productsCount}>
          {subscription?.usage?.leadsReceived || 0} Leads This Month
        </Text>
      </View>

      <View style={styles.emptyState}>
        <Ionicons name="people-outline" size={64} color={colors.neutral[300]} />
        <Text style={styles.emptyTitle}>No leads yet</Text>
        <Text style={styles.emptyDescription}>
          Leads from your products and promotions will appear here
        </Text>
      </View>
    </View>
  );

  const renderAnalytics = () => (
    <View>
      <Text style={styles.analyticsTitle}>Performance Overview</Text>

      {/* Analytics cards */}
      <View style={styles.analyticsGrid}>
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsValue}>1,234</Text>
          <Text style={styles.analyticsLabel}>Profile Views</Text>
          <Text style={styles.analyticsChange}>+12% this week</Text>
        </View>
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsValue}>89</Text>
          <Text style={styles.analyticsLabel}>Product Views</Text>
          <Text style={styles.analyticsChange}>+5% this week</Text>
        </View>
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsValue}>23</Text>
          <Text style={styles.analyticsLabel}>Inquiries</Text>
          <Text style={styles.analyticsChange}>+18% this week</Text>
        </View>
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsValue}>4.8</Text>
          <Text style={styles.analyticsLabel}>Avg Rating</Text>
          <Text style={styles.analyticsChange}>12 reviews</Text>
        </View>
      </View>

      {tier === "free" && (
        <View style={styles.analyticsUpgrade}>
          <Text style={styles.analyticsUpgradeText}>
            Upgrade for advanced analytics including conversion tracking,
            competitor insights, and custom reports.
          </Text>
          <TouchableOpacity
            style={styles.analyticsUpgradeButton}
            onPress={() => navigation.navigate("Subscription")}
          >
            <Text style={styles.analyticsUpgradeButtonText}>
              Unlock Analytics
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "grid-outline" },
    { id: "products", label: "Products", icon: "cube-outline" },
    { id: "promotions", label: "Promos", icon: "megaphone-outline" },
    { id: "leads", label: "Leads", icon: "people-outline" },
    { id: "analytics", label: "Analytics", icon: "analytics-outline" },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vendor Dashboard</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
          <Ionicons name="settings-outline" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons
              name={tab.icon as any}
              size={18}
              color={
                activeTab === tab.id ? colors.primary[600] : colors.text.tertiary
              }
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === "overview" && renderOverview()}
        {activeTab === "products" && renderProducts()}
        {activeTab === "promotions" && renderPromotions()}
        {activeTab === "leads" && renderLeads()}
        {activeTab === "analytics" && renderAnalytics()}
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
  tabsContainer: {
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  tabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
  },
  tabActive: {
    backgroundColor: colors.primary[50],
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
    color: colors.text.tertiary,
    fontWeight: "500",
  },
  tabTextActive: {
    color: colors.primary[600],
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  subscriptionCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  subscriptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.primary,
  },
  subscriptionSubtitle: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  upgradeButton: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
    marginBottom: 16,
  },
  statCard: {
    width: (width - 44) / 2,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    margin: 6,
    alignItems: "center",
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginTop: 4,
    textAlign: "center",
  },
  statLimit: {
    fontSize: 12,
    color: colors.text.quaternary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 12,
    marginTop: 8,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
    marginBottom: 16,
  },
  actionCard: {
    width: (width - 44) / 2,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    margin: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text.primary,
    marginTop: 8,
  },
  activityCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[600],
    marginTop: 6,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  activityTime: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  upgradeCTA: {
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  upgradeContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  upgradeText: {
    marginLeft: 12,
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
  },
  upgradeDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 2,
  },
  upgradeCTAButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary[600],
    paddingVertical: 12,
    borderRadius: 8,
  },
  upgradeCTAButtonText: {
    color: "white",
    fontWeight: "600",
    marginRight: 6,
  },
  productsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  productsCount: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary[600],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonDisabled: {
    backgroundColor: colors.neutral[300],
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    backgroundColor: "white",
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.primary,
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  emptyButton: {
    marginTop: 20,
    backgroundColor: colors.primary[600],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "white",
    fontWeight: "600",
  },
  leadsHeader: {
    marginBottom: 16,
  },
  promoCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  promoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  promoTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  promoTypeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  promoStatus: {
    fontSize: 12,
    color: colors.text.tertiary,
    textTransform: "capitalize",
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 8,
  },
  promoStats: {
    flexDirection: "row",
    gap: 16,
  },
  promoStat: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  analyticsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 16,
  },
  analyticsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
    marginBottom: 16,
  },
  analyticsCard: {
    width: (width - 44) / 2,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    margin: 6,
  },
  analyticsValue: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text.primary,
  },
  analyticsLabel: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginTop: 4,
  },
  analyticsChange: {
    fontSize: 12,
    color: colors.success.main,
    marginTop: 4,
  },
  analyticsUpgrade: {
    backgroundColor: colors.neutral[100],
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  analyticsUpgradeText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: "center",
    marginBottom: 12,
  },
  analyticsUpgradeButton: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  analyticsUpgradeButtonText: {
    color: "white",
    fontWeight: "600",
  },
});
