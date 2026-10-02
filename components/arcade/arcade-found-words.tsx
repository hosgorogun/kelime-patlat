import React from "react";
import { View, Text, Pressable } from "react-native";
import { APP_WORD_PALETTE } from "@/shared/solo";
import { styles } from "./arcade.styles";

export type ArcadeFoundWordsProps = {
  status: "playing" | "lost";
  found: string[];
  foundPaths: number[][];
  missedWords: string[];
  challengeRoutes: Record<string, number[]>;
  onInspectWord: (word: string, path: number[] | null, color: string) => void;
};

export const ArcadeFoundWords = React.memo(({
  status,
  found,
  foundPaths,
  missedWords,
  challengeRoutes,
  onInspectWord,
}: ArcadeFoundWordsProps) => {
  return (
    <View style={styles.found}>
      <Text style={styles.foundLabel}>BULDUĞUN KELİMELER (ROTA VE SÖZLÜK İÇİN TIKLA)</Text>
      <View style={styles.tags}>
        {found.length ? (
          found.map((word, index) => {
            const palette = APP_WORD_PALETTE[index % APP_WORD_PALETTE.length]!;
            const path = foundPaths[index] ?? challengeRoutes[word];
            return (
              <Pressable
                key={word}
                onPress={() => {
                  onInspectWord(word, path || null, palette.border);
                }}
                style={({ pressed }) => [
                  styles.tag,
                  {
                    backgroundColor: palette.tagBg,
                    borderColor: palette.tagBorder,
                    borderWidth: 1.5,
                  },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[styles.tagText, { color: palette.tagText }]}>✓ {word}</Text>
              </Pressable>
            );
          })
        ) : (
          <Text style={styles.empty}>Henüz kelime bulunmadı.</Text>
        )}
      </View>

      {status === "lost" && (
        <>
          <Text style={[styles.foundLabel, { marginTop: 14, color: "#ca4f62" }]}>
            KAÇIRILAN KELİMELER (ROTA VE SÖZLÜK İÇİN TIKLA)
          </Text>
          <View style={styles.tags}>
            {missedWords.length > 0 ? (
              missedWords.map((word, index) => {
                const colorIndex = (found.length + index) % APP_WORD_PALETTE.length;
                const palette = APP_WORD_PALETTE[colorIndex]!;
                const path = challengeRoutes[word];
                return (
                  <Pressable
                    key={word}
                    onPress={() => {
                      onInspectWord(word, path || null, palette.border);
                    }}
                    style={({ pressed }) => [
                      styles.tag,
                      {
                        backgroundColor: palette.tagBg,
                        borderWidth: 1.5,
                        borderColor: palette.tagBorder,
                        borderStyle: "dashed",
                      },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Text style={[styles.tagText, { color: palette.tagText }]}>✗ {word}</Text>
                  </Pressable>
                );
              })
            ) : (
              <Text style={[styles.empty, { color: "#349d5a" }]}>Harika! Tüm kelimeleri buldun!</Text>
            )}
          </View>
        </>
      )}
    </View>
  );
});

ArcadeFoundWords.displayName = "ArcadeFoundWords";
