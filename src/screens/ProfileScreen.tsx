import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, Modal, Switch, Linking, Alert, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { CompositeNavigationProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { RootStackParamList, TabParamList } from "../nav";
import { useAuthStore, Badge, ProjectIntent } from "../state/authStore";
import { useListingsStore } from "../state/listingsStore";
import { useGamificationStore } from "../state/gamificationStore";
import { useReferralStore } from "../state/referralStore";
import { useLanguageStore } from "../state/languageStore";
import { useMeasurementsStore } from "../state/measurementsStore";
import { useVendorStore } from "../state/vendorStore";
import { Ionicons } from "@expo/vector-icons";
import { shareReferralCode } from "../utils/sharing";
import { colors } from "../utils/colors";
import { languages } from "../utils/i18n";
import * as Haptics from "expo-haptics";
import { UserType } from "../types/marketplace";

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Profile">,
  NativeStackNavigationProp<RootStackParamList>
>;

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  title: string;
  subtitle?: string;
  badge?: string | number;
  badgeBg?: string;
  badgeColor?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
};

// User type display info
const USER_TYPE_INFO: Record<UserType, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  homeowner: { label: "Homeowner", icon: "home", color: "#3b82f6" },
  vendor: { label: "Vendor", icon: "storefront", color: "#8b5cf6" },
  fabricator: { label: "Fabricator", icon: "construct", color: "#f59e0b" },
  contractor: { label: "Contractor", icon: "hammer", color: "#10b981" },
  designer: { label: "Designer", icon: "color-palette", color: "#ec4899" },
  supplier: { label: "Supplier", icon: "cube", color: "#06b6d4" },
  installer: { label: "Installer", icon: "build", color: "#ef4444" },
};

const MenuButton = ({ item }: { item: MenuItem }) => (
  <Pressable
    className="flex-row items-center py-3.5 px-4 rounded-xl mb-2"
    style={{ backgroundColor: 'white' }}
    onPress={item.onPress}
    disabled={!item.onPress}
  >
    <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: item.iconBg }}>
      <Ionicons name={item.icon} size={20} color="white" />
    </View>
    <View className="flex-1 ml-3">
      <Text style={{ fontSize: 15, fontWeight: '600', color: '#0f172a' }}>
        {item.title}
      </Text>
      {item.subtitle && (
        <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
          {item.subtitle}
        </Text>
      )}
    </View>
    {item.badge !== undefined && (
      <View style={{
        backgroundColor: item.badgeBg || '#f3f4f6',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 8,
      }}>
        <Text style={{ fontSize: 11, fontWeight: '600', color: item.badgeColor || '#6b7280' }}>
          {item.badge}
        </Text>
      </View>
    )}
    {item.rightElement || (item.onPress && <Ionicons name="chevron-forward" size={20} color="#9ca3af" />)}
  </Pressable>
);

// Integration Card Component
const IntegrationCard = ({
  name,
  icon,
  iconBg,
  connected,
  onConnect,
  description,
}: {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  connected: boolean;
  onConnect: () => void;
  description: string;
}) => (
  <Pressable
    className="flex-row items-center p-4 rounded-xl mb-3"
    style={{
      backgroundColor: 'white',
      borderWidth: connected ? 2 : 1,
      borderColor: connected ? '#10b981' : '#e5e7eb',
    }}
    onPress={onConnect}
  >
    <View className="w-12 h-12 rounded-xl items-center justify-center" style={{ backgroundColor: iconBg }}>
      <Ionicons name={icon} size={24} color="white" />
    </View>
    <View className="flex-1 ml-3">
      <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a' }}>{name}</Text>
      <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{description}</Text>
    </View>
    {connected ? (
      <View className="flex-row items-center px-3 py-1.5 rounded-full" style={{ backgroundColor: '#d1fae5' }}>
        <Ionicons name="checkmark-circle" size={16} color="#10b981" />
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#10b981', marginLeft: 4 }}>Connected</Text>
      </View>
    ) : (
      <View className="px-3 py-1.5 rounded-full" style={{ backgroundColor: colors.primary[100] }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary[600] }}>Connect</Text>
      </View>
    )}
  </Pressable>
);

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout, updateUser, preferences } = useAuthStore();
  const { listings, favoriteIds } = useListingsStore();
  const { streak, level, totalPoints } = useGamificationStore();
  const { referralCode, generateReferralCode } = useReferralStore();
  const { language, translations: t, setLanguage } = useLanguageStore();
  const { getUserMeasurements } = useMeasurementsStore();
  const { vendors, favoriteVendorIds } = useVendorStore();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showIntegrationsModal, setShowIntegrationsModal] = useState(false);
  const [showUserTypeModal, setShowUserTypeModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  const myMeasurements = user ? getUserMeasurements(user.id) : [];
  const myFavoriteListings = listings.filter(l => favoriteIds.includes(l.id));
  const myFavoriteVendors = vendors.filter(v => favoriteVendorIds.includes(v.id));

  useEffect(() => {
    if (user && !referralCode) {
      generateReferralCode(user.id);
    }
  }, [user, referralCode, generateReferralCode]);

  // Check if user is a "pro" type
  const isPro = user && ['vendor', 'fabricator', 'contractor', 'designer', 'supplier', 'installer'].includes(user.userType);

  // Handle integration connections
  const handleConnectShopify = () => {
    Alert.alert(
      "Connect Shopify",
      "Import your products directly from your Shopify store to list them on REMODELY.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Connect",
          onPress: () => {
            // In production, this would redirect to Shopify OAuth
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            updateUser({
              integrations: {
                ...(user?.integrations || {}),
                shopify: { connected: true, connectedAt: new Date().toISOString() }
              }
            });
            Alert.alert("Success", "Shopify connected! You can now import products.");
          }
        }
      ]
    );
  };

  const handleConnectSlack = () => {
    Alert.alert(
      "Connect Slack",
      "Get instant notifications for new leads, messages, and sales in your Slack workspace.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Connect",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            updateUser({
              integrations: {
                ...(user?.integrations || {}),
                slack: { connected: true, connectedAt: new Date().toISOString(), channel: "#remodely-leads" }
              }
            });
            Alert.alert("Success", "Slack connected! You'll receive notifications in #remodely-leads");
          }
        }
      ]
    );
  };

  const handleConnectGoogleCalendar = () => {
    Alert.alert(
      "Connect Google Calendar",
      "Sync appointments and project schedules with your Google Calendar.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Connect",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            updateUser({
              integrations: {
                ...(user?.integrations || {}),
                googleCalendar: { connected: true, connectedAt: new Date().toISOString() }
              }
            });
            Alert.alert("Success", "Google Calendar connected!");
          }
        }
      ]
    );
  };

  const handleConnectStripe = () => {
    Alert.alert(
      "Connect Stripe",
      "Accept payments directly through REMODELY with Stripe.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Connect",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            updateUser({
              integrations: {
                ...(user?.integrations || {}),
                stripe: { connected: true, connectedAt: new Date().toISOString() }
              }
            });
            Alert.alert("Success", "Stripe connected! You can now accept payments.");
          }
        }
      ]
    );
  };

  // Prompt login if not authenticated
  if (!user) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: '#fafafa' }}>
        <View className="items-center px-8">
          <View className="w-24 h-24 rounded-full items-center justify-center mb-6" style={{
            backgroundColor: colors.primary[600],
            shadowColor: colors.primary[600],
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
          }}>
            <Ionicons name="person-outline" size={48} color="white" />
          </View>
          <Text className="text-3xl mb-3 text-center" style={{ fontWeight: '600', color: '#0f172a', letterSpacing: -0.5 }}>
            Sign in to view your profile
          </Text>
          <Text className="text-base text-center mb-10" style={{ color: '#6b7280' }}>
            Create an account to post listings, connect with pros, and manage your projects
          </Text>
          <Pressable
            className="rounded-xl py-4 px-10 items-center mb-4 w-full"
            style={{
              backgroundColor: colors.red[600],
              shadowColor: colors.red[600],
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}
            onPress={() => navigation.navigate("Signup")}
          >
            <Text className="text-lg" style={{ fontWeight: '600', color: 'white' }}>
              Sign Up
            </Text>
          </Pressable>
          <Pressable
            className="rounded-xl py-4 px-10 items-center w-full"
            style={{ backgroundColor: 'white', borderWidth: 2, borderColor: colors.primary[600] }}
            onPress={() => navigation.navigate("Login")}
          >
            <Text className="text-lg" style={{ fontWeight: '600', color: colors.primary[600] }}>
              Log In
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const myListings = listings.filter((listing) => listing.sellerId === user.id);
  const activeListings = myListings.filter((l) => l.status === "active");
  const userTypeInfo = USER_TYPE_INFO[user.userType] || USER_TYPE_INFO.homeowner;

  // Menu Items Configuration
  const myContentItems: MenuItem[] = [
    {
      icon: "cube",
      iconBg: colors.accent[500],
      title: "My Listings",
      subtitle: `${activeListings.length} active listings`,
      onPress: () => navigation.navigate('MyListings' as any),
    },
    {
      icon: "heart",
      iconBg: '#ef4444',
      title: "Saved Listings",
      subtitle: `${myFavoriteListings.length} saved`,
    },
    {
      icon: "business",
      iconBg: '#8b5cf6',
      title: "Favorite Vendors",
      subtitle: `${myFavoriteVendors.length} vendors`,
      onPress: () => navigation.navigate('Map' as any),
    },
  ];

  // Pro-specific menu items
  const proItems: MenuItem[] = isPro ? [
    {
      icon: "briefcase",
      iconBg: '#f59e0b',
      title: "Portfolio",
      subtitle: `${user.portfolio?.length || 0} projects`,
      onPress: () => Alert.alert("Coming Soon", "Portfolio management coming soon!"),
    },
    {
      icon: "people",
      iconBg: '#10b981',
      title: "Leads & Inquiries",
      subtitle: "View customer requests",
      badge: "3 new",
      badgeBg: '#dcfce7',
      badgeColor: '#10b981',
      onPress: () => Alert.alert("Coming Soon", "Lead management coming soon!"),
    },
    {
      icon: "calendar",
      iconBg: '#6366f1',
      title: "Schedule",
      subtitle: "Manage appointments",
      onPress: () => Alert.alert("Coming Soon", "Scheduling coming soon!"),
    },
  ] : [];

  const toolsItems: MenuItem[] = [
    {
      icon: "resize",
      iconBg: '#06b6d4',
      title: "Smart Measurement",
      subtitle: `${myMeasurements.length} saved measurements`,
      onPress: () => navigation.navigate('MeasurementHome' as any),
    },
    {
      icon: "map",
      iconBg: '#f59e0b',
      title: "Vendor Map",
      subtitle: "Find fabricators, suppliers & installers",
      badge: vendors.length,
      badgeBg: '#fef5f0',
      badgeColor: colors.accent[500],
      onPress: () => navigation.navigate('Map' as any),
    },
    {
      icon: "apps",
      iconBg: '#8b5cf6',
      title: "Integrations",
      subtitle: "Shopify, Slack, Calendar & more",
      onPress: () => setShowIntegrationsModal(true),
    },
  ];

  const settingsItems: MenuItem[] = [
    {
      icon: "notifications-outline",
      iconBg: '#eab308',
      title: "Notifications",
      rightElement: (
        <Switch
          value={notificationsEnabled}
          onValueChange={(value) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setNotificationsEnabled(value);
          }}
          trackColor={{ false: '#d1d5db', true: colors.accent[500] }}
          thumbColor="white"
        />
      ),
    },
    {
      icon: "location-outline",
      iconBg: '#10b981',
      title: "Location Services",
      subtitle: "Find nearby vendors & jobs",
      rightElement: (
        <Switch
          value={locationEnabled}
          onValueChange={(value) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setLocationEnabled(value);
          }}
          trackColor={{ false: '#d1d5db', true: colors.accent[500] }}
          thumbColor="white"
        />
      ),
    },
    {
      icon: "language",
      iconBg: '#6366f1',
      title: t.profile.language,
      badge: language === 'en' ? 'English' : 'Español',
      onPress: () => setShowLanguageModal(true),
    },
    {
      icon: "shield-checkmark-outline",
      iconBg: '#059669',
      title: t.profile.privacySafety,
      onPress: () => navigation.navigate('Privacy' as any),
    },
    {
      icon: "help-circle-outline",
      iconBg: '#f59e0b',
      title: t.profile.helpSupport,
      onPress: () => navigation.navigate('HelpSupport' as any),
    },
  ];

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#f8f9fa' }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header with User Type Badge */}
        <View className="px-5 pt-4 pb-5" style={{
          backgroundColor: 'white',
          borderBottomWidth: 1,
          borderBottomColor: '#e5e7eb',
        }}>
          <View className="flex-row items-center mb-4">
            <View className="w-20 h-20 rounded-full items-center justify-center mr-4" style={{
              backgroundColor: userTypeInfo.color,
              shadowColor: userTypeInfo.color,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}>
              <Ionicons name={userTypeInfo.icon} size={40} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-2xl mb-1" style={{ fontWeight: '700', color: '#0f172a', letterSpacing: -0.5 }}>
                {user.businessName || user.name}
              </Text>
              <Text className="text-sm mb-2" style={{ color: '#6b7280', fontWeight: '500' }}>{user.email}</Text>
              <View className="flex-row items-center">
                <Pressable
                  onPress={() => setShowUserTypeModal(true)}
                  className="flex-row items-center px-3 py-1 rounded-full mr-2"
                  style={{ backgroundColor: userTypeInfo.color + '20' }}
                >
                  <Ionicons name={userTypeInfo.icon} size={14} color={userTypeInfo.color} />
                  <Text className="text-xs ml-1" style={{ color: userTypeInfo.color, fontWeight: '600' }}>
                    {userTypeInfo.label}
                  </Text>
                  <Ionicons name="chevron-down" size={12} color={userTypeInfo.color} style={{ marginLeft: 2 }} />
                </Pressable>
                {user.verified && (
                  <View className="flex-row items-center px-2 py-1 rounded-full" style={{ backgroundColor: '#dbeafe' }}>
                    <Ionicons name="checkmark-circle" size={14} color="#2563eb" />
                    <Text className="text-xs ml-1" style={{ color: '#2563eb', fontWeight: '600' }}>Verified</Text>
                  </View>
                )}
              </View>
            </View>
            <Pressable onPress={() => navigation.navigate("EditProfile" as any)}>
              <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary[50] }}>
                <Ionicons name="create-outline" size={20} color={colors.primary[600]} />
              </View>
            </Pressable>
          </View>

          {/* Rating & Stats */}
          <View className="flex-row items-center mb-4 px-2">
            <View className="flex-row items-center mr-4">
              <Ionicons name="star" size={18} color={colors.yellow[500]} />
              <Text className="text-lg ml-1" style={{ color: '#0f172a', fontWeight: '700' }}>
                {user.rating.toFixed(1)}
              </Text>
              <Text className="text-sm ml-1" style={{ color: '#9ca3af' }}>
                ({user.reviewCount} reviews)
              </Text>
            </View>
            {isPro && user.responseTime && (
              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={16} color="#10b981" />
                <Text className="text-sm ml-1" style={{ color: '#10b981', fontWeight: '500' }}>
                  Responds {user.responseTime}
                </Text>
              </View>
            )}
          </View>

          {/* Compact Stats */}
          <View className="flex-row rounded-xl overflow-hidden" style={{
            backgroundColor: '#fafafa',
            borderWidth: 1,
            borderColor: '#e5e7eb',
          }}>
            <View className="flex-1 items-center py-3" style={{ borderRightWidth: 1, borderRightColor: '#e5e7eb' }}>
              <Text className="text-2xl mb-1" style={{ fontWeight: '700', color: '#0f172a' }}>
                {activeListings.length}
              </Text>
              <Text className="text-xs" style={{ color: '#6b7280', fontWeight: '500' }}>{t.profile.active}</Text>
            </View>
            <View className="flex-1 items-center py-3" style={{ borderRightWidth: 1, borderRightColor: '#e5e7eb' }}>
              <Text className="text-2xl mb-1" style={{ fontWeight: '700', color: '#0f172a' }}>
                {isPro ? (user.completedJobs || 0) : myListings.length}
              </Text>
              <Text className="text-xs" style={{ color: '#6b7280', fontWeight: '500' }}>{isPro ? 'Jobs' : t.profile.total}</Text>
            </View>
            <View className="flex-1 items-center py-3" style={{ borderRightWidth: 1, borderRightColor: '#e5e7eb' }}>
              <Text className="text-2xl mb-1" style={{ fontWeight: '700', color: colors.yellow[500] }}>
                {streak.currentStreak}
              </Text>
              <Text className="text-xs" style={{ color: '#6b7280', fontWeight: '500' }}>Streak</Text>
            </View>
            <View className="flex-1 items-center py-3">
              <Text className="text-2xl mb-1" style={{ fontWeight: '700', color: '#8b5cf6' }}>
                {level}
              </Text>
              <Text className="text-xs" style={{ color: '#6b7280', fontWeight: '500' }}>Level</Text>
            </View>
          </View>
        </View>

        {/* Badges Section - Show if user has badges */}
        {preferences.badges && preferences.badges.length > 0 && (
          <View className="px-5 py-4" style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm" style={{ fontWeight: '700', color: '#0f172a' }}>
                My Badges
              </Text>
              <Pressable onPress={() => navigation.navigate('StyleQuiz' as any)}>
                <Text className="text-xs" style={{ color: colors.primary[600], fontWeight: '600' }}>Earn More</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row" style={{ gap: 12 }}>
                {preferences.badges.map((badge: Badge) => (
                  <View
                    key={badge.id}
                    className="items-center p-3 rounded-xl"
                    style={{
                      backgroundColor: badge.color + '15',
                      borderWidth: 1,
                      borderColor: badge.color + '30',
                      minWidth: 90,
                    }}
                  >
                    <View
                      className="w-12 h-12 rounded-full items-center justify-center mb-2"
                      style={{ backgroundColor: badge.color }}
                    >
                      <Ionicons name={badge.icon as any} size={24} color="white" />
                    </View>
                    <Text className="text-xs text-center" style={{ fontWeight: '600', color: '#0f172a' }} numberOfLines={2}>
                      {badge.name}
                    </Text>
                  </View>
                ))}
                {/* Add placeholder for more badges */}
                <Pressable
                  onPress={() => navigation.navigate('StyleQuiz' as any)}
                  className="items-center justify-center p-3 rounded-xl"
                  style={{
                    backgroundColor: '#f8f9fa',
                    borderWidth: 2,
                    borderColor: '#e5e7eb',
                    borderStyle: 'dashed',
                    minWidth: 90,
                  }}
                >
                  <View className="w-12 h-12 rounded-full items-center justify-center mb-2" style={{ backgroundColor: '#e5e7eb' }}>
                    <Ionicons name="add" size={24} color="#9ca3af" />
                  </View>
                  <Text className="text-xs text-center" style={{ fontWeight: '600', color: '#9ca3af' }}>
                    Earn More
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        )}

        {/* Active Projects Section */}
        {preferences.activeProjects && preferences.activeProjects.length > 0 && (
          <View className="px-5 py-4" style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm" style={{ fontWeight: '700', color: '#0f172a' }}>
                My Projects
              </Text>
              <Pressable onPress={() => navigation.navigate('StyleQuiz' as any)}>
                <Text className="text-xs" style={{ color: colors.primary[600], fontWeight: '600' }}>Add Project</Text>
              </Pressable>
            </View>
            {preferences.activeProjects.map((project: ProjectIntent) => (
              <Pressable
                key={project.id}
                className="flex-row items-center p-4 rounded-xl mb-2"
                style={{ backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e5e7eb' }}
                onPress={() => {
                  // Could navigate to project details in future
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <View
                  className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                  style={{
                    backgroundColor:
                      project.type === 'kitchen' ? '#f97316' :
                      project.type === 'bathroom' ? '#06b6d4' :
                      project.type === 'outdoor' ? '#22c55e' :
                      project.type === 'flooring' ? '#a855f7' :
                      project.type === 'countertops' ? '#6366f1' :
                      project.type === 'plumbing' ? '#3b82f6' :
                      project.type === 'electrical' ? '#eab308' :
                      project.type === 'landscaping' ? '#10b981' : '#6b7280',
                  }}
                >
                  <Ionicons
                    name={
                      project.type === 'kitchen' ? 'restaurant' :
                      project.type === 'bathroom' ? 'water' :
                      project.type === 'outdoor' ? 'sunny' :
                      project.type === 'flooring' ? 'apps' :
                      project.type === 'countertops' ? 'layers' :
                      project.type === 'plumbing' ? 'construct' :
                      project.type === 'electrical' ? 'flash' :
                      project.type === 'landscaping' ? 'leaf' : 'build'
                    }
                    size={24}
                    color="white"
                  />
                </View>
                <View className="flex-1">
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a' }}>
                    {project.type.charAt(0).toUpperCase() + project.type.slice(1)} Project
                  </Text>
                  <View className="flex-row items-center mt-1" style={{ gap: 8 }}>
                    {project.budget && (
                      <View className="flex-row items-center">
                        <Ionicons name="wallet-outline" size={12} color="#6b7280" />
                        <Text className="text-xs ml-1" style={{ color: '#6b7280' }}>
                          {project.budget.charAt(0).toUpperCase() + project.budget.slice(1)}
                        </Text>
                      </View>
                    )}
                    {project.timeline && (
                      <View className="flex-row items-center">
                        <Ionicons name="time-outline" size={12} color="#6b7280" />
                        <Text className="text-xs ml-1" style={{ color: '#6b7280' }}>
                          {project.timeline === 'urgent' ? 'ASAP' :
                           project.timeline === 'soon' ? '1-2 mo' :
                           project.timeline === 'planning' ? '3-6 mo' : 'Exploring'}
                        </Text>
                      </View>
                    )}
                    {project.location && (
                      <View className="flex-row items-center">
                        <Ionicons name="location-outline" size={12} color="#22c55e" />
                        <Text className="text-xs ml-1" style={{ color: '#22c55e' }}>Pinned</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </Pressable>
            ))}
          </View>
        )}

        {/* Style Personality Section - if style quiz completed */}
        {preferences.styleName && (
          <View className="px-5 py-4" style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm" style={{ fontWeight: '700', color: '#0f172a' }}>
                My Design Style
              </Text>
              <Pressable onPress={() => navigation.navigate('StyleQuiz' as any)}>
                <Text className="text-xs" style={{ color: colors.primary[600], fontWeight: '600' }}>Retake Quiz</Text>
              </Pressable>
            </View>
            <View className="flex-row items-center p-4 rounded-xl" style={{ backgroundColor: '#f0f4ff', borderWidth: 1, borderColor: '#c7d2fe' }}>
              <View className="w-14 h-14 rounded-full items-center justify-center mr-4" style={{ backgroundColor: '#6366f1' }}>
                <Ionicons
                  name={
                    preferences.styleName === 'The Modernist' ? 'cube' :
                    preferences.styleName === 'The Naturalist' ? 'leaf' :
                    preferences.styleName === 'The Refined' ? 'diamond' :
                    preferences.styleName === 'The Entertainer' ? 'people' :
                    preferences.styleName === 'The Traditionalist' ? 'home' :
                    preferences.styleName === 'The Zen Seeker' ? 'flower' : 'color-palette'
                  }
                  size={28}
                  color="white"
                />
              </View>
              <View className="flex-1">
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a' }}>
                  {preferences.styleName}
                </Text>
                {preferences.colorPalette && (
                  <Text className="text-sm mt-1" style={{ color: '#6b7280' }}>
                    Prefers {preferences.colorPalette}
                  </Text>
                )}
              </View>
              <View className="px-3 py-1.5 rounded-full" style={{ backgroundColor: '#22c55e' }}>
                <Text className="text-xs" style={{ fontWeight: '600', color: 'white' }}>Matched</Text>
              </View>
            </View>
          </View>
        )}

        {/* Show Quiz CTA if no style preferences */}
        {!preferences.styleName && !preferences.badges?.length && (
          <View className="px-5 py-4" style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
            <Pressable
              className="p-5 rounded-2xl"
              style={{
                backgroundColor: '#f0f4ff',
                borderWidth: 2,
                borderColor: '#c7d2fe',
              }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate('StyleQuiz' as any);
              }}
            >
              <View className="flex-row items-center">
                <View className="w-14 h-14 rounded-full items-center justify-center mr-4" style={{ backgroundColor: '#6366f1' }}>
                  <Ionicons name="sparkles" size={28} color="white" />
                </View>
                <View className="flex-1">
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a' }}>
                    Discover Your Style
                  </Text>
                  <Text className="text-sm mt-1" style={{ color: '#6b7280' }}>
                    Take the quiz to get personalized recommendations
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={24} color="#6366f1" />
              </View>
            </Pressable>
          </View>
        )}

        {/* Content Sections */}
        <View className="px-5 py-4">
          {/* Pro Features Section (only for pro users) */}
          {isPro && proItems.length > 0 && (
            <View className="mb-5">
              <Text className="text-xs mb-3" style={{ fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>
                PRO DASHBOARD
              </Text>
              {proItems.map((item, index) => (
                <MenuButton key={index} item={item} />
              ))}
            </View>
          )}

          {/* My Content Section */}
          <View className="mb-5">
            <Text className="text-xs mb-3" style={{ fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>
              MY CONTENT
            </Text>
            {myContentItems.map((item, index) => (
              <MenuButton key={index} item={item} />
            ))}
          </View>

          {/* Tools & Features Section */}
          <View className="mb-5">
            <Text className="text-xs mb-3" style={{ fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>
              TOOLS & INTEGRATIONS
            </Text>
            {toolsItems.map((item, index) => (
              <MenuButton key={index} item={item} />
            ))}
          </View>

          {/* Quick Connect Social */}
          <View className="mb-5">
            <Text className="text-xs mb-3" style={{ fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>
              SHARE & CONNECT
            </Text>
            <View className="flex-row items-center py-3.5 px-4 rounded-xl mb-2" style={{ backgroundColor: 'white' }}>
              <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: '#8b5cf6' }}>
                <Ionicons name="share-social" size={20} color="white" />
              </View>
              <View className="flex-1 ml-3">
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 8 }}>
                  Share Listings
                </Text>
                <View className="flex-row" style={{ gap: 10 }}>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      Linking.openURL('https://facebook.com');
                    }}
                    style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#1877f2', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="logo-facebook" size={20} color="white" />
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      Linking.openURL('https://instagram.com');
                    }}
                    style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#e4405f', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="logo-instagram" size={20} color="white" />
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      Linking.openURL('https://pinterest.com');
                    }}
                    style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#bd081c', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="logo-pinterest" size={20} color="white" />
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      Linking.openURL('https://tiktok.com');
                    }}
                    style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="logo-tiktok" size={20} color="white" />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          {/* Settings Section */}
          <View className="mb-5">
            <Text className="text-xs mb-3" style={{ fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>
              SETTINGS
            </Text>
            {settingsItems.map((item, index) => (
              <MenuButton key={index} item={item} />
            ))}
          </View>

          {/* Referral Section */}
          <View className="mb-5 p-5 rounded-2xl" style={{
            backgroundColor: 'white',
            borderWidth: 2,
            borderColor: colors.accent[200],
          }}>
            <View className="flex-row items-center mb-3">
              <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: colors.accent[500] }}>
                <Ionicons name="gift" size={20} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-lg mb-1" style={{ fontWeight: '700', color: '#0f172a' }}>
                  Invite Friends & Pros
                </Text>
                <Text className="text-sm" style={{ color: '#6b7280', fontWeight: '500' }}>
                  Earn 20 credits per referral
                </Text>
              </View>
            </View>

            <View className="rounded-xl p-4 mb-3" style={{
              backgroundColor: '#fef5f0',
              borderWidth: 1,
              borderColor: colors.accent[300],
            }}>
              <Text className="text-xs mb-1" style={{ color: '#9ca3af', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                YOUR CODE
              </Text>
              <Text className="text-2xl" style={{ fontWeight: '800', color: colors.accent[500], letterSpacing: 3 }}>
                {referralCode || "Generating..."}
              </Text>
            </View>

            <Pressable
              className="rounded-xl py-3.5 flex-row items-center justify-center"
              style={{
                backgroundColor: !referralCode ? '#cbd5e1' : colors.accent[500],
                shadowColor: colors.accent[500],
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: !referralCode ? 0 : 0.3,
                shadowRadius: 8,
                elevation: !referralCode ? 0 : 5,
              }}
              onPress={() => {
                if (referralCode) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  shareReferralCode(referralCode);
                }
              }}
              disabled={!referralCode}
            >
              <Ionicons name="share-social" size={20} color="white" />
              <Text className="text-base ml-2" style={{ fontWeight: '700', color: 'white' }}>
                Share Code
              </Text>
            </Pressable>
          </View>

          {/* Progress Card */}
          <View className="mb-5 p-5 rounded-2xl" style={{
            backgroundColor: 'white',
            borderWidth: 2,
            borderColor: '#e5e7eb',
          }}>
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: '#8b5cf6' }}>
                  <Ionicons name="trophy" size={20} color="white" />
                </View>
                <Text className="text-lg" style={{ fontWeight: '700', color: '#0f172a' }}>
                  Your Progress
                </Text>
              </View>
              <View className="px-3 py-1.5 rounded-full" style={{ backgroundColor: '#eab308' }}>
                <Text className="text-sm" style={{ fontWeight: '800', color: 'white' }}>
                  Level {level}
                </Text>
              </View>
            </View>

            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm" style={{ fontWeight: '600', color: '#374151' }}>
                  Experience Points
                </Text>
                <Text className="text-xs" style={{ color: '#9ca3af', fontWeight: '600' }}>
                  {totalPoints % 100}/100 XP
                </Text>
              </View>
              <View className="h-3 rounded-full" style={{ backgroundColor: '#f1f5f9' }}>
                <View
                  className="h-3 rounded-full"
                  style={{
                    width: `${(totalPoints % 100)}%`,
                    backgroundColor: colors.yellow[500],
                  }}
                />
              </View>
            </View>

            <View className="flex-row items-center justify-between py-3 px-4 rounded-xl" style={{ backgroundColor: '#fef5f0' }}>
              <Text className="text-sm" style={{ color: '#374151', fontWeight: '600' }}>Total Points</Text>
              <Text className="text-xl" style={{ fontWeight: '700', color: colors.accent[500] }}>{totalPoints}</Text>
            </View>
          </View>

          {/* Logout */}
          <Pressable
            className="rounded-xl py-4 items-center mb-8"
            style={{
              backgroundColor: 'white',
              borderWidth: 2,
              borderColor: '#fecaca',
            }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              logout();
            }}
          >
            <Text className="text-base" style={{ fontWeight: '600', color: '#dc2626' }}>
              {t.profile.logOut}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => setShowLanguageModal(false)}
        >
          <View
            style={{
              backgroundColor: colors.background.primary,
              borderRadius: 16,
              padding: 24,
              width: '80%',
              maxWidth: 400,
            }}
            onStartShouldSetResponder={() => true}
          >
            <Text style={{ fontSize: 22, fontWeight: '600', color: colors.text.primary, marginBottom: 20 }}>
              {t.profile.selectLanguage}
            </Text>

            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 16,
                borderRadius: 12,
                backgroundColor: language === 'en' ? colors.accent[100] : colors.background.tertiary,
                marginBottom: 12,
                borderWidth: language === 'en' ? 2 : 0,
                borderColor: language === 'en' ? colors.accent[500] : 'transparent',
              }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setLanguage('en');
                setShowLanguageModal(false);
              }}
            >
              <View>
                <Text style={{ fontSize: 18, fontWeight: '500', color: colors.text.primary }}>
                  English
                </Text>
                <Text style={{ fontSize: 14, color: colors.text.tertiary, marginTop: 2 }}>
                  {languages.en.nativeName}
                </Text>
              </View>
              {language === 'en' && (
                <Ionicons name="checkmark-circle" size={24} color={colors.accent[500]} />
              )}
            </Pressable>

            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 16,
                borderRadius: 12,
                backgroundColor: language === 'es' ? colors.accent[100] : colors.background.tertiary,
                borderWidth: language === 'es' ? 2 : 0,
                borderColor: language === 'es' ? colors.accent[500] : 'transparent',
              }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setLanguage('es');
                setShowLanguageModal(false);
              }}
            >
              <View>
                <Text style={{ fontSize: 18, fontWeight: '500', color: colors.text.primary }}>
                  Español
                </Text>
                <Text style={{ fontSize: 14, color: colors.text.tertiary, marginTop: 2 }}>
                  {languages.es.nativeName}
                </Text>
              </View>
              {language === 'es' && (
                <Ionicons name="checkmark-circle" size={24} color={colors.accent[500]} />
              )}
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Integrations Modal */}
      <Modal
        visible={showIntegrationsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowIntegrationsModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: '#f8f9fa',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 8,
              maxHeight: '85%',
            }}
          >
            {/* Handle */}
            <View className="items-center py-2">
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#d1d5db' }} />
            </View>

            <ScrollView className="px-5 pb-8">
              <View className="flex-row items-center justify-between mb-6">
                <Text style={{ fontSize: 24, fontWeight: '700', color: '#0f172a' }}>
                  Integrations
                </Text>
                <Pressable onPress={() => setShowIntegrationsModal(false)}>
                  <Ionicons name="close" size={28} color="#6b7280" />
                </Pressable>
              </View>

              <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>
                Connect your favorite tools to streamline your workflow and reach more customers.
              </Text>

              {/* Product Import Section */}
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                PRODUCT IMPORT
              </Text>

              <IntegrationCard
                name="Shopify"
                icon="cart"
                iconBg="#96bf48"
                connected={!!user.integrations?.shopify?.connected}
                onConnect={handleConnectShopify}
                description="Import products from your Shopify store"
              />

              {/* Notifications Section */}
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 12 }}>
                NOTIFICATIONS
              </Text>

              <IntegrationCard
                name="Slack"
                icon="logo-slack"
                iconBg="#4a154b"
                connected={!!user.integrations?.slack?.connected}
                onConnect={handleConnectSlack}
                description="Get lead alerts in your Slack workspace"
              />

              {/* Scheduling Section */}
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 12 }}>
                SCHEDULING
              </Text>

              <IntegrationCard
                name="Google Calendar"
                icon="calendar"
                iconBg="#4285f4"
                connected={!!user.integrations?.googleCalendar?.connected}
                onConnect={handleConnectGoogleCalendar}
                description="Sync appointments and project schedules"
              />

              {/* Payments Section */}
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 12 }}>
                PAYMENTS
              </Text>

              <IntegrationCard
                name="Stripe"
                icon="card"
                iconBg="#635bff"
                connected={!!user.integrations?.stripe?.connected}
                onConnect={handleConnectStripe}
                description="Accept payments through REMODELY"
              />

              {/* Coming Soon */}
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 12 }}>
                COMING SOON
              </Text>

              <View className="opacity-50">
                <IntegrationCard
                  name="QuickBooks"
                  icon="calculator"
                  iconBg="#2ca01c"
                  connected={false}
                  onConnect={() => Alert.alert("Coming Soon", "QuickBooks integration coming soon!")}
                  description="Sync invoices and expenses"
                />
                <IntegrationCard
                  name="Facebook Marketplace"
                  icon="logo-facebook"
                  iconBg="#1877f2"
                  connected={false}
                  onConnect={() => Alert.alert("Coming Soon", "Facebook Marketplace integration coming soon!")}
                  description="Cross-post listings to Facebook"
                />
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* User Type Selection Modal */}
      <Modal
        visible={showUserTypeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUserTypeModal(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => setShowUserTypeModal(false)}
        >
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 24,
              width: '90%',
              maxWidth: 400,
            }}
            onStartShouldSetResponder={() => true}
          >
            <Text style={{ fontSize: 22, fontWeight: '700', color: '#0f172a', marginBottom: 8 }}>
              I am a...
            </Text>
            <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>
              Select your role to customize your experience
            </Text>

            {(Object.keys(USER_TYPE_INFO) as UserType[]).map((type) => {
              const info = USER_TYPE_INFO[type];
              const isSelected = user.userType === type;
              return (
                <Pressable
                  key={type}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    borderRadius: 12,
                    backgroundColor: isSelected ? info.color + '15' : '#f8f9fa',
                    marginBottom: 8,
                    borderWidth: isSelected ? 2 : 1,
                    borderColor: isSelected ? info.color : '#e5e7eb',
                  }}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateUser({ userType: type });
                    setShowUserTypeModal(false);
                  }}
                >
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: info.color }}
                  >
                    <Ionicons name={info.icon} size={20} color="white" />
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a', flex: 1 }}>
                    {info.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={info.color} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
