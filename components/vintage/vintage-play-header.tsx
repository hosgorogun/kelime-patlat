import React from "react";
import { Pressable, Text, View } from "react-native";
import { triggerHapticSelection } from "@/shared/audio-haptics";
import { MAX_LIVES } from "@/shared/progression";
import { VINTAGE_HINT_COST, formatElapsedTimer, calculateLevelStars } from "./vintage-constants";
import { vintageStyles as styles } from "./vintage.styles";

export function VintagePlayHeader({
  levelIndex,
  lives,
  isInfiniteLives,
  onOpenLivesModal,
  coins,
  score,
  boardSwapCount,
  elapsedSeconds = 0,
  onBackPress,
  onUseHint,
  onResetLevel,
  soundOn = true,
  hapticsOn = true,
  onToggleSound,
  onToggleHaptics,
}: {
  levelIndex: number;
  lives: number;
  isInfiniteLives: boolean;
  onOpenLivesModal?: () => void;
  coins?: number;
  score: number;
  boardSwapCount: number;
  elapsedSeconds?: number;
  onBackPress: () => void;
  onUseHint: () => void;
  onResetLevel: () => void;
  soundOn?: boolean;
  hapticsOn?: boolean;
  onToggleSound?: () => void;
  onToggleHaptics?: () => void;
}) {
  const currentStars = calculateLevelStars(levelIndex, elapsedSeconds);
  const starsString = "⭐".repeat(currentStars);
  return (
    <View style={styles.headerContainer}>
      {/* 1. Üst Başlık Satırı: Harita Dönüşü, Bölüm Bilgisi, Ses & Titreşim */}
      <View style={styles.headerNavRow}>
        <View style={styles.headerNavLeft}>
          <Pressable
            onPress={onBackPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] }]}
          >
            <Text style={styles.backBtnText}>‹ HARİTA</Text>
          </Pressable>
        </View>

        <View style={styles.titleWrap}>
          <Text style={styles.newspaperKicker}>10×10 KELİME BULMACA</Text>
          <Text style={styles.newspaperTitle}>{levelIndex}. BÖLÜM</Text>
        </View>

        <View style={styles.headerNavRight}>
          {onToggleSound && (
            <Pressable
              onPress={onToggleSound}
              style={({ pressed }) => [styles.headerControlBtn, pressed && { opacity: 0.7 }]}
              hitSlop={8}
            >
              <Text style={styles.headerControlIcon}>{soundOn ? "🔊" : "🔇"}</Text>
            </Pressable>
          )}
          {onToggleHaptics && (
            <Pressable
              onPress={onToggleHaptics}
              style={({ pressed }) => [styles.headerControlBtn, pressed && { opacity: 0.7 }]}
              hitSlop={8}
            >
              <Text style={styles.headerControlIcon}>{hapticsOn ? "📳" : "📴"}</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* 2. Durum ve Oyun Kontrolleri Şeridi: Can - Kronometre - Çip ve Araçlar */}
      <View style={styles.playDashboardRow}>
        {/* Sol Küme: Oyuncu Kaynakları (Can & Çip) */}
        <View style={styles.dashboardResourceGroup}>
          <Pressable
            onPress={() => {
              triggerHapticSelection();
              onOpenLivesModal?.();
            }}
            style={({ pressed }) => [
              styles.dashboardPill,
              styles.livesPill,
              isInfiniteLives && styles.infiniteLivesPill,
              pressed && styles.pressedPill,
            ]}
          >
            <Text style={styles.dashboardPillIcon}>{isInfiniteLives ? "⚡" : "💚"}</Text>
            <Text style={[styles.dashboardPillText, styles.livesPillText, isInfiniteLives && styles.infiniteLivesPillText]}>
              {isInfiniteLives ? "∞" : `${lives}/${MAX_LIVES}`}
            </Text>
          </Pressable>

          <View style={[styles.dashboardPill, styles.scorePill]}>
            <Text style={styles.dashboardPillIcon}>🪙</Text>
            <Text style={[styles.dashboardPillText, styles.scorePillText]}>
              {coins !== undefined ? coins : score}
            </Text>
          </View>
        </View>

        {/* Merkez: Canlı Kronometre & Kazanılacak Yıldızlar */}
        <View style={styles.dashboardCenterTimer}>
          <Text style={styles.timerClockText}>⏱️ {formatElapsedTimer(elapsedSeconds)}</Text>
          <Text style={styles.timerStarsTextSmall}>{starsString}</Text>
        </View>

        {/* Sağ Küme: Oyun İçi Araçlar (İpucu & Sıfırla) */}
        <View style={styles.dashboardToolGroup}>
          <Pressable
            onPress={onUseHint}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [styles.dashboardActionBtn, styles.hintActionBtn, pressed && styles.pressedPill]}
          >
            <Text style={styles.actionBtnIcon}>💡</Text>
            <Text style={styles.actionBtnText}>{VINTAGE_HINT_COST}</Text>
          </Pressable>

          <Pressable
            onPress={onResetLevel}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [styles.dashboardActionBtn, styles.resetActionBtn, pressed && styles.pressedPill]}
          >
            <Text style={styles.actionBtnIcon}>🔄</Text>
            <Text style={styles.actionBtnText}>{boardSwapCount}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
