import React from "react";
import { Animated, View } from "react-native";
import { GridCellItem } from "./vintage-grid-cell";
import { vintageStyles as styles } from "./vintage.styles";

export function VintageBoardGrid({
  gridContainerRef,
  shakeAnim,
  solvedPulseAnim,
  playerBoard,
  selectedCell,
  puzzleCellsMap,
  cellNumbersMap,
  isCellLockedByCompletedWord,
  solvedWordIds,
  centerWordId,
  activeTargetCellsMap,
  errorCells,
  cellSize,
  onCellPress,
}: {
  gridContainerRef: any;
  shakeAnim: Animated.Value;
  solvedPulseAnim: Animated.Value;
  playerBoard: (string | null)[][];
  selectedCell: [number, number] | null;
  puzzleCellsMap: Map<string, any>;
  cellNumbersMap: Map<string, number>;
  isCellLockedByCompletedWord: (r: number, c: number) => boolean;
  solvedWordIds: Set<string>;
  centerWordId?: string;
  activeTargetCellsMap: Set<string>;
  errorCells: Set<string>;
  cellSize: number;
  onCellPress: (r: number, c: number) => void;
}) {
  return (
    <Animated.View
      ref={gridContainerRef}
      style={[
        styles.gridContainer,
        { transform: [{ translateX: shakeAnim }, { scale: solvedPulseAnim }] },
      ]}
    >
      {playerBoard.map((row, rIdx) => (
        <View key={rIdx} style={styles.gridRow}>
          {row.map((char, cIdx) => {
            const cellKey = `${rIdx},${cIdx}`;
            const isSelected = selectedCell?.[0] === rIdx && selectedCell?.[1] === cIdx;
            const cellInfo = puzzleCellsMap.get(cellKey);
            const isPuzzleCell = !!cellInfo;
            const cellNumber = cellNumbersMap.get(cellKey);
            const isCenterArea = cellInfo?.isCenter ?? false;
            const isCellCompleted = isCellLockedByCompletedWord(rIdx, cIdx);
            const isCenterWordPlaced = centerWordId ? solvedWordIds.has(centerWordId) : false;
            const isTargetWordCell = activeTargetCellsMap.has(cellKey);
            const isErrorCell = errorCells.has(cellKey);

            return (
              <GridCellItem
                key={`${rIdx}-${cIdx}`}
                row={rIdx}
                col={cIdx}
                char={char}
                isPuzzleCell={isPuzzleCell}
                cellNumber={cellNumber}
                isCenterArea={isCenterArea}
                isCellCompleted={isCellCompleted}
                isCenterWordPlaced={isCenterWordPlaced}
                isSelected={isSelected}
                isTargetWordCell={isTargetWordCell}
                isErrorCell={isErrorCell}
                cellSize={cellSize}
                onPress={onCellPress}
              />
            );
          })}
        </View>
      ))}
    </Animated.View>
  );
}
