import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../utils/colors";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../nav/RootNavigator";
import { useMeasurementsStore } from "../state/measurementsStore";
import { useAuthStore } from "../state/authStore";
import * as Haptics from "expo-haptics";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function MeasurementHomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { getUserMeasurements } = useMeasurementsStore();

  const userMeasurements = user ? getUserMeasurements(user.id) : [];

  const measurementTools = [
    {
      id: "smart",
      title: "Smart Measurement",
      subtitle: "AI-powered precision measurement",
      icon: "expand" as const,
      color: colors.accent[500],
      screen: "SmartMeasurement" as const,
      features: ["Pin placement", "Auto-calculate", "Shape detection", "Undo/Redo"],
    },
    {
      id: "simple",
      title: "Quick Measure",
      subtitle: "Fast manual entry",
      icon: "crop" as const,
      color: colors.primary[600],
      screen: "SimpleMeasurement" as const,
      features: ["4-corner tap", "Manual dimensions", "Quick & simple"],
    },
    {
      id: "advanced",
      title: "Pro Measurement",
      subtitle: "Advanced tools & calibration",
      icon: "calculator" as const,
      color: "#8b5cf6",
      screen: "AdvancedMeasurement" as const,
      features: ["Device sensors", "Calibration", "Area & perimeter", "Edge detection"],
    },
  ];

  const handleToolPress = (screen: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate(screen as any);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.main,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ fontSize: 28, fontWeight: "700", color: colors.text.primary }}>
              Measurements
            </Text>
            <Text style={{ fontSize: 14, color: colors.text.secondary, marginTop: 4 }}>
              Professional stone measurement tools
            </Text>
          </View>
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.background.secondary,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </Pressable>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
        {/* Stats */}
        {userMeasurements.length > 0 && (
          <View style={{ paddingHorizontal: 20, paddingVertical: 20 }}>
            <View
              style={{
                backgroundColor: colors.accent[100],
                borderRadius: 16,
                padding: 20,
                borderWidth: 2,
                borderColor: colors.accent[500],
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <Ionicons name="stats-chart" size={24} color={colors.accent[500]} />
                <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text.primary, marginLeft: 10 }}>
                  Your Measurements
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 24 }}>
                <View>
                  <Text style={{ fontSize: 32, fontWeight: "700", color: colors.accent[600] }}>
                    {userMeasurements.length}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.text.secondary }}>Total saved</Text>
                </View>
                <View style={{ width: 1, backgroundColor: colors.border.main }} />
                <View>
                  <Text style={{ fontSize: 32, fontWeight: "700", color: colors.accent[600] }}>
                    {userMeasurements.filter(m => m.type === "remnant").length}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.text.secondary }}>Remnants</Text>
                </View>
                <View style={{ width: 1, backgroundColor: colors.border.main }} />
                <View>
                  <Text style={{ fontSize: 32, fontWeight: "700", color: colors.accent[600] }}>
                    {userMeasurements.filter(m => m.type === "space").length}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.text.secondary }}>Spaces</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Measurement Tools */}
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text.primary, marginBottom: 16 }}>
            Choose Measurement Tool
          </Text>

          {measurementTools.map((tool) => (
            <Pressable
              key={tool.id}
              onPress={() => handleToolPress(tool.screen)}
              style={{
                backgroundColor: colors.background.secondary,
                borderRadius: 16,
                padding: 20,
                marginBottom: 16,
                borderWidth: 2,
                borderColor: colors.border.main,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: tool.color,
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 16,
                  }}
                >
                  <Ionicons name={tool.icon} size={28} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text.primary }}>
                    {tool.title}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.text.secondary, marginTop: 2 }}>
                    {tool.subtitle}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.text.tertiary} />
              </View>

              {/* Features */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {tool.features.map((feature, index) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: colors.background.primary,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderWidth: 1,
                      borderColor: colors.border.main,
                    }}
                  >
                    <Text style={{ fontSize: 12, color: colors.text.secondary }}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>
            </Pressable>
          ))}
        </View>

        {/* Tips */}
        <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
          <View
            style={{
              backgroundColor: colors.primary[100],
              borderRadius: 16,
              padding: 20,
              borderLeftWidth: 4,
              borderLeftColor: colors.primary[600],
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <Ionicons name="bulb" size={20} color={colors.primary[600]} />
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text.primary, marginLeft: 8 }}>
                Pro Tips
              </Text>
            </View>
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <Text style={{ color: colors.primary[600], marginRight: 8 }}>•</Text>
                <Text style={{ fontSize: 13, color: colors.text.secondary, flex: 1, lineHeight: 20 }}>
                  Always calibrate with a credit card or ruler for best accuracy
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <Text style={{ color: colors.primary[600], marginRight: 8 }}>•</Text>
                <Text style={{ fontSize: 13, color: colors.text.secondary, flex: 1, lineHeight: 20 }}>
                  Take photos from directly above for most accurate measurements
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <Text style={{ color: colors.primary[600], marginRight: 8 }}>•</Text>
                <Text style={{ fontSize: 13, color: colors.text.secondary, flex: 1, lineHeight: 20 }}>
                  Use Smart Measurement for complex shapes like L-shaped counters
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
