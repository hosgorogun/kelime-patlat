import { useState, useRef, useEffect, useMemo } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, FlatList } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import {
  LEAGUE_TIERS,
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
    targetTierPoints: next ? next.minPoints - tier.minPoints : 1000,
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
  embedded = false,
}: {
  playerId: string;
  progress: PlayerProgress;
  leaderboard: LeaderboardEntry[];
  onBack?: () => void;
  onPlayRanked?: () => void;
  embedded?: boolean;
}) {
  const { width } = useWindowDimensions();
  const availableWidth = Math.min(width - 28, 560);
  const CARD_WIDTH = Math.min(300, Math.round(availableWidth * 0.82));
  const SNAP_INTERVAL = CARD_WIDTH + 14;
  const HORIZONTAL_PADDING = Math.max(0, (availableWidth - CARD_WIDTH) / 2);
  const current = getLeagueTier(progress);
  const playerRank = leaderboard.findIndex((entry) => entry.id === playerId) + 1;
  const currentIndex = LEAGUES.findIndex((league) => league.tier === current.tier);
  const [selectedLeagueIndex, setSelectedLeagueIndex] = useState(currentIndex !== -1 ? currentIndex : 0);

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

  const flatListRef = useRef<FlatList>(null);
  const effectiveStandings = useMemo(() => {
    if (!leaderboard || leaderboard.length === 0) return MOCK_STANDINGS;
    if (leaderboard.length >= 3) return leaderboard;
    const existingIds = new Set(leaderboard.map((e) => e.id));
    const mocks = MOCK_STANDINGS.filter((m) => !existingIds.has(m.id));
    return [...leaderboard, ...mocks].slice(0, 3);
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

      {/* Showcase Horizontal Carousel */}
      <View style={styles.carouselContainer}>
        <FlatList
          key={CARD_WIDTH}
          ref={flatListRef}
          data={LEAGUES}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={SNAP_INTERVAL}
          snapToAlignment="center"
          decelerationRate="fast"
          initialScrollIndex={currentIndex !== -1 ? currentIndex : 0}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
            }, 100);
          }}
          getItemLayout={(_, index) => ({
            length: SNAP_INTERVAL,
            offset: SNAP_INTERVAL * index,
            index,
          })}
          contentContainerStyle={{
            paddingHorizontal: HORIZONTAL_PADDING,
          }}
          onMomentumScrollEnd={(e) => {
            const rawIndex = Math.round(e.nativeEvent.contentOffset.x / SNAP_INTERVAL);
            const clampedIndex = Math.max(0, Math.min(LEAGUES.length - 1, rawIndex));
            if (clampedIndex !== selectedLeagueIndex) {
              triggerHapticSelection();
              setSelectedLeagueIndex(clampedIndex);
            }
          }}
          keyExtractor={(item) => item.tier}
          renderItem={({ item, index }) => {
            const isCurrent = item.tier === current.tier;
            const isUnlocked = index <= currentIndex;
            const isSelected = index === selectedLeagueIndex;
            const imgSource = RANK_IMAGES[item.tier];

            return (
              <Pressable
                onPress={() => {
                  triggerHapticSelection();
                  setSelectedLeagueIndex(index);
                  flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
                }}
                style={({ pressed }) => [
                  styles.carouselCard,
                  { width: CARD_WIDTH },
                  !isUnlocked && styles.carouselCardLocked,
                  pressed && styles.pressed,
                ]}
              >
                {/* Status Header Badge */}
                <View style={styles.cardHeader}>
                  <Text style={styles.cardIndexText}>KADEME 0{index + 1}</Text>
                  {isCurrent ? (
                    <View style={[styles.cardPill, { backgroundColor: item.color }]}>
                      <Text style={styles.cardPillTextCurrent}>BURADASIN</Text>
                    </View>
                  ) : isUnlocked ? (
                    <View style={[styles.cardPill, { backgroundColor: `${item.color}25`, borderWidth: 1.5, borderColor: item.color }]}>
                      <Text style={[styles.cardPillTextUnlocked, { color: item.color }]}>AÇIK</Text>
                    </View>
                  ) : (
                    <View style={[styles.cardPill, { backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: "#E2E8F0" }]}>
                      <Text style={styles.cardPillTextLocked}>🔒 KİLİTLİ</Text>
                    </View>
                  )}
                </View>

                {/* 3D Rank Artwork with Hero Aura */}
                <View style={[styles.artworkContainer, isSelected && { shadowColor: item.color, borderColor: item.color }]}>
                  {/* Glowing background aura */}
                  <View
                    style={[
                      styles.artworkGlowAura,
                      {
                        backgroundColor: `${item.color}15`,
                        borderColor: isUnlocked ? `${item.color}40` : "transparent",
                      },
                    ]}
                  />
                  {imgSource ? (
                    <Image source={imgSource} style={[styles.artworkImage, !isUnlocked && { opacity: 0.3 }]} resizeMode="contain" />
                  ) : (
                    <Text style={{ fontSize: 72 }}>{item.icon}</Text>
                  )}
                  {!isUnlocked && (
                    <View style={styles.artworkLockOverlay}>
                      <View style={styles.lockBadge}>
                        <Text style={{ fontSize: 20 }}>🔒</Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Title & LP Info */}
                <Text style={styles.cardLeagueTitle}>{item.name}</Text>
                <Text style={styles.cardLpRange}>
                  {item.maxPoints === Number.POSITIVE_INFINITY ? `${item.minPoints}+ LP GEREKLİ` : `${item.minPoints} - ${item.maxPoints} LP`}
                </Text>

                {/* If current, show live LP status */}
                {isCurrent && (
                  <View style={styles.cardLiveProgress}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                      <Text style={styles.cardLiveLabel}>Mevcut İlerleme:</Text>
                      <Text style={[styles.cardLiveValue, { color: "#0F172A" }]}>{current.currentTierPoints} / {current.targetTierPoints} LP</Text>
                    </View>
                    <View style={styles.cardTrack}>
                      <View style={[styles.cardFill, { width: `${Math.max(6, progressRatio * 100)}%`, backgroundColor: item.color }]} />
                    </View>
                  </View>
                )}
              </Pressable>
            );
          }}
        />
      </View>

      {/* Selected League Detail Card */}
      <View style={[styles.detailCard, { borderColor: selectedLeague.color }]}>
        <View style={styles.detailHeader}>
          <Text style={styles.detailKicker}>KADEME DETAYI & AVANTAJLARI</Text>
          <View style={[styles.detailBadgeWrap, { backgroundColor: `${selectedLeague.color}20`, borderColor: selectedLeague.color }]}>
            <Text style={[styles.detailBadge, { color: selectedLeague.color }]}>{selectedLeague.tier}</Text>
          </View>
        </View>

        <View style={styles.detailGrid}>
          <View style={styles.detailBox}>
            <Text style={styles.detailBoxLabel}>MİNİMUM LP</Text>
            <Text numberOfLines={1} style={styles.detailBoxValue}>{selectedLeague.minPoints} LP</Text>
          </View>
          <View style={styles.detailRule} />
          <View style={styles.detailBox}>
            <Text style={styles.detailBoxLabel}>KADEME DURUMU</Text>
            <Text numberOfLines={1} style={[styles.detailBoxValue, { color: isSelectedCurrent ? "#2563EB" : isSelectedUnlocked ? "#059669" : "#DC2626" }]}>
              {isSelectedCurrent ? "BURADASIN" : isSelectedUnlocked ? "AÇIK" : "KİLİTLİ"}
            </Text>
          </View>
          <View style={styles.detailRule} />
          <View style={styles.detailBox}>
            <Text style={styles.detailBoxLabel}>SEZON ÖDÜLÜ</Text>
            <Text numberOfLines={1} style={styles.detailBoxValue}>🏆 AMBLEM</Text>
          </View>
        </View>

        <Text style={styles.detailDesc}>
          {isSelectedCurrent
            ? "Şu an bu kademede mücadele ediyorsun. Canlı düelloları kazanarak LP biriktir ve zirveye tırman!"
            : isSelectedUnlocked
            ? "Bu kademeyi başarıyla açtın. 3D kademe amblemi profilinde sergilenmeye hazır."
            : `Bu kademeyi açmak için toplam ${selectedLeague.minPoints} LP puanına ulaşman gerekmektedir.`}
        </Text>
      </View>

      {/* Direct Ranked Match CTA Button */}
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
                <Text style={styles.playCtaSubtitle}>Canlı eşleş, LP kazan ve kademe atla!</Text>
              </View>
            </View>
            <View style={styles.playCtaArrowOrb}>
              <Text style={styles.playCtaArrow}>→</Text>
            </View>
          </LinearGradient>
        </Pressable>
      )}

      {/* Season Leaderboard Quick Standings Widget */}
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
            const borderCol = idx === 0 ? "#DCE1D7" : idx === 1 ? "#DCE1D7" : "#DCE1D7";
            const displayLp = entry.lp ?? (entry.tier ? getMinLpForTier(entry.tier) : 0);
            return (
              <View key={entry.id || idx} style={[styles.top3Item, { borderColor: borderCol }]}>
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

  carouselContainer: { marginVertical: 6 },
  carouselCard: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginRight: 14,
    alignItems: "center",
  },
  carouselCardSelected: {},
  carouselCardLocked: { opacity: 0.65 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },

  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: 14 },
  cardIndexText: { color: "#64748B", fontSize: 11.5, fontWeight: "900", letterSpacing: 0.6 },
  cardPill: { paddingHorizontal: 10, paddingVertical: 3.5, borderRadius: 8 },
  cardPillTextCurrent: { color: "#FFFFFF", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  cardPillTextUnlocked: { fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  cardPillTextLocked: { color: "#64748B", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },

  artworkContainer: {
    width: 156,
    height: 156,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    position: "relative",
  },
  artworkGlowAura: {
    position: "absolute",
    width: 156,
    height: 156,
    borderRadius: 78,
    borderWidth: 2,
  },
  artworkImage: {
    width: 136,
    height: 136,
  },
  artworkLockOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    borderRadius: 78,
    alignItems: "center",
    justifyContent: "center",
  },
  lockBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },

  cardLeagueTitle: { color: "#0F172A", fontSize: 21, fontWeight: "900", letterSpacing: 0.4, marginBottom: 3 },
  cardLpRange: { color: "#475569", fontSize: 12, fontWeight: "800", marginBottom: 14 },

  cardLiveProgress: { width: "100%", marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.06)" },
  cardLiveLabel: { color: "#64748B", fontSize: 11, fontWeight: "700" },
  cardLiveValue: { fontSize: 11.5, fontWeight: "900" },
  cardTrack: { width: "100%", height: 8, borderRadius: 4, backgroundColor: "#E2E8F0", marginTop: 6, overflow: "hidden" },
  cardFill: { height: "100%", borderRadius: 4 },

  detailCard: { marginHorizontal: 18, marginTop: 10, padding: 16, borderRadius: 20, backgroundColor: "#FFFFFF", borderWidth: 1.5, borderBottomWidth: 3, borderColor: "#E2E8DC", shadowColor: "#293541", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  detailHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  detailKicker: { color: "#0F172A", fontSize: 11, fontWeight: "900", letterSpacing: 0.6 },
  detailBadgeWrap: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, borderWidth: 1.5 },
  detailBadge: { fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },

  detailGrid: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F8FAFC", paddingVertical: 10, paddingHorizontal: 8, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: "#E2E8F0" },
  detailBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  detailBoxLabel: { color: "#64748B", fontSize: 9.5, fontWeight: "900", letterSpacing: 0.4, textAlign: "center" },
  detailBoxValue: { color: "#0F172A", fontSize: 12, fontWeight: "900", marginTop: 3, textAlign: "center" },
  detailRule: { width: 1, height: 24, backgroundColor: "#CBD5E1" },

  detailDesc: { color: "#475569", fontSize: 12, fontWeight: "600", lineHeight: 18, textAlign: "center" },

  playCtaButton: {
    marginHorizontal: 18,
    marginTop: 16,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1.5,
    borderBottomWidth: 3,
    borderColor: "#059669",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
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

  standingsCard: { marginHorizontal: 18, marginTop: 14, padding: 16, borderRadius: 20, backgroundColor: "#FFFFFF", borderWidth: 1.5, borderBottomWidth: 3, borderColor: "#E2E8DC", shadowColor: "#293541", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  standingsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  standingsTitle: { color: "#0F172A", fontSize: 12, fontWeight: "900", letterSpacing: 0.6 },
  standingsBadge: { backgroundColor: "#ECFDF5", borderWidth: 1, borderColor: "#A7F3D0", paddingHorizontal: 10, paddingVertical: 3.5, borderRadius: 8 },
  standingsBadgeText: { color: "#059669", fontSize: 9.5, fontWeight: "900", letterSpacing: 0.5 },

  top3Row: { flexDirection: "row", gap: 10 },
  top3Item: { flex: 1, backgroundColor: "#F8FAFC", borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 14, padding: 10, alignItems: "center" },
  top3Medal: { fontSize: 16, marginBottom: 4 },
  top3Name: { color: "#0F172A", fontSize: 11, fontWeight: "900", width: "100%", textAlign: "center" },
  top3Lp: { color: "#047857", fontSize: 10, fontWeight: "900", marginTop: 3 },
});
