import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import type { LeaderboardEntry } from "@/shared/game";
import { triggerHapticSelection } from "@/shared/audio-haptics";
import { getTierColor, getMinLpForTier, getPlayerLevel, AVATARS, type AvatarId } from "@/shared/progression";
import { styles } from "./season-hub.styles";
import type { RankingType } from "./season-mock-data";

export type SeasonLeaderboardTabProps = {
  playerName: string;
  rank: string;
  userRankPosition: number;
  userScore: number;
  scoreDiffToLeader: number;
  rankingType: RankingType;
  setRankingType: (type: RankingType) => void;
  leaderboardFilter: "global" | "friends";
  setLeaderboardFilter: (filter: "global" | "friends") => void;
  displayedLeaderboard: LeaderboardEntry[];
  top1?: LeaderboardEntry;
  top2?: LeaderboardEntry;
  top3?: LeaderboardEntry;
  restOfLeaderboard: LeaderboardEntry[];
  showAllLeaderboard: boolean;
  setShowAllLeaderboard: (show: boolean) => void;
  playerId: string;
  avatarPhoto?: string;
  userAvatarId?: AvatarId;
  onInspectUser?: (user: Partial<LeaderboardEntry> & { id: string; name: string }) => void;
};

export const SeasonLeaderboardTab = React.memo(({
  playerName,
  rank,
  userRankPosition,
  userScore,
  scoreDiffToLeader,
  rankingType,
  setRankingType,
  leaderboardFilter,
  setLeaderboardFilter,
  displayedLeaderboard,
  top1,
  top2,
  top3,
  restOfLeaderboard,
  showAllLeaderboard,
  setShowAllLeaderboard,
  playerId,
  avatarPhoto,
  userAvatarId,
  onInspectUser,
}: SeasonLeaderboardTabProps) => {
  const avatarIcon = AVATARS.find((a) => a.id === userAvatarId)?.icon || "👤";

  return (
    <View>
      {/* User Standing Highlight Card */}
      <View style={styles.userStatusCard}>
        <View style={styles.userStatusLeft}>
          <View style={styles.userStatusAvatarOrb}>
            {avatarPhoto ? (
              <Image source={{ uri: avatarPhoto }} style={{ width: "100%", height: "100%", borderRadius: 22 }} resizeMode="cover" />
            ) : (
              <Text style={styles.userStatusAvatarText}>{avatarIcon}</Text>
            )}
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

      {/* Vitrin Podium Showcase (Top 3) */}
      {displayedLeaderboard.length >= 2 && (
        <View style={styles.podiumContainer}>
          <View style={styles.podiumVitrinHeader}>
            <View style={styles.podiumVitrinTag}>
              <Text style={{ fontSize: 13 }}>👑</Text>
              <Text style={styles.podiumVitrinTagText}>LİDERLER VİTRİNİ</Text>
            </View>
            <Text style={styles.podiumVitrinKicker}>EN İYİ 3 OYUNCU</Text>
          </View>

          <View style={styles.podiumRow}>
            {/* 2nd Place */}
            {top2 && (
              <Pressable
                style={({ pressed }) => [styles.podiumColumn, styles.podiumCol2, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]}
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
                    ? `Lv.${top2.level ?? getPlayerLevel(top2.score)} (${top2.score} XP)`
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
                style={({ pressed }) => [styles.podiumColumn, styles.podiumCol1, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]}
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
                <Text style={[styles.podiumScore, { color: "#987c00" }]}>
                  {rankingType === "level"
                    ? `Lv.${top1.level ?? getPlayerLevel(top1.score)} (${top1.score} XP)`
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
                style={({ pressed }) => [styles.podiumColumn, styles.podiumCol3, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]}
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
                    ? `Lv.${top3.level ?? getPlayerLevel(top3.score)} (${top3.score} XP)`
                    : `${top3.lp ?? (top3.tier ? getMinLpForTier(top3.tier) : 0)} LP`}
                </Text>
                <View style={styles.podiumBar3}>
                  <Text style={styles.podiumBarLabel}>🥉 ÜÇÜNCÜ</Text>
                </View>
              </Pressable>
            )}
          </View>
        </View>
      )}

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>
          {displayedLeaderboard.length >= 3 ? "DİĞER YARIŞMACILAR" : "SIRALAMA"}
        </Text>
        <Text style={styles.sectionMeta}>{displayedLeaderboard.length} AVCI</Text>
      </View>

      <View style={styles.board}>
        {(() => {
          const effectivePool = displayedLeaderboard.length >= 3 ? restOfLeaderboard : displayedLeaderboard;
          const isPodiumActive = displayedLeaderboard.length >= 3;
          const initialVisibleCount = isPodiumActive ? 4 : 7;
          const visiblePool = showAllLeaderboard ? effectivePool : effectivePool.slice(0, initialVisibleCount);
          const hiddenCount = effectivePool.length - visiblePool.length;

          if (!effectivePool.length) {
            return (
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
            );
          }

          return (
            <>
              {visiblePool.map((entry, sliceIdx) => {
                const index = isPodiumActive ? sliceIdx + 3 : sliceIdx;
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
                        <Text numberOfLines={1} style={[styles.playerName, isUser && { color: "#2a9c7a" }]}>
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
                          <View style={{ backgroundColor: "#38BDF820", borderWidth: 1, borderColor: "#DCE1D7", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginBottom: 2 }}>
                            <Text style={{ color: "#2a8fbc", fontSize: 11, fontWeight: "900" }}>SEVİYE {entry.level ?? getPlayerLevel(entry.score)}</Text>
                          </View>
                          <Text style={{ color: "#293541", fontSize: 10, fontWeight: "700" }}>{entry.score} XP</Text>
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
              })}

              {hiddenCount > 0 && (
                <Pressable
                  onPress={() => {
                    triggerHapticSelection();
                    setShowAllLeaderboard(true);
                  }}
                  style={({ pressed }) => [styles.expandLeaderboardBtn, pressed && { opacity: 0.8 }]}
                >
                  <Text style={styles.expandLeaderboardBtnText}>
                    ▼ DAHA FAZLA GÖSTER (+{hiddenCount} YARIŞMACI)
                  </Text>
                </Pressable>
              )}

              {showAllLeaderboard && effectivePool.length > initialVisibleCount && (
                <Pressable
                  onPress={() => {
                    triggerHapticSelection();
                    setShowAllLeaderboard(false);
                  }}
                  style={({ pressed }) => [styles.expandLeaderboardBtn, pressed && { opacity: 0.8 }]}
                >
                  <Text style={styles.expandLeaderboardBtnText}>
                    ▲ DAHA AZ GÖSTER
                  </Text>
                </Pressable>
              )}
            </>
          );
        })()}
      </View>
    </View>
  );
});

SeasonLeaderboardTab.displayName = "SeasonLeaderboardTab";
