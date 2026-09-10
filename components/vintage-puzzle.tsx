import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
  useWindowDimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  triggerHapticSelection,
  triggerHapticSuccess,
  triggerHapticError,
  triggerHapticLongWord,
  playSelectionNote,
  playSuccessSound,
  playErrorSound,
} from "@/shared/audio-haptics";
import { generatePuzzle, PuzzleResult, PlacedWord } from "@/shared/puzzle-generator";

const TR_ALPHABET = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ";
const VINTAGE_STORAGE_KEY = "@kelime_patlat:vintage_puzzle_progress";

export interface PoolTile {
  id: string;
  letter: string;
}

export type VintagePuzzleProps = {
  onBack: () => void;
  onRewardXp?: (amount: number, level: number) => void;
  vintageProgress?: {
    maxUnlockedLevel: number;
    completedLevels: number[];
    score: number;
  };
  onSaveProgress?: (progress: {
    maxUnlockedLevel: number;
    completedLevels: number[];
    score: number;
  }) => void;
  lives?: number;
  onOpenLivesModal?: () => void;
};

// Alt Performans Bileşeni: Grid Hücresi (60 FPS)
const GridCellItem = React.memo(
  ({
    row,
    col,
    char,
    isPuzzleCell,
    cellNumber,
    isCenterArea,
    isCellCompleted,
    isCenterWordPlaced,
    isSelected,
    isTargetWordCell,
    cellSize,
    onPress,
  }: {
    row: number;
    col: number;
    char: string | null;
    isPuzzleCell: boolean;
    cellNumber?: number;
    isCenterArea: boolean;
    isCellCompleted: boolean;
    isCenterWordPlaced: boolean;
    isSelected: boolean;
    isTargetWordCell: boolean;
    cellSize: number;
    onPress: (r: number, c: number) => void;
  }) => {
    if (!isPuzzleCell) {
      return (
        <View style={[styles.gridCell, { width: cellSize, height: cellSize }, styles.gridCellBlocked]}>
          <View style={styles.blockedHatch} />
        </View>
      );
    }

    return (
      <Pressable
        onPress={() => onPress(row, col)}
        style={({ pressed }) => [
          styles.gridCell,
          { width: cellSize, height: cellSize },
          isTargetWordCell && styles.gridCellTargetWord,
          isCenterArea && !char && styles.gridCellCenterArea,
          isCenterWordPlaced && isCellCompleted && styles.gridCellCenterWord,
          isCellCompleted && !isCenterWordPlaced && styles.gridCellCompleted,
          char && !isCellCompleted && styles.gridCellDraft,
          isSelected && styles.gridCellSelected,
          pressed && { opacity: 0.8 },
        ]}
      >
        {cellNumber !== undefined && (
          <Text style={[styles.cellNumberBadge, isSelected && styles.cellNumberBadgeSelected]}>
            {cellNumber}
          </Text>
        )}
        {isCenterArea && !char && cellNumber === undefined && <Text style={styles.centerStarIcon}>⭐</Text>}
        <Text
          style={[
            styles.cellCharText,
            isCellCompleted && styles.cellCharCompletedText,
            isSelected && styles.cellCharSelectedText,
          ]}
        >
          {char || ""}
        </Text>
      </Pressable>
    );
  }
);
GridCellItem.displayName = "GridCellItem";

// Sürüklenebilir Harf Taşları
const LetterTileItem = React.memo(
  ({
    tile,
    onPressTile,
  }: {
    tile: PoolTile;
    onPressTile: (tile: PoolTile) => void;
  }) => {
    return (
      <Pressable
        onPress={() => onPressTile(tile)}
        style={({ pressed }) => [styles.letterTile, pressed && styles.letterTilePressed]}
      >
        <Text style={styles.letterTileText}>{tile.letter}</Text>
      </Pressable>
    );
  }
);
LetterTileItem.displayName = "LetterTileItem";

export function VintagePuzzle({ onBack, onRewardXp, vintageProgress, onSaveProgress, lives = 5, onOpenLivesModal }: VintagePuzzleProps) {
  const { width: windowWidth } = useWindowDimensions();
  const cellSize = Math.max(26, Math.floor((windowWidth - 28) / 10));

  const [viewMode, setViewMode] = useState<"map" | "play">("map");
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState<number>(() => vintageProgress?.maxUnlockedLevel ?? 1);
  const [completedLevels, setCompletedLevels] = useState<Set<number>>(() => new Set(vintageProgress?.completedLevels ?? []));
  const [levelIndex, setLevelIndex] = useState(1);
  const [puzzle, setPuzzle] = useState<PuzzleResult | null>(null);

  // 10x10 Oyuncu Tahtası
  const [playerBoard, setPlayerBoard] = useState<(string | null)[][]>(() =>
    Array(10).fill(null).map(() => Array(10).fill(null))
  );

  // Harf Havuzu & Seçili/Çözülen Kelimeler
  const [letterPool, setLetterPool] = useState<PoolTile[]>([]);
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [solvedWordIds, setSolvedWordIds] = useState<Set<string>>(new Set());

  // Tahta üzeri yerleştirme yönü
  const [placementDirection, setPlacementDirection] = useState<"horizontal" | "vertical">("horizontal");
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);

  const [score, setScore] = useState(() => vintageProgress?.score ?? 0);
  const [isLevelComplete, setIsLevelComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const gridContainerRef = useRef<View>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Bulmaca hücre haritası ve başlangıç numaraları
  const { puzzleCellsMap, cellNumbersMap } = useMemo(() => {
    const pMap = new Map<string, { words: PlacedWord[]; isCenter: boolean }>();
    const nMap = new Map<string, number>();
    if (!puzzle) return { puzzleCellsMap: pMap, cellNumbersMap: nMap };

    let numCounter = 1;
    puzzle.words.forEach((w) => {
      const startKey = `${w.row},${w.col}`;
      if (!nMap.has(startKey)) {
        nMap.set(startKey, numCounter++);
      }
      w.cells.forEach(([r, c]) => {
        const key = `${r},${c}`;
        const existing = pMap.get(key) || { words: [], isCenter: false };
        existing.words.push(w);
        if (w.isCenter) existing.isCenter = true;
        pMap.set(key, existing);
      });
    });

    return { puzzleCellsMap: pMap, cellNumbersMap: nMap };
  }, [puzzle]);

  // Kalıcı İlerleme Yükleme (AsyncStorage + Veritabanı Prop Senkronizasyonu)
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(VINTAGE_STORAGE_KEY)
      .then((raw) => {
        if (!raw || !active) {
          if (vintageProgress) {
            setMaxUnlockedLevel(Math.min(20, Math.max(1, vintageProgress.maxUnlockedLevel)));
            setCompletedLevels(new Set(vintageProgress.completedLevels));
            setScore(vintageProgress.score);
          }
          return;
        }
        try {
          const parsed = JSON.parse(raw);
          const localMax = typeof parsed?.maxUnlockedLevel === "number" ? parsed.maxUnlockedLevel : 1;
          const localCompleted = Array.isArray(parsed?.completedLevels) ? parsed.completedLevels.filter((n: any) => typeof n === "number") : [];
          const localScore = typeof parsed?.score === "number" ? parsed.score : 0;

          const remoteMax = vintageProgress?.maxUnlockedLevel ?? 1;
          const remoteCompleted = vintageProgress?.completedLevels ?? [];
          const remoteScore = vintageProgress?.score ?? 0;

          const mergedMax = Math.min(20, Math.max(localMax, remoteMax));
          const mergedCompleted = new Set([...localCompleted, ...remoteCompleted]);
          const mergedScore = Math.max(localScore, remoteScore);

          setMaxUnlockedLevel(mergedMax);
          setCompletedLevels(mergedCompleted);
          setScore(mergedScore);
        } catch (e) {
          console.warn("[VintagePuzzle] Failed to parse progress", e);
        }
      })
      .catch((err) => {
        console.warn("[VintagePuzzle] Failed to load progress", err);
      });
    return () => {
      active = false;
    };
  }, [vintageProgress]);

  const persistProgress = useCallback((newMaxUnlocked: number, newCompleted: Set<number>, newScore: number) => {
    const payload = {
      maxUnlockedLevel: newMaxUnlocked,
      completedLevels: Array.from(newCompleted),
      score: newScore,
    };
    AsyncStorage.setItem(VINTAGE_STORAGE_KEY, JSON.stringify(payload)).catch((err) => {
      console.warn("[VintagePuzzle] Failed to save progress", err);
    });
    onSaveProgress?.(payload);
  }, [onSaveProgress]);

  // Yeni Bulmaca Yükle
  const loadNewPuzzleForLevel = useCallback((targetLevel: number) => {
    const diff = targetLevel <= 3 ? "easy" : targetLevel <= 7 ? "medium" : targetLevel <= 12 ? "hard" : "expert";
    const generated = generatePuzzle(diff);
    setPuzzle(generated);

    setPlayerBoard(Array(10).fill(null).map(() => Array(10).fill(null)));
    setSelectedWordId(generated.centerWord.id);
    setPlacementDirection(generated.centerWord.direction);

    // Bulmaca tahtasındaki benzersiz hücrelerdeki harfleri topla (kesişim çiftlerini tekilleştir)
    const uniqueChars: string[] = [];
    const seenCells = new Set<string>();

    generated.words.forEach((w) => {
      w.cells.forEach(([r, c], idx) => {
        const key = `${r},${c}`;
        if (!seenCells.has(key)) {
          seenCells.add(key);
          uniqueChars.push(w.answer[idx]!);
        }
      });
    });

    // 3 adet rastgele çeldirici harf ekle
    for (let i = 0; i < 3; i++) {
      uniqueChars.push(TR_ALPHABET[Math.floor(Math.random() * TR_ALPHABET.length)]!);
    }

    const tiles: PoolTile[] = uniqueChars.map((ch, idx) => ({
      id: `p-${targetLevel}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
      letter: ch,
    }));

    setLetterPool(tiles.sort(() => Math.random() - 0.5));
    setSolvedWordIds(new Set());
    setSelectedCell([generated.centerWord.row, generated.centerWord.col]);
    setIsLevelComplete(false);
    setErrorMessage(null);
  }, []);

  useEffect(() => {
    loadNewPuzzleForLevel(levelIndex);
  }, [levelIndex, loadNewPuzzleForLevel]);

  // Seviyeyi Sıfırla / Baştan Başla
  const handleResetLevel = useCallback(() => {
    triggerHapticSelection();
    playSelectionNote(0);
    loadNewPuzzleForLevel(levelIndex);
  }, [levelIndex, loadNewPuzzleForLevel]);

  // Hata Uyarısı
  const triggerError = useCallback(
    (msg: string) => {
      triggerHapticError();
      playErrorSound();
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

  const isCellLocked = useCallback(
    (r: number, c: number, solvedIds: Set<string>) => {
      if (!puzzle) return false;
      return puzzle.words.some((w) => {
        if (!solvedIds.has(w.id)) return false;
        if (w.direction === "horizontal") {
          return w.row === r && c >= w.col && c < w.col + w.length;
        } else {
          return w.col === c && r >= w.row && r < w.row + w.length;
        }
      });
    },
    [puzzle]
  );

  const isCellLockedByCompletedWord = useCallback(
    (r: number, c: number) => isCellLocked(r, c, solvedWordIds),
    [isCellLocked, solvedWordIds]
  );

  // Tahtadaki Kelimeleri Otomatik Kontrol Et
  const checkCompletedWordsOnBoard = useCallback(
    (currentBoard: (string | null)[][]) => {
      if (!puzzle) return;

      let newlySolvedCount = 0;
      const newSolvedIds = new Set(solvedWordIds);

      puzzle.words.forEach((w) => {
        if (newSolvedIds.has(w.id)) return;

        let isFullMatch = true;
        for (let i = 0; i < w.length; i++) {
          const r = w.direction === "horizontal" ? w.row : w.row + i;
          const c = w.direction === "horizontal" ? w.col + i : w.col;
          if (currentBoard[r]?.[c] !== w.answer[i]) {
            isFullMatch = false;
            break;
          }
        }

        if (isFullMatch) {
          newSolvedIds.add(w.id);
          newlySolvedCount++;
        }
      });

      if (newlySolvedCount > 0) {
        triggerHapticSuccess();
        playSuccessSound();
        setSolvedWordIds(newSolvedIds);
        const scoreGain = newlySolvedCount * 100;
        const nextScore = score + scoreGain;
        setScore(nextScore);

        if (newSolvedIds.size >= puzzle.words.length) {
          triggerHapticLongWord();
          setIsLevelComplete(true);
          const isFirstTime = !completedLevels.has(levelIndex);
          const baseXP = levelIndex <= 3 ? 30 : levelIndex <= 7 ? 50 : levelIndex <= 12 ? 75 : 100;
          const xpEarned = isFirstTime ? baseXP : Math.max(3, Math.floor(baseXP / 10));
          onRewardXp?.(xpEarned, levelIndex);

          const nextCompleted = new Set([...completedLevels, levelIndex]);
          const nextMax = Math.min(20, Math.max(maxUnlockedLevel, levelIndex + 1));
          setCompletedLevels(nextCompleted);
          setMaxUnlockedLevel(nextMax);

          persistProgress(nextMax, nextCompleted, nextScore);
        } else {
          // Çözülen kelimeden sonra çözülmemiş sıradaki kelimeye otomatik geç
          const nextUnsolved = puzzle.words.find((w) => !newSolvedIds.has(w.id));
          if (nextUnsolved) {
            setSelectedWordId(nextUnsolved.id);
            setPlacementDirection(nextUnsolved.direction);
            const nextEmpty = nextUnsolved.cells.find(([r, c]) => currentBoard[r]?.[c] === null);
            if (nextEmpty) {
              setSelectedCell(nextEmpty);
            }
          }
        }
      }
    },
    [puzzle, solvedWordIds, score, completedLevels, levelIndex, maxUnlockedLevel, onRewardXp, persistProgress]
  );

  // Dokunulan Harf Taşını Doğrudan Tahtadaki Uygun Hücreye Koy
  const handlePressPoolLetterToBoard = useCallback(
    (tile: PoolTile) => {
      if (!puzzle) return;

      const letter = tile.letter;
      let targetR: number | null = null;
      let targetC: number | null = null;

      // 1. Seçili hücre boş ve geçerliyse doğrudan oraya yerleştir
      if (selectedCell) {
        const [sr, sc] = selectedCell;
        const cellChar = playerBoard[sr]![sc];
        if (cellChar === null && puzzleCellsMap.has(`${sr},${sc}`)) {
          targetR = sr;
          targetC = sc;
        }
      }

      // 2. Seçili hücre doluysa veya seçili hücre yoksa aktif kelimenin ilk boş hücresini bul
      if (targetR === null || targetC === null) {
        const activeWord = puzzle.words.find((w) => w.id === selectedWordId);
        if (activeWord) {
          const firstEmpty = activeWord.cells.find(([r, c]) => playerBoard[r]?.[c] === null);
          if (firstEmpty) {
            targetR = firstEmpty[0];
            targetC = firstEmpty[1];
          }
        }
      }

      // 3. Aktif kelimede boş hücre yoksa çözülmemiş herhangi bir kelimenin ilk boş hücresini bul
      if (targetR === null || targetC === null) {
        for (const w of puzzle.words) {
          if (!solvedWordIds.has(w.id)) {
            const empty = w.cells.find(([r, c]) => playerBoard[r]?.[c] === null);
            if (empty) {
              targetR = empty[0];
              targetC = empty[1];
              setSelectedWordId(w.id);
              setPlacementDirection(w.direction);
              break;
            }
          }
        }
      }

      if (targetR === null || targetC === null) {
        triggerError("Tahtada yerleştirilecek boş kare kalmadı!");
        return;
      }

      triggerHapticSelection();
      playSelectionNote(tile.letter.charCodeAt(0) % 7);

      // Tahtaya harfi yerleştir
      const newBoard = playerBoard.map((rowArr) => [...rowArr]);
      newBoard[targetR]![targetC] = letter;
      setPlayerBoard(newBoard);

      // Havuzdan taşı çıkar
      setLetterPool((prev) => prev.filter((t) => t.id !== tile.id));

      // Otomatik olarak sıradaki BOŞ hücreye akıcı şekilde ilerle
      const targetWord = puzzle.words.find((w) => w.id === selectedWordId) || puzzleCellsMap.get(`${targetR},${targetC}`)?.words[0];
      if (targetWord) {
        const currentIdx = targetWord.cells.findIndex(([cr, cc]) => cr === targetR && cc === targetC);
        let nextEmpty: [number, number] | null = null;
        if (currentIdx !== -1) {
          for (let i = currentIdx + 1; i < targetWord.cells.length; i++) {
            const [nr, nc] = targetWord.cells[i]!;
            if (newBoard[nr]![nc] === null) {
              nextEmpty = [nr, nc];
              break;
            }
          }
        }
        if (nextEmpty) {
          setSelectedCell(nextEmpty);
        } else {
          setSelectedCell([targetR, targetC]);
        }
      }

      // Tahtadaki tamamlanan kelimeleri kontrol et
      checkCompletedWordsOnBoard(newBoard);
    },
    [puzzle, selectedCell, puzzleCellsMap, playerBoard, selectedWordId, solvedWordIds, triggerError, checkCompletedWordsOnBoard]
  );

  // Tahtadaki Harfe Dokunarak Geri Havuza Gönder & Hücre/Kelime Seç
  const handleCellPress = useCallback(
    (r: number, c: number) => {
      const cellInfo = puzzleCellsMap.get(`${r},${c}`);
      if (!cellInfo || cellInfo.words.length === 0) {
        return;
      }

      const char = playerBoard[r]![c];

      // Eğer hücrede harf varsa ve tamamlanmış kelimeye ait değilse geri havuza al
      if (char !== null) {
        if (isCellLockedByCompletedWord(r, c)) {
          triggerHapticSelection();
          playSelectionNote(3);
        } else {
          triggerHapticSelection();
          playSelectionNote(1);
          const newBoard = playerBoard.map((rowArr) => [...rowArr]);
          newBoard[r]![c] = null;
          setPlayerBoard(newBoard);
          setLetterPool((prev) => [
            ...prev,
            { id: `p-ret-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, letter: char },
          ]);
        }
      } else {
        triggerHapticSelection();
        playSelectionNote(0);
      }

      setSelectedCell([r, c]);

      // Kesişim hücresi kontrolü: Aynı hücreye tekrar basıldıysa yön değiştir
      const currentWordMatches = cellInfo.words.find((w) => w.id === selectedWordId);
      if (currentWordMatches && cellInfo.words.length > 1 && selectedCell?.[0] === r && selectedCell?.[1] === c) {
        const otherWord = cellInfo.words.find((w) => w.id !== selectedWordId);
        if (otherWord) {
          setSelectedWordId(otherWord.id);
          setPlacementDirection(otherWord.direction);
          return;
        }
      }

      if (currentWordMatches) {
        setPlacementDirection(currentWordMatches.direction);
      } else {
        const nextWord = cellInfo.words[0]!;
        setSelectedWordId(nextWord.id);
        setPlacementDirection(nextWord.direction);
      }
    },
    [puzzleCellsMap, playerBoard, isCellLockedByCompletedWord, selectedWordId, selectedCell]
  );

  const handleSelectDirection = useCallback(
    (dir: "horizontal" | "vertical") => {
      triggerHapticSelection();
      setPlacementDirection(dir);
      if (selectedCell) {
        const cellInfo = puzzleCellsMap.get(`${selectedCell[0]},${selectedCell[1]}`);
        if (cellInfo && cellInfo.words.length > 0) {
          const matchingWord = cellInfo.words.find((w) => w.direction === dir);
          if (matchingWord) {
            setSelectedWordId(matchingWord.id);
          }
        }
      }
    },
    [selectedCell, puzzleCellsMap]
  );

  const activeWordItem = useMemo(
    () => puzzle?.words.find((w) => w.id === selectedWordId),
    [puzzle, selectedWordId]
  );

  const activeTargetCellsMap = useMemo(() => {
    const set = new Set<string>();
    if (!activeWordItem) return set;
    activeWordItem.cells.forEach(([r, c]) => set.add(`${r},${c}`));
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Pressable
              onPress={() => {
                triggerHapticSelection();
                onOpenLivesModal?.();
              }}
              style={({ pressed }) => [styles.livesPill, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.livesIcon}>💚</Text>
              <Text style={styles.livesText}>{lives}/5</Text>
            </Pressable>
            <View style={styles.scorePill}>
              <Text style={styles.scoreText}>🪙 {score}</Text>
            </View>
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
                    if (lives <= 0) {
                      triggerHapticError();
                      playErrorSound();
                      onOpenLivesModal?.();
                      return;
                    }
                    triggerHapticSelection();
                    playSelectionNote(lvl % 7);
                    if (lvl === levelIndex) {
                      loadNewPuzzleForLevel(lvl);
                    } else {
                      setLevelIndex(lvl);
                    }
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
        <View style={styles.headerRightRow}>
          <Pressable
            onPress={() => {
              triggerHapticSelection();
              onOpenLivesModal?.();
            }}
            style={({ pressed }) => [styles.livesPill, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.livesIcon}>💚</Text>
            <Text style={styles.livesText}>{lives}/5</Text>
          </Pressable>
          <Pressable onPress={handleResetLevel} style={styles.resetBtn}>
            <Text style={styles.resetBtnText}>🔄 SIFIRLA</Text>
          </Pressable>
          <View style={styles.scorePill}>
            <Text style={styles.scoreText}>🪙 {score}</Text>
          </View>
        </View>
      </View>

      {/* Bulmaca Alanı - Duyarlı Kaydırılabilir Kağıt */}
      <ScrollView
        style={styles.paperBoardScroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
                    onPress={() => handleSelectDirection("horizontal")}
                    style={[styles.dirBtnMini, placementDirection === "horizontal" && styles.dirBtnActive]}
                  >
                    <Text style={[styles.dirBtnTextMini, placementDirection === "horizontal" && styles.dirBtnTextActive]}>↔ YATAY</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleSelectDirection("vertical")}
                    style={[styles.dirBtnMini, placementDirection === "vertical" && styles.dirBtnActive]}
                  >
                    <Text style={[styles.dirBtnTextMini, placementDirection === "vertical" && styles.dirBtnTextActive]}>↕ DİKEY</Text>
                  </Pressable>
                </View>
              </View>
              <Text numberOfLines={2} style={styles.activeClueText}>{`"${activeWordItem.clue}"`}</Text>
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
                    setPlacementDirection(w.direction);
                    const firstEmpty = w.cells.find(([r, c]) => playerBoard[r]?.[c] === null);
                    setSelectedCell(firstEmpty || [w.row, w.col]);
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
                  const cellInfo = puzzleCellsMap.get(`${rIdx},${cIdx}`);
                  const isPuzzleCell = !!cellInfo;
                  const cellNumber = cellNumbersMap.get(`${rIdx},${cIdx}`);
                  const isCenterArea = cellInfo?.isCenter ?? false;
                  const isCellCompleted = isCellLockedByCompletedWord(rIdx, cIdx);
                  const isCenterWordPlaced = puzzle?.centerWord ? solvedWordIds.has(puzzle.centerWord.id) : false;
                  const isTargetWordCell = activeTargetCellsMap.has(`${rIdx},${cIdx}`);

                  return (
                    <GridCellItem
                      key={cIdx}
                      row={rIdx}
                      col={cIdx}
                      char={char}
                      isPuzzleCell={isPuzzleCell}
                      cellNumber={cellNumber}
                      isCenterArea={isCenterArea}
                      isCellCompleted={isCellCompleted}
                      isCenterWordPlaced={isCenterWordPlaced}
                      isSelected={isSelected}
                      isTargetWordCell={isTargetWordCell}
                      cellSize={cellSize}
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
              letterPool.map((tile) => (
                <LetterTileItem
                  key={tile.id}
                  tile={tile}
                  onPressTile={handlePressPoolLetterToBoard}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>

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

            {levelIndex < 20 ? (
              <Pressable
                onPress={() => {
                  if (typeof lives === "number" && lives <= 0) {
                    triggerHapticError();
                    playErrorSound();
                    onOpenLivesModal?.();
                    return;
                  }
                  triggerHapticSelection();
                  playSuccessSound();
                  setIsLevelComplete(false);
                  const nextLvl = levelIndex + 1;
                  setLevelIndex(nextLvl);
                }}
                style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.nextBtnText}>SONRAKİ BÖLÜM ({levelIndex + 1}) ➔</Text>
              </Pressable>
            ) : (
              <View style={styles.completedAllBanner}>
                <Text style={styles.completedAllText}>🏆 TEBRİKLER! TÜM BÖLÜMLERİ TAMAMLADINIZ! 🏆</Text>
              </View>
            )}

            <Pressable
              onPress={() => {
                triggerHapticSelection();
                setIsLevelComplete(false);
                setViewMode("map");
              }}
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
  headerRightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  resetBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
  },
  resetBtnText: {
    color: "#E2E8F0",
    fontSize: 10.5,
    fontWeight: "800",
  },
  paperBoardScroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
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
    width: 34,
    height: 34,
    backgroundColor: "#FAF5E8",
    borderWidth: 1,
    borderColor: "#D1C4AC",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  gridCellBlocked: {
    backgroundColor: "#201815",
    borderColor: "#30241E",
  },
  blockedHatch: {
    width: "40%",
    height: "40%",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 2,
  },
  cellNumberBadge: {
    position: "absolute",
    top: 1,
    left: 2,
    fontSize: 7.5,
    fontWeight: "900",
    color: "#78695C",
  },
  cellNumberBadgeSelected: {
    color: "#0B132B",
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
  gridCellDraft: {
    backgroundColor: "#FFFFFF",
    borderColor: "#8C7A6B",
  },
  gridCellCompleted: {
    backgroundColor: "#D1FAE5",
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
  cellCharCompletedText: {
    color: "#065F46",
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
  completedAllBanner: {
    backgroundColor: "rgba(255, 194, 74, 0.15)",
    borderWidth: 1.5,
    borderColor: "#FFC24A",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  completedAllText: {
    color: "#FFC24A",
    fontSize: 11.5,
    fontWeight: "900",
    textAlign: "center",
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

  livesPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(34, 197, 94, 0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(34, 197, 94, 0.4)",
  },
  livesIcon: { fontSize: 12 },
  livesText: { color: "#22C55E", fontSize: 11, fontWeight: "900" },
});
