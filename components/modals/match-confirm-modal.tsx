import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { BoardSize } from "@/shared/game";

export interface PendingMatchConfirm {
  size: BoardSize;
  modeTitle: string;
  durationText: string;
  routesText: string;
  isBot?: boolean;
}

interface MatchConfirmModalProps {
  visible: boolean;
  matchInfo: PendingMatchConfirm | null;
  onConfirm: (info: PendingMatchConfirm) => void;
  onCancel: () => void;
}

export const MatchConfirmModal: React.FC<MatchConfirmModalProps> = ({
  visible,
  matchInfo,
  onConfirm,
  onCancel,
}) => {
  if (!visible || !matchInfo) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          {/* İkon */}
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>⚔️</Text>
          </View>

          {/* Üst etiket */}
          <Text style={[styles.headerTag, { color: matchInfo.isBot ? "#2a8fbc" : "#2a9c7a" }]}>
            {matchInfo.isBot ? "YAPAY ZEKA DÜELLOSU" : "DERECELİ DÜELLO"}
          </Text>

          {/* Mod adı */}
          <Text style={styles.titleText}>{matchInfo.modeTitle}</Text>

          {/* İstatistik satırları */}
          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>⏱ SÜRE</Text>
              <Text style={[styles.statValue, { color: "#2a9c7a" }]}>{matchInfo.durationText}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>🗺 ROTA</Text>
              <Text style={[styles.statValue, { color: "#8c7540" }]}>{matchInfo.routesText}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>🏅 LP</Text>
              <Text style={[styles.statValue, { color: "#98732c" }]}>
                {matchInfo.isBot ? "Alıştırma (0 LP)" : "Galibiyet / Mağlubiyet"}
              </Text>
            </View>
          </View>

          {/* Butonlar */}
          <View style={styles.buttonContainer}>
            <Pressable
              onPress={() => onConfirm(matchInfo)}
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  backgroundColor: matchInfo.isBot ? "#abe3fc" : "#aef5e0",
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text style={styles.primaryButtonText}>
                {matchInfo.isBot ? "🤖 DÜELLOYU BAŞLAT" : "⚔️ SAVAŞI BAŞLAT"}
              </Text>
            </Pressable>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.cancelButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={styles.cancelButtonText}>Vazgeç</Text>
            </Pressable>
          </View>
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
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#F0F5ED",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#DCE1D7",
    padding: 24,
    alignItems: "center",
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(62,232,181,0.12)",
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  iconText: {
    fontSize: 26,
  },
  headerTag: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  titleText: {
    color: "#293541",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 16,
    textAlign: "center",
  },
  statsContainer: {
    width: "100%",
    gap: 8,
    marginBottom: 20,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#DCE1D7",
  },
  statLabel: {
    color: "#293541",
    fontSize: 12,
    fontWeight: "700",
  },
  statValue: {
    fontSize: 12,
    fontWeight: "900",
  },
  buttonContainer: {
    width: "100%",
    gap: 10,
  },
  primaryButton: {
    width: "100%",
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#293541",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  cancelButton: {
    width: "100%",
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "#DCE1D7",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#293541",
    fontSize: 13,
    fontWeight: "700",
  },
});
