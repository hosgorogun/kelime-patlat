import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiBaseUrl, SESSION_TOKEN_KEY, startOAuthLogin, isOAuthConfigured } from "@/constants/oauth";
import { ScreenContainer } from "../common/screen-container";
import { haptics } from "@/lib/haptics";
import { type GenderType } from "@/shared/progression";
import { GoogleLogo, AppleLogo } from "../common/brand-logos";

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
      if (cleanPassword.length < 6) {
        setError("Şifre en az 6 karakter olmalıdır.");
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

  const handleDemoLogin = async () => {
    setUsername("oyuncu");
    setPassword("kelime123");
    setError("");
    setLoading(true);
    haptics.light();

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "oyuncu", password: "kelime123" }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Demo girişi başarısız.");
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
        setError(rawMsg || "Demo girişinde bir hata oluştu.");
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
        `${provider} ile doğrudan oturum açma seçeneği mağaza sürümünde (App Store / Play Store) entegre kimlik sağlayıcısı ile sunulmaktadır.\n\nŞu anda kullanıcı adı veya e-posta ile saniyeler içinde ücretsiz hesabınızı açabilir veya "Misafir Olarak Oyna" seçeneğiyle hemen oynamaya başlayabilirsiniz!`,
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
              console.warn("[OAuth] Start login failed:", e);
              Alert.alert("Hata", "Oturum açma bağlantısı başlatılamadı.");
            }
          }
        }
      ]
    );
  };

  return (
    <ScreenContainer style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, width: "100%" }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Main Card Container */}
          <View style={styles.card}>
            {/* Header / Brand */}
            <View style={styles.brandContainer}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoBadgeEmoji}>✨</Text>
              </View>
              <Text style={styles.brandTitle}>KELİME PATLAT</Text>
              <Text style={styles.brandSubtitle}>
                {isSignUp ? "Kelime dünyasına katıl, rekorları kır!" : "Akıl dolu kelime mücadelesine hazır mısın?"}
              </Text>
            </View>

            {/* Segmented Tab Switcher */}
            <View style={styles.tabContainer}>
              <Pressable
                onPress={() => {
                  haptics.light();
                  setIsSignUp(false);
                  setError("");
                }}
                style={[styles.tabButton, !isSignUp && styles.tabButtonActive]}
              >
                <Text style={[styles.tabButtonText, !isSignUp && styles.tabButtonTextActive]}>
                  Giriş Yap
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  haptics.light();
                  setIsSignUp(true);
                  setError("");
                }}
                style={[styles.tabButton, isSignUp && styles.tabButtonActive]}
              >
                <Text style={[styles.tabButtonText, isSignUp && styles.tabButtonTextActive]}>
                  Kayıt Ol
                </Text>
              </Pressable>
            </View>

            {/* Form Fields */}
            <View style={styles.formContent}>
              {isSignUp && (
                <>
                  {/* Full Name */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>AD SOYAD</Text>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputIcon}>👤</Text>
                      <TextInput
                        value={fullName}
                        onChangeText={setFullName}
                        autoCapitalize="words"
                        autoCorrect={false}
                        style={styles.fieldInput}
                        placeholder="Örn: Ahmet Yılmaz"
                        placeholderTextColor="#8F9CA3"
                      />
                    </View>
                  </View>

                  {/* Email */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>E-POSTA</Text>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputIcon}>✉️</Text>
                      <TextInput
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoCorrect={false}
                        style={styles.fieldInput}
                        placeholder="adiniz@ornek.com"
                        placeholderTextColor="#8F9CA3"
                      />
                    </View>
                  </View>

                  {/* Gender Selector */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>CİNSİYET</Text>
                    <View style={styles.genderRow}>
                      <Pressable
                        onPress={() => {
                          haptics.light();
                          setGender("male");
                        }}
                        style={[styles.genderCard, gender === "male" && styles.genderCardActiveMale]}
                      >
                        <Text style={styles.genderIcon}>👨</Text>
                        <Text style={[styles.genderText, gender === "male" && styles.genderTextActiveMale]}>
                          Erkek
                        </Text>
                        {gender === "male" && <View style={styles.genderCheckBadge}><Text style={styles.genderCheckMark}>✓</Text></View>}
                      </Pressable>

                      <Pressable
                        onPress={() => {
                          haptics.light();
                          setGender("female");
                        }}
                        style={[styles.genderCard, gender === "female" && styles.genderCardActiveFemale]}
                      >
                        <Text style={styles.genderIcon}>👩</Text>
                        <Text style={[styles.genderText, gender === "female" && styles.genderTextActiveFemale]}>
                          Kadın
                        </Text>
                        {gender === "female" && <View style={styles.genderCheckBadge}><Text style={styles.genderCheckMark}>✓</Text></View>}
                      </Pressable>
                    </View>
                  </View>
                </>
              )}

              {/* Username */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  {isSignUp ? "KULLANICI ADI" : "KULLANICI ADI VEYA E-POSTA"}
                </Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>🏷️</Text>
                  <TextInput
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.fieldInput}
                    placeholder={isSignUp ? "En az 3 karakter" : "Kullanıcı adı veya e-posta"}
                    placeholderTextColor="#8F9CA3"
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>ŞİFRE</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[styles.fieldInput, { paddingRight: 48 }]}
                    placeholder={isSignUp ? "En az 6 karakter" : "Şifreniz"}
                    placeholderTextColor="#8F9CA3"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />
                  <Pressable
                    onPress={() => {
                      haptics.light();
                      setShowPassword(!showPassword);
                    }}
                    style={styles.eyeButton}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Text style={styles.eyeIconText}>{showPassword ? "👁" : "🕶️"}</Text>
                  </Pressable>
                </View>
              </View>

              {/* Demo Login Quick Link for Login Mode */}
              {!isSignUp && (
                <Pressable
                  onPress={handleDemoLogin}
                  disabled={loading}
                  style={({ pressed }) => [styles.demoPill, pressed && styles.pressedPill]}
                >
                  <Text style={styles.demoPillText}>⚡ Hızlı Test Hesabı ile Giriş Yap</Text>
                </Pressable>
              )}

              {/* Error Alert */}
              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Action Button */}
              <Pressable
                onPress={handleSubmit}
                disabled={loading}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.primaryButtonPressed,
                  loading && styles.primaryButtonDisabled,
                ]}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? "BAĞLANILIYOR..." : isSignUp ? "KAYIT OL VE BAŞLA" : "GİRİŞ YAP"}
                </Text>
                <Text style={styles.primaryButtonArrow}>→</Text>
              </Pressable>

              {/* Social Login Section */}
              {!isSignUp && (
                <>
                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>VEYA</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <View style={styles.socialRow}>
                    <Pressable
                      onPress={() => handleThirdPartyPress("Google")}
                      style={({ pressed }) => [styles.socialCard, pressed && styles.pressedCard]}
                    >
                      <GoogleLogo size={20} />
                      <Text style={styles.socialCardLabel}>Google</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleThirdPartyPress("Apple")}
                      style={({ pressed }) => [styles.socialCard, pressed && styles.pressedCard]}
                    >
                      <AppleLogo size={20} />
                      <Text style={styles.socialCardLabel}>Apple</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>

            {/* Guest / Cancel Button Footer */}
            {onCancel && (
              <Pressable
                onPress={() => {
                  haptics.light();
                  onCancel();
                }}
                style={({ pressed }) => [styles.guestFooter, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.guestFooterText}>Misafir Olarak Oynamaya Devam Et ➔</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F5EE",
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
    maxWidth: 370,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: "#E5ECE0",
    shadowColor: "#1A2530",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF8E1",
    borderWidth: 1,
    borderColor: "#FFE082",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  logoBadgeEmoji: {
    fontSize: 22,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#202E38",
    letterSpacing: 0.8,
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7D89",
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 10,
    lineHeight: 17,
  },

  /* Segmented Tab Switcher */
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F0F4EC",
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E1E8DC",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6F808C",
  },
  tabButtonTextActive: {
    color: "#1B2A34",
    fontWeight: "900",
  },

  /* Form Fields */
  formContent: {
    width: "100%",
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#4A5A66",
    letterSpacing: 0.6,
    marginBottom: 6,
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7FAF5",
    borderWidth: 1.5,
    borderColor: "#DEE5D9",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  fieldInput: {
    flex: 1,
    color: "#1E2C36",
    fontSize: 14,
    fontWeight: "600",
    paddingVertical: 0,
    height: "100%",
  },
  eyeButton: {
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  eyeIconText: {
    fontSize: 16,
  },

  /* Gender Options */
  genderRow: {
    flexDirection: "row",
    gap: 10,
  },
  genderCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7FAF5",
    borderWidth: 1.5,
    borderColor: "#DEE5D9",
    borderRadius: 12,
    paddingVertical: 10,
    gap: 8,
  },
  genderCardActiveMale: {
    backgroundColor: "#E8F4FD",
    borderColor: "#38BDF8",
  },
  genderCardActiveFemale: {
    backgroundColor: "#FDF0F6",
    borderColor: "#F472B6",
  },
  genderIcon: {
    fontSize: 18,
  },
  genderText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#52636F",
  },
  genderTextActiveMale: {
    color: "#0284C7",
    fontWeight: "900",
  },
  genderTextActiveFemale: {
    color: "#DB2777",
    fontWeight: "900",
  },
  genderCheckBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#167653",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
  },
  genderCheckMark: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },

  /* Demo Pill */
  demoPill: {
    alignSelf: "center",
    backgroundColor: "#FFF9E6",
    borderWidth: 1,
    borderColor: "#FFE082",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 2,
    marginBottom: 6,
  },
  pressedPill: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  demoPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#A26E05",
  },

  /* Error Box */
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDF2F4",
    borderWidth: 1,
    borderColor: "#F9CBD3",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginVertical: 8,
    gap: 6,
  },
  errorIcon: {
    fontSize: 14,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: "#D83A56",
  },

  /* Primary Button */
  primaryButton: {
    flexDirection: "row",
    height: 50,
    borderRadius: 14,
    backgroundColor: "#FFCA38",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#E5A91E",
    marginTop: 10,
    shadowColor: "#D3960E",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
    paddingHorizontal: 16,
  },
  primaryButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#463000",
    letterSpacing: 0.5,
  },
  primaryButtonArrow: {
    fontSize: 16,
    fontWeight: "900",
    color: "#463000",
    marginLeft: 8,
  },

  /* Divider */
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5ECE0",
  },
  dividerText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#8FA0AC",
    letterSpacing: 1,
  },

  /* Social Login Buttons */
  socialRow: {
    flexDirection: "row",
    gap: 10,
  },
  socialCard: {
    flex: 1,
    flexDirection: "row",
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E0E7DC",
    backgroundColor: "#FAFBF8",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  socialCardLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2C3E4C",
  },
  pressedCard: {
    transform: [{ scale: 0.98 }],
    backgroundColor: "#EEF3E9",
  },

  /* Guest Footer */
  guestFooter: {
    marginTop: 18,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  guestFooterText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#167653",
    letterSpacing: 0.3,
  },
});

