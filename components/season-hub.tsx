import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { getRank, getLeagueTier, type PlayerProgress } from "@/shared/progression";
import { type LeaderboardEntry, BOARD_SIZES, type BoardSize } from "@/shared/game";
import { socialManager, type FriendUser } from "@/shared/social";
import { triggerHapticSelection, triggerHapticSuccess } from "@/shared/audio-haptics";

type SeasonTab = "leaderboard" | "friends";
type RankingType = "lp" | "level";

// Lig Kademesi (LP) Sıralaması için Özel Yarışmacılar
const MOCK_LP_LEADERBOARD: LeaderboardEntry[] = [
  { id: "lp1", name: "Radyant_Yalçın", score: 9200, wins: 84, matches: 92, bestRound: 580, lp: 10450, tier: "RADIAN", level: 32 },
  { id: "lp2", name: "Ege Neon", score: 4850, wins: 38, matches: 45, bestRound: 420, lp: 7800, tier: "ÖLÜMSÜZLÜK", level: 24 },
  { id: "lp3", name: "Kraliçe_Bora", score: 6100, wins: 52, matches: 64, bestRound: 490, lp: 5900, tier: "YÜCELİK", level: 29 },
  { id: "lp4", name: "Zeynep Matrix", score: 3900, wins: 28, matches: 35, bestRound: 380, lp: 4100, tier: "ELMAS", level: 21 },
  { id: "lp5", name: "Kaan Kiber", score: 3200, wins: 22, matches: 30, bestRound: 310, lp: 2850, tier: "PLATİN", level: 16 },
  { id: "lp6", name: "Selin Vektör", score: 2600, wins: 18, matches: 25, bestRound: 290, lp: 2150, tier: "ALTIN", level: 14 },
  { id: "lp7", name: "Deniz Siber", score: 2100, wins: 14, matches: 20, bestRound: 260, lp: 1350, tier: "GÜMÜŞ", level: 12 },
  { id: "lp8", name: "Barış Piksel", score: 1450, wins: 9, matches: 15, bestRound: 210, lp: 620, tier: "BRONZ", level: 9 },
];

// Seviye Sıralaması için Özel Yarışmacılar (En çok XP / Seviye kasan tecrübeli ustalar)
const MOCK_LEVEL_LEADERBOARD: LeaderboardEntry[] = [
  { id: "lvl1", name: "Usta_Kelimeci", score: 14200, wins: 120, matches: 140, bestRound: 640, lp: 3400, tier: "PLATİN", level: 71 },
  { id: "lvl2", name: "Gece_Avcısı", score: 11800, wins: 98, matches: 115, bestRound: 550, lp: 5200, tier: "YÜCELİK", level: 59 },
  { id: "lvl3", name: "Prof_Murat", score: 9900, wins: 76, matches: 90, bestRound: 510, lp: 2400, tier: "ALTIN", level: 49 },
  { id: "lvl4", name: "Leyla_Harf", score: 8400, wins: 64, matches: 80, bestRound: 460, lp: 1900, tier: "ALTIN", level: 42 },
  { id: "lvl5", name: "Ege Neon", score: 4850, wins: 38, matches: 45, bestRound: 420, lp: 7800, tier: "ÖLÜMSÜZLÜK", level: 24 },
  { id: "lvl6", name: "Taktik_Mete", score: 4100, wins: 32, matches: 40, bestRound: 390, lp: 1200, tier: "GÜMÜŞ", level: 20 },
  { id: "lvl7", name: "Kaan Kiber", score: 3200, wins: 22, matches: 30, bestRound: 310, lp: 2850, tier: "PLATİN", level: 16 },
  { id: "lvl8", name: "Çaylak_Ozan", score: 1800, wins: 12, matches: 18, bestRound: 240, lp: 400, tier: "DEMİR", level: 9 },
];

export function SeasonHub({
  playerId,
  playerName = "OYUNCU",
  progress,
  leaderboard,
  onBack,
  onChallengeFriend,
  onUpdateFriends,
  onInspectUser,
}: {
  playerId: string;
  playerName?: string;
  progress: PlayerProgress;
  leaderboard: LeaderboardEntry[];
  onBack: () => void;
  onChallengeFriend?: (friendName: string, size: BoardSize) => void;
  onUpdateFriends?: (updatedFriends: FriendUser[]) => void;
  onInspectUser?: (user: Partial<LeaderboardEntry> & { id: string; name: string }) => void;
}) {
  const [activeTab, setActiveTab] = useState<SeasonTab>("leaderboard");
  const [leaderboardFilter, setLeaderboardFilter] = useState<"global" | "friends">("global");
  const [rankingType, setRankingType] = useState<RankingType>("lp");
  const [friendInput, setFriendInput] = useState("");
  const [friendsList, setFriendsList] = useState<FriendUser[]>(() => socialManager.getFriends());
  const [socialMessage, setSocialMessage] = useState<string | null>(null);
  // Board size picker modal state
  const [challengeTarget, setChallengeTarget] = useState<FriendUser | null>(null);

  useEffect(() => {
    socialManager.init().then((list) => {
      setFriendsList([...list]);
    });
  }, []);

  const rank = getRank(progress);
  const onlineFriendsCount = friendsList.filter((f) => f.isOnline).length;

  // Ensure current user is in full pool with their latest progress depending on rankingType
  const basePool = useMemo(() => {
    const defaultMock = rankingType === "level" ? MOCK_LEVEL_LEADERBOARD : MOCK_LP_LEADERBOARD;
    const rawList = leaderboard.length > 0 ? [...leaderboard] : [...defaultMock];
    const userIndex = rawList.findIndex((e) => e.id === playerId);
    const userTier = getLeagueTier(progress);
    const userEntry: LeaderboardEntry = {
      id: playerId,
      name: playerName,
      score: progress.xp ?? 0,
      wins: progress.wins ?? 0,
      matches: progress.matches ?? 0,
      bestRound: progress.bestScore ?? 0,
      lp: progress.lp ?? 0,
      tier: userTier.tier,
      level: Math.floor((progress.xp ?? 0) / 200) + 1,
    };
    if (userIndex >= 0) {
      rawList[userIndex] = userEntry;
    } else {
      rawList.push(userEntry);
    }
    return rawList;
  }, [leaderboard, playerId, playerName, progress, rankingType]);

  // Filtered & Sorted Leaderboard
  const displayedLeaderboard = useMemo(() => {
    let pool = basePool;

    if (leaderboardFilter === "friends") {
      const friendNames = new Set(friendsList.map((f) => f.name.toLocaleLowerCase("tr-TR")));
      const friendUsernames = new Set(friendsList.map((f) => f.username.toLocaleLowerCase("tr-TR")));
      pool = basePool.filter(
        (entry) =>
          entry.id === playerId ||
          friendNames.has(entry.name.toLocaleLowerCase("tr-TR")) ||
          friendUsernames.has(entry.name.toLocaleLowerCase("tr-TR"))
      );
    }

    return [...pool].sort((a, b) => {
      if (rankingType === "level") {
        const lvlA = a.level ?? Math.floor(a.score / 200) + 1;
        const lvlB = b.level ?? Math.floor(b.score / 200) + 1;
        if (lvlB !== lvlA) return lvlB - lvlA;
        return b.score - a.score;
      }
      // "lp" sort
      const lpA = a.lp ?? a.score;
      const lpB = b.lp ?? b.score;
      return lpB - lpA;
    });
  }, [basePool, leaderboardFilter, rankingType, friendsList, playerId]);

  // Current user's standing in the leaderboard
  const userEntryIndex = displayedLeaderboard.findIndex((e) => e.id === playerId);
  const userEntry = userEntryIndex >= 0 ? displayedLeaderboard[userEntryIndex] : null;
  const userRankPosition = userEntryIndex >= 0 ? userEntryIndex + 1 : null;
  const isLpRank = rankingType === "lp";
  const top1Score = isLpRank ? (displayedLeaderboard[0]?.lp ?? displayedLeaderboard[0]?.score ?? 0) : (displayedLeaderboard[0]?.score ?? 0);
  const userScore = isLpRank ? (userEntry?.lp ?? progress.lp ?? 0) : (userEntry?.score ?? progress.xp ?? 0);
  const scoreDiffToLeader = Math.max(0, top1Score - userScore);

  // Top 3 Podium
  const top1 = displayedLeaderboard[0] || null;
  const top2 = displayedLeaderboard[1] || null;
  const top3 = displayedLeaderboard[2] || null;
  const restOfLeaderboard = displayedLeaderboard.slice(3);

  const handleAddFriend = () => {
    if (!friendInput.trim()) return;
    triggerHapticSelection();
    const res = socialManager.addFriend(friendInput);
    setSocialMessage(res.message);
    if (res.success) {
      triggerHapticSuccess();
      const updated = [...socialManager.getFriends()];
      setFriendsList(updated);
      onUpdateFriends?.(updated);
      setFriendInput("");
    }
    setTimeout(() => setSocialMessage(null), 3500);
  };

  const handleRemoveFriend = (friend: FriendUser) => {
    Alert.alert(
      "Arkadaşı Çıkar",
      `${friend.name} (@${friend.username}) arkadaş listenizden çıkarılsın mı?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Çıkar",
          style: "destructive",
          onPress: () => {
            triggerHapticSelection();
            socialManager.removeFriend(friend.id);
            const updated = [...socialManager.getFriends()];
            setFriendsList(updated);
            onUpdateFriends?.(updated);
          },
        },
      ]
    );
  };

  const handleDuelPress = (friend: FriendUser) => {
    triggerHapticSelection();
    setChallengeTarget(friend);
  };

  const handleSizeSelect = (size: BoardSize) => {
    if (!challengeTarget || !onChallengeFriend) return;
    triggerHapticSuccess();
    onChallengeFriend(challengeTarget.name, size);
    setChallengeTarget(null);
  };

  const SIZE_LABELS: Record<BoardSize, { label: string; desc: string; color: string }> = {
    4:  { label: "4×4", desc: "Hızlı · 55 sn", color: "#00F5D4" },
    6:  { label: "6×6", desc: "Orta · 75 sn",  color: "#A78BFA" },
    8:  { label: "8×8", desc: "Zorlu · 95 sn", color: "#FB923C" },
    10: { label: "10×10", desc: "Efsane · 125 sn", color: "#FFC24A" },
  };

  return (
    <>
      {/* Board size picker modal */}
      <Modal
        visible={challengeTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setChallengeTarget(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setChallengeTarget(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalKicker}>DÜELLO GÖNDERİLİYOR</Text>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {challengeTarget?.name}
            </Text>
            <Text style={styles.modalSubtitle}>Tahta boyutunu seç</Text>
            <View style={styles.sizeGrid}>
              {(BOARD_SIZES as readonly BoardSize[]).map((size) => {
                const info = SIZE_LABELS[size];
                return (
                  <Pressable
                    key={size}
                    style={({ pressed }) => [
                      styles.sizeBtn,
                      { borderColor: info.color },
                      pressed && { opacity: 0.75 },
                    ]}
                    onPress={() => handleSizeSelect(size)}
                  >
                    <Text style={[styles.sizeBtnLabel, { color: info.color }]}>{info.label}</Text>
                    <Text style={styles.sizeBtnDesc}>{info.desc}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable onPress={() => setChallengeTarget(null)} style={styles.modalCancel}>
              <Text style={styles.modalCancelText}>İPTAL</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.back}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View style={{ flex: 1, marginRight: 6 }}>
            <Text style={styles.overline}>SEZON 01 · TOPLULUK &amp; REKABET</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={styles.title}>
              LİDERLİK VE ARKADAŞLIK
            </Text>
          </View>
          <View style={styles.rankOrb}>
            <Text style={styles.rankOrbText}>{rank.slice(0, 1)}</Text>
          </View>
        </View>

        {/* Sub-tabs */}
        <View style={styles.tabSwitcher}>
          <Pressable
            onPress={() => { triggerHapticSelection(); setActiveTab("leaderboard"); }}
            style={[styles.tabBtn, activeTab === "leaderboard" && styles.tabBtnActive]}
          >
            <Text numberOfLines={1} style={[styles.tabBtnText, activeTab === "leaderboard" && styles.tabBtnTextActive]}>
              🏆 LİDERLİK TABLOSU
            </Text>
          </Pressable>

          <Pressable
            onPress={() => { triggerHapticSelection(); setActiveTab("friends"); }}
            style={[styles.tabBtn, activeTab === "friends" && styles.tabBtnActive]}
          >
            <Text numberOfLines={1} style={[styles.tabBtnText, activeTab === "friends" && styles.tabBtnTextActive]}>
              👥 ARKADAŞLAR ({friendsList.length})
            </Text>
          </Pressable>
        </View>

        {/* TAB 1: Leaderboard */}
        {activeTab === "leaderboard" && (
          <View>
            {/* User Standing Highlight Card */}
            <View style={styles.userStatusCard}>
              <View style={styles.userStatusLeft}>
                <View style={styles.userStatusAvatarOrb}>
                  <Text style={styles.userStatusAvatarText}>{playerName.slice(0, 1).toLocaleUpperCase("tr-TR")}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text numberOfLines={1} style={styles.userStatusName}>{playerName}</Text>
                    <View style={styles.userRankBadge}>
                      <Text style={styles.userRankBadgeText}>{rank}</Text>
                    </View>
                  </View>
                  <Text style={styles.userStatusSub}>
                    {userRankPosition ? `${userRankPosition}. SIRADASIN` : "SIRALAMA DIŞI"} · {userScore} PUAN
                  </Text>
                </View>
              </View>
              <View style={styles.userStatusRight}>
                {userRankPosition === 1 ? (
                  <View style={styles.leaderCrownBadge}>
                    <Text style={styles.leaderCrownText}>👑 LİDERSİN</Text>
                  </View>
                ) : scoreDiffToLeader > 0 ? (
                  <View style={styles.diffBadge}>
                    <Text style={styles.diffKicker}>ZİRVEYE KALAN</Text>
                    <Text style={styles.diffScore}>-{scoreDiffToLeader} P</Text>
                  </View>
                ) : (
                  <View style={styles.diffBadge}>
                    <Text style={styles.diffKicker}>DÜELLO YAP</Text>
                    <Text style={styles.diffScore}>PUAN KAZAN</Text>
                  </View>
                )}
              </View>
            </View>


            {/* Filter Buttons: Global vs Friends & Ranking Metric Toggle */}
            <View style={{ gap: 10, marginBottom: 16 }}>
              {/* Metric Switcher: LP vs Level */}
              <View style={{ flexDirection: "row", gap: 8, backgroundColor: "rgba(19, 13, 43, 0.8)", padding: 4, borderRadius: 14, borderWidth: 1, borderColor: "rgba(124, 58, 237, 0.25)" }}>
                <Pressable
                  onPress={() => { triggerHapticSelection(); setRankingType("lp"); }}
                  style={[{ flex: 1, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" }, rankingType === "lp" && { backgroundColor: "#7C3AED" }]}
                >
                  <Text style={[{ fontSize: 11, fontWeight: "900", color: "#94A3B8" }, rankingType === "lp" && { color: "#FFFFFF" }]}>
                    🛡️ LİG KADEMESİ (LP)
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => { triggerHapticSelection(); setRankingType("level"); }}
                  style={[{ flex: 1, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" }, rankingType === "level" && { backgroundColor: "#38BDF8" }]}
                >
                  <Text style={[{ fontSize: 11, fontWeight: "900", color: "#94A3B8" }, rankingType === "level" && { color: "#0B132B" }]}>
                    ⚡ SEVİYE SIRALAMASI
                  </Text>
                </Pressable>
              </View>

              {/* Scope Switcher: Global vs Friends */}
              <View style={styles.leaderFilterRow}>
                <Pressable
                  onPress={() => { triggerHapticSelection(); setLeaderboardFilter("global"); }}
                  style={[styles.filterChip, leaderboardFilter === "global" && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, leaderboardFilter === "global" && styles.filterChipTextActive]}>
                    🌐 GENEL SIRALAMA ({displayedLeaderboard.length})
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => { triggerHapticSelection(); setLeaderboardFilter("friends"); }}
                  style={[styles.filterChip, leaderboardFilter === "friends" && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, leaderboardFilter === "friends" && styles.filterChipTextActive]}>
                    👥 ARKADAŞLAR ({friendsList.length})
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Podium (Top 3) */}
            {displayedLeaderboard.length >= 2 && (
              <View style={styles.podiumContainer}>
                {/* 2nd Place */}
                {top2 && (
                  <Pressable
                    style={[styles.podiumColumn, styles.podiumCol2]}
                    onPress={() => {
                      triggerHapticSelection();
                      onInspectUser?.(top2);
                    }}
                  >
                    <View style={[styles.podiumAvatarWrap, styles.podiumAvatarWrap2]}>
                      <Text style={styles.podiumAvatarText}>{top2.name.slice(0, 1).toLocaleUpperCase("tr-TR")}</Text>
                      <View style={[styles.podiumRankBadge, styles.podiumRankBadge2]}>
                        <Text style={styles.podiumRankNum}>2</Text>
                      </View>
                    </View>
                    <Text numberOfLines={1} style={styles.podiumName}>{top2.name}</Text>
                    {top2.tier ? (
                      <View style={[styles.tierBadge, { borderColor: getLeagueTier(top2.lp ?? 0).color }]}>
                        <Text style={[styles.tierBadgeText, { color: getLeagueTier(top2.lp ?? 0).color }]}>{top2.tier}</Text>
                      </View>
                    ) : null}
                    <Text style={styles.podiumScore}>
                      {rankingType === "level"
                        ? `Lv.${top2.level ?? Math.floor(top2.score / 200) + 1} (${top2.score} XP)`
                        : `${top2.lp ?? top2.score} LP`}
                    </Text>
                    <View style={styles.podiumBar2}>
                      <Text style={styles.podiumBarLabel}>🥈 İKİNCİ</Text>
                    </View>
                  </Pressable>
                )}

                {/* 1st Place (Center, Tallest) */}
                {top1 && (
                  <Pressable
                    style={[styles.podiumColumn, styles.podiumCol1]}
                    onPress={() => {
                      triggerHapticSelection();
                      onInspectUser?.(top1);
                    }}
                  >
                    <Text style={styles.crownIcon}>👑</Text>
                    <View style={[styles.podiumAvatarWrap, styles.podiumAvatarWrap1]}>
                      <Text style={styles.podiumAvatarText}>{top1.name.slice(0, 1).toLocaleUpperCase("tr-TR")}</Text>
                      <View style={[styles.podiumRankBadge, styles.podiumRankBadge1]}>
                        <Text style={styles.podiumRankNum}>1</Text>
                      </View>
                    </View>
                    <Text numberOfLines={1} style={styles.podiumName}>{top1.name}</Text>
                    {top1.tier ? (
                      <View style={[styles.tierBadge, { borderColor: getLeagueTier(top1.lp ?? 0).color }]}>
                        <Text style={[styles.tierBadgeText, { color: getLeagueTier(top1.lp ?? 0).color }]}>{top1.tier}</Text>
                      </View>
                    ) : null}
                    <Text style={[styles.podiumScore, { color: "#FFD000" }]}>
                      {rankingType === "level"
                        ? `Lv.${top1.level ?? Math.floor(top1.score / 200) + 1} (${top1.score} XP)`
                        : `${top1.lp ?? top1.score} LP`}
                    </Text>
                    <View style={styles.podiumBar1}>
                      <Text style={styles.podiumBarLabel}>🥇 ŞAMPİYON</Text>
                    </View>
                  </Pressable>
                )}

                {/* 3rd Place */}
                {top3 && (
                  <Pressable
                    style={[styles.podiumColumn, styles.podiumCol3]}
                    onPress={() => {
                      triggerHapticSelection();
                      onInspectUser?.(top3);
                    }}
                  >
                    <View style={[styles.podiumAvatarWrap, styles.podiumAvatarWrap3]}>
                      <Text style={styles.podiumAvatarText}>{top3.name.slice(0, 1).toLocaleUpperCase("tr-TR")}</Text>
                      <View style={[styles.podiumRankBadge, styles.podiumRankBadge3]}>
                        <Text style={styles.podiumRankNum}>3</Text>
                      </View>
                    </View>
                    <Text numberOfLines={1} style={styles.podiumName}>{top3.name}</Text>
                    {top3.tier ? (
                      <View style={[styles.tierBadge, { borderColor: getLeagueTier(top3.lp ?? 0).color }]}>
                        <Text style={[styles.tierBadgeText, { color: getLeagueTier(top3.lp ?? 0).color }]}>{top3.tier}</Text>
                      </View>
                    ) : null}
                    <Text style={styles.podiumScore}>
                      {rankingType === "level"
                        ? `Lv.${top3.level ?? Math.floor(top3.score / 200) + 1} (${top3.score} XP)`
                        : `${top3.lp ?? top3.score} LP`}
                    </Text>
                    <View style={styles.podiumBar3}>
                      <Text style={styles.podiumBarLabel}>🥉 ÜÇÜNCÜ</Text>
                    </View>
                  </Pressable>
                )}
              </View>
            )}

            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>
                {displayedLeaderboard.length >= 3 ? "DİĞER YARIŞMACILAR" : "SIRALAMA"}
              </Text>
              <Text style={styles.sectionMeta}>{displayedLeaderboard.length} AVCI</Text>
            </View>

            <View style={styles.board}>
              {(displayedLeaderboard.length >= 3 ? restOfLeaderboard : displayedLeaderboard).length ? (
                (displayedLeaderboard.length >= 3 ? restOfLeaderboard : displayedLeaderboard).map((entry, sliceIdx) => {
                  const index = displayedLeaderboard.length >= 3 ? sliceIdx + 3 : sliceIdx;
                  const winRate = entry.matches > 0 ? Math.round((entry.wins / entry.matches) * 100) : 0;
                  const isUser = entry.id === playerId;
                  const tierInfo = getLeagueTier(entry.lp ?? 0);
                  return (
                    <Pressable
                      key={entry.id}
                      style={({ pressed }) => [styles.row, isUser && styles.rowUser, pressed && { opacity: 0.75 }]}
                      onPress={() => {
                        triggerHapticSelection();
                        onInspectUser?.(entry);
                      }}
                    >
                      <View style={styles.position}>
                        <Text style={styles.positionText}>
                          {index + 1}
                        </Text>
                      </View>
                      <View style={styles.playerMark}>
                        <Text style={styles.playerMarkText}>
                          {entry.name.slice(0, 1).toLocaleUpperCase("tr-TR")}
                        </Text>
                      </View>
                      <View style={styles.playerCopy}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                          <Text numberOfLines={1} style={[styles.playerName, isUser && { color: "#00F5D4" }]}>
                            {entry.name}
                          </Text>
                          {isUser && (
                            <View style={styles.userSelfTag}>
                              <Text style={styles.userSelfTagText}>SEN</Text>
                            </View>
                          )}
                          {entry.tier && (
                            <View style={[styles.rowTierBadge, { borderColor: tierInfo.color }]}>
                              <Text style={[styles.rowTierText, { color: tierInfo.color }]}>{entry.tier}</Text>
                            </View>
                          )}
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
                          <Text style={styles.playerMeta}>
                            {entry.wins}/{entry.matches} Galibiyet
                          </Text>
                          {entry.matches > 0 && (
                            <View style={[styles.winRateBadge, winRate >= 50 ? styles.winRateHigh : styles.winRateNormal]}>
                              <Text style={styles.winRateText}>%{winRate}</Text>
                            </View>
                          )}
                          <Text style={styles.playerMeta}>· En İyi: {entry.bestRound}</Text>
                        </View>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        {rankingType === "level" ? (
                          <View style={{ alignItems: "flex-end" }}>
                            <View style={{ backgroundColor: "#38BDF820", borderWidth: 1, borderColor: "#38BDF855", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginBottom: 2 }}>
                              <Text style={{ color: "#38BDF8", fontSize: 11, fontWeight: "900" }}>SEVİYE {entry.level ?? Math.floor(entry.score / 200) + 1}</Text>
                            </View>
                            <Text style={{ color: "#94A3B8", fontSize: 10, fontWeight: "700" }}>{entry.score} XP</Text>
                          </View>
                        ) : (
                          <View style={{ alignItems: "flex-end" }}>
                            <Text style={styles.score}>{entry.lp ?? entry.score} LP</Text>
                            <Text style={styles.rowLpText}>{entry.score} XP</Text>
                          </View>
                        )}
                      </View>
                    </Pressable>
                  );
                })
              ) : (
                <View style={styles.emptyBoard}>
                  <Text style={styles.emptyTitle}>
                    {leaderboardFilter === "friends" ? "ARKADAŞLARINDAN HENÜZ MAÇ YAPAN YOK" : "SIRALAMA AÇIK"}
                  </Text>
                  <Text style={styles.emptyCopy}>
                    {leaderboardFilter === "friends"
                      ? "Arkadaşlarını düelloya davet et ve sıralamada ilk sıraya yerleş!"
                      : "İlk tamamlanan canlı düello burada sezona yazılır."}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* TAB 2: Friends */}
        {activeTab === "friends" && (
          <View>
            <View style={styles.socialHero}>
              <Text style={styles.socialHeroKicker}>TOPLULUK AĞI</Text>
              <Text style={styles.socialHeroTitle}>ARKADAŞLARINLA YARIŞ</Text>
              <Text style={styles.socialHeroBody}>
                {friendsList.length} arkadaş listende · {onlineFriendsCount} şu an çevrim içi
              </Text>
            </View>

            <View style={styles.addCard}>
              <Text style={styles.addCardLabel}>YENİ ARKADAŞ EKLE</Text>
              <View style={styles.addFriendRow}>
                <TextInput
                  value={friendInput}
                  onChangeText={setFriendInput}
                  placeholder="Kullanıcı adı girin (Örn: neon_007)"
                  placeholderTextColor="#877A9E"
                  autoCapitalize="none"
                  style={styles.addFriendInput}
                />
                <Pressable onPress={handleAddFriend} style={styles.addFriendBtn}>
                  <Text style={styles.addFriendBtnText}>EKLE</Text>
                </Pressable>
              </View>
              {socialMessage && <Text style={styles.socialMsg}>{socialMessage}</Text>}
            </View>

            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>ARKADAŞ LİSTESİ</Text>
              <Text style={styles.sectionMeta}>{onlineFriendsCount} ÇEVRİM İÇİ</Text>
            </View>

            <View style={styles.friendsBoard}>
              {friendsList.length === 0 && (
                <View style={styles.emptyBoard}>
                  <Text style={styles.emptyTitle}>LİSTE BOŞ</Text>
                  <Text style={styles.emptyCopy}>Yukarıdan kullanıcı adı girerek arkadaş ekleyebilirsin.</Text>
                </View>
              )}
              {friendsList.map((f) => (
                <View key={f.id} style={styles.friendRow}>
                  {/* Top row: avatar + info + status dot + remove */}
                  <View style={styles.friendRowTop}>
                    <Pressable
                      style={{ flexDirection: "row", alignItems: "center", flex: 1, minWidth: 0, gap: 10 }}
                      onPress={() => {
                        triggerHapticSelection();
                        onInspectUser?.(f);
                      }}
                    >
                      <Text style={styles.friendAvatarText}>{f.avatar}</Text>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Text numberOfLines={1} style={styles.friendNameText}>{f.name}</Text>
                          <View style={{ backgroundColor: "#38BDF820", borderWidth: 1, borderColor: "#38BDF855", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 }}>
                            <Text style={{ color: "#38BDF8", fontSize: 9, fontWeight: "900" }}>SEVİYE {f.level ?? Math.floor(f.xp / 200) + 1}</Text>
                          </View>
                        </View>
                        <Text numberOfLines={1} style={styles.friendXpText}>@{f.username} · {f.tier ?? "DEMİR"} ({f.lp ?? f.xp} LP) · {f.xp} XP</Text>
                      </View>
                    </Pressable>
                    <View style={styles.statusWrap}>
                      <View style={[styles.onlineDot, f.isOnline ? styles.onlineDotActive : styles.onlineDotOffline]} />
                      <Text style={styles.onlineStatusText}>{f.isOnline ? "ÇEVRİM İÇİ" : "ÇEVRİM DIŞI"}</Text>
                    </View>
                    <Pressable
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      onPress={() => handleRemoveFriend(f)}
                      style={({ pressed }) => [styles.removeFriendBtn, pressed && { opacity: 0.6 }]}
                    >
                      <Text style={styles.removeFriendText}>✕</Text>
                    </Pressable>
                  </View>

                  {/* Bottom row: challenge button */}
                  {onChallengeFriend && (
                    <Pressable
                      onPress={() => handleDuelPress(f)}
                      style={({ pressed }) => [styles.challengeBtn, pressed && { opacity: 0.8 }]}
                    >
                      <Text style={styles.challengeBtnText}>⚡ DÜELLO GÖNDERİ OLUŞTUR</Text>
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </>
  );
}


const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 130 },
  header: { flexDirection: "row", alignItems: "center", gap: 11 },
  back: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "#251E45",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { color: "#FFF9FC", fontSize: 30, lineHeight: 30 },
  overline: { color: "#B7AAD1", fontSize: 8, letterSpacing: 0.8, fontWeight: "900" },
  title: { color: "#FFF9FC", fontSize: 16, fontWeight: "900", marginTop: 2, letterSpacing: 0.2 },
  rankOrb: {
    width: 35,
    height: 35,
    borderRadius: 18,
    marginLeft: "auto",
    backgroundColor: "#493477",
    borderWidth: 1,
    borderColor: "#FFC24A",
    alignItems: "center",
    justifyContent: "center",
  },
  rankOrbText: { color: "#FFC24A", fontWeight: "900" },

  /* Segmented Sub-Tab Switcher */
  tabSwitcher: {
    flexDirection: "row",
    backgroundColor: "rgba(23, 17, 44, 0.85)",
    borderRadius: 16,
    padding: 4,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "rgba(124, 92, 246, 0.25)",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBtnActive: {
    backgroundColor: "#7C3AED",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  tabBtnText: {
    color: "#8E82A8",
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  tabBtnTextActive: {
    color: "#FFFFFF",
  },

  /* Hero Cards */
  hero: {
    marginTop: 14,
    padding: 18,
    borderRadius: 24,
    backgroundColor: "#34275E",
    borderWidth: 1,
    borderColor: "#7B63C9",
  },
  heroKicker: { color: "#FFD37F", fontSize: 8, letterSpacing: 1, fontWeight: "900" },
  heroTitle: { color: "#FFF9FC", fontSize: 25, fontWeight: "900", marginTop: 6 },
  heroBody: { color: "#D8CDEB", fontSize: 11, marginTop: 4 },
  heroStats: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#5B4B90",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statLabel: { color: "#BEB1D7", fontSize: 7, fontWeight: "900", letterSpacing: 0.7 },
  statValue: { color: "#FFF9FC", fontSize: 14, fontWeight: "900", marginTop: 3 },
  statRule: { width: 1, height: 27, backgroundColor: "#5C4D90" },

  /* Social Hero */
  socialHero: {
    marginTop: 14,
    padding: 18,
    borderRadius: 24,
    backgroundColor: "rgba(35, 25, 68, 0.9)",
    borderWidth: 1.5,
    borderColor: "rgba(0, 245, 212, 0.35)",
  },
  socialHeroKicker: { color: "#00F5D4", fontSize: 8, letterSpacing: 1, fontWeight: "900" },
  socialHeroTitle: { color: "#FFF9FC", fontSize: 23, fontWeight: "900", marginTop: 6 },
  socialHeroBody: { color: "#D8CDEB", fontSize: 11, marginTop: 4 },

  /* Mystery Card */
  mysteryCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: "#261A46",
    borderWidth: 1,
    borderColor: "#8B5CF6",
  },
  mysteryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  mysteryKicker: { color: "#C4B5FD", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  mysteryReward: { color: "#00F5D4", fontSize: 9, fontWeight: "900" },
  mysteryDef: {
    color: "#FFF9FC",
    fontSize: 12,
    fontWeight: "700",
    fontStyle: "italic",
    lineHeight: 17,
  },
  mysteryHint: { color: "#A78BFA", fontSize: 8, fontWeight: "800", marginTop: 6 },

  /* User Status Banner */
  userStatusCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 20,
    backgroundColor: "rgba(30, 22, 58, 0.95)",
    borderWidth: 1.5,
    borderColor: "#6D28D9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#6D28D9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  userStatusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  userStatusAvatarOrb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#7C3AED",
    borderWidth: 2,
    borderColor: "#00F5D4",
    alignItems: "center",
    justifyContent: "center",
  },
  userStatusAvatarText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },
  userStatusName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  userRankBadge: {
    backgroundColor: "rgba(0, 245, 212, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#00F5D4",
  },
  userRankBadgeText: {
    color: "#00F5D4",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  userStatusSub: {
    color: "#B7AAD1",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 3,
  },
  userStatusRight: {
    marginLeft: 10,
    alignItems: "flex-end",
  },
  leaderCrownBadge: {
    backgroundColor: "rgba(255, 208, 0, 0.15)",
    borderWidth: 1,
    borderColor: "#FFD000",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  leaderCrownText: {
    color: "#FFD000",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  diffBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  diffKicker: {
    color: "#9F93B6",
    fontSize: 7.5,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  diffScore: {
    color: "#FFC24A",
    fontSize: 11,
    fontWeight: "900",
    marginTop: 1,
  },

  /* Filter Switcher (Global vs Friends) */
  leaderFilterRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  filterChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(23, 17, 44, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(124, 92, 246, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipActive: {
    backgroundColor: "rgba(124, 58, 237, 0.35)",
    borderColor: "#7C3AED",
  },
  filterChipText: {
    color: "#8E82A8",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  filterChipTextActive: {
    color: "#00F5D4",
  },

  /* Podium (Top 3) */
  podiumContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    marginTop: 16,
    paddingHorizontal: 8,
    gap: 10,
  },
  podiumColumn: {
    flex: 1,
    alignItems: "center",
  },
  podiumCol1: {
    zIndex: 3,
  },
  podiumCol2: {
    zIndex: 2,
  },
  podiumCol3: {
    zIndex: 1,
  },
  crownIcon: {
    fontSize: 20,
    marginBottom: -4,
  },
  podiumAvatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    position: "relative",
  },
  podiumAvatarWrap1: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#3A2A68",
    borderColor: "#FFD000",
    shadowColor: "#FFD000",
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  podiumAvatarWrap2: {
    backgroundColor: "#2E2452",
    borderColor: "#94A3B8",
  },
  podiumAvatarWrap3: {
    backgroundColor: "#2E2452",
    borderColor: "#FB923C",
  },
  podiumAvatarText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "900",
  },
  podiumRankBadge: {
    position: "absolute",
    bottom: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  podiumRankBadge1: {
    backgroundColor: "#FFD000",
    borderColor: "#FFF",
  },
  podiumRankBadge2: {
    backgroundColor: "#94A3B8",
    borderColor: "#FFF",
  },
  podiumRankBadge3: {
    backgroundColor: "#FB923C",
    borderColor: "#FFF",
  },
  podiumRankNum: {
    color: "#000",
    fontSize: 10,
    fontWeight: "900",
  },
  podiumName: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    marginTop: 8,
    textAlign: "center",
  },
  tierBadge: {
    marginTop: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
    borderWidth: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  tierBadgeText: {
    fontSize: 7.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  rowTierBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  rowTierText: {
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  rowLpText: {
    color: "#FFC24A",
    fontSize: 8.5,
    fontWeight: "800",
    marginTop: 2,
  },
  podiumScore: {
    color: "#55E6B2",
    fontSize: 11,
    fontWeight: "900",
    marginTop: 2,
  },
  podiumBar1: {
    width: "100%",
    height: 64,
    backgroundColor: "rgba(255, 208, 0, 0.15)",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 208, 0, 0.4)",
    borderBottomWidth: 0,
    alignItems: "center",
    paddingTop: 8,
    marginTop: 8,
  },
  podiumBar2: {
    width: "100%",
    height: 48,
    backgroundColor: "rgba(148, 163, 184, 0.12)",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.3)",
    borderBottomWidth: 0,
    alignItems: "center",
    paddingTop: 8,
    marginTop: 8,
  },
  podiumBar3: {
    width: "100%",
    height: 38,
    backgroundColor: "rgba(251, 146, 60, 0.12)",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(251, 146, 60, 0.3)",
    borderBottomWidth: 0,
    alignItems: "center",
    paddingTop: 8,
    marginTop: 8,
  },
  podiumBarLabel: {
    color: "#FFF",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  /* Section Head */
  sectionHead: {
    marginTop: 16,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { color: "#FFF9FC", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  sectionMeta: { color: "#988CAC", fontSize: 8, fontWeight: "900", letterSpacing: 0.6 },

  /* Board & Rows */
  board: {
    borderRadius: 20,
    backgroundColor: "#1E1836",
    borderWidth: 1,
    borderColor: "#403360",
    overflow: "hidden",
  },
  row: {
    minHeight: 54,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#30254C",
  },
  rowUser: {
    backgroundColor: "rgba(0, 245, 212, 0.08)",
    borderLeftWidth: 4,
    borderLeftColor: "#00F5D4",
  },
  userSelfTag: {
    backgroundColor: "#00F5D4",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  userSelfTagText: {
    color: "#0B071E",
    fontSize: 7.5,
    fontWeight: "900",
  },
  winRateBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  winRateHigh: {
    backgroundColor: "rgba(0, 245, 212, 0.15)",
  },
  winRateNormal: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  winRateText: {
    color: "#00F5D4",
    fontSize: 7.5,
    fontWeight: "900",
  },
  rowTop1: {
    backgroundColor: "rgba(255, 208, 0, 0.08)",
    borderLeftWidth: 4,
    borderLeftColor: "#FFD000",
  },
  rowTop2: {
    backgroundColor: "rgba(148, 163, 184, 0.06)",
    borderLeftWidth: 4,
    borderLeftColor: "#94A3B8",
  },
  rowTop3: {
    backgroundColor: "rgba(251, 146, 96, 0.06)",
    borderLeftWidth: 4,
    borderLeftColor: "#FB923C",
  },
  position: {
    width: 23,
    height: 23,
    borderRadius: 8,
    backgroundColor: "#392C5D",
    alignItems: "center",
    justifyContent: "center",
  },
  positionFirst: { backgroundColor: "#FFD000" },
  positionSecond: { backgroundColor: "#94A3B8" },
  positionThird: { backgroundColor: "#FB923C" },
  positionText: { color: "#D9CDEB", fontSize: 9, fontWeight: "900" },
  playerMark: {
    width: 29,
    height: 29,
    borderRadius: 10,
    backgroundColor: "#3C2D62",
    alignItems: "center",
    justifyContent: "center",
  },
  playerMarkText: { color: "#FFC24A", fontSize: 11, fontWeight: "900" },
  playerCopy: { flex: 1 },
  playerName: { color: "#F9F5FF", fontSize: 11, fontWeight: "900" },
  playerMeta: { color: "#9F93B6", fontSize: 7, marginTop: 3, fontWeight: "800" },
  score: { color: "#55E6B2", fontSize: 13, fontWeight: "900" },
  emptyBoard: { padding: 22, alignItems: "center" },
  emptyTitle: { color: "#FFF9FC", fontSize: 12, fontWeight: "900" },
  emptyCopy: { color: "#B8ADCD", fontSize: 10, textAlign: "center", marginTop: 5 },

  /* Add Friend Card */
  addCard: {
    marginTop: 12,
    backgroundColor: "rgba(22, 16, 42, 0.85)",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2C2250",
  },
  addCardLabel: {
    color: "#8E82A8",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  addFriendRow: { flexDirection: "row", gap: 8 },
  addFriendInput: {
    flex: 1,
    backgroundColor: "#16112C",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#FFF",
    fontSize: 12,
    borderWidth: 1,
    borderColor: "#2D2254",
  },
  addFriendBtn: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  addFriendBtnText: {
    color: "#FFF",
    fontWeight: "900",
    fontSize: 11,
    letterSpacing: 0.6,
  },
  socialMsg: {
    color: "#00F5D4",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 6,
  },

  /* Friends Board */
  friendsBoard: {
    gap: 10,
  },
  friendRow: {
    backgroundColor: "rgba(22, 16, 42, 0.85)",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2A204C",
    gap: 10,
  },
  friendRowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  friendAvatarText: { fontSize: 24 },
  friendNameText: { color: "#FFF", fontSize: 13, fontWeight: "900" },
  friendXpText: { color: "#7E7299", fontSize: 9.5, marginTop: 2 },
  statusWrap: { alignItems: "flex-end", gap: 3 },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  onlineDotActive: {
    backgroundColor: "#00F5D4",
    shadowColor: "#00F5D4",
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  onlineDotOffline: { backgroundColor: "#4C3F68" },
  onlineStatusText: {
    color: "#8E82A8",
    fontSize: 7.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  challengeBtn: {
    backgroundColor: "rgba(0, 245, 212, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(0, 245, 212, 0.5)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  challengeBtnText: {
    color: "#00F5D4",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  removeFriendBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  removeFriendText: {
    color: "#8E82A8",
    fontSize: 12,
    fontWeight: "900",
  },

  /* Board Size Picker Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(9, 6, 20, 0.82)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#1D1635",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "#4A3B75",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  modalKicker: {
    color: "#00F5D4",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    textAlign: "center",
  },
  modalTitle: {
    color: "#FFF9FC",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 4,
  },
  modalSubtitle: {
    color: "#A89BC2",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 2,
    marginBottom: 16,
  },
  sizeGrid: {
    gap: 9,
    marginBottom: 16,
  },
  sizeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#130E26",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  sizeBtnLabel: {
    fontSize: 14,
    fontWeight: "900",
  },
  sizeBtnDesc: {
    color: "#9F92BA",
    fontSize: 11,
    fontWeight: "700",
  },
  modalCancel: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  modalCancelText: {
    color: "#D2C5E8",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
});
