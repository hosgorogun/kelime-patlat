import React, { useState, useMemo, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { normalizeTr, normalizeTrUpper, isEqualTr } from "@/shared/tr-utils";
import { WORD_BOOK_MILESTONES, type PlayerProgress, type WordBookMilestone } from "@/shared/progression";
import { WORD_CARD_ALBUMS } from "@/shared/card-albums";
import { fetchWordDetail } from "@/shared/dictionary";
import { haptics } from "@/lib/haptics";
import { CoinCascadeOverlay } from "@/components/game/coin-cascade";

export interface WordBookModalProps {
  visible: boolean;
  onDismiss: () => void;
  progress: PlayerProgress;
  setProgress: React.Dispatch<React.SetStateAction<PlayerProgress>>;
  onClaimMilestone?: (milestone: WordBookMilestone) => void;
}

export const WordBookModal = React.memo(({
  visible,
  onDismiss,
  progress,
  setProgress,
  onClaimMilestone,
}: WordBookModalProps) => {
  const [activeTab, setActiveTab] = useState<"words" | "albums">("words");
  const [filterLength, setFilterLength] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [definitionLoading, setDefinitionLoading] = useState(false);
  const [cascadeTrigger, setCascadeTrigger] = useState(false);
  const [currentDefinition, setCurrentDefinition] = useState<{
    word: string;
    definition: string;
    type?: string;
    example?: string;
  } | null>(null);

  const discoveredWords = useMemo(() => {
    return (progress.discoveredWords || []).slice().sort((a, b) => b.length - a.length || a.localeCompare(b, "tr"));
  }, [progress.discoveredWords]);

  const filteredWords = useMemo(() => {
    const q = normalizeTr(searchQuery.trim());
    return discoveredWords.filter((w) => {
      if (filterLength !== null) {
        if (filterLength === 7 && w.length < 7) return false;
        if (filterLength < 7 && w.length !== filterLength) return false;
      }
      if (q) {
        return normalizeTr(w).includes(q);
      }
      return true;
    });
  }, [discoveredWords, filterLength, searchQuery]);

  const claimedMilestones = progress.wordBookClaimedMilestones || {};

  const handleInspectWord = useCallback(async (word: string) => {
    if (selectedWord && isEqualTr(selectedWord, word)) {
      setSelectedWord(null);
      setCurrentDefinition(null);
      return;
    }
    haptics.select();
    setSelectedWord(word);
    setDefinitionLoading(true);
    try {
      const def = await fetchWordDetail(word);
      setCurrentDefinition({
        word,
        definition: def.definition || def.definitions?.[0] || "Tanım yüklenemedi.",
        type: def.type,
        example: def.example,
      });
    } catch {
      setCurrentDefinition({
        word,
        definition: "Tanım bulunamadı.",
      });
    } finally {
      setDefinitionLoading(false);
    }
  }, [selectedWord]);

  const handleClaimReward = useCallback((milestone: WordBookMilestone) => {
    haptics.success();
    setCascadeTrigger(true);
    setTimeout(() => setCascadeTrigger(false), 1600);
    if (onClaimMilestone) {
      onClaimMilestone(milestone);
    } else {
      setProgress((curr) => ({
        ...curr,
        coins: (curr.coins ?? 0) + milestone.rewardCoins,
        wordBookClaimedMilestones: {
          ...(curr.wordBookClaimedMilestones || {}),
          [milestone.count]: true,
        },
      }));
    }
  }, [setProgress, onClaimMilestone]);

  const totalDiscovered = discoveredWords.length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Pressable style={styles.sheetCard} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerKicker}>KİŞİSEL SÖZLÜK KOLEKSİYONU</Text>
              <Text style={styles.headerTitle}>LÜGAT MÜZESİ 📖</Text>
            </View>
            <Pressable onPress={onDismiss} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabBarRow}>
            <Pressable
              onPress={() => {
                haptics.select();
                setActiveTab("words");
              }}
              style={[styles.tabItem, activeTab === "words" && styles.tabItemActive]}
            >
              <Text style={[styles.tabItemText, activeTab === "words" && styles.tabItemTextActive]}>
                📖 Keşfedilen Kelimeler ({totalDiscovered})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                haptics.select();
                setActiveTab("albums");
              }}
              style={[styles.tabItem, activeTab === "albums" && styles.tabItemActive]}
            >
              <Text style={[styles.tabItemText, activeTab === "albums" && styles.tabItemTextActive]}>
                🃏 Kart Albümleri ({progress.cardAlbum?.ownedCardIds?.length || 0}/18)
              </Text>
            </Pressable>
          </View>

          {activeTab === "words" ? (
            <>
              {/* Stats Bar */}
              <View style={styles.statsCard}>
                <View style={styles.statsTextWrap}>
                  <Text style={styles.statsCount}>{totalDiscovered}</Text>
                  <Text style={styles.statsLabel}>KEŞFEDİLEN KELİME</Text>
                </View>
                <Text style={styles.statsHint}>
                  Solo, PvP, Günlük, Arcade ve Gazete modlarında bulduğun tüm geçerli kelimeler buraya eklenir.
                </Text>
              </View>

              {/* Milestone Badges Carousel */}
              <View style={styles.milestoneSection}>
                <Text style={styles.sectionTitle}>KEŞİF HEDEFLERİ & ÖDÜLLER</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.milestoneRow}>
                  {WORD_BOOK_MILESTONES.map((m) => {
                    const isClaimed = Boolean(claimedMilestones[m.count]);
                    const isReady = totalDiscovered >= m.count && !isClaimed;
                    return (
                      <View
                        key={`wb-m-${m.count}`}
                        style={[
                          styles.milestoneBox,
                          isReady && styles.milestoneBoxReady,
                          isClaimed && styles.milestoneBoxClaimed,
                        ]}
                      >
                        <Text style={styles.milestoneIcon}>{m.badgeIcon}</Text>
                        <Text style={styles.milestoneCount}>{m.count} Kelime</Text>
                        <Text style={styles.milestoneCoins}>+{m.rewardCoins} Çip</Text>
                        {isClaimed ? (
                          <View style={styles.claimedBadge}>
                            <Text style={styles.claimedBadgeText}>ALINDI ✓</Text>
                          </View>
                        ) : isReady ? (
                          <Pressable
                            onPress={() => handleClaimReward(m)}
                            style={styles.claimBtn}
                          >
                            <Text style={styles.claimBtnText}>ÖDÜLÜ AL</Text>
                          </Pressable>
                        ) : (
                          <Text style={styles.lockedMilestoneText}>
                            {totalDiscovered}/{m.count}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Search & Filter Toolbar */}
              <View style={styles.toolbar}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Kelime ara... (örn: ZAMAN)"
                  placeholderTextColor="#8A9BA8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPills}>
                  <Pressable
                    onPress={() => setFilterLength(null)}
                    style={[styles.filterPill, filterLength === null && styles.filterPillActive]}
                  >
                    <Text style={[styles.filterPillText, filterLength === null && styles.filterPillTextActive]}>
                      Tümü ({discoveredWords.length})
                    </Text>
                  </Pressable>
                  {[3, 4, 5, 6, 7].map((len) => {
                    const label = len === 7 ? "7+ Harf" : `${len} Harf`;
                    const count = discoveredWords.filter((w) => len === 7 ? w.length >= 7 : w.length === len).length;
                    return (
                      <Pressable
                        key={`len-pill-${len}`}
                        onPress={() => setFilterLength(filterLength === len ? null : len)}
                        style={[styles.filterPill, filterLength === len && styles.filterPillActive]}
                      >
                        <Text style={[styles.filterPillText, filterLength === len && styles.filterPillTextActive]}>
                          {label} ({count})
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Active Word Detail Popover */}
              {selectedWord && (
                <View style={styles.detailCard}>
                  <View style={styles.detailHeader}>
                    <Text style={styles.detailWord}>{selectedWord}</Text>
                    {currentDefinition?.type && (
                      <View style={styles.detailTypeBadge}>
                        <Text style={styles.detailTypeText}>{currentDefinition.type}</Text>
                      </View>
                    )}
                  </View>
                  {definitionLoading ? (
                    <ActivityIndicator size="small" color="#293541" style={{ marginVertical: 8 }} />
                  ) : (
                    <>
                      <Text style={styles.detailDefinition}>
                        {currentDefinition?.definition}
                      </Text>
                      {currentDefinition?.example ? (
                        <Text style={styles.detailExample}>
                          &ldquo;{currentDefinition.example}&rdquo;
                        </Text>
                      ) : null}
                    </>
                  )}
                </View>
              )}

              {/* Discovered Words List */}
              <ScrollView
                style={styles.wordsScroll}
                contentContainerStyle={styles.wordsContent}
                keyboardShouldPersistTaps="handled"
              >
                {filteredWords.length === 0 ? (
                  <View style={styles.emptyWrap}>
                    <Text style={styles.emptyIcon}>🔍</Text>
                    <Text style={styles.emptyTitle}>Kelime Bulunamadı</Text>
                    <Text style={styles.emptyDesc}>
                      {discoveredWords.length === 0
                        ? "Henüz kelime keşfetmedin. Solo ve PvP maçları yaparak kelime koleksiyonunu doldur!"
                        : "Aramana uygun kelime bulunamadı."}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.wordsGrid}>
                    {filteredWords.map((word) => {
                      const isInspected = isEqualTr(selectedWord, word);
                      return (
                        <Pressable
                          key={`word-item-${word}`}
                          onPress={() => handleInspectWord(word)}
                          style={[
                            styles.wordChip,
                            isInspected && styles.wordChipActive,
                          ]}
                        >
                          <Text style={[styles.wordChipText, isInspected && styles.wordChipTextActive]}>
                            {word}
                          </Text>
                          <View style={styles.wordLengthBadge}>
                            <Text style={styles.wordLengthText}>{word.length}</Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </ScrollView>
            </>
          ) : (
            /* 🃏 KART ALBÜMLERİ GÖRÜNÜMÜ */
            <ScrollView
              style={styles.wordsScroll}
              contentContainerStyle={{ paddingBottom: 30 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.albumsIntroCard}>
                <Text style={styles.albumsIntroTitle}>🃏 LÜGAT KOLEKSİYONCUSU</Text>
                <Text style={styles.albumsIntroText}>
                  PvP ve Solo maçlar kazandıkça nadir sözcük kartları düşer. Albüm setlerini tamamlayarak devasa çip ödüllerini topla!
                </Text>
              </View>

              {WORD_CARD_ALBUMS.map((set) => {
                const ownedSet = new Set(progress.cardAlbum?.ownedCardIds || []);
                const ownedCount = set.cards.filter((c) => ownedSet.has(c.id)).length;
                const isCompleted = ownedCount === set.cards.length;

                return (
                  <View key={set.id} style={styles.albumSetCard}>
                    <View style={styles.albumSetHeader}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={{ fontSize: 22 }}>{set.icon}</Text>
                        <View>
                          <Text style={styles.albumSetTitle}>{set.title}</Text>
                          <Text style={styles.albumSetDesc}>{set.description}</Text>
                        </View>
                      </View>
                      <View style={[styles.albumProgressPill, isCompleted && styles.albumProgressPillDone]}>
                        <Text style={[styles.albumProgressText, isCompleted && { color: "#047857" }]}>
                          {isCompleted ? "TAMAMLANDI ✓" : `${ownedCount}/${set.cards.length}`}
                        </Text>
                      </View>
                    </View>

                    {/* Cards Grid */}
                    <View style={styles.cardsGrid}>
                      {set.cards.map((card) => {
                        const isOwned = ownedSet.has(card.id);
                        return (
                          <View
                            key={card.id}
                            style={[
                              styles.cardItem,
                              !isOwned && styles.cardItemLocked,
                              card.rarity === "legendary" && styles.cardLegendary,
                              card.rarity === "epic" && styles.cardEpic,
                            ]}
                          >
                            <Text style={styles.cardStars}>{"⭐".repeat(card.stars)}</Text>
                            <Text numberOfLines={1} style={[styles.cardName, !isOwned && styles.cardNameLocked]}>
                              {isOwned ? card.name : "???"}
                            </Text>
                            <Text numberOfLines={2} style={styles.cardMeaning}>
                              {isOwned ? card.meaning : "Kilitli Kart"}
                            </Text>
                            <View style={[styles.cardRarityBadge, !isOwned && { backgroundColor: "#CBD5E1" }]}>
                              <Text style={styles.cardRarityText}>
                                {isOwned ? normalizeTrUpper(card.rarity) : "KİLİTLİ"}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>

                    {/* Set Reward Footer */}
                    <View style={styles.albumSetFooter}>
                      <Text style={styles.albumRewardLabel}>SET TAMAMLAMA ÖDÜLÜ:</Text>
                      <Text style={styles.albumRewardValue}>+{set.rewardChips} Çip 🪙</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </Pressable>
        <CoinCascadeOverlay trigger={cascadeTrigger} count={12} icon="🪙" />
      </Pressable>
    </Modal>
  );
});

WordBookModal.displayName = "WordBookModal";

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
    fontSize: 10,
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
  statsCard: {
    backgroundColor: "#F0F5ED",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: "#DCE1D7",
    marginBottom: 12,
  },
  statsTextWrap: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DCE1D7",
  },
  statsCount: {
    fontSize: 22,
    fontWeight: "900",
    color: "#293541",
  },
  statsLabel: {
    fontSize: 8,
    fontWeight: "900",
    color: "#718096",
    letterSpacing: 0.5,
  },
  statsHint: {
    flex: 1,
    fontSize: 11,
    color: "#4A5568",
    lineHeight: 16,
  },
  milestoneSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: "#718096",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  milestoneRow: {
    gap: 10,
  },
  milestoneBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    width: 110,
    borderWidth: 1,
    borderColor: "#DCE1D7",
  },
  milestoneBoxReady: {
    borderColor: "#10B981",
    backgroundColor: "#ECFDF5",
  },
  milestoneBoxClaimed: {
    opacity: 0.7,
  },
  milestoneIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  milestoneCount: {
    fontSize: 11,
    fontWeight: "900",
    color: "#293541",
  },
  milestoneCoins: {
    fontSize: 10,
    fontWeight: "800",
    color: "#D97706",
    marginTop: 2,
    marginBottom: 6,
  },
  claimBtn: {
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  claimBtnText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  claimedBadge: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  claimedBadgeText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#64748B",
  },
  lockedMilestoneText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#94A3B8",
  },
  toolbar: {
    marginBottom: 10,
    gap: 8,
  },
  searchInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DCE1D7",
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: "700",
    color: "#293541",
  },
  filterPills: {
    gap: 6,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#F0F5ED",
    borderWidth: 1,
    borderColor: "#DCE1D7",
  },
  filterPillActive: {
    backgroundColor: "#293541",
    borderColor: "#293541",
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#4A5568",
  },
  filterPillTextActive: {
    color: "#FFFFFF",
  },
  detailCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginBottom: 10,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  detailWord: {
    fontSize: 16,
    fontWeight: "900",
    color: "#92400E",
  },
  detailTypeBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  detailTypeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#B45309",
  },
  detailDefinition: {
    fontSize: 12,
    color: "#78350F",
    lineHeight: 17,
  },
  detailExample: {
    fontSize: 11,
    fontStyle: "italic",
    color: "#92400E",
    marginTop: 4,
  },
  wordsScroll: {
    maxHeight: 280,
  },
  wordsContent: {
    paddingBottom: 20,
  },
  wordsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  wordChip: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#DCE1D7",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  wordChipActive: {
    borderColor: "#B45309",
    backgroundColor: "#FFFBEB",
  },
  wordChipText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#293541",
  },
  wordChipTextActive: {
    color: "#92400E",
  },
  wordLengthBadge: {
    backgroundColor: "#F0F5ED",
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  wordLengthText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#718096",
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 30,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#293541",
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 11,
    color: "#718096",
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 16,
  },
  tabBarRow: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    padding: 3,
    marginBottom: 12,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 11,
  },
  tabItemActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabItemText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#64748B",
  },
  tabItemTextActive: {
    color: "#0F172A",
    fontWeight: "900",
  },
  albumsIntroCard: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  albumsIntroTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#1E40AF",
    marginBottom: 4,
  },
  albumsIntroText: {
    fontSize: 11,
    color: "#3B82F6",
    lineHeight: 16,
  },
  albumSetCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    padding: 14,
    marginBottom: 14,
  },
  albumSetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  albumSetTitle: {
    fontSize: 13.5,
    fontWeight: "900",
    color: "#0F172A",
  },
  albumSetDesc: {
    fontSize: 10.5,
    color: "#64748B",
    marginTop: 2,
  },
  albumProgressPill: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  albumProgressPillDone: {
    backgroundColor: "#ECFDF5",
  },
  albumProgressText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#64748B",
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  cardItem: {
    width: "31%",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    padding: 8,
    alignItems: "center",
    marginBottom: 4,
  },
  cardItemLocked: {
    opacity: 0.5,
    backgroundColor: "#F1F5F9",
    borderColor: "#E2E8F0",
  },
  cardLegendary: {
    borderColor: "#F59E0B",
    backgroundColor: "#FEF3C7",
  },
  cardEpic: {
    borderColor: "#A855F7",
    backgroundColor: "#FAF5FF",
  },
  cardStars: {
    fontSize: 9,
    marginBottom: 4,
  },
  cardName: {
    fontSize: 11,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
  },
  cardNameLocked: {
    color: "#94A3B8",
  },
  cardMeaning: {
    fontSize: 8.5,
    color: "#64748B",
    textAlign: "center",
    marginTop: 2,
    lineHeight: 11,
  },
  cardRarityBadge: {
    backgroundColor: "#0284C7",
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    marginTop: 6,
  },
  cardRarityText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  albumSetFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  albumRewardLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
  },
  albumRewardValue: {
    fontSize: 12,
    fontWeight: "900",
    color: "#D97706",
  },
});

