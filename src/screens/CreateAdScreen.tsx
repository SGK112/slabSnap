import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  StyleSheet,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../nav";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../utils/colors";
import { useAuthStore } from "../state/authStore";
import { useNativeAdsStore, AdType, AdPlacement, AD_COSTS } from "../state/nativeAdsStore";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { AIWriterButton } from "../components/AIWriterButton";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "CreateAd">;

export default function CreateAdScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const { createAd, credits } = useNativeAdsStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [businessName, setBusinessName] = useState(user?.businessName || "");
  const [businessType, setBusinessType] = useState(user?.businessType || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || "");
  const [website, setWebsite] = useState("");
  const [ctaText, setCtaText] = useState("Call Now");
  const [adType, setAdType] = useState<AdType>("banner");
  const [placements, setPlacements] = useState<AdPlacement[]>(["home"]);
  const [dailyBudget, setDailyBudget] = useState(5);
  const [duration, setDuration] = useState(7); // days

  const totalCost = dailyBudget * duration;
  const hasEnoughCredits = credits.available >= totalCost;

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.9,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const togglePlacement = (placement: AdPlacement) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (placements.includes(placement)) {
      setPlacements(placements.filter((p) => p !== placement));
    } else {
      setPlacements([...placements, placement]);
    }
  };

  const handleCreateAd = () => {
    if (!title.trim() || !description.trim() || !businessName.trim()) {
      Alert.alert("Missing Information", "Please fill in all required fields");
      return;
    }

    if (placements.length === 0) {
      Alert.alert("No Placement", "Please select at least one ad placement");
      return;
    }

    if (!hasEnoughCredits) {
      Alert.alert(
        "Insufficient Credits",
        `You need ${totalCost} credits but only have ${credits.available}. Purchase more credits to continue.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Buy Credits",
            onPress: () => {
              const nav = navigation as any;
              nav.navigate("PurchaseAdCredits");
            },
          },
        ]
      );
      return;
    }

    const adId = createAd({
      userId: user!.id,
      userType: user!.userType,
      title: title.trim(),
      description: description.trim(),
      imageUrl: imageUri,
      ctaText,
      ctaAction: "call",
      ctaValue: phoneNumber,
      businessName: businessName.trim(),
      businessType: businessType.trim(),
      location: user?.location || "",
      phoneNumber,
      website: website || undefined,
      verified: user?.verified || false,
      type: adType,
      placement: placements,
      targetAudience: "all",
      status: "pending",
      startDate: Date.now(),
      endDate: Date.now() + duration * 86400000,
      dailyBudget,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Alert.alert(
      "Ad Created!",
      "Your ad has been submitted for review. It will go live within 24 hours.",
      [{ text: "OK", onPress: () => navigation.goBack() }]
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loginPrompt}>
          <Ionicons name="megaphone-outline" size={64} color={colors.text.tertiary} />
          <Text style={styles.loginTitle}>Sign In Required</Text>
          <Text style={styles.loginText}>Create an account to advertise your business</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="close" size={28} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Create Ad</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Credits Balance */}
        <View style={styles.creditsCard}>
          <View style={styles.creditsHeader}>
            <View>
              <Text style={styles.creditsLabel}>Available Credits</Text>
              <Text style={styles.creditsAmount}>{credits.available}</Text>
            </View>
            <Pressable
              style={styles.buyCreditsButton}
              onPress={() => navigation.navigate("PurchaseAdCredits")}
            >
              <Ionicons name="add-circle" size={20} color="white" />
              <Text style={styles.buyCreditsText}>Buy Credits</Text>
            </Pressable>
          </View>
        </View>

        {/* Ad Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ad Preview</Text>
          <View style={styles.adPreview}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="image-outline" size={48} color={colors.text.quaternary} />
              </View>
            )}
            <View style={styles.previewContent}>
              <Text style={styles.previewTitle} numberOfLines={1}>
                {title || "Your ad title here"}
              </Text>
              <Text style={styles.previewDescription} numberOfLines={2}>
                {description || "Your ad description here"}
              </Text>
              <View style={styles.previewFooter}>
                <Text style={styles.previewBusiness}>{businessName || "Your Business"}</Text>
                <View style={styles.previewCta}>
                  <Text style={styles.previewCtaText}>{ctaText}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Business Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Information</Text>
          
          <Text style={styles.label}>Business Name *</Text>
          <TextInput
            style={styles.input}
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="e.g., Surprise Granite Countertops"
            placeholderTextColor={colors.text.quaternary}
          />

          <Text style={styles.label}>Business Type *</Text>
          <TextInput
            style={styles.input}
            value={businessType}
            onChangeText={setBusinessType}
            placeholder="e.g., Fabricator, Supplier, Contractor"
            placeholderTextColor={colors.text.quaternary}
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="(555) 123-4567"
            placeholderTextColor={colors.text.quaternary}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Website (Optional)</Text>
          <TextInput
            style={styles.input}
            value={website}
            onChangeText={setWebsite}
            placeholder="www.yourbusiness.com"
            placeholderTextColor={colors.text.quaternary}
            keyboardType="url"
            autoCapitalize="none"
          />
        </View>

        {/* Ad Content */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ad Content</Text>

          <Text style={styles.label}>Ad Title * ({title.length}/60)</Text>
          <View style={{ position: "relative" }}>
            <TextInput
              style={[styles.input, { paddingRight: 60 }]}
              value={title}
              onChangeText={(text) => text.length <= 60 && setTitle(text)}
              placeholder="e.g., Premium Granite Slabs - 50+ Colors"
              placeholderTextColor={colors.text.quaternary}
              maxLength={60}
            />
            <AIWriterButton
              value={title}
              onValueChange={setTitle}
              fieldType="ad"
              context={`${businessName} - ${businessType}`}
            />
          </View>

          <Text style={styles.label}>Description * ({description.length}/150)</Text>
          <View style={{ position: "relative" }}>
            <TextInput
              style={[styles.input, styles.textArea, { paddingRight: 60 }]}
              value={description}
              onChangeText={(text) => text.length <= 150 && setDescription(text)}
              placeholder="Describe your product or service..."
              placeholderTextColor={colors.text.quaternary}
              multiline
              numberOfLines={4}
              maxLength={150}
            />
            <AIWriterButton
              value={description}
              onValueChange={setDescription}
              fieldType="ad"
              context={`${businessName} - ${businessType} - ${title}`}
            />
          </View>

          <Text style={styles.label}>Ad Image</Text>
          <Pressable style={styles.imagePicker} onPress={pickImage}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.selectedImage} />
            ) : (
              <>
                <Ionicons name="camera" size={32} color={colors.primary[600]} />
                <Text style={styles.imagePickerText}>Upload Image (16:9 ratio)</Text>
              </>
            )}
          </Pressable>

          <Text style={styles.label}>Call-to-Action Button</Text>
          <View style={styles.ctaOptions}>
            {["Call Now", "Visit Website", "Get Quote", "Request Sample"].map((cta) => (
              <Pressable
                key={cta}
                style={[styles.ctaOption, ctaText === cta && styles.ctaOptionActive]}
                onPress={() => {
                  setCtaText(cta);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[styles.ctaOptionText, ctaText === cta && styles.ctaOptionTextActive]}>
                  {cta}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Ad Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ad Type</Text>
          
          {[
            { type: "banner" as AdType, name: "Banner", cost: AD_COSTS.banner, desc: "Small banner ad" },
            { type: "sponsored" as AdType, name: "Sponsored", cost: AD_COSTS.sponsored, desc: "Highlighted listing" },
            { type: "featured" as AdType, name: "Featured", cost: AD_COSTS.featured, desc: "Large featured ad" },
            { type: "tooltip" as AdType, name: "Tooltip", cost: AD_COSTS.tooltip, desc: "Interactive tooltip" },
          ].map((option) => (
            <Pressable
              key={option.type}
              style={[styles.adTypeOption, adType === option.type && styles.adTypeOptionActive]}
              onPress={() => {
                setAdType(option.type);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.adTypeName}>{option.name}</Text>
                <Text style={styles.adTypeDesc}>{option.desc}</Text>
              </View>
              <View style={styles.adTypeCost}>
                <Text style={styles.adTypeCostText}>{option.cost} credits/day</Text>
              </View>
              {adType === option.type && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary[600]} />
              )}
            </Pressable>
          ))}
        </View>

        {/* Placements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ad Placements</Text>
          <Text style={styles.sectionSubtitle}>Select where your ad will appear</Text>

          {[
            { id: "home" as AdPlacement, name: "Home Feed", icon: "home" },
            { id: "map" as AdPlacement, name: "Vendor Map", icon: "map" },
            { id: "listings" as AdPlacement, name: "Listings", icon: "pricetag" },
            { id: "jobs" as AdPlacement, name: "Job Board", icon: "briefcase" },
            { id: "messages" as AdPlacement, name: "Messages", icon: "chatbubbles" },
          ].map((placement) => (
            <Pressable
              key={placement.id}
              style={styles.placementOption}
              onPress={() => togglePlacement(placement.id)}
            >
              <View style={styles.placementInfo}>
                <View style={styles.placementIcon}>
                  <Ionicons
                    name={placement.icon as any}
                    size={20}
                    color={placements.includes(placement.id) ? colors.primary[600] : colors.text.tertiary}
                  />
                </View>
                <Text style={styles.placementName}>{placement.name}</Text>
              </View>
              <Switch
                value={placements.includes(placement.id)}
                onValueChange={() => togglePlacement(placement.id)}
                trackColor={{ false: colors.neutral[300], true: colors.primary[600] }}
                thumbColor="white"
              />
            </Pressable>
          ))}
        </View>

        {/* Budget & Duration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget & Duration</Text>

          <Text style={styles.label}>Daily Budget (credits/day)</Text>
          <View style={styles.budgetSelector}>
            {[3, 5, 10, 20, 50].map((budget) => (
              <Pressable
                key={budget}
                style={[styles.budgetOption, dailyBudget === budget && styles.budgetOptionActive]}
                onPress={() => {
                  setDailyBudget(budget);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[styles.budgetText, dailyBudget === budget && styles.budgetTextActive]}>
                  {budget}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Duration (days)</Text>
          <View style={styles.budgetSelector}>
            {[7, 14, 30, 60, 90].map((days) => (
              <Pressable
                key={days}
                style={[styles.budgetOption, duration === days && styles.budgetOptionActive]}
                onPress={() => {
                  setDuration(days);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[styles.budgetText, duration === days && styles.budgetTextActive]}>
                  {days}d
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Cost Summary */}
          <View style={styles.costSummary}>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Daily Budget:</Text>
              <Text style={styles.costValue}>{dailyBudget} credits</Text>
            </View>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Duration:</Text>
              <Text style={styles.costValue}>{duration} days</Text>
            </View>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Placements:</Text>
              <Text style={styles.costValue}>{placements.length} locations</Text>
            </View>
            <View style={[styles.costRow, styles.costTotal]}>
              <Text style={styles.costTotalLabel}>Total Cost:</Text>
              <Text style={styles.costTotalValue}>{totalCost} credits</Text>
            </View>
            {!hasEnoughCredits && (
              <Text style={styles.insufficientText}>
                ⚠️ Insufficient credits. You need {totalCost - credits.available} more.
              </Text>
            )}
          </View>
        </View>

        {/* Create Button */}
        <Pressable
          style={[styles.createButton, !hasEnoughCredits && styles.createButtonDisabled]}
          onPress={handleCreateAd}
          disabled={!hasEnoughCredits}
        >
          <Text style={styles.createButtonText}>
            {hasEnoughCredits ? "Create Ad" : "Insufficient Credits"}
          </Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    fontWeight: "700",
    color: colors.text.primary,
  },
  content: {
    flex: 1,
  },
  creditsCard: {
    margin: 16,
    padding: 16,
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary[200],
  },
  creditsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  creditsLabel: {
    fontSize: 13,
    color: colors.primary[700],
    fontWeight: "600",
    marginBottom: 4,
  },
  creditsAmount: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.primary[600],
  },
  buyCreditsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.primary[600],
    borderRadius: 8,
  },
  buyCreditsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.secondary,
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.main,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text.primary,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  imagePicker: {
    height: 150,
    backgroundColor: colors.background.secondary,
    borderWidth: 2,
    borderColor: colors.border.main,
    borderRadius: 12,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  imagePickerText: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginTop: 8,
  },
  selectedImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  ctaOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  ctaOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.background.secondary,
    borderWidth: 2,
    borderColor: colors.border.main,
    borderRadius: 8,
  },
  ctaOptionActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[600],
  },
  ctaOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  ctaOptionTextActive: {
    color: colors.primary[600],
  },
  adTypeOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderWidth: 2,
    borderColor: colors.border.main,
    borderRadius: 12,
    marginBottom: 12,
  },
  adTypeOptionActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[600],
  },
  adTypeName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 4,
  },
  adTypeDesc: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  adTypeCost: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.background.tertiary,
    borderRadius: 6,
    marginRight: 12,
  },
  adTypeCostText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  placementOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  placementInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  placementIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  placementName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text.primary,
  },
  budgetSelector: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  budgetOption: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: colors.background.secondary,
    borderWidth: 2,
    borderColor: colors.border.main,
    borderRadius: 8,
    alignItems: "center",
  },
  budgetOptionActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  budgetText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  budgetTextActive: {
    color: "white",
  },
  costSummary: {
    marginTop: 24,
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  costLabel: {
    fontSize: 14,
    color: colors.text.tertiary,
  },
  costValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.primary,
  },
  costTotal: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: colors.border.main,
  },
  costTotalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text.primary,
  },
  costTotalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.primary[600],
  },
  insufficientText: {
    fontSize: 13,
    color: colors.error.main,
    marginTop: 12,
    textAlign: "center",
  },
  createButton: {
    margin: 16,
    paddingVertical: 16,
    backgroundColor: colors.primary[600],
    borderRadius: 12,
    alignItems: "center",
  },
  createButtonDisabled: {
    backgroundColor: colors.neutral[300],
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },
  adPreview: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border.main,
  },
  previewImage: {
    width: "100%",
    height: 150,
  },
  placeholderImage: {
    width: "100%",
    height: 150,
    backgroundColor: colors.background.tertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  previewContent: {
    padding: 12,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 6,
  },
  previewDescription: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  previewFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  previewBusiness: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.tertiary,
  },
  previewCta: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary[600],
    borderRadius: 6,
  },
  previewCtaText: {
    fontSize: 13,
    fontWeight: "600",
    color: "white",
  },
  loginPrompt: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  loginText: {
    fontSize: 15,
    color: colors.text.tertiary,
    textAlign: "center",
  },
});
