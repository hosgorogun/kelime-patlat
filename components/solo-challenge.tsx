import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, AppState, BackHandler, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, Animated } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { advanceSelection, wordFromSelection } from "@/shared/game";
import { createSoloBoard, MAX_SOLO_LEVEL, SOLUTION_ROUTE_COLORS, solutionColorByCell, APP_WORD_PALETTE } from "@/shared/solo";
import { type WordTheme } from "@/shared/word-catalog";
import { getWordDefinition, fetchWordDetail, getCachedWordDetail } from "../shared/dictionary";
import { getThemeForLevel } from "../shared/themes";
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
import { ModernAlertModal } from "./modern-alert-modal";
import { VictoryBanner, VictoryEffectOverlay } from "./victory-effect-overlay";
import { ConnectLine, BoardCountdownShield } from "./game-ui";
import { GameCountdownOverlay } from "./game-countdown-overlay";
import { GameBoosters, FloatingCombo } from "./game-boosters";
import type { PlayerProgress } from "../shared/progression";

function FloatingTimeBonus({ text }: { text: string | null }) {
  const animVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (text) {
      animVal.setValue(0);
      Animated.sequence([
        Animated.spring(animVal, {
          toValue: 1,
          friction: 6,
          tension: 90,
          useNativeDriver: true,
        }),
        Animated.delay(900),
        Animated.timing(animVal, {
          toValue: 2,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
    // animVal sabit bir Animated.Value ref'idir, bağımlılık listesine eklenmesi gerekmez
  }, [text, animVal]);

  if (!text) return null;

  const translateY = animVal.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [6, -6, -26],
  });

  const scale = animVal.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0.6, 1.05, 0.9],
  });

  const opacity = animVal.interpolate({
    inputRange: [0, 0.2, 1, 2],
    outputRange: [0, 1, 1, 0],
  });

  const isCombo = text.includes("KOMBO") || text.includes("🔥") || text.includes("⚡") || text.includes("🚀");

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: -30,
        right: -4,
        transform: [{ translateY }, { scale }],
        opacity,
        zIndex: 150,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: isCombo ? "#FEF3C7" : "#DCFCE7",
          borderWidth: 1.5,
          borderColor: isCombo ? "#F59E0B" : "#10B981",
          borderRadius: 12,
          paddingHorizontal: 10,
          paddingVertical: 4,
          shadowColor: isCombo ? "#F59E0B" : "#10B981",
          shadowOpacity: 0.35,
          shadowRadius: 6,
          elevation: 4,
        }}
      >
        <Text
          style={{
            color: isCombo ? "#B45309" : "#047857",
            fontSize: 12,
            fontWeight: "900",
            letterSpacing: 0.5,
          }}
        >
          {text}
        </Text>
      </View>
    </Animated.View>
  );
}

function FloatingScoreBurst({ text }: { text: string | null }) {
  const animVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (text) {
      animVal.setValue(0);
      Animated.sequence([
        Animated.spring(animVal, {
          toValue: 1,
          friction: 5,
          tension: 110,
          useNativeDriver: true,
        }),
        Animated.delay(650),
        Animated.timing(animVal, {
          toValue: 2,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [text, animVal]);

  if (!text) return null;

  const translateY = animVal.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [12, -22, -54],
  });

  const scale = animVal.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0.5, 1.15, 0.85],
  });

  const opacity = animVal.interpolate({
    inputRange: [0, 0.15, 0.85, 2],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        alignSelf: "center",
        top: "40%",
        transform: [{ translateY }, { scale }],
        opacity,
        zIndex: 200,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          backgroundColor: "#FEF3C7",
          borderWidth: 2,
          borderColor: "#F59E0B",
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 8,
          shadowColor: "#F59E0B",
          shadowOpacity: 0.45,
          shadowRadius: 10,
          elevation: 8,
        }}
      >
        <Text style={{ color: "#B45309", fontSize: 18, fontWeight: "900", letterSpacing: 0.5 }}>
          {text}
        </Text>
      </View>
    </Animated.View>
  );
}

type Feedback = "idle" | "invalid" | "accepted";

const DIFFICULTY_LABEL = { easy: "KOLAY", medium: "ORTA", hard: "ZOR" } as const;
// Keep omitted exclusions stable so timer updates cannot regenerate the board.
const EMPTY_EXCLUDED_WORDS: string[] = [];

export function SoloChallenge({
  level,
  theme = "general",
  variationSeed,
  daily = false,
  excludeWords = EMPTY_EXCLUDED_WORDS,
  radarChargesBonus = 0,
  lives,
  onOpenLivesModal,
  boardSkinColor,
  selectedVictoryEffect,
  watchAd,
  onExit,
  onComplete,
  onNext,
  onAdvanceLevel,
  onBonusReward,
  progress,
  setProgress,
  syncProgressToCloud,
}: {
  level: number;
  theme?: WordTheme;
  variationSeed?: number;
  daily?: boolean;
  excludeWords?: string[];
  radarChargesBonus?: number;
  lives?: number;
  onOpenLivesModal?: () => void;
  boardSkinColor?: string;
  selectedVictoryEffect?: string;
  watchAd?: (onReward: () => void) => void;
  onExit: () => void;
  onComplete: (level: number, foundWords: string[], won: boolean) => void;
  onNext: () => void;
  onAdvanceLevel?: () => void;
  onBonusReward?: (xp: number, radarBonus: number) => void;
  progress?: PlayerProgress;
  setProgress?: React.Dispatch<React.SetStateAction<PlayerProgress>>;
  syncProgressToCloud?: (progress: PlayerProgress) => Promise<void>;
}) {
  const { width } = useWindowDimensions();
  const safeWatchAd = useMemo(() => watchAd ?? ((onReward: () => void) => onReward()), [watchAd]);
  const activeTheme = useMemo(() => getThemeForLevel(level), [level]);
  const [variation, setVariation] = useState(() => variationSeed ?? Math.floor(Math.random() * 1_000_000));
  
  // History changes after a win must not replace the completed board. Read the
  // latest exclusions only when the player starts another level or variation.
  const excludedWordsRef = useRef(excludeWords);
  excludedWordsRef.current = excludeWords;
  const challenge = useMemo(() => createSoloBoard(level, variation, theme, excludedWordsRef.current), [level, variation, theme]);
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
  // Bonus şarj değişimini takip etmek için referans (reset effect'in sonsuz döngüye girmesini önler)
  const radarBonusRef = useRef(radarChargesBonus);
  radarBonusRef.current = radarChargesBonus;

  useEffect(() => {
    // Bonus şarj sayısı arttığında mevcut şarjlara ekle (azaldığında dokunma)
    setRadarCharges((current) => Math.max(current, 3 + (radarChargesBonus || 0)));
  }, [radarChargesBonus]);

  const [radarHighlights, setRadarHighlights] = useState<Set<number>>(new Set());
  const [comboStreak, setComboStreak] = useState<number>(0);
  const [timeBonusText, setTimeBonusText] = useState<string | null>(null);
  const [scoreBurstText, setScoreBurstText] = useState<string | null>(null);
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

    fetchWordDetail(word).then((detail) => {
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
    }).catch(() => {
      setSelectedWordInfo((prev) => prev && prev.word === word ? { ...prev, loading: false } : prev);
    });
  };
  const [countdown, setCountdown] = useState<number | null>(3);
  const [chestState, setChestState] = useState<"closed" | "decrypting" | "opened">("closed");
  const [decryptProgress, setDecryptProgress] = useState(0);
  const [decryptText, setDecryptText] = useState("");

  const decryptIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isDecryptingRef = useRef(false);

  const startDecryption = () => {
    if (chestState !== "closed" || isDecryptingRef.current) return;
    isDecryptingRef.current = true;
    setChestState("decrypting");
    let prog = 0;
    if (decryptIntervalRef.current) clearInterval(decryptIntervalRef.current);
    decryptIntervalRef.current = setInterval(() => {
      prog += 20;
      setDecryptProgress(prog);
      const hex = Array.from({ length: 6 }, () => Math.floor(Math.random() * 16).toString(16).toUpperCase()).join("");
      setDecryptText(`DECRYPTING [0x${hex}]...`);
      if (prog >= 100) {
        if (decryptIntervalRef.current) {
          clearInterval(decryptIntervalRef.current);
          decryptIntervalRef.current = null;
        }
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
      if (decryptIntervalRef.current) clearInterval(decryptIntervalRef.current);
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
    setRadarCooldown(0); setRadarCharges(3 + (radarBonusRef.current || 0)); setRadarHighlights(new Set()); setTimeBonusText(null); setSelectedWordInfo(null); setCountdown(3); lastWordTimeRef.current = 0;
    setChestState("closed"); setDecryptProgress(0); setDecryptText(""); setRevived(false); setDoubleXpEarned(false);
    hasFinishedRef.current = false;
    hasAutoInspectedRef.current = false;
    isDecryptingRef.current = false;
    // NOT: radarChargesBonus bilinçli olarak bağımlılık listesinde değil — kutu ödülü alındığında
    // bu effect yeniden çalışıp chestState'i "closed"a sıfırlarsa oyuncu aynı kutuyu sonsuz kez açabilir (XP exploit'i).
  }, [challenge]);

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

  const hasFinishedRef = useRef(false);
  const hasAutoInspectedRef = useRef(false);

  // Oyun tamamlandığında veya süre bittiğinde ilk kelimenin rotasını ve yön oklarını tahtada otomatik göster
  useEffect(() => {
    if (status === "playing") {
      hasAutoInspectedRef.current = false;
      return;
    }
    if (challenge.words.length > 0 && !hasAutoInspectedRef.current) {
      hasAutoInspectedRef.current = true;
      const targetWord = found[0] || challenge.words[0]!;
      const path = challenge.routes[targetWord];
      const wIdx = challenge.words.indexOf(targetWord);
      const palette = APP_WORD_PALETTE[(wIdx >= 0 ? wIdx : 0) % APP_WORD_PALETTE.length]!;
      if (path) {
        setInspectedPath(path);
        setInspectedColor(palette.border);
        setSelectedWordInfo({ word: targetWord, definition: getWordDefinition(targetWord) });
      }
    }
  }, [status, challenge.words, challenge.routes, found]);

  const [showExitModal, setShowExitModal] = useState(false);

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

  // Süre bittiğinde kaybı işle (yan etkiler setState updater'ının dışında tutulur)
  useEffect(() => {
    if (seconds > 0 || status !== "playing" || countdown !== null || isPaused || showExitModal) return;
    if (!hasFinishedRef.current) {
      hasFinishedRef.current = true;
      setStatus("lost");
      triggerHapticError();
      playErrorSound();
      onCompleteRef.current(levelRef.current, foundRef.current, false);
    }
  }, [seconds, status, countdown, isPaused, showExitModal]);

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
        useNativeDriver: true
      }).start();
    }
    setParticles((prev) => [...prev, ...newConfetti]);
    const cleanupTimer = setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newConfetti.includes(p)));
    }, 2600);
    particleTimers.current.push(cleanupTimer);
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
    const cleanupTimer = setTimeout(() => {
      setParticles((prev) => prev.filter(p => !newParticles.includes(p)));
    }, 380);
    particleTimers.current.push(cleanupTimer);
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
      setRadarHighlights(new Set()); // Eski vurgulamayı anında temizle
      setRadarCooldown(12);
      setRadarCharges((prev) => prev - 1);
      setTimeBonusText("👁 İPUCU AKTİF");
      const t1 = setTimeout(() => setTimeBonusText(null), 1500);
      particleTimers.current.push(t1);
      const highlights = new Set([path[0]!, path[path.length - 1]!]);
      setRadarHighlights(highlights);
      triggerHapticSelection(); playSelectionNote(0);
      const t2 = setTimeout(() => {
        setRadarHighlights(new Set());
      }, 2500);
      particleTimers.current.push(t2);
    }
  };

  const handleUseHintBooster = () => {
    const remaining = challenge.words.filter((w) => !found.includes(w));
    if (!remaining.length) return;
    const targetWord = remaining[0]!;
    const path = challenge.routes[targetWord];
    if (path && path.length > 0) {
      setRadarHighlights(new Set());
      setTimeBonusText(`💡 ${targetWord.slice(0, 2).toUpperCase()}...`);
      const t1 = setTimeout(() => setTimeBonusText(null), 1800);
      particleTimers.current.push(t1);
      const hintCells = new Set(path.slice(0, Math.min(3, path.length)));
      setRadarHighlights(hintCells);
      triggerHapticSuccess();
      playSelectionNote(2);
      const t2 = setTimeout(() => {
        setRadarHighlights(new Set());
      }, 3500);
      particleTimers.current.push(t2);
    }
  };

  const handleUseFreezeBooster = () => {
    setSeconds((s) => Math.min(challenge.timeLimit + 30, s + 15));
    setTimeBonusText("⏱️ +15 SN & DONDURUCU!");
    const t = setTimeout(() => setTimeBonusText(null), 2000);
    particleTimers.current.push(t);
    triggerHapticSuccess();
    gameSfx.powerup();
  };

  const handleUseShuffleBooster = () => {
    const remaining = challenge.words.filter((w) => !found.includes(w));
    if (!remaining.length) return;
    const startCells = new Set<number>();
    remaining.forEach((w) => {
      const p = challenge.routes[w];
      if (p && p.length > 0) startCells.add(p[0]!);
    });
    setRadarHighlights(startCells);
    setTimeBonusText("🎲 GİZLİ BAŞLANGIÇLAR AÇILDI!");
    const t1 = setTimeout(() => setTimeBonusText(null), 2000);
    particleTimers.current.push(t1);
    triggerShake();
    triggerHapticLongWord();
    gameSfx.powerup();
    const t2 = setTimeout(() => {
      setRadarHighlights(new Set());
    }, 4000);
    particleTimers.current.push(t2);
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

    const nextStreak = isCombo ? comboStreak + 1 : 1;
    setComboStreak(nextStreak);

    const bonus = isCombo ? Math.min(12, 4 + nextStreak * 2) : 4;
    setSeconds((s) => Math.min(challenge.timeLimit, s + bonus));
    setTimeBonusText(nextStreak >= 2 ? `🔥 ATEŞLİ KOMBO x${nextStreak}! +${bonus}s` : `+${bonus}s`);
    const bonusTextTimer = setTimeout(() => setTimeBonusText(null), 1500);
    particleTimers.current.push(bonusTextTimer);

    const scoreVal = word.length * 15 * (isCombo ? nextStreak : 1);
    setScoreBurstText(`+${scoreVal} ${isCombo ? "🔥" : "⭐"}`);
    const scoreBurstTimer = setTimeout(() => setScoreBurstText(null), 1200);
    particleTimers.current.push(scoreBurstTimer);

    if (isCombo) {
      playComboSound(nextStreak);
    } else {
      playSuccessSound(word.length);
    }
    if (word.length >= 6) {
      triggerHapticLongWord();
    } else {
      triggerHapticSuccess();
    }

    if (nextFound.length === challenge.words.length) {
      hasFinishedRef.current = true;
      explodeConfetti();
      gameSfx.victory();
      triggerHapticLongWord();
      const winTimer = setTimeout(() => {
        setStatus("won");
        onCompleteRef.current(levelRef.current, nextFound, true);
      }, 700);
      particleTimers.current.push(winTimer);
    } else {
      const feedbackTimer = setTimeout(() => setFeedback("idle"), 360);
      particleTimers.current.push(feedbackTimer);
    }
  };

  const handleExitPress = useCallback(() => {
    if (status === "lost" && daily) {
      if (!hasFinishedRef.current) {
        hasFinishedRef.current = true;
        onCompleteRef.current(levelRef.current, foundRef.current, false);
      }
      onExit();
      return;
    }
    // Geri sayım bitmiş ve oyun aktifken çıkış yapmak 1 can kaybına yol açar
    if (status === "playing" && countdown === null) {
      setShowExitModal(true);
    } else {
      onExit();
    }
  }, [status, daily, countdown, onExit, setShowExitModal]);

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
      if (status === "playing" && countdown === null) {
        setShowExitModal(true);
        return true;
      }
      handleExitPress();
      return true;
    };

    const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => sub.remove();
    // handleExitPress yalnızca listelenen bağımlılıkları okur; ayrıca listeye eklenmesi gerekmez
  }, [isPaused, showExitModal, status, countdown, daily, onExit, handleExitPress]);

  const handleRetry = () => {
    if (typeof lives === "number" && lives <= 0) {
      if (onOpenLivesModal) {
        onOpenLivesModal();
      } else {
        onExit();
      }
      return;
    }
    // Eğer bölüm daha önce kazanılmadan yenileniyorsa 1 can kaybettir
    if (status === "lost") {
      onCompleteRef.current(levelRef.current, foundRef.current, false);
    }
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
    hasFinishedRef.current = false;
    setTimeBonusText(null);
    setComboStreak(0);
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
  const { foundCells, foundCellColors } = useMemo(() => {
    const cells = new Set(foundPaths.flat());
    const colors = new Map<number, { bg: string; border: string; letterText: string }>();
    found.forEach((word, wordIndex) => {
      const palette = APP_WORD_PALETTE[wordIndex % APP_WORD_PALETTE.length]!;
      const path = foundPaths[wordIndex];
      if (path) {
        path.forEach((cell) => {
          colors.set(cell, { bg: palette.bg, border: palette.border, letterText: palette.letterText });
        });
      }
    });
    return { foundCells: cells, foundCellColors: colors };
  }, [foundPaths, found]);

  const solutionColors =
    status === "lost" ? solutionColorByCell(challenge) : new Map<number, number>();

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const isUrgent = seconds <= 15 && status === "playing";

  return (
    <View style={{ flex: 1, backgroundColor: activeTheme.background }}>
      {/* Pulsing Red Vignette for Urgent Time (seconds <= 8) */}
      {seconds <= 8 && status === "playing" && (
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

      {/* Dopamine Floating Combo Banner */}
      <FloatingCombo comboCount={comboStreak} />

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
            safeWatchAd(() => setRadarCharges(1));
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
        <FloatingTimeBonus text={timeBonusText} />
      </View>
      <Pressable
        onPress={() => {
          triggerHapticSelection();
          setIsPaused(true);
        }}
        style={({ pressed }) => [
          styles.pauseBtn,
          { backgroundColor: activeTheme.surface, borderColor: activeTheme.accentColor },
          pressed && { opacity: 0.8 },
        ]}
      >
        <Text style={{ fontSize: 13 }}>⏸️</Text>
      </Pressable>
    </View>
    <View style={styles.progress}>
      <Text style={styles.progressLabel}>{found.length} / {challenge.words.length} KELİME</Text>
      {comboStreak >= 2 ? (
        <View style={{ backgroundColor: "rgba(245, 158, 11, 0.25)", borderWidth: 1, borderColor: "#DCE1D7", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Text style={{ fontSize: 11 }}>🔥</Text>
          <Text style={{ color: "#9b7616", fontSize: 10, fontWeight: "900" }}>ATEŞLİ KOMBO x{comboStreak}</Text>
        </View>
      ) : null}
      <Text style={[styles.progressMeta, { color: activeTheme.headerText }]}>{challenge.subtitle}</Text>
    </View>
    <Animated.View
      ref={boardRef}
      onLayout={measureBoard}
      style={[
        styles.board,
        {
          width: boardWidth,
          height: boardWidth,
          position: "relative",
          backgroundColor: activeTheme.background,
          borderColor: boardSkinColor ? `${boardSkinColor}99` : activeTheme.cellBorder,
          borderWidth: boardSkinColor ? 2.5 : 2,
          shadowColor: boardSkinColor || activeTheme.accentColor,
          shadowOpacity: boardSkinColor ? 0.35 : 0.2,
          shadowRadius: 4,
          elevation: 2,
          transform: [{ translateX: shakeAnim }],
        },
        isUrgent && styles.boardUrgent,
      ]}
    >
      {/* Floating Animated Score Burst (+150 ⭐ / +320 🔥) */}
      <FloatingScoreBurst text={scoreBurstText} />

      {/* Countdown Blur Shield to prevent pre-reading letters */}
      <BoardCountdownShield countdown={countdown} theme="light" />

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
            color={boardSkinColor || activeTheme.accentColor}
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

      {/* Oyun tamamlandığında veya süre bittiğinde: Tahtadaki TÜM kelimelerin rotalarını ve yön oklarını hemen çiz */}
      {status !== "playing" && challenge.words.map((word, wIdx) => {
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
        const solutionColor = solutionColors.get(index);
        const isSolution = solutionColor !== undefined;
        const isRadar = radarHighlights.has(index);
        const isInspected = Boolean(status !== "playing" && inspectedPath?.includes(index));
        const inspectedOrder = (status !== "playing" && inspectedPath) ? inspectedPath.indexOf(index) : -1;
        const isInspectedStart = status !== "playing" && inspectedOrder === 0;
        const isInspectedEnd = (status !== "playing" && inspectedPath) ? inspectedOrder === inspectedPath.length - 1 : false;
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
                isInspectedStart && {
                  borderColor: "#DCE1D7",
                  borderWidth: 2.5,
                  shadowColor: "#293541",
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  elevation: 2,
                },
                isInspectedEnd && {
                  borderColor: "#DCE1D7",
                  borderWidth: 2.5,
                  shadowColor: "#293541",
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  elevation: 2,
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
                  isSelected && { color: "#78350F" },
                  feedback === "accepted" && isSelected && { color: "#065F46" },
                  feedback === "invalid" && isSelected && { color: "#991B1B" },
                  foundColor && !isSolution && { color: foundColor.letterText },
                  isRadar && styles.letterRadar,
                  countdown !== null && countdown > 0 && { opacity: 0 },
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
              {!isSelected && inspectedOrder >= 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: challenge.size >= 8 ? 1 : 2,
                    right: challenge.size >= 8 ? 1 : 2,
                    backgroundColor: isInspectedStart ? "#F0F5ED" : isInspectedEnd ? "#f0a4a4" : "#F0F5ED",
                    borderRadius: challenge.size >= 8 ? 4 : 6,
                    minWidth: challenge.size >= 8 ? 12 : 16,
                    height: challenge.size >= 8 ? 12 : 16,
                    justifyContent: "center",
                    alignItems: "center",
                    paddingHorizontal: 2,
                    borderWidth: 1,
                    borderColor: isInspectedStart ? "#DCE1D7" : isInspectedEnd ? "#DCE1D7" : "#DCE1D7",
                    zIndex: 6,
                  }}
                >
                  <Text
                    selectable={false}
                    style={{
                      color: "#293541",
                      fontSize: challenge.size >= 8 ? 7 : 8,
                      fontWeight: "900",
                      textAlign: "center",
                    }}
                  >
                    {isInspectedStart ? "1" : isInspectedEnd ? "✓" : inspectedOrder + 1}
                  </Text>
                </View>
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
      <View onPointerDown={(e: any) => { if (e.target?.setPointerCapture) e.target.setPointerCapture(e.pointerId ?? e.nativeEvent?.pointerId); handleGestureStart(e); }} onPointerMove={handleGestureMove} onPointerUp={handleGestureEnd} onPointerCancel={() => { pointerActive.current = false; setIsSelecting(false); }} onTouchStart={handleGestureStart} onTouchMove={handleGestureMove} onTouchEnd={handleGestureEnd} style={StyleSheet.absoluteFill} />
    </Animated.View>
    <View style={[styles.tray, { backgroundColor: activeTheme.trayBackground, borderColor: activeTheme.cellBorder }, feedback === "invalid" && styles.trayInvalid, feedback === "accepted" && styles.trayAccepted]}>
      <Text style={styles.trayLabel}>
        {feedback === "invalid" ? ">> BAĞLANTI HATASI" : feedback === "accepted" ? ">> ŞİFRE ÇÖZÜLDÜ" : selected.length >= 3 ? ">> BAĞLANTI SAĞLANDI" : "BİR KELİME BUL"}
      </Text>
      <Text style={styles.word}>
        {selected.length > 0 ? `[ ${activeWord.split("").join(" - ")} ]` : "—"}
      </Text>
      <Text style={styles.hint}>
        {feedback === "invalid" ? "Kırmızı rota birazdan temizlenecek." : "Yalnız yatay ve dikey ilerle; geri dönmek için önceki hücreye sürükle."}
      </Text>
    </View>

    {progress && (
      <View style={{ marginVertical: 8, alignItems: "center" }}>
        <GameBoosters
          progress={progress}
          setProgress={setProgress}
          syncProgressToCloud={syncProgressToCloud}
          onUseHint={handleUseHintBooster}
          onUseFreeze={handleUseFreezeBooster}
          onUseShuffle={handleUseShuffleBooster}
          disabled={status !== "playing"}
        />
      </View>
    )}

    {/* Aktif Kelime Rotası ve Harf Yön Akışı Kartı */}
    {selectedWordInfo && inspectedPath && (
      <View style={[styles.activeRouteCard, { borderColor: inspectedColor || activeTheme.accentColor }]}>
        <View style={styles.activeRouteHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={{ fontSize: 14 }}>🧭</Text>
            <Text style={styles.activeRouteTitle}>KELİME ROTASI & YÖNÜ</Text>
            <View style={[styles.activeRouteBadge, { backgroundColor: inspectedColor ? `${inspectedColor}25` : "rgba(45, 212, 191, 0.2)" }]}>
              <Text style={[styles.activeRouteBadgeText, { color: inspectedColor || activeTheme.accentColor }]}>
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
                  idx === 0 && { color: "#279f73" },
                  idx === arr.length - 1 && { color: "#bf5757" },
                ]}>
                  {idx === 0 ? "BAŞLANGIÇ" : idx === arr.length - 1 ? "BİTİŞ" : idx + 1}
                </Text>
              </View>
              {idx < arr.length - 1 && (
                <Text style={[styles.activeRouteArrow, { color: inspectedColor || activeTheme.accentColor }]}>➔</Text>
              )}
            </React.Fragment>
          ))}
        </View>

        {selectedWordInfo ? (
          <View style={styles.activeRouteDefBox}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ fontSize: 13 }}>📖</Text>
                <Text style={[styles.activeRouteDefLabel, { color: inspectedColor || activeTheme.accentColor }]}>TDK SÖZLÜK ANLAMI</Text>
                {selectedWordInfo.type ? (
                  <View style={{ backgroundColor: "rgba(212, 180, 90, 0.2)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: "#DCE1D7" }}>
                    <Text style={{ color: "#8c7540", fontSize: 9, fontWeight: "800" }}>{selectedWordInfo.type}</Text>
                  </View>
                ) : null}
              </View>
              {selectedWordInfo.loading && (
                <ActivityIndicator size="small" color={inspectedColor || activeTheme.accentColor} style={{ transform: [{ scale: 0.7 }] }} />
              )}
            </View>
            <Text style={styles.activeRouteDefText}>{selectedWordInfo.definition}</Text>
            {selectedWordInfo.example ? (
              <View style={{ marginTop: 6, padding: 6, backgroundColor: "rgba(255, 255, 255, 0.05)", borderRadius: 8, borderLeftWidth: 3, borderLeftColor: inspectedColor || activeTheme.accentColor }}>
                <Text style={{ color: "#293541", fontSize: 11, fontStyle: "italic" }}>
                  Örnek: &quot;{selectedWordInfo.example}&quot;
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    )}

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
                inspectWord(word, path || null, palette.border);
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
      <>
        <View style={[styles.result, boardSkinColor && { borderColor: `${boardSkinColor}88`, shadowColor: boardSkinColor }]}>
          <VictoryBanner title={daily ? "Günün yıldızı sensin!" : "Seviye senin!"} subtitle={`${found.length} kelime buldun · ${seconds} saniye artırdın`} />
        
        {daily && (
          <View style={[styles.chestCard, { borderColor: activeTheme.accentColor }]}>
            {chestState === "closed" && (
              <>
                <Text style={styles.chestIcon}>💾</Text>
                <Text style={styles.chestTitle}>SÜRPRİZ KUTUSU</Text>
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
                <Text style={[styles.chestTitle, { color: "#349d5a" }]}>DEŞİFRE BAŞARILI!</Text>
                <Text style={styles.chestSuccessReward}>
                  {doubleXpEarned
                    ? "VERİ KATLANDI: +300 SEZON XP & +1 RADAR HAKKI!"
                    : "VERİ ALINDI: +150 SEZON XP & +1 RADAR HAKKI!"
                  }
                </Text>
                {!doubleXpEarned && (
                  <Pressable
                    onPress={() => safeWatchAd(() => {
                      setDoubleXpEarned(true);
                      gameSfx.victory();
                      triggerHapticSuccess();
                      onBonusReward?.(150, 1);
                    })}
                    style={[styles.chestButton, { backgroundColor: "#ffeb94", marginTop: 8 }]}
                  >
                    <Text style={styles.chestButtonText}>🎁 REKLAMLA ÖDÜLÜ 2X YAP</Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
        )}

        <View style={{ width: "100%", gap: 8, marginTop: 12 }}>
          {!daily && level < MAX_SOLO_LEVEL && (
            <Pressable
              onPress={() => {
                triggerHapticSelection();
                if (onAdvanceLevel) onAdvanceLevel();
                else onNext();
              }}
              style={({ pressed }) => [
                styles.action,
                { backgroundColor: activeTheme.accentColor, marginTop: 0 },
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Text style={styles.actionText}>▶️ SONRAKİ BÖLÜM (BÖLÜM {level + 1})</Text>
              <Text style={styles.actionArrow}>→</Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => {
              triggerHapticSelection();
              if (daily) onExit();
              else onNext();
            }}
            style={({ pressed }) => [
              styles.action,
              {
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                borderWidth: 1,
                borderColor: "#DCE1D7",
                marginTop: 0,
              },
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
          >
            <Text style={[styles.actionText, { color: "#293541" }]}>
              {daily ? "🏠 KOMUTA MERKEZİNE DÖN" : "🗺️ SEVİYE HARİTASINA DÖN"}
            </Text>
            <Text style={[styles.actionArrow, { color: "#293541" }]}>‹</Text>
          </Pressable>
        </View>
      </View>
      </>
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
                  inspectWord(word, path || null, palette.border);
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
            onPress={() => safeWatchAd(() => { setSeconds(20); setStatus("playing"); setRevived(true); })}
            style={[styles.action, { backgroundColor: "#aef5e0", marginTop: 12 }]}
          >
            <Text style={[styles.actionText, { color: "#293541" }]}>💾 SÜREYİ KURTAR (+20sn REKLAM)</Text>
            <Text style={[styles.actionArrow, { color: "#293541" }]}>⚡</Text>
          </Pressable>
        )}

        {daily ? (
          <Pressable
            onPress={() => {
              if (!hasFinishedRef.current) {
                hasFinishedRef.current = true;
                onCompleteRef.current(levelRef.current, foundRef.current, false);
              }
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
            <Pressable onPress={onExit} style={[styles.action, { backgroundColor: "rgba(255, 100, 124, 0.2)", borderWidth: 1, borderColor: "#DCE1D7" }]}><Text style={[styles.actionText, { color: "#293541" }]}>HARİTAYA DÖN</Text><Text style={[styles.actionArrow, { color: "#293541" }]}>→</Text></Pressable>
          </>
        )}
        </View>
      )}
      </ScrollView>
      <VictoryEffectOverlay effectId={selectedVictoryEffect} visible={status === "won"}
        title={daily ? "Günlük rota tamam!" : "Seviye senin!"}
        subtitle={`${found.length} kelimeyi de buldun. Harika iş!`} />



      {isPaused && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setIsPaused(false)}>
          <View style={styles.pauseOverlay}>
            <View style={styles.pauseCard}>
              <Text style={{ fontSize: 44, marginBottom: 6 }}>⏸️</Text>
              <Text style={styles.pauseTitle}>OYUN DURAKLATILDI</Text>
              <Text style={styles.pauseSub}>
                Süren donduruldu. Rahatça mola verebilirsin, can kaybı yaşamadan devam edebilirsin!
              </Text>
              <Pressable
                onPress={() => {
                  triggerHapticSelection();
                  setIsPaused(false);
                }}
                style={[styles.resumeBtn, { backgroundColor: activeTheme.accentColor }]}
              >
                <Text style={styles.resumeBtnText}>▶️ DEVAM ET ({seconds}s)</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  const nextState = !getSfxEnabled();
                  setSfxEnabled(nextState);
                  setSoundOn(nextState);
                  setProgress?.((curr) => ({ ...curr, sfxEnabled: nextState }));
                  AsyncStorage.setItem("kelime-patlat:sfx-enabled", String(nextState)).catch(() => undefined);
                  triggerHapticSelection();
                }}
                style={styles.pauseSoundBtn}
              >
                <Text style={styles.pauseSoundBtnText}>{soundOn ? "🔊 OYUN SESİ: AÇIK" : "🔇 OYUN SESİ: KAPALI"}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setIsPaused(false);
                  handleExitPress();
                }}
                style={styles.pauseExitBtn}
              >
                <Text style={styles.pauseExitBtnText}>‹ SEVİYEDEN AYRIL</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      <ModernAlertModal
        alert={showExitModal ? {
          icon: "⚠️",
          kicker: daily ? "GÜNÜN ROTASI" : "TEK OYUNCULU MOD",
          title: daily ? "Günün Rotasından Ayrıl" : "Seviyeden Ayrıl (-1 Can)",
          message: daily
            ? "Günün rotasından çıkmak istediğinize emin misiniz? Günlük tek oynama hakkınızı korumak için oyunu tamamlamayı deneyin."
            : "Mevcut seviyeden ayrılmak istediğinize emin misiniz? Oyunu terk ederseniz 1 Can kaybedersiniz.",
          accentColor: "#FF647C",
          primaryButton: {
            text: "DEVAM ET",
            color: activeTheme.accentColor || "#2a9c7a",
            onPress: () => setShowExitModal(false),
          },
          secondaryButton: {
            text: daily ? "AYRIL" : "AYRIL (-1 CAN)",
            onPress: () => {
              setShowExitModal(false);
              if (!hasFinishedRef.current) {
                hasFinishedRef.current = true;
                onCompleteRef.current(levelRef.current, foundRef.current, false);
              }
              onExit();
            },
          },
        } : null}
        onDismiss={() => setShowExitModal(false)}
      />

      <GameCountdownOverlay
        countdown={countdown}
        title={daily ? "GÜNLÜK BULMACA" : "SOLO MÜCADELE"}
        subtitle="Kelimeleri birleştir, rekoru kır!"
        icon={daily ? "📅" : "🎯"}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 28 },
  header: { height: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  exit: { width: 35, height: 35, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "#E2E8F0", shadowColor: "#293541", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  exitText: { color: "#293541", fontSize: 23, lineHeight: 23 },
  kicker: { fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },
  title: { color: "#1E293B", fontSize: 14, fontWeight: "900", marginTop: 2 },
  timer: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1.5, position: "relative", overflow: "visible", shadowColor: "#293541", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  timerUrgent: { backgroundColor: "#FEE2E2", borderColor: "#EF4444", shadowColor: "#EF4444", shadowOpacity: 0.35, shadowRadius: 6, elevation: 4 },
  timerText: { color: "#DC2626", fontSize: 13, fontWeight: "900" },
  radarButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1.5, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  radarUsedBtn: { opacity: 0.6 },
  radarText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  bonusText: { position: "absolute", top: -18, right: 0, color: "#10B981", fontSize: 11, fontWeight: "900" },
  progress: { alignItems: "center", paddingVertical: 12 },
  progressLabel: { fontSize: 20, fontWeight: "900", letterSpacing: 0.5 },
  progressMeta: { fontSize: 9, fontWeight: "800", marginTop: 3 },
  board: { alignSelf: "center", flexDirection: "row", flexWrap: "wrap", borderWidth: 2, borderRadius: 24, padding: 4, userSelect: "none", touchAction: "none", shadowColor: "#293541", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 } as any,
  boardUrgent: { borderColor: "#EF4444", shadowColor: "#EF4444", shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  cellWrap: { padding: 5 },
  cell: { flex: 1, borderRadius: 12, borderBottomWidth: 3.5, borderWidth: 1.5, alignItems: "center", justifyContent: "center", aspectRatio: 1, shadowColor: "#293541", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  cellSelected: { backgroundColor: "#FEF3C7", borderColor: "#F59E0B", borderBottomColor: "#D97706", borderWidth: 2, shadowColor: "#F59E0B", shadowOpacity: 0.4, shadowRadius: 6, elevation: 4 },
  cellTail: { backgroundColor: "#FDE68A", borderColor: "#D97706", borderBottomColor: "#B45309", borderWidth: 2.5, shadowColor: "#D97706", shadowOpacity: 0.6, shadowRadius: 8, elevation: 6 },
  cellInvalid: { backgroundColor: "#FEE2E2", borderColor: "#EF4444", borderBottomColor: "#DC2626", borderWidth: 2, shadowColor: "#EF4444", shadowOpacity: 0.4, shadowRadius: 5, elevation: 4 },
  cellAccepted: { backgroundColor: "#D1FAE5", borderColor: "#10B981", borderBottomColor: "#059669", borderWidth: 2, shadowColor: "#10B981", shadowOpacity: 0.5, shadowRadius: 6, elevation: 5 },
  cellFound: { backgroundColor: "#F1F5F9", borderColor: "#CBD5E1", borderBottomColor: "#94A3B8" },
  cellRadar: { backgroundColor: "#FEF3C7", borderColor: "#F59E0B", borderWidth: 2 },
  check: { position: "absolute", left: 4, bottom: 2, color: "#293541", fontSize: 9, fontWeight: "900" },
  solutionMark: { position: "absolute", left: 5, bottom: 1, color: "#293541", fontSize: 13, fontWeight: "900" },
  letter: { color: "#1E293B", fontSize: 25, fontWeight: "900" },
  letterMedium: { fontSize: 21 },
  letterSmall: { fontSize: 17 },
  letterExtraSmall: { fontSize: 13 },
  letterRadar: { color: "#B45309" },
  order: { position: "absolute", top: 3, right: 4, color: "#B45309", fontSize: 8, fontWeight: "900" },
  tray: { minHeight: 77, marginTop: 12, borderRadius: 20, borderWidth: 2, borderBottomWidth: 4, borderColor: "#E2E8F0", borderBottomColor: "#CBD5E1", alignItems: "center", justifyContent: "center", paddingHorizontal: 18, shadowColor: "#293541", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  trayInvalid: { backgroundColor: "#FEE2E2", borderColor: "#EF4444", borderBottomColor: "#DC2626" },
  trayAccepted: { backgroundColor: "#D1FAE5", borderColor: "#10B981", borderBottomColor: "#059669" },
  trayLabel: { color: "#64748B", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  word: { color: "#0F172A", fontSize: 20, fontWeight: "900", letterSpacing: 0.5, marginTop: 3 },
  hint: { color: "#64748B", fontSize: 9, textAlign: "center", marginTop: 3 },
  found: { marginTop: 10, padding: 11, borderRadius: 16, borderWidth: 1.5, borderColor: "#E2E8F0", shadowColor: "#293541", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  foundLabel: { fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 7 },
  tag: { borderRadius: 9, paddingHorizontal: 9, paddingVertical: 4, shadowColor: "#293541", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
  tagText: { color: "#1E293B", fontSize: 10, fontWeight: "900" },
  empty: { color: "#64748B", fontSize: 10 },
  result: { marginTop: 10, padding: 14, borderRadius: 18, backgroundColor: "#FEF2F2", borderWidth: 1.5, borderColor: "#FCA5A5", alignItems: "center" },
  resultTitle: { color: "#991B1B", fontSize: 16, fontWeight: "900" },
  resultCopy: { color: "#7F1D1D", fontSize: 11, textAlign: "center", marginTop: 4 },
  solutionLegend: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6, marginTop: 9 },
  solutionTag: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  solutionTagText: { color: "#1E293B", fontSize: 9, fontWeight: "900", letterSpacing: 0.4 },
  action: { height: 44, alignSelf: "stretch", marginTop: 12, borderRadius: 14, paddingHorizontal: 14, backgroundColor: "#FEE2E2", borderWidth: 1, borderColor: "#FCA5A5", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  actionText: { color: "#991B1B", fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },
  actionArrow: { color: "#991B1B", fontSize: 20, fontWeight: "900" },
  activeRouteCard: { marginTop: 10, borderRadius: 18, backgroundColor: "#F0F5ED", borderWidth: 1.5, borderColor: "#DCE1D7", padding: 14, shadowColor: "#293541", shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  activeRouteHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  activeRouteTitle: { color: "#293541", fontSize: 12, fontWeight: "900", letterSpacing: 0.5 },
  activeRouteBadge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: "#DCE1D7" },
  activeRouteBadgeText: { fontSize: 10, fontWeight: "900" },
  activeRouteClose: { backgroundColor: "rgba(239, 68, 68, 0.15)", borderWidth: 1, borderColor: "#DCE1D7", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  activeRouteCloseText: { color: "#9c6666", fontSize: 10, fontWeight: "800" },
  activeRouteFlow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 5, paddingVertical: 4 },
  activeRouteChip: { flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#EDF4FC", borderWidth: 1, borderColor: "#DCE1D7", borderRadius: 10, minWidth: 36, paddingHorizontal: 6, paddingVertical: 4 },
  activeRouteChipStart: { backgroundColor: "#F0F5ED", borderColor: "#DCE1D7", borderWidth: 1.5 },
  activeRouteChipEnd: { backgroundColor: "rgba(220, 38, 38, 0.25)", borderColor: "#DCE1D7", borderWidth: 1.5 },
  activeRouteChipText: { color: "#293541", fontSize: 14, fontWeight: "900" },
  activeRouteChipTextStart: { color: "#279f73" },
  activeRouteChipTextEnd: { color: "#bf5757" },
  activeRouteChipSub: { color: "#293541", fontSize: 8, fontWeight: "800", marginTop: 1 },
  activeRouteArrow: { fontSize: 14, fontWeight: "900", marginHorizontal: 1 },
  activeRouteDefBox: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#DCE1D7" },
  activeRouteDefLabel: { color: "#219d8d", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  activeRouteDefText: { color: "#293541", fontSize: 12, lineHeight: 18, marginTop: 2, fontWeight: "500" },
  modalOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(35,48,59,0.42)", justifyContent: "center", alignItems: "center", zIndex: 100 },
  modalContent: { width: "86%", borderRadius: 20, borderWidth: 1.5, padding: 22, alignItems: "center", shadowColor: "#293541", shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  modalTitle: { fontSize: 22, fontWeight: "900", letterSpacing: 0.5, marginBottom: 12 },
  modalBody: { color: "#293541", fontSize: 14, lineHeight: 21, textAlign: "center", marginBottom: 20, fontWeight: "600" },
  modalCloseButton: { borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  modalCloseText: { color: "#293541", fontSize: 12, fontWeight: "900", letterSpacing: 0.5 },
  chestCard: { width: "100%", marginTop: 12, padding: 16, borderRadius: 16, borderStyle: "dashed", borderWidth: 1.5, borderColor: "#E6D5A8", backgroundColor: "#FFFBF0", alignItems: "center" },
  chestIcon: { fontSize: 36, marginBottom: 8 },
  chestTitle: { color: "#293541", fontSize: 11, fontWeight: "900", letterSpacing: 0.5, textAlign: "center" },
  chestCopy: { color: "#293541", fontSize: 8, textAlign: "center", marginTop: 4, lineHeight: 11, paddingHorizontal: 12 },
  chestButton: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  chestButtonText: { color: "#293541", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  chestProgress: { color: "#98732c", fontSize: 10, fontWeight: "900", fontFamily: "monospace", marginTop: 8, letterSpacing: 0.5 },
  chestSuccessReward: { color: "#293541", fontSize: 9, fontWeight: "900", letterSpacing: 0.4, textAlign: "center", marginTop: 6 },
  pauseBtn: { width: 35, height: 35, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center", marginLeft: 6 },
  pauseOverlay: { flex: 1, backgroundColor: "rgba(35, 48, 59, 0.55)", alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  pauseCard: { width: "100%", maxWidth: 360, maxHeight: "85%", backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: "#DCE1D7", borderRadius: 24, padding: 24, alignItems: "center", overflow: "hidden", shadowColor: "#293541", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 6 },
  pauseTitle: { color: "#293541", fontSize: 18, fontWeight: "900", letterSpacing: 0.5, marginBottom: 8 },
  pauseSub: { color: "#293541", fontSize: 12, textAlign: "center", lineHeight: 18, marginBottom: 20 },
  resumeBtn: { width: "100%", height: 46, borderRadius: 14, backgroundColor: "#FFD66E", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  resumeBtnText: { color: "#293541", fontSize: 12, fontWeight: "900", letterSpacing: 0.5 },
  pauseSoundBtn: { width: "100%", height: 42, borderRadius: 14, borderWidth: 1.5, borderColor: "#DCE1D7", backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  pauseSoundBtnText: { color: "#293541", fontSize: 11, fontWeight: "900", letterSpacing: 0.4 },
  pauseExitBtn: { width: "100%", height: 42, borderRadius: 14, borderWidth: 1.5, borderColor: "#DCE1D7", backgroundColor: "#F7F5EE", alignItems: "center", justifyContent: "center" },
  pauseExitBtnText: { color: "#293541", fontSize: 11, fontWeight: "800", letterSpacing: 0.4 },
  adOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(35,48,59,0.42)", justifyContent: "center", alignItems: "center", zIndex: 300 },
  adTitle: { color: "#8c763b", fontSize: 10, fontWeight: "900", letterSpacing: 0.5, marginBottom: 12 },
  adSpinner: { color: "#293541", fontSize: 13, fontWeight: "900", textAlign: "center", paddingHorizontal: 28, lineHeight: 18 },
  adCountdown: { color: "#2a9c7a", fontSize: 48, fontWeight: "900", marginTop: 24, textShadowColor: "transparent", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 0 }
});
