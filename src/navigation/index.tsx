import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import HomeScreen from "../screens/HomeScreen";
import MessagesScreen from "../screens/MessagesScreen";
import CreateListingScreen from "../screens/CreateListingScreen";
import MyListingsScreen from "../screens/MyListingsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ListingDetailScreen from "../screens/ListingDetailScreen";
import UserProfileScreen from "../screens/UserProfileScreen";
import ChatScreen from "../screens/ChatScreen";

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  MainTabs: undefined;
  ListingDetail: { listingId: string };
  UserProfile: { userId: string };
  Chat: { conversationId: string };
};

export type TabParamList = {
  Home: undefined;
  Messages: undefined;
  CreateListing: undefined;
  MyListings: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Messages") {
            iconName = focused ? "chatbubbles" : "chatbubbles-outline";
          } else if (route.name === "CreateListing") {
            iconName = focused ? "add-circle" : "add-circle-outline";
          } else if (route.name === "MyListings") {
            iconName = focused ? "list" : "list-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#f59e0b",
        tabBarInactiveTintColor: "#9ca3af",
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 0.5,
          borderTopColor: "#e5e7eb",
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: "Browse" }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{ tabBarLabel: "Messages" }}
      />
      <Tab.Screen
        name="CreateListing"
        component={CreateListingScreen}
        options={{ tabBarLabel: "Sell" }}
      />
      <Tab.Screen
        name="MyListings"
        component={MyListingsScreen}
        options={{ tabBarLabel: "My Listings" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: "Profile" }}
      />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
