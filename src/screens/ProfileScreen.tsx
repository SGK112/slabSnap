import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, Modal, Switch, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { CompositeNavigationProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { RootStackParamList, TabParamList } from "../nav";
import { useAuthStore } from "../state/authStore";
import { useListingsStore } from "../state/listingsStore";
import { useGamificationStore } from "../state/gamificationStore";
import { useReferralStore } from "../state/referralStore";
import { useLanguageStore } from "../state/languageStore";
import { useMeasurementsStore } from "../state/measurementsStore";
import { useVendorStore } from "../state/vendorStore";
import { useJobsStore } from "../state/jobsStore";
import { Ionicons } from "@expo/vector-icons";
import { shareReferralCode } from "../utils/sharing";
import { colors } from "../utils/colors";
import { languages } from "../utils/i18n";
import * as Haptics from "expo-haptics";

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

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuthStore();
  const { listings, favoriteIds } = useListingsStore();
  const { streak, level, totalPoints } = useGamificationStore();
  const { referralCode, generateReferralCode } = useReferralStore();
  const { language, translations: t, setLanguage } = useLanguageStore();
  const { getUserMeasurements } = useMeasurementsStore();
  const { vendors, favoriteVendorIds } = useVendorStore();
  const { jobs } = useJobsStore();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  const myMeasurements = user ? getUserMeasurements(user.id) : [];
  const myFavoriteListings = listings.filter(l => favoriteIds.includes(l.id));
  const myFavoriteVendors = vendors.filter(v => favoriteVendorIds.includes(v.id));
  const myPostedJobs = user ? jobs.filter(j => j.userId === user.id) : [];

  useEffect(() => {
    if (user && !referralCode) {
      generateReferralCode(user.id);
    }
  }, [user, referralCode, generateReferralCode]);

  // Prompt login if not authenticated
  if (!user) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: '#fafafa' }}>
        <View className="items-center px-8">
          <View className="w-24 h-24 rounded-full items-center justify-center mb-6" style={{ 
            backgroundColor: '#2563eb',
            shadowColor: '#2563eb',
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
            Create an account to post listings and manage your profile
          </Text>
          <Pressable
            className="rounded-xl py-4 px-10 items-center mb-4 w-full"
            style={{ 
              backgroundColor: colors.yellow[500],
              shadowColor: colors.yellow[500],
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
            style={{ backgroundColor: 'white', borderWidth: 2, borderColor: '#2563eb' }}
            onPress={() => navigation.navigate("Login")}
          >
            <Text className="text-lg" style={{ fontWeight: '600', color: '#2563eb' }}>
              Log In
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const myListings = listings.filter((listing) => listing.sellerId === user.id);
  const activeListings = myListings.filter((l) => l.status === "active");

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

  const toolsItems: MenuItem[] = [
    {
      icon: "megaphone",
      iconBg: '#fbbf24',
      title: "Create Ad",
      subtitle: "Advertise your business locally",
      badge: "NEW",
      badgeBg: '#fef3c7',
      badgeColor: '#b45309',
      onPress: () => navigation.navigate('CreateAd' as any),
    },
    {
      icon: "briefcase",
      iconBg: '#3b82f6',
      title: "Job Board",
      subtitle: "Post & find installation jobs",
      badge: myPostedJobs.length,
      badgeBg: '#fef5f0',
      badgeColor: colors.accent[500],
      onPress: () => navigation.navigate('JobBoard' as any),
    },
    {
      icon: "resize",
      iconBg: '#06b6d4',
      title: "Smart Measurement",
      subtitle: `${myMeasurements.length} saved measurements`,
    },
    {
      icon: "chatbubbles",
      iconBg: '#8b5cf6',
      title: "AI Assistant",
      subtitle: "Get instant help with stone projects",
      onPress: () => navigation.navigate('AIAssistant' as any),
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
      icon: "sync",
      iconBg: '#10b981',
      title: "Connect Apps",
      subtitle: "WhatsApp, Telegram, Instagram & more",
      onPress: () => navigation.navigate('PlatformIntegrations' as any),
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
        {/* Compact Header */}
        <View className="px-5 pt-4 pb-5" style={{ 
          backgroundColor: 'white', 
          borderBottomWidth: 1, 
          borderBottomColor: '#e5e7eb',
        }}>
          <View className="flex-row items-center mb-4">
            <View className="w-20 h-20 rounded-full items-center justify-center mr-4" style={{ 
              backgroundColor: '#2563eb',
              shadowColor: '#2563eb',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}>
              <Ionicons name="person" size={40} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-2xl mb-1" style={{ fontWeight: '700', color: '#0f172a', letterSpacing: -0.5 }}>
                {user.name}
              </Text>
              <Text className="text-sm mb-2" style={{ color: '#6b7280', fontWeight: '500' }}>{user.email}</Text>
              <View className="flex-row items-center">
                <Ionicons name="star" size={14} color={colors.yellow[600]} />
                <Text className="text-sm ml-1" style={{ color: colors.yellow[600], fontWeight: '600' }}>
                  {user.rating.toFixed(1)}
                </Text>
                <Text className="text-sm ml-1" style={{ color: '#9ca3af', fontWeight: '500' }}>
                  ({user.reviewCount})
                </Text>
              </View>
            </View>
            <Pressable onPress={() => navigation.navigate("EditProfile" as any)}>
              <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: '#f3f4f6' }}>
                <Ionicons name="create-outline" size={20} color="#2563eb" />
              </View>
            </Pressable>
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
                {myListings.length}
              </Text>
              <Text className="text-xs" style={{ color: '#6b7280', fontWeight: '500' }}>{t.profile.total}</Text>
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

        {/* Content Sections */}
        <View className="px-5 py-4">
          {/* My Content Section */}
          <View className="mb-5">
            <Text className="text-xs mb-3" style={{ fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>
              📦 MY CONTENT
            </Text>
            {myContentItems.map((item, index) => (
              <MenuButton key={index} item={item} />
            ))}
          </View>

          {/* Tools & Features Section */}
          <View className="mb-5">
            <Text className="text-xs mb-3" style={{ fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>
              🛠️ TOOLS & FEATURES
            </Text>
            {toolsItems.map((item, index) => (
              <MenuButton key={index} item={item} />
            ))}
          </View>

          {/* Share on Social Media */}
          <View className="mb-5">
            <Text className="text-xs mb-3" style={{ fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>
              🌐 SHARE & CONNECT
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
                      Linking.openURL('https://twitter.com');
                    }}
                    style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="logo-twitter" size={20} color="white" />
                  </Pressable>
                  <Pressable 
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      Linking.openURL('https://linkedin.com');
                    }}
                    style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#0077b5', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="logo-linkedin" size={20} color="white" />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          {/* Settings Section */}
          <View className="mb-5">
            <Text className="text-xs mb-3" style={{ fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>
              ⚙️ SETTINGS
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
                  💎 Invite Friends
                </Text>
                <Text className="text-sm" style={{ color: '#6b7280', fontWeight: '500' }}>
                  Earn 20 credits per friend
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
    </SafeAreaView>
  );
}
