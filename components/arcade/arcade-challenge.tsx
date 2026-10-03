import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AppState,
  BackHandler,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { advanceSelection, wordFromSelection } from "@/shared/game";
import {
  createSoloBoard,
  APP_WORD_PALETTE,
  ARCADE_INITIAL_TIME,
  MAX_ARCADE_TIME,
  getNextArcadeSeed,
  getArcadeBoardClearBonus,
  calculateArcadeCombo,
} from "@/shared/solo";
import { getWordDefinition, fetchWordDetail, getCachedWordDetail } from "@/shared/dictionary";
import {
  initAudio,
  playSelectionNote,
  playSuccessSound,
  playErrorSound,
  playComboSound,
  playTimerTick,
  triggerHapticSelection,
  triggerHapticSuccess,
  triggerHapticError,
  triggerHapticLongWord,
  getSfxEnabled,
  setSfxEnabled,
} from "@/shared/audio-haptics";
import { gameSfx } from "@/lib/game-sfx";
import { VictoryEffectOverlay } from "../game/victory-effect-overlay";
import { GameCountdownOverlay } from "../game/game-countdown-overlay";
import { FloatingCombo } from "../game/game-boosters";
import type { PlayerProgress } from "@/shared/progression";
import { styles } from "./arcade.styles";
import { ArcadeResultModal, ArcadePauseModal } from "./arcade-modals";
import { ArcadeHeader } from "./arcade-header";
import { ArcadeWordTray } from "./arcade-word-tray";
import { ArcadeFoundWords } from "./arcade-found-words";
import { ArcadeSummaryPanel } from "./arcade-summary-panel";
import { ArcadeExitModal } from "./arcade-exit-modal";
import { ArcadeRouteInspector } from "./arcade-route-inspector";
import { ArcadeBoardGrid } from "./arcade-board-grid";

type Feedback = "idle" | "invalid" | "accepted";

export function ArcadeChallenge({
  onExit,
  onComplete,
  boardSkinColor,
  selectedVictoryEffect,
  watchAd,
  progress,
  setProgress,
  syncProgressToCloud,
}: {
  onExit: () => void;
  onComplete: (score: number, wordsCount?: number, isDoubled?: boolean, comboCount?: number, foundWords?: string[]) => void;
  boardSkinColor?: string;
  selectedVictoryEffect?: string;
  watchAd?: (onReward: () => void) => void;
  progress?: PlayerProgress;
  setProgress?: React.Dispatch<React.SetStateAction<PlayerProgress>>;
  syncProgressToCloud?: (progress: PlayerProgress) => Promise<void>;
}) {
  const { width } = useWindowDimensions();
  const [levelSeed, setLevelSeed] = useState(() => Math.floor(Math.random() * 15) + 1);
  const [variation, setVariation] = useState(() => Math.floor(Math.random() * 1_000_000));

  const challenge = useMemo(() => createSoloBoard(levelSeed, variation, "general"), [levelSeed, variation]);
  const totalWordsFoundRef = useRef(0);
  const totalCombosRef = useRef(0);
  const allFoundWordsRef = useRef<string[]>([]);

  const [selected, setSelected] = useState<number[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [foundPaths, setFoundPaths] = useState<number[][]>([]);
  const [inspectedPath, setInspectedPath] = useState<number[] | null>(null);
  const [inspectedColor, setInspectedColor] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(ARCADE_INITIAL_TIME);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const lastWordTimeRef = useRef<number>(0);
  const [feedback, setFeedback] = useState<Feedback>("idle");
  const [status, setStatus] = useState<"playing" | "lost">("playing");
  const [showResultModal, setShowResultModal] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [doubled, setDoubled] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [timeBonusText, setTimeBonusText] = useState<string | null>(null);
  const [scoreBurstText, setScoreBurstText] = useState<string | null>(null);
  const radarHighlights = useRef(new Set<number>()).current;
  const [selectedWordInfo, setSelectedWordInfo] = useState<{
    word: string;
    definition: string;
    type?: string;
    example?: string;
    source?: string;
    loading?: boolean;
  } | null>(null);

  const inspectWord = (word: string, path: number[] | null, color: string) => {
    triggerHapticSelection();
    if (selectedWordInfo?.word === word) {
      setSelectedWordInfo(null);
      setInspectedPath(null);
      setInspectedColor(null);
      return;
    }
    setInspectedColor(color);
    if (path) setInspectedPath(path);

    const cached = getCachedWordDetail(word);
    const syncDef = cached ? cached.definition : getWordDefinition(word);
    const hasRealDef = cached || (syncDef && !syncDef.includes("Kelime Patlat ile kelime dağarcığını"));

    setSelectedWordInfo({
      word,
      definition: hasRealDef ? syncDef : "TDK sözlüğünden anlamı yükleniyor...",
      type: cached?.type,
      example: cached?.example,
      source: cached?.source || "TDK",
      loading: !hasRealDef,
    });

    fetchWordDetail(word)
      .then((detail) => {
        if (!isMountedRef.current) return;
        setSelectedWordInfo((prev) => {
          if (!prev || prev.word !== word) return prev;
          return {
            word,
            definition: detail.definition,
            type: detail.type,
            example: detail.example,
            source: detail.source,
            loading: false,
          };
        });
      })
      .catch(() => {
        if (!isMountedRef.current) return;
        setSelectedWordInfo((prev) => (prev && prev.word === word ? { ...prev, loading: false } : prev));
      });
  };

  const [countdown, setCountdown] = useState<number | null>(3);

  // Countdown timer logic
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

  // FX states
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string; anim: Animated.ValueXY }[]>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const selectionRef = useRef<number[]>([]);
  const pointerActive = useRef(false);
  const submitted = useRef(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boardRef = useRef<any>(null);
  const boardPageX = useRef(0);
  const boardPageY = useRef(0);
  const lastTouchedIndexRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    initAudio().catch(() => undefined);
    return () => {
      isMountedRef.current = false;
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const measureBoard = () => {
    boardRef.current?.measure((x: any, y: any, width: any, height: any, pageX: any, pageY: any) => {
      if (pageX !== undefined && !isNaN(pageX)) boardPageX.current = pageX;
      if (pageY !== undefined && !isNaN(pageY)) boardPageY.current = pageY;
    });
  };

  const getEventPageCoords = (event: any) => {
    const ne = event.nativeEvent ?? event;
    if (ne.touches && ne.touches.length > 0) {
      return { pageX: ne.touches[0].pageX, pageY: ne.touches[0].pageY };
    }
    return { pageX: ne.pageX ?? 0, pageY: ne.pageY ?? 0 };
  };

  const boardWidth = Math.min(
    width - (challenge.size === 10 ? 20 : challenge.size === 8 ? 32 : challenge.size === 6 ? 32 : 36),
    challenge.size === 10 ? 410 : challenge.size === 8 ? 392 : challenge.size === 6 ? 374 : 356
  );
  const activeWord = wordFromSelection(challenge.board, selected);

  const scoreRef = useRef(score);
  const onCompleteRef = useRef(onComplete);
  const savedRef = useRef(false);

  useEffect(() => {
    scoreRef.current = score;
    onCompleteRef.current = onComplete;
  }, [score, onComplete]);

  const [isPaused, setIsPaused] = useState(false);
  const [soundOn, setSoundOn] = useState(() => getSfxEnabled());

  useEffect(() => {
    if (typeof progress?.sfxEnabled === "boolean") {
      setSoundOn(progress.sfxEnabled);
      setSfxEnabled(progress.sfxEnabled);
    }
  }, [progress?.sfxEnabled]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active" && status === "playing") {
        setIsPaused(true);
      }
    });
    return () => sub.remove();
  }, [status]);

  const [showExitModal, setShowExitModal] = useState(false);

  // Time Countdown (pauses when paused, countdown is active, or exit confirmation modal is open)
  useEffect(() => {
    if (status !== "playing" || countdown !== null || isPaused || showExitModal) return;
    const timer = setInterval(() => {
      setSeconds((value) => {
        const next = Math.max(0, value - 1);
        if (next <= 8 && next > 0) {
          playTimerTick(true);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status, countdown, isPaused, showExitModal]);

  // Süre bittiğinde kaybı işle
  useEffect(() => {
    if (seconds > 0 || status !== "playing" || countdown !== null || isPaused || showExitModal) return;
    if (savedRef.current) return;
    savedRef.current = true;
    pointerActive.current = false;
    setIsSelecting(false);
    selectionRef.current = [];
    setSelected([]);
    setStatus("lost");
    setShowResultModal(true);
    triggerHapticError();
    playErrorSound();
    onCompleteRef.current(scoreRef.current, totalWordsFoundRef.current, false, totalCombosRef.current, allFoundWordsRef.current);
  }, [seconds, status, countdown, isPaused, showExitModal]);

  // Donanım geri tuşu kontrolü (Android BackHandler)
  useEffect(() => {
    const onBackPress = () => {
      if (isPaused) {
        setIsPaused(false);
        return true;
      }
      if (showExitModal) {
        setShowExitModal(false);
        return true;
      }
      if (showResultModal) {
        setShowResultModal(false);
        return true;
      }
      if (status === "playing") {
        if (score > 0) {
          setShowExitModal(true);
        } else {
          onExit();
        }
        return true;
      }
      onExit();
      return true;
    };

    const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => sub.remove();
  }, [isPaused, showExitModal, showResultModal, status, score, onExit]);

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    if (!savedRef.current && scoreRef.current > 0) {
      savedRef.current = true;
      onCompleteRef.current(scoreRef.current, totalWordsFoundRef.current, false, totalCombosRef.current, allFoundWordsRef.current);
    }
  }, []);

  const clearSelection = () => {
    selectionRef.current = [];
    lastTouchedIndexRef.current = null;
    setSelected([]);
  };

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
  };

  const getCellCenter = (idx: number) => {
    const BOARD_PAD = 4;
    const innerSize = boardWidth - BOARD_PAD * 2;
    const cellSize = innerSize / challenge.size;
    const row = Math.floor(idx / challenge.size);
    const col = idx % challenge.size;
    return {
      x: col * cellSize + cellSize / 2 + BOARD_PAD,
      y: row * cellSize + cellSize / 2 + BOARD_PAD,
    };
  };

  const particleTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => {
    particleTimers.current.forEach(clearTimeout);
  }, []);

  const explodeConfetti = () => {
    const colors = ["#ffe5b3", "#b3f1ca", "#ffbec8", "#f5e6c0", "#ffd5bd"];
    const newConfetti: typeof particles = [];
    for (let i = 0; i < 40; i++) {
      const anim = new Animated.ValueXY({ x: 0, y: 0 });
      const id = Math.random();
      const startX = Math.random() * boardWidth;
      const startY = -20;
      newConfetti.push({ id, x: startX, y: startY, color: colors[Math.floor(Math.random() * colors.length)]!, anim });

      const targetX = (Math.random() - 0.5) * 150;
      const targetY = boardWidth + 50 + Math.random() * 100;

      Animated.timing(anim, {
        toValue: { x: targetX, y: targetY },
        duration: 1500 + Math.random() * 1000,
        useNativeDriver: true,
      }).start();
    }
    setParticles((prev) => [...prev, ...newConfetti]);
    const t1 = setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newConfetti.includes(p)));
    }, 2600);
    particleTimers.current.push(t1);
  };

  const explodeParticles = (cells: number[]) => {
    const BOARD_PAD = 4;
    const innerSize = boardWidth - BOARD_PAD * 2;
    const cellSize = innerSize / challenge.size;
    const newParticles: typeof particles = [];

    cells.forEach((cellIndex) => {
      const row = Math.floor(cellIndex / challenge.size);
      const col = cellIndex % challenge.size;
      const x = col * cellSize + cellSize / 2 + BOARD_PAD;
      const y = row * cellSize + cellSize / 2 + BOARD_PAD;

      for (let i = 0; i < 8; i++) {
        const anim = new Animated.ValueXY({ x: 0, y: 0 });
        const id = Math.random();
        newParticles.push({ id, x, y, color: "#98732c", anim });

        const angle = Math.random() * Math.PI * 2;
        const speed = 15 + Math.random() * 35;

        Animated.timing(anim, {
          toValue: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
          duration: 350,
          useNativeDriver: true,
        }).start();
      }
    });

    setParticles((prev) => [...prev, ...newParticles]);
    const t2 = setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.includes(p)));
    }, 380);
    particleTimers.current.push(t2);
  };

  const showInvalid = (_message: string) => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setFeedback("invalid");
    triggerHapticError();
    playErrorSound();
    triggerShake();
    resetTimer.current = setTimeout(() => {
      clearSelection();
      setFeedback("idle");
    }, 620);
  };

  const include = (index: number) => {
    if (status !== "playing") return;
    const previous = selectionRef.current;
    const next = advanceSelection(previous, index, challenge.size);
    if (next === previous) return;
    selectionRef.current = next;
    setSelected(next);
    triggerHapticSelection();
    if (next.length >= previous.length) playSelectionNote(next.length - 1);
  };

  const submit = () => {
    if (submitted.current || status !== "playing") return;
    submitted.current = true;
    const path = [...selectionRef.current];
    if (path.length < 3) {
      showInvalid("En az üç harf bağla.");
      return;
    }
    const word = wordFromSelection(challenge.board, path);
    if (!challenge.words.includes(word) || found.includes(word)) {
      showInvalid("Bu rota hedef kelimelerden biri değil.");
      return;
    }

    const nextFound = [...found, word];
    totalWordsFoundRef.current += 1;
    allFoundWordsRef.current.push(word);

    const now = Date.now();
    const elapsedSinceLastWord = lastWordTimeRef.current > 0 ? (now - lastWordTimeRef.current) / 1000 : 999;
    lastWordTimeRef.current = now;
    const nextCombo = elapsedSinceLastWord <= 8.0 ? combo + 1 : 1;
    if (nextCombo >= 2) {
      totalCombosRef.current += 1;
    }
    setCombo(nextCombo);
    const comboInfo = calculateArcadeCombo(nextCombo);

    const baseScoreGain = word.length * 10;
    const scoreGain = baseScoreGain + comboInfo.bonusScore;
    setScore((s) => s + scoreGain);
    setScoreBurstText(`+${scoreGain} ${nextCombo >= 2 ? "🔥" : "⭐"}`);
    const scoreBurstTimer = setTimeout(() => setScoreBurstText(null), 1200);
    particleTimers.current.push(scoreBurstTimer);

    setFound(nextFound);
    setFoundPaths((current) => [...current, path]);
    setFeedback("accepted");
    clearSelection();
    explodeParticles(path);

    const baseBonus = Math.min(8, word.length);
    const totalBonus = baseBonus + comboInfo.bonusSeconds;
    setSeconds((s) => Math.min(MAX_ARCADE_TIME, s + totalBonus));
    if (comboInfo.bonusSeconds > 0) {
      setTimeBonusText(`+${totalBonus}s (${comboInfo.label})`);
    } else {
      setTimeBonusText(`+${totalBonus}s`);
    }
    const bonusTextTimer = setTimeout(() => setTimeBonusText(null), 1200);
    particleTimers.current.push(bonusTextTimer);

    if (nextCombo >= 2) {
      playComboSound(nextCombo);
    } else {
      playSuccessSound(word.length);
    }
    if (word.length >= 6 || comboInfo.bonusSeconds > 0) {
      triggerHapticLongWord();
    } else {
      triggerHapticSuccess();
    }

    if (nextFound.length === challenge.words.length) {
      explodeConfetti();
      gameSfx.victory();
      triggerHapticLongWord();
      const nextScore = score + scoreGain;
      const nextSeed = getNextArcadeSeed(nextScore, levelSeed);
      const nextSize = nextSeed <= 15 ? 4 : nextSeed <= 45 ? 6 : nextSeed <= 75 ? 8 : 10;
      const boardClearBonus = getArcadeBoardClearBonus(challenge.size, nextSize);
      const isGraduating = nextSize > challenge.size;

      setSeconds((s) => Math.min(MAX_ARCADE_TIME, s + boardClearBonus));
      setTimeBonusText(
        isGraduating
          ? `${nextSize}x${nextSize} KADEMESİ! +${boardClearBonus}s 🚀`
          : `TAHTA TEMİZLENDİ! +${boardClearBonus}s ⚡`
      );

      const boardClearTimer = setTimeout(() => {
        setFound([]);
        setFoundPaths([]);
        setLevelSeed(nextSeed);
        setVariation((v) => v + 1);
        setFeedback("idle");
        setCombo(0);
        lastWordTimeRef.current = 0;
      }, 700);
      particleTimers.current.push(boardClearTimer);
    } else {
      const feedbackTimer = setTimeout(() => setFeedback("idle"), 360);
      particleTimers.current.push(feedbackTimer);
    }
  };

  const handleRestart = () => {
    triggerHapticSelection();
    setShowResultModal(false);
    savedRef.current = false;
    setDoubled(false);
    totalWordsFoundRef.current = 0;
    setLevelSeed(() => Math.floor(Math.random() * 15) + 1);
    setVariation((v) => v + 1);
    setSelected([]);
    setFound([]);
    setFoundPaths([]);
    setSeconds(ARCADE_INITIAL_TIME);
    setScore(0);
    setCombo(0);
    lastWordTimeRef.current = 0;
    setFeedback("idle");
    setStatus("playing");
    setIsSelecting(false);
    selectionRef.current = [];
    pointerActive.current = false;
    submitted.current = false;
    setTimeBonusText(null);
    setSelectedWordInfo(null);
    setInspectedPath(null);
    setInspectedColor(null);
    setCountdown(3);
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  };

  const handleExitPress = () => {
    if (status === "playing" && score > 0) {
      setShowExitModal(true);
    } else {
      onExit();
    }
  };

  const finish = () => {
    const wasPointerActive = pointerActive.current;
    pointerActive.current = false;
    setIsSelecting(false);
    if (wasPointerActive) {
      submit();
    }
  };

  const handleGesture = (locationX: number, locationY: number) => {
    if (status !== "playing") return;
    const BOARD_PAD = 4;
    const innerSize = boardWidth - BOARD_PAD * 2;
    const ox = locationX - BOARD_PAD;
    const oy = locationY - BOARD_PAD;
    if (ox < 0 || ox > innerSize || oy < 0 || oy > innerSize) return;
    const cellSize = innerSize / challenge.size;
    const col = Math.floor(ox / cellSize);
    const row = Math.floor(oy / cellSize);
    if (col >= 0 && col < challenge.size && row >= 0 && row < challenge.size) {
      const index = row * challenge.size + col;
      if (lastTouchedIndexRef.current === index) return;
      lastTouchedIndexRef.current = index;
      const isFound = foundPaths.some((p) => p.includes(index));
      if (isFound) return;
      if (!pointerActive.current) {
        if (resetTimer.current) clearTimeout(resetTimer.current);
        submitted.current = false;
        pointerActive.current = true;
        setIsSelecting(true);
        setFeedback("idle");
        clearSelection();
        triggerHapticSelection();
        playSelectionNote(0);
        include(index);
      } else {
        include(index);
      }
    }
  };

  const getEventBoardCoords = (event: any) => {
    const ne = event.nativeEvent ?? event;
    const x = ne.locationX ?? ne.offsetX;
    const y = ne.locationY ?? ne.offsetY;
    if (x !== undefined && y !== undefined) {
      return { x, y };
    }
    if (event.currentTarget && typeof event.currentTarget.getBoundingClientRect === "function") {
      const rect = event.currentTarget.getBoundingClientRect();
      const clientX = ne.clientX ?? (ne.touches && ne.touches[0] ? ne.touches[0].clientX : 0);
      const clientY = ne.clientY ?? (ne.touches && ne.touches[0] ? ne.touches[0].clientY : 0);
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    }
    const { pageX, pageY } = getEventPageCoords(event);
    return {
      x: pageX - boardPageX.current,
      y: pageY - boardPageY.current,
    };
  };

  const handleGestureStart = (event: any) => {
    if (status !== "playing") return;
    event.preventDefault?.();
    event.stopPropagation?.();
    measureBoard();
    const { x, y } = getEventBoardCoords(event);
    handleGesture(x, y);
  };

  const handleGestureMove = (event: any) => {
    if (status !== "playing" || !pointerActive.current) return;
    event.preventDefault?.();
    event.stopPropagation?.();
    const { x, y } = getEventBoardCoords(event);
    handleGesture(x, y);
  };

  const handleGestureEnd = (event?: any) => {
    if (event?.target?.releasePointerCapture) {
      try {
        event.target.releasePointerCapture(event.pointerId ?? event.nativeEvent?.pointerId);
      } catch {}
    }
    finish();
  };

  const { foundCells, foundCellColors } = useMemo(() => {
    const cells = new Set(foundPaths.flat());
    const colors = new Map<number, { bg: string; border: string; text: string }>();
    found.forEach((word, wordIndex) => {
      const palette = APP_WORD_PALETTE[wordIndex % APP_WORD_PALETTE.length]!;
      const path = foundPaths[wordIndex];
      if (path) {
        path.forEach((cell) => {
          colors.set(cell, { bg: palette.bg, border: palette.border, text: palette.letterText });
        });
      }
    });
    return { foundCells: cells, foundCellColors: colors };
  }, [foundPaths, found]);

  const { missedWords, missedCellColors } = useMemo(() => {
    if (status !== "lost") return { missedWords: [], missedCellColors: new Map<number, { bg: string; border: string; text: string }>() };
    const missed = challenge.words.filter((w) => !found.includes(w));
    const colors = new Map<number, { bg: string; border: string; text: string }>();
    missed.forEach((word, index) => {
      const colorIndex = (found.length + index) % APP_WORD_PALETTE.length;
      const palette = APP_WORD_PALETTE[colorIndex]!;
      const path = challenge.routes[word] ?? [];
      path.forEach((cell) => {
        colors.set(cell, { bg: palette.bg, border: palette.border, text: palette.letterText });
      });
    });
    return { missedWords: missed, missedCellColors: colors };
  }, [status, challenge, found]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const isUrgent = seconds <= 8;

  const handleDoubleReward = () => {
    triggerHapticSuccess();
    gameSfx.victory();
    setDoubled(true);
    onCompleteRef.current(score, totalWordsFoundRef.current, true, totalCombosRef.current, allFoundWordsRef.current);
  };

  const handleConfirmExit = () => {
    savedRef.current = true;
    if (scoreRef.current > 0) {
      onCompleteRef.current(scoreRef.current, totalWordsFoundRef.current, false, totalCombosRef.current, allFoundWordsRef.current);
    }
    onExit();
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F0F5ED" }}>
      {/* Pulsing Red Vignette for Urgent Time (seconds <= 8) */}
      {isUrgent && status === "playing" && (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderWidth: 6,
              borderColor: "rgba(239, 68, 68, 0.45)",
              zIndex: 99,
            },
          ]}
        />
      )}

      {/* Floating Combo Banner */}
      <FloatingCombo comboCount={combo} />

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.content}
        scrollEnabled={status !== "playing" || !isSelecting}
        showsVerticalScrollIndicator={false}
      >
        <ArcadeHeader
          score={score}
          seconds={seconds}
          timeBonusText={timeBonusText}
          foundCount={found.length}
          totalWords={challenge.words.length}
          size={challenge.size}
          combo={combo}
          onExitPress={handleExitPress}
          onPausePress={() => setIsPaused(true)}
        />

        <ArcadeBoardGrid
          boardRef={boardRef}
          measureBoard={measureBoard}
          boardWidth={boardWidth}
          boardSkinColor={boardSkinColor}
          shakeAnim={shakeAnim}
          isUrgent={isUrgent}
          scoreBurstText={scoreBurstText}
          countdown={countdown}
          selected={selected}
          getCellCenter={getCellCenter}
          status={status}
          foundPaths={foundPaths}
          challenge={challenge}
          inspectedPath={inspectedPath}
          inspectedColor={inspectedColor}
          selectedSet={selectedSet}
          foundCells={foundCells}
          foundCellColors={foundCellColors}
          missedCellColors={missedCellColors}
          radarHighlights={radarHighlights}
          feedback={feedback}
          particles={particles}
          onGestureStart={handleGestureStart}
          onGestureMove={handleGestureMove}
          onGestureEnd={handleGestureEnd}
          onGestureCancel={() => {
            pointerActive.current = false;
            setIsSelecting(false);
          }}
        />

        <ArcadeWordTray
          feedback={feedback}
          selectedLength={selected.length}
          activeWord={activeWord}
        />

        {/* Aktif Kelime Rotası ve Harf Yön Akışı Kartı */}
        <ArcadeRouteInspector
          selectedWordInfo={selectedWordInfo}
          inspectedPath={inspectedPath}
          inspectedColor={inspectedColor}
          onClose={() => {
            setSelectedWordInfo(null);
            setInspectedPath(null);
            setInspectedColor(null);
          }}
        />

        <ArcadeFoundWords
          status={status}
          found={found}
          foundPaths={foundPaths}
          missedWords={missedWords}
          challengeRoutes={challenge.routes}
          onInspectWord={inspectWord}
        />

        {status === "lost" && (
          <ArcadeSummaryPanel
            score={score}
            doubled={doubled}
            boardSkinColor={boardSkinColor}
            watchAd={watchAd}
            onDoubleReward={handleDoubleReward}
            onOpenResultModal={() => setShowResultModal(true)}
            onRestart={handleRestart}
            onExit={onExit}
          />
        )}
      </ScrollView>

      <VictoryEffectOverlay
        effectId={selectedVictoryEffect}
        visible={status === "lost" && score > 0}
        showToast={!showResultModal}
        title="Güzel turdu!"
        subtitle={`${score} puan topladın. Bir tur daha?`}
      />

      {/* Arcade Oyun Sonu / Skor ve Ödül Modali */}
      <ArcadeResultModal
        visible={status === "lost" && showResultModal}
        score={score}
        doubled={doubled}
        onDoubleReward={handleDoubleReward}
        onRestart={handleRestart}
        onInspectBoard={() => {
          triggerHapticSelection();
          setShowResultModal(false);
        }}
        onExit={onExit}
        onRequestClose={() => setShowResultModal(false)}
      />

      <ArcadePauseModal
        visible={isPaused}
        seconds={seconds}
        soundOn={soundOn}
        onResume={() => {
          triggerHapticSelection();
          setIsPaused(false);
        }}
        onToggleSound={() => {
          const nextState = !getSfxEnabled();
          setSfxEnabled(nextState);
          setSoundOn(nextState);
          setProgress?.((curr) => ({ ...curr, sfxEnabled: nextState }));
          AsyncStorage.setItem("kelime-patlat:sfx-enabled", String(nextState)).catch(() => undefined);
          triggerHapticSelection();
        }}
        onExit={() => {
          setIsPaused(false);
          handleExitPress();
        }}
      />

      <ArcadeExitModal
        visible={showExitModal}
        onDismiss={() => setShowExitModal(false)}
        onConfirmExit={handleConfirmExit}
      />

      <GameCountdownOverlay
        countdown={countdown}
        title="ARCADE MODU"
        subtitle="Süreye karşı yarış, komboları yakala!"
        icon="⚡"
      />
    </View>
  );
}
