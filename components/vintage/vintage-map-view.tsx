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
  levelIndex: _levelIndex,
  onSelectLevel,
}: VintageMapViewProps) {
  return (
    <View style={styles.outerContainer} onLayout={measureContainer}>
      {/* Üst Başlık */}
      <View style={styles.headerContainer}>
        <View style={styles.headerNavRow}>
          <View style={styles.headerNavLeft}>
            <Pressable onPress={onBack} style={styles.backBtn}>
              <Text style={styles.backBtnText}>‹ ANA MENÜ</Text>
            </Pressable>
          </View>
          <View style={styles.titleWrap}>
            <Text style={styles.newspaperKicker}>NOSTALJİ KELİME BULMACA</Text>
            <Text style={styles.newspaperTitle}>SEVİYE HARİTASI</Text>
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
          <View style={[styles.statusPill, styles.scorePill]}>
            <Text style={styles.statusPillIcon}>🪙</Text>
            <Text style={[styles.statusPillText, styles.scorePillText]}>{coins !== undefined ? coins : score}</Text>
          </View>
        </View>
      </View>

      {/* Harita Başlık Kartı */}
      <View style={styles.mapHeroCard}>
        <Text style={styles.mapHeroTitle}>🗞️ GAZETE KARE BULMACA SERİSİ</Text>
        <Text style={styles.mapHeroSubtitle}>
          Zorluğu kademeli olarak artan 20 özel bulmaca seviyesi. Kilitleri açmak için bulmacaları çöz!
        </Text>
        <View style={styles.mapStatsRow}>
          <View style={styles.mapStatItem}>
            <Text style={styles.mapStatValue}>{maxUnlockedLevel}/20</Text>
            <Text style={styles.mapStatLabel}>KİLİT AÇIK</Text>
          </View>
          <View style={styles.mapStatItem}>
            <Text style={styles.mapStatValue}>{completedLevels.size}</Text>
            <Text style={styles.mapStatLabel}>TAMAMLANDI</Text>
          </View>
          <View style={styles.mapStatItem}>
            <Text style={styles.mapStatValue}>⭐ {completedLevels.size * 3}</Text>
            <Text style={styles.mapStatLabel}>TOPLAM YILDIZ</Text>
          </View>
        </View>
      </View>

      {/* Seviye Kartları Izgarası */}
      <ScrollView contentContainerStyle={styles.levelMapGridContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.mapGridRow}>
          {Array.from({ length: 20 }, (_, i) => i + 1).map((lvl) => {
            const isCompleted = completedLevels.has(lvl);
            const isUnlocked = lvl <= maxUnlockedLevel;
            const diffTag = lvl <= 5 ? "KOLAY" : lvl <= 10 ? "ORTA" : lvl <= 15 ? "ZOR" : "ULTRA ZOR";
            const diffColor = lvl <= 5 ? "#F0F5ED" : lvl <= 10 ? "#F59E0B" : lvl <= 15 ? "#F97316" : "#8B5CF6";

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
                  pressed && isUnlocked && { opacity: 0.8, transform: [{ scale: 0.96 }] },
                ]}
              >
                <View style={styles.levelCardTop}>
                  <Text style={[styles.levelDiffBadge, { backgroundColor: diffColor }]}>{diffTag}</Text>
                  {isCompleted ? (
                    <Text style={styles.completedStarText}>⭐⭐⭐</Text>
                  ) : !isUnlocked ? (
                    <Text style={styles.lockIconText}>🔒</Text>
                  ) : (
                    <Text style={styles.unlockedBadgeText}>AÇIK</Text>
                  )}
                </View>

                <Text style={[styles.levelNumberText, !isUnlocked && styles.levelNumberLockedText]}>
                  BÖLÜM {lvl}
                </Text>

                <Text style={[styles.levelCardFooterText, isCompleted && { color: "#293541" }]}>
                  {isCompleted ? "✓ TAMAMLANDI" : isUnlocked ? "OYNA ➔" : "KİLİTLİ"}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
