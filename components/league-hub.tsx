import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { getLeagueTier, getRank, type LeagueTierInfo, type PlayerProgress } from "@/shared/progression";
import { type LeaderboardEntry } from "@/shared/game";
import { triggerHapticSelection } from "@/shared/audio-haptics";

const LEAGUES: LeagueTierInfo[] = [
  { name: "DEMİR LİGİ", tier: "DEMİR", icon: "D", color: "#94A3B8", badge: "DEMİR", minPoints: 0, maxPoints: 349, currentTierPoints: 0, targetTierPoints: 350, totalPoints: 0 },
  { name: "BRONZ LİGİ", tier: "BRONZ", icon: "B", color: "#F97316", badge: "BRONZ", minPoints: 350, maxPoints: 899, currentTierPoints: 0, targetTierPoints: 550, totalPoints: 0 },
  { name: "GÜMÜŞ LİGİ", tier: "GÜMÜŞ", icon: "G", color: "#38BDF8", badge: "GÜMÜŞ", minPoints: 900, maxPoints: 1599, currentTierPoints: 0, targetTierPoints: 700, totalPoints: 0 },
  { name: "ALTIN LİGİ", tier: "ALTIN", icon: "A", color: "#FBBF24", badge: "ALTIN", minPoints: 1600, maxPoints: 2499, currentTierPoints: 0, targetTierPoints: 900, totalPoints: 0 },
  { name: "PLATİN LİGİ", tier: "PLATİN", icon: "P", color: "#67E8F9", badge: "PLATİN", minPoints: 2500, maxPoints: 3599, currentTierPoints: 0, targetTierPoints: 1100, totalPoints: 0 },
  { name: "ELMAS LİGİ", tier: "ELMAS", icon: "◇", color: "#60A5FA", badge: "ELMAS", minPoints: 3600, maxPoints: 4999, currentTierPoints: 0, targetTierPoints: 1400, totalPoints: 0 },
  { name: "YÜCELİK LİGİ", tier: "YÜCELİK", icon: "Y", color: "#C084FC", badge: "YÜCELİK", minPoints: 5000, maxPoints: 6999, currentTierPoints: 0, targetTierPoints: 2000, totalPoints: 0 },
  { name: "ÖLÜMSÜZLÜK LİGİ", tier: "ÖLÜMSÜZLÜK", icon: "Ö", color: "#FB7185", badge: "ÖLÜMSÜZLÜK", minPoints: 7000, maxPoints: 9999, currentTierPoints: 0, targetTierPoints: 3000, totalPoints: 0 },
  { name: "RADIAN LİGİ", tier: "RADIAN", icon: "R", color: "#FDE047", badge: "RADIAN", minPoints: 10000, maxPoints: Number.POSITIVE_INFINITY, currentTierPoints: 0, targetTierPoints: 1000, totalPoints: 0 },
];

export function LeagueHub({ playerId, progress, leaderboard, onBack }: { playerId: string; progress: PlayerProgress; leaderboard: LeaderboardEntry[]; onBack: () => void }) {
  const current = getLeagueTier(progress);
  const rank = getRank(progress);
  const playerRank = leaderboard.findIndex((entry) => entry.id === playerId) + 1;
  const currentIndex = LEAGUES.findIndex((league) => league.tier === current.tier);
  const progressRatio = current.targetTierPoints > 0
    ? Math.min(1, current.currentTierPoints / current.targetTierPoints)
    : 1;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.overline}>SEZON 01 · REKABET HATTI</Text>
          <Text style={styles.title}>LİGLER</Text>
        </View>
        <View style={[styles.seasonBadge, { borderColor: `${current.color}88`, backgroundColor: `${current.color}18` }]}>
          <View style={[styles.emblem, { borderColor: current.color, backgroundColor: `${current.color}25` }]}>
            <Text style={[styles.seasonBadgeIcon, { color: current.color }]}>{current.icon}</Text>
          </View>
          <Text style={[styles.seasonBadgeText, { color: current.color }]}>{current.tier}</Text>
        </View>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroTopline}>
          <Text style={styles.heroKicker}>SEZON KONUMUN</Text>
          <Text style={[styles.heroLeague, { color: current.color }]}>{current.name}</Text>
        </View>
        <Text style={styles.heroTitle}>{rank} AVCI</Text>
        <Text style={styles.heroBody}>
          {progress.xp} XP · {progress.wins} galibiyet · {progress.bestScore || 0} en iyi tur puanı
        </Text>
        <View style={styles.heroStats}>
          <View>
            <Text style={styles.statLabel}>LİDERLİK</Text>
            <Text style={styles.statValue}>{playerRank > 0 ? `#${playerRank}` : "—"}</Text>
          </View>
          <View style={styles.statRule} />
          <View>
            <Text style={styles.statLabel}>SERİ & KALKAN</Text>
            <Text style={styles.statValue}>{progress.streak} GÜN 🛡️{progress.streakShields ?? 1}</Text>
          </View>
          <View style={styles.statRule} />
          <View>
            <Text style={styles.statLabel}>TEMPO</Text>
            <Text style={styles.statValue}>{progress.bestTempo || "—"}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.currentCard, { borderColor: `${current.color}88`, shadowColor: current.color }]}>
        <View style={[styles.currentIcon, { backgroundColor: `${current.color}1F`, borderColor: current.color }]}>
          <View style={[styles.emblemLarge, { borderColor: current.color, backgroundColor: `${current.color}25` }]}>
            <Text style={[styles.currentIconText, { color: current.color }]}>{current.icon}</Text>
          </View>
        </View>
        <View style={styles.currentCopy}>
          <Text style={styles.currentKicker}>MEVCUT LİGİN</Text>
          <Text style={[styles.currentName, { color: current.color }]}>{current.name}</Text>
          <Text style={styles.currentMeta}>{current.totalPoints} LP · {progress.wins} galibiyet</Text>
        </View>
        <View style={[styles.currentBadge, { backgroundColor: current.color }]}>
          <Text style={styles.currentBadgeText}>{current.badge}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.max(4, progressRatio * 100)}%`, backgroundColor: current.color }]} />
        </View>
        <Text style={styles.progressLabel}>
          {current.tier === "RADIAN" ? "Zirve ligi" : `${current.currentTierPoints} / ${current.targetTierPoints} LP · Sonraki lige ilerle`}
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>LİG MERDİVENİ</Text>
          <Text style={styles.sectionSubtitle}>LP biriktir, bir sonraki rozete yüksel</Text>
        </View>
        <View style={styles.stepCounter}>
          <Text style={styles.stepCounterValue}>{currentIndex + 1}</Text>
          <Text style={styles.stepCounterSlash}>/</Text>
          <Text style={styles.stepCounterTotal}>{LEAGUES.length}</Text>
        </View>
      </View>

      <View style={styles.list}>
        {LEAGUES.map((league, index) => {
          const isCurrent = league.tier === current.tier;
          const isUnlocked = index <= currentIndex;
          return (
            <View key={league.tier} style={styles.leagueItem}>
              {index < LEAGUES.length - 1 && <View style={[styles.connector, { backgroundColor: index < currentIndex ? league.color : "#30284B" }]} />}
              <Pressable
                onPress={() => triggerHapticSelection()}
                style={({ pressed }) => [styles.leagueRow, isCurrent && { borderColor: league.color, backgroundColor: `${league.color}12`, shadowColor: league.color }, pressed && styles.pressed]}
              >
              <View style={[styles.leagueIcon, { borderColor: isUnlocked ? league.color : "#403664", backgroundColor: isUnlocked ? `${league.color}18` : "#171329" }]}>
                <Text style={[styles.leagueIconText, { color: isUnlocked ? league.color : "#665A80" }]}>{isUnlocked ? league.icon : "-"}</Text>
              </View>
              <View style={[styles.leagueNumber, { backgroundColor: isUnlocked ? `${league.color}20` : "#211B37" }]}>
                <Text style={[styles.leagueNumberText, { color: isUnlocked ? league.color : "#665A80" }]}>{String(index + 1).padStart(2, "0")}</Text>
              </View>
              <View style={styles.leagueCopy}>
                <Text style={[styles.leagueName, { color: isUnlocked ? league.color : "#847A9B" }]}>{league.name}</Text>
                <Text style={styles.leagueRange}>
                  {league.maxPoints === Number.POSITIVE_INFINITY ? `${league.minPoints}+ LP` : `${league.minPoints} - ${league.maxPoints} LP`}
                </Text>
              </View>
              {isCurrent ? <Text style={[styles.status, { color: league.color }]}>BURADASIN</Text> : isUnlocked ? <Text style={styles.status}>AÇIK</Text> : <Text style={styles.status}>KİLİTLİ</Text>}
              </Pressable>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 108, backgroundColor: "#0C091C" },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#201B3A", alignItems: "center", justifyContent: "center", marginRight: 12 },
  backText: { color: "#FFF9FC", fontSize: 32, lineHeight: 34, marginTop: -3 },
  headerCopy: { flex: 1 },
  overline: { color: "#8E82A8", fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  title: { color: "#FFF9FC", fontSize: 28, fontWeight: "900", letterSpacing: 0.5, marginTop: 3 },
  seasonBadge: { minWidth: 72, height: 48, borderRadius: 15, borderWidth: 1, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  emblem: { width: 29, height: 29, borderRadius: 9, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  seasonBadgeIcon: { fontSize: 15, fontWeight: "900" },
  seasonBadgeText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  hero: { marginTop: 14, padding: 18, borderRadius: 24, backgroundColor: "#34275E", borderWidth: 1, borderColor: "#7B63C9", overflow: "hidden" },
  heroTopline: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heroKicker: { color: "#FFD37F", fontSize: 8, letterSpacing: 1, fontWeight: "900" },
  heroLeague: { fontSize: 9, fontWeight: "900", letterSpacing: 0.6 },
  heroTitle: { color: "#FFF9FC", fontSize: 25, fontWeight: "900", marginTop: 6 },
  heroBody: { color: "#D8CDEB", fontSize: 11, marginTop: 4 },
  heroStats: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#5B4B90", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statLabel: { color: "#BEB1D7", fontSize: 7, fontWeight: "900", letterSpacing: 0.7 },
  statValue: { color: "#FFF9FC", fontSize: 14, fontWeight: "900", marginTop: 3 },
  statRule: { width: 1, height: 27, backgroundColor: "#5C4D90" },
  currentCard: { borderWidth: 1.5, borderRadius: 20, padding: 16, marginTop: 12, backgroundColor: "#171329", flexDirection: "row", alignItems: "center", flexWrap: "wrap", shadowOpacity: 0.18, shadowRadius: 18, elevation: 5 },
  currentIcon: { width: 64, height: 64, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  emblemLarge: { width: 48, height: 48, borderRadius: 15, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  currentIconText: { fontSize: 26, fontWeight: "900" },
  currentCopy: { flex: 1, minWidth: 150, marginLeft: 14 },
  currentKicker: { color: "#8E82A8", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  currentName: { fontSize: 21, fontWeight: "900", marginTop: 3 },
  currentMeta: { color: "#B9AFCE", fontSize: 12, marginTop: 4 },
  currentBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 },
  currentBadgeText: { color: "#0C091C", fontSize: 9, fontWeight: "900" },
  progressTrack: { width: "100%", height: 8, borderRadius: 4, backgroundColor: "#2A2247", marginTop: 16, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  progressLabel: { width: "100%", color: "#B9AFCE", fontSize: 11, marginTop: 7 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 25, marginBottom: 11 },
  sectionTitle: { color: "#FFF9FC", fontSize: 14, fontWeight: "900", letterSpacing: 0.8 },
  sectionSubtitle: { color: "#81769D", fontSize: 10, marginTop: 4 },
  stepCounter: { flexDirection: "row", alignItems: "baseline", paddingHorizontal: 9, paddingVertical: 6, borderRadius: 9, backgroundColor: "#211A39" },
  stepCounterValue: { color: "#FFF9FC", fontSize: 15, fontWeight: "900" },
  stepCounterSlash: { color: "#665A80", fontSize: 11, marginHorizontal: 2 },
  stepCounterTotal: { color: "#8E82A8", fontSize: 11, fontWeight: "800" },
  list: { gap: 8 },
  leagueItem: { position: "relative" },
  connector: { position: "absolute", left: 31, top: 62, bottom: -8, width: 2, zIndex: 0 },
  leagueRow: { minHeight: 68, borderWidth: 1, borderColor: "#2E274B", borderRadius: 16, backgroundColor: "#151126", padding: 10, flexDirection: "row", alignItems: "center", zIndex: 1, shadowOpacity: 0, shadowRadius: 12, elevation: 0 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  leagueIcon: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  leagueIconText: { fontSize: 21, fontWeight: "900" },
  leagueNumber: { width: 28, height: 24, borderRadius: 7, alignItems: "center", justifyContent: "center", marginLeft: 9 },
  leagueNumberText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  leagueCopy: { flex: 1, marginLeft: 12 },
  leagueName: { fontSize: 15, fontWeight: "900" },
  leagueRange: { color: "#8E82A8", fontSize: 11, marginTop: 4 },
  status: { color: "#8E82A8", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
});
