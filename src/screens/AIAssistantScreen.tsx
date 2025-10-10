import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../utils/colors";
import { getAnthropicTextResponse } from "../api/chat-service";
import * as Haptics from "expo-haptics";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export default function AIAssistantScreen() {
  const navigation = useNavigation();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your stone countertop assistant. I can help you with questions about granite, marble, quartz, installation, measurements, and more. What would you like to know?",
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: inputText.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const response = await getAnthropicTextResponse(
        [
          {
            role: "system",
            content: "You are a helpful assistant specializing in stone countertops, granite, marble, quartz, quartzite, fabrication, and installation. Provide clear, concise, and helpful advice.",
          },
          {
            role: "user",
            content: inputText.trim(),
          },
        ],
        {
          model: "claude-3-5-sonnet-20240620",
          maxTokens: 1024,
        }
      );

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.content,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("AI Chat error:", error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "I apologize, but I encountered an error. Please try again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    "What's the difference between granite and quartz?",
    "How do I measure for countertops?",
    "What's the best stone for kitchens?",
    "How much does installation cost?",
  ];

  const handleQuickQuestion = (question: string) => {
    setInputText(question);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.light,
          backgroundColor: colors.background.secondary,
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={{ marginRight: 12 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.primary[100],
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Ionicons name="chatbubbles" size={22} color={colors.primary[600]} />
          </View>
          <View>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text.primary }}>
              AI Assistant
            </Text>
            <Text style={{ fontSize: 13, color: colors.text.tertiary }}>
              Stone Countertop Expert
            </Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1, padding: 16 }}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={{
                marginBottom: 16,
                alignItems: message.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <View
                style={{
                  maxWidth: "80%",
                  padding: 12,
                  borderRadius: 16,
                  backgroundColor:
                    message.role === "user" ? colors.primary[600] : colors.background.secondary,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    color: message.role === "user" ? "white" : colors.text.primary,
                    lineHeight: 20,
                  }}
                >
                  {message.content}
                </Text>
              </View>
            </View>
          ))}

          {isLoading && (
            <View style={{ alignItems: "flex-start", marginBottom: 16 }}>
              <View
                style={{
                  padding: 12,
                  borderRadius: 16,
                  backgroundColor: colors.background.secondary,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <ActivityIndicator size="small" color={colors.primary[600]} />
                <Text style={{ fontSize: 15, color: colors.text.tertiary, marginLeft: 8 }}>
                  Thinking...
                </Text>
              </View>
            </View>
          )}

          {/* Quick Questions */}
          {messages.length === 1 && (
            <View style={{ marginTop: 20 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.text.secondary,
                  marginBottom: 12,
                }}
              >
                Quick questions:
              </Text>
              {quickQuestions.map((question, index) => (
                <Pressable
                  key={index}
                  onPress={() => handleQuickQuestion(question)}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: colors.background.tertiary,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: colors.border.light,
                  }}
                >
                  <Text style={{ fontSize: 14, color: colors.text.primary }}>{question}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border.light,
            backgroundColor: colors.background.primary,
          }}
        >
          <TextInput
            style={{
              flex: 1,
              backgroundColor: colors.background.secondary,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              fontSize: 15,
              color: colors.text.primary,
              marginRight: 12,
            }}
            placeholder="Ask me anything..."
            placeholderTextColor={colors.text.quaternary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <Pressable
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: inputText.trim() && !isLoading ? colors.primary[600] : colors.neutral[300],
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() && !isLoading ? "white" : colors.text.quaternary}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
