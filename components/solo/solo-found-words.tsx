import React from "react";
import { View, Text, Pressable } from "react-native";
import { APP_WORD_PALETTE } from "@/shared/solo";
import { styles } from "./solo-challenge.styles";

export type SoloFoundWordsProps = {
  found: string[];
  bonusWords?: string[];
  foundPaths: number[][];
  challengeRoutes: Record<string, number[]>;
  activeTheme: {
    trayBackground: string;
    cellBorder: string;
    headerText: string;
  };
  onInspectWord: (word: string, path: number[] | null, color: string) => void;
};

export const SoloFoundWords = React.memo(({
  found,
  bonusWords,
  foundPaths,
  challengeRoutes,
  activeTheme,
  onInspectWord,
}: SoloFoundWordsProps) => {
  return (
    <View style={[styles.found, { backgroundColor: activeTheme.trayBackground, borderColor: activeTheme.cellBorder }]}>
      <Text style={[styles.foundLabel, { color: activeTheme.headerText }]}>
        BULDUKLARIN (ROTA VE SÖZLÜK İÇİN TIKLA)
      </Text>
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
          <Text style={styles.empty}>İlk kelimeyi bul.</Text>
        )}
      </View>

      {bonusWords && bonusWords.length > 0 && (
        <View style={{ marginTop: 8 }}>
          <Text style={[styles.foundLabel, { color: "#d97706", fontSize: 9.5, fontWeight: "900" }]}>
            ✨ GİZLİ BONUS KELİMELER ({bonusWords.length})
          </Text>
          <View style={styles.tags}>
            {bonusWords.map((bWord) => (
              <View
                key={`solo-bonus-${bWord}`}
                style={[
                  styles.tag,
                  {
                    backgroundColor: "#FEF3C7",
                    borderColor: "#F59E0B",
                    borderWidth: 1.5,
                  },
                ]}
              >
                <Text style={[styles.tagText, { color: "#92400E" }]}>✨ {bWord}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
});

SoloFoundWords.displayName = "SoloFoundWords";
