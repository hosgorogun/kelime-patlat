import React, { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { type MatchHistoryEntry, type PlayerProgress } from "@/shared/progression";
import { triggerHapticSelection } from "@/shared/audio-haptics";
import { styles } from "./match-history.styles";

export type MatchHistoryModalProps = {
  visible: boolean;
  progress: PlayerProgress;
  onClose: () => void;
  onPlayNow?: () => void;
};

type FilterCategory = "all" | "duel" | "friend" | "solo";

function formatRelativeTime(timestamp: number | string | Date): string {
  if (!timestamp) return "Bilinmiyor";
  const ms = typeof timestamp === "number" ? timestamp : new Date(timestamp).getTime();
  if (!ms || isNaN(ms) || ms <= 0) return "Bilinmiyor";
  const diffSec = Math.max(1, Math.floor((Date.now() - ms) / 1000));
  if (diffSec < 60) return "Az önce";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} dk önce`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} sa önce`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Dün";
  if (diffDays < 7) return `${diffDays} gün önce`;

  const d = new Date(ms);
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
    if (!item) return false;
    const mode = (item.mode || "").toLowerCase();
    if (filter === "all") return true;
    if (filter === "duel") return mode === "ranked" || mode === "bot" || mode === "pvp";
    if (filter === "friend") return mode === "friend";
    if (filter === "solo") return mode === "solo" || mode === "arcade" || mode === "vintage" || mode === "daily" || mode === "level";
    return true;
  });

  // Calculate summary stats
  const totalMatches = history.length;
  const wins = history.filter((m) => !!m.won).length;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
  const totalLp = history.reduce((acc, m) => acc + (m.lpChange || 0), 0);

  const getModeTitle = (match: MatchHistoryEntry) => {
    const mode = (match.mode || "").toLowerCase();
    const sizeStr = match.size ? `${match.size}×${match.size} ` : "";
    if (mode === "ranked" || mode === "pvp") return `${sizeStr}DERECELİ DÜELLO`;
    if (mode === "bot") return `${sizeStr}BOT DÜELLOSU`;
    if (mode === "friend") return `${sizeStr}DOSTLUK DÜELLOSU`;
    if (mode === "solo" || mode === "level") return `${sizeStr}SOLO BÖLÜMÜ`;
    if (mode === "arcade") return "ZAMANA KARŞI ARCADE";
    if (mode === "vintage") return "GAZETE NOSTALJİ";
    if (mode === "daily") return "GÜNLÜK MEYDAN OKUMA";
    return `${sizeStr}MAÇ`;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.containerCard} onPress={(e) => e.stopPropagation()}>
          <LinearGradient
            colors={["#aef5e0", "#50E3C2", "#38BDF8"]}
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
                <Text style={styles.headerKicker}>KARİYER KAYITLARI</Text>
                <Text style={styles.headerTitle}>Maç Geçmişi</Text>
              </View>
            </View>
            <Pressable
              onPress={() => {
                triggerHapticSelection();
                onClose();
              }}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Quick Stats Strip */}
          <View style={styles.statsStrip}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>TOPLAM</Text>
              <Text style={styles.statValue}>{totalMatches}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>GALİBİYET</Text>
              <Text style={[styles.statValue, { color: "#279f73" }]}>{wins}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>KAZANMA</Text>
              <Text style={[styles.statValue, { color: winRate >= 50 ? "#279f73" : "#bd5564" }]}>
                %{winRate}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>NET LP</Text>
              <Text style={[styles.statValue, { color: totalLp >= 0 ? "#2a8fbc" : "#bd5564" }]}>
                {totalLp >= 0 ? `+${totalLp}` : totalLp}
              </Text>
            </View>
          </View>

          {/* Filter Segment Tabs */}
          <View style={styles.tabRow}>
            {(
              [
                { id: "all", label: "Tümü" },
                { id: "duel", label: "Düellolar" },
                { id: "friend", label: "Arkadaşlar" },
                { id: "solo", label: "Tek Kişilik" },
              ] as const
            ).map((t) => {
              const active = filter === t.id;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => {
                    triggerHapticSelection();
                    setFilter(t.id);
                  }}
                  style={[styles.tabBtn, active && styles.tabBtnActive]}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Matches List */}
          <ScrollView
            style={styles.listScroll}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredMatches.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>⏳</Text>
                <Text style={styles.emptyTitle}>Henüz kayıtlı maç yok</Text>
                <Text style={styles.emptySub}>
                  {filter === "all"
                    ? "Tamamladığın PvP düelloları ve tek oyunculu seviyeler burada listelenir."
                    : "Bu filtreye uygun tamamlanmış maç kaydı bulunamadı."}
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
              filteredMatches.map((match, idx) => {
                const mode = (match.mode || "").toLowerCase();
                const isSoloMode =
                  mode === "solo" ||
                  mode === "arcade" ||
                  mode === "vintage" ||
                  mode === "daily" ||
                  mode === "level";
                const isWon = !!match.won;
                const isDraw = !!match.isDraw;

                const resultBadgeColor = isSoloMode
                  ? isWon
                    ? "#06B6D4"
                    : "#EF4444"
                  : isDraw
                  ? "#F59E0B"
                  : isWon
                  ? "#10B981"
                  : "#EF4444";

                const resultLabel = isSoloMode
                  ? isWon
                    ? "🎯 TAMAMLANDI"
                    : "💔 BAŞARISIZ"
                  : isDraw
                  ? "⚖️ BERABERE"
                  : isWon
                  ? "🏆 KAZANDI"
                  : "💔 KAYBETTİ";

                return (
                  <View
                    key={match.id || `match-${idx}`}
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
                        <Text style={styles.cardTimeText}>{formatRelativeTime(match.date)}</Text>
                      </View>
                      <View
                        style={[
                          styles.resultBadge,
                          {
                            backgroundColor: `${resultBadgeColor}22`,
                            borderColor: `${resultBadgeColor}55`,
                          },
                        ]}
                      >
                        <Text style={[styles.resultBadgeText, { color: resultBadgeColor }]}>
                          {resultLabel}
                        </Text>
                      </View>
                    </View>

                    {/* Middle: Scores */}
                    <View style={styles.cardBody}>
                      {isSoloMode ? (
                        <View style={styles.soloScoreRow}>
                          <Text style={styles.soloScoreLabel}>Kazanılan Puan:</Text>
                          <Text style={styles.soloScoreValue}>{match.myScore} PUAN</Text>
                        </View>
                      ) : (
                        <View style={styles.duelScoreRow}>
                          <View style={styles.scoreSide}>
                            <Text style={styles.scoreSideLabel}>SEN</Text>
                            <Text
                              style={[
                                styles.scoreSideValue,
                                { color: isWon ? "#10B981" : isDraw ? "#F59E0B" : "#EF4444" },
                              ]}
                            >
                              {match.myScore}
                            </Text>
                          </View>
                          <View style={styles.vsBadge}>
                            <Text style={styles.vsText}>VS</Text>
                          </View>
                          <View style={[styles.scoreSide, { alignItems: "flex-end" }]}>
                            <Text numberOfLines={1} style={styles.scoreSideLabel}>
                              {match.opponentName || "RAKİP"}
                            </Text>
                            <Text
                              style={[
                                styles.scoreSideValue,
                                { color: !isWon && !isDraw ? "#10B981" : "#64748B" },
                              ]}
                            >
                              {match.opponentScore ?? 0}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>

                    {/* Footer: Rewards / Gain Badges */}
                    <View style={styles.cardFooter}>
                      {mode === "friend" ? (
                        <View style={[styles.rewardChip, styles.friendChip]}>
                          <Text style={styles.friendChipText}>🤝 Dostluk Maçı (LP Yok)</Text>
                        </View>
                      ) : (
                        typeof match.lpChange === "number" &&
                        match.lpChange !== 0 && (
                          <View
                            style={[
                              styles.rewardChip,
                              match.lpChange >= 0 ? styles.lpPositiveChip : styles.lpNegativeChip,
                            ]}
                          >
                            <Text
                              style={[
                                styles.rewardChipText,
                                { color: match.lpChange >= 0 ? "#279f73" : "#bf5757" },
                              ]}
                            >
                              {match.lpChange >= 0 ? `+${match.lpChange}` : match.lpChange} LP
                            </Text>
                          </View>
                        )
                      )}

                      {(match.xpEarned ?? 0) > 0 && (
                        <View style={[styles.rewardChip, styles.xpChip]}>
                          <Text style={[styles.rewardChipText, { color: "#2a8fbc" }]}>
                            +{match.xpEarned} XP
                          </Text>
                        </View>
                      )}

                      {(match.coinsEarned ?? 0) > 0 && (
                        <View style={[styles.rewardChip, styles.coinChip]}>
                          <Text style={[styles.rewardChipText, { color: "#9b7616" }]}>
                            +{match.coinsEarned} Çip
                          </Text>
                        </View>
                      )}

                      {(match.wordsCount ?? 0) > 0 && (
                        <View style={[styles.rewardChip, styles.wordChip]}>
                          <Text style={[styles.rewardChipText, { color: "#5b8571" }]}>
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
        </Pressable>
      </Pressable>
    </Modal>
  );
}
