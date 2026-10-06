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
} from "@/shared/progression";
import { haptics } from "@/lib/haptics";
import { gameSfx } from "@/lib/game-sfx";

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
  const [, forceUpdate] = useState(0);

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
    const timer = setInterval(() => forceUpdate((t) => t + 1), 1000);
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

    // Minimum 5 tam tur (1800 derece) + hedefe denk gelen açı (ibre tam sektör ortasına oturur)
    const extraRounds = 5 * 360;
    const startAngle = currentAngleRef.current;
    const targetMod = ((sectorCount - targetSectorIndex) % sectorCount) * sectorAngle;
    const currentMod = startAngle % 360;
    const forwardDiff = (targetMod - currentMod + 360) % 360;
    const finalAngle = startAngle + extraRounds + forwardDiff;

    Animated.timing(spinAnim, {
      toValue: finalAngle,
      duration: 4200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      const normalizedAngle = finalAngle % 360;
      spinAnim.setValue(normalizedAngle);
      currentAngleRef.current = normalizedAngle;
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
              <Text style={styles.title}>Şans Çarkıfeleği 🎡</Text>
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

          {/* Aksiyon ButonlarÄ± */}
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
    backgroundColor: "rgba(35, 48, 59, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FAF4EC",
    borderRadius: 24,
    padding: 20,
    borderWidth: 2,
    borderColor: "#DED6C7",
    shadowColor: "#293541",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  kicker: {
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 1,
    color: "#98732c",
    marginBottom: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#293541",
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F0F5ED",
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    fontSize: 15,
    color: "#293541",
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 12,
    color: "#54646B",
    marginTop: 6,
    marginBottom: 14,
    lineHeight: 17,
    fontWeight: "600",
  },
  wheelWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
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
    borderTopColor: "#DC2626",
  },
  wheel: {
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "#FFFFFF",
    borderWidth: 6,
    borderColor: "#E5CCA0",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#293541",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  sectorItem: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: 64,
  },
  sectorIcon: {
    fontSize: 19,
    marginBottom: 2,
  },
  sectorLabel: {
    fontSize: 9.5,
    fontWeight: "900",
    textAlign: "center",
  },
  wheelCenterHub: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FFE5A3",
    borderWidth: 3,
    borderColor: "#D49B25",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#293541",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  wonContainer: {
    backgroundColor: "#FEF3C7",
    borderRadius: 14,
    padding: 10,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#F59E0B",
  },
  wonTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#92400E",
  },
  wonSubtitle: {
    fontSize: 12,
    color: "#78350F",
    marginTop: 2,
    fontWeight: "700",
  },
  actions: {
    marginTop: 6,
  },
  spinBtn: {
    backgroundColor: "#FFD66E",
    borderWidth: 1.5,
    borderBottomWidth: 3.5,
    borderColor: "#D49B25",
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#293541",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  spinBtnText: {
    fontSize: 14.5,
    fontWeight: "900",
    color: "#293541",
    letterSpacing: 0.5,
  },
  cooldownContainer: {
    gap: 8,
  },
  cooldownBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F0F5ED",
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  cooldownLabel: {
    fontSize: 11.5,
    color: "#54646B",
    fontWeight: "700",
  },
  cooldownTimer: {
    fontSize: 13,
    fontWeight: "900",
    color: "#98732c",
    fontVariant: ["tabular-nums"],
  },
  adSpinBtn: {
    backgroundColor: "#DEF7EC",
    borderWidth: 1.5,
    borderBottomWidth: 3,
    borderColor: "#88DFB3",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#293541",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  adSpinBtnText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0E7A4A",
    letterSpacing: 0.4,
  },
});
