import React from "react";
import { StyleSheet, Text, View } from "react-native";

export function GameCountdownOverlay({ countdown }: { countdown: number | null }) {
  if (countdown === null) return null;

  return (
    <View style={styles.countdownOverlay} pointerEvents="auto">
      <View style={styles.countdownCard}>
        <Text style={styles.countdownOverline}>DÜELLO BAŞLIYOR</Text>
        <Text style={styles.countdownText}>
          {countdown === 0 ? "BAŞLA!" : countdown}
        </Text>
        <Text style={styles.countdownHint}>Gizli kelimeleri ilk bulan kazanır!</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  countdownOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(35, 48, 59, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  countdownCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#DCE1D7",
    shadowColor: "#293541",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  countdownOverline: {
    color: "#2a9c7a",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  countdownText: {
    color: "#293541",
    fontSize: 68,
    fontWeight: "900",
    letterSpacing: 0.5,
    textShadowColor: "transparent",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  countdownHint: {
    color: "#293541",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 14,
    textAlign: "center",
  },
});
