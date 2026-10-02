import React from "react";
import { Pressable, Text, View } from "react-native";
import { triggerHapticSelection } from "@/shared/audio-haptics";
import { MAX_LIVES } from "@/shared/progression";
import { VINTAGE_HINT_COST } from "./vintage-constants";
import { vintageStyles as styles } from "./vintage.styles";

export function VintagePlayHeader({
  levelIndex,
  lives,
  isInfiniteLives,
  onOpenLivesModal,
  coins,
  score,
  boardSwapCount,
  onBackPress,
  onUseHint,
  onResetLevel,
}: {
  levelIndex: number;
  lives: number;
  isInfiniteLives: boolean;
  onOpenLivesModal?: () => void;
  coins?: number;
  score: number;
  boardSwapCount: number;
  onBackPress: () => void;
  onUseHint: () => void;
  onResetLevel: () => void;
}) {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerNavRow}>
        <View style={styles.headerNavLeft}>
          <Pressable onPress={onBackPress} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹ HARİTA</Text>
          </Pressable>
        </View>
        <View style={styles.titleWrap}>
          <Text style={styles.newspaperKicker}>10×10 KELİME BULMACA</Text>
          <Text style={styles.newspaperTitle}>{levelIndex}. BÖLÜM</Text>
        </View>
        <View style={styles.headerNavRight} />
      </View>

      <View style={styles.statusBarRow}>
        <Pressable
          onPress={() => {
            triggerHapticSelection();
            onOpenLivesModal?.();
          }}
          style={({ pressed }) => [
            styles.statusPill,
            styles.livesPill,
            isInfiniteLives && styles.infiniteLivesPill,
            pressed && styles.pressedPill,
          ]}
        >
          <Text style={styles.statusPillIcon}>💚</Text>
          <Text style={[styles.statusPillText, styles.livesPillText, isInfiniteLives && styles.infiniteLivesPillText]}>
            {isInfiniteLives ? "∞" : `${lives}/${MAX_LIVES}`}
          </Text>
        </Pressable>
        <Pressable
          onPress={onUseHint}
          style={({ pressed }) => [styles.statusPill, styles.hintPill, pressed && styles.pressedPill]}
        >
          <Text style={styles.statusPillIcon}>💡</Text>
          <Text style={[styles.statusPillText, styles.hintPillText]}>{VINTAGE_HINT_COST}</Text>
        </Pressable>
        <Pressable
          onPress={onResetLevel}
          style={({ pressed }) => [styles.statusPill, styles.resetPill, pressed && styles.pressedPill]}
        >
          <Text style={styles.statusPillIcon}>🔄</Text>
          <Text style={[styles.statusPillText, styles.resetPillText]}>[{boardSwapCount}]</Text>
        </Pressable>
        <View style={[styles.statusPill, styles.scorePill]}>
          <Text style={styles.statusPillIcon}>🪙</Text>
          <Text style={[styles.statusPillText, styles.scorePillText]}>{coins !== undefined ? coins : score}</Text>
        </View>
      </View>
    </View>
  );
}
