import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { triggerHapticSelection, triggerHapticSuccess, triggerHapticError, gameSfx } from "@/shared/audio-haptics";
import { isEqualTr } from "@/shared/tr-utils";
import { advanceSelection } from "@/shared/game";
import { CoinCascadeOverlay } from "@/components/game/coin-cascade";
import { ConnectLine } from "@/components/game/game-ui";

// 3x3 Interaktif Öğretici Tahtası
// Hedef Kelimeler: "KAPI" (K-A-P-I), "PARK" (P-A-R-K), "KARA" (K-A-R-A)
const GRID = [
  ["K", "A", "R"],
  ["I", "P", "A"],
  ["L", "E", "M"],
];

const TARGET_WORDS = [
  { word: "KAPI", hint: "K-A-P-I rotasını 90° dik veya yatay çizerek tamamla!" },
  { word: "PARK", hint: "P-A-R-K harflerini parmağını kaldırmadan bağla." },
  { word: "KARA", hint: "K-A-R-A kelimesini bulup parmağını kaldır!" },
];

const BOARD_PAD = 8;
const GRID_GAP = 8;
const CELL_SIZE = 64;
const INNER_BOARD_SIZE = 3 * CELL_SIZE + 2 * GRID_GAP; // 192 + 16 = 208
const TOTAL_BOARD_SIZE = INNER_BOARD_SIZE + 2 * BOARD_PAD; // 224

export interface InteractiveTutorialBoardProps {
  onInteractingChange?: (isInteracting: boolean) => void;
}

export function InteractiveTutorialBoard({ onInteractingChange }: InteractiveTutorialBoardProps) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [currentTargetIndex, setCurrentTargetIndex] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showRewardCascade, setShowRewardCascade] = useState(false);

  const selectedRef = useRef<number[]>([]);
  selectedRef.current = selectedIndices;

  const pointerActiveRef = useRef(false);
  const lastTouchedIndexRef = useRef<number | null>(null);
  const boardRef = useRef<View>(null);
  const boardPageX = useRef(0);
  const boardPageY = useRef(0);

  const currentTarget = TARGET_WORDS[currentTargetIndex % TARGET_WORDS.length]!;

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 750, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 750, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const measureBoard = useCallback(() => {
    boardRef.current?.measure((_x, _y, _width, _height, pageX, pageY) => {
      if (pageX !== undefined && !isNaN(pageX)) boardPageX.current = pageX;
      if (pageY !== undefined && !isNaN(pageY)) boardPageY.current = pageY;
    });
  }, []);

  const getCellCenter = (idx: number) => {
    const row = Math.floor(idx / 3);
    const col = idx % 3;
    return {
      x: BOARD_PAD + col * (CELL_SIZE + GRID_GAP) + CELL_SIZE / 2,
      y: BOARD_PAD + row * (CELL_SIZE + GRID_GAP) + CELL_SIZE / 2,
    };
  };

  const getCellFromLocalCoords = (localX: number, localY: number): number | null => {
    const ox = localX - BOARD_PAD;
    const oy = localY - BOARD_PAD;
    if (ox < -8 || ox > INNER_BOARD_SIZE + 8 || oy < -8 || oy > INNER_BOARD_SIZE + 8) return null;

    const slotSize = CELL_SIZE + GRID_GAP;
    const col = Math.floor(ox / slotSize);
    const row = Math.floor(oy / slotSize);

    if (col >= 0 && col < 3 && row >= 0 && row < 3) {
      return row * 3 + col;
    }
    return null;
  };

  const handlePointerDownCell = (index: number) => {
    pointerActiveRef.current = true;
    lastTouchedIndexRef.current = index;
    onInteractingChange?.(true);
    triggerHapticSelection();
    try { gameSfx.tap(); } catch {}
    setSelectedIndices([index]);
    setFeedback(null);
  };

  const handlePointerMoveCoords = (localX: number, localY: number) => {
    if (!pointerActiveRef.current) return;
    const cellIdx = getCellFromLocalCoords(localX, localY);
    if (cellIdx === null) return;
    if (lastTouchedIndexRef.current === cellIdx) return;
    lastTouchedIndexRef.current = cellIdx;

    const prev = selectedRef.current;
    if (prev.length === 0) {
      setSelectedIndices([cellIdx]);
      return;
    }

    const next = advanceSelection(prev, cellIdx, 3 as any);
    if (next !== prev && next.length !== prev.length) {
      triggerHapticSelection();
      try { gameSfx.tap(); } catch {}
      setSelectedIndices(next);
    }
  };

  const handlePointerUp = () => {
    if (!pointerActiveRef.current) return;
    pointerActiveRef.current = false;
    lastTouchedIndexRef.current = null;
    onInteractingChange?.(false);

    const current = selectedRef.current;
    if (current.length < 2) {
      setSelectedIndices([]);
      return;
    }

    const formedWord = current
      .map((idx) => {
        const r = Math.floor(idx / 3);
        const c = idx % 3;
        return GRID[r]![c]!;
      })
      .join("");

    const isMatch = TARGET_WORDS.some((t) => isEqualTr(t.word, formedWord));

    if (isMatch) {
      triggerHapticSuccess();
      try { gameSfx.accepted(); } catch {}
      setFeedback(`🎉 HARİKA! "${formedWord}" KELİMESİ PATLATILDI!`);
      if (!foundWords.some((w) => isEqualTr(w, formedWord))) {
        setFoundWords((prev) => [...prev, formedWord]);
      }
      setShowRewardCascade(true);
      setTimeout(() => setShowRewardCascade(false), 1500);

      setTimeout(() => {
        setCurrentTargetIndex((prev) => (prev + 1) % TARGET_WORDS.length);
        setFeedback(null);
      }, 1200);
    } else {
      triggerHapticError();
      try { gameSfx.rejected(); } catch {}
      setFeedback(`"${formedWord}" listede yok. 90° dik/yatay tekrar dene!`);
    }

    setSelectedIndices([]);
  };

  const currentSpelled = selectedIndices
    .map((idx) => {
      const r = Math.floor(idx / 3);
      const c = idx % 3;
      return GRID[r]![c]!;
    })
    .join("");

  return (
    <View style={styles.container}>
      <View style={styles.topInfoCard}>
        <View style={styles.targetBadgeRow}>
          <Text style={styles.targetKicker}>DENEME TAHTASI</Text>
          <View style={styles.foundCountPill}>
            <Text style={styles.foundCountText}>
              {foundWords.length} / {TARGET_WORDS.length} BULUNDU
            </Text>
          </View>
        </View>

        <Text style={styles.missionTitle}>
          Hedef Kelime: <Text style={styles.targetWordHighlight}>{currentTarget.word}</Text>
        </Text>
        <Text style={styles.missionHint}>{currentTarget.hint}</Text>

        {currentSpelled.length > 0 && (
          <View style={styles.spelledPill}>
            <Text style={styles.spelledLabel}>Bağlanan: </Text>
            <Text style={styles.spelledValue}>{currentSpelled}</Text>
          </View>
        )}

        {feedback && (
          <Text
            style={[
              styles.feedbackText,
              { color: feedback.startsWith("🎉") ? "#10B981" : "#EF4444" },
            ]}
          >
            {feedback}
          </Text>
        )}
      </View>

      {/* 3x3 Matris Container */}
      <View
        ref={boardRef}
        onLayout={measureBoard}
        style={[styles.boardContainer, { width: TOTAL_BOARD_SIZE, height: TOTAL_BOARD_SIZE }]}
      >
        {/* Canlı Bağlantı Çizgileri */}
        {selectedIndices.slice(0, -1).map((cellIdx, i) => {
          const nextIdx = selectedIndices[i + 1]!;
          const start = getCellCenter(cellIdx);
          const end = getCellCenter(nextIdx);
          return (
            <ConnectLine
              key={`tutorial-line-${cellIdx}-${nextIdx}`}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              color="#10B981"
              showArrow
            />
          );
        })}

        {/* 3x3 Izgara Hücreleri */}
        <View style={styles.grid}>
          {GRID.map((row, rIdx) => (
            <View key={`row-${rIdx}`} style={styles.gridRow}>
              {row.map((letter, cIdx) => {
                const cellIdx = rIdx * 3 + cIdx;
                const isSelected = selectedIndices.includes(cellIdx);
                const isFirst = selectedIndices[0] === cellIdx;
                const isTargetLetter = currentTarget.word.includes(letter);

                return (
                  <View
                    key={`cell-${cellIdx}`}
                    style={[
                      styles.cell,
                      isSelected && styles.cellSelected,
                      isFirst && styles.cellFirst,
                    ]}
                  >
                    <Text
                      style={[
                        styles.letter,
                        isSelected && styles.letterSelected,
                        isTargetLetter && !isSelected && styles.letterTargetHint,
                      ]}
                    >
                      {letter}
                    </Text>
                    {isFirst && <View style={styles.startDot} />}
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* Üst Dokunmatik/Sürükleme Katmanı (Platform bağımsız ve scroll çalınmasını önleyen overlay) */}
        <View
          style={StyleSheet.absoluteFill}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
          {...(Platform.OS === "web"
            ? {
                onPointerDown: (e: any) => {
                  const ne = e.nativeEvent ?? e;
                  const x = ne.offsetX ?? ne.locationX ?? 0;
                  const y = ne.offsetY ?? ne.locationY ?? 0;
                  const cell = getCellFromLocalCoords(x, y);
                  if (cell !== null) handlePointerDownCell(cell);
                },
                onPointerMove: (e: any) => {
                  const ne = e.nativeEvent ?? e;
                  const x = ne.offsetX ?? ne.locationX ?? 0;
                  const y = ne.offsetY ?? ne.locationY ?? 0;
                  handlePointerMoveCoords(x, y);
                },
                onPointerUp: handlePointerUp,
                onPointerCancel: handlePointerUp,
              }
            : {
                onTouchStart: (e: any) => {
                  measureBoard();
                  const ne = e.nativeEvent ?? e;
                  const x = ne.locationX ?? (ne.pageX - boardPageX.current);
                  const y = ne.locationY ?? (ne.pageY - boardPageY.current);
                  const cell = getCellFromLocalCoords(x, y);
                  if (cell !== null) handlePointerDownCell(cell);
                },
                onTouchMove: (e: any) => {
                  const ne = e.nativeEvent ?? e;
                  const x = ne.locationX ?? (ne.pageX - boardPageX.current);
                  const y = ne.locationY ?? (ne.pageY - boardPageY.current);
                  handlePointerMoveCoords(x, y);
                },
                onTouchEnd: handlePointerUp,
                onTouchCancel: handlePointerUp,
              })}
        />
      </View>

      <View style={styles.instructionFooter}>
        <Text style={styles.footerInstruction}>
          👆 Parmağını harfin üstüne koy ve kaldırmadan sırayla sürükle!
        </Text>
      </View>

      <CoinCascadeOverlay trigger={showRewardCascade} count={10} icon="🪙" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    padding: 14,
    marginVertical: 10,
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  topInfoCard: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
  },
  targetBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  targetKicker: {
    fontSize: 9,
    fontWeight: "800",
    color: "#059669",
    letterSpacing: 0.5,
  },
  foundCountPill: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  foundCountText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#059669",
  },
  missionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  targetWordHighlight: {
    color: "#2563EB",
    fontWeight: "900",
    letterSpacing: 1,
  },
  missionHint: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 2,
  },
  spelledPill: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  spelledLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    color: "#3B82F6",
  },
  spelledValue: {
    fontSize: 12,
    fontWeight: "900",
    color: "#1D4ED8",
    letterSpacing: 1.5,
  },
  feedbackText: {
    fontSize: 11,
    fontWeight: "800",
    marginTop: 6,
  },
  boardContainer: {
    padding: BOARD_PAD,
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  grid: {
    gap: GRID_GAP,
  },
  gridRow: {
    flexDirection: "row",
    gap: GRID_GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  cellSelected: {
    backgroundColor: "#10B981",
    borderColor: "#059669",
    transform: [{ scale: 1.05 }],
  },
  cellFirst: {
    backgroundColor: "#059669",
    borderColor: "#047857",
  },
  letter: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
  },
  letterSelected: {
    color: "#FFFFFF",
  },
  letterTargetHint: {
    color: "#0F172A",
  },
  startDot: {
    position: "absolute",
    bottom: 5,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  instructionFooter: {
    marginTop: 10,
    alignItems: "center",
  },
  footerInstruction: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    textAlign: "center",
  },
});
