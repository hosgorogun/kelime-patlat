import React, { useEffect, useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { getCalculatedLives, MAX_LIVES, COST_PER_LIFE, COST_REFILL_ALL, type PlayerProgress } from "@/shared/progression";
import { ICONS } from "@/components/game/game-ui";
import { haptics } from "@/lib/haptics";
import { gameSfx } from "@/lib/game-sfx";

export type LivesModalProps = {
  visible: boolean;
  progress: PlayerProgress;
  onClose: () => void;
  onBuyOne: () => void;
  onRefillAll: () => void;
  onWatchAd: () => void;
  onGoToPvP?: () => void;
  loading?: boolean;
};

export function LivesModal({
  visible,
  progress,
  onClose,
  onBuyOne,
  onRefillAll,
  onWatchAd,
  onGoToPvP,
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
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            style={{ width: "100%" }}
          >
            {/* Header */}
            <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Image source={ICONS.heart} style={{ width: 38, height: 38 }} resizeMode="contain" />
            </View>

            <Text style={styles.title}>CAN MERKEZİ</Text>
            <Text style={styles.subTitle}>
              {calc.isInfinite
                ? `⚡ Sonsuz Can Aktif! Kalan: ${formatTimer(calc.infiniteRemainingSeconds || 0)}`
                : calc.lives > MAX_LIVES
                ? `🔥 Ekstra Can Kapasitesi Aktif! (${calc.lives}/${MAX_LIVES})`
                : isFull
                ? "Canların tam kapasite dolu!"
                : `Canların yenileniyor (${calc.lives}/${MAX_LIVES})`}
            </Text>
          </View>

          {/* Hearts Display */}
          <View style={styles.heartsRow}>
            {Array.from({ length: Math.min(8, Math.max(MAX_LIVES, calc.lives)) }).map((_, index) => {
              const active = calc.isInfinite || index < calc.lives;
              const isOvercap = index >= MAX_LIVES;
              return (
                <View
                  key={index}
                  style={[
                    styles.heartBadge,
                    active && styles.heartBadgeActive,
                    isOvercap && { borderColor: "#F59E0B", backgroundColor: "#FEF3C7" },
                  ]}
                >
                  {active ? (
                    <Image source={ICONS.heart} style={{ width: 24, height: 24 }} resizeMode="contain" />
                  ) : (
                    <Image source={ICONS.heart} style={{ width: 24, height: 24, opacity: 0.18, tintColor: "#94A3B8" }} resizeMode="contain" />
                  )}
                </View>
              );
            })}
          </View>

          {/* Timer Display / Infinite Lives / Overcap Lives */}
          {calc.isInfinite ? (
            <View style={[styles.timerBadge, { backgroundColor: "#FEF3C7", borderColor: "#F59E0B" }]}>
              <Text style={styles.timerIcon}>⚡</Text>
              <Text style={[styles.timerText, { color: "#92400E" }]}>
                Sonsuz Can Süresi: <Text style={[styles.timerValue, { color: "#B45309" }]}>{formatTimer(calc.infiniteRemainingSeconds || 0)}</Text>
              </Text>
            </View>
          ) : calc.lives > MAX_LIVES ? (
            <View style={[styles.timerBadge, { backgroundColor: "#ECFDF5", borderColor: "#10B981" }]}>
              <Text style={styles.timerIcon}>💖</Text>
              <Text style={[styles.timerText, { color: "#065F46" }]}>
                Ekstra Can: <Text style={[styles.timerValue, { color: "#047857" }]}>{calc.lives}/{MAX_LIVES} Canın Var!</Text>
              </Text>
            </View>
          ) : !isFull && calc.nextLifeTimerSeconds > 0 ? (
            <View style={styles.timerBadge}>
              <Text style={styles.timerIcon}>⏱️</Text>
              <Text style={styles.timerText}>
                Sonraki Can: <Text style={styles.timerValue}>{formatTimer(calc.nextLifeTimerSeconds)}</Text>
              </Text>
            </View>
          ) : null}

          {/* Balance info badge */}
          <View style={styles.balancePill}>
            <Text style={styles.balanceLabel}>KASANDAKİ BAKİYE:</Text>
            <View style={styles.balanceChipWrap}>
              <Text style={styles.balanceChipIcon}>🪙</Text>
              <Text style={styles.balanceValue}>{currentCoins} Çip</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {/* 1. Watch Ad (+1 Can) */}
            <Pressable
              onPress={() => {
                haptics.light();
                try {
                  Promise.resolve(onWatchAd()).catch(console.error);
                } catch (e) {
                  console.error(e);
                }
              }}
              disabled={loading || isFull || calc.isInfinite}
              style={({ pressed }) => [
                styles.btn,
                styles.btnAd,
                (loading || isFull || calc.isInfinite) && styles.btnDisabled,
                pressed && !loading && !(isFull || calc.isInfinite) && styles.pressed,
              ]}
            >
              <View style={[styles.btnIconWrap, { backgroundColor: "#E0F2FE", borderColor: "#BAE6FD" }]}>
                <Text style={styles.btnIcon}>📺</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.btnTitle}>{loading ? "İŞLENİYOR..." : "SPONSORLU REKLAM İZLE"}</Text>
                <Text style={styles.btnSub}>+1 Can Kazan (ÜCRETSİZ)</Text>
              </View>
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>BEDAVA</Text>
              </View>
            </Pressable>

            {/* 2. Buy 1 Life (COST_PER_LIFE = 50 Çip) */}
            <Pressable
              onPress={() => {
                if (currentCoins < COST_PER_LIFE) {
                  haptics.error();
                  return;
                }
                haptics.success();
                gameSfx.victory();
                onBuyOne();
              }}
              disabled={loading || isFull || calc.isInfinite || currentCoins < COST_PER_LIFE}
              style={({ pressed }) => [
                styles.btn,
                styles.btnOne,
                (loading || isFull || calc.isInfinite || currentCoins < COST_PER_LIFE) && styles.btnDisabled,
                pressed && !loading && !(isFull || calc.isInfinite || currentCoins < COST_PER_LIFE) && styles.pressed,
              ]}
            >
              <View style={[styles.btnIconWrap, { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" }]}>
                <Text style={styles.btnIcon}>💚</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.btnTitle}>{loading ? "İŞLENİYOR..." : "1 CAN SATIN AL"}</Text>
                <Text style={styles.btnSub}>+1 Can Yükle</Text>
              </View>
              <View style={styles.priceTag}>
                <Text style={styles.priceText}>🪙 {COST_PER_LIFE}</Text>
              </View>
            </Pressable>

            {/* 3. Refill All (COST_REFILL_ALL = 180 Çip) */}
            <Pressable
              onPress={() => {
                if (currentCoins < COST_REFILL_ALL) {
                  haptics.error();
                  return;
                }
                haptics.success();
                gameSfx.victory();
                onRefillAll();
              }}
              disabled={loading || isFull || calc.isInfinite || currentCoins < COST_REFILL_ALL}
              style={({ pressed }) => [
                styles.btn,
                styles.btnRefill,
                (loading || isFull || calc.isInfinite || currentCoins < COST_REFILL_ALL) && styles.btnDisabled,
                pressed && !loading && !(isFull || calc.isInfinite || currentCoins < COST_REFILL_ALL) && styles.pressed,
              ]}
            >
              <View style={[styles.btnIconWrap, { backgroundColor: "#FFF1F2", borderColor: "#FECDD3" }]}>
                <Image source={ICONS.heart} style={{ width: 22, height: 22 }} resizeMode="contain" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={styles.btnTitle}>{loading ? "İŞLENİYOR..." : "TÜM CANLARI DOLDUR"}</Text>
                <Text numberOfLines={1} style={styles.btnSub}>Tam Kapasite 5/5 Can Yenile</Text>
              </View>
              <View style={styles.priceTagGold}>
                <Text style={styles.priceTextGold}>🪙 {COST_REFILL_ALL}</Text>
              </View>
            </Pressable>
          </View>

          {/* Canı 0 Olan Oyuncu İçin Ücretsiz Düello Yönlendirmesi */}
          {calc.lives <= 0 && !calc.isInfinite && onGoToPvP && (
            <Pressable
              onPress={() => {
                haptics.select();
                onClose();
                onGoToPvP();
              }}
              style={({ pressed }) => [styles.pvpRetentionBtn, pressed && styles.pressed]}
            >
              <Text style={styles.pvpRetentionIcon}>⚔️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.pvpRetentionTitle}>CAN BEKLEME, DÜELLOYA KATIL!</Text>
                <Text style={styles.pvpRetentionSub}>Canlı düellolar can harcamaz, lig puanı kazandırır.</Text>
              </View>
              <Text style={styles.pvpRetentionArrow}>➔</Text>
            </Pressable>
          )}

            {/* Close button */}
            <Pressable onPress={onClose} style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}>
              <Text style={styles.closeBtnText}>KAPAT</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "90%",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderRadius: 32,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 18,
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  scrollContent: {
    alignItems: "center",
    width: "100%",
    paddingBottom: 6,
  },
  header: {
    alignItems: "center",
    marginBottom: 16,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: "#FFF1F2",
    borderWidth: 2,
    borderColor: "#FECDD3",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#F43F5E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    color: "#0F172A",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  subTitle: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 4,
    fontWeight: "600",
    textAlign: "center",
  },
  heartsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  heartBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  heartBadgeActive: {
    backgroundColor: "#FFF1F2",
    borderColor: "#FDA4AF",
    borderBottomWidth: 3.5,
    shadowColor: "#F43F5E",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginBottom: 16,
  },
  timerIcon: {
    fontSize: 14,
  },
  timerText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "700",
  },
  timerValue: {
    color: "#2563EB",
    fontWeight: "900",
  },
  balancePill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: "100%",
    marginBottom: 18,
  },
  balanceLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  balanceChipWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  balanceChipIcon: {
    fontSize: 13,
  },
  balanceValue: {
    color: "#B45309",
    fontSize: 13,
    fontWeight: "900",
  },
  actions: {
    alignSelf: "stretch",
    gap: 12,
    marginBottom: 16,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 20,
    borderWidth: 1.5,
    borderBottomWidth: 4,
  },
  btnIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: {
    opacity: 0.42,
  },
  btnAd: {
    backgroundColor: "#F0F9FF",
    borderColor: "#BAE6FD",
    borderBottomColor: "#7DD3FC",
  },
  btnOne: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
    borderBottomColor: "#86EFAC",
  },
  btnRefill: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
    borderBottomColor: "#FCD34D",
  },
  btnIcon: {
    fontSize: 20,
  },
  btnTitle: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  btnSub: {
    color: "#64748B",
    fontSize: 10.5,
    marginTop: 2,
    fontWeight: "600",
  },
  freeBadge: {
    backgroundColor: "#0284C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  freeBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  bestValueBadge: {
    backgroundColor: "#F59E0B",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bestValueText: {
    color: "#FFFFFF",
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  priceTag: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#86EFAC",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  priceText: {
    color: "#059669",
    fontSize: 13,
    fontWeight: "900",
  },
  priceTagGold: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#FCD34D",
    shadowColor: "#D97706",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 1,
  },
  priceTextGold: {
    color: "#D97706",
    fontSize: 13,
    fontWeight: "900",
  },
  closeBtn: {
    width: "100%",
    height: 44,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  pvpRetentionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderWidth: 1.5,
    borderColor: "#86EFAC",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    width: "100%",
    gap: 10,
  },
  pvpRetentionIcon: {
    fontSize: 20,
  },
  pvpRetentionTitle: {
    color: "#166534",
    fontSize: 11.5,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  pvpRetentionSub: {
    color: "#15803D",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  pvpRetentionArrow: {
    color: "#166534",
    fontSize: 14,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
