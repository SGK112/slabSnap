import React from "react";
import { View, Text, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../nav";
import { useListingsStore } from "../state/listingsStore";
import { Ionicons } from "@expo/vector-icons";

type RouteType = RouteProp<RootStackParamList, "UserProfile">;

export default function UserProfileScreen() {
  const route = useRoute<RouteType>();
  const { userId } = route.params;
  const { listings } = useListingsStore();

  const userListings = listings.filter((listing) => listing.sellerId === userId);
  const activeListings = userListings.filter((l) => l.status === "active");

  // Get seller info from first listing
  const sellerInfo = userListings[0];

  if (!sellerInfo) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Ionicons name="person-outline" size={64} color="#d1d5db" />
        <Text className="text-lg font-semibold text-gray-500 mt-4">
          User not found
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-white px-4 pt-4 pb-6 mb-4">
          <View className="items-center mb-6">
            <View className="w-24 h-24 bg-gray-200 rounded-full items-center justify-center mb-4">
              <Ionicons name="person" size={48} color="#6b7280" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-4">
              {sellerInfo.sellerName}
            </Text>
            <View className="flex-row items-center">
              <Ionicons name="star" size={16} color="#fbbf24" />
              <Text className="text-base font-semibold text-gray-900 ml-1">
                {sellerInfo.sellerRating.toFixed(1)}
              </Text>
              <Text className="text-sm text-gray-600 ml-1">rating</Text>
            </View>
          </View>

          {/* Stats */}
          <View className="flex-row">
            <View className="flex-1 items-center py-3 border-r border-gray-200">
              <Text className="text-2xl font-bold text-gray-900">
                {activeListings.length}
              </Text>
              <Text className="text-sm text-gray-600 mt-1">Active</Text>
            </View>
            <View className="flex-1 items-center py-3">
              <Text className="text-2xl font-bold text-gray-900">
                {userListings.length}
              </Text>
              <Text className="text-sm text-gray-600 mt-1">Total Listings</Text>
            </View>
          </View>
        </View>

        {/* Listings */}
        <View className="px-4">
          <Text className="text-xl font-bold text-gray-900 mb-4">
            Listings ({activeListings.length})
          </Text>

          {activeListings.map((listing) => (
            <View
              key={listing.id}
              className="bg-white rounded-2xl overflow-hidden mb-4 border border-gray-200"
            >
              <View className="flex-row">
                <Image
                  source={{ uri: listing.images[0] }}
                  className="w-32 h-32"
                  resizeMode="cover"
                />
                <View className="flex-1 p-4">
                  <Text className="text-lg font-bold text-gray-900 mb-1" numberOfLines={1}>
                    {listing.title}
                  </Text>
                  <Text className="text-sm text-gray-500 mb-2">
                    {listing.stoneType}
                  </Text>
                  <Text className="text-xl font-bold text-gray-900 mb-2">
                    ${listing.price}
                  </Text>
                  <View className="flex-row items-center">
                    <Ionicons name="location" size={12} color="#6b7280" />
                    <Text className="text-xs text-gray-600 ml-1">
                      {listing.location}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}

          {activeListings.length === 0 && (
            <View className="items-center justify-center py-16">
              <Ionicons name="cube-outline" size={64} color="#d1d5db" />
              <Text className="text-lg font-semibold text-gray-500 mt-4">
                No active listings
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
