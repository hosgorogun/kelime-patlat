import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { getSoloLevel, MAX_SOLO_LEVEL } from "@/shared/solo";

export function SoloLevels({ unlockedLevel, onBack, onSelect }: { unlockedLevel: number; onBack: () => void; onSelect: (level: number) => void }) {
  const levels = Array.from({ length: MAX_SOLO_LEVEL }, (_, index) => index + 1);
  const [selectedLevel, setSelectedLevel] = useState<number>(Math.min(unlockedLevel, MAX_SOLO_LEVEL));

  // Group levels into rows of 3 to build a serpentine grid path
  const gridRows: number[][] = [];
  for (let i = 0; i < MAX_SOLO_LEVEL; i += 3) {
    const chunk = levels.slice(i, i + 3);
    const rowIndex = i / 3;
    // serpentine path: reverse order on odd rows
    if (rowIndex % 2 !== 0) {
      chunk.reverse();
    }
    gridRows.push(chunk);
  }

  const selectedData = getSoloLevel(selectedLevel);
  const isSelectedLocked = selectedLevel > unlockedLevel;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View>
          <Text style={styles.overline}>TEKLİ OYUNCU · SİBER AĞ</Text>
          <Text style={styles.title}>OPERASYON MERKEZİ</Text>
        </View>
      </View>

      {/* Cyber Grid Map */}
      <Text style={styles.sectionTitle}>SİBER AĞ HARİTASI</Text>
      <View style={styles.gridContainer}>
        {gridRows.map((row, rowIndex) => {
          const isRowEven = rowIndex % 2 === 0;

          return (
            <View key={rowIndex} style={styles.gridRowWrap}>
              {/* Row connector line */}
              <View style={styles.rowConnector} />

              {/* Vertical connector down from the end of this row to the next row */}
              {rowIndex < gridRows.length - 1 && (
                <View
                  style={[
                    styles.verticalConnector,
                    isRowEven ? { right: 38 } : { left: 38 }
                  ]}
                />
              )}

              <View style={styles.gridRow}>
                {row.map((level) => {
                  const locked = level > unlockedLevel;
                  const current = level === unlockedLevel;
                  const completed = level < unlockedLevel;
                  const isChosen = level === selectedLevel;

                  return (
                    <View key={level} style={styles.nodeWrapper}>
                      <Pressable
                        onPress={() => setSelectedLevel(level)}
                        style={({ pressed }) => [
                          styles.nodeCircle,
                          completed && styles.nodeCompleted,
                          current && styles.nodeCurrent,
                          locked && styles.nodeLocked,
                          isChosen && styles.nodeSelected,
                          pressed && styles.pressed
                        ]}
                      >
                        <Text
                          style={[
                            styles.nodeText,
                            completed && styles.nodeTextCompleted,
                            current && styles.nodeTextCurrent,
                            locked && styles.nodeTextLocked,
                            isChosen && styles.nodeTextSelected
                          ]}
                        >
                          {locked ? "🔒" : level}
                        </Text>
                      </Pressable>
                      <Text style={[styles.nodeLabel, isChosen && styles.nodeLabelSelected, locked && styles.nodeLabelLocked]}>
                        N-{level}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>

      {/* Mission Control Deck (Selected Level Details Panel) */}
      <View style={styles.missionDeck}>
        <View style={styles.deckHead}>
          <View>
            <Text style={styles.deckKicker}>SEÇİLİ DÜĞÜM DETAYLARI</Text>
            <Text style={styles.deckTitle}>SEVİYE {selectedLevel}: {selectedData.title.toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, isSelectedLocked ? styles.badgeLocked : selectedLevel === unlockedLevel ? styles.badgeActive : styles.badgeCompleted]}>
            <Text style={styles.statusBadgeText}>
              {isSelectedLocked ? "KİLİTLİ" : selectedLevel === unlockedLevel ? "AKTİF" : "TAMAMLANDI"}
            </Text>
          </View>
        </View>

        <View style={styles.deckInfoRow}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>IZGARA BOYUTU</Text>
            <Text style={styles.infoValue}>{selectedData.size}×{selectedData.size}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>HEDEF KELİME</Text>
            <Text style={styles.infoValue}>{selectedData.wordCount}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>SÜRE SINIRI</Text>
            <Text style={styles.infoValue}>{selectedData.timeLimit} sn</Text>
          </View>
        </View>

        <Pressable
          disabled={isSelectedLocked}
          onPress={() => onSelect(selectedLevel)}
          style={({ pressed }) => [
            styles.launchButton,
            isSelectedLocked && styles.launchButtonLocked,
            pressed && !isSelectedLocked && styles.pressed
          ]}
        >
          <Text style={[styles.launchText, isSelectedLocked && styles.launchTextLocked]}>
            {isSelectedLocked ? "🔒 DÜĞÜM ERİŞİMİ ENGELLENDİ" : "SİBER AĞI BAĞLA (BAŞLAT)"}
          </Text>
          {!isSelectedLocked && <Text style={styles.launchArrow}>→</Text>}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 132, backgroundColor: "#0C091C", flexGrow: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  back: { width: 38, height: 38, borderRadius: 14, backgroundColor: "#1E1838", borderWidth: 1, borderColor: "rgba(124, 92, 246, 0.25)", alignItems: "center", justifyContent: "center" },
  backText: { color: "#FFF9FC", fontSize: 26, lineHeight: 28 },
  overline: { color: "#A78BFA", fontSize: 8, fontWeight: "900", letterSpacing: 1.1 },
  title: { color: "#FFF9FC", fontSize: 18, fontWeight: "900", marginTop: 2, letterSpacing: 0.5 },

  sectionTitle: { color: "#E9D5FF", fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginTop: 10, marginBottom: 16 },

  // Grid Map
  gridContainer: {
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  gridRowWrap: {
    position: "relative",
    marginBottom: 28,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
    zIndex: 10,
  },
  rowConnector: {
    position: "absolute",
    left: 40,
    right: 40,
    top: 25,
    height: 2,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "rgba(124, 92, 246, 0.45)",
    zIndex: 1,
  },
  verticalConnector: {
    position: "absolute",
    bottom: -32,
    width: 2,
    height: 32,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "rgba(124, 92, 246, 0.45)",
    zIndex: 1,
  },
  nodeWrapper: {
    alignItems: "center",
  },
  nodeCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#16122C",
    borderWidth: 2,
    borderColor: "#413461",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 5,
  },
  nodeCompleted: {
    backgroundColor: "rgba(80, 227, 194, 0.08)",
    borderColor: "#50E3C2",
    shadowColor: "#50E3C2",
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  nodeCurrent: {
    backgroundColor: "rgba(255, 194, 74, 0.1)",
    borderColor: "#FFC24A",
    shadowColor: "#FFC24A",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    transform: [{ scale: 1.05 }],
  },
  nodeSelected: {
    borderColor: "#00F5D4",
    borderWidth: 3,
    shadowColor: "#00F5D4",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    transform: [{ scale: 1.1 }],
  },
  nodeLocked: {
    backgroundColor: "#0A0716",
    borderColor: "#26203D",
    opacity: 0.6,
  },
  nodeText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#8FA4CF",
  },
  nodeTextCompleted: {
    color: "#50E3C2",
  },
  nodeTextCurrent: {
    color: "#FFC24A",
  },
  nodeTextSelected: {
    color: "#00F5D4",
  },
  nodeTextLocked: {
    fontSize: 12,
  },
  nodeLabel: {
    fontSize: 8,
    fontWeight: "900",
    color: "#E2E8F0",
    marginTop: 6,
    letterSpacing: 0.5,
  },
  nodeLabelSelected: {
    color: "#00F5D4",
  },
  nodeLabelLocked: {
    color: "#475569",
  },

  // Mission Deck Details Card
  missionDeck: {
    backgroundColor: "rgba(30, 24, 56, 0.75)",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(124, 92, 246, 0.35)",
    padding: 20,
    marginTop: 8,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.12,
    shadowRadius: 15,
    elevation: 6,
  },
  deckHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  deckKicker: {
    color: "#FFC24A",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  deckTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 4,
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeLocked: {
    backgroundColor: "#1E1B2C",
    borderColor: "#4A455E",
  },
  badgeActive: {
    backgroundColor: "#2C2216",
    borderColor: "#FFC24A",
  },
  badgeCompleted: {
    backgroundColor: "#172A25",
    borderColor: "#50E3C2",
  },
  statusBadgeText: {
    fontSize: 7,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.6,
  },
  deckInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(12, 8, 37, 0.4)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(124, 92, 246, 0.15)",
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  infoCol: {
    flex: 1,
    alignItems: "center",
  },
  infoLabel: {
    color: "#94A3B8",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  infoValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 4,
  },
  infoDivider: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(124, 92, 246, 0.2)",
  },
  launchButton: {
    height: 48,
    borderRadius: 16,
    backgroundColor: "#00F5D4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#00F5D4",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  launchButtonLocked: {
    backgroundColor: "rgba(33, 26, 61, 0.6)",
    borderColor: "rgba(87, 69, 141, 0.2)",
    borderWidth: 1.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  launchText: {
    color: "#080612",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  launchTextLocked: {
    color: "#4B445E",
  },
  launchArrow: {
    color: "#080612",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 22,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },
});
