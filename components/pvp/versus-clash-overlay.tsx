import React, { useEffect, useRef } from "react";
import { Animated, Modal, StyleSheet, Text, View, Image, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { gameSfx, triggerHapticSelection, triggerHapticSuccess } from "@/shared/audio-haptics";
import { resolveAvatarDisplay } from "@/shared/progression";

export interface VersusClashOverlayProps {
  visible: boolean;
  playerName: string;
  playerAvatar?: string;
  playerAvatarPhoto?: string;
  playerTier?: string;
  playerTitle?: string;
  playerLevel?: number;
  opponentName: string;
  opponentAvatar?: string;
  opponentAvatarPhoto?: string;
  opponentTier?: string;
  opponentTitle?: string;
  opponentLevel?: number;
  isBot?: boolean;
}

const SPARK_ANGLES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

export function VersusClashOverlay({
  visible,
  playerName,
  playerAvatar = "✦",
  playerAvatarPhoto,
  playerTier = "BRONZ",
  playerTitle = "Kelime Avcısı",
  playerLevel = 1,
  opponentName,
  opponentAvatar = "⚡",
  opponentAvatarPhoto,
  opponentTier = "BRONZ",
  opponentTitle = "Meydan Okuyan",
  opponentLevel = 1,
  isBot = false,
}: VersusClashOverlayProps) {
  const leftSlide = useRef(new Animated.Value(-340)).current;
  const rightSlide = useRef(new Animated.Value(340)).current;
  const leftRotate = useRef(new Animated.Value(-8)).current;
  const rightRotate = useRef(new Animated.Value(8)).current;

  const vsScale = useRef(new Animated.Value(0)).current;
  const vsPulse = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const shockwaveScale = useRef(new Animated.Value(0.2)).current;
  const shockwaveOpacity = useRef(new Animated.Value(0)).current;
  const sparksAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const exitAnim = useRef(new Animated.Value(1)).current;

  const playerGlyph = resolveAvatarDisplay(playerAvatar);
  const opponentGlyph = resolveAvatarDisplay(opponentAvatar || "🦊");

  useEffect(() => {
    if (!visible) return;

    // Başlangıç değerlerini sıfırla
    leftSlide.setValue(-340);
    rightSlide.setValue(340);
    leftRotate.setValue(-8);
    rightRotate.setValue(8);

    vsScale.setValue(0);
    vsPulse.setValue(1);
    flashAnim.setValue(0);
    shockwaveScale.setValue(0.2);
    shockwaveOpacity.setValue(0);
    sparksAnim.setValue(0);
    shakeAnim.setValue(0);
    exitAnim.setValue(1);

    // Giriş sesi ve haptik
    gameSfx.tap();
    triggerHapticSelection();

    // 1. Oyuncuların merkez noktasına hızlı hücumu (360ms)
    Animated.parallel([
      Animated.timing(leftSlide, {
        toValue: 0,
        duration: 360,
        easing: Easing.out(Easing.back(1.05)),
        useNativeDriver: true,
      }),
      Animated.timing(rightSlide, {
        toValue: 0,
        duration: 360,
        easing: Easing.out(Easing.back(1.05)),
        useNativeDriver: true,
      }),
      Animated.timing(leftRotate, {
        toValue: 0,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rightRotate, {
        toValue: 0,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2. ÇARPIŞMA ANI (Collision & Impact Moment!)
      gameSfx.combo();
      triggerHapticSuccess();

      // Beyaz ekran flaşı
      Animated.sequence([
        Animated.timing(flashAnim, {
          toValue: 0.95,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(flashAnim, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();

      // Güçlü ekran sarsıntısı (Screen Shake)
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 14, duration: 35, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -14, duration: 35, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 9, duration: 35, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -9, duration: 35, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 4, duration: 35, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 35, useNativeDriver: true }),
      ]).start();

      // Şok dalgası ve kıvılcım patlaması
      shockwaveScale.setValue(0.3);
      shockwaveOpacity.setValue(1);
      Animated.parallel([
        Animated.timing(shockwaveScale, {
          toValue: 3.2,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(shockwaveOpacity, {
          toValue: 0,
          duration: 650,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sparksAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();

      // 3D "VS" madalyonunun çarpıcı inişi
      Animated.spring(vsScale, {
        toValue: 1,
        friction: 4.5,
        tension: 190,
        useNativeDriver: true,
      }).start(() => {
        // Ekranda kaldığı süre boyunca nefes alma nabzı
        Animated.loop(
          Animated.sequence([
            Animated.timing(vsPulse, {
              toValue: 1.08,
              duration: 550,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(vsPulse, {
              toValue: 1.0,
              duration: 550,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    });

    // 3. Ekranda oyuncuları doyasıya gösterdikten sonra yumuşak sinematik çıkış (2400ms - 2800ms)
    const exitTimer = setTimeout(() => {
      Animated.timing(exitAnim, {
        toValue: 0,
        duration: 380,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, 2400);

    return () => {
      clearTimeout(exitTimer);
    };
  }, [visible, leftSlide, rightSlide, leftRotate, rightRotate, vsScale, vsPulse, flashAnim, shockwaveScale, shockwaveOpacity, sparksAnim, shakeAnim, exitAnim]);

  if (!visible) return null;

  const leftRotateStr = leftRotate.interpolate({
    inputRange: [-8, 0],
    outputRange: ["-8deg", "0deg"],
  });

  const rightRotateStr = rightRotate.interpolate({
    inputRange: [0, 8],
    outputRange: ["0deg", "8deg"],
  });

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.container,
          {
            opacity: exitAnim,
            transform: [
              { translateX: shakeAnim },
              {
                scale: exitAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1.06, 1],
                }),
              },
            ],
          },
        ]}
      >
        {/* Ortam Işıkları (Sol Mavi Aura, Sağ Pembe/Mor Aura) */}
        <View style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={["rgba(14, 165, 233, 0.22)", "transparent"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 0.6, y: 0.5 }}
            style={styles.ambientGlowLeft}
          />
          <LinearGradient
            colors={["transparent", isBot ? "rgba(168, 85, 247, 0.22)" : "rgba(244, 63, 94, 0.22)"]}
            start={{ x: 0.4, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.ambientGlowRight}
          />
        </View>

        {/* Çarpışma Anı Beyaz Işık Patlaması */}
        <Animated.View
          style={[
            styles.clashFlash,
            {
              opacity: flashAnim,
            },
          ]}
        />

        {/* Üst Başlık Şeridi */}
        <View style={styles.topHeaderTag}>
          <View style={styles.livePulseDot} />
          <Text style={styles.topHeaderTagText}>⚔️ CANLI KELİME DÜELLOSU ⚔️</Text>
        </View>

        {/* Düello Arenası */}
        <View style={styles.versusArena}>
          {/* Sol Oyuncu Kartı (Sen) */}
          <Animated.View
            style={[
              styles.playerCard,
              {
                transform: [{ translateX: leftSlide }, { rotate: leftRotateStr }],
              },
            ]}
          >
            <View style={styles.roleBadgeLeft}>
              <Text style={styles.roleBadgeLeftText}>🔵 SEN</Text>
            </View>

            <View style={styles.avatarOuterRingMe}>
              <LinearGradient
                colors={["#0EA5E9", "#0284C7", "#0369A1"]}
                style={styles.avatarGradientRing}
              >
                {playerAvatarPhoto ? (
                  <Image source={{ uri: playerAvatarPhoto }} style={styles.avatarPhoto} resizeMode="cover" />
                ) : (
                  <Text style={styles.avatarGlyph}>{playerGlyph}</Text>
                )}
              </LinearGradient>
              <View style={styles.levelBubble}>
                <Text style={styles.levelBubbleText}>{playerLevel}</Text>
              </View>
            </View>

            <Text style={styles.playerName} numberOfLines={1}>
              {playerName}
            </Text>

            <Text style={styles.playerTitle} numberOfLines={1}>
              {playerTitle}
            </Text>

            <View style={styles.tierPillLeft}>
              <LinearGradient
                colors={["rgba(14, 165, 233, 0.35)", "rgba(2, 132, 199, 0.45)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.tierPillGradient}
              >
                <Text style={styles.tierTextLeft}>🏆 {playerTier}</Text>
              </LinearGradient>
            </View>
          </Animated.View>

          {/* Merkez: Enerji Şok Dalgası, Kıvılcımlar ve VS Rozeti */}
          <View style={styles.centerClashZone}>
            {/* Şok Dalgası Halkası */}
            <Animated.View
              style={[
                styles.shockwaveRing,
                {
                  transform: [{ scale: shockwaveScale }],
                  opacity: shockwaveOpacity,
                },
              ]}
            />

            {/* Dairesel Dağılan Kıvılcım Parçacıkları */}
            {SPARK_ANGLES.map((angleDeg, i) => {
              const rad = (angleDeg * Math.PI) / 180;
              const sparkX = sparksAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, Math.cos(rad) * 78],
              });
              const sparkY = sparksAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, Math.sin(rad) * 78],
              });
              const sparkScale = sparksAnim.interpolate({
                inputRange: [0, 0.3, 1],
                outputRange: [0, 1.2, 0],
              });
              const sparkOpacity = sparksAnim.interpolate({
                inputRange: [0, 0.2, 1],
                outputRange: [0, 1, 0],
              });

              return (
                <Animated.View
                  key={`spark-${i}`}
                  style={[
                    styles.sparkDot,
                    {
                      backgroundColor: i % 2 === 0 ? "#FDE047" : "#F43F5E",
                      transform: [
                        { translateX: sparkX },
                        { translateY: sparkY },
                        { scale: sparkScale },
                      ],
                      opacity: sparkOpacity,
                    },
                  ]}
                />
              );
            })}

            {/* Çarpıcı 3D "VS" Rozeti */}
            <Animated.View
              style={[
                styles.vsBadgeContainer,
                {
                  transform: [
                    { scale: Animated.multiply(vsScale, vsPulse) },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={["#FF416C", "#FF4B2B", "#F59E0B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.vsBadge}
              >
                <Text style={styles.vsText}>VS</Text>
              </LinearGradient>
            </Animated.View>
          </View>

          {/* Sağ Oyuncu Kartı (Rakip / Bot) */}
          <Animated.View
            style={[
              styles.playerCard,
              {
                transform: [{ translateX: rightSlide }, { rotate: rightRotateStr }],
              },
            ]}
          >
            <View style={[styles.roleBadgeRight, isBot && { borderColor: "#A855F7", backgroundColor: "rgba(168, 85, 247, 0.25)" }]}>
              <Text style={[styles.roleBadgeRightText, isBot && { color: "#D8B4FE" }]}>
                {isBot ? "🤖 BOT" : "🔴 RAKİP"}
              </Text>
            </View>

            <View style={[styles.avatarOuterRingOpponent, isBot && { borderColor: "#C084FC", shadowColor: "#A855F7" }]}>
              <LinearGradient
                colors={isBot ? ["#A855F7", "#7C3AED", "#581C87"] : ["#F43F5E", "#E11D48", "#9F1239"]}
                style={styles.avatarGradientRing}
              >
                {opponentAvatarPhoto ? (
                  <Image source={{ uri: opponentAvatarPhoto }} style={styles.avatarPhoto} resizeMode="cover" />
                ) : (
                  <Text style={styles.avatarGlyph}>{opponentGlyph}</Text>
                )}
              </LinearGradient>
              <View style={[styles.levelBubble, isBot && { backgroundColor: "#7C3AED" }]}>
                <Text style={styles.levelBubbleText}>{opponentLevel}</Text>
              </View>
            </View>

            <Text style={styles.playerName} numberOfLines={1}>
              {opponentName}
            </Text>

            <Text style={styles.playerTitle} numberOfLines={1}>
              {opponentTitle}
            </Text>

            <View style={styles.tierPillRight}>
              <LinearGradient
                colors={isBot ? ["rgba(168, 85, 247, 0.35)", "rgba(124, 58, 237, 0.45)"] : ["rgba(244, 63, 94, 0.35)", "rgba(225, 29, 72, 0.45)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.tierPillGradient}
              >
                <Text style={styles.tierTextRight}>⚡ {opponentTier}</Text>
              </LinearGradient>
            </View>
          </Animated.View>
        </View>

        {/* Alt Bilgi & Hazırlık Şeridi */}
        <View style={styles.bottomStatusWrap}>
          <Text style={styles.bottomStatusText}>🔥 NEFESİNİ TUT · TAHTA BİRAZDAN AÇILIYOR!</Text>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(7, 11, 25, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    paddingHorizontal: 16,
  },
  ambientGlowLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "55%",
  },
  ambientGlowRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "55%",
  },
  clashFlash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    zIndex: 10,
  },
  topHeaderTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.18)",
    marginBottom: 42,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  topHeaderTagText: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  versusArena: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 390,
    height: 250,
    position: "relative",
  },
  playerCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  roleBadgeLeft: {
    backgroundColor: "rgba(14, 165, 233, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#38BDF8",
    marginBottom: 8,
  },
  roleBadgeLeftText: {
    color: "#7DD3FC",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  roleBadgeRight: {
    backgroundColor: "rgba(244, 63, 94, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FB7185",
    marginBottom: 8,
  },
  roleBadgeRightText: {
    color: "#FDA4AF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  avatarOuterRingMe: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3.5,
    borderColor: "#38BDF8",
    padding: 3,
    shadowColor: "#0EA5E9",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.8,
    shadowRadius: 18,
    elevation: 14,
    position: "relative",
  },
  avatarOuterRingOpponent: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3.5,
    borderColor: "#FB7185",
    padding: 3,
    shadowColor: "#F43F5E",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.8,
    shadowRadius: 18,
    elevation: 14,
    position: "relative",
  },
  avatarGradientRing: {
    width: "100%",
    height: "100%",
    borderRadius: 46,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarPhoto: {
    width: "100%",
    height: "100%",
    borderRadius: 46,
  },
  avatarGlyph: {
    fontSize: 44,
    textAlign: "center",
    includeFontPadding: false,
  },
  levelBubble: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#0F766E",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    minWidth: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  levelBubbleText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },
  playerName: {
    marginTop: 10,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
    maxWidth: 125,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  playerTitle: {
    marginTop: 2,
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "700",
    maxWidth: 125,
    textAlign: "center",
  },
  tierPillLeft: {
    marginTop: 6,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#38BDF8",
  },
  tierPillRight: {
    marginTop: 6,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#FB7185",
  },
  tierPillGradient: {
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tierTextLeft: {
    color: "#BAE6FD",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  tierTextRight: {
    color: "#FECDD3",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  centerClashZone: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    zIndex: 20,
  },
  shockwaveRing: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  sparkDot: {
    position: "absolute",
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  vsBadgeContainer: {
    width: 76,
    height: 76,
    justifyContent: "center",
    alignItems: "center",
  },
  vsBadge: {
    width: 74,
    height: 74,
    borderRadius: 37,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#FEF08A",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 20,
  },
  vsText: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: 1.5,
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 3,
  },
  bottomStatusWrap: {
    marginTop: 48,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  bottomStatusText: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textAlign: "center",
  },
});
