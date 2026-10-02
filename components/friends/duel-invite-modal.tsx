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
    backgroundColor: "rgba(35,48,59,0.42)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
    alignItems: "center",
    shadowColor: "#293541",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(212, 180, 90, 0.15)",
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  kicker: {
    color: "#8c763b",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 6,
    textAlign: "center",
  },
  title: {
    color: "#293541",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: "#293541",
    fontSize: 14,
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
    backgroundColor: "#aef5e0",
  },
  acceptBtnText: {
    color: "#293541",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  rejectBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "#DCE1D7",
  },
  rejectBtnText: {
    color: "#ed4343",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
});
