import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../nav";
import { useMessagingStore } from "../state/messagingStore";
import { useAuthStore } from "../state/authStore";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { VoiceRecorder } from "../components/VoiceRecorder";
import { VoiceMessagePlayer } from "../components/VoiceMessagePlayer";
import { colors } from "../utils/colors";
import * as Haptics from "expo-haptics";

type RouteType = RouteProp<RootStackParamList, "Chat">;

export default function ChatScreen() {
  const route = useRoute<RouteType>();
  const navigation = useNavigation();
  const { conversationId } = route.params || {};
  const scrollViewRef = useRef<ScrollView>(null);

  // Handle missing conversationId
  if (!conversationId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Ionicons name="chatbubble-outline" size={64} color={colors.text.tertiary} />
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text.primary, marginTop: 16 }}>
            No conversation selected
          </Text>
          <Text style={{ fontSize: 14, color: colors.text.tertiary, marginTop: 8, textAlign: 'center' }}>
            Please select a conversation from your messages
          </Text>
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              marginTop: 24,
              paddingHorizontal: 24,
              paddingVertical: 12,
              backgroundColor: colors.primary[600],
              borderRadius: 8,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }
  
  const { user } = useAuthStore();
  const { getConversationById, getMessagesByConversation, addMessage, markAsRead } =
    useMessagingStore();

  const conversation = getConversationById(conversationId);
  const messages = getMessagesByConversation(conversationId);

  const [newMessage, setNewMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    markAsRead(conversationId);
  }, [conversationId]);

  const handleSend = () => {
    if (!newMessage.trim() || !user) return;

    const message = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId: user.id,
      senderName: user.name,
      text: newMessage.trim(),
      timestamp: Date.now(),
      read: false,
      type: "text" as const,
      platform: "slabsnap" as const,
    };

    addMessage(conversationId, message);
    setNewMessage("");
    
    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleVoiceRecordingComplete = (uri: string, duration: number) => {
    if (!user) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const message = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId: user.id,
      senderName: user.name,
      text: "Voice message",
      timestamp: Date.now(),
      read: false,
      type: "voice" as const,
      platform: "slabsnap" as const,
      voiceMessage: {
        uri,
        duration,
        waveform: Array.from({ length: 25 }, () => Math.random()),
      },
    };

    addMessage(conversationId, message);
    setIsRecording(false);
    
    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleVoiceRecordingCancel = () => {
    setIsRecording(false);
  };

  if (!conversation || !user) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={90}
      >
        {/* Header */}
        <View className="bg-white px-4 py-3 border-b border-gray-200 flex-row items-center">
          <Pressable onPress={() => navigation.goBack()} className="mr-3">
            <Ionicons name="chevron-back" size={24} color="#1f2937" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900">
              {conversation.otherUserName}
            </Text>
            <Text className="text-sm text-gray-600" numberOfLines={1}>
              {conversation.listingTitle}
            </Text>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4 py-4"
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.length === 0 ? (
            <View className="items-center justify-center py-16">
              <Ionicons name="chatbubble-outline" size={64} color="#d1d5db" />
              <Text className="text-base text-gray-500 mt-4">
                Start the conversation
              </Text>
            </View>
          ) : (
            messages.map((message) => {
              const isMe = message.senderId === user.id;
              const timeAgo = formatDistanceToNow(message.timestamp, {
                addSuffix: true,
              });

              return (
                <View
                  key={message.id}
                  style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}
                >
                  {message.type === "voice" && message.voiceMessage ? (
                    <VoiceMessagePlayer
                      voiceMessage={message.voiceMessage}
                      isOwnMessage={isMe}
                    />
                  ) : (
                    <View
                      style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleOther]}
                    >
                      {!isMe && (
                        <Text style={styles.senderName}>
                          {message.senderName}
                        </Text>
                      )}
                      <Text style={isMe ? styles.messageTextMe : styles.messageTextOther}>
                        {message.text}
                      </Text>
                      <Text style={isMe ? styles.timestampMe : styles.timestampOther}>
                        {timeAgo}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Input */}
        {isRecording ? (
          <VoiceRecorder
            onRecordingComplete={handleVoiceRecordingComplete}
            onCancel={handleVoiceRecordingCancel}
          />
        ) : (
          <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              {/* Microphone Button */}
              <Pressable
                style={styles.voiceButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setIsRecording(true);
                }}
              >
                <Ionicons name="mic" size={24} color={colors.primary[600]} />
              </Pressable>

              {/* Text Input */}
              <TextInput
                style={styles.textInput}
                placeholder="Type a message..."
                placeholderTextColor={colors.text.quaternary}
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                maxLength={500}
              />

              {/* Send Button */}
              <Pressable
                style={[
                  styles.sendButton,
                  newMessage.trim() ? styles.sendButtonActive : styles.sendButtonInactive
                ]}
                onPress={handleSend}
                disabled={!newMessage.trim()}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={newMessage.trim() ? "white" : colors.text.quaternary}
                />
              </Pressable>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  messageRowMe: {
    justifyContent: "flex-end",
  },
  messageRowOther: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "75%",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageBubbleMe: {
    backgroundColor: colors.accent[500],
  },
  messageBubbleOther: {
    backgroundColor: "white",
  },
  senderName: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 4,
  },
  messageTextMe: {
    fontSize: 15,
    color: "white",
    lineHeight: 20,
  },
  messageTextOther: {
    fontSize: 15,
    color: colors.text.primary,
    lineHeight: 20,
  },
  timestampMe: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  timestampOther: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: 4,
  },
  inputContainer: {
    backgroundColor: "white",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.light,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text.primary,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonActive: {
    backgroundColor: colors.accent[500],
  },
  sendButtonInactive: {
    backgroundColor: colors.background.secondary,
  },
});