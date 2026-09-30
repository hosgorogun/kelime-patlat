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
import {
  canSpinLuckyWheel,
  claimLuckyWheelReward,
  LUCKY_WHEEL_SECTORS,
  type LuckyWheelSector,
  type PlayerProgress,
} from "../shared/progression";
import { haptics } from "../lib/haptics";
import { gameSfx } from "../lib/game-sfx";

export interface LuckyWheelModalProps {
  visible: boolean;
  onClose: () => void;
  progress: PlayerProgress;
  setProgress: React.Dispatch<React.SetStateAction<PlayerProgress>>;
  syncProgressToCloud: (progress: PlayerProgress) => Promise<void>;
  watchAd?: (onReward: () => void) => void;
  onShowToast: (title: string, subtitle: string, icon?: string, accentColor?: string) => void;
}

export function LuckyWheelModal({
  visible,
  onClose,
  progress,
  setProgress,
  syncProgressToCloud,
  watchAd,
  onShowToast,
}: LuckyWheelModalProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [wonPrize, setWonPrize] = useState<LuckyWheelSector | null>(null);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const currentAngleRef = useRef(0);
  const [ticker, setTicker] = useState(0);

  const progressRef = useRef(progress);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = setInterval(() => setTicker((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [visible]);

  const { canSpin, remainingSeconds } = canSpinLuckyWheel(progress);

  const formatCountdown = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleSpin = (isAdSpin = false) => {
    if (isSpinning) return;
    setIsSpinning(true);
    setWonPrize(null);
    haptics.select();
    gameSfx.tap();

    // 8 sektörden rastgele biri seçilir
    const sectorCount = LUCKY_WHEEL_SECTORS.length;
    const targetSectorIndex = Math.floor(Math.random() * sectorCount);
    const sectorAngle = 360 / sectorCount;

    // Minimum 5 tam tur (1800 derece) + hedefe denk gelen açı
    const extraRounds = 5 * 360;
    const targetAngle = extraRounds + (sectorCount - targetSectorIndex) * sectorAngle - sectorAngle / 2;
    const finalAngle = currentAngleRef.current + targetAngle;

    Animated.timing(spinAnim, {
      toValue: finalAngle,
      duration: 4200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      currentAngleRef.current = finalAngle % 360;
      if (isMountedRef.current) {
        setIsSpinning(false);
      }

      const { reward, updatedProgress, message } = claimLuckyWheelReward(
        progressRef.current,
        targetSectorIndex,
        isAdSpin
      );

      setProgress(updatedProgress);
      void syncProgressToCloud(updatedProgress);

      if (isMountedRef.current) {
        setWonPrize(reward);
      }
      haptics.success();
      gameSfx.victory();

      onShowToast("ŞANS ÇARKI ÖDÜLÜ! 🎡", message, reward.icon, reward.color);
    });
  };

  const handleWatchAdSpin = () => {
    if (isSpinning || isAdLoading) return;
    if (watchAd) {
      setIsAdLoading(true);
      watchAd(() => {
        if (isMountedRef.current) {
          setIsAdLoading(false);
        }
        handleSpin(true);
      });
    } else {
      handleSpin(true);
    }
  };

  const spinInterpolation = spinAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.kicker}>GÜNLÜK ŞANS ÇARKI</Text>
              <Text style={styles.title}>Siber Çarkıfelek 🎡</Text>
            </View>
            <Pressable
              onPress={onClose}
              disabled={isSpinning}
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <Text style={styles.subtitle}>
            Her gün ücretsiz çevir, süreli sonsuz can, çip ve güçlü taktiksel jokerler kazan!
          </Text>

          {/* Çark ve İbre Alanı */}
          <View style={styles.wheelWrapper}>
            {/* Üst İbre */}
            <View style={styles.pointerContainer}>
              <View style={styles.pointer} />
            </View>

            {/* Dönen Çark */}
            <Animated.View
              style={[
                styles.wheel,
                {
                  transform: [{ rotate: spinInterpolation }],
                },
              ]}
            >
              {LUCKY_WHEEL_SECTORS.map((sector, idx) => {
                const angle = (idx * 360) / LUCKY_WHEEL_SECTORS.length;
                return (
                  <View
                    key={sector.id}
                    style={[
                      styles.sectorItem,
                      {
                        transform: [
                          { rotate: `${angle}deg` },
                          { translateY: -85 },
                        ],
                      },
                    ]}
                  >
                    <Text style={styles.sectorIcon}>{sector.icon}</Text>
                    <Text style={[styles.sectorLabel, { color: sector.color }]}>
                      {sector.label}
                    </Text>
                  </View>
                );
              })}

              {/* Çark Göbeği */}
              <View style={styles.wheelCenterHub}>
                <Text style={{ fontSize: 20 }}>⚡</Text>
              </View>
            </Animated.View>
          </View>

          {/* Kazanılan Ödül Bildirimi */}
          {wonPrize && (
            <View style={styles.wonContainer}>
              <Text style={styles.wonTitle}>Tebrikler! 🎉</Text>
              <Text style={styles.wonSubtitle}>
                {wonPrize.icon} {wonPrize.label} hesabına tanımlandı!
              </Text>
            </View>
          )}

          {/* Aksiyon Butonları */}
          <View style={styles.actions}>
            {canSpin ? (
              <Pressable
                onPress={() => handleSpin(false)}
                disabled={isSpinning}
                style={({ pressed }) => [
                  styles.spinBtn,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                  isSpinning && { opacity: 0.6 },
                ]}
              >
                <Text style={styles.spinBtnText}>
                  {isSpinning ? "ÇEVRİLİYOR..." : "ÜCRETSİZ ÇEVİR ⚡"}
                </Text>
              </Pressable>
            ) : (
              <View style={styles.cooldownContainer}>
                <View style={styles.cooldownBox}>
                  <Text style={styles.cooldownLabel}>Sonraki Ücretsiz Çevirme:</Text>
                  <Text style={styles.cooldownTimer}>{formatCountdown(remainingSeconds)}</Text>
                </View>

                <Pressable
                  onPress={handleWatchAdSpin}
                  disabled={isSpinning}
                  style={({ pressed }) => [
                    styles.adSpinBtn,
                    pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                    isSpinning && { opacity: 0.6 },
                  ]}
                >
                  <Text style={styles.adSpinBtnText}>REKLAM İLE EKSTRA ÇEVİR 📺</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(3, 7, 18, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#0d1b2a",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "#1e3a5f",
    shadowColor: "#38bdf8",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  kicker: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: "#38bdf8",
    marginBottom: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    fontSize: 15,
    color: "#94a3b8",
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 8,
    marginBottom: 16,
    lineHeight: 18,
  },
  wheelWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 12,
    height: 250,
  },
  pointerContainer: {
    position: "absolute",
    top: 0,
    zIndex: 10,
    alignItems: "center",
  },
  pointer: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 18,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#ef4444",
  },
  wheel: {
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "#132338",
    borderWidth: 6,
    borderColor: "#224168",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#00f0ff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  sectorItem: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: 60,
  },
  sectorIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  sectorLabel: {
    fontSize: 9,
    fontWeight: "900",
    textAlign: "center",
  },
  wheelCenterHub: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#1e3a5f",
    borderWidth: 3,
    borderColor: "#38bdf8",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#38bdf8",
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  wonContainer: {
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#38bdf8",
  },
  wonTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#38bdf8",
  },
  wonSubtitle: {
    fontSize: 12,
    color: "#e2e8f0",
    marginTop: 2,
    fontWeight: "600",
  },
  actions: {
    marginTop: 6,
  },
  spinBtn: {
    backgroundColor: "#22c55e",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  spinBtnText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  cooldownContainer: {
    gap: 8,
  },
  cooldownBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  cooldownLabel: {
    fontSize: 12,
    color: "#94a3b8",
  },
  cooldownTimer: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#f59e0b",
    fontVariant: ["tabular-nums"],
  },
  adSpinBtn: {
    backgroundColor: "#6366f1",
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  adSpinBtnText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
});
