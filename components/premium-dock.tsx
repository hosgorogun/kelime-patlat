import { Pressable, StyleSheet, Text, View } from "react-native";

export type DockDestination = "home" | "modes" | "online" | "profile";

export function PremiumDock({ active, onNavigate }: { active: DockDestination; onNavigate: (destination: DockDestination) => void }) {
  return <View style={styles.wrap}>
    <View style={styles.glow} />
    <View style={styles.dock}>
      <DockTab glyph="⌂" label="ANA" active={active === "home"} onPress={() => onNavigate("home")} />
      <DockTab glyph="⌁" label="ODA" active={active === "online"} onPress={() => onNavigate("online")} />
      <Pressable onPress={() => onNavigate("modes")} style={({ pressed }) => [styles.play, pressed && styles.pressed]}><Text style={styles.playGlyph}>✦</Text><Text style={styles.playLabel}>OYNA</Text></Pressable>
      <DockTab glyph="◈" label="PROFİL" active={active === "profile"} onPress={() => onNavigate("profile")} />
    </View>
  </View>;
}

function DockTab({ glyph, label, active, onPress }: { glyph: string; label: string; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.tab}><Text style={[styles.glyph, active && styles.glyphActive]}>{glyph}</Text><Text style={[styles.label, active && styles.labelActive]}>{label}</Text>{active && <View style={styles.dot} />}</Pressable>;
}

const styles = StyleSheet.create({
  wrap: { height: 106, marginTop: 22, paddingHorizontal: 2, justifyContent: "flex-end" },
  glow: { position: "absolute", width: 140, height: 60, alignSelf: "center", bottom: 12, borderRadius: 40, backgroundColor: "#2DD4BF", opacity: 0.18, shadowColor: "#2DD4BF", shadowOpacity: 0.4, shadowRadius: 10, elevation: 12 },
  dock: { height: 72, borderRadius: 26, paddingHorizontal: 16, backgroundColor: "#18152B", borderWidth: 1.5, borderColor: "#3D3460", flexDirection: "row", alignItems: "center", justifyContent: "space-between", shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 8, elevation: 8 },
  tab: { minWidth: 54, height: 58, alignItems: "center", justifyContent: "center" },
  glyph: { color: "#A8B3D0", fontSize: 20, fontWeight: "700", lineHeight: 20 }, glyphActive: { color: "#2DD4BF" },
  label: { color: "#A8B3D0", fontSize: 8, fontWeight: "900", letterSpacing: 0.6, marginTop: 4 }, labelActive: { color: "#2DD4BF" }, dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#2DD4BF", marginTop: 3 },
  play: { width: 74, height: 74, marginTop: -32, borderRadius: 26, backgroundColor: "#2DD4BF", borderWidth: 4, borderColor: "#121025", alignItems: "center", justifyContent: "center", shadowColor: "#2DD4BF", shadowOpacity: 0.45, shadowRadius: 12, elevation: 12 },
  playGlyph: { color: "#08121E", fontSize: 25, lineHeight: 25, fontWeight: "900" }, playLabel: { color: "#08121E", fontSize: 9, fontWeight: "900", letterSpacing: 0.8, marginTop: 2 }, pressed: { opacity: 0.82, transform: [{ scale: 0.96 }] },
});
