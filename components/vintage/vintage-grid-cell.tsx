import React from "react";
import { View, Text, Pressable } from "react-native";
import { triggerHapticSelection } from "@/shared/audio-haptics";
import { vintageStyles as styles } from "./vintage.styles";

export type GridCellItemProps = {
  row: number;
  col: number;
  char: string | null;
  isPuzzleCell: boolean;
  cellNumber?: number;
  isCenterArea: boolean;
  isCellCompleted: boolean;
  isCenterWordPlaced: boolean;
  isSelected: boolean;
  isTargetWordCell: boolean;
  isErrorCell?: boolean;
  cellSize: number;
  onPress: (r: number, c: number) => void;
};

export const GridCellItem = React.memo(
  ({
    row,
    col,
    char,
    isPuzzleCell,
    cellNumber,
    isCenterArea,
    isCellCompleted,
    isCenterWordPlaced: _isCenterWordPlaced,
    isSelected,
    isTargetWordCell,
    isErrorCell = false,
    cellSize,
    onPress,
  }: GridCellItemProps) => {
    if (!isPuzzleCell) {
      return (
        <View style={[styles.gridCell, { width: cellSize, height: cellSize }, styles.gridCellBlocked]}>
          <View style={styles.blockedHatch} />
        </View>
      );
    }

    const isCenterCellCompleted = isCenterArea && isCellCompleted;

    return (
      <Pressable
        onPress={() => {
          triggerHapticSelection();
          onPress(row, col);
        }}
        style={({ pressed }) => [
          styles.gridCell,
          { width: cellSize, height: cellSize },
          isTargetWordCell && styles.gridCellTargetWord,
          isCenterArea && !char && styles.gridCellCenterArea,
          char && !isCellCompleted && styles.gridCellDraft,
          isCellCompleted && styles.gridCellCompleted,
          isCenterCellCompleted && styles.gridCellCenterWord,
          isSelected && styles.gridCellSelected,
          isErrorCell && styles.gridCellError,
          pressed && { opacity: 0.8 },
        ]}
      >
        {cellNumber !== undefined && (
          <Text style={[styles.cellNumberBadge, isSelected && styles.cellNumberBadgeSelected, isErrorCell && styles.cellNumberBadgeError]}>
            {cellNumber}
          </Text>
        )}
        {isCenterArea && !char && cellNumber === undefined && <Text style={styles.centerStarIcon}>⭐</Text>}
        <Text
          style={[
            styles.cellCharText,
            isCellCompleted && styles.cellCharCompletedText,
            isSelected && styles.cellCharSelectedText,
            isErrorCell && styles.cellCharErrorText,
          ]}
        >
          {char || ""}
        </Text>
      </Pressable>
    );
  }
);

GridCellItem.displayName = "GridCellItem";
