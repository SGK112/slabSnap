import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../nav";
import { useJobsStore } from "../state/jobsStore";
import { useAuthStore } from "../state/authStore";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";

type RouteType = RouteProp<RootStackParamList, "JobDetail">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, "JobDetail">;

export default function JobDetailScreen() {
  const route = useRoute<RouteType>();
  const navigation = useNavigation<NavigationProp>();
  const { jobId } = route.params;
  const { getJobById, getBidsByJob, addBid, acceptBid, rejectBid } = useJobsStore();
  const { user } = useAuthStore();

  const [showBidModal, setShowBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [bidMessage, setBidMessage] = useState("");
  const [bidTimeline, setBidTimeline] = useState("");

  const job = getJobById(jobId);
  const bids = getBidsByJob(jobId);

  if (!job) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Ionicons name="alert-circle-outline" size={64} color="#d1d5db" />
        <Text className="text-lg font-semibold text-gray-500 mt-4">
          Job not found
        </Text>
      </SafeAreaView>
    );
  }

  const timeAgo = formatDistanceToNow(job.createdAt, { addSuffix: true });
  const isJobOwner = user?.id === job.userId;
  const hasUserBid = user && bids.some((bid) => bid.contractorId === user.id);

  const handleSubmitBid = () => {
    if (!user) {
      setShowBidModal(false);
      navigation.navigate("Login");
      return;
    }

    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      Alert.alert("Error", "Please enter a valid bid amount");
      return;
    }

    if (!bidMessage.trim()) {
      Alert.alert("Error", "Please enter a message");
      return;
    }

    if (!bidTimeline.trim()) {
      Alert.alert("Error", "Please enter estimated timeline");
      return;
    }

    const newBid = {
      id: "bid-" + Date.now(),
      jobId: job.id,
      contractorId: user.id,
      contractorName: user.name,
      contractorAvatar: user.avatar,
      contractorRating: user.rating,
      amount: parseFloat(bidAmount),
      message: bidMessage.trim(),
      timeline: bidTimeline.trim(),
      createdAt: Date.now(),
      status: "pending" as const,
    };

    addBid(newBid);
    setShowBidModal(false);
    setBidAmount("");
    setBidMessage("");
    setBidTimeline("");
    Alert.alert("Success", "Your bid has been submitted!");
  };

  const handleAcceptBid = (bidId: string) => {
    Alert.alert(
      "Accept Bid",
      "Are you sure you want to accept this bid? All other bids will be rejected.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          onPress: () => {
            acceptBid(bidId);
            Alert.alert("Success", "Bid accepted! The contractor will be notified.");
          },
        },
      ]
    );
  };

  const handleRejectBid = (bidId: string) => {
    Alert.alert(
      "Reject Bid",
      "Are you sure you want to reject this bid?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: () => {
            rejectBid(bidId);
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1">
        {job.images.length > 0 && (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            {job.images.map((uri, index) => (
              <Image
                key={index}
                source={{ uri }}
                className="w-screen h-80"
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        )}

        <View className="px-4">
          <View className="mb-4">
            <View className="bg-amber-100 px-3 py-1 rounded-full self-start mb-2">
              <Text className="text-sm font-semibold text-amber-700">
                {job.category}
              </Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              {job.title}
            </Text>
            {job.budget && (
              <Text className="text-xl font-semibold text-green-600 mb-2">
                ${job.budget.min.toLocaleString()} - ${job.budget.max.toLocaleString()}
              </Text>
            )}
          </View>

          <View className="bg-gray-50 rounded-xl p-4 mb-4">
            <View className="flex-row items-center mb-3">
              <Ionicons name="location" size={20} color="#6b7280" />
              <Text className="text-base text-gray-700 ml-2">{job.location}</Text>
            </View>
            <View className="flex-row items-center mb-3">
              <Ionicons name="time" size={20} color="#6b7280" />
              <Text className="text-base text-gray-700 ml-2">Posted {timeAgo}</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="briefcase" size={20} color="#6b7280" />
              <Text className="text-base text-gray-700 ml-2">
                {job.bidCount} {job.bidCount === 1 ? "bid" : "bids"} received
              </Text>
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-lg font-bold text-gray-900 mb-2">
              Description
            </Text>
            <Text className="text-base text-gray-700 leading-6">
              {job.description}
            </Text>
          </View>

          <Pressable
            className="bg-gray-50 rounded-xl p-4 mb-4"
            onPress={() =>
              navigation.navigate("UserProfile", { userId: job.userId })
            }
          >
            <Text className="text-lg font-bold text-gray-900 mb-3">
              Posted By
            </Text>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="w-14 h-14 bg-gray-200 rounded-full items-center justify-center mr-3">
                  <Ionicons name="person" size={28} color="#6b7280" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900 mb-1">
                    {job.userName}
                  </Text>
                  <View className="flex-row items-center">
                    <Ionicons name="star" size={14} color="#fbbf24" />
                    <Text className="text-sm text-gray-600 ml-1">
                      {job.userRating.toFixed(1)} rating
                    </Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </View>
          </Pressable>

          {bids.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-bold text-gray-900 mb-3">
                Bids ({bids.length})
              </Text>
              {bids.map((bid) => (
                <View
                  key={bid.id}
                  className={`bg-white border rounded-xl p-4 mb-3 ${
                    bid.status === "accepted"
                      ? "border-green-500 bg-green-50"
                      : bid.status === "rejected"
                      ? "border-gray-300 bg-gray-50"
                      : "border-gray-200"
                  }`}
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-900">
                        {bid.contractorName}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <Ionicons name="star" size={12} color="#fbbf24" />
                        <Text className="text-sm text-gray-600 ml-1">
                          {bid.contractorRating.toFixed(1)}
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-lg font-bold text-green-600">
                        ${bid.amount.toLocaleString()}
                      </Text>
                      {bid.status === "accepted" && (
                        <View className="bg-green-500 px-2 py-1 rounded-full mt-1">
                          <Text className="text-xs font-semibold text-white">
                            Accepted
                          </Text>
                        </View>
                      )}
                      {bid.status === "rejected" && (
                        <View className="bg-gray-400 px-2 py-1 rounded-full mt-1">
                          <Text className="text-xs font-semibold text-white">
                            Rejected
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <Text className="text-sm text-gray-700 mb-2">{bid.message}</Text>
                  
                  <View className="flex-row items-center mb-3">
                    <Ionicons name="time-outline" size={14} color="#6b7280" />
                    <Text className="text-sm text-gray-600 ml-1">
                      Timeline: {bid.timeline}
                    </Text>
                  </View>

                  {isJobOwner && bid.status === "pending" && (
                    <View className="flex-row mt-2">
                      <Pressable
                        className="flex-1 bg-green-500 rounded-lg py-2 items-center mr-2"
                        onPress={() => handleAcceptBid(bid.id)}
                      >
                        <Text className="text-white font-semibold">Accept</Text>
                      </Pressable>
                      <Pressable
                        className="flex-1 bg-gray-200 rounded-lg py-2 items-center ml-2"
                        onPress={() => handleRejectBid(bid.id)}
                      >
                        <Text className="text-gray-700 font-semibold">Reject</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {!isJobOwner && job.status === "open" && !hasUserBid && (
        <View className="bg-white border-t border-gray-200 px-4 py-3">
          <Pressable
            className="bg-amber-500 rounded-xl py-4 items-center"
            onPress={() => setShowBidModal(true)}
          >
            <Text className="text-base font-semibold text-white">
              Submit a Bid
            </Text>
          </Pressable>
        </View>
      )}

      {hasUserBid && (
        <View className="bg-green-50 border-t border-green-200 px-4 py-3">
          <View className="flex-row items-center justify-center">
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text className="text-base font-semibold text-green-700 ml-2">
              You have submitted a bid
            </Text>
          </View>
        </View>
      )}

      <Modal
        visible={showBidModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBidModal(false)}
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="px-4 pt-4 pb-3 border-b border-gray-200 flex-row items-center">
            <Pressable onPress={() => setShowBidModal(false)} className="mr-3">
              <Ionicons name="close" size={28} color="#1f2937" />
            </Pressable>
            <Text className="text-2xl font-bold text-gray-900 flex-1">
              Submit Bid
            </Text>
          </View>

          <ScrollView className="flex-1 px-4 pt-6">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              Bid Amount ($)
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base mb-4"
              placeholder="Enter your bid amount"
              value={bidAmount}
              onChangeText={setBidAmount}
              keyboardType="numeric"
            />

            <Text className="text-base font-semibold text-gray-900 mb-2">
              Timeline
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base mb-4"
              placeholder="e.g. 2 weeks, 1 month"
              value={bidTimeline}
              onChangeText={setBidTimeline}
            />

            <Text className="text-base font-semibold text-gray-900 mb-2">
              Message to Client
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base mb-6"
              placeholder="Explain your approach, experience, and why you're the best fit..."
              value={bidMessage}
              onChangeText={setBidMessage}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <Pressable
              className="bg-amber-500 rounded-xl py-4 items-center mb-8"
              onPress={handleSubmitBid}
            >
              <Text className="text-white text-base font-semibold">
                Submit Bid
              </Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
