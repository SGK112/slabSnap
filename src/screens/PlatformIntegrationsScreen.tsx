import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Switch, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../utils/colors";
import * as Haptics from "expo-haptics";

type PlatformType = "whatsapp" | "telegram" | "instagram" | "facebook" | "twitter" | "messenger";

interface PlatformConnection {
  id: string;
  platform: PlatformType;
  connected: boolean;
  identifier?: string; // phone, username, handle
  syncEnabled: boolean;
  lastSync?: Date;
}

const PLATFORMS = [
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    icon: "logo-whatsapp" as const,
    color: "#25D366",
    description: "Sync WhatsApp Business messages",
    inputLabel: "Phone Number",
    inputPlaceholder: "+1 (555) 123-4567",
  },
  {
    id: "telegram",
    name: "Telegram",
    icon: "paper-plane" as const,
    color: "#0088cc",
    description: "Sync Telegram chats",
    inputLabel: "Username",
    inputPlaceholder: "@username",
  },
  {
    id: "instagram",
    name: "Instagram Direct",
    icon: "logo-instagram" as const,
    color: "#E4405F",
    description: "Sync Instagram DMs",
    inputLabel: "Instagram Handle",
    inputPlaceholder: "@yourbusiness",
  },
  {
    id: "facebook",
    name: "Facebook Messenger",
    icon: "logo-facebook" as const,
    color: "#1877F2",
    description: "Sync Facebook page messages",
    inputLabel: "Page Name",
    inputPlaceholder: "Your Business Page",
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    icon: "logo-twitter" as const,
    color: "#000000",
    description: "Sync X/Twitter DMs",
    inputLabel: "Handle",
    inputPlaceholder: "@yourbusiness",
  },
  {
    id: "messenger",
    name: "Messenger",
    icon: "chatbubbles" as const,
    color: "#0084FF",
    description: "Sync Messenger chats",
    inputLabel: "Username",
    inputPlaceholder: "m.me/yourbusiness",
  },
];

export default function PlatformIntegrationsScreen() {
  const navigation = useNavigation();
  
  const [connections, setConnections] = useState<PlatformConnection[]>(
    PLATFORMS.map(p => ({
      id: p.id,
      platform: p.id as PlatformType,
      connected: false,
      syncEnabled: true,
    }))
  );

  const [setupPlatform, setSetupPlatform] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");

  const handleConnect = (platformId: string) => {
    if (!inputValue || inputValue.length < 3) {
      Alert.alert("Invalid Input", "Please enter valid information");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const platform = PLATFORMS.find(p => p.id === platformId);
    
    setConnections(prev => prev.map(conn => {
      if (conn.platform === platformId) {
        return {
          ...conn,
          connected: true,
          identifier: inputValue,
          lastSync: new Date(),
        };
      }
      return conn;
    }));

    setSetupPlatform(null);
    setInputValue("");
    
    Alert.alert(
      `${platform?.name} Connected!`,
      `Your ${platform?.name} messages will now sync to SlabSnap Inbox.`,
      [{ text: "OK" }]
    );
  };

  const handleDisconnect = (platformId: string, platformName: string) => {
    Alert.alert(
      `Disconnect ${platformName}?`,
      "Your messages will no longer sync from this platform.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setConnections(prev => prev.map(conn => {
              if (conn.platform === platformId) {
                return {
                  ...conn,
                  connected: false,
                  identifier: undefined,
                };
              }
              return conn;
            }));
          },
        },
      ]
    );
  };

  const toggleSync = (platformId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setConnections(prev => prev.map(conn => {
      if (conn.platform === platformId) {
        return { ...conn, syncEnabled: !conn.syncEnabled };
      }
      return conn;
    }));
  };

  const connectedCount = connections.filter(c => c.connected).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <View style={styles.titleIcon}>
            <Ionicons name="sync" size={32} color={colors.primary[600]} />
          </View>
          <Text style={styles.title}>Connect Platforms</Text>
          <Text style={styles.subtitle}>
            Sync all your messaging platforms into one unified inbox. Never miss a customer message again.
          </Text>
          {connectedCount > 0 && (
            <View style={styles.connectedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success.main} />
              <Text style={styles.connectedBadgeText}>
                {connectedCount} platform{connectedCount !== 1 ? "s" : ""} connected
              </Text>
            </View>
          )}
        </View>

        {/* Benefits */}
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>Unified Inbox Benefits</Text>
          <View style={styles.benefitRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success.main} />
            <Text style={styles.benefitText}>All customer messages in one place</Text>
          </View>
          <View style={styles.benefitRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success.main} />
            <Text style={styles.benefitText}>Respond faster to inquiries</Text>
          </View>
          <View style={styles.benefitRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success.main} />
            <Text style={styles.benefitText}>Voice message support</Text>
          </View>
          <View style={styles.benefitRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success.main} />
            <Text style={styles.benefitText}>Real-time sync across platforms</Text>
          </View>
        </View>

        {/* Platforms */}
        <View style={styles.platformsSection}>
          <Text style={styles.sectionTitle}>Available Platforms</Text>
          
          {PLATFORMS.map((platform) => {
            const connection = connections.find(c => c.platform === platform.id);
            const isSetup = setupPlatform === platform.id;

            return (
              <View key={platform.id} style={styles.platformCard}>
                <View style={styles.platformHeader}>
                  <View style={styles.platformTitleRow}>
                    <View style={[styles.platformIcon, { backgroundColor: platform.color }]}>
                      <Ionicons name={platform.icon} size={28} color="white" />
                    </View>
                    <View style={styles.platformInfo}>
                      <Text style={styles.platformName}>{platform.name}</Text>
                      <Text style={styles.platformDescription}>{platform.description}</Text>
                      {connection?.connected && (
                        <Text style={styles.platformStatus}>
                          Connected • {connection.identifier}
                        </Text>
                      )}
                    </View>
                  </View>

                  {connection?.connected && (
                    <Switch
                      value={connection.syncEnabled}
                      onValueChange={() => toggleSync(platform.id)}
                      trackColor={{ false: colors.neutral[300], true: platform.color }}
                      thumbColor="white"
                    />
                  )}
                </View>

                {connection?.connected ? (
                  <View style={styles.platformActions}>
                    {connection.lastSync && (
                      <View style={styles.syncInfo}>
                        <Ionicons name="sync" size={14} color={colors.text.tertiary} />
                        <Text style={styles.lastSyncText}>
                          Last synced: {connection.lastSync.toLocaleTimeString()}
                        </Text>
                      </View>
                    )}
                    <Pressable
                      style={styles.disconnectButton}
                      onPress={() => handleDisconnect(platform.id, platform.name)}
                    >
                      <Text style={styles.disconnectButtonText}>Disconnect</Text>
                    </Pressable>
                  </View>
                ) : isSetup ? (
                  <View style={styles.setupForm}>
                    <Text style={styles.setupLabel}>{platform.inputLabel}</Text>
                    <TextInput
                      style={styles.setupInput}
                      placeholder={platform.inputPlaceholder}
                      placeholderTextColor={colors.text.quaternary}
                      value={inputValue}
                      onChangeText={setInputValue}
                      autoCapitalize="none"
                      autoFocus
                    />
                    <View style={styles.setupActions}>
                      <Pressable
                        style={styles.cancelButton}
                        onPress={() => {
                          setSetupPlatform(null);
                          setInputValue("");
                        }}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.connectButton, { backgroundColor: platform.color }]}
                        onPress={() => handleConnect(platform.id)}
                      >
                        <Text style={styles.connectButtonText}>Connect</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    style={styles.setupButton}
                    onPress={() => setSetupPlatform(platform.id)}
                  >
                    <Ionicons name="add-circle" size={20} color={platform.color} />
                    <Text style={[styles.setupButtonText, { color: platform.color }]}>
                      Connect {platform.name}
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>

        {/* Security & Privacy */}
        <View style={styles.securityCard}>
          <Ionicons name="shield-checkmark" size={24} color={colors.primary[600]} />
          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>Your privacy is protected</Text>
            <Text style={styles.securityText}>
              • End-to-end encryption for all synced messages{"\n"}
              • OAuth 2.0 secure authentication{"\n"}
              • Messages never stored on our servers{"\n"}
              • You can disconnect anytime
            </Text>
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.howItWorksCard}>
          <Text style={styles.howItWorksTitle}>How It Works</Text>
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>
              Connect your platforms using secure OAuth authentication
            </Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>
              Messages automatically sync every 5 minutes
            </Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>
              Reply from SlabSnap and it syncs back to the original platform
            </Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <Text style={styles.stepText}>
              Use voice messages, images, and text across all platforms
            </Text>
          </View>
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backText: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text.primary,
  },
  content: {
    flex: 1,
  },
  titleSection: {
    alignItems: "center",
    padding: 24,
  },
  titleIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[100],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 16,
  },
  connectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.success.light,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  connectedBadgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.success.dark,
  },
  benefitsCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    backgroundColor: colors.success.light,
    borderRadius: 12,
    gap: 10,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.success.dark,
    marginBottom: 6,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  benefitText: {
    fontSize: 14,
    color: colors.success.dark,
    flex: 1,
  },
  platformsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 16,
  },
  platformCard: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.main,
  },
  platformHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  platformTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  platformIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  platformInfo: {
    flex: 1,
  },
  platformName: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 2,
  },
  platformDescription: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginBottom: 4,
  },
  platformStatus: {
    fontSize: 13,
    color: colors.success.main,
    fontWeight: "500",
  },
  platformActions: {
    gap: 12,
  },
  syncInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  lastSyncText: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  disconnectButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.error.main,
    alignItems: "center",
  },
  disconnectButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.error.main,
  },
  setupButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  setupButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  setupForm: {
    gap: 12,
  },
  setupLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  setupInput: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 15,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.main,
  },
  setupActions: {
    flexDirection: "row",
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.main,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  connectButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
  securityCard: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    gap: 12,
  },
  securityContent: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary[900],
    marginBottom: 8,
  },
  securityText: {
    fontSize: 13,
    color: colors.primary[700],
    lineHeight: 20,
  },
  howItWorksCard: {
    marginHorizontal: 20,
    marginBottom: 32,
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
  },
  howItWorksTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary[600],
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    paddingTop: 4,
  },
});
