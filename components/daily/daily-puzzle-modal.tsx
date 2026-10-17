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

  if (!visible || !puzzleData) return null;

  const size = puzzleData.size;

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
              <View style={styles.puzzleIconRing}>
                <Text style={styles.headerIcon}>🧩</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.headerBadgeRow}>
                  <Text style={styles.headerTitle}>GÜNÜN BULMACASI</Text>
                  <View style={styles.dayBadge}>
                    <Text style={styles.dayBadgeText}>#{puzzleData.dayNumber}</Text>
                  </View>
                </View>
                <Text style={styles.headerSub}>
                  {todayDateId} • 24 Saatlik Ortak Meydan Okuma
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
              style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* If already completed or finished just now */}
          {completedResult ? (
            <ScrollView
              contentContainerStyle={styles.resultContainer}
              showsVerticalScrollIndicator={false}
              style={{ width: "100%" }}
            >
              <View style={styles.resultCard}>
                <View style={styles.trophyRing}>
                  <Text style={styles.resultTrophy}>🏆</Text>
                </View>

                <View style={styles.completedTag}>
                  <Text style={styles.completedTagText}>✦ GÜNLÜK ZAFER ✦</Text>
                </View>

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
                    <Text style={styles.statLabelHighlight}>SIRALAMA</Text>
                    <Text style={styles.statValHighlight}>
                      En Hızlı %{completedResult.percentile}
                    </Text>
                  </View>

                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>SKOR</Text>
                    <Text style={[styles.statVal, styles.statValScore]}>
                      {completedResult.score}
                    </Text>
                  </View>
                </View>

                {/* WhatsApp Emoji Preview Card */}
                <View style={styles.emojiCardBox}>
                  <View style={styles.emojiCardHeaderRow}>
                    <Text style={styles.emojiCardHeader}>Günün Kartı (WhatsApp Kartı):</Text>
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedBadgeText}>✓ ONAYLI</Text>
                    </View>
                  </View>
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
                    pressed && styles.whatsappShareBtnPressed,
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
            <ScrollView
              contentContainerStyle={styles.introScrollContent}
              showsVerticalScrollIndicator={false}
              style={{ width: "100%" }}
            >
              <View style={styles.introCard}>
                <View style={styles.introEventPill}>
                  <Text style={styles.introEventText}>✦ GÜNLÜK ORTAK ETKİNLİK ✦</Text>
                </View>

                <View style={styles.introHeroRing}>
                  <Text style={styles.introIcon}>🎯</Text>
                </View>

                <Text style={styles.introTitle}>Türkiye ile Aynı Anda Çöz!</Text>
                <Text style={styles.introDesc}>
                  Her gün 00:00&apos;da tüm Türkiye için özel hazırlanan ortak kelime bulmacası!
                  Tüm gizli kelimeleri en hızlı sürede bul, sıralamaya gir ve şehrini zirveye taşı!
                </Text>

                {/* 3-Column Spec Cards */}
                <View style={styles.specCardsRow}>
                  <View style={styles.specCard}>
                    <Text style={styles.specIcon}>📐</Text>
                    <Text style={styles.specValue}>{size}×{size}</Text>
                    <Text style={styles.specLabel}>Tahta Boyutu</Text>
                  </View>

                  <View style={styles.specCard}>
                    <Text style={styles.specIcon}>🔍</Text>
                    <Text style={styles.specValue}>{puzzleData.targetWords.length}</Text>
                    <Text style={styles.specLabel}>Hedef Kelime</Text>
                  </View>

                  <View style={[styles.specCard, styles.specCardGold]}>
                    <Text style={styles.specIcon}>🎁</Text>
                    <Text style={[styles.specValue, styles.specValueGold]}>50 + 150</Text>
                    <Text style={styles.specLabel}>Çip & Sezon XP</Text>
                  </View>
                </View>

                {/* Reset Notice */}
                <View style={styles.timerNoticeCard}>
                  <Text style={styles.timerNoticeText}>
                    ⏳ Sıradaki bulmacaya kalan: <Text style={styles.timerNoticeHighlight}>{countdownText}</Text>
                  </Text>
                </View>

                {/* Big Tactile CTA Start Button */}
                <Pressable
                  onPress={handleStartGame}
                  style={({ pressed }) => [
                    styles.startBtn,
                    pressed && styles.startBtnPressed,
                  ]}
                >
                  <Text style={styles.startBtnText}>▶ BULMACAYI BAŞLAT</Text>
                </Pressable>
              </View>
            </ScrollView>
          ) : (
            /* Active Game Play Screen */
            <View style={styles.gameContainer}>
              {/* Top HUD: Timer, Score, Progress */}
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
                      width: size * 60 + (size - 1) * 8,
                      height: size * 60 + (size - 1) * 8,
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
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitWordBtnText}>✓ KELİMEYİ ONAYLA</Text>
                  )}
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
  puzzleIconRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E0F2FE",
    borderWidth: 2,
    borderColor: "#BAE6FD",
    justifyContent: "center",
    alignItems: "center",
  },
  headerIcon: {
    fontSize: 22,
  },
  headerBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    color: "#0F172A",
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  dayBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  dayBadgeText: {
    color: "#B45309",
    fontSize: 10,
    fontWeight: "900",
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
  introScrollContent: {
    paddingBottom: 16,
    alignItems: "center",
    width: "100%",
  },
  introCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 22,
    padding: 18,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    width: "100%",
  },
  introEventPill: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginBottom: 12,
  },
  introEventText: {
    color: "#B45309",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  introHeroRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#ECFDF5",
    borderWidth: 2,
    borderColor: "#A7F3D0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  introIcon: {
    fontSize: 34,
  },
  introTitle: {
    color: "#0F172A",
    fontSize: 19,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 6,
  },
  introDesc: {
    color: "#64748B",
    fontSize: 12.5,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  specCardsRow: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
    marginBottom: 14,
  },
  specCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  specCardGold: {
    borderColor: "#FDE68A",
    backgroundColor: "#FFFBEB",
  },
  specIcon: {
    fontSize: 18,
    marginBottom: 3,
  },
  specValue: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 1,
  },
  specValueGold: {
    color: "#B45309",
  },
  specLabel: {
    color: "#64748B",
    fontSize: 9.5,
    fontWeight: "700",
    textAlign: "center",
  },
  timerNoticeCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  timerNoticeText: {
    color: "#64748B",
    fontSize: 11.5,
    fontWeight: "600",
  },
  timerNoticeHighlight: {
    color: "#0284C7",
    fontWeight: "800",
  },
  startBtn: {
    backgroundColor: "#059669",
    borderRadius: 16,
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
    borderBottomWidth: 4,
    borderBottomColor: "#047857",
  },
  startBtnPressed: {
    borderBottomWidth: 1,
    transform: [{ translateY: 3 }],
  },
  startBtnText: {
    color: "#FFFFFF",
    fontSize: 14.5,
    fontWeight: "900",
    letterSpacing: 0.6,
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
  hudTimerBox: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingVertical: 7,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  hudTimerLabel: {
    color: "#64748B",
    fontSize: 8.5,
    fontWeight: "800",
  },
  hudTimerVal: {
    color: "#0284C7",
    fontSize: 16,
    fontWeight: "900",
  },
  hudScoreBox: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingVertical: 7,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  hudScoreLabel: {
    color: "#64748B",
    fontSize: 8.5,
    fontWeight: "800",
  },
  hudScoreVal: {
    color: "#D97706",
    fontSize: 16,
    fontWeight: "900",
  },
  hudWordsBox: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingVertical: 7,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  hudWordsLabel: {
    color: "#64748B",
    fontSize: 8.5,
    fontWeight: "800",
  },
  hudWordsVal: {
    color: "#059669",
    fontSize: 16,
    fontWeight: "900",
  },
  targetWordsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
    justifyContent: "center",
  },
  targetWordPill: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  targetWordPillFound: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  targetWordPillText: {
    color: "#64748B",
    fontSize: 10.5,
    fontWeight: "800",
  },
  targetWordPillTextFound: {
    color: "#059669",
    fontWeight: "900",
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
  resultContainer: {
    paddingBottom: 20,
    alignItems: "center",
    width: "100%",
  },
  resultCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 22,
    padding: 18,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    width: "100%",
  },
  trophyRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#FEF3C7",
    borderWidth: 2,
    borderColor: "#FDE68A",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  resultTrophy: {
    fontSize: 34,
  },
  completedTag: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginBottom: 6,
  },
  completedTagText: {
    color: "#B45309",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  resultTitle: {
    color: "#0F172A",
    fontSize: 19,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 4,
  },
  resultSub: {
    color: "#64748B",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  statBoxHighlight: {
    borderColor: "#A7F3D0",
    backgroundColor: "#ECFDF5",
  },
  statLabel: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "800",
  },
  statLabelHighlight: {
    color: "#059669",
    fontSize: 9,
    fontWeight: "800",
  },
  statVal: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 2,
  },
  statValHighlight: {
    color: "#059669",
    fontSize: 12.5,
    fontWeight: "900",
    marginTop: 2,
  },
  statValScore: {
    color: "#B45309",
  },
  emojiCardBox: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  emojiCardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  emojiCardHeader: {
    color: "#64748B",
    fontSize: 10.5,
    fontWeight: "800",
  },
  verifiedBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  verifiedBadgeText: {
    color: "#059669",
    fontSize: 8.5,
    fontWeight: "900",
  },
  emojiCardText: {
    color: "#0F172A",
    fontSize: 12.5,
    lineHeight: 19,
    fontFamily: "monospace",
  },
  rewardBanner: {
    backgroundColor: "#FFFBEB",
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
  rewardSubText: {
    color: "#78350F",
    fontSize: 10,
    marginTop: 2,
  },
  whatsappShareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#25D366",
    borderRadius: 16,
    paddingVertical: 14,
    width: "100%",
    marginBottom: 12,
    borderBottomWidth: 4,
    borderBottomColor: "#1EBE5D",
  },
  whatsappShareBtnPressed: {
    borderBottomWidth: 1,
    transform: [{ translateY: 3 }],
  },
  whatsappIcon: {
    fontSize: 19,
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
    fontWeight: "600",
  },
  nextCountdownTime: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
  },
});
