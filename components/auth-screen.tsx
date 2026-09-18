import React, { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiBaseUrl, SESSION_TOKEN_KEY, startOAuthLogin, isOAuthConfigured } from "@/constants/oauth";
import { ScreenContainer } from "./screen-container";
import { GameButton, JewelTitle, OrnatePanel } from "./game-ui";
import { haptics } from "@/lib/haptics";
import { type GenderType } from "@/shared/progression";
import { GoogleLogo, AppleLogo } from "./brand-logos";

type AuthScreenProps = {
  onSuccess: (token: string, username: string, cloudProgress: any, openId: string, previousGuestToken?: string | null) => void;
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

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setError("Kullanıcı adı ve şifre gereklidir.");
      return;
    }
    if (isSignUp && (!email.trim() || !fullName.trim())) {
      setError("Ad soyad ve e-posta alanları kayıt için zorunludur.");
      return;
    }
    if (isSignUp) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setError("Lütfen geçerli bir e-posta adresi giriniz.");
        return;
      }
      if (cleanUsername.length < 3) {
        setError("Kullanıcı adı en az 3 karakter olmalıdır.");
        return;
      }
      if (/\s/.test(cleanUsername)) {
        setError("Kullanıcı adı boşluk içeremez.");
        return;
      }
      if (cleanPassword.length < 4) {
        setError("Şifre en az 4 karakter olmalıdır.");
        return;
      }
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
        ? { username: cleanUsername, password: cleanPassword, email: email.trim(), fullName: fullName.trim(), gender }
        : { username: cleanUsername, password: cleanPassword };

      const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "İşlem başarısız.");
      }

      const previousGuestToken = await AsyncStorage.getItem(SESSION_TOKEN_KEY);
      await AsyncStorage.setItem(SESSION_TOKEN_KEY, data.token);
      await AsyncStorage.setItem("kelime-patlat:player-id", data.user.openId);
      await AsyncStorage.setItem("kelime-patlat:player-name", data.user.name || data.user.username);
      haptics.success();
      onSuccess(data.token, data.user.name || data.user.username, data.user.progress, data.user.openId, previousGuestToken);
    } catch (err: any) {
      haptics.error();
      const rawMsg = err.message || "";
      if (rawMsg.includes("Network request failed") || rawMsg.includes("Failed to fetch")) {
        setError("Sunucuya bağlanılamadı. Lütfen sunucunun açık olduğundan ve internet bağlantınızdan emin olun.");
      } else {
        setError(rawMsg || "Giriş yapılırken bir hata oluştu.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleThirdPartyPress = (provider: string) => {
    haptics.light();
    if (!isOAuthConfigured()) {
      Alert.alert(
        `🌐 ${provider} ile Hızlı Giriş`,
        `${provider} ile doğrudan oturum açma seçeneği mağaza sürümünde (App Store / Play Store) entegre kimlik sağlayıcısı ile sunulmaktadır.\n\nŞu anda kullanıcı adı veya e-posta ile saniyeler içinde ücretsiz hesabınızı açabilir veya "Giriş Yapmadan Devam Et" seçeneğiyle hemen oynamaya başlayabilirsiniz!`,
        [{ text: "Anladım", style: "default" }]
      );
      return;
    }

    Alert.alert(
      `🌐 ${provider} Bağlantısı`,
      `${provider} ile hızlı oturum açma penceresi açılacaktır. Devam etmek istiyor musunuz?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Devam Et",
          onPress: async () => {
            try {
              const res = await startOAuthLogin(provider);
              if (res && !res.success && res.message) {
                Alert.alert("Giriş Bildirimi", res.message);
              }
            } catch (e: any) {
              console.warn(e);
              Alert.alert("Hata", "Oturum açma bağlantısı başlatılamadı.");
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
        <OrnatePanel style={{ width: "100%", maxWidth: 360 }} contentStyle={{ paddingVertical: 22, paddingHorizontal: 18 }}>
          <JewelTitle style={{ textAlign: "center", fontSize: 26, lineHeight: 30 }}>KELİME PATLAT</JewelTitle>
          <Text style={styles.subtitle}>{isSignUp ? "YENİ HESAP" : "MACERAYA KATIL"}</Text>

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

          <Text style={styles.label}>{isSignUp ? "KULLANICI ADI" : "KULLANICI ADI VEYA E-POSTA"}</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            placeholder={isSignUp ? "Kullanıcı adınızı seçin (min 3 harf)" : "Kullanıcı adı veya e-posta girin"}
            placeholderTextColor="#6F879A"
          />

          <Text style={styles.label}>ŞİFRE</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, styles.passwordInput]}
              placeholder={isSignUp ? "Şifrenizi belirleyin" : "Şifrenizi girin"}
              placeholderTextColor="#6F879A"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
            <Pressable
              onPress={() => {
                haptics.light();
                setShowPassword(!showPassword);
              }}
              style={styles.eyeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.eyeIcon}>{showPassword ? "👁️" : "🙈"}</Text>
            </Pressable>
          </View>

          {!isSignUp && (
            <Pressable
              onPress={() => {
                haptics.light();
                setUsername("siber_oyuncu");
                setPassword("siber123");
                setError("");
              }}
              style={styles.demoFillBtn}
            >
              <Text style={styles.demoFillText}>⚡ Demo Bilgileriyle Doldur</Text>
            </Pressable>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <GameButton
            label={loading ? "BAĞLANILIYOR..." : isSignUp ? "KAYIT OL VE BAŞLA" : "GİRİŞ YAP VE BAŞLA"}
            onPress={handleSubmit}
            disabled={loading}
            style={{ marginTop: 14 }}
          />

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
        </OrnatePanel>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    backgroundColor: "#164036",
    borderWidth: 1.5,
    borderColor: "rgba(212, 180, 90, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  backButtonText: {
    color: "#D4B45A",
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
    borderColor: "rgba(62, 232, 181, 0.3)",
    backgroundColor: "rgba(62, 232, 181, 0.05)",
  },
  guestText: {
    color: "#3EE8B5",
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
    backgroundColor: "#0E2C22",
    borderWidth: 1.5,
    borderColor: "rgba(212, 180, 90, 0.4)",
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 20,
    shadowColor: "#D4B45A",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  glowTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    textShadowColor: "rgba(62, 232, 181, 0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 9,
    fontWeight: "900",
    color: "#F4D06F",
    textAlign: "center",
    letterSpacing: 3,
    marginTop: 4,
    marginBottom: 12,
  },
  label: {
    color: "#8FBAAB",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    height: 44,
    borderRadius: 12,
    backgroundColor: "#14352B",
    borderWidth: 1,
    borderColor: "rgba(184, 134, 58, 0.4)",
    color: "#FFFFFF",
    paddingHorizontal: 16,
    fontSize: 13,
    fontWeight: "700",
  },
  passwordWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  passwordInput: {
    paddingRight: 44,
  },
  eyeBtn: {
    position: "absolute",
    right: 12,
    top: 10,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  eyeIcon: {
    fontSize: 15,
  },
  demoFillBtn: {
    alignSelf: "center",
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "rgba(62, 232, 181, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(62, 232, 181, 0.25)",
  },
  demoFillText: {
    color: "#3EE8B5",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  submitButton: {
    height: 46,
    borderRadius: 12,
    backgroundColor: "#3EE8B5",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    shadowColor: "#3EE8B5",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  submitText: {
    color: "#04110C",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  switchButton: {
    marginTop: 12,
    alignItems: "center",
  },
  switchText: {
    color: "#D4B45A",
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
    color: "#8FBAAB",
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
    backgroundColor: "#14352B",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(184, 134, 58, 0.4)",
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
    color: "#8FBAAB",
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
    color: "#04110C",
    fontSize: 10,
    fontWeight: "900",
  },
});
