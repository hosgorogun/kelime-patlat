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
    backgroundColor: "rgba(11, 19, 43, 0.88)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  countdownCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    borderRadius: 28,
    backgroundColor: "rgba(28, 37, 65, 0.95)",
    borderWidth: 2,
    borderColor: "#3EE8B5",
    shadowColor: "#3EE8B5",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  countdownOverline: {
    color: "#3EE8B5",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 12,
  },
  countdownText: {
    color: "#FFFFFF",
    fontSize: 68,
    fontWeight: "900",
    letterSpacing: 2,
    textShadowColor: "#3EE8B5",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 16,
  },
  countdownHint: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 14,
    textAlign: "center",
  },
});
