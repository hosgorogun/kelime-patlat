import { Pressable, StyleSheet, Text, View } from "react-native";

export type DockDestination = "store" | "missions" | "home" | "season" | "profile";

export function PremiumDock({
  active,
  onNavigate,
  missionsBadgeCount,
}: {
  active: DockDestination;
  onNavigate: (destination: DockDestination) => void;
  missionsBadgeCount?: number;
}) {
  return (
    <View style={styles.dock}>
      {/* 1. Mağaza */}
      <DockTab
        icon="🛒"
        label="MAĞAZA"
        active={active === "store"}
        onPress={() => onNavigate("store")}
      />

      {/* 2. Görevler */}
      <DockTab
        icon="⚡"
        label="GÖREVLER"
        active={active === "missions"}
        badgeCount={missionsBadgeCount}
        onPress={() => onNavigate("missions")}
      />

      {/* 3. Ana Merkez: Oyna */}
      <Pressable
        onPress={() => onNavigate("home")}
        style={({ pressed }) => [styles.centerTab, pressed && styles.pressed]}
      >
        <View style={[styles.centerPill, active === "home" && styles.centerPillActive]}>
          <Text style={styles.centerIcon}>{active === "home" ? "🎮" : "⌂"}</Text>
        </View>
        <Text style={[styles.centerLabel, active === "home" && styles.centerLabelActive]}>
          OYNA
        </Text>
      </Pressable>

      {/* 4. Liderlik & Arkadaşlık */}
      <DockTab
        icon="🏆"
        label="LİDER & ARKADAŞ"
        active={active === "season"}
        onPress={() => onNavigate("season")}
      />

      {/* 5. Profil */}
      <DockTab
        icon="👤"
        label="PROFİL"
        active={active === "profile"}
        onPress={() => onNavigate("profile")}
      />
    </View>
  );
}

function DockTab({
  icon,
  label,
  active,
  onPress,
  badgeCount,
}: {
  icon: string;
  label: string;
  active: boolean;
  onPress: () => void;
  badgeCount?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tab,
        active && styles.tabActive,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.iconBox}>
        <Text style={[styles.icon, active && styles.iconActive]}>{icon}</Text>
        {badgeCount !== undefined && badgeCount > 0 && (
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>{badgeCount > 9 ? "9+" : badgeCount}</Text>
          </View>
        )}
      </View>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
        style={[styles.label, active && styles.labelActive]}
      >
        {label}
      </Text>
      <View style={[styles.dot, active && styles.dotActive]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dock: {
    height: 68,
    borderRadius: 24,
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: "rgba(18, 14, 38, 0.96)",
    borderWidth: 1.5,
    borderColor: "rgba(124, 92, 246, 0.35)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 12,
  },
  tab: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 2,
  },
  tabActive: {
    backgroundColor: "rgba(0, 245, 212, 0.09)",
  },
  iconBox: {
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  tabBadge: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    shadowColor: "#EF4444",
    shadowOpacity: 0.85,
    shadowRadius: 6,
    elevation: 6,
  },
  tabBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    lineHeight: 11,
    textAlign: "center",
  },
  icon: {
    fontSize: 17,
    lineHeight: 20,
    opacity: 0.7,
  },
  iconActive: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  label: {
    color: "#8E82A8",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.15,
    marginTop: 2,
    textAlign: "center",
  },
  labelActive: {
    color: "#00F5D4",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "transparent",
    marginTop: 2,
  },
  dotActive: {
    backgroundColor: "#00F5D4",
    shadowColor: "#00F5D4",
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 4,
  },
  centerTab: {
    flex: 1.15,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
  },
  centerPill: {
    width: 46,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(109, 40, 217, 0.4)",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  centerPillActive: {
    backgroundColor: "#7C3AED",
    borderColor: "#00F5D4",
    borderWidth: 1.5,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.85,
    shadowRadius: 10,
    elevation: 8,
  },
  centerIcon: {
    fontSize: 16,
    lineHeight: 18,
  },
  centerLabel: {
    color: "#C4B5FD",
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.6,
    marginTop: 2,
  },
  centerLabelActive: {
    color: "#FFFFFF",
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
});
