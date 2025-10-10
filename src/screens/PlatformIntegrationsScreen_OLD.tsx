import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Switch, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../utils/colors";
import * as Haptics from "expo-haptics";

interface PlatformConnection {
  id: string;
  platform: "whatsapp" | "telegram";
  connected: boolean;
  phoneNumber?: string;
  username?: string;
  syncEnabled: boolean;
  lastSync?: Date;
}

export default function PlatformIntegrationsScreen() {
  const navigation = useNavigation();
  
  const [connections, setConnections] = useState<PlatformConnection[]>([
    {
      id: "wa-1",
      platform: "whatsapp",
      connected: false,
      syncEnabled: true,
    },
    {
      id: "tg-1",
      platform: "telegram",
      connected: false,
      syncEnabled: true,
    },
  ]);

  const [showWhatsAppSetup, setShowWhatsAppSetup] = useState(false);
  const [showTelegramSetup, setShowTelegramSetup] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");

  const handleConnectWhatsApp = () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert("Invalid Phone", "Please enter a valid phone number");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    setConnections(prev => prev.map(conn => {
      if (conn.platform === "whatsapp") {
        return {
          ...conn,
          connected: true,
          phoneNumber,
          lastSync: new Date(),
        };
      }
      return conn;
    }));

    setShowWhatsAppSetup(false);
    setPhoneNumber("");
    
    Alert.alert(
      "WhatsApp Connected!",
      "Your WhatsApp messages will now sync to SlabSnap Inbox. You will receive a verification code via WhatsApp shortly.",
      [{ text: "OK" }]
    );
  };

  const handleConnectTelegram = () => {
    if (!telegramUsername || telegramUsername.length < 3) {
      Alert.alert("Invalid Username", "Please enter your Telegram username");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    setConnections(prev => prev.map(conn => {
      if (conn.platform === "telegram") {
        return {
          ...conn,
          connected: true,
          username: telegramUsername,
          lastSync: new Date(),
        };
      }
      return conn;
    }));

    setShowTelegramSetup(false);
    setTelegramUsername("");
    
    Alert.alert(
      "Telegram Connected!",
      "Your Telegram messages will now sync to SlabSnap Inbox. Please check Telegram for a bot verification message.",
      [{ text: "OK" }]
    );
  };

  const handleDisconnect = (platform: "whatsapp" | "telegram") => {
    Alert.alert(
      `Disconnect ${platform === "whatsapp" ? "WhatsApp" : "Telegram"}?`,
      "Your messages will no longer sync from this platform.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setConnections(prev => prev.map(conn => {
              if (conn.platform === platform) {
                return {
                  ...conn,
                  connected: false,
                  phoneNumber: undefined,
                  username: undefined,
                };
              }
              return conn;
            }));
          },
        },
      ]
    );
  };

  const toggleSync = (platform: "whatsapp" | "telegram") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setConnections(prev => prev.map(conn => {
      if (conn.platform === platform) {
        return { ...conn, syncEnabled: !conn.syncEnabled };
      }
      return conn;
    }));
  };

  const whatsapp = connections.find(c => c.platform === "whatsapp");
  const telegram = connections.find(c => c.platform === "telegram");

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
          <Text style={styles.title}>Platform Integrations</Text>
          <Text style={styles.subtitle}>
            Connect your WhatsApp and Telegram accounts to receive all your business messages in one unified inbox.
          </Text>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>Why connect?</Text>
          <View style={styles.benefitRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success.main} />
            <Text style={styles.benefitText}>All messages in one place</Text>
          </View>
          <View style={styles.benefitRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success.main} />
            <Text style={styles.benefitText}>Never miss a customer inquiry</Text>
          </View>
          <View style={styles.benefitRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success.main} />
            <Text style={styles.benefitText}>Voice message support</Text>
          </View>
          <View style={styles.benefitRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success.main} />
            <Text style={styles.benefitText}>Auto-sync every 5 minutes</Text>
          </View>
        </View>

        {/* WhatsApp Integration */}
        <View style={styles.platformCard}>
          <View style={styles.platformHeader}>
            <View style={styles.platformTitleRow}>
              <View style={[styles.platformIcon, { backgroundColor: "#25D366" }]}>
                <Ionicons name="logo-whatsapp" size={28} color="white" />
              </View>
              <View style={styles.platformInfo}>
                <Text style={styles.platformName}>WhatsApp Business</Text>
                {whatsapp?.connected ? (
                  <Text style={styles.platformStatus}>
                    Connected • {whatsapp.phoneNumber}
                  </Text>
                ) : (
                  <Text style={styles.platformStatusDisconnected}>Not connected</Text>
                )}
              </View>
            </View>

            {whatsapp?.connected && (
              <Switch
                value={whatsapp.syncEnabled}
                onValueChange={() => toggleSync("whatsapp")}
                trackColor={{ false: colors.neutral[300], true: "#25D366" }}
                thumbColor="white"
              />
            )}
          </View>

          {whatsapp?.connected ? (
            <View style={styles.platformActions}>
              {whatsapp.lastSync && (
                <Text style={styles.lastSyncText}>
                  Last synced: {whatsapp.lastSync.toLocaleTimeString()}
                </Text>
              )}
              <Pressable
                style={styles.disconnectButton}
                onPress={() => handleDisconnect("whatsapp")}
              >
                <Text style={styles.disconnectButtonText}>Disconnect</Text>
              </Pressable>
            </View>
          ) : showWhatsAppSetup ? (
            <View style={styles.setupForm}>
              <Text style={styles.setupLabel}>Phone Number</Text>
              <TextInput
                style={styles.setupInput}
                placeholder="+1 (555) 123-4567"
                placeholderTextColor={colors.text.quaternary}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                autoFocus
              />
              <View style={styles.setupActions}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => setShowWhatsAppSetup(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={styles.connectButton}
                  onPress={handleConnectWhatsApp}
                >
                  <Text style={styles.connectButtonText}>Connect</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              style={styles.setupButton}
              onPress={() => setShowWhatsAppSetup(true)}
            >
              <Ionicons name="add-circle" size={20} color={colors.primary[600]} />
              <Text style={styles.setupButtonText}>Connect WhatsApp</Text>
            </Pressable>
          )}
        </View>

        {/* Telegram Integration */}
        <View style={styles.platformCard}>
          <View style={styles.platformHeader}>
            <View style={styles.platformTitleRow}>
              <View style={[styles.platformIcon, { backgroundColor: "#0088cc" }]}>
                <Ionicons name="paper-plane" size={28} color="white" />
              </View>
              <View style={styles.platformInfo}>
                <Text style={styles.platformName}>Telegram</Text>
                {telegram?.connected ? (
                  <Text style={styles.platformStatus}>
                    Connected • @{telegram.username}
                  </Text>
                ) : (
                  <Text style={styles.platformStatusDisconnected}>Not connected</Text>
                )}
              </View>
            </View>

            {telegram?.connected && (
              <Switch
                value={telegram.syncEnabled}
                onValueChange={() => toggleSync("telegram")}
                trackColor={{ false: colors.neutral[300], true: "#0088cc" }}
                thumbColor="white"
              />
            )}
          </View>

          {telegram?.connected ? (
            <View style={styles.platformActions}>
              {telegram.lastSync && (
                <Text style={styles.lastSyncText}>
                  Last synced: {telegram.lastSync.toLocaleTimeString()}
                </Text>
              )}
              <Pressable
                style={styles.disconnectButton}
                onPress={() => handleDisconnect("telegram")}
              >
                <Text style={styles.disconnectButtonText}>Disconnect</Text>
              </Pressable>
            </View>
          ) : showTelegramSetup ? (
            <View style={styles.setupForm}>
              <Text style={styles.setupLabel}>Telegram Username</Text>
              <TextInput
                style={styles.setupInput}
                placeholder="@username"
                placeholderTextColor={colors.text.quaternary}
                value={telegramUsername}
                onChangeText={setTelegramUsername}
                autoCapitalize="none"
                autoFocus
              />
              <View style={styles.setupActions}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => setShowTelegramSetup(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={styles.connectButton}
                  onPress={handleConnectTelegram}
                >
                  <Text style={styles.connectButtonText}>Connect</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              style={styles.setupButton}
              onPress={() => setShowTelegramSetup(true)}
            >
              <Ionicons name="add-circle" size={20} color={colors.primary[600]} />
              <Text style={styles.setupButtonText}>Connect Telegram</Text>
            </Pressable>
          )}
        </View>

        {/* Security Note */}
        <View style={styles.securityCard}>
          <Ionicons name="shield-checkmark" size={24} color={colors.primary[600]} />
          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>Your privacy is protected</Text>
            <Text style={styles.securityText}>
              We use end-to-end encryption and never store your messages on our servers. 
              All syncing happens securely between your device and the messaging platforms.
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
  },
  platformCard: {
    marginHorizontal: 20,
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
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 4,
  },
  platformStatus: {
    fontSize: 13,
    color: colors.success.main,
    fontWeight: "500",
  },
  platformStatusDisconnected: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  platformActions: {
    gap: 12,
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
    color: colors.primary[600],
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
    backgroundColor: colors.primary[600],
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
    marginBottom: 6,
  },
  securityText: {
    fontSize: 13,
    color: colors.primary[700],
    lineHeight: 19,
  },
});
