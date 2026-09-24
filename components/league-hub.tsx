import { useState, useRef, useEffect } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View, Dimensions, FlatList } from "react-native";
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = Math.round(SCREEN_WIDTH * 0.76);
const CARD_GAP = 14;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;
const HORIZONTAL_PADDING = Math.max(0, (SCREEN_WIDTH - CARD_WIDTH) / 2);

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
  { id: "mock-1", name: "Radyant_Yalçın", score: 9200, wins: 84, matches: 92, bestRound: 580, lp: 10450, tier: "RADIAN", level: 32 },
  { id: "mock-2", name: "Ege Neon", score: 4850, wins: 38, matches: 45, bestRound: 420, lp: 7800, tier: "ÖLÜMSÜZLÜK", level: 24 },
  { id: "mock-3", name: "Kraliçe_Bora", score: 6100, wins: 52, matches: 64, bestRound: 490, lp: 5900, tier: "YÜCELİK", level: 29 },
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
  const effectiveStandings = leaderboard && leaderboard.length > 0 ? leaderboard : MOCK_STANDINGS;

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
                  isSelected && styles.carouselCardSelected,
                  isSelected && { borderColor: item.color, shadowColor: item.color },
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
                    <View style={[styles.cardPill, { backgroundColor: `${item.color}20`, borderWidth: 1, borderColor: `${item.color}55` }]}>
                      <Text style={[styles.cardPillTextUnlocked, { color: item.color }]}>AÇIK</Text>
                    </View>
                  ) : (
                    <View style={[styles.cardPill, { backgroundColor: "rgba(255,255,255,0.06)" }]}>
                      <Text style={styles.cardPillTextLocked}>🔒 KİLİTLİ</Text>
                    </View>
                  )}
                </View>

                {/* 3D Rank Artwork */}
                <View style={[styles.artworkContainer, { borderColor: isUnlocked ? item.color : "rgba(212, 180, 90, 0.2)", shadowColor: item.color }]}>
                  {imgSource ? (
                    <Image source={imgSource} style={[styles.artworkImage, !isUnlocked && { opacity: 0.35 }]} resizeMode="cover" />
                  ) : (
                    <Text style={{ fontSize: 50 }}>{item.icon}</Text>
                  )}
                  {!isUnlocked && (
                    <View style={styles.artworkLockOverlay}>
                      <Text style={{ fontSize: 24 }}>🔒</Text>
                    </View>
                  )}
                </View>

                {/* Title & LP Info */}
                <Text style={[styles.cardLeagueTitle, { color: isUnlocked ? item.color : "#94A3B8" }]}>{item.name}</Text>
                <Text style={styles.cardLpRange}>
                  {item.maxPoints === Number.POSITIVE_INFINITY ? `${item.minPoints}+ LP GEREKLİ` : `${item.minPoints} - ${item.maxPoints} LP`}
                </Text>

                {/* If current, show live LP status */}
                {isCurrent && (
                  <View style={styles.cardLiveProgress}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                      <Text style={styles.cardLiveLabel}>Mevcut İlerleme:</Text>
                      <Text style={[styles.cardLiveValue, { color: item.color }]}>{current.currentTierPoints} / {current.targetTierPoints} LP</Text>
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
      <View style={[styles.detailCard, { borderColor: `${selectedLeague.color}55` }]}>
        <View style={styles.detailHeader}>
          <Text style={styles.detailKicker}>KADEME DETAYI & AVANTAJLARI</Text>
          <Text style={[styles.detailBadge, { color: selectedLeague.color }]}>{selectedLeague.tier}</Text>
        </View>

        <View style={styles.detailGrid}>
          <View style={styles.detailBox}>
            <Text style={styles.detailBoxLabel}>MİNİMUM LP</Text>
            <Text numberOfLines={1} style={styles.detailBoxValue}>{selectedLeague.minPoints} LP</Text>
          </View>
          <View style={styles.detailRule} />
          <View style={styles.detailBox}>
            <Text style={styles.detailBoxLabel}>KADEME DURUMU</Text>
            <Text numberOfLines={1} style={[styles.detailBoxValue, { color: isSelectedUnlocked ? "#22C55E" : "#EF4444" }]}>
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
            ? "Şu an bu kademede mücadele ediyorsun. Canlı düelloları veya bot maçlarını kazanarak LP biriktir ve yüksel!"
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
            colors={["#166548", "#0E3F30", "#08291F"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.playCtaGradient}
          >
            <View style={styles.playCtaLeft}>
              <View style={styles.playCtaIconOrb}>
                <Text style={{ fontSize: 20 }}>⚔️</Text>
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
            const borderCol = idx === 0 ? "#FFD000" : idx === 1 ? "#94A3B8" : "#F97316";
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
  backButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: "#164536", borderWidth: 1, borderColor: "rgba(212, 180, 90, 0.3)", alignItems: "center", justifyContent: "center", marginRight: 10 },
  backText: { color: "#FFF9FC", fontSize: 28, lineHeight: 30, marginTop: -3 },
  headerCopy: { flex: 1 },
  overline: { color: "#94A3B8", fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: "#FFFFFF", fontSize: 20, fontWeight: "900", letterSpacing: 0.5, marginTop: 1, textShadowColor: "#000", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 3 },
  timerPill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#164536", borderWidth: 1, borderColor: "rgba(251, 191, 36, 0.4)", paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12 },
  timerIcon: { fontSize: 12 },
  timerLabel: { color: "#FBBF24", fontSize: 7.5, fontWeight: "900", letterSpacing: 0.8 },
  timerValue: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" },

  carouselContainer: { marginVertical: 8 },
  carouselCard: { backgroundColor: "rgba(14, 44, 34, 0.92)", borderWidth: 1.5, borderColor: "rgba(212, 180, 90, 0.25)", borderRadius: 24, padding: 16, marginRight: 14, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 8, elevation: 6 },
  carouselCardSelected: { backgroundColor: "rgba(22, 69, 54, 0.95)", borderWidth: 2, shadowOpacity: 0.5, shadowRadius: 14, elevation: 8 },
  carouselCardLocked: { opacity: 0.6 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },

  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: 12 },
  cardIndexText: { color: "#94A3B8", fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  cardPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  cardPillTextCurrent: { color: "#071A14", fontSize: 8.5, fontWeight: "900", letterSpacing: 0.6 },
  cardPillTextUnlocked: { fontSize: 8.5, fontWeight: "900", letterSpacing: 0.6 },
  cardPillTextLocked: { color: "#94A3B8", fontSize: 8.5, fontWeight: "900", letterSpacing: 0.6 },

  artworkContainer: { width: 110, height: 110, borderRadius: 24, borderWidth: 2.5, backgroundColor: "#0E2C22", alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 12, position: "relative", shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  artworkImage: { width: 104, height: 104, borderRadius: 20 },
  artworkLockOverlay: { position: "absolute", inset: 0, backgroundColor: "rgba(14, 44, 34, 0.65)", alignItems: "center", justifyContent: "center" },

  cardLeagueTitle: { fontSize: 20, fontWeight: "900", letterSpacing: 0.6, marginBottom: 2, textShadowColor: "#000", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 2 },
  cardLpRange: { color: "#94A3B8", fontSize: 11, fontWeight: "700", marginBottom: 12 },

  cardLiveProgress: { width: "100%", marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" },
  cardLiveLabel: { color: "#94A3B8", fontSize: 9.5, fontWeight: "700" },
  cardLiveValue: { fontSize: 10.5, fontWeight: "900" },
  cardTrack: { width: "100%", height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.08)", marginTop: 4, overflow: "hidden" },
  cardFill: { height: "100%", borderRadius: 3 },

  detailCard: { marginHorizontal: 18, marginTop: 6, padding: 14, borderRadius: 18, backgroundColor: "rgba(14, 44, 34, 0.92)", borderWidth: 1.5, borderColor: "rgba(212, 180, 90, 0.3)", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
  detailHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  detailKicker: { color: "#94A3B8", fontSize: 8.5, fontWeight: "900", letterSpacing: 1 },
  detailBadge: { fontSize: 10.5, fontWeight: "900", letterSpacing: 0.8 },

  detailGrid: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#0B231B", paddingVertical: 8, paddingHorizontal: 6, borderRadius: 12, marginBottom: 8, gap: 2 },
  detailBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  detailBoxLabel: { color: "#A8C5B5", fontSize: 7.5, fontWeight: "900", letterSpacing: 0.3, textAlign: "center" },
  detailBoxValue: { color: "#FFFFFF", fontSize: 10.5, fontWeight: "900", marginTop: 2, textAlign: "center" },
  detailRule: { width: 1, height: 20, backgroundColor: "rgba(255,255,255,0.1)" },

  detailDesc: { color: "#CBD5E1", fontSize: 10.5, fontWeight: "600", lineHeight: 15, textAlign: "center" },

  playCtaButton: {
    marginHorizontal: 18,
    marginTop: 12,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#3EE8B5",
    shadowColor: "#3EE8B5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  playCtaGradient: {
    paddingVertical: 14,
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
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(62, 232, 181, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(62, 232, 181, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  playCtaTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  playCtaSubtitle: {
    color: "#A8C5B5",
    fontSize: 9.5,
    fontWeight: "700",
    marginTop: 2,
  },
  playCtaArrowOrb: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#3EE8B5",
    alignItems: "center",
    justifyContent: "center",
  },
  playCtaArrow: {
    color: "#071A14",
    fontSize: 16,
    fontWeight: "900",
  },

  standingsCard: { marginHorizontal: 18, marginTop: 12, padding: 14, borderRadius: 18, backgroundColor: "rgba(14, 44, 34, 0.92)", borderWidth: 1, borderColor: "rgba(62, 232, 181, 0.3)", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
  standingsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  standingsTitle: { color: "#FFF9FC", fontSize: 11, fontWeight: "900", letterSpacing: 0.8, textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  standingsBadge: { backgroundColor: "rgba(62, 232, 181, 0.15)", borderWidth: 1, borderColor: "rgba(62, 232, 181, 0.3)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  standingsBadgeText: { color: "#3EE8B5", fontSize: 8.5, fontWeight: "900", letterSpacing: 0.5 },

  top3Row: { flexDirection: "row", gap: 8 },
  top3Item: { flex: 1, backgroundColor: "#0B231B", borderWidth: 1, borderRadius: 12, padding: 8, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 2 },
  top3Medal: { fontSize: 14, marginBottom: 2 },
  top3Name: { color: "#FFFFFF", fontSize: 10, fontWeight: "900", width: "100%", textAlign: "center", textShadowColor: "rgba(0,0,0,0.4)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1 },
  top3Lp: { color: "#3EE8B5", fontSize: 8.5, fontWeight: "800", marginTop: 1 },
});
