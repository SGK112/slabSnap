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

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Signup">;

const ACCOUNT_TYPES: Array<{ type: UserType; title: string; description: string; icon: string }> = [
  {
    type: "homeowner",
    title: "Homeowner",
    description: "I'm looking for stone for my home project",
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
    description: "I supply stone materials",
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
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          <View className="flex-1 px-6 pt-20">
            <View className="mb-12">
              <Text className="text-4xl mb-2" style={{ fontWeight: '300', color: '#0f172a', letterSpacing: -1 }}>
                cutStone
              </Text>
              <Text className="text-base" style={{ color: '#64748b' }}>
                Create an account
              </Text>
            </View>

            {error ? (
              <View className="rounded-lg p-4 mb-6" style={{ backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' }}>
                <Text className="text-sm" style={{ color: '#991b1b' }}>{error}</Text>
              </View>
            ) : null}

            {step === 1 ? (
              <>
                <View className="mb-5">
                  <Text className="text-xs mb-2" style={{ color: '#94a3b8' }}>
                    Full Name
                  </Text>
                  <TextInput
                    className="rounded-lg px-4 py-3 text-sm"
                    style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#f1f5f9', color: '#0f172a' }}
                    placeholder="John Doe"
                    placeholderTextColor="#cbd5e1"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>

                <View className="mb-5">
                  <Text className="text-xs mb-2" style={{ color: '#94a3b8' }}>
                    Email
                  </Text>
                  <TextInput
                    className="rounded-lg px-4 py-3 text-sm"
                    style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#f1f5f9', color: '#0f172a' }}
                    placeholder="your@email.com"
                    placeholderTextColor="#cbd5e1"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                  />
                </View>

                <View className="mb-8">
                  <Text className="text-xs mb-2" style={{ color: '#94a3b8' }}>
                    Password
                  </Text>
                  <TextInput
                    className="rounded-lg px-4 py-3 text-sm"
                    style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#f1f5f9', color: '#0f172a' }}
                    placeholder="••••••••"
                    placeholderTextColor="#cbd5e1"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>

                <Pressable
                  className="rounded-lg py-3 items-center mb-6"
                  style={{ backgroundColor: '#0f172a' }}
                  onPress={handleContinue}
                >
                  <Text className="text-sm" style={{ fontWeight: '400', color: 'white' }}>
                    Continue
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <Pressable
                  className="mb-6 flex-row items-center"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setStep(1);
                  }}
                >
                  <Ionicons name="arrow-back" size={20} color="#64748b" />
                  <Text className="text-sm ml-2" style={{ color: '#64748b' }}>Back</Text>
                </Pressable>

                <Text className="text-xl mb-2" style={{ fontWeight: '500', color: '#0f172a' }}>
                  Choose Account Type
                </Text>
                <Text className="text-sm mb-6" style={{ color: '#64748b' }}>
                  Select the option that best describes you
                </Text>

                <View className="mb-6">
                  {ACCOUNT_TYPES.map((type) => (
                    <Pressable
                      key={type.type}
                      className="rounded-xl p-4 mb-3 flex-row items-center"
                      style={{
                        backgroundColor: accountType === type.type ? '#f0f9ff' : '#f8fafc',
                        borderWidth: 1.5,
                        borderColor: accountType === type.type ? '#0ea5e9' : '#f1f5f9',
                      }}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setAccountType(type.type);
                        setError("");
                      }}
                    >
                      <View
                        className="rounded-full items-center justify-center mr-4"
                        style={{
                          width: 48,
                          height: 48,
                          backgroundColor: accountType === type.type ? '#0ea5e9' : '#e2e8f0',
                        }}
                      >
                        <Ionicons
                          name={type.icon as any}
                          size={24}
                          color={accountType === type.type ? 'white' : '#64748b'}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base mb-1" style={{ fontWeight: '500', color: '#0f172a' }}>
                          {type.title}
                        </Text>
                        <Text className="text-xs" style={{ color: '#64748b' }}>
                          {type.description}
                        </Text>
                      </View>
                      {accountType === type.type && (
                        <Ionicons name="checkmark-circle" size={24} color="#0ea5e9" />
                      )}
                    </Pressable>
                  ))}
                </View>

                {accountType !== "homeowner" && (
                  <View className="mb-6">
                    <Text className="text-xs mb-2" style={{ color: '#94a3b8' }}>
                      Business Name
                    </Text>
                    <TextInput
                      className="rounded-lg px-4 py-3 text-sm"
                      style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#f1f5f9', color: '#0f172a' }}
                      placeholder="Your Business Name"
                      placeholderTextColor="#cbd5e1"
                      value={businessName}
                      onChangeText={setBusinessName}
                      autoCapitalize="words"
                    />
                    <View className="mt-3 rounded-lg p-3" style={{ backgroundColor: '#f0f9ff' }}>
                      <Text className="text-xs" style={{ color: '#0369a1' }}>
                        🎁 Welcome bonus: Get 50 free ad credits to promote your business!
                      </Text>
                    </View>
                  </View>
                )}

                <Pressable
                  className="rounded-lg py-3 items-center mb-6"
                  style={{ backgroundColor: '#0f172a' }}
                  onPress={handleSignup}
                  disabled={loading}
                >
                  <Text className="text-sm" style={{ fontWeight: '400', color: 'white' }}>
                    {loading ? "Creating Account..." : "Create Account"}
                  </Text>
                </Pressable>
              </>
            )}

            <Pressable
              className="items-center"
              onPress={() => navigation.navigate("Login")}
            >
              <Text className="text-sm" style={{ color: '#64748b' }}>
                {"Already have an account? "}
                <Text style={{ color: '#0f172a', fontWeight: '400' }}>Sign In</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
