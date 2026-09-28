import React, { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from "react-native";

export type VictoryEffectId = "pulse" | "glitch" | "flare" | "lightning" | "fireworks";
const COLORS: Record<VictoryEffectId, string[]> = {
  pulse: ["#35BA92", "#FFD66E", "#78C9ED"],
  glitch: ["#35BA92", "#A5D98C", "#FFD66E"],
  flare: ["#F28A58", "#FFD66E", "#EE8496"],
  lightning: ["#FFD66E", "#78C9ED", "#AFA0E8"],
  fireworks: ["#EE8496", "#FFD66E", "#35BA92", "#78C9ED", "#AFA0E8"],
};

/** A lasting success marker, separate from the short-lived celebration. */
export function VictoryBanner({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.banner} accessibilityRole="summary">
      <Text style={styles.stars}>★  ★  ★</Text>
      <Text style={styles.bannerTitle}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

export function VictoryEffectOverlay({
  effectId = "pulse", visible = true, onFinish,
  title = "Harika oynadın!", subtitle = "Bu başarı senin.",
}: {
  effectId?: string; visible?: boolean; onFinish?: () => void;
  title?: string; subtitle?: string;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;
  const [done, setDone] = useState(false);
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  const colors = COLORS[effectId as VictoryEffectId] ?? COLORS.pulse;

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (active) setReduceMotion(value);
    }).catch(() => { if (active) setReduceMotion(false); });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => { active = false; subscription.remove(); };
  }, []);

  useEffect(() => {
    if (!visible || reduceMotion === null) return;
    setDone(false);
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished) { setDone(true); finishRef.current?.(); }
    });
    return () => animation.stop();
  }, [visible, reduceMotion, progress]);

  if (!visible || done || reduceMotion === null) return null;
  const opacity = reduceMotion ? 1 : progress.interpolate({ inputRange: [0, 0.06, 0.78, 1], outputRange: [0, 1, 1, 0] });
  return (
    <View pointerEvents="none" style={styles.overlay} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {!reduceMotion && Array.from({ length: 32 }, (_, i) => {
        const angle = (i / 32) * Math.PI * 2;
        const reach = 100 + (i % 5) * 24;
        return (
          <Animated.View key={i} style={[
            styles.confetti,
            { backgroundColor: colors[i % colors.length], borderRadius: i % 3 === 0 ? 7 : 2,
              opacity: progress.interpolate({ inputRange: [0, 0.08, 0.65, 0.95, 1], outputRange: [0, 1, 1, 0, 0] }),
              transform: [
                { translateX: progress.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, Math.cos(angle) * reach, Math.cos(angle) * reach * 1.25] }) },
                { translateY: progress.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, Math.sin(angle) * reach - 55, 280 + (i % 4) * 35] }) },
                { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${i % 2 ? 540 : -420}deg`] }) },
              ],
            },
          ]} />
        );
      })}
      <Animated.View style={[styles.toast, { opacity, transform: [{ scale: reduceMotion ? 1 : progress.interpolate({ inputRange: [0, 0.12, 0.2, 1], outputRange: [0.75, 1.06, 1, 1] }) }] }]}>
        <View style={styles.medal}><Text style={styles.trophy}>🏆</Text></View>
        <Text style={styles.kicker}>TEBRİKLER!</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, zIndex: 10000, elevation: 30, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  confetti: { position: "absolute", left: "50%", top: "40%", width: 9, height: 14 },
  toast: { width: "88%", maxWidth: 340, backgroundColor: "#FFFDF5", borderRadius: 30, borderWidth: 2, borderColor: "#E7C875", alignItems: "center", padding: 22, shadowColor: "#293541", shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 12 },
  medal: { width: 82, height: 82, borderRadius: 28, backgroundColor: "#FFE59A", alignItems: "center", justifyContent: "center", marginBottom: 12, transform: [{ rotate: "-7deg" }] },
  trophy: { fontSize: 48 },
  kicker: { color: "#96732C", fontSize: 11, fontWeight: "900", letterSpacing: 2, marginBottom: 6 },
  title: { color: "#293541", fontSize: 27, fontWeight: "900", textAlign: "center" },
  subtitle: { color: "#59665D", fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 7 },
  banner: { width: "100%", backgroundColor: "#FFF7D8", borderRadius: 20, borderWidth: 1, borderColor: "#E7D697", padding: 16, alignItems: "center", marginBottom: 12 },
  stars: { color: "#B98419", fontSize: 24, letterSpacing: 5, marginBottom: 5 },
  bannerTitle: { color: "#293541", fontSize: 23, fontWeight: "900", textAlign: "center" },
});
