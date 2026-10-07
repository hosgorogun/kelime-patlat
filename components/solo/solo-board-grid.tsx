import React from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { ConnectLine, BoardCountdownShield } from "../game/game-ui";
import { FloatingScoreBurst } from "./solo-floating-effects";
import { TilePop } from "../game/tile-pop";
import { SOLUTION_ROUTE_COLORS, APP_WORD_PALETTE } from "@/shared/solo";
import type { VisualTheme } from "@/shared/themes";
import { styles } from "./solo-challenge.styles";

export const SoloBoardGrid = React.memo(function SoloBoardGrid({
  boardRef,
  measureBoard,
  boardWidth,
  activeTheme,
  boardSkinColor,
  shakeAnim,
  isUrgent,
  scoreBurstText,
  countdown,
  selected,
  getCellCenter,
  status,
  foundPaths,
  challenge,
  inspectedPath,
  inspectedColor,
  selectedSet,
  foundCells,
  foundCellColors,
  solutionColors,
  radarHighlights,
  feedback,
  particles,
  onGestureStart,
  onGestureMove,
  onGestureEnd,
  onGestureCancel,
}: {
  boardRef: any;
  measureBoard: () => void;
  boardWidth: number;
  activeTheme: VisualTheme;
  boardSkinColor?: string;
  shakeAnim: Animated.Value;
  isUrgent: boolean;
  scoreBurstText: string | null;
  countdown: number | null;
  selected: number[];
  getCellCenter: (index: number) => { x: number; y: number };
  status: string;
  foundPaths: number[][];
  challenge: {
    size: number;
    words: string[];
    routes: Record<string, number[]>;
    board: string[];
    specialTiles?: Record<number, any>;
  };
  inspectedPath: number[] | null;
  inspectedColor: string | null;
  selectedSet: Set<number>;
  foundCells: Set<number>;
  foundCellColors: Map<number, { bg: string; border: string; letterText: string }>;
  solutionColors: Map<number, number>;
  radarHighlights: Set<number>;
  feedback: "idle" | "invalid" | "accepted" | "bonus";
  particles: { id: number; x: number; y: number; color: string; anim: Animated.ValueXY }[];
  onGestureStart: (e: any) => void;
  onGestureMove: (e: any) => void;
  onGestureEnd: () => void;
  onGestureCancel: () => void;
}) {
  return (
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
        const lineOpacity = inspectedPath ? (isCurrentInspected ? 1 : 0.25) : 0.65;
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

      {(() => {
        const orderMap = new Map<number, number>();
        selected.forEach((idx, i) => orderMap.set(idx, i));
        const inspectedMap = new Map<number, number>();
        if (status !== "playing" && inspectedPath) {
          inspectedPath.forEach((idx, i) => inspectedMap.set(idx, i));
        }

        return challenge.board.map((letter, index) => {
          const order = orderMap.get(index) ?? -1;
          const isSelected = order !== -1;
          const isTail = selected.length > 0 && selected[selected.length - 1] === index;
          const isFound = foundCells.has(index);
          const foundColor = foundCellColors.get(index);
          const solutionColor = solutionColors.get(index);
          const isSolution = solutionColor !== undefined;
          const isRadar = radarHighlights.has(index);
          const inspectedOrder = inspectedMap.get(index) ?? -1;
          const isInspected = inspectedOrder !== -1;
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
            <TilePop active={isSelected}>
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
                feedback === "bonus" && isSelected && styles.cellBonus,
                isRadar && styles.cellRadar,
                !isFound && challenge.specialTiles?.[index]?.type === "ice" && {
                  borderColor: "#38BDF8",
                  borderWidth: 2,
                  backgroundColor: "rgba(186, 230, 253, 0.3)",
                },
                !isFound && challenge.specialTiles?.[index]?.type === "bomb" && {
                  borderColor: "#F97316",
                  borderWidth: 2,
                },
                !isFound && challenge.specialTiles?.[index]?.type === "gold" && {
                  borderColor: "#FBBF24",
                  borderWidth: 2,
                  backgroundColor: "rgba(254, 240, 138, 0.25)",
                },
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
                  feedback === "bonus" && isSelected && { color: "#854D0E" },
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
              {/* Special Tile Badge (Ice, Bomb, Gold) */}
              {!isFound && challenge.specialTiles?.[index] && (
                <View
                  style={{
                    position: "absolute",
                    bottom: challenge.size >= 8 ? 0.5 : 2,
                    left: challenge.size >= 8 ? 0.5 : 2,
                    zIndex: 5,
                  }}
                >
                  <Text style={{ fontSize: challenge.size >= 8 ? 8 : 11 }}>
                    {challenge.specialTiles[index]?.type === "ice"
                      ? "🧊"
                      : challenge.specialTiles[index]?.type === "bomb"
                      ? "💣"
                      : "🪙"}
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
            </TilePop>
          </View>
        );
      });
    })()}
      {particles.map((p: any) => (
        <Animated.View
          key={p.id}
          style={{
            position: "absolute",
            left: p.x - 6,
            top: p.y - 6,
            width: 12,
            height: 12,
            alignItems: "center",
            justifyContent: "center",
            transform: p.anim.getTranslateTransform(),
          }}
        >
          {p.type === "ice" ? (
            <Text style={{ fontSize: 9 }}>❄️</Text>
          ) : p.type === "bomb" ? (
            <Text style={{ fontSize: 9 }}>💥</Text>
          ) : p.type === "gold" ? (
            <Text style={{ fontSize: 9 }}>✨</Text>
          ) : (
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.color }} />
          )}
        </Animated.View>
      ))}
      <View
        pointerEvents={status === "playing" && countdown === null ? "auto" : "none"}
        onStartShouldSetResponder={() => status === "playing" && countdown === null}
        onMoveShouldSetResponder={() => status === "playing" && countdown === null}
        onResponderTerminationRequest={() => false}
        onPointerDown={(e: any) => {
          if (e.target?.setPointerCapture) e.target.setPointerCapture(e.pointerId ?? e.nativeEvent?.pointerId);
          onGestureStart(e);
        }}
        onPointerMove={onGestureMove}
        onPointerUp={onGestureEnd}
        onPointerCancel={onGestureCancel}
        onTouchStart={onGestureStart}
        onTouchMove={onGestureMove}
        onTouchEnd={onGestureEnd}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
});
