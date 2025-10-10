import React, { useState } from "react";
import { View, Text, Pressable, TextInput, Modal, ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../utils/colors";
import { getOpenAIChatResponse } from "../api/chat-service";
import * as Haptics from "expo-haptics";

interface AIWriterButtonProps {
  value: string;
  onValueChange: (text: string) => void;
  fieldType: "title" | "description" | "ad" | "job" | "bio" | "notes";
  context?: string; // Additional context (e.g., stone type, listing details)
}

export function AIWriterButton({
  value,
  onValueChange,
  fieldType,
  context = "",
}: AIWriterButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState("");
  const [error, setError] = useState("");

  const getPromptSuggestion = (): string => {
    switch (fieldType) {
      case "title":
        return context
          ? `Create a catchy listing title for ${context}`
          : "Premium marble slab, 48x26 inches";
      case "description":
        return context
          ? `Describe this ${context} in detail`
          : "Beautiful white marble with gray veining, perfect condition";
      case "ad":
        return "Promote my stone fabrication services";
      case "job":
        return "Looking for experienced stone installer in Phoenix area";
      case "bio":
        return "Professional stone fabricator with 15 years experience";
      case "notes":
        return "Additional details about this piece";
      default:
        return "";
    }
  };

  const getSystemPrompt = (): string => {
    const baseContext = context ? `Context: ${context}\n` : "";
    
    switch (fieldType) {
      case "title":
        return `${baseContext}Write a concise, engaging listing title (max 60 characters) for a stone marketplace. Focus on material type, key features, and size. Be specific and professional.`;
      case "description":
        return `${baseContext}Write a detailed, professional listing description for a stone marketplace. Include material details, condition, dimensions, color/pattern, best uses, and any unique features. Make it compelling but honest. Keep it under 300 words.`;
      case "ad":
        return `${baseContext}Write compelling ad copy for a stone/remodeling business. Highlight unique services, quality, experience, and value. Be persuasive but professional. Keep it under 200 words.`;
      case "job":
        return `${baseContext}Write a clear job posting for stone/remodeling work. Include job requirements, responsibilities, qualifications needed, and location. Be specific and professional. Keep it under 250 words.`;
      case "bio":
        return `${baseContext}Write a professional bio for someone in the stone/remodeling industry. Highlight experience, expertise, and unique value proposition. Keep it friendly and authentic. Keep it under 150 words.`;
      case "notes":
        return `${baseContext}Write helpful notes or additional details. Be clear and concise.`;
      default:
        return "Write professional, clear content.";
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter what you want to write about");
      return;
    }

    setGenerating(true);
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const fullPrompt = `${getSystemPrompt()}\n\nUser request: ${prompt}`;
      const response = await getOpenAIChatResponse(fullPrompt);
      
      setGenerated(response.content.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setError("Failed to generate content. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setGenerating(false);
    }
  };

  const handleUseText = () => {
    onValueChange(generated);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowModal(false);
    setPrompt("");
    setGenerated("");
  };

  const handleClose = () => {
    setShowModal(false);
    setPrompt("");
    setGenerated("");
    setError("");
  };

  return (
    <>
      {/* AI Button - Small and Discreet */}
      <Pressable
        onPress={() => {
          setShowModal(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          backgroundColor: "#8b5cf6",
          borderRadius: 6,
          paddingHorizontal: 8,
          paddingVertical: 6,
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.2,
          shadowRadius: 2,
          elevation: 2,
          zIndex: 10,
        }}
      >
        <Ionicons name="sparkles" size={12} color="white" />
        <Text style={{ fontSize: 11, fontWeight: "600", color: "white" }}>AI</Text>
      </Pressable>

      {/* AI Writer Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
          {/* Header */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border.main,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "#f3e8ff",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="sparkles" size={20} color="#8b5cf6" />
              </View>
              <Text style={{ fontSize: 20, fontWeight: "700", color: colors.text.primary }}>
                AI Writer
              </Text>
            </View>
            <Pressable
              onPress={handleClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.background.secondary,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
            {/* Current Value */}
            {value && (
              <View
                style={{
                  backgroundColor: colors.background.secondary,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text.secondary, marginBottom: 8 }}>
                  Current Text:
                </Text>
                <Text style={{ fontSize: 14, color: colors.text.primary, lineHeight: 20 }}>{value}</Text>
              </View>
            )}

            {/* Prompt Input */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text.primary, marginBottom: 8 }}>
                What would you like to write?
              </Text>
              <TextInput
                style={{
                  backgroundColor: "white",
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: colors.border.main,
                  padding: 16,
                  fontSize: 15,
                  color: colors.text.primary,
                  minHeight: 100,
                }}
                placeholder={getPromptSuggestion()}
                placeholderTextColor={colors.text.tertiary}
                value={prompt}
                onChangeText={setPrompt}
                multiline
                textAlignVertical="top"
                autoFocus
              />
            </View>

            {/* Generate Button */}
            <Pressable
              onPress={handleGenerate}
              disabled={generating || !prompt.trim()}
              style={{
                backgroundColor: generating || !prompt.trim() ? colors.text.tertiary : "#8b5cf6",
                borderRadius: 12,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginBottom: 24,
              }}
            >
              {generating ? (
                <>
                  <ActivityIndicator color="white" />
                  <Text style={{ fontSize: 16, fontWeight: "600", color: "white" }}>Generating...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color="white" />
                  <Text style={{ fontSize: 16, fontWeight: "600", color: "white" }}>Generate with AI</Text>
                </>
              )}
            </Pressable>

            {/* Error */}
            {error && (
              <View
                style={{
                  backgroundColor: "#fee2e2",
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <Ionicons name="alert-circle" size={24} color="#dc2626" />
                <Text style={{ fontSize: 14, color: "#dc2626", flex: 1 }}>{error}</Text>
              </View>
            )}

            {/* Generated Content */}
            {generated && (
              <View
                style={{
                  backgroundColor: "#f3e8ff",
                  borderRadius: 16,
                  padding: 20,
                  borderWidth: 2,
                  borderColor: "#8b5cf6",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <Ionicons name="checkmark-circle" size={24} color="#8b5cf6" />
                  <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text.primary }}>
                    Generated Text
                  </Text>
                </View>
                <Text style={{ fontSize: 15, color: colors.text.primary, lineHeight: 22, marginBottom: 16 }}>
                  {generated}
                </Text>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <Pressable
                    onPress={() => {
                      setPrompt("");
                      setGenerated("");
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: "white",
                      borderRadius: 10,
                      padding: 14,
                      alignItems: "center",
                      borderWidth: 2,
                      borderColor: "#8b5cf6",
                    }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: "600", color: "#8b5cf6" }}>Regenerate</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleUseText}
                    style={{
                      flex: 1,
                      backgroundColor: "#8b5cf6",
                      borderRadius: 10,
                      padding: 14,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: "600", color: "white" }}>Use This Text</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Tips */}
            <View
              style={{
                backgroundColor: colors.primary[100],
                borderRadius: 12,
                padding: 16,
                marginTop: 24,
                borderLeftWidth: 4,
                borderLeftColor: colors.primary[600],
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Ionicons name="bulb-outline" size={20} color={colors.primary[600]} />
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text.primary }}>Tips for better results:</Text>
              </View>
              <Text style={{ fontSize: 13, color: colors.text.secondary, lineHeight: 20 }}>
                • Be specific about what you want{"\n"}
                • Include key details (material, size, color, condition){"\n"}
                • Mention your target audience{"\n"}
                • You can regenerate as many times as you like
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}
