import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, Animated } from "react-native";

import { advanceSelection, wordFromSelection } from "@/shared/game";
import { createSoloBoard } from "@/shared/solo";
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

export function ArcadeChallenge({ onExit, onComplete }: { onExit: () => void; onComplete: (score: number) => void }) {
  const { width } = useWindowDimensions();
  const [levelSeed, setLevelSeed] = useState(() => Math.floor(Math.random() * 15) + 1);
  const [variation, setVariation] = useState(() => Math.floor(Math.random() * 1_000_000));
  
  const challenge = useMemo(() => createSoloBoard(levelSeed, variation, "general"), [levelSeed, variation]);
  
  const [selected, setSelected] = useState<number[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [foundPaths, setFoundPaths] = useState<number[][]>([]);
  const [seconds, setSeconds] = useState(30); // Start with 30s
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>("idle");
  const [status, setStatus] = useState<"playing" | "lost">("playing");
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
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
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

  const boardWidth = Math.min(width - (challenge.size === 6 ? 32 : 36), challenge.size === 6 ? 374 : 356);
  const activeWord = wordFromSelection(challenge.board, selected);

  const scoreRef = useRef(score);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    scoreRef.current = score;
    onCompleteRef.current = onComplete;
  }, [score, onComplete]);

  // Time Countdown
  useEffect(() => {
    if (status !== "playing" || countdown !== null) return;
    const timer = setInterval(() => setSeconds((value) => {
      if (value <= 1) {
        clearInterval(timer);
        setStatus("lost");
        triggerHapticError();
        playErrorSound();
        onCompleteRef.current(scoreRef.current);
        return 0;
      }
      return value - 1;
    }), 1000);
    return () => clearInterval(timer);
  }, [status, countdown]);

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
    setTimeout(() => {
      setParticles((prev) => prev.filter(p => !newParticles.includes(p)));
    }, 380);
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
    triggerHapticSuccess();

    // If entire board is cleared, generate a new board!
    if (nextFound.length === challenge.words.length) {
      explodeConfetti();
      setTimeout(() => {
        setFound([]);
        setFoundPaths([]);
        // Alternating board size or advancing level seed
        setLevelSeed((l) => (l % 90) + 1);
        setVariation((v) => v + 1);
        setFeedback("idle");
      }, 400);
    } else {
      setTimeout(() => setFeedback("idle"), 360);
    }
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

  const foundCells = new Set(foundPaths.flat());
  const solutionColors = new Map<number, number>();
  const selectedSet = new Set(selected);
  const isUrgent = seconds <= 8;

  return <ScrollView contentContainerStyle={styles.content} scrollEnabled={!isSelecting} showsVerticalScrollIndicator={false}>
    <View style={styles.header}>
      <Pressable onPress={onExit} style={styles.exit}><Text style={styles.exitText}>×</Text></Pressable>
      <View><Text style={styles.kicker}>ARCADE MODU</Text><Text style={styles.title}>ZAMANA KARŞI HÜCUM</Text></View>
      <View style={styles.scoreContainer}><Text style={styles.scoreLabel}>SKOR</Text><Text style={styles.scoreValue}>{score}</Text></View>
      <View style={[styles.timer, { borderColor: "#FF647C" }, isUrgent && styles.timerUrgent]}>
        <Text style={styles.timerText}>{seconds}s</Text>
        {timeBonusText && <Text style={styles.bonusText}>{timeBonusText}</Text>}
      </View>
    </View>
    <View style={styles.progress}><Text style={styles.progressLabel}>{found.length} / {challenge.words.length} KELİME</Text><Text style={styles.progressMeta}>Her kelime ek süre kazandırır</Text></View>
    
    <Animated.View ref={boardRef} onLayout={measureBoard} style={[styles.board, { width: boardWidth, height: boardWidth, position: "relative", transform: [{ translateX: shakeAnim }] }, isUrgent && styles.boardUrgent]}>
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
            color="#FFC24A"
          />
        );
      })}

      {challenge.board.map((letter, index) => {
        const order = selected.indexOf(index);
        const isSelected = selectedSet.has(index);
        const isTail = selected.at(-1) === index;
        const isFound = foundCells.has(index);
        
        return <View key={`${letter}-${index}`} pointerEvents="none" style={[styles.cellWrap, { width: `${100 / challenge.size}%`, height: `${100 / challenge.size}%` }]}><View style={[styles.cell, isFound && styles.cellFound, isSelected && styles.cellSelected, isTail && styles.cellTail, feedback === "invalid" && isSelected && styles.cellInvalid, feedback === "accepted" && isSelected && styles.cellAccepted]}><Text selectable={false} style={[styles.letter, challenge.size === 6 && styles.letterMedium]}>{letter}</Text>{isSelected && <Text selectable={false} style={styles.order}>{order + 1}</Text>}{isFound && !isSelected && <Text selectable={false} style={styles.check}>✓</Text>}</View></View>;
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
    <View style={styles.found}>
      <Text style={styles.foundLabel}>BULDUKLARIN (SÖZLÜK ANLAMI İÇİN TIKLA)</Text>
      <View style={styles.tags}>
        {found.length ? found.map((word) => (
          <Pressable
            key={word}
            onPress={() => {
              triggerHapticSelection();
              setSelectedWordInfo({ word, definition: getWordDefinition(word) });
            }}
            style={({ pressed }) => [styles.tag, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.tagText}>{word}</Text>
          </Pressable>
        )) : <Text style={styles.empty}>İlk kelimeyi bul.</Text>}
      </View>
    </View>
    {status === "lost" && <View style={styles.result}><Text style={styles.resultTitle}>SÜRE DOLDU!</Text><Text style={styles.resultCopy}>Arcade modunda ulaştığın nihai skor:</Text><Text style={styles.finalScore}>{score}</Text><Pressable onPress={onExit} style={styles.action}><Text style={styles.actionText}>KOMUTA MERKEZİNE DÖN</Text><Text style={styles.actionArrow}>→</Text></Pressable></View>}
    
    {selectedWordInfo && (
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: "#30264D", borderColor: "#FFC24A" }]}>
          <Text style={[styles.modalTitle, { color: "#FFC24A" }]}>{selectedWordInfo.word}</Text>
          <Text style={styles.modalBody}>{selectedWordInfo.definition}</Text>
          <Pressable onPress={() => setSelectedWordInfo(null)} style={({ pressed }) => [styles.modalCloseButton, { backgroundColor: "#FFC24A" }, pressed && { opacity: 0.8 }]}>
            <Text style={styles.modalCloseText}>KAPAT</Text>
          </Pressable>
        </View>
      </View>
    )}
    {countdown !== null && (
      <View style={styles.countdownOverlay} pointerEvents="auto">
        <Text style={styles.countdownText}>
          {countdown === 0 ? "BAŞLA!" : countdown}
        </Text>
      </View>
    )}
  </ScrollView>;
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 28, backgroundColor: "#0C091C" }, header: { height: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, exit: { width: 35, height: 35, borderRadius: 12, backgroundColor: "#211A3D", alignItems: "center", justifyContent: "center" }, exitText: { color: "#FFF9FC", fontSize: 23, lineHeight: 23 }, kicker: { color: "#FFC24A", fontSize: 8, fontWeight: "900", letterSpacing: 0.9 }, title: { color: "#FFF9FC", fontSize: 13, fontWeight: "900", marginTop: 2 }, scoreContainer: { alignItems: "center" }, scoreLabel: { color: "#8FA4CF", fontSize: 8, fontWeight: "900" }, scoreValue: { color: "#FFF9FC", fontSize: 16, fontWeight: "900" }, timer: { borderRadius: 13, paddingHorizontal: 11, paddingVertical: 8, backgroundColor: "#2B2251", borderWidth: 1, position: "relative" }, timerUrgent: { backgroundColor: "#60233D", borderColor: "#FF647C" }, timerText: { color: "#FF647C", fontSize: 13, fontWeight: "900" }, bonusText: { position: "absolute", top: -18, right: 0, color: "#50E3C2", fontSize: 11, fontWeight: "900" }, progress: { alignItems: "center", paddingVertical: 12 }, progressLabel: { color: "#FFC24A", fontSize: 20, fontWeight: "900", letterSpacing: 1 }, progressMeta: { color: "#B8ADD1", fontSize: 9, fontWeight: "800", marginTop: 3 }, board: { alignSelf: "center", flexDirection: "row", flexWrap: "wrap", backgroundColor: "#16122C", borderWidth: 1, borderColor: "#594884", borderRadius: 24, padding: 4, userSelect: "none", touchAction: "none" } as any, boardUrgent: { borderColor: "#FF647C", shadowColor: "#FF647C", shadowOpacity: 0.25, shadowRadius: 10, elevation: 8 }, cellWrap: { padding: 5 }, cell: { flex: 1, borderRadius: 99, backgroundColor: "#30264D", borderWidth: 2, borderColor: "#594884", alignItems: "center", justifyContent: "center", aspectRatio: 1 }, cellSelected: { backgroundColor: "#4D3B81", borderColor: "#FFC24A" }, cellTail: { borderWidth: 2, borderColor: "#50E3C2", transform: [{ scale: 1.04 }] }, cellInvalid: { backgroundColor: "#8D2C46", borderColor: "#FF647C" }, cellAccepted: { backgroundColor: "#2B776E", borderColor: "#50E3C2" }, cellFound: { backgroundColor: "#287B70", borderColor: "#50E3C2" }, check: { position: "absolute", left: 4, bottom: 2, color: "#E9FFF8", fontSize: 9, fontWeight: "900" }, letter: { color: "#FFF9FC", fontSize: 25, fontWeight: "900" }, letterMedium: { fontSize: 21 }, order: { position: "absolute", top: 3, right: 4, color: "#FFF2C7", fontSize: 8, fontWeight: "900" }, wordTray: { minHeight: 77, marginTop: 12, borderRadius: 18, backgroundColor: "#211A3D", borderWidth: 1, borderColor: "#51406F", alignItems: "center", justifyContent: "center", paddingHorizontal: 18 }, trayInvalid: { backgroundColor: "#5B2339", borderColor: "#FF647C" }, trayAccepted: { backgroundColor: "#1F514D", borderColor: "#50E3C2" }, trayLabel: { color: "#C6BADD", fontSize: 9, fontWeight: "900", letterSpacing: 1 }, word: { color: "#FFF9FC", fontSize: 18, fontWeight: "900", letterSpacing: 2, marginTop: 3 }, found: { marginTop: 10, padding: 11, borderRadius: 15, backgroundColor: "#1A1530", borderWidth: 1, borderColor: "#3C315B" }, foundLabel: { color: "#B8ADD1", fontSize: 8, fontWeight: "900", letterSpacing: 0.9 }, tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 7 }, tag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: "#493878" }, tagText: { color: "#FFF2C7", fontSize: 10, fontWeight: "900" }, empty: { color: "#8F82A2", fontSize: 10 }, result: { marginTop: 10, padding: 14, borderRadius: 18, backgroundColor: "#4A2443", borderWidth: 1, borderColor: "#E4638B", alignItems: "center" }, resultTitle: { color: "#FFF9FC", fontSize: 15, fontWeight: "900" }, resultCopy: { color: "#F1D2DE", fontSize: 10, textAlign: "center", marginTop: 4 }, finalScore: { color: "#FFC24A", fontSize: 32, fontWeight: "900", marginVertical: 12 }, action: { height: 44, alignSelf: "stretch", marginTop: 12, borderRadius: 13, paddingHorizontal: 13, backgroundColor: "#FF647C", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, actionText: { color: "#35152A", fontSize: 10, fontWeight: "900", letterSpacing: 0.8 }, actionArrow: { color: "#35152A", fontSize: 20, fontWeight: "900" },
  modalOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", zIndex: 100 },
  modalContent: { width: "86%", borderRadius: 20, borderWidth: 1.5, padding: 22, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.5, shadowRadius: 15, elevation: 10 },
  modalTitle: { fontSize: 22, fontWeight: "900", letterSpacing: 1.5, marginBottom: 12 },
  modalBody: { color: "#FFFFFF", fontSize: 14, lineHeight: 21, textAlign: "center", marginBottom: 20, fontWeight: "600" },
  modalCloseButton: { borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  modalCloseText: { color: "#000000", fontSize: 12, fontWeight: "900", letterSpacing: 0.8 },
  countdownOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(18, 16, 37, 0.85)", justifyContent: "center", alignItems: "center", zIndex: 200 },
  countdownText: { color: "#00F5D4", fontSize: 72, fontWeight: "900", textShadowColor: "rgba(0, 245, 212, 0.8)", textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 15 }
});
