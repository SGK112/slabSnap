import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../nav";
import { useJobsStore } from "../state/jobsStore";
import { Job, JobCategory } from "../types/jobs";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function JobBoardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { jobs, loadMockJobs } = useJobsStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | JobCategory>("all");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const hasLoadedData = jobs.length > 0;
    if (!hasLoadedData) {
      loadMockJobs();
    }
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const filteredJobs = jobs.filter((job) => {
    if (job.status !== "open") return false;
    
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory =
      selectedCategory === "all" || job.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories: Array<"all" | JobCategory> = [
    "all",
    "Countertop Installation",
    "Backsplash",
    "Bathroom Vanity",
    "Fireplace Surround",
  ];

  const renderJobCard = (job: Job) => {
    const timeAgo = formatDistanceToNow(job.createdAt, { addSuffix: true });
    const budgetText = job.budget
      ? `$${job.budget.min.toLocaleString()} - $${job.budget.max.toLocaleString()}`
      : "Budget not specified";

    return (
      <Pressable
        key={job.id}
        className="bg-white rounded-2xl overflow-hidden mb-4 border border-gray-200"
        onPress={() => navigation.navigate("JobDetail", { jobId: job.id })}
      >
        {job.images.length > 0 && (
          <Image
            source={{ uri: job.images[0] }}
            className="w-full h-48"
            resizeMode="cover"
          />
        )}
        
        <View className="p-4">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1 mr-2">
              <Text className="text-lg font-bold text-gray-900 mb-1" numberOfLines={2}>
                {job.title}
              </Text>
              <View className="bg-amber-100 px-2 py-1 rounded-full self-start mb-2">
                <Text className="text-xs font-semibold text-amber-700">
                  {job.category}
                </Text>
              </View>
            </View>
          </View>

          <Text className="text-sm text-gray-600 mb-3" numberOfLines={2}>
            {job.description}
          </Text>

          <View className="flex-row items-center mb-2">
            <Ionicons name="location" size={16} color="#6b7280" />
            <Text className="text-sm text-gray-600 ml-1">{job.location}</Text>
          </View>

          <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="cash-outline" size={18} color="#10b981" />
              <Text className="text-base font-semibold text-gray-900 ml-2">
                {budgetText}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="briefcase-outline" size={16} color="#6b7280" />
              <Text className="text-sm text-gray-600 ml-1">
                {job.bidCount} {job.bidCount === 1 ? "bid" : "bids"}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center mt-2">
            <Ionicons name="time-outline" size={14} color="#9ca3af" />
            <Text className="text-xs text-gray-500 ml-1">Posted {timeAgo}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-4 pb-2 bg-white border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center flex-1">
            <Pressable
              onPress={() => navigation.goBack()}
              style={{ marginRight: 12 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#0f172a" />
            </Pressable>
            <Text className="text-3xl font-bold text-gray-900">Job Board</Text>
          </View>
          <Pressable
            className="bg-amber-500 rounded-full px-4 py-2"
            onPress={() => navigation.navigate("PostJob")}
          >
            <Text className="text-white font-semibold">Post Job</Text>
          </Pressable>
        </View>

        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 mb-3">
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            className="flex-1 ml-2 text-base"
            placeholder="Search jobs..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-2"
        >
          {categories.map((category) => (
            <Pressable
              key={category}
              className={`px-4 py-2 rounded-full mr-2 ${
                selectedCategory === category ? "bg-amber-500" : "bg-gray-100"
              }`}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                className={`text-sm font-semibold ${
                  selectedCategory === category ? "text-white" : "text-gray-700"
                }`}
              >
                {category === "all" ? "All Jobs" : category}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredJobs.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Ionicons name="briefcase-outline" size={64} color="#d1d5db" />
            <Text className="text-lg font-semibold text-gray-500 mt-4">
              No jobs found
            </Text>
            <Text className="text-sm text-gray-400 mt-2 text-center px-8">
              {searchQuery || selectedCategory !== "all"
                ? "Try adjusting your filters"
                : "Be the first to post a job!"}
            </Text>
          </View>
        ) : (
          <>
            <Text className="text-sm text-gray-600 mb-4">
              {filteredJobs.length} {filteredJobs.length === 1 ? "job" : "jobs"} available
            </Text>
            {filteredJobs.map((job) => renderJobCard(job))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
