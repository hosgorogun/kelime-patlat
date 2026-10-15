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
          style={({ pressed }) => [
            styles.exit,
            { backgroundColor: activeTheme.surface },
            pressed && { transform: [{ scale: 0.94 }], opacity: 0.8 },
          ]}
        >
          <Text style={styles.exitText}>‹</Text>
        </Pressable>

        <View style={{ flex: 1, marginHorizontal: 8, minWidth: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: activeTheme.accentColor }} />
            <Text numberOfLines={1} style={[styles.kicker, { color: activeTheme.headerText }]}>
              {`TEK OYUNCU · SEVİYE ${level}`}
            </Text>
          </View>
          <Text numberOfLines={1} style={styles.title}>
            {challengeTitle}
          </Text>
        </View>

        {/* Action Controls HUD */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Pressable
            disabled={(radarCooldown > 0 && radarCharges > 0) || status !== "playing"}
            onPress={onRadarPress}
            style={({ pressed }) => [
              styles.radarButton,
              { backgroundColor: activeTheme.surface, borderColor: activeTheme.accentColor },
              radarCooldown > 0 && radarCharges > 0 && styles.radarUsedBtn,
              pressed && { transform: [{ scale: 0.95 }], opacity: 0.85 },
            ]}
          >
            <Text style={[styles.radarText, { color: activeTheme.accentColor }]}>
              {radarCharges > 0
                ? radarCooldown > 0
                  ? `RADAR (${radarCooldown}s)`
                  : `RADAR 👁 [${radarCharges}]`
                : "👁 +1 HAK"}
            </Text>
          </Pressable>

          <Animated.View
            style={[
              styles.timer,
              { backgroundColor: activeTheme.surface, borderColor: seconds <= 15 ? "#EF4444" : activeTheme.accentColor },
              seconds <= 15 && styles.timerUrgent,
              { transform: [{ scale: timerScale }] },
            ]}
          >
            <Text style={[styles.timerText, seconds > 15 && { color: "#0F172A" }]}>
              ⏱ {seconds}s
            </Text>
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
              pressed && { transform: [{ scale: 0.93 }], opacity: 0.8 },
            ]}
          >
            <Text style={{ fontSize: 13 }}>⏸️</Text>
          </Pressable>
        </View>
      </View>

      {/* Progress & Milestone HUD */}
      <View style={styles.progress}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Text style={[styles.progressLabel, { color: "#0F172A" }]}>
            {foundCount} / {totalWords} KELİME
          </Text>
          {comboStreak >= 2 ? (
            <View
              style={{
                backgroundColor: "rgba(245, 158, 11, 0.2)",
                borderWidth: 1.5,
                borderColor: "#F59E0B",
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Text style={{ fontSize: 11 }}>🔥</Text>
              <Text style={{ color: "#B45309", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 }}>
                KOMBO x{comboStreak}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Word Completion Dot Indicators */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, marginBottom: 4 }}>
          {Array.from({ length: Math.min(totalWords, 8) }).map((_, i) => {
            const isCompleted = i < foundCount;
            return (
              <View
                key={i}
                style={{
                  width: isCompleted ? 20 : 12,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: isCompleted ? activeTheme.accentColor : "#CBD5E1",
                }}
              />
            );
          })}
        </View>

        {/* Challenge Subtitle & Rules Pill */}
        <View style={{
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          paddingHorizontal: 10,
          paddingVertical: 3,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: "#E2E8F0",
          marginTop: 2,
        }}>
          <Text style={[styles.progressMeta, { color: activeTheme.headerText, marginTop: 0 }]}>
            {challengeSubtitle}
          </Text>
        </View>
      </View>
    </>
  );
});

SoloHeader.displayName = "SoloHeader";
