import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

export interface CellColorConfig {
  bg: string;
  border: string;
  letterText: string;
  checkColor: string;
  glow: string;
  isMissed?: boolean;
}

export interface BoardCellProps {
  letter: string;
  index: number;
  order: number;
  selected: boolean;
  isTail: boolean;
  foundBy?: string;
  isFound: boolean;
  size: number;
  selectionFeedback: string;
  playerId: string;
  status: string;
  isBotSelected?: boolean;
  botOrder?: number;
  isBotTail?: boolean;
  isInspected?: boolean;
  inspectedOrder?: number;
  isInspectedStart?: boolean;
  isInspectedEnd?: boolean;
  isCountingDown?: boolean;
  cellColor?: CellColorConfig;
  specialTileType?: "ice" | "bomb" | "gold";
}

export const BoardCell = React.memo(({
  letter,
  order,
  selected,
  isTail,
  foundBy,
  isFound,
  size,
  selectionFeedback,
  playerId,
  status,
  isBotSelected,
  botOrder,
  isBotTail,
  isInspected,
  inspectedOrder,
  isInspectedStart,
  isInspectedEnd,
  cellColor,
  isCountingDown,
  specialTileType,
}: BoardCellProps) => {
  const isMissed = foundBy === "missed";
  const isFoundByMe = !isMissed && foundBy === playerId;
  const isFoundByOpponent = !isMissed && Boolean(foundBy && foundBy !== playerId);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isFound && !isMissed) {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.35, duration: 90, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 90, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(rotateAnim, { toValue: order % 2 === 0 ? 1 : -1, duration: 80, useNativeDriver: true }),
          Animated.spring(rotateAnim, { toValue: 0, friction: 4, tension: 80, useNativeDriver: true }),
        ]),
      ]).start();
    }
  }, [isFound, isMissed, order, scaleAnim, rotateAnim]);

  useEffect(() => {
    if (selected) {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.15, duration: 60, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 3.5, useNativeDriver: true }),
      ]).start();
    }
  }, [selected, scaleAnim]);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.cellWrap,
        {
          width: `${100 / size}%`,
          height: `${100 / size}%`,
          padding: size === 10 ? 1.5 : size === 8 ? 2 : size === 6 ? 3 : 4,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.cell,
          {
            transform: [
              { scale: scaleAnim },
              {
                rotate: rotateAnim.interpolate({
                  inputRange: [-1, 0, 1],
                  outputRange: ["-6deg", "0deg", "6deg"],
                }),
              },
            ],
          },
          isFound && !isMissed && styles.cellFound,
          isFoundByMe && styles.cellFoundMine,
          isFoundByOpponent && styles.cellFoundOpponent,
          isMissed && styles.cellMissed,
          cellColor && {
            backgroundColor: cellColor.bg,
            borderColor: cellColor.border,
            borderWidth: cellColor.isMissed ? 1.5 : 2,
            shadowColor: cellColor.glow,
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 2,
          },
          isInspected && styles.cellInspected,
          isInspectedStart && {
            borderColor: cellColor?.border ?? "#DCE1D7",
            borderWidth: 3,
            shadowColor: cellColor?.glow ?? "#293541",
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 2,
          },
          isInspectedEnd && {
            borderColor: cellColor?.border ?? "#DCE1D7",
            borderWidth: 3,
            shadowColor: cellColor?.glow ?? "#293541",
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 2,
          },
          selected && styles.previewCell,
          isTail && styles.cellTail,
          isBotSelected && styles.botPreviewCell,
          isBotTail && styles.cellTailBot,
          selectionFeedback === "invalid" && selected && styles.cellInvalid,
          selectionFeedback === "accepted" && selected && styles.cellAccepted,
          selectionFeedback === "bonus" && selected && styles.cellBonus,
          status === "finished" && selected && styles.cellFinished,
        ]}
      >
        <Text
          selectable={false}
          style={[
            styles.cellLetter,
            size === 6 && styles.cellLetterMedium,
            size === 8 && styles.cellLetterSmall,
            size === 10 && styles.cellLetterExtraSmall,
            cellColor && { color: cellColor.letterText },
            isMissed && !cellColor && styles.cellLetterMissed,
            isInspected && styles.cellLetterInspected,
            isCountingDown && { opacity: 0 },
          ]}
        >
          {letter}
        </Text>
        {selected && (
          <Text
            selectable={false}
            style={[
              styles.cellOrder,
              size >= 8 && { fontSize: 7, top: 1, right: 2 },
            ]}
          >
            {order + 1}
          </Text>
        )}
        {!selected && inspectedOrder !== undefined && inspectedOrder >= 0 && (
          <View
            style={{
              position: "absolute",
              top: size >= 8 ? 1 : 2,
              right: size >= 8 ? 1 : 2,
              backgroundColor: "#F0F5ED",
              borderRadius: size >= 8 ? 4 : 6,
              minWidth: size >= 8 ? 12 : 16,
              height: size >= 8 ? 12 : 16,
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
                fontSize: size >= 8 ? 7 : 8,
                fontWeight: "900",
                textAlign: "center",
              }}
            >
              {inspectedOrder + 1}
            </Text>
          </View>
        )}
        {isBotSelected && !selected && (
          <Text
            selectable={false}
            style={[
              styles.cellOrderBot,
              size >= 8 && { fontSize: 7, top: 1, right: 2 },
            ]}
          >
            {botOrder! + 1}
          </Text>
        )}
        {isFound && !selected && !isMissed && (
          <Text
            selectable={false}
            style={[
              styles.cellCheck,
              cellColor ? { color: cellColor.checkColor } : (isFoundByOpponent && styles.cellCheckOpponent),
              size >= 8 && { fontSize: 7, left: 2, bottom: 1 },
            ]}
          >
            {isFoundByMe ? "✓" : "•"}
          </Text>
        )}
        {isMissed && !selected && (
          <Text
            selectable={false}
            style={[
              styles.cellCheckMissed,
              cellColor && { color: cellColor.border },
              size >= 8 && { fontSize: 7, left: 2, bottom: 1 },
            ]}
          >
            ✗
          </Text>
        )}
        {specialTileType && !isFound && !selected && (
          <View style={{ position: "absolute", bottom: size >= 8 ? 0.5 : 2, left: size >= 8 ? 0.5 : 2, zIndex: 4 }}>
            <Text style={{ fontSize: size >= 8 ? 7 : 10 }}>
              {specialTileType === "ice" ? "🧊" : specialTileType === "bomb" ? "💣" : "🪙"}
            </Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  cellWrap: {
    padding: 5,
  },
  cell: {
    flex: 1,
    borderRadius: 12,
    borderBottomWidth: 4,
    backgroundColor: "#EDF4FC",
    borderWidth: 1.5,
    borderColor: "#DCE1D7",
    alignItems: "center",
    justifyContent: "center",
    aspectRatio: 1,
  },
  cellFinished: {
    backgroundColor: "#F0F5ED",
  },
  cellLetter: {
    color: "#293541",
    fontSize: 25,
    fontWeight: "900",
  },
  cellLetterMedium: {
    fontSize: 21,
  },
  cellLetterSmall: {
    fontSize: 17,
  },
  cellLetterExtraSmall: {
    fontSize: 13,
  },
  cellOrder: {
    position: "absolute",
    top: 3,
    right: 4,
    color: "#293541",
    fontSize: 8,
    fontWeight: "900",
  },
  cellTail: {
    borderColor: "#DCE1D7",
    borderWidth: 2,
    transform: [{ scale: 1.04 }],
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cellInvalid: {
    backgroundColor: "#FFF0E8",
    borderColor: "#DCE1D7",
  },
  cellAccepted: {
    backgroundColor: "#F0F5ED",
    borderColor: "#DCE1D7",
  },
  cellBonus: {
    backgroundColor: "#FEF9C3",
    borderColor: "#FACC15",
    borderWidth: 2,
    shadowColor: "#EAB308",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  cellFound: {
    backgroundColor: "#F0F5ED",
    borderColor: "#DCE1D7",
  },
  cellFoundMine: {
    backgroundColor: "#F0F5ED",
    borderColor: "#DCE1D7",
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cellFoundOpponent: {
    backgroundColor: "rgba(244, 63, 94, 0.35)",
    borderColor: "#DCE1D7",
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cellCheck: {
    position: "absolute",
    left: 4,
    bottom: 2,
    color: "#293541",
    fontSize: 9,
    fontWeight: "900",
  },
  cellCheckOpponent: {
    color: "#9c656c",
  },
  cellMissed: {
    backgroundColor: "rgba(239, 68, 68, 0.22)",
    borderColor: "#DCE1D7",
    borderWidth: 1.5,
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cellLetterMissed: {
    color: "#9c6666",
  },
  cellInspected: {
    borderColor: "#DCE1D7",
    borderWidth: 2.5,
    backgroundColor: "rgba(245, 158, 11, 0.3)",
    transform: [{ scale: 1.06 }],
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cellLetterInspected: {
    color: "#817a46",
  },
  cellCheckMissed: {
    position: "absolute",
    left: 4,
    bottom: 2,
    color: "#ed4343",
    fontSize: 10,
    fontWeight: "900",
  },
  previewCell: {
    backgroundColor: "#EDF4FC",
    borderColor: "#DCE1D7",
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  botPreviewCell: {
    backgroundColor: "#FFF0E8",
    borderColor: "#DCE1D7",
    shadowColor: "#293541",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cellTailBot: {
    borderColor: "#DCE1D7",
    borderWidth: 2,
    transform: [{ scale: 1.04 }],
  },
  cellOrderBot: {
    position: "absolute",
    top: 3,
    right: 4,
    color: "#293541",
    fontSize: 8,
    fontWeight: "900",
  },
});

BoardCell.displayName = "BoardCell";
