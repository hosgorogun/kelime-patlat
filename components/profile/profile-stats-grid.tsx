import React from "react";
import { View, Text } from "react-native";
import type { PlayerProgress } from "@/shared/progression";
import { styles } from "./profile.styles";

export type ProfileStatsGridProps = {
  progress: PlayerProgress;
  totalMatches: number;
  winRate: number;
  wordPoolCount: number;
  longestWord: string;
};

export const ProfileStatsGrid = React.memo(({
  progress,
  totalMatches,
  winRate,
  wordPoolCount,
  longestWord,
}: ProfileStatsGridProps) => {
  return (
    <>
      {/* 2. KARİYER İSTATİSTİKLERİ */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Oyun istatistiklerin</Text>
        <Text style={styles.sectionMeta}>BUGÜNE KADAR</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statTile, styles.statTileWins]}>
          <View style={[styles.statIconBox, { backgroundColor: "#FFF4DC", borderColor: "#FFE2A0" }]}>
            <Text style={styles.statIcon}>🏆</Text>
          </View>
          <View style={styles.statDataWrap}>
            <Text style={styles.statNumber}>{progress.wins ?? 0}</Text>
            <Text style={styles.statCaption}>GALİBİYET</Text>
          </View>
        </View>

        <View style={[styles.statTile, styles.statTileMatches]}>
          <View style={[styles.statIconBox, { backgroundColor: "#EEF7FF", borderColor: "#CCE5FF" }]}>
            <Text style={styles.statIcon}>⚔️</Text>
          </View>
          <View style={styles.statDataWrap}>
            <Text style={styles.statNumber}>{totalMatches}</Text>
            <Text style={styles.statCaption}>TOPLAM MAÇ</Text>
          </View>
        </View>

        <View style={[styles.statTile, styles.statTileWinRate]}>
          <View style={[styles.statIconBox, { backgroundColor: "#F5F0FF", borderColor: "#E5D9FD" }]}>
            <Text style={styles.statIcon}>📈</Text>
          </View>
          <View style={styles.statDataWrap}>
            <Text style={styles.statNumber}>%{winRate}</Text>
            <Text style={styles.statCaption}>KAZANMA ORANI</Text>
          </View>
        </View>

        <View style={[styles.statTile, styles.statTileScore]}>
          <View style={[styles.statIconBox, { backgroundColor: "#EAF8F2", borderColor: "#BCE9D7" }]}>
            <Text style={styles.statIcon}>⚡</Text>
          </View>
          <View style={styles.statDataWrap}>
            <Text style={styles.statNumber}>{progress.bestScore ?? 0}</Text>
            <Text style={styles.statCaption}>EN İYİ SKOR</Text>
          </View>
        </View>
      </View>

      {/* Mini Intel HUD Strip */}
      <View style={styles.intelStrip}>
        <View style={styles.intelCell}>
          <Text style={styles.intelLabel}>🔥 AKTİF SERİ</Text>
          <Text style={[styles.intelValue, { color: "#bd5564" }]}>
            {progress.streak ?? 0} <Text style={styles.intelSub}>GÜN</Text>
          </Text>
        </View>
        <View style={styles.intelDivider} />
        <View style={styles.intelCell}>
          <Text style={styles.intelLabel}>⚡ TEMPO</Text>
          <Text style={styles.intelValue}>
            {progress.bestTempo || "—"} <Text style={styles.intelSub}>K/DK</Text>
          </Text>
        </View>
        <View style={styles.intelDivider} />
        <View style={styles.intelCell}>
          <Text style={styles.intelLabel}>📚 KELİMELER</Text>
          <Text style={[styles.intelValue, { color: "#279f73" }]}>{wordPoolCount}</Text>
        </View>
        <View style={styles.intelDivider} />
        <View style={styles.intelCell}>
          <Text style={styles.intelLabel}>🎯 EN UZUN</Text>
          <Text numberOfLines={1} style={[styles.intelValue, { color: "#98732c" }]}>
            {longestWord}
          </Text>
        </View>
        <View style={styles.intelDivider} />
        <View style={styles.intelCell}>
          <Text style={styles.intelLabel}>🌟 TOPLAM XP</Text>
          <Text style={[styles.intelValue, { color: "#2a9c7a" }]}>{progress.xp}</Text>
        </View>
      </View>
    </>
  );
});

ProfileStatsGrid.displayName = "ProfileStatsGrid";
