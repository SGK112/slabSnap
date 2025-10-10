import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../utils/colors";
import { faqData } from "../data/faqData";

type FAQDetailRouteProp = RouteProp<{ FAQDetail: { faqId: string } }, "FAQDetail">;

export default function FAQDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<FAQDetailRouteProp>();
  const { faqId } = route.params;

  const faq = faqData.find(item => item.id === faqId);

  if (!faq) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Ionicons name="help-circle-outline" size={64} color={colors.neutral[300]} />
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '500', 
            color: colors.text.tertiary,
            marginTop: 16,
            textAlign: 'center'
          }}>
            FAQ not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
          letterSpacing: -0.3,
          flex: 1
        }}>
          {faq.category}
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Question */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 }}>
          <View style={{ 
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginBottom: 8
          }}>
            <View style={{ 
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: colors.accent[100],
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
              marginTop: 2
            }}>
              <Ionicons name="help" size={18} color={colors.accent[500]} />
            </View>
            <Text style={{ 
              flex: 1,
              fontSize: 22, 
              fontWeight: '500', 
              color: colors.text.primary,
              lineHeight: 30,
              letterSpacing: -0.3
            }}>
              {faq.question}
            </Text>
          </View>
        </View>

        {/* Answer */}
        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ 
            backgroundColor: colors.background.tertiary,
            borderRadius: 12,
            padding: 20,
            borderLeftWidth: 3,
            borderLeftColor: colors.accent[500]
          }}>
            <Text style={{ 
              fontSize: 16, 
              color: colors.text.secondary,
              lineHeight: 26,
              fontWeight: '400'
            }}>
              {faq.answer}
            </Text>
          </View>
        </View>

        {/* Related Questions */}
        <View style={{ paddingHorizontal: 20, paddingTop: 32 }}>
          <Text style={{ 
            fontSize: 13, 
            fontWeight: '600', 
            color: colors.text.secondary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 16
          }}>
            Related Questions
          </Text>

          {faqData
            .filter(item => item.category === faq.category && item.id !== faq.id)
            .slice(0, 3)
            .map(relatedFaq => (
              <Pressable
                key={relatedFaq.id}
                style={{
                  backgroundColor: colors.background.primary,
                  borderRadius: 10,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: colors.border.light,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
                onPress={() => {
                  // @ts-ignore - Navigation typing issue
                  navigation.navigate("FAQDetail", { faqId: relatedFaq.id });
                }}
              >
                <Text style={{ 
                  fontSize: 15, 
                  fontWeight: '400', 
                  color: colors.text.primary,
                  flex: 1,
                  marginRight: 12
                }}>
                  {relatedFaq.question}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.neutral[400]} />
              </Pressable>
            ))}
        </View>

        {/* Still Need Help */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <View style={{
            backgroundColor: colors.accent[100],
            borderRadius: 12,
            padding: 20,
            alignItems: 'center'
          }}>
            <Ionicons name="chatbubbles" size={32} color={colors.accent[500]} style={{ marginBottom: 12 }} />
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '500', 
              color: colors.text.primary,
              marginBottom: 4,
              textAlign: 'center'
            }}>
              Still need help?
            </Text>
            <Text style={{ 
              fontSize: 14, 
              color: colors.text.tertiary,
              marginBottom: 16,
              textAlign: 'center'
            }}>
              Contact our support team
            </Text>
            <Pressable
              style={{
                backgroundColor: colors.accent[500],
                borderRadius: 8,
                paddingVertical: 12,
                paddingHorizontal: 24
              }}
              onPress={() => {
                navigation.goBack();
                navigation.goBack();
              }}
            >
              <Text style={{ 
                fontSize: 15, 
                fontWeight: '500', 
                color: '#ffffff'
              }}>
                Contact Support
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
