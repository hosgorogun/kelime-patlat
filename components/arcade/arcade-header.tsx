import React from "react";
import { View, Text, Pressable, Animated } from "react-native";
import { triggerHapticSelection } from "@/shared/audio-haptics";
import { FloatingTimeBonus } from "../solo/solo-floating-effects";
import { styles } from "./arcade.styles";

export type ArcadeHeaderProps = {
  score: number;
  seconds: number;
  timeBonusText: string | null;
  foundCount: number;
  totalWords: number;
  size: number;
  combo: number;
  onExitPress: () => void;
  onPausePress: () => void;
};

export const ArcadeHeader = React.memo(({
  score,
  seconds,
  timeBonusText,
  foundCount,
  totalWords,
  size,
  combo,
  onExitPress,
  onPausePress,
}: ArcadeHeaderProps) => {
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
          style={({ pressed }) => [styles.exit, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.exitText}>‹</Text>
        </Pressable>
        <View style={{ flex: 1, marginHorizontal: 8, minWidth: 0 }}>
          <Text numberOfLines={1} style={styles.kicker}>ARCADE MODU</Text>
          <Text numberOfLines={1} style={styles.title}>ZAMANA KARŞI HÜCUM</Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>SKOR</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
        <Animated.View
          style={[
            styles.timer,
            seconds <= 8 && styles.timerUrgent,
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
          style={({ pressed }) => [styles.pauseBtn, pressed && { opacity: 0.8 }]}
        >
          <Text style={{ fontSize: 13 }}>⏸️</Text>
        </Pressable>
      </View>

      <View style={styles.progress}>
        <Text style={styles.progressLabel}>{foundCount} / {totalWords} KELİME</Text>
        <Text style={styles.progressMeta}>{size}x{size} Izgara · Her kelime ek süre kazandırır</Text>
        {combo >= 2 && (
          <View style={styles.comboPill}>
            <Text style={styles.comboPillText}>
              {combo >= 4 ? `💥 SERİ KOMBO x${combo}! (+3s)` : combo === 3 ? "⚡ KOMBO x3! (+2s)" : "🔥 KOMBO x2! (+1s)"}
            </Text>
          </View>
        )}
      </View>
    </>
  );
});

ArcadeHeader.displayName = "ArcadeHeader";
