import { useEffect, useMemo, useState } from "react";
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import {
  getRank,
  getLeagueTier,
  getSeasonRemainingTime,
  getTierColor,
  getMinLpForTier,
  type PlayerProgress,
} from "@/shared/progression";
import { type LeaderboardEntry, BOARD_SIZES, type BoardSize } from "@/shared/game";
import { socialManager, type FriendUser, type FriendRequest } from "@/shared/social";
import { triggerHapticError, triggerHapticSelection, triggerHapticSuccess } from "@/shared/audio-haptics";
import { getApiBaseUrl } from "@/constants/oauth";
import { LeagueHub } from "@/components/league-hub";

export type SeasonTab = "leagues" | "leaderboard" | "friends";
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
  onOpenLeagueHub,
  onPlayRanked,
  initialTab,
  pendingRequests,
  onAcceptRequest,
  onRejectRequest,
  onSendFriendRequest,
}: {
  playerId: string;
  playerName?: string;
  progress: PlayerProgress;
  leaderboard: LeaderboardEntry[];
  onBack: () => void;
  onChallengeFriend?: (friendName: string, size: BoardSize) => void;
  onUpdateFriends?: (updatedFriends: FriendUser[]) => void;
  onInspectUser?: (user: Partial<LeaderboardEntry> & { id: string; name: string }) => void;
  onOpenLeagueHub?: () => void;
  onPlayRanked?: () => void;
  initialTab?: SeasonTab;
  pendingRequests?: FriendRequest[];
  onAcceptRequest?: (requestId: string) => void;
  onRejectRequest?: (requestId: string) => void;
  onSendFriendRequest?: (username: string) => Promise<{ success: boolean; message: string }>;
}) {
  const [activeTab, setActiveTab] = useState<SeasonTab>(() => initialTab || "leagues");
  const [friendsSubTab, setFriendsSubTab] = useState<"friends" | "requests">("friends");
  const [leaderboardFilter, setLeaderboardFilter] = useState<"global" | "friends">("global");
  const [rankingType, setRankingType] = useState<RankingType>("lp");
  const [friendInput, setFriendInput] = useState("");
  const [friendsList, setFriendsList] = useState<FriendUser[]>(() => socialManager.getFriends());
  const [pendingRequestsList, setPendingRequestsList] = useState<FriendRequest[]>(() => pendingRequests || socialManager.getPendingRequests());
  const [socialMessage, setSocialMessage] = useState<string | null>(null);
  // Board size picker modal state
  const [challengeTarget, setChallengeTarget] = useState<FriendUser | null>(null);
  const [remaining, setRemaining] = useState(() => getSeasonRemainingTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(getSeasonRemainingTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    const unsub = socialManager.subscribe(() => {
      setFriendsList([...socialManager.getFriends()]);
      setPendingRequestsList([...socialManager.getPendingRequests()]);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (pendingRequests) {
      setPendingRequestsList(pendingRequests);
    }
  }, [pendingRequests]);

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
      avatarPhoto: progress.avatarPhoto,
      selectedTitle: progress.selectedTitle,
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
    let pool: LeaderboardEntry[] = basePool;

    if (leaderboardFilter === "friends") {
      const poolMap = new Map<string, LeaderboardEntry>();

      // 1. Current user entry
      const userFromBase = basePool.find((e) => e.id === playerId);
      if (userFromBase) {
        poolMap.set(playerId, userFromBase);
      } else {
        const userTier = getLeagueTier(progress);
        poolMap.set(playerId, {
          id: playerId,
          name: playerName,
          score: progress.xp ?? 0,
          wins: progress.wins ?? 0,
          matches: progress.matches ?? 0,
          bestRound: progress.bestScore ?? 0,
          lp: progress.lp ?? 0,
          tier: userTier.tier,
          avatarPhoto: progress.avatarPhoto,
          selectedTitle: progress.selectedTitle,
          level: Math.floor((progress.xp ?? 0) / 200) + 1,
        });
      }

      // 2. All friends in friendsList (real-time synchronized)
      friendsList.forEach((f) => {
        poolMap.set(f.id, {
          id: f.id,
          name: f.name || f.username,
          score: f.xp ?? (f.level ? (f.level - 1) * 200 : 0),
          wins: f.wins ?? 0,
          matches: f.matches ?? 0,
          bestRound: f.bestScore ?? 0,
          lp: f.lp ?? 0,
          tier: f.tier || "DEMİR",
          avatar: f.avatar || "spark",
          avatarPhoto: f.avatarPhoto,
          selectedTitle: f.selectedTitle || "[ÇAYLAK]",
          level: f.level || 1,
        });
      });

      // 3. If any friend was also in basePool with higher/more detailed scores, merge them
      basePool.forEach((entry) => {
        if (
          friendsList.some(
            (f) =>
              f.id === entry.id ||
              f.name.toLocaleLowerCase("tr-TR") === entry.name.toLocaleLowerCase("tr-TR") ||
              f.username.toLocaleLowerCase("tr-TR") === entry.name.toLocaleLowerCase("tr-TR")
          )
        ) {
          poolMap.set(entry.id, entry);
        }
      });

      pool = Array.from(poolMap.values());
    }

    return [...pool].sort((a, b) => {
      if (rankingType === "level") {
        const lvlA = a.level ?? Math.floor(a.score / 200) + 1;
        const lvlB = b.level ?? Math.floor(b.score / 200) + 1;
        if (lvlB !== lvlA) return lvlB - lvlA;
        return b.score - a.score;
      }
      // "lp" sort
      const lpA = a.lp ?? (a.tier ? getMinLpForTier(a.tier) : 0);
      const lpB = b.lp ?? (b.tier ? getMinLpForTier(b.tier) : 0);
      return lpB - lpA;
    });
  }, [basePool, leaderboardFilter, rankingType, friendsList, playerId, playerName, progress]);

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

  const handleAddFriend = async () => {
    const cleanInput = friendInput.trim();
    if (!cleanInput) return;

    if (cleanInput.length > 64) {
      triggerHapticError();
      setSocialMessage("Kullanıcı adı veya kimliği en fazla 64 karakter olabilir.");
      setTimeout(() => setSocialMessage(null), 3500);
      return;
    }

    // Self-addition check
    if (
      cleanInput.toLocaleLowerCase("tr-TR") === (playerName || "").toLocaleLowerCase("tr-TR") ||
      cleanInput === playerId
    ) {
      triggerHapticError();
      setSocialMessage("Kendinizi arkadaş olarak ekleyemezsiniz.");
      setTimeout(() => setSocialMessage(null), 3500);
      return;
    }

    triggerHapticSelection();

    // Check if already in friends
    const exists = friendsList.some(
      (f) =>
        f.username.toLocaleLowerCase("tr-TR") === cleanInput.toLocaleLowerCase("tr-TR") ||
        f.name.toLocaleLowerCase("tr-TR") === cleanInput.toLocaleLowerCase("tr-TR") ||
        f.id === cleanInput
    );
    if (exists) {
      triggerHapticError();
      setSocialMessage("Bu kullanıcı zaten arkadaş listenizde.");
      setTimeout(() => setSocialMessage(null), 3500);
      return;
    }

    // Call onSendFriendRequest if provided
    if (onSendFriendRequest) {
      const res = await onSendFriendRequest(cleanInput);
      setSocialMessage(res.message);
      if (res.success) {
        triggerHapticSuccess();
        setFriendInput("");
      } else {
        triggerHapticError();
      }
      setTimeout(() => setSocialMessage(null), 3500);
      return;
    }

    // Try finding real user profile from server
    try {
      const resp = await fetch(`${getApiBaseUrl()}/api/friends/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUsername: cleanInput,
          fromPlayerId: playerId,
          fromPlayerName: playerName,
          profile: {
            username: playerName,
            avatar: progress.selectedAvatar,
            avatarPhoto: progress.avatarPhoto,
            selectedTitle: progress.selectedTitle,
            level: Math.floor((progress.xp ?? 0) / 200) + 1,
            tier: getLeagueTier(progress).tier,
            lp: progress.lp || 0,
            xp: progress.xp || 0,
          },
        }),
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        triggerHapticSuccess();
        setSocialMessage(data.message || "Arkadaşlık isteği gönderildi!");
        setFriendInput("");
        setTimeout(() => setSocialMessage(null), 3500);
        return;
      } else if (data.error) {
        triggerHapticError();
        setSocialMessage(data.error);
        setTimeout(() => setSocialMessage(null), 3500);
        return;
      }
    } catch {
      // offline fallback
    }

    const res = socialManager.addFriend(cleanInput);
    setSocialMessage(res.message);
    if (res.success) {
      triggerHapticSuccess();
      const updated = [...socialManager.getFriends()];
      setFriendsList(updated);
      onUpdateFriends?.(updated);
      setFriendInput("");
    } else {
      triggerHapticError();
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
    4:  { label: "4×4", desc: "Hızlı · 55 sn", color: "#3EE8B5" },
    6:  { label: "6×6", desc: "Orta · 75 sn",  color: "#E8C36A" },
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
          <Pressable onPress={onBack} style={styles.back} hitSlop={8}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View style={{ flex: 1, marginRight: 6 }}>
            <Text style={styles.overline}>SEZON 01 · LİG &amp; REKABET</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={styles.title}>
              LİG &amp; SEZON MERKEZİ
            </Text>
          </View>
          <View style={styles.timerPill}>
            <Text style={styles.timerIcon}>⏳</Text>
            <View>
              <Text style={styles.timerLabel}>SIFIRLANMA</Text>
              <Text style={styles.timerValue}>{remaining.formatted}</Text>
            </View>
          </View>
        </View>

        {/* 3-Segmented Tab Controller */}
        <View style={styles.segmentedTabContainer}>
          <Pressable
            onPress={() => { triggerHapticSelection(); setActiveTab("leagues"); }}
            style={[styles.segmentedTabBtn, activeTab === "leagues" && styles.segmentedTabBtnActive]}
          >
            <Text style={styles.segmentedTabIcon}>👑</Text>
            <Text numberOfLines={1} style={[styles.segmentedTabText, activeTab === "leagues" && styles.segmentedTabTextActive]}>
              KADEMELER
            </Text>
          </Pressable>

          <Pressable
            onPress={() => { triggerHapticSelection(); setActiveTab("leaderboard"); }}
            style={[styles.segmentedTabBtn, activeTab === "leaderboard" && styles.segmentedTabBtnActive]}
          >
            <Text style={styles.segmentedTabIcon}>🏆</Text>
            <Text numberOfLines={1} style={[styles.segmentedTabText, activeTab === "leaderboard" && styles.segmentedTabTextActive]}>
              LİDERLİK
            </Text>
          </Pressable>

          <Pressable
            onPress={() => { triggerHapticSelection(); setActiveTab("friends"); }}
            style={[styles.segmentedTabBtn, activeTab === "friends" && styles.segmentedTabBtnActive]}
          >
            <Text style={styles.segmentedTabIcon}>👥</Text>
            <Text numberOfLines={1} style={[styles.segmentedTabText, activeTab === "friends" && styles.segmentedTabTextActive]}>
              ARKADAŞLAR ({friendsList.length})
            </Text>
            {onlineFriendsCount > 0 && (
              <View style={styles.onlineBadgeDot} />
            )}
          </Pressable>
        </View>

        {/* TAB 1: Leagues & Tiers */}
        {activeTab === "leagues" && (
          <LeagueHub
            playerId={playerId}
            progress={progress}
            leaderboard={leaderboard}
            onPlayRanked={onPlayRanked}
            embedded={true}
          />
        )}

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

            {/* Sub Filters Toolbar: Metric (LP / Level) & Scope (Global / Friends) */}
            <View style={styles.filterToolbarRow}>
              {/* Metric Pill Toggle */}
              <View style={styles.toolbarSegment}>
                <Pressable
                  onPress={() => { triggerHapticSelection(); setRankingType("lp"); }}
                  style={[styles.toolbarPill, rankingType === "lp" && styles.toolbarPillActiveLp]}
                >
                  <Text style={[styles.toolbarPillText, rankingType === "lp" && styles.toolbarPillTextActive]}>
                    🛡️ LP
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => { triggerHapticSelection(); setRankingType("level"); }}
                  style={[styles.toolbarPill, rankingType === "level" && styles.toolbarPillActiveLevel]}
                >
                  <Text style={[styles.toolbarPillText, rankingType === "level" && styles.toolbarPillTextActive]}>
                    ⚡ SEVİYE
                  </Text>
                </Pressable>
              </View>

              {/* Scope Chip Toggle */}
              <View style={styles.toolbarSegment}>
                <Pressable
                  onPress={() => { triggerHapticSelection(); setLeaderboardFilter("global"); }}
                  style={[styles.toolbarPill, leaderboardFilter === "global" && styles.toolbarPillActiveScope]}
                >
                  <Text style={[styles.toolbarPillText, leaderboardFilter === "global" && styles.toolbarPillTextActive]}>
                    🌐 GENEL
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => { triggerHapticSelection(); setLeaderboardFilter("friends"); }}
                  style={[styles.toolbarPill, leaderboardFilter === "friends" && styles.toolbarPillActiveScope]}
                >
                  <Text style={[styles.toolbarPillText, leaderboardFilter === "friends" && styles.toolbarPillTextActive]}>
                    👥 ARKADAŞLAR
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
                      {top2.avatarPhoto ? (
                        <Image source={{ uri: top2.avatarPhoto }} style={{ width: "100%", height: "100%", borderRadius: 24 }} resizeMode="cover" />
                      ) : (
                        <Text style={styles.podiumAvatarText}>{top2.name.slice(0, 1).toLocaleUpperCase("tr-TR")}</Text>
                      )}
                      <View style={[styles.podiumRankBadge, styles.podiumRankBadge2]}>
                        <Text style={styles.podiumRankNum}>2</Text>
                      </View>
                    </View>
                    <Text numberOfLines={1} style={styles.podiumName}>{top2.name}</Text>
                    {top2.tier ? (
                      <View style={[styles.tierBadge, { borderColor: getTierColor(top2.tier) }]}>
                        <Text style={[styles.tierBadgeText, { color: getTierColor(top2.tier) }]}>{top2.tier}</Text>
                      </View>
                    ) : null}
                    <Text style={styles.podiumScore}>
                      {rankingType === "level"
                        ? `Lv.${top2.level ?? Math.floor(top2.score / 200) + 1} (${top2.score} XP)`
                        : `${top2.lp ?? (top2.tier ? getMinLpForTier(top2.tier) : 0)} LP`}
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
                      {top1.avatarPhoto ? (
                        <Image source={{ uri: top1.avatarPhoto }} style={{ width: "100%", height: "100%", borderRadius: 28 }} resizeMode="cover" />
                      ) : (
                        <Text style={styles.podiumAvatarText}>{top1.name.slice(0, 1).toLocaleUpperCase("tr-TR")}</Text>
                      )}
                      <View style={[styles.podiumRankBadge, styles.podiumRankBadge1]}>
                        <Text style={styles.podiumRankNum}>1</Text>
                      </View>
                    </View>
                    <Text numberOfLines={1} style={styles.podiumName}>{top1.name}</Text>
                    {top1.tier ? (
                      <View style={[styles.tierBadge, { borderColor: getTierColor(top1.tier) }]}>
                        <Text style={[styles.tierBadgeText, { color: getTierColor(top1.tier) }]}>{top1.tier}</Text>
                      </View>
                    ) : null}
                    <Text style={[styles.podiumScore, { color: "#FFD000" }]}>
                      {rankingType === "level"
                        ? `Lv.${top1.level ?? Math.floor(top1.score / 200) + 1} (${top1.score} XP)`
                        : `${top1.lp ?? (top1.tier ? getMinLpForTier(top1.tier) : 0)} LP`}
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
                      {top3.avatarPhoto ? (
                        <Image source={{ uri: top3.avatarPhoto }} style={{ width: "100%", height: "100%", borderRadius: 24 }} resizeMode="cover" />
                      ) : (
                        <Text style={styles.podiumAvatarText}>{top3.name.slice(0, 1).toLocaleUpperCase("tr-TR")}</Text>
                      )}
                      <View style={[styles.podiumRankBadge, styles.podiumRankBadge3]}>
                        <Text style={styles.podiumRankNum}>3</Text>
                      </View>
                    </View>
                    <Text numberOfLines={1} style={styles.podiumName}>{top3.name}</Text>
                    {top3.tier ? (
                      <View style={[styles.tierBadge, { borderColor: getTierColor(top3.tier) }]}>
                        <Text style={[styles.tierBadgeText, { color: getTierColor(top3.tier) }]}>{top3.tier}</Text>
                      </View>
                    ) : null}
                    <Text style={styles.podiumScore}>
                      {rankingType === "level"
                        ? `Lv.${top3.level ?? Math.floor(top3.score / 200) + 1} (${top3.score} XP)`
                        : `${top3.lp ?? (top3.tier ? getMinLpForTier(top3.tier) : 0)} LP`}
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
                  const tierColor = getTierColor(entry.tier);
                  const displayLp = entry.lp ?? (entry.tier ? getMinLpForTier(entry.tier) : 0);
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
                        {entry.avatarPhoto ? (
                          <Image source={{ uri: entry.avatarPhoto }} style={{ width: "100%", height: "100%", borderRadius: 10 }} resizeMode="cover" />
                        ) : (
                          <Text style={styles.playerMarkText}>
                            {entry.name.slice(0, 1).toLocaleUpperCase("tr-TR")}
                          </Text>
                        )}
                      </View>
                      <View style={styles.playerCopy}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                          <Text numberOfLines={1} style={[styles.playerName, isUser && { color: "#3EE8B5" }]}>
                            {entry.name}
                          </Text>
                          {isUser && (
                            <View style={styles.userSelfTag}>
                              <Text style={styles.userSelfTagText}>SEN</Text>
                            </View>
                          )}
                          {entry.tier && (
                            <View style={[styles.rowTierBadge, { borderColor: tierColor }]}>
                              <Text style={[styles.rowTierText, { color: tierColor }]}>{entry.tier}</Text>
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
                            <Text style={styles.score}>{displayLp} LP</Text>
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

            {/* Sub-tab switcher: Arkadaşlarım vs Gelen İstekler */}
            <View style={styles.subTabContainer}>
              <Pressable
                onPress={() => { triggerHapticSelection(); setFriendsSubTab("friends"); }}
                style={[styles.subTabBtn, friendsSubTab === "friends" && styles.subTabBtnActive]}
              >
                <Text style={[styles.subTabText, friendsSubTab === "friends" && styles.subTabTextActive]}>
                  ARKADAŞLAR ({friendsList.length})
                </Text>
              </Pressable>
              <Pressable
                onPress={() => { triggerHapticSelection(); setFriendsSubTab("requests"); }}
                style={[styles.subTabBtn, friendsSubTab === "requests" && styles.subTabBtnActive]}
              >
                <Text style={[styles.subTabText, friendsSubTab === "requests" && styles.subTabTextActive]}>
                  GELEN İSTEKLER ({pendingRequestsList.length})
                </Text>
                {pendingRequestsList.length > 0 && (
                  <View style={styles.requestBadgeDot}>
                    <Text style={styles.requestBadgeText}>{pendingRequestsList.length}</Text>
                  </View>
                )}
              </Pressable>
            </View>

            {friendsSubTab === "friends" && (
              <>
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
              </>
            )}

            {friendsSubTab === "requests" && (
              <>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>BEKLEYEN İSTEKLER</Text>
                  <Text style={styles.sectionMeta}>{pendingRequestsList.length} İSTEK</Text>
                </View>

                <View style={styles.friendsBoard}>
                  {pendingRequestsList.length === 0 && (
                    <View style={styles.emptyBoard}>
                      <Text style={styles.emptyTitle}>BEKLEYEN İSTEK YOK</Text>
                      <Text style={styles.emptyCopy}>Şu anda sana gönderilen yeni bir arkadaşlık isteği bulunmuyor.</Text>
                    </View>
                  )}
                  {pendingRequestsList.map((req) => (
                    <View key={req.id} style={styles.requestRow}>
                      <View style={styles.friendRowTop}>
                        <Text style={styles.friendAvatarText}>{req.fromAvatar || "🎮"}</Text>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Text numberOfLines={1} style={styles.friendNameText}>{req.fromName}</Text>
                            <View style={{ backgroundColor: "#38BDF820", borderWidth: 1, borderColor: "#38BDF855", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 }}>
                              <Text style={{ color: "#38BDF8", fontSize: 9, fontWeight: "900" }}>SEVİYE {req.fromLevel ?? 1}</Text>
                            </View>
                          </View>
                          <Text numberOfLines={1} style={styles.friendXpText}>@{req.fromUsername} · {req.fromTier ?? "DEMİR"} ({req.fromLp ?? 0} LP)</Text>
                        </View>
                      </View>
                      <View style={styles.requestActionRow}>
                        <Pressable
                          style={({ pressed }) => [styles.acceptBtn, pressed && { opacity: 0.8 }]}
                          onPress={() => {
                            triggerHapticSuccess();
                            if (onAcceptRequest) {
                              onAcceptRequest(req.id);
                            } else {
                              socialManager.addFriend({
                                id: req.fromUserId,
                                name: req.fromName,
                                username: req.fromUsername,
                                avatar: req.fromAvatar,
                                level: req.fromLevel,
                                tier: req.fromTier,
                                lp: req.fromLp,
                                xp: req.fromXp,
                              });
                              socialManager.removePendingRequest(req.id);
                              setPendingRequestsList([...socialManager.getPendingRequests()]);
                              setFriendsList([...socialManager.getFriends()]);
                            }
                          }}
                        >
                          <Text style={styles.acceptBtnText}>✓ KABUL ET</Text>
                        </Pressable>
                        <Pressable
                          style={({ pressed }) => [styles.rejectBtn, pressed && { opacity: 0.8 }]}
                          onPress={() => {
                            triggerHapticSelection();
                            if (onRejectRequest) {
                              onRejectRequest(req.id);
                            } else {
                              socialManager.removePendingRequest(req.id);
                              setPendingRequestsList([...socialManager.getPendingRequests()]);
                            }
                          }}
                        >
                          <Text style={styles.rejectBtnText}>✕ REDDET</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </>
  );
}


const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 185 },
  header: { flexDirection: "row", alignItems: "center", gap: 11 },
  back: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "#164536",
    borderWidth: 1,
    borderColor: "rgba(212, 180, 90, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { color: "#FFF9FC", fontSize: 30, lineHeight: 30 },
  overline: { color: "#A8C5B5", fontSize: 8, letterSpacing: 0.8, fontWeight: "900" },
  title: { color: "#FFF9FC", fontSize: 16, fontWeight: "900", marginTop: 2, letterSpacing: 0.2 },
  rankOrb: {
    width: 35,
    height: 35,
    borderRadius: 18,
    marginLeft: "auto",
    backgroundColor: "#164536",
    borderWidth: 1,
    borderColor: "#FFC24A",
    alignItems: "center",
    justifyContent: "center",
  },
  rankOrbText: { color: "#FFC24A", fontWeight: "900" },
  timerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#164536",
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.4)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
  },
  timerIcon: { fontSize: 12 },
  timerLabel: { color: "#FBBF24", fontSize: 7.5, fontWeight: "900", letterSpacing: 0.8 },
  timerValue: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" },

  /* Modern Segmented Tab Controller */
  segmentedTabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(8, 28, 22, 0.95)",
    borderRadius: 20,
    padding: 5,
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: "rgba(212, 180, 90, 0.35)",
    gap: 4,
  },
  segmentedTabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 15,
    position: "relative",
  },
  segmentedTabBtnActive: {
    backgroundColor: "rgba(244, 208, 111, 0.18)",
    borderWidth: 1.5,
    borderColor: "#F4D06F",
    shadowColor: "#F4D06F",
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 5,
  },
  segmentedTabIcon: {
    fontSize: 14,
  },
  segmentedTabText: {
    color: "#A8C5B5",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
    flexShrink: 1,
  },
  segmentedTabTextActive: {
    color: "#F4D06F",
  },
  onlineBadgeDot: {
    position: "absolute",
    top: 8,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#22C55E",
    borderWidth: 1.5,
    borderColor: "#06140F",
  },

  /* Compact Filter Toolbar */
  filterToolbarRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
    marginBottom: 16,
  },
  toolbarSegment: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(8, 28, 22, 0.8)",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(212, 180, 90, 0.2)",
    padding: 3,
    gap: 3,
  },
  toolbarPill: {
    flex: 1,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  toolbarPillText: {
    color: "#A8C5B5",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.4,
    textAlign: "center",
  },
  toolbarPillTextActive: {
    color: "#FFFFFF",
  },
  toolbarPillActiveLp: {
    backgroundColor: "#C9A227",
    shadowColor: "#C9A227",
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 3,
  },
  toolbarPillActiveLevel: {
    backgroundColor: "#0E7490",
    shadowColor: "#38BDF8",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  toolbarPillActiveScope: {
    backgroundColor: "#164536",
    shadowColor: "#3EE8B5",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },

  /* Hero Cards */
  hero: {
    marginTop: 14,
    padding: 18,
    borderRadius: 24,
    backgroundColor: "rgba(22, 28, 14, 0.95)",
    borderWidth: 1.5,
    borderColor: "#F4D06F",
    shadowColor: "#F4D06F",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  heroKicker: { color: "#FFD37F", fontSize: 8, letterSpacing: 1, fontWeight: "900" },
  heroTitle: { color: "#FFF9FC", fontSize: 25, fontWeight: "900", marginTop: 6, textShadowColor: "#000", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 3 },
  heroBody: { color: "#A8C5B5", fontSize: 11, marginTop: 4 },
  heroStats: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(212, 180, 90, 0.2)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statLabel: { color: "#A8C5B5", fontSize: 7, fontWeight: "900", letterSpacing: 0.7 },
  statValue: { color: "#FFF9FC", fontSize: 14, fontWeight: "900", marginTop: 3, textShadowColor: "#000", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 2 },
  statRule: { width: 1, height: 27, backgroundColor: "rgba(212, 180, 90, 0.2)" },

  /* Social Hero */
  socialHero: {
    marginTop: 14,
    padding: 18,
    borderRadius: 24,
    backgroundColor: "rgba(10, 32, 42, 0.95)",
    borderWidth: 1.5,
    borderColor: "#38BDF8",
    shadowColor: "#38BDF8",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  socialHeroKicker: { color: "#38BDF8", fontSize: 8, letterSpacing: 1, fontWeight: "900" },
  socialHeroTitle: { color: "#FFF9FC", fontSize: 23, fontWeight: "900", marginTop: 6, textShadowColor: "#000", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 3 },
  socialHeroBody: { color: "#A8C5B5", fontSize: 11, marginTop: 4 },

  /* Mystery Card */
  mysteryCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: "rgba(36, 26, 8, 0.95)",
    borderWidth: 1.5,
    borderColor: "#FFC24A",
  },
  mysteryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  mysteryKicker: { color: "#C5D9C8", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  mysteryReward: { color: "#3EE8B5", fontSize: 9, fontWeight: "900" },
  mysteryDef: {
    color: "#FFF9FC",
    fontSize: 12,
    fontWeight: "700",
    fontStyle: "italic",
    lineHeight: 17,
  },
  mysteryHint: { color: "#E8C36A", fontSize: 8, fontWeight: "800", marginTop: 6 },

  /* User Status Banner */
  userStatusCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 20,
    backgroundColor: "rgba(14, 44, 34, 0.95)",
    borderWidth: 1.5,
    borderColor: "rgba(244, 208, 111, 0.4)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#F4D06F",
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
    backgroundColor: "#C9A227",
    borderWidth: 2,
    borderColor: "#3EE8B5",
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
    textShadowColor: "#000",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  userRankBadge: {
    backgroundColor: "rgba(62, 232, 181, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#3EE8B5",
  },
  userRankBadgeText: {
    color: "#3EE8B5",
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
    backgroundColor: "rgba(12, 42, 34, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(212, 180, 90, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipActive: {
    backgroundColor: "rgba(201, 162, 39, 0.35)",
    borderColor: "#C9A227",
  },
  filterChipText: {
    color: "#8FBAAB",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  filterChipTextActive: {
    color: "#3EE8B5",
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
    textShadowColor: "#000",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
    textShadowColor: "#000",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
    backgroundColor: "#0E2C22",
    borderWidth: 1,
    borderColor: "rgba(212, 180, 90, 0.25)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  row: {
    minHeight: 54,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212, 180, 90, 0.15)",
  },
  rowUser: {
    backgroundColor: "rgba(62, 232, 181, 0.08)",
    borderLeftWidth: 4,
    borderLeftColor: "#3EE8B5",
  },
  userSelfTag: {
    backgroundColor: "#3EE8B5",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  userSelfTagText: {
    color: "#04110C",
    fontSize: 7.5,
    fontWeight: "900",
  },
  winRateBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  winRateHigh: {
    backgroundColor: "rgba(62, 232, 181, 0.15)",
  },
  winRateNormal: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  winRateText: {
    color: "#3EE8B5",
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
    backgroundColor: "#164536",
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
  playerName: { color: "#F9F5FF", fontSize: 11, fontWeight: "900", textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  playerMeta: { color: "#9F93B6", fontSize: 7, marginTop: 3, fontWeight: "800" },
  score: { color: "#55E6B2", fontSize: 13, fontWeight: "900", textShadowColor: "#000", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 2 },
  emptyBoard: { padding: 22, alignItems: "center" },
  emptyTitle: { color: "#FFF9FC", fontSize: 12, fontWeight: "900" },
  emptyCopy: { color: "#B8ADCD", fontSize: 10, textAlign: "center", marginTop: 5 },

  /* Add Friend Card */
  addCard: {
    marginTop: 12,
    backgroundColor: "rgba(14, 44, 34, 0.95)",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(212, 180, 90, 0.25)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  addCardLabel: {
    color: "#8FBAAB",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  addFriendRow: { flexDirection: "row", gap: 8 },
  addFriendInput: {
    flex: 1,
    backgroundColor: "#0A241C",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#FFF",
    fontSize: 12,
    borderWidth: 1,
    borderColor: "rgba(212, 180, 90, 0.25)",
  },
  addFriendBtn: {
    backgroundColor: "#C9A227",
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
    color: "#3EE8B5",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 6,
  },

  /* Friends Board */
  friendsBoard: {
    gap: 10,
  },
  friendRow: {
    backgroundColor: "rgba(14, 44, 34, 0.95)",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(212, 180, 90, 0.25)",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  friendRowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  friendAvatarText: { fontSize: 24 },
  friendNameText: { color: "#FFF", fontSize: 13, fontWeight: "900", textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  friendXpText: { color: "#8FBAAB", fontSize: 9.5, marginTop: 2 },
  statusWrap: { alignItems: "flex-end", gap: 3 },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  onlineDotActive: {
    backgroundColor: "#3EE8B5",
    shadowColor: "#3EE8B5",
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  onlineDotOffline: { backgroundColor: "#4C3F68" },
  onlineStatusText: {
    color: "#8FBAAB",
    fontSize: 7.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  challengeBtn: {
    backgroundColor: "rgba(62, 232, 181, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(62, 232, 181, 0.5)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  challengeBtnText: {
    color: "#3EE8B5",
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
    color: "#8FBAAB",
    fontSize: 12,
    fontWeight: "900",
  },

  /* Sub Tab Container */
  subTabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(10, 32, 24, 0.9)",
    borderRadius: 14,
    padding: 3,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(212, 180, 90, 0.2)",
    gap: 4,
  },
  subTabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 11,
    position: "relative",
    gap: 6,
  },
  subTabBtnActive: {
    backgroundColor: "rgba(244, 208, 111, 0.18)",
    borderWidth: 1,
    borderColor: "#F4D06F",
  },
  subTabText: {
    color: "#8FBAAB",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  subTabTextActive: {
    color: "#F4D06F",
    fontWeight: "900",
  },
  requestBadgeDot: {
    backgroundColor: "#FF647C",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  requestBadgeText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "900",
  },

  /* Request Row */
  requestRow: {
    backgroundColor: "rgba(14, 44, 34, 0.95)",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(212, 180, 90, 0.25)",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  requestActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: "rgba(62, 232, 181, 0.18)",
    borderWidth: 1.5,
    borderColor: "#3EE8B5",
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptBtnText: {
    color: "#3EE8B5",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: "rgba(255, 100, 124, 0.15)",
    borderWidth: 1.5,
    borderColor: "#FF647C",
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectBtnText: {
    color: "#FF647C",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.4,
  },

  /* Board Size Picker Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(4, 17, 12, 0.82)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#0E2C22",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "#D4B45A",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  modalKicker: {
    color: "#3EE8B5",
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
    backgroundColor: "#0E2C22",
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
