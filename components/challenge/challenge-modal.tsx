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

  const size = currentChallenge?.size || 4;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerIcon}>⚔️</Text>
              <View>
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
              style={styles.closeBtn}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Mode A: Create Challenge */}
          {mode === "create" && !currentChallenge ? (
            <View style={styles.centerCardContainer}>
              <View style={styles.challengeBox}>
                <Text style={styles.boxBigIcon}>🏆</Text>
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
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  {isCreating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryBtnText}>MEYDAN OKUMA OLUŞTUR ⚡</Text>
                  )}
                </Pressable>
              </View>
            </View>
          ) : mode === "create" && currentChallenge ? (
            /* Challenge Created Preview & Share Screen */
            <View style={styles.centerCardContainer}>
              <View style={styles.challengeBox}>
                <Text style={styles.boxBigIcon}>🔥</Text>
                <Text style={styles.boxTitle}>Meydan Okuma Hazır!</Text>
                <Text style={styles.challengeCodeBadge}>KOD: {currentChallenge.id}</Text>

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
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={styles.whatsappIcon}>💬</Text>
                  <Text style={styles.whatsappBtnText}>WHATSAPP İLE GÖNDER</Text>
                </Pressable>

                <Pressable
                  onPress={onClose}
                  style={styles.secondaryBtn}
                >
                  <Text style={styles.secondaryBtnText}>TAMAM</Text>
                </Pressable>
              </View>
            </View>
          ) : result ? (
            /* Mode B: Play Challenge - Result Screen */
            <ScrollView contentContainerStyle={styles.resultScroll}>
              <View style={styles.challengeBox}>
                <Text style={styles.boxBigIcon}>{result.won ? "👑" : "🤝"}</Text>
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
                  <Text style={styles.compareVs}>VS</Text>
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
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={styles.whatsappIcon}>💬</Text>
                  <Text style={styles.whatsappBtnText}>SONUCU WHATSAPP&apos;TA PAYLAŞ</Text>
                </Pressable>

                <Pressable
                  onPress={onClose}
                  style={styles.secondaryBtn}
                >
                  <Text style={styles.secondaryBtnText}>KAPAT</Text>
                </Pressable>
              </View>
            </ScrollView>
          ) : !isPlaying ? (
            /* Mode B: Play Challenge - Ready Screen */
            <View style={styles.centerCardContainer}>
              <View style={styles.challengeBox}>
                <Text style={styles.boxBigIcon}>⚔️</Text>
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
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={styles.primaryBtnText}>MEYDAN OKUMAYI BAŞLAT ▶</Text>
                </Pressable>
              </View>
            </View>
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
                      width: size * 56 + (size - 1) * 8,
                      height: size * 56 + (size - 1) * 8,
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
                    pressed && { opacity: 0.7 },
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
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={styles.submitWordBtnText}>✓ KELİMEYİ BUL</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(3, 7, 18, 0.85)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#0B1120",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "#1E293B",
    height: "92%",
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIcon: {
    fontSize: 26,
  },
  headerTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  headerSub: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "600",
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    color: "#94A3B8",
    fontSize: 16,
    fontWeight: "bold",
  },
  centerCardContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40,
  },
  challengeBox: {
    backgroundColor: "#131C31",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#223555",
    width: "100%",
    maxWidth: 360,
  },
  boxBigIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  boxTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 6,
  },
  boxTitleWon: {
    color: "#FBBF24",
  },
  boxSub: {
    color: "#94A3B8",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 17,
    marginBottom: 16,
  },
  challengeCodeBadge: {
    backgroundColor: "#1E293B",
    color: "#38BDF8",
    fontSize: 14,
    fontWeight: "900",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 14,
    letterSpacing: 1.2,
  },
  targetPreviewCard: {
    backgroundColor: "#0B1120",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    width: "100%",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  targetPreviewTitle: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "800",
  },
  targetPreviewScore: {
    color: "#FBBF24",
    fontSize: 22,
    fontWeight: "900",
    marginVertical: 4,
  },
  targetPreviewSub: {
    color: "#94A3B8",
    fontSize: 11,
  },
  primaryBtn: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  whatsappBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#25D366",
    borderRadius: 12,
    paddingVertical: 14,
    width: "100%",
    marginBottom: 10,
  },
  whatsappIcon: {
    fontSize: 18,
  },
  whatsappBtnText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    paddingVertical: 12,
    width: "100%",
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "800",
  },
  resultScroll: {
    paddingBottom: 30,
    alignItems: "center",
  },
  compareRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
    marginBottom: 14,
  },
  compareBox: {
    flex: 1,
    backgroundColor: "#0B1120",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  compareLabel: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "800",
  },
  compareScore: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 2,
  },
  compareScoreWin: {
    color: "#34D399",
  },
  compareVs: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "900",
  },
  rewardBanner: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderRadius: 10,
    padding: 10,
    width: "100%",
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  rewardText: {
    color: "#FBBF24",
    fontSize: 12,
    fontWeight: "800",
  },
  gameContainer: {
    flex: 1,
    justifyContent: "space-between",
    paddingBottom: 20,
  },
  hudRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  hudBox: {
    flex: 1,
    backgroundColor: "#131C31",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  hudBoxUrgent: {
    borderColor: "#EF4444",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  hudLabel: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "800",
  },
  hudVal: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "900",
  },
  hudValUrgent: {
    color: "#EF4444",
  },
  hudValScore: {
    color: "#FBBF24",
  },
  activeWordBar: {
    backgroundColor: "#131C31",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#223555",
    minHeight: 44,
    justifyContent: "center",
  },
  activeWordText: {
    color: "#38BDF8",
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
    width: 56,
    height: 56,
    backgroundColor: "#1E293B",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#334155",
    justifyContent: "center",
    alignItems: "center",
  },
  tileSelected: {
    backgroundColor: "#0284C7",
    borderColor: "#38BDF8",
    transform: [{ scale: 1.05 }],
  },
  tileLetter: {
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: "900",
  },
  tileLetterSelected: {
    color: "#FFFFFF",
  },
  tileBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#FBBF24",
    width: 16,
    height: 16,
    borderRadius: 8,
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
    marginTop: 12,
  },
  clearBtn: {
    flex: 1,
    backgroundColor: "#334155",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  clearBtnDisabled: {
    opacity: 0.4,
  },
  clearBtnText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "800",
  },
  submitWordBtn: {
    flex: 2,
    backgroundColor: "#10B981",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  submitWordBtnDisabled: {
    opacity: 0.4,
  },
  submitWordBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
});
