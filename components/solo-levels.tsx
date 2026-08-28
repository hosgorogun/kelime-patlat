import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { getSoloLevel, MAX_SOLO_LEVEL } from "@/shared/solo";

export function SoloLevels({ unlockedLevel, onBack, onSelect }: { unlockedLevel: number; onBack: () => void; onSelect: (level: number) => void }) {
  const levels = Array.from({ length: MAX_SOLO_LEVEL }, (_, index) => index + 1);
  // Reverse to put Level 1 at the bottom (climbing up is standard for map paths)
  const reversedLevels = [...levels].reverse();

  return <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><Pressable onPress={onBack} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable><View><Text style={styles.overline}>TEKLİ OYUNCU · SEVİYE YOLU</Text><Text style={styles.title}>KELİME SEFERİ</Text></View></View>
    <View style={styles.hero}><Text style={styles.heroKicker}>SONRAKİ HEDEF</Text><Text style={styles.heroTitle}>SEVİYE {unlockedLevel}</Text><Text style={styles.heroCopy}>Her seviye daha kısa süre, daha çok kelime ve daha kıvrımlı rotalar getirir.</Text><Pressable onPress={() => onSelect(unlockedLevel)} style={styles.continue}><Text style={styles.continueText}>DEVAM ET</Text><Text style={styles.continueArrow}>→</Text></Pressable></View>
    
    <Text style={styles.section}>MACERA HARİTASI</Text>
    
    <View style={styles.mapContainer}>
      {/* Central dotted vertical trail line */}
      <View style={styles.trailConnector} />

      {levels.map((level) => {
        const item = getSoloLevel(level);
        const locked = level > unlockedLevel;
        const current = level === unlockedLevel;
        const completed = level < unlockedLevel;

        // Alternating layouts: Level 1 is left, Level 2 is right, etc.
        const isLeft = level % 2 !== 0;

        return (
          <View
            key={level}
            style={[
              styles.row,
              isLeft ? styles.rowLeft : styles.rowRight
            ]}
          >
            {/* Winding Level Circle Node */}
            <Pressable
              disabled={locked}
              onPress={() => onSelect(level)}
              style={({ pressed }) => [
                styles.nodeCircle,
                completed && styles.nodeCompleted,
                current && styles.nodeCurrent,
                locked && styles.nodeLocked,
                pressed && styles.pressed
              ]}
            >
              <Text
                style={[
                  styles.nodeNumber,
                  completed && styles.nodeNumberCompleted,
                  current && styles.nodeNumberCurrent,
                  locked && styles.nodeNumberLocked
                ]}
              >
                {locked ? "🔒" : level.toString().padStart(2, "0")}
              </Text>
            </Pressable>

            {/* Level Information Card beside the Node */}
            <View
              style={[
                styles.infoCard,
                completed && styles.infoCardCompleted,
                current && styles.infoCardCurrent,
                locked && styles.infoCardLocked
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, locked && styles.cardTextLocked]}>{item.title}</Text>
                {completed && <Text style={styles.doneBadge}>TAMAMLANDI ✓</Text>}
                {current && <Text style={styles.activeBadge}>AKTİF HEDEF</Text>}
              </View>
              <Text style={[styles.cardMeta, locked && styles.cardTextLocked]}>
                Tahta: {item.size}×{item.size}  ·  {item.wordCount} Kelime
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 132, flexGrow: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 11 },
  back: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#211A3D", alignItems: "center", justifyContent: "center" },
  backText: { color: "#FFF9FC", fontSize: 30, lineHeight: 32 },
  overline: { color: "#E9D5FF", fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  title: { color: "#FFF9FC", fontSize: 20, fontWeight: "900", marginTop: 2 },
  hero: { marginTop: 20, padding: 19, borderRadius: 23, backgroundColor: "#4A2443", borderWidth: 1, borderColor: "#E4638B" },
  heroKicker: { color: "#FFC24A", fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  heroTitle: { color: "#FFF9FC", fontSize: 30, fontWeight: "900", marginTop: 7 },
  heroTitleLocked: { color: "#8E889C" },
  heroCopy: { color: "#F0D6E2", fontSize: 12, lineHeight: 18, marginTop: 8 },
  continue: { height: 45, marginTop: 16, paddingHorizontal: 14, borderRadius: 14, backgroundColor: "#FF647C", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  continueText: { color: "#35152A", fontSize: 11, fontWeight: "900", letterSpacing: 0.8 },
  continueArrow: { color: "#35152A", fontSize: 21, fontWeight: "800" },
  section: { color: "#E9D5FF", fontSize: 9, fontWeight: "900", letterSpacing: 1.1, marginTop: 22, marginBottom: 9 },
  
  // Map layouts
  mapContainer: {
    position: "relative",
    paddingVertical: 10,
    gap: 20,
  },
  trailConnector: {
    position: "absolute",
    top: 30,
    bottom: 30,
    left: "50%",
    width: 2,
    marginLeft: -1,
    borderStyle: "dashed",
    borderWidth: 1.5,
    borderColor: "#7C3AED",
    opacity: 0.7,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 10,
    gap: 16,
  },
  rowLeft: {
    justifyContent: "flex-start",
  },
  rowRight: {
    justifyContent: "flex-start",
    flexDirection: "row-reverse",
  },
  nodeCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#2B2251",
    borderWidth: 2,
    borderColor: "#7E65D4",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  nodeCompleted: {
    backgroundColor: "#1B3A33",
    borderColor: "#50E3C2",
  },
  nodeCurrent: {
    backgroundColor: "#4E3A1D",
    borderColor: "#FFC24A",
    borderWidth: 3,
    transform: [{ scale: 1.08 }],
    shadowColor: "#FFC24A",
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  nodeLocked: {
    backgroundColor: "#16122C",
    borderColor: "#3E345D",
    opacity: 0.7,
  },
  nodeNumber: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFF9FC",
  },
  nodeNumberCompleted: {
    color: "#50E3C2",
  },
  nodeNumberCurrent: {
    color: "#FFC24A",
  },
  nodeNumberLocked: {
    fontSize: 14,
  },
  infoCard: {
    flex: 1,
    backgroundColor: "#221B41",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#3F3472",
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  infoCardCompleted: {
    borderColor: "#285248",
    backgroundColor: "#152420",
  },
  infoCardCurrent: {
    borderColor: "#685028",
    backgroundColor: "#2C2012",
  },
  infoCardLocked: {
    borderColor: "#201A39",
    backgroundColor: "#17132D",
    opacity: 0.65,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  cardTextLocked: {
    color: "#746B8C",
  },
  cardMeta: {
    fontSize: 9,
    fontWeight: "800",
    color: "#E9D5FF",
  },
  doneBadge: {
    fontSize: 7,
    fontWeight: "900",
    color: "#50E3C2",
    letterSpacing: 0.4,
  },
  activeBadge: {
    fontSize: 7,
    fontWeight: "900",
    color: "#FFC24A",
    letterSpacing: 0.4,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
});
