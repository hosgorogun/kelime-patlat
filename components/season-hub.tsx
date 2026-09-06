import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { getRank, getDailyMysteryWord, type PlayerProgress } from "@/shared/progression";
import { type LeaderboardEntry } from "@/shared/game";
import { socialManager, type FriendUser } from "@/shared/social";
import { triggerHapticSelection, triggerHapticSuccess } from "@/shared/audio-haptics";

type SeasonTab = "leaderboard" | "friends";

export function SeasonHub({
  playerId,
  progress,
  leaderboard,
  onBack,
}: {
  playerId: string;
  progress: PlayerProgress;
  leaderboard: LeaderboardEntry[];
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<SeasonTab>("leaderboard");
  const [friendInput, setFriendInput] = useState("");
  const [friendsList, setFriendsList] = useState<FriendUser[]>(() => socialManager.getFriends());
  const [socialMessage, setSocialMessage] = useState<string | null>(null);

  const rank = getRank(progress);
  const playerRank = leaderboard.findIndex((entry) => entry.id === playerId) + 1;
  const mystery = getDailyMysteryWord();
  const onlineFriendsCount = friendsList.filter((f) => f.isOnline).length;

  const handleAddFriend = () => {
    if (!friendInput.trim()) return;
    triggerHapticSelection();
    const res = socialManager.addFriend(friendInput);
    setSocialMessage(res.message);
    if (res.success) {
      triggerHapticSuccess();
      setFriendsList([...socialManager.getFriends()]);
      setFriendInput("");
    }
    setTimeout(() => setSocialMessage(null), 3500);
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={{ flex: 1, marginRight: 6 }}>
          <Text style={styles.overline}>SEZON 01 · TOPLULUK & REKABET</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={styles.title}>
            LİDERLİK VE ARKADAŞLIK
          </Text>
        </View>
        <View style={styles.rankOrb}>
          <Text style={styles.rankOrbText}>{rank.slice(0, 1)}</Text>
        </View>
      </View>

      {/* Sub-tabs: Sıralama vs Arkadaşlar */}
      <View style={styles.tabSwitcher}>
        <Pressable
          onPress={() => {
            triggerHapticSelection();
            setActiveTab("leaderboard");
          }}
          style={[styles.tabBtn, activeTab === "leaderboard" && styles.tabBtnActive]}
        >
          <Text
            numberOfLines={1}
            style={[styles.tabBtnText, activeTab === "leaderboard" && styles.tabBtnTextActive]}
          >
            🏆 LİDERLİK TABLOSU
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            triggerHapticSelection();
            setActiveTab("friends");
          }}
          style={[styles.tabBtn, activeTab === "friends" && styles.tabBtnActive]}
        >
          <Text
            numberOfLines={1}
            style={[styles.tabBtnText, activeTab === "friends" && styles.tabBtnTextActive]}
          >
            👥 ARKADAŞLAR ({friendsList.length})
          </Text>
        </Pressable>
      </View>

      {/* TAB 1: 🏆 LİDERLİK TABLOSU */}
      {activeTab === "leaderboard" && (
        <View>
          {/* Sezon Konumu */}
          <View style={styles.hero}>
            <Text style={styles.heroKicker}>SEZON KONUMUN</Text>
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
                <Text style={styles.statValue}>
                  {progress.streak} GÜN 🛡️{progress.streakShields ?? 1}
                </Text>
              </View>
              <View style={styles.statRule} />
              <View>
                <Text style={styles.statLabel}>TEMPO</Text>
                <Text style={styles.statValue}>{progress.bestTempo || "—"}</Text>
              </View>
            </View>
          </View>

          {/* Daily Mystery Word Card */}
          <View style={styles.mysteryCard}>
            <View style={styles.mysteryHeader}>
              <Text style={styles.mysteryKicker}>🔍 GÜNÜN GİZEMLİ KELİMESİ</Text>
              <Text style={styles.mysteryReward}>+{mystery.rewardXp} XP BONUSU</Text>
            </View>
            <Text style={styles.mysteryDef}>"{mystery.definition}"</Text>
            <Text style={styles.mysteryHint}>
              💡 İpucu: Bu tanıma uyan kelimeyi tahtada bul ve ekstra XP kazan!
            </Text>
          </View>

          {/* Canlı Sıralama */}
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>CANLI SIRALAMA</Text>
            <Text style={styles.sectionMeta}>{leaderboard.length} AVCI</Text>
          </View>

          <View style={styles.board}>
            {leaderboard.length ? (
              leaderboard.map((entry, index) => {
                const winRate =
                  entry.matches > 0 ? Math.round((entry.wins / entry.matches) * 100) : 0;
                const isTop1 = index === 0;
                const isTop2 = index === 1;
                const isTop3 = index === 2;
                return (
                  <View
                    key={entry.id}
                    style={[
                      styles.row,
                      isTop1 && styles.rowTop1,
                      isTop2 && styles.rowTop2,
                      isTop3 && styles.rowTop3,
                    ]}
                  >
                    <View
                      style={[
                        styles.position,
                        isTop1 && styles.positionFirst,
                        isTop2 && styles.positionSecond,
                        isTop3 && styles.positionThird,
                      ]}
                    >
                      <Text
                        style={[
                          styles.positionText,
                          (isTop1 || isTop2 || isTop3) && { color: "#000000" },
                        ]}
                      >
                        {index + 1}
                      </Text>
                    </View>
                    <View style={styles.playerMark}>
                      <Text style={[styles.playerMarkText, isTop1 && { color: "#FFD000" }]}>
                        {entry.name.slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.playerCopy}>
                      <Text numberOfLines={1} style={styles.playerName}>
                        {entry.name} {isTop1 ? "👑" : isTop2 ? "🥈" : isTop3 ? "🥉" : ""}
                      </Text>
                      <Text style={styles.playerMeta}>
                        {entry.wins}/{entry.matches} Galibiyet (%{winRate}) · En İyi: {entry.bestRound} Puan
                      </Text>
                    </View>
                    <Text style={[styles.score, isTop1 && { color: "#FFD000" }]}>
                      {entry.score}
                    </Text>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyBoard}>
                <Text style={styles.emptyTitle}>SIRALAMA AÇIK</Text>
                <Text style={styles.emptyCopy}>
                  İlk tamamlanan canlı düello burada sezona yazılır.
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* TAB 2: 👥 ARKADAŞLAR */}
      {activeTab === "friends" && (
        <View>
          {/* Social Hero Banner */}
          <View style={styles.socialHero}>
            <Text style={styles.socialHeroKicker}>TOPLULUK AĞI</Text>
            <Text style={styles.socialHeroTitle}>ARKADAŞLARINLA YARIŞ</Text>
            <Text style={styles.socialHeroBody}>
              {friendsList.length} arkadaş listende · {onlineFriendsCount} şu an çevrim içi
            </Text>
          </View>

          {/* Add Friend Card */}
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

          {/* Friends List */}
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>ARKADAŞ LİSTESİ</Text>
            <Text style={styles.sectionMeta}>{onlineFriendsCount} ÇEVRİM İÇİ</Text>
          </View>

          <View style={styles.friendsBoard}>
            {friendsList.map((f) => (
              <View key={f.id} style={styles.friendRow}>
                <Text style={styles.friendAvatarText}>{f.avatar}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.friendNameText}>{f.name}</Text>
                  <Text style={styles.friendXpText}>
                    @{f.username} · {f.xp} XP
                  </Text>
                </View>
                <View style={styles.statusWrap}>
                  <View
                    style={[
                      styles.onlineDot,
                      f.isOnline ? styles.onlineDotActive : styles.onlineDotOffline,
                    ]}
                  />
                  <Text style={styles.onlineStatusText}>
                    {f.isOnline ? "ÇEVRİM İÇİ" : "ÇEVRİM DIŞI"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
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
    gap: 8,
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(22, 16, 42, 0.85)",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2A204C",
    gap: 10,
  },
  friendAvatarText: { fontSize: 22 },
  friendNameText: { color: "#FFF", fontSize: 12, fontWeight: "900" },
  friendXpText: { color: "#7E7299", fontSize: 9, marginTop: 2 },
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
});
