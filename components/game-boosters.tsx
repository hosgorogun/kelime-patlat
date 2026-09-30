import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  BOOSTER_CONFIG,
  type BoosterType,
  type PlayerProgress,
  useBooster,
} from "../shared/progression";
import { haptics } from "../lib/haptics";
import { gameSfx } from "../lib/game-sfx";

export interface GameBoostersProps {
  progress: PlayerProgress;
  setProgress?: React.Dispatch<React.SetStateAction<PlayerProgress>>;
  syncProgressToCloud?: (progress: PlayerProgress) => Promise<void>;
  onUseHint?: () => void;
  onUseFreeze?: () => void;
  onUseShuffle?: () => void;
  disabled?: boolean;
  onShowToast?: (title: string, subtitle: string, icon?: string, accentColor?: string) => void;
}

export function GameBoosters({
  progress,
  setProgress,
  syncProgressToCloud,
  onUseHint,
  onUseFreeze,
  onUseShuffle,
  disabled = false,
  onShowToast,
}: GameBoostersProps) {
  const [activeBooster, setActiveBooster] = useState<BoosterType | null>(null);
  const isProcessingRef = useRef(false);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  const handleBoosterPress = (type: BoosterType) => {
    if (disabled || isProcessingRef.current) return;
    isProcessingRef.current = true;
    setTimeout(() => {
      isProcessingRef.current = false;
    }, 400);

    if (setProgress) {
      const res = useBooster(progressRef.current, type);
      if (!res.success) {
        haptics.error();
        gameSfx.rejected();
        onShowToast?.("YETERSİZ ÇİP 🪙", res.message, "🪙", "#EF4444");
        return;
      }

      setProgress(res.updatedProgress);
      void syncProgressToCloud?.(res.updatedProgress);
    }

    haptics.select();
    gameSfx.powerup();
    setActiveBooster(type);
    setTimeout(() => setActiveBooster(null), 1200);

    if (type === "hint") onUseHint?.();
    else if (type === "freeze") onUseFreeze?.();
    else if (type === "shuffle") onUseShuffle?.();

    onShowToast?.("GÜÇLENDİRİCİ AKTİF! ⚡", BOOSTER_CONFIG[type].name, BOOSTER_CONFIG[type].icon, "#38BDF8");
  };

  const boostersList: BoosterType[] = ["hint", "freeze", "shuffle"];

  return (
    <View style={styles.container}>
      {boostersList.map((type) => {
        const config = BOOSTER_CONFIG[type];
        const count = progress.boosters?.[type] ?? 0;
        const isActive = activeBooster === type;

        return (
          <Pressable
            key={type}
            onPress={() => handleBoosterPress(type)}
            disabled={disabled}
            style={({ pressed }) => [
              styles.boosterBtn,
              isActive && styles.boosterBtnActive,
              pressed && { transform: [{ scale: 0.94 }], opacity: 0.8 },
              disabled && { opacity: 0.5 },
            ]}
          >
            <Text style={styles.boosterIcon}>{config.icon}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {count > 0 ? `x${count}` : `🪙${config.cost}`}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export interface FloatingComboProps {
  comboCount: number;
}

export function FloatingCombo({ comboCount }: FloatingComboProps) {
  const [visible, setVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (comboCount <= 1) {
      setVisible(false);
      return;
    }

    setVisible(true);
    fadeAnim.setValue(0);
    slideAnim.setValue(15);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }).start(() => setVisible(false));
      }, 900);
    });
  }, [comboCount, fadeAnim, slideAnim]);

  if (!visible || comboCount <= 1) return null;

  const comboLabel =
    comboCount >= 4
      ? "EFSANEVİ KOMBO! x3.0 🔥"
      : comboCount === 3
      ? "HARİKA! x2.0 ⚡"
      : "KOMBO! x1.5 ✨";

  const comboColor =
    comboCount >= 4 ? "#F59E0B" : comboCount === 3 ? "#A855F7" : "#38BDF8";

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.comboContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={[styles.comboText, { color: comboColor }]}>{comboLabel}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginVertical: 6,
  },
  boosterBtn: {
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderWidth: 1.5,
    borderColor: "rgba(56, 189, 248, 0.4)",
    borderRadius: 16,
    width: 58,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    shadowColor: "#38bdf8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  boosterBtnActive: {
    borderColor: "#22c55e",
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    transform: [{ scale: 1.08 }],
  },
  boosterIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  badge: {
    position: "absolute",
    bottom: -6,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#38bdf8",
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#f8fafc",
  },
  comboContainer: {
    position: "absolute",
    top: 50,
    alignSelf: "center",
    zIndex: 99,
    backgroundColor: "rgba(13, 27, 42, 0.9)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#00f0ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  comboText: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
    textAlign: "center",
  },
});
