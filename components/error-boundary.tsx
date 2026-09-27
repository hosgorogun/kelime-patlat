import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[Siber Koruma] Beklenmeyen arayüz hatası yakalandı:", error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.location.reload();
    }
  };

  private handleClearCacheAndRestart = async () => {
    try {
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.localStorage.removeItem("kelime-patlat:offline-state");
      }
      await AsyncStorage.removeItem("@kelime_patlat:active_session").catch(() => undefined);
    } catch {
      // Ignore cleanup error
    }
    this.setState({ hasError: false, error: null });
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.icon}>⚡</Text>
            <Text style={styles.badge}>SİBER SİSTEM KORUMASI</Text>
            <Text style={styles.title}>BİR AKSAMA OLUŞTU</Text>
            <Text style={styles.subtitle}>
              Uygulama beklenmeyen bir durumla karşılaştı ve beyaz ekran çökmesi engellendi. Verileriniz güvende!
            </Text>

            {__DEV__ && this.state.error && (
              <View style={styles.devErrorBox}>
                <Text style={styles.devErrorText} numberOfLines={3}>
                  {this.state.error.toString()}
                </Text>
              </View>
            )}

            <View style={styles.buttonGroup}>
              <Pressable
                onPress={this.handleReload}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              >
                <Text style={styles.primaryButtonText}>🔄 SİSTEMİ YENİLE VE DEVAM ET</Text>
              </Pressable>

              <Pressable
                onPress={this.handleClearCacheAndRestart}
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
              >
                <Text style={styles.secondaryButtonText}>🧹 ÖNBELLEĞİ SIFIRLA & YENİDEN BAŞLAT</Text>
              </Pressable>
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F5ED",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
    padding: 24,
    alignItems: "center",
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: {
    fontSize: 42,
    marginBottom: 8,
  },
  badge: {
    color: "#2a9c7a",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
    backgroundColor: "rgba(62, 232, 181, 0.12)",
    borderWidth: 1,
    borderColor: "#DCE1D7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  title: {
    color: "#293541",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0.5,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    color: "#293541",
    fontSize: 14,
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 18,
    fontWeight: "500",
  },
  devErrorBox: {
    width: "100%",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "#DCE1D7",
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  devErrorText: {
    color: "#ed4343",
    fontSize: 10,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  buttonGroup: {
    width: "100%",
    gap: 10,
  },
  primaryButton: {
    width: "100%",
    height: 46,
    backgroundColor: "#aef5e0",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButtonText: {
    color: "#293541",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  secondaryButton: {
    width: "100%",
    height: 42,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "#DCE1D7",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#293541",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
