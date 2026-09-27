import React from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { type BoardSize } from "@/shared/game";

export type MatchmakingState = {
  size: BoardSize;
  elapsedSeconds: number;
};

export function MatchmakingOverlay({
  state,
  onCancel,
}: {
  state: MatchmakingState | null;
  onCancel: () => void;
}) {
  if (!state) return null;

  return (
    <Modal
      visible={true}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.matchmakingOverlay}>
        <View style={styles.matchmakingCard}>
          <View style={styles.matchmakingRadarBox}>
            <ActivityIndicator size="large" color="#3EE8B5" />
            <Text style={styles.matchmakingRadarIcon}>📡</Text>
          </View>
          <Text style={styles.matchmakingTitle}>EŞLEŞME ARANIYOR</Text>
          <Text style={styles.matchmakingSubtitle}>
            {state.size}×{state.size} Boyutunda Canlı Rakip
          </Text>
          <Text style={styles.matchmakingTimer}>
            {`00:${String(state.elapsedSeconds).padStart(2, "0")}`}
          </Text>
          <Text style={styles.matchmakingStatusText}>
            {state.elapsedSeconds < 3
              ? "Uygun ligdeki rakipler taranıyor..."
              : "Eşleşme tamamlanıyor, arenaya bağlanılıyor..."}
          </Text>
          <Pressable
            onPress={onCancel}
            style={({ pressed }) => [styles.matchmakingCancelBtn, pressed && styles.pressed]}
          >
            <Text style={styles.matchmakingCancelText}>İPTAL ET</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  matchmakingOverlay: {
    flex: 1,
    backgroundColor: "rgba(4, 17, 12, 0.88)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  matchmakingCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#0B261D",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#3EE8B5",
    padding: 24,
    alignItems: "center",
    shadowColor: "#3EE8B5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  matchmakingRadarBox: {
    width: 72,
    height: 72,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    position: "relative",
  },
  matchmakingRadarIcon: {
    position: "absolute",
    fontSize: 26,
  },
  matchmakingTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 6,
    textAlign: "center",
  },
  matchmakingSubtitle: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  matchmakingTimer: {
    color: "#3EE8B5",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 12,
    fontFamily: "monospace",
  },
  matchmakingStatusText: {
    color: "#CBD5E1",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
    minHeight: 18,
  },
  matchmakingCancelBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1.5,
    borderColor: "#EF4444",
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  matchmakingCancelText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  pressed: {
    opacity: 0.8,
  },
});
