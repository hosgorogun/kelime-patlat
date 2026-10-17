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
  generateDailyWordle,
  calculateDailyPercentile,
  buildDailyShareText,
  getTodayDateId,
  type DailyWordleResult,
  type DailyWordleData,
} from "@/shared/daily-wordle";
import { type PlayerProgress } from "@/shared/progression";
import { isEqualTr } from "@/shared/tr-utils";
import {
  triggerHapticSelection,
  triggerHapticSuccess,
  triggerHapticError,
  playJackpotSound,
} from "@/shared/audio-haptics";
import { gameSfx } from "@/lib/game-sfx";

type DailyPuzzleModalProps = {
  visible: boolean;
  onClose: () => void;
  progress: PlayerProgress;
  onComplete?: (result: DailyWordleResult) => Promise<void> | void;
};

export function DailyPuzzleModal({
  visible,
  onClose,
  progress,
  onComplete,
}: DailyPuzzleModalProps) {
  const todayDateId = getTodayDateId();
  const isAlreadyCompletedToday = progress.dailyWordleCompletedDate === todayDateId;

  const [puzzleData, setPuzzleData] = useState<DailyWordleData>(() => generateDailyWordle(todayDateId));
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [score, setScore] = useState(0);
  const [completedResult, setCompletedResult] = useState<DailyWordleResult | null>(() => {
    if (isAlreadyCompletedToday) {
      const initialPuzzle = generateDailyWordle(todayDateId);
      const percentile = 5;
      const shareText = buildDailyShareText(
        initialPuzzle.dayNumber,
        32,
        percentile,
        initialPuzzle.targetWords.length,
        todayDateId
      );
      return {
        success: true,
        dateId: todayDateId,
        secondsTaken: 32,
        score: 850,
        percentile,
        shareText,
        coinsEarned: 50,
        xpEarned: 150,
      };
    }
    return null;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdownText, setCountdownText] = useState("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize today's puzzle
  useEffect(() => {
    if (visible) {
      const data = generateDailyWordle(todayDateId);
      setPuzzleData(data);
      setSelectedIndices([]);
      setFoundWords([]);
      setSeconds(0);
      setScore(0);
      setIsPlaying(false);

      if (isAlreadyCompletedToday) {
        // Build mock result for display if already completed
        const percentile = 5;
        const shareText = buildDailyShareText(
          data.dayNumber,
          32,
          percentile,
          data.targetWords.length,
          todayDateId
        );
        setCompletedResult({
          success: true,
          dateId: todayDateId,
          secondsTaken: 32,
          score: 850,
          percentile,
          shareText,
          coinsEarned: 50,
          xpEarned: 150,
        });
      } else {
        setCompletedResult(null);
      }
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [visible, isAlreadyCompletedToday, todayDateId]);

  // Midnight countdown for next puzzle
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
      const diff = Math.max(0, tomorrow.getTime() - now.getTime());
      const h = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, "0");
      const m = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, "0");
      const s = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, "0");
      setCountdownText(`${h}:${m}:${s}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Timer runner when playing
  useEffect(() => {
    if (isPlaying && !completedResult) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, completedResult]);

  // Start game
  const handleStartGame = () => {
    triggerHapticSelection();
    gameSfx.powerup();
    setIsPlaying(true);
  };

  // Tile press
  const handleTilePress = (index: number) => {
    if (!isPlaying || isSubmitting || completedResult) return;

    if (selectedIndices.includes(index)) {
      // If pressing the last selected tile, deselect it
      if (selectedIndices[selectedIndices.length - 1] === index) {
        triggerHapticSelection();
        setSelectedIndices((prev) => prev.slice(0, -1));
        return;
      }
      return;
    }

    // Adjacency check
    if (selectedIndices.length > 0) {
      const lastIndex = selectedIndices[selectedIndices.length - 1]!;
      const size = puzzleData?.size || 4;
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

  // Formed word string
  const currentWord = useMemo(() => {
    if (!puzzleData || selectedIndices.length === 0) return "";
    return selectedIndices.map((idx) => puzzleData.board.board[idx]).join("");
  }, [puzzleData, selectedIndices]);

  // Check word submit
  const handleCheckWord = async () => {
    if (!puzzleData || !currentWord) return;

    const matchedTarget = puzzleData.targetWords.find(
      (tw) => isEqualTr(tw, currentWord) && !foundWords.some((fw) => isEqualTr(fw, tw))
    );

    if (matchedTarget) {
      const wordScore = matchedTarget.length * 120;
      const nextFound = [...foundWords, matchedTarget];
      setFoundWords(nextFound);
      setScore((prev) => prev + wordScore);
      setSelectedIndices([]);

      if (matchedTarget.length >= 5) {
        playJackpotSound();
      } else {
        triggerHapticSuccess();
        gameSfx.accepted(matchedTarget.length);
      }

      // Check if all words completed
      if (nextFound.length >= puzzleData.targetWords.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        const finalSeconds = Math.max(1, seconds);
        const percentile = calculateDailyPercentile(finalSeconds);
        const shareText = buildDailyShareText(
          puzzleData.dayNumber,
          finalSeconds,
          percentile,
          nextFound.length,
          todayDateId
        );

        const result: DailyWordleResult = {
          success: true,
          dateId: todayDateId,
          secondsTaken: finalSeconds,
          score: score + wordScore,
          percentile,
          shareText,
          coinsEarned: 50,
          xpEarned: 150,
        };

        setCompletedResult(result);
        setIsSubmitting(true);
        playJackpotSound();

        try {
          if (onComplete) {
            await onComplete(result);
          }
        } finally {
          setIsSubmitting(false);
        }
      }
    } else {
      triggerHapticError();
      setSelectedIndices([]);
    }
  };

  // Clear current path
  const handleClearSelection = () => {
    triggerHapticSelection();
    setSelectedIndices([]);
  };

  // WhatsApp / System Share
  const handleShare = async () => {
    if (!completedResult) return;
    triggerHapticSuccess();
    try {
      await Share.share({
        message: completedResult.shareText,
        title: "Kelime Patlat Günün Bulmacası",
      });
    } catch {
      // ignore
    }
  };

  if (!puzzleData) return null;

  const size = puzzleData.size;
  const targetWordsRemaining = puzzleData.targetWords.filter(
    (tw) => !foundWords.some((fw) => isEqualTr(fw, tw))
  );

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
              <Text style={styles.headerIcon}>🧩</Text>
              <View>
                <Text style={styles.headerTitle}>GÜNÜN BULMACASI</Text>
                <Text style={styles.headerSub}>
                  #{puzzleData.dayNumber} • {todayDateId}
                </Text>
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

          {/* If already completed or finished just now */}
          {completedResult ? (
            <ScrollView contentContainerStyle={styles.resultContainer}>
              <View style={styles.resultCard}>
                <Text style={styles.resultTrophy}>🏆</Text>
                <Text style={styles.resultTitle}>GÜNÜN BULMACASI ÇÖZÜLDÜ!</Text>
                <Text style={styles.resultSub}>
                  Bugünkü ortak bulmacayı başarıyla tamamladın!
                </Text>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>SÜRE</Text>
                    <Text style={styles.statVal}>{completedResult.secondsTaken}s</Text>
                  </View>
                  <View style={[styles.statBox, styles.statBoxHighlight]}>
                    <Text style={styles.statLabel}>SIRALAMA</Text>
                    <Text style={[styles.statVal, styles.statValHighlight]}>
                      En Hızlı %{completedResult.percentile}
                    </Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>SKOR</Text>
                    <Text style={styles.statVal}>{completedResult.score}</Text>
                  </View>
                </View>

                {/* Emoji Preview Card */}
                <View style={styles.emojiCardBox}>
                  <Text style={styles.emojiCardHeader}>Günün Kartı (WhatsApp Kartı):</Text>
                  <Text style={styles.emojiCardText}>
                    🧩 Günün Bulmacası #{puzzleData.dayNumber}{"\n"}
                    ⏱️ {completedResult.secondsTaken}s (En Hızlı %{completedResult.percentile}){"\n"}
                    🟩🟩🟩🟩{"\n"}
                    🟩🟨🟩🟩{"\n"}
                    🟩🟩🟩🟩
                  </Text>
                </View>

                {/* Reward Banner */}
                <View style={styles.rewardBanner}>
                  <Text style={styles.rewardText}>
                    🎁 Ödül: +{completedResult.coinsEarned} Çip • +{completedResult.xpEarned} XP
                  </Text>
                  <Text style={styles.rewardSubText}>
                    Ayrıca {completedResult.score} puan şehrinin lig tablosuna eklendi!
                  </Text>
                </View>

                {/* Big WhatsApp Share Button */}
                <Pressable
                  onPress={handleShare}
                  style={({ pressed }) => [
                    styles.whatsappShareBtn,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={styles.whatsappIcon}>💬</Text>
                  <Text style={styles.whatsappShareBtnText}>
                    WHATSAPP&apos;TA ARKADAŞLARINA MEYDAN OKU
                  </Text>
                </Pressable>

                {/* Next Puzzle Countdown */}
                <View style={styles.nextCountdownBox}>
                  <Text style={styles.nextCountdownLabel}>Yeni Bulmaca İçin Kalan Süre:</Text>
                  <Text style={styles.nextCountdownTime}>⏳ {countdownText}</Text>
                </View>
              </View>
            </ScrollView>
          ) : !isPlaying ? (
            /* Intro / Ready Screen */
            <View style={styles.introContainer}>
              <View style={styles.introCard}>
                <Text style={styles.introIcon}>🎯</Text>
                <Text style={styles.introTitle}>Türkiye ile Aynı Anda Çöz!</Text>
                <Text style={styles.introDesc}>
                  Her gün 00:00&apos;da tüm Türkiye için özel hazırlanan ortak kelime bulmacası!
                  Tüm gizli kelimeleri en hızlı sürede bul, sıralamaya gir ve şehrini zirveye taşı!
                </Text>

                <View style={styles.introDetails}>
                  <View style={styles.introDetailItem}>
                    <Text style={styles.introDetailIcon}>📐</Text>
                    <Text style={styles.introDetailText}>
                      Tahta Boyutu: {size}×{size}
                    </Text>
                  </View>
                  <View style={styles.introDetailItem}>
                    <Text style={styles.introDetailIcon}>🔍</Text>
                    <Text style={styles.introDetailText}>
                      Aranan Kelimeler: {puzzleData.targetWords.length} Adet
                    </Text>
                  </View>
                  <View style={styles.introDetailItem}>
                    <Text style={styles.introDetailIcon}>🎁</Text>
                    <Text style={styles.introDetailText}>
                      Ödül: 50 Çip + 150 Sezon XP
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={handleStartGame}
                  style={({ pressed }) => [
                    styles.startBtn,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={styles.startBtnText}>▶ BULMACAYI BAŞLAT</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            /* Active Game Play Screen */
            <View style={styles.gameContainer}>
              {/* Top HUD: Timer & Target Progress */}
              <View style={styles.hudRow}>
                <View style={styles.hudTimerBox}>
                  <Text style={styles.hudTimerLabel}>SÜRE</Text>
                  <Text style={styles.hudTimerVal}>
                    {String(Math.floor(seconds / 60)).padStart(2, "0")}:
                    {String(seconds % 60).padStart(2, "0")}
                  </Text>
                </View>

                <View style={styles.hudScoreBox}>
                  <Text style={styles.hudScoreLabel}>SKOR</Text>
                  <Text style={styles.hudScoreVal}>{score}</Text>
                </View>

                <View style={styles.hudWordsBox}>
                  <Text style={styles.hudWordsLabel}>KALAN</Text>
                  <Text style={styles.hudWordsVal}>
                    {foundWords.length}/{puzzleData.targetWords.length}
                  </Text>
                </View>
              </View>

              {/* Found Words Chips */}
              <View style={styles.targetWordsRow}>
                {puzzleData.targetWords.map((tw) => {
                  const isFound = foundWords.some((fw) => isEqualTr(fw, tw));
                  return (
                    <View
                      key={tw}
                      style={[styles.targetWordPill, isFound && styles.targetWordPillFound]}
                    >
                      <Text
                        style={[
                          styles.targetWordPillText,
                          isFound && styles.targetWordPillTextFound,
                        ]}
                      >
                        {isFound ? `✓ ${tw}` : `${tw.length} Harf`}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Current Active Word Bar */}
              <View style={styles.activeWordBar}>
                <Text style={styles.activeWordText}>
                  {currentWord || "Harfleri birleştirerek kelime oluştur..."}
                </Text>
              </View>

              {/* Board Grid */}
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
                  {puzzleData.board.board.map((letter: string, idx: number) => {
                    const isSelected = selectedIndices.includes(idx);
                    const selectionOrder = selectedIndices.indexOf(idx) + 1;

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
                            <Text style={styles.tileBadgeText}>{selectionOrder}</Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Action Buttons: Clear & Submit Word */}
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
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitWordBtnText}>✓ KELİMEYİ ONAYLA</Text>
                  )}
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
  introContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40,
  },
  introCard: {
    backgroundColor: "#131C31",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#223555",
    width: "100%",
    maxWidth: 360,
  },
  introIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  introTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 8,
  },
  introDesc: {
    color: "#94A3B8",
    fontSize: 12.5,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  introDetails: {
    width: "100%",
    backgroundColor: "#0B1120",
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  introDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  introDetailIcon: {
    fontSize: 14,
  },
  introDetailText: {
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "600",
  },
  startBtn: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
  },
  startBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
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
  hudTimerBox: {
    flex: 1,
    backgroundColor: "#131C31",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  hudTimerLabel: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "800",
  },
  hudTimerVal: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "900",
  },
  hudScoreBox: {
    flex: 1,
    backgroundColor: "#131C31",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  hudScoreLabel: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "800",
  },
  hudScoreVal: {
    color: "#FBBF24",
    fontSize: 16,
    fontWeight: "900",
  },
  hudWordsBox: {
    flex: 1,
    backgroundColor: "#131C31",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  hudWordsLabel: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "800",
  },
  hudWordsVal: {
    color: "#34D399",
    fontSize: 16,
    fontWeight: "900",
  },
  targetWordsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
    justifyContent: "center",
  },
  targetWordPill: {
    backgroundColor: "#1E293B",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#334155",
  },
  targetWordPillFound: {
    backgroundColor: "#065F46",
    borderColor: "#10B981",
  },
  targetWordPillText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "700",
  },
  targetWordPillTextFound: {
    color: "#FFFFFF",
    fontWeight: "900",
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
  resultContainer: {
    paddingBottom: 30,
    alignItems: "center",
  },
  resultCard: {
    backgroundColor: "#131C31",
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#223555",
    width: "100%",
  },
  resultTrophy: {
    fontSize: 48,
    marginBottom: 8,
  },
  resultTitle: {
    color: "#FBBF24",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 4,
  },
  resultSub: {
    color: "#94A3B8",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#0B1120",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  statBoxHighlight: {
    borderColor: "#10B981",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  statLabel: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "800",
  },
  statVal: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 2,
  },
  statValHighlight: {
    color: "#34D399",
    fontSize: 12,
  },
  emojiCardBox: {
    width: "100%",
    backgroundColor: "#0B1120",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#1E293B",
  },
  emojiCardHeader: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 6,
  },
  emojiCardText: {
    color: "#F8FAFC",
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "monospace",
  },
  rewardBanner: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderRadius: 10,
    padding: 10,
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  rewardText: {
    color: "#FBBF24",
    fontSize: 12,
    fontWeight: "800",
  },
  rewardSubText: {
    color: "#94A3B8",
    fontSize: 10,
    marginTop: 2,
  },
  whatsappShareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#25D366",
    borderRadius: 12,
    paddingVertical: 14,
    width: "100%",
    marginBottom: 16,
  },
  whatsappIcon: {
    fontSize: 18,
  },
  whatsappShareBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  nextCountdownBox: {
    alignItems: "center",
  },
  nextCountdownLabel: {
    color: "#64748B",
    fontSize: 10,
  },
  nextCountdownTime: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
  },
});
