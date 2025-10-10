import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../utils/colors";

export default function NotificationsScreen() {
  const navigation = useNavigation();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [messagesEnabled, setMessagesEnabled] = useState(true);
  const [listingsEnabled, setListingsEnabled] = useState(true);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      {/* Header */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center',
        paddingHorizontal: 20, 
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light 
      }}>
        <Pressable 
          onPress={() => navigation.goBack()}
          style={{ padding: 4, marginRight: 12 }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={{ 
          fontSize: 17, 
          fontWeight: '500', 
          color: colors.text.primary,
          letterSpacing: -0.3 
        }}>
          Notifications
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* Push Notifications Section */}
        <View style={{ paddingTop: 24 }}>
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 13, 
              fontWeight: '600', 
              color: colors.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              Push Notifications
            </Text>
          </View>

          <View style={{ backgroundColor: colors.background.primary }}>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border.light
            }}>
              <View style={{ flex: 1, marginRight: 16 }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '500', 
                  color: colors.text.primary,
                  marginBottom: 4
                }}>
                  Enable Push Notifications
                </Text>
                <Text style={{ 
                  fontSize: 14, 
                  color: colors.text.tertiary 
                }}>
                  Receive instant updates on your device
                </Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{ false: colors.neutral[300], true: colors.accent[300] }}
                thumbColor={pushEnabled ? colors.accent[500] : colors.neutral[100]}
              />
            </View>
          </View>
        </View>

        {/* Email Section */}
        <View style={{ paddingTop: 24 }}>
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 13, 
              fontWeight: '600', 
              color: colors.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              Email Notifications
            </Text>
          </View>

          <View style={{ backgroundColor: colors.background.primary }}>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border.light
            }}>
              <View style={{ flex: 1, marginRight: 16 }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '500', 
                  color: colors.text.primary,
                  marginBottom: 4
                }}>
                  Email Notifications
                </Text>
                <Text style={{ 
                  fontSize: 14, 
                  color: colors.text.tertiary 
                }}>
                  Receive updates via email
                </Text>
              </View>
              <Switch
                value={emailEnabled}
                onValueChange={setEmailEnabled}
                trackColor={{ false: colors.neutral[300], true: colors.accent[300] }}
                thumbColor={emailEnabled ? colors.accent[500] : colors.neutral[100]}
              />
            </View>
          </View>
        </View>

        {/* Activity Section */}
        <View style={{ paddingTop: 24 }}>
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 13, 
              fontWeight: '600', 
              color: colors.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              Activity
            </Text>
          </View>

          <View style={{ backgroundColor: colors.background.primary }}>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border.light
            }}>
              <View style={{ flex: 1, marginRight: 16 }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '500', 
                  color: colors.text.primary,
                  marginBottom: 4
                }}>
                  Messages
                </Text>
                <Text style={{ 
                  fontSize: 14, 
                  color: colors.text.tertiary 
                }}>
                  New messages from buyers and sellers
                </Text>
              </View>
              <Switch
                value={messagesEnabled}
                onValueChange={setMessagesEnabled}
                trackColor={{ false: colors.neutral[300], true: colors.accent[300] }}
                thumbColor={messagesEnabled ? colors.accent[500] : colors.neutral[100]}
              />
            </View>

            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border.light
            }}>
              <View style={{ flex: 1, marginRight: 16 }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '500', 
                  color: colors.text.primary,
                  marginBottom: 4
                }}>
                  Listing Updates
                </Text>
                <Text style={{ 
                  fontSize: 14, 
                  color: colors.text.tertiary 
                }}>
                  Status changes and expiration reminders
                </Text>
              </View>
              <Switch
                value={listingsEnabled}
                onValueChange={setListingsEnabled}
                trackColor={{ false: colors.neutral[300], true: colors.accent[300] }}
                thumbColor={listingsEnabled ? colors.accent[500] : colors.neutral[100]}
              />
            </View>
          </View>
        </View>

        {/* Marketing Section */}
        <View style={{ paddingTop: 24, paddingBottom: 32 }}>
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 13, 
              fontWeight: '600', 
              color: colors.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              Marketing
            </Text>
          </View>

          <View style={{ backgroundColor: colors.background.primary }}>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 16,
            }}>
              <View style={{ flex: 1, marginRight: 16 }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '500', 
                  color: colors.text.primary,
                  marginBottom: 4
                }}>
                  Promotional Emails
                </Text>
                <Text style={{ 
                  fontSize: 14, 
                  color: colors.text.tertiary 
                }}>
                  Tips, featured listings, and special offers
                </Text>
              </View>
              <Switch
                value={marketingEnabled}
                onValueChange={setMarketingEnabled}
                trackColor={{ false: colors.neutral[300], true: colors.accent[300] }}
                thumbColor={marketingEnabled ? colors.accent[500] : colors.neutral[100]}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
