import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { triggerHapticSelection } from "@/shared/audio-haptics";
import { GameButton } from "@/components/game/game-ui";
import type { PlayerProgress } from "@/shared/progression";

interface KelimematikPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  onStart: () => void;
  progress?: PlayerProgress;
}

export function KelimematikPreviewModal({
  visible,
  onClose,
  onStart,
  progress,
}: KelimematikPreviewModalProps) {
  if (!visible) return null;

  const bestScore = progress?.bestKelimematikScore || 0;

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
          {/* Header Icon */}
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>⚡</Text>
          </View>

          {/* Kicker & Title */}
          <View style={styles.kickerBadge}>
            <Text style={styles.kickerText}>HAYATTA KALMA MODU</Text>
          </View>
          <Text style={styles.title}>KELİMEMATİK</Text>
          <Text style={styles.subtitle}>
            Düşen harfler tavan sınırına ulaşmadan kelimeler üret, patlat ve hayatta kal!
          </Text>

          {/* Game Stats & Features Card */}
          <View style={styles.statsCard}>
            <View style={styles.statRow}>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>EN YÜKSEK SKOR</Text>
                <Text style={styles.statValue}>
                  {bestScore > 0 ? `${bestScore} P` : "— Henüz Yok"}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>IZGARA TİPİ</Text>
                <Text style={[styles.statValue, { color: "#0284C7" }]}>5×8 Tetris</Text>
              </View>
            </View>

            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🌪️</Text>
                <Text style={styles.featureText}>Süpürge: En yüksek sütunu anında temizler.</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>💧</Text>
                <Text style={styles.featureText}>Sesli Harf: Tahtaya yeni sesli harfler serper.</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>⚡</Text>
                <Text style={styles.featureText}>Zincirleme: Düşen harfler yeni kelime yaparsa kombo!</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <GameButton
              label="OYUNA BAŞLA ▶"
              variant="primary"
              size="lg"
              onPress={() => {
                triggerHapticSelection();
                onClose();
                onStart();
              }}
              style={{ width: "100%" }}
            />

            <Pressable
              onPress={() => {
                triggerHapticSelection();
                onClose();
              }}
              style={({ pressed }) => [
                styles.cancelBtn,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.cancelBtnText}>Vazgeç</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(2, 132, 199, 0.12)",
    borderWidth: 2,
    borderColor: "rgba(2, 132, 199, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  icon: {
    fontSize: 28,
  },
  kickerBadge: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 6,
  },
  kickerText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#0369A1",
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 6,
    paddingHorizontal: 8,
  },
  statsCard: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    padding: 14,
    marginVertical: 18,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  statCol: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#E2E8F0",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 2,
  },
  featuresList: {
    paddingTop: 12,
    gap: 8,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureIcon: {
    fontSize: 14,
  },
  featureText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
    lineHeight: 15,
  },
  buttonGroup: {
    width: "100%",
    alignItems: "center",
    gap: 8,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#94A3B8",
  },
});
