import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { ICONS } from "@/components/game-ui";
import { palette } from "@/shared/palette";

export type DockDestination = "store" | "missions" | "home" | "season" | "profile";

export function PremiumDock({
  active,
  onNavigate,
  missionsBadgeCount,
  storeBadgeCount,
}: {
  active: DockDestination;
  onNavigate: (destination: DockDestination) => void;
  missionsBadgeCount?: number;
  storeBadgeCount?: number;
}) {
  return (
    <View style={styles.dockWrap}>
      <LinearGradient colors={["#1E4A38", "#0A241C"]} style={styles.dock}>
        <DockTab
          emoji="🛒"
          label="MAĞAZA"
          active={active === "store"}
          badgeCount={storeBadgeCount}
          onPress={() => onNavigate("store")}
        />
        <DockTab
          emoji="📜"
          label="GÖREVLER"
          active={active === "missions"}
          badgeCount={missionsBadgeCount}
          onPress={() => onNavigate("missions")}
        />

        <Pressable onPress={() => onNavigate("home")} style={({ pressed }) => [styles.centerTab, pressed && styles.pressed]}>
          <View style={[styles.centerGem, active === "home" && styles.centerGemActive]}>
            <LinearGradient
              colors={active === "home" ? ["#FFF1B0", "#F0C24A", "#C48A1C"] : ["#2A5C48", "#12362B"]}
              style={styles.centerGemFill}
            >
              <Image source={ICONS.play} style={styles.centerIcon} />
            </LinearGradient>
          </View>
          <Text style={[styles.centerLabel, active === "home" && styles.centerLabelActive]}>OYNA</Text>
        </Pressable>

        <DockTab
          emoji="🏆"
          label="LİG"
          active={active === "season"}
          onPress={() => onNavigate("season")}
        />
        <DockTab
          emoji="👤"
          label="PROFİL"
          active={active === "profile"}
          onPress={() => onNavigate("profile")}
        />
      </LinearGradient>
    </View>
  );
}

function DockTab({
  emoji,
  label,
  active,
  onPress,
  badgeCount,
}: {
  emoji: string;
  label: string;
  active: boolean;
  onPress: () => void;
  badgeCount?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tab, active && styles.tabActive, pressed && styles.pressed]}
    >
      <View style={styles.iconBox}>
        <View style={[styles.iconBubble, active && styles.iconBubbleActive]}>
          <Text style={[styles.icon, active && styles.iconActive]}>{emoji}</Text>
        </View>
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dockWrap: {
    borderRadius: 28,
    borderWidth: 2.5,
    borderColor: palette.bronzeBorder,
    shadowColor: "#000",
    shadowOpacity: 0.55,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
    overflow: "visible",
  },
  dock: {
    height: 74,
    overflow: "visible",
    paddingHorizontal: 6,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    backgroundColor: "rgba(244, 208, 111, 0.12)",
  },
  iconBox: {
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  iconBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  iconBubbleActive: {
    backgroundColor: "rgba(244, 208, 111, 0.2)",
    borderWidth: 1,
    borderColor: palette.gold,
  },
  tabBadge: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: palette.danger,
    borderWidth: 1.5,
    borderColor: palette.cream,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    shadowColor: palette.danger,
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
    fontSize: 16,
    lineHeight: 20,
    opacity: 0.75,
  },
  iconActive: {
    opacity: 1,
    transform: [{ scale: 1.08 }],
  },
  label: {
    color: palette.muted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.2,
    marginTop: 3,
    textAlign: "center",
  },
  labelActive: {
    color: palette.goldHi,
  },
  centerTab: {
    flex: 1.2,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -18,
  },
  centerGem: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 3,
    borderColor: palette.bronzeDark,
    overflow: "hidden",
    shadowColor: palette.gold,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
  },
  centerGemActive: {
    borderColor: palette.goldHi,
    shadowOpacity: 0.85,
  },
  centerGemFill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centerIcon: {
    width: 42,
    height: 42,
  },
  centerLabel: {
    color: palette.mutedGold,
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.7,
    marginTop: 2,
  },
  centerLabelActive: {
    color: palette.goldHi,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
});
