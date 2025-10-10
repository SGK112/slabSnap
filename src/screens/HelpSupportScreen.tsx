import React from "react";
import { View, Text, ScrollView, Pressable, Linking, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../utils/colors";
import { faqData } from "../data/faqData";

export default function HelpSupportScreen() {
  const navigation = useNavigation();

  const handleEmailSupport = () => {
    Linking.openURL("mailto:support@surprisegranite.com?subject=cutStone Support Request");
  };

  const handleChatSupport = () => {
    Alert.alert("Chat Support", "Chat support coming soon! For now, please email us at support@surprisegranite.com");
  };

  const handleFAQ = (faqId: string) => {
    // @ts-ignore - Navigation typing issue
    navigation.navigate("FAQDetail", { faqId });
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
          Help & Support
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* Contact Options */}
        <View style={{ paddingTop: 24 }}>
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 13, 
              fontWeight: '600', 
              color: colors.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              Get in Touch
            </Text>
          </View>

          <View style={{ backgroundColor: colors.background.primary }}>
            <Pressable 
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingVertical: 18,
                borderBottomWidth: 1,
                borderBottomColor: colors.border.light
              }}
              onPress={handleEmailSupport}
            >
              <View style={{ 
                width: 44, 
                height: 44, 
                borderRadius: 22,
                backgroundColor: colors.accent[100],
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16
              }}>
                <Ionicons name="mail" size={22} color={colors.accent[500]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '500', 
                  color: colors.text.primary,
                  marginBottom: 2
                }}>
                  Email Support
                </Text>
                <Text style={{ 
                  fontSize: 14, 
                  color: colors.text.tertiary 
                }}>
                  support@surprisegranite.com
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
            </Pressable>

            <Pressable 
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingVertical: 18,
                borderBottomWidth: 1,
                borderBottomColor: colors.border.light
              }}
              onPress={handleChatSupport}
            >
              <View style={{ 
                width: 44, 
                height: 44, 
                borderRadius: 22,
                backgroundColor: colors.accent[100],
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16
              }}>
                <Ionicons name="chatbubbles" size={22} color={colors.accent[500]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '500', 
                  color: colors.text.primary,
                  marginBottom: 2
                }}>
                  Chat Support
                </Text>
                <Text style={{ 
                  fontSize: 14, 
                  color: colors.text.tertiary 
                }}>
                  Coming soon
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
            </Pressable>
          </View>
        </View>

        {/* FAQs */}
        <View style={{ paddingTop: 24 }}>
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 13, 
              fontWeight: '600', 
              color: colors.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              Frequently Asked Questions
            </Text>
          </View>

          <View style={{ backgroundColor: colors.background.primary }}>
            {faqData.slice(0, 8).map((faq, index) => (
              <Pressable 
                key={faq.id}
                style={{ 
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  borderBottomWidth: index < 7 ? 1 : 0,
                  borderBottomColor: colors.border.light
                }}
                onPress={() => handleFAQ(faq.id)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '400', 
                    color: colors.text.primary,
                    flex: 1
                  }}>
                    {faq.question}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.neutral[400]} />
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Resources */}
        <View style={{ paddingTop: 24, paddingBottom: 32 }}>
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 13, 
              fontWeight: '600', 
              color: colors.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              Resources
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
              onPress={() => Alert.alert("Terms of Service", "View our terms at curative.app/terms")}
            >
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '400', 
                color: colors.text.primary 
              }}>
                Terms of Service
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
            </Pressable>

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
              onPress={() => Alert.alert("Privacy Policy", "View our privacy policy at curative.app/privacy")}
            >
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '400', 
                color: colors.text.primary 
              }}>
                Privacy Policy
              </Text>
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
              onPress={() => Alert.alert("Community Guidelines", "View our guidelines at curative.app/guidelines")}
            >
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '400', 
                color: colors.text.primary 
              }}>
                Community Guidelines
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.neutral[400]} />
            </Pressable>
          </View>
        </View>

        {/* App Info */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 40, alignItems: 'center' }}>
          <Text style={{ fontSize: 14, color: colors.text.tertiary, marginBottom: 4 }}>
            cutStone Version 1.0.0
          </Text>
          <Text style={{ fontSize: 13, color: colors.text.quaternary }}>
            Powered by Surprise Granite
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
