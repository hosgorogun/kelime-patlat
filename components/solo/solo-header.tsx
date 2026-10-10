import React from "react";
import { View, Text, Pressable, Animated } from "react-native";
import { triggerHapticSelection } from "@/shared/audio-haptics";
import { FloatingTimeBonus } from "./solo-floating-effects";
import { styles } from "./solo-challenge.styles";

export type SoloHeaderProps = {
  daily?: boolean;
  level: number;
  challengeTitle: string;
  challengeSubtitle: string;
  activeTheme: {
    surface: string;
    headerText: string;
    accentColor: string;
  };
  radarCharges: number;
  radarCooldown: number;
  status: "playing" | "won" | "lost";
  seconds: number;
  timeBonusText: string | null;
  foundCount: number;
  totalWords: number;
  comboStreak: number;
  onExitPress: () => void;
  onRadarPress: () => void;
  onPausePress: () => void;
};

export const SoloHeader = React.memo(({
  daily,
  level,
  challengeTitle,
  challengeSubtitle,
  activeTheme,
  radarCharges,
  radarCooldown,
  status,
  seconds,
  timeBonusText,
  foundCount,
  totalWords,
  comboStreak,
  onExitPress,
  onRadarPress,
  onPausePress,
}: SoloHeaderProps) => {
  const timerScale = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (!timeBonusText) return;
    Animated.sequence([
      Animated.timing(timerScale, {
        toValue: 1.25,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.spring(timerScale, {
        toValue: 1,
        friction: 4,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [timeBonusText, timerScale]);
  return (
    <>
      <View style={styles.header}>
        <Pressable
          onPress={onExitPress}
          style={[styles.exit, { backgroundColor: activeTheme.surface }]}
        >
          <Text style={styles.exitText}>‹</Text>
        </Pressable>
        <View style={{ flex: 1, marginHorizontal: 8, minWidth: 0 }}>
          <Text numberOfLines={1} style={[styles.kicker, { color: activeTheme.headerText }]}>
            {`TEK OYUNCU · SEVİYE ${level}`}
          </Text>
          <Text numberOfLines={1} style={styles.title}>
            {challengeTitle}
          </Text>
        </View>
        <Pressable
          disabled={(radarCooldown > 0 && radarCharges > 0) || status !== "playing"}
          onPress={onRadarPress}
          style={[
            styles.radarButton,
            { backgroundColor: activeTheme.surface, borderColor: activeTheme.accentColor },
            radarCooldown > 0 && radarCharges > 0 && styles.radarUsedBtn,
          ]}
        >
          <Text style={styles.radarText}>
            {radarCharges > 0
              ? radarCooldown > 0
                ? `RADAR (${radarCooldown}s)`
                : `RADAR 👁 [${radarCharges}]`
              : "👁 REKLAMLA +1 HAK"}
          </Text>
        </Pressable>
        <Animated.View
          style={[
            styles.timer,
            { backgroundColor: activeTheme.surface, borderColor: activeTheme.accentColor },
            seconds <= 15 && styles.timerUrgent,
            { transform: [{ scale: timerScale }] },
          ]}
        >
          <Text style={styles.timerText}>{seconds}s</Text>
          <FloatingTimeBonus text={timeBonusText} />
        </Animated.View>
        <Pressable
          onPress={() => {
            triggerHapticSelection();
            onPausePress();
          }}
          style={({ pressed }) => [
            styles.pauseBtn,
            { backgroundColor: activeTheme.surface, borderColor: activeTheme.accentColor },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text style={{ fontSize: 13 }}>⏸️</Text>
        </Pressable>
      </View>

      <View style={styles.progress}>
        <Text style={styles.progressLabel}>
          {foundCount} / {totalWords} KELİME
        </Text>
        {comboStreak >= 2 ? (
          <View
            style={{
              backgroundColor: "rgba(245, 158, 11, 0.25)",
              borderWidth: 1,
              borderColor: "#DCE1D7",
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Text style={{ fontSize: 11 }}>🔥</Text>
            <Text style={{ color: "#9b7616", fontSize: 10, fontWeight: "900" }}>
              ATEŞLİ KOMBO x{comboStreak}
            </Text>
          </View>
        ) : null}
        <Text style={[styles.progressMeta, { color: activeTheme.headerText }]}>
          {challengeSubtitle}
        </Text>
      </View>
    </>
  );
});

SoloHeader.displayName = "SoloHeader";
