import { useState, useRef, useEffect, useMemo } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import {
  LEAGUE_TIERS,
  LEAGUE_REWARDS,
  getLeagueTier,
  getSeasonRemainingTime,
  getMinLpForTier,
  type LeagueTierInfo,
  type PlayerProgress,
} from "@/shared/progression";
import { type LeaderboardEntry } from "@/shared/game";
import { triggerHapticSelection, triggerHapticSuccess } from "@/shared/audio-haptics";

const RANK_IMAGES: Record<string, any> = {
  DEMİR: require("../../assets/ranks/iron.png"),
  BRONZ: require("../../assets/ranks/bronze.png"),
  GÜMÜŞ: require("../../assets/ranks/silver.png"),
  ALTIN: require("../../assets/ranks/gold.png"),
  PLATİN: require("../../assets/ranks/platinum.png"),
  ELMAS: require("../../assets/ranks/diamond.png"),
  KOZMİK: require("../../assets/ranks/ascendant.png"),
  EBEDİ: require("../../assets/ranks/immortal.png"),
  HAKİM: require("../../assets/ranks/radian.png"),
};

const LEAGUES: LeagueTierInfo[] = LEAGUE_TIERS.map((tier, idx) => {
  const next = LEAGUE_TIERS[idx + 1];
  return {
    name: tier.name,
    tier: tier.tier,
    icon: tier.icon,
    image: tier.image,
    color: tier.color,
    badge: tier.tier,
    minPoints: tier.minPoints,
    maxPoints: tier.maxPoints,
    currentTierPoints: 0,
    targetTierPoints: next ? next.minPoints - tier.minPoints : 0,
    totalPoints: tier.minPoints,
  };
});

const MOCK_STANDINGS: LeaderboardEntry[] = [
  { id: "mock-1", name: "Radyant_Yalçın", score: 9200, wins: 84, matches: 92, bestRound: 580, lp: 10450, tier: "HAKİM", level: 32 },
  { id: "mock-2", name: "Ege Neon", score: 4850, wins: 38, matches: 45, bestRound: 420, lp: 7800, tier: "EBEDİ", level: 24 },
  { id: "mock-3", name: "Kraliçe_Bora", score: 6100, wins: 52, matches: 64, bestRound: 490, lp: 5900, tier: "KOZMİK", level: 29 },
];

export function LeagueHub({
  playerId,
  progress,
  leaderboard,
  onBack,
  onPlayRanked,
  onClaimReward,
  embedded = false,
}: {
  playerId: string;
  progress: PlayerProgress;
  leaderboard: LeaderboardEntry[];
  onBack?: () => void;
  onPlayRanked?: () => void;
  onClaimReward?: (tier: string, chips: number, shields: number) => void;
  embedded?: boolean;
}) {
  const current = getLeagueTier(progress);
  const playerRank = leaderboard.findIndex((entry) => entry.id === playerId) + 1;
  const currentIndex = LEAGUES.findIndex((league) => league.tier === current.tier);
  const [selectedLeagueIndex, setSelectedLeagueIndex] = useState(currentIndex !== -1 ? currentIndex : 0);

  // Subtle breathing pulse animation for the active 3D badge
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const progressRatio = current.targetTierPoints > 0
    ? Math.min(1, current.currentTierPoints / current.targetTierPoints)
    : 1;

  const [remaining, setRemaining] = useState(() => getSeasonRemainingTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(getSeasonRemainingTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedLeague = LEAGUES[selectedLeagueIndex] ?? LEAGUES[0]!;
  const isSelectedCurrent = selectedLeague.tier === current.tier;
  const isSelectedUnlocked = selectedLeagueIndex <= currentIndex;

  const effectiveStandings = useMemo(() => {
    let list: LeaderboardEntry[] = [];
    if (!leaderboard || leaderboard.length === 0) {
      list = [...MOCK_STANDINGS];
    } else if (leaderboard.length >= 3) {
      list = [...leaderboard];
    } else {
      const existingIds = new Set(leaderboard.map((e) => e.id));
      const mocks = MOCK_STANDINGS.filter((m) => !existingIds.has(m.id));
      list = [...leaderboard, ...mocks];
    }
    return list
      .sort((a, b) => {
        const lpA = a.lp ?? (a.tier ? getMinLpForTier(a.tier) : 0);
        const lpB = b.lp ?? (b.tier ? getMinLpForTier(b.tier) : 0);
        return lpB - lpA;
      })
      .slice(0, 3);
  }, [leaderboard]);

  const content = (
    <View style={embedded ? styles.embeddedContainer : undefined}>
      {/* Standalone Header Bar */}
      {!embedded && (
        <View style={styles.header}>
          {onBack && (
            <Pressable onPress={onBack} style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]} hitSlop={8}>
              <Text style={styles.backText}>‹</Text>
            </Pressable>
          )}
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
      )}

      {/* 1. HERO RANK SHOWCASE (Bütünleşik, Göz Alıcı Ana Kart) */}
      <View style={[styles.heroCard, { borderColor: selectedLeague.color }]}>
        {/* Hero Top Bar */}
        <View style={styles.heroTopBar}>
          <View style={[styles.heroIndexBadge, { backgroundColor: `${selectedLeague.color}15`, borderColor: selectedLeague.color }]}>
            <Text style={[styles.heroIndexText, { color: selectedLeague.color }]}>
              KADEME 0{selectedLeagueIndex + 1}
            </Text>
          </View>
          {isSelectedCurrent ? (
            <View style={[styles.heroStatusPill, { backgroundColor: selectedLeague.color }]}>
              <Text style={styles.heroStatusPillTextWhite}>BURADASIN</Text>
            </View>
          ) : isSelectedUnlocked ? (
            <View style={[styles.heroStatusPill, { backgroundColor: "#ECFDF5", borderWidth: 1.5, borderColor: "#10B981" }]}>
              <Text style={[styles.heroStatusPillText, { color: "#059669" }]}>✓ AÇIK</Text>
            </View>
          ) : (
            <View style={[styles.heroStatusPill, { backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: "#CBD5E1" }]}>
              <Text style={[styles.heroStatusPillText, { color: "#64748B" }]}>🔒 KİLİTLİ</Text>
            </View>
          )}
        </View>

        {/* 3D Rank Artwork with Breathing Pulse */}
        <View style={styles.heroArtworkWrap}>
          <View
            style={[
              styles.heroArtworkGlow,
              {
                backgroundColor: `${selectedLeague.color}18`,
                borderColor: isSelectedUnlocked ? `${selectedLeague.color}50` : "transparent",
              },
            ]}
          />
          {RANK_IMAGES[selectedLeague.tier] ? (
            <Animated.Image
              source={RANK_IMAGES[selectedLeague.tier]}
              style={[
                styles.heroArtworkImage,
                !isSelectedUnlocked && { opacity: 0.35 },
                { transform: [{ scale: pulseAnim }] },
              ]}
              resizeMode="contain"
            />
          ) : (
            <Text style={{ fontSize: 72 }}>{selectedLeague.icon}</Text>
          )}
          {!isSelectedUnlocked && (
            <View style={styles.heroLockBadge}>
              <Text style={{ fontSize: 18 }}>🔒</Text>
            </View>
          )}
        </View>

        {/* Title & LP Goal */}
        <Text style={styles.heroLeagueTitle}>{selectedLeague.name}</Text>
        <Text style={styles.heroLpRequired}>
          {selectedLeague.maxPoints === Number.POSITIVE_INFINITY
            ? `${selectedLeague.minPoints}+ LP GEREKLİ`
            : `${selectedLeague.minPoints} - ${selectedLeague.maxPoints} LP ARALIĞI`}
        </Text>

        {/* Live LP Bar (If current user is in this tier) */}
        {isSelectedCurrent ? (
          <View style={styles.heroProgressBox}>
            <View style={styles.heroProgressInfo}>
              <Text style={styles.heroProgressLabel}>Kademendeki LP:</Text>
              <Text style={styles.heroProgressValue}>
                {current.targetTierPoints > 0
                  ? `${current.currentTierPoints} / ${current.targetTierPoints} LP`
                  : `${current.totalPoints} LP (Zirve Kademe)`}
              </Text>
            </View>
            <View style={styles.heroTrack}>
              <View
                style={[
                  styles.heroFill,
                  { width: `${Math.max(6, progressRatio * 100)}%`, backgroundColor: selectedLeague.color },
                ]}
              />
            </View>
            {current.targetTierPoints > 0 ? (
              <Text style={styles.heroNextTierHint}>
                🚀 Sonraki kademeye <Text style={{ fontWeight: "900", color: "#0F172A" }}>{current.targetTierPoints - current.currentTierPoints} LP</Text> kaldı (~{Math.ceil((current.targetTierPoints - current.currentTierPoints) / 35)} zafer)
              </Text>
            ) : (
              <Text style={[styles.heroNextTierHint, { color: "#D97706" }]}>
                👑 Zirve kademedesin! Liderlik tablosunda en üst sıraya tırman.
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.heroTargetBox}>
            <Text style={styles.heroTargetText}>
              {isSelectedUnlocked
                ? "✨ Bu kademeyi başarıyla geçtin. Sezon sonu amblem ve unvanı profilinde sergilenecek."
                : `🔒 Bu kademeyi açmak için ${selectedLeague.minPoints} LP'ye ulaşman gerekiyor.`}
            </Text>
          </View>
        )}

        {/* Modest Rewards Row */}
        <View style={styles.heroRewardsRow}>
          <View style={styles.heroRewardPill}>
            <Text style={styles.heroRewardIcon}>🪙</Text>
            <Text style={styles.heroRewardText}>+{LEAGUE_REWARDS[selectedLeague.tier]?.chips ?? 50} Çip</Text>
          </View>
          <View style={styles.heroRewardPill}>
            <Text style={styles.heroRewardIcon}>🎖️</Text>
            <Text style={styles.heroRewardText}>{LEAGUE_REWARDS[selectedLeague.tier]?.badgeName ?? "Rozet"}</Text>
          </View>
          <View style={styles.heroRewardPill}>
            <Text style={styles.heroRewardIcon}>🎁</Text>
            <Text style={styles.heroRewardText}>{LEAGUE_REWARDS[selectedLeague.tier]?.perk ?? "Ödül"}</Text>
          </View>
        </View>

        {/* Claim Reward Action Button (Eğer kademe açıksa ve ödül alınmadıysa aktif) */}
        {isSelectedUnlocked && (
          <View style={styles.claimSection}>
            {progress.claimedLeagueTiers?.[selectedLeague.tier] ? (
              <View style={styles.claimedPill}>
                <Text style={styles.claimedPillText}>✓ BU KADEME ÖDÜLÜ ALINDI</Text>
              </View>
            ) : (
              <Pressable
                onPress={() => {
                  triggerHapticSuccess();
                  const rewardData = LEAGUE_REWARDS[selectedLeague.tier] ?? { chips: 50, shields: 1 };
                  onClaimReward?.(selectedLeague.tier, rewardData.chips, rewardData.shields);
                }}
                style={({ pressed }) => [styles.claimBtn, pressed && styles.pressed]}
              >
                <Text style={styles.claimBtnText}>
                  🎁 ÖDÜLLERİ AL (+{LEAGUE_REWARDS[selectedLeague.tier]?.chips ?? 50} 🪙 & ROZET)
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* 2. DIRECT PLAY CTA BUTTON (Hemen göz önünde, güçlü) */}
      {onPlayRanked && (
        <Pressable
          onPress={() => {
            triggerHapticSuccess();
            onPlayRanked();
          }}
          style={({ pressed }) => [styles.playCtaButton, pressed && styles.pressed]}
        >
          <LinearGradient
            colors={["#0D9488", "#10B981", "#059669"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.playCtaGradient}
          >
            <View style={styles.playCtaLeft}>
              <View style={styles.playCtaIconOrb}>
                <Text style={{ fontSize: 22 }}>⚔️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.playCtaTitle}>DERECELİ DÜELLO OYNA</Text>
                <Text style={styles.playCtaSubtitle}>Canlı rakiple eşleş, LP topla ve lig atla!</Text>
              </View>
            </View>
            <View style={styles.playCtaArrowOrb}>
              <Text style={styles.playCtaArrow}>→</Text>
            </View>
          </LinearGradient>
        </Pressable>
      )}

      {/* 3. TIER ROADMAP STRIP (Kompakt ve Şık Kademe Seçici Çizgisi) */}
      <View style={styles.roadmapCard}>
        <View style={styles.roadmapHeader}>
          <Text style={styles.roadmapTitle}>KADEME YOLCULUĞU</Text>
          <Text style={styles.roadmapSubtitle}>
            {currentIndex + 1} / {LEAGUES.length} Tamamlandı
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.roadmapScroll}
        >
          {LEAGUES.map((league, idx) => {
            const isCur = league.tier === current.tier;
            const isUnlocked = idx <= currentIndex;
            const isSel = idx === selectedLeagueIndex;
            return (
              <Pressable
                key={league.tier}
                onPress={() => {
                  triggerHapticSelection();
                  setSelectedLeagueIndex(idx);
                }}
                style={({ pressed }) => [
                  styles.roadmapNode,
                  isSel && [styles.roadmapNodeSelected, { borderColor: league.color }],
                  pressed && { opacity: 0.8 },
                ]}
              >
                <View
                  style={[
                    styles.roadmapIconCircle,
                    {
                      backgroundColor: isUnlocked ? `${league.color}18` : "#F1F5F9",
                      borderColor: isUnlocked ? league.color : "#CBD5E1",
                    },
                  ]}
                >
                  {RANK_IMAGES[league.tier] ? (
                    <Image
                      source={RANK_IMAGES[league.tier]}
                      style={[
                        styles.roadmapRankImage,
                        !isUnlocked && { opacity: 0.35 },
                      ]}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={{ fontSize: 16 }}>{league.icon}</Text>
                  )}
                  {isCur && <View style={[styles.roadmapLivePin, { backgroundColor: league.color }]} />}
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.roadmapNodeText,
                    isSel && { color: league.color, fontWeight: "900" },
                    !isUnlocked && { color: "#94A3B8" },
                  ]}
                >
                  {league.name}
                </Text>
                <Text style={styles.roadmapNodeLp}>{league.minPoints} LP</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 4. SEZON LİDERLERİ WIDGET (Kompakt ve Temiz) */}
      <View style={styles.standingsCard}>
        <View style={styles.standingsHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={{ fontSize: 14 }}>🏆</Text>
            <Text style={styles.standingsTitle}>SEZON LİDERLERİ</Text>
          </View>
          <View style={styles.standingsBadge}>
            <Text style={styles.standingsBadgeText}>
              {playerRank > 0 ? `#${playerRank}. SIRADASIN` : "DERECELİ LİSTE"}
            </Text>
          </View>
        </View>

        <View style={styles.top3Row}>
          {effectiveStandings.slice(0, 3).map((entry, idx) => {
            const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉";
            const displayLp = entry.lp ?? (entry.tier ? getMinLpForTier(entry.tier) : 0);
            return (
              <View key={entry.id || idx} style={styles.top3Item}>
                <Text style={styles.top3Medal}>{medal}</Text>
                <Text numberOfLines={1} style={styles.top3Name}>{entry.name}</Text>
                <Text style={styles.top3Lp}>{displayLp} LP</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );

  if (embedded) {
    return content;
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {content}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: 12, paddingBottom: 140 },
  embeddedContainer: { paddingTop: 4, paddingBottom: 24 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 12, paddingHorizontal: 18 },
  backButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: "#F1F5F9", borderWidth: 1.5, borderColor: "#E2E8F0", alignItems: "center", justifyContent: "center", marginRight: 10 },
  backText: { color: "#0F172A", fontSize: 28, lineHeight: 30, marginTop: -3 },
  headerCopy: { flex: 1 },
  overline: { color: "#64748B", fontSize: 9.5, fontWeight: "900", letterSpacing: 0.6 },
  title: { color: "#0F172A", fontSize: 24, fontWeight: "900", letterSpacing: 0.3, marginTop: 1 },
  timerPill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFFBEB", borderWidth: 1.5, borderColor: "#FDE68A", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  timerIcon: { fontSize: 13 },
  timerLabel: { color: "#92400E", fontSize: 8.5, fontWeight: "900", letterSpacing: 0.5 },
  timerValue: { color: "#78350F", fontSize: 11, fontWeight: "900" },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },

  /* 1. HERO RANK SHOWCASE CARD */
  heroCard: {
    marginHorizontal: 18,
    marginTop: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1.5,
    borderBottomWidth: 4,
    borderColor: "#E2E8F0",
    borderBottomColor: "#CBD5E1",
    padding: 16,
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  heroTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 8,
  },
  heroIndexBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  heroIndexText: {
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  heroStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  heroStatusPillTextWhite: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  heroStatusPillText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  heroArtworkWrap: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginVertical: 4,
  },
  heroArtworkGlow: {
    position: "absolute",
    width: 136,
    height: 136,
    borderRadius: 68,
    borderWidth: 2,
  },
  heroArtworkImage: {
    width: 120,
    height: 120,
  },
  heroLockBadge: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },

  heroLeagueTitle: {
    color: "#0F172A",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.4,
    marginTop: 2,
    textAlign: "center",
  },
  heroLpRequired: {
    color: "#64748B",
    fontSize: 11.5,
    fontWeight: "800",
    marginTop: 2,
    marginBottom: 10,
    textAlign: "center",
  },

  heroProgressBox: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderBottomWidth: 2.5,
    borderColor: "#E2E8F0",
    borderBottomColor: "#CBD5E1",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  heroProgressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  heroProgressLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "800",
  },
  heroProgressValue: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "900",
  },
  heroTrack: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  heroFill: {
    height: "100%",
    borderRadius: 4,
  },
  heroNextTierHint: {
    color: "#2563EB",
    fontSize: 10.5,
    fontWeight: "700",
    marginTop: 6,
    textAlign: "center",
  },

  heroTargetBox: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  heroTargetText: {
    color: "#475569",
    fontSize: 11.5,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 16,
  },

  heroRewardsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    width: "100%",
  },
  heroRewardPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderBottomWidth: 2.5,
    borderColor: "#E2E8F0",
    borderBottomColor: "#CBD5E1",
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 12,
  },
  heroRewardIcon: {
    fontSize: 12,
  },
  heroRewardText: {
    color: "#1E293B",
    fontSize: 9.5,
    fontWeight: "900",
  },

  claimSection: {
    width: "100%",
    marginTop: 12,
  },
  claimBtn: {
    backgroundColor: "#F59E0B",
    borderWidth: 1.5,
    borderBottomWidth: 3.5,
    borderColor: "#D97706",
    borderBottomColor: "#B45309",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  claimBtnText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  claimedPill: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  claimedPillText: {
    color: "#059669",
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 0.4,
  },

  /* 3. TIER ROADMAP CARD */
  roadmapCard: {
    marginHorizontal: 18,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1.5,
    borderBottomWidth: 3.5,
    borderColor: "#E2E8F0",
    borderBottomColor: "#CBD5E1",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  roadmapHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  roadmapTitle: {
    color: "#0F172A",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  roadmapSubtitle: {
    color: "#059669",
    fontSize: 10.5,
    fontWeight: "800",
  },
  roadmapScroll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 2,
  },
  roadmapNode: {
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderBottomWidth: 2.5,
    borderColor: "#E2E8F0",
    borderBottomColor: "#CBD5E1",
    minWidth: 66,
  },
  roadmapNodeSelected: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderBottomWidth: 3.5,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  roadmapIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 4,
    padding: 3,
  },
  roadmapRankImage: {
    width: 28,
    height: 28,
  },
  roadmapLivePin: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  roadmapNodeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#334155",
    textAlign: "center",
  },
  roadmapNodeLp: {
    fontSize: 8.5,
    fontWeight: "800",
    color: "#94A3B8",
    marginTop: 2,
  },

  playCtaButton: {
    marginHorizontal: 18,
    marginTop: 16,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1.5,
    borderBottomWidth: 4,
    borderColor: "#059669",
    borderBottomColor: "#047857",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  playCtaGradient: {
    paddingVertical: 15,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  playCtaLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  playCtaIconOrb: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  playCtaTitle: {
    color: "#FFFFFF",
    fontSize: 14.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  playCtaSubtitle: {
    color: "#D1FAE5",
    fontSize: 10.5,
    fontWeight: "700",
    marginTop: 2,
  },
  playCtaArrowOrb: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  playCtaArrow: {
    color: "#059669",
    fontSize: 16,
    fontWeight: "900",
  },

  standingsCard: {
    marginHorizontal: 18,
    marginTop: 14,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderBottomWidth: 3.5,
    borderColor: "#E2E8F0",
    borderBottomColor: "#CBD5E1",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  standingsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  standingsTitle: { color: "#0F172A", fontSize: 12, fontWeight: "900", letterSpacing: 0.6 },
  standingsBadge: { backgroundColor: "#ECFDF5", borderWidth: 1.5, borderColor: "#A7F3D0", paddingHorizontal: 10, paddingVertical: 3.5, borderRadius: 8 },
  standingsBadgeText: { color: "#059669", fontSize: 9.5, fontWeight: "900", letterSpacing: 0.5 },

  top3Row: { flexDirection: "row", gap: 10 },
  top3Item: { flex: 1, backgroundColor: "#F8FAFC", borderWidth: 1.5, borderBottomWidth: 2.5, borderColor: "#E2E8F0", borderBottomColor: "#CBD5E1", borderRadius: 14, padding: 10, alignItems: "center" },
  top3Medal: { fontSize: 16, marginBottom: 4 },
  top3Name: { color: "#0F172A", fontSize: 11, fontWeight: "900", width: "100%", textAlign: "center" },
  top3Lp: { color: "#059669", fontSize: 10, fontWeight: "900", marginTop: 3 },
});
