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
import { useAuthStore } from "../state/authStore";
import { useListingsStore } from "../state/listingsStore";
import { useGamificationStore } from "../state/gamificationStore";
import { StoneType, ListingType, ListingPiece } from "../types/marketplace";
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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stoneType, setStoneType] = useState<StoneType>("Granite");
  const [listingType, setListingType] = useState<ListingType>("Slab");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [thickness, setThickness] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  
  // New: Multiple pieces support
  const [pieces, setPieces] = useState<Array<{
    id: string;
    length: string;
    width: string;
    thickness: string;
    notes: string;
  }>>([]);
  const [totalQuantity, setTotalQuantity] = useState("");
  const [quantityUnit, setQuantityUnit] = useState<"pieces" | "sq_ft" | "linear_ft" | "slabs" | "tiles" | "boxes">("pieces");

  const takePhoto = async () => {
    if (images.length >= 7) {
      Alert.alert("Limit Reached", "You can add up to 7 photos per listing");
      return;
    }

    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== "granted") {
      Alert.alert("Camera Permission", "We need camera access to take photos of your stone");
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

  const handleSubmit = () => {
    // Check auth first
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

    const newListing = {
      id: "listing-" + Date.now(),
      sellerId: user.id,
      sellerName: user.name,
      sellerAvatar: user.avatar,
      sellerRating: user.rating,
      title: title.trim(),
      description: description.trim(),
      category: "Stone" as const,
      stoneType,
      listingType,
      price: parseFloat(price),
      images,
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
      expiresAt: Date.now() + 72 * 60 * 60 * 1000, // 72 hours
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
          <Text className="text-3xl mb-2" style={{ fontWeight: '600', color: '#0f172a', letterSpacing: -0.5 }}>
            Create Listing
          </Text>
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
          {/* Images */}
          <Text className="text-base mb-4" style={{ fontWeight: '600', color: '#0f172a' }}>
            Photos
          </Text>
          
          {images.length === 0 ? (
            <View className="mb-8">
              <Pressable
                className="rounded-2xl p-12 items-center justify-center mb-4"
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
                <View className="w-20 h-20 rounded-full items-center justify-center mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                  <Ionicons name="camera" size={40} color="white" />
                </View>
                <Text className="text-lg mb-2" style={{ fontWeight: '600', color: 'white' }}>
                  Take a Photo
                </Text>
                <Text className="text-sm text-center" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Snap a picture of your stone
                </Text>
              </Pressable>
              
              <Pressable
                className="rounded-2xl p-12 items-center justify-center"
                style={{ 
                  backgroundColor: 'white', 
                  borderWidth: 2, 
                  borderColor: '#e5e7eb',
                  borderStyle: 'dashed'
                }}
                onPress={pickImage}
              >
                <Ionicons name="images-outline" size={40} color="#6b7280" />
                <Text className="text-base mt-4" style={{ fontWeight: '600', color: '#0f172a' }}>
                  Or Choose from Gallery
                </Text>
                <Text className="text-sm text-center mt-1" style={{ color: '#9ca3af' }}>
                  Select up to 7 photos
                </Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8">
              {images.map((uri, index) => (
                <View key={index} className="mr-4 relative">
                  <Image source={{ uri }} style={{ 
                    width: 144, 
                    height: 144, 
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
                    <Ionicons name="close" size={16} color="white" />
                  </Pressable>
                  <View className="absolute bottom-3 left-3 px-3 py-1 rounded-lg" style={{ backgroundColor: 'rgba(15,23,42,0.9)' }}>
                    <Text className="text-white text-sm" style={{ fontWeight: '600' }}>{index + 1}</Text>
                  </View>
                </View>
              ))}
              {images.length < 7 && (
                <>
                  <Pressable
                    className="w-36 h-36 rounded-2xl items-center justify-center mr-4"
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
                    <Ionicons name="camera" size={28} color="white" />
                    <Text className="text-sm text-white mt-2" style={{ fontWeight: '600' }}>Take Photo</Text>
                  </Pressable>
                  <Pressable
                    className="w-36 h-36 rounded-2xl items-center justify-center"
                    style={{ backgroundColor: 'white', borderWidth: 2, borderColor: '#e5e7eb', borderStyle: 'dashed' }}
                    onPress={pickImage}
                  >
                    <Ionicons name="images-outline" size={28} color="#9ca3af" />
                    <Text className="text-sm mt-2" style={{ color: '#6b7280', fontWeight: '600' }}>Gallery</Text>
                  </Pressable>
                </>
              )}
            </ScrollView>
          )}

          {/* Title */}
          <Text className="text-base mb-3" style={{ fontWeight: '600', color: '#0f172a' }}>Title</Text>
          <View style={{ position: "relative", marginBottom: 24 }}>
            <TextInput
              className="rounded-xl px-5 py-4 text-base"
              style={{ backgroundColor: 'white', borderWidth: 2, borderColor: '#e5e7eb', color: '#0f172a', paddingRight: 60 }}
              placeholder="e.g. Premium Carrara Marble Slab"
              placeholderTextColor="#9ca3af"
              value={title}
              onChangeText={setTitle}
            />
            <AIWriterButton
              value={title}
              onValueChange={setTitle}
              fieldType="title"
              context={`${stoneType} ${listingType}`}
            />
          </View>

          {/* Description */}
          <Text className="text-base mb-3" style={{ fontWeight: '600', color: '#0f172a' }}>
            Description
          </Text>
          <View style={{ position: "relative", marginBottom: 24 }}>
            <TextInput
              className="rounded-xl px-5 py-4 text-base"
              style={{ backgroundColor: 'white', borderWidth: 2, borderColor: '#e5e7eb', color: '#0f172a', minHeight: 120, paddingRight: 60 }}
              placeholder="Describe the stone, condition, and any details..."
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
              context={`${stoneType} ${listingType}, ${title}`}
            />
          </View>

          {/* Stone Type */}
          <Text className="text-base mb-4" style={{ fontWeight: '600', color: '#0f172a' }}>
            Stone Type
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8">
            {STONE_TYPES.map((type) => (
              <Pressable
                key={type}
                className="px-6 py-3 rounded-full mr-3"
                style={{
                  backgroundColor: stoneType === type ? '#2563eb' : 'white',
                  borderWidth: 2,
                  borderColor: stoneType === type ? '#2563eb' : '#e5e7eb',
                  shadowColor: stoneType === type ? '#2563eb' : '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: stoneType === type ? 0.3 : 0.05,
                  shadowRadius: 4,
                  elevation: stoneType === type ? 4 : 1,
                }}
                onPress={() => setStoneType(type)}
              >
                <Text
                  className="text-base"
                  style={{
                    fontWeight: '600',
                    color: stoneType === type ? 'white' : '#374151'
                  }}
                >
                  {type}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Listing Type */}
          <Text className="text-base mb-4" style={{ fontWeight: '600', color: '#0f172a' }}>
            Listing Type
          </Text>
          <View className="flex-row mb-8">
            <Pressable
              className="flex-1 py-4 rounded-xl mr-3 items-center"
              style={{
                backgroundColor: listingType === "Slab" ? '#2563eb' : 'white',
                borderWidth: 2,
                borderColor: listingType === "Slab" ? '#2563eb' : '#e5e7eb',
                shadowColor: listingType === "Slab" ? '#2563eb' : '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: listingType === "Slab" ? 0.3 : 0.05,
                shadowRadius: 4,
                elevation: listingType === "Slab" ? 4 : 1,
              }}
              onPress={() => setListingType("Slab")}
            >
              <Text
                className="text-base"
                style={{
                  fontWeight: '600',
                  color: listingType === "Slab" ? 'white' : '#374151'
                }}
              >
                Slab
              </Text>
            </Pressable>
            <Pressable
              className="flex-1 py-4 rounded-xl ml-3 items-center"
              style={{
                backgroundColor: listingType === "Remnant" ? '#2563eb' : 'white',
                borderWidth: 2,
                borderColor: listingType === "Remnant" ? '#2563eb' : '#e5e7eb',
                shadowColor: listingType === "Remnant" ? '#2563eb' : '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: listingType === "Remnant" ? 0.3 : 0.05,
                shadowRadius: 4,
                elevation: listingType === "Remnant" ? 4 : 1,
              }}
              onPress={() => setListingType("Remnant")}
            >
              <Text
                className="text-base"
                style={{
                  fontWeight: '600',
                  color: listingType === "Remnant" ? 'white' : '#374151'
                }}
              >
                Remnant
              </Text>
            </Pressable>
          </View>

          {/* Price & Location */}
          <View className="flex-row mb-6">
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
          <View style={{ marginBottom: 24 }}>
            <Text className="text-base mb-3" style={{ fontWeight: '600', color: '#0f172a' }}>
              Quantity / Inventory
            </Text>
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
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
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        borderRadius: 10,
                        marginRight: 8,
                        backgroundColor: quantityUnit === unit ? '#2563eb' : 'white',
                        borderWidth: 2,
                        borderColor: quantityUnit === unit ? '#2563eb' : '#e5e7eb',
                      }}
                    >
                      <Text style={{
                        fontSize: 14,
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
          <View style={{ marginBottom: 24 }}>
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
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 10,
                }}
              >
                <Ionicons name="add" size={20} color="white" />
                <Text style={{ fontSize: 14, fontWeight: '600', color: 'white' }}>Add Piece</Text>
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
                  borderRadius: 16,
                  padding: 24,
                  alignItems: 'center',
                }}
              >
                <Ionicons name="cube-outline" size={40} color="#9ca3af" />
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151', marginTop: 12 }}>
                  Track Individual Pieces
                </Text>
                <Text style={{ fontSize: 13, color: '#9ca3af', marginTop: 4, textAlign: 'center' }}>
                  Add dimensions for each piece separately
                </Text>
              </Pressable>
            ) : (
              pieces.map((piece, index) => (
                <View
                  key={piece.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: '#e5e7eb',
                    padding: 16,
                    marginBottom: 12,
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#0f172a' }}>
                      Piece #{index + 1}
                    </Text>
                    <Pressable
                      onPress={() => setPieces(pieces.filter(p => p.id !== piece.id))}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: '#fee2e2',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#dc2626" />
                    </Pressable>
                  </View>

                  <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 6, fontWeight: '500' }}>Length</Text>
                      <TextInput
                        style={{
                          backgroundColor: '#f9fafb',
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: '#e5e7eb',
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          fontSize: 14,
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
                      <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 6, fontWeight: '500' }}>Width</Text>
                      <TextInput
                        style={{
                          backgroundColor: '#f9fafb',
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: '#e5e7eb',
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          fontSize: 14,
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
                      <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 6, fontWeight: '500' }}>Thick</Text>
                      <TextInput
                        style={{
                          backgroundColor: '#f9fafb',
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: '#e5e7eb',
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          fontSize: 14,
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
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 13,
                      color: '#0f172a',
                    }}
                    placeholder="Notes (e.g., chipped corner, polished edge)"
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
          <View className="flex-row mb-10">
            <View className="flex-1 mr-2">
              <TextInput
                className="rounded-xl px-5 py-4 text-base"
                style={{ backgroundColor: 'white', borderWidth: 2, borderColor: '#e5e7eb', color: '#0f172a' }}
                placeholder="Length"
                placeholderTextColor="#9ca3af"
                value={length}
                onChangeText={setLength}
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1 mx-2">
              <TextInput
                className="rounded-xl px-5 py-4 text-base"
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
                className="rounded-xl px-5 py-4 text-base"
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
    </SafeAreaView>
  );
}
