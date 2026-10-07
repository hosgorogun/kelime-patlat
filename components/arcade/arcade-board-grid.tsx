import React from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { ConnectLine, BoardCountdownShield } from "../game/game-ui";
import { FloatingScoreBurst } from "../solo/solo-floating-effects";
import { APP_WORD_PALETTE } from "@/shared/solo";
import { styles } from "./arcade.styles";

export const ArcadeBoardGrid = React.memo(function ArcadeBoardGrid({
  boardRef,
  measureBoard,
  boardWidth,
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
  missedCellColors,
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
  };
  inspectedPath: number[] | null;
  inspectedColor: string | null;
  selectedSet: Set<number>;
  foundCells: Set<number>;
  foundCellColors: Map<number, { bg: string; border: string; text: string }>;
  missedCellColors: Map<number, { bg: string; border: string; text: string }>;
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
          borderColor: boardSkinColor ? `${boardSkinColor}99` : undefined,
          borderWidth: boardSkinColor ? 2.5 : undefined,
          shadowColor: boardSkinColor || "#293541",
          shadowOpacity: boardSkinColor ? 0.4 : 0.2,
          shadowRadius: 4,
          elevation: 2,
          transform: [{ translateX: shakeAnim }],
        },
        isUrgent && styles.boardUrgent,
      ]}
    >
      <BoardCountdownShield countdown={countdown} theme="light" />

      <FloatingScoreBurst text={scoreBurstText} />

      {/* Matrix Grid Backing */}
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
            color={boardSkinColor || "#98732c"}
            showArrow
          />
        );
      })}

      {/* Oyun sürerken bulunan kelimelerin tahtadaki rotaları */}
      {status === "playing" &&
        foundPaths.map((path, pIdx) => {
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
      {status === "lost" &&
        challenge.words.map((word, wIdx) => {
          const path = challenge.routes[word];
          if (!path || path.length < 2) return null;
          const palette = APP_WORD_PALETTE[wIdx % APP_WORD_PALETTE.length]!;
          const isCurrentInspected = Boolean(
            inspectedPath && inspectedPath.length === path.length && inspectedPath.every((c, ci) => c === path[ci])
          );
          const lineOpacity = inspectedPath ? (isCurrentInspected ? 1 : 0.25) : 0.65;
          const lineColor = isCurrentInspected ? inspectedColor || palette.border : palette.border;

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
          const missedColor = missedCellColors.get(index);
          const inspectedOrder = inspectedMap.get(index) ?? -1;
          const isInspected = inspectedOrder !== -1;
          const isInspectedStart = status !== "playing" && inspectedOrder === 0;
          const isInspectedEnd = status !== "playing" && inspectedPath ? inspectedOrder === inspectedPath.length - 1 : false;
          const isRadar = radarHighlights.has(index);

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
                  borderColor: inspectedColor || "#DCE1D7",
                  borderWidth: 2.5,
                  backgroundColor: "rgba(255, 194, 74, 0.25)",
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
                isSelected && styles.cellSelected,
                isSelected && { transform: [{ scale: 1.15 }] },
                isTail && styles.cellTail,
                isTail && { transform: [{ scale: 1.2 }] },
                feedback === "invalid" && isSelected && styles.cellInvalid,
                feedback === "accepted" && isSelected && styles.cellAccepted,
                feedback === "bonus" && isSelected && styles.cellBonus,
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
                  feedback === "bonus" && isSelected && { color: "#854D0E" },
                  feedback === "invalid" && isSelected && { color: "#991B1B" },
                  foundColor && { color: foundColor.text },
                  isRadar && styles.letterRadar,
                  missedColor && { color: missedColor.text },
                  countdown !== null && countdown > 0 && { opacity: 0 },
                ]}
              >
                {letter}
              </Text>
              {isSelected && (
                <Text
                  selectable={false}
                  style={[styles.order, challenge.size >= 8 && { fontSize: 7, top: 1, right: 2 }]}
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
                    borderColor: "#DCE1D7",
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
                <Text selectable={false} style={[styles.check, foundColor && { color: foundColor.border }]}>
                  ✓
                </Text>
              )}
              {missedColor && !isSelected && !isFound && (
                <Text selectable={false} style={[styles.check, { color: missedColor.border }]}>
                  ✗
                </Text>
              )}
            </View>
          </View>
        );
      });
    })()}

      {particles.map((p) => (
        <Animated.View
          key={p.id}
          style={{
            position: "absolute",
            left: p.x - 4,
            top: p.y - 4,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: p.color,
            transform: p.anim.getTranslateTransform(),
          }}
        />
      ))}
      <View
        pointerEvents={status === "playing" && countdown === null ? "auto" : "none"}
        onStartShouldSetResponder={() => status === "playing" && countdown === null}
        onMoveShouldSetResponder={() => status === "playing" && countdown === null}
        onResponderTerminationRequest={() => false}
        onPointerDown={(e: any) => {
          if (status !== "playing") return;
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
