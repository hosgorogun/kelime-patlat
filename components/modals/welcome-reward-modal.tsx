import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { triggerHapticSuccess, gameSfx } from "@/shared/audio-haptics";

interface WelcomeRewardModalProps {
  visible: boolean;
  isClaiming: boolean;
  onClaim: () => void;
  onClose: () => void;
}

export const WelcomeRewardModal: React.FC<WelcomeRewardModalProps> = ({
  visible,
  isClaiming,
  onClaim,
  onClose,
}) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Başlık */}
          <Text style={styles.headerEmoji}>🎁</Text>
          <Text style={styles.headerTitle}>HOŞ GELDİN HEDİYESİ!</Text>
          <Text style={styles.headerSubtitle}>
            Kelime Patlat dünyasına hoş geldin! Başlangıç hediyelerin hesabına tanımlandı.
          </Text>

          {/* Hediye kartları */}
          <View style={styles.giftList}>
            <View style={[styles.giftCard, { backgroundColor: "rgba(255, 208, 0, 0.1)" }]}>
              <Text style={styles.giftEmoji}>🪙</Text>
              <View style={styles.giftTextWrap}>
                <Text style={[styles.giftAmount, { color: "#987c00" }]}>50</Text>
                <Text style={styles.giftLabel}>Çip</Text>
              </View>
              <Text style={[styles.giftTag, { color: "#987c00" }]}>BAŞLANGIÇ</Text>
            </View>

            <View style={[styles.giftCard, { backgroundColor: "rgba(62, 232, 181, 0.08)" }]}>
              <Text style={styles.giftEmoji}>👁️</Text>
              <View style={styles.giftTextWrap}>
                <Text style={[styles.giftAmount, { color: "#2a9c7a" }]}>5</Text>
                <Text style={styles.giftLabel}>Radar İpucu Hakkı</Text>
              </View>
              <Text style={[styles.giftTag, { color: "#2a9c7a" }]}>JOKER</Text>
            </View>

            <View style={[styles.giftCard, { backgroundColor: "rgba(212, 180, 90, 0.1)" }]}>
              <Text style={styles.giftEmoji}>🛡️</Text>
              <View style={styles.giftTextWrap}>
                <Text style={[styles.giftAmount, { color: "#8c763b" }]}>1</Text>
                <Text style={styles.giftLabel}>Seri Kalkanı</Text>
              </View>
              <Text style={[styles.giftTag, { color: "#8c763b" }]}>KORUMA</Text>
            </View>
          </View>

          {/* Buton */}
          <Pressable
            disabled={isClaiming}
            onPress={() => {
              triggerHapticSuccess();
              try { gameSfx.victory(); } catch {}
              onClaim();
            }}
            style={({ pressed }) => [
              styles.actionButton,
              { opacity: pressed || isClaiming ? 0.7 : 1 },
            ]}
          >
            <Text style={styles.actionButtonText}>
              {isClaiming ? "TANIMLANIYOR..." : "HARİKA, BAŞLA! 🚀"}
            </Text>
          </Pressable>
        </View>
      </View>
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
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#DCE1D7",
    padding: 28,
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerEmoji: {
    fontSize: 26,
    textAlign: "center",
    marginBottom: 4,
  },
  headerTitle: {
    color: "#2a9c7a",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
    textAlign: "center",
    marginBottom: 4,
  },
  headerSubtitle: {
    color: "#293541",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 18,
  },
  giftList: {
    gap: 10,
    marginBottom: 22,
  },
  giftCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DCE1D7",
    padding: 14,
    gap: 14,
  },
  giftEmoji: {
    fontSize: 28,
  },
  giftTextWrap: {
    flex: 1,
  },
  giftAmount: {
    fontSize: 20,
    fontWeight: "900",
  },
  giftLabel: {
    color: "#293541",
    fontSize: 13,
    fontWeight: "700",
  },
  giftTag: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  actionButton: {
    backgroundColor: "#aef5e0",
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    color: "#293541",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
