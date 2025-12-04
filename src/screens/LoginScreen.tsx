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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
          <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 80 }}>
            <View style={{ marginBottom: 48 }}>
              <Text style={{ fontSize: 36, fontWeight: '700', color: colors.primary[600], letterSpacing: -1, marginBottom: 4 }}>
                REMODELY.AI
              </Text>
              <Text style={{ fontSize: 16, color: colors.text.tertiary }}>
                Sign in to continue
              </Text>
            </View>

            {error ? (
              <View style={{ borderRadius: 12, padding: 16, marginBottom: 24, backgroundColor: colors.error.light, borderWidth: 1, borderColor: '#fecaca' }}>
                <Text style={{ fontSize: 14, color: colors.error.dark }}>{error}</Text>
              </View>
            ) : null}

            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, marginBottom: 8, color: colors.text.tertiary, fontWeight: '500' }}>
                Email
              </Text>
              <TextInput
                style={{
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 16,
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
                  paddingVertical: 16,
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
                backgroundColor: colors.primary[600],
                opacity: loading ? 0.7 : 1
              }}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>
                {loading ? "Signing in..." : "Sign In"}
              </Text>
            </Pressable>

            <Pressable
              style={{ alignItems: 'center' }}
              onPress={() => navigation.navigate("Signup")}
            >
              <Text style={{ fontSize: 15, color: colors.text.tertiary }}>
                {"Don't have an account? "}
                <Text style={{ color: colors.primary[600], fontWeight: '500' }}>Sign Up</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
