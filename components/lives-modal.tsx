import React, { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { getCalculatedLives, MAX_LIVES, COST_PER_LIFE, COST_REFILL_ALL, type PlayerProgress } from "../shared/progression";
import { haptics } from "../lib/haptics";
import { gameSfx } from "../lib/game-sfx";

export type LivesModalProps = {
  visible: boolean;
  progress: PlayerProgress;
  onClose: () => void;
  onBuyOne: () => void;
  onRefillAll: () => void;
  onWatchAd: () => void;
  loading?: boolean;
};

export function LivesModal({
  visible,
  progress,
  onClose,
  onBuyOne,
  onRefillAll,
  onWatchAd,
  loading = false,
}: LivesModalProps) {
  const [calc, setCalc] = useState(() => getCalculatedLives(progress));

  useEffect(() => {
    if (!visible) return;
    setCalc(getCalculatedLives(progress));
    const interval = setInterval(() => {
      setCalc(getCalculatedLives(progress));
    }, 1000);
    return () => clearInterval(interval);
  }, [visible, progress]);

  if (!visible) return null;

  const currentCoins = progress.coins ?? 0;
  const isFull = calc.lives >= MAX_LIVES;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconCircleText}>💚</Text>
            </View>

            <Text style={styles.title}>CAN MERKEZİ</Text>
            <Text style={styles.subTitle}>
              {isFull
                ? "Canlarınız tam kapasite dolu!"
                : `Canlarınız yenileniyor (${calc.lives}/${MAX_LIVES})`}
            </Text>
          </View>

          {/* Hearts Display */}
          <View style={styles.heartsRow}>
            {Array.from({ length: MAX_LIVES }).map((_, index) => {
              const active = index < calc.lives;
              return (
                <View key={index} style={[styles.heartBadge, active && styles.heartBadgeActive]}>
                  <Text style={styles.heartText}>{active ? "💚" : "🖤"}</Text>
                </View>
              );
            })}
          </View>

          {/* Timer Display */}
          {!isFull && calc.nextLifeTimerSeconds > 0 && (
            <View style={styles.timerBadge}>
              <Text style={styles.timerIcon}>⏱️</Text>
              <Text style={styles.timerText}>
                Sonraki Can: <Text style={styles.timerValue}>{formatTimer(calc.nextLifeTimerSeconds)}</Text>
              </Text>
            </View>
          )}

          {/* Balance info */}
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>KASANIZ:</Text>
            <Text style={styles.balanceValue}>🪙 {currentCoins} Çip</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {/* 1. Watch Ad (+1 Can) */}
            <Pressable
              onPress={() => {
                haptics.light();
                onWatchAd();
              }}
              disabled={isFull}
              style={({ pressed }) => [
                styles.btn,
                styles.btnAd,
                isFull && styles.btnDisabled,
                pressed && !isFull && styles.pressed,
              ]}
            >
              <Text style={styles.btnIcon}>📺</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.btnTitle}>SPONSORLU REKLAM İZLE</Text>
                <Text style={styles.btnSub}>+1 Can Kazan (ÜCRETSİZ)</Text>
              </View>
            </Pressable>

            {/* 2. Buy 1 Life (25 Coins) */}
            <Pressable
              onPress={() => {
                if (currentCoins < COST_PER_LIFE) {
                  haptics.error();
                } else {
                  haptics.success();
                  gameSfx.victory();
                }
                onBuyOne();
              }}
              disabled={isFull}
              style={({ pressed }) => [
                styles.btn,
                styles.btnOne,
                (isFull || currentCoins < COST_PER_LIFE) && styles.btnDisabled,
                pressed && !isFull && styles.pressed,
              ]}
            >
              <Text style={styles.btnIcon}>💚</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.btnTitle}>1 CAN SATIN AL</Text>
                <Text style={styles.btnSub}>+1 Can Yükle</Text>
              </View>
              <View style={styles.priceTag}>
                <Text style={styles.priceText}>🪙 {COST_PER_LIFE}</Text>
              </View>
            </Pressable>

            {/* 3. Refill All (125 Coins) */}
            <Pressable
              onPress={() => {
                if (currentCoins < COST_REFILL_ALL) {
                  haptics.error();
                } else {
                  haptics.success();
                  gameSfx.victory();
                }
                onRefillAll();
              }}
              disabled={isFull}
              style={({ pressed }) => [
                styles.btn,
                styles.btnRefill,
                (isFull || currentCoins < COST_REFILL_ALL) && styles.btnDisabled,
                pressed && !isFull && styles.pressed,
              ]}
            >
              <Text style={styles.btnIcon}>👑</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.btnTitle}>TÜM CANLARI DOLDUR</Text>
                <Text style={styles.btnSub}>Tam Kapasite 5/5 Can</Text>
              </View>
              <View style={styles.priceTagGold}>
                <Text style={styles.priceTextGold}>🪙 {COST_REFILL_ALL}</Text>
              </View>
            </Pressable>
          </View>

          {/* Close button */}
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>KAPAT</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(4, 17, 12, 0.88)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#0E2C22",
    borderWidth: 2.5,
    borderColor: "#D4B45A",
    borderRadius: 28,
    padding: 20,
    alignItems: "center",
    shadowColor: "#F4D06F",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: 14,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 2,
    borderColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  iconCircleText: {
    fontSize: 28,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  subTitle: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
  },
  heartsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  heartBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(8, 28, 22, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heartBadgeActive: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderColor: "#10B981",
  },
  heartText: {
    fontSize: 20,
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(167, 139, 250, 0.12)",
    borderWidth: 1,
    borderColor: "#E8C36A",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 14,
  },
  timerIcon: {
    fontSize: 14,
  },
  timerText: {
    color: "#E2E8F0",
    fontSize: 11,
    fontWeight: "700",
  },
  timerValue: {
    color: "#E8C36A",
    fontWeight: "900",
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  balanceLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  balanceValue: {
    color: "#FFC24A",
    fontSize: 14,
    fontWeight: "900",
  },
  actions: {
    alignSelf: "stretch",
    gap: 10,
    marginBottom: 16,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnAd: {
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderColor: "#38BDF8",
  },
  btnOne: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderColor: "#10B981",
  },
  btnRefill: {
    backgroundColor: "rgba(255, 194, 74, 0.15)",
    borderColor: "#FFC24A",
  },
  btnIcon: {
    fontSize: 22,
  },
  btnTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  btnSub: {
    color: "#94A3B8",
    fontSize: 10,
    marginTop: 2,
    fontWeight: "600",
  },
  priceTag: {
    backgroundColor: "rgba(16, 185, 129, 0.25)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#10B981",
  },
  priceText: {
    color: "#6EE7B7",
    fontSize: 12,
    fontWeight: "900",
  },
  priceTagGold: {
    backgroundColor: "rgba(255, 194, 74, 0.25)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FFC24A",
  },
  priceTextGold: {
    color: "#FFC24A",
    fontSize: 12,
    fontWeight: "900",
  },
  closeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  closeBtnText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  pressed: {
    opacity: 0.8,
  },
});
