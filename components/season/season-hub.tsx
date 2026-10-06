import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import {
  getRank,
  getLeagueTier,
  getSeasonRemainingTime,
  type PlayerProgress,
} from "@/shared/progression";
import { type LeaderboardEntry, type BoardSize } from "@/shared/game";
import { socialManager, type FriendUser, type FriendRequest } from "@/shared/social";
import { triggerHapticError, triggerHapticSelection, triggerHapticSuccess } from "@/shared/audio-haptics";
import { isEqualTr } from "@/shared/tr-utils";
import { LeagueHub } from "./league-hub";
import { styles } from "./season-hub.styles";
import {
  type RankingType,
  MOCK_LP_LEADERBOARD,
  MOCK_LEVEL_LEADERBOARD,
} from "./season-mock-data";
import { BoardSizePickerModal } from "./board-size-picker-modal";
import { SeasonLeaderboardTab } from "./season-leaderboard-tab";
import { SeasonFriendsTab } from "./season-friends-tab";

export type SeasonTab = "leagues" | "leaderboard" | "friends";

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
  const [showAllLeaderboard, setShowAllLeaderboard] = useState(false);
  const [friendInput, setFriendInput] = useState("");
  const [friendsList, setFriendsList] = useState<FriendUser[]>(() => socialManager.getFriends());
  const [pendingRequestsList, setPendingRequestsList] = useState<FriendRequest[]>(() => pendingRequests || socialManager.getPendingRequests());
  const [socialMessage, setSocialMessage] = useState<string | null>(null);
  const socialMessageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSocialMessage = (msg: string) => {
    setSocialMessage(msg);
    if (socialMessageTimeoutRef.current) clearTimeout(socialMessageTimeoutRef.current);
    socialMessageTimeoutRef.current = setTimeout(() => setSocialMessage(null), 3500);
  };

  useEffect(() => {
    return () => {
      if (socialMessageTimeoutRef.current) clearTimeout(socialMessageTimeoutRef.current);
    };
  }, []);

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
    let rawList = leaderboard.length > 0 ? [...leaderboard] : [...defaultMock];
    if (rawList.length < 3) {
      const existingIds = new Set(rawList.map((e) => e.id));
      const extras = defaultMock.filter((m) => !existingIds.has(m.id));
      rawList = [...rawList, ...extras];
    }
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

  const displayedLeaderboard = useMemo(() => {
    let list = [...basePool];
    if (leaderboardFilter === "friends") {
      const friendIds = new Set(friendsList.map((f) => f.id));
      const friendUsernames = new Set(friendsList.map((f) => f.username));
      list = list.filter(
        (entry) =>
          entry.id === playerId ||
          friendIds.has(entry.id) ||
          friendUsernames.has(entry.name)
      );
    }

    if (rankingType === "level") {
      return list.sort((a, b) => {
        const lvlA = a.level ?? Math.floor(a.score / 200) + 1;
        const lvlB = b.level ?? Math.floor(b.score / 200) + 1;
        if (lvlB !== lvlA) return lvlB - lvlA;
        return b.score - a.score;
      });
    }

    // Default: Sort by LP, fallback to score/wins
    return list.sort((a, b) => {
      const lpA = a.lp ?? 0;
      const lpB = b.lp ?? 0;
      if (lpB !== lpA) return lpB - lpA;
      return b.score - a.score || b.wins - a.wins;
    });
  }, [basePool, leaderboardFilter, friendsList, playerId, rankingType]);

  const userRankPosition = useMemo(() => {
    const idx = displayedLeaderboard.findIndex((e) => e.id === playerId);
    return idx >= 0 ? idx + 1 : 0;
  }, [displayedLeaderboard, playerId]);

  const userScore = useMemo(() => {
    const entry = displayedLeaderboard.find((e) => e.id === playerId);
    if (!entry) return 0;
    return rankingType === "level" ? entry.score : entry.lp ?? 0;
  }, [displayedLeaderboard, playerId, rankingType]);

  const scoreDiffToLeader = useMemo(() => {
    if (!displayedLeaderboard.length) return 0;
    const topScore =
      rankingType === "level"
        ? displayedLeaderboard[0]!.score
        : displayedLeaderboard[0]!.lp ?? 0;
    return Math.max(0, topScore - userScore);
  }, [displayedLeaderboard, userScore, rankingType]);

  const top1 = displayedLeaderboard[0];
  const top2 = displayedLeaderboard[1];
  const top3 = displayedLeaderboard[2];
  const restOfLeaderboard = displayedLeaderboard.slice(3);

  const handleAddFriend = async () => {
    const trimmed = friendInput.trim();
    if (!trimmed) {
      triggerHapticError();
      showSocialMessage("Lütfen geçerli bir kullanıcı adı girin.");
      return;
    }
    if (isEqualTr(trimmed, playerName)) {
      triggerHapticError();
      showSocialMessage("Kendinizi arkadaş olarak ekleyemezsiniz.");
      return;
    }

    if (onSendFriendRequest) {
      try {
        const res = await onSendFriendRequest(trimmed);
        if (res.success) {
          triggerHapticSuccess();
          showSocialMessage(res.message);
          setFriendInput("");
        } else {
          triggerHapticError();
          showSocialMessage(res.message || "İstek gönderilemedi.");
        }
      } catch {
        triggerHapticError();
        showSocialMessage("Sunucuyla iletişim kurulamadı.");
      }
      return;
    }

    const res = socialManager.addFriend(trimmed);
    if (res.success) {
      if (res.friend) {
        const next = [...friendsList, res.friend];
        setFriendsList(next);
        onUpdateFriends?.(next);
      }
      triggerHapticSuccess();
      showSocialMessage(res.message);
      setFriendInput("");
    } else {
      triggerHapticError();
      showSocialMessage(res.message);
    }
  };

  const handleRemoveFriend = (friend: FriendUser) => {
    triggerHapticSelection();
    Alert.alert(
      "Arkadaşı Çıkar",
      `"${friend.name}" adlı kullanıcıyı arkadaş listenden çıkarmak istediğine emin misin?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Çıkar",
          style: "destructive",
          onPress: () => {
            const next = friendsList.filter((f) => f.id !== friend.id);
            socialManager.removeFriend(friend.id);
            setFriendsList(next);
            onUpdateFriends?.(next);
            triggerHapticSuccess();
            showSocialMessage(`${friend.name} arkadaş listenden çıkarıldı.`);
          },
        },
      ]
    );
  };

  const handleDuelPress = (friend: FriendUser) => {
    triggerHapticSelection();
    setChallengeTarget(friend);
  };

  const handleConfirmChallenge = (size: BoardSize) => {
    if (!challengeTarget) return;
    triggerHapticSuccess();
    const targetName = challengeTarget.name;
    setChallengeTarget(null);
    onChallengeFriend?.(targetName, size);
  };

  return (
    <>
      {challengeTarget && (
        <BoardSizePickerModal
          target={challengeTarget}
          onSelectSize={handleConfirmChallenge}
          onClose={() => setChallengeTarget(null)}
        />
      )}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.back} hitSlop={8}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.overline}>SEZON ŞAMPİYONASI</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={styles.title}>
              LİG & TOPLULUK MERKEZİ
            </Text>
          </View>
          <View style={styles.timerPill}>
            <Text style={styles.timerIcon}>⏳</Text>
            <View>
              <Text style={styles.timerLabel}>KALAN SÜRE</Text>
              <Text style={styles.timerValue}>
                {remaining.days}G {remaining.hours}S {remaining.minutes}D
              </Text>
            </View>
          </View>
        </View>

        {/* 3-Segmented Tab Controller */}
        <View style={styles.segmentedTabContainer}>
          <Pressable
            onPress={() => {
              triggerHapticSelection();
              setActiveTab("leagues");
            }}
            style={[styles.segmentedTabBtn, activeTab === "leagues" && styles.segmentedTabBtnActive]}
          >
            <Text style={styles.segmentedTabIcon}>👑</Text>
            <Text
              numberOfLines={1}
              style={[styles.segmentedTabText, activeTab === "leagues" && styles.segmentedTabTextActive]}
            >
              Ligler
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              triggerHapticSelection();
              setActiveTab("leaderboard");
            }}
            style={[styles.segmentedTabBtn, activeTab === "leaderboard" && styles.segmentedTabBtnActive]}
          >
            <Text style={styles.segmentedTabIcon}>🏆</Text>
            <Text
              numberOfLines={1}
              style={[styles.segmentedTabText, activeTab === "leaderboard" && styles.segmentedTabTextActive]}
            >
              Sıralama
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              triggerHapticSelection();
              setActiveTab("friends");
            }}
            style={[styles.segmentedTabBtn, activeTab === "friends" && styles.segmentedTabBtnActive]}
          >
            <Text style={styles.segmentedTabIcon}>👥</Text>
            <Text
              numberOfLines={1}
              style={[styles.segmentedTabText, activeTab === "friends" && styles.segmentedTabTextActive]}
            >
              Arkadaşlar
            </Text>
            {onlineFriendsCount > 0 && <View style={styles.onlineBadgeDot} />}
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

        {/* TAB 2: Leaderboard */}
        {activeTab === "leaderboard" && (
          <SeasonLeaderboardTab
            playerName={playerName}
            rank={rank}
            userRankPosition={userRankPosition}
            userScore={userScore}
            scoreDiffToLeader={scoreDiffToLeader}
            rankingType={rankingType}
            setRankingType={setRankingType}
            leaderboardFilter={leaderboardFilter}
            setLeaderboardFilter={setLeaderboardFilter}
            displayedLeaderboard={displayedLeaderboard}
            top1={top1}
            top2={top2}
            top3={top3}
            restOfLeaderboard={restOfLeaderboard}
            showAllLeaderboard={showAllLeaderboard}
            setShowAllLeaderboard={setShowAllLeaderboard}
            playerId={playerId}
            avatarPhoto={progress.avatarPhoto}
            userAvatarId={progress.selectedAvatar}
            onInspectUser={onInspectUser}
          />
        )}

        {/* TAB 3: Friends */}
        {activeTab === "friends" && (
          <SeasonFriendsTab
            friendsList={friendsList}
            onlineFriendsCount={onlineFriendsCount}
            friendInput={friendInput}
            setFriendInput={setFriendInput}
            handleAddFriend={handleAddFriend}
            socialMessage={socialMessage}
            friendsSubTab={friendsSubTab}
            setFriendsSubTab={setFriendsSubTab}
            pendingRequestsList={pendingRequestsList}
            setPendingRequestsList={setPendingRequestsList}
            setFriendsList={setFriendsList}
            handleRemoveFriend={handleRemoveFriend}
            handleDuelPress={handleDuelPress}
            onInspectUser={onInspectUser}
            onChallengeFriend={onChallengeFriend}
            onAcceptRequest={onAcceptRequest}
            onRejectRequest={onRejectRequest}
          />
        )}
      </ScrollView>
    </>
  );
}
