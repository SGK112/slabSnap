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
import { colors } from "../utils/colors";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Login">;

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await login(email, password);
      // Navigate to main app after successful login
      navigation.replace("MainTabs");
    } catch (err) {
      setError("Login failed. Please try again.");
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
              <Text className="text-4xl mb-2" style={{ fontWeight: '300', color: colors.primary[700], letterSpacing: -1 }}>
                cutStone
              </Text>
              <Text className="text-base" style={{ color: colors.text.tertiary }}>
                Sign in to continue
              </Text>
            </View>

            {error ? (
              <View className="rounded-lg p-4 mb-6" style={{ backgroundColor: colors.error.light, borderWidth: 1, borderColor: '#fecaca' }}>
                <Text className="text-sm" style={{ color: colors.error.dark }}>{error}</Text>
              </View>
            ) : null}

            <View className="mb-5">
              <Text className="text-sm mb-2" style={{ color: colors.text.tertiary, fontWeight: '500' }}>
                Email
              </Text>
              <TextInput
                className="rounded-xl px-5 py-4 text-base"
                style={{ backgroundColor: colors.background.tertiary, borderWidth: 1, borderColor: colors.border.main, color: colors.text.primary }}
                placeholder="your@email.com"
                placeholderTextColor={colors.neutral[300]}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>

            <View className="mb-8">
              <Text className="text-sm mb-2" style={{ color: colors.text.tertiary, fontWeight: '500' }}>
                Password
              </Text>
              <TextInput
                className="rounded-xl px-5 py-4 text-base"
                style={{ backgroundColor: colors.background.tertiary, borderWidth: 1, borderColor: colors.border.main, color: colors.text.primary }}
                placeholder="••••••••"
                placeholderTextColor={colors.neutral[300]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <Pressable
              className="rounded-xl py-4 items-center mb-6"
              style={{ backgroundColor: colors.primary[600] }}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text className="text-base" style={{ fontWeight: '500', color: 'white' }}>
                {loading ? "Signing in..." : "Sign In"}
              </Text>
            </Pressable>

            <Pressable
              className="items-center"
              onPress={() => navigation.navigate("Signup")}
            >
              <Text className="text-base" style={{ color: colors.text.tertiary }}>
                {"Don't have an account? "}
                <Text style={{ color: colors.primary[600], fontWeight: '400' }}>Sign Up</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
