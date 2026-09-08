import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { getLeagueTier, getRank, getSeasonRemainingTime, type LeagueTierInfo, type PlayerProgress } from "@/shared/progression";
import { type LeaderboardEntry } from "@/shared/game";
import { triggerHapticSelection } from "@/shared/audio-haptics";

const RANK_IMAGES: Record<string, any> = {
  DEMİR: require("../assets/ranks/iron.jpg"),
  BRONZ: require("../assets/ranks/bronze.jpg"),
  GÜMÜŞ: require("../assets/ranks/silver.jpg"),
  ALTIN: require("../assets/ranks/gold.jpg"),
  PLATİN: require("../assets/ranks/platinum.jpg"),
  ELMAS: require("../assets/ranks/diamond.jpg"),
  YÜCELİK: require("../assets/ranks/ascendant.jpg"),
  ÖLÜMSÜZLÜK: require("../assets/ranks/immortal.jpg"),
  RADIAN: require("../assets/ranks/radian.jpg"),
};

const LEAGUES: LeagueTierInfo[] = [
  { name: "DEMİR LİGİ", tier: "DEMİR", icon: "🛡️", image: "", color: "#94A3B8", badge: "DEMİR", minPoints: 0, maxPoints: 349, currentTierPoints: 0, targetTierPoints: 350, totalPoints: 0 },
  { name: "BRONZ LİGİ", tier: "BRONZ", icon: "🛡️", image: "", color: "#F97316", badge: "BRONZ", minPoints: 350, maxPoints: 899, currentTierPoints: 0, targetTierPoints: 550, totalPoints: 0 },
  { name: "GÜMÜŞ LİGİ", tier: "GÜMÜŞ", icon: "🛡️", image: "", color: "#38BDF8", badge: "GÜMÜŞ", minPoints: 900, maxPoints: 1599, currentTierPoints: 0, targetTierPoints: 700, totalPoints: 0 },
  { name: "ALTIN LİGİ", tier: "ALTIN", icon: "🦅", image: "", color: "#FBBF24", badge: "ALTIN", minPoints: 1600, maxPoints: 2499, currentTierPoints: 0, targetTierPoints: 900, totalPoints: 0 },
  { name: "PLATİN LİGİ", tier: "PLATİN", icon: "🪽", image: "", color: "#67E8F9", badge: "PLATİN", minPoints: 2500, maxPoints: 3599, currentTierPoints: 0, targetTierPoints: 1100, totalPoints: 0 },
  { name: "ELMAS LİGİ", tier: "ELMAS", icon: "💎", image: "", color: "#60A5FA", badge: "ELMAS", minPoints: 3600, maxPoints: 4999, currentTierPoints: 0, targetTierPoints: 1400, totalPoints: 0 },
  { name: "YÜCELİK LİGİ", tier: "YÜCELİK", icon: "🔮", image: "", color: "#C084FC", badge: "YÜCELİK", minPoints: 5000, maxPoints: 6999, currentTierPoints: 0, targetTierPoints: 2000, totalPoints: 0 },
  { name: "ÖLÜMSÜZLÜK LİGİ", tier: "ÖLÜMSÜZLÜK", icon: "🔥", image: "", color: "#FB7185", badge: "ÖLÜMSÜZLÜK", minPoints: 7000, maxPoints: 9999, currentTierPoints: 0, targetTierPoints: 3000, totalPoints: 0 },
  { name: "RADIAN LİGİ", tier: "RADIAN", icon: "👑", image: "", color: "#FDE047", badge: "RADIAN", minPoints: 10000, maxPoints: Number.POSITIVE_INFINITY, currentTierPoints: 0, targetTierPoints: 1000, totalPoints: 0 },
];

export function LeagueHub({ playerId, progress, leaderboard, onBack }: { playerId: string; progress: PlayerProgress; leaderboard: LeaderboardEntry[]; onBack: () => void }) {
  const current = getLeagueTier(progress);
  const rank = getRank(progress);
  const playerRank = leaderboard.findIndex((entry) => entry.id === playerId) + 1;
  const currentIndex = LEAGUES.findIndex((league) => league.tier === current.tier);
  const progressRatio = current.targetTierPoints > 0
    ? Math.min(1, current.currentTierPoints / current.targetTierPoints)
    : 1;

  const remaining = getSeasonRemainingTime();

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header Bar */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.overline}>SEZON REKABET HATTI</Text>
          <Text style={styles.title}>LİGLER & KADEMELER</Text>
        </View>
        <View style={styles.timerPill}>
          <Text style={styles.timerIcon}>⏳</Text>
          <View>
            <Text style={styles.timerLabel}>SIFIRLANMA</Text>
            <Text style={styles.timerValue}>{remaining.formatted}</Text>
          </View>
        </View>
      </View>



      {/* Hero Rank Banner */}
      <View style={[styles.heroCard, { borderColor: `${current.color}66`, shadowColor: current.color }]}>
        <View style={styles.heroHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: current.color }} />
            <Text style={styles.heroKicker}>MEVCUT SEZON KONUMUN</Text>
          </View>
          <View style={[styles.heroBadge, { backgroundColor: `${current.color}20`, borderColor: `${current.color}66` }]}>
            <Text style={[styles.heroBadgeText, { color: current.color }]}>{current.badge}</Text>
          </View>
        </View>

        <View style={styles.heroContent}>
          {/* Main 3D Emblem Hero Icon */}
          <View style={[styles.heroEmblemContainer, { borderColor: current.color, shadowColor: current.color }]}>
            {RANK_IMAGES[current.tier] ? (
              <Image source={RANK_IMAGES[current.tier]} style={{ width: 68, height: 68, borderRadius: 20 }} resizeMode="cover" />
            ) : (
              <Text style={{ fontSize: 36 }}>{current.icon}</Text>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.heroLeagueTitle, { color: current.color }]}>{current.name}</Text>
            <Text style={styles.heroTitle}>{rank} AVCI</Text>
            <Text style={styles.heroBody}>
              {progress.xp} XP · {progress.wins} galibiyet · {progress.bestScore || 0} tur rekoru
            </Text>
          </View>
        </View>

        {/* LP Progress Bar inside Hero */}
        <View style={{ marginTop: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <Text style={styles.progressLabel}>
              {current.tier === "RADIAN" ? "Zirve kademedesin" : `İlerleme: ${current.currentTierPoints} / ${current.targetTierPoints} LP`}
            </Text>
            {current.tier !== "RADIAN" && (
              <Text style={[styles.progressPercent, { color: current.color }]}>%{Math.round(progressRatio * 100)}</Text>
            )}
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.max(6, progressRatio * 100)}%`, backgroundColor: current.color, shadowColor: current.color }]} />
          </View>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.heroStats}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>LİDERLİK</Text>
            <Text style={styles.statValue}>{playerRank > 0 ? `#${playerRank}` : "—"}</Text>
          </View>
          <View style={styles.statRule} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>SERİ & KALKAN</Text>
            <Text style={styles.statValue}>{progress.streak} GÜN 🛡️{progress.streakShields ?? 1}</Text>
          </View>
          <View style={styles.statRule} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>EN İYİ TEMPO</Text>
            <Text style={styles.statValue}>{progress.bestTempo ? `${progress.bestTempo}/dk` : "—"}</Text>
          </View>
        </View>
      </View>

      {/* League Ladder Section */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>LİG MERDİVENİ</Text>
          <Text style={styles.sectionSubtitle}>LP biriktir, 3D kademe amblemlerinin kilidini aç</Text>
        </View>
        <View style={styles.stepCounter}>
          <Text style={styles.stepCounterValue}>{currentIndex + 1}</Text>
          <Text style={styles.stepCounterSlash}>/</Text>
          <Text style={styles.stepCounterTotal}>{LEAGUES.length}</Text>
        </View>
      </View>

      {/* Ladder List */}
      <View style={styles.list}>
        {LEAGUES.map((league, index) => {
          const isCurrent = league.tier === current.tier;
          const isUnlocked = index <= currentIndex;
          const imgSource = RANK_IMAGES[league.tier];
          return (
            <View key={league.tier} style={styles.leagueItem}>
              {index < LEAGUES.length - 1 && (
                <View style={[styles.connector, { backgroundColor: index < currentIndex ? league.color : "#271E42" }]} />
              )}
              <Pressable
                onPress={() => triggerHapticSelection()}
                style={({ pressed }) => [
                  styles.leagueRow,
                  isCurrent && { borderColor: league.color, backgroundColor: `${league.color}15`, shadowColor: league.color, shadowOpacity: 0.35, shadowRadius: 10, elevation: 4 },
                  isUnlocked && !isCurrent && { borderColor: `${league.color}44` },
                  pressed && styles.pressed,
                ]}
              >
                {/* 3D Rank Badge Box */}
                <View style={[
                  styles.leagueIcon,
                  {
                    borderColor: isUnlocked ? league.color : "#3A305A",
                    backgroundColor: isUnlocked ? `${league.color}20` : "#130E26",
                    shadowColor: isUnlocked ? league.color : "transparent",
                    shadowOpacity: isUnlocked ? 0.3 : 0,
                    shadowRadius: 6,
                    elevation: isUnlocked ? 3 : 0,
                  }
                ]}>
                  {imgSource ? (
                    <Image source={imgSource} style={{ width: 44, height: 44, borderRadius: 12, opacity: isUnlocked ? 1 : 0.3 }} resizeMode="cover" />
                  ) : (
                    <Text style={[styles.leagueIconText, { color: isUnlocked ? league.color : "#665A80" }]}>{isUnlocked ? league.icon : "-"}</Text>
                  )}
                </View>

                {/* Step Number */}
                <View style={[styles.leagueNumber, { backgroundColor: isUnlocked ? `${league.color}25` : "#1E1836" }]}>
                  <Text style={[styles.leagueNumberText, { color: isUnlocked ? league.color : "#665A80" }]}>{String(index + 1).padStart(2, "0")}</Text>
                </View>

                {/* Info Copy */}
                <View style={styles.leagueCopy}>
                  <Text style={[styles.leagueName, { color: isUnlocked ? (isCurrent ? "#FFFFFF" : league.color) : "#6B5F88" }]}>{league.name}</Text>
                  <Text style={styles.leagueRange}>
                    {league.maxPoints === Number.POSITIVE_INFINITY ? `${league.minPoints}+ LP` : `${league.minPoints} - ${league.maxPoints} LP`}
                  </Text>
                </View>

                {/* Status Pill */}
                {isCurrent ? (
                  <View style={[styles.statusPill, { backgroundColor: league.color }]}>
                    <Text style={styles.statusPillTextCurrent}>BURADASIN</Text>
                  </View>
                ) : isUnlocked ? (
                  <View style={[styles.statusPill, { backgroundColor: `${league.color}20`, borderWidth: 1, borderColor: `${league.color}55` }]}>
                    <Text style={[styles.statusPillTextUnlocked, { color: league.color }]}>AÇIK</Text>
                  </View>
                ) : (
                  <View style={[styles.statusPill, { backgroundColor: "rgba(255,255,255,0.05)" }]}>
                    <Text style={styles.statusPillTextLocked}>KİLİTLİ</Text>
                  </View>
                )}
              </Pressable>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 110, backgroundColor: "#0C081A" },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  backButton: { width: 44, height: 44, borderRadius: 16, backgroundColor: "#1C1538", borderWidth: 1, borderColor: "rgba(148, 163, 184, 0.15)", alignItems: "center", justifyContent: "center", marginRight: 12 },
  backText: { color: "#FFF9FC", fontSize: 32, lineHeight: 34, marginTop: -3 },
  headerCopy: { flex: 1 },
  overline: { color: "#94A3B8", fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: "#FFFFFF", fontSize: 24, fontWeight: "900", letterSpacing: 0.5, marginTop: 2 },
  timerPill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#1C1538", borderWidth: 1, borderColor: "rgba(251, 191, 36, 0.3)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  timerIcon: { fontSize: 13 },
  timerLabel: { color: "#FBBF24", fontSize: 8, fontWeight: "900", letterSpacing: 0.8 },
  timerValue: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  
  heroCard: { marginTop: 10, padding: 18, borderRadius: 26, backgroundColor: "#1D163B", borderWidth: 1.5, borderColor: "#5C4B90", shadowColor: "#5C4B90", shadowOpacity: 0.2, shadowRadius: 12, elevation: 4 },
  heroHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  heroBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  heroBadgeText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  heroContent: { flexDirection: "row", alignItems: "center", gap: 14 },
  heroEmblemContainer: { width: 72, height: 72, borderRadius: 22, borderWidth: 2, backgroundColor: "rgba(0,0,0,0.3)", alignItems: "center", justifyContent: "center", overflow: "hidden", shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  heroLeagueTitle: { fontSize: 13, fontWeight: "900", letterSpacing: 0.8, marginBottom: 2 },
  heroKicker: { color: "#FFD37F", fontSize: 9, letterSpacing: 1.2, fontWeight: "900" },
  heroTitle: { color: "#FFFFFF", fontSize: 22, fontWeight: "900", letterSpacing: 0.4 },
  heroBody: { color: "#CBD5E1", fontSize: 11, fontWeight: "700", marginTop: 2 },
  heroStats: { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statBox: { alignItems: "center" },
  statLabel: { color: "#94A3B8", fontSize: 8, fontWeight: "900", letterSpacing: 0.8 },
  statValue: { color: "#FFFFFF", fontSize: 13, fontWeight: "900", marginTop: 3 },
  statRule: { width: 1, height: 26, backgroundColor: "rgba(255,255,255,0.12)" },
  
  currentCard: { borderWidth: 2, borderRadius: 24, padding: 18, marginTop: 14, backgroundColor: "#150F2D", shadowOpacity: 0.25, shadowRadius: 16, elevation: 6 },
  currentCardHeader: { flexDirection: "row", alignItems: "center" },
  currentIcon: { width: 58, height: 58, borderRadius: 18, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  currentIconText: { fontSize: 26, fontWeight: "900" },
  currentCopy: { flex: 1, marginLeft: 14 },
  currentKicker: { color: "#94A3B8", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  currentName: { fontSize: 20, fontWeight: "900", marginTop: 2 },
  currentMeta: { color: "#CBD5E1", fontSize: 11, fontWeight: "700", marginTop: 3 },
  currentBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  currentBadgeText: { color: "#0B132B", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  progressTrack: { width: "100%", height: 10, borderRadius: 5, backgroundColor: "rgba(255,255,255,0.08)", marginTop: 16, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 5, shadowOpacity: 0.5, shadowRadius: 6 },
  progressLabel: { color: "#94A3B8", fontSize: 11, fontWeight: "800" },
  progressPercent: { fontSize: 11, fontWeight: "900" },
  
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 26, marginBottom: 14 },
  sectionTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "900", letterSpacing: 0.8 },
  sectionSubtitle: { color: "#94A3B8", fontSize: 10, marginTop: 3, fontWeight: "700" },
  stepCounter: { flexDirection: "row", alignItems: "baseline", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: "#1C1538", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  stepCounterValue: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  stepCounterSlash: { color: "#64748B", fontSize: 11, marginHorizontal: 2 },
  stepCounterTotal: { color: "#94A3B8", fontSize: 11, fontWeight: "800" },
  
  list: { gap: 10 },
  leagueItem: { position: "relative" },
  connector: { position: "absolute", left: 34, top: 68, bottom: -10, width: 2, zIndex: 0 },
  leagueRow: { minHeight: 74, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.08)", borderRadius: 20, backgroundColor: "#140E2A", paddingHorizontal: 12, paddingVertical: 10, flexDirection: "row", alignItems: "center", zIndex: 1 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  leagueIcon: { width: 48, height: 48, borderRadius: 14, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  leagueIconText: { fontSize: 22, fontWeight: "900" },
  leagueNumber: { width: 28, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center", marginLeft: 10 },
  leagueNumberText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  leagueCopy: { flex: 1, marginLeft: 12 },
  leagueName: { fontSize: 15, fontWeight: "900", letterSpacing: 0.4 },
  leagueRange: { color: "#94A3B8", fontSize: 11, fontWeight: "700", marginTop: 3 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statusPillTextCurrent: { color: "#0B132B", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  statusPillTextUnlocked: { fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  statusPillTextLocked: { color: "#64748B", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
});
