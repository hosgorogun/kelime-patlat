import React, { useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { gameSfx } from "@/lib/game-sfx";
import { triggerHapticLongWord } from "@/shared/audio-haptics";

export type VictoryEffectId = "pulse" | "glitch" | "flare" | "lightning" | "fireworks";

type Particle = {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  glyph?: string;
  anim: Animated.ValueXY;
  scaleAnim: Animated.Value;
  opacityAnim: Animated.Value;
};

const EFFECT_META: Record<string, { label: string; glyph: string; color: string; accentColor: string; description: string }> = {
  pulse: {
    label: "SİBER PULSE",
    glyph: "🌊",
    color: "#3EE8B5",
    accentColor: "#0D9488",
    description: "Rezonans Şok Dalgası",
  },
  glitch: {
    label: "MATRİS GLITCH",
    glyph: "💻",
    color: "#E8C36A",
    accentColor: "#10B981",
    description: "Dijital Veri Patlaması",
  },
  flare: {
    label: "GÜNEŞ FLARE",
    glyph: "💥",
    color: "#F97316",
    accentColor: "#EF4444",
    description: "Kozmik Parlama Halesi",
  },
  lightning: {
    label: "ŞİMŞEK ÇARPMASI",
    glyph: "⚡",
    color: "#FACC15",
    accentColor: "#60A5FA",
    description: "Yüksek Voltaj Boşalımı",
  },
  fireworks: {
    label: "BÜYÜK KUTLAMA",
    glyph: "🎆",
    color: "#FF2A85",
    accentColor: "#A855F7",
    description: "Görkemli Havai Fişek & Konfeti",
  },
};

export function VictoryEffectOverlay({
  effectId = "pulse",
  visible = true,
  onFinish,
}: {
  effectId?: string;
  visible?: boolean;
  onFinish?: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const safeEffect = EFFECT_META[effectId] ? effectId : "pulse";
  const meta = EFFECT_META[safeEffect]!;

  // Animasyon Değerleri
  const shockwave1 = useRef(new Animated.Value(0)).current;
  const shockwave2 = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const badgeAnim = useRef(new Animated.Value(0)).current;
  const particlesRef = useRef<Particle[]>([]);

  // Parçacıkları oluştur
  const particles = useMemo(() => {
    if (!visible) return [];
    const count = safeEffect === "fireworks" ? 36 : safeEffect === "lightning" ? 28 : safeEffect === "flare" ? 30 : safeEffect === "glitch" ? 26 : 24;
    const list: Particle[] = [];

    const colorPalette =
      safeEffect === "fireworks"
        ? ["#FF2A85", "#3EE8B5", "#FACC15", "#A855F7", "#38BDF8", "#FF647C"]
        : safeEffect === "lightning"
        ? ["#FACC15", "#FEF08A", "#FFFFFF", "#60A5FA", "#93C5FD"]
        : safeEffect === "flare"
        ? ["#F97316", "#FB923C", "#FFD000", "#EF4444", "#FCA5A5"]
        : safeEffect === "glitch"
        ? ["#10B981", "#34D399", "#E8C36A", "#059669", "#A7F3D0"]
        : ["#3EE8B5", "#2DD4BF", "#0D9488", "#5EEAD4", "#CCFBF1"];

    const centerX = width / 2;
    const centerY = height * 0.38;

    for (let i = 0; i < count; i++) {
      const pColor = colorPalette[i % colorPalette.length]!;
      const anim = new Animated.ValueXY({ x: 0, y: 0 });
      const scaleAnim = new Animated.Value(0);
      const opacityAnim = new Animated.Value(1);

      list.push({
        id: i,
        x: centerX,
        y: centerY,
        size: safeEffect === "glitch" ? 8 : safeEffect === "fireworks" ? 6 + (i % 5) : 5 + (i % 4),
        color: pColor,
        glyph: safeEffect === "glitch" && i % 3 === 0 ? (i % 2 === 0 ? "1" : "0") : undefined,
        anim,
        scaleAnim,
        opacityAnim,
      });
    }
    particlesRef.current = list;
    return list;
  }, [visible, safeEffect, width, height]);

  useEffect(() => {
    if (!visible) return;

    // Haptics ve ses
    triggerHapticLongWord();
    gameSfx.victory();

    // 1. Rozet açılışı
    Animated.spring(badgeAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();

    // 2. Flaş / Şok Dalgası
    if (safeEffect === "lightning") {
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 0.65, duration: 80, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 0.1, duration: 60, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 0.85, duration: 90, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 0, duration: 320, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 0.45, duration: 120, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]).start();
    }

    // 3. Şok dalgaları (Pulse & Flare için)
    Animated.parallel([
      Animated.timing(shockwave1, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(180),
        Animated.timing(shockwave2, {
          toValue: 1,
          duration: 950,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // 4. Parçacık Animasyonları
    const particleAnimations = particles.map((p, idx) => {
      const angle = (idx / particles.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = safeEffect === "fireworks" ? 90 + Math.random() * 140 : safeEffect === "lightning" ? 110 + Math.random() * 160 : 70 + Math.random() * 110;
      const targetX = Math.cos(angle) * speed;
      const targetY = Math.sin(angle) * speed + (safeEffect === "fireworks" ? 40 : 0);

      return Animated.parallel([
        Animated.timing(p.anim, {
          toValue: { x: targetX, y: targetY },
          duration: 850 + Math.random() * 400,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(p.scaleAnim, {
            toValue: 1.2,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(p.scaleAnim, {
            toValue: 0.2,
            duration: 750,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(450),
          Animated.timing(p.opacityAnim, {
            toValue: 0,
            duration: 450,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    Animated.stagger(15, particleAnimations).start();

    // Otomatik kapanış / geri çağırma zamanlayıcısı
    const timer = setTimeout(() => {
      onFinish?.();
    }, 2800);

    return () => clearTimeout(timer);
    // Anim değerleri sabit Animated.Value ref'leridir; onFinish her render'da değişebilir ama efekt yalnızca görünür olduğunda çalışır
  }, [visible, safeEffect, particles, badgeAnim, flashAnim, shockwave1, shockwave2, onFinish]);

  if (!visible) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* 1. Ekran Işıması / Parlama Flaş Katmanı */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: meta.color,
            opacity: flashAnim,
            zIndex: 90,
          },
        ]}
      />

      {/* 2. Merkez Şok Dalgası Halkaları */}
      <View
        style={{
          position: "absolute",
          left: width / 2 - 120,
          top: height * 0.38 - 120,
          width: 240,
          height: 240,
          justifyContent: "center",
          alignItems: "center",
          zIndex: 92,
        }}
      >
        <Animated.View
          style={{
            position: "absolute",
            width: 240,
            height: 240,
            borderRadius: 120,
            borderWidth: 3,
            borderColor: meta.color,
            transform: [
              {
                scale: shockwave1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.2, 2.4],
                }),
              },
            ],
            opacity: shockwave1.interpolate({
              inputRange: [0, 0.4, 1],
              outputRange: [0.9, 0.6, 0],
            }),
            shadowColor: meta.color,
            shadowOpacity: 0.8,
            shadowRadius: 16,
            elevation: 8,
          }}
        />

        <Animated.View
          style={{
            position: "absolute",
            width: 240,
            height: 240,
            borderRadius: 120,
            borderWidth: 2,
            borderColor: meta.accentColor,
            borderStyle: "dashed",
            transform: [
              {
                scale: shockwave2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.1, 2.1],
                }),
              },
            ],
            opacity: shockwave2.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.8, 0.4, 0],
            }),
          }}
        />
      </View>

      {/* 3. Animasyonlu Parçacıklar / Kıvılcımlar / Konfetiler */}
      {particles.map((p) => (
        <Animated.View
          key={p.id}
          style={{
            position: "absolute",
            left: p.x - p.size / 2,
            top: p.y - p.size / 2,
            width: p.glyph ? p.size * 2 : p.size,
            height: p.size,
            borderRadius: safeEffect === "glitch" ? 1 : p.size / 2,
            backgroundColor: p.glyph ? "transparent" : p.color,
            transform: [
              ...p.anim.getTranslateTransform(),
              { scale: p.scaleAnim },
            ],
            opacity: p.opacityAnim,
            zIndex: 95,
            shadowColor: p.color,
            shadowOpacity: 0.9,
            shadowRadius: 8,
            elevation: 6,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {p.glyph ? (
            <Text style={{ color: p.color, fontSize: 11, fontWeight: "900", fontFamily: "monospace" }}>
              {p.glyph}
            </Text>
          ) : null}
        </Animated.View>
      ))}

      {/* 4. Şık Kutlama ve Efekt Bilgi Rozeti (Banner) */}
      <Animated.View
        style={{
          position: "absolute",
          top: 60,
          left: 20,
          right: 20,
          alignItems: "center",
          zIndex: 100,
          transform: [
            {
              scale: badgeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.7, 1],
              }),
            },
            {
              translateY: badgeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-30, 0],
              }),
            },
          ],
          opacity: badgeAnim,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "rgba(10, 26, 20, 0.98)",
            borderRadius: 20,
            paddingVertical: 10,
            paddingHorizontal: 18,
            borderWidth: 2,
            borderColor: meta.color,
            shadowColor: meta.color,
            shadowOpacity: 0.6,
            shadowRadius: 14,
            elevation: 12,
            gap: 10,
          }}
        >
          <Text style={{ fontSize: 22 }}>{meta.glyph}</Text>
          <View>
            <Text style={{ color: meta.color, fontSize: 12, fontWeight: "900", letterSpacing: 1.5 }}>
              {meta.label} AKTİF
            </Text>
            <Text style={{ color: "#CBD5E1", fontSize: 10, fontWeight: "700", marginTop: 1 }}>
              {meta.description}
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
