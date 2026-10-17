import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { triggerHapticSuccess, gameSfx } from "@/shared/audio-haptics";
import { CoinCascadeOverlay } from "@/components/game/coin-cascade";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export interface MysteryReward {
  type: string;
  label: string;
  icon: string;
  category: "consolation" | "common" | "rare" | "jackpot";
  detail?: string;
}

interface MysteryRewardModalProps {
  visible: boolean;
  reward: MysteryReward | null;
  onClose: () => void;
}

const BURST_PARTICLES = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2;
  const dist = 75 + (i % 3) * 20;
  return {
    id: i,
    dx: Math.cos(angle) * dist,
    dy: Math.sin(angle) * dist,
    emoji: ["✨", "⭐", "🎉", "💫", "🪙"][i % 5]!,
    size: 14 + (i % 3) * 4,
  };
});

export const MysteryRewardModal: React.FC<MysteryRewardModalProps> = ({
  visible,
  reward,
  onClose,
}) => {
  const [phase, setPhase] = useState<"opening" | "revealed">("opening");
  const [showCascade, setShowCascade] = useState(false);

  // Animations
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const chestScaleAnim = useRef(new Animated.Value(0.4)).current;
  const burstAnim = useRef(new Animated.Value(0)).current;
  const cardScaleAnim = useRef(new Animated.Value(0.3)).current;
  const cardOpacityAnim = useRef(new Animated.Value(0)).current;
  const sunburstAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible || !reward) {
      setPhase("opening");
      setShowCascade(false);
      return;
    }

    setPhase("opening");
    chestScaleAnim.setValue(0.5);
    shakeAnim.setValue(0);
    burstAnim.setValue(0);
    cardScaleAnim.setValue(0.3);
    cardOpacityAnim.setValue(0);

    // Sunburst rotation loop
    const sunburstLoop = Animated.loop(
      Animated.timing(sunburstAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    sunburstLoop.start();

    // 1. Sandığın girişi & Heyecanlı Sallanma Sekansı (Chest Entrance + Shake Sequence)
    Animated.sequence([
      Animated.spring(chestScaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: -12, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 12, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -15, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 15, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
      ]),
    ]).start(() => {
      // 2. Sandık patlayıp açılır! (Chest Reveal)
      setPhase("revealed");
      triggerHapticSuccess();
      try {
        gameSfx.victory();
      } catch {}

      setShowCascade(true);

      Animated.parallel([
        Animated.timing(burstAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.spring(cardScaleAnim, {
          toValue: 1,
          friction: 4.5,
          tension: 90,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacityAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    });

    return () => {
      sunburstLoop.stop();
    };
  }, [visible, reward, burstAnim, cardOpacityAnim, cardScaleAnim, chestScaleAnim, shakeAnim, sunburstAnim]);

  if (!visible || !reward) return null;

  const sunburstRotate = sunburstAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const getBadgeMeta = () => {
    switch (reward.category) {
      case "jackpot":
        return { label: "🏆 EFSANEVİ BÜYÜK İKRAMİYE", color: "#FFC24A", bg: "rgba(255, 194, 74, 0.15)" };
      case "rare":
        return { label: "⭐ NADİR ÖDÜL", color: "#38BDF8", bg: "rgba(56, 189, 248, 0.15)" };
      case "common":
        return { label: "✨ FAYDALI TAKVİYE", color: "#3EE8B5", bg: "rgba(62, 232, 181, 0.15)" };
      default:
        return { label: "🎁 TESELLİ ÖDÜLÜ", color: "#F59E0B", bg: "rgba(245, 158, 11, 0.15)" };
    }
  };

  const badgeMeta = getBadgeMeta();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={phase === "revealed" ? onClose : undefined}>
        {/* Sunburst background glow */}
        <Animated.View
          style={[
            styles.sunburstWrap,
            {
              transform: [{ rotate: sunburstRotate }],
              opacity: phase === "revealed" ? 0.35 : 0.15,
            },
          ]}
        >
          <Text style={styles.sunburstText}>☀️</Text>
        </Animated.View>

        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          {phase === "opening" ? (
            <View style={styles.openingContainer}>
              <Animated.View
                style={[
                  styles.chestWrap,
                  {
                    transform: [
                      { scale: chestScaleAnim },
                      { translateX: shakeAnim },
                    ],
                  },
                ]}
              >
                <Text style={styles.chestIcon}>🎁</Text>
              </Animated.View>
              <Text style={styles.openingTitle}>SANDIK AÇILIYOR...</Text>
              <Text style={styles.openingSubtitle}>Şans çarkı dönüyor, ödülün belirleniyor!</Text>
            </View>
          ) : (
            <Animated.View
              style={[
                styles.revealedContainer,
                {
                  transform: [{ scale: cardScaleAnim }],
                  opacity: cardOpacityAnim,
                },
              ]}
            >
              {/* Radial bursts */}
              {BURST_PARTICLES.map((p) => {
                const tx = burstAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, p.dx],
                });
                const ty = burstAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, p.dy],
                });
                const pOpacity = burstAnim.interpolate({
                  inputRange: [0, 0.7, 1],
                  outputRange: [0, 1, 0],
                });
                return (
                  <Animated.Text
                    key={p.id}
                    style={[
                      styles.burstParticle,
                      {
                        fontSize: p.size,
                        transform: [{ translateX: tx }, { translateY: ty }],
                        opacity: pOpacity,
                      },
                    ]}
                  >
                    {p.emoji}
                  </Animated.Text>
                );
              })}

              <View style={[styles.badge, { backgroundColor: badgeMeta.bg, borderColor: badgeMeta.color }]}>
                <Text style={[styles.badgeText, { color: badgeMeta.color }]}>{badgeMeta.label}</Text>
              </View>

              <View style={styles.rewardIconWrap}>
                <Text style={styles.rewardIcon}>{reward.icon}</Text>
              </View>

              <Text style={styles.rewardLabel}>{reward.label}</Text>

              {reward.detail && (
                <Text style={styles.rewardDetail}>{reward.detail}</Text>
              )}

              <Pressable
                onPress={() => {
                  triggerHapticSuccess();
                  setShowCascade(false);
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.collectButton,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Text style={styles.collectButtonText}>HARİKA! (TOPLA) 🎉</Text>
              </Pressable>
            </Animated.View>
          )}
        </Pressable>

        <CoinCascadeOverlay
          trigger={showCascade}
          count={reward.category === "jackpot" ? 22 : 12}
          icon={reward.icon || "✨"}
          badgeText={reward.label}
        />
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  sunburstWrap: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  sunburstText: {
    fontSize: SCREEN_WIDTH * 0.9,
    color: "#FFC24A",
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#1E293B",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.12)",
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  openingContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  chestWrap: {
    marginBottom: 20,
  },
  chestIcon: {
    fontSize: 72,
    textAlign: "center",
  },
  openingTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#F8FAFC",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  openingSubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    fontWeight: "500",
  },
  revealedContainer: {
    alignItems: "center",
    width: "100%",
  },
  burstParticle: {
    position: "absolute",
    top: 90,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  rewardIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  rewardIcon: {
    fontSize: 50,
  },
  rewardLabel: {
    fontSize: 22,
    fontWeight: "900",
    color: "#F8FAFC",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  rewardDetail: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 18,
  },
  collectButton: {
    width: "100%",
    backgroundColor: "#3EE8B5",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#3EE8B5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
  },
  collectButtonText: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
});
