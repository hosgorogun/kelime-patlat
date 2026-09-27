import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { type MilestoneReward } from "@/shared/progression";
import { gameSfx } from "@/lib/game-sfx";
import { triggerHapticSuccess, triggerHapticLongWord, triggerHapticSelection } from "@/shared/audio-haptics";

export function LootBoxRevealModal({
  reward,
  visible,
  onClose,
}: {
  reward: MilestoneReward | null;
  visible: boolean;
  onClose: () => void;
}) {
  // Animation States
  const [phase, setPhase] = useState<"idle" | "shaking" | "open" | "rewards">("idle");
  const scaleAnim = useRef(new Animated.Value(0.2)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const lidYAnim = useRef(new Animated.Value(0)).current;
  const lidOpacityAnim = useRef(new Animated.Value(1)).current;
  const glowSpinAnim = useRef(new Animated.Value(0)).current;

  // Reward Items Fly Animation
  const coinsAnim = useRef(new Animated.ValueXY({ x: 0, y: 50 })).current;
  const coinsOpacity = useRef(new Animated.Value(0)).current;
  const badgeAnim = useRef(new Animated.ValueXY({ x: 0, y: 50 })).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const xpAnim = useRef(new Animated.ValueXY({ x: 0, y: 50 })).current;
  const xpOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && reward) {
      setPhase("idle");
      scaleAnim.setValue(0.2);
      shakeAnim.setValue(0);
      lidYAnim.setValue(0);
      lidOpacityAnim.setValue(1);
      glowSpinAnim.setValue(0);

      coinsAnim.setValue({ x: 0, y: 50 });
      coinsOpacity.setValue(0);
      badgeAnim.setValue({ x: 0, y: 50 });
      badgeOpacity.setValue(0);
      xpAnim.setValue({ x: 0, y: 50 });
      xpOpacity.setValue(0);

      // Intro Pop
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }).start();

      // Continuous Glow Rotation
      Animated.loop(
        Animated.timing(glowSpinAnim, {
          toValue: 1,
          duration: 6000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [
    visible,
    reward,
    scaleAnim,
    shakeAnim,
    lidYAnim,
    lidOpacityAnim,
    glowSpinAnim,
    coinsAnim,
    coinsOpacity,
    badgeAnim,
    badgeOpacity,
    xpAnim,
    xpOpacity,
  ]);

  if (!visible || !reward) return null;

  const handleBoxTap = () => {
    if (phase !== "idle") return;
    setPhase("shaking");
    triggerHapticSelection();

    // 1. Shake Vibration Cycle
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 16, duration: 70, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -16, duration: 70, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start(() => {
      // 2. Open Lid Burst
      setPhase("open");
      triggerHapticLongWord();
      gameSfx.victory();

      Animated.parallel([
        Animated.timing(lidYAnim, { toValue: -140, duration: 400, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
        Animated.timing(lidOpacityAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start(() => {
        // 3. Fly Rewards Out
        setPhase("rewards");
        triggerHapticSuccess();

        Animated.stagger(150, [
          Animated.parallel([
            Animated.spring(coinsAnim, { toValue: { x: -70, y: -60 }, friction: 6, useNativeDriver: true }),
            Animated.timing(coinsOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.spring(badgeAnim, { toValue: { x: 0, y: -110 }, friction: 6, useNativeDriver: true }),
            Animated.timing(badgeOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.spring(xpAnim, { toValue: { x: 70, y: -60 }, friction: 6, useNativeDriver: true }),
            Animated.timing(xpOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
          ]),
        ]).start();
      });
    });
  };

  const spinInterpolate = glowSpinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Ambient Glowing Backdrop */}
        <Animated.View style={[styles.glowRays, { transform: [{ rotate: spinInterpolate }] }]} pointerEvents="none" />

        <Pressable onPress={handleBoxTap} style={styles.container}>
          {/* Top Instruction Header */}
          <View style={styles.headerBox}>
            <Text style={styles.kicker}>{reward.badge}</Text>
            <Text style={styles.title}>{reward.title}</Text>
            {phase === "idle" && <Text style={styles.tapPrompt}>✨ SANDIĞA DOKUN VE AÇ ✨</Text>}
          </View>

          {/* 3D Chest Model Stage */}
          <Animated.View
            style={[
              styles.chestStage,
              {
                transform: [
                  { scale: scaleAnim },
                  { translateX: shakeAnim },
                ],
              },
            ]}
          >
            {/* Lid */}
            <Animated.View
              style={[
                styles.chestLid,
                { borderColor: reward.accent },
                { transform: [{ translateY: lidYAnim }], opacity: lidOpacityAnim },
              ]}
            >
              <Text style={styles.chestLidIcon}>{reward.icon}</Text>
            </Animated.View>

            {/* Base Body */}
            <View style={[styles.chestBody, { borderColor: reward.accent }]}>
              <View style={[styles.chestCore, { backgroundColor: reward.accent }]} />
            </View>

            {/* Burst Flying Reward Particles */}
            {phase === "rewards" && (
              <View style={styles.rewardBurstArea} pointerEvents="none">
                {/* 1. Coin Reward */}
                <Animated.View
                  style={[
                    styles.rewardBubble,
                    { transform: [{ translateX: coinsAnim.x }, { translateY: coinsAnim.y }], opacity: coinsOpacity },
                  ]}
                >
                  <Text style={styles.rewardBubbleIcon}>🪙</Text>
                  <Text style={styles.rewardBubbleText}>+{reward.coins} ÇİP</Text>
                </Animated.View>

                {/* 2. Badge Reward */}
                <Animated.View
                  style={[
                    styles.rewardBubble,
                    styles.rewardBubbleBadge,
                    { borderColor: reward.accent },
                    { transform: [{ translateX: badgeAnim.x }, { translateY: badgeAnim.y }], opacity: badgeOpacity },
                  ]}
                >
                  <Text style={styles.rewardBubbleIcon}>{reward.badgeIcon}</Text>
                  <Text style={[styles.rewardBubbleText, { color: reward.accent }]}>{reward.badgeTitle}</Text>
                </Animated.View>

                {/* 3. XP Reward */}
                <Animated.View
                  style={[
                    styles.rewardBubble,
                    { transform: [{ translateX: xpAnim.x }, { translateY: xpAnim.y }], opacity: xpOpacity },
                  ]}
                >
                  <Text style={styles.rewardBubbleIcon}>⚡</Text>
                  <Text style={styles.rewardBubbleText}>+{reward.xp} XP</Text>
                </Animated.View>
              </View>
            )}
          </Animated.View>

          {/* Bottom Confirm Action */}
          {phase === "rewards" && (
            <Pressable
              onPress={() => {
                triggerHapticSelection();
                onClose();
              }}
              style={({ pressed }) => [
                styles.collectBtn,
                { backgroundColor: reward.accent },
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Text style={styles.collectBtnText}>ÖDÜLLERİ ÇANTAYA EKLE ➔</Text>
            </Pressable>
          )}
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(35,48,59,0.42)",
    justifyContent: "center",
    alignItems: "center",
  },
  glowRays: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: 200,
    borderWidth: 2,
    borderColor: "#DCE1D7",
    backgroundColor: "rgba(244, 208, 111, 0.05)",
  },
  container: {
    width: "100%",
    height: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  headerBox: {
    alignItems: "center",
    marginTop: 20,
  },
  kicker: {
    color: "#8b763f",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  title: {
    color: "#293541",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  tapPrompt: {
    marginTop: 12,
    color: "#2a9c7a",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
    backgroundColor: "rgba(62, 232, 181, 0.12)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DCE1D7",
  },

  chestStage: {
    width: 140,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
  },
  chestLid: {
    width: 100,
    height: 50,
    borderRadius: 14,
    borderWidth: 3,
    backgroundColor: "#F0F5ED",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    shadowColor: "#293541",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  chestLidIcon: {
    fontSize: 28,
  },
  chestBody: {
    width: 96,
    height: 60,
    borderRadius: 12,
    borderWidth: 3,
    backgroundColor: "#F0F5ED",
    marginTop: -8,
    justifyContent: "center",
    alignItems: "center",
  },
  chestCore: {
    width: 24,
    height: 24,
    borderRadius: 12,
    opacity: 0.8,
  },

  rewardBurstArea: {
    position: "absolute",
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  rewardBubble: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0F5ED",
    borderWidth: 2,
    borderColor: "#DCE1D7",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: "#293541",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  rewardBubbleBadge: {
    borderColor: "#DCE1D7",
  },
  rewardBubbleIcon: {
    fontSize: 16,
  },
  rewardBubbleText: {
    color: "#293541",
    fontSize: 11,
    fontWeight: "900",
  },

  collectBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 25,
    shadowColor: "#293541",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  collectBtnText: {
    color: "#293541",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
