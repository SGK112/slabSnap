import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../nav";
import { useAuthStore } from "../state/authStore";
import { UserType } from "../types/marketplace";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors } from "../utils/colors";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Signup">;

const ACCOUNT_TYPES: Array<{ type: UserType; title: string; description: string; icon: string }> = [
  {
    type: "homeowner",
    title: "Homeowner",
    description: "I'm looking for materials for my home project",
    icon: "home",
  },
  {
    type: "fabricator",
    title: "Fabricator",
    description: "I fabricate and install countertops",
    icon: "hammer",
  },
  {
    type: "vendor",
    title: "Vendor/Supplier",
    description: "I supply remodeling materials",
    icon: "business",
  },
  {
    type: "contractor",
    title: "Contractor",
    description: "I do remodeling and construction",
    icon: "construct",
  },
  {
    type: "designer",
    title: "Designer",
    description: "I'm an interior designer",
    icon: "color-palette",
  },
];

export default function SignupScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { signup, updateUser } = useAuthStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<UserType>("homeowner");
  const [businessName, setBusinessName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleContinue = () => {
    if (!name || !email) {
      setError("Please enter your name and email");
      return;
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError("");
    setStep(2);
  };

  const handleSignup = async () => {
    // Validate business info if pro account
    if (accountType !== "homeowner" && !businessName.trim()) {
      setError("Please enter your business name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signup(email, password, name);

      // Update user with account type and business info
      updateUser({
        userType: accountType,
        businessName: businessName.trim() || undefined,
        businessType: accountType !== "homeowner" ? ACCOUNT_TYPES.find(t => t.type === accountType)?.title : undefined,
        adCredits: accountType !== "homeowner" ? 50 : 0, // Give pros 50 free ad credits
      });

      // Navigate to main app after successful signup
      navigation.replace("MainTabs");
    } catch (err) {
      setError("Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
          <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 60 }}>
            <View style={{ marginBottom: 40 }}>
              <Text style={{ fontSize: 36, fontWeight: '700', color: colors.primary[600], letterSpacing: -1, marginBottom: 4 }}>
                REMODELY.AI
              </Text>
              <Text style={{ fontSize: 16, color: colors.text.tertiary }}>
                Create your account
              </Text>
            </View>

            {error ? (
              <View style={{ borderRadius: 12, padding: 16, marginBottom: 24, backgroundColor: colors.error.light, borderWidth: 1, borderColor: '#fecaca' }}>
                <Text style={{ fontSize: 14, color: colors.error.dark }}>{error}</Text>
              </View>
            ) : null}

            {step === 1 ? (
              <>
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 14, marginBottom: 8, color: colors.text.tertiary, fontWeight: '500' }}>
                    Full Name
                  </Text>
                  <TextInput
                    style={{
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      fontSize: 16,
                      backgroundColor: colors.background.tertiary,
                      borderWidth: 1,
                      borderColor: colors.border.main,
                      color: colors.text.primary
                    }}
                    placeholder="John Doe"
                    placeholderTextColor={colors.neutral[400]}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>

                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 14, marginBottom: 8, color: colors.text.tertiary, fontWeight: '500' }}>
                    Email
                  </Text>
                  <TextInput
                    style={{
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      fontSize: 16,
                      backgroundColor: colors.background.tertiary,
                      borderWidth: 1,
                      borderColor: colors.border.main,
                      color: colors.text.primary
                    }}
                    placeholder="your@email.com"
                    placeholderTextColor={colors.neutral[400]}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                  />
                </View>

                <View style={{ marginBottom: 32 }}>
                  <Text style={{ fontSize: 14, marginBottom: 8, color: colors.text.tertiary, fontWeight: '500' }}>
                    Password
                  </Text>
                  <TextInput
                    style={{
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      fontSize: 16,
                      backgroundColor: colors.background.tertiary,
                      borderWidth: 1,
                      borderColor: colors.border.main,
                      color: colors.text.primary
                    }}
                    placeholder="••••••••"
                    placeholderTextColor={colors.neutral[400]}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>

                <Pressable
                  style={{
                    borderRadius: 12,
                    paddingVertical: 16,
                    alignItems: 'center',
                    marginBottom: 24,
                    backgroundColor: colors.primary[600]
                  }}
                  onPress={handleContinue}
                >
                  <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>
                    Continue
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable
                  style={{ marginBottom: 24, flexDirection: 'row', alignItems: 'center' }}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setStep(1);
                  }}
                >
                  <Ionicons name="arrow-back" size={20} color={colors.text.tertiary} />
                  <Text style={{ fontSize: 14, marginLeft: 8, color: colors.text.tertiary }}>Back</Text>
                </Pressable>

                <Text style={{ fontSize: 20, marginBottom: 8, fontWeight: '600', color: colors.text.primary }}>
                  Choose Account Type
                </Text>
                <Text style={{ fontSize: 14, marginBottom: 24, color: colors.text.tertiary }}>
                  Select the option that best describes you
                </Text>

                <View style={{ marginBottom: 24 }}>
                  {ACCOUNT_TYPES.map((type) => (
                    <Pressable
                      key={type.type}
                      style={{
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: accountType === type.type ? colors.primary[50] : colors.background.tertiary,
                        borderWidth: 2,
                        borderColor: accountType === type.type ? colors.primary[500] : colors.border.main,
                      }}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setAccountType(type.type);
                        setError("");
                      }}
                    >
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 16,
                          backgroundColor: accountType === type.type ? colors.primary[500] : colors.neutral[200],
                        }}
                      >
                        <Ionicons
                          name={type.icon as any}
                          size={24}
                          color={accountType === type.type ? 'white' : colors.text.tertiary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, marginBottom: 4, fontWeight: '500', color: colors.text.primary }}>
                          {type.title}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.text.tertiary }}>
                          {type.description}
                        </Text>
                      </View>
                      {accountType === type.type && (
                        <Ionicons name="checkmark-circle" size={24} color={colors.primary[500]} />
                      )}
                    </Pressable>
                  ))}
                </View>

                {accountType !== "homeowner" && (
                  <View style={{ marginBottom: 24 }}>
                    <Text style={{ fontSize: 14, marginBottom: 8, color: colors.text.tertiary, fontWeight: '500' }}>
                      Business Name
                    </Text>
                    <TextInput
                      style={{
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        fontSize: 16,
                        backgroundColor: colors.background.tertiary,
                        borderWidth: 1,
                        borderColor: colors.border.main,
                        color: colors.text.primary
                      }}
                      placeholder="Your Business Name"
                      placeholderTextColor={colors.neutral[400]}
                      value={businessName}
                      onChangeText={setBusinessName}
                      autoCapitalize="words"
                    />
                    <View style={{ marginTop: 12, borderRadius: 12, padding: 12, backgroundColor: colors.primary[50] }}>
                      <Text style={{ fontSize: 13, color: colors.primary[700] }}>
                        Welcome bonus: Get 50 free ad credits to promote your business!
                      </Text>
                    </View>
                  </View>
                )}

                <Pressable
                  style={{
                    borderRadius: 12,
                    paddingVertical: 16,
                    alignItems: 'center',
                    marginBottom: 24,
                    backgroundColor: colors.primary[600],
                    opacity: loading ? 0.7 : 1
                  }}
                  onPress={handleSignup}
                  disabled={loading}
                >
                  <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>
                    {loading ? "Creating Account..." : "Create Account"}
                  </Text>
                </Pressable>
              </>
            )}

            <Pressable
              style={{ alignItems: 'center', paddingBottom: 40 }}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={{ fontSize: 15, color: colors.text.tertiary }}>
                {"Already have an account? "}
                <Text style={{ color: colors.primary[600], fontWeight: '500' }}>Sign In</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
