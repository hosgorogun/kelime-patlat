import React from "react";
import { Text, Pressable } from "react-native";
import { vintageStyles as styles } from "./vintage.styles";

export interface PoolTile {
  id: string;
  letter: string;
}

export type LetterTileItemProps = {
  tile: PoolTile;
  onPressTile: (tile: PoolTile) => void;
};

export const LetterTileItem = React.memo(
  ({
    tile,
    onPressTile,
  }: LetterTileItemProps) => {
    return (
      <Pressable
        onPress={() => onPressTile(tile)}
        style={({ pressed }) => [styles.letterTile, pressed && styles.letterTilePressed]}
      >
        <Text style={styles.letterTileText}>{tile.letter}</Text>
      </Pressable>
    );
  }
);

LetterTileItem.displayName = "LetterTileItem";
