import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { type TurnMatch, calculateTurnWordScore } from "@/shared/turn-match";
import { type FriendUser } from "@/shared/social";
import { wordFromSelection, advanceSelection, TURKISH_LETTERS } from "@/shared/game";
import { normalizeTr, normalizeTrUpper, isEqualTr } from "@/shared/tr-utils";
import { isValidTurkishWord } from "@/shared/dictionary";
import { haptics } from "@/lib/haptics";
import { getApiBaseUrl } from "@/constants/oauth";

export interface TurnMatchesModalProps {
  visible: boolean;
  onDismiss: () => void;
  playerId: string;
  playerName: string;
  avatar?: string;
  friendsList: FriendUser[];
}

export const TurnMatchesModal = React.memo(({
  visible,
  onDismiss,
  playerId,
  playerName,
  avatar,
  friendsList,
}: TurnMatchesModalProps) => {
  const [activeTab, setActiveTab] = useState<"turn" | "waiting" | "completed">("turn");
  const [matches, setMatches] = useState<TurnMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeMatch, setActiveMatch] = useState<TurnMatch | null>(null);

  // Active match play state
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchMatches = useCallback(async () => {
    if (!playerId) return;
    setLoading(true);
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/turn-matches/my-matches?userId=${encodeURIComponent(playerId)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.matches)) {
          setMatches(data.matches);
        }
      }
    } catch {
      // offline / mock fallback
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    if (visible) {
      void fetchMatches();
      setActiveMatch(null);
      setSelectedIndices([]);
    }
  }, [visible, fetchMatches]);

  const turnMatches = useMemo(() => {
    return matches.filter((m) => m.status === "active" && m.turnPlayerId === playerId);
  }, [matches, playerId]);

  const waitingMatches = useMemo(() => {
    return matches.filter((m) => m.status === "active" && m.turnPlayerId !== playerId);
  }, [matches, playerId]);

  const completedMatches = useMemo(() => {
    return matches.filter((m) => m.status === "completed" || m.status === "expired");
  }, [matches]);

  const handleStartMatch = async (opponentId: string, opponentName: string, opponentAvatar = "orbit") => {
    haptics.select();
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/turn-matches/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player1Id: playerId,
          player1Name: playerName,
          player1Avatar: avatar || "spark",
          player2Id: opponentId,
          player2Name: opponentName,
          player2Avatar: opponentAvatar,
          size: 4,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.match) {
          setMatches((curr) => [data.match, ...curr]);
          setActiveMatch(data.match);
          setSelectedIndices([]);
          haptics.success();
        }
      }
    } catch {
      Alert.alert("Hata", "Yeni düello başlatılamadı.");
    }
  };

  const handleCellPress = (index: number) => {
    if (!activeMatch) return;
    haptics.select();
    setSelectedIndices((prev) => advanceSelection(prev, index, activeMatch.size as any));
  };

  const handleClearSelection = () => {
    haptics.light();
    setSelectedIndices([]);
  };

  const currentConstructedWord = useMemo(() => {
    if (!activeMatch) return "";
    return selectedIndices.map((idx) => activeMatch.board[idx] || "").join("");
  }, [activeMatch, selectedIndices]);

  const handleSubmitWord = async () => {
    if (!activeMatch || selectedIndices.length < 2) return;
    const word = currentConstructedWord.trim();
    if (!isValidTurkishWord(word)) {
      haptics.error();
      Alert.alert("Geçersiz Kelime", `"${word}" geçerli bir Türkçe kelime değil.`);
      return;
    }

    setSubmitting(true);
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/turn-matches/${activeMatch.id}/play`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId,
          word,
          selection: selectedIndices,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        haptics.success();
        if (data.match) {
          setMatches((curr) => curr.map((m) => m.id === data.match.id ? data.match : m));
          setActiveMatch(null);
          setSelectedIndices([]);
        }
      } else {
        const err = await res.json();
        Alert.alert("Hata", err.error || "Hamle gönderilemedi.");
      }
    } catch {
      Alert.alert("Hata", "Bağlantı hatası.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerKicker}>24 SAAT HAMLE SÜRELİ SIRA TABANLI MOD</Text>
              <Text style={styles.headerTitle}>KAHVE DÜELLOSU ☕</Text>
            </View>
            <Pressable onPress={() => { setActiveMatch(null); onDismiss(); }} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* If currently playing a match board */}
          {activeMatch ? (
            <View style={styles.activeBoardWrap}>
              <View style={styles.matchScoreBar}>
                <View style={styles.playerScoreBlock}>
                  <Text style={styles.scorePlayerName}>{activeMatch.player1Name}</Text>
                  <Text style={styles.scoreVal}>{activeMatch.player1Score} P</Text>
                </View>
                <View style={styles.roundCenterBadge}>
                  <Text style={styles.roundText}>TUR {activeMatch.round}/{activeMatch.maxRounds}</Text>
                </View>
                <View style={[styles.playerScoreBlock, { alignItems: "flex-end" }]}>
                  <Text style={styles.scorePlayerName}>{activeMatch.player2Name}</Text>
                  <Text style={styles.scoreVal}>{activeMatch.player2Score} P</Text>
                </View>
              </View>

              {/* Selection banner */}
              <View style={styles.selectionBar}>
                <Text style={styles.selectionWordText}>
                  {currentConstructedWord || "HARFLERE DOKUNARAK KELİME OLUŞTUR"}
                </Text>
                {currentConstructedWord.length >= 2 && (
                  <Text style={styles.selectionScoreText}>
                    +{calculateTurnWordScore(currentConstructedWord)} Puan
                  </Text>
                )}
              </View>

              {/* 4x4 Grid */}
              <View style={styles.gridContainer}>
                {activeMatch.board.map((letter, index) => {
                  const selOrder = selectedIndices.indexOf(index);
                  const isSelected = selOrder !== -1;
                  return (
                    <Pressable
                      key={`turn-cell-${index}`}
                      onPress={() => handleCellPress(index)}
                      style={[
                        styles.cell,
                        isSelected && styles.cellSelected,
                      ]}
                    >
                      <Text style={[styles.cellLetter, isSelected && styles.cellLetterSelected]}>
                        {letter}
                      </Text>
                      {isSelected && (
                        <Text style={styles.orderBadge}>{selOrder + 1}</Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {/* Play Actions */}
              <View style={styles.actionsRow}>
                <Pressable
                  onPress={handleClearSelection}
                  style={styles.clearBtn}
                  disabled={submitting}
                >
                  <Text style={styles.clearBtnText}>TEMİZLE</Text>
                </Pressable>
                <Pressable
                  onPress={handleSubmitWord}
                  style={[styles.submitBtn, selectedIndices.length < 2 && styles.submitBtnDisabled]}
                  disabled={selectedIndices.length < 2 || submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>HAMLEYİ BİTİR ›</Text>
                  )}
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              {/* Match Category Tabs */}
              <View style={styles.tabBar}>
                <Pressable
                  onPress={() => { haptics.select(); setActiveTab("turn"); }}
                  style={[styles.tabBtn, activeTab === "turn" && styles.tabBtnActive]}
                >
                  <Text style={[styles.tabBtnText, activeTab === "turn" && styles.tabBtnTextActive]}>
                    ⚡ Sıra Sende ({turnMatches.length})
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => { haptics.select(); setActiveTab("waiting"); }}
                  style={[styles.tabBtn, activeTab === "waiting" && styles.tabBtnActive]}
                >
                  <Text style={[styles.tabBtnText, activeTab === "waiting" && styles.tabBtnTextActive]}>
                    ⏳ Rakipte ({waitingMatches.length})
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => { haptics.select(); setActiveTab("completed"); }}
                  style={[styles.tabBtn, activeTab === "completed" && styles.tabBtnActive]}
                >
                  <Text style={[styles.tabBtnText, activeTab === "completed" && styles.tabBtnTextActive]}>
                    🏆 Bitenler ({completedMatches.length})
                  </Text>
                </Pressable>
              </View>

              {/* Matches List */}
              <ScrollView style={styles.matchScroll} contentContainerStyle={{ paddingBottom: 24 }}>
                {loading ? (
                  <ActivityIndicator size="large" color="#293541" style={{ marginVertical: 30 }} />
                ) : activeTab === "turn" && turnMatches.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyEmoji}>☕</Text>
                    <Text style={styles.emptyTitle}>Sırası Sende Olan Maç Yok</Text>
                    <Text style={styles.emptyDesc}>
                      Arkadaşlarına meydan oku veya hemen yeni bir kahve düellosu başlat!
                    </Text>
                  </View>
                ) : activeTab === "turn" ? (
                  turnMatches.map((m) => {
                    const opponentName = m.player1Id === playerId ? m.player2Name : m.player1Name;
                    const myScore = m.player1Id === playerId ? m.player1Score : m.player2Score;
                    const oppScore = m.player1Id === playerId ? m.player2Score : m.player1Score;
                    return (
                      <Pressable
                        key={m.id}
                        onPress={() => {
                          haptics.select();
                          setActiveMatch(m);
                          setSelectedIndices([]);
                        }}
                        style={({ pressed }) => [styles.matchCard, pressed && { opacity: 0.85 }]}
                      >
                        <View style={styles.cardHeader}>
                          <View style={styles.badgeYourTurn}>
                            <Text style={styles.badgeYourTurnText}>⚡ SIRA SENDE</Text>
                          </View>
                          <Text style={styles.roundInfo}>Tur {m.round}/{m.maxRounds}</Text>
                        </View>
                        <View style={styles.matchCardBody}>
                          <Text style={styles.opponentNameText}>Rakip: {opponentName}</Text>
                          <Text style={styles.scoreCompareText}>Sen: {myScore} P · Rakip: {oppScore} P</Text>
                        </View>
                        <View style={styles.playNowBtn}>
                          <Text style={styles.playNowText}>KELİME OYNA ›</Text>
                        </View>
                      </Pressable>
                    );
                  })
                ) : activeTab === "waiting" ? (
                  waitingMatches.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyEmoji}>⏳</Text>
                      <Text style={styles.emptyTitle}>Rakip Hamlesi Beklenmiyor</Text>
                    </View>
                  ) : (
                    waitingMatches.map((m) => {
                      const opponentName = m.player1Id === playerId ? m.player2Name : m.player1Name;
                      return (
                        <View key={m.id} style={[styles.matchCard, { opacity: 0.8 }]}>
                          <View style={styles.cardHeader}>
                            <View style={[styles.badgeYourTurn, { backgroundColor: "#FEF3C7", borderColor: "#FDE68A" }]}>
                              <Text style={[styles.badgeYourTurnText, { color: "#B45309" }]}>⏳ RAKİP HAMLE YAPIYOR</Text>
                            </View>
                            <Text style={styles.roundInfo}>Tur {m.round}/{m.maxRounds}</Text>
                          </View>
                          <Text style={styles.opponentNameText}>{opponentName}</Text>
                          <Text style={styles.scoreCompareText}>24 saat içinde hamlesini yapacak.</Text>
                        </View>
                      );
                    })
                  )
                ) : (
                  completedMatches.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyEmoji}>🏁</Text>
                      <Text style={styles.emptyTitle}>Tamamlanan Düello Yok</Text>
                    </View>
                  ) : (
                    completedMatches.map((m) => {
                      const won = m.winnerId === playerId;
                      const isDraw = m.winnerId === "draw";
                      const opponentName = m.player1Id === playerId ? m.player2Name : m.player1Name;
                      return (
                        <View key={m.id} style={styles.matchCard}>
                          <Text style={{ fontWeight: "900", color: won ? "#10B981" : isDraw ? "#64748B" : "#EF4444" }}>
                            {won ? "🏆 KAZANDIN" : isDraw ? "🤝 BERABERE" : "💔 KAYBETTİN"}
                          </Text>
                          <Text style={styles.opponentNameText}>Rakip: {opponentName}</Text>
                          <Text style={styles.scoreCompareText}>{m.player1Score} - {m.player2Score}</Text>
                        </View>
                      );
                    })
                  )
                )}

                {/* Quick Challenge Section */}
                <View style={styles.newMatchSection}>
                  <Text style={styles.sectionHeader}>YENİ KAHVE DÜELLOSU BAŞLAT</Text>
                  <Pressable
                    onPress={() => handleStartMatch(`bot_kahve_${Date.now()}`, "Bot Bilge 🤖", "sage")}
                    style={styles.startBotBtn}
                  >
                    <Text style={styles.startBotText}>🤖 Hızlı Bot Düellosu Başlat (Antrenman)</Text>
                  </Pressable>
                  {friendsList.map((f) => (
                    <Pressable
                      key={f.id}
                      onPress={() => handleStartMatch(f.id, f.name || f.username, f.avatar)}
                      style={styles.friendRow}
                    >
                      <Text style={{ fontSize: 18 }}>{f.avatar || "👤"}</Text>
                      <Text style={styles.friendName}>{f.name || f.username}</Text>
                      <View style={styles.challengeMiniBtn}>
                        <Text style={styles.challengeMiniText}>Meydan Oku ⚔️</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
});

TurnMatchesModal.displayName = "TurnMatchesModal";

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  sheetCard: {
    backgroundColor: "#FAFDF7",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "92%",
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: "#DCE1D7",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerKicker: {
    fontSize: 9,
    fontWeight: "900",
    color: "#718096",
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#293541",
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0F5ED",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DCE1D7",
  },
  closeBtnText: {
    fontSize: 16,
    color: "#293541",
    fontWeight: "bold",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#F0F5ED",
    borderRadius: 14,
    padding: 3,
    marginBottom: 12,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 11,
  },
  tabBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#718096",
  },
  tabBtnTextActive: {
    color: "#293541",
    fontWeight: "900",
  },
  matchScroll: {
    maxHeight: 480,
  },
  matchCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#DCE1D7",
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  badgeYourTurn: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  badgeYourTurnText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#059669",
  },
  roundInfo: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
  },
  matchCardBody: {
    marginVertical: 4,
  },
  opponentNameText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#293541",
  },
  scoreCompareText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  playNowBtn: {
    backgroundColor: "#293541",
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  playNowText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#293541",
  },
  emptyDesc: {
    fontSize: 11,
    color: "#718096",
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 20,
  },
  newMatchSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: "900",
    color: "#718096",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  startBotBtn: {
    backgroundColor: "#F0F5ED",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DCE1D7",
    marginBottom: 8,
  },
  startBotText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#293541",
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DCE1D7",
    marginBottom: 6,
    gap: 10,
  },
  friendName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    color: "#293541",
  },
  challengeMiniBtn: {
    backgroundColor: "#10B981",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  challengeMiniText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  activeBoardWrap: {
    paddingVertical: 10,
  },
  matchScoreBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F0F5ED",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DCE1D7",
    marginBottom: 10,
  },
  playerScoreBlock: {
    flex: 1,
  },
  scorePlayerName: {
    fontSize: 11,
    fontWeight: "900",
    color: "#293541",
  },
  scoreVal: {
    fontSize: 16,
    fontWeight: "900",
    color: "#059669",
  },
  roundCenterBadge: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DCE1D7",
  },
  roundText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#64748B",
  },
  selectionBar: {
    backgroundColor: "#FFFBEB",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FDE68A",
    alignItems: "center",
    marginBottom: 12,
  },
  selectionWordText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#92400E",
    letterSpacing: 2,
  },
  selectionScoreText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#B45309",
    marginTop: 2,
  },
  gridContainer: {
    width: 260,
    height: 260,
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#F0F5ED",
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: "#DCE1D7",
    marginBottom: 14,
  },
  cell: {
    width: "25%",
    height: "25%",
    padding: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  cellSelected: {
    backgroundColor: "rgba(16, 185, 129, 0.25)",
    borderRadius: 10,
  },
  cellLetter: {
    fontSize: 20,
    fontWeight: "900",
    color: "#293541",
  },
  cellLetterSelected: {
    color: "#065F46",
  },
  orderBadge: {
    position: "absolute",
    top: 2,
    right: 4,
    fontSize: 8,
    fontWeight: "900",
    color: "#059669",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  clearBtn: {
    flex: 1,
    backgroundColor: "#F0F5ED",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DCE1D7",
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#64748B",
  },
  submitBtn: {
    flex: 2,
    backgroundColor: "#10B981",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#FFFFFF",
  },
});
