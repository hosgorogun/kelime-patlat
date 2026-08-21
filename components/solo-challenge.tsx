import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, Animated } from "react-native";

import { advanceSelection, wordFromSelection } from "@/shared/game";
import { createSoloBoard, SOLUTION_ROUTE_COLORS, solutionColorByCell } from "@/shared/solo";
import { type WordTheme } from "@/shared/word-catalog";
import { getThemeForLevel } from "@/shared/themes";
import { getWordDefinition } from "../shared/dictionary";
import {
  initAudio,
  playSelectionNote,
  playSuccessSound,
  playErrorSound,
  triggerHapticSelection,
  triggerHapticSuccess,
  triggerHapticError
} from "@/shared/audio-haptics";

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

export function SoloChallenge({ level, theme = "general", variationSeed, daily = false, excludeWords = [], onExit, onComplete, onNext }: { level: number; theme?: WordTheme; variationSeed?: number; daily?: boolean; excludeWords?: string[]; onExit: () => void; onComplete: (level: number, foundWords: string[]) => void; onNext: () => void }) {
  const { width } = useWindowDimensions();
  const [variation, setVariation] = useState(() => variationSeed ?? Math.floor(Math.random() * 1_000_000));
  const [retryNonce, setRetryNonce] = useState(0);
  const challenge = useMemo(() => createSoloBoard(level, variation, theme, excludeWords), [level, variation, theme, excludeWords]);
  const [selected, setSelected] = useState<number[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [foundPaths, setFoundPaths] = useState<number[][]>([]);
  const [seconds, setSeconds] = useState(challenge.timeLimit);
  const [feedback, setFeedback] = useState<Feedback>("idle");
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [isSelecting, setIsSelecting] = useState(false);
  const [radarUsed, setRadarUsed] = useState(false);
  const [radarHighlights, setRadarHighlights] = useState<Set<number>>(new Set());
  const [timeBonusText, setTimeBonusText] = useState<string | null>(null);
  const [selectedWordInfo, setSelectedWordInfo] = useState<{ word: string; definition: string } | null>(null);
  
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string; anim: Animated.ValueXY }[]>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const selectionRef = useRef<number[]>([]);
  const pointerActive = useRef(false);
  const submitted = useRef(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boardRef = useRef<any>(null);
  const boardPageX = useRef(0);
  const boardPageY = useRef(0);

  const activeTheme = useMemo(() => getThemeForLevel(level), [level]);

  useEffect(() => {
    initAudio().catch(() => undefined);
  }, []);

  const measureBoard = () => {
    boardRef.current?.measure((x: any, y: any, width: any, height: any, pageX: any, pageY: any) => {
      if (pageX !== undefined) boardPageX.current = pageX;
      if (pageY !== undefined) boardPageY.current = pageY;
    });
  };

  const getEventPageCoords = (event: any) => {
    const ne = event.nativeEvent ?? event;
    if (ne.touches && ne.touches.length > 0) {
      return { pageX: ne.touches[0].pageX, pageY: ne.touches[0].pageY };
    }
    return { pageX: ne.pageX ?? 0, pageY: ne.pageY ?? 0 };
  };
  const boardWidth = Math.min(width - (challenge.size === 8 ? 32 : challenge.size === 6 ? 32 : 36), challenge.size === 8 ? 392 : challenge.size === 6 ? 374 : 356);
  const activeWord = wordFromSelection(challenge.board, selected);

  useEffect(() => {
    setSelected([]); setFound([]); setFoundPaths([]); setSeconds(challenge.timeLimit); setFeedback("idle"); setStatus("playing"); setIsSelecting(false); selectionRef.current = []; pointerActive.current = false;
    setRadarUsed(false); setRadarHighlights(new Set()); setTimeBonusText(null); setSelectedWordInfo(null);
  }, [challenge, retryNonce]);

  useEffect(() => {
    if (status === "won") {
      explodeConfetti();
    }
  }, [status]);

  useEffect(() => {
    if (variationSeed !== undefined) setVariation(variationSeed);
  }, [variationSeed]);

  useEffect(() => {
    if (status !== "playing") return;
    const timer = setInterval(() => setSeconds((value) => {
      if (value <= 1) { clearInterval(timer); setStatus("lost"); triggerHapticError(); playErrorSound(); return 0; }
      return value - 1;
    }), 1000);
    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => () => { if (resetTimer.current) clearTimeout(resetTimer.current); }, []);

  const clearSelection = () => { selectionRef.current = []; setSelected([]); };
  
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
  const useRadar = () => {
    if (radarUsed || status !== "playing") return;
    const remaining = challenge.words.filter((w) => !found.includes(w));
    if (!remaining.length) return;
    const targetWord = remaining[0]!;
    const path = challenge.routes[targetWord];
    if (path && path.length > 0) {
      setRadarUsed(true);
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
    
    const bonus = 4;
    setSeconds((s) => Math.min(challenge.timeLimit, s + bonus));
    setTimeBonusText(`+${bonus}s`);
    setTimeout(() => setTimeBonusText(null), 1500);

    if (nextFound.length === challenge.words.length) { playSuccessSound(); triggerHapticSuccess(); setStatus("won"); onComplete(level, nextFound); }
    else { playSuccessSound(); triggerHapticSuccess(); setTimeout(() => setFeedback("idle"), 360); }
  };
  const start = (index: number) => { if (status !== "playing") return; submitted.current = false; pointerActive.current = true; setIsSelecting(true); if (resetTimer.current) clearTimeout(resetTimer.current); setFeedback("idle"); clearSelection(); triggerHapticSelection(); playSelectionNote(0); include(index); };
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
      const isFound = foundCells.has(index);
      const solutionColor = solutionColors.get(index);
      const isSolution = solutionColor !== undefined;
      if (isFound || isSolution) return;
      if (!pointerActive.current) {
        submitted.current = false;
        pointerActive.current = true;
        setIsSelecting(true);
        if (resetTimer.current) clearTimeout(resetTimer.current);
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
  const solutionColors = status === "lost" ? solutionColorByCell(challenge) : new Map<number, number>();
  const selectedSet = new Set(selected);
  const isUrgent = seconds <= 15 && status === "playing";

  return <ScrollView contentContainerStyle={[styles.content, { backgroundColor: activeTheme.background }]} scrollEnabled={!isSelecting} showsVerticalScrollIndicator={false}>
    <View style={styles.header}>
      <Pressable onPress={onExit} style={[styles.exit, { backgroundColor: activeTheme.surface }]}><Text style={styles.exitText}>×</Text></Pressable>
      <View><Text style={[styles.kicker, { color: activeTheme.headerText }]}>{daily ? "GÜNLÜK ROTA · SABİT TAHTA" : `TEK OYUNCU · SEVİYE ${level}`}</Text><Text style={styles.title}>{daily ? "GÜNÜN ROTASI" : challenge.title}</Text></View>
      <Pressable disabled={radarUsed || status !== "playing"} onPress={useRadar} style={[styles.radarButton, { backgroundColor: activeTheme.surface, borderColor: activeTheme.accentColor }, radarUsed && styles.radarUsedBtn]}>
        <Text style={styles.radarText}>{radarUsed ? "RADAR ✖" : "RADAR 👁"}</Text>
      </Pressable>
      <View style={[styles.timer, { backgroundColor: activeTheme.surface, borderColor: activeTheme.accentColor }, seconds <= 15 && styles.timerUrgent]}>
        <Text style={styles.timerText}>{seconds}s</Text>
        {timeBonusText && <Text style={styles.bonusText}>{timeBonusText}</Text>}
      </View>
    </View>
    <View style={styles.progress}><Text style={styles.progressLabel}>{found.length} / {challenge.words.length} KELİME</Text><Text style={[styles.progressMeta, { color: activeTheme.headerText }]}>{challenge.subtitle}</Text></View>
    <Animated.View ref={boardRef} onLayout={measureBoard} style={[styles.board, { width: boardWidth, height: boardWidth, position: "relative", backgroundColor: activeTheme.background, borderColor: activeTheme.cellBorder, transform: [{ translateX: shakeAnim }] }, isUrgent && styles.boardUrgent]}>
      {challenge.board.map((letter, index) => {
        const order = selected.indexOf(index);
        const isSelected = selectedSet.has(index);
        const isTail = selected.at(-1) === index;
        const isFound = foundCells.has(index);
        const solutionColor = solutionColors.get(index);
        const isSolution = solutionColor !== undefined;
        const isRadar = radarHighlights.has(index);
        return <View key={`${letter}-${index}`} pointerEvents="none" style={[styles.cellWrap, { width: `${100 / challenge.size}%`, height: `${100 / challenge.size}%` }]}><View style={[styles.cell, { backgroundColor: activeTheme.surface, borderColor: activeTheme.cellBorder }, isSolution && SOLUTION_ROUTE_COLORS[solutionColor % SOLUTION_ROUTE_COLORS.length], isFound && !isSolution && styles.cellFound, isSelected && [styles.cellSelected, { backgroundColor: activeTheme.surfaceSelected }], isTail && styles.cellTail, feedback === "invalid" && isSelected && styles.cellInvalid, feedback === "accepted" && isSelected && styles.cellAccepted, isRadar && styles.cellRadar]}><Text selectable={false} style={[styles.letter, challenge.size === 6 && styles.letterMedium, challenge.size === 8 && styles.letterSmall, isRadar && styles.letterRadar]}>{letter}</Text>{isSelected && <Text selectable={false} style={styles.order}>{order + 1}</Text>}{isFound && !isSelected && <Text selectable={false} style={styles.check}>✓</Text>}{isSolution && !isFound && <Text selectable={false} style={styles.solutionMark}>•</Text>}</View></View>;
      })}
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
      {particles.map(p => (
        <Animated.View key={p.id} style={{ position: 'absolute', left: p.x - 4, top: p.y - 4, width: 8, height: 8, borderRadius: 4, backgroundColor: p.color, transform: p.anim.getTranslateTransform() }} />
      ))}
      <View onPointerDown={(e: any) => { if (e.target?.setPointerCapture) e.target.setPointerCapture(e.pointerId ?? e.nativeEvent?.pointerId); handleGestureStart(e); }} onPointerMove={handleGestureMove} onPointerUp={handleGestureEnd} onPointerCancel={() => { pointerActive.current = false; setIsSelecting(false); }} onPointerLeave={finish} onTouchStart={handleGestureStart} onTouchMove={handleGestureMove} onTouchEnd={handleGestureEnd} style={StyleSheet.absoluteFill} />
    </Animated.View>
    <View style={[styles.tray, { backgroundColor: activeTheme.trayBackground, borderColor: activeTheme.cellBorder }, feedback === "invalid" && styles.trayInvalid, feedback === "accepted" && styles.trayAccepted]}><Text style={styles.trayLabel}>{feedback === "invalid" ? "GEÇERSİZ ROTA" : feedback === "accepted" ? "KELİME KABUL EDİLDİ" : selected.length >= 3 ? "ROTA HAZIR" : "KELİMEYİ BAĞLA"}</Text><Text style={styles.word}>{activeWord || "—"}</Text><Text style={styles.hint}>{feedback === "invalid" ? "Kırmızı rota birazdan temizlenecek." : "Yalnız yatay ve dikey ilerle; geri dönmek için önceki hücreye sürükle."}</Text></View>
    <View style={[styles.found, { backgroundColor: activeTheme.trayBackground, borderColor: activeTheme.cellBorder }]}>
      <Text style={[styles.foundLabel, { color: activeTheme.headerText }]}>BULDUKLARIN (SÖZLÜK ANLAMI İÇİN TIKLA)</Text>
      <View style={styles.tags}>
        {found.length ? found.map((word) => (
          <Pressable
            key={word}
            onPress={() => {
              triggerHapticSelection();
              setSelectedWordInfo({ word, definition: getWordDefinition(word) });
            }}
            style={({ pressed }) => [styles.tag, { backgroundColor: activeTheme.surface }, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.tagText}>{word}</Text>
          </Pressable>
        )) : <Text style={styles.empty}>İlk kelimeyi bul.</Text>}
      </View>
    </View>
    {status === "won" && <View style={styles.result}><Text style={styles.resultTitle}>{daily ? "GÜNLÜK ROTA TAMAMLANDI" : "SEVİYE TAMAMLANDI"}</Text><Text style={styles.resultCopy}>{daily ? "Bugünün XP ödülü sezon ilerlemene eklendi." : "Yeni rota yoğunluğu ve daha kısa süre seni bekliyor."}</Text><Pressable onPress={daily ? onExit : onNext} style={[styles.action, { backgroundColor: activeTheme.accentColor }]}><Text style={styles.actionText}>{daily ? "KOMUTA MERKEZİNE DÖN" : "SONRAKİ SEVİYE"}</Text><Text style={styles.actionArrow}>→</Text></Pressable></View>}
    {status === "lost" && <View style={styles.result}><Text style={styles.resultTitle}>SÜRE DOLDU</Text><Text style={styles.resultCopy}>Her renk ayrı bir kelimenin yolunu gösterir.</Text><View style={styles.solutionLegend}>{challenge.words.map((word, index) => <View key={word} style={[styles.solutionTag, SOLUTION_ROUTE_COLORS[index % SOLUTION_ROUTE_COLORS.length]]}><Text style={styles.solutionTagText}>{word} · {DIFFICULTY_LABEL[challenge.wordDifficulties[word]!]}</Text></View>)}</View><Pressable onPress={() => daily ? setRetryNonce((value) => value + 1) : setVariation((value) => value + 1)} style={[styles.action, { backgroundColor: activeTheme.accentColor }]}><Text style={styles.actionText}>{daily ? "AYNI ROTA İLE TEKRAR DENE" : "YENİ IZGARA İLE TEKRAR DENE"}</Text><Text style={styles.actionArrow}>?</Text></Pressable></View>}
    
    {selectedWordInfo && (
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: activeTheme.surface, borderColor: activeTheme.accentColor }]}>
          <Text style={[styles.modalTitle, { color: activeTheme.accentColor }]}>{selectedWordInfo.word}</Text>
          <Text style={styles.modalBody}>{selectedWordInfo.definition}</Text>
          <Pressable onPress={() => setSelectedWordInfo(null)} style={({ pressed }) => [styles.modalCloseButton, { backgroundColor: activeTheme.accentColor }, pressed && { opacity: 0.8 }]}>
            <Text style={styles.modalCloseText}>KAPAT</Text>
          </Pressable>
        </View>
      </View>
    )}
  </ScrollView>;
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 28 }, header: { height: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, exit: { width: 35, height: 35, borderRadius: 12, alignItems: "center", justifyContent: "center" }, exitText: { color: "#FFF9FC", fontSize: 23, lineHeight: 23 }, kicker: { fontSize: 8, fontWeight: "900", letterSpacing: 0.9 }, title: { color: "#FFF9FC", fontSize: 14, fontWeight: "900", marginTop: 2 }, timer: { borderRadius: 13, paddingHorizontal: 11, paddingVertical: 8, borderWidth: 1, position: "relative" }, timerUrgent: { backgroundColor: "#60233D", borderColor: "#FF647C" }, timerText: { color: "#FFC24A", fontSize: 13, fontWeight: "900" }, radarButton: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 }, radarUsedBtn: { backgroundColor: "#1A1530", borderColor: "#413660", opacity: 0.6 }, radarText: { color: "#FFC24A", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 }, bonusText: { position: "absolute", top: -18, right: 0, color: "#50E3C2", fontSize: 11, fontWeight: "900" }, progress: { alignItems: "center", paddingVertical: 12 }, progressLabel: { color: "#FFC24A", fontSize: 20, fontWeight: "900", letterSpacing: 1 }, progressMeta: { fontSize: 9, fontWeight: "800", marginTop: 3 }, board: { alignSelf: "center", flexDirection: "row", flexWrap: "wrap", borderWidth: 1, borderRadius: 24, padding: 4, userSelect: "none", touchAction: "none" } as any, boardUrgent: { borderColor: "#FF647C", shadowColor: "#FF647C", shadowOpacity: 0.25, shadowRadius: 10, elevation: 8 }, cellWrap: { padding: 5 }, cell: { flex: 1, borderRadius: 99, borderWidth: 2, alignItems: "center", justifyContent: "center", aspectRatio: 1 }, cellSelected: { borderColor: "#FFC24A" }, cellTail: { borderWidth: 2, borderColor: "#50E3C2", transform: [{ scale: 1.04 }] }, cellInvalid: { backgroundColor: "#8D2C46", borderColor: "#FF647C" }, cellAccepted: { backgroundColor: "#2B776E", borderColor: "#50E3C2" }, cellFound: { backgroundColor: "#287B70", borderColor: "#50E3C2" }, cellRadar: { backgroundColor: "#4E3A1D", borderColor: "#FFC24A", borderWidth: 2 }, check: { position: "absolute", left: 4, bottom: 2, color: "#E9FFF8", fontSize: 9, fontWeight: "900" }, solutionMark: { position: "absolute", left: 5, bottom: 1, color: "#E9FFF8", fontSize: 13, fontWeight: "900" }, letter: { color: "#FFF9FC", fontSize: 23, fontWeight: "900" }, letterMedium: { fontSize: 19 }, letterSmall: { fontSize: 15 }, letterRadar: { color: "#FFC24A" }, order: { position: "absolute", top: 3, right: 4, color: "#FFF2C7", fontSize: 8, fontWeight: "900" }, tray: { minHeight: 77, marginTop: 12, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 }, trayInvalid: { backgroundColor: "#5B2339", borderColor: "#FF647C" }, trayAccepted: { backgroundColor: "#1F514D", borderColor: "#50E3C2" }, trayLabel: { color: "#C6BADD", fontSize: 9, fontWeight: "900", letterSpacing: 1 }, word: { color: "#FFF9FC", fontSize: 18, fontWeight: "900", letterSpacing: 2, marginTop: 3 }, hint: { color: "#B5A9CD", fontSize: 8, textAlign: "center", marginTop: 3 }, found: { marginTop: 10, padding: 11, borderRadius: 15, borderWidth: 1 }, foundLabel: { fontSize: 8, fontWeight: "900", letterSpacing: 0.9 }, tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 7 }, tag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }, tagText: { color: "#FFF2C7", fontSize: 10, fontWeight: "900" }, empty: { color: "#8F82A2", fontSize: 10 }, result: { marginTop: 10, padding: 14, borderRadius: 18, backgroundColor: "#4A2443", borderWidth: 1, borderColor: "#E4638B", alignItems: "center" }, resultTitle: { color: "#FFF9FC", fontSize: 15, fontWeight: "900" }, resultCopy: { color: "#F1D2DE", fontSize: 10, textAlign: "center", marginTop: 4 }, solutionLegend: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6, marginTop: 9 }, solutionTag: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 }, solutionTagText: { color: "#FFF9FC", fontSize: 9, fontWeight: "900", letterSpacing: 0.4 }, action: { height: 44, alignSelf: "stretch", marginTop: 12, borderRadius: 13, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, actionText: { color: "#35152A", fontSize: 10, fontWeight: "900", letterSpacing: 0.8 }, actionArrow: { color: "#35152A", fontSize: 20, fontWeight: "900" },
  modalOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", zIndex: 100 },
  modalContent: { width: "86%", borderRadius: 20, borderWidth: 1.5, padding: 22, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.5, shadowRadius: 15, elevation: 10 },
  modalTitle: { fontSize: 22, fontWeight: "900", letterSpacing: 1.5, marginBottom: 12 },
  modalBody: { color: "#FFFFFF", fontSize: 14, lineHeight: 21, textAlign: "center", marginBottom: 20, fontWeight: "600" },
  modalCloseButton: { borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  modalCloseText: { color: "#000000", fontSize: 12, fontWeight: "900", letterSpacing: 0.8 }
});
