import { useState, useRef, useEffect } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View, Dimensions, FlatList } from "react-native";

import { getLeagueTier, getSeasonRemainingTime, type LeagueTierInfo, type PlayerProgress } from "@/shared/progression";
import { type LeaderboardEntry } from "@/shared/game";
import { triggerHapticSelection } from "@/shared/audio-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.78;

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

      {/* Showcase Horizontal Carousel */}
      <View style={styles.carouselContainer}>
        <FlatList
          ref={flatListRef}
          data={LEAGUES}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + 14}
          decelerationRate="fast"
          initialScrollIndex={currentIndex !== -1 ? currentIndex : 0}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
            }, 100);
          }}
          getItemLayout={(_, index) => ({ length: CARD_WIDTH + 14, offset: (CARD_WIDTH + 14) * index, index })}
          contentContainerStyle={{ paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2 - 18 }}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / (CARD_WIDTH + 14));
            if (index >= 0 && index < LEAGUES.length && index !== selectedLeagueIndex) {
              triggerHapticSelection();
              setSelectedLeagueIndex(index);
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
                  flatListRef.current?.scrollToIndex({ index, animated: true });
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

      {/* Bottom Selected League Detail Card */}
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

      {/* Season Leaderboard Quick Standings Widget */}
      <View style={styles.standingsCard}>
        <View style={styles.standingsHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={{ fontSize: 14 }}>🏆</Text>
            <Text style={styles.standingsTitle}>SEZON LİDERLERİ</Text>
          </View>
          <View style={styles.standingsBadge}>
            <Text style={styles.standingsBadgeText}>{playerRank > 0 ? `#${playerRank}. SIRADASIN` : "LİSTEDESİN"}</Text>
          </View>
        </View>

        <View style={styles.top3Row}>
          {leaderboard.slice(0, 3).map((entry, idx) => {
            const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉";
            const borderCol = idx === 0 ? "#FFD000" : idx === 1 ? "#94A3B8" : "#F97316";
            return (
              <View key={entry.id || idx} style={[styles.top3Item, { borderColor: borderCol }]}>
                <Text style={styles.top3Medal}>{medal}</Text>
                <Text numberOfLines={1} style={styles.top3Name}>{entry.name}</Text>
                <Text style={styles.top3Lp}>{entry.lp ?? entry.score} LP</Text>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: 12, paddingBottom: 140 },
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

  cardDetailGrid: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#0B231B", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, width: "100%", marginBottom: 10, borderWidth: 1, borderColor: "rgba(212, 180, 90, 0.2)" },
  cardDetailBox: { flex: 1, alignItems: "center" },
  cardDetailLabel: { color: "#A8C5B5", fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },
  cardDetailValue: { color: "#FFFFFF", fontSize: 11, fontWeight: "900", marginTop: 2 },
  cardDetailRule: { width: 1, height: 20, backgroundColor: "rgba(255,255,255,0.1)" },

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

  standingsCard: { marginHorizontal: 18, marginTop: 10, padding: 14, borderRadius: 18, backgroundColor: "rgba(14, 44, 34, 0.92)", borderWidth: 1, borderColor: "rgba(62, 232, 181, 0.3)", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
  standingsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  standingsTitle: { color: "#FFF9FC", fontSize: 11, fontWeight: "900", letterSpacing: 0.8, textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  standingsBadge: { backgroundColor: "rgba(62, 232, 181, 0.15)", borderWidth: 1, borderColor: "rgba(62, 232, 181, 0.3)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  standingsBadgeText: { color: "#3EE8B5", fontSize: 8.5, fontWeight: "900", letterSpacing: 0.5 },

  top3Row: { flexDirection: "row", gap: 8 },
  top3Item: { flex: 1, backgroundColor: "#0B231B", borderWidth: 1, borderRadius: 12, padding: 8, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 2 },
  top3Medal: { fontSize: 14, marginBottom: 2 },
  top3Name: { color: "#FFFFFF", fontSize: 10, fontWeight: "900", width: "100%", textAlign: "center", textShadowColor: "rgba(0,0,0,0.4)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1 },
  top3Lp: { color: "#94A3B8", fontSize: 8.5, fontWeight: "800", marginTop: 1 },
});
