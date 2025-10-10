import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Switch, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../utils/colors";

export default function PrivacyScreen() {
  const navigation = useNavigation();

  const [profilePublic, setProfilePublic] = useState(true);
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [allowMessages, setAllowMessages] = useState(true);

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            Alert.alert("Account Deleted", "Your account has been scheduled for deletion.");
          }
        }
      ]
    );
  };

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
          Privacy & Safety
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* Profile Privacy */}
        <View style={{ paddingTop: 24 }}>
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 13, 
              fontWeight: '600', 
              color: colors.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              Profile Visibility
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
                  Public Profile
                </Text>
                <Text style={{ 
                  fontSize: 14, 
                  color: colors.text.tertiary 
                }}>
                  Allow others to view your profile and listings
                </Text>
              </View>
              <Switch
                value={profilePublic}
                onValueChange={setProfilePublic}
                trackColor={{ false: colors.neutral[300], true: colors.accent[300] }}
                thumbColor={profilePublic ? colors.accent[500] : colors.neutral[100]}
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
                  Show Email
                </Text>
                <Text style={{ 
                  fontSize: 14, 
                  color: colors.text.tertiary 
                }}>
                  Display email address on your profile
                </Text>
              </View>
              <Switch
                value={showEmail}
                onValueChange={setShowEmail}
                trackColor={{ false: colors.neutral[300], true: colors.accent[300] }}
                thumbColor={showEmail ? colors.accent[500] : colors.neutral[100]}
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
                  Show Phone Number
                </Text>
                <Text style={{ 
                  fontSize: 14, 
                  color: colors.text.tertiary 
                }}>
                  Display phone number on your profile
                </Text>
              </View>
              <Switch
                value={showPhone}
                onValueChange={setShowPhone}
                trackColor={{ false: colors.neutral[300], true: colors.accent[300] }}
                thumbColor={showPhone ? colors.accent[500] : colors.neutral[100]}
              />
            </View>
          </View>
        </View>

        {/* Communication */}
        <View style={{ paddingTop: 24 }}>
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 13, 
              fontWeight: '600', 
              color: colors.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              Communication
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
                  Allow Messages
                </Text>
                <Text style={{ 
                  fontSize: 14, 
                  color: colors.text.tertiary 
                }}>
                  Let other users send you messages
                </Text>
              </View>
              <Switch
                value={allowMessages}
                onValueChange={setAllowMessages}
                trackColor={{ false: colors.neutral[300], true: colors.accent[300] }}
                thumbColor={allowMessages ? colors.accent[500] : colors.neutral[100]}
              />
            </View>
          </View>
        </View>

        {/* Blocked Users */}
        <View style={{ paddingTop: 24 }}>
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 13, 
              fontWeight: '600', 
              color: colors.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              Blocked Accounts
            </Text>
          </View>

          <View style={{ backgroundColor: colors.background.primary }}>
            <Pressable 
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.border.light
              }}
              onPress={() => Alert.alert("Blocked Users", "No blocked users")}
            >
              <View style={{ flex: 1, marginRight: 16 }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '500', 
                  color: colors.text.primary,
                  marginBottom: 4
                }}>
                  Manage Blocked Users
                </Text>
                <Text style={{ 
                  fontSize: 14, 
                  color: colors.text.tertiary 
                }}>
                  View and manage blocked accounts
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
            </Pressable>
          </View>
        </View>

        {/* Data & Account */}
        <View style={{ paddingTop: 24, paddingBottom: 32 }}>
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 13, 
              fontWeight: '600', 
              color: colors.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              Data & Account
            </Text>
          </View>

          <View style={{ backgroundColor: colors.background.primary }}>
            <Pressable 
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.border.light
              }}
              onPress={() => Alert.alert("Download Data", "Your data download will be ready in 24-48 hours. We'll send you an email.")}
            >
              <View style={{ flex: 1, marginRight: 16 }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '500', 
                  color: colors.text.primary,
                  marginBottom: 4
                }}>
                  Download Your Data
                </Text>
                <Text style={{ 
                  fontSize: 14, 
                  color: colors.text.tertiary 
                }}>
                  Request a copy of your account data
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
            </Pressable>

            <Pressable 
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingVertical: 16,
              }}
              onPress={handleDeleteAccount}
            >
              <View style={{ flex: 1, marginRight: 16 }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '500', 
                  color: colors.error.main,
                  marginBottom: 4
                }}>
                  Delete Account
                </Text>
                <Text style={{ 
                  fontSize: 14, 
                  color: colors.text.tertiary 
                }}>
                  Permanently delete your account and data
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.error.main} />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
