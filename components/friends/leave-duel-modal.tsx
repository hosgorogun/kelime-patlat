import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { haptics } from "@/lib/haptics";
import { gameSfx } from "@/lib/game-sfx";
import { getSurrenderLpPenalty, getLeagueTier, type PlayerProgress } from "@/shared/progression";

interface LeaveDuelModalProps {
  visible: boolean;
  onStay: () => void;
  onLeave: () => void;
  progress?: PlayerProgress;
  isRanked?: boolean;
}

export const LeaveDuelModal: React.FC<LeaveDuelModalProps> = ({
  visible,
  onStay,
  onLeave,
  progress,
  isRanked = true,
}) => {
  const [isLeaving, setIsLeaving] = useState(false);

  if (!visible) return null;

  const currentLp = progress?.lp ?? 0;
  const tierInfo = getLeagueTier(currentLp);
  const penaltyLp = isRanked ? getSurrenderLpPenalty(progress || currentLp) : 0;
  const currentStreak = progress?.pvpWinStreak ?? 0;

  const handleConfirmLeave = () => {
    setIsLeaving(true);
    haptics.error();
    try {
      gameSfx.rejected();
    } catch {}

    // Kullanıcıya LP'nin düştüğünü görsel olarak göstermek için kısa dramatik animasyon sekansı
    setTimeout(() => {
      setIsLeaving(false);
      onLeave();
    }, 900);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={isLeaving ? undefined : onStay}
    >
      <Pressable style={styles.overlay} onPress={isLeaving ? undefined : onStay}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          {isLeaving ? (
            <View style={styles.leavingContainer}>
              <Text style={styles.leavingIcon}>📉</Text>
              <Text style={styles.leavingTitle}>MAÇ TERK EDİLDİ</Text>
              {isRanked ? (
                <View style={styles.penaltySplash}>
                  <Text style={styles.penaltySplashText}>-{penaltyLp} LP</Text>
                  <Text style={styles.penaltySplashSub}>Lig Puanı Düştü!</Text>
                </View>
              ) : (
                <Text style={styles.leavingSubtitle}>Oyun sonlandırılıyor...</Text>
              )}
            </View>
          ) : (
            <>
              <View style={styles.badgeWarn}>
                <Text style={styles.badgeWarnText}>⚠️ MAÇI TERK ETME UYARISI</Text>
              </View>

              <Text style={styles.iconText}>⚔️</Text>
              <Text style={styles.titleText}>DÜELLODAN AYRIL?</Text>
              <Text style={styles.descriptionText}>
                Canlı dereceli düello devam ediyor! Şimdi ayrılırsan maç anında hükmen mağlubiyet sayılır.
              </Text>

              {/* Kayıp Detay Kartı */}
              <View style={styles.penaltyBox}>
                <Text style={styles.penaltyBoxHeader}>AYRILIRSAN KAYBEDECEKLERİN:</Text>

                {isRanked && (
                  <View style={styles.penaltyRow}>
                    <Text style={styles.penaltyIcon}>📉</Text>
                    <View style={styles.penaltyTextWrap}>
                      <Text style={styles.penaltyLabel}>Lig Puanı (LP) Cezası</Text>
                      <Text style={styles.penaltyHint}>{tierInfo.name} terk etme bedeli</Text>
                    </View>
                    <Text style={styles.penaltyValue}>-{penaltyLp} LP</Text>
                  </View>
                )}

                <View style={styles.penaltyRow}>
                  <Text style={styles.penaltyIcon}>🔥</Text>
                  <View style={styles.penaltyTextWrap}>
                    <Text style={styles.penaltyLabel}>Galibiyet Serisi</Text>
                    <Text style={styles.penaltyHint}>
                      {currentStreak > 0 ? `Mevcut ${currentStreak}x galibiyet alevi söner` : "Seri sıfırlanır"}
                    </Text>
                  </View>
                  <Text style={[styles.penaltyValue, { color: "#F43F5E" }]}>SIFIRLANIR</Text>
                </View>

                <View style={styles.penaltyRow}>
                  <Text style={styles.penaltyIcon}>🚫</Text>
                  <View style={styles.penaltyTextWrap}>
                    <Text style={styles.penaltyLabel}>EXP & Çip Ödülü</Text>
                    <Text style={styles.penaltyHint}>Kaçış durumunda hiçbir ödül verilmez</Text>
                  </View>
                  <Text style={[styles.penaltyValue, { color: "#94A3B8" }]}>0 KAZANÇ</Text>
                </View>
              </View>

              <View style={styles.buttonList}>
                <Pressable
                  onPress={() => {
                    haptics.light();
                    onStay();
                  }}
                  style={({ pressed }) => [
                    styles.stayButton,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Text style={styles.stayButtonText}>⚔️ SAVAŞA DEVAM ET (KAL)</Text>
                </Pressable>

                <Pressable
                  onPress={handleConfirmLeave}
                  style={({ pressed }) => [
                    styles.leaveButton,
                    { opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <Text style={styles.leaveButtonText}>
                    {isRanked ? `🏃‍♂️ MAÇI TERK ET VE AYRIL (-${penaltyLp} LP)` : "🏃‍♂️ MAÇTAN AYRIL"}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(35,48,59,0.42)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "90%",
    maxWidth: 360,
    backgroundColor: "#F8FAFC",
    borderColor: "#DCE1D7",
    borderWidth: 2,
    borderRadius: 28,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  iconText: {
    fontSize: 36,
    textAlign: "center",
    marginBottom: 6,
  },
  titleText: {
    color: "#9d6f33",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
    textAlign: "center",
    marginBottom: 6,
  },
  descriptionText: {
    color: "#293541",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 22,
    lineHeight: 18,
    fontWeight: "600",
  },
  buttonList: {
    width: "100%",
    gap: 10,
  },
  stayButton: {
    width: "100%",
    backgroundColor: "#aef5e0",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  stayButtonText: {
    color: "#293541",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  leaveButton: {
    width: "100%",
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(239, 68, 68, 0.25)",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  leaveButtonText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  badgeWarn: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    marginBottom: 12,
  },
  badgeWarnText: {
    color: "#D97706",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  penaltyBox: {
    width: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    marginBottom: 20,
    gap: 10,
  },
  penaltyBoxHeader: {
    fontSize: 10,
    fontWeight: "900",
    color: "#64748B",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  penaltyRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  penaltyIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  penaltyTextWrap: {
    flex: 1,
  },
  penaltyLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1E293B",
  },
  penaltyHint: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "500",
  },
  penaltyValue: {
    fontSize: 13,
    fontWeight: "900",
    color: "#DC2626",
  },
  leavingContainer: {
    alignItems: "center",
    paddingVertical: 28,
  },
  leavingIcon: {
    fontSize: 54,
    marginBottom: 12,
  },
  leavingTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#DC2626",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  leavingSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  penaltySplash: {
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  penaltySplashText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#DC2626",
    letterSpacing: 1,
  },
  penaltySplashSub: {
    fontSize: 12,
    fontWeight: "800",
    color: "#B91C1C",
    marginTop: 2,
  },
});
