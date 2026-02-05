import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Alert,
  Share,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../nav";
import { useAuthStore } from "../state/authStore";
import { useProjectStore } from "../state/projectStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../utils/colors";
import * as Haptics from "expo-haptics";
import { Project, ProjectRoomType, Lead } from "../types/marketplace";
import { useVendorCatalogStore } from "../state/vendorCatalogStore";
import { getCurrentTenant } from "../config/tenant";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Tool card component
const ToolCard = ({
  icon,
  iconBg,
  title,
  description,
  onPress,
  badge,
  isPro,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  title: string;
  description: string;
  onPress: () => void;
  badge?: string | number;
  isPro?: boolean;
}) => (
  <Pressable
    className="flex-row items-center p-4 rounded-xl mb-3"
    style={{ backgroundColor: "white" }}
    onPress={() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }}
  >
    <View
      className="w-14 h-14 rounded-2xl items-center justify-center"
      style={{ backgroundColor: iconBg }}
    >
      <Ionicons name={icon} size={28} color="white" />
    </View>
    <View className="flex-1 ml-4">
      <View className="flex-row items-center">
        <Text style={{ fontSize: 17, fontWeight: "600", color: "#0f172a" }}>
          {title}
        </Text>
        {isPro && (
          <View
            className="ml-2 px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "#fef3c7" }}
          >
            <Text style={{ fontSize: 10, fontWeight: "700", color: "#d97706" }}>
              PRO
            </Text>
          </View>
        )}
      </View>
      <Text
        style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}
        numberOfLines={2}
      >
        {description}
      </Text>
    </View>
    {badge && (
      <View
        className="px-3 py-1 rounded-full mr-2"
        style={{ backgroundColor: "#dcfce7" }}
      >
        <Text style={{ fontSize: 12, fontWeight: "600", color: "#10b981" }}>
          {badge}
        </Text>
      </View>
    )}
    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
  </Pressable>
);

// Budget Calculator Modal
const BudgetCalculatorModal = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  const [roomType, setRoomType] = useState<ProjectRoomType>("kitchen");
  const [sqft, setSqft] = useState("150");
  const [quality, setQuality] = useState<"budget" | "mid_range" | "premium" | "luxury">("mid_range");

  // Cost per sq ft by room type and quality
  const costMatrix: Record<ProjectRoomType, Record<string, { low: number; high: number }>> = {
    kitchen: { budget: { low: 75, high: 150 }, mid_range: { low: 150, high: 250 }, premium: { low: 250, high: 400 }, luxury: { low: 400, high: 800 } },
    bathroom: { budget: { low: 100, high: 175 }, mid_range: { low: 175, high: 300 }, premium: { low: 300, high: 500 }, luxury: { low: 500, high: 1000 } },
    living_room: { budget: { low: 15, high: 30 }, mid_range: { low: 30, high: 50 }, premium: { low: 50, high: 100 }, luxury: { low: 100, high: 200 } },
    bedroom: { budget: { low: 15, high: 25 }, mid_range: { low: 25, high: 40 }, premium: { low: 40, high: 75 }, luxury: { low: 75, high: 150 } },
    outdoor: { budget: { low: 10, high: 20 }, mid_range: { low: 20, high: 40 }, premium: { low: 40, high: 80 }, luxury: { low: 80, high: 150 } },
    basement: { budget: { low: 25, high: 50 }, mid_range: { low: 50, high: 100 }, premium: { low: 100, high: 175 }, luxury: { low: 175, high: 300 } },
    garage: { budget: { low: 5, high: 15 }, mid_range: { low: 15, high: 30 }, premium: { low: 30, high: 50 }, luxury: { low: 50, high: 100 } },
    whole_home: { budget: { low: 50, high: 100 }, mid_range: { low: 100, high: 175 }, premium: { low: 175, high: 300 }, luxury: { low: 300, high: 500 } },
    other: { budget: { low: 25, high: 50 }, mid_range: { low: 50, high: 100 }, premium: { low: 100, high: 175 }, luxury: { low: 175, high: 300 } },
  };

  const sqftNum = parseFloat(sqft) || 0;
  const costs = costMatrix[roomType][quality];
  const lowEstimate = Math.round(sqftNum * costs.low);
  const highEstimate = Math.round(sqftNum * costs.high);

  const roomTypes: { value: ProjectRoomType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: "kitchen", label: "Kitchen", icon: "restaurant-outline" },
    { value: "bathroom", label: "Bathroom", icon: "water-outline" },
    { value: "living_room", label: "Living Room", icon: "tv-outline" },
    { value: "bedroom", label: "Bedroom", icon: "bed-outline" },
    { value: "outdoor", label: "Outdoor", icon: "leaf-outline" },
    { value: "basement", label: "Basement", icon: "layers-outline" },
    { value: "whole_home", label: "Whole Home", icon: "home-outline" },
  ];

  const qualityTiers = [
    { value: "budget", label: "Budget", color: "#10b981" },
    { value: "mid_range", label: "Mid-Range", color: "#3b82f6" },
    { value: "premium", label: "Premium", color: "#8b5cf6" },
    { value: "luxury", label: "Luxury", color: "#f59e0b" },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200 bg-white">
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={28} color="#6b7280" />
          </Pressable>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#0f172a" }}>
            Budget Calculator
          </Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView className="flex-1 px-5 py-4">
          {/* Room Type */}
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 12 }}>
            Room Type
          </Text>
          <View className="flex-row flex-wrap mb-6">
            {roomTypes.map((room) => (
              <Pressable
                key={room.value}
                onPress={() => setRoomType(room.value)}
                className="mr-2 mb-2 px-4 py-2 rounded-full flex-row items-center"
                style={{
                  backgroundColor: roomType === room.value ? colors.primary[600] : "white",
                  borderWidth: 1,
                  borderColor: roomType === room.value ? colors.primary[600] : "#e5e7eb",
                }}
              >
                <Ionicons
                  name={room.icon}
                  size={16}
                  color={roomType === room.value ? "white" : "#6b7280"}
                />
                <Text
                  style={{
                    marginLeft: 6,
                    fontSize: 14,
                    fontWeight: "500",
                    color: roomType === room.value ? "white" : "#374151",
                  }}
                >
                  {room.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Square Footage */}
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 12 }}>
            Square Footage
          </Text>
          <View className="flex-row items-center mb-6 bg-white rounded-xl px-4 py-3 border border-gray-200">
            <Ionicons name="resize-outline" size={20} color="#6b7280" />
            <TextInput
              value={sqft}
              onChangeText={setSqft}
              keyboardType="numeric"
              placeholder="150"
              className="flex-1 ml-3"
              style={{ fontSize: 18, fontWeight: "600", color: "#0f172a" }}
            />
            <Text style={{ fontSize: 14, color: "#6b7280" }}>sq ft</Text>
          </View>

          {/* Quality Tier */}
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 12 }}>
            Quality Tier
          </Text>
          <View className="flex-row mb-6">
            {qualityTiers.map((tier) => (
              <Pressable
                key={tier.value}
                onPress={() => setQuality(tier.value as any)}
                className="flex-1 mx-1 py-3 rounded-xl items-center"
                style={{
                  backgroundColor: quality === tier.value ? tier.color : "white",
                  borderWidth: 1,
                  borderColor: quality === tier.value ? tier.color : "#e5e7eb",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: quality === tier.value ? "white" : "#374151",
                  }}
                >
                  {tier.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Estimate Results */}
          <View className="bg-white rounded-2xl p-5 border-2 border-blue-200">
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#6b7280", marginBottom: 12 }}>
              Estimated Cost Range
            </Text>
            <View className="flex-row items-end justify-center mb-4">
              <Text style={{ fontSize: 32, fontWeight: "800", color: colors.primary[600] }}>
                ${lowEstimate.toLocaleString()}
              </Text>
              <Text style={{ fontSize: 20, fontWeight: "500", color: "#9ca3af", marginHorizontal: 12 }}>
                -
              </Text>
              <Text style={{ fontSize: 32, fontWeight: "800", color: colors.primary[600] }}>
                ${highEstimate.toLocaleString()}
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: "#9ca3af", textAlign: "center" }}>
              Based on {sqftNum} sq ft {roomType.replace("_", " ")} at {quality.replace("_", " ")} quality
            </Text>
          </View>

          {/* Breakdown */}
          <View className="mt-6 bg-white rounded-2xl p-5">
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 12 }}>
              Typical Cost Breakdown
            </Text>
            {roomType === "kitchen" && (
              <>
                <View className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text style={{ color: "#6b7280" }}>Cabinets (35-40%)</Text>
                  <Text style={{ fontWeight: "600", color: "#0f172a" }}>
                    ${Math.round(lowEstimate * 0.35).toLocaleString()} - ${Math.round(highEstimate * 0.40).toLocaleString()}
                  </Text>
                </View>
                <View className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text style={{ color: "#6b7280" }}>Countertops (10-15%)</Text>
                  <Text style={{ fontWeight: "600", color: "#0f172a" }}>
                    ${Math.round(lowEstimate * 0.10).toLocaleString()} - ${Math.round(highEstimate * 0.15).toLocaleString()}
                  </Text>
                </View>
                <View className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text style={{ color: "#6b7280" }}>Appliances (15-20%)</Text>
                  <Text style={{ fontWeight: "600", color: "#0f172a" }}>
                    ${Math.round(lowEstimate * 0.15).toLocaleString()} - ${Math.round(highEstimate * 0.20).toLocaleString()}
                  </Text>
                </View>
                <View className="flex-row justify-between py-2">
                  <Text style={{ color: "#6b7280" }}>Labor (20-35%)</Text>
                  <Text style={{ fontWeight: "600", color: "#0f172a" }}>
                    ${Math.round(lowEstimate * 0.20).toLocaleString()} - ${Math.round(highEstimate * 0.35).toLocaleString()}
                  </Text>
                </View>
              </>
            )}
            {roomType === "bathroom" && (
              <>
                <View className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text style={{ color: "#6b7280" }}>Tile & Flooring (20-25%)</Text>
                  <Text style={{ fontWeight: "600", color: "#0f172a" }}>
                    ${Math.round(lowEstimate * 0.20).toLocaleString()} - ${Math.round(highEstimate * 0.25).toLocaleString()}
                  </Text>
                </View>
                <View className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text style={{ color: "#6b7280" }}>Vanity & Fixtures (25-30%)</Text>
                  <Text style={{ fontWeight: "600", color: "#0f172a" }}>
                    ${Math.round(lowEstimate * 0.25).toLocaleString()} - ${Math.round(highEstimate * 0.30).toLocaleString()}
                  </Text>
                </View>
                <View className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text style={{ color: "#6b7280" }}>Shower/Tub (15-20%)</Text>
                  <Text style={{ fontWeight: "600", color: "#0f172a" }}>
                    ${Math.round(lowEstimate * 0.15).toLocaleString()} - ${Math.round(highEstimate * 0.20).toLocaleString()}
                  </Text>
                </View>
                <View className="flex-row justify-between py-2">
                  <Text style={{ color: "#6b7280" }}>Labor (25-35%)</Text>
                  <Text style={{ fontWeight: "600", color: "#0f172a" }}>
                    ${Math.round(lowEstimate * 0.25).toLocaleString()} - ${Math.round(highEstimate * 0.35).toLocaleString()}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* CTA */}
          <Pressable
            className="mt-6 mb-8 py-4 rounded-xl items-center"
            style={{ backgroundColor: colors.accent[500] }}
            onPress={() => {
              onClose();
              Alert.alert("Find Materials", "Browse the marketplace to find materials for your project!");
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: "white" }}>
              Find Materials in Your Budget
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// Quick Quote Modal for Pros
const QuickQuoteModal = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  const { user } = useAuthStore();
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [materialsCost, setMaterialsCost] = useState("");
  const [laborCost, setLaborCost] = useState("");

  const subtotal = (parseFloat(materialsCost) || 0) + (parseFloat(laborCost) || 0);
  const tax = subtotal * 0.085; // 8.5% tax
  const total = subtotal + tax;

  const handleSendQuote = async () => {
    if (!customerName || !customerEmail) {
      Alert.alert("Missing Info", "Please enter customer name and email");
      return;
    }

    const quoteText = `
QUOTE FROM ${user?.businessName || user?.name}

Customer: ${customerName}
Project: ${projectDesc}

BREAKDOWN:
Materials: $${parseFloat(materialsCost || "0").toLocaleString()}
Labor: $${parseFloat(laborCost || "0").toLocaleString()}
Subtotal: $${subtotal.toLocaleString()}
Tax (8.5%): $${tax.toFixed(2)}
─────────────
TOTAL: $${total.toFixed(2)}

Valid for 30 days.
Questions? Reply to this message.

Sent via REMODELY.AI
    `;

    try {
      await Share.share({
        message: quoteText,
        title: `Quote for ${customerName}`,
      });
      onClose();
    } catch (error) {
      Alert.alert("Error", "Could not share quote");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200 bg-white">
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={28} color="#6b7280" />
          </Pressable>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#0f172a" }}>
            Quick Quote
          </Text>
          <Pressable onPress={handleSendQuote}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.primary[600] }}>
              Send
            </Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-5 py-4">
          {/* Customer Info */}
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 }}>
            Customer Info
          </Text>
          <View className="bg-white rounded-xl p-4 mb-4">
            <TextInput
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Customer Name"
              className="border-b border-gray-100 py-3"
              style={{ fontSize: 16 }}
            />
            <TextInput
              value={customerEmail}
              onChangeText={setCustomerEmail}
              placeholder="Email Address"
              keyboardType="email-address"
              className="py-3"
              style={{ fontSize: 16 }}
            />
          </View>

          {/* Project Description */}
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 }}>
            Project Description
          </Text>
          <View className="bg-white rounded-xl p-4 mb-4">
            <TextInput
              value={projectDesc}
              onChangeText={setProjectDesc}
              placeholder="Describe the project..."
              multiline
              numberOfLines={3}
              style={{ fontSize: 16, minHeight: 80 }}
            />
          </View>

          {/* Costs */}
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 }}>
            Quote Breakdown
          </Text>
          <View className="bg-white rounded-xl p-4 mb-4">
            <View className="flex-row items-center border-b border-gray-100 py-3">
              <Ionicons name="cube-outline" size={20} color="#6b7280" />
              <Text style={{ flex: 1, marginLeft: 12, fontSize: 16, color: "#374151" }}>Materials</Text>
              <Text style={{ fontSize: 16, color: "#6b7280", marginRight: 4 }}>$</Text>
              <TextInput
                value={materialsCost}
                onChangeText={setMaterialsCost}
                placeholder="0"
                keyboardType="numeric"
                style={{ fontSize: 18, fontWeight: "600", color: "#0f172a", width: 100, textAlign: "right" }}
              />
            </View>
            <View className="flex-row items-center py-3">
              <Ionicons name="hammer-outline" size={20} color="#6b7280" />
              <Text style={{ flex: 1, marginLeft: 12, fontSize: 16, color: "#374151" }}>Labor</Text>
              <Text style={{ fontSize: 16, color: "#6b7280", marginRight: 4 }}>$</Text>
              <TextInput
                value={laborCost}
                onChangeText={setLaborCost}
                placeholder="0"
                keyboardType="numeric"
                style={{ fontSize: 18, fontWeight: "600", color: "#0f172a", width: 100, textAlign: "right" }}
              />
            </View>
          </View>

          {/* Total */}
          <View className="bg-white rounded-xl p-4 border-2 border-green-200">
            <View className="flex-row justify-between py-2">
              <Text style={{ color: "#6b7280" }}>Subtotal</Text>
              <Text style={{ fontWeight: "600", color: "#0f172a" }}>${subtotal.toLocaleString()}</Text>
            </View>
            <View className="flex-row justify-between py-2 border-b border-gray-100">
              <Text style={{ color: "#6b7280" }}>Tax (8.5%)</Text>
              <Text style={{ fontWeight: "600", color: "#0f172a" }}>${tax.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between py-3">
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#0f172a" }}>Total</Text>
              <Text style={{ fontSize: 24, fontWeight: "800", color: "#10b981" }}>${total.toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// Lead Card Component
const LeadCard = ({ lead }: { lead: Lead }) => {
  const statusColors: Record<string, { bg: string; text: string }> = {
    new: { bg: "#dbeafe", text: "#2563eb" },
    contacted: { bg: "#fef3c7", text: "#d97706" },
    quoted: { bg: "#e0e7ff", text: "#4f46e5" },
    won: { bg: "#dcfce7", text: "#10b981" },
    lost: { bg: "#fee2e2", text: "#ef4444" },
  };

  const priorityIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
    high: "flame",
    medium: "remove",
    low: "chevron-down",
  };

  return (
    <Pressable className="bg-white rounded-xl p-4 mb-3">
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#0f172a" }}>
              {lead.customerName}
            </Text>
            {lead.priority === "high" && (
              <Ionicons name="flame" size={16} color="#ef4444" style={{ marginLeft: 6 }} />
            )}
          </View>
          <Text style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
            {lead.projectType.charAt(0).toUpperCase() + lead.projectType.slice(1).replace("_", " ")}
          </Text>
        </View>
        <View
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: statusColors[lead.status].bg }}
        >
          <Text style={{ fontSize: 12, fontWeight: "600", color: statusColors[lead.status].text }}>
            {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
          </Text>
        </View>
      </View>
      <Text style={{ fontSize: 14, color: "#374151" }} numberOfLines={2}>
        {lead.description}
      </Text>
      {lead.budget && (
        <View className="flex-row items-center mt-2">
          <Ionicons name="cash-outline" size={14} color="#10b981" />
          <Text style={{ fontSize: 13, color: "#10b981", marginLeft: 4, fontWeight: "500" }}>
            ${lead.budget.min.toLocaleString()} - ${lead.budget.max.toLocaleString()}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

export default function ToolsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const { projects, leads, getUserProjects, getLeadsByPro, loadMockData } = useProjectStore();
  const [showBudgetCalc, setShowBudgetCalc] = useState(false);
  const [showQuickQuote, setShowQuickQuote] = useState(false);

  const isPro = user && ["vendor", "fabricator", "contractor", "designer", "supplier", "installer"].includes(user.userType);
  const isVendor = user && ["vendor", "supplier"].includes(user.userType);
  const isContractor = user && ["fabricator", "contractor", "installer"].includes(user.userType);
  const isHomeowner = !isPro;

  const { getNewLeadsCount: getVendorLeadsCount } = useVendorCatalogStore();
  const vendorLeadsCount = user && isVendor ? getVendorLeadsCount(user.id) : 0;

  useEffect(() => {
    // Load mock data if empty
    if (projects.length === 0 && leads.length === 0) {
      loadMockData();
    }
  }, []);

  const myProjects = user ? getUserProjects(user.id) : [];
  const myLeads = user && isPro ? getLeadsByPro(user.id) : [];
  const newLeadsCount = myLeads.filter((l) => l.status === "new").length;

  // Section Header Component - only renders if it has children
  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={{ fontSize: 12, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
      {title}
    </Text>
  );

  const tenant = getCurrentTenant();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Branded Header with Remodely branding */}
        <LinearGradient
          colors={tenant.branding.headerGradient || [colors.primary[600], colors.primary[700]]}
          style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: 'rgba(255,255,255,0.15)',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}>
              <Ionicons name="construct" size={26} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 22, fontWeight: "800", color: "white", letterSpacing: -0.5 }}>
                  {isPro ? "Pro Tools" : "Tool Hub"}
                </Text>
                {isPro && (
                  <View style={{
                    marginLeft: 8,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 8,
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: 'white' }}>PRO</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
                Powered by {tenant.displayName}
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: '500' }}>
            {isPro ? "Manage your business and serve customers" : "Plan and manage your remodel project"}
          </Text>
        </LinearGradient>

        {/* ===== PRO USER LAYOUT ===== */}
        {isPro && (
          <>
            {/* Vendor-specific tools */}
            {isVendor && (
              <View className="px-5 mb-4">
                <ToolCard
                  icon="storefront-outline"
                  iconBg="#8b5cf6"
                  title="Vendor Portal"
                  description="Manage your product catalog and leads"
                  badge={vendorLeadsCount > 0 ? `${vendorLeadsCount} new` : undefined}
                  onPress={() => navigation.navigate("VendorPortal")}
                />
              </View>
            )}

            {/* Contractor-specific tools */}
            {isContractor && (
              <View className="px-5 mb-4">
                <ToolCard
                  icon="grid-outline"
                  iconBg="#6366f1"
                  title="Material Catalog"
                  description="Browse vendor products with pro pricing"
                  onPress={() => navigation.navigate("MaterialCatalog")}
                />

                <ToolCard
                  icon="easel-outline"
                  iconBg="#ec4899"
                  title="Sales Mode"
                  description="Present products to customers full-screen"
                  onPress={() => navigation.navigate("SalesMode")}
                />
              </View>
            )}

            {/* Quick Actions for Pros - no section header, just the tools */}
            <View className="px-5 mb-4">
              <ToolCard
                icon="receipt-outline"
                iconBg="#10b981"
                title="Quick Quote"
                description="Generate and send quotes to customers instantly"
                onPress={() => setShowQuickQuote(true)}
              />

              <ToolCard
                icon="clipboard-outline"
                iconBg="#8b5cf6"
                title="Project Boards"
                description="Manage projects and collaborate with customers"
                badge={myProjects.length > 0 ? myProjects.length : undefined}
                onPress={() => navigation.navigate("ProjectBoard")}
              />

              {newLeadsCount > 0 && (
                <ToolCard
                  icon="people-outline"
                  iconBg="#3b82f6"
                  title="Leads"
                  description="View and manage customer inquiries"
                  badge={`${newLeadsCount} new`}
                  onPress={() => Alert.alert("Leads", `You have ${myLeads.length} total leads`)}
                />
              )}
            </View>

            {/* Leads Preview - only show if there are leads */}
            {myLeads.length > 0 && (
              <View className="px-5 mb-4">
                <View className="flex-row items-center justify-between mb-3">
                  <SectionHeader title="RECENT LEADS" />
                  <Pressable>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary[600] }}>
                      View All
                    </Text>
                  </Pressable>
                </View>
                {myLeads.slice(0, 2).map((lead) => (
                  <LeadCard key={lead.id} lead={lead} />
                ))}
              </View>
            )}

            {/* More Pro Tools - collapsed section */}
            <View className="px-5 mb-4">
              <SectionHeader title="MORE TOOLS" />

              <ToolCard
                icon="resize-outline"
                iconBg="#06b6d4"
                title="Smart Measure"
                description="AR-powered measurements for quotes"
                onPress={() => navigation.navigate("MeasurementHome")}
              />

              <ToolCard
                icon="calculator-outline"
                iconBg="#2563eb"
                title="Measurement Calculator"
                description="Calculate sq ft, linear feet, surfaces & rooms"
                onPress={() => navigation.navigate("MeasurementCalculator")}
              />

              <ToolCard
                icon="calendar-outline"
                iconBg="#f59e0b"
                title="Schedule"
                description="Manage appointments and timelines"
                onPress={() => navigation.navigate("Calendar")}
              />

              <ToolCard
                icon="analytics-outline"
                iconBg="#ef4444"
                title="Business Analytics"
                description="Track performance and revenue"
                onPress={() => Alert.alert("Coming Soon", "Analytics feature coming soon!")}
              />

              <ToolCard
                icon="scan-outline"
                iconBg="#ec4899"
                title="Material Scanner"
                description="Snap a photo to find products"
                onPress={() => Alert.alert("Coming Soon", "Material scanner feature coming soon!")}
              />
            </View>
          </>
        )}

        {/* ===== HOMEOWNER USER LAYOUT ===== */}
        {isHomeowner && (
          <>
            {/* Primary Tools - no section header for cleaner look */}
            <View className="px-5 mb-4">
              <ToolCard
                icon="clipboard-outline"
                iconBg="#8b5cf6"
                title="Project Boards"
                description="Organize materials and collaborate with pros"
                badge={myProjects.length > 0 ? myProjects.length : undefined}
                onPress={() => navigation.navigate("ProjectBoard")}
              />

              <ToolCard
                icon="calculator-outline"
                iconBg={colors.accent[500]}
                title="Budget Calculator"
                description="Estimate costs for your remodel"
                onPress={() => setShowBudgetCalc(true)}
              />

              <ToolCard
                icon="resize-outline"
                iconBg="#06b6d4"
                title="Smart Measure"
                description="AR-powered room measurements"
                onPress={() => navigation.navigate("MeasurementHome")}
              />

              <ToolCard
                icon="apps-outline"
                iconBg="#2563eb"
                title="Measurement Calculator"
                description="Calculate sq ft, linear feet & room sizes"
                onPress={() => navigation.navigate("MeasurementCalculator")}
              />

              <ToolCard
                icon="calendar-outline"
                iconBg="#f59e0b"
                title="Schedule"
                description="Track appointments and project timelines"
                onPress={() => navigation.navigate("Calendar")}
              />
            </View>

            {/* Discovery - for finding materials and pros */}
            <View className="px-5 mb-4">
              <SectionHeader title="DISCOVER" />

              <ToolCard
                icon="map-outline"
                iconBg="#10b981"
                title="Find Local Pros"
                description="Search verified contractors nearby"
                onPress={() => navigation.navigate("MainTabs", { screen: "Map" } as any)}
              />

              <ToolCard
                icon="scan-outline"
                iconBg="#f59e0b"
                title="Material Scanner"
                description="Snap a photo to find similar products"
                onPress={() => Alert.alert("Coming Soon", "Material scanner feature coming soon!")}
              />

              <ToolCard
                icon="cube-outline"
                iconBg="#6366f1"
                title="Request Samples"
                description="Get material samples shipped to you"
                onPress={() => Alert.alert("Coming Soon", "Sample requests feature coming soon!")}
              />
            </View>

            {/* Visualize - AR and visualization tools */}
            <View className="px-5 mb-8">
              <SectionHeader title="VISUALIZE" />

              <ToolCard
                icon="color-palette-outline"
                iconBg="#ec4899"
                title="Material Visualizer"
                description="See materials in your space with AR"
                onPress={() => Alert.alert("Coming Soon", "AR visualizer feature coming soon!")}
              />

              <ToolCard
                icon="pricetag-outline"
                iconBg="#ef4444"
                title="Deal Alerts"
                description="Get notified when materials go on sale"
                onPress={() => Alert.alert("Coming Soon", "Deal alerts feature coming soon!")}
              />
            </View>
          </>
        )}
      </ScrollView>

      {/* Modals */}
      <BudgetCalculatorModal visible={showBudgetCalc} onClose={() => setShowBudgetCalc(false)} />
      <QuickQuoteModal visible={showQuickQuote} onClose={() => setShowQuickQuote(false)} />
    </SafeAreaView>
  );
}
