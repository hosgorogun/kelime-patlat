import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Share,
  ActivityIndicator,
} from "react-native";
import {
  type FriendChallengeData,
  type ChallengeResult,
  buildChallengeShareMessage,
} from "@/shared/challenge";
import { type PlayerProgress } from "@/shared/progression";
import { isEqualTr } from "@/shared/tr-utils";
import {
  triggerHapticSelection,
  triggerHapticSuccess,
  triggerHapticError,
  playJackpotSound,
} from "@/shared/audio-haptics";
import { gameSfx } from "@/lib/game-sfx";

type ChallengeModalProps = {
  visible: boolean;
  onClose: () => void;
  progress: PlayerProgress;
  mode?: "create" | "play";
  challengeData?: FriendChallengeData | null;
  onCreateChallenge?: () => Promise<FriendChallengeData | null> | FriendChallengeData | null;
  onSubmitAttempt?: (score: number, wordsFound: string[]) => Promise<ChallengeResult | null> | ChallengeResult | null;
};

export function ChallengeModal({
  visible,
  onClose,
  progress,
  mode = "create",
  challengeData,
  onCreateChallenge,
  onSubmitAttempt,
}: ChallengeModalProps) {
  const [currentChallenge, setCurrentChallenge] = useState<FriendChallengeData | null>(challengeData ?? null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [result, setResult] = useState<ChallengeResult | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      setCurrentChallenge(challengeData ?? null);
      setIsPlaying(false);
      setSelectedIndices([]);
      setFoundWords([]);
      setScore(0);
      setResult(null);
      setTimeLeft(challengeData?.timeLimit || 60);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [visible, challengeData]);

  // Create Challenge action
  const handleCreate = async () => {
    if (!onCreateChallenge || isCreating) return;
    setIsCreating(true);
    triggerHapticSelection();
    try {
      const created = await onCreateChallenge();
      if (created) {
        setCurrentChallenge(created);
        triggerHapticSuccess();
      }
    } finally {
      setIsCreating(false);
    }
  };

  // WhatsApp Share action
  const handleShareWhatsApp = async () => {
    if (!currentChallenge) return;
    triggerHapticSuccess();
    try {
      const msg = buildChallengeShareMessage(
        currentChallenge.id,
        currentChallenge.creatorName,
        currentChallenge.creatorScore,
        currentChallenge.size
      );
      await Share.share({
        message: msg,
        title: "Kelime Patlat Meydan Okuması",
      });
    } catch {
      // ignore
    }
  };

  // Start Playing Challenge
  const handleStartPlay = () => {
    if (!currentChallenge) return;
    triggerHapticSelection();
    gameSfx.powerup();
    setTimeLeft(currentChallenge.timeLimit || 60);
    setIsPlaying(true);
  };

  // Timer countdown
  useEffect(() => {
    if (isPlaying && !result) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleFinishGame(score, foundWords);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, result, score, foundWords]);

  // Finish game & submit attempt
  const handleFinishGame = async (finalScore: number, finalWords: string[]) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsSubmitting(true);

    let res: ChallengeResult | null = null;
    if (onSubmitAttempt) {
      res = await onSubmitAttempt(finalScore, finalWords);
    } else if (currentChallenge) {
      const won = finalScore > currentChallenge.creatorScore;
      const scoreDiff = finalScore - currentChallenge.creatorScore;
      res = {
        challengeId: currentChallenge.id,
        won,
        scoreDiff,
        message: won
          ? `🎉 Tebrikler! ${finalScore} puan ile ${currentChallenge.creatorName} (${currentChallenge.creatorScore} puan) skorunu geçtin!`
          : `👏 İyi mücadele! ${finalScore} puan aldın. ${currentChallenge.creatorName} (${currentChallenge.creatorScore} puan) önde bitirdi.`,
        coinsEarned: won ? 35 : 15,
        xpEarned: won ? 120 : 50,
      };
    }

    if (res?.won) {
      playJackpotSound();
    } else {
      gameSfx.rejected();
      triggerHapticError();
    }

    setResult(res);
    setIsSubmitting(false);
  };

  // Tile press
  const handleTilePress = (index: number) => {
    if (!isPlaying || isSubmitting || result || !currentChallenge) return;

    if (selectedIndices.includes(index)) {
      if (selectedIndices[selectedIndices.length - 1] === index) {
        triggerHapticSelection();
        setSelectedIndices((prev) => prev.slice(0, -1));
      }
      return;
    }

    // Adjacency check
    if (selectedIndices.length > 0) {
      const lastIndex = selectedIndices[selectedIndices.length - 1]!;
      const size = currentChallenge.size;
      const r1 = Math.floor(lastIndex / size);
      const c1 = lastIndex % size;
      const r2 = Math.floor(index / size);
      const c2 = index % size;
      const isNeighbor = Math.max(Math.abs(r1 - r2), Math.abs(c1 - c2)) === 1;

      if (!isNeighbor) {
        triggerHapticError();
        return;
      }
    }

    triggerHapticSelection();
    setSelectedIndices((prev) => [...prev, index]);
  };

  // Formed word
  const currentWord = useMemo(() => {
    if (!currentChallenge || selectedIndices.length === 0) return "";
    return selectedIndices.map((idx) => currentChallenge.board[idx]).join("");
  }, [currentChallenge, selectedIndices]);

  // Submit word
  const handleCheckWord = () => {
    if (!currentChallenge || !currentWord) return;

    const matched = currentChallenge.words.find(
      (w) => isEqualTr(w, currentWord) && !foundWords.some((fw) => isEqualTr(fw, w))
    );

    if (matched) {
      const wordScore = matched.length * 100;
      const nextFound = [...foundWords, matched];
      const nextScore = score + wordScore;
      setFoundWords(nextFound);
      setScore(nextScore);
      setSelectedIndices([]);

      if (matched.length >= 5) {
        playJackpotSound();
      } else {
        triggerHapticSuccess();
        gameSfx.accepted(matched.length);
      }

      // If all words cleared
      if (nextFound.length >= currentChallenge.words.length) {
        handleFinishGame(nextScore, nextFound);
      }
    } else {
      triggerHapticError();
      setSelectedIndices([]);
    }
  };

  const handleClearSelection = () => {
    triggerHapticSelection();
    setSelectedIndices([]);
  };

  if (!visible) return null;

  const size = currentChallenge?.size || 4;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.swordsIconRing}>
                <Text style={styles.headerIcon}>⚔️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>ARKADAŞA MEYDAN OKU</Text>
                <Text style={styles.headerSub}>Aynı Tahta • Aynı Süre • Tek Kazanan</Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Kapat"
              onPress={() => {
                triggerHapticSelection();
                onClose();
              }}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Mode A: Create Challenge */}
          {mode === "create" && !currentChallenge ? (
            <ScrollView
              contentContainerStyle={styles.centerScrollContent}
              showsVerticalScrollIndicator={false}
              style={{ width: "100%" }}
            >
              <View style={styles.challengeBox}>
                <View style={styles.heroDuelRing}>
                  <Text style={styles.boxBigIcon}>🏆</Text>
                </View>

                <View style={styles.eventPill}>
                  <Text style={styles.eventPillText}>✦ 1V1 DOSTLUK MEYDAN OKUMASI ✦</Text>
                </View>

                <Text style={styles.boxTitle}>Arkadaşına Meydan Oku!</Text>
                <Text style={styles.boxSub}>
                  Oynadığın bu tahtayı bir link ile arkadaşına gönder.
                  Bakalım senin yaptığın skoru geçebilecek mi?
                </Text>

                <Pressable
                  disabled={isCreating}
                  onPress={handleCreate}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed && styles.primaryBtnPressed,
                  ]}
                >
                  {isCreating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryBtnText}>MEYDAN OKUMA OLUŞTUR ⚡</Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          ) : mode === "create" && currentChallenge ? (
            /* Challenge Created Preview & Share Screen */
            <ScrollView
              contentContainerStyle={styles.centerScrollContent}
              showsVerticalScrollIndicator={false}
              style={{ width: "100%" }}
            >
              <View style={styles.challengeBox}>
                <View style={styles.heroDuelRing}>
                  <Text style={styles.boxBigIcon}>🔥</Text>
                </View>

                <Text style={styles.boxTitle}>Meydan Okuma Hazır!</Text>
                <View style={styles.challengeCodeBadge}>
                  <Text style={styles.challengeCodeText}>KOD: {currentChallenge.id}</Text>
                </View>

                <View style={styles.targetPreviewCard}>
                  <Text style={styles.targetPreviewTitle}>MEYDAN OKUMA DETAYI</Text>
                  <Text style={styles.targetPreviewScore}>
                    Hedef: {currentChallenge.creatorScore} Puan
                  </Text>
                  <Text style={styles.targetPreviewSub}>
                    Boyut: {currentChallenge.size}×{currentChallenge.size} • Süre: {currentChallenge.timeLimit}s
                  </Text>
                </View>

                {/* WhatsApp Share Button */}
                <Pressable
                  onPress={handleShareWhatsApp}
                  style={({ pressed }) => [
                    styles.whatsappBtn,
                    pressed && styles.whatsappBtnPressed,
                  ]}
                >
                  <Text style={styles.whatsappIcon}>💬</Text>
                  <Text style={styles.whatsappBtnText}>WHATSAPP İLE GÖNDER</Text>
                </Pressable>

                <Pressable
                  onPress={onClose}
                  style={({ pressed }) => [
                    styles.secondaryBtn,
                    pressed && styles.secondaryBtnPressed,
                  ]}
                >
                  <Text style={styles.secondaryBtnText}>TAMAM</Text>
                </Pressable>
              </View>
            </ScrollView>
          ) : result ? (
            /* Mode B: Play Challenge - Result Screen */
            <ScrollView
              contentContainerStyle={styles.resultScroll}
              showsVerticalScrollIndicator={false}
              style={{ width: "100%" }}
            >
              <View style={styles.challengeBox}>
                <View style={styles.heroDuelRing}>
                  <Text style={styles.boxBigIcon}>{result.won ? "👑" : "🤝"}</Text>
                </View>

                <Text style={[styles.boxTitle, result.won && styles.boxTitleWon]}>
                  {result.won ? "MEYDAN OKUMAYI KAZANDIN!" : "MEYDAN OKUMA TAMAMLANDI"}
                </Text>
                <Text style={styles.boxSub}>{result.message}</Text>

                {/* Score Comparison Card */}
                <View style={styles.compareRow}>
                  <View style={styles.compareBox}>
                    <Text style={styles.compareLabel}>SENİN SKORUN</Text>
                    <Text style={[styles.compareScore, result.won && styles.compareScoreWin]}>
                      {score}
                    </Text>
                  </View>
                  <View style={styles.vsBadgeRing}>
                    <Text style={styles.compareVs}>VS</Text>
                  </View>
                  <View style={styles.compareBox}>
                    <Text style={styles.compareLabel}>{currentChallenge?.creatorName ?? "RAKİP"}</Text>
                    <Text style={styles.compareScore}>
                      {currentChallenge?.creatorScore ?? 0}
                    </Text>
                  </View>
                </View>

                {/* Reward Banner */}
                <View style={styles.rewardBanner}>
                  <Text style={styles.rewardText}>
                    🎁 Kazanç: +{result.coinsEarned} Çip • +{result.xpEarned} Sezon XP
                  </Text>
                </View>

                {/* Rematch / Revenge Button */}
                <Pressable
                  onPress={handleShareWhatsApp}
                  style={({ pressed }) => [
                    styles.whatsappBtn,
                    pressed && styles.whatsappBtnPressed,
                  ]}
                >
                  <Text style={styles.whatsappIcon}>💬</Text>
                  <Text style={styles.whatsappBtnText}>SONUCU WHATSAPP&apos;TA PAYLAŞ</Text>
                </Pressable>

                <Pressable
                  onPress={onClose}
                  style={({ pressed }) => [
                    styles.secondaryBtn,
                    pressed && styles.secondaryBtnPressed,
                  ]}
                >
                  <Text style={styles.secondaryBtnText}>KAPAT</Text>
                </Pressable>
              </View>
            </ScrollView>
          ) : !isPlaying ? (
            /* Mode B: Play Challenge - Ready Screen */
            <ScrollView
              contentContainerStyle={styles.centerScrollContent}
              showsVerticalScrollIndicator={false}
              style={{ width: "100%" }}
            >
              <View style={styles.challengeBox}>
                <View style={styles.heroDuelRing}>
                  <Text style={styles.boxBigIcon}>⚔️</Text>
                </View>

                <View style={styles.eventPill}>
                  <Text style={styles.eventPillText}>✦ CANLI DÜELLO ÇAĞRISI ✦</Text>
                </View>

                <Text style={styles.boxTitle}>
                  {currentChallenge?.creatorName} Sana Meydan Okudu!
                </Text>
                <Text style={styles.boxSub}>
                  Aynı tahtada ve aynı sürede oynayarak rakibinin skorunu geçmeye çalış!
                </Text>

                <View style={styles.targetPreviewCard}>
                  <Text style={styles.targetPreviewTitle}>GEÇİLMESİ GEREKEN SKOR</Text>
                  <Text style={styles.targetPreviewScore}>
                    🎯 {currentChallenge?.creatorScore} PUAN
                  </Text>
                  <Text style={styles.targetPreviewSub}>
                    Tahta: {size}×{size} • Süre: {currentChallenge?.timeLimit} Saniye
                  </Text>
                </View>

                <Pressable
                  onPress={handleStartPlay}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed && styles.primaryBtnPressed,
                  ]}
                >
                  <Text style={styles.primaryBtnText}>MEYDAN OKUMAYI BAŞLAT ▶</Text>
                </Pressable>
              </View>
            </ScrollView>
          ) : (
            /* Mode B: Play Challenge - Active Game Screen */
            <View style={styles.gameContainer}>
              {/* Top HUD */}
              <View style={styles.hudRow}>
                <View style={[styles.hudBox, timeLeft <= 10 && styles.hudBoxUrgent]}>
                  <Text style={styles.hudLabel}>SÜRE</Text>
                  <Text style={[styles.hudVal, timeLeft <= 10 && styles.hudValUrgent]}>
                    {timeLeft}s
                  </Text>
                </View>
                <View style={styles.hudBox}>
                  <Text style={styles.hudLabel}>SKORUN</Text>
                  <Text style={[styles.hudVal, styles.hudValScore]}>{score}</Text>
                </View>
                <View style={styles.hudBox}>
                  <Text style={styles.hudLabel}>HEDEF SKOR</Text>
                  <Text style={styles.hudVal}>{currentChallenge?.creatorScore}</Text>
                </View>
              </View>

              {/* Active Word Bar */}
              <View style={styles.activeWordBar}>
                <Text style={styles.activeWordText}>
                  {currentWord || "Harfleri birleştir..."}
                </Text>
              </View>

              {/* Grid */}
              <View style={styles.gridContainer}>
                <View
                  style={[
                    styles.boardGrid,
                    {
                      width: size * 60 + (size - 1) * 8,
                      height: size * 60 + (size - 1) * 8,
                    },
                  ]}
                >
                  {currentChallenge?.board.map((letter, idx) => {
                    const isSelected = selectedIndices.includes(idx);
                    const order = selectedIndices.indexOf(idx) + 1;

                    return (
                      <Pressable
                        key={idx}
                        onPress={() => handleTilePress(idx)}
                        style={[
                          styles.tile,
                          isSelected && styles.tileSelected,
                        ]}
                      >
                        <Text style={[styles.tileLetter, isSelected && styles.tileLetterSelected]}>
                          {letter}
                        </Text>
                        {isSelected && (
                          <View style={styles.tileBadge}>
                            <Text style={styles.tileBadgeText}>{order}</Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionControls}>
                <Pressable
                  disabled={selectedIndices.length === 0}
                  onPress={handleClearSelection}
                  style={({ pressed }) => [
                    styles.clearBtn,
                    selectedIndices.length === 0 && styles.clearBtnDisabled,
                    pressed && styles.clearBtnPressed,
                  ]}
                >
                  <Text style={styles.clearBtnText}>TEMİZLE</Text>
                </Pressable>

                <Pressable
                  disabled={selectedIndices.length < 2 || isSubmitting}
                  onPress={handleCheckWord}
                  style={({ pressed }) => [
                    styles.submitWordBtn,
                    selectedIndices.length < 2 && styles.submitWordBtnDisabled,
                    pressed && styles.submitWordBtnPressed,
                  ]}
                >
                  <Text style={styles.submitWordBtnText}>✓ KELİMEYİ BUL</Text>
                </Pressable>
              </View>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "92%",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    width: "100%",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  swordsIconRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FEF3C7",
    borderWidth: 2,
    borderColor: "#FDE68A",
    justifyContent: "center",
    alignItems: "center",
  },
  headerIcon: {
    fontSize: 22,
  },
  headerTitle: {
    color: "#0F172A",
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  headerSub: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F1F5F9",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnPressed: {
    backgroundColor: "#E2E8F0",
    transform: [{ scale: 0.95 }],
  },
  closeBtnText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "900",
  },
  centerScrollContent: {
    paddingBottom: 16,
    alignItems: "center",
    width: "100%",
  },
  challengeBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 22,
    padding: 18,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    width: "100%",
  },
  heroDuelRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#FEF3C7",
    borderWidth: 2,
    borderColor: "#FDE68A",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  boxBigIcon: {
    fontSize: 34,
  },
  eventPill: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginBottom: 10,
  },
  eventPillText: {
    color: "#B45309",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  boxTitle: {
    color: "#0F172A",
    fontSize: 19,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 6,
  },
  boxTitleWon: {
    color: "#B45309",
  },
  boxSub: {
    color: "#64748B",
    fontSize: 12.5,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  challengeCodeBadge: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
  },
  challengeCodeText: {
    color: "#0284C7",
    fontSize: 13.5,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  targetPreviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    width: "100%",
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  targetPreviewTitle: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  targetPreviewScore: {
    color: "#D97706",
    fontSize: 22,
    fontWeight: "900",
    marginVertical: 3,
  },
  targetPreviewSub: {
    color: "#64748B",
    fontSize: 11.5,
    fontWeight: "600",
  },
  primaryBtn: {
    backgroundColor: "#059669",
    borderRadius: 16,
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
    borderBottomWidth: 4,
    borderBottomColor: "#047857",
  },
  primaryBtnPressed: {
    borderBottomWidth: 1,
    transform: [{ translateY: 3 }],
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  whatsappBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#25D366",
    borderRadius: 16,
    paddingVertical: 14,
    width: "100%",
    marginBottom: 10,
    borderBottomWidth: 4,
    borderBottomColor: "#1EBE5D",
  },
  whatsappBtnPressed: {
    borderBottomWidth: 1,
    transform: [{ translateY: 3 }],
  },
  whatsappIcon: {
    fontSize: 19,
  },
  whatsappBtnText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    paddingVertical: 12,
    width: "100%",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderBottomWidth: 3,
    borderBottomColor: "#CBD5E1",
  },
  secondaryBtnPressed: {
    borderBottomWidth: 1,
    transform: [{ translateY: 2 }],
  },
  secondaryBtnText: {
    color: "#475569",
    fontSize: 12.5,
    fontWeight: "800",
  },
  resultScroll: {
    paddingBottom: 20,
    alignItems: "center",
    width: "100%",
  },
  compareRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
    marginBottom: 14,
  },
  compareBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  compareLabel: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "800",
  },
  compareScore: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 2,
  },
  compareScoreWin: {
    color: "#059669",
  },
  vsBadgeRing: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F1F5F9",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  compareVs: {
    color: "#B45309",
    fontSize: 11,
    fontWeight: "900",
  },
  rewardBanner: {
    backgroundColor: "#FEF3C7",
    borderRadius: 14,
    padding: 10,
    width: "100%",
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: "#FDE68A",
  },
  rewardText: {
    color: "#B45309",
    fontSize: 12.5,
    fontWeight: "900",
  },
  gameContainer: {
    flex: 1,
    justifyContent: "space-between",
    paddingBottom: 10,
    width: "100%",
  },
  hudRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  hudBox: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingVertical: 7,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  hudBoxUrgent: {
    borderColor: "#FECDD3",
    backgroundColor: "#FFF1F2",
  },
  hudLabel: {
    color: "#64748B",
    fontSize: 8.5,
    fontWeight: "800",
  },
  hudVal: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "900",
  },
  hudValUrgent: {
    color: "#E11D48",
  },
  hudValScore: {
    color: "#D97706",
  },
  activeWordBar: {
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: "#BAE6FD",
    minHeight: 44,
    justifyContent: "center",
  },
  activeWordText: {
    color: "#0284C7",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  gridContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  boardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  tile: {
    width: 60,
    height: 60,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderBottomWidth: 3.5,
    borderBottomColor: "#94A3B8",
    justifyContent: "center",
    alignItems: "center",
  },
  tileSelected: {
    backgroundColor: "#0284C7",
    borderColor: "#38BDF8",
    borderBottomColor: "#0369A1",
    transform: [{ scale: 1.06 }],
  },
  tileLetter: {
    color: "#0F172A",
    fontSize: 23,
    fontWeight: "900",
  },
  tileLetterSelected: {
    color: "#FFFFFF",
  },
  tileBadge: {
    position: "absolute",
    top: 3,
    right: 3,
    backgroundColor: "#FBBF24",
    width: 17,
    height: 17,
    borderRadius: 8.5,
    justifyContent: "center",
    alignItems: "center",
  },
  tileBadgeText: {
    color: "#0F172A",
    fontSize: 9,
    fontWeight: "900",
  },
  actionControls: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  clearBtn: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderBottomWidth: 3.5,
    borderBottomColor: "#CBD5E1",
  },
  clearBtnPressed: {
    borderBottomWidth: 1,
    transform: [{ translateY: 2.5 }],
  },
  clearBtnDisabled: {
    opacity: 0.4,
  },
  clearBtnText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  submitWordBtn: {
    flex: 2,
    backgroundColor: "#059669",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 3.5,
    borderBottomColor: "#047857",
  },
  submitWordBtnPressed: {
    borderBottomWidth: 1,
    transform: [{ translateY: 2.5 }],
  },
  submitWordBtnDisabled: {
    opacity: 0.4,
  },
  submitWordBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
