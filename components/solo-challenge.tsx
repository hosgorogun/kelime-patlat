import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, Animated } from "react-native";

import { advanceSelection, wordFromSelection } from "@/shared/game";
import { createSoloBoard, MAX_SOLO_LEVEL, SOLUTION_ROUTE_COLORS, solutionColorByCell, APP_WORD_PALETTE } from "@/shared/solo";
import { type WordTheme } from "@/shared/word-catalog";
import { getWordDefinition } from "../shared/dictionary";
import { getThemeForLevel } from "../shared/themes";
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

function ConnectLine({ x1, y1, x2, y2, color }: { x1: number; y1: number; x2: number; y2: number; color: string }) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: x1,
        top: y1 - 2.5,
        width: length,
        height: 5,
        backgroundColor: color,
        transform: [
          { rotate: `${angle}rad` }
        ],
        transformOrigin: "0% 50%",
        borderRadius: 2.5,
        opacity: 0.75,
        shadowColor: color,
        shadowOpacity: 0.6,
        shadowRadius: 6,
        elevation: 3,
        zIndex: 5,
      }}
    />
  );
}

type Feedback = "idle" | "invalid" | "accepted";

const DIFFICULTY_LABEL = { easy: "KOLAY", medium: "ORTA", hard: "ZOR" } as const;

export function SoloChallenge({ level, theme = "general", variationSeed, daily = false, excludeWords = [], radarChargesBonus = 0, onExit, onComplete, onNext, onBonusReward }: { level: number; theme?: WordTheme; variationSeed?: number; daily?: boolean; excludeWords?: string[]; radarChargesBonus?: number; onExit: () => void; onComplete: (level: number, foundWords: string[], won: boolean) => void; onNext: () => void; onBonusReward?: (xp: number, radarBonus: number) => void }) {
  const { width } = useWindowDimensions();
  const activeTheme = useMemo(() => getThemeForLevel(level), [level]);
  const [variation, setVariation] = useState(() => variationSeed ?? Math.floor(Math.random() * 1_000_000));
  
  const challenge = useMemo(() => createSoloBoard(level, variation, theme, excludeWords), [level, variation, theme, excludeWords]);
  const [selected, setSelected] = useState<number[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [foundPaths, setFoundPaths] = useState<number[][]>([]);
  const [inspectedPath, setInspectedPath] = useState<number[] | null>(null);
  const [inspectedColor, setInspectedColor] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(challenge.timeLimit);
  const [feedback, setFeedback] = useState<Feedback>("idle");
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [isSelecting, setIsSelecting] = useState(false);
  const [radarCooldown, setRadarCooldown] = useState(0);
  const [radarCharges, setRadarCharges] = useState(3 + (radarChargesBonus || 0));
  const [radarHighlights, setRadarHighlights] = useState<Set<number>>(new Set());
  const [timeBonusText, setTimeBonusText] = useState<string | null>(null);
  const [selectedWordInfo, setSelectedWordInfo] = useState<{ word: string; definition: string } | null>(null);
  const [countdown, setCountdown] = useState<number | null>(3);
  const [chestState, setChestState] = useState<"closed" | "decrypting" | "opened">("closed");
  const [decryptProgress, setDecryptProgress] = useState(0);
  const [decryptText, setDecryptText] = useState("");

  const startDecryption = () => {
    if (chestState !== "closed") return;
    setChestState("decrypting");
    let prog = 0;
    const interval = setInterval(() => {
      prog += 20;
      setDecryptProgress(prog);
      const hex = Array.from({ length: 6 }, () => Math.floor(Math.random() * 16).toString(16).toUpperCase()).join("");
      setDecryptText(`DECRYPTING [0x${hex}]...`);
      if (prog >= 100) {
        clearInterval(interval);
        setChestState("opened");
        setRadarCharges((r) => r + 1);
        gameSfx.victory();
        triggerHapticSuccess();
        onBonusReward?.(150, 1);
      }
    }, 200);
  };

  const [revived, setRevived] = useState(false);
  const [doubleXpEarned, setDoubleXpEarned] = useState(false);

  const watchAd = (_onReward: () => void) => {
    Alert.alert("Reklam yakında", "Ödüllü reklam sistemi mağaza entegrasyonu tamamlandığında açılacak.");
  };

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
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Radar cooldown timer
  useEffect(() => {
    if (radarCooldown <= 0) return;
    const timer = setTimeout(() => {
      setRadarCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [radarCooldown]);
  
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string; anim: Animated.ValueXY }[]>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const selectionRef = useRef<number[]>([]);
  const pointerActive = useRef(false);
  const submitted = useRef(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boardRef = useRef<any>(null);
  const boardPageX = useRef(0);
  const boardPageY = useRef(0);
  const lastWordTimeRef = useRef<number>(0);
  const lastTouchedIndexRef = useRef<number | null>(null);

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
  const boardWidth = Math.min(
    width - (challenge.size === 10 ? 20 : challenge.size === 8 ? 32 : challenge.size === 6 ? 32 : 36),
    challenge.size === 10 ? 410 : challenge.size === 8 ? 392 : challenge.size === 6 ? 374 : 356
  );
  const activeWord = wordFromSelection(challenge.board, selected);

  useEffect(() => {
    setSelected([]); setFound([]); setFoundPaths([]); setInspectedPath(null); setInspectedColor(null); setSeconds(challenge.timeLimit); setFeedback("idle"); setStatus("playing"); setIsSelecting(false); selectionRef.current = []; pointerActive.current = false;
    setRadarCooldown(0); setRadarCharges(3 + (radarChargesBonus || 0)); setRadarHighlights(new Set()); setTimeBonusText(null); setSelectedWordInfo(null); setCountdown(3); lastWordTimeRef.current = 0;
    setChestState("closed"); setDecryptProgress(0); setDecryptText(""); setRevived(false); setDoubleXpEarned(false);
  }, [challenge, radarChargesBonus]);

  useEffect(() => {
    if (variationSeed !== undefined) setVariation(variationSeed);
  }, [variationSeed]);

  useEffect(() => {
    if (variationSeed === undefined) {
      setVariation(Math.floor(Math.random() * 1_000_000));
    }
  }, [level, variationSeed]);

  const onCompleteRef = useRef(onComplete);
  const foundRef = useRef(found);
  const levelRef = useRef(level);
  const dailyRef = useRef(daily);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    foundRef.current = found;
    levelRef.current = level;
    dailyRef.current = daily;
  }, [onComplete, found, level, daily]);

  useEffect(() => {
    if (status !== "playing" || countdown !== null) return;
    const timer = setInterval(() => setSeconds((value) => {
      if (value <= 1) {
        clearInterval(timer);
        setStatus("lost");
        triggerHapticError();
        playErrorSound();
        if (daily) onCompleteRef.current(levelRef.current, foundRef.current, false);
        return 0;
      }
      return value - 1;
    }), 1000);
    return () => clearInterval(timer);
  }, [status, countdown, daily]);

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
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

  const explodeConfetti = () => {
    const colors = ["#FFC24A", "#50E3C2", "#FF647C", "#A78BFA", "#FF9B62"];
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
        newParticles.push({ id, x, y, color: activeTheme.accentColor, anim });
        
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
    setTimeout(() => {
      setParticles((prev) => prev.filter(p => !newParticles.includes(p)));
    }, 380);
  };

  const showInvalid = (message: string) => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setFeedback("invalid"); triggerHapticError(); playErrorSound(); triggerShake();
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
  const revealRadar = () => {
    if (radarCooldown > 0 || radarCharges <= 0 || status !== "playing") return;
    const remaining = challenge.words.filter((w) => !found.includes(w));
    if (!remaining.length) return;
    const targetWord = remaining[0]!;
    const path = challenge.routes[targetWord];
    if (path && path.length > 0) {
      setRadarCooldown(12);
      setRadarCharges((prev) => prev - 1);
      setTimeBonusText("👁 İPUCU AKTİF");
      setTimeout(() => setTimeBonusText(null), 1500);
      const highlights = new Set([path[0]!, path[path.length - 1]!]);
      setRadarHighlights(highlights);
      triggerHapticSelection(); playSelectionNote(0);
      setTimeout(() => {
        setRadarHighlights(new Set());
      }, 2500);
    }
  };
  const submit = () => {
    if (submitted.current || status !== "playing") return;
    submitted.current = true;
    const path = [...selectionRef.current];
    if (path.length < 3) { showInvalid("En az üç harf bağla."); return; }
    const word = wordFromSelection(challenge.board, path);
    if (!challenge.words.includes(word) || found.includes(word)) { showInvalid("Bu rota hedef kelimelerden biri değil."); return; }
    const nextFound = [...found, word];
    setFound(nextFound); setFoundPaths((current) => [...current, path]); setFeedback("accepted"); clearSelection();
    explodeParticles(path);
    
    const now = Date.now();
    const lastTime = lastWordTimeRef.current;
    const isCombo = lastTime > 0 && (now - lastTime < 8000);
    lastWordTimeRef.current = now;

    const bonus = isCombo ? 8 : 4;
    setSeconds((s) => Math.min(challenge.timeLimit, s + bonus));
    setTimeBonusText(isCombo ? `+${bonus}s 🔥 KOMBO!` : `+${bonus}s`);
    setTimeout(() => setTimeBonusText(null), 1500);

    if (word.length >= 6) {
      triggerHapticLongWord();
    } else {
      triggerHapticSuccess();
    }
    playSuccessSound();

    if (nextFound.length === challenge.words.length) {
      explodeConfetti();
      gameSfx.victory();
      triggerHapticLongWord();
      setTimeout(() => {
        setStatus("won");
        onComplete(level, nextFound, true);
      }, 700);
    } else {
      setTimeout(() => setFeedback("idle"), 360);
    }
  };

  const handleExitPress = () => {
    if (status === "lost" && daily) {
      onCompleteRef.current(levelRef.current, foundRef.current, false);
      onExit();
      return;
    }
    if (status === "playing" && (found.length > 0 || daily)) {
      Alert.alert(
        daily ? "Günün Rotasından Ayrıl" : "Seviyeden Ayrıl",
        daily
          ? "Günün rotasından çıkmak istediğinize emin misiniz? Günlük tek oynama hakkınızı korumak için oyunu tamamlamayı deneyin."
          : "Mevcut seviyeden çıkmak istediğinize emin misiniz?",
        [
          { text: "Devam Et", style: "cancel" },
          {
            text: "Ayrıl",
            style: "destructive",
            onPress: () => {
              if (daily) onCompleteRef.current(levelRef.current, foundRef.current, false);
              onExit();
            },
          },
        ]
      );
    } else {
      onExit();
    }
  };

  const handleRetry = () => {
    triggerHapticSelection();
    const nextVariation = variation + 1;
    const nextBoard = createSoloBoard(level, nextVariation, theme, excludeWords);
    setVariation(nextVariation);
    setRevived(false);
    setSelected([]);
    setFound([]);
    setFoundPaths([]);
    setInspectedPath(null);
    setInspectedColor(null);
    setSeconds(nextBoard.timeLimit);
    setFeedback("idle");
    setStatus("playing");
    setIsSelecting(false);
    selectionRef.current = [];
    pointerActive.current = false;
    submitted.current = false;
    setTimeBonusText(null);
    setSelectedWordInfo(null);
    setCountdown(3);
    setRadarCooldown(0);
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
      const isFound = foundCells.has(index);
      const solutionColor = solutionColors.get(index);
      const isSolution = solutionColor !== undefined;
      if (isFound || isSolution) return;
      if (!pointerActive.current) {
        if (resetTimer.current) clearTimeout(resetTimer.current);
        submitted.current = false;
        pointerActive.current = true;
        setIsSelecting(true);
        setFeedback("idle");
        clearSelection();
        triggerHapticSelection(); playSelectionNote(0);
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
  const foundCells = new Set(foundPaths.flat());
  const foundCellColors = new Map<number, { bg: string; border: string; letterText: string }>();
  found.forEach((word, wordIndex) => {
    const palette = APP_WORD_PALETTE[wordIndex % APP_WORD_PALETTE.length]!;
    const path = foundPaths[wordIndex];
    if (path) {
      path.forEach((cell) => {
        foundCellColors.set(cell, { bg: palette.bg, border: palette.border, letterText: palette.letterText });
      });
    }
  });

  const solutionColors = status === "lost" ? solutionColorByCell(challenge) : new Map<number, number>();
  const selectedSet = new Set(selected);
  const isUrgent = seconds <= 15 && status === "playing";

  return (
    <View style={{ flex: 1, backgroundColor: activeTheme.background }}>
      <ScrollView contentContainerStyle={[styles.content, { backgroundColor: activeTheme.background }]} scrollEnabled={!isSelecting} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
      <Pressable onPress={handleExitPress} style={[styles.exit, { backgroundColor: activeTheme.surface }]}><Text style={styles.exitText}>‹</Text></Pressable>
      <View style={{ flex: 1, marginHorizontal: 8, minWidth: 0 }}>
        <Text numberOfLines={1} style={[styles.kicker, { color: activeTheme.headerText }]}>{daily ? "GÜNLÜK ROTA · SABİT TAHTA" : `TEK OYUNCU · SEVİYE ${level}`}</Text>
        <Text numberOfLines={1} style={styles.title}>{daily ? "GÜNÜN ROTASI" : challenge.title}</Text>
      </View>
      <Pressable
        disabled={(radarCooldown > 0 && radarCharges > 0) || status !== "playing"}
        onPress={() => {
          if (radarCharges > 0) {
              revealRadar();
          } else {
            watchAd(() => setRadarCharges(1));
          }
        }}
        style={[
          styles.radarButton,
          { backgroundColor: activeTheme.surface, borderColor: activeTheme.accentColor },
          (radarCooldown > 0 && radarCharges > 0) && styles.radarUsedBtn
        ]}
      >
        <Text style={styles.radarText}>
          {radarCharges > 0
            ? (radarCooldown > 0 ? `RADAR (${radarCooldown}s)` : `RADAR 👁 [${radarCharges}]`)
            : "👁 REKLAMLA +1 HAK"
          }
        </Text>
      </Pressable>
      <View style={[styles.timer, { backgroundColor: activeTheme.surface, borderColor: activeTheme.accentColor }, seconds <= 15 && styles.timerUrgent]}>
        <Text style={styles.timerText}>{seconds}s</Text>
        {timeBonusText && <Text style={styles.bonusText}>{timeBonusText}</Text>}
      </View>
    </View>
    <View style={styles.progress}><Text style={styles.progressLabel}>{found.length} / {challenge.words.length} KELİME</Text><Text style={[styles.progressMeta, { color: activeTheme.headerText }]}>{challenge.subtitle}</Text></View>
    <Animated.View ref={boardRef} onLayout={measureBoard} style={[styles.board, { width: boardWidth, height: boardWidth, position: "relative", backgroundColor: activeTheme.background, borderColor: activeTheme.cellBorder, transform: [{ translateX: shakeAnim }] }, isUrgent && styles.boardUrgent]}>
      {/* HUD Matrix Grid Backing */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={{ position: "absolute", top: 0, bottom: 0, left: "25%", width: 1, backgroundColor: "rgba(124, 92, 246, 0.06)" }} />
        <View style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: 1, backgroundColor: "rgba(124, 92, 246, 0.06)" }} />
        <View style={{ position: "absolute", top: 0, bottom: 0, left: "75%", width: 1, backgroundColor: "rgba(124, 92, 246, 0.06)" }} />
        <View style={{ position: "absolute", left: 0, right: 0, top: "25%", height: 1, backgroundColor: "rgba(124, 92, 246, 0.06)" }} />
        <View style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, backgroundColor: "rgba(124, 92, 246, 0.06)" }} />
        <View style={{ position: "absolute", left: 0, right: 0, top: "75%", height: 1, backgroundColor: "rgba(124, 92, 246, 0.06)" }} />
      </View>

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
            color={activeTheme.accentColor}
          />
        );
      })}

      {inspectedPath && inspectedPath.slice(0, -1).map((cellIdx, i) => {
        const nextCellIdx = inspectedPath[i + 1]!;
        const start = getCellCenter(cellIdx);
        const end = getCellCenter(nextCellIdx);
        return (
          <ConnectLine
            key={`inspect-line-${i}`}
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            color={inspectedColor || activeTheme.accentColor}
          />
        );
      })}

      {challenge.board.map((letter, index) => {
        const order = selected.indexOf(index);
        const isSelected = selectedSet.has(index);
        const isTail = selected.at(-1) === index;
        const isFound = foundCells.has(index);
        const foundColor = foundCellColors.get(index);
        const solutionColor = solutionColors.get(index);
        const isSolution = solutionColor !== undefined;
        const isRadar = radarHighlights.has(index);
        const isInspected = Boolean(inspectedPath?.includes(index));
        return (
          <View
            key={`${letter}-${index}`}
            pointerEvents="none"
            style={[
              styles.cellWrap,
              {
                width: `${100 / challenge.size}%`,
                height: `${100 / challenge.size}%`,
                padding: challenge.size === 10 ? 1.5 : challenge.size === 8 ? 2 : challenge.size === 6 ? 3 : 4,
              },
            ]}
          >
            <View
              style={[
                styles.cell,
                { backgroundColor: activeTheme.surface, borderColor: activeTheme.cellBorder },
                isSolution && SOLUTION_ROUTE_COLORS[solutionColor % SOLUTION_ROUTE_COLORS.length],
                isFound && !isSolution && (foundColor ? {
                  backgroundColor: foundColor.bg,
                  borderColor: foundColor.border,
                  borderWidth: 2,
                } : styles.cellFound),
                isInspected && {
                  borderColor: inspectedColor || activeTheme.accentColor,
                  borderWidth: 2.5,
                  backgroundColor: "rgba(245, 158, 11, 0.25)",
                  transform: [{ scale: 1.06 }],
                },
                isSelected && [styles.cellSelected, { backgroundColor: activeTheme.surfaceSelected }],
                isTail && styles.cellTail,
                feedback === "invalid" && isSelected && styles.cellInvalid,
                feedback === "accepted" && isSelected && styles.cellAccepted,
                isRadar && styles.cellRadar,
              ]}
            >
              <Text
                selectable={false}
                style={[
                  styles.letter,
                  challenge.size === 6 && styles.letterMedium,
                  challenge.size === 8 && styles.letterSmall,
                  challenge.size === 10 && styles.letterExtraSmall,
                  foundColor && !isSolution && { color: foundColor.letterText },
                  isRadar && styles.letterRadar,
                ]}
              >
                {letter}
              </Text>
              {isSelected && (
                <Text
                  selectable={false}
                  style={[
                    styles.order,
                    challenge.size >= 8 && { fontSize: 7, top: 1, right: 2 },
                  ]}
                >
                  {order + 1}
                </Text>
              )}
              {isFound && !isSelected && (
                <Text
                  selectable={false}
                  style={[
                    styles.check,
                    foundColor && { color: foundColor.border },
                    challenge.size >= 8 && { fontSize: 7, left: 2, bottom: 1 },
                  ]}
                >
                  ✓
                </Text>
              )}
              {isSolution && !isFound && (
                <Text
                  selectable={false}
                  style={[
                    styles.solutionMark,
                    challenge.size >= 8 && { fontSize: 8, bottom: 1, left: 2 },
                  ]}
                >
                  •
                </Text>
              )}
            </View>
          </View>
        );
      })}
      {particles.map(p => (
        <Animated.View key={p.id} style={{ position: 'absolute', left: p.x - 4, top: p.y - 4, width: 8, height: 8, borderRadius: 4, backgroundColor: p.color, transform: p.anim.getTranslateTransform() }} />
      ))}
      <View onPointerDown={(e: any) => { if (e.target?.setPointerCapture) e.target.setPointerCapture(e.pointerId ?? e.nativeEvent?.pointerId); handleGestureStart(e); }} onPointerMove={handleGestureMove} onPointerUp={handleGestureEnd} onPointerCancel={() => { pointerActive.current = false; setIsSelecting(false); }} onPointerLeave={finish} onTouchStart={handleGestureStart} onTouchMove={handleGestureMove} onTouchEnd={handleGestureEnd} style={StyleSheet.absoluteFill} />
    </Animated.View>
    <View style={[styles.tray, { backgroundColor: activeTheme.trayBackground, borderColor: activeTheme.cellBorder }, feedback === "invalid" && styles.trayInvalid, feedback === "accepted" && styles.trayAccepted]}>
      <Text style={styles.trayLabel}>
        {feedback === "invalid" ? ">> BAĞLANTI HATASI" : feedback === "accepted" ? ">> ŞİFRE ÇÖZÜLDÜ" : selected.length >= 3 ? ">> BAĞLANTI SAĞLANDI" : ">> TERMİNAL TARANIYOR..."}
      </Text>
      <Text style={styles.word}>
        {selected.length > 0 ? `[ ${activeWord.split("").join(" - ")} ]` : "—"}
      </Text>
      <Text style={styles.hint}>
        {feedback === "invalid" ? "Kırmızı rota birazdan temizlenecek." : "Yalnız yatay ve dikey ilerle; geri dönmek için önceki hücreye sürükle."}
      </Text>
    </View>
    <View style={[styles.found, { backgroundColor: activeTheme.trayBackground, borderColor: activeTheme.cellBorder }]}>
      <Text style={[styles.foundLabel, { color: activeTheme.headerText }]}>BULDUKLARIN (ROTA VE SÖZLÜK İÇİN TIKLA)</Text>
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
        }) : <Text style={styles.empty}>İlk kelimeyi bul.</Text>}
      </View>
    </View>
    {status === "won" && (
      <View style={styles.result}>
        <Text style={styles.resultTitle}>{daily ? "GÜNLÜK ROTA TAMAMLANDI" : "SEVİYE TAMAMLANDI"}</Text>
        <Text style={styles.resultCopy}>{daily ? "Bugünün XP ödülü sezon ilerlemene eklendi." : "Yeni rota yoğunluğu ve daha kısa süre seni bekliyor."}</Text>
        
        {daily && (
          <View style={[styles.chestCard, { borderColor: activeTheme.accentColor }]}>
            {chestState === "closed" && (
              <>
                <Text style={styles.chestIcon}>💾</Text>
                <Text style={styles.chestTitle}>SİBER DEŞİFRE KUTUSU</Text>
                <Text style={styles.chestCopy}>Şifreli veri tabanı tespit edildi. Bağlantıyı kır ve içeriği sızdır.</Text>
                <Pressable onPress={startDecryption} style={[styles.chestButton, { backgroundColor: activeTheme.accentColor }]}>
                  <Text style={styles.chestButtonText}>BAĞLANTIYI AÇ (DEŞİFRE ET)</Text>
                </Pressable>
              </>
            )}
            {chestState === "decrypting" && (
              <>
                <Text style={styles.chestIcon}>🌀</Text>
                <Text style={styles.chestTitle}>{decryptText}</Text>
                <Text style={styles.chestProgress}>[{ "=".repeat(Math.floor(decryptProgress / 10)) + " ".repeat(10 - Math.floor(decryptProgress / 10)) }] {decryptProgress}%</Text>
              </>
            )}
            {chestState === "opened" && (
              <>
                <Text style={styles.chestIcon}>🎁</Text>
                <Text style={[styles.chestTitle, { color: "#50E3C2" }]}>DEŞİFRE BAŞARILI!</Text>
                <Text style={styles.chestSuccessReward}>
                  {doubleXpEarned
                    ? "VERİ KATLANDI: +300 SEZON XP & +1 RADAR HAKKI!"
                    : "VERİ ALINDI: +150 SEZON XP & +1 RADAR HAKKI!"
                  }
                </Text>
                {!doubleXpEarned && (
                  <Pressable
                    onPress={() => watchAd(() => {
                      setDoubleXpEarned(true);
                      gameSfx.victory();
                      triggerHapticSuccess();
                      onBonusReward?.(150, 1);
                    })}
                    style={[styles.chestButton, { backgroundColor: "#FFD000", marginTop: 8 }]}
                  >
                    <Text style={styles.chestButtonText}>🎁 REKLAMLA ÖDÜLÜ 2X YAP</Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
        )}

        <Pressable onPress={daily ? onExit : (level >= MAX_SOLO_LEVEL ? onExit : onNext)} style={[styles.action, { backgroundColor: activeTheme.accentColor }]}>
          <Text style={styles.actionText}>{daily ? "KOMUTA MERKEZİNE DÖN" : (level >= MAX_SOLO_LEVEL ? "HARİTAYA DÖN (TÜM SEVİYELER TAMAMLANDI)" : "SONRAKİ SEVİYE")}</Text>
          <Text style={styles.actionArrow}>→</Text>
        </Pressable>
      </View>
    )}
    {status === "lost" && (
      <View style={styles.result}>
        <Text style={styles.resultTitle}>SÜRE DOLDU</Text>
        <Text style={styles.resultCopy}>Her renk ayrı bir kelimenin yolunu gösterir.</Text>
        <View style={styles.solutionLegend}>
          {challenge.words.map((word, index) => {
            const palette = APP_WORD_PALETTE[index % APP_WORD_PALETTE.length]!;
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
                style={[
                  styles.solutionTag,
                  {
                    backgroundColor: palette.tagBg,
                    borderColor: palette.tagBorder,
                    borderWidth: 1.5,
                  },
                ]}
              >
                <Text style={[styles.solutionTagText, { color: palette.tagText }]}>
                  {word} · {DIFFICULTY_LABEL[challenge.wordDifficulties[word]!]}
                </Text>
              </Pressable>
            );
          })}
        </View>
        
        {!revived && (
          <Pressable
            onPress={() => watchAd(() => { setSeconds(20); setStatus("playing"); setRevived(true); })}
            style={[styles.action, { backgroundColor: "#00F5D4", marginTop: 12 }]}
          >
            <Text style={[styles.actionText, { color: "#121025" }]}>💾 SÜREYİ KURTAR (+20sn REKLAM)</Text>
            <Text style={[styles.actionArrow, { color: "#121025" }]}>⚡</Text>
          </Pressable>
        )}

        {daily ? (
          <Pressable
            onPress={() => {
              onCompleteRef.current(levelRef.current, foundRef.current, false);
              onExit();
            }}
            style={[styles.action, { backgroundColor: activeTheme.accentColor }]}
          >
            <Text style={styles.actionText}>KOMUTA MERKEZİNE DÖN</Text>
            <Text style={styles.actionArrow}>→</Text>
          </Pressable>
        ) : (
          <>
            <Pressable onPress={handleRetry} style={[styles.action, { backgroundColor: activeTheme.accentColor, marginBottom: 8 }]}><Text style={styles.actionText}>↺ YENİ IZGARA İLE TEKRAR DENE</Text><Text style={styles.actionArrow}>↺</Text></Pressable>
            <Pressable onPress={onExit} style={[styles.action, { backgroundColor: "rgba(255, 100, 124, 0.2)", borderWidth: 1, borderColor: "#FF647C" }]}><Text style={[styles.actionText, { color: "#FFF" }]}>HARİTAYA DÖN</Text><Text style={[styles.actionArrow, { color: "#FFF" }]}>→</Text></Pressable>
          </>
        )}
        </View>
      )}
      </ScrollView>

      {selectedWordInfo && (
        <Modal visible transparent animationType="fade" onRequestClose={() => { setSelectedWordInfo(null); setInspectedPath(null); setInspectedColor(null); }}>
          <Pressable style={styles.modalOverlay} onPress={() => { setSelectedWordInfo(null); setInspectedPath(null); setInspectedColor(null); }}>
            <Pressable style={[styles.modalContent, { backgroundColor: activeTheme.surface, borderColor: inspectedColor || activeTheme.accentColor }]} onPress={(e) => e.stopPropagation()}>
              <Text style={[styles.modalTitle, { color: inspectedColor || activeTheme.accentColor }]}>{selectedWordInfo.word}</Text>
              <Text style={styles.modalBody}>{selectedWordInfo.definition}</Text>
              <Pressable onPress={() => { setSelectedWordInfo(null); setInspectedPath(null); setInspectedColor(null); }} style={({ pressed }) => [styles.modalCloseButton, { backgroundColor: inspectedColor || activeTheme.accentColor }, pressed && { opacity: 0.8 }]}>
                <Text style={styles.modalCloseText}>KAPAT</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {countdown !== null && (
        <View style={styles.countdownOverlay} pointerEvents="auto">
          <Text style={styles.countdownText}>
            {countdown === 0 ? "BAŞLA!" : countdown}
          </Text>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 28 }, header: { height: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, exit: { width: 35, height: 35, borderRadius: 12, alignItems: "center", justifyContent: "center" }, exitText: { color: "#FFF9FC", fontSize: 23, lineHeight: 23 }, kicker: { fontSize: 8, fontWeight: "900", letterSpacing: 0.9 }, title: { color: "#FFF9FC", fontSize: 14, fontWeight: "900", marginTop: 2 }, timer: { borderRadius: 13, paddingHorizontal: 11, paddingVertical: 8, borderWidth: 1, position: "relative" }, timerUrgent: { backgroundColor: "#60233D", borderColor: "#FF647C" }, timerText: { color: "#FFC24A", fontSize: 13, fontWeight: "900" }, radarButton: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 }, radarUsedBtn: { backgroundColor: "#1A1530", borderColor: "#413660", opacity: 0.6 }, radarText: { color: "#FFC24A", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 }, bonusText: { position: "absolute", top: -18, right: 0, color: "#50E3C2", fontSize: 11, fontWeight: "900" }, progress: { alignItems: "center", paddingVertical: 12 }, progressLabel: { color: "#FFC24A", fontSize: 20, fontWeight: "900", letterSpacing: 1 }, progressMeta: { fontSize: 9, fontWeight: "800", marginTop: 3 }, board: { alignSelf: "center", flexDirection: "row", flexWrap: "wrap", borderWidth: 1, borderRadius: 24, padding: 4, userSelect: "none", touchAction: "none" } as any, boardUrgent: { borderColor: "#FF647C", shadowColor: "#FF647C", shadowOpacity: 0.25, shadowRadius: 10, elevation: 8 }, cellWrap: { padding: 5 }, cell: { flex: 1, borderRadius: 99, borderWidth: 2, alignItems: "center", justifyContent: "center", aspectRatio: 1 }, cellSelected: { borderColor: "#FFC24A" }, cellTail: { borderWidth: 2, borderColor: "#50E3C2", transform: [{ scale: 1.04 }] }, cellInvalid: { backgroundColor: "#8D2C46", borderColor: "#FF647C" }, cellAccepted: { backgroundColor: "#2B776E", borderColor: "#50E3C2" }, cellFound: { backgroundColor: "#287B70", borderColor: "#50E3C2" }, cellRadar: { backgroundColor: "#4E3A1D", borderColor: "#FFC24A", borderWidth: 2 }, check: { position: "absolute", left: 4, bottom: 2, color: "#E9FFF8", fontSize: 9, fontWeight: "900" }, solutionMark: { position: "absolute", left: 5, bottom: 1, color: "#E9FFF8", fontSize: 13, fontWeight: "900" }, letter: { color: "#FFF9FC", fontSize: 25, fontWeight: "900" }, letterMedium: { fontSize: 21 }, letterSmall: { fontSize: 17 }, letterExtraSmall: { fontSize: 13 }, letterRadar: { color: "#FFC24A" }, order: { position: "absolute", top: 3, right: 4, color: "#FFF2C7", fontSize: 8, fontWeight: "900" }, tray: { minHeight: 77, marginTop: 12, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 }, trayInvalid: { backgroundColor: "#5B2339", borderColor: "#FF647C" }, trayAccepted: { backgroundColor: "#1F514D", borderColor: "#50E3C2" }, trayLabel: { color: "#C6BADD", fontSize: 9, fontWeight: "900", letterSpacing: 1 }, word: { color: "#FFF9FC", fontSize: 18, fontWeight: "900", letterSpacing: 2, marginTop: 3 }, hint: { color: "#B5A9CD", fontSize: 8, textAlign: "center", marginTop: 3 }, found: { marginTop: 10, padding: 11, borderRadius: 15, borderWidth: 1 }, foundLabel: { fontSize: 8, fontWeight: "900", letterSpacing: 0.9 }, tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 7 }, tag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }, tagText: { color: "#FFF2C7", fontSize: 10, fontWeight: "900" }, empty: { color: "#8F82A2", fontSize: 10 }, result: { marginTop: 10, padding: 14, borderRadius: 18, backgroundColor: "#4A2443", borderWidth: 1, borderColor: "#E4638B", alignItems: "center" }, resultTitle: { color: "#FFF9FC", fontSize: 15, fontWeight: "900" }, resultCopy: { color: "#F1D2DE", fontSize: 10, textAlign: "center", marginTop: 4 }, solutionLegend: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6, marginTop: 9 }, solutionTag: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 }, solutionTagText: { color: "#FFF9FC", fontSize: 9, fontWeight: "900", letterSpacing: 0.4 }, action: { height: 44, alignSelf: "stretch", marginTop: 12, borderRadius: 13, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, actionText: { color: "#35152A", fontSize: 10, fontWeight: "900", letterSpacing: 0.8 }, actionArrow: { color: "#35152A", fontSize: 20, fontWeight: "900" },
  modalOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", zIndex: 100 },
  modalContent: { width: "86%", borderRadius: 20, borderWidth: 1.5, padding: 22, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.5, shadowRadius: 15, elevation: 10 },
  modalTitle: { fontSize: 22, fontWeight: "900", letterSpacing: 1.5, marginBottom: 12 },
  modalBody: { color: "#FFFFFF", fontSize: 14, lineHeight: 21, textAlign: "center", marginBottom: 20, fontWeight: "600" },
  modalCloseButton: { borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  modalCloseText: { color: "#000000", fontSize: 12, fontWeight: "900", letterSpacing: 0.8 },
  countdownOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(18, 16, 37, 0.85)", justifyContent: "center", alignItems: "center", zIndex: 200 },
  countdownText: { color: "#00F5D4", fontSize: 72, fontWeight: "900", textShadowColor: "rgba(0, 245, 212, 0.8)", textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 15 },
  chestCard: { width: "100%", marginTop: 12, padding: 16, borderRadius: 16, borderStyle: "dashed", borderWidth: 1.5, backgroundColor: "rgba(18, 14, 38, 0.45)", alignItems: "center" },
  chestIcon: { fontSize: 36, marginBottom: 8 },
  chestTitle: { color: "#FFF9FC", fontSize: 11, fontWeight: "900", letterSpacing: 1, textAlign: "center" },
  chestCopy: { color: "#B5A9CD", fontSize: 8, textAlign: "center", marginTop: 4, lineHeight: 11, paddingHorizontal: 12 },
  chestButton: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  chestButtonText: { color: "#121025", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  chestProgress: { color: "#FFC24A", fontSize: 10, fontWeight: "900", fontFamily: "monospace", marginTop: 8, letterSpacing: 0.8 },
  chestSuccessReward: { color: "#FFF9FC", fontSize: 9, fontWeight: "900", letterSpacing: 0.4, textAlign: "center", marginTop: 6 },
  adOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#0A0816", justifyContent: "center", alignItems: "center", zIndex: 300 },
  adTitle: { color: "#7C5CF6", fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginBottom: 12 },
  adSpinner: { color: "#FFF9FC", fontSize: 13, fontWeight: "900", textAlign: "center", paddingHorizontal: 28, lineHeight: 18 },
  adCountdown: { color: "#00F5D4", fontSize: 48, fontWeight: "900", marginTop: 24, textShadowColor: "rgba(0, 245, 212, 0.6)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 }
});
