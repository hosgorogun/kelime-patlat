import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { badgesFor, type PlayerProgress } from "@/shared/progression";

export function BadgesPanel({ progress, onBack }: { progress: PlayerProgress; onBack: () => void }) {
  const list = badgesFor(progress);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View>
          <Text style={styles.kicker}>PROFİL DETAYLARI</Text>
          <Text style={styles.title}>ROZETLER VE BAŞARIMLAR</Text>
        </View>
      </View>

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[styles.card, !item.unlocked && styles.cardLocked]}>
            <View style={[styles.iconBox, { backgroundColor: item.unlocked ? item.accent : "#3A354E" }]}>
              <Text style={styles.icon}>{item.icon}</Text>
            </View>
            <View style={styles.info}>
              <Text style={[styles.itemTitle, !item.unlocked && styles.textLocked]}>{item.title}</Text>
              <Text style={styles.itemDesc}>{item.description}</Text>
            </View>
            <View style={styles.status}>
              <Text style={[styles.statusText, item.unlocked ? { color: item.accent } : styles.statusLocked]}>
                {item.unlocked ? "AÇIK" : "KİLİTLİ"}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0C091C", paddingHorizontal: 14, paddingTop: 12 },
  header: { height: 56, flexDirection: "row", alignItems: "center", marginBottom: 14 },
  backButton: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#211A3D", alignItems: "center", justifyContent: "center", marginRight: 12 },
  backText: { color: "#FFF9FC", fontSize: 26, lineHeight: 26 },
  kicker: { color: "#8FA4CF", fontSize: 8, fontWeight: "900", letterSpacing: 0.9 },
  title: { color: "#FFF9FC", fontSize: 14, fontWeight: "900", marginTop: 2 },
  listContent: { paddingBottom: 24, gap: 10 },
  card: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 16, backgroundColor: "#1A1530", borderWidth: 1, borderColor: "#30264D" },
  cardLocked: { opacity: 0.5 },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  icon: { color: "#0C091C", fontSize: 20, fontWeight: "900" },
  info: { flex: 1, marginLeft: 12 },
  itemTitle: { color: "#FFF9FC", fontSize: 13, fontWeight: "900" },
  textLocked: { color: "#B8ADD1" },
  itemDesc: { color: "#8FA4CF", fontSize: 10, marginTop: 2 },
  status: { paddingHorizontal: 8 },
  statusText: { fontSize: 9, fontWeight: "900" },
  statusLocked: { color: "#5F5877" }
});
