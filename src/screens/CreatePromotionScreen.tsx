import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { colors } from "../utils/colors";
import { useAuthStore } from "../state/authStore";
import { useSubscriptionStore } from "../state/subscriptionStore";
import { PromotionType } from "../types/subscriptions";
import { CATEGORY_CONFIG } from "../types/marketplace";

const PROMO_TYPES: { id: PromotionType; label: string; icon: string; description: string }[] = [
  {
    id: "flash_sale",
    label: "Flash Sale",
    icon: "flash-outline",
    description: "Limited time discount",
  },
  {
    id: "clearance",
    label: "Clearance",
    icon: "pricetag-outline",
    description: "Clearing inventory",
  },
  {
    id: "new_arrival",
    label: "New Arrival",
    icon: "sparkles-outline",
    description: "New product launch",
  },
  {
    id: "seasonal",
    label: "Seasonal",
    icon: "calendar-outline",
    description: "Holiday/seasonal sale",
  },
  {
    id: "contractor_only",
    label: "Trade Only",
    icon: "construct-outline",
    description: "Exclusive contractor pricing",
  },
  {
    id: "bundle",
    label: "Bundle Deal",
    icon: "gift-outline",
    description: "Buy together & save",
  },
  {
    id: "flyer",
    label: "Digital Flyer",
    icon: "document-outline",
    description: "Share your catalog",
  },
  {
    id: "announcement",
    label: "Announcement",
    icon: "megaphone-outline",
    description: "General update",
  },
];

export default function CreatePromotionScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { createPromotion, credits, spendCredits } = useSubscriptionStore();

  const [promoType, setPromoType] = useState<PromotionType>("flash_sale");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Discount settings
  const [discountType, setDiscountType] = useState<"percentage" | "fixed" | "none">("percentage");
  const [discountValue, setDiscountValue] = useState("");

  // Visibility
  const [visibility, setVisibility] = useState<"public" | "pro_only">("public");

  // Dates
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Feature boost
  const [isFeatured, setIsFeatured] = useState(false);
  const FEATURED_COST = 10; // Credits to feature

  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
    });

    if (!result.canceled) {
      const newImages = result.assets.map((a) => a.uri);
      setImages([...images, ...newImages].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else if (selectedCategories.length < 5) {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Missing Title", "Please enter a promotion title");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Missing Description", "Please describe your promotion");
      return;
    }

    if (images.length === 0) {
      Alert.alert("No Images", "Please add at least one image");
      return;
    }

    // Check credits for featured
    if (isFeatured) {
      const totalCredits = (credits?.credits || 0) + (credits?.bonusCredits || 0);
      if (totalCredits < FEATURED_COST) {
        Alert.alert(
          "Not Enough Credits",
          `You need ${FEATURED_COST} credits to feature this promotion. You have ${totalCredits}.`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "Buy Credits", onPress: () => navigation.navigate("BuyCredits") },
          ]
        );
        return;
      }
    }

    setIsLoading(true);
    try {
      // Spend credits for featuring
      if (isFeatured) {
        await spendCredits(
          FEATURED_COST,
          "promotion",
          "featured",
          "Featured promotion boost"
        );
      }

      await createPromotion({
        vendorId: user?.id || "",
        vendorName: user?.businessName || user?.name || "",
        type: promoType,
        title,
        description,
        images,
        categories: selectedCategories,
        discountType: discountType === "none" ? undefined : discountType,
        discountValue: discountValue ? parseFloat(discountValue) : undefined,
        visibility,
        startsAt: startDate.getTime(),
        endsAt: endDate.getTime(),
        featured: isFeatured,
        status: "active",
      });

      Alert.alert("Success", "Your promotion has been created!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create promotion");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Promotion</Text>
          <TouchableOpacity
            style={[styles.postButton, !title && styles.postButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading || !title}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.postButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Promo Type Selection */}
          <Text style={styles.sectionTitle}>Promotion Type</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.typesScroll}
            contentContainerStyle={styles.typesContent}
          >
            {PROMO_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeCard,
                  promoType === type.id && styles.typeCardActive,
                ]}
                onPress={() => setPromoType(type.id)}
              >
                <Ionicons
                  name={type.icon as any}
                  size={24}
                  color={
                    promoType === type.id
                      ? colors.primary[600]
                      : colors.text.tertiary
                  }
                />
                <Text
                  style={[
                    styles.typeLabel,
                    promoType === type.id && styles.typeLabelActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Title */}
          <Text style={styles.sectionTitle}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 30% Off All Granite Remnants"
            placeholderTextColor={colors.text.quaternary}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />

          {/* Description */}
          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your promotion, terms, and what customers can expect..."
            placeholderTextColor={colors.text.quaternary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
          />

          {/* Images */}
          <Text style={styles.sectionTitle}>Images</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imagesScroll}
          >
            {images.map((uri, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeImage}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color={colors.red[500]} />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 5 && (
              <TouchableOpacity style={styles.addImage} onPress={pickImage}>
                <Ionicons name="add" size={32} color={colors.primary[600]} />
                <Text style={styles.addImageText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Discount Settings */}
          {promoType !== "announcement" && promoType !== "flyer" && (
            <>
              <Text style={styles.sectionTitle}>Discount</Text>
              <View style={styles.discountRow}>
                <TouchableOpacity
                  style={[
                    styles.discountTypeButton,
                    discountType === "percentage" && styles.discountTypeActive,
                  ]}
                  onPress={() => setDiscountType("percentage")}
                >
                  <Text
                    style={[
                      styles.discountTypeText,
                      discountType === "percentage" && styles.discountTypeTextActive,
                    ]}
                  >
                    % Off
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.discountTypeButton,
                    discountType === "fixed" && styles.discountTypeActive,
                  ]}
                  onPress={() => setDiscountType("fixed")}
                >
                  <Text
                    style={[
                      styles.discountTypeText,
                      discountType === "fixed" && styles.discountTypeTextActive,
                    ]}
                  >
                    $ Off
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.discountTypeButton,
                    discountType === "none" && styles.discountTypeActive,
                  ]}
                  onPress={() => setDiscountType("none")}
                >
                  <Text
                    style={[
                      styles.discountTypeText,
                      discountType === "none" && styles.discountTypeTextActive,
                    ]}
                  >
                    No Discount
                  </Text>
                </TouchableOpacity>
              </View>
              {discountType !== "none" && (
                <TextInput
                  style={[styles.input, styles.discountInput]}
                  placeholder={discountType === "percentage" ? "e.g., 30" : "e.g., 50"}
                  placeholderTextColor={colors.text.quaternary}
                  value={discountValue}
                  onChangeText={setDiscountValue}
                  keyboardType="numeric"
                />
              )}
            </>
          )}

          {/* Categories */}
          <Text style={styles.sectionTitle}>Categories (Optional)</Text>
          <View style={styles.categoriesGrid}>
            {CATEGORY_CONFIG.slice(0, 8).map((cat) => (
              <TouchableOpacity
                key={cat.name}
                style={[
                  styles.categoryChip,
                  selectedCategories.includes(cat.name) && styles.categoryChipActive,
                ]}
                onPress={() => toggleCategory(cat.name)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategories.includes(cat.name) &&
                      styles.categoryChipTextActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Visibility */}
          <Text style={styles.sectionTitle}>Who Can See This?</Text>
          <View style={styles.visibilityRow}>
            <TouchableOpacity
              style={[
                styles.visibilityOption,
                visibility === "public" && styles.visibilityOptionActive,
              ]}
              onPress={() => setVisibility("public")}
            >
              <Ionicons
                name="earth-outline"
                size={24}
                color={visibility === "public" ? colors.primary[600] : colors.text.tertiary}
              />
              <Text
                style={[
                  styles.visibilityLabel,
                  visibility === "public" && styles.visibilityLabelActive,
                ]}
              >
                Everyone
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.visibilityOption,
                visibility === "pro_only" && styles.visibilityOptionActive,
              ]}
              onPress={() => setVisibility("pro_only")}
            >
              <Ionicons
                name="construct-outline"
                size={24}
                color={visibility === "pro_only" ? colors.primary[600] : colors.text.tertiary}
              />
              <Text
                style={[
                  styles.visibilityLabel,
                  visibility === "pro_only" && styles.visibilityLabelActive,
                ]}
              >
                Contractors Only
              </Text>
            </TouchableOpacity>
          </View>

          {/* Date Range */}
          <Text style={styles.sectionTitle}>Duration</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartPicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.text.tertiary} />
              <Text style={styles.dateText}>
                Starts: {startDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndPicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.text.tertiary} />
              <Text style={styles.dateText}>
                Ends: {endDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          </View>

          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(event, date) => {
                setShowStartPicker(false);
                if (date) setStartDate(date);
              }}
            />
          )}

          {showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              minimumDate={startDate}
              onChange={(event, date) => {
                setShowEndPicker(false);
                if (date) setEndDate(date);
              }}
            />
          )}

          {/* Featured Boost */}
          <View style={styles.featuredSection}>
            <TouchableOpacity
              style={[
                styles.featuredToggle,
                isFeatured && styles.featuredToggleActive,
              ]}
              onPress={() => setIsFeatured(!isFeatured)}
            >
              <View style={styles.featuredContent}>
                <Ionicons
                  name="rocket-outline"
                  size={24}
                  color={isFeatured ? colors.primary[600] : colors.text.tertiary}
                />
                <View style={styles.featuredText}>
                  <Text
                    style={[
                      styles.featuredTitle,
                      isFeatured && styles.featuredTitleActive,
                    ]}
                  >
                    Feature This Promotion
                  </Text>
                  <Text style={styles.featuredDescription}>
                    Get 5x more visibility ({FEATURED_COST} credits)
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.checkbox,
                  isFeatured && styles.checkboxActive,
                ]}
              >
                {isFeatured && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Spacer for bottom */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.primary,
  },
  postButton: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonDisabled: {
    backgroundColor: colors.neutral[300],
  },
  postButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 12,
    marginTop: 16,
  },
  typesScroll: {
    marginHorizontal: -16,
  },
  typesContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  typeCard: {
    width: 90,
    height: 80,
    backgroundColor: colors.neutral[100],
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  typeCardActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[600],
  },
  typeLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 6,
    textAlign: "center",
  },
  typeLabelActive: {
    color: colors.primary[600],
    fontWeight: "600",
  },
  input: {
    backgroundColor: colors.neutral[100],
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  imagesScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  imageContainer: {
    marginRight: 12,
    position: "relative",
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeImage: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "white",
    borderRadius: 12,
  },
  addImage: {
    width: 100,
    height: 100,
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.primary[200],
    borderStyle: "dashed",
  },
  addImageText: {
    fontSize: 12,
    color: colors.primary[600],
    marginTop: 4,
  },
  discountRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  discountTypeButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: colors.neutral[100],
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  discountTypeActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[600],
  },
  discountTypeText: {
    fontSize: 14,
    color: colors.text.tertiary,
    fontWeight: "500",
  },
  discountTypeTextActive: {
    color: colors.primary[600],
  },
  discountInput: {
    width: 120,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.neutral[100],
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  categoryChipActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[600],
  },
  categoryChipText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  categoryChipTextActive: {
    color: colors.primary[600],
    fontWeight: "600",
  },
  visibilityRow: {
    flexDirection: "row",
    gap: 12,
  },
  visibilityOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.neutral[100],
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  visibilityOptionActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[600],
  },
  visibilityLabel: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginLeft: 10,
    fontWeight: "500",
  },
  visibilityLabelActive: {
    color: colors.primary[600],
  },
  dateRow: {
    flexDirection: "row",
    gap: 12,
  },
  dateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.neutral[100],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  dateText: {
    fontSize: 14,
    color: colors.text.primary,
    marginLeft: 8,
  },
  featuredSection: {
    marginTop: 24,
  },
  featuredToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.neutral[100],
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  featuredToggleActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[600],
  },
  featuredContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  featuredText: {
    marginLeft: 12,
    flex: 1,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
  },
  featuredTitleActive: {
    color: colors.primary[600],
  },
  featuredDescription: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
});
