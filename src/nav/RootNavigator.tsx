import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useGamificationStore } from "../state/gamificationStore";
import { useLanguageStore } from "../state/languageStore";
import { useVendorStore } from "../state/vendorStore";
import { useListingsStore } from "../state/listingsStore";
import { colors } from "../utils/colors";

import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import LandingScreen from "../screens/LandingScreen";
import HomeScreen from "../screens/HomeScreen";
import MessagesScreen from "../screens/MessagesScreen";
import CreateListingScreen from "../screens/CreateListingScreen";
import MyListingsScreen from "../screens/MyListingsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ListingDetailScreen from "../screens/ListingDetailScreen";
import UserProfileScreen from "../screens/UserProfileScreen";
import ChatScreen from "../screens/ChatScreen";
import JobBoardScreen from "../screens/JobBoardScreen";
import PostJobScreen from "../screens/PostJobScreen";
import JobDetailScreen from "../screens/JobDetailScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import PrivacyScreen from "../screens/PrivacyScreen";
import HelpSupportScreen from "../screens/HelpSupportScreen";
import FAQDetailScreen from "../screens/FAQDetailScreen";
import AboutRemnantsScreen from "../screens/AboutRemnantsScreen";
import MeasurementCameraScreen from "../screens/MeasurementCameraScreen";
import AdvancedMeasurementScreen from "../screens/AdvancedMeasurementScreen";
import SimpleMeasurementScreen from "../screens/SimpleMeasurementScreen";
import SmartMeasurementScreen from "../screens/SmartMeasurementScreen";
import MeasurementHomeScreen from "../screens/MeasurementHomeScreen";
import MeasurementCalculatorScreen from "../screens/MeasurementCalculatorScreen";
import CalibrationCameraScreen from "../screens/CalibrationCameraScreen";
import MapScreen from "../screens/MapScreen";
import ToolsScreen from "../screens/ToolsScreen";
import PlatformIntegrationsScreen from "../screens/PlatformIntegrationsScreen";
import VendorRelationshipsScreen from "../screens/VendorRelationshipsScreen";
import AIAssistantScreen from "../screens/AIAssistantScreen";
import CreateAdScreen from "../screens/CreateAdScreen";
import PurchaseAdCreditsScreen from "../screens/PurchaseAdCreditsScreen";
import ShopifyIntegrationScreen from "../screens/ShopifyIntegrationScreen";
import ProjectBoardScreen from "../screens/ProjectBoardScreen";
import VendorPortalScreen from "../screens/VendorPortalScreen";
import MaterialCatalogScreen from "../screens/MaterialCatalogScreen";
import SalesModeScreen from "../screens/SalesModeScreen";
import CalendarScreen from "../screens/CalendarScreen";
import CommunityBoardScreen from "../screens/CommunityBoardScreen";
import StyleQuizScreen from "../screens/StyleQuizScreen";
import InspirationFeedScreen from "../screens/InspirationFeedScreen";
import VendorDashboardScreen from "../screens/VendorDashboardScreen";
import CreatePromotionScreen from "../screens/CreatePromotionScreen";
import CreateQuoteScreen from "../screens/CreateQuoteScreen";
import SubscriptionScreen from "../screens/SubscriptionScreen";

export type RootStackParamList = {
  Landing: undefined;
  Login: undefined;
  Signup: undefined;
  MainTabs: undefined;
  ListingDetail: { listingId: string };
  UserProfile: { userId: string };
  Chat: { conversationId: string };
  JobBoard: undefined;
  PostJob: undefined;
  JobDetail: { jobId: string };
  MyJobs: undefined;
  MyListings: undefined;
  EditProfile: undefined;
  Notifications: undefined;
  Messages: undefined;
  Privacy: undefined;
  HelpSupport: undefined;
  FAQDetail: { faqId: string };
  AboutRemnants: undefined;
  MeasurementCamera: undefined;
  MeasurementHome: undefined;
  AdvancedMeasurement: undefined;
  SimpleMeasurement: undefined;
  SmartMeasurement: undefined;
  MeasurementCalculator: undefined;
  CalibrationCamera: { mode: "credit-card" | "dollar-bill"; onCalibrate: (pixelsPerInch: number) => void };
  PlatformIntegrations: undefined;
  VendorRelationships: undefined;
  AIAssistant: undefined;
  CreateAd: undefined;
  PurchaseAdCredits: undefined;
  ShopifyIntegration: undefined;
  ProjectBoard: undefined;
  VendorPortal: undefined;
  MaterialCatalog: undefined;
  SalesMode: undefined;
  Calendar: undefined;
  CommunityBoard: undefined;
  StyleQuiz: undefined;
  InspirationFeed: undefined;
  VendorDashboard: undefined;
  CreatePromotion: undefined;
  CreateQuote: { quoteRequest?: any; recipient?: any };
  Subscription: undefined;
};

export type TabParamList = {
  Home: undefined;
  Map: undefined;
  Tools: undefined;
  Add: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
  const { translations: t } = useLanguageStore();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Map") {
            iconName = focused ? "map" : "map-outline";
          } else if (route.name === "Tools") {
            iconName = focused ? "construct" : "construct-outline";
          } else if (route.name === "Add") {
            iconName = focused ? "add-circle" : "add-circle-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={28} color={color} />;
        },
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.neutral[500],
        headerShown: false,
        tabBarStyle: {
          height: 90,
          paddingBottom: 20,
          paddingTop: 12,
          backgroundColor: colors.background.primary,
          borderTopWidth: 2,
          borderTopColor: colors.primary[100],
          shadowColor: colors.primary[900],
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          marginTop: 4,
          letterSpacing: 0.3,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: t.common.browse }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{ tabBarLabel: "Map" }}
      />
      <Tab.Screen
        name="Tools"
        component={ToolsScreen}
        options={{ tabBarLabel: "Tools" }}
      />
      <Tab.Screen
        name="Add"
        component={CreateListingScreen}
        options={{ tabBarLabel: "Sell" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: t.common.profile }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { initializeAchievements } = useGamificationStore();
  const { vendors, loadMockVendors } = useVendorStore();
  const { listings, loadMockData } = useListingsStore();

  useEffect(() => {
    initializeAchievements();
    
    // Pre-load vendors and listings for fast app startup
    if (vendors.length === 0) {
      loadMockVendors();
    }
    if (listings.length === 0) {
      loadMockData();
    }
  }, [initializeAchievements]);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Landing"
        screenOptions={{
          headerShown: false,
          headerStyle: {
            backgroundColor: colors.background.secondary,
          },
          headerTintColor: colors.text.primary,
          headerTitleStyle: {
            color: colors.text.primary,
          },
        }}
      >
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{
            presentation: "modal",
            headerShown: true,
            headerTitle: "Log In",
          }}
        />
        <Stack.Screen 
          name="Signup" 
          component={SignupScreen}
          options={{
            presentation: "modal",
            headerShown: true,
            headerTitle: "Sign Up",
          }}
        />
        
        <Stack.Screen
          name="ListingDetail"
          component={ListingDetailScreen}
          options={{
            headerShown: true,
            headerTitle: "",
            headerTransparent: true,
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="UserProfile"
          component={UserProfileScreen}
          options={{
            headerShown: true,
            headerTitle: "",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="JobBoard"
          component={JobBoardScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="PostJob"
          component={PostJobScreen}
          options={{
            presentation: "modal",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="JobDetail"
          component={JobDetailScreen}
          options={{
            headerShown: true,
            headerTitle: "",
            headerTransparent: true,
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="MyListings"
          component={MyListingsScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Messages"
          component={MessagesScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Privacy"
          component={PrivacyScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="HelpSupport"
          component={HelpSupportScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="FAQDetail"
          component={FAQDetailScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="AboutRemnants"
          component={AboutRemnantsScreen}
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="MeasurementCamera"
          component={MeasurementCameraScreen}
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
          }}
        />
        <Stack.Screen
          name="MeasurementHome"
          component={MeasurementHomeScreen}
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="AdvancedMeasurement"
          component={AdvancedMeasurementScreen}
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
          }}
        />
        <Stack.Screen
          name="SimpleMeasurement"
          component={SimpleMeasurementScreen}
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
          }}
        />
        <Stack.Screen
          name="SmartMeasurement"
          component={SmartMeasurementScreen}
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
          }}
        />
        <Stack.Screen
          name="MeasurementCalculator"
          component={MeasurementCalculatorScreen}
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="CalibrationCamera"
          component={CalibrationCameraScreen}
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
          }}
        />
        <Stack.Screen
          name="PlatformIntegrations"
          component={PlatformIntegrationsScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="VendorRelationships"
          component={VendorRelationshipsScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="AIAssistant"
          component={AIAssistantScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="CreateAd"
          component={CreateAdScreen}
          options={{
            presentation: "modal",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="PurchaseAdCredits"
          component={PurchaseAdCreditsScreen}
          options={{
            presentation: "modal",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="ShopifyIntegration"
          component={ShopifyIntegrationScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="ProjectBoard"
          component={ProjectBoardScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="VendorPortal"
          component={VendorPortalScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="MaterialCatalog"
          component={MaterialCatalogScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="SalesMode"
          component={SalesModeScreen}
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
          }}
        />
        <Stack.Screen
          name="Calendar"
          component={CalendarScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="CommunityBoard"
          component={CommunityBoardScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="StyleQuiz"
          component={StyleQuizScreen}
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="InspirationFeed"
          component={InspirationFeedScreen}
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
          }}
        />
        <Stack.Screen
          name="VendorDashboard"
          component={VendorDashboardScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="CreatePromotion"
          component={CreatePromotionScreen}
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="CreateQuote"
          component={CreateQuoteScreen}
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="Subscription"
          component={SubscriptionScreen}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
