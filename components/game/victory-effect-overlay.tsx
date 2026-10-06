import React, { useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from "react-native";

export type VictoryEffectId = "pulse" | "glitch" | "flare" | "lightning" | "fireworks";

interface ParticleModel {
  id: number;
  angle: number;
  distance: number;
  size: number;
  aspectRatio: number;
  color: string;
  isSparkle: boolean;
  isRibbon: boolean;
  spinTurns: number;
  wobbleFreq: number;
  wobbleAmp: number;
  fallDistance: number;
  delayFraction: number;
}

const EFFECT_CONFIGS: Record<VictoryEffectId, {
  colors: string[];
  particleCount: number;
  icon: string;
  badgeLabel: string;
  glowColor: string;
  shockwaveColor: string;
  burstType: "radial" | "glitch_matrix" | "fire_fountain" | "electric_arcs" | "grand_carnival";
}> = {
  pulse: {
    colors: ["#10B981", "#34D399", "#06B6D4", "#38BDF8", "#FDE047"],
    particleCount: 52,
    icon: "🌊",
    badgeLabel: "PULSE ZAFERİ",
    glowColor: "rgba(16, 185, 129, 0.45)",
    shockwaveColor: "rgba(52, 211, 153, 0.65)",
    burstType: "radial",
  },
  glitch: {
    colors: ["#38BDF8", "#818CF8", "#C084FC", "#F43F5E", "#00F5FF"],
    particleCount: 56,
    icon: "⚡",
    badgeLabel: "SİBER GLITCH",
    glowColor: "rgba(56, 189, 248, 0.55)",
    shockwaveColor: "rgba(192, 132, 252, 0.65)",
    burstType: "glitch_matrix",
  },
  flare: {
    colors: ["#F97316", "#FB923C", "#EF4444", "#FACC15", "#FDE047"],
    particleCount: 54,
    icon: "🔥",
    badgeLabel: "GÜNEŞ PATLAMASI",
    glowColor: "rgba(249, 115, 22, 0.55)",
    shockwaveColor: "rgba(239, 68, 68, 0.65)",
    burstType: "fire_fountain",
  },
  lightning: {
    colors: ["#38BDF8", "#60A5FA", "#FACC15", "#FFFFFF", "#A78BFA"],
    particleCount: 58,
    icon: "⚡",
    badgeLabel: "YILDIRIM DARBESİ",
    glowColor: "rgba(250, 204, 21, 0.6)",
    shockwaveColor: "rgba(56, 189, 248, 0.7)",
    burstType: "electric_arcs",
  },
  fireworks: {
    colors: ["#EC4899", "#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#F43F5E"],
    particleCount: 64,
    icon: "🎆",
    badgeLabel: "BÜYÜK KUTLAMA",
    glowColor: "rgba(236, 72, 153, 0.55)",
    shockwaveColor: "rgba(245, 158, 11, 0.7)",
    burstType: "grand_carnival",
  },
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
  showToast = true,
}: {
  effectId?: string; visible?: boolean; onFinish?: () => void;
  title?: string; subtitle?: string;
  showToast?: boolean;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const shockwave = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;
  const [done, setDone] = useState(false);
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);

  const activeEffectId = (effectId as VictoryEffectId) in EFFECT_CONFIGS
    ? (effectId as VictoryEffectId)
    : "pulse";
  const config = EFFECT_CONFIGS[activeEffectId];

  // Deterministik ama zengin ve fiziksel parçacık havuzu
  const particles = useMemo<ParticleModel[]>(() => {
    return Array.from({ length: config.particleCount }, (_, i) => {
      // Çift halkalı yayılım: merkezden radyal fırlama + parabolik aşağı salınım
      const baseAngle = (i / config.particleCount) * Math.PI * 2;
      const angleVariation = ((i * 17) % 20 - 10) * (Math.PI / 180);
      const angle = baseAngle + angleVariation;

      const isSparkle = i % 5 === 0;
      const isRibbon = !isSparkle && i % 3 === 0;
      const size = isSparkle ? 6 : isRibbon ? 9 : 8 + (i % 4) * 2;
      const aspectRatio = isRibbon ? 2.4 : isSparkle ? 1 : 1.3;
      const distance = 130 + (i % 7) * 26;
      const color = config.colors[i % config.colors.length]!;

      return {
        id: i,
        angle,
        distance,
        size,
        aspectRatio,
        color,
        isSparkle,
        isRibbon,
        spinTurns: (i % 2 === 0 ? 1 : -1) * (2 + (i % 3)),
        wobbleFreq: 2 + (i % 4),
        wobbleAmp: 18 + (i % 5) * 6,
        fallDistance: 280 + (i % 6) * 45,
        delayFraction: (i % 8) * 0.02,
      };
    });
  }, [config]);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduceMotion(value);
    }).catch(() => {
      if (active) setReduceMotion(false);
    });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!visible || reduceMotion === null) return;
    setDone(false);
    progress.setValue(0);
    shockwave.setValue(0);
    flashAnim.setValue(0);

    const animation = Animated.parallel([
      // Parçacık ve genel akış: 3.2 saniye
      Animated.timing(progress, {
        toValue: 1,
        duration: 3200,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }),
      // İlk vuruş anında beyaz/enerji parlaması (screen flash)
      Animated.sequence([
        Animated.timing(flashAnim, {
          toValue: 1,
          duration: 100,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(flashAnim, {
          toValue: 0,
          duration: 340,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      // Çift kademeli rezonant şok dalgası
      Animated.sequence([
        Animated.timing(shockwave, {
          toValue: 1,
          duration: 850,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(shockwave, {
          toValue: 2,
          duration: 950,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]);

    animation.start(({ finished }) => {
      if (finished) {
        setDone(true);
        finishRef.current?.();
      }
    });

    return () => animation.stop();
  }, [visible, reduceMotion, progress, shockwave, flashAnim]);

  if (!visible || done || reduceMotion === null) return null;

  // Kartın pürüzsüz giriş/çıkış eğrileri
  const cardOpacity = reduceMotion
    ? 1
    : progress.interpolate({
        inputRange: [0, 0.08, 0.82, 1],
        outputRange: [0, 1, 1, 0],
      });

  const cardScale = reduceMotion
    ? 1
    : progress.interpolate({
        inputRange: [0, 0.12, 0.24, 0.88, 1],
        outputRange: [0.6, 1.06, 1, 1, 0.94],
      });

  const cardTranslateY = reduceMotion
    ? 0
    : progress.interpolate({
        inputRange: [0, 0.15, 0.85, 1],
        outputRange: [40, 0, 0, -20],
      });

  // Şok dalgası genişlemesi
  const shockwaveScale1 = shockwave.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0.15, 3.2, 4.6],
  });

  const shockwaveOpacity1 = shockwave.interpolate({
    inputRange: [0, 0.15, 0.8, 1, 2],
    outputRange: [0, 0.85, 0.05, 0, 0],
  });

  const shockwaveScale2 = shockwave.interpolate({
    inputRange: [0, 1, 1.15, 2],
    outputRange: [0.15, 0.25, 1.4, 4.0],
  });

  const shockwaveOpacity2 = shockwave.interpolate({
    inputRange: [0, 0.95, 1.1, 1.8, 2],
    outputRange: [0, 0, 0.75, 0.05, 0],
  });

  return (
    <View
      pointerEvents="none"
      style={styles.overlay}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {/* 1. Ekran Işık Patlaması (Screen Flash) */}
      {!reduceMotion && (
        <Animated.View
          style={[
            styles.screenFlash,
            {
              backgroundColor: config.colors[0],
              opacity: flashAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.22],
              }),
            },
          ]}
        />
      )}

      {/* 2. Genişleyen Çift Enerji Halkası (Dual Resonant Shockwaves) */}
      {!reduceMotion && (
        <>
          <Animated.View
            style={[
              styles.shockwaveRing,
              {
                borderColor: config.shockwaveColor,
                transform: [{ scale: shockwaveScale1 }],
                opacity: shockwaveOpacity1,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.shockwaveRingSecondary,
              {
                borderColor: config.colors[1] || config.shockwaveColor,
                transform: [{ scale: shockwaveScale2 }],
                opacity: shockwaveOpacity2,
              },
            ]}
          />
        </>
      )}

      {/* 3. Gerçekçi Fiziksel Parçacık Simülasyonu (Fırlama + Yerçekimi İvmesi + Hava Direnci + 3D Yalpalama) */}
      {!reduceMotion &&
        particles.map((p) => {
          // Yayılma fazı: 0.0 -> 0.35 saniyede patlama dışa doğru hızlanır
          // Düşüş fazı: 0.35 -> 1.0 saniyede yerçekimi ile aşağı süzülür ve yalpalar
          const burstX = Math.cos(p.angle) * p.distance;
          const burstY = Math.sin(p.angle) * p.distance - 65;

          const translateX = progress.interpolate({
            inputRange: [0, 0.32, 0.65, 1],
            outputRange: [
              0,
              burstX,
              burstX * 1.25 + (p.id % 2 === 0 ? p.wobbleAmp : -p.wobbleAmp),
              burstX * 1.35 + (p.id % 2 === 0 ? -p.wobbleAmp * 0.8 : p.wobbleAmp * 0.8),
            ],
          });

          const translateY = progress.interpolate({
            inputRange: [0, 0.32, 0.6, 1],
            outputRange: [
              0,
              burstY,
              burstY + p.fallDistance * 0.45,
              burstY + p.fallDistance + 80,
            ],
          });

          const rotate = progress.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", `${p.spinTurns * 360}deg`],
          });

          const particleOpacity = progress.interpolate({
            inputRange: [0, 0.05, 0.72, 0.94, 1],
            outputRange: [0, 1, 1, 0.2, 0],
          });

          const particleScale = progress.interpolate({
            inputRange: [0, 0.15, 0.7, 1],
            outputRange: [0.3, 1.15, 1, 0.6],
          });

          return (
            <Animated.View
              key={p.id}
              style={[
                styles.particle,
                {
                  width: p.size,
                  height: p.size * p.aspectRatio,
                  borderRadius: p.isSparkle ? p.size / 2 : p.isRibbon ? 2 : 3,
                  backgroundColor: p.color,
                  shadowColor: p.color,
                  shadowOpacity: p.isSparkle ? 0.85 : 0.45,
                  shadowRadius: p.isSparkle ? 8 : 4,
                  shadowOffset: { width: 0, height: 0 },
                  opacity: particleOpacity,
                  transform: [
                    { translateX },
                    { translateY },
                    { rotate },
                    { scale: particleScale },
                  ],
                },
              ]}
            />
          );
        })}

      {/* 4. Cilalı Zafer Tebrik Kartı & Kupa */}
      {showToast && (
        <Animated.View
          style={[
            styles.toast,
            {
              shadowColor: config.glowColor,
              opacity: cardOpacity,
              transform: [
                { scale: cardScale },
                { translateY: cardTranslateY },
              ],
            },
          ]}
        >
          {/* Işıltılı Arka Plan Efekt Halkası */}
          <View style={[styles.haloGlow, { backgroundColor: config.glowColor }]} />

          <View style={[styles.medal, { backgroundColor: config.colors[0] + "22", borderColor: config.colors[0] }]}>
            <Text style={styles.trophy}>{config.icon}</Text>
          </View>

          <View style={[styles.badgePill, { backgroundColor: config.colors[0] + "20", borderColor: config.colors[0] }]}>
            <Text style={[styles.badgePillText, { color: config.colors[0] }]}>
              {config.badgeLabel}
            </Text>
          </View>

          <Text style={styles.kicker}>TEBRİKLER!</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 10000,
    elevation: 30,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  screenFlash: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
  },
  shockwaveRing: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 4,
  },
  shockwaveRingSecondary: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2.5,
    borderStyle: "dashed",
  },
  particle: {
    position: "absolute",
    left: "50%",
    top: "38%",
  },
  toast: {
    width: "88%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    shadowOpacity: 0.35,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
    zIndex: 10,
  },
  haloGlow: {
    position: "absolute",
    top: -25,
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.65,
  },
  medal: {
    width: 86,
    height: 86,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    transform: [{ rotate: "-6deg" }],
  },
  trophy: {
    fontSize: 48,
  },
  badgePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  kicker: {
    color: "#D97706",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2.2,
    marginBottom: 4,
  },
  title: {
    color: "#111827",
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    color: "#4B5563",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 6,
  },
  banner: {
    width: "100%",
    backgroundColor: "#FFFBEB",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#FCD34D",
    padding: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  stars: {
    color: "#D97706",
    fontSize: 24,
    letterSpacing: 5,
    marginBottom: 5,
  },
  bannerTitle: {
    color: "#1F2937",
    fontSize: 23,
    fontWeight: "900",
    textAlign: "center",
  },
});
