import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, View, Animated } from "react-native";

export type GameHeaderProps = {
  remainingSeconds: number;
  myScore: number;
  opponentScore: number;
  myName: string;
  opponentName?: string;
  myMultiplier?: number;
  isFinalPush?: boolean;
};

export const GameHeaderTimer = React.memo(function GameHeaderTimer({
  remainingSeconds,
  myScore,
  opponentScore,
  myName,
  opponentName = "Rakip",
  myMultiplier = 1,
  isFinalPush = false,
}: GameHeaderProps) {
  const heartbeatScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isFinalPush) {
      heartbeatScale.setValue(1);
      return;
    }
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(heartbeatScale, {
          toValue: 1.12,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(heartbeatScale, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [isFinalPush, heartbeatScale]);

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.playerBox}>
        <Text numberOfLines={1} style={styles.playerName}>{myName}</Text>
        <Text style={styles.playerScore}>{myScore} P</Text>
        {myMultiplier > 1 && <Text style={styles.multiplierBadge}>×{myMultiplier}</Text>}
      </View>

      <Animated.View
        style={[
          styles.timerBadge,
          isFinalPush && styles.timerBadgeUrgent,
          { transform: [{ scale: heartbeatScale }] },
        ]}
      >
        <Text style={[styles.timerText, isFinalPush && styles.timerTextUrgent]}>
          ⏱ {formatSeconds(remainingSeconds)}
        </Text>
      </Animated.View>

      <View style={[styles.playerBox, styles.opponentBox]}>
        <Text numberOfLines={1} style={styles.playerName}>{opponentName}</Text>
        <Text style={styles.playerScore}>{opponentScore} P</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
    marginHorizontal: 12,
    marginVertical: 6,
  },
  playerBox: {
    flex: 1,
    alignItems: "flex-start",
  },
  opponentBox: {
    alignItems: "flex-end",
  },
  playerName: {
    fontSize: 11,
    fontWeight: "900",
    color: "#293541",
  },
  playerScore: {
    fontSize: 16,
    fontWeight: "900",
    color: "#2a9c7a",
  },
  multiplierBadge: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FFC24A",
    backgroundColor: "#293541",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  timerBadge: {
    backgroundColor: "#F0F5ED",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DCE1D7",
  },
  timerBadgeUrgent: {
    backgroundColor: "#FEE2E2",
    borderColor: "#EF4444",
  },
  timerText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#293541",
  },
  timerTextUrgent: {
    color: "#EF4444",
  },
});
