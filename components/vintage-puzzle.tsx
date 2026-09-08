import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
  Dimensions,
  PanResponder,
} from "react-native";
import { triggerHapticSelection, triggerHapticSuccess, triggerHapticError } from "@/shared/audio-haptics";
import { generatePuzzle, checkPlacement, PuzzleResult, PlacedWord } from "@/shared/puzzle-generator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CELL_SIZE = (SCREEN_WIDTH - 20) / 10;
const TR_ALPHABET = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ";

export type VintagePuzzleProps = {
  onBack: () => void;
  onRewardXp?: (amount: number) => void;
};

// Alt Performans Bileşeni: Grid Hücresi (60 FPS)
const GridCellItem = React.memo(
  ({
    row,
    col,
    char,
    isCenterArea,
    isCenterWordPlaced,
    isSelected,
    isTargetWordCell,
    onPress,
  }: {
    row: number;
    col: number;
    char: string | null;
    isCenterArea: boolean;
    isCenterWordPlaced: boolean;
    isSelected: boolean;
    isTargetWordCell: boolean;
    onPress: (r: number, c: number) => void;
  }) => {
    return (
      <Pressable
        onPress={() => onPress(row, col)}
        style={({ pressed }) => [
          styles.gridCell,
          isTargetWordCell && styles.gridCellTargetWord,
          isCenterArea && !char && styles.gridCellCenterArea,
          isCenterWordPlaced && char && styles.gridCellCenterWord,
          char && !isCenterWordPlaced && styles.gridCellPlaced,
          isSelected && styles.gridCellSelected,
          pressed && { opacity: 0.8 },
        ]}
      >
        {isCenterArea && !char && <Text style={styles.centerStarIcon}>⭐</Text>}
        <Text style={[styles.cellCharText, isSelected && styles.cellCharSelectedText]}>
          {char || ""}
        </Text>
      </Pressable>
    );
  }
);

// Sürüklenebilir Harf Taşları
const LetterTileItem = React.memo(
  ({
    letter,
    index,
    onPressLetter,
  }: {
    letter: string;
    index: number;
    onPressLetter: (letter: string, index: number) => void;
  }) => {
    return (
      <Pressable
        onPress={() => onPressLetter(letter, index)}
        style={({ pressed }) => [styles.letterTile, pressed && styles.letterTilePressed]}
      >
        <Text style={styles.letterTileText}>{letter}</Text>
      </Pressable>
    );
  }
);

export function VintagePuzzle({ onBack, onRewardXp }: VintagePuzzleProps) {
  const [viewMode, setViewMode] = useState<"map" | "play">("map");
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState<number>(1);
  const [completedLevels, setCompletedLevels] = useState<Set<number>>(new Set());
  const [levelIndex, setLevelIndex] = useState(1);
  const [puzzle, setPuzzle] = useState<PuzzleResult | null>(null);

  // 10x10 Oyuncu Tahtası
  const [playerBoard, setPlayerBoard] = useState<(string | null)[][]>(() =>
    Array(10).fill(null).map(() => Array(10).fill(null))
  );

  // Harf Havuzu & Seçili/Çözülen Kelimeler
  const [letterPool, setLetterPool] = useState<string[]>([]);
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [solvedWordIds, setSolvedWordIds] = useState<Set<string>>(new Set());

  // Tahta üzeri yerleştirme yönü
  const [placementDirection, setPlacementDirection] = useState<"horizontal" | "vertical">("horizontal");
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);

  const [score, setScore] = useState(0);
  const [isLevelComplete, setIsLevelComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Drag (Sürükle-Bırak) Koordinatları
  const gridContainerRef = useRef<View>(null);
  const [gridPageOffset, setGridPageOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Yeni Bulmaca Yükle
  const loadNewPuzzleForLevel = useCallback((targetLevel: number) => {
    const diff = targetLevel <= 3 ? "easy" : targetLevel <= 7 ? "medium" : targetLevel <= 12 ? "hard" : "expert";
    const generated = generatePuzzle(diff);
    setPuzzle(generated);

    setPlayerBoard(Array(10).fill(null).map(() => Array(10).fill(null)));
    setSelectedWordId(generated.centerWord.id);

    // Bulmaca kelimelerinin harflerinden harf havuzu oluştur
    const allChars: string[] = [];
    generated.words.forEach((w) => allChars.push(...w.answer.split("")));
    for (let i = 0; i < 4; i++) {
      allChars.push(TR_ALPHABET[Math.floor(Math.random() * TR_ALPHABET.length)]!);
    }

    setLetterPool(allChars.sort(() => Math.random() - 0.5));
    setSolvedWordIds(new Set());
    setSelectedCell([generated.centerWord.row, generated.centerWord.col]);
    setIsLevelComplete(false);
    setErrorMessage(null);
  }, []);

  useEffect(() => {
    loadNewPuzzleForLevel(levelIndex);
  }, [levelIndex, loadNewPuzzleForLevel]);

  // Hata Uyarısı
  const triggerError = useCallback(
    (msg: string) => {
      triggerHapticError();
      setErrorMessage(msg);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
      setTimeout(() => setErrorMessage(null), 1400);
    },
    [shakeAnim]
  );

  // Dokunulan Harf Taşını Doğrudan Tahtadaki Seçili Hücreye Koy
  const handlePressPoolLetterToBoard = useCallback(
    (letter: string, poolIndex: number) => {
      if (!puzzle || !selectedCell) {
        triggerError("Harfi yerleştirmek için önce tahtadan bir hücreye dokunun!");
        return;
      }

      const [r, c] = selectedCell;
      const targetCellChar = playerBoard[r]![c];

      // Eğer hücre doluysa ve aynı kesişim harfi koyuluyorsa (Örn: 'KEDİ' ve 'ŞEKER' kesişimindeki 'K')
      if (targetCellChar !== null) {
        if (targetCellChar === letter) {
          // Ortak harf zaten orada, sadece seçimi ilerlet
          triggerHapticSelection();
          if (placementDirection === "horizontal" && c + 1 < 10) {
            setSelectedCell([r, c + 1]);
          } else if (placementDirection === "vertical" && r + 1 < 10) {
            setSelectedCell([r + 1, c]);
          }
          return;
        } else {
          triggerError("Bu hücrede farklı bir harf var!");
          return;
        }
      }

      triggerHapticSelection();

      // Tahtaya harfi yerleştir
      const newBoard = playerBoard.map((rowArr) => [...rowArr]);
      newBoard[r]![c] = letter;
      setPlayerBoard(newBoard);

      // Havuzdan harfi çıkar
      setLetterPool((prev) => prev.filter((_, idx) => idx !== poolIndex));

      // Otomatik olarak bir sonraki hücreye geç
      if (placementDirection === "horizontal" && c + 1 < 10) {
        setSelectedCell([r, c + 1]);
      } else if (placementDirection === "vertical" && r + 1 < 10) {
        setSelectedCell([r + 1, c]);
      }

      // Tahtadaki tamamlanan kelimeleri kontrol et
      checkCompletedWordsOnBoard(newBoard);
    },
    [puzzle, selectedCell, playerBoard, placementDirection, triggerError]
  );

  // Tahtadaki Kelimeleri Otomatik Kontrol Et
  const checkCompletedWordsOnBoard = (currentBoard: (string | null)[][]) => {
    if (!puzzle) return;

    let newlySolvedCount = 0;
    const newSolvedIds = new Set(solvedWordIds);

    puzzle.words.forEach((w) => {
      if (newSolvedIds.has(w.id)) return;

      // 1. Birincil (jeneratörün belirlediği) konumu kontrol et
      let isFullMatch = true;
      for (let i = 0; i < w.length; i++) {
        const r = w.direction === "horizontal" ? w.row : w.row + i;
        const c = w.direction === "horizontal" ? w.col + i : w.col;
        if (currentBoard[r]?.[c] !== w.answer[i]) {
          isFullMatch = false;
          break;
        }
      }

      // 2. Birincil eşleşmediyse, tahta üzerindeki alternatif geçerli kesişim konumlarını kontrol et
      if (!isFullMatch) {
        const len = w.length;
        const ans = w.answer;

        // Dikey tarama
        for (let r = 0; r <= 10 - len && !isFullMatch; r++) {
          for (let c = 0; c < 10 && !isFullMatch; c++) {
            let match = true;
            let intersects = false;
            for (let i = 0; i < len; i++) {
              if (currentBoard[r + i]?.[c] !== ans[i]) {
                match = false;
                break;
              }
              // En az bir kilitli veya merkez hücreyle kesişmeli
              if (lockedCellsMap.has(`${r + i},${c}`)) {
                intersects = true;
              }
            }
            if (match && (intersects || newSolvedIds.size === 0)) {
              w.row = r;
              w.col = c;
              w.direction = "vertical";
              isFullMatch = true;
            }
          }
        }

        // Yatay tarama
        for (let r = 0; r < 10 && !isFullMatch; r++) {
          for (let c = 0; c <= 10 - len && !isFullMatch; c++) {
            let match = true;
            let intersects = false;
            for (let i = 0; i < len; i++) {
              if (currentBoard[r]?.[c + i] !== ans[i]) {
                match = false;
                break;
              }
              if (lockedCellsMap.has(`${r},${c + i}`)) {
                intersects = true;
              }
            }
            if (match && (intersects || newSolvedIds.size === 0)) {
              w.row = r;
              w.col = c;
              w.direction = "horizontal";
              isFullMatch = true;
            }
          }
        }
      }

      if (isFullMatch) {
        newSolvedIds.add(w.id);
        newlySolvedCount++;
      }
    });

    if (newlySolvedCount > 0) {
      triggerHapticSuccess();
      setSolvedWordIds(newSolvedIds);
      setScore((s) => s + newlySolvedCount * 100);

      if (newSolvedIds.size >= puzzle.words.length) {
        setIsLevelComplete(true);
        const isFirstTime = !completedLevels.has(levelIndex);
        const baseXP = levelIndex <= 3 ? 30 : levelIndex <= 7 ? 50 : levelIndex <= 12 ? 75 : 100;
        const xpEarned = isFirstTime ? baseXP : Math.max(3, Math.floor(baseXP / 10));
        onRewardXp?.(xpEarned);

        setCompletedLevels((prev) => new Set([...prev, levelIndex]));
        setMaxUnlockedLevel((prev) => Math.max(prev, levelIndex + 1));
      }
    }
  };

  // Tamamlanmış kelimelerin hücrelerinin O(1) haritası (60 FPS İçin Performans Koruması)
  const lockedCellsMap = useMemo(() => {
    const set = new Set<string>();
    if (!puzzle) return set;
    puzzle.words.forEach((w) => {
      if (solvedWordIds.has(w.id)) {
        for (let i = 0; i < w.length; i++) {
          const wr = w.direction === "horizontal" ? w.row : w.row + i;
          const wc = w.direction === "horizontal" ? w.col + i : w.col;
          set.add(`${wr},${wc}`);
        }
      }
    });
    return set;
  }, [puzzle, solvedWordIds]);

  const isCellLockedByCompletedWord = useCallback(
    (r: number, c: number) => {
      return lockedCellsMap.has(`${r},${c}`);
    },
    [lockedCellsMap]
  );

  // Tahtadaki Harfe Dokunarak Geri Havuza Gönder
  const handleCellPress = useCallback(
    (r: number, c: number) => {
      const char = playerBoard[r]![c];
      if (char !== null) {
        // Eğer hücre tamamlanmış kelimeye aitse silmeye izin verme
        if (isCellLockedByCompletedWord(r, c)) {
          triggerHapticSelection();
          setSelectedCell([r, c]);
          return;
        }

        // Değilse harfi silip havuza ekle
        triggerHapticSelection();
        const newBoard = playerBoard.map((rowArr) => [...rowArr]);
        newBoard[r]![c] = null;
        setPlayerBoard(newBoard);
        setLetterPool((prev) => [...prev, char]);
      }
      setSelectedCell([r, c]);
    },
    [playerBoard, isCellLockedByCompletedWord]
  );

  const activeWordItem = useMemo(
    () => puzzle?.words.find((w) => w.id === selectedWordId),
    [puzzle, selectedWordId]
  );

  const activeTargetCellsMap = useMemo(() => {
    const set = new Set<string>();
    if (!activeWordItem) return set;
    for (let i = 0; i < activeWordItem.length; i++) {
      const wr = activeWordItem.direction === "horizontal" ? activeWordItem.row : activeWordItem.row + i;
      const wc = activeWordItem.direction === "horizontal" ? activeWordItem.col + i : activeWordItem.col;
      set.add(`${wr},${wc}`);
    }
    return set;
  }, [activeWordItem]);

  const completedCount = solvedWordIds.size;
  const totalCount = puzzle?.words.length || 0;

  // 1. SEVİYE HARİTASI EKRANI
  if (viewMode === "map") {
    return (
      <View style={styles.outerContainer}>
        {/* Üst Başlık */}
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹ ANA MENÜ</Text>
          </Pressable>
          <View style={styles.titleWrap}>
            <Text style={styles.newspaperKicker}>NOSTALJİ KELİME BULMACA</Text>
            <Text style={styles.newspaperTitle}>SEVİYE HARİTASI</Text>
          </View>
          <View style={styles.scorePill}>
            <Text style={styles.scoreText}>🪙 {score}</Text>
          </View>
        </View>

        {/* Harita Başlık Kartı */}
        <View style={styles.mapHeroCard}>
          <Text style={styles.mapHeroTitle}>🗞️ GAZETE KARE BULMACA SERİSİ</Text>
          <Text style={styles.mapHeroSubtitle}>
            Zorluğu kademeli olarak artan 20 özel bulmaca seviyesi. Kilitleri açmak için bulmacaları çöz!
          </Text>
          <View style={styles.mapStatsRow}>
            <View style={styles.mapStatItem}>
              <Text style={styles.mapStatValue}>{maxUnlockedLevel}/20</Text>
              <Text style={styles.mapStatLabel}>KİLİT AÇIK</Text>
            </View>
            <View style={styles.mapStatItem}>
              <Text style={styles.mapStatValue}>{completedLevels.size}</Text>
              <Text style={styles.mapStatLabel}>TAMAMLANDI</Text>
            </View>
            <View style={styles.mapStatItem}>
              <Text style={styles.mapStatValue}>⭐ {completedLevels.size * 3}</Text>
              <Text style={styles.mapStatLabel}>TOPLAM YILDIZ</Text>
            </View>
          </View>
        </View>

        {/* Seviye Kartları Izgarası */}
        <ScrollView contentContainerStyle={styles.levelMapGridContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.mapGridRow}>
            {Array.from({ length: 20 }, (_, i) => i + 1).map((lvl) => {
              const isCompleted = completedLevels.has(lvl);
              const isUnlocked = lvl <= maxUnlockedLevel;
              const diffTag = lvl <= 3 ? "KOLAY" : lvl <= 7 ? "ORTA" : lvl <= 12 ? "ZOR" : "UZMAN";
              const diffColor = lvl <= 3 ? "#10B981" : lvl <= 7 ? "#F59E0B" : lvl <= 12 ? "#F97316" : "#EF4444";

              return (
                <Pressable
                  key={lvl}
                  disabled={!isUnlocked}
                  onPress={() => {
                    triggerHapticSelection();
                    setLevelIndex(lvl);
                    loadNewPuzzleForLevel(lvl);
                    setViewMode("play");
                  }}
                  style={({ pressed }) => [
                    styles.levelCardNode,
                    isCompleted && styles.levelCardCompleted,
                    !isUnlocked && styles.levelCardLocked,
                    pressed && isUnlocked && { opacity: 0.8, transform: [{ scale: 0.96 }] },
                  ]}
                >
                  <View style={styles.levelCardTop}>
                    <Text style={[styles.levelDiffBadge, { backgroundColor: diffColor }]}>{diffTag}</Text>
                    {isCompleted ? (
                      <Text style={styles.completedStarText}>⭐⭐⭐</Text>
                    ) : !isUnlocked ? (
                      <Text style={styles.lockIconText}>🔒</Text>
                    ) : (
                      <Text style={styles.unlockedBadgeText}>AÇIK</Text>
                    )}
                  </View>

                  <Text style={[styles.levelNumberText, !isUnlocked && styles.levelNumberLockedText]}>
                    BÖLÜM {lvl}
                  </Text>

                  <Text style={[styles.levelCardFooterText, isCompleted && { color: "#059669" }]}>
                    {isCompleted ? "✓ TAMAMLANDI" : isUnlocked ? "OYNA ➔" : "KİLİTLİ"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  }

  // 2. BULMACA OYNANIŞ EKRANI
  return (
    <View style={styles.outerContainer}>
      {/* Üst Başlık */}
      <View style={styles.header}>
        <Pressable onPress={() => setViewMode("map")} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ HARİTA</Text>
        </Pressable>
        <View style={styles.titleWrap}>
          <Text style={styles.newspaperKicker}>10×10 KELİME BULMACA</Text>
          <Text style={styles.newspaperTitle}>{levelIndex}. BÖLÜM</Text>
        </View>
        <View style={styles.scorePill}>
          <Text style={styles.scoreText}>🪙 {score}</Text>
        </View>
      </View>

      {/* Bulmaca Alanı - Tek Sabit Ekran (Scroll Yok) */}
      <View style={styles.paperBoard}>
        <View style={styles.paperTextureOverlay} />

        {errorMessage && (
          <Animated.View style={[styles.errorBanner, { transform: [{ translateX: shakeAnim }] }]}>
            <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
          </Animated.View>
        )}

        {/* Aktif Seçili İpucu Kartı (Sabit Yükseklikte Temiz Görünüm) */}
        {activeWordItem ? (
          <View style={styles.activeClueBannerCard}>
            <View style={styles.activeClueBadgeRow}>
              <Text style={styles.activeClueBadgeTag}>
                {activeWordItem.isCenter ? "⭐ ANKOR: MERKEZ KELİME" : `İPUCU (${completedCount}/${totalCount})`}
              </Text>
              <Text style={styles.activeClueLengthText}>{activeWordItem.length} HARF • [{activeWordItem.category}]</Text>
              <View style={styles.dirRowCompactInline}>
                <Pressable
                  onPress={() => setPlacementDirection("horizontal")}
                  style={[styles.dirBtnMini, placementDirection === "horizontal" && styles.dirBtnActive]}
                >
                  <Text style={[styles.dirBtnTextMini, placementDirection === "horizontal" && styles.dirBtnTextActive]}>↔ YATAY</Text>
                </Pressable>
                <Pressable
                  onPress={() => setPlacementDirection("vertical")}
                  style={[styles.dirBtnMini, placementDirection === "vertical" && styles.dirBtnActive]}
                >
                  <Text style={[styles.dirBtnTextMini, placementDirection === "vertical" && styles.dirBtnTextActive]}>↕ DİKEY</Text>
                </Pressable>
              </View>
            </View>
            <Text numberOfLines={2} style={styles.activeClueText}>"{activeWordItem.clue}"</Text>
          </View>
        ) : (
          <View style={styles.activeClueBannerCardEmpty}>
            <Text style={styles.emptyClueText}>İpuçlarından birine veya tahtadan bir hücreye dokunun.</Text>
          </View>
        )}

        {/* Yatay İpucu Çubuğu */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalTargetList}>
          {puzzle?.words.map((w) => {
            const isSolved = solvedWordIds.has(w.id);
            const isSelected = selectedWordId === w.id;

            return (
              <Pressable
                key={w.id}
                onPress={() => {
                  triggerHapticSelection();
                  setSelectedWordId(w.id);
                  setSelectedCell([w.row, w.col]);
                  setPlacementDirection(w.direction);
                }}
                style={[
                  styles.targetChipHorizontal,
                  w.isCenter && styles.targetChipCenterWord,
                  isSolved && styles.targetChipCompleted,
                  isSelected && styles.targetChipSelected,
                ]}
              >
                <Text style={[styles.targetWordText, isSolved && styles.targetWordTextCompleted]}>
                  {w.isCenter ? `⭐ ` : ""}{isSolved ? `✓ ${w.answer}` : `❓ ${w.length}H [${w.category}]`}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* 10×10 OYUN TAHTASI */}
        <View ref={gridContainerRef} style={styles.gridContainer}>
          {playerBoard.map((row, rIdx) => (
            <View key={rIdx} style={styles.gridRow}>
              {row.map((char, cIdx) => {
                const isSelected = selectedCell?.[0] === rIdx && selectedCell?.[1] === cIdx;
                const isCenterArea = rIdx === 4 && cIdx >= 3 && cIdx <= 6;
                const isCenterWordPlaced = puzzle?.centerWord ? solvedWordIds.has(puzzle.centerWord.id) : false;
                const isTargetWordCell = activeTargetCellsMap.has(`${rIdx},${cIdx}`);

                return (
                  <GridCellItem
                    key={cIdx}
                    row={rIdx}
                    col={cIdx}
                    char={char}
                    isCenterArea={isCenterArea}
                    isCenterWordPlaced={isCenterWordPlaced}
                    isSelected={isSelected}
                    isTargetWordCell={isTargetWordCell}
                    onPress={handleCellPress}
                  />
                );
              })}
            </View>
          ))}
        </View>

        {/* HARF TAŞLARI HAVUZU */}
        <Text style={styles.sectionLabelCompact}>HARF TAŞLARI (DOKUN TAHTAYA KOY):</Text>
        <View style={styles.letterPoolContainer}>
          {letterPool.length === 0 ? (
            <Text style={styles.emptyPoolText}>Tüm harfler yerleştirildi.</Text>
          ) : (
            letterPool.map((letter, idx) => (
              <LetterTileItem
                key={idx}
                letter={letter}
                index={idx}
                onPressLetter={handlePressPoolLetterToBoard}
              />
            ))
          )}
        </View>
      </View>

      {/* Seviye Başarı Modalı */}
      {isLevelComplete && (
        <View style={styles.winOverlay}>
          <View style={styles.winCard}>
            <Text style={{ fontSize: 44 }}>🎉🗞️</Text>
            <Text style={styles.winTitle}>BÖLÜM {levelIndex} TAMAMLANDI!</Text>
            <Text style={styles.winDesc}>
              Tüm kesişen gizli kelimeleri 10×10 tahtaya başarıyla yerleştirdin!
            </Text>
            <Text style={styles.winReward}>
              +{levelIndex <= 3 ? 30 : levelIndex <= 7 ? 50 : levelIndex <= 12 ? 75 : 100} XP KAZANILDI
            </Text>

            <Pressable
              onPress={() => {
                const nextLvl = levelIndex + 1;
                setLevelIndex(nextLvl);
                loadNewPuzzleForLevel(nextLvl);
              }}
              style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.nextBtnText}>SONRAKİ BÖLÜM ({levelIndex + 1}) ➔</Text>
            </Pressable>

            <Pressable
              onPress={() => setViewMode("map")}
              style={({ pressed }) => [styles.mapReturnBtn, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.mapReturnBtnText}>SEVİYE HARİTASI 🗞️</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: "#0C091C",
    paddingTop: 4,
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  backBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  backBtnText: {
    color: "#00F5D4",
    fontSize: 12,
    fontWeight: "900",
  },
  titleWrap: {
    alignItems: "center",
  },
  newspaperKicker: {
    color: "#FFC24A",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },
  newspaperTitle: {
    color: "#FFF",
    fontSize: 13.5,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  scorePill: {
    backgroundColor: "rgba(255, 194, 74, 0.15)",
    borderWidth: 1,
    borderColor: "#FFC24A",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    color: "#FFC24A",
    fontSize: 12,
    fontWeight: "900",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  paperBoard: {
    flex: 1,
    backgroundColor: "#F4EBD9",
    borderRadius: 0,
    borderWidth: 0,
    borderTopWidth: 2,
    borderColor: "#3D302B",
    padding: 10,
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  paperTextureOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "transparent",
    opacity: 0.04,
    borderWidth: 1,
    borderColor: "#000",
  },
  errorBanner: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1.5,
    borderColor: "#EF4444",
    padding: 6,
    borderRadius: 10,
    marginBottom: 6,
  },
  errorText: {
    color: "#991B1B",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },
  centerWordBannerCard: {
    backgroundColor: "#FEF3C7",
    borderWidth: 2,
    borderColor: "#F59E0B",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  centerBadgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  centerBadgeTag: {
    backgroundColor: "#F59E0B",
    color: "#FFF",
    fontSize: 9.5,
    fontWeight: "900",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  centerLengthText: {
    color: "#B45309",
    fontSize: 9.5,
    fontWeight: "900",
  },
  centerClueText: {
    color: "#1E1B18",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 4,
  },
  centerHelperText: {
    color: "#78350F",
    fontSize: 8.5,
    fontStyle: "italic",
  },
  activeClueBannerCard: {
    backgroundColor: "#FEF3C7",
    borderWidth: 1.5,
    borderColor: "#F59E0B",
    borderRadius: 10,
    padding: 8,
    marginBottom: 6,
    minHeight: 52,
  },
  activeClueBannerCardEmpty: {
    backgroundColor: "#E8DEC9",
    borderWidth: 1,
    borderColor: "#6B5A54",
    borderRadius: 10,
    padding: 8,
    marginBottom: 6,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 52,
  },
  emptyClueText: {
    color: "#6B5A54",
    fontSize: 10,
    fontWeight: "800",
    fontStyle: "italic",
  },
  activeClueBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  activeClueBadgeTag: {
    backgroundColor: "#F59E0B",
    color: "#FFF",
    fontSize: 8.5,
    fontWeight: "900",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  activeClueLengthText: {
    color: "#B45309",
    fontSize: 8.5,
    fontWeight: "900",
  },
  activeClueText: {
    color: "#1E1B18",
    fontSize: 11,
    fontWeight: "800",
  },
  dirRowCompactInline: {
    flexDirection: "row",
    gap: 4,
    marginLeft: "auto",
  },
  dirBtnMini: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#6B5A54",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dirBtnActive: {
    backgroundColor: "#3D302B",
    borderColor: "#3D302B",
  },
  dirBtnTextMini: {
    color: "#3D302B",
    fontSize: 8.5,
    fontWeight: "800",
  },
  dirBtnTextActive: {
    color: "#FFF",
  },
  sectionLabelCompact: {
    color: "#4A3E3D",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginVertical: 2,
  },
  horizontalTargetList: {
    maxHeight: 36,
    marginBottom: 6,
  },
  targetChipHorizontal: {
    backgroundColor: "#E8DEC9",
    borderWidth: 1.5,
    borderColor: "#6B5A54",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    justifyContent: "center",
  },
  targetChip: {
    width: "48.5%",
    backgroundColor: "#E8DEC9",
    borderWidth: 1.5,
    borderColor: "#6B5A54",
    borderRadius: 8,
    padding: 6,
  },
  targetChipCenterWord: {
    backgroundColor: "#FEF3C7",
    borderColor: "#F59E0B",
  },
  targetChipSelected: {
    borderColor: "#00F5D4",
    borderWidth: 2,
    backgroundColor: "#E0F2FE",
  },
  targetChipCompleted: {
    backgroundColor: "#D1FAE5",
    borderColor: "#059669",
  },
  targetWordText: {
    color: "#2C221E",
    fontSize: 11,
    fontWeight: "900",
  },
  targetWordTextCompleted: {
    color: "#047857",
  },
  targetHintText: {
    color: "#6B5A54",
    fontSize: 9,
    marginTop: 2,
  },
  gridContainer: {
    alignSelf: "center",
    backgroundColor: "#3D302B",
    padding: 2,
    borderRadius: 8,
    marginBottom: 8,
  },
  gridRow: {
    flexDirection: "row",
  },
  gridCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    backgroundColor: "#FAF5E8",
    borderWidth: 1,
    borderColor: "#D1C4AC",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  gridCellCenterArea: {
    backgroundColor: "#FEF3C7",
    borderColor: "#F59E0B",
  },
  gridCellCenterWord: {
    backgroundColor: "#FDE68A",
    borderColor: "#D97706",
  },
  gridCellPlaced: {
    backgroundColor: "#A7F3D0",
    borderColor: "#059669",
  },
  gridCellTargetWord: {
    backgroundColor: "#FFFBEB",
    borderColor: "#F59E0B",
    borderWidth: 2,
  },
  gridCellSelected: {
    borderColor: "#00F5D4",
    borderWidth: 2.5,
    backgroundColor: "#00F5D4",
  },
  centerStarIcon: {
    fontSize: 10,
    position: "absolute",
    opacity: 0.6,
  },
  cellCharText: {
    color: "#1E1B18",
    fontSize: 13,
    fontWeight: "900",
  },
  cellCharSelectedText: {
    color: "#0B132B",
  },
  letterPoolContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.04)",
    borderRadius: 10,
  },
  emptyPoolText: {
    color: "#6B5A54",
    fontSize: 11,
    fontStyle: "italic",
  },
  letterTile: {
    width: 36,
    height: 36,
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#3D302B",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 2,
  },
  letterTilePressed: {
    transform: [{ scale: 0.92 }],
    backgroundColor: "#FEF3C7",
  },
  letterTileText: {
    color: "#1E1B18",
    fontSize: 15,
    fontWeight: "900",
  },
  winOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    zIndex: 999,
  },
  winCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#16102B",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#00F5D4",
    padding: 24,
    alignItems: "center",
  },
  winTitle: {
    color: "#00F5D4",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 6,
  },
  winDesc: {
    color: "#A49BBF",
    fontSize: 11.5,
    textAlign: "center",
    lineHeight: 17,
    marginBottom: 16,
  },
  winReward: {
    color: "#FFC24A",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 20,
  },
  nextBtn: {
    backgroundColor: "#00F5D4",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  nextBtnText: {
    color: "#0B132B",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  mapReturnBtn: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: "100%",
    alignItems: "center",
  },
  mapReturnBtnText: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "800",
  },

  // SEVİYE HARİTASI STİLLERİ
  mapHeroCard: {
    backgroundColor: "#16102B",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#FFC24A",
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 14,
  },
  mapHeroTitle: {
    color: "#FFC24A",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  mapHeroSubtitle: {
    color: "#94A3B8",
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 12,
  },
  mapStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 10,
    padding: 10,
  },
  mapStatItem: {
    alignItems: "center",
    flex: 1,
  },
  mapStatValue: {
    color: "#00F5D4",
    fontSize: 15,
    fontWeight: "900",
  },
  mapStatLabel: {
    color: "#64748B",
    fontSize: 9.5,
    fontWeight: "800",
    marginTop: 2,
  },
  levelMapGridContainer: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  mapGridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  levelCardNode: {
    width: "48%",
    backgroundColor: "#1E1838",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#332A59",
    padding: 12,
    minHeight: 90,
    justifyContent: "space-between",
  },
  levelCardCompleted: {
    borderColor: "#059669",
    backgroundColor: "#064E3B",
  },
  levelCardLocked: {
    opacity: 0.45,
    borderColor: "#1E1B2E",
    backgroundColor: "#0F0B1E",
  },
  levelCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  levelDiffBadge: {
    color: "#FFF",
    fontSize: 8.5,
    fontWeight: "900",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  completedStarText: {
    fontSize: 9,
  },
  lockIconText: {
    fontSize: 11,
  },
  unlockedBadgeText: {
    color: "#00F5D4",
    fontSize: 9,
    fontWeight: "800",
  },
  levelNumberText: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "900",
    marginVertical: 4,
  },
  levelNumberLockedText: {
    color: "#64748B",
  },
  levelCardFooterText: {
    color: "#00F5D4",
    fontSize: 10,
    fontWeight: "800",
  },
});
