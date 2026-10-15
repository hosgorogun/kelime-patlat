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
    <View style={styles.countdownOverlay} pointerEvents="none">
      {/* Central Glassmorphic Halo HUD */}
      <View style={styles.contentWrap}>
        {/* Mode Tag */}
        <View style={[styles.modeTag, { borderColor: `${currentStage.accentColor}55`, backgroundColor: "rgba(255, 255, 255, 0.95)" }]}>
          <Text style={styles.modeTagIcon}>{icon}</Text>
          <Text style={[styles.modeTagText, { color: "#1E293B" }]}>{title}</Text>
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
                  shadowColor: currentStage.accentColor,
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
                  </View>
                ) : (
                  <Text style={styles.numberText}>{countdown}</Text>
                )}
              </LinearGradient>
            </Animated.View>
          </View>

          {/* Dynamic Stage Prompt Banner */}
          <View style={[styles.promptBadge, { backgroundColor: "rgba(255, 255, 255, 0.96)", borderColor: `${currentStage.accentColor}66` }]}>
            <Text style={[styles.statusLabel, { color: currentStage.accentColor }]}>
              {currentStage.statusLabel}
            </Text>
            <Text style={styles.subtitleText}>{subtitle}</Text>
          </View>

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
                          shadowOpacity: 0.9,
                          shadowRadius: 6,
                          elevation: 4,
                          width: 24,
                        }
                      : { backgroundColor: "rgba(255, 255, 255, 0.45)" },
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
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  contentWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modeTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 24,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    gap: 6,
  },
  modeTagIcon: {
    fontSize: 14,
  },
  modeTagText: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  orbArea: {
    marginVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    width: 156,
    height: 156,
    position: "relative",
  },
  expandingRing: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
  },
  centerOrbWrap: {
    width: 126,
    height: 126,
    borderRadius: 63,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  orbGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  numberText: {
    color: "#FFFFFF",
    fontSize: 68,
    fontWeight: "900",
    letterSpacing: -1,
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
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  promptBadge: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxWidth: 290,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  subtitleText: {
    color: "#475569",
    fontSize: 11.5,
    fontWeight: "700",
    textAlign: "center",
  },
  stepDotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 14,
  },
  stepDot: {
    width: 10,
    height: 6,
    borderRadius: 3,
  },
});
