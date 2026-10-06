import React from "react";
import { View, Text, Pressable } from "react-native";
import { APP_WORD_PALETTE } from "@/shared/solo";
import type { RoomStatus } from "@/shared/game";
import { styles } from "./pvp.styles";

const WORD_PALETTE = APP_WORD_PALETTE;

export type PvpFoundWordsPanelProps = {
  status: RoomStatus;
  wordsTotal: number;
  myFoundWords: { word: string; path: number[] }[];
  bonusWords?: string[];
  missedWords?: { word: string; path: number[] }[];
  inspectedPath: number[] | null;
  onInspectWord: (word: string, path: number[], color: string) => void;
};

export const PvpFoundWordsPanel = React.memo(({
  status,
  wordsTotal,
  myFoundWords,
  bonusWords,
  missedWords,
  inspectedPath,
  onInspectWord,
}: PvpFoundWordsPanelProps) => {
  return (
    <View style={styles.foundPanel}>
      <Text style={styles.foundLabel}>
        {status === "finished"
          ? "OYUNDAKİ TÜM KELİMELER (SÖZLÜK VE ROTA İÇİN DOKUN)"
          : "BULDUĞUN KELİMELER"}
      </Text>
      {status === "finished" && !inspectedPath && (
        <Text style={styles.routeExploreHint}>
          👆 Harflerin başlangıç ve bitiş oklarını tahtada görmek için bir kelimeye dokun.
        </Text>
      )}

      <View style={{ marginTop: 6 }}>
        <Text
          style={{
            color: "#219d8d",
            fontSize: 10,
            fontWeight: "800",
            letterSpacing: 0.5,
            marginBottom: 4,
          }}
        >
          ✓ BULDUKLARIN ({myFoundWords.length} / {wordsTotal})
        </Text>
        <View style={styles.foundTags}>
          {myFoundWords.length ? (
            myFoundWords.map((entry, index) => {
              const palette = WORD_PALETTE[index % WORD_PALETTE.length]!;
              return (
                <Pressable
                  key={`mine-${index}`}
                  onPress={() => {
                    onInspectWord(entry.word, entry.path, palette.border);
                  }}
                  style={({ pressed }) => [
                    styles.foundTag,
                    {
                      backgroundColor: palette.tagBg,
                      borderColor: palette.tagBorder,
                      borderWidth: 1.5,
                    },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={[styles.foundTagText, { color: palette.tagText }]}>
                    ✓ {entry.word}
                  </Text>
                </Pressable>
              );
            })
          ) : (
            <Text style={styles.foundEmpty}>Henüz ana kelime bulunmadı.</Text>
          )}
        </View>
      </View>

      {bonusWords && bonusWords.length > 0 && (
        <View style={{ marginTop: 8 }}>
          <Text
            style={{
              color: "#d97706",
              fontSize: 10,
              fontWeight: "900",
              letterSpacing: 0.5,
              marginBottom: 4,
            }}
          >
            ✨ GİZLİ BONUS KELİMELER ({bonusWords.length}) · +{bonusWords.length * 10} PUAN
          </Text>
          <View style={styles.foundTags}>
            {bonusWords.map((bWord, index) => (
              <View
                key={`bonus-${index}`}
                style={[
                  styles.foundTag,
                  {
                    backgroundColor: "#FEF3C7",
                    borderColor: "#F59E0B",
                    borderWidth: 1.5,
                  },
                ]}
              >
                <Text style={[styles.foundTagText, { color: "#92400E" }]}>
                  ✨ {bWord} (+10)
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {status === "finished" && missedWords && missedWords.length > 0 && (
        <View style={{ marginTop: 10 }}>
          <Text
            style={{
              color: "#bd5564",
              fontSize: 10,
              fontWeight: "800",
              letterSpacing: 0.5,
              marginBottom: 4,
            }}
          >
            ✗ BULAMADIĞIN KELİMELER ({missedWords.length})
          </Text>
          <View style={styles.foundTags}>
            {missedWords.map((entry, index) => {
              const colorIndex = (myFoundWords.length + index) % WORD_PALETTE.length;
              const palette = WORD_PALETTE[colorIndex]!;
              return (
                <Pressable
                  key={`missed-${index}`}
                  onPress={() => {
                    onInspectWord(entry.word, entry.path, palette.border);
                  }}
                  style={({ pressed }) => [
                    styles.foundTag,
                    {
                      backgroundColor: palette.tagBg,
                      borderColor: palette.tagBorder,
                      borderWidth: 1.5,
                      borderStyle: "dashed",
                    },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={[styles.foundTagMissedText, { color: palette.tagText }]}>
                    ✗ {entry.word}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
});

PvpFoundWordsPanel.displayName = "PvpFoundWordsPanel";
