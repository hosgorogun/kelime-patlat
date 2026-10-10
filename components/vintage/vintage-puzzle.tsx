import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Animated,
  BackHandler,
  Pressable,
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
  getSfxEnabled,
  setSfxEnabled,
  getHapticsEnabled,
  setHapticsEnabled,
} from "@/shared/audio-haptics";
import { generatePuzzle, PuzzleResult, PlacedWord } from "@/shared/puzzle-generator";
import { MAX_LIVES } from "@/shared/progression";
import { isEqualTr } from "@/shared/tr-utils";
import { gameSfx } from "@/lib/game-sfx";
import { vintageStyles as styles } from "./vintage.styles";
import { VintageMapView } from "./vintage-map-view";
import { VintagePlayHeader } from "./vintage-play-header";
import { VintageClueBanner } from "./vintage-clue-banner";
import { VintageBoardGrid } from "./vintage-board-grid";
import { LetterTileItem, PoolTile } from "./vintage-letter-tile";
import {
  VintageVictoryModal,
  VintageExitModal,
  VintageResetModal,
} from "./vintage-dialogs";
import { GameCountdownOverlay } from "../game/game-countdown-overlay";
import {
  TR_ALPHABET,
  VINTAGE_STORAGE_KEY,
  VINTAGE_HINT_COST,
} from "./vintage-constants";

export type VintagePuzzleProps = {
  onBack: () => void;
  onRewardXp?: (amount: number, level: number, wordsCount?: number, foundWords?: string[]) => void;
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
  isInfiniteLives?: boolean;
  onOpenLivesModal?: () => void;
  coins?: number;
  onSpendCoins?: (amount: number) => boolean;
  selectedVictoryEffect?: string;
};


export function VintagePuzzle({
  onBack,
  onRewardXp,
  vintageProgress,
  onSaveProgress,
  lives = MAX_LIVES,
  isInfiniteLives = false,
  onOpenLivesModal,
  coins,
  onSpendCoins,
  selectedVictoryEffect,
}: VintagePuzzleProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  // The screen is capped at 560px; window width is not the board's usable width.
  // Reserve the paper's 20px and the grid's 4px horizontal padding.
  const cellSize = Math.max(1, Math.floor((containerWidth - 24) / 10));
  const measureContainer = useCallback((event: import("react-native").LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  }, []);

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
  const [boardSwapCount, setBoardSwapCount] = useState(1);
  const [isLevelComplete, setIsLevelComplete] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [soundOn, setSoundOn] = useState(() => getSfxEnabled());
  const [hapticsOn, setHapticsOn] = useState(() => getHapticsEnabled());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Countdown overlay effect for smooth level entry
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      const timer = setTimeout(() => {
        setCountdown(null);
      }, 700);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      setCountdown((prev) => {
        if (prev === null) return null;
        if (prev === 1) {
          gameSfx.accepted();
          triggerHapticSuccess();
          return 0;
        }
        if (prev > 1) {
          gameSfx.tap();
          triggerHapticSelection();
          return prev - 1;
        }
        return null;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const [showExitModal, setShowExitModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [pendingExitDestination, setPendingExitDestination] = useState<"map" | "app">("map");

  const handlePlayBackPress = useCallback(() => {
    triggerHapticSelection();
    if (!isLevelComplete) {
      setPendingExitDestination("map");
      setShowExitModal(true);
    } else {
      setViewMode("map");
    }
  }, [isLevelComplete]);

  useEffect(() => {
    const onBackPress = () => {
      if (showResetModal) {
        setShowResetModal(false);
        return true;
      }
      if (showExitModal) {
        setShowExitModal(false);
        return true;
      }
      if (viewMode === "play") {
        if (!isLevelComplete) {
          setPendingExitDestination("map");
          setShowExitModal(true);
        } else {
          setViewMode("map");
        }
        return true;
      }
      onBack();
      return true;
    };

    const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => sub.remove();
  }, [showResetModal, showExitModal, viewMode, isLevelComplete, onBack]);

  const gridContainerRef = useRef<View>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const solvedPulseAnim = useRef(new Animated.Value(1)).current;
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearErrorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isClearingErrorRef = useRef(false);
  const [errorCells, setErrorCells] = useState<Set<string>>(new Set());

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      if (clearErrorTimeoutRef.current) clearTimeout(clearErrorTimeoutRef.current);
    };
  }, []);

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

  useEffect(() => {
    if (vintageProgress) {
      setMaxUnlockedLevel((prev) => Math.min(20, Math.max(prev, vintageProgress.maxUnlockedLevel ?? 1)));
      setCompletedLevels((prev) => new Set([...Array.from(prev), ...(vintageProgress.completedLevels ?? [])]));
      setScore((prev) => Math.max(prev, vintageProgress.score ?? 0));
    }
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
    const diff = targetLevel <= 5 ? "easy" : targetLevel <= 10 ? "medium" : targetLevel <= 15 ? "hard" : "ultra";
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
    setShowVictoryModal(false);
    setErrorMessage(null);
    if (clearErrorTimeoutRef.current) {
      clearTimeout(clearErrorTimeoutRef.current);
      clearErrorTimeoutRef.current = null;
    }
    isClearingErrorRef.current = false;
    setErrorCells(new Set());
  }, []);

  useEffect(() => {
    setBoardSwapCount(1);
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
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = setTimeout(() => setErrorMessage(null), 1400);
    },
    [shakeAnim]
  );

  // Seviyeyi Sıfırla / Baştan Başla (Seviye başına 1 tahta değiştirme hakkı)
  const handleResetLevel = useCallback(() => {
    triggerHapticSelection();
    playSelectionNote(0);
    const hasPlacedTiles = playerBoard.some((row) => row.some((cell) => cell !== null));
    if (hasPlacedTiles || solvedWordIds.size > 0) {
      setShowResetModal(true);
    } else {
      if (boardSwapCount <= 0) {
        triggerError("Bu bölümde tahta değiştirme hakkınızı kullandınız! (Maks: 1)");
        return;
      }
      setBoardSwapCount((prev) => Math.max(0, prev - 1));
      loadNewPuzzleForLevel(levelIndex);
    }
  }, [levelIndex, loadNewPuzzleForLevel, playerBoard, solvedWordIds, boardSwapCount, triggerError]);

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
          const cellChar = currentBoard[r]?.[c];
          if (!cellChar || !isEqualTr(cellChar, w.answer[i])) {
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

          // Tahtaya şık yeşil patlama/darbe (pulse) animasyonu uygula
          Animated.sequence([
            Animated.timing(solvedPulseAnim, { toValue: 1.05, duration: 180, useNativeDriver: true }),
            Animated.timing(solvedPulseAnim, { toValue: 0.98, duration: 120, useNativeDriver: true }),
            Animated.timing(solvedPulseAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
          ]).start();

          // Kelime tamamlandığında yeşil bildirim toast'ı göster
          const justSolvedWord = puzzle.words.find((w) => newSolvedIds.has(w.id) && !solvedWordIds.has(w.id));
          if (justSolvedWord) {
            setErrorMessage(`✓ TEBRİKLER! "${justSolvedWord.answer}" KELİMESİ ÇÖZÜLDÜ! 🎉`);
            if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
            errorTimeoutRef.current = setTimeout(() => setErrorMessage(null), 1800);
          }

          if (newSolvedIds.size >= puzzle.words.length) {
            triggerHapticLongWord();
            gameSfx.victory();
            setIsLevelComplete(true);
            setShowVictoryModal(true);
            const isFirstTime = !completedLevels.has(levelIndex);
            const baseXP = levelIndex <= 3 ? 30 : levelIndex <= 7 ? 50 : levelIndex <= 12 ? 75 : 100;
            const xpEarned = isFirstTime ? baseXP : Math.max(3, Math.floor(baseXP / 10));
            onRewardXp?.(xpEarned, levelIndex, puzzle.words.length, puzzle.words.map((w) => w.answer));

            const nextCompleted = new Set([...completedLevels, levelIndex]);
            const nextMax = Math.min(20, Math.max(maxUnlockedLevel, levelIndex + 1));
            setCompletedLevels(nextCompleted);
            setMaxUnlockedLevel(nextMax);

            persistProgress(nextMax, nextCompleted, nextScore);
            return;
          } else {
            // Çözülen kelimeden sonra çözülmemiş sıradaki kelimeye otomatik yumuşak geçiş yap
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

      // Kelime boyutu tamamlandığında doğru değilse: Kırmızı yanıp sönme & otomatik geri alma
      const wrongFullWords = puzzle.words.filter((w) => {
        if (newSolvedIds.has(w.id)) return false;
        return w.cells.every(([r, c]) => currentBoard[r]?.[c] !== null);
      });

      if (wrongFullWords.length > 0) {
        const errorCellsSet = new Set<string>();
        wrongFullWords.forEach((w) => {
          w.cells.forEach(([r, c]) => {
            errorCellsSet.add(`${r},${c}`);
          });
        });

        setErrorCells(errorCellsSet);
        triggerHapticError();
        playErrorSound();

        // Tahtada sarsılma animasyonu
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 8, duration: 45, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -8, duration: 45, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 6, duration: 45, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -6, duration: 45, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 45, useNativeDriver: true }),
        ]).start();

        setErrorMessage("Hatalı kelime! Harfler temizleniyor...");
        if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = setTimeout(() => setErrorMessage(null), 1200);

        isClearingErrorRef.current = true;

        if (clearErrorTimeoutRef.current) {
          clearTimeout(clearErrorTimeoutRef.current);
        }

        clearErrorTimeoutRef.current = setTimeout(() => {
          isClearingErrorRef.current = false;
          setErrorCells(new Set());

          setPlayerBoard((prevBoard) => {
            const nextBoard = prevBoard.map((rowArr) => [...rowArr]);
            const clearedCellKeys = new Set<string>();
            const lettersToReturn: string[] = [];

            wrongFullWords.forEach((w) => {
              w.cells.forEach(([r, c]) => {
                const key = `${r},${c}`;
                if (!clearedCellKeys.has(key)) {
                  clearedCellKeys.add(key);
                  // Yalnızca çözülmüş kelimelere kilitlenmemiş hücreleri sil ve havuza iade et
                  if (!isCellLocked(r, c, newSolvedIds)) {
                    const ch = nextBoard[r]?.[c];
                    if (ch !== null && ch !== undefined) {
                      lettersToReturn.push(ch);
                      nextBoard[r]![c] = null;
                    }
                  }
                }
              });
            });

            if (lettersToReturn.length > 0) {
              const newTiles: PoolTile[] = lettersToReturn.map((ch, idx) => ({
                id: `p-ret-err-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
                letter: ch,
              }));
              setLetterPool((prevPool) => [...prevPool, ...newTiles]);
            }

            // İmleci hatalı kelimenin ilk boş hücresine geri odakla
            const activeWrongWord = wrongFullWords.find((w) => w.id === selectedWordId) || wrongFullWords[0];
            if (activeWrongWord) {
              const firstEmpty = activeWrongWord.cells.find(([r, c]) => nextBoard[r]?.[c] === null);
              if (firstEmpty) {
                setSelectedCell(firstEmpty);
              }
            }

            return nextBoard;
          });
        }, 650);
      }
    },
    [puzzle, solvedWordIds, score, completedLevels, levelIndex, maxUnlockedLevel, onRewardXp, persistProgress, isCellLocked, shakeAnim, solvedPulseAnim, selectedWordId]
  );

  // Dokunulan Harf Taşını Doğrudan Tahtadaki Uygun Hücreye Koy
  const handlePressPoolLetterToBoard = useCallback(
    (tile: PoolTile) => {
      if (!puzzle || isClearingErrorRef.current) return;

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

      // Aktif kelimedeki yerleştirilen harf sırasına göre melodik nota artışı (Do-Re-Mi-Fa-Sol)
      const currentWordObj = puzzle.words.find((w) => w.id === selectedWordId);
      const letterIndexInWord = currentWordObj
        ? currentWordObj.cells.findIndex(([cr, cc]) => cr === targetR && cc === targetC)
        : 0;
      const pitchIndex = letterIndexInWord >= 0 ? letterIndexInWord : tile.letter.charCodeAt(0) % 7;

      triggerHapticSelection();
      playSelectionNote(pitchIndex);

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
          if (!nextEmpty) {
            for (let i = 0; i < currentIdx; i++) {
              const [nr, nc] = targetWord.cells[i]!;
              if (newBoard[nr]![nc] === null) {
                nextEmpty = [nr, nc];
                break;
              }
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
      if (isClearingErrorRef.current) return;
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

  // Joker İpucu: Seçili veya ilk çözülmemiş kelimeden 1 harfi tahtaya yerleştirir
  const handleUseHint = useCallback(() => {
    if (!puzzle || isLevelComplete || isClearingErrorRef.current) return;
    const availableCoins = coins ?? 0;
    if (availableCoins < VINTAGE_HINT_COST) {
      triggerError(`Yetersiz Çip! 1 harf açmak için ${VINTAGE_HINT_COST} Çip gerekir.`);
      return;
    }

    // 1. Hedef kelimeyi belirle (seçili ve çözülmemişse o, aksi halde ilk çözülmemiş kelime)
    const targetWord =
      puzzle.words.find((w) => w.id === selectedWordId && !solvedWordIds.has(w.id)) ||
      puzzle.words.find((w) => !solvedWordIds.has(w.id));

    if (!targetWord) {
      triggerError("Açılacak kelime kalmadı!");
      return;
    }

    // 2. Bu kelimede doğru harf yerleşmemiş ilk hücreyi bul
    let targetCell: [number, number] | null = null;
    let targetChar: string | null = null;

    for (let i = 0; i < targetWord.length; i++) {
      const r = targetWord.direction === "horizontal" ? targetWord.row : targetWord.row + i;
      const c = targetWord.direction === "horizontal" ? targetWord.col + i : targetWord.col;
      const expected = targetWord.answer[i]!;
      const currentCellChar = playerBoard[r]?.[c];
      if (!currentCellChar || !isEqualTr(currentCellChar, expected)) {
        targetCell = [r, c];
        targetChar = expected;
        break;
      }
    }

    if (!targetCell || !targetChar) {
      triggerError("Bu kelimenin tüm harfleri zaten doğru!");
      return;
    }

    // 3. Çipi harca
    const success = onSpendCoins ? onSpendCoins(VINTAGE_HINT_COST) : true;
    if (!success) {
      triggerError(`Yetersiz Çip! 1 harf açmak için ${VINTAGE_HINT_COST} Çip gerekir.`);
      return;
    }

    triggerHapticSuccess();
    playSuccessSound();

    const [tr, tc] = targetCell;
    const oldChar = playerBoard[tr]![tc];
    const newBoard = playerBoard.map((rowArr) => [...rowArr]);
    newBoard[tr]![tc] = targetChar;

    // Eğer hedef harf havuzda mevcut değilse, oyuncunun tahtada yanlış yerleştirdiği kilitlenmemiş bir hücreden temizle
    const tileInPool = letterPool.some((t) => isEqualTr(t.letter, targetChar!));
    if (!tileInPool) {
      for (let r = 0; r < 10; r++) {
        let cleared = false;
        for (let c = 0; c < 10; c++) {
          const boardChar = newBoard[r]![c];
          if ((r !== tr || c !== tc) && boardChar && isEqualTr(boardChar, targetChar!) && !isCellLockedByCompletedWord(r, c)) {
            newBoard[r]![c] = null;
            cleared = true;
            break;
          }
        }
        if (cleared) break;
      }
    }
    setPlayerBoard(newBoard);

    // 4. Havuzdan doğru harf taşını çıkar ve varsa eski yanlış harfi havuza geri ver
    setLetterPool((prev) => {
      let nextPool = [...prev];
      if (oldChar !== null && !isEqualTr(oldChar, targetChar!)) {
        nextPool.push({
          id: `p-ret-hint-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          letter: oldChar,
        });
      }
      const tileIndex = nextPool.findIndex((t) => isEqualTr(t.letter, targetChar!));
      if (tileIndex !== -1) {
        nextPool.splice(tileIndex, 1);
      }
      return nextPool;
    });

    setSelectedCell([tr, tc]);
    checkCompletedWordsOnBoard(newBoard);
  }, [puzzle, isLevelComplete, coins, selectedWordId, solvedWordIds, playerBoard, letterPool, isCellLockedByCompletedWord, onSpendCoins, triggerError, checkCompletedWordsOnBoard]);

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
      <VintageMapView
        measureContainer={measureContainer}
        onBack={onBack}
        onOpenLivesModal={onOpenLivesModal}
        isInfiniteLives={isInfiniteLives}
        lives={lives}
        coins={coins}
        score={score}
        maxUnlockedLevel={maxUnlockedLevel}
        completedLevels={completedLevels}
        levelIndex={levelIndex}
        onSelectLevel={(lvl) => {
          if (lvl === levelIndex) {
            loadNewPuzzleForLevel(lvl);
          } else {
            setLevelIndex(lvl);
          }
          setCountdown(3);
          setViewMode("play");
        }}
      />
    );
  }

  // 2. BULMACA OYNANIŞ EKRANI
  return (
    <View style={styles.outerContainer} onLayout={measureContainer}>
      {/* Üst Başlık & Kontroller */}
      <VintagePlayHeader
        levelIndex={levelIndex}
        lives={lives}
        isInfiniteLives={isInfiniteLives}
        onOpenLivesModal={onOpenLivesModal}
        coins={coins}
        score={score}
        boardSwapCount={boardSwapCount}
        onBackPress={handlePlayBackPress}
        onUseHint={handleUseHint}
        onResetLevel={handleResetLevel}
        soundOn={soundOn}
        hapticsOn={hapticsOn}
        onToggleSound={() => {
          const next = !getSfxEnabled();
          setSfxEnabled(next);
          setSoundOn(next);
          AsyncStorage.setItem("kelime-patlat:sfx-enabled", String(next)).catch(() => undefined);
        }}
        onToggleHaptics={() => {
          const next = !getHapticsEnabled();
          setHapticsEnabled(next);
          setHapticsOn(next);
          AsyncStorage.setItem("kelime-patlat:haptics-enabled", String(next)).catch(() => undefined);
        }}
      />

      {/* Bulmaca Alanı - Duyarlı Kaydırılabilir Kağıt */}
      <ScrollView
        style={styles.paperBoardScroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.paperBoard}>
          <View style={styles.paperTextureOverlay} />

          {errorMessage && (
            <Animated.View style={[
              styles.errorBanner,
              errorMessage.startsWith("✓") && styles.successBanner,
              { transform: [{ translateX: errorMessage.startsWith("✓") ? 0 : shakeAnim }] }
            ]}>
              <Text style={[
                styles.errorText,
                errorMessage.startsWith("✓") && styles.successText
              ]}>{errorMessage}</Text>
            </Animated.View>
          )}

          {/* Aktif Seçili İpucu Kartı & Yatay İpucu Çubuğu */}
          <VintageClueBanner
            activeWordItem={activeWordItem}
            solvedWordIds={solvedWordIds}
            completedCount={completedCount}
            totalCount={totalCount}
            placementDirection={placementDirection}
            onSelectDirection={handleSelectDirection}
            words={puzzle?.words}
            selectedWordId={selectedWordId}
            onSelectWord={(w) => {
              triggerHapticSelection();
              setSelectedWordId(w.id);
              setPlacementDirection(w.direction);
              const firstEmpty = w.cells.find(([r, c]) => playerBoard[r]?.[c] === null);
              setSelectedCell(firstEmpty || [w.row, w.col]);
            }}
          />

          {/* 10×10 OYUN TAHTASI */}
          <VintageBoardGrid
            gridContainerRef={gridContainerRef}
            shakeAnim={shakeAnim}
            solvedPulseAnim={solvedPulseAnim}
            playerBoard={playerBoard}
            selectedCell={selectedCell}
            puzzleCellsMap={puzzleCellsMap}
            cellNumbersMap={cellNumbersMap}
            isCellLockedByCompletedWord={isCellLockedByCompletedWord}
            solvedWordIds={solvedWordIds}
            centerWordId={puzzle?.centerWord?.id}
            activeTargetCellsMap={activeTargetCellsMap}
            errorCells={errorCells}
            cellSize={cellSize}
            onCellPress={handleCellPress}
          />

          {/* HARF TAŞLARI HAVUZU */}
          <Text style={styles.sectionLabelCompact}>HARF TAŞLARI (DOKUN TAHTAYA KOY):</Text>
          <View style={styles.letterPoolContainer} pointerEvents={errorCells.size > 0 ? "none" : "auto"}>
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
      <VintageVictoryModal
        visible={showVictoryModal}
        selectedVictoryEffect={selectedVictoryEffect}
        levelIndex={levelIndex}
        isInfiniteLives={isInfiniteLives}
        lives={lives}
        onOpenLivesModal={onOpenLivesModal}
        onInspectBoard={() => {
          setShowVictoryModal(false);
        }}
        onNextLevel={() => {
          setIsLevelComplete(false);
          setShowVictoryModal(false);
          const nextLvl = levelIndex + 1;
          setLevelIndex(nextLvl);
        }}
        onReturnToMap={() => {
          setIsLevelComplete(false);
          setShowVictoryModal(false);
          setViewMode("map");
        }}
      />

      {/* Bulmaca Çözüldükten Sonra Tahtayı İnceleme Banner'ı */}
      {isLevelComplete && !showVictoryModal && (
        <View style={styles.reviewBanner}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.reviewBannerTitle}>📰 Bulmaca Tamamlandı!</Text>
            <Text style={styles.reviewBannerSubtitle}>Tüm kelimeler doğru yerleştirildi</Text>
          </View>
          <View style={styles.reviewBannerBtns}>
            <Pressable
              onPress={() => {
                triggerHapticSelection();
                setShowVictoryModal(true);
              }}
              style={({ pressed }: { pressed: boolean }) => [styles.reviewReopenBtn, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.reviewReopenBtnText}>ÖDÜLÜ GÖR 🏆</Text>
            </Pressable>
            {levelIndex < 20 && (
              <Pressable
                onPress={() => {
                  if (!isInfiniteLives && typeof lives === "number" && lives <= 0) {
                    triggerHapticError();
                    playErrorSound();
                    onOpenLivesModal?.();
                    return;
                  }
                  triggerHapticSelection();
                  playSuccessSound();
                  setIsLevelComplete(false);
                  setShowVictoryModal(false);
                  const nextLvl = levelIndex + 1;
                  setLevelIndex(nextLvl);
                }}
                style={({ pressed }: { pressed: boolean }) => [styles.reviewActionBtn, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.reviewActionBtnText}>SONRAKİ ➔</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      <VintageExitModal
        visible={showExitModal}
        onDismiss={() => setShowExitModal(false)}
        onConfirm={() => {
          if (pendingExitDestination === "app") {
            onBack();
          } else {
            setViewMode("map");
          }
        }}
      />

      <VintageResetModal
        visible={showResetModal}
        onDismiss={() => setShowResetModal(false)}
        onConfirm={() => {
          if (boardSwapCount <= 0) {
            triggerError("Bu bölümde tahta değiştirme hakkınızı kullandınız! (Maks: 1)");
            return;
          }
          setBoardSwapCount((prev) => Math.max(0, prev - 1));
          loadNewPuzzleForLevel(levelIndex);
        }}
      />

      <GameCountdownOverlay
        countdown={countdown}
        title={`GAZETE BULMACASI - SEVİYE ${levelIndex}`}
        subtitle="10x10 Gazete bulmacasını tamamla, ödülleri kap!"
        icon="📰"
      />
    </View>
  );
}

