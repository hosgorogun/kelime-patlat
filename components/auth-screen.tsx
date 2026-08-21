import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiBaseUrl, SESSION_TOKEN_KEY, startOAuthLogin } from "@/constants/oauth";
import { ScreenContainer } from "./screen-container";
import { haptics } from "@/lib/haptics";

type AuthScreenProps = {
  onSuccess: (token: string, username: string, cloudProgress: any, openId: string) => void;
};

export function AuthScreen({ onSuccess }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Kullanıcı adı ve şifre gereklidir.");
      return;
    }
    if (isSignUp && (!email.trim() || !fullName.trim())) {
      setError("Ad soyad ve e-posta alanları kayıt için zorunludur.");
      return;
    }
    setError("");
    setLoading(true);
    haptics.light();

    try {
      const endpoint = isSignUp ? "/api/auth/signup" : "/api/auth/login";
      const bodyPayload = isSignUp 
        ? { username: username.trim(), password: password.trim(), email: email.trim(), fullName: fullName.trim() }
        : { username: username.trim(), password: password.trim() };

      const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "İşlem başarısız.");
      }

      await AsyncStorage.setItem(SESSION_TOKEN_KEY, data.token);
      haptics.success();
      onSuccess(data.token, data.username, data.progress, `usr_${username.trim().toLowerCase()}`);
    } catch (err: any) {
      setError(err.message || "Bağlantı hatası oluştu.");
      haptics.error();
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (platform: "Google" | "Apple") => {
    haptics.light();
    // In production, we trigger the OAuth server. Since local configs require redirects,
    // we alert the user or start startOAuthLogin() linking flow!
    Alert.alert(
      `${platform} ile Giriş`,
      `${platform} oturum açma akışı başlatılıyor...`,
      [
        {
          text: "Tamam",
          onPress: async () => {
            try {
              // Trigger oauth linking flow helper from SDK
              await startOAuthLogin();
            } catch (e) {
              console.warn(e);
            }
          }
        }
      ]
    );
  };

  return (
    <ScreenContainer style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.glowTitle}>KELİME PATLAT</Text>
          <Text style={styles.subtitle}>BULUT BAĞLANTISI</Text>

          {isSignUp ? (
            <>
              <Text style={styles.label}>AD SOYAD</Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoCorrect={false}
                style={styles.input}
                placeholder="Adınızı ve soyadınızı girin"
                placeholderTextColor="#6F879A"
              />

              <Text style={styles.label}>E-POSTA ADRESİ</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                style={styles.input}
                placeholder="E-posta adresinizi girin"
                placeholderTextColor="#6F879A"
              />
            </>
          ) : null}

          <Text style={styles.label}>KULLANICI ADI</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            placeholder="Kullanıcı adınızı seçin"
            placeholderTextColor="#6F879A"
          />

          <Text style={styles.label}>ŞİFRE</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            placeholder="Şifrenizi belirleyin"
            placeholderTextColor="#6F879A"
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            disabled={loading}
            onPress={handleSubmit}
            style={({ pressed }) => [styles.submitButton, pressed && styles.pressed, loading && styles.disabled]}
          >
            {loading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text style={styles.submitText}>{isSignUp ? "KAYIT OL VE BAŞLA" : "GİRİŞ YAP VE BAŞLA"}</Text>
            )}
          </Pressable>

          <Pressable onPress={() => { haptics.light(); setIsSignUp(!isSignUp); setError(""); }} style={styles.switchButton}>
            <Text style={styles.switchText}>
              {isSignUp ? "Zaten bir hesabın var mı? Giriş Yap" : "Yeni misin? Hesap Oluştur"}
            </Text>
          </Pressable>

          {/* Social Logins Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>VEYA</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login Buttons */}
          <View style={styles.socialContainer}>
            <Pressable
              onPress={() => handleSocialLogin("Google")}
              style={({ pressed }) => [styles.socialButton, styles.googleButton, pressed && styles.pressed]}
            >
              <Text style={styles.socialIcon}>G</Text>
              <Text style={styles.socialText}>Google ile Giriş</Text>
            </Pressable>

            <Pressable
              onPress={() => handleSocialLogin("Apple")}
              style={({ pressed }) => [styles.socialButton, styles.appleButton, pressed && styles.pressed]}
            >
              <Text style={[styles.socialIcon, { color: "#FFFFFF" }]}></Text>
              <Text style={[styles.socialText, { color: "#FFFFFF" }]}>Apple ile Giriş</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121025",
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "rgba(33, 26, 61, 0.55)",
    borderWidth: 1.5,
    borderColor: "#9A76ED",
    borderRadius: 28,
    padding: 24,
    shadowColor: "#9A76ED",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  glowTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    textShadowColor: "rgba(0, 245, 212, 0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FF007F",
    textAlign: "center",
    letterSpacing: 3,
    marginTop: 6,
    marginBottom: 20,
  },
  label: {
    color: "#B5A9CD",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#1A1535",
    borderWidth: 1,
    borderColor: "rgba(122, 98, 195, 0.4)",
    color: "#FFFFFF",
    paddingHorizontal: 16,
    fontSize: 13,
    fontWeight: "700",
  },
  submitButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#00F5D4",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    shadowColor: "#00F5D4",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  submitText: {
    color: "#0B0A16",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  switchButton: {
    marginTop: 18,
    alignItems: "center",
  },
  switchText: {
    color: "#9A76ED",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  errorText: {
    color: "#FF5E7E",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 12,
    textAlign: "center",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(181, 169, 205, 0.2)",
  },
  dividerText: {
    color: "#B5A9CD",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },
  socialContainer: {
    gap: 10,
  },
  socialButton: {
    height: 46,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
  },
  googleButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
  },
  appleButton: {
    backgroundColor: "#000000",
    borderColor: "#1E1E1E",
  },
  socialIcon: {
    fontSize: 16,
    fontWeight: "900",
    color: "#000000",
  },
  socialText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1F2937",
    letterSpacing: 0.3,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.6,
  },
});
