import React, { useState } from "react";
import {
  Alert,
  Image,
  ImageBackground,
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
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameCheckLoading, setUsernameCheckLoading] = useState(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkUsernameAvailable = async (nameToCheck: string) => {
    const clean = nameToCheck.trim();
    if (!clean || clean.length < 4) {
      setUsernameAvailable(null);
      return;
    }
    setUsernameCheckLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/check-username?username=${encodeURIComponent(clean)}`);
      if (res.ok) {
        const data = await res.json();
        setUsernameAvailable(data.available);
        if (!data.available) {
          setError("Bu kullanıcı adı başka bir oyuncu tarafından kullanılıyor.");
        } else if (error === "Bu kullanıcı adı başka bir oyuncu tarafından kullanılıyor.") {
          setError("");
        }
      }
    } catch {
      // Çevrimdışı / yerel mod
      setUsernameAvailable(true);
    } finally {
      setUsernameCheckLoading(false);
    }
  };

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
      if (cleanUsername.length < 4) {
        setError("Kullanıcı adı en az 4 karakter olmalıdır.");
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
      if (usernameAvailable === false) {
        setError("Bu kullanıcı adı başka bir oyuncu tarafından kullanılıyor.");
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
      <ImageBackground
        source={require("../../assets/images/splash.png")}
        style={styles.bgImage}
        resizeMode="cover"
      >
        <View style={styles.backdropOverlay} />
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
              <View style={styles.brandLogoWrap}>
                <Image
                  source={require("../../assets/images/icon.png")}
                  style={styles.brandLogoImage}
                  resizeMode="contain"
                />
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
                        placeholderTextColor="#94A3B8"
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
                        placeholderTextColor="#94A3B8"
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
                <View style={[
                  styles.inputWrapper,
                  isSignUp && usernameAvailable === true && styles.inputWrapperSuccess,
                  isSignUp && usernameAvailable === false && styles.inputWrapperError
                ]}>
                  <Text style={styles.inputIcon}>👤</Text>
                  <TextInput
                    value={username}
                    onChangeText={(val) => {
                      setUsername(val);
                      if (isSignUp) {
                        if (debounceRef.current) clearTimeout(debounceRef.current);
                        if (val.trim().length >= 4) {
                          debounceRef.current = setTimeout(() => {
                            void checkUsernameAvailable(val);
                          }, 300);
                        } else {
                          setUsernameAvailable(null);
                        }
                      }
                    }}
                    onBlur={() => {
                      if (isSignUp && username.trim().length >= 4) {
                        void checkUsernameAvailable(username);
                      }
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.fieldInput}
                    placeholder={isSignUp ? "En az 4 karakter" : "Kullanıcı adı veya e-posta"}
                    placeholderTextColor="#94A3B8"
                  />
                  {isSignUp && username.trim().length >= 4 && (
                    <View style={styles.badgeContainer}>
                      {usernameCheckLoading ? (
                        <View style={styles.loadingBadge}>
                          <Text style={styles.loadingBadgeText}>Kontrol ediliyor...</Text>
                        </View>
                      ) : usernameAvailable === true ? (
                        <View style={styles.successBadge}>
                          <Text style={styles.successBadgeText}>✓ MÜSAİT</Text>
                        </View>
                      ) : usernameAvailable === false ? (
                        <View style={styles.errorBadge}>
                          <Text style={styles.errorBadgeText}>✕ ALINMIŞ</Text>
                        </View>
                      ) : null}
                    </View>
                  )}
                </View>
              </View>

              {/* Password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>ŞİFRE</Text>
                <View style={[
                  styles.inputWrapper,
                  isSignUp && password.length >= 6 && styles.inputWrapperSuccess,
                  isSignUp && password.length > 0 && password.length < 6 && styles.inputWrapperWarning
                ]}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.fieldInput}
                    placeholder={isSignUp ? "En az 6 karakter" : "Şifreniz"}
                    placeholderTextColor="#94A3B8"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />
                  {isSignUp && password.length > 0 && (
                    <View style={styles.badgeContainer}>
                      {password.length >= 6 ? (
                        <View style={styles.successBadge}>
                          <Text style={styles.successBadgeText}>✓ Güçlü</Text>
                        </View>
                      ) : (
                        <Text style={styles.warningHintText}>{password.length}/6</Text>
                      )}
                    </View>
                  )}
                  <Pressable
                    onPress={() => {
                      haptics.light();
                      setShowPassword(!showPassword);
                    }}
                    style={styles.eyeButton}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <View style={[styles.eyePill, showPassword && styles.eyePillActive]}>
                      <Text style={styles.eyePillIcon}>{showPassword ? "👁️" : "🔒"}</Text>
                      <Text style={[styles.eyePillText, showPassword && styles.eyePillTextActive]}>
                        {showPassword ? "GİZLE" : "GÖSTER"}
                      </Text>
                    </View>
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
                  <Text style={styles.demoPillIcon}>⚡</Text>
                  <Text style={styles.demoPillText}>Hızlı Test Hesabı ile Giriş Yap</Text>
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
                <Text style={styles.primaryButtonArrow}>➔</Text>
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
                    {Platform.OS === "ios" ? (
                      <Pressable
                        onPress={() => handleThirdPartyPress("Apple")}
                        style={({ pressed }) => [styles.socialCard, styles.socialCardApple, pressed && styles.pressedCardApple]}
                        accessibilityRole="button"
                        accessibilityLabel="Apple ile Giriş Yap"
                      >
                        <AppleLogo size={19} color="#FFFFFF" />
                        <Text style={styles.socialCardLabelApple}>Apple ile Giriş Yap</Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        onPress={() => handleThirdPartyPress("Google")}
                        style={({ pressed }) => [styles.socialCard, styles.socialCardGoogle, pressed && styles.pressedCardGoogle]}
                        accessibilityRole="button"
                        accessibilityLabel="Google ile Giriş Yap"
                      >
                        <GoogleLogo size={20} />
                        <Text style={styles.socialCardLabelGoogle}>Google ile Giriş Yap</Text>
                      </Pressable>
                    )}
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
                style={({ pressed }) => [styles.guestFooter, pressed && { opacity: 0.75 }]}
              >
                <Text style={styles.guestFooterText}>Misafir Olarak Oynamaya Devam Et ➔</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      </ImageBackground>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050B14",
  },
  bgImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5, 11, 20, 0.74)",
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingVertical: 24,
    paddingHorizontal: 22,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 8,
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  brandLogoWrap: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: "#0F172A",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 10,
    overflow: "hidden",
  },
  brandLogoImage: {
    width: "100%",
    height: "100%",
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.8,
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
    marginTop: 3,
    paddingHorizontal: 8,
    lineHeight: 16,
  },

  /* Segmented Tab Switcher */
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
  tabButtonTextActive: {
    color: "#0F172A",
    fontWeight: "900",
  },

  /* Form Fields */
  formContent: {
    width: "100%",
  },
  fieldGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
    letterSpacing: 0.6,
    marginBottom: 6,
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
  },
  inputWrapperSuccess: {
    borderColor: "#10B981",
    backgroundColor: "#F0FDF4",
  },
  inputWrapperError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  inputWrapperWarning: {
    borderColor: "#F59E0B",
    backgroundColor: "#FFFBEB",
  },
  badgeContainer: {
    marginLeft: 6,
    marginRight: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  loadingBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
  },
  successBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  successBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#15803D",
    letterSpacing: 0.2,
  },
  errorBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  errorBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#B91C1C",
    letterSpacing: 0.2,
  },
  hintText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
  },
  warningHintText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#D97706",
    marginRight: 4,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  fieldInput: {
    flex: 1,
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "600",
    paddingVertical: 0,
    height: "100%",
  },
  eyeButton: {
    paddingLeft: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  eyePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EDF2F7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  eyePillActive: {
    backgroundColor: "#E2E8F0",
  },
  eyePillIcon: {
    fontSize: 11,
  },
  eyePillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#475569",
    letterSpacing: 0.4,
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
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingVertical: 12,
    gap: 8,
  },
  genderCardActiveMale: {
    backgroundColor: "#EFF6FF",
    borderColor: "#3B82F6",
  },
  genderCardActiveFemale: {
    backgroundColor: "#FDF2F8",
    borderColor: "#EC4899",
  },
  genderIcon: {
    fontSize: 18,
  },
  genderText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
  genderTextActiveMale: {
    color: "#1D4ED8",
    fontWeight: "900",
  },
  genderTextActiveFemale: {
    color: "#BE185D",
    fontWeight: "900",
  },
  genderCheckBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#10B981",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 4,
    marginBottom: 8,
    gap: 6,
  },
  pressedPill: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  demoPillIcon: {
    fontSize: 12,
  },
  demoPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
    letterSpacing: 0.2,
  },

  /* Error Box */
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 8,
    gap: 8,
  },
  errorIcon: {
    fontSize: 15,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: "#DC2626",
    lineHeight: 16,
  },

  /* Primary Button */
  primaryButton: {
    flexDirection: "row",
    height: 50,
    borderRadius: 16,
    backgroundColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#D97706",
    marginTop: 8,
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
    paddingHorizontal: 16,
  },
  primaryButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.6,
  },
  primaryButtonArrow: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF",
    marginLeft: 8,
  },

  /* Divider */
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  dividerText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1.2,
  },

  /* Social Login Buttons */
  socialRow: {
    flexDirection: "row",
    width: "100%",
  },
  socialCard: {
    flex: 1,
    flexDirection: "row",
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
  },
  socialCardGoogle: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  pressedCardGoogle: {
    transform: [{ scale: 0.98 }],
    backgroundColor: "#F8FAFC",
    borderColor: "#CBD5C5",
  },
  socialCardLabelGoogle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1E293B",
    letterSpacing: 0.2,
  },
  socialCardApple: {
    backgroundColor: "#000000",
    borderWidth: 1.5,
    borderColor: "#1E293B",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  pressedCardApple: {
    transform: [{ scale: 0.98 }],
    backgroundColor: "#18181B",
  },
  socialCardLabelApple: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },

  /* Guest Footer */
  guestFooter: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  guestFooterText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#16A34A",
    letterSpacing: 0.3,
  },
});

