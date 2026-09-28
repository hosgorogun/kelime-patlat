import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { gameSfx, triggerHapticSelection, triggerHapticSuccess } from "@/shared/audio-haptics";

export type GameCountdownOverlayProps = {
  countdown: number | null;
  title?: string;
  subtitle?: string;
  icon?: string;
};

const STAGE_CONFIGS: Record<number, {
  statusLabel: string;
  accentColor: string;
  gradient: readonly [string, string];
  glow: string;
}> = {
  3: {
    statusLabel: "HAZIRLAN...",
    accentColor: "#F59E0B",
    gradient: ["#FFD66E", "#D97706"],
    glow: "rgba(245, 158, 11, 0.45)",
  },
  2: {
    statusLabel: "DİKKATİNİ TOPLA...",
    accentColor: "#10B981",
    gradient: ["#3EE8B5", "#059669"],
    glow: "rgba(16, 185, 129, 0.45)",
  },
  1: {
    statusLabel: "SON SANİYE...",
    accentColor: "#38BDF8",
    gradient: ["#38BDF8", "#0284C7"],
    glow: "rgba(56, 189, 248, 0.45)",
  },
  0: {
    statusLabel: "ARENA AÇILDI!",
    accentColor: "#FF4D6D",
    gradient: ["#FF4D6D", "#FF9F1C"],
    glow: "rgba(255, 77, 109, 0.65)",
  },
};

export function GameCountdownOverlay({
  countdown,
  title = "DÜELLO BAŞLIYOR",
  subtitle = "Gizli kelimeleri ilk bulan kazanır!",
  icon = "⚔️",
}: GameCountdownOverlayProps) {
  const pulseScale = useRef(new Animated.Value(0.4)).current;
  const pulseOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.85)).current;
  const ringOpacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (countdown === null) return;

    // Trigger audio and haptics synchronously with countdown beat
    if (countdown === 0) {
      gameSfx.victory();
      triggerHapticSuccess();
    } else {
      gameSfx.tap();
      triggerHapticSelection();
    }

    // Reset animations
    pulseScale.setValue(0.4);
    pulseOpacity.setValue(0);
    ringScale.setValue(0.85);
    ringOpacity.setValue(0.8);

    // Run parallel pulse and expanding halo ring
    Animated.parallel([
      Animated.spring(pulseScale, {
        toValue: 1,
        friction: 4,
        tension: 160,
        useNativeDriver: true,
      }),
      Animated.timing(pulseOpacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(ringScale, {
        toValue: 1.35,
        duration: 550,
        useNativeDriver: true,
      }),
      Animated.timing(ringOpacity, {
        toValue: 0,
        duration: 550,
        useNativeDriver: true,
      }),
    ]).start();
  }, [countdown, pulseScale, pulseOpacity, ringScale, ringOpacity]);

  if (countdown === null) return null;

  const currentStage = STAGE_CONFIGS[countdown] ?? STAGE_CONFIGS[3]!;
  const isStart = countdown === 0;

  return (
    <View style={styles.countdownOverlay} pointerEvents="auto">
      <View style={[styles.countdownCard, { borderColor: `${currentStage.accentColor}55`, shadowColor: currentStage.accentColor }]}>
        {/* Mode & Title Tag */}
        <View style={styles.modeTag}>
          <Text style={styles.modeTagText}>{icon} {title}</Text>
        </View>

        {/* Central Glowing Orb with Dynamic Counter */}
        <View style={styles.orbArea}>
          {/* Animated Halo Ring */}
          <Animated.View
            style={[
              styles.expandingRing,
              {
                borderColor: currentStage.accentColor,
                transform: [{ scale: ringScale }],
                opacity: ringOpacity,
              },
            ]}
          />

          {/* Central Pulsing Sphere */}
          <Animated.View
            style={[
              styles.centerOrbWrap,
              {
                transform: [{ scale: pulseScale }],
                opacity: pulseOpacity,
              },
            ]}
          >
            <LinearGradient
              colors={currentStage.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.orbGradient}
            >
              {isStart ? (
                <View style={styles.startWrap}>
                  <Text style={styles.startText}>BAŞLA!</Text>
                  <Text style={styles.startEmoji}>🚀</Text>
                </View>
              ) : (
                <Text style={styles.numberText}>{countdown}</Text>
              )}
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Dynamic Stage Prompt & Hint */}
        <Text style={[styles.statusLabel, { color: currentStage.accentColor }]}>
          {currentStage.statusLabel}
        </Text>
        <Text style={styles.subtitleText}>{subtitle}</Text>

        {/* Step Indicator Progress Dots */}
        <View style={styles.stepDotsRow}>
          {[3, 2, 1].map((step) => {
            const isFilled = countdown <= step;
            return (
              <View
                key={step}
                style={[
                  styles.stepDot,
                  isFilled
                    ? {
                        backgroundColor: currentStage.accentColor,
                        shadowColor: currentStage.accentColor,
                        shadowOpacity: 0.8,
                        shadowRadius: 6,
                        elevation: 4,
                        width: 22,
                      }
                    : { backgroundColor: "rgba(255, 255, 255, 0.15)" },
                ]}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  countdownOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.78)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    paddingHorizontal: 20,
  },
  countdownCard: {
    width: "100%",
    maxWidth: 330,
    backgroundColor: "#1E293B",
    borderRadius: 32,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: "center",
    borderWidth: 2,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  modeTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  modeTagText: {
    color: "#E2E8F0",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  orbArea: {
    marginVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    width: 150,
    height: 150,
    position: "relative",
  },
  expandingRing: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2.5,
  },
  centerOrbWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  orbGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  numberText: {
    color: "#FFFFFF",
    fontSize: 66,
    fontWeight: "900",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.35)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  startWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  startText: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0.8,
    textShadowColor: "rgba(0, 0, 0, 0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  startEmoji: {
    fontSize: 20,
    marginTop: 2,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  subtitleText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 17,
    paddingHorizontal: 8,
  },
  stepDotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 18,
  },
  stepDot: {
    width: 10,
    height: 6,
    borderRadius: 3,
  },
});
