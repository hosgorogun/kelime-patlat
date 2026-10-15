import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { vintageStyles as styles } from "./vintage.styles";
import { MAX_LIVES } from "../../shared/progression";
import { triggerHapticSelection, triggerHapticError, playSelectionNote, playErrorSound } from "../../shared/audio-haptics";

export interface VintageMapViewProps {
  measureContainer: (event: import("react-native").LayoutChangeEvent) => void;
  onBack: () => void;
  onOpenLivesModal?: () => void;
  isInfiniteLives: boolean;
  lives: number;
  coins?: number;
  score: number;
  maxUnlockedLevel: number;
  completedLevels: Set<number>;
  levelStars?: Record<number, number>;
  levelIndex: number;
  onSelectLevel: (lvl: number) => void;
}

export function VintageMapView({
  measureContainer,
  onBack,
  onOpenLivesModal,
  isInfiniteLives,
  lives,
  coins,
  score,
  maxUnlockedLevel,
  completedLevels,
  levelStars = {},
  levelIndex: _levelIndex,
  onSelectLevel,
}: VintageMapViewProps) {
  const totalEarnedStars = Object.values(levelStars).reduce((sum, s) => sum + s, 0) || completedLevels.size * 3;
  const completionRatio = Math.round((completedLevels.size / 20) * 100);

  return (
    <View style={styles.outerContainer} onLayout={measureContainer}>
      {/* Üst Gazete Manşet Başlığı */}
      <View style={styles.headerContainer}>
        <View style={styles.headerNavRow}>
          <View style={styles.headerNavLeft}>
            <Pressable
              onPress={onBack}
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] }]}
            >
              <Text style={styles.backBtnText}>‹ ANA MENÜ</Text>
            </Pressable>
          </View>
          <View style={styles.titleWrap}>
            <Text style={styles.newspaperKicker}>NOSTALJİ KELİME BULMACA</Text>
            <Text style={styles.newspaperTitle}>SEVİYE HARİTASI</Text>
          </View>
          <View style={styles.headerNavRight} />
        </View>

        {/* Can & Çip Barı */}
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
            <Text style={styles.statusPillIcon}>{isInfiniteLives ? "⚡" : "💚"}</Text>
            <Text style={[styles.statusPillText, styles.livesPillText, isInfiniteLives && styles.infiniteLivesPillText]}>
              {isInfiniteLives ? "Sonsuz Can" : `${lives}/${MAX_LIVES} Can`}
            </Text>
          </Pressable>
          <View style={[styles.statusPill, styles.scorePill]}>
            <Text style={styles.statusPillIcon}>🪙</Text>
            <Text style={[styles.statusPillText, styles.scorePillText]}>
              {(coins !== undefined ? coins : score).toLocaleString("tr-TR")} Çip
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.levelMapGridContainer} showsVerticalScrollIndicator={false}>
        {/* Kompakt İlerleme & İstatistik Kartı */}
        <View style={styles.mapHeroCard}>
          <View style={styles.compactStatsHeader}>
            <View style={styles.compactStatsLeft}>
              <Text style={styles.compactHeroTitle}>10×10 ÇAPRAZ BULMACA</Text>
              <Text style={styles.compactHeroSub}>20 seviyelik nostalji gazete serisi</Text>
            </View>
            <View style={styles.compactProgressBadge}>
              <Text style={styles.compactProgressPercent}>%{completionRatio}</Text>
            </View>
          </View>

          {/* İlerleme Çubuğu */}
          <View style={styles.compactProgressTrack}>
            <View style={[styles.compactProgressBarFill, { width: `${Math.max(5, completionRatio)}%` }]} />
          </View>

          {/* İstatistik Satırı */}
          <View style={styles.mapStatsRow}>
            <View style={styles.mapStatItem}>
              <Text style={styles.mapStatLabel}>KİLİT AÇIK</Text>
              <Text style={styles.mapStatValue}>{maxUnlockedLevel} / 20</Text>
            </View>
            <View style={styles.statSeparator} />
            <View style={styles.mapStatItem}>
              <Text style={styles.mapStatLabel}>TAMAMLANAN</Text>
              <Text style={styles.mapStatValue}>{completedLevels.size}</Text>
            </View>
            <View style={styles.statSeparator} />
            <View style={styles.mapStatItem}>
              <Text style={styles.mapStatLabel}>TOPLAM YILDIZ</Text>
              <Text style={[styles.mapStatValue, { color: "#D97706" }]}>⭐ {totalEarnedStars}</Text>
            </View>
          </View>
        </View>

        {/* 20 Bölümlük Kart Izgarası */}
        <View style={styles.mapGridRow}>
          {Array.from({ length: 20 }, (_, i) => i + 1).map((lvl) => {
            const isCompleted = completedLevels.has(lvl);
            const isUnlocked = lvl <= maxUnlockedLevel;
            const earnedStars = levelStars[lvl] ?? 3;
            const diffTag = lvl <= 5 ? "KOLAY" : lvl <= 10 ? "ORTA" : lvl <= 15 ? "ZOR" : "USTA";
            const diffColor =
              lvl <= 5
                ? { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0" }
                : lvl <= 10
                ? { bg: "#FEF3C7", text: "#D97706", border: "#FDE68A" }
                : lvl <= 15
                ? { bg: "#FFEDD5", text: "#EA580C", border: "#FED7AA" }
                : { bg: "#F3E8FF", text: "#7C3AED", border: "#DDD6FE" };

            return (
              <Pressable
                key={lvl}
                disabled={!isUnlocked}
                onPress={() => {
                  if (!isInfiniteLives && lives <= 0) {
                    triggerHapticError();
                    playErrorSound();
                    onOpenLivesModal?.();
                    return;
                  }
                  triggerHapticSelection();
                  playSelectionNote(lvl % 7);
                  onSelectLevel(lvl);
                }}
                style={({ pressed }) => [
                  styles.levelCardNode,
                  isCompleted && styles.levelCardCompleted,
                  !isUnlocked && styles.levelCardLocked,
                  pressed && isUnlocked && { opacity: 0.88, transform: [{ scale: 0.96 }] },
                ]}
              >
                {/* Kart Üst Bilgisi: Zorluk Rozeti ve Durum Simgesi */}
                <View style={styles.levelCardTop}>
                  <View style={[styles.levelDiffBadge, { backgroundColor: diffColor.bg, borderColor: diffColor.border }]}>
                    <Text style={[styles.levelDiffBadgeText, { color: diffColor.text }]}>{diffTag}</Text>
                  </View>
                  {isCompleted ? (
                    <Text style={styles.completedStarText}>{"⭐".repeat(earnedStars)}</Text>
                  ) : !isUnlocked ? (
                    <View style={styles.lockIconBadge}>
                      <Text style={styles.lockIconText}>🔒</Text>
                    </View>
                  ) : (
                    <View style={styles.playNowPulseBadge}>
                      <Text style={styles.unlockedBadgeText}>AÇIK</Text>
                    </View>
                  )}
                </View>

                {/* Bölüm Başlığı & Numara Rozeti */}
                <View style={styles.levelCardCenter}>
                  <View style={[styles.levelNumberCircle, isCompleted && styles.levelNumberCircleCompleted, !isUnlocked && styles.levelNumberCircleLocked]}>
                    <Text style={[styles.levelNumberCircleText, isCompleted && styles.levelNumberCircleTextCompleted, !isUnlocked && styles.levelNumberCircleTextLocked]}>
                      {lvl}
                    </Text>
                  </View>
                  <View style={styles.levelCardTitles}>
                    <Text style={[styles.levelNumberText, !isUnlocked && styles.levelNumberLockedText]}>
                      BÖLÜM {lvl}
                    </Text>
                    <Text style={styles.levelGridSizeSub}>10×10 Izgara</Text>
                  </View>
                </View>

                {/* Kart Altı Eylem Butonu */}
                <View style={[styles.levelCardFooter, isCompleted && styles.levelCardFooterCompleted, !isUnlocked && styles.levelCardFooterLocked]}>
                  <Text style={[styles.levelCardFooterText, isCompleted && styles.levelCardFooterCompletedText, !isUnlocked && styles.levelCardFooterLockedText]}>
                    {isCompleted ? "✓ TAMAMLANDI" : isUnlocked ? "BAŞLA ➔" : "KİLİTLİ"}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

