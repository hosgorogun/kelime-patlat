import React, { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { type MatchHistoryEntry, type PlayerProgress } from "@/shared/progression";
import { triggerHapticSelection } from "@/shared/audio-haptics";

export type MatchHistoryModalProps = {
  visible: boolean;
  progress: PlayerProgress;
  onClose: () => void;
  onPlayNow?: () => void;
};

type FilterCategory = "all" | "duel" | "friend" | "solo";

function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return "Bilinmiyor";
  const diffSec = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 60) return "Az önce";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} dk önce`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} sa önce`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Dün";
  if (diffDays < 7) return `${diffDays} gün önce`;
  
  const d = new Date(timestamp);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${d.getFullYear()}`;
}

export function MatchHistoryModal({
  visible,
  progress,
  onClose,
  onPlayNow,
}: MatchHistoryModalProps) {
  const [filter, setFilter] = useState<FilterCategory>("all");

  if (!visible) return null;

  const history: MatchHistoryEntry[] = progress.matchHistory ?? [];

  // Filter items
  const filteredMatches = history.filter((item) => {
    if (filter === "all") return true;
    if (filter === "duel") return item.mode === "ranked" || item.mode === "bot";
    if (filter === "friend") return item.mode === "friend";
    if (filter === "solo") return item.mode === "solo" || item.mode === "arcade" || item.mode === "vintage" || item.mode === "daily";
    return true;
  });

  // Calculate summary stats
  const totalMatches = history.length;
  const winsCount = history.filter((m) => m.won).length;
  const winRate = totalMatches > 0 ? Math.round((winsCount / totalMatches) * 100) : 0;
  const highestScore = history.reduce((max, m) => Math.max(max, m.myScore || 0), progress.bestScore || 0);

  const getModeTitle = (entry: MatchHistoryEntry) => {
    const sizeStr = entry.size ? ` · ${entry.size}×${entry.size}` : "";
    switch (entry.mode) {
      case "ranked":
        return `⚔️ Dereceli Düello${sizeStr}`;
      case "friend":
        return `🤝 Arkadaş Maçı${sizeStr}`;
      case "bot":
        return `🤖 Bot Düellosu${sizeStr}`;
      case "arcade":
        return "🕹️ Skor Hücumu";
      case "vintage":
        return "🧩 Gazete Bulmacası";
      case "daily":
        return "🗺️ Günün Rotası";
      case "solo":
        return `🎯 Seviye Yolculuğu${sizeStr}`;
      default:
        return `🎮 Düello${sizeStr}`;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.containerCard}>
          {/* Top Decorative Border */}
          <LinearGradient
            colors={["#50E3C2", "#C9A227", "#34D399"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topGlowBar}
          />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconWrap}>
                <Text style={styles.headerIcon}>📜</Text>
              </View>
              <View>
                <Text style={styles.headerKicker}>SAVAŞ KAYITLARI</Text>
                <Text style={styles.headerTitle}>OYUN GEÇMİŞİ</Text>
              </View>
            </View>
            <Pressable
              onPress={() => {
                triggerHapticSelection();
                onClose();
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Quick Summary Stats Bar */}
          <View style={styles.statsStrip}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>TOPLAM</Text>
              <Text style={styles.statValue}>{totalMatches}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>GALİBİYET</Text>
              <Text style={[styles.statValue, { color: "#34D399" }]}>{winsCount}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>ORAN</Text>
              <Text style={[styles.statValue, { color: "#FBBF24" }]}>%{winRate}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>EN YÜKSEK</Text>
              <Text style={[styles.statValue, { color: "#38BDF8" }]}>{highestScore}</Text>
            </View>
          </View>

          {/* Filter Tabs */}
          <View style={styles.tabRow}>
            {(
              [
                { key: "all", label: "Tümü" },
                { key: "duel", label: "Düello" },
                { key: "friend", label: "Arkadaş" },
                { key: "solo", label: "Solo & Diğer" },
              ] as const
            ).map((tab) => {
              const active = filter === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => {
                    triggerHapticSelection();
                    setFilter(tab.key);
                  }}
                  style={[styles.tabBtn, active && styles.tabBtnActive]}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Match List */}
          <ScrollView
            style={styles.listScroll}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredMatches.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📜</Text>
                <Text style={styles.emptyTitle}>Henüz Maç Kaydı Yok</Text>
                <Text style={styles.emptySub}>
                  {filter === "friend"
                    ? "Henüz arkadaşlarınla bir düello yapmadın. Arkadaşlarını davet et ve maç yap!"
                    : filter === "duel"
                    ? "Henüz bir düelloya katılmadın. Dereceli Düello ile LP kazanmaya başla!"
                    : "Tamamlanan maçların ve bulmaca skorların burada listelenecek."}
                </Text>
                {onPlayNow && (
                  <Pressable
                    onPress={() => {
                      triggerHapticSelection();
                      onClose();
                      onPlayNow();
                    }}
                    style={({ pressed }) => [styles.playNowBtn, pressed && styles.pressed]}
                  >
                    <Text style={styles.playNowBtnText}>⚔️ HEMEN OYNA</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              filteredMatches.map((match) => {
                const isSoloMode = match.mode === "solo" || match.mode === "arcade" || match.mode === "vintage" || match.mode === "daily";
                const isWon = match.won;
                const isDraw = match.isDraw;

                const resultBadgeColor = isSoloMode
                  ? (isWon ? "#06B6D4" : "#EF4444")
                  : isDraw
                  ? "#F59E0B"
                  : isWon
                  ? "#10B981"
                  : "#EF4444";

                const resultLabel = isSoloMode
                  ? (isWon ? "🎯 TAMAMLANDI" : "💔 BAŞARISIZ")
                  : isDraw
                  ? "⚖️ BERABERE"
                  : isWon
                  ? "🏆 KAZANDI"
                  : "💔 KAYBETTİ";

                return (
                  <View
                    key={match.id}
                    style={[
                      styles.matchCard,
                      {
                        borderLeftColor: resultBadgeColor,
                        borderLeftWidth: 4,
                      },
                    ]}
                  >
                    {/* Top Row: Mode & Time & Status Badge */}
                    <View style={styles.cardHeader}>
                      <View style={styles.cardModeGroup}>
                        <Text style={styles.cardModeTitle}>{getModeTitle(match)}</Text>
                        <Text style={styles.cardTimeText}>
                          {formatRelativeTime(match.date)}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.resultBadge,
                          {
                            backgroundColor: `${resultBadgeColor}22`,
                            borderColor: resultBadgeColor,
                          },
                        ]}
                      >
                        <Text style={[styles.resultBadgeText, { color: resultBadgeColor }]}>
                          {resultLabel}
                        </Text>
                      </View>
                    </View>

                    {/* Middle Row: Score / Opponent */}
                    <View style={styles.cardBody}>
                      {isSoloMode ? (
                        <View style={styles.soloScoreRow}>
                          <Text style={styles.soloScoreLabel}>Elde Edilen Skor:</Text>
                          <Text style={styles.soloScoreValue}>{match.myScore} Puan</Text>
                        </View>
                      ) : (
                        <View style={styles.duelScoreRow}>
                          {/* Player */}
                          <View style={styles.scoreSide}>
                            <Text style={styles.scoreSideLabel}>SEN</Text>
                            <Text
                              style={[
                                styles.scoreSideValue,
                                isWon && !isDraw ? { color: "#34D399" } : { color: "#FFF" },
                              ]}
                            >
                              {match.myScore}
                            </Text>
                          </View>

                          {/* VS Badge */}
                          <View style={styles.vsBadge}>
                            <Text style={styles.vsText}>VS</Text>
                          </View>

                          {/* Opponent */}
                          <View style={[styles.scoreSide, { alignItems: "flex-end" }]}>
                            <Text style={styles.scoreSideLabel} numberOfLines={1}>
                              {match.opponentAvatar ? `${match.opponentAvatar} ` : ""}
                              {match.opponentName || (match.mode === "bot" ? "Siber Bot" : "Rakip")}
                            </Text>
                            <Text
                              style={[
                                styles.scoreSideValue,
                                !isWon && !isDraw ? { color: "#EF4444" } : { color: "#FFF" },
                              ]}
                            >
                              {match.opponentScore ?? 0}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>

                    {/* Bottom Row: Reward chips */}
                    <View style={styles.cardFooter}>
                      {match.mode === "friend" ? (
                        <View style={[styles.rewardChip, styles.friendChip]}>
                          <Text style={styles.friendChipText}>🤝 Dostluk Maçı</Text>
                        </View>
                      ) : (
                        typeof match.lpChange === "number" && (
                          <View
                            style={[
                              styles.rewardChip,
                              match.lpChange >= 0 ? styles.lpPositiveChip : styles.lpNegativeChip,
                            ]}
                          >
                            <Text
                              style={[
                                styles.rewardChipText,
                                { color: match.lpChange >= 0 ? "#34D399" : "#F87171" },
                              ]}
                            >
                              {match.lpChange >= 0 ? `+${match.lpChange}` : match.lpChange} LP
                            </Text>
                          </View>
                        )
                      )}

                      {(match.xpEarned ?? 0) > 0 && (
                        <View style={[styles.rewardChip, styles.xpChip]}>
                          <Text style={[styles.rewardChipText, { color: "#38BDF8" }]}>
                            +{match.xpEarned} XP
                          </Text>
                        </View>
                      )}

                      {(match.coinsEarned ?? 0) > 0 && (
                        <View style={[styles.rewardChip, styles.coinChip]}>
                          <Text style={[styles.rewardChipText, { color: "#FBBF24" }]}>
                            +{match.coinsEarned} Çip
                          </Text>
                        </View>
                      )}

                      {(match.wordsCount ?? 0) > 0 && (
                        <View style={[styles.rewardChip, styles.wordChip]}>
                          <Text style={[styles.rewardChipText, { color: "#A7F3D0" }]}>
                            {match.wordsCount} Kelime
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Footer Close Action */}
          <View style={styles.modalBottomBar}>
            <Pressable
              onPress={() => {
                triggerHapticSelection();
                onClose();
              }}
              style={({ pressed }) => [styles.bottomCloseBtn, pressed && styles.pressed]}
            >
              <Text style={styles.bottomCloseBtnText}>KAPAT</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(3, 10, 8, 0.88)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  containerCard: {
    width: "100%",
    maxWidth: 440,
    maxHeight: "88%",
    backgroundColor: "#071B14",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(212, 180, 90, 0.35)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
    display: "flex",
    flexDirection: "column",
  },
  topGlowBar: {
    height: 4,
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212, 180, 90, 0.15)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(80, 227, 194, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(80, 227, 194, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#50E3C2",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  headerIcon: {
    fontSize: 22,
  },
  headerKicker: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "#50E3C2",
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.8,
    color: "#FFF",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    color: "#94A3B8",
    fontSize: 15,
    fontWeight: "900",
  },
  statsStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(10, 32, 25, 0.9)",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 10,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "rgba(212, 180, 90, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFF",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "rgba(10, 36, 28, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  tabBtnActive: {
    backgroundColor: "rgba(80, 227, 194, 0.16)",
    borderColor: "#50E3C2",
    shadowColor: "#50E3C2",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "700",
  },
  tabTextActive: {
    color: "#50E3C2",
    fontWeight: "900",
  },
  listScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingVertical: 6,
    gap: 10,
    flexGrow: 1,
  },
  matchCard: {
    backgroundColor: "rgba(14, 38, 30, 0.95)",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(212, 180, 90, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  cardModeGroup: {
    flex: 1,
    marginRight: 8,
  },
  cardModeTitle: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  cardTimeText: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  resultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  resultBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  cardBody: {
    marginBottom: 10,
  },
  soloScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  soloScoreLabel: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
  },
  soloScoreValue: {
    color: "#38BDF8",
    fontSize: 14,
    fontWeight: "900",
  },
  duelScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  scoreSide: {
    flex: 1,
  },
  scoreSideLabel: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 2,
  },
  scoreSideValue: {
    fontSize: 17,
    fontWeight: "900",
  },
  vsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  vsText: {
    color: "#C9A227",
    fontSize: 11,
    fontWeight: "900",
  },
  cardFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  rewardChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  lpPositiveChip: {
    backgroundColor: "rgba(52, 211, 153, 0.12)",
    borderColor: "rgba(52, 211, 153, 0.35)",
  },
  lpNegativeChip: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderColor: "rgba(239, 68, 68, 0.35)",
  },
  friendChip: {
    backgroundColor: "rgba(168, 85, 247, 0.12)",
    borderColor: "rgba(168, 85, 247, 0.35)",
  },
  friendChipText: {
    color: "#C084FC",
    fontSize: 10,
    fontWeight: "800",
  },
  xpChip: {
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderColor: "rgba(56, 189, 248, 0.35)",
  },
  coinChip: {
    backgroundColor: "rgba(251, 191, 36, 0.12)",
    borderColor: "rgba(251, 191, 36, 0.35)",
  },
  wordChip: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderColor: "rgba(16, 185, 129, 0.35)",
  },
  rewardChipText: {
    fontSize: 10,
    fontWeight: "900",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 12,
    opacity: 0.8,
  },
  emptyTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 6,
    textAlign: "center",
  },
  emptySub: {
    color: "#94A3B8",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 280,
    marginBottom: 18,
  },
  playNowBtn: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 12,
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  playNowBtnText: {
    color: "#042F1A",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  modalBottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(212, 180, 90, 0.15)",
  },
  bottomCloseBtn: {
    width: "100%",
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomCloseBtnText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});
