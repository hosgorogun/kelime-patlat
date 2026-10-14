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
  opponentName: string;
  opponentAvatar?: string;
  opponentAvatarPhoto?: string;
  opponentTier?: string;
  playerTier?: string;
  isBot?: boolean;
}

export function VersusClashOverlay({
  visible,
  playerName,
  playerAvatar = "✦",
  playerAvatarPhoto,
  opponentName,
  opponentAvatar = "⚡",
  opponentAvatarPhoto,
  opponentTier = "BRONZ",
  playerTier = "BRONZ",
  isBot = false,
}: VersusClashOverlayProps) {
  const leftSlide = useRef(new Animated.Value(-260)).current;
  const rightSlide = useRef(new Animated.Value(260)).current;
  const vsScale = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const playerGlyph = resolveAvatarDisplay(playerAvatar);
  const opponentGlyph = resolveAvatarDisplay(opponentAvatar || "🦊");

  useEffect(() => {
    if (!visible) return;

    leftSlide.setValue(-260);
    rightSlide.setValue(260);
    vsScale.setValue(0);
    flashAnim.setValue(0);
    shakeAnim.setValue(0);

    // Initial swoosh sound & haptic
    gameSfx.tap();
    triggerHapticSelection();

    // 1. Avatars rush toward the center
    Animated.parallel([
      Animated.timing(leftSlide, {
        toValue: 0,
        duration: 340,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rightSlide, {
        toValue: 0,
        duration: 340,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2. Collision / Clash moment!
      gameSfx.combo();
      triggerHapticSuccess();

      // Screen flash and intense shake
      Animated.sequence([
        Animated.timing(flashAnim, {
          toValue: 1,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(flashAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 7, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -7, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();

      // 3. Dramatic "VS" badge slam
      Animated.spring(vsScale, {
        toValue: 1,
        friction: 4,
        tension: 180,
        useNativeDriver: true,
      }).start();
    });
  }, [visible, leftSlide, rightSlide, vsScale, flashAnim, shakeAnim]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.container,
          {
            transform: [{ translateX: shakeAnim }],
          },
        ]}
      >
        {/* Background Flash on Clash */}
        <Animated.View
          style={[
            styles.clashFlash,
            {
              opacity: flashAnim,
            },
          ]}
        />

        {/* Top Banner Tag */}
        <View style={styles.headerTag}>
          <Text style={styles.headerTagText}>⚡ RAKİP BULUNDU · DÜELLO ÇARPIŞMASI ⚡</Text>
        </View>

        <View style={styles.versusArena}>
          {/* Left Player (Me) */}
          <Animated.View
            style={[
              styles.playerSide,
              {
                transform: [{ translateX: leftSlide }],
              },
            ]}
          >
            <LinearGradient
              colors={["#0EA5E9", "#0284C7"]}
              style={styles.avatarGlow}
            >
              {playerAvatarPhoto ? (
                <Image source={{ uri: playerAvatarPhoto }} style={styles.avatarPhoto} resizeMode="cover" />
              ) : (
                <Text style={styles.avatarText}>{playerGlyph}</Text>
              )}
            </LinearGradient>
            <Text style={styles.playerName} numberOfLines={1}>
              {playerName}
            </Text>
            <View style={styles.tierPillLeft}>
              <Text style={styles.tierText}>{playerTier}</Text>
            </View>
          </Animated.View>

          {/* Center "VS" Clash Badge */}
          <Animated.View
            style={[
              styles.vsBadgeWrap,
              {
                transform: [{ scale: vsScale }],
              },
            ]}
          >
            <LinearGradient
              colors={["#EF4444", "#F59E0B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.vsBadge}
            >
              <Text style={styles.vsText}>VS</Text>
            </LinearGradient>
          </Animated.View>

          {/* Right Player (Opponent / Bot) */}
          <Animated.View
            style={[
              styles.playerSide,
              styles.opponentSide,
              {
                transform: [{ translateX: rightSlide }],
              },
            ]}
          >
            <LinearGradient
              colors={isBot ? ["#A855F7", "#7C3AED"] : ["#EC4899", "#BE185D"]}
              style={styles.avatarGlow}
            >
              {opponentAvatarPhoto ? (
                <Image source={{ uri: opponentAvatarPhoto }} style={styles.avatarPhoto} resizeMode="cover" />
              ) : (
                <Text style={styles.avatarText}>{opponentGlyph}</Text>
              )}
            </LinearGradient>
            <Text style={styles.opponentName} numberOfLines={1}>
              {opponentName}
            </Text>
            <View style={styles.tierPillRight}>
              <Text style={styles.tierText}>{opponentTier}</Text>
            </View>
          </Animated.View>
        </View>

        <Text style={styles.hintText}>Hazır ol, harfler birazdan açılıyor!</Text>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(10, 15, 29, 0.92)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 998,
    paddingHorizontal: 16,
  },
  clashFlash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
  },
  headerTag: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    marginBottom: 36,
  },
  headerTagText: {
    color: "#F8FAFC",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  versusArena: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 360,
    height: 180,
    position: "relative",
  },
  playerSide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  opponentSide: {},
  avatarGlow: {
    width: 86,
    height: 86,
    borderRadius: 43,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#38BDF8",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.4)",
    overflow: "hidden",
  },
  avatarPhoto: {
    width: "100%",
    height: "100%",
    borderRadius: 43,
  },
  avatarText: {
    fontSize: 38,
    textAlign: "center",
    includeFontPadding: false,
  },
  playerName: {
    marginTop: 10,
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.4,
    maxWidth: 110,
    textAlign: "center",
  },
  opponentName: {
    marginTop: 10,
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.4,
    maxWidth: 110,
    textAlign: "center",
  },
  tierPillLeft: {
    marginTop: 4,
    backgroundColor: "rgba(14, 165, 233, 0.25)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#0EA5E9",
  },
  tierPillRight: {
    marginTop: 4,
    backgroundColor: "rgba(236, 72, 153, 0.25)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EC4899",
  },
  tierText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  vsBadgeWrap: {
    position: "absolute",
    left: "50%",
    top: "50%",
    marginLeft: -32,
    marginTop: -42,
    zIndex: 10,
  },
  vsBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 14,
  },
  vsText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: 1,
  },
  hintText: {
    marginTop: 36,
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
