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
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useAuthStore } from "../state/authStore";
import { useListingsStore } from "../state/listingsStore";
import { useGamificationStore } from "../state/gamificationStore";
import {
  MaterialCategory,
  StoneType,
  ListingType,
  ListingPiece,
  CATEGORY_CONFIG,
  getSubcategoriesForCategory,
  getCategoryIcon,
} from "../types/marketplace";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { TabParamList } from "../nav";
import { AIWriterButton } from "../components/AIWriterButton";

type NavigationProp = BottomTabNavigationProp<TabParamList, "Add">;

const STONE_TYPES: StoneType[] = [
  "Granite",
  "Marble",
  "Quartzite",
  "Quartz",
  "Soapstone",
  "Limestone",
  "Travertine",
  "Slate",
  "Onyx",
  "Other",
];

export default function CreateListingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const { addListing, listings } = useListingsStore();
  const { unlockAchievement } = useGamificationStore();

  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<MaterialCategory>("Kitchen");
  const [subcategory, setSubcategory] = useState<string>("Cabinets");
  const [stoneType, setStoneType] = useState<StoneType>("Granite");
  const [listingType, setListingType] = useState<ListingType>("New");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [thickness, setThickness] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Multiple pieces support
  const [pieces, setPieces] = useState<Array<{
    id: string;
    length: string;
    width: string;
    thickness: string;
    notes: string;
  }>>([]);
  const [totalQuantity, setTotalQuantity] = useState("");
  const [quantityUnit, setQuantityUnit] = useState<"pieces" | "sq_ft" | "linear_ft" | "slabs" | "tiles" | "boxes">("pieces");

  // Get subcategories for current category
  const currentSubcategories = getSubcategoriesForCategory(category);
  const currentCategoryIcon = getCategoryIcon(category);

  // Handle category change - reset subcategory
  const handleCategoryChange = (newCategory: MaterialCategory) => {
    setCategory(newCategory);
    const subs = getSubcategoriesForCategory(newCategory);
    setSubcategory(subs[0] || "Other");
    setShowCategoryModal(false);
  };

  const takePhoto = async () => {
    if (images.length >= 7) {
      Alert.alert("Limit Reached", "You can add up to 7 photos per listing");
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Camera Permission", "We need camera access to take photos of your item");
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

  const pickImage = async () => {
    if (images.length >= 7) {
      Alert.alert("Limit Reached", "You can add up to 7 photos per listing");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.9,
      allowsMultipleSelection: true,
      selectionLimit: 7 - images.length,
    });

    if (!result.canceled) {
      const newImages = result.assets.map(asset => asset.uri);
      setImages([...images, ...newImages].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const pickVideo = async () => {
    if (videos.length >= 2) {
      Alert.alert("Limit Reached", "You can add up to 2 videos per listing");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      allowsEditing: true,
      quality: 0.8,
      videoMaxDuration: 60, // 60 seconds max
    });

    if (!result.canceled) {
      setVideos([...videos, result.assets[0].uri]);
    }
  };

  const removeVideo = (index: number) => {
    setVideos(videos.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!user) {
      navigation.navigate("Login" as any);
      return;
    }

    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Error", "Please enter a description");
      return;
    }

    if (images.length === 0) {
      Alert.alert("Error", "Please add at least one image");
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      Alert.alert("Error", "Please enter a valid price");
      return;
    }

    if (!location.trim()) {
      Alert.alert("Error", "Please enter a location");
      return;
    }

    // Build pieces array
    const listingPieces: ListingPiece[] = pieces
      .filter(p => p.length && p.width)
      .map((p, index) => ({
        id: `piece-${Date.now()}-${index}`,
        pieceNumber: index + 1,
        dimensions: {
          length: parseFloat(p.length),
          width: parseFloat(p.width),
          thickness: p.thickness ? parseFloat(p.thickness) : undefined,
        },
        notes: p.notes || undefined,
      }));

    // Determine stone type for Stone & Tile category
    const isStoneCategory = category === "Stone & Tile";
    const isSlabSubcategory = subcategory.includes("Slab") || subcategory === "Remnants";

    const newListing = {
      id: "listing-" + Date.now(),
      sellerId: user.id,
      sellerName: user.name,
      sellerAvatar: user.avatar,
      sellerRating: user.rating,
      title: title.trim(),
      description: description.trim(),
      category,
      subcategory,
      stoneType: isStoneCategory && isSlabSubcategory ? stoneType : undefined,
      listingType,
      price: parseFloat(price),
      images,
      videos: videos.length > 0 ? videos : undefined,
      location: location.trim(),
      dimensions:
        length && width && thickness
          ? {
              length: parseFloat(length),
              width: parseFloat(width),
              thickness: parseFloat(thickness),
            }
          : undefined,
      pieces: listingPieces.length > 0 ? listingPieces : undefined,
      totalQuantity: totalQuantity ? parseInt(totalQuantity) : (pieces.length || undefined),
      quantityUnit: quantityUnit,
      status: "active" as const,
      createdAt: Date.now(),
      expiresAt: Date.now() + 72 * 60 * 60 * 1000,
      views: 0,
    };

    addListing(newListing);

    // Unlock achievement for first listing
    if (user) {
      const userListings = listings.filter(l => l.sellerId === user.id);
      if (userListings.length === 0) {
        unlockAchievement("first_listing");
      }
    }

    // Show success message
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      // Reset form
      setImages([]);
      setVideos([]);
      setTitle("");
      setDescription("");
      setPrice("");
      setLocation("");
      setLength("");
      setWidth("");
      setThickness("");
      setPieces([]);
      setTotalQuantity("");
      setQuantityUnit("pieces");
      navigation.navigate("Home");
    }, 2000);
  };

  if (showSuccess) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <View className="items-center px-8">
          <View className="w-16 h-16 rounded-full items-center justify-center mb-4" style={{ backgroundColor: '#dcfce7' }}>
            <Ionicons name="checkmark-circle" size={40} color="#16a34a" />
          </View>
          <Text className="text-2xl mb-2" style={{ fontWeight: '300', color: '#0f172a', letterSpacing: -0.5 }}>
            Listing Posted
          </Text>
          <Text className="text-sm text-center" style={{ color: '#64748b' }}>
            Your listing is now live and will expire in 72 hours
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
        <View className="px-6 pt-5 pb-4" style={{ backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }}>
          <View className="flex-row items-center mb-2">
            <Pressable
              onPress={() => navigation.goBack()}
              className="mr-4 p-2 -ml-2"
              style={{ borderRadius: 8 }}
            >
              <Ionicons name="arrow-back" size={24} color="#0f172a" />
            </Pressable>
            <Text className="text-3xl flex-1" style={{ fontWeight: '600', color: '#0f172a', letterSpacing: -0.5 }}>
              Create Listing
            </Text>
          </View>
          {user && (
            <View className="flex-row items-center">
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#10b981',
                marginRight: 8
              }} />
              <Text className="text-sm" style={{ color: '#64748b', fontWeight: '500' }}>
                Logged in as {user.name}
              </Text>
            </View>
          )}
          {!user && (
            <View className="flex-row items-center">
              <Ionicons name="alert-circle-outline" size={16} color="#f59e0b" style={{ marginRight: 6 }} />
              <Text className="text-sm" style={{ color: '#f59e0b', fontWeight: '500' }}>
                You will need to log in to post
              </Text>
            </View>
          )}
        </View>

        <ScrollView className="flex-1 px-6 pt-6" style={{ backgroundColor: '#fafafa' }} keyboardShouldPersistTaps="handled">
          {/* Category Selector Button */}
          <Text className="text-base mb-3" style={{ fontWeight: '600', color: '#0f172a' }}>
            Category
          </Text>
          <Pressable
            onPress={() => setShowCategoryModal(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'white',
              borderRadius: 16,
              borderWidth: 2,
              borderColor: '#2563eb',
              padding: 16,
              marginBottom: 16,
            }}
          >
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: '#eff6ff',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 16,
            }}>
              <Ionicons name={currentCategoryIcon as any} size={24} color="#2563eb" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: '600', color: '#0f172a' }}>{category}</Text>
              <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }}>{subcategory}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9ca3af" />
          </Pressable>

          {/* Subcategory Pills */}
          <Text className="text-base mb-3" style={{ fontWeight: '600', color: '#0f172a' }}>
            Type
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
            {currentSubcategories.map((sub) => (
              <Pressable
                key={sub}
                className="px-5 py-3 rounded-full mr-3"
                style={{
                  backgroundColor: subcategory === sub ? '#2563eb' : 'white',
                  borderWidth: 2,
                  borderColor: subcategory === sub ? '#2563eb' : '#e5e7eb',
                }}
                onPress={() => setSubcategory(sub)}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: subcategory === sub ? 'white' : '#374151'
                  }}
                >
                  {sub}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Stone Type - Only show for Stone & Tile slabs */}
          {category === "Stone & Tile" && (subcategory.includes("Slab") || subcategory === "Remnants") && (
            <>
              <Text className="text-base mb-3" style={{ fontWeight: '600', color: '#0f172a' }}>
                Stone Type
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                {STONE_TYPES.map((type) => (
                  <Pressable
                    key={type}
                    className="px-5 py-3 rounded-full mr-3"
                    style={{
                      backgroundColor: stoneType === type ? '#8b5cf6' : 'white',
                      borderWidth: 2,
                      borderColor: stoneType === type ? '#8b5cf6' : '#e5e7eb',
                    }}
                    onPress={() => setStoneType(type)}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: stoneType === type ? 'white' : '#374151'
                      }}
                    >
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}

          {/* Images */}
          <Text className="text-base mb-4" style={{ fontWeight: '600', color: '#0f172a' }}>
            Photos
          </Text>

          {images.length === 0 ? (
            <View className="mb-6">
              <Pressable
                className="rounded-2xl p-10 items-center justify-center mb-4"
                style={{
                  backgroundColor: '#2563eb',
                  shadowColor: '#2563eb',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
                onPress={takePhoto}
              >
                <View className="w-16 h-16 rounded-full items-center justify-center mb-3" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <Ionicons name="camera" size={32} color="white" />
                </View>
                <Text className="text-base mb-1" style={{ fontWeight: '600', color: 'white' }}>
                  Take a Photo
                </Text>
                <Text className="text-sm text-center" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Snap a picture of your item
                </Text>
              </Pressable>

              <Pressable
                className="rounded-2xl p-10 items-center justify-center"
                style={{
                  backgroundColor: 'white',
                  borderWidth: 2,
                  borderColor: '#e5e7eb',
                  borderStyle: 'dashed'
                }}
                onPress={pickImage}
              >
                <Ionicons name="images-outline" size={32} color="#6b7280" />
                <Text className="text-base mt-3" style={{ fontWeight: '600', color: '#0f172a' }}>
                  Or Choose from Gallery
                </Text>
                <Text className="text-sm text-center mt-1" style={{ color: '#9ca3af' }}>
                  Select up to 7 photos
                </Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
              {images.map((uri, index) => (
                <View key={index} className="mr-4 relative">
                  <Image source={{ uri }} style={{
                    width: 120,
                    height: 120,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: '#e5e7eb'
                  }} />
                  <Pressable
                    className="absolute top-2 right-2 w-7 h-7 rounded-full items-center justify-center"
                    style={{ backgroundColor: '#ef4444' }}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close" size={14} color="white" />
                  </Pressable>
                  <View className="absolute bottom-2 left-2 px-2 py-1 rounded" style={{ backgroundColor: 'rgba(15,23,42,0.9)' }}>
                    <Text className="text-white text-xs" style={{ fontWeight: '600' }}>{index + 1}</Text>
                  </View>
                </View>
              ))}
              {images.length < 7 && (
                <>
                  <Pressable
                    className="w-30 h-30 rounded-xl items-center justify-center mr-3"
                    style={{
                      width: 120,
                      height: 120,
                      backgroundColor: '#2563eb',
                    }}
                    onPress={takePhoto}
                  >
                    <Ionicons name="camera" size={24} color="white" />
                    <Text className="text-xs text-white mt-2" style={{ fontWeight: '600' }}>Take Photo</Text>
                  </Pressable>
                  <Pressable
                    className="w-30 h-30 rounded-xl items-center justify-center"
                    style={{ width: 120, height: 120, backgroundColor: 'white', borderWidth: 2, borderColor: '#e5e7eb', borderStyle: 'dashed' }}
                    onPress={pickImage}
                  >
                    <Ionicons name="images-outline" size={24} color="#9ca3af" />
                    <Text className="text-xs mt-2" style={{ color: '#6b7280', fontWeight: '600' }}>Gallery</Text>
                  </Pressable>
                </>
              )}
            </ScrollView>
          )}

          {/* Videos Section */}
          <Text className="text-base mb-4" style={{ fontWeight: '600', color: '#0f172a' }}>
            Videos <Text style={{ fontWeight: '400', color: '#9ca3af', fontSize: 12 }}>(Optional - up to 60 sec)</Text>
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
            {videos.map((uri, index) => (
              <View key={index} className="mr-4 relative">
                <View style={{
                  width: 120,
                  height: 120,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: '#8b5cf6',
                  backgroundColor: '#f3e8ff',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Ionicons name="videocam" size={32} color="#8b5cf6" />
                  <Text style={{ fontSize: 10, color: '#8b5cf6', marginTop: 4, fontWeight: '600' }}>
                    Video {index + 1}
                  </Text>
                </View>
                <Pressable
                  className="absolute top-2 right-2 w-7 h-7 rounded-full items-center justify-center"
                  style={{ backgroundColor: '#ef4444' }}
                  onPress={() => removeVideo(index)}
                >
                  <Ionicons name="close" size={14} color="white" />
                </Pressable>
              </View>
            ))}
            {videos.length < 2 && (
              <Pressable
                className="rounded-xl items-center justify-center"
                style={{
                  width: 120,
                  height: 120,
                  backgroundColor: 'white',
                  borderWidth: 2,
                  borderColor: '#8b5cf6',
                  borderStyle: 'dashed'
                }}
                onPress={pickVideo}
              >
                <Ionicons name="videocam-outline" size={28} color="#8b5cf6" />
                <Text className="text-xs mt-2" style={{ color: '#8b5cf6', fontWeight: '600' }}>Add Video</Text>
                <Text className="text-xs mt-1" style={{ color: '#a78bfa', fontWeight: '500' }}>60s max</Text>
              </Pressable>
            )}
          </ScrollView>

          {/* Title */}
          <Text className="text-base mb-3" style={{ fontWeight: '600', color: '#0f172a' }}>Title</Text>
          <View style={{ position: "relative", marginBottom: 20 }}>
            <TextInput
              className="rounded-xl px-5 py-4 text-base"
              style={{ backgroundColor: 'white', borderWidth: 2, borderColor: '#e5e7eb', color: '#0f172a', paddingRight: 60 }}
              placeholder={`e.g. ${subcategory} - Brand/Model`}
              placeholderTextColor="#9ca3af"
              value={title}
              onChangeText={setTitle}
            />
            <AIWriterButton
              value={title}
              onValueChange={setTitle}
              fieldType="title"
              context={`${category} ${subcategory} ${listingType}`}
            />
          </View>

          {/* Description */}
          <Text className="text-base mb-3" style={{ fontWeight: '600', color: '#0f172a' }}>
            Description
          </Text>
          <View style={{ position: "relative", marginBottom: 20 }}>
            <TextInput
              className="rounded-xl px-5 py-4 text-base"
              style={{ backgroundColor: 'white', borderWidth: 2, borderColor: '#e5e7eb', color: '#0f172a', minHeight: 100, paddingRight: 60 }}
              placeholder="Describe the item, condition, and any details..."
              placeholderTextColor="#9ca3af"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <AIWriterButton
              value={description}
              onValueChange={setDescription}
              fieldType="description"
              context={`${category} ${subcategory} ${listingType}, ${title}`}
            />
          </View>

          {/* Condition */}
          <Text className="text-base mb-3" style={{ fontWeight: '600', color: '#0f172a' }}>
            Condition
          </Text>
          <View className="flex-row mb-6">
            <Pressable
              className="flex-1 py-4 rounded-xl mr-2 items-center"
              style={{
                backgroundColor: listingType === "New" ? '#10b981' : 'white',
                borderWidth: 2,
                borderColor: listingType === "New" ? '#10b981' : '#e5e7eb',
              }}
              onPress={() => setListingType("New")}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: listingType === "New" ? 'white' : '#374151'
                }}
              >
                New
              </Text>
            </Pressable>
            <Pressable
              className="flex-1 py-4 rounded-xl mx-1 items-center"
              style={{
                backgroundColor: listingType === "Used" ? '#f59e0b' : 'white',
                borderWidth: 2,
                borderColor: listingType === "Used" ? '#f59e0b' : '#e5e7eb',
              }}
              onPress={() => setListingType("Used")}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: listingType === "Used" ? 'white' : '#374151'
                }}
              >
                Used
              </Text>
            </Pressable>
            <Pressable
              className="flex-1 py-4 rounded-xl ml-2 items-center"
              style={{
                backgroundColor: listingType === "Surplus" ? '#8b5cf6' : 'white',
                borderWidth: 2,
                borderColor: listingType === "Surplus" ? '#8b5cf6' : '#e5e7eb',
              }}
              onPress={() => setListingType("Surplus")}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: listingType === "Surplus" ? 'white' : '#374151'
                }}
              >
                Surplus
              </Text>
            </Pressable>
          </View>

          {/* Price & Location */}
          <View className="flex-row mb-5">
            <View className="flex-1 mr-3">
              <Text className="text-base mb-3" style={{ fontWeight: '600', color: '#0f172a' }}>Price ($)</Text>
              <TextInput
                className="rounded-xl px-5 py-4 text-base"
                style={{ backgroundColor: 'white', borderWidth: 2, borderColor: '#e5e7eb', color: '#0f172a' }}
                placeholder="1200"
                placeholderTextColor="#9ca3af"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-base mb-3" style={{ fontWeight: '600', color: '#0f172a' }}>Location</Text>
              <TextInput
                className="rounded-xl px-5 py-4 text-base"
                style={{ backgroundColor: 'white', borderWidth: 2, borderColor: '#e5e7eb', color: '#0f172a' }}
                placeholder="City, State"
                placeholderTextColor="#9ca3af"
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>

          {/* Quantity & Unit */}
          <View style={{ marginBottom: 20 }}>
            <Text className="text-base mb-3" style={{ fontWeight: '600', color: '#0f172a' }}>
              Quantity
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <TextInput
                  className="rounded-xl px-5 py-4 text-base"
                  style={{ backgroundColor: 'white', borderWidth: 2, borderColor: '#e5e7eb', color: '#0f172a' }}
                  placeholder="e.g. 3"
                  placeholderTextColor="#9ca3af"
                  value={totalQuantity}
                  onChangeText={setTotalQuantity}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1.5 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {(["pieces", "slabs", "sq_ft"] as const).map((unit) => (
                    <Pressable
                      key={unit}
                      onPress={() => setQuantityUnit(unit)}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 14,
                        borderRadius: 10,
                        marginRight: 8,
                        backgroundColor: quantityUnit === unit ? '#2563eb' : 'white',
                        borderWidth: 2,
                        borderColor: quantityUnit === unit ? '#2563eb' : '#e5e7eb',
                      }}
                    >
                      <Text style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: quantityUnit === unit ? 'white' : '#374151'
                      }}>
                        {unit === "sq_ft" ? "sq ft" : unit}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>

          {/* Multiple Pieces */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text className="text-base" style={{ fontWeight: '600', color: '#0f172a' }}>
                Individual Pieces {pieces.length > 0 && `(${pieces.length})`}
              </Text>
              <Pressable
                onPress={() => {
                  const newPiece = {
                    id: `piece-${Date.now()}`,
                    length: "",
                    width: "",
                    thickness: "",
                    notes: "",
                  };
                  setPieces([...pieces, newPiece]);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  backgroundColor: '#8b5cf6',
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 8,
                }}
              >
                <Ionicons name="add" size={18} color="white" />
                <Text style={{ fontSize: 13, fontWeight: '600', color: 'white' }}>Add Piece</Text>
              </Pressable>
            </View>

            {pieces.length === 0 ? (
              <Pressable
                onPress={() => {
                  const newPiece = {
                    id: `piece-${Date.now()}`,
                    length: "",
                    width: "",
                    thickness: "",
                    notes: "",
                  };
                  setPieces([newPiece]);
                }}
                style={{
                  backgroundColor: 'white',
                  borderWidth: 2,
                  borderColor: '#e5e7eb',
                  borderStyle: 'dashed',
                  borderRadius: 12,
                  padding: 20,
                  alignItems: 'center',
                }}
              >
                <Ionicons name="cube-outline" size={32} color="#9ca3af" />
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 10 }}>
                  Track Individual Pieces
                </Text>
                <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 4, textAlign: 'center' }}>
                  Add dimensions for each piece separately
                </Text>
              </Pressable>
            ) : (
              pieces.map((piece, index) => (
                <View
                  key={piece.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: '#e5e7eb',
                    padding: 14,
                    marginBottom: 10,
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>
                      Piece #{index + 1}
                    </Text>
                    <Pressable
                      onPress={() => setPieces(pieces.filter(p => p.id !== piece.id))}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: '#fee2e2',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons name="trash-outline" size={16} color="#dc2626" />
                    </Pressable>
                  </View>

                  <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, fontWeight: '500' }}>Length</Text>
                      <TextInput
                        style={{
                          backgroundColor: '#f9fafb',
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: '#e5e7eb',
                          paddingHorizontal: 10,
                          paddingVertical: 8,
                          fontSize: 13,
                          color: '#0f172a',
                        }}
                        placeholder="0"
                        placeholderTextColor="#9ca3af"
                        value={piece.length}
                        onChangeText={(text) => {
                          const updated = pieces.map(p =>
                            p.id === piece.id ? { ...p, length: text } : p
                          );
                          setPieces(updated);
                        }}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, fontWeight: '500' }}>Width</Text>
                      <TextInput
                        style={{
                          backgroundColor: '#f9fafb',
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: '#e5e7eb',
                          paddingHorizontal: 10,
                          paddingVertical: 8,
                          fontSize: 13,
                          color: '#0f172a',
                        }}
                        placeholder="0"
                        placeholderTextColor="#9ca3af"
                        value={piece.width}
                        onChangeText={(text) => {
                          const updated = pieces.map(p =>
                            p.id === piece.id ? { ...p, width: text } : p
                          );
                          setPieces(updated);
                        }}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, fontWeight: '500' }}>Thick</Text>
                      <TextInput
                        style={{
                          backgroundColor: '#f9fafb',
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: '#e5e7eb',
                          paddingHorizontal: 10,
                          paddingVertical: 8,
                          fontSize: 13,
                          color: '#0f172a',
                        }}
                        placeholder="0"
                        placeholderTextColor="#9ca3af"
                        value={piece.thickness}
                        onChangeText={(text) => {
                          const updated = pieces.map(p =>
                            p.id === piece.id ? { ...p, thickness: text } : p
                          );
                          setPieces(updated);
                        }}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <TextInput
                    style={{
                      backgroundColor: '#f9fafb',
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#e5e7eb',
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      fontSize: 12,
                      color: '#0f172a',
                    }}
                    placeholder="Notes (optional)"
                    placeholderTextColor="#9ca3af"
                    value={piece.notes}
                    onChangeText={(text) => {
                      const updated = pieces.map(p =>
                        p.id === piece.id ? { ...p, notes: text } : p
                      );
                      setPieces(updated);
                    }}
                  />
                </View>
              ))
            )}
          </View>

          {/* Dimensions */}
          <Text className="text-base mb-3" style={{ fontWeight: '600', color: '#0f172a' }}>
            Dimensions (Optional)
          </Text>
          <View className="flex-row mb-8">
            <View className="flex-1 mr-2">
              <TextInput
                className="rounded-xl px-4 py-4 text-base"
                style={{ backgroundColor: 'white', borderWidth: 2, borderColor: '#e5e7eb', color: '#0f172a' }}
                placeholder="Length"
                placeholderTextColor="#9ca3af"
                value={length}
                onChangeText={setLength}
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1 mx-1">
              <TextInput
                className="rounded-xl px-4 py-4 text-base"
                style={{ backgroundColor: 'white', borderWidth: 2, borderColor: '#e5e7eb', color: '#0f172a' }}
                placeholder="Width"
                placeholderTextColor="#9ca3af"
                value={width}
                onChangeText={setWidth}
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1 ml-2">
              <TextInput
                className="rounded-xl px-4 py-4 text-base"
                style={{ backgroundColor: 'white', borderWidth: 2, borderColor: '#e5e7eb', color: '#0f172a' }}
                placeholder="Thick"
                placeholderTextColor="#9ca3af"
                value={thickness}
                onChangeText={setThickness}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Pressable
            className="rounded-xl py-5 items-center mb-10"
            style={{
              backgroundColor: '#2563eb',
              shadowColor: '#2563eb',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 6,
            }}
            onPress={handleSubmit}
          >
            <Text className="text-lg" style={{ fontWeight: '600', color: 'white' }}>
              {user ? "Post Listing" : "Log In to Post"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fafafa' }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#e5e7eb',
            backgroundColor: 'white',
          }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#0f172a' }}>Select Category</Text>
            <Pressable onPress={() => setShowCategoryModal(false)}>
              <Ionicons name="close" size={28} color="#6b7280" />
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1, padding: 16 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {CATEGORY_CONFIG.map((cat) => (
                <Pressable
                  key={cat.name}
                  onPress={() => handleCategoryChange(cat.name)}
                  style={{
                    width: '48%',
                    backgroundColor: category === cat.name ? '#2563eb' : 'white',
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 12,
                    borderWidth: 2,
                    borderColor: category === cat.name ? '#2563eb' : '#e5e7eb',
                    alignItems: 'center',
                  }}
                >
                  <View style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: category === cat.name ? 'rgba(255,255,255,0.2)' : '#eff6ff',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}>
                    <Ionicons
                      name={cat.icon as any}
                      size={28}
                      color={category === cat.name ? 'white' : '#2563eb'}
                    />
                  </View>
                  <Text style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: category === cat.name ? 'white' : '#0f172a',
                    textAlign: 'center',
                  }}>
                    {cat.name}
                  </Text>
                  <Text style={{
                    fontSize: 11,
                    color: category === cat.name ? 'rgba(255,255,255,0.8)' : '#9ca3af',
                    marginTop: 4,
                    textAlign: 'center',
                  }}>
                    {cat.subcategories.length} types
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
