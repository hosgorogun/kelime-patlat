import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, AppState, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, Animated } from "react-native";

import { advanceSelection, wordFromSelection } from "@/shared/game";
import { createSoloBoard, APP_WORD_PALETTE } from "@/shared/solo";
import { getWordDefinition } from "../shared/dictionary";
import {
  initAudio,
  playSelectionNote,
  playSuccessSound,
  playErrorSound,
  triggerHapticSelection,
  triggerHapticSuccess,
  triggerHapticError,
  triggerHapticLongWord
} from "@/shared/audio-haptics";
import { gameSfx } from "@/lib/game-sfx";
import { ModernAlertModal } from "./modern-alert-modal";

function ConnectLine({
  x1,
  y1,
  x2,
  y2,
  color,
  opacity = 0.95,
  showArrow = true,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  opacity?: number;
  showArrow?: boolean;
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  const arrowPos = Math.max(0, length - 18);
  
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: x1,
        top: y1,
        width: length,
        height: 0,
        transform: [{ rotate: `${angle}rad` }],
        transformOrigin: "0% 50%",
        zIndex: 20,
        overflow: "visible",
      }}
    >
      <View
        style={{
          position: "absolute",
          left: 0,
          top: -3,
          width: Math.max(0, length - 6),
          height: 6,
          backgroundColor: color,
          borderRadius: 3,
          opacity,
          shadowColor: color,
          shadowOpacity: 0.8,
          shadowRadius: 6,
          elevation: 4,
        }}
      />
      {showArrow && length > 14 && (
        <View
          style={{
            position: "absolute",
            left: arrowPos,
            top: -8,
            width: 14,
            height: 16,
            justifyContent: "center",
            alignItems: "center",
            zIndex: 25,
            opacity,
          }}
        >
          <View
            style={{
              position: "absolute",
              width: 0,
              height: 0,
              borderTopWidth: 8,
              borderBottomWidth: 8,
              borderLeftWidth: 14,
              borderTopColor: "transparent",
              borderBottomColor: "transparent",
              borderLeftColor: color,
            }}
          />
          <View
            style={{
              position: "absolute",
              left: 1,
              width: 0,
              height: 0,
              borderTopWidth: 5,
              borderBottomWidth: 5,
              borderLeftWidth: 9,
              borderTopColor: "transparent",
              borderBottomColor: "transparent",
              borderLeftColor: "#FFFFFF",
            }}
          />
        </View>
      )}
    </View>
  );
}

type Feedback = "idle" | "invalid" | "accepted";

export function ArcadeChallenge({ onExit, onComplete }: { onExit: () => void; onComplete: (score: number) => void }) {
  const { width } = useWindowDimensions();
  const [levelSeed, setLevelSeed] = useState(() => Math.floor(Math.random() * 15) + 1);
  const [variation, setVariation] = useState(() => Math.floor(Math.random() * 1_000_000));
  
  const challenge = useMemo(() => createSoloBoard(levelSeed, variation, "general"), [levelSeed, variation]);
  
  const [selected, setSelected] = useState<number[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [foundPaths, setFoundPaths] = useState<number[][]>([]);
  const [inspectedPath, setInspectedPath] = useState<number[] | null>(null);
  const [inspectedColor, setInspectedColor] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(30); // Start with 30s
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>("idle");
  const [status, setStatus] = useState<"playing" | "lost">("playing");
  const [doubled, setDoubled] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [timeBonusText, setTimeBonusText] = useState<string | null>(null);
  const [selectedWordInfo, setSelectedWordInfo] = useState<{ word: string; definition: string } | null>(null);
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
  const hasAutoInspectedRef = useRef(false);

  useEffect(() => {
    initAudio().catch(() => undefined);
    return () => {
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

  const boardWidth = Math.min(width - (challenge.size === 6 ? 32 : 36), challenge.size === 6 ? 374 : 356);
  const activeWord = wordFromSelection(challenge.board, selected);

  const scoreRef = useRef(score);
  const onCompleteRef = useRef(onComplete);
  const savedRef = useRef(false);

  useEffect(() => {
    scoreRef.current = score;
    onCompleteRef.current = onComplete;
  }, [score, onComplete]);

  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active" && status === "playing") {
        setIsPaused(true);
      }
    });
    return () => sub.remove();
  }, [status]);

  // Time Countdown
  useEffect(() => {
    if (status !== "playing" || countdown !== null || isPaused) return;
    const timer = setInterval(() => setSeconds((value) => {
      if (value <= 1) {
        clearInterval(timer);
        setStatus("lost");
        triggerHapticError();
        playErrorSound();
        savedRef.current = true;
        setTimeout(() => {
          onCompleteRef.current(scoreRef.current);
        }, 0);
        return 0;
      }
      return value - 1;
    }), 1000);
    return () => clearInterval(timer);
  }, [status, countdown, isPaused]);

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    if (!savedRef.current && scoreRef.current > 0) {
      savedRef.current = true;
      onCompleteRef.current(scoreRef.current);
    }
  }, []);

  const clearSelection = () => { selectionRef.current = []; lastTouchedIndexRef.current = null; setSelected([]); };

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true })
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
    const colors = ["#FFC24A", "#4ADE80", "#FF647C", "#E8C36A", "#FF9B62"];
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
        useNativeDriver: true
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
        newParticles.push({ id, x, y, color: "#FFC24A", anim });
        
        const angle = Math.random() * Math.PI * 2;
        const speed = 15 + Math.random() * 35;
        
        Animated.timing(anim, {
          toValue: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
          duration: 350,
          useNativeDriver: true
        }).start();
      }
    });

    setParticles((prev) => [...prev, ...newParticles]);
    const t2 = setTimeout(() => {
      setParticles((prev) => prev.filter(p => !newParticles.includes(p)));
    }, 380);
    particleTimers.current.push(t2);
  };

  const showInvalid = (message: string) => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setFeedback("invalid");
    triggerHapticError();
    playErrorSound();
    triggerShake();
    resetTimer.current = setTimeout(() => { clearSelection(); setFeedback("idle"); }, 620);
  };

  const include = (index: number) => {
    if (status !== "playing") return;
    const previous = selectionRef.current;
    const next = advanceSelection(previous, index, challenge.size);
    if (next === previous) return;
    selectionRef.current = next; setSelected(next);
    triggerHapticSelection();
    if (next.length >= previous.length) playSelectionNote(next.length - 1);
  };

  const submit = () => {
    if (submitted.current || status !== "playing") return;
    submitted.current = true;
    const path = [...selectionRef.current];
    if (path.length < 3) { showInvalid("En az üç harf bağla."); return; }
    const word = wordFromSelection(challenge.board, path);
    if (!challenge.words.includes(word) || found.includes(word)) { showInvalid("Bu rota hedef kelimelerden biri değil."); return; }
    
    const nextFound = [...found, word];
    const scoreGain = word.length * 10;
    setScore((s) => s + scoreGain);
    setFound(nextFound);
    setFoundPaths((current) => [...current, path]);
    setFeedback("accepted");
    clearSelection();
    explodeParticles(path);

    // Time extension reward!
    const bonus = Math.min(8, word.length);
    setSeconds((s) => s + bonus);
    setTimeBonusText(`+${bonus}s`);
    setTimeout(() => setTimeBonusText(null), 1200);

    playSuccessSound();
    if (word.length >= 6) {
      triggerHapticLongWord();
    } else {
      triggerHapticSuccess();
    }

    // If entire board is cleared, generate a new board!
    if (nextFound.length === challenge.words.length) {
      explodeConfetti();
      gameSfx.victory();
      triggerHapticLongWord();
      const boardClearBonus = challenge.size === 4 ? 6 : 12;
      setSeconds((s) => s + boardClearBonus);
      setTimeBonusText(`TAHTA TEMİZLENDİ! +${boardClearBonus}s ⚡`);

      setTimeout(() => {
        setFound([]);
        setFoundPaths([]);
        // Smooth scaling: Keep 4x4 (levels 1-15) for fast tempo until score reaches 250, then graduate to 6x6!
        setLevelSeed((current) => {
          const nextScore = score + scoreGain;
          if (nextScore < 250) {
            return (current % 15) + 1;
          }
          return 16 + ((current + 1) % 10);
        });
        setVariation((v) => v + 1);
        setFeedback("idle");
      }, 700);
    } else {
      setTimeout(() => setFeedback("idle"), 360);
    }
  };

  const handleRestart = () => {
    triggerHapticSelection();
    savedRef.current = false;
    setDoubled(false);
    setLevelSeed(() => Math.floor(Math.random() * 15) + 1);
    setVariation((v) => v + 1);
    setSelected([]);
    setFound([]);
    setFoundPaths([]);
    setSeconds(30);
    setScore(0);
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
    hasAutoInspectedRef.current = false;
    setCountdown(3);
  };

  const [showExitModal, setShowExitModal] = useState(false);

  const handleExitPress = () => {
    if (status === "playing" && score > 0) {
      setShowExitModal(true);
    } else {
      onExit();
    }
  };

  const finish = () => { if (!pointerActive.current) return; pointerActive.current = false; setIsSelecting(false); submit(); };
  
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
    event.preventDefault?.(); event.stopPropagation?.();
    setIsSelecting(true); measureBoard();
    const { x, y } = getEventBoardCoords(event);
    handleGesture(x, y);
  };

  const handleGestureMove = (event: any) => {
    event.preventDefault?.(); event.stopPropagation?.();
    if (!pointerActive.current) return;
    const { x, y } = getEventBoardCoords(event);
    handleGesture(x, y);
  };

  const handleGestureEnd = () => { finish(); };

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

  // Oyun bittiğinde ilk kelimenin rotasını ve yön oklarını tahtada otomatik göster
  useEffect(() => {
    if (status === "playing") {
      hasAutoInspectedRef.current = false;
      return;
    }
    if (challenge.words.length > 0 && !hasAutoInspectedRef.current) {
      hasAutoInspectedRef.current = true;
      const targetWord = missedWords[0] || found[0] || challenge.words[0]!;
      const path = challenge.routes[targetWord];
      const wIdx = challenge.words.indexOf(targetWord);
      const palette = APP_WORD_PALETTE[(wIdx >= 0 ? wIdx : 0) % APP_WORD_PALETTE.length]!;
      if (path) {
        setInspectedPath(path);
        setInspectedColor(palette.border);
        setSelectedWordInfo({ word: targetWord, definition: getWordDefinition(targetWord) });
      }
    }
  }, [status, challenge.words, challenge.routes, missedWords, found]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const isUrgent = seconds <= 8;

  return (
    <View style={{ flex: 1, backgroundColor: "#06140F" }}>
      <ScrollView contentContainerStyle={styles.content} scrollEnabled={!isSelecting} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
      <Pressable onPress={handleExitPress} style={styles.exit}><Text style={styles.exitText}>‹</Text></Pressable>
      <View style={{ flex: 1, marginHorizontal: 8, minWidth: 0 }}>
        <Text numberOfLines={1} style={styles.kicker}>ARCADE MODU</Text>
        <Text numberOfLines={1} style={styles.title}>ZAMANA KARŞI HÜCUM</Text>
      </View>
      <View style={styles.scoreContainer}><Text style={styles.scoreLabel}>SKOR</Text><Text style={styles.scoreValue}>{score}</Text></View>
      <View style={[styles.timer, seconds <= 8 && styles.timerUrgent]}>
        <Text style={styles.timerText}>{seconds}s</Text>
        {timeBonusText && <Text style={styles.bonusText}>{timeBonusText}</Text>}
      </View>
      <Pressable
        onPress={() => {
          triggerHapticSelection();
          setIsPaused(true);
        }}
        style={({ pressed }) => [styles.pauseBtn, pressed && { opacity: 0.8 }]}
      >
        <Text style={{ fontSize: 13 }}>⏸️</Text>
      </Pressable>
    </View>
    <View style={styles.progress}><Text style={styles.progressLabel}>{found.length} / {challenge.words.length} KELİME</Text><Text style={styles.progressMeta}>Her kelime ek süre kazandırır</Text></View>
    
    <Animated.View ref={boardRef} onLayout={measureBoard} style={[styles.board, { width: boardWidth, height: boardWidth, position: "relative", transform: [{ translateX: shakeAnim }] }, isUrgent && styles.boardUrgent]}>
      {/* HUD Matrix Grid Backing */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={{ position: "absolute", top: 0, bottom: 0, left: "25%", width: 1, backgroundColor: "rgba(212, 180, 90, 0.06)" }} />
        <View style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: 1, backgroundColor: "rgba(212, 180, 90, 0.06)" }} />
        <View style={{ position: "absolute", top: 0, bottom: 0, left: "75%", width: 1, backgroundColor: "rgba(212, 180, 90, 0.06)" }} />
        <View style={{ position: "absolute", left: 0, right: 0, top: "25%", height: 1, backgroundColor: "rgba(212, 180, 90, 0.06)" }} />
        <View style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, backgroundColor: "rgba(212, 180, 90, 0.06)" }} />
        <View style={{ position: "absolute", left: 0, right: 0, top: "75%", height: 1, backgroundColor: "rgba(212, 180, 90, 0.06)" }} />
      </View>

      {/* Canlı sürükleme çizgisi ve okları */}
      {selected.slice(0, -1).map((cellIdx, i) => {
        const nextCellIdx = selected[i + 1]!;
        const start = getCellCenter(cellIdx);
        const end = getCellCenter(nextCellIdx);
        return (
          <ConnectLine
            key={`line-${i}`}
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            color="#FFC24A"
            showArrow
          />
        );
      })}

      {/* Oyun sürerken bulunan kelimelerin tahtadaki rotaları */}
      {status === "playing" && foundPaths.map((path, pIdx) => {
        const palette = APP_WORD_PALETTE[pIdx % APP_WORD_PALETTE.length]!;
        return path.slice(0, -1).map((cellIdx, i) => {
          const nextCellIdx = path[i + 1]!;
          const start = getCellCenter(cellIdx);
          const end = getCellCenter(nextCellIdx);
          return (
            <ConnectLine
              key={`found-live-line-${pIdx}-${i}`}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              color={palette.border}
              opacity={0.65}
              showArrow
            />
          );
        });
      })}

      {/* Oyun bittiğinde: Tahtadaki TÜM kelimelerin rotalarını ve yön oklarını hemen çiz */}
      {status === "lost" && challenge.words.map((word, wIdx) => {
        const path = challenge.routes[word];
        if (!path || path.length < 2) return null;
        const palette = APP_WORD_PALETTE[wIdx % APP_WORD_PALETTE.length]!;
        const isCurrentInspected = Boolean(inspectedPath && inspectedPath.length === path.length && inspectedPath.every((c, ci) => c === path[ci]));
        const lineOpacity = inspectedPath ? (isCurrentInspected ? 1 : 0.35) : 0.88;
        const lineColor = isCurrentInspected ? (inspectedColor || palette.border) : palette.border;

        return path.slice(0, -1).map((cellIdx, i) => {
          const nextCellIdx = path[i + 1]!;
          const start = getCellCenter(cellIdx);
          const end = getCellCenter(nextCellIdx);
          return (
            <ConnectLine
              key={`finished-line-${wIdx}-${i}`}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              color={lineColor}
              opacity={lineOpacity}
              showArrow
            />
          );
        });
      })}

      {challenge.board.map((letter, index) => {
        const order = selected.indexOf(index);
        const isSelected = selectedSet.has(index);
        const isTail = selected.at(-1) === index;
        const isFound = foundCells.has(index);
        const foundColor = foundCellColors.get(index);
        const missedColor = missedCellColors.get(index);
        const isInspected = Boolean(status !== "playing" && inspectedPath?.includes(index));
        const inspectedOrder = (status !== "playing" && inspectedPath) ? inspectedPath.indexOf(index) : -1;
        const isInspectedStart = status !== "playing" && inspectedOrder === 0;
        const isInspectedEnd = (status !== "playing" && inspectedPath) ? inspectedOrder === inspectedPath.length - 1 : false;
        
        return (
          <View key={`${letter}-${index}`} pointerEvents="none" style={[styles.cellWrap, { width: `${100 / challenge.size}%`, height: `${100 / challenge.size}%` }]}>
            <View style={[
              styles.cell,
              isFound && styles.cellFound,
              foundColor && {
                backgroundColor: foundColor.bg,
                borderColor: foundColor.border,
                borderWidth: 2,
              },
              missedColor && {
                backgroundColor: missedColor.bg,
                borderColor: missedColor.border,
                borderWidth: 1.5,
                borderStyle: "dashed",
              },
              isInspected && {
                borderColor: inspectedColor || "#FFC24A",
                borderWidth: 2.5,
                backgroundColor: "rgba(255, 194, 74, 0.25)",
                transform: [{ scale: 1.06 }],
              },
              isInspectedStart && {
                borderColor: "#10B981",
                borderWidth: 2.5,
                shadowColor: "#10B981",
                shadowOpacity: 0.8,
                shadowRadius: 8,
                elevation: 6,
              },
              isInspectedEnd && {
                borderColor: "#EF4444",
                borderWidth: 2.5,
                shadowColor: "#EF4444",
                shadowOpacity: 0.8,
                shadowRadius: 8,
                elevation: 6,
              },
              isSelected && styles.cellSelected,
              isTail && styles.cellTail,
              feedback === "invalid" && isSelected && styles.cellInvalid,
              feedback === "accepted" && isSelected && styles.cellAccepted
            ]}>
              <Text selectable={false} style={[
                styles.letter,
                challenge.size === 6 && styles.letterMedium,
                foundColor && { color: foundColor.text },
                missedColor && { color: missedColor.text },
              ]}>{letter}</Text>
              {isSelected && <Text selectable={false} style={styles.order}>{order + 1}</Text>}
              {!isSelected && inspectedOrder >= 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: challenge.size >= 8 ? 1 : 2,
                    right: challenge.size >= 8 ? 1 : 2,
                    backgroundColor: isInspectedStart ? "#059669" : isInspectedEnd ? "#DC2626" : "rgba(8, 28, 22, 0.9)",
                    borderRadius: challenge.size >= 8 ? 4 : 6,
                    minWidth: challenge.size >= 8 ? 12 : 16,
                    height: challenge.size >= 8 ? 12 : 16,
                    justifyContent: "center",
                    alignItems: "center",
                    paddingHorizontal: 2,
                    borderWidth: 1,
                    borderColor: isInspectedStart ? "#34D399" : isInspectedEnd ? "#F87171" : "rgba(255, 255, 255, 0.35)",
                    zIndex: 6,
                  }}
                >
                  <Text
                    selectable={false}
                    style={{
                      color: "#FFFFFF",
                      fontSize: challenge.size >= 8 ? 7 : 8,
                      fontWeight: "900",
                      textAlign: "center",
                    }}
                  >
                    {isInspectedStart ? "1" : isInspectedEnd ? "✓" : inspectedOrder + 1}
                  </Text>
                </View>
              )}
              {isFound && !isSelected && <Text selectable={false} style={[styles.check, foundColor && { color: foundColor.border }]}>✓</Text>}
              {missedColor && !isSelected && !isFound && <Text selectable={false} style={[styles.check, { color: missedColor.border }]}>✗</Text>}
            </View>
          </View>
        );
      })}
      
      {particles.map(p => (
        <Animated.View key={p.id} style={{ position: 'absolute', left: p.x - 4, top: p.y - 4, width: 8, height: 8, borderRadius: 4, backgroundColor: p.color, transform: p.anim.getTranslateTransform() }} />
      ))}
      <View onPointerDown={(e: any) => { if (e.target?.setPointerCapture) e.target.setPointerCapture(e.pointerId ?? e.nativeEvent?.pointerId); handleGestureStart(e); }} onPointerMove={handleGestureMove} onPointerUp={handleGestureEnd} onPointerCancel={() => { pointerActive.current = false; setIsSelecting(false); }} onPointerLeave={finish} onTouchStart={handleGestureStart} onTouchMove={handleGestureMove} onTouchEnd={handleGestureEnd} style={StyleSheet.absoluteFill} />
    </Animated.View>
    <View style={[styles.wordTray, feedback === "invalid" && styles.trayInvalid, feedback === "accepted" && styles.trayAccepted]}>
      <Text style={styles.trayLabel}>
        {feedback === "invalid" ? ">> BAĞLANTI HATASI" : feedback === "accepted" ? ">> ŞİFRE ÇÖZÜLDÜ" : selected.length >= 3 ? ">> BAĞLANTI SAĞLANDI" : ">> TERMİNAL TARANIYOR..."}
      </Text>
      <Text style={styles.word}>
        {selected.length > 0 ? `[ ${activeWord.split("").join(" - ")} ]` : "—"}
      </Text>
    </View>

    {/* Aktif Kelime Rotası ve Harf Yön Akışı Kartı */}
    {selectedWordInfo && inspectedPath && (
      <View style={[styles.activeRouteCard, { borderColor: inspectedColor || "#FFC24A" }]}>
        <View style={styles.activeRouteHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={{ fontSize: 14 }}>🧭</Text>
            <Text style={styles.activeRouteTitle}>KELİME ROTASI & YÖNÜ</Text>
            <View style={[styles.activeRouteBadge, { backgroundColor: inspectedColor ? `${inspectedColor}25` : "rgba(255, 194, 74, 0.2)" }]}>
              <Text style={[styles.activeRouteBadgeText, { color: inspectedColor || "#FFC24A" }]}>
                {selectedWordInfo.word.length} HARF
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => {
              triggerHapticSelection();
              setSelectedWordInfo(null);
              setInspectedPath(null);
              setInspectedColor(null);
            }}
            style={({ pressed }) => [styles.activeRouteClose, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.activeRouteCloseText}>✕ Rotayı Kapat</Text>
          </Pressable>
        </View>

        {/* Harf akışı ve oklar */}
        <View style={styles.activeRouteFlow}>
          {selectedWordInfo.word.split("").map((ch, idx, arr) => (
            <React.Fragment key={`route-ch-${idx}`}>
              <View style={[
                styles.activeRouteChip,
                idx === 0 && styles.activeRouteChipStart,
                idx === arr.length - 1 && styles.activeRouteChipEnd,
              ]}>
                <Text style={[
                  styles.activeRouteChipText,
                  idx === 0 && styles.activeRouteChipTextStart,
                  idx === arr.length - 1 && styles.activeRouteChipTextEnd,
                ]}>
                  {ch}
                </Text>
                <Text style={[
                  styles.activeRouteChipSub,
                  idx === 0 && { color: "#34D399" },
                  idx === arr.length - 1 && { color: "#F87171" },
                ]}>
                  {idx === 0 ? "BAŞLANGIÇ" : idx === arr.length - 1 ? "BİTİŞ" : idx + 1}
                </Text>
              </View>
              {idx < arr.length - 1 && (
                <Text style={[styles.activeRouteArrow, { color: inspectedColor || "#FFC24A" }]}>➔</Text>
              )}
            </React.Fragment>
          ))}
        </View>

        {selectedWordInfo.definition ? (
          <View style={styles.activeRouteDefBox}>
            <Text style={[styles.activeRouteDefLabel, { color: inspectedColor || "#FFC24A" }]}>TDK ANLAMI</Text>
            <Text style={styles.activeRouteDefText}>{selectedWordInfo.definition}</Text>
          </View>
        ) : null}
      </View>
    )}

    <View style={styles.found}>
      <Text style={styles.foundLabel}>BULDUĞUN KELİMELER (ROTA VE SÖZLÜK İÇİN TIKLA)</Text>
      <View style={styles.tags}>
        {found.length ? found.map((word, index) => {
          const palette = APP_WORD_PALETTE[index % APP_WORD_PALETTE.length]!;
          const path = foundPaths[index] ?? challenge.routes[word];
          return (
            <Pressable
              key={word}
              onPress={() => {
                triggerHapticSelection();
                setInspectedPath(path || null);
                setInspectedColor(palette.border);
                setSelectedWordInfo({ word, definition: getWordDefinition(word) });
              }}
              style={({ pressed }) => [
                styles.tag,
                {
                  backgroundColor: palette.tagBg,
                  borderColor: palette.tagBorder,
                  borderWidth: 1.5,
                },
                pressed && { opacity: 0.7 }
              ]}
            >
              <Text style={[styles.tagText, { color: palette.tagText }]}>✓ {word}</Text>
            </Pressable>
          );
        }) : <Text style={styles.empty}>Henüz kelime bulunmadı.</Text>}
      </View>

      {status === "lost" && (
        <>
          <Text style={[styles.foundLabel, { marginTop: 14, color: "#FF647C" }]}>KAÇIRILAN KELİMELER (ROTA VE SÖZLÜK İÇİN TIKLA)</Text>
          <View style={styles.tags}>
            {missedWords.length > 0 ? (
              missedWords.map((word, index) => {
                const colorIndex = (found.length + index) % APP_WORD_PALETTE.length;
                const palette = APP_WORD_PALETTE[colorIndex]!;
                const path = challenge.routes[word];
                return (
                  <Pressable
                    key={word}
                    onPress={() => {
                      triggerHapticSelection();
                      setInspectedPath(path || null);
                      setInspectedColor(palette.border);
                      setSelectedWordInfo({ word, definition: getWordDefinition(word) });
                    }}
                    style={({ pressed }) => [
                      styles.tag,
                      {
                        backgroundColor: palette.tagBg,
                        borderWidth: 1.5,
                        borderColor: palette.tagBorder,
                        borderStyle: "dashed",
                      },
                      pressed && { opacity: 0.7 }
                    ]}
                  >
                    <Text style={[styles.tagText, { color: palette.tagText }]}>✗ {word}</Text>
                  </Pressable>
                );
              })
            ) : (
              <Text style={[styles.empty, { color: "#4ADE80" }]}>Harika! Tüm kelimeleri buldun!</Text>
            )}
          </View>
        </>
      )}
    </View>
    {status === "lost" && (
      <View style={styles.result}>
        <Text style={styles.resultTitle}>SÜRE DOLDU!</Text>
        <Text style={styles.resultCopy}>Arcade modunda ulaştığın nihai skor:</Text>
        <Text style={styles.finalScore}>{score}</Text>

        {/* Rewards Breakdown Strip */}
        <View style={styles.arcadeRewardsRow}>
          <View style={styles.arcadeRewardPill}>
            <Text style={styles.arcadeRewardIcon}>⚡</Text>
            <Text style={styles.arcadeRewardText}>+{doubled ? Math.max(5, Math.floor(score / 10)) * 2 : Math.max(5, Math.floor(score / 10))} XP</Text>
          </View>
          <View style={[styles.arcadeRewardPill, { borderColor: "#FFC24A" }]}>
            <Text style={styles.arcadeRewardIcon}>🪙</Text>
            <Text style={[styles.arcadeRewardText, { color: "#FFC24A" }]}>+{doubled ? Math.floor(score / 40) * 2 : Math.floor(score / 40)} ÇİP</Text>
          </View>
        </View>

        {!doubled && score > 0 && (
          <Pressable
            onPress={() => {
              Alert.alert(
                "📺 Ödülü 2X Yap",
                "15 saniyelik sponsorlu reklam izleyerek bu turdaki XP ve Çip ödülünü 2 katına çıkarmak ister misin?",
                [
                  { text: "Vazgeç", style: "cancel" },
                  {
                    text: "İzle ve 2X Yap",
                    onPress: () => {
                      triggerHapticSuccess();
                      gameSfx.victory();
                      setDoubled(true);
                      const bonusScore = score;
                      onCompleteRef.current(bonusScore);
                    },
                  },
                ]
              );
            }}
            style={[styles.action, { backgroundColor: "rgba(255, 208, 0, 0.2)", borderColor: "#FFD000", borderWidth: 1.5, marginBottom: 8 }]}
          >
            <Text style={[styles.actionText, { color: "#FFD000" }]}>🎁 REKLAM İZLE: KAZANILAN ÖDÜLLERİ 2X YAP 🔥</Text>
            <Text style={[styles.actionArrow, { color: "#FFD000" }]}>⚡</Text>
          </Pressable>
        )}

        <Pressable onPress={handleRestart} style={[styles.action, { backgroundColor: "#3EE8B5", marginBottom: 8 }]}>
          <Text style={[styles.actionText, { color: "#071A14" }]}>↺ YENİDEN DENE (REKOR KIR)</Text>
          <Text style={[styles.actionArrow, { color: "#071A14" }]}>⚡</Text>
        </Pressable>

        <Pressable onPress={onExit} style={[styles.action, { backgroundColor: "rgba(255, 100, 124, 0.2)", borderWidth: 1, borderColor: "#FF647C" }]}>
          <Text style={[styles.actionText, { color: "#FFF" }]}>KOMUTA MERKEZİNE DÖN</Text>
          <Text style={[styles.actionArrow, { color: "#FFF" }]}>→</Text>
        </Pressable>
      </View>
    )}
      </ScrollView>



      {isPaused && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setIsPaused(false)}>
          <View style={styles.pauseOverlay}>
            <View style={styles.pauseCard}>
              <Text style={{ fontSize: 44, marginBottom: 6 }}>⏸️</Text>
              <Text style={styles.pauseTitle}>ARCADE DURAKLATILDI</Text>
              <Text style={styles.pauseSub}>
                Süren donduruldu. Skoru ve rekor serisini kaybetmeden devam edebilirsin!
              </Text>
              <Pressable
                onPress={() => {
                  triggerHapticSelection();
                  setIsPaused(false);
                }}
                style={styles.resumeBtn}
              >
                <Text style={styles.resumeBtnText}>▶️ DEVAM ET ({seconds}s)</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setIsPaused(false);
                  handleExitPress();
                }}
                style={styles.pauseExitBtn}
              >
                <Text style={styles.pauseExitBtnText}>‹ MODDAN AYRIL</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      <ModernAlertModal
        alert={showExitModal ? {
          icon: "⚡",
          kicker: "ARCADE HÜCUMU",
          title: "Yarıştan Ayrıl",
          message: "Zamana karşı hücum devam ediyor. Çıkmak istediğinize emin misiniz? (Şu ana kadar kazandığınız skor kaydedilecektir)",
          accentColor: "#FF647C",
          primaryButton: {
            text: "DEVAM ET",
            color: "#3EE8B5",
            onPress: () => setShowExitModal(false),
          },
          secondaryButton: {
            text: "AYRIL",
            onPress: () => {
              setShowExitModal(false);
              savedRef.current = true;
              onCompleteRef.current(scoreRef.current);
              onExit();
            },
          },
        } : null}
        onDismiss={() => setShowExitModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 28, backgroundColor: "#06140F" }, header: { height: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, exit: { width: 35, height: 35, borderRadius: 12, backgroundColor: "#211A3D", alignItems: "center", justifyContent: "center" }, exitText: { color: "#FFF9FC", fontSize: 23, lineHeight: 23 }, kicker: { color: "#FFC24A", fontSize: 8, fontWeight: "900", letterSpacing: 0.9 }, title: { color: "#FFF9FC", fontSize: 13, fontWeight: "900", marginTop: 2, textShadowColor: "#000", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 3 }, scoreContainer: { alignItems: "center" }, scoreLabel: { color: "#8FA4CF", fontSize: 8, fontWeight: "900" }, scoreValue: { color: "#FFF9FC", fontSize: 16, fontWeight: "900", textShadowColor: "#000", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 2 }, timer: { borderRadius: 13, paddingHorizontal: 11, paddingVertical: 8, backgroundColor: "#2B2251", borderWidth: 1, position: "relative" }, timerUrgent: { backgroundColor: "#60233D", borderColor: "#FF647C" }, timerText: { color: "#FF647C", fontSize: 13, fontWeight: "900", textShadowColor: "#000", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }, bonusText: { position: "absolute", top: -18, right: 0, color: "#4ADE80", fontSize: 11, fontWeight: "900" }, progress: { alignItems: "center", paddingVertical: 12 }, progressLabel: { color: "#FFC24A", fontSize: 20, fontWeight: "900", letterSpacing: 1, textShadowColor: "#000", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 3 }, progressMeta: { color: "#A8C5B5", fontSize: 9, fontWeight: "800", marginTop: 3 }, board: { alignSelf: "center", flexDirection: "row", flexWrap: "wrap", backgroundColor: "#16122C", borderWidth: 1, borderColor: "#594884", borderRadius: 24, padding: 4, userSelect: "none", touchAction: "none" } as any, boardUrgent: { borderColor: "#FF647C", shadowColor: "#FF647C", shadowOpacity: 0.25, shadowRadius: 10, elevation: 8 }, cellWrap: { padding: 5 }, cell: { flex: 1, borderRadius: 99, backgroundColor: "#30264D", borderWidth: 2, borderColor: "#594884", alignItems: "center", justifyContent: "center", aspectRatio: 1 }, cellSelected: { backgroundColor: "#4D3B81", borderColor: "#FFC24A" }, cellTail: { borderWidth: 2, borderColor: "#4ADE80", transform: [{ scale: 1.04 }] }, cellInvalid: { backgroundColor: "#8D2C46", borderColor: "#FF647C" }, cellAccepted: { backgroundColor: "#2B776E", borderColor: "#4ADE80" }, cellFound: { backgroundColor: "#287B70", borderColor: "#4ADE80" }, check: { position: "absolute", left: 4, bottom: 2, color: "#E9FFF8", fontSize: 9, fontWeight: "900" }, letter: { color: "#FFF9FC", fontSize: 25, fontWeight: "900" }, letterMedium: { fontSize: 21 }, order: { position: "absolute", top: 3, right: 4, color: "#FFF2C7", fontSize: 8, fontWeight: "900" }, wordTray: { minHeight: 77, marginTop: 12, borderRadius: 18, backgroundColor: "#211A3D", borderWidth: 1, borderColor: "#51406F", alignItems: "center", justifyContent: "center", paddingHorizontal: 18, shadowColor: "#000", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 }, trayInvalid: { backgroundColor: "#5B2339", borderColor: "#FF647C" }, trayAccepted: { backgroundColor: "#1F514D", borderColor: "#4ADE80" }, trayLabel: { color: "#C6BADD", fontSize: 9, fontWeight: "900", letterSpacing: 1 }, word: { color: "#FFF9FC", fontSize: 18, fontWeight: "900", letterSpacing: 2, marginTop: 3, textShadowColor: "#000", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 3 }, found: { marginTop: 10, padding: 11, borderRadius: 15, backgroundColor: "#1A1530", borderWidth: 1, borderColor: "#3C315B", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 4 }, foundLabel: { color: "#A8C5B5", fontSize: 8, fontWeight: "900", letterSpacing: 0.9 }, tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 7 }, tag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: "#493878", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 2 }, tagText: { color: "#FFF2C7", fontSize: 10, fontWeight: "900" }, empty: { color: "#8F82A2", fontSize: 10 }, result: { marginTop: 10, padding: 14, borderRadius: 18, backgroundColor: "#4A2443", borderWidth: 1, borderColor: "#E4638B", alignItems: "center" }, resultTitle: { color: "#FFF9FC", fontSize: 15, fontWeight: "900", textShadowColor: "#000", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 3 }, resultCopy: { color: "#F1D2DE", fontSize: 10, textAlign: "center", marginTop: 4 }, finalScore: { color: "#FFC24A", fontSize: 32, fontWeight: "900", marginVertical: 12, textShadowColor: "#000", textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 4 }, action: { height: 44, alignSelf: "stretch", marginTop: 12, borderRadius: 13, paddingHorizontal: 13, backgroundColor: "#FF647C", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, actionText: { color: "#35152A", fontSize: 10, fontWeight: "900", letterSpacing: 0.8 }, actionArrow: { color: "#35152A", fontSize: 20, fontWeight: "900" },
  activeRouteCard: { marginTop: 10, borderRadius: 18, backgroundColor: "rgba(8, 28, 22, 0.95)", borderWidth: 1.5, borderColor: "#FFC24A", padding: 14, shadowColor: "#FFC24A", shadowOpacity: 0.25, shadowRadius: 10, elevation: 6 },
  activeRouteHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  activeRouteTitle: { color: "#FFFFFF", fontSize: 12, fontWeight: "900", letterSpacing: 0.8 },
  activeRouteBadge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: "rgba(255, 194, 74, 0.4)" },
  activeRouteBadgeText: { fontSize: 10, fontWeight: "900" },
  activeRouteClose: { backgroundColor: "rgba(239, 68, 68, 0.15)", borderWidth: 1, borderColor: "rgba(239, 68, 68, 0.35)", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  activeRouteCloseText: { color: "#FCA5A5", fontSize: 10, fontWeight: "800" },
  activeRouteFlow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 5, paddingVertical: 4 },
  activeRouteChip: { flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(30, 41, 59, 0.8)", borderWidth: 1, borderColor: "rgba(148, 163, 184, 0.25)", borderRadius: 10, minWidth: 36, paddingHorizontal: 6, paddingVertical: 4 },
  activeRouteChipStart: { backgroundColor: "rgba(5, 150, 105, 0.25)", borderColor: "#10B981", borderWidth: 1.5 },
  activeRouteChipEnd: { backgroundColor: "rgba(220, 38, 38, 0.25)", borderColor: "#EF4444", borderWidth: 1.5 },
  activeRouteChipText: { color: "#F1F5F9", fontSize: 14, fontWeight: "900" },
  activeRouteChipTextStart: { color: "#34D399" },
  activeRouteChipTextEnd: { color: "#F87171" },
  activeRouteChipSub: { color: "#94A3B8", fontSize: 8, fontWeight: "800", marginTop: 1 },
  activeRouteArrow: { fontSize: 14, fontWeight: "900", marginHorizontal: 1 },
  activeRouteDefBox: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: "rgba(148, 163, 184, 0.15)" },
  activeRouteDefLabel: { color: "#FFC24A", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  activeRouteDefText: { color: "#CBD5E1", fontSize: 12, lineHeight: 18, marginTop: 2, fontWeight: "500" },
  modalOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", zIndex: 100 },
  modalContent: { width: "86%", borderRadius: 20, borderWidth: 1.5, padding: 22, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.5, shadowRadius: 15, elevation: 10 },
  modalTitle: { fontSize: 22, fontWeight: "900", letterSpacing: 1.5, marginBottom: 12 },
  modalBody: { color: "#FFFFFF", fontSize: 14, lineHeight: 21, textAlign: "center", marginBottom: 20, fontWeight: "600" },
  modalCloseButton: { borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  modalCloseText: { color: "#000000", fontSize: 12, fontWeight: "900", letterSpacing: 0.8 },
  countdownOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(18, 16, 37, 0.85)", justifyContent: "center", alignItems: "center", zIndex: 200 },
  countdownText: { color: "#3EE8B5", fontSize: 72, fontWeight: "900", textShadowColor: "rgba(62, 232, 181, 0.8)", textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 15 },
  arcadeRewardsRow: { flexDirection: "row", gap: 10, marginBottom: 8, marginTop: 4 },
  arcadeRewardPill: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(20, 54, 43, 0.9)", borderWidth: 1.5, borderColor: "#3EE8B5", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, gap: 6 },
  arcadeRewardIcon: { fontSize: 13 },
  arcadeRewardText: { color: "#3EE8B5", fontSize: 11, fontWeight: "900" },
  pauseBtn: { width: 35, height: 35, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255, 208, 0, 0.4)", backgroundColor: "rgba(255, 208, 0, 0.12)", alignItems: "center", justifyContent: "center", marginLeft: 6 },
  pauseOverlay: { flex: 1, backgroundColor: "rgba(4, 17, 12, 0.92)", alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  pauseCard: { width: "100%", maxWidth: 360, backgroundColor: "#0E2C22", borderWidth: 1.5, borderColor: "#FFD000", borderRadius: 24, padding: 24, alignItems: "center" },
  pauseTitle: { color: "#FFF9FC", fontSize: 18, fontWeight: "900", letterSpacing: 1, marginBottom: 8 },
  pauseSub: { color: "#8FBAAB", fontSize: 12, textAlign: "center", lineHeight: 18, marginBottom: 20 },
  resumeBtn: { width: "100%", height: 46, borderRadius: 14, backgroundColor: "#FFD000", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  resumeBtnText: { color: "#06140F", fontSize: 12, fontWeight: "900", letterSpacing: 0.6 },
  pauseExitBtn: { width: "100%", height: 42, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.15)", backgroundColor: "rgba(255, 255, 255, 0.05)", alignItems: "center", justifyContent: "center" },
  pauseExitBtnText: { color: "#E2E8F0", fontSize: 11, fontWeight: "800", letterSpacing: 0.4 },
});
