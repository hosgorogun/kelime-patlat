import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, BackHandler, ScrollView, StyleSheet, useWindowDimensions, View, Animated, Share } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { advanceSelection, wordFromSelection } from "@/shared/game";
import { isEqualTr } from "@/shared/tr-utils";
import { createSoloBoard, solutionColorByCell, APP_WORD_PALETTE } from "@/shared/solo";
import { type WordTheme } from "@/shared/word-catalog";
import { getWordDefinition, fetchWordDetail, getCachedWordDetail, isValidTurkishWord } from "@/shared/dictionary";
import { getThemeForLevel } from "@/shared/themes";
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
  getHapticsEnabled,
  setHapticsEnabled,
} from "@/shared/audio-haptics";
import { gameSfx } from "@/lib/game-sfx";
import { VictoryEffectOverlay } from "../game/victory-effect-overlay";
import { GameCountdownOverlay } from "../game/game-countdown-overlay";
import { FloatingCombo } from "../game/game-boosters";
import { type PlayerProgress, getDayId, getCalculatedLives } from "@/shared/progression";
import { styles } from "./solo-challenge.styles";
import { SoloWordRouteCard } from "./solo-word-route-card";
import { SoloPauseModal } from "./solo-pause-modal";
import { SoloWonView, SoloLostView } from "./solo-result-views";
import { SoloHeader } from "./solo-header";
import { SoloWordTray } from "./solo-word-tray";
import { SoloFoundWords } from "./solo-found-words";
import { SoloExitModal } from "./solo-exit-modal";
import { SoloBoardGrid } from "./solo-board-grid";
import { ModernAlertModal } from "../modals/modern-alert-modal";
import { MAX_SOLO_LEVEL } from "@/shared/solo";

type Feedback = "idle" | "invalid" | "accepted" | "bonus";

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
  const { width, height } = useWindowDimensions();
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
  const [bonusWords, setBonusWords] = useState<string[]>([]);
  const [foundPaths, setFoundPaths] = useState<number[][]>([]);
  const [inspectedPath, setInspectedPath] = useState<number[] | null>(null);
  const [inspectedColor, setInspectedColor] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(challenge.timeLimit);
  const [feedback, setFeedback] = useState<Feedback>("idle");
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [isSelecting, setIsSelecting] = useState(false);
  const [radarCooldown, setRadarCooldown] = useState(0);
  const [radarCharges, setRadarCharges] = useState(radarChargesBonus || 0);
  // Bonus şarj değişimini takip etmek için referans (reset effect'in sonsuz döngüye girmesini önler)
  const radarBonusRef = useRef(radarChargesBonus);
  radarBonusRef.current = radarChargesBonus;

  useEffect(() => {
    // Bonus şarj sayısı arttığında mevcut şarjlara ekle (azaldığında dokunma)
    setRadarCharges((current) => Math.max(current, radarChargesBonus || 0));
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
    if (selectedWordInfo?.word && isEqualTr(selectedWordInfo.word, word)) {
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

    fetchWordDetail(word).then((detail) => {
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
    }).catch(() => {
      if (!isMountedRef.current) return;
      setSelectedWordInfo((prev) => prev && prev.word === word ? { ...prev, loading: false } : prev);
    });
  };
  const [countdown, setCountdown] = useState<number | null>(3);
  const [chestState, setChestState] = useState<"closed" | "decrypting" | "opened">("closed");
  const [decryptProgress, setDecryptProgress] = useState(0);
  const [decryptText, setDecryptText] = useState("");
  const [showVictoryModal, setShowVictoryModal] = useState(false);

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

  // Günlük en fazla 3 kez reklamla kurtarma hakkı sınırı (Anti-abuse kotası)
  const todayId = getDayId();
  const currentDailyRevives = (progress?.dailyRevivesDate === todayId ? progress.dailyRevivesCount : 0) ?? 0;
  const remainingDailyRevives = Math.max(0, 3 - currentDailyRevives);

  const handleReviveWithAd = () => {
    if (remainingDailyRevives <= 0) return;
    safeWatchAd(() => {
      setSeconds(20);
      setStatus("playing");
      setRevived(true);
      hasFinishedRef.current = false;
      setCountdown(1); // 1 saniyelik odaklanma payı verir
      triggerHapticSuccess();
      playSuccessSound();
      setTimeBonusText("⚡ +20sn SÜRE YENİLENDİ! ⚡");
      const reviveTimer = setTimeout(() => setTimeBonusText(null), 2500);
      particleTimers.current.push(reviveTimer);
      if (setProgress) {
        setProgress((curr) => {
          const isSameDay = curr.dailyRevivesDate === todayId;
          const nextCount = (isSameDay ? (curr.dailyRevivesCount ?? 0) : 0) + 1;
          // Reklam izleyip süreyi kurtardığı için süre bitiminde düşülen 1 can geri iade edilir
          const calc = getCalculatedLives(curr);
          const restoredLives = Math.min(5, calc.lives + 1);
          const updated = {
            ...curr,
            lives: restoredLives,
            lastLifeRegenTimestamp: calc.lives >= 5 ? Date.now() : curr.lastLifeRegenTimestamp,
            dailyRevivesDate: todayId,
            dailyRevivesCount: nextCount,
          };
          void syncProgressToCloud?.(updated);
          return updated;
        });
      }
    });
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
  
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string; type?: "ice" | "bomb" | "gold"; anim: Animated.ValueXY }[]>([]);

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
      const tileType = challenge.specialTiles?.[cellIndex]?.type;

      if (tileType === "bomb") {
        triggerShake();
      }
      
      for (let i = 0; i < 8; i++) {
        const anim = new Animated.ValueXY({ x: 0, y: 0 });
        const id = Math.random();
        newParticles.push({ id, x, y, color: activeTheme.accentColor, type: tileType, anim });
        
        const angle = Math.random() * Math.PI * 2;
        const speed = (tileType === "bomb" ? 25 : 15) + Math.random() * 35;
        
        Animated.timing(anim, {
          toValue: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
          duration: 380,
          useNativeDriver: true
        }).start();
      }
    });

    setParticles((prev) => [...prev, ...newParticles]);
    const cleanupTimer = setTimeout(() => {
      setParticles((prev) => prev.filter(p => !newParticles.includes(p)));
    }, 400);
    particleTimers.current.push(cleanupTimer);
  };
  const particleTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
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
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    initAudio().catch(() => undefined);
    return () => {
      isMountedRef.current = false;
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
  const maxBoardFromHeight = height ? Math.floor(height * 0.46) : 410;
  const boardWidth = Math.min(
    width - (challenge.size === 10 ? 20 : challenge.size === 8 ? 32 : challenge.size === 6 ? 32 : 36),
    challenge.size === 10 ? 410 : challenge.size === 8 ? 392 : challenge.size === 6 ? 374 : 356,
    maxBoardFromHeight
  );
  const activeWord = wordFromSelection(challenge.board, selected);

  useEffect(() => {
    setSelected([]); setFound([]); setFoundPaths([]); setInspectedPath(null); setInspectedColor(null); setSeconds(challenge.timeLimit); setFeedback("idle"); setStatus("playing"); setIsSelecting(false); selectionRef.current = []; pointerActive.current = false;
    setRadarCooldown(0); setRadarCharges(radarBonusRef.current || 0); setRadarHighlights(new Set()); setTimeBonusText(null); setSelectedWordInfo(null); setCountdown(3); lastWordTimeRef.current = 0;
    setChestState("closed"); setDecryptProgress(0); setDecryptText(""); setRevived(false); setDoubleXpEarned(false);
    hasFinishedRef.current = false;
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
  const bonusWordsRef = useRef(bonusWords);
  const levelRef = useRef(level);
  const dailyRef = useRef(daily);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    foundRef.current = found;
    bonusWordsRef.current = bonusWords;
    levelRef.current = level;
    dailyRef.current = daily;
  }, [onComplete, found, bonusWords, level, daily]);

  const [isPaused, setIsPaused] = useState(false);
  const [soundOn, setSoundOn] = useState(() => getSfxEnabled());
  const [hapticsOn, setHapticsOn] = useState(() => getHapticsEnabled());

  useEffect(() => {
    if (typeof progress?.sfxEnabled === "boolean") {
      setSoundOn(progress.sfxEnabled);
      setSfxEnabled(progress.sfxEnabled);
    }
    if (typeof progress?.hapticsEnabled === "boolean") {
      setHapticsOn(progress.hapticsEnabled);
      setHapticsEnabled(progress.hapticsEnabled);
    }
  }, [progress?.sfxEnabled, progress?.hapticsEnabled]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active" && status === "playing") {
        setIsPaused(true);
      }
    });
    return () => sub.remove();
  }, [status]);

  const hasFinishedRef = useRef(false);

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
      setSelectedWordInfo(null);
      setInspectedPath(null);
      setInspectedColor(null);
      triggerHapticError();
      playErrorSound();
      const allFound = [...foundRef.current, ...bonusWordsRef.current];
      onCompleteRef.current(levelRef.current, allFound, false);
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

  const showInvalid = (message: string) => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setFeedback("invalid"); triggerHapticError(); playErrorSound(); triggerShake();
    resetTimer.current = setTimeout(() => { clearSelection(); setFeedback("idle"); submitted.current = false; }, 620);
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
    const remaining = challenge.words.filter((w) => !found.some((f) => isEqualTr(f, w)));
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

  const submit = () => {
    if (submitted.current || status !== "playing") return;
    submitted.current = true;
    const path = [...selectionRef.current];
    if (path.length < 3) { showInvalid("En az üç harf bağla."); return; }
    const word = wordFromSelection(challenge.board, path);
    const matchingWord = challenge.words.find((w) => isEqualTr(w, word));
    const alreadyFound = found.some((f) => isEqualTr(f, word));

    // 1. Ekstra / Bonus Kelime Kontrolü (Hedef değilse ama geçerli bir Türkçe kelimeyse)
    if (!matchingWord) {
      const isAlreadyBonus = bonusWords.some((b) => isEqualTr(b, word));
      if (!isAlreadyBonus && isValidTurkishWord(word)) {
        // Bonus kelime bulundu!
        setBonusWords((prev) => [...prev, word]);
        setFeedback("bonus");
        triggerHapticSuccess();
        playSuccessSound(word.length);
        explodeParticles(path);

        // Ekstra çip ve süre ödülü ver
        const bonusCoinGain = 2;
        if (setProgress) {
          setProgress((curr) => {
            const updated = {
              ...curr,
              coins: (curr.coins ?? 0) + bonusCoinGain,
            };
            void syncProgressToCloud?.(updated);
            return updated;
          });
        }
        setSeconds((s) => Math.min(challenge.timeLimit, s + 3));
        setTimeBonusText(`✨ GİZLİ KELİME: ${word}! +${bonusCoinGain} ÇİP 💰`);
        const bonusTimer = setTimeout(() => setTimeBonusText(null), 1800);
        particleTimers.current.push(bonusTimer);

        setScoreBurstText(`+${word.length * 10} 🪙`);
        const scoreTimer = setTimeout(() => setScoreBurstText(null), 1200);
        particleTimers.current.push(scoreTimer);

        // Satır/sütun renkleri kalıcı olmaz: Kısa altın parlamanın ardından hücreler anında eski haline döner!
        const resetBonusTimer = setTimeout(() => {
          clearSelection();
          setFeedback("idle");
          submitted.current = false;
        }, 550);
        particleTimers.current.push(resetBonusTimer);
        return;
      }

      showInvalid(isAlreadyBonus ? "Bu bonus kelimeyi zaten buldun." : "Bu rota hedef kelimelerden biri değil.");
      return;
    }

    if (alreadyFound) { showInvalid("Bu kelimeyi zaten buldun."); return; }
    const nextFound = [...found, matchingWord];
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
        setShowVictoryModal(true);
        setSelectedWordInfo(null);
        setInspectedPath(null);
        setInspectedColor(null);
        const allFound = [...nextFound, ...bonusWordsRef.current];
        onCompleteRef.current(levelRef.current, allFound, true);
      }, 700);
      particleTimers.current.push(winTimer);
    } else {
      const feedbackTimer = setTimeout(() => {
        setFeedback("idle");
        submitted.current = false;
      }, 360);
      particleTimers.current.push(feedbackTimer);
    }
  };

  const handleExitPress = useCallback(() => {
    if (status === "lost" && daily) {
      if (!hasFinishedRef.current) {
        hasFinishedRef.current = true;
        const allFound = [...foundRef.current, ...bonusWordsRef.current];
        onCompleteRef.current(levelRef.current, allFound, false);
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

  const handleShareDaily = async () => {
    try {
      triggerHapticSuccess();
      const elapsed = Math.max(1, (challenge.timeLimit || 90) - seconds);
      const totalWords = challenge.words.length;
      const foundCount = found.length;
      const emojiRows = challenge.words.map((w) => {
        const isSolved = found.some((f) => isEqualTr(f, w));
        const len = w.length || 4;
        return isSolved ? "🟩".repeat(len) : "⬜".repeat(len);
      }).join("\n");
      const shareMessage =
        `💥 Kelime Patlat · Günün Rotası\n` +
        `⏱️ ${elapsed} saniyede ${foundCount}/${totalWords} kelime tamamlandı!\n\n` +
        `${emojiRows}\n\n` +
        `Sen de çözebilir misin? 👉 https://kelimepatlat.com`;

      await Share.share({
        message: shareMessage,
        title: "Kelime Patlat Günün Rotası",
      });
    } catch {
      // ignore
    }
  };

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
    const currentActualLives = progress ? getCalculatedLives(progress).lives : (typeof lives === "number" ? lives : 5);
    if (currentActualLives <= 0) {
      if (onOpenLivesModal) {
        onOpenLivesModal();
      } else {
        onExit();
      }
      return;
    }
    // Can kaybı zaten süre bittiğinde hasFinishedRef ile işlendi; mükerrer can kaybı önlenir
    if (!hasFinishedRef.current) {
      hasFinishedRef.current = true;
      onCompleteRef.current(levelRef.current, foundRef.current, false);
    }
    triggerHapticSelection();
    const nextVariation = variation + 1;
    const nextBoard = createSoloBoard(level, nextVariation, theme, excludeWords);
    setVariation(nextVariation);
    setRevived(false);
    setSelected([]);
    setFound([]);
    setBonusWords([]);
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
    // Harf kenarlarında hafif taşmalara (8px tolerans) izin ver
    const ox = Math.max(0, Math.min(innerSize - 1, locationX - BOARD_PAD));
    const oy = Math.max(0, Math.min(innerSize - 1, locationY - BOARD_PAD));
    if (locationX < -8 || locationX > boardWidth + 8 || locationY < -8 || locationY > boardWidth + 8) return;
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

  const solutionColors = useMemo(() => {
    return status === "lost" ? solutionColorByCell(challenge) : new Map<number, number>();
  }, [status, challenge]);

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
        <SoloHeader
          daily={daily}
          level={level}
          challengeTitle={challenge.title}
          challengeSubtitle={challenge.subtitle}
          activeTheme={activeTheme}
          radarCharges={radarCharges}
          radarCooldown={radarCooldown}
          status={status}
          seconds={seconds}
          timeBonusText={timeBonusText}
          foundCount={found.length}
          totalWords={challenge.words.length}
          comboStreak={comboStreak}
          onExitPress={handleExitPress}
          onRadarPress={() => {
            if (radarCharges > 0) {
              revealRadar();
            } else {
              safeWatchAd(() => setRadarCharges(1));
            }
          }}
          onPausePress={() => setIsPaused(true)}
        />
    <SoloBoardGrid
      boardRef={boardRef}
      measureBoard={measureBoard}
      boardWidth={boardWidth}
      activeTheme={activeTheme}
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
      solutionColors={solutionColors}
      radarHighlights={radarHighlights}
      feedback={feedback}
      particles={particles}
      onGestureStart={handleGestureStart}
      onGestureMove={handleGestureMove}
      onGestureEnd={handleGestureEnd}
      onGestureCancel={() => { pointerActive.current = false; setIsSelecting(false); }}
    />
    <SoloWordTray
      status={status}
      feedback={feedback}
      selectedLength={selected.length}
      activeWord={activeWord}
      activeTheme={activeTheme}
    />

    {/* Aktif Kelime Rotası ve Harf Yön Akışı Kartı */}
    <SoloWordRouteCard
      selectedWordInfo={selectedWordInfo}
      inspectedPath={inspectedPath}
      inspectedColor={inspectedColor}
      accentColor={activeTheme.accentColor}
      onClose={() => {
        setSelectedWordInfo(null);
        setInspectedPath(null);
        setInspectedColor(null);
      }}
    />

    <SoloFoundWords
      found={found}
      bonusWords={bonusWords}
      foundPaths={foundPaths}
      challengeRoutes={challenge.routes}
      activeTheme={activeTheme}
      onInspectWord={inspectWord}
    />
    {status === "won" && (
      <SoloWonView
        daily={daily}
        level={level}
        foundCount={found.length}
        seconds={seconds}
        boardSkinColor={boardSkinColor}
        accentColor={activeTheme.accentColor}
        handleShareDaily={handleShareDaily}
        chestState={chestState}
        decryptText={decryptText}
        decryptProgress={decryptProgress}
        doubleXpEarned={doubleXpEarned}
        startDecryption={startDecryption}
        safeWatchAd={safeWatchAd}
        setDoubleXpEarned={setDoubleXpEarned}
        onBonusReward={onBonusReward}
        onAdvanceLevel={onAdvanceLevel}
        onNext={onNext}
        onExit={onExit}
      />
    )}
    {status === "lost" && (
      <SoloLostView
        words={challenge.words}
        routes={challenge.routes}
        wordDifficulties={challenge.wordDifficulties}
        inspectWord={inspectWord}
        revived={revived}
        remainingRevives={remainingDailyRevives}
        onReviveWithAd={handleReviveWithAd}
        daily={daily}
        accentColor={activeTheme.accentColor}
        onRetry={handleRetry}
        onExit={() => {
          if (daily) {
            if (!hasFinishedRef.current) {
              hasFinishedRef.current = true;
              onCompleteRef.current(levelRef.current, foundRef.current, false);
            }
          }
          onExit();
        }}
      />
    )}
      </ScrollView>
      <VictoryEffectOverlay effectId={selectedVictoryEffect} visible={status === "won"}
        showToast={false}
        title={daily ? "Günlük rota tamam!" : "Seviye senin!"}
        subtitle={`${found.length} kelimeyi de buldun. Harika iş!`} />



      <SoloPauseModal
        visible={isPaused}
        seconds={seconds}
        accentColor={activeTheme.accentColor}
        soundOn={soundOn}
        hapticsOn={hapticsOn}
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
        onToggleHaptics={() => {
          const nextState = !getHapticsEnabled();
          setHapticsEnabled(nextState);
          setHapticsOn(nextState);
          setProgress?.((curr) => ({ ...curr, hapticsEnabled: nextState }));
          AsyncStorage.setItem("kelime-patlat:haptics-enabled", String(nextState)).catch(() => undefined);
          if (nextState) triggerHapticSelection();
        }}
        onExit={() => {
          setIsPaused(false);
          handleExitPress();
        }}
      />

      <SoloExitModal
        visible={showExitModal}
        daily={daily}
        accentColor={activeTheme.accentColor}
        onDismiss={() => setShowExitModal(false)}
        onConfirmExit={() => {
          if (!hasFinishedRef.current) {
            hasFinishedRef.current = true;
            onCompleteRef.current(levelRef.current, foundRef.current, false);
          }
          onExit();
        }}
      />

      <ModernAlertModal
        alert={
          showVictoryModal
            ? {
                icon: "🎉",
                kicker: daily ? "GÜNÜN ROTASI TAMAMLANDI" : `SEVİYE ${level} TAMAMLANDI`,
                title: "Tüm Kelimeler Çözüldü!",
                message: "Harika iş çıkardın! Bir sonraki seviyeye geçebilir ya da tahtadaki kelime rotalarını incelemek için burada kalabilirsin.",
                accentColor: activeTheme.accentColor || "#3EE8B5",
                primaryButton: !daily && level < MAX_SOLO_LEVEL
                  ? {
                      text: "SONRAKİ SEVİYE ➔",
                      color: activeTheme.accentColor || "#3EE8B5",
                      onPress: () => {
                        setShowVictoryModal(false);
                        triggerHapticSelection();
                        if (onAdvanceLevel) onAdvanceLevel();
                        else onNext();
                      },
                    }
                  : {
                      text: "ANA MENÜYE DÖN",
                      color: activeTheme.accentColor || "#3EE8B5",
                      onPress: () => {
                        setShowVictoryModal(false);
                        triggerHapticSelection();
                        onExit();
                      },
                    },
                secondaryButton: {
                  text: "TAHTAYI İNCELE 🔍",
                  onPress: () => {
                    setShowVictoryModal(false);
                    triggerHapticSelection();
                  },
                },
              }
            : null
        }
        onDismiss={() => setShowVictoryModal(false)}
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
