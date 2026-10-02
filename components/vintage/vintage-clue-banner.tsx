import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { triggerHapticSelection } from "@/shared/audio-haptics";
import type { PlacedWord } from "@/shared/puzzle-generator";
import { vintageStyles as styles } from "./vintage.styles";

export function VintageClueBanner({
  activeWordItem,
  solvedWordIds,
  completedCount,
  totalCount,
  placementDirection,
  onSelectDirection,
  words,
  selectedWordId,
  onSelectWord,
}: {
  activeWordItem?: PlacedWord;
  solvedWordIds: Set<string>;
  completedCount: number;
  totalCount: number;
  placementDirection: "horizontal" | "vertical";
  onSelectDirection: (dir: "horizontal" | "vertical") => void;
  words?: PlacedWord[];
  selectedWordId: string | null;
  onSelectWord: (w: PlacedWord) => void;
}) {
  return (
    <>
      {/* Aktif Seçili İpucu Kartı */}
      {activeWordItem ? (
        <View style={[styles.activeClueBannerCard, solvedWordIds.has(activeWordItem.id) && styles.activeClueBannerCardSolved]}>
          <View style={styles.activeClueBadgeRow}>
            <Text style={[styles.activeClueBadgeTag, solvedWordIds.has(activeWordItem.id) && styles.activeClueBadgeTagSolved]}>
              {solvedWordIds.has(activeWordItem.id)
                ? `✓ ÇÖZÜLDÜ: ${activeWordItem.answer}`
                : activeWordItem.isCenter
                ? "⭐ ANKOR: MERKEZ KELİME"
                : `İPUCU (${completedCount}/${totalCount})`}
            </Text>
            <Text style={styles.activeClueLengthText}>{activeWordItem.length} HARF</Text>
            <View style={styles.dirRowCompactInline}>
              <Pressable
                onPress={() => onSelectDirection("horizontal")}
                style={[styles.dirBtnMini, placementDirection === "horizontal" && styles.dirBtnActive]}
              >
                <Text style={[styles.dirBtnTextMini, placementDirection === "horizontal" && styles.dirBtnTextActive]}>↔ YATAY</Text>
              </Pressable>
              <Pressable
                onPress={() => onSelectDirection("vertical")}
                style={[styles.dirBtnMini, placementDirection === "vertical" && styles.dirBtnActive]}
              >
                <Text style={[styles.dirBtnTextMini, placementDirection === "vertical" && styles.dirBtnTextActive]}>↕ DİKEY</Text>
              </Pressable>
            </View>
          </View>
          <Text numberOfLines={2} style={styles.activeClueText}>{`"${activeWordItem.clue}"`}</Text>
        </View>
      ) : (
        <View style={styles.activeClueBannerCardEmpty}>
          <Text style={styles.emptyClueText}>İpuçlarından birine veya tahtadan bir hücreye dokunun.</Text>
        </View>
      )}

      {/* Yatay İpucu Çubuğu */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalTargetList}>
        {words?.map((w) => {
          const isSolved = solvedWordIds.has(w.id);
          const isSelected = selectedWordId === w.id;

          return (
            <Pressable
              key={w.id}
              onPress={() => {
                triggerHapticSelection();
                onSelectWord(w);
              }}
              style={[
                styles.targetChipHorizontal,
                w.isCenter && styles.targetChipCenterWord,
                isSolved && styles.targetChipCompleted,
                isSelected && styles.targetChipSelected,
              ]}
            >
              <Text style={[styles.targetWordText, isSolved && styles.targetWordTextCompleted]}>
                {w.isCenter ? `⭐ ` : ""}{isSolved ? `✓ ${w.answer}` : `❓ ${w.length} HARF`}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </>
  );
}
