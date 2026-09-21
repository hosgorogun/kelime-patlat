import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  ImageBackground,
  StyleSheet,
  Text,
  View,
  StatusBar,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { haptics } from "@/lib/haptics";
import { gameSfx } from "@/lib/game-sfx";

export type GameSplashScreenProps = {
  isReady: boolean;
  onFinish: () => void;
};

const LOADING_STEPS = [
  "Evrenin harfleri toplanıyor...",
  "Matris şifreleri çözümleniyor...",
  "Harf rotaları taranıyor...",
  "Oyuncu profili senkronize ediliyor...",
  "Kelime Patlat dünyası hazır!",
];

export function GameSplashScreen({ isReady, onFinish }: GameSplashScreenProps) {
  const { width, height } = Dimensions.get("window");
  const progressAnim = useRef(new Animated.Value(0.08)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  const [stepIndex, setStepIndex] = useState(0);
  const [displayPercent, setDisplayPercent] = useState(8);
  const finishedRef = useRef(false);

  // Status text cycle
  useEffect(() => {
    const textInterval = setInterval(() => {
      setStepIndex((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 450);
    return () => clearInterval(textInterval);
  }, []);

  // Pulsing text effect
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Track progress value for numerical percentage label
  useEffect(() => {
    const listenerId = progressAnim.addListener(({ value }) => {
      setDisplayPercent(Math.min(100, Math.round(value * 100)));
    });
    return () => progressAnim.removeListener(listenerId);
  }, [progressAnim]);

  // Initial progress animation up to 88%
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 0.88,
      duration: 1400,
      useNativeDriver: false,
    }).start();
  }, [progressAnim]);

  // Once parent reports ready, complete progress to 100% and fade out smoothly
  useEffect(() => {
    if (!isReady) return;

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (!finished || finishedRef.current) return;
      finishedRef.current = true;
      setStepIndex(LOADING_STEPS.length - 1);
      haptics.light();
      gameSfx.tap();

      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }).start(() => {
          onFinish();
        });
      }, 250);
    });
  }, [isReady, progressAnim, fadeAnim, onFinish]);

  // Safety fallback timeout: never block longer than 4.5 seconds
  useEffect(() => {
    const safety = setTimeout(() => {
      if (!finishedRef.current) {
        finishedRef.current = true;
        onFinish();
      }
    }, 4500);
    return () => clearTimeout(safety);
  }, [onFinish]);

  const barWidthInterpolated = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <Animated.View style={[styles.root, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ImageBackground
        source={require("@/assets/images/splash.png")}
        style={[styles.background, { width, height }]}
        resizeMode="cover"
      >
        {/* Top Vignette */}
        <LinearGradient
          colors={["rgba(5, 11, 20, 0.6)", "transparent"]}
          style={styles.topVignette}
          pointerEvents="none"
        />

        {/* Bottom Loading Dock & Interactive Progress HUD */}
        <View style={styles.bottomContainer}>
          <View style={styles.hudCard}>
            {/* Status Text with Animated Pulse */}
            <View style={styles.statusRow}>
              <Animated.Text
                style={[
                  styles.statusText,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                {LOADING_STEPS[stepIndex]}
              </Animated.Text>
              <Text style={styles.percentText}>%{displayPercent}</Text>
            </View>

            {/* Glowing Neon Progress Track */}
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  { width: barWidthInterpolated },
                ]}
              >
                <LinearGradient
                  colors={["#FF647C", "#FF9B62", "#FFC24A", "#3EE8B5"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                {/* Glow Head Dot */}
                <View style={styles.glowHeadDot} />
              </Animated.View>
            </View>

            {/* Subtitle / Version Info */}
            <View style={styles.metaRow}>
              <Text style={styles.metaBadge}>⚡ SİBER KELİME MATRİSİ</Text>
              <Text style={styles.metaVersion}>v1.0.0</Text>
            </View>
          </View>
        </View>
      </ImageBackground>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#050B14",
    zIndex: 9999,
  },
  background: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  topVignette: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  bottomContainer: {
    width: "100%",
    maxWidth: 420,
    paddingHorizontal: 22,
    paddingBottom: Platform.OS === "ios" ? 44 : 32,
    alignItems: "center",
  },
  hudCard: {
    width: "100%",
    backgroundColor: "rgba(6, 20, 15, 0.88)",
    borderWidth: 1.5,
    borderColor: "rgba(62, 232, 181, 0.4)",
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: "#3EE8B5",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statusText: {
    color: "#E2FDF2",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    textShadowColor: "rgba(62, 232, 181, 0.7)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  percentText: {
    color: "#3EE8B5",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  progressTrack: {
    width: "100%",
    height: 10,
    backgroundColor: "rgba(10, 32, 25, 0.9)",
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "rgba(62, 232, 181, 0.3)",
    overflow: "hidden",
    position: "relative",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 99,
    position: "relative",
  },
  glowHeadDot: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
    shadowColor: "#3EE8B5",
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  metaBadge: {
    color: "#FFC24A",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  metaVersion: {
    color: "#94A3B8",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
