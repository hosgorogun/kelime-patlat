import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { type BoardSize } from "@/shared/game";

export type DuelInviteData = {
  fromPlayerId: string;
  fromPlayerName: string;
  roomCode: string;
  size: BoardSize;
};

export function DuelInviteModal({
  invite,
  onAccept,
  onReject,
}: {
  invite: DuelInviteData | null;
  onAccept: () => void;
  onReject: () => void;
}) {
  if (!invite) return null;

  return (
    <Modal
      visible={true}
      transparent
      animationType="fade"
      onRequestClose={onReject}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Text style={{ fontSize: 32 }}>⚔️</Text>
          </View>
          <Text style={styles.kicker}>CANLI DÜELLO MEYDAN OKUMASI</Text>
          <Text style={styles.title}>{invite.fromPlayerName}</Text>
          <Text style={styles.subtitle}>
            Seni {invite.size}×{invite.size} boyutunda canlı düelloya davet etti!
          </Text>
          <View style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [styles.btn, styles.acceptBtn, pressed && styles.pressed]}
              onPress={onAccept}
            >
              <Text style={styles.acceptBtnText}>✓ KABUL ET</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.btn, styles.rejectBtn, pressed && styles.pressed]}
              onPress={onReject}
            >
              <Text style={styles.rejectBtnText}>✕ REDDET</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(4, 17, 12, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#0E2C22",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: "#D4B45A",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 14,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(212, 180, 90, 0.15)",
    borderWidth: 1.5,
    borderColor: "#D4B45A",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  kicker: {
    color: "#D4B45A",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 6,
    textAlign: "center",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  acceptBtn: {
    backgroundColor: "#3EE8B5",
  },
  acceptBtnText: {
    color: "#051A14",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  rejectBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  rejectBtnText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
});
