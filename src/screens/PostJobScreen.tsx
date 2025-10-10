import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../nav";
import { useAuthStore } from "../state/authStore";
import { useJobsStore } from "../state/jobsStore";
import { JobCategory } from "../types/jobs";
import { Ionicons } from "@expo/vector-icons";
import { AIWriterButton } from "../components/AIWriterButton";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "PostJob">;

const JOB_CATEGORIES: JobCategory[] = [
  "Countertop Installation",
  "Backsplash",
  "Flooring",
  "Bathroom Vanity",
  "Fireplace Surround",
  "Custom Work",
  "Repair",
  "Other",
];

export default function PostJobScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const { addJob } = useJobsStore();

  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<JobCategory>("Countertop Installation");
  const [location, setLocation] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert("Limit Reached", "You can add up to 5 photos per job");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.9,
      allowsMultipleSelection: true,
      selectionLimit: 5 - images.length,
    });

    if (!result.canceled) {
      const newImages = result.assets.map((asset) => asset.uri);
      setImages([...images, ...newImages].slice(0, 5));
    }
  };

  const takePhoto = async () => {
    if (images.length >= 5) {
      Alert.alert("Limit Reached", "You can add up to 5 photos per job");
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Camera Permission", "We need camera access to take photos");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.9,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!user) {
      navigation.navigate("Login");
      return;
    }

    if (!title.trim()) {
      Alert.alert("Error", "Please enter a job title");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Error", "Please enter a description");
      return;
    }

    if (!location.trim()) {
      Alert.alert("Error", "Please enter a location");
      return;
    }

    const newJob = {
      id: "job-" + Date.now(),
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      userRating: user.rating,
      title: title.trim(),
      description: description.trim(),
      category,
      location: location.trim(),
      budget:
        minBudget && maxBudget
          ? {
              min: parseFloat(minBudget),
              max: parseFloat(maxBudget),
            }
          : undefined,
      images,
      status: "open" as const,
      createdAt: Date.now(),
      bidCount: 0,
    };

    addJob(newJob);

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setImages([]);
      setTitle("");
      setDescription("");
      setLocation("");
      setMinBudget("");
      setMaxBudget("");
      navigation.goBack();
    }, 2000);
  };

  if (showSuccess) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <View className="items-center px-8">
          <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4">
            <Ionicons name="checkmark-circle" size={48} color="#10b981" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Job Posted!
          </Text>
          <Text className="text-base text-gray-600 text-center">
            Contractors will start bidding on your job soon
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#fafafa' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="px-6 pt-5 pb-4 flex-row items-center" style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
          <Pressable onPress={() => navigation.goBack()} className="mr-4">
            <Ionicons name="close" size={32} color="#1f2937" />
          </Pressable>
          <Text className="text-3xl flex-1" style={{ fontWeight: '600', color: '#1f2937', letterSpacing: -0.5 }}>
            Post a Job
          </Text>
        </View>

        <ScrollView className="flex-1 px-6 pt-6" style={{ backgroundColor: '#fafafa' }} keyboardShouldPersistTaps="handled">
          <Text className="text-base mb-3" style={{ fontWeight: '600', color: '#1f2937' }}>
            Job Title
          </Text>
          <View style={{ position: "relative", marginBottom: 24 }}>
            <TextInput
              className="rounded-xl px-5 py-4 text-base"
              style={{ backgroundColor: 'white', borderWidth: 2, borderColor: '#e5e7eb', paddingRight: 60 }}
              placeholder="e.g. Kitchen Countertop Installation"
              placeholderTextColor="#9ca3af"
              value={title}
              onChangeText={setTitle}
            />
            <AIWriterButton
              value={title}
              onValueChange={setTitle}
              fieldType="job"
              context={`${category} - ${location}`}
            />
          </View>

          <Text className="text-base mb-3" style={{ fontWeight: '600', color: '#1f2937' }}>
            Description
          </Text>
          <View style={{ position: "relative", marginBottom: 24 }}>
            <TextInput
              className="rounded-xl px-5 py-4 text-base"
              style={{ backgroundColor: 'white', borderWidth: 2, borderColor: '#e5e7eb', minHeight: 140, paddingRight: 60 }}
              placeholder="Describe the job, requirements, and any details..."
              placeholderTextColor="#9ca3af"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            <AIWriterButton
              value={description}
              onValueChange={setDescription}
              fieldType="job"
              context={`${title} - ${category} - ${location}`}
            />
          </View>

          <Text className="text-base mb-4" style={{ fontWeight: '600', color: '#1f2937' }}>
            Category
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8">
            {JOB_CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                className="px-6 py-3 rounded-full mr-3"
                style={{
                  backgroundColor: category === cat ? '#f97316' : 'white',
                  borderWidth: 2,
                  borderColor: category === cat ? '#f97316' : '#e5e7eb',
                  shadowColor: category === cat ? '#f97316' : '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: category === cat ? 0.3 : 0.05,
                  shadowRadius: 4,
                  elevation: category === cat ? 4 : 1,
                }}
                onPress={() => setCategory(cat)}
              >
                <Text
                  className="text-base"
                  style={{ 
                    fontWeight: '600',
                    color: category === cat ? '#ffffff' : '#374151'
                  }}
                >
                  {cat}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text className="text-base mb-3" style={{ fontWeight: '600', color: '#1f2937' }}>
            Location
          </Text>
          <TextInput
            className="rounded-xl px-5 py-4 text-base mb-6"
            style={{ backgroundColor: 'white', borderWidth: 2, borderColor: '#e5e7eb' }}
            placeholder="City, State"
            placeholderTextColor="#9ca3af"
            value={location}
            onChangeText={setLocation}
          />

          <Text className="text-base mb-3" style={{ fontWeight: '600', color: '#1f2937' }}>
            Budget Range (Optional)
          </Text>
          <View className="flex-row mb-6">
            <View className="flex-1 mr-3">
              <TextInput
                className="rounded-xl px-5 py-4 text-base"
                style={{ backgroundColor: 'white', borderWidth: 2, borderColor: '#e5e7eb' }}
                placeholder="Min $"
                placeholderTextColor="#9ca3af"
                value={minBudget}
                onChangeText={setMinBudget}
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1 ml-3">
              <TextInput
                className="rounded-xl px-5 py-4 text-base"
                style={{ backgroundColor: 'white', borderWidth: 2, borderColor: '#e5e7eb' }}
                placeholder="Max $"
                placeholderTextColor="#9ca3af"
                value={maxBudget}
                onChangeText={setMaxBudget}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text className="text-base mb-4" style={{ fontWeight: '600', color: '#1f2937' }}>
            Photos (Optional)
          </Text>
          {images.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8">
              {images.map((uri, index) => (
                <View key={index} className="mr-4 relative">
                  <Image source={{ uri }} style={{ 
                    width: 160, 
                    height: 160, 
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: '#e5e7eb'
                  }} />
                  <Pressable
                    className="absolute top-3 right-3 w-8 h-8 rounded-full items-center justify-center"
                    style={{ 
                      backgroundColor: '#ef4444',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 4,
                      elevation: 4,
                    }}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close" size={18} color="white" />
                  </Pressable>
                </View>
              ))}
              {images.length < 5 && (
                <>
                  <Pressable
                    className="w-40 h-40 rounded-2xl items-center justify-center mr-4"
                    style={{ 
                      backgroundColor: '#f97316',
                      shadowColor: '#f97316',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                    onPress={takePhoto}
                  >
                    <Ionicons name="camera" size={36} color="white" />
                    <Text className="text-sm text-white mt-3" style={{ fontWeight: '600' }}>
                      Take Photo
                    </Text>
                  </Pressable>
                  <Pressable
                    className="w-40 h-40 rounded-2xl items-center justify-center"
                    style={{ backgroundColor: 'white', borderWidth: 2, borderColor: '#e5e7eb', borderStyle: 'dashed' }}
                    onPress={pickImage}
                  >
                    <Ionicons name="images" size={36} color="#9ca3af" />
                    <Text className="text-sm mt-3" style={{ color: '#6b7280', fontWeight: '600' }}>Gallery</Text>
                  </Pressable>
                </>
              )}
            </ScrollView>
          ) : (
            <View className="flex-row mb-8">
              <Pressable
                className="flex-1 rounded-2xl p-8 items-center mr-3"
                style={{ 
                  backgroundColor: '#f97316',
                  shadowColor: '#f97316',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
                onPress={takePhoto}
              >
                <Ionicons name="camera" size={36} color="white" />
                <Text className="text-base text-white mt-3" style={{ fontWeight: '600' }}>
                  Take Photo
                </Text>
              </Pressable>
              <Pressable
                className="flex-1 rounded-2xl p-8 items-center ml-3"
                style={{ backgroundColor: 'white', borderWidth: 2, borderColor: '#e5e7eb', borderStyle: 'dashed' }}
                onPress={pickImage}
              >
                <Ionicons name="images" size={36} color="#6b7280" />
                <Text className="text-base text-gray-700 mt-3" style={{ fontWeight: '600' }}>
                  Choose Photos
                </Text>
              </Pressable>
            </View>
          )}

          <Pressable
            className="rounded-xl py-5 items-center mb-10"
            style={{ 
              backgroundColor: '#f97316',
              shadowColor: '#f97316',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 6,
            }}
            onPress={handleSubmit}
          >
            <Text className="text-white text-lg" style={{ fontWeight: '600' }}>
              {user ? "Post Job" : "Log In to Post"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
