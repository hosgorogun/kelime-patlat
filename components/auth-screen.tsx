import React, { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiBaseUrl, SESSION_TOKEN_KEY, startOAuthLogin } from "@/constants/oauth";
import { ScreenContainer } from "./screen-container";
import { haptics } from "@/lib/haptics";
import { type GenderType } from "@/shared/progression";
import { GoogleLogo, AppleLogo } from "./brand-logos";

type AuthScreenProps = {
  onSuccess: (token: string, username: string, cloudProgress: any, openId: string) => void;
  onCancel?: () => void | Promise<void>;
};

export function AuthScreen({ onSuccess, onCancel }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState<GenderType>("unspecified");
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
    if (isSignUp && gender === "unspecified") {
      setError("Lütfen cinsiyet seçimini yapınız.");
      return;
    }
    setError("");
    setLoading(true);
    haptics.light();

    try {
      const endpoint = isSignUp ? "/api/auth/signup" : "/api/auth/login";
      const bodyPayload = isSignUp
        ? { username: username.trim(), password: password.trim(), email: email.trim(), fullName: fullName.trim(), gender }
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
      await AsyncStorage.setItem("kelime-patlat:player-id", data.user.openId);
      await AsyncStorage.setItem("kelime-patlat:player-name", data.user.name || data.user.username);
      haptics.success();
      onSuccess(data.token, data.user.name || data.user.username, data.user.progress, data.user.openId);
    } catch (err: any) {
      haptics.error();
      setError(err.message || "Giriş yapılırken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleThirdPartyPress = (provider: string) => {
    haptics.light();
    Alert.alert(
      `🌐 ${provider} Bağlantısı`,
      `${provider} ile hızlı giriş altyapısı aktiftir. Oturum açmak istiyor musunuz?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Tamam",
          onPress: async () => {
            try {
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
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {isSignUp && (
          <Pressable
            onPress={() => { haptics.light(); setIsSignUp(false); setError(""); }}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </Pressable>
        )}
        <View style={styles.card}>
          <Text style={styles.glowTitle}>KELİME PATLAT</Text>
          <Text style={styles.subtitle}>{isSignUp ? "YENİ HESAP" : "BULUT BAĞLANTISI"}</Text>

          {isSignUp ? (
            <>
              {/* Ad Soyad + E-posta yan yana değil, compact */}
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

              <Text style={styles.label}>E-POSTA</Text>
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

              <Text style={styles.label}>CİNSİYET</Text>
              <View style={styles.genderRow}>
                <Pressable
                  onPress={() => { haptics.light(); setGender("male"); }}
                  style={[styles.genderBtn, gender === "male" && styles.genderBtnActiveMale]}
                >
                  <Text style={styles.genderBtnIcon}>👨</Text>
                  <Text style={[styles.genderBtnLabel, gender === "male" && { color: "#38BDF8", fontWeight: "900" }]}>ERKEK</Text>
                  {gender === "male" && <View style={[styles.genderDot, { backgroundColor: "#38BDF8" }]}><Text style={styles.genderDotText}>✓</Text></View>}
                </Pressable>
                <Pressable
                  onPress={() => { haptics.light(); setGender("female"); }}
                  style={[styles.genderBtn, gender === "female" && styles.genderBtnActiveFemale]}
                >
                  <Text style={styles.genderBtnIcon}>👩</Text>
                  <Text style={[styles.genderBtnLabel, gender === "female" && { color: "#F472B6", fontWeight: "900" }]}>KADIN</Text>
                  {gender === "female" && <View style={[styles.genderDot, { backgroundColor: "#F472B6" }]}><Text style={styles.genderDotText}>✓</Text></View>}
                </Pressable>
              </View>
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

          {/* Social login sadece giriş ekranında göster */}
          {!isSignUp && (
            <>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>VEYA</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialContainer}>
                {/* Google */}
                <Pressable
                  onPress={() => handleThirdPartyPress("Google")}
                  style={({ pressed }) => [styles.socialIconButton, styles.googleButton, pressed && styles.pressed]}
                >
                  <GoogleLogo size={24} />
                </Pressable>

                {/* Apple */}
                <Pressable
                  onPress={() => handleThirdPartyPress("Apple")}
                  style={({ pressed }) => [styles.socialIconButton, styles.appleButton, pressed && styles.pressed]}
                >
                  <AppleLogo size={24} />
                </Pressable>
              </View>
            </>
          )}

          {onCancel && (
            <Pressable onPress={() => { haptics.light(); onCancel(); }} style={styles.guestButton}>
              <Text style={styles.guestText}>GİRİŞ YAPMADAN DEVAM ET →</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0C091C",
  },
  topHeader: {
    width: "100%",
    maxWidth: 360,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#1E1838",
    borderWidth: 1.5,
    borderColor: "rgba(154, 118, 237, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  backButtonText: {
    color: "#9A76ED",
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "300",
    marginTop: -2,
  },
  guestButton: {
    marginTop: 18,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0, 245, 212, 0.3)",
    backgroundColor: "rgba(0, 245, 212, 0.05)",
  },
  guestText: {
    color: "#00F5D4",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#161132",
    borderWidth: 1.5,
    borderColor: "rgba(154, 118, 237, 0.4)",
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 20,
    shadowColor: "#9A76ED",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
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
    marginTop: 4,
    marginBottom: 12,
  },
  label: {
    color: "#B5A9CD",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    height: 44,
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
    height: 46,
    borderRadius: 12,
    backgroundColor: "#00F5D4",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
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
    marginTop: 12,
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
    marginVertical: 12,
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
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  socialIconButton: {
    width: 54,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
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
  googleIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#4285F4",
    alignItems: "center",
    justifyContent: "center",
  },
  googleIconText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 16,
  },
  googleText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F2937",
    letterSpacing: 0.2,
  },
  appleIconText: {
    fontSize: 18,
    color: "#FFFFFF",
    lineHeight: 22,
    fontWeight: "400",
  },
  appleText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.6,
  },

  /* Gender selection */
  genderRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },
  genderBtn: {
    flex: 1,
    backgroundColor: "#1A1535",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(122, 98, 195, 0.4)",
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  genderBtnActiveMale: {
    borderColor: "#38BDF8",
    backgroundColor: "rgba(56, 189, 248, 0.12)",
  },
  genderBtnActiveFemale: {
    borderColor: "#F472B6",
    backgroundColor: "rgba(244, 114, 182, 0.12)",
  },
  genderBtnIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  genderBtnLabel: {
    color: "#8E82A8",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  genderDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  genderDotText: {
    color: "#0F0B1E",
    fontSize: 10,
    fontWeight: "900",
  },
});
