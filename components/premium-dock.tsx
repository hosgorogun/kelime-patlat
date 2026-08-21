import { Pressable, StyleSheet, Text, View } from "react-native";

export type DockDestination = "home" | "profile";

export function PremiumDock({ active, onNavigate }: { active: DockDestination; onNavigate: (destination: DockDestination) => void }) {
  return <View style={styles.wrap}>
    <View style={[styles.glow, { left: "15%" }]} />
    <View style={[styles.glow, { right: "15%", left: "auto" as unknown as number }]} />
    <View style={styles.dock}>
      <Pressable onPress={() => onNavigate("home")} style={({ pressed }) => [styles.home, active === "home" && styles.homeActive, pressed && styles.pressed]}>
        <Text style={[styles.homeGlyph, active === "home" && styles.homeGlyphActive]}>⌂</Text>
        <Text style={[styles.homeLabel, active === "home" && styles.homeLabelActive]}>ANA</Text>
      </Pressable>
      <DockTab glyph="◈" label="PROFİL" active={active === "profile"} onPress={() => onNavigate("profile")} />
    </View>
  </View>;
}

function DockTab({ glyph, label, active, onPress }: { glyph: string; label: string; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.tab}><Text style={[styles.glyph, active && styles.glyphActive]}>{glyph}</Text><Text style={[styles.label, active && styles.labelActive]}>{label}</Text>{active && <View style={styles.dot} />}</Pressable>;
}

const styles = StyleSheet.create({
  wrap: { height: 106, marginTop: 22, paddingHorizontal: 2, justifyContent: "flex-end" },
  glow: { position: "absolute", width: 120, height: 55, bottom: 12, borderRadius: 40, backgroundColor: "#7C3AED", opacity: 0.18, shadowColor: "#7C3AED", shadowOpacity: 0.4, shadowRadius: 12, elevation: 10 },
  dock: { height: 72, borderRadius: 26, paddingHorizontal: 28, backgroundColor: "rgba(24, 21, 43, 0.93)", borderWidth: 1, borderColor: "rgba(93, 74, 144, 0.4)", flexDirection: "row", alignItems: "center", justifyContent: "space-around", shadowColor: "#000", shadowOpacity: 0.45, shadowRadius: 10, elevation: 8 },
  tab: { minWidth: 54, height: 58, alignItems: "center", justifyContent: "center" },
  glyph: { color: "#A8B3D0", fontSize: 20, fontWeight: "700", lineHeight: 20 }, glyphActive: { color: "#2DD4BF", shadowColor: "#2DD4BF", shadowOpacity: 0.5, shadowRadius: 4 },
  label: { color: "#A8B3D0", fontSize: 8, fontWeight: "900", letterSpacing: 0.6, marginTop: 4 }, labelActive: { color: "#2DD4BF" }, dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#2DD4BF", marginTop: 3 },
  home: { width: 74, height: 74, marginTop: -32, borderRadius: 37, backgroundColor: "#7C3AED", borderWidth: 4, borderColor: "#121025", alignItems: "center", justifyContent: "center", shadowColor: "#7C3AED", shadowOpacity: 0.65, shadowRadius: 16, elevation: 12 },
  homeActive: { backgroundColor: "#8B5CF6", shadowColor: "#8B5CF6", shadowOpacity: 0.85, shadowRadius: 20, elevation: 16 },
  homeGlyph: { color: "#EDE9FE", fontSize: 25, lineHeight: 25, fontWeight: "900" },
  homeGlyphActive: { color: "#FFFFFF" },
  homeLabel: { color: "#C4B5FD", fontSize: 9, fontWeight: "900", letterSpacing: 0.8, marginTop: 2 },
  homeLabelActive: { color: "#FFFFFF" },
  pressed: { opacity: 0.82, transform: [{ scale: 0.96 }] },
});
