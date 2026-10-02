import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { haptics } from "@/lib/haptics";

interface LeaveDuelModalProps {
  visible: boolean;
  onStay: () => void;
  onLeave: () => void;
}

export const LeaveDuelModal: React.FC<LeaveDuelModalProps> = ({
  visible,
  onStay,
  onLeave,
}) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onStay}
    >
      <Pressable style={styles.overlay} onPress={onStay}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.iconText}>⚔️</Text>
          <Text style={styles.titleText}>DÜELLODAN AYRIL?</Text>
          <Text style={styles.descriptionText}>
            Canlı düello henüz devam ediyor! Şimdi ayrılırsan maç mağlubiyet sayılabilir ve lig puanı kaybedebilirsin.
          </Text>

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
              <Text style={styles.stayButtonText}>⚔️ SAVAŞA DEVAM ET</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                haptics.error();
                onLeave();
              }}
              style={({ pressed }) => [
                styles.leaveButton,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={styles.leaveButtonText}>🏃‍♂️ MAÇI TERK ET VE AYRIL</Text>
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
    width: "90%",
    maxWidth: 360,
    backgroundColor: "#F0F5ED",
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
    backgroundColor: "rgba(255, 0, 127, 0.12)",
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  leaveButtonText: {
    color: "#9d6f33",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
